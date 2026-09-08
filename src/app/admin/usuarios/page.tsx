import Link from "next/link";
import { Pencil } from "lucide-react";
import { AdminCreateUserForm } from "@/components/admin/admin-create-user-form";
import { UserStatusActions } from "@/components/admin/user-status-actions";
import { getChurchOptions, getRoleOptions } from "@/lib/admin/lookups";
import { requireAdminUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const statusLabels = {
  pending: "Pendente",
  approved: "Aprovado",
  blocked: "Bloqueado",
  inactive: "Inativo",
} as const;

export default async function AdminUsuariosPage() {
  await requireAdminUser();
  const [roles, churches] = await Promise.all([
    getRoleOptions(),
    getChurchOptions(),
  ]);
  const supabase = await createServerSupabaseClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, phone, status, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Administração
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Usuários
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Aprove, bloqueie ou inactive cadastros. Esta área é protegida no
          servidor e no banco.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Criar usuário
        </h2>
        <AdminCreateUserForm churches={churches} roles={roles} />
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">
            Usuários cadastrados
          </h2>
        </div>
        <div className="grid gap-3 p-4">
          {(users ?? []).map((user) => (
            <article
              className="relative grid gap-3 rounded-md border border-border bg-background p-4 pr-14 lg:grid-cols-[1.2fr_1fr_auto]"
              key={user.id}
            >
              <Link
                aria-label={`Editar ${user.full_name}`}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted transition hover:bg-surface-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                href={`/admin/usuarios/${user.id}/editar`}
                title="Editar usuário"
              >
                <Pencil size={16} aria-hidden="true" />
              </Link>
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-foreground">
                  {user.full_name}
                </h2>
                <p className="truncate text-sm text-muted">{user.email}</p>
              </div>
              <div className="text-sm text-muted">
                <p>{user.phone ?? "Telefone não informado"}</p>
                <p>Status: {statusLabels[user.status]}</p>
              </div>
              <UserStatusActions currentStatus={user.status} userId={user.id} />
            </article>
          ))}

          {users?.length === 0 ? (
            <p className="rounded-md bg-surface-muted p-4 text-sm text-muted">
              Nenhum usuário encontrado.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
