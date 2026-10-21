import { describe, expect, it } from 'vitest';
import { DEFAULT_WORLD, makeBody, shelfLayout, shockwave, step, type World } from '../src/lib/tag-physics.ts';

const world: World = { width: 400, ...DEFAULT_WORLD };
const still: World = { ...world, lift: 0 };
const settle = (bodies: ReturnType<typeof makeBody>[], frames = 300, w = world) => {
  for (let i = 0; i < frames; i++) step(bodies, w);
};

describe('step', () => {
  it('pushes overlapping bubbles apart', () => {
    const a = makeBody(190, 200, 30);
    const b = makeBody(210, 200, 30);
    settle([a, b]);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(59.5);
  });

  it('moves the small bubble more than the big one', () => {
    const big = makeBody(200, 200, 60);
    const small = makeBody(230, 200, 15);
    step([big, small], still);
    expect(Math.abs(small.x - 230)).toBeGreaterThan(Math.abs(big.x - 200) * 10);
  });

  it('never moves a pinned bubble', () => {
    const held = makeBody(200, 200, 40);
    held.pinned = true;
    const other = makeBody(210, 200, 40);
    settle([held, other], 300, still);
    expect([held.x, held.y]).toEqual([200, 200]);
    expect(other.x - held.x).toBeGreaterThanOrEqual(79.5);
  });

  it('floats bubbles up to the top wall and keeps them off the sides', () => {
    const b = makeBody(10, 390, 30);
    settle([b]);
    expect(b.x).toBe(30);
    expect(b.y).toBeCloseTo(30, 1);
  });

  it('lets a big bubble push up through a row of small ones to the top', () => {
    const big = makeBody(200, 300, 50);
    const small = Array.from({ length: 8 }, (_, i) => makeBody(40 + i * 45, 20, 20));
    settle([big, ...small], 1500);
    expect(big.y).toBeLessThan(51);
  });

  it('separates bubbles that start on the same spot', () => {
    const a = makeBody(200, 200, 20);
    const b = makeBody(200, 200, 20);
    settle([a, b]);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(39.5);
  });

  it('comes to rest', () => {
    const radii = Array.from({ length: 40 }, (_, i) => 12 + (i % 5) * 4);
    const bodies = shelfLayout(radii, 400, 4).map(p => makeBody(p.x, p.y, p.r));
    settle(bodies, 800);
    expect(step(bodies, world)).toBeLessThan(0.05);
  });

  it('draws an anchored bubble toward its anchor instead of floating up', () => {
    const b = makeBody(100, 50, 10);
    b.anchor = { x: 200, y: 300, pull: 0.02 };
    settle([b]);
    expect(b.x).toBeCloseTo(200, 0);
    expect(b.y).toBeCloseTo(300, 0);
  });

  it('eases the radius toward its target', () => {
    const b = makeBody(200, 200, 10);
    b.targetR = 20;
    step([b], world);
    expect(b.r).toBeGreaterThan(10);
    expect(b.r).toBeLessThan(20);
  });
});

describe('shockwave', () => {
  it('pushes nearby bubbles away and leaves far ones alone', () => {
    const near = makeBody(220, 200, 10);
    const far = makeBody(390, 200, 10);
    shockwave([near, far], 200, 200, 100, 10);
    step([near, far], still);
    expect(near.x).toBeGreaterThan(220);
    expect(far.x).toBe(390);
  });
});

describe('shelfLayout', () => {
  it('fills rows in order without overlap and inside the width', () => {
    const radii = [50, 40, 40, 30, 30, 20, 20, 20, 10, 10];
    const points = shelfLayout(radii, 300, 4);
    expect(points.map(p => p.r)).toEqual(radii);
    for (const [i, p] of points.entries()) {
      expect(p.x - p.r).toBeGreaterThanOrEqual(0);
      expect(p.x + p.r).toBeLessThanOrEqual(300);
      for (const q of points.slice(0, i)) expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(p.r + q.r);
    }
    expect(points[0]?.y).toBeLessThan(points.at(-1)?.y ?? 0);
  });

  it('puts a bubble wider than the box on a row of its own', () => {
    const [wide, small] = shelfLayout([200, 10], 300, 4);
    expect(small?.y).toBeGreaterThan(wide?.y ?? Infinity);
  });
});
