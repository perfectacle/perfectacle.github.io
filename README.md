# 오늘도 끄적끄적

https://perfectacle.github.io — [Astro](https://astro.build) 로 만든 정적 블로그. `main` 에 push 하면 GitHub Actions 가 빌드해 GitHub Pages 에 배포한다.

## 글 쓰기

```
src/content/posts/<연도>/<slug>/index.md
src/content/posts/<연도>/<slug>/image.webp
```

```markdown
---
title: 제목
date: 2026-10-19 21:00:00
categories: [Programming, Java]
tags: [Java, JVM]
---

본문. 이미지는 같은 폴더에 두고 ![설명](./image.webp)
```

- URL 은 `/<date 의 연/월/일>/<slug>/` — 폴더 연도가 아니라 `date` 기준이다. 발행 후 `date`·폴더명을 바꾸면 URL 이 바뀐다.
- 다른 글 링크는 파일 경로로: `[제목](../../2017/ES6-Iterator/index.md#앵커)`. 에디터에서 따라갈 수 있고, 빌드 때 사이트 URL 로 바뀐다. 없는 글을 가리키면 빌드가 실패한다.
- 이미지는 WebP 로 둔다(SVG 예외). PNG·JPEG·GIF 를 넣었으면 `pnpm images` 가 WebP 로 바꾸고 글의 참조도 고친다. CI 가 WebP 아닌 이미지를 막는다.
- 홈·피드 요약은 본문 첫 문단에서 자동으로 뽑는다.
- YouTube 영상은 `<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/<id>" loading="lazy" allowfullscreen></iframe></div>` 로 넣는다. HTML 블록 다음엔 빈 줄을 둬야 뒤 문단이 마크다운으로 렌더된다.
- 쓰다 만 글은 `drafts/` 에 둔다 (빌드 대상 아님).

## 로컬 실행

Node 는 `.node-version`, pnpm 은 `package.json` 의 `packageManager` 에 고정된 버전을 쓴다(`corepack enable` 로 활성화). 버전은 Renovate 가 올린다.

```sh
pnpm install
pnpm dev           # http://localhost:4321
pnpm build         # dist/ 생성 + 글 링크 검사 + 원본 이미지 복사 + 검색 인덱스 생성(Pagefind)
pnpm verify:urls   # 옛 Hexo URL(tests/fixtures/legacy-paths.txt) 이 모두 살아 있는지 확인
pnpm lint          # ESLint
pnpm format        # Prettier
pnpm check         # .astro 포함 타입 검사(astro check)
pnpm typecheck     # .ts 타입 검사(네이티브 TypeScript `tsc`)
pnpm test          # Vitest
pnpm verify:dist   # 빌드 결과물의 내부 링크·앵커·sitemap·atom 검사
pnpm test:e2e      # Playwright E2E + axe 접근성(라이트/다크), 빌드 후
pnpm test:lighthouse # 성능 예산(Lighthouse 점수·LCP·CLS·TBT·스크립트 용량), 빌드 후
pnpm audit         # 프로덕션 의존성의 high 이상 취약점 검사
```

TypeScript 컴파일러(`tsc`)는 네이티브 버전(`@typescript/native`)을 쓰고, `typescript` 는 typescript-eslint·astro check 가 쓰는 JS API 호환 패키지(`@typescript/typescript6`)로 alias 해 둔다(TS 팀이 안내하는 side-by-side 설치 방식). 두 도구가 네이티브 API 를 지원하면 하나로 합친다.

`pnpm-workspace.yaml` 의 `minimumReleaseAge` 로 릴리스된 지 7일이 안 된 버전은 설치되지 않는다.

## 의존성 자동 업데이트와 자동 머지

- **Renovate**(`renovate.json`)가 npm·GitHub Actions·Node·pnpm 을 업데이트한다. 릴리스된 지 7일이 지난 버전만 PR 을 만들고, 메이저 업데이트까지 모두 CI 를 통과하면 자동 머지한다.
- **외부 링크**는 매주 월요일 lychee 로 점검해 깨진 링크를 `broken-links` 이슈로 올린다(머지 게이트 아님).
- **보안 업데이트**는 7일을 기다리지 않는다. Renovate 가 `pnpm-workspace.yaml` 의 `minimumReleaseAgeExclude` 에 해당 버전을 넣어 바로 PR 을 만들고, `minimumReleaseAgeExcludePrune` 이 쓸모없어진 예외를 정리한다.
- main 은 `ci-ok` 체크 통과가 필수(관리자 직접 push 는 예외). CI 잡: lint·format·check·typecheck·test·audit·actionlint·zizmor(워크플로 보안)·build(+URL/dist 검사)·e2e·lighthouse, 그리고 **Renovate PR 에서만** base 와 빌드 결과물 비교(`output-diff`) — 렌더 결과가 한 글자라도 달라지면 실패하므로 사람이 직접 확인한다.

## 구조

- `src/pages/` — 라우트. 태그·카테고리·아카이브·페이지네이션 경로는 Hexo 때 URL 을 그대로 유지한다(`/tags/<tag>/page/2/` 등).
- `src/lib/slugize.ts` — hexo-util slugize 와 같은 규칙. 바꾸면 태그/카테고리/본문 앵커 URL 이 바뀐다.
- `src/lib/remark-post-links.ts` — md 의 글 간 파일 경로 링크를 대상 글 `date` 기준 URL 로 변환. `scripts/check-post-links.ts` 가 변환 못 한 링크를 잡는다.
- `src/lib/post-files.ts` — 글 폴더 → URL 규칙(빌드 스크립트·remark 플러그인 공용). `posts.ts` 의 `postPath` 와 같아야 한다.
- `scripts/*.ts` — Node 가 타입만 지우고 바로 실행한다(빌드 단계 없음).
- `src/lib/rehype-youtube-facade.ts` — 글의 YouTube iframe 을 썸네일 버튼으로 바꾼다. 누르면 그때 플레이어를 불러온다(`YoutubeFacade.astro`).
- `src/lib/rehype-post-images.ts` — 본문 이미지를 본문 폭(720px) 기준 srcset 으로, 첫 이미지는 바로 로드. rehype 플러그인만 고치면 Astro 콘텐츠 캐시가 안 바뀌므로 로컬에선 `rm node_modules/.astro/data-store.json` 후 빌드한다.
- `scripts/copy-post-assets.ts` — 페이지는 최적화 이미지(`/_astro/`)를 쓰지만, 외부 링크·og:image 용으로 원본을 옛 경로에도 둔다.
- `public/` — 그대로 서빙되는 정적 파일(데모 페이지, Search Console 등 사이트 소유 확인 파일).
