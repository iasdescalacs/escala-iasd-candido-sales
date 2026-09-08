import assert from "node:assert/strict";
import test from "node:test";
import {
  isAvailabilityRoleKey,
  normalizeSelectedDates,
  validateAvailabilityMonth,
} from "../../src/lib/disponibilidade/rules.ts";

test("aceita apenas funcoes com disponibilidade", () => {
  assert.equal(isAvailabilityRoleKey("pregador"), true);
  assert.equal(isAvailabilityRoleKey("cantor"), true);
  assert.equal(isAvailabilityRoleKey("anciao"), false);
  assert.equal(isAvailabilityRoleKey("admin"), false);
});

test("valida disponibilidade de um mes por vez", () => {
  assert.equal(
    validateAvailabilityMonth({
      monthStart: "2026-09-01",
      monthEnd: "2026-09-30",
    }),
    null,
  );
  assert.equal(
    validateAvailabilityMonth({
      monthStart: "2026-09-01",
      monthEnd: "2026-10-31",
    }),
    "Salve a disponibilidade de um mês por vez.",
  );
});

test("normaliza datas marcadas mantendo apenas dias com culto", () => {
  assert.deepEqual(
    normalizeSelectedDates({
      selectedDates: ["2026-09-06", "2026-09-02", "2026-09-02", "2026-09-10"],
      allowedDates: ["2026-09-02", "2026-09-06"],
    }),
    ["2026-09-02", "2026-09-06"],
  );
});
