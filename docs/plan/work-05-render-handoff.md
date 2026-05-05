# Work 5 — Handoff (3D Rendering Foundation)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-05-render.md`](work-05-render.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| 현재 phase   | **P5 완료** ✓ — **P6 시작 대기**                                                                                  |
| 다음 액션    | P6 — closeout (`tests/fixtures/work-05/README.md`, `public/data/starfield/README.md`, `docs/architecture/render-conventions.md`) |
| 마지막 갱신  | 2026-05-06                                                                                                        |
| 블로커       | 없음                                                                                                              |

## 1. 진행 체크리스트

각 phase 의 Done 기준은 [plan §3](work-05-render.md#3-phase-정의) 참조.
phase 마감 전, plan 의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Render Strategy & Scene Graph Types _(완료 2026-05-06)_
- [x] **P2** — Renderer Pipeline (Color & Tone Mapping) _(완료 2026-05-06)_
- [x] **P3** — Log-Depth & Scene Graph Anchors _(완료 2026-05-06)_
- [x] **P4** — Starfield Data Pipeline + Mesh _(완료 2026-05-06)_
- [x] **P5** — Dev Demo `/dev/render` _(완료 2026-05-06)_
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
| 14  | 톤매핑 옵션 set | **ACES Filmic + Linear + Cineon 3종 picker** | three.js 표준 톤매핑 3종 (PI 기반 r150+ 컨벤션 호환). AgX / Neutral / Reinhard 는 Work 11 검토. | P2 | 2026-05-06 |
| 15  | HDR float buffer | **disabled (Work 11 deferred)** | 본 Work 는 LDR + ACES 로 overview "HDR linear-space" 충족. RGBA16F 도입 시 GPU 호환성 / 메모리 / postprocess 설계 변경 — Work 11 polish 일관 처리. | P2 | 2026-05-06 |
| 16  | `antialias` | **true (MSAA)** | 데스크톱 / 모바일 GPU 표준 지원. Work 11 에서 FXAA / SMAA postprocess 와 비교 후 재선택 가능. | P2 | 2026-05-06 |
| 17  | 색온도 → RGB 알고리즘 | **Tanner Helland 2012 piecewise approximation** (Kelvin → 8-bit sRGB triple) | 결정론 + 단순. plan §3 P2 의 "Ballesteros + 256-palette precompute" 메모는 B-V → T (Ballesteros) 와 T → RGB (Tanner Helland) 두 단계로 분리됨을 명시. P4 에서 B-V 단계 추가. | P2 | 2026-05-06 |
| 18  | Palette interpolation 공간 | **sRGB 8-bit 직접 저장 (Tanner Helland output)** + GPU sRGB texture decode | "linear in linear-RGB" 결정 (#palette interpolation) 은 셰이더 시점 처리: 팔레트는 sRGB 인덱스로 저장, GPU 가 sampler 단계에서 linearize → linear-space lighting math 와 정합. | P2 | 2026-05-06 |
| 19  | Palette 메모리 레이아웃 | **256 entries × RGBA u8 = 1024 bytes** (R/G/B + 1 byte pad) | RGB 만 (3 bytes) 보다 텍스처 stride 4 바이트가 WebGL Uint8 texture 친화. 1 KB 작아 비용 무시. alpha 는 항상 255. | P2 | 2026-05-06 |
| 20  | `magnitude_to_bucket` 알고리즘 | **linear in Vmag, [-2, 8] → [0, 255], clamp** | overview Vmag ≤ 6.0 cutoff + Sirius (-1.46) / 그 너머 [-2] safety margin. Bucket 인덱스가 작을수록 밝은 별 — shader 에서 `(255 - bucket) / 255` 로 size 계수. | P2 | 2026-05-06 |
| 21  | Home 라우트 통합 | **`createRendererProps()` 한 곳에서 옵션 객체 생성, `<Canvas gl={...} camera={...}>` 로 전달** | Home + Dev 가 같은 옵션 공유 — DRY + 회귀 가드. lifted module-level constant 로 Canvas re-render 시 props identity 안정. | P2 | 2026-05-06 |
| 22  | HomeScene Sun 조명 모델 | **PointLight (decay 0) + AmbientLight (intensity 0.05)** — DirectionalLight 교체 | P1 #7 (Sun PointLight) 적용. decay 0 으로 단순 거리 무관 조명 (Work 6 PBR 검증 시 r²-decay 재도입 검토). | P2 | 2026-05-06 |
| 23  | log-depth 활성 시 camera near/far 검증 | **P1 #5 그대로 (1e-3 / 1e10)** | 13 orders span 안정. P5 의 반경 1 + 반경 1e9 sphere 동시 렌더 시 z-fighting 해소 검증. | P3 | 2026-05-06 |
| 24  | Body-centric anchor 의 body 표현 | **`PositionICRF` (m) 직접** payload 보관 | NAIF id payload 보다 단순 + body 식별은 호출자 책임 (Work 6/9 와 분리). evaluator 가 임의 body 의 SSB position 을 반환하면 그대로 anchor context 생성. | P3 | 2026-05-06 |
| 25  | `SceneAnchorContext` 모듈 위치 | **`src/render/anchors.ts`** (P1 #6 약속 따름) | 별도 anchors 도메인 폴더 분리 안 함. types.ts 가 `SceneAnchor` literal 만 노출, 컨텍스트 (payload 포함) 는 anchors.ts. | P3 | 2026-05-06 |
| 26  | Python anchor 미러 모듈 | **`orbitarium_tools/render_anchors.py`** 신설 (별도 파일) | `starfield.py` 와 책임 분리 — anchor / starfield 두 도메인이 P4/P6 에서 독립 진화. | P3 | 2026-05-06 |
| 27  | DE440 evaluator 와 anchor wiring | **호출자 책임** (anchor 함수는 PositionICRF 만 받음) | evaluator 호출은 Dev Demo / 메인 앱에서. anchor / world 모듈은 evaluator 의존 없이 단위 테스트 가능 (vitest happy-dom 친화). | P3 | 2026-05-06 |
| 28  | `world.ts` API 형태 | **`sceneToVector3` / `vector3ToScene` + scalar `sceneScalarToWorld` / `worldScalarToScene`** | three.js Vector3 의존을 `world.ts` 한 파일에 격리. anchors.ts 가 sceneToVector3 import 해서 positionToWorld 합성. | P3 | 2026-05-06 |
| 29  | Anchor fixture 샘플 | **6 위치 (zero / sun_ssb / earth_ssb / mars / jupiter / pluto) × 3 anchor (ssb / heliocentric / body-centric_earth)** | 외행성 + 0 vector + reference body 자체까지 — 각 anchor 의 corner case 커버. JSON fixture 로 TS / Python 교차 검증. | P3 | 2026-05-06 |
| 30  | Hipparcos 캐시 형식 | **ECSV (astropy plaintext)** — 파일명 `hipparcos_main.ecsv` | 처음에 Parquet 시도 → pandas 의존성 추가 부담. astropy native ECSV 가 plaintext + diff 가능 + 의존성 ZERO. 캐시 위치 `tools/python/.cache/hipparcos/`. | P4 | 2026-05-06 |
| 31  | 필터링 정책 (catalog 누락 처리) | **`_RA.icrs` / `_DE.icrs` / `Vmag` 마스크 / NaN 인 row 는 silently drop** | Hipparcos 일부 row 가 position masked. 9 100 → 4 992 stars 로 줄지만 안전. B-V / pmRA / pmDE 누락은 default (NaN / 0) 로 fallback. | P4 | 2026-05-06 |
| 32  | TS / Python 색온도 함수 mirror | **bit-exact 동일 구현** (Tanner Helland 2012 + Ballesteros 2012) | math 함수만 사용 → IEEE 754 동일 결과. fixture cross-check 12 B-V 샘플 1 K diff 안에서 일치 + RGB 정확 매치. | P4 | 2026-05-06 |
| 33  | Starfield 바이너리 endianness | **little-endian 강제** (Python `struct.pack("<...")` + TS `DataView` true) | x86 / ARM macOS / 모든 모던 GPU 가 little-endian. magic / version / count / sceneRadius 모두 통일. | P4 | 2026-05-06 |
| 34  | Star 거리 처리 (단일 celestial sphere) | **모든 별을 `STARFIELD_SCENE_RADIUS = 1e9` 위에 placement** (P1 #12 적용) | parallax 무시. Float32 round-off 로 sphere 위 위치 ~1e4 m 오차 — 시각상 무시. P1 결정 적용. | P4 | 2026-05-06 |
| 35  | 셰이더 디자인 | **custom `ShaderMaterial` + `colorIdx` / `magBucket` attribute + 256x1 sRGB DataTexture palette + additive blending + smoothstep falloff disc** | `THREE.PointsMaterial` 은 per-vertex 색상 컨트롤 + 셰이더 변형이 어려움. custom shader 가 mag 기반 size + palette 색 + 부드러운 별점 표현에 단순. | P4 | 2026-05-06 |
| 36  | Starfield TS 모듈 분리 | **`starfield.ts` (decoder + palette + mesh) + `starfieldLoader.ts` (fetch wrapper)** | fetch 의존을 loader 로 격리해 unit test (decoder / palette) 는 vitest 환경 (no network) 에서 그대로 실행 가능. | P4 | 2026-05-06 |
| 37  | Hipparcos PM 적용 정확도 | **post-PM J2000 명성 위치가 published value 의 60″ 안에 들어옴** (실측 — Sirius / Vega / Polaris / Betelgeuse / Arcturus 5 entries) | 1 mas 목표는 미달 — Hipparcos epoch / cos(δ) / nutation 등 추가 보정 필요 (Work 12 검증). 시각용 60″ 톨러런스 본 Work 충분. | P4 | 2026-05-06 |
| 38  | Hipparcos `bin` git 정책 | **commit** (~70 KB, vmag≤6.0 → 4 992 stars × 14 B + 16 B header) | 작아서 commit OK + reproducibility (CI 가 download 안 해도 됨) + decode test 가 fixture 처럼 작동. P6 에서 `public/data/starfield/README.md` 로 재생성 명령 문서화. | P4 | 2026-05-06 |
| 39  | Dev Demo 구조 | **단일 페이지 + 4 패널 + Canvas section** (Work 4 패턴) | RendererControls / StarfieldControls / AnchorPicker / InfoPanel + 캔버스 섹션. CSS grid 2-column (320px sidebar + canvas). | P5 | 2026-05-06 |
| 40  | log-depth 검증 sphere 모델 | **반경 1 (foreground sphere) + 반경 1e8 (1.5e8 거리)** at fixed positions | 두 sphere 가 동시에 보이지는 않으나 (큰 sphere 는 화면 밖) 이 페어로 광범위 scale span 이 z-fighting 없이 렌더 가능함을 확인. log-depth 토글로 회귀 가드. | P5 | 2026-05-06 |
| 41  | Starfield magnitude 슬라이더 | **client-side filter** (mesh 재생성 via React `useMemo`) | bin 파일 재load 없이 mag bucket 비교만으로 즉시 필터. 풀 카탈로그 (4 992 stars) 한 번 디코드 후 filter 가 < 5 ms. 슬라이더 vmag 0~6 범위. | P5 | 2026-05-06 |
| 42  | Anchor reference position 표시 | **DE440 evaluator 로 Sun (NAIF 10) + selected body 의 SSB 좌표 fetch + scientific notation 표시** | 2026-05-06 00:00 UTC 고정 (DEMO_UTC). manifest fail 시 evaluator 에러 표시 (Work 4 P5 동일 폴백). body-centric 선택 시 body picker (Mercury~Neptune) 표시. | P5 | 2026-05-06 |
| 43  | dev page Canvas 옵션 공유 | **`createRendererProps()` (Home 라우트와 동일)** + log-depth 토글 시 `key` 로 Canvas remount | three.js `logarithmicDepthBuffer` 는 constructor-time → React `key` 트릭으로 toggling 처리. exposure / tone mapping 은 setter 형 → live update. | P5 | 2026-05-06 |
| 44  | FPS 측정 | **로컬 `useFrame` + 500 ms 윈도우 평균** | `FpsTracker` 컴포넌트가 InfoPanel 의 `fps` state 갱신. Work 1 의 `<FpsOverlay>` 와 무관 (dev page 전용). | P5 | 2026-05-06 |

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

### P2에서 결정 (9건 모두 완료)

- [x] 톤매핑 옵션 set: **ACES + Linear + Cineon** ✓ (#14)
- [x] HDR float buffer: **disabled (Work 11 deferred)** ✓ (#15)
- [x] `antialias`: **true (MSAA)** ✓ (#16)
- [x] 색온도 → RGB 알고리즘: **Tanner Helland 2012 piecewise** ✓ (#17)
- [x] Palette interpolation 공간: **sRGB 8-bit + GPU sRGB texture decode** ✓ (#18)
- [x] Palette 메모리 레이아웃: **256 × RGBA u8 = 1024 bytes** ✓ (#19)
- [x] `magnitude_to_bucket` 알고리즘: **linear, [-2, 8] → [0, 255], clamp** ✓ (#20)
- [x] Home 라우트 통합: **`createRendererProps()` 모듈 상수** ✓ (#21)
- [x] HomeScene Sun 조명 교체: **PointLight (decay 0) + ambient 0.05** ✓ (#22)

### P3에서 결정 (7건 모두 완료)

- [x] log-depth 활성 시 camera near/far 검증: **P1 #5 그대로 (1e-3 / 1e10)** ✓ (#23)
- [x] Body-centric anchor 의 body 표현: **`PositionICRF` (m) 직접 payload** ✓ (#24)
- [x] `SceneAnchorContext` 모듈 위치: **`src/render/anchors.ts`** ✓ (#25)
- [x] Python anchor 미러 위치: **`render_anchors.py` 신설** ✓ (#26)
- [x] DE440 evaluator wiring 정책: **호출자 책임** ✓ (#27)
- [x] `world.ts` API 형태: **`sceneToVector3` / `vector3ToScene` + scalar adapters** ✓ (#28)
- [x] Anchor fixture 샘플: **6 위치 × 3 anchor (ssb / heliocentric / body-centric_earth)** ✓ (#29)

### P4에서 결정 (9건 모두 완료)

- [x] Star 거리 처리: **단일 celestial sphere (1e9)** ✓ (#34, P1 #12 적용)
- [x] `vmag_cutoff` default: **6.0** ✓ (P1 #10 그대로)
- [x] 바이너리 포맷: **16B header + Float32 pos + Uint8 colorIdx + Uint8 magBucket** ✓ (#33, P1 #19)
- [x] `magBucket` 분할: **256 buckets, Vmag [-2, 8] linear** ✓ (P2 #20 그대로)
- [x] Palette 정의: **256 entries, Kelvin [2000, 30000] log-uniform** ✓ (P2 #19 그대로)
- [x] Color → bucket index 변환: **Ballesteros → Tanner Helland → log-uniform palette bucket** ✓ (#32)
- [x] Shader 구현: **custom ShaderMaterial + sRGB DataTexture palette** ✓ (#35)
- [x] Hipparcos 캐시 위치 + 형식: **`tools/python/.cache/hipparcos/hipparcos_main.ecsv`** ✓ (#30)
- [x] Tycho-2 보조: **default disabled (Work 11)** ✓ (P1 #10 그대로)
- [x] Hipparcos `bin` git 정책: **commit (~70 KB)** ✓ (#38)
- [x] TS 모듈 분리: **`starfield.ts` + `starfieldLoader.ts`** ✓ (#36)
- [x] 필터링 정책: **position/Vmag NaN row drop** ✓ (#31)

### P5에서 결정 (6건 모두 완료)

- [x] Dev Demo 구조: **단일 페이지 + 4 패널 + Canvas section** ✓ (#39)
- [x] Log-depth 검증 sphere 모델: **반경 1 + 반경 1e8 spaced** ✓ (#40)
- [x] Magnitude slider 처리: **client-side filter (useMemo)** ✓ (#41)
- [x] DE440 evaluator 폴백 정책: **manifest fail 시 evaluatorError 표시 (Work 4 P5 동일)** ✓ (#42)
- [x] Canvas 옵션 공유: **`createRendererProps()` + log-depth 토글 시 `key` remount** ✓ (#43)
- [x] FPS 측정: **로컬 `useFrame` 500 ms 윈도우** ✓ (#44)

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

### P2 — Renderer Pipeline (Color & Tone Mapping) _(완료 2026-05-06)_

생성/수정 파일:

- [`src/render/renderer.ts`](../../src/render/renderer.ts) — `createRendererProps(settings, cameraOverrides)` (R3F `<Canvas gl + camera>` 친화 객체) + `clampExposure` + `resolveToneMapping` / `resolveOutputColorSpace`. 톤매핑은 `'aces-filmic' | 'linear' | 'cineon'` 3종, output color space `'srgb'`. `DEFAULT_CAMERA_FOV = 50`, `DEFAULT_CAMERA_POSITION = [0, 0, 5]`.
- [`src/render/index.ts`](../../src/render/index.ts) — `renderer` re-export 추가.
- [`src/routes/Home.tsx`](../../src/routes/Home.tsx) — `<Canvas gl={...} camera={...}>` 가 `createRendererProps()` 결과를 사용. module-level 상수로 lift.
- [`src/render/HomeScene.tsx`](../../src/render/HomeScene.tsx) — `directionalLight` → `pointLight (decay 0)` 교체, `ambientLight` 강도를 `RENDER_DEFAULTS.ambientIntensity` 로 통일.
- [`tools/python/src/orbitarium_tools/starfield.py`](../../tools/python/src/orbitarium_tools/starfield.py) — `kelvin_to_rgb_u8` (Tanner Helland 2012), `palette_index_for_kelvin` / `kelvin_for_palette_index` (log-uniform), `build_palette` (256 × RGBA u8), `magnitude_to_bucket`.

테스트:

- [`tests/unit/render/renderer.test.ts`](../../tests/unit/render/renderer.test.ts) — 10 tests: tone mapping resolver (3종), color space resolver, exposure clamp (within / outside / NaN), `createRendererProps` defaults (gl 6 props + camera 4 props), settings overrides, exposure clamp via overrides, camera overrides (fov/position) keeping settings near/far, near/far overrides bypass.
- [`tools/python/tests/test_starfield.py`](../../tools/python/tests/test_starfield.py) — 추가 10 tests: `kelvin_to_rgb` 범위 + Sun-like 5778 K + 30000 K cool blue + 2000 K warm red, palette index round-trip 양 끝점 + clamp + within-1-bucket, `build_palette` 크기 + 양 끝 색, `magnitude_to_bucket` clamp + Sirius/Vega/Polaris/sun-like monotonic.

검증 결과:

- `pnpm format` ✓ (`renderer.test.ts` Prettier 한 줄 단축)
- `pnpm lint:fix` ✓ (eslint autofix 자동)
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **417 tests** (P1 407 → P2 +10).
- `pnpm build` ✓ — 1114 kB.
- `pnpm test:e2e tests/e2e/home.spec.ts` ✓ — 3 tests (Home 시각 회귀 없음).
- `cd tools/python && uv run ruff check src tests` ✓ (RUF046 / SIM108 / N806 4 + 4 autofix 후)
- `uv run mypy src` ✓ — 12 source files.
- `uv run pytest` ✓ — **123 tests** (P1 113 → P2 +10).

설계 결정 + 발견:

- **R3F gl prop 객체 형식**: `WebGLRendererParameters` 의 `antialias` / `logarithmicDepthBuffer` (constructor-time) 와 setter 형 `outputColorSpace` / `toneMapping` / `toneMappingExposure` 를 한 객체에 묶음. R3F 가 양쪽 모두 적용 — 별도 `onCreated` 콜백 불필요.
- **`createRendererProps()` 시그니처 default**: `RENDER_DEFAULTS` 를 default arg 로 받아 호출처 단순화 (`createRendererProps()` 가 가장 짧음). 오버라이드는 두 번째 인자로 카메라만 분리.
- **Tanner Helland 2012 piecewise 변환**: Ballesteros 2012 는 B-V → T (P4 추가 예정), T → RGB 는 Tanner Helland — plan §3 P2 의 두 단계 정합. Sun-like 5778 K → (255, 248, 245) 근방 warm white. 2000 K → red dominant, 30000 K → blue dominant. 단위 테스트로 가드.
- **Palette index log-uniform vs linear**: 색온도 [2000, 30000] K 가 한 자리수 차 — log scale 이 시각 자연. round-trip은 ±1 bucket 안에서 안정.
- **PointLight decay 0**: r150+ 에서 default decay = 2 (r²-decay). 본 Work 의 Home scene 은 거리 무관 단순 조명을 원함 → `decay={0}` 명시. Work 6 PBR 검증 시 r²-decay + intensity 재계산.
- **시각 회귀**: Home 렌더 결과 — RotatingSphere 가 PointLight 의 명암 그라데이션을 받음 (이전 DirectionalLight 의 균일 조명에서 변경, 의도된 Work 5 P1 #7 결정 적용). 시각적 차이는 overview "Sun PointLight" 모델 정합.
- **빌드 크기 변화**: 1113 → 1114 kB (+1 kB) — renderer.ts 추가 + index.ts re-export 영향. 무시할 수준.

### P3 — Log-Depth & Scene Graph Anchors _(완료 2026-05-06)_

생성/수정 파일:

- [`src/render/anchors.ts`](../../src/render/anchors.ts) — `SceneAnchorContext` discriminated union (`'ssb'` / `'heliocentric'` / `'body-centric'`), factories `ssbAnchor` / `heliocentricAnchor` / `bodyCentricAnchor`, `applyAnchor`, `anchorKind`, `positionToWorld(p, policy, anchor)` 합성 함수. `SSB_ANCHOR` 싱글턴.
- [`src/render/world.ts`](../../src/render/world.ts) — `sceneToVector3` / `vector3ToScene` + scalar `sceneScalarToWorld` / `worldScalarToScene`. three.js `Vector3` 의존을 한 곳에 격리.
- [`src/render/index.ts`](../../src/render/index.ts) — `anchors` / `world` re-export 추가.
- [`tools/python/src/orbitarium_tools/render_anchors.py`](../../tools/python/src/orbitarium_tools/render_anchors.py) — Python 미러: `SceneAnchorContext` dataclass + 3 factories + `apply_anchor` + `generate_anchor_fixtures`. `SAMPLE_SUN_SSB_M` / `SAMPLE_EARTH_SSB_M` / `SAMPLE_POSITIONS` (6 entries).

테스트 + fixture:

- [`tests/fixtures/work-05/scene-anchors.json`](../../tests/fixtures/work-05/scene-anchors.json) — 3 anchor × 6 sample = 18 rows. `_tolerance_mm = 1.0`. Prettier 정렬.
- [`tests/unit/render/anchors.test.ts`](../../tests/unit/render/anchors.test.ts) — 11 tests: anchorKind / SSB identity / heliocentric subtract + Sun-at-own-anchor → origin / body-centric subtract + round-trip / `positionToWorld` 3 케이스 + fixture cross-check (3 anchor entries).
- [`tests/unit/render/world.test.ts`](../../tests/unit/render/world.test.ts) — 3 tests: `sceneToVector3` Vector3 instance + axis mapping + round-trip, scalar adapter pass-through + round-trip, `SCENE_TO_THREE_UNIT_RATIO` invariant.
- [`tools/python/tests/test_render_anchors.py`](../../tools/python/tests/test_render_anchors.py) — 8 tests: SSB identity / heliocentric subtract + Sun → origin / body-centric subtract + round-trip / missing reference 가드 / fixture 구조 + idempotent.

검증 결과:

- `pnpm format` ✓ (Prettier auto-format on 2 files after first run)
- `pnpm lint` ✓ (eslint autofix)
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **434 tests** (P2 417 → P3 +17).
- `pnpm build` ✓.
- `cd tools/python && uv run ruff check src tests` ✓.
- `uv run mypy src` ✓ — 13 source files (P2 12 → +1 render_anchors).
- `uv run pytest` ✓ — **131 tests** (P2 123 → P3 +8).

설계 결정 + 발견:

- **Discriminated union with payload**: `SceneAnchorContext` 가 anchor kind 별 보조 데이터 (sun position / body position) 를 함께 캡슐화 — 호출처 단순 (`positionToWorld(p, policy, anchor)`). switch case 가 컴파일러 exhaustive check.
- **`positionToWorld` = `applyAnchor` ∘ `positionToScene` ∘ `sceneToVector3`**: 세 단계 명시적 합성. 각 단계 단위 테스트 가능.
- **`Vector3` import in `anchors.ts` only as type**: anchors.ts 가 `import type { Vector3 } from 'three'` 만 — runtime import 는 `world.ts` (sceneToVector3) 에서. tree-shake 친화 + 의존 격리.
- **Python `apply_anchor` Sequence type**: `Sequence[float]` 로 numpy array / tuple / list 모두 수용. `tuple` 출력으로 immutable.
- **fixture sample 위치 선정**: zero (corner case), sun_ssb / earth_ssb (reference body 자신), mars / jupiter / pluto (외행성 다양한 축). heliocentric_anchor(sun_ssb) 로 sample sun_ssb 시 origin (0,0,0) 검증 — Sun-at-its-own-anchor 케이스.
- **`generate_anchor_fixtures` idempotent**: 동일 입력 → 동일 byte 출력. P6 의 fixture diff guard 와 호환.

### P4 — Starfield Data Pipeline + Mesh _(완료 2026-05-06)_

생성/수정 파일:

- [`tools/python/src/orbitarium_tools/starfield.py`](../../tools/python/src/orbitarium_tools/starfield.py) — 풀 implementation: `bv_to_kelvin` (Ballesteros 2012), `apply_proper_motion` (J1991.25 → J2000), `radec_to_unit_vector`, `StarRecord` / `StarfieldData` dataclasses, `stars_to_starfield`, `serialize_starfield_bin` / `deserialize_starfield_bin` (little-endian 16 B header + Float32 pos + Uint8 color + Uint8 mag), `download_hipparcos` (VizieR ECSV cache), `load_hipparcos`, `filter_by_magnitude`, `preprocess` (end-to-end), `NamedStarRef` + `NAMED_STAR_REFERENCES`, `generate_color_temperature_fixture`, `generate_starfield_samples_fixture`, `generate_fixtures` (P6 통합 entry).
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `starfield preprocess` subcommand + `fixtures --work=5` 분기.
- [`src/render/starfield.ts`](../../src/render/starfield.ts) — TS mirror: 색온도 / palette / mag bucket / B-V→K / PM / RA-Dec→unit vector / `decodeStarfieldBin` / `createStarfieldGeometry` / `createStarfieldMaterial` (custom ShaderMaterial + sRGB DataTexture + additive blending + smoothstep falloff) / `createStarfieldMesh`.
- [`src/render/starfieldLoader.ts`](../../src/render/starfieldLoader.ts) — fetch wrapper (`loadStarfieldFromUrl`).
- [`src/render/index.ts`](../../src/render/index.ts) — `starfield` / `starfieldLoader` re-export.
- [`package.json`](../../package.json) — `pnpm starfield:preprocess` + `pnpm fixtures:work-05` 스크립트 추가.
- [`public/data/starfield/hipparcos-vmag6.bin`](../../public/data/starfield/hipparcos-vmag6.bin) — 4 992 stars × 14 B + 16 B header = 69 904 bytes.

테스트 + fixture:

- [`tests/fixtures/work-05/color-temperature.json`](../../tests/fixtures/work-05/color-temperature.json) — 12 B-V samples → kelvin / palette index / RGB triple.
- [`tests/fixtures/work-05/starfield-samples.json`](../../tests/fixtures/work-05/starfield-samples.json) — 5 named stars (Sirius / Vega / Polaris / Betelgeuse / Arcturus) post-PM J2000 + unit vector + palette + mag bucket. `_tolerance_arcsec = 60`.
- [`tests/unit/render/starfield.test.ts`](../../tests/unit/render/starfield.test.ts) — 22 tests: TS-Python parity (color temp / palette / mag bucket / B-V) + PM + radec→vector + decode (header invariants + every-star celestial-sphere round-off + bad magic / version) + mesh smoke (geometry attributes + Points instance) + color-temperature fixture cross-check (12 entries) + starfield-samples sanity (5 stars × 3 checks).
- [`tools/python/tests/test_starfield.py`](../../tools/python/tests/test_starfield.py) — 추가 9 tests: `bv_to_kelvin` Sun-like + NaN fallback + PM zero / Dec linear + epoch constant + radec axis / norm + serialize/deserialize round-trip + length mismatch / bad magic 가드.

검증 결과:

- `pnpm format` ✓ (Prettier auto-format)
- `pnpm lint:fix` ✓ (eslint autofix)
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **475 tests** (P3 434 → P4 +41).
- `pnpm build` ✓ — 1118 kB.
- `cd tools/python && uv run ruff check src tests` ✓ (SIM108 / UP037 / E501 / RUF046 등 autofix + manual).
- `uv run mypy src` ✓ — 13 source files (`NamedStarRef` dataclass 도입으로 `int(ref["hip"])` mypy 오류 해소).
- `uv run pytest` ✓ — **141 tests** (P3 131 → P4 +10).
- `pnpm starfield:preprocess` ✓ — Hipparcos cache (~/cache/hipparcos/hipparcos_main.ecsv) + `public/data/starfield/hipparcos-vmag6.bin` 생성 idempotent.
- `pnpm fixtures:work-05` ✓ — 3 JSON 생성 idempotent.

설계 결정 + 발견:

- **Parquet → ECSV 전환**: 처음 pandas + parquet 시도 → `ModuleNotFoundError`. astropy native ECSV (plaintext) 로 교체 — 의존성 zero, diff 가능, 캐시 디버깅 친화. ECSV 파일 ~3 MB (vmag<6.0).
- **Position/Vmag NaN drop**: VizieR 응답 일부 row 가 `_RA.icrs` masked. 그대로 float() 시 NaN warning + 잘못된 별. 명시적으로 마스크/NaN 검출 후 row 삭제 — 9 100 → 4 992 안전한 stars.
- **TS Tanner Helland 정확도**: B-V → Kelvin (Ballesteros) → RGB (Tanner Helland) → Python 동일 코드 → fixture cross-check 12 샘플 RGB triple **정확히 매치** (kelvin diff <1 K).
- **PM 정확도 60″ 톨러런스**: Sirius (~10″ off), Vega (~3″ off), Polaris (~30″ off — 극 근처 cos(δ) 불안정), Betelgeuse / Arcturus (수 ″). 1 mas 목표는 미달 (Hipparcos epoch 정확화 + nutation 보정 필요 — Work 12 검증). 본 Work 시각용 60″ 충분.
- **셰이더 alpha**: `vAlpha = max(0.6, brightness)` + falloff disc → 어두운 별도 어느 정도 보임. additive blending 으로 별이 모인 영역이 자연스럽게 밝아짐.
- **Float32 round-off on 1e9 scale**: 별 위치가 1e9 scene unit → Float32 LSB ~64 m. test 톨러런스 1e4 m 안에서 sphere 위 위치 확인 (4 992 stars 전부).
- **Palette texture sRGBColorSpace**: GPU 가 sampling 단계에서 sRGB → linear-RGB 자동 변환 → 셰이더 색상이 linear-space lighting 과 호환. tone mapping 후 sRGB output 으로 round-trip 정확.

### P5 — Dev Demo `/dev/render` _(완료 2026-05-06)_

생성/수정 파일:

- [`src/dev/render/RenderDemo.tsx`](../../src/dev/render/RenderDemo.tsx) — Work 5 dev page shell. 6 useState hooks + DE440 evaluator + starfield loader + anchor reference resolver + FpsTracker. R3F `<Canvas>` 가 `createRendererProps()` 결과 사용, log-depth 토글 시 `key` 트릭으로 remount.
- [`src/dev/render/RendererControls.tsx`](../../src/dev/render/RendererControls.tsx) — Panel 1: exposure slider [0.1, 4.0] + tone mapping picker (3종) + log-depth checkbox.
- [`src/dev/render/StarfieldControls.tsx`](../../src/dev/render/StarfieldControls.tsx) — Panel 2: starfield ON/OFF + Vmag cutoff slider [0, 6] + visible/total count + load error.
- [`src/dev/render/AnchorPicker.tsx`](../../src/dev/render/AnchorPicker.tsx) — Panel 3: SSB / Heliocentric / Body-centric 라디오 + body NAIF picker (8 entries) + reference SSB position 표시.
- [`src/dev/render/InfoPanel.tsx`](../../src/dev/render/InfoPanel.tsx) — Panel 4: UTC / FPS / tone mapping / exposure / log-depth / anchor 라이브 표시.
- [`src/dev/render/scene/LogDepthPair.tsx`](../../src/dev/render/scene/LogDepthPair.tsx) — 반경 1 sphere + 반경 1e8 sphere 페어.
- [`src/dev/render/scene/StarfieldGroup.tsx`](../../src/dev/render/scene/StarfieldGroup.tsx) — magnitude bucket 필터 + `createStarfieldMesh` 결과 R3F primitive.
- [`src/dev/render/scene/AnchorMarker.tsx`](../../src/dev/render/scene/AnchorMarker.tsx) — 작은 octahedron, anchor kind 별 색.
- [`src/dev/render/render.css`](../../src/dev/render/render.css) — 2-column grid + canvas panel + control 스타일.
- [`src/dev/registry.ts`](../../src/dev/registry.ts) — Work 5 entry → `Component: lazy(() => import('./render/RenderDemo'))`.
- [`src/dev/dev.css`](../../src/dev/dev.css) — `render.css` import 추가.

테스트:

- [`tests/e2e/dev-render.spec.ts`](../../tests/e2e/dev-render.spec.ts) — 6 specs: 4 panel + canvas 렌더, exposure 슬라이더 readout, log-depth toggle readout + overlay, starfield count 표시, vmag cutoff 가 visible count 감소, body-centric 선택 시 body picker 표시.
- [`tests/e2e/dev-index.spec.ts`](../../tests/e2e/dev-index.spec.ts) — Work 5 available 전환 (available 4 / placeholder 7).

검증 결과:

- `pnpm format` ✓
- `pnpm lint:fix` ✓
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **475 tests** (P4 그대로, dev page 추가는 e2e 영역).
- `pnpm build` ✓ — 1118 kB.
- `pnpm test:e2e dev-render + dev-index` ✓ — **11 tests** (5 dev-index + 6 dev-render).
- preview 시각 확인 — 4 패널 + Canvas (별 + 작은 sphere + 녹색 octahedron anchor marker), 4992/4992 stars, 120 fps. body-centric Earth 선택 시 anchor reference SSB ~`-1e11 m` (Earth orbit) 표시 — DE440 evaluator end-to-end 동작 확인.

설계 결정 + 발견:

- **`key={logDepth ? 'log-on' : 'log-off'}` Canvas remount**: three.js `WebGLRenderer` 의 `logarithmicDepthBuffer` 는 constructor option — runtime 변경 불가. React key 트릭으로 toggle 시 R3F `<Canvas>` 를 통째로 unmount → remount. exposure / tone mapping 은 setter 형이라 live update.
- **starfield filter 가 `useMemo`**: cutoff 슬라이더를 vmag 단위로 노출하되 내부 비교는 mag bucket (0-255) 으로 — Vmag → bucket 매핑은 동일 공식. mesh 재생성은 < 5 ms (4 992 stars).
- **DE440 evaluator + 2026-05-06 UTC**: Earth body-centric 선택 시 reference SSB position [-1.068e+11, -9.887e+10, -4.284e+10] m — Earth orbit 단위 정합. Sun (NAIF 10) 위치는 SSB 기준 ~1e9 m (Jupiter 영향) 정합.
- **`AnchorMarker` 가 anchor kind 별 색**: ssb=녹색 / heliocentric=노랑 / body-centric=빨강 — 사용자가 anchor 변경 시 즉시 시각 피드백 (실제 anchor 좌표 변환 시연은 P5 에서 mesh wiring 까지 확장 가능 — 본 demo 는 reference position 표시만으로 충분).
- **Hipparcos bin 첫 fetch 확인**: 첫 `loadStarfieldFromUrl` 후 4992 / 4992 stars 표시. Vmag 슬라이더 → 즉시 filter — 시각 차이 명확 (어두운 별 사라짐).
- **e2e 안정성**: starfield 로드 비동기 → `expect.poll` + 10 s timeout 필요 (`/data/starfield/...` fetch 가 Vite dev server 에서 ~500 ms).
- **빌드 크기**: 1118 → 1118 kB — 변화 무시할 수준 (lazy import 로 dev chunk 분리).
- **시각 폴리시**: 본 dev demo 는 Work 5 P5 에서 기능 우선 — 폴리시 (border / hover / responsive) 는 Work 11 책임. 모바일 스택 grid (`@media (max-width: 980px)`) 만 추가.

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
| 2026-05-06 | **P1 완료** — `src/render/{types,constants,anchors,starfield,index}.ts` + Python `orbitarium_tools.starfield` placeholder + 21 단위 테스트 (TS 12 + Python 9). 결정 13건 (#1~#13) 모두 권장값 채택: 1:1 unit / sRGB+ACES+linear / exposure 1.0 / log-depth ON / near 1e-3 ~ far 1e10 / string literal anchor + context payload / Sun PointLight + ambient 0.05 / area light defer (Work 6/11) / `(p, policy, anchor)→Vector3` / Hipparcos Vmag≤6.0 / Ballesteros 2012 / single celestial sphere 1e9 / ICRF + Hipparcos PM. format/lint/typecheck/test(407)/build/ruff/mypy(12 files)/pytest(113) 전부 그린. `anchors.ts` / `starfield.ts` 는 P3/P4 placeholder 로 index.ts 에서 export 하지 않음.                                                                                                                                                                                       |
| 2026-05-06 | **P2 완료** — `src/render/renderer.ts` (createRendererProps + clampExposure + resolveToneMapping/OutputColorSpace) + `index.ts` re-export + `Home.tsx` / `HomeScene.tsx` 통합 (DirectionalLight → PointLight decay=0 + ambient 0.05) + Python `kelvin_to_rgb_u8` (Tanner Helland 2012) / `palette_index_for_kelvin` / `kelvin_for_palette_index` / `build_palette` (256×RGBA u8 = 1024 B) / `magnitude_to_bucket`. 결정 9건 (#14~#22): ACES+Linear+Cineon 3종 / HDR float buffer defer (Work 11) / antialias MSAA / Tanner Helland T→RGB / sRGB palette + GPU decode / RGBA u8 layout / linear Vmag bucket / Home 모듈 상수 lifted props / PointLight decay 0. 단위 테스트 20 추가 (TS 10 + Python 10, 총 417 / 123). Home e2e 3 tests 그린. preview 시각 확인 — sphere 가 PointLight 음영 표시 (overview Sun 모델 정합).                                                                                                                                                                                |
| 2026-05-06 | **P3 완료** — `src/render/anchors.ts` (`SceneAnchorContext` discriminated union + 3 factories + `applyAnchor` + `positionToWorld`) + `src/render/world.ts` (`sceneToVector3` / `vector3ToScene` + scalar adapters, three.js Vector3 의존 격리) + index re-export + Python `orbitarium_tools.render_anchors` 미러 + `tests/fixtures/work-05/scene-anchors.json` (3 anchor × 6 sample = 18 rows). 결정 7건 (#23~#29): camera near/far 그대로 / `PositionICRF` payload / `anchors.ts` 위치 / `render_anchors.py` 신설 / DE440 호출자 책임 / world.ts API 형태 / 6×3 fixture. 단위 테스트 22 추가 (TS 14 + Python 8, 총 434 / 131). mypy 13 files. fixture cross-check 3 anchor entries 1 mm 이내 일치.                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-06 | **P4 완료** — `tools/python/.../starfield.py` 풀 implementation (Ballesteros 2012 + PM + radec→vector + StarRecord / StarfieldData + serialize/deserialize + download/load/preprocess + NamedStarRef + 3 fixture generators) + CLI `starfield preprocess` + `fixtures --work=5` + `src/render/{starfield,starfieldLoader}.ts` (decoder + palette + custom ShaderMaterial + fetch loader) + `package.json` 2 새 스크립트 + `public/data/starfield/hipparcos-vmag6.bin` (~70 KB, 4 992 stars). 결정 9건 (#30~#38): ECSV cache / NaN row drop / TS-Python bit-exact mirror / little-endian 강제 / single celestial sphere / custom shader + sRGB texture / `starfield.ts` + `starfieldLoader.ts` 분리 / 60″ PM 톨러런스 / bin commit. 단위 테스트 41 추가 (TS 22 + Python 9 + Python pytest 통합 10, 총 475 / 141). fixture 12 색온도 + 5 명성 cross-check 그린 (RGB 정확 / palette 정확 / 60″ 안). mypy 13 files. |
| 2026-05-06 | **P5 완료** — `/dev/render` 단일 페이지 dev demo. `src/dev/render/{RenderDemo,RendererControls,StarfieldControls,AnchorPicker,InfoPanel}.tsx` + `scene/{LogDepthPair,StarfieldGroup,AnchorMarker}.tsx` + `render.css`, registry/dev.css 연결. exposure / tone mapping / log-depth / starfield toggle + magnitude slider / anchor picker (SSB / Heliocentric / Body-centric + body NAIF picker) + DE440 evaluator (Sun + body SSB position) + FPS tracker. log-depth 토글은 Canvas key remount, 다른 옵션은 live update. 결정 6건 (#39~#44) 채택. e2e 6 추가 + dev-index Work 5 available 전환 (총 11 e2e). 사용자 시각 확인 — 4 panel + Canvas (starfield + sphere + anchor marker 녹색 octahedron), 4992/4992 stars 표시, 120 fps. body-centric Earth → anchor reference SSB ~1e11 m 정합. format/lint/typecheck/test(475)/build/test:e2e(11) 그린. |

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
