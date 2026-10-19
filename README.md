# 오늘도 끄적끄적

https://perfectacle.github.io — [Astro](https://astro.build) 로 만든 정적 블로그. `master` 에 push 하면 GitHub Actions 가 빌드해 Pages 로 배포한다.

## 글 쓰기

```
src/content/posts/<연도>/<slug>/index.md
src/content/posts/<연도>/<slug>/image.png
```

```markdown
---
title: 제목
date: 2026-10-19 21:00:00
categories: [Programming, Java]
tags: [Java, JVM]
---

본문. 이미지는 같은 폴더에 두고 ![설명](./image.png)
```

- URL 은 `/<date 의 연/월/일>/<slug>/` — 폴더 연도가 아니라 `date` 기준이다. 발행 후 `date`·폴더명을 바꾸면 URL 이 바뀐다.
- 다른 글 링크는 파일 경로로: `[제목](../../2017/ES6-Iterator/index.md#앵커)`. 에디터에서 따라갈 수 있고, 빌드 때 사이트 URL 로 바뀐다. 없는 글을 가리키면 빌드가 실패한다.
- 홈·피드 요약은 본문 첫 문단에서 자동으로 뽑는다.
- 유튜브는 `<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/<id>" loading="lazy" allowfullscreen></iframe></div>`. HTML 블록 다음엔 빈 줄을 둬야 뒤 문단이 마크다운으로 렌더된다.
- 쓰다 만 글은 `drafts/` 에 둔다 (빌드 대상 아님).

## 로컬 실행

Node 24, pnpm 11(`packageManager` 에 고정, `corepack enable` 로 활성화).

```sh
pnpm install
pnpm dev           # http://localhost:4321
pnpm build         # dist/ 생성 + 글 링크 검사 + 원본 이미지 복사 + 검색 색인(Pagefind)
pnpm verify:urls   # Hexo 시절 URL(tests/fixtures/legacy-paths.txt) 이 전부 있는지
pnpm lint          # ESLint
pnpm format        # Prettier
pnpm check         # .astro 포함 타입 검사(astro check, TS 6 API)
pnpm typecheck     # .ts 타입 검사(TypeScript 7 tsc)
pnpm test          # Vitest
```

TypeScript 는 7 을 쓰되(`@typescript/native` → `tsc`), typescript-eslint·astro check 가 아직 TS 7 API 를 지원하지 않아 `typescript` 이름은 TS 6 API 호환 패키지(`@typescript/typescript6`)에 연결해 둔다(TS 공식 병행 방식).

`pnpm-workspace.yaml` 의 `minimumReleaseAge` 로 공개 7일 안 된 버전은 설치되지 않는다. PR 마다 CI 가 lint·format·타입·테스트·빌드·URL 검사를 돌리고, master 머지 시 배포한다. 의존성 갱신은 Dependabot(같은 7일 쿨다운) PR 로 온다.

## 구조

- `src/pages/` — 라우트. 태그·카테고리·아카이브·페이지네이션 경로는 Hexo 시절 URL 을 그대로 재현한다(`/tags/<tag>/page/2/` 등).
- `src/lib/slugize.ts` — hexo-util slugize 와 같은 규칙. 바꾸면 태그/카테고리/본문 앵커 URL 이 바뀐다.
- `src/lib/remark-post-links.ts` — md 의 글 간 파일 경로 링크를 대상 글 `date` 기준 URL 로 변환. `scripts/check-post-links.ts` 가 변환 못 한 링크를 잡는다.
- `src/lib/post-files.ts` — 글 폴더 → URL 규칙(빌드 스크립트·remark 플러그인 공용). `posts.ts` 의 `postPath` 와 같아야 한다.
- `scripts/*.ts` — Node 24 가 타입만 지우고 바로 실행한다(빌드 단계 없음).
- `scripts/copy-post-assets.ts` — 페이지는 최적화 이미지(`/_astro/`)를 쓰지만, 외부 링크·og:image 용으로 원본을 옛 경로에도 둔다.
- `public/` — 그대로 서빙되는 정적 파일(데모 페이지, 사이트 인증 파일 등).
