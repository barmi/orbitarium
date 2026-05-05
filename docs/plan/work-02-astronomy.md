# Work 2 — Astronomy Foundations (Plan)

> 진행 상태와 결정 사항은 **[work-02-astronomy-handoff.md](work-02-astronomy-handoff.md)** 에 누적.
> 본 문서는 phase 정의/Done 기준의 정적 참조용.

---

## 0. 한눈에 (At a Glance)

| 항목 | 값 |
|---|---|
| 목표 | 정확한 시간/좌표 처리의 수학적 토대 — 모든 후속 Work가 의존하는 기반 모듈 |
| Phase 수 | 6 |
| 선행 Work | Work 1 (Foundation) |
| 후속 Work | Work 3 (Ephemeris) — 시간/좌표를 직접 사용. Work 6 (Bodies) — IAU 회전 본격 적용 |
| 핵심 산출물 | `src/astro/` 모듈 (TS) + `orbitarium_tools.{time,frames,constants}` (Python reference) + `/dev/astro` 데모 + 골든값 fixture |

## 1. 결과 정의 (Definition of Done)

Work 2 마감은 **다음 모두**가 통과해야 한다:

- [ ] TS 시간 모듈: UTC ↔ TAI ↔ TT ↔ TDB, JD/MJD/J2000 경과시간 양방향 변환
- [ ] TS 좌표 모듈: ICRF ↔ EME2000 ↔ ecliptic(J2000) 3×3 회전 행렬 + 벡터 변환
- [ ] TS IAU 회전 모델 데이터/타입 정의 (실 적용은 Work 6, 본 Work는 지구 1건 검증)
- [ ] 천문 상수 모듈 (AU, c, GM, light-time …) — IAU 2015 / DE440 정합
- [ ] NAIF ID 카탈로그 (Sun + 8행성 + Moon + 주요 위성 일부)
- [ ] Python reference (`orbitarium_tools.{time,frames,constants,naif}`) — astropy/spiceypy로 정답 산출
- [ ] **교차 검증**: 시간 1µs, 각도 1mas 정밀도 안에서 TS == Python (golden fixtures 기반)
- [ ] **Dev Demo** `/dev/astro` — 시간 변환기 + J2000 경과 + 좌표 변환 입출력 패널 동작
- [ ] `pnpm lint` / `typecheck` / `test` / `test:e2e` / `build` 그린
- [ ] `cd tools/python && uv run ruff check / mypy / pytest` 그린
- [ ] CI (node / python / e2e) 그린
- [ ] [handoff 문서](work-02-astronomy-handoff.md)의 모든 phase 체크박스 [x],
      결정 로그 누락 없음, 산출물 인덱스 채워짐

## 2. 범위 / 비범위

**In scope**
- 시간 시스템: UTC, TAI, TT, TDB, JD, MJD, J2000 epoch
- 기준 좌표계: ICRF, EME2000(=J2000), ecliptic(J2000), body-fixed (인터페이스 정의)
- 세차/장동(precession/nutation) **정책 결정** + 정책에 맞는 변환 구현
- 프레임 바이어스 (ICRF ↔ EME2000 ≈ 23 mas) — mas 정밀도 목표이므로 적용
- 천문 상수: AU, c, GM_sun, GM_planet, light-time, ε_J2000(황도경사) — IAU 2015/DE440 정합
- NAIF ID 카탈로그 (필요 천체 한정 — 추후 Work에서 확장)
- IAU 회전 모델 **데이터 모델 + 인터페이스** (α0, δ0, W; sin/cos 보정 항)
- 단위/타입 시스템 (브랜드 타입으로 단위 혼동 방지)
- Python reference 동반 + 골든값 fixture
- Dev Demo `/dev/astro`

**Out of scope** (다른 Work)
- 실제 ephemeris 데이터(위치/속도) → Work 3
- DE440/SPK 커널 평가 → Work 3
- Horizons API 클라이언트 → Work 3
- 거리/크기 스케일 정책 → Work 4
- 로그 깊이 버퍼, HDR 렌더 → Work 5
- IAU 회전을 모든 천체에 적용 (텍스처 회전, sub-solar point 등) → Work 6
- 시간 컨트롤러 (스크러버 / 재생) → Work 8

