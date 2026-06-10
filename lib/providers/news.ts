import { getCachedJson, setCachedJson } from "@/lib/cache";
import { mockNews } from "@/lib/providers/mock";
import type { NewsItem } from "@/lib/types";

type NewsApiResponse = {
  articles?: Array<{
    title?: string;
    description?: string;
    url?: string;
    publishedAt?: string;
    source?: { name?: string };
  }>;
};

type YahooNewsResponse = {
  news?: Array<{
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    relatedTickers?: string[];
  }>;
};

export async function getRecentNews(ticker: string): Promise<NewsItem[]> {
  const cacheKey = `news:${ticker}`;
  const cached = await getCachedJson<NewsItem[]>(cacheKey);
  if (cached) return cached;

  const key = process.env.NEWS_API_KEY;
  if (!key) return getYahooFinanceNews(ticker);

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", `${ticker} stock OR earnings OR analyst`);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "8");
  url.searchParams.set("apiKey", key);

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`NewsAPI ${response.status}`);
    const data = (await response.json()) as NewsApiResponse;
    const items = (data.articles ?? [])
      .filter((article) => article.title)
      .map<NewsItem>((article, index) => ({
        title: article.title ?? "Untitled article",
        description: article.description,
        url: article.url,
        provider: article.source?.name ?? "NewsAPI",
        publishedAt: article.publishedAt,
        impact: index < 2 ? "high" : index < 5 ? "medium" : "low"
      }));
    if (items.length === 0) return mockNews(ticker);
    await setCachedJson(cacheKey, "NewsAPI", items, 300);
    return items;
  } catch {
    return getYahooFinanceNews(ticker);
  }
}

async function getYahooFinanceNews(ticker: string): Promise<NewsItem[]> {
  const cleanTicker = ticker.replace(/\.(NS|BO)$/i, "");
  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", `${cleanTicker} ${ticker} stock`);
  url.searchParams.set("quotesCount", "0");
  url.searchParams.set("newsCount", "8");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "stock-market-agent/0.1" },
      next: { revalidate: 300 }
    });
    if (!response.ok) throw new Error(`Yahoo Finance ${response.status}`);
    const data = (await response.json()) as YahooNewsResponse;
    const items = (data.news ?? [])
      .filter((item) => item.title)
      .map<NewsItem>((item, index) => ({
        title: item.title ?? "Untitled story",
        description: item.relatedTickers?.length
          ? `Publisher: ${item.publisher ?? "Yahoo Finance"}. Related tickers: ${item.relatedTickers.join(", ")}.`
          : `Publisher: ${item.publisher ?? "Yahoo Finance"}.`,
        url: item.link,
        provider: item.publisher ?? "Yahoo Finance",
        publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toISOString() : undefined,
        impact: index < 2 ? "high" : index < 5 ? "medium" : "low"
      }));

    if (items.length === 0) return mockNews(ticker);
    await setCachedJson(`news:${ticker}`, "Yahoo Finance", items, 300);
    return items;
  } catch {
    return mockNews(ticker);
  }
}
