"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto ${className}`}
      disabled={pending}
      type="submit"
    >
      {pending ? <Loader2 className="animate-spin" size={18} /> : null}
      {pending ? "Aguarde..." : children}
    </button>
  );
}
