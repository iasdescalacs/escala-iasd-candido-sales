"use server";

import { revalidatePath } from "next/cache";
import type { AuthActionState } from "@/lib/auth/actions";
import { requireApprovedUser } from "@/lib/auth/session";
import { hasVolunteerDateConflict } from "@/lib/escalas/rules";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RoleKey = "pregador" | "cantor";
type SwapStatus = Database["public"]["Enums"]["swap_request_status"];

export async function assignScheduleAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const profile = await requireApprovedUser();
  const serviceId = readString(formData, "serviceId");
  const roleKey = readScheduleRole(formData);
  const userId = readString(formData, "userId");

  if (!serviceId || !roleKey || !userId) {
    return { message: "Selecione uma pessoa disponível para salvar a escala." };
  }

  const admin = createAdminSupabaseClient();
  const context = await canManageService({
    admin,
    managerUserId: profile.appUser.id,
    managerRoles: profile.roles.map((role) => role.key),
    serviceId,
    roleKey,
  });

  if (!context.allowed) {
    return { message: context.message };
  }

  const volunteer = await getAvailableVolunteer({
    admin,
    userId,
    roleId: context.roleId,
    churchId: context.service.church_id,
    serviceDate: context.service.service_date,
  });

  if (!volunteer) {
    return { message: "Essa pessoa não está disponível para essa igreja e data." };
  }

  const hasConflict = await volunteerHasConflictOnDate({
    admin,
    currentServiceId: serviceId,
    roleKey,
    serviceDate: context.service.service_date,
    userId: volunteer.id,
  });

  if (hasConflict) {
    return {
      message:
        "Essa pessoa já está escalada nesse dia em outro culto. Escolha outro voluntário disponível.",
    };
  }

  const updatePayload =
    roleKey === "pregador"
      ? { preacher_user_id: volunteer.id, preacher_name: volunteer.full_name }
      : { singer_user_id: volunteer.id, singer_name: volunteer.full_name };
  const previousUserId =
    roleKey === "pregador"
      ? context.service.preacher_user_id
      : context.service.singer_user_id;
  const { error } = await admin
    .from("worship_services")
    .update(updatePayload)
    .eq("id", serviceId)
    .is("deleted_at", null);

  if (error) {
    return { message: "Não foi possível salvar a escala." };
  }

  await notifyUsers(admin, {
    userIds: [volunteer.id, previousUserId].filter(Boolean) as string[],
    title: "Escala atualizada",
    body: `${roleKey === "pregador" ? "Pregação" : "Louvor"} em ${formatDate(context.service.service_date)} foi atualizado.`,
    metadata: { serviceId, roleKey },
  });

  revalidateSchedule(roleKey);
  return { ok: true, message: "Escala salva com sucesso." };
}

export async function clearScheduleAction(formData: FormData) {
  const profile = await requireApprovedUser();
  const serviceId = readString(formData, "serviceId");
  const roleKey = readScheduleRole(formData);

  if (!serviceId || !roleKey) {
    return;
  }

  const admin = createAdminSupabaseClient();
  const context = await canManageService({
    admin,
    managerUserId: profile.appUser.id,
    managerRoles: profile.roles.map((role) => role.key),
    serviceId,
    roleKey,
  });

  if (!context.allowed) {
    return;
  }

  const previousUserId =
    roleKey === "pregador"
      ? context.service.preacher_user_id
      : context.service.singer_user_id;
  const updatePayload =
    roleKey === "pregador"
      ? { preacher_user_id: null, preacher_name: null }
      : { singer_user_id: null, singer_name: null };
  await admin
    .from("worship_services")
    .update(updatePayload)
    .eq("id", serviceId)
    .is("deleted_at", null);

  if (previousUserId) {
    await notifyUsers(admin, {
      userIds: [previousUserId],
      title: "Escala removida",
      body: `${roleKey === "pregador" ? "Pregação" : "Louvor"} em ${formatDate(context.service.service_date)} foi removido da sua agenda.`,
      metadata: { serviceId, roleKey },
    });
  }

  revalidateSchedule(roleKey);
}

