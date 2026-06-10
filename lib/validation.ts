import { z } from "zod";

export const tickerSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9.-]{0,9}$/, "Use a valid US-listed ticker symbol.");

export const analyzeRequestSchema = z.object({
  ticker: tickerSchema,
  question: z.string().trim().max(240).optional()
});

export const watchlistRequestSchema = z.object({
  ticker: tickerSchema,
  name: z.string().trim().max(120).optional()
});

export const alertRuleRequestSchema = z.object({
  ticker: tickerSchema,
  priceMovePct: z.coerce.number().min(0.5).max(50).default(3),
  newsImpact: z.coerce.boolean().default(true),
  filingDetected: z.coerce.boolean().default(true),
  enabled: z.coerce.boolean().default(true)
});
