"use client";

import { useActionState } from "react";
import type { ChurchOption, RoleOption } from "@/lib/admin/lookups";
import {
  createUserByAdminAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { ActionMessage } from "@/components/auth/action-message";
import { PasswordField } from "@/components/auth/password-field";
import { PhoneInput } from "@/components/auth/phone-input";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthActionState = { message: "" };

export function AdminCreateUserForm({
  roles,
  churches,
}: {
  roles: RoleOption[];
  churches: ChurchOption[];
}) {
  const [state, formAction] = useActionState(createUserByAdminAction, initialState);
  const hasOptions = roles.length > 0 && churches.length > 0;

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

      {!hasOptions ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          Cadastre pelo menos uma igreja ativa antes de criar usuários vinculados.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-foreground lg:col-span-2">
          Nome completo
          <input
            autoComplete="name"
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="fullName"
            placeholder="Nome do usuário"
            required
            type="text"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Telefone
          <PhoneInput />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          E-mail
          <input
            autoComplete="email"
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            inputMode="email"
            name="email"
            placeholder="usuario@exemplo.com"
            required
            type="email"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Função
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={!hasOptions}
            name="roleKey"
            required
          >
            <option value="">Selecione</option>
            <option value="admin">Administrador</option>
            {roles.map((role) => (
              <option key={role.id} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Igreja
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={!hasOptions}
            name="churchId"
            required
          >
            <option value="">Selecione</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Status
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="status"
            required
          >
            <option value="approved">Aprovado</option>
            <option value="pending">Pendente</option>
            <option value="blocked">Bloqueado</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>

        <PasswordField autoComplete="new-password" label="Senha inicial" name="password" />
      </div>

      <SubmitButton>Criar usuário</SubmitButton>
    </form>
  );
}
