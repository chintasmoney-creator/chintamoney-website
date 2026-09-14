# Deploying ChintasMoney to chintasmoney.com (Cloudflare)

Domain **chintasmoney.com** stays registered at **GoDaddy**. We point it to
**Cloudflare** and host the static site free on **Cloudflare Pages**.

Result: `chintasmoney.com` → landing page · `chintasmoney.com/app/` → the app ·
free SSL/HTTPS automatically.

There is **no build step** — it's plain HTML/CSS/JS, so Cloudflare just serves
the repo as-is.

---

## Step 1 — Get the code onto a deployable branch
Cloudflare Pages deploys from a GitHub branch (usually `main`). Right now the
code is on `claude/bold-gauss-yvwu9i`. Merge it to `main` first (I can open a
pull request for this when you say so).

## Step 2 — Add your domain to Cloudflare
1. Sign in at **dash.cloudflare.com** → **Add a site** → type `chintasmoney.com`.
2. Choose the **Free** plan.
3. Cloudflare scans your existing DNS and shows you **2 nameservers**, e.g.
   `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`. **Copy them.**

## Step 3 — Point GoDaddy at Cloudflare (change nameservers)
1. GoDaddy → **My Products → chintasmoney.com → DNS → Nameservers**.
2. Choose **Change / Enter my own nameservers**.
3. Replace GoDaddy's nameservers with the **2 Cloudflare nameservers** from Step 2.
4. Save. (Propagation is usually minutes, up to a few hours. Cloudflare emails
   you when the domain is **Active**.)

> After this, you manage all DNS inside **Cloudflare**, not GoDaddy. Also turn
> **off** any GoDaddy "Domain Forwarding / Parking" so it doesn't conflict.

## Step 4 — Deploy the site on Cloudflare Pages
1. Cloudflare dash → **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize GitHub and pick the repo **chintasmoney-creator/chintamoney-website**.
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
   - Production branch: `main`
4. **Save and Deploy.** You'll get a temporary URL like
   `chintamoney-website.pages.dev` — open it to confirm the site works.

## Step 5 — Attach chintasmoney.com to the Pages project
1. In the Pages project → **Custom domains → Set up a custom domain**.
2. Add `chintasmoney.com` and also `www.chintasmoney.com`.
3. Because Cloudflare now runs your DNS, it creates the records automatically and
   issues SSL. Within a few minutes **https://chintasmoney.com** is live.

That's it. Every time you push to `main`, Cloudflare redeploys automatically.

---

## Notes
- The repo's `CNAME` file is only used by **GitHub** Pages — Cloudflare Pages
  ignores it, so it does no harm. (If we ever switch to GitHub Pages instead,
  it's already set.)
- **Logo:** drop the real image in as `assets/logo.png` (and `app/assets/logo.png`
  for the app) — the headers already reference it and fall back to a text mark
  until the file exists.

## What I can and can't do
- I **can**: prepare the repo, merge to `main`, and open the pull request.
- I **can't**: log into your Cloudflare or GoDaddy accounts. Steps 2, 3, and the
  Cloudflare Pages setup happen in your browser — but they take ~10 minutes and
  the steps above are exact. Ping me if any screen looks different and I'll guide
  you through it.
