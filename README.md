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
- 홈·피드 요약은 본문 첫 문단에서 자동으로 뽑는다.
- 유튜브는 `<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/<id>" loading="lazy" allowfullscreen></iframe></div>`. HTML 블록 다음엔 빈 줄을 둬야 뒤 문단이 마크다운으로 렌더된다.
- 쓰다 만 글은 `drafts/` 에 둔다 (빌드 대상 아님).

## 로컬 실행

```sh
npm ci
npm run dev       # http://localhost:4321
npm run build     # dist/ 생성 + 원본 이미지 복사 + 검색 색인(Pagefind)
```

## 구조

- `src/pages/` — 라우트. 태그·카테고리·아카이브·페이지네이션 경로는 Hexo 시절 URL 을 그대로 재현한다(`/tags/<tag>/page/2/` 등).
- `src/lib/slugize.ts` — hexo-util slugize 와 같은 규칙. 바꾸면 태그/카테고리/본문 앵커 URL 이 바뀐다.
- `scripts/copy-post-assets.mjs` — 페이지는 최적화 이미지(`/_astro/`)를 쓰지만, 외부 링크·og:image 용으로 원본을 옛 경로에도 둔다.
- `public/` — 그대로 서빙되는 정적 파일(데모 페이지, 사이트 인증 파일 등).
