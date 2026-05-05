# Orbitarium — 전체 계획 (Master Plan)

> **A real-position solar system simulator powered by ephemeris data.**
> 실제 ephemeris 데이터를 기반으로 태양계 천체의 위치/궤적을 정밀하게 재현하는 웹 기반 시뮬레이터.

---

## 1. 비전 (Vision)

- **과학적 정확성 (Scientific Accuracy)**
  실제 천체역학 데이터(JPL Horizons API, SPICE/DE440 ephemeris)를 사용하여,
  특정 시각의 태양계 천체 위치/속도/자세를 가능한 한 정확하게 재현한다.
- **시각적 완성도 (Aesthetic Excellence)**
  전문가용 플라네타리움 수준의 시각적 품질 — 적절한 조명, HDR, bloom, 대기 산란,
  성도(starfield), 토성 고리, 행성 표면 텍스처 등 — 을 갖춘다.
- **현실성과 가시성의 균형 (Realism vs. Legibility)**
  실제 거리/크기 비율을 그대로 그리면 빈 공간만 보인다. 따라서
  **실제 위치는 보존하되, 시각화 좌표만 과학적 스케일링 정책에 따라 변환**한다.
  (선형/대수/구간별 스케일을 카메라 줌 레벨에 따라 매끄럽게 전환)

## 2. 핵심 원칙 (Core Principles)

1. **정확성과 시각화의 분리 (Separation of Truth and Display)**
   - "물리 위치(SI 단위, ICRF/J2000 기준)"와 "렌더링 위치(스케일 적용)"는 별도 레이어로 관리.
   - 모든 거리 계산, 시간 변환, 좌표 변환은 SI 단위/표준 기준계로 진행.
2. **데이터 출처의 명시성 (Data Provenance)**
   - 모든 위치/궤도 데이터는 출처(Horizons / DE440 / 수치 적분)를 추적 가능해야 한다.
3. **시간의 정밀성 (Temporal Precision)**
   - UTC, TAI, TDB(Barycentric Dynamical Time), JD 변환을 명확히 다룬다.
   - 표시는 UTC, 계산은 TDB.
4. **점진적 충실도 (Progressive Fidelity)**
   - 빠르게 동작하는 minimal viable scene부터 시작해, 충실도를 단계적으로 끌어올린다.
5. **결정론적 재현성 (Deterministic Reproducibility)**
   - 같은 시각/같은 카메라 상태는 항상 같은 화면을 만든다.
6. **점진적 검증 (Progressive Verification)** ★
   - 각 Work는 **눈으로 즉시 확인 가능한 Dev Demo 페이지**(`/dev/*` 라우트)를 동반한다.
   - 동시에 **Python reference**(`tools/python/orbitarium_tools`)로 수치 정확성을
     교차 검증한다 — 같은 입력에 대해 TS 구현과 Python(astropy/spiceypy 등) 결과를 비교.

## 3. 기술 스택 (제안 — Work 1에서 확정)

| 영역 | 후보 | 비고 |
|---|---|---|
| 언어 | TypeScript | 복잡한 천체역학 계산의 타입 안정성 |
| 빌드 | Vite | 빠른 HMR |
| 3D | three.js | 사용자 확정 |
| UI 통합 | React + react-three-fiber 또는 Vanilla TS | Work 1에서 결정 |
| 천체 계산 | astronomy-engine, satellite.js, custom kernel reader | 보조용 |
| Ephemeris | JPL Horizons API + DE440 (WASM SPICE 또는 백엔드 사전 계산) | Work 3에서 결정 |
| 백엔드(선택) | Node.js (CORS 프록시, SPICE 처리) | 필요 시 |
| 워커 | Web Worker (계산), OffscreenCanvas (렌더 보조) | 성능용 |
| 상태 | Zustand 또는 RxJS | UI ↔ 시뮬 연결 |
| **Python 도구** | astropy, astroquery, spiceypy, matplotlib, jupyter, pytest | 검증 / 사전계산 / 골든값 / 탐색 |

---

## 4. 작업 가시성 정책 (Per-Work Visibility)

각 Work는 **두 채널**로 즉시 검증 가능해야 한다.

### 4.1 Dev Demo 라우트 (`/dev/*`)

- 메인 앱과는 분리된 개발자용 미니 도구.
- **Work 1**에서 `/dev/index` 카탈로그(향후 데모 페이지 링크 모음)와 dev 라우터를 깐 뒤,
  이후 모든 Work는 `/dev/<name>` 페이지를 추가하며 누적.
