// Content collections — schemas finalised in Phase 2 (gap-list.md "Final schemas").
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    ogImage: z.string().optional(),
    // Migration provenance — present on the 37 posts imported from WordPress,
    // absent on anything written since. Optional so new posts can be authored
    // by hand without inventing a WordPress id.
    wpId: z.number().optional(),
    wpSlug: z.string().optional(),
    cardTag: z.string().optional(),
    // Draft content still builds, at its real URL, so it can be reviewed before
    // it goes live — but it carries noindex, is kept out of every listing, feed
    // and the sitemap, and is only reachable from /preview/. See PREVIEW.md.
    draft: z.boolean().default(false),
  }),
});

const apps = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/apps' }),
  schema: z.object({
    name: z.string(),
    code: z.string(),
    tag: z.string(),
    cat: z.enum(['music', 'games', 'fun', 'lab']),
    blurb: z.string(),
    repo: z.string().optional(),
    demoUrl: z.string().url().optional(),
    order: z.number().default(99),
    isNew: z.boolean().default(false), // shows a NEW flag on the store card
    wpId: z.number().optional(),
    wpSlug: z.string().optional(),
    draft: z.boolean().default(false), // see the draft note on the blog schema
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    series: z.string(),
    badge: z.string(),
    desc: z.string(),
    // Optional: a book can be announced, with a preview, before it is on sale.
    // BookCard shows the release line instead of a dead Buy button when it is absent.
    buy: z.string().url().optional(),
    releases: z.string().optional(), // human-readable, e.g. "25 August 2026"
    preview: z.string().optional(),
    cover: z.string().optional(),
    order: z.number().default(99),
    isNew: z.boolean().default(false),
    draft: z.boolean().default(false), // see the draft note on the blog schema
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    wpId: z.number().optional(),
    wpSlug: z.string().optional(),
    draft: z.boolean().default(false), // see the draft note on the blog schema
  }),
});

export const collections = { blog, apps, books, pages };
