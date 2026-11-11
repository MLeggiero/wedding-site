// Botanical line engravings of plants native to the southeastern US, drawn in
// code. One ink colour; every shape is filled with the paper colour so that
// whatever lies on top hides the lines behind it, as in a printed engraving.
// Outlines, veins and fine hatching on the shaded side; no gradients, no
// shadows. Deterministic: the same seed always draws the same plant.
//
// Generators return SVG markup in local coordinates (origin = where the plant
// attaches, growing toward -y unless noted). `pen` is the outline width in
// screen pixels: the files draw every line with a non-scaling stroke, so the
// pen weight stays the same at any size. Veins and hatching are drawn finer.

export const INK = '#61746a';
export const PAPER = '#efede6';

type Pt = [number, number];

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (v: number) => (Math.round(v * 10) / 10).toString();
const P = (p: Pt) => `${f(p[0])},${f(p[1])}`;

/** Wrap markup in a transform: translate, rotate (deg), uniform scale, optional mirror. */
export function place(markup: string, x: number, y: number, rot = 0, scale = 1, mirror = false): string {
  const sx = mirror ? -scale : scale;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})${scale !== 1 || mirror ? ` scale(${f(sx)} ${f(scale)})` : ''}">${markup}</g>`;
}

// ------------------------------------------------------------------ geometry
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const rot = (p: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};
const polar = (r: number, deg: number): Pt => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r];

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
export function spline(pts: Pt[], closed = false): string {
  if (pts.length < 2) return '';
  const N = pts.length;
  const at = (i: number) => (closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))]);
  let d = `M${P(pts[0])}`;
  const segs = closed ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return closed ? d + 'Z' : d;
}
const line = (a: Pt, b: Pt) => `M${P(a)}L${P(b)}`;
const quad = (a: Pt, c: Pt, b: Pt) => `M${P(a)}Q${P(c)} ${P(b)}`;

/** One engraved element: a paper-filled outline, then its interior lines. */
class Plate {
  out: string[] = [];
  pen: number;
  constructor(pen: number) {
    this.pen = pen;
  }
  shape(d: string, k = 1) {
    if (d) this.out.push(`<path d="${d}" fill="${PAPER}" stroke-width="${f(this.pen * k)}"/>`);
    return this;
  }
  lines(d: string, k = 0.55) {
    if (d) this.out.push(`<path d="${d}" fill="none" stroke-width="${f(this.pen * k)}"/>`);
    return this;
  }
  dots(pts: Pt[], r: number) {
    if (pts.length) this.out.push(`<path d="${pts.map((p) => `M${f(p[0] - r)},${f(p[1])}a${f(r)},${f(r)} 0 1 0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1 0 ${f(-2 * r)},0`).join('')}" fill="${INK}" stroke="none"/>`);
    return this;
  }
  add(markup: string) {
    this.out.push(markup);
    return this;
  }
  toString() {
    return this.out.join('');
  }
}

/** Wrap engraved markup with the shared ink style (strokes keep their pen width at any size). */
export function ink(markup: string) {
  return `<g stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${markup}</g>`;
}
export const INK_STYLE = '<style>path{vector-effect:non-scaling-stroke}</style>';

// ------------------------------------------------------------------ leaves

interface LeafSpec {
  L: number;
  /** half-width at the widest point */
  W: number;
  /** sideways reach of the tip, as a fraction of L */
  bend?: number;
  /** where the leaf is widest (0.5 = middle; lower = nearer the stalk) */
  widest?: number;
  /** drawn-out tip (0 = rounded, 1 = long point) */
  acuminate?: number;
  /** pairs of side veins */
  veins?: number;
  /** veins curving up toward the tip (dogwood) */
  arcuate?: boolean;
  /** which half carries the shading hatch: 1, -1, or 0 for none */
  shade?: 1 | -1 | 0;
  /** a rolled edge drawn along the margin (magnolia) */
  rolled?: boolean;
  /** a little toothed margin */
  serrate?: number;
  stalk?: number;
  seed?: number;
}

