import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { AvailabilityRoleForm } from "@/components/availability/availability-role-form";
import { getChurchOptions } from "@/lib/admin/lookups";
import { requireApprovedUser } from "@/lib/auth/session";
import {
  buildCalendarDays,
  getAdjacentMonth,
  getMonthName,
  type WorshipServiceType,
} from "@/lib/cultos/schedule";
import {
  getRegularAvailabilitySlotKey,
  getSpecialAvailabilitySlotKey,
  type AvailabilityRoleKey,
} from "@/lib/disponibilidade/rules";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type AvailabilityRole = {
  id: string;
  key: AvailabilityRoleKey;
  name: string;
};

type ServiceSummary = {
  id: string;
  church_id: string;
  service_date: string;
  service_type: WorshipServiceType;
  start_time: string;
  title: string | null;
  is_special: boolean;
};

export default async function DisponibilidadePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await requireApprovedUser();
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
  const calendarDays = buildCalendarDays(viewYear, viewMonth);
  const supabase = createAdminSupabaseClient();
  const profileRoleKeys = profile.roles.map((role) => role.key);
  const [{ data: roleRows }, churches, { data: services }] = await Promise.all([
    supabase
      .from("roles")
      .select("id,key,name")
      .in("key", ["pregador", "cantor"])
      .is("deleted_at", null),
    getChurchOptions(),
    supabase
      .from("worship_services")
      .select("id,church_id,service_date,service_type,start_time,title,is_special")
      .gte("service_date", monthStart)
      .lte("service_date", monthEnd)
      .is("deleted_at", null)
      .order("service_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);
  const availabilityRoles = ((roleRows ?? []) as AvailabilityRole[])
    .filter((role) => profileRoleKeys.includes(role.key))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const roleIds = availabilityRoles.map((role) => role.id);
  const [{ data: availabilityRows }, { data: churchLinks }] =
    roleIds.length > 0
      ? await Promise.all([
          supabase
            .from("user_availability")
            .select("role_id,service_date,worship_service_id")
            .eq("user_id", profile.appUser.id)
            .in("role_id", roleIds)
            .eq("available", true)
            .gte("service_date", monthStart)
            .lte("service_date", monthEnd)
            .is("deleted_at", null),
          supabase
            .from("user_church_links")
            .select("role_id,church_id,can_be_scheduled")
            .eq("user_id", profile.appUser.id)
            .in("role_id", roleIds)
            .is("deleted_at", null),
        ])
      : [{ data: [] }, { data: [] }];
  const servicesByDate = groupServicesByDate((services ?? []) as ServiceSummary[]);
  const availabilityByRole = groupAvailabilitySlotsByRole(availabilityRows ?? []);
  const churchesByRole = groupChurchesByRole(churchLinks ?? []);
  const monthTitle = capitalize(getMonthName(viewMonth));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Minha agenda
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Disponibilidade
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Marque os dias em que você está disponível e escolha as igrejas onde
          aceita ser escalado como pregador ou cantor.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Mês
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {monthTitle} de {viewYear}
            </h2>
          </div>
          <div className="flex gap-2">
            <CalendarLink
              href={`/disponibilidade?mes=${previous.month}&ano=${previous.year}`}
              label="Mês anterior"
              position="previous"
            />
            <CalendarLink
              href={`/disponibilidade?mes=${next.month}&ano=${next.year}`}
              label="Próximo mês"
              position="next"
            />
          </div>
        </div>
      </section>

      {availabilityRoles.length === 0 ? (
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 text-muted shadow-sm">
          Seu cadastro precisa ter a função de Pregador ou Cantor para informar
          disponibilidade.
        </section>
      ) : null}

      {(services ?? []).length === 0 ? (
        <section className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted">
          <CalendarDays size={18} aria-hidden="true" />
          Nenhum culto gerado para este mês. Avance ou retroceda para outro mês.
        </section>
      ) : null}

      <div className="mt-6 grid gap-6">
        {availabilityRoles.map((role) => (
          <AvailabilityRoleForm
            calendarDays={calendarDays}
            churches={churches}
            key={`${role.id}:${monthStart}`}
            monthEnd={monthEnd}
            monthStart={monthStart}
            role={role}
            selectedChurchIds={churchesByRole[role.id] ?? []}
            selectedSlotKeys={availabilityByRole[role.id] ?? []}
            servicesByDate={servicesByDate}
          />
        ))}
      </div>
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

function groupServicesByDate(services: ServiceSummary[]) {
  const grouped: Record<string, ServiceSummary[]> = {};

  for (const service of services) {
    grouped[service.service_date] = grouped[service.service_date] ?? [];
    grouped[service.service_date].push(service);
  }

  return grouped;
}

function groupAvailabilitySlotsByRole(
  rows: Array<{
    role_id: string;
    service_date: string;
    worship_service_id: string | null;
  }>,
) {
  const grouped: Record<string, string[]> = {};

  for (const row of rows) {
    grouped[row.role_id] = grouped[row.role_id] ?? [];
    grouped[row.role_id].push(
      row.worship_service_id
        ? getSpecialAvailabilitySlotKey(row.worship_service_id)
        : getRegularAvailabilitySlotKey(row.service_date),
    );
  }

  return grouped;
}

function groupChurchesByRole(
  rows: Array<{
    role_id: string | null;
    church_id: string;
    can_be_scheduled: boolean;
  }>,
) {
  const grouped: Record<string, string[]> = {};

  for (const row of rows) {
    if (row.role_id && row.can_be_scheduled) {
      grouped[row.role_id] = grouped[row.role_id] ?? [];
      grouped[row.role_id].push(row.church_id);
    }
  }

  return grouped;
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

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}
