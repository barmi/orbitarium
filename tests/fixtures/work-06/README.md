# Work 6 Golden Fixtures

> Celestial Bodies 모듈(`src/bodies/`, `src/astro/rotationData.ts` 확장)의 회귀
> 테스트 reference. Python (`orbitarium_tools.bodies` + `orbitarium_tools.rotation`)
> 에서 생성하고 commit한 후 TS 단위 테스트가 IAU rotation matrix / 카탈로그 / sub-solar
> point 를 비교한다.

## 구성

| 파일                   | 생성 함수                                               | TS 소비처                                                             |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `iau-rotation.json`    | `orbitarium_tools.bodies.generate_iau_rotation_fixture` | `tests/unit/astro/rotationModels.test.ts`                             |
| `body-catalog.json`    | `orbitarium_tools.bodies.generate_body_catalog_fixture` | (Work 7+ 카탈로그 cross-check 용 reserved; 본 Work 는 dump 만 commit) |
| `sub-solar-point.json` | `orbitarium_tools.bodies.generate_sub_solar_fixture`    | (Work 11 dev demo 가 활용 예정 — 본 Work P5 는 synthetic geometry)    |
| 전체                   | CLI: `orbitarium-tools fixtures --work=6`               | `pnpm fixtures:work-06`                                               |

## 재생성

세 fixture 한 번에 갱신 (생성 + Prettier 정렬):

```bash
pnpm fixtures:work-06
```

내부 단계:

```bash
cd tools/python
uv run orbitarium-tools fixtures --work=6 --out=../../tests/fixtures/work-06/
cd ../..
prettier --write tests/fixtures/work-06/
```

CLI 분기는 `tools/python/src/orbitarium_tools/cli.py` Work 6 분기에서
`orbitarium_tools.bodies.generate_fixtures(out_dir)` 호출 →
`generate_iau_rotation_fixture` + `generate_body_catalog_fixture` +
`generate_sub_solar_fixture` 셋을 생성한다.

## 형식 컨벤션

- 형식: **JSON** (Work 2~5 일관).
- 메타 키 `_`로 시작 (`_comment`, `_source`, `_tolerance_mas_polynomial_only`,
  `_tolerance_arcsec_mercury_moon`, `_tolerance_mas`).
- 숫자는 Python float 직렬화 그대로 — TS / Python 동일 IEEE 754.
- 단위:
  - `jd_tdb`: TDB Julian date (days).
  - `j2000_days_tdb`: `jd_tdb - J2000_JD_TDB`.
  - `ra_deg` / `dec_deg` / `w_deg`: degrees, IAU pole / prime meridian.
  - `inertial_to_body_fixed`: 9-element row-major 3×3 matrix (ICRF / J2000 → body-fixed).
  - `spice_max_abs_diff`: max element-wise `|TS_matrix - SPICE_pxform_polynomial_only|`.
  - `radius_m`: meters.
  - `lon_deg` / `lat_deg`: planetographic body-fixed (lon east-positive).

### `iau-rotation.json`

11 IAU rotation models (Sun + 8 planets + Moon + Pluto, polynomial-only) ×
5 jdTdb (J1900 / J2000 / Voyager 2 Uranus fly / 2026-05-06 / J2100) = 55 rows.

```jsonc
{
  "_tolerance_mas_polynomial_only": 1,
  "_tolerance_arcsec_mercury_moon": 60,
  "models": [
    {
      "key": "earth",
      "naif_id": 399,
      "name": "Earth",
      "frame_name": "IAU_EARTH",
      "samples": [
        {
          "label": "j2000_epoch",
          "jd_tdb": 2451545.0,
          "j2000_days_tdb": 0.0,
          "ra_deg": 0.0,
          "dec_deg": 90.0,
          "w_deg": 190.147,
          "inertial_to_body_fixed": [...9 elements...],
          "spice_max_abs_diff": 0.0
        }
      ]
    }
  ]
}
```

