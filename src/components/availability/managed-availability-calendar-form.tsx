"use client";

import { useActionState, useMemo, useState } from "react";
import { CheckCheck, X } from "lucide-react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AuthActionState } from "@/lib/auth/actions";
import type { CalendarDay, WorshipServiceType } from "@/lib/cultos/schedule";
import { getTemplateLabel } from "@/lib/cultos/schedule";
import { saveManagedAvailabilityAction } from "@/lib/disponibilidade/actions";
import type { AvailabilityRoleKey } from "@/lib/disponibilidade/rules";

export type ManagedAvailabilityService = {
  id: string;
  churchName: string;
  serviceDate: string;
  serviceType: WorshipServiceType;
  startTime: string;
  title: string | null;
  isSpecial: boolean;
};

type ManagedAvailabilityCalendarFormProps = {
  calendarDays: CalendarDay[];
  monthEnd: string;
  monthStart: string;
  person: {
    id: string;
    fullName: string;
  };
  roleKey: AvailabilityRoleKey;
  roleName: string;
  selectedServiceIds: string[];
  services: ManagedAvailabilityService[];
};

const initialState: AuthActionState = { message: "" };

export function ManagedAvailabilityCalendarForm({
  calendarDays,
  monthEnd,
  monthStart,
  person,
  roleKey,
  roleName,
  selectedServiceIds,
  services,
}: ManagedAvailabilityCalendarFormProps) {
  const [state, formAction] = useActionState(
    saveManagedAvailabilityAction,
    initialState,
  );
  const [selectedServices, setSelectedServices] = useState(
    () => new Set(selectedServiceIds),
  );
  const servicesByDate = useMemo(() => groupServicesByDate(services), [services]);

  function handleServiceChange(serviceId: string, checked: boolean) {
    setSelectedServices((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(serviceId);
      } else {
        next.delete(serviceId);
      }

      return next;
    });
  }

  return (
    <form
      action={formAction}
      className="mt-6 grid min-w-0 gap-5 rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5"
    >
      <ActionMessage state={state} />
      <input name="targetUserId" type="hidden" value={person.id} />
      <input name="roleKey" type="hidden" value={roleKey} />
      <input name="monthStart" type="hidden" value={monthStart} />
      <input name="monthEnd" type="hidden" value={monthEnd} />

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {roleName}
          </p>
          <h2 className="mt-1 break-words text-xl font-semibold text-foreground">
            Disponibilidade de {person.fullName}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Cada opção corresponde a um culto real da igreja indicada.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-surface-muted"
            onClick={() => setSelectedServices(new Set(services.map((service) => service.id)))}
            type="button"
          >
            <CheckCheck size={15} aria-hidden="true" />
            Marcar todos
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-surface-muted"
            onClick={() => setSelectedServices(new Set())}
            type="button"
          >
            <X size={15} aria-hidden="true" />
            Limpar
          </button>
        </div>
      </div>

      {services.length === 0 ? (
        <p className="rounded-md bg-surface-muted p-4 text-sm text-muted">
          Nenhum culto foi encontrado neste mês nas igrejas que você gerencia.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="hidden grid-cols-7 border-b border-border bg-surface-muted sm:grid">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div
                  className="px-2 py-2 text-center text-xs font-semibold uppercase text-muted"
                  key={day}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="hidden grid-cols-7 sm:grid">
              {calendarDays.map((day) => (
                <div
                  className={`min-h-32 min-w-0 border-b border-r border-border p-2 ${
                    day.currentMonth ? "bg-background" : "bg-surface-muted/60"
                  }`}
                  key={day.date}
                >
                  <span
                    className={`text-xs font-semibold ${
                      day.currentMonth ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {day.day}
                  </span>
                  <div className="mt-2 grid min-w-0 gap-1.5">
                    {(servicesByDate[day.date] ?? []).map((service) => (
                      <ServiceCheckbox
                        checked={selectedServices.has(service.id)}
                        compact
                        key={service.id}
                        onChange={handleServiceChange}
                        service={service}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2 p-3 sm:hidden">
              {calendarDays.flatMap((day) =>
                (servicesByDate[day.date] ?? []).map((service) => (
                  <div className="min-w-0" key={service.id}>
                    <p className="mb-1 text-xs font-semibold text-muted">
                      {formatDate(day.date)}
                    </p>
                    <ServiceCheckbox
                      checked={selectedServices.has(service.id)}
                      onChange={handleServiceChange}
                      service={service}
                    />
                  </div>
                )),
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <SubmitButton>Salvar disponibilidade da equipe</SubmitButton>
          </div>
        </>
      )}
    </form>
  );
}

function ServiceCheckbox({
  checked,
  compact = false,
  onChange,
  service,
}: {
  checked: boolean;
  compact?: boolean;
  onChange: (serviceId: string, checked: boolean) => void;
  service: ManagedAvailabilityService;
}) {
  const serviceName = service.isSpecial
    ? `Culto especial: ${service.title ?? "Especial"}`
    : `Culto regular: ${getTemplateLabel(service.serviceType)}`;

  return (
    <label
      className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-md border transition ${
        compact ? "px-1.5 py-1 text-[10px] leading-4" : "p-3 text-sm"
      } ${
        service.isSpecial
          ? "border-warning/40 bg-warning/10 hover:bg-warning/15"
          : "border-primary/20 bg-primary-soft/60 hover:brightness-95"
      }`}
    >
      <input
        checked={checked}
        className={`${compact ? "mt-0.5 h-3.5 w-3.5" : "mt-1 h-4 w-4"} shrink-0 accent-[var(--primary)]`}
        name="serviceIds"
        onChange={(event) => onChange(service.id, event.target.checked)}
        type="checkbox"
        value={service.id}
      />
      <span className="min-w-0 break-words">
        <span
          className={`block font-semibold ${
            service.isSpecial ? "text-warning" : "text-primary-strong"
          }`}
        >
          {serviceName}
        </span>
        <span className="block text-muted">
          {service.churchName} · {service.startTime.slice(0, 5)}
        </span>
      </span>
    </label>
  );
}

function groupServicesByDate(services: ManagedAvailabilityService[]) {
  const grouped: Record<string, ManagedAvailabilityService[]> = {};

  for (const service of services) {
    grouped[service.serviceDate] = grouped[service.serviceDate] ?? [];
    grouped[service.serviceDate].push(service);
  }

  return grouped;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
