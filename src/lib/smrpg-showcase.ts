export interface ComparePair {
  /** File stem under images/patch; the page loads `${id}_jp.webp` and `${id}_ko.webp`. */
  id: string;
  caption: string;
  alt: string;
}

export interface CompareGroup {
  id: string;
  title: string;
  summary: string;
  pairs: ComparePair[];
}

/** Each pair is the same moment captured with the same input on the Japanese original and the Korean version. */
export const compareGroups: CompareGroup[] = [
  {
    id: 'story',
    title: '이야기',
    summary: '마을 사람과 안내 대사까지 모두 한국어입니다.',
    pairs: [
      {
        id: 'chancellor_hello',
        caption: '버섯 대신의 정중한 말투를 그대로 살렸습니다.',
        alt: '마리오를 맞이하는 버섯 대신',
      },
      {
        id: 'chancellor_kidnap',
        caption: '피치 공주가 또 납치됐다는 소식으로 모험이 시작됩니다.',
        alt: '피치 공주의 납치를 걱정하는 버섯 대신',
      },
      {
        id: 'frogfucius_dontcry',
        caption: '개구리 선인의 호통도 한국어로 듣습니다.',
        alt: '마로를 꾸짖는 개구리 선인',
      },
      {
        id: 'toad_tutorial',
        caption: '처음 하는 사람을 위한 키노피오의 설명도 한국어입니다.',
        alt: '메뉴 여는 법을 알려 주는 키노피오',
      },
    ],
  },
  {
    id: 'party',
    title: '동료',
    summary: '동료마다 다른 말투를 원작 느낌 그대로 옮겼습니다.',
    pairs: [
      { id: 'mallow_plan', caption: '마로의 공손한 말투.', alt: '크로코를 뒤에서 잡자고 말하는 마로' },
      { id: 'mallow_cry', caption: '울보 마로의 "울면 안 돼‥‥".', alt: '울음을 참는 마로' },
      { id: 'mallow_wail', caption: '‥‥결국 울음이 터지는 장면까지.', alt: '크게 우는 마로' },
      {
        id: 'geno_star',
        caption: '정체 모를 인형이 별을 돌려 달라며 나타납니다.',
        alt: '별을 돌려 달라고 외치는 인형',
      },
      {
        id: 'geno_sky',
        caption: '"나는 천공의 사자!" 지노의 첫 등장.',
        alt: '숲속 공터에서 천공의 사자라고 외치는 지노',
      },
      { id: 'geno_name', caption: '「지노」라는 이름이 생기는 장면.', alt: '지노라는 이름을 얻는 장면' },
      { id: 'bowser_reminisce', caption: '성을 빼앗긴 쿠파의 쓸쓸한 혼잣말.', alt: '집도 없다며 한탄하는 쿠파' },
      {
        id: 'bowser_army',
        caption: '"이 몸의 쿠파 군단에 넣어 주마!" 쿠파다운 합류 인사.',
        alt: '마리오 일행을 쿠파 군단에 넣어 주겠다는 쿠파',
      },
      { id: 'bowser_joined', caption: '드디어 쿠파가 동료가 됩니다.', alt: '동료가 된 쿠파' },
    ],
  },
  {
    id: 'rivals',
    title: '개성 있는 적',
    summary: '영어가 섞인 말투나 엉뚱한 말버릇도 빠짐없이 옮겼습니다.',
    pairs: [
      { id: 'dialogue', caption: '크로코의 "OH!"처럼 영어가 섞인 말투.', alt: '마리오를 놀리는 크로코' },
      { id: 'croco_hide', caption: '"ROAD다!"까지 그대로.', alt: '막다른 길에 몰린 크로코' },
      { id: 'bowyer_1000', caption: '유민파의 "냐아~" 말버릇.', alt: '화살 1000개째를 세는 유민파' },
      { id: 'booster_itchy', caption: '부키의 엉뚱한 말투.', alt: '신부에게 말을 거는 부키' },
      { id: 'booster_salty', caption: '"짜다." 한마디면 충분합니다.', alt: '짜다고 말하는 부키' },
    ],
  },
  {
    id: 'battle',
    title: '전투와 메뉴',
    summary: '전투 명령, 적 이름, 아이템, 필살기 설명까지 한국어입니다.',
    pairs: [
      { id: 'battle', caption: '전투 명령과 적 이름.', alt: '전투 명령을 고르는 화면' },
      {
        id: 'specials',
        caption: '필살기 설명을 읽으면 버튼을 누를 때를 알 수 있습니다.',
        alt: '필살기 설명이 보이는 메뉴',
      },
    ],
  },
];
