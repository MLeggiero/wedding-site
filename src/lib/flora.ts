// Arrangements of engraved native plants (lib/engrave.ts) for the site's
// borders, card corners and dividers. lib/art.ts writes each one to SVG files
// at build time and Flora.astro places them as images. Some parts (fronds,
// sprigs, leaves) are kept apart as `sway` layers, so they can move in a
// gentle breeze while the rest of the drawing stays still.
import {
  place, ink, INK_STYLE, magnoliaLeaf, magnoliaFlower, magnoliaBud, dogwoodLeaf, dogwoodFlower, dogwoodBranch,
  azalea, christmasFern, trillium, passionflower, passionLeaf, tendril, jessamine, sprig, leaf,
} from './engrave';

export interface Arrangement {
  /** the nominal box (0,0)–(w,h) that CSS sizes and anchors */
  w: number;
  h: number;
  markup: string;
  /**
   * The region written to the file, [x, y, width, height]. Plants spill past
   * the nominal box, so this adds headroom on the sides that show; it starts
   * at the anchor (a section corner, a card corner's centre) so CSS needs no offsets.
   */
  view?: [number, number, number, number];
  /** parts drawn as their own layers behind the rest, each pivoting where it grows from */
  sway?: Sway[];
}

export interface Sway {
  /** the part, in the arrangement's coordinates */
  markup: string;
  /** the point it grows or hangs from: it pivots here */
  at: [number, number];
  /** how far it reaches from that point (sets its file's square view) */
  reach: number;
  /** how far it swings each way, in degrees */
  amp: number;
}

/** Place a part as a swaying layer (same arguments as `place`, plus its reach and swing). */
export function sway(markup: string, x: number, y: number, rot: number, reach: number, amp: number, scale = 1, mirror = false): Sway {
  return { markup: place(markup, x, y, rot, scale, mirror), at: [x, y], reach: reach * scale, amp };
}

/** A sway layer's view: a square centred on its pivot. */
export const swayView = (s: Sway): [number, number, number, number] => [s.at[0] - s.reach, s.at[1] - s.reach, s.reach * 2, s.reach * 2];

