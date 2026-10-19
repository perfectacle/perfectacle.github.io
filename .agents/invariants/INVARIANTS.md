# 불변식 카탈로그

이 저장소가 지키는 규칙의 목록이다. 이 파일에는 규칙의 요지와 **소유자**(규칙 본문이 있는 스킬의 절)만 있다. 본문·이유·예외는 소유자에서 읽는다. 규칙을 바꿀 때는 소유자 한 곳만 고치고, 이 표의 요지가 달라졌으면 이 줄도 고친다.

## URL·호환 — 옛 Hexo 블로그의 주소와 앵커, 댓글을 깨지 않는다

| ID     | 요지                                                                                                           | 소유자                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| URL-01 | 글 URL 은 `/YYYY/MM/DD/<폴더명>/`, 날짜는 frontmatter `date` 그대로. 발행된 글의 `date`·폴더명은 바꾸지 않는다 | [write-post §URL-01](../skills/write-post/SKILL.md#url-01--글-url)           |
| URL-02 | 태그·카테고리 slug 와 본문 heading id 는 hexo-util slugize 규칙                                                | [site-code §URL-02](../skills/site-code/SKILL.md#url-02--slug-와-heading-id) |
| URL-03 | Hexo 시절 페이지(`tests/fixtures/legacy-paths.txt` 의 모든 경로)는 항상 존재                                   | [site-code §URL-03](../skills/site-code/SKILL.md#url-03--옛-주소-계약)       |
| CMT-01 | Disqus identifier 는 앞 슬래시 없는 경로(`2022/06/06/slug/`)                                                   | [site-code §CMT-01](../skills/site-code/SKILL.md#cmt-01--disqus-identifier)  |

## 콘텐츠

| ID      | 요지                                                      | 소유자                                                                   |
| ------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| IMG-01  | 글 이미지는 글 폴더 안에, WebP 로(SVG 예외)               | [write-post §IMG-01](../skills/write-post/SKILL.md#img-01--이미지)       |
| LINK-01 | 다른 글 링크는 파일 경로(`../../YYYY/slug/index.md#앵커`) | [write-post §LINK-01](../skills/write-post/SKILL.md#link-01--글-간-링크) |
| COPY-01 | 사이트 UI 문구는 합니다체·번역투 없이, 용어집을 따른다    | [korean-copy](../skills/korean-copy/SKILL.md)                            |

## 의존성·CI·git

| ID     | 요지                                                                        | 소유자                                                                      |
| ------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| DEP-01 | 릴리스된 지 7일 지난 버전만 쓴다(보안 수정만 예외)                          | [dependencies §DEP-01](../skills/dependencies/SKILL.md#dep-01--7일-쿨다운)  |
| DEP-02 | 의존성을 바꾸면 lockfile 과 `pnpm install --frozen-lockfile` 이 맞아야 한다 | [dependencies §DEP-02](../skills/dependencies/SKILL.md#dep-02--lockfile)    |
| CI-01  | main 은 `ci-ok` 통과가 필수, 통과한 PR 은 자동 머지                         | [ci §CI-01](../skills/ci/SKILL.md#ci-01--ci-ok-와-자동-머지)                |
| CI-02  | 실패하면 기준을 낮추지 말고 원인을 고친다                                   | [ci §CI-02](../skills/ci/SKILL.md#ci-02--실패는-원인을-고친다)              |
| GIT-01 | 코드·설정·문서 변경은 브랜치 → PR, 머지 전 로컬 검증                        | [git-workflow §GIT-01](../skills/git-workflow/SKILL.md#git-01--브랜치와-pr) |
