"use client";

import { Download, Info, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  detectPwaInstallEnvironment,
  getPwaInstallEnvironmentLabel,
  getPwaManualInstallSteps,
  isStandaloneMode,
  PWA_INSTALL_VISIBILITY_EVENT,
  type PwaInstallEnvironment,
  SHOW_PWA_INSTALL_HELP_EVENT,
} from "@/lib/pwa/client";

const SESSION_DISMISSED_KEY = "escala-iasd-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __escalaIasdInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [environment, setEnvironment] = useState<PwaInstallEnvironment>(() =>
    detectPwaInstallEnvironment(""),
  );

  useEffect(() => {
    const detectedEnvironment = detectPwaInstallEnvironment();
    const dismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY) === "true";

    const handleShowInstallHelp = () => {
      const capturedPrompt = window.__escalaIasdInstallPrompt ?? null;

      sessionStorage.removeItem(SESSION_DISMISSED_KEY);
      setEnvironment(detectedEnvironment);
      setIsVisible(true);
      setInstallPrompt(capturedPrompt);
      setShowManualInstructions(!capturedPrompt);
      setMessage(capturedPrompt ? "" : getManualHelpMessage(detectedEnvironment));
    };

    let timer: number | null = null;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }

      const promptEvent = event as BeforeInstallPromptEvent;
      window.__escalaIasdInstallPrompt = promptEvent;
      setInstallPrompt(promptEvent);
      setEnvironment(detectedEnvironment);
      setShowManualInstructions(false);
      setMessage("");

      if (sessionStorage.getItem(SESSION_DISMISSED_KEY) !== "true") {
        setIsVisible(true);
      }
    };

    const handleInstalled = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }

      setIsInstalled(true);
      setIsVisible(false);
      setInstallPrompt(null);
      window.__escalaIasdInstallPrompt = null;
    };

    window.addEventListener(SHOW_PWA_INSTALL_HELP_EVENT, handleShowInstallHelp);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    Promise.resolve().then(() => {
      const standalone = isStandaloneMode();
      setEnvironment(detectedEnvironment);
      setIsInstalled(standalone);

      if (standalone || dismissed) {
        return;
      }

      const capturedPrompt = window.__escalaIasdInstallPrompt ?? null;

      if (capturedPrompt) {
        setInstallPrompt(capturedPrompt);
        setShowManualInstructions(false);
        setMessage("");
        setIsVisible(true);
        return;
      }

      timer = window.setTimeout(() => {
        if (!isStandaloneMode()) {
          setIsVisible(true);
          setShowManualInstructions(detectedEnvironment.platform === "ios");
          setMessage(getManualHelpMessage(detectedEnvironment));
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

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(PWA_INSTALL_VISIBILITY_EVENT, {
        detail: isVisible && !isInstalled,
      }),
    );
  }, [isInstalled, isVisible]);

  if (isInstalled || !isVisible) {
    return null;
  }

  async function installApp() {
    if (!installPrompt) {
      const detectedEnvironment = detectPwaInstallEnvironment();
      setEnvironment(detectedEnvironment);
      setShowManualInstructions(true);
      setMessage(getManualHelpMessage(detectedEnvironment));
      return;
    }

    setIsInstalling(true);

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      window.__escalaIasdInstallPrompt = null;

      if (choice.outcome === "accepted") {
        setIsVisible(false);
        return;
      }

      setShowManualInstructions(true);
      setMessage("Instalação não concluída. Você pode tentar novamente pelo menu do navegador.");
    } catch {
      setInstallPrompt(null);
      window.__escalaIasdInstallPrompt = null;
      setShowManualInstructions(true);
      setMessage(
        "O navegador não abriu a instalação. Siga as etapas manuais abaixo.",
      );
    } finally {
      setIsInstalling(false);
    }
  }

  function dismiss() {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
    setIsVisible(false);
  }

  return (
    <aside className="fixed bottom-4 left-4 z-50 max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-md border border-border bg-surface p-4 text-sm shadow-lg">
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
          {showManualInstructions ? (
            <div className="mt-3 rounded-md bg-surface-muted p-3 text-xs text-foreground">
              <p className="font-semibold text-primary">
                {getPwaInstallEnvironmentLabel(environment)}
              </p>
              <ol className="mt-2 grid gap-2">
                {getPwaManualInstallSteps(environment).map((step, index) => (
                  <li className="flex items-start gap-2" key={step}>
                    <span className="font-semibold text-primary">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
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

function getManualHelpMessage(environment: PwaInstallEnvironment) {
  if (environment.platform === "ios") {
    return "No iPhone, a instalação é concluída pelo menu Compartilhar do Safari.";
  }

  if (environment.browser === "samsung-internet") {
    return "Use o ícone de instalação ou o menu do Samsung Internet.";
  }

  if (environment.platform === "android") {
    return "Se o botão automático não aparecer, instale pelo menu do navegador.";
  }

  return "Abra o menu do navegador e escolha Instalar aplicativo.";
}
