import { GUIDE_PATH } from './chapters.ts';

/**
 * A hacking journal follows one project from start to finish, one page per subject. Unlike a ROM analysis note it is
 * not tied to a released patch, so it has no version or patch page.
 */
export interface JournalPart {
  /** Last segment of the page address; published, so it never changes. */
  slug: string;
  title: string;
  summary: string;
}

export const JOURNAL_SECTION_TITLE = '해킹 일지';
export const JOURNAL_SECTION_PATH = `${GUIDE_PATH}#journal`;

export const DQ4_JOURNAL = {
  title: '드래곤 퀘스트 IV를 V 엔진으로',
  /** Shown in the trail on phones; part of the section title, so the link's name still contains it. */
  short: '해킹 일지',
  path: `${GUIDE_PATH}journal/dq4/`,
  repo: 'https://github.com/perfectacle/sfc-dq4',
  summary:
    '패미콤판 「드래곤 퀘스트 IV」를 슈퍼 패미콤 「드래곤 퀘스트 V」 엔진 위에 옮기는 한글 해킹롬을 만들며 남긴 기록입니다. 두 원작의 롬을 읽는 데서 시작해 1장을 끝까지 걸을 수 있게 되기까지를 주제마다 한 편으로 묶었습니다.',
  parts: [
    {
      slug: 'overview',
      title: '개요',
      summary: '무엇을 만드는지, 왜 V의 엔진 위인지, 어떤 롬과 도구로 어떤 원칙을 지키며 일했는지.',
    },
    {
      slug: 'dq5-maps',
      title: 'V 엔진 읽기 ① 맵과 걷기',
      summary: '맵 형식과 셀 속성, 출구와 문, 필드와 탈것, 맵 위에 인물을 놓는 표.',
    },
    {
      slug: 'dq5-events',
      title: 'V 엔진 읽기 ② 대사와 사건',
      summary: '글자와 제어 코드, 인물 스크립트 명령, 진행 flag, 사건 전투와 보물 상자.',
    },
    {
      slug: 'dq5-battle',
      title: 'V 엔진 읽기 ③ 전투와 숫자',
      summary: '몬스터와 조우, 행동을 고르는 방식, 피해 식과 성장, 주문과 가게.',
    },
    {
      slug: 'dq5-graphics-sound',
      title: 'V 엔진 읽기 ④ 그림과 소리',
      summary: '인물과 몬스터 그림, 팔레트, 창이 그려지는 레이어, 타이틀 연출, 사운드 드라이버와 곡 형식.',
    },
    {
      slug: 'originals',
      title: '패미콤 원작과 DS 리메이크 읽기',
      summary: '패미콤판의 뱅크 호출과 대사 압축, 맵과 사건, 옮겨 올 숫자들. DS 리메이크에서 참고한 이름과 그림과 곡.',
    },
    {
      slug: 'writing',
      title: '엔진에 써 넣기',
      summary: '읽은 형식을 거꾸로 쓰는 도구, 표와 자리 늘리기, 새 맵 그룹과 후킹, 빌드와 롬 쓰기 장부.',
    },
    {
      slug: 'title-menu',
      title: '타이틀, 모험의 서, 이름 입력',
      summary: '한글 타이틀과 연출, 서곡, 한글 메뉴, 자모를 조합하는 이름 입력.',
    },
    {
      slug: 'windows',
      title: '한글 창과 메시지',
      summary: '창 글꼴과 타일 자리, 이름과 목록 창, 받침에 맞춘 조사, 전투 메시지.',
    },
    {
      slug: 'environment-sound',
      title: '맵 그림과 소리',
      summary: '타일과 블록 시트, 문과 물, 필드. DS 곡을 슈퍼 패미콤 사운드 메모리에 맞추기와 효과음.',
    },
    {
      slug: 'chapter1',
      title: '서장과 1장',
      summary: '새 게임부터 1장 끝까지의 사건, 인물 그림, 원작 수치, 가게, 헤드리스 검사와 에뮬레이터 호환성.',
    },
  ] satisfies JournalPart[],
} as const;

export type Journal = typeof DQ4_JOURNAL;

export const JOURNALS: Journal[] = [DQ4_JOURNAL];

export const journalPartPath = (journal: Journal, part: JournalPart) => `${journal.path}${part.slug}/`;

/** 「3편」: parts are numbered from the overview, which is part 0. */
export const journalPartLabel = (journal: Journal, part: JournalPart) =>
  `${journal.parts.findIndex(p => p.slug === part.slug)}편`;

/** Throws for a slug the journal does not list, so a page cannot be published outside the contents. */
export function journalPart(journal: Journal, slug: string): JournalPart {
  const part = journal.parts.find(p => p.slug === slug);
  if (!part) throw new Error(`${journal.title} has no part "${slug}"`);
  return part;
}
