import { slug } from 'github-slugger';
import { GUIDE_PATH, chapterBySlug, chapterLabel, chapterPath, type GuideChapter } from './chapters.ts';

/**
 * Terms of the ROM hacking guide. Each points at the section where a chapter explains it; `tests/romhacking-glossary.test.ts`
 * checks that the section id exists in that chapter's page, and `pnpm verify:dist` checks the built links.
 */

export const GLOSSARY_PATH = `${GUIDE_PATH}glossary/`;

type Where =
  | 'rom-patch'
  | 'numbers'
  | 'endian'
  | 'lzss'
  | 'huffman'
  | 'sfc/cpu'
  | 'sfc/banks'
  | 'sfc/assembly'
  | 'sfc/hooking'
  | 'sfc/graphics'
  | 'sfc/text'
  | 'sfc/expansion'
  | 'sfc/emulator'
  | 'sfc/sound'
  | 'nds/filesystem'
  | 'nds/text'
  | 'nds/graphics'
  | 'nds/sound'
  | 'nds/emulator'
  | 'nds/cpu'
  | 'music-loop';

export interface GlossaryEntry {
  term: string;
  /** The original term, when the guide uses or implies one. */
  en?: string;
  meaning: string;
  chapter: GuideChapter;
  /** Section id in the chapter page. */
  anchor: string;
}

