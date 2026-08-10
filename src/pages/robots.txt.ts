// robots.txt, generated so staging can differ from production.
// Production invites crawling; staging forbids all of it, as a second line of
// defence behind Cloudflare Access.
import type { APIRoute } from 'astro';
import { IS_STAGING } from '../lib/drafts';

const production = `User-agent: *
Allow: /

Sitemap: https://mityjohn.com/sitemap-index.xml
`;

const staging = `User-agent: *
Disallow: /
`;

export const GET: APIRoute = () =>
  new Response(IS_STAGING ? staging : production, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
