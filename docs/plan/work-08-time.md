# Work 8 — Time Control System (Plan)

> 진행 상태는 [`work-08-time-handoff.md`](work-08-time-handoff.md).

## 0. 한눈에

| 항목 | 값 |
| --- | --- |
| 목표 | UTC 현재 / 임의 시각 / 재생 (real-time → 백만 년/초) 모드를 단일 `SimulationClock` 로 모든 컴포넌트 (body / orbit / camera) 와 동기. |
| Phase 수 | 5 (Strategy → Clock → Presets → Dev Demo → Closeout) |
| 선행 Work | Work 2 (time API) · Work 6 (BodyDefinition) · Work 7 (sampleOrbit) |
| 후속 Work | Work 9 (camera 가 같은 jdTdb 동기) · Work 10 (UI scrubber) · Work 11 (smooth 보간) |
| 핵심 산출물 | `src/time/` (SimulationClock React Context + reducer) + Python `orbitarium_tools.events` (천문 이벤트 reference) + `/dev/time` + `time-conventions.md` |

## 1. Definition of Done

- [ ] `SimulationClock` Context — `{ jdTdb, isPlaying, rate, mode }` + actions (`play`, `pause`, `setJdTdb`, `setRate`, `tick(dtMs)`).
- [ ] Real-time mode (rate=1) + acceleration up to 1e6× (≈ 1 million sec/sec).
- [ ] Preset events: J2000 / Voyager 1 launch / 2024 total eclipse / current UTC.
- [ ] Body / orbit / camera 가 `useSimulationClock()` 으로 같은 jdTdb 구독.
- [ ] `/dev/time` — scrubber + play/pause + rate slider + presets + dt 그래프.
- [ ] format/lint/typecheck/test/build + e2e + Python ruff/mypy/pytest 그린.

## 2. Phase 정의

### P1 — Clock Types & Strategy
- `src/time/types.ts` — `ClockState`, `ClockMode = 'paused' | 'realtime' | 'fast'`, `ClockAction`.
- `src/time/constants.ts` — `MIN_RATE = 1e-3`, `MAX_RATE = 1e6`, `DEFAULT_RATE = 1`.
- Python placeholder.

### P2 — SimulationClock Context + Reducer
- `src/time/clock.ts` — reducer `(state, action) → state`.
- `src/time/SimulationClockProvider.tsx` — Context + `useSimulationClock` hook + `useClockTick` (R3F `useFrame` 안에서 dt 누적 → tick).
- 단위 테스트 (reducer pure logic).

### P3 — Presets + Python events
- `src/time/presets.ts` — `TIME_PRESETS = [{ label, jdTdb }, ...]`.
- Python `orbitarium_tools.events` — 알려진 천문 이벤트 (J2000, eclipses, planet conjunctions) reference table + `generate_fixtures`.

### P4 — Dev Demo `/dev/time`
- 4 panel (Mode / Rate / Presets / dt 그래프) + body picker + Earth orbit demo (Trail/Predict 가 시간 따라 갱신).

### P5 — Closeout
- `time-conventions.md` + fixture + 회귀 가드.

## 3. 권장값

| 항목 | 권장 |
| --- | --- |
| Clock state 모델 | React Context + reducer |
| jdTdb 형식 | `JdTdb` brand (Work 2) |
| Rate 범위 | [1e-3, 1e6] |
| Tick 단위 | dt in real ms × rate → jdTdb delta in days |
| Preset format | `{ label, utcIso, jdTdb }` |
| Fixture 형식 | JSON |
