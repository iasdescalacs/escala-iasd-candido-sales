import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import test from "node:test";

const iconFiles = [
  "src/app/favicon.ico",
  "src/app/icon.png",
  "public/icons/icon.svg",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
];

test("icones do site e PWA existem e nao estao vazios", () => {
  for (const file of iconFiles) {
    assert.equal(existsSync(file), true, `${file} deve existir`);
    assert.ok(statSync(file).size > 0, `${file} deve ter conteudo`);
  }
});
