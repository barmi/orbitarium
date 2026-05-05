# Work 1 — Handoff (Project Foundation)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-01-foundation.md`](work-01-foundation.md)

---

## 0. 현재 상태 (Status)

| 항목 | 값 |
|---|---|
| 현재 phase | **P7 완료** ✓ — **Work 1 전체 완료** 🏁 |
| 다음 액션 | **Work 2 — Astronomy Foundations** 시작. 별도 plan/handoff 문서: `docs/plan/work-02-astronomy.md` 와 `work-02-astronomy-handoff.md` |
| 마지막 갱신 | 2026-05-05 |
| 블로커 | 없음. 첫 PR 푸시 후 Actions 그린 확인 필요 (로컬 시뮬레이션은 완료) |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-01-foundation.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Tech Decisions & Repo Bootstrap _(완료 2026-05-05)_
- [x] **P2** — Quality Tooling _(완료 2026-05-05)_
- [x] **P3** — App Shell & Dev Routes _(완료 2026-05-05)_
- [x] **P4** — three.js Hello _(완료 2026-05-05)_
- [x] **P5** — Test Frameworks _(완료 2026-05-05)_
- [x] **P6** — Python Tooling Smoke _(완료 2026-05-05)_
- [x] **P7** — CI Pipeline Skeleton _(완료 2026-05-05)_

