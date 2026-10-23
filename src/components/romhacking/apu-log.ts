/**
 * A real excerpt of an APU port log from 드래곤볼 Z 초오공전 각성편 (Mesen 2, one line per write that changed a port:
 * `frame port value pc=…`), cut into steps for the chapter 13 widget. Skipped stretches carry the port values the full
 * log reaches at their end, so every step shows what the S-CPU had last written to each port.
 */

export type Port = 0 | 1 | 2 | 3;
export type Phase = 'upload' | 'command';

export interface PortWrite {
  frame: number;
  port: Port;
  value: number;
  /** As the log records it: the address of the instruction after the write. */
  pc: number;
}

export interface LogStep {
  /** A log line, or undefined for a skipped stretch. */
  line?: string;
  phase: Phase;
  title: string;
  note: string;
  /** What the S-CPU checks next before it goes on, if anything. */
  wait?: string;
  /** For a skipped stretch: how many log lines it stands for and the ports at its end. */
  skip?: { lines: number; ports: [number, number, number, number] };
}

export const PHASE_LABEL: Record<Phase, string> = { upload: '올리기', command: '명령' };
export const PORT_ADDR = ['$2140', '$2141', '$2142', '$2143'] as const;
export const SPC_ADDR = ['$F4', '$F5', '$F6', '$F7'] as const;

const LINE = /^(\d+) 214([0-3]) ([0-9A-F]{2}) pc=([0-9A-F]{6})$/;

export function parseLine(line: string): PortWrite {
  const m = LINE.exec(line);
  if (!m) throw new Error(`Not an APU port log line: ${line}`);
  return {
    frame: Number(m[1]),
    port: Number(m[2]) as Port,
    value: parseInt(m[3] ?? '', 16),
    pc: parseInt(m[4] ?? '', 16),
  };
}

export const hex2 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0');
export const hex4 = (v: number) => v.toString(16).toUpperCase().padStart(4, '0');
export const formatPc = (pc: number) => `$${hex2(pc >> 16)}:${hex4(pc & 0xffff)}`;

const up = (line: string, title: string, note: string, wait?: string): LogStep => ({
  line,
  phase: 'upload',
  title,
  note,
  ...(wait ? { wait } : {}),
});
const cmd = (line: string, title: string, note: string, wait?: string): LogStep => ({
  line,
  phase: 'command',
  title,
  note,
  ...(wait ? { wait } : {}),
});

export const LOG_SOURCE = 'apu-kakusei.txt';
export const LOG_LINES = 96_421;

