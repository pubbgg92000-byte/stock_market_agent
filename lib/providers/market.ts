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

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        regularMarketVolume?: number;
        currency?: string;
        exchangeName?: string;
        symbol?: string;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
};

export async function getMarketSnapshot(ticker: string): Promise<MarketSnapshot> {
  const normalizedTicker = ticker.toUpperCase();
  const cacheKey = `market:${normalizedTicker}`;
  const cached = await getCachedJson<MarketSnapshot>(cacheKey);
  if (cached?.currency) return cached;

  const yahooSnapshot = await getYahooSnapshot(normalizedTicker);
  if (yahooSnapshot) {
    await setCachedJson(cacheKey, "Yahoo Finance", yahooSnapshot, 10);
    return yahooSnapshot;
  }

  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return mockMarket(normalizedTicker);

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", normalizedTicker);
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
      ticker: normalizedTicker,
      price,
      currency: "USD",
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
    return mockMarket(normalizedTicker);
  }
}

async function getYahooSnapshot(ticker: string): Promise<MarketSnapshot | null> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1m`, {
      headers: {
        "User-Agent": "stock-market-agent/0.1"
      },
      next: { revalidate: 10 }
    });
    if (!response.ok) return null;
    const data = (await response.json()) as YahooChartResponse;
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const closeValues = result?.indicators?.quote?.[0]?.close?.filter((value): value is number => typeof value === "number") ?? [];
    const volumeValues = result?.indicators?.quote?.[0]?.volume?.filter((value): value is number => typeof value === "number") ?? [];
    const price = meta?.regularMarketPrice ?? closeValues.at(-1);
    const previousClose = meta?.chartPreviousClose;
    if (!Number.isFinite(price)) return null;
    const currentPrice = price as number;

    const changePct =
      Number.isFinite(previousClose) && previousClose
        ? Number((((currentPrice - previousClose) / previousClose) * 100).toFixed(2))
        : 0;

    return {
      ticker,
      price: Number(currentPrice.toFixed(2)),
      currency: meta?.currency ?? (ticker.endsWith(".NS") || ticker.endsWith(".BO") ? "INR" : "USD"),
      changePct,
      volume: meta?.regularMarketVolume ?? volumeValues.at(-1) ?? undefined,
      provider: `Yahoo Finance${meta?.exchangeName ? ` ${meta.exchangeName}` : ""}`,
      asOf: new Date().toISOString(),
      source: {
        title: "Yahoo Finance chart quote",
        url: `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`,
        provider: "Yahoo Finance"
      }
    };
  } catch {
    return null;
  }
}
