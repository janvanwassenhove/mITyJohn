// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/** Markdown images: lazy-load + async decode, and width/height parsed from the
 *  WordPress `-WxH` filename suffix so layout doesn't shift (N5: CLS/LCP). */
function rehypeImgAttrs() {
  /** @param {any} node @param {(n: any) => void} fn */
  const walk = (node, fn) => { fn(node); (node.children ?? []).forEach((c) => walk(c, fn)); };
  return (/** @type {any} */ tree) => walk(tree, (n) => {
    if (n.type === 'element' && n.tagName === 'img') {
      n.properties.loading ??= 'lazy';
      n.properties.decoding ??= 'async';
      const m = String(n.properties.src ?? '').match(/-(\d+)x(\d+)\.\w+$/);
      if (m) { n.properties.width ??= m[1]; n.properties.height ??= m[2]; }
    }
  });
}

// https://astro.build/config
export default defineConfig({
  site: 'https://mityjohn.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
  redirects: {
    // /feed/ mirrors /rss.xml (§5.1). Cloudflare 301s this at the edge post-cutover;
    // this static fallback covers direct-to-origin traffic.
    '/feed/': '/rss.xml',
    '/apps/': '/#apps', // store lives on the home page (implied IA); detail pages are /apps/{slug}/
  },
  markdown: { rehypePlugins: [rehypeImgAttrs] },
  vite: { plugins: [tailwindcss()] },
});
