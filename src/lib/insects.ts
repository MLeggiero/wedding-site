// Engraved insects native to the southeastern US, drawn the same way as the
// plants (lib/engrave.ts): paper-filled outlines, fine veins, and hatching
// for the dark parts of a pattern. Butterflies and the beetle are seen from
// above, head toward -y; the bee and the caterpillar from the side.
//
// A butterfly comes in two parts, its wings and its body, so the wings can
// open and close over the body (see Butterfly.astro).
import { Plate, spline, splinePts, hatch, ellipsePts, line, quad, add, mul, lerp, rng, type Pt } from './engrave';

const scale = (pts: Pt[], k: number): Pt[] => pts.map(([x, y]) => [x * k, y * k]);

// ------------------------------------------------------------------ butterflies

export type ButterflyKind = 'tiger-swallowtail' | 'gulf-fritillary' | 'luna-moth';

interface Wing {
  /** outline control points (right side, forewing length = 1), closed */
  outline: Pt[];
  /** the control points where the outer margin starts and ends */
  margin: [number, number];
  /** discal cell: base, front corner, back corner */
  cell: [Pt, Pt, Pt];
  /** where veins reach the edge, as fractional control-point positions along the outline */
  veinEnds: number[];
  /** scalloped margin: how deep each scallop is */
  scallop?: number;
}

interface Species {
  fore: Wing;
  hind: Wing;
  /** the dark parts of the pattern, inside each wing */
  pattern: (fore: Pt[], hind: Pt[], F: number, pen: number, seed: number, small: boolean) => { fore: string; hind: string };
  body: { abdomen: number; girth: number; antenna: 'club' | 'feather'; fur?: boolean };
  /** vein weight (fritillaries have dark veins) */
  veins?: number;
}

function centroid(pts: Pt[]): Pt {
  return mul(pts.reduce((a, b) => add(a, b), [0, 0] as Pt), 1 / pts.length);
}

/** The outline's control points (with scallops along the outer margin) and its polygon. */
function outlinePts(w: Wing, F: number): { pts: Pt[]; poly: Pt[] } {
  let ctrl = scale(w.outline, F);
  if (w.scallop) {
    const [m0, m1] = w.margin;
    const run = splinePts(ctrl.slice(m0, m1 + 1), false, 12);
    const c = centroid(ctrl);
    const n = 6;
    const out: Pt[] = [];
    for (let i = 0; i <= n * 2; i++) {
      const p = run[Math.round((i / (n * 2)) * (run.length - 1))];
      out.push(i % 2 ? lerp(p, c, (w.scallop * F) / Math.hypot(p[0] - c[0], p[1] - c[1])) : p);
    }
    ctrl = [...ctrl.slice(0, m0), ...out, ...ctrl.slice(m1 + 1)];
  }
  return { pts: ctrl, poly: splinePts(ctrl, true, 8) };
}
/** A point on the outline (unscalloped) at a fractional control-point position. */
function onOutline(w: Wing, F: number, at: number): Pt {
  const poly = splinePts(scale(w.outline, F), true, 16);
  return poly[Math.round(at * 16) % poly.length];
}
/** Points along the outer margin, `depth` in from the edge (toward the wing's middle). */
function alongMargin(w: Wing, F: number, depth: number, per = 10): Pt[] {
  const c = centroid(scale(w.outline, F));
  const run = splinePts(scale(w.outline, F).slice(w.margin[0], w.margin[1] + 1), false, per);
  return run.map((p) => lerp(p, c, (depth * F) / Math.hypot(p[0] - c[0], p[1] - c[1])));
}
/** The band along the outer margin, from beyond the edge to `depth` inside it. */
function marginBand(w: Wing, F: number, depth: number): Pt[] {
  return [...alongMargin(w, F, -0.12), ...alongMargin(w, F, depth).reverse()];
}
/** Small pale spots set into the margin band, between the veins. */
function lunules(w: Wing, F: number, inset: number, count: number, size: number, from = 0.08, to = 0.92): Pt[][] {
  const run = alongMargin(w, F, inset, 12);
  return Array.from({ length: count }, (_, i) => {
    const t = from + (to - from) * (count === 1 ? 0.5 : i / (count - 1));
    const k = Math.round(t * (run.length - 1));
    const p = run[k];
    const q = run[Math.min(run.length - 1, k + 1)];
    const r = run[Math.max(0, k - 1)];
    const ang = (Math.atan2(q[1] - r[1], q[0] - r[0]) * 180) / Math.PI;
    return ellipsePts(p, size * F, size * F * 0.5, ang, 14);
  });
}
/** The dark parts of a pattern: close hatching, no darker than the plants' own shading. */
function black(within: Pt[][], gap: number, angle: number, seed: number, holes: Pt[][] = []) {
  return hatch(within, { angle, gap, holes, seed });
}
/** Hatching gap for a drawing of forewing length F: drawn small, the lines stand further apart. */
const gapFor = (F: number, small: boolean) => F * (small ? 0.085 : GAP * 0.85);
const ring = (pen: number, c: Pt, rx: number, ry: number, deg = 0, k = 0.45) => new Plate(pen).shape(spline(ellipsePts(c, rx, ry, deg, 12), true), k).toString();

const GAP = 0.05; // hatching gap, in forewing lengths

