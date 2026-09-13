import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const access = readFileSync("src/lib/cultos/access.ts", "utf8");
const actions = readFileSync("src/lib/cultos/actions.ts", "utf8");
const appConfig = readFileSync("src/config/app.ts", "utf8");
const form = readFileSync(
  "src/components/admin/worship-generation-form.tsx",
  "utf8",
);
const migration = readFileSync(
  "supabase/migrations/20260913003000_allow_elders_manage_worship_services.sql",
  "utf8",
);
const page = readFileSync("src/app/admin/cultos/page.tsx", "utf8");

test("menu e pagina de cultos ficam disponiveis para anciao aprovado", () => {
  assert.match(
    appConfig,
    /export const elderNavigation[\s\S]+label: "Cultos"[\s\S]+href: "\/admin\/cultos"/,
  );
  assert.match(page, /requireWorshipManager\(supabase\)/);
  assert.match(page, /\.in\("church_id", management\.churchIds\)/);
  assert.match(page, /management\.isAdmin \? \([\s\S]+<ClearWorshipServicesForm/);
});

test("servidor resolve somente vinculos gerenciais de anciao", () => {
  assert.match(access, /roleKeys\.includes\("anciao"\)/);
  assert.match(access, /\.eq\("role_id", elderRole\.id\)/);
  assert.match(access, /\.eq\("is_manager", true\)/);
  assert.match(actions, /management\.activeChurches\.map/);
  assert.match(actions, /canManageWorshipService/);
  assert.match(form, /name="churchId"/);
  assert.match(form, /Todas as igrejas vinculadas/);
});

test("banco autoriza admin ou anciao apenas na igreja vinculada", () => {
  assert.match(migration, /create or replace function public\.can_manage_church_worship/);
  assert.match(migration, /role\.key = 'admin'/);
  assert.match(migration, /role\.key = 'anciao'/);
  assert.match(migration, /church_link\.church_id = target_church_id/);
  assert.match(migration, /church_link\.is_manager is true/);
  assert.match(migration, /create or replace function public\.generate_worship_services/);
  assert.match(migration, /not public\.can_manage_church_worship/);
  assert.match(migration, /revoke all[\s\S]+from public, anon, authenticated/);
});
