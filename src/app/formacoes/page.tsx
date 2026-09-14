import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Music2,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { FormationAvailabilityCalendar } from "@/components/formations/formation-availability-calendar";
import { MusicalFormationForm } from "@/components/formations/musical-formation-form";
import {
  buildCalendarDays,
  getAdjacentMonth,
  getMonthName,
} from "@/lib/cultos/schedule";
import { getMusicalFormationsPageData } from "@/lib/formacoes/queries";
import {
  formationStatusLabel,
  formationTypeLabel,
} from "@/lib/formacoes/rules";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FormacoesMusicaisPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const today = new Date();
  const year = parseNumberParam(params.ano, today.getFullYear());
  const month = normalizeMonth(
    parseNumberParam(params.mes, today.getMonth() + 1),
  );
  const formationId = readStringParam(params.formacao);
  const monthStart =
    String(year) + "-" + String(month).padStart(2, "0") + "-01";
  const monthEnd =
    String(year) +
    "-" +
    String(month).padStart(2, "0") +
    "-" +
    String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0");
  const previous = getAdjacentMonth(year, month, -1);
  const next = getAdjacentMonth(year, month, 1);
  const data = await getMusicalFormationsPageData({
    formationId,
    monthEnd,
    monthStart,
  });
  const selectedFormation = data.selectedFormation;
  const monthLabel =
    capitalize(getMonthName(month)) + " de " + String(year);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Louvor
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Formações musicais
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              Organize duplas, trios e grupos usando as contas pessoais dos
              integrantes. Uma pessoa pode cantar solo e também liderar ou
              participar de várias formações.
            </p>
          </div>
          <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-primary-soft px-3 text-sm font-semibold text-primary-strong">
            <Music2 size={17} aria-hidden="true" />
            {data.formations.length} formação(ões)
          </span>
        </div>
      </section>

      {data.canCreate ? (
        <details className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 font-semibold text-foreground sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
              <UsersRound size={18} aria-hidden="true" />
            </span>
            Criar formação musical
          </summary>
          <div className="border-t border-border p-3 sm:p-5">
            <MusicalFormationForm
              churches={data.churches}
              currentUserId={data.currentUserId}
              singers={data.singers}
            />
          </div>
        </details>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Minhas formações e formações gerenciadas
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.formations.map((formation) => (
            <Link
              className={
                "min-w-0 rounded-lg border bg-surface p-4 shadow-sm transition hover:border-primary " +
                (selectedFormation?.id === formation.id
                  ? "border-primary ring-2 ring-primary/15"
                  : "border-border")
              }
              href={buildPageHref({
                formationId: formation.id,
                month,
                year,
              })}
              key={formation.id}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {formation.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formationTypeLabel(formation.formationType)} · {formation.homeChurchName}
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold " +
                    (formation.status === "active"
                      ? "bg-success/15 text-success"
                      : formation.status === "inactive"
                        ? "bg-surface-muted text-muted"
                        : "bg-warning/15 text-warning")
                  }
                >
                  {formationStatusLabel(formation.status)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <UserRoundCheck size={16} className="text-primary" aria-hidden="true" />
                {formation.members.length} integrante(s) · {formation.members.filter((member) => member.isResponsible).length} responsável(is)
              </div>
            </Link>
          ))}
        </div>
        {data.formations.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted shadow-sm">
            Nenhuma formação vinculada ao seu perfil.
          </p>
        ) : null}
      </section>

      {selectedFormation ? (
        <section className="mt-6 grid gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" size={20} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {selectedFormation.name}
              </h2>
              <p className="text-sm text-muted">
                {selectedFormation.members
                  .map((member) =>
                    member.isResponsible
                      ? member.fullName + " (responsável)"
                      : member.fullName,
                  )
                  .join(", ")}
              </p>
            </div>
          </div>

          {selectedFormation.canManage ? (
            <MusicalFormationForm
              churches={data.churches}
              currentUserId={data.currentUserId}
              formation={selectedFormation}
              singers={data.singers}
            />
          ) : (
            <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted shadow-sm">
              Você participa desta formação. Somente os responsáveis, o líder
              de música da igreja de origem ou o administrador podem alterá-la.
            </p>
          )}

          {selectedFormation.canManage &&
          selectedFormation.status === "active" ? (
            <>
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                    Calendário
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {monthLabel}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <MonthLink
                    href={buildPageHref({
                      formationId: selectedFormation.id,
                      month: previous.month,
                      year: previous.year,
                    })}
                    label="Mês anterior"
                    position="previous"
                  />
                  <MonthLink
                    href={buildPageHref({
                      formationId: selectedFormation.id,
                      month: next.month,
                      year: next.year,
                    })}
                    label="Próximo mês"
                    position="next"
                  />
                </div>
              </div>
              <FormationAvailabilityCalendar
                calendarDays={buildCalendarDays(year, month)}
                churches={data.churches}
                formationId={selectedFormation.id}
                initialSelectedServiceIds={data.selectedServiceIds}
                periodEnd={monthEnd}
                periodStart={monthStart}
                services={data.services}
              />
            </>
          ) : selectedFormation.status === "pending" ? (
            <p className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
              A disponibilidade poderá ser informada depois que um administrador
              ou líder de música da igreja de origem aprovar a formação.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function MonthLink({
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-surface-muted"
      href={href}
      title={label}
    >
      {position === "previous" ? (
        <ChevronLeft size={17} aria-hidden="true" />
      ) : (
        <ChevronRight size={17} aria-hidden="true" />
      )}
    </Link>
  );
}

function buildPageHref({
  formationId,
  month,
  year,
}: {
  formationId: string;
  month: number;
  year: number;
}) {
  const searchParams = new URLSearchParams({
    ano: String(year),
    formacao: formationId,
    mes: String(month),
  });
  return "/formacoes?" + searchParams.toString();
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
