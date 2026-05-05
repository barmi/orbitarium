# Work 1 — Project Foundation (Plan)

> 진행 상태와 결정 사항은 **[work-01-foundation-handoff.md](work-01-foundation-handoff.md)** 에 누적.
> 본 문서는 phase 정의/Done 기준의 정적 참조용.

---

## 0. 한눈에 (At a Glance)

| 항목 | 값 |
|---|---|
| 목표 | 코드 베이스 골격, 빌드/테스트 파이프라인, dev 라우트 컨벤션, Python 도구 연결 |
| Phase 수 | 7 |
| 선행 Work | 없음 |
| 후속 Work | Work 2 (Astronomy Foundations) |
| 핵심 산출물 | 빌드 가능한 첫 화면 + `/dev/index` 카탈로그 + Python smoke 통과 + CI 그린 |

## 1. 결과 정의 (Definition of Done)

Work 1 마감은 **다음 모두**가 통과해야 한다:

- [ ] 개발 서버 기동 → `http://localhost:5173/` 접속 시 **회전 sphere + FPS 카운터** 보임
- [ ] `/dev/index` 접속 시 Work 2~12 placeholder 카드 11개 보임
- [ ] 프로덕션 빌드(`pnpm build` 등) 성공, 빌드 산출물에 `/dev/*` 코드가 포함되지 않음
- [ ] `pnpm lint` / `pnpm typecheck` 통과 (stub 코드 기준)
- [ ] `pnpm test` (Vitest) / `pnpm test:e2e` (Playwright) 통과
- [ ] `cd tools/python && pip install -e ".[dev]"` 깨끗하게 성공 →
      `orbitarium-tools version`, `pytest`, `ruff check`, `mypy src` 모두 통과
- [ ] GitHub Actions CI가 PR/push에서 lint·type·test·build를 자동 실행하고 그린
- [ ] [handoff 문서](work-01-foundation-handoff.md)의 모든 phase 체크박스 [x],
      결정 로그 누락 없음, 산출물 인덱스 채워짐

## 2. 범위 / 비범위

**In scope**
- 패키지 매니저, 프레임워크, 빌드러너 결정 및 초기 설정
- 라우팅 + dev 페이지 컨벤션, 프로덕션 빌드 dev 라우트 제외
- 최소 three.js 렌더(sphere + FPS) — 파이프라인 검증 수준
- 린트/포맷/타입체크/단위·e2e 테스트 자동화
- Python 패키지 smoke (설치/CLI/pytest/ruff/mypy)
- CI 파이프라인 골격 (Node + Python)

**Out of scope** (다른 Work)
- 천체역학 / 시간·좌표 변환 → Work 2
- ephemeris API / DE440 → Work 3
- 스케일 정책 → Work 4
- HDR/log-depth/실제 starfield → Work 5
- 텍스처/PBR/대기 산란 → Work 6
- 폴리시·효과·성능 최적화 → Work 11
- 호스팅/배포 자동화 → Work 12 (CI 골격은 P7에서 처리)

---

## 3. Phase 정의

각 phase는 **Goal / Scope / Decisions / Deliverables / Done / Demo** 6항목 구조.

### Phase 1 — Tech Decisions & Repo Bootstrap

**Goal**: 기술 스택을 확정하고 빌드 가능한 빈 프로젝트가 뜨는 상태까지.

**Scope**
- 결정 라운드 → handoff 결정 로그 기록
- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.{ts,tsx}` 생성
- Node 버전 고정(`.nvmrc`), `.editorconfig`

**Decisions** (P1에서 확정)
- 패키지 매니저: **pnpm** 권장 / npm / bun
- 프레임워크: **React + react-three-fiber** 권장 / Vanilla TS + three.js
- 빌드: Vite (사실상 확정)
- Node 버전: **20 LTS** 이상

**Deliverables**
```
package.json            # scripts: dev, build, preview
tsconfig.json           # strict 기본
vite.config.ts
index.html
src/main.{ts,tsx}       # placeholder 진입점
.editorconfig
.nvmrc                  # 또는 .tool-versions
```

**Done**
- 패키지 설치 → `pnpm dev`로 페이지 응답 (빈 화면 또는 "Orbitarium" 타이틀)
- `pnpm build`로 dist 생성
- 결정 로그 4개 항목 채워짐

**Demo**: `localhost:5173/` 접속 → 빈 페이지 + 콘솔 에러 없음.

---

### Phase 2 — Quality Tooling

**Goal**: lint / format / typecheck 기준선 + 컨벤션 문서.

**Scope**
- ESLint flat config (TS + React 해당 시)
- Prettier 설정
- TS strict 강화 (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` 검토)
- 짧은 컨벤션 문서

