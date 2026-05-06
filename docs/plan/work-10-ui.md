# Work 10 — UI/UX Layer (Plan)

> Handoff: [`work-10-ui-handoff.md`](work-10-ui-handoff.md)

## 0. 한눈에

| 항목 | 값 |
| --- | --- |
| 목표 | 메인 앱 (`/`) UI 컴포넌트 + share URL + 정보 패널 + 시간 컨트롤 통합. `/dev/ui-kit` 카탈로그. |
| Phase 수 | 3 (UI Kit components → Share URL → Main app integration + Closeout) |
| 선행 Work | Work 6 (BodyDefinition) · Work 8 (SimulationClock) · Work 9 (CameraState) |
| 후속 Work | Work 11 (polish) · Work 12 (deploy) |
| 핵심 산출물 | `src/ui/` (Button / Slider / Panel / BodyChip / TimeScrubber) + `src/share/` (URL encode/decode + Python mirror) + `/dev/ui-kit` + main app (`/`) integration + `ui-conventions.md` |

## 1. Definition of Done

- [ ] `src/ui/`: Button / Slider / Panel / BodyChip / TimeScrubber 5 컴포넌트.
- [ ] `src/share/`: `encodeShareState({ jdTdb, body, camera })` ↔ `decodeShareState(url)` URL round-trip.
- [ ] Python `orbitarium_tools.share` mirror — TS / Python decode 결과 동일.
- [ ] `/dev/ui-kit`: 5 컴포넌트 카탈로그.
- [ ] Main app `/`: SimulationClockProvider + body picker + time scrubber + camera mode 통합 (간단한 통합 — ScalePicker / OrbitsLine 등은 dev 페이지에 유지).
- [ ] format/lint/typecheck/test/build/e2e + Python 그린.
