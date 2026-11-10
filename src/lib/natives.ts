// Native plants of the southeastern US, drawn as coloured SVG at build time.
// Each generator returns markup in local coordinates (origin = where the
// plant attaches); place it with `place()`. Shared gradients live in NV_DEFS.
// Deterministic: the same seed always draws the same plant.

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
const n = (v: number) => (Math.round(v * 10) / 10).toString();
const P = (x: number, y: number) => `${n(x)},${n(y)}`;

/** Wrap markup in a transform: translate, rotate (deg), uniform scale, optional mirror. */
export function place(markup: string, x: number, y: number, rot = 0, scale = 1, mirror = false): string {
  const sx = mirror ? -scale : scale;
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(sx)} ${n(scale)})">${markup}</g>`;
}

// ---------------------------------------------------------------- gradients
export const NV_DEFS = `
<linearGradient id="nv-mag-top" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#3f7140"/><stop offset=".45" stop-color="#21452a"/><stop offset="1" stop-color="#10261a"/>
</linearGradient>
<linearGradient id="nv-mag-under" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#a9784b"/><stop offset=".55" stop-color="#83532f"/><stop offset="1" stop-color="#5a331c"/>
</linearGradient>
<linearGradient id="nv-leaf" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#86ad55"/><stop offset=".6" stop-color="#4f7c37"/><stop offset="1" stop-color="#2e5527"/>
</linearGradient>
<linearGradient id="nv-leaf-dark" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#5b8a40"/><stop offset="1" stop-color="#22432a"/>
</linearGradient>
<linearGradient id="nv-fern" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#21452a"/><stop offset=".6" stop-color="#3f6e36"/><stop offset="1" stop-color="#6f9a46"/>
</linearGradient>
<linearGradient id="nv-fern-light" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#3f6e36"/><stop offset=".6" stop-color="#6f9a46"/><stop offset="1" stop-color="#a7c46a"/>
</linearGradient>
<linearGradient id="nv-petal" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#ddcba0"/><stop offset=".45" stop-color="#f5ecd6"/><stop offset="1" stop-color="#fffdf6"/>
</linearGradient>
<linearGradient id="nv-petal-in" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#e8dab8"/><stop offset=".5" stop-color="#fbf5e6"/><stop offset="1" stop-color="#fffef9"/>
</linearGradient>
<radialGradient id="nv-cone" cx=".45" cy=".35" r=".7">
  <stop offset="0" stop-color="#e4d27c"/><stop offset=".7" stop-color="#a99a45"/><stop offset="1" stop-color="#6f6326"/>
</radialGradient>
<linearGradient id="nv-bract" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#cfd6a8"/><stop offset=".35" stop-color="#f3f2e2"/><stop offset="1" stop-color="#fffffb"/>
</linearGradient>
<linearGradient id="nv-azalea-pink" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#d9607f"/><stop offset=".5" stop-color="#f29db3"/><stop offset="1" stop-color="#fcd9e1"/>
</linearGradient>
<linearGradient id="nv-azalea-flame" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#d9481f"/><stop offset=".5" stop-color="#f28a33"/><stop offset="1" stop-color="#fcc767"/>
</linearGradient>
<linearGradient id="nv-honey" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#9c2a24"/><stop offset=".55" stop-color="#d4462f"/><stop offset="1" stop-color="#f3a13c"/>
</linearGradient>
<linearGradient id="nv-jess" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#e59a1c"/><stop offset=".5" stop-color="#f6c533"/><stop offset="1" stop-color="#ffe68e"/>
</linearGradient>
<linearGradient id="nv-tepal" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#cdbfe0"/><stop offset="1" stop-color="#f6f1fa"/>
</linearGradient>
<linearGradient id="nv-cinnamon" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#d98a46"/><stop offset="1" stop-color="#8a4519"/>
</linearGradient>
<linearGradient id="nv-maroon" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#4a1220"/><stop offset=".6" stop-color="#7a2335"/><stop offset="1" stop-color="#9c3a4a"/>
</linearGradient>
`;

/** Soft drop shadow (nv-lift) and gilt bead shading (nv-bead), shared by every drawing. */
export const LIFT_DEFS =
  `<radialGradient id="nv-bead" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff1b8"/><stop offset=".55" stop-color="#d4a443"/><stop offset="1" stop-color="#6e4a12"/></radialGradient>` +
  `<filter id="nv-lift" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#06100a" flood-opacity=".5"/></filter>`;