---

## 3. Phase 정의

각 phase는 **Goal / Scope / Decisions / Deliverables / Done / Demo** 6항목 구조.
각 phase는 (TS 코드 + Python reference + 단위/통합 테스트)를 **같은 phase 내에서** 동반 작성.

### Phase 1 — Constants & NAIF Catalog

**Goal**: 모든 후속 모듈이 import할 단일 진실원 — 천문 상수 + 천체 ID 카탈로그.

**Scope**
- 천문 상수 (TS + Python 동기화)
  - `AU` (m) — IAU 2012 정의값 1.495 978 707 e11
  - `c` (m/s) — 299 792 458 (정의값)
  - `GM_sun` (m³/s²) — DE440 사용값
  - `GM_planet` (행성별, 위성 시스템 포함) — DE440 사용값
  - `light_time_AU` (s) — c와 AU에서 유도
  - `eps_J2000` (rad) — IAU 2006 황도경사 J2000.0 평균
- NAIF ID 카탈로그
  - Sun (10), Mercury barycenter (1)·body (199), …, Pluto (9/999)
  - Moon (301), 주요 갈릴레이 위성 (501-504), 토성 주요 위성 (601-...) — 필요 한정
- 단위/타입 브랜드: `Meters`, `Seconds`, `Radians`, `Degrees`, `JulianDate` 등 phantom type
- Python: 동일 상수를 `astropy.constants` / `astropy.units` 비교로 검증

**Decisions** (P1에서 확정)
- 상수 출처: **IAU 2015 + DE440 정합** 권장 / IAU 2009 / 자체 정의
- NAIF 카탈로그 범위: **Sun + 8행성 + Moon + 갈릴레이 4 + 토성 주요 5** 권장 / 더 많이 / 더 적게
- 단위 안전: **brand type (`type Meters = number & { __unit: 'm' }`)** / 클래스 래퍼 / 무시
- 상수 모듈 분리 정책: 단일 `constants.ts` vs 카테고리별 분리 (length/time/gm/...)

**Deliverables**
```
src/astro/
  constants.ts                 # AU, c, GM_*, light_time, eps_J2000, ...
  naif.ts                      # NAIF_ID 상수 + name 룩업
  units.ts                     # Meters / Seconds / Radians / Degrees brand types
  index.ts                     # public re-exports

tools/python/src/orbitarium_tools/
  constants.py                 # TS와 동일 상수 + astropy 비교 함수
  naif.py                      # NAIF_ID 매핑
```
+ `tests/unit/astro/constants.test.ts` — 상수 값/단위 검증
+ `tools/python/tests/test_constants.py` — astropy 대비 상대오차 < 1e-12

**Done**
- TS와 Python 상수가 비트 단위로 일치 (또는 명시된 정밀도 안)
- `pnpm test` / `uv run pytest` 그린
- 결정 4개 항목 채워짐

**Demo**: 콘솔에서 `import { AU, c, GM_SUN } from '@/astro/constants'` 로그 확인.

---

### Phase 2 — Time Systems

**Goal**: UTC ↔ TAI ↔ TT ↔ TDB 양방향 변환 + JD/MJD/J2000 경과 — 1µs 정밀도.

**Scope**
- TS: `time.ts`
  - `JulianDate` brand type (TDB 기준 / TT 기준 명시)
  - `utcToTai(utc: Date): TaiSeconds` — leap second 테이블 기반
  - `taiToTt(tai)`: 고정 32.184s
  - `ttToTdb(tt)` / `tdbToTt`: 모델 적용 (아래 결정 참조)
  - `dateToJd(d: Date, scale)`: JD 계산
  - `jdToJ2000Days(jd)`: J2000 epoch (JD 2451545.0 TT) 기준 경과일
- Leap second 테이블: 정적 임베드 (1972-01-01 ~ 현재). 데이터 소스 명시 (IERS Bulletin C 기준일).
- Python: `time.py` — astropy.time 래핑하여 동일 입출력 + 골든값 생성
- 골든값 fixture: 대표 시각 ~20개 (J2000, 현재, 2000-01-01 UTC, 윤초 직전/직후, 미래 등)에 대해 (UTC, TAI, TT, TDB, JD, MJD, J2000_days) 7튜플 → `tests/fixtures/work-02/time.json`

