# Work 5 — 3D Rendering Foundation (Plan)

> 진행 상태와 결정 사항은 **[work-05-render-handoff.md](work-05-render-handoff.md)** 에 누적.
> 본 문서는 phase 정의/Done 기준의 정적 참조용.

---

## 0. 한눈에 (At a Glance)

| 항목         | 값                                                                                                                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 목표         | 광활한 거리 + 작은 천체를 동시에 다룰 수 있는 three.js 렌더 파이프라인 + scene graph anchor + 실제 항성 starfield 의 기반을 마련한다. Truth(SI) → Display(scene) → three.js world coords 변환의 단일 진실원이 된다.                       |
| Phase 수     | 6                                                                                                                                                                                                                                        |
| 선행 Work    | Work 2 (frames/units brand `Meters`/`Radians`), Work 3 (`PositionICRF`/DE440 evaluator), Work 4 (`PositionScene`/`SizeScene`/distance·size policies)                                                                                     |
| 후속 Work    | Work 6 (Bodies — mesh + 텍스처 + 자전), Work 7 (Orbits — 폴리라인 scene), Work 9 (Camera — adaptive scale wiring + interactive controls), Work 11 (Polish — bloom / LOD / 인스턴싱)                                                       |
| 핵심 산출물  | `src/render/` 모듈 (renderer pipeline + log-depth + scene graph anchor + starfield mesh) + `orbitarium_tools.starfield` (Hipparcos → 브라우저 바이너리 변환) + `/dev/render` 데모 + 골든 fixture (색온도 매핑·anchor 변환·starfield 샘플) + `render-conventions.md` |

## 1. 결과 정의 (Definition of Done)

Work 5 마감은 **다음 모두**가 통과해야 한다:

- [ ] **Renderer pipeline (HDR linear-space)**: overview §5 의 "HDR linear-space 렌더링" 의도대로 internal lighting / material 계산은 **linear color space** 에서 수행 → ACES Filmic tone mapping → sRGB output. exposure control 포함. 옵션이 한 곳에서 정의되고 R3F `<Canvas>`로 통합, Home / Dev 두 라우트가 같은 옵션 객체를 공유. (float framebuffer 사용 여부는 별개 — Work 11 deferred.)
- [ ] **Logarithmic depth buffer**: `logarithmicDepthBuffer: true` + 반경 1과 반경 1e9 sphere 가 같은 frame 에서 z-fighting 없이 보임. log-depth OFF 토글 시 z-fighting 재현 (회귀 가드).
- [ ] **Lighting model**: 태양 PointLight (intensity 결정값) + 최소 ambient. PBR 호환 (`MeshStandardMaterial` 기본). overview §5 가 명시한 **태양 "영역 광원 근사"** 는 P1 에서 본 Work 미도입 / Work 6/11 deferred 로 명시 결정. 환경광 / IBL 도 Work 11.
- [ ] **Scene graph anchor**: `'ssb' | 'heliocentric' | 'body-centric'` 변환 함수 + 단위 테스트. `PositionICRF` (m, ICRF) → `PositionScene` (Work 4) → three.js `Vector3` (anchor 적용) 의 변환 경로가 단일 thin layer (`positionToWorld`).
- [ ] **Starfield**: Hipparcos catalog (Vmag cutoff) → 브라우저용 바이너리 포맷 + `THREE.Points` mesh. 실제 RA/Dec → ICRF unit vector × 큰 반지름 (celestial sphere), B-V → 색온도 (Kelvin) → 256-entry palette index, magnitude → 점 크기 / alpha.
- [ ] **Python reference**: `orbitarium_tools.starfield` — 카탈로그 다운로드 + 필터링 + 색온도 변환 + 바이너리 직렬화. CLI 진입점 + `generate_fixtures(out_dir)`.
- [ ] **교차 검증**: TS vs Python — starfield 바이너리 round-trip (TS decode = Python encode 그대로), 색온도 매핑 ≤ 1 K diff, 샘플 명성 (Sirius / Vega / Polaris 등) 위치 ≤ 1 mas, scene anchor 변환 ≤ 1 mm.
- [ ] **Dev Demo** `/dev/render` — log-depth 토글 + exposure / tone mapping picker + starfield ON/magnitude slider + scene anchor picker. Work 4 evaluator 와 마찬가지로 Work 3 DE440 evaluator 로 현재 시각 sun position 을 받아 Heliocentric anchor 검증.
- [ ] `pnpm lint` / `format:check` / `typecheck` / `test` / `test:e2e` / `build` 그린.
- [ ] `cd tools/python && uv run ruff check / mypy / pytest` 그린.
- [ ] CI (node / python / e2e) 그린.
- [ ] [handoff 문서](work-05-render-handoff.md) 의 모든 phase 체크박스 [x],
      결정 로그 누락 없음, 산출물 인덱스 채워짐.

## 2. 범위 / 비범위

**In scope**

