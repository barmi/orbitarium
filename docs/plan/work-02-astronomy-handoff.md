# Work 2 — Handoff (Astronomy Foundations)

> **목적**: 진행 중인 phase 상태, 결정, 컨텍스트의 **단일 진실원(SoT)**.
> phase 종료 직후, 다음 phase 시작 전에 반드시 갱신.
> Plan 본체: [`work-02-astronomy.md`](work-02-astronomy.md)

---

## 0. 현재 상태 (Status)

| 항목 | 값 |
|---|---|
| 현재 phase | **P0 — Kickoff** (plan 작성 완료, P1 결정 라운드 대기) |
| 다음 액션 | **P1 — Constants & NAIF Catalog** 진입 — 4개 결정(상수 출처 / NAIF 범위 / 단위 brand / 모듈 분리) 확정 |
| 마지막 갱신 | 2026-05-05 |
| 블로커 | 없음 — Work 1 CI 그린 확인 완료, P1 진입 가능 |

## 1. 진행 체크리스트

각 phase의 Done 기준은 [plan §3](work-02-astronomy.md#3-phase-정의) 참조.
phase 마감 전, plan의 "Done" 모든 항목을 만족해야 [x] 가능.

- [ ] **P1** — Constants & NAIF Catalog
- [ ] **P2** — Time Systems
- [ ] **P3** — Reference Frames (Core)
- [ ] **P4** — IAU Rotation Model Foundation
- [ ] **P5** — Dev Demo `/dev/astro`
- [ ] **P6** — Cross-validation & Golden Fixtures (Closeout)

> Work 2 마감 = 모든 phase [x] + [plan §1 Definition of Done](work-02-astronomy.md#1-결과-정의-definition-of-done) 모든 항목 충족.

## 2. 결정 로그 (Decision Log)

| # | 항목 | 결정 | 이유 / 비고 | Phase | 결정일 |
|---|---|---|---|---|---|
| _아직 없음_ | | | | | |

> 기록 규칙: 결정 즉시 한 줄 추가. 번복 시 새 항목으로 추가하고 비고에 "supersedes #N" 명시.

## 3. 미결정 / 보류 (Open Questions)

### P1에서 결정
- [ ] 상수 출처 (IAU 2015 + DE440 정합 / IAU 2009 / 자체 정의)
- [ ] NAIF 카탈로그 범위 (Sun + 8행성 + Moon + 갈릴레이 4 + 토성 주요 5 / 더 많이 / 적게)
- [ ] 단위 안전 타입 (brand type / class wrapper / 무시)
- [ ] 상수 모듈 분리 정책 (단일 `constants.ts` / 카테고리별)

### P2에서 결정
- [ ] Leap second 처리 (정적 임베드 / IERS 동적 fetch)
- [ ] TDB-TT 모델 (Fairhead-Bretagnon 단순화 / IAU 2009 풀 / sin 근사)
- [ ] JD epoch 기준 시각 (TDB / TT)
- [ ] 톨러런스 (시간 1µs, TT-TAI 1ns)

### P3에서 결정
- [ ] 세차/장동 모델 (무시 J2000 고정 / IAU 2006/2000A 풀 / IAU 1976/1980 단순)
- [ ] ICRF↔EME2000 frame bias 적용 여부 (적용 / 무시)
- [ ] 회전 행렬 표현 (3×3 row-major `number[9]` / THREE.Matrix3 어댑터)
- [ ] 황도경사 ε 값 (IAU 2006 J2000 / IAU 1976)

### P4에서 결정
- [ ] IAU 회전 데이터 출처 (WGCCRE 2015 인라인 / spiceypy PCK 런타임 / 병행)
- [ ] 본 phase 검증 천체 (지구만 / 지구 + 달)

### P5에서 결정
- [ ] Dev Demo 구조 (단일 페이지 4 섹션 / 탭 분리)
- [ ] J2000 라이브 카운터 구현 (setInterval / requestAnimationFrame)

### P6에서 결정
- [ ] Fixture 형식 (JSON / JSONL / Parquet)
- [ ] Fixture 갱신 정책 (수동 / CI 자동)
- [ ] Diff 헬퍼 톨러런스 (시간 1µs / 각도 1mas / 거리 1mm)

### 추후 보류 (Work 2 범위 밖)
- TDB-TT 풀 모델 업그레이드 — Work 8/12 정밀도 요구에 따라
- 세차/장동 적용 — Work 7/8 시점 (보이저 시대 ↔ 미래 100년) 정밀도 요구에 따라
- IAU 회전 모델 전체 천체 데이터 — Work 6
- 천체 카탈로그 확장 (소행성, 혜성) — Work 7

## 4. 산출물 인덱스 (Artifacts)

phase 종료 시 생성·수정된 주요 파일을 기록. 형식: 경로 + 한 줄 메모.

### P1 — Constants & NAIF Catalog
_미시작_

### P2 — Time Systems
_미시작_

### P3 — Reference Frames (Core)
_미시작_

### P4 — IAU Rotation Model Foundation
_미시작_

### P5 — Dev Demo `/dev/astro`
_미시작_

### P6 — Cross-validation & Golden Fixtures (Closeout)
_미시작_

## 5. 다음 작업자에게 (For the Next Operator)

> 새 세션이나 다른 작업자가 이어 받을 때 여기를 먼저 본다.

### 즉시 액션: P1 — Constants & NAIF Catalog 진입

1. [plan §3 P1](work-02-astronomy.md#phase-1--constants--naif-catalog) 의 Decisions 4개 항목을 사용자와 결정 → §2 결정 로그에 기록
2. 디렉터리 생성: `src/astro/`, 파일 4개 (`constants.ts`, `naif.ts`, `units.ts`, `index.ts`)
3. Python 모듈 생성: `tools/python/src/orbitarium_tools/{constants.py, naif.py}`
   - astro extras 설치 필요: `cd tools/python && uv pip install -e ".[astro,dev]"`
4. 단위 테스트 (TS + pytest) — 상수 값 일치 검증
5. P1 마감: handoff §2/§3/§4/§7 갱신 → §0 "현재 phase = P2 진입 대기"

### Work 2 전체 진입 전 점검 (2026-05-05 시점)

- Work 1 CI 그린 ✓ (push 후 확인 완료, work-01 handoff §0 참조)
- `tools/python/.venv` 활성화 가능 ✓ (P6 구축)
- `/dev/index` 에서 Work 2 placeholder 카드 확인 가능 ✓ — P5 마감 시 "available"로 전환

### 주요 컨벤션 (Work 1에서 확정 — 그대로 적용)

```
TS 모듈 위치:
  도메인 코드는 src/<domain>/ — Work 2는 src/astro/ 신설
  dev 페이지는 src/dev/<work-name>/ — Work 2는 src/dev/astro/

Python 모듈:
  tools/python/src/orbitarium_tools/<name>.py — Work 2는 time/frames/constants/naif/rotation
  새 의존성은 pyproject.toml 의 적절한 extras 그룹에 등록 (astro/viz/notebook/dev/all)

테스트:
  단위:  tests/unit/<domain>/<name>.test.ts (vitest, happy-dom)
  e2e:   tests/e2e/<feature>.spec.ts (playwright, chromium)
  fixtures: tests/fixtures/work-NN/ (JSON, Python으로 생성)
  pytest: tools/python/tests/test_<name>.py

Dev 라우트:
  src/dev/registry.ts 의 entry 에 Component 채우면 자동 라우트화
  Work 2 entry slug: 'astro' (placeholder 이미 있음)
  prod 빌드에서 dev 코드 자동 제외 (P3 검증됨, VITE_ENABLE_DEV_ROUTES=true 로만 포함)

CI:
  .github/workflows/ci.yml 에서 lint/typecheck/test/build/e2e/ruff/mypy/pytest 자동 실행
  새 파일 추가는 자동으로 커버됨. 새 의존성은 pyproject.toml 또는 package.json 갱신 후 lockfile 동기화

커밋 prefix: [work-02/p<N>] <한국어 한 줄 요약>
```

### 빠른 검증 명령

```bash
# 프론트엔드
pnpm install
pnpm dev          # /dev/astro (P5 후 활성)
pnpm lint
pnpm typecheck
pnpm test         # vitest 단위
pnpm test:e2e     # playwright e2e
pnpm build

# Python (tools/python/)
cd tools/python
source .venv/bin/activate                  # 또는 uv run <cmd>
uv pip install -e ".[astro,dev]"           # P1 진입 시 astro extras 추가 필요
uv run orbitarium-tools version
uv run ruff check src tests
uv run mypy src
uv run pytest

# 골든 fixture 재생성 (P6 후)
cd tools/python
uv run orbitarium-tools fixtures --work=2 --out=../../tests/fixtures/work-02/
```

## 6. 알려진 이슈 / 노트

- **astro extras 미설치**: Work 1 P6에서는 `[dev]` extras만 설치. P1 진입 시 `uv pip install -e ".[astro,dev]"` 로 astropy/astroquery/spiceypy 추가 필요. 첫 실행 시 ~수백 MB 다운로드.
- **astropy 첫 import 시간**: ~1-2초 (지구 회전 데이터 로딩). pytest 첫 실행 느림. 이후 캐시됨.
- **spiceypy PCK 커널**: P4 reference에서 사용. 테스트 시 NAIF 사이트에서 PCK 다운로드 필요할 수 있음 (수 MB). 캐시 정책 P4 진입 시 결정.
- **leap second 갱신**: IERS Bulletin C 가 6월/12월에 갱신. P2의 정적 테이블도 동일 주기로 갱신 필요. 스케줄러는 Work 12 또는 별도 작업으로.
- **단위 brand type의 빌드 영향**: TypeScript phantom type은 런타임 코드 0 — 번들 크기 영향 없음. 단지 컴파일 타임 강제력만.
- **Work 1 알려진 이슈와 동일하게 적용**: Node 24 deprecation 경고는 이미 마이그레이션 완료. R3F THREE.Clock 경고는 자체 코드 영향 없음.

## 7. 갱신 이력 (Changelog)

| 날짜 | 변경 |
|---|---|
| 2026-05-05 | 초기 작성 — P0 kickoff. Plan 본체와 함께 6 phase 구조 확정. P1 결정 4건 대기. |

---

## Appendix A. Phase 마감 체크리스트 (Template)

각 phase를 [x]로 옮기기 전에 다음을 모두 확인:

1. [ ] [plan §3](work-02-astronomy.md#3-phase-정의) 의 해당 phase Done 기준 모두 충족
2. [ ] §2 결정 로그에 phase 결정 사항 모두 기록
3. [ ] §3 해당 phase Open Questions 모두 [x] 처리
4. [ ] §4 해당 phase 산출물 인덱스 채움 (경로 + 한 줄 메모)
5. [ ] §0 현재 phase 갱신 (다음 phase로)
6. [ ] §7 갱신 이력에 한 줄 추가
7. [ ] (선택) 커밋 — 메시지 prefix `[work-02/p<N>]`
