"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Building2, Loader2 } from "lucide-react";
import { Field, TextInput, Select, Button, Switch } from "./ui";
import {
  addVacant,
  updateVacant,
  configForExtent,
  FACING_OPTIONS,
  type VacantPlot,
} from "@/lib/vacants";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (vacant: VacantPlot) => void;
  vacant?: VacantPlot | null;
};

const emptyForm = { block: "", flatNo: "", extentSft: "", facing: "", corner: false };

export default function AddVacantModal({ open, onClose, onSaved, vacant }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = !!vacant;

  useEffect(() => {
    if (open) {
      setForm(
        vacant
          ? {
              block: vacant.block,
              flatNo: vacant.flatNo,
              extentSft: String(vacant.extentSft),
              facing: vacant.facing,
              corner: vacant.corner,
            }
          : emptyForm,
      );
      setError(null);
    }
  }, [open, vacant]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const extentNum = Number(form.extentSft) || 0;
  const derivedBhk = configForExtent(extentNum);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.block.trim() || !form.flatNo.trim() || !extentNum || !form.facing) {
      setError("Fill in every field.");
      return;
    }

    setSaving(true);
    try {
      const input = {
        block: form.block,
        flatNo: form.flatNo,
        extentSft: extentNum,
        facing: form.facing,
        corner: form.corner,
      };
      const saved =
        isEdit && vacant ? await updateVacant(vacant.id, input) : await addVacant(input);
      if (!saved) throw new Error("Vacant plot not found.");
      onSaved(saved);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm animate-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-gold">
              <Building2 size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-navy">
                {isEdit ? "Edit Vacant Plot" : "Add Vacant Plot"}
              </h2>
              <p className="text-[12px] text-slate-500">
                {isEdit ? "Update this flat inventory entry" : "New entry in the flat inventory"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Block">
            <TextInput
              value={form.block}
              onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))}
              placeholder="e.g. F"
              maxLength={3}
            />
          </Field>
          <Field label="Flat No">
            <TextInput
              value={form.flatNo}
              onChange={(e) => setForm((f) => ({ ...f, flatNo: e.target.value }))}
              placeholder="e.g. 805"
            />
          </Field>
          <Field label="Extent (Sft)">
            <TextInput
              type="number"
              value={form.extentSft}
              onChange={(e) => setForm((f) => ({ ...f, extentSft: e.target.value }))}
              placeholder="e.g. 1790"
            />
          </Field>
          <Field label="Facing">
            <Select
              value={form.facing}
              onChange={(e) => setForm((f) => ({ ...f, facing: e.target.value }))}
            >
              <option value="">Select…</option>
              {FACING_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5">
          <span className="text-[13px] font-medium text-slate-600">
            Is this a corner unit?
          </span>
          <Switch
            checked={form.corner}
            onChange={(checked) => setForm((f) => ({ ...f, corner: checked }))}
            label={form.corner ? "Yes" : "No"}
          />
        </div>

        {extentNum > 0 && (
          <p className="mt-3 text-[12px] text-slate-500">
            Configuration will be set automatically:{" "}
            <span className="font-semibold text-navy">{derivedBhk}</span>
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Add Plot"}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
