import test from "node:test";
import assert from "node:assert/strict";
import {
  getOccupiedVolunteerDateKeys,
  hasVolunteerDateConflict,
  isVolunteerAvailableForService,
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

test("disponibilidade atribuida pelo gestor independe da igreja do voluntario", () => {
  assert.equal(
    isVolunteerAvailableForService({
      availability: [
        {
          available: true,
          managed: true,
          serviceDate: "2026-09-02",
          serviceId: "culto-1",
          userId: "usuario-1",
        },
      ],
      churchLinks: [],
      service: {
        churchId: "igreja-1",
        date: "2026-09-02",
        id: "culto-1",
        isSpecial: false,
      },
      userId: "usuario-1",
    }),
    true,
  );
});

test("indisponibilidade especifica do gestor prevalece sobre a data geral", () => {
  assert.equal(
    isVolunteerAvailableForService({
      availability: [
        {
          available: true,
          managed: false,
          serviceDate: "2026-09-02",
          serviceId: null,
          userId: "usuario-1",
        },
        {
          available: false,
          managed: true,
          serviceDate: "2026-09-02",
          serviceId: "culto-1",
          userId: "usuario-1",
        },
      ],
      churchLinks: [{ churchId: "igreja-1", userId: "usuario-1" }],
      service: {
        churchId: "igreja-1",
        date: "2026-09-02",
        id: "culto-1",
        isSpecial: false,
      },
      userId: "usuario-1",
    }),
    false,
  );
});

test("disponibilidade pessoal continua exigindo igreja marcada", () => {
  const availability = [
    {
      available: true,
      managed: false,
      serviceDate: "2026-09-02",
      serviceId: null,
      userId: "usuario-1",
    },
  ];
  const service = {
    churchId: "igreja-1",
    date: "2026-09-02",
    id: "culto-1",
    isSpecial: false,
  };

  assert.equal(
    isVolunteerAvailableForService({
      availability,
      churchLinks: [],
      service,
      userId: "usuario-1",
    }),
    false,
  );
  assert.equal(
    isVolunteerAvailableForService({
      availability,
      churchLinks: [{ churchId: "igreja-1", userId: "usuario-1" }],
      service,
      userId: "usuario-1",
    }),
    true,
  );
});
