import type { ImageMetadata } from 'astro';

// Web masters live in src/assets/photos (made by `npm run photos`).
const files = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/photos/colorgraded-*.jpg',
  { eager: true },
);

/** The site's four photos (chosen with Ally & Mark): alt text + crop focus. */
const meta: Record<string, { alt: string; focus?: string }> = {
  '20': { alt: 'Mark, on one knee, slides the ring onto Ally’s finger as she smiles', focus: '42% 40%' },
  '35': { alt: 'Ally and Mark smiling together beneath deep pink blossoms', focus: '57% 45%' },
  '40': { alt: 'Ally and Mark smiling, her hand with the engagement ring resting on his chest', focus: '50% 35%' },
  '62': { alt: 'Ally and Mark smiling together on a stone bridge', focus: '55% 40%' },
};

export interface Photo {
  id: string;
  src: ImageMetadata;
  alt: string;
  focus: string;
}

export function photo(id: string): Photo {
  const mod = files[`../assets/photos/colorgraded-${id}.jpg`];
  if (!mod) throw new Error(`Unknown photo "${id}". Is src/assets/photos/colorgraded-${id}.jpg there?`);
  return { id, src: mod.default, alt: meta[id]?.alt ?? '', focus: meta[id]?.focus ?? '50% 50%' };
}
