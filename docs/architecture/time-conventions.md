# Time Conventions

> Work 8 (`src/time/`, `orbitarium_tools.events`) 정책. Work 9+ 진입 시 우선 검토.

## 1. SimulationClock 모델

```ts
import { SimulationClockProvider, useSimulationClock, ClockTickDriver } from '@/time'

;<SimulationClockProvider initial={{ jdTdb: J2000_JD_TDB }}>
  <Canvas>
    <ClockTickDriver />
    <OrbitsByClock />
  </Canvas>
</SimulationClockProvider>
```

- React Context + `useReducer` 모델. State: `{ jdTdb, mode, rate }`.
- Mode: `'paused' | 'realtime' | 'fast'`. `realtime` = rate 1, `fast` = rate ≠ 1.
- Actions: `play / pause / setJdTdb / setRate / tick(dtMs)`.

## 2. Tick 정책

```ts
deltaDays = (dtMs * rate) / 86_400_000
jdTdb += deltaDays
```

- `ClockTickDriver` 가 R3F `useFrame` 안에서 매 frame `tick({ dtMs })` 디스패치.
- `paused` 모드 또는 `dtMs <= 0` 시 no-op.

## 3. Rate 범위

- `MIN_RATE = 1e-3`, `MAX_RATE = 1e6` (1M sec/sec).
- `setRate` 가 자동 clamp + 모드 switching (rate==1 → realtime, 그 외 → fast).
- UI 에서는 log10 슬라이더 (-3 ~ 6) 권장.

## 4. Presets

```ts
import { TIME_PRESETS } from '@/time'
// id / label / utcIso / jdTdb
```

- J2000 / Voyager 1 launch / 2024-04-08 eclipse / 2026-05-06 demo. Python mirror (`orbitarium_tools.events`) 가 같은 jdTdb 생성.

## 5. Tolerance

| 도메인                     | 톨러런스    |
| -------------------------- | ----------- |
| TS / Python jdTdb (preset) | 1 ms        |
| Tick deltaDays 정확도      | 1e-9 days/s |

## 6. Work 9+ 진입 체크리스트

- [ ] camera modes 가 `useSimulationClock()` 으로 동기화 (orbit follow 시 jdTdb 변화에 카메라 위치 갱신).
- [ ] Body / OrbitLine 도 같은 hook 으로 jdTdb 구독.
- [ ] `ClockTickDriver` 는 Canvas 안에 정확히 한 번만 마운트.
- [ ] preset 추가 시 TS / Python 양쪽 갱신 + fixture 재생성.
