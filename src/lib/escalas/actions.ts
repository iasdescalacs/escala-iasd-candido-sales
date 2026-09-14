"use server";

import { revalidatePath } from "next/cache";
import type { AuthActionState } from "@/lib/auth/actions";
import { requireApprovedUser } from "@/lib/auth/session";
import {
  hasVolunteerDateConflict,
  isVolunteerAvailableForService,
} from "@/lib/escalas/rules";
import { createNotificationsWithPush } from "@/lib/push/server";
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
  const targetValue = readString(formData, "userId");

  if (!serviceId || !roleKey || !targetValue) {
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

  const formationId =
    roleKey === "cantor" && targetValue.startsWith("formation:")
      ? targetValue.slice("formation:".length)
      : null;
  let selectedRecipientIds: string[] = [];
  let updatePayload:
    | {
        preacher_user_id: string;
        preacher_name: string;
      }
    | {
        singer_user_id: string | null;
        singer_formation_id: string | null;
        singer_name: string;
      };

  if (formationId) {
    const formation = await getAvailableFormation({
      admin,
      churchId: context.service.church_id,
      formationId,
      serviceDate: context.service.service_date,
      serviceId: context.service.id,
    });

    if (!formation) {
      return {
        message:
          "Essa formação não está disponível para essa igreja e culto.",
      };
    }

    const hasConflict = await musicalFormationHasConflictOnDate({
      admin,
      currentServiceId: serviceId,
      formationId: formation.id,
      memberIds: formation.memberIds,
      serviceDate: context.service.service_date,
    });

    if (hasConflict) {
      return {
        message:
          "Um integrante da formação já está escalado nesse dia. Escolha outra formação disponível.",
      };
    }

    selectedRecipientIds = formation.memberIds;
    updatePayload = {
      singer_formation_id: formation.id,
      singer_name: formation.name,
      singer_user_id: null,
    };
  } else {
    const volunteer = await getAvailableVolunteer({
      admin,
      userId: targetValue,
      roleId: context.roleId,
      churchId: context.service.church_id,
      serviceDate: context.service.service_date,
      serviceId: context.service.id,
      isSpecial: context.service.is_special,
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

    selectedRecipientIds = [volunteer.id];
    updatePayload =
      roleKey === "pregador"
        ? {
            preacher_name: volunteer.full_name,
            preacher_user_id: volunteer.id,
          }
        : {
            singer_formation_id: null,
            singer_name: volunteer.full_name,
            singer_user_id: volunteer.id,
          };
  }

  const previousUserId =
    roleKey === "pregador"
      ? context.service.preacher_user_id
      : context.service.singer_user_id;
  const previousFormationMemberIds =
    roleKey === "cantor" && context.service.singer_formation_id
      ? await getFormationMemberIds(admin, context.service.singer_formation_id)
      : [];
  const { error } = await admin
    .from("worship_services")
    .update(updatePayload)
    .eq("id", serviceId)
    .is("deleted_at", null);

  if (error) {
    return { message: "Não foi possível salvar a escala." };
  }

  await notifyUsers(admin, {
    userIds: [
      ...selectedRecipientIds,
      ...previousFormationMemberIds,
      previousUserId,
    ].filter(Boolean) as string[],
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
  const previousFormationMemberIds =
    roleKey === "cantor" && context.service.singer_formation_id
      ? await getFormationMemberIds(admin, context.service.singer_formation_id)
      : [];
  const updatePayload =
    roleKey === "pregador"
      ? { preacher_user_id: null, preacher_name: null }
      : {
          singer_formation_id: null,
          singer_user_id: null,
          singer_name: null,
        };
  await admin
    .from("worship_services")
    .update(updatePayload)
    .eq("id", serviceId)
    .is("deleted_at", null);

  if (previousUserId || previousFormationMemberIds.length > 0) {
    await notifyUsers(admin, {
      userIds: [previousUserId, ...previousFormationMemberIds].filter(
        Boolean,
      ) as string[],
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
    .select(
      "id,church_id,service_date,preacher_user_id,singer_user_id,singer_formation_id",
    )
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

export async function reviewSwapRequestAction(formData: FormData): Promise<AuthActionState> {
  const profile = await requireApprovedUser();
  const requestId = readString(formData, "requestId");
  const decision = readString(formData, "decision") as SwapStatus;

  if (!requestId || !["approved", "rejected"].includes(decision)) {
    return { message: "Informe a permuta e a decisão." };
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
    return { message: "Permuta pendente não localizada." };
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
    return { message: "Você não tem permissão para decidir esta permuta." };
  }

  if (decision === "approved") {
    const { data: services } = await admin
      .from("worship_services")
      .select(
        "id,service_date,preacher_user_id,preacher_name,singer_user_id,singer_formation_id,singer_name",
      )
      .in("id", [request.source_service_id, request.target_service_id])
      .is("deleted_at", null);
    const source = services?.find((service) => service.id === request.source_service_id);
    const target = services?.find((service) => service.id === request.target_service_id);

    if (!source || !target) {
      return { message: "Não foi possível localizar as escalas da permuta." };
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
      return {
        ok: true,
        message: "Permuta recusada por conflito de agenda.",
      };
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
          singer_formation_id: target.singer_formation_id,
          singer_user_id: target.singer_user_id,
          singer_name: target.singer_name,
        })
        .eq("id", source.id);
      await admin
        .from("worship_services")
        .update({
          singer_formation_id: source.singer_formation_id,
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

  return {
    ok: true,
    message: decision === "approved" ? "Permuta aprovada com sucesso." : "Permuta recusada.",
  };
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

  const isPastorPreachingManager =
    roleKey === "pregador" && managerRoles.includes("pastor");

  if (
    !managerRoles.includes("admin") &&
    !isPastorPreachingManager &&
    !managerRoles.includes(requiredRole)
  ) {
    return { allowed: false, message: "Você não tem permissão para gerenciar essa escala." };
  }

  const [{ data: service }, { data: role }] = await Promise.all([
    admin
      .from("worship_services")
      .select(
        "id,church_id,service_date,is_special,preacher_user_id,singer_user_id,singer_formation_id",
      )
      .eq("id", serviceId)
      .is("deleted_at", null)
      .maybeSingle(),
    admin.from("roles").select("id").eq("key", roleKey).is("deleted_at", null).maybeSingle(),
  ]);

  if (!service || !role) {
    return { allowed: false, message: "Culto ou função não localizado." };
  }

  if (managerRoles.includes("admin") || isPastorPreachingManager) {
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
  serviceId,
  isSpecial,
}: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  userId: string;
  roleId: string;
  churchId: string;
  serviceDate: string;
  serviceId: string;
  isSpecial: boolean;
}) {
  const availabilityQuery = admin
    .from("user_availability")
    .select("user_id,service_date,worship_service_id,available,managed")
    .eq("user_id", userId)
    .eq("role_id", roleId)
    .eq("service_date", serviceDate)
    .is("deleted_at", null);

  const [
    { data: user },
    { data: availability },
    { data: churchLink },
    { data: userRole },
  ] = await Promise.all([
    admin
      .from("users")
      .select("id,full_name,status")
      .eq("id", userId)
      .eq("status", "approved")
      .is("deleted_at", null)
      .maybeSingle(),
    availabilityQuery,
    admin
      .from("user_church_links")
      .select("id")
      .eq("user_id", userId)
      .eq("church_id", churchId)
      .eq("role_id", roleId)
      .eq("can_be_scheduled", true)
      .is("deleted_at", null)
      .maybeSingle(),
    admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role_id", roleId)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const isAvailable = isVolunteerAvailableForService({
    availability: (availability ?? []).map((item) => ({
      available: item.available,
      managed: item.managed,
      serviceDate: item.service_date,
      serviceId: item.worship_service_id,
      userId: item.user_id,
    })),
    churchLinks: churchLink ? [{ churchId, userId }] : [],
    service: {
      churchId,
      date: serviceDate,
      id: serviceId,
      isSpecial,
    },
    userId,
  });

  return user && userRole && isAvailable ? user : null;
}

async function getAvailableFormation({
  admin,
  churchId,
  formationId,
  serviceDate,
  serviceId,
}: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  churchId: string;
  formationId: string;
  serviceDate: string;
  serviceId: string;
}) {
  const [
    { data: formation },
    { data: churchLink },
    { data: availability },
    { data: members },
  ] = await Promise.all([
    admin
      .from("musical_formations")
      .select("id,name")
      .eq("id", formationId)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle(),
    admin
      .from("musical_formation_churches")
      .select("id")
      .eq("formation_id", formationId)
      .eq("church_id", churchId)
      .eq("can_be_scheduled", true)
      .is("deleted_at", null)
      .maybeSingle(),
    admin
      .from("musical_formation_availability")
      .select("id")
      .eq("formation_id", formationId)
      .eq("worship_service_id", serviceId)
      .eq("service_date", serviceDate)
      .eq("available", true)
      .is("deleted_at", null)
      .maybeSingle(),
    admin
      .from("musical_formation_members")
      .select("user_id")
      .eq("formation_id", formationId)
      .is("deleted_at", null),
  ]);
  const memberIds = members?.map((member) => member.user_id) ?? [];

  if (!formation || !churchLink || !availability || memberIds.length === 0) {
    return null;
  }

  const { data: approvedMembers } = await admin
    .from("users")
    .select("id")
    .in("id", memberIds)
    .eq("status", "approved")
    .is("deleted_at", null);

  if ((approvedMembers ?? []).length !== memberIds.length) {
    return null;
  }

  return {
    id: formation.id,
    memberIds,
    name: formation.name,
  };
}

async function getFormationMemberIds(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  formationId: string,
) {
  const { data } = await admin
    .from("musical_formation_members")
    .select("user_id")
    .eq("formation_id", formationId)
    .is("deleted_at", null);

  return data?.map((member) => member.user_id) ?? [];
}

async function musicalFormationHasConflictOnDate({
  admin,
  currentServiceId,
  formationId,
  memberIds,
  serviceDate,
}: {
  admin: ReturnType<typeof createAdminSupabaseClient>;
  currentServiceId: string;
  formationId: string;
  memberIds: string[];
  serviceDate: string;
}) {
  const { data: assignments } = await admin
    .from("worship_services")
    .select("id,singer_user_id,singer_formation_id")
    .eq("service_date", serviceDate)
    .neq("id", currentServiceId)
    .or("singer_user_id.not.is.null,singer_formation_id.not.is.null")
    .is("deleted_at", null);

  if (
    (assignments ?? []).some(
      (assignment) =>
        assignment.singer_formation_id === formationId ||
        (assignment.singer_user_id &&
          memberIds.includes(assignment.singer_user_id)),
    )
  ) {
    return true;
  }

  const assignedFormationIds = Array.from(
    new Set(
      (assignments ?? [])
        .map((assignment) => assignment.singer_formation_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (assignedFormationIds.length === 0) {
    return false;
  }

  const { data: conflictingMembers } = await admin
    .from("musical_formation_members")
    .select("id")
    .in("formation_id", assignedFormationIds)
    .in("user_id", memberIds)
    .is("deleted_at", null)
    .limit(1);

  return Boolean(conflictingMembers?.length);
}

async function getApproverIds(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  { roleKey, churchIds }: { roleKey: RoleKey; churchIds: string[] },
) {
  const managerRoleKey = roleKey === "pregador" ? "anciao" : "lider_musica";
  const { data: roles } = await admin
    .from("roles")
    .select("id,key")
    .in("key", [managerRoleKey, "pastor", "admin"])
    .is("deleted_at", null);
  const managerRoleId = roles?.find((role) => role.key === managerRoleKey)?.id;
  const adminRoleId = roles?.find((role) => role.key === "admin")?.id;
  const pastorRoleId = roles?.find((role) => role.key === "pastor")?.id;
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

  if (roleKey === "pregador" && pastorRoleId) {
    const { data: pastors } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role_id", pastorRoleId)
      .is("deleted_at", null);
    pastors?.forEach((pastor) => approverIds.add(pastor.user_id));
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
  let query = admin
    .from("worship_services")
    .select(
      "id,service_date,preacher_user_id,singer_user_id,singer_formation_id",
    )
    .eq("service_date", serviceDate)
    .is("deleted_at", null);
  query =
    roleKey === "pregador"
      ? query.eq("preacher_user_id", userId)
      : query.or(
          "singer_user_id.eq." +
            userId +
            ",singer_formation_id.not.is.null",
        );
  const { data } = await query;
  const relevantAssignments = (data ?? []).filter(
    (assignment) =>
      assignment.id !== currentServiceId &&
      !excludedServiceIds.includes(assignment.id),
  );

  if (
    roleKey === "cantor" &&
    relevantAssignments.some(
      (assignment) => assignment.singer_user_id === userId,
    )
  ) {
    return true;
  }

  if (roleKey === "cantor") {
    const formationIds = Array.from(
      new Set(
        relevantAssignments
          .map((assignment) => assignment.singer_formation_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (formationIds.length > 0) {
      const { data: memberships } = await admin
        .from("musical_formation_members")
        .select("id")
        .eq("user_id", userId)
        .in("formation_id", formationIds)
        .is("deleted_at", null)
        .limit(1);

      if (memberships?.length) {
        return true;
      }
    }
  }

  return hasVolunteerDateConflict({
    assignments: relevantAssignments
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

  await createNotificationsWithPush(
    admin,
    uniqueUserIds.map((userId) => ({
      title,
      body,
      metadata,
      userId,
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
  | "id"
  | "church_id"
  | "service_date"
  | "is_special"
  | "preacher_user_id"
  | "singer_user_id"
  | "singer_formation_id"
>;
