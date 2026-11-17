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
  title: '드래곤 퀘스트 4를 5 엔진으로',
  /** Shown in the trail on phones; part of the section title, so the link's name still contains it. */
  short: '해킹 일지',
  path: `${GUIDE_PATH}journal/dq4/`,
  repo: 'https://github.com/perfectacle/sfc-dq4',
  summary:
    '패미콤으로 나온 드래곤 퀘스트 4를 슈퍼 패미콤 드래곤 퀘스트 5의 엔진 위에 옮기는 한글 해킹롬을 만들면서 남긴 기록입니다. 두 게임의 롬을 뜯어보는 데서 시작해 서장과 1장을 끝까지 플레이할 수 있게 되기까지를 11편으로 정리했습니다.',
  parts: [
    {
      slug: 'overview',
      title: '개요',
      summary: '뭘 만들고 있고, 지금 어디까지 됐고, 어떻게 만들고 있는지. 어디부터 읽으면 좋은지.',
    },
    {
      slug: 'dq5-maps',
      title: 'DQ5 엔진 뜯어보기 ① 맵과 걷기',
      summary: '맵은 롬에 어떻게 들어 있을까. 계단과 문, debug 모드, 세계 지도 석 장, 하루는 몇 걸음일까.',
    },
    {
      slug: 'dq5-events',
      title: 'DQ5 엔진 뜯어보기 ② 대사와 사건',
      summary: '마을 사람에게 말을 걸면 무슨 일이 일어날까. Huffman 으로 눌린 대사 3,200개, script 세 종류, 진행 flag.',
    },
    {
      slug: 'dq5-battle',
      title: 'DQ5 엔진 뜯어보기 ③ 전투와 숫자',
      summary: '몇 걸음마다 적이 나올까. 도망과 회심의 일격의 확률, damage 계산, 몬스터와 동료 AI 가 행동을 고르는 법.',
    },
    {
      slug: 'dq5-graphics-sound',
      title: 'DQ5 엔진 뜯어보기 ④ 그림과 소리',
      summary:
        '전투 화면에 몬스터는 몇 마리까지 나올까. 그림자의 정체, 타이틀의 물결, 한글을 넣을 여지, 곡 하나를 틀 때 벌어지는 일.',
    },
    {
      slug: 'originals',
      title: '패미콤 원작과 DS 리메이크 뜯어보기',
      summary:
        '제품판에 남은 장 선택 메뉴, 사라지는 모험의 서, 6-bit 로 눌린 대사, 크리프트의 AI. DS 리메이크에서 가져온 것.',
    },
    {
      slug: 'writing',
      title: '남의 엔진에 끼워 넣기',
      summary:
        '롬을 늘리면 어디가 생길까. 읽는 도구를 뒤집어 쓰는 도구로 만들기, table 을 옮기면 깨지는 까닭, 안 쓰는 메모리 찾기.',
    },
    {
      slug: 'title-menu',
      title: '타이틀, 모험의 서, 이름 입력',
      summary: '용이 나는 한글 타이틀과 서곡, 한글 메뉴, 자모를 조합하는 이름 입력. 그 이름은 누구 이름일까.',
    },
    {
      slug: 'windows',
      title: '한글 window와 메시지',
      summary:
        '가나 한 글자가 tile 하나인 window 에 한글 2,350자를 어떻게 넣을까. Galmuri9, VBlank 와 queue, 받침을 보는 조사.',
    },
    {
      slug: 'environment-sound',
      title: '맵 그림과 소리',
      summary:
        '패미콤 맵을 슈퍼 패미콤 색으로 다시 그리기, 걸어 들어가면 열리는 문, DS 판 곡을 SPC700 의 64KB 에 넣기.',
    },
    {
      slug: 'chapter1',
      title: '서장과 1장',
      summary:
        '새 게임부터 1장 끝까지 장면을 따라가며 걸렸던 문제들. 원작과 다른 점, 호이민의 AI, snes9x 에서만 멈추던 bug.',
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
