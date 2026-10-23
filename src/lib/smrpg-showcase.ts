import type { VersionGroup } from './version-pairs';

/**
 * Each pair is the same moment captured with the same input on the Japanese original and the Korean version.
 * Summaries and captions are spoken by the page's guide, Toad, in his polite in-game voice.
 */
export const compareGroups: VersionGroup[] = [
  {
    id: 'battle',
    title: '전투와 메뉴',
    summary: '전투 명령, 적 이름, 아이템, 필살기 설명까지 한국어예요.',
    pairs: [
      { id: 'battle', caption: '전투 명령과 적 이름도 한국어예요.', alt: '전투 명령을 고르는 화면' },
      {
        id: 'specials',
        caption: '필살기 설명을 읽으면 버튼을 누를 때를 알 수 있어요.',
        alt: '필살기 설명이 보이는 메뉴',
      },
    ],
  },
];
