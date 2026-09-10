"use client";

import { Check, Loader2, UserCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { approvePendingUserAction } from "@/lib/auth/actions";
import type { AuthActionState } from "@/lib/auth/actions";
import type { UserApprovalRequest } from "@/lib/auth/approval-queries";

const initialState: AuthActionState = { message: "" };

export function ApprovalRequestsPanel({
  requests,
}: {
  requests: UserApprovalRequest[];
}) {
  const [items, setItems] = useState(requests);
  const [state, setState] = useState(initialState);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function approveUser(userId: string) {
    setPendingUserId(userId);
    setState(initialState);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("userId", userId);

        const result = await approvePendingUserAction(formData);
        setState(result);

        if (result.ok) {
          setItems((currentItems) =>
            currentItems.filter((item) => item.userId !== userId),
          );
        }
      } catch {
        setState({ message: "Não foi possível concluir a ação. Tente novamente." });
      } finally {
        setPendingUserId(null);
      }
    });
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <UserCheck size={18} className="text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Solicitações de aprovação</h2>
        <span className="ml-auto rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-strong">
          {items.length}
        </span>
      </div>
      <ActionMessage state={state} />

      <div className="mt-4 grid gap-3">
        {items.map((request) => (
          <article
            className="grid gap-3 rounded-md border border-border bg-background p-3 text-sm"
            key={`${request.userId}-${request.roleKey}-${request.churchId}`}
          >
            <div className="min-w-0 text-muted">
              <p className="font-semibold text-foreground">{request.userName}</p>
              <p>
                {request.roleName} · {request.churchName}
              </p>
              <p>{request.email}</p>
              {request.phone ? <p>{request.phone}</p> : null}
              <p className="mt-1 text-xs">
                Solicitado em {formatDateTime(request.createdAt)} · {request.requestedBy}
              </p>
            </div>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-success px-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={pendingUserId === request.userId}
              onClick={() => approveUser(request.userId)}
              type="button"
            >
              {pendingUserId === request.userId ? (
                <Loader2 className="animate-spin" size={15} aria-hidden="true" />
              ) : (
                <Check size={15} aria-hidden="true" />
              )}
              {pendingUserId === request.userId ? "Aprovando..." : "Aprovar"}
            </button>
          </article>
        ))}

        {items.length === 0 ? (
          <p className="rounded-md bg-surface-muted p-3 text-sm text-muted">
            Nenhuma solicitação pendente para sua função.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