/** A leaf with its stalk at (0,0), growing toward -y. */
export function leaf(s: LeafSpec, pen: number): string {
  const r = rng(s.seed ?? 1);
  const { L, W } = s;
  const st = s.stalk ?? 0;
  const bend = (s.bend ?? 0) * L;
  const p0: Pt = [0, -st];
  const p1: Pt = [bend * 0.15, -st - L * 0.55];
  const p2: Pt = [bend, -st - L];
  const mid = (t: number): Pt => {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  };
  const nrm = (t: number): Pt => {
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };
  const widest = s.widest ?? 0.45;
  const pw = Math.log(0.5) / Math.log(widest);
  const ac = s.acuminate ?? 0.3;
  const width = (t: number) => W * Math.pow(Math.sin(Math.PI * Math.pow(t, pw)), 0.75 + ac * 0.6) * (1 - ac * 0.25 * Math.pow(t, 3));
  const lw = 1 + (r() - 0.5) * 0.12;
  const rw = 1 + (r() - 0.5) * 0.12;
  const N = 16;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 1; i < N; i++) {
    const t = i / N;
    let w = width(t);
    if (s.serrate) w *= 1 + (i % 2 ? s.serrate : -s.serrate * 0.4);
    left.push(add(mid(t), mul(nrm(t), w * lw)));
    right.push(add(mid(t), mul(nrm(t), -w * rw)));
  }
  const outline = spline([mid(0), ...left, mid(1), ...right.reverse()], true);
  const pl = new Plate(pen);
  if (st > 0) pl.lines(quad([0, 0], [bend * 0.02, -st * 0.5], p0), 0.9);
  pl.shape(outline);
  // midrib
  pl.lines(spline([0.02, 0.25, 0.5, 0.75, 0.93].map(mid)), 0.6);
  // side veins
  let veins = '';
  const vc = s.veins ?? 6;
  for (let i = 0; i < vc; i++) {
    const t = 0.12 + (i / vc) * 0.72;
    for (const side of [1, -1]) {
      const reach = s.arcuate ? 0.26 : 0.11;
      const t2 = Math.min(0.97, t + reach);
      const end = add(mid(t2), mul(nrm(t2), side * width(t2) * (s.arcuate ? 0.7 : 0.82)));
      const ctl = add(mid(t + 0.02), mul(nrm(t + 0.02), side * width(t) * (s.arcuate ? 0.75 : 0.45)));
      veins += quad(mid(t), ctl, end);
    }
  }
  pl.lines(veins, 0.38);
  // shading: fine hatch along one margin, roughly parallel to the veins
  const shade = s.shade ?? 1;
  if (shade) {
    let h = '';
    const count = Math.max(6, Math.min(32, Math.round(L / 7)));
    for (let i = 0; i < count; i++) {
      const t = 0.06 + (i / count) * 0.88;
      const w = width(t);
      if (w < W * 0.12) continue;
      const a = add(mid(t), mul(nrm(t), shade * w * 0.94));
      const t2 = Math.max(0.02, t - 0.035);
      const b = add(mid(t2), mul(nrm(t2), shade * w * (0.5 + r() * 0.12)));
      h += line(a, b);
    }
    pl.lines(h, 0.3);
  }
  if (s.rolled) {
    const side = -(shade || 1);
    const pts: Pt[] = [];
    for (let t = 0.12; t <= 0.86; t += 0.06) pts.push(add(mid(t), mul(nrm(t), side * width(t) * 0.9)));
    pl.lines(spline(pts), 0.32);
  }
  return pl.toString();
}

// ------------------------------------------------------------------ stems

/** A tapered, outlined twig through the points (base first). */
export function twig(pts: Pt[], w0: number, w1: number, pen: number, seed = 1): string {
  const r = rng(seed);
  const n = pts.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) * (1 + (r() - 0.5) * 0.1);
    left.push([p[0] - (dy / l) * w, p[1] + (dx / l) * w]);
    right.push([p[0] + (dy / l) * w, p[1] - (dx / l) * w]);
  });
  const d = spline([...left, ...right.reverse()], true);
  const pl = new Plate(pen).shape(d, 0.9);
  // a few short hatch marks along the shaded side of the bark
  let h = '';
  for (let i = 1; i < n - 1; i++) {
    if (r() < 0.45) continue;
    const a = lerp(right[n - 1 - i] ?? right[0], pts[i], 0.12);
    const b = lerp(a, pts[i], 0.45);
    h += line(a, b);
  }
  pl.lines(h, 0.3);
  return pl.toString();
}

/** A thin stem or tendril as a single line. */
export function stem(pts: Pt[], pen: number, k = 0.7) {
  return new Plate(pen).lines(spline(pts), k).toString();
}

/** A coiled tendril starting at the origin and heading along +x. */
export function tendril(L: number, turns: number, pen: number, seed = 1) {
  const pts: Pt[] = [];
  const straight = L * 0.5;
  for (let i = 0; i <= 5; i++) pts.push([(i / 5) * straight, Math.sin(i * 1.1 + seed) * L * 0.025]);
  // then a spiral that tightens as it turns
  const R0 = L * 0.14;
  const steps = Math.round(turns * 16);
  for (let i = 1; i <= steps; i++) {
    const a = Math.PI / 2 - (i / 16) * Math.PI * 2;
    const rr = R0 * (1 - (i / steps) * 0.75);
    pts.push([straight + Math.cos(a) * rr, -R0 + Math.sin(a) * rr]);
  }
  return stem(pts, pen, 0.45);
}

