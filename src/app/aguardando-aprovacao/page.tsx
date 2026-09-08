import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUserProfile } from "@/lib/auth/session";

export default async function AguardandoAprovacaoPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.appUser?.status === "approved") {
    redirect("/painel");
  }

  if (profile.appUser?.status === "blocked" || profile.appUser?.status === "inactive") {
    redirect("/login?mensagem=Seu%20acesso%20est%C3%A1%20bloqueado%20ou%20inativo.");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-warning">
          Aguardando aprovação
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Seu cadastro está em análise
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Um administrador precisa aprovar sua conta antes do acesso ao painel.
          Você pode sair e tentar novamente mais tarde.
        </p>
        <div className="mt-5">
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
