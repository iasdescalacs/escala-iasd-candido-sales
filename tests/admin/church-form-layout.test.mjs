import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const churchForm = readFileSync("src/components/admin/church-form.tsx", "utf8");

test("formulario de igreja evita overflow fora do card", () => {
  assert.match(churchForm, /overflow-hidden/);
  assert.match(churchForm, /min-w-0/);
  assert.match(churchForm, /minmax\(0,1\.5fr\)/);
  assert.doesNotMatch(churchForm, /sm:grid-cols-\[1\.5fr_1fr_90px\]/);
});