// ------------------------------------------------------------------ petals

interface PetalSpec {
  L: number;
  W: number;
  /** where the petal is widest (0.5 middle; higher = spoon-shaped) */
  widest?: number;
  /** notch at the tip (dogwood) */
  notch?: number;
  /** ruffled edge */
  ruffle?: number;
  veins?: number;
  shade?: 1 | -1 | 0;
  /** the hatch reaches this far from the base */
  hatch?: number;
  bend?: number;
  seed?: number;
}

/** A petal from (0,0) toward -y. */
export function petal(s: PetalSpec, pen: number): string {
  const r = rng(s.seed ?? 1);
  const { L, W } = s;
  const widest = s.widest ?? 0.62;
  const pw = Math.log(0.5) / Math.log(widest);
  const bend = (s.bend ?? 0) * L;
  const mid = (t: number): Pt => [bend * t * t, -L * t];
  const width = (t: number) => W * Math.pow(Math.sin(Math.PI * Math.pow(t, pw)), 0.7);
  const N = 14;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 1; i < N; i++) {
    const t = i / N;
    const ruf = s.ruffle ? 1 + Math.sin(t * 19 + (s.seed ?? 1)) * s.ruffle * t : 1;
    left.push(add(mid(t), [-width(t) * ruf, 0]));
    right.push(add(mid(t), [width(t) * ruf * (1 + (r() - 0.5) * 0.08), 0]));
  }
  let tip: Pt[] = [mid(1)];
  if (s.notch) {
    const nd = L * s.notch;
    tip = [add(mid(0.985), [-W * 0.18, 0]), add(mid(1 - s.notch), [0, 0]), add(mid(0.985), [W * 0.18, 0])];
    void nd;
  }
  const outline = spline([[0, 0], ...left, ...tip, ...right.reverse()], true);
  const pl = new Plate(pen).shape(outline);
  // veins fanning from the base
  let v = '';
  const vc = s.veins ?? 3;
  for (let i = 0; i < vc; i++) {
    const k = vc === 1 ? 0 : (i / (vc - 1)) * 2 - 1;
    const end = add(mid(0.78 + r() * 0.08), [k * W * 0.5, 0]);
    v += quad(add(mid(0.06), [k * W * 0.08, 0]), add(mid(0.45), [k * W * 0.42, 0]), end);
  }
  pl.lines(v, 0.32);
  // shade near the base on one side
  const shade = s.shade ?? 1;
  if (shade) {
    let h = '';
    const reach = s.hatch ?? 0.4;
    const count = Math.max(4, Math.min(16, Math.round((L * reach) / 5.5)));
    for (let i = 0; i < count; i++) {
      const t = 0.08 + (i / count) * reach;
      const a = add(mid(t), [shade * width(t) * 0.92, 0]);
      const b = add(mid(t + 0.05), [shade * width(t) * (0.35 + r() * 0.15), 0]);
      h += line(a, b);
    }
    pl.lines(h, 0.28);
  }
  return pl.toString();
}

// ------------------------------------------------------------------ Southern magnolia

export function magnoliaLeaf(L: number, pen: number, seed = 1, shade: 1 | -1 = 1) {
  const r = rng(seed);
  return leaf({ L, W: L * (0.2 + r() * 0.04), bend: (r() - 0.5) * 0.16, widest: 0.5, acuminate: 0.15, veins: 7, shade, rolled: true, stalk: L * 0.06, seed }, pen);
}

