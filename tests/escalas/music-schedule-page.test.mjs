import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const louvorPage = readFileSync("src/app/escalas/louvor/page.tsx", "utf8");
const scheduleCalendar = readFileSync("src/components/schedule/schedule-calendar.tsx", "utf8");

test("escala de louvor gera pdf separado por igreja para admin", () => {
  assert.match(louvorPage, /pdfCalendars=.+buildChurchPdfCalendars/s);
  assert.match(louvorPage, /calendars=\{pdfCalendars\}/);
  assert.match(louvorPage, /title: `Escala de louvor - \$\{church\.name\}`/);
  assert.match(louvorPage, /Filtrar igreja/);
});

test("calendario de escala mostra pregador e louvor juntos", () => {
  assert.match(scheduleCalendar, /Pregador: \{service\.preacher_name \?\? "A definir"\}/);
  assert.match(scheduleCalendar, /Louvor: \{service\.singer_name \?\? "A definir"\}/);
});
