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

export type PdfCalendarPage = {
  calendar: PdfCalendar;
  sections?: PdfSection[];
  subtitle?: string;
  title?: string;
  verse?: string;
};

export type PdfSection = {
  title?: string;
  rows: { label: string; value: string }[][];
};

type PdfLogo = {
  height: number;
  imageHex: string;
  width: number;
};

type SimplePdfOptions = {
  calendar?: PdfCalendar;
  calendars?: PdfCalendarPage[];
  fileName: string;
  sections?: PdfSection[];
  subtitle?: string;
  title: string;
  verse?: string;
};

export async function downloadSimplePdf({
  calendar,
  calendars,
  fileName,
  sections = [],
  subtitle,
  title,
  verse,
}: SimplePdfOptions) {
  const blob = await createSimplePdfBlob({ calendar, calendars, fileName, sections, subtitle, title, verse });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function createSimplePdfBlob({
  calendar,
  calendars,
  sections = [],
  subtitle,
  title,
  verse,
}: SimplePdfOptions) {
  const logo = await loadLogoForPdf();
  const pdf = createSimplePdfDocument({ calendar, calendars, logo, sections, subtitle, title, verse });

  return new Blob([pdf], { type: "application/pdf" });
}

export function createSimplePdfDocument({
  calendar,
  calendars,
  logo,
  sections = [],
  subtitle,
  title,
  verse,
}: {
  calendar?: PdfCalendar;
  calendars?: PdfCalendarPage[];
  logo?: PdfLogo;
  sections?: PdfSection[];
  subtitle?: string;
  title: string;
  verse?: string;
}) {
  if (calendars?.length) {
    const streams = calendars.map((page) =>
      buildCalendarStream({
        calendar: page.calendar,
        logo,
        sections: page.sections ?? [],
        subtitle: page.subtitle ?? subtitle,
        title: page.title ?? title,
        verse: page.verse ?? verse,
      }),
    );

    return assemblePagedPdf(streams, logo);
  }

  const stream = calendar
    ? buildCalendarStream({ calendar, logo, sections, subtitle, title, verse })
    : buildTextStream({ sections, subtitle, title, verse });
  const pageResources = logo
    ? "/Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> >>"
    : "/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] ${pageResources} /Contents 4 0 R >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  if (logo) {
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${
        logo.imageHex.length + 1
      } >>\nstream\n${logo.imageHex}>\nendstream`,
    );
  }

  return assemblePdf(objects);
}

function assemblePagedPdf(streams: string[], logo?: PdfLogo) {
  const pageCount = streams.length;
  const pageIds = Array.from({ length: pageCount }, (_, index) => index + 3);
  const contentStartId = 3 + pageCount;
  const fontRegularId = 3 + pageCount * 2;
  const fontBoldId = fontRegularId + 1;
  const logoId = fontBoldId + 1;
  const resources = logo
    ? `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> /XObject << /Im1 ${logoId} 0 R >> >>`
    : `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >>`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`,
    ...streams.map((_, index) =>
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] ${resources} /Contents ${contentStartId + index} 0 R >>`,
    ),
    ...streams.map((stream) => `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`),
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  if (logo) {
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${
        logo.imageHex.length + 1
      } >>\nstream\n${logo.imageHex}>\nendstream`,
    );
  }

  return assemblePdf(objects);
}

function buildCalendarStream({
  calendar,
  logo,
  sections,
  subtitle,
  title,
  verse,
}: {
  calendar: PdfCalendar;
  logo?: PdfLogo;
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

  commands.push("0.180 0.427 0.906 RG", "0.180 0.427 0.906 rg", "36 572 770 3 re f");
  if (logo) {
    commands.push("q", "54 0 0 54 748 504 cm", "/Im1 Do", "Q");
  }

  commands.push("0.015 0.239 0.443 rg");
  addText(commands, title, 36, 555, 16, true);
  commands.push("0 G");
  addText(commands, subtitle ?? "", 36, 535, 10);
  addText(
    commands,
    verse ?? "Servi uns aos outros, cada um conforme o dom que recebeu. 1 Pedro 4:10",
    36,
    518,
    9,
  );

  commands.push("0.78 0.86 0.97 RG", "0.45 w");

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

    commands.push("0.015 0.239 0.443 rg");
    addText(commands, `${day.day} ${weekDays[column]}`, x + 5, y + cellHeight - 14, 8, true);
    commands.push("0 G");
    const events = eventsByDate.get(day.date) ?? [];
    events.slice(0, 2).forEach((event, eventIndex) => {
      const eventY = y + cellHeight - 29 - eventIndex * 21;
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

async function loadLogoForPdf(): Promise<PdfLogo | undefined> {
  if (typeof window === "undefined" || typeof Image === "undefined") {
    return undefined;
  }

  try {
    const image = await loadImage("/brand/iasd-logo.png");
    const canvas = document.createElement("canvas");
    const size = 96;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);

    const dataUri = canvas.toDataURL("image/jpeg", 0.88);
    const base64 = dataUri.split(",")[1];

    if (!base64) {
      return undefined;
    }

    return {
      height: size,
      imageHex: base64ToHex(base64),
      width: size,
    };
  } catch {
    return undefined;
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nao foi possivel carregar a imagem do PDF."));
    image.src = src;
  });
}

function base64ToHex(base64: string) {
  const binary = atob(base64);
  let hex = "";

  for (let index = 0; index < binary.length; index += 1) {
    hex += binary.charCodeAt(index).toString(16).padStart(2, "0");
  }

  return hex;
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
