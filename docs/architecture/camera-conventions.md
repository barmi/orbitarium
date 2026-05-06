# Camera Conventions

> Work 9 (`src/camera/`) 정책. Work 10+ 진입 시 우선 검토.

## 1. CameraState 모델

```ts
import { cameraReducer, INITIAL_CAMERA_STATE, lerpCamera, smoothstep } from '@/camera'
```

- `{ mode, targetNaifId, position, lookAt, fov }` reducer.
- 4 modes: `'free-fly' | 'focus' | 'follow' | 'pov'`.
- `setFov` 자동 clamp [10, 120].

## 2. Presets

```ts
import { CAMERA_PRESETS } from '@/camera'
```

4 presets: `ecliptic_top` / `sun_pov` / `earth_focus` / `voyager_1`.

## 3. Cinematic Transition

```ts
const eased = smoothstep(t)
const interp = lerpCamera(from, to, t)
```

- `DEFAULT_TRANSITION_MS = 1500` ms.
- mode + targetNaifId 는 t≥0.5 에서 to 로 snap (discrete).
- position / lookAt / fov 는 smoothstep + linear lerp.

## 4. Work 10+ 진입 체크리스트

- [ ] camera state 는 reducer + Context 또는 zustand store 로 main app 에서 공유.
- [ ] follow mode 의 target position 추적은 useSimulationClock + DE440 evaluator wiring.
- [ ] mouse / touch input → dispatch `setPosition` / `setLookAt` (Work 9 dev demo 는 button 만).
