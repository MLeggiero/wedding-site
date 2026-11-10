// Converts the official robot models (MuJoCo MJCF + STL parts) into small,
// rigged GLB files for the Secret Registry room (public/models/*.glb).
//
//   node scripts/robot-models.mjs <dir>
//
// where <dir> holds clones of the three source repositories:
//   Open_Duck_Mini  (github.com/apirrone/Open_Duck_Mini, branch v2)
//   microduck_rl    (github.com/pollen-robotics/microduck_rl, branch develop)
//   reBot-DevArm    (github.com/Seeed-Projects/reBot-DevArm, branch main)
//
// For each robot it walks the MJCF body tree, keeps the visual mesh parts,
// merges them per body and colour, simplifies them with meshoptimizer, and
// writes one compressed GLB. Every hinge or slide joint becomes a node named
// after the joint, with its axis and range in `extras`, so the page can drive
// the real joints. Normals are left out and rebuilt in the browser.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { meshopt, prune } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const SRC = process.argv[2];
if (!SRC || !existsSync(SRC)) {
  console.error('usage: node scripts/robot-models.mjs <dir with the three source clones>');
  process.exit(1);
}
const OUT = new URL('../public/models/', import.meta.url).pathname;

// reBot's materials carry names, not colours
const NAMED = {
  anodized_grey: { rgba: [0.62, 0.64, 0.67, 1], metal: 0.75, rough: 0.38 },
  hardware_black: { rgba: [0.09, 0.09, 0.1, 1], metal: 0.5, rough: 0.45 },
  matte_black: { rgba: [0.13, 0.13, 0.14, 1], metal: 0.15, rough: 0.6 },
  seeed_yellow: { rgba: [0.96, 0.73, 0.1, 1], metal: 0.1, rough: 0.45 },
  silver_trim: { rgba: [0.78, 0.8, 0.83, 1], metal: 0.85, rough: 0.3 },
  metal: { rgba: [0.7, 0.72, 0.75, 1], metal: 0.85, rough: 0.32 },
  finger_black: { rgba: [0.12, 0.12, 0.13, 1], metal: 0.1, rough: 0.55 },
  carriage_grey: { rgba: [0.42, 0.45, 0.48, 1], metal: 0.5, rough: 0.45 },
  grey: { rgba: [0.3, 0.34, 0.33, 1], metal: 0.3, rough: 0.5 },
};

const ROBOTS = [
  {
    id: 'open-duck-mini',
    xml: 'Open_Duck_Mini/mini_bdx/robots/open_duck_mini_v2/robot.xml',
    root: 'trunk_assembly',
    budget: 34000,
    keep: (g) => (g.attrs.type ?? 'sphere') === 'mesh',
  },
  {
    id: 'microduck',
    xml: 'microduck_rl/src/mjlab_microduck/robot/microduck/robot_walk.xml',
    root: 'trunk_base',
    budget: 30000,
    keep: (g) => g.attrs.class === 'visual',
  },
  {
    id: 'rebot-arm',
    xml: 'reBot-DevArm/Rebot_Arm_description/DM/mjcf/rebotarm_b601_colored.xml',
    root: 'base_link',
    budget: 30000,
    keep: (g) => /_visual$/.test(g.attrs.name ?? '') && (g.attrs.type ?? '') === 'mesh',
  },
];

// ------------------------------------------------------------------ tiny XML reader
function parseXML(src) {
  src = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '');
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(src))) {
    const [, close, tag, attrStr, self] = m;
    if (close) {
      stack.pop();
      continue;
    }
    const attrs = {};
    for (const a of attrStr.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = (a[2] ?? a[3]).replace(/\s+/g, ' ').trim();
    const node = { tag, attrs, children: [] };
    stack.at(-1).children.push(node);
    if (!self) stack.push(node);
  }
  return root.children[0];
}
const kids = (n, tag) => n.children.filter((c) => c.tag === tag);
const nums = (s, d) => (s ? s.split(' ').map(Number) : d);

// ------------------------------------------------------------------ small vector maths
// MuJoCo quaternions are w x y z
function qrot([w, x, y, z], [vx, vy, vz]) {
  const tx = 2 * (y * vz - z * vy);
  const ty = 2 * (z * vx - x * vz);
  const tz = 2 * (x * vy - y * vx);
  return [vx + w * tx + (y * tz - z * ty), vy + w * ty + (z * tx - x * tz), vz + w * tz + (x * ty - y * tx)];
}
const normQ = (q) => {
  const l = Math.hypot(...q) || 1;
  return q.map((v) => v / l);
};

