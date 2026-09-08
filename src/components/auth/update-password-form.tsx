"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { ActionMessage } from "./action-message";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = { message: "" };

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />
      <PasswordField autoComplete="new-password" label="Nova senha" name="password" />
      <PasswordField
        autoComplete="new-password"
        label="Confirmar nova senha"
        name="confirmPassword"
        placeholder="Repita a nova senha"
      />
      <SubmitButton>Alterar senha</SubmitButton>
    </form>
  );
}
