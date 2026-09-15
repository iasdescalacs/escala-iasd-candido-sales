"use client";

import { ChevronDown, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import type { ChurchOption, RoleOption } from "@/lib/admin/lookups";
import {
  createUserByAdminAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { requiresPrimaryChurch } from "@/lib/auth/role-rules";
import { ActionMessage } from "@/components/auth/action-message";
import { PasswordField } from "@/components/auth/password-field";
import { PhoneInput } from "@/components/auth/phone-input";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthActionState = { message: "" };

export function AdminCreateUserForm({
  roles,
  churches,
}: {
  roles: RoleOption[];
  churches: ChurchOption[];
}) {
  const [state, formAction] = useActionState(createUserByAdminAction, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);
  const [churchId, setChurchId] = useState("");
  const primaryChurchRequired = requiresPrimaryChurch(selectedRoleKeys);
  const missingRequiredOptions =
    roles.length === 0 || (primaryChurchRequired && churches.length === 0);

  function handleRoleChange(roleKey: string, checked: boolean) {
    const nextRoleKeys = checked
      ? [...selectedRoleKeys, roleKey]
      : selectedRoleKeys.filter((selectedRoleKey) => selectedRoleKey !== roleKey);

    setSelectedRoleKeys(nextRoleKeys);

    if (!requiresPrimaryChurch(nextRoleKeys)) {
      setChurchId("");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-surface-muted"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <UserPlus size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-foreground">
              Criar usuário
            </span>
            <span className="block truncate text-sm text-muted">
              Expandir formulário para cadastrar uma nova pessoa.
            </span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`}
          size={18}
        />
      </button>

      {isOpen ? (
    <form action={formAction} className="grid gap-4 border-t border-border p-6">
      <ActionMessage state={state} />

      {missingRequiredOptions ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          Cadastre pelo menos uma igreja ativa antes de criar usuários vinculados.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-foreground lg:col-span-2">
          Nome completo
          <input
            autoComplete="name"
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="fullName"
            placeholder="Nome do usuário"
            required
            type="text"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Telefone
          <PhoneInput />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          E-mail
          <input
            autoComplete="email"
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            inputMode="email"
            name="email"
            placeholder="usuario@exemplo.com"
            required
            type="email"
          />
        </label>

        <fieldset className="grid gap-2 text-sm font-medium text-foreground lg:col-span-2">
          <legend>Funções</legend>
          <div className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-2">
            <label className="flex min-h-10 items-center gap-3 rounded-md px-2 text-sm font-medium text-foreground transition hover:bg-surface-muted">
              <input
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                checked={selectedRoleKeys.includes("admin")}
                disabled={roles.length === 0}
                name="roleKeys"
                onChange={(event) => handleRoleChange("admin", event.target.checked)}
                type="checkbox"
                value="admin"
              />
              Administrador
            </label>
            {roles.map((role) => (
              <label
                className="flex min-h-10 items-center gap-3 rounded-md px-2 text-sm font-medium text-foreground transition hover:bg-surface-muted"
                key={role.id}
              >
                <input
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  checked={selectedRoleKeys.includes(role.key)}
                  disabled={roles.length === 0}
                  name="roleKeys"
                  onChange={(event) => handleRoleChange(role.key, event.target.checked)}
                  type="checkbox"
                  value={role.key}
                />
                {role.name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Igreja de vínculo
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={!primaryChurchRequired || churches.length === 0}
            name="churchId"
            onChange={(event) => setChurchId(event.target.value)}
            required={primaryChurchRequired}
            value={churchId}
          >
            <option value="">
              {primaryChurchRequired ? "Selecione" : "Não se aplica ao Pastor"}
            </option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-muted">
            {primaryChurchRequired
              ? "Obrigatória para funções com gestão local."
              : "O Pastor recebe acesso global sem vínculo com uma igreja específica."}
          </span>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          Status
          <select
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="status"
            required
          >
            <option value="approved">Aprovado</option>
            <option value="pending">Pendente</option>
            <option value="blocked">Bloqueado</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>

        <PasswordField autoComplete="new-password" label="Senha inicial" name="password" />
      </div>

      <SubmitButton>Criar usuário</SubmitButton>
    </form>
      ) : null}
    </div>
  );
}
