import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/providers/market";
import { tickerSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = tickerSchema.safeParse(searchParams.get("ticker"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ticker is required." }, { status: 400 });
  }

  const market = await getMarketSnapshot(parsed.data);
  return NextResponse.json({ market });
}
