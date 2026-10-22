import type { VersionGroup } from './version-pairs';

export const totsugekiVersions = [
  { key: 'v10', label: 'v1.0' },
  { key: 'v11', label: 'v1.1' },
];

/** Each pair is the same moment captured with the same input on v1.0 (2012) and v1.1. */
export const totsugekiGroups: VersionGroup[] = [
  {
    id: 'restore',
    title: '원문대로 옮긴 대사',
    summary: '일본어 원문과 한 줄씩 맞춰 보고, 뜻이 달랐거나 빠졌던 대사를 원문대로 옮겼습니다.',
    pairs: [
      {
        id: 'restore_goku_fish',
        selectedFrames: [2],
        frames: 2,
        caption:
          '물고기를 잡으러 간 오공. 원문에 없던 "저 녀석으로 정했다!"를 "잡아먹는 건 내 쪽이라고!"로 고쳤습니다.',
        alt: '뒷강에서 물고기를 찾아낸 오공',
      },
      {
        id: 'restore_capsule_house',
        frames: 2,
        caption: '캡슐 하우스에 들어가는 부르마와 오공. 꼬리를 잡아당기는 장면을 원문대로 살렸습니다.',
        alt: '캡슐 하우스로 오공을 부르는 부르마',
      },
      {
        id: 'restore_beach',
        frames: 3,
        caption: '바다에 도착한 바다거북과 부르마. v1.0에서 빠졌던 대사를 되살렸습니다.',
        alt: '해변에서 바다를 반기는 바다거북과 부르마',
        gaps: { 'v10:2': 'v1.0에 없던 대사' },
      },
    ],
  },
  {
    id: 'tone',
    title: '캐릭터마다 다른 말투',
    summary: '누가 누구에게 말하는지에 따라 말투와 호칭을 원작대로 맞췄습니다.',
    pairs: [
      {
        id: 'tone_goku',
        highlights: { 'v10:1': [[123, 185, 48, 16]], 'v11:1': [[180, 161, 26, 16]] },
        caption: '오공은 할아버지에게도 반말을 씁니다.',
        alt: '할아버지에게 먹을 것을 잡아 오겠다는 오공',
      },
      {
        id: 'tone_tien',
        caption: '천진반은 스승에게 깍듯한 존댓말을 씁니다.',
        alt: '황야에서 자기가 싸우겠다고 나서는 천진반',
      },
      {
        id: 'tone_bulma',
        frames: 2,
        caption: '무천도사에게 존댓말과 반말을 섞어 쓰는 부르마. 장소 이름도 카메하우스로 바꿨습니다.',
        alt: '카메하우스에서 무천도사에게 잠수정을 빌리려는 부르마',
      },
      {
        id: 'tone_popo',
        frames: 2,
        caption: '짧게 끊어 말하는 미스터 포포의 말투를 살렸습니다.',
        alt: '천계에서 자신을 소개하는 미스터 포포',
      },
    ],
  },
  {
    id: 'joke',
    title: '원문에 없던 농담',
    summary: 'v1.0에 들어 있던 말장난과 비속어를 원문대로 정리했습니다. 일부 농담은 그대로 남겨 두었습니다.',
    pairs: [
      {
        id: 'joke_goku',
        caption: '천하제일 무술대회 우승을 꿈꾸는 오공. 대학교 이름 말장난을 원문대로 고쳤습니다.',
        alt: '무대 위에서 우승을 중얼거리는 오공',
      },
      {
        id: 'joke_tao',
        caption: '타오파이파이의 엄포도 원문대로 "손도 발도 안 쓰고 쓰러뜨려 주지"입니다.',
        alt: '레드 리본군 사령실에서 엄포를 놓는 타오파이파이',
      },
    ],
  },
  {
    id: 'names',
    title: '타이틀·메뉴·이름',
    summary:
      '타이틀과 메뉴를 한국어로 바꿨습니다. 고유명사는 국내 정식 발매판과 초오공전 각성편 한글판 v1.2에 맞췄습니다. 엔딩 크레딧의 이름도 같은 기준으로 맞췄습니다.',
    pairs: [
      {
        id: 'title',
        highlights: { 'v10:1': [[14, 54, 100, 44]], 'v11:1': [[14, 54, 100, 44]] },
        caption: '타이틀 로고를 "초오공전 돌격편"으로 바꾸고 로고 아래 가타카나는 지웠습니다.',
        alt: '드래곤볼 Z 로고와 여의봉을 든 오공이 있는 타이틀 화면',
      },
      {
        id: 'spell_roshi',
        frames: 2,
        caption: '거북신선은 무천도사로 부릅니다.',
        alt: '해변에서 자신을 소개하는 무천도사',
      },
      {
        id: 'ui_title_menu',
        highlights: {
          'v10:1': [
            [45, 39, 76, 18],
            [145, 39, 53, 18],
          ],
          'v11:1': [
            [60, 39, 50, 18],
            [160, 39, 28, 18],
          ],
        },
        height: 80,
        caption: '타이틀 메뉴도 한국어입니다.',
        alt: '새 게임과 옵션을 고르는 타이틀 메뉴',
      },
    ],
  },
  {
    id: 'layout',
    title: '창에 맞춘 줄바꿈',
    summary:
      '대사가 창 폭보다 길면 게임이 알아서 줄을 바꾸는 바람에 한두 글자만 다음 줄로 밀려났습니다. 이런 대사를 모두 창 폭에 맞췄습니다.',
    pairs: [
      {
        id: 'layout_wrap_1',
        highlights: {
          'v10:1': [
            [171, 137, 27, 16],
            [88, 161, 35, 16],
          ],
          'v11:1': [
            [145, 137, 61, 16],
            [88, 161, 93, 16],
          ],
        },
        caption: '줄 끝이 밀려나 세 줄이 된 브리프 박사의 대사.',
        alt: '캡슐 코퍼레이션에서 오공에게 말하는 브리프 박사',
      },
      {
        id: 'layout_wrap_2',
        caption: '닫는 괄호만 다음 줄로 밀려났던 무천도사의 대사.',
        alt: '황야에서 혼잣말하는 무천도사',
      },
      {
        id: 'layout_wrap_3',
        frames: 2,
        caption: '느낌표만 다음 페이지로 넘어갔던 블루 장군 부하의 보고. 이제 한 페이지에 모두 들어갑니다.',
        alt: '블루 장군에게 드래곤볼의 행방을 보고하는 부하',
        gaps: { 'v11:2': '한 페이지에 모두 들어감' },
      },
    ],
  },
  {
    id: 'bugfix',
    title: '진행 버그',
    summary: 'v1.0 배포 때 공지했던 문제입니다. 진행 상황에 따라 나타나지 않을 때도 있었습니다.',
    pairs: [
      {
        id: 'bugfix_event_list',
        selectedFrames: [3],
        frames: 3,
        caption:
          '이벤트 표 맨 아래에서 B 버튼을 두 번 누른 뒤 A 버튼을 누른 같은 시점입니다. v1.0은 기술 설정으로 넘어가지만, v1.1은 B 버튼으로 게임에 돌아온 뒤 대사가 이어집니다.',
        alt: '이벤트 표 맨 아래에서 B 버튼을 두 번, A 버튼을 한 번 누른 화면',
      },
    ],
  },
];
