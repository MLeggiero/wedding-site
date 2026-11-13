// Stems that carry the parts. A stem is a path whose length is measured, so
// leaves, flowers and tendrils can be set where they grow along it, each one
// turned to follow the stem. Vines weave and end in a curl, branches taper,
// and every leaf and flower hangs on something.
import { Plate, spline, splinePts, place, twig, leaf, tendril, jessTrumpet, passionLeaf, passionflower, dogwoodLeaf, dogwoodFlower, azalea, petal, rng, type Pt } from './engrave';

export interface Path {
  pts: Pt[];
  /** distance along the path to each point */
  len: number[];
  total: number;
}

/** Measure a smooth path through the control points. */
export function measure(ctrl: Pt[], per = 8): Path {
  const pts = ctrl.length > 2 ? splinePts(ctrl, false, per) : ctrl.slice();
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
}

/** Where a path is, a distance along it, and the way it is heading there (degrees: 0 = +x, 90 = +y). */
export function along(p: Path, d: number): { pt: Pt; deg: number } {
  const D = Math.max(0, Math.min(p.total, d));
  let i = 1;
  while (i < p.len.length - 1 && p.len[i] < D) i++;
  const a = p.pts[i - 1];
  const b = p.pts[i];
  const u = (D - p.len[i - 1]) / (p.len[i] - p.len[i - 1] || 1);
  return { pt: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], deg: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
}

/** The rotation that points a part drawn toward -y along a heading. */
export const toward = (deg: number) => deg + 90;

/** A path that weaves from side to side as it goes (more so away from its base), as a growing vine does. */
export function meander(ctrl: Pt[], amp: number, wavelength: number, phase = 0): Pt[] {
  const base = measure(ctrl);
  const n = Math.max(6, Math.ceil(base.total / (wavelength / 6)));
  return Array.from({ length: n + 1 }, (_, i) => {
    const d = (i / n) * base.total;
    const { pt, deg } = along(base, d);
    const a = (deg * Math.PI) / 180;
    const off = amp * Math.min(1, d / (wavelength * 0.7)) * Math.sin((2 * Math.PI * d) / wavelength + phase);
    return [pt[0] - Math.sin(a) * off, pt[1] + Math.cos(a) * off] as Pt;
  });
}

/** The tip of a path, curling over: it keeps turning, tighter and tighter. */
export function curl(pts: Pt[], radius: number, turn = 230, side: 1 | -1 = 1): Pt[] {
  const n = pts.length;
  let deg = (Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) * 180) / Math.PI;
  let p = pts[n - 1];
  const out = pts.slice();
  const steps = 9;
  for (let i = 1; i <= steps; i++) {
    const k = 1 - (i / steps) * 0.6;
    deg += (side * turn) / steps;
    const step = (radius * k * ((turn * Math.PI) / 180)) / steps;
    p = [p[0] + Math.cos((deg * Math.PI) / 180) * step, p[1] + Math.sin((deg * Math.PI) / 180) * step];
    out.push(p);
  }
  return out;
}

/** A woody twig along a path, tapering from w0 to w1 (half-widths). */
export function twigAlong(path: Path, w0: number, w1: number, pen: number, seed = 1): string {
  const n = Math.max(4, Math.min(10, Math.round(path.total / 26)));
  return twig(Array.from({ length: n + 1 }, (_, i) => along(path, (i / n) * path.total).pt), w0, w1, pen, seed);
}

// ------------------------------------------------------------------ Carolina jessamine

export interface JessamineOpts {
  /** how far the stem weaves to each side, and over what length */
  amp?: number;
  wave?: number;
  /** distance between pairs of leaves */
  node?: number;
  /** length of the first leaves (they get smaller toward the tip) */
  leaf?: number;
  /** the leaf pairs that carry a trumpet in their axils (0 = the first) */
  flowers?: number[];
  /** the side the trumpets face: 1 = right of the way the vine grows, -1 = left */
  out?: 1 | -1;
  /** which way the tip curls over */
  curl?: 1 | -1;
}

/**
 * A Carolina jessamine vine growing along a path from its first point: a
 * slender stem that weaves a little, pairs of narrow leaves angled toward the
 * tip, golden trumpets in some of the leaf axils, and a curled tip.
 */
