import { NextResponse } from "next/server";
import { buildAnalysisReport } from "@/lib/agents/report";
import { prisma } from "@/lib/db";
import { analyzeRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = analyzeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const report = await buildAnalysisReport(parsed.data.ticker, parsed.data.question);
  const saved = await prisma.analysisReport.create({
    data: {
      ticker: report.ticker,
      question: parsed.data.question,
      summary: report.summary,
      confidence: report.confidence,
      payload: JSON.stringify(report)
    }
  });

  return NextResponse.json({ id: saved.id, report });
}
