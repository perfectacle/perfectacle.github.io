import seq from './ghost-trick-sseq.json';

/**
 * SSEQ, the DS sound driver's score: a byte stream of commands per track. `ghost-trick-sseq.json` holds the start of
 * track 0 of Ghost Trick's SEQ_GHOST_BGM054_B (sequence 37 of sound_data.sdat), from the sequence data offset.
 */

export const SAMPLE = {
  name: seq.name,
  index: seq.index,
  bank: seq.bank,
  size: seq.size,
  bytes: Uint8Array.from(seq.track0.match(/../g) ?? [], b => parseInt(b, 16)),
};

/** Ticks per quarter note. */
export const TICKS_PER_BEAT = 48;
export const seconds = (ticks: number, tempo: number) => (ticks / TICKS_PER_BEAT) * (60 / tempo);

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
/** Middle C (60) is C4. */
export const noteName = (key: number) => `${NAMES[key % 12] ?? ''}${Math.floor(key / 12) - 1}`;

export interface Command {
  at: number;
  bytes: Uint8Array;
  /** Where the track stands when the command runs. */
  tick: number;
  kind: 'note' | 'rest' | 'other';
  text: string;
  note?: { key: number; velocity: number; duration: number };
}

const hex = (n: number, w = 2) => n.toString(16).toUpperCase().padStart(w, '0');

/** Commands from `start` until the bytes run out, a jump or the track end. */
export function decode(bytes: Uint8Array, start = 0): Command[] {
  const out: Command[] = [];
  let pc = start;
  let tick = 0;
  const byte = () => bytes[pc++] ?? 0;
  const varlen = () => {
    let v = 0;
    for (;;) {
      const b = byte();
      v = (v << 7) | (b & 0x7f);
      if (!(b & 0x80)) return v;
    }
  };
  const u24 = () => byte() | (byte() << 8) | (byte() << 16);
  while (pc < bytes.length) {
    const at = pc;
    const c = byte();
    let kind: Command['kind'] = 'other';
    let text: string;
    let note: Command['note'];
    let wait = 0;
    if (c < 0x80) {
      const velocity = byte();
      const duration = varlen();
      kind = 'note';
      note = { key: c, velocity, duration };
      text = `음 ${noteName(c)}(${c}), 세기 ${velocity}, 길이 ${duration}틱`;
    } else if (c === 0x80) {
      wait = varlen();
      kind = 'rest';
      text = `쉼표 ${wait}틱: 이만큼 기다린 뒤 다음 명령`;
    } else if (c === 0x81) text = `악기(프로그램) ${varlen()}번`;
    else if (c === 0x93) {
      const track = byte();
      text = `트랙 ${track} 열기: 데이터 +0x${hex(u24(), 3)}부터`;
    } else if (c === 0x94) text = `점프할 곳: 데이터 +0x${hex(u24(), 3)}`;
    else if (c === 0xfe) {
      const mask = byte() | (byte() << 8);
      text = `쓰는 트랙 표시 0x${hex(mask, 4)}`;
    } else if (c === 0xc0) text = `팬 ${byte()}(0 왼쪽, 64 가운데, 127 오른쪽)`;
    else if (c === 0xc1) text = `트랙 음량 ${byte()}`;
    else if (c === 0xc7) text = `모노/폴리 ${byte()}(0 = 음을 겹쳐 울림)`;
    else if (c === 0xca) text = `모듈레이션 깊이 ${byte()}`;
    else if (c === 0xe1) text = `템포 ${byte() | (byte() << 8)}(4분음표가 1분에 몇 번)`;
    else if (c === 0xff) text = '트랙 끝';
    else text = `명령 0x${hex(c)}`;
    out.push({ at, bytes: bytes.slice(at, pc), tick, kind, text, ...(note ? { note } : {}) });
    tick += wait;
    if (c === 0x94 || c === 0xff) break;
  }
  return out;
}
