import "server-only";

import { requireApprovedUser } from "@/lib/auth/session";
import type { CurrentUserProfile } from "@/lib/auth/session";
import {
  getOccupiedVolunteerDateKeys,
  isVolunteerAvailableForService,
} from "@/lib/escalas/rules";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type ScheduleRoleKey = "pregador" | "cantor";
export type ManagerRoleKey = "anciao" | "lider_musica";

export type ScheduleService = Pick<
  Database["public"]["Tables"]["worship_services"]["Row"],
  | "id"
  | "church_id"
  | "service_date"
  | "service_type"
  | "start_time"
  | "title"
  | "preacher_user_id"
  | "preacher_name"
  | "singer_user_id"
  | "singer_formation_id"
  | "singer_name"
>;

export type ScheduleChurch = Pick<
  Database["public"]["Tables"]["churches"]["Row"],
  "id" | "name" | "city" | "state"
>;

export type VolunteerOption = {
  id: string;
  full_name: string;
  kind: "user" | "formation";
  member_ids: string[];
  resource_id: string;
  type_label: string;
  church_id: string;
  service_date: string;
  service_id: string;
};

export type SwapRequestSummary = Database["public"]["Tables"]["swap_requests"]["Row"] & {
  requester_name: string;
  source_church_id: string;
  target_name: string;
  target_church_id: string;
  source_date: string;
  target_date: string;
};

export type UserAgendaItem = ScheduleService & {
  roleKey: ScheduleRoleKey;
  canRequestSwap: boolean;
  church_name: string;
  church_city: string;
  church_state: string;
};

export type SwapTargetService = ScheduleService & {
  church_name: string;
};

export type NotificationSummary = Pick<
  Database["public"]["Tables"]["notifications"]["Row"],
  "id" | "title" | "body" | "status" | "created_at"
>;

