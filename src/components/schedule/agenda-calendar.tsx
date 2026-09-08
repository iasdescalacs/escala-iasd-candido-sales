"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MapPin, Mic2, Music2 } from "lucide-react";
import type { CalendarDay } from "@/lib/cultos/schedule";
import { getTemplateLabel } from "@/lib/cultos/schedule";
import type { UserAgendaItem } from "@/lib/escalas/queries";

export function AgendaCalendar({
  agenda,
  calendarDays,
}: {
  agenda: UserAgendaItem[];
  calendarDays: CalendarDay[];
}) {
  const agendaByDate = useMemo(() => groupAgendaByDate(agenda), [agenda]);
  const [selectedItemKey, setSelectedItemKey] = useState(() =>
    agenda[0] ? getAgendaKey(agenda[0]) : "",
  );
  const selectedItem =
    agenda.find((item) => getAgendaKey(item) === selectedItemKey) ?? agenda[0] ?? null;

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">Calendário</h2>
        </div>
        <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div className="px-2 py-2 text-center text-xs font-semibold uppercase text-muted" key={day}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => (
            <div
              className={`min-h-32 min-w-0 border-b border-r border-border p-2 ${
                day.currentMonth ? "bg-background" : "bg-surface-muted/60"
              }`}
              key={day.date}
            >
              <span className={`text-xs font-semibold ${day.currentMonth ? "text-foreground" : "text-muted"}`}>
                {day.day}
              </span>
              <div className="mt-2 grid gap-1">
                {(agendaByDate[day.date] ?? []).map((item) => {
                  const active = getAgendaKey(item) === selectedItemKey;

                  return (
                    <button
                      className={`rounded-md px-2 py-1 text-left text-[11px] leading-4 transition ${
                        active
                          ? "bg-primary text-white"
                          : "bg-primary-soft text-primary-strong hover:bg-primary-soft/80"
                      }`}
                      key={getAgendaKey(item)}
                      onClick={() => setSelectedItemKey(getAgendaKey(item))}
                      type="button"
                    >
                      <p className="truncate font-semibold">
                        {item.roleKey === "pregador" ? "Pregação" : "Louvor"}
                      </p>
                      <p className={`truncate ${active ? "text-white/85" : "text-muted"}`}>
                        {item.church_name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem ? <AgendaDetails item={selectedItem} /> : null}
    </div>
  );
}

function AgendaDetails({ item }: { item: UserAgendaItem }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
        Detalhes da escala
      </p>
      <h3 className="mt-2 text-lg font-semibold text-foreground">
        {formatDate(item.service_date)} · {item.start_time.slice(0, 5)}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {item.title ?? getTemplateLabel(item.service_type)}
      </p>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <DetailLine
          icon={<MapPin size={16} aria-hidden="true" />}
          label="Local"
          value={`${item.church_name} - ${item.church_city}/${item.church_state}`}
        />
        <DetailLine
          icon={<Mic2 size={16} aria-hidden="true" />}
          label="Pregador"
          value={item.preacher_name ?? "A definir"}
        />
        <DetailLine
          icon={<Music2 size={16} aria-hidden="true" />}
          label="Louvor"
          value={item.singer_name ?? "A definir"}
        />
      </div>
    </article>
  );
}

function DetailLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-2 rounded-md bg-background p-3">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-muted">{label}</p>
        <p className="truncate font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function groupAgendaByDate(agenda: UserAgendaItem[]) {
  const grouped: Record<string, UserAgendaItem[]> = {};

  for (const item of agenda) {
    grouped[item.service_date] = grouped[item.service_date] ?? [];
    grouped[item.service_date].push(item);
  }

  return grouped;
}

function getAgendaKey(item: UserAgendaItem) {
  return `${item.id}-${item.roleKey}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