export async function requestSwapAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const profile = await requireApprovedUser();
  const sourceServiceId = readString(formData, "sourceServiceId");
  const targetServiceId = readString(formData, "targetServiceId");
  const roleKey = readScheduleRole(formData);
  const reason = readString(formData, "reason");

  if (!sourceServiceId || !targetServiceId || !roleKey) {
    return { message: "Escolha a escala que deseja permutar." };
  }

  const admin = createAdminSupabaseClient();
  const { data: services } = await admin
    .from("worship_services")
    .select("id,church_id,service_date,preacher_user_id,singer_user_id")
    .in("id", [sourceServiceId, targetServiceId])
    .is("deleted_at", null);

  const sourceService = services?.find((service) => service.id === sourceServiceId);
  const targetService = services?.find((service) => service.id === targetServiceId);

  if (!sourceService || !targetService) {
    return { message: "Culto da permuta não localizado." };
  }

  const sourceUserId =
    roleKey === "pregador" ? sourceService.preacher_user_id : sourceService.singer_user_id;
  const targetUserId =
    roleKey === "pregador" ? targetService.preacher_user_id : targetService.singer_user_id;

  if (sourceUserId !== profile.appUser.id || !targetUserId || targetUserId === profile.appUser.id) {
    return { message: "A permuta precisa envolver uma escala sua e outra pessoa escalada." };
  }

  const { data: existing } = await admin
    .from("swap_requests")
    .select("id")
    .eq("source_service_id", sourceServiceId)
    .eq("target_service_id", targetServiceId)
    .eq("role_key", roleKey)
    .eq("status", "pending")
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return { message: "Já existe uma solicitação pendente para essa permuta." };
  }

  const { data: request, error } = await admin
    .from("swap_requests")
    .insert({
      requester_user_id: profile.appUser.id,
      target_user_id: targetUserId,
      source_service_id: sourceServiceId,
      target_service_id: targetServiceId,
      role_key: roleKey,
      reason: reason || null,
    })
    .select("id")
    .single();

  if (error || !request) {
    return { message: "Não foi possível solicitar a permuta." };
  }

  const approverIds = await getApproverIds(admin, {
    roleKey,
    churchIds: [sourceService.church_id, targetService.church_id],
  });
  await notifyUsers(admin, {
    userIds: [targetUserId, ...approverIds],
    title: "Permuta solicitada",
    body: `${profile.appUser.full_name} solicitou permuta de ${roleKey === "pregador" ? "pregação" : "louvor"}.`,
    metadata: { swapRequestId: request.id, roleKey },
  });

  revalidatePath("/agenda");
  revalidateSchedule(roleKey);
  return { ok: true, message: "Permuta solicitada com sucesso." };
}

