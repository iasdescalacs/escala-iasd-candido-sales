import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAvailabilitySlots,
  isAvailabilityRoleKey,
  normalizeSelectedDates,
  normalizeSelectedSlots,
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

test("separa culto regular de cada culto especial no mesmo dia", () => {
  const slots = buildAvailabilitySlots({
    selectedChurchIds: ["igreja-a", "igreja-b"],
    services: [
      {
        id: "regular-a",
        church_id: "igreja-a",
        service_date: "2026-09-02",
        is_special: false,
      },
      {
        id: "regular-b",
        church_id: "igreja-b",
        service_date: "2026-09-02",
        is_special: false,
      },
      {
        id: "especial-a",
        church_id: "igreja-a",
        service_date: "2026-09-02",
        is_special: true,
      },
    ],
  });

  assert.deepEqual(
    slots.map((slot) => slot.key),
    ["regular:2026-09-02", "special:especial-a"],
  );
});

test("ao desmarcar igreja remove seu especial e preserva regular de outra igreja", () => {
  const services = [
    {
      id: "especial-desbravadores",
      church_id: "desbravadores",
      service_date: "2026-09-02",
      is_special: true,
    },
    {
      id: "regular-central",
      church_id: "central",
      service_date: "2026-09-02",
      is_special: false,
    },
  ];
  const allowedSlots = buildAvailabilitySlots({
    services,
    selectedChurchIds: ["central"],
  });

  assert.deepEqual(allowedSlots.map((slot) => slot.key), ["regular:2026-09-02"]);
  assert.deepEqual(
    normalizeSelectedSlots({
      selectedSlots: ["special:especial-desbravadores", "regular:2026-09-02"],
      allowedSlots,
    }),
    ["regular:2026-09-02"],
  );
});