🏁 **Work 1 전체 완료** — [plan §1 Definition of Done](work-01-foundation.md#1-결과-정의-definition-of-done) 의 모든 항목 충족.

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
| 9 | FPS 카운터 구현 | **자체 구현 (useEffect + requestAnimationFrame)** | P4는 파이프라인 검증용 — 의존성 추가 불요. 상세 GPU/draw call metric은 Work 11에서 r3f-perf 또는 stats.js로 교체 예정. | P4 | 2026-05-05 |
| 10 | e2e 테스트 도구 | **Playwright** | 멀티 브라우저, 내장 trace viewer, webServer auto-start, async 대기 매처 풍부. CI 캐시 가능. | P5 | 2026-05-05 |
| 11 | Vitest DOM 환경 | **happy-dom** | jsdom 대비 ~3배 빠른 단위 테스트. 대부분 DOM API 충분 — 본 프로젝트는 R3F 컴포넌트 단위 테스트 거의 없으니 더 적합. | P5 | 2026-05-05 |
| 12 | Python venv 도구 | **uv** (0.10.0 via Homebrew) | 이미 설치됨. Rust 기반 — venv 생성/패키지 설치 기존 pip 대비 수십배 빠름. `uv run`으로 격리 실행도 깔끔. | P6 | 2026-05-05 |
| 13 | e2e 의 CI 통합 | **ci.yml 에 포함 (node / python / e2e 3-job 병렬)** | e2e 가 ~3s 로 가벼움. Playwright 캐시 적용. 단일 워크플로 = 단일 진실원, PR 마다 통합 검증. | P7 | 2026-05-05 |
| 14 | pnpm 버전 핀 | **`packageManager: "pnpm@8.10.2"`** | pnpm-lock.yaml 의 lockfileVersion 6.0 (pnpm 7-8 라인) 과 정합. 사용자 머신 8.10.2 와 매칭. Work 11 폴리시에서 9/10 라인 업그레이드 + 락파일 마이그레이션 검토. | P7 | 2026-05-05 |

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
- [x] FPS 표시: **자체 구현** ✓ (#9)

### P5에서 결정
- [x] e2e: **Playwright** ✓ (#10)
- [x] DOM 환경: **happy-dom** ✓ (#11)

### P6에서 결정
- [x] Python venv 도구: **uv** ✓ (#12)

### P7에서 결정
- [x] e2e를 ci.yml에 포함 ✓ (#13)
- [x] pnpm 버전 핀 ✓ (#14, P7 진행 중 추가 결정)

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

### P4 — three.js Hello _(완료 2026-05-05)_
신규 의존성: 없음 (P1에서 설치한 three 0.184.0 + @react-three/fiber 9.6.1 사용).

생성/수정 파일:
- [`src/render/HomeScene.tsx`](../../src/render/HomeScene.tsx) — R3F 씬: ambient + directional 광원, 회전 sphere (`useFrame` 으로 y/x 축 회전), BufferGeometry 단일 별 점 (off-axis).
- [`src/render/FpsOverlay.tsx`](../../src/render/FpsOverlay.tsx) — useEffect + requestAnimationFrame 으로 1초 윈도우 평균 FPS 계산. 의존성 0.
- [`src/routes/Home.tsx`](../../src/routes/Home.tsx) — Canvas 풀스크린 (z=0) + 헤더(z=1, pointer-events:none) + FpsOverlay(우상단) + dev 링크(우하단, dev 모드에서만).
- [`src/routes/home.css`](../../src/routes/home.css) — 풀스크린 캔버스 + overlay layout + FPS overlay 스타일.
- [`src/styles.css`](../../src/styles.css) — `.app/.note/.dev-link` 제거 (P1 잔재 정리), 루트 + 기본 reset만 유지.
- [`.claude/launch.json`](../../.claude/launch.json) — preview 도구용 `vite-dev` 설정.
- [`.prettierignore`](../../.prettierignore) — `docs/*.md` 사용자 작성 노트 보호 규칙 추가.

검증 결과:
- `pnpm typecheck` / `pnpm lint` / `pnpm format:check` ✓
- **Preview 스크린샷** ✓ — sphere 회전 렌더링, FPS 오버레이 `120 fps` 라이브 표시, 헤더/링크 모두 정상 배치, 단일 별 visible.
- 콘솔 에러 0건. 경고는 `THREE.Clock: deprecated → use THREE.Timer` (R3F 9.x 내부에서 발생, R3F 측 마이그레이션 대기).
- **프로덕션 빌드 dev 제외 재확인** ✓ — `dist/assets/`에 단일 `index-*.js` (1113 kB / gzip 308 kB) + `index-*.css`, `Dev*` 시그니처 0건.
- 번들 크기 변화 (P3 → P4): 232 kB → 1113 kB (+881 kB). 원인: three.js + R3F 코어 포함. Vite의 500 kB 경고가 뜨지만 정상 baseline. **Work 11(Polish & Performance)에서 코드 분할 (DE440 chunk, body 텍스처 chunk 등)로 최적화 예정**.

### P5 — Test Frameworks _(완료 2026-05-05)_
설치된 dev 의존성:
- vitest 4.1.5, @vitest/ui 4.1.5, happy-dom 20.9.0
- @playwright/test 1.59.1 (+ chromium-headless-shell v1217 다운로드 ~92 MiB)

생성/수정 파일:
- [`tsconfig.test.json`](../../tsconfig.test.json) — `tests/`, `vitest.config.ts`, `playwright.config.ts` 타입체크. app과 동일한 strict 규칙.
- [`tsconfig.json`](../../tsconfig.json) — references 에 test 추가 (3-config 빌드).
- [`eslint.config.js`](../../eslint.config.js) — parserOptions.project에 tsconfig.test.json 추가 (테스트 파일 type-aware lint).
- [`vitest.config.ts`](../../vitest.config.ts) — happy-dom 환경, `tests/unit/**/*.{test,spec}.{ts,tsx}` 만 매치 (e2e와 격리), `@/*` alias 동기, v8 coverage.
- [`playwright.config.ts`](../../playwright.config.ts) — chromium 단일 프로젝트, baseURL `http://localhost:5173`, webServer auto-start (`pnpm dev`), CI에서만 retry 2 + 1 worker, trace on-first-retry.
- [`tests/unit/sanity.test.ts`](../../tests/unit/sanity.test.ts) — sanity (1+1) + registry shape 검증 3건 (count=11, slug 유일성, title/summary 존재). 총 4 tests.
- [`tests/e2e/home.spec.ts`](../../tests/e2e/home.spec.ts) — 3 specs: title+canvas, FPS 숫자 갱신, WebGL context 활성.
- [`tests/e2e/dev-index.spec.ts`](../../tests/e2e/dev-index.spec.ts) — 4 specs: 카드 11개, 모두 placeholder, 카드 구조(번호/제목/슬러그), 홈→/dev/index 네비.
- [`package.json`](../../package.json) — scripts 6개 추가 (`test`, `test:watch`, `test:ui`, `test:e2e`, `test:e2e:headed`, `test:e2e:ui`).

검증 결과:
- `pnpm test` ✓ — 4 unit tests pass (~250ms).
- `pnpm test:e2e` ✓ — 7 e2e tests pass (~3s, webServer reuse).
- `pnpm typecheck` / `lint` / `format:check` ✓.

설계 결정:
- 단위 vs e2e 격리: vitest의 `include` 로 `tests/unit/**` 만 매치 → vitest는 e2e 파일 무시.
- WebGL 픽셀 read 테스트는 시도했으나 R3F가 `preserveDrawingBuffer` 미설정 → `getContext('webgl2/webgl')` 활성 검증으로 대체. 시각적 비공백 검증은 P4 preview 스크린샷에서 이미 완료.
- coverage exclude: `src/main.tsx`, `src/dev/**`, `src/render/**` — entry/dev/그래픽 코드는 단위 커버리지 의미 적음. 도메인 코드(astro, ephemeris 등 Work 2~)에 집중.

### P6 — Python Tooling Smoke _(완료 2026-05-05)_
환경:
- 시스템 Python 3.12.2, uv 0.10.0 (Homebrew). `uv venv` 가 자동으로 managed Python 3.13.5 선택 (>=3.11 충족).
- venv 위치: `tools/python/.venv/` (gitignored).

설치된 의존성 (`uv pip install -e ".[dev]"`):
- numpy 2.4.4 (base)
- pytest 9.0.3, ruff 0.15.12, mypy 1.20.2 (dev extras)
- + iniconfig, librt, mypy-extensions, packaging, pathspec, pluggy, pygments, typing-extensions, orbitarium-tools 0.1.0 (editable)

생성/수정 파일:
- [`tools/python/tests/test_smoke.py`](../../tools/python/tests/test_smoke.py) — 3 tests:
  1. `__version__ == "0.1.0"`
  2. `python -m orbitarium_tools.cli version` → "0.1.0"
  3. `python -m orbitarium_tools.cli` (no args) → 도움말 출력
- `tools/python/tests/.gitkeep` 제거.

검증 결과 (모두 `tools/python/` 에서 `uv run`):
- `uv run orbitarium-tools version` → `0.1.0` ✓
- `uv run ruff check src tests` → All checks passed! ✓
- `uv run mypy src` → Success: no issues found in 2 source files ✓ (strict 모드)
- `uv run pytest` → 3 passed in 0.06s ✓

비고:
- `astro` / `viz` / `notebook` extras는 P6에서 설치하지 않음 — Work 2부터 모듈 추가 시 그 Work의 phase 에서 함께 설치.
- 향후 lock 파일은 사용 안 함 (간단성 우선). 의존성이 늘면 `uv pip compile` 로 lock 도입 검토.

### P7 — CI Pipeline Skeleton _(완료 2026-05-05)_
생성/수정 파일:
- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — 3-job 병렬 파이프라인:
  - `node`: pnpm/action-setup → setup-node (`.nvmrc` 기반, pnpm cache) → `install --frozen-lockfile` → lint → typecheck → test → build (8 steps)
  - `python`: setup-uv (cache: pyproject.toml) → `uv venv` + `uv pip install -e ".[dev]"` → ruff → mypy → pytest, working-directory: `tools/python` (6 steps)
  - `e2e`: pnpm install → Playwright 캐시 (key: `playwright-${OS}-${hashFiles(pnpm-lock)}`) → cold/warm 분기 install → `pnpm test:e2e`, 실패 시 `playwright-report/` 업로드 (9 steps)
  - 트리거: `push` (main), `pull_request`. concurrency 그룹으로 in-progress 자동 취소.
  - permissions: `contents: read` (최소).
- [`package.json`](../../package.json) — `packageManager: "pnpm@8.10.2"` 추가 → pnpm/action-setup 가 자동으로 동일 버전 사용.
- [`README.md`](../../README.md) — CI 배지 (`https://github.com/barmi/orbitarium/actions/workflows/ci.yml/badge.svg`) 추가.

검증 결과:
- YAML 파싱 OK (PyYAML 으로 구조 확인: 3 jobs, 8/6/9 steps).
- 로컬 모든 CI 단계 시뮬레이션 그린:
  - `pnpm install --frozen-lockfile` ✓ (Lockfile is up to date)
  - `pnpm lint` / `typecheck` / `format:check` / `test` (4 unit) / `build` ✓
  - `pnpm test:e2e` ✓ (7 e2e tests)
  - `uv run ruff check src tests` / `uv run mypy src` / `uv run pytest` (3) ✓
- 첫 GitHub push 후 Actions 그린 확인 필요 (실 환경 검증).

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 다음 작업: Work 2 — Astronomy Foundations 진입

Work 1 가 완료되었으므로 이제 **Work 2 (Astronomy Foundations)** 의 phase 계획을 작성한다 (`work-XX-<name>` 컨벤션).

**Step 1. 새 phase 계획/handoff 문서 작성**
- `docs/plan/work-02-astronomy.md` — Work 2 의 phase 정의 / Done 기준
- `docs/plan/work-02-astronomy-handoff.md` — 진행 상태 / 결정 / 산출물 인덱스

**Step 2. Work 2 핵심 범위** ([overview.md §5 Work 2](overview.md#work-2--천문학-기반-astronomy-foundations) 참조)
- 시간: UTC ↔ TAI ↔ TT ↔ TDB, Julian Date, J2000 epoch
- 좌표계: ICRF / EME2000 / 황도 / body-fixed (IAU 회전)
- 변환 행렬, 세차/장동 처리 정책
- 천문 상수 (AU, GM, c, …)
- NAIF ID, 카탈로그 모델
- **Dev Demo**: `/dev/astro` — UTC↔TT↔TDB↔JD 변환기, J2000 경과시간, ICRF↔ecliptic 좌표 변환 입출력 패널
- **Python**: `orbitarium_tools.time`, `.frames` — astropy 결과와 µs/mas 단위 비교 + 골든값 fixture

**Step 3. 첫 GitHub push 후 CI 그린 확인** (Work 1 마감 검증)

### Work 1 산출 요약 (참고)

```
의존성:
  TS:     react / react-dom / @react-three/fiber / three / react-router-dom
          + dev: vite / typescript / vitest / @playwright/test / eslint / prettier 등
  Python: numpy + dev: pytest / ruff / mypy

스크립트:
  pnpm dev / build / preview
  pnpm typecheck / lint / lint:fix / format / format:check
  pnpm test / test:watch / test:ui / test:e2e / test:e2e:headed / test:e2e:ui
  uv run orbitarium-tools / ruff / mypy / pytest

라우트:
  /                    — Canvas + 회전 sphere + FPS + (dev 모드) /dev/index 링크
  /dev/index, /dev     — 카탈로그 (Work 2~12 placeholder 11개)
  /dev/<slug>          — Work 별 페이지 (registry.Component 채워지면 활성)

CI:  GitHub Actions — node / python / e2e (병렬, PR/push 시 자동)
```

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
- **R3F 9.6.1 — `THREE.Clock` deprecation 경고**: 콘솔에 `THREE.Clock: deprecated. Please use THREE.Timer instead.` 가 매 프레임 출력되지만 동작에는 영향 없음. R3F 측에서 `Timer` 마이그레이션 PR 진행 중. 자체 코드는 영향 없음 (수정 불필요).
- **번들 크기 1113 kB (gzip 308 kB)**: three.js + R3F + react + react-router 합산. Vite의 500 kB 경고. P5/P6/P7 에서 추가 의존성 더 늘어날 예정. Work 11(Polish)에서 manualChunks / lazy import / Draco 등으로 본격 분할.
- **GitHub Actions Node 20 deprecation (2026-06-02 강제 Node 24)**: 첫 CI 실행에서 `actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`, `astral-sh/setup-uv@v4` 모두 deprecation 경고 발생. **2026-05-05 해결**: 액션 버전 일괄 업그레이드 (checkout/setup-node/action-setup → v6, cache → v5, upload-artifact → v7, **setup-uv → v7**). 입력 호환성은 setup-uv `enable-cache`/`cache-dependency-glob`, action-setup `version` 모두 유지 확인.
- **`astral-sh/setup-uv@v8` 메이저 floating tag 부재**: 처음 v8로 시도했으나 "Unable to resolve action … unable to find version `v8`" 에러. 실제 태그는 v8.0.0/v8.1.0 만 존재 (메이저 alias 미설정). v7은 메이저 floating tag 보유 + Node 24 런타임 동일. **v7 사용** (자동 패치 수신). 추후 v8 메이저 alias 생기거나 v9 출시 시 재검토.
- **GitHub Actions cache service 일시 장애**: 첫 CI 실행에서 setup-uv 의 cache restore/save 가 400/503 에러 (`<h2>Our services aren't available right now</h2>`). 작업 자체는 성공 (캐시 best-effort). GitHub 측 transient 이슈 — 재현되면 setup-uv 버전 재확인.

## 7. 갱신 이력 (Changelog)

| 날짜 | 변경 |
|---|---|
| 2026-05-05 | 초기 작성 — P0 kickoff 진입 |
| 2026-05-05 | **P1 완료** — pnpm + React 19 + R3F + Vite 부트스트랩, build/dev 검증 그린 |
| 2026-05-05 | **P2 완료** — ESLint flat config + Prettier + TS strict 강화 (`noUncheckedIndexedAccess`, `noImplicitOverride`) + 컨벤션 문서. lint/typecheck/format 모두 그린, 룰 위반 5종 검출 검증 |
| 2026-05-05 | **P3 완료** — react-router-dom 도입 + `/dev/*` sub-router + registry 기반 동적 카드 11개 + dev-routes 컨벤션 문서. prod 빌드에서 dev chunk 완전 제거 양방향 검증 (기본=제외 / VITE_ENABLE_DEV_ROUTES=true=포함) |
| 2026-05-05 | **P4 완료** — R3F 회전 sphere + 단일 별 + 자체 FPS 오버레이. preview 스크린샷으로 시각 확인 (120 fps 라이브, sphere 렌더). 번들 232 kB → 1113 kB (three.js 추가, Work 11에서 분할 예정). `.claude/launch.json` 추가, `.prettierignore`에 docs/*.md 보호 |
| 2026-05-05 | **P5 완료** — Vitest + happy-dom 단위 (4 tests) + Playwright + chromium e2e (7 tests). tsconfig.test.json 신설. `pnpm test` / `pnpm test:e2e` 모두 그린. WebGL 픽셀 read는 R3F preserveDrawingBuffer 미설정 이슈로 context 활성 검증으로 대체 |
| 2026-05-05 | **P6 완료** — `tools/python/.venv` (uv managed Python 3.13.5) + `[dev]` extras (pytest/ruff/mypy/numpy). smoke test 3건. `orbitarium-tools version` / ruff / mypy --strict / pytest 모두 그린 |
| 2026-05-05 | **P7 완료 + Work 1 완료 🏁** — GitHub Actions 3-job (node/python/e2e) 병렬 파이프라인. `packageManager: pnpm@8.10.2` 핀 (lockfileVersion 6.0 정합). README CI 배지. 모든 CI 단계 로컬 시뮬레이션 그린 (lint/type/format/test/build/e2e/ruff/mypy/pytest). 첫 push 후 GitHub Actions 실 환경 그린 확인 남음 |
| 2026-05-05 | **CI 첫 실 가동 + Node 24 마이그레이션** — push 후 3 job 모두 그린. Node 20 deprecation 경고 대응으로 액션 버전 일괄 업그레이드: checkout/setup-node/action-setup `v4 → v6`, setup-uv `v4 → v8`, cache `v4 → v5`, upload-artifact `v4 → v7`. 모두 Node 24 런타임. 입력 호환성 확인 |
| 2026-05-05 | **setup-uv `v8 → v7` 정정** — `v8`이 메이저 floating tag 미설정 (v8.0.0/v8.1.0만 존재) → "unable to find version v8" 에러. v7은 메이저 floating tag 보유 + Node 24 동일. 자동 패치 수신 위해 v7 채택 |

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
