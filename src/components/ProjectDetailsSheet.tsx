import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const NAVY = "#10233f";
const GOLD = "#c6952f";
const MUTED = "#64748b";

const ROWS: { label: string; value: string }[] = [
  { label: "Project Type", value: "Residential" },
  { label: "Project Status", value: "RERA Approved (P02400003235)" },
  { label: "Total Land", value: "6.5 Acres" },
  { label: "Total Flats", value: "680 Flats (G+9 Floors)" },
  { label: "No. of Towers", value: "8 Towers + 1 Amenities" },
  { label: "Land Status", value: "Own" },
  { label: "Survey No's", value: "124/2, 124/3, 124/4 and 124/5" },
  { label: "Project Size", value: "10,50,060+ Sft" },
  { label: "Bank Loans", value: "HDFC, ICICI, PNB, BAJAJ, NAVI, SBI" },
  { label: "Unit Sizes", value: "2 BHK: 1290 Sft  ·  3 BHK: 1690 / 1790 / 1890 Sft" },
  { label: "Club House", value: "5 Floors with 35,000 Sft" },
  {
    label: "Facilities",
    value:
      "Gym, Aerobics/Yoga Meditation, Indoor Games, Swimming Pool with Deck, Kids Play Areas, Jogging Track, Amphitheatre, Basketball Court, Badminton Court, Cricket Pitch, Party Lawns, Super Market, Coffee Shop, Waiting Lounge, Library, 24/7 Electricity Backup, Community Hall, Banquet Hall, Saloon, Spa, Guest Rooms (10), 24/7 Security & CCTV Surveillance, Solar Electrical Fencing.",
  },
  { label: "Location Pin", value: "https://goo.gl/maps/5haEjQcbxEQMNhnKA" },
];

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 52,
    paddingTop: 56,
    paddingBottom: 56,
    fontSize: 10,
    color: "#1f2937",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 14,
    marginBottom: 24,
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
  table: {
    borderWidth: 1,
    borderColor: "#e5e9f0",
    borderRadius: 6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e9f0",
  },
  rowLast: { borderBottomWidth: 0 },
  cellLabel: {
    width: "30%",
    backgroundColor: "#f8fafc",
    padding: 8,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    fontSize: 9.5,
  },
  cellValue: {
    width: "70%",
    padding: 8,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#1f2937",
  },
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

export default function ProjectDetailsSheet() {
  return (
    <Document title="SNR THE ELITE - Project Details Sheet" author="SNR Group">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.eyebrow}>Project Details Sheet</Text>
          <Text style={s.title}>SNR THE ELITE</Text>
          <Text style={s.subtitle}>
            Gopanpally, Serlingampally Mandal, R.R. Dist. · Abutting Wipro
          </Text>
        </View>

        <View style={s.body}>
          <View style={s.table}>
            {ROWS.map((row, i) => (
              <View
                key={row.label}
                style={i === ROWS.length - 1 ? { ...s.row, ...s.rowLast } : s.row}
              >
                <Text style={s.cellLabel}>{row.label}</Text>
                <Text style={s.cellValue}>{row.value}</Text>
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