export const APU_STEPS: LogStep[] = [
  up(
    '11 2142 00 pc=8380C0',
    '받을 주소 아래 바이트',
    '전원을 켠 뒤 11프레임째, 올리기 함수 $83:808C가 롬의 블록 목록에서 받을 주소 $0800을 읽어 $2142–$2143에 한 번에 씁니다. 아래 바이트 00이 $2142로 갑니다. 그 전에 $2140–$2141을 읽어 IPL이 띄운 AA BB(준비됨)를 확인했지만, 읽기는 기록에 남지 않습니다.',
  ),
  up('11 2143 08 pc=8380C0', '받을 주소 위 바이트', '위 바이트 08이 $2143으로 갑니다. 받을 주소는 $0800입니다.'),
  up(
    '11 2141 01 pc=8380CB',
    '데이터를 보낸다는 표시',
    '$2141이 0이 아니면 "이 주소부터 데이터를 받아라", 0이면 "이 주소에서 실행하라"는 뜻입니다.',
  ),
  up(
    '11 2140 CC pc=8380D4',
    '시작 신호 CC',
    'IPL은 $2140(SPC700 쪽 $F4)에 CC가 오기를 기다리고 있었습니다. 받으면 같은 CC를 되돌려 줍니다.',
    '$2140을 읽어 CC가 돌아올 때까지',
  ),
  up(
    '11 2141 20 pc=8380F1',
    '데이터 첫 바이트',
    '보낼 바이트 20을 $2141에 둡니다. SPC700 명령으로 읽으면 CLRP입니다. 사운드 드라이버의 첫 명령입니다.',
  ),
  up(
    '11 2140 00 pc=8380F5',
    '번호 00',
    '$2140에 이 바이트의 번호 00을 써서 "새 바이트가 있다"고 알립니다. IPL은 $2141을 읽어 $0800에 저장하고 번호 00을 되돌려 줍니다.',
    '$2140을 읽어 00이 돌아올 때까지',
  ),
  up('11 2141 CD pc=8380F1', '둘째 바이트', '다음 바이트 CD를 $2141에 둡니다.'),
  up(
    '11 2140 01 pc=8380F5',
    '번호 01',
    '번호가 하나 늘었으니 새 바이트입니다. 이 바이트는 $0801에 들어갑니다.',
    '$2140을 읽어 01이 돌아올 때까지',
  ),
  up('11 2141 7F pc=8380F1', '셋째 바이트', 'CD 7F는 SPC700의 MOV X,#$7F입니다.'),
  up(
    '11 2140 02 pc=8380F5',
    '번호 02',
    '이렇게 한 바이트에 두 번 쓰고 한 번 기다리기를 되풀이합니다.',
    '$2140을 읽어 02가 돌아올 때까지',
  ),
  {
    phase: 'upload',
    title: '같은 모양으로 4,381바이트 더',
    note: '11프레임부터 18프레임까지 같은 쓰기가 8,718줄 이어집니다. 번호는 FF 다음에 00으로 돌아갑니다. 같은 바이트가 연달아 오면 $2141 값이 바뀌지 않으므로 그 줄은 기록에 없습니다.',
    skip: { lines: 8_718, ports: [0x1f, 0x03, 0x00, 0x08] },
  },
  up('18 2141 6F pc=8380F1', '마지막 바이트', '마지막 바이트 6F는 SPC700의 RET입니다.'),
  up(
    '18 2140 20 pc=8380F5',
    '번호 20: 4,385번째 바이트',
    '번호가 17바퀴 돌고 20에서 끝났습니다. 4,385바이트(0x1121)가 $0800–$1920에 들어갔습니다.',
    '$2140을 읽어 20이 돌아올 때까지',
  ),
  up(
    '18 2143 1E pc=8380C0',
    '다음 블록 주소',
    '다음 블록은 $1E00으로 갑니다. 16비트로 $2142–$2143에 썼지만 $2142는 00 그대로라 기록에 없습니다. 값이 바뀐 포트만 남기는 기록이기 때문입니다.',
  ),
  up('18 2141 01 pc=8380CB', '또 데이터를 보낸다는 표시', '이번에도 0이 아니므로 데이터를 보냅니다.'),
  up(
    '18 2140 23 pc=8380D4',
    '다음 블록 신호 23',
    '두 번째 블록부터는 CC 대신 마지막 번호보다 2 이상 큰 값을 씁니다. 이 게임은 마지막 번호 20에 3을 더한 23을 씁니다. IPL은 번호가 건너뛴 것을 보고 블록이 끝났음을 압니다.',
    '$2140을 읽어 23이 돌아올 때까지',
  ),
  {
    phase: 'upload',
    title: '$1E00에 8바이트',
    note: '같은 방법으로 8바이트(00 20 00 20 00 20 00 20)를 보냅니다. 16줄입니다.',
    skip: { lines: 16, ports: [0x07, 0x20, 0x00, 0x1e] },
  },
  up('18 2143 08 pc=8380C0', '실행할 주소', '$2142–$2143에 실행할 주소 $0800을 씁니다.'),
  up('18 2141 00 pc=8380CB', '실행하라는 표시', '$2141이 0이면 데이터가 아니라 실행입니다.'),
  up(
    '18 2140 0A pc=8380D4',
    '실행 신호 0A',
    '마지막 번호 07보다 3 큰 0A를 씁니다. IPL은 0A를 되돌려 주고 $0800으로 건너뜁니다. 이제부터 포트의 뜻은 IPL이 아니라 방금 올린 사운드 드라이버가 정합니다.',
    '$2140을 읽어 0A가 돌아올 때까지',
  ),
  {
    phase: 'upload',
    title: '19–64프레임: 블록 다섯 개 더',
    note: '드라이버가 IPL로 돌아가게 한 뒤 $1E02, $1F00, $1B00, $4000, $1C00에 모두 29,221바이트를 더 올리고 다시 $0800에서 실행합니다. 57,900줄입니다.',
    skip: { lines: 57_900, ports: [0x86, 0x00, 0x00, 0x08] },
  },
  cmd(
    '149 2140 80 pc=83800E',
    '곡을 바꾸기 전 신호',
    '149프레임, 곡 재생 함수 $83:8200이 맨 먼저 부르는 $83:8000입니다. $2143이 0이 될 때까지 기다린 뒤 $2140에 80을 씁니다.',
    '$2142를 읽어 80이 돌아올 때까지',
  ),
  cmd(
    '150 2141 80 pc=838018',
    '한 번 더 80',
    '$2141에도 80을 쓰고, 이번에는 $2141에서 80이 돌아오기를 기다립니다. 이 주고받기가 끝나면 곧바로 새 곡을 올리기 시작합니다.',
    '$2141을 읽어 80이 돌아올 때까지',
  ),
  up(
    '150 2140 FF pc=8380A4',
    'IPL로 돌아가라는 신호',
    '올리기 함수 $83:808C는 $2140–$2141이 AA BB가 아니면 $2140에 FF를 쓰고 다시 확인합니다. FF를 받은 드라이버가 IPL로 돌아가면 IPL이 AA BB를 띄웁니다.',
    '$2140–$2141을 읽어 AA BB가 보일 때까지',
  ),
  up('150 2143 1E pc=8380C0', '곡 데이터 블록 주소', '곡 표에서 찾은 블록 목록의 첫 블록을 $1E00에 보냅니다.'),
  up('150 2141 01 pc=8380CB', '데이터를 보낸다는 표시', '처음처럼 0이 아닌 값입니다.'),
  up(
    '150 2140 CC pc=8380D4',
    '시작 신호 CC',
    'IPL로 막 돌아왔으므로 다시 CC로 시작합니다.',
    '$2140을 읽어 CC가 돌아올 때까지',
  ),
  {
    phase: 'upload',
    title: '150–186프레임: 곡 데이터와 악기 샘플',
    note: '곡 데이터 2,194바이트를 $3000에 올린 뒤, 악기 샘플 여섯 개를 하나씩 올립니다. 샘플마다 샘플 목록 자리로 보이는 $1B50, $1B54, …에 4바이트를 쓰고, $A000부터 BRR 데이터(모두 12,933바이트, 9바이트 블록 1,437개)를 이어 씁니다. 블록마다 FF로 IPL을 깨우고 $0800에서 실행하기를 되풀이합니다. 29,757줄입니다.',
    skip: { lines: 29_757, ports: [0xca, 0x00, 0x00, 0x08] },
  },
  cmd(
    '187 2143 D7 pc=838056',
    '명령에 딸린 값',
    '명령 함수 $83:8038은 $2142–$2143에 딸린 값을 먼저 씁니다. D7은 곡 표 항목의 여섯째 바이트입니다. $2142는 00 그대로라 기록에 없습니다.',
  ),
  cmd(
    '187 2140 FD pc=83805C',
    '명령 FD',
    '$2140에 명령 번호 FD를 씁니다. 곡 재생 함수가 곡을 다 올린 뒤 마지막으로 보내는 명령입니다.',
    '$2142를 읽어 FD가 돌아올 때까지',
  ),
  cmd(
    '187 2140 01 pc=83805C',
    '명령 01',
    '같은 함수로 01을 보냅니다. 이 함수는 다음 명령을 보내기 전에 $2142로 앞 명령이 돌아왔는지 확인합니다. 01이 드라이버 안에서 무슨 일을 하는지는 이 기록만으로는 알 수 없습니다.',
  ),
  cmd(
    '1635 2141 0B pc=838031',
    '효과음 0B',
    '효과음 함수 $83:8023은 $2143이 0이 될 때까지 기다린 뒤 효과음 번호를 $2141에 씁니다. 곡 명령을 보내는 $2140과 다른 포트입니다.',
  ),
  cmd('3161 2141 0A pc=838031', '효과음 0A', '다음 효과음입니다. 이 함수는 되돌아오는 값을 기다리지 않습니다.'),
];