- three.js `WebGLRenderer` 표준 옵션 (output sRGB, ACES Filmic, exposure, linear internal)
- Logarithmic depth buffer 활성 + camera near/far 정책
- 태양 점광원 + 최소 ambient (PBR 호환). Sun mesh 는 Work 6.
- Scene graph anchor 모델 (SSB / Heliocentric / Body-centric) + 변환 헬퍼
- `positionToWorld(positionIcrf, distancePolicy, anchor): THREE.Vector3` thin adapter
- Starfield 데이터 파이프라인 (Python):
  - Hipparcos / Tycho-2 raw 다운로드 + 캐시
  - Vmag cutoff 필터링
  - B-V → 색온도 (Ballesteros 2012) → 256-palette 인덱스
  - 브라우저용 바이너리 포맷 (header + Float32 위치 + Uint8 color idx + Uint8 mag bucket)
- Starfield mesh (TS): `THREE.Points` + custom shader (size by magnitude, color by palette index)
- Dev Demo `/dev/render`
- 골든 fixture (색온도 매핑, anchor 변환, starfield 샘플)
- `docs/architecture/render-conventions.md`

**Out of scope** (다른 Work)

- 행성 PBR 텍스처 / 노멀 / 자전 → Work 6
- 토성 고리, 대기 산란 셰이더 → Work 6
- Sun corona / lens flare → Work 11
- 궤도 폴리라인 → Work 7
- 카메라 인터랙션 (mouse/touch/keyboard) → Work 9. 본 Work 는 fixed/preset camera 만.
- adaptive scale ↔ 카메라 wiring → Work 9
- Bloom / godrays / atmospheric scattering / IBL → Work 11
- LOD, 인스턴싱, 프레임 페이싱, 워커 오프로드 → Work 11
- Time control (재생/스크러빙) → Work 8. 본 Work 는 정적 시각 사용.
- 별이름 라벨 / 별자리 선 → Work 10/11

---

## 3. Phase 정의

각 phase 는 **Goal / Scope / Decisions / Deliverables / Done / Demo** 6항목 구조.
각 phase 는 (TS 코드 + Python reference + 단위/통합 테스트) 를 **같은 phase 내에서** 동반 작성.

### Phase 1 — Render Strategy & Scene Graph Types

**Goal**: Work 5 전체 설계 결정 + 후속 phase 가 import 할 타입/anchor 모델/세팅 객체를 확정.

**Scope**

- TS: `src/render/types.ts`
  - `SceneAnchor = 'ssb' | 'heliocentric' | 'body-centric'`
  - `BodyCentricAnchor` 의 body 식별 (NAIF id) 처리
  - `RenderSettings` interface (color space, tone mapping, exposure, log-depth, camera near/far, ambient intensity, sun intensity)
  - `WorldVector` 타입 alias (THREE.Vector3 wrapping rationale)
- TS: `src/render/constants.ts`
  - `RENDER_DEFAULTS` (P1 결정값) — exposure, near/far, sun intensity, ambient
  - `SCENE_TO_THREE_UNIT_RATIO` (1:1 권장)
- TS: `src/render/anchors.ts` placeholder (P3 에서 구현)
- TS: `src/render/index.ts` — re-exports placeholder
- Python: `orbitarium_tools/starfield.py` placeholder (의미 docstring + 색온도 / 바이너리 포맷 컨벤션 상수)

**Decisions** (P1 에서 확정)

- scene unit ↔ three.js unit 매핑:
  - (a) **1 scene unit = 1 three.js unit** — Work 4 #3 직접 매핑, 가장 단순 — 권장
  - (b) 임의 ratio (예: 1 scene = 0.1 three.js) — 카메라 near/far 와 절충
- 색공간 / 톤매핑:
  - (a) **output `SRGBColorSpace` + ACES Filmic tone mapping + linear internal** — 권장
  - (b) `LinearSRGBColorSpace` output (HDR 파이프라인) → Work 11
- Default tone mapping exposure: **1.0** (slider 0.1 ~ 4.0)
- Logarithmic depth buffer: **enabled by default** — 권장 (z-fighting 없는 광범위 scene)
- Camera near / far: **near = 1e-3, far = 1e10** scene unit (log-depth 활용)
- Scene anchor 모델:
  - (a) **string literal union (`'ssb' | 'heliocentric' | 'body-centric'`)** + body 식별 별도 — 권장
  - (b) discriminated union with body NAIF id payload
- Sun lighting (Work 5 본 Work 도입분):
  - (a) **PointLight at Sun position + minimal AmbientLight (intensity 0.05)** — 권장
  - (b) DirectionalLight (방향만, position 무시) — 대안
- Sun "영역 광원 근사" (overview §5 명시 항목):
  - (a) **본 Work 미도입 — Work 6/11 PBR 검증 후 도입 검토 (e.g. `RectAreaLight` 또는 셰이더 disk-area approximation)** — 권장 (defer)
  - (b) 본 Work 에서 `RectAreaLight` 도입 → BRDF 호환성 (toLightProbe 등) 사전 검증 필요
