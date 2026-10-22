import type { VersionGroup } from './version-pairs';

export const kakuseiVersions = [
  { key: 'v11', label: 'v1.1' },
  { key: 'v12', label: 'v1.2' },
];

const missing = 'v1.1에 없던 대사';

/** Each pair is the same moment captured with the same input on v1.1 (2016) and v1.2. */
export const kakuseiGroups: VersionGroup[] = [
  {
    id: 'restore',
    title: '원문대로 옮긴 대사',
    summary: '원문과 다르게 옮겼거나 글자 수 제한으로 잘렸던 대사를 원문대로 되살렸습니다.',
    pairs: [
      {
        id: 'restore_goku',
        selectedFrames: [3],
        frames: 4,
        caption: '대원숭이가 된 베지터에게 진 오공의 독백. 잘려 나갔던 뒷부분을 되살렸습니다.',
        alt: '바위밭에 쓰러져 혼잣말하는 오공',
        gaps: { 'v11:3': missing, 'v11:4': missing },
      },
      {
        id: 'restore_vegeta',
        frames: 3,
        caption: '내퍼에게 불로불사를 이야기하는 베지터. 빠졌던 대사를 되살렸습니다.',
        alt: '우주를 날아가며 내퍼에게 말하는 베지터',
        gaps: { 'v11:2': missing, 'v11:3': missing },
      },
      {
        id: 'restore_dodonpa',
        frames: 4,
        caption: '타오파이파이가 슈퍼 도돈파를 쓰기 전의 대사를 원문대로 채웠습니다.',
        alt: '대결장에서 천진반에게 슈퍼 도돈파를 예고하는 타오파이파이',
        gaps: { 'v11:2': missing, 'v11:3': missing },
      },
      {
        id: 'restore_match',
        selectedFrames: [1],
        highlights: {
          'v11:1': [[86, 143, 54, 18]],
          'v12:1': [[86, 159, 120, 18]],
          'v11:2': [[86, 143, 126, 34]],
          'v12:2': [[86, 143, 126, 50]],
        },
        frames: 2,
        caption: '천하제일 무술대회 예선에서 크리링이 하는 말도 원문대로 고쳤습니다.',
        alt: '예선 회장에서 상대를 보고 웃는 크리링',
      },
    ],
  },
  {
    id: 'tone',
    title: '캐릭터마다 다른 말투',
    summary: '프리더는 존댓말을 쓰고, 치치는 원문의 悟空さ에 맞춰 "오공 씨"라고 부릅니다. 원작의 말장난도 살렸습니다.',
    pairs: [
      {
        id: 'tone_chichi_1',
        frames: 2,
        caption: '치치는 오공을 "오공 씨"라고 부릅니다.',
        alt: '오공에게 서운함을 털어놓는 치치',
      },
      {
        id: 'tone_frieza_1',
        selectedFrames: [1],
        highlights: {
          'v11:1': [[86, 159, 100, 34]],
          'v12:1': [[86, 159, 150, 34]],
          'v11:2': [[86, 143, 150, 34]],
          'v12:2': [[86, 143, 150, 50]],
        },
        frames: 2,
        caption: '프리더는 베지터에게도 존댓말을 씁니다.',
        alt: '나메크성에서 베지터와 마주한 프리더',
      },
      {
        id: 'pun_kaio',
        frames: 3,
        caption: '계왕의 말장난 "가려‥ 계려‥ 계왕"을 살렸습니다.',
        alt: '계왕별에서 자기소개를 하는 계왕',
        gaps: { 'v11:2': missing },
      },
      {
        id: 'tone_chichi_2',
        frames: 2,
        caption: '천하제일 무술대회에서 오공을 응원할 때도 "오공 씨"라고 부릅니다.',
        alt: '대결장에서 오공을 응원하는 치치',
      },
      {
        id: 'tone_frieza_2',
        frames: 2,
        caption: '힘을 감춘 프리더의 여유도 존댓말로 옮겼습니다.',
        alt: '나메크성에서 베지터에게 말하는 프리더',
      },
    ],
  },
  {
    id: 'names',
    title: '타이틀·이름·맞춤법',
    summary:
      '타이틀을 한국어로 바꾸고, 고유명사는 엔딩 크레딧까지 국내 정식 발매판에 맞췄습니다(슈퍼 도돈파, 미스터 포포 등). 원문에 없던 별명(빠박이, SKIN HEAD 등)은 정리했습니다. 맞춤법과 띄어쓰기, 줄바꿈도 바로잡았습니다.',
    pairs: [
      {
        id: 'title',
        highlights: { 'v11:1': [[14, 54, 100, 44]], 'v12:1': [[14, 54, 100, 44]] },
        caption: '타이틀 로고를 "초오공전 각성편"으로 바꾸고 로고 아래 가타카나는 지웠습니다.',
        alt: '드래곤볼 Z 로고와 오공·오반이 있는 타이틀 화면',
      },
      {
        id: 'spell_kami',
        selectedFrames: [1],
        highlights: {
          'v11:1': [[86, 146, 132, 32]],
          'v12:1': [[86, 146, 132, 32]],
        },
        frames: 2,
        caption: '센으로 변장한 신의 대사를 원문에 맞춰 다시 옮겼습니다.',
        alt: '천하제일 무술대회 예선 회장에서 오공에게 말하는 신',
      },
      {
        id: 'credits_popo',
        highlights: {
          'v11:1': [[176, 81, 68, 17]],
          'v12:1': [[176, 81, 78, 17]],
        },
        height: 100,
        caption: '엔딩 크레딧도 미스터 포포입니다.',
        alt: '엔딩 크레딧의 야지로베·카린·신·미스터 포포',
      },
      {
        id: 'nick_vegeta',
        frames: 2,
        caption: '베지터가 크리링을 "빠박이"라고 부르던 대사를 원문대로 고쳤습니다.',
        alt: '드래곤볼을 손에 넣고 크리링을 떠올리는 베지터',
      },
      {
        id: 'nick_bulma',
        caption: '부르마의 대사에서도 원문에 없던 별명을 덜어 냈습니다.',
        alt: '캡슐 하우스에서 크리링과 함께 있는 부르마',
      },
      {
        id: 'spell_piccolo',
        frames: 2,
        caption: '피콜로의 대사. 맞춤법과 띄어쓰기, 줄바꿈을 바로잡았습니다.',
        alt: '바위산에서 오반에게 말하는 피콜로',
      },
    ],
  },
  {
    id: 'bugfix',
    title: '진행 버그',
    summary:
      'v1.1에서는 아래 두 장면에서 우주선이 맵 밖을 헤매어 한참 기다려야 했습니다. 한글 대사를 넣다가 우주선 이동 경로 데이터를 덮어쓴 탓이었습니다. 이제 원본처럼 바로 진행됩니다.',
    pairs: [
      {
        id: 'bugfix_vegeta_pod',
        selectedFrames: [5],
        frames: 5,
        caption:
          '베지터가 우주선을 부른 뒤 24초가 지난 같은 시점입니다. v1.1은 같은 대사에 머무르지만, v1.2는 다음 대사로 진행됩니다.',
        alt: '바위밭에서 우주선을 부르는 베지터',
      },
      {
        id: 'bugfix_bulma_ship',
        selectedFrames: [5],
        frames: 5,
        caption:
          '부르마 일행이 나메크성으로 출발한 뒤 28초가 지난 같은 시점입니다. v1.1은 거북 하우스에 머무르지만, v1.2는 우주선 안으로 진행됩니다.',
        alt: '우주선을 타고 나메크성으로 출발하는 부르마 일행',
      },
    ],
  },
];

