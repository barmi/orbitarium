# Work 4 — Handoff (Scale System)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-04-scale.md`](work-04-scale.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| 현재 phase   | **P5 완료** ✓ — P6 진입 대기                                                                                  |
| 다음 액션    | **P6 — Cross-validation & Golden Fixtures (Closeout)** 진입 — fixture/doc closeout + 전체 검증              |
| 마지막 갱신  | 2026-05-06                                                                                                    |
| 블로커       | 없음                                                                                                          |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-04-scale.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Strategy & Brand Types _(완료 2026-05-06)_
- [x] **P2** — Distance Scale Functions _(완료 2026-05-06)_
- [x] **P3** — Body Size Scale Functions _(완료 2026-05-06)_
- [x] **P4** — Adaptive Scale Interface _(완료 2026-05-06)_
- [x] **P5** — Dev Demo `/dev/scale` _(완료 2026-05-06)_
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
| 10  | 거리 정책 break points | **AU 기반 [0.4, 5, 50] AU → [0.4, 1.5, 3.0] scene** | 내행성 (Mercury~Mars) 1:1 / 외행성 (Mars~Jupiter) ~3.7배 압축 / 원거리 (Jupiter~Pluto) ~30배 압축. 50 AU 너머는 마지막 segment slope 그대로 선형 연장. | P2 | 2026-05-06 |
| 11  | 두 번째 / 세 번째 거리 정책 | **Linear baseline + Logarithmic** (`log(1 + r/r0)`) | Linear 는 비교/검증 baseline. Logarithmic 은 카메라 줌 광범위 시 부드러운 압축. P4 adaptive lerp 의 보간 양 끝점. | P2 | 2026-05-06 |
| 12  | 대수 정책 `r0` | **1 AU** | scene unit 1 = log(2) ≈ 0.693 — 자연스러운 reference (Earth 위치). r0=1m 으로 했다면 scaled value 가 25 정도 → UI 압축 어려움. | P2 | 2026-05-06 |
| 13  | Round-trip 톨러런스 (실제 측정) | **1 mm 절대 톨러런스가 30 AU 까지 보장** — 그 너머는 IEEE 754 LSB ~1.3 mm/40AU (Pluto) | 30 AU = 4.5e12 m × 2^-52 ≈ 1mm. piecewise/log 정책 모두 같은 IEEE 754 LSB floor. 외행성에서는 relative 1e-14 검증. | P2 | 2026-05-06 |
| 14  | positionToScene 알고리즘 | **방향 보존 + 길이만 정책 통과** (`pos × (sScene / rMeters)`), 0 벡터 가드 (Sun at SSB ~0 case) | 정책이 pos magnitude 만 바꾸고 방향은 보존. r=0 케이스는 [0,0,0] 반환. cosine similarity 1.0 검증으로 방향 보존 확인. | P2 | 2026-05-06 |
| 15  | 크기 정책 — 추가 구현 | **Uniform baseline + MinMaxClamp** | Uniform 은 비교 baseline (r/AU). MinMaxClamp 는 모든 천체 가시화 — log10 normalize to [0.005, 5] scene. | P3 | 2026-05-06 |
| 16  | 대수 확대 정책 공식 | **`base + k * log10(1 + r/r0)`** with r0=Earth, k=0.5, base=0.005 | 단순 log(r/r0) 는 r<r0 에서 음수 → 시각화 불가. log(1+x) 시프트로 r=0 → base 안전. inverse: r0 * (10^((s-base)/k) - 1). | P3 | 2026-05-06 |
| 17  | MinMaxClamp 공식 | **log10 normalize: `min + (s - log_min) / (log_max - log_min) * span`** | 입력 r_min=Pluto, r_max=Sun → scene [0.005, 5]. 정확 reversible. 본 카탈로그 너머 (e.g. 위성) 의 입력은 카탈로그 확장 시 갱신. | P3 | 2026-05-06 |
| 18  | 크기 round-trip 검증 | **카탈로그 11 entries 전부 1mm 이내** | Sun/Earth/Pluto/Moon 등 전 범위. log/exp LSB 흔들림은 Sun (7e8 m) 에서도 ~1µm — 1mm 마진 충분. | P3 | 2026-05-06 |
| 19  | ZoomLevel 단위 | **`log10(distance / 1 AU)`** brand `'log10AU'` — `ZOOM_INNER = -0.4` (Mercury), `ZOOM_OUTER = 1.7` (Pluto) | 행성 거리 0.4~50 AU 범위가 [-0.4, 1.7] log scale → linear AU 보다 자연스러움. Work 9 카메라 거리 인풋 매핑은 동일 스케일 사용. | P4 | 2026-05-06 |
| 20  | Adaptive lerp 함수 | **smoothstep (cubic Hermite, `t² (3 - 2t)`)** | linear 보다 줌 전환이 자연스러움 (양 끝점에서 도함수 0). edge0==edge1 케이스는 step function 으로 fallback. | P4 | 2026-05-06 |
| 21  | Adaptive inverse 방식 | **binary search (bisection)** with bracket `[min, max]` of 두 base inverse | 정책 lerp 가 monotonic 합성이라 두 base inverse 사이에 정확 root 가 존재. value tol = 1e-15, **bracket tol = 1e-6 m (1µm)** — scene tol 만 쓰면 lerp slope 0.5 시 input 에서 0.3m 오차 발생. max 200 iter (실제 ~50). | P4 | 2026-05-06 |
| 22  | t==0 / t==1 short-circuit | **base policy inverse 직접 호출** — bisect 우회 | 양 끝 zoom 에서는 정확한 base 정책 inverse 사용 (LSB 한계 외 불일치 없음). 0 < t < 1 만 bisect. | P4 | 2026-05-06 |
| 23  | Dev Demo 구조 | **단일 페이지 + 4 섹션** (`PolicyPicker`, `PlanetLineup1D`, `PolicyCurves`, `RoundTripPanel`) | P1~P4 산출물을 한 화면에서 동시에 확인 가능. 탭 전환 없이 정책 선택 → 라인업/곡선/round-trip 변화를 바로 비교. | P5 | 2026-05-06 |
| 24  | 1D 라이너업 렌더링 | **SVG** | 축 tick, body marker, tooltip, 테이블 동시 제공이 간단. Canvas 대비 e2e/접근성 확인도 쉬움. | P5 | 2026-05-06 |
| 25  | Adaptive zoom demo wiring | **active policy wrapper**: 거리 `selected -> logarithmic`, 크기 `uniform -> selected` 를 `ZoomLevel` 로 보간 | P4 interface 가 실제 UI 변화로 드러나도록 slider 값을 라인업/곡선/round-trip 계산 경로에 직접 연결. Work 9 카메라 wiring 전의 기능 검증용. | P5 | 2026-05-06 |

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

