# Orbits Conventions

> Work 7 (`src/orbits/`, `orbitarium_tools.orbits`) 정책 요약. Work 8+ 진입 시 우선 검토.
> 출처: [`work-07-orbits.md`](../plan/work-07-orbits.md) · [`work-07-orbits-handoff.md`](../plan/work-07-orbits-handoff.md).

## 1. 책임 경계

- **Truth input**: `De440Evaluator` (Work 3) + `naifId` (Work 2) + `JdTdb` 시작/끝.
- **Intermediate**: `OrbitPolyline` (`Float64Array` 위치 + `Float64Array` jdTdb).
- **Display output**: `THREE.Line` (Work 5 `applyAnchor → positionToScene → sceneToVector3` 표준 변환).
- 모든 R3F 컴포넌트 (Trail / Predict / AsteroidBelt) 는 evaluator / scaling / anchor 를 prop 으로 받는다 — 직접 의존 없음.

## 2. Sampling

```ts
import { sampleOrbit } from '@/orbits'

const polyline = await sampleOrbit(evaluator, naifId, jdStart, jdEnd, count)
```

- `Promise.all` parallel batch — 256 샘플 × 1 ms/call ≈ 256 ms (실제 evaluator 캐시로 더 빠름).
- `count == 1` → single sample at `jdStart` (NaN 가드).
- `count < 1` → throw.
- Endpoint inclusive: 인덱스 0 = `jdStart`, 마지막 = `jdEnd`.

## 3. Trail / Predict 컴포넌트

```tsx
<OrbitLine
  polyline={trail}
  distancePolicy={distancePolicy}
  anchor={anchor}
  variant="trail" // 또는 "predict"
/>
```

- `variant === 'trail'` → `LineBasicMaterial` opacity 0.85.
- `variant === 'predict'` → `LineDashedMaterial` opacity 0.5 + dashSize 0.05 + `computeLineDistances`.
- 위치 변환: `positionICRF → applyAnchor → positionToScene → sceneToVector3` (Work 5 표준).
- material 옵션 (`color`, `opacity`) 호출자가 override 가능.

## 4. Asteroid Belt

```tsx
<AsteroidBelt distancePolicy={distancePolicy} anchor={anchor} count={256} seed={1} />
```

- 합성 (Mulberry32 PRNG, deterministic). Python `generate_asteroid_belt` 와 같은 알고리즘 → fixture 비교 가능.
- 분포: `sma ∈ [2.2, 3.3] AU`, `ecc ∈ [0, 0.2]`, `inc ∈ [-15°, +15°]`.
- 단순화: RAAN / argp 생략 — 시각용.
- 실제 IAU MPC 카탈로그 통합은 Work 11 polish.

## 5. Keplerian Elements

```python
from orbitarium_tools.orbits import extract_keplerian, GM_SUN_M3_PER_S2

elements = extract_keplerian(position_m, velocity_m_per_s)
```

- 알고리즘: Vallado "Fundamentals of Astrodynamics" RV2COE simplified.
- 반환: `sma_m` / `ecc` / `inc_rad` / `raan_rad` / `argp_rad` / `mean_anomaly_rad`.
- 검증: circular / inclined / Earth-like elliptical 케이스 (rel 1e-6).
- GM_SUN: 1.32712440018e20 m³/s² (IAU 2015).

## 6. Tolerance Policy

| 도메인                              | 톨러런스 |
| ----------------------------------- | -------- |
| Round-trip 위치                     | 1 mm     |
| 폴리라인 reconstruction             | 100 m    |
| Keplerian elements (rel)            | 1e-6     |
| Belt position bit-exact (TS↔Python) | 1e-12 AU |

## 7. Work 8+ 진입 체크리스트

- [ ] `OrbitPolyline.positionsM` 은 ICRF / SSB-centered. 변환은 호출자가 `applyAnchor` 후 사용.
- [ ] Trail / Predict 데이터는 같은 `OrbitPolyline` 형태 — 시각만 variant 로 분기.
- [ ] AsteroidBelt 합성은 dev demo 한정. 실 데이터는 Work 11.
- [ ] `sampleOrbit` 호출은 async — Suspense / loading state 필요.
- [ ] 시간 변경 시 polyline 재샘플 (Work 8 time control 와 직접 wiring).

## 8. 디버깅

1. **Trail 이 안 보임**: distancePolicy / anchor 가 올바른지 확인. `positionToScene` 결과가 매우 작거나 (~0) 매우 크면 시각 범위 밖.
2. **Predict 가 trail 과 같은 위치**: 정상 — 행성 공전 주기 ≤ trail+predict 윈도우 시 같은 궤도.
3. **AsteroidBelt 가 다른 PRNG seed 결과**: TS / Python `_mulberry32` 알고리즘 동일성 확인 (테스트가 가드).
4. **Sampler 호출 너무 느림**: count 줄이기 또는 evaluator 캐시 검증.
