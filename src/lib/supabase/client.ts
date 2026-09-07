import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "./env";

export function createBrowserSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
