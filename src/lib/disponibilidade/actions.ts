"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireApprovedUser } from "@/lib/auth/session";
import type { AuthActionState } from "@/lib/auth/actions";
import type { Database } from "@/types/database";
import {
  buildAvailabilitySlots,
  isAvailabilityRoleKey,
  normalizeSelectedSlots,
  validateAvailabilityMonth,
} from "./rules";

type AvailabilityInsert =
  Database["public"]["Tables"]["user_availability"]["Insert"];

export async function saveAvailabilityAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const profile = await requireApprovedUser();
  const roleKey = readString(formData, "roleKey");
  const monthStart = readString(formData, "monthStart");
  const monthEnd = readString(formData, "monthEnd");
  const selectedChurchIds = readStringList(formData, "churchIds");
  const selectedSlots = readStringList(formData, "availableSlots");
  const validationError = validateAvailabilityMonth({ monthStart, monthEnd });

  if (validationError) {
    return { message: validationError };
  }

  if (!isAvailabilityRoleKey(roleKey)) {
    return { message: "Função de disponibilidade inválida." };
  }

  if (!profile.roles.some((role) => role.key === roleKey)) {
    return { message: "Essa função não está vinculada ao seu cadastro." };
  }

  const admin = createAdminSupabaseClient();
  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("key", roleKey)
    .is("deleted_at", null)
    .maybeSingle();

  if (!role) {
    return { message: "Função não localizada." };
  }

  const [
    { data: serviceRows, error: serviceError },
    { data: activeChurches, error: churchesError },
  ] = await Promise.all([
    admin
      .from("worship_services")
      .select("id,church_id,service_date,is_special")
      .gte("service_date", monthStart)
      .lte("service_date", monthEnd)
      .is("deleted_at", null),
    admin
      .from("churches")
      .select("id")
      .eq("active", true)
      .is("deleted_at", null),
  ]);

  if (serviceError) {
    return { message: "Não foi possível buscar os cultos do mês." };
  }

  if (churchesError) {
    return { message: "Não foi possível buscar as igrejas." };
  }

  const activeChurchIds = new Set((activeChurches ?? []).map((church) => church.id));
  const validChurchIds = Array.from(
    new Set(selectedChurchIds.filter((churchId) => activeChurchIds.has(churchId))),
  );
  const allowedSlots = buildAvailabilitySlots({
    services: serviceRows ?? [],
    selectedChurchIds: validChurchIds,
  });
  const availableSlots = normalizeSelectedSlots({
    selectedSlots,
    allowedSlots,
  });
  const allowedSlotsByKey = new Map(allowedSlots.map((slot) => [slot.key, slot]));
  const { error: deleteAvailabilityError } = await admin
    .from("user_availability")
    .delete()
    .eq("user_id", profile.appUser.id)
    .eq("role_id", role.id)
    .gte("service_date", monthStart)
    .lte("service_date", monthEnd);

  if (deleteAvailabilityError) {
    return { message: "Não foi possível limpar a disponibilidade anterior." };
  }

  if (availableSlots.length > 0) {
    const rows: AvailabilityInsert[] = availableSlots.flatMap((slotKey) => {
      const slot = allowedSlotsByKey.get(slotKey);

      return slot
        ? [{
            user_id: profile.appUser.id,
            role_id: role.id,
            service_date: slot.serviceDate,
            worship_service_id: slot.worshipServiceId,
            available: true,
          }]
        : [];
    });
    const { error: insertAvailabilityError } = await admin
      .from("user_availability")
      .insert(rows);

    if (insertAvailabilityError) {
      return { message: "Não foi possível salvar os cultos disponíveis." };
    }
  }

  const churchError = await updateChurchAvailability({
    admin,
    userId: profile.appUser.id,
    roleId: role.id,
    roleKey,
    selectedChurchIds: validChurchIds,
  });

  if (churchError) {
    return { message: churchError };
  }

  revalidatePath("/disponibilidade");

  return { ok: true, message: "Disponibilidade salva com sucesso." };
}

async function updateChurchAvailability({
  admin,
  userId,
  roleId,
  roleKey,
  selectedChurchIds,
}: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  roleId: string;
  roleKey: "pregador" | "cantor";
  selectedChurchIds: string[];
}) {
  const selected = new Set(selectedChurchIds);
  const { data: existingLinks, error: linksError } = await admin
    .from("user_church_links")
    .select("id,church_id")
    .eq("user_id", userId)
    .eq("role_id", roleId)
    .is("deleted_at", null);

  if (linksError) {
    return "Não foi possível buscar os vínculos com igrejas.";
  }

  const existingChurchIds = new Set(
    (existingLinks ?? []).map((link) => link.church_id),
  );

  for (const link of existingLinks ?? []) {
    const { error } = await admin
      .from("user_church_links")
      .update({
        can_be_scheduled: selected.has(link.church_id),
        is_manager: false,
      })
      .eq("id", link.id);

    if (error) {
      return "Não foi possível atualizar uma igreja da disponibilidade.";
    }
  }

  const newLinks = Array.from(selected)
    .filter((churchId) => !existingChurchIds.has(churchId))
    .map((churchId) => ({
      user_id: userId,
      church_id: churchId,
      role_id: roleId,
      can_be_scheduled: true,
      is_manager: false,
      notes:
        roleKey === "pregador"
          ? "Disponível para escala de pregação."
          : "Disponível para escala de música.",
    }));

  if (newLinks.length > 0) {
    const { error } = await admin.from("user_church_links").insert(newLinks);

    if (error) {
      return "Não foi possível vincular novas igrejas.";
    }
  }

  return null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}
