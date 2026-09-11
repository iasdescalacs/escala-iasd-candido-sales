import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const approvalPanel = readFileSync(
  "src/components/dashboard/approval-requests-panel.tsx",
  "utf8",
);
const swapPanel = readFileSync(
  "src/components/dashboard/pending-swap-requests-panel.tsx",
  "utf8",
);
const painelPage = readFileSync("src/app/painel/page.tsx", "utf8");
const managedUserForm = readFileSync(
  "src/components/dashboard/managed-user-create-form.tsx",
  "utf8",
);
const authActions = readFileSync("src/lib/auth/actions.ts", "utf8");
const managedUserAction = authActions.slice(
  authActions.indexOf("export async function createUserByManagerAction"),
);

test("painel usa componentes client-side para acoes pendentes", () => {
  assert.match(approvalPanel, /"use client"/);
  assert.match(swapPanel, /"use client"/);
  assert.match(painelPage, /PendingSwapRequestsPanel/);
});

test("acoes pendentes mostram carregamento e removem item concluido", () => {
  for (const source of [approvalPanel, swapPanel]) {
    assert.match(source, /Loader2/);
    assert.match(source, /animate-spin/);
    assert.match(source, /filter\(/);
    assert.match(source, /result\.ok/);
  }
});

test("cadastro no painel exige confirmacao da senha", () => {
  assert.match(managedUserForm, /label="Digite a senha novamente"/);
  assert.match(managedUserForm, /name="confirmPassword"/);
  assert.match(
    managedUserAction,
    /const confirmPassword = readString\(formData, "confirmPassword"\)/,
  );
  assert.match(managedUserAction, /password !== confirmPassword/);
  assert.match(managedUserAction, /As senhas não conferem\./);
});

test("cadastro no painel organiza campos e funcoes de forma compacta", () => {
  assert.match(managedUserForm, /lg:grid-cols-3/);
  assert.match(managedUserForm, /lg:col-span-2/);
  assert.match(managedUserForm, /flex min-h-11 flex-wrap items-center/);
  assert.match(managedUserForm, /md:grid-cols-2/);
});
