import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { QuoteModel } from "@/lib/models/Quote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function computeFlatId(block?: string, flatNo?: string): string {
  return block && flatNo ? `${block}-${flatNo}` : "";
}

// GET /api/quotes/:id
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const doc = await QuoteModel.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    console.error("GET /api/quotes/:id", err);
    return NextResponse.json({ error: "Failed to load quote" }, { status: 500 });
  }
}

// PUT /api/quotes/:id
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    delete body._id;
    const updated = await QuoteModel.findByIdAndUpdate(
      id,
      { ...body, flatId: computeFlatId(body.block, body.flatNo) },
      { new: true },
    ).lean();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/quotes/:id", err);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}

// DELETE /api/quotes/:id
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await QuoteModel.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/quotes/:id", err);
    return NextResponse.json({ error: "Failed to delete quote" }, { status: 500 });
  }
}
