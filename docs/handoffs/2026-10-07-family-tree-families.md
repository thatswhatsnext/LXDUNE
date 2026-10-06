# Handoff: Family Tree families

**Reviewed and signed off by:** Steve Grant, 2026-10-04 (the groupings, as open question 1 of
`2026-10-04-field-guide-redesign.md`). The six family summaries are new wording and are **not yet signed
off**, so `families.yaml` lands as a draft (see Open questions).

**Branch:** `feature/family-tree-families` (pushed; based on `dev` at `a12b16a`, whose `tools/reckoner/` matches
`main` at `2be6ebf`). The source changes are in `2026-10-07-family-tree-families.patch` alongside this file.

## Goal

The Family Tree gets its families. Opening the tab shows the models grouped by the idea about learning they
share (Learning cycles; Conceptual change; Argument and writing; Reasoning; Problems, projects and issues;
Levels of inquiry across every branch), with a **Group by: Family | Scale** switch back to the current scale
bands. A model's card names its family and links to the rest of it. This closes item 46's open item on the
Family Tree families.

## Scope

- **Changes:** `tools/reckoner/content/families.yaml` (new), `tools/reckoner/src/schema/families.ts` (new),
  `tools/reckoner/scripts/validate.ts`, `tools/reckoner/scripts/lib/build.ts`,
  `tools/reckoner/templates/app.js`, `tools/reckoner/templates/app.html`,
  `tools/reckoner/scripts/test-rules.ts`, `tools/reckoner/scripts/test-build.ts`, and the generated
  `reckoner/app.js` and `reckoner/index.html`.
- **Must not change:** any guide YAML, `catalogue.json`, `questions.json`, `methodology.yaml`, game lessons,
  `play/`, `reckoner/data/` (byte-identical while families are a draft), scoring, rule texts and their hash,
  tab and panel ids, URL paths, storage keys, `moodle-blocks/`.

## Design decision: a families file, not a field on each model

Item 46 said the families need "a new optional field". This handoff uses one content file instead. A family
is a relation between models, like the Family Tree itself, so it lives in one place:

- regrouping a model is one line, with no guide version bumps and no edits to six guides and the catalogue;
- `validate` can check the whole grouping at once: every model in `MODEL_REGISTRY` in exactly one family,
  every family member registered, so a model can never drop out of the Family Tree;
- it follows the methodology pattern: its own schema, `status`, provenance and review, and it reaches
  students only once published.

## New files

| File | Goes to | What it is |
|---|---|---|
| `families.yaml` | `tools/reckoner/content/families.yaml` | Six families, all 15 models, draft v1.0.0 |
| `families.ts` | `tools/reckoner/src/schema/families.ts` | Zod schema: unique family ids, each model once, one `across` family and it goes last, published needs a reviewer and a reviewed source |

`families.yaml`, as it lands (models in the order Steve approved, which is the order the Family Tree shows):

| Family (`id`) | Models | Summary (for review) |
|---|---|---|
| Learning cycles (`learning-cycles`) | Learning cycle, 5E, 7E | Experience comes first, then the term, then using it. 5E and 7E grew out of the original Learning cycle. |
| Conceptual change (`conceptual-change`) | Generative Learning Model, Interactive Approach, Predict–Observe–Explain | Start from what students already think, test it against evidence, and give them good reason to change their minds. |
| Argument and writing (`argument-and-writing`) | Science Writing Heuristic, Argument-Driven Inquiry | Students build claims from evidence and sharpen them by arguing, writing and reviewing each other’s work. |
| Reasoning (`reasoning`) | CASE (Thinking Science) | Lessons designed to stretch how students reason, not only what they know. |
| Problems, projects and issues (`problems-projects-issues`) | Problem-based learning, Project-based science, Engineering design cycle, SSI-based teaching, Ambitious Science Teaching | Learning organised around a problem to solve, a product to make or an issue to decide, where science is the means. |
| Across every branch (`across`, `across: true`) | Levels of inquiry | Not a family of its own. Levels of inquiry sets how much you specify, inside any model above. |

## Changes to existing files

### 1. `scripts/validate.ts`: validate `families.yaml`

