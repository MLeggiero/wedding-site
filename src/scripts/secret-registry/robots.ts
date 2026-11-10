// Stylized stand-ins for the Secret Registry robots, built from simple shapes
// (used only if a robot's real model fails to load), with the real robots'
// proportions and joints so they can walk, look around and work.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type V3 = [number, number, number];

const std = (color: string, roughness = 0.55, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

export const MAT = {
  ivory: std('#ebe5d6', 0.5),
  cream: std('#f2e3bf', 0.5),
  servo: std('#23272b', 0.55, 0.2),
  rubber: std('#2d2f31', 0.85),
  bill: std('#e3863a', 0.45),
  eye: std('#ffd27a', 0.3, 0, { emissive: new THREE.Color('#ffb648'), emissiveIntensity: 1.6 }),
  pupil: std('#141414', 0.2, 0.3),
  alu: std('#c3c6cb', 0.32, 0.75),
  motor: std('#16181a', 0.45, 0.4),
  ring: std('#d9dde2', 0.25, 0.9),
  brass: std('#c9a24f', 0.35, 0.85),
  accent: std('#e2733a', 0.5),
};

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  return m;
}
const rbox = (w: number, h: number, d: number, r = Math.min(w, h, d) * 0.28) => new RoundedBoxGeometry(w, h, d, 3, r);
const cyl = (r: number, h: number, seg = 20) => new THREE.CylinderGeometry(r, r, h, seg);
const group = (pos: V3 = [0, 0, 0]) => {
  const g = new THREE.Group();
  g.position.set(...pos);
  return g;
};

// ------------------------------------------------------------------ ducks

export interface Leg {
  hip: THREE.Group;
  knee: THREE.Group;
  ankle: THREE.Group;
}
export interface Duck {
  kind: 'odm' | 'micro';
  root: THREE.Group;
  pelvis: THREE.Group;
  body: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  legs: [Leg, Leg];
  /** pelvis height when standing, in model units */
  hipHeight: number;
  /** distance covered by one full gait cycle, in world units */
  stride: number;
}

function duckLeg(side: 1 | -1, s: { thigh: number; shin: number; w: number; foot: number }, shell: THREE.Material): Leg {
  const hip = group([side * s.w, 0, 0]);
  hip.add(mesh(rbox(0.085, 0.06, 0.085), MAT.servo));
  hip.add(mesh(rbox(0.06, s.thigh, 0.07), shell, [0, -s.thigh / 2, 0]));
  const knee = group([0, -s.thigh, 0]);
  knee.add(mesh(rbox(0.075, 0.055, 0.075), MAT.servo));
  knee.add(mesh(rbox(0.052, s.shin, 0.062), shell, [0, -s.shin / 2, 0]));
  const ankle = group([0, -s.shin, 0]);
  ankle.add(mesh(rbox(0.066, 0.048, 0.066), MAT.servo));
  ankle.add(mesh(rbox(0.095, 0.026, s.foot, 0.011), MAT.rubber, [0, -0.036, s.foot * 0.18]));
  hip.add(knee);
  knee.add(ankle);
  return { hip, knee, ankle };
}

