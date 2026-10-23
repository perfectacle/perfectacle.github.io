import { GOKUDEN_KAKUSEI, GOKUDEN_TOTSUGEKI, OTOGIRISOU, SMRPG, type RomSpec } from './rom-patch.ts';

/** Every Korean patch page reads its paths, version and credits from here, so a new release changes one entry. */
export interface KrPatch {
  title: string;
  /** Page and asset root, without the trailing slash. */
  path: string;
  /** Japanese release year. */
  year: number;
  /** Every release, newest first; the patch notes and the catalogue card read their versions and dates here. */
  releases: readonly KrRelease[];
  /** The newest release's version, from `releases`. */
  version: string;
  /** The newest release's date (YYYY-MM-DD), from `releases`. */
  released: string;
  /** Download names without the version: `${fileBase}_v1_2`. */
  fileBase: string;
  /** Download names: `${stem}.ips` and the saved ROM, `fileBase` plus the newest version. */
  stem: string;
  spec: RomSpec;
  /** Page look in patch-book.css; each theme ships its own font subset under `fonts/`. */
  theme: 'smrpg' | 'gokuden' | 'kakusei' | 'otogirisou';
  /** Browser UI color, the darkest color of the theme. */
  color: string;
  /** As printed on the Japanese release. */
  copyright: string;
  /** Catalogue card on the patch list. */
  card: { image: string; summary: string };
  /**
   * Background music at `${path}/audio/bgm.m4a`, recorded from the game. Playback repeats
   * loopStart–loopEnd (seconds into the file) after the intro; the file runs past loopEnd so
   * decoder padding never lands inside the loop. `duration` is the source length, which tells
   * a decoder that kept the AAC priming samples apart from one that trimmed them.
   */
  bgm: { title: string; loopStart: number; loopEnd: number; duration: number };
}

export type KrPatchTheme = KrPatch['theme'];

export interface KrRelease {
  version: string;
  /** YYYY-MM-DD */
  date: string;
}

const krPatch = (patch: Omit<KrPatch, 'version' | 'released' | 'stem'>): KrPatch => {
  const [latest] = patch.releases;
  if (!latest) throw new Error(`${patch.title} has no release`);
  return {
    ...patch,
    version: latest.version,
    released: latest.date,
    stem: `${patch.fileBase}_v${latest.version.replaceAll('.', '_')}`,
  };
};

/** One release of a patch; throws for a version the patch never had, so a page cannot show a stray release. */
export const releaseOf = (patch: KrPatch, version: string) => {
  const release = patch.releases.find(r => r.version === version);
  if (!release) throw new Error(`${patch.title} has no v${version}`);
  const [year, month, day] = release.date.split('-').map(Number);
  return {
    ...release,
    id: `release-${version.replaceAll('.', '-')}`,
    latest: release === patch.releases[0],
    dateText: `${year}년 ${month}월 ${day}일`,
  };
};

export const SMRPG_PATCH = krPatch({
  title: '슈퍼 마리오 RPG',
  path: '/games/kr-patches/sfc/super-mario-rpg',
  year: 1996,
  releases: [
    { version: '1.2', date: '2026-10-24' },
    { version: '1.1', date: '2026-10-18' },
    { version: '1.0', date: '2015-03-12' },
  ],
  fileBase: 'Super_Mario_RPG_K',
  spec: SMRPG,
  theme: 'smrpg',
  color: '#2b2d31',
  copyright: '게임 © 1995 Nintendo / SQUARE · 캐릭터 © Nintendo, © SQUARE',
  card: {
    image: 'images/patch/geno_sky_ko_1.webp',
    summary: '스타 피스를 찾아 떠나는 마리오와 동료들의 모험. 대사·메뉴·전투까지 모두 한국어입니다.',
  },
  bgm: { title: '오프닝 데모', loopStart: 26.103562, loopEnd: 133.105813, duration: 133.605813 },
});

export const TOTSUGEKI_PATCH = krPatch({
  title: '드래곤볼 Z 초오공전 돌격편',
  path: '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-totsugeki',
  year: 1995,
  releases: [
    { version: '1.2', date: '2026-10-24' },
    { version: '1.1', date: '2026-10-18' },
    { version: '1.0', date: '2012-12-12' },
  ],
  fileBase: 'Dragon_Ball_Z_Super_Gokuden_Totsugeki_Hen_K',
  spec: GOKUDEN_TOTSUGEKI,
  theme: 'gokuden',
  color: '#0b1a4a',
  copyright: '게임 및 캐릭터 © バードスタジオ/集英社・フジテレビ・東映動画 © BANDAI 1995',
  card: {
    image: 'images/title.webp',
    summary:
      '부르마와 만난 날부터 피콜로 대마왕과의 결전까지, 소년 오공의 모험. 대사·선택지·타이틀·메뉴까지 한국어로 즐깁니다.',
  },
  bgm: { title: '오프닝', loopStart: 9.289438, loopEnd: 60.969979, duration: 61.469979 },
});