function wingMarkup(w: Wing, F: number, pen: number, inner: string, veinK: number, seed: number, small = false): string {
  const r = rng(seed);
  const { pts } = outlinePts(w, F);
  const pl = new Plate(pen).shape(spline(pts, true), 0.9);
  pl.add(inner);
  // the cell, and veins running out from it to the edge
  const [cb, cf, cd] = scale(w.cell, F);
  pl.lines(quad(cb, add(lerp(cb, cf, 0.5), mul([cf[1] - cb[1], cb[0] - cf[0]], 0.05)), cf) + quad(cb, lerp(cb, cd, 0.5), cd) + quad(cf, add(lerp(cf, cd, 0.5), [F * 0.012, 0]), cd), veinK * 0.85);
  let v = '';
  const n = w.veinEnds.length;
  w.veinEnds.forEach((at, i) => {
    if (small && i % 2) return;
    const end = onOutline(w, F, at);
    const t = n === 1 ? 0.5 : i / (n - 1);
    const from = t < 0.3 ? lerp(cb, cf, 0.5 + t * 1.6) : t < 0.75 ? lerp(cf, cd, (t - 0.3) / 0.45) : lerp(cd, cb, (t - 0.75) * 1.4);
    const bow = (r() - 0.5) * F * 0.025;
    v += quad(from, add(lerp(from, end, 0.5), [bow, bow]), lerp(from, end, 0.985));
  });
  pl.lines(v, veinK);
  return pl.toString();
}

