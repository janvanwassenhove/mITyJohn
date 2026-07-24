import { defineConfig } from 'vitest/config';

// Gebouwd voor deploy onder https://mityjohn.com/carts/ (BRIEF §11):
// de GitHub Pages-workflow kopieert carts/dist naar dist/carts van de site.
export default defineConfig({
  base: '/carts/',
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
