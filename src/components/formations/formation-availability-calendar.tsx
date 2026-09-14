"use client";

import { CircleCheck } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AuthActionState } from "@/lib/auth/actions";
import type { CalendarDay } from "@/lib/cultos/schedule";
import { getTemplateLabel } from "@/lib/cultos/schedule";
import { saveMusicalFormationAvailabilityAction } from "@/lib/formacoes/actions";
import type {
  FormationChurchOption,
  FormationServiceOption,
} from "@/lib/formacoes/queries";

const initialState: AuthActionState = { message: "" };

export function FormationAvailabilityCalendar({
  calendarDays,
  churches,
  formationId,
  initialSelectedServiceIds,
  periodEnd,
  periodStart,
  services,
}: {
  calendarDays: CalendarDay[];
  churches: FormationChurchOption[];
  formationId: string;
  initialSelectedServiceIds: string[];
  periodEnd: string;
  periodStart: string;
  services: FormationServiceOption[];
}) {
  const [state, formAction] = useActionState(
    saveMusicalFormationAvailabilityAction,
    initialState,
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState(
    initialSelectedServiceIds,
  );
  const churchNames = useMemo(
    () => new Map(churches.map((church) => [church.id, church.name])),
    [churches],
  );
  const servicesByDate = useMemo(() => {
    const grouped = new Map<string, FormationServiceOption[]>();

    for (const service of services) {
      const dateServices = grouped.get(service.service_date) ?? [];
      dateServices.push(service);
      grouped.set(service.service_date, dateServices);
    }

    return grouped;
  }, [services]);

  function toggleService(serviceId: string, selected: boolean) {
    setSelectedServiceIds((current) =>
      selected
        ? Array.from(new Set([...current, serviceId]))
        : current.filter((id) => id !== serviceId),
    );
  }

  return (
    <form
      action={formAction}
      className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
    >
      <input name="formationId" type="hidden" value={formationId} />
      <input name="periodStart" type="hidden" value={periodStart} />
      <input name="periodEnd" type="hidden" value={periodEnd} />

      <div className="grid gap-3 border-b border-border p-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Disponibilidade da formação
          </h2>
          <p className="mt-1 text-sm text-muted">
            Marque cada culto em que a formação completa poderá participar.
          </p>
        </div>
        <SubmitButton disabled={services.length === 0}>
          Salvar disponibilidade
        </SubmitButton>
      </div>

      <div className="p-4">
        <ActionMessage state={state} />
      </div>

      <div className="hidden grid-cols-7 border-y border-border bg-surface-muted sm:grid">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
          (day) => (
            <div
              className="px-2 py-2 text-center text-xs font-semibold uppercase text-muted"
              key={day}
            >
              {day}
            </div>
          ),
        )}
      </div>

      <div className="hidden grid-cols-7 sm:grid">
        {calendarDays.map((day) => {
          const dayServices = servicesByDate.get(day.date) ?? [];
          const daySelected = dayServices.some((service) =>
            selectedServiceIds.includes(service.id),
          );

          return (
            <div
              className={
                "min-h-36 min-w-0 border-b border-r border-border p-2 " +
                (day.currentMonth
                  ? "bg-background"
                  : "bg-surface-muted/60")
              }
              key={day.date}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={
                    "text-xs font-semibold " +
                    (day.currentMonth ? "text-foreground" : "text-muted")
                  }
                >
                  {day.day}
                </span>
                {daySelected ? (
                  <CircleCheck
                    className="shrink-0 text-success"
                    size={16}
                    aria-label="Dia disponível"
                  />
                ) : null}
              </div>
              <div className="mt-2 grid gap-2">
                {dayServices.map((service) => (
                  <ServiceCheckbox
                    checked={selectedServiceIds.includes(service.id)}
                    churchName={
                      churchNames.get(service.church_id) ?? "Igreja"
                    }
                    key={service.id}
                    onChange={toggleService}
                    service={service}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 p-3 sm:hidden">
        {services.map((service) => (
          <ServiceCheckbox
            checked={selectedServiceIds.includes(service.id)}
            churchName={churchNames.get(service.church_id) ?? "Igreja"}
            key={service.id}
            mobile
            onChange={toggleService}
            service={service}
          />
        ))}
      </div>

      {services.length === 0 ? (
        <p className="m-4 rounded-md bg-surface-muted p-4 text-sm text-muted">
          Nenhum culto foi encontrado neste mês para as igrejas atendidas.
        </p>
      ) : null}
    </form>
  );
}

function ServiceCheckbox({
  checked,
  churchName,
  mobile = false,
  onChange,
  service,
}: {
  checked: boolean;
  churchName: string;
  mobile?: boolean;
  onChange: (serviceId: string, selected: boolean) => void;
  service: FormationServiceOption;
}) {
  return (
    <label
      className={
        "relative grid min-w-0 cursor-pointer gap-1 rounded-md border p-2 transition " +
        (checked
          ? "border-success bg-success/10 ring-1 ring-success/30"
          : service.is_special
            ? "border-warning/50 bg-warning/10"
            : "border-border bg-surface hover:border-primary/50") +
        (mobile ? " p-3" : "")
      }
    >
      <input
        checked={checked}
        className="sr-only"
        name="serviceIds"
        onChange={(event) => onChange(service.id, event.target.checked)}
        type="checkbox"
        value={service.id}
      />
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0 break-words text-xs font-semibold text-primary-strong">
          {service.title ?? getTemplateLabel(service.service_type)}
        </span>
        {checked ? (
          <CircleCheck
            className="shrink-0 text-success"
            size={16}
            aria-label="Disponível"
          />
        ) : null}
      </span>
      <span className="break-words text-xs text-foreground">
        {churchName}
      </span>
      <span className="text-xs text-muted">
        {mobile ? formatDate(service.service_date) + " · " : ""}
        {service.start_time.slice(0, 5)}
      </span>
    </label>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(value + "T00:00:00.000Z"),
  );
}
