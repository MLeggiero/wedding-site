// Ready-made arrangements of southeastern native plants, built from the
// generators in natives.ts. lib/art.ts writes each one to an SVG file at build
// time and Flora.astro places it as an image.
import {
  NV_DEFS, LIFT_DEFS,
  rng, place, magnoliaLeaf, magnoliaFlower, dogwoodFlower, azalea, honeysuckle, jessamine, redbud,
  christmasFern, maidenhair, cinnamonFern, spanishMoss, trillium, passionflower, swallowtail,
} from './natives';

export interface Arrangement {
  /** the nominal box (0,0)–(w,h) that CSS sizes and anchors */
  w: number;
  h: number;
  markup: string;
  /**
   * The region written to the file, [x, y, width, height]. Plants spill past
   * the nominal box, so this adds headroom on the sides that show; it starts
   * at the anchor (a room corner, a card corner's centre) so CSS needs no offsets.
   */
  view?: [number, number, number, number];
  /** extra <defs> the markup needs */
  defs?: string;
  /** wrap the markup in the soft drop shadow (default true) */
  lift?: boolean;
}

/** A standalone SVG document for an arrangement. */
export function svgDocument(a: Arrangement): string {
  const [x, y, w, h] = a.view ?? [0, 0, a.w, a.h];
  const body = a.lift === false ? a.markup : `<g filter="url(#nv-lift)">${a.markup}</g>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">` +
    `<defs>${NV_DEFS}${LIFT_DEFS}${a.defs ?? ''}</defs>${body}</svg>`
  );
}

/**
 * Top-corner swag for a room: a magnolia bough from the corner, Spanish moss
 * hanging from it, Carolina jessamine trailing along the top edge, redbud,
 * dogwood and a magnolia blossom. Origin = the room's top-left corner.
 */
export function swag(seed = 1): Arrangement {
  const R = rng(seed * 101);
  const j = (v: number) => (R() - 0.5) * v;
  const back = [
    // ferns and leaves fanning out of the corner
    place(christmasFern(330, 0.32, seed + 1, 'url(#nv-fern-light)'), 20, 30, 128 + j(10), 1),
    place(christmasFern(280, -0.3, seed + 2), 40, 10, 104 + j(8), 1),
    place(christmasFern(250, 0.25, seed + 3), 10, 60, 160 + j(8), 1),
    ...[96, 112, 128, 146, 162, 176].map((a, i) => place(magnoliaLeaf(170 + R() * 70, i % 3 === 2), 18 + j(20), 18 + j(20), a + j(10), 1)),
    // Spanish moss hanging off the bough
    place(spanishMoss(300, 64, seed + 4), 120, 40, 0, 1),
    place(spanishMoss(260, 54, seed + 5), 215, 24, 0, 1),
    place(spanishMoss(240, 46, seed + 6), 60, 120, 0, 1),
    place(spanishMoss(190, 36, seed + 7), 310, 14, 0, 1),
  ];
  const front = [
    place(jessamine(430, seed + 8), 30, 18, 6 + j(4), 1),
    place(redbud(250, seed + 9), 30, 110, 32 + j(6), 1),
    place(magnoliaLeaf(150), 70, 60, 70 + j(8), 1),
    place(magnoliaLeaf(140, true), 60, 80, 196 + j(8), 1),
    place(magnoliaFlower(84, seed + 10), 78, 74, 12, 1),
    place(dogwoodFlower(40, seed + 11), 180, 66, 18, 1),
    place(dogwoodFlower(34, seed + 12), 40, 182, -12, 1),
    place(azalea(48, 'pink', seed + 13), 150, 140, 0, 1),
  ];
  return { w: 460, h: 440, view: [0, 0, 530, 440], markup: back.join('') + front.join('') };
}

/**
 * Bottom-corner bed for a room: Christmas and cinnamon ferns, maidenhair,
 * magnolia leaves, azaleas and Sweet Betsy trillium. Origin = bottom-left.
 */
export function bed(seed = 1): Arrangement {
  const R = rng(seed * 131);
  const j = (v: number) => (R() - 0.5) * v;
  const H = 460;
  const back = [
    place(christmasFern(400, 0.4, seed + 1, 'url(#nv-fern-light)'), 40, H, 22 + j(6), 1),
    place(christmasFern(360, 0.3, seed + 2), 10, H, 4 + j(6), 1),
    place(christmasFern(320, 0.45, seed + 3), 90, H, 48 + j(6), 1),
    place(christmasFern(260, 0.35, seed + 4), 150, H, 70 + j(6), 1),
    place(cinnamonFern(300, seed + 5), 120, H, 12, 1),
    place(cinnamonFern(240, seed + 6), 190, H, 26, 1),
    place(maidenhair(170, seed + 7), 250, H, 30, 1),
    ...[20, 40, 60, 78].map((a, i) => place(magnoliaLeaf(160 + R() * 50, i === 2), 30 + i * 40, H - 20, a + j(10), 1)),
  ];
  const front = [
    place(azalea(66, 'flame', seed + 8), 120, H - 150, 0, 1),
    place(azalea(54, 'pink', seed + 9), 250, H - 90, 0, 1),
    place(dogwoodFlower(44, seed + 10), 40, H - 230, 10, 1),
    place(dogwoodFlower(38, seed + 11), 210, H - 200, -16, 1),
    place(trillium(42, seed + 12), 60, H - 60, -6, 1),
    place(trillium(36, seed + 13), 330, H - 40, 8, 1),
    place(passionflower(46, seed + 14), 330, H - 130, 0, 1),
  ];
  return { w: 420, h: H, view: [0, 0, 484, H], markup: back.join('') + front.join('') };
}

