import { defineConfig } from 'vitest/config';

// Gebouwd voor deploy onder https://mityjohn.com/cards/ (BRIEF §11):
// de GitHub Pages-workflow kopieert cards/dist naar dist/cards van de site.
// Bouwstempel: zo kan je in de app zelf zien welke versie je voor je hebt. Bij
// een melding als "die functie zit er niet in" is dat het eerste dat je wil weten.
const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig({
  base: '/cards/',
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  server: {
    fs: {
      // rulesets/ ligt op repo-niveau (gedeeld met docs/REGELS.md)
      allow: ['..'],
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
