// The hero frame's artwork: a gilded arch for the photo, wreathed in plants
// native to the southeastern US. Drawn in one 1000×1300 coordinate system as
// two layers — plants behind the photo, and the gilt frame with plants in
// front — that are written out as SVG files at build time (see lib/art.ts)
// and stacked around the photo by HeroFrame.astro.
import {
  rng, place, magnoliaLeaf, magnoliaFlower, dogwoodFlower, azalea, honeysuckle, jessamine,
  redbud, christmasFern, maidenhair, cinnamonFern, spanishMoss, trillium, passionflower, swallowtail,
} from './natives';
import type { Arrangement } from './flora';

// --- geometry (viewBox units): photo window = arch
export const HERO_WINDOW = { left: 220, right: 780, top: 220, spring: 500, bottom: 1000, r: 280 };
export const HERO_BOX = { w: 1000, h: 1300 };
const W = HERO_WINDOW;
const arch = (off: number) =>
  `M${W.left - off},${W.bottom + off} V${W.spring} A${W.r + off},${W.r + off} 0 0 1 ${W.right + off},${W.spring} V${W.bottom + off} Z`;

// beads along the inner molding
const beads: string[] = [];
const bo = 12;
const br = W.r + bo;
for (let y = W.bottom + bo - 10; y > W.spring; y -= 17) {
  beads.push(`<circle cx="${W.left - bo}" cy="${y}" r="4.3"/>`, `<circle cx="${W.right + bo}" cy="${y}" r="4.3"/>`);
}
const steps = Math.round((Math.PI * br) / 17);
for (let i = 0; i <= steps; i++) {
  const a = Math.PI - (i / steps) * Math.PI;
  beads.push(`<circle cx="${(500 + Math.cos(a) * br).toFixed(1)}" cy="${(W.spring - Math.sin(a) * br).toFixed(1)}" r="4.3"/>`);
}

// shell keystone at the apex + rosettes at the base corners
let shell = '';
for (let i = 0; i <= 8; i++) {
  const a = Math.PI + (i / 8) * Math.PI;
  shell += `M500,${W.top - 4} L${(500 + Math.cos(a) * 46).toFixed(1)},${(W.top - 4 + Math.sin(a) * 46).toFixed(1)} `;
}
const rosette = (x: number, y: number) => {
  let p = '';
  for (let i = 0; i < 8; i++) p += `<ellipse cx="${x}" cy="${y - 13}" rx="6" ry="12" transform="rotate(${i * 45} ${x} ${y})"/>`;
  return `<g fill="url(#nv-gold)" stroke="#5a3d10" stroke-width="1.2">${p}<circle cx="${x}" cy="${y}" r="8" fill="url(#nv-bead)"/></g>`;
};

const frame =
  `<path d="${arch(26)}" fill="none" stroke="#0a120c" stroke-opacity=".45" stroke-width="70" transform="translate(0 10)"/>` +
  `<path d="${arch(26)}" fill="none" stroke="url(#nv-gold)" stroke-width="52"/>` +
  `<path d="${arch(52)}" fill="none" stroke="#4a3208" stroke-width="3"/>` +
  `<path d="${arch(38)}" fill="none" stroke="#fff3bd" stroke-opacity=".55" stroke-width="2.5"/>` +
  `<path d="${arch(24)}" fill="none" stroke="#6b4a12" stroke-width="5"/>` +
  `<g fill="url(#nv-bead)" stroke="#5a3d10" stroke-width=".8">${beads.join('')}</g>` +
  `<path d="${arch(1)}" fill="none" stroke="#24180a" stroke-width="6"/>` +
  `<path d="M454,${W.top - 4} A46,46 0 0 1 546,${W.top - 4} Z" fill="url(#nv-gold)" stroke="#4a3208" stroke-width="2"/>` +
  `<path d="${shell}" stroke="#6b4a12" stroke-width="2.2"/>` +
  `<circle cx="500" cy="${W.top - 4}" r="9" fill="url(#nv-bead)" stroke="#4a3208" stroke-width="1.5"/>` +
  rosette(W.left - 26, W.bottom + 26) +
  rosette(W.right + 26, W.bottom + 26);

// --- sample the frame outline (offset `off` outside the window) with outward directions
function ring(off: number, count: number, phase = 0.5) {
  const side = W.bottom - W.spring;
  const arc = Math.PI * (W.r + off);
  const total = side * 2 + arc;
  const pts: { x: number; y: number; rot: number }[] = [];
  for (let i = 0; i < count; i++) {
    const s = ((i + phase) / count) * total;
    if (s < side) pts.push({ x: W.left - off, y: W.bottom - s, rot: -90 });
    else if (s < side + arc) {
      const a = Math.PI - ((s - side) / arc) * Math.PI;
      const nx = Math.cos(a);
      const ny = -Math.sin(a);
      pts.push({ x: 500 + nx * (W.r + off), y: W.spring + ny * (W.r + off), rot: (Math.atan2(nx, -ny) * 180) / Math.PI });
    } else pts.push({ x: W.right + off, y: W.spring + (s - side - arc), rot: 90 });
  }
  return pts;
}
const R = rng(77);
// florist's diagonal: fuller at top-left and bottom-right, lighter at the other corners
const swell = (x: number, y: number) => 1 + 0.26 * Math.cos(2 * (Math.atan2(y - 650, x - 500) + (135 * Math.PI) / 180));

