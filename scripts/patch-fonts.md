# 한글 패치 웹폰트 갱신

제목과 메뉴의 Galmuri11 일반·굵은 글꼴은 `/games/kr-patches/fonts/`의 WOFF2를 함께 사용한다. 게임별로 공개했던 이전 폰트 파일은 URL 호환을 위해 보존한다. 게임 ROM이나 패치에 들어 있는 글자는 이 절차의 대상이 아니다.

원본은 [Galmuri](https://github.com/quiple/galmuri)의 `Galmuri11.ttf`, `Galmuri11-Bold.ttf`, `LICENSE.txt`이다. SIL Open Font License 1.1로 배포하며 라이선스를 폰트 옆에 둔다. 사용한 원본 SHA256은 `patch-fonts.json`에 고정되어 있다.

문구에 새로운 한글이 생겨 `pnpm test`의 폰트 검사가 실패하면 다음 명령으로 갱신한다. `--font-dir`은 원본 세 파일이 있는 디렉토리다.

```sh
uv run --no-project --with fonttools==4.67.0 --with brotli==1.2.0 \
  python scripts/subset-patch-fonts.py --font-dir "$HOME/kr-patch/smrpg/tools/fonts/galmuri"
pnpm exec prettier --write scripts/patch-fonts.manifest.json
pnpm exec vitest run tests/patch-fonts.test.ts
```

생성은 문구를 바꿀 때 명시적으로 실행한다. 빌드와 CI는 도구를 설치하거나 폰트를 다운로드하지 않는다. WOFF2 두 파일과 실제 글자표·해시를 기록한 `patch-fonts.manifest.json`을 함께 커밋한다.

`patch-fonts.json`에 지정한 페이지·컴포넌트 디렉토리와 `src/lib` 전체의 Astro·TypeScript·JSON 파일을 재귀적으로 읽어 접힌 내용과 런타임 안내, JSON의 엔딩 제목도 포함한다. 일반·굵은 글꼴은 같은 문자 범위를 담는다. 모든 ASCII와 소스의 한글, 필수 UI 기호는 양쪽 원본에 있어야 한다. 그 외 소스 문자는 양쪽 원본이 모두 지원하는 경우에 포함한다. 일본어 저작권 문구 등은 본문 글꼴로 표시한다. 새 UI 기호를 픽셀 글꼴로 표시하려면 `requiredCharacters`에도 넣는다.

단위 테스트는 현재 한글·ASCII·필수 기호의 누락, 실제 WOFF2와 manifest의 해시 불일치, 50KiB 용량 초과를 검사한다. 별도 페이지나 컴포넌트 디렉토리를 새로 만들면 `patch-fonts.json`의 수집 범위에도 추가한다.