/** Card corner sprigs. Each sits centred on a card corner (the middle of its box). */
const SPRIG_VIEW: [number, number, number, number] = [-110, -110, 520, 520];

export function sprigMagnolia(seed = 1): Arrangement {
  const C = 150;
  const parts = [
    place(maidenhair(110, seed), C - 30, C - 10, -50, 1),
    place(magnoliaLeaf(120), C, C, -20, 1),
    place(magnoliaLeaf(112, true), C, C, -78, 1),
    place(magnoliaLeaf(100), C, C, 32, 1),
    place(magnoliaLeaf(90, true), C, C, -128, 1),
    place(magnoliaFlower(62, seed + 1), C - 6, C - 8, 8, 1),
    place(dogwoodFlower(28, seed + 2), C + 58, C - 34, 16, 1),
    place(dogwoodFlower(24, seed + 3), C - 50, C + 44, -10, 1),
  ];
  return { w: 300, h: 300, view: SPRIG_VIEW, markup: parts.join('') };
}

export function sprigJessamine(seed = 1): Arrangement {
  const C = 150;
  const parts = [
    place(christmasFern(150, 0.3, seed, 'url(#nv-fern-light)'), C, C, 40, 1),
    place(jessamine(240, seed + 1), C + 10, C - 6, 180, 1),
    place(honeysuckle(46, seed + 2), C + 4, C - 4, 30, 1),
    place(dogwoodFlower(26, seed + 3), C + 52, C + 30, 10, 1),
  ];
  return { w: 300, h: 300, view: SPRIG_VIEW, markup: parts.join('') };
}

export function sprigFern(seed = 1): Arrangement {
  const C = 150;
  const parts = [
    place(christmasFern(160, 0.35, seed), C, C, -150, 1),
    place(christmasFern(130, -0.3, seed + 1, 'url(#nv-fern-light)'), C, C, -112, 1),
    place(magnoliaLeaf(96), C, C, -170, 1),
    place(azalea(40, 'pink', seed + 2), C - 10, C + 6, 0, 1),
    place(trillium(28, seed + 3), C + 40, C + 34, 10, 1),
  ];
  return { w: 300, h: 300, view: SPRIG_VIEW, markup: parts.join('') };
}

export function sprigAzalea(seed = 1): Arrangement {
  const C = 150;
  const parts = [
    place(cinnamonFern(130, seed), C + 10, C + 40, 30, 1),
    place(christmasFern(150, 0.3, seed + 1), C, C, 140, 1),
    place(magnoliaLeaf(100, true), C, C, 100, 1),
    place(magnoliaLeaf(90), C, C, 168, 1),
    place(azalea(44, 'flame', seed + 2), C + 6, C + 4, 0, 1),
    place(passionflower(30, seed + 3), C - 46, C + 30, 0, 1),
    place(dogwoodFlower(24, seed + 4), C + 44, C - 40, -8, 1),
  ];
  return { w: 300, h: 300, view: SPRIG_VIEW, markup: parts.join('') };
}

/**
 * A climbing vine for the side wall of a tall room: Carolina jessamine
 * zig-zagging up the trellis laths, with coral honeysuckle and maypop at the
 * bends and a tiger swallowtail. Grows up from the bottom of its box.
 */
export function vine(seed = 1): Arrangement {
  const W = 260;
  const H = 780;
  const bends: [number, number][] = [
    [60, H],
    [190, H - 250],
    [70, H - 500],
    [180, H - 740],
  ];
  const parts: string[] = [];
  for (let k = 0; k < bends.length - 1; k++) {
    const [x0, y0] = bends[k];
    const [x1, y1] = bends[k + 1];
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    parts.push(place(jessamine(Math.hypot(x1 - x0, y1 - y0), seed + k, 640), x0, y0, ang, 1));
  }
  parts.push(
    place(maidenhair(120, seed + 4), 70, H, 12, 1),
    place(honeysuckle(50, seed + 5), 190, H - 250, -30, 1),
    place(passionflower(42, seed + 6), 70, H - 500, 0, 1),
    place(honeysuckle(44, seed + 7), 178, H - 735, 24, 1),
    place(passionflower(30, seed + 8), 132, H - 360, 0, 1),
    place(swallowtail(40, `vine-${seed}`), 205, H - 560, 24, 1),
  );
  return { w: W, h: H, view: [-40, -60, W + 80, H + 120], markup: parts.join('') };
}
