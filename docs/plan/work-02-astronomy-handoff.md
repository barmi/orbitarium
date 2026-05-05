# Work 2 — Handoff (Astronomy Foundations)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-02-astronomy.md`](work-02-astronomy.md)

---

## 0. 현재 상태 (Status)

| 항목 | 값 |
|---|---|
| 현재 phase | **P6 완료** ✓ — Work 2 마감 |
| 다음 액션 | **Work 2 closeout 마감 처리** — DoD 체크 + commit/push 후 Work 3 (Ephemeris) 진입 준비 |
| 마지막 갱신 | 2026-05-05 |
| 블로커 | 없음 |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-02-astronomy.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Constants & NAIF Catalog _(완료 2026-05-05)_
- [x] **P2** — Time Systems _(완료 2026-05-05)_
- [x] **P3** — Reference Frames (Core) _(완료 2026-05-05)_
- [x] **P4** — IAU Rotation Model Foundation _(완료 2026-05-05)_
- [x] **P5** — Dev Demo `/dev/astro` _(완료 2026-05-05)_
- [x] **P6** — Cross-validation & Golden Fixtures (Closeout) _(완료 2026-05-05)_

> Work 2 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-02-astronomy.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| # | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
|---|---|---|---|---|---|
| 1 | 상수 출처 | **IAU 2015 + DE440 정합** (DE440 우선, IAU 2015 nominal과 7자리 매치 검증) | DE440이 ephemeris 평가의 표준 — Work 3 적용 시 단일 GM 테이블로 통일. AU/c는 SI/IAU 정의값(exact integer), GM은 DE440 11~12자리, ε은 ERFA `obl06` (IAU 2006). | P1 | 2026-05-05 |
| 2 | NAIF 카탈로그 범위 | **Sun(1) + 행성 barycenter(9) + 행성 body(9) + Moon + 갈릴레이 4 + 토성 5 = 29 entries** | 토성 5: Titan/Rhea/Iapetus(가장 큰 셋) + Enceladus/Mimas(시각적 매력). Work 6에서 더 추가. | P1 | 2026-05-05 |
| 3 | 단위 안전 타입 | **brand type** (`type Meters = number & { readonly __unit: 'm' }`) | 컴파일 타임 강제 + 런타임 0 비용. 함수 경계에서 단위 혼동 방지. 헬퍼 (`degToRad`, `arcSecToRad` 등) 동봉. | P1 | 2026-05-05 |
| 4 | 상수 모듈 분리 정책 | **단일 `constants.ts`** | 작은 상수 set (AU/c/ε + GM 12개) — 분리 비용 > 가치. Work 6 IAU rotation 데이터 들어갈 시 별도 모듈(`rotationData.ts`)로 분리. | P1 | 2026-05-05 |
| 5 | Leap second 처리 | **정적 임베드** (IERS Bulletin C 70, 2017-01-01 마지막 leap = +37s, 28 entries) | 동적 fetch는 오프라인/CI 깨짐 + 성능 비용. 임베드는 IERS 갱신 시 코드+commit 1라인 추가로 충분. astropy IERS data와 cross-check 통과. | P2 | 2026-05-05 |
| 6 | TDB-TT 모델 | **Fairhead-Bretagnon 1990 simplified, 1차항** (`0.001658·sin(g) + 0.000014·sin(2g)`, ~50µs vs IAU 2009) | 풀 시리즈(787항)는 코드 ~30KB. Work 2~10 visualization timeline에 50µs 충분. Work 12 검증 시 풀 모델 업그레이드 검토. astropy 비교 budget = 100µs. | P2 | 2026-05-05 |
| 7 | JD epoch 기준 시각 | **TDB** (`J2000_JD_TDB = 2451545.0`, 천체역학 표준) | Work 3+의 ephemeris 평가 입력이 모두 JD_TDB. UTC/TT epoch이 필요하면 명시 변환. brand type (`JdTdb`/`JdTt`/`JdTai`/`JdUtc`)으로 컴파일 타임 구분. | P2 | 2026-05-05 |
| 8 | 톨러런스 | **UTC/TAI/TT/JD 1µs (fixture 비트 동일), TDB 100µs (astropy IAU 2009 비교)**, invariant test는 cancellation 한계로 1e-4 (~100µs) | TS와 Python이 같은 알고리즘 → 같은 IEEE 754 결과 (fixture-based bit-identical). astropy 비교는 모델 차이 ~50µs + 안전 마진. JD ~2.46e6 + double precision = 9 fractional digits → invariant 검증은 cancellation 한계 안에서. | P2 | 2026-05-05 |
| 9 | 세차/장동 모델 | **무시 (J2000 고정)** — Work 7/8 timeline 확장 시 재평가 | J2000 ± 100yr 누적 오차 ~50″ (Work 2~6 visualization timeline에 충분). IAU 2006/2000A 풀 모델은 코드 ~수 KB + 매 frame 평가 비용. 보이저(1977)~미래 100년 시연 시 mas 정밀도 부족 → Work 12 검증 시 재고. | P3 | 2026-05-05 |
| 10 | ICRF↔EME2000 frame bias | **적용** (RB matrix from ERFA `bp00` / IAU 2006/2000A, ~23 mas RSS) | 23 mas는 1 AU 거리에서 ~17 km — 무시 못함. RB는 시간 무관 상수 (한 번 계산 후 임베드). ERFA/libm 빌드별 마지막 bit 차이를 허용하기 위해 런타임 ERFA 비교는 1 ULP 안에서 검증. orthogonality `B Bᵀ = I` 1e-15 안에서 보장. | P3 | 2026-05-05 |
| 11 | 회전 행렬 표현 | **3×3 row-major readonly tuple `[number; 9]`** + `Vec3 = readonly [n,n,n]` | 9개 분리 곱셈으로 명시 (loop unroll → cancellation/precision 안정 + `noUncheckedIndexedAccess` 우회). `THREE.Matrix3` 어댑터는 Work 5 렌더링 단계에서 추가. matMul3/matVec3/transposeMatrix3 헬퍼만 제공. | P3 | 2026-05-05 |
| 12 | 황도경사 ε | **IAU 2006 P03 J2000 = 0.4090926006005829 rad** (P1 #1에서 결정한 `EPS_J2000` 재사용) | ERFA `obl06(2451545.0, 0.0)` 결과 = 84381.406 arcsec. IAU 1976 (84381.448 arcsec) 대비 0.04 arcsec = 40 mas 차이 — IAU 2006이 더 정확. R_x(ε) = `[[1,0,0],[0,cos ε,sin ε],[0,-sin ε,cos ε]]` 컨벤션. | P3 | 2026-05-05 |
| 13 | IAU 회전 데이터 출처 | **TS는 NAIF `pck00011.tpc` BODY399 상수 인라인, Python은 spiceypy text-PCK 평가 병행** | NAIF `pck00011`은 WGCCRE 2015 기반 PCK지만 Earth/Moon orientation은 2015 보고서에서 빠져 2009 WGCCRE 값을 계승한다고 명시. 런타임 PCK 다운로드 없이 동일 BODY399 계수를 `lmpool`로 로드해 SPICE 행렬 컨벤션을 검증. | P4 | 2026-05-05 |
| 14 | P4 검증 천체 | **지구만** | Work 6에서 전체 천체로 확장. P4는 인터페이스와 행렬 방향을 고정하는 단계라 가장 자주 검증될 Earth W/IAU_EARTH 1건으로 충분. | P4 | 2026-05-05 |
| 15 | body-fixed 행렬 API | **양방향 제공** (`inertialToBodyFixed`, `bodyFixedToInertial`) | 계획서의 함수명/괄호 설명 방향이 서로 달라 혼동 가능. 이름의 물리 방향을 따르고, `inertialToBodyFixed`는 SPICE `pxform("J2000", "IAU_EARTH", et)`와 일치하도록 검증. | P4 | 2026-05-05 |
| 16 | Dev Demo 구조 | **단일 페이지 + 4 섹션** | P2~P4 산출물이 각각 독립 패널로 깔끔하게 분리됨. 탭 없이 한 화면에서 시간/좌표/자전 값을 동시에 비교 가능. | P5 | 2026-05-05 |
| 17 | J2000 라이브 카운터 | **`setInterval(1000)`** | 1초 단위 표시라 `requestAnimationFrame`의 frame-rate 갱신 비용이 필요 없음. React state 갱신도 초당 1회로 제한. | P5 | 2026-05-05 |
| 18 | Fixture 형식 | **JSON** (사람-가독 + git diff 친화) | Python `json.dump(indent=2)` + Prettier 정렬. JSONL/Parquet은 diff 검토가 어려움. | P6 | 2026-05-05 |
| 19 | Fixture 갱신 정책 | **수동** — `pnpm fixtures:work-02` 후 reviewer가 diff 검토하고 commit | 모델/상수 변경은 의도적 결정이어야 하므로 CI 자동 갱신 금지. IERS/PCK/IAU 갱신 시 사람이 명시적으로 재생성. | P6 | 2026-05-05 |
| 20 | Diff 헬퍼 톨러런스 | **시간 1µs (TDB 100µs) / 각도 1mas / 거리 1mm** — `tests/helpers/expectClose.ts` 단일 출처 | Work 2 fixture 비교부터 Work 3+ ephemeris/궤도까지 공통 사용. 도메인별 helper(`expectCloseDays`/`expectCloseDegrees`/`expectCloseMeters`/`expectCloseVec3`/`expectCloseMatrix3`) 제공. | P6 | 2026-05-05 |
| 21 | 헬퍼 위치 | **`tests/helpers/`** (`src/test-utils/` 후보 대비) | tests/는 prod 산출물에 포함되지 않고 coverage exclude 자연 적용. tsconfig.test가 이미 `tests/` 포함. | P6 | 2026-05-05 |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정
- [x] 상수 출처: **IAU 2015 + DE440 정합** ✓ (#1)
- [x] NAIF 카탈로그 범위: **29 entries** (Sun + 9 bary + 9 body + Moon + 갈릴레이 4 + 토성 5) ✓ (#2)
- [x] 단위 안전 타입: **brand type** ✓ (#3)
- [x] 상수 모듈 분리 정책: **단일 `constants.ts`** ✓ (#4)

### P2에서 결정
- [x] Leap second 처리: **정적 임베드** ✓ (#5)
- [x] TDB-TT 모델: **Fairhead-Bretagnon 1990 simplified, 1차항** ✓ (#6)
- [x] JD epoch 기준 시각: **TDB** ✓ (#7)
- [x] 톨러런스: **UTC/TAI/TT/JD 1µs / TDB 100µs / invariant 1e-4** ✓ (#8, cancellation 한계 발견 후 조정)

### P3에서 결정
- [x] 세차/장동 모델: **무시 (J2000 고정)** ✓ (#9)
- [x] ICRF↔EME2000 frame bias: **적용** (ERFA bp00 RB 매트릭스 임베드) ✓ (#10)
- [x] 회전 행렬 표현: **3×3 row-major readonly tuple** (loop unroll matMul3) ✓ (#11)
- [x] 황도경사 ε 값: **IAU 2006 P03 J2000 = 0.4090926006005829 rad** (P1 EPS_J2000 재사용) ✓ (#12)

### P4에서 결정
- [x] IAU 회전 데이터 출처: **NAIF pck00011 BODY399 인라인 + spiceypy text-PCK reference 병행** ✓ (#13)
- [x] 본 phase 검증 천체: **지구만** ✓ (#14)
- [x] 행렬 API 방향: **ICRF/J2000→body-fixed + inverse 둘 다 제공** ✓ (#15)

### P5에서 결정
- [x] Dev Demo 구조: **단일 페이지 4 섹션** ✓ (#16)
- [x] J2000 라이브 카운터 구현: **setInterval(1000)** ✓ (#17)

### P6에서 결정
- [x] Fixture 형식: **JSON** ✓ (#18)
- [x] Fixture 갱신 정책: **수동** (`pnpm fixtures:work-02`) ✓ (#19)
- [x] Diff 헬퍼 톨러런스: **시간 1µs / 각도 1mas / 거리 1mm** ✓ (#20, #21 헬퍼 위치 추가)

### 추후 보류 (Work 2 범위 밖)
- TDB-TT 풀 모델 업그레이드 — Work 8/12 정밀도 요구에 따라
- 세차/장동 적용 — Work 7/8 시점 (보이저 시대 ↔ 미래 100년) 정밀도 요구에 따라
- IAU 회전 모델 전체 천체 데이터 — Work 6
- 천체 카탈로그 확장 (소행성, 혜성) — Work 7

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록. 형식: 경로 + 한 줄 메모.

### P1 — Constants & NAIF Catalog _(완료 2026-05-05)_
설치된 의존성 (`uv pip install -e ".[astro,dev]"`):
- astropy 7.2.0, astroquery 0.4.11, spiceypy 8.1.0
- pyerfa 2.0.1.5 (astropy 의존성, IAU 2006 `obl06` 호출에 직접 사용)
- + 보조 (astropy-iers-data, beautifulsoup4, requests, html5lib, keyring 등 17 패키지)

생성된 파일:
- [`src/astro/units.ts`](../../src/astro/units.ts) — Brand types (`Meters`, `MetersPerSecond`, `CubicMetersPerSecondSquared`, `Seconds`, `Radians`, `Degrees`, `ArcSeconds`) + 변환 헬퍼 (`degToRad`, `arcSecToRad`, `radToDeg`, `radToArcSec`).
- [`src/astro/constants.ts`](../../src/astro/constants.ts) — `AU` (IAU 2012), `C_LIGHT` (SI), `LIGHT_TIME_AU` (=AU/c), `EPS_J2000` (ERFA `obl06`), `GM` 객체 (DE440, 12 키). `GMKey` type export.
- [`src/astro/naif.ts`](../../src/astro/naif.ts) — `NAIF_CATALOG` (29 entries, parent 계층), `NaifEntry` interface, `NaifKind` type, `NAIF_IDS`, `getByNaifId(id)` 헬퍼. `as const satisfies` 패턴.
- [`src/astro/index.ts`](../../src/astro/index.ts) — 세 모듈 re-export.
- [`tools/python/src/orbitarium_tools/constants.py`](../../tools/python/src/orbitarium_tools/constants.py) — TS 미러. `Final` 타입 어노테이션.
- [`tools/python/src/orbitarium_tools/naif.py`](../../tools/python/src/orbitarium_tools/naif.py) — TS 미러. `@dataclass(frozen=True, slots=True)`.

테스트 파일:
- [`tests/unit/astro/constants.test.ts`](../../tests/unit/astro/constants.test.ts) — 13 tests (정의값 / 황도경사 / GM 테이블 / 질량 정렬).
- [`tests/unit/astro/naif.test.ts`](../../tests/unit/astro/naif.test.ts) — 8 tests (count/uniqueness/Sun/planet 부모/Moon/갈릴레이/토성5/lookup).
- [`tests/unit/astro/units.test.ts`](../../tests/unit/astro/units.test.ts) — 4 tests (round-trip).
- [`tools/python/tests/test_constants.py`](../../tools/python/tests/test_constants.py) — 14 tests (astropy/ERFA 비교 + DE440 매치 + 질량 정렬).
- [`tools/python/tests/test_naif.py`](../../tools/python/tests/test_naif.py) — 9 tests (TS와 동일 구조).

검증 결과:
- `pnpm typecheck` ✓ (4 tsbuildinfo, no errors)
- `pnpm lint` ✓ — 초기 `no-loss-of-precision` 2건 발견 → GM_sun 19자리(`1.32712440041279419e20`)를 IEEE 754에 정확히 fit하는 17자리(`1.3271244004127942e20`)로 표기 변경 (값은 동일).
- `pnpm format:check` ✓ — Prettier 자동 정렬 (long arrow function 1줄 fit, GM 객체 trailing 0 trim).
- `pnpm test` ✓ — 26 tests pass (4→26, 추가 22). 시간 ~280ms.
- `pnpm build` ✓ — 1113.46 kB (P4와 동일, astro 모듈은 작아서 표시 차이 없음).
- `pnpm test:e2e` ✓ — 7 tests pass, 회귀 없음.
- `uv run ruff check src tests` ✓ — 초기 SIM300 yoda 3건 → astropy/ERFA 비교 좌우 순서 뒤집기 (Final 상수가 좌측이면 ruff가 yoda로 분류).
- `uv run mypy src` ✓ — strict 모드, 4 source files.
- `uv run pytest` ✓ — 26 tests pass (3→26, 추가 23). 시간 ~160ms.

설계 결정:
- IEEE 754 표기: DE440 publication value (`1.32712440041279419e20`, 19자리) 와 IEEE 754 double 라운딩(`1.3271244004127942e20`, 17자리)이 비트 단위 동일 — TS/Python 모두 17자리 표기 + 주석으로 publication 값 명시.
- 행성 시스템 GM 출처 차이: IAU 2015 nominal (7자리) vs DE440 (12자리)는 행성에서 ~2e-4 차이 (예: `jupiter_bary`). 7자리 매치는 GM_sun에서만 보장 — 다른 행성 GM의 정밀 cross-check는 Work 3에서 spiceypy/PCK로.
- ruff SIM300 처리: Final 상수가 좌측이면 yoda 분류 → astropy/ERFA reference value를 좌측에 두는 패턴으로 통일 (`assert const.au.value == AU`).

### P2 — Time Systems _(완료 2026-05-05)_
생성/수정 파일:
- [`src/astro/leapSeconds.ts`](../../src/astro/leapSeconds.ts) — IERS Bulletin C 70 정적 테이블 (28 entries, 1972-01-01 ~ 2017-01-01). `LeapSecondEntry` interface, `LEAP_SECONDS` const tuple, `FIRST_LEAP_JD_UTC`/`FIRST_LEAP_OFFSET_S` 헬퍼.
- [`src/astro/time.ts`](../../src/astro/time.ts) — Brand types (`JdUtc`/`JdTai`/`JdTt`/`JdTdb`), 상수 (`SECONDS_PER_DAY`, `TT_TAI_OFFSET_S`, `UNIX_EPOCH_JD`, `MJD_OFFSET`, `J2000_JD_TDB`), 변환 함수 6개 (`leapSecondsAt`, `utcToJdUtc`, `utcToJdTai`, `utcToJdTt`, `utcToJdTdb`, `tdbMinusTtSeconds`), JD 헬퍼 (`jdToJ2000Days`, `jdToMjd`).
- [`src/astro/index.ts`](../../src/astro/index.ts) — `time` / `leapSeconds` re-export 추가.
- [`tools/python/src/orbitarium_tools/time.py`](../../tools/python/src/orbitarium_tools/time.py) — TS 미러 (동일 알고리즘 → IEEE 754 비트 동일). `LeapSecondEntry` (frozen dataclass), `LEAP_SECONDS` tuple, `REPRESENTATIVE_TIMES_UTC` (21 시각), `generate_fixtures(out_dir)` 함수.
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `fixtures --work=N --out=DIR` 서브커맨드 추가. Work 2 라우팅 구현.
- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — Python job extras `[dev]` → `[astro,dev]` (astropy/spiceypy/pyerfa 설치).

테스트 + fixture:
- [`tests/fixtures/work-02/time.json`](../../tests/fixtures/work-02/time.json) — 21 representative UTC instants → (utc_iso, leap_seconds, jd_utc, jd_tai, jd_tt, jd_tdb, j2000_days_tdb, mjd_tdb). 메타데이터 (`_tolerance_us=1`, `_tdb_tolerance_us=100`, `_source`) 포함. CLI로 재생성 가능.
- [`tests/unit/astro/time.test.ts`](../../tests/unit/astro/time.test.ts) — fixture 자동 순회 (21 × 7 항목 = 147) + invariants 9건. 총 ~158 sub-tests.
- [`tools/python/tests/test_time.py`](../../tools/python/tests/test_time.py) — 20 tests: leap table 구조, 변환 invariant, TDB-TT 모델, astropy cross-check, fixture 생성/자기일관성, J2000/MJD.

검증 결과:
- `pnpm typecheck` ✓
- `pnpm lint` ✓ — 초기 `let offset = LEAP_SECONDS[0].offset` 가 literal `10` 추론 → 다른 entry 할당 fail. `let offset: number = ...` 명시 어노테이션으로 해결.
- `pnpm format:check` ✓
- `pnpm test` ✓ — 184 tests (P1 26 + P2 158).
- `pnpm build` ✓ — 1113 kB (변동 없음, astro 모듈은 light).
- `pnpm test:e2e` ✓ — 7 tests, 회귀 없음.
- `uv run ruff check` ✓ — 24 errors → 19 자동 fix (UP017: `timezone.utc` → `datetime.UTC`), 5 RUF002/003 수동 fix (유니코드 `−`/`–` → ASCII `-` for ambiguity).
- `uv run mypy src` ✓ — strict 모드, 5 source files.
- `uv run pytest` ✓ — 46 tests (P1 26 + P2 20). astropy ErfaWarning 3건 (미래 시각 dubious year, 기능 영향 없음).

설계 결정 + 발견:
- **TS와 Python이 동일 알고리즘**: 같은 IEEE 754 ops + 같은 입력 → 비트 동일 결과. fixture는 알고리즘 reference, 비교는 1µs 안전 마진 (실제 차이는 0).
- **astropy 비교 (TDB만)**: 우리 simplified 1차항 vs astropy IAU 2009 풀 시리즈 — 50µs 안에서 일치 (test budget 100µs).
- **JD precision 한계**: JD ~2.46e6 in IEEE 754 double = ~9 fractional digits → 1µs (1e-11 day) 정밀도가 borderline. 두 큰 JD 차분 시 cancellation으로 ~14µs(TT-TAI) / ~0.5µs(TAI-UTC) 오차 누적. invariant 테스트는 1e-4 톨러런스 (fixture-based 비교는 정확).
- **JS Date의 leap second 표현 불가**: `2016-12-31T23:59:60Z` 같은 입력은 JS Date로 생성 불가 (POSIX time) — 본 프로젝트도 leap second 직전/직후 instant만 지원. fixture에 두 케이스 (`2016-12-31T23:59:59` / `2017-01-01T00:00:00`) 포함.
- **CI workflow extras 갱신**: P1 메모대로 `[astro,dev]` 적용 — Python job에서 astropy/spiceypy 사용 가능 (P3+ frames/rotation reference에 필요).
- **CLI 패턴 정착**: `orbitarium-tools fixtures --work=N --out=DIR` — Work 3+에서도 동일 패턴으로 새 모듈 추가만 하면 된다.

### P3 — Reference Frames (Core) _(완료 2026-05-05)_
생성/수정 파일:
- [`src/astro/frames.ts`](../../src/astro/frames.ts) — `Vec3` / `Matrix3` (readonly tuples), 행렬 헬퍼 (`matVec3`, `matMul3`, `transposeMatrix3`, `IDENTITY_MATRIX3`), 6개 변환 행렬 (`ICRF_TO_EME2000` 임베드 + 5개 파생), 6개 vector convenience 함수.
- [`src/astro/index.ts`](../../src/astro/index.ts) — `frames` re-export 추가.
- [`tools/python/src/orbitarium_tools/frames.py`](../../tools/python/src/orbitarium_tools/frames.py) — TS 미러. `erfa_frame_bias_matrix()` 헬퍼 (런타임 ERFA bp00 비교용). `_TEST_VECTORS_ICRF` 12개 + `generate_fixtures(out_dir)` 함수.
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `args.work == 2` 분기에서 time + frames 두 fixture 생성 호출.

테스트 + fixture:
- [`tests/fixtures/work-02/frames.json`](../../tests/fixtures/work-02/frames.json) — 12 ICRF 테스트 벡터 (단위 축 6개, 1/√3 단위벡터, 임의 3개, 1AU magnitude 2개) → (eme2000, ecliptic_j2000, round_trip_icrf). 추가로 `matrices` 섹션에 임베드 행렬 9-tuple 3개.
- [`tests/unit/astro/frames.test.ts`](../../tests/unit/astro/frames.test.ts) — 5 그룹: 행렬 유틸 (5 tests) + 임베드 행렬 sanity (4 tests) + orthogonality `B Bᵀ = I` (3 tests) + transpose 페어 (3 tests) + fixture 비교 (12 × 5 = 60 tests) + 축 방향 (2 tests). 총 ~77 sub-tests.
- [`tools/python/tests/test_frames.py`](../../tools/python/tests/test_frames.py) — 15 tests: 임베드/ERFA bp00 1 ULP 비교, frame bias magnitude, orthogonality (3건), 축 방향 (2건), 라운드트립, astropy ICRS↔BarycentricMeanEcliptic 1mas 비교, fixture 생성/자기일관성.

검증 결과:
- `pnpm typecheck` ✓ — `Matrix3 = readonly [n,n,n,...,n]` (9-tuple) 패턴이 `noUncheckedIndexedAccess`를 자연 우회 (positional [0]~[8]).
- `pnpm lint` ✓ — 초기 simple-import-sort 1건 → autofix.
- `pnpm format:check` ✓ — Prettier가 `EME2000_TO_ECLIPTIC_J2000` 9-element literal을 9줄로 분할 (가독성 약간 떨어지지만 일관).
- `pnpm test` ✓ — **261 tests** (P1+P2 184 → P3 +77).
- `pnpm build` ✓ — 1113.46 kB (변동 없음).
- `pnpm test:e2e` ✓ — 7 tests, 회귀 없음.
- `uv run ruff check` ✓ — 6 SIM300 yoda → autofix (Final 상수 좌측 → 우측). RUF002/003 minus/dash 룰 회피 (ASCII만 사용).
- `uv run mypy src` ✓ — `erfa` 모듈 type stubs 없음 → `import erfa  # type: ignore[import-untyped]` 처리.
- `uv run pytest` ✓ — **61 tests** (P1+P2 46 → P3 +15).

설계 결정 + 발견:
- **임베드 vs 런타임 ERFA**: TS는 ERFA를 못 부르므로 bp00 결과 9 doubles 임베드. Python은 정상 임포트 + 헬퍼 `erfa_frame_bias_matrix()`로 매번 ERFA 호출. ERFA/libm 빌드에 따라 마지막 bit가 달라질 수 있어 1 ULP 안에서 검증 (`test_icrf_to_eme2000_matches_erfa_bp00_within_one_ulp`). 향후 IERS가 bias 모델 업데이트 시 한 번만 갱신.
- **R_x(ε) 부호 컨벤션**: `R_x(ε) = [[1,0,0],[0,cos ε,sin ε],[0,-sin ε,cos ε]]` — ICRF Z (0,0,1) → ecliptic (0, +sin ε, cos ε). 처음 docstring에 -sin ε 적은 건 잘못 — 테스트 expected value도 +sin ε로 수정.
- **frame bias 컴포넌트 한계**: ICRF X → ecliptic Z 컴포넌트는 frame bias + R_x(ε) 합성으로 ~21 mas (단순 ~17 mas 아님) — 톨러런스 1e-7 → 2e-7로 완화.
- **astropy 비교의 의미**: 우리 transform vs astropy `ICRS → BarycentricMeanEcliptic(equinox=J2000.0)` 1 mas 안에서 일치 (J2000 epoch에서 precession=0이므로 mean ecliptic = our ICRF→Ecliptic). 본 구현이 astropy reference와 호환됨을 보장.
- **Loop-unrolled matMul3**: 9개 분리 expression — TS의 noUncheckedIndexedAccess 우회 + dynamic index 추론 회피 + IEEE 754 evaluation 안정성. 가독성 약간 떨어지나 cancellation 위험 없음.

### P4 — IAU Rotation Model Foundation _(완료 2026-05-05)_
생성/수정 파일:
- [`src/astro/rotation.ts`](../../src/astro/rotation.ts) — `IAURotationModel` / `IAUAngleModel` 타입, polynomial + periodic term evaluator, `evaluateRotation`, `inertialToBodyFixed`, `bodyFixedToInertial`, `normalizeDegrees`. SPICE text-PCK Euler sequence `Rz(-W) * Rx(dec - 90deg) * Rz(-(90deg + ra))` 적용.
- [`src/astro/rotationData.ts`](../../src/astro/rotationData.ts) — Earth `IAU_EARTH` model (`BODY399_POLE_RA`, `BODY399_POLE_DEC`, `BODY399_PM`). NAIF `pck00011.tpc` 기준, Earth orientation은 WGCCRE 2009 계승.
- [`src/astro/index.ts`](../../src/astro/index.ts) — `rotation` / `rotationData` re-export 추가.
- [`tools/python/src/orbitarium_tools/rotation.py`](../../tools/python/src/orbitarium_tools/rotation.py) — TS 미러 + `spice_earth_inertial_to_body_fixed(jd_tdb)` helper. 런타임 다운로드 없이 minimal BODY399 text-PCK lines를 `spiceypy.lmpool`로 로드.
- [`tools/python/src/orbitarium_tools/cli.py`](../../tools/python/src/orbitarium_tools/cli.py) — `args.work == 2` 분기에서 time + frames + rotation fixture 생성.

테스트 + fixture:
- [`tests/fixtures/work-02/rotation-earth.json`](../../tests/fixtures/work-02/rotation-earth.json) — J2000 ±50yr, J2000+12h, mission/current/future UTC cases → (ra, dec, W, inertial↔body matrices, spiceypy matrix, max diff). `work_02_current_date = 2026-05-05T00:00:00.000Z` 포함.
- [`tests/unit/astro/rotation.test.ts`](../../tests/unit/astro/rotation.test.ts) — Earth BODY399 coefficients, J2000 angles, angle normalization, periodic term evaluator, fixture angles 1mas 비교, SPICE text-PCK matrix convention 비교, inverse transpose/orthogonality. 33 tests.
- [`tools/python/tests/test_rotation.py`](../../tools/python/tests/test_rotation.py) — Earth coefficient sanity, minimal PCK lines, J2000 angles, normalization, periodic term evaluator, matrix orthogonality/inverse, spiceypy `pxform("J2000","IAU_EARTH")` 1mas 비교, fixture 생성/자기일관성. 10 tests.

검증 결과:
- `pnpm lint` ✓
- `pnpm format:check` ✓
- `pnpm typecheck` ✓
- `pnpm test` ✓ — 294 tests (P3 261 → P4 +33).
- `pnpm build` ✓ — 1113.46 kB, 기존 Vite chunk-size warning만 표시.
- `pnpm test:e2e` ✓ — 7 tests, 회귀 없음. 기존 `NO_COLOR`/`THREE.Clock` warning만 표시.
- `uv run ruff check src tests` ✓
- `uv run mypy src` ✓ — strict 모드, 7 source files.
- `uv run pytest -q` ✓ — 71 tests (P3 61 → P4 +10), 기존 astropy ERFA dubious year warning 3건.

설계 결정 + 발견:
- **Earth data source nuance**: NAIF `pck00011.tpc` 자체는 WGCCRE 2015 기반이지만, 파일 주석상 Earth/Moon orientation은 2015 보고서에서 제공되지 않아 WGCCRE 2009 값을 계승. 코드/fixture/source metadata에 이 사실을 명시.
- **SPICE 행렬 방향**: `inertialToBodyFixed`가 SPICE `pxform("J2000", "IAU_EARTH", et)`와 1mas보다 훨씬 작은 오차(현재 fixture max ~1e-11 component)로 일치. `bodyFixedToInertial`은 transpose로 제공.
- **PCK 다운로드 회피**: 테스트는 외부 커널 파일 다운로드 없이 `lmpool`으로 최소 BODY399 text-PCK assignment를 로드한다. CI 안정성 + SPICE semantics 검증을 동시에 확보.
- **JS `% 360` 마지막 bit 흔들림**: `normalizeDegrees`는 이미 `[0, 360)` 범위면 원값을 그대로 반환해 J2000 `W=190.147` 같은 상수 epoch 값을 보존.

### P5 — Dev Demo `/dev/astro` _(완료 2026-05-05)_
생성/수정 파일:
- [`src/dev/astro/AstroDemo.tsx`](../../src/dev/astro/AstroDemo.tsx) — Work 2 dev demo shell. P2~P4 패널 4개를 단일 페이지 grid로 배치.
- [`src/dev/astro/TimeConverter.tsx`](../../src/dev/astro/TimeConverter.tsx) — UTC `datetime-local` 입력을 UTC로 해석해 leap seconds, JD UTC/TAI/TT/TDB, MJD, J2000 days 표시.
- [`src/dev/astro/J2000Counter.tsx`](../../src/dev/astro/J2000Counter.tsx) — 현재 UTC 기준 J2000 경과 시간 live counter. `setInterval(1000)` 사용.
- [`src/dev/astro/FrameConverter.tsx`](../../src/dev/astro/FrameConverter.tsx) — ICRF / EME2000 / Ecliptic J2000 입력 프레임 선택 + 3D vector 변환 + round-trip norm 표시.
- [`src/dev/astro/EarthRotation.tsx`](../../src/dev/astro/EarthRotation.tsx) — Earth `W`, pole RA/Dec, JD TDB, `ICRF/J2000 → IAU_EARTH` matrix 표시. live/fixed UTC 입력 지원.
- [`src/dev/astro/{format,timeInput}.ts`](../../src/dev/astro/format.ts) — dev panel formatting, vector diff, UTC input parse/format helpers.
- [`src/dev/astro/astro.css`](../../src/dev/astro/astro.css) / [`src/dev/dev.css`](../../src/dev/dev.css) — astro demo styling. `dev.css`가 astro CSS를 import.
- [`src/dev/registry.ts`](../../src/dev/registry.ts) — Work 2 `Component: lazy(() => import('./astro/AstroDemo'))` 연결. `/dev/index` 카드 available 전환.

테스트:
- [`tests/e2e/dev-index.spec.ts`](../../tests/e2e/dev-index.spec.ts) — Work 2 available + 나머지 10개 placeholder, Work 2 카드 `/dev/astro` navigation 검증.
- [`tests/e2e/dev-astro.spec.ts`](../../tests/e2e/dev-astro.spec.ts) — 4개 패널 렌더, time converter fixed UTC, frame converter output, Earth rotation W 검증. 4 tests.

검증 결과:
- `pnpm format:check` ✓
- `pnpm lint` ✓
- `pnpm typecheck` ✓
- `pnpm test` ✓ — 294 tests
- `pnpm test:e2e -- tests/e2e/dev-astro.spec.ts tests/e2e/dev-index.spec.ts` ✓ — 9 tests

설계 결정 + 발견:
- **UTC 입력 처리**: 브라우저 `datetime-local`은 timezone을 갖지 않으므로 dev helper에서 문자열 뒤에 `Z`를 붙여 UTC로 해석한다. e2e에서는 Chromium의 `datetime-local` fill 규칙에 맞춰 분 단위 값을 입력.
- **카탈로그 상태 변경**: `/dev/index`의 Work 2 카드만 `available`, 나머지 10개는 placeholder. 기존 e2e 기대값을 이에 맞춰 갱신.
- **CSS import 방식**: TS side-effect CSS import를 새 dev page마다 늘리지 않고 `dev.css`에서 `@import './astro/astro.css'`로 묶었다.

### P6 — Cross-validation & Golden Fixtures (Closeout) _(완료 2026-05-05)_
생성/수정 파일:
- [`tests/helpers/expectClose.ts`](../../tests/helpers/expectClose.ts) — 톨러런스 매처 단일 출처. `expectCloseSeconds`/`expectCloseDays`/`expectCloseDegrees`/`expectCloseRadians`/`expectCloseMeters`/`expectCloseVec3`/`expectCloseMatrix3` + 톨러런스 상수 (`TOL_TIME_US=1`, `TOL_TIME_TDB_US=100`, `TOL_ANGLE_MAS=1`, `TOL_DISTANCE_MM=1`) + 단위 변환 헬퍼 (`masToDeg`/`masToRad`/`usToDays`).
- [`tests/helpers/fixtures.ts`](../../tests/helpers/fixtures.ts) — `loadWorkFixture<T>(workNumber, filename)` + `workFixturesDir(n)` 헬퍼.
- [`tests/unit/helpers/expectClose.test.ts`](../../tests/unit/helpers/expectClose.test.ts) — 헬퍼 자체 단위 테스트 17건 (pass/throw 양쪽).
- [`tests/fixtures/work-02/README.md`](../../tests/fixtures/work-02/README.md) — fixture 파일 구성/스키마(time/frames/rotation-earth)/재생성 명령/톨러런스 정책/회귀 가드 검증 문서화.
- [`docs/architecture/astro-conventions.md`](../../docs/architecture/astro-conventions.md) — 시간/좌표/회전 정책 요약 + Work 3+ 진입 체크리스트. 결정 로그 §2 #1~#17 인덱싱.
- [`package.json`](../../package.json) — `pnpm fixtures:work-02` 스크립트 추가 (CLI generate + Prettier --write 묶음).

검증 결과:
- `pnpm format:check` ✓
- `pnpm lint` ✓
- `pnpm typecheck` ✓
- `pnpm test` ✓ — **311 tests** (P5 294 → P6 +17 from helper unit tests).
- `pnpm build` ✓ — 1113.46 kB.
- `pnpm test:e2e` ✓ — 12 tests pass.
- `cd tools/python && uv run ruff check src tests` ✓ — All checks passed.
- `uv run mypy src` ✓ — 7 source files.
- `uv run pytest -q` ✓ — 71 tests pass.
- `pnpm fixtures:work-02` 실행 후 `git diff tests/fixtures/work-02/` 빈 결과 — fixture 재생성 idempotent 확인.
- 회귀 가드: `EARTH_IAU_ROTATION` `prime_meridian` 첫 항을 0.001 deg(=3600 mas) 흔들어 `pnpm test`에서 29 건 fail (rotation fixture 비교 + SPICE pxform 비교 + transpose 검증 모두 검출) → 원복 후 그린 확인.

설계 결정 + 발견:
- **헬퍼 위치**: `tests/helpers/`로 결정 (`src/test-utils/` 대신). prod 산출물에 포함되지 않고 coverage exclude 자연 적용 + 이미 `tsconfig.test.json`이 `tests/`를 포함. 결정 #21에 기록.
- **`expectCloseDays` 단위 테스트의 JD 한계**: JD ~2.46e6에 1µs(=1.16e-11 days)를 더하면 IEEE 754 cancellation으로 사라짐. 헬퍼 단위 테스트는 small day value (0.5)에서 검증하도록 수정 — 헬퍼 자체의 기능은 정확하지만 caller가 비교 시 cancellation 한계를 인지해야 함 (이는 P2 결정 #8과 동일한 이유로, fixture는 비트 동일 비교가 1순위).
- **Python json.dump vs Prettier 형식 차이**: `json.dump(indent=2)`는 array 한 element/줄, Prettier는 `--print-width 100` 적용해 multi-element/줄. 두 출력은 의미상 동일하지만 textual diff 발생 → `pnpm fixtures:work-02` 스크립트가 generate 후 자동으로 Prettier --write로 정렬한다.
- **회귀 가드 설계**: `prime_meridian` 첫 항 0.001 deg(=3600 mas) 변경으로 fixture 비교(angle 1mas, matrix 1e-10) + SPICE pxform 비교 + transpose 검증이 모두 fail → 단일 변경으로 다층 검증 모두 작동 확인. 향후 정확도 정책을 변경하려는 작업자는 fixture 먼저 재생성 후 reviewer가 diff 검토.

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 즉시 액션: Work 2 마감 → Work 3 (Ephemeris) 진입 준비

1. Work 2 commit (`[work-02/p6] ...` prefix), push, CI 그린 확인.
2. Work 3 plan + handoff 짝 문서 생성: `docs/plan/work-03-ephemeris.md` + `work-03-ephemeris-handoff.md`.
   - DE440/SPK 커널 평가, Horizons API 클라이언트, 위치/속도 시간변환 등 phase 정의.
   - Work 2 산출물(특히 `JdTdb` brand type, `expectClose*`, fixture CLI 패턴)을 적극 import해 재사용.
3. (선택) `overview.md` Work 2 상태를 in-progress → done으로 갱신할지는 사용자 정책에 따른다 (overview.md는 큰 그림 유지용).

### P1+P2+P3+P4+P5+P6 산출물 빠른 참조

```ts
// src/astro/index.ts 가 export하는 핵심 심볼
import { AU, C_LIGHT, LIGHT_TIME_AU, EPS_J2000, GM } from '@/astro'
import { NAIF_CATALOG, getByNaifId, type NaifEntry } from '@/astro'
import { degToRad, arcSecToRad, type Meters, type Radians } from '@/astro'
import {
  utcToJdUtc, utcToJdTai, utcToJdTt, utcToJdTdb,
  jdToJ2000Days, jdToMjd, leapSecondsAt,
  J2000_JD_TDB, TT_TAI_OFFSET_S, SECONDS_PER_DAY,
  type JdTdb, type JdTt,
} from '@/astro'
import {
  ICRF_TO_EME2000, ICRF_TO_ECLIPTIC_J2000, EME2000_TO_ECLIPTIC_J2000,
  icrfToEme2000, icrfToEcliptic, eme2000ToEcliptic,
  matVec3, matMul3, transposeMatrix3,
  type Vec3, type Matrix3,
} from '@/astro'
import {
  EARTH_IAU_ROTATION, evaluateRotation,
  inertialToBodyFixed, bodyFixedToInertial,
  normalizeDegrees, type IAURotationModel,
} from '@/astro'
```

```python
from orbitarium_tools.constants import AU, C_LIGHT, LIGHT_TIME_AU, EPS_J2000, GM
from orbitarium_tools.naif import NAIF_CATALOG, get_by_naif_id, NaifEntry
from orbitarium_tools.time import (
    utc_to_jd_utc, utc_to_jd_tai, utc_to_jd_tt, utc_to_jd_tdb,
    jd_to_j2000_days, jd_to_mjd, leap_seconds_at,
    J2000_JD_TDB, TT_TAI_OFFSET_S, SECONDS_PER_DAY,
    generate_fixtures,
)
from orbitarium_tools.frames import (
    ICRF_TO_EME2000, ICRF_TO_ECLIPTIC_J2000,
    icrf_to_eme2000, icrf_to_ecliptic,
    mat_vec3, mat_mul3, transpose_matrix3,
    erfa_frame_bias_matrix,
)
from orbitarium_tools.rotation import (
    EARTH_IAU_ROTATION, evaluate_rotation,
    inertial_to_body_fixed, body_fixed_to_inertial,
    spice_earth_inertial_to_body_fixed,
)
```

```ts
// Test helpers
import {
  expectCloseDays, expectCloseDegrees, expectCloseRadians,
  expectCloseMeters, expectCloseVec3, expectCloseMatrix3,
  TOL_TIME_US, TOL_ANGLE_MAS, TOL_DISTANCE_MM,
  masToDeg, masToRad, usToDays,
} from '../../helpers/expectClose'
import { loadWorkFixture, workFixturesDir } from '../../helpers/fixtures'
```

```bash
# Fixture 재생성 (Work 2 전체) — 권장
pnpm fixtures:work-02

# 또는 manual:
cd tools/python && uv run orbitarium-tools fixtures --work=2 --out=../../tests/fixtures/work-02/
cd ../.. && pnpm exec prettier --write tests/fixtures/work-02/
```

### Work 2 전체 진입 전 점검 (2026-05-05 시점)

- Work 1 CI 그린 ✓ (push 후 확인 완료, work-01 handoff §0 참조)
- `tools/python/.venv` 활성화 가능 ✓ (P6 구축)
- `/dev/index` 에서 Work 2 카드 available + `/dev/astro` 접근 가능 ✓

### 주요 컨벤션 (Work 1에서 확정 — 그대로 적용)

```
TS 모듈 위치:
  도메인 코드는 src/<domain>/ — Work 2는 src/astro/ 신설
  dev 페이지는 src/dev/<work-name>/ — Work 2는 src/dev/astro/

Python 모듈:
  tools/python/src/orbitarium_tools/<name>.py — Work 2는 time/frames/constants/naif/rotation
  새 의존성은 pyproject.toml 의 적절한 extras 그룹에 등록 (astro/viz/notebook/dev/all)

테스트:
  단위:  tests/unit/<domain>/<name>.test.ts (vitest, happy-dom)
  e2e:   tests/e2e/<feature>.spec.ts (playwright, chromium)
  fixtures: tests/fixtures/work-NN/ (JSON, Python으로 생성)
  pytest: tools/python/tests/test_<name>.py

Dev 라우트:
  src/dev/registry.ts 의 entry 에 Component 채우면 자동 라우트화
  Work 2 entry slug: 'astro' (placeholder 이미 있음)
  prod 빌드에서 dev 코드 자동 제외 (P3 검증됨, VITE_ENABLE_DEV_ROUTES=true 로만 포함)

CI:
  .github/workflows/ci.yml 에서 lint/typecheck/test/build/e2e/ruff/mypy/pytest 자동 실행
  새 파일 추가는 자동으로 커버됨. 새 의존성은 pyproject.toml 또는 package.json 갱신 후 lockfile 동기화

커밋 prefix: [work-02/p<N>] <한국어 한 줄 요약>
```

### 빠른 검증 명령

```bash
# 프론트엔드
pnpm install
pnpm dev          # /dev/astro (P5 후 활성)
pnpm lint
pnpm typecheck
pnpm test         # vitest 단위
pnpm test:e2e     # playwright e2e
pnpm build

# Python (tools/python/)
cd tools/python
source .venv/bin/activate                  # 또는 uv run <cmd>
uv pip install -e ".[astro,dev]"           # P1 진입 시 astro extras 추가 필요
uv run orbitarium-tools version
uv run ruff check src tests
uv run mypy src
uv run pytest

# 골든 fixture 재생성 (P6 후)
cd tools/python
uv run orbitarium-tools fixtures --work=2 --out=../../tests/fixtures/work-02/
```

## 6. 알려진 이슈 / 노트

- ~~**astro extras 미설치**~~: P1에서 로컬 환경 설치, P2에서 CI workflow도 `[astro,dev]`로 갱신 완료. 신규 sessions에서는 `cd tools/python && uv pip install -e ".[astro,dev]"` 실행.
- **JD precision 한계**: JD ~ 2.46e6 in IEEE 754 double은 ~9 fractional digits (~86µs) 정밀도. fixture-based 비교는 비트 동일이라 1µs 톨러런스 OK이지만, `(jdA - jdB) * 86400` 같은 cancellation 연산은 ~µs 오차 누적. invariant 검증 톨러런스 1e-4 (~100µs)로 정착. Work 8/12에서 시간 정밀도 요구 시 split-JD (integer day + fractional day) 도입 검토.
- **JS Date leap second 표현 불가**: `2016-12-31T23:59:60Z` 같은 입력 생성 불가 (POSIX time). 본 프로젝트는 leap second 직전/직후 instant만 다룸 — 실용적 영향 없음.
- **astropy ERFA dubious year 경고**: 2050/2100 등 미래 시각에서 IERS leap second 미정 → ERFA 경고 (`dubious year`). 본 시각의 TDB 비교는 단순화 모델 자체의 ~50µs 오차로 충분히 가려짐 — 경고는 무시 가능. Work 12 검증 시 적정 시각 범위 명시 권장.
- **astropy 첫 import 시간**: ~1-2초 (지구 회전 데이터 로딩). pytest 첫 실행 느림. 이후 캐시됨.
- **spiceypy PCK 커널 다운로드 불필요**: P4 reference는 `spiceypy.lmpool`로 minimal BODY399 text-PCK constants를 메모리에 로드한다. 외부 PCK 파일 다운로드 없이 SPICE `pxform` semantics만 검증.
- **leap second 갱신**: IERS Bulletin C 가 6월/12월에 갱신. P2의 정적 테이블도 동일 주기로 갱신 필요. 스케줄러는 Work 12 또는 별도 작업으로.
- **단위 brand type의 빌드 영향**: TypeScript phantom type은 런타임 코드 0 — 번들 크기 영향 없음. 단지 컴파일 타임 강제력만.
- **Work 1 알려진 이슈와 동일하게 적용**: Node 24 deprecation 경고는 이미 마이그레이션 완료. R3F THREE.Clock 경고는 자체 코드 영향 없음.

## 7. 갱신 이력 (Changelog)

| 날짜 | 변경 |
|---|---|
| 2026-05-05 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정. P1 결정 4건 대기. |
| 2026-05-05 | **P1 완료** — `src/astro/{constants,naif,units,index}.ts` + Python 미러 + 25 단위 테스트. astro extras (astropy/spiceypy/pyerfa) 설치. IAU 2015+DE440 정합, 29 NAIF entries, brand type 단위 안전, 단일 constants 모듈. typecheck/lint/format/test/build/e2e/ruff/mypy/pytest 전부 그린. IEEE 754 19→17자리 표기 정정 + ruff SIM300 yoda 비교 순서 정정 처리 |
| 2026-05-05 | **P2 완료** — `src/astro/{leapSeconds,time}.ts` + Python 미러 + `tests/fixtures/work-02/time.json` (21 representative times) + `orbitarium-tools fixtures --work=2 --out=...` CLI. UTC↔TAI↔TT↔TDB 변환 (TS와 Python 비트 동일, fixture 1µs 매치, astropy IAU 2009 대비 TDB ~50µs). Brand type `JdTdb/JdTt/JdTai/JdUtc`. CI extras `[dev]` → `[astro,dev]`. typecheck/lint/format/test(184)/build/e2e/ruff/mypy/pytest(46) 전부 그린. ruff UP017(timezone.utc→UTC alias) 19건 + RUF002/003(유니코드 minus/dash) 5건 정리. let-binding offset 타입 narrowing 수정. invariant test 톨러런스 1e-4 (cancellation 한계) |
| 2026-05-05 | **P3 완료** — `src/astro/frames.ts` + Python 미러 + `tests/fixtures/work-02/frames.json` (12 vectors + 3 matrices). ICRF↔EME2000 frame bias (ERFA bp00 RB 임베드, 9 doubles, ~23 mas RSS) + EME2000↔Ecliptic R_x(ε) + 합성 ICRF↔Ecliptic. `Vec3`/`Matrix3` readonly tuple, loop-unrolled matMul3 (9 명시 expression). 세차/장동 무시(J2000 고정), IAU 2006 ε 재사용. astropy ICRS↔BarycentricMeanEcliptic 1mas 매치. orthogonality 1e-15. typecheck/lint/format/test(261)/build/e2e/ruff/mypy/pytest(61) 전부 그린. SIM300 yoda 6건 자동 fix. erfa import-untyped → `# type: ignore`. R_x(ε) 부호 컨벤션 docstring 정정. ICRF X→ecliptic Z 톨러런스 1e-7→2e-7 (frame bias 누적) |
| 2026-05-05 | **P4 완료** — `src/astro/{rotation,rotationData}.ts` + Python 미러 + `tests/fixtures/work-02/rotation-earth.json`. `IAURotationModel` 타입, polynomial/periodic evaluator, Earth `IAU_EARTH` BODY399 constants, `evaluateRotation`, `inertialToBodyFixed`, `bodyFixedToInertial` 구현. NAIF `pck00011.tpc` 기준이며 Earth orientation은 WGCCRE 2009 계승(2015 report no Earth/Moon orientation) 명시. SPICE text-PCK Euler sequence를 `spiceypy.lmpool` + `pxform("J2000","IAU_EARTH")`로 1mas 안에서 검증. TS rotation tests 33, Python rotation tests 10 추가. CLI Work 2 fixture 생성이 time+frames+rotation으로 확장. lint/format/typecheck/test(294)/build/e2e(7)/ruff/mypy/pytest(71) 전부 그린. JS `% 360` 마지막 bit 보존을 위해 `normalizeDegrees` fast path 추가 |
| 2026-05-05 | **P5 완료** — `/dev/astro` 단일 페이지 dev demo 구현. `src/dev/astro/{AstroDemo,TimeConverter,J2000Counter,FrameConverter,EarthRotation}.tsx` + helper/CSS 추가, Work 2 registry lazy component 연결로 `/dev/index` 카드 available 전환. 시간 변환기(UTC→JD UTC/TAI/TT/TDB/MJD/J2000), live J2000 counter(`setInterval(1000)`), ICRF/EME2000/Ecliptic vector converter + round-trip norm, Earth W/pole/matrix panel 구현. e2e `dev-astro.spec.ts` 4건 추가, `dev-index.spec.ts` Work 2 available 기대값 갱신. format/lint/typecheck/test(294)/targeted e2e(9) 그린. `datetime-local` 입력은 UTC helper가 `Z`를 붙여 해석 |
| 2026-05-05 | **P6 완료 / Work 2 마감** — `tests/helpers/{expectClose,fixtures}.ts` 톨러런스 헬퍼 + fixture 로더 단일 출처(시간 1µs / TDB 100µs / 각도 1mas / 거리 1mm), `tests/fixtures/work-02/README.md` 스키마/재생성 문서, `docs/architecture/astro-conventions.md` Work 3+ 진입 가이드, `pnpm fixtures:work-02` 스크립트 (CLI generate + Prettier --write 묶음). 회귀 가드: Earth `prime_meridian` 0.001 deg 변경으로 29 테스트 fail 후 원복 → 그린. format/lint/typecheck/test(311)/build/e2e(12)/ruff/mypy/pytest(71) 전부 그린. fixture 재생성 idempotent 확인. P6 결정 4건(#18~#21) 기록 |

---

## Appendix A. Phase 마감 체크리스트 (Template)

각 phase를 [x]로 옮기기 전에 다음을 모두 확인:

1. [ ] [plan §3](work-02-astronomy.md#3-phase-정의) 의 해당 phase Done 기준 모두 충족
2. [ ] §2 결정 로그에 phase 결정 사항 모두 기록
3. [ ] §3 해당 phase Open Questions 모두 [x] 처리
4. [ ] §4 해당 phase 산출물 인덱스 채움 (경로 + 한 줄 메모)
5. [ ] §0 현재 phase 갱신 (다음 phase로)
6. [ ] §7 갱신 이력에 한 줄 추가
7. [ ] (선택) 커밋 — 메시지 prefix `[work-02/p<N>]`
