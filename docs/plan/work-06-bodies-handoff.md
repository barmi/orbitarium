# Work 6 — Handoff (Celestial Bodies)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-06-bodies.md`](work-06-bodies.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------- |
| 현재 phase   | **P2 완료** ✓ — **P3 시작 대기**                                                                  |
| 다음 액션    | P3 — `src/bodies/{material,rotation,Body,SunMesh}.tsx` + 행성 PBR + Sun glow + IAU rotation wiring |
| 마지막 갱신  | 2026-05-06                                                                                        |
| 블로커       | 없음                                                                                              |

## 1. 진행 체크리스트

각 phase 의 Done 기준은 [plan §3](work-06-bodies.md#3-phase-정의) 참조.
phase 마감 전, plan 의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Body Strategy & Catalog Types _(완료 2026-05-06)_
- [x] **P2** — IAU Rotation Models Extension _(완료 2026-05-06)_
- [ ] **P3** — Body Mesh Pipeline (Sun + 9 planets + Moon)
- [ ] **P4** — Saturn Rings + Major Moons
- [ ] **P5** — Dev Demo `/dev/body/<slug>` + `/dev/body/saturn`
- [ ] **P6** — Cross-validation & Golden Fixtures (Closeout)

> Work 6 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-06-bodies.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| #   | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
| --- | ---- | ---- | ----------- | ----- | ------ |
| 1   | BodyKind 모델 | **string union `'sun' \| 'planet' \| 'moon' \| 'pluto-system'`** + `BODY_KINDS` const | Work 5 SceneAnchor 패턴 일관. enum 보다 단순 + tree-shake 친화. | P1 | 2026-05-06 |
| 2   | BodyDefinition 식별자 | **`naifId` (정수) + `slug` (kebab-case)** 두 채널 | URL 라우팅은 slug, 데이터 lookup 은 naifId. 두 ReadonlyMap 으로 O(1) lookup. | P1 | 2026-05-06 |
| 3   | radius source | **Work 4 `BODY_MEAN_EQUATORIAL_RADIUS_M` 재사용 + 위성 9 entries 신규 (`MOON_MEAN_EQUATORIAL_RADIUS_M`)** | 11 (Work 4) + 9 (위성) = 20 entries. 단위 테스트로 catalog ↔ source 일치 가드. | P1 | 2026-05-06 |
| 4   | 위성 radius 출처 | **IAU WGCCRE 2015 (Archinal et al. 2018)** mean equatorial | Work 4 #9 동일 출처. Io / Europa / Ganymede / Callisto / Mimas / Enceladus / Rhea / Titan / Iapetus 9 entries. | P1 | 2026-05-06 |
| 5   | 텍스처 소스 | **Solar System Scope CC4** (`https://www.solarsystemscope.com/textures/`) | Sun + 8 planets + Moon + Saturn rings + Galilean + Titan 모두 CC4 제공. attribution 은 README. | P1 | 2026-05-06 |
| 6   | 텍스처 포맷 / 해상도 | **JPEG 2K (행성) + JPEG 1K (위성) + PNG (Saturn rings + sun-halo)** | KTX2 / Basis 압축은 Work 11. 본 Work 는 단순 JPEG. | P1 | 2026-05-06 |
| 7   | 텍스처 커밋 정책 | **`public/data/textures/` 직접 commit** (~5 MB target) | Work 5 starfield bin (70 KB) 패턴 — reproducibility + CI 다운로드 회피. P3/P4 에서 실제 파일 추가. | P1 | 2026-05-06 |
| 8   | 위성 텍스처 fallback | **단색 회색 (`#999999` ~ `#dddddd` 사이 individual)** + `textureUrl: null` | Mimas / Enceladus / Rhea / Iapetus 4 entries. Work 11 high-res 시 textureUrl 채움. | P1 | 2026-05-06 |
| 9   | mesh geometry resolution | **`SphereGeometry(r, 64, 32)` default** (P3 implementation) | 행성 / 위성 일관. Work 11 LOD 도입 시 수정. | P1 | 2026-05-06 |
| 10  | `atmosphere` flag 노출 | **boolean only** — Work 11 hint, 본 Work mesh 영향 없음 | Venus / Earth / Mars / 4 gas giants / Titan = 8 entries `true`. Work 11 atmospheric scattering 진입점. | P1 | 2026-05-06 |
| 11  | `src/bodies/` 모듈 위치 | **신설 도메인 폴더** (`src/render/bodies/` 가 아닌 top-level `src/bodies/`) | Work 5 `src/render/` 와 분리 — body 카탈로그는 truth-layer (`@/scale` 와 비슷), mesh 는 display 레이어. 본 Work 가 mesh + 카탈로그 모두 가지지만 분리는 Work 11 polish 에서. | P1 | 2026-05-06 |
| 12  | Charon (NAIF 901) | **Work 6 범위 밖 — defer** | Work 2 NAIF_CATALOG 에 미존재. Charon 추가는 Work 2 modification. plan §1 의 "Pluto + Charon" 약속은 Pluto only 로 축소 — handoff §3 추후 보류 추가. | P1 | 2026-05-06 |
| 13  | IAU 데이터 출처 | **NAIF pck00011.tpc + IAU WGCCRE 2015 (Archinal et al. 2018)** polynomial only | Work 2 #9 일관. 11 bodies (sun + 8 planets + Moon + Pluto) 모두 polynomial 부분만 입력 — Mercury / Moon 의 libration / nutation, Neptune 의 N term 은 source string 에 "Work 11" 명시 후 defer. | P2 | 2026-05-06 |
| 14  | 위성 rotation 포함 범위 | **Earth's Moon 만 P2 에 포함** — Galilean / Titan 은 P3/P4 에서 tidally-locked 근사 + Work 11 IAU 모델 추가 | plan §3 P2 의 "Galilean / Titan IAU 모델" 약속 (option a) 은 데이터 entry 부담 + 본 Work mesh 시각상 큰 차이 없음 → defer. tidally-locked fallback 으로 BodyDefinition `rotationModelKey` 가 'tidally-locked' 인 항목은 mesh layer (P3/P4) 에서 parent-facing orientation. | P2 | 2026-05-06 |
| 15  | Pluto / Charon rotation | **Pluto 는 polynomial 모델, Charon 는 defer (P1 #12)** | plan §3 P2 의 "Pluto / Charon: tidally-locked 근사" 는 Pluto 만 IAU 모델 정상 적용 (polynomial 충분), Charon 은 Work 6 범위 밖. | P2 | 2026-05-06 |
| 16  | Tolerance W / α / δ | **TS ↔ Python: 1 mas, Python ↔ SPICE polynomial-only: machine precision (~1e-12)** | SPICE pxform 도 polynomial-only PCK lines 로 평가 — 동일 모델 비교라 floating-point 한계만. 실측 SPICE diff 는 Earth 7e-12 수준. Mercury / Moon nutation / libration 효과는 본 Work 미평가 (Work 11). | P2 | 2026-05-06 |
| 17  | TS / Python 데이터 동기화 | **TS object literal + Python `_model()` factory 동일 polynomial coefficients** | 두 쪽 모두 IAU paper / pck00011 직접 참조. fixture cross-check (TS ↔ Python ↔ SPICE) 로 typo 즉시 감지. | P2 | 2026-05-06 |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정 (12건 모두 완료)

- [x] BodyKind 모델: **string union + `BODY_KINDS` const** ✓ (#1)
- [x] BodyDefinition 식별자: **`naifId` + `slug`** ✓ (#2)
- [x] radius source: **Work 4 + 위성 9 신규** ✓ (#3)
- [x] 위성 radius 출처: **IAU WGCCRE 2015** ✓ (#4)
- [x] 텍스처 소스: **Solar System Scope CC4** ✓ (#5)
- [x] 텍스처 포맷 / 해상도: **JPEG 2K + 1K + PNG** ✓ (#6)
- [x] 텍스처 커밋 정책: **직접 commit** ✓ (#7)
- [x] 위성 텍스처 fallback: **단색 + textureUrl=null** ✓ (#8)
- [x] mesh geometry resolution: **`SphereGeometry(r, 64, 32)`** ✓ (#9)
- [x] `atmosphere` flag: **boolean, Work 11 hint** ✓ (#10)
- [x] `src/bodies/` 모듈 위치: **신설 도메인 폴더** ✓ (#11)
- [x] Charon: **Work 6 범위 밖 defer (Work 2 NAIF_CATALOG 확장 필요)** ✓ (#12)

### P2에서 결정 (5건 모두 완료, 1건 축소)

- [x] IAU 데이터 출처: **NAIF pck00011 + WGCCRE 2015 polynomial-only** ✓ (#13)
- [x] 위성 rotation 포함 범위: **Earth's Moon 만** (Galilean / Titan 은 Work 11 defer) ✓ (#14)
- [x] Pluto / Charon: **Pluto polynomial 모델, Charon Work 6 범위 밖** ✓ (#15)
- [x] Tolerance: **TS↔Python 1 mas, Python↔SPICE polynomial-only ~1e-12** ✓ (#16)
- [x] TS / Python 동기화: **둘 다 IAU paper 직접 참조 + fixture cross-check** ✓ (#17)

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

- **Charon (NAIF 901)** — Work 2 NAIF_CATALOG 확장 필요. Pluto-Charon 시스템 시각화는 Work 11 polish 또는 별도 cleanup task. (P1 #12)
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

### P1 — Body Strategy & Catalog Types _(완료 2026-05-06)_

생성/수정 파일:

- [`src/bodies/types.ts`](../../src/bodies/types.ts) — `BodyKind` literal union + `BODY_KINDS` const, `RingsConfig` (innerRadiusM / outerRadiusM / textureUrl, m + Saturn-only), `BodyDefinition` interface (naifId / slug / label / kind / radiusM / rotationModelKey / textureUrl / fallbackColor / rings / atmosphere).
- [`src/bodies/catalog.ts`](../../src/bodies/catalog.ts) — `MOON_MEAN_EQUATORIAL_RADIUS_M` (9 entries, IAU WGCCRE 2015), Saturn ring inner/outer radii (74.5M / 136.775M m), `BODY_CATALOG` (20 entries: Sun + 8 planets + Pluto + Moon + 4 Galilean + 5 Saturn major), `getBodyByNaifId` / `getBodyBySlug` (O(1) Map lookup).
- [`src/bodies/index.ts`](../../src/bodies/index.ts) — re-exports.
- [`tools/python/src/orbitarium_tools/bodies.py`](../../tools/python/src/orbitarium_tools/bodies.py) — Python mirror (`BodyKind` Literal + `BodyDefinition` dataclass + `BODY_CATALOG` 20 entries + lookup helpers).
- [`public/data/textures/README.md`](../../public/data/textures/README.md) — Solar System Scope CC4 attribution + 파일 표 (P3/P4 에 채워질 17 textures) + 갱신 절차 + 포맷 컨벤션.

테스트:

- [`tests/unit/bodies/types.test.ts`](../../tests/unit/bodies/types.test.ts) — 19 tests: BodyKind union (2) + BODY_CATALOG 구성 검증 (10: count / Sun / 8 planets + Saturn rings / Pluto / 10 moons / unique slug+id / kebab-case / radius source / rotation key pattern / atmosphere set / hex color / no-texture moons) + Saturn rings 가드 (2) + lookup helpers (3 + roundtrip).
- [`tools/python/tests/test_bodies.py`](../../tools/python/tests/test_bodies.py) — 16 tests (TS와 동일 구조 + Python mirror lookup roundtrip).

검증 결과:

- `pnpm format` ✓ (Prettier auto-format on `types.ts` / `catalog.ts` / `types.test.ts` after first run)
- `pnpm lint:fix` ✓
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **494 tests** (Work 5 P6 475 → P1 +19).
- `pnpm build` ✓
- `cd tools/python && uv run ruff check src tests` ✓
- `uv run mypy src` ✓ — 14 source files (Work 5 13 → +1 bodies).
- `uv run pytest` ✓ — **157 tests** (Work 5 P6 141 → P1 +16).

설계 결정 + 발견:

- **Work 4 radius 재사용 vs. 신규 정의**: `BODY_MEAN_EQUATORIAL_RADIUS_M[10..999]` 11 entries 가 그대로 `BodyDefinition.radiusM` 으로 들어감 + `MOON_MEAN_EQUATORIAL_RADIUS_M` 가 위성 9 추가. 단위 테스트가 source ↔ catalog 일치 가드.
- **Charon 부재 — defer**: Work 2 NAIF_CATALOG 에 901 미존재. plan 의 "Pluto + Charon" 은 Pluto only 로 축소. 추후 Work 11 polish 또는 별도 cleanup task 로 처리.
- **Mimas / Enceladus / Rhea / Iapetus 텍스처 부재**: textureUrl=null + fallback color 만. Work 11 high-res asset 도입 시 채움.
- **`atmosphere` flag 8 entries**: Venus / Earth / Mars / 4 gas giants + Titan. Mars 는 매우 얇은 대기지만 Work 11 atmospheric scattering 의 가드 신호로 true.
- **Saturn ring inner radius (74.5M m) > Saturn radius (60.3M m)**: ~1.236× 적도 반지름 — D ring inner edge. 단위 테스트로 invariant 보장.
- **Python `_planet` / `_moon` factory 함수**: dataclass entry 작성 시 boilerplate 감소. Sun / Pluto 만 직접 dataclass (kind='sun' / 'pluto-system' 특수).
- **`BODY_CATALOG` 가 truth-layer**: Work 5 `src/render/` 와 분리. P3 의 mesh / material 은 별도 모듈로 들어와 `bodies` 가 받게 될 것.

### P2 — IAU Rotation Models Extension _(완료 2026-05-06)_

생성/수정 파일:

- [`src/astro/rotationData.ts`](../../src/astro/rotationData.ts) — 11 IAU rotation 모델 (Sun / Mercury / Venus / Earth / Moon / Mars / Jupiter / Saturn / Uranus / Neptune / Pluto), polynomial-only. `IAU_ROTATION_MODELS` Map (key = BodyDefinition.rotationModelKey) + `getIauRotationModel(key)` lookup.
- [`tools/python/src/orbitarium_tools/rotation.py`](../../tools/python/src/orbitarium_tools/rotation.py) — Python mirror (`_model()` factory + 10 신규 모델 + `IAU_ROTATION_MODELS` dict + `get_iau_rotation_model`). `spice_pck_lines(model)` / `spice_inertial_to_body_fixed(model, jd)` 일반화 (Earth-only 헬퍼는 위임).
- [`tools/python/src/orbitarium_tools/bodies.py`](../../tools/python/src/orbitarium_tools/bodies.py) — `generate_iau_rotation_fixture(out_dir)` (11 × 5 grid) + `generate_body_catalog_fixture(out_dir)` + `generate_fixtures(out_dir)` 통합.
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `fixtures --work=6` 분기.
- [`package.json`](../../package.json) — `pnpm fixtures:work-06` 스크립트.

테스트 + fixture:

- [`tests/fixtures/work-06/iau-rotation.json`](../../tests/fixtures/work-06/iau-rotation.json) — 11 models × 5 jdTdb (J1900 / J2000 / Voyager 2 fly / 2026-05-06 / J2100) = 55 rows. 각 row 는 ra/dec/W + 9-element matrix + SPICE max diff.
- [`tests/fixtures/work-06/body-catalog.json`](../../tests/fixtures/work-06/body-catalog.json) — Python BODY_CATALOG dump (TS catalog 와 cross-check 용).
- [`tests/unit/astro/rotationModels.test.ts`](../../tests/unit/astro/rotationModels.test.ts) — 17+ tests: 모델 lookup / NAIF id / Earth polynomial unchanged / Sun Carrington PM / Venus 역회전 / Uranus 역축 / source 메모 / sample evaluations + fixture cross-check (TS evaluateRotation ↔ Python angle 1 mas, TS matrix ↔ Python matrix 1e-12, Python ↔ SPICE 1e-10).
- [`tools/python/tests/test_rotation_models.py`](../../tools/python/tests/test_rotation_models.py) — 11 tests + SPICE polynomial-only diff < 1e-10 across all 11 models × 5 jds.

검증 결과:

- `pnpm format` ✓
- `pnpm lint:fix` ✓ (1 typecheck error 수정 — `m[i]!` non-null assertion)
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **539 tests** (P1 494 → P2 +45).
- `pnpm build` ✓
- `cd tools/python && uv run ruff check src tests` ✓ (RUF002 한글 ambiguous chars 2개 수정)
- `uv run mypy src` ✓ — 14 source files (변동 없음).
- `uv run pytest` ✓ — **169 tests** (P1 157 → P2 +12).
- `pnpm fixtures:work-06` ✓ — 2 JSON 생성 idempotent.

설계 결정 + 발견:

- **SPICE 비교가 polynomial-only 모델끼리**: `spice_pck_lines(model)` 가 BODY*_NUT_PREC_* terms 를 emit 하지 않음 → SPICE pxform 도 polynomial 만 평가 → diff 가 machine precision (~1e-12). 이것이 implementation correctness 검증 (Python ↔ TS ↔ SPICE 동일 알고리즘) 으로는 충분하지만, **full IAU 모델 (libration / nutation 포함) vs. polynomial-only** 의 실제 천문학 정확도 차이는 본 Work 에서 평가하지 않음 — Work 11.
- **Mercury / Moon / Neptune 의 omitted terms**: source string 에 "libration / nutation / Work 11" 명시. 실제 W angle 의 long-term drift 가 Mercury 는 ~6 mas, Moon 은 ~수십 mas 수준 (Work 11 검증 대상).
- **`_model()` factory in Python**: 10 모델 boilerplate 감소. Earth 만 Work 2 P4 에서 직접 정의된 형태 그대로 유지 (regression 회피).
- **Wrap-aware W angle 비교**: TS 측 cross-check 에서 W 가 [0, 360°) 정규화 후 shortest angular diff 로 비교 — `370° vs 10°` 같은 wrap-around 케이스에서 50″ 가 아닌 0″ 로 측정.
- **Voyager 2 Uranus encounter (1986-01-24)**: fixture 의 4번째 sample. Uranus retrograde rotation 의 W angle 검증에 좋은 anchor.

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
| 2026-05-06 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정 (Strategy → IAU Rotation Extension → Mesh Pipeline → Saturn Rings + Moons → Dev Demo → Closeout). P1 결정 ~12건 대기. Work 4 `BODY_MEAN_EQUATORIAL_RADIUS_M` + Work 5 `positionToWorld` / `radiusToScene` / `bodyCentricAnchor` 적극 활용 예정. `src/bodies/`, `src/dev/body/`, `orbitarium_tools.bodies` 신설 예정.                                                                                                                                                                                                                |
| 2026-05-06 | **P1 완료** — `src/bodies/{types,catalog,index}.ts` + Python `orbitarium_tools.bodies` mirror + `public/data/textures/README.md` + 35 단위 테스트 (TS 19 + Python 16). 결정 12건 (#1~#12) 모두 권장값 채택: string union BodyKind / naifId+slug / Work4 radius 재사용 + 위성 9 신규 / IAU WGCCRE 2015 / Solar System Scope CC4 / JPEG 2K+1K+PNG / 직접 commit / 단색 fallback / SphereGeometry 64×32 / atmosphere boolean / `src/bodies/` 신설 / Charon defer. format/lint/typecheck/test(494)/build/ruff/mypy(14 files)/pytest(157) 전부 그린.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-05-06 | **P2 완료** — `src/astro/rotationData.ts` 11 IAU 모델 확장 (Sun + 8 planets + Moon + Pluto, polynomial-only) + `IAU_ROTATION_MODELS` Map + Python mirror (`_model()` factory + 동일 11 모델 + `spice_inertial_to_body_fixed` 일반화) + `bodies.py` 의 `generate_iau_rotation_fixture` (11 × 5 = 55 rows) + `generate_body_catalog_fixture` + CLI work-6 분기 + `pnpm fixtures:work-06`. fixture iau-rotation.json + body-catalog.json 생성. 결정 5건 (#13~#17): pck00011 polynomial / Earth's Moon 만 / Pluto polynomial / 1 mas TS↔Python + 1e-12 SPICE polynomial-only / IAU paper 직접 참조. 단위 테스트 57 추가 (TS 45 + Python 12, 총 539 / 169). Mercury / Moon / Neptune omitted terms 는 source string 에 "Work 11" 명시. format/lint/typecheck/test(539)/build/ruff/mypy/pytest(169) 그린. |

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
