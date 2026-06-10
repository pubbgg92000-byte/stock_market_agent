# stock_market_agent

AI-first stock intelligence MVP for ticker analysis, watchlists, SEC/news context, and Telegram alerts.

Prices are displayed in the user's local currency by default, with a selector for INR, USD, EUR, GBP, JPY, and other currencies returned by the exchange-rate provider.
Saved watchlist tickers show the latest available price, quote-currency price, percent move, and data provider.
NSE and BSE quotes are supported with `.NS` and `.BO` suffixes, and the app can add those suffixes from the exchange selector.
Watchlist and top report prices refresh every 15 seconds while the app is open.
The dashboard includes a persistent light/dark theme toggle.

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