export function jessamineVine(ctrl: Pt[], pen: number, seed = 1, o: JessamineOpts = {}): string {
  const r = rng(seed);
  const pts = curl(meander(ctrl, o.amp ?? 8, o.wave ?? 140, r() * 6), 8, 230, o.curl ?? 1);
  const path = measure(pts, 6);
  const node = o.node ?? 54;
  const L0 = o.leaf ?? 48;
  const out = o.out ?? -1;
  let parts = '';
  let flowers = '';
  const end = path.total - 34;
  let k = 0;
  for (let d = node * 0.5; d < end; d += node * (0.88 + r() * 0.24), k++) {
    const { pt, deg } = along(path, d);
    const t = d / end;
    const L = L0 * (1 - 0.45 * t) * (0.9 + r() * 0.2);
    const spread = 38 + r() * 16;
    for (const side of [1, -1] as const) {
      const lean = side * (spread + (r() - 0.5) * 8);
      parts += place(leaf({ L: L * (side > 0 ? 1 : 0.92), W: L * 0.2, widest: 0.42, acuminate: 0.6, veins: 3, shade: side, stalk: 3.5, seed: seed * 7 + k * 2 + (side > 0 ? 1 : 0) }, pen), pt[0], pt[1], toward(deg + lean));
    }
    if (o.flowers?.includes(k)) {
      // trumpets lean toward the growing tip, like the leaves, and nod a little
      const dir = deg + out * (34 + r() * 18);
      const ped = 7 + r() * 4;
      const base: Pt = [pt[0] + Math.cos((dir * Math.PI) / 180) * ped, pt[1] + Math.sin((dir * Math.PI) / 180) * ped];
      flowers += new Plate(pen).lines(`M${pt[0].toFixed(1)},${pt[1].toFixed(1)}L${base[0].toFixed(1)},${base[1].toFixed(1)}`, 0.6).toString();
      flowers += place(jessTrumpet(58 + r() * 12, pen, seed + k), base[0], base[1], toward(dir));
    }
  }
  // two small new leaves just short of the curl
  const tip = along(path, path.total - 26);
  for (const side of [1, -1] as const) parts += place(leaf({ L: 15, W: 3.4, widest: 0.42, acuminate: 0.6, veins: 1, shade: 0, stalk: 2, seed: seed + 90 + side }, pen), tip.pt[0], tip.pt[1], toward(tip.deg + side * 34));
  return new Plate(pen).lines(spline(pts), 0.75).toString() + parts + flowers;
}

// ------------------------------------------------------------------ maypop

export interface MaypopOpts {
  amp?: number;
  wave?: number;
  node?: number;
  leaf?: number;
  /** the nodes that carry a flower, and how big it is */
  flowers?: number[];
  flower?: number;
  /** the side the first leaf grows on (they alternate) */
  first?: 1 | -1;
  /** the nodes whose leaf is left off (to keep a space open) */
  bare?: number[];
}

/**
 * A maypop (passionflower) vine climbing along a path: alternate three-lobed
 * leaves on their stalks, a coiled tendril from each leaf axil, flowers held
 * out on long stalks, and a tendril at the tip.
 */
export function maypopVine(ctrl: Pt[], pen: number, seed = 1, o: MaypopOpts = {}): string {
  const r = rng(seed);
  const pts = meander(ctrl, o.amp ?? 5, o.wave ?? 150, r() * 6);
  const path = measure(pts, 6);
  const node = o.node ?? 72;
  let stems = '';
  let leaves = '';
  let flowers = '';
  let k = 0;
  let side = o.first ?? 1;
  for (let d = node * 0.6; d < path.total - 20; d += node * (0.9 + r() * 0.2), k++, side = -side as 1 | -1) {
    const { pt, deg } = along(path, d);
    const t = d / path.total;
    if (!o.bare?.includes(k)) {
      const L = (o.leaf ?? 96) * (1 - 0.35 * t);
      const dir = deg + side * (52 + r() * 14);
      const a = (dir * Math.PI) / 180;
      // the leaf stalk is part of the leaf drawing: set the leaf so its stalk starts at the stem
      leaves += place(passionLeaf(L, pen, seed + k * 3), pt[0] + Math.cos(a) * L * 0.12, pt[1] + Math.sin(a) * L * 0.12, toward(dir));
    }
    stems += place(tendril(30 + r() * 10, 1.4 + r() * 0.5, pen, seed + k * 5), pt[0], pt[1], deg - side * (40 + r() * 15), 1, side > 0);
    if (o.flowers?.includes(k)) {
      const dir = deg - side * (58 + r() * 10);
      const a = (dir * Math.PI) / 180;
      const len = 30 + r() * 10;
      const end: Pt = [pt[0] + Math.cos(a) * len, pt[1] + Math.sin(a) * len];
      stems += new Plate(pen).lines(`M${pt[0].toFixed(1)},${pt[1].toFixed(1)}Q${(pt[0] + Math.cos(a) * len * 0.5 + 4).toFixed(1)},${(pt[1] + Math.sin(a) * len * 0.5 - 4).toFixed(1)} ${end[0].toFixed(1)},${end[1].toFixed(1)}`, 0.6).toString();
      flowers += place(passionflower(o.flower ?? 48, pen, seed + k * 7), end[0], end[1]);
    }
  }
  const tip = along(path, path.total);
  stems += place(tendril(34, 1.8, pen, seed + 77), tip.pt[0], tip.pt[1], tip.deg);
  return new Plate(pen).lines(spline(pts), 0.8).toString() + stems + leaves + flowers;
}

// ------------------------------------------------------------------ woody sprays

