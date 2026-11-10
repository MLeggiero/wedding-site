// The night conservatory: floor with a curved brick path, a glazed iron back
// wall with the moon behind it, lanterns and string lights, fireflies, a
// potting bench, and the site's own native-plant drawings standing in the room
// like the flats of a little theatre.
import * as THREE from 'three';

export const LAYOUT = {
  /** the brick loop the ducks walk */
  loop: { cx: 0, cz: 0.45, rx: 1.15, rz: 0.78 },
  bench: { x: 0, z: -1.3, w: 1.9, d: 0.56, h: 0.62 },
  backZ: -3.1,
};

const IRON = new THREE.MeshStandardMaterial({ color: '#1f2d25', roughness: 0.55, metalness: 0.55 });
const BRASS = new THREE.MeshStandardMaterial({ color: '#caa152', roughness: 0.35, metalness: 0.85 });

// ------------------------------------------------------------------ canvas textures

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

export function glowTexture(inner = 'rgba(255,240,200,1)', mid = 'rgba(255,190,90,0.35)') {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.25, mid);
  grad.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shadowTexture() {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
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

/** Floor: dark soil and moss with a curved herringbone-ish brick loop and a brick apron under the bench. */
function floorTexture(size: { w: number; d: number; cz: number }) {
  const px = 180; // pixels per unit
  const [c, g] = canvas(Math.round(size.w * px), Math.round(size.d * px));
  const X = (x: number) => (x + size.w / 2) * px;
  const Z = (z: number) => (z - (size.cz - size.d / 2)) * px;
  const rnd = (() => {
    let s = 7;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();

  // soil carpeted with moss
  g.fillStyle = '#222a1a';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 260; i++) {
    // broad, soft patches of moss and shade
    const x = rnd() * c.width;
    const y = rnd() * c.height;
    const r = 60 + rnd() * 160;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const moss = rnd() < 0.6;
    grad.addColorStop(0, moss ? `rgba(${60 + rnd() * 24},${88 + rnd() * 30},${40 + rnd() * 12},0.32)` : 'rgba(10,12,8,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 9000; i++) {
    // fine speckle: moss tufts, grit and fallen leaves
    const x = rnd() * c.width;
    const y = rnd() * c.height;
    const r = 1 + rnd() * 5;
    g.fillStyle = rnd() < 0.7 ? `rgba(${64 + rnd() * 40},${92 + rnd() * 50},${40 + rnd() * 20},${0.18 + rnd() * 0.25})` : `rgba(14,16,10,${0.2 + rnd() * 0.25})`;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }

  const brick = (x: number, z: number, angle: number, lw: number, ld: number) => {
    const shade = 0.82 + rnd() * 0.3;
    const r = Math.round(150 * shade);
    const gg = Math.round(76 * shade);
    const b = Math.round(52 * shade);
    g.save();
    g.translate(X(x), Z(z));
    g.rotate(angle);
    g.fillStyle = `rgb(${r},${gg},${b})`;
    g.fillRect((-lw / 2) * px, (-ld / 2) * px, lw * px, ld * px);
    g.fillStyle = 'rgba(255,220,180,0.06)';
    g.fillRect((-lw / 2) * px, (-ld / 2) * px, lw * px, ld * px * 0.35);
    g.restore();
  };

  // apron of bricks under the bench, running bond
  const { bench } = LAYOUT;
  g.fillStyle = '#3a2c22';
  g.fillRect(X(bench.x - bench.w / 2 - 0.35), Z(bench.z - bench.d / 2 - 0.3), (bench.w + 0.7) * px, (bench.d + 0.75) * px);
  for (let row = 0, z = bench.z - bench.d / 2 - 0.26; z < bench.z + bench.d / 2 + 0.42; z += 0.1, row++) {
    for (let x = bench.x - bench.w / 2 - 0.3 + (row % 2) * 0.1; x < bench.x + bench.w / 2 + 0.3; x += 0.2) brick(x + 0.1, z + 0.05, 0, 0.185, 0.085);
  }

  // the loop: bricks laid across the path, following its curve
  const { loop } = LAYOUT;
  g.fillStyle = '#3a2c22';
  g.beginPath();
  g.ellipse(X(loop.cx), Z(loop.cz), (loop.rx + 0.3) * px, (loop.rz + 0.3) * px, 0, 0, Math.PI * 2);
  g.ellipse(X(loop.cx), Z(loop.cz), (loop.rx - 0.3) * px, (loop.rz - 0.3) * px, 0, 0, Math.PI * 2);
  g.fill('evenodd');
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
      brick(x, z, ang, 0.095, 0.125);
    }
  }
  // soft moss creeping over the path edges
  for (let i = 0; i < 900; i++) {
    const t = rnd() * Math.PI * 2;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = loop.cx + (loop.rx + side * (0.27 + rnd() * 0.06)) * Math.cos(t);
    const z = loop.cz + (loop.rz + side * (0.27 + rnd() * 0.06)) * Math.sin(t);
    g.fillStyle = `rgba(${50 + rnd() * 30},${78 + rnd() * 40},${36 + rnd() * 20},${0.35 + rnd() * 0.35})`;
    g.beginPath();
    g.arc(X(x), Z(z), 2 + rnd() * 7, 0, Math.PI * 2);
    g.fill();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function skyTexture() {
  const [c, g] = canvas(4, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#0d2233');
  grad.addColorStop(0.55, '#123028');
  grad.addColorStop(1, '#0a1510');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ------------------------------------------------------------------ plant flats

/** Rasterize one of the site's plant drawings (an SVG file) into a texture. */
async function artTexture(url: string, width: number) {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  const h = Math.round((width * img.naturalHeight) / img.naturalWidth);
  const [c, g] = canvas(width, h);
  g.drawImage(img, 0, 0, width, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { tex: t, aspect: img.naturalWidth / img.naturalHeight };
}

export interface Flat {
  mesh: THREE.Mesh;
}

/**
 * A plant drawing standing in the room. `anchor` says which corner of the
 * drawing sits at `pos`: the bottom-left of a bed, the top-left of a swag, etc.
 */
function flat(
  tex: THREE.Texture,
  aspect: number,
  width: number,
  pos: THREE.Vector3,
  anchor: 'bottom-left' | 'bottom-center' | 'top-left',
  mirror = false,
) {
  const h = width / aspect;
  const geo = new THREE.PlaneGeometry(width, h);
  const ox = anchor === 'bottom-center' ? 0 : width / 2;
  const oy = anchor === 'top-left' ? -h / 2 : h / 2;
  // `pos` is always the drawing's corner; a mirrored flat grows leftward from it
  geo.translate(ox, oy, 0);
  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(pos);
  if (mirror) m.scale.x = -1;
  return m;
}

// ------------------------------------------------------------------ fireflies

function fireflies(count: number, glow: THREE.Texture) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 7;
    pos[i * 3 + 1] = 0.25 + Math.random() * 2.3;
    pos[i * 3 + 2] = -2.6 + Math.random() * 4.6;
    seed[i] = Math.random() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, map: { value: glow }, scale: { value: 1 } },
    vertexShader: `
      attribute float seed;
      uniform float time;
      uniform float scale;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x += sin(time * 0.31 + seed) * 0.35 + sin(time * 0.17 + seed * 2.1) * 0.25;
        p.y += sin(time * 0.43 + seed * 1.7) * 0.18;
        p.z += cos(time * 0.27 + seed * 0.9) * 0.3;
        vAlpha = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(time * (0.9 + fract(seed) * 1.4) + seed * 3.0), 3.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = scale * 62.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D map;
      varying float vAlpha;
      void main() {
        vec4 c = texture2D(map, gl_PointCoord);
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.5) * c.rgb, c.a * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

// ------------------------------------------------------------------ props

function lantern(glow: THREE.Texture) {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.08, 4), BRASS);
  cap.position.y = 0.13;
  cap.rotation.y = Math.PI / 4;
  g.add(cap);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.13), BRASS);
  base.position.y = -0.09;
  g.add(base);
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.19, 6), BRASS);
    post.position.set(x * 0.058, 0.005, z * 0.058);
    g.add(post);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 16), BRASS);
  ring.position.y = 0.19;
  g.add(ring);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 3, 4), IRON);
  chain.position.y = 1.7;
  g.add(chain);
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#ffd889' }),
  );
  flame.scale.y = 1.4;
  g.add(flame);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
  halo.scale.setScalar(0.95);
  g.add(halo);
  const light = new THREE.PointLight('#ffb15a', 2.6, 5.5, 1.6);
  g.add(light);
  return { group: g, light, halo };
}

function stringLights(from: THREE.Vector3, to: THREE.Vector3, sag: number, glow: THREE.Texture) {
  const g = new THREE.Group();
  const n = 26;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = from.clone().lerp(to, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.005, 4), IRON);
  g.add(wire);
  const bulb = new THREE.SphereGeometry(0.022, 10, 8);
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffe3a6' });
  const haloMat = new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 });
  for (let i = 1; i < n; i += 1) {
    const b = new THREE.Mesh(bulb, bulbMat);
    b.position.copy(pts[i]).y -= 0.03;
    g.add(b);
    const h = new THREE.Sprite(haloMat);
    h.position.copy(b.position);
    h.scale.setScalar(0.3);
    g.add(h);
  }
  return g;
}

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
  pot.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 28), new THREE.MeshStandardMaterial({ color: '#b5603b', roughness: 0.85 })));
  const soil = new THREE.Mesh(new THREE.CircleGeometry(r * 0.86, 24), new THREE.MeshStandardMaterial({ color: '#2b1d14', roughness: 1 }));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = h * 0.86;
  pot.add(soil);
  return pot;
}

function bench() {
  const { bench: b } = LAYOUT;
  const wood = new THREE.MeshStandardMaterial({ color: '#6b4428', roughness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: '#4a2f1c', roughness: 0.85 });
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
  // low brick plinth
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(W, 0.42, 0.25),
    new THREE.MeshStandardMaterial({ color: '#4b2d22', roughness: 0.9 }),
  );
  plinth.position.set(0, 0.21, z);
  g.add(plinth);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W, 0.05, 0.32), new THREE.MeshStandardMaterial({ color: '#8b7a62', roughness: 0.8 }));
  cap.position.set(0, 0.44, z);
  g.add(cap);
  // glazing bars
  const bay = 2.2;
  for (let x = -W / 2; x <= W / 2 + 1e-6; x += 0.55) {
    const major = Math.abs(((x + W / 2) / bay) % 1) < 1e-3 || Math.abs(((x + W / 2) / bay) % 1) > 1 - 1e-3;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(major ? 0.07 : 0.03, H, major ? 0.09 : 0.04), IRON);
    bar.position.set(x, 0.45 + H / 2, z);
    g.add(bar);
  }
  for (const y of [1.25, 2.15]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(W, 0.035, 0.05), IRON);
    t.position.set(0, y, z);
    g.add(t);
  }
  // arched heads over each bay, with a ring at each spring point
  for (let x = -W / 2 + bay / 2; x < W / 2; x += bay) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(bay / 2 - 0.04, 0.035, 8, 40, Math.PI), IRON);
    arc.position.set(x, 2.15, z);
    g.add(arc);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(bay / 2 - 0.32, 0.018, 6, 32, Math.PI), IRON);
    inner.position.set(x, 2.15, z);
    g.add(inner);
    const roundel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 24), BRASS);
    roundel.position.set(x, 2.15 + 0.55, z + 0.02);
    g.add(roundel);
  }
  // the glass itself, faintly catching the light
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H + 0.6),
    new THREE.MeshBasicMaterial({ color: '#9fc0b4', transparent: true, opacity: 0.06, depthWrite: false }),
  );
  glass.position.set(0, 0.45 + (H + 0.6) / 2, z - 0.01);
  g.add(glass);
  // cast-iron columns
  for (const x of [-3.3, 3.3]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.8, 16), IRON);
    col.position.set(x, 1.9, z + 0.35);
    g.add(col);
    for (const y of [0.1, 3.0]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 20), BRASS);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, y, z + 0.35);
      g.add(ring);
    }
  }
  return g;
}

function sky(glow: THREE.Texture) {
  const g = new THREE.Group();
  const moonTex = (() => {
    const [c, x] = canvas(256, 256);
    const grad = x.createRadialGradient(118, 116, 10, 128, 128, 120);
    grad.addColorStop(0, '#fffbe9');
    grad.addColorStop(0.7, '#efe6c8');
    grad.addColorStop(1, '#d9cfae');
    x.fillStyle = grad;
    x.beginPath();
    x.arc(128, 128, 120, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = 'rgba(160,150,120,0.18)';
    for (const [mx, my, mr] of [[90, 100, 26], [160, 150, 18], [140, 80, 14], [100, 170, 12]]) {
      x.beginPath();
      x.arc(mx, my, mr, 0, Math.PI * 2);
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false, fog: false }));
  moon.position.set(2.3, 2.35, -9);
  moon.scale.setScalar(0.85);
  g.add(moon);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture('rgba(220,235,255,0.9)', 'rgba(150,180,230,0.25)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 }),
  );
  halo.position.copy(moon.position);
  halo.scale.setScalar(3.6);
  g.add(halo);
  const n = 260;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = 0.6 + Math.random() * 7;
    pos[i * 3 + 2] = -12 - Math.random() * 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#dfe8ff', size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false })));
  void glow;
  return g;
}

/** A brass armillary sphere on a stone pedestal: the centerpiece of the loop. */
function armillary() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#8f8a7c', roughness: 0.9 });
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
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 56), BRASS);
    m.rotation.set(...rot);
    sphere.add(m);
  };
  ring(0.24, [0, 0, 0], 0.014);
  ring(0.24, [Math.PI / 2, 0, 0], 0.014);
  ring(0.235, [Math.PI / 2, 0.42, 0]);
  ring(0.22, [0, Math.PI / 2, 0]);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.62, 8), BRASS);
  axis.rotation.z = 0.42;
  sphere.add(axis);
  sphere.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), BRASS));
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.08, 10), BRASS);
  stand.position.y = -0.27;
  sphere.add(stand);
  g.add(sphere);
  return { group: g, sphere };
}

// ------------------------------------------------------------------ assembly

export interface World {
  scene: THREE.Scene;
  sphere: THREE.Group;
  lanterns: ReturnType<typeof lantern>[];
  flies: THREE.Points;
  potFactory: typeof terracottaPot;
  benchTop: number;
  billboards: THREE.Object3D[];
}

export async function buildWorld(artUrl: (name: string) => string, onProgress: (f: number) => void): Promise<World> {
  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.fog = new THREE.Fog('#0c1a14', 9, 20);

  const glow = glowTexture();

  scene.add(new THREE.HemisphereLight('#5577a0', '#22180f', 0.75));
  const moon = new THREE.DirectionalLight('#b4c8ff', 1.1);
  moon.position.set(3, 6, -4);
  scene.add(moon);
  scene.add(new THREE.AmbientLight('#ffffff', 0.08));
  // a soft warm fill from the viewer's side so the robots read against the dark
  const fill = new THREE.PointLight('#ffcf94', 1.4, 9, 1.4);
  fill.position.set(0.4, 2.4, 3.6);
  scene.add(fill);

  // floor
  const floorSize = { w: 12, d: 9, cz: 0.6 };
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(floorSize.w, floorSize.d),
    new THREE.MeshStandardMaterial({ map: floorTexture(floorSize), roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, floorSize.cz);
  scene.add(floor);
  onProgress(0.15);

  scene.add(backWall());
  scene.add(sky(glow));
  const b = bench();
  scene.add(b.group, b.shadow);

  // lanterns: over the bench, and at either side of the path
  const lanterns = [
    { p: new THREE.Vector3(-0.35, 1.75, -1.15), s: 1 },
    { p: new THREE.Vector3(2.15, 1.55, 0.35), s: 0.9 },
    { p: new THREE.Vector3(-2.2, 1.65, 0.1), s: 0.9 },
  ].map(({ p, s }) => {
    const l = lantern(glow);
    l.group.position.copy(p);
    l.group.scale.setScalar(s);
    scene.add(l.group);
    return l;
  });

  scene.add(stringLights(new THREE.Vector3(-4.2, 2.75, -2.5), new THREE.Vector3(4.2, 2.75, -2.5), 0.5, glow));
  scene.add(stringLights(new THREE.Vector3(-4.6, 2.75, -0.2), new THREE.Vector3(4.6, 2.75, -0.2), 0.45, glow));

  const arm = armillary();
  arm.group.position.set(LAYOUT.loop.cx, 0, LAYOUT.loop.cz);
  scene.add(arm.group);

  const flies = fireflies(70, glowTexture('rgba(255,250,215,1)', 'rgba(255,215,110,0.45)'));
  scene.add(flies);

  // the plant flats: the site's own native-plant drawings
  const billboards: THREE.Object3D[] = [];
  const names = ['bed', 'swag', 'vine', 'sprig-azalea', 'sprig-fern', 'sprig-magnolia'];
  const tex: Record<string, { tex: THREE.Texture; aspect: number }> = {};
  let done = 0;
  await Promise.all(
    names.map(async (n) => {
      tex[n] = await artTexture(artUrl(n), n.startsWith('sprig') ? 512 : 1024);
      onProgress(0.15 + (0.75 * ++done) / names.length);
    }),
  );
  const add = (m: THREE.Mesh, bill = false) => {
    scene.add(m);
    if (bill) billboards.push(m);
  };
  const T = (n: string) => tex[n];
  // beds along the back wall and in the front corners
  add(flat(T('bed').tex, T('bed').aspect, 2.6, new THREE.Vector3(-4.7, 0, -2.75), 'bottom-left'));
  add(flat(T('bed').tex, T('bed').aspect, 2.6, new THREE.Vector3(4.7, 0, -2.75), 'bottom-left', true));
  add(flat(T('bed').tex, T('bed').aspect, 1.9, new THREE.Vector3(-1.9, 0, -2.85), 'bottom-left'));
  add(flat(T('bed').tex, T('bed').aspect, 1.9, new THREE.Vector3(1.9, 0, -2.85), 'bottom-left', true));
  add(flat(T('bed').tex, T('bed').aspect, 2.4, new THREE.Vector3(-4.2, 0, 1.6), 'bottom-left'));
  add(flat(T('bed').tex, T('bed').aspect, 2.4, new THREE.Vector3(4.2, 0, 1.6), 'bottom-left', true));
  // beds framing the near corners
  add(flat(T('bed').tex, T('bed').aspect, 1.5, new THREE.Vector3(-3.1, 0, 2.1), 'bottom-left'));
  add(flat(T('bed').tex, T('bed').aspect, 1.5, new THREE.Vector3(3.1, 0, 2.1), 'bottom-left', true));
  add(flat(T('bed').tex, T('bed').aspect, 1.0, new THREE.Vector3(2.25, 0, 1.35), 'bottom-left', true));
  add(flat(T('bed').tex, T('bed').aspect, 1.0, new THREE.Vector3(-2.25, 0, 1.35), 'bottom-left'));
  // a low bed of ferns and blossoms around the armillary sphere's foot
  {
    const { cx, cz } = LAYOUT.loop;
    add(flat(T('bed').tex, T('bed').aspect, 0.62, new THREE.Vector3(cx - 0.02, 0, cz + 0.2), 'bottom-left', true), true);
    add(flat(T('bed').tex, T('bed').aspect, 0.62, new THREE.Vector3(cx + 0.02, 0, cz + 0.2), 'bottom-left'), true);
  }
  // swags hanging from the roof, vines up the columns
  add(flat(T('swag').tex, T('swag').aspect, 3.1, new THREE.Vector3(-4.9, 4.1, -1.9), 'top-left'));
  add(flat(T('swag').tex, T('swag').aspect, 3.1, new THREE.Vector3(4.9, 4.1, -1.9), 'top-left', true));
  add(flat(T('vine').tex, T('vine').aspect, 1.1, new THREE.Vector3(-3.3, 0.05, -2.6), 'bottom-center'));
  add(flat(T('vine').tex, T('vine').aspect, 1.1, new THREE.Vector3(3.3, 0.05, -2.6), 'bottom-center', true));
  // potted azalea and magnolia sprigs at the ends of the bench
  const benchTop = LAYOUT.bench.h;
  const pots: [number, number, string, number][] = [
    [LAYOUT.bench.x + 0.78, LAYOUT.bench.z + 0.05, 'sprig-azalea', 0.62],
    [LAYOUT.bench.x - 0.82, LAYOUT.bench.z - 0.08, 'sprig-magnolia', 0.62],
  ];
  for (const [x, z, art, w] of pots) {
    const pot = terracottaPot(0.1, 0.17);
    pot.position.set(x, benchTop, z);
    scene.add(pot);
    const m = flat(T(art).tex, T(art).aspect, w, new THREE.Vector3(x, benchTop + 0.02, z), 'bottom-center');
    // the sprig drawings are centred on a corner: lift them so the stems sit in the pot
    m.geometry.translate(0, -w / 2 / T(art).aspect + 0.02, 0);
    add(m, true);
  }
  onProgress(1);
  return { scene, sphere: arm.sphere, lanterns, flies, potFactory: terracottaPot, benchTop, billboards };
}
