"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { Button, Card, Select, cn } from "./ui";
import AddVacantModal from "./AddVacantModal";
import { toCsv, downloadCsv } from "@/lib/csv";
import {
  getAllVacants,
  deleteVacant,
  configForExtent,
  FACING_OPTIONS,
  type VacantPlot,
} from "@/lib/vacants";
import { getFlatStatusMap } from "@/lib/store";
import type { QuoteStatus } from "@/lib/types";

type SortKey = "block" | "flatNo" | "extentSft" | "facing" | "bhk" | "status";
type RowStatus = QuoteStatus | "Available";
type DisplayStatus = "Available" | "Sold";

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "block", label: "Block" },
  { key: "flatNo", label: "Flat No" },
  { key: "extentSft", label: "Extent", align: "right" },
  { key: "facing", label: "Facing" },
  { key: "bhk", label: "Configuration" },
  { key: "status", label: "Status" },
];

// Full detail, used only for the delete-confirmation message.
const statusMeta: Record<RowStatus, { label: string; className: string }> = {
  Available: { label: "Available", className: "bg-emerald-50 text-emerald-700" },
  Draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  Accepted: { label: "Sold", className: "bg-red-50 text-red-700" },
  Rejected: { label: "Rejected", className: "bg-amber-50 text-amber-700" },
};

// What's actually shown in the table/filters/export: Draft & Rejected both
// just mean "not sold yet", so they're folded into Available.
const displayStatusMeta: Record<DisplayStatus, { label: string; className: string }> = {
  Available: { label: "Available", className: "bg-emerald-50 text-emerald-700" },
  Sold: { label: "Sold", className: "bg-red-50 text-red-700" },
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

const emptyFilters = { block: "", facing: "", bhk: "", status: "", corner: "" };

export default function VacantsTable() {
  const [vacants, setVacants] = useState<VacantPlot[] | null>(null);
  const [statusMap, setStatusMap] = useState<Map<string, QuoteStatus>>(new Map());
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVacant, setEditingVacant] = useState<VacantPlot | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
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

  function statusOf(v: VacantPlot): RowStatus {
    return statusMap.get(v.id) ?? "Available";
  }

  function displayStatusOf(v: VacantPlot): DisplayStatus {
    return statusOf(v) === "Accepted" ? "Sold" : "Available";
  }

  const blocks = useMemo(
    () => Array.from(new Set((vacants ?? []).map((v) => v.block))).sort(),
    [vacants],
  );

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
    if (filters.block) list = list.filter((v) => v.block === filters.block);
    if (filters.facing) list = list.filter((v) => v.facing === filters.facing);
    if (filters.bhk) list = list.filter((v) => configForExtent(v.extentSft) === filters.bhk);
    if (filters.corner) list = list.filter((v) => String(v.corner) === filters.corner);
    if (filters.status) list = list.filter((v) => displayStatusOf(v) === filters.status);

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sort.key === "bhk") {
        av = configForExtent(a.extentSft);
        bv = configForExtent(b.extentSft);
      } else if (sort.key === "status") {
        av = displayStatusOf(a);
        bv = displayStatusOf(b);
      } else {
        av = a[sort.key];
        bv = b[sort.key];
      }
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacants, query, filters, sort, statusMap]);

  const isFiltered = query.trim() !== "" || activeFilterCount > 0;

  const stats = useMemo(() => {
    let available = 0;
    let sold = 0;
    for (const v of rows) {
      if (displayStatusOf(v) === "Sold") sold++;
      else available++;
    }
    return { total: rows.length, available, sold };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, statusMap]);

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
    const status = statusOf(v);
    const warn =
      status !== "Available"
        ? ` This flat currently has a quote with status "${statusMeta[status].label}".`
        : "";
    if (!confirm(`Delete vacant plot ${v.block}-${v.flatNo}?${warn}`)) return;
    setBusyId(v.id);
    await deleteVacant(v.id);
    refresh();
    setBusyId(null);
  }

  function handleExport() {
    const csv = toCsv(rows, [
      { key: "block", label: "Block", value: (v) => v.block },
      { key: "flatNo", label: "Flat No", value: (v) => v.flatNo },
      { key: "extentSft", label: "Extent (Sft)", value: (v) => v.extentSft },
      { key: "facing", label: "Facing", value: (v) => v.facing },
      { key: "bhk", label: "Configuration", value: (v) => configForExtent(v.extentSft) },
      { key: "status", label: "Status", value: (v) => displayStatusOf(v) },
      { key: "corner", label: "Corner", value: (v) => (v.corner ? "Yes" : "No") },
    ]);
    downloadCsv(`SNR_Vacant_Plots_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Plots
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
            value={filters.facing}
            onChange={(e) => setFilters((f) => ({ ...f, facing: e.target.value }))}
          >
            <option value="">All Facings</option>
            {FACING_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
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
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
          </Select>
          <Select
            value={filters.corner}
            onChange={(e) => setFilters((f) => ({ ...f, corner: e.target.value }))}
          >
            <option value="">Corner: Any</option>
            <option value="true">Corner Only</option>
            <option value="false">Non-Corner Only</option>
          </Select>
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
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {isFiltered ? "Filtered Plots" : "Total Plots"}
          </p>
          <p className="mt-1 text-2xl font-bold text-navy">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Available{isFiltered ? " (Filtered)" : ""}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.available}</p>
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
          <Loader2 size={18} className="animate-spin" /> Loading vacant plots…
        </div>
      )}

      {vacants && vacants.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-navy">
            <Building2 size={26} />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-navy">No vacant plots yet</h3>
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
                  const status = displayStatusOf(v);
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
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            displayStatusMeta[status].className,
                          )}
                        >
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {displayStatusMeta[status].label}
                        </span>
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
                            title="Edit vacant plot"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            disabled={busyId === v.id}
                            className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            title="Delete vacant plot"
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
              No vacant plots match your search/filters.
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