const SPECIES: Record<ButterflyKind, Species> = {
  // Georgia's state butterfly: yellow, with black tiger stripes and a black border set with pale spots
  'tiger-swallowtail': {
    fore: {
      outline: [[0.04, -0.07], [0.2, -0.215], [0.45, -0.39], [0.7, -0.535], [0.86, -0.6], [0.94, -0.595], [0.915, -0.5], [0.865, -0.34], [0.81, -0.17], [0.765, -0.02], [0.715, 0.075], [0.55, 0.09], [0.33, 0.075], [0.14, 0.055], [0.05, 0.03]],
      margin: [5, 10],
      cell: [[0.07, -0.02], [0.48, -0.31], [0.52, -0.13]],
      veinEnds: [2.6, 3.4, 4.2, 5, 6, 7, 8, 9, 10],
    },
    hind: {
      outline: [[0.05, 0], [0.25, -0.05], [0.5, -0.03], [0.66, 0.07], [0.725, 0.2], [0.715, 0.34], [0.655, 0.47], [0.575, 0.58], [0.505, 0.645], [0.52, 0.76], [0.54, 0.865], [0.505, 0.91], [0.47, 0.865], [0.46, 0.75], [0.43, 0.68], [0.35, 0.715], [0.24, 0.665], [0.15, 0.55], [0.09, 0.38], [0.06, 0.18]],
      margin: [4, 8],
      cell: [[0.07, 0.03], [0.4, 0.13], [0.42, 0.31]],
      veinEnds: [3.6, 4.6, 5.6, 6.6, 7.6, 10.5, 14.8, 16.5],
      scallop: 0.022,
    },
    pattern: (fore, hind, F, pen, seed, small) => {
      const g = gapFor(F, small);
      const lu = (holes: Pt[][]) => (small ? [] : holes);
      const k = (pts: Pt[]) => scale(pts, F);
      const sp = SPECIES['tiger-swallowtail'];
      // four stripes from the leading edge, the inner two running right across the wing
      const stripes = [
        k([[0.07, -0.2], [0.19, -0.26], [0.18, 0.14], [0.08, 0.12]]),
        k([[0.3, -0.36], [0.4, -0.42], [0.38, 0.16], [0.3, 0.16]]),
        k([[0.52, -0.5], [0.6, -0.55], [0.59, -0.16], [0.53, -0.14]]),
        k([[0.7, -0.62], [0.76, -0.65], [0.76, -0.38], [0.71, -0.36]]),
      ];
      const fh = stripes.map((s, i) => black([fore, s], g, 58, seed + i * 3)).join('') + black([fore, marginBand(sp.fore, F, 0.15)], g, 58, seed + 20, lu(lunules(sp.fore, F, 0.085, 8, 0.03)));
      const hh =
        black([hind, marginBand(sp.hind, F, 0.19)], g, 64, seed + 30, lu(lunules(sp.hind, F, 0.075, 6, 0.036, 0.04, 0.9))) +
        black([hind, k([[0.17, -0.08], [0.27, -0.08], [0.32, 0.66], [0.2, 0.66]])], g, 64, seed + 40) +
        black([hind, k([[0.44, 0.66], [0.58, 0.66], [0.58, 1], [0.44, 1]])], g, 64, seed + 50);
      return {
        fore: new Plate(pen).lines(fh, 0.3).toString(),
        hind: new Plate(pen).lines(hh, 0.3).toString() + ring(pen, k([[0.38, 0.62]])[0], F * 0.036, F * 0.028),
      };
    },
    body: { abdomen: 0.62, girth: 0.9, antenna: 'club' },
  },

  // long orange forewings, silver-white spots ringed in black, black veins; its caterpillars eat maypop
  'gulf-fritillary': {
    fore: {
      outline: [[0.04, -0.07], [0.22, -0.2], [0.48, -0.35], [0.74, -0.47], [0.9, -0.52], [0.97, -0.5], [0.94, -0.43], [0.86, -0.3], [0.78, -0.16], [0.7, -0.04], [0.61, 0.05], [0.45, 0.065], [0.26, 0.06], [0.12, 0.05], [0.05, 0.03]],
      margin: [5, 10],
      cell: [[0.07, -0.02], [0.46, -0.28], [0.49, -0.12]],
      veinEnds: [2.6, 3.4, 4.2, 5, 6, 7, 8, 9, 10],
    },
    hind: {
      outline: [[0.05, 0], [0.24, -0.04], [0.45, 0], [0.58, 0.08], [0.63, 0.2], [0.62, 0.32], [0.56, 0.43], [0.46, 0.5], [0.34, 0.53], [0.22, 0.5], [0.13, 0.42], [0.08, 0.3], [0.06, 0.15]],
      margin: [3, 8],
      cell: [[0.07, 0.03], [0.32, 0.12], [0.33, 0.27]],
      veinEnds: [3, 3.8, 4.6, 5.4, 6.2, 7, 7.8, 9.5],
      scallop: 0.014,
    },
    pattern: (fore, hind, F, pen, seed, small) => {
      const g = gapFor(F, small);
      const lu = (holes: Pt[][]) => (small ? [] : holes);
      const k = (pts: Pt[]) => scale(pts, F);
      const sp = SPECIES['gulf-fritillary'];
      const base = (poly: Pt[], s: number) => hatch([poly, k([[0, -0.2], [0.17, -0.2], [0.17, 0.4], [0, 0.4]])], { angle: 30, gap: g * 1.4, seed: s });
      const tip = black([fore, k([[0.74, -0.62], [1.1, -0.62], [1.1, -0.28], [0.8, -0.3]])], g, 58, seed + 1, lu([ellipsePts(k([[0.87, -0.46]])[0], F * 0.032, F * 0.02, -25, 12), ellipsePts(k([[0.79, -0.41]])[0], F * 0.026, F * 0.017, -25, 12)]));
      const fBand = small ? '' : hatch([fore, marginBand(sp.fore, F, 0.045)], { angle: 58, gap: g * 1.2, seed: seed + 2 });
      const hBand = black([hind, marginBand(sp.hind, F, 0.12)], g, 62, seed + 3, lu(lunules(sp.hind, F, 0.065, 6, 0.032, 0.04, 0.96)));
      const spots = k([[0.27, -0.12], [0.36, -0.18], [0.38, -0.07]]);
      return {
        fore:
          new Plate(pen).lines(base(fore, seed + 4) + tip + fBand, 0.3).toString() +
          spots.map((s) => ring(pen, s, F * 0.032, F * 0.022, -25, 0.6)).join('') +
          new Plate(pen).dots(k([[0.55, -0.21], [0.6, -0.11], [0.5, -0.02], [0.66, -0.3], [0.63, -0.38]]), F * 0.017).toString(),
        hind: new Plate(pen).lines(base(hind, seed + 5) + hBand, 0.3).toString() + new Plate(pen).dots(k([[0.3, 0.2], [0.42, 0.3]]), F * 0.015).toString(),
      };
    },
    body: { abdomen: 0.55, girth: 0.85, antenna: 'club' },
    veins: 0.6,
  },

  // pale green, with long trailing tails and an eyespot on every wing; flies on spring nights
  'luna-moth': {
    fore: {
      outline: [[0.04, -0.08], [0.22, -0.245], [0.46, -0.425], [0.68, -0.565], [0.84, -0.645], [0.9, -0.635], [0.89, -0.55], [0.85, -0.4], [0.79, -0.22], [0.72, -0.06], [0.64, 0.06], [0.46, 0.08], [0.26, 0.075], [0.12, 0.06], [0.05, 0.035]],
      margin: [5, 10],
      cell: [[0.07, -0.02], [0.42, -0.31], [0.45, -0.13]],
      veinEnds: [2.6, 3.4, 4.2, 5, 6, 7, 8, 9, 10],
    },
    hind: {
      outline: [[0.05, 0], [0.28, -0.04], [0.52, 0.02], [0.68, 0.14], [0.73, 0.28], [0.68, 0.44], [0.58, 0.57], [0.5, 0.67], [0.5, 0.82], [0.54, 0.98], [0.585, 1.12], [0.55, 1.2], [0.5, 1.15], [0.45, 1], [0.41, 0.84], [0.36, 0.72], [0.26, 0.66], [0.15, 0.54], [0.09, 0.36], [0.06, 0.17]],
      margin: [3, 7],
      cell: [[0.07, 0.03], [0.35, 0.16], [0.36, 0.34]],
      veinEnds: [3.3, 4.2, 5.1, 6, 7, 10.5, 16, 17.5],
    },
    pattern: (fore, hind, F, pen, seed, small) => {
      const g = gapFor(F, small);
      const lu = (holes: Pt[][]) => (small ? [] : holes);
      const k = (pts: Pt[]) => scale(pts, F);
      const sp = SPECIES['luna-moth'];
      // the dark leading edge of the forewing
      const costa = hatch([fore, k([[0, -0.11], [0.84, -0.74], [0.82, -0.6], [0.04, -0.03]])], { angle: 70, gap: g * 0.9, seed }) + (small ? '' : hatch([fore, k([[0, -0.11], [0.84, -0.74], [0.82, -0.6], [0.04, -0.03]])], { angle: 130, gap: g * 1.2, seed: seed + 1 }));
      // eyespots: a ring with a dark crescent and a clear middle
      const eye = (c: Pt, rx: number, ry: number, deg: number, s: number) => {
        const out = ellipsePts(c, rx, ry, deg, 16);
        const clear = ellipsePts(add(c, [rx * 0.15, -ry * 0.12]), rx * 0.52, ry * 0.5, deg, 14);
        return new Plate(pen).shape(spline(out, true), 0.55).lines(black([out], g * 0.8, deg + 75, s, [clear]), 0.3).lines(spline(clear, true), 0.3).toString();
      };
      // a fine line just inside the outer margin, and soft shading at the furred wing roots
      const inside = (w: Wing) => spline(alongMargin(w, F, 0.075, 8));
      const root = (poly: Pt[], s: number) => (small ? '' : hatch([poly, k([[0, -0.2], [0.2, -0.2], [0.2, 0.3], [0, 0.3]])], { angle: 20, gap: g * 1.5, seed: s }));
      return {
        fore: new Plate(pen).lines(costa, 0.3).lines(inside(sp.fore), 0.32).lines(root(fore, seed + 3), 0.26).toString() + eye(k([[0.42, -0.21]])[0], F * 0.07, F * 0.05, -30, seed + 4),
        hind: new Plate(pen).lines(inside(sp.hind), 0.32).lines(root(hind, seed + 5), 0.26).toString() + eye(k([[0.37, 0.31]])[0], F * 0.085, F * 0.068, 20, seed + 6),
      };
    },
    body: { abdomen: 0.55, girth: 1.35, antenna: 'feather', fur: true },
    veins: 0.36,
  },
};