export type Ports = [number | undefined, number | undefined, number | undefined, number | undefined];

/** Port values after each step: what the S-CPU last wrote, or undefined before the first write to that port. */
export function replay(steps: LogStep[]): Ports[] {
  const out: Ports[] = [];
  let ports: Ports = [undefined, undefined, undefined, undefined];
  for (const s of steps) {
    if (s.skip) ports = [...s.skip.ports];
    else if (s.line) {
      const w = parseLine(s.line);
      ports = [...ports];
      ports[w.port] = w.value;
    }
    out.push(ports);
  }
  return out;
}

/** The SPC700 address held in $2142–$2143, once both have been written. */
export const portAddress = (p: Ports) =>
  p[2] === undefined || p[3] === undefined ? undefined : ((p[3] << 8) | p[2]) & 0xffff;

/** One sentence for the live region. */
export function stepReport(step: LogStep, index: number, total: number): string {
  const head = `${index + 1}/${total}단계, ${PHASE_LABEL[step.phase]}.`;
  if (!step.line) return `${head} ${step.title}. 기록 ${step.skip?.lines.toLocaleString('ko-KR') ?? 0}줄을 건너뜁니다.`;
  const w = parseLine(step.line);
  const wait = step.wait ? ` 기다림: ${step.wait}.` : '';
  return `${head} ${w.frame}프레임, ${PORT_ADDR[w.port]}에 ${hex2(w.value)}. ${step.title}.${wait}`;
}
