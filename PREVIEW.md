# Previewing unpublished content

Write a post, an app page, a book or a page, mark it as draft, and review it in
the real site — without any of it reaching mityjohn.com.

## Mark it as draft

Add one line to the frontmatter:

```yaml
draft: true
```

Works on all four collections: `src/content/blog/`, `apps/`, `books/`, `pages/`.

## Look at it

```bash
npm run preview:drafts
```

That builds the site **with** drafts and serves it from your machine. Open the
URL it prints, and start at **`/preview/`** — the list of everything currently
in draft, with a link to each one.

It also listens on your local network, so a phone on the same wifi can open it
at `http://<your-machine-ip>:4321/preview/`. Handy for checking how something
reads on a small screen.

In this build drafts behave exactly like published content: they appear in the
blog index, on the homepage grid, in the store. That is the point — you are
judging the card and the listing, not just the page.

## Publish it

Set `draft: false`, or delete the line, then commit. **The URL does not change**:
the preview already ran at the address the page will ship at.

## What "not visible to others" means here

A normal build — `npm run build`, and therefore every deploy — does not emit
draft content at all:

| | production build | preview build |
|---|---|---|
| Page at its URL | not built | built |
| Blog index, homepage, store | absent | shown |
| RSS, sitemap | absent | present (never deployed) |
| `/preview/` hub | does not exist | built |

Nothing is uploaded, so there is nothing to find. This is stronger than an
"unlisted" URL, where the page is live and merely unlinked — anyone with the
address can read those. Drafts never leave your machine.

Two things to keep in mind:

- **The repo is public.** A draft you *commit* is readable on GitHub even though
  it is not on the website. For something genuinely sensitive, keep the file out
  of the repo until it is ready (see the drafts folder used for blog posts).
- Draft pages also carry `noindex` and a loud orange banner, so a draft can never
  be mistaken for the live page if you leave a preview tab open.

## Under the hood

`src/lib/drafts.ts` holds the single rule. Every listing, feed and route filters
through its `published` helper, so there is one place to reason about — and one
place to change if the policy ever moves.
