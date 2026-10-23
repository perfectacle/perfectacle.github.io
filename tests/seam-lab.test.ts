import { expect, test } from 'vitest';
import {
  DEFAULT_SEAM,
  FADE,
  INTRO,
  PERIOD,
  RATE,
  SEAM_DELTA,
  analyse,
  fadeGains,
  makeTune,
  picks,
  playback,
  played,
  renderLoop,
  scoreCurve,
  seamScore,
  toSample,
} from '../src/components/romhacking/seam-lab.ts';

const x = makeTune();

test('the tune is deterministic and peaks at 0.8', () => {
  expect(x.length).toBe(2 * RATE);
  expect(makeTune()).toEqual(x);
  expect(Math.max(...x.map(Math.abs))).toBeCloseTo(0.8, 6);
});

test('the seam score is 1 for an exact repeat and low across the intro', () => {
  const p = toSample(PERIOD);
  const pure = new Float32Array(3 * p).map((_, i) => Math.sin((2 * Math.PI * 7 * (i % p)) / p));
  expect(seamScore(pure, p, p, 200)).toBeCloseTo(1, 6);
  const curve = scoreCurve(x);
  const intro = curve.filter(c => c.seconds < INTRO - 0.05);
  expect(Math.max(...intro.map(c => c.score))).toBeLessThan(0.7);
});

test('the earliest pick scores within the delta of the best and comes no later', () => {
  const { best, earliest } = picks(scoreCurve(x));
  expect(best.score).toBeGreaterThan(0.99);
  expect(earliest.score).toBeGreaterThanOrEqual(best.score - SEAM_DELTA);
  expect(earliest.seconds).toBeLessThanOrEqual(best.seconds);
  expect(earliest.seconds).toBeGreaterThan(INTRO);
});

test('fade gains: equal-gain sums to 1, equal-power sums of squares to 1', () => {
  for (let i = 0; i < 10; i++) {
    const [o, n] = fadeGains('equal-gain', i, 10);
    expect(o + n).toBeCloseTo(1, 12);
    const [po, pn] = fadeGains('equal-power', i, 10);
    expect(po * po + pn * pn).toBeCloseTo(1, 12);
  }
  expect(fadeGains('none', 3, 10)).toEqual([1, 0]);
  expect(fadeGains('equal-gain', 9, 10)[1]).toBeCloseTo(1, 12);
});

test('the loop file ends at seam + period and its last sample hands over to the seam', () => {
  const seam = toSample(0.5);
  const y = renderLoop(x, seam, 'equal-gain');
  expect(y.length).toBe(seam + toSample(PERIOD));
  expect(y[y.length - 1]).toBeCloseTo(x[seam - 1] ?? 0, 6);
  expect(played(y, seam, y.length - 1, y.length + 2)).toEqual(
    new Float32Array([y[y.length - 1] ?? 0, x[seam] ?? 0, x[seam + 1] ?? 0]),
  );
  const out = playback(y, seam, 3);
  expect(out.length).toBe(y.length + 2 * (y.length - seam));
  expect(out[y.length]).toBe(x[seam]);
});

test('equal-power swells about 3 dB on a good seam, equal-gain does not', () => {
  const { earliest } = picks(scoreCurve(x));
  const power = analyse(x, earliest.seconds, 'equal-power');
  const gain = analyse(x, earliest.seconds, 'equal-gain');
  expect(power.bumpDb).toBeGreaterThan(2.5);
  expect(power.bumpDb).toBeLessThan(3.1);
  expect(Math.abs(gain.bumpDb)).toBeLessThan(0.3);
  expect(gain.deviation).toBeLessThan(power.deviation);
});

test('at the starting seam an unblended jump is far larger than the recording’s own step', () => {
  const none = analyse(x, DEFAULT_SEAM, 'none');
  const gain = analyse(x, DEFAULT_SEAM, 'equal-gain');
  expect(none.jump).toBeGreaterThan(none.natural * 3 + 1);
  expect(gain.jump).toBeLessThan(none.jump);
  expect(toSample(FADE)).toBe(960);
});
