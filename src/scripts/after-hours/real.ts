// The real robots: Microduck, Open Duck Mini v2 and the reBot Arm B601-DM,
// from their makers' published models (converted by scripts/robot-models.mjs).
// Each joint in the files is a node named "joint:<name>" with its axis and
// range in userData, so the robots move on their own joints.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

interface JointInfo {
  node: THREE.Object3D;
  axis: THREE.Vector3;
  type: 'hinge' | 'slide';
  range: [number, number] | null;
  base: THREE.Vector3;
}

export class Rig {
  joints = new Map<string, JointInfo>();
  constructor(public root: THREE.Object3D) {
    root.traverse((o) => {
      const u = o.userData as { joint?: string; axis?: number[]; type?: string; range?: number[] | null };
      if (!u.joint) return;
      this.joints.set(u.joint, {
        node: o,
        axis: new THREE.Vector3(...(u.axis as [number, number, number])).normalize(),
        type: u.type === 'slide' ? 'slide' : 'hinge',
        range: u.range ? [u.range[0], u.range[1]] : null,
        base: o.position.clone(),
      });
    });
  }
  set(name: string, v: number) {
    const j = this.joints.get(name);
    if (!j) return;
    if (j.range) v = Math.min(j.range[1], Math.max(j.range[0], v));
    if (j.type === 'slide') j.node.position.copy(j.base).addScaledVector(j.axis, v);
    else j.node.quaternion.setFromAxisAngle(j.axis, v);
  }
  pose(values: Record<string, number>) {
    for (const [k, v] of Object.entries(values)) this.set(k, v);
  }
}

async function load(url: string, id: string) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  root.traverse((o) => {
    o.userData.robot = id;
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      // normals were left out of the file; rebuild them with crisp creases
      m.geometry = toCreasedNormals(m.geometry, 0.6);
    }
  });
  return root;
}

// ------------------------------------------------------------------ ducks

interface DuckSpec {
  /** the robot's own standing pose */
  stand: Record<string, number>;
  legs: { hip: string; knee: string; ankle: string }[];
  neck: [string, string];
  headYaw: string;
  antennas?: string[];
  /** half a step and the foot's clearance, in the model's own metres */
  step: number;
  lift: number;
}

const ODM: DuckSpec = {
  // Open Duck Mini's standing pose (from its runtime)
  stand: {
    left_hip_yaw: 0.002, left_hip_roll: 0.053, left_hip_pitch: -0.63, left_knee: 1.368, left_ankle: -0.784,
    right_hip_yaw: -0.003, right_hip_roll: -0.065, right_hip_pitch: 0.635, right_knee: 1.379, right_ankle: -0.796,
    neck_pitch: 0, head_pitch: 0, head_yaw: 0, head_roll: 0, left_antenna: 0, right_antenna: 0,
  },
  legs: [
    { hip: 'left_hip_pitch', knee: 'left_knee', ankle: 'left_ankle' },
    { hip: 'right_hip_pitch', knee: 'right_knee', ankle: 'right_ankle' },
  ],
  neck: ['neck_pitch', 'head_pitch'],
  headYaw: 'head_yaw',
  antennas: ['left_antenna', 'right_antenna'],
  step: 0.026,
  lift: 0.014,
};

const MICRO: DuckSpec = {
  // Microduck's STAND keyframe (scene_walk.xml)
  stand: {
    left_hip_yaw: 0, left_hip_roll: -0.0873, left_hip_pitch: -0.4579, left_knee: -0.0049, left_ankle: 0.453,
    right_hip_yaw: 0, right_hip_roll: 0.0873, right_hip_pitch: 0.4579, right_knee: 0.0049, right_ankle: -0.453,
    neck_pitch: 0.349, head_pitch: 0.349, head_yaw: 0, head_roll: 0,
  },
  legs: [
    { hip: 'left_hip_pitch', knee: 'left_knee', ankle: 'left_ankle' },
    { hip: 'right_hip_pitch', knee: 'right_knee', ankle: 'right_ankle' },
  ],
  neck: ['neck_pitch', 'head_pitch'],
  headYaw: 'head_yaw',
  step: 0.016,
  lift: 0.012,
};

export interface RealDuck {
  root: THREE.Group;
  /** distance the body travels per gait cycle, in world units */
  stride: number;
  pose: (phase: number, amount: number, look: number, t: number) => void;
}

/**
 * A duck that walks on its own joints. Each leg is solved numerically (hip
 * and knee put the ankle on its path; the ankle keeps the foot level), so the
 * gait works whatever each robot's joint directions are, within its real
 * joint limits. The body then settles so the standing foot stays on the floor.
 */
