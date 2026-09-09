import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mainNav = readFileSync("src/components/main-nav.tsx", "utf8");

test("itens do menu nao quebram nomes compostos", () => {
  assert.match(mainNav, /shrink-0 whitespace-nowrap rounded-md/);
  assert.match(mainNav, /inline-flex shrink-0 items-center gap-1 whitespace-nowrap/);
});
