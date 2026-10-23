import { toHex } from '../../lib/numbers.ts';
import {
  BUTTONS,
  TAP_LEN,
  parseScript,
  tapCount,
  type RunScript,
  type ScriptCommand,
  type ScriptError,
} from '../../lib/run-script.ts';

export interface ScriptSample {
  id: string;
  label: string;
  text: string;
  note: string;
}

const KAKUSEI_NARRATION = [
  '250 a 4',
  '430 poke 29c 084',
  '450 a 4',
  ...Array.from({ length: 17 }, (_, i) => `${640 + i * 40} a 3`),
  '879 shot',
  '1300 shot',
  '1300 end',
].join('\n');

const OTOGIRISOU_CONT = [
  '1000 start 4',
  '1300 a 4',
  '1500 a 4',
  '1600 tap a 40 5000',
  ...Array.from({ length: 19 }, (_, i) => `${500 + i * 250} shot`),
  '5000 end',
].join('\n');

export const SCRIPT_SAMPLES: ScriptSample[] = [
  {
    id: 'demo',
    label: '이 장의 시험 롬',
    text: [
      '# 시험 롬: 배경색은 $7E:0012, A를 누르는 동안은 초록',
      '60 shot',
      '100 a 30',
      '110 shot',
      '200 poke 0012 001F',
      '202 shot',
      '240 dump',
      '300 end',
    ].join('\n'),
    note: '「직접 해 보기」에서 여러 에뮬레이터에 넣은 스크립트입니다.',
  },
  {
    id: 'kakusei',
    label: '각성편 나레이션 장면',
    text: KAKUSEI_NARRATION,
    note: '각성편 compat/s_narration.txt입니다. 430프레임에 디버그 메뉴의 장면 번호 칸 $7E:029C에 084를 써서 나레이션 장면으로 갑니다.',
  },
  {
    id: 'otogirisou',
    label: '제절초 이어하기',
    text: OTOGIRISOU_CONT,
    note: '제절초 compat/s_cont.txt입니다. 세이브를 불러온 뒤 A를 40프레임마다 누르며 250프레임마다 화면을 찍습니다.',
  },
  {
    id: 'late',
    label: '틀린 예: end 뒤의 명령',
    text: ['100 a 30', '400 shot', '300 end'].join('\n'),
    note: 'end보다 뒤에 있는 명령은 실행될 수 없어서 툴킷이 거부합니다.',
  },
  {
    id: 'button',
    label: '틀린 예: 없는 버튼',
    text: ['100 a 30', '200 jump 4', '300 end'].join('\n'),
    note: '명령 자리에 모르는 낱말이 오면 버튼 이름으로 읽다가 거부합니다.',
  },
];

/** Longest script the widget reads; the toolkit has no limit, the page just stays responsive. */
export const MAX_SCRIPT = 4000;

export const BUTTON_LABEL: Record<number, string> = {
  [BUTTONS.b]: 'B',
  [BUTTONS.y]: 'Y',
  [BUTTONS.select]: 'Select',
  [BUTTONS.start]: 'Start',
  [BUTTONS.up]: '위',
  [BUTTONS.down]: '아래',
  [BUTTONS.left]: '왼쪽',
  [BUTTONS.right]: '오른쪽',
  [BUTTONS.a]: 'A',
  [BUTTONS.x]: 'X',
  [BUTTONS.l]: 'L',
  [BUTTONS.r]: 'R',
};

export const buttonsText = (ids: number[]) => ids.map(b => BUTTON_LABEL[b] ?? '?').join('+');
const n = (v: number) => v.toLocaleString('ko-KR');
export const wramAddress = (offset: number) => {
  const a = 0x7e0000 + offset;
  return `$${toHex(a >> 16, 2)}:${toHex(a & 0xffff, 4)}`;
};

export const KIND_LABEL: Record<ScriptCommand['kind'], string> = {
  press: '누르기',
  tap: '연타',
  shot: '스크린샷',
  dump: '덤프',
  poke: 'poke',
  end: 'end',
};

