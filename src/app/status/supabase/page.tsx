import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default function SupabaseStatusPage() {
  const configurado = hasSupabaseBrowserEnv();

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Status do Supabase
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
          Conexão com PostgreSQL
        </h1>
        <section className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Variáveis de ambiente
              </h2>
              <p className="mt-2 leading-7 text-muted">
                O sistema verifica somente se a URL e a chave pública foram
                configuradas. Nenhum valor sensível é exibido nesta tela.
              </p>
            </div>
            <span
              className={`inline-flex rounded-md px-3 py-2 text-sm font-semibold ${
                configurado
                  ? "bg-primary-soft text-primary-strong"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/35 dark:text-yellow-200"
              }`}
            >
              {configurado ? "Configurado" : "Pendente"}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