/** Open Duck Mini v2 ("odm") or its little sibling Microduck ("micro"). */
export function buildDuck(kind: 'odm' | 'micro'): Duck {
  const micro = kind === 'micro';
  const shell = micro ? MAT.cream : MAT.ivory;
  const leg = micro ? { thigh: 0.13, shin: 0.13, w: 0.075, foot: 0.15 } : { thigh: 0.19, shin: 0.19, w: 0.085, foot: 0.17 };
  const hipHeight = leg.thigh + leg.shin + 0.05;

  const root = new THREE.Group();
  const pelvis = group([0, hipHeight, 0]);
  root.add(pelvis);

  const body = group();
  pelvis.add(body);
  if (micro) {
    const torso = mesh(new THREE.SphereGeometry(0.16, 28, 20), shell, [0, 0.13, 0]);
    torso.scale.set(1, 0.92, 1.18);
    body.add(torso);
    body.add(mesh(new THREE.SphereGeometry(0.05, 16, 12), shell, [0, 0.16, -0.19])); // tail
    body.add(mesh(rbox(0.16, 0.03, 0.02, 0.008), MAT.servo, [0, 0.03, 0.17]));
  } else {
    body.add(mesh(rbox(0.29, 0.25, 0.37, 0.06), shell, [0, 0.15, 0]));
    body.add(mesh(rbox(0.22, 0.12, 0.02, 0.01), MAT.servo, [0, 0.13, 0.186])); // chest panel
    body.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12), MAT.accent, [0.07, 0.17, 0.197], [Math.PI / 2, 0, 0])); // power button
    body.add(mesh(rbox(0.12, 0.05, 0.08, 0.02), shell, [0, 0.16, -0.21])); // tail stub
  }

  // neck and head
  const neck = group(micro ? [0, 0.23, 0.12] : [0, 0.27, 0.13]);
  body.add(neck);
  const neckLen = micro ? 0.07 : 0.17;
  neck.add(mesh(rbox(0.07, 0.06, 0.07), MAT.servo));
  neck.add(mesh(rbox(0.05, neckLen, 0.05), shell, [0, neckLen / 2 + 0.02, 0]));
  const head = group([0, neckLen + 0.05, 0.02]);
  neck.add(head);
  head.add(mesh(rbox(0.065, 0.05, 0.065), MAT.servo, [0, -0.03, 0]));
  if (micro) {
    head.add(mesh(new THREE.SphereGeometry(0.105, 28, 20), shell, [0, 0.06, 0.02]));
    head.add(mesh(rbox(0.1, 0.03, 0.09, 0.014), MAT.bill, [0, 0.03, 0.13]));
    for (const sx of [-1, 1]) {
      head.add(mesh(new THREE.SphereGeometry(0.022, 14, 10), MAT.pupil, [sx * 0.045, 0.085, 0.1]));
      head.add(mesh(new THREE.SphereGeometry(0.008, 8, 6), MAT.eye, [sx * 0.04, 0.095, 0.118]));
    }
  } else {
    head.add(mesh(rbox(0.21, 0.13, 0.18, 0.045), shell, [0, 0.06, 0.03]));
    head.add(mesh(rbox(0.17, 0.065, 0.02, 0.01), MAT.servo, [0, 0.07, 0.12])); // face visor
    for (const sx of [-1, 1]) {
      head.add(mesh(new THREE.SphereGeometry(0.019, 16, 12), MAT.eye, [sx * 0.042, 0.072, 0.13]));
      const ant = group([sx * 0.065, 0.12, -0.01]);
      ant.rotation.z = -sx * 0.25;
      ant.add(mesh(cyl(0.006, 0.12, 8), MAT.servo, [0, 0.06, 0]));
      ant.add(mesh(new THREE.SphereGeometry(0.014, 12, 8), MAT.accent, [0, 0.125, 0]));
      head.add(ant);
    }
    head.add(mesh(rbox(0.11, 0.024, 0.075, 0.01), MAT.bill, [0, 0.02, 0.15])); // bill
  }

  const legs: [Leg, Leg] = [duckLeg(-1, leg, shell), duckLeg(1, leg, shell)];
  for (const l of legs) pelvis.add(l.hip);

  const scale = micro ? 1.25 : 1.65;
  root.scale.setScalar(scale);
  root.traverse((o) => (o.userData.robot = micro ? 'microduck' : 'open-duck-mini'));
  return { kind, root, pelvis, body, neck, head, legs, hipHeight, stride: (micro ? 0.24 : 0.36) * scale };
}

/** One frame of the waddle. `phase` advances with distance walked; `amount` 0 = standing, 1 = full stride. */
export function poseDuck(d: Duck, phase: number, amount: number, look = 0, t = 0) {
  const a = amount;
  const swing = 0.42 * a;
  for (let i = 0; i < 2; i++) {
    const p = phase + i * Math.PI;
    const hip = -swing * Math.sin(p);
    const lift = Math.max(0, Math.cos(p)); // knee bends while the foot swings forward
    const knee = 0.22 + 0.55 * lift * a;
    d.legs[i].hip.rotation.x = hip - knee * 0.5;
    d.legs[i].knee.rotation.x = knee;
    d.legs[i].ankle.rotation.x = -(hip - knee * 0.5) - knee;
  }
  const bob = 0.012 * Math.cos(2 * phase) * a;
  d.pelvis.position.y = d.hipHeight - 0.02 + bob;
  d.pelvis.rotation.z = 0.07 * Math.sin(phase) * a;
  d.body.rotation.x = 0.06 * a;
  // ducks bob their heads as they walk; at rest they breathe and look about
  d.neck.rotation.x = 0.1 * Math.sin(2 * phase) * a + 0.03 * Math.sin(t * 1.7) * (1 - a);
  d.head.rotation.y = look;
  d.head.rotation.x = -0.05 * Math.sin(2 * phase + 0.6) * a;
}

// ------------------------------------------------------------------ arms

export interface Arm {
  root: THREE.Group;
  joints: THREE.Group[]; // j1 (yaw) … j6
  fingers: [THREE.Mesh, THREE.Mesh];
  tip: THREE.Object3D;
  /** model-space link lengths used by the IK */
  dims: { h0: number; l1: number; l2: number; hand: number };
}

