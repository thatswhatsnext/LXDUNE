# Spec — Metacognition Coach (LXDUNE)

**For:** Claude Code, working in the LXDUNE repo
**From:** Steve Grant (via claude.ai session, 9 Oct 2026)
**Status:** content reviewed and approved by Steve. Phase 0 (§2) is a hard gate — read and report before any edit.
**Commit this spec to:** `docs/handoffs/2026-10-09-metacognition-coach.md`, with the three reference files in §1.

---

## 1. What this is

The Metacognition Coach is a Duolingo-style practice game for pre-service science teachers. It builds their capability and confidence to use the nine metacognitive teaching habits from the NSW Department of Education's *Metacognition – a key to unlocking learning* (2020) — the same nine habits the `metacognition-nsw-science` explorer is built on. The explorer is the reference layer (look things up); the game builds fluency (reach for the right move in a live lesson).

It was prototyped as a standalone file in claude.ai and played end to end. Three files come with this spec; commit them next to it in `docs/handoffs/`:

| File | What it is | How to treat it |
|---|---|---|
| `mcg-content.js` | All approved content: 9 habits × 7 steps (63 items) | **Source of truth for every word.** Port verbatim. Steve reviewed and approved it. |
| `Metacognition_Coach.html` | The working prototype (content inlined) | **Reference implementation** for behaviour and look. Port its patterns; do not paste it in. |
| `Metacognition_Coach_answer_key.html` | Every item with best answers and feedback | Human-readable review copy. Not deployed. |