- 폴리시·접근성은 **Work 10/11의 책임**이므로 dev 페이지는 기능 우선.
- 코드 위치: `src/dev/<work-name>/` (Work 1에서 컨벤션 확정).
- 프로덕션 빌드에서는 라우트 비활성/숨김 (혹은 별도 빌드 타겟).

### 4.2 Python reference / tooling (`tools/python/`)

- `orbitarium_tools` 패키지: 모듈, CLI(`orbitarium-tools ...`), Jupyter 노트북.
- **3대 역할**:
  1. **Reference Implementation** — astropy/spiceypy 등으로 정답 계산 → TS 결과와 mas/ms 단위 비교.
  2. **Golden Value Generator** — 회귀 테스트용 fixture(JSON/CSV) 생성 → `tests/fixtures/`에 커밋.
  3. **Data Preprocessing** — DE440 SPK 커널을 브라우저용 chunk(Chebyshev 계수 직렬화)로 변환,
     항성 카탈로그 다운로드/필터링, 텍스처 메타데이터 정리.
- 노트북은 스케일 정책 시각화, 궤도 사후 분석, 카메라 보간 곡선 미리보기 등에 활용.

---

## 5. Work 단위 전체 계획

> 각 Work의 세부 phase는 해당 Work 시작 시점에 별도 문서(`work-NN-<short>.md`)로 작성.
> 각 Work는 마감 기준에 **Dev Demo + Python reference** 산출물을 포함한다.

### Work 1 — 프로젝트 기반 (Project Foundation)
**목표**: 작업 가능한 개발 환경과 코드 베이스 골격을 세운다.
- 기술 스택 최종 결정 (TS / 빌드러너 / R3F vs Vanilla / 패키지 매니저)
- 저장소 구조, 모듈 경계, 코딩 컨벤션 (ESLint, Prettier, tsconfig)
- 개발 서버, 핫 리로드, 기본 빌드/배포 파이프라인 스켈레톤
- 테스트 프레임워크 (Vitest + Playwright 등)
- `/dev/*` 라우터 + `/dev/index` 카탈로그 페이지 구조 컨벤션
- **Dev Demo**: `/` 첫 화면(회전 sphere + FPS 카운터 + 별 한 점 starfield) +
  `/dev/index`(향후 Work 데모 카드 placeholder들).
- **Python**: `tools/python/`이 `pip install -e ".[dev]"`로 설치되고
  `orbitarium-tools version` / `pytest`가 통과.

### Work 2 — 천문학 기반 (Astronomy Foundations)
**목표**: 정확한 시간/좌표 처리의 수학적 토대를 구축한다.
- 시간 시스템: UTC ↔ TAI ↔ TT ↔ TDB, Julian Date, J2000 epoch
- 기준 좌표계: ICRF / EME2000 / 황도(ecliptic) / body-fixed (IAU 회전 모델)
- 변환 행렬, 세차/장동(precession/nutation) 처리 정책
- 천문 상수(AU, GM, light-time, c) — IAU 2015 / DE440 일관성
- 천체 식별자(NAIF ID), 카탈로그 모델 정의
- **Dev Demo**: `/dev/astro` — UTC↔TT↔TDB↔JD 변환기, J2000 경과시간,
  ICRF↔ecliptic 좌표 변환 입출력 패널.
- **Python**: `orbitarium_tools.time`, `orbitarium_tools.frames` —
  astropy 결과와 비교(시간은 µs, 각도는 mas 정밀도). 골든값 fixture 생성.

### Work 3 — Ephemeris 데이터 레이어 (Ephemeris Data Layer)
**목표**: 실제 천체 위치/속도 데이터를 신뢰성 있게 가져온다.
- **JPL Horizons API** 클라이언트 (CORS 프록시 포함, 캐싱 정책)
- **DE440/DE441** 통합 전략 결정:
  - (a) `cspice` WASM 빌드로 브라우저 직접 평가
  - (b) 백엔드(Node) 또는 빌드 타임에 SPICE 평가 후 압축 chunk 직렬화
  - (c) Chebyshev 계수 직접 평가하는 경량 평가기
- 위성/소행성/혜성 등 추가 SPK 커널 처리
- 위치/속도 데이터의 통합 인메모리 모델, 보간(interpolation) 전략
- **Dev Demo**: `/dev/ephemeris` — body + 시각 입력 → x/y/z(km, AU), vx/vy/vz(km/s) 표시.
  Horizons 직접 호출 결과와 nm/mm 단위 diff 표시.