function duck(model: THREE.Object3D, spec: DuckSpec, scale: number): RealDuck {
  const rig = new Rig(model);
  const root = new THREE.Group();
  const body = new THREE.Group(); // sways and settles; the legs are solved in its frame
  root.add(body);
  body.add(model);
  model.scale.setScalar(scale);
  rig.pose(spec.stand);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.y = -box.min.y;
  root.updateMatrixWorld(true);

  const tmpV = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const bodyQ = new THREE.Quaternion();
  const ankleIn = (n: THREE.Object3D, out: THREE.Vector3) => body.worldToLocal(n.getWorldPosition(out));
  const footQIn = (n: THREE.Object3D, out: THREE.Quaternion) => {
    body.getWorldQuaternion(bodyQ).invert();
    return out.copy(bodyQ).multiply(n.getWorldQuaternion(tmpQ));
  };
  /** rotation of the foot about the body's left–right axis, relative to standing */
  const footPitch = (n: THREE.Object3D, q0: THREE.Quaternion) => {
    const e = footQIn(n, new THREE.Quaternion()).multiply(q0.clone().invert());
    return 2 * Math.atan2(e.x, e.w);
  };

  const legs = spec.legs.map((l) => {
    const hip = rig.joints.get(l.hip)!;
    const knee = rig.joints.get(l.knee)!;
    const ankle = rig.joints.get(l.ankle)!;
    const a0 = ankleIn(ankle.node, new THREE.Vector3());
    const f0 = footQIn(ankle.node, new THREE.Quaternion());
    // which way the ankle joint turns the foot
    rig.set(l.ankle, spec.stand[l.ankle] + 0.01);
    hip.node.updateMatrixWorld(true);
    const ankleSign = footPitch(ankle.node, f0) / 0.01;
    rig.set(l.ankle, spec.stand[l.ankle]);
    hip.node.updateMatrixWorld(true);
    return { l, hip, knee, ankle, a0, f0, ankleSign, q: [spec.stand[l.hip], spec.stand[l.knee]], qa: spec.stand[l.ankle] };
  });

  const target = new THREE.Vector3();
  const solveLeg = (leg: (typeof legs)[number]) => {
    const { l, hip, ankle } = leg;
    const at = (q0: number, q1: number) => {
      rig.set(l.hip, q0);
      rig.set(l.knee, q1);
      hip.node.updateMatrixWorld(true);
      return ankleIn(ankle.node, tmpV);
    };
    rig.set(l.ankle, leg.qa);
    for (let it = 0; it < 4; it++) {
      const p = at(leg.q[0], leg.q[1]).clone();
      const ey = target.y - p.y;
      const ez = target.z - p.z;
      if (ey * ey + ez * ez < 1e-8) break;
      // probe each joint away from its limit (a clamped probe would read as "no effect")
      const probe = (j: JointInfo, v: number) => (j.range && v + 1e-3 > j.range[1] ? -1e-3 : 1e-3);
      const ha = probe(leg.hip, leg.q[0]);
      const hb = probe(leg.knee, leg.q[1]);
      const pa = at(leg.q[0] + ha, leg.q[1]).clone();
      const pb = at(leg.q[0], leg.q[1] + hb).clone();
      const j00 = (pa.y - p.y) / ha, j01 = (pb.y - p.y) / hb;
      const j10 = (pa.z - p.z) / ha, j11 = (pb.z - p.z) / hb;
      // damped least squares
      const lam = 1e-4;
      const a = j00 * j00 + j10 * j10 + lam, b = j00 * j01 + j10 * j11, d = j01 * j01 + j11 * j11 + lam;
      const g0 = j00 * ey + j10 * ez, g1 = j01 * ey + j11 * ez;
      const det = a * d - b * b || 1e-12;
      const clampTo = (j: JointInfo, v: number) => (j.range ? Math.min(j.range[1], Math.max(j.range[0], v)) : v);
      leg.q[0] = clampTo(leg.hip, leg.q[0] + Math.max(-0.3, Math.min(0.3, (d * g0 - b * g1) / det)));
      leg.q[1] = clampTo(leg.knee, leg.q[1] + Math.max(-0.3, Math.min(0.3, (a * g1 - b * g0) / det)));
    }
    at(leg.q[0], leg.q[1]);
    // keep the foot level
    for (let it = 0; it < 2; it++) {
      leg.qa -= footPitch(ankle.node, leg.f0) / leg.ankleSign;
      rig.set(l.ankle, leg.qa);
      hip.node.updateMatrixWorld(true);
    }
  };

  const pose = (phase: number, amount: number, look: number, t: number) => {
    body.position.y = 0;
    body.rotation.z = 0;
    body.updateMatrixWorld(true);
    legs.forEach((leg, i) => {
      const p = phase + i * Math.PI;
      // swing forward with the foot lifted, then push back along the floor
      target.copy(leg.a0);
      target.z += spec.step * scale * amount * Math.sin(p);
      target.y += spec.lift * scale * amount * Math.max(0, Math.cos(p));
      solveLeg(leg);
    });
    // a gentle waddle over the standing foot, and settle that foot onto the floor
    body.rotation.z = 0.045 * amount * Math.cos(phase);
    body.updateMatrixWorld(true);
    let low = Infinity;
    for (const leg of legs) low = Math.min(low, root.worldToLocal(leg.ankle.node.getWorldPosition(tmpV)).y - leg.a0.y);
    body.position.y = -low;
    // a duck's head bob while walking; a slow breath and a look about while standing
    rig.set(spec.neck[0], spec.stand[spec.neck[0]] + 0.1 * amount * Math.sin(2 * phase) + 0.04 * (1 - amount) * Math.sin(t * 1.3));
    rig.set(spec.neck[1], spec.stand[spec.neck[1]] - 0.08 * amount * Math.sin(2 * phase + 0.5));
    rig.set(spec.headYaw, look);
    spec.antennas?.forEach((n, i) => rig.set(n, 0.25 * Math.sin(t * 2.1 + i * 1.7) * (0.4 + amount)));
  };
  return { root, stride: 4 * spec.step * scale, pose };
}

