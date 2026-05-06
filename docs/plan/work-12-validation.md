# Work 12 — Validation, Testing, Deployment (Plan)

> Handoff: [`work-12-validation-handoff.md`](work-12-validation-handoff.md)

## 0. 한눈에

| 항목 | 값 |
| --- | --- |
| 목표 | 위치 정확도 (Horizons vs DE440) 검증 + GitHub Actions CI 통합 + 정적 호스팅 (GitHub Pages) 배포 + 사용자/과학 문서. |
| Phase 수 | 3 (Validation report → CI / deploy → User & science docs + Closeout) |
| 선행 Work | 모든 prior Work — final integration. |
| 핵심 산출물 | `src/validation/` (Horizons cross-check) + Python `validate.py` (mas error report) + `/dev/validation` 대시보드 + `.github/workflows/deploy.yml` + `docs/user-guide.md` + `docs/science-notes.md` |

## 1. Definition of Done

- [ ] `orbitarium-tools validate --report` — 5 body × 5 시각 매트릭스에 대한 Horizons API vs DE440 mas-level 비교 + JSON / Markdown 리포트.
- [ ] `/dev/validation` — 위치 오차 대시보드 (table + heatmap-ish summary).
- [ ] `.github/workflows/deploy.yml` — `pnpm build` → GitHub Pages 배포 (예시 워크플로 — 실제 활성화는 사용자 책임).
- [ ] `docs/user-guide.md` — 어떻게 사용하나, share URL, presets.
- [ ] `docs/science-notes.md` — DE440 / Hipparcos / IAU rotation / Solar System Scope 의 출처 / 라이선스 / 정확도 요약.
- [ ] format/lint/typecheck/test/build/e2e + Python ruff/mypy/pytest 그린.