// [term, original or '', chapter, section id, meaning]
const RAW: [string, string, Where, string, string][] = [
  ['롬', 'ROM', 'rom-patch', 'rom', '카트리지 칩에 들어 있는, 읽기만 하는 메모리. 또는 그 내용을 통째로 옮긴 파일'],
  ['바이트', 'byte', 'numbers', 'bits', '비트 여덟 개를 묶은 단위. 0부터 255까지의 숫자 하나'],
  ['비트', 'bit', 'numbers', 'bits', '0 또는 1을 담는 한 칸'],
  [
    '파일 오프셋',
    'file offset',
    'rom-patch',
    'rom',
    '파일 안에서 몇 번째 바이트인지. 첫 바이트가 0이고, 이 가이드는 0x를 붙여 적습니다',
  ],
  [
    '카피어 헤더',
    'copier header',
    'rom-patch',
    'rom',
    '옛 복사 장치가 롬 앞에 붙인 512바이트. 붙어 있으면 모든 파일 오프셋이 0x200 밀립니다',
  ],
  [
    '내부 헤더',
    'internal ROM header',
    'sfc/banks',
    'system',
    '롬 안에 게임 이름·매핑·크기·체크섬을 적어 둔 곳. LoROM은 파일 0x7FC0',
  ],
  ['덤프(롬)', 'ROM dump', 'rom-patch', 'rom', '카트리지에서 뽑아낸 롬 파일'],
  ['패치', 'patch', 'rom-patch', 'patch', '원본에서 바뀐 곳만 적어 둔 파일'],
  ['한글패치', '', 'rom-patch', 'patch', '롬의 바이트 일부를 바꿔 게임을 한국어로 만드는 패치'],
  ['IPS', '', 'rom-patch', 'ips', 'PATCH로 시작해 레코드가 이어지고 EOF로 끝나는 단순한 패치 형식'],
  ['레코드', 'record', 'rom-patch', 'ips', 'IPS에서 위치 3바이트, 길이 2바이트, 바꿀 내용으로 된 묶음 하나'],
  ['RLE 레코드', 'RLE record', 'rom-patch', 'ips', '길이 자리가 00 00이고 같은 바이트를 몇 번 쓸지 적는 IPS 레코드'],
  ['CRC32', 'CRC32', 'rom-patch', 'patch', '파일 내용으로 계산한 지문 값. 원본 롬이 맞는지 확인할 때 씁니다.'],
  ['2진수', 'binary', 'numbers', 'bits', '자리마다 두 배씩 커지는 자릿값으로 적은 수'],
  ['2의 보수', "two's complement", 'numbers', 'bits', '맨 위 비트가 1이면 256(16비트면 65,536)을 빼서 읽는 음수 표현'],
  ['부호 있는 수', 'signed', 'numbers', 'bits', '같은 바이트를 −128–127로 읽는 방식. 0–255로 읽으면 부호 없는 수'],
  ['마스크', 'mask', 'numbers', 'bits', 'AND로 필요한 비트만 남길 때 쓰는 값'],
  ['시프트', 'shift', 'numbers', 'bits', '비트를 한쪽으로 미는 연산. 왼쪽으로 한 칸이면 ×2'],
  [
    'BCD',
    'binary-coded decimal',
    'numbers',
    'bits',
    '16진수 한 자리에 10진수 한 자리를 넣는 방식. D 플래그를 켜면 ADC·SBC가 BCD로 계산합니다',
  ],
  ['16진수', 'hexadecimal', 'numbers', 'hex', '2진수 네 자리를 0–9, A–F 한 글자로 적은 수'],
  [
    '$(16진수 표시)',
    '',
    'numbers',
    'hex',
    '16진수라는 표시. 이 가이드는 CPU가 보는 주소, 레지스터와 메모리의 값, 표의 번호로 쓰는 ID에 $를 붙입니다',
  ],
  ['0x(16진수 표시)', '', 'numbers', 'hex', '16진수라는 표시. 이 가이드는 파일 오프셋과 파일 속 길이에 0x를 붙입니다'],
  [
    '2의 거듭제곱',
    'power of two',
    'numbers',
    'sizes',
    '1, 2, 4, 8 …처럼 두 배씩 커지는 수. 롬 크기는 대개 이 크기입니다',
  ],
  ['KB·MB', 'KiB·MiB', 'numbers', 'sizes', '롬 해킹에서는 1KB = 1,024바이트, 1MB = 1,024KB'],
  ['체크섬', 'checksum', 'numbers', 'in-patch', '롬의 모든 바이트를 더한 값의 아래 16비트. 내부 헤더에 적혀 있습니다.'],
  [
    '보수(체크섬)',
    'checksum complement',
    'numbers',
    'in-patch',
    '체크섬의 비트를 모두 뒤집은 값. 체크섬과 더하면 $FFFF',
  ],
  ['FastROM', 'FastROM', 'numbers', 'in-patch', '빠르게 읽어도 되는 롬이라는 헤더 표시. 속도는 $420D로 바꿉니다.'],
  ['엔디안', 'endianness', 'endian', 'split', '여러 바이트로 된 숫자를 메모리에 놓는 순서'],
  ['리틀 엔디안', 'little endian', 'endian', 'order', '작은 자리 바이트를 앞 칸에 두는 순서. 65c816이 이 순서입니다.'],
  [
    '빅 엔디안',
    'big endian',
    'endian',
    'order',
    '큰 자리 바이트를 앞 칸에 두는 순서. IPS의 위치와 길이가 이 순서입니다',
  ],
  ['포인터', 'pointer', 'endian', 'reversed', '다른 데이터의 주소를 담은 값'],
  [
    '24비트 포인터',
    '24-bit pointer',
    'endian',
    'reversed',
    '뱅크까지 담은 3바이트 포인터. 어느 뱅크든 가리킬 수 있습니다',
  ],
  ['6502', 'MOS 6502', 'endian', 'reversed', '65c816의 조상인 8비트 CPU'],
  ['CPU', 'central processing unit', 'sfc/cpu', 'worker', '명령을 한 줄씩 읽어 실행하는 장치'],
  ['명령', 'instruction', 'sfc/cpu', 'worker', 'CPU가 한 번에 하는 아주 작은 일 하나. LDA, STA 같은 것'],
  ['PC', 'program counter', 'sfc/cpu', 'worker', '다음에 실행할 명령의 주소를 가리키는 레지스터'],
  ['레지스터(CPU)', 'register', 'sfc/cpu', 'registers', 'CPU 안에서 지금 다루는 값을 잠깐 쥐는 작은 칸. A, X, Y, P 등'],
  [
    '65c816',
    'WDC 65C816',
    'sfc/cpu',
    'registers',
    '슈퍼 패미콤의 CPU. 6502를 16비트로 넓히고 주소를 24비트로 늘렸습니다',
  ],
  [
    'A 레지스터',
    'accumulator',
    'sfc/cpu',
    'registers',
    '계산에 쓰는 레지스터. 읽고 더하고 비교하고 적는 일 대부분이 이곳을 거칩니다',
  ],
  ['X·Y 레지스터', 'index registers', 'sfc/cpu', 'registers', 'X와 Y. 표의 몇 번째 칸인지 세는 데 씁니다.'],
  ['플래그', 'flag', 'sfc/cpu', 'registers', 'P 레지스터의 한 비트. 방금 결과가 0인지, 올림이 났는지 등을 표시합니다.'],
  ['P 레지스터', 'processor status', 'sfc/cpu', 'registers', '플래그 여덟 개를 담은 레지스터'],
  ['M 플래그·X 플래그', 'M / X flag', 'sfc/cpu', 'width', 'A와 X·Y가 8비트인지 16비트인지 정하는 플래그. 1이면 8비트'],
  ['REP·SEP', 'REP / SEP', 'sfc/cpu', 'width', 'P의 비트를 끄고 켜는 명령. REP #$20은 A를 16비트로 바꿉니다.'],
  [
    '옵코드',
    'opcode',
    'sfc/assembly',
    'names',
    '명령의 종류를 나타내는 첫 바이트. 3장에서는 "명령 바이트"라고 불렀습니다',
  ],
  ['피연산자', 'operand', 'sfc/assembly', 'names', '옵코드 뒤에 붙는 값이나 주소. 0–3바이트'],
  ['에뮬레이션 모드', 'emulation mode', 'sfc/cpu', 'width', '전원을 켠 직후 6502처럼 도는 모드'],
  ['네이티브 모드', 'native mode', 'sfc/cpu', 'width', '16비트 레지스터를 쓸 수 있는 모드. CLC와 XCE로 바꿉니다.'],
  [
    '데이터 뱅크(DB)',
    'data bank register',
    'sfc/cpu',
    'width',
    '16비트 주소로 읽고 쓸 때 앞에 붙는 뱅크를 담은 레지스터',
  ],
  ['프로그램 뱅크(PB)', 'program bank register', 'sfc/cpu', 'width', '지금 실행 중인 코드의 뱅크'],
  ['다이렉트 페이지', 'direct page', 'sfc/cpu', 'width', '짧은 주소(LDA $10)의 기준 위치. D 레지스터에 담습니다.'],
  ['리셋 벡터', 'reset vector', 'sfc/cpu', 'in-patch', '전원을 켜면 실행을 시작할 주소를 적어 둔 자리($00:FFFC)'],
  ['SA-1', 'SA-1', 'sfc/cpu', 'in-patch', '카트리지에 든 두 번째 65c816. 슈퍼 마리오 RPG가 씁니다.'],
  ['S-CPU', 'S-CPU', 'sfc/cpu', 'in-patch', '본체에 있는 CPU. SA-1과 구별할 때 이렇게 부릅니다.'],
  ['뱅크', 'bank', 'sfc/banks', 'books', '24비트 주소의 맨 위 8비트. 주소 공간을 64KB씩 나눈 묶음'],
  ['CPU 주소', 'CPU address', 'sfc/banks', 'mapping', 'CPU가 보는 24비트 주소. $80:8000처럼 뱅크와 주소로 적습니다.'],
  ['매핑', 'mapping', 'sfc/banks', 'mapping', '롬 파일의 어느 부분이 CPU 주소의 어디에 보이는지 정한 규칙'],
  ['LoROM', 'LoROM', 'sfc/banks', 'mapping', '롬을 32KB씩 잘라 뱅크마다 위쪽 반($8000–$FFFF)에 놓는 매핑'],
  ['HiROM', 'HiROM', 'sfc/banks', 'mapping', '롬을 64KB씩 잘라 뱅크 $C0부터 통째로 놓는 매핑'],
  ['ExHiROM', 'ExHiROM', 'sfc/banks', 'system', '4MB보다 큰 롬을 위한 HiROM의 확장 매핑'],
  ['WRAM', 'work RAM', 'sfc/banks', 'system', '게임이 쓰는 작업 메모리 128KB. 뱅크 $7E·$7F'],
  ['미러', 'mirror', 'sfc/banks', 'system', '같은 메모리가 두 주소 이상에서 보이는 것'],
  ['레지스터(하드웨어)', 'I/O register', 'sfc/banks', 'system', '화면·소리·입력 칩을 다루는 주소. $2100–, $4200– 등'],
  ['세이브 RAM', 'save RAM', 'sfc/banks', 'system', '카트리지에서 세이브 데이터를 담는 메모리'],
  ['Super MMC', 'Super MMC', 'sfc/banks', 'system', 'SA-1 카트리지가 1MB 롬 블록을 골라 창 네 개에 보여 주는 기능'],
  ['맵 모드 바이트', 'map mode byte', 'sfc/banks', 'system', '내부 헤더에서 매핑과 FastROM 여부를 적은 바이트($FFD5)'],
  ['어셈블리', 'assembly', 'sfc/assembly', 'names', '명령 바이트마다 사람이 읽을 이름을 붙여 적은 것'],
  [
    '역어셈블',
    'disassembly',
    'sfc/assembly',
    'names',
    '바이트를 어셈블리로 바꿔 읽는 것. 반대로 바꾸는 도구가 어셈블러',
  ],
  ['어셈블러', 'assembler', 'sfc/assembly', 'names', '어셈블리를 바이트로 바꾸는 도구. 네 패치는 asar를 썼습니다.'],
  [
    '주소 지정 방식',
    'addressing mode',
    'sfc/assembly',
    'modes',
    '명령이 값을 어디서 가져올지 정하는 방식. 즉시값, 절대 주소, 인덱스 등',
  ],
  ['즉시값', 'immediate', 'sfc/assembly', 'modes', '# 뒤에 적은 값 그 자체. #이 없으면 그 주소에 든 값'],
  ['분기', 'branch', 'sfc/assembly', 'branch', '플래그를 보고 다음에 실행할 곳을 바꾸는 명령'],
  [
    '서브루틴',
    'subroutine',
    'sfc/assembly',
    'subroutine',
    '여러 곳에서 불러 쓰는 코드 덩어리. JSR로 부르고 RTS로 돌아옵니다',
  ],
  [
    '스택',
    'stack',
    'sfc/assembly',
    'subroutine',
    '나중에 넣은 것을 먼저 꺼내는 메모리. 돌아갈 주소와 레지스터를 잠깐 맡깁니다',
  ],
  ['인터럽트', 'interrupt', 'sfc/assembly', 'copy', 'CPU가 하던 일을 멈추고 정해진 루틴을 실행하게 하는 신호'],
  [
    'NMI',
    'non-maskable interrupt',
    'sfc/assembly',
    'copy',
    '화면을 다 그린 직후마다 오는 인터럽트($4200 비트 7을 켜 두었을 때). 화면 데이터는 이때 바꿉니다',
  ],
  ['수직 귀선 기간', 'vertical blank', 'sfc/assembly', 'copy', '한 화면을 다 그리고 다음 화면을 그리기 전의 짧은 시간'],
  ['벡터', 'vector', 'sfc/assembly', 'copy', '인터럽트나 리셋 때 갈 주소를 적어 둔 자리'],
  ['사이클', 'cycle', 'sfc/assembly', 'copy', '명령이 걸리는 시간의 단위'],
  ['후킹', 'hooking', 'sfc/hooking', 'why', '원래 코드 몇 바이트를 점프로 바꿔 새 코드에 들렀다 돌아오게 하는 방법'],
  ['JSL·RTL', 'JSL / RTL', 'sfc/hooking', 'jump', '다른 뱅크의 서브루틴을 부르고 돌아오는 명령 짝'],
  [
    '덮어쓴 명령',
    '',
    'sfc/hooking',
    'restore',
    '점프 명령을 넣느라 지운 원래 명령. 새 코드 안에서 다시 실행해야 합니다',
  ],
  [
    '빈 공간',
    'free space',
    'sfc/hooking',
    'space',
    '롬에서 아무도 쓰지 않는 자리. 00이나 FF가 이어져도 빈 곳이 아닐 수 있습니다',
  ],
  ['중계 코드', 'trampoline', 'sfc/hooking', 'space', '가까운 곳에 몇 바이트만 두고 먼 뱅크의 본체를 부르는 코드'],
  [
    'DMA',
    'direct memory access',
    'sfc/graphics',
    'vram',
    'CPU 대신 하드웨어가 바이트를 한꺼번에 옮기는 기능. 그림을 VRAM에 올릴 때 씁니다',
  ],
  ['asar', 'asar', 'sfc/hooking', 'space', '네 패치가 쓴 65c816 어셈블러'],
  ['타일', 'tile', 'sfc/graphics', 'tiles', '가로세로 8픽셀짜리 작은 그림. 화면은 타일을 이어 붙여 그립니다.'],
  ['타일맵', 'tilemap', 'sfc/graphics', 'tiles', '화면의 각 칸에 몇 번 타일을 놓을지 적은 표'],
  ['bpp', 'bits per pixel', 'sfc/graphics', 'bitplanes', '픽셀 하나의 색 번호에 쓰는 비트 수. 2bpp면 4색'],
  [
    '비트평면',
    'bitplane',
    'sfc/graphics',
    'bitplanes',
    '색 번호의 같은 자리 비트만 모은 판. 타일 바이트는 평면별로 놓입니다',
  ],
  ['팔레트', 'palette', 'sfc/graphics', 'palette', '타일의 색 번호가 실제로 어떤 색인지 정한 색 묶음'],
  ['CGRAM', 'color generator RAM', 'sfc/graphics', 'palette', '팔레트 색을 담는 512바이트 메모리. 색 하나에 2바이트'],
  ['VRAM', 'video RAM', 'sfc/graphics', 'vram', '화면 칩(PPU)의 메모리 64KB. 타일 그림과 타일맵이 들어 있습니다.'],
  ['PPU', 'picture processing unit', 'sfc/graphics', 'vram', '화면을 그리는 칩'],
  ['워드', 'word', 'sfc/graphics', 'vram', '2바이트. VRAM 주소는 워드 단위로 셉니다.'],
  ['배경 레이어(BG)', 'background layer', 'sfc/graphics', 'vram', '화면을 이루는 배경 판. BG1–BG4까지 겹쳐 그립니다'],
  ['BG 모드', 'BG mode', 'sfc/graphics', 'vram', '레이어마다 몇 색 타일을 쓸지 정하는 화면 모드 0–7'],
  ['폰트', 'font', 'sfc/graphics', 'fonts', '게임 글자를 그린 타일 모음'],
  ['고정폭', 'fixed-width', 'sfc/graphics', 'fonts', '모든 글자가 같은 폭을 차지하는 폰트'],
  [
    '가변폭 폰트',
    'variable width font, VWF',
    'sfc/graphics',
    'fonts',
    '글자마다 폭이 다른 폰트. 글자를 비트 단위로 밀어 붙여 그립니다',
  ],
  [
    '폰트 칸',
    '',
    'sfc/graphics',
    'hangul',
    '폰트에서 글자 하나가 차지하는 자리. 칸 수가 넣을 수 있는 글자 수를 정합니다',
  ],
  ['글리프', 'glyph', 'sfc/graphics', 'hangul', '글자 하나의 그림'],
  ['완성형', 'KS X 1001', 'sfc/graphics', 'hangul', '자주 쓰는 한글 2,350자를 정해 둔 글자 집합'],
  ['글자표', 'table file (.tbl)', 'sfc/text', 'table', '바이트 값과 글자의 대응을 적은 표'],
  ['덤프(대사)', 'dump', 'sfc/text', 'table', '글자표로 롬의 대사 바이트를 글자로 바꿔 꺼내는 일'],
  ['삽입', 'insertion', 'sfc/text', 'table', '번역문을 글자표로 다시 바이트로 바꿔 롬에 넣는 일'],
  [
    '제어 코드',
    'control code',
    'sfc/text',
    'control',
    '줄바꿈, 기다리기, 이름 넣기처럼 글자가 아닌 명령을 나타내는 바이트',
  ],
  ['인자', 'argument', 'sfc/text', 'control', '제어 코드나 명령 뒤에 붙는 값'],
  ['포인터 표', 'pointer table', 'sfc/text', 'pointers', '대사마다 시작 주소를 적은 표. 대사 번호로 위치를 찾습니다.'],
  ['대본', 'script', 'sfc/text', 'stream', '번호 없이 한 줄로 이어 둔 대사 전체'],
  ['다시 배치', 'relocation', 'sfc/text', 'grow', '대사를 처음부터 다시 채우고 포인터를 새로 만드는 일'],
  ['끝 코드', 'terminator', 'sfc/text', 'grow', '문자열이나 데이터의 끝을 알리는 값'],
  ['창(대사)', 'text window', 'sfc/text', 'grow', '대사가 나오는 화면 속 상자'],
  ['압축', 'compression', 'lzss', 'why', '데이터를 더 적은 바이트로 줄여 담는 것. 되돌리는 것은 압축 해제(풀기)'],
  ['해제 루틴', 'decompression routine', 'lzss', 'lzss', '롬 안에서 압축을 푸는 코드'],
  ['RLE', 'run-length encoding', 'lzss', 'rle', '같은 값이 이어지면 값과 개수로 적는 압축'],
  ['LZ77', 'LZ77', 'lzss', 'lz', '앞에 나온 덩어리를 "몇 칸 앞에서 몇 개"로 바꿔 적는 압축'],
  ['거리·길이', 'distance / length', 'lzss', 'lz', 'LZ 복사 지시의 두 값. 몇 칸 앞에서, 몇 바이트를 가져올지'],
  ['창(LZ)', 'window', 'lzss', 'lz', '복사해 올 수 있는 바로 앞 구간. 출력이 늘면 함께 미끄러집니다.'],
  ['LZSS', 'Lempel–Ziv–Storer–Szymanski', 'lzss', 'lzss', '짧은 일치는 그대로 두고 긴 일치만 복사 지시로 적는 LZ 변형'],
  ['플래그 바이트', 'flag byte', 'lzss', 'lzss', '뒤따르는 항목들이 그대로인지 복사인지를 비트 하나씩 적은 바이트'],
  ['허프만 부호', 'Huffman code', 'huffman', 'idea', '자주 나오는 글자에 짧은 비트열을 주는 부호'],
  [
    '접두 부호',
    'prefix code',
    'huffman',
    'prefix',
    '어떤 부호도 다른 부호의 앞부분이 아닌 부호. 구분 기호 없이 읽힙니다',
  ],
  ['트리', 'tree', 'huffman', 'tree', '한 점에서 아래로 갈라져 나가는 자료 구조'],
  ['노드', 'node', 'huffman', 'tree', '트리의 갈림길이나 끝 하나'],
  ['루트', 'root', 'huffman', 'tree', '트리의 맨 위 노드'],
  ['리프', 'leaf', 'huffman', 'tree', '더 갈라지지 않는 끝 노드. 허프만 트리에서는 글자가 리프에 있습니다.'],
  [
    '정규 허프만 부호',
    'canonical Huffman code',
    'huffman',
    'tree',
    '부호 길이만 저장하고 부호는 정한 규칙으로 다시 만드는 방식',
  ],
  ['비트열', 'bitstream', 'huffman', 'bits', '바이트 경계와 상관없이 비트가 이어진 데이터'],
  ['롬 확장', 'ROM expansion', 'sfc/expansion', 'why', '자리가 모자라 롬 파일 자체를 키우는 일'],
  [
    '크기 바이트',
    'ROM size byte',
    'sfc/expansion',
    'header',
    '내부 헤더에 롬 크기를 "1KB × 2의 n제곱"의 n으로 적은 바이트($FFD7)',
  ],
  [
    '플래시 카트리지',
    'flash cartridge',
    'sfc/expansion',
    'compat',
    '롬 파일을 SD 카드에서 읽어 실기에서 돌리는 카트리지',
  ],
  ['에뮬레이터', 'emulator', 'sfc/emulator', 'why', '게임기를 소프트웨어로 흉내 내는 프로그램'],
  ['디버거', 'debugger', 'sfc/emulator', 'breakpoints', '실행을 멈추고 명령, 레지스터, 메모리를 들여다보는 도구'],
  ['중단점', 'breakpoint', 'sfc/emulator', 'breakpoints', '이 주소를 실행·읽기·쓰기하면 멈추라는 표시'],
  ['조건식', 'condition', 'sfc/emulator', 'breakpoints', '중단점이 특정 값일 때만 멈추도록 붙이는 식'],
  ['감시 창', 'Watch', 'sfc/emulator', 'viewers', '주소나 식을 적어 두면 멈출 때마다 그 값을 보여 주는 디버거 창'],
  [
    '쓰기 감시',
    'write watch',
    'sfc/hooking',
    'space',
    '멈추지 않고 그 주소에 값을 쓰는 순간을 기록하는 것. 누가 값을 바꾸는지 찾을 때 씁니다',
  ],
  ['추적 기록', 'trace log', 'sfc/emulator', 'viewers', '실행한 명령을 레지스터와 함께 한 줄씩 남긴 기록'],
  [
    '이벤트 뷰어',
    'event viewer',
    'sfc/emulator',
    'viewers',
    '한 프레임 안에서 레지스터 접근·NMI·DMA가 일어난 위치를 그려 보여 주는 창',
  ],
  ['Lua', 'Lua', 'sfc/emulator', 'lua', 'Mesen 2가 게임과 함께 돌릴 수 있는 작은 프로그래밍 언어'],
  ['콜백', 'callback', 'sfc/emulator', 'lua', '어떤 일이 생기면 불러 달라고 등록해 두는 함수'],
  ['세이브스테이트', 'savestate', 'sfc/emulator', 'lua', '에뮬레이터가 그 순간의 기계 상태를 통째로 저장한 것'],
  ['프레임', 'frame', 'sfc/emulator', 'headless', '화면 한 장. 슈퍼 패미콤은 1초에 약 60프레임을 그립니다.'],
  ['libretro', 'libretro', 'sfc/emulator', 'headless', '여러 에뮬레이터를 같은 함수 모양으로 감싼 규격'],
  ['코어', 'core', 'sfc/emulator', 'headless', 'libretro 규격으로 만든 에뮬레이터 파일'],
  [
    '입력 스크립트',
    'input script',
    'sfc/emulator',
    'headless',
    '몇 번째 프레임에 무엇을 누르고 찍을지 한 줄씩 적은 파일',
  ],
  ['poke', 'poke', 'sfc/emulator', 'headless', '실행 중에 메모리에 값을 직접 써 넣는 것'],
  [
    '치트 코드',
    'cheat code',
    'sfc/emulator',
    'headless',
    '게임 메모리의 값을 강제로 바꾸는 코드. Pro Action Replay 코드는 RAM에 값을 계속 써 넣고, Game Genie 코드는 롬을 읽을 때 값을 바꿔치기합니다',
  ],
  ['덤프(메모리)', 'memory dump', 'sfc/emulator', 'headless', '실행 중인 메모리의 내용을 파일로 저장한 것'],
  ['정확도', 'accuracy', 'sfc/emulator', 'cores', '에뮬레이터가 실제 기계를 얼마나 똑같이 흉내 내는지'],
  [
    '자동 컨트롤러 읽기',
    'auto joypad read',
    'sfc/emulator',
    'cores',
    '수직 귀선 기간에 하드웨어가 컨트롤러 값을 읽어 $4218–$421F에 넣는 기능',
  ],
  ['실기', 'real hardware', 'sfc/emulator', 'hardware', '실제 게임기'],
  [
    '오픈 버스',
    'open bus',
    'sfc/emulator',
    'hardware',
    '아무것도 연결되지 않은 주소를 읽으면 직전에 버스에 실린 값이 나오는 현상',
  ],
  [
    'APU',
    'audio processing unit',
    'sfc/sound',
    'two-cpus',
    '슈퍼 패미콤에서 소리를 맡는 부분. SPC700, ARAM 64KB, S-DSP로 이루어짐',
  ],
  ['SPC700', 'S-SMP', 'sfc/sound', 'two-cpus', '소리 쪽 CPU. 칩 이름은 S-SMP이고 1.024MHz로 돎'],
  [
    'ARAM',
    'audio RAM',
    'sfc/sound',
    'two-cpus',
    'SPC700의 메모리 64KB. 사운드 드라이버, 곡 데이터, 샘플, 에코 버퍼가 모두 여기 들어감',
  ],
  [
    'S-DSP',
    'S-DSP',
    'sfc/sound',
    'two-cpus',
    '샘플을 읽어 음성 여덟 개를 섞고 에코를 더해 32,000Hz 스테레오 소리를 내는 음원 칩',
  ],
  [
    '사운드 드라이버',
    'sound driver',
    'sfc/sound',
    'two-cpus',
    'SPC700에서 돌며 곡 데이터를 읽어 S-DSP 레지스터를 바꾸는 게임의 프로그램',
  ],
  [
    '포트(APU)',
    'APU I/O ports',
    'sfc/sound',
    'ports',
    'S-CPU의 $2140–$2143과 SPC700의 $F4–$F7을 잇는 1바이트 칸 네 개. 쓰는 방향과 읽는 방향이 따로 있음',
  ],
  [
    '핸드셰이크',
    'handshake',
    'sfc/sound',
    'ports',
    '상대가 값을 받았는지 알려고, 같은 값이 되돌아올 때까지 기다리며 주고받는 방식',
  ],
  [
    'IPL 롬',
    'IPL boot ROM',
    'sfc/sound',
    'upload',
    '전원을 켜면 SPC700이 실행하는 64바이트 프로그램. 포트로 데이터를 받아 ARAM에 올림',
  ],
  ['음성(S-DSP)', 'voice', 'sfc/sound', 'dsp', 'S-DSP가 동시에 내는 소리 여덟 개 가운데 하나'],
  [
    '샘플(소리)',
    'sample',
    'sfc/sound',
    'dsp',
    'ARAM에 넣어 둔 악기 소리 한 토막. 소리 파일에서는 한 순간의 값 하나를 뜻하기도 함',
  ],
  ['피치', 'pitch', 'sfc/sound', 'dsp', '샘플을 읽는 빠르기. $1000이면 1초에 32,000샘플'],
  ['엔벨로프', 'envelope', 'sfc/sound', 'dsp', '소리가 시작해서 사라질 때까지의 크기 변화'],
  [
    'ADSR',
    'attack, decay, sustain, release',
    'sfc/sound',
    'dsp',
    '어택·디케이·서스테인·릴리스 네 단계로 엔벨로프를 정하는 방식',
  ],
  ['에코', 'echo', 'sfc/sound', 'dsp', '소리를 ARAM의 에코 버퍼에 적어 두었다가 늦게 다시 섞어 만드는 울림'],
  ['에코 버퍼', 'echo buffer', 'sfc/sound', 'aram', '에코를 위해 잡아 두는 ARAM 자리. 최대 30KB'],
  ['BRR', 'bit rate reduction', 'sfc/sound', 'aram', '16샘플을 9바이트에 담는 S-DSP의 손실 압축 형식'],
  [
    'SPC 파일',
    'SPC file',
    'sfc/sound',
    'spc',
    '곡이 연주되는 한순간의 ARAM, DSP 레지스터, SPC700 레지스터를 그대로 떠 둔 파일',
  ],
  ['반복 구간', 'loop', 'music-loop', 'goal', '인트로 뒤에 끝없이 되풀이되는 부분. loopStart부터 loopEnd 앞까지'],
  ['이음매', 'seam', 'music-loop', 'goal', '반복 재생에서 loopEnd에 닿아 되돌아가는 곳 T. loopStart와 같음'],
  ['주기(반복)', 'period', 'music-loop', 'period', '곡이 같은 자리로 돌아오기까지의 길이. 샘플 수로 셈'],
  ['스펙트럼', 'spectrum', 'music-loop', 'period', '소리를 높이(주파수)마다의 크기로 나눠 본 것'],
  [
    '정규화 상호상관',
    'normalized cross-correlation (NCC)',
    'music-loop',
    'period',
    '두 구간의 모양이 얼마나 같은지 잰 값. 크기가 달라도 모양이 같으면 1',
  ],
  ['이음매 점수', 'seamScore', 'music-loop', 'seam', '이음매 T 앞뒤와 한 주기 뒤의 같은 구간을 견준 정규화 상호상관'],
  [
    '스펙트럼 플럭스',
    'spectral flux',
    'music-loop',
    'seam',
    '주파수마다 소리가 직전보다 커진 만큼을 더한 값. 소리가 갑자기 커지면 큼',
  ],
  ['크로스페이드', 'crossfade', 'music-loop', 'crossfade', '한 소리를 줄이며 다른 소리를 키워 섞는 것'],
  [
    'equal-gain·equal-power',
    '',
    'music-loop',
    'crossfade',
    '크로스페이드 비율. 같은 소리를 섞으면 equal-gain(sin²)은 크기를 지키고 equal-power(sin·cos)는 가운데가 3dB 커짐',
  ],
  ['꼬리', 'tail', 'music-loop', 'tail', '반복 재생 파일에서 loopEnd 뒤에 붙여 두는 0.5초. 재생되지 않음'],
  ['AAC', 'Advanced Audio Coding', 'music-loop', 'tail', '웹에서 흔히 쓰는 손실 압축 소리 형식'],
  [
    '앞 여백(AAC)',
    'priming',
    'music-loop',
    'tail',
    'AAC 파일 맨 앞에 들어가는 2,112샘플. 디코더가 잘라 내야 원래 길이가 됨',
  ],
  [
    'RMS',
    'root mean square',
    'music-loop',
    'segments',
    '값을 제곱해 평균 낸 뒤 제곱근을 구한 것. 소리의 평균 크기를 잴 때 씀',
  ],
  [
    'LUFS',
    'loudness units relative to full scale',
    'music-loop',
    'loudness',
    'BS.1770으로 잰 음량의 단위. 1 LU는 1dB 간격',
  ],
  [
    'K 가중',
    'K-weighting',
    'music-loop',
    'loudness',
    '음량을 잴 때 귀에 맞춰 아주 낮은 소리를 줄이고 높은 소리를 조금 키우는 필터',
  ],
  ['트루 피크', 'true peak', 'music-loop', 'loudness', '샘플 사이에서 파형이 올라가는 것까지 계산한 최댓값'],
  [
    'Web Audio',
    'Web Audio API',
    'music-loop',
    'web',
    '브라우저에서 소리를 메모리에 풀어 두고 다루는 API. 반복 구간을 정할 수 있음',
  ],
  ['자동재생', 'autoplay', 'music-loop', 'web', '사용자가 누르기 전에 소리를 내는 재생. 브라우저가 막을 수 있음'],
  [
    '카드 헤더',
    'card header',
    'nds/filesystem',
    'header',
    'DS 롬의 첫 0x200바이트. 게임 이름과 코드, 두 CPU 프로그램과 파일 표의 위치를 적어 둔 곳',
  ],
  [
    'FNT',
    'File Name Table',
    'nds/filesystem',
    'fnt-fat',
    'DS 롬의 파일 이름 표. 폴더와 이름을 따라가면 파일 번호가 나옵니다',
  ],
  [
    'FAT',
    'File Allocation Table',
    'nds/filesystem',
    'fnt-fat',
    'DS 롬의 파일 위치 표. 파일 번호마다 시작과 끝 위치를 8바이트로 적습니다',
  ],
  ['오버레이', 'overlay', 'nds/filesystem', 'overlay', '필요할 때만 RAM의 같은 자리에 번갈아 올리는 코드 조각'],
  [
    'LZ11',
    'LZ11',
    'nds/text',
    'lz11',
    '닌텐도 DS 게임이 흔히 쓰는 LZSS 압축. 첫 바이트 0x11 뒤에 푼 크기 3바이트가 옵니다',
  ],
  ['바이트코드', 'bytecode', 'nds/text', 'lmg', '게임이 값 하나씩 읽어 실행하는 명령의 줄. 장면 진행을 적는 데 씁니다'],
  [
    '대사 묶음',
    'message run',
    'nds/text',
    'repack',
    '앞뒤로 이어 붙은 대사 블록들. 고스트 트릭 한글패치는 이 안에서만 대사를 옮깁니다',
  ],
  [
    '2D 엔진',
    '2D engine',
    'nds/graphics',
    'tiles',
    'DS에서 타일과 팔레트로 2D 화면을 그리는 회로. A·B 둘이 화면을 하나씩 맡습니다',
  ],
  ['선형 비트맵', 'linear bitmap', 'nds/graphics', 'fonts', '8×8 타일로 자르지 않고 픽셀을 한 줄씩 늘어놓은 그림'],
  [
    'SDAT',
    'sound data archive',
    'nds/sound',
    'sdat',
    '닌텐도 DS 게임이 소리를 모아 두는 파일. 악보·악기 표·파형이 함께 들어 있습니다',
  ],
  [
    'SSEQ',
    'sound sequence',
    'nds/sound',
    'sseq',
    'DS의 악보 형식. 트랙마다 음표·쉼표·악기 같은 명령 바이트가 줄지어 있습니다',
  ],
  ['틱', 'tick', 'nds/sound', 'sseq', '악보의 시간 단위. DS의 SSEQ는 4분음표 하나가 48틱입니다'],
  [
    '포인터 장치',
    'pointer device',
    'nds/emulator',
    'touch',
    'libretro에서 마우스처럼 화면 위 한 점을 넘기는 입력 장치. desmume 코어는 DS 터치를 이것으로 받습니다',
  ],
  ['시험 롬', 'test ROM', 'nds/emulator', 'stage', '확인하려고 일부를 바꿔 만든 롬. 배포하지 않습니다'],
  ['ARM9', 'ARM946E-S', 'nds/cpu', 'two', 'DS에서 게임을 돌리는 CPU. 66MHz'],
  ['ARM7', 'ARM7TDMI', 'nds/cpu', 'two', 'DS에서 소리·터치·무선을 맡는 CPU. 33MHz'],
  ['Thumb', 'Thumb', 'nds/cpu', 'arm-thumb', 'ARM CPU가 쓰는 2바이트짜리 명령 모음. 4바이트 ARM 명령과 오가며 씁니다'],
  ['LCP', 'Largest Contentful Paint', 'music-loop', 'web', '첫 화면에서 가장 큰 요소가 그려지기까지의 시간'],
];

