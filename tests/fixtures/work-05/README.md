# Work 5 Golden Fixtures

> Render Foundation 모듈(`src/render/`)의 회귀 테스트 reference. Python
> (`orbitarium_tools.{starfield,render_anchors}`)에서 생성하고 commit한 후 TS 단위
> 테스트가 색온도 / 팔레트 / scene anchor / 명성 위치를 비교한다.

## 구성

| 파일                     | 생성 함수                                                            | TS 소비처                             |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------- |
| `scene-anchors.json`     | `orbitarium_tools.render_anchors.generate_anchor_fixtures`           | `tests/unit/render/anchors.test.ts`   |
| `color-temperature.json` | `orbitarium_tools.starfield.generate_color_temperature_fixture`      | `tests/unit/render/starfield.test.ts` |
| `starfield-samples.json` | `orbitarium_tools.starfield.generate_starfield_samples_fixture`      | `tests/unit/render/starfield.test.ts` |
| 전체                     | CLI: `orbitarium-tools fixtures --work=5` (anchors + starfield 통합) | `pnpm fixtures:work-05`               |

## 재생성

세 fixture를 한 번에 갱신 (생성 + Prettier 정렬):

```bash
pnpm fixtures:work-05
```

내부 단계:

```bash
cd tools/python
uv run orbitarium-tools fixtures --work=5 --out=../../tests/fixtures/work-05/
cd ../..
prettier --write tests/fixtures/work-05/
```

CLI 분기는 `tools/python/src/orbitarium_tools/cli.py`. Work 5 분기에서
`generate_anchor_fixtures` + `orbitarium_tools.starfield.generate_fixtures` (color-temp +
starfield-samples)를 차례로 호출한다.

`starfield-samples.json`은 Hipparcos 캐시(`tools/python/.cache/hipparcos/hipparcos_main.ecsv`)에서
명성 5개 (Sirius / Vega / Polaris / Betelgeuse / Arcturus)를 조회한다. 캐시가 없으면 각 entry에
`"skipped": "cache_missing"` 를 기록한다 — 먼저 `pnpm starfield:preprocess` 로 캐시를 채우자.

## 형식 컨벤션

- 형식: **JSON** (Work 2/3/4와 동일).
- 메타 키는 `_`로 시작 (`_comment`, `_source`, `_tolerance_mm`, `_tolerance_arcsec`,
  `_palette_size`, `_kelvin_range`).
- 숫자는 Python float 직렬화 그대로 둔다 — TS / Python은 IEEE 754 동일.
- 단위:
  - `position_icrf_m` / `applied_m` / `reference_ssb_m`: m, ICRF.
  - `kelvin`: K.
  - `palette_index`: 0..255.
  - `rgb_u8`: 8-bit sRGB triple.
  - `mag_bucket`: 0..255 (linear in Vmag [-2, 8]).
  - `unit_vector`: 3-tuple, ICRF unit vector.

### `scene-anchors.json`

3 anchor (`ssb` / `heliocentric` / `body-centric_earth`) × 6 sample positions (zero / sun_ssb /
earth_ssb / mars / jupiter / pluto) = 18 rows.

```jsonc
{
  "_tolerance_mm": 1.0,
  "anchors": [
    { "name": "ssb", "kind": "ssb", "samples": [...] },
    { "name": "heliocentric", "kind": "heliocentric", "reference_ssb_m": [...], "samples": [...] },
    { "name": "body-centric_earth", "kind": "body-centric", "reference_ssb_m": [...], "samples": [...] }
  ]
}
```

### `color-temperature.json`

12 B-V grid → Kelvin (Ballesteros 2012) → palette index → RGB triple.

```jsonc
{
  "_palette_size": 256,
  "_kelvin_range": [2000.0, 30000.0],
  "samples": [{ "bv": 0.0, "kelvin": 10125.23, "palette_index": 153, "rgb_u8": [201, 218, 255] }],
}
```

TS 측은 `bvToKelvin` (Ballesteros) → `paletteIndexForKelvin` → `kelvinToRgbU8` (Tanner Helland)을
같은 IEEE 754 알고리즘으로 매치한다.

### `starfield-samples.json`

5 명성 (Sirius / Vega / Polaris / Betelgeuse / Arcturus) post-PM (J1991.25 → J2000) ICRS 위치 +
Hipparcos B-V → Kelvin → palette + Vmag → mag bucket.

```jsonc
{
  "_tolerance_arcsec": 60.0,
  "samples": [
    {
      "name": "Sirius",
      "hip": 32349,
      "ra_j2000_deg": 101.286,
      "dec_j2000_deg": -16.719,
      "ra_j2000_deg_expected": 101.287,
      "dec_j2000_deg_expected": -16.716,
      "unit_vector": [...],
      "vmag": -1.44,
      "bv": 0.009,
      "kelvin": 10014.34,
      "palette_index": 152,
      "mag_bucket": 14
    }
  ]
}
```

TS 측은 published J2000 RA/Dec ↔ post-PM 결과를 60″ 안에서 비교 + palette / mag bucket / unit
vector 재계산도 검증한다.

## 톨러런스 정책

[`tests/helpers/expectClose.ts`](../../helpers/expectClose.ts) helpers 재사용.

| 도메인                  | 톨러런스                          | helper              |
| ----------------------- | --------------------------------- | ------------------- |
| anchor roundtrip        | **1 mm** (`_tolerance_mm`)        | `expectCloseMeters` |
| anchor fixture diff     | **1 mm**                          | `expectCloseMeters` |
| Tanner Helland RGB      | **bit-exact** (8-bit sRGB triple) | `expect.toEqual`    |
| Ballesteros Kelvin      | **<1 K**                          | `Math.abs` 비교     |
| 명성 RA/Dec post-PM     | **60″** (`_tolerance_arcsec`)     | `Math.abs` deg 비교 |
| starfield bin roundtrip | **Float32 round-off** (~1e4 m)    | `Math.abs` 비교     |

## 갱신 정책

- **수동**: 사람이 `pnpm fixtures:work-05` 실행 후 diff를 검토하고 commit.
- CI 자동 갱신은 도입하지 않는다. 색온도 공식 / palette range / anchor sample은 의도적 결정이다.
- starfield bin (`public/data/starfield/hipparcos-vmag6.bin`)을 변경하려면 `pnpm starfield:preprocess`
  → fixture 재생성 → Work 5 결정 로그 갱신.
- 명성 표(`NAMED_STAR_REFERENCES`) 확장 시 expected J2000 좌표를 SIMBAD에서 확인 후 추가.

## 회귀 가드 검증

P6 종료 시점에 의도적으로 Python `bv_to_kelvin`의 Ballesteros 상수 4600 → 4700으로 흔들어
`tests/unit/render/starfield.test.ts`의 `color-temperature fixture cross-check`가 fail함을
확인한 뒤 원복했다. fixture가 정책 회귀를 즉시 잡아낸다는 것을 검증.

향후 색온도 / 팔레트 / 명성 좌표 정책 변경 작업자는:

1. handoff `docs/plan/work-05-render-handoff.md` 결정 로그에 변경 사유 기록.
2. `pnpm fixtures:work-05` 재생성.
3. TS / Python test 모두 그린 확인.
4. reviewer 가 fixture diff (특히 `kelvin` / `palette_index` / `rgb_u8`) 검토.
