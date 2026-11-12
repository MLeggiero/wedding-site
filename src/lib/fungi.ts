// Engraved mushrooms native to the southeastern US, drawn like the plants
// (lib/engrave.ts): paper-filled outlines, fine lines, and hatching for the
// shadowed parts. Each grows from the ground at (0,0) toward -y.
import { Plate, spline, splinePts, hatch, ellipsePts, line, quad, add, lerp, rng, type Pt } from './engrave';

/** Linear lookup in a table of [t, value] pairs. */
function table(rows: [number, number][], t: number) {
  for (let i = 1; i < rows.length; i++) {
    if (t <= rows[i][0]) {
      const [t0, v0] = rows[i - 1];
      const [t1, v1] = rows[i];
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
  }
  return rows[rows.length - 1][1];
}

// ------------------------------------------------------------------ yellow morel

/**
 * A yellow morel (Morchella americana), up in Georgia woods in April: a
 * honeycombed cap on a short pale stem. `lean` tips the cap sideways.
 */
export function morel(H: number, pen: number, seed = 1, lean = 0): string {
  const r = rng(seed);
  const pl = new Plate(pen);
  // the stem: short, stout, a little swollen at the foot, with a granular skin
  const top = 0.32 * H;
  const s0 = 0.14 * H;
  const s1 = 0.11 * H;
  const stemPts: Pt[] = [[-s0, 0], [-s0 * 1.08, -top * 0.35], [-s1, -top * 1.08], [s1, -top * 1.08], [s0 * 1.05, -top * 0.4], [s0, 0], [0, H * 0.015]];
  pl.shape(spline(stemPts, true), 0.8);
  const stemPoly = splinePts(stemPts, true, 6);
  pl.lines(hatch([stemPoly, [[s1 * 0.2, 0], [H, 0], [H, -top], [s1 * 0.2, -top]]], { angle: 84, gap: H * 0.03, seed }), 0.3);
  let grain = '';
  for (let i = 0; i < 14; i++) {
    const p: Pt = [(r() - 0.6) * s0 * 1.4, -r() * top * 0.95];
    grain += line(p, add(p, [H * 0.008, -H * 0.012]));
  }
  pl.lines(grain, 0.3);
  // the cap: egg-shaped and pointed; its half-width up its height
  const y0 = -0.28 * H;
  const y1 = -H;
  const R = (v: number) => H * table([[0, 0.17], [0.12, 0.205], [0.35, 0.205], [0.58, 0.17], [0.78, 0.11], [0.92, 0.055], [1, 0]], v);
  const at = (th: number, v: number): Pt => [R(v) * Math.sin(th) + lean * H * v * v, y0 + (y1 - y0) * v];
  const right = Array.from({ length: 9 }, (_, i) => at(Math.PI / 2, i / 8));
  const left = Array.from({ length: 8 }, (_, i) => at(-Math.PI / 2, (7 - i) / 8));
  pl.shape(spline([...right, ...left, [0, y0 + H * 0.02]], true), 0.85);
  // ridges running up the cap, and short cross-ridges between them: the honeycomb
  const K = 6;
  const th = Array.from({ length: K + 1 }, (_, k) => -Math.PI / 2 + (k / K) * Math.PI + (k > 0 && k < K ? (r() - 0.5) * 0.18 : 0));
  const wob = (k: number, v: number) => Math.sin(v * 9 + k * 2.1 + seed) * 0.06;
  const rows = th.map(() => {
    const cuts = [0];
    let v = 0.06 + r() * 0.1;
    while (v < 0.9) {
      cuts.push(v);
      v += 0.13 + r() * 0.08;
    }
    cuts.push(1);
    return cuts;
  });
  let ridges = '';
  for (let k = 1; k < K; k++) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 10; i++) pts.push(at(th[k] + wob(k, i / 10), 0.02 + (i / 10) * 0.93));
    ridges += spline(pts);
  }
  let pits = '';
  for (let k = 0; k < K; k++) {
    const cuts = rows[k];
    for (let j = 0; j < cuts.length - 1; j++) {
      const va = cuts[j];
      const vb = Math.min(0.97, cuts[j + 1]);
      if (vb - va < 0.04) continue;
      // the cross-ridge at the top of this pit
      if (j < cuts.length - 2) {
        const a = at(th[k] + wob(k, vb), vb);
        const b = at(th[k + 1] + wob(k + 1, vb), vb);
        ridges += quad(a, add(lerp(a, b, 0.5), [0, H * 0.012]), b);
      }
      // the pit itself, set in from its ridges and hatched dark (more on the shaded side)
      const ta = th[k] + 0.09;
      const tb = th[k + 1] - 0.09;
      if (tb - ta < 0.12) continue;
      const poly: Pt[] = [];
      for (let i = 0; i <= 4; i++) poly.push(at(ta + wob(k, va + 0.02) + ((tb - ta) * i) / 4, va + 0.025));
      for (let i = 0; i <= 4; i++) poly.push(at(tb + wob(k + 1, va + ((vb - va) * i) / 4), va + 0.025 + ((vb - va - 0.05) * i) / 4));
      for (let i = 4; i >= 0; i--) poly.push(at(ta + ((tb - ta) * i) / 4 + wob(k, vb - 0.02), vb - 0.025));
      for (let i = 4; i >= 0; i--) poly.push(at(ta + wob(k, va + ((vb - va) * i) / 4), va + 0.025 + ((vb - va - 0.05) * i) / 4));
      const shade = (th[k] + th[k + 1]) / 2;
      pits += hatch([poly], { angle: 62, gap: H * (shade > 0.3 ? 0.018 : 0.026), seed: seed * 7 + k * 13 + j });
    }
  }
  pl.lines(pits, 0.3).lines(ridges, 0.5);
  return pl.toString();
}

