import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const prompt = readFileSync("src/components/push-notification-prompt.tsx", "utf8");
const serviceWorker = readFileSync("public/sw.js", "utf8");
const manifest = readFileSync("public/manifest.json", "utf8");

test("ativacao push tenta recuperar erro de servico no android", () => {
  assert.match(prompt, /subscribeWithRecovery/);
  assert.match(prompt, /resetServiceWorkerRegistration/);
  assert.match(prompt, /waitForActiveServiceWorker/);
  assert.match(prompt, /registration\.active/);
  assert.match(prompt, /registration failed\|push service\|push service error/i);
  assert.match(prompt, /navigator\.serviceWorker\.register\("\/sw\.js", \{ scope: "\/" \}\)/);
});

test("service worker incrementa cache para atualizar pwa instalado", () => {
  assert.match(serviceWorker, /escala-iasd-candido-sales-v3/);
  assert.match(serviceWorker, /"\/agenda"/);
});

test("manifest inclui sender de compatibilidade para chrome android", () => {
  assert.equal(JSON.parse(manifest).gcm_sender_id, "103953800507");
});
