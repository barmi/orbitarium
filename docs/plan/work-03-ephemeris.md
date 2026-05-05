# Work 3 — Ephemeris Data Layer (Plan)

> 진행 상태와 결정 사항은 **[work-03-ephemeris-handoff.md](work-03-ephemeris-handoff.md)** 에 누적.
> 본 문서는 phase 정의/Done 기준의 정적 참조용.

---

## 0. 한눈에 (At a Glance)

| 항목         | 값                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 목표         | 실제 천체 위치/속도 데이터를 신뢰성 있게 가져온다 — DE440 기반 Chebyshev evaluator를 브라우저에서 직접 실행하고, Horizons는 Python reference 채널로 두 채널 동시 검증                                                            |
| Phase 수     | 6                                                                                                                                                                                                                               |
| 선행 Work    | Work 2 (Astronomy Foundations) — `JdTdb` brand type, ICRF/EME2000/Ecliptic frames, `expectClose*` helpers, fixture CLI 패턴                                                                                                     |
| 후속 Work    | Work 4 (Scale) — 위치를 화면 좌표로. Work 6 (Bodies) — 자전 + 궤도 시각화. Work 7 (Orbits) — Horizons TS client / 소행성 / 혜성. Work 8 (Time Control) — 시각 입력 동기화. Work 12 (Validation) — Horizons 자동 cross-check     |
| 핵심 산출물  | `src/ephemeris/` (TS DE440 evaluator + 단위/타입) + `orbitarium_tools.{de440,horizons}` (Python preprocessor + reference) + 사전 처리된 binary chunk(`public/data/de440/...`) + `/dev/ephemeris` 데모 + 골든값 fixture          |

## 1. 결과 정의 (Definition of Done)

Work 3 마감은 **다음 모두**가 통과해야 한다:

- [ ] DE440 사전 처리 파이프라인: Python(`orbitarium_tools.de440`)에서 SPK 커널 → Chebyshev binary + manifest 생성 → spiceypy 직접 평가와 비트 동일 cross-check.
- [ ] 사전 처리 산출물 commit (또는 build-time download 스크립트): `public/data/de440/` 또는 동등 경로에 binary + manifest.
- [ ] TS Chebyshev evaluator: `getStateAt(naifId, jdTdb)` → `{ position: PositionICRF (m), velocity: VelocityICRF (m/s) }`.
- [ ] **위치 cross-check**: TS evaluator vs spiceypy `spkezr` ≤ **1 mm** (29 NAIF 카탈로그 중 Sun + 8 planets + Moon, 시간 ~20 케이스).
- [ ] **속도 cross-check**: ≤ **1 µm/s**.
- [ ] Brand types: `PositionICRF`, `VelocityICRF`, `StateVectorICRF` (m, m/s, JdTdb 입력).
- [ ] Python `orbitarium_tools.horizons` (astroquery wrapper): `query_state(body, jd_tdb)` → spiceypy 결과와 1mm/1µm/s 안 일치 (planets only, 검증용).
- [ ] **Dev Demo** `/dev/ephemeris` — body × UTC 입력 → state vector(ICRF, ecliptic) 표시 + Horizons reference diff 패널 (선택적: dev mode에서 fixture-based diff).
- [ ] `pnpm lint` / `format:check` / `typecheck` / `test` / `test:e2e` / `build` 그린.
- [ ] `cd tools/python && uv run ruff check / mypy / pytest` 그린.
- [ ] CI (node / python / e2e) 그린.
- [ ] [handoff 문서](work-03-ephemeris-handoff.md)의 모든 phase 체크박스 [x],
      결정 로그 누락 없음, 산출물 인덱스 채워짐.

## 2. 범위 / 비범위

**In scope**

