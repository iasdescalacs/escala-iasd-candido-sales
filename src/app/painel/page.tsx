import { CalendarDays, Church, UsersRound } from "lucide-react";

const cards = [
  {
    icon: CalendarDays,
    title: "Agenda",
    value: "Provisória",
    description: "Área reservada para futuras escalas e disponibilidade.",
  },
  {
    icon: UsersRound,
    title: "Perfis",
    value: "Planejados",
    description: "Admin, ancião, líder de música, pregador e cantor.",
  },
  {
    icon: Church,
    title: "Igrejas",
    value: "Em estruturação",
    description: "Vínculos entre igrejas e pessoas serão definidos depois.",
  },
];

export default function PainelPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Painel
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Painel provisório
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Esta página existe apenas para validar a estrutura inicial de rotas,
          layout e navegação. Nenhum dado real ou autenticação foi criado ainda.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="rounded-lg border border-border bg-surface p-5 shadow-sm"
              key={card.title}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">{card.title}</h2>
                  <p className="text-sm text-primary">{card.value}</p>
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
