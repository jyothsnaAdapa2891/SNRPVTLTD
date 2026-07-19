import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const NAVY = "#10233f";
const GOLD = "#c6952f";
const MUTED = "#64748b";

// Source photos are all portrait 720x1280 (0.5625 ratio). Fit them to a
// height that always leaves room for the header/caption on an A4 page,
// rather than letting react-pdf try (and fail) to auto-size/paginate them.
const IMAGE_HEIGHT = 580;
const IMAGE_WIDTH = Math.round(IMAGE_HEIGHT * (720 / 1280));

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 44,
    alignItems: "center",
  },
  header: {
    alignSelf: "stretch",
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 10,
    marginBottom: 22,
    textAlign: "center",
  },
  eyebrow: {
    fontSize: 8.5,
    letterSpacing: 3,
    color: GOLD,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 4,
  },
  imageFrame: {
    borderWidth: 1,
    borderColor: "#e5e9f0",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 4,
    objectFit: "cover",
  },
  caption: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: MUTED,
  },
});

export default function ProjectDetailsGallery({
  images,
}: {
  images: { src: string; caption: string }[];
}) {
  return (
    <Document title="SNR THE ELITE - Site Visuals" author="SNR Group">
      {images.map((img, i) => (
        <Page key={img.src} size="A4" style={s.page}>
          <View style={s.header}>
            <Text style={s.eyebrow}>Site Visuals</Text>
            <Text style={s.title}>SNR THE ELITE</Text>
          </View>
          <View style={s.imageFrame}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={img.src} style={s.image} />
          </View>
          <Text style={s.caption}>{img.caption}</Text>
          <Text style={s.footer}>Page {i + 1} of {images.length} · Site Visuals</Text>
        </Page>
      ))}
    </Document>
  );
}