/** An open magnolia flower seen from above, centred on the origin. */
export function magnoliaFlower(R: number, pen: number, seed = 1) {
  const r = rng(seed);
  const pl = new Plate(pen);
  const a0 = r() * 360;
  // three rings of tepals: broad outer ones, then two rings that cup round the cone
  const rings: [number, number, number, number][] = [
    [3, 1, 0.37, 0],
    [3, 0.8, 0.33, 60],
    [3, 0.52, 0.24, 25],
  ];
  rings.forEach(([count, size, wide, off], ring) => {
    for (let i = 0; i < count; i++) {
      const a = a0 + off + i * (360 / count) + (r() - 0.5) * 16;
      pl.add(
        place(
          petal({ L: R * size * (0.93 + r() * 0.14), W: R * wide, widest: 0.6, veins: ring === 2 ? 2 : 4, shade: i % 2 ? 1 : -1, hatch: 0.5, ruffle: 0.025, bend: (r() - 0.5) * 0.12, seed: seed * 10 + ring * 3 + i }, pen),
          0,
          0,
          a,
          1,
        ),
      );
    }
  });
  // the ring of stamens, then the cone with its spiral of carpels
  let st = '';
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * 360 + r() * 5;
    st += line(polar(R * 0.15, a), polar(R * (0.24 + r() * 0.04), a + 3));
  }
  pl.lines(st, 0.42);
  pl.shape(spline(Array.from({ length: 14 }, (_, i) => polar(R * 0.15 * (i % 2 ? 0.93 : 1), (i / 14) * 360)), true), 0.75);
  let marks = '';
  for (let i = 0; i < 16; i++) {
    const rr = R * 0.12 * Math.sqrt((i + 0.5) / 16);
    const p = polar(rr, i * 137.5);
    marks += quad(add(p, [-R * 0.014, R * 0.004]), add(p, [0, -R * 0.016]), add(p, [R * 0.014, R * 0.004]));
  }
  pl.lines(marks, 0.32);
  return pl.toString();
}

/** A furled magnolia bud with its sheath, from (0,0) toward -y. */
export function magnoliaBud(L: number, pen: number, seed = 1) {
  const r = rng(seed);
  const W = L * 0.22;
  const bud = spline([[0, 0], [-W * 0.8, -L * 0.25], [-W, -L * 0.55], [-W * 0.4, -L * 0.9], [0, -L], [W * 0.45, -L * 0.88], [W, -L * 0.5], [W * 0.75, -L * 0.22]], true);
  const pl = new Plate(pen).shape(bud);
  pl.lines(quad([W * 0.1, -L * 0.04], [W * 0.5, -L * 0.5], [W * 0.05, -L * 0.96]) + quad([-W * 0.3, -L * 0.08], [-W * 0.6, -L * 0.45], [-W * 0.15, -L * 0.85]), 0.35);
  let h = '';
  for (let i = 0; i < 7; i++) {
    const t = 0.15 + i * 0.1;
    h += line([W * (0.9 - t * 0.3), -L * t], [W * (0.45 - t * 0.2), -L * (t + 0.04)]);
  }
  pl.lines(h, 0.28);
  // the sheath at the base
  pl.shape(spline([[0, L * 0.02], [-W * 0.7, -L * 0.06], [-W * 0.5, -L * 0.2], [0, -L * 0.14], [W * 0.5, -L * 0.2], [W * 0.7, -L * 0.06]], true), 0.8);
  void r;
  return pl.toString();
}
/**
 * A magnolia bud where it grows: at the tip of a stout twig. The twig rises
 * from (0,0) along -y for `stemL` (curving by `bend`), ringed by a couple of
 * leaf scars, and the bud stands on its end. Set the base behind a flower or
 * leaves so the twig seems to come out of the cluster.
 */
export function magnoliaBudTwig(L: number, stemL: number, pen: number, seed = 1, bend = 0.12) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    pts.push([bend * stemL * t * t, -stemL * t]);
  }
  let s = twig(pts, L * 0.06, L * 0.042, pen, seed);
  // leaf scars ring the twig just below the bud
  let rings = '';
  for (const t of [0.72, 0.88]) {
    const [x, y] = [bend * stemL * t * t, -stemL * t];
    const w = L * (0.06 - 0.018 * t);
    rings += quad([x - w, y + w * 0.15], [x, y - w * 0.35], [x + w, y + w * 0.15]);
  }
  s += new Plate(pen).lines(rings, 0.4).toString();
  const [ex, ey] = pts[5];
  const [px, py] = pts[4];
  const rot = (Math.atan2(ex - px, -(ey - py)) * 180) / Math.PI;
  return s + place(magnoliaBud(L, pen, seed), ex, ey, rot);
}

// ------------------------------------------------------------------ flowering dogwood

export function dogwoodLeaf(L: number, pen: number, seed = 1, shade: 1 | -1 = 1) {
  const r = rng(seed);
  return leaf({ L, W: L * (0.27 + r() * 0.04), bend: (r() - 0.5) * 0.22, widest: 0.42, acuminate: 0.85, veins: 5, arcuate: true, shade, stalk: L * 0.08, seed }, pen);
}

