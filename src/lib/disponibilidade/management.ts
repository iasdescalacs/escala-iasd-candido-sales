import "server-only";

import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AvailabilityRoleKey } from "./rules";
import { getManagedAvailabilityRoleKeys } from "./manager-rules";

type RoleRow = {
  id: string;
  key: "admin" | "pastor" | "anciao" | "lider_musica" | AvailabilityRoleKey;
  name: string;
};

export async function requireAvailabilityManager() {
  const profile = await requireApprovedUser();
  const viewerRoleKeys = profile.roles.map((role) => role.key);
  const managedRoleKeys = getManagedAvailabilityRoleKeys(viewerRoleKeys);

  if (managedRoleKeys.length === 0) {
    redirect(
      "/painel?mensagem=Voc%C3%AA+n%C3%A3o+tem+permiss%C3%A3o+para+gerenciar+disponibilidades.",
    );
  }

  const admin = createAdminSupabaseClient();
  const isAdmin = viewerRoleKeys.includes("admin");
  const isPastor = viewerRoleKeys.includes("pastor");
  const { data: roleRows } = await admin
    .from("roles")
    .select("id,key,name")
    .in("key", ["pregador", "cantor", "pastor", "anciao", "lider_musica"])
    .is("deleted_at", null);
  const roles = (roleRows ?? []) as RoleRow[];
  const roleIds = Object.fromEntries(
    roles.map((role) => [role.key, role.id]),
  ) as Partial<Record<RoleRow["key"], string>>;
  const roleNames = Object.fromEntries(
    roles.map((role) => [role.key, role.name]),
  ) as Partial<Record<RoleRow["key"], string>>;
  const churchIdsByRole: Record<AvailabilityRoleKey, string[]> = {
    cantor: [],
    pregador: [],
  };

  if (isAdmin) {
    const { data: churches } = await admin
      .from("churches")
      .select("id")
      .eq("active", true)
      .is("deleted_at", null);
    const churchIds = (churches ?? []).map((church) => church.id);

    churchIdsByRole.pregador = churchIds;
    churchIdsByRole.cantor = churchIds;
  } else {
    if (isPastor) {
      const { data: churches } = await admin
        .from("churches")
        .select("id")
        .eq("active", true)
        .is("deleted_at", null);

      churchIdsByRole.pregador = (churches ?? []).map((church) => church.id);
    }

    const rolePairs: Array<{
      managerRoleKey: "anciao" | "lider_musica";
      targetRoleKey: AvailabilityRoleKey;
    }> = [
      { managerRoleKey: "anciao", targetRoleKey: "pregador" },
      { managerRoleKey: "lider_musica", targetRoleKey: "cantor" },
    ];

    await Promise.all(
      rolePairs.map(async ({ managerRoleKey, targetRoleKey }) => {
        const managerRoleId = roleIds[managerRoleKey];

        if (!managedRoleKeys.includes(targetRoleKey) || !managerRoleId) {
          return;
        }

        const { data: links } = await admin
          .from("user_church_links")
          .select("church_id")
          .eq("user_id", profile.appUser.id)
          .eq("role_id", managerRoleId)
          .eq("is_manager", true)
          .is("deleted_at", null);

        churchIdsByRole[targetRoleKey] = Array.from(
          new Set([
            ...churchIdsByRole[targetRoleKey],
            ...(links ?? []).map((link) => link.church_id),
          ]),
        );
      }),
    );
  }

  return {
    admin,
    churchIdsByRole,
    isAdmin,
    managedRoleKeys,
    profile,
    roleIds,
    roleNames,
  };
}
