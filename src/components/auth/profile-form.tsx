"use client";

import { useActionState } from "react";
import { updateProfileAction, type AuthActionState } from "@/lib/auth/actions";
import type { Database } from "@/types/database";
import { ActionMessage } from "./action-message";
import { PhoneInput } from "./phone-input";
import { SubmitButton } from "./submit-button";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

const initialState: AuthActionState = { message: "" };

export function ProfileForm({ user }: { user: UserRow }) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
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
          <PhoneInput defaultValue={user.phone} />
        </label>
      </div>

      <SubmitButton>Salvar perfil</SubmitButton>
    </form>
  );
}
