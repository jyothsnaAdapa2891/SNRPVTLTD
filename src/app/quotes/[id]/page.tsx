"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileX } from "lucide-react";
import { getQuoteById } from "@/lib/store";
import QuotePreview from "@/components/QuotePreview";
import QuoteActions from "@/components/QuoteActions";
import { StatusBadge, Button } from "@/components/ui";
import type { Quote } from "@/lib/types";

export default function ViewQuotePage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);

  useEffect(() => {
    getQuoteById(id).then((q) => setQuote(q ?? null));
  }, [id]);

  if (quote === undefined) return null;

  if (quote === null) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-navy">
          <FileX size={26} />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-navy">
          Quote not found
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          It may have been deleted, or this device doesn&apos;t have it saved.
        </p>
        <Link href="/" className="mt-5">
          <Button variant="secondary">
            <ArrowLeft size={15} /> Back to quotes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-in">
      <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy"
          >
            <ArrowLeft size={15} /> All quotes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              {quote.quoteNumber}
            </h1>
            <StatusBadge status={quote.status} />
          </div>
        </div>
        <QuoteActions quote={quote} />
      </div>

      <QuotePreview quote={quote} />
    </div>
  );
}
