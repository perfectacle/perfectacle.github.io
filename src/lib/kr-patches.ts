import { GHOST_TRICK, type NdsSpec } from './nds-patch.ts';
import { GOKUDEN_KAKUSEI, GOKUDEN_TOTSUGEKI, OTOGIRISOU, SMRPG, type RomSpec } from './rom-patch.ts';

/** What differs by console: list page, folder in perfectacle/kr-patches, patch and ROM file types. */
export const PLATFORMS = {
  sfc: { name: '슈퍼 패미콤', path: '/games/kr-patches/sfc/', folder: 'sfc', patchExt: 'ips', romExt: 'sfc' },
  nds: { name: '닌텐도 DS', path: '/games/kr-patches/nds/', folder: 'nds', patchExt: 'xdelta', romExt: 'nds' },
} as const;

export type Platform = keyof typeof PLATFORMS;

/** Every Korean patch page reads its paths, version and credits from here, so a new release changes one entry. */
interface KrPatchBase {
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
  /** Download names: `${stem}.ips` (or `.xdelta`) and the saved ROM, `fileBase` plus the newest version. */
  stem: string;
  /** Browser UI color, the darkest color of the theme. */
  color: string;
  /** As printed on the Japanese release. */
  copyright: string;
  /** The game's title screen (SFC 256×224, NDS top screen 256×192), shown on the patch list and in link previews. */
  titleScreen: string;
  /** Catalogue card on the patch list; it also opens the page's description in link previews. */
  card: { summary: string };
  /**
   * Background music at `${path}/audio/bgm.m4a`, recorded from the game. Playback repeats
   * loopStart–loopEnd (seconds into the file) after the intro; the file runs past loopEnd so
   * decoder padding never lands inside the loop. `duration` is the source length, which tells
   * a decoder that kept the AAC priming samples apart from one that trimmed them.
   */
  bgm: { title: string; loopStart: number; loopEnd: number; duration: number };
}

export interface SfcPatch extends KrPatchBase {
  platform: 'sfc';
  spec: RomSpec;
  /** Page look in patch-book.css. */
  theme: 'smrpg' | 'gokuden' | 'kakusei' | 'otogirisou';
}

export interface NdsPatch extends KrPatchBase {
  platform: 'nds';
  spec: NdsSpec;
  theme: 'ghost-trick';
}

export type KrPatch = SfcPatch | NdsPatch;

export type KrPatchTheme = KrPatch['theme'];

export interface KrRelease {
  version: string;
  /** YYYY-MM-DD */
  date: string;
}

const krPatch = <P extends KrPatch>(patch: Omit<P, 'version' | 'released' | 'stem'>): P => {
  const [latest] = patch.releases;
  if (!latest) throw new Error(`${patch.title} has no release`);
  return {
    ...patch,
    version: latest.version,
    released: latest.date,
    stem: `${patch.fileBase}_v${latest.version.replaceAll('.', '_')}`,
  } as P;
};

/** Search and link-preview text: what the game is and what reads in Korean, then how to get it. */
export const patchDescription = (patch: KrPatch) =>
  `${patch.card.summary} 일본판 롬파일을 고르면 이 페이지에서 바로 한글패치(v${patch.version})를 적용합니다.`;

/** Patch file (IPS or xdelta) of one release, kept for every version so players can still get an older patch. */
export const releaseIps = (patch: Pick<KrPatch, 'path' | 'fileBase' | 'platform'>, version: string) =>
  `${patch.path}/downloads/${patch.fileBase}_v${version.replaceAll('.', '_')}.${PLATFORMS[patch.platform].patchExt}`;

/** One release of a patch; throws for a version the patch never had, so a page cannot show a stray release. */
export const releaseOf = (patch: KrPatch, version: string) => {
  const release = patch.releases.find(r => r.version === version);
  if (!release) throw new Error(`${patch.title} has no v${version}`);
  const [year, month, day] = release.date.split('-').map(Number);
  return {
    ...release,
    id: `release-${version.replaceAll('.', '-')}`,
    ips: releaseIps(patch, version),
    latest: release === patch.releases[0],
    dateText: `${year}년 ${month}월 ${day}일`,
  };
};

