"use client";

import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useState } from "react";

const SESSION_DISMISSED_KEY = "escala-iasd-push-dismissed";

type PushStatus = "checking" | "unsupported" | "default" | "granted" | "denied" | "subscribed";

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
        if (
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {
          setStatus("unsupported");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setStatus(subscription ? "subscribed" : Notification.permission);
        setIsVisible(!subscription && Notification.permission !== "denied");
      })
      .catch(() => setStatus("unsupported"));
  }, [enabled]);

  if (!enabled || !isVisible || status === "subscribed" || status === "denied") {
    return null;
  }

  async function subscribeToPush() {
    setIsLoading(true);
    setMessage("");

    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        setMessage("Notificacoes indisponiveis: chave publica VAPID ausente.");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus(permission);
        setMessage("Permissao de notificacao nao concedida.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const currentSubscription = await registration.pushManager.getSubscription();
      const subscription =
        currentSubscription ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(publicKey),
          userVisibleOnly: true,
        }));

      const response = await fetch("/api/push/subscribe", {
        body: JSON.stringify(subscription),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar inscricao push.");
      }

      setStatus("subscribed");
      setMessage("Notificacoes ativadas com sucesso.");
      setIsVisible(false);
    } catch {
      setMessage("Nao foi possivel ativar as notificacoes.");
    } finally {
      setIsLoading(false);
    }
  }

  function dismiss() {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
    setIsVisible(false);
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-border bg-surface p-4 text-sm shadow-lg">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-primary-soft p-2 text-primary">
          <Bell aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Ativar notificacoes</p>
          <p className="mt-1 text-muted">
            Receba avisos sobre escalas, permutas e aprovacoes mesmo quando o sistema estiver fechado.
          </p>
          {message ? <p className="mt-2 text-xs text-warning">{message}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading}
              onClick={subscribeToPush}
              type="button"
            >
              <Bell className="h-3.5 w-3.5" />
              {isLoading ? "Ativando..." : "Ativar"}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-muted"
              onClick={dismiss}
              type="button"
            >
              <BellOff className="h-3.5 w-3.5" />
              Agora nao
            </button>
          </div>
        </div>
        <button
          aria-label="Fechar aviso de notificacoes"
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

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}
