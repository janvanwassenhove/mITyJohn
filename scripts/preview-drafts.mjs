// Local preview WITH drafts. Nothing here is ever deployed: production builds
// run `astro build` without PREVIEW_DRAFTS, so draft content is not emitted.
//
//   npm run preview:drafts
//
// Serves on your machine and on the local network, so a phone on the same wifi
// can open it. Start at /preview/ for the list of everything in draft.
process.env.PREVIEW_DRAFTS = '1';
const { build, preview } = await import('astro');
await build({});
const server = await preview({ server: { host: true } });
console.log(`\n  drafts included · open http://localhost:${server.port}/preview/\n`);
