import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const essays = defineCollection({
  loader: glob({
    base: "./essays",
    pattern: "**/*.md",
    generateId: ({ data }) => String(data.slug),
  }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string(),
    description: z.string(),
    topic: z.enum(["instrument", "tuning", "expression"]),
    order: z.number(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { essays };
