import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PdfDownloadButton } from "@/components/pdf/pdf-download-button";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import {
  buildCalendarDays,
  getAdjacentMonth,
  getMonthName,
  getTemplateLabel,
} from "@/lib/cultos/schedule";
import type { ScheduleChurch, ScheduleService } from "@/lib/escalas/queries";
import { getSchedulePageData } from "@/lib/escalas/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const serviceVerse =
  "Servi uns aos outros, cada um conforme o dom que recebeu. 1 Pedro 4:10";

export default async function EscalaPregacaoPage({
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
  const data = await getSchedulePageData({
    managerRoleKey: "anciao",
    scheduleRoleKey: "pregador",
    monthStart,
    monthEnd,
  });

  if (!data.allowed) {
    return <AccessDenied />;
  }
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header
        description="Escolha pregadores disponíveis por culto e igreja. Ao salvar novamente no mesmo dia, a escala é trocada."
        month={month}
        nextHref={`/escalas/pregacao?mes=${next.month}&ano=${next.year}`}
        previousHref={`/escalas/pregacao?mes=${previous.month}&ano=${previous.year}`}
        pdfCalendar={{
          events: buildSchedulePdfEvents(data.services, data.churches),
          month,
          year,
        }}
        title="Escala de pregação"
        year={year}
      />

      <div className="mt-6">
        <ScheduleCalendar
          calendarDays={buildCalendarDays(year, month)}
          churches={data.churches}
          roleKey="pregador"
          services={data.services}
          swapRequests={data.swapRequests}
          title="Cultos do mês"
          volunteers={data.volunteers}
        />
      </div>
    </div>
  );
}

function Header({
  description,
  month,
  nextHref,
  pdfCalendar,
  previousHref,
  title,
  year,
}: {
  description: string;
  month: number;
  nextHref: string;
  pdfCalendar: Parameters<typeof PdfDownloadButton>[0]["calendar"];
  previousHref: string;
  title: string;
  year: number;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        Escalas
      </p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted">{description}</p>
          <p className="mt-2 text-sm font-semibold text-primary">
            {capitalize(getMonthName(month))} de {year}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PdfDownloadButton
            calendar={pdfCalendar}
            fileName={`escala-pregacao-${year}-${String(month).padStart(2, "0")}.pdf`}
            subtitle={`${capitalize(getMonthName(month))} de ${year}`}
            title={title}
            verse={serviceVerse}
          />
          <CalendarLink href={previousHref} label="Mês anterior" position="previous" />
          <CalendarLink href={nextHref} label="Próximo mês" position="next" />
        </div>
      </div>
    </section>
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

function AccessDenied() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 text-muted shadow-sm">
        Você precisa ser ancião vinculado a uma igreja, ou administrador, para gerenciar a escala de pregação.
      </section>
    </div>
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

function buildSchedulePdfEvents(
  services: ScheduleService[],
  churches: ScheduleChurch[],
) {
  const churchMap = new Map(churches.map((church) => [church.id, church]));

  return services.map((service) => {
    const church = churchMap.get(service.church_id);

    return {
      date: service.service_date,
      title: service.start_time.slice(0, 5),
      lines: [
        church ? `${church.name} - ${church.city}/${church.state}` : "Igreja",
        `Pregador: ${service.preacher_name ?? "A definir"}`,
        `Louvor: ${service.singer_name ?? "A definir"}`,
        service.title ?? getTemplateLabel(service.service_type),
      ],
    };
  });
}
