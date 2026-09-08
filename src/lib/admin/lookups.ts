import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServerEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type RoleOption = Pick<
  Database["public"]["Tables"]["roles"]["Row"],
  "id" | "key" | "name"
>;

export type ChurchOption = Pick<
  Database["public"]["Tables"]["churches"]["Row"],
  "id" | "name" | "city" | "state"
>;

export async function getRoleOptions(): Promise<RoleOption[]> {
  if (!hasSupabaseServerEnv()) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("roles")
    .select("id,key,name")
    .neq("key", "admin")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return data ?? [];
}

export async function getChurchOptions(): Promise<ChurchOption[]> {
  if (!hasSupabaseServerEnv()) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("churches")
    .select("id,name,city,state")
    .eq("active", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return data ?? [];
}