- Sun intensity 단위: **three.js point light intensity (`PI` 기반 r150+ 컨벤션)** — Work 6 셰이더 검증 시 재조정 가능
- `positionToWorld` 시그니처:
  - (a) **`positionToWorld(p: PositionICRF, policy: DistancePolicy, anchor: SceneAnchorContext): THREE.Vector3`** — anchor context 가 anchor 종류 + 보조 데이터 (sun pos, body pos) 를 캡슐화 — 권장
  - (b) anchor 별 함수 분리 (`positionToWorldSsb`, `positionToWorldHeliocentric`, ...)
- 별 카탈로그 default: **Hipparcos main catalog (118 218 entries)**, Vmag cutoff `≤ 6.0`
- 색온도 변환 공식: **Ballesteros 2012** (`T = 4600 ((1/(0.92*BV+1.7)) + (1/(0.92*BV+0.62)))`)
- 별 거리 처리: **parallax → distance**, 무한 / 음수 parallax 는 unit sphere (1 ly) 로 clip
- 별 데이터 frame: **ICRS** (Hipparcos epoch J1991.25 → J2000 proper motion 적용 후 ICRF unit vector)
- 라이트너 / Tycho-2 보조: **Hipparcos 만 default**, Tycho-2 는 옵션 (Work 11 perf)

**Deliverables**

```
src/render/
  types.ts                     # SceneAnchor, RenderSettings, WorldVector
  constants.ts                 # RENDER_DEFAULTS, SCENE_TO_THREE_UNIT_RATIO
  anchors.ts                   # placeholder (P3)
  starfield.ts                 # placeholder (P4)
  index.ts                     # public re-exports

tools/python/src/orbitarium_tools/
  starfield.py                 # placeholder + 색온도/바이너리 포맷 상수
```

+ `tests/unit/render/types.test.ts` — type-only assertions + RENDER_DEFAULTS 검증
+ handoff §2 결정 로그 ~12 항목 채움.

**Done**

- 결정 ~12 항목 채워짐
- 타입이 후속 phase 에서 그대로 import 가능
- `pnpm typecheck` 그린

**Demo**: 콘솔에서 `import { type SceneAnchor, RENDER_DEFAULTS } from '@/render'` 동작 확인.

---

### Phase 2 — Renderer Pipeline (Color & Tone Mapping)

**Goal**: WebGLRenderer 옵션을 한 곳에 모으고, R3F `<Canvas>` 와 통합. Home / Dev 라우트가 같은 옵션을 사용.

**Scope**

- TS: `src/render/renderer.ts`
  - `createRendererProps(settings: RenderSettings): GLProps` — R3F `<Canvas gl={...}>` 에 직접 전달 가능한 객체
  - 옵션: `outputColorSpace = SRGBColorSpace`, `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure`, `logarithmicDepthBuffer`, `antialias = true`
- TS: `src/render/exposureSlider.tsx` (선택) — exposure 컨트롤 컴포넌트 (Work 4 picker 패턴 따름)
- TS: `src/routes/Home.tsx` 갱신 — `<Canvas>` 옵션을 `createRendererProps(RENDER_DEFAULTS)` 로 교체
- TS: `src/render/HomeScene.tsx` 갱신 — Sun PointLight 모델 적용 (단순 mesh 는 그대로)
- Python: `orbitarium_tools/starfield.py` — 색온도 (Kelvin) → RGB (`color_temp_to_rgb_index`) 함수 미러
  - Ballesteros 2012 + 256-palette precompute (Kelvin range 2000 ~ 30000)

**Decisions** (P2 에서 확정)

- 톤매핑 옵션 (default 외): **ACES Filmic + Linear (없음) + Cineon** 3종 picker — Work 11 에서 추가 옵션 가능
- 색온도 → RGB 변환 정밀도: **8-bit 정수 RGB** (Uint8 인덱스 → 256-palette → 8-bit RGB) — palette 비트 인플레이션 시 Work 11 재검토
- Palette interpolation: **linear in linear-RGB space** — 권장 (gamma 보정 후 변환)
- HDR float buffer: **disabled** (Work 11) — 본 Work 는 LDR + ACES
- `antialias`: **true** (MSAA, GPU 비용 허용 범위)

**Deliverables**

```
src/render/
  renderer.ts                  # createRendererProps + 옵션 정의
  exposureSlider.tsx (선택)    # P5 dev demo 에서 활용

tools/python/src/orbitarium_tools/
  starfield.py                 # color_temp_to_rgb_index + palette precompute
```

+ `tests/unit/render/renderer.test.ts` — `createRendererProps` 옵션 sanity (output sRGB, ACES, exposure clamp [0.1, 4.0])
+ `tools/python/tests/test_starfield.py` — Ballesteros 2012 ground truth (B-V=0 → ~7000K, B-V=1 → ~4500K), palette round-trip
+ Home 라우트가 새 renderer props 와 함께 그대로 동작 (시각적 회귀 없음)

**Done**

