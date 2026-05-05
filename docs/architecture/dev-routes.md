# `/dev/*` Routes — Convention

> 각 Work의 검증을 위한 dev 페이지 모음. 자세한 배경은
> [overview.md §4 작업 가시성 정책](../plan/overview.md#4-작업-가시성-정책-per-work-visibility) 참조.

## 위치 / 구조

```
src/
├── App.tsx              # 라우터 루트. import.meta.env.DEV 일 때만 lazy(DevApp) 분기
├── routes/Home.tsx      # `/`
└── dev/
    ├── DevApp.tsx       # `/dev/*` sub-router. registry 기반 동적 라우트
    ├── DevIndex.tsx     # `/dev` / `/dev/index` 카탈로그 페이지
    ├── DevCard.tsx      # placeholder/available 상태 카드
    ├── registry.ts      # Work 별 entry 정의 (단일 진실원)
    └── dev.css          # dev 페이지 전용 스타일 (DevApp에서 import → 같은 chunk)
```

- 메인 앱과 분리: `dev/` 디렉터리는 `routes/` / `ui/` 등에 의존하지 않는다 (역방향만 허용).
- 스타일은 `dev.css` 한 곳에. DevApp이 import → 빌드 시 같은 chunk에 묶여 prod에서 함께 제외.

## 새 dev 페이지 추가 절차 (Work N에서)

1. `src/dev/work-NN-<slug>/Page.tsx` 작성 (해당 Work의 검증 UI).
2. `src/dev/registry.ts` 의 해당 entry 에 `Component` 필드 추가:
   ```ts
   import { lazy } from 'react'
   // ...
   {
     workNumber: N,
     slug: '<slug>',
     // ...
     Component: lazy(() => import('./work-NN-<slug>/Page')),
   }
   ```
3. 끝. `DevApp` 이 registry 를 순회해 라우트를 자동 생성하고, `DevCard` 가 카드를 link 로 활성화한다.

## 프로덕션 빌드 dev 제외 정책

`App.tsx` 의 활성화 조건:

```ts
const enableDevRoutes = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_ROUTES === 'true'

const DevApp = enableDevRoutes ? lazy(() => import('./dev/DevApp')) : null
```

| 모드                    | `import.meta.env.DEV` | `VITE_ENABLE_DEV_ROUTES` | dev 라우트 |
| ----------------------- | --------------------- | ------------------------ | ---------- |
| `pnpm dev`              | true                  | (무관)                   | **활성**   |
| `pnpm build` (기본)     | false                 | (미설정)                 | **제외**   |
| `pnpm build` (스테이징) | false                 | `true`                   | **활성**   |

빌드 시 Vite/esbuild 가 `import.meta.env.DEV` 와 `import.meta.env.VITE_*` 를 상수 치환 → 조건이 false 로 평가되면 `lazy()` 의 dynamic import 가 dead-code 제거된다. 결과적으로 dev chunk 는 프로덕션 산출물에 생성되지 않는다.

검증 명령:

```bash
pnpm build
ls dist/assets | grep -iE 'dev'    # 매치 없어야 함
grep -lr "DevIndex" dist/assets    # 매치 없어야 함
```

## dev 페이지 작성 가이드

- **목적**: 기능 검증. 폴리시·접근성은 Work 10/11 책임.
- **레이아웃**: 헤더에 한 줄 요약(이 페이지가 무엇을 검증하는지). 이후 입력/출력 섹션.
- **단위 명시**: 모든 수치 출력에 단위 표기 (`km`, `mas`, `µs`, `JD` 등).
- **Python reference 비교**: 가능하면 같은 입력에 대한 Python 결과 fixture 와 diff 표시.
- **상태 보존 불필요**: refresh 시 초기 상태 OK. URL 쿼리스트링으로 자주 쓰는 값 공유 정도면 충분.

## 카드 상태

| `Component` 필드 | 상태        | 표시                                  |
| ---------------- | ----------- | ------------------------------------- |
| 없음             | placeholder | 회색, `aria-disabled`, 카드 클릭 불가 |
| 있음             | available   | link 로 활성, hover 시 강조           |

## 비고

- dev 라우트는 e2e 테스트 대상에 포함된다 (P5 — `tests/e2e/dev-index.spec.ts` 가 카드 11개 보장).
- 새 dev 페이지를 추가하면 registry 가 늘고, e2e 테스트도 같이 갱신해야 한다.
