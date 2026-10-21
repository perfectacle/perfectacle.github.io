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
    title: '이름·별명·맞춤법',
    summary:
      '고유명사는 국내 정식 발매판에 맞추고(슈퍼 도돈파, 미스터 포포 등), 원문에 없던 별명(빠박이, SKIN HEAD 등)은 정리했습니다. 맞춤법과 띄어쓰기, 줄바꿈도 바로잡았습니다.',
    pairs: [
      {
        id: 'title',
        frames: 1,
        caption: '타이틀 로고를 "초오공전 각성편"으로 바꾸고 로고 아래 가타카나는 지웠습니다.',
        alt: '드래곤볼 Z 로고와 오공·오반이 있는 타이틀 화면',
      },
      {
        id: 'spell_kami',
        frames: 2,
        caption: '센으로 변장한 신의 대사. MR. 포포는 미스터 포포로 부릅니다.',
        alt: '천하제일 무술대회 예선 회장에서 오공에게 말하는 신',
      },
      {
        id: 'credits_popo',
        frames: 1,
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
        frames: 1,
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
        frames: 5,
        caption: '패배한 베지터가 우주선을 부르는 장면. 같은 시점(0·8·16·23·24초)에 찍었습니다.',
        alt: '바위밭에서 우주선을 부르는 베지터',
      },
      {
        id: 'bugfix_bulma_ship',
        frames: 5,
        caption: '부르마 일행이 나메크성으로 출발하는 장면. 같은 시점(0·5·11·22·28초)에 찍었습니다.',
        alt: '우주선을 타고 나메크성으로 출발하는 부르마 일행',
      },
    ],
  },
];
