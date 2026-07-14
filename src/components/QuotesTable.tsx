"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  FileText,
  Loader2,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { StatusBadge, Button, Card, Select } from "./ui";
import { computeQuote, rupees, formatDateNice } from "@/lib/calc";
import { getAllQuotes } from "@/lib/store";
import { toCsv, downloadCsv } from "@/lib/csv";
import type { Quote } from "@/lib/types";

type SortKey =
  | "quoteNumber"
  | "guestName"
  | "flatNo"
  | "extentSft"
  | "flatCost"
  | "status"
  | "date";

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "quoteNumber", label: "Quote #" },
  { key: "guestName", label: "Guest" },
  { key: "flatNo", label: "Flat" },
  { key: "extentSft", label: "Extent", align: "right" },
  { key: "flatCost", label: "Flat Cost", align: "right" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date", align: "right" },
];

function flatCostOf(q: Quote) {
  return computeQuote(q).flatCost;
}

function guestNameOf(q: Quote) {
  return `${q.firstName ?? ""} ${q.lastName ?? ""}`.trim();
}

const emptyFilters = { status: "", block: "", bhk: "", paymentOption: "" };

export default function QuotesTable() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "date",
    dir: "desc",
  });

  useEffect(() => {
    getAllQuotes()
      .then(setQuotes)
      .catch(() => setError("Failed to load quotes."));
  }, []);

  const blocks = useMemo(
    () => Array.from(new Set((quotes ?? []).map((q) => q.block).filter(Boolean))).sort(),
    [quotes],
  );

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const rows = useMemo(() => {
    if (!quotes) return [];
    const q = query.trim().toLowerCase();
    let list = quotes;
    if (q) {
      list = quotes.filter((item) =>
        [
          item.quoteNumber,
          guestNameOf(item),
          item.phone,
          item.flatNo,
          item.block,
          item.projectName,
          item.status,
          item.bhk,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    if (filters.status) list = list.filter((item) => item.status === filters.status);
    if (filters.block) list = list.filter((item) => item.block === filters.block);
    if (filters.bhk) list = list.filter((item) => item.bhk === filters.bhk);
    if (filters.paymentOption)
      list = list.filter((item) => item.paymentOption === filters.paymentOption);

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sort.key === "flatCost") {
        av = flatCostOf(a);
        bv = flatCostOf(b);
      } else if (sort.key === "guestName") {
        av = guestNameOf(a);
        bv = guestNameOf(b);
      } else {
        av = (a[sort.key] as string | number) ?? "";
        bv = (b[sort.key] as string | number) ?? "";
      }
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [quotes, query, filters, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key !== k ? (
      <ArrowUpDown size={13} className="text-slate-300" />
    ) : sort.dir === "asc" ? (
      <ArrowUp size={13} className="text-navy" />
    ) : (
      <ArrowDown size={13} className="text-navy" />
    );

  function handleExport() {
    const csv = toCsv(rows, [
      { key: "quoteNumber", label: "Quote #", value: (q) => q.quoteNumber },
      { key: "guest", label: "Guest", value: (q) => guestNameOf(q) },
      { key: "phone", label: "Phone", value: (q) => q.phone ?? "" },
      { key: "flat", label: "Flat", value: (q) => (q.block && q.flatNo ? `${q.block}-${q.flatNo}` : q.flatNo ?? "") },
      { key: "extentSft", label: "Extent (Sft)", value: (q) => q.extentSft ?? 0 },
      { key: "bhk", label: "Configuration", value: (q) => q.bhk ?? "" },
      { key: "paymentOption", label: "Payment Option", value: (q) => q.paymentOption ?? "" },
      { key: "flatCost", label: "Flat Cost (Rs.)", value: (q) => Math.round(flatCostOf(q)) },
      { key: "status", label: "Status", value: (q) => q.status },
      { key: "date", label: "Date", value: (q) => q.date },
    ]);
    downloadCsv(`SNR_Quotes_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-in">
      {/* Title row */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Quotes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {quotes ? `${quotes.length} estimate${quotes.length === 1 ? "" : "s"}` : "Loading…"}{" "}
            · SNR Group
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guest, flat, quote #…"
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15"
            />
          </div>
          <Button
            variant={activeFilterCount > 0 ? "primary" : "secondary"}
            onClick={() => setShowFilters((s) => !s)}
          >
            <SlidersHorizontal size={16} />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
          <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
            <Download size={16} /> Export
          </Button>
          <Link href="/quotes/new">
            <Button>
              <Plus size={16} /> New
            </Button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </Select>
          <Select
            value={filters.block}
            onChange={(e) => setFilters((f) => ({ ...f, block: e.target.value }))}
          >
            <option value="">All Blocks</option>
            {blocks.map((b) => (
              <option key={b} value={b}>
                Block {b}
              </option>
            ))}
          </Select>
          <Select
            value={filters.bhk}
            onChange={(e) => setFilters((f) => ({ ...f, bhk: e.target.value }))}
          >
            <option value="">All Configurations</option>
            <option value="2 BHK">2 BHK</option>
            <option value="3 BHK">3 BHK</option>
          </Select>
          <Select
            value={filters.paymentOption}
            onChange={(e) => setFilters((f) => ({ ...f, paymentOption: e.target.value }))}
          >
            <option value="">All Payment Options</option>
            <option value="Loan">Loan</option>
            <option value="Outright">Outright</option>
          </Select>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="col-span-2 text-left text-[13px] font-medium text-navy underline decoration-dotted underline-offset-2 hover:text-navy-600 sm:col-span-4"
            >
              Clear all filters
            </button>
          )}
        </Card>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!quotes && !error && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-24 text-slate-400">
          <Loader2 size={18} className="animate-spin" /> Loading quotes…
        </div>
      )}

      {quotes && quotes.length === 0 && <EmptyState />}

      {quotes && quotes.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/70 text-left">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-5 py-3 font-semibold text-slate-500 ${col.align === "right" ? "text-right" : ""}`}
                      >
                        <button
                          onClick={() => toggleSort(col.key)}
                          className={`inline-flex items-center gap-1.5 hover:text-navy ${col.align === "right" ? "flex-row-reverse" : ""}`}
                        >
                          {col.label}
                          <SortIcon k={col.key} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((q) => (
                    <tr
                      key={q._id}
                      className="group border-b border-border last:border-0 transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/quotes/${q._id}`}
                          className="font-semibold text-navy hover:text-gold"
                        >
                          {q.quoteNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {guestNameOf(q) || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {q.block && q.flatNo
                          ? `${q.block}-${q.flatNo}`
                          : q.flatNo || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-600">
                        {q.extentSft ? `${q.extentSft} sft` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-navy">
                        {rupees(flatCostOf(q))}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500">
                        {formatDateNice(q.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <div className="py-14 text-center text-sm text-slate-400">
                No quotes match your search/filters.
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {rows.map((q) => (
              <Link
                key={q._id}
                href={`/quotes/${q._id}`}
                className="block rounded-xl border border-border bg-surface p-4 shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy">
                    {q.quoteNumber}
                  </span>
                  <StatusBadge status={q.status} />
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  {guestNameOf(q) || "—"}
                </div>
                <div className="mt-2 flex items-center justify-between text-[13px] text-slate-500">
                  <span>
                    {q.block && q.flatNo ? `${q.block}-${q.flatNo}` : q.flatNo || "—"}
                    {q.extentSft ? ` · ${q.extentSft} sft` : ""}
                  </span>
                  <span className="font-semibold text-navy">
                    {rupees(flatCostOf(q))}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-slate-400">
                  {formatDateNice(q.date)}
                </div>
              </Link>
            ))}
            {rows.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">
                No quotes match your search/filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-navy">
        <FileText size={26} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-navy">No quotes yet</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Create your first flat cost estimate and share it as a PDF in seconds.
      </p>
      <Link href="/quotes/new" className="mt-5">
        <Button>
          <Plus size={16} /> Create Quote
        </Button>
      </Link>
    </div>
  );
}
