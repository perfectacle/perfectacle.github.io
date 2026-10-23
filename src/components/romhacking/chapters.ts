import { KAKUSEI_PATCH, OTOGIRISOU_PATCH, SMRPG_PATCH, TOTSUGEKI_PATCH, type KrPatch } from '../../lib/kr-patches.ts';

/**
 * Chapters of the ROM hacking guide. Pages, the index map, previous/next links and the sitemap all read this list, so a
 * new chapter is one entry here plus its page under src/pages/games/romhacking/.
 */

export const GUIDE_PATH = '/games/romhacking/';
export const GUIDE_TITLE = '롬 해킹 기초';
export const TOOLKIT_README_KO = 'https://github.com/perfectacle/kr-patch-toolkit/blob/main/README.ko.md';

/** `common` chapters apply to any console; the rest live under `/games/romhacking/<platform>/`. */
export type GuidePlatform = 'common' | 'snes' | 'nds';

export const PLATFORM_LABEL: Record<GuidePlatform, string> = { common: '공통', snes: '슈퍼 패미컴', nds: '닌텐도 DS' };

export interface NoteLink {
  patch: KrPatch;
  /** An id that exists on the patch page: `making` or one of its section headings. */
  id: string;
  label: string;
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
  tools: ToolLink[];
}

