# 한글패치 목록 이미지 출처

원작 게임 화면과 스프라이트의 권리는 각 게임의 권리자에게 있습니다. 아래 출처의 원본 픽셀을 유지하고, 스프라이트 시트에서 필요한 프레임을 잘라 배경색을 투명하게 바꾼 뒤 무손실 WebP로 저장했습니다. 확대와 좌우 방향 전환은 화면의 CSS에서 처리합니다. 이미지 파일을 외부 서버에서 직접 불러오지 않습니다.

| 로컬 파일 | 원작 / 플랫폼 | 출처와 시트 제공자 | 원본 이미지 | 저장 크기 |
| --- | --- | --- | --- | --- |
| `sprites/mega-man-x.webp` | Mega Man X3 / SNES | [Sprite Database: Mega Man X](https://spritedatabase.net/file/8203), Random Talking Bush | [MegaManX.png](https://www.spritedatabase.net/files/snes/466/Sprite/MegaManX.png) | 29 × 34 |
| `sprites/diddy-kong.webp` | Donkey Kong Country 2: Diddy's Kong Quest / SNES | [Sprite Database: Diddy Kong](https://spritedatabase.net/file/7653), Tonberry2k | [Diddy.gif](https://www.spritedatabase.net/files/snes/376/Sprite/Diddy.gif) | 38 × 37 |
| `sprites/dixie-kong.webp` | Donkey Kong Country 2: Diddy's Kong Quest / SNES | [Sprite Database: Dixie Kong](https://spritedatabase.net/file/7654), David “Tonberry2K” Hurley | [Dixie.gif](https://www.spritedatabase.net/files/snes/376/Sprite/Dixie.gif) | 35 × 36 |
| `sprites/ryu.webp` | Super Street Fighter II / SNES | [Sprite Database: Ryu](https://spritedatabase.net/file/31727), KUSANAGI | [SSFII_Ryu.png](https://spritedatabase.net/files/snes/2426/Sprite/SSFII_Ryu.png) | 43 × 81 |
| `super-mario-rpg-title.webp` | Super Mario RPG 한글패치 v1.1 / SFC | Mesen 직접 실행 캡처 | 배포 중인 v1.1 IPS를 검증된 일본판 원본에 적용해 실행 | 256 × 224 |

- Mega Man X3, Super Street Fighter II의 게임·캐릭터·스프라이트: © CAPCOM.
- Donkey Kong Country 2의 게임·캐릭터·스프라이트: © Nintendo / Rare.
- Super Mario RPG 타이틀 화면: © Nintendo / SQUARE. Mesen의 `--testrunner`로 배포 중인 한글패치 v1.1을 직접 실행했습니다. `inputPolled` 콜백에서 900~909프레임에 Start를 입력한 뒤 1080프레임의 화면을 `emu.takeScreenshot()`으로 캡처하고 무손실 WebP로 저장했습니다. 로컬 ROM은 저장소에 포함하지 않습니다.
- Sprite Database는 게임 자료의 권리가 원저작자·권리자에게 있으며 개인적·비상업적 사용을 위해 제공한다고 안내합니다. 시트 제공자는 게임 그래픽의 권리자와 별개입니다.
- 출처 확인 및 다운로드: 2026-10-22.

## 스프라이트 추출 좌표

좌상단을 `(0, 0)`으로 삼고, 아래 사각형을 자른 뒤 투명 여백을 제거했습니다. 좌표는 `(left, top, right, bottom)`이며 원본 시트 기준입니다.

| 파일 | 추출 사각형 | 투명 처리한 배경 RGB |
| --- | --- | --- |
| `mega-man-x.webp` | `(400, 20, 437, 66)` | `(50, 96, 166)` |
| `diddy-kong.webp` | `(143, 0, 185, 48)` | `(0, 255, 255)` |
| `dixie-kong.webp` | `(0, 0, 40, 50)` | `(255, 255, 255)` |
| `ryu.webp` | `(0, 0, 48, 96)` | `(153, 217, 234)` |


## 목록 장식 애니메이션

원작 시트의 RGB 배경색만 투명하게 바꿨습니다. 원본 도트에 보간·색상 변경을 적용하지 않고 프레임을 투명한 고정 크기 셀에 배치했습니다. 가로 시트는 CSS `steps()`로 재생하며 런타임 자바스크립트나 외부 요청이 필요하지 않습니다.

| 파일 | 원작 시트 | 셀 크기 | 프레임 수 | 주기 | 파일 크기 |
| --- | --- | --- | --- | --- | --- |
| `sprites/mega-man-x-run.webp` | 위 Mega Man X3 시트 | 40 × 40 | 10 | 0.8초 | 2,018 bytes |
| `sprites/diddy-kong-idle.webp` | 위 Diddy Kong 시트 | 56 × 48 | 28 | 2.8초 | 5,358 bytes |
| `sprites/ryu-cycle.webp` | 위 Super Street Fighter II 시트 | 72 × 144 | 64 | 6초 | 10,276 bytes |

셀의 좌상단은 `(프레임 번호 × 셀 너비, 0)`입니다. 일반 포즈의 발은 셀 아래에서 2px 위에 정렬했습니다. 류의 공중 포즈는 같은 기준에서 10px → 25px → 14px 높이로 배치한 뒤 착지합니다. `prefers-reduced-motion`에서는 첫 프레임만 표시합니다.

### 원본 좌표와 프레임 순서

좌표는 모두 `(left, top, right, bottom)`이며 오른쪽·아래쪽 경계는 포함하지 않습니다. 배경 RGB는 위 정지 이미지와 같습니다.

- 록맨 달리기: `(50,67,70,101)`, `(75,67,98,102)`, `(105,68,137,102)`, `(145,68,179,101)`, `(190,68,216,101)`, `(222,67,244,101)`, `(248,67,273,102)`, `(280,67,310,101)`, `(318,68,352,101)`, `(359,68,388,101)` 순서입니다.
- 디디콩 대기: `(6,5,29,42)`, `(35,5,57,42)`, `(61,5,83,42)`, `(89,5,112,42)`, `(117,5,141,42)`, `(144,5,182,42)`, `(186,5,229,42)`, `(233,5,273,42)`, `(280,4,315,42)`, `(323,2,356,42)`, `(361,1,394,42)`, `(400,3,433,42)`, `(436,5,470,42)`, `(473,6,505,42)`, `(511,6,546,42)`입니다. 이 15개 포즈를 `0…14, 13…1` 순서로 이어 고개·꼬리 움직임이 처음 자세로 돌아오게 했습니다.
- 류 대기 포즈 0–3: `(5,11,48,92)`, `(50,12,93,92)`, `(95,11,138,92)`, `(140,10,183,92)`.
- 류 승룡권 포즈 4–9: `(6,1390,50,1464)`, `(53,1384,102,1464)`, `(104,1354,142,1462)`, `(144,1354,175,1459)`, `(177,1358,205,1459)`, `(207,1370,255,1464)`.
- 류의 시트 프레임 0–47은 `(0,0,1,1,2,2,3,3)`을 여섯 번 반복합니다. 프레임 48–63은 `(4,4,5,5,6,6,7,7,8,8,9,9,4,4,0,0)`이며 포즈 6·7·8에 각각 위 도약 높이를 적용했습니다. 마지막 두 프레임은 첫 프레임과 같아 대기로 복귀합니다.

세 애니메이션의 무손실 WebP는 합계 17,652 bytes입니다. 첫 프레임의 불투명 픽셀만 세어도 록맨 388개·디디콩 588개·류 1,869개이므로 원작 도트를 HTML 요소나 긴 `box-shadow` 선언으로 다시 그리는 것보다 이미지 시트와 CSS가 단순합니다.
