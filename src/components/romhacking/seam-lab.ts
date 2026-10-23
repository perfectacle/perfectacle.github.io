/**
 * A two-second synthetic tune for the chapter 14 seam widget, and the same seam arithmetic kr-patch-toolkit's
 * `krpatch audio loop` uses: a window score around the seam T against T + one period, loopEnd = T + period, and the last
 * fade samples before loopEnd blended into the audio just before T. Everything is deterministic, so the page can draw
 * the starting state at build time and the script redraws it on input.
 */

export const RATE = 16_000;
export const INTRO = 0.3;
export const PERIOD = 0.75;
export const LENGTH = 2.0;
/** Crossfade before loopEnd, as the toolkit's default. */
export const FADE = 0.06;
/** Half width of the score window: the toolkit uses 0.5 s on whole songs; this tune is short. */
export const WINDOW = 0.08;
/** Seam positions the widget offers, in seconds. */
export const SEAM_MIN = 0.2;
export const SEAM_MAX = 1.1;
export const SEAM_STEP = 0.005;
export const DEFAULT_SEAM = 0.77;
/** Same tolerance as the toolkit's `--seam-delta`. */
export const SEAM_DELTA = 0.003;

export type FadeShape = 'none' | 'equal-power' | 'equal-gain';
export const FADE_SHAPES: { id: FadeShape; label: string; detail: string }[] = [
  { id: 'none', label: '섞지 않음', detail: 'loopEnd에서 바로 T로 건너뜁니다' },
  { id: 'equal-power', label: 'sin·cos로 섞기', detail: '나가는 쪽 cos, 들어오는 쪽 sin (equal-power)' },
  { id: 'equal-gain', label: 'sin²으로 섞기', detail: '나가는 쪽 1 − sin², 들어오는 쪽 sin² (equal-gain)' },
];

const NOTES = [523.25, 659.25, 783.99, 659.25];
const TAU = Math.PI * 2;

/** Deterministic noise in [-1, 1) per seed, so each repetition's hi-hat and drum differ the same way every time. */
function noise(seed: number) {
  let s = (seed * 2_654_435_761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 0x1_0000_0000) * 2 - 1;
  };
}

/**
 * The tune: a short chord swell as intro, then a bar of four notes over a bass with slow vibrato, a drum on the first
 * beat and a hi-hat between beats. Notes repeat exactly every PERIOD; the vibrato does not line up with the bar, and the
 * drum and hi-hat noise changes every bar, so some seams match far better than others, as in a real recording.
 */
export function makeTune(rate = RATE): Float32Array {
  const n = Math.round(LENGTH * rate);
  const out = new Float32Array(n);
  const beat = PERIOD / 4;
  const hats = new Map<number, () => number>();
  const drums = new Map<number, () => number>();
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    let v = 0;
    if (t < INTRO + 0.02) {
      const env = Math.min(1, t / INTRO) * (t > INTRO ? 1 - (t - INTRO) / 0.02 : 1);
      v += 0.22 * env * (Math.sin(TAU * 261.63 * t) + Math.sin(TAU * 329.63 * t) + Math.sin(TAU * 392 * t));
    }
    if (t >= INTRO) {
      const u = t - INTRO;
      const bar = Math.floor(u / PERIOD);
      const local = u - bar * PERIOD;
      const k = Math.min(3, Math.floor(local / beat));
      const since = local - k * beat;
      const attack = 1 - Math.exp(-since / 0.004);
      const note = NOTES[k] ?? 440;
      v +=
        0.42 *
        attack *
        Math.exp(-since / 0.11) *
        (Math.sin(TAU * note * since) + 0.35 * Math.sin(TAU * 2 * note * since));
      v += 0.2 * Math.sin(TAU * 130.81 * u + 0.35 * Math.sin(TAU * 0.9 * u));
      if (k === 0) {
        let d = drums.get(bar);
        if (!d) drums.set(bar, (d = noise(101 + bar)));
        v += Math.exp(-since / 0.05) * (0.55 * Math.sin(TAU * 70 * since) + 0.35 * d());
      }
      const hat = since - beat / 2;
      if (k % 2 === 1 && hat >= 0) {
        const key = bar * 4 + k;
        let h = hats.get(key);
        if (!h) hats.set(key, (h = noise(7 + key)));
        v += 0.2 * Math.exp(-hat / 0.02) * h();
      }
    }
    out[i] = v;
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  for (let i = 0; i < n; i++) out[i] = ((out[i] ?? 0) / peak) * 0.8;
  return out;
}

