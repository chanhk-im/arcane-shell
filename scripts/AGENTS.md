<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# scripts

## Purpose
One-off Node.js maintenance scripts for the repo, run via `npm run <script>` (not part of the app runtime).

## Key Files
| File | Description |
|------|-------------|
| `extract-xlsx.mjs` | Parses `docs/arcane_shell_monster_stats.xlsx` and `docs/arcane_shell_tree_node_cost.xlsx` into `src/game/data/monsters.json` and `src/game/data/treeNodes.json`. Cross-checks a handful of known numeric anchors (e.g. tier-22 boss HP, grade-1 tree cost sum) before writing, and throws if they don't match. |

## For AI Agents

### Working In This Directory
- Run with `npm run extract-xlsx`. Re-run this whenever the source `.xlsx` files in `docs/` change — the generated JSON in `src/game/data/` is checked into the repo and not regenerated automatically.
- Column mapping is positional (`__EMPTY`, `__EMPTY_1`, ...) because the source sheets have merged/blank header cells — see the inline column-index comments before changing extraction logic, and re-verify against the raw sheet if the spreadsheet layout changes.
- The `ELEMENT_CYCLE` assignment in `extractMonsters()` is called out as a judgment call (the stat spreadsheet has no per-tier element column) — don't treat it as spec-derived.

### Testing Requirements
- The script's own `assert()` calls are its test — a failing sanity check throws and exits with a non-zero code (`process.exit(1)`). No separate test file.

### Common Patterns
- Pure extraction + a handful of hardcoded sanity anchors; no framework, ESM (`.mjs`) with `node:fs`/`node:url` built-ins and the `xlsx` package.

## Dependencies

### Internal
- Reads `docs/arcane_shell_monster_stats.xlsx`, `docs/arcane_shell_tree_node_cost.xlsx`
- Writes `src/game/data/monsters.json`, `src/game/data/treeNodes.json` (consumed by `src/game/data/monsters.ts` and `src/game/formulas/treeCost.ts`)

### External
- `xlsx` (SheetJS) — spreadsheet parsing

<!-- MANUAL: -->
