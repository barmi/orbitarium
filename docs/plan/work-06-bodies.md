# Work 6 — Celestial Bodies (Plan)

> 진행 상태와 결정 사항은 **[work-06-bodies-handoff.md](work-06-bodies-handoff.md)** 에 누적.
> 본 문서는 phase 정의/Done 기준의 정적 참조용.

---

## 0. 한눈에 (At a Glance)

| 항목         | 값                                                                                                                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 목표         | 태양 + 9 행성 + 주요 위성 (Moon, Galilean 4, Saturn 주요 5, Pluto+Charon) + 토성 고리를 PBR mesh + IAU 회전 위상으로 시각화한다. Work 4 size policy + Work 5 anchor + Work 2 rotation 모델을 mesh 단위에서 종합 적용.                |
| Phase 수     | 6                                                                                                                                                                                                                                        |
| 선행 Work    | Work 2 (IAU rotation 모델 + frames), Work 3 (DE440 evaluator), Work 4 (`radiusToScene`/sizePolicy), Work 5 (`positionToWorld`/anchor + renderer pipeline + render-conventions §9 진입 체크리스트)                                       |
| 후속 Work    | Work 7 (Orbits — 본 Work 의 mesh 가 trail / predict 의 시각 anchor), Work 8 (Time — body 자전/공전 동기화 demo), Work 9 (Camera — body focus / follow), Work 11 (Polish — corona / atmospheric scattering / 대기 산란 / 그림자)             |
| 핵심 산출물  | `src/bodies/` 모듈 (BodyDefinition 카탈로그 + Sun glow + planet PBR + rotation wiring + Saturn rings) + `orbitarium_tools.bodies` (rotation 모델 확장 + sub-solar point 계산 + golden fixture) + `/dev/body/<slug>` + `/dev/body/saturn` 인스펙터 + `bodies-conventions.md` |

## 1. 결과 정의 (Definition of Done)

Work 6 마감은 **다음 모두**가 통과해야 한다:

