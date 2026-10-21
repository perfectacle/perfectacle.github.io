---
name: git-workflow
description: 코드·설정을 바꾸기 전에(워크트리·브랜치), 커밋할 때, PR 을 올릴 때, 머지·배포 후 정리할 때. 워크트리, 브랜치 이름, 커밋 메시지, PR 본문, 자동 머지, 워크트리 삭제.
---

# git

이 스킬이 GIT-01 의 정본이다.

## 절차

1. **최신 main 에서 워크트리를 판다** — 기존 체크아웃에서 `git switch` 하지 않는다. 다른 에이전트 세션이 같은 체크아웃에서 일하고 있을 수 있어서, 브랜치를 바꾸면 그 세션의 작업 트리가 통째로 바뀐다. [GIT-02](#git-02--작업마다-워크트리)
   ```sh
   git fetch origin main
   git worktree add -b <종류>/<짧은-설명> ../perfectacle.github.io-<짧은-설명> origin/main
   cd ../perfectacle.github.io-<짧은-설명>
   pnpm install --frozen-lockfile
   ```
   브랜치 종류는 `feat`·`fix`·`perf`·`chore`·`docs`, 글은 `post`. 이름만 보고 PR 성격을 알 수 있게 하려는 관례다. 워크트리 폴더는 저장소 옆에 `perfectacle.github.io-<짧은-설명>` 으로 둔다. 로컬 `main` 은 다른 세션이 쓰고 있을 수 있어 건드리지 않고 `origin/main` 에서 바로 딴다. 이후 모든 명령은 이 워크트리 안에서 실행한다.
   완료: `git worktree list` 에 새 워크트리가 있고, 그 안에서 `git log -1 origin/main` 이 HEAD 와 같다.
2. **커밋한다** — 작성자는 저장소 주인(`perfectacle <perfectacle@gmail.com>`)이다. 개인 저장소라 다른 계정이 기록에 섞이지 않게 한다. 전역 git 설정이 다르면 이 저장소에만 `git config user.email perfectacle@gmail.com` 을 둔다. 커밋은 perfectacle 계정에 등록된 키로 서명해야 한다. 서명이 없거나 GitHub 이 검증하지 못하면 push 가 거부된다. 메시지는 한국어로, 첫 줄은 무엇을 바꿨는지, 본문은 왜 바꿨는지와 이전 문제를 쓴다.
   완료: `git log -1 --format='%an <%ae> %G?'` 가 주인 정보와 `G` 다.
3. **로컬 검증을 끝낸다** — 바꾼 범위에 맞게 [site-code 절차 4](../site-code/SKILL.md#절차) 의 검사를 돌린다.
   완료: 전부 통과.
4. **PR 을 올리고 자동 머지를 건다** — `gh pr create --base main` 후 `gh pr merge --auto --merge`. merge 커밋으로 넣어 PR 단위 이력을 남긴다. squash·rebase 는 꺼져 있다. 본문에는 무엇을·왜·어떻게 검증했는지와, 사용자가 알아야 할 부작용(옛 주소 변화 등)을 쓴다.
   완료: PR 이 열리고 auto-merge 가 켜졌다.
5. **머지와 배포까지 지켜본다** — 실패하면 [ci](../ci/SKILL.md) 절차로 고친다. 머지 후 main 의 배포 잡이 성공했는지 본다.
   완료: main 배포 잡이 성공.
6. **워크트리를 지운다** — 배포 잡이 성공하면 묻지 않고 바로 정리한다. PR 을 머지하지 않고 닫았을 때도 같다. 지우는 워크트리 안에 셸이 머물면 이후 명령이 깨지므로 원래 체크아웃으로 나와서 실행한다.
   ```sh
   cd "$(git worktree list --porcelain | sed -n '1s/^worktree //p')"
   gh pr view <브랜치> --json state -q .state   # MERGED 또는 CLOSED 인지 확인
   git worktree remove ../perfectacle.github.io-<짧은-설명>
   git branch -D <브랜치>
   git push origin --delete <브랜치> 2>/dev/null || true   # 원격 브랜치가 남아 있으면
   git worktree prune
   ```
   `git worktree remove` 가 커밋 안 된 변경이나 추적 안 된 파일 때문에 거부하면 `--force` 를 쓰지 않는다. 무엇이 남았는지 보고 사용자에게 알린다. PR 이 아직 열려 있으면 지우지 않는다.
   완료: `git worktree list` 와 `git branch --list <브랜치>` 에 더는 없다.

## 규칙

### GIT-01 — 브랜치와 PR

글·코드·설정·문서 모든 변경은 브랜치에서 하고 PR 로 main 에 넣는다. 저장소 주인도 예외가 없다. 저장소 ruleset 이 아래를 강제한다.

- 모든 브랜치: 서명된 커밋만 push 된다.
- main: PR 필수(merge 커밋만), `ci-ok` 필수, 삭제·force-push 금지. 커밋 메시지에 `[skip ci]` 류를 쓰지 않는다. 워크플로가 돌지 않아 `ci-ok` 가 생기지 않고 PR 이 머지되지 못한 채 멈춘다(개인 계정 저장소는 커밋 메시지 규칙을 ruleset 으로 걸 수 없다).
- 태그: 삭제·force-push 금지.

- 이유: `ci-ok`(빌드·옛 주소·접근성·성능 검사)를 거쳐야 사이트가 깨지지 않는다는 보장이 생긴다.
- 커밋 메시지·코드 주석에는 이 대화나 작업 맥락(세션, 계획 문서 번호)을 적지 않는다. 저장소만 보는 사람이 이해할 수 있는 이유만 쓴다.

### GIT-02 — 작업마다 워크트리

작업 하나는 최신 `origin/main` 에서 판 워크트리 하나에서 한다. 기존 체크아웃(저장소 원래 폴더나 다른 작업의 워크트리)에서 브랜치를 바꾸거나 파일을 고치지 않는다. 작업이 끝나면(머지 후 배포 성공, 또는 PR 을 닫음) 그 워크트리와 로컬 브랜치를 지운다.

- 이유: 여러 코딩 에이전트 세션이 한 저장소에서 동시에 일한다. 한 체크아웃을 나눠 쓰면 서로의 변경이 섞이거나 브랜치가 바뀌어 작업이 사라진다. 다 쓴 워크트리를 남겨 두면 폴더와 브랜치가 쌓여 어느 것이 살아 있는 작업인지 알 수 없게 된다.
- 예외: 지우려는 워크트리에 커밋 안 된 변경이 남아 있으면 지우지 않고 사용자에게 알린다.