// ---------------------------------------------------------------- shapes
/** Generic leaf: base at 0,0, tip at 0,-L, half-width W. */
function leafD(L: number, W: number): string {
  return (
    `M0,0 C${P(0.5 * W, -0.04 * L)} ${P(1.06 * W, -0.4 * L)} ${P(0.66 * W, -0.82 * L)}` +
    ` C${P(0.42 * W, -0.95 * L)} ${P(0.12 * W, -0.99 * L)} ${P(0, -L)}` +
    ` C${P(-0.12 * W, -0.99 * L)} ${P(-0.42 * W, -0.95 * L)} ${P(-0.66 * W, -0.82 * L)}` +
    ` C${P(-1.06 * W, -0.4 * L)} ${P(-0.5 * W, -0.04 * L)} 0,0Z`
  );
}
/** Obovate petal with a rounded tip: base at 0,0, tip at 0,-l. */
function petalD(l: number, w: number): string {
  return (
    `M0,0 C${P(0.55 * w, -0.08 * l)} ${P(1.12 * w, -0.52 * l)} ${P(0.78 * w, -0.86 * l)}` +
    ` C${P(0.48 * w, -1.05 * l)} ${P(-0.48 * w, -1.05 * l)} ${P(-0.78 * w, -0.86 * l)}` +
    ` C${P(-1.12 * w, -0.52 * l)} ${P(-0.55 * w, -0.08 * l)} 0,0Z`
  );
}
/** Dogwood bract: obovate with the signature notch at the tip. */
function bractD(l: number, w: number): string {
  return (
    `M0,0 C${P(0.7 * w, -0.1 * l)} ${P(1.08 * w, -0.62 * l)} ${P(0.6 * w, -0.96 * l)}` +
    ` Q${P(0.2 * w, -1.04 * l)} ${P(0, -0.9 * l)} Q${P(-0.2 * w, -1.04 * l)} ${P(-0.6 * w, -0.96 * l)}` +
    ` C${P(-1.08 * w, -0.62 * l)} ${P(-0.7 * w, -0.1 * l)} 0,0Z`
  );
}
const veinsFor = (L: number, W: number, color: string, op: number, count = 7) => {
  let d = '';
  for (let k = 1; k <= count; k++) {
    const t = k / (count + 1);
    const y = -L * (0.05 + 0.88 * t);
    const half = W * 0.92 * Math.sin(Math.PI * Math.min(0.97, 0.12 + t * 0.92)) * 0.86;
    d += `M0,${n(y)} Q${P(half * 0.5, y - L * 0.02)} ${P(half, y - L * 0.08)} M0,${n(y)} Q${P(-half * 0.5, y - L * 0.02)} ${P(-half, y - L * 0.08)} `;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${n(L * 0.005)}" stroke-linecap="round"/>`;
};

// ---------------------------------------------------------------- Southern magnolia
export function magnoliaLeaf(L: number, under = false): string {
  const W = L * 0.25;
  const d = leafD(L, W);
  return (
    `<path d="M0,0 L0,${n(L * 0.08)}" stroke="#4e3b22" stroke-width="${n(L * 0.024)}" stroke-linecap="round"/>` +
    `<path d="${d}" fill="url(#${under ? 'nv-mag-under' : 'nv-mag-top'})" stroke="${under ? '#5a341c' : '#0b1d12'}" stroke-width="${n(L * 0.006)}"/>` +
    veinsFor(L, W, under ? '#e0b07a' : '#86a86c', under ? 0.55 : 0.32, 8) +
    `<path d="M0,${n(-L * 0.02)} Q${P(W * 0.07, -L * 0.5)} 0,${n(-L * 0.97)}" fill="none" stroke="${under ? '#e3b47d' : '#8fb06f'}" stroke-width="${n(L * 0.014)}" stroke-linecap="round" opacity="${under ? 0.95 : 0.8}"/>` +
    (under
      ? ''
      : `<path d="M${P(-W * 0.18, -L * 0.14)} Q${P(-W * 0.8, -L * 0.46)} ${P(-W * 0.3, -L * 0.86)}" fill="none" stroke="#eaf6cf" stroke-opacity=".17" stroke-width="${n(W * 0.24)}" stroke-linecap="round"/>`)
  );
}

export function magnoliaFlower(R: number, seed = 1): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = i * 60 + 30 + (r() - 0.5) * 12;
    s += `<g transform="rotate(${n(a)})"><path d="${petalD(R, R * 0.43)}" fill="url(#nv-petal)" stroke="#c7b68b" stroke-width="${n(R * 0.012)}"/>` +
      `<path d="M0,${n(-R * 0.18)} Q${P(R * 0.05, -R * 0.52)} 0,${n(-R * 0.86)}" fill="none" stroke="#d6c69e" stroke-width="${n(R * 0.01)}" opacity=".7"/></g>`;
  }
  for (let i = 0; i < 3; i++) {
    const a = i * 120 + (r() - 0.5) * 16;
    s += `<g transform="rotate(${n(a)}) scale(1 .9)"><path d="${petalD(R * 0.7, R * 0.42)}" fill="url(#nv-petal-in)" stroke="#d2c29a" stroke-width="${n(R * 0.012)}"/></g>`;
  }
  s += `<circle r="${n(R * 0.21)}" fill="#b9793d"/>`;
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2;
    s += `<circle cx="${n(Math.cos(a) * R * 0.17)}" cy="${n(Math.sin(a) * R * 0.17)}" r="${n(R * 0.035)}" fill="#e8bd78"/>`;
  }
  s += `<ellipse rx="${n(R * 0.1)}" ry="${n(R * 0.15)}" fill="url(#nv-cone)"/>`;
  for (let k = 0; k < 10; k++) {
    s += `<circle cx="${n((r() - 0.5) * R * 0.12)}" cy="${n((r() - 0.5) * R * 0.22)}" r="${n(R * 0.014)}" fill="#7a6a28"/>`;
  }
  return s;
}