- [x] 거리 정책 break points: **[0.4, 5, 50] AU → [0.4, 1.5, 3.0] scene** ✓ (#10)
- [x] 두 번째/세 번째 정책: **Linear baseline + Logarithmic** ✓ (#11)
- [x] 대수 정책 `r0`: **1 AU** ✓ (#12)
- [x] Round-trip 톨러런스 정책별 적용: **30 AU 까지 1mm 절대, 그 너머 1e-14 relative** ✓ (#13)
- [x] positionToScene 알고리즘: **방향 보존 + 0 벡터 가드** ✓ (#14)

### P3에서 결정

- [x] 추가 정책: **Uniform baseline + MinMaxClamp** ✓ (#15)
- [x] 대수 확대 `r0` / `k` / base: **r0=Earth, k=0.5, base=0.005**, 공식 `base + k*log10(1 + r/r0)` ✓ (#16)
- [x] MinMax clamp [min, max] / r 범위: **[0.005, 5] scene unit** + log10 normalize from [Pluto, Sun] ✓ (#17)
- [x] Round-trip 검증 범위: **카탈로그 11 entries 1mm 이내** ✓ (#18)

### P4에서 결정

- [x] 줌 레벨 단위: **log10(AU)** + `ZOOM_INNER=-0.4` / `ZOOM_OUTER=1.7` ✓ (#19)
- [x] 정책 lerp 함수: **smoothstep (cubic Hermite)** ✓ (#20)
- [x] adaptive inverse 방식: **binary search**, bracket tol = 1µm ✓ (#21)
- [x] t==0/t==1 short-circuit: **base policy inverse 직접 호출** ✓ (#22)

### P5에서 결정

- [x] Dev Demo 구조: **단일 페이지 + 4 섹션** ✓ (#23)
- [x] 1D 라이너업 렌더링: **SVG** ✓ (#24)
- [x] 정책 곡선 렌더링 옵션: **SVG active curve, x=AU log scale / y=scene linear** ✓ (#25)

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

### P2 — Distance Scale Functions _(완료 2026-05-06)_

생성/수정 파일:

- [`src/scale/distancePolicies.ts`](../../src/scale/distancePolicies.ts) — `LinearAuPolicy` (baseline), `PiecewiseMonotonicPolicy` (3-break), `LogarithmicPolicy` (`log(1 + r/AU)`). `DISTANCE_POLICIES` 레지스트리 + `getDistancePolicy(name)`. `PIECEWISE_INPUT_BREAKS_AU = [0.4, 5, 50]`, `PIECEWISE_OUTPUT_BREAKS_SCENE = [0.4, 1.5, 3.0]`, `LOGARITHMIC_R0_M = AU`.
- [`src/scale/position.ts`](../../src/scale/position.ts) — `positionToScene(pos, policy)` (방향 보존 + 0 벡터 가드), `sceneToPosition(sceneVec, policy)`.
- [`src/scale/index.ts`](../../src/scale/index.ts) — `distancePolicies` / `position` re-export 추가.
- [`tools/python/src/orbitarium_tools/scaling.py`](../../tools/python/src/orbitarium_tools/scaling.py) — Python 미러 (`DistancePolicy` dataclass + 3 정책 + `generate_distance_fixtures(out_dir)`).
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `fixtures --work=4` 분기 추가.
- [`package.json`](../../package.json) — `pnpm fixtures:work-04` 스크립트 추가.

테스트 + fixture:

- [`tests/fixtures/work-04/distance-policies.json`](../../tests/fixtures/work-04/distance-policies.json) — 3 정책 × 14 sample 거리 (0.001~100 AU). `_tolerance_m = 1e-3`. Prettier 정렬.
- [`tests/unit/scale/distancePolicies.test.ts`](../../tests/unit/scale/distancePolicies.test.ts) — 14 tests: Linear bit-exact round-trip, Piecewise break points + 단조성 + 1mm round-trip, Logarithmic ln(2) at 1AU + 30AU 1mm + 1000AU relative, registry, fixture cross-check.
- [`tests/unit/scale/position.test.ts`](../../tests/unit/scale/position.test.ts) — 5 tests: zero vector, 단일 축 변환, round-trip 1mm, 방향 보존 cosine 1.0.
- [`tools/python/tests/test_scaling.py`](../../tools/python/tests/test_scaling.py) — 11 tests (Python 미러 검증).

검증 결과:

- `pnpm format:check` ✓ (Prettier auto-format 후)
- `pnpm lint` ✓ — 초기 simple-import-sort 2건 + no-unnecessary-type-assertion 3건 → autofix.
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **362 tests** (P1 342 → P2 +20).
- `pnpm build` ✓ — 1113 kB.
- `cd tools/python && uv run ruff check / mypy / pytest` ✓ — 99 tests.
- `pnpm fixtures:work-04` ✓ — idempotent 확인 (git diff 빈 결과).

설계 결정 + 발견:

- **IEEE 754 LSB floor at 30 AU**: 처음 1mm round-trip 테스트가 50/100/1000 AU 에서 실패 (4mm @ 1000 AU). 4.5e12 m × 2^-52 ≈ 1mm 가 LSB. 30 AU 절대 1mm + 그 너머 relative 1e-14 두 채널로 분리.
- **`positionToScene` 방향 보존**: `pos × (sScene / rMeters)` — 정책이 magnitude 만 변환, 방향 유지. cosine similarity 1.0 검증으로 보장. `r=0` (Sun at SSB ≈ 0) 케이스는 [0,0,0] 반환.
- **Python `zip(strict=True)`**: PEP 618 (3.10+) 활용. break point 배열 길이 mismatch 시 즉시 실패.
- **PiecewiseMonotonic 마지막 segment 너머 처리**: 50 AU 너머는 마지막 segment slope (`(3.0-1.5)/(50-5)`) 로 선형 연장 — 단조성 유지, smooth (C¹ 불연속 허용).
- **Brand 타입 `as number` 불필요**: `Meters = number & {...}` 는 산술 시 자동으로 number 로 평가됨. ESLint `no-unnecessary-type-assertion` 룰이 정확.

### P3 — Body Size Scale Functions _(완료 2026-05-06)_

생성/수정 파일:

- [`src/scale/sizePolicies.ts`](../../src/scale/sizePolicies.ts) — `UniformPolicy` (k=1, r/AU), `LogarithmicMagnificationPolicy` (`base + k*log10(1 + r/r0)`, r0=Earth, k=0.5, base=0.005), `MinMaxClampPolicy` (log10 normalize [Pluto, Sun] → [0.005, 5]). `SIZE_POLICIES` 레지스트리 + `getSizePolicy(name)`. `radiusToScene` / `sceneToRadius` 헬퍼.
- [`src/scale/index.ts`](../../src/scale/index.ts) — `sizePolicies` re-export 추가.
- [`tools/python/src/orbitarium_tools/scaling.py`](../../tools/python/src/orbitarium_tools/scaling.py) — `SizePolicy` dataclass + 3 정책 + `generate_size_fixtures(out_dir)` + `get_size_policy`.
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `fixtures --work=4` 분기에 size 추가.

테스트 + fixture:

- [`tests/fixtures/work-04/size-policies.json`](../../tests/fixtures/work-04/size-policies.json) — 3 정책 × 11 body radii. `_tolerance_m = 1e-3`.
- [`tests/unit/scale/sizePolicies.test.ts`](../../tests/unit/scale/sizePolicies.test.ts) — 14 tests: Uniform bit-exact / LogMag Earth ground truth + 양수 + 단조 + round-trip / MinMax 끝점 정확 + round-trip + 단조 / registry / radiusToScene/sceneToRadius helpers / fixture cross-check.
- [`tools/python/tests/test_scaling.py`](../../tools/python/tests/test_scaling.py) — 추가 4 tests (registry, Uniform bit-exact, LogMag round-trip, MinMax 끝점).

검증 결과:

- `pnpm format:check` ✓
- `pnpm lint` ✓ — 초기 simple-import-sort 1건 → autofix.
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **376 tests** (P2 362 → P3 +14).
- `pnpm build` ✓
- `cd tools/python && uv run ruff check / mypy / pytest` ✓ — 103 tests (P2 99 → P3 +4).

설계 결정 + 발견:

- **`log(r/r0)` → `log(1 + r/r0)` 시프트**: 단순 log 는 r<r0 (Pluto, Mercury) 에서 음수 → 시각화 불가. log(1+x) 시프트로 r≥0 모두 양수 보장. inverse: `r0 * (10^((s-base)/k) - 1)`.
- **MinMax clamp 가 strict normalize**: 입력이 [r_min, r_max] 범위 내라고 가정 (clamp 함수 자체는 정의역 외 입력에 대해 외삽). 위성/소행성 추가 시 r_min/r_max 갱신 필요 — Work 6 진입 시.
- **mypy `[no-any-return]`**: `10.0 ** ...` 의 결과를 mypy 가 `Any` 로 추론 → `float()` 캐스트로 강제. TS 쪽은 `**` 연산자가 number 자동 추론 → 캐스트 불필요.
- **Sun radius (7e8 m) 의 round-trip**: log/exp LSB ~1µm → 1mm 마진 충분. 가장 큰 천체에서도 안전.
- **default k=0.5 의 시각적 결과**: Sun ~ 1.025, Earth ~ 0.156, Pluto ~ 0.042 scene. 이 값은 라이너업에서 거리 [0.4, 3] scene 와 비교 시 약간 큼 — Work 9 카메라 줌 시 탄력적 조정 (P4 adaptive interface 가 이를 받침).

### P4 — Adaptive Scale Interface _(완료 2026-05-06)_

생성/수정 파일:

- [`src/scale/adaptive.ts`](../../src/scale/adaptive.ts) — `ZoomLevel` brand (`log10AU`), `ZOOM_INNER = -0.4` / `ZOOM_OUTER = 1.7`, `AdaptiveDistancePolicy` / `AdaptiveSizePolicy` interface, `smoothstep(edge0, edge1, x)` (cubic Hermite, edge0==edge1 fallback to step), `lerpDistancePolicy(p0, p1, zoom0, zoom1, name?)` / `lerpSizePolicy(...)`, internal `bisectInverse(forward, target, lo, hi)` (value tol 1e-15, bracket tol 1µm, max 200 iter).
- [`src/scale/index.ts`](../../src/scale/index.ts) — `adaptive` re-export 추가.

테스트:

- [`tests/unit/scale/adaptive.test.ts`](../../tests/unit/scale/adaptive.test.ts) — 19 tests: smoothstep ground truth + edge cases, ZOOM constants, lerpDistancePolicy at zoom edges (delegate base) + intermediate (bisect) round-trip 1mm, monotonic across zoom, named policy, 두 lerp 페어 (Linear↔Log, Piecewise↔Log), lerpSizePolicy (Uniform↔LogMag, Uniform↔MinMaxClamp), zoom invariants (beyond/below edges).

검증 결과:

- `pnpm format:check` ✓ (Prettier auto-format on adaptive.ts after first run)
- `pnpm lint` ✓
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **395 tests** (P3 376 → P4 +19).
- `pnpm build` ✓

설계 결정 + 발견:

- **bisect tolerance trap**: 첫 구현은 value tol 1e-12 만 사용 → lerp slope ~0.5 일 때 1e-12 scene = 2e-12 AU = 0.3 m input 오차 → 1mm round-trip 톨러런스 fail. bracket tol 1µm 추가로 input precision 보장.
- **smoothstep 도함수 0 at edges**: cubic Hermite `t²(3-2t)` 는 t=0/t=1 에서 도함수 0 → 줌 전환이 부드러움. linear 는 도함수 불연속. 양 끝점에서 base 정책 일치 보장.
- **t==0/t==1 short-circuit**: 양 끝 zoom 에서 bisect 우회하고 base policy inverse 직접 호출 — IEEE 754 LSB 외 추가 흔들림 없음. 30 AU LSB issue 는 base policy 자체의 한계 (P2 기록).
- **bracket invariant**: lerp 가 monotonic 합성이라 두 base inverse 가 항상 정답을 bracket — bisect 안전. 확인: forward(lo) < target < forward(hi) (혹은 반대) 자동 보장.
- **Work 9 인터페이스 호환**: `ZoomLevel = log10(AU)` 가 카메라 거리 wiring 시 자연스러움 — 카메라 위치 |r| (m) → log10(r/AU) → ZoomLevel.

### P5 — Dev Demo `/dev/scale`

생성/수정 파일:

- [`src/dev/scale/ScaleDemo.tsx`](../../src/dev/scale/ScaleDemo.tsx) — Work 4 dev page shell. 정책 picker 상태, DE440 web evaluator, P4 adaptive active policy wrapper 연결. 거리 active policy 는 `selected -> logarithmic`, 크기 active policy 는 `uniform -> selected` 를 현재 `ZoomLevel` 로 보간.
- [`src/dev/scale/PolicyPicker.tsx`](../../src/dev/scale/PolicyPicker.tsx) — 거리/크기 정책 radio + `log10(AU)` adaptive zoom slider.
- [`src/dev/scale/PlanetLineup1D.tsx`](../../src/dev/scale/PlanetLineup1D.tsx) — 현재 시각 DE440 10-body SSB 거리 → active distance policy/size policy 적용. SVG 1D 라인업 + scene/AU axis ticks + 테이블.
- [`src/dev/scale/PolicyCurves.tsx`](../../src/dev/scale/PolicyCurves.tsx) — active distance policy 곡선 SVG (AU log x-axis, scene y-axis).
- [`src/dev/scale/RoundTripPanel.tsx`](../../src/dev/scale/RoundTripPanel.tsx) — 임의 AU 입력의 forward/inverse/diff sanity.
- [`src/dev/scale/scale.css`](../../src/dev/scale/scale.css) — Work 4 dev page controls/SVG 스타일.
- [`src/dev/registry.ts`](../../src/dev/registry.ts) — Work 4 entry `Component: lazy(() => import('./scale/ScaleDemo'))` 연결.
- [`src/dev/dev.css`](../../src/dev/dev.css) — `scale.css` import 추가.

테스트:

- [`tests/e2e/dev-scale.spec.ts`](../../tests/e2e/dev-scale.spec.ts) — 5 specs: 페이지/4패널 렌더, round-trip diff, zoom slider가 readout+forward 값 갱신, DE440 data 있을 때 10-body lineup, distance policy 변경 시 curve label 갱신.
- [`tests/e2e/dev-index.spec.ts`](../../tests/e2e/dev-index.spec.ts) — Work 4 카드 available 전환 기대값 갱신 (available 3 / placeholder 8).

검증 결과:

- `pnpm format:check` ✓
- `pnpm typecheck` ✓
- `pnpm lint` ✓
- `pnpm test` ✓ — **395 tests**
- `pnpm build` ✓
- `pnpm test:e2e` ✓ — **21 tests** (P5 targeted: 5 tests)

설계 결정 + 발견:

- **zoom slider 실제 wiring**: 초기 구현은 readout 만 바뀌고 라인업 계산에는 영향이 없었다. P5 마감에서 active policy wrapper 를 추가해 라인업/곡선/round-trip 모두 zoom 변화에 반응하도록 연결.
- **라이너업 축**: SVG 하단에 scene tick + active inverse 로 계산한 AU tick 을 함께 표시. 실제 수치는 table 에도 유지.
- **DE440 data fallback**: manifest 로드 실패 시 기존 Work 3 web loader 패턴처럼 에러를 표시하고 evaluator 의존 UI는 비운다. e2e 의 lineup spec 은 manifest 존재 시 실행.

### P6 — Cross-validation & Golden Fixtures (Closeout)

_미시작_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 즉시 액션: P6 — Cross-validation & Golden Fixtures (Closeout) 진입

1. [plan §3 P6](work-04-scale.md#phase-6--cross-validation--golden-fixtures-closeout) 의 fixture/doc closeout 항목 확인.
2. `tests/fixtures/work-04/README.md` 와 `docs/architecture/scale-conventions.md` 작성.
3. `pnpm fixtures:work-04` 로 distance/size fixture 재생성 경로 검증. adaptive fixture 는 P6에서 추가 여부 결정.
4. 전체 검증: `pnpm format:check / lint / typecheck / test / build / test:e2e`, Python `ruff / mypy / pytest`.

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
  Work 4 entry slug: 'scale' (P5에서 available 전환 완료)

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
| 2026-05-06 | **P2 완료** — `src/scale/{distancePolicies,position}.ts` + Python 미러 + `tests/fixtures/work-04/distance-policies.json` + `pnpm fixtures:work-04` + CLI Work 4 분기. 결정 5건 (#10~#14): break points [0.4, 5, 50] AU → [0.4, 1.5, 3.0] scene / Linear baseline + Logarithmic / r0=1AU / 30 AU 까지 1mm 절대 round-trip + relative 1e-14 / 방향 보존 + 0 벡터 가드. 단위 테스트 20건 추가 (TS 19 + Python 7). 모든 정책 monotonic + cosine 1.0 + fixture cross-check 그린. format/lint/typecheck/test(362)/build/ruff/mypy/pytest(99) 그린. |
| 2026-05-06 | **P3 완료** — `src/scale/sizePolicies.ts` + Python 미러 + `tests/fixtures/work-04/size-policies.json` (3 정책 × 11 bodies). 결정 4건 (#15~#18): Uniform baseline + MinMaxClamp / LogMag 공식 base + k*log10(1+r/r0) (r0=Earth, k=0.5, base=0.005) / MinMaxClamp [0.005, 5] scene log10 normalize / 카탈로그 11 entries 1mm round-trip. 단위 테스트 18건 추가 (TS 14 + Python 4). format/lint/typecheck/test(376)/build/ruff/mypy/pytest(103) 그린. |
| 2026-05-06 | **P4 완료** — `src/scale/adaptive.ts`: `ZoomLevel` (log10 AU) brand, `ZOOM_INNER = -0.4 / ZOOM_OUTER = 1.7`, smoothstep cubic Hermite, `lerpDistancePolicy / lerpSizePolicy` 두 base 정책 줌 보간, t=0/t=1 short-circuit + 0<t<1 binary-search inverse (value tol 1e-15, bracket tol 1µm). 결정 4건 (#19~#22) 채택. 단위 테스트 19건 추가 (총 395). bisect bracket tol 트랩 발견 (value-only tol 시 lerp slope 0.5 → input 0.3 m 오차) → bracket tol 추가로 해결. format/lint/typecheck/test/build 그린. |
| 2026-05-06 | **P5 완료** — `/dev/scale` 단일 페이지 dev demo. `src/dev/scale/{ScaleDemo,PolicyPicker,PlanetLineup1D,PolicyCurves,RoundTripPanel}.tsx` + `scale.css`, registry/dev.css 연결. 정책 picker + adaptive zoom slider, DE440 현재 시각 10-body SVG lineup/table, active distance curve, round-trip sanity 구현. 결정 3건 (#23~#25) 채택. e2e 5건 추가/갱신, dev index Work 4 available 전환. format/lint/typecheck/test(395)/build/e2e(21) 그린. |

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
