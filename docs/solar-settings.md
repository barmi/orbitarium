# Solar — Settings 가이드

Orbitarium의 통합 뷰(`/`)에서 좌측 상단 **▸ Settings** 버튼을 눌러 펼치면
모든 시각화 옵션을 조정할 수 있습니다. 모든 설정은 URL 해시에 자동으로
기록되므로 그대로 복사해서 공유하면 같은 화면이 재현됩니다.

> 이 문서는 사용자 관점 설명입니다. 정책 함수의 수식·테스트는
> [`src/scale/`](../src/scale/)와 fixture를 참고하세요.

---

## 1. Distance scale (거리 스케일)

행성의 SSB 기준 위치(미터)를 scene 단위(반경 1 정도의 우주)로 매핑하는
함수를 고릅니다. 같은 시각의 같은 데이터를 다른 시각적 비례로 보여줍니다.

| 정책 | 동작 | 어울리는 상황 |
| --- | --- | --- |
| `linear-au` | 1 AU = 1 scene 단위. 단순 선형. | "AU 자(尺)"가 필요한 디버그·검증 |
| `piecewise-monotonic` (기본) | 0–0.4 AU(내행성), 0.4–5 AU(목성권), 5–50 AU(외행성)을 각각 다른 기울기로 매핑 | 일반적인 솔라 시스템 시각화 |
| `logarithmic` | log(1 + d/AU). 멀수록 압축. | 카이퍼 벨트 / 외부 영역까지 한 화면에 |

`linear-au`는 외행성이 화면 밖으로 멀리 나가므로, 보통은 기본인 `piecewise-monotonic`
또는 `logarithmic`이 보기 편합니다.

## 2. Size scale (크기 스케일)

행성 반경(미터)을 scene 단위로 매핑합니다.

| 정책 | 동작 | 특징 |
| --- | --- | --- |
| `uniform` | 반경/AU. 실제 비율. | 행성이 거의 보이지 않는 점이 됨 — "현실 그대로" |
| `logarithmic-magnification` (기본) | `0.005 + 0.5 · log₁₀(1 + r/R⊕)` | 작은 천체를 강조. 상대 순서 보존. |
| `minmax-clamp` | Pluto–Sun 반경을 `[0.005, 5.0]` scene 단위에 선형 매핑 | 모든 천체 가시성 보장, 상대 비율 왜곡 큼 |

### 왜 Moon이 안 보이나?

- 기본 정책(`logarithmic-magnification`)에서 **Earth의 시각 반경 ≈ 0.155 scene**
- 같은 화면에서 **Earth–Moon scene 거리 ≈ 0.0026 scene** (실제 38만 km를 piecewise 매핑한 결과)
- 즉 Moon은 Earth 메시 안쪽에 묻혀 있습니다 — 실제 비율이 그러니까요.

위성을 분리해서 보고 싶다면 아래 **Body size ×** 를 줄여 Earth의 시각 반경을
Moon 거리보다 작게 만드세요.

## 3. View options

### `show orbits`
궤도 폴리라인 표시. 끄면 천체만 남아 깔끔합니다.

### `show starfield`
Hipparcos 카탈로그(7,000여 별)를 배경에 그릴지 여부.

### `vmag cutoff` (별 등급 임계값)
값이 작을수록 더 밝은 별만 표시. 6.0(기본)은 맨눈 한계. 3–4로 내리면
별자리의 밝은 별만 남아 깔끔합니다. `show starfield`가 꺼져 있으면 비활성.

### `body size ×`  ★ 권장 사용
`size scale` 정책의 결과에 곱해지는 배율입니다.
- ×1.000 (기본) — 큰 행성이 두드러져 보기 좋지만, 위성은 행성 안에 묻힘
- ×0.005 — Earth의 시각 반경이 Moon 궤도(약 0.001 scene)보다 작아져 **Moon
  본체와 궤도 링 모두 Earth 밖으로 분리됨**
- ×0.005 (최저) — 거의 "현실 비율"