- WebGLRenderer 옵션이 한 곳 (`createRendererProps`) 에서 관리됨
- Home / Dev 두 라우트 동일 옵션 공유
- exposure 슬라이더가 Home 에서 동작 가능 (선택, P5 에서 dev page 통합)
- `pnpm test` / `uv run pytest` 그린

**Demo**: Home 페이지에서 sphere 렌더 동일 (visual regression 없음). Python `python -c "from orbitarium_tools.starfield import color_temp_to_rgb_index; print(color_temp_to_rgb_index(5778))"` 동작.

---

### Phase 3 — Log-Depth & Scene Graph Anchors

**Goal**: 광범위 스케일에서 z-fighting 없이 렌더 + scene anchor 변환 함수 확정.

**Scope**

- TS: `src/render/logDepth.ts`
  - `LogDepthDemoScene` (P5 에서 사용) — 반경 1 + 반경 1e9 두 sphere 동시 렌더
  - 또는 헬퍼 함수만 두고 P5 에서 직접 sphere 생성
- TS: `src/render/anchors.ts` (P1 placeholder 채우기)
  - `SceneAnchorContext` discriminated union:
    ```ts
    type SceneAnchorContext =
      | { kind: 'ssb' }
      | { kind: 'heliocentric'; sunSsb: PositionICRF }
      | { kind: 'body-centric'; bodySsb: PositionICRF }
    ```
  - `applyAnchor(positionIcrf: PositionICRF, anchor: SceneAnchorContext): PositionICRF` — pure 변환
  - `positionToWorld(positionIcrf, distancePolicy, anchor): THREE.Vector3` —
    `applyAnchor` → `positionToScene` → `Vector3`
- TS: `src/render/world.ts` (필요 시) — scene unit ↔ THREE.Vector3 thin adapter
  - `sceneToVector3(p: PositionScene): THREE.Vector3`
  - `vector3ToScene(v: THREE.Vector3): PositionScene`
- Python: `orbitarium_tools/starfield.py` 에 `apply_scene_anchor(position_icrf_m, anchor_kind, sun_ssb_m=None, body_ssb_m=None)` 미러
  - 또는 별도 `orbitarium_tools/render_anchors.py` 모듈 생성 — P1 결정

**Decisions** (P3 에서 확정)

- log-depth 활성 시 camera near / far: P1 결정 (`1e-3 / 1e10`) 그대로 — 검증
- Body-centric anchor 의 body 표현: **`PositionICRF` (m)** 직접 — body NAIF id 는 호출자 책임
- `SceneAnchorContext` 모듈 위치: **`src/render/anchors.ts`** — P1 결정 #anchor model 따름
- Python anchor 미러 위치: **`orbitarium_tools/render_anchors.py` 신설** — `starfield.py` 와 책임 분리 (권장) 또는 `starfield.py` 안에 함께
- DE440 evaluator 와 anchor wiring: **호출자 책임** — anchor 함수 자체는 PositionICRF 만 받음, evaluator 호출은 Dev Demo / 메인 앱에서

**Deliverables**

```
src/render/
  anchors.ts                   # SceneAnchorContext, applyAnchor, positionToWorld
  world.ts                     # sceneToVector3 / vector3ToScene
  logDepth.ts (선택)           # 데모 헬퍼

tools/python/src/orbitarium_tools/
  render_anchors.py (또는 starfield.py 내) # apply_scene_anchor + generate_anchor_fixtures
```

+ `tests/unit/render/anchors.test.ts` — anchor 변환 1 mm round-trip, SSB 기준 sun heliocentric ≈ 0
+ `tests/unit/render/world.test.ts` — Vector3 round-trip
+ `tests/fixtures/work-05/scene-anchors.json` — anchor × 샘플 위치 grid

**Done**

- 반경 1 / 반경 1e9 sphere 가 같은 frame z-fighting 없이 렌더 가능 (육안 + 자동 픽셀 비교 e2e — 선택)
- 세 anchor 변환이 1 mm round-trip 일치
- TS vs Python anchor fixture 1 mm 안 일치
- `pnpm test` / `uv run pytest` 그린

**Demo**: `/dev/render` (P5) log-depth 토글 시 z-fighting 발생/해소, anchor picker 시 sphere 위치 변경.

---

### Phase 4 — Starfield Data Pipeline + Mesh

**Goal**: Hipparcos catalog → 브라우저 바이너리 → three.js Points mesh 의 end-to-end pipeline.

**Scope**

- Python: `orbitarium_tools/starfield.py`
  - `download_hipparcos(out_dir, force=False)` — astroquery / VizieR 사용, 캐시 관리
  - `filter_by_magnitude(catalog, vmag_cutoff=6.0)`
  - `apply_proper_motion(catalog, target_epoch_jd)` — Hipparcos epoch J1991.25 → J2000
  - `radec_to_unit_vector(ra_rad, dec_rad)` → ICRF unit vector
  - `parallax_to_distance(parallax_mas, default_distance_ly=1.0)` — invalid → default
  - `serialize_starfield_bin(stars, out_path)` — header + Float32 위치 (unit vector × scene radius) + Uint8 color idx + Uint8 mag bucket
  - `generate_fixtures(out_dir)` — 색온도 매핑 + 샘플 명성 + bin round-trip
  - CLI: `orbitarium-tools starfield preprocess --catalog=hipparcos --vmag=6.0 --out=public/data/starfield/`
