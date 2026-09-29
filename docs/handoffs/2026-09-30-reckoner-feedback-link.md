# Handoff: Reckoner feedback link (baseline survey)

**Branch:** `feature/reckoner-feedback-link`

## Goal

Add a "Tell us how it went" link that opens the anonymous Moodle Feedback activity on the EDSE362 page, so the
six-question discovery survey can collect a baseline before the transparency release changes anything. The
reckoner still records nothing: the link leaves the page and all responses live in Moodle.

This is F5 from the plan "Reckoner: methodology layer and discovery survey" (Claude Docs, 30 Sep 2026). It
ships on its own, first, so the baseline measures the reckoner as it is today.

## Scope

- **Changes:** `tools/reckoner/templates/app.js`, `tools/reckoner/templates/app.html`, then the generated
  `reckoner/` and `docs/reckoner-state.md` via `npm run publish:pages`; `docs/ACTION-PLAN.md`
- **Must not change:** anything in `tools/reckoner/content/` (guide YAML, `catalogue.json`, `questions.json`),
  `src/schema/`, `scripts/`, `moodle-blocks/`, `config/`. No guide version bumps.

## Before writing

Read `templates/app.js` and `templates/app.html` and report where each result is rendered before changing
anything. Expected: footer in `app.html`; results in `renderQuick()`, `renderDetail()` (top cards), the three-taps
result (the "Start here" `lite-result` article) and `renderUnit()`.

## Changes to existing files

### 1. `templates/app.js`: one constant for the survey URL

Add near the top, after the other constants:

```js
/* Anonymous Moodle Feedback activity for the reckoner survey. Empty string hides every feedback link. */
const FEEDBACK_URL = "<Steve to supply: the Moodle Feedback activity URL>";
```

If Steve has not supplied the URL when this is applied, leave it as `""` and say so in the report. With an empty
string the page must render exactly as it does today.

### 2. `templates/app.js` and `templates/app.html`: the link

- **Footer:** a paragraph after "Use with judgement": "Used the reckoner for your planning? **Tell us how it
  went** (six questions, about three minutes, anonymous)." The bold words are the link.
- **Under each result:** one quiet line at the end of the Quick reckoner result card, the lead card in the
  detailed reckoner, the three-taps "Start here" result and each "Start with your unit" result: "Was this
  useful? Tell us how it went." Once per view, not once per card.
- Link behaviour: `target="_blank" rel="noopener"`, and visible text that says it opens a new tab (for example a
  "(opens in a new tab)" span with the existing `sr` class) so screen-reader users are not surprised.
- Style: reuse `.hint` and the existing link colour. No new colour tokens. Hidden in print (it is meaningless on
  paper): add the footer paragraph and result lines to the existing `@media print` hide list.
- Write the link markup once as a small helper, for example `feedbackLine(text)`, returning `""` when
  `FEEDBACK_URL` is empty.

## Expected results

- Models in the reckoner: 15. Published guides: 6. Examples: 58. Worked sequences: 9. All unchanged
- Every file in `reckoner/data/guides/` byte-identical to `dev`; `reckoner/data/manifest.json` unchanged
- `reckoner/app.js` and `reckoner/index.html` change (the shell carries the app.js fingerprint)
- Checks: `npm run validate`, `npm test`, `npm run typecheck`, `npm run check:pages` and
  `npm run check:regressions` all pass
- Rendered locally (`python3 -m http.server 8000` from the repo root): footer link present; one feedback line on
  each of the four result views; none in print preview; with `FEEDBACK_URL = ""`, no link anywhere

## Commits

1. `feat(reckoner): feedback link to the anonymous Moodle survey`: template changes plus the regenerated
   `reckoner/`
2. `docs: action plan item for the reckoner feedback link`

## Action plan

Next item: record "Reckoner: feedback link for the baseline survey", and these open items:

- [ ] Create the anonymous Moodle Feedback activity on the EDSE362 page with the six questions (below), and put
  its URL in `FEEDBACK_URL` if it was not supplied at apply time
- [ ] Open the survey once students have planned with the reckoner; close it a week later. This is the baseline
  for the transparency release
- Note: responses are for reckoner improvement only (quality improvement, not research). If that changes, seek
  ethics approval before the next round

## The six survey questions (for the Moodle Feedback activity, not the repo)

1. Which parts of the reckoner did you use? *Multiple choice, tick all:* Start with your unit · Not sure? three
   taps · Quick reckoner · Compare models · Detailed reckoner · Companion guides · Model map · I haven't used it
   yet
2. What were you mainly trying to do? *Single choice:* Choose a model for my program or assessment · Understand a
   model I'd been asked to use · Check a sequence I'd already drafted · Find examples for my focus area · Just
   exploring
3. The reckoner helped me choose a teaching model and justify that choice in my planning. *Five-point agree
   scale*
4. I understood why the reckoner recommended the model it did. *Five-point agree scale*
5. What, if anything, confused you or got in your way? *Long text, optional*
6. If you could change or add one thing, what would it be? *Long text, optional*

Moodle settings: record user names **Anonymous**; one submission per student; show analysis to students off.

## Open questions for review

- None for the code. The survey wording is Steve's to adjust in Moodle; keep questions 3 and 4 word-for-word
  between the baseline and the follow-up so the comparison holds.
