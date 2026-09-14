import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  formationStatusLabel,
  formationTypeLabel,
  validateFormationMemberCount,
} from "../../src/lib/formacoes/rules.ts";

const migration = readFileSync(
  "supabase/migrations/20260914002000_add_musical_formations.sql",
  "utf8",
);
const page = readFileSync("src/app/formacoes/page.tsx", "utf8");
const form = readFileSync(
  "src/components/formations/musical-formation-form.tsx",
  "utf8",
);
const availability = readFileSync(
  "src/components/formations/formation-availability-calendar.tsx",
  "utf8",
);
const navigation = readFileSync("src/components/main-nav.tsx", "utf8");
const resetScript = readFileSync("supabase/manual/reset-keep-admin.sql", "utf8");

test("valida quantidade de integrantes por tipo de formacao", () => {
  assert.equal(validateFormationMemberCount("dupla", 2), null);
  assert.match(validateFormationMemberCount("dupla", 3), /dois integrantes/);
  assert.equal(validateFormationMemberCount("trio", 3), null);
  assert.match(validateFormationMemberCount("trio", 2), /três integrantes/);
  assert.equal(validateFormationMemberCount("grupo", 2), null);
  assert.match(validateFormationMemberCount("grupo", 1), /pelo menos dois/);
});

test("apresenta rotulos em portugues", () => {
  assert.equal(formationTypeLabel("dupla"), "Dupla");
  assert.equal(formationStatusLabel("pending"), "Aguardando aprovação");
});

test("banco cria formacoes protegidas e operacoes atomicas", () => {
  for (const table of [
    "musical_formations",
    "musical_formation_members",
    "musical_formation_churches",
    "musical_formation_availability",
  ]) {
    assert.match(migration, new RegExp("create table if not exists public\\." + table));
    assert.match(migration, new RegExp("alter table public\\." + table + " force row level security"));
  }

  assert.match(migration, /save_musical_formation/);
  assert.match(migration, /set_musical_formation_availability/);
  assert.match(migration, /Todos os integrantes precisam ser cantores aprovados/);
  assert.match(migration, /actor_is_responsible/);
  assert.match(migration, /Voce nao gerencia a nova igreja de origem/);
  assert.match(migration, /to service_role/);
  assert.match(migration, /singer_formation_id uuid/);
  assert.match(resetScript, /delete from public\.musical_formations/);
});

test("interface gerencia integrantes responsaveis igrejas e calendario", () => {
  assert.match(page, /Formações musicais/);
  assert.match(form, /name="memberIds"/);
  assert.match(form, /name="responsibleIds"/);
  assert.match(form, /name="churchIds"/);
  assert.match(availability, /name="serviceIds"/);
  assert.match(availability, /CircleCheck/);
  assert.match(availability, /sm:hidden/);
  assert.match(
    navigation,
    /viewer\.isAdmin \|\| viewer\.isMusicLeader \|\| viewer\.isSinger/,
  );
});