- DE440 SPK 커널 평가 (Sun + 8 planets + Moon — 본 Work 핵심)
- Chebyshev coefficient 추출 → 컴팩트 binary 직렬화 + JSON manifest
- 브라우저용 binary 평가기 (position + velocity, ICRF, m/s 단위)
- ICRF 입출력 — Work 2 frames와 합성으로 EME2000 / Ecliptic 변환
- `JdTdb` 입력 — Work 2 time module과 일관
- Brand types: `PositionICRF`, `VelocityICRF`, `StateVectorICRF`
- Python reference (`orbitarium_tools.de440`, `orbitarium_tools.horizons`) — golden value generator
- 골든값 fixture (NAIF body × time grid)
- Dev Demo `/dev/ephemeris`
- Caching (in-memory LRU 정도, body-time chunk 단위)

**Out of scope** (다른 Work)

- Horizons **TS client** (HTTP fetch, CORS 프록시) → Work 7 (Orbits) — 소행성/혜성/우주선 본격 사용 시
- DE441 (확장 시간 범위, ±27 kyr) → 필요 시 Work 12 검증 시 검토
- 위성 (갈릴레이, 토성 위성 등) ephemeris → Work 6 (Bodies) — 별도 SPK 커널
- 소행성/혜성 / 우주선 → Work 7 (Orbits)
- light-time correction (geometric vs apparent position) → Work 12
- Numerical integration (perturbation, custom orbit propagation) → Work 7
- 스케일 변환 (ICRF m → 화면 단위) → Work 4
- 시간 컨트롤러 (스크러버, 재생, 가속) → Work 8

---

## 3. Phase 정의

각 phase는 **Goal / Scope / Decisions / Deliverables / Done / Demo** 6항목 구조.
각 phase는 (TS 코드 + Python reference + 단위/통합 테스트)를 **같은 phase 내에서** 동반 작성.

### Phase 1 — Strategy & Brand Types

**Goal**: Work 3 전체 설계 결정 + 후속 phase가 import할 타입/상수를 확정.

**Scope**

- TS: `src/ephemeris/types.ts`
  - Brand types: `Meters` 기반 `PositionICRF = readonly [Meters, Meters, Meters]` (Vec3 위에 phantom)
  - `VelocityICRF = readonly [MetersPerSecond, ...]`
  - `StateVectorICRF = { position, velocity, jdTdb, naifId }`
  - 톨러런스 상수: `EPHEMERIS_TOL_MM = 1`, `EPHEMERIS_TOL_VEL_UM_S = 1`
  - 카탈로그 경로 컨벤션 (Work 2 NAIF_CATALOG 재사용)
- TS: `src/ephemeris/index.ts` — re-exports placeholder
- Python: `orbitarium_tools.ephemeris` (또는 type-light hint module) — TS 타입과 동일 의미 docstring

**Decisions** (P1에서 확정)

- DE440 평가 전략:
  - (a) **Chebyshev coefficient 직접 평가 (사전 처리 binary, 브라우저)** — 권장
  - (b) `cspice` WASM 빌드
  - (c) 백엔드 / build-time 평가
- 커널 범위:
  - (a) **DE440 (1550-2650)** — 권장
  - (b) DE441 (±27 kyr, 큰 사이즈)
- 사전 처리 시간 범위: **1900-2150 (250 yr)** vs 1700-2300 vs 1550-2650
- 천체 범위: **Sun + 8 planets (barycenter + body) + Moon** — 권장
- ICRF/EME2000 입출력: **DE440 native = ICRF, return ICRF** (변환은 caller 책임)
- 시간 입력 단위: **JdTdb** (Work 2 brand 재사용)
- State vector 모델: **`{ position, velocity }` 분리** vs 단일 6-tuple — 권장: 분리 객체
- Brand types: 위치/속도 별도 phantom — 권장
- 톨러런스: **위치 1 mm / 속도 1 µm/s** — 권장 (1AU 기준 6.7e-15 rad, mas보다 ~6 orders 엄격)
- 정밀도 reference: **spiceypy `spkezr` direct from DE440 SPK** (kernel 인스톨)

**Deliverables**

```
src/ephemeris/
  types.ts                     # Brand + interface
  constants.ts                 # 톨러런스 + 시간/거리 상수
  index.ts                     # public re-exports

tools/python/src/orbitarium_tools/
  ephemeris.py                 # 타입 placeholder + 의미 정의
```