const collator = new Intl.Collator('ko');

export const GLOSSARY: GlossaryEntry[] = RAW.map(([term, en, where, anchor, meaning]) => {
  const [a, b] = where.split('/');
  const chapter = b ? chapterBySlug(a as 'sfc' | 'nds', b) : chapterBySlug('common', a ?? '');
  // Meanings that end in a full sentence get a period; noun phrases stay bare.
  return { term, ...(en ? { en } : {}), meaning: meaning.endsWith('다') ? `${meaning}.` : meaning, chapter, anchor };
}).sort((x, y) => collator.compare(x.term, y.term));

const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
/** Index groups: the 14 basic initial consonants, double ones folded in, then terms that start with Latin or digits. */
export const INITIALS = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ', '영문·숫자'] as const;
const FOLD: Record<string, string> = { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' };
const INITIAL_ID = ['g', 'n', 'd', 'r', 'm', 'b', 's', 'ng', 'j', 'ch', 'k', 't', 'p', 'h', 'latin'];

export function initialOf(term: string): string {
  const cp = term.codePointAt(0) ?? 0;
  if (cp < 0xac00 || cp > 0xd7a3) return '영문·숫자';
  const c = CHOSEONG[Math.floor((cp - 0xac00) / 588)] ?? 'ㄱ';
  return FOLD[c] ?? c;
}

export const initialId = (initial: string) => `initial-${INITIAL_ID[INITIALS.indexOf(initial as never)] ?? 'latin'}`;

/** Entries grouped by initial in index order; Hangul first, as Korean glossaries do. */
export function glossaryGroups() {
  return INITIALS.map(initial => ({ initial, entries: GLOSSARY.filter(e => initialOf(e.term) === initial) })).filter(
    g => g.entries.length > 0,
  );
}

export const entryHref = (e: GlossaryEntry) => `${chapterPath(e.chapter)}#${e.anchor}`;
export const entryChapterLabel = (e: GlossaryEntry) => `${chapterLabel(e.chapter)} ${e.chapter.title}`;

/** Anchor of an entry on the glossary page; guide pages link their terms here. */
export const termId = (e: GlossaryEntry) => `term-${slug(e.term)}`;
export const termHref = (e: GlossaryEntry) => `${GLOSSARY_PATH}#${termId(e)}`;
