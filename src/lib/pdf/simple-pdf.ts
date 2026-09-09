export type PdfCalendarEvent = {
  date: string;
  title: string;
  lines: string[];
};

export type PdfCalendar = {
  events: PdfCalendarEvent[];
  month: number;
  year: number;
};

export type PdfSection = {
  title?: string;
  rows: { label: string; value: string }[][];
};

export function downloadSimplePdf({
  calendar,
  fileName,
  sections = [],
  subtitle,
  title,
  verse,
}: {
  calendar?: PdfCalendar;
  fileName: string;
  sections?: PdfSection[];
  subtitle?: string;
  title: string;
  verse?: string;
}) {
  const pdf = createSimplePdfDocument({ calendar, sections, subtitle, title, verse });
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

export function createSimplePdfDocument({
  calendar,
  sections = [],
  subtitle,
  title,
  verse,
}: {
  calendar?: PdfCalendar;
  sections?: PdfSection[];
  subtitle?: string;
  title: string;
  verse?: string;
}) {
  const stream = calendar
    ? buildCalendarStream({ calendar, sections, subtitle, title, verse })
    : buildTextStream({ sections, subtitle, title, verse });
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  return assemblePdf(objects);
}

function buildCalendarStream({
  calendar,
  sections,
  subtitle,
  title,
  verse,
}: {
  calendar: PdfCalendar;
  sections: PdfSection[];
  subtitle?: string;
  title: string;
  verse?: string;
}) {
  const commands: string[] = [];
  const days = buildCalendarDays(calendar.year, calendar.month);
  const eventsByDate = groupEvents(calendar.events);
  const startX = 36;
  const startY = 462;
  const cellWidth = 110;
  const cellHeight = 56;
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  addText(commands, title, 36, 555, 16, true);
  addText(commands, subtitle ?? "", 36, 535, 10);
  addText(
    commands,
    verse ?? "Servi uns aos outros, cada um conforme o dom que recebeu. 1 Pedro 4:10",
    36,
    518,
    9,
  );

  weekDays.forEach((day, index) => {
    addText(commands, day, startX + index * cellWidth + 4, startY + 14, 9, true);
  });

  commands.push("0.84 G", "0.45 w");

  for (let index = 0; index < days.length; index += 1) {
    const column = index % 7;
    const row = Math.floor(index / 7);
    const x = startX + column * cellWidth;
    const y = startY - 22 - row * cellHeight;

    commands.push(`${x} ${y} ${cellWidth} ${cellHeight} re S`);
  }

  commands.push("0 G", "1 w");

  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    const column = index % 7;
    const row = Math.floor(index / 7);
    const x = startX + column * cellWidth;
    const y = startY - 22 - row * cellHeight;

    addText(commands, String(day.day), x + 5, y + cellHeight - 14, 8, true);
    const events = eventsByDate.get(day.date) ?? [];
    events.slice(0, 2).forEach((event, eventIndex) => {
      const eventY = y + cellHeight - 26 - eventIndex * 22;
      const eventLines = event.lines.slice(0, 3);

      addText(commands, event.title, x + 5, eventY, 6.5, true, 28);
      eventLines.forEach((line, lineIndex) => {
        addText(commands, line, x + 5, eventY - 8 - lineIndex * 7, 5.5, false, 34);
      });
    });

    if (events.length > 2) {
      addText(commands, `+${events.length - 2} culto(s)`, x + 5, y + 4, 5.5);
    }
  }

  const extraLines = formatSections(sections).slice(0, 5);
  extraLines.forEach((line, index) => addText(commands, line, 36, 42 - index * 10, 7));

  return commands.join("\n");
}

function buildTextStream({
  sections,
  subtitle,
  title,
  verse,
}: {
  sections: PdfSection[];
  subtitle?: string;
  title: string;
  verse?: string;
}) {
  const lines = [title, subtitle ?? "", verse ?? "", ...formatSections(sections)].slice(0, 48);
  const commands: string[] = [];

  lines.forEach((line, index) => addText(commands, line, 42, 552 - index * 11, index === 0 ? 14 : 9, index === 0));

  return commands.join("\n");
}

function addText(
  commands: string[],
  value: string,
  x: number,
  y: number,
  size: number,
  bold = false,
  limit = 105,
) {
  commands.push(
    "BT",
    `/${bold ? "F2" : "F1"} ${size} Tf`,
    `${x} ${y} Td`,
    `${toPdfString(shorten(value, limit))} Tj`,
    "ET",
  );
}

function formatSections(sections: PdfSection[]) {
  return sections.flatMap((section) => [
    section.title ?? "",
    ...section.rows.map((row) =>
      row.map((column) => `${column.label}: ${column.value || "A definir"}`).join("   "),
    ),
  ]);
}

function buildCalendarDays(year: number, month: number) {
  const firstDate = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekDay = firstDate.getUTCDay();
  const startDate = new Date(firstDate);
  startDate.setUTCDate(firstDate.getUTCDate() - firstWeekDay);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    days.push({
      date: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
    });
  }

  return days;
}

function groupEvents(events: PdfCalendarEvent[]) {
  const grouped = new Map<string, PdfCalendarEvent[]>();

  for (const event of events) {
    grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]);
  }

  return grouped;
}

function toPdfString(value: string) {
  return `(${normalizeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")})`;
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e]/g, " ");
}

function shorten(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3))}...` : normalized;
}

function assemblePdf(objects: string[]) {
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}