// ---------------------------------------------------------------- flowering dogwood
export function dogwoodFlower(R: number, seed = 1): string {
  const r = rng(seed);
  let s = '';
  const w = R * 0.46;
  for (let i = 0; i < 4; i++) {
    const a = i * 90 + (r() - 0.5) * 14;
    const l = R * (0.92 + r() * 0.12);
    s += `<g transform="rotate(${n(a)})"><path d="${bractD(l, w)}" fill="url(#nv-bract)" stroke="#cdd0ad" stroke-width="${n(R * 0.014)}"/>` +
      `<path d="M0,${n(-l * 0.12)} Q${P(w * 0.25, -l * 0.5)} ${P(w * 0.18, -l * 0.84)} M0,${n(-l * 0.12)} Q${P(-w * 0.25, -l * 0.5)} ${P(-w * 0.18, -l * 0.84)}" fill="none" stroke="#dcdcc0" stroke-width="${n(R * 0.01)}"/>` +
      `<path d="M${P(-w * 0.24, -l * 0.97)} Q${P(0, -l * 0.84)} ${P(w * 0.24, -l * 0.97)} Q${P(0, -l * 0.92)} ${P(-w * 0.24, -l * 0.97)}Z" fill="#9b4a52" opacity=".8"/></g>`;
  }
  for (let k = 0; k < 16; k++) {
    const rr = R * 0.13 * Math.sqrt(r());
    const aa = r() * Math.PI * 2;
    s += `<circle cx="${n(Math.cos(aa) * rr)}" cy="${n(Math.sin(aa) * rr)}" r="${n(R * 0.045)}" fill="${k % 3 ? '#c9c56a' : '#8e9e48'}"/>`;
  }
  return s;
}

export function dogwoodLeaf(L: number): string {
  const W = L * 0.34;
  let veins = '';
  for (let k = 1; k <= 4; k++) {
    const y = -L * (0.12 + k * 0.15);
    veins += `M0,${n(y)} Q${P(W * 0.8, y - L * 0.05)} ${P(W * 0.35, y - L * 0.32)} M0,${n(y)} Q${P(-W * 0.8, y - L * 0.05)} ${P(-W * 0.35, y - L * 0.32)} `;
  }
  return (
    `<path d="${leafD(L, W)}" fill="url(#nv-leaf)" stroke="#2b4a22" stroke-width="${n(L * 0.008)}"/>` +
    `<path d="M0,0 L0,${n(-L * 0.95)} ${veins}" fill="none" stroke="#a9c57f" stroke-opacity=".55" stroke-width="${n(L * 0.01)}" stroke-linecap="round"/>`
  );
}

