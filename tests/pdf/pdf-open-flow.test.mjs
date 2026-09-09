import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pdfButton = readFileSync("src/components/pdf/pdf-download-button.tsx", "utf8");
const simplePdf = readFileSync("src/lib/pdf/simple-pdf.ts", "utf8");

test("botao baixar pdf tenta abrir visualizador antes do fallback", () => {
  assert.match(pdfButton, /openSimplePdf/);
  assert.match(simplePdf, /export async function openSimplePdf/);
  assert.match(simplePdf, /window\.open\("about:blank", "_blank"\)/);
  assert.match(simplePdf, /downloadPdfBlob\(blob, fileName\)/);
});
