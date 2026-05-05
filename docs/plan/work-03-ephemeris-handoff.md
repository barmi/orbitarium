# Work 3 — Handoff (Ephemeris Data Layer)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-03-ephemeris.md`](work-03-ephemeris.md)

---

## 0. 현재 상태 (Status)

| 항목         | 값                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 현재 phase   | **P1 완료** ✓ — P2 진입 대기                                                                                                                                |
| 다음 액션    | **P2 — DE440 Preprocessing (Python)** 진입 — `orbitarium_tools.de440` 작성, SPK 커널 → Chebyshev binary + manifest, spiceypy `spkezr` 비트 동일 self-test |
| 마지막 갱신  | 2026-05-05                                                                                                                                                  |
| 블로커       | 없음                                                                                                                                                        |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-03-ephemeris.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Strategy & Brand Types _(완료 2026-05-05)_
- [ ] **P2** — DE440 Preprocessing (Python)
- [ ] **P3** — TS Chebyshev Evaluator
- [ ] **P4** — Horizons Reference (Python)
- [ ] **P5** — Dev Demo `/dev/ephemeris`
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

- [ ] 커널 다운로드 경로 (NAIF 공식 / 미러)
- [ ] Binary format (Float64 LE / Float32 / custom)
- [ ] Chunk 단위 (DE440 native intervals / custom resampling)
- [ ] 압축 (없음 / build-time gzip)
- [ ] Manifest 위치 (`public/data/de440/manifest.json` / in-bundle)
- [ ] Binary commit 정책 (git commit / build-time download)

### P3에서 결정

- [ ] 캐시 정책 (chunk LRU / 전체 인메모리 / 무캐시)
- [ ] API 패턴 (async Promise / preload-then-sync)
- [ ] 에러 종류 (missing body / out-of-range / invalid binary)

### P4에서 결정

- [ ] Horizons 출력 단위 변환 (m, m/s)
- [ ] light-time correction (off / on)
- [ ] Cache 위치
- [ ] TS Horizons client (본 Work / Work 7로 deferred)

### P5에서 결정

- [ ] Dev Demo 구조 (단일 페이지 / 탭)
- [ ] body picker (dropdown / button group)
- [ ] frame 변환 표시 (동시 / 토글)

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

### P2 — DE440 Preprocessing (Python)

_미시작_

### P3 — TS Chebyshev Evaluator

_미시작_

### P4 — Horizons Reference (Python)

_미시작_

### P5 — Dev Demo `/dev/ephemeris`

_미시작_

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