- TS: `src/render/starfield.ts`
  - `StarfieldBinHeader` interface (magic, version, count, scene radius, palette size)
  - `decodeStarfieldBin(buffer: ArrayBuffer): StarfieldData` — Float32Array positions + Uint8Array colorIdx + Uint8Array magBucket
  - `createStarfieldPalette(): Uint8Array` — Kelvin → RGB 256-entry palette (TS-side mirror, 검증 후 Python 결과 사용)
  - `createStarfieldMesh(data: StarfieldData, palette: Uint8Array): THREE.Points`
  - shader: custom `ShaderMaterial` (vertex: size by mag bucket, fragment: color by palette index, soft circle alpha)
- TS: `src/render/starfieldLoader.ts` — `loadStarfieldFromUrl(url): Promise<StarfieldData>`
- 데이터 파일: `public/data/starfield/hipparcos-vmag6.bin`
- `package.json` script: `starfield:preprocess`

**Decisions** (P4 에서 확정)

- Star 거리 처리: **모두 단일 celestial sphere 반지름 (`1e9` scene unit, 사실상 무한대) 위에 placement** — parallax-based 깊이는 Work 9/11 에서 검토 (권장)
- `vmag_cutoff` default: **6.0** (~9 100 stars)
- 바이너리 포맷:
  - magic: `"STRF"` (4 bytes), version: `1` (Uint32), count (Uint32), sceneRadius (Float32), paletteSize (Uint16), reserved (2 bytes) = 16 byte header
  - 본문: Float32 [x, y, z] × N + Uint8 [colorIdx] × N + Uint8 [magBucket] × N
  - little-endian 강제
- `magBucket` 분할: **256 buckets, linear in Vmag [-2, 8]** — magnitude → bucket = `clamp((vmag - (-2)) / (8 - (-2)) * 255, 0, 255)`
- Palette: **256 entries, Kelvin range [2000K, 30000K] log-uniform** — 인덱스 → Kelvin 매핑 결정론
- Color → bucket index: **B-V → Kelvin (Ballesteros) → log-uniform palette bucket**
- Shader: **custom ShaderMaterial** with `size = baseSize * (1 - magBucket/255) ^ 2` + soft circle alpha. `THREE.PointsMaterial` 은 색별 인덱스 컨트롤 어려워서 비추천.
- Hipparcos 다운로드 캐시 위치: **`tools/python/.cache/hipparcos/`** (gitignore)
- 메인 카탈로그 만 default: **Tycho-2 는 generate_fixtures 옵션 / 시간 허용 시** (Work 11 perf 검토)

**Deliverables**

```
src/render/
  starfield.ts                 # decode + palette + mesh factory
  starfieldLoader.ts           # fetch wrapper

tools/python/src/orbitarium_tools/
  starfield.py                 # download / filter / serialize + CLI

public/data/starfield/
  hipparcos-vmag6.bin          # gitignore 정책: 작으면 commit, 크면 generate
```

+ `tests/unit/render/starfield.test.ts` — bin decode round-trip (작은 가상 bin), palette mirror sanity, mesh factory smoke
+ `tools/python/tests/test_starfield.py` — Hipparcos sample (Sirius, Vega, Polaris, Betelgeuse) RA/Dec / Vmag / B-V 알려진 값과 일치 (mas 단위), bin round-trip
+ `tests/fixtures/work-05/color-temperature.json` — B-V grid → Kelvin → palette idx
+ `tests/fixtures/work-05/starfield-samples.json` — 명성 5~10개 (NAIF / Hipparcos id, RA/Dec, ICRF unit vector, palette idx)

**Done**

- `pnpm starfield:preprocess` 한 번으로 `public/data/starfield/hipparcos-vmag6.bin` 생성
- TS decode 결과 = Python encode 그대로 (round-trip)
- 색온도 매핑 ≤ 1 K diff
- 샘플 명성 위치 ≤ 1 mas
- `pnpm test` / `uv run pytest` 그린

**Demo**: `/dev/render` (P5) starfield 토글 시 ~9 000 stars 가 별의 색/크기 차이를 보이며 표시.

---

### Phase 5 — Dev Demo `/dev/render`

**Goal**: P2~P4 산출물을 눈으로 즉시 확인할 수 있는 인터랙티브 페이지.

**Scope**

- React 컴포넌트 (R3F `<Canvas>` + 컨트롤 패널)
- 패널 1: **Renderer 컨트롤**
  - exposure 슬라이더 (0.1 ~ 4.0)
  - tone mapping picker (ACES / Linear / Cineon — P2 결정)
  - log-depth ON/OFF 토글