export async function reviewSwapRequestAction(formData: FormData) {
  const profile = await requireApprovedUser();
  const requestId = readString(formData, "requestId");
  const decision = readString(formData, "decision") as SwapStatus;

  if (!requestId || !["approved", "rejected"].includes(decision)) {
    return;
  }

  const admin = createAdminSupabaseClient();
  const { data: request } = await admin
    .from("swap_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .is("deleted_at", null)
    .maybeSingle();

  if (!request || (request.role_key !== "pregador" && request.role_key !== "cantor")) {
    return;
  }

  const sourceContext = await canManageService({
    admin,
    managerUserId: profile.appUser.id,
    managerRoles: profile.roles.map((role) => role.key),
    serviceId: request.source_service_id,
    roleKey: request.role_key,
  });
  const targetContext = sourceContext.allowed
    ? sourceContext
    : await canManageService({
        admin,
        managerUserId: profile.appUser.id,
        managerRoles: profile.roles.map((role) => role.key),
        serviceId: request.target_service_id,
        roleKey: request.role_key,
      });

  if (!targetContext.allowed) {
    return;
  }

  if (decision === "approved") {
    const { data: services } = await admin
      .from("worship_services")
      .select("id,service_date,preacher_user_id,preacher_name,singer_user_id,singer_name")
      .in("id", [request.source_service_id, request.target_service_id])
      .is("deleted_at", null);
    const source = services?.find((service) => service.id === request.source_service_id);
    const target = services?.find((service) => service.id === request.target_service_id);

    if (!source || !target) {
      return;
    }

    const sourceUserId =
      request.role_key === "pregador" ? source.preacher_user_id : source.singer_user_id;
    const targetUserId =
      request.role_key === "pregador" ? target.preacher_user_id : target.singer_user_id;

    const [sourceConflict, targetConflict] = await Promise.all([
      targetUserId
        ? volunteerHasConflictOnDate({
            admin,
            currentServiceId: source.id,
            excludedServiceIds: [target.id],
            roleKey: request.role_key,
            serviceDate: source.service_date,
            userId: targetUserId,
          })
        : false,
      sourceUserId
        ? volunteerHasConflictOnDate({
            admin,
            currentServiceId: target.id,
            excludedServiceIds: [source.id],
            roleKey: request.role_key,
            serviceDate: target.service_date,
            userId: sourceUserId,
          })
        : false,
    ]);

    if (sourceConflict || targetConflict) {
      await admin
        .from("swap_requests")
        .update({
          status: "rejected",
          decided_by_user_id: profile.appUser.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      await notifyUsers(admin, {
        userIds: [request.requester_user_id, request.target_user_id],
        title: "Permuta recusada",
        body: "A permuta foi recusada porque uma pessoa já está escalada em outro culto no mesmo dia.",
        metadata: { swapRequestId: request.id, roleKey: request.role_key },
      });

      revalidatePath("/agenda");
      revalidateSchedule(request.role_key);
      return;
    }

    if (request.role_key === "pregador") {
      await admin
        .from("worship_services")
        .update({
          preacher_user_id: target.preacher_user_id,
          preacher_name: target.preacher_name,
        })
        .eq("id", source.id);
      await admin
        .from("worship_services")
        .update({
          preacher_user_id: source.preacher_user_id,
          preacher_name: source.preacher_name,
        })
        .eq("id", target.id);
    } else {
      await admin
        .from("worship_services")
        .update({
          singer_user_id: target.singer_user_id,
          singer_name: target.singer_name,
        })
        .eq("id", source.id);
      await admin
        .from("worship_services")
        .update({
          singer_user_id: source.singer_user_id,
          singer_name: source.singer_name,
        })
        .eq("id", target.id);
    }
  }

  await admin
    .from("swap_requests")
    .update({
      status: decision,
      decided_by_user_id: profile.appUser.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", request.id);

  await notifyUsers(admin, {
    userIds: [request.requester_user_id, request.target_user_id],
    title: decision === "approved" ? "Permuta aprovada" : "Permuta recusada",
    body:
      decision === "approved"
        ? "Sua solicitação de permuta foi aprovada."
        : "Sua solicitação de permuta foi recusada.",
    metadata: { swapRequestId: request.id, roleKey: request.role_key },
  });

  revalidatePath("/agenda");
  revalidateSchedule(request.role_key);
}

export async function clearAgendaNotificationsAction() {
  const profile = await requireApprovedUser();

  if (!profile.roles.some((role) => role.key === "admin")) {
    return;
  }

  const admin = createAdminSupabaseClient();
  await admin
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
      status: "archived",
    })
    .eq("user_id", profile.appUser.id)
    .neq("status", "archived")
    .is("deleted_at", null);

  revalidatePath("/agenda");
}

export async function clearAgendaSwapRequestsAction() {
  const profile = await requireApprovedUser();

  if (!profile.roles.some((role) => role.key === "admin")) {
    return;
  }

  const admin = createAdminSupabaseClient();
  await admin
    .from("swap_requests")
    .update({ deleted_at: new Date().toISOString() })
    .or(`requester_user_id.eq.${profile.appUser.id},target_user_id.eq.${profile.appUser.id}`)
    .is("deleted_at", null);

  revalidatePath("/agenda");
  revalidatePath("/painel");
  revalidatePath("/escalas/pregacao");
  revalidatePath("/escalas/louvor");
}

async function canManageService({
  admin,
  managerUserId,
  managerRoles,
  serviceId,
  roleKey,
}: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  managerUserId: string;
  managerRoles: string[];
  serviceId: string;
  roleKey: RoleKey;
}): Promise<
  | { allowed: true; service: ServiceContext; roleId: string }
  | { allowed: false; message: string }
> {
  const requiredRole = roleKey === "pregador" ? "anciao" : "lider_musica";

  if (!managerRoles.includes("admin") && !managerRoles.includes(requiredRole)) {
    return { allowed: false, message: "Você não tem permissão para gerenciar essa escala." };
  }

  const [{ data: service }, { data: role }] = await Promise.all([
    admin
      .from("worship_services")
      .select("id,church_id,service_date,preacher_user_id,singer_user_id")
      .eq("id", serviceId)
      .is("deleted_at", null)
      .maybeSingle(),
    admin.from("roles").select("id").eq("key", roleKey).is("deleted_at", null).maybeSingle(),
  ]);

  if (!service || !role) {
    return { allowed: false, message: "Culto ou função não localizado." };
  }

  if (managerRoles.includes("admin")) {
    return { allowed: true, service, roleId: role.id };
  }

  const { data: managerRole } = await admin
    .from("roles")
    .select("id")
    .eq("key", requiredRole)
    .is("deleted_at", null)
    .maybeSingle();

  if (!managerRole) {
    return { allowed: false, message: "Função gerencial não localizada." };
  }

  const { data: link } = await admin
    .from("user_church_links")
    .select("id")
    .eq("user_id", managerUserId)
    .eq("church_id", service.church_id)
    .eq("role_id", managerRole.id)
    .eq("is_manager", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!link) {
    return { allowed: false, message: "Essa igreja não está vinculada ao seu perfil gerencial." };
  }

  return { allowed: true, service, roleId: role.id };
}

async function getAvailableVolunteer({
  admin,
  userId,
  roleId,
  churchId,
  serviceDate,
}: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  roleId: string;
  churchId: string;
  serviceDate: string;
}) {
  const [{ data: user }, { data: availability }, { data: churchLink }] = await Promise.all([
    admin
      .from("users")
      .select("id,full_name,status")
      .eq("id", userId)
      .eq("status", "approved")
      .is("deleted_at", null)
      .maybeSingle(),
    admin
      .from("user_availability")
      .select("id")
      .eq("user_id", userId)
      .eq("role_id", roleId)
      .eq("service_date", serviceDate)
      .eq("available", true)
      .is("deleted_at", null)
      .maybeSingle(),
    admin
      .from("user_church_links")
      .select("id")
      .eq("user_id", userId)
      .eq("church_id", churchId)
      .eq("role_id", roleId)
      .eq("can_be_scheduled", true)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  return user && availability && churchLink ? user : null;
}

async function getApproverIds(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  { roleKey, churchIds }: { roleKey: RoleKey; churchIds: string[] },
) {
  const managerRoleKey = roleKey === "pregador" ? "anciao" : "lider_musica";
  const { data: roles } = await admin
    .from("roles")
    .select("id,key")
    .in("key", [managerRoleKey, "admin"])
    .is("deleted_at", null);
  const managerRoleId = roles?.find((role) => role.key === managerRoleKey)?.id;
  const adminRoleId = roles?.find((role) => role.key === "admin")?.id;
  const approverIds = new Set<string>();

  if (managerRoleId) {
    const { data: links } = await admin
      .from("user_church_links")
      .select("user_id")
      .in("church_id", Array.from(new Set(churchIds)))
      .eq("role_id", managerRoleId)
      .eq("is_manager", true)
      .is("deleted_at", null);
    links?.forEach((link) => approverIds.add(link.user_id));
  }

  if (adminRoleId) {
    const { data: admins } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role_id", adminRoleId)
      .is("deleted_at", null);
    admins?.forEach((adminUser) => approverIds.add(adminUser.user_id));
  }

  return Array.from(approverIds);
}

async function volunteerHasConflictOnDate({
  admin,
  currentServiceId,
  excludedServiceIds = [],
  roleKey,
  serviceDate,
  userId,
}: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  currentServiceId: string;
  excludedServiceIds?: string[];
  roleKey: RoleKey;
  serviceDate: string;
  userId: string;
}) {
  const assignmentColumn = roleKey === "pregador" ? "preacher_user_id" : "singer_user_id";
  const { data } = await admin
    .from("worship_services")
    .select("id,service_date,preacher_user_id,singer_user_id")
    .eq("service_date", serviceDate)
    .eq(assignmentColumn, userId)
    .is("deleted_at", null);

  return hasVolunteerDateConflict({
    assignments: (data ?? [])
      .filter((assignment) => !excludedServiceIds.includes(assignment.id))
      .map((assignment) => ({
        serviceId: assignment.id,
        serviceDate: assignment.service_date,
        userId:
          roleKey === "pregador"
            ? assignment.preacher_user_id
            : assignment.singer_user_id,
      })),
    currentServiceId,
    serviceDate,
    userId,
  });
}

async function notifyUsers(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  {
    userIds,
    title,
    body,
    metadata,
  }: {
    userIds: string[];
    title: string;
    body: string;
    metadata: Record<string, string>;
  },
) {
  const uniqueUserIds = Array.from(new Set(userIds));

  if (uniqueUserIds.length === 0) {
    return;
  }

  await admin.from("notifications").insert(
    uniqueUserIds.map((userId) => ({
      user_id: userId,
      title,
      body,
      metadata,
    })),
  );
}

function revalidateSchedule(roleKey: RoleKey) {
  revalidatePath(roleKey === "pregador" ? "/escalas/pregacao" : "/escalas/louvor");
  revalidatePath("/agenda");
  revalidatePath("/painel");
}

function readScheduleRole(formData: FormData): RoleKey | null {
  const value = readString(formData, "roleKey");
  return value === "pregador" || value === "cantor" ? value : null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

type ServiceContext = Pick<
  Database["public"]["Tables"]["worship_services"]["Row"],
  "id" | "church_id" | "service_date" | "preacher_user_id" | "singer_user_id"
>;
