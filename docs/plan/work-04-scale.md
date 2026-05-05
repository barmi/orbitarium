# Work 4 — Scale System (Plan)

> 진행 상태와 결정 사항은 **[work-04-scale-handoff.md](work-04-scale-handoff.md)** 에 누적.
> 본 문서는 phase 정의/Done 기준의 정적 참조용.

---

## 0. 한눈에 (At a Glance)

| 항목         | 값                                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 목표         | "실제 위치 / 크기"를 보존한 채 **렌더 가능한 scene 좌표**로 변환하는 정책 + 함수 모듈을 확정한다. Truth(SI) ↔ Display(scene) 변환의 단일 진실원이 된다.                                                  |
| Phase 수     | 6                                                                                                                                                                                                        |
| 선행 Work    | Work 2 (Astronomy: 단위 brand `Meters`/`Radians`), Work 3 (Ephemeris: `PositionICRF`/`StateVectorICRF`)                                                                                                  |
| 후속 Work    | Work 5 (Render) — scene 좌표를 three.js mesh 위치로. Work 6 (Bodies) — 본 phase의 size policy 적용. Work 7 (Orbits) — 궤도 폴리라인 scene 변환. Work 9 (Camera) — adaptive scale 카메라 연동.            |
| 핵심 산출물  | `src/scale/` 모듈 (TS 정책 함수 + brand types) + `orbitarium_tools.scaling` (Python reference + matplotlib 시각화) + `/dev/scale` 데모 + 골든값 fixture (round-trip + 행성 라이너업) + `scale-conventions.md` |

## 1. 결과 정의 (Definition of Done)

Work 4 마감은 **다음 모두**가 통과해야 한다:

- [ ] **거리 정책 ≥ 2종**: 권장 default + 비교용 1+ (이중 선형 / 구간별 monotonic / 대수 중 둘 이상). 모두 단조증가 (monotonic) 보장.
- [ ] **크기 정책 ≥ 2종**: 권장 default (대수 확대 등) + 비교용 1+. 시각화 크기 = `f(physicalRadius)`.
- [ ] **Reversibility**: 모든 정책 함수는 `forward` + `inverse` 쌍 제공 (round-trip 위치 ≤ 1mm 안에서 일치, 크기 ≤ 1mm).
- [ ] Brand types: `SceneUnit`, `PositionScene`, `SizeScene` — Work 3 `PositionICRF`/`Meters` 와 변환만 명시 함수로 가능.
- [ ] **Truth → Scene 변환**: `positionToScene(p: PositionICRF, policy): PositionScene` — 정책 객체 인자 + 순수함수 (no global state).
- [ ] **Python reference**: `orbitarium_tools.scaling` — 동일 정책 함수 + matplotlib 정적 플롯 (정책별 실제 vs 시각 거리 곡선).
- [ ] **교차 검증**: TS vs Python — 거리 1mm, 크기 1mm 안에서 일치 (golden fixtures 기반).
- [ ] **Dev Demo** `/dev/scale` — 정책 선택기 + 슬라이더 + 1D 행성 라이너업 + 줌 시뮬레이션. Work 3 evaluator 활용해 현재 시각의 행성 위치를 정책에 통과시킨 결과 표시.
- [ ] `pnpm lint` / `format:check` / `typecheck` / `test` / `test:e2e` / `build` 그린.
- [ ] `cd tools/python && uv run ruff check / mypy / pytest` 그린.
- [ ] CI (node / python / e2e) 그린.
- [ ] [handoff 문서](work-04-scale-handoff.md)의 모든 phase 체크박스 [x],
      결정 로그 누락 없음, 산출물 인덱스 채워짐.

## 2. 범위 / 비범위

**In scope**

- 거리 스케일 정책 (≥ 2종) — 이중 선형, 구간별 monotonic, 대수 중 적어도 둘
- 크기 스케일 정책 (≥ 2종) — 대수 확대, 균일 확대, 행성별 manual 중 적어도 둘
- `PositionICRF` (m) → `PositionScene` 변환 함수 + 역변환
- `Meters` (반지름) → `SizeScene` 변환 + 역변환
- Brand types (`SceneUnit`, `PositionScene`, `SizeScene`)
- Adaptive scale **인터페이스** (P4) — 정책 + 줌 레벨 → 동적 정책 선택. 본 Work는 인터페이스만, 실제 카메라 연동은 Work 9.
- 천체 평균 반지름 데이터 (Sun + 8 planets + Moon) — IAU 평균 적도 반지름
- Python reference + matplotlib 정적 플롯 (정책 시각화)
- Dev Demo `/dev/scale`
- 골든 fixture (정책별 입력 grid → scene 변환 결과)

