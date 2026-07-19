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

/**
 * Report why a Graph call failed, without ever echoing the URL — it carries the
 * access_token as a query parameter. Status plus Graph's own error fields only.
 */
async function logFailure(env: Env, where: string, res: Response): Promise<void> {
  let detail = '';
  try {
    const body = (await res.clone().json()) as { error?: { message?: string; type?: string; code?: number } };
    const e = body.error;
    if (e) detail = `${e.type ?? ''} code=${e.code ?? ''} ${e.message ?? ''}`.trim();
  } catch {
    detail = (await res.clone().text()).slice(0, 160);
  }
  const msg = `${where}: HTTP ${res.status} ${detail}`.trim();
  console.error(`[ig] ${msg}`);
  // Also persist it: /health surfaces this so a failing sync is diagnosable
  // without shell access, and the weekly monitor can report the reason.
  await env.IG.put('last_error', JSON.stringify({ at: new Date().toISOString(), msg }));
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
  if (!res.ok) { await logFailure(env, 'refresh_access_token', res); return; } // skip; /health surfaces stale expiry
  const data = (await res.json()) as { access_token: string; expires_in: number };
  await env.IG.put('token', data.access_token);
  await env.IG.put('token_expires', String(Math.floor(now + data.expires_in)));
  await env.IG.put('last_refresh', String(Math.floor(now)));
}

async function syncMedia(env: Env): Promise<void> {
  const { token } = await getToken(env);
  const res = await fetch(`${GRAPH}/me/media?fields=${MEDIA_FIELDS}&limit=12&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) { await logFailure(env, 'me/media', res); return; } // keep previous media
  const data = (await res.json()) as { data?: Record<string, string>[] };
  if (!data.data?.length) { console.error('[ig] me/media returned no items'); await env.IG.put('last_error', JSON.stringify({ at: new Date().toISOString(), msg: 'me/media returned no items' })); return; }
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
      const itemCount = JSON.parse((await env.IG.get('media')) ?? '[]').length;
      // last_error explains a stalled sync (bad token, revoked scope, empty account)
      const lastError = JSON.parse((await env.IG.get('last_error')) ?? 'null');
      return new Response(JSON.stringify({ tokenExpiresIn, lastSync, itemCount, lastError }), { headers: CORS });
    }

    return new Response('not found', { status: 404 });
  },
};
