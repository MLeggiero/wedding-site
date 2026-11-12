// Every decorative drawing on the site, by name (plants, and the mushrooms
// and insects among them). Each is written to
// /flora/<name>.svg at build time (pages/flora/[name].svg.ts) so pages stay
// light and browsers cache the art across pages; Flora.astro and
// HeroFrame.astro place the files as images. A drawing with swaying parts
// also gets <name>--base.svg (the still part) and <name>--sway-<n>.svg (one
// file per part), so each part can move on its own.
import {
  corner, cornerLow, vine, sprigMagnolia, sprigDogwood, sprigFern, sprigMaypop, divider,
  svgDocument, baseDocument, swayDocument, swayView, type Arrangement,
} from './flora';
import { heroBack, heroFront, archBack, archFront } from './hero-art';
import { floorMorels, floorLog, floorChanterelles, butterflyWingsArt as wings, butterflyBodyArt as body, fritillaryClosedWingsArt, fritillaryClosedBodyArt } from './woodland';
import { withBase } from './url';

const builders = {
  corner,
  'corner-low': cornerLow,
  vine,
  'sprig-magnolia': sprigMagnolia,
  'sprig-dogwood': sprigDogwood,
  'sprig-fern': sprigFern,
  'sprig-maypop': sprigMaypop,
  divider,
  'hero-back': heroBack,
  'hero-front': heroFront,
  'arch-back': archBack,
  'arch-front': archFront,
  // the forest floor at the foot of a section, laid over corner-low
  'floor-morels': floorMorels,
  'floor-log': floorLog,
  'floor-chanterelles': floorChanterelles,
  // butterflies and a moth, wings and body apart
  'tiger-swallowtail-wings': () => wings('tiger-swallowtail'),
  'tiger-swallowtail-body': () => body('tiger-swallowtail'),
  'luna-moth-wings': () => wings('luna-moth'),
  'luna-moth-body': () => body('luna-moth'),
  'gulf-fritillary-wings': () => wings('gulf-fritillary'),
  'gulf-fritillary-body': () => body('gulf-fritillary'),
  'gulf-fritillary-closed-wings': fritillaryClosedWingsArt,
  'gulf-fritillary-closed-body': fritillaryClosedBodyArt,
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

/** Every file to write: the whole drawing, and for swaying drawings the still base and each part. */
export function artFiles(): { file: string; body: () => string }[] {
  return artNames.flatMap((name) => {
    const a = art(name);
    const sways = a.sway ?? [];
    return [
      { file: name, body: () => svgDocument(a) },
      ...(sways.length && a.markup ? [{ file: `${name}--base`, body: () => baseDocument(a) }] : []),
      ...sways.map((s, i) => ({ file: `${name}--sway-${i}`, body: () => swayDocument(s) })),
    ];
  });
}

/** Public URL of the whole drawing (all parts, still). */
export const artUrl = (name: ArtName) => withBase(`/flora/${name}.svg`);

/** The file's view box: [x, y, width, height] in drawing units. */
export const artView = (name: ArtName) => art(name).view ?? ([0, 0, art(name).w, art(name).h] as const);

export interface SwayLayer {
  url: string;
  /** the part's own view, in the drawing's units */
  view: [number, number, number, number];
  amp: number;
  /** seconds per gust, and where in the gust it starts */
  dur: number;
  delay: number;
}

/**
 * A drawing as layers: the still base, plus each swaying part. Gusts get
 * slightly different lengths and starting points, so no two parts move in step.
 */
export function artLayers(name: ArtName): { base: string | null; sways: SwayLayer[] } {
  const a = art(name);
  const sways = a.sway ?? [];
  if (!sways.length) return { base: artUrl(name), sways: [] };
  const seed = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7);
  return {
    base: a.markup ? withBase(`/flora/${name}--base.svg`) : null,
    sways: sways.map((s, i) => ({
      url: withBase(`/flora/${name}--sway-${i}.svg`),
      view: swayView(s),
      amp: s.amp,
      dur: 6.5 + ((seed + i * 37) % 30) / 10,
      delay: -(((seed * 3 + i * 53) % 80) / 10),
    })),
  };
}
