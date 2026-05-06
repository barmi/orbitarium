# Work 9 — Camera & Navigation (Plan)

> Handoff: [`work-09-camera-handoff.md`](work-09-camera-handoff.md)

## 0. 한눈에

| 항목 | 값 |
| --- | --- |
| 목표 | free-fly / focus / follow / pov 4 카메라 모드 + cinematic 트랜지션 + preset views. |
| Phase 수 | 4 (Strategy → Modes → Presets+Transition → Dev Demo + Closeout) |
| 선행 Work | Work 5 (renderer/anchor) · Work 6 (BodyDefinition) · Work 8 (SimulationClock) |
| 후속 Work | Work 10 (UI buttons) · Work 11 (smooth easing) |
| 핵심 산출물 | `src/camera/` (mode reducer + preset views + transition curves) + `/dev/camera` + `camera-conventions.md` |

## 1. Definition of Done

- [ ] `CameraState`: `{ mode, targetNaifId | null, position, lookAt, fov }` + reducer.
- [ ] 4 modes: `free-fly` (사용자 직접 위치), `focus` (target 주위 orbit), `follow` (target 동행, position offset), `pov` (target 표면).
- [ ] Cinematic transition: 두 CameraState 간 `lerp(t)` (smoothstep + axis interpolation).
- [ ] Preset views: ecliptic top / Sun POV / Earth surface / Voyager 1 시점.
- [ ] `/dev/camera` — 모드/프리셋 버튼 + 트랜지션 곡선 토글 + 카메라 상태 라이브.
- [ ] format/lint/typecheck/test/build + e2e + Python ruff/mypy/pytest 그린.

## 2. 권장값

| 항목 | 권장 |
| --- | --- |
| State 모델 | reducer + Context |
| Transition curve | smoothstep cubic Hermite (Work 4 #20 일관) |
| Transition duration default | 1500 ms |
| Preset 형식 | `{ id, label, mode, targetNaifId?, position, lookAt, fov }` |
| Position 단위 | scene unit (Work 5 sceneToVector3 결과) |

## 3. Phase

- P1: types + reducer + presets (정적).
- P2: transition curves (smoothstep + Vector3 lerp + quaternion slerp helper).
- P3: Dev demo + closeout.
