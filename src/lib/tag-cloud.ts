import { DEFAULT_WORLD, makeBody, shelfLayout, shockwave, step, type Body, type World } from './tag-physics.ts';

const HOVER_GROW = 1.18;
const HIT_GROW = 1.12;
const MISS_SHRINK = 0.55;
/** Pointer travel that turns a press into a drag; below it the press is still a click. */
const DRAG_SLOP = 5;
const LONG_PRESS_MS = 260;
const ENTRANCE_STAGGER_MS = 6;
const NAVIGATE_DELAY_MS = 220;
const MIN_FONT_PX = 12;
const GAP = 4;
const PAD = 12;

interface Tag {
  li: HTMLLIElement;
  link: HTMLAnchorElement;
  label: HTMLElement;
  sup: HTMLElement;
  name: string;
  count: number;
  /** Position in the list, which is largest first; the entrance animation staggers by it. */
  order: number;
  /** Smallest radius for this post count, before the label is fitted in. */
  minR: number;
  /** Resting radius; the element is laid out at this size and scaled to the body's current radius. */
  base: number;
  hover: boolean;
  match: boolean;
  body: Body;
}

/**
 * Turns the tag list into bubbles that push each other around: a tag's size follows its post count, bubbles can be
 * dragged and thrown, and a search box pulls matching tags into view. The list and its links stay the same elements,
 * so keyboard, screen readers and no-JS visitors still get the plain list.
 */
