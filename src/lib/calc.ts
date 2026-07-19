import type { Quote, QuoteInput } from "./types";

/** Format a number using the Indian numbering system, e.g. 12888000 -> "1,28,88,000". */
export function formatINR(n: number): string {
  const rounded = Math.round(n || 0);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    rounded,
  );
}

/** Format as "Rs.1,28,88,000/-" to match the estimate letter. */
export function rupees(n: number): string {
  return `Rs.${formatINR(n)}/-`;
}

/** Floor number from a flat number (last two digits are the unit, the rest is the floor). */
export function floorFromFlatNo(flatNo: string): number {
  const n = Number(flatNo);
  if (!n) return 0;
  return Math.floor(n / 100);
}

/** Rs.25/sft from the 5th floor, +Rs.25/sft for every floor above that. 4th floor and below: 0. */
export function floorRiseRateForFloor(floor: number): number {
  return floor >= 5 ? (floor - 4) * 25 : 0;
}

/** Amenities are fixed by configuration, not user-editable. */
export function amenitiesForBhk(bhk: string): number {
  if (bhk === "2 BHK") return 700000;
  return 900000; // 3 BHK and anything else
}

/** Facing charge rate defaults to Rs.100/sft for East, 0 for every other facing. */
export function facingChargeRateForFacing(facing: string): number {
  return facing === "East" ? 100 : 0;
}

/** Corner charge rate defaults to Rs.100/sft for West-facing 1890 sft flats, 0 otherwise. */
export function cornerChargeRateForFlat(facing: string, extentSft: number): number {
  return facing === "West" && extentSft === 1890 ? 100 : 0;
}

/** The agreement amount is always 20% of the flat cost (registration charges excluded). */
export const AGREEMENT_PERCENT = 20;

export interface ComputedQuote {
  floor: number;
  floorRiseRate: number;

  basicCost: number;
  facingCharges: number;
  floorRise: number;
  cornerCharges: number;
  cornerChargeRate: number;
  discountAmount: number;
  flatCost: number;

  maintCharges: number;
  registrationCharges: { label: string; amount: number }[];
  registrationTotal: number;

  agreementAmount: number; // 20% of flat cost, minus booking amount
  grandTotal: number; // flat cost + registration charges
}

export function computeQuote(q: Quote | QuoteInput): ComputedQuote {
  const extent = Number(q.extentSft) || 0;

  const floor = floorFromFlatNo(q.flatNo);
  const floorRiseRate = floorRiseRateForFloor(floor);

  const basicCost = (Number(q.basicRate) || 0) * extent;
  const facingCharges = (Number(q.facingChargeRate) || 0) * extent;
  const floorRise = floorRiseRate * extent;
  const cornerChargeRate = Number(q.cornerChargeRate) || 0;
  const cornerCharges = cornerChargeRate * extent;
  const discountAmount = (Number(q.discountPerSft) || 0) * extent;
  const flatCost =
    basicCost + facingCharges + floorRise + cornerCharges - discountAmount;

  const maintCharges =
    (Number(q.maintRatePerSftMonth) || 0) *
    extent *
    (Number(q.maintMonths) || 0);

  const carParkingLabel = q.bhk === "2 BHK" ? "One Car Parking" : "Two Car Parking";

  const registrationCharges = [
    {
      label: `Amenities (Including ${carParkingLabel})`,
      amount: Number(q.amenities) || 0,
    },
    { label: "Corpus Fund", amount: Number(q.corpusFund) || 0 },
    {
      label: `${q.maintMonths ? Math.round(Number(q.maintMonths) / 12) : 0} Yrs. Adv. Maint. Charges (@Rs.${q.maintRatePerSftMonth}/- per Sft. per Month)`,
      amount: maintCharges,
    },
    { label: "Water Connection Charges", amount: Number(q.waterCharges) || 0 },
    { label: "Legal & Documentation Charges", amount: Number(q.legalCharges) || 0 },
    { label: "Refundable Caution Deposit", amount: Number(q.cautionDeposit) || 0 },
  ].filter((r) => r.amount > 0);

  const registrationTotal = registrationCharges.reduce(
    (s, r) => s + r.amount,
    0,
  );

  const agreementAmount =
    (AGREEMENT_PERCENT / 100) * flatCost - (Number(q.bookingAmount) || 0);

  return {
    floor,
    floorRiseRate,
    basicCost,
    facingCharges,
    floorRise,
    cornerCharges,
    cornerChargeRate,
    discountAmount,
    flatCost,
    maintCharges,
    registrationCharges,
    registrationTotal,
    agreementAmount,
    grandTotal: flatCost + registrationTotal,
  };
}

/** dd.mm.yyyy to match the letter (e.g. 13.07.2026). */
export function formatDateDots(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** Friendly date e.g. 13 Jul 2026 for list/UI. */
export function formatDateNice(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
