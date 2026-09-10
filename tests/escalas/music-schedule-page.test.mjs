import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const louvorPage = readFileSync("src/app/escalas/louvor/page.tsx", "utf8");
const pregacaoPage = readFileSync("src/app/escalas/pregacao/page.tsx", "utf8");
const adminChurchSchedule = readFileSync(
  "src/components/schedule/admin-church-schedule.tsx",
  "utf8",
);
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

test("admin visualiza escalas agrupadas por igreja com filtro de pessoa", () => {
  assert.match(pregacaoPage, /groupByChurch=\{isAdmin\}/);
  assert.match(louvorPage, /groupByChurch=\{isAdmin\}/);
  assert.match(scheduleCalendar, /AdminChurchSchedule/);
  assert.match(adminChurchSchedule, /Escalas por igreja/);
  assert.match(adminChurchSchedule, /groupServicesByChurch/);
  assert.match(adminChurchSchedule, /Filtrar \{personLabel\}/);
  assert.match(adminChurchSchedule, /Todos os pregadores/);
  assert.match(adminChurchSchedule, /Todos os cantores e grupos/);
});