/** A dogwood twig with leaves and blossoms, growing toward -y. */
export function dogwoodBranch(L: number, seed = 1): string {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) pts.push([(r() - 0.5) * L * 0.08 + i * L * 0.02, -i * (L / 6)]);
  let s = `<path d="M${pts.map(([x, y]) => P(x, y)).join(' L')}" fill="none" stroke="#5a4130" stroke-width="${n(L * 0.03)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const flowers: string[] = [];
  pts.slice(1).forEach(([x, y], i) => {
    const side = i % 2 ? 1 : -1;
    s += place(dogwoodLeaf(L * 0.24), x, y, side * (55 + r() * 15), 1);
    s += place(dogwoodLeaf(L * 0.22), x, y, -side * (60 + r() * 15), 1);
    if (i % 2 === 1 || i === pts.length - 2) flowers.push(place(dogwoodFlower(L * 0.17, seed + i), x + side * L * 0.1, y - L * 0.04, r() * 40, 1));
  });
  return s + flowers.join('');
}

// ---------------------------------------------------------------- native azaleas
function azaleaFlower(rf: number, kind: 'pink' | 'flame', rot: number, seed: number): string {
  const r = rng(seed);
  const fill = kind === 'pink' ? 'nv-azalea-pink' : 'nv-azalea-flame';
  const edge = kind === 'pink' ? '#c9587a' : '#c4441c';
  let s = '';
  for (let k = 0; k < 5; k++) {
    s += `<g transform="rotate(${n(rot + k * 72)})"><path d="${petalD(rf, rf * 0.4)}" fill="url(#${fill})" stroke="${edge}" stroke-width="${n(rf * 0.02)}"/></g>`;
  }
  s += `<g transform="rotate(${n(rot)})"><ellipse cy="${n(-rf * 0.5)}" rx="${n(rf * 0.13)}" ry="${n(rf * 0.24)}" fill="${kind === 'pink' ? '#e27a98' : '#fbd25c'}" opacity=".85"/></g>`;
  s += `<circle r="${n(rf * 0.15)}" fill="${kind === 'pink' ? '#c24d70' : '#c8401b'}"/>`;
  for (let k = 0; k < 5; k++) {
    const a = ((rot - 90 + (k - 2) * 16 + (r() - 0.5) * 8) * Math.PI) / 180;
    const L = rf * (1.55 + r() * 0.35);
    const ex = Math.cos(a) * L;
    const ey = Math.sin(a) * L;
    s += `<path d="M0,0 Q${P(Math.cos(a) * L * 0.5 - Math.sin(a) * L * 0.15, Math.sin(a) * L * 0.5 + Math.cos(a) * L * 0.15)} ${P(ex, ey)}" fill="none" stroke="${kind === 'pink' ? '#d0607e' : '#d95a24'}" stroke-width="${n(rf * 0.03)}"/>` +
      `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="${n(rf * 0.06)}" ry="${n(rf * 0.035)}" fill="#6e3826" transform="rotate(${n((a * 180) / Math.PI)} ${n(ex)} ${n(ey)})"/>`;
  }
  return s;
}

/** A dome-shaped truss of native azalea flowers. */
export function azalea(R: number, kind: 'pink' | 'flame', seed = 1): string {
  const r = rng(seed);
  const spots: [number, number, number][] = [[0, 0, 1]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * 0.4;
    spots.push([Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.45, 0.82 + r() * 0.16]);
  }
  spots.sort((a, b) => a[1] - b[1]);
  let s = '';
  for (const [x, y] of spots) s += `<path d="M0,${n(R * 0.3)} L${P(x, y)}" stroke="${kind === 'pink' ? '#c76b80' : '#c96a2c'}" stroke-width="${n(R * 0.05)}" stroke-linecap="round"/>`;
  spots.forEach(([x, y, sc], i) => {
    s += place(azaleaFlower(R * 0.42, kind, r() * 60 - 30, seed * 10 + i), x, y, 0, sc);
  });
  return s;
}

// ---------------------------------------------------------------- coral honeysuckle
export function honeysuckle(R: number, seed = 1): string {
  const r = rng(seed);
  let s =
    `<ellipse rx="${n(R * 0.62)}" ry="${n(R * 0.3)}" fill="url(#nv-leaf)" stroke="#2b4a22" stroke-width="${n(R * 0.012)}" transform="rotate(-6)"/>` +
    `<ellipse rx="${n(R * 0.5)}" ry="${n(R * 0.22)}" fill="#6c9a45" opacity=".45" transform="rotate(8) translate(${n(R * 0.04)} ${n(-R * 0.02)})"/>` +
    `<path d="M${P(-R * 0.55, 0)} L${P(R * 0.55, 0)}" stroke="#a9c57f" stroke-opacity=".5" stroke-width="${n(R * 0.012)}"/>`;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const a = -150 + (i / (count - 1)) * 120 + (r() - 0.5) * 10;
    const l = R * (0.95 + r() * 0.25);
    const tw = R * 0.07;
    const tube =
      `M${P(-tw, 0)} C${P(-tw, -l * 0.6)} ${P(-tw * 1.3, -l * 0.86)} ${P(-tw * 1.8, -l)} L${P(tw * 1.8, -l)}` +
      ` C${P(tw * 1.3, -l * 0.86)} ${P(tw, -l * 0.6)} ${P(tw, 0)}Z`;
    let mouth = '';
    for (let k = 0; k < 5; k++) mouth += `<circle cx="${n(-tw * 1.6 + (k * tw * 3.2) / 4)}" cy="${n(-l - tw * 0.15)}" r="${n(tw * 0.5)}" fill="#f6c44c"/>`;
    s += `<g transform="rotate(${n(a + 90)})"><path d="${tube}" fill="url(#nv-honey)" stroke="#8a2620" stroke-width="${n(R * 0.01)}"/>${mouth}` +
      `<path d="M${P(-tw * 0.4, -l)} L${P(-tw * 0.6, -l - tw * 1.6)} M${P(tw * 0.4, -l)} L${P(tw * 0.7, -l - tw * 1.5)}" stroke="#f2d06b" stroke-width="${n(tw * 0.28)}" stroke-linecap="round"/></g>`;
  }
  return s + `<circle r="${n(R * 0.08)}" fill="#7a2a22"/>`;
}

// ---------------------------------------------------------------- Carolina jessamine
function jessFace(rf: number, rot: number): string {
  let s = '';
  for (let k = 0; k < 5; k++) s += `<g transform="rotate(${n(rot + k * 72)})"><path d="${petalD(rf, rf * 0.52)}" fill="url(#nv-jess)" stroke="#d48a12" stroke-width="${n(rf * 0.025)}"/></g>`;
  let lines = '';
  for (let k = 0; k < 5; k++) {
    const a = ((rot + k * 72 - 90) * Math.PI) / 180;
    lines += `M0,0 L${P(Math.cos(a) * rf * 0.45, Math.sin(a) * rf * 0.45)} `;
  }
  return s + `<path d="${lines}" stroke="#d27a14" stroke-width="${n(rf * 0.04)}" stroke-linecap="round"/><circle r="${n(rf * 0.14)}" fill="#c9700f"/>`;
}
function jessTrumpet(rf: number): string {
  return (
    `<path d="M${P(-rf * 0.12, 0)} C${P(-rf * 0.14, -rf * 0.8)} ${P(-rf * 0.5, -rf * 1.2)} ${P(-rf * 0.62, -rf * 1.35)} Q${P(0, -rf * 1.55)} ${P(rf * 0.62, -rf * 1.35)} C${P(rf * 0.5, -rf * 1.2)} ${P(rf * 0.14, -rf * 0.8)} ${P(rf * 0.12, 0)}Z" fill="url(#nv-jess)" stroke="#d48a12" stroke-width="${n(rf * 0.03)}"/>` +
    `<path d="M${P(0, -rf * 0.3)} L${P(0, -rf * 1.3)}" stroke="#e8a21c" stroke-width="${n(rf * 0.05)}" opacity=".6"/>`
  );
}
/**
 * A trailing vine running along +x with leaves and yellow trumpets.
 * `size` sets the scale of leaves and flowers (default: the length), so short
 * pieces of one long vine can share its proportions.
 */
export function jessamine(L: number, seed = 1, size = L): string {
  const r = rng(seed);
  const pts: Pt[] = [];
  const segs = Math.max(3, Math.round(L / (size * 0.1)));
  for (let i = 0; i <= segs; i++) pts.push([(i / segs) * L, Math.sin(i * 1.3 + seed) * L * 0.03]);
  let s = `<path d="M${pts.map(([x, y]) => P(x, y)).join(' L')}" fill="none" stroke="#6b7a3a" stroke-width="${n(size * 0.008)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  pts.slice(1, -1).forEach(([x, y], i) => {
    const lf = size * (0.08 + r() * 0.03);
    s += place(`<path d="${leafD(lf, lf * 0.22)}" fill="url(#nv-leaf-dark)" stroke="#1e3a22" stroke-width="${n(lf * 0.02)}"/>`, x, y, -60 - r() * 25, 1);
    s += place(`<path d="${leafD(lf, lf * 0.22)}" fill="url(#nv-leaf-dark)" stroke="#1e3a22" stroke-width="${n(lf * 0.02)}"/>`, x, y, 120 + r() * 25, 1);
    if (i % 2 === 0) s += place(jessFace(size * 0.055, r() * 70), x + size * 0.015, y - size * 0.05, 0, 1);
    else s += place(jessTrumpet(size * 0.045), x, y, -20 + r() * 50, 1);
  });
  return s;
}

