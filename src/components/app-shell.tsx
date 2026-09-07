import type { ReactNode } from "react";
import { MainNav } from "@/components/main-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <MainNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
