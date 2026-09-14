import { NextResponse } from "next/server";
import { decideProtectedAccess } from "@/lib/auth/access-rules";
import { getCurrentUserProfile, toAccessProfile } from "@/lib/auth/session";
import { getManagedAvailabilityRoleKeys } from "@/lib/disponibilidade/manager-rules";
import { isAvailabilityRoleKey } from "@/lib/disponibilidade/rules";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET(request: Request) {
  const profile = await getCurrentUserProfile();
  const decision = decideProtectedAccess(toAccessProfile(profile));

  if (!decision.allowed || !profile?.appUser) {
    return NextResponse.json(
      { message: "Acesso negado.", users: [] },
      { headers: responseHeaders, status: 401 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const roleKey = searchParams.get("funcao") ?? "";
  const search = (searchParams.get("busca") ?? "").trim().slice(0, 80);
  const managedRoleKeys = getManagedAvailabilityRoleKeys(
    profile.roles.map((role) => role.key),
  );

  if (!isAvailabilityRoleKey(roleKey) || !managedRoleKeys.includes(roleKey)) {
    return NextResponse.json(
      { message: "Função não permitida para este gestor.", users: [] },
      { headers: responseHeaders, status: 403 },
    );
  }

  if (search.length < 2) {
    return NextResponse.json({ users: [] }, { headers: responseHeaders });
  }

  const admin = createAdminSupabaseClient();
  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("key", roleKey)
    .is("deleted_at", null)
    .maybeSingle();

  if (roleError || !role) {
    return NextResponse.json(
      { message: "Não foi possível localizar a função solicitada.", users: [] },
      { headers: responseHeaders, status: 500 },
    );
  }

  const { data: roleLinks, error: roleLinksError } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role_id", role.id)
    .is("deleted_at", null);

  if (roleLinksError) {
    return NextResponse.json(
      { message: "Não foi possível pesquisar as pessoas.", users: [] },
      { headers: responseHeaders, status: 500 },
    );
  }

  const volunteerIds = Array.from(
    new Set((roleLinks ?? []).map((link) => link.user_id)),
  );

  if (volunteerIds.length === 0) {
    return NextResponse.json({ users: [] }, { headers: responseHeaders });
  }

  const { data: users, error: usersError } = await admin
    .from("users")
    .select("id,full_name")
    .in("id", volunteerIds)
    .eq("status", "approved")
    .is("deleted_at", null)
    .ilike("full_name", `%${search}%`)
    .order("full_name", { ascending: true })
    .limit(20);

  if (usersError) {
    return NextResponse.json(
      { message: "Não foi possível pesquisar as pessoas.", users: [] },
      { headers: responseHeaders, status: 500 },
    );
  }

  return NextResponse.json(
    { users: users ?? [] },
    { headers: responseHeaders },
  );
}