// --- behind the frame: a dense magnolia wreath woven with ferns, more ferns at the corners
const wreath = [
  ...ring(30, 11, 0.2).map((p, i) =>
    place(christmasFern((230 + R() * 110) * swell(p.x, p.y), (R() - 0.5) * 0.6, 60 + i, 'url(#nv-fern-light)'), p.x, p.y, p.rot + (R() - 0.5) * 40, 1),
  ),
  ...ring(14, 34).map((p) => place(magnoliaLeaf((165 + R() * 80) * swell(p.x, p.y), R() < 0.26), p.x, p.y, p.rot + (R() - 0.5) * 46, 1)),
  ...ring(26, 26, 0).map((p) => place(magnoliaLeaf((115 + R() * 50) * swell(p.x, p.y), R() < 0.2), p.x, p.y, p.rot + (R() - 0.5) * 80, 1)),
  ...[250, 340, 430, 570, 660, 750].map((x, i) => place(magnoliaLeaf(165 + R() * 60, i % 3 === 1), x, W.bottom + 30, 180 + (R() - 0.5) * 70, 1)),
];
const back = [
  place(christmasFern(500, 0.42, 21), 245, 1225, -46, 1),
  place(christmasFern(500, 0.42, 22), 755, 1225, 46, 1, true),
  place(christmasFern(380, 0.3, 27), 300, 1240, -18, 1),
  place(christmasFern(380, 0.3, 28), 700, 1240, 18, 1, true),
  place(maidenhair(185, 25), 112, 1170, -20, 1),
  place(maidenhair(185, 26), 888, 1170, 20, 1, true),
  place(cinnamonFern(320, 23), 345, 1190, -12, 1),
  place(cinnamonFern(320, 24), 657, 1195, 14, 1),
  ...wreath,
].join('');

// --- in front of the frame: clustered blossoms, vines, moss and butterflies
const front = [
  // top-left bouquet: Southern magnolia, dogwood, Piedmont azalea, maidenhair
  place(maidenhair(120, 51), 150, 410, -40, 1),
  place(magnoliaLeaf(150), 205, 365, -112, 1),
  place(magnoliaLeaf(135, true), 300, 268, -12, 1),
  place(azalea(76, 'pink', 31), 160, 470, 0, 1),
  place(magnoliaFlower(106, 32), 250, 318, 14, 1),
  place(dogwoodFlower(50, 52), 176, 392, -10, 1),
  place(dogwoodFlower(42, 53), 318, 244, 20, 1),
  // Carolina jessamine trailing over the arch; Spanish moss from both shoulders
  place(jessamine(220, 35), 300, 262, -33, 1),
  place(jessamine(210, 36), 500, 200, 26, 1),
  place(spanishMoss(330, 66, 33), 160, 322, 0, 1),
  place(spanishMoss(300, 60, 34), 842, 316, 0, 1),
  // top-right: redbud, dogwood, a tiger swallowtail
  place(redbud(230, 37), 690, 262, -42, 1),
  place(dogwoodFlower(46, 55), 792, 362, 12, 1),
  place(swallowtail(60, 'swa'), 872, 268, 18, 1),
  // right side: flame azalea and coral honeysuckle
  place(azalea(86, 'flame', 38), 842, 600, 0, 1),
  place(honeysuckle(76, 39), 838, 790, -16, 1),
  place(honeysuckle(60, 56), 862, 905, 12, 1),
  // left side: dogwood and a second butterfly
  place(dogwoodFlower(60, 40), 165, 612, 8, 1),
  place(dogwoodFlower(48, 41), 148, 762, -16, 1),
  place(azalea(60, 'pink', 57), 170, 880, 0, 1),
  place(swallowtail(50, 'swb'), 92, 530, -24, 1),
  // the bed along the bottom
  place(magnoliaLeaf(205), 365, 1092, -102, 1),
  place(magnoliaLeaf(215, true), 640, 1095, 102, 1),
  place(magnoliaLeaf(190), 520, 1110, 175, 1),
  place(azalea(80, 'pink', 42), 245, 1045, 0, 1),
  place(trillium(48, 58), 140, 1105, -8, 1),
  place(magnoliaFlower(126, 43), 432, 1060, -8, 1),
  place(dogwoodFlower(72, 44), 594, 1050, 22, 1),
  place(azalea(60, 'flame', 59), 640, 1140, 0, 1),
  place(trillium(56, 45), 730, 1102, 0, 1),
  place(passionflower(72, 46), 852, 1012, 0, 1),
  place(dogwoodFlower(48, 47), 330, 1140, -20, 1),
  place(dogwoodFlower(44, 60), 760, 1185, 30, 1),
  place(christmasFern(280, 0.25, 48), 112, 1295, -14, 1),
  place(christmasFern(280, 0.25, 49), 888, 1295, 14, 1, true),
].join('');

