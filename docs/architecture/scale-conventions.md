# Scale Conventions

> Work 4 산출물(`src/scale/`, `orbitarium_tools.scaling`)의 정책 요약.
> Work 5(Render) / Work 6(Bodies) / Work 7(Orbits) / Work 9(Camera) 진입 시 이 문서를 먼저
> 읽고 Truth ↔ Display 변환 경계를 유지한다.
>
> 출처: [`overview.md`](../plan/overview.md) · [`work-04-scale.md`](../plan/work-04-scale.md) ·
> [`work-04-scale-handoff.md`](../plan/work-04-scale-handoff.md) (결정 로그 §2 #1~#29) ·
> Work 2/3의 [`astro-conventions.md`](astro-conventions.md) /
> [`ephemeris-conventions.md`](ephemeris-conventions.md).

## 1. 책임 경계

Work 4는 실제 물리량을 렌더 가능한 scene 좌표로 바꾸는 **순수 변환 레이어**다.

- Truth input: `Meters`, `PositionICRF`, body radius in m.
- Display output: `SceneUnit`, `PositionScene`, `SizeScene`.
- three.js object, mesh, material, camera control은 Work 5+ 책임.
- 정책 함수는 전역 상태를 갖지 않는다. 호출자는 policy object를 명시적으로 넘긴다.

기본 scene 단위는 **1 scene unit = 1 AU display unit**이다. 이것은 물리적으로 1 AU라는 뜻이
아니라, 정책 변환 후 시각 배치에 쓰는 좌표 단위다.

## 2. Brand Types

```ts
import {
  type SceneUnit,
  type PositionScene,
  type SizeScene,
  sceneUnit,
  positionScene,
  sizeScene,
} from '@/scale'
```

- `SceneUnit`: display scalar phantom.
- `PositionScene`: `[SceneUnit, SceneUnit, SceneUnit]`.
- `SizeScene`: `SceneUnit` alias. mesh radius 같은 크기 값에 사용한다.
- 런타임 비용은 0이다. 외부 경계에서만 factory/cast를 사용하고 내부 산술은 number처럼 처리한다.

## 3. Policy Model

```ts
import { type DistancePolicy, type SizePolicy, getDistancePolicy, getSizePolicy } from '@/scale'

const distance = getDistancePolicy('piecewise-monotonic')
const size = getSizePolicy('logarithmic-magnification')
```

정책 interface는 모두 `{ name, forward, inverse, metadata }` 형태다.

```ts
distance.forward(distanceM) // Meters -> SceneUnit
distance.inverse(sceneDistance) // SceneUnit -> Meters
size.forward(radiusM) // Meters -> SizeScene
size.inverse(sceneRadius) // SizeScene -> Meters
```

모든 정책은 forward + inverse를 제공한다. UI hover, picking, camera fitting, validation에서
scene 값을 다시 실제 m 단위로 되돌리는 경로가 필요하기 때문이다.

## 4. Distance Policies

| 이름                  | 목적                       | 핵심 결정                                                  |
| --------------------- | -------------------------- | ---------------------------------------------------------- |
| `linear-au`           | baseline / debugging       | `distance_m / AU`                                          |
| `piecewise-monotonic` | **default**                | `[0.4, 5, 50] AU -> [0.4, 1.5, 3.0] scene`, 이후 선형 연장 |
| `logarithmic`         | 광범위 압축 / adaptive end | `log(1 + r / AU)`                                          |

`piecewise-monotonic`은 내행성은 거의 1:1, 외행성은 강하게 압축한다. break point에서 도함수는
불연속이다. Work 9/11에서 시각적 점프가 문제 되면 C1 Hermite 정책을 새 결정으로 추가한다.

## 5. Size Policies

| 이름                        | 목적                 | 핵심 결정                                          |
| --------------------------- | -------------------- | -------------------------------------------------- |
| `uniform`                   | baseline / debugging | `radius_m / AU`                                    |
| `logarithmic-magnification` | **default**          | `base + k * log10(1 + r / EarthRadius)`, `k = 0.5` |
| `minmax-clamp`              | catalog visibility   | Pluto..Sun radius log range -> `[0.005, 5]` scene  |

반지름 데이터는 Sun + 8 planets + Moon + Pluto, 총 11 entries:

```ts
import { BODY_MEAN_EQUATORIAL_RADIUS_M, SCALE_BODY_NAIF_IDS } from '@/scale'
```

출처는 IAU WGCCRE 2015 / NAIF `pck00011`의 평균 적도 반지름이다. Work 6에서 위성/소행성 body를
추가하면 TS/Python 상수와 fixture를 함께 갱신한다.

## 6. Position Conversion

```ts
import { type PositionICRF } from '@/ephemeris'
import { positionToScene, sceneToPosition, getDistancePolicy } from '@/scale'

const policy = getDistancePolicy('piecewise-monotonic')
const scenePos = positionToScene(positionIcrf, policy)
const truthPos = sceneToPosition(scenePos, policy)
```

`positionToScene`은 magnitude만 정책에 통과시키고 방향은 보존한다:

```text
scene = pos * (policy.forward(|pos|) / |pos|)
```

`|pos| = 0`이면 `[0, 0, 0]`을 반환한다. Sun은 SSB 근처에 있을 수 있으므로 0-vector guard를
삭제하지 않는다.

## 7. Adaptive Scale

```ts
import { lerpDistancePolicy, lerpSizePolicy, zoomLevel, ZOOM_INNER, ZOOM_OUTER } from '@/scale'
```

`ZoomLevel = log10(distance / 1 AU)` brand다.

- `ZOOM_INNER = -0.4`: Mercury-class inner zoom.
- `ZOOM_OUTER = 1.7`: Pluto-class outer zoom.
- interpolation: smoothstep cubic Hermite.
- inverse: binary search, bracket tolerance 1 um input distance.

P5 dev demo wiring:

- distance: selected distance policy -> `logarithmic`.
- size: `uniform` -> selected size policy.

메인 앱 카메라와 실제 연결은 Work 9 책임이다. Work 9는 camera distance in m 또는 AU를
`log10(distance / AU)`로 바꾼 뒤 `zoomLevel(...)`을 통과시킨다.

## 8. Tolerance Policy

| 비교 대상                | 정책                                             |
| ------------------------ | ------------------------------------------------ |
| distance forward/inverse | 30 AU까지 1mm absolute, 그 너머 `1e-14` relative |
| size forward/inverse     | body catalog 전체 1mm absolute                   |
| scene output vs fixture  | `1e-12` absolute                                 |
| position roundtrip       | 1mm                                              |

거리 30 AU 이상에서는 IEEE 754 double LSB가 1mm 근처다. Pluto-class 거리에서 absolute diff가
1mm를 조금 넘는 것은 알고리즘 오류가 아니라 double precision floor일 수 있다. 외행성 검증은 relative
채널을 함께 본다.

테스트 helper는 [`tests/helpers/expectClose.ts`](../../tests/helpers/expectClose.ts)를 사용한다.

## 9. Fixtures

```bash
pnpm fixtures:work-04
```

생성 파일:

- `tests/fixtures/work-04/distance-policies.json`
- `tests/fixtures/work-04/size-policies.json`

형식/갱신 정책은 [`tests/fixtures/work-04/README.md`](../../tests/fixtures/work-04/README.md)에
정리되어 있다. fixture는 수동 갱신만 허용한다. 정책 변경 시 handoff 결정 로그를 먼저 갱신하고,
fixture diff를 reviewer가 확인한다.

Python mirror:

```python
from pathlib import Path

from orbitarium_tools.scaling import generate_fixtures, get_distance_policy

policy = get_distance_policy("piecewise-monotonic")
scene = policy.forward(5.0 * 149_597_870_700.0)
generate_fixtures(Path("../../tests/fixtures/work-04"))
```

정적 SVG 정책 플롯은 optional `viz` extra 설치 후 생성할 수 있다:

```python
from orbitarium_tools.scaling import generate_plots

generate_plots("tmp/scale-plots")
```

## 10. Work 5+ 진입 체크리스트

- [ ] `PositionICRF`는 항상 m / ICRF다. frame 변환은 Work 2 `frames`를 먼저 통과한다.
- [ ] 렌더 위치는 `positionToScene(pos, distancePolicy)` 결과만 사용한다.
- [ ] mesh radius는 `sizePolicy.forward(radiusM)` 또는 `radiusToScene(radiusM, policy)`로 만든다.
- [ ] scene 값을 실제 거리로 표시할 때는 `policy.inverse(sceneUnit)`을 통과한다.
- [ ] 카메라 fitting은 distance policy와 size policy를 둘 다 고려한다.
- [ ] 새 body radius를 추가하면 TS/Python mirror + fixture + Work 6 catalog를 함께 갱신한다.
- [ ] 정책 변경은 fixture 재생성 전 handoff 결정 로그에 먼저 기록한다.

## 11. 정밀도가 안 맞을 때

1. **AU/m 혼선**: `distancePolicy.forward` 입력은 m다. AU 값을 바로 넣지 않는다.
2. **radius/diameter 혼선**: size policy 입력은 반지름이다. 직경을 넣으면 2배 커진다.
3. **scene inverse 누락**: scene 값을 UI에 실제 AU로 표시할 때는 inverse 후 `/ AU`.
4. **outer distance absolute tolerance**: 30 AU 너머는 absolute 1mm 대신 relative floor를 같이 본다.
5. **Python fixture 미재생성**: 정책 변경 후 `pnpm fixtures:work-04`를 잊으면 TS fixture test가 fail해야 정상이다.
