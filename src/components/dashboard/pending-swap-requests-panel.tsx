"use client";

import { Loader2, Repeat2 } from "lucide-react";
import { useState, useTransition } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import type { AuthActionState } from "@/lib/auth/actions";
import { reviewSwapRequestAction } from "@/lib/escalas/actions";
import type { SwapRequestSummary } from "@/lib/escalas/queries";

const initialState: AuthActionState = { message: "" };

export function PendingSwapRequestsPanel({
  requests,
}: {
  requests: SwapRequestSummary[];
}) {
  const [items, setItems] = useState(requests);
  const [state, setState] = useState(initialState);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function reviewRequest(requestId: string, decision: "approved" | "rejected") {
    const actionId = `${requestId}:${decision}`;
    setPendingActionId(actionId);
    setState(initialState);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("requestId", requestId);
        formData.set("decision", decision);

        const result = await reviewSwapRequestAction(formData);
        setState(result);

        if (result.ok) {
          setItems((currentItems) =>
            currentItems.filter((item) => item.id !== requestId),
          );
        }
      } catch {
        setState({ message: "Não foi possível concluir a ação. Tente novamente." });
      } finally {
        setPendingActionId(null);
      }
    });
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Repeat2 size={18} className="text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Permutas pendentes</h2>
      </div>
      <ActionMessage state={state} />
      <div className="mt-4 grid gap-3">
        {items.map((request) => {
          const approving = pendingActionId === `${request.id}:approved`;
          const rejecting = pendingActionId === `${request.id}:rejected`;
          const disabled = Boolean(pendingActionId?.startsWith(request.id));

          return (
            <article
              className="grid gap-3 rounded-md border border-border bg-background p-3 text-sm"
              key={request.id}
            >
              <div className="min-w-0 text-muted">
                <p className="font-semibold text-foreground">
                  {request.requester_name} solicitou permuta com {request.target_name}
                </p>
                <p>
                  {request.role_key === "pregador" ? "Pregação" : "Louvor"} ·{" "}
                  {formatDate(request.source_date)} por {formatDate(request.target_date)}
                </p>
                {request.reason ? <p className="mt-1">{request.reason}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-success px-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={disabled}
                  onClick={() => reviewRequest(request.id, "approved")}
                  type="button"
                >
                  {approving ? <Loader2 className="animate-spin" size={15} /> : null}
                  {approving ? "Aprovando..." : "Aprovar"}
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={disabled}
                  onClick={() => reviewRequest(request.id, "rejected")}
                  type="button"
                >
                  {rejecting ? <Loader2 className="animate-spin" size={15} /> : null}
                  {rejecting ? "Recusando..." : "Recusar"}
                </button>
              </div>
            </article>
          );
        })}

        {items.length === 0 ? (
          <p className="rounded-md bg-surface-muted p-3 text-sm text-muted">
            Nenhuma permuta pendente para sua função.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
