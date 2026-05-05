# Work 4 — Handoff (Scale System)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-04-scale.md`](work-04-scale.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| 현재 phase   | **P1 완료** ✓ — P2 진입 대기                                                                                        |
| 다음 액션    | **P2 — Distance Scale Functions** 진입 — `positionToScene` + Linear / Piecewise / Logarithmic 정책 + reversibility |
| 마지막 갱신  | 2026-05-06                                                                                                          |
| 블로커       | 없음                                                                                                                |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-04-scale.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Strategy & Brand Types _(완료 2026-05-06)_
- [ ] **P2** — Distance Scale Functions
- [ ] **P3** — Body Size Scale Functions
- [ ] **P4** — Adaptive Scale Interface
- [ ] **P5** — Dev Demo `/dev/scale`
- [ ] **P6** — Cross-validation & Golden Fixtures (Closeout)

> Work 4 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-04-scale.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| #   | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
| --- | ---- | ---- | ----------- | ----- | ------ |
| 1   | 거리 정책 default | **Piecewise monotonic** | 내행성/외행성/원거리 별도 압축 → 행성 라이너업이 자연스러움. 대수는 두 번째 정책. P2 에서 break points 결정. | P1 | 2026-05-06 |
| 2   | 크기 정책 default | **Logarithmic Magnification** | 작은 천체(Pluto, Mercury) 가시성 보장 + 큰 천체(Sun) 비대 방지 동시. P3 에서 r0/k 결정. | P1 | 2026-05-06 |
| 3   | scene 단위 | **1 scene unit = 1 AU 시각 단위 (변환 후)** | three.js scene 자연스러움 + UI 친화. Work 5 에서 1:1 three.js unit 매핑. | P1 | 2026-05-06 |
| 4   | Reversibility | **모든 정책에 forward + inverse 강제** | UI hover (scene → 실제 거리), 카메라 보간 (Work 9), validation 재검증 등 inverse 필수. round-trip 1mm 안. | P1 | 2026-05-06 |
| 5   | 정책 객체 모델 | **`{ name, forward, inverse, metadata }` interface** | function pair는 type 추론 약함. interface 는 metadata (break points, base 등)를 캡슐화 + IDE 자동완성. | P1 | 2026-05-06 |
| 6   | Brand types | **`SceneUnit` phantom + `PositionScene` 3-tuple + `SizeScene = SceneUnit`** | Work 2/3 phantom 패턴 그대로. `SizeScene` 은 의미 명확화 alias (별도 phantom 비용 없음). factory `sceneUnit/positionScene/sizeScene`. | P1 | 2026-05-06 |
| 7   | Radius vs Diameter | **반지름 (Radius)** | IAU WGCCRE 기본 표기. 직경 필요 시 `* 2` 한 줄. mesh 생성 (Work 6) 도 반지름 입력. | P1 | 2026-05-06 |
| 8   | 톨러런스 | **round-trip 1 mm (위치 + 크기)** | Work 3 위치 톨러런스와 일치. 대수 정책의 log/exp LSB 흔들림 ~µm — 1mm 안에 충분 마진. | P1 | 2026-05-06 |
| 9   | 천체 반지름 데이터 출처 | **IAU WGCCRE 2015 평균 적도 반지름** (NAIF pck00011 BODY*_RADII a 값) | Work 2 P4 회전 모델 출처와 일관. 11 entries (Sun + 8 planets + Moon + Pluto). EarthRadius = 6,378,136.6 m. | P1 | 2026-05-06 |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정

