import Link from "next/link";
import { ProfileForm } from "@/components/auth/profile-form";
import { requireApprovedUser } from "@/lib/auth/session";

export default async function PerfilPage() {
  const profile = await requireApprovedUser();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Perfil
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Seus dados
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Mantenha seu nome e telefone atualizados. Alterações de e-mail, status
          e permissões são administrativas.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-surface-muted"
          href="/alterar-senha"
        >
          Alterar senha
        </Link>
      </section>

      <ProfileForm user={profile.appUser} />
    </div>
  );
}
