import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { alertRuleRequestSchema, tickerSchema } from "@/lib/validation";

export async function GET() {
  const rules = await prisma.alertRule.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = alertRuleRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const rule = await prisma.alertRule.create({ data: parsed.data });
  return NextResponse.json({ rule });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const ticker = tickerSchema.safeParse(searchParams.get("ticker"));
  if (id) {
    await prisma.alertRule.delete({ where: { id } }).catch(() => null);
  } else if (ticker.success) {
    await prisma.alertRule.deleteMany({ where: { ticker: ticker.data } });
  } else {
    return NextResponse.json({ error: "Alert id or ticker is required." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
