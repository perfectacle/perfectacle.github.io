---
name: write-post
description: 블로그 글을 새로 쓰거나 고칠 때(src/content/posts/**). 글 폴더·frontmatter·이미지·글 간 링크·유튜브·초안 규칙과 발행 전 확인 절차.
---

# 글 쓰기

이 스킬이 URL-01, IMG-01, LINK-01 의 정본이다.

## 절차

1. **폴더를 만든다** — `src/content/posts/<연도>/<slug>/index.md`. `<slug>` 가 URL 이 되므로 영어 소문자·숫자·하이픈으로 짓는다. 대소문자가 섞이면 macOS 와 Linux 에서 다른 폴더가 되고 링크를 손으로 칠 때 틀리기 쉽다(옛 글의 대문자 slug 는 그대로 둔다, URL-01).
   완료: 폴더와 `index.md` 가 있다.
2. **frontmatter 를 쓴다** — `title`, `date`(`YYYY-MM-DD HH:mm:ss`, 한국 시각 그대로), `categories`(상위→하위 배열), `tags`. 필요하면 `image`(og:image 와 목록 썸네일로 쓸 이미지 경로)도 넣는다. `image` 가 없으면 본문 첫 이미지가 그 역할을 한다. 연재 글이면 `series` 에 시리즈 이름을, `seriesOrder` 에 읽는 순서(1부터 정수)를 넣는다. `series` 값이 글자 하나까지 같은 글끼리 한 시리즈가 되고 `seriesOrder` 순으로 놓인다(없으면 맨 뒤, 같으면 `date`, 그다음 폴더 이름순). 새 편을 쓰면 기존 글의 `seriesOrder` 다음 숫자를 쓴다. 스키마는 `src/content.config.ts`.
   완료: `pnpm check` 가 스키마 오류 없이 끝난다.
3. **이미지를 같은 폴더에 넣고 상대 경로로 건다** — 원본 확장자 그대로 `![설명](./파일.png)` 로 건 뒤 `pnpm images` 를 돌린다. 파일이 WebP 로 바뀌고 본문의 참조도 같이 고쳐진다(IMG-01).
   완료: `pnpm lint:images` 통과.
4. **다른 글은 `/` 로 시작하는 사이트 주소로 링크한다** — `[제목](/2017/04/22/ES6-Iterator/#앵커)`(LINK-01). 날짜는 대상 글 frontmatter 의 `date` 다. 앵커는 `pnpm build` 후 대상 글의 `dist/<연>/<월>/<일>/<slug>/index.html` 에서 heading 의 `id` 를 복사한다.
   완료: `pnpm build && pnpm verify:dist` 통과(없는 글·앵커면 `verify:dist` 가 실패시킨다).
5. **확인한다** — `pnpm check && pnpm lint:images && pnpm build && pnpm verify:urls && pnpm verify:dist` 를 돌리고 `pnpm dev` 로 글을 열어 본다. 글도 [git-workflow](../git-workflow/SKILL.md) 대로 PR 로 올린다(main 직접 push 는 막혀 있다).
   완료: 글이 깨짐 없이 보이고 PR 의 `ci-ok` 가 초록.

## 규칙

### URL-01 — 글 URL

글 URL 은 `/<date 의 연>/<월>/<일>/<폴더명>/` 이다. 폴더의 연도 디렉터리는 정리용일 뿐 URL 에 쓰이지 않고, 날짜는 frontmatter `date` 문자열 그대로다(시간대 변환 없음).

- 발행된 글의 `date` 와 폴더명은 바꾸지 않는다. 바꾸면 외부 링크·검색 결과·댓글 스레드가 끊긴다. 오타가 있는 옛 slug(`Module-bundling-with-Webpck` 등)도 그대로 둔다.
- 새 글은 연도 폴더를 `date` 의 연도와 같게 둔다(어긋나도 동작은 하지만 찾기 어렵다).

### IMG-01 — 이미지

글이 쓰는 이미지는 그 글 폴더 안에 WebP 로 둔다. SVG 는 예외로 그대로 둔다.

- 이유: 글과 이미지가 한 폴더라 글을 옮기거나 지울 때 함께 따라가고, WebP 는 같은 화질에 용량이 작아 Pages 1GB 한도와 모바일 데이터를 아낀다.
- `pnpm images` 가 PNG(대부분 무손실)·JPEG(q75, 위치 정보 제거)·GIF(움직이는 WebP)를 바꾸고 글의 참조까지 고친다. CI 의 `lint:images` 가 WebP 아닌 글 이미지를 막는다.
- 첫 이미지는 화면에 바로 보이는 경우가 많아 즉시 로드되고, og:image 로도 쓰인다. 대표 이미지를 정하고 싶으면 그 이미지를 본문 맨 앞에 둔다.

### LINK-01 — 글 간 링크

다른 글과 사이트 안의 다른 페이지는 도메인 없이 `/` 로 시작하는 루트 경로로 링크한다: `/<연>/<월>/<일>/<slug>/#앵커`. `https://perfectacle.github.io/...` 처럼 도메인을 넣지 않고, `../` 를 거슬러 올라가는 상대 경로도 쓰지 않는다. 같은 글 폴더의 이미지(`./파일.webp`, IMG-01)만 예외다.

- 이유: 도메인이 바뀌어도 링크가 그대로 살고, 원본만 읽어도 어느 글로 가는지 바로 보인다.
- 날짜를 틀리거나 앵커가 없으면 `pnpm build && pnpm verify:dist` 가 실패한다. 앵커는 사이트의 heading id 규칙(URL-02)을 따른다.
- 예제 코드 안의 전체 URL(다른 곳에서 돌려 볼 `fetch` 주소 등)은 링크가 아니라 코드라 그대로 둔다.

## 참고

- **유튜브**: `<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/<id>"></iframe></div>` 를 한 줄로 넣고 **다음 줄은 비운다**. 빈 줄이 없으면 CommonMark 가 뒤 문단까지 HTML 로 취급해 마크다운이 렌더되지 않는다. 빌드 때 썸네일 버튼으로 바뀌고 누르면 재생된다. `?start=초` 는 유지된다.
- **mermaid**: ` ```mermaid ` 코드블록이면 다이어그램이 화면 근처에 왔을 때 그려진다.
- **초안**: `drafts/<slug>.md` 와 이미지 폴더 `drafts/<slug>/` 로 둔다. 빌드 대상이 아니다. 발행할 때 1번 구조로 옮긴다.
- **소개 페이지**(`src/pages/about.md`)는 글이 아니다. 작성자 본인의 글이라 문구도 작성자가 고친다.
- **요약**: 홈·피드·description 은 본문 첫 일반 문단(10자 이상)에서 자동으로 뽑는다. 첫 문단을 요약답게 쓰면 그대로 쓰인다.
