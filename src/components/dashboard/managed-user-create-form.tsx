"use client";

import { ChevronDown, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { PasswordField } from "@/components/auth/password-field";
import { PhoneInput } from "@/components/auth/phone-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { createUserByManagerAction, type AuthActionState } from "@/lib/auth/actions";
import type { ManagedUserCreationContext } from "@/lib/auth/approval-queries";

const initialState: AuthActionState = { message: "" };

const roleLabels = {
  cantor: "Cantor",
  pregador: "Pregador",
} as const;

export function ManagedUserCreateForm({
  context,
}: {
  context: ManagedUserCreationContext;
}) {
  const [state, formAction] = useActionState(createUserByManagerAction, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const canCreate = context.allowedChurches.length > 0 && context.allowedRoles.length > 0;

  if (!canCreate) {
    return null;
  }

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface shadow-sm">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-surface-muted"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <UserPlus size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-foreground">Cadastrar pessoa</span>
            <span className="block truncate text-sm text-muted">
              Criar pregador ou cantor dentro das igrejas que você gerencia.
            </span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`}
          size={18}
        />
      </button>

      {isOpen ? (
        <form action={formAction} className="grid gap-4 border-t border-border p-5">
          <ActionMessage state={state} />

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground lg:col-span-2">
              Nome completo
              <input
                autoComplete="name"
                className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                name="fullName"
                placeholder="Nome da pessoa"
                required
                type="text"
              />
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
              Telefone
              <PhoneInput />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground lg:col-span-2">
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

            <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
              Igreja
              <select
                className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                name="churchId"
                required
              >
                <option value="">Selecione</option>
                {context.allowedChurches.map((church) => (
                  <option key={church.id} value={church.id}>
                    {church.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
            <legend>Funções</legend>
            <div className="flex min-h-11 flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-border bg-background px-3 py-2">
              {context.allowedRoles.map((roleKey) => (
                <label className="flex min-h-7 items-center gap-2 text-sm" key={roleKey}>
                  <input
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    name="roleKeys"
                    type="checkbox"
                    value={roleKey}
                  />
                  {roleLabels[roleKey]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <PasswordField autoComplete="new-password" label="Senha inicial" name="password" />
            <PasswordField
              autoComplete="new-password"
              label="Digite a senha novamente"
              name="confirmPassword"
            />
          </div>

          <SubmitButton>Criar e aprovar</SubmitButton>
        </form>
      ) : null}
    </section>
  );
}
