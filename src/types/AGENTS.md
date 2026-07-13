<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# types

## Purpose
Shared TypeScript types for game data, decoupled from any single store or component so the same shape (e.g. `Skill`, `Monster`, `TargetInfo`) can be reused by stores, formulas, components, and the script sandbox's wire protocol without duplication. `any` is forbidden repo-wide (CLAUDE.md §4); this is where real types get defined instead.

## Key Files
| File | Description |
|------|-------------|
| `BigNum.ts` | Numeric alias per CLAUDE.md §2-5. Currently `type BigNum = number` (Milestone-1 values stay small), with `toBigNum`/`bnAdd`/`bnSub`/`bnMul`/`bnGte`/`bnToNumber` helpers so a future swap to a real big-number library only touches this file + `game/formulas/formatNumber.ts`. |
| `Element.ts` | The 6-element system (화/수/뇌/지/성/암), the 4-cycle + opposed-pair relationships, English ids, and skill-verb naming |
| `Monster.ts` | `MonsterData` (static per-tier data from the spreadsheet) and `MonsterInstance` (a live, fightable instance) |
| `PlayerStats.ts` | `CoreStats` (5 stats: spellPower/agility/manaPool/manaRegen/intelligence), `CORE_STAT_KEYS`, Korean labels, and `DerivedStats` (rune-only stats, Rank 6+, currently defaulted) |
| `Skill.ts` | `SpellInfo` (script-facing shape), `BuffEffect`, `SkillDef` (full internal definition extending `SpellInfo`) |
| `ScriptTypes.ts` | Script-sandbox-facing types: `CastResult`, `TargetInfo`, `ActiveBuff`, `ScriptErrorType`/`ScriptError` (+ `makeScriptError`), and the `ScriptCommand` union used on the Worker wire protocol |
| `TreeNode.ts` | `TreeNodeData` (static per-depth cost data), `UNLOCK_NODES` (the 12 feature-unlock depths), `TreeNodeState` (runtime level) |
| `js-interpreter.d.ts` | Hand-written ambient module declaration for the untyped `js-interpreter` npm package (only the surface actually used) |

## For AI Agents

### Working In This Directory
- New game data concepts get a type here first, then get consumed by `game/data/`, `stores/`, and `components/` — don't inline shape definitions elsewhere.
- Keep the split between a data type (e.g. `MonsterData`, static) and an instance/runtime type (e.g. `MonsterInstance`, live) where the domain has both — this mirrors how `game/data/monsters.ts` and `stores/useCombatStore.ts` already use them.
- `ScriptTypes.ts` types are part of the sandbox contract (`docs/arcane_shell_script_api.md`) — changing them means updating `game/script/prelude.ts`, `game/script/scriptHost.ts`'s dispatch table, and the doc together.

### Testing Requirements
- No direct tests (types only); correctness is enforced by `tsc --noEmit` (part of `npm run build`) and exercised transitively by every test elsewhere.

### Common Patterns
- Prefer `interface` for object shapes, `type` for unions/aliases; export any accompanying constant lookup tables (e.g. `ELEMENT_EN`, `CORE_STAT_LABEL`) alongside the type they describe.

## Dependencies

### Internal
- Consumed by nearly every other directory under `src/`; itself dependency-free except cross-references within `types/` (e.g. `Monster.ts` imports `Element.ts` and `BigNum.ts`).

### External
- `js-interpreter` (typed only, via `js-interpreter.d.ts`)

<!-- MANUAL: -->