Parse it with `Families`; a missing file is an error, as for `methodology.yaml`. New exported
`checkFamilies(families, registry)` reports a registered model in no family ("would drop out of the Family
Tree") and a family member not in `MODEL_REGISTRY`. Prints
`✓ families.yaml  (draft, v1.0.0; 6 families, all 15 models placed once)`.

### 2. `scripts/lib/build.ts`: load families; publish them only once reviewed

`loadFamilies(contentDir)` beside `loadMethodology`. `families` joins the shared data only when its status is
`published`, or in a review copy; otherwise the build logs `! skipping families: status is draft`. The models
list is unchanged: the page looks a model's family up from `DATA.families`.

### 3. `templates/app.html`: hooks and styles

- `id="mapIntro"` on the Family Tree intro; a new `<div class="density map-view" id="mapView" role="group"
  aria-label="Group the models">` above the legend (hidden while empty); `id="stepLearnLine"` on home
  step 1's line.
- Styles: `.map-key`, `.skey` (scale swatches in the existing `--macro`, `--meso`, `--micro`, `--dial`
  colours), `.map-view`, `.tile-scale`, `.fam-line`, `.fam-kin`. Group by buttons and Same family pills are
  at least 44 px tall.

### 4. `templates/app.js`: the Family Tree (replaces the model map section)

With published families:

- The tab opens on **Group by: Family**. One band per family in the file's order, heading = family name,
  note = summary; tiles in the family's listed order. The across family comes last, with the cap "Applies
  inside any of them".
- Tiles keep the scale-coloured left edge. Their foot shows the scale (icon and Unit / Routine / One
  lesson / Dial, with the full scale label for screen readers) instead of the phase count, and the legend
  adds a scale key ("Edge colour shows scale:"), so scale never rests on colour alone.
- **Scale** shows today's four bands exactly as now (phase counts, guides first).
- The selected model's card adds "Family: <name>. <summary>" (just "Family." for the across family) and
  **Same family** pills that open each relative.
- The intro reads "Every model in the Reckoner, grouped into families by the idea about learning they
  share. Switch to scale to see how they nest: …", and home step 1 reads "Where each model comes from and
  how they fit inside each other", as item 46 planned.

Without published families nothing changes: no Group by control, the scale bands, the old intro and step line.
The view choice is held in memory only (no new storage key).

### 5. Tests

- `test-rules.ts`: six new cases (a model in two families, a duplicate family id, the across family not
  last, publishing unreviewed families, a model in no family, an unregistered family member) and
  "unmodified families place every model once".
- `test-build.ts`: one new case. With a draft copy: no `families` in the site manifest, in the review copy,
  no Group by control, scale bands, step 1 unchanged. Published: families in the manifest; the tab opens on
  Family; band order matches the file; 15 tiles, each model once; four scale swatches; Levels of inquiry
  last with its cap; Scale shows the four bands with no scale key; 5E's card names Learning cycles with
  Same family Learning cycle and 7E; the 7E pill opens 7E.

**Version bumps:** none. No guide, lesson or methodology changes; `families.yaml` starts at 1.0.0.

## Expected results

- Models 15, guides 6, examples 58, worked sequences 20, focus areas 16 / 0 / 0, game lessons 16: unchanged.
- Rule checks +7; build tests 20 → 21; game tests 22.
- `reckoner/data/` byte-identical to `main`; only `reckoner/app.js` and `reckoner/index.html` change.
- Validate, test, typecheck, check:pages and check:regressions (against `origin/main`) pass.
- Checked in Chromium at 360 px (light and dark) and 1200 px with families published in a preview: no
  sideways scroll, every Group by button, tile and Same family pill at least 44 px tall.

## Commits

On the pushed branch:

1. `feat(reckoner): Family Tree families (draft until reviewed)`: schema, content, validate, build,
   templates, tests.
2. `chore(pages): publish`: the regenerated `reckoner/`.
3. `docs(handoffs): Family Tree families`: this handoff and its patch.

To add when applying: `docs(action-plan): <next item>, Family Tree families`.

## Action plan

Next item: record the families file and the Family Tree's Family | Scale view, the design decision above, and
these open items:

- Publish `families.yaml` once Steve signs off the summaries: set `status: published`,
  `source: ai-drafted-reviewed`, `reviewedBy: ['Steve Grant']`, `reviewedOn`, update `lastReviewed`, and
  republish. Until then students see the Family Tree as it is today.
- Close item 46's open item on the Family Tree families.
- Item 46's other open item (ask the next cohort about the names) is unchanged.

## Open questions for review

1. **The six summaries.** They are Claude's wording. Check in particular "5E and 7E grew out of the
   original Learning cycle" and whether Ambitious Science Teaching sits comfortably under "a problem to
   solve, a product to make or an issue to decide".
2. **Which view opens first.** Family opens first, because that is what the Family Tree is named for. Scale
   is one click away and is the clearer picture of nesting. Swap the default if students reach for nesting
   more.
3. **Order within a family.** The file keeps the order approved on 2026-10-04 (it reads roughly as lineage in
   Learning cycles). Reordering is a one-line change in `families.yaml`.
