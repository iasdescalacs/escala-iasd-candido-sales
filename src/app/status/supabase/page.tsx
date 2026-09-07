import { getSupabaseConnectionStatus } from "@/lib/supabase/status";

export const dynamic = "force-dynamic";

export default async function SupabaseStatusPage() {
  const status = await getSupabaseConnectionStatus();

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
                O sistema verifica variáveis públicas, variável administrativa
                de servidor e uma chamada inicial ao Supabase. Nenhum valor
                sensível é exibido nesta tela.
              </p>
            </div>
            <span
              className={`inline-flex rounded-md px-3 py-2 text-sm font-semibold ${
                status.connectionOk
                  ? "bg-primary-soft text-primary-strong"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/35 dark:text-yellow-200"
              }`}
            >
              {status.connectionOk ? "Conectado" : "Pendente"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <StatusItem
              label="Browser"
              ok={status.browserEnvConfigured}
              text="URL e chave pública"
            />
            <StatusItem
              label="Admin"
              ok={status.adminEnvConfigured}
              text="Service role somente no servidor"
            />
            <StatusItem
              label="Site"
              ok={status.siteEnvConfigured}
              text="URL pública do sistema"
            />
            <StatusItem
              label="Conexão"
              ok={status.connectionOk}
              text={status.message}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  ok,
  text,
}: {
  label: string;
  ok: boolean;
  text: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-semibold text-foreground">
        {ok ? "Configurado" : "Pendente"}
      </p>
      <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
