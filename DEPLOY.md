# Deploying ChintasMoney to chintasmoney.com

The simplest free option for this static site is **GitHub Pages** with your
GoDaddy domain pointed at it. Here's the full path.

## 1. Enable GitHub Pages
1. Push this branch and merge it to your default branch (usually `main`).
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Branch: `main`, folder: `/ (root)`. Save.
5. The `CNAME` file in this repo already contains `chintasmoney.com`, so Pages
   will use that as the custom domain automatically.

## 2. Point the GoDaddy domain at GitHub Pages
Log in to GoDaddy → **My Products → chintasmoney.com → DNS**.

**A) Apex domain (chintasmoney.com)** — add four `A` records:

| Type | Name | Value           |
|------|------|-----------------|
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |

(Optional, IPv6 — add if GoDaddy lets you add `AAAA`:)
`2606:50c0:8000::153`, `...8001::153`, `...8002::153`, `...8003::153`

**B) www subdomain** — add one `CNAME`:

| Type  | Name | Value                          |
|-------|------|--------------------------------|
| CNAME | www  | <your-github-username>.github.io |

> Delete any existing GoDaddy "Parked"/forwarding A record on `@` first, or it
> will conflict. Remove GoDaddy Domain Forwarding if it's on.

## 3. Enforce HTTPS
DNS can take 15 minutes to a few hours to propagate. Once GitHub verifies the
domain (Settings → Pages shows a green check), tick **Enforce HTTPS**.

## 4. Add the logo
Save the logo image into this repo as `assets/logo.png` (PNG with transparent
background works best). The header already references it and falls back to a
text wordmark until the file exists.

---

### Alternative hosts (also work with a static site)
- **Netlify** or **Vercel**: import the repo, then in their dashboard add the
  custom domain `chintasmoney.com`; they give you the exact GoDaddy records to
  paste (usually one `A`/`ALIAS` + a `www` `CNAME`).
- **Cloudflare Pages**: connect repo, add domain; Cloudflare can also manage DNS
  if you move the nameservers.

Tell me which host you prefer and I can tailor the exact records.
