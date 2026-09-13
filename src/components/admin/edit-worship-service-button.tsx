"use client";

import { Loader2, Pencil, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useActionState,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { ActionMessage } from "@/components/auth/action-message";
import type { AuthActionState } from "@/lib/auth/actions";
import { updateWorshipServiceAction } from "@/lib/cultos/actions";
import {
  specialWorshipOptions,
  type WorshipSpecialType,
} from "@/lib/cultos/schedule";

const initialState: AuthActionState = { message: "" };

type EditableWorshipService = {
  id: string;
  churchName: string;
  dateLabel: string;
  endTime: string;
  isSpecial: boolean;
  notes: string | null;
  specialType: WorshipSpecialType | null;
  startTime: string;
  title: string | null;
};

type WorshipServiceDraft = ReturnType<typeof createDraft>;
type OpenEditor = (service: EditableWorshipService) => void;

const WorshipServiceEditorContext = createContext<OpenEditor | null>(null);

export function WorshipServiceEditorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedService, setSelectedService] =
    useState<EditableWorshipService | null>(null);
  const [draft, setDraft] = useState<WorshipServiceDraft>(emptyDraft);
  const [state, formAction] = useActionState(
    updateWorshipServiceAction,
    initialState,
  );

  useEffect(() => {
    if (selectedService && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [selectedService]);

  useEffect(() => {
    if (state.ok) {
      dialogRef.current?.close();
    }
  }, [state]);

  function openEditor(service: EditableWorshipService) {
    setDraft(createDraft(service));
    setSelectedService(service);
  }

  return (
    <WorshipServiceEditorContext.Provider value={openEditor}>
      {children}
      <dialog
        aria-labelledby="edit-worship-service-title"
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-lg border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/50"
        onClose={() => setSelectedService(null)}
        ref={dialogRef}
      >
        {selectedService ? (
          <form
            action={formAction}
            className="grid max-h-[calc(100dvh-2rem)] overflow-y-auto"
          >
            <ActionMessage state={state} />
            <input name="serviceId" type="hidden" value={selectedService.id} />
            <input
              name="isSpecial"
              type="hidden"
              value={selectedService.isSpecial ? "true" : "false"}
            />

            <header className="flex items-start gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <h2
                  className="text-lg font-semibold text-foreground"
                  id="edit-worship-service-title"
                >
                  Editar culto
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {selectedService.churchName} · {selectedService.dateLabel}
                </p>
              </div>
              <button
                aria-label="Fechar edição"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface-muted hover:text-foreground"
                onClick={() => dialogRef.current?.close()}
                title="Fechar"
                type="button"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </header>

            <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-5">
              <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
                Início
                <input
                  className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  name="startTime"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  required
                  type="time"
                  value={draft.startTime}
                />
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
                Término
                <input
                  className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  name="endTime"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  required
                  type="time"
                  value={draft.endTime}
                />
              </label>

              {selectedService.isSpecial ? (
                <>
                  <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground sm:col-span-2">
                    Nome do culto
                    <input
                      className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      maxLength={120}
                      name="title"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      required
                      type="text"
                      value={draft.title}
                    />
                  </label>

                  <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground sm:col-span-2">
                    Tipo do culto especial
                    <select
                      className="h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      name="specialType"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          specialType: event.target.value as WorshipSpecialType,
                        }))
                      }
                      required
                      value={draft.specialType}
                    >
                      {specialWorshipOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground sm:col-span-2">
                Observações
                <textarea
                  className="min-h-24 min-w-0 resize-y rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                  maxLength={500}
                  name="notes"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Informações adicionais do culto"
                  value={draft.notes}
                />
              </label>
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-border px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                onClick={() => dialogRef.current?.close()}
                type="button"
              >
                <X size={16} aria-hidden="true" />
                Cancelar
              </button>
              <SaveButton />
            </footer>
          </form>
        ) : null}
      </dialog>
    </WorshipServiceEditorContext.Provider>
  );
}

export function EditWorshipServiceButton({
  service,
}: {
  service: EditableWorshipService;
}) {
  const openEditor = useContext(WorshipServiceEditorContext);

  if (!openEditor) {
    throw new Error("Editor de cultos não configurado.");
  }

  return (
    <button
      aria-haspopup="dialog"
      aria-label={`Editar o culto de ${service.dateLabel}`}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground transition hover:brightness-95"
      onClick={() => openEditor(service)}
      title="Editar culto"
      type="button"
    >
      <Pencil size={11} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}

const emptyDraft = {
  endTime: "21:00",
  notes: "",
  specialType: "outro" as WorshipSpecialType,
  startTime: "19:45",
  title: "",
};

function createDraft(service: EditableWorshipService) {
  return {
    endTime: service.endTime,
    notes: service.notes ?? "",
    specialType: service.specialType ?? ("outro" as WorshipSpecialType),
    startTime: service.startTime,
    title: service.title ?? "",
  };
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
      ) : (
        <Pencil size={16} aria-hidden="true" />
      )}
      {pending ? "Salvando..." : "Salvar alterações"}
    </button>
  );
}
