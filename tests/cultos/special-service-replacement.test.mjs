import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260912113000_replace_special_worship_service_conflicts.sql",
  "utf8",
);
const actions = readFileSync("src/lib/cultos/actions.ts", "utf8");
const page = readFileSync("src/app/admin/cultos/page.tsx", "utf8");
const deleteButton = readFileSync(
  "src/components/admin/delete-worship-service-button.tsx",
  "utf8",
);

test("culto especial substitui o culto da mesma igreja, data e horario", () => {
  assert.match(
    migration,
    /worship_services_unique_active_church_time[\s\S]+church_id, service_date, start_time/,
  );
  assert.match(migration, /create or replace function public\.replace_special_worship_services/);
  assert.match(
    migration,
    /on conflict \(church_id, service_date, start_time\)[\s\S]+do update set[\s\S]+service_type = 'especial'/,
  );
  assert.match(migration, /preacher_user_id = coalesce/);
  assert.match(migration, /singer_user_id = coalesce/);
  assert.match(migration, /grant execute[\s\S]+to service_role/);
  assert.match(actions, /\.rpc\([\s\S]*"replace_special_worship_services"/);
});

test("geracao regular nao recria um culto no horario ocupado por especial", () => {
  assert.match(actions, /\.select\("church_id,service_date,start_time"\)/);
  assert.match(
    actions,
    /`\$\{church\.id\}:\$\{occurrence\.serviceDate\}:\$\{occurrence\.startTime\}`/,
  );
});

test("calendario permite excluir um culto com confirmacao e carregamento", () => {
  assert.match(page, /<DeleteWorshipServiceButton/);
  assert.match(deleteButton, /window\.confirm/);
  assert.match(deleteButton, /title="Excluir culto"/);
  assert.match(deleteButton, /bg-red-600/);
  assert.match(deleteButton, /disabled=\{pending\}/);
  assert.match(deleteButton, /Loader2 className="animate-spin"/);
  assert.match(actions, /deleteWorshipServiceAction/);
  assert.match(actions, /\.rpc\("delete_worship_service"/);
  assert.match(migration, /create or replace function public\.delete_worship_service/);
});