- 패널 2: **Log-depth 검증 scene**
  - 반경 1 sphere + 반경 1e9 sphere (또는 거대 plane) 동시 표시
  - 카메라는 두 sphere 가 모두 보이도록 fixed (preset)
  - log-depth OFF 시 z-fighting 시연
- 패널 3: **Starfield 컨트롤**
  - ON/OFF 토글
  - magnitude slider (Vmag cutoff 0 ~ 8) — 클라이언트에서 decode 후 필터
  - 별 개수 readout
- 패널 4: **Scene anchor 컨트롤**
  - SSB / Heliocentric / Body-centric 라디오
  - Body-centric 시 NAIF body picker (Work 2 catalog, sub-set of 11 Work 4 entries)
  - 현재 시각 (default: 2026-05-06 00:00 UTC) 의 Sun / body position 을 DE440 evaluator 로 받아 anchor 적용
  - 작은 marker sphere 로 anchor 변경 시 위치 이동 시각화
- registry.ts 에서 Work 5 entry 의 `Component` 채움
- 폴리시 무시, 기능 우선

**Decisions** (P5 에서 확정)

- 컴포넌트 구조: **단일 페이지 + 4 섹션** (Work 4 패턴) — 권장
- log-depth 검증 sphere 모델: **2개 동심원 (반경 1 + 반경 1e9) at SSB origin** — 권장
- starfield magnitude 슬라이더 처리: **클라이언트 decode 후 필터** (가벼움) — 권장. 큰 cutoff 변경 시 mesh 재생성.
- DE440 evaluator 호출 정책: Work 4 P5 와 동일 — manifest 로드 실패 시 폴백 메시지
- Canvas 옵션: `createRendererProps(RENDER_DEFAULTS)` — Home 라우트와 동일 옵션 공유

**Deliverables**

```
src/dev/render/
  RenderDemo.tsx
  RendererControls.tsx
  LogDepthScene.tsx
  StarfieldControls.tsx
  AnchorPicker.tsx
  render.css
```

+ `src/dev/registry.ts` Work 5 entry → `Component: lazy(() => import('./render/RenderDemo'))`
+ `src/dev/dev.css` `@import './render/render.css'`
+ `tests/e2e/dev-render.spec.ts` — 5~6 specs (페이지 로드, 4 패널 렌더, log-depth 토글, exposure 슬라이더, starfield 토글, anchor 변경)
+ `tests/e2e/dev-index.spec.ts` Work 5 available 기대값 갱신 (available 4 / placeholder 7)

**Done**

- `/dev/render` 진입 가능, 모든 컨트롤이 즉시 반영
- Hipparcos bin 로드 실패 시 명시적 폴백
- e2e 그린

**Demo**: `pnpm dev` → `/dev/render` 에서 starfield 토글 / anchor 변경 / log-depth 토글 확인.

---

### Phase 6 — Cross-validation & Golden Fixtures (Closeout)

**Goal**: P2~P4 결과의 회귀 가드 + Work 6+ 진입 가이드 정착.

**Scope**

- Python `orbitarium_tools.starfield.generate_fixtures(out_dir)` 통합 (Work 4 P6 패턴)
- Python `orbitarium_tools.render_anchors.generate_fixtures(out_dir)` (또는 통합 `orbitarium_tools.render.generate_fixtures`) — anchor 변환 grid
- 통합 CLI: `orbitarium-tools fixtures --work=5 --out=tests/fixtures/work-05/`
- Fixture 형식 컨벤션 (Work 2/3/4 동일 — JSON, `_` 메타 prefix, Prettier 정렬)
- TS: `tests/helpers/expectClose.ts` 의 helpers 재사용
- 회귀 가드: 의도적으로 Ballesteros 공식 1 K 흔들기 / anchor 변환에 1 cm 더하기 → fail → 원복
- `package.json` script: `fixtures:work-05`, `starfield:preprocess`
- `docs/architecture/render-conventions.md` — renderer pipeline / scene graph / starfield / Work 6+ 진입 패턴
- `tests/fixtures/work-05/README.md` — fixture 구성, 재생성 명령
- `public/data/starfield/README.md` (선택) — bin 포맷 + 재생성 명령

**Decisions** (P6 에서 확정)

- Fixture 형식: **JSON** (Work 2/3/4 와 동일) — 권장
- Fixture 갱신 정책: **수동 (`pnpm fixtures:work-05`)** — 권장
- `hipparcos-vmag6.bin` git 정책:
  - (a) **commit** (작으면, ~150 KB 예상) — 권장
  - (b) gitignore + CI 에서 generate
- Work 6+ 진입 시 import 패턴 docstring 충실히

**Deliverables**

```
tools/python/src/orbitarium_tools/
  cli.py                       # 'fixtures --work=5' 분기 추가
  starfield.py                 # generate_fixtures 통합 entry
  render_anchors.py            # generate_fixtures (또는 starfield.py 내)

tests/fixtures/work-05/
  color-temperature.json       # P4
  starfield-samples.json       # P4
  scene-anchors.json           # P3
  README.md                    # 형식 + 재생성 명령

public/data/starfield/
  hipparcos-vmag6.bin          # P4
  README.md (선택)             # bin 포맷 + 재생성

docs/architecture/
  render-conventions.md        # Work 6+ 진입 가이드
```

