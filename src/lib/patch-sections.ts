/**
 * Section titles of the patch pages. The page menu and each section heading read the same entry, so a title is
 * written once. Keys are the section ids, which are also the URL anchors; renaming a key breaks old links.
 */
export const SECTION_TITLES = {
  korean: '한국어로 바뀐 것',
  changes: '한국어로 바뀐 것',
  features: '편의 기능',
  story: '이야기',
  cast: '등장인물',
  play: '진행 방식',
  'battle-system': '전투 시스템',
  scenes: '수련과 선택 장면',
  endings: '엔딩과 특별 장면',
  secrets: '놓치기 쉬운 즐길 거리',
  'patch-notes': '패치 노트',
  making: '롬 분석 노트',
} as const;

export type SectionId = keyof typeof SECTION_TITLES;

/** The page menu entries, in page order. */
export const sectionsOf = (ids: readonly SectionId[]) => ids.map(id => ({ id, label: SECTION_TITLES[id] }));
