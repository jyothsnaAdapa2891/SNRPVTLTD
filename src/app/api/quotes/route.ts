import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { QuoteModel, nextQuoteNumber } from "@/lib/models/Quote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function computeFlatId(block?: string, flatNo?: string): string {
  return block && flatNo ? `${block}-${flatNo}` : "";
}

// GET /api/quotes -> list all quotes (newest first)
export async function GET() {
  try {
    await connectDB();
    const docs = await QuoteModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(docs);
  } catch (err) {
    console.error("GET /api/quotes", err);
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }
}

// POST /api/quotes -> create a new quote
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const quoteNumber = body.quoteNumber || (await nextQuoteNumber());
    const created = await QuoteModel.create({
      ...body,
      _id: quoteNumber,
      quoteNumber,
      flatId: computeFlatId(body.block, body.flatNo),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/quotes", err);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
