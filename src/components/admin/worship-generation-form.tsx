"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { ChurchOption } from "@/lib/admin/lookups";
import { generateWorshipServicesAction } from "@/lib/cultos/actions";
import type { AuthActionState } from "@/lib/auth/actions";
import { getMonthName } from "@/lib/cultos/schedule";

const initialState: AuthActionState = { message: "" };

export function WorshipGenerationForm({
  churches,
  defaultMonth,
  defaultYear,
  isAdmin,
}: {
  churches: ChurchOption[];
  defaultMonth: number;
  defaultYear: number;
  isAdmin: boolean;
}) {
  const [state, formAction] = useActionState(
    generateWorshipServicesAction,
    initialState,
  );
  const years = Array.from({ length: 7 }, (_, index) => defaultYear - 1 + index);
  const hasChurches = churches.length > 0;
  const defaultChurchId =
    !isAdmin && churches.length === 1 ? churches[0].id : "todas";

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm">
      <ActionMessage state={state} />

      {!hasChurches ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          Nenhuma igreja ativa está vinculada ao seu perfil de gestão.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          Igreja
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={defaultChurchId}
            disabled={!hasChurches}
            name="churchId"
            required
          >
            <option value="todas">
              {isAdmin ? "Todas as igrejas ativas" : "Todas as igrejas vinculadas"}
            </option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Mês inicial
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={defaultMonth}
            name="startMonth"
            required
          >
            {monthOptions()}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Mês final
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={defaultMonth}
            name="endMonth"
            required
          >
            {monthOptions()}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Ano
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={defaultYear}
            name="year"
            required
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm leading-6 text-muted">
        Serão gerados cultos somente para a seleção acima: quarta-feira das
        19:45 às 21:00, sábado das 08:45 às 12:00 e domingo das 19:45 às 21:00.
      </p>

      <SubmitButton disabled={!hasChurches}>Gerar cultos</SubmitButton>
    </form>
  );
}

function monthOptions() {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    return (
      <option key={month} value={month}>
        {capitalize(getMonthName(month))}
      </option>
    );
  });
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}