- **Python**: `orbitarium_tools.horizons`(astroquery 래퍼),
  `orbitarium_tools.de440`(spiceypy로 DE440 직접 평가), CLI:
  `orbitarium-tools horizons --body=mars --date=2026-05-05`. 골든값 fixture 자동 생성.

### Work 4 — 스케일 시스템 (Scale System)
**목표**: 과학적으로 타당하면서 시각적으로 매력적인 스케일 정책을 설계한다.
- 스케일 모델: 거리 스케일 / 천체 크기 스케일을 분리
- 후보 정책:
  - **이중 선형 (Dual-linear)**: 내행성/외행성 별도 스케일
  - **구간별 단조 변환 (Piecewise monotonic)**: AU 거리 → 가시 거리
  - **대수 스케일 (Logarithmic)**: 줌 레벨에 따라 부드럽게 보간
- 카메라 줌과 연동된 동적 스케일 (Adaptive Scale)
- 거리 표지(scale bar), 단위 시각화
- 참고: NASA Eyes on the Solar System, Solar System Scope, Universe Sandbox
- **Dev Demo**: `/dev/scale` — 정책 선택기 + 슬라이더, 1D 행성 라이너업 시각화,
  연속 줌 시 스케일 전환 데모.
- **Python**: `orbitarium_tools.scaling` + matplotlib — 정책별 정적 플롯
  (실제 거리 vs 시각 거리, 행성 위치 분포). 노트북: `notebooks/scaling-explore.ipynb`.

### Work 5 — 3D 렌더링 기반 (3D Rendering Foundation)
**목표**: 광활한 거리 + 작은 천체를 동시에 다룰 수 있는 렌더링 파이프라인.
- three.js 씬/렌더러/카메라 설정
- HDR linear-space 렌더링, ACES 톤매핑
- 광원 모델: 태양(점광원 + 영역 광원 근사), 환경광 최소화
- **로그 깊이 버퍼(logarithmic depth buffer)** — 광활한 스케일 차이 대응
- 별하늘(starfield): Hipparcos / Tycho-2 카탈로그 기반 실제 항성 위치
- 씬 그래프 정책 (Solar Barycenter ↔ Heliocentric ↔ Body-centric)
- **Dev Demo**: `/dev/render` — log-depth 검증(반경 1과 1e9 sphere 동시 표시),
  HDR exposure 슬라이더, 실제 항성 starfield 토글.
- **Python**: `orbitarium_tools.starfield` — Hipparcos/Tycho-2 raw → three.js
  바이너리 포맷(`Float32` 위치 + `Uint8` 색온도 인덱스) 변환 스크립트.

### Work 6 — 천체 렌더링 (Celestial Bodies)
**목표**: 태양/행성/위성을 사실적으로 표현한다.
- 태양: 표면 활동, corona, 광채(glow), CME 표현 여지
- 행성: PBR 텍스처, 노멀/스페큘러, 대기 산란(atmospheric scattering)
- 위성: 주요 위성(달, 갈릴레이 위성, 토성 주요 위성, 명왕성계 등)
- **자전(rotation)**: IAU 회전 모델 기반 자전축/자전 속도 — 실제 시각의 자전 위상
- 토성 고리: 셰이더 기반 반투명 + 그림자
- 음영(self-shadow), 그림자(planet shadow on rings, eclipse)
- **Dev Demo**: `/dev/body/<name>` — 단일 천체 인스펙터(자전축 시각화, 자전 위상 표시,
  텍스처 토글, 대기 셰이더 ON/OFF), 토성 전용 페이지(고리·그림자).
- **Python**: `orbitarium_tools.rotation` — IAU 회전 모델 reference,
  현재 그리니치 각·sub-solar point 계산 → TS와 mas 비교.

### Work 7 — 궤도 및 궤적 (Orbits & Trajectories)
**목표**: 천체의 과거/미래 궤적을 정밀하게 시각화한다.
- ephemeris를 샘플링한 궤도 폴리라인
- 과거 trail(꼬리), 미래 trajectory(예측선) 분리
- 궤도면 시각화, 궤도 요소(Keplerian elements) 오버레이(옵션)
- 소행성대(메인 벨트), 카이퍼대 — 인스턴싱 기반 대량 표현
- 일식/월식/엄폐 등 이벤트 마커 (Work 10 UI와 연계)
- **Dev Demo**: `/dev/orbits` — 단일 천체 + 과거 trail / 미래 predict 토글,
  시간 윈도우/샘플 밀도 슬라이더. 소행성대 인스턴싱 미리보기.
