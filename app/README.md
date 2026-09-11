# ChintasMoney — Trader Report Card (MVP app)

A behavioural mirror for traders. Log your trades → get a **Discipline Score**,
your **Trader Personality**, repeating **mistakes**, **streaks & badges**, a
**shareable card**, and an evidence-based **Discipline Coach**.

**It is NOT financial advice.** No buy/sell calls, no tips, no return claims —
which keeps it legal and separate from any advisory business. All value comes
from the trader's *own* logged data, so no paid market feed is needed to launch.

## Files
- `index.html` — SPA shell
- `store.js` — data + memory layer (localStorage now; swap for API/DB later).
  Holds plans, seed trades, and all analytics: discipline scoring, personality,
  mistakes, setup performance, badges. Adapter stubs for broker/CSV import & notifications.
- `styles.css` — design system
- `app.js` — router + views (report card, log, journal, insights, setup
  performance, coach, badges, leaderboard, shareable card, profile) + onboarding
- `admin.html` / `admin.js` — admin console (users, subscriptions, editable
  plan pricing, feature flags, usage, data-source status)

## Real vs. mock
- **Real & computed from your data:** discipline score, personality, mistakes,
  setup performance, badges, journal, coach answers.
- **Mock (labelled):** other leaderboard traders, sample seed trades.
- **Needs backend (next phase):** real accounts/auth + cross-device sync,
  payments/subscriptions, broker/CSV import, card image export, push/WhatsApp
  reminders, a real leaderboard, a real LLM behind the coach.
