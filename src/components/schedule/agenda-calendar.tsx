"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, MapPin, Mic2, Music2 } from "lucide-react";
import { SwapRequestForm } from "@/components/schedule/swap-request-form";
import type { CalendarDay } from "@/lib/cultos/schedule";
import { getTemplateLabel } from "@/lib/cultos/schedule";
import type { ScheduleService, UserAgendaItem } from "@/lib/escalas/queries";

export function AgendaCalendar({
  agenda,
  calendarDays,
  swapTargets,
}: {
  agenda: UserAgendaItem[];
  calendarDays: CalendarDay[];
  swapTargets: ScheduleService[];
}) {
  const agendaByDate = useMemo(() => groupAgendaByDate(agenda), [agenda]);
  const preachingItems = agenda.filter((item) => item.roleKey === "pregador");
  const musicItems = agenda.filter((item) => item.roleKey === "cantor");
  const [selectedPreachingKey, setSelectedPreachingKey] = useState(() =>
    preachingItems[0] ? getAgendaKey(preachingItems[0]) : "",
  );
  const [selectedMusicKey, setSelectedMusicKey] = useState(() =>
    musicItems[0] ? getAgendaKey(musicItems[0]) : "",
  );
  const selectedPreaching =
    preachingItems.find((item) => getAgendaKey(item) === selectedPreachingKey) ??
    preachingItems[0] ??
    null;
  const selectedMusic =
    musicItems.find((item) => getAgendaKey(item) === selectedMusicKey) ?? musicItems[0] ?? null;

  function selectItem(item: UserAgendaItem) {
    if (item.roleKey === "pregador") {
      setSelectedPreachingKey(getAgendaKey(item));
    } else {
      setSelectedMusicKey(getAgendaKey(item));
    }
  }

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
                  const active =
                    getAgendaKey(item) === selectedPreachingKey ||
                    getAgendaKey(item) === selectedMusicKey;

                  return (
                    <button
                      className={`rounded-md px-2 py-1 text-left text-[11px] leading-4 transition ${
                        active
                          ? "bg-primary text-white"
                          : "bg-primary-soft text-primary-strong hover:bg-primary-soft/80"
                      }`}
                      key={getAgendaKey(item)}
                      onClick={() => selectItem(item)}
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

      <section className="grid gap-4 lg:grid-cols-2">
        <AgendaRoleSection
          emptyText="Nenhuma pregação encontrada para este mês."
          item={selectedPreaching}
          title="Pregação"
          targets={swapTargets}
        />
        <AgendaRoleSection
          emptyText="Nenhum louvor encontrado para este mês."
          item={selectedMusic}
          title="Louvor"
          targets={swapTargets}
        />
      </section>
    </div>
  );
}

function AgendaRoleSection({
  emptyText,
  item,
  targets,
  title,
}: {
  emptyText: string;
  item: UserAgendaItem | null;
  targets: ScheduleService[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {item ? (
        <div className="mt-3 grid gap-4">
          <AgendaDetails item={item} />
          <SwapRequestForm item={item} targets={targets} />
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3 rounded-md bg-surface-muted p-3 text-sm text-muted">
          <CalendarDays size={18} aria-hidden="true" />
          {emptyText}
        </div>
      )}
    </article>
  );
}

function AgendaDetails({ item }: { item: UserAgendaItem }) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
        {formatDate(item.service_date)} · {item.start_time.slice(0, 5)}
      </p>
      <p className="text-sm text-muted">
        {item.title ?? getTemplateLabel(item.service_type)}
      </p>
      <div className="grid gap-3 text-sm">
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
    </div>
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
