import { NextResponse } from "next/server";
import { getCachedJson, setCachedJson } from "@/lib/cache";
import { FALLBACK_USD_RATES, type FxRatesPayload } from "@/lib/currency";

type FrankfurterRateRow = {
  date?: string;
  quote?: string;
  rate?: number;
};

export async function GET() {
  const cacheKey = "fx:USD";
  const cached = await getCachedJson<FxRatesPayload>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const response = await fetch("https://api.frankfurter.dev/v2/rates?base=USD", {
      next: { revalidate: 60 * 60 * 6 }
    });
    if (!response.ok) {
      throw new Error(`Frankfurter ${response.status}`);
    }

    const data = (await response.json()) as FrankfurterRateRow[];
    const rates: Record<string, number> = { USD: 1 };
    for (const row of data) {
      if (row.quote && typeof row.rate === "number") {
        rates[row.quote] = row.rate;
      }
    }
    if (!rates.INR) {
      rates.INR = FALLBACK_USD_RATES.INR;
    }

    const payload: FxRatesPayload = {
      base: "USD",
      date: data[0]?.date ?? new Date().toISOString().slice(0, 10),
      rates,
      provider: "Frankfurter",
      fallback: false
    };
    await setCachedJson(cacheKey, "Frankfurter", payload, 60 * 60 * 6);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      base: "USD",
      date: new Date().toISOString().slice(0, 10),
      rates: FALLBACK_USD_RATES,
      provider: "fallback",
      fallback: true
    } satisfies FxRatesPayload);
  }
}
