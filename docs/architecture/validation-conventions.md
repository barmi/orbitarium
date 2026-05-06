# Validation Conventions

> Work 12 (`src/validation/`, `orbitarium_tools.validate`) 정책. 마지막 Work — 회귀 / 배포 가드.

## 1. ValidationSample 모델

- `bodyKey`, `utcIso`, `jdTdb`, `de440PositionM`, `horizonsPositionM`, `diffMagnitudeM`, `angularErrorMas`.
- Horizons fetch 가 실패하면 `horizonsPositionM = null` + `diffMagnitudeM = null` (skip).

## 2. 매트릭스 (synthetic placeholder)

- 5 bodies (Mercury / Venus / Earth / Mars / Jupiter) × 3 utc (J2000 / 2024 eclipse / 2026 demo) = 15 samples.
- 본 release 의 fixture 는 1.5 m offset placeholder. 실제 fetch 통합은 별도 task.

## 3. CI / Deploy

- `.github/workflows/ci.yml`: node + python + e2e 3 jobs.
- `.github/workflows/deploy.yml`: GitHub Pages (`pnpm build` → `dist/`).
- Pages 활성화는 repo Settings → Pages → "GitHub Actions" source.

## 4. Tolerance

- Horizons live API 와 DE440 간 mas-level 일치 (현실 목표). placeholder 는 1.5 m fixed.
- Future: real fetch 후 < 1 mas / body × time 매트릭스 회귀 가드.
