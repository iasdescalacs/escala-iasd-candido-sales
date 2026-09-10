"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AuthActionState } from "@/lib/auth/actions";
import { requestSwapAction } from "@/lib/escalas/actions";
import type { ScheduleService, UserAgendaItem } from "@/lib/escalas/queries";
import { getTemplateLabel } from "@/lib/cultos/schedule";

const initialState: AuthActionState = { message: "" };

export function SwapRequestForm({
  item,
  targets,
}: {
  item: UserAgendaItem;
  targets: ScheduleService[];
}) {
  const [state, formAction] = useActionState(requestSwapAction, initialState);
  const targetOptions = targets.filter((target) => {
    if (target.id === item.id) {
      return false;
    }

    if (item.roleKey === "pregador") {
      return Boolean(target.preacher_user_id) && target.preacher_user_id !== item.preacher_user_id;
    }

    return Boolean(target.singer_user_id) && target.singer_user_id !== item.singer_user_id;
  });

  return (
    <form
      action={formAction}
      className="grid min-w-0 gap-3 overflow-hidden rounded-md border border-border bg-background p-3"
    >
      <ActionMessage state={state} />
      <input name="sourceServiceId" type="hidden" value={item.id} />
      <input name="roleKey" type="hidden" value={item.roleKey} />

      <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
        Solicitar permuta com
        <select
          className="h-10 min-w-0 max-w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          name="targetServiceId"
          required
        >
          <option value="">Selecione outra escala</option>
          {targetOptions.map((target) => {
            const person =
              item.roleKey === "pregador" ? target.preacher_name : target.singer_name;

            return (
              <option key={target.id} value={target.id}>
                {formatDate(target.service_date)} · {target.start_time.slice(0, 5)} · {person ?? "Escalado"} · {target.title ?? getTemplateLabel(target.service_type)}
              </option>
            );
          })}
        </select>
      </label>

      <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
        Motivo
        <textarea
          className="min-h-20 min-w-0 max-w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          name="reason"
          placeholder="Explique rapidamente o motivo da permuta"
        />
      </label>

      <SubmitButton>Solicitar permuta</SubmitButton>
    </form>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
