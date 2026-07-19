import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const NAVY = "#10233f";
const GOLD = "#c6952f";
const MUTED = "#64748b";

const KEY_TERMS: { label: string; value: string }[] = [
  { label: "Rate Per Sq. Ft.", value: "Rs. 7,499/-" },
  { label: "Booking Amount", value: "Rs. 5,00,000/-" },
  { label: "Within 1 Month", value: "20% of total cost (including booking amount)" },
  { label: "Balance 80%", value: "As per loan / progress of construction" },
];

const AMENITIES: { label: string; value: string }[] = [
  { label: "2 BHK", value: "Rs. 7,00,000/- (including one car parking)" },
  { label: "3 BHK", value: "Rs. 9,00,000/- (including two car parking)" },
];

const NOTES: string[] = [
  "Rs. 100/- per Sft. extra for East facing flats.",
  "Rs. 100/- per Sft. extra for corner flats.",
  "Rs. 25/- per Sft. extra towards floor-rise charges from 5th floor onwards.",
  "Rs. 1,00,000/- per flat towards Corpus Fund.",
  "Rs. 72/- per Sft. towards advance maintenance charges for 2 years.",
  "Rs. 75,000/- towards Manjeera water connection charges.",
  "Rs. 20,000/- towards Legal & Documentation charges.",
  "Rs. 25,000/- towards Refundable caution Deposit.",
  "Registration charges + GST are extra.",
];

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 52,
    paddingTop: 56,
    paddingBottom: 56,
    fontSize: 10.5,
    color: "#1f2937",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 14,
    marginBottom: 26,
    textAlign: "center",
  },
  body: {
    flexGrow: 1,
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 3.5,
    color: GOLD,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 5,
  },
  subtitle: { fontSize: 9.5, color: MUTED, marginTop: 5 },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e9f0",
    borderRadius: 8,
    marginBottom: 22,
  },
  cardRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e9f0",
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  cardRowLast: { borderBottomWidth: 0 },
  cardLabel: {
    width: "42%",
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    fontSize: 10,
  },
  cardValue: { width: "58%", fontSize: 10 },
  disclaimer: {
    fontSize: 8.5,
    color: "#b45309",
    fontFamily: "Helvetica-Bold",
    marginTop: -10,
    marginBottom: 22,
  },
  amenityBox: {
    backgroundColor: "#fdf8ee",
    borderWidth: 1,
    borderColor: "#f3e6c8",
    borderRadius: 8,
    padding: 14,
    marginBottom: 22,
  },
  amenityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  amenityLabel: { fontFamily: "Helvetica-Bold", color: NAVY, fontSize: 10.5 },
  amenityValue: { fontSize: 10, color: "#1f2937" },
  noteRow: { flexDirection: "row", marginBottom: 6 },
  noteBullet: { width: 12, color: GOLD, fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  noteText: { flex: 1, fontSize: 9.5, color: "#374151", lineHeight: 1.4 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 52,
    right: 52,
    textAlign: "center",
    fontSize: 8.5,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: "#e5e9f0",
    paddingTop: 10,
  },
});

export default function ProjectDetailsRateCard() {
  return (
    <Document title="SNR THE ELITE - Rate Card" author="SNR Group">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.eyebrow}>Rate Card</Text>
          <Text style={s.title}>SNR THE ELITE</Text>
          <Text style={s.subtitle}>
            GHMC Approval No: 1/C20/08176/2021 · RERA No: P02400003235
          </Text>
        </View>

        <View style={s.body}>
          <Text style={s.sectionLabel}>Pricing</Text>
          <View style={s.card}>
            {KEY_TERMS.map((row, i) => (
              <View
                key={row.label}
                style={i === KEY_TERMS.length - 1 ? { ...s.cardRow, ...s.cardRowLast } : s.cardRow}
              >
                <Text style={s.cardLabel}>{row.label}</Text>
                <Text style={s.cardValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <Text style={s.disclaimer}>*Excluding amenities</Text>

          <Text style={s.sectionLabel}>Amenities</Text>
          <View style={s.amenityBox}>
            {AMENITIES.map((row) => (
              <View key={row.label} style={s.amenityRow}>
                <Text style={s.amenityLabel}>{row.label}</Text>
                <Text style={s.amenityValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionLabel}>Additional Notes</Text>
          <View>
            {NOTES.map((note) => (
              <View key={note} style={s.noteRow}>
                <Text style={s.noteBullet}>•</Text>
                <Text style={s.noteText}>{note}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.footer}>
          SNR THE ELITE · Gopanapally, Gachibowli, Hyderabad · RERA No. P02400003235
        </Text>
      </Page>
    </Document>
  );
}
