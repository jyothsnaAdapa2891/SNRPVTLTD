import type { Quote, QuoteInput, QuoteStatus } from "./types";
import { flatIdOf } from "./vacants";

/**
 * Quotes. Backed by the /api/quotes routes (MongoDB on the server). Every
 * function here is async and simply talks to that API — no data lives in
 * the browser.
 */

/** Shape a quote document takes coming back from (or going into) the database. */
export interface QuoteDbDoc extends Omit<Quote, "_id"> {
  _id: string; // the quoteNumber, e.g. "SNR-0001"
}

async function asJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

/** The flat a quote points at, computed from block+flatNo if flatId is missing. */
function resolveFlatId(q: Pick<Quote, "flatId" | "block" | "flatNo">): string | undefined {
  if (q.flatId) return q.flatId;
  if (q.block && q.flatNo) return flatIdOf(q.block, q.flatNo);
  return undefined;
}

function normalizeQuoteDoc(doc: QuoteDbDoc): Quote {
  return { ...doc, flatId: resolveFlatId(doc) };
}

export async function getAllQuotes(): Promise<Quote[]> {
  const res = await fetch("/api/quotes");
  const docs = await asJson<QuoteDbDoc[]>(res);
  return docs
    .map(normalizeQuoteDoc)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
  const res = await fetch(`/api/quotes/${encodeURIComponent(id)}`);
  if (res.status === 404) return undefined;
  const doc = await asJson<QuoteDbDoc>(res);
  return normalizeQuoteDoc(doc);
}

export async function createQuote(input: QuoteInput): Promise<Quote> {
  const res = await fetch("/api/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const doc = await asJson<QuoteDbDoc>(res);
  return normalizeQuoteDoc(doc);
}

export async function updateQuote(id: string, input: QuoteInput): Promise<Quote | undefined> {
  const res = await fetch(`/api/quotes/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 404) return undefined;
  const doc = await asJson<QuoteDbDoc>(res);
  return normalizeQuoteDoc(doc);
}

export async function deleteQuote(id: string): Promise<void> {
  const res = await fetch(`/api/quotes/${encodeURIComponent(id)}`, { method: "DELETE" });
  await asJson<{ ok: true }>(res);
}

/**
 * Maps every flat (by flatId) that appears in at least one saved quote to its
 * status: "Accepted" if any quote for that flat was accepted, else "Draft" if
 * any quote is a draft, else "Rejected". Used to hide already-accepted flats
 * from selection and to badge flats already in use.
 */
export async function getFlatStatusMap(
  excludeQuoteId?: string,
): Promise<Map<string, QuoteStatus>> {
  const quotes = await getAllQuotes();
  const map = new Map<string, QuoteStatus>();
  const rank: Record<QuoteStatus, number> = { Accepted: 3, Draft: 2, Rejected: 1 };
  for (const q of quotes) {
    const key = resolveFlatId(q);
    if (!key) continue;
    if (excludeQuoteId && q._id === excludeQuoteId) continue;
    const existing = map.get(key);
    if (!existing || rank[q.status] > rank[existing]) {
      map.set(key, q.status);
    }
  }
  return map;
}
