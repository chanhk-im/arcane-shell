<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# docs

## Purpose
The design spec package for Arcane Shell — 8 markdown documents plus 3 balance spreadsheets. This is the **authoritative source of game numbers and mechanics**. Code in `src/game/` must trace every formula/constant back to a specific section here; when a number in code and a number in these docs disagree, the `.xlsx` spreadsheets win (the `.md` summaries are rounded transcriptions).

## Key Files
| File | Description |
|------|-------------|
| `README_문서목록.md` | Index — recommended reading order and dependency graph between docs |
| `arcane_shell_master_spec.md` | **Read first.** Full system summary, confirmed numbers, content roadmap, open items |
| `arcane_shell_play_flow.md` | Content-unlock order and per-grade progression flow |
| `arcane_shell_content_design.md` | Detailed design for each of the 9 content systems (monster dex → recursive compile) |
| `arcane_shell_stats_summary.md` | The 5 core stats + every way to raise them (tree/parts/runes/dex) |
| `arcane_shell_script_api.md` | Automation script spec — combat API / resource API, with example code |
| `arcane_shell_ui_spec.md` | UI spec — layout, per-screen composition, color rules, shared components |
| `arcane_shell_monster_stats.xlsx` | 22-tier monster HP/defense/drop curve (source of truth) — parsed by `scripts/extract-xlsx.mjs` into `src/game/data/monsters.json` |
| `arcane_shell_tree_node_cost.xlsx` | 55-depth Arcana Tree cost curve (source of truth) — parsed into `src/game/data/treeNodes.json` |
| `arcane_shell_dps_model.xlsx` | Per-rank DPS / mana-uptime / pacing integrated model (final pacing verification sheet; not currently parsed into code) |

## For AI Agents

### Working In This Directory
- These are design documents, not code — do not "fix" numbers here to match code. If code and docs disagree, either the code has a bug or the docs need a deliberate, explicit update from the design owner.
- The three spreadsheets are **not live-linked** to each other or to the `.md` files — if you regenerate one, cross-check the others manually (see README's dependency note).
- When transcribing a value into a formula in `src/game/formulas/`, cite the doc + section in a comment next to it (existing code does this, e.g. `// stats_summary.md §1`).

### Testing Requirements
- N/A (no executable content). Sanity-check extraction changes via `npm run extract-xlsx`, which asserts known numeric anchors (see `scripts/AGENTS.md`).

### Common Patterns
- Section numbers (e.g. `§2-3`, `§8-6`) are referenced throughout `src/` comments — keep section numbering stable if editing these docs, or update the referencing code comments too.

## Dependencies

### Internal
- Consumed by `scripts/extract-xlsx.mjs` (spreadsheets → `src/game/data/*.json`) and cited throughout `src/game/formulas/`, `src/game/constants.ts`, `src/game/loop/offline.ts`.

<!-- MANUAL: -->
