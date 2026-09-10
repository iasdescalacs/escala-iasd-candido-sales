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
