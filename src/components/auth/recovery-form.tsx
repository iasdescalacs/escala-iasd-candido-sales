"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordRecoveryAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { ActionMessage } from "./action-message";
import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = { message: "" };

export function RecoveryForm() {
  const [state, formAction] = useActionState(
    requestPasswordRecoveryAction,
    initialState,
  );

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton>Enviar instruções</SubmitButton>
        <Link className="text-sm font-medium text-primary hover:text-primary-strong" href="/login">
          Voltar ao login
        </Link>
      </div>
    </form>
  );
}
