"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ActionMessage } from "@/components/auth/action-message";
import type { AuthActionState } from "@/lib/auth/actions";
import { clearAllWorshipServicesAction } from "@/lib/cultos/actions";

const initialState: AuthActionState = { message: "" };
const confirmation =
  "Deseja excluir TODOS os cultos? As escalas de pregação e louvor, as disponibilidades por data e as permutas vinculadas também serão removidas. Esta ação não pode ser desfeita.";

export function ClearWorshipServicesForm() {
  const [state, formAction] = useActionState(
    clearAllWorshipServicesAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-red-200 bg-surface p-5 shadow-sm dark:border-red-900/60 sm:flex-row sm:items-center sm:justify-between"
    >
      <ActionMessage state={state} />
      <input name="confirmation" type="hidden" value="delete-all" />
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground">Excluir todos os cultos</h3>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
          Remove todos os cultos, as escalas de pregação e louvor, as permutas e
          as disponibilidades marcadas por data. Igrejas, usuários e igrejas de
          atuação dos voluntários serão preservados.
        </p>
      </div>
      <ClearButton />
    </form>
  );
}

function ClearButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? (
        <Loader2 className="animate-spin" size={17} aria-hidden="true" />
      ) : (
        <Trash2 size={17} aria-hidden="true" />
      )}
      {pending ? "Excluindo..." : "Excluir todos"}
    </button>
  );
}
