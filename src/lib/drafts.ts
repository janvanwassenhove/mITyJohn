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

/**
 * Collection filter: keeps out anything that is not finished *and* anything
 * whose turn has not come.
 *
 * Two different questions. `draft` is the author's switch — not ready, not for
 * anyone. The date is the schedule — ready, but dated later. A series written
 * in advance needs the second one, otherwise taking it out of draft puts every
 * post and every feed item live in the same second, which is not a series.
 *
 * The nightly rebuild (.github/workflows/deploy.yml) is what makes the schedule
 * real: a post appears on the first build after its date. Collections without a
 * date (apps, books) are unaffected.
 *
 * A preview or staging build shows everything, including the future.
 */
export const published = (entry: { data: { draft?: boolean; date?: Date } }): boolean => {
  if (SHOW_DRAFTS) return true;
  if (entry.data.draft) return false;
  return !entry.data.date || entry.data.date.valueOf() <= Date.now();
};
