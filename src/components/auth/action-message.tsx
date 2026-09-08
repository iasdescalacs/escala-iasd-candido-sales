"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import type { AuthActionState } from "@/lib/auth/actions";

export function ActionMessage({ state }: { state: AuthActionState }) {
  const [closedState, setClosedState] = useState<AuthActionState | null>(null);

  if (!state.message) {
    return null;
  }

  if (closedState === state) {
    return null;
  }

  const Icon = state.ok ? CheckCircle2 : AlertTriangle;

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md sm:inset-x-auto sm:right-4 sm:mx-0">
      <div
        className={`flex items-start gap-3 rounded-lg border bg-surface p-4 text-sm shadow-lg ${
        state.ok
          ? "border-success/40 text-success"
          : "border-warning/40 text-warning"
      }`}
        role="alert"
      >
        <Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
        <p className="min-w-0 flex-1 leading-6">{state.message}</p>
        <button
          aria-label="Fechar aviso"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          onClick={() => setClosedState(state)}
          type="button"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
