import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const agendaPage = readFileSync("src/app/agenda/page.tsx", "utf8");
const agendaCalendar = readFileSync("src/components/schedule/agenda-calendar.tsx", "utf8");
const swapForm = readFileSync("src/components/schedule/swap-request-form.tsx", "utf8");
const pdfButton = readFileSync("src/components/pdf/pdf-download-button.tsx", "utf8");
const scheduleQueries = readFileSync("src/lib/escalas/queries.ts", "utf8");

test("agenda contem largura no celular para evitar corte lateral", () => {
  assert.match(agendaPage, /overflow-hidden/);
  assert.match(agendaPage, /px-3 py-8 sm:px-6/);
  assert.match(agendaCalendar, /grid min-w-0 gap-4/);
  assert.match(agendaCalendar, /min-w-0 overflow-hidden/);
  assert.match(swapForm, /min-w-0 gap-3 overflow-hidden/);
  assert.match(swapForm, /max-w-full/);
  assert.match(pdfButton, /max-sm:w-full/);
  assert.match(pdfButton, /max-sm:flex-1/);
});

test("permuta mostra pessoa data e igreja com texto responsivo", () => {
  assert.match(scheduleQueries, /church_name: churchMap\.get\(service\.church_id\)\?\.name/);
  assert.match(swapForm, /target\.church_name/);
  assert.match(swapForm, /selectedTarget\.church_name/);
  assert.match(swapForm, /text-xs[\s\S]*sm:text-sm/);
  assert.match(swapForm, /text-primary-strong/);
});
