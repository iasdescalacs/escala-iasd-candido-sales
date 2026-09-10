import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260910150000_clear_all_worship_services.sql",
  "utf8",
);
const actions = readFileSync("src/lib/cultos/actions.ts", "utf8");
const component = readFileSync(
  "src/components/admin/clear-worship-services-form.tsx",
  "utf8",
);
const page = readFileSync("src/app/admin/cultos/page.tsx", "utf8");

test("limpeza de cultos ocorre em funcao transacional restrita ao servidor", () => {
  assert.match(migration, /create or replace function public\.clear_all_worship_services/);
  assert.match(migration, /role\.key = 'admin'/);
  assert.match(migration, /delete from public\.swap_requests/);
  assert.match(migration, /delete from public\.user_availability/);
  assert.match(migration, /delete from public\.worship_services/);
  assert.match(migration, /revoke all[\s\S]+from public, anon, authenticated/);
  assert.match(migration, /grant execute[\s\S]+to service_role/);
});

test("acao confirma administrador e atualiza todas as telas dependentes", () => {
  assert.match(actions, /clearAllWorshipServicesAction/);
  assert.match(actions, /await requireAdminUser\(\)/);
  assert.match(actions, /readString\(formData, "confirmation"\) !== "delete-all"/);
  assert.match(actions, /\.rpc\([\s\S]*"clear_all_worship_services"/);
  assert.match(actions, /"\/admin\/cultos"/);
  assert.match(actions, /"\/agenda"/);
  assert.match(actions, /"\/disponibilidade"/);
  assert.match(actions, /"\/escalas\/louvor"/);
  assert.match(actions, /"\/escalas\/pregacao"/);
  assert.match(actions, /"\/painel"/);
});

test("pagina exibe exclusao com confirmacao e estado de carregamento", () => {
  assert.match(page, /<ClearWorshipServicesForm \/>/);
  assert.match(component, /name="confirmation"[\s\S]+value="delete-all"/);
  assert.match(component, /window\.confirm\(confirmation\)/);
  assert.match(component, /Esta ação não pode ser desfeita/);
  assert.match(component, /Excluindo\.\.\./);
  assert.match(component, /disabled=\{pending\}/);
});