**Decisions**
- pre-commit hook 도입 여부 — **권장: 없이 시작**, 필요해지면 도입
- import 정렬 도구 (eslint-plugin-import / Prettier 내장 / simple-import-sort)

**Deliverables**
```
eslint.config.js
.prettierrc.json
.prettierignore
docs/architecture/conventions.md   # 네이밍/모듈 경계/주석 정책 (짧게)
```
+ `package.json` scripts: `lint`, `lint:fix`, `format`, `typecheck`

**Done**
- 일부러 룰 위반 코드 → `pnpm lint`가 잡음 → 원복 후 그린
- `pnpm format`이 변경 없이 통과
- `pnpm typecheck` 통과

**Demo**: 콘솔에서 위 명령 실행해 모두 그린.

---

### Phase 3 — App Shell & Dev Routes

**Goal**: 라우팅 + `/dev/index` 카탈로그 + 프로덕션 빌드 dev 제외.

**Scope**
- 라우터 도입 (React 기준: React Router v6 권장)
- `/` (홈, 메인 시뮬레이터 자리) + `/dev/index` (카탈로그)
- `src/dev/registry.ts` — dev 페이지 등록 메커니즘
- 환경 변수 기반 dev 라우트 활성/비활성 (`VITE_ENABLE_DEV_ROUTES`)

**Decisions**
- 라우터: **React Router v6** / Wouter / TanStack Router
- 프로덕션 dev 제외 방식:
  - (A) env flag + 조건부 import (tree-shake 신뢰)
  - (B) 별도 빌드 타겟 (entry 분리)
  - **권장: (A)** 단순함 우선

**Deliverables**
```
src/routes/Home.tsx               # 또는 동등
src/dev/DevIndex.tsx              # /dev/index
src/dev/registry.ts               # 등록 메커니즘
src/dev/cards/                    # Work 2~12 placeholder 카드 컴포넌트
docs/architecture/dev-routes.md   # 새 dev 페이지 추가 방법
```

**Done**
- `/`, `/dev/index` 양쪽 네비 가능
- `/dev/index`에 Work 2~12 카드 11개 보임 (제목 + 번호 + "준비 중")
- 프로덕션 빌드 산출물에 dev 컴포넌트 미포함 (번들 분석 도구 또는 grep으로 확인)

**Demo**: `/dev/index` 접속 → 카드 그리드.

---

### Phase 4 — three.js Hello

**Goal**: 렌더 루프 + sphere 회전 + FPS + 별 1점 — 파이프라인 검증.

**Scope**
- three.js 씬·카메라·렌더러 (R3F 사용 시 `<Canvas>` 활용)
- `MeshStandardMaterial` 또는 `MeshBasicMaterial` sphere 회전
- FPS 카운터 (자체 구현 또는 `stats.js`)
- BufferGeometry로 별 1점
- 윈도우 리사이즈 처리

**Decisions**
- FPS 표시 위치/스타일 (디버그 오버레이)
- R3F 사용 시 react-three-fiber 패턴 (`useFrame` 등)

**Deliverables**
```
src/render/                       # 디렉터리 컨벤션 시작 (Work 5에서 확장)
src/routes/Home.tsx               # /에 sphere 통합
```

**Out of scope**
- 텍스처, 셰이더, 조명 디테일, HDR, 톤매핑 → Work 5/6
- 실제 항성 카탈로그 → Work 5

**Done**
- `/`에 흰색(또는 임의 색) sphere가 자명히 회전
- FPS 표시, 30fps 이상 (개발 머신)
- DevTools 콘솔 에러/경고 없음

**Demo**: 새로고침 → 회전 + FPS 갱신 확인.

---

### Phase 5 — Test Frameworks

**Goal**: Vitest 단위 + Playwright e2e 골격 + 1개 이상 sanity test씩.

**Scope**
- `vitest.config.ts` (jsdom 또는 happy-dom)
- `playwright.config.ts` (chromium 기본, headless)
- 단위 테스트 1개 (예: 작은 유틸 또는 trivial assert)
- e2e 2개:
  - `/` 로드 → canvas 존재 + non-blank 픽셀
  - `/dev/index` 로드 → 카드 11개

**Decisions**
- e2e: **Playwright** / Cypress (권장: Playwright)
- 단위 테스트 환경: jsdom / happy-dom (권장: happy-dom — 빠름)

**Deliverables**
```
vitest.config.ts
playwright.config.ts
tests/unit/sanity.test.ts
tests/e2e/home.spec.ts
tests/e2e/dev-index.spec.ts
```
+ `package.json` scripts: `test`, `test:watch`, `test:e2e`, `test:e2e:headed`

