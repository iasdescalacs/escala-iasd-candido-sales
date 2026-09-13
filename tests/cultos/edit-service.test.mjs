import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260912231500_edit_worship_services.sql",
  "utf8",
);
const actions = readFileSync("src/lib/cultos/actions.ts", "utf8");
const component = readFileSync(
  "src/components/admin/edit-worship-service-button.tsx",
  "utf8",
);
const page = readFileSync("src/app/admin/cultos/page.tsx", "utf8");

test("edicao de culto e transacional, auditada e restrita ao servidor", () => {
  assert.match(migration, /create or replace function public\.update_worship_service/);
  assert.match(migration, /role\.key = 'admin'/);
  assert.match(migration, /for update/);
  assert.match(migration, /conflicting_service\.start_time = target_start_time/);
  assert.match(migration, /insert into public\.history/);
  assert.match(migration, /revoke all[\s\S]+from public, anon, authenticated/);
  assert.match(migration, /grant execute[\s\S]+to service_role/);
});

test("acao valida horario e exige administrador antes de atualizar", () => {
  assert.match(actions, /updateWorshipServiceAction/);
  assert.match(actions, /const adminProfile = await requireAdminUser\(\)/);
  assert.match(actions, /if \(endTime <= startTime\)/);
  assert.match(actions, /\.rpc\("update_worship_service"/);
  assert.match(actions, /revalidateWorshipServicePaths\(\)/);
});

test("calendario mostra lapis e formulario responsivo com carregamento", () => {
  assert.match(page, /<EditWorshipServiceButton/);
  assert.match(page, /<WorshipServiceEditorProvider>/);
  assert.match(component, /title="Editar culto"/);
  assert.match(component, /<dialog/);
  assert.match(component, /WorshipServiceEditorContext/);
  assert.match(component, /Início/);
  assert.match(component, /Término/);
  assert.match(component, /Observações/);
  assert.match(component, /max-w-xl/);
  assert.match(component, /sm:grid-cols-2/);
  assert.match(component, /disabled=\{pending\}/);
  assert.match(component, /Salvando\.\.\./);
});
