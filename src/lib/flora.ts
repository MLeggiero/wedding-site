// Arrangements of engraved native plants (lib/engrave.ts) for the site's
// borders, card corners and dividers. lib/art.ts writes each one to SVG files
// at build time and Flora.astro places them as images. Some parts (fronds,
// sprigs, leaves) are kept apart as `sway` layers, so they can move in a
// gentle breeze while the rest of the drawing stays still.
import {
  place, ink, INK_STYLE, magnoliaLeaf, magnoliaFlower, magnoliaBudTwig, dogwoodLeaf, dogwoodFlower,
  christmasFern, trillium, passionflower, passionLeaf, tendril, sprig, leaf,
} from './engrave';
import { jessamineVine, maypopVine, azaleaBranch, dogwoodSpray, trilliumStanding } from './stems';

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
  /** below this many screen pixels per drawing unit, the drawing leaves out its shading (default DETAIL) */
  detail?: number;
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

/**
 * Below this many screen pixels per drawing unit (a phone, or a small frame),
 * a drawing leaves out its shading and uses the simpler version of any part
 * that has one, so its lines never crowd together. Each file decides for
 * itself from the size it is shown at (a media query inside the SVG, which
 * measures the image, not the page).
 */
export const DETAIL = 0.5;
const detailStyle = (w: number, ppu: number, markup: string) =>
  / class="(s|hi|lo)"/.test(markup) ? `<style>.lo{display:none}@media (max-width:${Math.round(w * ppu)}px){.s,.hi{display:none}.lo{display:inline}}</style>` : '';

const doc = ([x, y, w, h]: readonly number[], markup: string, ppu = DETAIL) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">${INK_STYLE}${detailStyle(w, ppu, markup)}${ink(markup)}</svg>`;

/** The whole arrangement as one still SVG document (swaying parts included, behind the rest). */
export function svgDocument(a: Arrangement): string {
  return doc(a.view ?? [0, 0, a.w, a.h], (a.sway ?? []).map((s) => s.markup).join('') + a.markup, a.detail);
}
/** Just the still part of an arrangement. */
export const baseDocument = (a: Arrangement) => doc(a.view ?? [0, 0, a.w, a.h], a.markup, a.detail);
/** One swaying part, in its own square view around its pivot. */
export const swayDocument = (s: Sway, a?: Arrangement) => doc(swayView(s), s.markup, a?.detail);

/** Outline weight, in screen pixels, for every drawing on the site. */
export const PEN = 1.15;

/**
 * Top-left corner of a section: a magnolia in bloom with its leaves, a dogwood
 * twig in flower reaching out from behind it, a jessamine vine trailing along
 * the top edge, and a fern hanging down the left. Origin = the section's
 * top-left corner.
 */
export function corner(): Arrangement {
  const p = PEN;
  // behind, swaying: a fern down the left edge, a sprig, and magnolia leaves fanning from the corner
  const sways = [
    sway(christmasFern(330, p, 21, -0.18), 34, 30, 172, 340, 1.4),
    sway(sprig(230, p, 22, 7), 70, 40, 132, 240, 2.2),
    ...[118, 142, 166, 192].map((a, i) => sway(magnoliaLeaf(150 + i * 8, p, 25 + i, i % 2 ? 1 : -1), 58, 58, a, 204, 1.8)),
  ];
  const parts = [
    // the jessamine trails off along the top edge, weaving, and curls over at its tip
    jessamineVine([[86, 40], [190, 62], [300, 46], [410, 70], [486, 98]], p, 24, { flowers: [3, 6], out: 1, curl: 1, leaf: 46, amp: 9 }),
    // the dogwood twig grows out from behind the magnolia, with a blossom at its tip
    dogwoodSpray([[60, 70], [140, 140], [240, 174], [338, 182]], p, 23, { leaves: [0.38, 0.72], leaf: 96, flower: 42, side: [{ t: 0.55, side: -1 }] }),
    place(magnoliaLeaf(140, p, 31), 70, 70, 74),
    // a bud on its twig, reaching out from behind the flower at the cluster's edge
    place(magnoliaBudTwig(72, 110, p, 32, 0.1), 92, 94, 152),
    place(magnoliaFlower(84, p, 33), 92, 94),
    place(sprig(120, p, 34, 4), 40, 168, 196),
  ];
  return { w: 460, h: 440, view: [0, 0, 560, 470], markup: parts.join(''), sway: sways };
}

/**
 * Bottom-left corner of a section: a bed of native plants rising from the
 * bottom edge, each from its own roots: ferns, a native azalea branch, a
 * Sweet Betsy trillium and a maypop vine climbing toward the light.
 * Origin = the section's bottom-left corner.
 */
export function cornerLow(): Arrangement {
  const p = PEN;
  const H = 460;
  // behind, swaying: a clump of two ferns at the edge
  const sways = [sway(christmasFern(340, p, 41, 0.22), 46, H, 8, 350, 1.4), sway(christmasFern(250, p, 42, -0.2), 14, H, -8, 260, 1.8)];
  const parts = [
    ...[30, 64].map((a, i) => place(dogwoodLeaf(100, p, 47 + i, i ? 1 : -1), 40, H - 10, a)),
    azaleaBranch([[84, H], [92, H - 76], [106, H - 146]], 78, p, 46),
    place(trilliumStanding(150, p, 49), 192, H),
    // the maypop climbs toward the middle of the page, its leaves on the open side
    maypopVine([[262, H], [266, H - 86], [292, H - 168], [346, H - 244]], p, 50, { flowers: [1], flower: 46, leaf: 92, node: 84, first: 1, bare: [1] }),
  ];
  return { w: 420, h: H, view: [0, -40, 470, H + 40], markup: parts.join(''), sway: sways };
}

/** A climbing jessamine for the side wall of a tall section; grows up from the bottom of its box. */
export function vine(): Arrangement {
  const p = PEN;
  const H = 760;
  const sways = [sway(sprig(200, p, 62, 6), 90, H - 380, 26, 234, 2.2)];
  const parts = [
    jessamineVine([[70, H], [86, H - 200], [64, H - 400], [92, H - 600], [80, H - 680]], p, 61, { flowers: [2, 5, 8], out: 1, curl: -1, leaf: 52, amp: 12 }),
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
