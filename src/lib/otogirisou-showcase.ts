import type { VersionPair } from './version-pairs';

/** Each pair is the same page of a new game on the Japanese original and the Korean version, with the default name 코헤이. */
export const otogirisouPairs: VersionPair[] = [
  {
    id: 'opening',
    caption: '첫 페이지. 해 질 녘 산길을 달리는 차 안에서 이야기가 시작됩니다.',
    alt: '여름날 해 질 녘 산길을 묘사하는 첫 문장',
  },
  {
    id: 'wake',
    caption: '첫 선택지. 잠든 나미를 어떻게 부르느냐에 따라 이야기가 갈립니다.',
    alt: '나미를 부르는 두 가지 보기가 있는 선택지',
  },
  {
    id: 'driving',
    caption: '주인공 이름도 한글로 넣어 대사 속에 그대로 나옵니다.',
    alt: '운전을 맡겨서 미안하다는 나미의 대사',
  },
  {
    id: 'flower',
    caption: '제목인 제절초(弟切草)가 무슨 뜻인지 풀어 주는 장면.',
    alt: '길가에 핀 꽃이 제절초라고 알려 주는 장면',
  },
  {
    id: 'lightning',
    caption: '눈앞의 나무에 벼락이 떨어집니다.',
    alt: '나무에 벼락이 떨어져 두 쪽으로 갈라지는 장면',
  },
  {
    id: 'crushed',
    caption: '쓰러진 나무에 차가 짓뭉개지고, 두 사람은 빗속에 남겨집니다.',
    alt: '쓰러진 나무에 찌그러진 차를 보고 놀라는 장면',
  },
  {
    id: 'gate',
    caption: '빗속 숲 너머로 거대한 저택이 모습을 드러냅니다.',
    alt: '비에 젖은 철문 너머로 저택이 보이는 장면',
  },
  {
    id: 'intercom',
    caption: '저택 정문 앞 선택지. 인터폰을 누를지, 돌아갈지 고릅니다.',
    alt: '인터폰을 누를지 묻는 세 가지 보기',
  },
];