/** How far a butterfly's drawing reaches from its centre, in forewing lengths (for its view box). */
export const BUTTERFLY_REACH = 1.24;

/** The four wings, spread (forewing length F). The far side is a little foreshortened, as if seen at a slant. */
export function butterflyWings(kind: ButterflyKind, F: number, pen: number, seed = 1, small = false): string {
  const sp = SPECIES[kind];
  const veinK = sp.veins ?? 0.4;
  const pat = sp.pattern(outlinePts(sp.fore, F).poly, outlinePts(sp.hind, F).poly, F, pen, seed, small);
  const side = wingMarkup(sp.hind, F, pen, pat.hind, veinK, seed + 20, small) + wingMarkup(sp.fore, F, pen, pat.fore, veinK, seed + 30, small);
  return side + `<g transform="scale(-0.9 1) rotate(-2)">${side}</g>`;
}

/** The body: abdomen, thorax, head with its eyes, and antennae (forewing length F). */
export function butterflyBody(kind: ButterflyKind, F: number, pen: number, seed = 1, small = false): string {
  const { abdomen, girth, antenna, fur } = SPECIES[kind].body;
  const r = rng(seed);
  const pl = new Plate(pen);
  const w = 0.05 * F * girth;
  const a0 = 0.04 * F;
  const aL = abdomen * F;
  const abdPts: Pt[] = [[0, a0 - w * 0.4], [w, a0 + aL * 0.12], [w * 0.95, a0 + aL * 0.5], [w * 0.55, a0 + aL * 0.86], [0, a0 + aL], [-w * 0.55, a0 + aL * 0.86], [-w * 0.95, a0 + aL * 0.5], [-w, a0 + aL * 0.12]];
  pl.shape(spline(abdPts, true), 0.75);
  let seg = '';
  for (let i = 1; i < 7; i += small ? 2 : 1) {
    const y = a0 + aL * (0.1 + i * 0.12);
    const hw = w * (i < 4 ? 0.95 : 0.95 - (i - 3) * 0.13);
    seg += quad([-hw * 0.9, y - w * 0.15], [0, y + w * 0.25], [hw * 0.9, y - w * 0.15]);
  }
  pl.lines(seg, 0.3);
  if (!small) pl.lines(hatch([splinePts(abdPts, true, 6), [[w * 0.15, 0], [F, 0], [F, F], [w * 0.15, F]]], { angle: 80, gap: F * 0.04, seed }), 0.28);
  // thorax
  const tw = w * 1.45;
  const th = ellipsePts([0, -0.04 * F], tw, 0.12 * F, 0, 16);
  pl.shape(spline(th, true), 0.75);
  if (fur) {
    let fz = '';
    const nf = small ? 10 : 22;
    for (let i = 0; i < nf; i++) {
      const a = (i / nf) * Math.PI * 2;
      const p: Pt = [Math.cos(a) * tw, -0.04 * F + Math.sin(a) * 0.12 * F];
      const len = F * (0.02 + r() * 0.015);
      fz += line(p, add(p, [Math.cos(a) * len, Math.sin(a) * len]));
    }
    pl.lines(fz, 0.3);
  }
  if (!small) pl.lines(hatch([th, [[tw * 0.15, -F], [F, -F], [F, F], [tw * 0.15, F]]], { angle: 75, gap: F * 0.04, seed: seed + 1 }), 0.28);
  // head, with the eyes bulging at its sides, and the palps
  const hy = -0.19 * F;
  const hr = 0.045 * F * Math.min(1.25, girth);
  pl.lines(line([-hr * 0.3, hy - hr * 0.8], [-hr * 0.45, hy - hr * 1.7]) + line([hr * 0.3, hy - hr * 0.8], [hr * 0.45, hy - hr * 1.7]), 0.4);
  pl.shape(spline(ellipsePts([0, hy], hr, hr * 0.85, 0, 10), true), 0.7);
  pl.dots([[-hr * 0.85, hy + hr * 0.05], [hr * 0.85, hy + hr * 0.05]], hr * 0.42);
  // antennae: slender with a club at the tip (butterflies), or feathered (moths)
  if (antenna === 'club') {
    let a = '';
    const tips: Pt[] = [];
    for (const s of [-1, 1]) {
      const tip: Pt = [s * 0.24 * F, -0.62 * F];
      a += quad([s * hr * 0.35, hy - hr * 0.7], [s * 0.05 * F, -0.45 * F], tip);
      tips.push(tip);
    }
    pl.lines(a, 0.45);
    for (const t of tips) pl.shape(spline(ellipsePts(add(t, [0, -F * 0.012]), F * 0.014, F * 0.028, (Math.atan2(t[0], -t[1]) * 180) / Math.PI, 8), true), 0.45);
  } else {
    let a = '';
    let ticks = '';
    for (const s of [-1, 1]) {
      const p0: Pt = [s * hr * 0.35, hy - hr * 0.7];
      const tip: Pt = [s * 0.22 * F, -0.48 * F];
      const ctl: Pt = [s * 0.05 * F, -0.36 * F];
      a += quad(p0, ctl, tip);
      const nt = small ? 6 : 12;
      for (let i = 1; i < nt; i++) {
        const t = i / nt;
        const u = 1 - t;
        const p: Pt = [u * u * p0[0] + 2 * u * t * ctl[0] + t * t * tip[0], u * u * p0[1] + 2 * u * t * ctl[1] + t * t * tip[1]];
        const len = F * 0.045 * Math.sin(Math.PI * Math.min(1, t * 1.1));
        ticks += line(p, add(p, [s * len * 0.8, len * 0.5])) + line(p, add(p, [-s * len * 0.5, -len * 0.75]));
      }
    }
    pl.lines(a, 0.45).lines(ticks, 0.26);
  }
  return pl.toString();
}

