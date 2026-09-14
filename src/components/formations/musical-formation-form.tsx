"use client";

import { Search, UsersRound } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { saveMusicalFormationAction } from "@/lib/formacoes/actions";
import {
  musicalFormationTypes,
  type MusicalFormationType,
} from "@/lib/formacoes/rules";
import type {
  FormationChurchOption,
  FormationSingerOption,
  MusicalFormationSummary,
} from "@/lib/formacoes/queries";
import type { AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { message: "" };

export function MusicalFormationForm({
  churches,
  currentUserId,
  formation,
  singers,
}: {
  churches: FormationChurchOption[];
  currentUserId: string;
  formation?: MusicalFormationSummary | null;
  singers: FormationSingerOption[];
}) {
  const [state, formAction] = useActionState(
    saveMusicalFormationAction,
    initialState,
  );
  const currentSingerExists = singers.some(
    (singer) => singer.id === currentUserId,
  );
  const initialMemberIds = formation
    ? formation.members.map((member) => member.id)
    : currentSingerExists
      ? [currentUserId]
      : [];
  const initialResponsibleIds = formation
    ? formation.members
        .filter((member) => member.isResponsible)
        .map((member) => member.id)
    : currentSingerExists
      ? [currentUserId]
      : [];
  const [memberIds, setMemberIds] = useState(initialMemberIds);
  const [responsibleIds, setResponsibleIds] = useState(
    initialResponsibleIds,
  );
  const [formationType, setFormationType] = useState<MusicalFormationType>(
    formation?.formationType ?? "dupla",
  );
  const [search, setSearch] = useState("");
  const filteredSingers = useMemo(() => {
    const normalizedSearch = search
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");

    if (!normalizedSearch) {
      return singers;
    }

    return singers.filter((singer) =>
      singer.fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearch),
    );
  }, [search, singers]);

  function toggleMember(userId: string, selected: boolean) {
    setMemberIds((current) =>
      selected
        ? Array.from(new Set([...current, userId]))
        : current.filter((id) => id !== userId),
    );

    if (!selected) {
      setResponsibleIds((current) =>
        current.filter((id) => id !== userId),
      );
    }
  }

  function toggleResponsible(userId: string, selected: boolean) {
    if (selected) {
      setMemberIds((current) => Array.from(new Set([...current, userId])));
      setResponsibleIds((current) =>
        Array.from(new Set([...current, userId])),
      );
      return;
    }

    setResponsibleIds((current) => current.filter((id) => id !== userId));
  }

  return (
    <form
      action={formAction}
      className="grid min-w-0 gap-5"
    >
      <ActionMessage state={state} />
      {formation ? (
        <input name="formationId" type="hidden" value={formation.id} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(11rem,0.6fr)_minmax(13rem,0.9fr)]">
        <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
          Nome da formação
          <input
            className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={formation?.name}
            maxLength={100}
            minLength={3}
            name="name"
            placeholder="Ex.: Vozes da Promessa"
            required
          />
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
          Tipo
          <select
            className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="formationType"
            onChange={(event) =>
              setFormationType(event.target.value as MusicalFormationType)
            }
            value={formationType}
          >
            {musicalFormationTypes.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
          Igreja de origem
          <select
            className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={formation?.homeChurchId ?? ""}
            name="homeChurchId"
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
      </div>

      <fieldset className="grid min-w-0 gap-3">
        <legend className="text-sm font-semibold text-foreground">
          Igrejas onde aceita ser escalada
        </legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {churches.map((church) => (
            <label
              className="flex min-w-0 items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              key={church.id}
            >
              <input
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                defaultChecked={formation?.churchIds.includes(church.id)}
                name="churchIds"
                type="checkbox"
                value={church.id}
              />
              <span className="min-w-0 break-words">{church.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid min-w-0 gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <legend className="text-sm font-semibold text-foreground">
              Integrantes e responsáveis
            </legend>
            <p className="mt-1 text-xs text-muted">
              {formationType === "dupla"
                ? "Selecione 2 integrantes."
                : formationType === "trio"
                  ? "Selecione 3 integrantes."
                  : "Selecione pelo menos 2 integrantes."}
            </p>
          </div>
          <label className="relative min-w-0 sm:w-72">
            <span className="sr-only">Pesquisar cantor</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              size={16}
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar cantor"
              type="search"
              value={search}
            />
          </label>
        </div>

        <div className="max-h-80 min-w-0 overflow-y-auto rounded-md border border-border">
          <div className="sticky top-0 grid grid-cols-[minmax(0,1fr)_5.5rem_6.5rem] border-b border-border bg-surface-muted px-3 py-2 text-xs font-semibold uppercase text-muted">
            <span>Cantor</span>
            <span className="text-center">Integrante</span>
            <span className="text-center">Responsável</span>
          </div>
          {filteredSingers.map((singer) => (
            <div
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_5.5rem_6.5rem] items-center border-b border-border px-3 py-2 last:border-b-0"
              key={singer.id}
            >
              <span className="min-w-0 truncate pr-2 text-sm font-medium text-foreground">
                {singer.fullName}
              </span>
              <label className="flex justify-center">
                <span className="sr-only">
                  Marcar {singer.fullName} como integrante
                </span>
                <input
                  checked={memberIds.includes(singer.id)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  name="memberIds"
                  onChange={(event) =>
                    toggleMember(singer.id, event.target.checked)
                  }
                  type="checkbox"
                  value={singer.id}
                />
              </label>
              <label className="flex justify-center">
                <span className="sr-only">
                  Marcar {singer.fullName} como responsável
                </span>
                <input
                  checked={responsibleIds.includes(singer.id)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  name="responsibleIds"
                  onChange={(event) =>
                    toggleResponsible(singer.id, event.target.checked)
                  }
                  type="checkbox"
                  value={singer.id}
                />
              </label>
            </div>
          ))}
          {filteredSingers.length === 0 ? (
            <p className="p-4 text-sm text-muted">
              Nenhum cantor aprovado encontrado.
            </p>
          ) : null}
        </div>
      </fieldset>

      {formation?.canModerate ? (
        <label className="grid max-w-xs gap-2 text-sm font-medium text-foreground">
          Situação
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue={formation.status}
            name="status"
          >
            <option value="pending">Aguardando aprovação</option>
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
          </select>
        </label>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <UsersRound size={18} aria-hidden="true" />
        </span>
        <SubmitButton>
          {formation ? "Salvar formação" : "Criar formação"}
        </SubmitButton>
      </div>
    </form>
  );
}
