import { getCollection } from 'astro:content'

/**
 * One definition of "published", used by every page and by the feed.
 *
 * Two gates, not one. `draft` is the author's switch: not finished, not for
 * anyone. `date` is the schedule: finished, but its turn has not come. A series
 * written in advance needs the second one — otherwise "publish" means fourteen
 * posts and fourteen feed items in the same second, which is not a series, it
 * is a dump.
 *
 * The nightly rebuild (.github/workflows/deploy.yml) is what makes the schedule
 * real: each post appears on the first build after its date.
 *
 * In `astro dev` both gates are off, so drafts and future posts are visible
 * while writing. The feed is the one place that never relaxes: an RSS item is
 * not retractable.
 */
export async function publishedPosts(opts: { respectDev?: boolean } = {}) {
  const respectDev = opts.respectDev ?? true
  const now = Date.now()
  return (await getCollection('blog', (p) => {
    if (respectDev && import.meta.env.DEV) return true
    return !p.data.draft && p.data.date.valueOf() <= now
  })).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}