// ------------------------------------------------------------------ a butterfly at rest, wings closed

/** Where the closed wings meet the body, in forewing lengths (the wings pivot here). */
export const SIDE_ROOT: Pt = [0.02, -0.04];

/**
 * A gulf fritillary at rest with its wings closed over its back, seen from
 * the side (head toward -x, centred on its thorax): the underside shows, a
 * tawny ground set with long silver spots. Its four walking legs reach down
 * to y = 0.24 forewing lengths, where it stands.
 */
export function fritillaryClosedWings(F: number, pen: number, seed = 1, small = false): string {
  const r = rng(seed);
  const g = gapFor(F, small);
  const k = (pts: Pt[]) => scale(pts, F);
  const fore: Wing = {
    outline: [[0.02, -0.05], [-0.04, -0.28], [-0.09, -0.52], [-0.12, -0.74], [-0.1, -0.9], [-0.04, -0.95], [0.06, -0.86], [0.18, -0.7], [0.3, -0.5], [0.38, -0.32], [0.3, -0.16], [0.14, -0.06]],
    margin: [5, 9],
    cell: [[0.03, -0.06], [-0.03, -0.5], [0.12, -0.46]],
    veinEnds: [2, 3, 4.2, 6, 7, 8, 9],
  };
  const hind: Wing = {
    outline: [[0.04, -0.03], [0, -0.22], [0.04, -0.42], [0.14, -0.54], [0.3, -0.56], [0.45, -0.48], [0.56, -0.33], [0.6, -0.17], [0.56, -0.03], [0.46, 0.05], [0.3, 0.07], [0.15, 0.04]],
    margin: [3, 8],
    cell: [[0.05, -0.04], [0.12, -0.34], [0.26, -0.26]],
    veinEnds: [3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5],
    scallop: 0.012,
  };
  const fp = outlinePts(fore, F).poly;
  const hp = outlinePts(hind, F).poly;
  // forewing: a pale base with a few black spots, the tip tawny with silver spots
  const tipSpots = k([[-0.06, -0.84], [-0.02, -0.73], [0.07, -0.79]]).map((c) => ellipsePts(c, F * 0.035, F * 0.016, -70, 12));
  const foreInner =
    new Plate(pen).lines(black([fp, k([[-0.3, -1.1], [0.4, -1.1], [0.4, -0.62], [-0.3, -0.66]])], g, 64, seed, small ? [] : tipSpots), 0.3).toString() +
    (small ? '' : tipSpots.map((sp) => new Plate(pen).lines(spline(sp, true), 0.3).toString()).join('')) +
    new Plate(pen).dots(k([[0.06, -0.45], [0.14, -0.37], [0.01, -0.3], [0.17, -0.52]]), F * 0.017).toString();
  // hindwing: long silver spots laid along the veins, radiating from the root
  const root: Pt = [0.04, -0.03];
  const spots: [number, number, number][] = [
    [0.12, -0.36, 1], [0.2, -0.44, 1.1], [0.3, -0.48, 1], [0.4, -0.43, 1], [0.48, -0.33, 0.9],
    [0.16, -0.24, 0.9], [0.26, -0.31, 1], [0.37, -0.29, 1], [0.47, -0.19, 0.9],
    [0.21, -0.13, 0.9], [0.33, -0.13, 1], [0.44, -0.06, 0.8], [0.1, -0.17, 0.7], [0.53, -0.1, 0.7],
  ];
  const holes = spots.filter((_, i) => !small || i % 2 === 0).map(([x, y, sz]) => {
    const deg = (Math.atan2(y - root[1], x - root[0]) * 180) / Math.PI + (r() - 0.5) * 10;
    return ellipsePts([x * F, y * F], F * 0.05 * sz * (small ? 1.3 : 1), F * 0.019 * sz * (small ? 1.4 : 1), deg, 14);
  });
  const hindInner =
    new Plate(pen).lines(black([hp], g, 66, seed + 1, holes), 0.3).toString() + holes.map((h) => new Plate(pen).lines(spline(h, true), 0.3).toString()).join('');
  return wingMarkup(fore, F, pen, foreInner, 0.36, seed + 20, small) + wingMarkup(hind, F, pen, hindInner, 0.36, seed + 30, small);
}

