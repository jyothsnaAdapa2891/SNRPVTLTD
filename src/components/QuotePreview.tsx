import type { Quote } from "@/lib/types";
import { computeQuote, rupees, formatDateDots, AGREEMENT_PERCENT } from "@/lib/calc";

/** On-screen A4 rendition of the SNR estimate letter (matches the PDF). */
export default function QuotePreview({ quote }: { quote: Quote }) {
  const c = computeQuote(quote);
  const guestName = `${quote.firstName} ${quote.lastName}`.trim();

  const Row = ({
    label,
    value,
    strong,
    tone,
  }: {
    label: React.ReactNode;
    value: string;
    strong?: boolean;
    tone?: "positive";
  }) => (
    <div
      className={`flex items-baseline justify-between gap-4 py-[3px] ${
        strong ? "border-y border-navy/30 my-1 font-bold text-navy" : ""
      }`}
    >
      <span className="text-[13.5px] leading-snug">{label}</span>
      <span
        className={`shrink-0 text-[13.5px] tabular-nums ${strong ? "font-bold" : "font-semibold"} ${tone === "positive" ? "text-emerald-600" : ""}`}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      className="print-sheet mx-auto w-full max-w-[820px] bg-white px-8 py-10 text-slate-800 shadow-sm sm:px-14 sm:py-14"
      style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      {/* Letterhead */}
      <div className="mb-8 border-b-2 border-gold pb-5 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">
          Quotation
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy">
          SNR AVENUES PVT LTD
        </h1>
        <p className="mt-1 text-[12px] font-medium text-slate-400">
          Warm Greetings from SNR Group
        </p>
        <div className="mt-2 flex items-center justify-center gap-3 text-[12px] font-medium text-slate-500">
          <span>{quote.city}</span>
          <span className="text-gold">•</span>
          <span>DATE: {formatDateDots(quote.date)}</span>
        </div>
      </div>

      {/* Greeting */}
      <p className="text-[13.5px] leading-relaxed">
        Dear {guestName || "Prospective Buyer"},
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
        Thank you very much for your interest to purchase a Flat in our Premium
        gated community project{" "}
        <span className="font-semibold text-navy">
          “{quote.projectName}”
        </span>
        . As per your request, we are herewith sharing the details of the Flat
        chosen by you.
      </p>

      {/* Flat details */}
      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-1.5 rounded-xl bg-slate-50 p-5 text-[13.5px] sm:grid-cols-3">
        <Detail k="Flat No" v={quote.flatNo} />
        <Detail k="Extent" v={`${quote.extentSft} Sft, ${quote.bhk}`} />
        <Detail k="Block" v={quote.block} />
        <Detail k="Facing" v={quote.facing} />
        <Detail k="Option" v={quote.paymentOption} />
      </div>

      {/* Cost breakdown */}
      <div className="mt-7">
        <Row
          label={
            <>
              Basic Cost{" "}
              <span className="text-slate-400">
                (@ {rupees(quote.basicRate).replace("/-", "/-")} per Sft.) ×{" "}
                {quote.extentSft}
              </span>
            </>
          }
          value={rupees(c.basicCost)}
        />
        {quote.facingChargeRate > 0 && (
          <Row
            label={
              <>
                {quote.facing} Face Charges{" "}
                <span className="text-slate-400">
                  (@ Rs.{quote.facingChargeRate}/- per Sft)
                </span>
              </>
            }
            value={rupees(c.facingCharges)}
          />
        )}
        {c.floorRise > 0 && (
          <Row
            label={
              <>
                Floor Rise{" "}
                <span className="text-slate-400">
                  (Floor {c.floor} · @ Rs.{c.floorRiseRate}/- per Sft)
                </span>
              </>
            }
            value={rupees(c.floorRise)}
          />
        )}
        {c.cornerCharges > 0 && (
          <Row
            label={
              <>
                Corner Charges{" "}
                <span className="text-slate-400">
                  (@ Rs.{c.cornerChargeRate}/- per Sft)
                </span>
              </>
            }
            value={rupees(c.cornerCharges)}
          />
        )}
        {quote.discountPerSft > 0 && (
          <Row
            label={
              <>
                Discount{" "}
                <span className="text-slate-400">
                  (@ Rs.{quote.discountPerSft}/- per Sft)
                </span>
              </>
            }
            value={`− ${rupees(c.discountAmount)}`}
            tone="positive"
          />
        )}
        <Row label="FLAT COST" value={rupees(c.flatCost)} strong />
      </div>

      {/* Registration charges */}
      {c.registrationCharges.length > 0 && (
        <div className="mt-6">
          <div className="mb-1 text-[12px] font-bold uppercase tracking-wide text-navy">
            Payable at the time of Registration
          </div>
          {c.registrationCharges.map((r) => (
            <Row key={r.label} label={r.label} value={rupees(r.amount)} />
          ))}
        </div>
      )}

      {/* Payment terms */}
      <div className="mt-6 space-y-1.5 rounded-xl border border-gold-soft bg-gold-soft/30 p-5 text-[13px] leading-relaxed">
        <p>
          <b>Booking Amount</b> {rupees(quote.bookingAmount)}
        </p>
        <p>
          Agreement Amount ({AGREEMENT_PERCENT}% of Flat Cost) i.e{" "}
          <b>{rupees(c.agreementAmount)}</b> to be made within a month from the
          date of Booking of Flat.
        </p>
        <p>
          Balance {100 - AGREEMENT_PERCENT}% payment to be made as per
          Loan / progress of construction.
        </p>
        <p className="pt-1 text-[12px] italic text-slate-500">
          * GST + Registration Charges As Applicable.
        </p>
      </div>

      {quote.notes && (
        <p className="mt-4 whitespace-pre-wrap text-[12.5px] italic text-slate-500">
          {quote.notes}
        </p>
      )}

      {/* Signature */}
      <div className="mt-10">
        <p className="text-[13.5px]">WITH REGARDS,</p>
        <p className="mt-6 text-[14px] font-bold text-navy">
          ({quote.signatoryName})
        </p>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-gold">
          {quote.signatoryTitle}
        </p>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {k}
      </span>
      <span className="font-semibold text-navy">{v || "—"}</span>
    </div>
  );
}