export const toSample = (seconds: number, rate = RATE) => Math.round(seconds * rate);

/** Normalized cross-correlation of the window around t with the window around t + period (samples). */
export function seamScore(x: Float32Array, t: number, period: number, half: number): number {
  let uv = 0;
  let uu = 0;
  let vv = 0;
  for (let i = t - half; i < t + half; i++) {
    const u = x[i] ?? 0;
    const v = x[i + period] ?? 0;
    uv += u * v;
    uu += u * u;
    vv += v * v;
  }
  return uv / (Math.sqrt(uu * vv) + 1e-9);
}

export interface ScorePoint {
  seconds: number;
  score: number;
}

/** Score at every seam position the widget offers. */
export function scoreCurve(x: Float32Array, rate = RATE): ScorePoint[] {
  const period = toSample(PERIOD, rate);
  const half = toSample(WINDOW, rate);
  const out: ScorePoint[] = [];
  for (let s = SEAM_MIN; s <= SEAM_MAX + 1e-9; s += SEAM_STEP) {
    const seconds = Math.round(s * 1000) / 1000;
    out.push({ seconds, score: seamScore(x, toSample(seconds, rate), period, half) });
  }
  return out;
}

/** The toolkit's two picks: the best score, and the earliest position within SEAM_DELTA of it. */
export function picks(curve: ScorePoint[]) {
  const best = curve.reduce((a, b) => (b.score > a.score ? b : a));
  const earliest = curve.find(p => p.score >= best.score - SEAM_DELTA) ?? best;
  return { best, earliest };
}

/** Crossfade gains at step i of n: [outgoing, incoming]. */
export function fadeGains(shape: FadeShape, i: number, n: number): [number, number] {
  if (shape === 'none') return [1, 0];
  const g = Math.sin((Math.PI / 2) * (n > 1 ? i / (n - 1) : 1));
  return shape === 'equal-gain' ? [1 - g * g, g * g] : [Math.cos((Math.PI / 2) * (n > 1 ? i / (n - 1) : 1)), g];
}

/** The loop file: from 0 to loopEnd = seam + period, with the crossfade on the samples before loopEnd. */
export function renderLoop(x: Float32Array, seam: number, shape: FadeShape, rate = RATE): Float32Array {
  const end = seam + toSample(PERIOD, rate);
  const fade = toSample(FADE, rate);
  const y = x.slice(0, end);
  if (shape !== 'none') {
    for (let i = 0; i < fade; i++) {
      const [out, into] = fadeGains(shape, i, fade);
      const j = end - fade + i;
      y[j] = (x[j] ?? 0) * out + (x[seam - fade + i] ?? 0) * into;
    }
  }
  return y;
}

/** What a listener hears from `from` to `to` (file samples, may run past loopEnd): the file, then back to the seam. */
export function played(y: Float32Array, seam: number, from: number, to: number): Float32Array {
  const end = y.length;
  const out = new Float32Array(to - from);
  for (let i = from; i < to; i++) out[i - from] = i < end ? (y[i] ?? 0) : (y[seam + (i - end)] ?? 0);
  return out;
}

/** Intro once, then the loop `times` times: what the widget plays. */
export function playback(y: Float32Array, seam: number, times = 3): Float32Array {
  const loop = y.length - seam;
  const out = new Float32Array(y.length + loop * (times - 1));
  out.set(y, 0);
  for (let k = 1; k < times; k++) out.set(y.subarray(seam), y.length + loop * (k - 1));
  return out;
}

