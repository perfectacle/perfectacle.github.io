---
name: site-code
description: 사이트 코드(src/lib, src/pages, src/components, src/layouts, src/styles, astro.config.ts, scripts)를 바꿀 때. Hexo 호환 장치(slug·heading id·URL 계약·Disqus)와 변경 후 검증, 화면 변경 확인 방법.
---

# 사이트 코드 바꾸기

이 스킬이 URL-02, URL-03, CMT-01 의 정본이다. 이 블로그는 Hexo 에서 Astro 로 옮겨 왔고, 옛 주소·앵커·댓글을 그대로 유지하는 장치가 코드 곳곳에 있다. 그 장치를 건드리는 변경이 가장 위험하다.

## 절차

1. **호환 장치를 건드리는지 본다** — 아래 규칙의 파일을 바꾸면 그 규칙의 확인 방법을 반드시 돌린다.
   완료: 해당 규칙을 읽었거나, 해당 없음을 확인했다.
2. **바꾼다** — 렌더 결과가 바뀌는 순수 함수(`src/lib`)는 `tests/` 에 단위 테스트를 함께 쓴다. 화면 동작은 `e2e/site.spec.ts` 에 Playwright 테스트를 쓴다.
   완료: 새 동작에 테스트가 있다.
3. **rehype/remark 플러그인을 고쳤다면 콘텐츠 캐시를 지운다** — `rm node_modules/.astro/data-store.json` 후 빌드. Astro 콘텐츠 캐시는 플러그인 파일만 바뀌면 무효화되지 않아 옛 렌더가 남는다(CI 는 매번 새로 설치해서 무관).
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

태그·카테고리 URL slug 와 본문 heading id 는 hexo-util 의 slugize 규칙을 따른다(`src/lib/slugize.ts`, `src/lib/rehype-hexo-heading-ids.ts`). 대소문자를 유지하고(`Babel` 과 `babel` 은 다른 태그), 특수문자는 `-` 로 바꾸고, 같은 heading 이 반복되면 `-1`, `-2` 를 붙인다.

- 이유: 외부 링크와 다른 글이 이 slug·앵커로 걸려 있다.
- smartypants 는 `dashes: 'oldschool'`(Hexo 와 같이 `--` → en dash) 이다. heading id 에 들어가므로 바꾸지 않는다.
- 확인: `pnpm test`(slugize·heading id 테스트), `pnpm verify:dist`(내부 앵커가 실제 id 를 가리키는지).
- 저장소 주인이 명시적으로 바꾸라고 할 때만 바꾼다. 영향받는 주소는 PR 본문에 적는다. slugize 를 쓰는 곳은 `grep -rln slugize src scripts` 로 찾는다.

### URL-03 — 옛 주소 계약

`tests/fixtures/legacy-paths.txt` 의 모든 경로(Hexo 시절 페이지·피드)는 빌드 결과에 항상 있어야 한다. 라우트·페이지네이션(10개씩, `page/N/`)·아카이브(연/월) 구조를 바꿀 때 이 계약을 깨지 않는다.

- 확인: `pnpm build && pnpm verify:urls`.
- 리다이렉트는 두지 않는다. 글 URL 은 바꾸지 않으므로 필요 없고([URL-01](../write-post/SKILL.md#url-01--글-url)), 태그·카테고리를 없애거나 이름을 바꾸면 옛 주소는 404 가 되도록 둔다. 이때 그 주소를 이 목록에서 빼고 PR 본문에 적는다. 저장소 주인이 정한 방침이다.
- `public/` 의 데모 페이지·검색엔진 소유 확인 파일·`ads.txt` 도 이 계약에 들어 있다. 쓰지 않는 것처럼 보여도 지우지 않는다.
- macOS 는 파일시스템이 대소문자를 구분하지 않아 `tags/Babel` 과 `tags/babel` 이 로컬에서 한 폴더로 겹쳐 보인다. 둘 다 생성되는지는 빌드 로그나 CI(Linux)로 확인한다.

### CMT-01 — Disqus identifier

Disqus 의 `identifier` 는 앞 슬래시 없는 글 경로(`2022/06/06/slug/`), `url` 은 전체 permalink 다(`src/components/Comments.astro`). Hexo NexT 테마가 쓰던 값과 같아야 기존 댓글 스레드가 이어진다.

## 참고

- 글 폴더 → URL 규칙은 두 곳에 있다: Astro 라우트용 `postPath`(`src/lib/posts.ts`)와 빌드 스크립트·remark 플러그인용 `postUrlOf`(`src/lib/post-files.ts`). 하나를 바꾸면 다른 하나도 같이 바꾼다.
- 성능 예산(`e2e/lighthouse.spec.ts` 의 `PAGES`·`MIN_SCORE`·`MAX`)에 걸리면 [ci §CI-02](../ci/SKILL.md#ci-02--실패는-원인을-고친다) 를 따른다.
- 사이트 UI 문구를 쓰거나 고치면 [korean-copy](../korean-copy/SKILL.md) 를 따른다.
