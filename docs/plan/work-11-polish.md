# Work 11 — Polish, Effects, Performance (Plan)

> Handoff: [`work-11-polish-handoff.md`](work-11-polish-handoff.md)

## 0. 한눈에

| 항목 | 값 |
| --- | --- |
| 목표 | bloom postprocess + perf overlay + frustum / instancing optimizations + KTX2 검토. |
| Phase 수 | 3 (Bloom postprocess → Perf overlay + bench → Closeout) |
| 선행 Work | Work 5 (renderer) · Work 9 (camera) · Work 10 (UI) |
| 후속 Work | Work 12 (validation/deploy) |
| 핵심 산출물 | `src/postprocess/` (bloom + tone mapping reset) + `src/perf/` (FPS / draw call / triangles 측정) + `/dev/perf` + `polish-conventions.md` |

## 1. Definition of Done

- [ ] Bloom postprocess: `EffectComposer` + `UnrealBloomPass` (옵션 토글).
- [ ] Perf 측정: `PerfMetrics` (fps / draw calls / triangles / GPU 메모리 추정) + Python `bench.py` regression detector.
- [ ] `/dev/perf`: live metrics overlay + bloom A/B + 효과 토글.
- [ ] format/lint/typecheck/test/build/e2e + Python 그린.
