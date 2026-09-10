"use client";

import { Building2, Loader2, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { clearScheduleAction } from "@/lib/escalas/actions";
import { getTemplateLabel } from "@/lib/cultos/schedule";
import type {
  ScheduleChurch,
  ScheduleRoleKey,
  ScheduleService,
  VolunteerOption,
} from "@/lib/escalas/queries";

export function AdminChurchSchedule({
  churches,
  formAction,
  roleKey,
  services,
  title,
  volunteers,
}: {
  churches: ScheduleChurch[];
  formAction: (formData: FormData) => void;
  roleKey: ScheduleRoleKey;
  services: ScheduleService[];
  title: string;
  volunteers: VolunteerOption[];
}) {
  const [personId, setPersonId] = useState("todas");
  const personLabel = roleKey === "pregador" ? "pregador" : "cantor ou grupo";
  const personOptions = buildPersonFilterOptions(services, volunteers, roleKey);
  const visibleServices = services.filter((service) =>
    serviceMatchesPersonFilter(service, volunteers, roleKey, personId),
  );
  const servicesByChurch = groupServicesByChurch(visibleServices);
  const visibleChurches = churches.filter(
    (church) => (servicesByChurch[church.id] ?? []).length > 0,
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex min-w-0 flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Escalas por igreja</h2>
          <p className="mt-1 text-sm text-muted">{title}</p>
        </div>
        <label className="grid min-w-0 gap-1 text-xs font-semibold text-primary-strong sm:min-w-72 sm:text-sm">
          Filtrar {personLabel}
          <select
            className="h-10 min-w-0 rounded-md border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setPersonId(event.target.value)}
            value={personId}
          >
            <option value="todas">
              {roleKey === "pregador" ? "Todos os pregadores" : "Todos os cantores e grupos"}
            </option>
            {personOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid min-w-0 gap-5 p-3 sm:p-4">
        {visibleChurches.map((church) => {
          const churchServices = servicesByChurch[church.id] ?? [];

          return (
            <section className="min-w-0 overflow-hidden rounded-md border border-border" key={church.id}>
              <div className="flex min-w-0 items-center gap-2 border-b border-border bg-primary-soft px-3 py-3 text-primary-strong sm:px-4">
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold sm:text-base">{church.name}</h3>
                  <p className="truncate text-xs text-muted">
                    {church.city}/{church.state}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold">
                  {churchServices.length} {churchServices.length === 1 ? "culto" : "cultos"}
                </span>
              </div>

              <div className="grid min-w-0 gap-3 bg-background p-3 md:grid-cols-2 xl:grid-cols-3">
                {churchServices.map((service) => {
                  const assignedName =
                    roleKey === "pregador" ? service.preacher_name : service.singer_name;
                  const availableVolunteers = volunteers.filter(
                    (volunteer) =>
                      volunteer.church_id === service.church_id &&
                      volunteer.service_date === service.service_date,
                  );

                  return (
                    <article
                      className="grid min-w-0 gap-3 rounded-md border border-border bg-surface p-3 text-sm shadow-sm"
                      key={service.id}
                    >
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold text-primary-strong sm:text-sm">
                          {formatDate(service.service_date)} · {service.start_time.slice(0, 5)}
                        </p>
                        <p className="mt-1 break-words text-sm text-muted">
                          {service.title ?? getTemplateLabel(service.service_type)}
                        </p>
                        <p className="mt-2 break-words font-medium text-foreground">
                          Pregador: {service.preacher_name ?? "A definir"}
                        </p>
                        <p className="break-words font-medium text-foreground">
                          Louvor: {service.singer_name ?? "A definir"}
                        </p>
                      </div>

                      <form action={formAction} className="grid gap-2">
                        <input name="serviceId" type="hidden" value={service.id} />
                        <input name="roleKey" type="hidden" value={roleKey} />
                        <select
                          aria-label={`Selecionar ${personLabel} para ${formatDate(service.service_date)}`}
                          className="h-10 min-w-0 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          defaultValue=""
                          name="userId"
                          required
                        >
                          <option value="">Selecionar {personLabel}</option>
                          {availableVolunteers.map((volunteer) => (
                            <option key={volunteer.id} value={volunteer.id}>
                              {volunteer.full_name}
                            </option>
                          ))}
                        </select>
                        <div className={`grid gap-2 ${assignedName ? "grid-cols-2" : ""}`}>
                          <AdminScheduleFormButton
                            className="bg-success text-white hover:brightness-95"
                            icon="save"
                            label="Salvar"
                          />
                          {assignedName ? (
                            <AdminScheduleFormButton
                              className="bg-red-600 text-white hover:bg-red-700"
                              formAction={clearScheduleAction}
                              icon="delete"
                              label="Excluir"
                            />
                          ) : null}
                        </div>
                      </form>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {visibleChurches.length === 0 ? (
          <p className="rounded-md bg-surface-muted p-4 text-sm text-muted">
            Nenhum culto encontrado para o filtro selecionado.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AdminScheduleFormButton({
  className,
  formAction,
  icon,
  label,
}: {
  className: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  icon: "delete" | "save";
  label: string;
}) {
  const { pending } = useFormStatus();
  const Icon = icon === "save" ? Save : Trash2;

  return (
    <button
      aria-label={label}
      className={`inline-flex h-7 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      disabled={pending}
      formAction={formAction}
      formNoValidate={icon === "delete"}
      title={label}
      type="submit"
    >
      {pending ? (
        <Loader2 className="shrink-0 animate-spin" size={12} />
      ) : (
        <Icon className="shrink-0" size={12} />
      )}
      <span className="truncate">{pending ? "..." : label}</span>
    </button>
  );
}

function groupServicesByChurch(services: ScheduleService[]) {
  const grouped: Record<string, ScheduleService[]> = {};

  for (const service of services) {
    grouped[service.church_id] = grouped[service.church_id] ?? [];
    grouped[service.church_id].push(service);
  }

  return grouped;
}

function buildPersonFilterOptions(
  services: ScheduleService[],
  volunteers: VolunteerOption[],
  roleKey: ScheduleRoleKey,
) {
  const people = new Map<string, string>();

  for (const service of services) {
    const id = roleKey === "pregador" ? service.preacher_user_id : service.singer_user_id;
    const name = roleKey === "pregador" ? service.preacher_name : service.singer_name;

    if (id && name) {
      people.set(id, name);
    }
  }

  for (const volunteer of volunteers) {
    people.set(volunteer.id, volunteer.full_name);
  }

  return Array.from(people, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}

function serviceMatchesPersonFilter(
  service: ScheduleService,
  volunteers: VolunteerOption[],
  roleKey: ScheduleRoleKey,
  personId: string,
) {
  if (personId === "todas") {
    return true;
  }

  const assignedUserId =
    roleKey === "pregador" ? service.preacher_user_id : service.singer_user_id;

  return (
    assignedUserId === personId ||
    volunteers.some(
      (volunteer) =>
        volunteer.id === personId &&
        volunteer.church_id === service.church_id &&
        volunteer.service_date === service.service_date,
    )
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
