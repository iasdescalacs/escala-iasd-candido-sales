import { Check, UserCheck } from "lucide-react";
import { approvePendingUserAction } from "@/lib/auth/actions";
import type { UserApprovalRequest } from "@/lib/auth/approval-queries";

export function ApprovalRequestsPanel({
  requests,
}: {
  requests: UserApprovalRequest[];
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <UserCheck size={18} className="text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Solicitações de aprovação</h2>
        <span className="ml-auto rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-strong">
          {requests.length}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {requests.map((request) => (
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
            <form action={approvePendingUserAction}>
              <input name="userId" type="hidden" value={request.userId} />
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-success px-3 text-sm font-semibold text-white transition hover:brightness-95"
                type="submit"
              >
                <Check size={15} aria-hidden="true" />
                Aprovar
              </button>
            </form>
          </article>
        ))}

        {requests.length === 0 ? (
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
