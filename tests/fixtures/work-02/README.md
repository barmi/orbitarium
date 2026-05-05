# Work 2 Golden Fixtures

> Astronomy foundations 모듈(`src/astro/`)의 회귀 테스트 reference. Python(`orbitarium_tools`)에서
> 생성하고 commit한 후 TS 단위 테스트가 fixture와 비교한다.

## 구성

| 파일                  | 생성 함수                                     | TS 소비처                           |
| --------------------- | --------------------------------------------- | ----------------------------------- |
| `time.json`           | `orbitarium_tools.time.generate_fixtures`     | `tests/unit/astro/time.test.ts`     |
| `frames.json`         | `orbitarium_tools.frames.generate_fixtures`   | `tests/unit/astro/frames.test.ts`   |
| `rotation-earth.json` | `orbitarium_tools.rotation.generate_fixtures` | `tests/unit/astro/rotation.test.ts` |

## 재생성

세 fixture를 한 번에 갱신 (생성 + Prettier 정렬):

```bash
pnpm fixtures:work-02
```

내부적으로 다음 두 단계를 실행한다:

```bash
cd tools/python
uv run orbitarium-tools fixtures --work=2 --out=../../tests/fixtures/work-02/
cd ../..
prettier --write tests/fixtures/work-02/
```

Python `json.dump(indent=2)` 의 array 배치는 Prettier 정책과 다르므로 (한 줄 vs 여러 줄), Prettier로
재정렬해야 git diff 잡음이 없다. CLI 분기는
`tools/python/src/orbitarium_tools/cli.py` — Work 번호별로 `time/frames/rotation` 모듈의
`generate_fixtures(out_dir)` 를 순차 호출한다. 갱신 후 `pnpm test` / `uv run pytest` 가 그린이면
diff 를 commit 한다 (수동 정책 — CI 자동 갱신은 도입하지 않음).

## 형식 컨벤션

- 형식: **JSON** (사람-가독 + git diff 친화).
- 메타 키는 `_`로 시작 (`_comment`, `_source`, `_tolerance_*`). TS는 fixture 객체에서 메타를 분리해 톨러런스를 읽고, 본 데이터는 `fixtures` 배열에서 로드.
- 숫자는 Python `repr()` 그대로 (round-trip 보장). TS와 IEEE 754 비트 동일이 1순위 목표.
- 행렬은 9-element row-major 배열 (`number[]`) — `Matrix3` shape와 호환.
- 벡터는 3-element 배열.

### `time.json`

```jsonc
{
  "_comment": "...",
  "_source": "Fairhead-Bretagnon 1990 simplified TDB-TT (1st order, ~50us); IERS Bulletin C 70 leap seconds",
  "_tolerance_us": 1, // UTC/TAI/TT/JD bit-exact tolerance
  "_tdb_tolerance_us": 100, // TDB simplified model vs astropy IAU 2009
  "fixtures": [
    {
      "utc_iso": "2000-01-01T12:00:00.000Z",
      "leap_seconds": 32,
      "jd_utc": 2451545.0,
      "jd_tai": 2451545.00037037,
      "jd_tt": 2451545.0007428704,
      "jd_tdb": 2451545.0007428695,
      "j2000_days_tdb": 0.0007428694516420364,
      "mjd_tdb": 51544.50074286945,
    },
    // ... 21 entries (J2000, current, leap-second boundaries, future)
  ],
}
```

### `frames.json`

