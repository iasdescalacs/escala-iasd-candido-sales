import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  detectPwaInstallEnvironment,
  getPwaManualInstallSteps,
} from "../../src/lib/pwa/client.ts";

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
const installButton = readFileSync("src/components/pwa-install-button.tsx", "utf8");
const mainNavigation = readFileSync("src/components/main-nav.tsx", "utf8");
const pwaClient = readFileSync("src/lib/pwa/client.ts", "utf8");
const layout = readFileSync("src/app/layout.tsx", "utf8");
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
  assert.match(serviceWorker, /silent: false/);
  assert.match(serviceWorker, /vibrate: \[200, 100, 200\]/);
  assert.match(serviceWorker, /payload\.url/);
  assert.match(serviceWorker, /addEventListener\("notificationclick"/);
  assert.match(serviceWorker, /openWindow/);
});

test("service worker armazena apenas recursos publicos estaticos", () => {
  const staticAssetsBlock = serviceWorker.match(
    /const STATIC_ASSETS = \[(.*?)\];/s,
  );

  assert.ok(staticAssetsBlock);
  assert.match(serviceWorker, /const STATIC_ASSETS/);
  assert.match(serviceWorker, /STATIC_ASSET_PATHS\.has\(requestUrl\.pathname\)/);
  assert.doesNotMatch(staticAssetsBlock[1], /["']\/painel["']/);
  assert.doesNotMatch(staticAssetsBlock[1], /["']\/agenda["']/);
  assert.doesNotMatch(staticAssetsBlock[1], /["']\/login["']/);
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
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(layout, /__escalaIasdInstallPrompt/);
  assert.match(installPrompt, /window\.__escalaIasdInstallPrompt/);
  assert.match(installButton, /SHOW_PWA_INSTALL_HELP_EVENT/);
  assert.match(mainNavigation, /PwaInstallButton/);
  assert.match(installPrompt, /PWA_INSTALL_VISIBILITY_EVENT/);
  assert.match(prompt, /isInstallPromptVisible/);
  assert.match(manifest, /icon-192\.png/);
  assert.match(manifest, /icon-512\.png/);
  assert.match(manifest, /gcm_sender_id/);
});

test("instalacao orienta Samsung Internet conforme Android detectado", () => {
  const environment = detectPwaInstallEnvironment(
    "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B Build/UP1A.231005.007) AppleWebKit/537.36 Chrome/121.0 Mobile Safari/537.36 SamsungBrowser/25.0",
  );

  assert.equal(environment.deviceBrand, "samsung");
  assert.equal(environment.androidVersion, "14");
  assert.equal(environment.browser, "samsung-internet");
  assert.match(getPwaManualInstallSteps(environment).join(" "), /Samsung Internet/);
});

test("instalacao orienta Motorola com Chrome sem depender do prompt nativo", () => {
  const environment = detectPwaInstallEnvironment(
    "Mozilla/5.0 (Linux; Android 11; moto g(9) plus Build/RPAS31.68-66-2) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
  );

  assert.equal(environment.deviceBrand, "motorola");
  assert.equal(environment.androidVersion, "11");
  assert.equal(environment.browser, "chrome");
  assert.match(getPwaManualInstallSteps(environment).join(" "), /três pontos/);
});

test("iOS recebe instrucoes de instalacao e push somente no app instalado", () => {
  assert.match(pwaClient, /iPad\|iPhone\|iPod/);
  assert.match(pwaClient, /navigatorWithStandalone\.standalone === true/);
  assert.match(pwaClient, /Adicionar à Tela de Início/);
  assert.match(pwaClient, /Abrir como App/);
  assert.match(installPrompt, /SHOW_PWA_INSTALL_HELP_EVENT/);
  assert.match(prompt, /isIosDevice\(\) && !isStandaloneMode\(\)/);
  assert.match(prompt, /ios-install-required/);
  assert.match(prompt, /iOS 16\.4 ou superior/);
  assert.match(layout, /apple: \[\{ url: "\/icons\/icon-192\.png"/);
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
