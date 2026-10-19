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

URL·이미지·글 간 링크·유튜브 규칙은 [글 쓰기 가이드](.agents/skills/write-post/SKILL.md)에 있다.

## 로컬 실행

Node 는 `.node-version`, pnpm 은 `package.json` 의 `packageManager` 에 고정된 버전을 쓴다(`corepack enable pnpm` 으로 활성화).

```sh
pnpm install
pnpm dev     # http://localhost:4321
pnpm build
```

다른 명령은 `package.json` 의 `scripts` 에 있다.

## 더 읽기

코드·의존성·CI·PR 규칙은 [AGENTS.md](AGENTS.md) 에서 시작한다(사람과 코딩 에이전트가 같은 문서를 본다).