// ---------------------------------------------------------------- eastern redbud
export function redbud(L: number, seed = 1): string {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i <= 7; i++) pts.push([i * (L / 7), (i % 2 ? -1 : 1) * L * 0.025 - i * L * 0.012]);
  let s = `<path d="M${pts.map(([x, y]) => P(x, y)).join(' L')}" fill="none" stroke="#4a3328" stroke-width="${n(L * 0.014)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  pts.slice(1).forEach(([x, y]) => {
    const k = 3 + Math.floor(r() * 4);
    for (let j = 0; j < k; j++) {
      const a = r() * Math.PI * 2;
      const d = L * 0.03 * r();
      const cx = x + Math.cos(a) * d;
      const cy = y + Math.sin(a) * d;
      const rot = r() * 180;
      s += `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${n(rot)})"><ellipse rx="${n(L * 0.024)}" ry="${n(L * 0.016)}" fill="#c43a7c"/><ellipse cx="${n(L * 0.006)}" cy="${n(-L * 0.004)}" rx="${n(L * 0.013)}" ry="${n(L * 0.009)}" fill="#f190bd"/></g>`;
    }
  });
  return s;
}

// ---------------------------------------------------------------- ferns
/** Christmas fern: lance pinnae, each with the little "stocking" ear. Grows toward -y. */
export function christmasFern(L: number, curl = 0.3, seed = 1, tone = 'url(#nv-fern)'): string {
  const r = rng(seed);
  const c: [Pt, Pt, Pt, Pt] = [[0, 0], [L * 0.02, -L * 0.4], [L * curl * 0.5, -L * 0.78], [L * curl, -L]];
  const at = (t: number): Pt => {
    const u = 1 - t;
    return [
      u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0],
      u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1],
    ];
  };
  let s = `<path d="M${P(...at(0))} C${P(...c[1])} ${P(...c[2])} ${P(...c[3])}" fill="none" stroke="#3b4a26" stroke-width="${n(L * 0.014)}" stroke-linecap="round"/>`;
  let fronds = '';
  const count = 26;
  for (let i = 0; i < count; i++) {
    const t = 0.07 + 0.9 * (i / (count - 1));
    const [x, y] = at(t);
    const [x2, y2] = at(Math.min(1, t + 0.01));
    const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    const side = i % 2 ? 1 : -1;
    const len = L * 0.2 * Math.min(1, (t + 0.08) / 0.3) * Math.pow(1 - t, 0.55) * (0.9 + r() * 0.15);
    if (len < L * 0.02) continue;
    const w = len * 0.22;
    const pinna =
      `M0,0 C${P(len * 0.18, -w * 1.7)} ${P(len * 0.34, -w * 1.2)} ${P(len * 0.42, -w * 0.9)}` +
      ` C${P(len * 0.72, -w * 0.8)} ${P(len * 0.95, -w * 0.25)} ${P(len, 0)} C${P(len * 0.8, w * 0.55)} ${P(len * 0.3, w * 0.9)} 0,0Z`;
    const rot = ang + side * (62 - 30 * t);
    fronds += `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(1 ${side})"><path d="${pinna}"/><path d="M0,0 L${n(len * 0.92)},0" stroke="#1d3a20" stroke-width="${n(len * 0.03)}" fill="none"/></g>`;
  }
  return s + `<g fill="${tone}" stroke="#16301b" stroke-width="${n(L * 0.003)}">${fronds}</g>`;
}

/** Maidenhair fern: a dark wiry stipe opening into a fan of branches with tiny fan-shaped pinnules. */
export function maidenhair(R: number, seed = 1): string {
  const r = rng(seed);
  let s = `<path d="M0,0 Q${P(R * 0.05, -R * 0.4)} 0,${n(-R * 0.75)}" fill="none" stroke="#2a1d17" stroke-width="${n(R * 0.022)}" stroke-linecap="round"/>`;
  const branches = 6;
  for (let b = 0; b < branches; b++) {
    const a0 = ((-170 + (b / (branches - 1)) * 160) * Math.PI) / 180;
    const len = R * (0.55 + r() * 0.2);
    const ex = Math.cos(a0) * len;
    const ey = -R * 0.75 + Math.sin(a0) * len * 0.55;
    s += `<path d="M0,${n(-R * 0.75)} Q${P(ex * 0.45, -R * 0.75 - len * 0.18)} ${P(ex, ey)}" fill="none" stroke="#2a1d17" stroke-width="${n(R * 0.012)}"/>`;
    for (let k = 1; k <= 9; k++) {
      const t = k / 10;
      const px = ex * t;
      const py = -R * 0.75 + (ey + R * 0.75) * t - Math.sin(t * Math.PI) * len * 0.12;
      const sz = R * 0.07 * (1 - t * 0.45);
      s += `<path transform="translate(${n(px)} ${n(py)}) rotate(${n((a0 * 180) / Math.PI + (k % 2 ? 80 : 100))})" d="M0,0 L${n(sz * 1.6)},${n(-sz * 0.4)} A${n(sz * 1.2)},${n(sz)} 0 0 1 ${n(sz * 0.4)},${n(sz * 1.2)} Z" fill="${k % 3 ? '#8fb85a' : '#7aa64c'}" stroke="#4d7a32" stroke-width="${n(R * 0.004)}"/>`;
    }
  }
  return s;
}

