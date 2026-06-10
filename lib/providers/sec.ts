import { getCachedJson, setCachedJson } from "@/lib/cache";
import { mockFilings } from "@/lib/providers/mock";
import type { FilingItem } from "@/lib/types";

type SecTickerRecord = {
  cik_str: number;
  ticker: string;
  title: string;
};

type SecSubmissions = {
  filings?: {
    recent?: {
      accessionNumber?: string[];
      form?: string[];
      filingDate?: string[];
      primaryDocument?: string[];
    };
  };
};

async function getCikForTicker(ticker: string): Promise<string | null> {
  const cacheKey = "sec:tickers";
  let records = await getCachedJson<Record<string, SecTickerRecord>>(cacheKey);
  if (!records) {
    const response = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": "stock-market-agent contact@example.com" },
      next: { revalidate: 86400 }
    });
    if (!response.ok) return null;
    records = (await response.json()) as Record<string, SecTickerRecord>;
    await setCachedJson(cacheKey, "SEC", records, 86400);
  }

  const match = Object.values(records).find((record) => record.ticker.toUpperCase() === ticker);
  return match ? String(match.cik_str).padStart(10, "0") : null;
}

export async function getRecentFilings(ticker: string): Promise<FilingItem[]> {
  const cacheKey = `sec:filings:${ticker}`;
  const cached = await getCachedJson<FilingItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const cik = await getCikForTicker(ticker);
    if (!cik) return mockFilings(ticker);

    const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
      headers: { "User-Agent": "stock-market-agent contact@example.com" },
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error(`SEC ${response.status}`);
    const data = (await response.json()) as SecSubmissions;
    const recent = data.filings?.recent;
    const filings = (recent?.form ?? [])
      .map((form, index) => {
        const accession = recent?.accessionNumber?.[index]?.replaceAll("-", "");
        const doc = recent?.primaryDocument?.[index];
        const url = accession && doc ? `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession}/${doc}` : undefined;
        return {
          title: `${ticker} ${form} filed ${recent?.filingDate?.[index] ?? ""}`.trim(),
          provider: "SEC EDGAR",
          url,
          form,
          filedAt: recent?.filingDate?.[index]
        };
      })
      .filter((filing) => ["10-K", "10-Q", "8-K", "S-1"].includes(filing.form))
      .slice(0, 5);

    if (filings.length === 0) return mockFilings(ticker);
    await setCachedJson(cacheKey, "SEC", filings, 3600);
    return filings;
  } catch {
    return mockFilings(ticker);
  }
}
