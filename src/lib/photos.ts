import type { ImageMetadata } from 'astro';

// Web masters live in src/assets/photos (made by `npm run photos`).
const files = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/photos/colorgraded-*.jpg',
  { eager: true },
);

/** Alt text + crop focus (CSS object-position) for each engagement photo. */
const meta: Record<string, { alt: string; focus?: string }> = {
  '07': { alt: 'Mark mid-tumble on the lawn while Ally laughs in the grass', focus: '52% 70%' },
  '08': { alt: 'Mark walks toward Ally beneath a stand of tall trees', focus: '45% 40%' },
  '10': { alt: 'Mark down on one knee as Ally lifts a hand to her face', focus: '47% 50%' },
  '12': { alt: 'Mark on one knee, holding out a ring to Ally', focus: '43% 45%' },
  '13': { alt: 'Ally and Mark kiss beneath tall trees, a white glasshouse behind them', focus: '40% 35%' },
  '15': { alt: 'Mark slides the ring onto Ally’s finger', focus: '50% 35%' },
  '16': { alt: 'Mark slips the ring onto Ally’s finger as she beams, a white glasshouse behind them', focus: '50% 30%' },
  '18': { alt: 'Ally and Mark laughing together', focus: '55% 35%' },
  '19': { alt: 'Black-and-white photo of Ally and Mark laughing together' },
  '20': { alt: 'Mark kneels and holds Ally’s hand on a sunlit lawn' },
  '22': { alt: 'Black-and-white photo of Mark kneeling as Ally laughs' },
  '23': { alt: 'Ally laughs, hand to her face, as Mark holds her other hand' },
  '31': { alt: 'Ally and Mark face each other beneath deep pink cherry blossoms' },
  '33': { alt: 'Ally and Mark smile at each other under deep pink cherry blossoms' },
  '35': { alt: 'Ally and Mark smile at the camera under pink cherry blossoms' },
  '36': { alt: 'Ally and Mark beneath a cloud of pink cherry blossoms' },
  '37': { alt: 'Ally and Mark stand beneath a flowering cherry tree' },
  '38': { alt: 'Mark kisses Ally among blossoming cherry trees' },
  '39': { alt: 'Ally leans into Mark beneath cherry branches, a sprig of blossoms in hand' },
  '41': { alt: 'Ally and Mark smile among the cherry trees' },
  '43': { alt: 'Mark kisses Ally’s forehead under the cherry trees' },
  '46': { alt: 'Ally and Mark close together beneath blossoms, holding cherry sprigs' },
  '48': { alt: 'Mark laughs with Ally beneath pale blossoms' },
  '52': { alt: 'Ally and Mark beam in front of pale pink blossoms' },
  '54': { alt: 'Ally and Mark gaze at each other in front of pale blossoms' },
  '55': { alt: 'Ally and Mark beneath a flowering tree in full bloom', focus: '50% 45%' },
  '56': { alt: 'Ally and Mark share a look beneath a tree in full bloom', focus: '50% 45%' },
  '58': { alt: 'Mark holds Ally close in front of pale blossoms' },
  '59': { alt: 'Ally and Mark at the far end of an old stone bridge lined with spring trees', focus: '50% 60%' },
  '61': { alt: 'Ally and Mark smile on a stone bridge', focus: '58% 40%' },
  '62': { alt: 'Ally and Mark lean together on a stone bridge', focus: '55% 40%' },
};

export interface Photo {
  id: string;
  src: ImageMetadata;
  alt: string;
  focus: string;
}

export function photo(id: string): Photo {
  const mod = files[`../assets/photos/colorgraded-${id}.jpg`];
  if (!mod) throw new Error(`Unknown photo "${id}" — is src/assets/photos/colorgraded-${id}.jpg there?`);
  return { id, src: mod.default, alt: meta[id]?.alt ?? '', focus: meta[id]?.focus ?? '50% 50%' };
}
