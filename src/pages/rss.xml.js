// RSS at /rss.xml (§5.1). /feed/ redirects here (astro.config + Cloudflare rule).
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { published } from '../lib/drafts';

export async function GET(context) {
  const posts = (await getCollection('blog', published)).sort(
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
