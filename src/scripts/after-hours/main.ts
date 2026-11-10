// After Hours: the glasshouse at night, where the robots come out.
// Builds the scene, animates the residents, and talks to the page's cards (ui.ts).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildWorld, blobShadow, LAYOUT } from './world';
import { buildDuck, poseDuck, buildArm, armIK, setArm, type Duck } from './robots';
import { initUI, type RobotId } from './ui';

const root = document.querySelector<HTMLElement>('[data-after-hours]')!;
const stage = root.querySelector<HTMLElement>('.ah__stage')!;
const loading = root.querySelector<HTMLElement>('.ah__loading')!;
const bar = root.querySelector<HTMLElement>('.ah__loading-bar span')!;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const artUrl = (name: string) => `${base}/flora/${name}.svg`;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (!webglOK()) {
  root.classList.add('ah--list');
  initUI(root, {});
} else {
  start().catch((err) => {
    console.error(err);
    root.classList.add('ah--list');
    initUI(root, {});
  });
}

async function start() {
  let needsRender = true;
  let running = false;
  let loaded = false;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const world = await buildWorld(artUrl, (f) => (bar.style.width = `${Math.round(f * 100)}%`));
  const { scene } = world;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;

  // ---------------------------------------------------------------- residents
  const { loop, bench } = LAYOUT;
  const loopAt = (t: number) => new THREE.Vector3(loop.cx + loop.rx * Math.cos(t), 0, loop.cz + loop.rz * Math.sin(t));
  const loopSpeed = (t: number) => Math.hypot(loop.rx * Math.sin(t), loop.rz * Math.cos(t));

  const odm = buildDuck('odm');
  const micro = buildDuck('micro');
  odm.root.scale.multiplyScalar(0.55);
  micro.root.scale.multiplyScalar(0.6);
  odm.stride *= 0.55;
  micro.stride *= 0.6;
  for (const d of [odm, micro]) {
    scene.add(d.root);
    const sh = blobShadow(d === odm ? 0.75 : 0.5, d === odm ? 0.75 : 0.5);
    sh.raycast = () => {};
    d.root.add(sh);
    sh.scale.setScalar(1 / d.root.scale.x);
  }

  const arm = buildArm('follower');
  const leader = buildArm('leader');
  const armBase = new THREE.Vector3(bench.x + 0.1, world.benchTop, bench.z - 0.15);
  arm.root.position.copy(armBase);
  arm.root.scale.setScalar(1.15);
  leader.root.position.set(bench.x - 0.5, world.benchTop, bench.z - 0.05);
  leader.root.scale.setScalar(1.15);
  scene.add(arm.root, leader.root);

  // two pots for the arm to repot a fern seedling between
  const local = (x: number, z: number) => new THREE.Vector3(x, 0, z);
  const potSpots = [local(0.45, 0.05), local(0.24, 0.3)];
  const potH = 0.17;
  for (const p of potSpots) {
    const pot = world.potFactory(0.085, potH);
    pot.position.copy(armBase).add(p.clone().multiplyScalar(1.15));
    scene.add(pot);
  }
  const seedling = new THREE.Group();
  {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), new THREE.MeshStandardMaterial({ color: '#3a2618', roughness: 1 }));
    ball.scale.y = 0.7;
    seedling.add(ball);
    const frondMat = new THREE.MeshStandardMaterial({ color: '#5f9a45', roughness: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.2, 5), frondMat);
      const a = (i / 7) * Math.PI * 2;
      f.position.set(Math.cos(a) * 0.03, 0.1, Math.sin(a) * 0.03);
      f.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      seedling.add(f);
    }
  }
  scene.add(seedling);
  const soilY = world.benchTop + potH * 0.86;
  const placeSeedling = (i: number) => {
    scene.attach(seedling);
    seedling.position.copy(armBase).add(potSpots[i].clone().multiplyScalar(1.15));
    seedling.position.y = soilY + 0.02;
    seedling.rotation.set(0, 0, 0);
  };
  placeSeedling(0);

  // ---------------------------------------------------------------- camera
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.6;
  const home = new THREE.Vector3(0, 0.62, -0.35);
  const target = home.clone();
  controls.target.copy(home);

  function frame() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    const portrait = aspect < 0.85;
    camera.fov = portrait ? 44 : 34;
    // keep the brick loop and the bench in view on any screen
    const want = portrait ? 3.2 : Math.min(5.6, 3.3 + aspect * 1.25);
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect;
    const dist = Math.max(want / 2 / tanH, portrait ? 6 : 4.6);
    const elev = portrait ? 0.62 : 0.4;
    // phones: the heading sits over the top of the view, so look a little higher
    home.set(0, portrait ? 1.05 : 0.7, portrait ? -0.25 : -0.3);
    camera.position.set(0, home.y + Math.sin(elev) * dist, home.z + Math.cos(elev) * dist);
    controls.minDistance = dist * 0.7;
    controls.maxDistance = dist * 1.2;
    controls.minPolarAngle = Math.PI / 2 - elev - 0.3;
    controls.maxPolarAngle = Math.min(Math.PI / 2 - 0.08, Math.PI / 2 - elev + 0.18);
    controls.minAzimuthAngle = -0.6;
    controls.maxAzimuthAngle = 0.6;
    camera.updateProjectionMatrix();
    controls.update();
    (world.flies.material as THREE.ShaderMaterial).uniforms.scale.value = h / 700;
    requestRender();
  }

  // ---------------------------------------------------------------- behaviour
  interface Walker {
    duck: Duck;
    t: number;
    phase: number;
    amount: number;
    look: number;
  }
  const odmW: Walker = { duck: odm, t: 0.6, phase: 0, amount: 0, look: 0 };
  const microW: Walker = { duck: micro, t: 0.6 - 1.55, phase: 1.2, amount: 0, look: 0 };
  const gap = 1.55;
  let walking = !reduceMotion;
  let stateTimer = 3;
  let lookGoal = 0;
  const speed = 0.32;

  // steering Microduck by hand
  const steer = { on: false, heading: 0, pos: new THREE.Vector3(), input: new THREE.Vector2(), returning: false };

  function placeOnLoop(w: Walker) {
    const p = loopAt(w.t);
    const tan = new THREE.Vector3(-loop.rx * Math.sin(w.t), 0, loop.rz * Math.cos(w.t));
    w.duck.root.position.copy(p);
    w.duck.root.rotation.y = Math.atan2(tan.x, tan.z);
  }

  function updateDucks(dt: number, t: number) {
    stateTimer -= dt;
    if (stateTimer <= 0) {
      walking = !walking;
      stateTimer = walking ? 6 + Math.random() * 5 : 2.6 + Math.random() * 2;
      lookGoal = walking ? 0 : (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
    }
    const goal = walking ? 1 : 0;
    for (const w of [odmW, microW]) w.amount += (goal - w.amount) * Math.min(1, dt * 2.5);
    const dist = speed * odmW.amount * dt;
    odmW.t += dist / loopSpeed(odmW.t);
    odmW.phase += (dist / odm.stride) * Math.PI * 2;
    odmW.look += ((walking ? 0 : lookGoal) - odmW.look) * Math.min(1, dt * 2);
    placeOnLoop(odmW);
    poseDuck(odm, odmW.phase, odmW.amount, odmW.look, t);

    if (!steer.on && !steer.returning) {
      // the duckling keeps its place behind its parent
      const goalT = odmW.t - gap;
      const d = (goalT - microW.t) * loopSpeed(microW.t);
      microW.t = goalT;
      microW.phase += (Math.abs(d) / micro.stride) * Math.PI * 2;
      microW.look += ((walking ? 0 : -lookGoal * 0.7) - microW.look) * Math.min(1, dt * 1.6);
      placeOnLoop(microW);
      poseDuck(micro, microW.phase, odmW.amount, microW.look, t + 1);
    } else {
      updateSteer(dt, t);
    }
  }

  const bounds = { x: 3.0, zMin: -0.75, zMax: 2.2 };
  function updateSteer(dt: number, t: number) {
    let fwd = 0;
    let turn = 0;
    if (steer.returning) {
      const goal = loopAt(odmW.t - gap);
      const to = goal.clone().sub(steer.pos);
      const want = Math.atan2(to.x, to.z);
      turn = THREE.MathUtils.clamp(angleDiff(want, steer.heading) * 2.5, -1, 1);
      fwd = to.length() > 0.08 ? 1 : 0;
      if (to.length() < 0.1) {
        steer.returning = false;
        microW.t = odmW.t - gap;
        return;
      }
    } else {
      fwd = steer.input.y;
      turn = -steer.input.x;
    }
    steer.heading += turn * 2.2 * dt;
    const step = Math.max(0, fwd) * 0.55 * dt - Math.max(0, -fwd) * 0.25 * dt;
    const next = steer.pos.clone().add(new THREE.Vector3(Math.sin(steer.heading), 0, Math.cos(steer.heading)).multiplyScalar(step));
    next.x = THREE.MathUtils.clamp(next.x, -bounds.x, bounds.x);
    next.z = THREE.MathUtils.clamp(next.z, bounds.zMin, bounds.zMax);
    steer.pos.copy(next);
    microW.amount += ((Math.abs(fwd) > 0.05 || Math.abs(turn) > 0.2 ? 1 : 0) - microW.amount) * Math.min(1, dt * 5);
    microW.phase += ((Math.abs(step) + Math.abs(turn) * 0.004) / micro.stride) * Math.PI * 2;
    micro.root.position.copy(steer.pos);
    micro.root.rotation.y = steer.heading;
    poseDuck(micro, microW.phase, microW.amount, 0, t);
  }
  const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

  // the arm repots a fern seedling back and forth, then shows it off
  const toLocal = (spot: THREE.Vector3, y: number) => new THREE.Vector3(spot.x, y, spot.z);
  const graspY = (soilY - world.benchTop + 0.07) / 1.15;
  const highY = graspY + 0.22;
  let from = 0;
  type Step = { to?: THREE.Vector3; dur: number; grip: number; act?: 'grab' | 'drop'; roll?: number };
  const program = (): Step[] => {
    const a = potSpots[from];
    const b = potSpots[1 - from];
    return [
      { to: toLocal(a, highY), dur: 1.5, grip: 1 },
      { to: toLocal(a, graspY), dur: 1.1, grip: 1 },
      { dur: 0.6, grip: 0, act: 'grab' },
      { to: toLocal(a, highY + 0.05), dur: 1.0, grip: 0 },
      { to: toLocal(b, highY + 0.05), dur: 1.6, grip: 0, roll: 0.5 },
      { to: toLocal(b, graspY + 0.01), dur: 1.1, grip: 0 },
      { dur: 0.6, grip: 1, act: 'drop' },
      { to: toLocal(b, highY), dur: 1.0, grip: 1 },
      { to: new THREE.Vector3(0.1, 0.55, 0.42), dur: 1.8, grip: 1, roll: -0.4 },
      { dur: 1.6, grip: 0.4 },
      { to: new THREE.Vector3(0.28, 0.45, 0.1), dur: 1.6, grip: 1 },
    ];
  };
  let steps = program();
  let stepI = 0;
  let stepT = 0;
  let cur = new THREE.Vector3(0.28, 0.45, 0.1);
  let startP = cur.clone();
  let grip = 1;
  let startGrip = 1;
  let roll = 0;
  let startRoll = 0;
  const ease = (x: number) => x * x * (3 - 2 * x);
  const leaderQ = [0, 0, 0, 0, 0, 0];
  let leaderGrip = 1;

  function updateArm(dt: number) {
    const s = steps[stepI];
    stepT += dt / s.dur;
    const k = ease(Math.min(1, stepT));
    if (s.to) {
      cur = startP.clone().lerp(s.to, k);
      const travel = Math.hypot(s.to.x - startP.x, s.to.z - startP.z);
      cur.y += Math.sin(Math.PI * k) * Math.min(0.12, travel * 0.4);
    }
    grip = startGrip + (s.grip - startGrip) * k;
    roll = startRoll + ((s.roll ?? 0) - startRoll) * k;
    const q = armIK(arm, cur, roll);
    setArm(arm, q, grip);
    // the leader arm moves first, as if a hand were guiding it
    for (let i = 0; i < 6; i++) leaderQ[i] += (q[i] - leaderQ[i]) * Math.min(1, dt * 9);
    leaderGrip += (grip - leaderGrip) * Math.min(1, dt * 9);
    setArm(leader, leaderQ, leaderGrip);
    if (stepT >= 1) {
      if (s.act === 'grab') arm.tip.attach(seedling);
      if (s.act === 'drop') placeSeedling(1 - from);
      startP = cur.clone();
      startGrip = grip;
      startRoll = roll;
      stepT = 0;
      stepI++;
      if (stepI >= steps.length) {
        stepI = 0;
        from = 1 - from;
        steps = program();
      }
    }
  }

  // ---------------------------------------------------------------- selection
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.36, 0.42, 48),
    new THREE.MeshBasicMaterial({ color: '#f2c86b', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  let selected: RobotId | null = null;
  const robotPos = (id: RobotId) => {
    if (id === 'rebot-arm') return arm.root.position.clone().add(new THREE.Vector3(-0.2, 0, 0.1));
    return (id === 'microduck' ? micro : odm).root.position.clone();
  };

  const raycaster = new THREE.Raycaster();
  const pickables = [odm.root, micro.root, arm.root, leader.root];
  const pick = (cx: number, cy: number): RobotId | null => {
    const r = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
    const hit = raycaster.intersectObjects(pickables, true)[0];
    return (hit?.object.userData.robot as RobotId) ?? null;
  };
  let down: { x: number; y: number } | null = null;
  renderer.domElement.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const id = pick(e.clientX, e.clientY);
    if (id) ui.open(id);
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    renderer.domElement.style.cursor = pick(e.clientX, e.clientY) ? 'pointer' : '';
  });

  const ui = initUI(root, {
    onSelect(id) {
      selected = id;
      ring.visible = !!id;
      requestRender();
    },
    onSteer(on) {
      if (on) {
        steer.on = true;
        steer.returning = false;
        steer.pos.copy(micro.root.position);
        steer.heading = micro.root.rotation.y;
      } else {
        steer.on = false;
        steer.returning = true;
      }
      requestRender();
    },
    setInput(x, y) {
      steer.input.set(x, y);
      requestRender();
    },
  });

  // ---------------------------------------------------------------- loop
  let last = performance.now();
  let elapsed = 0;
  const delta = () => {
    const now = performance.now();
    const d = (now - last) / 1000;
    last = now;
    elapsed += d;
    return d;
  };
  let time = 0;
  function requestRender() {
    needsRender = true;
    if (!running) requestAnimationFrame(tick);
    running = true;
  }
  controls.addEventListener('change', requestRender);

  const flyMat = world.flies.material as THREE.ShaderMaterial;
  const camFlat = new THREE.Vector3();
  function tick() {
    const dt = Math.min(delta(), 0.05);
    const animate = !reduceMotion || steer.on || steer.returning;
    if (animate) {
      time += dt;
      updateDucks(dt, time);
      if (!reduceMotion) updateArm(dt);
      flyMat.uniforms.time.value = time;
      world.sphere.rotation.y = time * 0.15;
      for (const [i, l] of world.lanterns.entries()) {
        const f = 1 + 0.08 * Math.sin(time * 7.3 + i * 2) + 0.05 * Math.sin(time * 13.1 + i);
        l.light.intensity = 2.6 * f;
        l.halo.material.opacity = 0.75 + 0.15 * f;
      }
    }
    // keep the camera's attention on what's happening
    const goal = steer.on || steer.returning ? micro.root.position.clone().setY(0.45) : selected ? home.clone().lerp(robotPos(selected).setY(0.55), 0.45) : home;
    target.lerp(goal, Math.min(1, dt * 2.5));
    controls.target.copy(target);
    controls.update();
    if (selected) {
      ring.position.copy(robotPos(selected)).setY(selected === 'rebot-arm' ? world.benchTop + 0.005 : 0.01);
      ring.scale.setScalar(selected === 'microduck' ? 0.8 : selected === 'rebot-arm' ? 1.5 : 1.1);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.3 * Math.sin(elapsed * 3);
    }
    // plant cut-outs on the bench turn to face the viewer
    camFlat.set(camera.position.x, 0, camera.position.z);
    for (const b of world.billboards) b.rotation.y = Math.atan2(camFlat.x - b.position.x, camFlat.z - b.position.z);

    renderer.render(scene, camera);
    if (!loaded) {
      loaded = true;
      loading.classList.add('is-done');
      setTimeout(() => (loading.hidden = true), 700);
    }
    needsRender = false;
    const keepGoing = !document.hidden && (animate || selected || target.distanceTo(goal) > 0.002);
    if (keepGoing || needsRender) requestAnimationFrame(tick);
    else running = false;
  }

  if (reduceMotion) {
    // a still life: everyone in a pleasant pose
    placeOnLoop(odmW);
    poseDuck(odm, 0, 0, 0.3, 0);
    microW.t = odmW.t - gap;
    placeOnLoop(microW);
    poseDuck(micro, 0, 0, -0.3, 0);
    setArm(arm, armIK(arm, cur, 0), 1);
    setArm(leader, armIK(arm, cur, 0), 1);
  }

  new ResizeObserver(frame).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      delta();
      requestRender();
    }
  });
  frame();
  requestRender();
}
