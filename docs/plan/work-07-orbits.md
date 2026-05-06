# Work 7 — Orbits & Trajectories (Plan)

> 진행 상태와 결정 사항은 **[work-07-orbits-handoff.md](work-07-orbits-handoff.md)** 에 누적.

---

## 0. 한눈에

| 항목         | 값                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 목표         | DE440 evaluator 를 시간 그리드로 샘플링해 **과거 trail / 미래 predict 폴리라인** 으로 시각화. 소행성대 인스턴싱 미리보기. |
| Phase 수     | 6                                                                                                                               |
| 선행 Work    | Work 3 (DE440 evaluator) · Work 4 (`positionToScene`) · Work 5 (`positionToWorld`/anchor) · Work 6 (BodyDefinition)            |
| 후속 Work    | Work 8 (Time — 시간축 동기화) · Work 9 (Camera — orbit follow) · Work 11 (Polish — Tycho-2 / 인스턴싱 LOD)                     |
| 핵심 산출물  | `src/orbits/` (sampler + Trail + Predict + AsteroidBelt) + Python `orbitarium_tools.orbits` (sampling reference + Keplerian) + `/dev/orbits` + `orbits-conventions.md` |

## 1. Definition of Done

- [ ] **Orbit sampler**: `sampleOrbit(naifId, evaluator, jdStart, jdEnd, count)` → `PositionICRF[]` 그리드.
- [ ] **Trail / Predict 분리**: 같은 sampler 결과를 두 컴포넌트가 각각 사용 (과거 = jdStart→now, 미래 = now→jdEnd).
- [ ] **Polyline 렌더**: `THREE.Line` (또는 `LineSegments`) — Work 5 `positionToWorld` 통과한 좌표.
- [ ] **AsteroidBelt 인스턴싱**: 합성 위치 (정적, 메인 벨트 200~300 entries) `InstancedMesh` 미리보기.
- [ ] **Python reference**: `orbitarium_tools.orbits` — Keplerian elements 추출 + 폴리라인 fixture 생성.
- [ ] **교차 검증**: 5 body × 3 시간 윈도우 fixture 안 1 mm round-trip.
- [ ] **Dev Demo `/dev/orbits`** — body picker + 시간 윈도우 / 샘플 밀도 슬라이더 + trail / predict 토글 + AsteroidBelt 토글.
- [ ] format/lint/typecheck/test/test:e2e/build + Python ruff/mypy/pytest 그린.
- [ ] handoff 모든 phase 체크 + `orbits-conventions.md` 작성.

## 2. 범위 / 비범위

**In scope**: orbit sampling helpers · Trail/Predict polyline R3F 컴포넌트 · AsteroidBelt 합성 인스턴싱 (정적) · Keplerian elements 추출 reference · Dev Demo · fixture · conventions.

**Out of scope**: 실제 IAU 소행성 카탈로그 (수만 entries) → Work 11 / 실제 천문 이벤트 검색 (일식/합/충) → Work 8 / 카메라 follow (orbit 동행) → Work 9 / animated trail head marker → Work 10 polish / 궤도면 시각화 (orbital plane disc) → Work 11 / 혜성 꼬리 → Work 11.

---

## 3. Phase 정의

각 phase = Goal / Scope / Decisions / Deliverables / Done / Demo.

### P1 — Orbit Strategy & Types
**Goal**: 샘플링 / Trail / Predict 의 데이터 모델 + 카탈로그 entry 의 sampling 정책.

**Scope / Deliverables**
- `src/orbits/types.ts` — `OrbitSample = PositionICRF + JdTdb`, `OrbitPolyline = OrbitSample[]`, `TrailConfig` / `PredictConfig` interface (samplingMode, durationDays, sampleCount).
- `src/orbits/constants.ts` — `DEFAULT_TRAIL_DAYS = 365`, `DEFAULT_PREDICT_DAYS = 365`, `DEFAULT_SAMPLE_COUNT = 256`, `ORBIT_TOL_M = 100`.
- `src/orbits/index.ts` re-exports.
- Python `orbitarium_tools/orbits.py` placeholder + 동일 상수.
- `tests/unit/orbits/types.test.ts`.

**Decisions**
- OrbitPolyline 메모리 모델: **`Float64Array` 위치 + `Float64Array` jdTdb** (3 + 1 = 4 doubles per sample) vs object array — 권장: typed arrays for tree-shake / GC.
- 샘플 분포: **uniform in jdTdb** (시간 균등) vs anomaly-uniform (각도 균등) — 권장 uniform jdTdb (단순 + DE440 직접 호출).
- Trail length default: **365 days** (모든 행성 가시 1년 trail).
- Predict length default: **365 days**.

### P2 — Orbit Sampling
**Goal**: DE440 evaluator 를 시간 그리드로 샘플링 → OrbitPolyline.

