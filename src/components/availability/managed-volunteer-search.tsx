"use client";

import { Check, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { AvailabilityRoleKey } from "@/lib/disponibilidade/rules";

export type VolunteerSuggestion = {
  id: string;
  full_name: string;
};

type ManagedVolunteerSearchProps = {
  initialSearch: string;
  initialSuggestions: VolunteerSuggestion[];
  month: number;
  roleKey: AvailabilityRoleKey;
  roleName: string;
  selectedUserId?: string;
  year: number;
};

export function ManagedVolunteerSearch({
  initialSearch,
  initialSuggestions,
  month,
  roleKey,
  roleName,
  selectedUserId,
  year,
}: ManagedVolunteerSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(
    initialSearch.length >= 2 && !selectedUserId,
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      Promise.resolve().then(() => {
        setSuggestions([]);
        setIsLoading(false);
        setMessage(
          normalizedQuery.length === 1
            ? "Digite mais uma letra para ver as sugestões."
            : "",
        );
      });
      return;
    }

    if (
      selectedUserId &&
      normalizedQuery === initialSearch.trim()
    ) {
      Promise.resolve().then(() => {
        setSuggestions(initialSuggestions);
        setIsLoading(false);
        setIsOpen(false);
        setMessage("");
      });
      return;
    }

    if (
      normalizedQuery === initialSearch.trim() &&
      initialSuggestions.length > 0
    ) {
      Promise.resolve().then(() => {
        setSuggestions(initialSuggestions);
        setIsLoading(false);
        setMessage("");
      });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const searchParams = new URLSearchParams({
          busca: normalizedQuery,
          funcao: roleKey,
        });
        const response = await fetch(
          `/api/disponibilidade/equipe/usuarios?${searchParams.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          },
        );
        const result = (await response.json().catch(() => null)) as {
          message?: string;
          users?: VolunteerSuggestion[];
        } | null;

        if (!response.ok) {
          throw new Error(result?.message ?? "Não foi possível pesquisar as pessoas.");
        }

        const nextSuggestions = result?.users ?? [];
        setSuggestions(nextSuggestions);
        setMessage(
          nextSuggestions.length === 0
            ? "Nenhuma pessoa aprovada foi encontrada com esse nome."
            : "",
        );
        setIsOpen(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setSuggestions([]);
        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível pesquisar as pessoas.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [initialSearch, initialSuggestions, query, roleKey, selectedUserId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setMessage("Digite pelo menos 2 letras para pesquisar.");
      setIsOpen(false);
      return;
    }

    router.push(buildSearchHref({ month, query: normalizedQuery, roleKey, year }));
  }

  function selectSuggestion(person: VolunteerSuggestion) {
    setQuery(person.full_name);
    setIsOpen(false);
    setMessage("");
    router.push(
      buildSearchHref({
        month,
        query: person.full_name,
        roleKey,
        userId: person.id,
        year,
      }),
    );
  }

  return (
    <form
      className="relative mt-3 min-w-0"
      method="get"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
      onSubmit={handleSubmit}
    >
      <input name="ano" type="hidden" value={year} />
      <input name="mes" type="hidden" value={month} />
      <input name="funcao" type="hidden" value={roleKey} />
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <label className="sr-only" htmlFor="team-availability-search">
            Nome da pessoa
          </label>
          <input
            aria-autocomplete="list"
            aria-controls="team-availability-suggestions"
            aria-expanded={isOpen}
            autoComplete="off"
            className="h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            id="team-availability-search"
            maxLength={80}
            name="busca"
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(event.target.value.trim().length >= 2);
            }}
            onFocus={() => setIsOpen(query.trim().length >= 2)}
            placeholder="Digite pelo menos 2 letras do nome"
            role="combobox"
            type="search"
            value={query}
          />
          {isLoading ? (
            <Loader2
              aria-label="Pesquisando pessoas"
              className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-primary"
            />
          ) : (
            <Search
              aria-hidden="true"
              className="absolute right-3 top-3.5 h-4 w-4 text-muted"
            />
          )}

          {isOpen && query.trim().length >= 2 ? (
            <div
              className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg"
              id="team-availability-suggestions"
              role="listbox"
            >
              {suggestions.length > 0 ? (
                suggestions.map((person) => (
                  <button
                    aria-selected={selectedUserId === person.id}
                    className="flex w-full min-w-0 items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-muted focus:bg-surface-muted focus:outline-none"
                    key={person.id}
                    onClick={() => selectSuggestion(person)}
                    role="option"
                    type="button"
                  >
                    <span className="min-w-0 truncate">{person.full_name}</span>
                    {selectedUserId === person.id ? (
                      <Check
                        aria-label="Pessoa selecionada"
                        className="h-4 w-4 shrink-0 text-success"
                      />
                    ) : null}
                  </button>
                ))
              ) : isLoading ? (
                <p className="px-3 py-2 text-sm text-muted">Pesquisando...</p>
              ) : (
                <p className="px-3 py-2 text-sm text-muted">
                  Nenhuma pessoa aprovada foi encontrada com esse nome.
                </p>
              )}
            </div>
          ) : null}
        </div>
        <button
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
          type="submit"
        >
          <Search size={17} aria-hidden="true" />
          Pesquisar
        </button>
      </div>
      {message ? <p className="mt-2 text-sm text-warning">{message}</p> : null}
      <p className="mt-2 text-xs text-muted">
        As sugestões mostram somente pessoas aprovadas com função de {roleName.toLocaleLowerCase("pt-BR")}.
      </p>
    </form>
  );
}

function buildSearchHref({
  month,
  query,
  roleKey,
  userId,
  year,
}: {
  month: number;
  query: string;
  roleKey: AvailabilityRoleKey;
  userId?: string;
  year: number;
}) {
  const searchParams = new URLSearchParams({
    ano: String(year),
    busca: query,
    funcao: roleKey,
    mes: String(month),
  });

  if (userId) {
    searchParams.set("usuario", userId);
  }

  return `/disponibilidade/equipe?${searchParams.toString()}`;
}
