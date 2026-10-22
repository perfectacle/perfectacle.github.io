# 한글패치 목록 이미지 출처

원작 게임 화면과 스프라이트의 권리는 각 게임의 권리자에게 있습니다. 아래 출처의 원본 픽셀을 유지하고, 스프라이트 시트에서 한 프레임을 잘라 배경색을 투명하게 바꾼 뒤 무손실 WebP로 저장했습니다. 확대와 좌우 방향 전환은 화면의 CSS에서 처리합니다. 이미지 파일을 외부 서버에서 직접 불러오지 않습니다.

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
