import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";

export default function SupabaseStatusPage() {
  const configurado = hasSupabaseBrowserEnv();

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-8 text-[#20251f] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6f56]">
          Status do Supabase
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Conexão com PostgreSQL
        </h1>
        <section className="mt-8 rounded-lg border border-[#d8ddcf] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Variáveis de ambiente</h2>
              <p className="mt-2 leading-7 text-[#536052]">
                O sistema verifica somente se a URL e a chave pública foram
                configuradas. Nenhum valor sensível é exibido nesta tela.
              </p>
            </div>
            <span
              className={`inline-flex rounded-md px-3 py-2 text-sm font-semibold ${
                configurado
                  ? "bg-[#dcefe5] text-[#255b45]"
                  : "bg-[#fff0cf] text-[#7a5415]"
              }`}
            >
              {configurado ? "Configurado" : "Pendente"}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