**Out of scope** (다른 Work)

- three.js scene graph 통합 → Work 5
- 카메라 줌 인풋 처리 (mouse/touch → 줌 레벨) → Work 9
- 실제 카메라 ↔ adaptive scale wiring → Work 9
- 행성 PBR 텍스처 / 셰이더 → Work 6
- 궤도 폴리라인 시각화 → Work 7
- HDR / log-depth 렌더링 → Work 5
- 다중 정책 동시 표시 (split-screen) → 데모에 포함하면 OK, 메인 앱은 Work 9/10

---

## 3. Phase 정의

각 phase는 **Goal / Scope / Decisions / Deliverables / Done / Demo** 6항목 구조.
각 phase는 (TS 코드 + Python reference + 단위/통합 테스트)를 **같은 phase 내에서** 동반 작성.

### Phase 1 — Strategy & Brand Types

**Goal**: Work 4 전체 설계 결정 + 후속 phase가 import할 타입/인터페이스를 확정.

**Scope**

- TS: `src/scale/types.ts`
  - Brand types: `SceneUnit = number & { readonly __unit: 'scene' }`
  - `PositionScene = readonly [SceneUnit, SceneUnit, SceneUnit]`
  - `SizeScene` (radius / 직경 분리 결정 후)
  - `DistancePolicy` interface (forward + inverse + name + metadata)
  - `SizePolicy` interface (forward + inverse + name + metadata)
  - factory `sceneUnit(n)`, `positionScene(x,y,z)` 등
- TS: `src/scale/constants.ts`
  - 톨러런스 (round-trip 1mm)
  - 행성 평균 반지름 (Sun + 8 planets + Moon, IAU 평균 적도)
- TS: `src/scale/index.ts` — re-exports placeholder
- Python: `orbitarium_tools.scaling` placeholder (의미 docstring + 동일 상수)

**Decisions** (P1에서 확정)

- 거리 정책 default:
  - (a) **구간별 단조 변환 (Piecewise monotonic)** — 내행성/외행성/원거리 3구간 — 권장
  - (b) 대수 (logarithmic)
  - (c) 이중 선형 (Dual-linear)
- 크기 정책 default:
  - (a) **대수 확대 (작은 천체 가시성 보장 + 큰 천체 비대 방지)** — 권장
  - (b) 균일 확대 (모든 천체 × N)
  - (c) 행성별 manual (테이블 룩업)
- scene 단위: **1 scene unit = 1 AU 시각 단위** (변환 후 디스플레이) — three.js scene 자연스러움 + UI 친화 — 권장
- Reversibility: **모든 정책 함수는 `forward` + `inverse` 쌍 강제** — 권장
- 정책 객체 모델: **`{ name, forward(meters), inverse(scene), metadata }` interface** — 권장
- Brand types: **`SceneUnit` phantom + `PositionScene`/`SizeScene` 3-tuple/scalar** — 권장
- `radius` vs `diameter`: **반지름 (Radius)** 기본 — IAU 평균 적도 반지름 — 권장
- 톨러런스: **위치 round-trip 1 mm, 크기 round-trip 1 mm** — 권장
- 천체 반지름 데이터 출처: **IAU WGCCRE 2015 평균 적도 반지름** (Work 2 P4 NAIF `pck00011.tpc` BODY*_RADII 와 일관) — 권장

**Deliverables**

```
src/scale/
  types.ts                     # Brand + interface
  constants.ts                 # 톨러런스 + 행성 반지름 데이터
  index.ts                     # public re-exports

tools/python/src/orbitarium_tools/
  scaling.py                   # 타입 placeholder + 의미 정의
```

+ `tests/unit/scale/types.test.ts` — type-only assertions + 상수 검증
+ handoff §2 결정 로그 8~10개 항목 채움.

**Done**

- 결정 8~10개 항목 채워짐
- 타입이 후속 phase에서 그대로 import 가능
- `pnpm typecheck` 그린

**Demo**: 콘솔에서 `import { type PositionScene, sceneUnit } from '@/scale'` 동작 확인.

---

### Phase 2 — Distance Scale Functions

**Goal**: `PositionICRF` (m) → `PositionScene` (scene unit) 변환 함수 모듈. ≥ 2 정책 구현 + reversibility 검증.