옵션 옆 **moons visible (×0.005)** 버튼을 누르면 한 번에 위성 분리 모드로
들어갑니다. **reset (×1)** 으로 원복.

> Moon 옆에는 **"Moon" 라벨**이 항상 떠 있어 (sizeScale과 무관하게) Moon이
> 어디 있는지 즉시 알 수 있습니다. Moon의 궤도는 SSB가 아닌 **지구 중심
> (geocentric)** 에서 샘플링되어, Earth 옆에 ~38만 km 반경의 작은 원으로
> 그려집니다. 이 링은 Moon body와 정확히 같은 scene 변환을 거치므로 Moon이
> 항상 링 위에 놓입니다.

> 거리(distance scale)는 그대로이고 **크기만** 줄어드는 점에 주의하세요.
> Earth–Moon 거리는 변하지 않고, 단지 Earth가 작아져서 Moon이 그 옆에
> 보이게 됩니다.

---

## 4. Time controls (우측 상단 패널)

### UTC readout
현재 시뮬레이션 시각을 UTC ISO로 표시. TDB→UTC 역환산은 ~1초 오차.

### Jump (datetime-local 입력 + Apply / Now)
- 입력란: `YYYY-MM-DDTHH:MM:SS` 형식. UTC로 해석.
- **Apply** 또는 Enter: 입력 값으로 점프.
- **Now**: 현실 시각(브라우저의 `Date.now()`)으로 점프.

### Preset (드롭다운)
주요 천문 시각:
- J2000 (2000-01-01 12:00 TT)
- Voyager 1 launch (1977-09-05)
- 2024-04-08 total eclipse
- Work 8 demo (2026-05-06)

### Step 버튼
현재 시각에서 ±1y / ±1mo / ±1d / ±1h 만큼 즉시 점프. 재생/정지와 무관.

### 재생 컨트롤
- **▶▶ / ◀◀** — 재생 방향 토글. ◀◀이면 시간이 거꾸로 흐름.
- **▶ / ◀ / ⏸** — 재생/정지. 색상은 현재 방향을 반영.
- **rate select** — ×1s/s ~ ×1y/s. 1을 기준으로 양수 magnitude.

---

## 5. URL 해시 키 매핑

설정을 직접 URL에 적어 진입점을 만들 수 있습니다.

| 키 | 의미 | 예 |
| --- | --- | --- |
| `v` | 스키마 버전 | `v=1` (필수) |
| `jd` | TDB Julian Date | `jd=2461166.500` |
| `body` | 포커스 슬러그 | `body=jupiter` |
| `dist` | distance 정책 이름 | `dist=logarithmic` |
| `size` | size 정책 이름 | `size=minmax-clamp` |
| `o` | orbits 표시 (0=off) | `o=0` |
| `s` | starfield 표시 (0=off) | `s=0` |
| `vm` | vmag cutoff | `vm=3.50` |
| `ss` | body size 배율 | `ss=0.020` |

### 예시 URL

- 기본: `/`
- Moon 분리 + 별 끄기: `/#?v=1&jd=2461166.5&body=earth&ss=0.005&s=0`
- Jupiter 줌 + 로그 거리: `/#?v=1&jd=2461166.5&body=jupiter&dist=logarithmic`

---

## 6. 화면 하단 — Body chips

`System` 또는 11개 천체 칩을 클릭하면 카메라가 해당 천체를 중심으로
회전·줌인합니다. `System` 으로 다시 전체 보기. 선택 상태는 URL `body=` 에
기록됩니다.

---

## 7. 권장 시작 설정

| 목표 | 권장 |
| --- | --- |
| 일반 보기 | 모두 기본 |
| 위성도 보고 싶을 때 | `body size ×0.02`, `show orbits` 켜기 |
| 깔끔한 카탈로그 모드 | `show orbits` 끄기, `vmag` 3.0 |
| 외행성 한 눈에 | `dist=logarithmic`, `size=minmax-clamp` |
| 디버그(자(尺) 모드) | `dist=linear-au`, `size=uniform` |
