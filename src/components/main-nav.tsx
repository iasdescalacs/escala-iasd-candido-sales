"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { appConfig, publicNavigation } from "@/config/app";
import { ThemeToggle } from "@/components/theme-toggle";

export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          className="min-w-0 text-sm font-bold leading-tight text-foreground sm:text-base"
          href="/"
          onClick={() => setIsOpen(false)}
        >
          <span className="block truncate">{appConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Menu principal">
          {publicNavigation.map((item) => (
            <NavLink
              active={pathname === item.href}
              href={item.href}
              key={item.href}
              label={item.label}
            />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <button
            aria-expanded={isOpen}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-foreground transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary md:hidden"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <nav
          aria-label="Menu principal mobile"
          className="border-t border-border bg-surface px-4 py-3 md:hidden"
        >
          <div className="mx-auto grid max-w-6xl gap-2">
            {publicNavigation.map((item) => (
              <NavLink
                active={pathname === item.href}
                href={item.href}
                key={item.href}
                label={item.label}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function NavLink({
  active,
  href,
  label,
  onClick,
}: {
  active: boolean;
  href: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary-soft text-primary-strong"
          : "text-muted hover:bg-surface-muted hover:text-foreground"
      }`}
      href={href}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}
