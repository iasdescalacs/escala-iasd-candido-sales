import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260910123000_distinguish_special_service_availability.sql",
  "utf8",
);
const page = readFileSync("src/app/disponibilidade/page.tsx", "utf8");
const form = readFileSync(
  "src/components/availability/availability-role-form.tsx",
  "utf8",
);
const actions = readFileSync("src/lib/disponibilidade/actions.ts", "utf8");

test("migration vincula disponibilidade opcionalmente ao culto especial", () => {
  assert.match(migration, /add column if not exists worship_service_id uuid/);
  assert.match(migration, /references public\.worship_services\(id\) on delete cascade/);
  assert.match(migration, /user_availability_unique_active_regular_day/);
  assert.match(migration, /user_availability_unique_active_special_service/);
});

test("pagina e formulario distinguem cultos e filtram pelas igrejas marcadas", () => {
  assert.match(page, /church_id,service_date,service_type,start_time,title,is_special/);
  assert.match(page, /role_id,service_date,worship_service_id/);
  assert.match(form, /Culto regular/);
  assert.match(form, /Culto especial:/);
  assert.match(form, /selectedChurches\.has\(service\.church_id\)/);
  assert.match(form, /name="availableSlots"/);
});

test("servidor aceita somente opcoes das igrejas selecionadas", () => {
  assert.match(actions, /buildAvailabilitySlots/);
  assert.match(actions, /selectedChurchIds: validChurchIds/);
  assert.match(actions, /worship_service_id: slot\.worshipServiceId/);
});
