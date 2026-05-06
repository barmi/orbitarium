import { type ComponentType, lazy, type LazyExoticComponent } from 'react'

export interface DevPageEntry {
  workNumber: number
  slug: string
  title: string
  summary: string
  Component?: LazyExoticComponent<ComponentType>
  /** When true, the page handles its own nested routes under ``/dev/<slug>/*``. */
  hasNestedRoutes?: boolean
}

export const devPages: DevPageEntry[] = [
  {
    workNumber: 2,
    slug: 'astro',
    title: 'Astronomy Foundations',
    summary: 'UTC ↔ TT ↔ TDB ↔ JD 변환기, J2000 경과시간, ICRF ↔ ecliptic 좌표 변환',
    Component: lazy(() => import('./astro/AstroDemo')),
  },
  {
    workNumber: 3,
    slug: 'ephemeris',
    title: 'Ephemeris Data Layer',
    summary: 'body + 시각 입력 → 위치/속도. JPL Horizons 직접 호출 결과와 nm/mm diff',
    Component: lazy(() => import('./ephemeris/EphemerisDemo')),
  },
  {
    workNumber: 4,
    slug: 'scale',
    title: 'Scale System',
    summary: '거리/크기 분리 스케일 정책 (이중 선형 / 구간별 / 대수) 비교',
    Component: lazy(() => import('./scale/ScaleDemo')),
  },
  {
    workNumber: 5,
    slug: 'render',
    title: 'Rendering Foundation',
    summary: 'log-depth 검증 sphere(1·1e9 동시), HDR exposure, 실제 항성 starfield',
    Component: lazy(() => import('./render/RenderDemo')),
  },
  {
    workNumber: 6,
    slug: 'body',
    title: 'Celestial Bodies',
    summary: '단일 천체 인스펙터 — 자전축/자전 위상, 텍스처 토글, 토성 고리·그림자',
    Component: lazy(() => import('./body/BodyDemo')),
    hasNestedRoutes: true,
  },
  {
    workNumber: 7,
    slug: 'orbits',
    title: 'Orbits & Trajectories',
    summary: '단일 천체 + 과거 trail / 미래 predict 토글, 시간 윈도우 슬라이더',
    Component: lazy(() => import('./orbits/OrbitsDemo')),
  },
  {
    workNumber: 8,
    slug: 'time',
    title: 'Time Control',
    summary: '시간 컨트롤러 (scrubber, 속도, presets) + body 동기화 데모',
  },
  {
    workNumber: 9,
    slug: 'camera',
    title: 'Camera & Navigation',
    summary: '모드/프리셋 버튼, 트랜지션 곡선 토글, 카메라 상태 라이브 표시',
  },
  {
    workNumber: 10,
    slug: 'ui-kit',
    title: 'UI Kit',
    summary: '전체 UI 컴포넌트 카탈로그',
  },
  {
    workNumber: 11,
    slug: 'perf',
    title: 'Polish & Performance',
    summary: 'FPS / draw call / GPU 메모리 라이브 오버레이, 효과 A/B 토글',
  },
  {
    workNumber: 12,
    slug: 'validation',
    title: 'Validation',
    summary: '천체 × 시각 매트릭스 위치 오차 대시보드, 회귀 결과',
  },
]
