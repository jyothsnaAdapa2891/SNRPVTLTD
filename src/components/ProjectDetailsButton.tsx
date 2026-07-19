"use client";

import { useState } from "react";
import { FolderOutput, Loader2 } from "lucide-react";

const FILE_NAME = "SNR_The_Elite_Project_Details.pdf";

export default function ProjectDetailsButton() {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const res = await fetch("/api/project-details");
      if (!res.ok) throw new Error("Failed to generate project details");
      const blob = await res.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = FILE_NAME;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Couldn't prepare the project details PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title="Download project details (rate card, brochure, site visuals)"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <FolderOutput size={16} />}
      <span className="hidden sm:inline">{busy ? "Preparing…" : "Project Details"}</span>
    </button>
  );
}
