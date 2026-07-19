import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const NAVY = "#10233f";
const GOLD = "#c6952f";
const MUTED = "#64748b";

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 52,
    paddingVertical: 56,
    fontSize: 11.5,
    color: "#1f2937",
    lineHeight: 1.6,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 14,
    marginBottom: 30,
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
  para: { marginBottom: 14 },
  highlight: { fontFamily: "Helvetica-Bold", color: NAVY },
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

export default function ProjectDetailsCover() {
  return (
    <Document title="SNR THE ELITE - Project Details" author="SNR Group">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.eyebrow}>Project Details</Text>
          <Text style={s.title}>SNR AVENUES PVT LTD</Text>
          <Text style={s.subtitle}>Gopanapally, Gachibowli · Hyderabad</Text>
        </View>

        <View style={s.body}>
          <Text style={s.para}>Dear Prospective Buyer,</Text>

          <Text style={s.para}>
            Thank you for your interest in our gated community residential
            project, <Text style={s.highlight}>SNR THE ELITE</Text>, located
            at Gopanpally, Gachibowli.
          </Text>

          <Text style={s.para}>
            We&apos;re pleased to share the project details with you. If you
            have any questions or would like to know more, please feel free
            to contact us. We&apos;d be happy to assist you.
          </Text>

          <Text style={s.para}>Thank you, and have a wonderful day!</Text>
        </View>

        <Text style={s.footer}>
          SNR THE ELITE · Gopanapally, Gachibowli, Hyderabad · RERA No. P02400003235
        </Text>
      </Page>
    </Document>
  );
}