/** Cinnamon fern: an upright fertile wand of rusty sporangia. */
export function cinnamonFern(L: number, seed = 1): string {
  const r = rng(seed);
  let s = `<path d="M0,0 Q${P(L * 0.05, -L * 0.5)} ${P(L * 0.02, -L)}" fill="none" stroke="#6b4a2a" stroke-width="${n(L * 0.018)}" stroke-linecap="round"/>`;
  for (let i = 0; i < 26; i++) {
    const t = 0.38 + (i / 25) * 0.6;
    const x = L * 0.05 * 2 * t * (1 - t) + L * 0.02 * t * t;
    const y = -L * t;
    const side = i % 2 ? 1 : -1;
    const w = L * 0.05 * (1 - (t - 0.38) * 0.9);
    s += `<ellipse cx="${n(x + side * w * 0.8)}" cy="${n(y)}" rx="${n(w)}" ry="${n(w * 0.5)}" fill="url(#nv-cinnamon)" transform="rotate(${n(side * (25 + r() * 15))} ${n(x + side * w * 0.8)} ${n(y)})"/>`;
  }
  return s;
}

// ---------------------------------------------------------------- Spanish moss
/**
 * Spanish moss hanging from its origin: soft crimped strands gathered into
 * tapering, gently bowed locks (the "beards"), plus loose strands between them.
 * Strands are written with relative curves and merged into a few paths to keep
 * the markup light.
 */
export function spanishMoss(L: number, strands = 14, seed = 1): string {
  const r = rng(seed);
  const tones = ['#dadfcd', '#c3c9b1', '#aab197', '#919981', '#7f876f'];
  const round = (v: number) => Math.round(v * 10) / 10;
  const groups = new Map<string, string>();
  const add = (d: string) => {
    const key = `${tones[Math.floor(r() * tones.length)]}|${r() < 0.55 ? 0.8 : 1.3}|${r() < 0.5 ? 0.72 : 0.95}`;
    groups.set(key, (groups.get(key) ?? '') + d);
  };
  // one crimped strand from (x0, y0), easing over to x1 as it falls `len`, bowing by `bow`
  const strand = (x0: number, y0: number, x1: number, len: number, bow: number) => {
    const base = L * 0.016;
    const amp = L * (0.004 + r() * 0.006);
    const pts: Pt[] = [[x0, y0]];
    let y = 0;
    let k = 0;
    while (y < len) {
      y = Math.min(len, y + base * (0.7 + r() * 0.6));
      k++;
      const t = y / len;
      const e = t * t * (3 - 2 * t);
      const w = (k % 2 ? 1 : -1) * amp * (0.3 + r() * 0.7);
      pts.push([x0 + (x1 - x0) * e + Math.sin(t * Math.PI) * bow + w, y0 + y]);
    }
    // quadratic curves through the midpoints, as relative commands
    let cx = round(pts[0][0]);
    let cy = round(pts[0][1]);
    let d = `M${n(cx)},${n(cy)}`;
    for (let q = 1; q < pts.length - 1; q++) {
      const [px, py] = pts[q];
      const mx = round((px + pts[q + 1][0]) / 2 - cx);
      const my = round((py + pts[q + 1][1]) / 2 - cy);
      d += `q${n(px - cx)},${n(py - cy)} ${n(mx)},${n(my)}`;
      cx = round(cx + mx);
      cy = round(cy + my);
    }
    const [lx, ly] = pts[pts.length - 1];
    return d + `l${n(lx - cx)},${n(ly - cy)}`;
  };

  const loose = Math.round(strands * 0.25);
  const locks = Math.max(2, Math.round((strands - loose) / 9));
  const per = Math.round((strands - loose) / locks);
  for (let l = 0; l < locks; l++) {
    const cx = (l / (locks - 1) - 0.5) * L * 0.42 + (r() - 0.5) * L * 0.06;
    const len = L * (0.38 + Math.pow(r(), 0.6) * 0.62);
    const tipX = cx + (r() - 0.5) * L * 0.12;
    const bow = (r() - 0.5) * L * 0.07;
    for (let i = 0; i < per; i++) {
      const x0 = cx + (r() - 0.5) * L * 0.12;
      const sl = len * (0.55 + r() * 0.45);
      const x1 = x0 + (tipX + (r() - 0.5) * L * 0.035 - x0) * (sl / len);
      add(strand(x0, 0, x1, sl, bow * (sl / len)));
      if (r() < 0.5) {
        // a tangled side curl partway down
        const y = sl * (0.2 + r() * 0.55);
        const bx = x0 + (x1 - x0) * (y / sl) + Math.sin((y / sl) * Math.PI) * bow;
        add(strand(bx, y, bx + (r() - 0.5) * L * 0.07, sl * (0.2 + r() * 0.3), 0));
      }
    }
  }
  for (let i = 0; i < loose; i++) {
    const x0 = (r() - 0.5) * L * 0.46;
    add(strand(x0, 0, x0 + (r() - 0.5) * L * 0.08, L * (0.25 + r() * 0.5), (r() - 0.5) * L * 0.04));
  }
  let s = '';
  for (const [key, d] of groups) {
    const [tone, width, opacity] = key.split('|');
    s += `<path d="${d}" fill="none" stroke="${tone}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`;
  }
  return s;
}

