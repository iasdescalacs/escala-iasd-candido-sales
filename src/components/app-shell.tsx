import type { ReactNode } from "react";
import { MainNav } from "@/components/main-nav";
import { getCurrentUserProfile, toAccessProfile } from "@/lib/auth/session";

export async function AppShell({ children }: { children: ReactNode }) {
  const profile = await getCurrentUserProfile();
  const accessProfile = toAccessProfile(profile);
  const viewer = {
    isAuthenticated: Boolean(profile),
    isApproved: accessProfile?.status === "approved",
    isAdmin: accessProfile?.roles.includes("admin") ?? false,
    isElder: accessProfile?.roles.includes("anciao") ?? false,
    isMusicLeader: accessProfile?.roles.includes("lider_musica") ?? false,
    isPending: accessProfile?.status === "pending",
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <MainNav viewer={viewer} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
