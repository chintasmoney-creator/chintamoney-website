# ChintasMoney — Backend setup (accounts + database + payments)

This turns ChintasMoney from "great free tool" into a **real business**: users log
in, their data is saved to their account (synced across devices), and they can
**pay** for Plus/Pro. It uses **Supabase** (free accounts + database) and
**Razorpay** (payments) — **no server for you to run or maintain.**

The app already ships with all the code. You just create two free accounts and
paste 3 keys into `app/config.js`. Do it when you're ready — until then the app
keeps working offline exactly as now.

> I (Claude) can't create these accounts for you — they're yours and need your
> email/phone/KYC. But every step below is exact, and I'll guide you live if you
> get stuck.

---

## Part A — Accounts + database (Supabase) · ~10 min

1. Go to **https://supabase.com** → **Start your project** → sign in with your
   Google/GitHub or email.
2. **New project** → name it `chintasmoney` → set a database password (save it) →
   choose a region near India (e.g. Mumbai / Singapore) → **Create**.
3. Wait ~2 min for it to provision.
4. **SQL Editor** (left menu) → **New query** → open the file
   **`supabase-schema.sql`** from this repo, copy everything, paste, click **Run**.
   You should see "Success".
5. **Project Settings → API**. Copy these two:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (a long string — this one is safe in the browser)
6. **Authentication → Providers**:
   - **Email** is on by default. (Optional: turn off "Confirm email" while testing
     so signups log in instantly.)
   - (Optional) Enable **Google** for one-tap login.

## Part B — Payments (Razorpay) · ~10 min + KYC

1. Go to **https://razorpay.com** → **Sign up** with your business details.
2. Complete **KYC** (PAN, bank account) — required before you can accept real
   money. You can test first in **Test Mode** without full KYC.
3. **Settings → API Keys → Generate Key**. Copy the **Key Id** (starts with
   `rzp_test_` in test mode or `rzp_live_` once live). *Do NOT put the secret in
   the app* — only the Key Id goes in `config.js`.

## Part C — Wire the keys · 2 min

Open **`app/config.js`** and fill in:

```js
window.CM_CONFIG = {
  cloud: true,                                  // ← turn ON
  supabaseUrl: "https://xxxx.supabase.co",      // from Part A step 5
  supabaseAnonKey: "eyJhbGciOi...",             // from Part A step 5
  razorpayKeyId: "rzp_test_XXXXXXXX",           // from Part B step 3
  planPrices: { plus: 19900, pro: 49900 },      // ₹199 / ₹499 in paise
  enableGoogle: true
};
```

Save, then **re-deploy** (upload the site zip to Cloudflare as usual).

## What now works
- **chintasmoney.com/app** shows a **login / signup** screen.
- Each user's trades, dreams, streaks and plan are **saved to their account** and
  sync across devices.
- The **Subscribe** buttons open **Razorpay checkout** and collect ₹199 / ₹499.

---

## Important: make payments tamper-proof (do this before going live for real money)
For speed, the app grants the plan right after Razorpay's success callback. That's
fine for testing, but a determined user could fake it. Before charging real money,
add a **Supabase Edge Function** that verifies Razorpay's webhook signature and
sets the plan server-side. Ping me and I'll write that function for you (it's ~40
lines) and the exact deploy command.

## Costs
- **Supabase Free**: up to 50,000 monthly active users, 500 MB database — plenty
  to start, ₹0.
- **Razorpay**: no monthly fee; they take ~2% per successful payment.
- **Cloudflare Pages**: ₹0.

So you can launch and earn on **₹0 of fixed cost** — you only pay Razorpay's cut
when you actually get paid.
