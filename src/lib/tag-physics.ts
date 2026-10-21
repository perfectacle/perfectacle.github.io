/** One tag bubble. Verlet integration: velocity is the distance from the previous position. */
export interface Body {
  x: number;
  y: number;
  px: number;
  py: number;
  /** Current radius; eases toward `targetR` so growing bubbles shove their neighbours instead of popping over them. */
  r: number;
  targetR: number;
  /** Held under the pointer: moves only where the pointer puts it and never yields in a collision. */
  pinned: boolean;
  /** Where this bubble is drawn to instead of floating up, and how hard. Search hits use it to gather in view. */
  anchor: { x: number; y: number; pull: number } | null;
}

export interface World {
  width: number;
  /**
   * Upward pull per frame for a bubble of radius `LIFT_RADIUS`; it grows with size, as buoyancy does. Bubbles rise
   * like air in water, so the pile always fills from the top and the busiest tags work their way up to it.
   */
  lift: number;
  /** Fraction of velocity kept each frame. */
  friction: number;
}

export const DEFAULT_WORLD = { lift: 0.2, friction: 0.88 } as const;

const ITERATIONS = 3;
const LIFT_RADIUS = 32;

export function makeBody(x: number, y: number, r: number): Body {
  return { x, y, px: x, py: y, r, targetR: r, pinned: false, anchor: null };
}

/**
 * Advances one frame and returns the largest distance any free bubble moved, so the caller can stop animating once
 * the pile is at rest. Overlaps are split by area: a big bubble barely moves when a small one hits it. Only the top
 * and side walls exist; the pile's bottom is wherever it ends.
 */
export function step(bodies: Body[], world: World): number {
  for (const b of bodies) {
    b.r += (b.targetR - b.r) * 0.18;
    if (b.pinned) continue;
    let ax = 0;
    let ay = (-world.lift * b.r) / LIFT_RADIUS;
    if (b.anchor) {
      ax = (b.anchor.x - b.x) * b.anchor.pull;
      ay = (b.anchor.y - b.y) * b.anchor.pull;
    }
    const vx = (b.x - b.px) * world.friction + ax;
    const vy = (b.y - b.py) * world.friction + ay;
    b.px = b.x;
    b.py = b.y;
    b.x += vx;
    b.y += vy;
  }
  for (let k = 0; k < ITERATIONS; k++) {
    for (const [i, a] of bodies.entries()) {
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (!b) continue;
        const min = a.r + b.r;
        const dx = b.x - a.x;
        if (dx > min || dx < -min) continue;
        const dy = b.y - a.y;
        if (dy > min || dy < -min) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) continue;
        if (a.pinned && b.pinned) continue;
        const d = Math.sqrt(d2);
        const overlap = min - d;
        // Exactly coincident centres have no direction; split them along a fixed axis instead.
        const nx = d2 === 0 ? 1 : dx / d;
        const ny = d2 === 0 ? 0 : dy / d;
        const ma = a.r * a.r;
        const mb = b.r * b.r;
        const shareA = a.pinned ? 0 : b.pinned ? 1 : mb / (ma + mb);
        const shareB = 1 - shareA;
        a.x -= nx * overlap * shareA;
        a.y -= ny * overlap * shareA;
        b.x += nx * overlap * shareB;
        b.y += ny * overlap * shareB;
      }
    }
    for (const b of bodies) {
      if (b.pinned) continue;
      // A wall stops motion into it; without resetting the previous position the correction would become velocity.
      const x = Math.min(Math.max(b.x, b.r), world.width - b.r);
      if (x !== b.x) b.x = b.px = x;
      if (b.y < b.r) b.y = b.py = b.r;
    }
  }
  let moved = 0;
  for (const b of bodies) {
    if (!b.pinned) moved = Math.max(moved, Math.abs(b.x - b.px), Math.abs(b.y - b.py));
  }
  return moved;
}

/** Pushes every free bubble within `radius` of a point straight away from it, strongest at the centre. */
export function shockwave(bodies: Body[], x: number, y: number, radius: number, strength: number): void {
  for (const b of bodies) {
    if (b.pinned) continue;
    const dx = b.x - x;
    const dy = b.y - y;
    const d = Math.hypot(dx, dy);
    if (d >= radius || d === 0) continue;
    const f = strength * (1 - d / radius);
    // Moving the previous position backwards is how Verlet gives a body velocity.
    b.px -= (dx / d) * f;
    b.py -= (dy / d) * f;
  }
}

/**
 * Starting spots: rows filled left to right in list order, each row centred. The list comes in largest first, so the
 * busiest tags start (and, being on top already, stay) at the top, and keyboard order follows reading order.
 */
export function shelfLayout(radii: number[], width: number, gap: number): { x: number; y: number; r: number }[] {
  const points: { x: number; y: number; r: number }[] = [];
  let row: number[] = [];
  let rowWidth = 0;
  let top = gap;
  const flush = () => {
    if (!row.length) return;
    const tallest = Math.max(...row);
    let x = (width - rowWidth) / 2;
    for (const r of row) {
      points.push({ x: x + gap + r, y: top + tallest, r });
      x += gap + r * 2;
    }
    top += tallest * 2 + gap;
    row = [];
    rowWidth = 0;
  };
  for (const r of radii) {
    const need = gap + r * 2;
    if (row.length && rowWidth + need + gap > width) flush();
    row.push(r);
    rowWidth += need;
  }
  flush();
  return points;
}
