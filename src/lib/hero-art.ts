// The photo frames' artwork: a fine double-ruled arch around the photo with
// engraved native plants. Drawn in one 1000×1300 coordinate system as two
// layers (plants behind the photo; the frame and plants in front) that are
// written out as SVG files at build time (see lib/art.ts) and stacked around
// the photo by HeroFrame.astro.
import {
  place, magnoliaLeaf, magnoliaFlower, magnoliaBudTwig, dogwoodLeaf, dogwoodFlower, dogwoodBranch, azalea,
  christmasFern, passionflower, passionLeaf, tendril, jessamine, sprig,
} from './engrave';
import { PEN, sway, type Arrangement } from './flora';

export const HERO_WINDOW = { left: 220, right: 780, top: 220, spring: 500, bottom: 1000, r: 280 };
export const HERO_BOX = { w: 1000, h: 1300 };
const W = HERO_WINDOW;
const arch = (off: number) =>
  `M${W.left - off},${W.bottom + off} V${W.spring} A${W.r + off},${W.r + off} 0 0 1 ${W.right + off},${W.spring} V${W.bottom + off} Z`;

/** The frame: two fine rules around the window, and a little dogwood at the keystone. */
const frame = (p: number) =>
  `<path d="${arch(10)}" fill="none" stroke-width="${p * 1.1}"/>` +
  `<path d="${arch(22)}" fill="none" stroke-width="${p * 0.55}"/>` +
  place(dogwoodFlower(26, p, 901), 500, W.top - 16);

const VIEW: [number, number, number, number] = [-80, -40, 1160, 1420];

// --- the home page hero: a cluster at the top-left and one at the foot of the
// right side, joined by a fern climbing behind the frame
// everything in the back layer sways a little: ferns, a sprig, magnolia leaves
const heroBackSway = (p: number) => [
  // ferns tucked behind the frame: one climbing the right side, one along the foot
  sway(christmasFern(430, p, 501, 0.16), 814, 1012, 4, 445, 1),
  sway(christmasFern(260, p, 502, 0.3), 232, 1016, -122, 272, 1.6),
  sway(sprig(250, p, 503, 7), 206, 1012, -6, 300, 1.6),
  // magnolia leaves fanning out behind the flower at the top-left
  ...[-22, -54, -86, -118, -150].map((a, i) => sway(magnoliaLeaf(204 - i * 8, p, 504 + i, i % 2 ? 1 : -1), 236, 334, a, 242, 1.8)),
  ...[22, 50].map((a, i) => sway(magnoliaLeaf(150, p, 512 + i, i ? 1 : -1), 252, 318, a, 178, 1.8)),
  // and at the foot of the right side
  ...[78, 108, 140, 172].map((a, i) => sway(magnoliaLeaf(172 - i * 10, p, 516 + i, i % 2 ? -1 : 1), 796, 1006, a, 204, 1.8)),
];

const heroFrontArt = (p: number) =>
  [
    // top-left: Southern magnolia in bloom, a bud, dogwood along the arch, jessamine over the top
    place(dogwoodBranch(300, p, 520), 300, 250, 62),
    place(jessamine(280, p, 521), 540, 205, 22),
    // a bud on its twig, rising out of the cluster behind the flower
    place(magnoliaBudTwig(92, 150, p, 522, -0.12), 236, 330, -32),
    place(magnoliaLeaf(150, p, 523, 1), 236, 338, 168),
    place(magnoliaFlower(118, p, 524), 236, 330),
    // right: a maypop near the top of the fern, with its leaf and a tendril
    place(passionLeaf(112, p, 526), 846, 712, 58),
    place(tendril(96, 1.8, p, 527), 830, 650, -64),
    place(passionflower(56, p, 528), 824, 704),
    // the foot of the right side: azalea, dogwood leaves and a dogwood blossom along the base
    place(dogwoodLeaf(132, p, 529, -1), 772, 1064, -96),
    place(dogwoodLeaf(116, p, 530, 1), 772, 1064, -128),
    place(azalea(100, p, 531), 842, 1032, 122),
    place(dogwoodFlower(46, p, 533), 690, 1066),
  ].join('');

export function heroBack(): Arrangement {
  return { w: 1000, h: 1300, view: VIEW, markup: '', sway: heroBackSway(PEN) };
}
export function heroFront(): Arrangement {
  return { w: 1000, h: 1300, view: VIEW, markup: frame(PEN) + heroFrontArt(PEN) };
}

// --- the inner pages' lighter frame: magnolia and jessamine over the top-left,
// a smaller cluster at the foot of the right side
const archBackSway = (p: number) => [
  sway(christmasFern(340, p, 601, 0.16), 814, 1012, 4, 352, 1.1),
  ...[-30, -66, -102, -138].map((a, i) => sway(magnoliaLeaf(170 - i * 8, p, 602 + i, i % 2 ? 1 : -1), 240, 340, a, 194, 1.8)),
  ...[84, 120, 156].map((a, i) => sway(magnoliaLeaf(140 - i * 10, p, 608 + i, i % 2 ? -1 : 1), 796, 1006, a, 168, 1.8)),
];

const archFrontArt = (p: number) =>
  [
    place(jessamine(300, p, 611), 290, 290, -42),
    place(jessamine(250, p, 612), 520, 212, 30),
    place(magnoliaBudTwig(78, 118, p, 614, 0.1), 236, 346, -14),
    place(magnoliaFlower(90, p, 613), 236, 346),
    place(dogwoodLeaf(120, p, 615, -1), 772, 1064, -96),
    place(dogwoodLeaf(106, p, 616, 1), 772, 1064, -128),
    place(azalea(84, p, 617), 840, 1030, 122),
    place(dogwoodFlower(40, p, 618), 700, 1066),
  ].join('');

/** The arch frame's view is symmetric about the window, so HeroFrame can mirror it. */
export function archBack(): Arrangement {
  return { w: 1000, h: 1300, view: VIEW, markup: '', sway: archBackSway(PEN) };
}
export function archFront(): Arrangement {
  return { w: 1000, h: 1300, view: VIEW, markup: frame(PEN) + archFrontArt(PEN) };
}
