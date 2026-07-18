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
    wpId: z.number(),
    wpSlug: z.string(),
    cardTag: z.string().optional(),
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
    wpId: z.number().optional(),
    wpSlug: z.string().optional(),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    series: z.string(),
    badge: z.string(),
    desc: z.string(),
    buy: z.string().url(),
    preview: z.string().optional(),
    cover: z.string().optional(),
    order: z.number().default(99),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    wpId: z.number().optional(),
    wpSlug: z.string().optional(),
  }),
});

export const collections = { blog, apps, books, pages };
