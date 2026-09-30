# Handoff: Reckoner transparency release (How it works, show the working, trust chips)

**Branch:** `feature/reckoner-transparency`

**Depends on:** `2026-09-30-reckoner-feedback-link.md` applied and released first, and the baseline survey
opened, so the survey measures the reckoner before this changes it.

## Goal

Let students see why the reckoner recommends what it does and how its content was made, without changing what it
recommends. This is F1–F4 from the plan "Reckoner: methodology layer and discovery survey" (Claude Docs,
30 Sep 2026):

- **F1 How it works:** a page reached from a footer link, built from a new reviewed content file
- **F2 Show the working:** the full scoring breakdown under each detailed-reckoner result, with rule-based
  watch-outs and nesting lines labelled as rules
- **F3 Why this route:** one line on the Quick, three-taps and Start with your unit results saying how the result
  was chosen
- **F4 Trust chips:** evidence strength and review status on guided models; a Provisional chip on catalogue models

Decisions already made (Steve, 30 Sep 2026): How it works is a footer link only, not a tab; methodology prose lives
in `content/methodology.yaml` with a schema and provenance; the Provisional chip is shown.

## Scope

- **Changes:** `tools/reckoner/src/schema/` (new `methodology.ts`), `tools/reckoner/content/methodology.yaml`
  (new), `tools/reckoner/scripts/lib/build.ts`, `tools/reckoner/scripts/validate.ts`, tests in
  `tools/reckoner/scripts/test-rules.ts` and `test-build.ts`, `tools/reckoner/templates/app.html`,
  `tools/reckoner/templates/app.js`, `tools/reckoner/README.md`, generated `reckoner/` and
  `docs/reckoner-state.md`, `docs/ACTION-PLAN.md`
- **Must not change:** any guide YAML (no content, no version bump), `content/catalogue.json`,
  `content/questions.json` (weights, options, quick matrix), `src/schema/model-guide.ts`,
  `src/schema/fit-dimensions.ts`, and the scoring functions in `app.js`: `quickCompute`, `dimScore`, `fit`,
  `rankAll`, `watchOuts`, `nesting`, `reasons`, `sensitivity`, `dialLevel`. Read from them; do not edit their
  logic. `moodle-blocks/`, `config/`.

## Before writing

Read `scripts/lib/build.ts`, `scripts/validate.ts`, `templates/app.js` and `templates/app.html`, and report:

1. How the manifest is assembled and where a new top-level `methodology` key would go
2. How `validate.ts` loads and reports guide files, so `methodology.yaml` can be validated the same way
3. Every place a model name is rendered as a result, card, tile or column (quick result, detailed ranking and top
   cards, three-taps result, unit result, compare table and cards, map tiles and panel, guide header)
4. Anything in this handoff that no longer matches the code

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-09-30-methodology.yaml` | `tools/reckoner/content/methodology.yaml` | Methodology prose, **status: draft**, `source: ai-generated`, `reviewedBy: []` |

It lands as a draft. Students do not see it until Steve reviews it and it is published (see F1 gating below).
F2–F4 need no new prose and are live as soon as this is released.

## Changes

### 1. Schema: `src/schema/methodology.ts`

A strict Zod schema (same `obj()` helper style as `model-guide.ts`, reusing `Provenance`, `Reference`,
`EvidenceStrength`, `Slug`, `Markdown`, `ShortText`, `IsoDate`; export what is needed from `model-guide.ts` rather
than copying):

```ts
Methodology = obj({
  schemaVersion: z.literal("1.0"),
  id: z.literal("methodology"),
  version: semver string, same rule as guides,
  status: z.enum(["draft", "in-review", "published"]),
  lastReviewed: IsoDate,
  provenance: Provenance,
  intro: obj({ lead: ShortText, purpose: Markdown }),
  principles: z.array(obj({ id: Slug, title: ShortText, body: Markdown, referenceIds: z.array(Slug).default([]) })).min(3),
  routes: z.array(obj({ id: z.enum(["unit", "three-taps", "quick", "detailed", "rules", "dial"]), title: ShortText, body: Markdown })),
  review: Markdown,
  evidenceStrength: obj({ strong: ShortText, moderate: ShortText, emerging: ShortText, framework: ShortText }),
  limits: z.array(ShortText).min(1),
  glossary: z.array(obj({ term: ShortText, definition: ShortText })).min(1),
  references: z.array(Reference).default([]),
})
```

Cross-field rules (superRefine): every route id appears exactly once; ids unique within `principles`; every
`referenceIds` entry resolves to `references`; glossary terms unique (case-insensitive); the same published rule
as guides: `status: published` requires `provenance.source` of `authored` or `ai-drafted-reviewed` and a non-empty
`reviewedBy`. Keep `evidenceStrength` keys in step with the `EvidenceStrength` enum (a type-level check is enough).

Add it to `npm run export-schema` so `dist/methodology.schema.json` exists for editor autocompletion.

### 2. Validation and tests

- `validate.ts`: validate `content/methodology.yaml` with the same reporting as guides (file, path, message; YAML
  errors with line and column). A missing file is an error.
- `test-rules.ts`: new cases that break the file and check each is caught: a missing route, a duplicate route, an
  unresolved referenceId, and `status: published` with `source: ai-generated`. The unmodified file validates.
- `test-build.ts`: a draft methodology is absent from the site and single builds and present in review builds; a
  published one is present in all three; guide JSON files are unaffected by the methodology's status.

### 3. Build: `scripts/lib/build.ts`

Load and parse `content/methodology.yaml`. Add it to `shared` as `methodology` only when
`status === "published"`, or always in review mode (so `npm run review` shows it with the existing "Not yet
reviewed" treatment). In site mode it rides in `data/manifest.json`; do not add a separate data file. The
watch-out and nesting rules stay in `app.js`; nothing about them moves into content.

### 4. F1 How it works (`app.html`, `app.js`)

- **Footer link**, shown only when `DATA.methodology` exists: "How the reckoner works" beside the build stamp.
- It opens a panel with no tab button: a `section.panel` (`id="p-how"`, `role="region"`,
  `aria-labelledby` its heading), routed at `#/how-it-works` alongside the existing `#/guide/...` routing, with a
  "Back" button returning to the previously selected tab. Tabs keep their selected state untouched.
