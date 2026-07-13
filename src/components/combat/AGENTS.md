<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# combat

## Purpose
Leaf UI components for the combat terminal-column layout (target panel + skill bar above, scrolling combat log below) and the wizard stats panel. These subscribe to `useCombatStore`/`usePlayerStore` at high tick frequency, so per CLAUDE.md §2-2 they're kept as small, deep leaves to minimize re-render scope.

## Key Files
| File | Description |
|------|-------------|
| `TargetPanel.tsx` | Tier-select tabs (1..`MAX_TIER_MILESTONE_1`, last one marked boss) + current target HP bar. Subscribes only to `useTargetInfo()` + `useSelectedTier()` (CLAUDE.md §2-2 leaf-only subscription). |
| `SkillBar.tsx` | Deal-skill buttons (`manualCast`) + buff buttons showing cooldown/active state via `useCooldowns()`/`useActiveBuffs()`. |
| `StatsPanel.tsx` | "Wizard" tab: the 5 core stats plus derived values (int multiplier, hit/crit/atkspeed, mana uptime) — deliberately does not repeat mana gauge/resources already shown in `TopBar` (see file header comment). |
| `CombatLogPanel.tsx` | Scrolling terminal log, auto-scrolls to newest via a DOM-sync `useEffect` (appropriate use per CLAUDE.md §1-4 — this is external-system/DOM sync, not derived state). Renders `useCombatLog()`, which is already capped at 200 entries by the store. |

## For AI Agents

### Working In This Directory
- These components are the ones most exposed to per-tick re-renders (mana/HP/buff timers) — keep new components here narrowly subscribed via hooks from `src/hooks/useCombat.ts` / `usePlayer.ts`, never a broad store subscription.
- Auto-scroll-on-new-content (`CombatLogPanel`'s pattern) is the canonical example of a legitimate `useEffect` here — it's syncing the DOM scroll position to an external target, not deriving render state.
- All damage/HP/stat numbers must be formatted via `game/formulas/formatNumber.ts`, and any displayed derived stat (crit%, hit%, uptime) must come from `game/formulas/combat.ts` / `manaUptime.ts` — no inline math.

### Testing Requirements
- No component tests exist; verify with `npm run dev` by casting skills and confirming target HP/log/cooldowns update as expected, and that the log stays capped after >200 entries.

### Common Patterns
- Korean labels + `ui_spec §N` citation comments, consistent with the rest of `components/`.

## Dependencies

### Internal
- `../../hooks/useCombat.ts`, `../../hooks/usePlayer.ts`, `../../game/combatEngine.ts` (`manualCast`), `../../game/data/skills.ts`, `../../game/data/monsters.ts` (`MAX_TIER_MILESTONE_1`), `../../game/formulas/`, `../../stores/useCombatStore.ts` (tier selection action), `../../types/PlayerStats.ts`

### External
- React

<!-- MANUAL: -->