/** A native azalea branch: a slim twig from the first point, with a few leaves and the flower truss at its tip. */
export function azaleaBranch(ctrl: Pt[], R: number, pen: number, seed = 1): string {
  const r = rng(seed);
  const path = measure(ctrl);
  let s = twigAlong(path, R * 0.034, R * 0.022, pen, seed);
  for (const [t, side] of [[0.38, 1], [0.6, -1]] as const) {
    const { pt, deg } = along(path, t * path.total);
    const L = R * (0.62 + r() * 0.12);
    s += place(leaf({ L, W: L * 0.24, widest: 0.6, acuminate: 0.2, veins: 4, shade: side, stalk: 3, seed: seed + t * 100 }, pen), pt[0], pt[1], toward(deg + side * (48 + r() * 12)));
  }
  const tip = along(path, path.total);
  return s + place(azalea(R, pen, seed), tip.pt[0], tip.pt[1], toward(tip.deg));
}

export interface DogwoodOpts {
  /** where along the twig the leaf pairs grow (fractions of its length) */
  leaves?: number[];
  leaf?: number;
  /** blossom size, at the tip; and fractions where more blossoms stand on short side shoots */
  flower?: number;
  side?: { t: number; side: 1 | -1 }[];
}

/** A flowering dogwood twig: opposite leaves along it and a blossom at its tip (and on short side shoots). */
export function dogwoodSpray(ctrl: Pt[], pen: number, seed = 1, o: DogwoodOpts = {}): string {
  const r = rng(seed);
  const path = measure(ctrl);
  const F = o.flower ?? 40;
  let s = twigAlong(path, 4.6, 2.2, pen, seed);
  let blossoms = '';
  for (const t of o.leaves ?? [0.4, 0.75]) {
    const { pt, deg } = along(path, t * path.total);
    const L = (o.leaf ?? 92) * (1.05 - t * 0.3);
    for (const side of [1, -1] as const) s += place(dogwoodLeaf(L * (side > 0 ? 1 : 0.9), pen, seed + Math.round(t * 50) + side, side), pt[0], pt[1], toward(deg + side * (50 + r() * 14)));
  }
  for (const { t, side } of o.side ?? []) {
    const { pt, deg } = along(path, t * path.total);
    const dir = deg + side * 48;
    const a = (dir * Math.PI) / 180;
    const len = F * 0.9;
    const end: Pt = [pt[0] + Math.cos(a) * len, pt[1] + Math.sin(a) * len];
    s += new Plate(pen).lines(`M${pt[0].toFixed(1)},${pt[1].toFixed(1)}L${end[0].toFixed(1)},${end[1].toFixed(1)}`, 0.7).toString();
    blossoms += place(dogwoodFlower(F * 0.85, pen, seed + Math.round(t * 70)), end[0], end[1], r() * 60);
  }
  const tip = along(path, path.total);
  blossoms += place(dogwoodFlower(F, pen, seed + 3), tip.pt[0] + Math.cos((tip.deg * Math.PI) / 180) * F * 0.15, tip.pt[1] + Math.sin((tip.deg * Math.PI) / 180) * F * 0.15, r() * 60);
  return s + blossoms;
}

// ------------------------------------------------------------------ Sweet Betsy trillium, standing

/**
 * Sweet Betsy (Trillium cuneatum), common in Georgia woods in spring, seen
 * from the side: a stem rising from the ground at (0,0), a whorl of three
 * broad leaves, and the flower sitting right on them: three upright petals
 * cupped together, three sepals spreading below.
 */
export function trilliumStanding(H: number, pen: number, seed = 1): string {
  const r = rng(seed);
  const top = -H * 0.6;
  let s = new Plate(pen).lines(`M0,0Q${(H * 0.03).toFixed(1)},${(top * 0.5).toFixed(1)} 0,${top.toFixed(1)}`, 0.8).toString();
  // the leaves: one to each side, drooping a little, and one toward us, foreshortened
  const leafAt = (rot: number, L: number, sh: 1 | -1, k: number, squash = 1) =>
    `<g transform="translate(0 ${top.toFixed(1)}) rotate(${rot}) scale(1 ${squash})">${leaf({ L, W: L * 0.36, widest: 0.48, acuminate: 0.35, veins: 3, arcuate: true, shade: sh, seed: seed + k }, pen)}</g>`;
  s += leafAt(-78 - r() * 6, H * 0.52, -1, 1) + leafAt(80 + r() * 6, H * 0.5, 1, 2) + leafAt(180, H * 0.42, 1, 3, 0.45);
  // sepals, then the cupped petals
  for (const a of [-62, 64]) s += place(petal({ L: H * 0.2, W: H * 0.035, widest: 0.5, veins: 1, shade: 0, seed: seed + a }, pen), 0, top - H * 0.02, a);
  for (const [a, k, sh] of [[-14, 0.95, -1], [15, 0.92, 1], [0, 1, 1]] as const) {
    s += place(petal({ L: H * 0.3 * k, W: H * 0.065, widest: 0.55, veins: 3, shade: sh, hatch: 0.5, bend: -a * 0.004, seed: seed + 20 + a }, pen), 0, top - H * 0.03, a);
  }
  return s;
}
