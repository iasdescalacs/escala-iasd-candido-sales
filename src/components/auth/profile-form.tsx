"use client";

import { useActionState } from "react";
import { updateProfileAction, type AuthActionState } from "@/lib/auth/actions";
import type { Database } from "@/types/database";
import { ActionMessage } from "./action-message";
import { PhoneInput } from "./phone-input";
import { SubmitButton } from "./submit-button";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type ProfileRole = {
  key: string;
  name: string;
};

const initialState: AuthActionState = { message: "" };

const editableRoles = [
  { key: "pregador", name: "Pregador" },
  { key: "cantor", name: "Cantor" },
] as const;

export function ProfileForm({ roles, user }: { roles: ProfileRole[]; user: UserRow }) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);
  const currentRoles = new Set(roles.map((role) => role.key));

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

      <fieldset className="grid gap-2 text-sm font-medium text-foreground">
        <legend>Funções de escala</legend>
        <div className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-2">
          {editableRoles.map((role) => (
            <label
              className="flex min-h-10 items-center gap-3 rounded-md px-2 text-sm font-medium text-foreground transition hover:bg-surface-muted"
              key={role.key}
            >
              <input
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                defaultChecked={currentRoles.has(role.key)}
                name="roleKeys"
                type="checkbox"
                value={role.key}
              />
              {role.name}
            </label>
          ))}
        </div>
        <span className="text-xs font-normal text-muted">
          Use Disponibilidade para escolher as igrejas onde aceita ser escalado.
        </span>
      </fieldset>

      <SubmitButton>Salvar perfil</SubmitButton>
    </form>
  );
}
