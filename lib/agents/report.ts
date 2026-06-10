import { getMarketSnapshot } from "@/lib/providers/market";
import { getRecentNews } from "@/lib/providers/news";
import { getRecentFilings } from "@/lib/providers/sec";
import type { AnalysisReportPayload, NewsItem, SourceLink } from "@/lib/types";

function plainMovePhrase(changePct: number) {
  if (changePct > 0.25) return "went up";
  if (changePct < -0.25) return "fell";
  return "stayed mostly flat";
}

function newsReasonPhrase(changePct: number, news: NewsItem[]) {
  const topNews = news.slice(0, 3).map((item) => item.title);
  if (topNews.length === 0) {
    return "No fresh related headlines were found, so the move appears driven mainly by price action and broader market context.";
  }
  const direction = changePct < -0.25 ? "weakness" : changePct > 0.25 ? "strength" : "limited movement";
  return `The most relevant headlines to check for today's ${direction}: ${topNews.join(" | ")}.`;
}

function riskFromNews(news: NewsItem[]) {
  if (news.some((item) => /downgrade|lawsuit|probe|weak|cut|miss/i.test(`${item.title} ${item.description ?? ""}`))) {
    return "Recent headlines include negative or uncertainty-heavy language that should be verified against primary sources.";
  }
  return "The main risk is that provider coverage may be incomplete on free tiers, especially outside regular market hours.";
}

export async function buildAnalysisReport(ticker: string, question?: string): Promise<AnalysisReportPayload> {
  const [market, news, filings] = await Promise.all([
    getMarketSnapshot(ticker),
    getRecentNews(ticker),
    getRecentFilings(ticker)
  ]);

  const highImpactNews = news.filter((item) => item.impact === "high");
  const moveDrivers = [
    `${ticker} ${plainMovePhrase(market.changePct)} by ${Math.abs(market.changePct).toFixed(2)}% in the latest available quote.`,
    highImpactNews[0]
      ? `Top related news: "${highImpactNews[0].title}". ${highImpactNews[0].description ?? ""}`.trim()
      : "No high-impact news item was found in the current provider window.",
    newsReasonPhrase(market.changePct, news),
    filings[0]
      ? `The latest relevant SEC filing signal is ${filings[0].form}.`
      : "No recent 10-K, 10-Q, 8-K, or S-1 filing was found."
  ];

  const sources: SourceLink[] = [
    market.source,
    ...news.map((item) => ({
      title: item.title,
      url: item.url,
      provider: item.provider,
      publishedAt: item.publishedAt
    })),
    ...filings.map((item) => ({
      title: item.title,
      url: item.url,
      provider: item.provider,
      publishedAt: item.filedAt
    }))
  ];

  const confidence = Math.min(
    92,
    45 +
      (market.provider !== "demo" ? 20 : 8) +
      Math.min(news.length, 5) * 4 +
      (filings.length > 0 ? 8 : 0)
  );

  const summary = question
    ? `${ticker}: ${plainMovePhrase(market.changePct)} today. Current evidence points to price action, related news, and filing context as the key checks for "${question}".`
    : `${ticker}: ${plainMovePhrase(market.changePct)} today, with current evidence centered on live price action and related headlines.`;

  return {
    ticker,
    summary,
    moveDrivers,
    risks: [
      riskFromNews(news),
      "This is an intelligence summary, not personalized investment advice."
    ],
    nextWatchItems: [
      "Confirm whether fresh headlines are confirmed by primary filings or company statements.",
      "Watch for analyst revisions, earnings guidance changes, and unusual volume.",
      "Re-run analysis after market close if the move occurred intraday."
    ],
    confidence,
    market,
    news,
    filings,
    sources,
    generatedAt: new Date().toISOString()
  };
}