/** The body for fritillaryClosedWings: head with its large eye, a clubbed antenna, thorax, abdomen and legs. */
export function fritillaryClosedBody(F: number, pen: number, seed = 1, small = false): string {
  const r = rng(seed);
  const k = (pts: Pt[]) => scale(pts, F);
  const pl = new Plate(pen);
  // legs: the far pair fainter, all reaching down to the perch
  pl.lines(spline(k([[-0.02, 0.06], [-0.04, 0.15], [-0.07, 0.24]])) + spline(k([[0.04, 0.06], [0.09, 0.15], [0.08, 0.24]])), 0.3);
  pl.lines(spline(k([[-0.04, 0.06], [-0.11, 0.13], [-0.15, 0.24]])) + spline(k([[0.03, 0.07], [0.13, 0.13], [0.17, 0.24]])), 0.45);
  // the abdomen, under the hindwing
  const abd = k([[0.04, 0], [0.2, -0.005], [0.38, 0.03], [0.53, 0.085], [0.51, 0.12], [0.36, 0.105], [0.18, 0.085], [0.04, 0.07]]);
  pl.shape(spline(abd, true), 0.7);
  let seg = '';
  for (let i = 1; i < 6; i++) {
    const x = 0.08 + i * 0.075;
    seg += quad(k([[x, 0.005 + x * 0.12]])[0], k([[x + 0.012, 0.045 + x * 0.1]])[0], k([[x, 0.085 + x * 0.06]])[0]);
  }
  pl.lines(seg, 0.28);
  if (!small) pl.lines(hatch([splinePts(abd, true, 6), k([[-1, 0.06], [1, 0.06], [1, 1], [-1, 1]])], { angle: 8, gap: F * 0.04, seed }), 0.26);
  // the thorax, furred
  const th = ellipsePts([-0.02 * F, 0.015 * F], 0.085 * F, 0.072 * F, 0, 16);
  pl.shape(spline(th, true), 0.7);
  let fur = '';
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * (1.05 + (i / 11) * 0.9);
    const p: Pt = [-0.02 * F + Math.cos(a) * 0.085 * F, 0.015 * F + Math.sin(a) * 0.072 * F];
    fur += line(p, add(p, [Math.cos(a) * F * 0.02 * (0.7 + r() * 0.6), Math.sin(a) * F * 0.02 * (0.7 + r() * 0.6)]));
  }
  pl.lines(fur, 0.28);
  // head, eye, palps and the antenna with its club
  const hd: Pt = [-0.135 * F, 0.03 * F];
  pl.lines(quad(k([[-0.15, -0.02]])[0], k([[-0.24, -0.2]])[0], k([[-0.42, -0.38]])[0]), 0.42);
  pl.shape(spline(ellipsePts(k([[-0.425, -0.39]])[0], F * 0.013, F * 0.03, 40, 8), true), 0.42);
  pl.shape(spline(k([[-0.17, 0.05], [-0.23, 0.07], [-0.24, 0.085], [-0.18, 0.08]]), true), 0.45);
  pl.shape(spline(ellipsePts(hd, 0.055 * F, 0.05 * F, 0, 12), true), 0.65);
  const eye = ellipsePts(add(hd, [-0.012 * F, -0.004 * F]), 0.036 * F, 0.034 * F, 0, 12);
  pl.lines(spline(eye, true), 0.4).lines(hatch([eye], { angle: 60, gap: F * (small ? 0.03 : 0.02), seed: seed + 2 }), 0.28);
  return pl.toString();
}

// ------------------------------------------------------------------ bumblebee

/**
 * The common eastern bumblebee in side view (length L), head toward -x and
 * centred on its thorax: a furred body, the tail dark, clear wings raised a
 * little over its back, and legs reaching down to grip a flower.
 */
