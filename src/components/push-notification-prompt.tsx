"use client";

import { Bell, BellOff, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  isIosDevice,
  isStandaloneMode,
  SHOW_PWA_INSTALL_HELP_EVENT,
} from "@/lib/pwa/client";

const SESSION_DISMISSED_KEY = "escala-iasd-push-dismissed";

type PushStatus =
  | "checking"
  | "unsupported"
  | "ios-install-required"
  | "default"
  | "granted"
  | "denied"
  | "subscribed";
type AndroidNotificationOptions = NotificationOptions & {
  renotify: boolean;
  vibrate: number[];
};

export function PushNotificationPrompt({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (sessionStorage.getItem(SESSION_DISMISSED_KEY) === "true") {
      return;
    }

    Promise.resolve()
      .then(async () => {
        if (isIosDevice() && !isStandaloneMode()) {
          setStatus("ios-install-required");
          setIsVisible(true);
          return;
        }

        if (
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {
          setStatus("unsupported");
          setIsVisible(true);
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setStatus(subscription ? "subscribed" : Notification.permission);
        setIsVisible(!subscription);
      })
      .catch(() => setStatus("unsupported"));
  }, [enabled]);

  if (!enabled || !isVisible || status === "subscribed") {
    return null;
  }

  async function subscribeToPush() {
    setIsLoading(true);
    setMessage("");

    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        setMessage("Notificações indisponíveis: chave pública VAPID ausente.");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        setMessage(
          "As notificações foram bloqueadas. Ative nas configurações do navegador para este site.",
        );
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus(permission);
        setIsVisible(true);
        setMessage(
          permission === "denied"
            ? "As notificações foram recusadas. Ative nas configurações do navegador para este site."
            : "Permissão de notificação não concedida.",
        );
        return;
      }

      const subscription = await subscribeWithRecovery(publicKey);

      const response = await fetch("/api/push/subscribe", {
        body: JSON.stringify(subscription),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(result?.message ?? "Falha ao salvar inscrição push.");
      }

      await showActivationConfirmation();
      setStatus("subscribed");
      setMessage("Notificações ativadas com sucesso.");
      setIsVisible(false);
    } catch (error) {
      setMessage(getPushActivationErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function showInstallHelp() {
    window.dispatchEvent(new Event(SHOW_PWA_INSTALL_HELP_EVENT));
    setMessage("Instale o aplicativo e abra pelo ícone criado na Tela de Início.");
  }

  function dismiss() {
    if (status !== "denied") {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
    }
    setIsVisible(false);
  }

  return (
    <aside className="fixed bottom-44 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-border bg-surface p-4 text-sm shadow-lg sm:bottom-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-primary-soft p-2 text-primary">
          <Bell aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {status === "ios-install-required"
              ? "Instale para ativar notificações"
              : "Ativar notificações"}
          </p>
          <p className="mt-1 text-muted">
            {status === "ios-install-required"
              ? "No iPhone, as notificações ficam disponíveis depois que o sistema é adicionado à Tela de Início e aberto pelo novo ícone."
              : status === "unsupported"
                ? "Este navegador não oferece notificações para o aplicativo. No iPhone, use iOS 16.4 ou superior e abra o app pela Tela de Início."
                : status === "denied"
                  ? "As notificações estão bloqueadas neste navegador. Libere o site nas configurações para receber avisos."
                  : "Receba avisos sobre escalas, permutas e aprovações mesmo quando o sistema estiver fechado."}
          </p>
          {message ? <p className="mt-2 text-xs text-warning">{message}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {status === "ios-install-required" ? (
              <button
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong"
                onClick={showInstallHelp}
                type="button"
              >
                <Download className="h-3.5 w-3.5" />
                Como instalar
              </button>
            ) : status !== "unsupported" ? (
              <button
                aria-busy={isLoading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoading}
                onClick={subscribeToPush}
                type="button"
              >
                <Bell className="h-3.5 w-3.5" />
                {isLoading
                  ? "Ativando..."
                  : status === "denied"
                    ? "Verificar novamente"
                    : "Ativar"}
              </button>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-muted"
              onClick={dismiss}
              type="button"
            >
              <BellOff className="h-3.5 w-3.5" />
              Agora não
            </button>
          </div>
        </div>
        <button
          aria-label="Fechar aviso de notificações"
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

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  if (outputArray.length !== 65 || outputArray[0] !== 4) {
    throw new Error("A chave pública de notificação é inválida.");
  }

  return outputArray;
}

async function subscribeWithRecovery(publicKey: string) {
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  try {
    return await createPushSubscription(applicationServerKey);
  } catch (error) {
    if (!isPushServiceRegistrationError(error)) {
      throw error;
    }

    await refreshPushRegistration();
    return createPushSubscription(applicationServerKey);
  }
}

async function createPushSubscription(applicationServerKey: Uint8Array<ArrayBuffer>) {
  const registration = await getActiveServiceWorkerRegistration();
  await registration.update().catch(() => undefined);
  await waitForActiveServiceWorker(registration);

  const currentSubscription = await registration.pushManager.getSubscription();

  if (
    currentSubscription &&
    subscriptionUsesApplicationServerKey(currentSubscription, applicationServerKey)
  ) {
    return currentSubscription;
  }

  if (currentSubscription) {
    await removeSavedSubscription(currentSubscription);
    await currentSubscription.unsubscribe().catch(() => undefined);
  }

  return registration.pushManager.subscribe({
    applicationServerKey,
    userVisibleOnly: true,
  });
}

function subscriptionUsesApplicationServerKey(
  subscription: PushSubscription,
  expectedKey: Uint8Array<ArrayBuffer>,
) {
  const currentKey = subscription.options.applicationServerKey;

  if (!currentKey) {
    return false;
  }

  const currentBytes = new Uint8Array(currentKey);
  return (
    currentBytes.length === expectedKey.length &&
    currentBytes.every((value, index) => value === expectedKey[index])
  );
}

async function removeSavedSubscription(subscription: PushSubscription) {
  await fetch("/api/push/unsubscribe", {
    body: JSON.stringify({ endpoint: subscription.endpoint }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch(() => undefined);
}

async function refreshPushRegistration() {
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await registration.update().catch(() => undefined);
  await waitForActiveServiceWorker(registration);
  await navigator.serviceWorker.ready;
}

async function getActiveServiceWorkerRegistration() {
  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }));

  await waitForActiveServiceWorker(registration);
  return registration;
}

async function showActivationConfirmation() {
  const registration = await getActiveServiceWorkerRegistration();
  const options: AndroidNotificationOptions = {
    badge: "/icons/icon-192.png",
    body: "Este aparelho receberá avisos de escalas, permutas e aprovações.",
    icon: "/icons/icon-192.png",
    lang: "pt-BR",
    renotify: true,
    silent: false,
    tag: `push-ativado-${Date.now()}`,
    vibrate: [200, 100, 200],
  };

  await registration
    .showNotification("Notificações ativadas", options)
    .catch(() => undefined);
}

async function waitForActiveServiceWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) {
    return;
  }

  const serviceWorker = registration.installing ?? registration.waiting;

  if (!serviceWorker) {
    await navigator.serviceWorker.ready;
    return;
  }

  const activeWorker: ServiceWorker = serviceWorker;

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      activeWorker.removeEventListener("statechange", handleStateChange);
      reject(new Error("Service worker ainda não ficou ativo. Feche e abra o app/site e tente novamente."));
    }, 8000);

    function handleStateChange() {
      if (activeWorker.state === "activated") {
        window.clearTimeout(timeout);
        activeWorker.removeEventListener("statechange", handleStateChange);
        resolve();
      }
    }

    activeWorker.addEventListener("statechange", handleStateChange);
    handleStateChange();
  });
}

function isPushServiceRegistrationError(error: unknown) {
  return (
    error instanceof Error &&
    /registration failed|push service|push service error|no active service worker/i.test(error.message)
  );
}

function getPushActivationErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "O navegador bloqueou a inscrição. Verifique as permissões de notificação deste site.";
    }

    if (error.name === "InvalidAccessError") {
      return "A chave de notificação do app mudou. Atualize a página e tente novamente.";
    }
  }

  if (error instanceof Error && error.message) {
    if (isPushServiceRegistrationError(error)) {
      return "O Android ainda recusou a inscrição no serviço de push. O app já tentou reparar a inscrição e o service worker. Se continuar, o bloqueio está no serviço de push do Chrome/Google Play deste aparelho.";
    }

    return error.message;
  }

  return "Não foi possível ativar as notificações.";
}
