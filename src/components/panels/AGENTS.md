<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# panels

## Purpose
Read-only / reference side-panel tab screens: the script API docs browser, the game-mechanics help viewer, and the monster codex. These are lower-frequency-update screens compared to `components/combat/` — mostly local `useState` for UI selection, not tick-driven store subscriptions.

## Key Files
| File | Description |
|------|-------------|
| `DocsPanel.tsx` | Browsable/searchable list of the script sandbox's actual whitelisted API (`ui_spec` §3-12). **The `DOCS` array here must exactly mirror `game/script/prelude.ts`'s whitelist — never document a function that doesn't exist in the prelude.** Has an "insert into editor" action that calls `useUIStore.requestDocsInsert`, which `ScriptView.tsx` picks up via an effect to jump to and populate the script tab. |
| `HelpPanel.tsx` | Renders `game/helpContent.ts`'s `HELP_ENTRIES` as a flat list (no accordion needed at 11 entries — see file comment); the same data backs the terminal `help [keyword]` command in `CommandInput.tsx`. |
| `MonsterDexPanel.tsx` | Read-only monster wiki (`ui_spec` §3-5): per-element accordion with an ASCII progress bar. "Progress" is redefined as unlocked-tier-count / total-tier-count (not kill-count, which isn't tracked) — a deliberate scope substitution, noted in the file's header comment. |

## For AI Agents

### Working In This Directory
- `DocsPanel.tsx`'s `DOCS` array is a **contract with the sandbox**, not just UI copy — if you add/remove/rename a script API method in `game/script/prelude.ts`, update this array in the same change, and vice versa.
- `HelpPanel.tsx` content should stay derived from `game/helpContent.ts` only — don't hardcode explanatory numbers directly in this component; add/edit the corresponding `HelpEntry` instead so the terminal `help` command and this panel never diverge.
- These panels favor flat/simple layouts over deep interactivity by explicit design choice at the current content scale (11 help entries, ~18 API docs) — if scope grows significantly (many more monster tiers, more nodes), CLAUDE.md §1-3 calls for reconsidering virtualization, but that's not needed yet.

### Testing Requirements
- No component tests; verify manually via `npm run dev` — especially that `DocsPanel`'s "insert into editor" correctly jumps to and populates the Script tab.

### Common Patterns
- Local `useState` for search/selection (not store state) — these are transient, panel-local UI concerns appropriate for component state rather than `useUIStore`.

## Dependencies

### Internal
- `../../stores/useUIStore.ts` (`DocsPanel`'s insert-request + tab switching), `../../game/helpContent.ts`, `../../game/data/monsters.ts`, `../../types/Element.ts`, `../common/ElementIcon.tsx`, `../common/GradeBadge.tsx`, `../../game/formulas/formatNumber.ts`

### External
- React

<!-- MANUAL: -->
