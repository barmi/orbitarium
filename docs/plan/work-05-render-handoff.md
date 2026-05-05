# Work 5 — Handoff (3D Rendering Foundation)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-05-render.md`](work-05-render.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------ |
| 현재 phase   | **P0 kickoff** — plan/handoff 짝 작성 직후, **P1 시작 대기**                              |
| 다음 액션    | P1 권장값 ~12건 사용자 컨펌 → `src/render/{types,constants,index}.ts` + Python placeholder |
| 마지막 갱신  | 2026-05-06                                                                                 |
| 블로커       | 없음                                                                                       |

## 1. 진행 체크리스트

각 phase 의 Done 기준은 [plan §3](work-05-render.md#3-phase-정의) 참조.
phase 마감 전, plan 의 "Done" 모든 항목을 만족해야 [x] 가능.

- [ ] **P1** — Render Strategy & Scene Graph Types
- [ ] **P2** — Renderer Pipeline (Color & Tone Mapping)
- [ ] **P3** — Log-Depth & Scene Graph Anchors
- [ ] **P4** — Starfield Data Pipeline + Mesh
- [ ] **P5** — Dev Demo `/dev/render`
- [ ] **P6** — Cross-validation & Golden Fixtures (Closeout)

> Work 5 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-05-render.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| #   | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
| --- | ---- | ---- | ----------- | ----- | ------ |
| —   | (P1 결정 대기) | | | P1 | |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정 (예정 ~12건)

- [ ] scene unit ↔ three.js unit 매핑 (권장: 1:1)
- [ ] 색공간 / 톤매핑 (권장: SRGB output + ACES Filmic + linear internal)
- [ ] Default exposure (권장: 1.0, slider 0.1 ~ 4.0)
- [ ] Logarithmic depth buffer (권장: enabled by default)
- [ ] Camera near / far (권장: 1e-3 / 1e10 scene unit)
- [ ] Scene anchor 모델 (권장: string literal union + context payload)
- [ ] Sun lighting (권장: PointLight + 최소 ambient 0.05)
- [ ] `positionToWorld` 시그니처 (권장: `(p, policy, anchor) → Vector3`)
- [ ] 별 카탈로그 default (권장: Hipparcos main, Vmag ≤ 6.0)
- [ ] 색온도 변환 공식 (권장: Ballesteros 2012)
- [ ] 별 거리 처리 default (권장: 단일 celestial sphere)
- [ ] 별 frame (권장: ICRF, Hipparcos epoch → J2000 proper motion 적용)

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
- 궤도 폴리라인 scene 변환 → Work 7
- 카메라 인터랙션 (mouse/touch/keyboard) → Work 9
- adaptive scale ↔ 카메라 wiring → Work 9
- Bloom / lens flare / godrays / IBL → Work 11
- LOD / 인스턴싱 / 프레임 페이싱 → Work 11
- Time control (재생/스크러빙) → Work 8
- 별이름 라벨 / 별자리 선 → Work 10/11
- HDR float buffer pipeline → Work 11
- Cross-browser fallback (log-depth) → Work 12

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록. 형식: 경로 + 한 줄 메모.

### P1 — Render Strategy & Scene Graph Types

_(대기)_

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
| 2026-05-06 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정 (Strategy → Renderer Pipeline → Log-Depth + Anchors → Starfield → Dev Demo → Closeout). P1 결정 ~12건 대기. Work 4 산출물 (`PositionScene` / distance·size policy) 적극 활용 예정. `src/render/`, `src/dev/render/`, `orbitarium_tools.starfield` 신설 예정. |

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