export const KAKUSEI_PATCH = krPatch({
  title: '드래곤볼 Z 초오공전 각성편',
  path: '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-kakusei',
  year: 1995,
  releases: [
    { version: '1.3', date: '2026-10-24' },
    { version: '1.2', date: '2026-10-18' },
    { version: '1.1', date: '2016-01-04' },
    { version: '1.0', date: '2011-12-30' },
  ],
  fileBase: 'Dragon_Ball_Z_Super_Gokuden_Kakusei_Hen_K',
  spec: GOKUDEN_KAKUSEI,
  theme: 'kakusei',
  color: '#101829',
  copyright: '게임 및 캐릭터 © バードスタジオ/集英社・フジテレビ・東映動画 © BANDAI 1995',
  card: {
    image: 'images/title.webp',
    summary:
      '제23회 천하제일 무술대회부터 나메크성에서 프리더와의 결전까지, 어른이 된 오공의 모험. 대사·전투·DBZ 퀴즈를 한국어로 즐깁니다.',
  },
  bgm: { title: '플레이어 체인지', loopStart: 31.059604, loopEnd: 76.774708, duration: 77.274708 },
});

export const OTOGIRISOU_PATCH = krPatch({
  title: '제절초',
  path: '/games/kr-patches/sfc/otogirisou',
  year: 1992,
  releases: [
    { version: '1.2', date: '2026-10-24' },
    { version: '1.1', date: '2026-10-18' },
    { version: '1.0', date: '2016-09-29' },
  ],
  fileBase: 'Otogirisou_K',
  spec: OTOGIRISOU,
  theme: 'otogirisou',
  color: '#000000',
  copyright: '게임 © 1992 CHUNSOFT',
  card: {
    image: 'images/scenes/title.webp',
    summary:
      '빗속 숲에서 찾아낸 낡은 저택, 고르는 보기마다 달라지는 이야기. 사운드 노벨의 첫 작품을 플로차트와 장 목록을 더해 한국어로 읽습니다.',
  },
  bgm: { title: 'The Legend of Yellow Flower', loopStart: 117.140542, loopEnd: 244.98075, duration: 245.48075 },
});

/** In catalogue order. */
export const KR_PATCHES = [SMRPG_PATCH, TOTSUGEKI_PATCH, KAKUSEI_PATCH, OTOGIRISOU_PATCH];

/** Platform select; each platform then has its own game list. */
export const KR_PATCH_LIST_PATH = '/games/kr-patches/';
export const KR_PATCH_SFC_PATH = '/games/kr-patches/sfc/';
export const KR_PATCH_SITE_TITLE = '한글패치';

export const downloads = (patch: KrPatch) => {
  const root = `${patch.path}/downloads/${patch.stem}`;
  return {
    ips: `${root}.ips`,
  };
};

/** The toolkit release the notes and the guide were checked against. */
export const KR_PATCH_TOOLKIT_VERSION = 'v0.2.0';
/** Korean README of the toolkit (`krpatch`) at that release. It is the first release that has the Korean docs. */
export const KR_PATCH_TOOLKIT_URL = `https://github.com/perfectacle/kr-patch-toolkit/blob/${KR_PATCH_TOOLKIT_VERSION}/README.ko.md`;

/**
 * Korean README of the patch source on GitHub. The kr-patches folders are named after the last segment of
 * `path` (`snes/super-mario-rpg`). Release tags predate the Korean docs, so this points at main.
 */
export const sourceUrl = (patch: KrPatch) => {
  const dir = patch.path.slice(patch.path.lastIndexOf('/') + 1);
  return `https://github.com/perfectacle/kr-patches/blob/main/snes/${dir}/README.ko.md`;
};

const releaseTag = (patch: KrPatch) => `${patch.path.slice(patch.path.lastIndexOf('/') + 1)}-v${patch.version}`;

/** Korean ROM analysis document at the release tag of `version`, so its addresses match the IPS served here. */
export const analysisUrl = (patch: KrPatch) =>
  `https://github.com/perfectacle/kr-patches/blob/${releaseTag(patch)}/snes/${patch.path.slice(patch.path.lastIndexOf('/') + 1)}/docs/ANALYSIS.md`;

/** e.g. `슈퍼 패미컴 · 1996 · 한글패치 v1.1`. */
export const releaseLabel = (patch: KrPatch, prefix = '한글패치 ') =>
  `슈퍼 패미컴 · ${patch.year}년 발매 · ${prefix}v${patch.version} (${patch.released})`;

export const trail = (patch: KrPatch) => [
  { name: '한글패치', path: KR_PATCH_LIST_PATH },
  { name: '슈퍼 패미컴', path: KR_PATCH_SFC_PATH },
  { name: patch.title, path: `${patch.path}/` },
];

export const formatBytes = (n: number) => `${n.toLocaleString('ko-KR')}바이트`;
