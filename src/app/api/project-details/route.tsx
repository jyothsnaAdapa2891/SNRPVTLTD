import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument, degrees } from "pdf-lib";
import ProjectDetailsCover from "@/components/ProjectDetailsCover";
import ProjectDetailsSheet from "@/components/ProjectDetailsSheet";
import ProjectDetailsRateCard from "@/components/ProjectDetailsRateCard";
import ProjectDetailsGallery from "@/components/ProjectDetailsGallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSETS_DIR = path.join(process.cwd(), "public", "project-assets");

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

// Site photos (block-01.jpeg .. block-09.jpeg) labeled in shoot order, then
// shown alphabetically by block with Club House pinned last.
const BLOCK_IMAGE_LABELS: Record<string, string> = {
  "01": "Block A",
  "02": "Block D",
  "03": "Block C",
  "04": "Block B",
  "05": "Block E",
  "06": "Club House",
  "07": "Block H",
  "08": "Block G",
  "09": "Block F",
};
const BLOCK_IMAGE_ORDER = Object.keys(BLOCK_IMAGE_LABELS).sort((a, b) => {
  const labelA = BLOCK_IMAGE_LABELS[a];
  const labelB = BLOCK_IMAGE_LABELS[b];
  if (labelA === "Club House") return 1;
  if (labelB === "Club House") return -1;
  return labelA.localeCompare(labelB);
});

// These brochure pages (0-indexed) are the wide "Typical Floor Plan" block
// layouts (Block-A through Block-G/H). They're rotated 90deg into a
// landscape canvas that is then flagged as rotated, so the content fills
// far more of the page than it would squeezed into a portrait frame, while
// the final displayed page size still matches the rest of the A4 document.
// Every other brochure page is left unrotated (horizontal, letterboxed to
// fit the same A4 frame).
const BLOCK_PLAN_PAGE_INDICES = new Set([7, 8, 9, 10, 11, 12, 13]);

/**
 * Assembles the "Project Details" packet on demand:
 *   1. Styled cover letter (generated)
 *   2. Project details sheet (generated, matches brand style)
 *   3. Rate card / pricing (generated, matches brand style)
 *   4. Full brochure, content unmodified but fitted onto the same A4 canvas
 *   5. Block-wise site photos (generated gallery pages)
 * Every page in the final document shares the same A4 page size so the
 * packet reads consistently in any viewer; the brochure's original pages
 * (which ship at a different, wider aspect ratio) are embedded as vector
 * content and scaled to fit within the A4 frame rather than left at their
 * native size.
 */
export async function GET() {
  try {
    const [coverBytes, sheetBytes, rateCardBytes, brochureBytes] = await Promise.all([
      renderToBuffer(<ProjectDetailsCover />),
      renderToBuffer(<ProjectDetailsSheet />),
      renderToBuffer(<ProjectDetailsRateCard />),
      fs.readFile(path.join(ASSETS_DIR, "brochure.pdf")),
    ]);

    const images = await Promise.all(
      BLOCK_IMAGE_ORDER.map(async (num) => {
        const buf = await fs.readFile(path.join(ASSETS_DIR, "blocks", `block-${num}.jpeg`));
        return {
          src: `data:image/jpeg;base64,${buf.toString("base64")}`,
          caption: BLOCK_IMAGE_LABELS[num],
        };
      }),
    );
    const galleryBytes = await renderToBuffer(
      <ProjectDetailsGallery images={images} />,
    );

    const finalPdf = await PDFDocument.create();

    const coverPdf = await PDFDocument.load(coverBytes);
    const [coverPage] = await finalPdf.copyPages(coverPdf, [0]);
    finalPdf.addPage(coverPage);

    const sheetPdf = await PDFDocument.load(sheetBytes);
    const [sheetPage] = await finalPdf.copyPages(sheetPdf, [0]);
    finalPdf.addPage(sheetPage);

    const rateCardPdf = await PDFDocument.load(rateCardBytes);
    const [rateCardPage] = await finalPdf.copyPages(rateCardPdf, [0]);
    finalPdf.addPage(rateCardPage);

    const brochurePdf = await PDFDocument.load(brochureBytes);
    const brochureEmbeds = await finalPdf.embedPdf(
      brochurePdf,
      brochurePdf.getPageIndices(),
    );
    brochureEmbeds.forEach((embedded, i) => {
      const rotateForBlockPlan = BLOCK_PLAN_PAGE_INDICES.has(i);
      const canvasWidth = rotateForBlockPlan ? A4_HEIGHT : A4_WIDTH;
      const canvasHeight = rotateForBlockPlan ? A4_WIDTH : A4_HEIGHT;

      const scale = Math.min(
        canvasWidth / embedded.width,
        canvasHeight / embedded.height,
      );
      const width = embedded.width * scale;
      const height = embedded.height * scale;

      const page = finalPdf.addPage([canvasWidth, canvasHeight]);
      page.drawPage(embedded, {
        x: (canvasWidth - width) / 2,
        y: (canvasHeight - height) / 2,
        width,
        height,
      });
      if (rotateForBlockPlan) {
        page.setRotation(degrees(-90));
      }
    });

    const galleryPdf = await PDFDocument.load(galleryBytes);
    const galleryPages = await finalPdf.copyPages(
      galleryPdf,
      galleryPdf.getPageIndices(),
    );
    galleryPages.forEach((p) => finalPdf.addPage(p));

    const outBytes = await finalPdf.save();

    return new NextResponse(Buffer.from(outBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="SNR_The_Elite_Project_Details.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/project-details", err);
    return NextResponse.json(
      { error: "Failed to generate project details PDF" },
      { status: 500 },
    );
  }
}
