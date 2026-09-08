import { ChurchForm } from "@/components/admin/church-form";
import { requireAdminUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function AdminIgrejasPage() {
  await requireAdminUser();

  const supabase = createAdminSupabaseClient();
  const { data: churches } = await supabase
    .from("churches")
    .select("id,name,city,state,active,created_at")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Administração
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Igrejas
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Cadastre igrejas para que usuários possam solicitar vínculo no cadastro
          e para que administradores criem usuários já vinculados.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Criar igreja
        </h2>
        <ChurchForm />
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">
            Igrejas cadastradas
          </h2>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {(churches ?? []).map((church) => (
            <article
              className="rounded-md border border-border bg-background p-4"
              key={church.id}
            >
              <h3 className="font-semibold text-foreground">{church.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {church.city} - {church.state}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                {church.active ? "Ativa" : "Inativa"}
              </p>
            </article>
          ))}

          {churches?.length === 0 ? (
            <p className="rounded-md bg-surface-muted p-4 text-sm text-muted">
              Nenhuma igreja cadastrada.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
