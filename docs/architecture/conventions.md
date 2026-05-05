# Coding Conventions

> 짧고 변화에 둔한 규칙만. 도구로 자동 강제 가능한 항목은 ESLint/Prettier로 위임.

## TypeScript

- `strict: true` 기본. `noUncheckedIndexedAccess` / `noImplicitOverride` 추가 ON.
- `any` 사용 금지. 정 안 되면 `unknown` 후 좁히기. 외부 라이브러리 타입이 약하면 보조 타입 정의(`src/types/`).
- 타입 선언 우선순위: 기존 외부 타입 재사용 → `interface`(객체 모양 + 확장) → `type`(유니온/인터섹션/매핑).
- 가능하면 `as const` (리터럴 보존). 매직 넘버는 명명 상수.

## 모듈 / Import

- `@/*` → `./src/*` path alias 사용. 상대 경로(`../../..`)가 3단계 이상이면 alias로.
- 정렬은 simple-import-sort가 자동: 외부 패키지 → `@/` 내부 → 상대 → 사이드 이펙트(스타일 등).
- 한 파일 단일 책임. 거대해지면 같은 디렉터리에 분리.

## 네이밍

- 파일: TS 모듈 `camelCase.ts`, React 컴포넌트 `PascalCase.tsx`.
- 함수/변수: `camelCase`. 타입/인터페이스/Enum: `PascalCase`. 상수: `UPPER_SNAKE_CASE`.
- 부울 변수/함수: `is...` / `has...` / `can...` 접두.
- 단위 변환 함수: `<from>To<To>` (e.g., `auToM`, `degToRad`, `mToScene`).

## 주석

- 기본은 **주석 없음**. 코드가 자명하면 주석 불필요.
- WHY가 비자명할 때만 주석: 제약, 미묘한 invariant, 우회, 놀라운 동작.
- WHAT은 잘 명명된 식별자가 설명. 호출처/태스크 번호/PR 번호 언급 금지.
- JSDoc은 외부 노출 API(라이브러리화될 모듈)에만 간단히.

## React / R3F

- 함수 컴포넌트 + 훅. 클래스 사용 금지.
- props 타입은 동일 파일에 `interface Props { ... }`.
- `useMemo` / `useCallback` 은 측정 후 도입. 불필요한 메모이제이션 금지.
- R3F: `useFrame` 안에서 setState 금지(루프 폭발). THREE 인스턴스는 `useRef`.
- side effect는 `useEffect` 안에. cleanup 누락 금지.

## 단위 / 좌표

본 프로젝트는 **Truth vs Display 분리** 원칙을 코드 구조에 반영한다 ([overview.md §2](../plan/overview.md#2-핵심-원칙-core-principles)).

- **계산 (truth 레이어)**: SI 단위 — meters / seconds / radians / kg.
- **표시 옵션**: AU / degrees / km/s 등은 변환 함수로 명시 변환.
- **장면 좌표 (display 레이어)**: Truth → 스케일 정책 → 장면 좌표 (Work 4 Scale System).
- 렌더 코드에서 SI 값을 직접 곱하지 말 것. 항상 명시적 변환 함수.
- 시간: 표시는 UTC, 계산은 TDB. `JulianDate` 타입을 통해 전달.
- 좌표계: 데이터/함수 시그니처에 reference frame 명시 (`PositionICRF`, `PositionEclipticJ2000` 등).

## 디렉터리 컨벤션

- `src/astro/` — 시간/좌표/상수 (Work 2)
- `src/ephemeris/` — Horizons/DE440 데이터 레이어 (Work 3)
- `src/scale/` — 스케일 정책 (Work 4)
- `src/render/` — three.js / R3F (Work 5+)
- `src/dev/` — `/dev/*` 라우트 페이지 (P3 부터)
- `src/routes/` — 메인 앱 라우트
- `src/ui/` — UI 컴포넌트 (Work 10)
- `src/types/` — 공유 타입
- `src/utils/` — 작은 유틸 (의심스러우면 도메인 폴더에 넣기)

## 커밋

- 메시지 prefix는 phase 단위: `[work-NN/p<M>]`. 예: `[work-01/p2] add eslint flat config`.
- 본문은 한 단락 이내, 의도/제약 위주. 코드의 WHAT은 diff가 설명.

## 이외

- 파일 헤더(라이선스/저작권) 없음.
- TODO/FIXME 주석은 Issue/handoff 문서로 이전.
- 죽은 코드는 즉시 삭제 (git이 기억).