- [ ] **BodyDefinition 카탈로그**: NAIF id + 라벨 + slug + radius + rotation model key + texture URL + ring config 를 포함하는 단일 진실원. ≥ 19 entries (Sun + 9 planets + Moon + Galilean 4 + Saturn major 4 + Pluto + Charon).
- [ ] **IAU rotation 모델 확장**: Work 2 P4 의 Earth-only `EARTH_IAU_ROTATION` 을 ≥ 11 bodies (Sun + 8 planets + Moon + Pluto) 로 확장. Galilean / Saturn major 는 옵션 — 미존재 시 tidally-locked 근사 + 명시 fallback.
- [ ] **Sun 시각화**: 태양 mesh = emissive sphere + additive halo sprite. PointLight (Work 5 P1 #7) 와 동일 위치. PBR 수광 안 함 (`MeshBasicMaterial` 또는 emissive only).
- [ ] **Planet/Moon mesh**: PBR (`MeshStandardMaterial`) + base color texture + IAU 자전 매트릭스 적용. radius = `radiusToScene(radiusM, sizePolicy)`.
- [ ] **Saturn rings**: 별도 disk geometry + 텍스처 + 반투명. Saturn 자전축에 정렬. 그림자 (Work 11) 는 본 Work 범위 밖.
- [ ] **Body 좌표 변환 단일 경로**: 모든 mesh 위치는 `positionToWorld(positionIcrf, distancePolicy, anchor)` (Work 5), 모든 mesh 반지름은 `sceneScalarToWorld(radiusToScene(...))` (Work 4/5).
- [ ] **Rotation wiring**: 각 frame 에서 현재 시각의 IAU 자전 매트릭스 → mesh quaternion. 수치는 mas 정밀도 (Python SPICE reference 와 비교).
- [ ] **Python reference**: `orbitarium_tools.bodies` — BodyDefinition Python mirror + `sub_solar_point(body, jdTdb, sun_position)` + `generate_fixtures(out_dir)`.
- [ ] **교차 검증**: 11 body × 5 시각 = 55 rotation phase samples, mas 안 일치. 5 body × 5 시각 sub-solar lon/lat samples, mas 안 일치.
- [ ] **Dev Demo** `/dev/body/<slug>` — body picker + 시각 슬라이더 + 자전축 시각화 (north pole arrow + spin axis line) + W angle / sub-solar point readout + 텍스처 토글 + wireframe 토글. 카메라는 body-centric anchor 에 자동 정렬.
- [ ] **Saturn 전용 페이지** `/dev/body/saturn` — 위 + rings on/off + ring tilt readout.
- [ ] `pnpm lint` / `format:check` / `typecheck` / `test` / `test:e2e` / `build` 그린.
- [ ] `cd tools/python && uv run ruff check / mypy / pytest` 그린.
- [ ] CI (node / python / e2e) 그린.
- [ ] [handoff 문서](work-06-bodies-handoff.md) 의 모든 phase 체크박스 [x], 결정 로그 누락 없음, 산출물 인덱스 채워짐.

## 2. 범위 / 비범위

**In scope**

- BodyDefinition 카탈로그 + body kind taxonomy (`'sun' | 'planet' | 'moon' | 'pluto-system'`)
- 텍스처 자산 파이프라인 (소스 / 라이선스 / 포맷 / 커밋 정책)
- IAU rotation 모델 확장 (≥ 11 + 옵션 위성)
- Sun glowing mesh (emissive + additive halo)
- 9 planet PBR mesh + base color texture + 자전
- Earth's Moon mesh + Galilean (Io / Europa / Ganymede / Callisto) + Saturn major (Titan + Rhea + Iapetus + Enceladus + Mimas) + Pluto + Charon
- Saturn rings (반투명 disk + 텍스처)
- Body 좌표/회전 wiring (`positionToWorld` + IAU rotation matrix → `Object3D.quaternion`)
- Dev Demo `/dev/body/<slug>` + `/dev/body/saturn`
- Python reference (rotation 확장 + sub-solar point + fixtures)
- `bodies-conventions.md`

**Out of scope** (다른 Work)

- 대기 산란 셰이더 (Earth / Venus / Titan) → Work 11 polish
- Sun corona / CME / 표면 활동 셰이더 → Work 11
- Self-shadow / planet shadow on rings (Saturn) / eclipse → Work 11
- Bump / normal / specular map 추가 → Work 11
- LOD (거리에 따른 mesh 해상도 / 텍스처 해상도) → Work 11
- Galilean / Saturn moon 텍스처 high-res → Work 11
- 소행성 / 혜성 mesh → Work 7 / Work 11
- 궤도 trail / predict 폴리라인 → Work 7
- 카메라 orbit / focus 컨트롤 (마우스 / 터치) → Work 9 (본 Work 의 dev page 는 fixed preset)
- 시간 컨트롤 (재생 / 스크러빙) → Work 8 (본 Work dev page 는 단순 슬라이더)
- 별 점 size 와 body angular size 의 동시 시각 정합 → Work 11

---

## 3. Phase 정의

각 phase 는 **Goal / Scope / Decisions / Deliverables / Done / Demo** 6항목 구조.
각 phase 는 (TS 코드 + Python reference + 단위/통합 테스트) 를 **같은 phase 내에서** 동반 작성.

### Phase 1 — Body Strategy & Catalog Types

**Goal**: Work 6 전체 설계 결정 + BodyDefinition 카탈로그 + 텍스처 자산 정책.

**Scope**

- TS: `src/bodies/types.ts`
  - `BodyKind = 'sun' | 'planet' | 'moon' | 'pluto-system'`
  - `BodyDefinition` interface: NAIF id / label / slug / radius source / rotation model key / texture URL / ring config / atmosphere flag (Work 11 hint)
  - `RingsConfig` (Saturn 만 사용)
  - body 식별 helper (`getBodyBySlug`, `getBodyByNaifId`)
- TS: `src/bodies/catalog.ts`
  - `BODY_CATALOG`: ≥ 19 entries (Sun + 9 planets + Moon + Galilean 4 + Saturn major 4 + Pluto + Charon)
  - radius 는 Work 4 `BODY_MEAN_EQUATORIAL_RADIUS_M` 재사용 + 위성 radius 신규 entries
- TS: `src/bodies/index.ts` re-exports
- Python: `orbitarium_tools/bodies.py` placeholder + Python mirror BodyDefinition
- 텍스처 자산 정책 (`public/data/textures/` 컨벤션 결정)

**Decisions** (P1 에서 확정)

- BodyKind enum vs. string union → **string union** (`'sun' | 'planet' | 'moon' | 'pluto-system'`) — 권장 (Work 5 SceneAnchor 패턴 일관)
- BodyDefinition 식별자: `naifId` (정수) + `slug` (URL/카탈로그용 kebab-case 문자열) — 권장
- radius source: **Work 4 `BODY_MEAN_EQUATORIAL_RADIUS_M` 재사용 + 위성 11 entries 신규 추가** (총 19 entries) — 권장
- 위성 radius 출처: **IAU WGCCRE 2015 평균 적도 반지름** (Work 4 #9 와 동일 출처) — 권장
- 텍스처 소스: **Solar System Scope CC4** (`https://www.solarsystemscope.com/textures/`) — Sun + 8 planets + Moon + Saturn rings 모두 제공 — 권장
- 텍스처 라이선스 / 출처: **CC4 attribution** — `public/data/textures/README.md` 에 license 명시
- 텍스처 포맷 / 해상도: **JPEG 2K (2048×1024 equirectangular)** for primary bodies, **1K** for moons — 권장 (Work 11 에서 KTX2 / Basis 압축 검토)
- 텍스처 커밋 정책: **`public/data/textures/<slug>.jpg` 직접 commit** (~5 MB total) — 권장
- 위성 텍스처 default fallback: **단색 (회색 0.6)** — texture 없으면 fallback (Galilean 외 일부 위성)
- mesh geometry resolution: **`SphereGeometry(radius, 64, 32)` default** — 행성 / 태양은 더 높을 수 있으나 일관성 우선
- BodyDefinition 가 atmospheric flag 노출: **boolean only** — Work 11 (atmospheric scattering) 에서 활용. 본 Work 는 mesh 자체에 atmosphere 효과 없음.
- module 위치: **`src/bodies/`** (domain folder 신설) — 권장

**Deliverables**

```
src/bodies/
  types.ts               # BodyKind, BodyDefinition, RingsConfig, lookup helpers
  catalog.ts             # BODY_CATALOG (≥ 19 entries)
  index.ts               # re-exports

tools/python/src/orbitarium_tools/
  bodies.py              # placeholder + Python mirror BodyDefinition + radius table

public/data/textures/
  README.md              # 출처 / 라이선스 / 갱신 명령
```

+ `tests/unit/bodies/types.test.ts`
+ handoff §2 결정 로그 ~12 항목 채움.

**Done**

- 결정 ~12 항목 채워짐
- 카탈로그 19 entries 가 후속 phase 에서 import 가능
- `pnpm typecheck` 그린

**Demo**: 콘솔에서 `import { BODY_CATALOG, getBodyBySlug } from '@/bodies'` 동작 확인.

---

### Phase 2 — IAU Rotation Models Extension

**Goal**: Work 2 P4 의 Earth-only IAU rotation 모델 데이터를 ≥ 11 bodies 로 확장 + Python SPICE reference 와 mas 단위 비교.

**Scope**

- TS: `src/astro/rotationData.ts` 확장
  - 추가 entries: Sun (`SUN_IAU_ROTATION`) + Mercury / Venus / Mars / Jupiter / Saturn / Uranus / Neptune / Moon / Pluto = 11 total
  - 모델 출처: **IAU WGCCRE 2015 (Archinal et al. 2018)** — Work 2 #9 와 동일 출처 (`pck00011.tpc` 검증).
  - Galilean / Saturn major 는 P4 에서 옵션 (또는 본 Work 범위 밖, P2 마감 시점 결정).
- TS: `src/astro/index.ts` 신규 모델 re-export.
- Python: `orbitarium_tools/rotation.py` 의 `IAU_MODELS` 표 동일 확장 + SPICE PCK ground truth 비교.
- 단위 테스트: 모델 별 W angle 값이 J2000 + 10000d 시점에서 SPICE 와 mas 안 일치.
- Fixture: `tests/fixtures/work-06/iau-rotation.json` (body × jdTdb 그리드 → α / δ / W).

**Decisions** (P2 에서 확정)

- 데이터 출처: **IAU WGCCRE 2015 (Archinal et al. 2018)** — 권장 (Work 2 #9 일관)
- 위성 rotation 데이터 포함 범위:
  - (a) **Earth's Moon + Galilean 4 + Titan = 6 추가 위성** — 권장 (가장 시각적으로 명확한 회전 phase 가짐)
  - (b) Earth's Moon 만
- Saturn major 4 (Rhea / Iapetus / Enceladus / Mimas), Pluto / Charon 의 rotation: **tidally-locked 근사 (W = body's mean motion phase)** — 권장 (full IAU 모델은 Work 11)
- Tolerance: **W angle 1 mas, α / δ 1 mas** at J2000 / J2000 + 10000d / 2026-05-06 / 1900-01-01 / 2100-01-01 = 5 시각.
- TS / Python 데이터 동기화: **TS object literal + Python dataclass 동일 polynomial coefficients** — copy-paste 방지 위해 둘 다 IAU paper 직접 참조.

**Deliverables**

```
src/astro/
  rotationData.ts        # 11+ models

tools/python/src/orbitarium_tools/
  rotation.py            # IAU_MODELS 확장 + sub-solar point P3에서 추가
  cli.py                 # generate_fixtures 에서 work-06 분기 (P6에서 통합)

tests/fixtures/work-06/
  iau-rotation.json      # 11 bodies × 5 jdTdb = 55 rows (P6에서 통합)
```

+ `tests/unit/astro/rotation.test.ts` 확장 — 11 모델 × 5 시각 sanity + fixture cross-check.
+ Python `tests/test_rotation.py` 확장 — SPICE PCK eval과 mas 비교.

**Done**

- ≥ 11 IAU rotation 모델 TS / Python 동일 + SPICE eval 1 mas 안 일치
- Fixture cross-check 그린
- `pnpm test` / `uv run pytest` 그린

**Demo**: P5 dev page 에서 body 선택 시 W / α / δ 라이브 표시.

---

### Phase 3 — Body Mesh Pipeline (Sun + Planets + Earth's Moon)

**Goal**: BodyDefinition → R3F mesh + texture + rotation matrix per frame. Sun + 9 planets + Moon = 11 bodies.

**Scope**

- TS: `src/bodies/material.ts`
  - `createPlanetMaterial(textureUrl)` — `MeshStandardMaterial` + base color texture (`SRGBColorSpace`) + roughness / metalness defaults
  - `createSunMaterial(textureUrl)` — `MeshBasicMaterial` (no lighting) + emissive texture
- TS: `src/bodies/rotation.ts`
  - `rotationMatrixToQuaternion(matrix3, jdTdb)` — Work 2 `inertialToBodyFixed` 결과를 Three.js `Quaternion` 으로 변환
  - `updateBodyRotation(mesh, rotationModel, jdTdb)` 헬퍼
- TS: `src/bodies/Body.tsx` (R3F 컴포넌트)
  - props: `BodyDefinition + jdTdb + distancePolicy + sizePolicy + anchor + sunPosition`
  - `useFrame` 마다 rotation matrix 갱신 (jdTdb 변화 시)
  - 위치는 호출자 (parent) 가 evaluator 결과를 prop 으로 전달 — Body 컴포넌트는 ICRF position 만 받음
- TS: `src/bodies/SunMesh.tsx` — 별도 component (additive halo sprite + emissive sphere)
- 텍스처 자산: `public/data/textures/{sun,mercury,venus,earth,moon,mars,jupiter,saturn,uranus,neptune}.jpg`
- Python: `orbitarium_tools/bodies.py` 에 `sub_solar_point(body_naif, sun_pos_icrf, jdTdb)` 추가
- Fixture: `tests/fixtures/work-06/sub-solar-point.json` (P6 통합)

**Decisions** (P3 에서 확정)

- planet material: **`MeshStandardMaterial` + base color texture + roughness 0.85 + metalness 0.0** — 권장 (PBR 기본). Work 11 에서 normal / bump map 추가.
- Sun material: **`MeshBasicMaterial` + emissive texture (lighting 무시)** + 별도 additive sprite halo (Work 11 에서 corona shader 로 교체) — 권장
- Sun halo: **`SpriteMaterial` + radial gradient texture (1024 px)** — 별도 텍스처 파일 (`sun-halo.png`)
- Body 컴포넌트의 위치 prop 형태: **`PositionICRF` (m) 직접 받음** — Body 가 `positionToWorld` 호출. 호출자는 evaluator 만 책임.
- Rotation matrix → quaternion: **Three.js `Matrix4.makeBasis(x, y, z) → Quaternion.setFromRotationMatrix`** — 권장 (직접 회전 매트릭스 입력 방식)
- Body 컴포넌트의 rotation 갱신 정책: **jdTdb 변화 시에만 quaternion 재계산** (`useEffect` 감지) — 권장 (`useFrame` 마다 호출하면 시간 정지 시에도 재계산하므로 비효율)
- Earth's Moon 의 rotation: **IAU WGCCRE 2015 모델 (P2 결과)** — tidally-locked 이지만 IAU 공식 모델 사용 (libration 포함)
- 텍스처 파일 형식 / 해상도 final: P1 #7 / #8 결정에 따라 JPEG 2K (행성), JPEG 1K (위성)

**Deliverables**

```
src/bodies/
  material.ts            # createPlanetMaterial, createSunMaterial
  rotation.ts            # quaternion update helpers
  Body.tsx               # generic body R3F component
  SunMesh.tsx            # Sun-specific (halo + emissive sphere)

public/data/textures/
  sun.jpg, sun-halo.png, mercury.jpg, venus.jpg, earth.jpg, moon.jpg,
  mars.jpg, jupiter.jpg, saturn.jpg, uranus.jpg, neptune.jpg
```

+ `tests/unit/bodies/Body.test.tsx` (smoke — material / position / rotation 적용 확인)
+ `tests/unit/bodies/rotation.test.ts` (matrix3 → quaternion 정확도)
+ Python `tests/test_bodies.py` (sub-solar point 5 sample)

**Done**

- 11 bodies 가 모두 mesh + texture + rotation 으로 표시 가능 (P5 dev demo 에서 검증)
- TS rotation quaternion 과 Python sub-solar point 가 fixture 와 mas 안 일치
- `pnpm test` / `uv run pytest` 그린

**Demo**: `/dev/body/earth` 에서 Earth mesh + texture + 자전 위상 (W angle 라이브 갱신, sub-solar point 표시).

---

### Phase 4 — Saturn Rings + Major Moons

**Goal**: Saturn rings shader (반투명 disk) + Galilean 4 + Saturn major 4 + Pluto + Charon = 10 추가 bodies.

**Scope**

- TS: `src/bodies/SaturnRings.tsx`
  - `RingGeometry` 또는 custom geometry (inner + outer radius from RingsConfig)
  - 텍스처 (Solar System Scope `saturn-rings.png` — 반지름별 색상)
  - 반투명 (`transparent: true`, `opacity: 1.0`, `alphaMap` 으로 dust gap 처리)
  - Saturn 자전축에 정렬 (Saturn body 의 quaternion 상속 vs. 별도 rotation matrix)
- TS: 위성 entries 처리 — P3 의 `Body.tsx` 재사용. 카탈로그 확장.
- 위성 텍스처 (가능한 경우): Io / Europa / Ganymede / Callisto / Titan — Solar System Scope. 나머지는 fallback color (회색).
- Python: `bodies.py` 에 위성 entries 추가
- Fixture: rotation/sub-solar-point 에 위성 추가

**Decisions** (P4 에서 확정)

- Saturn rings 모델:
  - (a) **`RingGeometry(innerRadius, outerRadius, 128 segments)` + 단일 ring texture** — 권장 (단순)
  - (b) Multi-layer disk (A ring / B ring / C ring 별도 mesh)
- Ring 반투명: **`transparent: true` + `alphaMap` + `depthWrite: false`** — 권장 (셀프 셰도잉 없음, Work 11 이슈)
- Ring 자전 정렬: **Saturn 자전축 (Saturn IAU model 의 Z 축) 에 정렬 + Saturn 자전과 함께 회전** — 권장
- Galilean / Titan rotation: **IAU WGCCRE 2015 모델 (P2 에서 추가) 또는 tidally-locked 근사 (parent 자전 phase 와 동기)** — 권장 IAU 모델
- 나머지 위성 (Rhea / Iapetus / Enceladus / Mimas / Charon) rotation: **tidally-locked 근사** — 권장 (IAU 모델 데이터 부담 회피)
- 위성 텍스처 fallback: **단색 회색 (luminance 0.6)** — 텍스처 없는 위성에 적용
- Pluto-Charon: **각각 별도 BodyDefinition** (Pluto = 999, Charon 추가). Pluto barycenter 좌표 + bodyfix offset 으로 처리.

**Deliverables**

```
src/bodies/
  SaturnRings.tsx        # ring disk
  catalog.ts             # 위성 entries 확장 (총 19+)

public/data/textures/
  saturn-rings.png, io.jpg, europa.jpg, ganymede.jpg, callisto.jpg,
  titan.jpg
  (Rhea / Iapetus / Enceladus / Mimas / Charon — fallback color, no texture)
```

+ `tests/unit/bodies/SaturnRings.test.tsx` (geometry + material smoke)
+ Python: 위성 entries fixture 추가

**Done**

- Saturn rings 표시 (반투명 + Saturn 자전축 정렬)
- ≥ 19 bodies 가 dev demo body picker 에 표시 가능
- `pnpm test` / `uv run pytest` 그린

**Demo**: `/dev/body/saturn` 에서 Saturn + rings + 4 major moons (또는 그 외 fallback color).

---

### Phase 5 — Dev Demo `/dev/body/<slug>` + `/dev/body/saturn`

**Goal**: 단일 body 인스펙터 페이지 + Saturn 전용 페이지.

**Scope**

- React + R3F
- 단일 페이지 + dynamic body slug 라우팅
- 패널 1: **Body picker** (BODY_CATALOG 19 entries dropdown)
- 패널 2: **Time control** (UTC 입력 + slider for ± N years from now)
- 패널 3: **Rotation readout** (W angle / α / δ / sub-solar lon-lat)
- 패널 4: **Mesh controls** (texture toggle / wireframe / axis arrow ON/OFF)
- Canvas: body-centric anchor + body mesh + rotation + 자전축 시각화 (북극 / 남극 화살표)
- 카메라: body radius 의 ~5x 거리에서 적도 근처 fixed (Work 9 에서 orbit 컨트롤 도입)
- 텍스트 패널: 현재 시각의 sub-solar point + ring tilt (Saturn) 등

Saturn 전용 분기:
- `/dev/body/saturn` — 위와 동일하지만 rings on/off 토글 추가, ring tilt readout

**Decisions** (P5 에서 확정)

- 라우팅 패턴: **`/dev/body/:slug`** dynamic route (React Router) — 권장
- 카메라 거리: **body radius × 5 in scene units** — 권장 (PC + 모바일 모두 적당)
- 자전축 시각화: **`<arrowHelper>` 두 개 (북극 / 남극) + 적도 원형 line** — 권장
- 시간 슬라이더 default: **현재 시각 (`new Date()`)** — Work 8 time control 도입 전까지 단순 입력
- Body picker 는 main `/dev/body` 카탈로그 (no slug) → Saturn 만 별도 link

**Deliverables**

```
src/dev/body/
  BodyDemo.tsx           # main wrapper + body slug 처리
  BodyPicker.tsx
  TimeControl.tsx
  RotationReadout.tsx
  MeshControls.tsx
  scene/
    BodyScene.tsx        # mesh + axis + rings (Saturn) + body-centric anchor
  body.css
```

+ `src/dev/registry.ts` Work 6 entry → `Component: lazy(() => import('./body/BodyDemo'))`
+ `src/dev/dev.css` `body.css` import
+ `tests/e2e/dev-body.spec.ts` — 5~7 specs (body 변경 / 시각 변경 / texture toggle / Saturn rings on/off / fps sanity)
+ `tests/e2e/dev-index.spec.ts` Work 6 available 전환 (available 5 / placeholder 6)

**Done**

- `/dev/body/earth`, `/dev/body/saturn`, ... 모두 동작
- Saturn 전용 분기에서 rings 표시
- e2e 그린

**Demo**: `pnpm dev` → `/dev/body/saturn` 에서 Saturn + rings, body picker → Earth 변경 시 mesh 즉시 갱신.

---

### Phase 6 — Cross-validation & Golden Fixtures (Closeout)

**Goal**: rotation + sub-solar point + body catalog 회귀 가드 + Work 7 진입 가이드 정착.

**Scope**

- Python `orbitarium_tools.bodies.generate_fixtures(out_dir)` 통합
  - `iau-rotation.json` (P2 데이터, 11+ bodies × 5 jdTdb)
  - `sub-solar-point.json` (5+ bodies × 5 jdTdb)
  - `body-catalog.json` (BodyDefinition Python mirror dump → TS catalog 와 cross-check)
- CLI: `orbitarium-tools fixtures --work=6 --out=tests/fixtures/work-06/`
- TS `tests/helpers/expectClose.ts` helper 재사용 (`expectCloseRadians` / `TOL_ANGLE_MAS`)
- 회귀 가드: rotation 모델의 polynomial coefficient 의도적으로 1 mas 초과 흔들기 → fail → 원복
- `package.json` script `fixtures:work-06`
- `docs/architecture/bodies-conventions.md`
- `tests/fixtures/work-06/README.md`
- `public/data/textures/README.md` (P1 에서 시작) 마무리

**Decisions** (P6 에서 확정)

- Fixture 형식: **JSON** — 권장 (Work 2~5 일관)
- Fixture 갱신 정책: **수동** (`pnpm fixtures:work-06`)
- Texture license 표기: **CC4 attribution** — README 에 source URL + author + license 명시
- 텍스처 파일 git 정책: **commit** (~5 MB total) — 권장 (CI / reviewer reproducibility)

**Deliverables**

```
tools/python/src/orbitarium_tools/
  cli.py                 # 'fixtures --work=6' 분기 추가
  bodies.py              # generate_fixtures 통합 entry

tests/fixtures/work-06/
  iau-rotation.json
  sub-solar-point.json
  body-catalog.json
  README.md

public/data/textures/
  README.md              # 출처 / 라이선스 / 갱신

docs/architecture/
  bodies-conventions.md  # Work 7+ 진입 가이드
```

+ `package.json` script `fixtures:work-06`

**Done**

- `pnpm fixtures:work-06` 한 번에 모든 fixture 재생성 + Prettier 정렬
- 의도적 1 mas 초과 변경 → `pnpm test` fail 재현 → 원복 후 그린
- 컨벤션 문서가 Work 7 작업자에게 즉시 사용 가능 수준

**Demo**: `pnpm fixtures:work-06` → `git diff tests/fixtures/work-06/` 빈 결과 (이미 최신).

---

## 4. Phase 의존 관계

```
P1 Strategy & Catalog Types
   │
   ▼
P2 IAU Rotation Models Extension
   │
   ▼
P3 Body Mesh Pipeline (Sun + 9 planets + Moon)
   │
   ▼
P4 Saturn Rings + Major Moons
   │
   ▼
P5 Dev Demo
   │
   ▼
P6 Closeout (fixtures + docs)
```

- P2 는 P1 결정 (BodyDefinition 의 `rotationModelKey`) 이후 진행 — IAU 모델 데이터는 카탈로그 entry 에 키로 매핑.
- P3 는 P1 + P2 모두 의존 (BodyDefinition 카탈로그 + rotation 모델).
- P4 는 P3 의 Body 컴포넌트 패턴 재사용.
- P5 는 P1~P4 산출물 종합.
- P6 는 마감 단계.

## 5. 결정 권장값 (Recommendations)

권장값은 **handoff 결정 로그**에 사용자 컨펌 후 기록.

| 항목                                | 권장                                                           | 대안                                  | 결정 phase |
| ----------------------------------- | -------------------------------------------------------------- | ------------------------------------- | ---------- |
| BodyKind 모델                       | **string union** `'sun' \| 'planet' \| 'moon' \| 'pluto-system'` | enum                                  | P1         |
| BodyDefinition 식별자               | **`naifId` + `slug`**                                          | `naifId` 만                           | P1         |
| radius source                       | **Work 4 + 위성 신규 entries**                                 | 신규 단일 source                      | P1         |
| 위성 radius 출처                    | **IAU WGCCRE 2015**                                            | 자체 정의                             | P1         |
| 텍스처 소스                         | **Solar System Scope CC4**                                     | NASA SVS                              | P1         |
| 텍스처 포맷 / 해상도                | **JPEG 2K (행성) / 1K (위성)**                                 | KTX2 / Basis                          | P1         |
| 텍스처 커밋 정책                    | **`public/data/textures/` 직접 commit**                        | gitignore + CDN                       | P1         |
| 위성 텍스처 fallback                | **단색 회색**                                                  | procedural noise                      | P1         |
| mesh resolution                     | **`SphereGeometry(r, 64, 32)`**                                | 32 / 96                               | P1         |
| `src/bodies/` 모듈 위치             | **신설**                                                       | `src/render/bodies/`                  | P1         |
| IAU rotation 데이터 출처            | **WGCCRE 2015 (Archinal et al. 2018)**                         | NAIF pck00011                         | P2         |
| 위성 rotation 포함 범위             | **Earth's Moon + Galilean 4 + Titan = 6**                      | Moon 만                               | P2         |
| 비-Galilean Saturn moon rotation    | **tidally-locked 근사**                                        | full IAU model (Work 11)              | P2         |
| Pluto / Charon rotation             | **tidally-locked**                                             | full IAU                              | P2         |
| Tolerance (W / α / δ)               | **1 mas**                                                      | 1″                                    | P2         |
| planet material                     | **`MeshStandardMaterial` + roughness 0.85**                    | unlit                                 | P3         |
| Sun material                        | **`MeshBasicMaterial` + emissive texture**                     | shader 기반 corona                    | P3         |
| Sun halo                            | **`SpriteMaterial` + radial gradient PNG**                     | shader-based                          | P3         |
| Body 위치 prop                      | **`PositionICRF` (m) 직접**                                    | scene-unit                            | P3         |
| Rotation matrix → quaternion        | **`Matrix4.makeBasis → Quaternion.setFromRotationMatrix`**     | Euler 직접                            | P3         |
| Rotation 갱신 정책                  | **jdTdb 변화 시에만 (`useEffect` 감지)**                       | 매 frame                              | P3         |
| Saturn rings 모델                   | **`RingGeometry` + 단일 텍스처**                               | multi-layer                           | P4         |
| Ring 반투명                         | **`transparent` + `alphaMap` + `depthWrite: false`**           | additive blend                        | P4         |
| Ring 자전 정렬                      | **Saturn 자전축 + 자전과 함께 회전**                           | 별도 rotation                         | P4         |
| 위성 텍스처 (Galilean / Titan)      | **Solar System Scope CC4**                                     | 자체 generated                        | P4         |
| 비텍스처 위성 fallback              | **단색 회색 0.6**                                              | procedural                            | P4         |
| Dev page 라우팅                     | **`/dev/body/:slug` dynamic**                                  | static per-body                       | P5         |
| 카메라 거리                         | **body radius × 5 scene units**                                | × 3 / × 10                            | P5         |
| 자전축 시각화                       | **북극 / 남극 arrow + 적도 line**                              | 북극 only                             | P5         |
| 시간 슬라이더 default               | **현재 시각**                                                  | J2000                                 | P5         |
| Fixture 형식                        | **JSON**                                                       | binary                                | P6         |
| Fixture 갱신 정책                   | **수동** (`pnpm fixtures:work-06`)                             | CI 자동                               | P6         |
| 텍스처 git 정책                     | **commit** (~5 MB)                                             | gitignore                             | P6         |

## 6. 위험 / 메모

- **IAU rotation 모델 데이터 entry 부담**: 11+ bodies × (3 angles × polynomial + periodic terms) → 수백 줄 데이터. SPICE PCK 와 mas 비교로 catch 하지만, 입력 시 typo 위험. P2 에서 모델별 ground-truth 1 case 를 단위 테스트에 직접 포함.
- **텍스처 색공간 / ACES 색 시프트**: Work 5 P2 에서 ACES Filmic + sRGB 결정. PBR 텍스처는 sRGB-encoded → texture loader 가 `colorSpace = SRGBColorSpace` 명시 필요. 어두운 영역에서 ACES 색 시프트가 자연스럽지 않으면 Cineon 옵션 (이미 picker 노출) 으로 비교.
- **Sun PointLight + Sun mesh 동시**: Work 5 P1 #7 의 PointLight 와 본 Work 의 Sun mesh 가 같은 위치. emissive material 은 lighting 무시하므로 self-glow OK. PointLight 는 다른 mesh 를 비추는 역할.
- **Saturn rings 의 self-shadow / planet shadow**: 본 Work 는 단순 transparent disk. Saturn 그림자가 ring 에 떨어지는 효과는 Work 11 (셰이더 또는 light occlusion).
- **`useFrame` 매 프레임 호출 주의**: rotation matrix 계산 (~수 µs) 은 가벼움이지만, jdTdb 변화 시에만 quaternion 재계산이 효율적. P3 #rotation 갱신 정책 결정.
- **R3F / three.js Object3D 회전 적용 순서**: Three.js 는 left-multiplication, IAU `inertialToBodyFixed` 매트릭스는 column-vector convention. 변환 시 transpose 필요할 수 있음 — P3 단위 테스트로 가드.
- **Dev page WebGL 의존**: vitest happy-dom 미지원. Body 컴포넌트 단위 테스트는 material / geometry / rotation 등 pure 로직만. 시각 회귀는 e2e (playwright) 에 위임.
- **텍스처 라이선스 attribution**: Solar System Scope CC4. README 에 정확한 source URL + author + license 명시 의무.
- **Pluto / Charon barycenter 처리**: DE440 의 NAIF id 는 9 (barycenter) / 999 (Pluto body) / 901 (Charon). Charon 의 SSB 좌표는 Pluto barycenter 9 + Charon-from-barycenter offset 으로 계산. P4 에서 Charon entry 추가 시 evaluator wiring 확인.
- **Galilean / Titan IAU 모델 데이터 가용성**: WGCCRE 2015 paper 에서 이들 6 위성 (Moon + Io / Europa / Ganymede / Callisto / Titan) 의 모델은 명시. 나머지 위성은 P2 #5 에 따라 tidally-locked 근사.
- **Body radius (Work 4) vs. mesh polar 반지름**: 평균 적도 반지름만 사용. 극 반지름은 (Earth: 6,356,752 m, Saturn: 54,364,000 m) 차이 ~0.3% (Earth) ~10% (Saturn). 시각 정확도가 필요하면 Work 11 에서 ellipsoid mesh 도입.

---

_Last updated: 2026-05-06_