/** One sentence per command, the same in the static list and the live one. */
export function describeCommand(c: ScriptCommand, script: RunScript): string {
  const never =
    c.frame < 1 && c.kind !== 'press' && c.kind !== 'tap' ? ' 프레임은 1부터 세므로 실행되지 않습니다.' : '';
  switch (c.kind) {
    case 'press':
      return c.length > 0
        ? `${n(c.frame)}프레임부터 ${buttonsText(c.buttons)} 버튼을 ${n(c.length)}프레임 누릅니다(${n(c.frame)}–${n(c.frame + c.length - 1)}).`
        : `${buttonsText(c.buttons)} 버튼을 누르는 길이가 ${n(c.length)}이라 실제로는 누르지 않습니다.`;
    case 'tap': {
      const count = tapCount(c);
      return count > 0
        ? `${n(c.frame)}프레임부터 ${n(c.until)}프레임 전까지 ${n(c.period)}프레임마다 ${buttonsText(c.buttons)} 버튼을 ${TAP_LEN}프레임씩, 모두 ${n(count)}번 누릅니다.`
        : `${buttonsText(c.buttons)} 연타는 시작 프레임이 끝 프레임(${n(c.until)})을 넘지 못해 한 번도 누르지 않습니다.`;
    }
    case 'shot':
      return `${n(c.frame)}프레임을 마친 화면을 f${String(c.frame).padStart(5, '0')}.png로 저장합니다.${never}`;
    case 'dump':
      return `${n(c.frame)}프레임을 마친 WRAM과 세이브 RAM을 wram_${c.frame}.bin, sram_${c.frame}.bin으로 저장합니다.${never}`;
    case 'poke': {
      const lo = toHex(c.value & 0xff, 2);
      const hi = toHex(c.value >> 8, 2);
      const where = c.offset >= 0 ? wramAddress(c.offset) : `WRAM 오프셋 ${c.offset}`;
      return `${n(c.frame)}프레임을 마친 뒤 ${where}부터 2바이트를 고쳐 씁니다: 값 $${toHex(c.value, 4)}, 메모리 순서 ${lo} ${hi}.${never}`;
    }
    case 'end':
      return c.frame === script.end && script.commands.filter(x => x.kind === 'end').at(-1) === c
        ? `${n(c.frame)}프레임을 마치면 멈추고 end.png를 저장합니다.`
        : `뒤에 다른 end가 있어서 이 줄은 쓰이지 않습니다. 툴킷은 마지막 end(${n(script.end)}프레임)를 씁니다.`;
  }
}

/** The error in plain Korean; the toolkit's own message is shown next to it. */
export function explainError(e: ScriptError): string {
  const at = e.line ? `${e.line}번째 줄: ` : '';
  switch (e.kind) {
    case 'expected':
      return `${at}프레임 번호 뒤에 명령이 없습니다. 「프레임 명령 …」 꼴로 적어 주세요.`;
    case 'button':
      return `${at}버튼 이름이 아닙니다: 「${e.token}」. 쓸 수 있는 버튼은 a, b, x, y, l, r, start, select, up, down, left, right입니다. 툴킷은 명령 자리에 처음 보는 낱말이 오면 버튼 이름으로 읽습니다.`;
    case 'missing':
      return `${at}「${e.token}」 명령에 필요한 값이 모자랍니다.`;
    case 'number':
      return `${at}숫자로 읽을 수 없습니다: 「${e.token}」. 프레임과 누르는 길이는 10진수, poke의 주소와 값은 16진수로 $ 없이 적습니다.`;
    case 'wram':
      return `${at}WRAM 128KB를 벗어납니다: 주소 「${e.token}」부터 2바이트. WRAM 오프셋(0–1FFFE)이나 $7E·$7F 주소로 적어 주세요.`;
    case 'period':
      return `${at}tap의 간격이 0이라 끝나지 않습니다.`;
    case 'no-end':
      return '멈출 프레임을 정하는 end 줄이 없습니다. 마지막 줄에 「프레임 end」를 적어 주세요.';
    case 'after-end':
      return `${at}end(${e.token}프레임)보다 뒤의 프레임이라 실행될 수 없습니다.`;
  }
}

export type ReadResult = { ok: true; script: RunScript } | { ok: false; error: ScriptError };

