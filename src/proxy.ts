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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirectToLogin(request, "Entre para acessar o sistema.");
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
