// The mushrooms and insects (lib/fungi.ts, lib/insects.ts) set into the
// plant art. The forest-floor drawings share the coordinate system of the
// bottom-corner cluster (cornerLow in lib/flora.ts) and are laid over it, so
// each page can have its own mix at the foot without redrawing the plants.
// Butterflies are drawn in two parts, wings and body, so the wings can open
// and close (Butterfly.astro).
//
// Each mushroom and insect has a simpler version for when its drawing is
// shown small (a phone), with fewer lines set further apart (`lod`).
import { place, rng, leaf, lod } from './engrave';
import { morel, chanterelle, mossyLog } from './fungi';
import { butterflyWings, butterflyBody, fritillaryClosedWings, fritillaryClosedBody, bumblebee, ladyBeetle, BUTTERFLY_REACH, type ButterflyKind } from './insects';
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

/** A fallen leaf lying in the litter, seen at a slant. */
const fallenLeaf = (x: number, rot: number, seed: number) =>
  place(leaf({ L: 40, W: 10, widest: 0.42, acuminate: 0.6, veins: 3, shade: 1, stalk: 4, seed }, PEN), x, H - 4, rot, 1);

/** A clump of morels at the edge of the cluster (one behind, two in front, a little one coming up), and a lady beetle on a dogwood leaf. */
export function floorMorels(): Arrangement {
  const p = PEN;
  const parts = [
    litter(300, 446, 701),
    place(lod(morel(80, p, 703, 0.02), morel(80, p, 703, 0.02, true)), 380, H - 6),
    fallenLeaf(336, 76, 706),
    place(lod(morel(56, p, 702, -0.06), morel(56, p, 702, -0.06, true)), 356, H + 1),
    place(lod(morel(42, p, 704, 0.07), morel(42, p, 704, 0.07, true)), 401, H + 1),
    place(lod(morel(24, p, 707, -0.03), morel(24, p, 707, -0.03, true)), 424, H + 1),
    // on the upper dogwood leaf, heading for its tip (too small to draw on a phone)
    place(lod(ladyBeetle(17, p, 705), ''), 80, H - 80, 30),
  ];
  return { ...LOW, markup: parts.join('') };
}

/** A fallen log with turkey tail and moss, and a bumblebee coming in to the maypop. */
export function floorLog(): Arrangement {
  const p = PEN;
  const parts = [
    place(lod(mossyLog(196, 40, p, 711), mossyLog(196, 40, p, 711, true)), 262, H),
    place(lod(bumblebee(30, p, 712), bumblebee(30, p, 712, true)), 300, H - 200, 28, 1, true),
  ];
  return { ...LOW, markup: parts.join('') };
}

/** A clump of chanterelles in the leaf litter, one behind the others. */
export function floorChanterelles(): Arrangement {
  const p = PEN;
  const parts = [
    litter(296, 446, 721),
    place(lod(chanterelle(62, p, 723, 0.03), chanterelle(62, p, 723, 0.03, true)), 374, H - 6),
    fallenLeaf(416, 78, 725),
    place(lod(chanterelle(48, p, 722, -0.03), chanterelle(48, p, 722, -0.03, true)), 346, H + 1),
    place(lod(chanterelle(38, p, 724, 0.035), chanterelle(38, p, 724, 0.035, true)), 402, H + 1),
  ];
  return { ...LOW, markup: parts.join('') };
}

// ------------------------------------------------------------------ butterflies

/** Forewing length of every butterfly drawing (they are scaled where they are placed). */
const F = 52;
const reach = F * BUTTERFLY_REACH;
const bfView: [number, number, number, number] = [-reach, -reach, reach * 2, reach * 2];


/** A butterfly drawing switches to its simpler version below this many screen pixels per unit (about 75px wide). */
const BF_DETAIL = 0.58;
const bf = (full: string, small: string): Arrangement => ({ w: reach * 2, h: reach * 2, view: bfView, markup: lod(full, small), detail: BF_DETAIL });

export const butterflyWingsArt = (kind: ButterflyKind) => bf(butterflyWings(kind, F, PEN, 31), butterflyWings(kind, F, PEN, 31, true));
export const butterflyBodyArt = (kind: ButterflyKind) => bf(butterflyBody(kind, F, PEN, 31), butterflyBody(kind, F, PEN, 31, true));
/** The gulf fritillary at rest, wings closed, seen from the side. */
export const fritillaryClosedWingsArt = () => bf(fritillaryClosedWings(F, PEN, 31), fritillaryClosedWings(F, PEN, 31, true));
export const fritillaryClosedBodyArt = () => bf(fritillaryClosedBody(F, PEN, 31), fritillaryClosedBody(F, PEN, 31, true));