export function readScript(text: string): ReadResult {
  try {
    return { ok: true, script: parseScript(text) };
  } catch (e) {
    return { ok: false, error: e as ScriptError };
  }
}

export function summary(script: RunScript): string {
  const count = (kind: ScriptCommand['kind']) => script.commands.filter(c => c.kind === kind).length;
  const parts = [
    ['누르기', count('press')],
    ['연타', count('tap')],
    ['스크린샷', count('shot')],
    ['덤프', count('dump')],
    ['poke', count('poke')],
  ]
    .filter(([, k]) => Number(k) > 0)
    .map(([label, k]) => `${label} ${k}줄`);
  return `${n(script.end)}프레임까지 실행합니다(60프레임이 약 1초). ${parts.length ? parts.join(', ') : '명령은 end뿐'}입니다.`;
}

/** Commands on the timeline lanes, as percentages of the run. */
export interface Mark {
  kind: ScriptCommand['kind'];
  line: number;
  /** Start and width in percent of the run; width 0 is a point. */
  left: number;
  width: number;
  label: string;
  /** Tap marks: tick spacing and tick width as CSS percentages of the mark and of one spacing. */
  pitch?: string;
  tick?: string;
}

export const LANES: { id: 'input' | 'output' | 'poke'; label: string; kinds: ScriptCommand['kind'][] }[] = [
  { id: 'input', label: '입력(누르기·연타)', kinds: ['press', 'tap'] },
  { id: 'output', label: '저장(스크린샷·덤프)', kinds: ['shot', 'dump'] },
  { id: 'poke', label: 'WRAM 쓰기(poke)', kinds: ['poke'] },
];

export function marks(script: RunScript): Mark[] {
  const span = Math.max(script.end, 1);
  const pct = (f: number) => Math.min(100, Math.max(0, (f / span) * 100));
  return script.commands
    .filter(c => c.kind !== 'end')
    .map(c => {
      const stop = c.kind === 'press' ? c.frame + Math.max(c.length, 0) : c.kind === 'tap' ? c.until : c.frame;
      const left = pct(c.frame);
      const width = c.kind === 'press' || c.kind === 'tap' ? Math.max(pct(stop) - left, 0) : 0;
      const label =
        c.kind === 'press' || c.kind === 'tap'
          ? `${KIND_LABEL[c.kind]} ${buttonsText(c.buttons)} ${n(c.frame)}–${n(Math.max(stop - 1, c.frame))}`
          : `${KIND_LABEL[c.kind]} ${n(c.frame)}`;
      const tap =
        c.kind === 'tap' && c.period > 0 && c.until > c.frame
          ? {
              pitch: `${(c.period / (c.until - c.frame)) * 100}%`,
              tick: `${Math.min(100, (TAP_LEN / c.period) * 100)}%`,
            }
          : {};
      return { kind: c.kind, line: c.line, left, width, label, ...tap };
    });
}

/** What happens at one frame: held buttons and the outputs written after it. */
export function frameReport(script: RunScript, frame: number, held: number[]): string {
  const at = script.commands.filter(c => c.frame === frame && c.kind !== 'press' && c.kind !== 'tap');
  const outputs = at.map(c => (c.kind === 'end' && c.frame !== script.end ? '' : KIND_LABEL[c.kind])).filter(Boolean);
  const input = held.length ? `${buttonsText(held)} 누름` : '누르는 버튼 없음';
  return `${n(frame)}프레임: ${input}${outputs.length ? ` · 이 프레임 뒤 ${[...new Set(outputs)].join('·')}` : ''}`;
}

export const DEFAULT_SAMPLE = SCRIPT_SAMPLES[0] as ScriptSample;

/** The first sample, read at build time for the page without scripts. */
export const staticRead = () => {
  const r = readScript(DEFAULT_SAMPLE.text);
  if (!r.ok) throw new Error(`sample script does not parse: ${r.error.message}`);
  return r.script;
};

/** Inline style of a timeline mark. */
export const markStyle = (m: Mark) =>
  `left: ${m.left}%; width: ${m.width}%` + (m.pitch ? `; --pitch: ${m.pitch}; --tick: ${m.tick}` : '');
