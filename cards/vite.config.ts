import { defineConfig } from 'vitest/config';

// Gebouwd voor deploy onder https://mityjohn.com/cards/ (BRIEF §11):
// de GitHub Pages-workflow kopieert cards/dist naar dist/cards van de site.
export default defineConfig({
  base: '/cards/',
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
