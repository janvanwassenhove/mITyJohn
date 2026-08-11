// RSS at /rss.xml (§5.1). /feed/ redirects here (astro.config + Cloudflare rule).
import rss from '@astrojs/rss';
import { publishedPosts } from '../lib/posts';

export async function GET(context) {
  // Drafts and not-yet-due posts stay out of the feed even in dev: a feed
  // item that escapes is not retractable. Preview them in the browser, never
  // here — hence respectDev: false.
  const posts = await publishedPosts({ respectDev: false });
  return rss({
    title: 'mITy.John',
    description:
      "Field notes from the software archeologist's lab — AI, software delivery, music tech and retro IT.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
