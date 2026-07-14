export interface CsvColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string | number;
}

function escapeCsvCell(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(c.value(row))).join(","),
  );
  return [header, ...lines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  // Prefix with a BOM so Excel opens UTF-8 (₹ etc.) correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
