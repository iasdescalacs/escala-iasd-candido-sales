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

export default async function EscalaLouvorPage({
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
  const requestedChurchId = readStringParam(params.igreja);
  const data = await getSchedulePageData({
    managerRoleKey: "lider_musica",
    scheduleRoleKey: "cantor",
    monthStart,
    monthEnd,
  });

  if (!data.allowed) {
    return <AccessDenied />;
  }

  const isAdmin = data.profile.roles.some((role) => role.key === "admin");
  const selectedChurchId = data.churches.some((church) => church.id === requestedChurchId)
    ? requestedChurchId
    : "todas";
  const filteredChurches =
    selectedChurchId === "todas"
      ? data.churches
      : data.churches.filter((church) => church.id === selectedChurchId);
  const filteredChurchIds = new Set(filteredChurches.map((church) => church.id));
  const filteredServices = data.services.filter((service) =>
    filteredChurchIds.has(service.church_id),
  );
  const filteredVolunteers = data.volunteers.filter((volunteer) =>
    filteredChurchIds.has(volunteer.church_id),
  );
  const filteredSwapRequests = data.swapRequests.filter(
    (request) =>
      selectedChurchId === "todas" ||
      request.source_church_id === selectedChurchId ||
      request.target_church_id === selectedChurchId,
  );
  const selectedChurchSlug =
    selectedChurchId === "todas"
      ? "todas"
      : slugify(filteredChurches[0]?.name ?? "igreja");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header
        description="Escolha cantores, duplas, trios ou grupos disponíveis por culto e igreja. Ao salvar novamente no mesmo dia, a escala é trocada."
        month={month}
        nextHref={buildPageHref(next.month, next.year, selectedChurchId)}
        pdfCalendars={buildChurchPdfCalendars({
          churches: filteredChurches,
          month,
          monthLabel: `${capitalize(getMonthName(month))} de ${year}`,
          services: filteredServices,
          year,
        })}
        previousHref={buildPageHref(previous.month, previous.year, selectedChurchId)}
        selectedChurchSlug={selectedChurchSlug}
        title="Escala de louvor"
        year={year}
      />

      {isAdmin ? (
        <ChurchFilter
          churches={data.churches}
          month={month}
          selectedChurchId={selectedChurchId}
          year={year}
        />
      ) : null}

      <div className="mt-6">
        <ScheduleCalendar
          calendarDays={buildCalendarDays(year, month)}
          churches={filteredChurches}
          groupByChurch={isAdmin}
          roleKey="cantor"
          services={filteredServices}
          swapRequests={filteredSwapRequests}
          title="Cultos do mês"
          volunteers={filteredVolunteers}
        />
      </div>
    </div>
  );
}

function Header({
  description,
  month,
  nextHref,
  pdfCalendars,
  previousHref,
  selectedChurchSlug,
  title,
  year,
}: {
  description: string;
  month: number;
  nextHref: string;
  pdfCalendars: NonNullable<Parameters<typeof PdfDownloadButton>[0]["calendars"]>;
  previousHref: string;
  selectedChurchSlug: string;
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
            calendars={pdfCalendars}
            fileName={`escala-louvor-${selectedChurchSlug}-${year}-${String(month).padStart(2, "0")}.pdf`}
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

function ChurchFilter({
  churches,
  month,
  selectedChurchId,
  year,
}: {
  churches: ScheduleChurch[];
  month: number;
  selectedChurchId: string;
  year: number;
}) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-4 shadow-sm">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <input name="mes" type="hidden" value={month} />
        <input name="ano" type="hidden" value={year} />
        <label className="grid gap-1 text-sm font-semibold text-foreground sm:min-w-72">
          Filtrar igreja
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={selectedChurchId}
            name="igreja"
          >
            <option value="todas">Todas as igrejas</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
          type="submit"
        >
          Aplicar filtro
        </button>
      </form>
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
        Você precisa ser líder de música vinculado a uma igreja, ou administrador, para gerenciar a escala de louvor.
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

function buildChurchPdfCalendars({
  churches,
  month,
  monthLabel,
  services,
  year,
}: {
  churches: ScheduleChurch[];
  month: number;
  monthLabel: string;
  services: ScheduleService[];
  year: number;
}) {
  return churches.map((church) => ({
    calendar: {
      events: services
        .filter((service) => service.church_id === church.id)
        .map((service) => ({
          date: service.service_date,
          title: `${service.start_time.slice(0, 5)} - Culto`,
          lines: [
            `Igreja: ${church.name} - ${church.city}/${church.state}`,
            `Pregador: ${service.preacher_name ?? "A definir"}`,
            `Louvor: ${service.singer_name ?? "A definir"}`,
            service.title ?? getTemplateLabel(service.service_type),
          ],
        })),
      month,
      year,
    },
    subtitle: monthLabel,
    title: `Escala de louvor - ${church.name}`,
  }));
}

function buildPageHref(month: number, year: number, churchId: string) {
  const searchParams = new URLSearchParams({
    ano: String(year),
    mes: String(month),
  });

  if (churchId !== "todas") {
    searchParams.set("igreja", churchId);
  }

  return `/escalas/louvor?${searchParams.toString()}`;
}

function readStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