const note = (patch: KrPatch, id: string, label: string): NoteLink => ({ patch, id, label });

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
      note(TOTSUGEKI_PATCH, 'making-tools', '돌격편: 패치 소스 파일과 빌드 순서'),
      note(OTOGIRISOU_PATCH, 'making', '제절초: 1MB 롬을 2MB로 늘린 한글판'),
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
    notes: [note(TOTSUGEKI_PATCH, 'making-basics', '돌격편: 배경지식')],
    tools: [{ command: 'krpatch snes checksum', anchor: 'snes-checksum-헤더-체크섬-확인수정' }],
  },
  {
    order: 2,
    slug: 'endian',
    platform: 'common',
    title: '엔디안',
    summary: '2바이트 숫자를 메모리에 놓을 때 어느 쪽 바이트를 먼저 적을까요? 롬에서 주소가 거꾸로 보이는 이유입니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-dialogue', '돌격편: 대사는 뱅크 밖으로 못 나간다'),
      note(OTOGIRISOU_PATCH, 'making-script', '제절초: 대본'),
    ],
    tools: [{ command: 'krpatch diff', anchor: 'diff-두-파일이-다른-바이트-범위' }],
  },
  {
    order: 3,
    slug: 'cpu',
    platform: 'snes',
    title: 'CPU와 65c816',
    summary:
      'CPU는 명령을 한 줄씩 읽어 실행하는 일꾼입니다. 슈퍼 패미컴의 65c816이 가진 레지스터와 8/16비트 전환을 봅니다.',
    ready: true,
    notes: [note(SMRPG_PATCH, 'making-basics', '슈퍼 마리오 RPG: CPU가 둘, S-CPU와 SA-1')],
    tools: [{ command: 'krpatch snes dis', anchor: 'snes-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 4,
    slug: 'banks',
    platform: 'snes',
    title: '주소와 뱅크',
    summary:
      '$80:8000은 "80번 책의 8000쪽"입니다. LoROM·HiROM·SA-1이 롬 파일을 CPU 주소에 어떻게 펼치는지 계산해 봅니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-dialogue', '돌격편: 대사는 뱅크 밖으로 못 나간다'),
      note(SMRPG_PATCH, 'making-basics', '슈퍼 마리오 RPG: 주소 읽는 법'),
      note(OTOGIRISOU_PATCH, 'making-basics', '제절초: 배경지식'),
    ],
    tools: [{ command: 'krpatch snes dis', anchor: 'snes-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 5,
    slug: 'assembly',
    platform: 'snes',
    title: '어셈블리 기초',
    summary: 'LDA·STA·분기·JSR을 하나씩 읽고, 패치 노트에 나온 코드 조각을 직접 해석합니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-basics', '돌격편: 어셈블리, 필요한 만큼만'),
      note(SMRPG_PATCH, 'making-basics', '슈퍼 마리오 RPG: 전투 디버그 메뉴를 여는 한 바이트'),
      note(KAKUSEI_PATCH, 'making-basics', '각성편: 배경지식'),
    ],
    tools: [{ command: 'krpatch snes dis', anchor: 'snes-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 6,
    slug: 'hooking',
    platform: 'snes',
    title: '후킹',
    summary:
      '원래 코드 몇 바이트를 점프 명령으로 바꿔 새 코드로 건너갔다 돌아오게 합니다. 덮어쓴 명령을 다시 실행하는 법과 빈 공간 찾기까지 다룹니다.',
    ready: true,
    notes: [
      note(OTOGIRISOU_PATCH, 'making-wordwrap', '제절초: 단어 단위 줄바꿈'),
      note(TOTSUGEKI_PATCH, 'making-font-ext', '돌격편: 글자 칸을 512개 늘리기'),
      note(SMRPG_PATCH, 'making-slots', '슈퍼 마리오 RPG: 필요한 글자만 올리는 임시 칸'),
      note(OTOGIRISOU_PATCH, 'making-space', '제절초: 코드를 둔 자리'),
      note(KAKUSEI_PATCH, 'making-bugfix', '각성편: 우주선이 맵 밖을 헤매던 이유'),
    ],
    tools: [{ command: 'krpatch snes dis', anchor: 'snes-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 7,
    slug: 'graphics',
    platform: 'snes',
    title: '그림과 글자',
    summary:
      '화면은 8×8 타일을 이어 붙인 그림입니다. 타일 바이트를 비트평면으로 읽는 법과 팔레트, 한글 수천 자를 좁은 폰트 칸에 넣는 방법을 봅니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-font', '돌격편: 폰트 칸이 모자랐다'),
      note(TOTSUGEKI_PATCH, 'making-font-ext', '돌격편: 글자 칸을 512개 늘리기'),
      note(OTOGIRISOU_PATCH, 'making-font', '제절초: 글자표를 눈으로 읽게 하기'),
      note(SMRPG_PATCH, 'making-font', '슈퍼 마리오 RPG: 왜 v1.0은 이름을 영문으로 뒀나'),
      note(SMRPG_PATCH, 'making-slots', '슈퍼 마리오 RPG: 필요한 글자만 올리는 임시 칸'),
      note(KAKUSEI_PATCH, 'making-font', '각성편: 폰트에 없는 글자'),
    ],
    tools: [
      { command: 'krpatch snes tiles', anchor: 'snes-tiles-planar-타일-렌더링' },
      { command: 'krpatch snes bg', anchor: 'snes-bg-snes-bgrefs-vramcgram-덤프에서-bg-레이어' },
    ],
  },
  {
    order: 8,
    slug: 'text',
    platform: 'snes',
    title: '대사는 어떻게 저장되나',
    summary:
      '글자표는 숫자와 글자의 사전, 포인터 표는 목차입니다. 제어 코드와 이어진 대본, 번역이 길어졌을 때 옮길 자리를 봅니다.',
    ready: true,
    notes: [
      note(TOTSUGEKI_PATCH, 'making-dialogue', '돌격편: 대사는 뱅크 밖으로 못 나간다'),
      note(KAKUSEI_PATCH, 'making-dialogue', '각성편: 대사가 롬에 들어 있는 모양'),
      note(KAKUSEI_PATCH, 'making-relocate', '각성편: 늘어난 대사는 같은 뱅크 안으로'),
      note(OTOGIRISOU_PATCH, 'making-script', '제절초: 대사가 들어 있는 방식'),
      note(SMRPG_PATCH, 'making-dialogue', '슈퍼 마리오 RPG: 대사 속 아이템 이름'),
    ],
    tools: [{ command: 'krpatch snes dis', anchor: 'snes-dis-65c816-코드-디스어셈블' }],
  },
  {
    order: 9,
    slug: 'lzss',
    platform: 'common',
    title: '압축 ① RLE·LZSS',
    summary: '"같은 것 반복"과 "앞에서 본 것 다시"로 데이터를 줄이는 법입니다.',
    ready: false,
    notes: [],
    tools: [],
  },
  {
    order: 10,
    slug: 'huffman',
    platform: 'common',
    title: '압축 ② 허프만',
    summary: '자주 나오는 글자에 짧은 부호를 주는 압축입니다.',
    ready: false,
    notes: [],
    tools: [],
  },
  {
    order: 11,
    slug: 'expansion',
    platform: 'snes',
    title: '롬 확장',
    summary: '책장에 칸을 더 붙이듯 롬을 늘리는 방법과 그 한계입니다.',
    ready: false,
    notes: [],
    tools: [],
  },
  {
    order: 12,
    slug: 'emulator',
    platform: 'snes',
    title: '에뮬레이터로 확인',
    summary: '디버거로 "어디서 읽나"를 잡고, 여러 에뮬레이터에서 같은 결과가 나오는지 봅니다.',
    ready: false,
    notes: [],
    tools: [],
  },
];

export const chapterPath = (c: Pick<GuideChapter, 'platform' | 'slug'>) =>
  c.platform === 'common' ? `${GUIDE_PATH}${c.slug}/` : `${GUIDE_PATH}${c.platform}/${c.slug}/`;

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

export const noteHref = (n: NoteLink) => `${n.patch.path}/#${n.id}`;

export const toolHref = (t: ToolLink) => `${TOOLKIT_README_KO}#${encodeURIComponent(t.anchor)}`;

export const chapterLabel = (c: Pick<GuideChapter, 'order'>) => `${c.order}장`;