**Scope**

- TS: `src/scale/distancePolicies.ts`
  - `LinearPolicy` (단순 m → AU 시각 단위 비례) — 비교 baseline
  - **선택 권장 1**: `PiecewiseMonotonicPolicy` (내행성/외행성 분리 + 압축)
  - **선택 권장 2**: `LogarithmicPolicy` (`log(1 + r/r0)` 기반)
- 정책 객체:
  ```ts
  interface DistancePolicy {
    name: string
    forward(distanceM: Meters): SceneUnit
    inverse(distanceScene: SceneUnit): Meters
    metadata: { breakpoints?: number[]; base?: number; ... }
  }
  ```
- 벡터 변환: `positionToScene(pos: PositionICRF, policy): PositionScene` — 방향 보존, 길이만 정책 통과
  ```ts
  // r = |pos|, scaledR = policy.forward(r)
  // posScene = pos × (scaledR / r)
  ```
- 역변환: `sceneToPosition(posScene: PositionScene, policy): PositionICRF`
- Python: `scaling.py` — 동일 정책 함수, matplotlib 정적 플롯 (`generate_plots(out_dir)`)
- 골든 fixture: 정책 × 거리 grid (10⁶ ~ 10¹³ m, 8행성 반지름) → forward / inverse 결과

**Decisions** (P2에서 확정)

- 정책 인터페이스 표준화 — P1 결정 #5 따름
- 구간별 monotonic 의 break points 결정:
  - (a) **AU 기반: [0.4, 5, 50] AU (Mercury / Mars-Jupiter / Pluto)** — 권장
  - (b) Body class 기반: terrestrial / gas giant / TNO
- 대수 정책의 `r0`: **1 AU** (= scaling 1배 기준)
- Round-trip 톨러런스: 정책별 1mm (선형은 이상적, 대수는 IEEE 754 LSB)
- 단조 (monotonic) 검증: random samples + ascending check

**Deliverables**

```
src/scale/
  distancePolicies.ts          # 정책 구현체 (Linear / Piecewise / Logarithmic)
  position.ts                  # positionToScene / sceneToPosition

tools/python/src/orbitarium_tools/
  scaling.py                   # 정책 함수 미러 + matplotlib generate_plots
```

+ `tests/unit/scale/distancePolicies.test.ts` — 정책별 forward/inverse round-trip + monotonic 검증
+ `tests/fixtures/work-04/distance-policies.json` — 정책 × 거리 grid

**Done**

- ≥ 2 정책이 round-trip 1mm 안에서 일치
- TS vs Python fixture 1mm 안에서 일치
- `pnpm test` / `uv run pytest` 그린

**Demo**: `pnpm dev` → `/dev/scale` 진입 후 정책 선택 → 1D 라이너업 변경 (P5에서 시연).

---

### Phase 3 — Body Size Scale Functions

**Goal**: 천체 반지름 (m) → 시각화 크기 (scene unit) 변환. ≥ 2 정책 + reversibility.

**Scope**

- TS: `src/scale/sizePolicies.ts`
  - `UniformPolicy` (모든 반지름 × N) — 비교 baseline
  - **선택 권장 1**: `LogarithmicMagnification` (`log10(r/r0) × k`)
  - **선택 권장 2**: `MinMaxClampPolicy` (반지름을 [min, max] scene 사이에 정규화)
- 정책 객체:
  ```ts
  interface SizePolicy {
    name: string
    forward(radiusM: Meters): SizeScene
    inverse(radiusScene: SizeScene): Meters
    metadata: { ... }
  }
  ```
- 변환 헬퍼: `radiusToScene(r: Meters, policy): SizeScene`
- Python: 동일 정책 + matplotlib (반지름 vs 시각화 크기 정적 플롯)
- 골든 fixture: 정책 × 천체 반지름 → 시각화 크기

**Decisions** (P3에서 확정)