// the frame's own gilding, mapped to this drawing
const GOLD =
  `<linearGradient id="nv-gold" gradientUnits="userSpaceOnUse" x1="170" y1="170" x2="830" y2="1050">` +
  `<stop offset="0" stop-color="#7a5416"/><stop offset=".12" stop-color="#d9ab4e"/><stop offset=".22" stop-color="#f7e3a1"/>` +
  `<stop offset=".34" stop-color="#b98a33"/><stop offset=".5" stop-color="#efd07c"/><stop offset=".62" stop-color="#9c6f22"/>` +
  `<stop offset=".78" stop-color="#e3be66"/><stop offset=".9" stop-color="#8a6119"/><stop offset="1" stop-color="#d8aa4d"/></linearGradient>`;

// --- the lighter "arch" frame for inner pages: the same gilt arch, a jessamine
// garland over the top and two clusters at opposite corners
const R2 = rng(91);
const archBackArt = [
  place(christmasFern(420, 0.4, 71), 230, 1215, -40, 1),
  place(christmasFern(330, 0.3, 72), 300, 1235, -12, 1),
  place(christmasFern(420, 0.4, 73), 770, 1215, 40, 1, true),
  place(maidenhair(160, 74), 140, 1150, -24, 1),
  ...[-150, -128, -104, -80, -60].map((a, i) => place(magnoliaLeaf(150 + R2() * 70, i === 2), 230, 330, a + (R2() - 0.5) * 12, 1)),
  ...[40, 62, 84].map((a, i) => place(magnoliaLeaf(135 + R2() * 50, i === 1), 770, 960, a + 60, 1)),
  ...[200, 230, 260, 290].map((a) => place(magnoliaLeaf(120 + R2() * 50), 790, 1010, a - 120, 1)),
].join('');
const archFrontArt = [
  // jessamine garland over the arch
  place(jessamine(230, 81), 290, 268, -36, 1),
  place(jessamine(220, 82), 500, 200, 26, 1),
  place(jessamine(170, 83), 690, 250, 52, 1),
  // top-left: Southern magnolia, dogwood, maidenhair
  place(maidenhair(110, 84), 150, 405, -38, 1),
  place(magnoliaLeaf(145), 205, 360, -112, 1),
  place(magnoliaLeaf(128, true), 300, 270, -14, 1),
  place(magnoliaFlower(100, 85), 248, 318, 14, 1),
  place(dogwoodFlower(48, 86), 172, 400, -8, 1),
  place(dogwoodFlower(40, 87), 322, 246, 20, 1),
  place(spanishMoss(260, 44, 88), 168, 340, 0, 1),
  // top-right: a swallowtail on the garland
  place(swallowtail(54, 'arch-sw'), 830, 300, 16, 1),
  // bottom-right: Piedmont azalea, trillium, dogwood, coral honeysuckle
  place(magnoliaLeaf(170), 640, 1092, 104, 1),
  place(azalea(82, 'pink', 89), 800, 1040, 0, 1),
  place(honeysuckle(62, 90), 846, 920, -14, 1),
  place(dogwoodFlower(58, 92), 690, 1060, 18, 1),
  place(trillium(46, 93), 880, 1110, 6, 1),
  place(azalea(56, 'flame', 94), 610, 1130, 0, 1),
  place(christmasFern(240, 0.25, 95), 900, 1290, 18, 1, true),
].join('');

// Each layer's file covers a little more than the 1000×1300 drawing, because
// leaves and ferns reach past it; HeroFrame positions the files to match.
export function heroBack(): Arrangement {
  return { w: 1000, h: 1300, view: [-190, -64, 1390, 1400], lift: false, markup: `<g filter="url(#nv-lift)">${back}</g>` };
}
/** The arch frame's view is symmetric about the window, so HeroFrame can mirror it. */
const ARCH_VIEW: [number, number, number, number] = [-200, -64, 1400, 1400];
export function archBack(): Arrangement {
  return { w: 1000, h: 1300, view: ARCH_VIEW, lift: false, markup: `<g filter="url(#nv-lift)">${archBackArt}</g>` };
}
export function archFront(): Arrangement {
  return { w: 1000, h: 1300, view: ARCH_VIEW, lift: false, defs: GOLD, markup: `<g>${frame}</g><g filter="url(#nv-lift)">${archFrontArt}</g>` };
}
export function heroFront(): Arrangement {
  return {
    w: 1000,
    h: 1300,
    view: [-190, -64, 1390, 1400],
    lift: false,
    defs: GOLD,
    markup: `<g>${frame}</g><g filter="url(#nv-lift)">${front}</g>`,
  };
}