export async function getSchedulePageData({
  managerRoleKey,
  scheduleRoleKey,
  monthStart,
  monthEnd,
}: {
  managerRoleKey: ManagerRoleKey;
  scheduleRoleKey: ScheduleRoleKey;
  monthStart: string;
  monthEnd: string;
}) {
  const profile = await requireApprovedUser();
  const supabase = createAdminSupabaseClient();
  const roleKeys = profile.roles.map((role) => role.key);
  const isAdmin = roleKeys.includes("admin");
  const isPastorPreachingManager =
    scheduleRoleKey === "pregador" && roleKeys.includes("pastor");

  if (!isAdmin && !isPastorPreachingManager && !roleKeys.includes(managerRoleKey)) {
    return { allowed: false as const };
  }

  const [{ data: scheduleRole }, { data: managerRole }] = await Promise.all([
    supabase
      .from("roles")
      .select("id")
      .eq("key", scheduleRoleKey)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("roles")
      .select("id")
      .eq("key", managerRoleKey)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  if (!scheduleRole || !managerRole) {
    return { allowed: false as const };
  }

  const managedChurchIds = isAdmin || isPastorPreachingManager
    ? await getAllChurchIds(supabase)
    : await getManagedChurchIds(supabase, {
        userId: profile.appUser.id,
        roleId: managerRole.id,
      });

  if (managedChurchIds.length === 0) {
    return {
      allowed: true as const,
      profile,
      churches: [] as ScheduleChurch[],
      services: [] as ScheduleService[],
      volunteers: [] as VolunteerOption[],
      swapRequests: [] as SwapRequestSummary[],
    };
  }

  const [{ data: churches }, { data: services }, volunteers, swapRequests] =
    await Promise.all([
      supabase
        .from("churches")
        .select("id,name,city,state")
        .in("id", managedChurchIds)
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("worship_services")
        .select(
          "id,church_id,service_date,service_type,start_time,title,preacher_user_id,preacher_name,singer_user_id,singer_formation_id,singer_name",
        )
        .in("church_id", managedChurchIds)
        .gte("service_date", monthStart)
        .lte("service_date", monthEnd)
        .is("deleted_at", null)
        .order("service_date", { ascending: true })
        .order("start_time", { ascending: true }),
      getVolunteerOptions(supabase, {
        roleKey: scheduleRoleKey,
        roleId: scheduleRole.id,
        churchIds: managedChurchIds,
        monthStart,
        monthEnd,
      }),
      getPendingSwapRequests(supabase, {
        roleKey: scheduleRoleKey,
        churchIds: managedChurchIds,
      }),
    ]);

  return {
    allowed: true as const,
    profile,
    churches: (churches ?? []) as ScheduleChurch[],
    services: (services ?? []) as ScheduleService[],
    volunteers,
    swapRequests,
  };
}

export async function getUserAgendaPageData({
  monthStart,
  monthEnd,
}: {
  monthStart: string;
  monthEnd: string;
}) {
  const profile = await requireApprovedUser();
  const supabase = createAdminSupabaseClient();
  const { data: formationMemberships } = await supabase
    .from("musical_formation_members")
    .select("formation_id")
    .eq("user_id", profile.appUser.id)
    .is("deleted_at", null);
  const formationIds =
    formationMemberships?.map((membership) => membership.formation_id) ?? [];
  const agendaFilter = [
    "preacher_user_id.eq." + profile.appUser.id,
    "singer_user_id.eq." + profile.appUser.id,
  ];

  if (formationIds.length > 0) {
    agendaFilter.push("singer_formation_id.in.(" + formationIds.join(",") + ")");
  }

  const [{ data: services }, { data: churches }, { data: notifications }] =
    await Promise.all([
      supabase
        .from("worship_services")
        .select(
          "id,church_id,service_date,service_type,start_time,title,preacher_user_id,preacher_name,singer_user_id,singer_formation_id,singer_name",
        )
        .or(agendaFilter.join(","))
        .gte("service_date", monthStart)
        .lte("service_date", monthEnd)
        .is("deleted_at", null)
        .order("service_date", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase.from("churches").select("id,name,city,state").is("deleted_at", null),
      supabase
        .from("notifications")
        .select("id,title,body,status,created_at")
        .eq("user_id", profile.appUser.id)
        .neq("status", "archived")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
  const churchMap = new Map((churches ?? []).map((church) => [church.id, church]));
  const agenda: UserAgendaItem[] = [];

  for (const service of (services ?? []) as ScheduleService[]) {
    if (service.preacher_user_id === profile.appUser.id) {
      agenda.push({
        ...service,
        roleKey: "pregador",
        canRequestSwap: true,
        church_name: churchMap.get(service.church_id)?.name ?? "Igreja",
        church_city: churchMap.get(service.church_id)?.city ?? "Candido Sales",
        church_state: churchMap.get(service.church_id)?.state ?? "BA",
      });
    }

    if (service.singer_user_id === profile.appUser.id) {
      agenda.push({
        ...service,
        roleKey: "cantor",
        canRequestSwap: true,
        church_name: churchMap.get(service.church_id)?.name ?? "Igreja",
        church_city: churchMap.get(service.church_id)?.city ?? "Candido Sales",
        church_state: churchMap.get(service.church_id)?.state ?? "BA",
      });
    }

    if (
      service.singer_formation_id &&
      formationIds.includes(service.singer_formation_id)
    ) {
      agenda.push({
        ...service,
        roleKey: "cantor",
        canRequestSwap: false,
        church_name: churchMap.get(service.church_id)?.name ?? "Igreja",
        church_city: churchMap.get(service.church_id)?.city ?? "Candido Sales",
        church_state: churchMap.get(service.church_id)?.state ?? "BA",
      });
    }
  }

  const allServices = await getSwapTargetServices(supabase, {
    userId: profile.appUser.id,
    monthStart,
    monthEnd,
  });
  const swapTargets: SwapTargetService[] = allServices.map((service) => ({
    ...service,
    church_name: churchMap.get(service.church_id)?.name ?? "Igreja não informada",
  }));
  const userSwapRequests = await getUserSwapRequests(supabase, profile.appUser.id);

  return {
    profile,
    agenda,
    notifications: (notifications ?? []) as NotificationSummary[],
    swapRequests: userSwapRequests,
    swapTargets,
  };
}

export async function getPanelPendingSwapRequests(
  profile: CurrentUserProfile & {
    appUser: NonNullable<CurrentUserProfile["appUser"]>;
  },
) {
  const supabase = createAdminSupabaseClient();
  const roleKeys = profile.roles.map((role) => role.key);
  const isAdmin = roleKeys.includes("admin");
  const isPastor = roleKeys.includes("pastor");
  const requests: SwapRequestSummary[] = [];

  if (isAdmin) {
    const churchIds = await getAllChurchIds(supabase);

    if (churchIds.length === 0) {
      return [];
    }

    const [preachingRequests, musicRequests] = await Promise.all([
      getPendingSwapRequests(supabase, { roleKey: "pregador", churchIds }),
      getPendingSwapRequests(supabase, { roleKey: "cantor", churchIds }),
    ]);

    requests.push(...preachingRequests, ...musicRequests);
  } else {
    const { data: managerRoles } = await supabase
      .from("roles")
      .select("id,key")
      .in("key", ["anciao", "lider_musica"])
      .is("deleted_at", null);
    const elderRoleId = managerRoles?.find((role) => role.key === "anciao")?.id;
    const musicLeaderRoleId = managerRoles?.find((role) => role.key === "lider_musica")?.id;

    if (isPastor) {
      const churchIds = await getAllChurchIds(supabase);
      requests.push(
        ...(await getPendingSwapRequests(supabase, { roleKey: "pregador", churchIds })),
      );
    } else if (roleKeys.includes("anciao") && elderRoleId) {
      const churchIds = await getManagedChurchIds(supabase, {
        roleId: elderRoleId,
        userId: profile.appUser.id,
      });
      requests.push(
        ...(await getPendingSwapRequests(supabase, { roleKey: "pregador", churchIds })),
      );
    }

    if (roleKeys.includes("lider_musica") && musicLeaderRoleId) {
      const churchIds = await getManagedChurchIds(supabase, {
        roleId: musicLeaderRoleId,
        userId: profile.appUser.id,
      });
      requests.push(
        ...(await getPendingSwapRequests(supabase, { roleKey: "cantor", churchIds })),
      );
    }
  }

  return requests
    .sort((first, second) => second.created_at.localeCompare(first.created_at))
    .slice(0, 8);
}

async function getAllChurchIds(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
) {
  const { data } = await supabase
    .from("churches")
    .select("id")
    .eq("active", true)
    .is("deleted_at", null);

  return data?.map((church) => church.id) ?? [];
}

async function getManagedChurchIds(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  { userId, roleId }: { userId: string; roleId: string },
) {
  const { data } = await supabase
    .from("user_church_links")
    .select("church_id")
    .eq("user_id", userId)
    .eq("role_id", roleId)
    .eq("is_manager", true)
    .is("deleted_at", null);

  return data?.map((link) => link.church_id) ?? [];
}

async function getVolunteerOptions(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  {
    roleKey,
    roleId,
    churchIds,
    monthStart,
    monthEnd,
  }: {
    roleKey: ScheduleRoleKey;
    roleId: string;
    churchIds: string[];
    monthStart: string;
    monthEnd: string;
  },
) {
  const assignmentColumn = roleKey === "pregador" ? "preacher_user_id" : "singer_user_id";
  let assignmentQuery = supabase
    .from("worship_services")
    .select(
      "id,service_date,preacher_user_id,singer_user_id,singer_formation_id",
    )
    .gte("service_date", monthStart)
    .lte("service_date", monthEnd)
    .is("deleted_at", null);

  assignmentQuery =
    roleKey === "pregador"
      ? assignmentQuery.not(assignmentColumn, "is", null)
      : assignmentQuery.or(
          "singer_user_id.not.is.null,singer_formation_id.not.is.null",
        );

  const [
    { data: links },
    { data: availability },
    { data: assignments },
    { data: services },
  ] = await Promise.all([
    supabase
      .from("user_church_links")
      .select("user_id,church_id")
      .in("church_id", churchIds)
      .eq("role_id", roleId)
      .eq("can_be_scheduled", true)
      .is("deleted_at", null),
    supabase
      .from("user_availability")
      .select("user_id,service_date,worship_service_id,available,managed")
      .eq("role_id", roleId)
      .gte("service_date", monthStart)
      .lte("service_date", monthEnd)
      .is("deleted_at", null),
    assignmentQuery,
    supabase
      .from("worship_services")
      .select("id,church_id,service_date,is_special")
      .in("church_id", churchIds)
      .gte("service_date", monthStart)
      .lte("service_date", monthEnd)
      .is("deleted_at", null),
  ]);
  const userIds = Array.from(
    new Set([
      ...(links?.map((link) => link.user_id) ?? []),
      ...(availability?.map((item) => item.user_id) ?? []),
    ]),
  );

  const { data: users } =
    userIds.length > 0
      ? await supabase
          .from("users")
          .select("id,full_name")
          .in("id", userIds)
          .eq("status", "approved")
          .is("deleted_at", null)
      : { data: [] as Array<{ id: string; full_name: string }> };
  const names = new Map((users ?? []).map((user) => [user.id, user.full_name]));
  const normalizedAvailability = (availability ?? []).map((item) => ({
    available: item.available,
    managed: item.managed,
    serviceDate: item.service_date,
    serviceId: item.worship_service_id,
    userId: item.user_id,
  }));
  const normalizedChurchLinks = (links ?? []).map((link) => ({
    churchId: link.church_id,
    userId: link.user_id,
  }));
  const occupiedByUserDate = getOccupiedVolunteerDateKeys(
    (assignments ?? []).map((assignment) => ({
      serviceId: assignment.id,
      serviceDate: assignment.service_date,
      userId:
        roleKey === "pregador"
          ? assignment.preacher_user_id
          : assignment.singer_user_id,
    })),
  );
  const assignedFormationIds =
    roleKey === "cantor"
      ? Array.from(
          new Set(
            (assignments ?? [])
              .map((assignment) => assignment.singer_formation_id)
              .filter((id): id is string => Boolean(id)),
          ),
        )
      : [];
  const { data: occupiedFormationMembers } =
    assignedFormationIds.length > 0
      ? await supabase
          .from("musical_formation_members")
          .select("formation_id,user_id")
          .in("formation_id", assignedFormationIds)
          .is("deleted_at", null)
      : { data: [] as Array<{ formation_id: string; user_id: string }> };

  if (roleKey === "cantor") {
    for (const assignment of assignments ?? []) {
      if (!assignment.singer_formation_id) {
        continue;
      }

      for (const member of occupiedFormationMembers ?? []) {
        if (member.formation_id === assignment.singer_formation_id) {
          occupiedByUserDate.add(
            member.user_id + ":" + assignment.service_date,
          );
        }
      }
    }
  }
  const volunteers: VolunteerOption[] = [];

  for (const service of services ?? []) {
    for (const userId of names.keys()) {
      const userDateKey = `${userId}:${service.service_date}`;
      const isAvailable = isVolunteerAvailableForService({
        availability: normalizedAvailability,
        churchLinks: normalizedChurchLinks,
        service: {
          churchId: service.church_id,
          date: service.service_date,
          id: service.id,
          isSpecial: service.is_special,
        },
        userId,
      });

      if (
        isAvailable &&
        !occupiedByUserDate.has(userDateKey) &&
        names.has(userId)
      ) {
        volunteers.push({
          id: userId,
          full_name: names.get(userId) ?? "Voluntário",
          kind: "user",
          member_ids: [userId],
          resource_id: userId,
          type_label: "Solo",
          church_id: service.church_id,
          service_date: service.service_date,
          service_id: service.id,
        });
      }
    }
  }

  if (roleKey === "cantor") {
    volunteers.push(
      ...(await getMusicalFormationVolunteerOptions(supabase, {
        assignments: assignments ?? [],
        churchIds,
        monthEnd,
        monthStart,
        services: services ?? [],
      })),
    );
  }

  return volunteers.sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
}

async function getMusicalFormationVolunteerOptions(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  {
    assignments,
    churchIds,
    monthEnd,
    monthStart,
    services,
  }: {
    assignments: Array<{
      id: string;
      service_date: string;
      preacher_user_id: string | null;
      singer_user_id: string | null;
      singer_formation_id: string | null;
    }>;
    churchIds: string[];
    monthEnd: string;
    monthStart: string;
    services: Array<{
      id: string;
      church_id: string;
      service_date: string;
      is_special: boolean;
    }>;
  },
) {
  const [
    { data: formations },
    { data: formationChurches },
    { data: availability },
    { data: allMembers },
  ] = await Promise.all([
    supabase
      .from("musical_formations")
      .select("id,name,formation_type")
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("musical_formation_churches")
      .select("formation_id,church_id")
      .in("church_id", churchIds)
      .eq("can_be_scheduled", true)
      .is("deleted_at", null),
    supabase
      .from("musical_formation_availability")
      .select("formation_id,worship_service_id,service_date")
      .eq("available", true)
      .gte("service_date", monthStart)
      .lte("service_date", monthEnd)
      .is("deleted_at", null),
    supabase
      .from("musical_formation_members")
      .select("formation_id,user_id")
      .is("deleted_at", null),
  ]);
  const formationMap = new Map(
    (formations ?? []).map((formation) => [formation.id, formation]),
  );
  const memberIdsByFormation = new Map<string, string[]>();

  for (const member of allMembers ?? []) {
    const memberIds = memberIdsByFormation.get(member.formation_id) ?? [];
    memberIds.push(member.user_id);
    memberIdsByFormation.set(member.formation_id, memberIds);
  }

  const occupiedMemberDates = new Set<string>();

  for (const assignment of assignments) {
    if (assignment.singer_user_id) {
      occupiedMemberDates.add(
        assignment.singer_user_id + ":" + assignment.service_date,
      );
    }

    if (assignment.singer_formation_id) {
      for (const memberId of
        memberIdsByFormation.get(assignment.singer_formation_id) ?? []) {
        occupiedMemberDates.add(memberId + ":" + assignment.service_date);
      }
    }
  }

  const options: VolunteerOption[] = [];

  for (const service of services) {
    const availableFormationIds = new Set(
      (availability ?? [])
        .filter(
          (item) =>
            item.worship_service_id === service.id &&
            item.service_date === service.service_date,
        )
        .map((item) => item.formation_id),
    );

    for (const formationChurch of formationChurches ?? []) {
      if (
        formationChurch.church_id !== service.church_id ||
        !availableFormationIds.has(formationChurch.formation_id)
      ) {
        continue;
      }

      const formation = formationMap.get(formationChurch.formation_id);
      const memberIds =
        memberIdsByFormation.get(formationChurch.formation_id) ?? [];
      const hasConflict = memberIds.some((memberId) =>
        occupiedMemberDates.has(memberId + ":" + service.service_date),
      );

      if (!formation || memberIds.length === 0 || hasConflict) {
        continue;
      }

      options.push({
        church_id: service.church_id,
        full_name: formation.name,
        id: "formation:" + formation.id,
        kind: "formation",
        member_ids: memberIds,
        resource_id: formation.id,
        service_date: service.service_date,
        service_id: service.id,
        type_label:
          formation.formation_type === "dupla"
            ? "Dupla"
            : formation.formation_type === "trio"
              ? "Trio"
              : formation.formation_type === "grupo"
                ? "Grupo"
                : "Solo",
      });
    }
  }

  return options;
}

async function getPendingSwapRequests(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  { roleKey, churchIds }: { roleKey: ScheduleRoleKey; churchIds: string[] },
) {
  const { data: requests } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("role_key", roleKey)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!requests || requests.length === 0) {
    return [];
  }

  const serviceIds = Array.from(
    new Set(requests.flatMap((request) => [request.source_service_id, request.target_service_id])),
  );
  const userIds = Array.from(
    new Set(requests.flatMap((request) => [request.requester_user_id, request.target_user_id])),
  );
  const [{ data: services }, { data: users }] = await Promise.all([
    supabase
      .from("worship_services")
      .select("id,church_id,service_date")
      .in("id", serviceIds)
      .is("deleted_at", null),
    supabase.from("users").select("id,full_name").in("id", userIds).is("deleted_at", null),
  ]);
  const serviceMap = new Map((services ?? []).map((service) => [service.id, service]));
  const userMap = new Map((users ?? []).map((user) => [user.id, user.full_name]));
  const churchSet = new Set(churchIds);

  return requests
    .filter((request) => {
      const source = serviceMap.get(request.source_service_id);
      const target = serviceMap.get(request.target_service_id);
      return source && target && (churchSet.has(source.church_id) || churchSet.has(target.church_id));
    })
    .map((request) => ({
      ...request,
      requester_name: userMap.get(request.requester_user_id) ?? "Solicitante",
      source_church_id: serviceMap.get(request.source_service_id)?.church_id ?? "",
      target_name: userMap.get(request.target_user_id) ?? "Outro usuário",
      target_church_id: serviceMap.get(request.target_service_id)?.church_id ?? "",
      source_date: serviceMap.get(request.source_service_id)?.service_date ?? "",
      target_date: serviceMap.get(request.target_service_id)?.service_date ?? "",
    })) as SwapRequestSummary[];
}

async function getUserSwapRequests(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const { data: requests } = await supabase
    .from("swap_requests")
    .select("*")
    .or(`requester_user_id.eq.${userId},target_user_id.eq.${userId}`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!requests || requests.length === 0) {
    return [];
  }

  const serviceIds = Array.from(
    new Set(requests.flatMap((request) => [request.source_service_id, request.target_service_id])),
  );
  const userIds = Array.from(
    new Set(requests.flatMap((request) => [request.requester_user_id, request.target_user_id])),
  );
  const [{ data: services }, { data: users }] = await Promise.all([
    supabase
      .from("worship_services")
      .select("id,church_id,service_date")
      .in("id", serviceIds)
      .is("deleted_at", null),
    supabase.from("users").select("id,full_name").in("id", userIds).is("deleted_at", null),
  ]);
  const serviceMap = new Map((services ?? []).map((service) => [service.id, service]));
  const userMap = new Map((users ?? []).map((user) => [user.id, user.full_name]));

  return requests.map((request) => ({
    ...request,
    requester_name: userMap.get(request.requester_user_id) ?? "Solicitante",
    source_church_id: serviceMap.get(request.source_service_id)?.church_id ?? "",
    target_name: userMap.get(request.target_user_id) ?? "Outro usuário",
    target_church_id: serviceMap.get(request.target_service_id)?.church_id ?? "",
    source_date: serviceMap.get(request.source_service_id)?.service_date ?? "",
    target_date: serviceMap.get(request.target_service_id)?.service_date ?? "",
  })) as SwapRequestSummary[];
}

async function getSwapTargetServices(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  {
    userId,
    monthStart,
    monthEnd,
  }: {
    userId: string;
    monthStart: string;
    monthEnd: string;
  },
) {
  const { data: services } = await supabase
    .from("worship_services")
    .select(
      "id,church_id,service_date,service_type,start_time,title,preacher_user_id,preacher_name,singer_user_id,singer_formation_id,singer_name",
    )
    .or(`preacher_user_id.not.is.null,singer_user_id.not.is.null`)
    .gte("service_date", monthStart)
    .lte("service_date", monthEnd)
    .is("deleted_at", null)
    .order("service_date", { ascending: true });

  return ((services ?? []) as ScheduleService[]).filter(
    (service) => service.preacher_user_id !== userId || service.singer_user_id !== userId,
  );
}
