// Every decorative drawing on the site, by name. Each is written to
// /flora/<name>.svg at build time (pages/flora/[name].svg.ts) so pages stay
// light and browsers cache the art across pages; Flora.astro and
// HeroFrame.astro place the files as images.
import { swag, bed, vine, sprigMagnolia, sprigJessamine, sprigFern, sprigAzalea, svgDocument, type Arrangement } from './flora';
import { heroBack, heroFront, archBack, archFront } from './hero-art';
import { withBase } from './url';

const builders = {
  swag: () => swag(3),
  bed: () => bed(7),
  vine: () => vine(9),
  'sprig-magnolia': () => sprigMagnolia(11),
  'sprig-jessamine': () => sprigJessamine(12),
  'sprig-fern': () => sprigFern(13),
  'sprig-azalea': () => sprigAzalea(14),
  'hero-back': heroBack,
  'hero-front': heroFront,
  'arch-back': archBack,
  'arch-front': archFront,
} satisfies Record<string, () => Arrangement>;

export type ArtName = keyof typeof builders;
export const artNames = Object.keys(builders) as ArtName[];

const cache = new Map<ArtName, Arrangement>();
/** The arrangement behind a drawing (built once per build). */
export function art(name: ArtName): Arrangement {
  let a = cache.get(name);
  if (!a) {
    a = builders[name]();
    cache.set(name, a);
  }
  return a;
}

/** The drawing as a standalone SVG document. */
export const artFile = (name: ArtName) => svgDocument(art(name));

/** Public URL of the drawing's file. */
export const artUrl = (name: ArtName) => withBase(`/flora/${name}.svg`);

/** The file's view box: [x, y, width, height] in drawing units. */
export const artView = (name: ArtName) => art(name).view ?? ([0, 0, art(name).w, art(name).h] as const);