**Scope / Deliverables**
- `src/orbits/sampler.ts` — `sampleOrbit(evaluator, naifId, jdStart, jdEnd, count): Promise<OrbitPolyline>`.
- 호출자가 evaluator 를 만들어 전달 (Work 6 P3 #21 패턴 재사용).
- Python `orbits.py` 의 sampler + `extract_keplerian` (sma, ecc, inc, raan, argp, ma).
- `tests/unit/orbits/sampler.test.ts` — synthetic evaluator (circular orbit) + fixture cross-check.
- Python `tests/test_orbits.py` — Keplerian 정확도 (Earth orbit ecc ~0.0167).

**Decisions**
- Evaluator type: **Work 3 `De440Evaluator`** 그대로 의존 (no new abstraction).
- Sampling 비동기: **Promise** (evaluator 가 async).
- Edge case: jdStart == jdEnd → single-sample polyline (no zero-division).

### P3 — Trail & Predict Components
**Goal**: OrbitPolyline → R3F Line mesh.

**Scope / Deliverables**
- `src/orbits/material.ts` — `createOrbitMaterial(color, opacity)` — `LineBasicMaterial` (transparent, depthWrite false).
- `src/orbits/Trail.tsx` — `<Trail bodyDefinition + polyline + distancePolicy + anchor + color>` → `<line>` with computed positions.
- `src/orbits/Predict.tsx` — same as Trail but with dashed material option.
- `src/orbits/index.ts` re-export.
- `tests/unit/orbits/Trail.test.tsx` (smoke).

**Decisions**
- Trail 색: **body fallback color 그대로** (선택자가 override 가능).
- Predict 시각 구분: **dashed line + opacity 0.5** vs solid 다른 색 — 권장 dashed.

### P4 — Asteroid Belt 인스턴싱 미리보기
**Goal**: 합성 메인 벨트 (200~300 instances) `InstancedMesh` 로 시각화.

**Scope / Deliverables**
- `src/orbits/AsteroidBelt.tsx` — synthetic belt: `count` instances, semi-major axis ∈ [2.2, 3.3] AU + ecc ∈ [0, 0.2] + inc ∈ [-15°, +15°].
- `THREE.InstancedMesh` + small `IcosahedronGeometry` (radius 0.005 scene units).
- 호출자가 `distancePolicy + anchor` 전달 → 인스턴스 매트릭스 계산.
- Python `orbits.py` 의 `generate_asteroid_belt(count, seed)` — deterministic 합성 카탈로그.
- `tests/unit/orbits/asteroidBelt.test.tsx` (instance count + bounds).

**Decisions**
- Belt 데이터 출처: **합성 (deterministic seeded RNG)** vs 실제 IAU MPC 카탈로그 — 권장 합성 (Work 11 에서 MPC 통합).
- Default count: **256** (모바일 기준 60fps 안정).
- Geometry: **`IcosahedronGeometry`** (8-sided 작은 입체).

### P5 — Dev Demo `/dev/orbits`
**Goal**: body picker + 시간 윈도우 / 샘플 밀도 / Trail / Predict / Belt 토글.

**Scope / Deliverables**
- `src/dev/orbits/OrbitsDemo.tsx` 등 — 4 패널 + Canvas (BodyScene 패턴 재사용).
- registry.ts + dev.css + `tests/e2e/dev-orbits.spec.ts` + dev-index 갱신.

### P6 — Cross-validation & Closeout
- `pnpm fixtures:work-07` (Keplerian 5 body × 3 윈도우).
- `tests/fixtures/work-07/README.md`.
- `docs/architecture/orbits-conventions.md`.
- 회귀 가드: 의도적 sampler tweak → fail → 원복.

---

## 4. Phase 의존: P1 → P2 → P3 → P4 → P5 → P6 (linear)

## 5. 권장값 (요약)

| 항목 | 권장 |
| --- | --- |
| Trail / Predict default duration | 365 days |
| Sample count default | 256 |
| OrbitPolyline 모델 | Float64Array typed |
| 샘플 분포 | uniform in jdTdb |
| Trail material | LineBasicMaterial transparent |
| Predict 시각 구분 | dashed line + opacity |
| AsteroidBelt 출처 | 합성 (deterministic seed) |
| AsteroidBelt count | 256 |
| Fixture 형식 | JSON |
| Texture / asset | 없음 (모두 line / instanced primitive) |

## 6. 위험 / 메모

- DE440 evaluator 호출이 async — 256 샘플 × 9 행성 = 2304 calls. 1 ms/call → 2.3 s. 캐싱 (evaluator 자체) + Promise.all 로 batch.
- `THREE.Line` 의 width 지원 한계 (일부 GPU 1px 만) — Work 11 에서 `Line2` (LineMaterial) 검토.
- AsteroidBelt 합성 데이터는 MPC 와 다름 — dev demo 한정.
