import type { VersionPair } from './version-pairs';

/** Dialogue and notes sit on the DS bottom screen, so every capture here is that screen alone. */
const BOTTOM = 192;

/** Each pair is the same moment captured with the same input on the Japanese ROM and the Korean patch. */
export const ghostTrickPairs: VersionPair[] = [
  {
    id: 'narration',
    caption: '제1장 첫 장면. 기억을 잃은 시셀이 쓰레기장에서 처음 보는 광경을 내레이션으로 읽습니다.',
    alt: '쓰레기장에서 붉은 머리 여자와 총을 든 남자를 비추는 내레이션',
    height: BOTTOM,
  },
  {
    id: 'missile',
    caption: '처음 보는 《사자의 세계》에 놀라는 강아지 미사일.',
    alt: '빨갛게 멈춘 방에서 놀라 묻는 포메라니안 미사일',
    height: BOTTOM,
  },
  {
    id: 'madam',
    caption: '이웃집 마담이 혼자 술잔을 드는 장면.',
    alt: '와인 잔을 든 마담이 이웃에게 건배하는 대사',
    height: BOTTOM,
  },
  {
    id: 'guard',
    caption: '형무소 교도관실의 대화.',
    alt: '교도관실에서 교도관이 대답하는 장면',
    height: BOTTOM,
  },
  {
    id: 'phone',
    caption: '전화선 이동 화면. 안내 문구와 「돌아가기」 버튼 그림도 한국어입니다.',
    alt: '다이얼 전화기 옆에 어디로 이동할지 묻는 문구와 돌아가기 버튼',
    height: BOTTOM,
  },
];

export const ghostTrickVersions = [
  { key: 'v11', label: 'v1.1' },
  { key: 'v12', label: 'v1.2' },
];

/** The same moment on v1.1 and v1.2, started from the same scene with the same input. */
export const ghostTrickV12Pairs: VersionPair[] = [
  {
    id: 'untranslated',
    caption: '첫 컷신. v1.1에서 일본어로 남아 있던 린네의 대사를 한국어로 옮겼습니다.',
    alt: '린네가 무언가를 떠올리며 말하는 컷신 대사',
    height: BOTTOM,
  },
  {
    id: 'omission',
    caption: '쓰레기장의 총격을 돌이키는 대사. v1.1에서 빠져 있던 「빗나가서」를 되살려 원문의 뜻대로 옮겼습니다.',
    alt: '첫 번째 탄환이 어디에 맞았는지 말하는 대사',
    height: BOTTOM,
  },
  {
    id: 'clipped',
    caption: '창 폭(13자)을 넘어 끝이 잘리던 줄을 창에 맞게 나눴습니다.',
    alt: '방범 카메라가 있다는 걸 알고 있었다는 대사',
    height: BOTTOM,
  },
];
