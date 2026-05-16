# LXDUNE — Claude Code Briefing

**Last updated:** 2026-05-17  
**Repo:** `https://github.com/thatswhatsnext/LXDUNE`  
**GitHub Pages base:** `https://thatswhatsnext.github.io/LXDUNE/`  
**Owner:** Steve Grant — UNE lecturer, unit coordinator, edtech consultant

---

## What this project is

A GitHub Pages repo that serves dynamic content to Moodle LMS pages. Each Moodle page contains a one-time `<script type="module">` snippet that imports a JavaScript function from this repo and renders the appropriate content into a container `<div>`. Updating a unit config file and pushing to dev causes all dependent Moodle pages to update automatically on next load — no Moodle editing required.

---

## Architecture

```
config/
  trimester-config.json       ← trimester start dates (all years)
  units/
    EDSE357.json              ← unit config (weeks, links, LOs, assessmentTasks, etc.)
    EDSE358.json
    EDSE362.json

moodle-blocks/
  blocks.js                   ← ES module, 8 exported render functions
  bespoke/                    ← static HTML fragments injected by renderAssessmentPage
    discipline-tab-switcher.html
    riskassess-callout.html

generate/
  index.html                  ← admin tool: generates copyable Moodle shell snippets

test/
  index.html                  ← dynamic QA harness (local dev only)

templates/
  *.html                      ← 9 reference HTML components (static, not rendered)

docs/
  STAFF-README.md             ← plain-language guide for non-technical coordinators
  LXDUNE-ClaudeCode-Briefing.md ← this file

.claude/
  commands/
    checkpoint.md             ← /checkpoint slash command (update this briefing)

whatson/
  whatson.js                  ← LIVE, do not touch until Phase 4
autovideos/
  autovideos.js               ← LIVE, do not touch until Phase 4
```

### How a Moodle shell works

```html
<script type="module">
  import { renderAnnouncementBlock }
  from "https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/blocks.js";
  renderAnnouncementBlock({ forUnit: "EDSE358", forTri: "T1", forYear: "2026" });
</script>
<div id="lxdune-announcement"></div>
```

Pasted once into Moodle, never edited again. The script fetches config on every page load and renders current content.

---

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Tracking branch — GitHub Pages currently deployed from `dev` during development |
| `dev` | Active development — GitHub Pages source since 2026-05-17 |
| `feature/*` | All new development — branch from dev, merge back to dev |

**Never commit directly to `main`.** The path is always `feature/* → dev → main`.

> ⚠️ **GitHub Pages is currently serving from `dev`**, not `main`. This was switched on 2026-05-17 for sandpit testing. Revert to `main` after dev → main merge.

---

## Current branch status

`dev` is **17 commits ahead of `main`**.

### `main` (tracking branch — not currently served)
- `whatson/whatson.js` — live script for "What's on this week" widget
- `autovideos/autovideos.js` — live weekly video switcher
- All other supporting files (fonts, assets, other tools)
- **Does NOT yet have:** config layer, blocks.js, generator, test harness, theme system, EDSE362, bespoke components, Assessment Content System

### `dev` (GitHub Pages source — 17 commits ahead of main)
Everything on `main`, plus:
- `config/trimester-config.json`
- `config/units/EDSE357.json` — fully populated through week 8; assessmentTasks AT1 + AT2 complete with rubric descriptors
- `config/units/EDSE358.json` — weeks 1–7 fully populated; week 8 text pending
- `config/units/EDSE362.json`
- `moodle-blocks/blocks.js` — 8 render functions + theme system
- `moodle-blocks/bespoke/` — 2 components (discipline-tab-switcher, riskassess-callout)
- `generate/index.html` — 8 shell types including Resource directory and Assessment page
- `test/index.html` — 7 week-blocks + Assessment tab
- `templates/` (9 reference HTML components)
- `docs/STAFF-README.md`
- `docs/LXDUNE-ClaudeCode-Briefing.md`
- `.claude/commands/checkpoint.md`

---

## Build phases

### Phase 1 — Config layer ✅ COMPLETE

`config/trimester-config.json`, `config/units/EDSE357.json`, `config/units/EDSE358.json`, `config/units/EDSE362.json`. Merged from `feature/config-layer`.

### Phase 2 — Generator UI ✅ COMPLETE

`generate/index.html` — admin-only tool for generating Moodle shell snippets. Covers all 8 block types including Resource directory and Assessment page (with task selector).

