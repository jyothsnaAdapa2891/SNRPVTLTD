import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Quote } from "@/lib/types";
import { computeQuote, rupees, formatDateDots, AGREEMENT_PERCENT } from "@/lib/calc";

const NAVY = "#10233f";
const GOLD = "#c6952f";
const MUTED = "#64748b";

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 46,
    paddingVertical: 44,
    fontSize: 10.5,
    color: "#1f2937",
    lineHeight: 1.45,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 12,
    marginBottom: 18,
    textAlign: "center",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 3,
    color: GOLD,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 3,
  },
  subtitle: { fontSize: 9, color: MUTED, marginTop: 4 },
  metaRow: { fontSize: 9, color: MUTED, marginTop: 5 },
  para: { marginBottom: 6 },
  detailBox: {
    backgroundColor: "#f4f6fa",
    borderRadius: 6,
    padding: 12,
    marginTop: 6,
    marginBottom: 14,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detail: { width: "33%", marginBottom: 6 },
  detailK: {
    fontSize: 7.5,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailV: { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
  },
  rowLabel: { flex: 1, paddingRight: 12 },
  rowVal: { fontFamily: "Helvetica-Bold" },
  strongRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: NAVY,
    paddingVertical: 5,
    marginVertical: 5,
  },
  strongText: { fontFamily: "Helvetica-Bold", color: NAVY, fontSize: 11.5 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 3,
  },
  terms: {
    borderWidth: 1,
    borderColor: "#f3e6c8",
    backgroundColor: "#fdf8ee",
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  muted: { color: MUTED },
  sign: { marginTop: 26 },
  signName: { fontFamily: "Helvetica-Bold", color: NAVY, fontSize: 11 },
  signTitle: {
    fontSize: 8.5,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});

export default function QuoteDocument({ quote }: { quote: Quote }) {
  const c = computeQuote(quote);
  const guestName = `${quote.firstName} ${quote.lastName}`.trim();
  return (
    <Document
      title={`SNR Avenues Pvt Ltd - ${quote.quoteNumber}`}
      author="SNR Avenues Pvt Ltd"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.eyebrow}>QUOTATION</Text>
          <Text style={s.title}>SNR AVENUES PVT LTD</Text>
          <Text style={s.subtitle}>Warm Greetings from SNR Group</Text>
          <Text style={s.metaRow}>
            {quote.city}   •   DATE: {formatDateDots(quote.date)}
          </Text>
        </View>

        <Text style={s.para}>Dear {guestName || "Prospective Buyer"},</Text>
        <Text style={[s.para, s.muted]}>
          Thank you very much for your interest to purchase a Flat in our
          Premium gated community project “{quote.projectName}”. As per your
          request, we are herewith sharing the details of the Flat chosen by
          you.
        </Text>

        <View style={s.detailBox}>
          <Detail k="Flat No" v={quote.flatNo} />
          <Detail k="Extent" v={`${quote.extentSft} Sft, ${quote.bhk}`} />
          <Detail k="Block" v={quote.block} />
          <Detail k="Facing" v={quote.facing} />
          <Detail k="Option" v={quote.paymentOption} />
        </View>

        <Row
          label={`Basic Cost  (@ Rs.${quote.basicRate}/- per Sft.) x ${quote.extentSft}`}
          value={rupees(c.basicCost)}
        />
        {quote.facingChargeRate > 0 && (
          <Row
            label={`${quote.facing} Face Charges  (@ Rs.${quote.facingChargeRate}/- per Sft)`}
            value={rupees(c.facingCharges)}
          />
        )}
        {c.floorRise > 0 && (
          <Row
            label={`Floor Rise  (Floor ${c.floor} @ Rs.${c.floorRiseRate}/- per Sft)`}
            value={rupees(c.floorRise)}
          />
        )}
        {c.cornerCharges > 0 && (
          <Row
            label={`Corner Charges  (@ Rs.${c.cornerChargeRate}/- per Sft)`}
            value={rupees(c.cornerCharges)}
          />
        )}
        {quote.discountPerSft > 0 && (
          <Row
            label={`Discount  (@ Rs.${quote.discountPerSft}/- per Sft)`}
            value={`- ${rupees(c.discountAmount)}`}
            positive
          />
        )}
        <View style={s.strongRow}>
          <Text style={[s.rowLabel, s.strongText]}>FLAT COST</Text>
          <Text style={s.strongText}>{rupees(c.flatCost)}</Text>
        </View>

        {c.registrationCharges.length > 0 && (
          <>
            <Text style={s.sectionTitle}>
              Payable at the time of Registration
            </Text>
            {c.registrationCharges.map((r) => (
              <Row key={r.label} label={r.label} value={rupees(r.amount)} />
            ))}
          </>
        )}

        <View style={s.terms}>
          <Text style={s.para}>
            <Text style={s.rowVal}>Booking Amount</Text>{" "}
            {rupees(quote.bookingAmount)}
          </Text>
          <Text style={s.para}>
            Agreement Amount ({AGREEMENT_PERCENT}% of Flat Cost) i.e{" "}
            <Text style={s.rowVal}>{rupees(c.agreementAmount)}</Text> to be made
            within a month from the date of Booking of Flat.
          </Text>
          <Text style={s.para}>
            Balance {100 - AGREEMENT_PERCENT}% payment to be made as per Loan
            / progress of construction.
          </Text>
          <Text style={[s.muted, { fontSize: 8.5, fontStyle: "italic" }]}>
            * GST + Registration Charges As Applicable.
          </Text>
        </View>

        {quote.notes ? (
          <Text style={[s.muted, { marginTop: 8, fontStyle: "italic" }]}>
            {quote.notes}
          </Text>
        ) : null}

        <View style={s.sign}>
          <Text>WITH REGARDS,</Text>
          <Text style={[s.signName, { marginTop: 18 }]}>
            ({quote.signatoryName})
          </Text>
          <Text style={s.signTitle}>{quote.signatoryTitle}</Text>
        </View>
      </Page>
    </Document>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.detail}>
      <Text style={s.detailK}>{k}</Text>
      <Text style={s.detailV}>{v || "-"}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={positive ? [s.rowVal, { color: "#059669" }] : s.rowVal}>
        {value}
      </Text>
    </View>
  );
}
