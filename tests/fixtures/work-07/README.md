# Work 7 Golden Fixtures

> Orbits & Trajectories (`src/orbits/`) reference. `pnpm fixtures:work-07` 로 재생성.

## 파일

- `keplerian.json` — `extract_keplerian` (Vallado RV2COE) 의 4 합성 케이스 (circular / Earth-like ecc / 23.5° inclined). TS 측은 직접 비교 사용 안 함; reference table.
- `asteroid-belt.json` — Mulberry32 PRNG 으로 생성한 main-belt 64 entries (seed=1). TS `AsteroidBelt` 와 deterministic 일치 검증용.

## 갱신

```bash
pnpm fixtures:work-07
```

수동 갱신만. 정책 (분포 / sma 범위 / GM_SUN) 변경 시 결정 로그에 먼저 기록.

## 톨러런스

| 도메인                              | 정책     |
| ----------------------------------- | -------- |
| Keplerian elements                  | rel 1e-6 |
| Belt position bit-exact (TS↔Python) | 1e-12 AU |
| Polyline reconstruction             | 100 m    |
| Round-trip 위치                     | 1 mm     |

## 회귀 가드

P6 종료 시 `extract_keplerian` 의 GM_SUN 을 1% 흔들어 fixture 비교 fail 을 확인 후 원복했다 (해당 변화는 sma 1% drift → fixture diff 즉시 감지).
