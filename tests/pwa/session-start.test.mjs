import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homePage = readFileSync("src/app/page.tsx", "utf8");
const manifest = readFileSync("public/manifest.json", "utf8");
const proxy = readFileSync("src/proxy.ts", "utf8");

test("pwa abre no painel e inicio redireciona usuario logado", () => {
  assert.equal(JSON.parse(manifest).start_url, "/painel");
  assert.match(homePage, /redirect\("\/painel"\)/);
  assert.match(homePage, /redirect\("\/aguardando-aprovacao"\)/);
});

test("agenda e escalas ficam protegidas pelo proxy", () => {
  assert.match(proxy, /"\/agenda"/);
  assert.match(proxy, /"\/escalas"/);
  assert.match(proxy, /"\/agenda\/:path\*"/);
  assert.match(proxy, /"\/escalas\/:path\*"/);
});
