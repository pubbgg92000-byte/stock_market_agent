import { getCachedJson, setCachedJson } from "@/lib/cache";
import { mockMarket } from "@/lib/providers/mock";
import type { MarketSnapshot } from "@/lib/types";

type AlphaGlobalQuote = {
  "Global Quote"?: {
    "05. price"?: string;
    "09. change"?: string;
    "10. change percent"?: string;
    "06. volume"?: string;
  };
};

export async function getMarketSnapshot(ticker: string): Promise<MarketSnapshot> {
  const cacheKey = `market:${ticker}`;
  const cached = await getCachedJson<MarketSnapshot>(cacheKey);
  if (cached) return cached;

  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return mockMarket(ticker);

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("apikey", key);

  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error(`Alpha Vantage ${response.status}`);
    const data = (await response.json()) as AlphaGlobalQuote;
    const quote = data["Global Quote"];
    const price = Number(quote?.["05. price"]);
    const changePct = Number((quote?.["10. change percent"] ?? "0").replace("%", ""));
    if (!Number.isFinite(price)) throw new Error("Missing price");

    const snapshot: MarketSnapshot = {
      ticker,
      price,
      changePct: Number.isFinite(changePct) ? changePct : 0,
      volume: Number(quote?.["06. volume"]) || undefined,
      provider: "Alpha Vantage",
      asOf: new Date().toISOString(),
      source: {
        title: "Alpha Vantage Global Quote",
        url: "https://www.alphavantage.co/documentation/#latestprice",
        provider: "Alpha Vantage"
      }
    };
    await setCachedJson(cacheKey, "Alpha Vantage", snapshot, 60);
    return snapshot;
  } catch {
    return mockMarket(ticker);
  }
}
