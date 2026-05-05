# Astronomy Conventions

> Work 2 산출물(`src/astro/`, `orbitarium_tools.{constants,naif,time,frames,rotation}`)의 정책
> 요약. Work 3+(ephemeris, scale, render, bodies, orbits…)에서 import 시 이 문서를 먼저 읽고
> import 패턴 / 톨러런스를 따라잡는다.
>
> 출처: [`overview.md`](../plan/overview.md) · [`work-02-astronomy.md`](../plan/work-02-astronomy.md) ·
> [`work-02-astronomy-handoff.md`](../plan/work-02-astronomy-handoff.md) (결정 로그 §2 #1~#17)

## 1. 단위 (Truth 레이어)

- 길이: **m** (meters). 표시 옵션 AU/km는 변환 함수로 명시 변환.
- 시간: **s** (seconds) 또는 **JD/MJD/J2000 days**. UTC는 표시, 계산은 TDB.
- 각도: **rad** (radians). 입력 편의로 deg/arcsec 헬퍼 제공.
- 좌표계: ICRF (default), EME2000(=J2000), Ecliptic J2000, body-fixed(IAU\_\*).

브랜드 타입(`Meters`, `Radians`, `Degrees`, `JdTdb`, `JdTt`, `JdTai`, `JdUtc`, `Seconds`,
`MetersPerSecond`, `CubicMetersPerSecondSquared`, `ArcSeconds`)으로 함수 경계에서 단위 혼동 차단.
런타임 비용 0 (phantom type).

## 2. 천문 상수 — 단일 진실원

`@/astro/constants` (TS) ↔ `orbitarium_tools.constants` (Python). 두 출처는 IEEE 754 비트 동일.

- `AU` = 1.495 978 707 e11 m (IAU 2012 정의값, exact integer)
- `C_LIGHT` = 299 792 458 m/s (SI 정의값)
- `LIGHT_TIME_AU` = AU / c (≈ 499.0048 s)
- `EPS_J2000` = 0.4090926006005829 rad (IAU 2006 P03, ERFA `obl06`)
- `GM` = DE440 행성 시스템 GM 12 entries (`sun`, `mercury_bary`, ...)

행성 GM은 IAU 2015 nominal과 7자리 매치, DE440은 12자리 정밀. 다른 출처 사용 금지 — DE440 우선.

## 3. NAIF 카탈로그

`@/astro/naif` (TS) ↔ `orbitarium_tools.naif` (Python). 29 entries:

- Sun(10) + 8 행성 barycenter(1..8) + 8 행성 body(199, 299, ...) + Pluto bary/body(9/999)
- Moon(301)
- 갈릴레이 4(501-504): Io, Europa, Ganymede, Callisto
- 토성 5: Mimas(601), Enceladus(602), Rhea(605), Titan(606), Iapetus(608)

Work 6에서 추가 가능. `getByNaifId(id)` / `NAIF_IDS.<name>` 패턴 사용.

## 4. 시간 변환

`@/astro/time` (TS) ↔ `orbitarium_tools.time` (Python).

```ts
import { utcToJdTdb, jdToJ2000Days, J2000_JD_TDB, type JdTdb } from '@/astro'
const jd = utcToJdTdb(new Date()) // JdTdb
const days = jdToJ2000Days(jd) // J2000 epoch 경과일 (TDB scale)
```

- 모든 ephemeris 평가 입력은 **JdTdb** (천체역학 표준). UTC/TT/TAI epoch 필요시 `utcToJdTai`/`utcToJdTt` 사용.
- TDB-TT 모델: Fairhead-Bretagnon 1990 simplified 1차항 (`0.001658·sin(g) + 0.000014·sin(2g)`,
  ~50 µs vs IAU 2009). Work 8/12 정밀도 요구가 µs 미만이면 풀 시리즈로 업그레이드.
- Leap seconds: IERS Bulletin C 70 정적 임베드 (1972-01-01 ~ 2017-01-01, 28 entries).
  IERS 갱신 시 `leapSeconds.ts` + `time.py`에 1 라인 추가 후 fixture 재생성.
- JS `Date`는 leap second instant(`23:59:60`) 표현 불가 — POSIX 한계. 실용 영향 없음.

### JD precision 한계

JD ~ 2.46e6 in IEEE 754 double = ~9 fractional digits (~86 µs). fixture-based 비교는 비트 동일이라 1 µs OK.
`(jdA - jdB) * 86400` cancellation 연산은 ~µs 오차 누적 → invariant 톨러런스 1e-4. Work 8/12에서
시간 정밀도 요구 시 split-JD (integer day + fractional day) 도입 검토.

## 5. 좌표계 변환

`@/astro/frames` (TS) ↔ `orbitarium_tools.frames` (Python).

```ts
import { icrfToEcliptic, eme2000ToIcrf, type Vec3, type Matrix3 } from '@/astro'
const v: Vec3 = [1.0, 0.0, 0.0]
const ecl = icrfToEcliptic(v)
```

- ICRF ↔ EME2000: ERFA `bp00` (IAU 2006/2000A) frame bias ~23 mas RSS 적용. 상수 9 doubles 임베드.
- EME2000 ↔ Ecliptic J2000: `R_x(ε)` 회전, ε = `EPS_J2000`.
- 합성 `ICRF_TO_ECLIPTIC_J2000`은 `matMul3(EME2000_TO_ECLIPTIC_J2000, ICRF_TO_EME2000)` 빌드 시 계산.
- **세차/장동 미적용** — J2000 고정. ±100 yr 누적 ~50″. Work 7/8에서 보이저(1977)~미래 100년 정밀도 요구 시
  IAU 2006/2000A 풀 모델로 업그레이드.
- 행렬 표현: `Matrix3 = readonly [n, n, ..., n]` (9-tuple, row-major). loop-unrolled `matMul3` (cancellation 안정).
  `THREE.Matrix3` 어댑터는 Work 5(렌더) 진입 시 추가.

회전 행렬 컨벤션: `out = M @ v`, `M[row * 3 + col]`. R_x(ε) = `[[1,0,0],[0,cos ε,sin ε],[0,-sin ε,cos ε]]`.

## 6. IAU 회전 모델

`@/astro/rotation` + `@/astro/rotationData` (TS) ↔ `orbitarium_tools.rotation` (Python).

```ts
import { EARTH_IAU_ROTATION, inertialToBodyFixed, evaluateRotation, type JdTdb } from '@/astro'
const jd = 2451545.0 as JdTdb
const m = inertialToBodyFixed(EARTH_IAU_ROTATION, jd) // ICRF/J2000 → IAU_EARTH
const { raDeg, decDeg, wDeg } = evaluateRotation(EARTH_IAU_ROTATION, jd)
```

- 데이터: NAIF `pck00011.tpc` BODY399 상수 인라인. Earth orientation은 WGCCRE 2009 계승
  (2015 보고서에서 Earth/Moon orientation 미제공).
- Euler sequence: `Rz(-W) · Rx(dec - 90°) · Rz(-(90° + ra))` — SPICE text-PCK 컨벤션.
- 양방향 함수: `inertialToBodyFixed`(SPICE `pxform("J2000","IAU_EARTH",et)`와 1mas 안 일치) +
  `bodyFixedToInertial`(transpose).
- Work 6에서 `rotationData.ts`에 전체 천체 추가 — 인터페이스(`IAURotationModel`) 그대로 확장.

## 7. 톨러런스 정책

`tests/helpers/expectClose.ts` 단일 출처. Work 2 fixture 비교부터 Work 3+ ephemeris/궤도까지 공통 사용.

| 도메인 | 기본 톨러런스         | helper                                      |
| ------ | --------------------- | ------------------------------------------- |
| 시간   | **1 µs** (TDB 100 µs) | `expectCloseDays`, `expectCloseSeconds`     |
| 각도   | **1 mas**             | `expectCloseDegrees`, `expectCloseRadians`  |
| 거리   | **1 mm**              | `expectCloseMeters` (Work 3+)               |
| 벡터   | caller 지정           | `expectCloseVec3` (L2 distance, 단위 무관)  |
| 행렬   | caller 지정           | `expectCloseMatrix3` (element-wise max abs) |

JD 비교는 `expectCloseDays(actual, expected, 1)` (1µs → days 변환 자동). 행성 위치는 Work 3에서
`expectCloseMeters(...)` 또는 `expectCloseVec3(..., tolMeters)`.

## 8. 골든 fixture

[`tests/fixtures/work-02/README.md`](../../tests/fixtures/work-02/README.md) 참조.

- 형식: JSON, 메타 키는 `_` prefix.
- 갱신: **수동** — `cd tools/python && uv run orbitarium-tools fixtures --work=N --out=...`.
- TS와 Python은 같은 알고리즘 → IEEE 754 비트 동일. astropy/spiceypy/ERFA reference는 1 mas /
  1 µs / 1 ULP 안에서 별도 cross-check.

## 9. astropy ↔ TS 정밀도 차이가 났을 때

대부분 다음 셋 중 하나:

1. Leap second 테이블 차이 (IERS Bulletin C 갱신 누락) — `time.json` 재생성 + diff 확인
2. TDB-TT 모델 차이 — simplified vs IAU 2009 풀 시리즈 (~50 µs)
3. Frame bias 적용 누락 — `ICRF_TO_EME2000` / `eme2000ToIcrf` 통과 여부 확인 (~23 mas)

세차/장동 영향은 J2000 ±100 yr 안에서 ~50″ 미만 — 1mas 톨러런스를 넘으면 다른 원인을 먼저 의심.

## 10. Work 3+ 진입 시 점검 체크리스트

- [ ] `import { ... } from '@/astro'` (단일 진실원)
- [ ] `JdTdb` brand type으로 ephemeris 입력 receive — UTC/TT/TAI에서 변환 명시
- [ ] 좌표 입력/출력에 reference frame 명시 (`PositionICRF`, `PositionEME2000` 등 문서화)
- [ ] 정밀도 비교는 `tests/helpers/expectClose.ts` 사용
- [ ] 새 fixture는 `tests/fixtures/work-NN/` + `cli.py`에 work 분기 추가
- [ ] 새 reference 데이터(SPICE 커널 등) 가능하면 런타임 다운로드 회피 (`spiceypy.lmpool` 등)