- [x] 거리 정책 default: **Piecewise monotonic** ✓ (#1)
- [x] 크기 정책 default: **Logarithmic Magnification** ✓ (#2)
- [x] scene 단위: **1 = 1 AU 시각 단위** ✓ (#3)
- [x] Reversibility 강제: **forward + inverse** ✓ (#4)
- [x] 정책 객체 모델: **interface** ✓ (#5)
- [x] Brand types: **`SceneUnit`/`PositionScene`/`SizeScene`** ✓ (#6)
- [x] Radius vs Diameter: **Radius** ✓ (#7)
- [x] Round-trip 톨러런스: **1 mm** ✓ (#8)
- [x] 천체 반지름 데이터 출처: **IAU WGCCRE 2015 평균 적도 반지름** ✓ (#9)

### P2에서 결정

- [ ] 거리 정책 break points (AU 기반 / body class 기반)
- [ ] 두 번째 정책 (Logarithmic / Dual-linear)
- [ ] 대수 정책 `r0`
- [ ] Round-trip 톨러런스 정책별 적용

### P3에서 결정

- [ ] 두 번째 정책 (MinMaxClamp / 행성별 manual)
- [ ] 대수 확대 `r0` / `k` 기본값
- [ ] MinMax clamp [min, max]

### P4에서 결정

- [ ] 줌 레벨 단위 (log10 AU / linear AU)
- [ ] 정책 lerp 함수 (smoothstep / linear)
- [ ] adaptive inverse 방식 (binary search / 표)

### P5에서 결정

- [ ] Dev Demo 구조 (단일 페이지 / 탭)
- [ ] 1D 라이너업 렌더링 (SVG / Canvas)
- [ ] 정책 곡선 렌더링 옵션 (log-log 토글)

### P6에서 결정

- [ ] Fixture 형식 (JSON / 다른 형식)
- [ ] Fixture 갱신 정책 (수동 / CI 자동)

### 추후 보류 (Work 4 범위 밖)

- 카메라 줌 인풋 → adaptive scale wiring → Work 9
- three.js scene 통합 (1 scene unit = three.js unit 매핑) → Work 5
- 행성 PBR 텍스처 / 셰이더 → Work 6
- 궤도 폴리라인 scene 변환 → Work 7
- 다중 정책 split-screen 비교 → Work 9/10

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록. 형식: 경로 + 한 줄 메모.

### P1 — Strategy & Brand Types _(완료 2026-05-06)_

생성/수정 파일:

- [`src/scale/types.ts`](../../src/scale/types.ts) — `SceneUnit` phantom, `PositionScene`/`SizeScene`, factory `sceneUnit/positionScene/sizeScene`, `DistancePolicy`/`SizePolicy` interface (`{ name, forward, inverse, metadata }`).
- [`src/scale/constants.ts`](../../src/scale/constants.ts) — `SCALE_TOL_M = 1e-3`, `SCALE_TOL_SIZE_M = 1e-3`, `EARTH_MEAN_EQUATORIAL_RADIUS_M = 6_378_136.6`, `BODY_MEAN_EQUATORIAL_RADIUS_M` (11 entries, Meters branded), `SCALE_BODY_NAIF_IDS` (Sun + 8 planets + Moon + Pluto).
- [`src/scale/index.ts`](../../src/scale/index.ts) — re-exports.
- [`tools/python/src/orbitarium_tools/scaling.py`](../../tools/python/src/orbitarium_tools/scaling.py) — Python placeholder mirror (Final 상수 + body radius 표).

테스트:

- [`tests/unit/scale/types.test.ts`](../../tests/unit/scale/types.test.ts) — 8 tests: 톨러런스, Earth 반지름, 11-entry table, max=Sun/min=Pluto, brand factories.
- [`tools/python/tests/test_scaling.py`](../../tools/python/tests/test_scaling.py) — 4 tests (TS와 동일 구조).

검증 결과:

- `pnpm format:check` ✓
- `pnpm lint` ✓ — Prettier 가 SCALE_BODY_NAIF_IDS 한 줄 fit으로 정렬.
- `pnpm typecheck` ✓
- `pnpm test -- tests/unit/scale` ✓ — 8 tests pass.
- `cd tools/python && uv run ruff check / mypy / pytest tests/test_scaling.py` ✓ — 4 tests, 11 source files.

### P2 — Distance Scale Functions

_미시작_

### P3 — Body Size Scale Functions

_미시작_

### P4 — Adaptive Scale Interface

_미시작_

### P5 — Dev Demo `/dev/scale`

_미시작_

### P6 — Cross-validation & Golden Fixtures (Closeout)

_미시작_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 즉시 액션: P1 — Strategy & Brand Types 진입

1. [plan §3 P1](work-04-scale.md#phase-1--strategy--brand-types) 의 결정 항목을 먼저 확정 → §2 결정 로그에 기록
   - 권장값은 [plan §5](work-04-scale.md#5-결정-권장값-recommendations) 참고
2. `src/scale/{types,constants,index}.ts` 작성 — Brand types + 행성 반지름 데이터 + 톨러런스
3. `tools/python/src/orbitarium_tools/scaling.py` placeholder (의미 docstring만)
4. `tests/unit/scale/types.test.ts` — type-only assertions + 상수 검증

### Work 2/3 산출물 활용 (Work 4 시작 전 점검)

```ts
// 단위 — Work 2 brand 그대로
import { type Meters, type Radians, AU } from '@/astro'

// 위치 / 카탈로그 — Work 2 NAIF + Work 3 ephemeris
import { NAIF_CATALOG, getByNaifId } from '@/astro'
import {
  type PositionICRF,
  type StateVectorICRF,
  createDe440Evaluator,
} from '@/ephemeris'

// 테스트 helpers — Work 2 P6 산출물
import { expectCloseMeters, TOL_DISTANCE_MM } from '../../helpers/expectClose'
import { loadWorkFixture } from '../../helpers/fixtures'
```

```python
# Python reference — Work 2/3 모듈
from orbitarium_tools.constants import AU
from orbitarium_tools.naif import NAIF_CATALOG
from orbitarium_tools.de440 import evaluate_segment, resolve_chain
```

### 주요 컨벤션 (Work 1/2/3에서 확정 — 그대로 적용)

```
TS 모듈 위치:
  도메인 코드는 src/<domain>/ — Work 4는 src/scale/ 신설
  dev 페이지는 src/dev/<work-name>/ — Work 4는 src/dev/scale/

Python 모듈:
  tools/python/src/orbitarium_tools/<name>.py — Work 4는 scaling

테스트:
  단위:  tests/unit/scale/<name>.test.ts (vitest, happy-dom)
  e2e:   tests/e2e/dev-scale.spec.ts (playwright, chromium)
  fixtures: tests/fixtures/work-04/ (JSON, Python으로 생성)
  pytest: tools/python/tests/test_<name>.py

Dev 라우트:
  src/dev/registry.ts 의 entry 에 Component 채우면 자동 라우트화
  Work 4 entry slug: 'scale' (placeholder 이미 있음)

CI:
  .github/workflows/ci.yml 자동 커버 (Work 3 P6 에서 DE440 캐시 통합 완료)
  새 Python 의존성 (matplotlib 추가 가능): pyproject.toml [viz] extras 활용

커밋 prefix: [work-04/p<N>] <한국어 한 줄 요약>
```

### 빠른 검증 명령

```bash
# 프론트엔드
pnpm install
pnpm dev          # /dev/scale (P5 후 활성)
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

# Python (tools/python/)
cd tools/python
uv pip install -e ".[astro,viz,dev]"   # matplotlib 사용 시 [viz] 추가
uv run orbitarium-tools version
uv run ruff check src tests
uv run mypy src
uv run pytest

# 골든 fixture 재생성 (P6 후, Work 2/3 패턴)
pnpm fixtures:work-04
```

## 6. 알려진 이슈 / 노트

- **정책 reversibility의 IEEE 754 한계**: 대수 정책은 dynamic range 10⁶~10¹³ m → log/exp 한 번 거치면 LSB ~수 µm 흔들림 가능. 1mm 톨러런스 안에 충분.
- **Sun at SSB ≈ 0**: Sun 의 실제 SSB 거리 ~1.5 million km — `r=0` 처리 회피용. positionToScene 에서 r 분모 0 가드 필요.
- **break point 도함수 불연속**: piecewise monotonic 정책은 break 에서 시각적 점프 가능 — 필요 시 C¹ Hermite 도입.
- **scene unit vs three.js unit**: 본 Work 는 scene unit 만 정의. Work 5 에서 three.js 좌표로 1:1 매핑 (단순). 만일 변경하려면 scene unit 정의를 Work 4 P1 에서 결정.
- **adaptive scale 의 카메라 단위 미확정**: Work 9 카메라 거리 단위 (scene vs AU) 와 wiring 시 호환 필요. 본 phase 의 `ZoomLevel = log10(AU)` 가 Work 9 입력과 호환되도록 인터페이스 디자인.
- **matplotlib 의존성**: Python `[viz]` extras 에 이미 포함. 처음 import 시 ~1초 — pytest 첫 실행 느림. 이후 캐시.
- **astropy ERFA dubious year warning**: Work 2/3과 동일 — 미래 시각 fixture 호출 시 발생, 무시 가능.

## 7. 갱신 이력 (Changelog)

| 날짜       | 변경                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-06 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정 (Strategy → Distance Scale → Size Scale → Adaptive → Dev Demo → Closeout). P1 결정 ~9건 대기. Work 3 산출물 (Position/State vector) 적극 활용 예정. |
| 2026-05-06 | **P1 완료** — `src/scale/{types,constants,index}.ts` + Python 미러 + 12 단위 테스트 (TS 8 + Python 4). 결정 9건 (#1~#9) 모두 권장값 채택: Piecewise default / Logarithmic size default / 1 scene unit = 1 AU / forward+inverse 강제 / interface 모델 / SceneUnit+PositionScene+SizeScene phantom / Radius / 1mm 톨러런스 / IAU WGCCRE 2015 평균 적도 반지름 (11 entries). format/lint/typecheck/test/build/ruff/mypy/pytest 전부 그린. |

---

## Appendix A. Phase 마감 체크리스트 (Template)

각 phase를 [x]로 옮기기 전에 다음을 모두 확인:

1. [ ] [plan §3](work-04-scale.md#3-phase-정의) 의 해당 phase Done 기준 모두 충족
2. [ ] §2 결정 로그에 phase 결정 사항 모두 기록
3. [ ] §3 해당 phase Open Questions 모두 [x] 처리
4. [ ] §4 해당 phase 산출물 인덱스 채움 (경로 + 한 줄 메모)
5. [ ] §0 현재 phase 갱신 (다음 phase로)
6. [ ] §7 갱신 이력에 한 줄 추가
7. [ ] (선택) 커밋 — 메시지 prefix `[work-04/p<N>]`
