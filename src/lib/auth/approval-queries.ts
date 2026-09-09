import "server-only";

import {
  canApprovePendingUserRole,
  getAllowedManagedCreationRoles,
  type ApprovalRequestRole,
} from "@/lib/auth/approval-rules";
import type { CurrentUserProfile } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type AppUser = Database["public"]["Tables"]["users"]["Row"];
type Role = Pick<Database["public"]["Tables"]["roles"]["Row"], "id" | "key" | "name">;
type Church = Pick<Database["public"]["Tables"]["churches"]["Row"], "id" | "name" | "city" | "state">;

export type UserApprovalRequest = {
  churchId: string;
  churchName: string;
  createdAt: string;
  email: string;
  phone: string | null;
  requestedBy: string;
  roleKey: ApprovalRequestRole;
  roleName: string;
  status: AppUser["status"];
  userId: string;
  userName: string;
};

export type ManagedUserCreationContext = {
  allowedChurches: Church[];
  allowedRoles: ApprovalRequestRole[];
};

export async function getUserApprovalDashboardData(
  profile: CurrentUserProfile & {
    appUser: NonNullable<CurrentUserProfile["appUser"]>;
  },
) {
  const supabase = createAdminSupabaseClient();
  const roleKeys = profile.roles.map((role) => role.key) as Database["public"]["Enums"]["role_key"][];
  const isAdmin = roleKeys.includes("admin");
  const managedChurches = isAdmin
    ? await getAllChurches(supabase)
    : await getManagedChurches(supabase, profile.appUser.id);
  const managedChurchIds = managedChurches.map((church) => church.id);
  const allowedRoles = getAllowedManagedCreationRoles(roleKeys);

  if (!isAdmin && managedChurchIds.length === 0 && allowedRoles.length === 0) {
    return {
      creationContext: { allowedChurches: [], allowedRoles: [] },
      requests: [] as UserApprovalRequest[],
    };
  }

  const requests = await getPendingApprovalRequests(supabase, {
    isAdmin,
    managedChurchIds,
    roleKeys,
  });

  return {
    creationContext: {
      allowedChurches: managedChurches,
      allowedRoles,
    },
    requests,
  };
}

async function getPendingApprovalRequests(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  {
    isAdmin,
    managedChurchIds,
    roleKeys,
  }: {
    isAdmin: boolean;
    managedChurchIds: string[];
    roleKeys: Database["public"]["Enums"]["role_key"][];
  },
) {
  const { data: users } = await supabase
    .from("users")
    .select("id,full_name,email,phone,status,created_at")
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!users?.length) {
    return [];
  }

  const userIds = users.map((user) => user.id);
  const [{ data: userRoles }, { data: roles }, { data: links }, { data: churches }] =
    await Promise.all([
      supabase
        .from("user_roles")
        .select("user_id,role_id")
        .in("user_id", userIds)
        .is("deleted_at", null),
      supabase.from("roles").select("id,key,name").is("deleted_at", null),
      supabase
        .from("user_church_links")
        .select("user_id,church_id,role_id")
        .in("user_id", userIds)
        .is("deleted_at", null),
      supabase.from("churches").select("id,name,city,state").is("deleted_at", null),
    ]);
  const roleMap = new Map((roles ?? []).map((role) => [role.id, role as Role]));
  const churchMap = new Map((churches ?? []).map((church) => [church.id, church as Church]));
  const userMap = new Map(users.map((user) => [user.id, user]));
  const rows: UserApprovalRequest[] = [];

  for (const userRole of userRoles ?? []) {
    const role = roleMap.get(userRole.role_id);
    const user = userMap.get(userRole.user_id);

    if (!role || !user || (role.key !== "pregador" && role.key !== "cantor")) {
      continue;
    }

    const link = (links ?? []).find(
      (item) => item.user_id === user.id && item.role_id === role.id,
    );
    const church = link ? churchMap.get(link.church_id) : undefined;

    if (!church) {
      continue;
    }

    const canApprove = canApprovePendingUserRole({
      request: { churchId: church.id, roleKey: role.key },
      viewer: {
        managedChurchIds: isAdmin ? [church.id] : managedChurchIds,
        roleKeys,
      },
    });

    if (!canApprove) {
      continue;
    }

    rows.push({
      churchId: church.id,
      churchName: `${church.name} - ${church.city}/${church.state}`,
      createdAt: user.created_at,
      email: user.email,
      phone: user.phone,
      requestedBy: "Cadastro público",
      roleKey: role.key,
      roleName: role.name,
      status: user.status,
      userId: user.id,
      userName: user.full_name,
    });
  }

  return rows.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

async function getAllChurches(supabase: ReturnType<typeof createAdminSupabaseClient>) {
  const { data } = await supabase
    .from("churches")
    .select("id,name,city,state")
    .eq("active", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (data ?? []) as Church[];
}

async function getManagedChurches(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const { data: links } = await supabase
    .from("user_church_links")
    .select("church_id")
    .eq("user_id", userId)
    .eq("is_manager", true)
    .is("deleted_at", null);
  const churchIds = Array.from(new Set(links?.map((link) => link.church_id) ?? []));

  if (churchIds.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("churches")
    .select("id,name,city,state")
    .in("id", churchIds)
    .eq("active", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (data ?? []) as Church[];
}
