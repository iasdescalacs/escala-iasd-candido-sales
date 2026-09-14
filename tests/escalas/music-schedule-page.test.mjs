import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const louvorPage = readFileSync("src/app/escalas/louvor/page.tsx", "utf8");
const pregacaoPage = readFileSync("src/app/escalas/pregacao/page.tsx", "utf8");
const adminChurchSchedule = readFileSync(
  "src/components/schedule/admin-church-schedule.tsx",
  "utf8",
);
const scheduleActions = readFileSync("src/lib/escalas/actions.ts", "utf8");
const scheduleQueries = readFileSync("src/lib/escalas/queries.ts", "utf8");
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
  assert.match(pregacaoPage, /groupByChurch=\{isGlobalManager\}/);
  assert.match(louvorPage, /groupByChurch=\{isAdmin\}/);
  assert.match(scheduleCalendar, /AdminChurchSchedule/);
  assert.match(adminChurchSchedule, /Escalas por igreja/);
  assert.match(adminChurchSchedule, /groupServicesByChurch/);
  assert.match(adminChurchSchedule, /Filtrar \{personLabel\}/);
  assert.match(adminChurchSchedule, /Todos os pregadores/);
  assert.match(adminChurchSchedule, /Todos os cantores e grupos/);
});

test("exclusao de escala ignora seletor obrigatorio e volta para a definir", () => {
  for (const source of [scheduleCalendar, adminChurchSchedule]) {
    assert.match(source, /formNoValidate=\{icon === "delete"\}/);
    assert.match(source, /Icon = icon === "save" \? Save : X/);
    assert.match(source, /window\.confirm\(confirmation\)/);
    assert.match(source, /A escala ficará como A definir/);
  }

  assert.match(scheduleActions, /preacher_user_id: null, preacher_name: null/);
  assert.match(
    scheduleActions,
    /singer_formation_id: null,[\s\S]+singer_user_id: null,[\s\S]+singer_name: null/,
  );
});

test("louvor oferece solos e formacoes com conflito por integrante", () => {
  assert.match(scheduleQueries, /type_label: "Solo"/);
  assert.match(scheduleQueries, /getMusicalFormationVolunteerOptions/);
  assert.match(scheduleQueries, /musical_formation_availability/);
  assert.match(scheduleActions, /targetValue\.startsWith\("formation:"\)/);
  assert.match(scheduleActions, /musicalFormationHasConflictOnDate/);
  assert.match(scheduleActions, /Um integrante da formação já está escalado/);
});

test("botoes da escala informam a acao em andamento", () => {
  for (const source of [scheduleCalendar, adminChurchSchedule]) {
    assert.match(source, /Salvando\.\.\./);
    assert.match(source, /Excluindo\.\.\./);
    assert.match(source, /aria-busy=\{isCurrentAction\}/);
    assert.match(source, /data\?\.get\("intent"\) === icon/);
    assert.match(source, /name="intent"/);
  }

  assert.match(scheduleCalendar, /Aprovando\.\.\./);
  assert.match(scheduleCalendar, /Recusando\.\.\./);
});

test("escala respeita disponibilidade distinta para culto regular e especial", () => {
  assert.match(scheduleQueries, /isVolunteerAvailableForService/);
  assert.match(scheduleQueries, /worship_service_id,available,managed/);
  assert.match(scheduleCalendar, /volunteer\.service_id === service\.id/);
  assert.match(adminChurchSchedule, /volunteer\.service_id === service\.id/);
  assert.match(scheduleActions, /isVolunteerAvailableForService/);
  assert.match(scheduleActions, /serviceId: item\.worship_service_id/);
});
