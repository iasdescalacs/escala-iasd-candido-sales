"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-surface-muted"
        type="submit"
      >
        <LogOut size={16} aria-hidden="true" />
        Sair
      </button>
    </form>
  );
}
