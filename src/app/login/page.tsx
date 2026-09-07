import { LoginPreviewForm } from "@/components/login-preview-form";

export default function LoginPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Login
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Acesso ao sistema
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Esta tela prepara o fluxo de entrada. A autenticação real ainda não
          foi implementada nesta etapa.
        </p>
      </section>

      <LoginPreviewForm />
    </div>
  );
}
