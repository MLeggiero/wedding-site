// Procedural botanical silhouettes (fern, palm, monstera, ivy) drawn at build
// time as SVG paths. Deterministic: the same seed always draws the same plant.
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

// ---------- palm frond ----------
export function palm(opts: { id: string; length?: number; count?: number; seed?: number }): Botanical {
  const { id, length: L = 360, count = 28, seed = 2 } = opts;
  const r = rng(seed);
  const b = new Bounds();
  const curve: [Pt, Pt, Pt, Pt] = [
    [0, 0],
    [L * 0.04, -L * 0.55],
    [L * 0.5, -L * 0.92],
    [L * 0.92, -L * 0.62],
  ];
  const parts: string[] = [stem(curve, L * 0.026, L * 0.006, b)];
  for (let i = 0; i < count; i++) {
    const t = 0.16 + 0.82 * (i / (count - 1));
    const base = cubic(curve, t);
    const tan = cubicTangent(curve, t);
    const size = L * 0.36 * Math.pow(Math.sin(Math.PI * (0.12 + 0.82 * t)), 0.7) * (0.88 + r() * 0.2);
    for (const side of [-1, 1]) {
      const angle = ((34 + r() * 10) * Math.PI) / 180;
      const dir = rot(tan, side * angle);
      const sag: Pt = [0, size * (0.28 + 0.2 * t)];
      const tip = add(add(base, mul(dir, size)), sag);
      const mid = add(add(base, mul(dir, size * 0.55)), mul(sag, 0.2));
      const n = perp(norm([tip[0] - base[0], tip[1] - base[1]]));
      const w = size * 0.055;
      const c1 = add(mid, mul(n, w));
      const c2 = add(mid, mul(n, -w * 0.7));
      [base, tip, c1, c2].forEach((p) => b.add(p));
      parts.push(`M${pt(base)}Q${pt(c1)} ${pt(tip)}Q${pt(c2)} ${pt(base)}Z`);
    }
  }
  const { viewBox, aspect } = b.centred(L * 0.02);
  return { id, viewBox, aspect, origin: 'bottom', markup: `<path d="${parts.join('')}"/>` };
}

// ---------- monstera ----------
export function monstera(opts: { id: string; size?: number; tilt?: number; seed?: number }): Botanical {
  const { id, size: H = 260, tilt = -12, seed = 3 } = opts;
  const r = rng(seed);
  const b = new Bounds();
  const S = H * 0.55; // petiole length
  const tiltRad = (tilt * Math.PI) / 180;
  const A: Pt = [Math.sin(tiltRad) * S * 0.3, -S]; // leaf attachment point
  const toWorld = (p: Pt): Pt => add(A, rot(p, tiltRad));

  // Right half of the leaf outline in leaf space (attachment at 0,0; tip at 0,-H).
  const right: [Pt, Pt, Pt][] = [
    [[0.34 * H, -1.0 * H], [0.62 * H, -0.8 * H], [0.63 * H, -0.5 * H]],
    [[0.65 * H, -0.18 * H], [0.5 * H, 0.13 * H], [0.27 * H, 0.12 * H]],
    [[0.13 * H, 0.12 * H], [0.03 * H, 0.04 * H], [0, -0.02 * H]],
  ];
  const tip: Pt = [0, -H];
  const m = (p: Pt): Pt => [-p[0], p[1]];
  let leaf = `M${pt(tip)}`;
  for (const [c1, c2, e] of right) {
    [c1, c2, e].forEach((p) => {
      b.add(toWorld(p));
      b.add(toWorld(m(p)));
    });
    leaf += `C${pt(c1)} ${pt(c2)} ${pt(e)}`;
  }
  b.add(toWorld(tip));
  // mirror back up the left side: reverse each right-hand segment
  const mirrored = [...right].reverse();
  for (let i = 0; i < mirrored.length; i++) {
    const [c1, c2] = mirrored[i];
    const end = i + 1 < mirrored.length ? mirrored[i + 1][2] : tip;
    leaf += `C${pt(m(c2))} ${pt(m(c1))} ${pt(m(end))}`;
  }
  leaf += 'Z';

  // Cuts (splits from the margin toward the midrib) and fenestrations (holes).
  let cuts = '';
  let holes = '';
  const splits = [0.2, 0.33, 0.46, 0.59, 0.72, 0.84];
  for (const side of [-1, 1]) {
    splits.forEach((h, k) => {
      const y = -h * H;
      const startX = side * H * (0.07 + r() * 0.02);
      const ang = ((22 + k * 4 + r() * 6) * Math.PI) / 180;
      const dir: Pt = [side * Math.cos(ang), -Math.sin(ang)];
      const far: Pt = add([startX, y], mul(dir, H * 0.9));
      const n = perp(dir);
      const w0 = H * 0.004;
      const w1 = H * 0.05;
      cuts += `M${pt(add([startX, y], mul(n, w0)))}L${pt(add(far, mul(n, w1)))}L${pt(add(far, mul(n, -w1)))}L${pt(add([startX, y], mul(n, -w0)))}Z`;
      if (k < splits.length - 1 && k % 2 === (side > 0 ? 0 : 1)) {
        const hy = -((h + splits[k + 1]) / 2) * H;
        const cx = side * H * (0.17 + r() * 0.05);
        const deg = side * -(24 + k * 4);
        holes += `<ellipse cx="${n1(cx)}" cy="${n1(hy)}" rx="${n1(H * 0.045)}" ry="${n1(H * 0.018)}" transform="rotate(${deg} ${n1(cx)} ${n1(hy)})"/>`;
      }
    });
  }

  const petiole = stem(
    [[0, 0], [A[0] * 0.2, -S * 0.4], [A[0] * 0.8, -S * 0.75], A],
    H * 0.035,
    H * 0.022,
    b,
  );
  b.add([0, 0]);
  const maskId = `${id}-cut`;
  const { viewBox, aspect } = b.centred(H * 0.04);
  const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
  // Leaf, cuts and holes are all drawn in leaf space and share one transform;
  // the mask (world space) wraps the transformed leaf.
  const g = `transform="translate(${n1(A[0])} ${n1(A[1])}) rotate(${tilt})"`;
  const markup =
    `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="${vx}" y="${vy}" width="${vw}" height="${vh}">` +
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#fff"/>` +
    `<g ${g} fill="#000"><path d="${cuts}"/>${holes}` +
    `<path d="M0,${n1(-0.04 * H)}L0,${n1(-0.97 * H)}" stroke="#777" stroke-width="${n1(H * 0.008)}"/></g>` +
    `</mask></defs>` +
    `<path d="${petiole}"/>` +
    `<g mask="url(#${maskId})"><g ${g}><path d="${leaf}"/></g></g>`;
  return { id, viewBox, aspect, origin: 'bottom', markup };
}