// ---------------------------------------------------------------- trillium (Sweet Betsy) & passionflower
export function trillium(R: number, seed = 1): string {
  const r = rng(seed);
  let s = `<path d="M0,${n(R * 0.9)} L0,0" stroke="#4b5a2c" stroke-width="${n(R * 0.05)}"/>`;
  for (let i = 0; i < 3; i++) {
    const a = i * 120 + 60 + (r() - 0.5) * 10;
    s += `<g transform="rotate(${n(a)})"><path d="${leafD(R * 0.95, R * 0.38)}" fill="url(#nv-leaf)" stroke="#294522" stroke-width="${n(R * 0.012)}"/>` +
      `<ellipse cx="${n(R * 0.08)}" cy="${n(-R * 0.45)}" rx="${n(R * 0.1)}" ry="${n(R * 0.16)}" fill="#3a5c2e" opacity=".55"/><ellipse cx="${n(-R * 0.1)}" cy="${n(-R * 0.7)}" rx="${n(R * 0.07)}" ry="${n(R * 0.1)}" fill="#3a5c2e" opacity=".5"/></g>`;
  }
  for (let i = 0; i < 3; i++) {
    s += `<g transform="rotate(${n(i * 120 + (r() - 0.5) * 8)})"><path d="${leafD(R * 0.55, R * 0.13)}" fill="url(#nv-maroon)" stroke="#3a0d18" stroke-width="${n(R * 0.01)}"/></g>`;
  }
  return s + `<circle r="${n(R * 0.06)}" fill="#c9b36a"/>`;
}

export function passionflower(R: number, seed = 1): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < 10; i++) s += `<g transform="rotate(${n(i * 36 + 18)})"><path d="${petalD(R, R * 0.2)}" fill="url(#nv-tepal)" stroke="#bfb0d6" stroke-width="${n(R * 0.01)}"/></g>`;
  let purple = '';
  let white = '';
  let lav = '';
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2 + r() * 0.03;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const wob = (k: number) => (k % 2 ? 1 : -1) * R * 0.02;
    purple += `M${P(c * R * 0.18, sn * R * 0.18)} L${P(c * R * 0.36, sn * R * 0.36)} `;
    white += `M${P(c * R * 0.36, sn * R * 0.36)} L${P(c * R * 0.5, sn * R * 0.5)} `;
    let d = `M${P(c * R * 0.5, sn * R * 0.5)}`;
    for (let k = 1; k <= 4; k++) {
      const rr = R * (0.5 + k * 0.11);
      d += ` L${P(c * rr - sn * wob(k + i), sn * rr + c * wob(k + i))}`;
    }
    lav += d + ' ';
  }
  s += `<path d="${lav}" fill="none" stroke="#8a64b4" stroke-width="${n(R * 0.014)}" stroke-linecap="round"/>`;
  s += `<path d="${white}" fill="none" stroke="#f6f1f9" stroke-width="${n(R * 0.016)}"/>`;
  s += `<path d="${purple}" fill="none" stroke="#4a1d6b" stroke-width="${n(R * 0.018)}"/>`;
  s += `<circle r="${n(R * 0.17)}" fill="#cfdfa0" stroke="#8aa45a" stroke-width="${n(R * 0.01)}"/>`;
  for (let i = 0; i < 5; i++) s += `<g transform="rotate(${n(i * 72)})"><ellipse cy="${n(-R * 0.13)}" rx="${n(R * 0.05)}" ry="${n(R * 0.09)}" fill="#c3d36a" stroke="#8aa45a" stroke-width="${n(R * 0.006)}"/></g>`;
  for (let i = 0; i < 3; i++) s += `<g transform="rotate(${n(i * 120 + 60)})"><path d="M0,0 Q${P(R * 0.04, -R * 0.1)} 0,${n(-R * 0.2)}" stroke="#5a2a6e" stroke-width="${n(R * 0.03)}" fill="none" stroke-linecap="round"/><circle cy="${n(-R * 0.21)}" r="${n(R * 0.03)}" fill="#5a2a6e"/></g>`;
  return s;
}

// ---------------------------------------------------------------- conservatory trellis wallpaper
/** A diamond trellis with tiny dogwood blossoms at the joints and leaf pairs on the laths. */
export function trellisTile(line = '#22432c', bloom = '#2a5135', leaf = '#244630'): string {
  const w = 96;
  const h = 128;
  const blossom = (x: number, y: number) => {
    let s = '';
    for (let i = 0; i < 4; i++) s += `<path transform="translate(${x} ${y}) rotate(${i * 90 + 45})" d="${bractD(9, 4.4)}"/>`;
    return `<g fill="${bloom}">${s}</g>`;
  };
  const leafPair = (x: number, y: number, rot: number) =>
    `<g fill="${leaf}" transform="translate(${x} ${y}) rotate(${rot})"><path d="${leafD(11, 3.2)}" transform="rotate(-40)"/><path d="${leafD(11, 3.2)}" transform="rotate(40)"/></g>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<path d="M0,0 L${w},${h} M${w},0 L0,${h}" stroke="${line}" stroke-width="2.2"/>` +
    leafPair(w * 0.25, h * 0.25, 141) + leafPair(w * 0.75, h * 0.75, 141) + leafPair(w * 0.75, h * 0.25, 39) + leafPair(w * 0.25, h * 0.75, 39) +
    blossom(w / 2, h / 2) + blossom(0, 0) + blossom(w, 0) + blossom(0, h) + blossom(w, h) +
    `</svg>`
  );
}

