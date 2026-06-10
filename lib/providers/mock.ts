import type { FilingItem, MarketSnapshot, NewsItem } from "@/lib/types";

export function mockMarket(ticker: string): MarketSnapshot {
  const seed = ticker.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const changePct = Number((((seed % 90) - 45) / 10).toFixed(2));
  return {
    ticker,
    price: Number((80 + (seed % 320) + changePct).toFixed(2)),
    changePct,
    volume: 1_000_000 + seed * 431,
    provider: "demo",
    asOf: new Date().toISOString(),
    source: {
      title: "Demo market snapshot",
      provider: "demo"
    }
  };
}

export function mockNews(ticker: string): NewsItem[] {
  return [
    {
      title: `${ticker} investors weigh earnings quality and sector momentum`,
      description: "Demo article used until NEWS_API_KEY is configured.",
      provider: "demo",
      impact: "medium",
      publishedAt: new Date().toISOString()
    },
    {
      title: `Analysts flag demand signals and margin risk for ${ticker}`,
      description: "Demo article used until provider credentials are available.",
      provider: "demo",
      impact: "low",
      publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ];
}

export function mockFilings(ticker: string): FilingItem[] {
  return [
    {
      title: `${ticker} latest SEC filing placeholder`,
      provider: "demo",
      form: "10-Q",
      filedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}
