import assert from "node:assert/strict";
import test from "node:test";
import {
  accessReasonToLoginMessage,
  decideSelectedRoleAccess,
  decideProtectedAccess,
} from "../../src/lib/auth/access-rules.ts";

test("nega acesso para usuario sem sessao", () => {
  assert.deepEqual(decideProtectedAccess(null), {
    allowed: false,
    reason: "not_authenticated",
  });
});

test("nega acesso para cadastro pendente", () => {
  assert.deepEqual(decideProtectedAccess({ status: "pending", roles: [] }), {
    allowed: false,
    reason: "pending",
  });
});

test("nega acesso para usuario bloqueado ou inativo", () => {
  assert.deepEqual(decideProtectedAccess({ status: "blocked", roles: [] }), {
    allowed: false,
    reason: "blocked",
  });
  assert.deepEqual(decideProtectedAccess({ status: "inactive", roles: [] }), {
    allowed: false,
    reason: "inactive",
  });
});

test("permite usuario aprovado em rota protegida comum", () => {
  assert.deepEqual(decideProtectedAccess({ status: "approved", roles: [] }), {
    allowed: true,
  });
});

test("exige perfil admin em rota administrativa", () => {
  assert.deepEqual(
    decideProtectedAccess(
      { status: "approved", roles: ["pregador"] },
      { requireAdmin: true },
    ),
    {
      allowed: false,
      reason: "admin_required",
    },
  );

  assert.deepEqual(
    decideProtectedAccess(
      { status: "approved", roles: ["admin"] },
      { requireAdmin: true },
    ),
    { allowed: true },
  );
});

test("mensagens de bloqueio ficam em portugues", () => {
  assert.equal(
    accessReasonToLoginMessage("blocked"),
    "Seu acesso está bloqueado. Procure a administração.",
  );
});

test("permite login sem escolher funcao ativa", () => {
  assert.deepEqual(decideSelectedRoleAccess("", ["pregador"]), {
    allowed: true,
    role: null,
  });
});

test("nega funcao de login invalida", () => {
  assert.deepEqual(decideSelectedRoleAccess("admin", ["admin"]), {
    allowed: false,
    reason: "invalid_role",
  });
});

test("nega funcao de login nao vinculada ao cadastro", () => {
  assert.deepEqual(decideSelectedRoleAccess("cantor", ["pregador"]), {
    allowed: false,
    reason: "role_not_assigned",
  });
});

test("permite funcao de login vinculada ao cadastro", () => {
  assert.deepEqual(decideSelectedRoleAccess("pregador", ["pregador", "cantor"]), {
    allowed: true,
    role: "pregador",
  });
});
