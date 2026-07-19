import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VacantPlotModel } from "@/lib/models/VacantPlot";
import { VACANT_STATUS_OPTIONS, type VacantStatus } from "@/lib/vacants";
import seedDocs from "../../../../db/seed/vacant-plots.json";

function normalizeStatus(value: unknown): VacantStatus {
  return VACANT_STATUS_OPTIONS.includes(value as VacantStatus)
    ? (value as VacantStatus)
    : "Available";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Seeds the collection from db/seed/vacant-plots.json the first time it's empty. */
async function ensureSeeded() {
  const count = await VacantPlotModel.estimatedDocumentCount();
  if (count === 0) {
    await VacantPlotModel.insertMany(seedDocs);
  }
}

// GET /api/vacants -> list all vacant plots
export async function GET() {
  try {
    await connectDB();
    await ensureSeeded();
    const docs = await VacantPlotModel.find({}).sort({ block: 1, flatNo: 1 }).lean();
    return NextResponse.json(docs);
  } catch (err) {
    console.error("GET /api/vacants", err);
    return NextResponse.json({ error: "Failed to load vacant plots" }, { status: 500 });
  }
}

// POST /api/vacants -> create a new vacant plot
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const block = String(body.block ?? "").trim().toUpperCase();
    const flatNo = String(body.flatNo ?? "").trim();
    const _id = `${block}-${flatNo}`;

    const existing = await VacantPlotModel.findById(_id).lean();
    if (existing) {
      return NextResponse.json(
        { error: `Flat ${block}-${flatNo} already exists.` },
        { status: 409 },
      );
    }

    const created = await VacantPlotModel.create({
      _id,
      block,
      flatNo,
      extentSft: Number(body.extentSft) || 0,
      facing: body.facing,
      corner: !!body.corner,
      status: normalizeStatus(body.status),
      createdAt: new Date(),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/vacants", err);
    return NextResponse.json({ error: "Failed to create vacant plot" }, { status: 500 });
  }
}
