# Bodies Conventions

> Work 6 산출물(`src/bodies/`, `src/astro/rotationData.ts` 확장,
> `orbitarium_tools.bodies`)의 정책 요약. Work 7 (Orbits) / Work 8 (Time) /
> Work 9 (Camera) / Work 11 (Polish) 진입 시 이 문서를 먼저 읽고 BodyDefinition
> 카탈로그 + IAU rotation 적용 + Sun glow / Saturn rings 사용 패턴을 유지한다.
>
> 출처: [`overview.md`](../plan/overview.md) · [`work-06-bodies.md`](../plan/work-06-bodies.md) ·
> [`work-06-bodies-handoff.md`](../plan/work-06-bodies-handoff.md) (결정 로그 §2 #1~#41) ·
> Work 5 [`render-conventions.md`](render-conventions.md) §9 진입 체크리스트.

## 1. 책임 경계

Work 6 은 단일 천체를 mesh + 텍스처 + IAU 자전 위상으로 표시한다. 구체:

- Truth input: NAIF id (Work 2), `Meters` 반지름 (Work 4), `JdTdb` (Work 2),
  `IAURotationModel` (Work 2 P4 + Work 6 P2 확장).
- Display intermediate: `BodyDefinition` 카탈로그 entry + 텍스처 자산.
- World output: `THREE.Mesh` (Work 5 `positionToWorld` 결과 위치 + Work 4
  `radiusToScene` 결과 반지름 + Work 2/6 `inertialToBodyFixed` 결과 quaternion).
- 모든 컴포넌트는 evaluator / scaling / anchor 를 직접 의존하지 않는다 —
  호출자가 변환 후 prop 으로 넘긴다.

## 2. BodyDefinition 카탈로그

```ts
import { BODY_CATALOG, getBodyByNaifId, getBodyBySlug, type BodyDefinition } from '@/bodies'

const earth = getBodyBySlug('earth')! // BodyDefinition
console.log(earth.naifId, earth.radiusM, earth.rotationModelKey)
```

20 entries:

- 1 Sun (`sun`, NAIF 10)
- 8 planets (`mercury` ... `neptune`, NAIF 199 ... 899)
- 1 dwarf planet (`pluto`, NAIF 999, kind `'pluto-system'`)
- 10 moons: `moon` (301) + Galilean 4 (501-504) + Saturn major 5 (601, 602, 605, 606, 608)

Charon (NAIF 901) 은 Work 6 범위 밖 — Work 2 NAIF_CATALOG 확장 후 Work 11 또는
별도 cleanup task 에서 추가.

각 entry 의 핵심 필드:

| 필드               | 의미                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `naifId`           | NAIF integer id (truth-frame 식별자)                                       |
| `slug`             | URL-safe kebab-case (`/dev/body/<slug>`)                                   |
| `kind`             | `'sun' \| 'planet' \| 'moon' \| 'pluto-system'`                            |
| `radiusM`          | mean equatorial radius (m, IAU WGCCRE 2015)                                |
| `rotationModelKey` | `'sun'` ... `'pluto'` 또는 `'tidally-locked'`                              |
| `textureUrl`       | `/data/textures/<slug>.jpg` 또는 `null`                                    |
| `fallbackColor`    | hex `#rrggbb` (텍스처 부재 시)                                             |
| `rings`            | `RingsConfig` (Saturn 만 non-null)                                         |
| `atmosphere`       | Work 11 hint (Venus / Earth / Mars / 4 가스 거인 / Titan = 8 entries true) |

## 3. IAU Rotation Models

```ts
import { getIauRotationModel, evaluateRotation, inertialToBodyFixed } from '@/astro'

const earthModel = getIauRotationModel('earth')!
const angles = evaluateRotation(earthModel, jdTdb) // { raDeg, decDeg, wDeg }
const matrix = inertialToBodyFixed(earthModel, jdTdb) // row-major 9-element
```

11 polynomial-only 모델 (Work 6 P2). Mercury libration / Moon nutation /
Neptune N term 등 periodic terms 는 source string 에 "Work 11" 명시 후 defer.

`rotationModelKey === 'tidally-locked'` 인 위성 (Mimas / Enceladus / Rhea /
Iapetus) 은 lookup 이 undefined 반환 → Body 컴포넌트가 quaternion 갱신 skip
→ default orientation. Work 11 에서 IAU full 모델 도입 시 자동 활성.

## 4. Mesh Pipeline

```tsx
import { Body, SunMesh, SaturnRings } from '@/bodies'
import { positionToWorld, sceneScalarToWorld } from '@/render'
import { radiusToScene, getDistancePolicy, getSizePolicy } from '@/scale'

const distancePolicy = getDistancePolicy('piecewise-monotonic')
const sizePolicy = getSizePolicy('logarithmic-magnification')
const anchor = ssbAnchor()

const worldPos = positionToWorld(state.position, distancePolicy, anchor)
const worldRadius = sceneScalarToWorld(radiusToScene(body.radiusM, sizePolicy))

return body.kind === 'sun' ? (
  <SunMesh
    body={body}
    jdTdb={jd}
    worldPosition={[worldPos.x, worldPos.y, worldPos.z]}
    worldRadius={worldRadius}
  />
) : (
  <Body
    body={body}
    jdTdb={jd}
    worldPosition={[worldPos.x, worldPos.y, worldPos.z]}
    worldRadius={worldRadius}
  />
)
```

- `Body` 는 generic — texture / IAU rotation / fallback color 모두 처리.
- `SunMesh` 는 Body + additive halo sprite. PointLight 와 같은 위치 (Work 5
  P1 #7) 에서 self-glow.
- `SaturnRings` 는 Body 와 sibling — 같은 quaternion 으로 자전 동기화.

## 5. Materials

```ts
import { createPlanetMaterial, createSunMaterial } from '@/bodies'

const planetMat = createPlanetMaterial(texture, fallbackColor) // MeshStandardMaterial
const sunMat = createSunMaterial(texture, fallbackColor) // MeshBasicMaterial (no lighting)
```

- `MeshStandardMaterial` PBR defaults: `roughness 0.85`, `metalness 0.0`.
- 텍스처 색공간: `tex.colorSpace = SRGBColorSpace` (Work 5 render-conventions §10).
- 텍스처 부재 시 color = fallbackColor; 텍스처 있으면 color = white (passthrough).
- ACES Filmic tone mapping 후 색이 어색하면 dev demo `/dev/render` 에서 picker
  변경 후 비교 (Work 5 P2 #14).

## 6. Rotation Wiring

```ts
import { matrix3ToQuaternion, bodyOrientationQuaternion } from '@/bodies'

const q = bodyOrientationQuaternion(model, jdTdb)
mesh.quaternion.copy(q)
```

- `inertialToBodyFixed(m)` 은 inertial → body 매트릭스 (row-major).
- Three.js mesh.quaternion 은 body → world (mesh local → scene) — 역방향이라
  internally transpose.
- `useEffect([rotationModelKey, jdTdb])` 안에서만 갱신 (`useFrame` 매 호출 X).

## 7. Saturn Rings

```tsx
<SaturnRings
  body={saturn}
  jdTdb={jd}
  innerWorldRadius={(saturn.rings.innerRadiusM / saturn.radiusM) * worldRadius}
  outerWorldRadius={(saturn.rings.outerRadiusM / saturn.radiusM) * worldRadius}
  textureUrl={saturn.rings.textureUrl}
  worldPosition={[worldPos.x, worldPos.y, worldPos.z]}
/>
```

- `RingGeometry(inner, outer, 128, 1)` + radial UV override (inner=0 / outer=1).
- `MeshBasicMaterial` + `transparent` + `alphaMap` + `DoubleSide` + `depthWrite false`.
- Saturn 자전축 정렬: Body 와 같은 `bodyOrientationQuaternion` 적용 (sibling).
- 텍스처 부재 시 단색 disk (`#c0a070` opacity 0.45).
- 그림자 / Saturn 의 ring shadow 는 Work 11 polish.

## 8. Tolerance Policy

| 비교 대상                             | 정책                    | helper                   |
| ------------------------------------- | ----------------------- | ------------------------ |
| TS evaluateRotation ↔ Python (1 mas)  | `TOL_ANGLE_MAS = 1`     | `expectCloseRadians`     |
| TS matrix ↔ Python matrix             | element-wise `< 1e-12`  | `Math.abs` 비교          |
| Python matrix ↔ SPICE polynomial-only | element-wise `< 1e-10`  | machine precision        |
| Body radius ↔ catalog source          | bit-exact (assignment)  | `expect.toBe`            |
| Saturn ring inner < outer / radius    | invariant (단위 테스트) | `expect.toBeGreaterThan` |
| Sub-solar lon ∈ (-180, 180]           | invariant               | range assertion          |
| Sub-solar lat ∈ [-90, 90]             | invariant               | range assertion          |

> **Mercury / Moon / Neptune libration / nutation / N-term** 은 본 Work 미평가.
> Full IAU 모델 vs polynomial-only 의 실제 천문 정확도 차이 (~mas-arcsec) 는
> Work 11 에서 별도 검증.

## 9. Fixtures

```bash
pnpm fixtures:work-06
```

생성 파일 (`tests/fixtures/work-06/`):

- `iau-rotation.json` — 11 models × 5 jdTdb = 55 rows
- `body-catalog.json` — Python BODY_CATALOG dump
- `sub-solar-point.json` — 5 bodies × 5 geometries × 5 jdTdb = 125 rows

형식 / 갱신 정책은 [`tests/fixtures/work-06/README.md`](../../tests/fixtures/work-06/README.md).

## 10. Texture Assets

`public/data/textures/` (Work 6 P1 #5/#7 — Solar System Scope CC4).

- 17 파일 예정 (P3/P4 ~ P6 closeout 에서 점진 추가): `sun.jpg`, 8 planets,
  `moon.jpg`, 4 Galilean, `titan.jpg`, `pluto.jpg`, `saturn-rings.png`, `sun-halo.png`.
- 본 Work 6 commit 시점에는 placeholder README 만 (실제 자산은 별도 task).
- Body 컴포넌트가 404 fallback color 로 정상 동작 — dev demo 가 자산 부재에도 전체 검증 가능.
- 자산 추가 시 README 의 출처 / 라이선스 / 갱신 절차 따름. Total 크기 < 6 MB.

자세한 정책은 [`public/data/textures/README.md`](../../public/data/textures/README.md).

## 11. Dev Demo (`/dev/body/:slug`)

- `src/dev/body/BodyDemo.tsx` — nested `<Routes>` + Earth redirect + `useParams`.
- `src/dev/body/BodyInspector.tsx` — 4 panel (Body / Time / Rotation / Mesh) + Canvas.
- 카메라 fixed (Work 9 orbit controls 도입 전).
- 시간 fixed default `2026-05-06T00:00:00Z` + ±5 년 offset (e2e reproducibility).
- Sub-solar 는 synthetic Sun (-1AU x ICRF) — 실제 위치는 Work 9/Work 11.

## 12. Work 7+ 진입 체크리스트

- [ ] BodyDefinition 의 `naifId` 가 NAIF_CATALOG (Work 2) entry 와 매핑되는지 확인.
- [ ] mesh 위치는 `positionToWorld(positionIcrf, distancePolicy, anchor)` (Work 5).
- [ ] mesh radius 는 `radiusToScene(body.radiusM, sizePolicy)` + `sceneScalarToWorld` (Work 4/5).
- [ ] mesh quaternion 은 `bodyOrientationQuaternion(getIauRotationModel(body.rotationModelKey), jdTdb)` — `'tidally-locked'` 는 undefined (default orientation 유지).
- [ ] Sun 은 `SunMesh` 사용 (PointLight 와 같은 위치).
- [ ] Saturn 의 rings 는 `SaturnRings` sibling (같은 quaternion 적용).
- [ ] 새 body / 위성 추가 시 BODY_CATALOG (TS + Python) + radius source + 텍스처 README 모두 갱신.
- [ ] IAU 모델 변경 시 `pnpm fixtures:work-06` 재생성 + handoff 결정 로그.

## 13. 정확도가 안 맞을 때

1. **Body orientation 이 inverted**: `matrix3ToQuaternion` 의 transpose 가 빠짐 — Work 6 P3 #22 결정 확인.
2. **Texture 가 너무 어둡거나 색 시프트**: `tex.colorSpace = SRGBColorSpace` 누락. Work 5 render-conventions §10.
3. **Saturn rings 가 angular 패턴**: `RingGeometry` 기본 UV 그대로 — radial UV override 누락. Work 6 P4 #29.
4. **Mercury / Moon W angle 이 정확하지 않음**: polynomial-only 모델의 한계 — libration / nutation 은 Work 11.
5. **Charon 이 카탈로그에 없음**: Work 2 NAIF_CATALOG 에 901 추가 후 Work 6 카탈로그 entry 추가 (별도 task).
6. **`tidally-locked` 위성 mesh 가 회전 안 함**: 의도된 동작. Work 11 IAU 모델 도입 시 `BodyDefinition.rotationModelKey` 만 갱신.
