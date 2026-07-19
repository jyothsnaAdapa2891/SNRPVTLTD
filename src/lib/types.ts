export type QuoteStatus = "Draft" | "Accepted" | "Rejected";

export interface Quote {
  _id?: string;
  quoteNumber: string; // e.g. SNR-0001
  status: QuoteStatus;
  date: string; // ISO date (yyyy-mm-dd)
  city: string; // Gopanapalli, Hyderabad
  projectName: string; // SNR THE ELITE

  // Guest details
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;

  // Flat details
  flatId?: string; // "{block}-{flatNo}", links to the vacant plot's _id
  flatNo: string;
  extentSft: number;
  bhk: string; // "3 BHK"
  block: string;
  facing: string; // East / West / North / South
  paymentOption: string; // Loan / Outright

  // Cost rates
  basicRate: number; // per sft
  facingChargeRate: number; // per sft — defaults to 100 for East, 0 otherwise
  cornerChargeRate: number; // per sft — defaults to 100 for West + 1890 sft, 0 otherwise
  discountPerSft: number; // per sft (0 = no discount, hidden on the printed quote)

  // Registration-time charges (fixed, not user-editable)
  amenities: number; // derived from bhk: 900000 (3 BHK) / 700000 (2 BHK)
  corpusFund: number; // fixed 100000
  maintRatePerSftMonth: number; // fixed 3
  maintMonths: number; // fixed 24
  waterCharges: number; // fixed 75000
  legalCharges: number; // fixed 20000
  cautionDeposit: number; // fixed 25000

  // Payment terms
  bookingAmount: number;

  // Signatory (fixed, printed directly — not editable in the form)
  signatoryName: string;
  signatoryTitle: string;

  notes?: string;

  createdAt?: string;
  updatedAt?: string;
}

export type QuoteInput = Omit<
  Quote,
  "_id" | "quoteNumber" | "createdAt" | "updatedAt"
> & { quoteNumber?: string };

export const emptyQuote: QuoteInput = {
  status: "Draft",
  date: new Date().toISOString().slice(0, 10),
  city: "Gopanapalli, Hyderabad",
  projectName: "SNR THE ELITE",

  firstName: "",
  lastName: "",
  phone: "",
  address: "",

  flatId: "",
  flatNo: "",
  extentSft: 0,
  bhk: "",
  block: "",
  facing: "",
  paymentOption: "Loan",

  basicRate: 7499,
  facingChargeRate: 0,
  cornerChargeRate: 0,
  discountPerSft: 0,

  amenities: 900000,
  corpusFund: 100000,
  maintRatePerSftMonth: 3,
  maintMonths: 24,
  waterCharges: 75000,
  legalCharges: 20000,
  cautionDeposit: 25000,

  bookingAmount: 500000,

  signatoryName: "ASRK REDDY",
  signatoryTitle: "EXECUTIVE DIRECTOR",

  notes: "",
};
