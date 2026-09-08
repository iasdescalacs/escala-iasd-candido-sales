"use client";

import { Download } from "lucide-react";
import { downloadSimplePdf, type PdfSection } from "@/lib/pdf/simple-pdf";

export function PdfDownloadButton({
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
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
      onClick={() => downloadSimplePdf({ fileName, sections, subtitle, title })}
      type="button"
    >
      <Download size={16} aria-hidden="true" />
      <span>Baixar PDF</span>
    </button>
  );
}
