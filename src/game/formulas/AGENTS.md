<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# formulas

## Purpose
Pure calculation functions, 1:1 with the balance docs in `docs/` (CLAUDE.md §1-1/§2-3). This is the **only** place damage/cost/uptime math should live — components and stores import from here rather than reimplementing a formula.

## Key Files
| File | Description |
|------|-------------|
| `combat.ts` | Core combat math: `intMult`, `hitChance`, `critChance`, `atkSpeedMult` (all agility-driven, converging curves), `defenseMitigation`, `elementalModifier` (4-cycle + opposed pair), and `resolveDamage` (full per-cast resolution: hit → crit → damage → defense → element, with injected `hitRoll`/`critRoll` for pure testability) |
| `formatNumber.ts` | The shared number-display utility (CLAUDE.md §2-5) — **all rendered numbers must go through here** (`formatNumber` for K/M/B/T/Qa/Qi/Sx/Sp compact notation, `formatInt` for thousands-separated counts, `formatPercent`). Swapping `BigNum`'s backing implementation later only touches this file + `types/BigNum.ts`. |
| `manaUptime.ts` | `manaUptime(agility)` / `manaUptimeFromSpeed(speedMult)` — sustained-cast uptime, the mechanism that keeps mana/mana-regen stats relevant into the late game (settles ~67% as attack speed approaches its 3x cap) |
| `treeCost.ts` | Arcana Tree cost/stat-gain curve: `baseCost` (with the 1.5x unlock-node premium), `enhancementCost` (compounding +25%/level), `nodeStatGain`, plus `analyticBaseCost` — an analytic reconstruction of the spreadsheet curve kept purely for verification (unit-tested against the extracted JSON) |
| `formulas.test.ts` | Vitest coverage for the asymptotic combat curves, defense/elemental math, and the tree cost curve (including a spot-check that the analytic reconstruction matches `treeNodes.json`) |

## For AI Agents

### Working In This Directory
- Every function here must be pure — no store reads, no `Math.random()` calls (RNG is injected as a parameter, e.g. `resolveDamage(input, hitRoll, critRoll)`, so combat stays deterministically testable).
- Every constant/formula needs a doc citation comment (`// stats_summary.md §1`, `// master_spec.md §2-4`) — when you change a number, verify against the actual `.xlsx`/`.md` in `docs/`, not just internal consistency.
- If you introduce a new derived stat or curve, add it here (not inline in a component or store) and export it for both the relevant hook (`src/hooks/`) and `helpContent.ts` if it's player-facing.

### Testing Requirements
- Add/extend cases in `formulas.test.ts` for any new or changed formula, especially asymptotic bounds (converging curves should be tested near 0 and near a very large input like `1e9`) and any spreadsheet cross-check.

### Common Patterns
- Convergence-curve shape: `base + range × (stat / (stat + k))` — used by `hitChance`, `critChance`, `atkSpeedMult`. Follow this shape for new agility-scaled stats unless the docs specify otherwise.

## Dependencies

### Internal
- `../../types/Element.ts`, `../../types/BigNum.ts`, `../data/treeNodes.json` (via `treeCost.ts`), `../../types/TreeNode.ts`

### External
- None (pure TS + Vitest for tests)

<!-- MANUAL: -->
