const CACHE_NAME = "escala-iasd-candido-sales-v6";
const APP_SHELL = ["/", "/login", "/painel", "/agenda", "/manifest.json", "/icons/icon.svg"];
const DEFAULT_NOTIFICATION_URL = "/agenda";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const title = payload.title || "ESCALA IASD CANDIDO SALES";

  event.waitUntil(
    self.registration.showNotification(title, {
      badge: payload.badge || "/icons/icon-192.png",
      body: payload.body || "Voce tem uma nova notificacao.",
      data: {
        notificationId: payload.data?.notificationId,
        url: payload.data?.url || payload.url || DEFAULT_NOTIFICATION_URL,
      },
      icon: payload.icon || "/icons/icon-192.png",
      lang: "pt-BR",
      renotify: true,
      silent: false,
      tag: payload.tag || payload.data?.notificationId || "escala-iasd",
      vibrate: [200, 100, 200],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || DEFAULT_NOTIFICATION_URL,
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clients) => {
        const matchingClient = clients.find((client) => client.url === targetUrl);

        if (matchingClient) {
          return matchingClient.focus();
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    Promise.resolve()
      .then(() => event.oldSubscription?.unsubscribe())
      .catch(() => undefined),
  );
});

function readPushPayload(event) {
  if (!event.data) {
    return {};
  }

  try {
    return event.data.json();
  } catch {
    return {
      body: event.data.text(),
    };
  }
}
