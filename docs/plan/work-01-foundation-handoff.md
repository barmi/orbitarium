# Work 1 — Handoff (Project Foundation)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-01-foundation.md`](work-01-foundation.md)

---

## 0. 현재 상태 (Status)

| 항목 | 값 |
|---|---|
| 현재 phase | **P2 완료** ✓ — 다음은 **P3 (App Shell & Dev Routes)** |
| 다음 액션 | P3 시작: 라우터 도입 + `/dev/index` 카탈로그 + 프로덕션 빌드 dev 제외 |
| 마지막 갱신 | 2026-05-05 |
| 블로커 | 없음 |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-01-foundation.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Tech Decisions & Repo Bootstrap _(완료 2026-05-05)_
- [x] **P2** — Quality Tooling _(완료 2026-05-05)_
- [ ] **P3** — App Shell & Dev Routes
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
- [ ] 라우터: **React Router v6** / Wouter / TanStack Router
- [ ] 프로덕션 dev 제외 방식: env flag (권장) / 별도 entry

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

### P3 — App Shell & Dev Routes _(예정)_
- _phase 종료 시 채움_

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

### 다음 작업: P3 — App Shell & Dev Routes

**Goal**: 라우터 + `/dev/index` 카탈로그 + 프로덕션 빌드 dev 제외. plan 본체 [§3 Phase 3](work-01-foundation.md#phase-3--app-shell--dev-routes) 참조.

**Step 1. 결정 라운드**
§3 의 P3 항목 2개 확정:
1. 라우터: React Router v6 (권장) / Wouter / TanStack Router
2. 프로덕션 dev 제외 방식: env flag (권장) / 별도 entry

**Step 2. 도구 설치 및 구조 작성**
```bash
pnpm add react-router-dom    # 결정 시
```
- `src/routes/Home.tsx` — `/` 메인 라우트 (현재 App.tsx 자리)
- `src/dev/DevIndex.tsx` — `/dev/index` 카탈로그
- `src/dev/registry.ts` — dev 페이지 등록 메커니즘 (Work 2~12에서 누적)
- `src/dev/cards/` — Work 2~12 placeholder 카드 11개
- `index.html` 내 라우트 마운트 정비
- `vite-env.d.ts` 또는 `src/env.d.ts` — `VITE_ENABLE_DEV_ROUTES` 타입
- `docs/architecture/dev-routes.md` — 새 dev 페이지 추가 컨벤션

**Step 3. 검증**
```bash
pnpm dev          # / 와 /dev/index 양쪽 네비
pnpm build        # 빌드 산출물에 dev 컴포넌트 미포함 (grep 또는 번들 분석)
pnpm lint && pnpm typecheck && pnpm format:check    # 그린
```

**Step 4. handoff 갱신**
- §0 / §1 / §3 / §4 / §7 (P1, P2 패턴과 동일)

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