// ------------------------------------------------------------------ chanterelle

/**
 * A chanterelle: a stout stem flaring gradually into a shallow, wavy-edged
 * funnel, with forked ridges (not true gills) running down into the stem.
 * `tilt` cants the cap.
 */
export function chanterelle(H: number, pen: number, seed = 1, tilt = 0): string {
  const r = rng(seed);
  const pl = new Plate(pen);
  const cy = -0.8 * H;
  const rx = 0.46 * H;
  const ry = 0.1 * H;
  const wave = (a: number) => 1 + 0.07 * Math.sin(a * 3 + seed) + 0.035 * Math.sin(a * 7 + seed * 2);
  const rim = (a: number): Pt => [Math.cos(a) * rx * wave(a), cy + Math.sin(a) * ry * wave(a) + Math.cos(a) * tilt * H];
  // silhouette: the stem flaring up into the funnel, then round the back of the rim
  const back: Pt[] = [];
  for (let i = 0; i <= 12; i++) back.push(rim(Math.PI + (i / 12) * Math.PI));
  const sw = 0.1 * H;
  const silhouette: Pt[] = [
    [-sw * 0.95, 0], [-sw, -0.18 * H], [-sw * 1.15, -0.36 * H], [-0.2 * H, -0.56 * H + tilt * H * 0.3], [-0.34 * H, -0.7 * H + tilt * H * 0.6],
    ...back,
    [0.34 * H, -0.7 * H - tilt * H * 0.6], [0.2 * H, -0.56 * H - tilt * H * 0.3], [sw * 1.15, -0.36 * H], [sw, -0.18 * H], [sw * 0.95, 0], [0, 0.015 * H],
  ];
  pl.shape(spline(silhouette, true), 0.85);
  // the near edge of the cap, rolled under, drawn as a lip with a second line inside it
  const lip: Pt[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI;
    lip.push(add(rim(a), [0, Math.sin(a) * H * 0.02]));
  }
  pl.lines(spline(lip), 0.75);
  pl.lines(spline(lip.slice(2, 13).map((p) => add(p, [0, H * 0.03])), false), 0.32);
  // inside the funnel: a shallow hollow
  const hollow: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * 1.15 + (i / 8) * Math.PI * 0.7;
    hollow.push([Math.cos(a) * rx * 0.4, cy + ry * 0.25 + Math.sin(a) * ry * 0.4]);
  }
  pl.lines(spline(hollow), 0.34);
  // forked ridges from the lip down into the stem
  let ridges = '';
  const foot: Pt = [0, -0.34 * H];
  for (let i = 1; i < 12; i++) {
    const a = (i / 12) * Math.PI;
    const p = add(lip[Math.round((i / 12) * 14)], [0, H * 0.03]);
    const end = add(foot, [Math.cos(a) * sw * 0.8, 0]);
    const mid = lerp(p, end, 0.4);
    ridges += quad(p, add(mid, [Math.cos(a) * H * 0.05, -H * 0.03]), end);
    if (i % 2) {
      const q = add(lerp(lip[Math.round((i / 12) * 14)], lip[Math.min(14, Math.round((i / 12) * 14) + 1)], 0.5), [0, H * 0.03]);
      ridges += quad(q, lerp(q, mid, 0.6), lerp(p, mid, 0.7));
    }
  }
  pl.lines(ridges, 0.34);
  // shade the far side of the underside and the stem
  const under: Pt[] = [...lip, [sw * 1.1, -0.36 * H], [-sw * 1.1, -0.36 * H]];
  pl.lines(hatch([under, [[0.06 * H, -H], [H, -H], [H, 0], [0.06 * H, 0]]], { angle: 70, gap: H * 0.028, seed }), 0.3);
  pl.lines(hatch([splinePts(silhouette, true, 6), [[sw * 0.2, -0.4 * H], [H, -0.4 * H], [H, 0], [sw * 0.2, 0]]], { angle: 84, gap: H * 0.03, seed: seed + 1 }), 0.3);
  void r;
  return pl.toString();
}

// ------------------------------------------------------------------ turkey tail on a fallen log