export const SMRPG_PATCH = krPatch<SfcPatch>({
  platform: 'sfc',
  title: '슈퍼 마리오 RPG',
  path: '/games/kr-patches/sfc/super-mario-rpg',
  year: 1996,
  releases: [
    { version: '1.3', date: '2026-10-24' },
    { version: '1.2', date: '2026-10-24' },
    { version: '1.1', date: '2026-10-18' },
    { version: '1.0', date: '2015-03-12' },
  ],
  fileBase: 'Super_Mario_RPG_K',
  spec: SMRPG,
  theme: 'smrpg',
  color: '#2b2d31',
  copyright: '게임 © 1995 Nintendo / SQUARE · 캐릭터 © Nintendo, © SQUARE',
  titleScreen: '/games/kr-patches/catalogue/super-mario-rpg-title.webp',
  card: {
    summary: '스타 피스를 찾아 떠나는 마리오와 동료들의 모험. 대사·메뉴·전투까지 모두 한국어입니다.',
  },
  bgm: { title: '오프닝 데모', loopStart: 26.103562, loopEnd: 133.105813, duration: 133.605813 },
});

export const TOTSUGEKI_PATCH = krPatch<SfcPatch>({
  platform: 'sfc',
  title: '드래곤볼 Z 초오공전 돌격편',
  path: '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-totsugeki',
  year: 1995,
  releases: [
    { version: '1.3', date: '2026-10-25' },
    { version: '1.2', date: '2026-10-24' },
    { version: '1.1', date: '2026-10-18' },
    { version: '1.0', date: '2012-12-12' },
  ],
  fileBase: 'Dragon_Ball_Z_Super_Gokuden_Totsugeki_Hen_K',
  spec: GOKUDEN_TOTSUGEKI,
  theme: 'gokuden',
  color: '#0b1a4a',
  copyright: '게임 및 캐릭터 © バードスタジオ/集英社・フジテレビ・東映動画 © BANDAI 1995',
  titleScreen: '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-totsugeki/images/title.webp',
  card: {
    summary:
      '부르마와 만난 날부터 피콜로 대마왕과의 결전까지, 소년 오공의 모험. 대사·선택지·타이틀·메뉴까지 한국어로 즐깁니다.',
  },
  bgm: { title: '오프닝', loopStart: 9.289438, loopEnd: 60.969979, duration: 61.469979 },
});

export const KAKUSEI_PATCH = krPatch<SfcPatch>({
  platform: 'sfc',
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
  titleScreen: '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-kakusei/images/title.webp',
  card: {
    summary:
      '제23회 천하제일 무술대회부터 나메크성에서 프리더와의 결전까지, 어른이 된 오공의 모험. 대사·전투·DBZ 퀴즈를 한국어로 즐깁니다.',
  },
  bgm: { title: '플레이어 체인지', loopStart: 31.059604, loopEnd: 76.774708, duration: 77.274708 },
});

export const OTOGIRISOU_PATCH = krPatch<SfcPatch>({
  platform: 'sfc',
  title: '제절초',
  path: '/games/kr-patches/sfc/otogirisou',
  year: 1992,
  releases: [
    { version: '1.3', date: '2026-10-25' },
    { version: '1.2', date: '2026-10-24' },
    { version: '1.1', date: '2026-10-18' },
    { version: '1.0', date: '2016-09-29' },
  ],
  fileBase: 'Otogirisou_K',
  spec: OTOGIRISOU,
  theme: 'otogirisou',
  color: '#000000',
  copyright: '게임 © 1992 CHUNSOFT',
  titleScreen: '/games/kr-patches/sfc/otogirisou/images/scenes/title.webp',
  card: {
    summary:
      '빗속 숲에서 찾아낸 낡은 저택, 고르는 보기마다 달라지는 이야기. 사운드 노벨의 첫 작품을 플로차트와 장 목록을 더해 한국어로 읽습니다.',
  },
  bgm: { title: 'The Legend of Yellow Flower', loopStart: 117.140542, loopEnd: 244.98075, duration: 245.48075 },
});

export const GHOST_TRICK_PATCH = krPatch<NdsPatch>({
  platform: 'nds',
  title: '고스트 트릭',
  path: '/games/kr-patches/nds/ghost-trick',
  year: 2010,
  releases: [
    { version: '1.2', date: '2026-10-24' },
    { version: '1.1', date: '2015-11-01' },
  ],
  fileBase: 'Ghost_Trick_K',
  spec: GHOST_TRICK,
  theme: 'ghost-trick',
  color: '#0b0d1a',
  copyright: '게임 © CAPCOM CO., LTD. 2010',
  titleScreen: '/games/kr-patches/nds/ghost-trick/images/title.webp',
  card: {
    summary:
      '기억을 잃은 유령 시셀이 아침이 오기 전에 자신의 죽음의 진실을 쫓는 하룻밤의 이야기. 대사·수첩·메뉴를 한국어로 즐깁니다.',
  },
  bgm: { title: 'BGM054_B', loopStart: 83.590563, loopEnd: 138.460271, duration: 138.960271 },
});

