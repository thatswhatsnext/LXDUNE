# Handoff: Leaf litter plate on Under the leaf litter

**Reviewed and signed off by:** Steve Grant, 2026-10-05 (draft A, after two rounds of changes)

**Branch:** `feature/fieldwork-leaf-litter-plate` (already pushed). It is stacked on `feature/fieldwork-adi-design` at `7afd44a` (after item 49), because both rebuild `play/index.html`.

## Goal

Under the leaf litter (`adi-1-leaf-litter`) gets a lesson plate on its first item, as The Willow Problem has. The plate shows the opening prediction without words or numbers:
- **Left:** two pitfall traps in cross-section; the sunny, mown oval edge has a cup crowded with ants of one kind.
- **Right:** a gum in leaf litter has a cup with one each of six kinds (ant, beetle, slater, spider, centipede, springtail).

Each kind has its own shape and colour. The gum's canopy is about 80% green, with the rest in the gold and brown of the litter below. The plate doesn't say which site is more diverse, so it doesn't give the prediction away.

## Order

Apply `2026-10-05-fieldwork-adi-design.md` first. This handoff's patch is a diff of `tools/reckoner/` against that branch (unchanged by item 49, so it applies at `c632975` or `7afd44a`). Releasing `feature/fieldwork-leaf-litter-plate` releases both, so one `/ship` of this branch is enough.

## Scope

- **Changes:** `tools/reckoner/templates/game.js`, `tools/reckoner/templates/game.html`, `tools/reckoner/scripts/test-game.ts`; then the generated `play/index.html`; `docs/ACTION-PLAN.md`.
- **Must not change:** lesson YAML (no version bumps: plates live in the template, keyed by lesson id), guides, `app.html`/`app.js`, `reckoner/`, storage keys.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-05-leaf-litter-plate.patch` (alongside this handoff) | applied from the repo root | The three source changes below, as a `git diff` against `feature/fieldwork-adi-design` |

## Changes

1. **`game.js`, `PLATES`:** a new entry `"adi-1-leaf-litter"`, an inline SVG with the same `viewBox` as the willow plate (`0 0 350 190`). It carries its own `<defs>` (ids prefixed `ll-`), contains no `<text>`, and has a full `aria-label` describing both traps and the six kinds.
2. **`game.html`, tokens:** two new plate tokens in all three theme blocks: `--plate-grey` (`#6E7A80` light, `#A3AFB5` dark) for the slater, and `--plate-rust` (`#B5562B` light, `#D98A63` dark) for the spider. Every other colour reuses the existing `--plate-*` tokens.
3. **`game.html`, styles:** `.ll-*` classes after the existing `.pl-*` plate rules.
4. **`test-game.ts`:** the plate test also checks that `adi-1-leaf-litter` shows a plate on its first item and not its second, and that the plate has no text and has a description. The test name changes to cover both plates.

## Expected results

- Published lessons 16, guides 6, examples 58: unchanged. No version bumps.
- Build tests 20, game tests 22, all passing.
- validate, test, typecheck, check:pages and check:regressions pass. Checked in a browser at 375 px in light and dark.

## Commits

1. `feat(game): leaf litter plate on Under the leaf litter`
2. `chore(pages): publish`, plus the action plan

## Action plan

Next item (after item 49): **Leaf litter plate**. Record Steve's sign-off (draft A of two; sun rays all the way round; a fuller canopy, about 80% green and 20% leaf-fall colours; no text or numbers). Close the `adi-1-leaf-litter` plate item carried from item 47. Item 46's plate list still has Cells under the lens and the POE path.

## Open questions for review

None.
