"use client";

import { useActionState } from "react";
import { createChurchAction, type AuthActionState } from "@/lib/auth/actions";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthActionState = { message: "" };

export function ChurchForm() {
  const [state, formAction] = useActionState(createChurchAction, initialState);

  return (
    <form
      action={formAction}
      className="grid min-w-0 gap-4 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6"
    >
      <ActionMessage state={state} />

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(4.5rem,6rem)]">
        <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
          Nome da igreja
          <input
            className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="name"
            placeholder="IASD Central"
            required
            type="text"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
          Cidade
          <input
            className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue="Candido Sales"
            name="city"
            required
            type="text"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground sm:max-lg:max-w-28">
          UF
          <input
            className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue="BA"
            maxLength={2}
            name="state"
            required
            type="text"
          />
        </label>
      </div>

      <SubmitButton className="justify-self-stretch sm:justify-self-start">
        Criar igreja
      </SubmitButton>
    </form>
  );
}
