import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VacantPlotModel } from "@/lib/models/VacantPlot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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

    await VacantPlotModel.deleteOne({ _id: id });
    const updated = await VacantPlotModel.create({
      _id: newId,
      block,
      flatNo,
      extentSft: Number(body.extentSft) || 0,
      facing: body.facing,
      corner: !!body.corner,
      createdAt: (existing as { createdAt?: Date }).createdAt ?? new Date(),
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/vacants/:id", err);
    return NextResponse.json({ error: "Failed to update vacant plot" }, { status: 500 });
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