+ `tests/unit/ephemeris/types.test.ts` — type-only assertions (compile-time check via `expectAssignable` 또는 단순 사용 패턴).
+ handoff §2 결정 로그 8~10개 항목 채움.

**Done**

- 결정 8~10개 항목 채워짐
- 타입이 후속 phase에서 그대로 import 가능 (placeholder evaluator로 type smoke)
- `pnpm typecheck` 그린

**Demo**: 콘솔에서 `import { type StateVectorICRF, EPHEMERIS_TOL_MM } from '@/ephemeris'` 동작 확인.

---

### Phase 2 — DE440 Preprocessing (Python)

**Goal**: SPK 커널 → 브라우저용 컴팩트 binary + manifest. spiceypy 직접 평가와 self-cross-check.

**Scope**

- Python `orbitarium_tools.de440`
  - DE440 SPK 커널 다운로드/캐시 정책 (NAIF 공식 mirror)
  - 시간 범위 + 천체별 Chebyshev coefficient 추출 (spiceypy low-level: `dafopr`, `dafgda` 또는 PyKepler 라이브러리 활용)
  - Compact binary serialization (Float64 array of [coefficients, interval bounds])
  - Manifest JSON: `{ bodies: { 399: { intervals, coef_count, byte_offset, ... } }, time_range, kernel_source }`
  - Self-test: read back binary in Python → evaluate at random JD → spiceypy `spkezr` 비교 → 비트 동일
- CLI: `orbitarium-tools de440 preprocess --start=1900 --end=2150 --out=public/data/de440/`
- Output: `public/data/de440/<body_id>.bin` + `public/data/de440/manifest.json`

**Decisions** (P2에서 확정)

- 커널 다운로드 경로: NAIF 공식 vs 미러
- Binary format: **Float64 little-endian** vs Float32 (정밀도 부족) vs custom (오버엔지니어링)
- Chunk 단위:
  - DE440 native polynomial intervals (e.g. 32 days for major planets, 16 days for Moon, varies by body)
  - **Native interval 그대로** vs custom resampling — 권장: native (정밀도 보존)
- 압축: **무압축** (gzip는 vite 등에서 transport-layer로 처리) vs build-time gzip
- Manifest 위치: **`public/data/de440/manifest.json`** (정적 fetch) vs in-bundle JSON (큰 사이즈)
- Build-time vs commit-time:
  - (a) Binary를 git commit (수십 MB 가능)
  - (b) Build script로 다운로드/생성 → CI/배포 시 자동 — 권장 (큰 binary 미commit)
  - 결정에 따라 `.gitignore` 정책 갱신
- Cross-check 톨러런스: **위치 0 (bit-identical), 속도 0** (Python 자체 round-trip)

**Deliverables**

```
tools/python/src/orbitarium_tools/
  de440.py                     # SPK loader + Chebyshev extractor + binary writer
  cli.py                       # 'de440' subcommand 추가

scripts/
  fetch-de440.sh (선택)        # 빌드 시 NAIF에서 SPK 다운로드

public/data/de440/             # output (또는 build artifact)
  manifest.json
  <body_id>.bin                # body별 Chebyshev coef binary
```

+ `tools/python/tests/test_de440.py` — round-trip self-test, manifest schema 검증
+ `tests/fixtures/work-03/de440-spec.md` — binary format 명세

**Done**

- `orbitarium-tools de440 preprocess` 한 번 실행으로 manifest + body binary 생성
- Python으로 read → evaluate → spiceypy `spkezr` 비트 동일 (시간 grid 100+ 시각, 9 bodies = 900+ pairs)
- `pytest` 그린

**Demo**: `cd tools/python && uv run orbitarium-tools de440 preprocess --start=2026 --end=2027 --out=/tmp/de440-smoke/` → manifest + Earth.bin 생성 + `python -c "from orbitarium_tools.de440 import load_and_evaluate; ..."` 으로 즉석 평가.

---

### Phase 3 — TS Chebyshev Evaluator

**Goal**: 사전 처리된 binary를 브라우저에서 fetch → ICRF state vector 반환. spiceypy 1mm/1µm/s 안 일치.

**Scope**

