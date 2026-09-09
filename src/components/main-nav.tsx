"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  adminNavigation,
  appConfig,
  elderNavigation,
  musicLeaderNavigation,
  protectedNavigation,
  publicNavigation,
  supportNavigation,
} from "@/config/app";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

type MainNavProps = {
  viewer: {
    isAuthenticated: boolean;
    isApproved: boolean;
    isAdmin: boolean;
    isElder: boolean;
    isMusicLeader: boolean;
    isPending: boolean;
  };
};

type NavigationItem = {
  label: string;
  href: string;
};

export function MainNav({ viewer }: MainNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navigation = getNavigation(viewer);

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

        <DesktopNavigation items={navigation} pathname={pathname} />

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {viewer.isAuthenticated ? <div className="hidden md:block"><LogoutButton /></div> : null}
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
            {navigation.map((item) => (
              <NavLink
                active={pathname === item.href}
                href={item.href}
                key={item.href}
                label={item.label}
                onClick={() => setIsOpen(false)}
              />
            ))}
            {viewer.isAuthenticated ? <LogoutButton /> : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function DesktopNavigation({
  items,
  pathname,
}: {
  items: NavigationItem[];
  pathname: string;
}) {
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const moreRef = useRef<HTMLButtonElement>(null);

  const calculateVisibleItems = useCallback(() => {
    const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 0;

    if (containerWidth <= 0) {
      return;
    }

    const itemWidths = items.map(
      (_, index) => (itemRefs.current[index]?.getBoundingClientRect().width ?? 0) + 4,
    );
    const moreWidth = (moreRef.current?.getBoundingClientRect().width ?? 92) + 4;
    const allItemsWidth = itemWidths.reduce((total, width) => total + width, 0);

    if (allItemsWidth <= containerWidth) {
      setVisibleCount(items.length);
      return;
    }

    let usedWidth = moreWidth;
    let nextVisibleCount = 0;

    for (const width of itemWidths) {
      if (usedWidth + width > containerWidth) {
        break;
      }

      usedWidth += width;
      nextVisibleCount += 1;
    }

    setVisibleCount(Math.max(1, nextVisibleCount));
  }, [items]);

  useLayoutEffect(() => {
    calculateVisibleItems();
  }, [calculateVisibleItems]);

  useEffect(() => {
    const observer = new ResizeObserver(calculateVisibleItems);
    const container = containerRef.current;

    if (container) {
      observer.observe(container);
    }

    window.addEventListener("resize", calculateVisibleItems);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calculateVisibleItems);
    };
  }, [calculateVisibleItems]);

  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);
  const hasActiveOverflowItem = overflowItems.some((item) => pathname === item.href);

  return (
    <div className="hidden min-w-0 flex-1 justify-end md:flex" ref={containerRef}>
      <div className="pointer-events-none fixed -left-[9999px] top-0 flex gap-1 opacity-0">
        {items.map((item, index) => (
          <Link
            className="shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium"
            href={item.href}
            key={item.href}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            tabIndex={-1}
          >
            {item.label}
          </Link>
        ))}
        <button
          className="inline-flex shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium"
          ref={moreRef}
          tabIndex={-1}
          type="button"
        >
          Mais
        </button>
      </div>

      <nav className="flex min-w-0 items-center justify-end gap-1" aria-label="Menu principal">
        {visibleItems.map((item) => (
          <NavLink
            active={pathname === item.href}
            href={item.href}
            key={item.href}
            label={item.label}
          />
        ))}

        {overflowItems.length > 0 ? (
          <div className="relative">
            <button
              aria-expanded={isMoreOpen}
              className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                hasActiveOverflowItem
                  ? "bg-primary-soft text-primary-strong"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
              onClick={() => setIsMoreOpen((current) => !current)}
              type="button"
            >
              Mais
              <ChevronDown size={15} aria-hidden="true" />
            </button>

            {isMoreOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 grid min-w-52 gap-1 rounded-lg border border-border bg-surface p-2 shadow-lg">
                {overflowItems.map((item) => (
                  <NavLink
                    active={pathname === item.href}
                    href={item.href}
                    key={item.href}
                    label={item.label}
                    onClick={() => setIsMoreOpen(false)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
    </div>
  );
}

function getNavigation(viewer: MainNavProps["viewer"]): NavigationItem[] {
  if (!viewer.isAuthenticated) {
    return publicNavigation;
  }

  if (viewer.isPending) {
    return [
      { label: "Aguardando aprovação", href: "/aguardando-aprovacao" },
    ];
  }

  if (viewer.isApproved) {
    return [
      ...protectedNavigation,
      ...(viewer.isAdmin || viewer.isElder ? elderNavigation : []),
      ...(viewer.isAdmin || viewer.isMusicLeader ? musicLeaderNavigation : []),
      ...(viewer.isAdmin ? adminNavigation : []),
      ...(viewer.isAdmin ? supportNavigation : []),
    ];
  }

  return [];
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
      className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
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
