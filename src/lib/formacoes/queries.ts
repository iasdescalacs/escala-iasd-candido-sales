import "server-only";

import { requireApprovedUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type {
  MusicalFormationStatus,
  MusicalFormationType,
} from "./rules";

export type FormationChurchOption = Pick<
  Database["public"]["Tables"]["churches"]["Row"],
  "id" | "name" | "city" | "state"
>;

export type FormationSingerOption = {
  id: string;
  fullName: string;
};

export type FormationMemberSummary = FormationSingerOption & {
  isResponsible: boolean;
};

export type MusicalFormationSummary = {
  canManage: boolean;
  canModerate: boolean;
  churchIds: string[];
  formationType: MusicalFormationType;
  homeChurchId: string;
  homeChurchName: string;
  id: string;
  members: FormationMemberSummary[];
  name: string;
  status: MusicalFormationStatus;
};

export type FormationServiceOption = Pick<
  Database["public"]["Tables"]["worship_services"]["Row"],
  "id" | "church_id" | "service_date" | "service_type" | "start_time" | "title" | "is_special"
>;

export async function getMusicalFormationsPageData({
  formationId,
  monthEnd,
  monthStart,
}: {
  formationId: string;
  monthEnd: string;
  monthStart: string;
}) {
  const profile = await requireApprovedUser();
  const admin = createAdminSupabaseClient();
  const roleKeys = profile.roles.map((role) => role.key);
  const isAdmin = roleKeys.includes("admin");
  const isSinger = roleKeys.includes("cantor");
  const isMusicLeader = roleKeys.includes("lider_musica");
  const { data: roleRows } = await admin
    .from("roles")
    .select("id,key")
    .in("key", ["cantor", "lider_musica"])
    .is("deleted_at", null);
  const singerRoleId = roleRows?.find((role) => role.key === "cantor")?.id;
  const musicLeaderRoleId = roleRows?.find(
    (role) => role.key === "lider_musica",
  )?.id;

  const [
    { data: churches },
    { data: formationRows },
    { data: singerRoleLinks },
    { data: managerLinks },
  ] = await Promise.all([
    admin
      .from("churches")
      .select("id,name,city,state")
      .eq("active", true)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    admin
      .from("musical_formations")
      .select("id,name,formation_type,status,home_church_id")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    singerRoleId
      ? admin
          .from("user_roles")
          .select("user_id")
          .eq("role_id", singerRoleId)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as Array<{ user_id: string }> }),
    isMusicLeader && musicLeaderRoleId
      ? admin
          .from("user_church_links")
          .select("church_id")
          .eq("user_id", profile.appUser.id)
          .eq("role_id", musicLeaderRoleId)
          .eq("is_manager", true)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as Array<{ church_id: string }> }),
  ]);

  const singerIds = singerRoleLinks?.map((link) => link.user_id) ?? [];
  const formationIds = formationRows?.map((formation) => formation.id) ?? [];
  const [{ data: singers }, { data: members }, { data: formationChurches }] =
    await Promise.all([
      singerIds.length > 0
        ? admin
            .from("users")
            .select("id,full_name")
            .in("id", singerIds)
            .eq("status", "approved")
            .is("deleted_at", null)
            .order("full_name", { ascending: true })
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
      formationIds.length > 0
        ? admin
            .from("musical_formation_members")
            .select("formation_id,user_id,member_role")
            .in("formation_id", formationIds)
            .is("deleted_at", null)
        : Promise.resolve({
            data: [] as Array<{
              formation_id: string;
              user_id: string;
              member_role: "responsavel" | "integrante";
            }>,
          }),
      formationIds.length > 0
        ? admin
            .from("musical_formation_churches")
            .select("formation_id,church_id")
            .in("formation_id", formationIds)
            .eq("can_be_scheduled", true)
            .is("deleted_at", null)
        : Promise.resolve({
            data: [] as Array<{ formation_id: string; church_id: string }>,
          }),
    ]);

  const singerNameMap = new Map(
    (singers ?? []).map((singer) => [singer.id, singer.full_name]),
  );
  const churchNameMap = new Map(
    (churches ?? []).map((church) => [church.id, church.name]),
  );
  const managedMusicChurchIds = new Set(
    managerLinks?.map((link) => link.church_id) ?? [],
  );
  const formations = (formationRows ?? [])
    .map((formation): MusicalFormationSummary & { visible: boolean } => {
      const formationMembers = (members ?? [])
        .filter((member) => member.formation_id === formation.id)
        .map((member) => ({
          fullName: singerNameMap.get(member.user_id) ?? "Cantor",
          id: member.user_id,
          isResponsible: member.member_role === "responsavel",
        }))
        .sort((first, second) =>
          first.fullName.localeCompare(second.fullName, "pt-BR"),
        );
      const canModerate =
        isAdmin || managedMusicChurchIds.has(formation.home_church_id);
      const isMember = formationMembers.some(
        (member) => member.id === profile.appUser.id,
      );
      const isResponsible = formationMembers.some(
        (member) =>
          member.id === profile.appUser.id && member.isResponsible,
      );

      return {
        canManage: canModerate || isResponsible,
        canModerate,
        churchIds: (formationChurches ?? [])
          .filter((link) => link.formation_id === formation.id)
          .map((link) => link.church_id),
        formationType: formation.formation_type as MusicalFormationType,
        homeChurchId: formation.home_church_id,
        homeChurchName:
          churchNameMap.get(formation.home_church_id) ?? "Igreja não informada",
        id: formation.id,
        members: formationMembers,
        name: formation.name,
        status: formation.status as MusicalFormationStatus,
        visible: isAdmin || canModerate || isMember,
      };
    })
    .filter((formation) => formation.visible)
    .map((formation): MusicalFormationSummary => formation);

  const selectedFormation =
    formations.find((formation) => formation.id === formationId) ?? null;
  let services: FormationServiceOption[] = [];
  let selectedServiceIds: string[] = [];

  if (
    selectedFormation?.canManage &&
    selectedFormation.status === "active" &&
    selectedFormation.churchIds.length > 0
  ) {
    const [{ data: serviceRows }, { data: availabilityRows }] =
      await Promise.all([
        admin
          .from("worship_services")
          .select(
            "id,church_id,service_date,service_type,start_time,title,is_special",
          )
          .in("church_id", selectedFormation.churchIds)
          .gte("service_date", monthStart)
          .lte("service_date", monthEnd)
          .is("deleted_at", null)
          .order("service_date", { ascending: true })
          .order("start_time", { ascending: true }),
        admin
          .from("musical_formation_availability")
          .select("worship_service_id")
          .eq("formation_id", selectedFormation.id)
          .eq("available", true)
          .gte("service_date", monthStart)
          .lte("service_date", monthEnd)
          .is("deleted_at", null),
      ]);

    services = (serviceRows ?? []) as FormationServiceOption[];
    selectedServiceIds =
      availabilityRows?.map((availability) => availability.worship_service_id) ??
      [];
  }

  return {
    canCreate:
      isAdmin ||
      isSinger ||
      (isMusicLeader && managedMusicChurchIds.size > 0),
    churches: (churches ?? []) as FormationChurchOption[],
    currentUserId: profile.appUser.id,
    formations,
    profile,
    selectedFormation,
    selectedServiceIds,
    services,
    singers: (singers ?? []).map((singer) => ({
      fullName: singer.full_name,
      id: singer.id,
    })),
  };
}
