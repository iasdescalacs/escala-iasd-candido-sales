import assert from "node:assert/strict";
import test from "node:test";
import {
  canApprovePendingUserRole,
  getAllowedManagedCreationRoles,
} from "../../src/lib/auth/approval-rules.ts";

test("admin aprova pregador e cantor de qualquer igreja", () => {
  const viewer = { roleKeys: ["admin"], managedChurchIds: [] };

  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "pregador", churchId: "a" } }), true);
  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "cantor", churchId: "b" } }), true);
  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "pastor", churchId: null } }), true);
});

test("anciao aprova pregador e cantor apenas de igreja gerenciada", () => {
  const viewer = { roleKeys: ["anciao"], managedChurchIds: ["central"] };

  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "pregador", churchId: "central" } }), true);
  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "cantor", churchId: "central" } }), true);
  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "pregador", churchId: "bairro" } }), false);
});

test("lider de musica aprova somente cantor da propria igreja", () => {
  const viewer = { roleKeys: ["lider_musica"], managedChurchIds: ["central"] };

  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "cantor", churchId: "central" } }), true);
  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "pregador", churchId: "central" } }), false);
  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "cantor", churchId: "bairro" } }), false);
});

test("funcoes permitidas para cadastro por gestores", () => {
  assert.deepEqual(getAllowedManagedCreationRoles(["lider_musica"]), ["cantor"]);
  assert.deepEqual(getAllowedManagedCreationRoles(["anciao"]), ["pregador", "cantor"]);
  assert.deepEqual(getAllowedManagedCreationRoles(["pastor"]), ["pregador", "cantor"]);
  assert.deepEqual(getAllowedManagedCreationRoles(["pregador"]), []);
});

test("pastor aprova pregador e cantor em qualquer igreja, mas nao outro pastor", () => {
  const viewer = { roleKeys: ["pastor"], managedChurchIds: [] };

  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "pregador", churchId: "a" } }), true);
  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "cantor", churchId: "b" } }), true);
  assert.equal(canApprovePendingUserRole({ viewer, request: { roleKey: "pastor", churchId: "a" } }), false);
});

test("gestores locais nao aprovam solicitacao sem igreja", () => {
  const elder = { roleKeys: ["anciao"], managedChurchIds: ["central"] };
  const musicLeader = { roleKeys: ["lider_musica"], managedChurchIds: ["central"] };

  assert.equal(
    canApprovePendingUserRole({ viewer: elder, request: { roleKey: "pregador", churchId: null } }),
    false,
  );
  assert.equal(
    canApprovePendingUserRole({ viewer: musicLeader, request: { roleKey: "cantor", churchId: null } }),
    false,
  );
});
