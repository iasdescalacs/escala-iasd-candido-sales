"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getSiteUrl, hasSupabaseServerEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isManagerRoleKey,
  isRoleKey,
  mergeSelfManagedRoles,
  normalizeRoleKeys,
  type RoleKey,
} from "./role-rules";
import { requireAdminUser, requireApprovedUser } from "./session";

export type AuthActionState = {
  message: string;
  ok?: boolean;
};

type UserStatus = "pending" | "approved" | "blocked" | "inactive";

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
  const roleKeys = normalizeRoleKeys(readStringList(formData, "roleKeys"));
  const churchId = readString(formData, "churchId");
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  if (!fullName || !email || !phone || roleKeys.length === 0 || !churchId || !password || !confirmPassword) {
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

  const rolesError = await syncUserRolesAndPrimaryChurch(admin, {
    userId: profile.id,
    roleKeys,
    churchId,
  });

  if (rolesError) {
    return { message: rolesError };
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
  const roleKeys = mergeSelfManagedRoles({
    currentRoleKeys: profile.roles.map((role) => role.key),
    selectedSelfRoleKeys: readStringList(formData, "roleKeys"),
  });

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

  const admin = createAdminSupabaseClient();
  const { data: primaryLink } = await admin
    .from("user_church_links")
    .select("church_id")
    .eq("user_id", profile.appUser.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!primaryLink && roleKeys.some((roleKey) => roleKey === "pregador" || roleKey === "cantor")) {
    return {
      message:
        "Seu perfil não tem igreja principal vinculada. Procure o administrador para ajustar seu cadastro.",
    };
  }

  if (primaryLink) {
    const roleUpdateError = await syncUserRolesAndPrimaryChurch(admin, {
      userId: profile.appUser.id,
      roleKeys,
      churchId: primaryLink.church_id,
    });

    if (roleUpdateError) {
      return { message: roleUpdateError };
    }
  }

  revalidatePath("/perfil");
  revalidatePath("/painel");
  revalidatePath("/disponibilidade");

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

export async function deleteUserByAdminAction(formData: FormData) {
  const currentAdmin = await requireAdminUser();
  const userId = readString(formData, "userId");

  if (!userId || userId === currentAdmin.appUser.id) {
    return;
  }

  const admin = createAdminSupabaseClient();
  const { data: user } = await admin
    .from("users")
    .select("auth_user_id")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    return;
  }

  await admin.from("users").delete().eq("id", userId);

  if (user.auth_user_id) {
    await admin.auth.admin.deleteUser(user.auth_user_id);
  }

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
  const roleKeys = normalizeRoleKeys(readStringList(formData, "roleKeys"), { allowAdmin: true });
  const churchId = readString(formData, "churchId");

  if (!userId || !fullName || !phone || !isUserStatus(status) || roleKeys.length === 0 || !churchId) {
    return { message: "Preencha nome, telefone, função, igreja e status." };
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

  const roleUpdateError = await syncUserRolesAndPrimaryChurch(admin, {
    userId,
    roleKeys,
    churchId,
  });

  if (roleUpdateError) {
    return { message: roleUpdateError };
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
  const roleKeys = normalizeRoleKeys(readStringList(formData, "roleKeys"), { allowAdmin: true });
  const churchId = readString(formData, "churchId");
  const password = readString(formData, "password");
  const status = readString(formData, "status") || "approved";

  if (!fullName || !email || !phone || roleKeys.length === 0 || !churchId || !password) {
    return { message: "Preencha todos os campos obrigatórios." };
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

  const rolesError = await syncUserRolesAndPrimaryChurch(admin, {
    userId: profile.id,
    roleKeys,
    churchId,
  });

  if (rolesError) {
    return { message: rolesError };
  }

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

function readStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isUserStatus(status: string): status is UserStatus {
  return ["pending", "approved", "blocked", "inactive"].includes(status);
}

async function syncUserRolesAndPrimaryChurch(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  {
    userId,
    roleKeys,
    churchId,
  }: {
    userId: string;
    roleKeys: RoleKey[];
    churchId: string;
  },
) {
  const validRoleKeys = roleKeys.filter(isRoleKey);

  if (validRoleKeys.length === 0) {
    return "Escolha pelo menos uma função válida.";
  }

  const { data: roles } = await admin
    .from("roles")
    .select("id,key")
    .in("key", validRoleKeys)
    .is("deleted_at", null);

  if (!roles || roles.length !== validRoleKeys.length) {
    return "Uma ou mais funções não foram localizadas.";
  }

  const roleIds = roles.map((role) => role.id);
  const now = new Date().toISOString();

  await admin
    .from("user_roles")
    .update({ deleted_at: now })
    .eq("user_id", userId)
    .not("role_id", "in", `(${roleIds.join(",")})`)
    .is("deleted_at", null);

  await admin
    .from("user_church_links")
    .update({ deleted_at: now })
    .eq("user_id", userId)
    .not("role_id", "in", `(${roleIds.join(",")})`)
    .is("deleted_at", null);

  for (const role of roles) {
    const roleKey = role.key as RoleKey;

    if (isManagerRoleKey(roleKey)) {
      await admin
        .from("user_church_links")
        .update({ deleted_at: now })
        .eq("user_id", userId)
        .eq("role_id", role.id)
        .neq("church_id", churchId)
        .is("deleted_at", null);
    }

    const roleError = await attachRoleAndChurch(admin, {
      userId,
      roleId: role.id,
      roleKey,
      churchId,
    });

    if (roleError) {
      return roleError;
    }
  }

  return null;
}

async function attachRoleAndChurch(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  {
    userId,
    roleId,
    roleKey,
    churchId,
  }: {
    userId: string;
    roleId: string;
    roleKey: RoleKey;
    churchId: string;
  },
) {
  const { data: currentRoleLink } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role_id", roleId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!currentRoleLink) {
    const { error } = await admin.from("user_roles").insert({
      user_id: userId,
      role_id: roleId,
      deleted_at: null,
    });

    if (error) {
      return "Não foi possível atualizar as funções do usuário.";
    }
  }

  const { data: currentChurchLink } = await admin
    .from("user_church_links")
    .select("id")
    .eq("user_id", userId)
    .eq("church_id", churchId)
    .eq("role_id", roleId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!currentChurchLink) {
    const { error } = await admin.from("user_church_links").insert({
      user_id: userId,
      church_id: churchId,
      role_id: roleId,
      can_be_scheduled: false,
      is_manager: isManagerRoleKey(roleKey),
      deleted_at: null,
    });

    if (error) {
      return "Não foi possível atualizar os vínculos de igreja.";
    }
  } else {
    const { error } = await admin
      .from("user_church_links")
      .update({ is_manager: isManagerRoleKey(roleKey) })
      .eq("id", currentChurchLink.id);

    if (error) {
      return "Não foi possível atualizar os vínculos de igreja.";
    }
  }

  return null;
}

function formatPersonName(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)([a-záàâãéêíóôõúç])/g, (match) =>
      match.toLocaleUpperCase("pt-BR"),
    );
}
