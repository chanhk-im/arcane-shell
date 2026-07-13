<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# arcane-shell

## Purpose
Arcane Shell is a CLI-terminal-styled, tick-based incremental/idle wizard game built with React 18 + Vite + TypeScript + Zustand. The player casts spells against tiered monsters, invests mana stones into a 55-depth "Arcana Tree", and can automate play by writing JavaScript run inside a sandboxed Web Worker. Game design is fully spec'd in `docs/` (8-document package); this repo is the implementation, currently at Milestone 1 (Rank 0-1 slice: 5 monster tiers, tree depths 1-10, 6 elemental deal skills + 3 buffs, script sandbox).

## Key Files
| File | Description |
|------|-------------|
| `package.json` | Scripts: `dev`, `build` (tsc + vite build), `test` (vitest), `extract-xlsx` |
| `vite.config.ts` | Sets COOP/COEP headers (required for `SharedArrayBuffer`, used by the script sandbox bridge) |
| `tsconfig.json` / `tsconfig.node.json` | Strict TypeScript config |
| `index.html` | Vite entry HTML |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `docs/` | Design spec package (master spec, UI spec, script API spec, balance spreadsheets) — the source of truth for game numbers (see `docs/AGENTS.md`) |
| `scripts/` | One-off Node scripts, e.g. the xlsx→JSON balance extractor (see `scripts/AGENTS.md`) |
| `src/` | Application source (see `src/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Read `CLAUDE.md` (Korean) first — it is the authoritative, hard-enforced development doctrine for this repo (component rules, Zustand store-splitting, selector discipline, big-number handling, script-sandbox constraints). This root `AGENTS.md` mirrors the same content below for non-Claude agents (e.g. Codex) and is kept in sync with `CLAUDE.md`.
- This is a **tick-based idle game**: state updates ≥1/sec even off-screen. Never subscribe a component to a whole Zustand store; always use a selector (see `src/stores/AGENTS.md`).
- Late-game numbers can exceed `Number.MAX_SAFE_INTEGER` — route all large-number handling through `src/types/BigNum.ts` and `src/game/formulas/formatNumber.ts`.
- Balance numbers (damage coefficients, tree costs, mana costs) must never be hardcoded inline — they belong in `src/game/formulas/` or `src/game/data/` and must trace back to a specific section of a doc in `docs/` (see comments in existing formula files for the citation style, e.g. `// stats_summary.md §1`).

### Testing Requirements
- `npm test` runs Vitest (`*.test.ts` colocated with source, e.g. `src/game/formulas/formulas.test.ts`, `src/game/integration.test.ts`, `src/game/script/sandbox.test.ts`)
- `npm run build` (`tsc --noEmit && vite build`) must pass — strict TypeScript, no `any`

### Common Patterns
- Pure calculation lives in `src/game/formulas/`; components only import and display.
- The script sandbox never exposes stores directly — only a whitelisted API surface (`src/game/script/prelude.ts` + `scriptHost.ts` dispatch table).

## Dependencies

### External
- React 18, react-dom, react-router-dom 6 — UI
- zustand 4 (+ `zustand/middleware` persist, `zustand/react/shallow`) — state
- js-interpreter — AST-walking JS interpreter used for the script sandbox (no `eval`/`new Function`)
- vitest, jsdom — testing
- xlsx — parses the balance spreadsheets in `docs/` via `scripts/extract-xlsx.mjs`

<!-- MANUAL: Original project development principles (Korean) preserved below. Keep in sync with CLAUDE.md at the repo root. -->

# AGENTS.md — Arcane Shell (React)

이 문서는 Codex가 이 저장소에서 작업할 때 따라야 할 개발 원칙입니다. 게임 설계 자체는 `docs/arcane_shell_master_spec.md` 등 설계 문서 패키지를 참조하세요.

## 기술 스택

- React 18 + Vite + TypeScript (strict mode)
- Zustand (상태관리)
- React Router v6

## 0. 이 프로젝트의 특수성 (원칙을 이해하기 위한 전제)

- **틱 기반 방치형 게임**입니다. 초당 1회 이상 상태가 갱신되고, 오프 화면에서도 진행됩니다. → 리렌더링 비용에 민감
- **후반 수치가 10^9 이상까지 커집니다** (몬스터 HP, 트리 비용 등). → 표준 `number`의 정밀도 한계를 넘길 수 있음
- **스크립트(자동화)는 유저가 작성한 코드를 실행**합니다. → 무한루프/악성 패턴에 안전하게 격리해야 함

이 세 가지가 아래 모든 원칙의 근거입니다.

---

## 1. React 개발 원칙

### 1-1. 컴포넌트
- **함수형 컴포넌트만 사용**, 클래스 컴포넌트 금지
- 컴포넌트는 "화면에 뭘 그릴지"만 담당. 계산 로직(데미지 공식, 비용 곡선 등)은 `src/game/` 하위 순수 함수로 분리하고 컴포넌트에서 임포트만
- 하나의 컴포넌트 파일은 200줄을 넘기지 않는 걸 기준으로 삼고, 넘으면 하위 컴포넌트나 커스텀 훅으로 분리
- Props에 `any` 금지 — 게임 데이터 타입(스킬, 몬스터, 노드 등)은 `src/types/`에 정의하고 재사용

### 1-2. 커스텀 훅
- 반복되는 로직(예: "현재 타겟의 남은 HP% 구독", "가동률 계산")은 커스텀 훅으로 추출
- 훅 이름은 `use동사/명사` 형태 유지 (`useTargetInfo`, `useManaUptime` 등)
- 훅 내부에서 Zustand selector를 직접 쓰고, 컴포넌트는 훅의 반환값만 사용 — 컴포넌트가 스토어를 직접 구독하지 않는 걸 원칙으로

### 1-3. 리스트 렌더링
- 몬스터 도감(22), 아르카나 트리 노드(55), 로그 등 **긴 리스트를 그릴 때는 가상화(react-window 등) 우선 검토**
- CLI 터미널 로그처럼 계속 누적되는 리스트는 **상한을 두고 오래된 항목을 제거** (예: 최근 200줄만 유지) — 무한 누적 절대 금지

### 1-4. 사이드 이펙트
- `useEffect`는 "외부 시스템과의 동기화"에만 사용 (예: 스크립트 워커 시작/정지). 상태 파생 계산에 `useEffect` 쓰지 말 것 — `useMemo`나 selector로 해결
- 틱 루프(게임 시간 진행)는 컴포넌트의 `useEffect`가 아니라 **스토어 바깥의 독립된 game loop 모듈**에서 돌리고, 스토어는 그 결과만 반영

---

## 2. 상태관리 (Zustand)

### 2-1. 스토어 분리 원칙
하나의 거대한 스토어 금지. 아래처럼 도메인별로 분리:

```
usePlayerStore    — 스탯, 마나, 골드, 명성
useTreeStore      — 아르카나 트리 노드 상태
useInventoryStore — 부품/룬/유물 보유 목록
useCombatStore    — 현재 타겟, 전투 로그
useScriptStore    — 스크립트 코드, 실행 상태, 메모리 사용량
useUIStore        — 모달, 탭 선택 등 UI 전용 상태 (게임 로직과 절대 섞지 않음)
```

**UI 전용 상태(모달 열림, 탭 선택 등)는 게임 상태 스토어에 넣지 않습니다.** 로컬 `useState`나 별도 `useUIStore`로 분리 — 안 그러면 게임 로직 저장/로드 시 불필요한 UI 상태까지 같이 다루게 됨.

### 2-2. Selector 사용 규칙
- 컴포넌트에서 스토어를 구독할 때 **항상 필요한 필드만 selector로 뽑아서 사용**
  ```ts
  // ❌ 전체 구독 — 스토어의 아무 필드나 바뀌어도 리렌더
  const store = usePlayerStore();

  // ✅ 필요한 값만
  const mana = usePlayerStore((s) => s.mana);
  ```
- 여러 필드가 필요하면 `useShallow`(zustand/shallow)로 얕은 비교 적용
- 틱마다 갱신되는 필드(마나, HP% 등)를 구독하는 컴포넌트는 최대한 트리 말단(leaf)에 위치시켜서, 리렌더 범위를 좁게 유지

### 2-3. 파생 값(computed)
- "지능배율", "가동률" 같은 파생 값은 스토어에 저장하지 않고 **selector 함수 또는 훅에서 매번 계산**
- 계산 비용이 크면(예: 전체 DPS 재계산) `useMemo`로 캐싱하되, 의존성 배열을 명확히 지정
- 계산 공식 자체는 스토어/컴포넌트가 아니라 `src/game/formulas/`에 순수 함수로 둬서, 밸런스 스프레드시트 값과 1:1로 대응되게 유지 (예: `calcCritMultiplier(agility)`)

### 2-4. 영속성(저장)
- `zustand/middleware`의 `persist` 사용
- **틱마다 저장하지 말 것** — debounce(예: 5~10초 간격) 또는 특정 이벤트(랭크업, 페이지 이탈) 시점에만 저장
- 오프라인 보상 계산(마지막 접속시각 기준 정산)은 저장된 timestamp를 로드 시점에 한 번만 계산 — 매 틱 계산 금지

### 2-5. 큰 숫자 처리
- 몬스터 HP, 트리 비용 등은 후반부 `Number.MAX_SAFE_INTEGER` 근접/초과 가능 → **BigNumber 라이브러리(break_infinity.js 등) 도입 검토**, 최소한 표시 로직(`formatNumber`)은 초반부터 통일된 유틸로 분리해서 나중에 교체 쉽게 유지
- 스토어에 큰 숫자를 저장할 때 타입을 `number`로 고정하지 말고 `src/types/BigNum.ts` 같은 별칭 타입으로 감싸서, 나중에 실제 구현체를 바꿔도 호출부 영향 최소화

---

## 3. 스크립트 시스템 (자동화) 관련 제약

- 유저 스크립트는 **반드시 Web Worker에서 실행** — 메인 스레드 블로킹 방지, 무한루프가 UI를 멈추지 않도록 격리
- 워커와 메인 스레드 통신은 `postMessage` 기반, 스크립트가 접근 가능한 API(`전투 API`, `자원 API`)만 명시적으로 브릿지 — 워커에 전체 스토어를 노출하지 않음
- 스크립트 실행 시간/스텝 수 상한을 두고 초과 시 강제 종료 (설계 문서의 "에러 시 즉시 종료" 원칙과 동일하게 처리)
- `eval`이나 `new Function`으로 직접 실행하지 말고, 사전에 허용된 함수 화이트리스트만 노출하는 샌드박스 방식 사용

---

## 4. 금지 사항 (Hard Rules)

- `any` 타입 금지 (부득이한 경우 `unknown` + 타입가드)
- 클래스 컴포넌트 금지
- 스토어 전체 구독(`useXStore()`) 금지 — 항상 selector
- `useEffect`로 파생 상태 계산 금지
- 인라인에서 게임 밸런스 수치(데미지 배율, 비용 상수 등) 하드코딩 금지 — 전부 `src/game/formulas/` 또는 설정 파일로
- 틱마다 `localStorage` 직접 쓰기 금지
- 유저 스크립트를 메인 스레드에서 직접 `eval` 금지

## 5. 폴더 구조 (제안)

```
docs/             # 문서
src/
  game/
    formulas/     # 순수 계산 함수 (밸런스 스프레드시트와 1:1 대응)
    loop/         # 틱 루프, 오프라인 정산
    script/       # 스크립트 워커 브릿지, API 노출부
  stores/         # Zustand 스토어 (도메인별 분리)
  components/     # UI 컴포넌트
  hooks/          # 커스텀 훅
  types/          # 공용 타입 정의
```

## 6. 참고

- 밸런스 수치의 원본은 이 저장소가 아니라 설계 문서 패키지(`docs/arcane_shell_dps_model.xlsx` 등)입니다. 수치를 코드에 옮길 때는 반드시 해당 스프레드시트 값과 대조하고, 값이 달라지면 공식 함수 옆에 어느 문서 기준인지 주석으로 남기세요.
