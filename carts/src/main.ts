import './styles.css';
import {
  LOCALES,
  detectLocale,
  getLocale,
  onLocaleChange,
  setLocale,
  t,
  type Locale,
} from './i18n';
import { THEMES, applyTheme, getTheme, initTheme, type Theme } from './theme';
import { getRuleset } from './ruleset';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app ontbreekt');

const ruleset = getRuleset('vlaams-standaard');

function segButton(label: string, pressed: boolean, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.setAttribute('aria-pressed', String(pressed));
  btn.addEventListener('click', onClick);
  return btn;
}

function render(): void {
  if (!app) return;
  app.replaceChildren();

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Topbar met taal- en themaswitch (§8-demonstratie)
  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML =
    '<div class="brand">Carts' +
    '<span class="suits" aria-hidden="true">' +
    '<span class="suit-black">♠</span><span class="suit-red">♥</span>' +
    '<span class="suit-black">♣</span><span class="suit-red">♦</span>' +
    '</span></div>';

  const controls = document.createElement('div');
  controls.className = 'controls';

  const langGroup = document.createElement('div');
  langGroup.className = 'control-group';
  langGroup.innerHTML = `<span>${t('controls.language')}</span>`;
  const langSeg = document.createElement('div');
  langSeg.className = 'seg';
  langSeg.setAttribute('role', 'group');
  langSeg.setAttribute('aria-label', t('controls.language'));
  for (const locale of LOCALES) {
    langSeg.append(
      segButton(locale.toUpperCase(), getLocale() === locale, () => setLocale(locale as Locale)),
    );
  }
  langGroup.append(langSeg);

  const themeGroup = document.createElement('div');
  themeGroup.className = 'control-group';
  themeGroup.innerHTML = `<span>${t('controls.theme')}</span>`;
  const themeSeg = document.createElement('div');
  themeSeg.className = 'seg';
  themeSeg.setAttribute('role', 'group');
  themeSeg.setAttribute('aria-label', t('controls.theme'));
  const themeLabels: Record<Theme, string> = {
    light: t('theme.light'),
    dark: t('theme.dark'),
    system: t('theme.system'),
  };
  for (const theme of THEMES) {
    themeSeg.append(
      segButton(themeLabels[theme], getTheme() === theme, () => {
        applyTheme(theme);
        render();
      }),
    );
  }
  themeGroup.append(themeSeg);

  controls.append(langGroup, themeGroup);
  header.append(controls);

  // Placeholder-inhoud
  const main = document.createElement('main');
  main.className = 'card';
  const phase = document.createElement('span');
  phase.className = 'phase';
  phase.textContent = t('app.phase');
  const h1 = document.createElement('h1');
  h1.textContent = t('placeholder.heading');
  const tagline = document.createElement('p');
  tagline.className = 'tagline';
  tagline.textContent = t('app.tagline');
  const body = document.createElement('p');
  body.textContent = t('placeholder.body');
  main.append(phase, h1, tagline, body);

  if (ruleset) {
    const info = document.createElement('p');
    info.className = 'ruleset';
    info.textContent = t('placeholder.ruleset', {
      name: ruleset.name[getLocale()],
      version: ruleset.version,
      contracts: ruleset.contracts.length,
    });
    const rules = document.createElement('p');
    rules.className = 'ruleset';
    rules.innerHTML = t('placeholder.rules').replace(
      'docs/REGELS.md',
      '<code>docs/REGELS.md</code>',
    );
    main.append(info, rules);
  }

  wrap.append(header, main);
  app.append(wrap);
}

initTheme();
setLocale(detectLocale());
onLocaleChange(render);
render();
