"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Share2, Printer, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "./ui";
import { deleteQuote } from "@/lib/store";
import type { Quote } from "@/lib/types";

async function buildPdfBlob(quote: Quote): Promise<Blob> {
  const [{ pdf }, { default: QuoteDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./QuoteDocument"),
  ]);
  return pdf(<QuoteDocument quote={quote} />).toBlob();
}

function fileName(quote: Quote) {
  const guest = `${quote.firstName ?? ""}_${quote.lastName ?? ""}`
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return `SNR_${guest || quote.quoteNumber}_Quotation.pdf`;
}

export default function QuoteActions({ quote }: { quote: Quote }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleDownload() {
    setBusy("download");
    try {
      const blob = await buildPdfBlob(quote);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName(quote);
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      const blob = await buildPdfBlob(quote);
      const file = new File([blob], fileName(quote), {
        type: "application/pdf",
      });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `SNR Estimate ${quote.quoteNumber}`,
          text: `Flat cost estimate for ${quote.projectName}, Flat ${quote.flatNo}.`,
        });
      } else {
        // Desktop / unsupported: fall back to download.
        await handleDownload();
        alert(
          "Native sharing isn't available on this device — the PDF was downloaded instead. Open it from your device to share.",
        );
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete quote ${quote.quoteNumber}? This cannot be undone.`))
      return;
    setBusy("delete");
    await deleteQuote(quote._id!);
    router.push("/");
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button variant="gold" onClick={handleShare} disabled={!!busy}>
        {busy === "share" ? <Check size={16} /> : <Share2 size={16} />}
        Share PDF
      </Button>
      <Button variant="primary" onClick={handleDownload} disabled={!!busy}>
        <Download size={16} />
        {busy === "download" ? "Preparing…" : "Save PDF"}
      </Button>
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer size={16} />
        Print
      </Button>
      <Link href={`/quotes/${quote._id}/edit`}>
        <Button variant="secondary">
          <Pencil size={16} />
          Edit
        </Button>
      </Link>
      <Button variant="ghost" onClick={handleDelete} disabled={!!busy}>
        <Trash2 size={16} className="text-red-500" />
      </Button>
    </div>
  );
}
