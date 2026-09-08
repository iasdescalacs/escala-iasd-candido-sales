export type AppUserStatus = "pending" | "approved" | "blocked" | "inactive";

export type AccessProfile = {
  status: AppUserStatus | null;
  roles: string[];
};

export type AccessDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "not_authenticated"
        | "profile_missing"
        | "pending"
        | "blocked"
        | "inactive"
        | "admin_required";
    };

type AccessDeniedReason = Extract<AccessDecision, { allowed: false }>["reason"];

export function decideProtectedAccess(
  profile: AccessProfile | null,
  options: { requireAdmin?: boolean } = {},
): AccessDecision {
  if (!profile) {
    return { allowed: false, reason: "not_authenticated" };
  }

  if (!profile.status) {
    return { allowed: false, reason: "profile_missing" };
  }

  if (profile.status === "pending") {
    return { allowed: false, reason: "pending" };
  }

  if (profile.status === "blocked") {
    return { allowed: false, reason: "blocked" };
  }

  if (profile.status === "inactive") {
    return { allowed: false, reason: "inactive" };
  }

  if (options.requireAdmin && !profile.roles.includes("admin")) {
    return { allowed: false, reason: "admin_required" };
  }

  return { allowed: true };
}

export function accessReasonToLoginMessage(reason: AccessDeniedReason) {
  const messages: Record<AccessDeniedReason, string> = {
    not_authenticated: "Entre para acessar o sistema.",
    profile_missing: "Cadastro do usuário não localizado.",
    pending: "Seu cadastro ainda está aguardando aprovação.",
    blocked: "Seu acesso está bloqueado. Procure a administração.",
    inactive: "Seu acesso está inativo. Procure a administração.",
    admin_required: "Você não tem permissão para acessar essa área.",
  };

  return messages[reason];
}
