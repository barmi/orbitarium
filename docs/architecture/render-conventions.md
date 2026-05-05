# Render Conventions

> Work 5 산출물(`src/render/`, `orbitarium_tools.{starfield,render_anchors}`)의 정책 요약.
> Work 6 (Bodies) / Work 7 (Orbits) / Work 9 (Camera) / Work 11 (Polish) 진입 시 이 문서를
> 먼저 읽고 Truth → Display → world coords 변환 경계를 유지한다.
>
> 출처: [`overview.md`](../plan/overview.md) · [`work-05-render.md`](../plan/work-05-render.md) ·
> [`work-05-render-handoff.md`](../plan/work-05-render-handoff.md) (결정 로그 §2 #1~#44) ·
> Work 4의 [`scale-conventions.md`](scale-conventions.md).

## 1. 책임 경계

Work 5는 truth-frame 위치/반지름을 three.js world coords로 옮기고 별/조명/색관리 파이프라인을 제공한다.

- Truth input: `PositionICRF` (m, ICRF), body radius (m), `JdTdb`.
- Display intermediate: `PositionScene` / `SizeScene` (Work 4 scale 적용 후, scene unit).
- World output: `THREE.Vector3` (1 scene unit = 1 three.js unit, P1 결정 #1).
- 모든 함수는 순수 — 호출자가 evaluator / camera / scene graph 인스턴스를 관리.

## 2. Renderer Pipeline (HDR linear-space)

```ts
import { createRendererProps, RENDER_DEFAULTS } from '@/render'

const props = createRendererProps(RENDER_DEFAULTS, {
  fov: 55,
  near: 0.1,
  far: 1e10,
  position: [4, 3, 7],
})

;<Canvas gl={props.gl} camera={props.camera} dpr={[1, 2]}>
  <pointLight position={[10, 10, 10]} intensity={1.0} decay={0} />
  <ambientLight intensity={0.05} />
  ...
</Canvas>
```

- `outputColorSpace = 'srgb'` + `toneMapping = 'aces-filmic'` + `toneMappingExposure = 1.0`.
- internal lighting / material 계산은 linear color space → ACES → sRGB output. overview §5
  "HDR linear-space rendering" 의도와 정합 (float framebuffer는 Work 11).
- `logarithmicDepthBuffer = true` 가 default. near 1e-3 / far 1e10 의 13 orders span 을
  z-fighting 없이 처리.
- Sun 영역 광원 근사 (overview §5)는 Work 6/11 (PBR 검증 후) 도입 검토 — 본 Work는 PointLight
  `decay = 0` + minimal ambient.
- exposure clamp: `[EXPOSURE_MIN = 0.1, EXPOSURE_MAX = 4.0]`.
- 톤매핑 옵션: `aces-filmic | linear | cineon` (P2 #14).

## 3. Scene Graph Anchors

```ts
import {
  type SceneAnchorContext,
  applyAnchor,
  bodyCentricAnchor,
  heliocentricAnchor,
  positionToWorld,
  ssbAnchor,
} from '@/render'
import { getDistancePolicy } from '@/scale'

const sunSsb = await evaluator.getStateAt(10, jdTdb)
const anchor: SceneAnchorContext = heliocentricAnchor(sunSsb.position)

const earthSsb = await evaluator.getStateAt(399, jdTdb)
const earthWorld = positionToWorld(
  earthSsb.position,
  getDistancePolicy('piecewise-monotonic'),
  anchor,
)
mesh.position.copy(earthWorld)
```

- `SceneAnchorContext = { kind: 'ssb' } | { kind: 'heliocentric'; sunSsb } | { kind: 'body-centric'; bodySsb }`.
- `applyAnchor(p, ctx)`는 m → m 변환 (origin shift만).
- `positionToWorld = applyAnchor → positionToScene → sceneToVector3`. anchor / scale / world의
  세 변환을 합성한 thin layer.
- 호출자가 evaluator → SSB position → anchor context를 만들어 넘김. anchor 모듈 자체는 evaluator
  의존 zero (vitest happy-dom 단위 테스트 친화).

scene anchor 변경 시 모든 mesh의 world coord는 origin shift만큼 이동한다. 카메라 위치는 그대로
두면 시각 jump가 발생한다 — 부드러운 전환은 Work 9 책임.

## 4. World Coords (`world.ts`)

```ts
import { sceneToVector3, sceneScalarToWorld, vector3ToScene, worldScalarToScene } from '@/render'
```

- `sceneToVector3(p: PositionScene)`: scene 3-tuple → `THREE.Vector3` (1:1).
- `vector3ToScene(v)`: 역변환 (UI 표시 / picking).
- `sceneScalarToWorld(s) = s` (1:1 ratio). mesh radius / point size 등 scalar 변환에 사용.
- `SCENE_TO_THREE_UNIT_RATIO = 1` 상수가 단일 진실원. 변경하려면 Work 5 결정 로그 갱신 후
  RENDER_DEFAULTS / fixture 재생성.

## 5. Starfield

```ts
import { createStarfieldMesh, decodeStarfieldBin, loadStarfieldFromUrl } from '@/render'

const data = await loadStarfieldFromUrl('/data/starfield/hipparcos-vmag6.bin')
const mesh = createStarfieldMesh(data, { baseSize: 5, pixelRatio: window.devicePixelRatio })
scene.add(mesh)
```

- 카탈로그: Hipparcos main, `Vmag <= 6.0` (~9 100 → NaN row drop 후 4 992 stars).
- 별 위치: ICRF unit vector × `STARFIELD_SCENE_RADIUS = 1e9` scene unit (단일 celestial sphere).
  parallax 깊이는 Work 9/11 후보.
- 색온도: B-V → Kelvin (Ballesteros 2012) → 256-entry palette index → sRGB DataTexture (GPU가 linearize).
- magnitude → 0..255 bucket (linear in Vmag [-2, 8]) → shader가 size + alpha 계산.
- shader: custom `ShaderMaterial` + additive blending + smoothstep falloff disc.
- frame: ICRF / J2000 (Hipparcos epoch J1991.25에서 PM 적용).

Tycho-2 (~2.5M stars)는 Work 11 perf optimization과 함께 검토.

## 6. Renderer Settings 데이터 흐름

```text
RenderSettings (RENDER_DEFAULTS)
  + camera overrides
   ▼ createRendererProps
{ gl: { antialias, logarithmicDepthBuffer, outputColorSpace, toneMapping, toneMappingExposure },
  camera: { fov, near, far, position } }
   ▼ <Canvas gl={...} camera={...}>
THREE.WebGLRenderer (R3F가 createSetters로 적용)
```

`logarithmicDepthBuffer`는 constructor option이라 toggle 시 Canvas remount 필요 — React `key`
트릭. exposure / tone mapping / camera는 setter 형이라 live update.

## 7. Tolerance Policy

| 비교 대상               | 정책                              | helper              |
| ----------------------- | --------------------------------- | ------------------- |
| anchor roundtrip        | **1 mm absolute**                 | `expectCloseMeters` |
| world Vector3 ↔ scene   | **bit-exact** (1:1 ratio)         | `expect.toBe`       |
| Tanner Helland RGB      | **bit-exact 8-bit sRGB**          | `expect.toEqual`    |
| Ballesteros Kelvin      | **<1 K**                          | `Math.abs` 비교     |
| 명성 RA/Dec post-PM     | **60″** (시각용, 1 mas는 Work 12) | `Math.abs` deg 비교 |
| starfield bin roundtrip | **Float32 round-off (~1e4 m)**    | `Math.abs` 비교     |

Hipparcos PM 적용 정확도는 본 Work에서 60″ 안 (Sirius ~10″, Vega ~3″, Polaris ~30″). 1 mas
정밀도는 Hipparcos epoch / nutation 추가 보정 + Work 12 검증에서 다룬다.

## 8. Fixtures + 재생성

```bash
pnpm fixtures:work-05         # scene-anchors + color-temperature + starfield-samples JSON
pnpm starfield:preprocess     # public/data/starfield/hipparcos-vmag6.bin 재생성
```

생성 파일:

- `tests/fixtures/work-05/scene-anchors.json`
- `tests/fixtures/work-05/color-temperature.json`
- `tests/fixtures/work-05/starfield-samples.json`
- `public/data/starfield/hipparcos-vmag6.bin`

형식 / 갱신 정책은 [`tests/fixtures/work-05/README.md`](../../tests/fixtures/work-05/README.md) +
[`public/data/starfield/README.md`](../../public/data/starfield/README.md).

Python mirror:

```python
from pathlib import Path
from orbitarium_tools.starfield import generate_fixtures, preprocess
from orbitarium_tools.render_anchors import generate_anchor_fixtures

generate_anchor_fixtures(Path("../../tests/fixtures/work-05"))
generate_fixtures(Path("../../tests/fixtures/work-05"))
preprocess(Path("../../public/data/starfield/hipparcos-vmag6.bin"))
```

## 9. Work 6+ 진입 체크리스트

- [ ] `PositionICRF`는 항상 m / ICRF다. frame 변환은 Work 2 `frames`를 먼저 통과한다.
- [ ] mesh 위치는 `positionToWorld(positionIcrf, distancePolicy, anchor)` 결과를 그대로 사용한다.
- [ ] mesh radius는 `radiusToScene(radiusM, sizePolicy)` 후 `sceneScalarToWorld` 결과만 사용한다.
- [ ] anchor 변경 시 카메라 위치 보존 vs 동기화 정책은 Work 9 책임 — 본 Work에서는 단일 anchor만 가정.
- [ ] 렌더 옵션은 `createRendererProps()`로만 만든다 (Home / Dev / Main 모두 동일).
- [ ] log-depth toggle 시 Canvas remount 필요 (constructor option).
- [ ] PBR mesh는 `MeshStandardMaterial` 기본 + Sun PointLight + ambient 0.05. RectAreaLight /
      셰이더 disk-area approximation은 Work 6/11 검토.
- [ ] 새 body radius / 별 카탈로그 추가 시 fixture + handoff 결정 로그를 먼저 갱신.

## 10. 정확도가 안 맞을 때

1. **scene unit ↔ three.js unit**: `SCENE_TO_THREE_UNIT_RATIO`이 1이 아닌 경우, `world.ts`
   adapter를 거치지 않고 직접 곱하면 mismatch.
2. **anchor missing**: heliocentric / body-centric 사용 시 evaluator가 await되지 않으면
   sun/body position이 null → mesh가 SSB 좌표로 보임.
3. **log-depth disabled**: 광범위 scale에서 z-fighting → far plane 줄이기 OR log-depth ON.
4. **tone mapping mismatch**: render-conventions의 'srgb' + 'aces-filmic'을 벗어나면 색이 어색함.
5. **starfield bin schema 변경**: Python `serialize_starfield_bin`과 TS `decodeStarfieldBin`은
   같은 byte layout을 가정. 한 쪽만 바꾸면 magic / version check가 잡아낸다.
6. **명성 위치 60″ 초과**: Hipparcos epoch / RA cos(δ) 보정 / nutation 누락 가능 — Work 12 검증
   대상.
