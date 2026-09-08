"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { PhoneInput } from "@/components/auth/phone-input";
import { SubmitButton } from "@/components/auth/submit-button";
import type { ChurchOption, RoleOption } from "@/lib/admin/lookups";
import {
  updateUserByAdminAction,
  type AuthActionState,
} from "@/lib/auth/actions";

const initialState: AuthActionState = { message: "" };

type UserStatus = "pending" | "approved" | "blocked" | "inactive";

export function AdminEditUserForm({
  churches,
  currentChurchId,
  currentRoleKeys,
  roles,
  user,
}: {
  churches: ChurchOption[];
  currentChurchId: string;
  currentRoleKeys: string[];
  roles: RoleOption[];
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    status: UserStatus;
  };
}) {
  const [state, formAction] = useActionState(updateUserByAdminAction, initialState);
  const selectedRoles = new Set(currentRoleKeys);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

      <input name="userId" type="hidden" value={user.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          Nome completo
          <input
            autoComplete="name"
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={user.full_name}
            name="fullName"
            required
            type="text"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Telefone
          <PhoneInput defaultValue={user.phone ?? ""} />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          E-mail
          <input
            className="h-11 rounded-md border border-border bg-surface-muted px-3 text-muted outline-none"
            disabled
            value={user.email}
            type="email"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Igreja principal
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={currentChurchId}
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

        <fieldset className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
          <legend>Funções</legend>
          <div className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-2">
            {roles.map((role) => (
              <label
                className="flex min-h-10 items-center gap-3 rounded-md px-2 text-sm font-medium text-foreground transition hover:bg-surface-muted"
                key={role.id}
              >
                <input
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  defaultChecked={selectedRoles.has(role.key)}
                  name="roleKeys"
                  type="checkbox"
                  value={role.key}
                />
                {role.name}
              </label>
            ))}
          </div>
          <span className="text-xs font-normal text-muted">
            Ancião e líder de música ficam vinculados à igreja principal. Pregador e cantor escolhem igrejas de escala em Disponibilidade.
          </span>
        </fieldset>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Status
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={user.status}
            name="status"
            required
          >
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="blocked">Bloqueado</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton>Salvar alterações</SubmitButton>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
          href="/admin/usuarios"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}
