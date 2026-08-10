# Reviewing before publishing

Nothing reaches mityjohn.com until you have seen it and merged it yourself.

Two tools, for two different moments:

| | What it gives you | When |
|---|---|---|
| `npm run preview:drafts` | the site on your own machine, drafts included | while writing |
| **staging** | the whole site on a private URL, from any device | before publishing |

---

## Marking something as draft

One line in the frontmatter, on any of the four collections (`blog/`, `apps/`,
`books/`, `pages/`):

```yaml
draft: true
```

A production build never emits draft content: no page, no listing entry, no feed
item, no sitemap URL. Publishing is `draft: false`, and the URL does not change —
what you reviewed is the address it ships at.

---

## While writing: local preview

```bash
npm run preview:drafts
```

Builds with drafts and serves from your machine, on the local network too, so a
phone on the same wifi can open it. Start at **`/preview/`** for the list of
everything currently in draft.

---

## Before publishing: staging

Push to the `staging` branch. That builds the complete site — including the cards
app — with drafts included, and deploys it to a Cloudflare Pages project that
sits behind Cloudflare Access. Only the email addresses you allow can open it.

```bash
git switch -c staging      # first time
git push -u origin staging
```

Review it, on whatever device you like. When you are happy:

```bash
git switch main
git merge staging
git push                   # this is the moment it goes public
```

Merging into `main` is the only thing that publishes. Staging never touches
mityjohn.com.

### Staging is fenced off three ways

Access is the lock. The other two are there for the day the lock is
misconfigured:

1. **Cloudflare Access** — login required, per email address.
2. **`noindex` on every page** — nothing can enter a search index.
3. **`robots.txt` disallows everything** — crawlers are told to stay out.

Plus a standing purple banner on every staging page, so you can never mistake it
for the live site. CI refuses to deploy if any of those guards go missing.

To check what staging will look like without deploying:

```bash
npm run build:staging && npx astro preview
```

---

## One-time setup

Do these **in order**. Step 3 must be finished before step 4, or the first
deploy lands on a public URL.

**1. Create the Pages project**

Cloudflare dashboard → Workers & Pages → Create → Pages → *Use direct upload* →
name it `mityjohn-staging`. Do not upload anything.

**2. Create an API token**

My Profile → API Tokens → Create Token → *Custom token*:

- Permission: **Account · Cloudflare Pages · Edit**
- Account resources: your account

Copy the token once.

**3. Lock it with Access — before the first deploy**

Zero Trust → Access → Applications → Add an application → *Self-hosted*:

- Application domain: `mityjohn-staging.pages.dev` (and `*.mityjohn-staging.pages.dev`
  so per-deploy preview URLs are covered too)
- Policy: *Allow*, rule **Emails** → your address. Add anyone else who should
  review here.

Open the URL in a private window and confirm you are asked to log in.

**4. Add the GitHub secrets**

Repo → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — the token from step 2
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare dashboard, right-hand sidebar

**5. Push the branch**

```bash
git switch -c staging
git push -u origin staging
```

The workflow runs, and the site appears at `https://mityjohn-staging.pages.dev`
behind the login.

---

## A note on the public repo

Drafts you *commit* are readable on GitHub even before they are on the website,
because the repo is public. Staging does not change that. For something that
must stay unseen until launch, keep the file out of the repo until it is ready —
the way blog posts are drafted in `mityjohn-content/drafts/`.

---

## Under the hood

`src/lib/drafts.ts` holds both switches: `PREVIEW_DRAFTS` (include drafts) and
`STAGING` (guards on). Every listing filters through its `published` helper, so
there is one place to reason about, and one place to change.