const doc = ([x, y, w, h]: readonly number[], markup: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">${INK_STYLE}${ink(markup)}</svg>`;

/** The whole arrangement as one still SVG document (swaying parts included, behind the rest). */
export function svgDocument(a: Arrangement): string {
  return doc(a.view ?? [0, 0, a.w, a.h], (a.sway ?? []).map((s) => s.markup).join('') + a.markup);
}
/** Just the still part of an arrangement. */
export const baseDocument = (a: Arrangement) => doc(a.view ?? [0, 0, a.w, a.h], a.markup);
/** One swaying part, in its own square view around its pivot. */
export const swayDocument = (s: Sway) => doc(swayView(s), s.markup);

/** Outline weight, in screen pixels, for every drawing on the site. */
export const PEN = 1.15;

/**
 * Top-left corner of a section: a magnolia in bloom with its leaves, a dogwood
 * branch and jessamine running along the top edge, a fern hanging down the
 * left. Origin = the section's top-left corner.
 */
export function corner(): Arrangement {
  const p = PEN;
  // behind, swaying: a fern down the left edge, a sprig, the dogwood branch,
  // jessamine along the top and magnolia leaves fanning from the corner
  const sways = [
    sway(christmasFern(330, p, 21, -0.18), 34, 30, 172, 340, 1.4),
    sway(sprig(230, p, 22, 7), 70, 40, 132, 240, 2.2),
    sway(dogwoodBranch(330, p, 23), 40, 54, 98, 490, 0.7),
    sway(jessamine(300, p, 24), 210, 20, 3, 320, 1.1),
    ...[118, 142, 166, 192].map((a, i) => sway(magnoliaLeaf(150 + i * 8, p, 25 + i, i % 2 ? 1 : -1), 58, 58, a, 204, 1.8)),
  ];
  const parts = [
    place(magnoliaLeaf(140, p, 31), 70, 70, 74),
    // in front: the flower, a bud and a small sprig
    place(magnoliaBud(76, p, 32), 168, 128, 128),
    place(magnoliaFlower(84, p, 33), 92, 94),
    place(sprig(120, p, 34, 4), 40, 168, 196),
    place(tendril(70, 1.6, p, 35), 330, 30, 12),
  ];
  return { w: 460, h: 440, view: [0, 0, 560, 470], markup: parts.join(''), sway: sways };
}

/**
 * Bottom-left corner of a section: ferns, a native azalea, trillium and a
 * maypop rising from the bottom edge. Origin = the section's bottom-left corner.
 */
export function cornerLow(): Arrangement {
  const p = PEN;
  const H = 460;
  // behind, swaying: two ferns, a sprig and a maypop leaf rising from the bottom edge
  const sways = [
    sway(christmasFern(340, p, 41, 0.22), 46, H, 8, 350, 1.4),
    sway(christmasFern(280, p, 42, 0.3), 120, H, 46, 290, 1.8),
    sway(sprig(220, p, 43, 6), 210, H, 70, 274, 2.2),
    sway(passionLeaf(110, p, 44), 270, H - 10, 58, 144, 2.6),
  ];
  const parts = [
    place(tendril(80, 1.8, p, 45), 300, H - 70, -20),
    place(azalea(92, p, 46), 96, H - 120, 8),
    ...[30, 64].map((a, i) => place(dogwoodLeaf(120, p, 47 + i, i ? 1 : -1), 40, H - 10, a)),
    place(trillium(54, p, 49), 196, H - 62),
    place(passionflower(52, p, 50), 330, H - 120),
    place(dogwoodFlower(36, p, 51), 40, H - 210),
  ];
  return { w: 420, h: H, view: [0, -40, 470, H + 40], markup: parts.join(''), sway: sways };
}

/** A climbing jessamine for the side wall of a tall section; grows up from the bottom of its box. */
export function vine(): Arrangement {
  const p = PEN;
  const H = 760;
  const sways = [sway(sprig(200, p, 62, 6), 90, H - 380, 26, 234, 2.2)];
  const parts = [
    place(jessamine(640, p, 61), 70, H, -86),
    place(tendril(70, 1.5, p, 63), 70, H - 520, -40),
    place(passionflower(44, p, 64), 120, H - 600),
  ];
  return { w: 200, h: H, view: [-40, -40, 280, H + 60], markup: parts.join(''), sway: sways };
}

/** Card corner sprigs. Each sits centred on a card corner (the middle of its box). */
const SPRIG_VIEW: [number, number, number, number] = [-40, -40, 380, 380];

export function sprigMagnolia(): Arrangement {
  const p = PEN;
  const C = 150;
  const sways = [
    sway(magnoliaLeaf(118, p, 71, 1), C, C, -32, 134, 2.4),
    sway(magnoliaLeaf(108, p, 72, -1), C, C, -96, 128, 2.4),
    sway(sprig(120, p, 73, 4), C, C, 40, 128, 3),
  ];
  return { w: 300, h: 300, view: SPRIG_VIEW, markup: place(magnoliaFlower(48, p, 74), C, C), sway: sways };
}

export function sprigDogwood(): Arrangement {
  const p = PEN;
  const C = 150;
  const sways = [
    sway(dogwoodLeaf(100, p, 81, -1), C, C, 20, 124, 2.6),
    sway(dogwoodLeaf(92, p, 82, 1), C, C, 96, 114, 2.6),
    sway(sprig(110, p, 83, 4), C, C, -40, 118, 3),
  ];
  return { w: 300, h: 300, view: SPRIG_VIEW, markup: place(dogwoodFlower(40, p, 84), C, C), sway: sways };
}

export function sprigFern(): Arrangement {
  const p = PEN;
  const C = 150;
  const sways = [
    sway(christmasFern(150, p, 91, 0.25), C, C, -150, 158, 2.4),
    sway(christmasFern(120, p, 92, -0.2), C, C, -108, 128, 2.8),
  ];
  return { w: 300, h: 300, view: SPRIG_VIEW, markup: place(trillium(34, p, 93), C, C), sway: sways };
}

export function sprigMaypop(): Arrangement {
  const p = PEN;
  const C = 150;
  const sways = [
    sway(passionLeaf(90, p, 101), C, C, 150, 120, 2.6),
    sway(sprig(100, p, 103, 4), C, C, 110, 122, 3),
  ];
  const parts = [place(tendril(70, 1.6, p, 102), C, C, 20), place(passionflower(40, p, 104), C, C)];
  return { w: 300, h: 300, view: SPRIG_VIEW, markup: parts.join(''), sway: sways };
}

/** A divider: a small dogwood blossom with a leafy sprig reaching out to each side. */
export function divider(): Arrangement {
  const p = PEN;
  const parts = [
    place(sprig(150, p, 111, 5), 182, 34, -96),
    place(sprig(150, p, 112, 5), 178, 34, 96, 1, true),
    place(leaf({ L: 38, W: 9, widest: 0.45, acuminate: 0.5, veins: 2, shade: 0, seed: 113 }, p), 180, 34, -30),
    place(leaf({ L: 38, W: 9, widest: 0.45, acuminate: 0.5, veins: 2, shade: 0, seed: 114 }, p), 180, 34, 30),
    place(dogwoodFlower(17, p, 115), 180, 34),
  ];
  return { w: 360, h: 68, view: [0, -10, 360, 96], markup: parts.join('') };
}
