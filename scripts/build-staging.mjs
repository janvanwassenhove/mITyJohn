// Build exactly what the staging workflow builds, locally, so you can inspect
// the output before any of it is deployed.
//
//   npm run build:staging && npx astro preview
//
// Sets the same two flags CI does: drafts included, staging guards on.
process.env.STAGING = '1';
process.env.PREVIEW_DRAFTS = '1';
const { build } = await import('astro');
await build({});
