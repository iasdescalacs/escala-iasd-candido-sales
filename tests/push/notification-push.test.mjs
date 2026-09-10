import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260909143000_create_push_subscriptions.sql",
  "utf8",
);
const serviceWorker = readFileSync("public/sw.js", "utf8");
const subscribeRoute = readFileSync("src/app/api/push/subscribe/route.ts", "utf8");
const unsubscribeRoute = readFileSync("src/app/api/push/unsubscribe/route.ts", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const prompt = readFileSync("src/components/push-notification-prompt.tsx", "utf8");
const installPrompt = readFileSync("src/components/pwa-install-prompt.tsx", "utf8");
const manifest = readFileSync("public/manifest.json", "utf8");
const pushServer = readFileSync("src/lib/push/server.ts", "utf8");

test("migration de push cria tabela protegida por RLS", () => {
  assert.match(migration, /create table if not exists public\.push_subscriptions/);
  assert.match(migration, /references public\.users\(id\) on delete cascade/);
  assert.match(migration, /alter table public\.push_subscriptions enable row level security/);
  assert.match(migration, /user_id = public\.current_app_user_id\(\)/);
});

test("service worker recebe push e abre rota ao clicar na notificacao", () => {
  assert.match(serviceWorker, /addEventListener\("push"/);
  assert.match(serviceWorker, /showNotification/);
  assert.match(serviceWorker, /badge: payload\.badge \|\| "\/icons\/icon-192\.png"/);
  assert.match(serviceWorker, /payload\.url/);
  assert.match(serviceWorker, /addEventListener\("notificationclick"/);
  assert.match(serviceWorker, /openWindow/);
});

test("rotas de push exigem usuario aprovado", () => {
  assert.match(subscribeRoute, /export const runtime = "nodejs"/);
  assert.match(subscribeRoute, /decideProtectedAccess/);
  assert.match(subscribeRoute, /status: 401/);
  assert.match(unsubscribeRoute, /export const runtime = "nodejs"/);
  assert.match(unsubscribeRoute, /decideProtectedAccess/);
  assert.match(unsubscribeRoute, /status: 401/);
});

test("prompt usa Notification API, PushManager e chave publica VAPID", () => {
  assert.match(prompt, /Notification\.requestPermission/);
  assert.match(prompt, /pushManager\.subscribe/);
  assert.match(prompt, /NEXT_PUBLIC_VAPID_PUBLIC_KEY/);
  assert.match(prompt, /Notification\.permission === "denied"/);
});

test("instalacao PWA usa beforeinstallprompt e manifest com pngs", () => {
  assert.match(installPrompt, /beforeinstallprompt/);
  assert.match(installPrompt, /appinstalled/);
  assert.match(manifest, /icon-192\.png/);
  assert.match(manifest, /icon-512\.png/);
  assert.match(manifest, /gcm_sender_id/);
});

test("env example documenta chaves VAPID sem valores reais", () => {
  assert.match(envExample, /^NEXT_PUBLIC_VAPID_PUBLIC_KEY=$/m);
  assert.match(envExample, /^VAPID_PRIVATE_KEY=$/m);
  assert.match(envExample, /^VAPID_SUBJECT=$/m);
});

test("envio server-side remove inscricoes expiradas", () => {
  assert.match(pushServer, /webPush\.sendNotification/);
  assert.match(pushServer, /TTL: 60 \* 60 \* 24/);
  assert.match(pushServer, /icon: "\/icons\/icon-192\.png"/);
  assert.match(pushServer, /statusCode === 404 \|\| statusCode === 410/);
  assert.match(pushServer, /enabled: false/);
});
