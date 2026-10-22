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

원작 시트의 RGB 배경색만 투명하게 바꿨습니다. 원본 도트에 보간·색상 변경을 적용하지 않고 프레임을 투명한 고정 크기 셀에 배치했습니다. 가로 시트는 CSS `steps()`로 재생하며 런타임 자바스크립트나 외부 요청이 필요하지 않습니다. 셀 전환은 50ms 간격입니다. 같은 포즈를 유지하는 구간도 있으므로 초당 셀 전환 수와 서로 다른 포즈 수는 다릅니다. 이 값은 목록의 장식 애니메이션 재생 속도이며 원작 게임의 프레임률을 뜻하지 않습니다.

| 파일 | 원작 자료 | 셀 크기 | 셀 수 | 주기 | 파일 크기 |
| --- | --- | --- | --- | --- | --- |
| `sprites/mega-man-x-run.webp` | 위 Mega Man X3 시트 | 40 × 40 | 10 | 0.5초 | 2,018 bytes |
| `sprites/diddy-kong-cap-juggle.webp` | 위 Diddy Kong 시트와 아래 원작 저글링 GIF | 56 × 72 | 256 | 12.8초 | 17,186 bytes |
| `sprites/ryu-shoryuken.webp` | 위 Super Street Fighter II 시트 | 72 × 144 | 86 | 4.3초 | 11,222 bytes |

셀의 좌상단은 `(프레임 번호 × 셀 너비, 0)`입니다. 일반 포즈의 발은 셀 아래에서 2px 위에 정렬했습니다. `prefers-reduced-motion`에서는 첫 프레임만 표시합니다. 세 파일의 합계는 30,426 bytes입니다. 이전 공개 파일 `diddy-kong-idle.webp`·`diddy-kong-juggle.webp`·`ryu-cycle.webp`는 기존 이미지 캐시와의 호환을 위해 원본 그대로 유지합니다.

### 록맨 달리기

좌표는 `(left, top, right, bottom)`이며 오른쪽·아래쪽 경계는 포함하지 않습니다. 배경 RGB는 위 정지 이미지와 같습니다.

`(50,67,70,101)`, `(75,67,98,102)`, `(105,68,137,102)`, `(145,68,179,101)`, `(190,68,216,101)`, `(222,67,244,101)`, `(248,67,273,102)`, `(280,67,310,101)`, `(318,68,352,101)`, `(359,68,388,101)` 순서로 10개 포즈를 한 번씩 재생합니다.

### 디디콩 대기·모자 벗고 쓰기·저글링·일어나기