// ------------------------------------------------------------------ STL
function readSTL(file) {
  const buf = readFileSync(file);
  const count = buf.readUInt32LE(80);
  if (84 + count * 50 === buf.length) {
    const out = new Float32Array(count * 9);
    for (let i = 0; i < count; i++) {
      const o = 84 + i * 50 + 12;
      for (let k = 0; k < 9; k++) out[i * 9 + k] = buf.readFloatLE(o + k * 4);
    }
    return out;
  }
  const vs = [...buf.toString('utf8').matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)].flatMap((m) => [+m[1], +m[2], +m[3]]);
  return new Float32Array(vs);
}

/** Weld a triangle soup into indexed geometry (positions rounded to 1 µm). */
function weld(soup) {
  const map = new Map();
  const pos = [];
  const idx = new Uint32Array(soup.length / 3);
  for (let i = 0; i < soup.length; i += 3) {
    const key = `${Math.round(soup[i] * 1e6)},${Math.round(soup[i + 1] * 1e6)},${Math.round(soup[i + 2] * 1e6)}`;
    let v = map.get(key);
    if (v === undefined) {
      v = pos.length / 3;
      map.set(key, v);
      pos.push(soup[i], soup[i + 1], soup[i + 2]);
    }
    idx[i / 3] = v;
  }
  return { pos: new Float32Array(pos), idx };
}

/** Drop vertices the simplified index buffer no longer uses. */
function compact(pos, idx) {
  const remap = new Int32Array(pos.length / 3).fill(-1);
  const out = [];
  const nidx = new Uint32Array(idx.length);
  let n = 0;
  for (let i = 0; i < idx.length; i++) {
    let r = remap[idx[i]];
    if (r < 0) {
      r = remap[idx[i]] = n++;
      out.push(pos[idx[i] * 3], pos[idx[i] * 3 + 1], pos[idx[i] * 3 + 2]);
    }
    nidx[i] = r;
  }
  return { pos: new Float32Array(out), idx: nidx };
}

