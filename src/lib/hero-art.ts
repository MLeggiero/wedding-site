// The photo frames' artwork: a fine double-ruled arch around the photo with
// engraved native plants. Drawn in one 1000×1300 coordinate system as two
// layers (plants behind the photo; the frame and plants in front) that are
// written out as SVG files at build time (see lib/art.ts) and stacked around
// the photo by HeroFrame.astro.
import { place, lod, magnoliaLeaf, magnoliaFlower, magnoliaBudTwig, dogwoodFlower, christmasFern, sprig, type Pt } from './engrave';
import { PEN, sway, type Arrangement } from './flora';
import { jessamineVine, maypopVine, azaleaBranch, dogwoodSpray } from './stems';
import { fritillaryCaterpillar, bumblebee } from './insects';

export const HERO_WINDOW = { left: 220, right: 780, top: 220, spring: 500, bottom: 1000, r: 280 };
export const HERO_BOX = { w: 1000, h: 1300 };
const W = HERO_WINDOW;
const arch = (off: number) =>
  `M${W.left - off},${W.bottom + off} V${W.spring} A${W.r + off},${W.r + off} 0 0 1 ${W.right + off},${W.spring} V${W.bottom + off} Z`;

/** The frame: two fine rules around the window. */
const rules = (p: number) => `<path d="${arch(10)}" fill="none" stroke-width="${p * 1.1}"/>` + `<path d="${arch(22)}" fill="none" stroke-width="${p * 0.55}"/>`;
/** A little dogwood at the keystone (drawn over the vine that runs across the top). */
const keystone = (p: number) => place(dogwoodFlower(26, p, 901), 500, W.top - 16);

/** Points on a circle round the arch's centre, at the given angles (degrees; 270 = the top). */
const onArch = (radius: number, ...degs: number[]): Pt[] =>
  degs.map((d) => [500 + Math.cos((d * Math.PI) / 180) * radius, W.spring + Math.sin((d * Math.PI) / 180) * radius]);

const VIEW: [number, number, number, number] = [-80, -40, 1160, 1420];

// --- the home page hero: a magnolia at the top-left with a jessamine vine
// running from it over the arch; a maypop climbing the right side from a
// spray of azalea and dogwood at the foot; ferns at the foot of the left side
// everything in the back layer sways a little: ferns, a sprig, magnolia leaves
const heroBackSway = (p: number) => [
  sway(christmasFern(260, p, 502, 0.3), 232, 1016, -122, 272, 1.6),
  sway(sprig(250, p, 503, 7), 206, 1012, -6, 300, 1.6),
  // magnolia leaves fanning out behind the flower at the top-left
  ...[-22, -54, -86, -118, -150].map((a, i) => sway(magnoliaLeaf(204 - i * 8, p, 504 + i, i % 2 ? 1 : -1), 236, 334, a, 242, 1.8)),
  ...[22, 50].map((a, i) => sway(magnoliaLeaf(150, p, 512 + i, i ? 1 : -1), 252, 318, a, 178, 1.8)),
  // and behind the spray at the foot of the right side
  ...[92, 128, 160].map((a, i) => sway(magnoliaLeaf(160 - i * 12, p, 516 + i, i % 2 ? -1 : 1), 800, 1008, a, 190, 1.8)),
];

const heroFrontArt = (p: number) =>
  [
    rules(p),
    // the jessamine grows from behind the magnolia and runs over the arch, its trumpets facing out
    jessamineVine(onArch(332, 214, 238, 262, 286, 310, 330), p, 521, { flowers: [2, 5, 8], out: -1, curl: -1, leaf: 38, amp: 6, wave: 150 }),
    keystone(p),
    // the magnolia in bloom, with a bud on its twig rising out of the cluster
    place(magnoliaBudTwig(92, 150, p, 522, -0.12), 236, 330, -32),
    place(magnoliaLeaf(150, p, 523, 1), 236, 338, 168),
    place(magnoliaFlower(118, p, 524), 236, 330),
    // the maypop climbs the right side, its leaves turned outward and a flower held out at the top
    maypopVine([[812, 1004], [836, 900], [826, 800], [846, 700], [872, 630]], p, 526, { flowers: [3], flower: 54, leaf: 104, node: 92, first: 1, bare: [0, 1, 3] }),
    // a gulf fritillary caterpillar feeding on a maypop leaf (its host plant), and a bumblebee at the flower
    place(lod(fritillaryCaterpillar(54, p, 534), fritillaryCaterpillar(54, p, 534, true)), 852, 756, -10),
    place(lod(bumblebee(46, p, 535), bumblebee(46, p, 535, true)), 838, 630, 22, 1, true),
    // at the foot of the right side, springing from one place under a magnolia leaf: an azalea
    // branch reaching out and a dogwood twig running along the base
    dogwoodSpray([[812, 1022], [730, 1066], [636, 1082], [552, 1070]], p, 529, { leaves: [0.32, 0.64], leaf: 74, flower: 44, side: [{ t: 0.5, side: -1 }] }),
    azaleaBranch([[812, 1018], [860, 998], [912, 954]], 80, p, 531),
    place(magnoliaLeaf(124, p, 536, -1), 812, 1020, 128),
  ].join('');

export function heroBack(): Arrangement {
  return { w: 1000, h: 1300, view: VIEW, markup: '', sway: heroBackSway(PEN) };
}
export function heroFront(): Arrangement {
  return { w: 1000, h: 1300, view: VIEW, markup: heroFrontArt(PEN) };
}

// --- the inner pages' lighter frame: a magnolia at the top-left with a
// jessamine vine over the arch, and a spray of azalea and dogwood at the foot
// of the right side with a fern climbing behind it
const archBackSway = (p: number) => [
  sway(christmasFern(340, p, 601, 0.16), 814, 1012, 4, 352, 1.1),
  ...[-30, -66, -102, -138].map((a, i) => sway(magnoliaLeaf(170 - i * 8, p, 602 + i, i % 2 ? 1 : -1), 240, 340, a, 194, 1.8)),
  ...[104, 146].map((a, i) => sway(magnoliaLeaf(140 - i * 12, p, 608 + i, i % 2 ? -1 : 1), 796, 1006, a, 168, 1.8)),
];

const archFrontArt = (p: number) =>
  [
    rules(p),
    jessamineVine(onArch(328, 216, 240, 264, 288, 312, 328), p, 611, { flowers: [2, 6], out: -1, curl: -1, leaf: 36, amp: 6, wave: 150 }),
    keystone(p),
    place(magnoliaBudTwig(78, 118, p, 614, 0.1), 236, 346, -14),
    place(magnoliaFlower(90, p, 613), 236, 346),
    dogwoodSpray([[810, 1022], [736, 1062], [648, 1078], [580, 1068]], p, 615, { leaves: [0.34, 0.68], leaf: 68, flower: 40 }),
    azaleaBranch([[810, 1018], [852, 1000], [898, 962]], 68, p, 617),
    place(magnoliaLeaf(112, p, 619, -1), 810, 1020, 128),
  ].join('');

/** The arch frame's view is symmetric about the window, so HeroFrame can mirror it. */
export function archBack(): Arrangement {
  return { w: 1000, h: 1300, view: VIEW, markup: '', sway: archBackSway(PEN) };
}
export function archFront(): Arrangement {
  return { w: 1000, h: 1300, view: VIEW, markup: archFrontArt(PEN) };
}
