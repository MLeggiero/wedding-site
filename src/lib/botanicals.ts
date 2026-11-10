// Procedural fern silhouettes drawn at build time as SVG paths (the original
// glasshouse pages; the full-colour native plants live in natives.ts). Deterministic: the same seed always draws the same plant.
// Coordinates: the plant's base sits at (0, 0); "bottom" plants grow upward
// (negative y), "top" plants hang downward. View boxes are centred on x = 0 so
// CSS `transform-origin` at the base makes them sway naturally.

type Pt = [number, number];

export interface Botanical {
  id: string;
  viewBox: string;
  aspect: number; // width / height
  origin: 'bottom' | 'top';
  /** Inner SVG markup for a <symbol>. */
  markup: string;
}

// ---------- helpers ----------
function rng(seed: number) {
  // mulberry32
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const n1 = (n: number) => (Math.round(n * 10) / 10).toString();
const pt = (p: Pt) => `${n1(p[0])},${n1(p[1])}`;
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const norm = (a: Pt): Pt => mul(a, 1 / (len(a) || 1));
const rot = (a: Pt, rad: number): Pt => [
  a[0] * Math.cos(rad) - a[1] * Math.sin(rad),
  a[0] * Math.sin(rad) + a[1] * Math.cos(rad),
];
const perp = (a: Pt): Pt => [-a[1], a[0]];

function cubic(p: [Pt, Pt, Pt, Pt], t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  ];
}
function cubicTangent(p: [Pt, Pt, Pt, Pt], t: number): Pt {
  const u = 1 - t;
  return norm([
    3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]),
    3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]),
  ]);
}

class Bounds {
  minX = Infinity;
  minY = Infinity;
  maxX = -Infinity;
  maxY = -Infinity;
  add(p: Pt) {
    this.minX = Math.min(this.minX, p[0]);
    this.maxX = Math.max(this.maxX, p[0]);
    this.minY = Math.min(this.minY, p[1]);
    this.maxY = Math.max(this.maxY, p[1]);
  }
  /** View box centred on x = 0 so the plant base is the horizontal middle. */
  centred(pad: number) {
    const half = Math.max(Math.abs(this.minX), Math.abs(this.maxX)) + pad;
    const y = this.minY - pad;
    const h = this.maxY - this.minY + pad * 2;
    return { viewBox: `${n1(-half)} ${n1(y)} ${n1(half * 2)} ${n1(h)}`, aspect: (half * 2) / h };
  }
}

/** A tapered stem along a cubic curve, as a filled outline. */
function stem(curve: [Pt, Pt, Pt, Pt], w0: number, w1: number, b: Bounds, steps = 36): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = cubic(curve, t);
    const n = perp(cubicTangent(curve, t));
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push(add(p, mul(n, w)));
    right.push(add(p, mul(n, -w)));
  }
  [...left, ...right].forEach((p) => b.add(p));
  return `M${left.map(pt).join('L')}L${right.reverse().map(pt).join('L')}Z`;
}

/** A leaflet with scalloped (lobed) edges, swept toward its tip — fern-like. */
function lobedLeaf(base: Pt, tip: Pt, halfWidth: number, lobes: number, b: Bounds): string {
  const axis: Pt = [tip[0] - base[0], tip[1] - base[1]];
  const L = len(axis);
  const u = norm(axis);
  const n = perp(u);
  const width = (s: number) => halfWidth * Math.pow(Math.sin(Math.PI * Math.min(s, 1)), 0.7) * (1 - 0.3 * s);
  const at = (s: number, side: number, w: number): Pt => add(add(base, mul(u, s * L)), mul(n, side * w));
  const edge = (side: number) => {
    let d = '';
    for (let j = 0; j < lobes; j++) {
      const s0 = j / lobes;
      const s1 = (j + 1) / lobes;
      const mid = s0 + (s1 - s0) * 0.62; // sweep lobes toward the tip
      const valley = s1 >= 1 ? 0 : width(s1) * 0.4;
      const peak = width((s0 + s1) / 2);
      const ctrl = at(mid, side, 2 * peak - valley * 0.5);
      const end = s1 >= 1 ? tip : at(s1, side, valley);
      b.add(ctrl);
      b.add(end);
      d += `Q${pt(ctrl)} ${pt(end)}`;
    }
    return d;
  };
  // up one edge to the tip, then back down the other edge (reversed)
  const up = edge(1);
  const downPts: string[] = [];
  for (let j = lobes - 1; j >= 0; j--) {
    const s0 = j / lobes;
    const s1 = (j + 1) / lobes;
    const mid = s0 + (s1 - s0) * 0.62;
    const valley0 = j === 0 ? 0 : width(s0) * 0.4;
    const peak = width((s0 + s1) / 2);
    const valley1 = s1 >= 1 ? 0 : width(s1) * 0.4;
    const ctrl = at(mid, -1, 2 * peak - valley1 * 0.5);
    const end = j === 0 ? base : at(s0, -1, valley0);
    b.add(ctrl);
    downPts.push(`Q${pt(ctrl)} ${pt(end)}`);
  }
  b.add(base);
  b.add(tip);
  return `M${pt(base)}${up}${downPts.join('')}Z`;
}

// ---------- fern ----------
export function fern(opts: { id: string; length?: number; curl?: number; count?: number; seed?: number }): Botanical {
  const { id, length: L = 320, curl = 0.4, count = 26, seed = 1 } = opts;
  const r = rng(seed);
  const b = new Bounds();
  const curve: [Pt, Pt, Pt, Pt] = [
    [0, 0],
    [L * 0.03 * Math.sign(curl || 1), -L * 0.38],
    [L * curl * 0.5, -L * 0.8],
    [L * curl, -L * 0.97],
  ];
  const parts: string[] = [stem(curve, L * 0.022, L * 0.004, b)];
  for (let i = 0; i < count; i++) {
    const t = 0.05 + 0.92 * (i / (count - 1));
    const side = i % 2 === 0 ? 1 : -1;
    const base = cubic(curve, t);
    const tan = cubicTangent(curve, t);
    const grow = Math.min(1, (t + 0.06) / 0.3);
    const taper = Math.pow(1 - t, 0.72);
    const size = L * 0.27 * grow * taper * (0.92 + r() * 0.16);
    if (size < L * 0.015) continue;
    const angle = ((64 - 34 * t) * Math.PI) / 180;
    const dir = rot(tan, side * angle);
    const tip = add(add(base, mul(dir, size)), mul(tan, size * 0.1));
    const lobes = Math.max(2, Math.round(size / (L * 0.028)));
    parts.push(lobedLeaf(base, tip, size * 0.17, lobes, b));
  }
  const { viewBox, aspect } = b.centred(L * 0.02);
  return { id, viewBox, aspect, origin: 'bottom', markup: `<path d="${parts.join('')}"/>` };
}

// ---------- the set used across the site ----------
export const BOTANICALS: Record<string, Botanical> = Object.fromEntries(
  [
    fern({ id: 'fern-a', length: 320, curl: 0.42, count: 26, seed: 11 }),
    fern({ id: 'fern-b', length: 300, curl: -0.34, count: 24, seed: 23 }),
  ].map((b) => [b.id, b]),
);
