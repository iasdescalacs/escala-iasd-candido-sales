"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ChurchOption, RoleOption } from "@/lib/admin/lookups";
import { signUpAction, type AuthActionState } from "@/lib/auth/actions";
import { requiresPrimaryChurch } from "@/lib/auth/role-rules";
import { ActionMessage } from "./action-message";
import { PasswordField } from "./password-field";
import { PhoneInput } from "./phone-input";
import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = { message: "" };

export function SignUpForm({
  roles,
  churches,
}: {
  roles: RoleOption[];
  churches: ChurchOption[];
}) {
  const [state, formAction] = useActionState(signUpAction, initialState);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);
  const [churchId, setChurchId] = useState("");
  const primaryChurchRequired = requiresPrimaryChurch(selectedRoleKeys);
  const missingRequiredOptions =
    roles.length === 0 || (primaryChurchRequired && churches.length === 0);

  function handleRoleChange(roleKey: string, checked: boolean) {
    const nextRoleKeys = checked
      ? [...selectedRoleKeys, roleKey]
      : selectedRoleKeys.filter((selectedRoleKey) => selectedRoleKey !== roleKey);

    setSelectedRoleKeys(nextRoleKeys);

    if (!requiresPrimaryChurch(nextRoleKeys)) {
      setChurchId("");
    }
  }

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

      {missingRequiredOptions ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          O cadastro depende de pelo menos uma igreja ativa cadastrada pelo administrador.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
          Nome completo
          <input
            autoComplete="name"
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="fullName"
            placeholder="Seu nome completo"
            required
            type="text"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          E-mail
          <input
            autoComplete="email"
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            inputMode="email"
            name="email"
            placeholder="seuemail@exemplo.com"
            required
            type="email"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Telefone
          <PhoneInput />
        </label>

        <fieldset className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
          <legend>Funções</legend>
          <div className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-2">
            {roles.map((role) => (
              <label
                className="flex min-h-10 items-center gap-3 rounded-md px-2 text-sm font-medium text-foreground transition hover:bg-surface-muted"
                key={role.id}
              >
                <input
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  checked={selectedRoleKeys.includes(role.key)}
                  disabled={roles.length === 0}
                  name="roleKeys"
                  onChange={(event) => handleRoleChange(role.key, event.target.checked)}
                  type="checkbox"
                  value={role.key}
                />
                {role.name}
              </label>
            ))}
          </div>
          <span className="text-xs font-normal text-muted">
            Selecione uma ou mais funções. O acesso só será liberado após aprovação.
          </span>
        </fieldset>

        <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
          Igreja onde é membro
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={!primaryChurchRequired || churches.length === 0}
            name="churchId"
            onChange={(event) => setChurchId(event.target.value)}
            required={primaryChurchRequired}
            value={churchId}
          >
            <option value="">
              {primaryChurchRequired ? "Selecione" : "Não se aplica ao Pastor"}
            </option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-muted">
            {primaryChurchRequired
              ? "Obrigatória para funções com gestão local."
              : "O Pastor atua em todas as igrejas; igrejas para cantar ou pregar são escolhidas em Disponibilidade."}
          </span>
        </label>

        <PasswordField autoComplete="new-password" label="Senha" name="password" />
        <PasswordField
          autoComplete="new-password"
          label="Confirmar senha"
          name="confirmPassword"
          placeholder="Repita sua senha"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton>Solicitar cadastro</SubmitButton>
        <Link className="text-sm font-medium text-primary hover:text-primary-strong" href="/login">
          Já tenho cadastro
        </Link>
      </div>
    </form>
  );
}
