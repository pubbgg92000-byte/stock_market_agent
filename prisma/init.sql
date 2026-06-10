CREATE TABLE IF NOT EXISTS "WatchlistItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ticker" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AnalysisReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ticker" TEXT NOT NULL,
  "question" TEXT,
  "summary" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL,
  "payload" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AnalysisReport_ticker_createdAt_idx" ON "AnalysisReport"("ticker", "createdAt");

CREATE TABLE IF NOT EXISTS "AlertRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ticker" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'telegram',
  "priceMovePct" REAL NOT NULL DEFAULT 3,
  "newsImpact" BOOLEAN NOT NULL DEFAULT true,
  "filingDetected" BOOLEAN NOT NULL DEFAULT true,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AlertRule_ticker_enabled_idx" ON "AlertRule"("ticker", "enabled");

CREATE TABLE IF NOT EXISTS "SourceEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ticker" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "provider" TEXT NOT NULL,
  "occurredAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SourceEvent_ticker_type_createdAt_idx" ON "SourceEvent"("ticker", "type", "createdAt");

CREATE TABLE IF NOT EXISTS "ProviderCache" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ProviderCache_provider_expiresAt_idx" ON "ProviderCache"("provider", "expiresAt");
