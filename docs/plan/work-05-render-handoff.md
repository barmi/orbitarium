# Work 5 — Handoff (3D Rendering Foundation)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-05-render.md`](work-05-render.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------ |
| 현재 phase   | **P1 완료** ✓ — **P2 시작 대기**                                                           |
| 다음 액션    | P2 — `src/render/renderer.ts` (createRendererProps) + Home 라우트 통합 + Python 색온도 변환 |
| 마지막 갱신  | 2026-05-06                                                                                 |
| 블로커       | 없음                                                                                       |

## 1. 진행 체크리스트

각 phase 의 Done 기준은 [plan §3](work-05-render.md#3-phase-정의) 참조.
phase 마감 전, plan 의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Render Strategy & Scene Graph Types _(완료 2026-05-06)_
- [ ] **P2** — Renderer Pipeline (Color & Tone Mapping)
- [ ] **P3** — Log-Depth & Scene Graph Anchors
- [ ] **P4** — Starfield Data Pipeline + Mesh
- [ ] **P5** — Dev Demo `/dev/render`
- [ ] **P6** — Cross-validation & Golden Fixtures (Closeout)

> Work 5 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-05-render.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| #   | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
| --- | ---- | ---- | ----------- | ----- | ------ |
| 1   | scene unit ↔ three.js unit | **1:1 매핑** (`SCENE_TO_THREE_UNIT_RATIO = 1`) | Work 4 #3 직접 매핑. 카메라 near/far/log-depth 전제와도 일관. | P1 | 2026-05-06 |
| 2   | 색공간 / 톤매핑 | **output `'srgb'` + ACES Filmic + linear internal** | overview §5 "HDR linear-space rendering" 충족. PBR 표준 파이프라인. float framebuffer 는 Work 11. | P1 | 2026-05-06 |
| 3   | Default exposure | **1.0** (slider [0.1, 4.0]) | 표준 노출. ACES + sRGB 조합에서 자연스러움. EXPOSURE_MIN/MAX 상수로 분리. | P1 | 2026-05-06 |
| 4   | Logarithmic depth buffer | **enabled by default** | 1e-3 ~ 1e10 13 orders span 을 z-fighting 없이 처리. WebGL 2 + EXT_frag_depth 호환 (Work 12 fallback 검토). | P1 | 2026-05-06 |
| 5   | Camera near / far | **`1e-3 / 1e10`** scene unit | log-depth + Work 4 piecewise [0.4, 5, 50] AU → [0.4, 1.5, 3.0] scene 범위 + 외곽 starfield 1e9 까지 커버. | P1 | 2026-05-06 |
| 6   | Scene anchor 모델 | **string literal union** `'ssb' \| 'heliocentric' \| 'body-centric'` + context payload (P3) | discriminated union 보다 단순. body 식별은 P3 의 `SceneAnchorContext` payload 로 분리. `SCENE_ANCHORS` const 도 함께 노출. | P1 | 2026-05-06 |
| 7   | Sun lighting (본 Work 도입분) | **PointLight at Sun + AmbientLight intensity 0.05** | Work 6 PBR 검증 전 단순 모델. r150+ PI 기반 intensity. Work 6 셰이더 검증 시 재조정 가능. | P1 | 2026-05-06 |
| 8   | Sun 영역 광원 근사 (overview §5 명시) | **본 Work 미도입 — Work 6/11 PBR 검증 후 도입 검토** (RectAreaLight ↔ MeshStandardMaterial BRDF 호환성 사전 검증 + 셰이더 disk-area approximation) | overview §5 명시 항목이지만 PBR 셰이더 검증 (Work 6) 과 polish (Work 11) 와 함께 도입이 자연스러움. defer 정당화. | P1 | 2026-05-06 |
| 9   | `positionToWorld` 시그니처 | **`(p, policy, anchor) → THREE.Vector3`** with `SceneAnchorContext` payload (P3) | anchor context 가 anchor 종류 + 보조 데이터 (sun pos, body pos) 를 캡슐화. anchor 별 함수 분리보다 호출처 단순. | P1 | 2026-05-06 |
| 10  | 별 카탈로그 default | **Hipparcos main, `Vmag <= 6.0`** (~9 100 stars) | Tycho-2 (~2.5M) 는 Work 11 perf 와 함께 검토. Vmag 6.0 cutoff 가 육안 가시 별 + 데이터 크기 (~127 KB) 균형. | P1 | 2026-05-06 |
| 11  | 색온도 변환 공식 | **Ballesteros 2012**: `T = 4600 * (1/(0.92 BV + 1.7) + 1/(0.92 BV + 0.62))` | 단순 + 결정론. TS/Python 동일 공식 → bit-exact mirror. B-V 누락 시 Sun-like 5778 K fallback. | P1 | 2026-05-06 |
| 12  | 별 거리 처리 default | **단일 celestial sphere (`STARFIELD_SCENE_RADIUS = 1e9`)** | parallax-based 깊이는 Work 9/11 (LOD) 후보. 본 Work 는 단순 sphere shell. | P1 | 2026-05-06 |
| 13  | 별 frame | **ICRF / J2000** + Hipparcos 에포크 J1991.25 → J2000 proper motion 적용 | Hipparcos 는 ICRS 기준. 빠른 별 (Barnard's Star, Vega) 1 mas 정밀도 위해 PM 필수. | P1 | 2026-05-06 |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정 (13건 모두 완료)

- [x] scene unit ↔ three.js unit 매핑: **1:1** ✓ (#1)
- [x] 색공간 / 톤매핑: **sRGB output + ACES Filmic + linear internal** ✓ (#2)
- [x] Default exposure: **1.0** (slider [0.1, 4.0]) ✓ (#3)
- [x] Logarithmic depth buffer: **enabled by default** ✓ (#4)
- [x] Camera near / far: **1e-3 / 1e10** ✓ (#5)
- [x] Scene anchor 모델: **string literal union + context payload (P3)** ✓ (#6)
- [x] Sun lighting — 본 Work 도입분: **PointLight + ambient 0.05** ✓ (#7)
- [x] Sun 영역 광원 근사 (overview §5): **본 Work 미도입, Work 6/11 defer** ✓ (#8)
- [x] `positionToWorld` 시그니처: **`(p, policy, anchor) → Vector3`** ✓ (#9)
- [x] 별 카탈로그 default: **Hipparcos main, Vmag ≤ 6.0** ✓ (#10)
- [x] 색온도 변환 공식: **Ballesteros 2012** ✓ (#11)
- [x] 별 거리 처리 default: **단일 celestial sphere (1e9)** ✓ (#12)
- [x] 별 frame: **ICRF, Hipparcos epoch → J2000 proper motion 적용** ✓ (#13)

### P2에서 결정

- [ ] 톤매핑 옵션 set (권장: ACES + Linear + Cineon 3종)
- [ ] HDR float buffer 사용 (권장: disabled, Work 11 로)
- [ ] `antialias` (권장: true MSAA)
- [ ] 색온도 → RGB 정밀도 (권장: 8-bit)
- [ ] Palette interpolation 공간 (권장: linear in linear-RGB)

### P3에서 결정

- [ ] log-depth 활성 시 camera near/far 검증 (P1 결정 그대로)
- [ ] Body-centric anchor 의 body 표현 (권장: `PositionICRF` (m) 직접)
- [ ] `SceneAnchorContext` 모듈 위치 (권장: `src/render/anchors.ts`)
- [ ] Python anchor 미러 위치 (권장: `render_anchors.py` 신설 vs `starfield.py` 내)
- [ ] DE440 evaluator wiring 정책 (권장: 호출자 책임, anchor 함수는 PositionICRF 만 받음)

### P4에서 결정

- [ ] Star 거리 처리 (권장: 단일 celestial sphere, 깊이 무시)
- [ ] `vmag_cutoff` default (권장: 6.0)
- [ ] 바이너리 포맷 (권장: 16B header + Float32 pos + Uint8 colorIdx + Uint8 magBucket)
- [ ] `magBucket` 분할 (권장: 256 buckets, Vmag [-2, 8] linear)
- [ ] Palette 정의 (권장: 256 entries, Kelvin [2000, 30000] log-uniform)
- [ ] Color → bucket index 변환 (권장: B-V → Kelvin → log-uniform palette bucket)
- [ ] Shader 구현 (권장: custom ShaderMaterial)
- [ ] Hipparcos 다운로드 캐시 위치 (권장: `tools/python/.cache/hipparcos/` gitignore)
- [ ] Tycho-2 보조 (권장: default disabled, Work 11)

### P5에서 결정

- [ ] Dev Demo 구조 (권장: 단일 페이지 + 4 섹션)
- [ ] Log-depth 검증 sphere 모델 (권장: 반경 1 + 반경 1e9 동심원 at SSB)
- [ ] Magnitude slider 처리 (권장: 클라이언트 decode 후 필터)
- [ ] DE440 evaluator 폴백 정책 (권장: Work 4 P5 패턴 재사용)
- [ ] Canvas 옵션 공유 (권장: `createRendererProps(RENDER_DEFAULTS)` Home 라우트와 동일)

### P6에서 결정

- [ ] Fixture 형식 (권장: JSON, Work 2/3/4 동일)
- [ ] Fixture 갱신 정책 (권장: 수동 `pnpm fixtures:work-05`)
- [ ] `hipparcos-vmag6.bin` git 정책 (권장: commit, ~150 KB 예상)

### 추후 보류 (Work 5 범위 밖)

- 행성 PBR 텍스처 / 노멀 / 자전 → Work 6
- 토성 고리, 대기 산란 → Work 6
- 태양 영역 광원 근사 (RectAreaLight / disk-area approximation) → Work 6/11 (overview §5 명시, P1 결정으로 defer)
- Tycho-2 별 카탈로그 (~2.5M stars, Hipparcos 21배) → Work 11 perf optimization 동반 (overview §5 명시, plan §5/§6 deferred)
- 궤도 폴리라인 scene 변환 → Work 7
- 카메라 인터랙션 (mouse/touch/keyboard) → Work 9
- adaptive scale ↔ 카메라 wiring → Work 9
- Bloom / lens flare / godrays / IBL → Work 11
- LOD / 인스턴싱 / 프레임 페이싱 → Work 11
- Time control (재생/스크러빙) → Work 8
- 별이름 라벨 / 별자리 선 → Work 10/11
- HDR float buffer pipeline → Work 11
- Cross-browser fallback (log-depth) → Work 12

### Work 5 와 무관한 cleanup 후보 (점검 중 발견 — 별도 spawn task 권장)

- **`tools/python/public/data/ephemeris/` 빈 폴더 잔여**: Work 3 P6 `de440:preprocess` 작업 중 cwd 가 `tools/python/` 일 때 만들어진 출력 경로 흔적. 실제 사용 출력 위치는 repo root 의 `public/data/ephemeris/de440/`. 빈 트리만 남음 → 삭제 + `.gitignore` 정리.
- **`docs/architecture/dev-routes.md` 의 새 dev 페이지 추가 절차 표기 stale**: 문서는 `src/dev/work-NN-<slug>/Page.tsx`, 실제 컨벤션은 `src/dev/<slug>/<Slug>Demo.tsx` (work-NN prefix 없음, Work 2~4 일관). Work 5 plan/handoff 도 후자 패턴 따름. 문서를 실제 컨벤션과 일치시키는 PR.

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록. 형식: 경로 + 한 줄 메모.

### P1 — Render Strategy & Scene Graph Types _(완료 2026-05-06)_

생성/수정 파일:

- [`src/render/types.ts`](../../src/render/types.ts) — `SceneAnchor` literal union + `SCENE_ANCHORS` const, `ToneMappingName` + `TONE_MAPPING_NAMES`, `OutputColorSpace`, `RenderSettings` interface (color space / tone mapping / exposure / log-depth / antialias / camera near & far / sun & ambient intensity).
- [`src/render/constants.ts`](../../src/render/constants.ts) — `SCENE_TO_THREE_UNIT_RATIO = 1`, `RENDER_DEFAULTS` (sRGB / ACES Filmic / exposure 1.0 / log-depth ON / antialias ON / near 1e-3 / far 1e10 / sun 1.0 / ambient 0.05), `EXPOSURE_MIN/MAX`.
- [`src/render/anchors.ts`](../../src/render/anchors.ts) — P3 placeholder.
- [`src/render/starfield.ts`](../../src/render/starfield.ts) — P4 placeholder.
- [`src/render/index.ts`](../../src/render/index.ts) — re-exports `constants` + `types`.
- [`tools/python/src/orbitarium_tools/starfield.py`](../../tools/python/src/orbitarium_tools/starfield.py) — Python placeholder. Constants only: `STARFIELD_MAGIC = b"STRF"`, `STARFIELD_FORMAT_VERSION = 1`, `STARFIELD_HEADER_BYTES = 16`, palette config (`PALETTE_SIZE/MIN/MAX`), magnitude bucket config, `DEFAULT_VMAG_CUTOFF = 6.0`, `STARFIELD_SCENE_RADIUS = 1e9`, `FALLBACK_COLOR_TEMP_K = 5778`. P2/P4/P6 implementations 명시 docstring.

테스트:

- [`tests/unit/render/types.test.ts`](../../tests/unit/render/types.test.ts) — 12 tests: SCENE_TO_THREE_UNIT_RATIO, EXPOSURE_MIN/MAX 가드, RENDER_DEFAULTS 8 항목 (sRGB / ACES / exposure 1.0 / log-depth / camera span >12 orders / antialias / sun & ambient), SCENE_ANCHORS, TONE_MAPPING_NAMES.
- [`tools/python/tests/test_starfield.py`](../../tools/python/tests/test_starfield.py) — 9 tests: placeholder 상수 sanity (magic / version / header bytes / palette config / magnitude bucket / vmag cutoff / scene radius / fallback temp).

검증 결과:

- `pnpm format:check` ✓ (Prettier auto-format on `types.ts` after first run)
- `pnpm lint` ✓ (simple-import-sort autofix on test 1건)
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **407 tests** (Work 4 P6 395 → P1 +12).
- `pnpm build` ✓ — 1113 kB.
- `cd tools/python && uv run ruff check src tests` ✓
- `uv run mypy src` ✓ — 12 source files (Work 4 11 → +1 starfield).
- `uv run pytest` ✓ — **113 tests** (Work 4 P6 104 → P1 +9).

설계 결정 + 발견:

- **`SCENE_ANCHORS` / `TONE_MAPPING_NAMES` const arrays with `satisfies`**: 타입 안전한 enum-like 패턴. P5 dev demo picker, P3 anchor switch 에서 직접 iterate 가능.
- **`anchors.ts` / `starfield.ts` placeholder + `export {}`**: 빈 ES 모듈 — index.ts 에서 re-export 하지 않음 (P3/P4 진입 시 추가). typecheck 통과 + import 시 명시적 에러 (member 없음) 로 P1 단계 잘못된 의존 방지.
- **HDR linear-space 의미를 docstring 에 못박음**: `constants.ts` 의 `RENDER_DEFAULTS` 주석 + 테스트 describe 에 "HDR linear-space pipeline" 명시 — overview §5 와의 정합 표현.
- **`RENDER_DEFAULTS.cameraNear/Far` 13 orders span**: 1e-3 ~ 1e10 = 13 orders. 테스트로 `>12 orders` invariant 가드 — 향후 변경 시 의도적 결정 필요.
- **`SCENE_TO_THREE_UNIT_RATIO` 상수 분리**: 1:1 매핑이지만 단일 진실원으로 분리 — Work 6+ mesh radius / camera distance 환산 시 import.
- **`exposureSlider.tsx` P2 로 미루기**: P1 plan 은 선택 항목으로 두었음. dev demo controls (P5) 와 함께 R3F 컴포넌트로 구현 — P1 에는 순수 데이터/타입만 두어 happy-dom test 가능.

### P2 — Renderer Pipeline (Color & Tone Mapping)

_(대기)_

### P3 — Log-Depth & Scene Graph Anchors

_(대기)_

### P4 — Starfield Data Pipeline + Mesh

_(대기)_

### P5 — Dev Demo `/dev/render`

_(대기)_

### P6 — Cross-validation & Golden Fixtures (Closeout)

_(대기)_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 즉시 액션: P1 시작

1. [`work-05-render.md`](work-05-render.md) §3 Phase 1 와 §5 권장값 표 검토.
2. 사용자에게 권장값 ~12건 (위 §3 P1 체크리스트) 컨펌 받기.
3. 결정 즉시 §2 결정 로그 한 줄씩 추가 (#1 ~ #12).
4. `src/render/{types,constants,anchors,starfield,index}.ts` 생성 (anchors / starfield 는 P3/P4 placeholder).
5. `tools/python/src/orbitarium_tools/starfield.py` placeholder 생성 (의미 docstring + 색온도 / 바이너리 포맷 상수).
6. `tests/unit/render/types.test.ts` 작성.
7. `pnpm format:check / lint / typecheck / test / build` + `cd tools/python && uv run ruff / mypy / pytest` 그린 확인.
8. handoff §0 → P2 시작 대기로 갱신, §7 갱신 이력 한 줄 추가, §1 P1 [x].
9. (선택) 커밋 — `[work-05/p1] Render Strategy & Brand Types 완료 — 결정 12건`

### Work 2/3/4 산출물 활용 (Work 5 시작 전 점검)

```ts
// 단위 — Work 2 brand 그대로
import { type Meters, type Radians, AU } from '@/astro'

// 위치 / 카탈로그 — Work 2 NAIF + Work 3 ephemeris
import { NAIF_CATALOG, getByNaifId } from '@/astro'
import {
  type PositionICRF,
  type StateVectorICRF,
  createDe440Evaluator,
} from '@/ephemeris'

// 스케일 정책 — Work 4
import {
  type DistancePolicy,
  type SizePolicy,
  type PositionScene,
  type SizeScene,
  getDistancePolicy,
  getSizePolicy,
  positionToScene,
  radiusToScene,
} from '@/scale'

// 테스트 helpers — Work 2 P6 산출물
import { expectCloseMeters, TOL_DISTANCE_MM } from '../../helpers/expectClose'
import { loadWorkFixture } from '../../helpers/fixtures'
```

```python
# Python reference — Work 2/3/4 모듈
from orbitarium_tools.constants import AU
from orbitarium_tools.naif import NAIF_CATALOG
from orbitarium_tools.de440 import evaluate_segment, resolve_chain
from orbitarium_tools.scaling import (
    get_distance_policy,
    get_size_policy,
    position_to_scene,
)
```

### 주요 컨벤션 (Work 1/2/3/4 에서 확정 — 그대로 적용)

```
TS 모듈 위치:
  도메인 코드는 src/<domain>/ — Work 5 는 src/render/ (이미 부분 존재)
  dev 페이지는 src/dev/<work-name>/ — Work 5 는 src/dev/render/

Python 모듈:
  tools/python/src/orbitarium_tools/<name>.py — Work 5 는 starfield, render_anchors

테스트:
  단위:  tests/unit/render/<name>.test.ts (vitest, happy-dom — WebGL 미지원, 옵션/decode/pure 로직만)
  e2e:   tests/e2e/dev-render.spec.ts (playwright, chromium — WebGL 검증)
  fixtures: tests/fixtures/work-05/ (JSON, Python 으로 생성)
  pytest: tools/python/tests/test_<name>.py

Dev 라우트:
  src/dev/registry.ts 의 entry 에 Component 채우면 자동 라우트화
  Work 5 entry slug: 'render' (P5 에서 available 전환)

데이터:
  public/data/starfield/ — Hipparcos bin (P4 / P6 에서 생성)
  Hipparcos 캐시: tools/python/.cache/hipparcos/ (gitignore)

CI:
  .github/workflows/ci.yml 자동 커버 (Work 3 P6 에서 DE440 캐시 통합 완료)
  Hipparcos 캐시 추가 시 동일 패턴

커밋 prefix: [work-05/p<N>] <한국어 한 줄 요약>
```

### 빠른 검증 명령

```bash
# 프론트엔드
pnpm install
pnpm dev          # /dev/render (P5 후 활성)
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

# Python (tools/python/)
cd tools/python
uv pip install -e ".[astro,viz,dev]"   # astroquery 포함 [astro]
uv run orbitarium-tools version
uv run ruff check src tests
uv run mypy src
uv run pytest

# Starfield 사전계산 (P4 / P6 후)
pnpm starfield:preprocess

# 골든 fixture 재생성 (Work 5 closeout 패턴)
pnpm fixtures:work-05
```

### Work 4 산출물 → Work 5 변환 경로 (핵심)

```
PositionICRF (m, ICRF)
   ▼ Work 4: positionToScene(pos, distancePolicy)
PositionScene (scene unit, ICRF 방향)
   ▼ Work 5 P3: applyAnchor(p, anchor) — anchor 변경 시 origin shift
PositionScene (scene unit, anchor frame)
   ▼ Work 5 P3: sceneToVector3(p)
THREE.Vector3 (three.js world)
```

mesh radius:
```
Meters
   ▼ Work 4: radiusToScene(r, sizePolicy)
SizeScene (scene unit)
   ▼ Work 5: 그대로 mesh geometry args
THREE.SphereGeometry(args=[sceneRadius, ...])
```

## 6. 알려진 이슈 / 노트

- **overview §5 와 plan 의 두 갭 (P0 점검 시 발견)**: ① "HDR linear-space rendering" — plan 은 internal linear + ACES + sRGB output 으로 정확히 구현하되 의미를 §1 DoD/§6 위험 메모에 명확화. ② "태양 영역 광원 근사" — overview 명시 항목이지만 P1 결정으로 본 Work 미도입 (Work 6/11 PBR 검증 후) 명시 결정. 두 항목 모두 Work 5 plan §1/§3 P1 Decisions/§5/§6 에 반영 완료.
- **무관 cleanup 후보 발견 (P0 점검)**: `tools/python/public/data/ephemeris/` 빈 폴더 + `docs/architecture/dev-routes.md` stale 표기. 둘 다 Work 5 작업과 무관 — §3 "추후 보류" 의 "Work 5 와 무관한 cleanup 후보" 항목 참조.
- **vitest happy-dom 의 WebGL 미지원**: 단위 테스트는 옵션 객체 / decode / palette 등 pure 로직만. WebGL 의존 검증 (log-depth z-fighting, starfield mesh 표시) 은 e2e (playwright + chromium) 에 위임.
- **R3F gl prop callback 형식**: `<Canvas gl={(canvas) => new WebGLRenderer({ ... })}>` 또는 `<Canvas gl={{ logarithmicDepthBuffer: true, ... }}>`. 일부 옵션은 renderer 생성 시점 강제 — callback 형식이 안전.
- **Hipparcos download network 의존**: 첫 P4 실행 시 인터넷 필요. astroquery 캐시 (`tools/python/.cache/hipparcos/`) 후 오프라인 가능. CI 는 Work 3 SPK 캐시 패턴 재사용.
- **Hipparcos epoch J1991.25 → J2000**: Vega 등 빠른 별은 ~수 ' 이동. Work 5 1 mas 정밀도에서는 proper motion 적용 필수.
- **Star B-V 누락 (~1%)**: Sun-like fallback color (5778 K).
- **ACES Filmic 의 색 시프트**: 어두운 영역에서 미세한 색 시프트. Work 6 행성 텍스처가 어색하면 Cineon / 직접 LUT 검토.
- **Sun PointLight intensity 단위**: three.js r150+ `PI` 기반. Work 6 PBR 검증 시 재조정 가능.
- **Anchor 변경 시 카메라 jump**: Dev demo 는 즉시 jump OK. Main app smooth transition 은 Work 9.
- **`positionToWorld` 의 three.js dependency**: pure 함수에 three.js Vector3 의존성 들어감. 필요 시 `world.ts` thin adapter 만 three.js 의존, 핵심 로직은 `PositionScene` 까지 (격리).
- **Logarithmic depth buffer GPU 호환**: WebGL 2 + `EXT_frag_depth`. Work 12 cross-browser 검증 시 fallback. 본 Work 는 enabled by default.
- **astropy ERFA dubious year warning**: Work 2/3/4 와 동일 — 미래 시각 fixture 호출 시 발생, 무시 가능.

## 7. 갱신 이력 (Changelog)

| 날짜       | 변경                                                                                                                                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-06 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정 (Strategy → Renderer Pipeline → Log-Depth + Anchors → Starfield → Dev Demo → Closeout). P1 결정 ~12건 대기. Work 4 산출물 (`PositionScene` / distance·size policy) 적극 활용 예정. `src/render/`, `src/dev/render/`, `orbitarium_tools.starfield` 신설 예정.                                                                |
| 2026-05-06 | **P0 점검 — overview §7 폴더 구조 vs 실제 비교**. 폴더 구조 / 모듈 위치 / Python 패키지 구성은 overview 와 일치. Work 5 plan 의 두 갭 보강: ① "HDR linear-space" 의미 명확화 (§1 DoD + §6 위험), ② "태양 영역 광원 근사" P1 결정 항목 추가 (본 Work 미도입 / Work 6/11 defer, §1/§3/§5/§6). P1 결정 항목 12 → 13. Tycho-2 deferred 정당화 §6 추가. 무관 cleanup 후보 2건 (`tools/python/public/` 빈 폴더 / `dev-routes.md` stale 표기) §3 추후 보류 + §6 알려진 이슈 기록 — 별도 spawn task 권장.                                                                                                                                                                                                                                                                                                                |
| 2026-05-06 | **P1 완료** — `src/render/{types,constants,anchors,starfield,index}.ts` + Python `orbitarium_tools.starfield` placeholder + 21 단위 테스트 (TS 12 + Python 9). 결정 13건 (#1~#13) 모두 권장값 채택: 1:1 unit / sRGB+ACES+linear / exposure 1.0 / log-depth ON / near 1e-3 ~ far 1e10 / string literal anchor + context payload / Sun PointLight + ambient 0.05 / area light defer (Work 6/11) / `(p, policy, anchor)→Vector3` / Hipparcos Vmag≤6.0 / Ballesteros 2012 / single celestial sphere 1e9 / ICRF + Hipparcos PM. format/lint/typecheck/test(407)/build/ruff/mypy(12 files)/pytest(113) 전부 그린. `anchors.ts` / `starfield.ts` 는 P3/P4 placeholder 로 index.ts 에서 export 하지 않음. |

---

## Appendix A. Phase 마감 체크리스트 (Template)

각 phase 를 [x] 로 옮기기 전에 다음을 모두 확인:

1. [ ] [plan §3](work-05-render.md#3-phase-정의) 의 해당 phase Done 기준 모두 충족
2. [ ] §2 결정 로그에 phase 결정 사항 모두 기록
3. [ ] §3 해당 phase Open Questions 모두 [x] 처리
4. [ ] §4 해당 phase 산출물 인덱스 채움 (경로 + 한 줄 메모)
5. [ ] §0 현재 phase 갱신 (다음 phase 로)
6. [ ] §7 갱신 이력에 한 줄 추가
7. [ ] (선택) 커밋 — 메시지 prefix `[work-05/p<N>]`