- `src/ephemeris/de440Loader.ts`
  - `loadManifest(): Promise<De440Manifest>`
  - `loadBodyChunk(naifId, jdTdb): Promise<De440Chunk>` (필요 chunk만 lazy load)
- `src/ephemeris/chebyshev.ts`
  - `evaluateChebyshev(coefs, t): number` — Clenshaw recurrence
  - `evaluateChebyshevDerivative(coefs, t): number` — for velocity
- `src/ephemeris/de440Evaluator.ts`
  - `getStateAt(naifId: NaifId, jdTdb: JdTdb): Promise<StateVectorICRF>`
  - 메모리 LRU cache (chunk 단위, 최근 사용 ~10 chunk 유지)
- Python reference: `orbitarium_tools.de440` 의 같은 evaluator 함수가 binary read → 평가 (P2에서 작성한 evaluator 재사용)
- Cross-check fixtures: 9 bodies × 20 시각 (J2000, current, ±25 yr, voyager_1, hubble) = 180 entries

**Decisions** (P3에서 확정)

- 캐시 정책: **chunk 단위 LRU (10 chunk)** vs 전체 인메모리 vs 무캐시
- Async / sync API: **Promise 기반 async** (binary fetch가 비동기) vs sync after preload
- 에러 처리: missing body / out-of-range time / invalid binary — Error 종류
- ArrayBuffer 캐시: `fetch().arrayBuffer()` vs preload 가 더 빠른지 측정 (Work 11에서)

**Deliverables**

```
src/ephemeris/
  de440Loader.ts               # Manifest + chunk loader
  chebyshev.ts                 # Clenshaw recurrence
  de440Evaluator.ts            # public getStateAt
```

+ `tests/unit/ephemeris/chebyshev.test.ts` — 단위 다항식 시각/도함수 검증
+ `tests/unit/ephemeris/de440Evaluator.test.ts` — fixture-based cross-check
+ `tests/fixtures/work-03/de440-states.json` — 9 × 20 entries

**Done**

- TS evaluator가 spiceypy 결과와 위치 ≤1mm, 속도 ≤1µm/s 안에서 일치 (전체 fixture)
- 메모리 사용량 합리적 (시간/공간 trade-off 측정 — Work 11 폴리시에서 재최적화 OK)
- `pnpm test` 그린

**Demo**: `pnpm dev` → `/dev/ephemeris` 진입 후 body × 시각 입력 → state vector 표시 (P5 phase에서 시연).

---

### Phase 4 — Horizons Reference (Python)

**Goal**: Python `orbitarium_tools.horizons` — astroquery 래퍼로 Horizons API state vector 반환. 본 Work에서는 **fixture 생성 + cross-validation** 채널 전용.

**Scope**

- Python: `orbitarium_tools.horizons`
  - `query_state(naif_id, jd_tdb) → (PositionICRF, VelocityICRF)` (m, m/s)
  - astroquery `Horizons` 래핑, `vectors` quantity 사용
  - Horizons 출력 단위 (default AU, AU/day) → m, m/s 변환
  - light-time correction off (geometric position)
  - Time scale 변환: JdTdb 입력 → Horizons에 맞는 형식
  - 결과 캐시 (간단한 디스크 cache or in-memory)
- CLI: `orbitarium-tools horizons --body=mars --date=2026-05-05` → state vector 출력
- spiceypy DE440 결과 vs Horizons 결과 1mm/1µm/s 안 일치 검증 (planets only)

**Decisions** (P4에서 확정)

- Horizons 출력 단위 강제: **m, m/s** (Horizons의 km/s 옵션 사용 후 ×1000)
- light-time correction: **off** (geometric, 본 Work scope)
- Cache 위치: `tools/python/.cache/horizons/` (.gitignore)
- TS Horizons client: **본 Work 미포함** (Work 7로 deferred — 소행성/혜성 본격 사용 시)
- 비교 톨러런스: spiceypy DE440 vs Horizons (둘 다 same kernel 기반) **1mm/1µm/s** — Horizons API 자체 round-trip 정밀도 한계

**Deliverables**

