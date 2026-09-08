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

  const { data: profile } = await supabase
    .from("users")
    .select("status")
    .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
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
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    return { message: "Preencha todos os campos obrigatórios." };
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
  const { error: profileError } = await admin.from("users").upsert(
    {
      auth_user_id: data.user.id,
      full_name: fullName,
      email,
      phone,
      status: "pending",
      deleted_at: null,
    },
    { onConflict: "auth_user_id" },
  );

  if (profileError) {
    return { message: "Cadastro criado no Auth, mas o perfil pendente falhou." };
  }

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

  if (!userId || !["pending", "approved", "blocked", "inactive"].includes(status)) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("users")
    .update({ status: status as "pending" | "approved" | "blocked" | "inactive" })
    .eq("id", userId);

  revalidatePath("/admin/usuarios");
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

function formatPersonName(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)([a-záàâãéêíóôõúç])/g, (match) =>
      match.toLocaleUpperCase("pt-BR"),
    );
}
