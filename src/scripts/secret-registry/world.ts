// The conservatory by day, drawn like the rest of the site: ivory paper for the
// sky and the fog, a floor engraved in sage ink with a curved brick path,
// sage-painted glazing, a potting bench, an armillary sphere, and the site's
// own engraved plant drawings standing in the room like the flats of a little
// theatre.
import * as THREE from 'three';

export const LAYOUT = {
  /** the brick loop the ducks walk */
  loop: { cx: 0, cz: 0.45, rx: 1.15, rz: 0.78 },
  bench: { x: 0, z: -1.3, w: 1.9, d: 0.56, h: 0.62 },
  backZ: -3.1,
};

/** the site's paper and ink (src/styles/global.css) */
export const PAPER = '#efede6';
const IRON = new THREE.MeshStandardMaterial({ color: '#66786d', roughness: 0.6, metalness: 0.25 });
const BRONZE = new THREE.MeshStandardMaterial({ color: '#7f988a', roughness: 0.42, metalness: 0.6 });

// ------------------------------------------------------------------ canvas textures

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function shadowTexture() {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(40,52,45,0.42)');
  grad.addColorStop(1, 'rgba(40,52,45,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const SHADOW = typeof document !== 'undefined' ? shadowTexture() : null;

/** A soft contact shadow to sit under a robot. */
export function blobShadow(w: number, d: number) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.004;
  m.renderOrder = 1;
  return m;
}

/**
 * The floor, engraved: stippled gravel on paper, a curved loop of bricks drawn
 * in outline, a brick apron under the bench, and moss as short hatching.
 */
function floorTexture(size: { w: number; d: number; cz: number }) {
  const px = 180; // pixels per unit
  const [c, g] = canvas(Math.round(size.w * px), Math.round(size.d * px));
  const X = (x: number) => (x + size.w / 2) * px;
  const Z = (z: number) => (z - (size.cz - size.d / 2)) * px;
  const rnd = (() => {
    let s = 7;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();
  const ink = (a: number) => `rgba(97,116,106,${a.toFixed(3)})`;

  g.fillStyle = '#ebe8df';
  g.fillRect(0, 0, c.width, c.height);
  // gravel: fine stipple, a little denser in soft drifts
  for (let i = 0; i < 46000; i++) {
    const x = rnd() * c.width;
    const y = rnd() * c.height;
    const drift = 0.5 + 0.5 * Math.sin(x * 0.004 + Math.sin(y * 0.003) * 2) * Math.cos(y * 0.005);
    if (rnd() > 0.35 + drift * 0.5) continue;
    g.fillStyle = ink(0.16 + rnd() * 0.3);
    g.beginPath();
    g.arc(x, y, 0.8 + rnd() * 1.6, 0, Math.PI * 2);
    g.fill();
  }

  const loopPath = (grow: number) => {
    const { loop } = LAYOUT;
    g.beginPath();
    g.ellipse(X(loop.cx), Z(loop.cz), (loop.rx + grow) * px, (loop.rz + grow) * px, 0, 0, Math.PI * 2);
  };
  const brick = (x: number, z: number, angle: number, lw: number, ld: number) => {
    g.save();
    g.translate(X(x), Z(z));
    g.rotate(angle);
    const w = lw * px;
    const d = ld * px;
    const tint = 0.9 + rnd() * 0.1;
    g.fillStyle = `rgb(${Math.round(222 * tint + 20)},${Math.round(206 * tint + 18)},${Math.round(192 * tint + 16)})`;
    g.fillRect(-w / 2, -d / 2, w, d);
    // a few strokes of shading along one long edge, like an engraver's hatching
    g.strokeStyle = ink(0.4);
    g.lineWidth = 1.2;
    g.beginPath();
    for (let k = 0; k < 4; k++) {
      const t = -w / 2 + ((k + 0.5) * w) / 4;
      g.moveTo(t, d / 2 - 1);
      g.lineTo(t + d * 0.18, d / 2 - d * (0.22 + rnd() * 0.12));
    }
    g.stroke();
    g.strokeStyle = ink(0.85);
    g.lineWidth = 2;
    g.strokeRect(-w / 2, -d / 2, w, d);
    g.restore();
  };

  // apron of bricks under the bench, running bond
  const { bench } = LAYOUT;
  for (let row = 0, z = bench.z - bench.d / 2 - 0.26; z < bench.z + bench.d / 2 + 0.42; z += 0.1, row++) {
    for (let x = bench.x - bench.w / 2 - 0.3 + (row % 2) * 0.1; x < bench.x + bench.w / 2 + 0.3; x += 0.2) brick(x + 0.1, z + 0.05, 0, 0.19, 0.09);
  }

  // the loop: bricks laid across the path, following its curve
  const { loop } = LAYOUT;
  for (const off of [-0.2, -0.067, 0.067, 0.2]) {
    const rx = loop.rx + off;
    const rz = loop.rz + off;
    const per = Math.round((Math.PI * (3 * (rx + rz) - Math.sqrt((3 * rx + rz) * (rx + 3 * rz)))) / 0.105);
    const shift = (off * 37) % 1;
    for (let i = 0; i < per; i++) {
      const t = ((i + shift) / per) * Math.PI * 2;
      const x = loop.cx + rx * Math.cos(t);
      const z = loop.cz + rz * Math.sin(t);
      const ang = Math.atan2(rz * Math.cos(t), -rx * Math.sin(t));
      brick(x, z, ang, 0.1, 0.13);
    }
  }
  // the path's edging: a fine double rule
  g.strokeStyle = ink(0.9);
  g.lineWidth = 2;
  for (const grow of [0.27, 0.3, -0.27, -0.3]) {
    loopPath(grow);
    g.stroke();
  }
  // moss: tufts of short hatching along the edges and in the corners
  const tuft = (x: number, y: number, r: number) => {
    g.strokeStyle = ink(0.32 + rnd() * 0.25);
    g.lineWidth = 1.2;
    g.beginPath();
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 1.6;
      const sx = x + (rnd() - 0.5) * r;
      const sy = y + (rnd() - 0.5) * r * 0.5;
      g.moveTo(sx, sy);
      g.lineTo(sx + Math.cos(a) * r * 0.5, sy + Math.sin(a) * r * 0.5);
    }
    g.stroke();
  };
  for (let i = 0; i < 300; i++) {
    const t = rnd() * Math.PI * 2;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = loop.cx + (loop.rx + side * (0.33 + rnd() * 0.1)) * Math.cos(t);
    const z = loop.cz + (loop.rz + side * (0.33 + rnd() * 0.1)) * Math.sin(t);
    tuft(X(x), Z(z), 8 + rnd() * 10);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** The sky through the glass: ivory paper with the faintest sage at the top. */
function skyTexture() {
  const [c, g] = canvas(4, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#e2e7e1');
  grad.addColorStop(0.6, PAPER);
  grad.addColorStop(1, PAPER);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ------------------------------------------------------------------ plant flats

/**
 * Load one of the site's engraved drawings (an SVG file) as an image. On the
 * page its pen keeps a fixed width on screen; here the strokes scale with the
 * drawing instead (times `boost`), so the lines survive being shrunk in 3D.
 */
async function artImage(url: string, boost: number) {
  let svg = await (await fetch(url)).text();
  svg = svg.replace(/<style>[^<]*<\/style>/, '').replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${(Number(w) * boost).toFixed(2)}"`);
  const img = new Image();
  img.decoding = 'async';
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await img.decode();
  URL.revokeObjectURL(img.src);
  return img;
}

/** Rasterize a drawing into a texture; `pair` sets it beside its mirror image (a full bush from a corner piece). */
function artTexture(img: HTMLImageElement, width: number, pair = false) {
  const h = Math.round((width * img.naturalHeight) / img.naturalWidth);
  const [c, g] = canvas(pair ? width * 2 : width, h);
  if (pair) {
    g.save();
    g.translate(width, 0);
    g.scale(-1, 1);
    g.drawImage(img, 0, 0, width, h);
    g.restore();
    g.drawImage(img, width, 0, width, h);
  } else g.drawImage(img, 0, 0, width, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { tex: t, aspect: c.width / c.height };
}

/**
 * A plant drawing standing in the room. `anchor` says which point of the
 * drawing sits at `pos`: the bottom-centre of a bush, the top-left of a
 * hanging corner piece, etc. Drawn unlit, like paper, and faded by the fog.
 */
function flat(
  t: { tex: THREE.Texture; aspect: number },
  width: number,
  pos: THREE.Vector3,
  anchor: 'bottom-left' | 'bottom-center' | 'top-left',
  mirror = false,
) {
  const h = width / t.aspect;
  const geo = new THREE.PlaneGeometry(width, h);
  const ox = anchor === 'bottom-center' ? 0 : width / 2;
  const oy = anchor === 'top-left' ? -h / 2 : h / 2;
  // `pos` is always the drawing's anchor; a mirrored flat grows leftward from it
  geo.translate(ox, oy, 0);
  const mat = new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, toneMapped: false });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(pos);
  if (mirror) m.scale.x = -1;
  return m;
}

// ------------------------------------------------------------------ props

function terracottaPot(r: number, h: number) {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(r * 0.72, 0),
    new THREE.Vector2(r * 0.86, h * 0.78),
    new THREE.Vector2(r, h * 0.8),
    new THREE.Vector2(r, h),
    new THREE.Vector2(r * 0.9, h),
    new THREE.Vector2(r * 0.88, h * 0.86),
  ];
  const pot = new THREE.Group();
  pot.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 28), new THREE.MeshStandardMaterial({ color: '#c79c80', roughness: 0.9 })));
  const soil = new THREE.Mesh(new THREE.CircleGeometry(r * 0.86, 24), new THREE.MeshStandardMaterial({ color: '#7d6d5e', roughness: 1 }));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = h * 0.86;
  pot.add(soil);
  return pot;
}

function bench() {
  const { bench: b } = LAYOUT;
  const wood = new THREE.MeshStandardMaterial({ color: '#c2ad90', roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: '#a38c70', roughness: 0.9 });
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.05, b.d), wood);
  top.position.y = b.h - 0.025;
  g.add(top);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, b.h - 0.05, 0.05), dark);
      leg.position.set(sx * (b.w / 2 - 0.06), (b.h - 0.05) / 2, sz * (b.d / 2 - 0.05));
      g.add(leg);
    }
  }
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.12, 0.03, b.d - 0.1), dark);
  shelf.position.y = 0.16;
  g.add(shelf);
  // a few pots resting on the lower shelf
  for (const [x, s] of [[-0.55, 0.9], [-0.3, 0.75], [0.6, 1]] as const) {
    const p = terracottaPot(0.07 * s, 0.11 * s);
    p.position.set(x, 0.175, 0.05);
    g.add(p);
  }
  g.position.set(b.x, 0, b.z);
  const shadow = blobShadow(b.w + 0.5, b.d + 0.5);
  shadow.position.set(b.x, 0.003, b.z);
  return { group: g, shadow, potFactory: terracottaPot };
}

