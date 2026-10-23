/** Short 65c816 programs for the "CPU 한 걸음" widget. Bytes are hand-assembled; tests/cpu65816.test.ts checks them. */

export interface CpuProgram {
  id: string;
  title: string;
  /** One sentence shown above the listing. */
  intro: string;
  /** Machine code from $80:8000. */
  code: number[];
  /** Plain-Korean note per instruction address (low 16 bits). */
  notes: Record<number, string>;
  /** WRAM cells shown beside the registers, as 24-bit addresses. */
  watch: number[];
  /** Data bytes at the end of `code`, which the listing shows as data instead of instructions. */
  dataFrom?: number;
  /** What the data bytes mean. */
  dataNote?: string;
}

export const WIDTH_PROGRAM: CpuProgram = {
  id: 'width',
  title: '8비트와 16비트',
  intro: '같은 LDA라도 M 플래그에 따라 한 번에 1바이트를 다룰지 2바이트를 다룰지가 바뀝니다.',
  code: [0xc2, 0x20, 0xa9, 0x34, 0x12, 0x8d, 0x00, 0x0a, 0xe2, 0x20, 0xa9, 0x56, 0x8d, 0x02, 0x0a, 0xdb],
  notes: {
    0x8000: 'P의 M 비트를 끕니다. 이제 A는 16비트입니다.',
    0x8002: '16비트 값 $1234를 A에 넣습니다. 피연산자가 2바이트(34 12)입니다.',
    0x8005: 'A를 $0A00에 적습니다. 16비트라 두 칸에 34, 12 순서로 들어갑니다.',
    0x8008: 'M 비트를 다시 켭니다. A는 8비트로 돌아갑니다.',
    0x800a: '이번 LDA는 피연산자가 1바이트(56)뿐입니다. 위 바이트 $12는 B에 숨어 남습니다.',
    0x800c: '8비트라 한 칸에만 56을 적습니다.',
    0x800f: 'STP. 여기서 멈춥니다.',
  },
  watch: [0x7e0a00, 0x7e0a01, 0x7e0a02],
};

export const LOOP_PROGRAM: CpuProgram = {
  id: 'loop',
  title: '반복과 서브루틴',
  intro: '5를 세 번 더해 저장하고, 서브루틴을 불러 그 값을 두 배로 만듭니다.',
  code: [
    0xe2, 0x30, 0xa2, 0x03, 0xa9, 0x00, 0x18, 0x69, 0x05, 0xca, 0xd0, 0xfa, 0x85, 0x10, 0x20, 0x12, 0x80, 0xdb, 0x18,
    0x65, 0x10, 0x85, 0x11, 0x60,
  ],
  notes: {
    0x8000: 'A와 X·Y를 모두 8비트로 맞춥니다.',
    0x8002: 'X에 반복 횟수 3을 넣습니다.',
    0x8004: 'A를 0으로 시작합니다.',
    0x8006: '더하기 전에 올림(C)을 지웁니다.',
    0x8007: 'A에 5를 더합니다.',
    0x8009: 'X를 1 줄입니다. 0이 되면 Z 플래그가 켜집니다.',
    0x800a: 'Z가 꺼져 있으면(X가 아직 0이 아니면) $8006으로 돌아갑니다.',
    0x800c: '다 더한 A(15 = $0F)를 $10에 적습니다.',
    0x800e: '$8012의 서브루틴으로 갑니다. 돌아올 주소를 스택에 적어 둡니다.',
    0x8011: 'STP. 서브루틴에서 돌아오면 여기서 멈춥니다.',
    0x8012: '서브루틴 시작. 올림을 지웁니다.',
    0x8013: '$10에 적어 둔 값을 A에 한 번 더 더합니다.',
    0x8015: '두 배가 된 값을 $11에 적습니다.',
    0x8017: '스택에 적어 둔 주소로 돌아갑니다.',
  },
  watch: [0x7e0010, 0x7e0011, 0x7e1ffe, 0x7e1fff],
};

// Shortened from the copy loop the Totsugeki v1.2 patch writes at $81:D169 (kr-patches docs/ANALYSIS.ko.md §11).
// The data is the start of dialogue 0x006 「어떻게」 in the same game: 16-bit little-endian character codes.
export const COPY_PROGRAM: CpuProgram = {
  id: 'copy',
  title: '문자열 복사',
  intro: '롬에 있는 2바이트 글자 코드를 0000이 나올 때까지 WRAM으로 옮깁니다. 돌격편 패치의 복사 루프를 줄인 것입니다.',
  code: [
    0xc2, 0x30, 0xa2, 0x00, 0x00, 0xbd, 0x12, 0x80, 0xf0, 0x07, 0x9d, 0x00, 0x0a, 0xe8, 0xe8, 0x80, 0xf4, 0xdb, 0xf3,
    0x08, 0xb5, 0x06, 0x27, 0x05, 0x00, 0x00,
  ],
  notes: {
    0x8000: 'A와 X·Y를 모두 16비트로 바꿉니다.',
    0x8002: 'X를 0부터 셉니다. 16비트라 피연산자가 00 00 두 바이트입니다.',
    0x8005: '$80:8012 + X 자리의 글자 코드 2바이트를 A에 읽습니다.',
    0x8008: '읽은 값이 0000(끝 표시)이면 $8011로 빠져나갑니다.',
    0x800a: '읽은 코드를 $0A00 + X에 적습니다. 뱅크 $80의 $0A00은 WRAM $7E:0A00과 같은 자리입니다.',
    0x800d: 'X를 1 늘립니다.',
    0x800e: '글자 하나가 2바이트라 한 번 더 늘립니다.',
    0x800f: '무조건 $8005로 돌아갑니다.',
    0x8011: 'STP. 복사가 끝났습니다.',
  },
  watch: [0x7e0a00, 0x7e0a01, 0x7e0a02, 0x7e0a03, 0x7e0a04, 0x7e0a05],
  dataFrom: 0x8012,
  dataNote: '명령이 아니라 데이터입니다. 2바이트씩 「어」「떻」「게」, 그리고 끝 표시 0000.',
};

export const CPU_PROGRAMS = [WIDTH_PROGRAM, LOOP_PROGRAM, COPY_PROGRAM];