- 대수 확대 정책의 `r0` (기준 반지름): **지구 반지름 6371 km** — 권장 (= scene unit 1)
- 대수 확대 정책의 `k` (배율): **0.3 ~ 1 사이 슬라이더 (default 0.5)** — 시각적 균형
- min/max clamp 정책의 [min, max]: **[0.005, 5] scene unit** (Pluto 작게, Sun 크게) — 권장
- 반지름 데이터 정밀도: **IAU 평균 적도 반지름** (P1 #9 따름)

**Deliverables**

```
src/scale/
  sizePolicies.ts              # 정책 구현체

tools/python/src/orbitarium_tools/
  scaling.py                   # 동일 정책 + radius_plot
```

+ `tests/unit/scale/sizePolicies.test.ts` — round-trip + 단조 + 상한/하한 clamp
+ `tests/fixtures/work-04/size-policies.json`

**Done**

- 정책 ≥ 2 round-trip 1mm 안 일치
- 행성 라이너업 시각화 가능 (P5에서 시연)
- `pnpm test` / `uv run pytest` 그린

**Demo**: `/dev/scale`에서 크기 정책 토글 → 라이너업의 행성 크기 변경 (P5).

---

### Phase 4 — Adaptive Scale Interface

**Goal**: 카메라 줌 레벨에 따라 거리/크기 정책을 보간/전환하는 **인터페이스**. 본 Work는 정책 모델만 — 실제 카메라 연동은 Work 9.

**Scope**

- TS: `src/scale/adaptive.ts`
  - `ZoomLevel = number & { readonly __unit: 'log10AU' }` — 카메라 거리의 log10 (AU 단위)
  - `AdaptiveDistancePolicy` interface:
    ```ts
    {
      name: string
      forward(distanceM: Meters, zoom: ZoomLevel): SceneUnit
      inverse(distanceScene: SceneUnit, zoom: ZoomLevel): Meters
      // 두 정책 사이를 줌 레벨로 lerp
    }
    ```
  - 두 `DistancePolicy` 간 lerp 헬퍼
  - `AdaptiveSizePolicy` interface (동일 패턴)
- 본 Work는 **정책 정의 + 단위 테스트** 만. Work 9에서 카메라 zoom 인풋과 wiring.

**Decisions** (P4에서 확정)

- 줌 레벨 단위: **log10(distance / 1 AU)** — 행성 거리 0.4 AU ~ 50 AU 범위가 [-0.4, 1.7] log scale → 자연스러움 — 권장
- 정책 lerp 함수: **smoothstep (cubic Hermite)** vs linear — 권장 smoothstep
- 정책 보간이 reversibility 깨뜨리지 않도록: **forward는 lerp, inverse는 binary search** vs 정확 inverse 표 — 권장 binary search (정밀도 보장)

**Deliverables**

```
src/scale/
  adaptive.ts                  # 인터페이스 + lerp helpers
```

+ `tests/unit/scale/adaptive.test.ts` — lerp round-trip + 양 끝점 정확성
+ `tests/fixtures/work-04/adaptive.json` (선택)

**Done**

- adaptive 정책의 양 끝 zoom 에서 base 정책과 일치
- 중간 zoom 에서 round-trip ≤ 1mm
- `pnpm test` 그린

**Demo**: `/dev/scale`에서 zoom 슬라이더 → 행성 라이너업 변경 (P5).

---

### Phase 5 — Dev Demo `/dev/scale`

**Goal**: P2~P4 정책을 눈으로 즉시 확인할 수 있는 인터랙티브 페이지.

**Scope**

- React 컴포넌트 (R3F 불필요 — 1D 시각화는 SVG/Canvas 2D)
- 패널 1: **정책 선택기**
  - 거리 정책 라디오 (Linear / Piecewise / Logarithmic)
  - 크기 정책 라디오
  - adaptive zoom 슬라이더 (선택적, P4 결과 적용)
- 패널 2: **1D 행성 라이너업**
  - 가로 SVG 라인 + 행성 점 (Work 3 evaluator 통과한 현재 시각의 행성 위치를 정책에 적용)
  - 행성 점 크기 = size 정책 적용
  - x 축에 scene unit + 실제 AU 동시 표시
- 패널 3: **정책 곡선**
  - 실제 거리 vs 시각 거리 (log-log 또는 linear) — 정책별 한 곡선씩
  - SVG 또는 Canvas 2D
- 패널 4: **Round-trip 검증** (선택적)
  - 임의 입력 거리 → forward → inverse → diff 표시 (sanity)
- registry.ts에서 Work 4 entry의 `Component` 채움
- 폴리시 무시, 기능 우선

**Decisions**

- 컴포넌트 구조: **단일 페이지 + 4 섹션** vs 탭 — 권장 단일 페이지
- 1D 라이너업 렌더링: **SVG** (간단 + 인터랙션 용이) vs Canvas — 권장 SVG
- 정책 곡선 렌더링: **SVG** + log-log 옵션 토글 — 권장

**Deliverables**

```
src/dev/scale/
  ScaleDemo.tsx
  PolicyPicker.tsx
  PlanetLineup1D.tsx
  PolicyCurves.tsx
  RoundTripPanel.tsx (선택)
  scale.css
```

+ `src/dev/registry.ts` Work 4 entry → `Component: lazy(() => import('./scale/ScaleDemo'))`
+ `src/dev/dev.css` `@import './scale/scale.css'`
+ `tests/e2e/dev-scale.spec.ts` — 4 specs (페이지 로드, 정책 변경, 라이너업 갱신, 곡선 표시)
+ `tests/e2e/dev-index.spec.ts` Work 4 available 기대값 갱신

**Done**

- `/dev/scale` 진입 가능, 정책 변경 즉시 반영
- e2e 그린

**Demo**: `pnpm dev` → `/dev/scale` 에서 정책 변경 → 라이너업 + 곡선 변경.

---

### Phase 6 — Cross-validation & Golden Fixtures (Closeout)

**Goal**: P2~P4 결과의 회귀 가드 + Work 5+ 진입 가이드 정착.

**Scope**

- Python `generate_fixtures(out_dir)` 컨벤션 정착 (Work 2/3 패턴 재사용)
  - `scaling.py::generate_fixtures(...)` — 거리/크기 정책 × 입력 grid
- 통합 CLI: `orbitarium-tools fixtures --work=4 --out=tests/fixtures/work-04/`
- Fixture 형식 컨벤션 (Work 2/3 동일 — JSON, `_` 메타 prefix, Prettier 정렬)
- TS: `tests/helpers/expectClose.ts` 의 helpers 재사용
- 회귀 가드: 의도적으로 정책 함수 결과를 1mm 초과로 흔들기 → fail → 원복
- `package.json` script: `fixtures:work-04`
- `docs/architecture/scale-conventions.md` — 정책 모델 / Truth ↔ Display 변환 / Work 5+ 진입 패턴
- `tests/fixtures/work-04/README.md` — fixture 구성, 재생성 명령

**Decisions** (P6에서 확정)

- Fixture 형식: **JSON** (Work 2/3와 동일) — 권장
- Fixture 갱신 정책: **수동 (`pnpm fixtures:work-04`)** — 권장
- Work 5+ 진입 시 import 패턴 docstring 충실히

**Deliverables**

```
tools/python/src/orbitarium_tools/
  cli.py                       # 'fixtures --work=4' 분기 추가

tests/fixtures/work-04/
  distance-policies.json       # P2에서 작성
  size-policies.json           # P3에서 작성
  adaptive.json (선택)         # P4에서 작성
  README.md                    # 형식 + 재생성 명령

docs/architecture/
  scale-conventions.md         # 정책 요약 + Work 5+ 진입 가이드
```

+ `package.json` script `fixtures:work-04`

**Done**

- `pnpm fixtures:work-04` 한 번에 모든 fixture 재생성 + Prettier 정렬
- 의도적 1mm 초과 변경 → `pnpm test` fail 재현 → 원복 후 그린
- 컨벤션 문서가 Work 5 작업자에게 즉시 사용 가능 수준

**Demo**: `pnpm fixtures:work-04` → `git diff tests/fixtures/work-04/` 빈 결과(이미 최신).

---

## 4. Phase 의존 관계

```
P1 Strategy & Brand Types
   │
   ├──────────────┐
   ▼              ▼
P2 Distance     P3 Size
   │              │
   └──────┬───────┘
          ▼
       P4 Adaptive (인터페이스만)
          │
          ▼
       P5 Dev Demo
          │
          ▼
       P6 Closeout (fixtures + docs)
```

- P2와 P3는 P1 이후 부분적으로 병렬 가능 (단순성을 위해 순차 권장).
- P4는 P2 + P3을 둘 다 의존.
- P5는 P1~P4 산출물을 모두 사용 → 순차 진행.
- P6는 마감 단계 — 모든 phase의 fixture/문서 통합.

## 5. 결정 권장값 (Recommendations)

권장값은 **handoff 결정 로그**에 사용자 컨펌 후 기록.

| 항목                          | 권장                                                                  | 대안                                       | 결정 phase |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------ | ---------- |
| 거리 정책 default             | **구간별 단조 변환 (Piecewise monotonic)**                            | 대수 / 이중 선형                           | P1         |
| 크기 정책 default             | **대수 확대 (Logarithmic Magnification)**                             | 균일 확대 / 행성별 manual                  | P1         |
| scene 단위                    | **1 = 1 AU (시각, 변환 후)**                                          | 1 = 1 m / 임의                             | P1         |
| Reversibility                 | **모든 정책에 forward + inverse 강제**                                | forward만                                  | P1         |
| 정책 객체 모델                | **`{ name, forward, inverse, metadata }` interface**                  | function pair / class                      | P1         |
| Brand types                   | **`SceneUnit`, `PositionScene`, `SizeScene`**                         | number 그대로                              | P1         |
| Radius 단위                   | **반지름 (radius)**                                                   | 직경                                       | P1         |
| 톨러런스                      | **round-trip 1 mm**                                                   | 1 cm / 1 m                                 | P1         |
| 천체 반지름 데이터 출처       | **IAU WGCCRE 2015 평균 적도 반지름**                                  | 자체 정의                                  | P1         |
| 거리 정책 break points        | **AU 기반: [0.4, 5, 50] AU**                                          | body class                                 | P2         |
| 거리 정책 — 두 번째 구현      | **Logarithmic + Linear baseline**                                     | Dual-linear                                | P2         |
| 대수 정책 `r0`                | **1 AU**                                                              | 1 m                                        | P2         |
| 크기 정책 — 두 번째 구현      | **MinMaxClamp + Uniform baseline**                                    | 행성별 manual                              | P3         |
| 대수 확대 `r0` / `k`          | **r0 = 6371 km (Earth) / k = 0.5**                                    | r0 = 1 m                                   | P3         |
| MinMax clamp [min, max]       | **[0.005, 5] scene unit**                                             | [0.01, 10]                                 | P3         |
| Adaptive zoom 단위            | **log10(distance / 1 AU)**                                            | linear AU                                  | P4         |
| Adaptive lerp 함수            | **smoothstep (cubic Hermite)**                                        | linear                                     | P4         |
| Adaptive inverse 방식         | **binary search**                                                     | 정확 inverse 표                            | P4         |
| Dev Demo 구조                 | **단일 페이지 + 4 섹션**                                              | 탭                                         | P5         |
| 1D 라이너업 렌더링            | **SVG**                                                               | Canvas 2D                                  | P5         |
| Fixture 형식                  | **JSON** (Work 2/3와 동일)                                            | binary / Parquet                           | P6         |
| Fixture 갱신 정책             | **수동** (`pnpm fixtures:work-04`)                                    | CI 자동                                    | P6         |

## 6. 위험 / 메모

- **정책 reversibility 의 IEEE 754 한계**: 대수 정책은 large dynamic range (10⁶ ~ 10¹³ m) → log/exp 한 번 거치면 LSB 흔들림 ~수 µm 가능. 1mm 톨러런스 안에 충분.
- **Piecewise monotonic 의 break point 부드러움**: break point 에서 도함수 불연속 → 시각적으로 점프 가능. C¹ 연속 (Hermite spline) 도입 검토 (P2/P4).
- **방향 보존 vs 길이만 변환**: `positionToScene` 은 `pos × (scaledR / r)` — 방향 보존, 0 위치 (r=0) 처리 주의 (Sun at SSB ≈ 0).
- **Sun at SSB**: Sun 위치 ≈ 1.5 million km from SSB (목성 영향). r=0 case 회피.
- **천체 반지름 정밀도**: 평균 적도 반지름 vs 평균 부피 반지름 (~1% 차이). 시각화 목적이라 평균 적도로 충분 (Work 6에서 셰이더용 폴라 반지름 별도 도입 가능).
- **adaptive scale 카메라 연동의 카메라 단위**: Work 9에서 카메라 거리 단위가 무엇인지 확정 (scene unit vs AU). 본 phase 의 `ZoomLevel = log10(AU)` 가 Work 9 입력과 호환되도록 인터페이스 디자인.
- **TS vs Python 알고리즘 동기화**: Work 2/3과 동일 — 같은 알고리즘 → IEEE 754 비트 동일. 1mm 톨러런스는 안전 마진.
- **scene unit 의 three.js 좌표 매핑**: Work 5에서 1 scene unit = 몇 three.js 단위? 권장 1:1 매핑 (단순). 본 phase는 scene unit 만 책임.
- **데이터 정렬**: Work 2 NAIF 카탈로그 + Work 3 DE440 evaluator 와 동일한 NAIF id 사용 (행성 반지름 데이터 키도 NAIF id).

---

_Last updated: 2026-05-06_
