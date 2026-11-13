import type { ImageMetadata } from 'astro';

// Web masters live in src/assets/photos: the engagement photos (made by
// `npm run photos`, named colorgraded-<n>.jpg), the garden's own photos of
// the venue (garden-<name>.jpg) and an openly licensed photo of downtown.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.jpg', { eager: true });

/** Who took a photo that isn't Ally & Mark's own, and under what terms (shown in the footer). */
export interface Credit {
  /** what the photo shows, as the footer names it */
  what: string;
  who: string;
  /** where the photo comes from */
  url?: string;
  license?: string;
  licenseUrl?: string;
  /** how it was changed, if the license asks us to say */
  changes?: string;
}

const GARDEN: Credit = { what: 'Garden photos', who: 'State Botanical Garden of Georgia' };

/**
 * The site's photos (chosen with Ally & Mark): alt text and crop focus, plus a
 * credit for photos that aren't theirs.
 */
const meta: Record<string, { alt: string; focus?: string; credit?: Credit }> = {
  '20': { alt: 'Mark, on one knee, slides the ring onto Ally’s finger as she smiles', focus: '42% 40%' },
  '35': { alt: 'Ally and Mark smiling together beneath deep pink blossoms', focus: '57% 45%' },
  '40': { alt: 'Ally and Mark smiling, her hand with the engagement ring resting on his chest', focus: '50% 35%' },
  '62': { alt: 'Ally and Mark smiling together on a stone bridge', focus: '55% 40%' },
  'garden-conservatory': {
    alt: 'Inside the glass conservatory at the State Botanical Garden of Georgia',
    focus: '50% 50%',
    credit: GARDEN,
  },
  'garden-redbud': {
    alt: 'Eastern redbud in bloom at the State Botanical Garden of Georgia',
    focus: '62% 50%',
    credit: GARDEN,
  },
  'downtown-athens': {
    alt: 'Old brick storefronts in downtown Athens under a blue sky, with a faded painted sign for Charles Parrott and Associates',
    focus: '56% 50%',
    credit: {
      what: 'Downtown photo',
      who: 'GAgayle',
      url: 'https://commons.wikimedia.org/wiki/File:Downtown_Athens,_GA.jpg',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      changes: 'cropped',
    },
  },
};

/** Who took the photos that aren't Ally & Mark's own, for the footer (each credit once). */
export const photoCredits: Credit[] = [...new Map(Object.values(meta).flatMap((m) => (m.credit ? [[m.credit.what + m.credit.who, m.credit] as const] : []))).values()];

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
