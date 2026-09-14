# ChintasMoney — The Trader Report Card

**Discipline over profit.** A behavioural mirror for traders: log your trades and
get a **Discipline Score**, your **Trader Personality**, your repeating
**mistakes**, **streaks & badges**, a **shareable card**, and an evidence-based
**Discipline Coach**.

It gives **no buy/sell tips and no investment advice** — all value comes from the
trader's *own* logged data, so it needs no paid market feed to run. That also
keeps it separate from any financial-advisory business, and safe under Indian
rules (no return claims, no recommendations).

Live domain (to be connected): **chintasmoney.com**

---

## Project structure

```
/                     Marketing site (static)
├── index.html        Landing page
├── styles.css        Landing styles
├── script.js         Landing interactions (nav, form, year)
├── assets/           Logo + PWA icons
├── CNAME             Custom domain for GitHub Pages
├── DEPLOY.md         How to deploy + connect chintasmoney.com (GoDaddy DNS)
└── app/              The product — an installable PWA (single-page app)
    ├── index.html    App shell + service-worker registration + install button
    ├── styles.css    App design system (navy / emerald / gold)
    ├── store.js      Data + "memory" layer: plans, seed trades, and ALL analytics
    │                 (discipline scoring, personality, mistakes, setups, badges).
    │                 Everything the UI reads goes through window.CM so a real
    │                 backend/DB can replace it later without touching the views.
    ├── app.js        Router + all screens + onboarding + coach + CSV import/export
    ├── admin.js      Admin console logic
    ├── admin.html    Admin console (users, subs, editable pricing, flags, usage)
    ├── manifest.webmanifest   PWA manifest (installable app metadata)
    ├── sw.js         Service worker (offline app shell)
    └── assets/       App icons
```

## Screens (all working)
Report Card (home) · Log a Trade · Trade Journal (+ CSV import/export) ·
Mistake Insights · Setup Performance · Discipline Coach · Streaks & Badges ·
Discipline Leaderboard · Shareable Card · Profile & Plan · Admin console.

## Plans (Free / Plus ₹199 / Pro ₹499)
Prices are **configuration** — editable from the admin console, not hard-coded.

## Real vs. mock (be honest with users)
- **Real & computed from your data:** every score, personality, mistake, setup
  stat, badge, journal entry, CSV import/export, and coach answer.
- **Mock (labelled):** other traders on the leaderboard; sample seed trades.
- **Needs a backend (next phase):** real accounts/auth + cross-device sync,
  payment collection, one-tap card image export & share, push/WhatsApp reminders,
  a real global leaderboard, and a real LLM behind the coach. The app is built
  so these slot into `store.js`'s adapter layer without a rewrite.

## Run locally
```
python3 -m http.server 8000
# open http://localhost:8000            (landing)
# open http://localhost:8000/app/       (the app)
```

## Install as an app
Open the app in a mobile/desktop browser and use **Install app** (Add to Home
Screen). It runs standalone and works offline via the service worker.

---
_Not investment advice. F&O trading is risky and most traders lose money._
