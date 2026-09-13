import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ClearWorshipServicesForm } from "@/components/admin/clear-worship-services-form";
import { DeleteWorshipServiceButton } from "@/components/admin/delete-worship-service-button";
import { SpecialWorshipForm } from "@/components/admin/special-worship-form";
import { WorshipGenerationForm } from "@/components/admin/worship-generation-form";
import { PdfDownloadButton } from "@/components/pdf/pdf-download-button";
import { getChurchOptions } from "@/lib/admin/lookups";
import { requireAdminUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  buildCalendarDays,
  getAdjacentMonth,
  getMonthName,
  getSpecialWorshipLabel,
  getTemplateLabel,
  type WorshipServiceType,
  type WorshipSpecialType,
} from "@/lib/cultos/schedule";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type WorshipServiceRow = {
  id: string;
  church_id: string;
  service_date: string;
  service_type: WorshipServiceType;
  start_time: string;
  end_time: string;
  preacher_name: string | null;
  singer_name: string | null;
  is_special: boolean;
  special_type: WorshipSpecialType | null;
  title: string | null;
};

type ChurchRow = {
  id: string;
  name: string;
  city: string;
  state: string;
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function AdminCultosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminUser();

  const params = await searchParams;
  const today = new Date();
  const viewYear = parseNumberParam(params.ano, today.getFullYear());
  const viewMonth = normalizeMonth(
    parseNumberParam(params.mes, today.getMonth() + 1),
  );
  const monthStart = `${viewYear}-${String(viewMonth).padStart(2, "0")}-01`;
  const monthEnd = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(
    new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate(),
  ).padStart(2, "0")}`;
  const previous = getAdjacentMonth(viewYear, viewMonth, -1);
  const next = getAdjacentMonth(viewYear, viewMonth, 1);
  const requestedChurchId = readStringParam(params.igreja);
  const calendarDays = buildCalendarDays(viewYear, viewMonth);
  const supabase = createAdminSupabaseClient();
  const [{ data: churches }, { data: services }, churchOptions] = await Promise.all([
    supabase
      .from("churches")
      .select("id,name,city,state")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("worship_services")
      .select("id,church_id,service_date,service_type,start_time,end_time,preacher_name,singer_name,is_special,special_type,title")
      .gte("service_date", monthStart)
      .lte("service_date", monthEnd)
      .is("deleted_at", null)
      .order("service_date", { ascending: true })
      .order("start_time", { ascending: true }),
    getChurchOptions(),
  ]);
  const allChurches = (churches ?? []) as ChurchRow[];
  const selectedChurchId = allChurches.some((church) => church.id === requestedChurchId)
    ? requestedChurchId
    : "todas";
  const filteredChurches =
    selectedChurchId === "todas"
      ? allChurches
      : allChurches.filter((church) => church.id === selectedChurchId);
  const filteredChurchIds = new Set(filteredChurches.map((church) => church.id));
  const filteredServices = ((services ?? []) as WorshipServiceRow[]).filter((service) =>
    filteredChurchIds.has(service.church_id),
  );
  const churchNames = new Map(filteredChurches.map((church) => [church.id, church.name]));
  const servicesByDate = groupServicesByDate(filteredServices);
  const monthTitle = capitalize(getMonthName(viewMonth));
  const selectedChurchSlug =
    selectedChurchId === "todas"
      ? "todas"
      : slugify(filteredChurches[0]?.name ?? "igreja");
  const pdfCalendars = buildChurchPdfCalendars({
    churches: filteredChurches,
    month: viewMonth,
    monthLabel: `${monthTitle} de ${viewYear}`,
    services: filteredServices,
    year: viewYear,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Administração
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Cultos
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Gere os cultos do mês para todas as igrejas ativas e acompanhe a
          escala mensal em calendário.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Gerar cultos
        </h2>
        <WorshipGenerationForm defaultMonth={viewMonth} defaultYear={viewYear} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Criar culto especial
        </h2>
        <SpecialWorshipForm churches={churchOptions} defaultDate={monthStart} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Limpar cultos e escalas
        </h2>
        <ClearWorshipServicesForm />
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Calendário
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {monthTitle} de {viewYear}
            </h2>
          </div>
          <ChurchFilter
            churches={allChurches}
            month={viewMonth}
            selectedChurchId={selectedChurchId}
            year={viewYear}
          />
          <div className="flex flex-wrap gap-2">
            <PdfDownloadButton
              calendars={pdfCalendars}
              fileName={`cultos-${selectedChurchSlug}-${viewYear}-${String(viewMonth).padStart(2, "0")}.pdf`}
              subtitle={`${monthTitle} de ${viewYear}`}
              title="Escala mensal por igreja"
              verse="Servi uns aos outros, cada um conforme o dom que recebeu. 1 Pedro 4:10"
            />
            <CalendarLink
              href={buildPageHref(previous.month, previous.year, selectedChurchId)}
              label="Mês anterior"
              position="previous"
            />
            <CalendarLink
              href={buildPageHref(next.month, next.year, selectedChurchId)}
              label="Próximo mês"
              position="next"
            />
          </div>
        </div>

        <div className="hidden grid-cols-7 border-b border-border bg-surface-muted sm:grid">
          {weekDays.map((day) => (
            <div
              className="px-2 py-2 text-center text-xs font-semibold uppercase text-muted"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="hidden grid-cols-7 sm:grid">
          {calendarDays.map((day) => {
            const dayServices = servicesByDate.get(day.date) ?? [];

            return (
              <article
                className={`min-h-32 min-w-0 border-b border-r border-border p-2 ${
                  day.currentMonth ? "bg-background" : "bg-surface-muted/60"
                }`}
                key={day.date}
              >
                <div
                  className={`text-xs font-semibold ${
                    day.currentMonth ? "text-foreground" : "text-muted"
                  }`}
                >
                  {day.day}
                </div>

                <div className="mt-2 grid gap-1">
                  {dayServices.map((service) => (
                    <div
                      className="min-w-0 rounded-md border border-primary/30 bg-primary-soft px-2 py-1 text-[11px] leading-4 text-foreground"
                      key={service.id}
                    >
                      <div className="flex min-w-0 items-start gap-1">
                        <p className="min-w-0 flex-1 truncate font-semibold text-primary-strong">
                          {formatTime(service.start_time)}{" "}
                          {service.is_special
                            ? getSpecialWorshipLabel(service.special_type)
                            : getTemplateLabel(service.service_type)}
                        </p>
                        <DeleteWorshipServiceButton
                          description={`o culto de ${formatDate(service.service_date)} às ${formatTime(service.start_time)}`}
                          serviceId={service.id}
                        />
                      </div>
                      {service.is_special ? (
                        <p className="truncate font-semibold">
                          {service.title ?? "Culto especial"}
                        </p>
                      ) : null}
                      <p className="truncate">
                        {churchNames.get(service.church_id) ?? "Igreja"}
                      </p>
                      <p className="truncate text-muted">
                        Pregador: {service.preacher_name ?? "A definir"}
                      </p>
                      <p className="truncate text-muted">
                        Música: {service.singer_name ?? "A definir"}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        <div className="grid gap-3 p-3 sm:hidden">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <article
                className="rounded-md border border-primary/30 bg-primary-soft p-3 text-sm text-foreground"
                key={service.id}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <p className="min-w-0 flex-1 font-semibold text-primary-strong">
                    {formatDate(service.service_date)} · {formatTime(service.start_time)}{" "}
                    {service.is_special
                      ? getSpecialWorshipLabel(service.special_type)
                      : getTemplateLabel(service.service_type)}
                  </p>
                  <DeleteWorshipServiceButton
                    description={`o culto de ${formatDate(service.service_date)} às ${formatTime(service.start_time)}`}
                    serviceId={service.id}
                  />
                </div>
                {service.is_special ? (
                  <p className="mt-1 font-semibold">
                    {service.title ?? "Culto especial"}
                  </p>
                ) : null}
                <p className="mt-1">
                  {churchNames.get(service.church_id) ?? "Igreja"}
                </p>
                <p className="text-muted">
                  Pregador: {service.preacher_name ?? "A definir"}
                </p>
                <p className="text-muted">
                  Música: {service.singer_name ?? "A definir"}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-md bg-surface-muted p-3 text-sm text-muted">
              Nenhum culto gerado para este mês.
            </p>
          )}
        </div>

        {filteredServices.length === 0 ? (
          <div className="hidden items-center gap-3 border-t border-border bg-surface-muted px-4 py-4 text-sm text-muted sm:flex">
            <CalendarDays size={18} aria-hidden="true" />
            Nenhum culto gerado para este mês.
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

function ChurchFilter({
  churches,
  month,
  selectedChurchId,
  year,
}: {
  churches: ChurchRow[];
  month: number;
  selectedChurchId: string;
  year: number;
}) {
  return (
    <form className="flex flex-col gap-2 sm:min-w-64" method="get">
      <input name="mes" type="hidden" value={month} />
      <input name="ano" type="hidden" value={year} />
      <label className="grid gap-1 text-sm font-semibold text-foreground">
        Igreja
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
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        type="submit"
      >
        Aplicar
      </button>
    </form>
  );
}

function groupServicesByDate(services: WorshipServiceRow[]) {
  const map = new Map<string, WorshipServiceRow[]>();

  for (const service of services) {
    const current = map.get(service.service_date) ?? [];
    current.push(service);
    map.set(service.service_date, current);
  }

  return map;
}

function buildChurchPdfCalendars({
  churches,
  month,
  monthLabel,
  services,
  year,
}: {
  churches: ChurchRow[];
  month: number;
  monthLabel: string;
  services: WorshipServiceRow[];
  year: number;
}) {
  return churches.map((church) => ({
    calendar: {
      events: services
        .filter((service) => service.church_id === church.id)
        .map((service) => ({
          date: service.service_date,
          title: `${formatTime(service.start_time)} - ${
            service.is_special
              ? getSpecialWorshipLabel(service.special_type)
              : getTemplateLabel(service.service_type)
          }`,
          lines: [
            `Igreja: ${church.name} - ${church.city}/${church.state}`,
            `Pregador: ${service.preacher_name ?? "A definir"}`,
            `Louvor: ${service.singer_name ?? "A definir"}`,
          ],
        })),
      month,
      year,
    },
    subtitle: monthLabel,
    title: `Escala - ${church.name}`,
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

  return `/admin/cultos?${searchParams.toString()}`;
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

function parseNumberParam(
  value: string | string[] | undefined,
  fallback: number,
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMonth(month: number) {
  if (month < 1) {
    return 1;
  }

  if (month > 12) {
    return 12;
  }

  return month;
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}
