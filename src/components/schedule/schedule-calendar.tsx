"use client";

import { useActionState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { ActionMessage } from "@/components/auth/action-message";
import {
  assignScheduleAction,
  clearScheduleAction,
  reviewSwapRequestAction,
} from "@/lib/escalas/actions";
import type {
  ScheduleChurch,
  ScheduleRoleKey,
  ScheduleService,
  SwapRequestSummary,
  VolunteerOption,
} from "@/lib/escalas/queries";
import type { CalendarDay } from "@/lib/cultos/schedule";
import { getTemplateLabel } from "@/lib/cultos/schedule";
import type { AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { message: "" };

export function ScheduleCalendar({
  calendarDays,
  churches,
  roleKey,
  services,
  swapRequests,
  title,
  volunteers,
}: {
  calendarDays: CalendarDay[];
  churches: ScheduleChurch[];
  roleKey: ScheduleRoleKey;
  services: ScheduleService[];
  swapRequests: SwapRequestSummary[];
  title: string;
  volunteers: VolunteerOption[];
}) {
  const [state, formAction] = useActionState(assignScheduleAction, initialState);
  const churchesById = new Map(churches.map((church) => [church.id, church.name]));
  const servicesByDate = groupServicesByDate(services);

  return (
    <div className="grid gap-6">
      <ActionMessage state={state} />

      {swapRequests.length > 0 ? (
        <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Permutas pendentes
          </h2>
          <div className="mt-3 grid gap-3">
            {swapRequests.map((request) => (
              <article
                className="grid gap-3 rounded-md border border-border bg-background p-3 text-sm md:grid-cols-[1fr_auto]"
                key={request.id}
              >
                <div className="min-w-0 text-muted">
                  <p className="font-semibold text-foreground">
                    {request.requester_name} solicitou permuta com {request.target_name}
                  </p>
                  <p>
                    {formatDate(request.source_date)} por {formatDate(request.target_date)}
                  </p>
                  {request.reason ? <p className="mt-1">{request.reason}</p> : null}
                </div>
                <div className="flex gap-2">
                  <form action={reviewSwapRequestAction}>
                    <input name="requestId" type="hidden" value={request.id} />
                    <input name="decision" type="hidden" value="approved" />
                    <button className="h-10 rounded-md bg-success px-3 text-sm font-semibold text-white transition hover:brightness-95" type="submit">
                      Aprovar
                    </button>
                  </form>
                  <form action={reviewSwapRequestAction}>
                    <input name="requestId" type="hidden" value={request.id} />
                    <input name="decision" type="hidden" value="rejected" />
                    <button className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted" type="submit">
                      Recusar
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
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
              className={`min-h-44 min-w-0 border-b border-r border-border p-2 ${
                day.currentMonth ? "bg-background" : "bg-surface-muted/60"
              }`}
              key={day.date}
            >
              <span className={`text-xs font-semibold ${day.currentMonth ? "text-foreground" : "text-muted"}`}>
                {day.day}
              </span>
              <div className="mt-2 grid gap-2">
                {(servicesByDate[day.date] ?? []).map((service) => {
                  const assignedName =
                    roleKey === "pregador" ? service.preacher_name : service.singer_name;
                  const availableVolunteers = volunteers.filter(
                    (volunteer) =>
                      volunteer.church_id === service.church_id &&
                      volunteer.service_date === service.service_date,
                  );

                  return (
                    <article className="grid gap-2 rounded-md bg-surface p-2 shadow-sm" key={service.id}>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-primary">
                          {service.title ?? getTemplateLabel(service.service_type)}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {churchesById.get(service.church_id) ?? "Igreja"} · {service.start_time.slice(0, 5)}
                        </p>
                        <p className="truncate text-[11px] text-foreground">
                          {assignedName ?? "A definir"}
                        </p>
                      </div>

                      <form action={formAction} className="grid gap-2">
                        <input name="serviceId" type="hidden" value={service.id} />
                        <input name="roleKey" type="hidden" value={roleKey} />
                        <select
                          className="h-9 min-w-0 rounded-md border border-border bg-background px-2 text-[11px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          defaultValue=""
                          name="userId"
                          required
                        >
                          <option value="">Selecionar</option>
                          {availableVolunteers.map((volunteer) => (
                            <option key={volunteer.id} value={volunteer.id}>
                              {volunteer.full_name}
                            </option>
                          ))}
                        </select>
                        <ScheduleFormButton
                          className="bg-success text-white hover:brightness-95"
                          icon="save"
                          label="Salvar"
                        />
                      </form>

                      {assignedName ? (
                        <form action={clearScheduleAction}>
                          <input name="serviceId" type="hidden" value={service.id} />
                          <input name="roleKey" type="hidden" value={roleKey} />
                          <ScheduleFormButton
                            className="bg-red-600 text-white hover:bg-red-700"
                            icon="delete"
                            label="Excluir"
                          />
                        </form>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScheduleFormButton({
  className,
  icon,
  label,
}: {
  className: string;
  icon: "delete" | "save";
  label: string;
}) {
  const { pending } = useFormStatus();
  const Icon = icon === "save" ? Save : Trash2;

  return (
    <button
      aria-label={label}
      className={`inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      disabled={pending}
      title={label}
      type="submit"
    >
      {pending ? <Loader2 className="animate-spin" size={14} /> : <Icon size={14} />}
      <span>{pending ? "Aguarde" : label}</span>
    </button>
  );
}

function groupServicesByDate(services: ScheduleService[]) {
  const grouped: Record<string, ScheduleService[]> = {};

  for (const service of services) {
    grouped[service.service_date] = grouped[service.service_date] ?? [];
    grouped[service.service_date].push(service);
  }

  return grouped;
}

function formatDate(value: string) {
  if (!value) {
    return "data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
