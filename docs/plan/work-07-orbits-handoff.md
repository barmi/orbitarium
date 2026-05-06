# Work 7 — Handoff (Orbits & Trajectories)

> Plan: [`work-07-orbits.md`](work-07-orbits.md)

## 0. 현재 상태

| 항목 | 값 |
| --- | --- |
| 현재 phase | **P3 완료** ✓ — P4 시작 대기 |
| 다음 액션 | P4 — `src/orbits/AsteroidBelt.tsx` + Python `generate_asteroid_belt` |
| 마지막 갱신 | 2026-05-06 |
| 블로커 | 없음 |

## 1. 진행 체크리스트

- [x] P1 — Orbit Strategy & Types _(완료 2026-05-06)_
- [x] P2 — Orbit Sampling _(완료 2026-05-06)_
- [x] P3 — Trail & Predict Components _(완료 2026-05-06)_
- [ ] P4 — Asteroid Belt 인스턴싱
- [ ] P5 — Dev Demo `/dev/orbits`
- [ ] P6 — Closeout

## 2. 결정 로그

| # | 항목 | 결정 | Phase | 결정일 |
| --- | --- | --- | --- | --- |
| 1 | OrbitPolyline 메모리 모델 | **`Float64Array` typed (positionsM + jdTdbs)** | P1 | 2026-05-06 |
| 2 | 샘플 분포 | **uniform in jdTdb** | P1 | 2026-05-06 |
| 3 | Trail / Predict default duration | **각 365 days, 256 samples** | P1 | 2026-05-06 |
| 4 | AsteroidBelt default count | **256 instances** | P1 | 2026-05-06 |
| 5 | tolerance | **round-trip 1 mm + 폴리라인 reconstruction 100 m** | P1 | 2026-05-06 |
| 6 | Sampler 구현 | **`Promise.all` parallel batch** for `count` evaluator calls | P2 | 2026-05-06 |
| 7 | count == 1 처리 | **single sample at jdStart, no division** (NaN guard) | P2 | 2026-05-06 |
| 8 | Endpoint 포함 | **inclusive (jdStart 가 인덱스 0, jdEnd 가 마지막)** | P2 | 2026-05-06 |
| 9 | Keplerian 알고리즘 | **Vallado RV2COE simplified** (sma / ecc / inc / raan / argp / mean anomaly) | P2 | 2026-05-06 |
| 10 | Sun GM | **`GM_SUN = 1.32712440018e20 m³/s²`** (IAU 2015) | P2 | 2026-05-06 |
| 11 | Trail material | **`LineBasicMaterial` transparent + opacity 0.85 + depthWrite false** | P3 | 2026-05-06 |
| 12 | Predict material | **`LineDashedMaterial` opacity 0.5 + dashSize 0.05 + computeLineDistances** | P3 | 2026-05-06 |
| 13 | OrbitLine 컴포넌트 | **단일 `OrbitLine` + `variant: 'trail' \| 'predict'`** prop (Trail/Predict 코드 통합) | P3 | 2026-05-06 |
| 14 | 위치 변환 경로 | **`positionICRF` → `applyAnchor` → `positionToScene` → `sceneToVector3`** (Work 4/5 표준) | P3 | 2026-05-06 |

## 3. 미결정 (요약)

P1: typed array vs object, 샘플 분포, default durations · P2: evaluator 직접 의존, async batching · P3: dashed predict · P4: 합성 seed, count, geometry · P5: 4 panel structure · P6: JSON fixture, 수동 갱신.

## 4. 산출물 인덱스

### P1 — Strategy & Types _(완료 2026-05-06)_

- `src/orbits/{types,constants,index}.ts` — `OrbitSample`, `OrbitPolyline` (Float64Array typed), `TrailConfig` / `PredictConfig`, `DEFAULT_TRAIL_DAYS`, etc.
- `tools/python/src/orbitarium_tools/orbits.py` — Python mirror dataclasses + 동일 상수.
- `tests/unit/orbits/types.test.ts` (6 tests) + `tools/python/tests/test_orbits.py` (4 tests).
- 검증: format/lint/typecheck/test(559)/build/ruff/mypy(15)/pytest(177) 그린.

### P2 — Orbit Sampling _(완료 2026-05-06)_

- `src/orbits/sampler.ts` — `sampleOrbit(evaluator, naifId, jdStart, jdEnd, count)` Promise.all parallel batch + count==1 가드 + count<1 throw.
- `tools/python/.../orbits.py` — `KeplerianElements` dataclass + `extract_keplerian` (Vallado RV2COE) + `GM_SUN_M3_PER_S2`.
- tests: TS 5 + Python 3. 564 / 180 그린.

### P3 — Trail & Predict _(완료 2026-05-06)_

- `src/orbits/material.ts` — `createTrailMaterial` (LineBasicMaterial transparent) + `createPredictMaterial` (LineDashedMaterial).
- `src/orbits/Trail.tsx` — `<OrbitLine polyline + distancePolicy + anchor + variant>` 단일 컴포넌트. Variant 가 trail / predict 분기. Work 5 `applyAnchor → positionToScene → sceneToVector3` 표준 경로.
- `src/orbits/index.ts` re-export.
- tests/unit/orbits/material.test.ts (3 tests). 567 그린.

### P4~P6 _(대기)_

## 5. 다음 작업자에게

P1 시작 시:
1. Work 6 [`bodies-conventions.md`](../architecture/bodies-conventions.md) §12 체크리스트 확인.
2. plan §3 P1 + §5 권장값 검토 → 결정 로그 #1~ 기록.
3. `src/orbits/{types,constants,index}.ts` + Python `orbits.py` placeholder + `tests/unit/orbits/types.test.ts`.

## 6. 알려진 이슈

- DE440 호출 async batching 패턴: Promise.all + 적절한 chunking.
- `THREE.Line` width 1px 제약 — Work 11 `Line2` 검토.
- AsteroidBelt 합성 데이터는 MPC 와 무관 — dev demo 한정.

## 7. 갱신 이력

| 날짜 | 변경 |
| --- | --- |
| 2026-05-06 | 초기 작성 — P0 kickoff. 6 phase 구조 확정. |
| 2026-05-06 | **P1 완료** — types/constants + Python mirror + 10 tests. 결정 5건 (#1~#5). 559 / 177 그린. |
| 2026-05-06 | **P2 완료** — `sampleOrbit` Promise.all batch + Python `extract_keplerian` (Vallado RV2COE) + `GM_SUN`. 결정 5건 (#6~#10). TS 5 + Python 3 (564 / 180). |
| 2026-05-06 | **P3 완료** — Trail/Predict material + 단일 `OrbitLine` 컴포넌트 (variant prop). Work 5 anchor/scene 변환 경로 활용. 결정 4건 (#11~#14). TS 3 (567). |
