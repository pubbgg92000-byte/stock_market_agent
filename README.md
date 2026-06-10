# stock_market_agent

AI-first stock intelligence MVP for ticker analysis, watchlists, SEC/news context, and Telegram alerts.

Prices are displayed in the user's local currency by default, with a selector for INR, USD, EUR, GBP, JPY, and other currencies returned by the exchange-rate provider.

## Quick Start

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:init
npm run dev
```

Open `http://localhost:3000`.

Missing provider keys automatically fall back to demo data so the app can run locally right away.

If Prisma's schema engine works on your machine, `npm run prisma:push` can be used instead of `npm run db:init`.
