// Legacy WordPress query-string redirects — MIGRATION_BRIEF.md §5.3.
//
// Why a Worker and not Bulk Redirects: Cloudflare Bulk Redirects cannot match a
// query string in the source URL, and 110 of our 112 legacy URLs are exactly
// that (/?p=941, /?page_id=2, /?tag=ai, ...). Redirect Rules would need one rule
// per mapping, far past the free-plan limit. A Worker on the root route handles
// all of them from one generated table.
//
// The route is `mityjohn.com/` (root only), so ordinary page requests never
// touch this Worker — only the homepage, which is where every legacy URL lives.
// A same-zone fetch() cannot re-enter a Worker route, so the pass-through below
// reaches GitHub Pages rather than looping.

import MAP from './map.json';

type RedirectMap = Record<string, Record<string, string>>;

// Query keys we answer for, in the order WordPress used them.
const KEYS = ['p', 'page_id', 'cat', 'category_name', 'tag', 'author', 'feed'] as const;

// Always land on the canonical apex over HTTPS. Without this, a hit on
// http://… or www.… would 301 to a target that keeps the wrong scheme/host and
// then need a second redirect to get canonical — two hops where one will do.
const CANONICAL = 'https://mityjohn.com';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // The route has to be /* (Cloudflare route patterns cannot express "root
    // with a query string"), so bail out immediately for everything else. Posts,
    // apps and the uploads never pay for a lookup.
    if (url.pathname !== '/') return fetch(request);
    if (!url.search) return fetch(request);

    const map = MAP as RedirectMap;

    for (const key of KEYS) {
      const value = url.searchParams.get(key);
      if (value === null) continue;
      const target = map[key]?.[value];
      if (target) {
        return Response.redirect(new URL(target, CANONICAL).toString(), 301);
      }
    }

    // No legacy parameter we recognise — hand the request to the origin.
    return fetch(request);
  },
};
