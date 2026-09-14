"use server";

import { revalidatePath } from "next/cache";
import type { AuthActionState } from "@/lib/auth/actions";
import { requireApprovedUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  isMusicalFormationStatus,
  isMusicalFormationType,
  validateFormationMemberCount,
} from "./rules";

export async function saveMusicalFormationAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const profile = await requireApprovedUser();
  const formationId = readUuid(formData, "formationId");
  const name = readString(formData, "name");
  const formationType = readString(formData, "formationType");
  const homeChurchId = readUuid(formData, "homeChurchId");
  const memberIds = readUuidList(formData, "memberIds");
  const responsibleIds = readUuidList(formData, "responsibleIds");
  const churchIds = readUuidList(formData, "churchIds");
  const requestedStatus = readString(formData, "status");

  if (
    !name ||
    name.length < 3 ||
    name.length > 100 ||
    !isMusicalFormationType(formationType) ||
    !homeChurchId
  ) {
    return { message: "Informe nome, tipo e igreja de origem da formação." };
  }

  const memberCountError = validateFormationMemberCount(
    formationType,
    memberIds.length,
  );

  if (memberCountError) {
    return { message: memberCountError };
  }

  if (
    responsibleIds.length === 0 ||
    responsibleIds.some((responsibleId) => !memberIds.includes(responsibleId))
  ) {
    return { message: "Escolha ao menos um responsável entre os integrantes." };
  }

  const status = isMusicalFormationStatus(requestedStatus)
    ? requestedStatus
    : null;
  const admin = createAdminSupabaseClient();
  const { error } = await admin.rpc("save_musical_formation", {
    actor_id: profile.appUser.id,
    target_church_ids: churchIds,
    target_formation_id: formationId,
    target_home_church_id: homeChurchId,
    target_member_ids: memberIds,
    target_name: name,
    target_responsible_ids: responsibleIds,
    target_status: status,
    target_type: formationType,
  });

  if (error) {
    console.error("Falha ao salvar formação musical", {
      code: error.code,
      message: error.message,
    });

    if (error.code === "23505") {
      return { message: "Já existe uma formação com esse nome nessa igreja." };
    }

    return { message: mapFormationError(error.message) };
  }

  revalidateFormationPaths();
  return {
    ok: true,
    message: formationId
      ? "Formação atualizada com sucesso."
      : "Formação criada com sucesso.",
  };
}

export async function saveMusicalFormationAvailabilityAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const profile = await requireApprovedUser();
  const formationId = readUuid(formData, "formationId");
  const periodStart = readDate(formData, "periodStart");
  const periodEnd = readDate(formData, "periodEnd");
  const serviceIds = readUuidList(formData, "serviceIds");

  if (!formationId || !periodStart || !periodEnd) {
    return { message: "Formação ou mês de disponibilidade inválido." };
  }

  const admin = createAdminSupabaseClient();
  const { data: selectedCount, error } = await admin.rpc(
    "set_musical_formation_availability",
    {
      actor_id: profile.appUser.id,
      period_end: periodEnd,
      period_start: periodStart,
      selected_service_ids: serviceIds,
      target_formation_id: formationId,
    },
  );

  if (error) {
    console.error("Falha ao salvar disponibilidade da formação", {
      code: error.code,
      message: error.message,
    });
    return { message: mapFormationError(error.message) };
  }

  revalidateFormationPaths();
  return {
    ok: true,
    message:
      String(Number(selectedCount ?? 0)) +
      " culto(s) marcado(s) como disponível(is).",
  };
}

function revalidateFormationPaths() {
  revalidatePath("/formacoes");
  revalidatePath("/escalas/louvor");
  revalidatePath("/agenda");
  revalidatePath("/painel");
}

function mapFormationError(message: string) {
  const knownMessages = [
    "Informe um nome",
    "Igreja de origem",
    "Uma dupla",
    "Um trio",
    "Um grupo",
    "Escolha ao menos",
    "Todos os integrantes",
    "Uma ou mais igrejas",
    "Voce nao tem permissao",
    "A formacao precisa",
    "Um ou mais cultos",
  ];
  const known = knownMessages.find((candidate) => message.includes(candidate));

  if (known) {
    return message
      .replace("Voce", "Você")
      .replaceAll("formacao", "formação")
      .replaceAll("nao", "não")
      .replaceAll("permissao", "permissão");
  }

  return "Não foi possível concluir a alteração da formação.";
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readUuid(formData: FormData, key: string) {
  const value = readString(formData, key);
  return isUuid(value) ? value : null;
}

function readUuidList(formData: FormData, key: string) {
  return Array.from(
    new Set(
      formData
        .getAll(key)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(isUuid),
    ),
  );
}

function readDate(formData: FormData, key: string) {
  const value = readString(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
