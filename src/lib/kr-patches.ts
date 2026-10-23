import { GOKUDEN_KAKUSEI, GOKUDEN_TOTSUGEKI, OTOGIRISOU, SMRPG, type RomSpec } from './rom-patch.ts';

/** Every Korean patch page reads its paths, version and credits from here, so a new release changes one entry. */
export interface KrPatch {
  title: string;
  /** Page and asset root, without the trailing slash. */
  path: string;
  /** Japanese release year. */
  year: number;
  version: string;
  /** Release date of `version` (YYYY-MM-DD), shown on the catalogue card. */
  released: string;
  /** Download names: `${stem}.ips`, `${stem}_Headered.ips`, `${stem}_tools.zip`, and the saved ROM. */
  stem: string;
  /** Whether a separate IPS for copier-headered files is published. */
  headeredIps: boolean;
  spec: RomSpec;
  /** Page look in patch-book.css; each theme ships its own font subset under `fonts/`. */
  theme: 'smrpg' | 'gokuden' | 'kakusei' | 'otogirisou';
  /** Browser UI color, the darkest color of the theme. */
  color: string;
  /** As printed on the Japanese release. */
  copyright: string;
  /** Catalogue card on the patch list. */
  card: { image: string; summary: string };
}

export type KrPatchTheme = KrPatch['theme'];

export const SMRPG_PATCH: KrPatch = {
  title: '슈퍼 마리오 RPG',
  path: '/games/kr-patches/sfc/super-mario-rpg',
  year: 1996,
  version: '1.2',
  released: '2026-10-23',
  stem: 'Super_Mario_RPG_K_v1_2',
  headeredIps: false,
  spec: SMRPG,
  theme: 'smrpg',
  color: '#2b2d31',
  copyright: '게임 © 1995 Nintendo / SQUARE · 캐릭터 © Nintendo, © SQUARE',
  card: {
    image: 'images/patch/geno_sky_ko_1.webp',
    summary: '스타 피스를 찾아 떠나는 마리오와 동료들의 모험. 대사·메뉴·전투까지 모두 한국어입니다.',
  },
};

export const TOTSUGEKI_PATCH: KrPatch = {
  title: '드래곤볼 Z 초오공전 돌격편',
  path: '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-totsugeki',
  year: 1995,
  version: '1.2',
  released: '2026-10-23',
  stem: 'Dragon_Ball_Z_Super_Gokuden_Totsugeki_Hen_K_v1_2',
  headeredIps: true,
  spec: GOKUDEN_TOTSUGEKI,
  theme: 'gokuden',
  color: '#0b1a4a',
  copyright: '게임 및 캐릭터 © バードスタジオ/集英社・フジテレビ・東映動画 © BANDAI 1995',
  card: {
    image: 'images/title.webp',
    summary:
      '부르마와 만난 날부터 피콜로 대마왕과의 결전까지, 소년 오공의 모험. 대사·선택지·타이틀·메뉴까지 한국어로 즐깁니다.',
  },
};

export const KAKUSEI_PATCH: KrPatch = {
  title: '드래곤볼 Z 초오공전 각성편',
  path: '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-kakusei',
  year: 1995,
  version: '1.3',
  released: '2026-10-22',
  stem: 'Dragon_Ball_Z_Super_Gokuden_Kakusei_Hen_K_v1_3',
  headeredIps: true,
  spec: GOKUDEN_KAKUSEI,
  theme: 'kakusei',
  color: '#101829',
  copyright: '게임 및 캐릭터 © バードスタジオ/集英社・フジテレビ・東映動画 © BANDAI 1995',
  card: {
    image: 'images/title.webp',
    summary:
      '제23회 천하제일 무술대회부터 나메크성에서 프리더와의 결전까지, 어른이 된 오공의 모험. 대사·전투·DBZ 퀴즈를 한국어로 즐깁니다.',
  },
};

export const OTOGIRISOU_PATCH: KrPatch = {
  title: '제절초',
  path: '/games/kr-patches/sfc/otogirisou',
  year: 1992,
  version: '1.2',
  released: '2026-10-22',
  stem: 'Otogirisou_K_v1_2',
  headeredIps: true,
  spec: OTOGIRISOU,
  theme: 'otogirisou',
  color: '#000000',
  copyright: '게임 © 1992 CHUNSOFT',
  card: {
    image: 'images/scenes/title.webp',
    summary:
      '빗속 숲에서 찾아낸 낡은 저택, 고르는 보기마다 달라지는 이야기. 사운드 노벨의 첫 작품을 플로차트와 장 목록을 더해 한국어로 읽습니다.',
  },
};

/** In catalogue order. */
export const KR_PATCHES = [SMRPG_PATCH, TOTSUGEKI_PATCH, KAKUSEI_PATCH, OTOGIRISOU_PATCH];

export const KR_PATCH_LIST_PATH = '/games/kr-patches/';
export const KR_PATCH_SITE_TITLE = '한글패치';

export const downloads = (patch: KrPatch) => {
  const root = `${patch.path}/downloads/${patch.stem}`;
  return {
    ips: `${root}.ips`,
    headeredIps: patch.headeredIps ? `${root}_Headered.ips` : undefined,
    tools: `${root}_tools.zip`,
  };
};

/** e.g. `슈퍼 패미컴 · 1996 · 한글패치 v1.1`. */
export const releaseLabel = (patch: KrPatch, prefix = '한글패치 ') =>
  `슈퍼 패미컴 · ${patch.year}년 발매 · ${prefix}v${patch.version} (${patch.released})`;

export const trail = (patch: KrPatch) => [
  { name: '한글패치', path: KR_PATCH_LIST_PATH },
  { name: patch.title, path: `${patch.path}/` },
];

export const formatBytes = (n: number) => `${n.toLocaleString('ko-KR')}바이트`;