### Phase 3 — Block renderer ✅ COMPLETE (8 functions)

`moodle-blocks/blocks.js` — ES module with 8 exported render functions and a theme system.

**Exported functions:**

| Function | Container ID | Week-aware |
|---|---|---|
| `renderAnnouncementBlock` | `#lxdune-announcement` | Yes |
| `renderWorkflowCard` | `#lxdune-workflow` | Yes |
| `renderLectureBlock` | `#lxdune-lecture` | Yes |
| `renderLiveSessionHub` | `#lxdune-live-hub` | Yes |
| `renderAssessmentDownloadBlock` | `#lxdune-assessment-downloads` | No |
| `renderLearningOutcomesTable` | `#lxdune-outcomes` | No |
| `renderResourceDirectory` | `#lxdune-resource-directory` | Yes |
| `renderAssessmentPage` | `#lxdune-assessment-page` | No — takes `{ forUnit, forTask }` |

**Theme system:**
- `applyTheme(unitCfg)` — injects/replaces `<style id="lx-theme-vars">` on `:root`
- All brand colours use CSS custom properties with fallbacks: `var(--lx-primary,#1f6fb2)`, `var(--lx-accent,#25797F)`, `var(--lx-pill,#DAF0F7)`, `var(--lx-pill-border,#cbe6ee)`

**Key implementation details:**
- `const BASE = new URL('..', import.meta.url).href` — derives config URL from module location; works on any host
- `null` links always render as a Coming soon chip — never broken or empty
- CSS injected once per page via `injectStyles(sentinelId, css)` — safe for multiple blocks on one page
- `applyTheme` writes/replaces its style element on every render — safe for unit switching in the test harness
- After adding new exports to `blocks.js`, hard-refresh (Cmd+Shift+R) to clear the browser module cache

### Phase 3B — Assessment Content System ✅ COMPLETE (EDSE357)

`renderAssessmentPage({ forUnit, forTask })` — 8th render function. Assembles a complete assessment page in 6 sections:

1. **At a glance** — metadata pills (due, weighting, length, flexible portal, AITSL), LO colour pills, all 5 action buttons (null → disabled, never hidden)
2. **What is this task?** — rationale (collapsed `<details>`), aim (always visible), parts overview
3. **What do I need to do?** — part-by-part collapsibles with bespoke injection; omitted when `parts: []`
4. **How will I be marked?** — one `<details>` per rubric row; summary shows criterion + marks + LO pills; body shows HD/D/C/P/N band table with range and descriptor; no JavaScript required
5. **Submission** — instruction list + prominent submit button
6. **Support** — HD callout + flexible portal button

**Schema** — `assessmentTasks` array on each unit JSON:
```json
{
  "id": "AT1",
  "title": "...",
  "weighting": 50,
  "length": "2,000 words (equivalent) +/- 10%",
  "due": "2026-03-29",
  "flexiblePortal": { "label": "...", "url": "...", "opensDate": "2026-03-27", "closesDate": "2026-04-05" },
  "learningOutcomes": ["LO1", "LO2"],
  "aitslStandards": ["2.1.1", "3.3.1"],
  "rationale": "...",
  "aim": "...",
  "links": { "rubric": null, "taskFiles": null, "submit": null, "forum": null, "video": null },
  "parts": [
    {
      "id": "A", "title": "...", "marks": 20, "wordCount": 300,
      "description": "...", "requirements": ["..."], "critique": ["..."],
      "resources": [{ "label": "...", "url": "..." }],
      "loLinks": ["LO1"], "bespoke": "discipline-tab-switcher"
    }
  ],
  "criteria": [
    { "label": "...", "weighting": 35, "accent": "#25797F", "background": "#DAF0F7",
      "description": "...", "bullets": ["..."], "focus": "...", "loLinks": ["LO1"] }
  ],
  "rubric": [
    {
      "part": "A", "criterion": "...", "marks": 20, "loLinks": ["LO1"],
      "bands": {
        "HD": { "range": "20–18", "descriptor": "..." },
        "D":  { "range": "17–15", "descriptor": "..." },
        "C":  { "range": "14–12", "descriptor": "..." },
        "P":  { "range": "11–10", "descriptor": "..." },
        "N":  { "range": "9–0",   "descriptor": "..." }
      }
    }
  ],
  "hdCallout": "...",
  "submissionInstructions": ["..."]
}
```

