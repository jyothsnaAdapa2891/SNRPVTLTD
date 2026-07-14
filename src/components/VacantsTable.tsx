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
} from "lucide-react";
import { Button, Card, cn } from "./ui";
import AddVacantModal from "./AddVacantModal";
import {
  getAllVacants,
  deleteVacant,
  configForExtent,
  type VacantPlot,
} from "@/lib/vacants";
import { getFlatStatusMap } from "@/lib/store";
import type { QuoteStatus } from "@/lib/types";

type SortKey = "block" | "flatNo" | "extentSft" | "facing" | "bhk" | "status";
type RowStatus = QuoteStatus | "Available";

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "block", label: "Block" },
  { key: "flatNo", label: "Flat No" },
  { key: "extentSft", label: "Extent", align: "right" },
  { key: "facing", label: "Facing" },
  { key: "bhk", label: "Configuration" },
  { key: "status", label: "Status" },
];

const statusMeta: Record<RowStatus, { label: string; className: string }> = {
  Available: { label: "Available", className: "bg-emerald-50 text-emerald-700" },
  Draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  Accepted: { label: "Sold", className: "bg-red-50 text-red-700" },
  Rejected: { label: "Rejected", className: "bg-amber-50 text-amber-700" },
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

export default function VacantsTable() {
  const [vacants, setVacants] = useState<VacantPlot[] | null>(null);
  const [statusMap, setStatusMap] = useState<Map<string, QuoteStatus>>(new Map());
  const [query, setQuery] = useState("");
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
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sort.key === "bhk") {
        av = configForExtent(a.extentSft);
        bv = configForExtent(b.extentSft);
      } else if (sort.key === "status") {
        av = statusOf(a);
        bv = statusOf(b);
      } else {
        av = a[sort.key];
        bv = b[sort.key];
      }
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacants, query, sort, statusMap]);

  const stats = useMemo(() => {
    if (!vacants) return { total: 0, available: 0, sold: 0 };
    let available = 0;
    let sold = 0;
    for (const v of vacants) {
      const s = statusOf(v);
      if (s === "Available" || s === "Draft" || s === "Rejected") available++;
      if (s === "Accepted") sold++;
    }
    return { total: vacants.length, available, sold };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacants, statusMap]);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Vacant Plots
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Flat inventory available to select when creating a quote
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
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
          <Button onClick={openAddModal}>
            <Plus size={16} /> Add Vacant
          </Button>
        </div>
      </div>

      {/* Stat chips */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Total Plots
          </p>
          <p className="mt-1 text-2xl font-bold text-navy">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Available
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.available}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Sold
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
                  const status = statusOf(v);
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
                            statusMeta[status].className,
                          )}
                        >
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {statusMeta[status].label}
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
              No vacant plots match “{query}”.
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
