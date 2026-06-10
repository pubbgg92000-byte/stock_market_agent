import { prisma } from "@/lib/db";
import { buildAnalysisReport } from "@/lib/agents/report";
import { sendTelegramMessage } from "@/lib/alerts/telegram";

export async function monitorWatchlist() {
  const rules = await prisma.alertRule.findMany({
    where: { enabled: true },
    orderBy: { createdAt: "asc" }
  });

  const results = [];
  for (const rule of rules) {
    const report = await buildAnalysisReport(rule.ticker, "Monitor alert rule");
    const priceTriggered = Math.abs(report.market.changePct) >= rule.priceMovePct;
    const newsTriggered = rule.newsImpact && report.news.some((item) => item.impact === "high");
    const filingTriggered = rule.filingDetected && report.filings.length > 0;

    if (!priceTriggered && !newsTriggered && !filingTriggered) {
      results.push({ ticker: rule.ticker, sent: false, reason: "No trigger matched." });
      continue;
    }

    const message = [
      `Stock intelligence alert: ${rule.ticker}`,
      report.summary,
      `Move: ${report.market.changePct.toFixed(2)}% at ${report.market.price}`,
      `Driver: ${report.moveDrivers[1]}`,
      `Confidence: ${report.confidence}%`
    ].join("\n");

    const delivery = await sendTelegramMessage(message);
    results.push({
      ticker: rule.ticker,
      sent: delivery.ok,
      reason: delivery.detail,
      triggers: { priceTriggered, newsTriggered, filingTriggered }
    });
  }

  return {
    checked: rules.length,
    results
  };
}