**Done**
- 모든 테스트 그린
- `--headed` 모드로 e2e 실제 브라우저에서 확인 가능

**Demo**: `pnpm test:e2e --headed` → 브라우저가 잠깐 떠서 페이지 검증.

---

### Phase 6 — Python Tooling Smoke

**Goal**: `tools/python/` 가 설치/실행/테스트 가능 — Work 2부터 reference 모듈을 받아낼 준비.

**Scope**
- venv/uv로 격리 환경 만들기
- `pip install -e ".[dev]"` 성공 확인
- 1개 이상의 pytest 테스트 (`__version__` import 확인)
- ruff/mypy 그린

**Decisions**
- venv 도구: **uv** 권장 (빠름) / venv+pip / pyenv

**Deliverables**
```
tools/python/tests/test_smoke.py      # __version__, CLI smoke
```
(루트 `package.json`에 `python:smoke` 스크립트 추가는 선택)

**Done**
- `cd tools/python && pip install -e ".[dev]"` 깨끗 성공
- `orbitarium-tools version` → `0.1.0`
- `pytest` 통과 (1+ 테스트)
- `ruff check src tests` 통과
- `mypy src` 통과

**Demo**: 터미널에서 위 4개 명령 차례 실행.

**Notes**
- Python 의존성은 lock 파일 미사용 (Work 2부터 늘면 재검토)
- 사용한 venv 도구를 handoff에 기록

---

### Phase 7 — CI Pipeline Skeleton

**Goal**: PR/push 시 lint/type/test/build를 GitHub Actions로 자동 실행.

**Scope**
- `.github/workflows/ci.yml`
  - **node** job: setup-node + pnpm cache → install → lint → typecheck → unit test → build
  - **python** job: setup-python + uv cache → install (`.[dev]`) → ruff → mypy → pytest
  - **e2e** job (선택): Playwright 캐시 후 e2e — 느리면 `workflow_dispatch`로 수동
- README에 CI 배지 (선택)

**Decisions**
- e2e를 ci.yml에 포함할지, 별도 workflow로 분리할지 (권장: 처음엔 포함, 느려지면 분리)

**Deliverables**
```
.github/workflows/ci.yml
README.md     # CI 배지 (선택)
```

**Done**
- main 브랜치 push 시 CI 실행 → 모든 job 그린
- 임시 PR 생성 → CI 그린

**Demo**: stub 변경 PR을 만들어 Actions 탭에서 그린 확인.

---

## 4. Phase 의존 관계

```
P1 Bootstrap
   │
   ▼
P2 Quality
   │
   ▼
P3 Routing & Dev Catalog
   │
   ▼
P4 three.js Hello
   │
   ▼
P5 Test Frameworks
   │
   ▼
P6 Python Smoke ──┐
                   │
                   ▼
                P7 CI
```

P5와 P6는 부분적으로 병렬 가능하지만 단순성을 위해 순차 진행.

## 5. 결정 권장값 (Recommendations)

권장값은 **handoff 결정 로그**에 사용자 컨펌 후 기록.

| 항목 | 권장 | 대안 | 결정 phase |
|---|---|---|---|
| 패키지 매니저 | **pnpm** | npm, bun | P1 |
| 프레임워크 | **React + react-three-fiber** | Vanilla TS + three.js | P1 |
| Node | **20 LTS+** | 22 | P1 |
| 라우터 | **React Router v6** | Wouter, TanStack Router | P3 |
| 단위 테스트 | **Vitest** | Jest | P5 |
| e2e | **Playwright** | Cypress | P5 |
| jsdom 대안 | **happy-dom** | jsdom | P5 |
| Python venv | **uv** | venv+pip, pyenv | P6 |
| CI | **GitHub Actions** | — | P7 |
| Pre-commit | **없이 시작** | husky+lint-staged | P2 |
| 상태 라이브러리 | **보류** | Zustand, Jotai | Work 8 즈음 |

## 6. 위험 / 메모

- **결정 지연 리스크**: P1의 결정이 미뤄지면 P2~P7 모두 블록 → P1 시작 시 결정 1라운드를 먼저 진행.
- **R3F 학습 비용**: React/R3F가 익숙치 않다면 vanilla TS도 선택 가능. 다만 UI 패널(Work 10) 생산성이 떨어질 수 있음.
- **Playwright 설치 무게**: CI에서 캐시 필수. 첫 push에서는 시간 걸릴 수 있음.
- **Vite dev 라우트 tree-shake**: 단순 env flag로 import를 가드해도 dev 코드가 번들에 들어가는 케이스 있음 — P3에서 빌드 산출물 grep으로 확인.

---

_Last updated: 2026-05-05_
