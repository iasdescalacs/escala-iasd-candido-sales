import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCalendarDays,
  buildSpecialWorshipOccurrences,
  buildWorshipOccurrences,
  validateSpecialWorshipRange,
  validateMonthRange,
} from "../../src/lib/cultos/schedule.ts";

test("gera cultos padrao de quarta, sabado e domingo no mes", () => {
  const occurrences = buildWorshipOccurrences({
    year: 2026,
    startMonth: 9,
    endMonth: 9,
  });

  assert.equal(occurrences.length, 13);
  assert.deepEqual(occurrences[0], {
    serviceDate: "2026-09-02",
    serviceType: "quarta",
    startTime: "19:45",
    endTime: "21:00",
  });
  assert.deepEqual(occurrences[1], {
    serviceDate: "2026-09-05",
    serviceType: "sabado",
    startTime: "08:45",
    endTime: "12:00",
  });
  assert.deepEqual(occurrences[2], {
    serviceDate: "2026-09-06",
    serviceType: "domingo",
    startTime: "19:45",
    endTime: "21:00",
  });
});

test("permite gerar no maximo tres meses", () => {
  assert.equal(
    validateMonthRange({ year: 2026, startMonth: 1, endMonth: 3 }),
    null,
  );
  assert.equal(
    validateMonthRange({ year: 2026, startMonth: 1, endMonth: 4 }),
    "Gere no máximo 3 meses por vez.",
  );
});

test("calendario mensal preenche semanas completas", () => {
  const days = buildCalendarDays(2026, 9);

  assert.equal(days.length % 7, 0);
  assert.equal(days.some((day) => day.date === "2026-09-01"), true);
  assert.equal(days.some((day) => day.date === "2026-09-30"), true);
});

test("cria cultos especiais em todos os dias do periodo", () => {
  const occurrences = buildSpecialWorshipOccurrences({
    title: "Semana de Oração Jovem",
    specialType: "semana_oracao",
    startDate: "2026-09-14",
    endDate: "2026-09-18",
    startTime: "19:45",
    endTime: "21:00",
  });

  assert.equal(occurrences.length, 5);
  assert.equal(occurrences[0].serviceDate, "2026-09-14");
  assert.equal(occurrences[4].serviceDate, "2026-09-18");
});

test("valida periodo e horario de culto especial", () => {
  assert.equal(
    validateSpecialWorshipRange({
      title: "Culto de Gratidão",
      specialType: "culto_gratidao",
      startDate: "2026-09-20",
      endDate: "2026-09-20",
      startTime: "19:45",
      endTime: "21:00",
    }),
    null,
  );
  assert.equal(
    validateSpecialWorshipRange({
      title: "Culto da Virada",
      specialType: "culto_virada",
      startDate: "2026-12-31",
      endDate: "2026-12-31",
      startTime: "21:00",
      endTime: "19:45",
    }),
    "O horário de término deve ser posterior ao início.",
  );
});
