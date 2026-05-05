# Work 2 — Handoff (Astronomy Foundations)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-02-astronomy.md`](work-02-astronomy.md)

---

## 0. 현재 상태 (Status)

| 항목 | 값 |
|---|---|
| 현재 phase | **P1 완료** ✓ — P2 진입 대기 |
| 다음 액션 | **P2 — Time Systems** 진입 — Leap second 처리 / TDB-TT 모델 / JD epoch / 톨러런스 4건 결정 |
| 마지막 갱신 | 2026-05-05 |
| 블로커 | 없음 |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-02-astronomy.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [x] **P1** — Constants & NAIF Catalog _(완료 2026-05-05)_
- [ ] **P2** — Time Systems
- [ ] **P3** — Reference Frames (Core)
- [ ] **P4** — IAU Rotation Model Foundation
- [ ] **P5** — Dev Demo `/dev/astro`
- [ ] **P6** — Cross-validation & Golden Fixtures (Closeout)

> Work 2 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-02-astronomy.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| # | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
|---|---|---|---|---|---|
| 1 | 상수 출처 | **IAU 2015 + DE440 정합** (DE440 우선, IAU 2015 nominal과 7자리 매치 검증) | DE440이 ephemeris 평가의 표준 — Work 3 적용 시 단일 GM 테이블로 통일. AU/c는 SI/IAU 정의값(exact integer), GM은 DE440 11~12자리, ε은 ERFA `obl06` (IAU 2006). | P1 | 2026-05-05 |
| 2 | NAIF 카탈로그 범위 | **Sun(1) + 행성 barycenter(9) + 행성 body(9) + Moon + 갈릴레이 4 + 토성 5 = 29 entries** | 토성 5: Titan/Rhea/Iapetus(가장 큰 셋) + Enceladus/Mimas(시각적 매력). Work 6에서 더 추가. | P1 | 2026-05-05 |
| 3 | 단위 안전 타입 | **brand type** (`type Meters = number & { readonly __unit: 'm' }`) | 컴파일 타임 강제 + 런타임 0 비용. 함수 경계에서 단위 혼동 방지. 헬퍼 (`degToRad`, `arcSecToRad` 등) 동봉. | P1 | 2026-05-05 |
| 4 | 상수 모듈 분리 정책 | **단일 `constants.ts`** | 작은 상수 set (AU/c/ε + GM 12개) — 분리 비용 > 가치. Work 6 IAU rotation 데이터 들어갈 시 별도 모듈(`rotationData.ts`)로 분리. | P1 | 2026-05-05 |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정
- [x] 상수 출처: **IAU 2015 + DE440 정합** ✓ (#1)
- [x] NAIF 카탈로그 범위: **29 entries** (Sun + 9 bary + 9 body + Moon + 갈릴레이 4 + 토성 5) ✓ (#2)
- [x] 단위 안전 타입: **brand type** ✓ (#3)
- [x] 상수 모듈 분리 정책: **단일 `constants.ts`** ✓ (#4)

### P2에서 결정
- [ ] Leap second 처리 (정적 임베드 / IERS 동적 fetch)
- [ ] TDB-TT 모델 (Fairhead-Bretagnon 단순화 / IAU 2009 풀 / sin 근사)
- [ ] JD epoch 기준 시각 (TDB / TT)
- [ ] 톨러런스 (시간 1µs, TT-TAI 1ns)

### P3에서 결정
- [ ] 세차/장동 모델 (무시 J2000 고정 / IAU 2006/2000A 풀 / IAU 1976/1980 단순)
- [ ] ICRF↔EME2000 frame bias 적용 여부 (적용 / 무시)
- [ ] 회전 행렬 표현 (3×3 row-major `number[9]` / THREE.Matrix3 어댑터)
- [ ] 황도경사 ε 값 (IAU 2006 J2000 / IAU 1976)

### P4에서 결정
- [ ] IAU 회전 데이터 출처 (WGCCRE 2015 인라인 / spiceypy PCK 런타임 / 병행)
- [ ] 본 phase 검증 천체 (지구만 / 지구 + 달)

### P5에서 결정
- [ ] Dev Demo 구조 (단일 페이지 4 섹션 / 탭 분리)
- [ ] J2000 라이브 카운터 구현 (setInterval / requestAnimationFrame)

### P6에서 결정
- [ ] Fixture 형식 (JSON / JSONL / Parquet)
- [ ] Fixture 갱신 정책 (수동 / CI 자동)
- [ ] Diff 헬퍼 톨러런스 (시간 1µs / 각도 1mas / 거리 1mm)

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

### P2 — Time Systems
_미시작_

### P3 — Reference Frames (Core)
_미시작_

### P4 — IAU Rotation Model Foundation
_미시작_

### P5 — Dev Demo `/dev/astro`
_미시작_

### P6 — Cross-validation & Golden Fixtures (Closeout)
_미시작_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 즉시 액션: P2 — Time Systems 진입

1. [plan §3 P2](work-02-astronomy.md#phase-2--time-systems) 의 Decisions 4개 항목을 사용자와 결정 → §2 결정 로그에 기록
   - Leap second 처리 (정적 임베드 / IERS 동적 fetch)
   - TDB-TT 모델 (Fairhead-Bretagnon 단순화 / IAU 2009 풀 / sin 근사)
   - JD epoch 기준 시각 (TDB / TT)
   - 톨러런스 (시간 1µs / TT-TAI 1ns)
2. 신규 파일:
   - `src/astro/time.ts` — UTC↔TAI↔TT↔TDB, JD/MJD/J2000 경과
   - `src/astro/leapSeconds.ts` — 정적 leap second 테이블
   - `tools/python/src/orbitarium_tools/time.py` — astropy.time 래퍼 + `generate_fixtures` 함수
3. 골든 fixture 디렉터리 생성: `tests/fixtures/work-02/`
   - `time.json` — 20+ 대표 시각의 (UTC, TAI, TT, TDB, JD, MJD, J2000_days) 7튜플 (Python에서 생성)
4. 테스트:
   - `tests/unit/astro/time.test.ts` — fixture 로딩 + 1µs 비교
   - `tools/python/tests/test_time.py` — astropy 비교
5. P2 마감: handoff §2/§3/§4/§7 갱신 → §0 "현재 phase = P3 진입 대기"

### P1 산출물 빠른 참조

```ts
// src/astro/index.ts 가 export하는 핵심 심볼
import { AU, C_LIGHT, LIGHT_TIME_AU, EPS_J2000, GM } from '@/astro'
import { NAIF_CATALOG, getByNaifId, type NaifEntry } from '@/astro'
import { degToRad, arcSecToRad, type Meters, type Radians } from '@/astro'
```

```python
from orbitarium_tools.constants import AU, C_LIGHT, LIGHT_TIME_AU, EPS_J2000, GM
from orbitarium_tools.naif import NAIF_CATALOG, get_by_naif_id, NaifEntry
```

### Work 2 전체 진입 전 점검 (2026-05-05 시점)

- Work 1 CI 그린 ✓ (push 후 확인 완료, work-01 handoff §0 참조)
- `tools/python/.venv` 활성화 가능 ✓ (P6 구축)
- `/dev/index` 에서 Work 2 placeholder 카드 확인 가능 ✓ — P5 마감 시 "available"로 전환

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

- ~~**astro extras 미설치**~~: P1에서 해결 — `uv pip install -e ".[astro,dev]"` 실행 완료 (astropy 7.2.0, spiceypy 8.1.0, pyerfa 2.0.1.5). CI에서는 매 실행 새 venv를 쓰는데 `[dev]` 만 설치 → P2부터 astropy 의존하면 CI 워크플로 갱신 필요. **TODO (P2 시작 시)**: `.github/workflows/ci.yml` 의 python job에서 `uv pip install -e ".[dev]"` → `".[astro,dev]"` 변경.
- **astropy 첫 import 시간**: ~1-2초 (지구 회전 데이터 로딩). pytest 첫 실행 느림. 이후 캐시됨.
- **spiceypy PCK 커널**: P4 reference에서 사용. 테스트 시 NAIF 사이트에서 PCK 다운로드 필요할 수 있음 (수 MB). 캐시 정책 P4 진입 시 결정.
- **leap second 갱신**: IERS Bulletin C 가 6월/12월에 갱신. P2의 정적 테이블도 동일 주기로 갱신 필요. 스케줄러는 Work 12 또는 별도 작업으로.
- **단위 brand type의 빌드 영향**: TypeScript phantom type은 런타임 코드 0 — 번들 크기 영향 없음. 단지 컴파일 타임 강제력만.
- **Work 1 알려진 이슈와 동일하게 적용**: Node 24 deprecation 경고는 이미 마이그레이션 완료. R3F THREE.Clock 경고는 자체 코드 영향 없음.

## 7. 갱신 이력 (Changelog)

| 날짜 | 변경 |
|---|---|
| 2026-05-05 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정. P1 결정 4건 대기. |
| 2026-05-05 | **P1 완료** — `src/astro/{constants,naif,units,index}.ts` + Python 미러 + 25 단위 테스트. astro extras (astropy/spiceypy/pyerfa) 설치. IAU 2015+DE440 정합, 29 NAIF entries, brand type 단위 안전, 단일 constants 모듈. typecheck/lint/format/test/build/e2e/ruff/mypy/pytest 전부 그린. IEEE 754 19→17자리 표기 정정 + ruff SIM300 yoda 비교 순서 정정 처리 |

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
