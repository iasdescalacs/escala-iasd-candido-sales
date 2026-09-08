"use client";

import { useActionState } from "react";
import { createChurchAction, type AuthActionState } from "@/lib/auth/actions";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthActionState = { message: "" };

export function ChurchForm() {
  const [state, formAction] = useActionState(createChurchAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_90px]">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          Nome da igreja
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="name"
            placeholder="IASD Central"
            required
            type="text"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Cidade
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue="Candido Sales"
            name="city"
            required
            type="text"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          UF
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue="BA"
            maxLength={2}
            name="state"
            required
            type="text"
          />
        </label>
      </div>

      <SubmitButton>Criar igreja</SubmitButton>
    </form>
  );
}