export function bumblebee(L: number, pen: number, seed = 1, small = false): string {
  const r = rng(seed);
  const pl = new Plate(pen);
  // legs first, behind the body
  let legs = '';
  legs += quad([-L * 0.18, L * 0.1], [-L * 0.3, L * 0.22], [-L * 0.36, L * 0.32]);
  if (!small) legs += quad([-L * 0.08, L * 0.13], [-L * 0.08, L * 0.25], [-L * 0.14, L * 0.36]);
  legs += quad([L * 0.02, L * 0.12], [L * 0.16, L * 0.26], [L * 0.12, L * 0.38]);
  pl.lines(legs, 0.55);
  // the pollen basket on the hind leg
  if (!small) pl.shape(spline(ellipsePts([L * 0.14, L * 0.28], L * 0.045, L * 0.07, 20, 8), true), 0.5);
  const furry = (c: Pt, rx: number, ry: number, deg: number, n: number) => {
    if (small) return new Plate(pen).shape(spline(ellipsePts(c, rx, ry, deg, 14), true), 0.6).toString();
    const g = new Plate(pen).fill(spline(ellipsePts(c, rx * 1.04, ry * 1.04, deg, 16), true));
    let hair = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.15;
      const p: Pt = add(c, [Math.cos(a) * rx * 0.94, Math.sin(a) * ry * 0.94]);
      const len = L * (0.035 + r() * 0.03);
      hair += line(p, add(p, [Math.cos(a + (r() - 0.5) * 0.5) * len, Math.sin(a + (r() - 0.5) * 0.5) * len]));
    }
    return g.lines(hair, 0.4).toString();
  };
  // abdomen: a pale band behind the thorax, then black to the tail
  const ab: Pt = [L * 0.2, L * 0.05];
  pl.add(furry(ab, L * 0.26, L * 0.19, 12, 22));
  const abPoly = ellipsePts(ab, L * 0.25, L * 0.18, 12, 20);
  pl.lines(black([abPoly, [[L * 0.1, -L], [L, -L], [L, L], [L * 0.1, L]]], small ? L * 0.13 : L * 0.065, 70, seed), 0.3);
  pl.lines(quad([L * 0.08, -L * 0.12], [L * 0.04, L * 0.04], [L * 0.1, L * 0.21]), 0.35);
  // thorax: pale and furred; head: dark, with a large eye
  pl.add(furry([-L * 0.12, -L * 0.02], L * 0.17, L * 0.16, 0, 16));
  if (!small) pl.lines(hatch([ellipsePts([-L * 0.12, -L * 0.02], L * 0.15, L * 0.14, 0, 16), [[-L * 0.1, 0], [L, 0], [L, L], [-L * 0.1, L]]], { angle: 60, gap: L * 0.075, seed: seed + 3 }), 0.28);
  const hd: Pt = [-L * 0.35, L * 0.04];
  pl.shape(spline(ellipsePts(hd, L * 0.1, L * 0.12, -10, 12), true), 0.6);
  if (!small) pl.lines(black([ellipsePts(hd, L * 0.09, L * 0.11, -10, 14)], L * 0.065, 80, seed + 5), 0.3);
  pl.lines(spline(ellipsePts(add(hd, [L * 0.025, -L * 0.02]), L * 0.035, L * 0.065, -10, 10), true), 0.3);
  // antenna, elbowed
  pl.lines(line(add(hd, [-L * 0.02, -L * 0.1]), add(hd, [-L * 0.04, -L * 0.22])) + line(add(hd, [-L * 0.04, -L * 0.22]), add(hd, [-L * 0.14, -L * 0.28])), 0.45);
  // wings: clear, so only their edges (and, drawn large, their veins) show
  const wing = (len: number, w: number, deg: number) => {
    const pts: Pt[] = [[0, 0], [len * 0.3, -w * 0.9], [len * 0.75, -w], [len, -w * 0.45], [len * 0.8, w * 0.15], [len * 0.35, w * 0.25]];
    const g = new Plate(pen).lines(spline(pts, true), 0.5);
    if (!small) g.lines(quad([len * 0.05, -w * 0.1], [len * 0.4, -w * 0.6], [len * 0.7, -w * 0.55]) + quad([len * 0.2, w * 0.05], [len * 0.45, -w * 0.15], [len * 0.62, -w * 0.5]), 0.28);
    return `<g transform="translate(${(-L * 0.12).toFixed(1)} ${(-L * 0.15).toFixed(1)}) rotate(${deg})">${g}</g>`;
  };
  pl.add(wing(L * 0.56, L * 0.1, -9) + (small ? '' : wing(L * 0.46, L * 0.085, 3)));
  return pl.toString();
}

// ------------------------------------------------------------------ gulf fritillary caterpillar

