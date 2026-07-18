// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
  vite: { plugins: [tailwindcss()] },
});
