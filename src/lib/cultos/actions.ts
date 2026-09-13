"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/auth/session";
import type { AuthActionState } from "@/lib/auth/actions";
import { requireWorshipManager } from "./access";
import {
  buildSpecialWorshipOccurrences,
  buildWorshipOccurrences,
  validateSpecialWorshipRange,
  validateMonthRange,
  type WorshipSpecialType,
} from "./schedule";

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
  const supabase = createAdminSupabaseClient();
  const management = await requireWorshipManager(supabase);

  const year = Number(readString(formData, "year"));
  const startMonth = Number(readString(formData, "startMonth"));
  const endMonth = Number(readString(formData, "endMonth") || startMonth);
  const requestedChurchId = readString(formData, "churchId") || "todas";
  const validationError = validateMonthRange({ year, startMonth, endMonth });

  if (validationError) {
    return { message: validationError };
  }

  const activeChurchIds = management.activeChurches.map((church) => church.id);

  if (
    requestedChurchId !== "todas" &&
    !activeChurchIds.includes(requestedChurchId)
  ) {
    return { message: "Essa igreja não está vinculada ao seu perfil de gestão." };
  }

  const churchIds =
    requestedChurchId === "todas" ? activeChurchIds : [requestedChurchId];

  if (churchIds.length === 0) {
    return { message: "Nenhuma igreja ativa está disponível para gerar cultos." };
  }

  const occurrences = buildWorshipOccurrences({ year, startMonth, endMonth });

  if (occurrences.length === 0) {
    return { message: "Nenhum culto encontrado para o período informado." };
  }

  const { data: insertedServices, error } = await supabase.rpc(
    "generate_worship_services",
    {
      actor_id: management.profile.appUser.id,
      target_church_ids: churchIds,
      service_rows: occurrences.map((occurrence) => ({
        service_date: occurrence.serviceDate,
        service_type: occurrence.serviceType,
        start_time: occurrence.startTime,
        end_time: occurrence.endTime,
      })),
    },
  );

  if (error) {
    console.error("Falha ao gerar cultos", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });

    return { message: "Não foi possível gerar os cultos." };
  }

  const total = Number(insertedServices ?? 0);

  if (total === 0) {
    return { ok: true, message: "Os cultos desse período já estavam gerados." };
  }

  revalidateWorshipServicePaths();

  return {
    ok: true,
    message: `${total} culto(s) gerado(s) com sucesso.`,
  };
}

export async function createSpecialWorshipServicesAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const supabase = createAdminSupabaseClient();
  const management = await requireWorshipManager(supabase);

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

  if (!management.activeChurches.some((church) => church.id === churchId)) {
    return { message: "Essa igreja não está vinculada ao seu perfil de gestão." };
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
      actor_id: management.profile.appUser.id,
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

  const supabase = createAdminSupabaseClient();
  const management = await requireWorshipManager(supabase);
  const serviceId = readString(formData, "serviceId");

  if (!isUuid(serviceId)) {
    return { message: "Culto inválido. Atualize a página e tente novamente." };
  }

  if (!(await canManageWorshipService(supabase, management.churchIds, serviceId))) {
    return { message: "Culto não localizado ou fora das suas igrejas vinculadas." };
  }

  const { data: deleted, error } = await supabase.rpc("delete_worship_service", {
    actor_id: management.profile.appUser.id,
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

  const supabase = createAdminSupabaseClient();
  const management = await requireWorshipManager(supabase);
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

  if (!(await canManageWorshipService(supabase, management.churchIds, serviceId))) {
    return { message: "Culto não localizado ou fora das suas igrejas vinculadas." };
  }

  const { data: updated, error } = await supabase.rpc("update_worship_service", {
    actor_id: management.profile.appUser.id,
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function canManageWorshipService(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  churchIds: string[],
  serviceId: string,
) {
  if (churchIds.length === 0) {
    return false;
  }

  const { data: service } = await supabase
    .from("worship_services")
    .select("church_id")
    .eq("id", serviceId)
    .in("church_id", churchIds)
    .is("deleted_at", null)
    .maybeSingle();

  return Boolean(service);
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
