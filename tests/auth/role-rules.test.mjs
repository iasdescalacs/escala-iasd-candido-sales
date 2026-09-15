import assert from "node:assert/strict";
import test from "node:test";
import {
  isManagerRoleKey,
  linksRoleToPrimaryChurch,
  mergeSelfManagedRoles,
  normalizeRoleKeys,
  requiresPrimaryChurch,
} from "../../src/lib/auth/role-rules.ts";

test("normaliza multiplas funcoes sem repetir valores", () => {
  assert.deepEqual(
    normalizeRoleKeys(["pregador", "cantor", "pregador", "admin"]),
    ["pregador", "cantor"],
  );
});

test("permite admin apenas quando solicitado explicitamente", () => {
  assert.deepEqual(
    normalizeRoleKeys(["admin", "anciao"], { allowAdmin: true }),
    ["admin", "anciao"],
  );
});

test("perfil preserva funcoes protegidas e troca apenas funcoes de escala", () => {
  assert.deepEqual(
    mergeSelfManagedRoles({
      currentRoleKeys: ["anciao", "pregador"],
      selectedSelfRoleKeys: ["cantor"],
    }),
    ["anciao", "cantor"],
  );
});

test("identifica funcoes vinculadas como gestor de igreja", () => {
  assert.equal(isManagerRoleKey("pastor"), true);
  assert.equal(isManagerRoleKey("anciao"), true);
  assert.equal(isManagerRoleKey("lider_musica"), true);
  assert.equal(isManagerRoleKey("pregador"), false);
  assert.equal(isManagerRoleKey("cantor"), false);
});

test("pastor global nao exige igreja, exceto quando tambem lidera musica", () => {
  assert.equal(requiresPrimaryChurch(["pastor"]), false);
  assert.equal(requiresPrimaryChurch(["pastor", "pregador", "cantor"]), false);
  assert.equal(requiresPrimaryChurch(["pastor", "anciao"]), false);
  assert.equal(requiresPrimaryChurch(["pastor", "lider_musica"]), true);
  assert.equal(requiresPrimaryChurch(["pregador"]), true);
});

test("pastor vincula somente a lideranca musical a igreja principal", () => {
  const pastoralRoles = ["pastor", "anciao", "lider_musica", "pregador", "cantor"];

  assert.equal(linksRoleToPrimaryChurch("pastor", pastoralRoles), false);
  assert.equal(linksRoleToPrimaryChurch("anciao", pastoralRoles), false);
  assert.equal(linksRoleToPrimaryChurch("pregador", pastoralRoles), false);
  assert.equal(linksRoleToPrimaryChurch("cantor", pastoralRoles), false);
  assert.equal(linksRoleToPrimaryChurch("lider_musica", pastoralRoles), true);
  assert.equal(linksRoleToPrimaryChurch("pregador", ["pregador"]), true);
});
