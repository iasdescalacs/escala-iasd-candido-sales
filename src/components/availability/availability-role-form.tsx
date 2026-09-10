"use client";

import { useActionState, useState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AuthActionState } from "@/lib/auth/actions";
import { saveAvailabilityAction } from "@/lib/disponibilidade/actions";
import {
  buildAvailabilitySlots,
  getRegularAvailabilitySlotKey,
  getSpecialAvailabilitySlotKey,
  type AvailabilityRoleKey,
} from "@/lib/disponibilidade/rules";
import type { CalendarDay, WorshipServiceType } from "@/lib/cultos/schedule";
import { getTemplateLabel } from "@/lib/cultos/schedule";

type ChurchOption = {
  id: string;
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

type DisplaySlot = {
  detail: string;
  isSpecial: boolean;
  key: string;
  label: string;
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
  selectedSlotKeys: string[];
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
  selectedSlotKeys,
  monthStart,
  monthEnd,
}: AvailabilityRoleFormProps) {
  const [state, formAction] = useActionState(saveAvailabilityAction, initialState);
  const [selectedChurches, setSelectedChurches] = useState(
    () => new Set(selectedChurchIds),
  );
  const [availableSlots, setAvailableSlots] = useState(
    () => new Set(selectedSlotKeys),
  );
  const churchNames = new Map(churches.map((church) => [church.id, church.name]));
  const displaySlotsByDate = buildDisplaySlotsByDate({
    churchNames,
    selectedChurchIds: Array.from(selectedChurches),
    servicesByDate,
  });
  const hasVisibleSlots = Object.values(displaySlotsByDate).some(
    (slots) => slots.length > 0,
  );

  function handleChurchChange(churchId: string, checked: boolean) {
    const nextChurches = new Set(selectedChurches);

    if (checked) {
      nextChurches.add(churchId);
    } else {
      nextChurches.delete(churchId);
    }

    const allowedSlots = buildAvailabilitySlots({
      services: Object.values(servicesByDate).flat(),
      selectedChurchIds: Array.from(nextChurches),
    });
    const allowedKeys = new Set(allowedSlots.map((slot) => slot.key));

    setSelectedChurches(nextChurches);
    setAvailableSlots(
      (current) => new Set(Array.from(current).filter((slot) => allowedKeys.has(slot))),
    );
  }

  function handleSlotChange(slotKey: string, checked: boolean) {
    setAvailableSlots((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(slotKey);
      } else {
        next.delete(slotKey);
      }

      return next;
    });
  }

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
                checked={selectedChurches.has(church.id)}
                name="churchIds"
                onChange={(event) => handleChurchChange(church.id, event.target.checked)}
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
          Cultos disponíveis para {role.name.toLocaleLowerCase("pt-BR")}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          O culto regular e cada culto especial podem ser marcados separadamente.
        </p>
        {selectedChurches.size === 0 ? (
          <p className="mt-3 rounded-md bg-surface-muted p-3 text-sm text-muted">
            Selecione ao menos uma igreja para ver os cultos disponíveis.
          </p>
        ) : null}
      </div>

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
          {calendarDays.map((day) => {
            const slots = displaySlotsByDate[day.date] ?? [];

            return (
              <div
                className={`min-h-28 min-w-0 border-b border-r border-border p-2 ${
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

                <div className="mt-2 grid gap-1.5">
                  {slots.map((slot) => (
                    <label
                      className={`flex min-w-0 cursor-pointer items-start gap-1.5 rounded-md border px-1.5 py-1 text-[10px] leading-4 transition ${
                        slot.isSpecial
                          ? "border-warning/40 bg-warning/10 text-foreground hover:bg-warning/15"
                          : "border-primary/20 bg-primary-soft text-primary-strong hover:brightness-95"
                      }`}
                      key={slot.key}
                    >
                      <input
                        checked={availableSlots.has(slot.key)}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--primary)]"
                        name="availableSlots"
                        onChange={(event) => handleSlotChange(slot.key, event.target.checked)}
                        type="checkbox"
                        value={slot.key}
                      />
                      <span className="min-w-0 break-words">
                        <span className={`block font-semibold ${slot.isSpecial ? "text-warning" : ""}`}>
                          {slot.label}
                        </span>
                        <span className="block text-muted">{slot.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid gap-2 p-3 sm:hidden">
          {hasVisibleSlots ? (
            calendarDays.flatMap((day) =>
              (displaySlotsByDate[day.date] ?? []).map((slot) => (
                <label
                  className={`flex min-w-0 items-start gap-3 rounded-md border p-3 text-sm ${
                    slot.isSpecial
                      ? "border-warning/40 bg-warning/10"
                      : "border-primary/20 bg-primary-soft/60"
                  }`}
                  key={`${day.date}:${slot.key}`}
                >
                  <input
                    checked={availableSlots.has(slot.key)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                    name="availableSlots"
                    onChange={(event) => handleSlotChange(slot.key, event.target.checked)}
                    type="checkbox"
                    value={slot.key}
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">
                      {formatDate(day.date)}
                    </span>
                    <span className={`block break-words font-semibold ${slot.isSpecial ? "text-warning" : "text-primary-strong"}`}>
                      {slot.label}
                    </span>
                    <span className="block break-words text-muted">{slot.detail}</span>
                  </span>
                </label>
              )),
            )
          ) : (
            <p className="rounded-md bg-surface-muted p-3 text-sm text-muted">
              {selectedChurches.size === 0
                ? "Selecione ao menos uma igreja para ver os cultos."
                : "Nenhum culto encontrado neste mês para as igrejas selecionadas."}
            </p>
          )}
        </div>
      </div>

      <SubmitButton>{`Salvar disponibilidade de ${role.name}`}</SubmitButton>
    </form>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function buildDisplaySlotsByDate({
  churchNames,
  selectedChurchIds,
  servicesByDate,
}: {
  churchNames: Map<string, string>;
  selectedChurchIds: string[];
  servicesByDate: Record<string, ServiceSummary[]>;
}) {
  const selectedChurches = new Set(selectedChurchIds);
  const result: Record<string, DisplaySlot[]> = {};

  for (const [serviceDate, services] of Object.entries(servicesByDate)) {
    const visibleServices = services.filter((service) =>
      selectedChurches.has(service.church_id),
    );
    const regularServices = visibleServices.filter((service) => !service.is_special);
    const specialServices = visibleServices.filter((service) => service.is_special);
    const slots: DisplaySlot[] = [];

    if (regularServices.length > 0) {
      const representative = regularServices[0];
      slots.push({
        detail: `${getTemplateLabel(representative.service_type)} · ${representative.start_time.slice(0, 5)}`,
        isSpecial: false,
        key: getRegularAvailabilitySlotKey(serviceDate),
        label: "Culto regular",
      });
    }

    for (const service of specialServices) {
      slots.push({
        detail: `${churchNames.get(service.church_id) ?? "Igreja"} · ${service.start_time.slice(0, 5)}`,
        isSpecial: true,
        key: getSpecialAvailabilitySlotKey(service.id),
        label: `Culto especial: ${service.title ?? "Especial"}`,
      });
    }

    result[serviceDate] = slots;
  }

  return result;
}
