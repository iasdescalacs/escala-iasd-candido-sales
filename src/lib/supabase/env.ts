const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export function hasSupabaseBrowserEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function hasSupabaseServerEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);
}

export function hasSiteEnv() {
  return Boolean(siteUrl);
}

export function getSupabaseBrowserEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function getSupabaseAdminEnv() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
  };
}

export function getSiteUrl() {
  if (!siteUrl) {
    throw new Error("Configure NEXT_PUBLIC_SITE_URL.");
  }

  return siteUrl;
}