function backWall() {
  const g = new THREE.Group();
  const z = LAYOUT.backZ;
  const W = 11;
  const H = 3.4;
  // low stone plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W, 0.42, 0.25), new THREE.MeshStandardMaterial({ color: '#d4cbbb', roughness: 0.95 }));
  plinth.position.set(0, 0.21, z);
  g.add(plinth);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W, 0.05, 0.32), new THREE.MeshStandardMaterial({ color: '#e4ddd0', roughness: 0.9 }));
  cap.position.set(0, 0.44, z);
  g.add(cap);
  // glazing bars, painted sage: in the view they read like ruled lines
  const bay = 2.2;
  for (let x = -W / 2; x <= W / 2 + 1e-6; x += 0.55) {
    const major = Math.abs(((x + W / 2) / bay) % 1) < 1e-3 || Math.abs(((x + W / 2) / bay) % 1) > 1 - 1e-3;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(major ? 0.06 : 0.025, H, major ? 0.08 : 0.035), IRON);
    bar.position.set(x, 0.45 + H / 2, z);
    g.add(bar);
  }
  for (const y of [1.25, 2.15]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(W, 0.03, 0.045), IRON);
    t.position.set(0, y, z);
    g.add(t);
  }
  // arched heads over each bay, with a ring at each spring point
  for (let x = -W / 2 + bay / 2; x < W / 2; x += bay) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(bay / 2 - 0.04, 0.03, 8, 40, Math.PI), IRON);
    arc.position.set(x, 2.15, z);
    g.add(arc);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(bay / 2 - 0.32, 0.015, 6, 32, Math.PI), IRON);
    inner.position.set(x, 2.15, z);
    g.add(inner);
    const roundel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 6, 24), IRON);
    roundel.position.set(x, 2.15 + 0.55, z + 0.02);
    g.add(roundel);
  }
  // the glass itself, faintly catching the light
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H + 0.6),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, depthWrite: false }),
  );
  glass.position.set(0, 0.45 + (H + 0.6) / 2, z - 0.01);
  g.add(glass);
  // cast-iron columns
  for (const x of [-3.3, 3.3]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 3.8, 16), IRON);
    col.position.set(x, 1.9, z + 0.35);
    g.add(col);
    for (const y of [0.1, 3.0]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 20), IRON);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, y, z + 0.35);
      g.add(ring);
    }
  }
  return g;
}

