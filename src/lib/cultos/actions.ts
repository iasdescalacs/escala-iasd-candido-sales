"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/auth/session";
import type { AuthActionState } from "@/lib/auth/actions";
import type { Database } from "@/types/database";
import {
  buildWorshipOccurrences,
  validateMonthRange,
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

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
