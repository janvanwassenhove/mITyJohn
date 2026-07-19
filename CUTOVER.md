# CUTOVER.md — Phase 7 runbook

Everything automatable is done and deployed (see git log). This file is the ordered
checklist for the steps that need Jan's logins or the cutover decision itself.
Companion spec: MIGRATION_BRIEF.md §7 (Instagram), §5.3 (redirects), §11.5 (repo), Phase 7.

## Already done (for the record)

- [x] Site builds + deploys via Actions; live at <https://janvanwassenhove.github.io/mITyJohn/>
  (root-relative links won't navigate on that URL — expected until the custom domain binds;
  use `npm run preview` for a faithful local view)
- [x] GitHub Pages enabled (source: GitHub Actions)
- [x] Secret scanning + push protection, Dependabot alerts
- [x] Default workflow permissions read-only; fork-PR runs need approval
- [x] Branch protection on `main` (CI `build` check required; self-merge allowed)
- [x] `cloudflare-redirects.csv` generated (112 rules) from `url-map.json`
- [x] Sync workflows (releases daily + dispatch, instagram daily, health weekly)

## A. Any time before cutover

### A1. Giscus (comments)
Discussions are enabled and the repo/category IDs are already wired into
`src/components/Giscus.astro`. Two clicks remain:
1. Install <https://github.com/apps/giscus> on the repo.
2. Flip `ENABLED` to `true` in `src/components/Giscus.astro`. Commit.

### A2. Instagram Worker (D10 — token broker)
1. developers.facebook.com → app → add **Instagram** product; note App ID + Secret.
2. One-off OAuth (localhost redirect is fine) → short-lived token → exchange for
   **long-lived token** (§7.1).
3. In `workers/instagram/`:
   ```
   wrangler login
   wrangler kv namespace create IG     # paste id into wrangler.toml
   wrangler secret put IG_APP_ID
   wrangler secret put IG_APP_SECRET
   wrangler secret put IG_TOKEN
   wrangler deploy
   ```
4. Confirm `https://ig.mityjohn.workers.dev/health` responds; run the
   **Sync Instagram** workflow manually once. (If the worker URL differs, update
   `IG_WORKER_URL` in `.github/workflows/sync-instagram.yml` and §7.4's health URL
   in `ig-health.yml`.)
   Until this is set up, the weekly health workflow opens a Monday reminder issue —
   working as designed; disable the workflow if it annoys.

### A3. Legacy analytics
- Export 12 months of GA data to CSV, archive offline (DoD item). No GA on the new site.

## B. Cutover day (order matters)

1. **Verify build**: latest Deploy run green; spot-check `npm run preview` locally.
2. **CNAME**: add `public/CNAME` containing `mityjohn.com`, commit, push
   (the deploy adds the domain to Pages). In repo Settings → Pages, confirm the
   custom domain and **Enforce HTTPS** once the cert is issued.
3. **DNS** at the registrar / Cloudflare: apex → GitHub Pages A records
   (185.199.108.153 / .109 / .110 / .111) + `www` CNAME → `janvanwassenhove.github.io`,
   **proxied (orange cloud)**.
4. **Cloudflare rules**:
   - SSL/TLS → **Full (strict)** *before* enabling the proxy, or you get a loop
   - DNS → apex + `www` to **orange cloud**. The redirect Worker only sees
     proxied traffic, so nothing redirects until this is on.
   - Bulk Redirects → create list from `cloudflare-redirects.csv` → enable
     (301, preserve query string OFF, subpath matching OFF). This file now holds
     only the two `/feed/` rules and has **no header row**.
   - The 110 query-string redirects are served by `workers/redirects` (already
     deployed, route `mityjohn.com/`) — Bulk Redirects cannot match query
     strings. See MIGRATION_BRIEF §5.3.
   - Always Use HTTPS + Automatic HTTPS Rewrites
   - `www.mityjohn.com` → apex redirect
   - Enable **Web Analytics** (cookieless — no banner, per D5)
5. **Assert redirects**: `node scripts/assert-redirects.mjs 20` — all 20 must pass.
6. **Search Console**: submit `https://mityjohn.com/sitemap-index.xml`; "Validate fix"
   on anything flagged.
7. **WordPress**: switch off but **do not delete** for 30 days; keep full DB + uploads
   backup offline.
8. Check the `hipster.mityjohn.com` subdomain (linked from a post) — decide whether it
   keeps its DNS record after the move.

## C. Post-cutover monitoring (8 weeks)

- Weekly: Search Console Coverage + Performance. Done when: zero unexpected 404s after
  14 days, impressions back to baseline (Phase 7 done-when).
- The nightly Deploy rebuild keeps synced data (releases/instagram) flowing to the site.
