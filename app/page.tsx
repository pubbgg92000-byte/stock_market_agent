"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, Bell, BriefcaseBusiness, Coins, FileText, Newspaper, Radar, Send, Star, Trash2 } from "lucide-react";
import { FALLBACK_USD_RATES, REGION_CURRENCY, type FxRatesPayload } from "@/lib/currency";
import type { AnalysisReportPayload } from "@/lib/types";

type WatchlistItem = {
  id: string;
  ticker: string;
  name?: string | null;
};

type AlertRule = {
  id: string;
  ticker: string;
  priceMovePct: number;
  newsImpact: boolean;
  filingDetected: boolean;
  enabled: boolean;
};

export default function Home() {
  const [ticker, setTicker] = useState("NVDA");
  const [question, setQuestion] = useState("Why did it move today?");
  const [report, setReport] = useState<AnalysisReportPayload | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [fx, setFx] = useState<FxRatesPayload>({
    base: "USD",
    date: new Date().toISOString().slice(0, 10),
    rates: FALLBACK_USD_RATES,
    provider: "fallback",
    fallback: true
  });
  const [currencyMode, setCurrencyMode] = useState("AUTO");
  const [detectedCurrency, setDetectedCurrency] = useState("INR");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const configuredMode = useMemo(() => {
    if (!report) return "Ready";
    return report.market.provider === "demo" ? "Demo data" : "Live providers";
  }, [report]);

  const selectedCurrency = currencyMode === "AUTO" ? detectedCurrency : currencyMode;
  const currencyOptions = useMemo(() => {
    const priority = ["INR", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD", "AED"];
    const codes = Object.keys(fx.rates).sort();
    return [...priority, ...codes.filter((code) => !priority.includes(code))];
  }, [fx.rates]);

  const priceInCurrency = useMemo(() => {
    if (!report) return null;
    const rate = fx.rates[selectedCurrency] ?? 1;
    return report.market.price * rate;
  }, [fx.rates, report, selectedCurrency]);

  async function refreshLists() {
    const [watchlistResponse, alertResponse] = await Promise.all([fetch("/api/watchlist"), fetch("/api/alerts")]);
    const watchlistData = await watchlistResponse.json();
    const alertData = await alertResponse.json();
    setWatchlist(watchlistData.items ?? []);
    setAlerts(alertData.rules ?? []);
  }

  useEffect(() => {
    refreshLists().catch(() => setMessage("Could not load saved data."));
    const locale = navigator.language || "en-IN";
    const region = locale.split("-")[1]?.toUpperCase();
    setDetectedCurrency(REGION_CURRENCY[region ?? "IN"] ?? "INR");
    fetch("/api/fx")
      .then((response) => response.json())
      .then((data: FxRatesPayload) => setFx(data))
      .catch(() => {
        setMessage("Using fallback currency rates.");
      });
  }, []);

  function formatCurrency(value: number, currency = selectedCurrency) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2
    }).format(value);
  }

  async function analyze(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, question })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Analysis failed.");
      setReport(data.report);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function addToWatchlist() {
    const response = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker })
    });
    if (response.ok) {
      setMessage(`${ticker.toUpperCase()} saved to watchlist.`);
      await refreshLists();
    }
  }

  async function addAlert() {
    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, priceMovePct: 3, newsImpact: true, filingDetected: true })
    });
    if (response.ok) {
      setMessage(`Telegram alert rule created for ${ticker.toUpperCase()}.`);
      await refreshLists();
    }
  }

  async function removeWatchlistItem(symbol: string) {
    await fetch(`/api/watchlist?ticker=${symbol}`, { method: "DELETE" });
    await refreshLists();
  }

  async function removeAlert(id: string) {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    await refreshLists();
  }

  async function runMonitor() {
    setLoading(true);
    try {
      const response = await fetch("/api/jobs/monitor", { method: "POST" });
      const data = await response.json();
      setMessage(`Monitor checked ${data.checked ?? 0} alert rules.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-ink text-white">
              <Radar size={21} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Stock Market Agent</h1>
              <p className="text-sm text-slate-600">Market moves, source-backed reports, and watchlist alerts.</p>
            </div>
          </div>
          <div className="rounded border border-line bg-paper px-3 py-1.5 text-sm font-medium text-slate-700">
            {configuredMode}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[360px_1fr]">
        <section className="space-y-5">
          <div className="rounded border border-line bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={19} aria-hidden="true" />
              <h2 className="text-base font-semibold">Analyze Ticker</h2>
            </div>
            <form className="space-y-3" onSubmit={analyze}>
              <label className="block text-sm font-medium">
                Ticker
                <input
                  className="mt-1 w-full rounded border border-line px-3 py-2 text-base uppercase outline-none focus:border-cobalt"
                  value={ticker}
                  onChange={(event) => setTicker(event.target.value.toUpperCase())}
                  maxLength={10}
                />
              </label>
              <label className="block text-sm font-medium">
                Question
                <textarea
                  className="mt-1 min-h-24 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-cobalt"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button className="btn-primary col-span-3" disabled={loading} type="submit">
                  <Send size={16} aria-hidden="true" />
                  {loading ? "Working" : "Generate"}
                </button>
                <button className="btn-secondary" onClick={addToWatchlist} type="button" title="Save ticker">
                  <Star size={16} aria-hidden="true" />
                </button>
                <button className="btn-secondary" onClick={addAlert} type="button" title="Create alert">
                  <Bell size={16} aria-hidden="true" />
                </button>
                <button className="btn-secondary" onClick={runMonitor} type="button" title="Run monitor">
                  <Radar size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
            {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          </div>

          <div className="rounded border border-line bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Coins size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Currency</h2>
            </div>
            <label className="block text-sm font-medium">
              Display prices in
              <select
                className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-cobalt"
                value={currencyMode}
                onChange={(event) => setCurrencyMode(event.target.value)}
              >
                <option value="AUTO">Auto by location ({detectedCurrency})</option>
                {currencyOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Market quotes arrive in USD. Display conversion uses {fx.provider}
              {fx.fallback ? " fallback" : ""} rates from {fx.date}.
            </p>
          </div>

          <div className="rounded border border-line bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <BriefcaseBusiness size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Watchlist</h2>
            </div>
            <div className="space-y-2">
              {watchlist.length === 0 ? <p className="text-sm text-slate-600">No saved tickers yet.</p> : null}
              {watchlist.map((item) => (
                <div className="flex items-center justify-between rounded border border-line px-3 py-2" key={item.id}>
                  <button className="font-semibold" onClick={() => setTicker(item.ticker)} type="button">
                    {item.ticker}
                  </button>
                  <button className="icon-button" onClick={() => removeWatchlistItem(item.ticker)} title="Remove" type="button">
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-line bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Alert Rules</h2>
            </div>
            <div className="space-y-2">
              {alerts.length === 0 ? <p className="text-sm text-slate-600">No alert rules yet.</p> : null}
              {alerts.map((rule) => (
                <div className="rounded border border-line px-3 py-2" key={rule.id}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{rule.ticker}</span>
                    <button className="icon-button" onClick={() => removeAlert(rule.id)} title="Remove alert" type="button">
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Move &gt; {rule.priceMovePct}% · News {rule.newsImpact ? "on" : "off"} · Filings{" "}
                    {rule.filingDetected ? "on" : "off"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {report ? (
            <>
              <div className="rounded border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{report.ticker}</p>
                    <h2 className="mt-1 text-2xl font-semibold">{report.summary}</h2>
                  </div>
                  <div className="rounded border border-line px-4 py-3 text-right">
                    <p className="text-sm text-slate-500">Confidence</p>
                    <p className="text-2xl font-semibold">{report.confidence}%</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric label={`Price (${selectedCurrency})`} value={formatCurrency(priceInCurrency ?? report.market.price)} />
                  <Metric label="Base price" value={formatCurrency(report.market.price, "USD")} />
                  <Metric label="Move" value={`${report.market.changePct.toFixed(2)}%`} tone={report.market.changePct >= 0 ? "up" : "down"} />
                  <Metric label="Provider" value={report.market.provider} />
                </div>
              </div>

              <InsightSection icon={<Activity size={18} />} title="Move Drivers" items={report.moveDrivers} />
              <InsightSection icon={<Newspaper size={18} />} title="News" items={report.news.map((item) => item.title)} />
              <InsightSection icon={<FileText size={18} />} title="Filings" items={report.filings.map((item) => `${item.form}: ${item.title}`)} />
              <InsightSection icon={<Radar size={18} />} title="Next Watch Items" items={report.nextWatchItems} />

              <div className="rounded border border-line bg-white p-5">
                <h2 className="text-base font-semibold">Sources</h2>
                <div className="mt-3 space-y-2">
                  {report.sources.slice(0, 8).map((source, index) => (
                    <div className="text-sm" key={`${source.title}-${index}`}>
                      {source.url ? (
                        <a className="font-medium text-cobalt hover:underline" href={source.url} rel="noreferrer" target="_blank">
                          {source.title}
                        </a>
                      ) : (
                        <span className="font-medium">{source.title}</span>
                      )}
                      <span className="text-slate-500"> · {source.provider}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded border border-line bg-white p-8 text-center">
              <div>
                <Radar className="mx-auto text-cobalt" size={42} aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-semibold">Generate a stock intelligence report</h2>
                <p className="mx-auto mt-2 max-w-xl text-slate-600">
                  Start with a ticker to combine market data, recent news, SEC filing context, and a concise
                  evidence-backed explanation.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const toneClass = tone === "up" ? "text-pine" : tone === "down" ? "text-rose" : "text-ink";
  return (
    <div className="rounded border border-line bg-paper px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function InsightSection({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded border border-line bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li className="rounded border border-line bg-paper px-3 py-2 text-sm leading-6" key={`${title}-${index}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
