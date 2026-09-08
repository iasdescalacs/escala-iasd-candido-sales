"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthActionState } from "@/lib/auth/actions";
import { ActionMessage } from "./action-message";
import { PasswordField } from "./password-field";
import { PhoneInput } from "./phone-input";
import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = { message: "" };

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

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