/** A bronze armillary sphere, green with age, on a stone pedestal: the centrepiece of the loop. */
function armillary() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#d8d1c3', roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.08, 24), stone);
  base.position.y = 0.04;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.42, 20), stone);
  shaft.position.y = 0.29;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.06, 24), stone);
  cap.position.y = 0.53;
  g.add(base, shaft, cap);
  const sphere = new THREE.Group();
  sphere.position.y = 0.82;
  const ring = (r: number, rot: [number, number, number], tube = 0.011) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 56), BRONZE);
    m.rotation.set(...rot);
    sphere.add(m);
  };
  ring(0.24, [0, 0, 0], 0.014);
  ring(0.24, [Math.PI / 2, 0, 0], 0.014);
  ring(0.235, [Math.PI / 2, 0.42, 0]);
  ring(0.22, [0, Math.PI / 2, 0]);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.62, 8), BRONZE);
  axis.rotation.z = 0.42;
  sphere.add(axis);
  sphere.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), BRONZE));
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.08, 10), BRONZE);
  stand.position.y = -0.27;
  sphere.add(stand);
  g.add(sphere);
  return { group: g, sphere };
}

// ------------------------------------------------------------------ assembly

export interface World {
  scene: THREE.Scene;
  sphere: THREE.Group;
  potFactory: typeof terracottaPot;
  benchTop: number;
  billboards: THREE.Object3D[];
  /** every plant flat, with its own sway: they pivot where they grow or hang from */
  flats: { mesh: THREE.Object3D; amp: number; speed: number; phase: number }[];
}

