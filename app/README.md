# ChintasMoney — MVP app

A client-side SPA that runs the core decision-intelligence loop. No build step.

## Files
- `index.html` — SPA shell
- `store.js` — the **financial-memory** data layer (localStorage now; swap for an API/DB later). Holds plan config, seed/mock data, portfolio/health/pattern analytics, and an **adapter layer** for future broker/market/payment integrations.
- `styles.css` — design system (navy / emerald-teal / green / gold / coral)
- `app.js` — router + all views + onboarding + Chinta AI

## What's real vs. mock
- **Real & persistent:** onboarding/persona, decision journal, thesis records, holdings you add, plan switching, Money Health / Risk Map / concentration / pattern analytics (all computed from your data), Chinta AI answers (evidence-grounded, from your data).
- **Mock (clearly labelled):** market prices/LTP, "What Changed" signals, X-ray fundamentals, trading report, document parsing. These are where real APIs plug into `store.js`'s `adapters`.

## Roadmap (needs a backend)
Server auth, database, payments/subscriptions billing, admin panel, real broker/market-data/filings/news adapters, and a real LLM behind Chinta AI. The frontend is structured so these slot in without a rewrite.

> Not investment advice. Not a SEBI-registered adviser. MVP data is illustrative.