```jsonc
{
  "_comment": "...",
  "_source": "ERFA bp00 frame bias (IAU 2006/2000A) + IAU 2006 obliquity at J2000.0. No precession/nutation applied.",
  "_tolerance_mas": 1,
  "matrices": {
    "icrf_to_eme2000": [
      /* 9 numbers, row-major */
    ],
    "eme2000_to_ecliptic_j2000": [
      /* 9 numbers */
    ],
    "icrf_to_ecliptic_j2000": [
      /* 9 numbers */
    ],
  },
  "fixtures": [
    {
      "icrf": [1.0, 0.0, 0.0],
      "eme2000": [
        /* 3 */
      ],
      "ecliptic_j2000": [
        /* 3 */
      ],
      "round_trip_icrf": [
        /* 3 — icrf → ecliptic → icrf */
      ],
    },
    // ... 12 entries (basis axes, 1/√3, arbitrary, 1AU magnitude)
  ],
}
```

### `rotation-earth.json`

```jsonc
{
  "_comment": "...",
  "_source": "NAIF pck00011.tpc BODY399_* constants. Earth orientation is inherited from WGCCRE 2009 ...",
  "_tolerance_mas": 1,
  "_matrix_tolerance": 1e-10, // element-wise abs diff vs SPICE pxform
  "model": {
    "naif_id": 399,
    "name": "Earth",
    "frame_name": "IAU_EARTH",
    "source": "...",
    "pole_ra": [0.0, -0.641, 0.0],
    "pole_dec": [90.0, -0.557, 0.0],
    "prime_meridian": [190.147, 360.9856235, 0.0],
  },
  "fixtures": [
    {
      "label": "j2000_epoch",
      "utc_iso": null, // synthetic JD vs UTC-derived
      "jd_tdb": 2451545.0,
      "j2000_days_tdb": 0.0,
      "ra_deg": 0.0,
      "dec_deg": 90.0,
      "w_deg": 190.147,
      "inertial_to_body_fixed": [
        /* 9 row-major */
      ],
      "body_fixed_to_inertial": [
        /* 9 row-major */
      ],
      "spice_inertial_to_body_fixed": [
        /* spiceypy pxform reference */
      ],
      "spice_max_abs_diff": 0.0, // |our - spice| element-wise
    },
    // ... 8 entries: J2000 ±50yr, J2000+12h/+10y, voyager_1, hubble, work_02_current_date, future_2030
  ],
}
```

## 톨러런스 정책

`tests/helpers/expectClose.ts`가 단일 출처. Work 2/3+에서 import해 사용한다.

| 도메인 | 기본 톨러런스 | 사용 예                                      |
| ------ | ------------- | -------------------------------------------- |
| 시간   | **1 µs**      | `expectCloseDays`, `expectCloseSeconds`      |
| TDB    | 100 µs        | astropy IAU 2009 비교 (simplified 모델 차이) |
| 각도   | **1 mas**     | `expectCloseDegrees`, `expectCloseRadians`   |
| 거리   | **1 mm**      | `expectCloseMeters` (Work 3+ ephemeris)      |

JD 비교(`jd_*`)는 IEEE 754 한계(JD ~2.46e6 → ~9 fractional digits ≈ 100 µs)에 닿으므로,
fixture는 비트 동일이 1순위. `(jd_a - jd_b) * 86400` cancellation 연산은 ~µs 오차 누적 — invariant
검증용 슬랙(1e-4) 별도 적용.

## 갱신 정책

- **수동**: 사람이 `orbitarium-tools fixtures --work=2 --out=...` 실행 후 commit.
- CI 자동 갱신은 도입하지 않는다 — 모델/상수 변경은 의도적 결정이어야 하고, fixture diff는 reviewer가
  반드시 검토해야 함.
- IERS Bulletin C 갱신(6/12월), DE/PCK 커널 업데이트, IAU 회전 모델 개정 시 재생성 필요.

## 회귀 가드 검증

P6 종료 시점에 의도적 1mas 초과 변경(예: `EARTH_IAU_ROTATION` `prime_meridian` polynomial을
0.001 deg = 3600 mas 흔들기)으로 `pnpm test` fail이 발생함을 확인한 뒤 원복했다.
이후에 정확도 정책을 변경하려는 작업자는 fixture를 먼저 재생성하고 diff를 검토할 것.
