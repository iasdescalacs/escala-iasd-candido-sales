import { CalendarDays, Church, ShieldCheck, UsersRound } from "lucide-react";
import { ApprovalRequestsPanel } from "@/components/dashboard/approval-requests-panel";
import { ManagedUserCreateForm } from "@/components/dashboard/managed-user-create-form";
import { PendingSwapRequestsPanel } from "@/components/dashboard/pending-swap-requests-panel";
import { getUserApprovalDashboardData } from "@/lib/auth/approval-queries";
import { requireApprovedUser } from "@/lib/auth/session";
import { getPanelPendingSwapRequests } from "@/lib/escalas/queries";

export default async function PainelPage() {
  const profile = await requireApprovedUser();
  const roles = profile.roles.map((role) => role.name).join(", ") || "Sem função";
  const roleKeys = profile.roles.map((role) => role.key);
  const canReviewSwaps =
    roleKeys.includes("admin") ||
    roleKeys.includes("anciao") ||
    roleKeys.includes("lider_musica");
  const canManageApprovals =
    roleKeys.includes("admin") ||
    roleKeys.includes("anciao") ||
    roleKeys.includes("lider_musica");
  const [pendingSwapRequests, approvalData] = await Promise.all([
    canReviewSwaps ? getPanelPendingSwapRequests(profile) : Promise.resolve([]),
    canManageApprovals
      ? getUserApprovalDashboardData(profile)
      : Promise.resolve({
          creationContext: { allowedChurches: [], allowedRoles: [] },
          requests: [],
        }),
  ]);

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
    <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Painel
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground sm:mt-3 sm:text-3xl">
          Olá, {profile.appUser.full_name}
        </h1>
        <p className="mt-3 hidden max-w-3xl leading-7 text-muted sm:block">
          Acompanhe suas informações principais e as ações pendentes conforme suas funções.
        </p>
      </section>

      {canReviewSwaps || canManageApprovals ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {canReviewSwaps ? (
            <PendingSwapRequestsPanel requests={pendingSwapRequests} />
          ) : null}

          {canManageApprovals ? (
            <ApprovalRequestsPanel requests={approvalData.requests} />
          ) : null}
        </div>
      ) : null}

      {canManageApprovals ? (
        <ManagedUserCreateForm context={approvalData.creationContext} />
      ) : null}

      <section className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="min-w-0 rounded-lg border border-border bg-surface p-3 shadow-sm sm:p-5"
              key={card.title}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary sm:h-10 sm:w-10">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground sm:text-base">
                    {card.title}
                  </h2>
                  <p className="break-words text-xs text-primary sm:text-sm">
                    {card.value}
                  </p>
                </div>
              </div>
              <p className="mt-4 hidden text-sm leading-6 text-muted sm:block">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