/** The caterpillar of the gulf fritillary, which feeds on maypop: from its tail at (0,0) to its head along +x. */
export function fritillaryCaterpillar(L: number, pen: number, seed = 1, small = false): string {
  const r = rng(seed);
  const pl = new Plate(pen);
  const n = small ? 6 : 11;
  const w = L * 0.065;
  const spine = (t: number): Pt => [L * t, -Math.sin(t * Math.PI) * L * 0.05];
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const ww = w * (t < 0.12 ? 0.7 + t * 2.5 : t > 0.9 ? 1 - (t - 0.9) * 2.5 : 1);
    top.push(add(spine(t), [0, -ww]));
    bot.push(add(spine(t), [0, ww]));
  }
  // prolegs underneath
  let feet = '';
  for (const t of [0.05, 0.3, 0.38, 0.46, 0.54, 0.8, 0.86, 0.92]) {
    const p = add(spine(t), [0, w]);
    feet += line(p, add(p, [-L * 0.008, L * 0.03]));
  }
  pl.lines(feet, 0.45);
  const body = [...top, ...bot.reverse()];
  pl.shape(spline(body, true), 0.75);
  // the dark stripe along its side, and the folds between segments
  const stripe = [...top.map((p, i) => add(p, [0, w * (0.55 + 0.1 * Math.sin(i))])), ...top.slice().reverse().map((p) => add(p, [0, w * 1.15]))];
  if (small) pl.lines(spline(top.map((p) => add(p, [0, w * 0.85]))), 0.35);
  else pl.lines(black([body, stripe], L * 0.05, 75, seed), 0.3);
  let folds = '';
  for (let i = 1; i < n; i++) {
    const p = spine(i / n);
    folds += quad(add(p, [0, -w * 0.95]), add(p, [L * 0.008, 0]), add(p, [0, w * 0.95]));
  }
  pl.lines(folds, 0.3);
  // branched black spines along its back
  let sp = '';
  for (let i = 1; i < n; i++) {
    for (const off of small ? [0] : [-0.3, 0.3]) {
      const t = (i + off * 0.3) / n;
      const p = add(spine(t), [0, -w * 0.9]);
      const a = -90 + off * 40 + (r() - 0.5) * 16;
      const len = L * (0.06 + r() * 0.02);
      const tip = add(p, [Math.cos((a * Math.PI) / 180) * len, Math.sin((a * Math.PI) / 180) * len]);
      const mid = lerp(p, tip, 0.55);
      sp += line(p, tip) + (small ? '' : line(mid, add(mid, [len * 0.22, -len * 0.12])) + line(mid, add(mid, [-len * 0.22, -len * 0.12])));
    }
  }
  pl.lines(sp, 0.42);
  // the head, dark
  const hd = add(spine(1), [L * 0.025, w * 0.1]);
  pl.shape(spline(ellipsePts(hd, L * 0.04, w * 0.9, 0, 10), true), 0.6);
  if (!small) pl.lines(black([ellipsePts(hd, L * 0.036, w * 0.8, 0, 12)], L * 0.045, 80, seed + 2), 0.3);
  return pl.toString();
}

// ------------------------------------------------------------------ lady beetle

/** The convergent lady beetle (a native) from above, length L, centred on its back. */
export function ladyBeetle(L: number, pen: number, seed = 1): string {
  const pl = new Plate(pen);
  // legs just showing at the sides
  let legs = '';
  for (const s of [-1, 1]) for (const y of [-0.12, 0.02, 0.16]) legs += quad([s * L * 0.2, L * y], [s * L * 0.34, L * (y - 0.02)], [s * L * 0.38, L * (y + 0.08)]);
  pl.lines(legs, 0.45);
  // wing cases: an oval split down the middle, with black spots
  const shell = ellipsePts([0, L * 0.1], L * 0.3, L * 0.38, 0, 18);
  pl.shape(spline(shell, true), 0.75);
  pl.lines(line([0, -L * 0.24], [0, L * 0.47]), 0.45);
  const spots: [number, number, number][] = [[0.12, -0.08, 0.05], [0.2, 0.08, 0.055], [0.1, 0.18, 0.05], [0.18, 0.3, 0.045], [0.08, 0.38, 0.04], [0.22, -0.02, 0.035]];
  pl.dots(spots.flatMap(([x, y]) => [[x * L, y * L], [-x * L, y * L]] as Pt[]), L * 0.045);
  pl.dots([[0, -L * 0.2]], L * 0.04);
  // a gloss line on one wing case
  pl.lines(quad([-L * 0.2, -L * 0.04], [-L * 0.24, L * 0.12], [-L * 0.17, L * 0.26]), 0.3);
  // the pronotum: dark, with a pale rim and two pale dashes that converge
  const pron = spline([[-L * 0.25, -L * 0.22], [-L * 0.2, -L * 0.36], [0, -L * 0.4], [L * 0.2, -L * 0.36], [L * 0.25, -L * 0.22], [0, -L * 0.25]], true);
  pl.shape(pron, 0.7);
  const pronPts = splinePts([[-L * 0.23, -L * 0.23], [-L * 0.18, -L * 0.34], [0, -L * 0.37], [L * 0.18, -L * 0.34], [L * 0.23, -L * 0.23], [0, -L * 0.26]], true, 6);
  pl.lines(hatch([pronPts], { angle: 80, gap: L * 0.07, holes: [ellipsePts([-L * 0.07, -L * 0.3], L * 0.06, L * 0.018, 30, 10), ellipsePts([L * 0.07, -L * 0.3], L * 0.06, L * 0.018, -30, 10)], seed }), 0.3);
  // head
  pl.shape(spline(ellipsePts([0, -L * 0.43], L * 0.11, L * 0.06, 0, 10), true), 0.65);
  pl.dots([[-L * 0.07, -L * 0.44], [L * 0.07, -L * 0.44]], L * 0.025);
  return pl.toString();
}
