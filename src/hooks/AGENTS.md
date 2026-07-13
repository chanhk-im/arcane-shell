<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# hooks

## Purpose
The only layer allowed to call `useXStore(selector)` for component consumption (CLAUDE.md §1-2/§2-2). Wraps store selectors — including multi-field selectors via `useShallow` — and computes derived/view-model values so components stay declarative and never subscribe to a store directly.

## Key Files
| File | Description |
|------|-------------|
| `usePlayer.ts` | `useManaState()` (current/max/regen/ratio/uptime), `useCoreStats()`, `useIntMultiplier()`, `useResources()` (mana stones/gold/fame/rank/grade). Derived values computed inline, never stored. |
| `useCombat.ts` | `useTargetInfo()` (target + HP as a view model), `useCombatLog()`, `useSelectedTier()`, `useActiveBuffs()`, `useCooldowns()` |
| `useTree.ts` | `useTreeNodes()` — maps raw `TreeNodeState` + static `TreeNodeData` into a full `TreeNodeView` (affordability, locked/maxed flags, next cost) for the tree UI; `useBuyNode()` |
| `useScriptRunner.ts` | `useScriptRunner()` (source/running/console/memory + Worker support flag), `useScriptActions()` (source setter + `run`/`stop` wired to `scriptHost`) |

## For AI Agents

### Working In This Directory
- Name hooks `use<동사/명사>` per CLAUDE.md §1-2 (`useTargetInfo`, `useManaUptime`-style naming) and keep each hook scoped to one domain's view model.
- When a hook needs multiple fields from one store, use `useShallow` (see any hook here for the pattern) instead of multiple separate selector calls or a full-store subscription.
- Compute derived values (ratios, formatted view models) inside the hook, not in the component and not by storing them in Zustand.
- Hooks that start/stop an external system (the script Worker via `scriptHost`) expose imperative actions (`run`, `stop`) rather than reacting via `useEffect` inside the hook itself — the calling component's event handlers invoke them.

### Testing Requirements
- No dedicated hook tests currently; behavior is covered indirectly through `src/game/integration.test.ts` (store-level) and manual/UI testing. If adding tests, prefer testing the underlying store + formula rather than mounting a component just to exercise a hook.

### Common Patterns
- One hook per store per concern; components import only from here, never `import { useXStore } from '../stores/...'` directly for rendering.

## Dependencies

### Internal
- `../stores/` (selector source), `../game/formulas/`, `../game/targeting.ts`, `../game/script/scriptHost.ts`, `../types/`

### External
- `zustand/react/shallow`

<!-- MANUAL: -->
