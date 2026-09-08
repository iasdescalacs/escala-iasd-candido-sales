import test from "node:test";
import assert from "node:assert/strict";
import {
  getOccupiedVolunteerDateKeys,
  hasVolunteerDateConflict,
} from "../../src/lib/escalas/rules.ts";

test("detecta voluntario ja escalado em outro culto no mesmo dia", () => {
  const assignments = [
    { serviceId: "culto-1", serviceDate: "2026-09-01", userId: "usuario-1" },
    { serviceId: "culto-2", serviceDate: "2026-09-02", userId: "usuario-1" },
  ];

  assert.equal(
    hasVolunteerDateConflict({
      assignments,
      currentServiceId: "culto-3",
      serviceDate: "2026-09-01",
      userId: "usuario-1",
    }),
    true,
  );
});

test("ignora o proprio culto ao validar conflito de data", () => {
  const assignments = [
    { serviceId: "culto-1", serviceDate: "2026-09-01", userId: "usuario-1" },
  ];

  assert.equal(
    hasVolunteerDateConflict({
      assignments,
      currentServiceId: "culto-1",
      serviceDate: "2026-09-01",
      userId: "usuario-1",
    }),
    false,
  );
});

test("gera chaves de datas ocupadas apenas para escalas com usuario", () => {
  const keys = getOccupiedVolunteerDateKeys([
    { serviceId: "culto-1", serviceDate: "2026-09-01", userId: "usuario-1" },
    { serviceId: "culto-2", serviceDate: "2026-09-01", userId: null },
  ]);

  assert.deepEqual(Array.from(keys), ["usuario-1:2026-09-01"]);
});
