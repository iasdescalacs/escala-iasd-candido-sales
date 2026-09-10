import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const prompt = readFileSync("src/components/push-notification-prompt.tsx", "utf8");
const serviceWorker = readFileSync("public/sw.js", "utf8");
const manifest = readFileSync("public/manifest.json", "utf8");

test("ativacao push tenta recuperar erro de servico no android", () => {
  assert.match(prompt, /subscribeWithRecovery/);
  assert.match(prompt, /refreshPushRegistration/);
  assert.match(prompt, /waitForActiveServiceWorker/);
  assert.match(prompt, /registration\.active/);
  assert.match(prompt, /registration failed\|push service\|push service error/i);
  assert.match(prompt, /updateViaCache: "none"/);
});

test("ativacao reutiliza assinatura valida e envia chave no formato esperado", () => {
  assert.match(prompt, /urlBase64ToUint8Array/);
  assert.match(prompt, /outputArray\.length !== 65/);
  assert.match(prompt, /subscriptionUsesApplicationServerKey/);
  assert.match(prompt, /return currentSubscription/);
});

test("service worker incrementa cache para atualizar pwa instalado", () => {
  assert.match(serviceWorker, /escala-iasd-candido-sales-v7/);
  assert.match(serviceWorker, /"\/agenda"/);
});

test("notificacao solicita alerta sonoro e vibracao ao android", () => {
  assert.match(serviceWorker, /silent: false/);
  assert.match(serviceWorker, /renotify: true/);
  assert.match(serviceWorker, /vibrate: \[200, 100, 200\]/);
  assert.match(prompt, /showActivationConfirmation/);
});

test("manifest inclui sender de compatibilidade para chrome android", () => {
  assert.equal(JSON.parse(manifest).gcm_sender_id, "103953800507");
});
