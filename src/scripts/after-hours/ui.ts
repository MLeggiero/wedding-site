// The robot room's HTML layer: the robot picker, each robot's gift card
// ("I'm getting this" claims and chip-in links) and the steering controls.
export type RobotId = 'microduck' | 'open-duck-mini' | 'rebot-arm';

interface Hooks {
  onSelect?: (id: RobotId | null) => void;
  onSteer?: (on: boolean) => void;
  setInput?: (x: number, y: number) => void;
}

export function initUI(root: HTMLElement, hooks: Hooks) {
  const cards = [...root.querySelectorAll<HTMLElement>('.ah-card')];
  const pickers = [...root.querySelectorAll<HTMLButtonElement>('[data-pick]')];
  const steerBox = root.querySelector<HTMLElement>('.ah__steer')!;
  const endpoint = root.dataset.endpoint ?? '';
  let lastTrigger: HTMLElement | null = null;
  let current: RobotId | null = null;
  const listMode = root.classList.contains('ah--list');
  if (listMode) for (const c of cards) c.hidden = false;

  function open(id: RobotId, trigger?: HTMLElement) {
    if (listMode) return;
    lastTrigger = trigger ?? null;
    current = id;
    for (const c of cards) c.hidden = c.dataset.robot !== id;
    for (const p of pickers) p.setAttribute('aria-pressed', String(p.dataset.pick === id));
    root.classList.add('has-card');
    cards.find((c) => c.dataset.robot === id)?.querySelector<HTMLElement>('h2')?.focus();
    hooks.onSelect?.(id);
  }
  function close() {
    if (!current) return;
    current = null;
    for (const c of cards) c.hidden = true;
    for (const p of pickers) p.setAttribute('aria-pressed', 'false');
    root.classList.remove('has-card');
    hooks.onSelect?.(null);
    lastTrigger?.focus();
  }

  for (const p of pickers) p.addEventListener('click', () => (current === p.dataset.pick ? close() : open(p.dataset.pick as RobotId, p)));
  for (const c of cards) c.querySelector('.ah-card__close')?.addEventListener('click', close);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') steering ? stopSteer() : close();
  });

  // ------------------------------------------------------------ chip in
  for (const box of root.querySelectorAll<HTMLElement>('.ah-chip')) {
    const venmo = box.querySelector<HTMLAnchorElement>('[data-venmo]');
    const paypal = box.querySelector<HTMLAnchorElement>('[data-paypal]');
    const note = box.dataset.note ?? 'Robot fund';
    const set = (amount: number) => {
      for (const b of box.querySelectorAll<HTMLButtonElement>('[data-amount]')) b.setAttribute('aria-pressed', String(Number(b.dataset.amount) === amount));
      if (venmo) venmo.href = `https://venmo.com/${venmo.dataset.venmo}?txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`;
      if (paypal) paypal.href = `https://paypal.me/${paypal.dataset.paypal}/${amount}USD`;
    };
    for (const b of box.querySelectorAll<HTMLButtonElement>('[data-amount]')) b.addEventListener('click', () => set(Number(b.dataset.amount)));
    const first = box.querySelector<HTMLButtonElement>('[data-amount]');
    if (first) set(Number(first.dataset.amount));
  }

  // ------------------------------------------------------------ claims
  const markClaimed = (id: string) => {
    for (const row of root.querySelectorAll<HTMLElement>(`[data-item="${CSS.escape(id)}"]`)) {
      row.classList.add('is-claimed');
      const btn = row.querySelector<HTMLButtonElement>('.ah-claim');
      if (btn) btn.hidden = true;
      const tag = row.querySelector<HTMLElement>('.ah-claimed');
      if (tag) tag.hidden = false;
    }
  };
  if (endpoint) {
    fetch(`${endpoint}?claims=1`)
      .then((r) => r.json())
      .then((d: { claimed?: string[] }) => d.claimed?.forEach(markClaimed))
      .catch(() => {});
    for (const btn of root.querySelectorAll<HTMLButtonElement>('.ah-claim')) {
      btn.hidden = false;
      btn.addEventListener('click', () => {
        const row = btn.closest<HTMLElement>('[data-item]')!;
        const form = row.querySelector<HTMLFormElement>('.ah-claim-form')!;
        btn.hidden = true;
        form.hidden = false;
        form.querySelector('input')?.focus();
      });
    }
    for (const form of root.querySelectorAll<HTMLFormElement>('.ah-claim-form')) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const row = form.closest<HTMLElement>('[data-item]')!;
        const status = form.querySelector<HTMLElement>('.ah-claim-status')!;
        const button = form.querySelector('button')!;
        button.disabled = true;
        status.textContent = 'Saving…';
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'claim',
              item: row.dataset.item,
              label: row.dataset.label,
              robot: row.closest<HTMLElement>('.ah-card')?.dataset.name,
              name: new FormData(form).get('name'),
              hp: new FormData(form).get('website'),
            }),
          });
          const data = await res.json().catch(() => ({ ok: res.ok }));
          if (!data.ok) throw new Error(data.error || 'Something went wrong.');
          form.hidden = true;
          markClaimed(row.dataset.item!);
        } catch (err) {
          status.textContent = (err as Error).message;
          button.disabled = false;
        }
      });
    }
  }

  // ------------------------------------------------------------ steering
  let steering = false;
  const keys = new Set<string>();
  const pad = steerBox.querySelector<HTMLElement>('.ah-pad');
  const knob = steerBox.querySelector<HTMLElement>('.ah-pad__knob');
  let padVec = { x: 0, y: 0 };
  const push = () => {
    const kx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const ky = (keys.has('up') ? 1 : 0) - (keys.has('down') ? 1 : 0);
    hooks.setInput?.(THREE_clamp(kx + padVec.x), THREE_clamp(ky + padVec.y));
  };
  const keyMap: Record<string, string> = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  };
  addEventListener('keydown', (e) => {
    if (!steering || !keyMap[e.code]) return;
    e.preventDefault();
    keys.add(keyMap[e.code]);
    push();
  });
  addEventListener('keyup', (e) => {
    if (!keyMap[e.code]) return;
    keys.delete(keyMap[e.code]);
    push();
  });
  if (pad && knob) {
    let active: number | null = null;
    const move = (e: PointerEvent) => {
      const r = pad.getBoundingClientRect();
      const R = r.width / 2;
      let x = (e.clientX - (r.left + R)) / R;
      let y = (e.clientY - (r.top + R)) / R;
      const len = Math.hypot(x, y);
      if (len > 1) {
        x /= len;
        y /= len;
      }
      knob.style.transform = `translate(${x * R * 0.55}px, ${y * R * 0.55}px)`;
      padVec = { x, y: -y };
      push();
    };
    pad.addEventListener('pointerdown', (e) => {
      active = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      move(e);
    });
    pad.addEventListener('pointermove', (e) => e.pointerId === active && move(e));
    const end = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      active = null;
      knob.style.transform = '';
      padVec = { x: 0, y: 0 };
      push();
    };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
  }
  function startSteer() {
    steering = true;
    close();
    root.classList.add('is-steering');
    steerBox.hidden = false;
    steerBox.querySelector<HTMLElement>('.ah__steer-done')?.focus();
    hooks.onSteer?.(true);
  }
  function stopSteer() {
    steering = false;
    keys.clear();
    padVec = { x: 0, y: 0 };
    push();
    root.classList.remove('is-steering');
    steerBox.hidden = true;
    hooks.onSteer?.(false);
    root.querySelector<HTMLElement>('[data-pick="microduck"]')?.focus();
  }
  for (const b of root.querySelectorAll('[data-steer]')) b.addEventListener('click', startSteer);
  steerBox.querySelector('.ah__steer-done')?.addEventListener('click', stopSteer);

  return { open, close };
}

const THREE_clamp = (v: number) => Math.max(-1, Math.min(1, v));
