# Ephemeris Conventions

> Work 3 산출물 (`src/ephemeris/`, `orbitarium_tools.{de440,horizons}`)의 정책 요약.
> Work 4 (Scale) / Work 6 (Bodies) / Work 7 (Orbits) / Work 8 (Time Control) / Work 12
> (Validation) 진입 시 이 문서를 먼저 읽고 import 패턴 / 톨러런스를 따라잡는다.
>
> 출처: [`overview.md`](../plan/overview.md) ·
> [`work-03-ephemeris.md`](../plan/work-03-ephemeris.md) ·
> [`work-03-ephemeris-handoff.md`](../plan/work-03-ephemeris-handoff.md) (결정 로그 §2 #1~#30) ·
> Work 2 의 [`astro-conventions.md`](astro-conventions.md) (시간/좌표/회전).

## 1. 단위 (Truth 레이어, Work 2 와 동일)

- 위치: **m** — `PositionICRF = readonly [Meters, Meters, Meters]`
- 속도: **m/s** — `VelocityICRF = readonly [MetersPerSecond, ...]`
- 시간 입력: **JdTdb** (Work 2 brand 재사용)
- 좌표계: **ICRF** (= J2000 mean equator within ~23 mas frame bias)

브랜드 타입 합성: `PositionICRF`/`VelocityICRF` 는 `Meters`/`MetersPerSecond` 위에 frame-aware
3-tuple phantom. `StateVectorICRF = { naifId, jdTdb, position, velocity }` interface.

## 2. 천체 카탈로그 (Work 3 범위)

DE440 native 14 segments + 6 alias = 20 NAIF ids 커버:

| NAIF id  | 설명                                     | DE440 segment                |
| -------- | ---------------------------------------- | ---------------------------- |
| 10       | Sun                                      | (10, 0)                      |
| 1..9     | Planet barycenters                       | (1..9, 0)                    |
| 199, 299 | Mercury, Venus                           | (199, 1), (299, 2)           |
| 399, 301 | Earth, Moon                              | (399, 3), (301, 3)           |
| 499..999 | Mars/Jupiter/Saturn/Uranus/Neptune/Pluto | **alias to barycenter** 4..9 |

DE440 자체에 외행성 body segment 가 없으므로 (planet >> 위성 mass) 우리 evaluator 는 manifest 의
`aliases_planet_body_to_barycenter` 를 보고 자동 치환. spiceypy `spkezr` 도 동일.

위성 (갈릴레이, 토성 위성 등) 은 **Work 6** 에서 별도 SPK 커널 도입 시 추가.
소행성 / 혜성 / 우주선 은 **Work 7** 에서 Horizons TS client + 별도 SPK 도입 시 추가.

## 3. DE440 SPK → Browser 파이프라인

```
de440.bsp (NAIF, 120MB)
  │ orbitarium_tools.de440.preprocess (jplephem read + crop)
  ▼
public/data/ephemeris/de440/
  manifest.json                  # 메타 (segment list, aliases, kernel sha256)
  spk_<target>_<center>.bin × 14 # Float64 LE Chebyshev
  │ src/ephemeris/createWebDe440Loader (fetch)
  ▼
src/ephemeris/createDe440Evaluator
  └── getStateAt(naifId, jdTdb) -> StateVectorICRF
```

**시간 범위 default**: 1900-01-01 ~ 2150-12-31 (250 yr). `pnpm de440:preprocess` 로 재생성.
출력 사이즈: ~25 MB (Sun 1.4MB / EMB+Earth 6.8MB each / Moon 6.8MB / 외행성 bary 0.4–0.7MB / inner planet body 80B).

**Binary commit 정책**: gitignored (`public/data/ephemeris/*` 이미 적용). 로컬에서는 한 번
`pnpm de440:preprocess` 실행. CI는 워크플로 step 으로 자동 생성 (`.github/workflows/ci.yml`).

## 4. Chebyshev 평가 (P3)

```ts
import { createDe440Evaluator } from '@/ephemeris'
import { createWebDe440Loader } from '@/dev/ephemeris/webLoader' // dev 한정
const evaluator = createDe440Evaluator(createWebDe440Loader())
const sv = await evaluator.getStateAt(399, jdTdb) // Earth at JD TDB
// sv.position : PositionICRF (m), sv.velocity : VelocityICRF (m/s)
```

- evaluator 가 `manifest.json` lazy load → segment chain (e.g. Earth = `[399, 3]`) walk → Chebyshev 평가
  → 합산 SSB-centered 결과 반환.
- Promise 단위 in-memory cache (chunk 한 번 fetch 후 재사용).
- 위치 km → m, 속도 km/day → m/s 변환은 evaluator 내부에서 처리.

## 5. 톨러런스 (P3 측정값)

| 비교                              | 톨러런스          | 측정 max |
| --------------------------------- | ----------------- | -------- |
| TS evaluator vs spiceypy `spkezr` | **1 mm / 1 µm/s** | < 1 mm   |
| TS evaluator vs jplephem direct   | (자체 검증) 1 mm  | 0.49 mm  |
| Horizons API vs local DE440       | **1 cm** (text)   | < 6 mm   |

**비교는 component-wise L_∞ (sup norm)** — Neptune barycenter (30 AU = 4.5e12 m) 에서 IEEE 754 LSB 가
axis 당 ~1mm. L_2 norm 은 √3 누적 → 의미 있는 톨러런스 위로 흔들림. 1mm 는 axis 별 단일-LSB 한계까지 추적.

## 6. Horizons (Python only, Work 3 범위)

- `orbitarium_tools.horizons.query_state(naif_id, jd_tdb)` — astroquery wrapper
- refplane='earth' (J2000 mean equator), location='@0' (SSB), light-time off
- AU → m, AU/day → m/s 변환은 wrapper 내부
- TS Horizons client: **Work 7 deferred** (CORS 프록시 + 캐싱 + 소행성/혜성 본격 도입 시)

CLI: `uv run orbitarium-tools horizons --body=mars --jd-tdb=2461165.5008007577`

## 7. astropy / spiceypy 호환

DE440 은 IAU 2006 mean ecliptic / J2000 reference 와 모두 정합. 본 evaluator 출력은 ICRF (= astropy
`ICRS` 와 frame bias 23 mas 안 일치). EME2000 / Ecliptic J2000 변환은 Work 2 `frames` 모듈을 통과.

```ts
import { icrfToEcliptic } from '@/astro'
const eclPos = icrfToEcliptic(sv.position) // J2000 ecliptic
```

## 8. 정밀도가 안 맞을 때

대부분 다음 셋 중 하나:

1. **Time scale 혼선** — UTC `Date` 를 그대로 jdTdb 로 캐스트하면 1ms~67s 차이. `utcToJdTdb()` 통과 필요.
2. **Frame 변환 누락** — DE440 출력은 ICRF. EME2000 으로 보낼 때는 `icrfToEme2000()` 필수.
3. **Outer planet body NAIF id** — spiceypy `spkezr('499', ...)` 는 fail. evaluator 의 alias 거치거나 `'4'` (bary) 사용.

## 9. 회귀 가드

`tests/fixtures/work-03/de440-states.json` (160 entries) 가 매 push 마다 evaluator 출력과 비교.
의도적으로 1mm 초과 변경 시 다수 테스트 fail (P6 검증 완료). fixture 갱신 시 reviewer 가 diff 검토.

## 10. Work 4+ 진입 시 점검 체크리스트

- [ ] `import { createDe440Evaluator, type StateVectorICRF } from '@/ephemeris'`
- [ ] `JdTdb` brand type 으로 시간 입력 (Work 2 `utcToJdTdb()` 통과)
- [ ] 좌표계 명시 — `PositionICRF` 는 ICRF/J2000. EME2000/Ecliptic 필요시 `frames.ts` 통과.
- [ ] Work 4 (Scale): `PositionICRF` (m) → scene 단위 변환은 명시적 함수 (`positionToScene` 류).
- [ ] Work 7 (Orbits): 궤도 폴리라인 샘플링 시 evaluator 한 번 fetch 후 동일 segment 재사용 — Promise cache 가 자동 처리.
- [ ] Work 8 (Time Control): UTC scrubber → `utcToJdTdb` → evaluator. 가속 재생 시 chunk fetch 가 첫 호출에만 발생.
- [ ] Work 12 (Validation): Horizons cross-check 자동 실행. `orbitarium_tools.horizons` 재사용.
