import { compress, type LzssStep } from '../../lib/lzss.ts';
import { toHex } from '../../lib/numbers.ts';

export interface LzssSample {
  id: string;
  label: string;
  /** Compressed stream, size header included. */
  bytes: number[];
  /** The stream is an excerpt of a longer one and stops before `size` bytes come out. */
  partial: boolean;
  note: string;
}

const latin = (s: string) => [...s].map(c => c.charCodeAt(0));

/** The first 14 bytes of the Totsugeki-hen title tiles ($B7:9EB1, file 0x1B9EB1), as `krpatch lzss decode` reads them. */
export const TITLE_EXCERPT = [0x60, 0x13, 0xdc, 0x2f, 0x01, 0xf0, 0x00, 0x01, 0x0f, 0x3f, 0x89, 0x00, 0x1f, 0xff];

export const LZSS_SAMPLES: LzssSample[] = [
  {
    id: 'haha',
    label: 'ha ha ha ha ha!',
    bytes: compress(latin('ha ha ha ha ha!')),
    partial: false,
    note: '15바이트 글이 9바이트가 됩니다. 넷째 항목은 아직 다 쓰지 않은 칸까지 겹쳐 베낍니다.',
  },
  {
    id: 'banana',
    label: 'BANANA BANANA',
    bytes: compress(latin('BANANA BANANA')),
    partial: false,
    note: '13바이트 글이 11바이트가 됩니다. 짧은 반복(ANA)과 긴 반복(BANANA)을 둘 다 베낍니다.',
  },
  {
    id: 'title',
    label: '돌격편 타이틀 그림 첫머리',
    bytes: TITLE_EXCERPT,
    partial: true,
    note: '실제 롬의 $B7:9EB1부터 14바이트입니다. 풀면 4,960바이트가 되는 자료의 첫 38바이트만 나옵니다. 출력 시작보다 앞을 가리키는 복사는 0을 읽습니다.',
  },
];

export const MAX_INPUT = 40;

/** A byte as a character when it is printable ASCII; the space shows as ␣. */
export const charOf = (b: number) => (b === 0x20 ? '␣' : b > 0x20 && b < 0x7f ? String.fromCharCode(b) : '');

const bytesText = (list: number[]) => list.map(b => toHex(b, 2)).join(' ');

/** One sentence for a step, the same in the static list and the live readout. */
export function describe(step: LzssStep): string {
  switch (step.kind) {
    case 'size':
      return `처음 2바이트는 풀었을 때의 크기입니다: $${toHex(step.size, 4)} = ${step.size.toLocaleString('ko-KR')}바이트.`;
    case 'flags':
      return `플래그 바이트 ${toHex(step.value, 2)} = ${step.value.toString(2).padStart(8, '0')}. 아래 비트(비트 0)부터 뒤따르는 항목 8개의 종류를 알려 줍니다.`;
    case 'literal': {
      const ch = charOf(step.byte);
      return `비트 ${step.bit} = 1 → 그대로 1바이트 ${toHex(step.byte, 2)}${ch ? `(${ch})` : ''}. 출력 ${step.outAt}번 칸에 그대로 씁니다.`;
    }
    case 'copy': {
      const from = step.src < 0 ? `시작보다 ${-step.src}칸 앞` : `${step.src}번 칸`;
      const tail: string[] = [];
      if (step.src < 0) tail.push('시작보다 앞은 0으로 읽습니다.');
      if (step.src + step.len > step.outAt)
        tail.push('가져올 곳과 쓸 곳이 겹쳐서, 방금 쓴 바이트를 다시 읽으며 반복합니다.');
      return [
        `비트 ${step.bit} = 0 → 복사: 워드 $${toHex(step.word, 4)}에서 거리 = $${toHex(step.word >> 4, 3)} = ${step.dist}, 길이 = ${step.word & 0xf} + 3 = ${step.len}.`,
        `출력 ${step.outAt}번 칸부터 ${step.dist}칸 앞(${from})에서 ${step.len}바이트(${bytesText(step.bytes)})를 가져옵니다.`,
        ...tail,
      ].join(' ');
    }
  }
}

/** How many input bytes a step reads. */
export const stepWidth = (step: LzssStep) => (step.kind === 'size' || step.kind === 'copy' ? 2 : 1);
