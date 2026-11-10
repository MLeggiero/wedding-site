// Editable site content lives in src/content/*.yaml. The schemas below catch
// typos at build time (a missing field fails the build instead of the page).
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const chapters = defineCollection({
  loader: file('src/content/chapters.yaml'),
  schema: z.object({ kicker: z.string(), title: z.string(), body: z.string() }),
});


const places = defineCollection({
  loader: file('src/content/places.yaml'),
  schema: z.object({
    name: z.string(),
    category: z.enum(['Wander', 'Eat', 'Coffee', 'Drink', 'Music', 'Saturday', 'Shop']),
    note: z.string(),
    area: z.string().optional(),
    /** Google Maps search text; defaults to "<name>, Athens, GA". */
    map: z.string().optional(),
  }),
});

const faq = defineCollection({
  loader: file('src/content/faq.yaml'),
  schema: z.object({ question: z.string(), answer: z.string() }),
});

const charities = defineCollection({
  loader: file('src/content/charities.yaml'),
  schema: z.object({ name: z.string(), blurb: z.string(), url: z.string(), ein: z.string().optional() }),
});

export const collections = { chapters, places, faq, charities };
