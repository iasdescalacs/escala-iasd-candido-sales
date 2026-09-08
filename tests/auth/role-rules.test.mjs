import assert from "node:assert/strict";
import test from "node:test";
import {
  isManagerRoleKey,
  mergeSelfManagedRoles,
  normalizeRoleKeys,
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
  assert.equal(isManagerRoleKey("anciao"), true);
  assert.equal(isManagerRoleKey("lider_musica"), true);
  assert.equal(isManagerRoleKey("pregador"), false);
  assert.equal(isManagerRoleKey("cantor"), false);
});
