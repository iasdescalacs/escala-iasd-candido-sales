import { CalendarDays, Church, ShieldCheck, UsersRound } from "lucide-react";
import { requireApprovedUser } from "@/lib/auth/session";

export default async function PainelPage() {
  const profile = await requireApprovedUser();
  const roles = profile.roles.map((role) => role.name).join(", ") || "Sem função";
  const activeRole = profile.activeRole?.name ?? "Permissões cadastradas";

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
      icon: ShieldCheck,
      title: "Acesso ativo",
      value: activeRole,
      description: "A função escolhida no login é validada antes de abrir o painel.",
    },
    {
      icon: CalendarDays,
      title: "Agenda",
      value: "Em breve",
      description: "A disponibilidade e as escalas serão implementadas em etapa futura.",
    },
    {
      icon: Church,
      title: "Igrejas",
      value: "Em breve",
      description: "Os vínculos com igrejas serão usados nas próximas etapas.",
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
          Este painel já exige login e cadastro aprovado. As funções completas de
          escala serão criadas nas próximas etapas autorizadas.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
