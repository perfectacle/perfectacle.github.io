---
name: dependencies
description: npm 의존성·pnpm·Node·GitHub Actions 버전을 추가하거나 올릴 때, 또는 Renovate PR 이 실패했을 때. 7일 쿨다운, lockfile, TypeScript 6/7 병행 구성.
---

# 의존성

이 스킬이 DEP-01, DEP-02 의 정본이다. 평소 업데이트는 Renovate 가 PR 로 올리고 CI 가 통과하면 자동 머지된다(`renovate.json`). 사람이나 에이전트가 직접 손대는 것은 새 의존성 추가와 Renovate PR 이 실패했을 때다. 기존 의존성을 직접 올리지 않는다. Renovate PR 에서만 렌더 결과 비교(`output-diff`)가 돌아서, 직접 올리면 렌더가 조용히 바뀌어도 못 잡는다. 급하면 Renovate 대시보드 이슈에서 해당 업데이트를 체크해 바로 PR 을 만들게 한다.

## 절차 — 의존성 추가·변경

1. **설치한다** — `pnpm add --save-exact <pkg>`(개발용이면 `-D`). `pnpm-workspace.yaml` 의 쿨다운이 7일 안 된 버전을 알아서 건너뛴다.
   완료: `package.json` 에 정확한 버전이 들어갔다.
2. **peer 를 확인한다** — `pnpm peers check`.
   완료: "No peer dependency issues found".
3. **깨끗한 설치로 검증한다** — `rm -rf node_modules && pnpm install --frozen-lockfile` 후 CI 와 같은 검사를 돌린다([site-code 절차 4](../site-code/SKILL.md#절차)).
   완료: 전부 통과.

## 규칙

### DEP-01 — 7일 쿨다운

릴리스된 지 7일이 지난 버전만 쓴다. pnpm(`minimumReleaseAge: 10080`)과 Renovate(`minimumReleaseAge: 7 days`) 양쪽에 걸려 있고, CI 의 frozen 설치도 lockfile 의 모든 항목(간접 의존성 포함)을 다시 검사해 7일 안 된 버전이 있으면 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` 으로 실패한다.

- 이유: 공급망 공격은 대개 배포 직후 며칠 안에 발견·회수된다.
- 예외는 보안 수정 하나다. Renovate 는 취약점 PR 에 쿨다운을 적용하지 않는다(`vulnerabilityAlerts`). pnpm 쪽은 그 버전을 `pnpm-workspace.yaml` 의 `minimumReleaseAgeExclude` 에 넣어야 설치되고, `minimumReleaseAgeExcludePrune` 이 lockfile 이 더 쓰지 않는 항목을 지운다. 예외는 취약점 수정 버전에만, 근거(advisory 링크)를 PR 에 적고 넣는다.
- `audit` 잡이 새 advisory 로 실패했는데 수정 버전이 쿨다운 안이면 위 예외로 넣는다. 수정 버전이 없으면 PR 에 advisory 와 영향 여부를 적고 저장소 주인에게 넘긴다.
- GitHub Actions 도 같은 기준이다. 액션은 커밋 SHA 로 고정하고 `# vX.Y.Z` 주석을 단다(Renovate 가 둘 다 올린다). docker 이미지(actionlint)는 digest 로, pipx 로 도는 zizmor 는 잡 env 의 `ZIZMOR` 한 곳에 `==` 버전으로 두고 `renovate.json` 의 customManager 가 올린다(캐시 키와 실행이 같은 값을 읽는다).

### DEP-02 — lockfile

`package.json` 을 바꾸면 lockfile 도 같이 바뀌어야 하고 `pnpm install --frozen-lockfile` 이 통과해야 한다.

- 충돌이 나면 main 의 lockfile 을 가져와(`git checkout origin/main -- pnpm-lock.yaml`) `pnpm install` 로 다시 만든다. 손으로 고치지 않는다.
- pnpm 은 엄격 격리라 코드가 import 하는 패키지는 직접 의존성이어야 한다. 다른 패키지를 통해 우연히 보이는 것(phantom)에 기대면 pnpm 버전이 바뀔 때 깨진다(실제로 `jiti`, `sharp` 에서 있었다).

## 참고

- **astro 는 묶어서 올린다**: `astro`·`@astrojs/*` 는 Renovate 가 한 PR 로 묶는다. `astro.config.ts` 가 `@astrojs/markdown-remark` 를 직접 import 하므로 따로 올리면 마크다운 처리기 버전이 어긋난다.
- **TypeScript**: `tsc` 는 네이티브 TS 7(`@typescript/native` 라는 별칭으로 설치한 `npm:typescript@7.x`), `typescript` 라는 이름은 TS 6 API 호환 패키지(`npm:@typescript/typescript6`)다. typescript-eslint 와 astro check 가 TS 7 에서 빠진 컴파일러 API 를 쓰기 때문이다. `typescript` 를 7 로 올리지 않는다. 두 도구가 TS 7 을 지원한다고 릴리스 노트에 밝히면 하나로 합친다.
- **Renovate PR 이 실패했을 때**: CI 로그로 원인을 찾아 같은 브랜치에 커밋해 고친다. `output-diff` 가 실패했다면 업데이트로 렌더 결과가 바뀐 것이다. 차이를 보고 의도된 변화면 사람이 머지하고, 아니면 고친다([ci](../ci/SKILL.md)).
- **pnpm·Node 버전**은 `package.json` 의 `packageManager`(해시 포함)와 `.node-version` 이 정한다. corepack 으로 활성화한다(`corepack enable pnpm`).
