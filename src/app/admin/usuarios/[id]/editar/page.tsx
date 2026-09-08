import { notFound } from "next/navigation";
import { AdminEditUserForm } from "@/components/admin/admin-edit-user-form";
import { requireAdminUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type PageParams = Promise<{ id: string }>;

const statusLabels = {
  pending: "Pendente",
  approved: "Aprovado",
  blocked: "Bloqueado",
  inactive: "Inativo",
} as const;

export default async function AdminEditarUsuarioPage({
  params,
}: {
  params: PageParams;
}) {
  await requireAdminUser();

  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("id,full_name,email,phone,status")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Administração
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Editar usuário
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Atualize os dados básicos e o status de acesso de {user.full_name}.
        </p>
        <p className="mt-3 text-sm font-semibold text-primary">
          Status atual: {statusLabels[user.status]}
        </p>
      </section>

      <section className="mt-6">
        <AdminEditUserForm user={user} />
      </section>
    </div>
  );
}
