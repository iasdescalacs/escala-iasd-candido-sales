import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const signUpForm = readFileSync("src/components/auth/sign-up-form.tsx", "utf8");

test("cadastro exibe igreja em uma linha e senhas lado a lado", () => {
  assert.match(
    signUpForm,
    /sm:col-span-2">\s*Igreja onde é membro/,
  );
  assert.match(
    signUpForm,
    /<PasswordField autoComplete="new-password" label="Senha" name="password" \/>\s*<PasswordField/,
  );
});
