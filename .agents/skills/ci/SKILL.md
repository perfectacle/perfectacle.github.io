---
name: ci
description: GitHub Actions 워크플로를 바꾸거나 CI 가 실패했을 때. 필수 체크 ci-ok, 자동 머지, 봇 PR 결과물 비교, 결과 재사용 캐시, 실패 대응 원칙.
---

# CI

이 스킬이 CI-01, CI-02 의 정본이다. 워크플로는 `.github/workflows/pages.yml`(검사·빌드·배포)과 `links.yml`(외부 링크 주간 점검)이다. 잡 목록은 워크플로 파일을 본다.

## 절차 — CI 가 실패했을 때

1. **실패한 잡과 로그를 본다** — `gh run view <run-id> --log-failed`.
   완료: 실패 원인을 한 문장으로 말할 수 있다.
2. **로컬에서 재현한다** — 같은 명령을 깨끗한 설치에서 돌린다(`rm -rf node_modules/.pnpm .astro && pnpm install --frozen-lockfile`). 로컬은 앞 명령이 만든 상태(`.astro/` 등)가 남아 CI 와 다르게 통과할 수 있다. `node_modules` 를 통째로 지우면 이미지 캐시(`node_modules/.astro/assets`)까지 지워져 다음 빌드가 오래 걸린다.
   완료: 재현되거나, 로컬에서는 통과한다.
3. **로컬에서 통과하면 러너 편차인지 가린다** — Lighthouse 처럼 타이밍을 재는 잡만 해당한다. 로그의 페이지별 중앙값(`console.log` 줄)이 임계값 바로 아래면 `gh run rerun <run-id> --failed` 로 한 번 다시 돌린다. CI 는 이미 잡 안에서 1회 재시도한다(`playwright.config.ts` 의 `retries`).
   완료: 다시 돌려 통과했거나, 두 번 연속 실패해 4로 간다.
4. **원인을 고치고 같은 PR 에 push 한다**(CI-02). 두 번 연속 실패한 성능 점수는 편차가 아니라 회귀로 본다. `lighthouse-traces-N` 아티팩트에 실패한 실행의 trace 가 있다.
   완료: 새 커밋의 `ci-ok` 가 초록.

## 규칙

### CI-01 — ci-ok 와 자동 머지

main 은 `ci-ok` 체크 통과가 필수다(저장소 ruleset). `ci-ok` 는 모든 잡을 모아 하나라도 실패·취소면 실패한다. 통과한 PR 은 GitHub 자동 머지로 머지된다. 배포는 PR 이 아닌 실행(main push·수동 실행)에서만 하고, `github-pages` 환경이 main 만 허용한다.

- 새 잡을 추가하면 `ci-ok` 의 `needs` 에 넣는다. 빠지면 그 잡이 실패해도 머지된다.
- 자동 머지는 체크가 통과하는 순간 일어난다. PR 에 커밋을 더 올릴 계획이면 그 전에 머지될 수 있으니, 다 올린 뒤에 `gh pr merge --auto --merge` 를 건다.
- Renovate PR 에서만 `output-baseline`/`output-diff` 가 돌아 base 와 렌더 결과(페이지 목록·본문 HTML)를 비교한다. 한 글자라도 다르면 실패해 사람이 보게 된다. 사람 PR 은 의도적으로 결과를 바꾸므로 돌지 않는다.
- 배포 잡은 `needs.ci-ok.result == 'success'` 로 판정한다. 기본 `success()` 는 봇 전용으로 skip 된 상위 잡 때문에 거짓이 되어 배포가 건너뛰어진다.

### CI-02 — 실패는 원인을 고친다

검사가 실패하면 기준(예산·임계값·규칙)을 낮추지 않고 원인을 고친다. 기준을 바꾸는 것은 측정 방식 자체가 틀렸다는 근거가 있을 때뿐이고, 그 근거를 PR 에 적는다.

- 예: mermaid 글의 성능 점수가 기준을 오갈 때 기준을 내리지 않고, 다이어그램을 화면 근처에서 그리게 바꿔 TBT 를 0 으로 만들었다.
- Lighthouse 타이밍은 러너 CPU 에 따라 흔들려 페이지당 3회 중앙값으로 판정한다. 용량(스크립트·이미지·폰트)은 결정적이라 엄격하다.

## 참고

- **결과 재사용**: PR 에서 잡마다 입력 파일 해시로 "통과 표식"을 캐시해 같은 입력이면 설치·실행을 건너뛴다. 입력 범위를 바꾸는 변경(새 파일 종류를 읽는 검사 등)은 그 잡의 fingerprint 패턴도 같이 고친다.
- **이미지 캐시** 키에는 `astro.config.ts` 와 `src/lib/rehype-post-images.ts` 의 해시가 들어간다(`.github/actions/astro-assets-cache`). 이미지 처리 설정을 다른 파일로 옮기면 키도 고친다.
- **동시 실행 한도**: 무료 계정은 동시 20잡이다. 대기열에 오래 머물면 다른 실행과 겹친 것이다. PR 이 main 과 충돌하면 `pull_request` 워크플로가 아예 시작되지 않는다(머지 상태 `DIRTY`).
- **외부 링크 점검**: `links.yml` 이 매주 깨진 외부 링크를 `broken-links` 이슈로 올린다. 옛 글의 죽은 링크는 글 작성자가 판단할 일이라 에이전트가 임의로 고치지 않는다.
- **보안 점검**: `zizmor` 잡이 워크플로를 검사한다. checkout 에는 `persist-credentials: false`(이 워크플로는 push 하지 않는다).