**EDSE357 assessmentTasks — current state:**
- AT1: fully populated — rationale, aim, 4 parts (A/B/C/D), 7 criteria, 7-row rubric (A, B1, B2, C1, C2, C3, D) with all 35 descriptors, submission instructions, all links populated
- AT2: fully populated — rationale, aim, parts:[] (no parts), 4 criteria with bullets/colors, 4-row rubric with all 20 descriptors, HD callout, submission instructions; rubric link null (not yet published)

**AT2 note:** `parts: []` because AT2 is holistically assessed. The "What do I need to do?" section is omitted; the aim describes all requirements.

**Bespoke components** (`moodle-blocks/bespoke/`):
- `discipline-tab-switcher.html` — tab UI for 5 NSW science disciplines (AT1 Part A)
- `riskassess-callout.html` — RiskAssess login callout with credentials (AT1 Part B)
- Fetched async; on failure, a styled placeholder is shown (not a crash)

### Phase 4 — Refactor whatson.js and autovideos.js ❌ NOT STARTED

Refactor the two live scripts to read from `config/units/*.json` instead of their own embedded data objects. **Do not start until Phases 1–3 are stable and merged to main.**

---

## Sandpit test — 2026-05-17 ✅ PASSED

- All 7 week-block render functions verified in Moodle sandpit environment
- GitHub Pages switched to serve from `dev` branch (was `main`)
- EDSE358 T1 2026 week 7 used as reference dataset (most complete week)
- Verified: CSP compatibility, `import.meta.url` resolution, Coming soon chips for null links, purple/cyan theme rendering

---

## Unit configs — current state

### EDSE357 — Science Education 11–12: Curriculum and Pedagogy
- **Live:** T1 2026, Wednesdays 5:30–6:30pm
- **Trimesters configured:** T1
- **Zoom (T1-2026):** configured ✅
- **Theme:** blue/teal — `primary: #1f6fb2`, `accent: #25797F`
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Weeks 9–14 and week 0:** `announcementBody` / `liveSessionFocus` / `liveSessionTasks` null (non-teaching)
- **Links (all weeks):** all `null` — content not yet published
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentTasks:** AT1 and AT2 — fully populated including 55 rubric descriptors ✅
- **assessmentFiles (T1-2026):** AT1, AT2 — discipline structure in place, all URLs `null`

### EDSE358 — Science Education 11–12: Plan, Assess and Report
- **Live:** T1 2026, Thursdays 5:30–6:30pm
- **Trimesters configured:** T1, T2
- **Zoom (T1-2026):** configured ✅
- **Theme:** purple/cyan — `primary: #7C5DB6`, `accent: #4FA9B5`
- **Teaching weeks 1–7:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Week 8 (Module 4D):** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — **null, not yet written**
- **Weeks 9–14 and week 0:** `announcementBody` / `liveSessionFocus` / `liveSessionTasks` null (non-teaching)
- **Links by week:**

| Week | Live links | Null links |
|---|---|---|
| 1 (Module 1) | — | all |
| 2 (Module 2) | — | all |
| 3 (Module 3A) | zoom, forum, materials, liveHub | lecture, slides, recording |
| 4 (Module 3B) | lecture, slides, zoom, forum, materials, liveHub | recording |
| 5 (Module 4A) | lecture, zoom, forum, materials, liveHub | slides, recording |
| 6 (Module 4B) | zoom, forum, materials | lecture, slides, liveHub, recording |
| 7 (Module 4C) | zoom, forum, materials | lecture, slides, liveHub, recording |
| 8 (Module 4D) | — | all |

- **assessmentFiles (T1-2026):**
  - AT1: all URLs `null`
  - AT2: rubric ✅, biology ✅, physics ✅, chemistry task ✅ / **marking null** (known issue), EES **task null** (known issue) / marking ✅
- **assessmentTasks:** not yet added to EDSE358.json

### EDSE362 — Science Education 11–12: Curriculum, Pedagogy and Inclusive Practice
- **Live:** T2 2027 (not yet live — future unit)
- **Trimesters configured:** T2
- **Zoom (T2-2027):** `null` — not yet created
- **Theme:** green/warm gold — `primary: #2D7A48`, `accent: #C4872D`
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Links (all weeks):** all `null`
- **assessmentTasks:** not yet added to EDSE362.json
- **T2-2027 start date:** `2027-06-21` — ⚠️ placeholder, confirm against UNE academic calendar before go-live

---

## Config schema — week object

Teaching weeks (1–8) follow this shape. All three units conform to this schema; EDSE362 has `resources` on every week; EDSE358 adds `workflow`, `additionalLectures`, `forumPrompts`, and (on week 8) `extension` as additional fields.