**The job:** turn the prototype into an LXDUNE capability — content as validated JSON, a Moodle-safe ES module loaded by a one-line snippet like the Framework Explorer, and a validator in `npm run validate` and CI. Progress stays in `localStorage` for now (Steve's decision, §7).

**Not the job:** rewriting or extending content, building a backend, or changing the explorer.

---

## 2. Phase 0 — read first, then stop

Answer these and report a short reconciliation note before editing:

1. **Habit list.** Open `frameworks/metacognition-nsw-science/` and find where the nine habits live (likely `habits.json`). Compare its ids, names and phase/category values with the game's `HABITS` in `mcg-content.js`. The game ids are `explicit, model, ask, plan, collab, evaluate, challenge, practise, checkin`, with phases `plan / monitor / evaluate`. Report every difference. **Do not resolve a conflict in content — raise it.**
2. **Location.** Propose where the game's content and module live (see §4). Follow `CLAUDE.md` conventions.
3. **Vocabulary.** Check that every scenario context in §5.3 maps to an id in `frameworks/_schema/curriculum.vocab.json`. List any that don't.
4. **Loader and scoping.** Confirm how `moodle-blocks/framework-explorer.js` loads, scopes CSS (`.lxd-fx` + view class), prefixes ids per mount, and stamps `data-fx-*`. The game follows the same patterns.
5. **Validation.** Confirm how `scripts/validate-frameworks.js` is wired into `npm run validate` and CI, so the game's validator can join it.

For each of §4–§8: *matches repo convention* / *adapt to X* / *needs a decision*. Then wait.

---

## 3. Lessons already learned in this repo (apply them)

These came out of the vocabulary consolidation and the deep-dive redesign. Each one would be a bug here too.

- **One source of truth.** Three copies of the syllabus list drifted until they were consolidated. The game must not create a second habit list: habit **ids, names and phases come from the metacognition framework**, and the validator checks the game against it.
- **The data wins over the spec.** If a field name or claim below doesn't match the repo, follow the repo and say so.
- **Moodle's Boost theme scrolls inside `#page`, not the window.** `window.scrollTo` and document scroll events do nothing there (§8).
- **Scope everything.** Root rules on a shared class leaked into the matrix on the EDSE362 page. Use a view-specific root class and no bare `body`/`h1` selectors.
- **Measure, don't eyeball.** Overflow at 390px, text contrast on the rendered DOM, and calibration-bar widths were all wrong in ways a screenshot hid. Every check in §10 is measured.

---

## 4. Proposed structure (reconcile in Phase 0)

```
games/metacognition-coach/
  content.json        # converted from mcg-content.js — units, steps, game descriptions
  CHANGELOG.md
games/_schema/
  coach.schema.json   # JSON Schema for content.json
moodle-blocks/
  metacognition-coach.js   # ES module, served from Pages, like framework-explorer.js
scripts/
  validate-coach.js   # joins npm run validate and the CI workflow
```

**Why `games/` and not inside `frameworks/`:** the game depends on the metacognition framework's habits but isn't a framework view. A separate folder keeps `frameworks/` meaning one thing and leaves room for future games. `content.json` declares the dependency (`"habitsFrom": "metacognition-nsw-science"`) and the validator enforces it. If the repo's conventions point somewhere else, follow them and say why.

**Loader** (match the explorer's naming once Phase 0 confirms it):

```html
<div id="lxd-coach"></div>
<script type="module">
  import { renderCoach } from "https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/metacognition-coach.js";
  renderCoach({ mount: "lxd-coach" });
</script>
```

Options: `mount` (default `lxd-coach`), `explorerUrl` (default empty, §6.6), `allowReviewer` (default `false`, §11).

---

## 5. Content model

### 5.1 Conversion rules

Convert `mcg-content.js` to `content.json` **without changing any wording**. Add a parity test (§10) proving every string survived.

- **Habit descriptions** (`HABITS[id].desc`) are the game's approved one-liners. They stay in `content.json` as `gameDescriptions[id]`. Names and phases are *not* copied — they come from the framework (§3).
- **Definition items** are generated in the prototype by `match()`. Store them as references, not expanded options, so each description exists once:
  ```json
  { "kind": "def", "distractors": [ { "habit": "model", "contrast": "Modelling shows your reasoning in action; …" } ],
    "good": "…", "coach": "…" }
  ```
  The engine builds four options: the unit's own description (correct) plus each distractor's description with feedback `That’s <b>{name}</b>. {contrast}`. Drop the prototype's `pos` argument — options are shuffled anyway.
- **All other steps** convert field for field: `type`, `kind`, `eyebrow`, `q`, `sub`, `scene`, `opts[]` (`t`, `correct`, `partial`, `fb`), `answer`, `good`, `bad`, `part`, `coach`, `fixedOrder`, `placeholder`, `criteria[]`, `reflect`.
- **Unit order is meaningful** and must be kept: explicit, model, ask, plan, collab, evaluate, challenge, practise, checkin.

### 5.2 Every unit has exactly this step sequence

| # | `kind` / `type` | What it is |
|---|---|---|
| 1 | `def` | Which description matches this habit? (4 options) |
| 2 | `spot` (`tf`) | Is this teacher using the habit? Yes/No |
| 3 | `recall` | One recall question |
| 4 | `scenario` | Classroom scenario, 4 options |
| 5 | `scenario` | The harder scenario, 4 options |
| 6 | `apply` | Write your own version; self-check against 3 criteria |
| 7 | `commit` | Name the lesson you'll try it in; reflection prompt |

### 5.3 Scenario contexts become vocabulary references

In the prototype, `scene.ctx` is free text such as `"Stage 5 · Disease"`. Convert each to vocabulary ids plus an optional note, and render the label from the vocabulary:

```json
"scene": { "ctx": { "stages": ["stage-5"], "area": "disease", "note": null }, "t": "…" }
```

Contexts in the approved content (map each in Phase 0):

| Prototype label | Stages | Area | Note |
|---|---|---|---|
| Stage 4 · Living systems (incl. exit slip) | stage-4 | living-systems | "exit slip" where present |
| Stage 4 · Forces | stage-4 | forces | |
| Stage 4 · Solutions and mixtures | stage-4 | solutions-and-mixtures | |
| Stage 4 · Data science 1 | stage-4 | data-science-1 | |
| Stage 5 · Disease | stage-5 | disease | |
| Stage 5 · Energy | stage-5 | energy | |
| Stage 5 · Reactions (incl. lesson one) | stage-5 | reactions | "lesson one" where present |
| Stage 5 · Waves and motion | stage-5 | waves-and-motion | |
| Stage 5 · first-hand investigation / mid-year / term three | stage-5 | — | the note |
| Stage 4 → Stage 5 · faculty planning | stage-4, stage-5 | — | "faculty planning" |
| Stage 6 Chemistry · Module 5 / Module 6 | stage-6 | the module ids | |
| Stage 6 Physics · Module 5 | stage-6 | the module id | |
| Stage 6 Biology · Module 5 / Module 7 | stage-6 | the module ids | |

The rendered label must read the same as the approved text. If the vocabulary's labels differ (e.g. `Module 5 Equilibrium and Acid Reactions` vs a shorter form), show the vocabulary label and list the differences in your report.

### 5.4 Inline HTML

Content strings contain `<b>` and `<i>` only. The validator rejects any other tag. Anything the *player* types (drafts, commitments) is always escaped before display — the prototype's `attr()` does this; keep it.

---

## 6. Game rules (port exactly)

### 6.1 Path and unlocking
- One path of nine habits in content order, each tagged with its phase colour.
- Habit 1 is open. Each later habit opens when the previous one is finished. Finished habits can be replayed.
- Node states: *finished* (✓, "Replay", shows next review date or "Review due today"), *open* (pulsing ▶, "Start"), *locked*.

### 6.2 A unit run
- **Intro:** habit name, phase, "Habit n of 9", the unit intro, then a confidence prediction (1–5). Start is disabled until a number is chosen.
- **Options are shuffled every play**, except steps with `fixedOrder: true` (the planning/monitoring/evaluating question).
- **Answering:**
  - Correct → green, feedback (`good` + `coach`), Continue appears.
  - Wrong → red, that option disabled, its `fb` shown; player tries again. No penalty, no hearts.
  - Partial → amber "So close", `part` shown, option disabled; player tries again.
  - True/false works the same with `good` / `bad`.
- **Scoring:** 10 XP for right first time, 5 XP if right later. A step is credited once. **"First-time right" counts only first attempts** — this is what the confidence comparison uses.
- XP in the top bar updates the moment it's earned.
- **Apply:** free text plus three self-check criteria (checkboxes, not marked). **Commit:** free text plus the reflection prompt. Both are saved (§7).
- **Completion:** XP, first-time right (n/5), day streak; predicted vs performed bars; the player's commitment quoted back; next review date; "Go deeper" box (§6.6); buttons Back to the path / Next habit.

### 6.3 Confidence comparison
- Unit: predicted = chosen level (1–5); performed level = `max(1, round(firstTimeRightPercent / 20))`.
- Review: predicted = chosen count (0–n); performed = first-time-right count.
- Bars show both; the message depends on the gap: performed higher ("your skill is ahead of your confidence"), lower ("noticing that gap is itself a metacognitive move"), or equal ("well calibrated"). Use the prototype's wording.

### 6.4 Spaced review schedule
- Intervals: **1, 3, 7, 14, 30 days.**
- First finish: `due = today + 1`, `reviews = 0`.
- Each later review of that habit — a replay, or appearing in a mixed review — increments `reviews` and sets `due = today + interval[min(reviews, 4)]`.
- Dates are local calendar dates (`YYYY-MM-DD`).

### 6.5 Mixed review
- Unlocks when **two habits are finished**.
- Pool: finished habits, due ones first. From each habit, candidates are its `def`, `spot` and `recall` steps plus two generated **"Which habit?"** items (below). Take **6 items round-robin across habits**, then shuffle.
- **"Which habit?" item:** scene context = the scenario's context; scene text = the scenario's correct option; question "Which habit is this teacher using?"; options = this habit's name plus three other habit names, shuffled. Wrong feedback: `That’s not it. <b>{name}</b> means: {description} Look again at what this teacher is doing.` Right feedback: `Yes — <b>{name}</b>. {description}`.
- Intro: predict how many of n you'll get right first time. Completion: XP, first-time right, streak, comparison bars, and the next review date for each finished habit included.

### 6.6 Explorer reference
The "Go deeper" box names the habit and the Metacognition in Science Explorer. With `explorerUrl` empty it reads "…on your unit's Teaching frameworks page" with no link; with a value it becomes a link. The prototype's original link pointed at an unrelated page — **don't guess a URL.**

### 6.7 Streak
Updates on finishing a unit or a review: same day → unchanged; the day after the last → +1; later than that → 1. Shown as 0 if the last activity was more than one day ago.

### 6.8 Path page extras
- Stats: total XP, day streak, habits finished n/9.
- Mixed review card (locked message until two habits are finished).
- **Your classroom commitments:** every saved commitment, in habit order.
- Reset progress: two taps ("Tap again to erase all progress").

---

## 7. Persistence (localStorage, prototype stage)

Steve approved localStorage for this stage. Note the LXDUNE explorers otherwise avoid browser storage; this is a deliberate exception for the game and should be noted in the roadmap.

- **Key:** `lxd-mcg-v1` (the prototype used `mcg-proto-v1`; no migration needed).
- **Shape:**
  ```json
  { "v": 1, "xp": 0,
    "done":  { "<habitId>": { "first": "YYYY-MM-DD", "last": "…", "reviews": 0, "due": "…", "best": 0, "conf": 3 } },
    "streak": { "n": 0, "last": null },
    "notes": { "<habitId>": { "apply": "…", "commit": "…", "at": "YYYY-MM-DD" } } }
  ```
- Every read and write in `try/catch`. If storage is unavailable, the game still plays; progress just isn't kept.
- Ignore `done`/`notes` entries for unknown habit ids (content may change).
- Known limits, to record in the roadmap: progress is per browser and device; on a shared computer the next person sees it until they reset; clearing site data erases it. In Moodle, storage belongs to the myLearn origin, so the namespaced key matters.
- Nothing leaves the browser. Drafts and commitments are stored only on the device.

---

## 8. Moodle and platform constraints

1. **Scoping.** Root `.lxd-fx lxd-fx-coach` (or the Phase 0 equivalent). Every selector under it. **Remove** the prototype's bare `body{…}` rule and `min-height:100vh` (it makes a screen-tall blank block inside a Moodle page).
2. **Headings.** Moodle and the page already have an `h1`. Use `h2` for the game title and unit titles (styled as in the prototype), `h3` below — same decision as the deep-dive.
3. **Per-mount ids.** The prototype uses fixed ids (`mcg`, `root`, `screen`, `fb`, `xp`, `apta`, `cmta`, `btnrow`, `live`, `calq`). Prefix them per mount, as the deep-dive does.
4. **Scrolling.** Replace `window.scrollTo(0,0)` on screen change with scrolling the mount's top into view (`scrollIntoView({block:"start"})`, smooth only without reduced motion). Check the sticky top bar isn't hidden under Moodle's fixed navbar; offset it if it is.
5. **Focus.** Keep the prototype's focus management: each new screen focuses its heading; Continue takes focus after a correct answer; feedback is a `role="status"` live region.
6. **No external resources**, no `alert`/`confirm`, Georgia headings with the theme's body font (as approved for the deep-dive).
7. **Stamp** the mount with `data-mcg-version`, `data-mcg-content-hash` and `data-mcg-renderer`, following the `data-fx-*` pattern.
8. **No horizontal overflow at 390px** (measured: `scrollWidth === clientWidth`).

---

## 9. Design tokens

Reuse the existing `--fx-*` tokens wherever the value already exists. These are the prototype's values; all passed AA on the rendered DOM:

```
--bg #F2F0EA  --paper #FFFFFF  --sunk #F6F4EF
--ink #19282F  --body #3B474F  --muted #636F77
--line #E2DDD2  --line2 #D4CDBF
--accent #1C4C5B  --accent-soft #E0EBEE  --accent-line #B7D0D6
--pos #2C6046 / #E5EFE9 / #BBD7C6      (correct)
--neg #8B4232 / #F7ECE7 / #E6C9BE      (wrong)
--warn #7A6B1F / #F6EEDC / #E4D2A6     (partial, XP, crown)
focus ring #A5822C
phases: planning #3C6E8F · monitoring #2F6E6A · evaluating #6B3F63
```

Three contrast fixes were made during testing — keep them:
- Locked node number: `#4F4A40` on `#E6E0D4`.
- Disabled Start button: `--sunk` background, `--muted` text, dashed `--line2` border (not white on grey).
- A wrong option keeps full-strength text after it's chosen (no opacity fade).

---

## 10. Verification — Definition of done

Run in headless Chromium against a local page using the loader, then in Steve's myLearn sandbox.

- [ ] Phase 0 report agreed before edits
- [ ] `npm run validate` passes, including the new coach validator (below), locally and in CI
- [ ] **Content parity:** every string in the approved `mcg-content.js` appears unchanged in the rendered or stored game content (curly quotes and dashes included)
- [ ] All 9 habits playable start to finish; unlocking follows the path order
- [ ] Wrong, partial and correct paths behave as §6.2; XP 10/5; first-time right counts only first attempts
- [ ] Calibration bar widths measured equal to their values (they rendered at 0% once in the prototype)
- [ ] Progress survives a reload: XP, streak, finished habits, commitments
- [ ] Mixed review: locked below two habits; 6 items across habits; "Which habit?" items appear; due dates update per §6.4
- [ ] Reset (two taps) clears everything; storage-unavailable still plays
- [ ] Rendered-DOM text contrast: **0 failures** on every screen; axe-core: 0 violations
- [ ] Keyboard path through every screen; reduced motion respected; zero console errors
- [ ] 390px: no overflow on any screen, including the 7-button review prediction row
- [ ] **Combined page:** the game on the same page as HITS and the matrix — their styles unchanged (byte-identical element styles, as in the deep-dive check)
- [ ] **In myLearn sandbox** (Steve): script survives save, scrolling and sticky bar behave, progress persists across visits

**Coach validator checks** (port the prototype's `validate.js`):
nine units covering each habit exactly once, in order · each unit has the §5.2 step sequence · exactly one correct option per choice step · every wrong or partial option has feedback · a partial option implies `part` · true/false has a boolean `answer`, `good` and `bad` · `apply` has 3 criteria · `commit` has `reflect` · every habit reference resolves to the framework · every context id resolves to the vocabulary · only `<b>`/`<i>` in strings.

**Commits:** content + schema + validator · module structure and behaviour · styles · CHANGELOG and roadmap entry (including the localStorage exception and its limits).

---

## 11. Decisions for Steve

1. **Reviewer mode.** The prototype has a visible toggle that unlocks every habit. *Recommendation:* hide it from students and enable it only through the loader (`allowReviewer: true`) on a staff page.
2. **Explorer link.** *Recommendation:* ship with `explorerUrl` empty (named text, no link) until there's a stable address — ideally a deep link to the habit, which the explorer doesn't support yet.
3. **Which page.** Where the game goes in EDSE362 (a new page, or on the Teaching frameworks page next to the explorer). Affects only the loader snippet.

## 12. Out of scope

Content changes or additions · a backend or cross-device sync · analytics or a teacher view of student progress · grade integration · deep links into the explorer · changes to the explorer itself.
