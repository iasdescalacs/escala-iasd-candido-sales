import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const files = [
  "src/components/schedule/agenda-calendar.tsx",
  "src/components/schedule/schedule-calendar.tsx",
  "src/components/availability/availability-role-form.tsx",
  "src/app/admin/cultos/page.tsx",
];

test("calendarios usam lista legivel no celular", () => {
  for (const file of files) {
    const source = readFileSync(file, "utf8");

    assert.match(source, /sm:hidden/, `${file} deve ter versao mobile`);
    assert.match(source, /hidden grid-cols-7/, `${file} deve esconder grade semanal no celular`);
  }
});