```json
"1": {
  "item": "Topic 1",
  "title": "Full topic title",
  "live": "🎤 Live Session",
  "notes": ["Optional note shown on the week tile"],
  "assessments": [
    { "name": "Assessment Task 1", "due": "2026-03-29" }
  ],
  "announcementBody": {
    "intro": "Opening paragraph.",
    "focus": "This week's focus — second paragraph.",
    "keyIdea": "A key idea this week is… (stored but not yet rendered)"
  },
  "liveSessionFocus": "One or two sentences describing the live session focus.",
  "liveSessionTasks": ["Task 1.", "Task 2.", "Task 3."],
  "workflow": ["Step 1 label", "Step 2 label"],
  "links": {
    "lecture": null, "slides": null, "zoom": null,
    "recording": null, "forum": null, "materials": null, "liveHub": null
  },
  "additionalLectures": [
    { "label": "Lecture title", "recording": "echo360_url", "slides": "slides_url_or_null" }
  ],
  "forumPrompts": ["Prompt 1.", "Prompt 2."],
  "resources": [
    { "category": "UDL", "label": "Resource label", "url": "url_or_null", "type": "link" }
  ],
  "video": "youtubeVideoId"
}
```

`null` links always render as Coming soon chips. Non-teaching weeks (9–14) only need `item`, `title`, `video`, and optionally `assessments`.

---

## Test harness

`test/index.html` — run locally via `python3 -m http.server 8000` from repo root, then open `http://localhost:8000/test/`.

- **Controls:** unit, year, trimester, week dropdowns + date override field
- **Week dropdown:** populated with titles from the unit config on unit change
- **Theme switching:** changing the unit dropdown repaints all blocks immediately via CSS custom properties
- **All 7 week-blocks** re-render immediately on any control change (150ms debounce)
- **Assessment tab:** task selector (AT1/AT2) renders the full assessment page via `renderAssessmentPage`
- **Cache note:** after updating `blocks.js` exports, hard-refresh (Cmd+Shift+R) before testing

---

## Generator

`generate/index.html` — run locally or via GitHub Pages URL. Select unit, year, trimester, page type, click Generate. Produces copyable shell snippets for all 8 page types including Resource directory and Assessment page (with task selector). Requires HTTP (not `file://`).

---

## Trimester start dates

| Year | T1 | T2 | T3 |
|---|---|---|---|
| 2026 | 2026-02-23 | 2026-06-22 | 2026-10-19 |
| 2027 | 2027-02-22 | 2027-06-21 ⚠️ | 2027-10-18 ⚠️ |

⚠️ 2027 T2 and T3 dates are estimates — confirm against the UNE academic calendar before EDSE362 goes live.

---

## Known issues

