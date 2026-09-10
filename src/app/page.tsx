import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarCheck, ShieldCheck, Smartphone } from "lucide-react";
import { getCurrentUserProfile, toAccessProfile } from "@/lib/auth/session";

const destaques = [
  {
    icon: CalendarCheck,
    title: "Escalas organizadas",
    description:
      "Base preparada para evoluir as escalas de pregadores, música e equipes por igreja.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso por perfil",
    description:
      "Login, cadastro pendente, aprovação administrativa e proteção de rotas já preparados.",
  },
  {
    icon: Smartphone,
    title: "Pronto para PWA",
    description:
      "Manifest e service worker inicial preparados para instalação e evolução offline segura.",
  },
];

export default async function Home() {
  const profile = await getCurrentUserProfile();
  const accessProfile = toAccessProfile(profile);

  if (accessProfile?.status === "approved") {
    redirect("/painel");
  }

  if (accessProfile?.status === "pending") {
    redirect("/aguardando-aprovacao");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="py-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Sistema web
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl">
            ESCALA IASD CANDIDO SALES
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Sistema em etapas para organizar escalas da igreja com Next.js,
            TypeScript, Tailwind CSS, Supabase e PWA desde a base.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              href="/login"
            >
              Acessar login
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              href="/cadastro"
            >
              Solicitar cadastro
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        {destaques.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="rounded-lg border border-border bg-surface p-5 shadow-sm"
              key={item.title}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Icon size={20} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {item.description}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
