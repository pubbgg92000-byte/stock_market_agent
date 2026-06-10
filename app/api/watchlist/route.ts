import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tickerSchema, watchlistRequestSchema } from "@/lib/validation";

export async function GET() {
  const items = await prisma.watchlistItem.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = watchlistRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const item = await prisma.watchlistItem.upsert({
    where: { ticker: parsed.data.ticker },
    create: parsed.data,
    update: { name: parsed.data.name }
  });
  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = tickerSchema.safeParse(searchParams.get("ticker"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ticker is required." }, { status: 400 });
  }

  await prisma.watchlistItem.delete({ where: { ticker: parsed.data } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
