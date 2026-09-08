import Link from "next/link";
import { Bell, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { PdfDownloadButton } from "@/components/pdf/pdf-download-button";
import { AgendaCalendar } from "@/components/schedule/agenda-calendar";
import { SwapRequestForm } from "@/components/schedule/swap-request-form";
import {
  buildCalendarDays,
  getAdjacentMonth,
  getMonthName,
  getTemplateLabel,
} from "@/lib/cultos/schedule";
import { getUserAgendaPageData } from "@/lib/escalas/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const today = new Date();
  const year = parseNumberParam(params.ano, today.getFullYear());
  const month = normalizeMonth(parseNumberParam(params.mes, today.getMonth() + 1));
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    new Date(Date.UTC(year, month, 0)).getUTCDate(),
  ).padStart(2, "0")}`;
  const previous = getAdjacentMonth(year, month, -1);
  const next = getAdjacentMonth(year, month, 1);
  const data = await getUserAgendaPageData({ monthStart, monthEnd });
  const monthLabel = `${capitalize(getMonthName(month))} de ${year}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Minha agenda
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Escalas e permutas
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              Consulte suas escalas de pregação e louvor e solicite permuta com outra pessoa da mesma função.
            </p>
            <p className="mt-2 text-sm font-semibold text-primary">{monthLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PdfDownloadButton
              fileName={`minha-agenda-${year}-${String(month).padStart(2, "0")}.pdf`}
              sections={buildAgendaPdfSections(data.agenda)}
              subtitle={monthLabel}
              title="Minha agenda"
            />
            <CalendarLink
              href={`/agenda?mes=${previous.month}&ano=${previous.year}`}
              label="Mês anterior"
              position="previous"
            />
            <CalendarLink
              href={`/agenda?mes=${next.month}&ano=${next.year}`}
              label="Próximo mês"
              position="next"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.55fr]">
        <AgendaCalendar agenda={data.agenda} calendarDays={buildCalendarDays(year, month)} />

        <aside className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
          </div>
          <div className="mt-3 grid gap-2">
            {data.notifications.map((notification) => (
              <article className="rounded-md border border-border bg-background p-3 text-sm" key={notification.id}>
                <p className="font-semibold text-foreground">{notification.title}</p>
                <p className="mt-1 text-muted">{notification.body}</p>
              </article>
            ))}
            {data.notifications.length === 0 ? (
              <p className="rounded-md bg-surface-muted p-3 text-sm text-muted">
                Nenhuma notificação recente.
              </p>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Minhas escalas</h2>
        {data.agenda.map((item) => (
          <article className="grid gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm lg:grid-cols-[1fr_1fr]" key={`${item.id}-${item.roleKey}`}>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {item.roleKey === "pregador" ? "Pregação" : "Louvor"}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {formatDate(item.service_date)} · {item.start_time.slice(0, 5)}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {item.church_name} · {item.title ?? getTemplateLabel(item.service_type)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Local: {item.church_name} - {item.church_city}/{item.church_state}
              </p>
            </div>
            <SwapRequestForm item={item} targets={data.swapTargets} />
          </article>
        ))}
        {data.agenda.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted shadow-sm">
            <CalendarDays size={18} aria-hidden="true" />
            Nenhuma escala encontrada para este mês.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CalendarLink({
  href,
  label,
  position,
}: {
  href: string;
  label: string;
  position: "previous" | "next";
}) {
  return (
    <Link
      className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
      href={href}
    >
      {position === "previous" ? <ChevronLeft size={16} aria-hidden="true" /> : null}
      <span className="hidden sm:inline">{label}</span>
      {position === "next" ? <ChevronRight size={16} aria-hidden="true" /> : null}
    </Link>
  );
}

function parseNumberParam(
  value: string | string[] | undefined,
  fallback: number,
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMonth(month: number) {
  return Math.min(12, Math.max(1, month));
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function buildAgendaPdfSections(
  agenda: Awaited<ReturnType<typeof getUserAgendaPageData>>["agenda"],
) {
  return [
    {
      title: "Escalas do mês",
      rows: agenda.map((item) => [
        { label: "Data", value: formatDate(item.service_date) },
        { label: "Horário", value: item.start_time.slice(0, 5) },
        { label: "Função", value: item.roleKey === "pregador" ? "Pregação" : "Louvor" },
        { label: "Igreja", value: `${item.church_name} - ${item.church_city}/${item.church_state}` },
        { label: "Pregador", value: item.preacher_name ?? "A definir" },
        { label: "Louvor", value: item.singer_name ?? "A definir" },
      ]),
    },
  ];
}