/** One turkey-tail bracket: a fan with banded zones and a wavy edge, from (0,0) toward -y. */
function turkeyTail(Rf: number, pen: number, seed: number, spread = 150): string {
  const r = rng(seed);
  const pl = new Plate(pen);
  const a0 = -90 - spread / 2;
  const edge = (k: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = ((a0 + (i / 12) * spread) * Math.PI) / 180;
      const wav = 1 + (k > 0.95 ? 0.05 * Math.sin(i * 1.9 + seed) : 0.02 * Math.sin(i * 1.3 + seed + k * 4));
      pts.push([Math.cos(a) * Rf * k * wav, Math.sin(a) * Rf * k * wav * 0.82]);
    }
    return pts;
  };
  const rim = edge(1);
  pl.shape(spline([[0, Rf * 0.05], ...rim], true), 0.75);
  // concentric zones; every other band is dark
  const ks = [0.86, 0.72, 0.6, 0.47, 0.34];
  let zones = '';
  for (const k of ks) zones += spline(edge(k));
  pl.lines(zones, 0.32);
  let dark = '';
  for (let i = 0; i < ks.length - 1; i += 2) {
    const outer = edge(ks[i]);
    const inner = edge(ks[i + 1]).reverse();
    dark += hatch([[...outer, ...inner]], { angle: 80 + r() * 20, gap: Rf * 0.07, seed: seed + i });
  }
  pl.lines(dark, 0.3);
  return pl.toString();
}

/**
 * A fallen log lying along +x from (0,0) (its underside on the ground), with
 * moss along the top, turkey tail growing in tiers from its side and a cut
 * end showing its rings.
 */
export function mossyLog(L: number, D: number, pen: number, seed = 1): string {
  const r = rng(seed);
  const pl = new Plate(pen);
  const top = -D;
  const endX = L;
  // the bark: a long cylinder with a rough broken end at the left
  const body: Pt[] = [
    [endX, 0], [L * 0.75, D * 0.02], [L * 0.45, 0], [L * 0.15, D * 0.02], [0, -D * 0.04],
    [-D * 0.08, -D * 0.25], [D * 0.06, -D * 0.4], [-D * 0.05, -D * 0.6], [D * 0.04, -D * 0.8], [D * 0.02, top + D * 0.02],
    [L * 0.2, top - D * 0.02], [L * 0.5, top], [L * 0.8, top - D * 0.02], [endX, top],
  ];
  pl.shape(spline(body, true), 0.85);
  // bark furrows along the length, and shade along the underside
  let furrows = '';
  for (let i = 0; i < 6; i++) {
    const y = top + D * (0.18 + i * 0.13);
    const x0 = D * 0.15 + r() * L * 0.2;
    const x1 = L - D * 0.3 - r() * L * 0.1;
    const pts: Pt[] = [];
    for (let k = 0; k <= 6; k++) pts.push([x0 + ((x1 - x0) * k) / 6, y + Math.sin(k * 1.7 + i) * D * 0.03]);
    furrows += spline(pts);
  }
  pl.lines(furrows, 0.36);
  pl.lines(hatch([splinePts(body, true, 6), [[0, -D * 0.38], [L, -D * 0.38], [L, D], [0, D]]], { angle: 10, gap: D * 0.07, seed }), 0.28);
  // the cut end: an ellipse with growth rings and a crack
  const endC: Pt = [endX, -D / 2];
  pl.shape(spline(ellipsePts(endC, D * 0.2, D * 0.5, 0, 16), true), 0.8);
  let rings = '';
  for (const k of [0.78, 0.56, 0.36, 0.17]) rings += spline(ellipsePts(add(endC, [D * 0.01, D * 0.02 * (1 - k)]), D * 0.2 * k, D * 0.5 * k, 0, 14), true);
  pl.lines(rings + line(add(endC, [0, -D * 0.05]), add(endC, [D * 0.12, -D * 0.4])), 0.32);
  // moss along the top: little upright tufts
  let moss = '';
  for (let i = 0; i < 26; i++) {
    const x = D * 0.1 + (i / 26) * (L - D * 0.3) + r() * D * 0.1;
    const y = top + D * 0.03;
    for (let k = 0; k < 3; k++) {
      const a = -90 + (k - 1) * 22 + (r() - 0.5) * 16;
      const len = D * (0.06 + r() * 0.07);
      moss += line([x + k * D * 0.02, y], add([x + k * D * 0.02, y], [Math.cos((a * Math.PI) / 180) * len, Math.sin((a * Math.PI) / 180) * len]));
    }
  }
  pl.lines(moss, 0.3);
  // turkey tail in overlapping tiers on the side of the log, toward the cut end
  const brackets: [number, number, number, number][] = [
    [0.58, 0.62, 0.42, -6], [0.68, 0.5, 0.5, 4], [0.77, 0.66, 0.46, -2], [0.64, 0.8, 0.38, 8], [0.74, 0.86, 0.4, -10], [0.83, 0.42, 0.36, 12],
  ];
  for (const [fx, fy, size, rot] of brackets) {
    pl.add(`<g transform="translate(${(fx * L).toFixed(1)} ${(-fy * D).toFixed(1)}) rotate(${rot})">${turkeyTail(D * size * 1.25, pen, seed + Math.round(fx * 100), 140 + r() * 30)}</g>`);
  }
  return pl.toString();
}
