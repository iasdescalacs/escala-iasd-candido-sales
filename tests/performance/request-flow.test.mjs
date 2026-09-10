import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const session = readFileSync("src/lib/auth/session.ts", "utf8");
const proxy = readFileSync("src/proxy.ts", "utf8");
const panel = readFileSync("src/app/painel/page.tsx", "utf8");
const scheduleQueries = readFileSync("src/lib/escalas/queries.ts", "utf8");
const protectedPages = [
  "src/app/painel/page.tsx",
  "src/app/perfil/page.tsx",
  "src/app/alterar-senha/page.tsx",
  "src/app/disponibilidade/page.tsx",
].map((path) => readFileSync(path, "utf8"));
const adminPages = [
  "src/app/admin/cultos/page.tsx",
  "src/app/admin/igrejas/page.tsx",
  "src/app/admin/usuarios/page.tsx",
  "src/app/admin/usuarios/[id]/editar/page.tsx",
].map((path) => readFileSync(path, "utf8"));
const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));

test("perfil atual e deduplicado durante a renderizacao", () => {
  assert.match(session, /import \{ cache \} from "react"/);
  assert.match(session, /getCurrentUserProfile = cache\(\s*async function/);
});

test("proxy faz somente a verificacao otimista da sessao", () => {
  assert.match(proxy, /auth\.getSession\(\)/);
  assert.doesNotMatch(proxy, /\.from\("users"\)/);
  assert.doesNotMatch(proxy, /\.from\("user_roles"\)/);
  assert.doesNotMatch(proxy, /\.from\("roles"\)/);
});

test("rotas protegidas preservam autorizacao no servidor", () => {
  for (const page of protectedPages) {
    assert.match(page, /requireApprovedUser/);
  }

  for (const page of adminPages) {
    assert.match(page, /requireAdminUser/);
  }

  assert.match(scheduleQueries, /getSchedulePageData[\s\S]*requireApprovedUser/);
  assert.match(scheduleQueries, /getUserAgendaPageData[\s\S]*requireApprovedUser/);
});

test("painel busca permutas e aprovacoes em paralelo", () => {
  assert.match(panel, /Promise\.all\(\[/);
  assert.match(panel, /getPanelPendingSwapRequests/);
  assert.match(panel, /getUserApprovalDashboardData/);
});

test("painel resume os cards informativos no celular", () => {
  assert.match(panel, /grid grid-cols-2 gap-2/);
  assert.match(panel, /hidden text-sm leading-6 text-muted sm:block/);
});

test("funcoes da Vercel executam em Sao Paulo", () => {
  assert.deepEqual(vercelConfig.regions, ["gru1"]);
});