+ `package.json` scripts `fixtures:work-05`, `starfield:preprocess`

**Done**

- `pnpm fixtures:work-05` 한 번에 모든 fixture 재생성 + Prettier 정렬
- 의도적 1 mm 초과 / 1 K 초과 변경 → `pnpm test` fail 재현 → 원복 후 그린
- 컨벤션 문서가 Work 6 작업자에게 즉시 사용 가능 수준

**Demo**: `pnpm fixtures:work-05` → `git diff tests/fixtures/work-05/` 빈 결과 (이미 최신).

---

## 4. Phase 의존 관계

```
P1 Strategy & Types
   │
   ├──────────────┐
   ▼              ▼
P2 Renderer    P3 Log-Depth + Anchors
   │              │
   └──────┬───────┘
          ▼
       P4 Starfield (P3 의 anchor + P2 의 색온도/palette)
          │
          ▼
       P5 Dev Demo
          │
          ▼
       P6 Closeout (fixtures + docs)
```

- P2 와 P3 는 P1 이후 부분적으로 병렬 가능 (단순성을 위해 순차 권장).
- P4 는 P2 (palette) + P3 (anchor) 를 모두 의존.
- P5 는 P1~P4 산출물을 모두 사용 → 순차 진행.
- P6 는 마감 단계 — 모든 phase 의 fixture / 문서 통합.

## 5. 결정 권장값 (Recommendations)

권장값은 **handoff 결정 로그**에 사용자 컨펌 후 기록.

| 항목                                | 권장                                                        | 대안                                       | 결정 phase |
| ----------------------------------- | ----------------------------------------------------------- | ------------------------------------------ | ---------- |
| scene unit ↔ three.js unit         | **1:1 매핑**                                                | 임의 ratio                                 | P1         |
| Output color space                  | **`SRGBColorSpace`**                                        | LinearSRGB (HDR)                           | P1         |
| Internal color space                | **Linear**                                                  | Custom                                     | P1         |
| Tone mapping                        | **ACES Filmic**                                             | Linear / Cineon                            | P1         |
| Default exposure                    | **1.0** (slider 0.1 ~ 4.0)                                  | -                                          | P1         |
| Logarithmic depth buffer            | **enabled**                                                 | disabled (Work 11)                         | P1         |
| Camera near / far                   | **1e-3 / 1e10** scene unit                                  | 0.01 / 1e9                                 | P1         |
| Scene anchor 모델                   | **string literal union + context payload**                  | discriminated union                        | P1         |
| Sun lighting                        | **PointLight at Sun + ambient 0.05**                        | DirectionalLight                           | P1         |
| Sun 영역 광원 근사 (overview 명시)  | **본 Work 미도입, Work 6/11 PBR 검증 후 도입 검토 (defer)** | 본 Work 에서 `RectAreaLight` 도입          | P1         |
| `positionToWorld` 시그니처          | **(p, policy, anchor) → Vector3**                           | anchor 별 함수                             | P1         |
| 별 카탈로그                         | **Hipparcos main, Vmag ≤ 6.0**                              | + Tycho-2                                  | P1         |
| 색온도 변환                         | **Ballesteros 2012**                                        | Mamajek 2012                               | P1         |
| 별 거리 처리                        | **단일 celestial sphere (sceneRadius 1e9)**                 | parallax-based                             | P1/P4      |
| 별 frame                            | **ICRF (J2000 + Hipparcos proper motion 적용)**             | ICRS without PM                            | P1         |
| Tone mapping 옵션 set               | **ACES + Linear + Cineon**                                  | + Reinhard                                 | P2         |
| HDR float buffer                    | **disabled** (Work 11)                                      | enabled                                    | P2         |
| `antialias`                         | **true** (MSAA)                                             | FXAA postprocess                           | P2         |
| Palette interpolation               | **linear in linear-RGB**                                    | sRGB                                       | P2         |
| Body-centric anchor body 표현       | **`PositionICRF` (m) 직접**                                 | NAIF id payload                            | P3         |
| Python anchor 미러 위치             | **`render_anchors.py` 신설**                                | `starfield.py` 내                          | P3         |
| 별 거리 처리                        | **모두 단일 celestial sphere**                              | parallax 깊이                              | P4         |
| `vmag_cutoff` default               | **6.0**                                                     | 5.5 / 7.0                                  | P4         |
| 바이너리 포맷                       | **header 16B + Float32 pos + Uint8 colorIdx + Uint8 mag**   | + parallax / ID 추가                       | P4         |
| `magBucket` 범위                    | **256 buckets, Vmag [-2, 8] linear**                        | log                                        | P4         |
| Palette                             | **256 entries, Kelvin [2000, 30000] log-uniform**           | linear                                     | P4         |
| Star shader                         | **custom ShaderMaterial**                                   | `THREE.PointsMaterial`                     | P4         |
| Hipparcos 캐시 위치                 | **`tools/python/.cache/hipparcos/`** (gitignore)            | 시스템 캐시                                | P4         |
| Tycho-2 보조                        | **default disabled** (Work 11)                              | default enabled                            | P4         |
| Dev Demo 구조                       | **단일 페이지 + 4 섹션**                                    | 탭                                         | P5         |
| Magnitude slider 처리               | **클라이언트 decode 후 필터**                               | 서버 재생성                                | P5         |
| Fixture 형식                        | **JSON** (Work 2/3/4 와 동일)                               | binary / Parquet                           | P6         |
| Fixture 갱신 정책                   | **수동** (`pnpm fixtures:work-05`)                          | CI 자동                                    | P6         |
| `hipparcos-vmag6.bin` git 정책      | **commit** (작음)                                           | gitignore                                  | P6         |