export async function buildWorld(artUrl: (name: string) => string, onProgress: (f: number) => void): Promise<World> {
  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(PAPER, 8, 24);

  // soft daylight from the glass roof, a little warmer from the viewer's side
  scene.add(new THREE.HemisphereLight('#ffffff', '#d6cfc0', 1.7));
  const sun = new THREE.DirectionalLight('#fff6e8', 1.9);
  sun.position.set(-2.5, 6, 3.5);
  scene.add(sun);
  const back = new THREE.DirectionalLight('#eef3ee', 0.7);
  back.position.set(2.5, 4, -5);
  scene.add(back);

  // floor
  const floorSize = { w: 12, d: 9, cz: 0.6 };
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(floorSize.w, floorSize.d),
    new THREE.MeshStandardMaterial({ map: floorTexture(floorSize), roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, floorSize.cz);
  scene.add(floor);
  onProgress(0.15);

  scene.add(backWall());
  const b = bench();
  scene.add(b.group, b.shadow);

  const arm = armillary();
  arm.group.position.set(LAYOUT.loop.cx, 0, LAYOUT.loop.cz);
  scene.add(arm.group);

  // the plant flats: the site's own engraved drawings of native plants
  const billboards: THREE.Object3D[] = [];
  const flats: World['flats'] = [];
  const names = ['corner', 'corner-low', 'vine'] as const;
  const imgs: Partial<Record<(typeof names)[number], HTMLImageElement>> = {};
  let done = 0;
  await Promise.all(
    names.map(async (n) => {
      imgs[n] = await artImage(artUrl(n), n === 'vine' ? 2.2 : 1.9);
      onProgress(0.15 + (0.75 * ++done) / names.length);
    }),
  );
  const hanging = artTexture(imgs.corner!, 1400);
  const bush = artTexture(imgs['corner-low']!, 1100, true);
  const vine = artTexture(imgs.vine!, 520);
  const add = (m: THREE.Mesh, bill = false) => {
    scene.add(m);
    if (bill) billboards.push(m);
    // a gentle breeze: smaller plants sway a little more
    const size = (m.geometry as THREE.PlaneGeometry).parameters.width;
    flats.push({ mesh: m, amp: 0.006 + 0.02 / (1 + size), speed: 0.55 + Math.random() * 0.35, phase: Math.random() * Math.PI * 2 });
  };
  const at = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // the garden beyond the glass, pale with distance
  for (const [x, z, w] of [[-4.6, -5.4, 4.2], [-0.9, -6.2, 4.6], [2.9, -5.6, 4.4], [6, -6.4, 4.6]] as const) add(flat(bush, w, at(x, 0, z), 'bottom-center', x > 0));
  // beds along the back wall, either side of the bench, and in the near corners
  add(flat(bush, 3.2, at(-3.9, 0, -2.75), 'bottom-center'));
  add(flat(bush, 3.2, at(3.9, 0, -2.75), 'bottom-center', true));
  add(flat(bush, 1.9, at(-1.75, 0, -2.6), 'bottom-center', true));
  add(flat(bush, 1.9, at(1.75, 0, -2.6), 'bottom-center'));
  add(flat(bush, 2.7, at(-3.6, 0, 1.15), 'bottom-center'));
  add(flat(bush, 2.7, at(3.6, 0, 1.15), 'bottom-center', true));
  add(flat(bush, 1.7, at(-2.55, 0, 2.15), 'bottom-center', true));
  add(flat(bush, 1.7, at(2.55, 0, 2.15), 'bottom-center'));
  // a low ring of ferns and blossoms at the armillary sphere's foot
  add(flat(bush, 0.78, at(LAYOUT.loop.cx, 0, LAYOUT.loop.cz + 0.16), 'bottom-center'), true);
  // magnolia and dogwood hanging from the roof, jessamine up the columns
  add(flat(hanging, 3.3, at(-5.1, 4.05, -1.9), 'top-left'));
  add(flat(hanging, 3.3, at(5.1, 4.05, -1.9), 'top-left', true));
  add(flat(vine, 1.15, at(-3.3, 0.05, -2.62), 'bottom-center'));
  add(flat(vine, 1.15, at(3.3, 0.05, -2.62), 'bottom-center', true));
  // potted plants at the ends of the bench
  const benchTop = LAYOUT.bench.h;
  for (const [x, z, w] of [[LAYOUT.bench.x + 0.8, LAYOUT.bench.z + 0.04, 0.56], [LAYOUT.bench.x - 0.82, LAYOUT.bench.z - 0.08, 0.6]] as const) {
    const pot = terracottaPot(0.1, 0.17);
    pot.position.set(x, benchTop, z);
    scene.add(pot);
    add(flat(bush, w, at(x, benchTop + 0.14, z), 'bottom-center'), true);
  }
  onProgress(1);
  return { scene, sphere: arm.sphere, potFactory: terracottaPot, benchTop, billboards, flats };
}
