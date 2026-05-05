# Work 6 — Handoff (Celestial Bodies)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-06-bodies.md`](work-06-bodies.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| 현재 phase   | **P0 kickoff** — plan/handoff 짝 작성 직후, **P1 시작 대기**                                                     |
| 다음 액션    | P1 권장값 ~12건 사용자 컨펌 → `src/bodies/{types,catalog,index}.ts` + `tools/python/.../bodies.py` placeholder + 텍스처 README |
| 마지막 갱신  | 2026-05-06                                                                                                       |
| 블로커       | 없음                                                                                                             |

## 1. 진행 체크리스트

각 phase 의 Done 기준은 [plan §3](work-06-bodies.md#3-phase-정의) 참조.
phase 마감 전, plan 의 "Done" 모든 항목을 만족해야 [x] 가능.

- [ ] **P1** — Body Strategy & Catalog Types
- [ ] **P2** — IAU Rotation Models Extension
- [ ] **P3** — Body Mesh Pipeline (Sun + 9 planets + Moon)
- [ ] **P4** — Saturn Rings + Major Moons
- [ ] **P5** — Dev Demo `/dev/body/<slug>` + `/dev/body/saturn`
- [ ] **P6** — Cross-validation & Golden Fixtures (Closeout)

> Work 6 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-06-bodies.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| #   | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
| --- | ---- | ---- | ----------- | ----- | ------ |
| —   | (P1 결정 대기) | | | P1 | |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정 (예정 ~12건)

- [ ] BodyKind 모델 (권장: string union `'sun' | 'planet' | 'moon' | 'pluto-system'`)
- [ ] BodyDefinition 식별자 (권장: `naifId` + `slug`)
- [ ] radius source (권장: Work 4 `BODY_MEAN_EQUATORIAL_RADIUS_M` 재사용 + 위성 신규 entries)
- [ ] 위성 radius 출처 (권장: IAU WGCCRE 2015)
- [ ] 텍스처 소스 (권장: Solar System Scope CC4)
- [ ] 텍스처 포맷 / 해상도 (권장: JPEG 2K 행성 / 1K 위성)
- [ ] 텍스처 커밋 정책 (권장: `public/data/textures/` 직접 commit, ~5 MB)
- [ ] 위성 텍스처 fallback (권장: 단색 회색 0.6)
- [ ] mesh geometry resolution (권장: `SphereGeometry(r, 64, 32)`)
- [ ] BodyDefinition `atmosphere` flag 노출 (권장: boolean only — Work 11 에서 활용)
- [ ] `src/bodies/` 모듈 위치 (권장: 신설 도메인 폴더)
- [ ] BodyDefinition 가 Work 4 `BODY_MEAN_EQUATORIAL_RADIUS_M` 와 충돌 시 가드 (권장: 단위 테스트로 일치성 보장)

### P2에서 결정

- [ ] IAU 데이터 출처 (권장: WGCCRE 2015 / Archinal et al. 2018, Work 2 #9 일관)
- [ ] 위성 rotation 포함 범위 (권장: Earth's Moon + Galilean 4 + Titan = 6)
- [ ] 비-Galilean Saturn moon rotation (권장: tidally-locked 근사)
- [ ] Pluto / Charon rotation (권장: tidally-locked)
- [ ] Tolerance W / α / δ (권장: 1 mas)
- [ ] TS / Python 데이터 동기화 정책 (권장: 둘 다 IAU paper 직접 참조 + fixture cross-check)

### P3에서 결정

- [ ] planet material (권장: `MeshStandardMaterial` + roughness 0.85)
- [ ] Sun material (권장: `MeshBasicMaterial` + emissive texture)
- [ ] Sun halo (권장: `SpriteMaterial` + radial gradient PNG)
- [ ] Body 위치 prop (권장: `PositionICRF` (m) 직접)
- [ ] Rotation matrix → quaternion (권장: `Matrix4.makeBasis → Quaternion.setFromRotationMatrix`)
- [ ] Rotation 갱신 정책 (권장: jdTdb 변화 시에만)
- [ ] Earth's Moon 의 rotation (권장: IAU WGCCRE 2015 모델)
- [ ] 텍스처 색공간 (권장: `colorSpace = SRGBColorSpace`, GPU 가 linearize)

### P4에서 결정

- [ ] Saturn rings 모델 (권장: `RingGeometry` + 단일 텍스처)
- [ ] Ring 반투명 (권장: `transparent` + `alphaMap` + `depthWrite: false`)
- [ ] Ring 자전 정렬 (권장: Saturn 자전축 + 자전과 함께 회전)
- [ ] Galilean / Titan rotation (권장: IAU WGCCRE 2015 모델)
- [ ] 비-Galilean Saturn moon / Charon rotation (권장: tidally-locked)
- [ ] Pluto-Charon 표현 (권장: 각각 별도 BodyDefinition)
- [ ] 비텍스처 위성 fallback (권장: 단색 회색)

### P5에서 결정

- [ ] 라우팅 패턴 (권장: `/dev/body/:slug` dynamic)
- [ ] 카메라 거리 (권장: body radius × 5 in scene units)
- [ ] 자전축 시각화 (권장: 북극 / 남극 arrow + 적도 line)
- [ ] 시간 슬라이더 default (권장: 현재 시각)
- [ ] Saturn 전용 분기 처리 (권장: 본 페이지 + rings on/off + ring tilt readout)

### P6에서 결정

- [ ] Fixture 형식 (권장: JSON, Work 2~5 동일)
- [ ] Fixture 갱신 정책 (권장: 수동 `pnpm fixtures:work-06`)
- [ ] 텍스처 git 정책 (권장: commit, ~5 MB total)
- [ ] Texture license attribution 표기 (권장: README 에 source URL + author + license)

### 추후 보류 (Work 6 범위 밖)

- 대기 산란 셰이더 (Earth / Venus / Titan) → Work 11 polish
- Sun corona / CME / 표면 활동 셰이더 → Work 11
- Self-shadow / planet shadow on rings (Saturn) / eclipse → Work 11
- Bump / normal / specular map 추가 → Work 11
- LOD (거리에 따른 mesh 해상도 / 텍스처 해상도) → Work 11
- KTX2 / Basis 텍스처 압축 → Work 11
- Galilean / Saturn moon high-res 텍스처 → Work 11
- 소행성 / 혜성 mesh → Work 7 / Work 11
- 궤도 trail / predict 폴리라인 → Work 7
- 카메라 orbit / focus 컨트롤 (mouse / touch) → Work 9
- 시간 컨트롤 (재생 / 스크러빙) → Work 8
- ellipsoid (polar bias) mesh → Work 11

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록. 형식: 경로 + 한 줄 메모.

### P1 — Body Strategy & Catalog Types

_(대기)_

### P2 — IAU Rotation Models Extension

_(대기)_

### P3 — Body Mesh Pipeline (Sun + 9 planets + Moon)

_(대기)_

### P4 — Saturn Rings + Major Moons

_(대기)_

### P5 — Dev Demo `/dev/body/<slug>`

_(대기)_

### P6 — Cross-validation & Golden Fixtures (Closeout)

_(대기)_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 즉시 액션: P1 시작

1. [`docs/architecture/render-conventions.md`](../architecture/render-conventions.md) §9 Work 6+ 진입 체크리스트 (8 항목) 를 먼저 확인.
2. [`work-06-bodies.md`](work-06-bodies.md) §3 Phase 1 + §5 권장값 표 검토.
3. 사용자에게 권장값 ~12건 (위 §3 P1 체크리스트) 컨펌 받기.
4. 결정 즉시 §2 결정 로그 한 줄씩 추가 (#1 ~ #12).
5. `src/bodies/{types,catalog,index}.ts` 생성 (BodyDefinition + BODY_CATALOG ≥ 19 entries).
6. `tools/python/src/orbitarium_tools/bodies.py` placeholder 생성 (Python mirror BodyDefinition + 위성 radius 표).
7. `public/data/textures/README.md` placeholder (출처 / 라이선스 / 갱신 명령) — 실제 텍스처는 P3/P4.
8. `tests/unit/bodies/types.test.ts` 작성.
9. `pnpm format:check / lint / typecheck / test / build` + `cd tools/python && uv run ruff / mypy / pytest` 그린 확인.
10. handoff §0 → P2 시작 대기로 갱신, §7 갱신 이력 한 줄 추가, §1 P1 [x].
11. (선택) 커밋 — `[work-06/p1] Body Strategy & Catalog 완료 — 결정 12건`

### Work 2/3/4/5 산출물 활용 (Work 6 시작 전 점검)

```ts
// 단위 — Work 2
import { type Meters, type Radians } from '@/astro'

// IAU rotation — Work 2 P4 (확장 예정 P2)
import {
  EARTH_IAU_ROTATION,
  evaluateRotation,
  inertialToBodyFixed,
  type IAURotationModel,
  type JdTdb,
  utcToJdTdb,
} from '@/astro'

// NAIF catalog — Work 2 (이미 29 entries)
import { NAIF_CATALOG, getByNaifId } from '@/astro'

// 위치 / state — Work 3
import { createDe440Evaluator, type PositionICRF } from '@/ephemeris'

// 스케일 — Work 4
import {
  BODY_MEAN_EQUATORIAL_RADIUS_M,
  type DistancePolicy,
  getDistancePolicy,
  getSizePolicy,
  radiusToScene,
  type SizePolicy,
} from '@/scale'

// 렌더 + anchor + world coords — Work 5
import {
  bodyCentricAnchor,
  createRendererProps,
  positionToWorld,
  RENDER_DEFAULTS,
  type SceneAnchor,
  sceneScalarToWorld,
} from '@/render'

// 테스트 helpers — Work 2 P6
import {
  expectCloseMeters,
  expectCloseRadians,
  TOL_ANGLE_MAS,
  TOL_DISTANCE_MM,
} from '../../helpers/expectClose'
import { loadWorkFixture } from '../../helpers/fixtures'
```

```python
# Python reference — Work 2/3/4
from orbitarium_tools.constants import AU
from orbitarium_tools.naif import NAIF_CATALOG
from orbitarium_tools.de440 import evaluate_segment, resolve_chain
from orbitarium_tools.rotation import evaluate_rotation, inertial_to_body_fixed
from orbitarium_tools.scaling import (
    BODY_MEAN_EQUATORIAL_RADIUS_M,
    get_distance_policy,
    get_size_policy,
    radius_to_scene,
)
from orbitarium_tools.render_anchors import (
    apply_anchor,
    body_centric_anchor,
    heliocentric_anchor,
    ssb_anchor,
)
```

### 주요 컨벤션 (Work 1~5 에서 확정 — 그대로 적용)

```
TS 모듈 위치:
  도메인 코드는 src/<domain>/ — Work 6 는 src/bodies/ 신설
  dev 페이지는 src/dev/<work-name>/ — Work 6 는 src/dev/body/

Python 모듈:
  tools/python/src/orbitarium_tools/<name>.py — Work 6 는 bodies + rotation 확장

테스트:
  단위:  tests/unit/bodies/<name>.test.{ts,tsx} (vitest, happy-dom — WebGL 미지원)
         tests/unit/astro/rotation.test.ts (rotation 모델 확장 검증)
  e2e:   tests/e2e/dev-body.spec.ts (playwright, chromium)
  fixtures: tests/fixtures/work-06/ (JSON, Python 으로 생성)
  pytest: tools/python/tests/test_bodies.py + test_rotation.py 확장

Dev 라우트:
  src/dev/registry.ts 의 entry 에 Component 채우면 자동 라우트화
  Work 6 entry slug: 'body' (P5 에서 available 전환 — 11 cards 중 5 available / 6 placeholder)
  dynamic: `/dev/body/:slug` (Saturn 은 `/dev/body/saturn` 으로 자동 매핑)

데이터:
  public/data/textures/ — JPEG 2K (행성), JPEG 1K (위성). README 에 출처 / 라이선스.
  public/data/textures/sun-halo.png — radial gradient (P3에서 생성).

CI:
  .github/workflows/ci.yml 자동 커버.
  텍스처 추가는 git commit 과 함께 (no CDN).

커밋 prefix: [work-06/p<N>] <한국어 한 줄 요약>
```

### 빠른 검증 명령

```bash
# 프론트엔드
pnpm install
pnpm dev          # /dev/body/<slug> (P5 후 활성)
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

# Python (tools/python/)
cd tools/python
uv pip install -e ".[astro,viz,dev]"
uv run orbitarium-tools version
uv run ruff check src tests
uv run mypy src
uv run pytest

# 골든 fixture 재생성 (Work 6 closeout 패턴)
pnpm fixtures:work-06
```

### Work 5 산출물 → Work 6 변환 경로 (핵심)

```
PositionICRF (m, ICRF)                     ← Work 3 evaluator
   ▼ Work 5: positionToWorld(p, distancePolicy, anchor)
THREE.Vector3 (world coords)               ← Body mesh.position

Meters (radius from Work 4 catalog)
   ▼ Work 4: radiusToScene(r, sizePolicy)
SizeScene
   ▼ Work 5: sceneScalarToWorld(s)
number                                     ← SphereGeometry(radius, ...)

JdTdb + IAURotationModel (Work 2 P4 + 본 Work P2 확장)
   ▼ Work 2: inertialToBodyFixed(model, jdTdb)
Matrix3 (3×3 행 우선)
   ▼ Work 6 P3: matrix3ToQuaternion(m, ...)
THREE.Quaternion                           ← Body mesh.quaternion
```

## 6. 알려진 이슈 / 노트

- **Work 2 P4 의 rotation 모델이 Earth 만**: 본 Work P2 가 11+ bodies 로 확장. SPICE PCK eval 과 mas 비교가 필수 — 데이터 입력 typo 위험 차단.
- **Three.js 행렬 vs IAU 행렬 convention**: Three.js 는 column-major + 좌측 곱셈, IAU `inertialToBodyFixed` 는 row-major + 우측 곱셈 가능. P3 에서 transpose 여부를 단위 테스트로 가드 (Earth 자전 W angle 이 mas 안 일치하는지).
- **PBR 텍스처 색공간**: `texture.colorSpace = SRGBColorSpace` 설정 필수 — 안 하면 GPU linearize 안 됨 → ACES tone mapping 후 색이 어둡거나 왜곡.
- **ACES 색 시프트 (Work 5 #14)**: 행성 텍스처 (특히 어두운 영역) 가 자연스럽지 않으면 dev page 의 tone mapping picker 로 Cineon / Linear 비교. 본 Work 는 default ACES 유지.
- **Sun PointLight + Sun mesh 동시**: Work 5 P1 #7 PointLight 와 본 Work P3 Sun mesh 가 같은 SSB 위치. emissive material 은 lighting 무시 — self-glow OK.
- **Saturn rings self-shadow / Saturn 의 ring shadow**: 본 Work 는 단순 transparent disk. 그림자 효과는 Work 11 polish.
- **`useFrame` 매 프레임 호출**: rotation matrix 계산은 가벼움 (~수 µs) 이지만 매 frame 호출 시 시간 정지에도 재계산. P3 #rotation 갱신 정책 (`useEffect` 감지) 으로 효율화.
- **vitest happy-dom 의 WebGL 미지원**: 단위 테스트는 BodyDefinition / catalog / material props / rotation matrix 등 pure 로직만. 시각 회귀는 e2e (playwright + chromium) 에 위임.
- **텍스처 라이선스 attribution**: Solar System Scope CC4 — README 에 정확한 source URL + author + license 명시 의무.
- **Pluto / Charon barycenter 처리**: DE440 NAIF id 9 (barycenter) / 999 (Pluto body) / 901 (Charon). Charon 의 SSB 위치 = (Pluto barycenter 9 SSB) + (Charon-from-Pluto-barycenter offset). evaluator wiring 확인 필요.
- **Galilean / Titan 의 IAU 모델**: WGCCRE 2015 paper 에서 명시. 데이터 entry 시점에 cross-check 필수.
- **mesh polar 반지름 (ellipsoid)**: 본 Work 는 평균 적도 반지름 (구) 만 사용. Earth 0.3% / Saturn 10% 차이 — Work 11 ellipsoid 도입.
- **astropy ERFA dubious year warning**: Work 2/3/4/5 와 동일 — 미래 시각 fixture 시 발생, 무시 가능.

## 7. 갱신 이력 (Changelog)

| 날짜       | 변경                                                                                                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-06 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정 (Strategy → IAU Rotation Extension → Mesh Pipeline → Saturn Rings + Moons → Dev Demo → Closeout). P1 결정 ~12건 대기. Work 4 `BODY_MEAN_EQUATORIAL_RADIUS_M` + Work 5 `positionToWorld` / `radiusToScene` / `bodyCentricAnchor` 적극 활용 예정. `src/bodies/`, `src/dev/body/`, `orbitarium_tools.bodies` 신설 예정. |

---

## Appendix A. Phase 마감 체크리스트 (Template)

각 phase 를 [x] 로 옮기기 전에 다음을 모두 확인:

1. [ ] [plan §3](work-06-bodies.md#3-phase-정의) 의 해당 phase Done 기준 모두 충족
2. [ ] §2 결정 로그에 phase 결정 사항 모두 기록
3. [ ] §3 해당 phase Open Questions 모두 [x] 처리
4. [ ] §4 해당 phase 산출물 인덱스 채움 (경로 + 한 줄 메모)
5. [ ] §0 현재 phase 갱신 (다음 phase 로)
6. [ ] §7 갱신 이력에 한 줄 추가
7. [ ] (선택) 커밋 — 메시지 prefix `[work-06/p<N>]`
