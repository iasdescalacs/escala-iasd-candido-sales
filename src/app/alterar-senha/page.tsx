import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { requireApprovedUser } from "@/lib/auth/session";

export default async function AlterarSenhaPage() {
  await requireApprovedUser();

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Segurança
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Alterar senha
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Escolha uma nova senha com pelo menos 8 caracteres.
        </p>
      </section>

      <UpdatePasswordForm />
    </div>
  );
}
