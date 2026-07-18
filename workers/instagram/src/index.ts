// Instagram token broker — MIGRATION_BRIEF.md §7.2 / §11.4 (D10).
// KV holds { token, token_expires, media, last_sync }. The GitHub Action holds no
// credentials: it reads GET /instagram (public, whitelisted media JSON, never the token).

export interface Env {
  IG: KVNamespace;
  IG_APP_ID: string;
  IG_APP_SECRET: string;
  IG_TOKEN: string; // bootstrap only; KV is authoritative after first run
}

const GRAPH = 'https://graph.instagram.com';
const MEDIA_FIELDS = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
const CORS = {
  'Access-Control-Allow-Origin': 'https://mityjohn.com', // defence in depth; payload is public anyway
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
};

async function getToken(env: Env): Promise<{ token: string; expires: number }> {
  const token = (await env.IG.get('token')) ?? env.IG_TOKEN;
  const expires = parseInt((await env.IG.get('token_expires')) ?? '0', 10);
  return { token, expires };
}

async function refreshToken(env: Env): Promise<void> {
  const { token, expires } = await getToken(env);
  const now = Date.now() / 1000;
  // Refresh requires the token to be ≥24h old and unexpired; skip rather than fail (§7.2).
  // We track our own writes: skip if we refreshed within the last 24h or token is expired.
  const lastRefresh = parseInt((await env.IG.get('last_refresh')) ?? '0', 10);
  if (now - lastRefresh < 86400) return;
  if (expires && expires < now) return; // expired — manual re-auth needed (§7.1)

  const res = await fetch(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) return; // skip; monitoring surfaces stale expiry via /health
  const data = (await res.json()) as { access_token: string; expires_in: number };
  await env.IG.put('token', data.access_token);
  await env.IG.put('token_expires', String(Math.floor(now + data.expires_in)));
  await env.IG.put('last_refresh', String(Math.floor(now)));
}

async function syncMedia(env: Env): Promise<void> {
  const { token } = await getToken(env);
  const res = await fetch(`${GRAPH}/me/media?fields=${MEDIA_FIELDS}&limit=12&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) return; // keep previous media
  const data = (await res.json()) as { data?: Record<string, string>[] };
  if (!data.data?.length) return;
  // Whitelisted shape only — the token or any signed extras never ride along (R5).
  const media = data.data.map((m) => ({
    id: m.id,
    caption: m.caption ?? '',
    media_type: m.media_type,
    media_url: m.media_url,
    permalink: m.permalink,
    thumbnail_url: m.thumbnail_url,
    timestamp: m.timestamp,
  }));
  await env.IG.put('media', JSON.stringify(media));
  await env.IG.put('last_sync', new Date().toISOString());
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await refreshToken(env);
    await syncMedia(env);
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);

    if (pathname === '/instagram') {
      const media = (await env.IG.get('media')) ?? '[]';
      return new Response(media, { headers: CORS });
    }

    if (pathname === '/health') {
      const expires = parseInt((await env.IG.get('token_expires')) ?? '0', 10);
      const lastSync = (await env.IG.get('last_sync')) ?? null;
      const tokenExpiresIn = expires ? Math.floor((expires - Date.now() / 1000) / 86400) : null;
      return new Response(JSON.stringify({ tokenExpiresIn, lastSync }), { headers: CORS });
    }

    return new Response('not found', { status: 404 });
  },
};
