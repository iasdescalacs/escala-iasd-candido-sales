"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function ConfirmSubmitButton({
  children,
  confirmation,
}: {
  children: string;
  confirmation: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
      {pending ? "Limpando..." : children}
    </button>
  );
}