## 6. 위험 / 메모

- **"HDR linear-space rendering" 의미 (overview §5)**: internal lighting / material 계산을 linear color space 에서 수행하고 ACES tone mapping 후 sRGB 출력 — PBR 표준 파이프라인. float framebuffer (RGBA16F / RGBA32F) 사용 여부와는 별개 — float buffer 는 Work 11 deferred. 본 Work 의 "HDR" 충족은 linear-space pipeline 만으로 OK.
- **태양 영역 광원 근사 (overview §5) 처리**: overview 가 "태양(점광원 + **영역 광원 근사**)"를 명시했으나, 본 Work 는 P1 결정으로 PointLight 만 도입. RectAreaLight 는 `MeshStandardMaterial` 기본 BRDF 와의 호환성 사전 검증 필요 + 셰이더 disk-area approximation 은 Work 6 PBR / Work 11 polish 와 함께 도입이 자연스러움 — defer 정당화.
- **Tycho-2 deferred 이유 (overview §5)**: overview 는 "Hipparcos / Tycho-2" 모두 명시. Tycho-2 는 ~2.5M stars (Hipparcos 의 ~21배). 본 Work 는 Hipparcos main 만 default, Tycho-2 add-on 은 Work 11 perf optimization (LOD / 인스턴싱) 과 함께 검토.
- **Logarithmic depth buffer GPU 호환성**: WebGL 2 에서 `EXT_frag_depth` 지원 필요. Work 12 cross-browser 검증 시 fallback 정책 결정. 대부분 데스크톱 / 모바일 GPU 지원.
- **R3F `<Canvas>` 옵션 vs vanilla three.js**: r3f gl prop 으로 `WebGLRenderer` 옵션 그대로 전달 가능. 단, 일부 옵션 (logarithmicDepthBuffer 등) 은 renderer 생성 시점에 전달되어야 함 — `gl={{ ... }}` callback prop 사용 권장.
- **ACES tone mapping 의 색 시프트**: ACES 는 어두운 영역에서 약간의 색 시프트가 있음. 행성 텍스처 (Work 6) 가 어색하면 Cineon / 직접 LUT 검토.
- **Hipparcos 다운로드 의존성**: astroquery + VizieR, 인터넷 접근 필요. CI 에서 한 번 cache → fixture 검증. Work 3 DE440 SPK 캐시 패턴 재사용.
- **Hipparcos epoch J1991.25 → J2000 proper motion**: ~9 년 차이 → 빠른 별 (Barnard's Star 등) 은 ~수 ' 이동. Work 5 정밀도 (mas) 안에서 무시 못 함 — apply_proper_motion 필수.
- **Star B-V 누락**: Hipparcos 에 ~1% 별이 B-V NaN. fallback color (e.g. Sun-like 5778 K) 필요.
- **Star binary 파일 크기**: Vmag ≤ 6.0 → ~9 100 stars × (12B pos + 1B color + 1B mag) = ~127 KB + 16B header → commit OK.
- **Anchor 변경 시 카메라 좌표**: anchor 변경은 world coords 의 origin 변경 — 카메라 위치는 그대로 둘지 (시각적 jump) 동기화 시킬지 결정. 본 Work 는 dev demo 만, Work 9 에서 부드러운 전환.
- **`positionToWorld` 의 `THREE.Vector3` 의존**: pure 함수에 three.js 의존성 들어감. `world.ts` 에 thin adapter 만 두고 핵심 로직은 `PositionScene` 까지 — three.js dependency 격리.
- **Sun PointLight 의 광량 단위**: three.js r150+ 에서 `intensity` 단위 변경 (`PI` 기반). Work 6 PBR 검증 시 재조정 가능.
- **Test env 에서 WebGL**: vitest happy-dom 은 WebGL 미지원. WebGL 의존 단위 테스트는 e2e (playwright) 에 위임. unit test 는 옵션 객체 / decode / palette 등 pure 로직만.
- **데이터 정렬**: Work 2 NAIF 카탈로그 + Work 3 DE440 evaluator 와 동일한 NAIF id 사용 (Body-centric anchor 의 body 식별).

---

_Last updated: 2026-05-06_
