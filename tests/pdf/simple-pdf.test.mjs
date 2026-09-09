import test from "node:test";
import assert from "node:assert/strict";
import { createSimplePdfDocument } from "../../src/lib/pdf/simple-pdf.ts";

test("gera pdf de calendario com texto de igreja e pregador", () => {
  const pdf = createSimplePdfDocument({
    calendar: {
      month: 9,
      year: 2026,
      events: [
        {
          date: "2026-09-01",
          title: "19:45 - Culto",
          lines: [
            "Igreja: Central - Candido Sales/BA",
            "Pregador: Maria Silva",
            "Louvor: Grupo Esperanca",
          ],
        },
      ],
    },
    logo: {
      height: 1,
      imageHex: "ffd8ffe000104a46494600010101006000600000ffd9",
      width: 1,
    },
    title: "Escala de pregacao",
    verse: "Servi uns aos outros. 1 Pedro 4:10",
  });

  assert.match(pdf, /^%PDF-1\.4/);
  assert.match(pdf, /1 Ter/);
  assert.match(pdf, /19:45 - Culto/);
  assert.match(pdf, /Igreja: Central - Candido Sales\/BA/);
  assert.match(pdf, /Pregador: Maria Silva/);
  assert.match(pdf, /\/Im1 Do/);
  assert.match(pdf, /ASCIIHexDecode/);
  assert.match(pdf, / re S/);
  assert.ok(pdf.length > 1000);
});

test("gera pdf de calendario com uma pagina por igreja", () => {
  const pdf = createSimplePdfDocument({
    calendars: [
      {
        calendar: { events: [], month: 9, year: 2026 },
        title: "Escala - Central",
      },
      {
        calendar: { events: [], month: 9, year: 2026 },
        title: "Escala - Bela Vista",
      },
    ],
    title: "Escala mensal por igreja",
  });

  assert.match(pdf, /\/Count 2/);
  assert.match(pdf, /Escala - Central/);
  assert.match(pdf, /Escala - Bela Vista/);
});
