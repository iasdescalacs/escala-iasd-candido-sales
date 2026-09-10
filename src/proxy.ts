import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const protectedPrefixes = [
  "/painel",
  "/perfil",
  "/alterar-senha",
  "/disponibilidade",
  "/agenda",
  "/escalas",
];
const adminPrefixes = ["/admin"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  if (!isProtectedPath(pathname)) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectToLogin(request, "Configuração do Supabase ausente.");
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request, "Entre para acessar o sistema.");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id,status")
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!profile) {
    return redirectToLogin(request, "Cadastro do usuário não localizado.");
  }

  if (profile.status === "pending") {
    return NextResponse.redirect(new URL("/aguardando-aprovacao", request.url));
  }

  if (profile.status === "blocked" || profile.status === "inactive") {
    return redirectToLogin(
      request,
      "Seu acesso está bloqueado ou inativo. Procure a administração.",
    );
  }

  if (isAdminPath(pathname)) {
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", profile.id)
      .is("deleted_at", null);
    const roleIds = userRoles?.map((item) => item.role_id) ?? [];
    const { data: roles } =
      roleIds.length > 0
        ? await supabase.from("roles").select("key").in("id", roleIds).is("deleted_at", null)
        : { data: [] };

    if (!roles?.some((role) => role.key === "admin")) {
      return redirectToLogin(request, "Você não tem permissão para acessar essa área.");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/painel/:path*",
    "/perfil/:path*",
    "/alterar-senha/:path*",
    "/disponibilidade/:path*",
    "/agenda/:path*",
    "/escalas/:path*",
    "/admin/:path*",
  ],
};

function isProtectedPath(pathname: string) {
  return (
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    isAdminPath(pathname)
  );
}

function isAdminPath(pathname: string) {
  return adminPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function redirectToLogin(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("mensagem", message);
  return NextResponse.redirect(url);
}
