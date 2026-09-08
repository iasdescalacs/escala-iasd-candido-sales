"use client";

import { Download } from "lucide-react";
import {
  downloadSimplePdf,
  type PdfCalendar,
  type PdfSection,
} from "@/lib/pdf/simple-pdf";

export function PdfDownloadButton({
  calendar,
  fileName,
  sections,
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
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
      onClick={() => downloadSimplePdf({ calendar, fileName, sections, subtitle, title, verse })}
      type="button"
    >
      <Download size={16} aria-hidden="true" />
      <span>Baixar PDF</span>
    </button>
  );
}