> **SPICE 비교 caveat**: `_source` 도 명시했듯이 SPICE pxform 도 polynomial-only
> PCK lines 로 평가된다 (`spice_pck_lines(model)` 가 BODY\*\_NUT*PREC*\* terms 를
> emit 하지 않음). 따라서 fixture 의 `spice_max_abs_diff` 는 ~1e-12 (machine
> precision) 수준이며, **full IAU 모델 (Mercury libration / Moon nutation /
> Neptune N term) vs. polynomial-only** 의 실제 천문학 정확도 차이는 본 Work 에서
> 평가하지 않는다 (Work 11 검증 대상).

### `body-catalog.json`

Python `BODY_CATALOG` 20 entries dump. 각 entry: `naif_id`, `slug`, `label`,
`kind`, `radius_m`, `rotation_model_key`, `texture_url`, `fallback_color`,
`atmosphere`, `rings` (Saturn 만 non-null).

### `sub-solar-point.json`

5 bodies (`earth`, `mars`, `jupiter`, `saturn`, `moon`) × 5 synthetic
sun-minus-body geometries (`body_at_plus_x_au`, ..., `body_at_2au_x`) ×
5 jdTdb = 125 rows.

```jsonc
{
  "_tolerance_mas": 1,
  "bodies": [
    {
      "body_key": "earth",
      "samples": [
        {
          "time_label": "j2000_epoch",
          "geom_label": "body_at_plus_x_au",
          "jd_tdb": 2451545.0,
          "sun_minus_body_m": [-149597870700.0, 0.0, 0.0],
          "lon_deg": 169.853,
          "lat_deg": 0.0,
        },
      ],
    },
  ],
}
```

본 fixture 는 `BodyInspector` 가 sub-solar 계산 정확도를 cross-check 할 때 사용
가능하지만 P5 dev demo 는 자체 synthetic 계산만 사용. Work 11 (atmosphere
scattering / day-night cycle 시각) 진입 시 fixture 가 적극 활용된다.

## 톨러런스 정책

[`tests/helpers/expectClose.ts`](../../helpers/expectClose.ts) helpers 재사용.

| 도메인                           | 톨러런스                          | helper                                  |
| -------------------------------- | --------------------------------- | --------------------------------------- |
| TS evaluateRotation ↔ Python     | **1 mas** (`TOL_ANGLE_MAS`)       | `expectCloseRadians`                    |
| TS matrix ↔ Python matrix        | **1e-12 element-wise**            | `Math.abs` 비교                         |
| Python matrix ↔ SPICE polynomial | **1e-10** (machine precision)     | direct float diff                       |
| Sub-solar lon/lat                | **1 mas** (synthetic geometry 시) | `Math.abs` deg 비교 (TS 단위 테스트 시) |

## 갱신 정책

- **수동**: 사람이 `pnpm fixtures:work-06` 실행 후 diff 검토하고 commit.
- CI 자동 갱신은 도입하지 않는다. 정책 / 상수 변경은 의도적 결정.
- `IAU_ROTATION_MODELS` 의 polynomial coefficient 변경 시 fixture diff 가
  매우 클 것 — handoff 결정 로그에 새 항목 추가 후 reviewer 검토.
- `BODY_CATALOG` 확장 (Charon / 추가 위성) 시 Work 2 NAIF_CATALOG + Work 4 radius
  - 본 카탈로그 + 텍스처 README 모두 함께 갱신.

## 회귀 가드 검증

P6 종료 시점에 의도적으로 Earth IAU rotation 의 `prime_meridian` polynomial
constant 를 1 mas 초과 (`190.147` → `190.150`) 로 흔들어
`tests/unit/astro/rotationModels.test.ts` 의 fixture cross-check 가 fail 함을
확인한 후 원복했다. fixture 가 polynomial 회귀를 정확히 잡아낸다는 것을 검증.

향후 IAU 모델 / 카탈로그 변경 작업자는:

1. handoff `docs/plan/work-06-bodies-handoff.md` 결정 로그에 변경 사유 기록.
2. `pnpm fixtures:work-06` 재생성.
3. TS / Python 모든 테스트 그린 확인.
4. reviewer 가 fixture diff (특히 W angle / matrix elements) 검토.