```
tools/python/src/orbitarium_tools/
  horizons.py                  # astroquery wrapper
  cli.py                       # 'horizons' subcommand 추가

tests/fixtures/work-03/
  horizons-states.json         # planets × 시각 — Horizons 직접 호출 결과 (작은 grid)
```

+ `tools/python/tests/test_horizons.py` — astroquery import + 1 query smoke + spiceypy 비교

**Done**

- `orbitarium-tools horizons --body=mars --date=2026-05-05` → state vector 표시
- spiceypy 비교 ≤ 1mm / 1µm/s
- 캐시 작동 (두 번째 호출 < 100ms)
- `pytest` 그린

**Demo**: 위 CLI 실행.

---

### Phase 5 — Dev Demo `/dev/ephemeris`

**Goal**: P3 산출물을 눈으로 즉시 확인할 수 있는 인터랙티브 패널.

**Scope**

- React 컴포넌트 (R3F 불필요)
- 패널 1: **State Vector 평가**
  - 입력: body picker (Sun + 8 planets + Moon) + UTC datetime (default = 현재)
  - 출력: position (m, km, AU 동시) + velocity (m/s, km/s) + JD TDB + 거리 (Sun 기준 |r|)
  - frame 선택: ICRF / EME2000 / Ecliptic J2000 (Work 2 변환)
- 패널 2: **Reference Diff** (선택적)
  - fixture 로딩 → 같은 입력에 대한 spiceypy 결과와 |Δr| (mm), |Δv| (µm/s) 표시
  - fixture에 없는 시각이면 "no reference"
- 패널 3: **거리/속도 sanity**
  - 행성 라이너업 (현재 시각 distance from Sun, AU)
  - 표 형태, 단위 명시
- 폴리시 무시, 기능 우선
- `src/dev/registry.ts` Work 3 entry 채움

**Decisions**

- 컴포넌트 구조: **단일 페이지 + 3 섹션** vs 탭 — 권장 단일 페이지
- body picker: dropdown vs button group — 권장 button group (9 천체 보임)
- frame 변환: 본 페이지에서 동시 표시 vs 토글 — 권장 동시 (frame 비교 디버깅 유용)
- async loading UI: spinner / skeleton — 권장 spinner

**Deliverables**

```
src/dev/ephemeris/
  EphemerisDemo.tsx            # 메인 페이지
  StateVectorPanel.tsx
  ReferenceDiffPanel.tsx
  PlanetLineup.tsx
  ephemeris.css
```

+ `src/dev/registry.ts` Work 3 entry → `Component: lazy(() => import('./ephemeris/EphemerisDemo'))`
+ `src/dev/dev.css` — `@import './ephemeris/ephemeris.css'`
+ `tests/e2e/dev-ephemeris.spec.ts` — 4 specs (페이지 로드, body 변경, frame 변경, 1AU magnitude sanity)
+ `tests/e2e/dev-index.spec.ts` Work 3 available 기대값 갱신

**Done**

- `/dev/ephemeris` 진입 가능, 9 body 모두 동작
- 폼 입력 → 즉시 갱신 (chunk fetch < 1s)
- e2e 그린

**Demo**: `pnpm dev` → `/dev/ephemeris` 에서 Earth 선택 → 현재 시각 → x/y/z 출력.

---

### Phase 6 — Cross-validation & Golden Fixtures (Closeout)

**Goal**: P2~P4 결과의 회귀 가드 + Work 4+ 진입 가이드 정착.

**Scope**

- Python `generate_fixtures(out_dir)` 컨벤션 정착 (Work 2 패턴 재사용)
  - `de440.py::generate_fixtures(...)` — body × time grid
  - `horizons.py::generate_fixtures(...)` — planets × 작은 grid (API rate-limit 감안)
