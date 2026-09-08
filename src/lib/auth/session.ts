import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  accessReasonToLoginMessage,
  decideProtectedAccess,
  type AccessProfile,
} from "./access-rules";

type AppUserRow = Database["public"]["Tables"]["users"]["Row"];
type RoleRow = Pick<Database["public"]["Tables"]["roles"]["Row"], "key" | "name">;

export type CurrentUserProfile = {
  authUserId: string;
  email: string;
  appUser: AppUserRow | null;
  roles: RoleRow[];
};

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  let roles: RoleRow[] = [];

  if (appUser) {
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", appUser.id)
      .is("deleted_at", null);

    const roleIds = userRoles?.map((item) => item.role_id) ?? [];

    if (roleIds.length > 0) {
      const { data: roleRows } = await supabase
        .from("roles")
        .select("key,name")
        .in("id", roleIds)
        .is("deleted_at", null);

      roles = roleRows ?? [];
    }
  }

  return {
    authUserId: user.id,
    email: user.email ?? appUser?.email ?? "",
    appUser,
    roles,
  };
}

export function toAccessProfile(
  profile: CurrentUserProfile | null,
): AccessProfile | null {
  if (!profile) {
    return null;
  }

  return {
    status: profile.appUser?.status ?? null,
    roles: profile.roles.map((role) => role.key),
  };
}

export async function requireApprovedUser() {
  const profile = await getCurrentUserProfile();
  const decision = decideProtectedAccess(toAccessProfile(profile));

  if (!decision.allowed) {
    redirectForDecision(decision.reason);
  }

  return profile as CurrentUserProfile & { appUser: AppUserRow };
}

export async function requireAdminUser() {
  const profile = await getCurrentUserProfile();
  const decision = decideProtectedAccess(toAccessProfile(profile), {
    requireAdmin: true,
  });

  if (!decision.allowed) {
    redirectForDecision(decision.reason);
  }

  return profile as CurrentUserProfile & { appUser: AppUserRow };
}

function redirectForDecision(reason: Parameters<typeof accessReasonToLoginMessage>[0]) {
  if (reason === "pending") {
    redirect("/aguardando-aprovacao");
  }

  const message = encodeURIComponent(accessReasonToLoginMessage(reason));
  redirect(`/login?mensagem=${message}`);
}
