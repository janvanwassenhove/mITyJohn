// Genereert de screenshots die in README.md en in de release notes staan.
// Draait tegen de gebouwde app (`npm run build` → dist/) met een lokale
// statische server, zodat wat je ziet exact is wat er gedeployd wordt.
//
// Gebruik:  npm run screenshots
// Output:   docs/screenshots/<naam>.png  (mobiel + desktop, licht + donker)
//
// De browser komt uit PLAYWRIGHT_BROWSERS_PATH (of CHROMIUM_PATH); we
// downloaden nooit een browser vanuit dit script.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const outDir = join(root, 'docs', 'screenshots');
// De app wordt gebouwd met base '/carts/' (deploy onder mityjohn.com/carts/),
// dus serveren we dist/ op datzelfde pad.
const BASE = '/carts/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

function serve(dir) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const rel = decodeURIComponent(url.pathname).replace(BASE, '/');
    let path = join(dir, normalize(rel));
    if (!path.startsWith(dir)) return res.writeHead(403).end();
    if (!existsSync(path) || path.endsWith('/')) path = join(dir, 'index.html');
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function executablePath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (base && existsSync(join(base, 'chromium'))) return join(base, 'chromium');
  return undefined; // laat playwright-core zelf zoeken
}

/** Klik een knop op zijn zichtbare tekst; faalt zacht als hij er niet is. */
async function click(page, name, { optional = false } = {}) {
  const btn = page.getByRole('button', { name, exact: false }).first();
  if (optional && (await btn.count()) === 0) return false;
  await btn.click();
  await page.waitForTimeout(180);
  return true;
}

const VIEWPORTS = {
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  // Desktop op 1× : de beelden gaan mee in de repo, en 2× levert bestanden van
  // bijna een megabyte per screenshot op zonder dat je het ziet in de README.
  desktop: { viewport: { width: 1240, height: 820 }, deviceScaleFactor: 1 },
};

// Elke scène: waar we heen klikken vanaf het startscherm.
const SCENES = [
  { id: 'start', setup: async () => {} },
  {
    id: 'wizard',
    setup: async (page) => {
      await click(page, 'Leer het spel');
    },
  },
  {
    id: 'spel',
    setup: async (page) => {
      await click(page, /Nieuw spel|Start|Verder spelen/);
      await page.waitForTimeout(1400);
    },
  },
  {
    id: 'scorebord',
    setup: async (page) => {
      await click(page, 'Scorebord');
      await page.waitForTimeout(200);
    },
  },
];

async function shoot(browser, { port, scene, device, theme }) {
  const context = await browser.newContext({
    ...VIEWPORTS[device],
    colorScheme: theme,
    locale: 'nl-BE',
    // Zonder dit vangen we soms een kaart midden in de deelanimatie (opacity 0).
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.error('  ! pagefout:', err.message));
  // Taal en thema vooraf vastleggen; de app leest die sleutels bij het opstarten.
  await page.addInitScript(
    ([t]) => {
      localStorage.clear();
      localStorage.setItem('carts.lang', 'nl');
      localStorage.setItem('carts.theme', t);
    },
    [theme],
  );
  await page.goto(`http://127.0.0.1:${port}${BASE}`, { waitUntil: 'networkidle' });
  await scene.setup(page);
  await page.waitForTimeout(250);
  const file = join(outDir, `${scene.id}-${device}-${theme}.png`);
  await page.screenshot({ path: file, fullPage: device === 'desktop' });
  await context.close();
  return file;
}

async function main() {
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('dist/ ontbreekt — draai eerst `npm run build`.');
    process.exit(1);
  }
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const { server, port } = await serve(dist);
  const launch = { args: ['--force-color-profile=srgb', '--hide-scrollbars'] };
  const exe = executablePath();
  if (exe) launch.executablePath = exe;
  const browser = await chromium.launch(launch);

  try {
    for (const scene of SCENES) {
      for (const device of ['mobile', 'desktop']) {
        for (const theme of ['light', 'dark']) {
          const file = await shoot(browser, { port, scene, device, theme });
          console.log('✓', file.replace(root, ''));
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

await main();
