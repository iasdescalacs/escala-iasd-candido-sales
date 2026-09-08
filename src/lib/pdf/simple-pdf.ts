type PdfColumn = {
  label: string;
  value: string;
};

export type PdfSection = {
  title?: string;
  rows: PdfColumn[][];
};

export function downloadSimplePdf({
  fileName,
  sections,
  subtitle,
  title,
}: {
  fileName: string;
  sections: PdfSection[];
  subtitle?: string;
  title: string;
}) {
  const pages = paginateLines([title, subtitle ?? "", ...formatSections(sections)]);
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids ${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")} /Count ${pages.length} >>`,
  ];

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectNumber = 3 + pageIndex * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const stream = buildPageStream(pageLines);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
      `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    );
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pdf = assemblePdf(objects);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatSections(sections: PdfSection[]) {
  return sections.flatMap((section) => [
    "",
    section.title ?? "",
    ...section.rows.map((row) =>
      row.map((column) => `${column.label}: ${column.value || "A definir"}`).join("   "),
    ),
  ]);
}

function paginateLines(lines: string[]) {
  const wrapped = lines.flatMap((line) => wrapLine(line, 92));
  const pages: string[][] = [];

  for (let index = 0; index < wrapped.length; index += 42) {
    pages.push(wrapped.slice(index, index + 42));
  }

  return pages.length > 0 ? pages : [[""]];
}

function wrapLine(line: string, limit: number) {
  if (!line) {
    return [""];
  }

  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > limit && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  return current ? [...lines, current] : lines;
}

function buildPageStream(lines: string[]) {
  return [
    "BT",
    "/F1 12 Tf",
    "50 800 Td",
    ...lines.map((line, index) => {
      const prefix = index === 0 ? "" : "0 -18 Td ";
      return `${prefix}${toPdfHexString(line)} Tj`;
    }),
    "ET",
  ].join("\n");
}

function toPdfHexString(value: string) {
  const bytes = [0xfe, 0xff];

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 32;

    if (codePoint > 0xffff) {
      bytes.push(0x00, 0x20);
    } else {
      bytes.push((codePoint >> 8) & 0xff, codePoint & 0xff);
    }
  }

  return `<${bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("")}>`;
}

function assemblePdf(objects: string[]) {
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
