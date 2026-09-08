"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { ChurchOption } from "@/lib/admin/lookups";
import type { AuthActionState } from "@/lib/auth/actions";
import { createSpecialWorshipServicesAction } from "@/lib/cultos/actions";
import { specialWorshipOptions } from "@/lib/cultos/schedule";

const initialState: AuthActionState = { message: "" };

export function SpecialWorshipForm({
  churches,
  defaultDate,
}: {
  churches: ChurchOption[];
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(
    createSpecialWorshipServicesAction,
    initialState,
  );
  const hasChurches = churches.length > 0;

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

      {!hasChurches ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          Cadastre pelo menos uma igreja ativa antes de criar cultos especiais.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium text-foreground lg:col-span-2">
          Igreja
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={!hasChurches}
            name="churchId"
            required
          >
            <option value="">Selecione</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Tipo
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="specialType"
            required
          >
            {specialWorshipOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Nome do culto
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="title"
            placeholder="Ex.: Semana de Oração Jovem"
            required
            type="text"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Data inicial
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={defaultDate}
            name="startDate"
            required
            type="date"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Data final
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={defaultDate}
            name="endDate"
            required
            type="date"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Início
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue="19:45"
            name="startTime"
            required
            type="time"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Término
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue="21:00"
            name="endTime"
            required
            type="time"
          />
        </label>
      </div>

      <SubmitButton>Criar culto especial</SubmitButton>
    </form>
  );
}