/** A dogwood blossom (four notched bracts round a button of florets), centred on the origin. */
export function dogwoodFlower(R: number, pen: number, seed = 1) {
  const r = rng(seed);
  const pl = new Plate(pen);
  const a0 = r() * 90;
  for (let i = 0; i < 4; i++) {
    const a = a0 + i * 90 + (r() - 0.5) * 12;
    pl.add(place(petal({ L: R * (0.92 + r() * 0.12), W: R * 0.4, widest: 0.6, notch: 0.07, veins: 3, shade: i % 2 ? 1 : -1, hatch: 0.3, seed: seed * 7 + i }, pen), 0, 0, a, 1));
  }
  const pts: Pt[] = [];
  for (let i = 0; i < 14; i++) pts.push(polar(R * 0.14 * Math.sqrt((i + 0.5) / 14), i * 137.5));
  let florets = '';
  for (const p of pts) florets += spline(Array.from({ length: 6 }, (_, k) => add(p, polar(R * 0.035, k * 60))), true);
  pl.shape(spline(Array.from({ length: 10 }, (_, k) => polar(R * 0.19, k * 36)), true), 0.6);
  pl.lines(florets, 0.4);
  return pl.toString();
}

/** A dogwood twig: opposite leaves and blossoms, from (0,0) toward -y. */
export function dogwoodBranch(L: number, pen: number, seed = 1) {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i <= 5; i++) pts.push([(r() - 0.5) * L * 0.06 + i * L * 0.025, -i * (L / 5)]);
  let s = twig(pts, L * 0.022, L * 0.008, pen, seed);
  const flowers: string[] = [];
  pts.slice(1).forEach(([x, y], i) => {
    const side = i % 2 ? 1 : -1;
    s += place(dogwoodLeaf(L * 0.36, pen, seed + i * 3, -side as 1 | -1), x, y, side * (52 + r() * 18), 1);
    s += place(dogwoodLeaf(L * 0.32, pen, seed + i * 3 + 1, side as 1 | -1), x, y, -side * (58 + r() * 18), 1);
    if (i === 1 || i === 3 || i === pts.length - 2) flowers.push(place(dogwoodFlower(L * 0.2, pen, seed + i * 5), x + side * L * 0.12, y - L * 0.05, r() * 60, 1));
  });
  return s + flowers.join('');
}

// ------------------------------------------------------------------ native azaleas

/** One funnel-shaped azalea flower with its long stamens, from (0,0) (the tube's base) toward -y. */
function azaleaFlower(L: number, pen: number, seed: number) {
  const r = rng(seed);
  const pl = new Plate(pen);
  const tube = spline([[-L * 0.035, 0], [-L * 0.045, -L * 0.3], [-L * 0.09, -L * 0.42], [L * 0.09, -L * 0.42], [L * 0.045, -L * 0.3], [L * 0.035, 0]], true);
  pl.shape(tube, 0.8);
  // five spreading lobes
  for (let k = 0; k < 5; k++) {
    const a = -150 + k * 30 + (r() - 0.5) * 10 + 90;
    pl.add(place(petal({ L: L * (0.4 + r() * 0.06), W: L * 0.13, widest: 0.6, veins: 1, shade: k < 2 ? 1 : 0, hatch: 0.35, seed: seed + k }, pen), 0, -L * 0.42, a - 90, 1));
  }
  // five stamens and the style, long and curving up past the lobes
  let st = '';
  const dots: Pt[] = [];
  for (let k = 0; k < 6; k++) {
    const a = -104 + k * 6 + (r() - 0.5) * 4;
    const len = L * (0.62 + r() * 0.16) * (k === 5 ? 1.12 : 1);
    const end = add([0, -L * 0.42], polar(len, a));
    const c = add([0, -L * 0.42], polar(len * 0.55, a + 14 * (k < 3 ? -1 : 1)));
    st += quad([0, -L * 0.42], c, end);
    dots.push(end);
  }
  pl.lines(st, 0.42);
  pl.dots(dots, L * 0.016);
  return pl.toString();
}

/** A truss of native azalea flowers on a short stem, from (0,0) toward -y. */
export function azalea(R: number, pen: number, seed = 1) {
  const r = rng(seed);
  let s = '';
  const n = 5;
  const order = [0, 4, 1, 3, 2];
  for (const i of order) {
    const a = -64 + (i / (n - 1)) * 128 + (r() - 0.5) * 10;
    s += place(azaleaFlower(R * (0.8 + r() * 0.2) * (i === 2 ? 1.1 : 1), pen, seed * 11 + i), 0, -R * 0.08, a, 1);
  }
  // a few leaves gathered under the truss
  let leaves = '';
  for (let k = 0; k < 4; k++) leaves += place(leaf({ L: R * (0.55 + r() * 0.2), W: R * 0.13, widest: 0.6, acuminate: 0.2, veins: 4, shade: k % 2 ? 1 : -1, seed: seed + 40 + k }, pen), 0, 0, 120 + k * 40 + (r() - 0.5) * 20, 1);
  return leaves + s;
}