- **Python**: `orbitarium_tools.orbits` — 샘플 ephemeris → 케플러 요소 추출,
  궤도 폴리라인 사전 생성 (큰 천체는 정적 fixture로 직렬화).

### Work 8 — 시간 제어 시스템 (Time Control System)
**목표**: 과거/현재/미래 어느 시각이든 자유롭게 탐색.
- 현재 시각(실시간) / 임의 시각 / 재생(playback) 모드
- 시간 가속(real-time → 백만 년/초)과 부드러운 스케일링
- 시간 스크러버, 프리셋(주요 천문 사건 — 일식, 합/충, 보이저 발사 등)
- 일관된 시간 → 모든 천체/궤도/카메라 동기화
- **Dev Demo**: `/dev/time` — 전체 시간 컨트롤러(scrubber, 속도 노브, preset 점프),
  1개 body 위치/자전 동기화 데모, dt 추적 그래프.
- **Python**: `orbitarium_tools.events` — 일식/합·충/근일점 등 천문 이벤트
  검색기 (skyfield 또는 직접 검색). 프리셋 JSON 자동 생성.

### Work 9 — 카메라 및 내비게이션 (Camera & Navigation)
**목표**: 어느 천체에서든 어디든 매끄럽게 이동.
- 모드: free-fly, focus(특정 천체 주위), follow(궤도 동행), pov(천체 표면)
- 천체 ↔ 천체 부드러운 트랜지션 (cinematic camera)
- 프리셋 뷰: 황도면 위, 태양에서, 지구에서, 보이저 시점 등
- 마우스/터치/키보드 입력 통합
- **Dev Demo**: `/dev/camera` — 모든 모드/프리셋 버튼, 트랜지션 곡선 토글,
  현재 카메라 상태(위치/방향/FOV) 라이브 표시.
- **Python**: 노트북 `camera-curves.ipynb` — 트랜지션 보간 곡선 시각화 및 비교.

### Work 10 — UI/UX 레이어 (UI/UX Layer)
**목표**: 정보 풍부하지만 깔끔한 컨트롤/정보 표시.
- 시간 컨트롤(스크러버, 입력, 재생/일시정지/속도)
- 천체 선택기, 정보 패널(현재 위치/속도/거리/위상/IAU 데이터)
- 설정 패널(스케일 모드, 가시화 옵션, 단위)
- 검색, 북마크, 공유(시각+카메라 상태 URL)
- 접근성(키보드 내비, 색상 대비)
- **Dev Demo**: `/dev/ui-kit` — 전체 컴포넌트 카탈로그(Storybook 또는 자체 페이지).
  메인 앱(`/`) 자체가 통합 산출물.
- **Python**: `orbitarium_tools.share-url` — 공유 URL 인코딩/디코딩 reference로
  TS와 round-trip 검증.

### Work 11 — 효과 / 폴리시 / 성능 (Polish, Effects, Performance)
**목표**: 전문 플라네타리움 수준의 마감과 부드러운 60fps.
- Bloom, lens flare, godrays(태양), 대기 림 라이팅
- 파티클(소행성, 혜성 꼬리, 솔라윈드 옵션)
- LOD(거리별 디테일), 인스턴싱(소행성/별), frustum culling
- 텍스처 압축(KTX2/Basis), GLTF/Draco
- 프레임 페이싱, 워커 오프로드
- **Dev Demo**: `/dev/perf` — FPS/draw call/triangles/GPU 메모리 라이브 오버레이,
  효과 A/B 토글(bloom on/off 등), 프로파일 스냅샷 export.
- **Python**: `orbitarium_tools.bench` — 벤치 결과(JSON) 분석/플롯,
  회귀 감지(전 빌드 대비 N% 저하 시 경고).

### Work 12 — 검증 / 테스트 / 배포 (Validation, Testing, Deployment)
**목표**: 정확성과 품질을 측정 가능하게 보증하고 배포한다.
- **위치 검증**: Horizons 응답과의 오차 측정 (mas 단위 angular error)
- 시각/시간 회귀 테스트(스냅샷)
- 성능 벤치마크(다양한 GPU 시나리오)
- 크로스브라우저 테스트
- 빌드/호스팅(정적 + API 프록시), 배포 파이프라인
- 사용자 문서, 과학 노트(어떤 모델/커널을 썼는지)
- **Dev Demo**: `/dev/validation` — 천체×시각 매트릭스에 대한 위치 오차 대시보드,
  최근 회귀 결과 표시.
