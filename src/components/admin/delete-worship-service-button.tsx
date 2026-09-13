"use client";

import { Loader2, X } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ActionMessage } from "@/components/auth/action-message";
import type { AuthActionState } from "@/lib/auth/actions";
import { deleteWorshipServiceAction } from "@/lib/cultos/actions";

const initialState: AuthActionState = { message: "" };

export function DeleteWorshipServiceButton({
  description,
  serviceId,
}: {
  description: string;
  serviceId: string;
}) {
  const [state, formAction] = useActionState(
    deleteWorshipServiceAction,
    initialState,
  );

  return (
    <form action={formAction} className="shrink-0">
      <ActionMessage state={state} />
      <input name="serviceId" type="hidden" value={serviceId} />
      <DeleteButton description={description} />
    </form>
  );
}

function DeleteButton({ description }: { description: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      aria-label={`Excluir ${description}`}
      className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-600 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      onClick={(event) => {
        const confirmed = window.confirm(
          `Deseja excluir ${description}? As escalas e permutas vinculadas a este culto também serão removidas.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      title="Excluir culto"
      type="submit"
    >
      {pending ? (
        <Loader2 className="animate-spin" size={12} aria-hidden="true" />
      ) : (
        <X size={12} strokeWidth={3} aria-hidden="true" />
      )}
    </button>
  );
}
