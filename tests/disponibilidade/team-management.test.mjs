import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canManageAvailabilityRole,
  getManagedAvailabilityRoleKeys,
} from "../../src/lib/disponibilidade/manager-rules.ts";

const migration = readFileSync(
  "supabase/migrations/20260913110000_manage_team_availability.sql",
  "utf8",
);
const securityMigration = readFileSync(
  "supabase/migrations/20260913113000_protect_managed_availability.sql",
  "utf8",
);
const page = readFileSync(
  "src/app/disponibilidade/equipe/page.tsx",
  "utf8",
);
const actions = readFileSync("src/lib/disponibilidade/actions.ts", "utf8");
const navigation = readFileSync("src/config/app.ts", "utf8");

test("limita as funcoes que cada gestor pode administrar", () => {
  assert.deepEqual(getManagedAvailabilityRoleKeys(["anciao"]), ["pregador"]);
  assert.deepEqual(getManagedAvailabilityRoleKeys(["lider_musica"]), ["cantor"]);
  assert.deepEqual(
    getManagedAvailabilityRoleKeys(["anciao", "lider_musica"]),
    ["pregador", "cantor"],
  );
  assert.deepEqual(getManagedAvailabilityRoleKeys(["admin"]), [
    "pregador",
    "cantor",
  ]);
  assert.equal(
    canManageAvailabilityRole({
      targetRoleKey: "cantor",
      viewerRoleKeys: ["anciao"],
    }),
    false,
  );
});

test("pagina oferece pesquisa por nome e calendario mensal por culto", () => {
  assert.match(page, /name="busca"/);
  assert.match(page, /buildCalendarDays/);
  assert.match(page, /worship_services/);
  assert.match(page, /A busca inclui voluntários de qualquer igreja/);
  assert.match(navigation, /Disponibilidade da equipe/);
});

test("servidor e banco repetem a autorizacao gerencial", () => {
  assert.match(actions, /requireAvailabilityManager/);
  assert.match(actions, /set_managed_user_availability/);
  assert.match(migration, /can_manage_user_availability/);
  assert.match(migration, /target_role = 'pregador' and role\.key = 'anciao'/);
  assert.match(
    migration,
    /target_role = 'cantor' and role\.key = 'lider_musica'/,
  );
  assert.match(migration, /Voluntario aprovado com essa funcao nao localizado/);
  assert.match(migration, /to service_role/);
  assert.doesNotMatch(
    migration,
    /grant execute on function public\.set_managed_user_availability[\s\S]+to authenticated/,
  );
});

test("salvamento gerencial e independente do vinculo do voluntario", () => {
  assert.match(migration, /managed boolean not null default false/);
  assert.match(migration, /managed_by_user_id uuid/);
  assert.match(migration, /service\.id = any\(coalesce\(selected_service_ids/);
  assert.match(migration, /'manage_team_availability'/);
});

test("RLS impede o navegador de forjar uma disponibilidade gerencial", () => {
  assert.match(securityMigration, /managed is false/);
  assert.match(securityMigration, /managed_by_user_id is null/);
  assert.match(securityMigration, /public\.is_admin\(\)/);
});
