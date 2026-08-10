// Draft visibility, in one place.
//
// A production build (`npm run build`, and therefore every deploy) NEVER emits
// draft content: no page, no listing entry, no feed item, no sitemap URL. There
// is nothing to leak, because nothing is uploaded.
//
// A preview build (`npm run preview:drafts`) sets PREVIEW_DRAFTS=1 and includes
// drafts, then serves the result from your own machine. It is reachable on your
// local network — your phone on the same wifi can open it — and nowhere else.
export const SHOW_DRAFTS = process.env.PREVIEW_DRAFTS === '1';

// Staging: the whole site, drafts included, deployed to a Cloudflare Pages URL
// that sits behind Cloudflare Access. Set by .github/workflows/staging.yml.
// Everything it renders carries noindex and a standing banner, so a staging tab
// can never be mistaken for the live site — and so a misconfigured Access policy
// still does not put unpublished work into search results.
export const IS_STAGING = process.env.STAGING === '1';

/** Collection filter: keeps drafts out unless this is a preview build. */
export const published = (entry: { data: { draft?: boolean } }): boolean =>
  SHOW_DRAFTS || !entry.data.draft;
