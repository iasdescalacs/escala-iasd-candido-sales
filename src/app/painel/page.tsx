import { CalendarDays, Church, Repeat2, ShieldCheck, UsersRound } from "lucide-react";
import { requireApprovedUser } from "@/lib/auth/session";
import { reviewSwapRequestAction } from "@/lib/escalas/actions";
import {
  getPanelPendingSwapRequests,
  type SwapRequestSummary,
} from "@/lib/escalas/queries";

export default async function PainelPage() {
  const profile = await requireApprovedUser();
  const roles = profile.roles.map((role) => role.name).join(", ") || "Sem função";
  const roleKeys = profile.roles.map((role) => role.key);
  const canReviewSwaps =
    roleKeys.includes("admin") ||
    roleKeys.includes("anciao") ||
    roleKeys.includes("lider_musica");
  const pendingSwapRequests = canReviewSwaps
    ? await getPanelPendingSwapRequests(profile)
    : [];

  const cards = [
    {
      icon: ShieldCheck,
      title: "Status",
      value: "Aprovado",
      description: "Seu acesso está liberado para as áreas do seu perfil.",
    },
    {
      icon: UsersRound,
      title: "Funções",
      value: roles,
      description: "As permissões são verificadas no servidor e no banco.",
    },
    {
      icon: CalendarDays,
      title: "Agenda",
      value: "Disponível",
      description: "Consulte suas escalas, disponibilidade e permutas.",
    },
    {
      icon: Church,
      title: "Igrejas",
      value: "Vínculos",
      description: "Os vínculos com igrejas definem as áreas liberadas.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Painel
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Olá, {profile.appUser.full_name}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Acompanhe suas informações principais e as ações pendentes conforme suas funções.
        </p>
      </section>

      {canReviewSwaps ? (
        <PendingSwapRequests requests={pendingSwapRequests} />
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="rounded-lg border border-border bg-surface p-5 shadow-sm"
              key={card.title}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">{card.title}</h2>
                  <p className="break-words text-sm text-primary">{card.value}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function PendingSwapRequests({ requests }: { requests: SwapRequestSummary[] }) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Repeat2 size={18} className="text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Permutas pendentes</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {requests.map((request) => (
          <article
            className="grid gap-3 rounded-md border border-border bg-background p-3 text-sm md:grid-cols-[1fr_auto]"
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
              <form action={reviewSwapRequestAction}>
                <input name="requestId" type="hidden" value={request.id} />
                <input name="decision" type="hidden" value="approved" />
                <button className="h-9 rounded-md bg-success px-3 text-sm font-semibold text-white transition hover:brightness-95" type="submit">
                  Aprovar
                </button>
              </form>
              <form action={reviewSwapRequestAction}>
                <input name="requestId" type="hidden" value={request.id} />
                <input name="decision" type="hidden" value="rejected" />
                <button className="h-9 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted" type="submit">
                  Recusar
                </button>
              </form>
            </div>
          </article>
        ))}

        {requests.length === 0 ? (
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