function motor(r: number, h: number, axis: 'y' | 'z') {
  const g = new THREE.Group();
  const rot: V3 = axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  g.add(mesh(cyl(r, h, 24), MAT.motor, [0, 0, 0], rot));
  const ring = new THREE.TorusGeometry(r * 0.98, r * 0.09, 8, 28);
  const off = h / 2;
  const ringRot: V3 = axis === 'z' ? [0, 0, 0] : [Math.PI / 2, 0, 0];
  const ringPos: V3 = axis === 'z' ? [0, 0, off] : [0, off, 0];
  g.add(mesh(ring, MAT.ring, ringPos, ringRot));
  g.add(mesh(cyl(r * 0.35, h * 1.04, 16), MAT.ring, [0, 0, 0], rot));
  return g;
}

/** A stylized reBot Arm B601-DM (the fallback if its real model doesn't load). */
export function buildArm(): Arm {
  const link = MAT.alu;
  const k = 1;
  const dims = { h0: 0.17 * k, l1: 0.3 * k, l2: 0.32 * k, hand: 0.14 * k };
  const root = new THREE.Group();
  root.add(mesh(cyl(0.095 * k, 0.04 * k, 28), MAT.servo, [0, 0.02 * k, 0]));

  const j1 = group([0, 0.04 * k, 0]);
  root.add(j1);
  j1.add(motor(0.055 * k, 0.07 * k, 'y').translateY(0.035 * k));
  j1.add(mesh(rbox(0.13 * k, 0.07 * k, 0.06 * k), link, [0, 0.1 * k, 0]));

  const j2 = group([0, dims.h0 - 0.04 * k, 0]);
  j1.add(j2);
  j2.add(motor(0.05 * k, 0.085 * k, 'z'));
  j2.add(mesh(rbox(0.05 * k, dims.l1, 0.04 * k), link, [0, dims.l1 / 2, 0]));

  const j3 = group([0, dims.l1, 0]);
  j2.add(j3);
  j3.add(motor(0.045 * k, 0.075 * k, 'z'));
  j3.add(mesh(rbox(0.042 * k, 0.27 * k, 0.034 * k), link, [0, 0.135 * k, 0]));

  const j4 = group([0, 0.27 * k, 0]);
  j3.add(j4);
  j4.add(motor(0.034 * k, 0.05 * k, 'y').translateY(0.02 * k));

  const j5 = group([0, 0.05 * k, 0]);
  j4.add(j5);
  j5.add(motor(0.032 * k, 0.06 * k, 'z'));

  const j6 = group([0, 0.04 * k, 0]);
  j5.add(j6);
  j6.add(mesh(cyl(0.03 * k, 0.02 * k, 20), MAT.ring, [0, 0.01 * k, 0]));
  j6.add(mesh(rbox(0.1 * k, 0.03 * k, 0.045 * k), MAT.servo, [0, 0.035 * k, 0]));
  const fingerGeo = rbox(0.014 * k, 0.07 * k, 0.03 * k, 0.005 * k);
  const fingers: [THREE.Mesh, THREE.Mesh] = [
    mesh(fingerGeo, MAT.alu, [-0.03 * k, 0.085 * k, 0]),
    mesh(fingerGeo, MAT.alu, [0.03 * k, 0.085 * k, 0]),
  ];
  j6.add(...fingers);
  const tip = new THREE.Object3D();
  tip.position.set(0, 0.1 * k, 0);
  j6.add(tip);

  root.traverse((o) => (o.userData.robot = 'rebot-arm'));
  return { root, joints: [j1, j2, j3, j4, j5, j6], fingers, tip, dims };
}

/**
 * Joint angles that put the arm's fingertips at `target` (arm-root space,
 * model units) with the gripper pointing straight down.
 */
export function armIK(arm: Arm, target: THREE.Vector3, roll = 0) {
  const { h0, l1, l2, hand } = arm.dims;
  const yaw = Math.atan2(-target.z, target.x);
  const u = Math.hypot(target.x, target.z);
  const du = u;
  const dv = target.y + hand - h0;
  const d = Math.min(Math.hypot(du, dv), l1 + l2 - 1e-3);
  const cosPhi = (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2);
  const beta = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosPhi)));
  const delta = Math.atan2(l2 * Math.sin(beta), l1 + l2 * Math.cos(beta));
  const alpha = Math.atan2(du, dv) - delta;
  // the wrist roll (j4) stays at zero so the gripper keeps pointing down; j6 turns it
  return [yaw, -alpha, -beta, 0, -(Math.PI - alpha - beta), roll];
}

export function setArm(arm: Arm, q: number[], grip: number) {
  arm.joints[0].rotation.y = q[0];
  arm.joints[1].rotation.z = q[1];
  arm.joints[2].rotation.z = q[2];
  arm.joints[3].rotation.y = q[3];
  arm.joints[4].rotation.z = q[4];
  arm.joints[5].rotation.y = q[5];
  const k = arm.dims.l1 / 0.3;
  const open = (0.012 + 0.028 * grip) * k;
  arm.fingers[0].position.x = -open;
  arm.fingers[1].position.x = open;
}