// ------------------------------------------------------------------ ferns

/** Christmas fern: alternate pinnae, each with its little "stocking" ear. Grows toward -y. */
export function christmasFern(L: number, pen: number, seed = 1, curl = 0.25) {
  const r = rng(seed);
  const c: Pt[] = [
    [0, 0],
    [L * 0.02, -L * 0.4],
    [L * curl * 0.5, -L * 0.78],
    [L * curl, -L],
  ];
  const at = (t: number): Pt => {
    const u = 1 - t;
    return [u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0], u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1]];
  };
  const pl = new Plate(pen);
  const pinnae: string[] = [];
  const count = 22;
  for (let i = 0; i < count; i++) {
    const t = 0.1 + 0.86 * (i / (count - 1));
    const [x, y] = at(t);
    const [x2, y2] = at(Math.min(1, t + 0.01));
    const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    const side = i % 2 ? 1 : -1;
    const len = L * 0.2 * Math.min(1, (t + 0.05) / 0.3) * Math.pow(1 - t, 0.55) * (0.9 + r() * 0.15);
    if (len < L * 0.025) continue;
    const w = len * 0.2;
    // a lance-shaped pinna with an ear on its upper edge, along +x
    const shape = spline(
      [
        [0, 0],
        [len * 0.08, -w * 1.1],
        [len * 0.2, -w * 1.75],
        [len * 0.3, -w * 1.05],
        [len * 0.6, -w * 0.85],
        [len, 0],
        [len * 0.55, w * 0.85],
        [len * 0.15, w * 0.8],
      ],
      true,
    );
    const g = new Plate(pen).shape(shape, 0.75).lines(line([len * 0.04, 0], [len * 0.85, 0]), 0.3);
    if (side > 0) g.lines(line([len * 0.4, w * 0.75], [len * 0.33, w * 0.2]) + line([len * 0.55, w * 0.62], [len * 0.48, w * 0.15]) + line([len * 0.7, w * 0.45], [len * 0.63, w * 0.1]), 0.25);
    const rotd = ang + side * (68 - 34 * t);
    pinnae.push(`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rotd)}) scale(1 ${side})">${g}</g>`);
  }
  pl.lines(`M${P(at(0))}C${P(c[1])} ${P(c[2])} ${P(c[3])}`, 0.75);
  return pl.toString() + pinnae.join('');
}

/** Maidenhair fern: a wiry stalk opening into a fan of branches with fan-shaped leaflets. */
export function maidenhair(R: number, pen: number, seed = 1) {
  const r = rng(seed);
  const pl = new Plate(pen);
  pl.lines(quad([0, 0], [R * 0.05, -R * 0.4], [0, -R * 0.75]), 0.6);
  const leaflets: string[] = [];
  const branches = 5;
  for (let b = 0; b < branches; b++) {
    const a0 = ((-172 + (b / (branches - 1)) * 164) * Math.PI) / 180;
    const len = R * (0.5 + r() * 0.2) * (1 - Math.abs(Math.cos(a0)) * 0.2);
    const ex = Math.cos(a0) * len;
    const ey = -R * 0.75 + Math.sin(a0) * len * 0.95 + Math.abs(Math.cos(a0)) * len * 0.35;
    pl.lines(quad([0, -R * 0.75], [ex * 0.45, -R * 0.75 - len * 0.16], [ex, ey]), 0.42);
    for (let k = 1; k <= 7; k++) {
      const t = k / 8;
      const px = ex * t;
      const py = -R * 0.75 + (ey + R * 0.75) * t - Math.sin(t * Math.PI) * len * 0.11;
      const sz = R * 0.075 * (1 - t * 0.4);
      const side = k % 2 ? 1 : -1;
      const fan = spline([[0, 0], [sz * 0.9, -sz * 0.5], [sz * 1.2, sz * 0.25], [sz * 0.7, sz * 0.9], [sz * 0.1, sz * 0.5]], true);
      const g = new Plate(pen).shape(fan, 0.6).lines(line([0, 0], [sz * 0.85, sz * 0.1]) + line([0, 0], [sz * 0.6, sz * 0.55]), 0.22);
      leaflets.push(`<g transform="translate(${f(px)} ${f(py)}) rotate(${f((a0 * 180) / Math.PI + side * 70)})">${g}</g>`);
    }
  }
  return pl.toString() + leaflets.join('');
}

