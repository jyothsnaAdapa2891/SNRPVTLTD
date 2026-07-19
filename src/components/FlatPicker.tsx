"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { Field, Select, cn } from "./ui";
import {
  getBlocks,
  flatsInBlock,
  configForExtent,
  flatIdOf,
  type VacantPlot,
  type VacantStatus,
} from "@/lib/vacants";
import { facingChargeRateForFacing, cornerChargeRateForFlat } from "@/lib/calc";

const badgeStyles: Record<Exclude<VacantStatus, "Available">, string> = {
  Reserved: "bg-amber-50 text-amber-700",
  Mortgaged: "bg-violet-50 text-violet-700",
  Sold: "bg-red-50 text-red-700",
};

function MiniBadge({ status }: { status: VacantStatus }) {
  if (status === "Available") return null;
  return (
    <span
      className={cn(
        "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        badgeStyles[status],
      )}
    >
      {status}
    </span>
  );
}

type Props = {
  block: string;
  flatNo: string;
  extentSft: number;
  facing: string;
  bhk: string;
  excludeQuoteId?: string;
  onChange: (patch: {
    block: string;
    flatNo: string;
    extentSft: number;
    facing: string;
    bhk: string;
    facingChargeRate: number;
    cornerChargeRate: number;
  }) => void;
};

export default function FlatPicker({
  block,
  flatNo,
  extentSft,
  facing,
  bhk,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [flatsForBlock, setFlatsForBlock] = useState<VacantPlot[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  function refreshBlocks() {
    getBlocks().then(setBlocks);
  }

  useEffect(() => {
    refreshBlocks();
  }, []);

  useEffect(() => {
    if (block) flatsInBlock(block).then(setFlatsForBlock);
    else setFlatsForBlock([]);
  }, [block]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Every status except Sold can still be picked for a new quote.
  const selectableFlats = flatsForBlock.filter((f) => f.status !== "Sold");

  function selectBlock(newBlock: string) {
    // Changing block clears the flat/extent/facing/bhk since they belong to the old block.
    onChange({
      block: newBlock,
      flatNo: "",
      extentSft: 0,
      facing: "",
      bhk: "",
      facingChargeRate: 0,
      cornerChargeRate: 0,
    });
  }

  function selectFlat(f: { flatNo: string; extentSft: number; facing: string }) {
    onChange({
      block,
      flatNo: f.flatNo,
      extentSft: f.extentSft,
      facing: f.facing,
      bhk: configForExtent(f.extentSft),
      facingChargeRate: facingChargeRateForFacing(f.facing),
      cornerChargeRate: cornerChargeRateForFlat(f.facing, f.extentSft),
    });
    setOpen(false);
  }

  const currentFlatId = block && flatNo ? flatIdOf(block, flatNo) : undefined;
  const currentStatus = currentFlatId
    ? flatsForBlock.find((f) => f.id === currentFlatId)?.status
    : undefined;

  return (
    <>
      <Field label="Block">
        <Select value={block} onChange={(e) => selectBlock(e.target.value)}>
          <option value="">Select block…</option>
          {blocks.map((b) => (
            <option key={b} value={b}>
              Block {b}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Flat No">
        <div ref={rootRef} className="relative">
          <button
            type="button"
            disabled={!block}
            onClick={() => {
              refreshBlocks();
              setOpen((o) => !o);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-left text-sm shadow-sm outline-none transition-colors",
              !block
                ? "cursor-not-allowed bg-slate-50 text-slate-400"
                : "cursor-pointer hover:border-navy-500/50 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15",
            )}
          >
            <span className="flex items-center">
              {flatNo || (block ? "Select flat…" : "Select a block first")}
              {currentStatus && <MiniBadge status={currentStatus} />}
            </span>
            <ChevronDown size={15} className="text-slate-400" />
          </button>

          {open && block && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg">
              {selectableFlats.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">
                  No vacant flats left in this block.
                </p>
              )}
              {selectableFlats.map((f) => (
                <button
                  key={f.flatNo}
                  type="button"
                  onClick={() => selectFlat(f)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50",
                    f.flatNo === flatNo && "bg-navy/5",
                  )}
                >
                  <span className="flex items-center font-medium text-slate-700">
                    {f.flatNo}
                    <MiniBadge status={f.status} />
                  </span>
                  <span className="text-xs text-slate-400">
                    {f.extentSft} sft · {f.facing}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>

      <Field label="Extent (Sft)">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Lock size={13} className="shrink-0 text-slate-400" />
          {extentSft || "—"}
        </div>
      </Field>

      <Field label="Facing">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Lock size={13} className="shrink-0 text-slate-400" />
          {facing || "—"}
        </div>
      </Field>

      <Field label="Configuration">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Lock size={13} className="shrink-0 text-slate-400" />
          {bhk || "—"}
        </div>
      </Field>
    </>
  );
}
