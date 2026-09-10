import Link from "next/link";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Repeat2 } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/common/confirm-submit-button";
import { PdfDownloadButton } from "@/components/pdf/pdf-download-button";
import { AgendaCalendar } from "@/components/schedule/agenda-calendar";
import {
  buildCalendarDays,
  getAdjacentMonth,
  getMonthName,
  getTemplateLabel,
} from "@/lib/cultos/schedule";
import {
  clearAgendaNotificationsAction,
  clearAgendaSwapRequestsAction,
} from "@/lib/escalas/actions";
import { getUserAgendaPageData } from "@/lib/escalas/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const serviceVerse =
  "Servi uns aos outros, cada um conforme o dom que recebeu. 1 Pedro 4:10";

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
  const calendarDays = buildCalendarDays(year, month);
  const isAdmin = data.profile.roles.some((role) => role.key === "admin");

  return (
    <div className="mx-auto w-full max-w-7xl overflow-hidden px-3 py-8 sm:px-6 lg:px-8">
      <section className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Minha agenda
        </p>
        <div className="mt-3 flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold text-foreground">
              Escalas e permutas
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              Consulte suas escalas de pregação e louvor e solicite permuta com outra pessoa da mesma função.
            </p>
            <p className="mt-2 text-sm font-semibold text-primary">{monthLabel}</p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            <PdfDownloadButton
              calendar={{
                events: buildAgendaPdfEvents(data.agenda),
                month,
                year,
              }}
              fileName={`minha-agenda-${year}-${String(month).padStart(2, "0")}.pdf`}
              subtitle={monthLabel}
              title="Minha agenda"
              verse={serviceVerse}
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

      <section className="mt-6 grid min-w-0 gap-4">
        <SwapRequestsSummary isAdmin={isAdmin} requests={data.swapRequests} />
        <AgendaCalendar
          agenda={data.agenda}
          calendarDays={calendarDays}
          swapTargets={data.swapTargets}
        />
        <NotificationsPanel isAdmin={isAdmin} notifications={data.notifications} />
      </section>

      {data.agenda.length === 0 ? (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted shadow-sm">
          <CalendarDays size={18} aria-hidden="true" />
          Nenhuma escala encontrada para este mês.
        </div>
      ) : null}
    </div>
  );
}

function NotificationsPanel({
  isAdmin,
  notifications,
}: {
  isAdmin: boolean;
  notifications: Awaited<ReturnType<typeof getUserAgendaPageData>>["notifications"];
}) {
  return (
    <details className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-sm">
      <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 text-lg font-semibold text-foreground">
        <Bell size={18} className="text-primary" aria-hidden="true" />
        <span className="min-w-0 truncate">Notificações</span>
        <span className="ml-auto rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-strong">
          {notifications.length}
        </span>
      </summary>
      {isAdmin && notifications.length > 0 ? (
        <form action={clearAgendaNotificationsAction} className="mt-3">
          <ConfirmSubmitButton confirmation="Deseja limpar as notificações exibidas na sua agenda?">
            Limpar notificações
          </ConfirmSubmitButton>
        </form>
      ) : null}
      <div className="mt-3 grid gap-2">
        {notifications.map((notification) => (
          <article className="min-w-0 rounded-md border border-border bg-background p-3 text-sm" key={notification.id}>
            <p className="font-semibold text-foreground">{notification.title}</p>
            <p className="mt-1 break-words text-muted">{notification.body}</p>
          </article>
        ))}
        {notifications.length === 0 ? (
          <p className="rounded-md bg-surface-muted p-3 text-sm text-muted">
            Nenhuma notificação recente.
          </p>
        ) : null}
      </div>
    </details>
  );
}

function SwapRequestsSummary({
  isAdmin,
  requests,
}: {
  isAdmin: boolean;
  requests: Awaited<ReturnType<typeof getUserAgendaPageData>>["swapRequests"];
}) {
  return (
    <details className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-sm">
      <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 text-lg font-semibold text-foreground">
        <Repeat2 size={18} className="text-primary" aria-hidden="true" />
        <span className="min-w-0 truncate">Permutas</span>
        <span className="ml-auto rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-strong">
          {requests.length}
        </span>
      </summary>
      {isAdmin && requests.length > 0 ? (
        <form action={clearAgendaSwapRequestsAction} className="mt-3">
          <ConfirmSubmitButton confirmation="Deseja limpar as permutas exibidas na sua agenda?">
            Limpar permutas
          </ConfirmSubmitButton>
        </form>
      ) : null}
      <div className="mt-3 grid gap-2">
        {requests.slice(0, 4).map((request) => (
          <article className="min-w-0 rounded-md border border-border bg-background p-3 text-sm" key={request.id}>
            <p className="font-semibold text-foreground">
              {request.role_key === "pregador" ? "Pregação" : "Louvor"} · {statusLabel(request.status)}
            </p>
            <p className="mt-1 break-words text-muted">
              {request.requester_name} solicitou permuta com {request.target_name}
            </p>
            <p className="mt-1 text-muted">
              {formatDate(request.source_date)} por {formatDate(request.target_date)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Solicitada em {formatDateTime(request.created_at)}
            </p>
          </article>
        ))}
        {requests.length === 0 ? (
          <p className="rounded-md bg-surface-muted p-3 text-sm text-muted">
            Nenhuma permuta registrada até agora.
          </p>
        ) : null}
      </div>
    </details>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "approved") {
    return "aprovada";
  }

  if (status === "rejected") {
    return "recusada";
  }

  return "pendente";
}

function buildAgendaPdfEvents(
  agenda: Awaited<ReturnType<typeof getUserAgendaPageData>>["agenda"],
) {
  return agenda.map((item) => ({
    date: item.service_date,
    title: item.roleKey === "pregador" ? "Pregação" : "Louvor",
    lines: [
      item.church_name,
      item.roleKey === "pregador"
        ? `Pregador: ${item.preacher_name ?? "A definir"}`
        : `Louvor: ${item.singer_name ?? "A definir"}`,
      item.title ?? getTemplateLabel(item.service_type),
      formatDate(item.service_date),
    ],
  }));
}