// ------------------------------------------------------------------ trillium

/** A large-flowered trillium seen from above: three leaves, three petals. Centred on the origin. */
export function trillium(R: number, pen: number, seed = 1) {
  const r = rng(seed);
  const pl = new Plate(pen);
  const a0 = r() * 120;
  for (let i = 0; i < 3; i++) pl.add(place(leaf({ L: R * 1.05, W: R * 0.42, widest: 0.45, acuminate: 0.5, veins: 4, arcuate: true, shade: i % 2 ? 1 : -1, seed: seed + i }, pen), 0, 0, a0 + 60 + i * 120, 1));
  for (let i = 0; i < 3; i++) pl.add(place(petal({ L: R * 0.42, W: R * 0.07, widest: 0.5, veins: 1, shade: 0, seed: seed + 9 + i }, pen), 0, 0, a0 + 60 + i * 120 + 8, 1));
  for (let i = 0; i < 3; i++) pl.add(place(petal({ L: R * 0.72, W: R * 0.3, widest: 0.62, veins: 5, ruffle: 0.06, shade: 1, hatch: 0.32, seed: seed + 20 + i }, pen), 0, 0, a0 + i * 120, 1));
  let st = '';
  const dots: Pt[] = [];
  for (let i = 0; i < 6; i++) {
    const a = a0 + i * 60 + 30;
    const end = polar(R * 0.16, a);
    st += line([0, 0], end);
    dots.push(end);
  }
  pl.lines(st, 0.4);
  pl.dots(dots, R * 0.022);
  return pl.toString();
}

// ------------------------------------------------------------------ maypop (passionflower)

/** A maypop flower face-on: ten tepals, the fringed corona, the central column. Centred on the origin. */
export function passionflower(R: number, pen: number, seed = 1) {
  const r = rng(seed);
  const pl = new Plate(pen);
  for (let i = 0; i < 10; i++) {
    const a = i * 36 + (i % 2) * 4 + (r() - 0.5) * 5;
    pl.add(place(petal({ L: R * (i % 2 ? 0.9 : 0.97), W: R * 0.16, widest: 0.5, veins: 1, shade: i % 3 === 0 ? 1 : 0, hatch: 0.3, seed: seed * 3 + i }, pen), 0, 0, a, 1));
  }
  // the corona: a ring of fine, wavy filaments over the tepals
  pl.shape(spline(Array.from({ length: 24 }, (_, k) => polar(R * 0.3, k * 15)), true), 0.4);
  let fil = '';
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * 360 + r() * 2;
    const pts: Pt[] = [];
    const len = R * (0.62 + r() * 0.12);
    for (let k = 0; k <= 5; k++) {
      const rr = R * 0.18 + (len - R * 0.18) * (k / 5);
      pts.push(polar(rr, a + Math.sin(k * 1.7 + i) * 2.4));
    }
    fil += spline(pts);
  }
  pl.lines(fil, 0.26);
  let inner = '';
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * 360;
    inner += line(polar(R * 0.1, a), polar(R * 0.17, a + 3));
  }
  pl.lines(inner, 0.25);
  // the column: ovary, five anthers and three styles
  pl.shape(spline(Array.from({ length: 10 }, (_, k) => polar(R * 0.07, k * 36)), true), 0.6);
  for (let i = 0; i < 5; i++) {
    const a = i * 72 + 36;
    const c = polar(R * 0.15, a);
    pl.shape(spline([add(c, rot([-R * 0.06, 0], a + 90)), add(c, rot([0, -R * 0.022], a + 90)), add(c, rot([R * 0.06, 0], a + 90)), add(c, rot([0, R * 0.022], a + 90))], true), 0.5);
  }
  let styles = '';
  const tips: Pt[] = [];
  for (let i = 0; i < 3; i++) {
    const a = i * 120 - 90;
    const end = polar(R * 0.15, a + 15);
    styles += quad([0, 0], polar(R * 0.1, a - 10), end);
    tips.push(end);
  }
  pl.lines(styles, 0.55);
  pl.dots(tips, R * 0.026);
  return pl.toString();
}

/** A deeply three-lobed maypop leaf, from (0,0) toward -y. */
export function passionLeaf(L: number, pen: number, seed = 1) {
  let s = '';
  const r = rng(seed);
  for (const [a, k, sh] of [
    [-38, 0.82, -1],
    [38, 0.82, 1],
    [0, 1, 1],
  ] as const) {
    s += place(leaf({ L: L * k, W: L * k * 0.18, widest: 0.48, acuminate: 0.5, veins: 4, serrate: 0.05, shade: sh as 1 | -1, seed: seed + a + r() }, pen), 0, 0, a, 1);
  }
  return new Plate(pen).lines(line([0, L * 0.12], [0, 0]), 0.7).toString() + s;
}

