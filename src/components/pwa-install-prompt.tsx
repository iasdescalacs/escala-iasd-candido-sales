"use client";

import { Download, Info, Loader2, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  isIosDevice,
  isStandaloneMode,
  SHOW_PWA_INSTALL_HELP_EVENT,
} from "@/lib/pwa/client";

const SESSION_DISMISSED_KEY = "escala-iasd-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    const iosDevice = isIosDevice();

    const handleShowInstallHelp = () => {
      setIsVisible(true);
      setShowIosInstructions(iosDevice);
      setMessage(
        iosDevice
          ? "No iPhone, a instalação é concluída pelo menu Compartilhar do Safari."
          : "Abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial.",
      );
    };

    window.addEventListener(SHOW_PWA_INSTALL_HELP_EVENT, handleShowInstallHelp);

    if (sessionStorage.getItem(SESSION_DISMISSED_KEY) === "true") {
      return () => {
        window.removeEventListener(SHOW_PWA_INSTALL_HELP_EVENT, handleShowInstallHelp);
      };
    }

    let timer: number | null = null;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMessage("");
      setIsVisible(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setInstallPrompt(null);
    };

    Promise.resolve().then(() => {
      const standalone = isStandaloneMode();
      setIsInstalled(standalone);

      if (standalone) {
        return;
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleInstalled);

      timer = window.setTimeout(() => {
        if (!isStandaloneMode()) {
          setIsVisible(true);
          setShowIosInstructions(iosDevice);
          setMessage(
            iosDevice
              ? "No iPhone, siga as etapas abaixo para instalar o aplicativo."
              : "Se o botão instalar não aparecer, abra o menu do navegador e escolha Instalar app.",
          );
        }
      }, 1800);
    });

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      window.removeEventListener(SHOW_PWA_INSTALL_HELP_EVENT, handleShowInstallHelp);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled || !isVisible) {
    return null;
  }

  async function installApp() {
    if (!installPrompt) {
      if (isIosDevice()) {
        setShowIosInstructions(true);
        setMessage("No iPhone, siga as etapas abaixo no Safari.");
      } else {
        setMessage("Abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial.");
      }
      return;
    }

    setIsInstalling(true);

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);

      if (choice.outcome === "accepted") {
        setIsVisible(false);
        return;
      }

      setMessage("Instalação não concluída. Você pode tentar novamente pelo menu do navegador.");
    } finally {
      setIsInstalling(false);
    }
  }

  function dismiss() {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
    setIsVisible(false);
  }

  return (
    <aside className="fixed bottom-4 left-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-border bg-surface p-4 text-sm shadow-lg">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-primary-soft p-2 text-primary">
          {installPrompt ? (
            <Download aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Info aria-hidden="true" className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Instalar aplicativo</p>
          <p className="mt-1 text-muted">
            Instale o sistema no celular para abrir mais rápido e usar como aplicativo.
          </p>
          {message ? <p className="mt-2 text-xs text-warning">{message}</p> : null}
          {showIosInstructions ? (
            <ol className="mt-3 grid gap-2 rounded-md bg-surface-muted p-3 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">1.</span>
                Abra esta página no Safari.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">2.</span>
                <span className="inline-flex items-center gap-1.5">
                  Toque em <Share2 aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                  Compartilhar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">3.</span>
                Escolha Adicionar à Tela de Início, mantenha Abrir como App ativado e toque em
                Adicionar.
              </li>
            </ol>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              aria-busy={isInstalling}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isInstalling}
              onClick={installApp}
              type="button"
            >
              {isInstalling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : installPrompt ? (
                <Download className="h-3.5 w-3.5" />
              ) : (
                <Info className="h-3.5 w-3.5" />
              )}
              {isInstalling ? "Abrindo..." : installPrompt ? "Instalar" : "Como instalar"}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-muted"
              onClick={dismiss}
              type="button"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          aria-label="Fechar aviso de instalação"
          className="rounded-md p-1 text-muted transition hover:bg-surface-muted hover:text-foreground"
          onClick={dismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
