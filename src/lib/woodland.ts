// The mushrooms and insects (lib/fungi.ts, lib/insects.ts) set into the
// plant art. The forest-floor drawings share the coordinate system of the
// bottom-corner cluster (cornerLow in lib/flora.ts) and are laid over it, so
// each page can have its own mix at the foot without redrawing the plants.
// Butterflies are drawn in two parts, wings and body, so the wings can open
// and close (Butterfly.astro).
import { place, rng } from './engrave';
import { morel, chanterelle, mossyLog } from './fungi';
import { butterflyWings, butterflyBody, bumblebee, ladyBeetle, BUTTERFLY_REACH, type ButterflyKind } from './insects';
import { PEN, type Arrangement } from './flora';

/** The bottom-corner cluster's box and view (see cornerLow): the floor drawings must match it. */
const LOW = { w: 420, h: 460, view: [0, -40, 470, 500] as [number, number, number, number] };
const H = LOW.h;

/** A few blades of grass and a fallen leaf or two, so the mushrooms stand in something. */
function litter(x0: number, x1: number, seed: number) {
  const r = rng(seed);
  let s = '';
  for (let x = x0; x < x1; x += 14 + r() * 16) {
    const n = 2 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const a = -90 + (k - (n - 1) / 2) * 18 + (r() - 0.5) * 14;
      const len = 10 + r() * 12;
      const rad = (a * Math.PI) / 180;
      s += `<path d="M${x.toFixed(1)},${H}q${(Math.cos(rad) * len * 0.4).toFixed(1)},${(Math.sin(rad) * len * 0.6).toFixed(1)} ${(Math.cos(rad) * len).toFixed(1)},${(Math.sin(rad) * len).toFixed(1)}" fill="none" stroke-width="${(PEN * 0.4).toFixed(2)}"/>`;
    }
  }
  return s;
}

/** Morels coming up at the edge of the cluster, and a lady beetle on a dogwood leaf. */
export function floorMorels(): Arrangement {
  const p = PEN;
  const parts = [
    litter(300, 440, 701),
    place(morel(58, p, 702, -0.05), 352, H),
    place(morel(78, p, 703, 0.03), 384, H + 2),
    place(morel(42, p, 704, 0.06), 414, H + 1),
    // on the upper dogwood leaf, heading for its tip
    place(ladyBeetle(17, p, 705), 82, H - 84, 30),
  ];
  return { ...LOW, markup: parts.join('') };
}

/** A fallen log with turkey tail and moss, and a bumblebee coming in to the maypop. */
export function floorLog(): Arrangement {
  const p = PEN;
  const parts = [
    place(mossyLog(196, 40, p, 711), 262, H),
    place(bumblebee(30, p, 712), 300, H - 200, 28, 1, true),
  ];
  return { ...LOW, markup: parts.join('') };
}

/** Chanterelles in the leaf litter. */
export function floorChanterelles(): Arrangement {
  const p = PEN;
  const parts = [
    litter(296, 446, 721),
    place(chanterelle(50, p, 722, -0.02), 336, H + 1),
    place(chanterelle(66, p, 723, 0.03), 380, H + 2),
    place(chanterelle(40, p, 724, 0.02), 420, H + 1),
  ];
  return { ...LOW, markup: parts.join('') };
}

// ------------------------------------------------------------------ butterflies

/** Forewing length of every butterfly drawing (they are scaled where they are placed). */
const F = 52;
const reach = F * BUTTERFLY_REACH;
const bfView: [number, number, number, number] = [-reach, -reach, reach * 2, reach * 2];


export function butterflyWingsArt(kind: ButterflyKind): Arrangement {
  return { w: reach * 2, h: reach * 2, view: bfView, markup: butterflyWings(kind, F, PEN, 31) };
}
export function butterflyBodyArt(kind: ButterflyKind): Arrangement {
  return { w: reach * 2, h: reach * 2, view: bfView, markup: butterflyBody(kind, F, PEN, 31) };
}
