/**
 * Vacant plot inventory. Backed by the /api/vacants routes (MongoDB on the
 * server). Every function here is async and simply talks to that API — no
 * data lives in the browser.
 */

export interface VacantPlot {
  id: string;
  block: string;
  flatNo: string;
  extentSft: number;
  facing: string;
  corner: boolean;
  createdAt: string;
}

export type VacantInput = Omit<VacantPlot, "id" | "createdAt">;

/** Shape a document takes coming back from (or going into) the database. */
export interface VacantDbDoc {
  _id: string; // "{block}-{flatNo}", e.g. "F-805"
  block: string;
  flatNo: string;
  extentSft: number;
  facing: string;
  corner: boolean;
  createdAt: string;
}

export const FACING_OPTIONS = [
  "East",
  "West",
  "North",
  "South",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];

/** DB doc -> the shape every UI component in this app renders. */
export function normalizeVacantDoc(doc: VacantDbDoc): VacantPlot {
  return {
    id: doc._id,
    block: doc.block,
    flatNo: doc.flatNo,
    extentSft: doc.extentSft,
    facing: doc.facing,
    corner: !!doc.corner,
    createdAt: doc.createdAt,
  };
}

/** The shared join key between a vacant plot's `_id`/`id` and a quote's `flatId`. */
export function flatIdOf(block: string, flatNo: string): string {
  return `${block}-${flatNo}`;
}

async function asJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export async function getAllVacants(): Promise<VacantPlot[]> {
  const res = await fetch("/api/vacants");
  const docs = await asJson<VacantDbDoc[]>(res);
  return docs
    .map(normalizeVacantDoc)
    .sort((a, b) =>
      a.block === b.block
        ? a.flatNo.localeCompare(b.flatNo, undefined, { numeric: true })
        : a.block.localeCompare(b.block),
    );
}

export async function addVacant(input: VacantInput): Promise<VacantPlot> {
  const res = await fetch("/api/vacants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const doc = await asJson<VacantDbDoc>(res);
  return normalizeVacantDoc(doc);
}

export async function updateVacant(id: string, input: VacantInput): Promise<VacantPlot> {
  const res = await fetch(`/api/vacants/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const doc = await asJson<VacantDbDoc>(res);
  return normalizeVacantDoc(doc);
}

export async function deleteVacant(id: string): Promise<void> {
  const res = await fetch(`/api/vacants/${encodeURIComponent(id)}`, { method: "DELETE" });
  await asJson<{ ok: true }>(res);
}

export async function getBlocks(): Promise<string[]> {
  const vacants = await getAllVacants();
  return Array.from(new Set(vacants.map((v) => v.block))).sort();
}

export async function flatsInBlock(block: string): Promise<VacantPlot[]> {
  const vacants = await getAllVacants();
  return vacants.filter((v) => v.block === block);
}

/** Configuration is derived from a flat's extent, not chosen freely. */
export function configForExtent(extentSft: number): string {
  if (!extentSft) return "";
  return extentSft > 1290 ? "3 BHK" : "2 BHK";
}