/** Super Famicom patches, in catalogue order. */
export const KR_PATCHES = [SMRPG_PATCH, OTOGIRISOU_PATCH, TOTSUGEKI_PATCH, KAKUSEI_PATCH];

/** Nintendo DS patches, in catalogue order. */
export const NDS_PATCHES = [GHOST_TRICK_PATCH];

/** Every patch page, whatever the console. */
export const ALL_KR_PATCHES: readonly KrPatch[] = [...KR_PATCHES, ...NDS_PATCHES];

/** Platform select; each platform then has its own game list. */
export const KR_PATCH_LIST_PATH = '/games/kr-patches/';
export const KR_PATCH_SFC_PATH = PLATFORMS.sfc.path;
export const KR_PATCH_NDS_PATH = PLATFORMS.nds.path;
export const KR_PATCH_SITE_TITLE = '한글패치';

export const downloads = (patch: KrPatch) => ({ ips: releaseIps(patch, patch.version) });

/** The toolkit release the notes and the guide were checked against. */
export const KR_PATCH_TOOLKIT_VERSION = 'v0.4.0';
/** A file of the toolkit at that release, by its path in the repository. */
export const toolkitFileUrl = (path: string) =>
  `https://github.com/perfectacle/kr-patch-toolkit/blob/${KR_PATCH_TOOLKIT_VERSION}/${path}`;
/** Korean README of the toolkit (`krpatch`) at that release. It is the first release that has the Korean docs. */
export const KR_PATCH_TOOLKIT_URL = toolkitFileUrl('README.ko.md');

/** Game folder in perfectacle/kr-patches: the console folder, then the last segment of `path`. */
const sourceDir = (patch: KrPatch) => `${PLATFORMS[patch.platform].folder}/${patchSlug(patch)}`;

const patchSlug = (patch: KrPatch) => patch.path.slice(patch.path.lastIndexOf('/') + 1);

/** Release tag of a patch version in kr-patches, such as `otogirisou-v1.2`. */
export const releaseTag = (patch: KrPatch, version = patch.version) => `${patchSlug(patch)}-v${version}`;

/**
/**
 * A file of the patch source on GitHub at `ref` (`main` or a release tag), by its path inside the game's folder
 * (`tools/build.sh`); a path ending in `/` is a folder.
 */
export const patchFileUrl = (patch: KrPatch, ref: string, file: string) =>
  `https://github.com/perfectacle/kr-patches/${file.endsWith('/') ? 'tree' : 'blob'}/${ref}/${sourceDir(patch)}/${file}`;

/** A file of the patch source on main. Release tags predate the Korean docs, so links to them go here. */
export const sourceFileUrl = (patch: KrPatch, file: string) => patchFileUrl(patch, 'main', file);

/** Korean README of the patch source on GitHub. */
export const sourceUrl = (patch: KrPatch) => sourceFileUrl(patch, 'README.ko.md');

/** Korean ROM analysis document at the release tag of `version`, so its addresses match the IPS served here. */
export const analysisUrl = (patch: KrPatch) => patchFileUrl(patch, releaseTag(patch), 'docs/ANALYSIS.md');

/** e.g. `슈퍼 패미콤 · 1996 · 한글패치 v1.1`. */
export const releaseLabel = (patch: KrPatch, prefix = '한글패치 ') =>
  `${PLATFORMS[patch.platform].name} · ${patch.year}년 발매 · ${prefix}v${patch.version} (${patch.released})`;

export const trail = (patch: KrPatch) => [
  { name: '한글패치', path: KR_PATCH_LIST_PATH },
  { name: PLATFORMS[patch.platform].name, path: PLATFORMS[patch.platform].path },
  { name: patch.title, path: `${patch.path}/` },
];

// MB here is 1,048,576 bytes (strictly MiB): ROM sizes are powers of two, and players know them as 2MB, 4MB.
export const formatBytes = (n: number) => `${+(n / 1048576).toFixed(2)}MB(${n.toLocaleString('ko-KR')}바이트)`;
