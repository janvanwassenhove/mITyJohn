// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import imageDims from './src/data/image-dims.json' with { type: 'json' };

/** Markdown images: lazy-load + async decode, and width/height so layout doesn't
 *  shift (N5: CLS/LCP). Most WordPress uploads carry their size in the filename
 *  (`-1024x585.webp`); the originals do not, so those fall back to measured
 *  dimensions from scripts/build-image-dims.mjs. */
function rehypeImgAttrs() {
  /** @param {any} node @param {(n: any) => void} fn */
  const walk = (node, fn) => { fn(node); (node.children ?? []).forEach((c) => walk(c, fn)); };
  return (/** @type {any} */ tree) => walk(tree, (n) => {
    if (n.type === 'element' && n.tagName === 'img') {
      n.properties.loading ??= 'lazy';
      n.properties.decoding ??= 'async';
      const src = String(n.properties.src ?? '');
      const m = src.match(/-(\d+)x(\d+)\.\w+$/);
      const wh = m ? [m[1], m[2]] : imageDims[src.split('?')[0]];
      if (wh) { n.properties.width ??= wh[0]; n.properties.height ??= wh[1]; }
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
