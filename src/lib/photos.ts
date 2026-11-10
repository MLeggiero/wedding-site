import type { ImageMetadata } from 'astro';

// Web masters live in src/assets/photos: the engagement photos (made by
// `npm run photos`, named colorgraded-<n>.jpg) and the garden's own photos
// of the venue (garden-<name>.jpg).
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.jpg', { eager: true });

/**
 * The site's photos (chosen with Ally & Mark): alt text and crop focus, plus a
 * credit for photos that aren't theirs (shown in the footer).
 */
const meta: Record<string, { alt: string; focus?: string; credit?: string }> = {
  '20': { alt: 'Mark, on one knee, slides the ring onto Ally’s finger as she smiles', focus: '42% 40%' },
  '35': { alt: 'Ally and Mark smiling together beneath deep pink blossoms', focus: '57% 45%' },
  '40': { alt: 'Ally and Mark smiling, her hand with the engagement ring resting on his chest', focus: '50% 35%' },
  '62': { alt: 'Ally and Mark smiling together on a stone bridge', focus: '55% 40%' },
  'garden-conservatory': {
    alt: 'Inside the glass conservatory at the State Botanical Garden of Georgia',
    focus: '50% 50%',
    credit: 'State Botanical Garden of Georgia',
  },
  'garden-redbud': {
    alt: 'Eastern redbud in bloom at the State Botanical Garden of Georgia',
    focus: '62% 50%',
    credit: 'State Botanical Garden of Georgia',
  },
};

/** Who took the photos that aren't Ally & Mark's own, for the footer. */
export const photoCredits = [...new Set(Object.values(meta).flatMap((m) => (m.credit ? [m.credit] : [])))];

export interface Photo {
  id: string;
  src: ImageMetadata;
  alt: string;
  focus: string;
}

export function photo(id: string): Photo {
  const mod = files[`../assets/photos/${id}.jpg`] ?? files[`../assets/photos/colorgraded-${id}.jpg`];
  if (!mod) throw new Error(`Unknown photo "${id}". Is it in src/assets/photos?`);
  return { id, src: mod.default, alt: meta[id]?.alt ?? '', focus: meta[id]?.focus ?? '50% 50%' };
}
