import { SignUpForm } from "@/components/auth/sign-up-form";
import { getChurchOptions, getRoleOptions } from "@/lib/admin/lookups";

export default async function CadastroPage() {
  const [roles, churches] = await Promise.all([
    getRoleOptions(),
    getChurchOptions(),
  ]);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Cadastro
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Solicitar acesso
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Preencha seus dados para criar uma conta pendente. O acesso ao sistema
          só será liberado depois da aprovação administrativa.
        </p>
      </section>

      <SignUpForm churches={churches} roles={roles} />
    </div>
  );
}
