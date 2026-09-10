import { NextResponse } from "next/server";
import { decideProtectedAccess } from "@/lib/auth/access-rules";
import { getCurrentUserProfile, toAccessProfile } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const profile = await getCurrentUserProfile();
  const decision = decideProtectedAccess(toAccessProfile(profile));

  if (!decision.allowed || !profile?.appUser) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;

  if (!payload || typeof payload.endpoint !== "string" || payload.endpoint.length === 0) {
    return NextResponse.json({ message: "Inscricao push invalida." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("push_subscriptions")
    .update({
      deleted_at: new Date().toISOString(),
      enabled: false,
    })
    .eq("endpoint", payload.endpoint)
    .eq("user_id", profile.appUser.id);

  if (error) {
    return NextResponse.json(
      { message: "Nao foi possivel desativar as notificacoes." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