- Content, in this order: intro lead and purpose; "How each route decides" (`routes`, in the order unit,
  three-taps, quick, detailed, rules, dial); the diagram (below); principles, each with its citations; how content
  is made (`review`); evidence strength definitions; what it does not do (`limits`); glossary (a `<dl>`);
  references (APA, DOI links).
- **Live counts, computed, not written:** above "How content is made", one line such as "Right now: 6 of 15
  models have a companion guide; 9 are provisional. Guides were last reviewed between <earliest> and <latest>."
  From `DATA.models` and `DATA.guides`.
- **Weights table, computed:** under the detailed route, a small table of question short label and weight read
  from `DIMS` (question, counts ×n), so the prose and the numbers cannot disagree.
- **Diagram:** a static inline SVG (in the template, using the app's colour tokens so it works in light and dark)
  of the flow in the plan: Research literature → Companion guide → Fit profile; Catalogue entry → Fit profile
  (dashed, labelled provisional); Your answers and Fit profile → Ranked shortlist (weighted mean); Hand-written
  rules → Watch-outs and nesting. Title: "Every recommendation traces to a reviewed guide or a named rule".
  `role="img"` with that title as `aria-label`.
- Uses the existing `md()` renderer for Markdown fields. Prints on A4 with everything expanded, like guides.

### 5. F2 Show the working (`app.js`, detailed reckoner top cards)

Under each of the three top cards, after the existing reasons, a `<details class="why">` titled "Show the
working". Inside:

- A table, one row per answered question: question (short label), your answer (both answers for the dual-purpose
  question), this model's fit (0–3; the mean for two answers), weight × importance, and contribution as a share of
  the total. Final row: the percentage, which must equal the card's figure. Build it from the same values `fit()`
  uses (call `dimScore()` per dimension; do not reimplement the formula).
- One line under the table: "Questions you left blank are not counted." and, for a catalogue model, "Provisional:
  this model's scores have not yet been checked against a companion guide."
- **Rule labels:** watch-outs and nesting lines on the cards get a small "Rule" badge and a trigger phrase, for
  example "Rule · because you chose Novice". Do this by returning the trigger alongside the text from
  `watchOuts()` and `nesting()` (for example `{ text, because }`) **without changing which lines fire**. The
  existing strings stay word-for-word. Add a test in `test-build.ts` (jsdom) that for a fixed set of answers the
  same watch-out and nesting texts appear before and after.

### 6. F3 Why this route (`app.js`)

One quiet `.hint` line per result, above the existing "why" sentence where there is one:

- **Quick reckoner and three taps:** "Chosen from the purpose table: <purpose>, <structured or open> column
  (<reason>)." where reason is "novice learners or a short timeframe" or "experienced learners and a longer
  timeframe"; for one lesson: "Chosen because you have one lesson: a single-lesson strategy." Derived from
  `quickCompute()`'s returned `side`.
- **Start with your unit:** "Chosen because the <guide> guide has a worked sequence for <focus area>." or "...has
  examples for <focus area>." This route picks by what the guides hold, not by fit, so add: "To check the fit for
  your class, try the Quick or Detailed reckoner." with a button to the Quick reckoner tab.
- Each line ends with a "How it works" link to the matching route anchor on the F1 page, shown only when
  `DATA.methodology` exists.

### 7. F4 Trust chips (`app.js`, `app.html` styles)

- **Guided models:** on the guide header (beside the version line) and in the map panel and compare table
  header: "Evidence: <strength>" chip from `reckoner.evidenceStrength`, with the methodology's definition as its
  `title` when available; and "AI-drafted, reviewed by <names>, <reviewedOn>" (or "Written by <authors>" for
  `authored`) from `provenance`.
- **Catalogue models** (`hasGuide: false`): a "Provisional" chip wherever the model appears as a result or
  choice: detailed ranking row, top cards, quick and three-taps results, compare picker and header, map tile and
  panel. Tooltip and accessible text: "No companion guide yet; fit scores not yet checked against one."
- Chip styles reuse the existing badge pattern (`.badge`) with one new modifier each; both must pass AA in light
  and dark, like the `b-match` badge.
- The ranking itself does not change: same order, same percentages.

### 8. README

Add `content/methodology.yaml` and `src/schema/methodology.ts` to the Files table, and one changelog entry
(schema 1.4 or next): "Methodology file and How it works page; show the working; route lines; trust chips.
No guide content or scoring changed."

## Expected results

- Models in the reckoner: 15. Published guides: 6. Examples: 58. Worked sequences: 9. All unchanged
- Every file in `reckoner/data/guides/` byte-identical to `dev`
- `reckoner/data/manifest.json` unchanged while the methodology is a draft (it gains `methodology` only once
  published)
- For any answers, the detailed ranking order and every percentage are identical before and after; the Quick,
  three-taps and unit results name the same models
- Tests: the existing count plus the new methodology rule tests and build tests, all passing
- Checks: `npm run validate`, `npm test`, `npm run typecheck`, `npm run check:pages`, `npm run check:regressions`
- `npm run review -- 5e` produces a review copy that includes the draft How it works page, marked not yet
  reviewed, so Steve can review the prose in context
- Rendered locally: no footer How it works link on the site build (draft); Show the working totals equal the card
  percentages; Provisional chips on the catalogue models; AA contrast on new chips in both themes; 360px width has
  no horizontal scroll on the How it works page

## Commits

1. `feat(reckoner): methodology schema, validation and draft content`: schema, validate, tests, draft YAML,
   build wiring (no visible change on the site)
2. `feat(reckoner): show the working and rule labels in the detailed reckoner`
3. `feat(reckoner): route lines and trust chips`
4. `feat(reckoner): How it works page behind the footer link`
5. `chore(reckoner): publish pages`: regenerated `reckoner/` and `docs/reckoner-state.md`
6. `docs: action plan and README for the transparency release`

## Action plan

Next item: record "Reckoner: transparency release (show the working, route lines, trust chips, How it works)",
and these open items:

- [ ] Steve reviews `content/methodology.yaml` (in a review copy), then set `status: published`,
  `source: ai-drafted-reviewed`, `reviewedBy`, `reviewedOn`, and publish. The footer link appears then
- [ ] Run the follow-up survey with the same six questions; compare question 4 with the baseline
- [ ] F6 visible weights, F7 glossary tooltips and F8 walkthrough refresh: shape from the baseline's open answers
- [ ] If the rule-labelling pattern (`{ text, because }`) changes how `APP_ID_SITES` finds model ids in
  `validate.ts`, add the pattern

## Open questions for review

- **Evidence strength definitions** in the methodology file are drafted, not taken from an existing source in the
  repo. Check they match how `strong`, `moderate`, `emerging` and `framework` were assigned in the guides.
- **"Purpose counts three times as much as the least important questions"**: true of the current weights
  (purpose 3; time and readiness 2; seven questions 1; place-based 0.5). The computed weights table makes this
  self-correcting, but the sentence is prose; adjust if weights change.
- **Route wording for Start with your unit** says the model named is the one whose guide has material, not
  necessarily the best fit. Confirm you are happy saying that plainly to students.
- **Provisional wording**: "initial estimates that have not been checked against a guide". Adjust if you would
  rather describe how the catalogue fit profiles were made.
