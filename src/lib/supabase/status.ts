import { getSupabaseBrowserEnv, hasSiteEnv, hasSupabaseServerEnv } from "./env";

export type SupabaseConnectionStatus = {
  browserEnvConfigured: boolean;
  adminEnvConfigured: boolean;
  siteEnvConfigured: boolean;
  connectionOk: boolean;
  message: string;
};

export async function getSupabaseConnectionStatus(): Promise<SupabaseConnectionStatus> {
  const adminEnvConfigured = hasSupabaseServerEnv();
  const siteEnvConfigured = hasSiteEnv();

  try {
    const { supabaseUrl } = getSupabaseBrowserEnv();
    const healthUrl = new URL("/auth/v1/health", supabaseUrl);
    const response = await fetch(healthUrl, {
      cache: "no-store",
    });

    return {
      browserEnvConfigured: true,
      adminEnvConfigured,
      siteEnvConfigured,
      connectionOk: response.ok,
      message: response.ok
        ? "Conexão inicial com Supabase confirmada."
        : `Supabase respondeu com HTTP ${response.status}.`,
    };
  } catch {
    return {
      browserEnvConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
      adminEnvConfigured,
      siteEnvConfigured,
      connectionOk: false,
      message:
        "Não foi possível confirmar a conexão inicial com Supabase. Verifique URL e variáveis de ambiente.",
    };
  }
}
