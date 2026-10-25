import {
  ALL_KR_PATCHES,
  GHOST_TRICK_PATCH,
  KAKUSEI_PATCH,
  KR_PATCH_TOOLKIT_URL,
  PLATFORMS,
  OTOGIRISOU_PATCH,
  SMRPG_PATCH,
  TOTSUGEKI_PATCH,
  type KrPatch,
} from '../../lib/kr-patches.ts';

/**
 * Chapters of the ROM hacking guide. Pages, the index map, previous/next links and the sitemap all read this list, so a
 * new chapter is one entry here plus its page under src/pages/games/romhacking/.
 */

export const GUIDE_PATH = '/games/romhacking/';
export const GUIDE_TITLE = '롬 해킹 기초';
export const TOOLKIT_README_KO = KR_PATCH_TOOLKIT_URL;

/** `common` chapters apply to any console; the rest live under `/games/romhacking/<platform>/`. */
export type GuidePlatform = 'common' | 'sfc' | 'nds';

export const PLATFORM_LABEL: Record<GuidePlatform, string> = { common: '공통', sfc: '슈퍼 패미콤', nds: '닌텐도 DS' };

export interface NoteLink {
  patch: KrPatch;
  /** `making` for the whole note, or one of the note's section headings. */
  id: string;
  /** What the section shows, without the game's name: lists that mix games add it with `noteLabel`. */
  label: string;
}

/** A game whose note has nothing for a chapter, and why, so the empty cell in the index table explains itself. */
export interface NoteGap {
  patch: KrPatch;
  why: string;
}

export interface ToolLink {
  command: string;
  /** Heading anchor in the toolkit's README.ko.md as GitHub renders it (without `user-content-`). */
  anchor: string;
}

export interface GuideChapter {
  order: number;
  slug: string;
  platform: GuidePlatform;
  title: string;
  summary: string;
  /** Unwritten chapters appear in the map without a link. */
  ready: boolean;
  notes: NoteLink[];
  /** Every game without a note link above. */
  gaps?: NoteGap[];
  tools: ToolLink[];
}

const note = (patch: KrPatch, id: string, label: string): NoteLink => ({ patch, id, label });
const gap = (patch: KrPatch, why: string): NoteGap => ({ patch, why });

