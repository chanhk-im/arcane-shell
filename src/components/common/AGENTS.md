<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# common

## Purpose
Small, purely presentational components shared across multiple panels/screens — no store subscriptions, no game logic, just props → markup. Both files back their colors with CSS custom properties defined in `src/index.css`, keeping the color palette centrally themeable.

## Key Files
| File | Description |
|------|-------------|
| `ElementIcon.tsx` | Renders one of the 6 elements (화/수/뇌/지/성/암) as a colored dot + label, per `ui_spec` §5-3/§6. Colors come from `var(--el-*)` CSS variables, one per element. |
| `GradeBadge.tsx` | Renders a 1-5 mana-stone/rune/part/option grade badge (`G1`..`G5` + optional label), per `ui_spec` §5-4/§6. Colors come from `var(--grade-*)` CSS variables — this is the single shared 5-tier grade palette reused across mana stones, runes, parts, and options (per `helpContent.ts`'s `manastone` entry). |

## For AI Agents

### Working In This Directory
- Keep components here prop-driven and store-free — if a new shared component needs store data, fetch it in the parent (via a hook) and pass it down as props.
- Any new element- or grade-based visual indicator should reuse `ElementIcon`/`GradeBadge` rather than reimplementing the color mapping, so the palette stays centralized in `index.css`.

### Testing Requirements
- No tests (pure presentational); visually verify via `npm run dev` if changing colors or the badge/icon markup, since `src/index.css` is the actual source of the rendered colors.

### Common Patterns
- Both components map a numeric/enum key to a CSS variable string via a small `Record<K, string>` lookup table — follow this pattern for any new palette-driven indicator.

## Dependencies

### Internal
- `../../types/Element.ts` (`ElementIcon`); relies on CSS custom properties defined in `src/index.css`

### External
- React

<!-- MANUAL: -->
