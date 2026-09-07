import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseAdminEnv } from "./env";

export function createAdminSupabaseClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseAdminEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
