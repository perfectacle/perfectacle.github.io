# 에이전트 진입 문서

이 저장소는 개인 블로그 https://perfectacle.github.io 의 소스다(Astro, GitHub Pages). 발행된 글 주소와 댓글을 그대로 유지하는 것이 가장 중요한 제약이다. 이 문서는 모든 코딩 에이전트(Claude Code, Codex, Cursor 등)가 처음 읽는 곳이다. 규칙의 정본은 `.agents/` 에 한 벌만 있고, 여기에는 요약과 "무엇을 하려면 어디를 읽나" 만 있다.

도구별 경로는 정본을 가리킨다: `CLAUDE.md` 는 이 파일을 import 하고, `.claude/skills` 는 `.agents/skills` 의 심볼릭 링크다. 스킬을 고칠 때는 `.agents/skills/` 실경로를 쓴다 — 심볼릭 링크 너머 경로는 `git add` 가 거부한다.

## 절대 규칙

어떤 도구를 쓰든 지킨다. 각 줄의 링크가 정본이다.

- **발행된 글의 `date`·폴더명을 바꾸지 않는다** — URL 이 바뀌어 외부 링크와 댓글이 끊긴다. [URL-01](.agents/skills/write-post/SKILL.md#url-01--글-url)
- **발행된 주소 목록과 댓글 경로를 깨지 않는다** — 외부 링크·검색 결과·댓글 스레드가 걸려 있다. [site-code](.agents/skills/site-code/SKILL.md#규칙)
- **글 이미지는 글 폴더 안에 WebP 로, 다른 글 링크는 `/` 로 시작하는 루트 경로로** — [IMG-01](.agents/skills/write-post/SKILL.md#img-01--이미지), [LINK-01](.agents/skills/write-post/SKILL.md#link-01--글-간-링크)
- **릴리스된 지 7일 안 된 의존성을 들이지 않는다** — 보안 수정만 Renovate 가 예외 처리한다. [DEP-01](.agents/skills/dependencies/SKILL.md#dep-01--7일-쿨다운)
- **작업마다 최신 `origin/main` 에서 워크트리를 파고, 머지·배포가 끝나면 지운다** — 다른 에이전트 세션과 체크아웃을 나눠 쓰지 않는다. [GIT-02](.agents/skills/git-workflow/SKILL.md#git-02--작업마다-워크트리)
- **코드·설정·문서 변경은 브랜치 → PR, `ci-ok` 를 통과시킨다** — [GIT-01](.agents/skills/git-workflow/SKILL.md#git-01--브랜치와-pr), [CI-01](.agents/skills/ci/SKILL.md#ci-01--ci-ok-와-자동-머지)
- **검사가 실패하면 기준을 낮추지 말고 원인을 고친다** — [CI-02](.agents/skills/ci/SKILL.md#ci-02--실패는-원인을-고친다)

전체 목록: [불변식 카탈로그](.agents/invariants/INVARIANTS.md)

## 무엇을 하려면 어디를 읽나

| 하려는 일                                                                            | 읽을 정본                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 글을 쓰거나 고친다                                                                   | [write-post](.agents/skills/write-post/SKILL.md)     |
| 사이트 코드(src/lib·pages·components·layouts·styles, astro.config, scripts)를 바꾼다 | [site-code](.agents/skills/site-code/SKILL.md)       |
| 의존성·pnpm·Node·Actions 버전을 바꾸거나 Renovate PR 을 고친다                       | [dependencies](.agents/skills/dependencies/SKILL.md) |
| 워크플로를 바꾸거나 CI 실패를 고친다                                                 | [ci](.agents/skills/ci/SKILL.md)                     |
| 워크트리·브랜치·커밋·PR 을 만들거나 정리한다                                         | [git-workflow](.agents/skills/git-workflow/SKILL.md) |
| 사이트 UI 문구나 README 를 쓴다                                                      | [korean-copy](.agents/skills/korean-copy/SKILL.md)   |

명령은 `package.json` 의 `scripts`, CI 구성은 `.github/workflows/pages.yml` 에서 바로 확인한다.