export const kakuseiV13Versions = [
  { key: 'v12', label: 'v1.2' },
  { key: 'v13', label: 'v1.3' },
];

/** Same scene, same input on v1.2 and v1.3 in Mesen 2: debug-menu scenes, and the password screen from a new game. */
export const kakuseiV13Groups: VersionGroup[] = [
  {
    id: 'wrap',
    title: '나레이션 줄바꿈',
    summary:
      '나레이션 창 한 줄에는 14자까지 들어갑니다. v1.2는 15자로 알고 줄을 나눠 마지막 글자가 혼자 다음 줄로 떨어졌습니다. 대사 8개를 14자 안으로 다시 나눴습니다.',
    pairs: [
      {
        id: 'wrap_600',
        caption: '사이어인이 지구에 도착하는 장면. 「이」가 혼자 떨어지지 않습니다.',
        alt: '도시가 보이는 지도 위에 뜬 나레이션 창',
      },
      {
        id: 'wrap_f87',
        caption: '오공을 기다리는 장면. 「채」가 혼자 떨어지지 않습니다.',
        alt: '바위산이 보이는 지도 위에 뜬 나레이션 창',
      },
    ],
  },
  {
    id: 'password',
    title: '돌격편 암호',
    summary:
      '돌격편 엔딩의 암호 「손오공은사이어인」을 입력하면 돌격편을 마친 상태로 시작합니다. 50자 데이터 암호도 돌격편 화면 글자 그대로 치면 통과하도록 입력 칸과 검사 표를 고쳤습니다.',
    pairs: [
      {
        id: 'password_phrase',
        frames: 2,
        caption:
          '같은 칸을 눌러 「손오공은사이어인」을 입력한 결과. v1.3은 기본 이름으로 이름 화면에 넘어가고, v1.2는 칸 글자가 달라 다른 문장이 되며 틀린 암호가 됩니다.',
        alt: '각성편의 암호 입력 화면과 입력을 마친 뒤의 화면',
      },
      {
        id: 'password',
        frames: 2,
        caption:
          '돌격편 디버그 엔딩의 50자 암호를 화면 글자 그대로 입력한 결과. v1.2는 「건」 칸이 없고 틀린 암호가 되며, v1.3은 이름 화면으로 넘어갑니다.',
        alt: '각성편의 암호 입력 화면과 입력을 마친 뒤의 화면',
      },
      {
        id: 'name_transfer',
        caption:
          '돌격편 이름 「손오공」을 담은 50자 암호의 결과. v1.2는 이름 표가 밀려 「스우공드드」가 되고, v1.3은 「손오공」이 됩니다. v1.2 화면은 같은 50자를 메모리의 입력 버퍼에 직접 써 넣고 입력완료를 눌러 찍었습니다. v1.2는 칸 글자와 검사 표가 맞지 않아 256가지 바이트 값 중 11가지만 칠 수 있고, 어떤 데이터 암호도 키로 입력할 수 없습니다.',
        alt: '암호를 받은 뒤 각성편의 이름 입력 화면',
      },
      {
        id: 'name_grid',
        caption:
          '새 게임의 이름 입력 화면. 암호 화면과 같은 글자 판을 써서, 암호 칸을 다시 배치하면서 글자 순서도 바뀌었습니다.',
        alt: '각성편의 이름 입력 화면',
      },
    ],
  },
  {
    id: 'bubble',
    title: '전투 말풍선',
    summary:
      '전투 중에 뜨는 말풍선 대사 898개를 일본어 원문과 다시 대조했습니다. 뜻이 달랐던 대사를 고치고, 말풍선 밖으로 넘치던 줄을 창에 맞게 나눴습니다.',
    pairs: [
      {
        id: 'bubble_chichi',
        caption: '천하제일 무술대회의 치치. 「이제 정말 화났어!!」라는 원문의 뜻대로 고쳤습니다.',
        alt: '무술대회 대결장에서 말풍선으로 말하는 치치',
      },
      {
        id: 'bubble_gravity',
        caption: '계왕의 중력 수련. 넘쳐서 혼자 떨어지던 「다!」가 사라졌습니다.',
        alt: '계왕별 길 위에서 말풍선으로 말하는 계왕',
      },
      {
        id: 'bubble_kaio',
        frames: 3,
        caption: '계왕권 설명. 빠졌던 원문을 채우고 줄을 다시 나눴습니다.',
        alt: '계왕별에서 계왕권 쓰는 법을 설명하는 계왕',
      },
    ],
  },
];
