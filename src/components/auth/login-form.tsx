"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { ActionMessage } from "./action-message";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("mensagem") ?? "";
  const [state, formAction] = useActionState(loginAction, {
    message,
  });

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

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

      <PasswordField autoComplete="current-password" label="Senha" name="password" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton>Entrar</SubmitButton>
        <Link className="text-sm font-medium text-primary hover:text-primary-strong" href="/recuperar-senha">
          Esqueci minha senha
        </Link>
      </div>

      <p className="text-sm text-muted">
        Ainda não tem acesso?{" "}
        <Link className="font-medium text-primary hover:text-primary-strong" href="/cadastro">
          Solicitar cadastro
        </Link>
      </p>
    </form>
  );
}