// ------------------------------------------------------------------ conversion
async function convert(robot) {
  const xmlPath = path.join(SRC, robot.xml);
  const xmlDir = path.dirname(xmlPath);
  const mj = parseXML(readFileSync(xmlPath, 'utf8'));
  const compiler = mj.children.find((c) => c.tag === 'compiler')?.attrs ?? {};
  const meshDir = path.join(xmlDir, compiler.meshdir ?? '');
  const assets = mj.children.filter((c) => c.tag === 'asset').flatMap((a) => a.children);
  const meshFile = Object.fromEntries(assets.filter((a) => a.tag === 'mesh').map((a) => [a.attrs.name ?? path.parse(a.attrs.file).name, a.attrs.file]));
  const materials = Object.fromEntries(assets.filter((a) => a.tag === 'material').map((a) => [a.attrs.name, a.attrs]));

  const colourOf = (g) => {
    if (g.attrs.rgba) return { rgba: nums(g.attrs.rgba), metal: 0.05, rough: 0.55 };
    const mat = materials[g.attrs.material];
    if (mat?.rgba) return { rgba: nums(mat.rgba), metal: 0.05, rough: 0.55 };
    const key = Object.keys(NAMED).find((k) => (g.attrs.material ?? '').includes(k));
    return NAMED[key ?? 'grey'];
  };

  // find the root body
  const find = (n) => {
    if (n.tag === 'body' && n.attrs.name === robot.root) return n;
    for (const c of n.children) {
      const f = find(c);
      if (f) return f;
    }
    return null;
  };
  const rootBody = find(mj);
  if (!rootBody) throw new Error(`${robot.id}: body ${robot.root} not found`);

  // first pass: gather every part, merged per body and colour
  const parts = []; // { body, colour, soup: number[] }
  const bodies = [];
  const stlCache = new Map();
  (function gather(body, isRoot) {
    bodies.push(body);
    const groups = new Map();
    for (const g of kids(body, 'geom')) {
      if (!robot.keep(g)) continue;
      const rgba = nums(g.attrs.rgba, [1, 1, 1, 1]);
      if (rgba[3] < 0.5) continue;
      const file = meshFile[g.attrs.mesh];
      if (!file) continue;
      let tri = stlCache.get(file);
      if (!tri) stlCache.set(file, (tri = readSTL(path.join(meshDir, file))));
      const p = nums(g.attrs.pos, [0, 0, 0]);
      const q = normQ(nums(g.attrs.quat, [1, 0, 0, 0]));
      const c = colourOf(g);
      const key = c.rgba.map((v) => v.toFixed(3)).join(',') + `|${c.metal}|${c.rough}`;
      let grp = groups.get(key);
      if (!grp) groups.set(key, (grp = { body, colour: c, soup: [] }));
      for (let i = 0; i < tri.length; i += 3) {
        const v = qrot(q, [tri[i], tri[i + 1], tri[i + 2]]);
        grp.soup.push(v[0] + p[0], v[1] + p[1], v[2] + p[2]);
      }
    }
    parts.push(...groups.values());
    for (const c of kids(body, 'body')) gather(c, false);
    void isRoot;
  })(rootBody, true);

  const totalTris = parts.reduce((s, p) => s + p.soup.length / 9, 0);
  const ratio = Math.min(1, robot.budget / totalTris);
  await MeshoptSimplifier.ready;

  // build the glTF
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(robot.id);
  // MuJoCo is z-up with the robot facing +x; three.js is y-up and our robots face +z
  const top = doc.createNode(robot.id).setRotation([-0.5, -0.5, -0.5, 0.5]);
  scene.addChild(top);
  const matCache = new Map();
  const material = (c) => {
    const key = JSON.stringify(c);
    if (!matCache.has(key)) {
      matCache.set(
        key,
        doc
          .createMaterial()
          .setBaseColorFactor([...c.rgba.slice(0, 3).map((v) => Math.pow(v, 2.2)), 1])
          .setMetallicFactor(c.metal)
          .setRoughnessFactor(c.rough),
      );
    }
    return matCache.get(key);
  };
  let outTris = 0;
  const meshFor = (part) => {
    const w = weld(part.soup);
    const target = Math.max(36, Math.floor((w.idx.length * ratio) / 3) * 3);
    let idx = w.idx;
    if (target < w.idx.length) [idx] = MeshoptSimplifier.simplify(w.idx, w.pos, 3, target, 0.05);
    const c = compact(w.pos, idx);
    outTris += c.idx.length / 3;
    const prim = doc
      .createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(c.pos).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(c.pos.length / 3 > 65535 ? c.idx : new Uint16Array(c.idx)).setBuffer(buffer))
      .setMaterial(material(part.colour));
    return doc.createMesh().addPrimitive(prim);
  };

  (function build(body, parent, isRoot) {
    const node = doc.createNode(body.attrs.name ?? 'body');
    if (!isRoot) {
      node.setTranslation(nums(body.attrs.pos, [0, 0, 0]));
      const [w, x, y, z] = normQ(nums(body.attrs.quat, [1, 0, 0, 0]));
      node.setRotation([x, y, z, w]);
    }
    parent.addChild(node);
    let holder = node;
    const joint = kids(body, 'joint').find((j) => (j.attrs.type ?? 'hinge') !== 'free');
    if (joint) {
      const pivot = doc.createNode(`joint:${joint.attrs.name}`).setTranslation(nums(joint.attrs.pos, [0, 0, 0]));
      pivot.setExtras({
        joint: joint.attrs.name,
        type: joint.attrs.type ?? 'hinge',
        axis: nums(joint.attrs.axis, [0, 0, 1]),
        range: nums(joint.attrs.range, null),
      });
      node.addChild(pivot);
      holder = pivot;
    }
    for (const part of parts.filter((p) => p.body === body)) {
      holder.addChild(doc.createNode(`${body.attrs.name}-part`).setMesh(meshFor(part)));
    }
    // empty marker bodies (feet, head, etc.) stay as named nodes for the page to find
    for (const c of kids(body, 'body')) build(c, holder, false);
  })(rootBody, top, true);

  await MeshoptEncoder.ready;
  // keepLeaves: empty marker bodies (feet, head) stay so the page can find them
  await doc.transform(prune({ keepLeaves: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const glb = await io.writeBinary(doc);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, `${robot.id}.glb`), glb);
  console.log(`${robot.id}: ${parts.length} parts, ${Math.round(totalTris)} → ${outTris} triangles, ${(glb.byteLength / 1024).toFixed(0)} KB`);
}

for (const r of ROBOTS) await convert(r);
