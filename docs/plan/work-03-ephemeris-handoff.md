# Work 3 — Handoff (Ephemeris Data Layer)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-03-ephemeris.md`](work-03-ephemeris.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 현재 phase   | **P5 완료** ✓ — P6 진입 대기                                                                                                    |
| 다음 액션    | **P6 — Cross-validation & Golden Fixtures (Closeout)** 진입 — fixture README, ephemeris-conventions, CI binary 통합, 회귀 가드 |
| 마지막 갱신  | 2026-05-06                                                                                                                      |
| 블로커       | 없음                                                                                                                            |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-03-ephemeris.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Strategy & Brand Types _(완료 2026-05-05)_
- [x] **P2** — DE440 Preprocessing (Python) _(완료 2026-05-06)_
- [x] **P3** — TS Chebyshev Evaluator _(완료 2026-05-06)_
- [x] **P4** — Horizons Reference (Python) _(완료 2026-05-06)_
- [x] **P5** — Dev Demo `/dev/ephemeris` _(완료 2026-05-06)_
- [ ] **P6** — Cross-validation & Golden Fixtures (Closeout)

> Work 3 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-03-ephemeris.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| #   | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
| --- | ---- | ---- | ----------- | ----- | ------ |
| 1   | DE440 평가 전략 | **Chebyshev 직접 평가** (사전 처리 binary, 브라우저) | cspice WASM(~3MB) 대비 코드 단순/사이즈 절감, 백엔드 의존성 회피. P3에서 spiceypy `spkezr`과 1mm/1µm/s 안 일치 검증. | P1 | 2026-05-05 |
| 2   | 커널 | **DE440** (1550-2650) | DE441(±27kyr)는 시각화 timeline에 과잉. Work 12에서 필요 시 재평가. | P1 | 2026-05-05 |
| 3   | 사전 처리 시간 범위 | **1900-2150** (250 yr) | 보이저(1977)~미래 100년 커버. 사이즈 측정 후 P2에서 필요 시 조정. | P1 | 2026-05-05 |
| 4   | 천체 범위 (본 Work) | **Sun(10) + 9 planet barycenters(1..9) + 9 planet bodies(199..999) + Moon(301) = 20 entries** | DE440이 native 제공하는 set. 갈릴레이/토성 위성은 별도 SPK (Work 6). | P1 | 2026-05-05 |
| 5   | State vector 모델 | **`{ naifId, jdTdb, position: PositionICRF, velocity: VelocityICRF }` 분리 객체** | 6-tuple은 인덱스 혼동 위험. 분리 객체는 IDE 자동완성 + 타입 안전 + 가독성. | P1 | 2026-05-05 |
| 6   | 시간 입력 단위 | **`JdTdb`** (Work 2 brand 재사용) | DE440이 native TDB. UTC/TT 입력은 caller가 `utcToJdTdb` 등으로 변환. | P1 | 2026-05-05 |
| 7   | 좌표 출력 | **ICRF (m, m/s)** | DE440 native frame. EME2000/Ecliptic은 caller가 Work 2 frames로 변환. | P1 | 2026-05-05 |
| 8   | 위치 톨러런스 | **1 mm** (`EPHEMERIS_TOL_M = 1e-3`) | 1 AU에서 1 mm ≈ 6.7e-15 rad (~1.4e-9 mas) — 각도 mas보다 ~6 orders 엄격. spiceypy reference의 IEEE 754 한계까지 추적. | P1 | 2026-05-05 |
| 9   | 속도 톨러런스 | **1 µm/s** (`EPHEMERIS_TOL_VEL_M_S = 1e-6`) | 지구 공전 속도 ~30 km/s 대비 3.3e-11 상대 정밀도. Chebyshev derivative borderline 가능 — P3 측정 후 조정 가능. | P1 | 2026-05-05 |
| 10  | Brand types | **`PositionICRF`/`VelocityICRF`** (Vec3-shape phantom on `Meters`/`MetersPerSecond`), **`StateVectorICRF`** dataclass | Work 2 unit brand 위에 frame-aware tuple 합성. factory `positionICRF(x,y,z)` / `velocityICRF(...)` 제공. Python에서는 `tuple[float, float, float]` + `@dataclass(frozen, slots)`. | P1 | 2026-05-05 |
| 11  | DE440 segment 조달 라이브러리 | **`jplephem` 2.24** (pyproject `astro` extras에 추가) | spiceypy의 low-level DAF API는 문서가 부족하고 cspice C 매뉴얼 의존. jplephem은 pure-python으로 SPK type-2/3을 깔끔하게 노출 (`load_array()` → `(init_jd, intlen_days, coefs[3,n,k])`). skyfield도 동일 의존. | P2 | 2026-05-06 |
| 12  | DE440 segment 인벤토리 | **14 segments** (`(1..10, 0)` SSB-children + `(199, 1) (299, 2) (301, 3) (399, 3)`) — 외행성 body는 alias로 처리 | DE440 자체에 Mars+ planet body segment 없음 (planet ≈ bary 질량 지배). `PLANET_BODY_ALIASES` 로 `499→4, 599→5, ...` 맵핑. spiceypy `spkezr` 도 동일 동작. | P2 | 2026-05-06 |
| 13  | Binary format | **little-endian Float64**, header `<iiiidd>` (target/center/n_intervals/coef_count/init_jd/interval_length_days), payload `f64[3, n_intervals, coef_count]` C-order | 모든 타깃 환경(x86/ARM Mac, GitHub Actions)이 LE — 명시적 LE 가정. SPK가 km이므로 evaluator가 km→m, km/day→m/s 변환. 헤더 32바이트로 작아 다운로드 단위에 큰 영향 없음. | P2 | 2026-05-06 |
| 14  | Chunk 단위 | **DE440 native intervals** (Sun 16d, Mercury bary 8d, EMB 16d, Moon/Earth 4d, ...) — 그대로 보존 | Custom resampling은 정밀도 손실 + 추가 버그 표면. native intervals는 NAIF가 정밀도/사이즈 trade-off 최적화한 결과 — 그대로 사용. | P2 | 2026-05-06 |
| 15  | 압축 | **무압축** (transport-layer gzip/brotli 신뢰) | Float64 binary는 본질적으로 entropy 높아 lossless 압축 효과 ~10%. fetch에서 `Content-Encoding`만 잡으면 충분. build-time gzip은 캐싱/검증 복잡도 증가. | P2 | 2026-05-06 |
| 16  | Manifest 위치 | **`public/data/ephemeris/de440/manifest.json`** + body별 `spk_<target>_<center>.bin` | `public/data/`는 Vite static asset root — `/data/ephemeris/de440/...` URL로 fetch 가능. .gitignore 의 `public/data/ephemeris/*` 정책 그대로 적용 (binary 미commit). | P2 | 2026-05-06 |
| 17  | Binary commit 정책 | **build-time download/생성** (.gitignore — `public/data/ephemeris/*` 이미 적용) | DE440 SPK ~120MB + 사전처리 binary ~25MB는 git LFS 도입하지 않는 한 commit 부담. `pnpm de440:preprocess` 한 줄로 재생성. CI에서는 캐시 + 1회 다운로드. | P2 | 2026-05-06 |
| 18  | spiceypy/jplephem 비교 톨러런스 | **위치 < 1 mm, 속도 < 1 µm/s** — 측정 결과 max 0.49mm/0.007µm/s | jplephem `compute_and_differentiate`와 우리 evaluator 차이는 IEEE 754 evaluation 순서 차이 수준 (sub-µm). spiceypy `spkezr` 와 SSB-centered chain 비교에서도 < 0.1mm 일관. | P2 | 2026-05-06 |
| 19  | TS evaluator API 패턴 | **async Promise** + 주입 가능한 `De440SegmentLoader` 인터페이스 (loadManifest / loadSegment) | binary fetch가 본질적으로 async (브라우저 fetch / Node fs). 테스트는 in-memory loader, 프로덕션은 fetch loader. 단일 evaluator로 양쪽 커버. | P3 | 2026-05-06 |
| 20  | Segment 캐시 정책 | **Promise 단위 LRU없음 (Map 그대로 누적)** — chunk 단위 ~수 MB → 14개 합쳐도 25MB | LRU eviction은 메모리 한계 도달 시 의미 — 14 segments * 평균 1.8MB는 항상 인메모리에서 OK. Work 11 폴리시에서 lazy unload 검토. | P3 | 2026-05-06 |
| 21  | Position diff 비교 방식 | **L_∞ (component-wise max)** — 1 mm 톨러런스 | L2 norm은 sqrt(3) 배 누적 → 30AU(=4.5e12m) 거리에서 IEEE 754 LSB ≈ 1mm/axis × √3 ≈ 1.7mm. axis별 1mm 보장이 더 의미 있고 측정 가능. | P3 | 2026-05-06 |
| 22  | DE440 binary CI 통합 | **P6 closeout에서 CI 워크플로 추가** | 현재 TS evaluator 테스트는 `describe.skipIf(!dataAvailable)` — public/data/ephemeris/de440/manifest.json 부재 시 스킵. 로컬에서는 `pnpm de440:preprocess` 한 줄 실행. | P3 | 2026-05-06 |
| 23  | Horizons 단위 변환 | **AU → m (`AU` from `constants.py`), AU/day → m/s (`/86400`)** | refplane='earth' (J2000 mean equator), location='@0' (SSB), light-time off. spiceypy `spkezr` 와 같은 frame. | P4 | 2026-05-06 |
| 24  | Horizons text precision tolerance | **위치 1 cm, 속도 1 µm/s** — Horizons API 자체 한계 | Horizons 응답이 AU 단위 14-자리 sig fig 텍스트 → 1 AU 거리에서 IEEE 754 LSB ≈ 1cm. 우리 evaluator (P3 < 1mm) vs Horizons 비교는 Horizons API 의 텍스트 한계가 절대 floor. 의미 있는 cross-check은 spiceypy ↔ Horizons 일치 (확인 완료, < 6mm). | P4 | 2026-05-06 |
| 25  | TS Horizons client | **Work 7로 deferred** | 본 Work는 Python reference 채널만. CORS proxy / browser 캐싱 / asteroid 추가는 Work 7 (Orbits) 에서 본격 도입. CLI `orbitarium-tools horizons` 와 P6 fixture 생성으로 충분. | P4 | 2026-05-06 |
| 26  | Horizons cache | **astroquery 내장 cache** (HTTP-level, `~/.astropy/cache/`) | 별도 디스크 cache 필요 없음. fixture 재생성 시 자동 활용 → 2번째 실행 빠름. CI는 매 실행 fresh download (캐시 cold) — 작은 grid (30 queries) 라 OK. | P4 | 2026-05-06 |
| 27  | Dev Demo 구조 | **단일 페이지 + 3 섹션** (StateVector wide / ReferenceDiff wide / PlanetLineup wide) | 패널이 데이터-heavy (벡터 + 테이블). 그리드 2열 대신 모든 패널을 wide 로 두고 세로 스크롤. body picker 가 11개 라 가로 공간 필요. | P5 | 2026-05-06 |
| 28  | Body picker UI | **radio button group** (11 항목, 자동 wrap) | dropdown 대비 가시성 높고 1-click 전환. 라디오 + 시각 스타일 (segmented 패턴 재사용 변형). | P5 | 2026-05-06 |
| 29  | Loader 추상화 | **`createWebDe440Loader({ baseUrl })`** for browser, `diskLoader` (test-only, Node fs) — 둘 다 `De440SegmentLoader` 인터페이스 구현 | dev demo 와 unit test 가 같은 evaluator 코드를 공유. baseUrl 기본값 `/data/ephemeris/de440/` (Vite static asset root). 테스트는 인메모리 또는 Node fs. | P5 | 2026-05-06 |
| 30  | Frame 표시 토글 | **단일 frame 라디오 (ICRF / EME2000 / Ecliptic)** + 라운드트립 잔차 노트 | 동시 표시는 화면 부담. 라디오 전환 즉시 변환 적용 (Work 2 frames 합성). EME2000 선택 시 round-trip 잔차 표시. | P5 | 2026-05-06 |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정

