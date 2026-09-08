"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/auth/session";
import type { AuthActionState } from "@/lib/auth/actions";
import type { Database } from "@/types/database";
import {
  buildSpecialWorshipOccurrences,
  buildWorshipOccurrences,
  validateSpecialWorshipRange,
  validateMonthRange,
  type WorshipSpecialType,
} from "./schedule";

type WorshipServiceInsert =
  Database["public"]["Tables"]["worship_services"]["Insert"];

export async function generateWorshipServicesAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await requireAdminUser();

  const year = Number(readString(formData, "year"));
  const startMonth = Number(readString(formData, "startMonth"));
  const endMonth = Number(readString(formData, "endMonth") || startMonth);
  const validationError = validateMonthRange({ year, startMonth, endMonth });

  if (validationError) {
    return { message: validationError };
  }

  const supabase = createAdminSupabaseClient();
  const { data: churches, error: churchesError } = await supabase
    .from("churches")
    .select("id")
    .eq("active", true)
    .is("deleted_at", null);

  if (churchesError) {
    return { message: "Não foi possível buscar as igrejas ativas." };
  }

  if (!churches || churches.length === 0) {
    return { message: "Cadastre pelo menos uma igreja ativa antes de gerar cultos." };
  }

  const occurrences = buildWorshipOccurrences({ year, startMonth, endMonth });
  const startDate = occurrences[0]?.serviceDate;
  const endDate = occurrences[occurrences.length - 1]?.serviceDate;

  if (!startDate || !endDate) {
    return { message: "Nenhum culto encontrado para o período informado." };
  }

  const churchIds = churches.map((church) => church.id);
  const { data: existingServices, error: existingError } = await supabase
    .from("worship_services")
    .select("church_id,service_date,service_type")
    .in("church_id", churchIds)
    .gte("service_date", startDate)
    .lte("service_date", endDate)
    .is("deleted_at", null);

  if (existingError) {
    return { message: "Não foi possível verificar cultos já gerados." };
  }

  const existingKeys = new Set(
    (existingServices ?? []).map(
      (service) =>
        `${service.church_id}:${service.service_date}:${service.service_type}`,
    ),
  );
  const rows: WorshipServiceInsert[] = [];

  for (const church of churches) {
    for (const occurrence of occurrences) {
      const key = `${church.id}:${occurrence.serviceDate}:${occurrence.serviceType}`;

      if (!existingKeys.has(key)) {
        rows.push({
          church_id: church.id,
          service_date: occurrence.serviceDate,
          service_type: occurrence.serviceType,
          start_time: occurrence.startTime,
          end_time: occurrence.endTime,
        });
      }
    }
  }

  if (rows.length === 0) {
    return { ok: true, message: "Os cultos desse período já estavam gerados." };
  }

  const { error: insertError } = await supabase.from("worship_services").insert(rows);

  if (insertError) {
    return { message: "Não foi possível gerar os cultos." };
  }

  revalidatePath("/admin/cultos");

  return {
    ok: true,
    message: `${rows.length} culto(s) gerado(s) com sucesso.`,
  };
}

export async function createSpecialWorshipServicesAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await requireAdminUser();

  const churchId = readString(formData, "churchId");
  const title = readString(formData, "title");
  const specialType = readString(formData, "specialType");
  const startDate = readString(formData, "startDate");
  const endDate = readString(formData, "endDate") || startDate;
  const startTime = readString(formData, "startTime") || "19:45";
  const endTime = readString(formData, "endTime") || "21:00";

  if (!churchId) {
    return { message: "Selecione a igreja do culto especial." };
  }

  const validationError = validateSpecialWorshipRange({
    title,
    specialType,
    startDate,
    endDate,
    startTime,
    endTime,
  });

  if (validationError) {
    return { message: validationError };
  }

  const supabase = createAdminSupabaseClient();
  const { data: church } = await supabase
    .from("churches")
    .select("id")
    .eq("id", churchId)
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!church) {
    return { message: "Igreja ativa não localizada." };
  }

  const occurrences = buildSpecialWorshipOccurrences({
    title,
    specialType: specialType as WorshipSpecialType,
    startDate,
    endDate,
    startTime,
    endTime,
  });
  const { data: existingServices, error: existingError } = await supabase
    .from("worship_services")
    .select("service_date,start_time,title")
    .eq("church_id", churchId)
    .eq("service_type", "especial")
    .gte("service_date", startDate)
    .lte("service_date", endDate)
    .is("deleted_at", null);

  if (existingError) {
    return { message: "Não foi possível verificar cultos especiais existentes." };
  }

  const existingKeys = new Set(
    (existingServices ?? []).map(
      (service) => `${service.service_date}:${formatTime(service.start_time)}:${service.title}`,
    ),
  );
  const rows: WorshipServiceInsert[] = occurrences
    .filter(
      (occurrence) =>
        !existingKeys.has(
          `${occurrence.serviceDate}:${occurrence.startTime}:${occurrence.title}`,
        ),
    )
    .map((occurrence) => ({
      church_id: churchId,
      service_date: occurrence.serviceDate,
      service_type: "especial",
      special_type: occurrence.specialType,
      is_special: true,
      title: occurrence.title,
      start_time: occurrence.startTime,
      end_time: occurrence.endTime,
    }));

  if (rows.length === 0) {
    return {
      ok: true,
      message: "Esse culto especial já estava criado para o período informado.",
    };
  }

  const { error: insertError } = await supabase.from("worship_services").insert(rows);

  if (insertError) {
    return { message: "Não foi possível criar o culto especial." };
  }

  revalidatePath("/admin/cultos");

  return {
    ok: true,
    message: `${rows.length} culto(s) especial(is) criado(s) com sucesso.`,
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formatTime(value: string) {
  return value.slice(0, 5);
}