export function mountTagCloud(list: HTMLElement, filter: HTMLInputElement, status: HTMLElement): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tags: Tag[] = [];
  for (const li of list.querySelectorAll<HTMLLIElement>(':scope > li')) {
    const link = li.querySelector('a');
    const label = li.querySelector<HTMLElement>('.name');
    const sup = li.querySelector('sup');
    if (!link || !label || !sup) continue;
    tags.push({
      li,
      link,
      label,
      sup,
      name: (li.dataset.name ?? '').toLowerCase(),
      count: Number(li.dataset.count),
      order: tags.length,
      minR: 0,
      base: 0,
      hover: false,
      match: true,
      body: makeBody(0, 0, 0),
    });
  }
  const bodies = tags.map(t => t.body);
  const world: World = { width: 0, ...DEFAULT_WORLD };
  let height = 0;
  let query = '';
  let started = 0;
  // Pointer state is read by the animation loop, so it must exist before the first frame is scheduled.
  let grab: { tag: Tag; id: number; dx: number; dy: number } | null = null;
  let press: { id: number; x: number; y: number; tag: Tag | undefined; touch: boolean; timer: number } | null = null;
  let suppressClick = false;

  list.classList.add('is-live');

  function measure(): void {
    const width = list.clientWidth;
    const scale = Math.min(Math.max(width / 900, 0.78), 1.1);
    // Sizes spread over the blog's own range, so the busiest tag is always about three times the quietest.
    const most = Math.max(...tags.map(t => t.count));
    for (const t of tags) {
      const weight = most > 1 ? Math.sqrt((t.count - 1) / (most - 1)) : 0;
      t.minR = (22 + 46 * weight) * scale;
      t.li.classList.remove('wrap');
      t.li.style.setProperty('--fs', `${Math.max((12.5 + 15 * weight) * scale, MIN_FONT_PX)}px`);
      t.li.style.setProperty('--wrap', `${t.minR * 1.5}px`);
    }
    // Batch reads after writes so the whole pass costs two layouts, not one per tag.
    const wide = tags.filter(t => t.label.scrollWidth > t.minR * 1.5 && t.name.includes(' '));
    for (const t of wide) t.li.classList.add('wrap');
    // scrollWidth, not offsetWidth: a wrapped label is capped at its max-width, and a word longer than that spills out.
    const boxes = tags.map(t => ({ w: t.label.scrollWidth, h: t.label.offsetHeight, sup: t.sup.offsetHeight }));
    for (const [i, t] of tags.entries()) {
      const box = boxes[i];
      if (!box) continue;
      const avail = t.minR * 1.5;
      const fs = parseFloat(t.li.style.getPropertyValue('--fs'));
      // A single long word that still overflows gets a smaller font before it gets a bigger bubble.
      const fit = box.w > avail ? Math.max(avail / box.w, MIN_FONT_PX / fs) : 1;
      if (fit < 1) t.li.style.setProperty('--fs', `${fs * fit}px`);
      t.base = Math.max(t.minR, Math.hypot(box.w * fit, box.h * fit + box.sup) / 2 + 6);
      t.li.style.setProperty('--d', `${t.base * 2}px`);
    }
    world.width = width;
  }

  function goal(t: Tag): number {
    const grow = t.hover ? HOVER_GROW : 1;
    if (!query) return t.base * grow;
    return t.base * grow * (t.match ? HIT_GROW : MISS_SHRINK);
  }

  /** Fits the box to the pile, counting bubbles still growing at their full size so it does not jump about. */
  function fitHeight(): void {
    const bottom = tags.reduce((max, t) => Math.max(max, t.body.y + Math.max(t.body.r, goal(t))), 0);
    const next = Math.ceil(bottom + PAD);
    if (Math.abs(next - height) < 2) return;
    height = next;
    list.style.height = `${height}px`;
  }

  function render(): void {
    for (const { li, base, body } of tags) {
      const s = body.r / base;
      li.style.transform = `translate3d(${(body.x - base).toFixed(1)}px,${(body.y - base).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    }
  }

  let frame = 0;
  let quiet = 0;
  function tick(now: number): void {
    frame = 0;
    for (const t of tags) {
      const b = t.body;
      b.targetR = now - started > t.order * ENTRANCE_STAGGER_MS ? goal(t) : 0;
      // A held bubble's throw speed is its last moves'; holding still lets it drain away.
      if (b.pinned) {
        b.px += (b.x - b.px) * 0.35;
        b.py += (b.y - b.py) * 0.35;
      }
    }
    const moved = step(bodies, world);
    render();
    fitHeight();
    const resizing = bodies.some(b => Math.abs(b.targetR - b.r) > 0.05);
    quiet = moved < 0.03 && !resizing ? quiet + 1 : 0;
    if (quiet < 30 || grab) frame = requestAnimationFrame(tick);
  }
  function wake(): void {
    if (reduced && !grab) return settle();
    quiet = 0;
    if (!frame) frame = requestAnimationFrame(tick);
  }
  /** Reduced motion: jump straight to where the pile comes to rest instead of animating there. */
  function settle(): void {
    for (const t of tags) t.body.r = t.body.targetR = goal(t);
    for (let i = 0; i < 150 && step(bodies, world) > 0.03; i++);
    fitHeight();
    render();
  }

  measure();
  const start = shelfLayout(
    tags.map(t => t.base),
    world.width,
    GAP,
  );
  for (const [i, t] of tags.entries()) {
    const p = start[i] ?? { x: world.width / 2, y: 0 };
    t.body.x = t.body.px = p.x;
    t.body.y = t.body.py = p.y;
    t.body.targetR = t.base;
  }
  fitHeight();
  render();
  started = performance.now();
  wake();

  let lastWidth = world.width;
  new ResizeObserver(() => {
    if (Math.abs(list.clientWidth - lastWidth) < 1) return;
    const sx = list.clientWidth / lastWidth;
    measure();
    // Narrower boxes need a taller pile; stretching the old one vertically gets the bubbles close to it.
    for (const b of bodies) {
      b.x *= sx;
      b.px *= sx;
      b.y /= sx;
      b.py /= sx;
    }
    lastWidth = world.width;
    updateAnchors();
    wake();
  }).observe(list);

  // Pointer: drag-and-throw a bubble, or tap empty space for a shockwave.

  const local = (e: PointerEvent) => {
    const rect = list.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const tagAt = (target: EventTarget | null) => {
    const li = target instanceof Element ? target.closest('li') : null;
    return li ? tags.find(t => t.li === li) : undefined;
  };

  function startGrab(tag: Tag, id: number, x: number, y: number): void {
    const b = tag.body;
    b.pinned = true;
    grab = { tag, id, dx: b.x - x, dy: b.y - y };
    tag.li.classList.add('held');
    list.classList.add('grabbing');
    list.setPointerCapture(id);
    wake();
  }

  list.addEventListener('pointerdown', e => {
    // A drag that ended off a link never produced the click it was meant to cancel.
    suppressClick = false;
    if (e.button !== 0 || grab || press) return;
    const { x, y } = local(e);
    const tag = tagAt(e.target);
    const current = { id: e.pointerId, x, y, tag, touch: e.pointerType === 'touch', timer: 0 };
    press = current;
    if (current.touch && tag) {
      current.timer = window.setTimeout(() => {
        if (press !== current) return;
        navigator.vibrate?.(8);
        startGrab(tag, current.id, current.x, current.y);
      }, LONG_PRESS_MS);
    }
  });

  list.addEventListener('pointermove', e => {
    const { x, y } = local(e);
    if (e.pointerType === 'mouse') {
      list.style.setProperty('--mx', `${x}px`);
      list.style.setProperty('--my', `${y}px`);
    }
    if (press && e.pointerId === press.id && !grab) {
      const far = Math.hypot(x - press.x, y - press.y) > DRAG_SLOP;
      if (far && press.touch) {
        // The finger moved before the long press fired: this is a scroll, not a grab.
        clearTimeout(press.timer);
        press = null;
      } else if (far && press.tag) {
        startGrab(press.tag, press.id, press.x, press.y);
      } else if (far) {
        press = null;
      }
    }
    if (grab && e.pointerId === grab.id) {
      const b = grab.tag.body;
      b.px = b.x;
      b.py = b.y;
      b.x = Math.min(Math.max(x + grab.dx, b.r), world.width - b.r);
      b.y = Math.min(Math.max(y + grab.dy, b.r), height - b.r);
      wake();
    }
  });

  function release(e: PointerEvent, cancelled: boolean): void {
    if (press && e.pointerId === press.id) {
      clearTimeout(press.timer);
      if (!grab && !cancelled && !press.tag) {
        const { x, y } = local(e);
        burst(x, y);
      }
      press = null;
    }
    if (grab && e.pointerId === grab.id) {
      const b = grab.tag.body;
      b.pinned = false;
      const speed = Math.hypot(b.x - b.px, b.y - b.py);
      const cap = 40;
      if (speed > cap) {
        b.px = b.x - ((b.x - b.px) * cap) / speed;
        b.py = b.y - ((b.y - b.py) * cap) / speed;
      }
      grab.tag.li.classList.remove('held');
      list.classList.remove('grabbing');
      grab = null;
      suppressClick = !cancelled;
      wake();
    }
  }
  list.addEventListener('pointerup', e => release(e, false));
  list.addEventListener('pointercancel', e => release(e, true));

  // Once a long press has grabbed a bubble the page must not scroll under the finger.
  list.addEventListener(
    'touchmove',
    e => {
      if (grab) e.preventDefault();
    },
    { passive: false },
  );
  // Firefox ignores -webkit-user-drag; a native link drag would cancel the pointer and drop the bubble.
  list.addEventListener('dragstart', e => e.preventDefault());
  list.addEventListener('contextmenu', e => {
    if (grab || press?.touch) e.preventDefault();
  });

  function burst(x: number, y: number): void {
    shockwave(bodies, x, y, 220, reduced ? 0 : 14);
    if (!reduced) {
      const ring = document.createElement('span');
      ring.className = 'tag-ripple';
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      ring.addEventListener('animationend', () => ring.remove());
      list.append(ring);
    }
    wake();
  }

  list.addEventListener(
    'click',
    e => {
      const tag = tagAt(e.target);
      if (!tag) return;
      if (suppressClick) {
        suppressClick = false;
        e.preventDefault();
        return;
      }
      // Modified clicks open a new tab or window; let the browser do that untouched.
      if (reduced || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      tag.li.classList.add('pop');
      burst(tag.body.x, tag.body.y);
      setTimeout(() => location.assign(tag.link.href), NAVIGATE_DELAY_MS);
    },
    true,
  );

  // Back from a tag page restores this page from the bfcache with the popped bubble still faded out.
  addEventListener('pageshow', e => {
    if (e.persisted) for (const t of tags) t.li.classList.remove('pop');
  });

  const hover = (tag: Tag | undefined, on: boolean) => {
    if (!tag) return;
    tag.hover = on;
    wake();
  };
  list.addEventListener('pointerover', e => {
    if (e.pointerType === 'mouse') hover(tagAt(e.target), true);
  });
  list.addEventListener('pointerout', e => {
    if (e.pointerType === 'mouse') hover(tagAt(e.target), false);
  });
  list.addEventListener('focusin', e => hover(tagAt(e.target), true));
  list.addEventListener('focusout', e => hover(tagAt(e.target), false));

  // Search: hits swell and gather just below the search box; the rest shrink out of the way.
  function updateAnchors(): void {
    const y = Math.min(height / 2, 160);
    for (const t of tags) t.body.anchor = query && t.match ? { x: world.width / 2, y, pull: 0.012 } : null;
  }
  filter.addEventListener('input', () => {
    query = filter.value.trim().toLowerCase();
    let hits = 0;
    for (const t of tags) {
      t.match = !query || t.name.includes(query);
      t.li.classList.toggle('miss', !t.match);
      if (query && t.match) hits++;
    }
    list.classList.toggle('searching', !!query);
    status.textContent = query ? (hits ? `태그 ${hits}개 찾음` : '찾는 태그가 없습니다') : '';
    updateAnchors();
    wake();
  });
  filter.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const hit = query && tags.find(t => t.match);
      if (hit) location.assign(hit.link.href);
    } else if (e.key === 'Escape' && filter.value) {
      filter.value = '';
      filter.dispatchEvent(new Event('input'));
    }
  });
}
