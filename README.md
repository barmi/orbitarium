# orbitarium

[![CI](https://github.com/barmi/orbitarium/actions/workflows/ci.yml/badge.svg)](https://github.com/barmi/orbitarium/actions/workflows/ci.yml)

> **A real-position solar system simulator powered by ephemeris data.**
> Orbit + Planetarium — 실제 ephemeris 데이터로 태양계 천체의 위치/궤적을 정밀하게 재현하는 웹 기반 시뮬레이터.

JPL Horizons API + SPICE/DE440 으로 과학적 정확성을, 카메라 줌과 연동한 스케일 정책으로 시각적 완성도를 동시 추구한다. 자세한 비전과 12개 Work 계획은 [`docs/plan/overview.md`](docs/plan/overview.md).

## 기술 스택

| 영역        | 사용                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| 프론트엔드  | TypeScript · React 19 · Vite · react-three-fiber · three.js · react-router            |
| 테스트      | Vitest (happy-dom) · Playwright (chromium)                                            |
| Python 도구 | uv · `orbitarium-tools` 패키지 (예정: astropy / spiceypy / astroquery)                |
| 품질        | ESLint flat config (type-checked) · Prettier · TS strict (`noUncheckedIndexedAccess`) |
| CI          | GitHub Actions — node / python / e2e 3-job 병렬                                       |

요구사항: Node 20 LTS+ (`.nvmrc` 핀), pnpm 8.10.2 (`packageManager` 필드), Python 3.11+ (uv 가 자동 관리).

## 빠른 시작

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

## 주요 라우트

- `/` — Canvas + 회전 sphere + FPS 오버레이. 개발 모드에서만 `/dev/index` 링크 노출.
- `/dev/index` — Work 별 검증 페이지 카탈로그 (dev 전용 — 프로덕션 빌드에서 lazy import 가 dead-code 제거됨).
- `/dev/<slug>` — 각 Work 의 검증 도구 (Work 2 부터 활성화).

## 스크립트

| 명령                                                | 용도                                   |
| --------------------------------------------------- | -------------------------------------- |
| `pnpm dev`                                          | Vite 개발 서버                         |
| `pnpm build`                                        | 프로덕션 빌드 (`tsc -b && vite build`) |
| `pnpm preview`                                      | 빌드 산출물 로컬 서빙                  |
| `pnpm typecheck`                                    | TypeScript 빌드 검증 (no emit)         |
| `pnpm lint` / `pnpm lint:fix`                       | ESLint                                 |
| `pnpm format` / `pnpm format:check`                 | Prettier                               |
| `pnpm test` / `test:watch` / `test:ui`              | Vitest 단위 테스트                     |
| `pnpm test:e2e` / `test:e2e:headed` / `test:e2e:ui` | Playwright e2e                         |

## Python 도구 (`tools/python/`)

검증 reference / golden value 생성 / 사전 계산용 패키지. Work 2 부터 모듈 추가.

```bash
cd tools/python
uv venv
uv pip install -e ".[dev]"
uv run orbitarium-tools version
uv run pytest
```

자세한 내용은 [`tools/python/README.md`](tools/python/README.md).

## 프로젝트 구조

```
orbitarium/
├── src/
│   ├── routes/         # 메인 라우트 (현재 Home)
│   ├── render/         # three.js / R3F 컴포넌트
│   └── dev/            # /dev/* — Work 별 검증 페이지 (lazy, prod 제외)
├── tests/              # 단위 (Vitest) + e2e (Playwright)
├── tools/python/       # Python 검증 패키지 (orbitarium-tools)
├── docs/
│   ├── plan/           # 전체 계획 + Work 별 plan / handoff
│   └── architecture/   # 컨벤션 / dev-routes 가이드
└── .github/workflows/  # CI
```

## 핵심 설계 원칙

1. **Truth vs Display 분리** — 물리 위치(SI 단위, ICRF/J2000)와 렌더링 위치(스케일 적용)는 별도 레이어. 상세는 [`docs/plan/overview.md §2`](docs/plan/overview.md#2-핵심-원칙-core-principles).
2. **Per-Work 이중 검증** — 각 Work 는 `/dev/<slug>` Dev Demo + `tools/python` Python reference 두 채널로 검증.
3. **시간 정밀성** — 표시는 UTC, 계산은 TDB. JD/J2000 통합.

## 문서

- [`docs/plan/overview.md`](docs/plan/overview.md) — 비전, 핵심 원칙, 12개 Work 계획
- [`docs/plan/work-01-foundation.md`](docs/plan/work-01-foundation.md) — Work 1 (Project Foundation)
- [`docs/plan/work-01-foundation-handoff.md`](docs/plan/work-01-foundation-handoff.md) — Work 1 진행 상태 / 결정 로그
- [`docs/architecture/conventions.md`](docs/architecture/conventions.md) — 코딩 컨벤션
- [`docs/architecture/dev-routes.md`](docs/architecture/dev-routes.md) — `/dev/*` 페이지 추가 절차

## 진행 상태

- ✅ **Work 1** — Project Foundation (P1~P7 완료)
- ⬜ **Work 2** — Astronomy Foundations
- ⬜ Work 3 ~ 12 — [overview.md](docs/plan/overview.md#5-work-단위-전체-계획) 참조