**Decisions** (P2에서 확정)
- Leap second 처리: **정적 임베드 (코드 갱신 시 수동 추가)** 권장 / IERS 동적 fetch / 무시(과학적 부정확)
- TDB-TT 모델:
  - (a) **Fairhead-Bretagnon 1990 단순화 (1차항만, ~1ms 정확도)** — 권장
  - (b) IAU 2009 풀 시리즈 (787항, ~1µs 정확도)
  - (c) 단순 sin 근사 (`0.001658 sin(g) + 0.000014 sin(2g)`, ~50µs 정확도) — Work 8 timeline에 충분
- JD epoch 기준: TT vs TDB — **TDB 기본** (천체역학 표준)
- 톨러런스: **1µs (시간), 1ns (TT-TAI 같은 결정값)** 권장

**Deliverables**
```
src/astro/
  time.ts                      # 변환 함수 + JulianDate type
  leapSeconds.ts               # 정적 테이블

tools/python/src/orbitarium_tools/
  time.py                      # astropy.time 래퍼 + generate_fixtures
```
+ `tests/unit/astro/time.test.ts` — fixture 로딩 후 TS 결과와 µs 비교
+ `tools/python/tests/test_time.py` — astropy 대비 검증
+ `tests/fixtures/work-02/time.json` — 20+ 골든 시각

**Done**
- TS 변환이 fixture와 1µs 안에서 일치 (모든 20+ 케이스)
- 윤초 경계(예: 2016-12-31T23:59:60 UTC) 정상 처리
- `pnpm test` / `uv run pytest` 그린

**Demo**: `node -e "console.log(utcToTdb(new Date('2026-05-05')))"` 로 변환 확인.

---

### Phase 3 — Reference Frames (Core)

**Goal**: ICRF ↔ EME2000 ↔ ecliptic(J2000) 회전 행렬 + 벡터 변환 — 1mas 정밀도.

**Scope**
- TS: `frames.ts`
  - 3×3 행렬 타입 + 벡터 회전 헬퍼
  - `icrfToEme2000()`: 프레임 바이어스 (~23 mas) — IAU 2006 frame bias 행렬
  - `eme2000ToEcliptic()`: J2000 황도 — ε_J2000 회전 (X축 회전)
  - `ecclipticToEme2000()` / `eme2000ToIcrf()`: 역변환
  - 합성: `icrfToEcliptic()` — 자주 쓰임
- 세차/장동(P/N): 본 phase 정책에 따라 — 단순화 채택 시 본 phase는 J2000 정적 변환만 포함
- Python: `frames.py` — astropy.coordinates의 `ICRS`, `GCRS`, `BarycentricMeanEcliptic` 등 래핑
- 골든값: 대표 단위벡터/실벡터 ~30개에 대해 각 변환 결과 → `tests/fixtures/work-02/frames.json`

**Decisions** (P3에서 확정)
- 세차/장동 모델:
  - (a) **무시 — J2000 고정 (세차로 인한 오차 ~50″/century, Work 2 범위 밖)** — 권장
  - (b) IAU 2006/2000A 풀 모델 (mas 정밀도)
  - (c) IAU 1976/1980 단순화
- ICRF ↔ EME2000 frame bias 적용 여부: **적용 (~23 mas 무시 못함)** 권장
- 회전 행렬 표현: **3×3 row-major number[9]** vs `THREE.Matrix3` 어댑터 / 자체 클래스
- 황도경사 ε: **IAU 2006 J2000 평균값 23°26′21.448″ (= 0.4090926006…rad)** 고정

**Deliverables**
```
src/astro/
  frames.ts                    # 변환 함수
  matrix3.ts                   # 3×3 헬퍼 (필요 시)

tools/python/src/orbitarium_tools/
  frames.py                    # astropy 래퍼 + generate_fixtures
```
+ `tests/unit/astro/frames.test.ts` — fixture 검증
+ `tools/python/tests/test_frames.py`
+ `tests/fixtures/work-02/frames.json`

