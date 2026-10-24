---
name: site-code
description: 사이트 코드(src/lib, src/pages, src/components, src/layouts, src/styles, astro.config.ts, scripts)를 바꿀 때. slug·heading id·URL 계약·댓글 경로 규칙과 변경 후 검증, 화면 변경 확인 방법.
---

# 사이트 코드 바꾸기

이 스킬이 URL-02, URL-03, CMT-01 의 정본이다. 발행된 주소와 댓글 경로를 깨는 변경이 가장 위험하다.

## 절차

1. **호환 장치를 건드리는지 본다** — 아래 규칙의 파일을 바꾸면 그 규칙의 확인 방법을 반드시 돌린다.
   완료: 해당 규칙을 읽었거나, 해당 없음을 확인했다.
2. **바꾼다** — 렌더 결과가 바뀌는 순수 함수(`src/lib`)는 `tests/` 에 단위 테스트를 함께 쓴다. 화면 동작은 `e2e/site.spec.ts` 에 Playwright 테스트를 쓴다.
   완료: 새 동작에 테스트가 있다.
3. **콘텐츠 캐시가 바뀐 입력을 반영하는지 본다** — `astro:config:setup` 에서 `prepareImageCache` 가 원본 이미지 내용·렌더 모드·`src/lib/image-cache.ts` 의 `CODE` 파일들을 해시해, 입력이 바뀌면 `node_modules/.astro/data-store.json` 만 지운다. `sync`(typecheck·check)는 크기만 읽고, build·dev 는 이미지 형식을 선택한다. 두 모드 사이 전환도 자동 무효화한다. 이미지 선택 코드를 옮기면 `CODE` 와 [CI 이미지 캐시 키](../ci/SKILL.md#참고)를 함께 고친다. 해시 대상에 없는 rehype/remark 플러그인을 고쳤다면 `rm -f node_modules/.astro/data-store.json` 후 빌드한다.
   완료: 빌드 결과에 바뀐 렌더가 보인다.
4. **검증한다** — CI 와 같은 명령을 로컬에서 돌린다.
   - 정적 검사: `pnpm lint && pnpm lint:images && pnpm format:check && pnpm typecheck && pnpm test && pnpm check && pnpm run audit`. `pnpm audit` 이 아니라 `pnpm run audit` 이다. 앞의 것은 pnpm 내장 명령이라 개발용 의존성까지 검사해 CI 와 결과가 다르다.
   - 빌드 결과 검사: `pnpm build && pnpm verify:urls && pnpm verify:dist && pnpm test:e2e && pnpm test:lighthouse`. e2e·Lighthouse 는 `dist/` 를 띄워 검사하므로 코드를 바꿨으면 반드시 다시 빌드한다. 처음이면 `pnpm exec playwright install chromium` 이 먼저 필요하다.
   - 한 페이지만: `pnpm test:lighthouse -g '<경로>'`.
     완료: 전부 통과. 못 돌린 검사는 통과로 보고하지 않는다.
5. **화면을 바꿨다면 본다** — 390px(폰)·1280px, 라이트·다크로 스크린샷을 찍어 확인한다(Playwright 로 찍으면 된다). 접근성은 e2e 의 axe 검사가 라이트·다크 모두 본다.
   완료: 스크린샷에서 잘림·겹침이 없다.

## 규칙

### URL-02 — slug 와 heading id

태그·카테고리 URL slug 와 본문 heading id 는 Astro 기본 규칙(github-slugger)을 따른다. heading id 는 Astro 가 붙이고, 태그·카테고리 slug 는 `src/lib/posts.ts` 의 `tagPath`·`categoryPath` 가 같은 `slug()` 로 만든다. 소문자로 바꾸고(`Babel` 과 `babel` 은 한 태그), 공백은 `-` 로, 나머지 특수문자는 지우고, 같은 heading 이 반복되면 `-1`, `-2` 를 붙인다.

- 이유: 다른 글과 외부 링크가 이 slug·앵커로 걸려 있다. 둘이 같은 규칙이어야 글을 쓸 때 앵커를 예측할 수 있다.
- 확인: `pnpm test`(태그·카테고리 경로 테스트), `pnpm verify:dist`(내부 앵커가 실제 id 를 가리키는지).
- 규칙을 바꾸면 글 본문 앵커 링크를 함께 고친다. 영향받는 주소는 PR 본문에 적는다.

### URL-03 — 발행된 주소 계약

`tests/fixtures/published-paths.txt` 의 모든 경로(글·아카이브·목록 페이지·피드·`public/` 파일)는 빌드 결과에 항상 있어야 한다. 라우트·페이지네이션(10개씩, `page/N/`)·아카이브(연/월) 구조를 바꿀 때 이 계약을 깨지 않는다.

- 확인: `pnpm build && pnpm verify:urls`.
- 리다이렉트는 두지 않는다. 글 URL 은 바꾸지 않으므로 필요 없고([URL-01](../write-post/SKILL.md#url-01--글-url)), 태그·카테고리를 없애거나 이름을 바꾸면 옛 주소는 404 가 되도록 둔다. 이때 그 주소를 이 목록에서 빼고 PR 본문에 적는다. 저장소 주인이 정한 방침이다.
- `public/` 의 데모 페이지·검색엔진 소유 확인 파일도 이 계약에 들어 있다. 쓰지 않는 것처럼 보여도 지우지 않는다. 지우거나 옮기는 것은 저장소 주인이 정할 때만 하고, 태그·카테고리처럼 목록에서 빼고 PR 본문에 적는다. 광고는 달지 않으므로 `ads.txt` 는 두지 않는다.
- 새 데모·예제 파일은 `public/lab/<이름>/` 아래에 둔다. 사이트 루트 이름을 차지하지 않아 나중에 만드는 페이지와 겹치지 않는다.

### CMT-01 — 댓글 경로

댓글은 Waline 이 글 경로(`/2022/06/06/slug/`)를 키로 묶는다(`src/components/Comments.astro` 의 `path`). Disqus 시절 댓글도 이 경로로 옮겨 넣었다. Disqus 는 앞 슬래시 없는 경로(`2022/06/06/slug/`)를 identifier 로 썼고, 이관할 때 이 값을 글 경로로 맞췄다.

- 한글패치 게임 페이지는 `PatchBook` 이 그 패치의 페이지 경로(`${patch.path}/`, 예: `/games/kr-patches/sfc/super-mario-rpg/`)를 넘긴다. `kr-patches.ts` 의 `path` 를 바꾸면 그 페이지의 댓글도 함께 끊긴다.
- 이유: 경로가 바뀌면 그 글의 댓글 스레드가 통째로 안 보인다.
- `path` 를 `location.pathname` 같은 런타임 값으로 바꾸지 않는다. 쿼리나 끝 슬래시 차이로 스레드가 갈라진다.
- 확인: `pnpm test:e2e` 의 댓글 테스트가 서버에 보낸 `path` 를 검사한다.
- 서버는 [perfectacle/blog-comments](https://github.com/perfectacle/blog-comments) 저장소다. 서버도 이 경로를 가공하지 않는다(그 저장소의 SRV-01).

## 참고

- 글 URL 모양(`/YYYY/MM/DD/<slug>/`)은 `src/lib/post-url.ts` 한 곳에 있다. Astro 라우트용 `postPath`(`src/lib/posts.ts`, 파싱한 날짜)와 빌드 스크립트·remark 플러그인용 `postUrlOf`(`src/lib/post-files.ts`, frontmatter 에 적힌 날짜)가 이것을 쓴다.
- 한글패치 새 버전은 `src/lib/kr-patches.ts` 의 그 패치 `releases` 맨 앞에 `{ version, date }` 한 줄을 넣는다. 목록 카드·발매 정보 줄·IPS 파일명(`fileBase` + 버전)·패치 노트 머리(`PatchRelease`)·테스트 기대값이 모두 여기서 읽는다. 패치 노트 본문은 페이지에 `<PatchRelease patch={patch} version="x.y">` 로 쓴다.
- 패치 페이지 섹션 제목은 `src/lib/patch-sections.ts` 의 `SECTION_TITLES` 에 있다. 오른쪽 메뉴(`sectionsOf`)와 섹션 `<h2>` 가 같이 읽는다. 키는 URL 앵커라 바꾸지 않는다.
- 성능 예산(`e2e/lighthouse.spec.ts` 의 `PAGES`·`MIN_SCORE`·`MAX`)에 걸리면 [ci §CI-02](../ci/SKILL.md#ci-02--실패는-원인을-고친다) 를 따른다.
- 사이트 UI 문구를 쓰거나 고치면 [korean-copy](../korean-copy/SKILL.md) 를 따른다.
