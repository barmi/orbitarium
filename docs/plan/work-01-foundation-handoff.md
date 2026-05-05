# Work 1 — Handoff (Project Foundation)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-01-foundation.md`](work-01-foundation.md)

---

## 0. 현재 상태 (Status)

| 항목 | 값 |
|---|---|
| 현재 phase | **P0 (kickoff)** — phase 진입 전 |
| 다음 액션 | **P1 결정 라운드** (사용자 확정 → 결정 로그 기록 → 부트스트랩) |
| 마지막 갱신 | 2026-05-05 |
| 블로커 | 없음 |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-01-foundation.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [ ] **P1** — Tech Decisions & Repo Bootstrap
- [ ] **P2** — Quality Tooling
- [ ] **P3** — App Shell & Dev Routes
- [ ] **P4** — three.js Hello
- [ ] **P5** — Test Frameworks
- [ ] **P6** — Python Tooling Smoke
- [ ] **P7** — CI Pipeline Skeleton

## 2. 결정 로그 (Decision Log)

| # | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
|---|---|---|---|---|---|
| _empty — P1 시작 시 채움_ | | | | | |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정
- [ ] 패키지 매니저: **pnpm** (권장) / npm / bun
- [ ] 프레임워크: **React + react-three-fiber** (권장) / Vanilla TS + three.js
- [ ] React 사용 시 버전: 18 / 19
- [ ] Node 버전 락 (`.nvmrc` 또는 `.tool-versions`): **20 LTS** / 22

### P2에서 결정
- [ ] import 정렬: ESLint + simple-import-sort / Prettier 내장 / 수동
- [ ] pre-commit hook 도입 여부 (권장: 미도입)

### P3에서 결정
- [ ] 라우터: **React Router v6** / Wouter / TanStack Router
- [ ] 프로덕션 dev 제외 방식: env flag (권장) / 별도 entry

### P4에서 결정
- [ ] FPS 표시: 자체 구현 / `stats.js` / R3F 헬퍼

### P5에서 결정
- [ ] e2e: **Playwright** (권장) / Cypress
- [ ] DOM 환경: **happy-dom** (권장) / jsdom

### P6에서 결정
- [ ] Python venv 도구: **uv** (권장) / venv+pip / pyenv

### P7에서 결정
- [ ] e2e를 ci.yml에 포함 / 별도 workflow

### 추후 보류 (Work 1 범위 밖)
- 상태 관리 라이브러리 (Zustand / Jotai / RxJS) — Work 8 시점에 결정
- 백엔드 도입 여부 (CORS 프록시 / SPICE 처리) — Work 3 시점에 결정
- 호스팅 (Vercel / Cloudflare Pages / 자체) — Work 12

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록.
형식: 경로 + 한 줄 메모.

### P1 — Tech Decisions & Repo Bootstrap _(예정)_
- _phase 종료 시 채움_

### P2 — Quality Tooling _(예정)_
- _phase 종료 시 채움_

### P3 — App Shell & Dev Routes _(예정)_
- _phase 종료 시 채움_

### P4 — three.js Hello _(예정)_
- _phase 종료 시 채움_

### P5 — Test Frameworks _(예정)_
- _phase 종료 시 채움_

### P6 — Python Tooling Smoke _(예정)_
- _phase 종료 시 채움_

### P7 — CI Pipeline Skeleton _(예정)_
- _phase 종료 시 채움_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 다음 작업: P1 — Tech Decisions & Repo Bootstrap

**Step 1. 결정 라운드** (사용자와 함께)
§3 의 P1 항목 4개를 확정:
1. 패키지 매니저
2. 프레임워크 (R3F vs vanilla)
3. React 버전 (해당 시)
4. Node 버전

확정 즉시 §2 결정 로그에 4줄 추가.

**Step 2. 부트스트랩** (예시 — pnpm + React + R3F 가정)
```bash
# 프로젝트 루트에서
corepack enable                    # pnpm 활성 (Node 20+)
pnpm init
pnpm add react react-dom three @react-three/fiber
pnpm add -D vite typescript @types/node @types/react @types/react-dom @types/three @vitejs/plugin-react

# 설정 파일 작성: vite.config.ts, tsconfig.json, index.html, src/main.tsx
# .nvmrc 에 Node 버전 명시
# .editorconfig 추가
```

**Step 3. 검증**
```bash
pnpm dev      # localhost:5173 빈 페이지
pnpm build    # dist 생성
```

**Step 4. handoff 갱신**
- §0 현재 phase: P1 → 진행 중 / 완료
- §1 [x] P1
- §4 P1 산출물 채움
- §3 P1 항목 모두 [x]

### 빠른 검증 명령 (Work 1 전반)

```bash
# 프론트엔드
pnpm install
pnpm dev          # /         → 회전 sphere + FPS
                  # /dev/index → 카드 11개
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

# Python
cd tools/python
uv venv && source .venv/bin/activate     # 또는 python -m venv .venv && source .venv/bin/activate
uv pip install -e ".[dev]"               # 또는 pip install -e ".[dev]"
orbitarium-tools version
ruff check src tests
mypy src
pytest
```

## 6. 알려진 이슈 / 노트

- _발견 시 여기 추가_

## 7. 갱신 이력 (Changelog)

| 날짜 | 변경 |
|---|---|
| 2026-05-05 | 초기 작성 — P0 kickoff 진입 |

---

## Appendix A. Phase 마감 체크리스트 (Template)

각 phase를 [x]로 옮기기 전에 다음을 모두 확인:

1. [ ] [plan §3](work-01-foundation.md#3-phase-정의) 의 해당 phase Done 기준 모두 충족
2. [ ] §2 결정 로그에 phase 결정 사항 모두 기록
3. [ ] §3 해당 phase Open Questions 모두 [x] 처리
4. [ ] §4 해당 phase 산출물 인덱스 채움 (경로 + 한 줄 메모)
5. [ ] §0 현재 phase 갱신 (다음 phase로)
6. [ ] §7 갱신 이력에 한 줄 추가
7. [ ] (선택) 커밋 — 메시지 prefix `[work-01/p<N>]`
