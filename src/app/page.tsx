export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f3]">
      <section className="border-b border-[#d8ddcf] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6f56]">
              Sistema web
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-[#20251f] sm:text-5xl">
              ESCALA IASD CANDIDO SALES
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#536052]">
              Base inicial preparada para construir, etapa por etapa, a
              organização de escalas da igreja com Next.js, TypeScript,
              Tailwind CSS, Supabase e PWA.
            </p>
          </div>
          <div className="grid min-w-64 grid-cols-2 gap-3 text-sm">
            <StatusItem label="Frontend" value="Preparado" />
            <StatusItem label="PWA" value="Preparado" />
            <StatusItem label="Supabase" value="Aguardando env" />
            <StatusItem label="Deploy" value="Em configuração" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-[#d8ddcf] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#20251f]">
            Etapa 1: fundação do projeto
          </h2>
          <p className="mt-3 leading-7 text-[#536052]">
            Esta primeira entrega cria a estrutura profissional do sistema,
            configura metadados, prepara o aplicativo instalável e deixa a
            integração com Supabase pronta para receber as credenciais.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Next.js com App Router",
              "TypeScript em modo estrito",
              "Tailwind CSS configurado",
              "Manifest e service worker inicial",
              "Cliente Supabase tipado",
              "README em português",
            ].map((item) => (
              <div
                className="rounded-md border border-[#e1e5dc] bg-[#fbfcf8] px-4 py-3 text-sm font-medium text-[#2e352d]"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-[#d8ddcf] bg-[#253d35] p-6 text-white shadow-sm">
          <h2 className="text-lg font-semibold">Próximo passo</h2>
          <p className="mt-3 leading-7 text-[#dce8df]">
            Após confirmar o deploy inicial, a próxima etapa recomendada é
            modelar as entidades principais no PostgreSQL: membros, funções,
            equipes e escalas.
          </p>
        </aside>
      </section>
    </main>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d8ddcf] bg-[#fbfcf8] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66715f]">
        {label}
      </p>
      <p className="mt-2 font-semibold text-[#20251f]">{value}</p>
    </div>
  );
}
