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

const worshipServiceDependentPaths = [
  "/admin/cultos",
  "/agenda",
  "/disponibilidade",
  "/escalas/louvor",
  "/escalas/pregacao",
  "/painel",
];

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
    .select("church_id,service_date,start_time")
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
        `${service.church_id}:${service.service_date}:${formatTime(service.start_time)}`,
    ),
  );
  const rows: WorshipServiceInsert[] = [];

  for (const church of churches) {
    for (const occurrence of occurrences) {
      const key = `${church.id}:${occurrence.serviceDate}:${occurrence.startTime}`;

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

  revalidateWorshipServicePaths();

  return {
    ok: true,
    message: `${rows.length} culto(s) gerado(s) com sucesso.`,
  };
}

export async function createSpecialWorshipServicesAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const adminProfile = await requireAdminUser();

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
  const { data: processedServices, error } = await supabase.rpc(
    "replace_special_worship_services",
    {
      actor_id: adminProfile.appUser.id,
      target_church_id: churchId,
      service_rows: occurrences.map((occurrence) => ({
        service_date: occurrence.serviceDate,
        special_type: occurrence.specialType,
        title: occurrence.title,
        start_time: occurrence.startTime,
        end_time: occurrence.endTime,
      })),
    },
  );

  if (error) {
    console.error("Falha ao criar ou substituir culto especial", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });

    return { message: "Não foi possível criar o culto especial." };
  }

  revalidateWorshipServicePaths();

  const total = Number(processedServices ?? 0);

  return {
    ok: true,
    message:
      total === 1
        ? "1 culto especial foi criado ou substituído com sucesso."
        : `${total} cultos especiais foram criados ou substituídos com sucesso.`,
  };
}

export async function deleteWorshipServiceAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _state;

  const adminProfile = await requireAdminUser();
  const serviceId = readString(formData, "serviceId");

  if (!isUuid(serviceId)) {
    return { message: "Culto inválido. Atualize a página e tente novamente." };
  }

  const supabase = createAdminSupabaseClient();
  const { data: deleted, error } = await supabase.rpc("delete_worship_service", {
    actor_id: adminProfile.appUser.id,
    target_service_id: serviceId,
  });

  if (error) {
    console.error("Falha ao excluir culto", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });

    return { message: "Não foi possível excluir o culto." };
  }

  if (!deleted) {
    return { message: "O culto não existe mais ou já foi excluído." };
  }

  revalidateWorshipServicePaths();

  return { ok: true, message: "Culto excluído com sucesso." };
}

export async function updateWorshipServiceAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _state;

  const adminProfile = await requireAdminUser();
  const serviceId = readString(formData, "serviceId");
  const startTime = readString(formData, "startTime");
  const endTime = readString(formData, "endTime");
  const isSpecial = readString(formData, "isSpecial") === "true";
  const title = readString(formData, "title");
  const specialType = readString(formData, "specialType");
  const notes = readString(formData, "notes");

  if (!isUuid(serviceId)) {
    return { message: "Culto inválido. Atualize a página e tente novamente." };
  }

  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return { message: "Informe horários válidos para início e término." };
  }

  if (endTime <= startTime) {
    return { message: "O horário de término deve ser posterior ao início." };
  }

  if (notes.length > 500) {
    return { message: "As observações devem ter no máximo 500 caracteres." };
  }

  if (isSpecial) {
    if (!title) {
      return { message: "Informe o nome do culto especial." };
    }

    if (title.length > 120) {
      return { message: "O nome do culto deve ter no máximo 120 caracteres." };
    }

    if (!isWorshipSpecialType(specialType)) {
      return { message: "Selecione um tipo válido de culto especial." };
    }
  }

  const supabase = createAdminSupabaseClient();
  const { data: updated, error } = await supabase.rpc("update_worship_service", {
    actor_id: adminProfile.appUser.id,
    target_service_id: serviceId,
    target_start_time: startTime,
    target_end_time: endTime,
    target_title: title || null,
    target_special_type: isWorshipSpecialType(specialType) ? specialType : null,
    target_notes: notes || null,
  });

  if (error) {
    console.error("Falha ao editar culto", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });

    return {
      message: error.message.includes("mesma data e horario")
        ? "Já existe outro culto desta igreja na mesma data e horário."
        : "Não foi possível salvar as alterações do culto.",
    };
  }

  if (!updated) {
    return { message: "O culto não existe mais ou já foi excluído." };
  }

  revalidateWorshipServicePaths();

  return { ok: true, message: "Culto atualizado com sucesso." };
}

export async function clearAllWorshipServicesAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _state;

  const adminProfile = await requireAdminUser();

  if (readString(formData, "confirmation") !== "delete-all") {
    return { message: "Confirmação inválida. Nenhum dado foi removido." };
  }

  const supabase = createAdminSupabaseClient();
  const { data: deletedServices, error } = await supabase.rpc(
    "clear_all_worship_services",
    { actor_id: adminProfile.appUser.id, dry_run: false },
  );

  if (error) {
    console.error("Falha ao limpar cultos", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });

    return {
      message: error.message.startsWith("Falha ao limpar cultos na etapa")
        ? error.message
        : "Não foi possível excluir os cultos e as escalas.",
    };
  }

  revalidateWorshipServicePaths();

  const total = Number(deletedServices ?? 0);

  return {
    ok: true,
    message:
      total === 1
        ? "1 culto e sua escala foram excluídos com sucesso."
        : `${total} cultos e suas escalas foram excluídos com sucesso.`,
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isWorshipSpecialType(value: string): value is WorshipSpecialType {
  return [
    "semana_oracao",
    "mini_semana_oracao",
    "culto_gratidao",
    "culto_virada",
    "outro",
  ].includes(value);
}

function revalidateWorshipServicePaths() {
  for (const path of worshipServiceDependentPaths) {
    revalidatePath(path);
  }
}
