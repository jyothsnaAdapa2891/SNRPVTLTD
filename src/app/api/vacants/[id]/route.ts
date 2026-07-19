import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VacantPlotModel } from "@/lib/models/VacantPlot";
import { VACANT_STATUS_OPTIONS, type VacantStatus } from "@/lib/vacants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normalizeStatus(value: unknown, fallback: VacantStatus): VacantStatus {
  return VACANT_STATUS_OPTIONS.includes(value as VacantStatus)
    ? (value as VacantStatus)
    : fallback;
}

// PUT /api/vacants/:id
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const block = String(body.block ?? "").trim().toUpperCase();
    const flatNo = String(body.flatNo ?? "").trim();
    const newId = `${block}-${flatNo}`;

    if (newId !== id) {
      const clash = await VacantPlotModel.findById(newId).lean();
      if (clash) {
        return NextResponse.json(
          { error: `Flat ${block}-${flatNo} already exists.` },
          { status: 409 },
        );
      }
    }

    const existing = await VacantPlotModel.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existingStatus = (existing as { status?: VacantStatus }).status ?? "Available";

    await VacantPlotModel.deleteOne({ _id: id });
    const updated = await VacantPlotModel.create({
      _id: newId,
      block,
      flatNo,
      extentSft: Number(body.extentSft) || 0,
      facing: body.facing,
      corner: !!body.corner,
      status: normalizeStatus(body.status, existingStatus),
      createdAt: (existing as { createdAt?: Date }).createdAt ?? new Date(),
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/vacants/:id", err);
    return NextResponse.json({ error: "Failed to update vacant plot" }, { status: 500 });
  }
}

// PATCH /api/vacants/:id -> partial update (used for quick status changes)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const existing = await VacantPlotModel.findById(id).lean<{ status?: VacantStatus }>();
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const status = normalizeStatus(body.status, existing.status ?? "Available");
    const updated = await VacantPlotModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).lean();
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/vacants/:id", err);
    return NextResponse.json({ error: "Failed to update flat status" }, { status: 500 });
  }
}

// DELETE /api/vacants/:id
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await VacantPlotModel.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/vacants/:id", err);
    return NextResponse.json({ error: "Failed to delete vacant plot" }, { status: 500 });
  }
}