**Done**
- TS 변환이 fixture와 1mas (4.85 µrad) 안에서 일치
- 단위벡터의 round-trip (icrf → ecliptic → icrf) 오차 < 1 µas
- `pnpm test` / `uv run pytest` 그린

**Demo**: 콘솔에서 임의 벡터 변환 → Python 결과와 동일 확인.

---

### Phase 4 — IAU Rotation Model Foundation

**Goal**: IAU 회전 모델의 **데이터 모델 + 인터페이스** 정의. 본 적용은 Work 6, 본 phase는 지구 1건만 검증.

**Scope**
- 회전 모델 데이터 구조:
  - `α0(T)`: 자전축 RA — 다항식 + sin/cos 보정 항
  - `δ0(T)`: 자전축 Dec
  - `W(d)`: prime meridian — 일 단위 선형 + sin/cos 보정
  - T = J2000 경과 세기, d = J2000 경과일
- 지구의 NAIF `pck00011.tpc` BODY399 회전 모델 데이터
  - `pck00011`은 WGCCRE 2015 기반이지만 Earth orientation은 WGCCRE 2009 값을 계승
    (2015 report에서 Earth/Moon orientation 미제공)
- TS: `rotation.ts`
  - `IAURotationModel` 타입
  - `evaluateRotation(model, jdTdb)`: { ra, dec, w } 반환
  - `inertialToBodyFixed(model, jdTdb)`: 3×3 회전 행렬 (ICRF → body-fixed)
  - `bodyFixedToInertial(model, jdTdb)`: 역변환 (body-fixed → ICRF)
- Python: `rotation.py` — spiceypy text-PCK 평가 결과와 비교 (지구 1건)

**Decisions** (P4에서 확정)
- 회전 모델 데이터 출처: **NAIF `pck00011.tpc` BODY399 정적 인라인 + spiceypy text-PCK reference 병행**
- 본 phase의 검증 천체: **지구만 (지구 자전 위상이 가장 자주 검증됨)**

**Deliverables**
```
src/astro/
  rotation.ts                  # IAURotationModel + evaluator
  rotationData.ts              # 지구 모델 (Work 6에서 확장)

tools/python/src/orbitarium_tools/
  rotation.py                  # spiceypy 비교 (Work 6에서 확장)
```
+ `tests/unit/astro/rotation.test.ts` — 지구 1건 (현재 시각의 W) fixture와 비교
+ `tests/fixtures/work-02/rotation-earth.json`

**Done**
- 지구의 W(현재 시각)와 `ICRF/J2000 → IAU_EARTH` 행렬이 spiceypy text-PCK 결과와 1mas 안에서 일치
- 인터페이스가 Work 6에서 그대로 확장 가능 (전체 천체 추가만)
- `pnpm test` / `uv run pytest` 그린

**Demo**: 콘솔에서 현재 시각의 지구 그리니치 자오선 각도 출력 → astronomy-engine 또는 GMST 공식과 비교.

---

### Phase 5 — Dev Demo `/dev/astro`

**Goal**: P2~P4 결과를 눈으로 즉시 확인할 수 있는 인터랙티브 패널.

**Scope**
- React 컴포넌트 (R3F 불필요 — 순수 DOM/폼)
- 패널 1: **시간 변환기**
  - 입력: UTC datetime (default = 현재 시각)
  - 출력: TAI / TT / TDB / JD / MJD / J2000 경과일
- 패널 2: **J2000 경과시간**
  - 라이브 카운터 (1초마다 갱신) — 일/시간/분/초
- 패널 3: **좌표 변환기**
  - 입력: 3D 벡터 (x, y, z) + 입력 프레임 라디오 (ICRF / EME2000 / Ecliptic)
  - 출력: 나머지 두 프레임의 변환 결과
  - round-trip 차이 표시 (sanity check)
- 패널 4: **지구 자전 위상** (P4 산출물 시연)
  - 현재 시각의 W (그리니치 자오선 각, deg)
- registry.ts에서 Work 2 entry의 `Component` 채움
- 폴리시 무시, 기능 우선 (overview.md 4.1 컨벤션)

