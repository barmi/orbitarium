# Work 1 — Handoff (Project Foundation)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-01-foundation.md`](work-01-foundation.md)

---

## 0. 현재 상태 (Status)

| 항목 | 값 |
|---|---|
| 현재 phase | **P3 완료** ✓ — 다음은 **P4 (three.js Hello)** |
| 다음 액션 | P4 시작: `/` 에 회전 sphere + FPS 카운터 + 별 1점 (three.js 파이프라인 검증 수준) |
| 마지막 갱신 | 2026-05-05 |
| 블로커 | 없음 |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-01-foundation.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Tech Decisions & Repo Bootstrap _(완료 2026-05-05)_
- [x] **P2** — Quality Tooling _(완료 2026-05-05)_
- [x] **P3** — App Shell & Dev Routes _(완료 2026-05-05)_
- [ ] **P4** — three.js Hello
- [ ] **P5** — Test Frameworks
- [ ] **P6** — Python Tooling Smoke
- [ ] **P7** — CI Pipeline Skeleton

## 2. 결정 로그 (Decision Log)

| # | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
|---|---|---|---|---|---|
| 1 | 패키지 매니저 | **pnpm** | 빠른 install / 디스크 효율 / corepack으로 버전 핀 가능. Node 20+ 기본 동반. | P1 | 2026-05-05 |
| 2 | 프레임워크 / 3D 통합 | **React 19 + react-three-fiber** | Work 10 UI 패널 생산성 + drei 등 R3F 헬퍼 활용. R3F v9+가 React 19 호환. | P1 | 2026-05-05 |
| 3 | Node 버전 | **Node 20 LTS** (`.nvmrc` = `20`) | 장기 지원 / Vite·Playwright 호환 검증 / CI 표준. 개발 머신은 23.10이지만 호환. | P1 | 2026-05-05 |
| 4 | 빌드 도구 | **Vite** | Work 1 plan에서 사실상 확정. HMR + ES 모듈 + esbuild. | P1 | 2026-05-05 |
| 5 | import 정렬 도구 | **eslint-plugin-simple-import-sort** | auto-fix + 제로 설정. 그룹별 정렬(외부 → 내부 → 상대 → 스타일). 소규모 프로젝트에 적합. | P2 | 2026-05-05 |
| 6 | pre-commit hook | **미도입** | CI(P7)에서 lint/type/test 검증. 쓰기 단계 마찰 최소화. 추후 husky+lint-staged 추가 가능. | P2 | 2026-05-05 |
| 7 | 라우터 라이브러리 | **React Router (v7 라인)** | 가장 성숙한 생태계. 동적 로드/속도적 navigate 등 확장 용이. v6 API 호환되어 기존 패턴 그대로 사용. | P3 | 2026-05-05 |
| 8 | 프로덕션 dev 라우트 제외 | **`import.meta.env.DEV` + `lazy()`** | 단일 entry. dev 모드에서만 enableDevRoutes=true → 조건부 lazy import. prod 빌드 시 false 평가로 dynamic import 자체가 dead-code 제거. 설정 최소화. | P3 | 2026-05-05 |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정
- [x] 패키지 매니저: **pnpm** ✓ (#1)
- [x] 프레임워크: **React + react-three-fiber** ✓ (#2)
- [x] React 버전: **19** ✓ (#2)
- [x] Node 버전 락: **20 LTS** ✓ (#3)

### P2에서 결정
- [x] import 정렬: **eslint-plugin-simple-import-sort** ✓ (#5)
- [x] pre-commit hook 도입 여부: **미도입** ✓ (#6)

### P3에서 결정
- [x] 라우터: **React Router** ✓ (#7)
- [x] 프로덕션 dev 제외 방식: **`import.meta.env.DEV` + `lazy()`** ✓ (#8)

### P4에서 결정
- [ ] FPS 표시: 자체 구현 / `stats.js` / R3F 헬퍼

### P5에서 결정
- [ ] e2e: **Playwright** (권장) / Cypress
- [ ] DOM 환경: **happy-dom** (권장) / jsdom

### P6에서 결정
- [ ] Python venv 도구: **uv** (권장) / venv+pip / pyenv

### P7에서 결정
- [ ] e2e를 ci.yml에 포함 / 별도 workflow

### 추후 보류 (Work 1 범위 밖)
- 상태 관리 라이브러리 (Zustand / Jotai / RxJS) — Work 8 시점에 결정
- 백엔드 도입 여부 (CORS 프록시 / SPICE 처리) — Work 3 시점에 결정
- 호스팅 (Vercel / Cloudflare Pages / 자체) — Work 12

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록.
형식: 경로 + 한 줄 메모.

### P1 — Tech Decisions & Repo Bootstrap _(완료 2026-05-05)_
설치된 버전:
- React 19.2.5, react-dom 19.2.5, @react-three/fiber 9.6.1, three 0.184.0
- Vite 8.0.10, TypeScript 6.0.3, @vitejs/plugin-react 6.0.1
- @types: react 19.2.14, react-dom 19.2.3, three 0.184.0, node 25.6.0

생성/수정 파일:
- [`.nvmrc`](../../.nvmrc) — Node 20 핀
- [`.editorconfig`](../../.editorconfig) — utf-8 / lf / 2-space (md는 trim 제외, Makefile은 tab)
- [`package.json`](../../package.json) — `dev` / `build` / `preview` 스크립트, `engines.node >=20`, ESM 모드
- [`tsconfig.json`](../../tsconfig.json) — references 패턴 (app + node)
- [`tsconfig.app.json`](../../tsconfig.app.json) — strict, react-jsx, Bundler 해석, `@/*` → `./src/*` paths
- [`tsconfig.node.json`](../../tsconfig.node.json) — vite.config.ts 전용
- [`vite.config.ts`](../../vite.config.ts) — React 플러그인 + `@` alias
- [`index.html`](../../index.html) — Vite 진입점, 타이틀 "Orbitarium"
- [`src/main.tsx`](../../src/main.tsx) — `StrictMode` + `createRoot`
- [`src/App.tsx`](../../src/App.tsx) — placeholder UI (h1 + 설명)
- [`src/styles.css`](../../src/styles.css) — dark color-scheme, 시스템 폰트, centered layout
- [`src/vite-env.d.ts`](../../src/vite-env.d.ts) — `vite/client` 타입 참조
- `pnpm-lock.yaml` — 의존성 lock (commit 필요)

검증 결과:
- `pnpm build` ✓ — `tsc -b && vite build` 성공, dist 사이즈: index.js 190.74 kB (gzip 60.13 kB)
- `pnpm dev` ✓ — `localhost:5173` HTTP 200 응답, main.tsx/App.tsx 모듈 서빙 확인

### P2 — Quality Tooling _(완료 2026-05-05)_
설치된 dev 의존성:
- ESLint 10.3.0, @eslint/js 10.0.1, typescript-eslint 8.59.2
- eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.5.2
- eslint-plugin-simple-import-sort 13.0.0
- Prettier 3.8.3, eslint-config-prettier 10.1.8
- globals 17.6.0

생성/수정 파일:
- [`eslint.config.js`](../../eslint.config.js) — flat config. ts/tsx 블록은 type-checked + stylistic + react-hooks + react-refresh + simple-import-sort, js 블록은 기본 + simple-import-sort.
- [`.prettierrc.json`](../../.prettierrc.json) — semi:false, singleQuote, trailingComma:all, printWidth:100, tabWidth:2, arrowParens:always, endOfLine:lf.
- [`.prettierignore`](../../.prettierignore) — dist/build/coverage/lock/idea/.tsbuildinfo + `docs/plan` (수기 정리된 마크다운 보호).
- [`tsconfig.app.json`](../../tsconfig.app.json) — `noUncheckedIndexedAccess` + `noImplicitOverride` 추가.
- [`tsconfig.node.json`](../../tsconfig.node.json) — 동일 강화.
- [`package.json`](../../package.json) — scripts: `typecheck`, `lint`, `lint:fix`, `format`, `format:check` 추가.
- [`docs/architecture/conventions.md`](../../docs/architecture/conventions.md) — TS / 모듈 / 네이밍 / 주석 / React-R3F / 단위(Truth vs Display) / 디렉터리 / 커밋 규칙.

자동 변경된 파일 (lint:fix / format):
- `src/main.tsx` — import 정렬 (side-effect 먼저, 외부, 상대 그룹).
- `vite.config.ts` — import 정렬 (`node:path` 분리 + 외부 alphabetical).
- `eslint.config.js`, `tsconfig.json`, `src/styles.css`, `README.md` — Prettier 적용.

검증 결과:
- `pnpm typecheck` ✓ — 그린.
- `pnpm lint` ✓ — 그린.
- `pnpm format:check` ✓ — All matched files use Prettier code style.
- 룰 위반 시나리오 (5종 위반 코드 삽입): simple-import-sort, no-unused-vars, no-explicit-any, TS2532(noUncheckedIndexedAccess), TS6133 모두 정확히 검출 → 파일 제거 후 재검증 그린.

### P3 — App Shell & Dev Routes _(완료 2026-05-05)_
설치된 의존성:
- react-router-dom 7.14.2 (+ history, @remix-run/router, react-router 등 4 패키지)

생성/수정 파일:
- [`src/routes/Home.tsx`](../../src/routes/Home.tsx) — `/` 라우트. dev 모드에서만 `/dev/index` 링크 노출.
- [`src/dev/registry.ts`](../../src/dev/registry.ts) — `DevPageEntry[]` 단일 진실원. Work 2~12 placeholder entry 11개. 각 entry는 `Component` 추가 시 자동으로 라우트화.
- [`src/dev/DevApp.tsx`](../../src/dev/DevApp.tsx) — `/dev/*` sub-router. registry 순회로 동적 라우트 생성, fallback `*` 포함.
- [`src/dev/DevIndex.tsx`](../../src/dev/DevIndex.tsx) — `/dev`, `/dev/index` 카탈로그. `<DevCard>` 그리드.
- [`src/dev/DevCard.tsx`](../../src/dev/DevCard.tsx) — `Component` 유무에 따라 `<Link>` (available) vs `<article aria-disabled>` (placeholder).
- [`src/dev/dev.css`](../../src/dev/dev.css) — dev 페이지 전용 스타일. DevApp이 import → 같은 chunk → prod에서 함께 제외.
- [`src/App.tsx`](../../src/App.tsx) — 라우터 루트. `enableDevRoutes` 조건부 lazy import.
- [`src/main.tsx`](../../src/main.tsx) — `<BrowserRouter>` 마운트.
- [`src/vite-env.d.ts`](../../src/vite-env.d.ts) — `ImportMetaEnv.VITE_ENABLE_DEV_ROUTES` 타입.
- [`docs/architecture/dev-routes.md`](../../docs/architecture/dev-routes.md) — 새 dev 페이지 추가 절차, 프로덕션 제외 정책 표, 작성 가이드.

검증 결과:
- `pnpm dev` → `/`, `/dev`, `/dev/index` 모두 HTTP 200, 모든 모듈 로드 ✓
- `pnpm lint` / `pnpm typecheck` / `pnpm format:check` 모두 그린 ✓
- **프로덕션 빌드 dev 제외 검증**:
  - 기본 `pnpm build` → 단일 chunk `index-CXJtCXLZ.js` (232.06 kB), `dist/`에 `Dev*` 시그니처 0건 ✓
  - `VITE_ENABLE_DEV_ROUTES=true pnpm build` → 별도 chunk `DevApp-*.js` (3.25 kB) + `DevApp-*.css` (1.40 kB) 생성 → 조건부 분기가 빌드 타임에 정확히 평가됨 ✓
- 번들 크기 변화 (P1 → P3): 190.74 kB → 232.06 kB (+41 kB) — react-router-dom 추가분.

### P4 — three.js Hello _(예정)_
- _phase 종료 시 채움_

### P5 — Test Frameworks _(예정)_
- _phase 종료 시 채움_

### P6 — Python Tooling Smoke _(예정)_
- _phase 종료 시 채움_

### P7 — CI Pipeline Skeleton _(예정)_
- _phase 종료 시 채움_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 다음 작업: P4 — three.js Hello

**Goal**: `/` 페이지에서 회전 sphere + FPS 카운터 + 별 1점 → three.js 렌더 파이프라인 검증. plan 본체 [§3 Phase 4](work-01-foundation.md#phase-4--threejs-hello) 참조.

**Step 1. 결정 라운드**
§3 의 P4 결정 1개 확정:
1. FPS 표시 방식: 자체 구현 / `stats.js` / `r3f-perf` 또는 R3F 헬퍼

**Step 2. 구현**
- `src/render/` 디렉터리 신설 (Work 5에서 확장)
- `<Canvas>` (R3F) 안에 회전 sphere (`MeshStandardMaterial` 또는 `MeshBasicMaterial`)
- 간단한 광원 1개 (`<ambientLight>` + `<directionalLight>` 또는 `<pointLight>`)
- BufferGeometry로 별 1점 (Work 5 starfield 예고)
- FPS 오버레이
- 윈도우 리사이즈 — R3F 자동 처리되므로 추가 작업 불필요

**Step 3. 검증**
```bash
pnpm dev   # / 에 회전 sphere + FPS 표시, 콘솔 에러 없음, 30fps+
pnpm build && pnpm preview   # 빌드본도 동일 동작
pnpm lint && pnpm typecheck && pnpm format:check   # 그린
```

**Step 4. 비범위 (Work 5에서 처리)**
- HDR / ACES 톤매핑
- 로그 깊이 버퍼
- 실제 항성 카탈로그 starfield
- 텍스처/PBR

**Step 5. handoff 갱신**
- §0 / §1 / §3 / §4 / §7 (P1~P3 패턴과 동일)

### 빠른 검증 명령 (Work 1 전반)

```bash
# 프론트엔드
pnpm install
pnpm dev          # /         → 회전 sphere + FPS
                  # /dev/index → 카드 11개
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

# Python
cd tools/python
uv venv && source .venv/bin/activate     # 또는 python -m venv .venv && source .venv/bin/activate
uv pip install -e ".[dev]"               # 또는 pip install -e ".[dev]"
orbitarium-tools version
ruff check src tests
mypy src
pytest
```

## 6. 알려진 이슈 / 노트

- **Node 버전 불일치**: 개발 머신 Node 23.10.0 vs `.nvmrc` 의 20. Node 20 호환 코드는 23에서도 동작하므로 즉시 블로커 아니지만, CI 정합성을 위해 `nvm use` / `fnm use` / volta 등으로 전환 권장.
- **TypeScript 6 deprecation**: `baseUrl` 옵션이 TS 7에서 제거 예정 → 본 프로젝트는 `paths` 만 사용 (`./src/*` 형태). 향후 `paths` 추가 시 동일 컨벤션 유지.
- **pnpm 업데이트 가능**: 설치된 8.10.2 → 최신 10.33.3. P2에서 `packageManager: pnpm@10.x` 핀 + corepack 사용 검토.
- **TypeScript 6 + Vite 8 + React 19**: 모두 메이저 최신 라인. R3F v9 가 React 19 지원. 추후 Work에서 호환성 이슈 발생 시 여기에 기록.

## 7. 갱신 이력 (Changelog)

| 날짜 | 변경 |
|---|---|
| 2026-05-05 | 초기 작성 — P0 kickoff 진입 |
| 2026-05-05 | **P1 완료** — pnpm + React 19 + R3F + Vite 부트스트랩, build/dev 검증 그린 |
| 2026-05-05 | **P2 완료** — ESLint flat config + Prettier + TS strict 강화 (`noUncheckedIndexedAccess`, `noImplicitOverride`) + 컨벤션 문서. lint/typecheck/format 모두 그린, 룰 위반 5종 검출 검증 |
| 2026-05-05 | **P3 완료** — react-router-dom 도입 + `/dev/*` sub-router + registry 기반 동적 카드 11개 + dev-routes 컨벤션 문서. prod 빌드에서 dev chunk 완전 제거 양방향 검증 (기본=제외 / VITE_ENABLE_DEV_ROUTES=true=포함) |

---

## Appendix A. Phase 마감 체크리스트 (Template)

각 phase를 [x]로 옮기기 전에 다음을 모두 확인:

1. [ ] [plan §3](work-01-foundation.md#3-phase-정의) 의 해당 phase Done 기준 모두 충족
2. [ ] §2 결정 로그에 phase 결정 사항 모두 기록
3. [ ] §3 해당 phase Open Questions 모두 [x] 처리
4. [ ] §4 해당 phase 산출물 인덱스 채움 (경로 + 한 줄 메모)
5. [ ] §0 현재 phase 갱신 (다음 phase로)
6. [ ] §7 갱신 이력에 한 줄 추가
7. [ ] (선택) 커밋 — 메시지 prefix `[work-01/p<N>]`
