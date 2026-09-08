"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AuthActionState } from "@/lib/auth/actions";
import { saveAvailabilityAction } from "@/lib/disponibilidade/actions";
import type { AvailabilityRoleKey } from "@/lib/disponibilidade/rules";
import type { CalendarDay, WorshipServiceType } from "@/lib/cultos/schedule";
import { getTemplateLabel } from "@/lib/cultos/schedule";

type ChurchOption = {
  id: string;
  name: string;
};

type ServiceSummary = {
  id: string;
  service_date: string;
  service_type: WorshipServiceType;
  start_time: string;
  title: string | null;
};

type AvailabilityRoleFormProps = {
  role: {
    id: string;
    key: AvailabilityRoleKey;
    name: string;
  };
  churches: ChurchOption[];
  calendarDays: CalendarDay[];
  servicesByDate: Record<string, ServiceSummary[]>;
  selectedChurchIds: string[];
  selectedDates: string[];
  monthStart: string;
  monthEnd: string;
};

const initialState: AuthActionState = { message: "" };

export function AvailabilityRoleForm({
  role,
  churches,
  calendarDays,
  servicesByDate,
  selectedChurchIds,
  selectedDates,
  monthStart,
  monthEnd,
}: AvailabilityRoleFormProps) {
  const [state, formAction] = useActionState(saveAvailabilityAction, initialState);
  const selectedChurches = new Set(selectedChurchIds);
  const availableDates = new Set(selectedDates);

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <ActionMessage state={state} />
      <input name="roleKey" type="hidden" value={role.key} />
      <input name="monthStart" type="hidden" value={monthStart} />
      <input name="monthEnd" type="hidden" value={monthEnd} />

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          {role.name}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">
          Igrejas onde aceito ser escalado
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {churches.map((church) => (
            <label
              className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              key={church.id}
            >
              <input
                className="h-4 w-4 accent-[var(--primary)]"
                defaultChecked={selectedChurches.has(church.id)}
                name="churchIds"
                type="checkbox"
                value={church.id}
              />
              <span className="truncate">{church.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Dias disponíveis para {role.name.toLocaleLowerCase("pt-BR")}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          Marque somente os dias em que você pode participar dos cultos gerados
          neste mês.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div
              className="px-2 py-2 text-center text-xs font-semibold uppercase text-muted"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const services = servicesByDate[day.date] ?? [];
            const hasServices = services.length > 0;

            return (
              <label
                className={`min-h-28 min-w-0 border-b border-r border-border p-2 ${
                  day.currentMonth ? "bg-background" : "bg-surface-muted/60"
                } ${hasServices ? "cursor-pointer hover:bg-primary-soft/50" : ""}`}
                key={day.date}
              >
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={`text-xs font-semibold ${
                      day.currentMonth ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {day.day}
                  </span>
                  {hasServices ? (
                    <input
                      className="h-4 w-4 accent-[var(--primary)]"
                      defaultChecked={availableDates.has(day.date)}
                      name="availableDates"
                      type="checkbox"
                      value={day.date}
                    />
                  ) : null}
                </div>

                <div className="mt-2 grid gap-1">
                  {services.map((service) => (
                    <div
                      className="min-w-0 rounded-md bg-primary-soft px-2 py-1 text-[11px] leading-4 text-primary-strong"
                      key={service.id}
                    >
                      <p className="truncate font-semibold">
                        {service.title ?? getTemplateLabel(service.service_type)}
                      </p>
                      <p className="truncate text-muted">
                        {service.start_time.slice(0, 5)}
                      </p>
                    </div>
                  ))}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <SubmitButton>{`Salvar disponibilidade de ${role.name}`}</SubmitButton>
    </form>
  );
}
