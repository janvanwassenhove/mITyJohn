// RSS at /rss.xml (§5.1). /feed/ redirects here (astro.config + Cloudflare rule).
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  // Drafts stay out of the feed even in dev: a feed item that escapes is
  // not retractable. Preview drafts in the browser, never here.
  const posts = (await getCollection('blog', (p) => !p.data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
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
