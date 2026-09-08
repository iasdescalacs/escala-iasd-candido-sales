"use client";

import { useFormStatus } from "react-dom";
import {
  deleteUserByAdminAction,
  updateUserStatusAction,
} from "@/lib/auth/actions";

const actions = [
  { label: "Aprovar", loadingLabel: "Aprovando...", status: "approved", tone: "primary" },
  { label: "Bloquear", loadingLabel: "Bloqueando...", status: "blocked", tone: "warning" },
  { label: "Inativar", loadingLabel: "Inativando...", status: "inactive", tone: "muted" },
] as const;

type UserStatus = "pending" | "approved" | "blocked" | "inactive";

export function UserStatusActions({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: UserStatus;
}) {
  const availableActions = actions.filter((action) => action.status !== currentStatus);

  return (
    <div className="flex flex-wrap gap-2">
      {availableActions.map((action) => (
        <form
          action={updateUserStatusAction}
          key={action.status}
          onSubmit={(event) => {
            if (
              action.status !== "approved" &&
              !window.confirm(`Confirmar ação: ${action.label.toLowerCase()} usuário?`)
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="userId" type="hidden" value={userId} />
          <input name="status" type="hidden" value={action.status} />
          <StatusButton action={action} />
        </form>
      ))}
      <form
        action={deleteUserByAdminAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Deseja mesmo excluir este usuário? Os vínculos dele com outras tabelas serão removidos.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input name="userId" type="hidden" value={userId} />
        <DeleteButton />
      </form>
    </div>
  );
}

function StatusButton({ action }: { action: (typeof actions)[number] }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`h-9 rounded-md px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${getToneClass(
        action.tone,
      )}`}
      disabled={pending}
      type="submit"
    >
      {pending ? action.loadingLabel : action.label}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-9 rounded-md border border-red-500/50 bg-red-500/10 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:text-red-300"
      disabled={pending}
      type="submit"
    >
      {pending ? "Excluindo..." : "Excluir"}
    </button>
  );
}

function getToneClass(tone: (typeof actions)[number]["tone"]) {
  if (tone === "primary") {
    return "bg-primary text-white hover:bg-primary-strong";
  }

  if (tone === "warning") {
    return "border border-warning/50 bg-warning/10 text-warning hover:bg-warning/20";
  }

  return "border border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground";
}
