"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Building2,
  Trash2,
  Pencil,
  Loader2,
  Download,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button, Card, cn } from "./ui";
import AddVacantModal from "./AddVacantModal";
import { toCsv, downloadCsv } from "@/lib/csv";
import {
  getAllVacants,
  deleteVacant,
  updateVacantStatus,
  configForExtent,
  FACING_OPTIONS,
  VACANT_STATUS_OPTIONS,
  type VacantPlot,
  type VacantStatus,
} from "@/lib/vacants";
import { getFlatStatusMap } from "@/lib/store";
import type { QuoteStatus } from "@/lib/types";

type SortKey = "block" | "flatNo" | "extentSft" | "facing" | "bhk" | "status";

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "block", label: "Block" },
  { key: "flatNo", label: "Flat No" },
  { key: "extentSft", label: "Extent", align: "right" },
  { key: "facing", label: "Facing" },
  { key: "bhk", label: "Configuration" },
  { key: "status", label: "Status" },
];

// Manually-set status shown in the table/filters/export/stats.
const statusMeta: Record<VacantStatus, { label: string; className: string; dot: string }> = {
  Available: { label: "Vacant", className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Reserved: { label: "Reserved", className: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Mortgaged: { label: "Mortgaged", className: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  Sold: { label: "Sold", className: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

// Full quote-status detail, used only for the delete-confirmation message.
const quoteStatusLabel: Record<QuoteStatus, string> = {
  Draft: "Draft",
  Accepted: "Accepted",
  Rejected: "Rejected",
};

const blockPalette = [
  "bg-navy text-gold",
  "bg-emerald-600 text-white",
  "bg-amber-500 text-white",
  "bg-sky-600 text-white",
  "bg-rose-500 text-white",
  "bg-violet-600 text-white",
  "bg-teal-600 text-white",
  "bg-orange-500 text-white",
];

function blockColor(block: string) {
  const idx = block.charCodeAt(0) % blockPalette.length;
  return blockPalette[idx] ?? blockPalette[0];
}

const emptyFilters = {
  block: [] as string[],
  facing: [] as string[],
  bhk: [] as string[],
  status: [] as string[],
  corner: [] as string[],
};

type MultiSelectOption = { value: string; label: string };

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-left text-sm shadow-sm outline-none transition-colors hover:border-navy-500/50 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15",
        )}
      >
        <span className="truncate text-slate-700">
          {label}
          {selected.length > 0 && (
            <span className="ml-1 font-semibold text-navy">({selected.length})</span>
          )}
        </span>
        <ChevronDown size={15} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full min-w-[180px] overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg">
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    checked ? "border-navy bg-navy text-white" : "border-border bg-white",
                  )}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(o.value)}
                  className="sr-only"
                />
                <span className="text-slate-700">{o.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VacantsTable() {
  const [vacants, setVacants] = useState<VacantPlot[] | null>(null);
  const [statusMap, setStatusMap] = useState<Map<string, QuoteStatus>>(new Map());
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVacant, setEditingVacant] = useState<VacantPlot | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "block",
    dir: "asc",
  });

  function refresh() {
    getAllVacants().then(setVacants);
    getFlatStatusMap().then(setStatusMap);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleStatusChange(v: VacantPlot, status: VacantStatus) {
    if (status === v.status) return;
    setStatusBusyId(v.id);
    try {
      await updateVacantStatus(v.id, status);
      refresh();
    } finally {
      setStatusBusyId(null);
    }
  }

  const blocks = useMemo(
    () => Array.from(new Set((vacants ?? []).map((v) => v.block))).sort(),
    [vacants],
  );

  const activeFilterCount = Object.values(filters).reduce((n, v) => n + v.length, 0);

  const rows = useMemo(() => {
    if (!vacants) return [];
    const q = query.trim().toLowerCase();
    let list = vacants;
    if (q) {
      list = list.filter((v) =>
        [v.block, v.flatNo, v.facing, configForExtent(v.extentSft)]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    if (filters.block.length) list = list.filter((v) => filters.block.includes(v.block));
    if (filters.facing.length) list = list.filter((v) => filters.facing.includes(v.facing));
    if (filters.bhk.length)
      list = list.filter((v) => filters.bhk.includes(configForExtent(v.extentSft)));
    if (filters.corner.length)
      list = list.filter((v) => filters.corner.includes(String(v.corner)));
    if (filters.status.length) list = list.filter((v) => filters.status.includes(v.status));

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sort.key === "bhk") {
        av = configForExtent(a.extentSft);
        bv = configForExtent(b.extentSft);
      } else {
        av = a[sort.key];
        bv = b[sort.key];
      }
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }, [vacants, query, filters, sort]);

  const isFiltered = query.trim() !== "" || activeFilterCount > 0;

  const stats = useMemo(() => {
    let available = 0;
    let reserved = 0;
    let mortgaged = 0;
    let sold = 0;
    for (const v of rows) {
      if (v.status === "Sold") sold++;
      else if (v.status === "Reserved") reserved++;
      else if (v.status === "Mortgaged") mortgaged++;
      else available++;
    }
    return { total: rows.length, available, reserved, mortgaged, sold };
  }, [rows]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
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

  function openAddModal() {
    setEditingVacant(null);
    setModalOpen(true);
  }

  function openEditModal(v: VacantPlot) {
    setEditingVacant(v);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingVacant(null);
  }

  async function handleDelete(v: VacantPlot) {
    const quoteStatus = statusMap.get(v.id);
    const warnings: string[] = [];
    if (v.status !== "Available") warnings.push(`marked "${statusMeta[v.status].label}"`);
    if (quoteStatus) warnings.push(`has a quote with status "${quoteStatusLabel[quoteStatus]}"`);
    const warn = warnings.length ? ` This flat is ${warnings.join(" and ")}.` : "";
    if (!confirm(`Delete flat ${v.block}-${v.flatNo}?${warn}`)) return;
    setBusyId(v.id);
    await deleteVacant(v.id);
    refresh();
    setBusyId(null);
  }

  function handleExport() {
    const table = toCsv(rows, [
      { key: "block", label: "Block", value: (v) => v.block },
      { key: "flatNo", label: "Flat No", value: (v) => v.flatNo },
      { key: "extentSft", label: "Extent (Sft)", value: (v) => v.extentSft },
      { key: "facing", label: "Facing", value: (v) => v.facing },
      { key: "bhk", label: "Configuration", value: (v) => configForExtent(v.extentSft) },
      { key: "status", label: "Status", value: (v) => statusMeta[v.status].label },
    ]);
    const asOn = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const listTitle = rows.some((v) => v.status === "Sold") ? "Flat List" : "Vacant List";
    const header = [
      "SNR AVENUES PVT LTD",
      "SNR THE ELITE",
      `${listTitle} as on ${asOn}`,
      `Total: ${rows.length}`,
      "",
    ].join("\r\n");
    downloadCsv(`SNR_Flats_${new Date().toISOString().slice(0, 10)}.csv`, `${header}\r\n${table}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Flats
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Flat inventory available to select when creating a quote
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-56">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search block, flat, facing…"
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
          <Button onClick={openAddModal}>
            <Plus size={16} /> Add Vacant
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6 grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
          <MultiSelectFilter
            label="Block"
            options={blocks.map((b) => ({ value: b, label: `Block ${b}` }))}
            selected={filters.block}
            onChange={(next) => setFilters((f) => ({ ...f, block: next }))}
          />
          <MultiSelectFilter
            label="Facing"
            options={FACING_OPTIONS.map((f) => ({ value: f, label: f }))}
            selected={filters.facing}
            onChange={(next) => setFilters((f) => ({ ...f, facing: next }))}
          />
          <MultiSelectFilter
            label="Configuration"
            options={[
              { value: "2 BHK", label: "2 BHK" },
              { value: "3 BHK", label: "3 BHK" },
            ]}
            selected={filters.bhk}
            onChange={(next) => setFilters((f) => ({ ...f, bhk: next }))}
          />
          <MultiSelectFilter
            label="Status"
            options={VACANT_STATUS_OPTIONS.map((s) => ({ value: s, label: statusMeta[s].label }))}
            selected={filters.status}
            onChange={(next) => setFilters((f) => ({ ...f, status: next }))}
          />
          <MultiSelectFilter
            label="Corner"
            options={[
              { value: "true", label: "Corner Only" },
              { value: "false", label: "Non-Corner Only" },
            ]}
            selected={filters.corner}
            onChange={(next) => setFilters((f) => ({ ...f, corner: next }))}
          />
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="col-span-2 text-left text-[13px] font-medium text-navy underline decoration-dotted underline-offset-2 hover:text-navy-600 sm:col-span-3 lg:col-span-5"
            >
              Clear all filters
            </button>
          )}
        </Card>
      )}

      {/* Stat chips */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {isFiltered ? "Filtered Flats" : "Total Flats"}
          </p>
          <p className="mt-1 text-2xl font-bold text-navy">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {statusMeta.Available.label}
            {isFiltered ? " (Filtered)" : ""}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.available}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Reserved{isFiltered ? " (Filtered)" : ""}
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.reserved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Mortgaged{isFiltered ? " (Filtered)" : ""}
          </p>
          <p className="mt-1 text-2xl font-bold text-violet-600">{stats.mortgaged}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Sold{isFiltered ? " (Filtered)" : ""}
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.sold}</p>
        </Card>
      </div>

      {!vacants && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-24 text-slate-400">
          <Loader2 size={18} className="animate-spin" /> Loading flats…
        </div>
      )}

      {vacants && vacants.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-navy">
            <Building2 size={26} />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-navy">No flats yet</h3>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Add your first vacant flat so it appears when creating quotes.
          </p>
          <Button className="mt-5" onClick={openAddModal}>
            <Plus size={16} /> Add Vacant
          </Button>
        </div>
      )}

      {vacants && vacants.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
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
                  <th className="px-5 py-3">Corner</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  return (
                    <tr
                      key={v.id}
                      className="group border-b border-border last:border-0 transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                            blockColor(v.block),
                          )}
                        >
                          {v.block}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-navy">{v.flatNo}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-600">
                        {v.extentSft} sft
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{v.facing}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {configForExtent(v.extentSft)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="relative inline-flex items-center">
                          <select
                            value={v.status}
                            disabled={statusBusyId === v.id}
                            onChange={(e) =>
                              handleStatusChange(v, e.target.value as VacantStatus)
                            }
                            className={cn(
                              "appearance-none rounded-full py-0.5 pl-6 pr-7 text-[11px] font-semibold outline-none disabled:opacity-60",
                              statusMeta[v.status].className,
                            )}
                          >
                            {VACANT_STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {statusMeta[s].label}
                              </option>
                            ))}
                          </select>
                          <span
                            className={cn(
                              "pointer-events-none absolute left-2.5 h-1.5 w-1.5 rounded-full",
                              statusMeta[v.status].dot,
                            )}
                          />
                          {statusBusyId === v.id && (
                            <Loader2
                              size={12}
                              className="pointer-events-none absolute right-2 animate-spin"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {v.corner ? (
                          <span className="inline-flex items-center rounded-full bg-gold-soft px-2.5 py-0.5 text-[11px] font-semibold text-gold">
                            Corner
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => openEditModal(v)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy"
                            title="Edit flat"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            disabled={busyId === v.id}
                            className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            title="Delete flat"
                          >
                            {busyId === v.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="py-14 text-center text-sm text-slate-400">
              No flats match your search/filters.
            </div>
          )}
        </div>
      )}

      <AddVacantModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={refresh}
        vacant={editingVacant}
      />
    </div>
  );
}