// ------------------------------------------------------------------ Carolina jessamine

/** A jessamine trumpet in side view, from (0,0) toward -y. */
function jessTrumpet(L: number, pen: number, seed: number) {
  const r = rng(seed);
  const pl = new Plate(pen);
  const w0 = L * 0.07;
  const w1 = L * 0.22;
  // the funnel
  pl.shape(spline([[-w0, 0], [-w0 * 1.1, -L * 0.4], [-w1 * 0.75, -L * 0.75], [-w1, -L * 0.86], [w1, -L * 0.86], [w1 * 0.75, -L * 0.75], [w0 * 1.1, -L * 0.4], [w0, 0]], true), 0.8);
  // the five-lobed mouth, seen at an angle
  const lobes: Pt[] = [];
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    const lobe = 1 + 0.14 * Math.cos(a * 5);
    lobes.push([Math.cos(a) * L * 0.4 * lobe, -L * 0.9 + Math.sin(a) * L * 0.15 * lobe]);
  }
  pl.shape(spline(lobes, true), 0.8);
  let v = '';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    v += line([0, -L * 0.9], [Math.cos(a) * L * 0.22, -L * 0.9 + Math.sin(a) * L * 0.08]);
  }
  pl.lines(v + quad([0, -L * 0.05], [w0 * 0.3, -L * 0.5], [w0 * 0.2, -L * 0.82]), 0.3);
  pl.shape(spline([[-w0 * 1.5, L * 0.04], [-w0 * 1.2, -L * 0.1], [0, -L * 0.06], [w0 * 1.2, -L * 0.1], [w0 * 1.5, L * 0.04]], true), 0.6);
  void r;
  return pl.toString();
}

/** A jessamine vine running along +x: twining stem, paired leaves and trumpets. */
export function jessamine(L: number, pen: number, seed = 1) {
  const r = rng(seed);
  const pts: Pt[] = [];
  const segs = Math.max(4, Math.round(L / 60));
  for (let i = 0; i <= segs; i++) pts.push([(i / segs) * L, Math.sin(i * 1.4 + seed) * L * 0.025]);
  let s = stem(pts, pen, 0.75);
  pts.slice(1, -1).forEach(([x, y], i) => {
    const lf = 46 + r() * 10;
    s += place(leaf({ L: lf, W: lf * 0.2, widest: 0.42, acuminate: 0.6, veins: 3, shade: 1, stalk: 4, seed: seed * 5 + i }, pen), x, y, -55 - r() * 25, 1);
    s += place(leaf({ L: lf * 0.9, W: lf * 0.18, widest: 0.42, acuminate: 0.6, veins: 3, shade: -1, stalk: 4, seed: seed * 5 + i + 50 }, pen), x, y, 125 + r() * 25, 1);
    if (i % 2 === 0) s += place(jessTrumpet(62 + r() * 12, pen, seed + i), x + 4, y - 3, -30 + r() * 60, 1);
  });
  return s;
}

// ------------------------------------------------------------------ fillers

/** A delicate leafy sprig: a curving stem with small alternate leaves and a bud, from (0,0) toward -y. */
export function sprig(L: number, pen: number, seed = 1, leaves = 6) {
  const r = rng(seed);
  const bend = (r() - 0.5) * L * 0.5;
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push([bend * t * t, -L * t]);
  }
  let s = stem(pts, pen, 0.6);
  for (let i = 0; i < leaves; i++) {
    const t = 0.18 + (i / leaves) * 0.72;
    const p: Pt = [bend * t * t, -L * t];
    const side = i % 2 ? 1 : -1;
    const ll = L * (0.24 - t * 0.1) * (0.85 + r() * 0.3);
    s += place(leaf({ L: ll, W: ll * 0.26, widest: 0.45, acuminate: 0.5, veins: 3, shade: side as 1 | -1, stalk: ll * 0.08, seed: seed * 3 + i }, pen), p[0], p[1], side * (38 + r() * 14), 1);
  }
  // a small bud at the tip
  const tip: Pt = [bend, -L];
  s += new Plate(pen).shape(spline([add(tip, [-L * 0.025, 0]), add(tip, [-L * 0.03, -L * 0.05]), add(tip, [0, -L * 0.085]), add(tip, [L * 0.03, -L * 0.05]), add(tip, [L * 0.025, 0])], true), 0.7).toString();
  return s;
}
