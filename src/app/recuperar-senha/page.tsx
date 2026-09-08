import { RecoveryForm } from "@/components/auth/recovery-form";

export default function RecuperarSenhaPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Senha
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Recuperar senha
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Informe seu e-mail para receber as instruções de recuperação, caso ele
          exista no sistema.
        </p>
      </section>

      <RecoveryForm />
    </div>
  );
}
