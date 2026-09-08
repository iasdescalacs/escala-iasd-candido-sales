"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getSiteUrl, hasSupabaseServerEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdminUser, requireApprovedUser } from "./session";

export type AuthActionState = {
  message: string;
  ok?: boolean;
};

type UserStatus = "pending" | "approved" | "blocked" | "inactive";
type RoleKey = "admin" | "anciao" | "lider_musica" | "pregador" | "cantor";

const initialError = {
  message: "Não foi possível concluir a ação. Tente novamente.",
};

export async function loginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");

  if (!email || !password) {
    return { message: "Informe e-mail e senha." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: "E-mail ou senha inválidos." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("status")
    .eq("auth_user_id", user?.id ?? "")
    .is("deleted_at", null)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { message: "Cadastro do usuário não localizado." };
  }

  if (profile.status === "pending") {
    redirect("/aguardando-aprovacao");
  }

  if (profile.status === "blocked" || profile.status === "inactive") {
    await supabase.auth.signOut();
    return { message: "Seu acesso está bloqueado ou inativo. Procure a administração." };
  }

  redirect("/painel");
}

export async function signUpAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = formatPersonName(readString(formData, "fullName"));
  const email = readString(formData, "email").toLowerCase();
  const phone = readString(formData, "phone");
  const roleKey = readString(formData, "roleKey");
  const churchId = readString(formData, "churchId");
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  if (!fullName || !email || !phone || !roleKey || !churchId || !password || !confirmPassword) {
    return { message: "Preencha todos os campos obrigatórios." };
  }

  if (!isAssignableRole(roleKey)) {
    return { message: "Escolha um tipo de usuário válido." };
  }

  if (password.length < 8) {
    return { message: "A senha precisa ter pelo menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { message: "As senhas não conferem." };
  }

  if (!hasSupabaseServerEnv()) {
    return {
      message:
        "Cadastro indisponível: configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const siteUrl = getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/aguardando-aprovacao`,
      data: {
        full_name: fullName,
        phone,
      },
    },
  });

  if (error || !data.user) {
    return { message: error?.message ?? initialError.message };
  }

  const admin = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await admin
    .from("users")
    .upsert(
      {
        auth_user_id: data.user.id,
        full_name: fullName,
        email,
        phone,
        status: "pending",
        deleted_at: null,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();

  if (profileError) {
    return { message: "Cadastro criado no Auth, mas o perfil pendente falhou." };
  }

  await attachRoleAndChurch(admin, {
    userId: profile.id,
    roleKey,
    churchId,
    canBeScheduled: roleKey === "pregador" || roleKey === "cantor",
  });

  redirect("/aguardando-aprovacao");
}

export async function requestPasswordRecoveryAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readString(formData, "email").toLowerCase();

  if (!email) {
    return { message: "Informe seu e-mail." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/alterar-senha`,
  });

  if (error) {
    return { message: "Não foi possível enviar o e-mail de recuperação." };
  }

  return {
    ok: true,
    message: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
  };
}

export async function updatePasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  if (!password || !confirmPassword) {
    return { message: "Informe e confirme a nova senha." };
  }

  if (password.length < 8) {
    return { message: "A senha precisa ter pelo menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { message: "As senhas não conferem." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { message: "Não foi possível alterar a senha." };
  }

  redirect("/painel");
}

export async function updateProfileAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const profile = await requireApprovedUser();
  const fullName = formatPersonName(readString(formData, "fullName"));
  const phone = readString(formData, "phone");

  if (!fullName || !phone) {
    return { message: "Informe nome e telefone." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      phone,
    })
    .eq("id", profile.appUser.id);

  if (error) {
    return { message: "Não foi possível atualizar seu perfil." };
  }

  revalidatePath("/perfil");
  revalidatePath("/painel");

  return { ok: true, message: "Perfil atualizado com sucesso." };
}

export async function updateUserStatusAction(formData: FormData) {
  await requireAdminUser();

  const userId = readString(formData, "userId");
  const status = readString(formData, "status");

  if (!userId || !isUserStatus(status)) {
    return;
  }

  const admin = createAdminSupabaseClient();
  await admin.from("users").update({ status }).eq("id", userId);

  revalidatePath("/admin/usuarios");
}

export async function updateUserByAdminAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await requireAdminUser();

  const userId = readString(formData, "userId");
  const fullName = formatPersonName(readString(formData, "fullName"));
  const phone = readString(formData, "phone");
  const status = readString(formData, "status");

  if (!userId || !fullName || !phone || !isUserStatus(status)) {
    return { message: "Preencha nome, telefone e status." };
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("users")
    .update({
      full_name: fullName,
      phone,
      status,
    })
    .eq("id", userId)
    .is("deleted_at", null);

  if (error) {
    return { message: "Não foi possível atualizar o usuário." };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}/editar`);

  return { ok: true, message: "Usuário atualizado com sucesso." };
}

export async function createChurchAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await requireAdminUser();

  const name = formatPersonName(readString(formData, "name"));
  const city = formatPersonName(readString(formData, "city") || "Candido Sales");
  const state = readString(formData, "state").toUpperCase() || "BA";

  if (!name || state.length !== 2) {
    return { message: "Informe nome da igreja, cidade e UF com 2 letras." };
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("churches").upsert(
    {
      name,
      city,
      state,
      active: true,
      deleted_at: null,
    },
    { onConflict: "name" },
  );

  if (error) {
    return { message: "Não foi possível salvar a igreja." };
  }

  revalidatePath("/admin/igrejas");
  revalidatePath("/cadastro");

  return { ok: true, message: "Igreja salva com sucesso." };
}

export async function createUserByAdminAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await requireAdminUser();

  const fullName = formatPersonName(readString(formData, "fullName"));
  const email = readString(formData, "email").toLowerCase();
  const phone = readString(formData, "phone");
  const roleKey = readString(formData, "roleKey");
  const churchId = readString(formData, "churchId");
  const password = readString(formData, "password");
  const status = readString(formData, "status") || "approved";

  if (!fullName || !email || !phone || !roleKey || !churchId || !password) {
    return { message: "Preencha todos os campos obrigatórios." };
  }

  if (!isAssignableRole(roleKey) && roleKey !== "admin") {
    return { message: "Escolha uma função válida." };
  }

  if (!isUserStatus(status)) {
    return { message: "Escolha um status válido." };
  }

  if (password.length < 8) {
    return { message: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const admin = createAdminSupabaseClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
    },
  });

  if (authError || !authUser.user) {
    return { message: authError?.message ?? "Não foi possível criar o usuário." };
  }

  const { data: profile, error: profileError } = await admin
    .from("users")
    .upsert(
      {
        auth_user_id: authUser.user.id,
        full_name: fullName,
        email,
        phone,
        status,
        deleted_at: null,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();

  if (profileError) {
    return { message: "Usuário criado no Auth, mas o perfil falhou." };
  }

  await attachRoleAndChurch(admin, {
    userId: profile.id,
    roleKey,
    churchId,
    canBeScheduled: roleKey === "pregador" || roleKey === "cantor",
  });

  revalidatePath("/admin/usuarios");

  return { ok: true, message: "Usuário criado com sucesso." };
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isAssignableRole(roleKey: string): roleKey is Exclude<RoleKey, "admin"> {
  return ["anciao", "lider_musica", "pregador", "cantor"].includes(roleKey);
}

function isUserStatus(status: string): status is UserStatus {
  return ["pending", "approved", "blocked", "inactive"].includes(status);
}

async function attachRoleAndChurch(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  {
    userId,
    roleKey,
    churchId,
    canBeScheduled,
  }: {
    userId: string;
    roleKey: RoleKey | string;
    churchId: string;
    canBeScheduled: boolean;
  },
) {
  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("key", roleKey as RoleKey)
    .is("deleted_at", null)
    .maybeSingle();

  if (!role) {
    return;
  }

  const { data: currentRoleLink } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role_id", role.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!currentRoleLink) {
    await admin.from("user_roles").insert({
      user_id: userId,
      role_id: role.id,
      deleted_at: null,
    });
  }

  const { data: currentChurchLink } = await admin
    .from("user_church_links")
    .select("id")
    .eq("user_id", userId)
    .eq("church_id", churchId)
    .eq("role_id", role.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!currentChurchLink) {
    await admin.from("user_church_links").insert({
      user_id: userId,
      church_id: churchId,
      role_id: role.id,
      can_be_scheduled: canBeScheduled,
      is_manager: roleKey === "anciao" || roleKey === "lider_musica",
      deleted_at: null,
    });
  }
}

function formatPersonName(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)([a-záàâãéêíóôõúç])/g, (match) =>
      match.toLocaleUpperCase("pt-BR"),
    );
}