**Decisions**
- 컴포넌트 구조: **단일 페이지 + 4 섹션** vs 탭 분리 — 권장: 단일 페이지 (간단)
- 라이브 카운터 구현: requestAnimationFrame vs setInterval — 권장: setInterval(1000) (1초 정밀이면 충분)

**Deliverables**
```
src/dev/astro/
  AstroDemo.tsx                # 메인 페이지
  TimeConverter.tsx            # 패널 1
  J2000Counter.tsx             # 패널 2
  FrameConverter.tsx           # 패널 3
  EarthRotation.tsx            # 패널 4
  astro.css                    # (필요 시)
```
+ `src/dev/registry.ts` 의 `astro` entry 에 `Component: lazy(() => import('./astro/AstroDemo'))` 적용
+ `tests/e2e/dev-astro.spec.ts` — 페이지 로드 / 폼 입력 / 출력 갱신 검증 (~3 specs)

**Done**
- `/dev/astro` 가 dev 모드에서 접근 가능 (`/dev/index` 카드도 "available" 상태로 표시)
- 4개 패널 모두 인터랙티브 동작
- e2e 그린

**Demo**: `pnpm dev` → `/dev/astro` 에서 시각 입력 → TDB 표시 + 라이브 J2000 카운터.

---

### Phase 6 — Cross-validation & Golden Fixtures (Closeout)

**Goal**: P1~P4의 모든 모듈이 골든 fixture 기반으로 자동 검증되는 회귀 테스트망 완성.

**Scope**
- Python 측 `generate_fixtures(out_dir)` 컨벤션 정착
  - `time.py::generate_fixtures(...)` — P2에서 작성
  - `frames.py::generate_fixtures(...)` — P3에서 작성
  - `rotation.py::generate_fixtures(...)` — P4에서 작성
  - 통합 CLI: `orbitarium-tools fixtures --work=2 --out=tests/fixtures/work-02/`
- Fixture 형식 컨벤션 문서화
- TS 측 fixture 로더 + diff 헬퍼 (`expectClose(actual, expected, tol)`)
- 회귀 가드: fixture 가 갱신되면 git diff로 표시 (CI에서 fail 안 함, 사람 검토)
- `docs/architecture/astro-conventions.md` — 시간/좌표/회전 정책 요약 + 추후 Work에서 import 시 주의점

**Decisions** (P6에서 확정)
- Fixture 형식: **JSON (사람-가독 + git diff 친화)** 권장 / JSONL / Parquet
- Fixture 갱신 정책: **수동 (사람이 generate 후 commit)** 권장 / CI 자동
- Diff 헬퍼 톨러런스: 시간 1µs / 각도 1mas / 거리 1mm (Work 3에서 사용)

**Deliverables**
```
tools/python/src/orbitarium_tools/
  cli.py                       # 'fixtures' 서브커맨드 추가

tests/fixtures/work-02/
  time.json
  frames.json
  rotation-earth.json
  README.md                    # 형식 + 재생성 명령

src/test-utils/                # (또는 tests/helpers/)
  expectClose.ts               # 톨러런스 매처

docs/architecture/astro-conventions.md
```
+ `package.json` script: `fixtures:work-02` 또는 `fixtures:gen` (선택)

**Done**
- `orbitarium-tools fixtures --work=2` 명령으로 모든 fixture 재생성 가능
- 의도적으로 TS 코드를 1mas 초과로 변경 → `pnpm test` fail 재현 → 원복 후 그린
- 컨벤션 문서가 Work 3의 첫 작업자가 import 패턴을 즉시 따라할 수 있을 만큼 구체적

**Demo**: `cd tools/python && uv run orbitarium-tools fixtures --work=2 --out=../../tests/fixtures/work-02/` → diff 없음(이미 최신).

---

## 4. Phase 의존 관계

```
P1 Constants & NAIF
   │
   ├──────────────┐
   ▼              ▼
P2 Time          P3 Frames
   │              │
   └──────┬───────┘
          ▼
       P4 IAU Rotation
          │
          ▼
       P5 Dev Demo
          │
          ▼
       P6 Closeout (fixtures + docs)
```

- P2와 P3는 P1 이후 부분적으로 병렬 가능 (단순성을 위해 순차 권장).
- P4는 P2(시간) + P3(프레임)을 둘 다 의존.
- P5는 P1~P4의 산출물을 모두 사용 → 순차 진행.
- P6는 마감 단계 — 모든 phase의 fixture/문서를 통합.