// ------------------------------------------------------------------ arm

export interface RealArm {
  root: THREE.Group;
  tip: THREE.Object3D;
  /** settle into a good starting pose for a first target (tries a few guesses) */
  warm: (target: THREE.Vector3) => void;
  /** solve and apply: put the fingertips at `target` (world) pointing down */
  reach: (target: THREE.Vector3, roll: number) => void;
  grip: (open: number) => void;
  /** the arm's current joint angles (for the leader arm to echo) */
  q: number[];
}

function arm(model: THREE.Object3D, scale: number): RealArm {
  const rig = new Rig(model);
  const root = new THREE.Group();
  root.add(model);
  model.scale.setScalar(scale);
  const names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6'];
  const j6 = rig.joints.get('joint6')!.node;

  // the tool point: the middle of the fingers, in joint 6's frame
  model.updateMatrixWorld(true);
  const fingers = new THREE.Box3();
  model.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && /finger/.test(o.name)) fingers.expandByObject(o);
  });
  const tip = new THREE.Object3D();
  if (!fingers.isEmpty()) {
    const c = fingers.getCenter(new THREE.Vector3());
    j6.worldToLocal(c);
    tip.position.copy(c);
  } else tip.position.set(0, 0, 0.22);
  j6.add(tip);
  const axisLocal = tip.position.clone().normalize();

  // The B601's joints: 1 turns the base, 2–4 are parallel pitch joints, 5 swings
  // the gripper sideways and 6 rolls it. To put the fingertips on a point with the
  // gripper pointing down, solve joints 1–4 and keep 5 centred; 6 turns the gripper.
  const IK = [0, 1, 2, 3];
  let q = [0, -1, -1.5, 0.5, 0, 0];
  const apply = (v: number[]) => {
    names.forEach((n, i) => rig.set(n, v[i]));
    root.updateMatrixWorld(true);
  };
  const toolPose = () => {
    const p = tip.getWorldPosition(new THREE.Vector3());
    const z = axisLocal.clone().transformDirection(j6.matrixWorld);
    return { p, z };
  };
  const down = new THREE.Vector3(0, -1, 0);
  const W = 0.1; // pointing down matters, but reaching the spot matters more
  const clampJ = (i: number, v: number) => {
    const r = rig.joints.get(names[i])!.range;
    return r ? Math.min(r[1], Math.max(r[0], v)) : v;
  };
  const residual = (v: number[], target: THREE.Vector3) => {
    apply(v);
    const { p, z } = toolPose();
    return [target.x - p.x, target.y - p.y, target.z - p.z, W * (down.x - z.x), W * (down.y - z.y), W * (down.z - z.z)];
  };
  const norm = (e: number[]) => Math.hypot(...e);

  // damped least squares with a step check, so it never makes things worse
  const solve = (target: THREE.Vector3, iters: number) => {
    let e = residual(q, target);
    let E = norm(e);
    for (let it = 0; it < iters && E > 2e-4; it++) {
      const J: number[][] = Array.from({ length: 6 }, () => new Array(IK.length).fill(0));
      IK.forEach((j, c) => {
        const r = rig.joints.get(names[j])!.range;
        const h = r && q[j] + 1e-3 > r[1] ? -1e-3 : 1e-3; // probe away from a limit
        const v = q.slice();
        v[j] += h;
        const e2 = residual(v, target);
        for (let k = 0; k < 6; k++) J[k][c] = (e[k] - e2[k]) / h;
      });
      // joints pinned at a limit and pushed further into it are frozen, and the rest re-solved
      const lambda = 0.01;
      let active = IK.map((_, c) => c);
      let dq = new Array(IK.length).fill(0);
      for (let pass = 0; pass < IK.length; pass++) {
        const A = Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 6 }, (_, c) => active.reduce((s, k) => s + J[r][k] * J[c][k], 0) + (r === c ? lambda * lambda : 0)),
        );
        const y = gauss(A, e);
        dq = IK.map((_, c) => (active.includes(c) ? J.reduce((s, row, k) => s + row[c] * y[k], 0) : 0));
        const blocked = active.filter((c) => {
          const r = rig.joints.get(names[IK[c]])!.range;
          return r && ((q[IK[c]] >= r[1] - 1e-6 && dq[c] > 0) || (q[IK[c]] <= r[0] + 1e-6 && dq[c] < 0));
        });
        if (!blocked.length) break;
        active = active.filter((c) => !blocked.includes(c));
        if (!active.length) break;
      }
      let step = 1;
      let improved = false;
      for (let ls = 0; ls < 5; ls++) {
        const v = q.slice();
        IK.forEach((j, c) => (v[j] = clampJ(j, q[j] + Math.max(-0.4, Math.min(0.4, step * dq[c])))));
        const e2 = residual(v, target);
        const E2 = norm(e2);
        if (E2 < E) {
          q = v;
          e = e2;
          E = E2;
          improved = true;
          break;
        }
        step *= 0.5;
      }
      if (!improved) break;
    }
    apply(q);
  };

  const reach = (target: THREE.Vector3, roll: number) => {
    q[5] = roll;
    solve(target, 4);
  };
  const grip = (open: number) => {
    const w = 0.004 + 0.032 * open;
    rig.set('finger_left', w);
    rig.set('finger_right', -w);
  };
  /** try a few elbow-up starting poses and keep the best */
  const warm = (target: THREE.Vector3) => {
    const base = root.getWorldPosition(new THREE.Vector3());
    const yaw = Math.atan2(target.x - base.x, target.z - base.z);
    let best = q;
    let bestErr = Infinity;
    for (const j2 of [-0.5, -1.1, -1.7]) {
      for (const j3 of [-0.9, -1.7, -2.5]) {
        q = [yaw, j2, j3, 0.4, 0, 0];
        solve(target, 40);
        const err = norm(residual(q, target));
        if (err < bestErr) {
          bestErr = err;
          best = q.slice();
        }
      }
    }
    q = best;
    apply(q);
  };
  grip(1);
  return {
    root,
    tip,
    warm,
    reach,
    grip,
    get q() {
      return q;
    },
  };
}

function gauss(A: number[][], b: number[]) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-9;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / d;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-9));
}

// ------------------------------------------------------------------ loading

/** The ducks are shown larger than life (about 1.45×) so they read in the room; their real sizes are kept relative to each other. */
const DUCK_SCALE = 1.45;

export interface RealRobots {
  odm?: RealDuck;
  micro?: RealDuck;
  arm?: RealArm;
}

/** Load whichever official models are available; missing ones fall back to the portraits. */
export async function loadRealRobots(base: string): Promise<RealRobots> {
  const [o, m, a] = await Promise.allSettled([
    load(`${base}/models/open-duck-mini.glb`, 'open-duck-mini'),
    load(`${base}/models/microduck.glb`, 'microduck'),
    load(`${base}/models/rebot-arm.glb`, 'rebot-arm'),
  ]);
  return {
    odm: o.status === 'fulfilled' ? duck(o.value, ODM, DUCK_SCALE) : undefined,
    micro: m.status === 'fulfilled' ? duck(m.value, MICRO, DUCK_SCALE) : undefined,
    arm: a.status === 'fulfilled' ? arm(a.value, 1.35) : undefined,
  };
}
