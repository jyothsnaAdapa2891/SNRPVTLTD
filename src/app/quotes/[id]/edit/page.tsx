"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileX } from "lucide-react";
import { getQuoteById } from "@/lib/store";
import QuoteForm from "@/components/QuoteForm";
import { Button } from "@/components/ui";
import type { Quote } from "@/lib/types";

export default function EditQuotePage() {
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
        <Link href="/" className="mt-5">
          <Button variant="secondary">
            <ArrowLeft size={15} /> Back to quotes
          </Button>
        </Link>
      </div>
    );
  }

  return <QuoteForm initial={quote} id={id} />;
}