// ---------------------------------------------------------------- damask wallpaper
/**
 * A tone-on-tone wallpaper tile (magnolia leaves, a dogwood blossom and fern
 * sprigs) as a standalone SVG, for CSS `background-image`. Half-drop repeat.
 */
export function damaskTile(color = '#21412b', accent = '#26492f'): string {
  const motif = (x: number, y: number) => {
    const leaf = (rot: number, L: number) =>
      `<path transform="translate(${x} ${y}) rotate(${rot})" d="${leafD(L, L * 0.26)}"/>`;
    let flower = '';
    for (let i = 0; i < 4; i++) flower += `<path transform="translate(${x} ${y - 4}) rotate(${i * 90 + 45})" d="${bractD(15, 7)}"/>`;
    let fern = '';
    for (const side of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const yy = y + 26 + k * 7;
        fern += `<ellipse cx="${x + side * (8 - k)}" cy="${yy}" rx="${7 - k}" ry="2.2" transform="rotate(${side * -30} ${x + side * (8 - k)} ${yy})"/>`;
      }
    }
    return `<g fill="${color}">${leaf(-38, 46)}${leaf(38, 46)}${leaf(180, 30)}${fern}</g><g fill="${accent}">${flower}</g>`;
  };
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="180" viewBox="0 0 140 180">` +
    motif(70, 50) + motif(0, 140) + motif(140, 140) +
    `</svg>`
  );
}

// ---------------------------------------------------------------- eastern tiger swallowtail (Georgia's state butterfly)
export function swallowtail(S: number, id: string): string {
  const fw = `M${P(0, -0.12 * S)} C${P(0.25 * S, -0.55 * S)} ${P(0.75 * S, -0.72 * S)} ${P(0.96 * S, -0.56 * S)} C${P(0.92 * S, -0.3 * S)} ${P(0.55 * S, -0.03 * S)} ${P(0.04 * S, 0.02 * S)}Z`;
  const hw = `M${P(0.03 * S, 0.02 * S)} C${P(0.4 * S, 0)} ${P(0.62 * S, 0.2 * S)} ${P(0.55 * S, 0.42 * S)} L${P(0.5 * S, 0.7 * S)} L${P(0.42 * S, 0.47 * S)} C${P(0.28 * S, 0.5 * S)} ${P(0.08 * S, 0.36 * S)} ${P(0, 0.12 * S)}Z`;
  const stripes = [
    [0.18, -0.36, 0.26, -0.1],
    [0.38, -0.52, 0.44, -0.22],
    [0.58, -0.62, 0.62, -0.36],
    [0.78, -0.66, 0.8, -0.5],
  ]
    .map(([a, b, c, d]) => `M${P(a * S, b * S)} L${P(c * S, d * S)}`)
    .join(' ');
  const wing =
    `<defs><clipPath id="${id}-f"><path d="${fw}"/></clipPath><clipPath id="${id}-h"><path d="${hw}"/></clipPath></defs>` +
    `<path d="${hw}" fill="#f2c443"/><g clip-path="url(#${id}-h)"><path d="${hw}" fill="none" stroke="#1b1714" stroke-width="${n(S * 0.16)}"/>` +
    `<circle cx="${n(0.42 * S)}" cy="${n(0.4 * S)}" r="${n(S * 0.035)}" fill="#4a76c0"/><circle cx="${n(0.3 * S)}" cy="${n(0.36 * S)}" r="${n(S * 0.03)}" fill="#4a76c0"/><circle cx="${n(0.5 * S)}" cy="${n(0.3 * S)}" r="${n(S * 0.03)}" fill="#e8742f"/></g>` +
    `<path d="${fw}" fill="#f6cc4a"/><g clip-path="url(#${id}-f)"><path d="${stripes}" stroke="#1b1714" stroke-width="${n(S * 0.07)}" stroke-linecap="round"/><path d="${fw}" fill="none" stroke="#1b1714" stroke-width="${n(S * 0.13)}"/></g>`;
  return (
    wing +
    `<g transform="scale(-1 1)">${wing.replace(/<defs>.*?<\/defs>/, '')}</g>` +
    `<ellipse rx="${n(S * 0.045)}" ry="${n(S * 0.3)}" cy="${n(S * 0.08)}" fill="#1b1714"/><circle cy="${n(-S * 0.24)}" r="${n(S * 0.06)}" fill="#1b1714"/>` +
    `<path d="M${P(-S * 0.02, -S * 0.28)} Q${P(-S * 0.12, -S * 0.5)} ${P(-S * 0.2, -S * 0.56)} M${P(S * 0.02, -S * 0.28)} Q${P(S * 0.12, -S * 0.5)} ${P(S * 0.2, -S * 0.56)}" fill="none" stroke="#1b1714" stroke-width="${n(S * 0.018)}"/>`
  );
}