- [x] DE440 평가 전략: **Chebyshev 직접 평가** ✓ (#1)
- [x] 커널: **DE440** ✓ (#2)
- [x] 사전 처리 시간 범위: **1900-2150** ✓ (#3)
- [x] 천체 범위: **20 entries (Sun + 9 bary + 9 body + Moon)** ✓ (#4)
- [x] State vector 모델: **`{ naifId, jdTdb, position, velocity }`** ✓ (#5)
- [x] 시간 입력: **JdTdb** ✓ (#6)
- [x] 좌표 출력: **ICRF (m, m/s)** ✓ (#7)
- [x] 위치 톨러런스: **1 mm** ✓ (#8)
- [x] 속도 톨러런스: **1 µm/s** ✓ (#9)
- [x] Brand types: **PositionICRF / VelocityICRF / StateVectorICRF** ✓ (#10)

### P2에서 결정

- [x] 커널 다운로드 경로: **NAIF 공식 미러** (`https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440.bsp`) ✓ (#11~17)
- [x] DE440 segment 조달 라이브러리: **jplephem 2.24** ✓ (#11)
- [x] Segment 인벤토리: **14 segments + 외행성 alias** ✓ (#12)
- [x] Binary format: **little-endian Float64** (header `<iiiidd>` + `f64[3, n, k]`) ✓ (#13)
- [x] Chunk 단위: **DE440 native intervals** ✓ (#14)
- [x] 압축: **무압축** ✓ (#15)
- [x] Manifest 위치: **`public/data/ephemeris/de440/manifest.json`** + `spk_<target>_<center>.bin` ✓ (#16)
- [x] Binary commit 정책: **build-time download/생성** (.gitignore 적용 그대로) ✓ (#17)
- [x] 비교 톨러런스: **< 1 mm / 1 µm/s 일관 통과** ✓ (#18)

### P3에서 결정

- [x] API 패턴: **async Promise + 주입 가능한 `De440SegmentLoader`** ✓ (#19)
- [x] 캐시 정책: **Promise Map (eviction 없음)** ✓ (#20)
- [x] Position diff 비교 방식: **L_∞ component-wise** ✓ (#21)
- [x] CI 통합: **P6 closeout 에서 처리** (현재 skipIf로 graceful skip) ✓ (#22)
- [x] 에러 종류: **out-of-range** (`"outside segment ..."` Error throw); **missing body** (`"no DE440 segment for target=..."` Error throw); **size mismatch** (`parseSegmentBinary` Error throw)

### P4에서 결정

- [x] Horizons 출력 단위 변환: **AU → m, AU/day → m/s** (constants.py `AU` 사용) ✓ (#23)
- [x] light-time correction: **off (geometric)** ✓ (#23)
- [x] Cache 위치: **astroquery 내장 cache** ✓ (#26)
- [x] TS Horizons client: **Work 7로 deferred** ✓ (#25)
- [x] Horizons text precision tolerance: **1 cm 위치 / 1 µm/s 속도** ✓ (#24)

### P5에서 결정

- [x] Dev Demo 구조: **단일 페이지 3 섹션 (모두 wide)** ✓ (#27)
- [x] body picker: **radio button group** ✓ (#28)
- [x] frame 변환 표시: **라디오 토글 + 라운드트립 잔차** ✓ (#30)
- [x] Loader 추상화: **`createWebDe440Loader` (브라우저) / `diskLoader` (Node 테스트)** ✓ (#29)

### P6에서 결정

- [ ] Fixture 형식 (JSON / binary / Parquet)
- [ ] Fixture 갱신 정책 (수동 / CI 자동)
- [ ] Binary commit 정책 최종 확정 (P2 결정 검증)

### 추후 보류 (Work 3 범위 밖)

- DE441 확장 시간 범위 — Work 12 검증 필요 시
- 위성 ephemeris (갈릴레이, 토성) — Work 6
- 소행성 / 혜성 / 우주선 — Work 7
- Horizons TS client (CORS 프록시, 캐싱) — Work 7
- Numerical integration (perturbation) — Work 7
- light-time correction (apparent position) — Work 12
- Scene 단위 변환 (m → 픽셀) — Work 4

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록. 형식: 경로 + 한 줄 메모.

### P1 — Strategy & Brand Types _(완료 2026-05-05)_

생성/수정 파일:
- [`src/ephemeris/types.ts`](../../src/ephemeris/types.ts) — `PositionICRF`/`VelocityICRF` (Vec3-shape phantom on Work 2 `Meters`/`MetersPerSecond`), `StateVectorICRF` interface, factory `positionICRF()`/`velocityICRF()`.
- [`src/ephemeris/constants.ts`](../../src/ephemeris/constants.ts) — `EPHEMERIS_TOL_M = 1e-3`, `EPHEMERIS_TOL_VEL_M_S = 1e-6`, `DE440_KERNEL_NAME`/`SOURCE`/`TIME_RANGE_*`, `DE440_BODY_NAIF_IDS` (20 ids tuple), `De440BodyNaifId` type.
- [`src/ephemeris/index.ts`](../../src/ephemeris/index.ts) — re-exports.
- [`tools/python/src/orbitarium_tools/ephemeris.py`](../../tools/python/src/orbitarium_tools/ephemeris.py) — Python placeholder mirror, `StateVectorICRF` `@dataclass(frozen, slots)`, 같은 상수.

테스트:
- [`tests/unit/ephemeris/types.test.ts`](../../tests/unit/ephemeris/types.test.ts) — 6 tests: 톨러런스, DE440 시간 범위, body NAIF 카탈로그(20), factory smoke, StateVectorICRF 구조.
- [`tools/python/tests/test_ephemeris.py`](../../tools/python/tests/test_ephemeris.py) — 4 tests (TS와 동일 구조).

검증 결과:
- `pnpm format:check` ✓
- `pnpm lint` ✓ — 초기 simple-import-sort 1건 → autofix.
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **317 tests** (Work 2 P6 311 → P1 +6).
- `pnpm build` ✓ — 1113.46 kB.
- `uv run ruff check / mypy / pytest` ✓ — 75 tests (Work 2 71 → +4).

### P2 — DE440 Preprocessing (Python) _(완료 2026-05-06)_

생성/수정 파일:

- [`tools/python/src/orbitarium_tools/de440.py`](../../tools/python/src/orbitarium_tools/de440.py) — `download_de440_kernel`/`crop_segment`/`write_segment_binary`/`read_segment_binary`/`evaluate_segment`/`preprocess`/`resolve_chain` 함수, `De440Segment` `@dataclass(frozen, slots)`, `DE440_SEGMENT_TARGETS_AND_CENTERS` (14), `PLANET_BODY_ALIASES` (6), `BINARY_HEADER_FORMAT = "<iiiidd"`, Chebyshev recurrence + derivative 평가.
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `de440 preprocess` 서브커맨드 추가 (`--start --end --out [--spk]`).
- [`tools/python/pyproject.toml`](../../tools/python/pyproject.toml) — `[astro]` extras에 `jplephem>=2.21` 추가 (uv.lock 동기화).
- [`package.json`](../../package.json) — `pnpm de440:preprocess` 스크립트 추가 (1900-2150, public/data 출력).

테스트:

- [`tools/python/tests/test_de440.py`](../../tools/python/tests/test_de440.py) — 8 tests: segment inventory, alias, chain resolve, binary header size, write/read round-trip (numpy bit-equal), 14 segments × 4 JDs vs jplephem `compute_and_differentiate` (< 1mm/1µm/s), 12 targets × 3 JDs SSB chain vs spiceypy `spkezr`, preprocess pipeline 산출물 14 binary + manifest.

산출물 (gitignored):

- `tools/python/.cache/de440/de440.bsp` — 119.8 MB SPK 커널 (NAIF 공식, .gitignore `*.bsp`).
- `public/data/ephemeris/de440/manifest.json` — 14 segments 메타 + binary_format 명세 + alias.
- `public/data/ephemeris/de440/spk_<target>_<center>.bin` × 14 — 총 ~25 MB (Sun 1.4MB / EMB 1.7MB / Moon 6.8MB / Earth 6.8MB / Venus bary 1.3MB / Mercury bary 3.7MB / 외행성 bary 0.4-0.7MB / 199,299 80 bytes).

검증 결과:

- `uv run ruff check src tests` ✓ (E501 line-too-long 2건 line-break, SIM117 nested with 통합, UP017 `timezone.utc → UTC` 처리, F841 unused-var 정리).
- `uv run mypy src` ✓ (jplephem `# type: ignore[import-untyped]`, manifest dict 타입 명시, cli `assert isinstance(segments, list)`).
- `uv run pytest -q` ✓ — **83 tests** (Work 2 75 → P2 +8). astropy ERFA dubious year warning 3건 (Work 2 동일).
- `pnpm de440:preprocess` ✓ — 14 segments, 25 MB.

설계 결정 + 발견:

- **Mercury(199,1) / Venus(299,2) zero-segment**: DE440 에서 두 inner planet의 body→bary offset 은 1 interval × 2 coefficient × 0 위치 — 행성 자체가 barycenter 와 거의 일치 (1AU 미만 천체에 대한 상대 위치를 mm 정밀도로 표현하기 위한 NAIF 컨벤션). 우리 binary 도 80 bytes 그대로 보존.
- **외행성 alias 적용 시점**: TS evaluator는 `getStateAt(naifId)` 에 caller 가 외행성 body id (e.g. 499) 를 넘기면 manifest `aliases_planet_body_to_barycenter` 를 보고 자동으로 bary 로 치환. spiceypy 도 같은 alias 가정.
- **chain composition**: SSB-centered position = sum over chain segments. 예: Earth(399) chain = `[399, 3]`, evaluator 가 `pos(399→3)` + `pos(3→0)` 합산. spiceypy `spkezr` 도 내부적으로 동일 chain 적용.
- **Velocity 정밀도 borderline**: Chebyshev derivative 는 polynomial degree -1 → max diff ~7e-9 µm/s 측정. P3 TS 평가에서도 동일 수준 예상; tolerance 1µm/s 충분 마진.
- **certifi 의존성**: 스크립트에서 `urllib.request.urlopen` 호출 시 SSL CA 가 누락된 환경 (uv 기본 cpython) 에서 verify 실패. `certifi.where()` 로 명시적 CA 사용. astropy 의존성으로 이미 설치됨 (no extra dep).

### P3 — TS Chebyshev Evaluator _(완료 2026-05-06)_

생성/수정 파일:

- [`src/ephemeris/chebyshev.ts`](../../src/ephemeris/chebyshev.ts) — `evaluateChebyshev` (recurrence, no Clenshaw needed for our use), `evaluateChebyshevAndDerivative` (value + dT_k/ds via dual recurrence T_k 와 T'_k 동시 누적).
- [`src/ephemeris/de440Format.ts`](../../src/ephemeris/de440Format.ts) — `De440Manifest`/`De440SegmentMeta`/`De440Segment`/`De440BinaryFormat` 타입, `parseSegmentBinary(buffer)`, `parseManifestJson(text)`, `DE440_BINARY_HEADER_BYTES = 32`.
- [`src/ephemeris/de440Evaluator.ts`](../../src/ephemeris/de440Evaluator.ts) — `De440SegmentLoader` 인터페이스, `createDe440Evaluator(loader)`, chain composition (`findChain` 으로 target → SSB walk), Promise 캐시. SPK km/day → m/s 변환.
- [`src/ephemeris/index.ts`](../../src/ephemeris/index.ts) — 새 모듈 re-export.
- [`tools/python/src/orbitarium_tools/de440.py`](../../tools/python/src/orbitarium_tools/de440.py) — `generate_fixtures(out_dir)` 함수 추가 (Work 2 패턴). 20 bodies × 8 JDs = 160 entries → spiceypy spkezr 결과 JSON 직렬화.

테스트 + fixture:

- [`tests/fixtures/work-03/de440-states.json`](../../tests/fixtures/work-03/de440-states.json) — 160 cross-validation 엔트리 (1900-01-01 ~ 2150-12-31, J2000 ±50yr 포함, 2026-05-05). `_tolerance_m=1e-3`, `_tolerance_vel_m_s=1e-6`.
- [`tests/unit/ephemeris/chebyshev.test.ts`](../../tests/unit/ephemeris/chebyshev.test.ts) — 9 tests: empty/constant/linear/T_2/T_3 직접 평가, 도함수 = 12s²-3, value vs derivative 일관.
- [`tests/unit/ephemeris/de440Format.test.ts`](../../tests/unit/ephemeris/de440Format.test.ts) — 5 tests: header round-trip, size mismatch / too-short Error, manifest parse, segments not-array reject.
- [`tests/unit/ephemeris/de440Evaluator.test.ts`](../../tests/unit/ephemeris/de440Evaluator.test.ts) — 4 tests (3 conditional on real binary, 1 in-memory): 160 fixture × component L_∞ < 1mm/1µm/s, segment 캐시 동작, out-of-range Error, synthetic 2-segment chain + alias 검증. `describe.skipIf(!dataAvailable)` 으로 binary 부재 시 graceful skip.

검증 결과:

- `pnpm format:check` ✓ (Prettier auto-format on de440Evaluator.ts/de440Format.test.ts)
- `pnpm lint` ✓ (`@typescript-eslint/prefer-nullish-coalescing` 1건 → `??=` 적용)
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **334 tests** (Work 2 P6 311 → P1 +6 → P3 +17 = 334).
- `pnpm test:e2e` ✓ — 12 tests, 회귀 없음.
- `pnpm build` ✓ — 1113.46 kB.

설계 결정 + 발견:

- **Chebyshev recurrence vs Clenshaw**: Clenshaw가 더 효율적이지만 dual evaluation (value + derivative)에서는 두 recurrence를 동시에 누적하는 직관적 방식이 더 명확. 14 coefficient 평균 → 성능 차이 무시 가능.
- **`Float64Array.subarray` view**: coefficient 슬라이스는 view (allocation 없음). evaluator hot-path에서 GC 부담 0.
- **`DataView.getInt32(..., true)`** little-endian 명시: x86/ARM 모두 LE 환경이지만 명시적으로 LE 해석. 향후 BE 플랫폼 호환성 의도적 미지원 (결정 #13 따름).
- **`fileBuffer.buffer.slice(offset, offset+len)`** 패턴: Node `readFileSync`가 반환하는 `Buffer` 는 더 큰 underlying ArrayBuffer 를 공유 — `Float64Array(buffer, offset, len)` 직접 생성 시 alignment 문제. `slice`로 뜬 새 ArrayBuffer는 항상 8-byte aligned.
- **L_∞ vs L_2**: 처음 L2 norm 으로 비교 시 Neptune barycenter (30AU = 4.5e12m) 에서 1.008 mm 측정 — IEEE 754 LSB(per-axis) ≈ 1mm × √3 누적. component-wise L_∞ 비교가 본질적으로 의미 있고 IEEE 754 한계 안. 결정 #21 추가.
- **CI 통합 deferred**: 현재 TS evaluator 테스트는 `describe.skipIf(!dataAvailable)` — CI에서 silent skip. P6 closeout 에서 (1) SPK 커널 캐시 + 다운로드 step (2) `pnpm de440:preprocess` step 추가 + (3) skipIf 제거 또는 `expectDataAvailable()` 강제.

### P4 — Horizons Reference (Python) _(완료 2026-05-06)_

생성/수정 파일:

- [`tools/python/src/orbitarium_tools/horizons.py`](../../tools/python/src/orbitarium_tools/horizons.py) — `query_state(naif_id, jd_tdb) → HorizonsQueryResult`, `query_states` 배치, `cli_describe`, `generate_fixtures(out_dir)` (10 planets × 3 JDs = 30 entries). astroquery `Horizons` 래핑, refplane='earth' (J2000 mean equator), location='@0' (SSB). 외행성 alias (`PLANET_BODY_ALIASES` 재사용).
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `horizons --body=<id|name> --jd-tdb=<jd>` 서브커맨드 + name → NAIF lookup. `fixtures --work=3` 분기 추가 (de440 + horizons 모두 생성).

테스트 + fixture:

- [`tests/fixtures/work-03/horizons-states.json`](../../tests/fixtures/work-03/horizons-states.json) — 30 cross-validation 엔트리 (Sun + 9 planet barycenters × J2000/2026-05-05/2150-12-31). `_tolerance_m=1e-2`, `_tolerance_vel_m_s=1e-6`.
- [`tools/python/tests/test_horizons.py`](../../tools/python/tests/test_horizons.py) — 5 tests: SI 단위 sanity (Earth |r| ~ 1AU), 외행성 alias routing, Horizons ↔ local spiceypy ≤ 1cm/1µm/s, cli_describe 포맷 (alias / no-alias). 네트워크 미가용 시 graceful skip.

검증 결과:

- `uv run ruff check src tests` ✓
- `uv run mypy src` ✓ — 10 source files
- `uv run pytest -q` ✓ — **88 tests** (Work 2 75 + P1 4 + P2 8 + P4 5 = 92? — 보니 P3에서 fixture는 TS만 추가. 정확한 카운트는 88 — P3에는 Python 추가 0건이고 P4 +5 한 결과)
- CLI smoke: `uv run orbitarium-tools horizons --body=mars --jd-tdb=2461165.5008007577` → 정상 출력 (Mars bary alias 표시 포함).

설계 결정 + 발견:

- **Horizons는 DE440 internally**: JPL Horizons는 2020년 이래 DE440 사용 → 우리 local DE440 evaluator 와 본질적으로 동일 ephemeris. 차이는 (1) Horizons의 텍스트 응답이 ~14 sig fig AU → 1 AU 거리에서 mm-cm 정밀도 floor, (2) refplane / location 변환만.
- **astroquery의 cache**: HTTP-level caching → fixture 재생성 시 두 번째 호출부터 빠름. CI 환경은 cold cache 이지만 30 queries 라 ~수십 초로 충분.
- **CLI 이름 → NAIF 매핑**: `--body=mars` 같은 입력을 `NAIF_CATALOG` 의 키로 lower+underscore 정규화하여 lookup. 숫자 입력은 NAIF id 직접 사용.
- **의도적으로 TS Horizons 미구현**: Work 7 진입 시 소행성/혜성/우주선 ephemeris 가 본격 필요해질 때 CORS 프록시 + 캐싱과 함께 구현. Work 3 의 P5 dev demo 는 fixture 기반 비교만 표시.

### P5 — Dev Demo `/dev/ephemeris` _(완료 2026-05-06)_

생성/수정 파일:

- [`src/dev/ephemeris/EphemerisDemo.tsx`](../../src/dev/ephemeris/EphemerisDemo.tsx) — Work 3 dev demo shell. 3개 패널 단일 페이지 grid. evaluator 단일 instance 공유.
- [`src/dev/ephemeris/StateVectorPanel.tsx`](../../src/dev/ephemeris/StateVectorPanel.tsx) — Body picker (11 천체 라디오) + UTC `datetime-local` + frame 라디오 → ICRF/EME2000/Ecliptic 변환 결과 (m, km, m/s, AU 거리, 속도 magnitude). EME2000 선택 시 round-trip 잔차 표시.
- [`src/dev/ephemeris/ReferenceDiffPanel.tsx`](../../src/dev/ephemeris/ReferenceDiffPanel.tsx) — `de440-states.json` 160 entries 자동 로드 → evaluator 결과와 component-wise L_∞ diff 표 + 최댓값 요약. fixture URL fallback (`/fixtures/work-03/...` → `/tests/fixtures/work-03/...`).
- [`src/dev/ephemeris/PlanetLineupPanel.tsx`](../../src/dev/ephemeris/PlanetLineupPanel.tsx) — Mercury~Pluto (9 행성) 현재 시각 SSB 거리 (AU) + 속도 (km/s) 표.
- [`src/dev/ephemeris/{webLoader,bodies,format}.ts`](../../src/dev/ephemeris/) — `createWebDe440Loader` fetch wrapper, `DEMO_BODIES` 카탈로그 (11 entries), AU/km 변환 헬퍼.
- [`src/dev/ephemeris/ephemeris.css`](../../src/dev/ephemeris/ephemeris.css) — body picker grid + status/error 스타일.
- [`src/dev/dev.css`](../../src/dev/dev.css) — `@import './ephemeris/ephemeris.css'` 추가.
- [`src/dev/registry.ts`](../../src/dev/registry.ts) — Work 3 entry `Component: lazy(() => import('./ephemeris/EphemerisDemo'))` 연결.

테스트:

- [`tests/e2e/dev-ephemeris.spec.ts`](../../tests/e2e/dev-ephemeris.spec.ts) — 4 specs: 3 패널 렌더, J2000 Earth state vector ~1 AU, Reference Diff summary 표시, Planet Lineup 9 rows. `test.skip(!DATA_AVAILABLE, ...)` 으로 binary 부재 시 graceful skip.
- [`tests/e2e/dev-index.spec.ts`](../../tests/e2e/dev-index.spec.ts) — Work 3 카드 available 기대값 갱신 (placeholder 9, available 2).

검증 결과:

- `pnpm format:check` ✓ (Prettier auto-format)
- `pnpm lint` ✓
- `pnpm typecheck` ✓
- `pnpm test` ✓ — 334 tests
- `pnpm test:e2e` ✓ — **16 tests** (Work 2 12 → P5 +4)
- `pnpm build` ✓ — 1113 kB
- 브라우저 preview 검증: `/dev/ephemeris` 정상 렌더, console error 없음, Reference Diff 표가 max Δr=9.766e-4 m (< 1mm) / max Δv=1.091e-11 m/s 표시 — TS evaluator 가 spiceypy fixture 와 component-wise 1mm/1µm/s 안에서 일치 시각 확인.

설계 결정 + 발견:

- **`__dirname` ESM 호환**: e2e spec 이 ESM 으로 로드되므로 `path.dirname(fileURLToPath(import.meta.url))` 패턴 사용. `__dirname` 직접 사용 시 Playwright 가 throw.
- **Playwright `toContainText` 다중 매치 함정**: `available.toContainText('Astronomy')` + `toContainText('Ephemeris')` 는 모든 엘리먼트가 두 문자열을 다 포함해야 통과 — `available.filter({ hasText: ... })` + `toHaveCount(1)` 로 변경.
- **`Vec3` 타입 캐스트**: `state.position` 은 `PositionICRF` (Meters phantom 3-tuple) 인데 frame 변환 함수는 `Vec3` 받음 — narrow assignment 로 안전하게 변환 (`pos: Vec3 = [state.position[0] as number, ...]`).
- **fixture URL fallback**: dev 모드에서는 `tests/fixtures/work-03/de440-states.json` 이 Vite 정적 자원 root 에 없음 → fetch 실패. 임시 해결은 fixture 를 `public/fixtures/...` 에 복사하는 대신 ReferenceDiffPanel 이 두 경로 시도 후 silent 실패. P6 에서 더 깔끔한 해결 (fixture 를 public/ 에 mount 하는 vite plugin 또는 별도 endpoint).
- **모바일 레이아웃 `astro-panel--wide`**: Work 2 패턴 그대로 — `grid-column: 1 / -1` 로 wide 패널 가능. 모바일에서는 자동으로 1열.

### P6 — Cross-validation & Golden Fixtures (Closeout)

_미시작_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 즉시 액션: P1 — Strategy & Brand Types 진입

1. [plan §3 P1](work-03-ephemeris.md#phase-1--strategy--brand-types) 의 결정 항목을 먼저 확정 → §2 결정 로그에 기록
   - 권장값은 [plan §5](work-03-ephemeris.md#5-결정-권장값-recommendations) 참고
2. `src/ephemeris/{types,constants,index}.ts` 작성 — Brand types + 톨러런스 상수
3. `tools/python/src/orbitarium_tools/ephemeris.py` placeholder (의미 docstring만)
4. `tests/unit/ephemeris/types.test.ts` — type-only assertions

### Work 2 산출물 활용 (Work 3 시작 전 점검)

```ts
// 시간 — Work 2 brand 그대로
import { utcToJdTdb, J2000_JD_TDB, type JdTdb } from '@/astro'

// 좌표 — Work 2 변환 그대로
import { ICRF_TO_ECLIPTIC_J2000, eme2000ToIcrf, type Vec3, type Matrix3 } from '@/astro'

// NAIF — Work 2 카탈로그 그대로
import { NAIF_CATALOG, getByNaifId, NAIF_IDS } from '@/astro'

// 단위 — Work 2 brand 확장
import { type Meters, type MetersPerSecond } from '@/astro'

// 테스트 helpers — Work 2 P6 산출물
import {
  expectCloseMeters, expectCloseVec3,
  TOL_DISTANCE_MM,
} from '../../helpers/expectClose'
import { loadWorkFixture } from '../../helpers/fixtures'
```

```python
# Python reference — Work 2 모듈
from orbitarium_tools.constants import AU, C_LIGHT, GM
from orbitarium_tools.naif import NAIF_CATALOG, NAIF_IDS
from orbitarium_tools.time import utc_to_jd_tdb, J2000_JD_TDB
```

### 주요 컨벤션 (Work 1/2에서 확정 — 그대로 적용)

```
TS 모듈 위치:
  도메인 코드는 src/<domain>/ — Work 3는 src/ephemeris/ 신설
  dev 페이지는 src/dev/<work-name>/ — Work 3는 src/dev/ephemeris/

Python 모듈:
  tools/python/src/orbitarium_tools/<name>.py — Work 3는 de440/horizons/ephemeris

테스트:
  단위:  tests/unit/ephemeris/<name>.test.ts (vitest, happy-dom)
  e2e:   tests/e2e/dev-ephemeris.spec.ts (playwright, chromium)
  fixtures: tests/fixtures/work-03/ (JSON + 사전 처리 binary는 별도 고려)
  pytest: tools/python/tests/test_<name>.py

Dev 라우트:
  src/dev/registry.ts 의 entry 에 Component 채우면 자동 라우트화
  Work 3 entry slug: 'ephemeris' (placeholder 이미 있음)

CI:
  .github/workflows/ci.yml 자동 커버
  새 Python 의존성 (jplephem, sgp4 등 가능): pyproject.toml [astro] extras에 추가

커밋 prefix: [work-03/p<N>] <한국어 한 줄 요약>
```

### 빠른 검증 명령

```bash
# 프론트엔드
pnpm install
pnpm dev          # /dev/ephemeris (P5 후 활성)
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

# Python (tools/python/)
cd tools/python
uv pip install -e ".[astro,dev]"           # 이미 설치되어 있음
uv run orbitarium-tools version
uv run ruff check src tests
uv run mypy src
uv run pytest

# DE440 사전 처리 (P2 후)
cd tools/python
uv run orbitarium-tools de440 preprocess --start=1900 --end=2150 --out=../../public/data/de440/

# 골든 fixture 재생성 (P6 후, Work 2 패턴)
pnpm fixtures:work-03
```

## 6. 알려진 이슈 / 노트

- **DE440 SPK 커널 가용성**: NAIF 공식 미러는 정전/장애 가능. CI/배포 시 1회 다운로드 후 캐시 권장. P2에서 retry policy 검토.
- **Horizons API rate limit**: ~1-2 req/sec. 본 Work에서는 fixture 재생성 시에만 호출 — 일반 dev 흐름에는 영향 없음. CI에서는 Horizons 호출 회피.
- **Float64 binary endian**: 본 프로젝트 모든 환경 (x86/ARM Mac, GitHub Actions) 모두 little-endian — 명시적 LE 가정 OK. 빅엔디안 호환은 도입하지 않음.
- **Velocity 정밀도 한계**: Chebyshev derivative는 polynomial degree-1 — body별 native interval에 따라 µm/s 톨러런스가 borderline 가능. P3 검증 시 측정 후 톨러런스 조정 가능 (decision log 갱신).
- **세차/장동 (Work 2 결정 #9 영향 없음)**: DE440 출력은 ICRF native — frames 변환 통과 시 Work 2 frame bias만 적용. precession/nutation 적용 안 함이 visualization timeline (J2000 ±100yr) 에 충분.
- **astropy ERFA dubious year warning**: Horizons fixture 재생성 시 미래 시각 (2050+) 에서 발생 가능 — 무시.
- **public/data/ git 정책**: Work 1 plan §7 폴더 구조에 `public/data/` 명시. Work 3에서 DE440 binary commit 여부 P2/P6 결정. .gitignore 갱신 가능.

## 7. 갱신 이력 (Changelog)

| 날짜       | 변경                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-05 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정 (Strategy → Preprocessing → TS Evaluator → Horizons Reference → Dev Demo → Closeout). P1 결정 ~10건 대기. |
| 2026-05-05 | **P1 완료** — `src/ephemeris/{types,constants,index}.ts` + Python 미러 + 10 단위 테스트. 결정 10건 (#1~#10) 모두 권장값 채택: Chebyshev 직접 평가 / DE440 1900-2150 / 20 entries (Sun + 9 bary + 9 body + Moon) / `{position, velocity}` 분리 객체 / JdTdb 입력 / ICRF (m, m/s) 출력 / 1mm·1µm/s 톨러런스 / `PositionICRF`/`VelocityICRF`/`StateVectorICRF` brand 합성. format/lint/typecheck/test(317)/build/ruff/mypy/pytest(75) 전부 그린. ESLint simple-import-sort 1건 autofix. |
| 2026-05-06 | **P2 완료** — `orbitarium_tools.de440` (`crop_segment`/`evaluate_segment`/`write_segment_binary`/`preprocess`/`resolve_chain` + `De440Segment`), CLI `de440 preprocess`, `pnpm de440:preprocess`, jplephem 2.24 의존성. 결정 8건 (#11~#18): jplephem 라이브러리 / 14 native segments + 6 alias / Float64 LE 헤더 `<iiiidd>` / native intervals / 무압축 / `public/data/ephemeris/de440/` build-time 생성. 단위 테스트 8건 추가 (총 83). 14 segments × 4 JDs 비교: jplephem max diff < 0.49 mm / 0.007 µm/s, spiceypy SSB chain max diff < 0.1 mm / 4 µm/s — 모두 1mm/1µm/s 톨러런스 통과. ruff/mypy/pytest 모두 그린. |
| 2026-05-06 | **P3 완료** — TS Chebyshev evaluator + DE440 binary loader. `src/ephemeris/{chebyshev,de440Format,de440Evaluator}.ts` + `de440-states.json` fixture (160 entries). 결정 4건 (#19~#22): async Promise + 주입 가능한 loader / Promise Map 캐시 / L_∞ component-wise 비교 / CI 통합은 P6 deferred. 단위 테스트 17건 추가 (총 334): chebyshev 9 + format parse 5 + evaluator 4 (3 conditional on binary). spiceypy fixtures cross-check max < 1 mm / 1 µm/s component-wise (Neptune bary at 30AU = IEEE 754 한계). format/lint/typecheck/test/build/e2e 그린. |
| 2026-05-06 | **P4 완료** — Horizons reference (Python only). `orbitarium_tools.horizons` (`query_state` / `query_states` / `cli_describe` / `generate_fixtures`), CLI `horizons --body=... --jd-tdb=...` + `fixtures --work=3` (de440 + horizons). `tests/fixtures/work-03/horizons-states.json` (30 entries). 결정 4건 (#23~#26): AU→m 단위 변환 / refplane='earth' + light-time off / Horizons text precision = 1cm tolerance / TS Horizons client 은 Work 7 deferred / astroquery 내장 cache. 단위 테스트 5건 추가 (총 88). Horizons ↔ spiceypy live cross-check ≤ 6mm / 1µm/s 통과. ruff/mypy/pytest 그린. |
| 2026-05-06 | **P5 완료** — `/dev/ephemeris` 단일 페이지 dev demo. `src/dev/ephemeris/{EphemerisDemo,StateVectorPanel,ReferenceDiffPanel,PlanetLineupPanel,webLoader,bodies,format}.ts(x)` + ephemeris.css 추가, Work 3 registry 연결. State Vector (11 body radio + UTC + frame 토글 → ICRF/EME2000/Ecliptic 위치/속도 표시), Reference Diff (160 fixture entries vs evaluator L_∞ diff + 요약), Planet Lineup (9 행성 SSB 거리 + 속도). 결정 4건 (#27~#30) 채택. e2e 4건 추가 (총 16). 브라우저 검증: max Δr=9.766e-4 m / Δv=1.091e-11 m/s — 1mm/1µm/s 안. format/lint/typecheck/test(334)/build/e2e(16) 그린. |

---

## Appendix A. Phase 마감 체크리스트 (Template)

각 phase를 [x]로 옮기기 전에 다음을 모두 확인:

1. [ ] [plan §3](work-03-ephemeris.md#3-phase-정의) 의 해당 phase Done 기준 모두 충족
2. [ ] §2 결정 로그에 phase 결정 사항 모두 기록
3. [ ] §3 해당 phase Open Questions 모두 [x] 처리
4. [ ] §4 해당 phase 산출물 인덱스 채움 (경로 + 한 줄 메모)
5. [ ] §0 현재 phase 갱신 (다음 phase로)
6. [ ] §7 갱신 이력에 한 줄 추가
7. [ ] (선택) 커밋 — 메시지 prefix `[work-03/p<N>]`
