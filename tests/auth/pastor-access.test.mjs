import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260914002000_add_musical_formations.sql",
  "utf8",
);
const worshipAccess = readFileSync("src/lib/cultos/access.ts", "utf8");
const scheduleQueries = readFileSync("src/lib/escalas/queries.ts", "utf8");
const scheduleActions = readFileSync("src/lib/escalas/actions.ts", "utf8");
const dashboard = readFileSync("src/app/painel/page.tsx", "utf8");
const navigation = readFileSync("src/components/main-nav.tsx", "utf8");

test("pastor gerencia cultos e pregacao de todas as igrejas", () => {
  assert.match(worshipAccess, /isPastor/);
  assert.match(worshipAccess, /isGlobalManager = isAdmin \|\| isPastor/);
  assert.match(scheduleQueries, /isPastorPreachingManager/);
  assert.match(scheduleActions, /isPastorPreachingManager/);
  assert.match(navigation, /viewer\.isPastor/);
});

test("pastor cadastra pessoas e revisa pendencias", () => {
  assert.match(dashboard, /roleKeys\.includes\("pastor"\)/);
  assert.match(scheduleQueries, /roleKeys\.includes\("pastor"\)/);
});

test("banco repete autorizacao pastoral no servidor", () => {
  assert.match(migration, /user_has_role\(actor_id, 'pastor'\)/);
  assert.match(migration, /target_role = 'pregador'/);
  assert.match(migration, /can_manage_church_worship/);
  assert.doesNotMatch(
    migration,
    /target_role = 'cantor'[\s\S]{0,100}user_has_role\(actor_id, 'pastor'\)/,
  );
});