- **Python**: `orbitarium-tools validate --report` — Horizons와 자동 교차 비교,
  HTML/Markdown 리포트 생성. CI에 통합.

---

## 6. Work 의존 관계 (Dependency)

```
Work 1 (Foundation)
   │
   ├─► Work 2 (Astronomy)
   │       │
   │       └─► Work 3 (Ephemeris) ──┐
   │                                 │
   ├─► Work 4 (Scale) ───────────────┤
   │                                 │
   └─► Work 5 (Render Foundation) ◄──┴─► Work 6 (Bodies) ─► Work 7 (Orbits)
                                                                │
                                                                ▼
                                                       Work 8 (Time Control)
                                                                │
                                                                ▼
                                                       Work 9 (Camera)
                                                                │
                                                                ▼
                                                       Work 10 (UI/UX)
                                                                │
                                                                ▼
                                            Work 11 (Polish) ─► Work 12 (Validation/Deploy)
```

- Work 2, 3, 4는 Work 1 이후 어느 정도 병렬 가능.
- Work 6 이후로는 거의 직렬에 가깝지만, 폴리시(11)는 전 구간에 걸쳐 점진적으로 진행.
- **Python reference 모듈은 해당 Work와 같은 phase에서 동반 작성**되어야 한다
  (TS만 만들고 검증은 미루는 패턴 금지).

## 7. 폴더 구조 (초안)

```
orbitarium/
├── README.md
├── docs/
│   ├── plan/                    # Work별 계획 문서 (이 문서 + work-NN-*.md)
│   ├── architecture/            # 시스템 설계 문서
│   └── science/                 # 천문/수학 노트, 출처, 검증 결과
├── src/                         # 프론트엔드 (Work 1에서 세분화)
│   └── dev/                     # /dev/* 라우트 — Work별 검증 페이지 모음
├── public/                      # 정적 자산 (텍스처, 사전계산 ephemeris chunk 등)
├── server/                      # 선택: API 프록시 / SPICE 처리 백엔드
├── scripts/                     # 빌드/데이터 준비 스크립트
├── tools/
│   └── python/                  # ★ Python 검증/도구 패키지 (orbitarium_tools)
│       ├── pyproject.toml
│       ├── README.md
│       ├── src/orbitarium_tools/    # 모듈은 각 Work에서 추가
│       ├── notebooks/               # 탐색용 Jupyter
│       └── tests/                   # pytest
└── tests/                       # JS/TS 통합·회귀·정확도 테스트 (fixtures 포함)
```

## 8. Python 도구 전략 (Python Tooling Strategy)

`tools/python/orbitarium_tools` 패키지는 다음 4 역할을 한다.

| 역할 | 설명 | 대표 모듈 |
|---|---|---|
| **Reference** | astropy/spiceypy 기반 정답 계산 → TS 결과와 비교 | `time`, `frames`, `rotation` |
| **Golden** | 회귀 테스트 fixture(JSON/CSV) 자동 생성 | 각 모듈의 `generate_fixtures` |
| **Preprocessing** | DE440 → 브라우저용 chunk, 항성 카탈로그, 텍스처 메타 | `de440`, `starfield` |
| **CLI / Notebooks** | 빠른 확인 명령 + 탐색용 Jupyter | `cli`, `notebooks/*.ipynb` |

설치/실행:
```bash
cd tools/python
pip install -e ".[astro,viz]"   # 또는 uv pip install -e ".[astro,viz]"
orbitarium-tools --help
orbitarium-tools version
```

extras 그룹:
- `astro`: astropy, astroquery, spiceypy
- `viz`: matplotlib, scipy
- `notebook`: jupyter, ipykernel
- `dev`: pytest, ruff, mypy
- `all`: 위 전부

## 9. 다음 단계

1. 본 문서 검토.
2. **Work 1 — 프로젝트 기반**의 phase 계획을 `docs/plan/work-01-foundation.md`로 작성.
3. Work 1 phase 진행 — `/dev/index` 카탈로그와 `tools/python/` smoke test가 통과하면 마감.

---

_Last updated: 2026-05-05_
