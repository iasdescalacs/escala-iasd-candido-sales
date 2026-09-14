"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import {
  isStandaloneMode,
  SHOW_PWA_INSTALL_HELP_EVENT,
} from "@/lib/pwa/client";

export function PwaInstallButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const refreshVisibility = () => setIsVisible(!isStandaloneMode());
    const handleInstalled = () => setIsVisible(false);
    const frame = window.requestAnimationFrame(refreshVisibility);
    const displayMode = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("appinstalled", handleInstalled);
    displayMode.addEventListener("change", refreshVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("appinstalled", handleInstalled);
      displayMode.removeEventListener("change", refreshVisibility);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      aria-label="Instalar aplicativo"
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-foreground transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
      onClick={() =>
        window.dispatchEvent(new Event(SHOW_PWA_INSTALL_HELP_EVENT))
      }
      title="Instalar aplicativo"
      type="button"
    >
      <Download aria-hidden="true" size={18} />
    </button>
  );
}