- 통합 CLI: `orbitarium-tools fixtures --work=3 --out=tests/fixtures/work-03/`
- Fixture 형식 컨벤션 (Work 2와 동일 — JSON, `_` 메타 prefix, Prettier 정렬)
- TS: `tests/helpers/expectClose.ts` 의 `expectCloseMeters` / `expectCloseVec3` (Work 2 P6에서 이미 작성)을 그대로 사용
- 회귀 가드 검증: 의도적으로 evaluator 결과를 1mm 초과로 흔들기 → fail → 원복
- `package.json` script: `fixtures:work-03` (Work 2 패턴 따라)
- `docs/architecture/ephemeris-conventions.md` — DE440 binary format / state vector 모델 / Work 4+ 진입 패턴
- `tests/fixtures/work-03/README.md` — fixture 구성, 재생성 명령

**Decisions** (P6에서 확정)

- Fixture 형식: **JSON** (Work 2와 동일) — 권장
- Fixture 갱신 정책: **수동 (`pnpm fixtures:work-03`)** — 권장
- DE440 binary commit 정책 (P2에서 잠정 결정한 build-time download vs commit) 최종 확정
- Work 4+ 진입 시 import 패턴 docstring 충실히

**Deliverables**

```
tools/python/src/orbitarium_tools/
  cli.py                       # 'fixtures --work=3' 분기 추가

tests/fixtures/work-03/
  de440-states.json            # P3에서 작성, P6에서 schema/메타 정리
  horizons-states.json         # P4에서 작성
  README.md                    # 형식 + 재생성 명령

docs/architecture/
  ephemeris-conventions.md     # 정책 요약
```

+ `package.json` script `fixtures:work-03`

**Done**

- `pnpm fixtures:work-03` 한 번에 모든 fixture 재생성 + Prettier 정렬
- 의도적 1mm 초과 변경 → `pnpm test` fail 재현 → 원복 후 그린
- 컨벤션 문서가 Work 4 작업자에게 즉시 사용 가능 수준

**Demo**: `pnpm fixtures:work-03` → `git diff tests/fixtures/work-03/` 빈 결과(이미 최신).

---

## 4. Phase 의존 관계

```
P1 Strategy & Brand Types
   │
   ▼
P2 DE440 Preprocessing (Python)
   │
   ▼
P3 TS Chebyshev Evaluator
   │           │
   │           ▼
   │        P4 Horizons Reference (Python)  ─┐
   │                                          │
   └──────────────┬───────────────────────────┘
                  ▼
               P5 Dev Demo
                  │
                  ▼
               P6 Closeout (fixtures + docs)
```

- P3와 P4는 P2 이후 **부분 병렬 가능** (P3은 binary, P4는 외부 API). 단순성을 위해 P3 → P4 권장.
- P5는 P3 산출물 + (선택적) P4 fixture 사용.
- P6는 마감 — 모든 phase fixture/문서 통합.

## 5. 결정 권장값 (Recommendations)

권장값은 **handoff 결정 로그**에 사용자 컨펌 후 기록.

| 항목                          | 권장                                                             | 대안                                | 결정 phase |
| ----------------------------- | ---------------------------------------------------------------- | ----------------------------------- | ---------- |
| DE440 평가 전략               | **Chebyshev 직접 평가 (사전 처리 binary, 브라우저)**             | cspice WASM / 백엔드                | P1         |
| 커널                          | **DE440** (1550-2650)                                            | DE441 (±27 kyr)                     | P1         |
| 사전 처리 시간 범위           | **1900-2150** (250 yr)                                           | 1700-2300 / 1550-2650               | P1         |
| 천체 범위 (본 Work)           | **Sun + 8 planets (bary + body) + Moon**                         | + 위성 (Work 6에서)                 | P1         |
| State vector 모델             | **`{ position, velocity, jdTdb, naifId }`**                      | 6-tuple                             | P1         |
| 시간 입력                     | **`JdTdb`** (Work 2 brand 재사용)                                | UTC Date / TT                       | P1         |
| 좌표 출력                     | **ICRF (m, m/s)**                                                | EME2000 (caller 변환)               | P1         |
| 위치 톨러런스                 | **1 mm**                                                         | 1 cm / 1 m                          | P1         |
| 속도 톨러런스                 | **1 µm/s**                                                       | 1 mm/s                              | P1         |
| Binary format                 | **Float64 LE, native Chebyshev intervals**                       | Float32 / custom                    | P2         |
| Binary commit 정책            | **build-time download** (NAIF SPK + 사전 처리 모두 빌드 산출물)  | git commit (수십 MB)                | P2         |
| 압축                          | **무압축** (transport-layer gzip 신뢰)                           | build-time gzip                     | P2         |
| TS 캐시 정책                  | **chunk 단위 LRU (10 chunk)**                                    | 전체 인메모리 / 무캐시              | P3         |
| TS evaluator API              | **async Promise**                                                | preload-then-sync                   | P3         |
| Horizons TS client            | **본 Work 미포함 (Work 7로 deferred)**                           | 본 Work에서 minimal 구현            | P4         |
| Horizons light-time           | **off (geometric)**                                              | apparent (light-time corrected)     | P4         |
| Horizons cache 위치           | `tools/python/.cache/horizons/` (.gitignore)                     | 인메모리만                          | P4         |
| Dev Demo 구조                 | **단일 페이지 + 3 섹션**                                         | 탭                                  | P5         |
| Dev Demo body picker          | **button group**                                                 | dropdown                            | P5         |
| Fixture 형식                  | **JSON** (Work 2와 동일)                                         | binary / Parquet                    | P6         |
| Fixture 갱신 정책             | **수동** (`pnpm fixtures:work-03`)                               | CI 자동                             | P6         |

