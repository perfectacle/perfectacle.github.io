import { expect, test } from 'vitest';
import { SAMPLE, TICKS_PER_BEAT, decode, noteName, seconds } from '../src/components/romhacking/sseq.ts';

// Expected commands were read from sound_data.sdat sequence 37 with the GBATEK SSEQ table.
test('track 0 opens eight more tracks, sets tempo and instrument, then plays', () => {
  const c = decode(SAMPLE.bytes);
  expect(c[0]?.text).toBe('쓰는 트랙 표시 0x01FF');
  expect(c.filter(x => x.bytes[0] === 0x93)).toHaveLength(8);
  expect(c[1]?.text).toBe('트랙 1 열기: 데이터 +0x1D3부터');
  expect(c.find(x => x.bytes[0] === 0xe1)?.text).toContain('템포 70');
  const first = c.find(x => x.kind === 'note');
  expect(first?.at).toBe(56);
  expect(first?.note).toEqual({ key: 60, velocity: 100, duration: 767 });
});

test('notes take no time; rests move the tick on', () => {
  const c = decode(SAMPLE.bytes);
  const notes = c.filter(x => x.kind === 'note');
  expect(notes.slice(0, 2).map(n => n.tick)).toEqual([0, 0]);
  expect(c.filter(x => x.kind === 'rest').every(r => r.text.startsWith('쉼표 192틱'))).toBe(true);
  expect(notes.map(n => n.tick)).toEqual([0, 0, 192, 384, 576, 768, 768, 960, 1152, 1344]);
  expect(c.at(-1)?.note).toEqual({ key: 0x43, velocity: 100, duration: 191 });
});

test('note names put middle C at C4 and ticks turn into seconds by tempo', () => {
  expect([noteName(60), noteName(0x4f), noteName(0x46)]).toEqual(['C4', 'G5', 'A#4']);
  expect(TICKS_PER_BEAT).toBe(48);
  expect(seconds(3072, 70)).toBeCloseTo(54.857, 3);
});

test('a jump or track end stops the decoder', () => {
  expect(decode(Uint8Array.from([0x80, 0x30, 0x94, 0x00, 0x00, 0x00, 0x80, 0x01])).map(c => c.kind)).toEqual([
    'rest',
    'other',
  ]);
  expect(decode(Uint8Array.from([0xff, 0x80, 0x01]))).toHaveLength(1);
});