const rms = (a: Float32Array, from: number, to: number) => {
  let s = 0;
  for (let i = from; i < to; i++) s += (a[i] ?? 0) ** 2;
  return Math.sqrt(s / Math.max(1, to - from));
};

export interface SeamReport {
  seam: number;
  loopEnd: number;
  score: number;
  /** Largest gap between what plays and the uncut recording, from the fade start to 20 ms past the jump; % of peak. */
  deviation: number;
  /** Sample-to-sample change right at the jump, and the recording's own change at that place; % of peak. */
  jump: number;
  natural: number;
  /** Level in the middle third of the fade against the recording there, in dB. */
  bumpDb: number;
}

export function analyse(x: Float32Array, seamSeconds: number, shape: FadeShape, rate = RATE): SeamReport {
  const seam = toSample(seamSeconds, rate);
  const end = seam + toSample(PERIOD, rate);
  const fade = toSample(FADE, rate);
  const y = renderLoop(x, seam, shape, rate);
  const after = toSample(0.02, rate);
  const p = played(y, seam, end - fade, end + after);
  let dev = 0;
  for (let i = 0; i < p.length; i++) dev = Math.max(dev, Math.abs((p[i] ?? 0) - (x[end - fade + i] ?? 0)));
  const peak = 0.8;
  const third = Math.floor(fade / 3);
  const mid = rms(y, end - fade + third, end - third);
  const ref = rms(x, end - fade + third, end - third);
  return {
    seam,
    loopEnd: end,
    score: seamScore(x, seam, toSample(PERIOD, rate), toSample(WINDOW, rate)),
    deviation: (dev / peak) * 100,
    jump: (Math.abs((x[seam] ?? 0) - (y[end - 1] ?? 0)) / peak) * 100,
    natural: (Math.abs((x[end] ?? 0) - (x[end - 1] ?? 0)) / peak) * 100,
    bumpDb: 20 * Math.log10((mid + 1e-9) / (ref + 1e-9)),
  };
}

/** SVG path through samples a[from..to), scaled into the box (x0, y0, w, h) with the vertical centre at y0 + h/2. */
export function wavePath(
  a: Float32Array,
  from: number,
  to: number,
  box: [number, number, number, number],
  gain = 1,
): string {
  const [x0, y0, w, h] = box;
  const n = to - from;
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const px = x0 + (w * i) / Math.max(1, n - 1);
    const py = y0 + h / 2 - (a[from + i] ?? 0) * gain * (h / 2);
    parts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return parts.join('');
}

/** Vertical gain that makes the larger of two short stretches fill 90% of a box. */
export function zoomGain(a: Float32Array, b: Float32Array): number {
  let peak = 1e-6;
  for (const v of a) peak = Math.max(peak, Math.abs(v));
  for (const v of b) peak = Math.max(peak, Math.abs(v));
  return 0.9 / peak;
}

/** Score curve as an SVG path in the box; scores below `floor` sit on the bottom edge. */
export function curvePath(curve: ScorePoint[], box: [number, number, number, number], floor = 0): string {
  const [x0, y0, w, h] = box;
  return curve
    .map((p, i) => {
      const px = x0 + (w * (p.seconds - SEAM_MIN)) / (SEAM_MAX - SEAM_MIN);
      const py = y0 + h - (h * (Math.max(floor, p.score) - floor)) / (1 - floor);
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join('');
}

export const seamX = (seconds: number, x0: number, w: number) =>
  x0 + (w * (seconds - SEAM_MIN)) / (SEAM_MAX - SEAM_MIN);

export const fmtSeconds = (s: number) => `${s.toFixed(3)}초`;
export const fmtPercent = (v: number) => `${v.toFixed(1)}%`;
export const fmtDb = (v: number) => {
  const r = Math.round(v * 10) / 10;
  return r === 0 ? '0.0 dB' : `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(1)} dB`;
};
