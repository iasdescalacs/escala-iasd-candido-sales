"use client";

import { Download, Send } from "lucide-react";
import { useState } from "react";
import {
  createSimplePdfBlob,
  downloadSimplePdf,
  openSimplePdf,
  type PdfCalendar,
  type PdfCalendarPage,
  type PdfSection,
} from "@/lib/pdf/simple-pdf";

export function PdfDownloadButton({
  calendar,
  calendars,
  fileName,
  sections,
  subtitle,
  title,
  verse,
}: {
  calendar?: PdfCalendar;
  calendars?: PdfCalendarPage[];
  fileName: string;
  sections?: PdfSection[];
  subtitle?: string;
  title: string;
  verse?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);

    try {
      await openSimplePdf({ calendar, calendars, fileName, sections, subtitle, title, verse });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleShare() {
    setIsSharing(true);

    try {
      const blob = await createSimplePdfBlob({ calendar, calendars, fileName, sections, subtitle, title, verse });
      const file = new File([blob], fileName, { type: "application/pdf" });
      const shareData = {
        files: [file],
        text: "Segue a escala em PDF.",
        title,
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }

      await downloadSimplePdf({ calendar, calendars, fileName, sections, subtitle, title, verse });
      window.open(
        `https://wa.me/?text=${encodeURIComponent("Baixei a escala em PDF. Vou anexar o arquivo aqui no WhatsApp.")}`,
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 max-sm:w-full">
      <button
        className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70 max-sm:flex-1"
        disabled={isGenerating || isSharing}
        onClick={handleDownload}
        type="button"
      >
        <Download size={16} aria-hidden="true" />
        <span className="truncate">{isGenerating ? "Gerando..." : "Baixar PDF"}</span>
      </button>
      <button
        className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 max-sm:flex-1"
        disabled={isGenerating || isSharing}
        onClick={handleShare}
        type="button"
      >
        <Send size={16} aria-hidden="true" />
        <span className="truncate">{isSharing ? "Compartilhando..." : "Compartilhar"}</span>
      </button>
    </div>
  );
}