1. **EDSE358 AT2 — Chemistry marking URL:** currently `null`. Confirm correct URL with Steve before go-live.
2. **EDSE358 AT2 — EES task URL:** currently `null`. Confirm correct URL before go-live.
3. **EDSE358 weeks 1–2, 6–8 — missing lecture/slides/liveHub/recording links:** to be populated as content is published each week.
4. **EDSE357 — all week links null:** unit is live but content links haven't been added yet; all render as Coming soon chips.
5. **EDSE358 week 8 (Module 4D):** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` not yet written.
6. **EDSE362 — all links null, zoom null:** not live until T2 2027; links to be added closer to go-live.
7. **2027 T2/T3 start dates:** placeholders — must be confirmed against UNE academic calendar before EDSE362 goes live.
8. **`announcementBody.keyIdea`:** stored in weeks 3–7 of EDSE358 but not yet rendered by any block function. Future enhancement.
9. **EDSE357 AT1 rubric descriptors:** all 35 populated from marking rubric ✅. AT2 rubric link null — add URL when rubric is published to Moodle.
10. **GitHub Pages serving from `dev`:** switched on 2026-05-17. Must revert to `main` (or merge dev→main) before communicating the live URL to students.
11. **`assessmentTasks` not yet added to EDSE358 or EDSE362.** Only EDSE357 has the full Assessment Content System schema.

---

## Next tasks in priority order

1. **Verify Assessment Content System in test harness** — open AT1 and AT2, confirm all 6 sections render, all rubric rows expand with correct band text, disabled buttons show for null links.
2. **EDSE358 week 8** — write `announcementBody`, `liveSessionFocus`, `liveSessionTasks` for Module 4D (Developing rubrics and providing feedback).
3. **Resolve EDSE358 AT2 known issues** — get correct Chemistry marking URL and EES task URL.
4. **Add EDSE358 lecture/slides/liveHub/recording links** — weeks 1–2, 3, 6, 7 as content is published.
5. **Add EDSE357 links** — all weeks, all link types, as content is published.
6. **Add `assessmentFiles` URLs** — EDSE358 AT1, EDSE357 AT1/AT2 — as task and marking files are uploaded.
7. **Add EDSE357 AT1 rubric link** — once the marking rubric PDF is published on Moodle, add its URL to `AT1.links.rubric`.
8. **Add EDSE357 AT2 rubric link** — same, once AT2 rubric is published.
9. **Merge dev → main** — once all current dev work is complete and tested; revert GitHub Pages to `main` at the same time.
10. **Phase 4 — Refactor `whatson.js` and `autovideos.js`** — after Phases 1–3 are stable on main.

---

## Session notes

### 2026-05-17 — Assessment Content System complete for EDSE357

**Assessment Content System — completed this session:**
- Schema designed (rubric-first): `assessmentTasks` array with `rubric[]` field per task, each row has `part`, `criterion`, `marks`, `loLinks`, and `bands` (HD/D/C/P/N with range + descriptor)
- `renderAssessmentPage()` redesigned — 6 sections, rubric rows as CSS-only `<details>`, all 5 action buttons always shown (null → disabled, not hidden)
- AT1 fully populated: 4 parts (A/B/C/D with bespoke injection), 7 rubric rows, 35 band descriptors from marking rubric
- AT2 fully populated: no parts (holistic), 4 criteria with bullets/colors, 4 rubric rows, 20 band descriptors
- Bespoke components complete: `discipline-tab-switcher.html`, `riskassess-callout.html`
- Generator and test harness updated: Assessment page shell + task selector in both

**Rubric descriptor approach:**
- Stored in JSON alongside mark ranges; renderer shows them in a 5-column table inside each `<details>` row
- Empty descriptor renders as `—` (graceful fallback)
- No JS required for expand/collapse — pure HTML `<details>`/`<summary>`

**AT2 schema decision:**
- AT2 has `"parts": []` (empty array) because it's holistically assessed with no sub-parts
- The "What do I need to do?" section is automatically omitted when `parts.length === 0`
- The task requirements are captured in the `aim` field

**Design patterns established:**
- Null links: all 5 action buttons are always rendered; null → `<span class="lx-ap-btn disabled">` (greyed, pointer-events:none)
- LO pills use the LO's `color` property from `unitCfg.learningOutcomes` for consistent branding
- Bespoke injection: async fetch with styled placeholder on failure (never crashes)

### 2026-05-17 — Sandpit test + earlier work

**Sandpit test (completed):**
- All 7 week-blocks verified in Moodle sandpit with EDSE358 T1 2026 week 7 as dataset
- GitHub Pages source switched from `main` to `dev` on 2026-05-17

**Uncommitted carry-over from 2026-05-16:**
- The theme system and `renderResourceDirectory` changes were written to disk in the previous session but not committed — caught and committed as `b0407aa`. Always verify `git status` is clean before ending a session.

### 2026-05-16 — Phase 3 additions + EDSE358 content population

**`renderResourceDirectory` (7th render function):**
- Container: `#lxdune-resource-directory`; week-aware; reads `week.resources[]`
- Groups by `r.category` using a Map; renders category headings (uppercase, themed underline) with pill-links

**Theme system:**
- `applyTheme(unitCfg)` writes/replaces `<style id="lx-theme-vars">` — replacing rather than guarding means unit switching works correctly in test harness

---

## Critical constraints (always apply)

- **Never modify `whatson/whatson.js` or `autovideos/autovideos.js`** until Phase 4 is explicitly started. Both scripts are live for enrolled students.
- **Never commit directly to `main`.**
- **EDSE357 and EDSE358 are live with enrolled students.** Breaking changes are not acceptable. All changes go through dev and sandpit testing first.
- **`<\/script>` in shell template literals** — use `<\/script>` inside JavaScript strings to prevent the HTML parser from closing the outer script tag prematurely.
- **`import.meta.url`** — used in `blocks.js` to derive the config base URL dynamically. This means `blocks.js` works from any host without hardcoded URLs.
- **GitHub Pages is currently on `dev`** — revert to `main` (or merge dev→main) before sending the live URL to students.