// ---------- ivy (hangs down) ----------
const IVY_LEAF: Pt[][] = [
  // quadratic segments: [control, end] pairs for a five-lobed ivy leaf, base at 0,0, tip at 0,-1
  [[-0.3, 0.06], [-0.48, -0.12]],
  [[-0.46, -0.28], [-0.26, -0.32]],
  [[-0.38, -0.42], [-0.44, -0.62]],
  [[-0.32, -0.72], [-0.15, -0.62]],
  [[-0.12, -0.86], [0, -1]],
  [[0.12, -0.86], [0.15, -0.62]],
  [[0.32, -0.72], [0.44, -0.62]],
  [[0.38, -0.42], [0.26, -0.32]],
  [[0.46, -0.28], [0.48, -0.12]],
  [[0.3, 0.06], [0, 0]],
];

export function ivy(opts: { id: string; length?: number; count?: number; seed?: number }): Botanical {
  const { id, length: L = 280, count = 11, seed = 4 } = opts;
  const r = rng(seed);
  const b = new Bounds();
  const curve: [Pt, Pt, Pt, Pt] = [
    [0, 0],
    [L * 0.1, L * 0.3],
    [-L * 0.12, L * 0.66],
    [L * 0.04, L],
  ];
  const parts: string[] = [stem(curve, L * 0.012, L * 0.006, b)];
  for (let i = 0; i < count; i++) {
    const t = 0.06 + 0.92 * (i / (count - 1));
    const side = i % 2 === 0 ? 1 : -1;
    const base = cubic(curve, t);
    const tan = cubicTangent(curve, t);
    const s = L * 0.15 * (1 - 0.4 * t) * (0.85 + r() * 0.3);
    const outward = norm(add(mul(perp(tan), side), [0, 0.35]));
    const angle = Math.atan2(outward[1], outward[0]) + Math.PI / 2; // leaf "up" points outward
    const anchor = add(base, mul(outward, s * 0.22));
    const tr = (p: Pt): Pt => add(anchor, rot(mul(p, s), angle));
    let d = `M${pt(tr([0, 0]))}`;
    for (const [c, e] of IVY_LEAF) {
      const tc = tr(c);
      const te = tr(e);
      b.add(tc);
      b.add(te);
      d += `Q${pt(tc)} ${pt(te)}`;
    }
    parts.push(`${d}Z`);
    // tiny petiole
    parts.push(`M${pt(add(base, mul(perp(outward), s * 0.02)))}L${pt(anchor)}L${pt(add(base, mul(perp(outward), -s * 0.02)))}Z`);
  }
  const { viewBox, aspect } = b.centred(L * 0.03);
  return { id, viewBox, aspect, origin: 'top', markup: `<path d="${parts.join('')}"/>` };
}

// ---------- the set used across the site ----------
export const BOTANICALS: Record<string, Botanical> = Object.fromEntries(
  [
    fern({ id: 'fern-a', length: 320, curl: 0.42, count: 26, seed: 11 }),
    fern({ id: 'fern-b', length: 300, curl: -0.34, count: 24, seed: 23 }),
    palm({ id: 'palm-a', length: 360, count: 26, seed: 5 }),
    monstera({ id: 'monstera-a', size: 240, tilt: -14, seed: 7 }),
    ivy({ id: 'ivy-a', length: 300, count: 12, seed: 9 }),
  ].map((b) => [b.id, b]),
);
