export type SourceLink = {
  title: string;
  url?: string;
  provider: string;
  publishedAt?: string;
};

export type MarketSnapshot = {
  ticker: string;
  price: number;
  changePct: number;
  volume?: number;
  provider: string;
  asOf: string;
  source: SourceLink;
};

export type NewsItem = SourceLink & {
  description?: string;
  impact: "high" | "medium" | "low";
};

export type FilingItem = SourceLink & {
  form: string;
  filedAt?: string;
};

export type AnalysisReportPayload = {
  ticker: string;
  summary: string;
  moveDrivers: string[];
  risks: string[];
  nextWatchItems: string[];
  confidence: number;
  market: MarketSnapshot;
  news: NewsItem[];
  filings: FilingItem[];
  sources: SourceLink[];
  generatedAt: string;
};

export type AlertRuleInput = {
  ticker: string;
  priceMovePct?: number;
  newsImpact?: boolean;
  filingDetected?: boolean;
  enabled?: boolean;
};
