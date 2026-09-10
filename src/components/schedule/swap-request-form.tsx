"use client";

import { MapPin } from "lucide-react";
import { useActionState, useState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AuthActionState } from "@/lib/auth/actions";
import { requestSwapAction } from "@/lib/escalas/actions";
import type { SwapTargetService, UserAgendaItem } from "@/lib/escalas/queries";

const initialState: AuthActionState = { message: "" };

export function SwapRequestForm({
  item,
  targets,
}: {
  item: UserAgendaItem;
  targets: SwapTargetService[];
}) {
  const [state, formAction] = useActionState(requestSwapAction, initialState);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const targetOptions = targets.filter((target) => {
    if (target.id === item.id) {
      return false;
    }

    if (item.roleKey === "pregador") {
      return Boolean(target.preacher_user_id) && target.preacher_user_id !== item.preacher_user_id;
    }

    return Boolean(target.singer_user_id) && target.singer_user_id !== item.singer_user_id;
  });
  const selectedTarget = targetOptions.find((target) => target.id === selectedTargetId);
  const selectedPerson = selectedTarget
    ? item.roleKey === "pregador"
      ? selectedTarget.preacher_name
      : selectedTarget.singer_name
    : null;

  return (
    <form
      action={formAction}
      className="grid min-w-0 gap-3 overflow-hidden rounded-md border border-border bg-background p-3"
    >
      <ActionMessage state={state} />
      <input name="sourceServiceId" type="hidden" value={item.id} />
      <input name="roleKey" type="hidden" value={item.roleKey} />

      <label className="grid min-w-0 gap-2 text-xs font-semibold text-primary-strong sm:text-sm">
        Solicitar permuta com
        <select
          className="h-10 min-w-0 max-w-full rounded-md border border-border bg-surface px-2 text-xs font-medium text-primary-strong outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-3 sm:text-sm"
          name="targetServiceId"
          onChange={(event) => setSelectedTargetId(event.target.value)}
          required
          value={selectedTargetId}
        >
          <option value="">Selecione outra escala</option>
          {targetOptions.map((target) => {
            const person =
              item.roleKey === "pregador" ? target.preacher_name : target.singer_name;

            return (
              <option key={target.id} value={target.id}>
                {formatDate(target.service_date)} · {person ?? "Escalado"} · {target.church_name}
              </option>
            );
          })}
        </select>
      </label>

      {selectedTarget ? (
        <div className="flex min-w-0 items-start gap-2 rounded-md border border-primary/30 bg-primary-soft px-3 py-2 text-xs leading-5 text-primary-strong sm:text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 break-words">
            <span className="font-semibold">{selectedPerson ?? "Pessoa selecionada"}</span>
            {" tem escala em "}
            <span className="font-semibold">{selectedTarget.church_name}</span>
            {` no dia ${formatDate(selectedTarget.service_date)}, às ${selectedTarget.start_time.slice(0, 5)}.`}
          </p>
        </div>
      ) : null}

      {targetOptions.length === 0 ? (
        <p className="text-xs leading-5 text-muted sm:text-sm">
          Nenhuma outra pessoa escalada nesta função durante o mês.
        </p>
      ) : null}

      <label className="grid min-w-0 gap-2 text-xs font-semibold text-primary-strong sm:text-sm">
        Motivo
        <textarea
          className="min-h-20 min-w-0 max-w-full rounded-md border border-border bg-surface px-3 py-2 text-xs font-normal text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm"
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