export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    order: 0,
    slug: 'rom-patch',
    platform: 'common',
    title: '롬과 패치',
    summary:
      '롬은 카트리지 칩을 통째로 옮긴 파일이고, 패치는 바뀐 곳만 적은 파일입니다. IPS 형식을 바이트 단위로 읽어 봅니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-about', '일본판 위에 v1.0·v1.1·v1.2를 쌓은 순서'),
      note(TOTSUGEKI_PATCH, 'making-tools', '패치 소스 파일과 빌드 순서'),
      note(OTOGIRISOU_PATCH, 'making', '1MB 롬을 2MB로 늘린 한글패치'),
      note(KAKUSEI_PATCH, 'making-about', 'v1.1 위에 쌓은 v1.2·v1.3'),
      note(KAKUSEI_PATCH, 'making-tools', '패치 소스 파일과 빌드 순서'),
      note(SMRPG_PATCH, 'making-about', 'v1.0 위에 덧씌운 v1.1·v1.2·v1.3'),
      note(SMRPG_PATCH, 'making-tools', '패치 소스 파일과 빌드 순서'),
      note(OTOGIRISOU_PATCH, 'making-about', '버전마다 고친 곳'),
      note(OTOGIRISOU_PATCH, 'making-tools', 'v1.0 IPS 위에 다시 빌드하기'),
      note(GHOST_TRICK_PATCH, 'making-xdelta', '128MB 롬과 xdelta 패치'),
      note(GHOST_TRICK_PATCH, 'making-about', 'v1.1 xdelta 위에 다시 만든 v1.2'),
    ],
    tools: [{ command: 'krpatch ips', anchor: 'ips-ips-패치-생성적용' }],
  },
  {
    order: 1,
    slug: 'numbers',
    platform: 'common',
    title: '비트·바이트·16진수',
    summary: '비트 여덟 개가 바이트 하나입니다. 2진수와 16진수, 음수와 체크섬까지 숫자를 읽는 법을 익힙니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-basics', '롬 헤더 바이트 읽기'),
      note(KAKUSEI_PATCH, 'making-save', '암호의 16비트 합계'),
      note(OTOGIRISOU_PATCH, 'making-save', '세이브 슬롯의 체크섬'),
      note(SMRPG_PATCH, 'making-save', '세이브 슬롯을 지키는 16비트 체크섬'),
      note(GHOST_TRICK_PATCH, 'making-font', '픽셀 네 개가 든 2비트 바이트'),
    ],
    tools: [{ command: 'krpatch sfc checksum', anchor: 'sfc-checksum-헤더-체크섬-확인수정' }],
  },
  {
    order: 2,
    slug: 'endian',
    platform: 'common',
    title: '엔디안',
    summary: '2바이트 숫자를 메모리에 놓을 때 어느 쪽 바이트를 먼저 적을까요? 롬에서 주소가 거꾸로 보이는 이유입니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-dialogue', '대사는 뱅크 밖으로 못 나간다'),
      note(OTOGIRISOU_PATCH, 'making-script', '대본'),
      note(KAKUSEI_PATCH, 'making-save', '합계를 아래·위 바이트로 적는 암호'),
      note(KAKUSEI_PATCH, 'making-dialogue', '거꾸로 적힌 글자 코드와 포인터'),
      note(OTOGIRISOU_PATCH, 'making-save', '세이브의 24비트 위치'),
      note(SMRPG_PATCH, 'making-dialogue', '뱅크 머리말과 포인터를 거꾸로 읽기'),
      note(GHOST_TRICK_PATCH, 'making-script', 'u16 글자와 u32 포인터'),
    ],
    tools: [{ command: 'krpatch diff', anchor: 'diff-두-파일이-다른-바이트-범위' }],
  },
  {
    order: 3,
    slug: 'cpu',
    platform: 'sfc',
    title: 'CPU와 65c816',
    summary:
      'CPU는 명령을 한 줄씩 읽어 실행하는 일꾼입니다. 슈퍼 패미콤의 65c816이 가진 레지스터와 8/16비트 전환을 봅니다.',
    ready: true,
    notes: [
      note(SMRPG_PATCH, 'making-basics', 'CPU가 둘, S-CPU와 SA-1'),
      note(SMRPG_PATCH, 'making-battle', '전투 메뉴는 SA-1이 따로 그린다'),
    ],
    gaps: [
      gap(TOTSUGEKI_PATCH, '노트에 CPU 구조를 다룬 절이 없습니다. 명령을 하나씩 읽는 예는 5장에 있습니다.'),
      gap(KAKUSEI_PATCH, '노트에 CPU 구조를 다룬 절이 없습니다. 명령을 하나씩 읽는 예는 5장에 있습니다.'),
      gap(OTOGIRISOU_PATCH, '노트에 CPU 구조를 다룬 절이 없습니다. 명령을 하나씩 읽는 예는 5장에 있습니다.'),
      gap(GHOST_TRICK_PATCH, '코드를 고치지 않고 데이터만 바꾼 패치입니다. DS의 두 CPU는 20장에서 다룹니다.'),
    ],
    tools: [{ command: 'krpatch sfc dis', anchor: 'sfc-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 4,
    slug: 'banks',
    platform: 'sfc',
    title: '주소와 뱅크',
    summary:
      '$80:8000은 "80번 책의 8000쪽"입니다. LoROM·HiROM·SA-1이 롬 파일을 CPU 주소에 어떻게 펼치는지 계산해 봅니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-dialogue', '대사는 뱅크 밖으로 못 나간다'),
      note(TOTSUGEKI_PATCH, 'making-map', '롬 지도와 LoROM 주소'),
      note(SMRPG_PATCH, 'making-map', '롬 지도와 주소 읽는 법'),
      note(OTOGIRISOU_PATCH, 'making-basics', '배경지식'),
      note(KAKUSEI_PATCH, 'making-basics', '주소 읽는 법'),
      note(KAKUSEI_PATCH, 'making-map', '롬 지도'),
      note(OTOGIRISOU_PATCH, 'making-map', '세 롬의 뱅크 지도'),
    ],
    gaps: [gap(GHOST_TRICK_PATCH, 'DS 롬은 파일 시스템으로 나뉘어 있어 주소 대신 파일 이름으로 찾습니다(15장).')],
    tools: [{ command: 'krpatch sfc dis', anchor: 'sfc-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 5,
    slug: 'assembly',
    platform: 'sfc',
    title: '어셈블리 기초',
    summary: 'LDA·STA·분기·JSR을 하나씩 읽고, 패치 노트에 나온 코드 조각을 직접 해석합니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-testing', '디버그 메뉴를 여는 두 바이트'),
      note(SMRPG_PATCH, 'making-basics', '전투 디버그 메뉴를 여는 한 바이트'),
      note(KAKUSEI_PATCH, 'making-debug-menu', '디버그 메뉴를 여는 두 바이트'),
      note(OTOGIRISOU_PATCH, 'making-unique', '후킹 지점의 원래 바이트와 바꾼 바이트'),
      note(OTOGIRISOU_PATCH, 'making-select', 'Select를 보게 바꾼 5바이트'),
    ],
    gaps: [gap(GHOST_TRICK_PATCH, '코드를 고치지 않았습니다. 고스트 트릭의 ARM 코드를 읽는 법은 21장에서 다룹니다.')],
    tools: [{ command: 'krpatch sfc dis', anchor: 'sfc-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 6,
    slug: 'hooking',
    platform: 'sfc',
    title: '후킹',
    summary:
      '원래 코드 몇 바이트를 점프 명령으로 바꿔 새 코드로 건너갔다 돌아오게 합니다. 덮어쓴 명령을 다시 실행하는 법과 빈 공간 찾기까지 다룹니다.',
    ready: true,
    notes: [
      note(OTOGIRISOU_PATCH, 'making-wordwrap', '단어 단위 줄바꿈'),
      note(TOTSUGEKI_PATCH, 'making-font-ext', '글자 칸을 512개 늘리기'),
      note(TOTSUGEKI_PATCH, 'making-menus', '습득·완료 표시를 두 글자로 바꾼 루틴'),
      note(SMRPG_PATCH, 'making-slots', '필요한 글자만 올리는 임시 칸'),
      note(SMRPG_PATCH, 'making-unique', '메뉴 폰트에 없는 글자 띄우기'),
      note(SMRPG_PATCH, 'making-menus', '새 이름 표를 읽게 하는 후킹'),
      note(SMRPG_PATCH, 'making-ui', '원판부터 어색했던 화면'),
      note(SMRPG_PATCH, 'making-name-entry', '원판 연출 루틴 중간으로 들어가기'),
      note(OTOGIRISOU_PATCH, 'making-name-entry', '폰트 디코더의 뱅크를 고르는 4바이트'),
      note(OTOGIRISOU_PATCH, 'making-space', '코드를 둔 자리'),
      note(KAKUSEI_PATCH, 'making-bugfix', '우주선이 맵 밖을 헤매던 이유'),
      note(KAKUSEI_PATCH, 'making-map', '남은 빈 공간'),
      note(KAKUSEI_PATCH, 'making-password', '새 암호 문장으로 건너가는 루틴'),
      note(OTOGIRISOU_PATCH, 'making-unique', '원작에 없던 기능 끼워 넣기'),
    ],
    gaps: [
      gap(GHOST_TRICK_PATCH, '패치는 코드를 고치지 않았습니다. 고스트 트릭 코드에 훅을 거는 실험은 22장에 있습니다.'),
    ],
    tools: [{ command: 'krpatch sfc dis', anchor: 'sfc-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 7,
    slug: 'graphics',
    platform: 'sfc',
    title: '그림과 글자',
    summary:
      '화면은 8×8 타일을 이어 붙인 그림입니다. 타일 바이트를 비트평면으로 읽는 법과 팔레트, 한글 수천 자를 좁은 폰트 칸에 넣는 방법을 봅니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-font', '폰트 칸이 모자랐다'),
      note(TOTSUGEKI_PATCH, 'making-font-ext', '글자 칸을 512개 늘리기'),
      note(TOTSUGEKI_PATCH, 'making-save', '헷갈리던 8px 암호 글자 다시 그리기'),
      note(OTOGIRISOU_PATCH, 'making-font', '글자표를 눈으로 읽게 하기'),
      note(SMRPG_PATCH, 'making-font', '메뉴 폰트와 대사 폰트, 왜 v1.0은 이름을 영문으로 뒀나'),
      note(SMRPG_PATCH, 'making-gfx', '새로 그린 그림은 글자뿐'),
      note(SMRPG_PATCH, 'making-slots', '필요한 글자만 올리는 임시 칸'),
      note(SMRPG_PATCH, 'making-name-entry', '플레이어가 짓는 이름에 완성형 2,350자'),
      note(OTOGIRISOU_PATCH, 'making-name-entry', '다른 뱅크에 둔 새 글자 그룹'),
      note(KAKUSEI_PATCH, 'making-font', '폰트에 없는 글자'),
      note(KAKUSEI_PATCH, 'making-gfx', '타이틀 그림의 타일 순서'),
      note(OTOGIRISOU_PATCH, 'making-gfx', 'DMA로 그대로 보내는 v1.0 그래픽'),
      note(GHOST_TRICK_PATCH, 'making-font', '2bpp 대사 폰트의 픽셀 순서 찾기'),
    ],
    tools: [
      { command: 'krpatch sfc tiles', anchor: 'sfc-tiles-planar-타일-렌더링' },
      { command: 'krpatch sfc bg', anchor: 'sfc-bg-sfc-bgrefs-vramcgram-덤프에서-bg-레이어' },
    ],
  },
  {
    order: 8,
    slug: 'text',
    platform: 'sfc',
    title: '대사는 어떻게 저장되나',
    summary:
      '글자표는 숫자와 글자의 사전, 포인터 표는 목차입니다. 제어 코드와 이어진 대본, 번역이 길어졌을 때 옮길 자리를 봅니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-dialogue', '대사는 뱅크 밖으로 못 나간다'),
      note(TOTSUGEKI_PATCH, 'making-menus', '대사 밖의 포인터 표 열 개'),
      note(TOTSUGEKI_PATCH, 'making-unique', '이벤트 표 끝의 숨은 205번째 줄'),
      note(KAKUSEI_PATCH, 'making-dialogue', '대사가 롬에 들어 있는 모양'),
      note(KAKUSEI_PATCH, 'making-relocate', '늘어난 대사는 같은 뱅크 안으로'),
      note(OTOGIRISOU_PATCH, 'making-script', '대사가 들어 있는 방식'),
      note(SMRPG_PATCH, 'making-dialogue', '두 단계 포인터와 대사 속 아이템 이름'),
      note(SMRPG_PATCH, 'making-particles', '조사 자동 선택'),
      note(KAKUSEI_PATCH, 'making-menus', '전투 말풍선과 엔딩 크레딧'),
      note(KAKUSEI_PATCH, 'making-password', '두 글자를 1바이트로 읽는 암호 쌍 표'),
      note(OTOGIRISOU_PATCH, 'making-menus', '선택지와 이름 입력 화면'),
      note(SMRPG_PATCH, 'making-name-entry', '자모로 조합하는 이름 입력'),
      note(OTOGIRISOU_PATCH, 'making-name-entry', '자모로 조합하는 이름 입력'),
      note(GHOST_TRICK_PATCH, 'making-script', '1LMG 스크립트의 대사 블록과 포인터'),
      note(GHOST_TRICK_PATCH, 'making-repack', '길어진 대사를 묶음 안에서 다시 배치하기'),
      note(GHOST_TRICK_PATCH, 'making-wrap', '창 폭 13자·16자 실측'),
    ],
    tools: [{ command: 'krpatch sfc dis', anchor: 'sfc-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 9,
    slug: 'lzss',
    platform: 'common',
    title: '압축 ① RLE·LZSS',
    summary:
      'RLE는 "같은 바이트를 몇 번", LZSS는 "몇 칸 앞에서 몇 바이트"로 데이터를 줄입니다. 플래그 바이트와 거리·길이를 실제 롬 바이트로 풀어 봅니다.',
    ready: true,
    notes: [
      note(KAKUSEI_PATCH, 'making-title-gfx', '압축된 타이틀 그림'),
      note(TOTSUGEKI_PATCH, 'making-gfx', '압축된 타이틀 글자 층'),
      note(GHOST_TRICK_PATCH, 'making-lz11', 'LZ11로 압축된 스크립트'),
    ],
    gaps: [
      gap(SMRPG_PATCH, '압축된 그림을 바꾸지 않았습니다. 새로 그린 글자는 압축하지 않은 그대로 들어갑니다.'),
      gap(OTOGIRISOU_PATCH, '압축된 것은 그림이 아니라 일본판 대본이고, 형식은 허프만입니다(10장).'),
    ],
    tools: [{ command: 'krpatch lzss', anchor: 'lzss-lzss-코덱' }],
  },
  {
    order: 10,
    slug: 'huffman',
    platform: 'common',
    title: '압축 ② 허프만',
    summary:
      '자주 나오는 글자에 짧은 비트를 주는 압축입니다. 트리를 만들어 부호를 얻고, 제절초 일본판 대본의 비트열을 한 비트씩 읽어 봅니다.',
    ready: true,
    notes: [note(OTOGIRISOU_PATCH, 'making-script', '대사가 들어 있는 방식')],
    gaps: [
      gap(SMRPG_PATCH, '대사는 글자마다 1바이트나 2바이트 코드로 적혀 있습니다.'),
      gap(TOTSUGEKI_PATCH, '대사는 글자마다 2바이트 코드로 적혀 있습니다.'),
      gap(KAKUSEI_PATCH, '대사는 글자마다 2바이트 코드로 적혀 있습니다.'),
      gap(GHOST_TRICK_PATCH, '허프만 압축을 쓰지 않습니다. 스크립트는 LZ11로 압축되어 있습니다(9장).'),
    ],
    tools: [],
  },
  {
    order: 11,
    slug: 'expansion',
    platform: 'sfc',
    title: '롬 확장',
    summary:
      '롬을 늘리면 헤더의 크기 바이트, 미러, 체크섬이 함께 바뀝니다. 매핑마다 늘릴 수 있는 한계와, 늘리지 않고 자리를 만드는 방법을 봅니다.',
    ready: true,
    notes: [
      note(OTOGIRISOU_PATCH, 'making', '1MB 롬을 2MB로 늘린 한글패치'),
      note(OTOGIRISOU_PATCH, 'making-space', '코드를 둔 자리'),
      note(OTOGIRISOU_PATCH, 'making-map', '크기 바이트를 고치지 않았던 v1.0'),
      note(SMRPG_PATCH, 'making-space', '롬을 4MB보다 키우지 않은 이유'),
      note(SMRPG_PATCH, 'making-save', '세이브 슬롯과 체크섬'),
      note(KAKUSEI_PATCH, 'making-bugfix', '우주선이 맵 밖을 헤매던 이유'),
      note(KAKUSEI_PATCH, 'making-map', '롬을 늘리지 않고 넣은 자리'),
      note(TOTSUGEKI_PATCH, 'making-map', '롬을 늘리지 않고 빈 곳에 넣기'),
      note(GHOST_TRICK_PATCH, 'making-rom', '커진 파일을 롬 끝으로 옮기고 파일 표 고치기'),
    ],
    tools: [{ command: 'krpatch sfc checksum', anchor: 'sfc-checksum-헤더-체크섬-확인수정' }],
  },
  {
    order: 12,
    slug: 'emulator',
    platform: 'sfc',
    title: '에뮬레이터로 확인',
    summary:
      '중단점으로 "어디서 읽나"를 잡고, 입력 스크립트로 같은 장면을 되풀이해 찍고, 정확도가 다른 여러 에뮬레이터에서 같은 결과가 나오는지 봅니다.',
    ready: true,
    notes: [
      note(OTOGIRISOU_PATCH, 'making-lap2', '2회차에 멈추던 이유'),
      note(OTOGIRISOU_PATCH, 'making-testing', '확인은 에뮬레이터가'),
      note(SMRPG_PATCH, 'making-testing', '확인은 에뮬레이터가'),
      note(SMRPG_PATCH, 'making-next', '확인하지 않은 것과 알려진 한계'),
      note(TOTSUGEKI_PATCH, 'making-testing', '확인은 에뮬레이터가'),
      note(TOTSUGEKI_PATCH, 'making-unique', '이벤트 표 문제를 장면마다 재현'),
      note(TOTSUGEKI_PATCH, 'making-next', '확인하지 않은 것과 알려진 한계'),
      note(KAKUSEI_PATCH, 'making-testing', '확인은 에뮬레이터가'),
      note(KAKUSEI_PATCH, 'making-debug-menu', '디버그 메뉴를 여는 두 바이트'),
      note(KAKUSEI_PATCH, 'making-next', '확인하지 못한 것'),
      note(OTOGIRISOU_PATCH, 'making-next', '확인하지 못한 것과 알려진 한계'),
      note(GHOST_TRICK_PATCH, 'making-testing', 'libretro 코어로 장면을 되풀이해 찍기'),
    ],
    tools: [
      { command: 'krpatch sfc run', anchor: 'sfc-run-헤드리스-libretro-실행기' },
      { command: 'krpatch sfc lua', anchor: 'sfc-lua-mesen-2mesence-스크립트' },
      { command: 'krpatch shotcmp', anchor: 'shotcmp-contact-스크린샷을-텍스트로' },
    ],
  },
  {
    order: 13,
    slug: 'sound',
    platform: 'sfc',
    title: '소리 ① 슈퍼 패미콤 사운드 구조',
    summary:
      '본체 CPU와 따로 도는 소리 전용 CPU(SPC700)와 음원 칩(S-DSP), 둘이 값을 주고받는 포트 $2140–$2143을 봅니다.',
    ready: true,
    notes: [
      note(OTOGIRISOU_PATCH, 'making-scene-music', '장으로 옮길 때 배경과 음악'),
      note(OTOGIRISOU_PATCH, 'making-readers', '대본을 읽는 손이 셋'),
      note(SMRPG_PATCH, 'making-slots', '필요한 글자만 올리는 임시 칸'),
    ],
    gaps: [
      gap(TOTSUGEKI_PATCH, '버전마다 바꾼 곳에 소리가 없어 노트에서 다루지 않습니다.'),
      gap(
        KAKUSEI_PATCH,
        '버전마다 바꾼 곳에 소리가 없어 노트에서 다루지 않습니다. 곡 표와 곡 재생 함수는 이 장 본문에 있습니다.',
      ),
      gap(GHOST_TRICK_PATCH, 'DS의 소리 구조는 이 장과 다릅니다. 음악은 SDAT 시퀀스로 들어 있습니다(18장).'),
    ],
    tools: [{ command: 'krpatch sfc lua', anchor: 'sfc-lua-mesen-2mesence-스크립트' }],
  },
  {
    order: 14,
    slug: 'music-loop',
    platform: 'common',
    title: '소리 ② 게임 음악 뽑아 끊김 없이 반복하기',
    summary: '곡 하나만 나오게 해서 녹음하고, 반복 구간을 찾아 이음매를 다듬어 웹에서 끊김 없이 반복 재생합니다.',
    ready: true,
    notes: [
      note(OTOGIRISOU_PATCH, 'making-scene-music', '장으로 옮길 때 배경과 음악'),
      note(GHOST_TRICK_PATCH, 'making-bgm', '녹음 대신 시퀀스를 합성해 만든 루프'),
    ],
    gaps: [
      gap(
        SMRPG_PATCH,
        '노트에 음악을 다룬 절이 없습니다. 패치 페이지에서 나오는 배경 음악을 이 장의 방법으로 만들었습니다.',
      ),
      gap(
        TOTSUGEKI_PATCH,
        '노트에 음악을 다룬 절이 없습니다. 패치 페이지에서 나오는 배경 음악을 이 장의 방법으로 만들었습니다.',
      ),
      gap(
        KAKUSEI_PATCH,
        '노트에 음악을 다룬 절이 없습니다. 패치 페이지에서 나오는 배경 음악을 이 장의 방법으로 만들었습니다.',
      ),
    ],
    tools: [
      { command: 'krpatch audio', anchor: 'audio-녹음에서-반복-재생용-파일-만들기' },
      { command: 'krpatch sfc run --wav', anchor: 'sfc-run-헤드리스-libretro-실행기' },
    ],
  },
  {
    order: 15,
    slug: 'filesystem',
    platform: 'nds',
    title: '롬과 파일 시스템',
    summary:
      'DS 카드 롬은 폴더와 파일이 든 디스크입니다. 카드 헤더에서 두 CPU의 프로그램과 파일 표를 찾고, 파일 이름에서 롬 위치까지 따라가 봅니다.',
    ready: true,
    notes: [
      note(GHOST_TRICK_PATCH, 'making-basics', '주소가 아니라 파일'),
      note(GHOST_TRICK_PATCH, 'making-map', '카드 헤더와 파일 표 두 개'),
      note(GHOST_TRICK_PATCH, 'making-rom', '파일 이름으로 찾고 다시 묶기'),
      note(GHOST_TRICK_PATCH, 'making-xdelta', '0xFF를 잘라 낸 롬 되돌리기'),
    ],
    gaps: [
      gap(TOTSUGEKI_PATCH, '슈퍼 패미콤 롬에는 파일 시스템이 없습니다. 데이터는 CPU 주소로 찾습니다(4장).'),
      gap(KAKUSEI_PATCH, '슈퍼 패미콤 롬에는 파일 시스템이 없습니다. 데이터는 CPU 주소로 찾습니다(4장).'),
      gap(OTOGIRISOU_PATCH, '슈퍼 패미콤 롬에는 파일 시스템이 없습니다. 데이터는 CPU 주소로 찾습니다(4장).'),
      gap(SMRPG_PATCH, '슈퍼 패미콤 롬에는 파일 시스템이 없습니다. 데이터는 CPU 주소로 찾습니다(4장).'),
    ],
    tools: [
      { command: 'krpatch nds info', anchor: 'nds-info-nds-ls-헤더와-파일' },
      { command: 'krpatch nds unpack', anchor: 'nds-unpack-nds-pack-파일시스템을-폴더로-다시-롬으로' },
    ],
  },
  {
    order: 16,
    slug: 'text',
    platform: 'nds',
    title: '대사는 어떻게 저장되나',
    summary:
      '고스트 트릭의 대사는 장면 파일 안, 장면 진행 명령 사이에 2바이트 값으로 들어 있습니다. LZ11을 풀고, 글자와 제어 코드를 읽고, 명령 안의 포인터를 따라가 봅니다.',
    ready: true,
    notes: [
      note(GHOST_TRICK_PATCH, 'making-dialogue', '장면 파일 안의 대사'),
      note(GHOST_TRICK_PATCH, 'making-lz11', 'LZ11로 압축된 스크립트'),
      note(GHOST_TRICK_PATCH, 'making-script', '1LMG 스크립트의 대사와 포인터'),
      note(GHOST_TRICK_PATCH, 'making-repack', '묶음 안에서 이어 쓰고 포인터 고치기'),
      note(GHOST_TRICK_PATCH, 'making-wrap', '창 폭 13자·16자 실측'),
    ],
    gaps: [
      gap(TOTSUGEKI_PATCH, '슈퍼 패미콤 롬의 대사는 파일이 아니라 롬 안 주소에 있습니다. 8장에서 다룹니다.'),
      gap(KAKUSEI_PATCH, '슈퍼 패미콤 롬의 대사는 파일이 아니라 롬 안 주소에 있습니다. 8장에서 다룹니다.'),
      gap(OTOGIRISOU_PATCH, '슈퍼 패미콤 롬의 대사는 파일이 아니라 롬 안 주소에 있습니다. 8장에서 다룹니다.'),
      gap(SMRPG_PATCH, '슈퍼 패미콤 롬의 대사는 파일이 아니라 롬 안 주소에 있습니다. 8장에서 다룹니다.'),
    ],
    tools: [
      { command: 'krpatch lz11', anchor: 'lz11-닌텐도-lz10lz11-코덱' },
      { command: 'krpatch nds unpack', anchor: 'nds-unpack-nds-pack-파일시스템을-폴더로-다시-롬으로' },
    ],
  },
  {
    order: 17,
    slug: 'graphics',
    platform: 'nds',
    title: '그림과 글자',
    summary:
      'DS의 2D 그림도 타일과 팔레트지만 픽셀을 바이트에 붙여 담습니다. 게임이 정한 그림 형식과 폰트를 읽고, 2비트 픽셀 넷의 순서를 그려 보며 찾습니다.',
    ready: true,
    notes: [
      note(GHOST_TRICK_PATCH, 'making-font', '폰트 세 개와 2bpp 픽셀 순서 4, 6, 0, 2'),
      note(GHOST_TRICK_PATCH, 'making-gfx', '그래픽 묶음 cpac_2d·cpac_3d'),
      note(GHOST_TRICK_PATCH, 'making-title', '타이틀 그림 sdt.의 문구 지우기'),
    ],
    gaps: [
      gap(TOTSUGEKI_PATCH, '슈퍼 패미콤 게임의 타일과 폰트는 7장에서 다룹니다.'),
      gap(KAKUSEI_PATCH, '슈퍼 패미콤 게임의 타일과 폰트는 7장에서 다룹니다.'),
      gap(OTOGIRISOU_PATCH, '슈퍼 패미콤 게임의 타일과 폰트는 7장에서 다룹니다.'),
      gap(SMRPG_PATCH, '슈퍼 패미콤 게임의 타일과 폰트는 7장에서 다룹니다.'),
    ],
    tools: [{ command: 'krpatch linear', anchor: 'linear-선형-비트맵' }],
  },
  {
    order: 18,
    slug: 'sound',
    platform: 'nds',
    title: '소리 ③ 닌텐도 DS 사운드 구조',
    summary:
      'DS의 소리는 ARM7이 채널 16개로 울립니다. 음악 파일 SDAT의 악보(SSEQ)·악기 표·파형을 따라가고, 악보의 명령 바이트를 하나씩 읽어 틱이 시간이 되는 과정을 봅니다.',
    ready: true,
    notes: [note(GHOST_TRICK_PATCH, 'making-bgm', 'SSEQ 시퀀스를 합성해 만든 반복 음악')],
    gaps: [
      gap(TOTSUGEKI_PATCH, '슈퍼 패미콤의 소리 구조는 13장에서 다룹니다.'),
      gap(KAKUSEI_PATCH, '슈퍼 패미콤의 소리 구조는 13장에서 다룹니다.'),
      gap(OTOGIRISOU_PATCH, '슈퍼 패미콤의 소리 구조는 13장에서 다룹니다.'),
      gap(SMRPG_PATCH, '슈퍼 패미콤의 소리 구조는 13장에서 다룹니다.'),
    ],
    tools: [{ command: 'krpatch nds unpack', anchor: 'nds-unpack-nds-pack-파일시스템을-폴더로-다시-롬으로' }],
  },
  {
    order: 19,
    slug: 'emulator',
    platform: 'nds',
    title: '에뮬레이터로 확인',
    summary:
      'desmume libretro 코어를 화면 없이 돌려 입력 스크립트로 같은 장면을 되풀이해 찍습니다. 터치를 포인터 값으로 바꾸고, 세이브 스테이트와 시험 롬으로 뒤쪽 장면에 바로 갑니다.',
    ready: true,
    notes: [
      note(GHOST_TRICK_PATCH, 'making-testing', '입력 스크립트·터치·뒤쪽 장면 시험 롬'),
      note(GHOST_TRICK_PATCH, 'making-wrap', '시험 문장 롬으로 창 폭 재기'),
      note(GHOST_TRICK_PATCH, 'making-save', '판마다 남긴 기록을 v1.2에서 이어 하기'),
    ],
    gaps: [
      gap(TOTSUGEKI_PATCH, '슈퍼 패미콤 게임의 에뮬레이터 확인은 12장에서 다룹니다.'),
      gap(KAKUSEI_PATCH, '슈퍼 패미콤 게임의 에뮬레이터 확인은 12장에서 다룹니다.'),
      gap(OTOGIRISOU_PATCH, '슈퍼 패미콤 게임의 에뮬레이터 확인은 12장에서 다룹니다.'),
      gap(SMRPG_PATCH, '슈퍼 패미콤 게임의 에뮬레이터 확인은 12장에서 다룹니다.'),
    ],
    tools: [
      { command: 'krpatch sfc run(같은 libretro 연결부, 슈퍼 패미콤용)', anchor: 'sfc-run-헤드리스-libretro-실행기' },
    ],
  },
  {
    order: 20,
    slug: 'cpu',
    platform: 'nds',
    title: 'CPU와 메모리',
    summary:
      'DS에는 게임을 돌리는 ARM9와 소리·터치를 맡는 ARM7이 있습니다. ARM과 Thumb 두 벌의 명령, 두 CPU의 메모리 지도, 고스트 트릭 프로그램이 메인 RAM에 놓이는 자리를 봅니다.',
    ready: true,
    notes: [
      note(GHOST_TRICK_PATCH, 'making-basics', 'CPU 둘과 메인 RAM 4MB'),
      note(GHOST_TRICK_PATCH, 'making-map', 'ARM9·ARM7 프로그램과 오버레이는 그대로'),
    ],
    gaps: [
      gap(TOTSUGEKI_PATCH, '슈퍼 패미콤의 CPU는 3장에서 다룹니다.'),
      gap(KAKUSEI_PATCH, '슈퍼 패미콤의 CPU는 3장에서 다룹니다.'),
      gap(OTOGIRISOU_PATCH, '슈퍼 패미콤의 CPU는 3장에서 다룹니다.'),
      gap(SMRPG_PATCH, '슈퍼 패미콤의 CPU는 3장에서 다룹니다.'),
    ],
    tools: [{ command: 'krpatch nds info', anchor: 'nds-info-nds-ls-헤더와-파일' }],
  },
  {
    order: 21,
    slug: 'assembly',
    platform: 'nds',
    title: 'ARM 어셈블리 기초',
    summary:
      'ARM 명령 4바이트를 읽고, 조건 실행·리터럴 풀·시프트 붙은 주소·BL과 LR을 살펴보고, 고스트 트릭의 글꼴 고르기 함수를 한 줄씩 실행해 봅니다. 문자열에서 거슬러 올라가 함수를 찾는 법도 다룹니다.',
    ready: true,
    notes: [note(GHOST_TRICK_PATCH, 'making-rom', '파일 이름으로 찾으니 번호가 바뀌어도 괜찮은 이유')],
    gaps: [
      gap(TOTSUGEKI_PATCH, '슈퍼 패미콤의 65c816 어셈블리는 5장에서 다룹니다.'),
      gap(KAKUSEI_PATCH, '슈퍼 패미콤의 65c816 어셈블리는 5장에서 다룹니다.'),
      gap(OTOGIRISOU_PATCH, '슈퍼 패미콤의 65c816 어셈블리는 5장에서 다룹니다.'),
      gap(SMRPG_PATCH, '슈퍼 패미콤의 65c816 어셈블리는 5장에서 다룹니다.'),
    ],
    tools: [{ command: 'krpatch nds unpack', anchor: 'nds-unpack-nds-pack-파일시스템을-폴더로-다시-롬으로' }],
  },
  {
    order: 22,
    slug: 'hooking',
    platform: 'nds',
    title: 'ARM 후킹',
    summary:
      '압축된 ARM9 프로그램을 풀어 고치고 다시 압축해 넣는 순서, BL 계산, 덮어쓴 명령을 다시 실행하는 훅을 고스트 트릭 글꼴 함수로 만들어 에뮬레이터로 확인합니다.',
    ready: true,
    notes: [note(GHOST_TRICK_PATCH, 'making-map', '다시 묶은 롬의 ARM9 뒤 빈 곳')],
    gaps: [
      gap(TOTSUGEKI_PATCH, '슈퍼 패미콤의 후킹은 6장에서 다룹니다.'),
      gap(KAKUSEI_PATCH, '슈퍼 패미콤의 후킹은 6장에서 다룹니다.'),
      gap(OTOGIRISOU_PATCH, '슈퍼 패미콤의 후킹은 6장에서 다룹니다.'),
      gap(SMRPG_PATCH, '슈퍼 패미콤의 후킹은 6장에서 다룹니다.'),
    ],
    tools: [{ command: 'krpatch nds unpack', anchor: 'nds-unpack-nds-pack-파일시스템을-폴더로-다시-롬으로' }],
  },
];

export const chapterPath = (c: Pick<GuideChapter, 'platform' | 'slug'>) =>
  c.platform === 'common' ? `${GUIDE_PATH}${c.slug}/` : `${GUIDE_PATH}${c.platform}/${c.slug}/`;

/** A chapter's page by its number, for prose that refers to 「N장」. */
export const chapterHref = (order: number) => {
  const chapter = GUIDE_CHAPTERS.find(c => c.order === order);
  if (!chapter?.ready) throw new Error(`No written chapter ${order}`);
  return chapterPath(chapter);
};

export const chapterBySlug = (platform: GuidePlatform, slug: string) => {
  const chapter = GUIDE_CHAPTERS.find(c => c.platform === platform && c.slug === slug);
  if (!chapter) throw new Error(`Unknown guide chapter ${platform}/${slug}`);
  return chapter;
};

export const readyChapters = () => GUIDE_CHAPTERS.filter(c => c.ready);

/** Previous and next written chapters, in reading order. */
export const neighbours = (chapter: GuideChapter) => {
  const ready = readyChapters();
  const i = ready.findIndex(c => c.order === chapter.order);
  return { prev: ready[i - 1], next: ready[i + 1] };
};

/** Each game's ROM analysis note lives in the guide under its console, next to the chapters that explain its ideas. */
export const notesPath = (patch: KrPatch) => `${GUIDE_PATH}${PLATFORMS[patch.platform].folder}/notes/`;
export const noteSlug = (patch: KrPatch) => patch.path.slice(patch.path.lastIndexOf('/') + 1);
export const notePath = (patch: KrPatch) => `${notesPath(patch)}${noteSlug(patch)}/`;
export const NOTE_PATCHES = ALL_KR_PATCHES;

export const noteHref = (n: NoteLink) => (n.id === 'making' ? notePath(n.patch) : `${notePath(n.patch)}#${n.id}`);

/** The short name the guide calls each game by in lists that mix games. */
export const NOTE_GAME: Record<KrPatch['theme'], string> = {
  smrpg: '슈퍼 마리오 RPG',
  gokuden: '돌격편',
  kakusei: '각성편',
  otogirisou: '제절초',
  'ghost-trick': '고스트 트릭',
};

export const noteLabel = (n: NoteLink) => `${NOTE_GAME[n.patch.theme]}: ${n.label}`;

/** Written chapters by game: each cell holds that game's note sections for the chapter, or why there are none. */
export const noteGrid = () =>
  readyChapters().map(chapter => ({
    chapter,
    cells: NOTE_PATCHES.map(patch => ({
      patch,
      notes: chapter.notes.filter(n => n.patch === patch),
      gap: chapter.gaps?.find(g => g.patch === patch)?.why,
    })),
  }));

/** Written chapters whose ideas a note section uses: the reverse of each chapter's `notes`. */
export const chaptersForNote = (patch: KrPatch, id?: string) =>
  readyChapters().filter(c => c.notes.some(n => n.patch === patch && (id === undefined || n.id === id)));

export const toolHref = (t: ToolLink) => `${TOOLKIT_README_KO}#${encodeURIComponent(t.anchor)}`;

export const chapterLabel = (c: Pick<GuideChapter, 'order'>) => `${c.order}장`;