## 6. 위험 / 메모

- **DE440 SPK 커널 사이즈**: full DE440 (1550-2650, 모든 천체 포함)은 ~115 MB. 250 yr × 9 body 추출하면 ~수 MB로 줄어듦 (정확한 사이즈는 P2에서 측정). git commit vs build-time download 결정은 사이즈 측정 후.
- **Chebyshev coefficient 추출 신뢰성**: spiceypy의 low-level DAF API는 문서가 부족. PyKepler 또는 cspice C 코드 참조 필요할 수 있음. P2에서 spiceypy `spkezr` 결과와 추출+재평가 결과의 비트 동일성을 self-test로 강제.
- **Horizons API rate limit + 가용성**: API rate-limit (~1-2 req/sec). CI에서 Horizons 호출은 피하고 사전 캐시 사용. Horizons 다운타임 시 fixture 재생성 불가 — DE440 fixture만으로도 회귀 가드 OK.
- **Velocity 정밀도**: Chebyshev derivative는 polynomial 한 차 낮음 → 정밀도 한계. spiceypy `spkezr` 자체가 derivative 평가하므로 reference로 충분. 1µm/s 톨러런스가 borderline일 수 있음 (P3 검증 시 측정).
- **세차/장동 미적용 (Work 2 결정 #9)**: DE440은 ICRF에서 정의 — 세차/장동 영향 없음. Work 2 frames와 일관 (J2000 고정). Work 8/12에서 보이저(1977)~미래 100년 mas 정밀도 요구 시 frames Work에서 재평가.
- **Binary 다운로드 + 빌드 시점**: `public/data/de440/` 가 git 외부면 `pnpm dev`/`pnpm build` 첫 실행 시 다운로드 단계 필요 — Vite plugin or `prebuild` script. CI에서도 동일. 첫 build 시간 고려 (~수 분 가능).
- **Brand types 인체공학**: `PositionICRF` × `Meters`는 phantom type 합성 — 산술 연산은 풀려서 강제력 약함. Work 2 P1 #3 결정과 동일 — 함수 경계에서만 강제.
- **Work 4와의 인터페이스**: P3의 `getStateAt()` 반환을 Work 4에서 그대로 수신 → scale function 통과 → scene 좌표. 본 Work에서 scene 단위는 다루지 않는다.
- **Work 7과의 인터페이스**: P4의 Horizons Python 모듈을 Work 7 (Orbits) 에서 재사용해 소행성/혜성 ephemeris 도입. TS client는 그때 본격 구현.
- **DE440 native interval 변동**: 행성마다 polynomial interval 길이가 다름 (e.g. major planets = 32d, Moon = 4d, Sun = 16d). Manifest에 body별 interval list 명시 필요 — chunk loader가 이를 활용.

---

_Last updated: 2026-05-05_
