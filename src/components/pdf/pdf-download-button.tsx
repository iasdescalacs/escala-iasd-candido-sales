"use client";

import { Download } from "lucide-react";
import { useState } from "react";
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
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);

    try {
      await downloadSimplePdf({ calendar, fileName, sections, subtitle, title, verse });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isGenerating}
      onClick={handleDownload}
      type="button"
    >
      <Download size={16} aria-hidden="true" />
      <span>{isGenerating ? "Gerando..." : "Baixar PDF"}</span>
    </button>
  );
}
