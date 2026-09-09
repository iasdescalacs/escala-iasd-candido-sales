import { NextResponse } from "next/server";
import { getCurrentUserProfile, toAccessProfile } from "@/lib/auth/session";
import { decideProtectedAccess } from "@/lib/auth/access-rules";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type PushSubscriptionPayload = {
  endpoint?: unknown;
  expirationTime?: unknown;
  keys?: {
    auth?: unknown;
    p256dh?: unknown;
  };
};

export async function POST(request: Request) {
  const profile = await getCurrentUserProfile();
  const decision = decideProtectedAccess(toAccessProfile(profile));

  if (!decision.allowed || !profile?.appUser) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as PushSubscriptionPayload | null;

  if (!isValidSubscriptionPayload(payload)) {
    return NextResponse.json({ message: "Inscricao push invalida." }, { status: 400 });
  }

  let admin: ReturnType<typeof createAdminSupabaseClient>;

  try {
    admin = createAdminSupabaseClient();
  } catch {
    return NextResponse.json(
      { message: "Notificacoes indisponiveis: variaveis do servidor ausentes." },
      { status: 500 },
    );
  }

  const { error } = await admin
    .from("push_subscriptions")
    .upsert(
      {
        auth: payload.keys.auth,
        deleted_at: null,
        enabled: true,
        endpoint: payload.endpoint,
        p256dh: payload.keys.p256dh,
        platform: request.headers.get("sec-ch-ua-platform"),
        user_agent: request.headers.get("user-agent"),
        user_id: profile.appUser.id,
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    console.error("Falha ao salvar inscricao push.", {
      code: error.code,
      message: error.message,
    });

    return NextResponse.json(
      { message: "Nao foi possivel salvar este dispositivo para notificacoes." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

function isValidSubscriptionPayload(payload: PushSubscriptionPayload | null): payload is {
  endpoint: string;
  keys: { auth: string; p256dh: string };
} {
  return Boolean(
    payload &&
      typeof payload.endpoint === "string" &&
      payload.endpoint.length > 0 &&
      payload.keys &&
      typeof payload.keys.auth === "string" &&
      payload.keys.auth.length > 0 &&
      typeof payload.keys.p256dh === "string" &&
      payload.keys.p256dh.length > 0,
  );
}