저글링은 Donkey Kong Country 2의 원작 애니메이션입니다. [Super Mario Wiki 원작 자료 목록](https://www.mariowiki.com/Gallery:Donkey_Kong_Country_2:_Diddy%27s_Kong_Quest)의 [Diddyjuggleani.gif](https://mario.wiki.gallery/images/c/c0/Diddyjuggleani.gif)에서 서로 다른 투명 프레임 23개를 순서대로 가져왔습니다. 원본 캔버스는 39 × 59이며 발 아래 투명 여백 3px만 제거했습니다. GIF에 기록된 10ms 대신 목록에서는 각 포즈를 50ms 동안 표시합니다. 게임·캐릭터·원작 그래픽의 권리는 Nintendo / Rare에 있습니다. 자료 확인: 2026-10-22.

대기 포즈 0–14는 `(6,5,29,42)`, `(35,5,57,42)`, `(61,5,83,42)`, `(89,5,112,42)`, `(117,5,141,42)`, `(144,5,182,42)`, `(186,5,229,42)`, `(233,5,273,42)`, `(280,4,315,42)`, `(323,2,356,42)`, `(361,1,394,42)`, `(400,3,433,42)`, `(436,5,470,42)`, `(473,6,505,42)`, `(511,6,546,42)`입니다.

디디콩은 꼬리·모자를 포함한 전체 폭 대신 발의 접지점을 기준으로 배치합니다. 셀 아래 투명 여백 2px를 유지하고, 그 위 3개 행에서 가장 왼쪽의 발 픽셀을 x=22에 정렬했습니다. 대기·앉기·저글링의 모든 셀에 같은 기준을 적용하며, 도트를 자르거나 보간하지 않습니다.

앉기 포즈 15–27은 원본 시트 y=45…98의 다음 x 구간입니다: `(6,39)`, `(43,77)`, `(83,117)`, `(124,154)`, `(163,197)`, `(205,233)`, `(240,269)`, `(274,303)`, `(309,339)`, `(346,376)`, `(383,412)`, `(422,451)`, `(457,486)`. 각 사각형의 투명 여백을 제거하고 발 기준선에 맞췄습니다. 저글링 포즈 28–50은 GIF 순서입니다.

타임라인은 `(0…14, 13…1)`을 두 번 → 모자를 벗으며 앉는 `15…27` → 모자를 다시 쓰는 `26…17` → 저글링 `28…50`을 네 번 → 모자를 쓴 채 일어나는 `17…15`입니다. 모자를 벗은 상태에서 저글링으로 바로 넘어가지 않도록 모자 벗기 동작을 역순으로 연결했습니다. 저글링은 포즈마다 한 셀(50ms), 그 밖의 동작은 포즈마다 두 셀(100ms)을 유지합니다.

전체 셀 번호로 대기는 0–111, 모자 벗기는 112–137, 모자 다시 쓰기는 138–157, 저글링은 158–249, 일어나기는 250–255입니다. 모자를 다시 쓴 포즈 156–157은 모자 벗기 직전의 포즈 116–117과 같습니다. 저글링을 마친 뒤에도 모자를 쓴 포즈로 일어나며, 벗은 모자가 갑자기 나타나는 구간은 넣지 않았습니다.

### 류 대기·승룡권

대기 포즈 0–3: `(5,11,48,92)`, `(50,12,93,92)`, `(95,11,138,92)`, `(140,10,183,92)`.

승룡권 포즈 4–9: `(6,1390,50,1464)`, `(53,1384,102,1464)`, `(104,1354,142,1462)`, `(144,1354,175,1459)`, `(177,1358,205,1459)`, `(207,1370,255,1464)`.

처음 64셀은 `(0,0,1,1,2,2,3,3)`을 여덟 번 재생합니다. 포즈 하나를 두 셀 유지해 대기는 초당 10개 포즈의 리듬입니다. 이후 22셀은 포즈 `4×2, 5×2, 6×4, 7×4, 8×4, 9×2, 4×2, 0×2`입니다. 포즈 6의 네 셀은 발을 `0,4,8,12px`, 포즈 7은 `16,19,20,19px`, 포즈 8은 `16,12,8,4px` 높이로 놓아 셀마다 도약 위치가 바뀝니다. 공중 최대 높이는 20px이며 전체 셀 번호 68–79가 비행 구간입니다.

## 성검전설 3 숲 배경

목록의 배경은 성검전설 3(Super Famicom, 1995)의 라비 숲 폭포 구역입니다. 게임 및 그래픽 © 1995 SQUARE. [FantasyAnime의 맵 자료](https://www.fantasyanime.com/mana/som2maps.htm)에서 제공하는 [원본 맵 PNG](https://www.fantasyanime.com/mana/images/sd3-maps/Seiken-Densetsu-3-Map-Rabite_Forest.png)를 사용했습니다.

원본 크기는 2,262 × 2,342이며 `(1332, 1252, 1844, 1556)` 영역만 잘라 `rabite-forest-waterfall.webp`에 무손실 WebP로 저장했습니다. 결과는 512 × 304, 38,202 bytes입니다. 원본 도트를 다시 그리거나 색을 바꾸지 않았습니다. 캐릭터·HUD·라벨을 추가하지 않았으며, 화면에서는 반복 없이 중앙을 기준으로 채웁니다. 장식 캐릭터의 위치는 같은 배경 좌표계에 맞춰 고정합니다. 자료 확인: 2026-10-22.
