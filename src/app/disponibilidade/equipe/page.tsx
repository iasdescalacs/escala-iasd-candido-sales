import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  UserRoundSearch,
} from "lucide-react";
import {
  ManagedAvailabilityCalendarForm,
  type ManagedAvailabilityService,
} from "@/components/availability/managed-availability-calendar-form";
import {
  buildCalendarDays,
  getAdjacentMonth,
  getMonthName,
  type WorshipServiceType,
} from "@/lib/cultos/schedule";
import { requireAvailabilityManager } from "@/lib/disponibilidade/management";
import type { AvailabilityRoleKey } from "@/lib/disponibilidade/rules";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PersonSummary = {
  id: string;
  full_name: string;
};

type ServiceRow = {
  id: string;
  church_id: string;
  service_date: string;
  service_type: WorshipServiceType;
  start_time: string;
  title: string | null;
  is_special: boolean;
};

type AvailabilityRow = {
  service_date: string;
  worship_service_id: string | null;
  available: boolean;
  managed: boolean;
};

export default async function DisponibilidadeEquipePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const management = await requireAvailabilityManager();
  const params = await searchParams;
  const today = new Date();
  const year = parseNumberParam(params.ano, today.getFullYear());
  const month = normalizeMonth(parseNumberParam(params.mes, today.getMonth() + 1));
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    new Date(Date.UTC(year, month, 0)).getUTCDate(),
  ).padStart(2, "0")}`;
  const requestedRoleKey = readStringParam(params.funcao);
  const defaultRoleKey = management.managedRoleKeys[0] ?? "pregador";
  const roleKey = management.managedRoleKeys.includes(
    requestedRoleKey as AvailabilityRoleKey,
  )
    ? (requestedRoleKey as AvailabilityRoleKey)
    : defaultRoleKey;
  const roleId = management.roleIds[roleKey];
  const roleName = getRoleDisplayName(roleKey, management.roleNames[roleKey]);
  const churchIds = management.churchIdsByRole[roleKey];
  const search = readStringParam(params.busca).trim().slice(0, 80);
  const requestedUserId = readStringParam(params.usuario);
  const previous = getAdjacentMonth(year, month, -1);
  const next = getAdjacentMonth(year, month, 1);

  const { data: roleLinks } = roleId
    ? await management.admin
        .from("user_roles")
        .select("user_id")
        .eq("role_id", roleId)
        .is("deleted_at", null)
    : { data: [] };
  const volunteerIds = Array.from(
    new Set((roleLinks ?? []).map((link) => link.user_id)),
  );
  const volunteers = await searchVolunteers({
    admin: management.admin,
    search,
    volunteerIds,
  });
  const selectedPerson = await getSelectedPerson({
    admin: management.admin,
    requestedUserId,
    volunteerIds,
  });

  const [{ data: churches }, { data: serviceRows }] =
    churchIds.length > 0
      ? await Promise.all([
          management.admin
            .from("churches")
            .select("id,name")
            .in("id", churchIds)
            .eq("active", true)
            .is("deleted_at", null)
            .order("name", { ascending: true }),
          management.admin
            .from("worship_services")
            .select(
              "id,church_id,service_date,service_type,start_time,title,is_special",
            )
            .in("church_id", churchIds)
            .gte("service_date", monthStart)
            .lte("service_date", monthEnd)
            .is("deleted_at", null)
            .order("service_date", { ascending: true })
            .order("start_time", { ascending: true }),
        ])
      : [{ data: [] }, { data: [] }];
  const churchNames = new Map(
    (churches ?? []).map((church) => [church.id, church.name]),
  );
  const services: ManagedAvailabilityService[] = (
    (serviceRows ?? []) as ServiceRow[]
  )
    .filter((service) => churchNames.has(service.church_id))
    .map((service) => ({
      churchName: churchNames.get(service.church_id) ?? "Igreja",
      id: service.id,
      isSpecial: service.is_special,
      serviceDate: service.service_date,
      serviceType: service.service_type,
      startTime: service.start_time,
      title: service.title,
    }));

  let selectedServiceIds: string[] = [];

  if (selectedPerson && roleId) {
    const [{ data: availabilityRows }, { data: churchLinks }] = await Promise.all([
      management.admin
        .from("user_availability")
        .select("service_date,worship_service_id,available,managed")
        .eq("user_id", selectedPerson.id)
        .eq("role_id", roleId)
        .gte("service_date", monthStart)
        .lte("service_date", monthEnd)
        .is("deleted_at", null),
      management.admin
        .from("user_church_links")
        .select("church_id")
        .eq("user_id", selectedPerson.id)
        .eq("role_id", roleId)
        .eq("can_be_scheduled", true)
        .is("deleted_at", null),
    ]);

    selectedServiceIds = getEffectiveSelectedServiceIds({
      availabilityRows: (availabilityRows ?? []) as AvailabilityRow[],
      schedulableChurchIds: (churchLinks ?? []).map((link) => link.church_id),
      serviceRows: (serviceRows ?? []) as ServiceRow[],
    });
  }

  const commonHref = {
    month,
    roleKey,
    search,
    userId: selectedPerson?.id ?? "",
    year,
  };

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Equipe
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Disponibilidade da equipe
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Pesquise uma pessoa aprovada e marque os cultos em que ela poderá
          servir. A busca inclui voluntários de qualquer igreja.
        </p>
      </section>

      <section className="mt-6 grid gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
        {management.managedRoleKeys.length > 1 ? (
          <div>
            <p className="text-sm font-semibold text-foreground">Função</p>
            <div className="mt-2 inline-flex max-w-full gap-1 rounded-md border border-border bg-background p-1">
              {management.managedRoleKeys.map((availableRoleKey) => (
                <Link
                  className={`min-w-0 rounded px-3 py-2 text-sm font-semibold transition ${
                    availableRoleKey === roleKey
                      ? "bg-primary text-primary-foreground"
                      : "text-muted hover:bg-surface-muted hover:text-foreground"
                  }`}
                  href={buildPageHref({
                    month,
                    roleKey: availableRoleKey,
                    year,
                  })}
                  key={availableRoleKey}
                >
                  {getRoleDisplayName(
                    availableRoleKey,
                    management.roleNames[availableRoleKey],
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Calendário
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {capitalize(getMonthName(month))} de {year}
            </h2>
          </div>
          <div className="flex gap-2">
            <CalendarLink
              href={buildPageHref({
                ...commonHref,
                month: previous.month,
                year: previous.year,
              })}
              label="Mês anterior"
              position="previous"
            />
            <CalendarLink
              href={buildPageHref({
                ...commonHref,
                month: next.month,
                year: next.year,
              })}
              label="Próximo mês"
              position="next"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-primary">
          <UserRoundSearch size={18} aria-hidden="true" />
          <h2 className="font-semibold">Pesquisar {roleName.toLocaleLowerCase("pt-BR")}</h2>
        </div>
        <form className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row" method="get">
          <input name="ano" type="hidden" value={year} />
          <input name="mes" type="hidden" value={month} />
          <input name="funcao" type="hidden" value={roleKey} />
          <label className="sr-only" htmlFor="team-availability-search">
            Nome da pessoa
          </label>
          <input
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={search}
            id="team-availability-search"
            maxLength={80}
            name="busca"
            placeholder="Digite pelo menos 2 letras do nome"
            type="search"
          />
          <button
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
            type="submit"
          >
            <Search size={17} aria-hidden="true" />
            Pesquisar
          </button>
        </form>

        {search.length > 0 && search.length < 2 ? (
          <p className="mt-3 text-sm text-warning">
            Digite pelo menos 2 letras para pesquisar.
          </p>
        ) : null}

        {search.length >= 2 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {volunteers.length > 0 ? (
              volunteers.map((person) => (
                <Link
                  className={`min-w-0 rounded-md border px-3 py-3 text-sm font-semibold transition ${
                    selectedPerson?.id === person.id
                      ? "border-primary bg-primary-soft text-primary-strong"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-surface-muted"
                  }`}
                  href={buildPageHref({
                    ...commonHref,
                    search,
                    userId: person.id,
                  })}
                  key={person.id}
                >
                  <span className="block truncate">{person.full_name}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">
                Nenhuma pessoa aprovada foi encontrada com esse nome.
              </p>
            )}
          </div>
        ) : null}
      </section>

      {churchIds.length === 0 ? (
        <section className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted">
          <CalendarDays className="shrink-0" size={18} aria-hidden="true" />
          Seu perfil não possui igreja gerencial vinculada para essa função.
        </section>
      ) : null}

      {requestedUserId && !selectedPerson ? (
        <section className="mt-6 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          A pessoa selecionada não está aprovada ou não possui a função de {roleName}.
        </section>
      ) : null}

      {selectedPerson ? (
        <ManagedAvailabilityCalendarForm
          calendarDays={buildCalendarDays(year, month)}
          key={`${selectedPerson.id}:${roleKey}:${monthStart}`}
          monthEnd={monthEnd}
          monthStart={monthStart}
          person={{ id: selectedPerson.id, fullName: selectedPerson.full_name }}
          roleKey={roleKey}
          roleName={roleName}
          selectedServiceIds={selectedServiceIds}
          services={services}
        />
      ) : (
        <section className="mt-6 rounded-lg border border-border bg-surface-muted p-5 text-sm text-muted">
          Pesquise e selecione uma pessoa para abrir o calendário mensal.
        </section>
      )}
    </div>
  );
}

async function searchVolunteers({
  admin,
  search,
  volunteerIds,
}: {
  admin: Awaited<ReturnType<typeof requireAvailabilityManager>>["admin"];
  search: string;
  volunteerIds: string[];
}) {
  if (search.length < 2 || volunteerIds.length === 0) {
    return [] as PersonSummary[];
  }

  const { data } = await admin
    .from("users")
    .select("id,full_name")
    .in("id", volunteerIds)
    .eq("status", "approved")
    .is("deleted_at", null)
    .ilike("full_name", `%${search}%`)
    .order("full_name", { ascending: true })
    .limit(20);

  return (data ?? []) as PersonSummary[];
}

async function getSelectedPerson({
  admin,
  requestedUserId,
  volunteerIds,
}: {
  admin: Awaited<ReturnType<typeof requireAvailabilityManager>>["admin"];
  requestedUserId: string;
  volunteerIds: string[];
}) {
  if (!requestedUserId || !volunteerIds.includes(requestedUserId)) {
    return null;
  }

  const { data } = await admin
    .from("users")
    .select("id,full_name")
    .eq("id", requestedUserId)
    .eq("status", "approved")
    .is("deleted_at", null)
    .maybeSingle();

  return data as PersonSummary | null;
}

function getEffectiveSelectedServiceIds({
  availabilityRows,
  schedulableChurchIds,
  serviceRows,
}: {
  availabilityRows: AvailabilityRow[];
  schedulableChurchIds: string[];
  serviceRows: ServiceRow[];
}) {
  const exactAvailability = new Map(
    availabilityRows
      .filter((availability) => availability.worship_service_id)
      .map((availability) => [availability.worship_service_id, availability]),
  );
  const regularDates = new Set(
    availabilityRows
      .filter(
        (availability) =>
          !availability.worship_service_id && availability.available,
      )
      .map((availability) => availability.service_date),
  );
  const schedulableChurches = new Set(schedulableChurchIds);

  return serviceRows.flatMap((service) => {
    const exact = exactAvailability.get(service.id);

    if (exact) {
      return exact.available && (exact.managed || schedulableChurches.has(service.church_id))
        ? [service.id]
        : [];
    }

    return !service.is_special &&
      regularDates.has(service.service_date) &&
      schedulableChurches.has(service.church_id)
      ? [service.id]
      : [];
  });
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
      aria-label={label}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
      href={href}
    >
      {position === "previous" ? <ChevronLeft size={16} aria-hidden="true" /> : null}
      <span className="hidden sm:inline">{label}</span>
      {position === "next" ? <ChevronRight size={16} aria-hidden="true" /> : null}
    </Link>
  );
}

function buildPageHref({
  month,
  roleKey,
  search = "",
  userId = "",
  year,
}: {
  month: number;
  roleKey: AvailabilityRoleKey;
  search?: string;
  userId?: string;
  year: number;
}) {
  const searchParams = new URLSearchParams({
    ano: String(year),
    funcao: roleKey,
    mes: String(month),
  });

  if (search) {
    searchParams.set("busca", search);
  }

  if (userId) {
    searchParams.set("usuario", userId);
  }

  return `/disponibilidade/equipe?${searchParams.toString()}`;
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

function readStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}

function getRoleDisplayName(
  roleKey: AvailabilityRoleKey,
  configuredName?: string,
) {
  if (roleKey === "cantor") {
    return "Cantor ou grupo";
  }

  return configuredName ?? "Pregador";
}
