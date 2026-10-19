---
name: git-workflow
description: 코드·설정을 바꾸기 전에(브랜치), 커밋할 때, PR 을 올릴 때. 브랜치 이름, 커밋 메시지, PR 본문, 자동 머지.
---

# git

이 스킬이 GIT-01 의 정본이다.

## 절차

1. **main 에서 브랜치를 판다** — `git switch main && git pull && git switch -c <종류>/<짧은-설명>`. 종류는 `feat`·`fix`·`perf`·`chore`·`docs`, 글은 `post`. 이름만 보고 PR 성격을 알 수 있게 하려는 관례다.
   완료: 새 브랜치 위에 있다.
2. **커밋한다** — 작성자는 저장소 주인(`perfectacle <perfectacle@gmail.com>`)이다. 개인 저장소라 다른 계정이 기록에 섞이지 않게 한다. 전역 git 설정이 다르면 이 저장소에만 `git config user.email perfectacle@gmail.com` 을 둔다. 커밋은 perfectacle 계정에 등록된 키로 서명해야 한다. 서명이 없거나 GitHub 이 검증하지 못하면 push 가 거부된다. 메시지는 한국어로, 첫 줄은 무엇을 바꿨는지, 본문은 왜 바꿨는지와 이전 문제를 쓴다.
   완료: `git log -1 --format='%an <%ae> %G?'` 가 주인 정보와 `G` 다.
3. **로컬 검증을 끝낸다** — 바꾼 범위에 맞게 [site-code 절차 4](../site-code/SKILL.md#절차) 의 검사를 돌린다.
   완료: 전부 통과.
4. **PR 을 올리고 자동 머지를 건다** — `gh pr create --base main` 후 `gh pr merge --auto --merge`. merge 커밋으로 넣어 PR 단위 이력을 남긴다. squash 는 꺼져 있다. 본문에는 무엇을·왜·어떻게 검증했는지와, 사용자가 알아야 할 부작용(옛 주소 변화 등)을 쓴다.
   완료: PR 이 열리고 auto-merge 가 켜졌다.
5. **머지와 배포까지 지켜본다** — 실패하면 [ci](../ci/SKILL.md) 절차로 고친다. 머지 후 main 의 배포 잡이 성공했는지 본다.
   완료: main 배포 잡이 성공.

## 규칙

### GIT-01 — 브랜치와 PR

글·코드·설정·문서 모든 변경은 브랜치에서 하고 PR 로 main 에 넣는다. 저장소 주인도 예외가 없다. 저장소 ruleset 이 아래를 강제한다.

- 모든 브랜치: 서명된 커밋만 push 된다.
- main: PR 필수(merge·rebase 만), `ci-ok` 필수, 삭제·force-push 금지, `[skip ci]` 류 커밋 메시지 금지(체크가 생기지 않아 게이트를 통과한 것처럼 보이기 때문).
- 태그: 삭제·force-push 금지.

- 이유: `ci-ok`(빌드·옛 주소·접근성·성능 검사)를 거쳐야 사이트가 깨지지 않는다는 보장이 생긴다.
- 커밋 메시지·코드 주석에는 이 대화나 작업 맥락(세션, 계획 문서 번호)을 적지 않는다. 저장소만 보는 사람이 이해할 수 있는 이유만 쓴다.