## 5. 결정 권장값 (Recommendations)

권장값은 **handoff 결정 로그**에 사용자 컨펌 후 기록.

| 항목 | 권장 | 대안 | 결정 phase |
|---|---|---|---|
| 상수 출처 | **IAU 2015 + DE440 정합** | IAU 2009 / 자체 | P1 |
| NAIF 카탈로그 범위 | **Sun + 8행성 + Moon + 갈릴레이 4 + 토성 주요 5** | 더 많이 / 적게 | P1 |
| 단위 안전 타입 | **brand type** | class wrapper / 무시 | P1 |
| Leap second 처리 | **정적 임베드** | IERS 동적 fetch | P2 |
| TDB-TT 모델 | **Fairhead-Bretagnon 단순화 (1차항)** | IAU 2009 풀 / sin 근사 | P2 |
| JD epoch 기준 시각 | **TDB** | TT | P2 |
| 세차/장동 모델 | **무시 (J2000 고정)** | IAU 2006/2000A | P3 |
| ICRF↔EME2000 frame bias | **적용 (~23 mas)** | 무시 | P3 |
| 회전 행렬 표현 | **3×3 row-major `number[9]`** | THREE.Matrix3 어댑터 | P3 |
| 황도경사 ε | **IAU 2006 J2000 평균** (`0.4090926006…rad`) | IAU 1976 | P3 |
| IAU 회전 데이터 출처 | **NAIF pck00011 BODY399 인라인 + spiceypy text-PCK reference** | spiceypy PCK 런타임 | P4 |
| P4 검증 천체 | **지구만** | 지구 + 달 | P4 |
| Dev Demo 구조 | **단일 페이지 + 4 섹션** | 탭 분리 | P5 |
| Fixture 형식 | **JSON** | JSONL / Parquet | P6 |
| Fixture 갱신 정책 | **수동 commit** | CI 자동 | P6 |

## 6. 위험 / 메모

- **TDB-TT 모델 정확도 vs 코드 무게 트레이드오프**: 풀 모델(787 sin 항)은 ~30KB, 단순화는 수십 줄. Work 8 timeline 정밀도 요구가 µs 미만이면 풀 모델로 업그레이드 필요. 단순화로 시작하고 Work 12 검증에서 재평가.
- **세차/장동 무시의 영향**: J2000에서 100년 떨어지면 ~50″ 누적 오차. Work 2~10 timeline이 J2000 ± 수십 년이면 무시 가능. 보이저 발사(1977)나 미래 100년 시연 시 mas 정밀도 확보 어려움 → Work 7/8 시점에 재평가.
- **ICRF vs EME2000 frame bias**: 23 mas는 행성 위치에서 약 1km(1AU 거리). Work 3 ephemeris 비교 시 frame bias 적용 안 하면 km 단위 미스매치 발생할 수 있음 → P3에서 반드시 적용.
- **IAU 2015 데이터 인라인 vs PCK 런타임**: 인라인은 빌드 시 고정 → IAU가 회전 모델을 갱신하면 코드 갱신 필요. 단점: 자동 동기화 안 됨. 장점: 런타임 의존성 없음. Work 12 검증에서 PCK 결과와 정기 비교로 보완.
- **astropy ↔ TS 정밀도 차이의 출처 식별**: 대부분 (a) leap second 테이블 차이, (b) TDB 모델 차이, (c) frame bias 미적용. 1mas 초과 시 이 3개를 먼저 확인.
- **단위 brand type의 인체공학**: TypeScript의 brand type은 산술 연산에서 어차피 `number`로 풀려서 강제력이 약함. 함수 경계에서만 강제됨. 너무 무거우면 P1에서 무시 결정으로 다운그레이드 가능.
- **Work 6과의 인터페이스**: P4의 `IAURotationModel` 타입을 Work 6에서 그대로 import. 본 phase 종료 시 Work 6 작업자(미래의 자기 자신 포함)가 보고 즉시 따라할 수 있도록 docstring/예제 충실히.

---

_Last updated: 2026-05-05_
