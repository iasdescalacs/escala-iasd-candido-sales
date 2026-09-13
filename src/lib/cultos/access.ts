import "server-only";

import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export type WorshipManagementChurch = Pick<
  Database["public"]["Tables"]["churches"]["Row"],
  "id" | "name" | "city" | "state" | "active"
>;

export async function requireWorshipManager(
  supabase: AdminClient = createAdminSupabaseClient(),
) {
  const profile = await requireApprovedUser();
  const roleKeys = profile.roles.map((role) => role.key);
  const isAdmin = roleKeys.includes("admin");

  if (!isAdmin && !roleKeys.includes("anciao")) {
    redirect(
      "/painel?mensagem=Você não tem permissão para gerenciar cultos.",
    );
  }

  let churches: WorshipManagementChurch[] = [];

  if (isAdmin) {
    const { data } = await supabase
      .from("churches")
      .select("id,name,city,state,active")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    churches = (data ?? []) as WorshipManagementChurch[];
  } else {
    const { data: elderRole } = await supabase
      .from("roles")
      .select("id")
      .eq("key", "anciao")
      .is("deleted_at", null)
      .maybeSingle();

    if (elderRole) {
      const { data: links } = await supabase
        .from("user_church_links")
        .select("church_id")
        .eq("user_id", profile.appUser.id)
        .eq("role_id", elderRole.id)
        .eq("is_manager", true)
        .is("deleted_at", null);
      const churchIds = Array.from(
        new Set((links ?? []).map((link) => link.church_id)),
      );

      if (churchIds.length > 0) {
        const { data } = await supabase
          .from("churches")
          .select("id,name,city,state,active")
          .in("id", churchIds)
          .is("deleted_at", null)
          .order("name", { ascending: true });

        churches = (data ?? []) as WorshipManagementChurch[];
      }
    }
  }

  return {
    activeChurches: churches.filter((church) => church.active),
    churchIds: churches.map((church) => church.id),
    churches,
    isAdmin,
    profile,
  };
}
