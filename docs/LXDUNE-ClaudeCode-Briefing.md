# LXDUNE — Claude Code Briefing

**Last updated:** 2026-05-21 (render alignment fields: orientationNote, forumPrompts, workedExample, guidanceNotes; synthesis generator shell; D1/D2 checklist update)
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

assets/
  banners/
    EDSE357-banner.svg        ← 800×200 gradient SVG banner (blue → #4a90d9, teal accent bar)
    EDSE358-banner.svg        ← 800×200 gradient SVG banner (purple → #a085d4, teal accent bar)
    EDSE362-banner.svg        ← 800×200 gradient SVG banner (green → #4aad78, warm gold accent bar)

moodle-blocks/
  blocks.js                   ← ES module, 15 exported render functions
  bespoke/                    ← static HTML fragments injected by renderAssessmentPage
    discipline-tab-switcher.html
    riskassess-callout.html

generate/
  index.html                  ← admin tool: generates copyable Moodle shell snippets

test/
  index.html                  ← dynamic QA harness (local dev only)

templates/
  *.html                      ← 14+ reference HTML components (static, not rendered)
                                 incl. presubmission-checklist-EDSE357-AT1/AT2 and EDSE358-AT1,
                                 unit-key-info.html, assessment-status.html,
                                 constructive-alignment-map.html (EDSE362),
                                 constructive-alignment-map-generic.html

docs/
  STAFF-README.md             ← plain-language guide for non-technical coordinators
  LXDUNE-ClaudeCode-Briefing.md ← this file
  ACTION-PLAN.md              ← prioritised action plan for content and system work
  EDSE357-T1-2026-shells.html    ← git-ignored; open in browser to copy shells
  EDSE358-T1-2026-shells.html    ← git-ignored; open in browser to copy shells
  EDSE357-navigation-shells.html ← git-ignored; navigation block shells (renderUnitKeyInfo + renderAssessmentStatus)
  EDSE358-navigation-shells.html ← git-ignored; navigation block shells

.claude/
  commands/
    briefing-update.md        ← /briefing-update slash command (update this briefing)

whatson/
  whatson.js                  ← LIVE, config-driven (Phase 4); changes via feature/* → dev → sandpit → main
autovideos/
  autovideos.js               ← LIVE, config-driven (Phase 4); EDIT legacy fallback at bottom of file
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
| `main` | GitHub Pages source — live for students |
| `dev` | Integration branch — sandpit-tested before merging to main |
| `feature/*` | All new development — branch from dev, merge back to dev |

**Never commit directly to `main`.** The path is always `feature/* → dev → main`.

> ✅ **GitHub Pages is serving from `main`** — confirmed 2026-05-17 after Phases 1–4 production deployment. All three live scripts verified 200 from the Pages URL. Safe to share with students.

---

## Current branch status

`dev` and `main` are **in sync** — 0 commits on dev ahead of main as of 2026-05-21.

### `main` (GitHub Pages source — production ✅)
Last merge: `99b8a06` (2026-05-21) — render alignment fields, synthesis generator, D1/D2 checklist update.

Recent main history (since last briefing 2026-05-19):
- `99b8a06` — Merge dev: render alignment fields, synthesis generator, D1/D2 checklist update
- `ae70f97` — Merge dev into main: EDSE358 alignment audit improvements G1-G8
- `f5277d4` — Merge dev into main: EDSE358 alignment improvement content
- `2baf406` — Merge dev into main: constructive alignment map templates and action plan update
- `da61386` — Merge dev into main: toggleable contact section for renderUnitKeyInfo
- `de67199` — Merge dev into main: EDSE362 keyLinks for T2 2026

Live scripts serving from main:
- `https://thatswhatsnext.github.io/LXDUNE/whatson/whatson.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/autovideos/autovideos.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/blocks.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/assets/banners/EDSE357-banner.svg` → 200
- `https://thatswhatsnext.github.io/LXDUNE/assets/banners/EDSE358-banner.svg` → 200
- `https://thatswhatsnext.github.io/LXDUNE/assets/banners/EDSE362-banner.svg` → 200

### `dev` (0 commits ahead — in sync with main)

---

## Build phases

### Phase 1 — Config layer ✅ COMPLETE

`config/trimester-config.json`, `config/units/EDSE357.json`, `config/units/EDSE358.json`, `config/units/EDSE362.json`. Merged from `feature/config-layer`.

### Phase 2 — Generator UI ✅ COMPLETE

`generate/index.html` — admin-only tool for generating Moodle shell snippets. Covers all 9 block types including Resource directory, Assessment page (with task selector), and Course Hub.

### Phase 3 — Block renderer ✅ COMPLETE (15 functions)

`moodle-blocks/blocks.js` — ES module with 15 exported render functions and a theme system.

**Exported functions:**

| # | Function | Container | Week-aware |
|---|---|---|---|
| 1 | `renderAnnouncementBlock` | `#lxdune-announcement` | Yes |
| 2 | `renderWorkflowCard` | `#lxdune-workflow` | Yes |
| 3 | `renderLectureBlock` | `#lxdune-lecture` | Yes |
| 4 | `renderLiveSessionHub` | `#lxdune-live-hub` | Yes |
| 5 | `renderAssessmentDownloadBlock` | `#lxdune-assessment-downloads` | No |
| 6 | `renderLearningOutcomesTable` | `#lxdune-outcomes` | No |
| 7 | `renderResourceDirectory` | `#lxdune-resource-directory` | Yes |
| 8 | `renderAssessmentPage` | `#lxdune-assessment-page` | No — takes `{ forUnit, forTask }` |
| 9 | `renderPresubmissionChecklist` | `#lxdune-presubmission-checklist` | No — takes `{ forUnit, forTask }` |
| 10 | `renderCourseHub` | `div[data-lx-block="course-hub"]` | No — renders all weeks 1–8 |
| 11 | `renderUnitKeyInfo` | `#lxdune-unit-key-info` | No — navigation block, course homepage |
| 12 | `renderAssessmentStatus` | `#lxdune-assessment-status` | No — navigation block, course homepage |
| 13 | `renderOrientationNote` | `#lxdune-orientation-note` | Yes — renders nothing if `orientationNote` absent |
| 14 | `renderForumPrompts` | `#lxdune-forum-prompts` | Yes — renders nothing if `forumPrompts` absent/empty |
| 15 | `renderWorkedExample` | `#lxdune-worked-example` | Yes — collapsible `<details>`; renders nothing if `workedExample` absent |

**Note:** `renderCourseHub` uses a `data-lx-block` attribute selector rather than an `id` — intentional, to allow the block to sit anywhere in an existing page without ID conflicts.

**Theme system:**
- `applyTheme(unitCfg)` — injects/replaces `<style id="lx-theme-vars">` on `:root`
- All brand colours use CSS custom properties with fallbacks: `var(--lx-primary,#1f6fb2)`, `var(--lx-accent,#25797F)`, `var(--lx-pill,#DAF0F7)`, `var(--lx-pill-border,#cbe6ee)`
- Theme values corrected for EDSE358 (pill: `#EDE8FB`, pillBorder: `#c9bef5`) and EDSE362 (primary: `#2E7D52`, accent: `#E3B089`) in SA3

**Key implementation details:**
- `const BASE = new URL('..', import.meta.url).href` — derives config URL from module location; works on any host
- `null` links always render as a Coming soon chip — never broken or empty
- CSS injected once per page via `injectStyles(sentinelId, css)` — safe for multiple blocks on one page
- `applyTheme` writes/replaces its style element on every render — safe for unit switching in the test harness
- After adding new exports to `blocks.js`, hard-refresh (Cmd+Shift+R) to clear the browser module cache

### Phase 3B — Assessment Content System ✅ COMPLETE (EDSE357 and EDSE358); stubs added for EDSE362

`renderAssessmentPage({ forUnit, forTask })` — 8th render function. Assembles a complete assessment page in 6 sections:

1. **At a glance** — metadata pills (due, weighting, length, flexible portal, AITSL), LO colour pills, all 5 action buttons (null → disabled, never hidden)
2. **What is this task?** — rationale (collapsed `<details>`), aim (always visible), parts overview
3. **What do I need to do?** — part-by-part collapsibles with bespoke injection; omitted when `parts: []`
4. **How will I be marked?** — one `<details>` per rubric row; summary shows criterion + marks + LO pills; body shows HD/D/C/P/N band table with range and descriptor; no JavaScript required
5. **Submission** — instruction list + prominent submit button
6. **Support** — HD callout + flexible portal button

**Schema** — `assessmentTasks` array on each unit JSON:

`due`, `duePartA`, and `flexiblePortal` are now stored inside a `trimesterDates` object keyed by trimester identifier (e.g. `T1-2026`). All render functions in `blocks.js` read from `task.trimesterDates[triKey]`; fall back gracefully to null if key absent. `renderAssessmentPage` now requires `forTri` and `forYear` — generator shells include these.

```json
{
  "id": "AT1",
  "title": "...",
  "weighting": 50,
  "length": "2,000 words (equivalent) +/- 10%",
  "trimesterDates": {
    "T1-2026": {
      "due": "2026-03-29",
      "duePartA": null,
      "flexiblePortal": { "label": "...", "url": "...", "opensDate": "2026-03-27", "closesDate": "2026-04-05" }
    },
    "T2-2026": { "due": null, "duePartA": null, "flexiblePortal": null }
  },
  "learningOutcomes": ["LO1", "LO2"],
  "aitslStandards": ["2.1.1", "3.3.1"],
  "rationale": "...",
  "aim": "...",
  "links": { "rubric": null, "taskFiles": null, "submit": null, "forum": null, "video": null },
  "parts": [
    {
      "id": "A", "title": "...", "marks": 20, "wordCount": "~300 words",
      "description": "...", "requirements": ["..."], "critique": ["..."],
      "resources": [{ "label": "...", "url": "..." }],
      "loLinks": ["LO1"], "bespoke": "discipline-tab-switcher",
      "guidanceNotes": ["Additional guidance paragraph shown after requirements."]
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
- AT1: fully populated — rationale, aim, 4 parts (A/B/C/D), 7 criteria, 7-row rubric (A, B1, B2, C1, C2, C3, D) with all 35 descriptors, submission instructions; `trimesterDates.T1-2026.due` = 2026-03-29 ✅; T2-2026 and T3-2026 stubs present (due null — pending); links: rubric ✅, taskFiles ✅, submit ✅, forum ✅, video null
- AT2: fully populated — rationale, aim, parts:[] (holistic), 4 criteria with bullets/colors, 4-row rubric with all 20 band descriptors, HD callout, submission instructions; `trimesterDates.T1-2026.due` = 2026-05-03 ✅; T2-2026 and T3-2026 stubs present; links: rubric null, taskFiles ✅, submit ✅, forum null, video ✅

**EDSE358 assessmentTasks — current state:**
- AT1 "Teaching, Learning and Assessment Design" (60%): title/LOs/AITSL ✅; `trimesterDates.T1-2026.due` = 2026-04-05, `duePartA` = 2026-03-22 ✅; T2-2026 due dates null — pending; **9-row rubric fully populated** (A, B1, B2, B3, B4, C1, C2, D1, D2 — 100 marks, 45 band descriptors) ✅; **5 parts: A(20), B(20), C(50), D1(5), D2(5) = 100 marks** ✅; Part B has `guidanceNotes` (4 items) ✅; Part D2 has `guidanceNotes` (1 item) ✅; rationale null, aim null; parts A/C have null descriptions; criteria empty; links all null; submission instructions empty
- AT2 "Resource Curation and Critical Analysis" (40%): title/LOs/AITSL ✅; `trimesterDates.T1-2026.due` = 2026-05-04 ✅; T2-2026 stub present (due null — pending); **6-row rubric fully populated** (A1, A2, A3, B1, B2, C — 100 marks, 30 band descriptors) ✅; rationale null, aim null; parts [] (holistic); criteria empty; links all null; submission instructions empty

**EDSE362 assessmentTasks — current state:**
- AT1 and AT2: `trimesterDates.T2-2026` populated with due dates ✅ (AT1 due 2026-07-26, AT2 due 2026-09-06); title null, rationale null, aim null, all links null, rubric empty — to populate before T2 2026 go-live

**AT2 note (EDSE357):** `parts: []` because AT2 is holistically assessed. The "What do I need to do?" section is omitted; the aim describes all requirements.

**Bespoke components** (`moodle-blocks/bespoke/`):
- `discipline-tab-switcher.html` — tab UI for 5 NSW science disciplines (AT1 Part A)
- `riskassess-callout.html` — RiskAssess login callout with credentials (AT1 Part B)
- Fetched async; on failure, a styled placeholder is shown (not a crash)

### Phase 3C — Pre-Submission Checklist block ✅ COMPLETE

`renderPresubmissionChecklist({ forUnit, forTask })` — 9th render function. Fetches the static HTML template from `templates/presubmission-checklist-{UNIT}-{TASK}.html` and wraps it in a collapsible `<details class="lx-cl-wrap">` section. Scripts injected via `innerHTML` are re-executed via `document.createElement('script')` + `replaceWith` pattern (required because scripts in `innerHTML` do not auto-execute).

- Container: `<div id="lxdune-presubmission-checklist"></div>`
- Template files: `templates/presubmission-checklist-EDSE357-AT1.html`, `…-AT2.html`, `…-EDSE358-AT1.html`
- Each template is a self-contained HTML fragment with scoped `<style>` and an IIFE `<script>`
- Renders a graceful "not yet available" message if the template fetch fails (HTTP 404 or other error)
- Generator shell type: `presubmission-checklist`; test harness tab: **Checklist**
- **Note:** The current implementation fetches static HTML templates. A config-driven refactor (`renderChecklistBlock`) is planned — see ACTION-PLAN.md item 15. Do not write a fourth static template before doing the refactor.

**Templates available:**

| Template file | Unit | Task | Items |
|---|---|---|---|
| `presubmission-checklist-EDSE357-AT1.html` | EDSE357 | AT1 | 11 (Parts A–D) |
| `presubmission-checklist-EDSE357-AT2.html` | EDSE357 | AT2 | 11 (4 criteria) |
| `presubmission-checklist-EDSE358-AT1.html` | EDSE358 | AT1 | 19 (Parts A–C, D1, D2) — updated 2026-05-21 to reflect D→D1/D2 split |

### Phase 3E — Navigation Blocks ✅ COMPLETE (deployed 2026-05-19; contacts section added 2026-05-21)

`renderUnitKeyInfo({ forUnit, forTri, forYear })` — 11th render function. Renders a unit homepage navigation panel:
- **Banner:** `<img>` from `unitCfg.bannerUrl`; falls back to a themed placeholder div (unit code + name) when null
- **Key links:** Bootstrap-style full-width buttons from `unitCfg.keyLinks[]`; disabled span when `url: null`
- **Contacts:** toggleable coordinator/lecturer section from `unitCfg.contacts`; rendered only when at least one name is non-null
- **Due date chips:** one row per `assessmentTask` with a due date — coloured chip (green >14d, amber 7–14d, red <7d/today, teal when flexible portal open, grey when submitted/closed), optional "Open portal" link
- **Support callout:** teal left-border box from `unitCfg.supportCallout`; omitted when null

`renderAssessmentStatus({ forUnit, forTri, forYear })` — 12th render function. Renders a responsive card grid (auto-fit minmax 260px):
- One card per `assessmentTask` — title, meta line (date · weighting · length), status chip, LO colour pills, action pills (Rubric, Task files, Submit, flexible portal, Q&A forum)
- Status chip colours are **semantic** (not theme colours): green `#d4edda/#155724`, amber `#fff3cd/#856404`, red `#f8d7da/#721c24`, teal `#d0f0ec/#0e5a52`, grey `#e2e3e5/#383d41`

**Unit JSON schema additions (all three units):**
```json
"bannerUrl": "https://thatswhatsnext.github.io/LXDUNE/assets/banners/EDSE357-banner.svg",
"supportCallout": "Anything going on that may impact your success in this unit?...",
"keyLinks": [
  { "label": "Unit Outline",      "url": "https://...", "external": false },
  { "label": "Learning Materials","url": "https://...", "external": false },
  { "label": "Assessment Portal", "url": "https://...", "external": false }
],
"contacts": {
  "coordinator": { "name": "Steve Grant", "email": "sgrant39@une.edu.au" },
  "lecturer":    { "name": null, "email": null }
}
```

- `bannerUrl` and all three `keyLinks` URLs populated for EDSE357 ✅, EDSE358 ✅, and EDSE362 ✅
- `contacts.coordinator` populated for all three units ✅; `contacts.lecturer` null — populate when confirmed
- Generator shell types: `unit-key-info`, `assessment-status`
- Test harness tab: **Navigation** (side-by-side preview of both blocks)
- Template reference files: `templates/unit-key-info.html`, `templates/assessment-status.html`
- Shell files: `docs/EDSE357-navigation-shells.html`, `docs/EDSE358-navigation-shells.html` (git-ignored)

### Phase 3D — Course Hub block ✅ COMPLETE

`renderCourseHub({ forUnit, forTri, forYear })` — 10th render function. Renders all teaching weeks (1–8) as CSS-only collapsible `<details>/<summary>` rows. Each row shows the topic chip, week number, title, and (when expanded) announcement intro, live session focus, and tasks list. Non-teaching weeks (9–14) are excluded via the `NO_TEACHING` set.

- Container: `<div data-lx-block="course-hub"></div>` (attribute selector, not ID)
- CSS: all theme colours via `var(--lx-*)` custom properties
- Generator shell type: `course-hub`; test harness tab: **Course Hub**
- Verified in test harness for EDSE357 and EDSE358 on 2026-05-17

### Phase 4 — Refactor whatson.js and autovideos.js ✅ COMPLETE (merged to main; in production)

Both live scripts refactored to read from `config/units/*.json` instead of embedded static data. Sandpit-tested and merged to `main` 2026-05-17 (merge commit `449164f`). In production.

**`autovideos/autovideos.js` — production state (main @ `bfba196`):**
- Optional `containerId` parameter added: if provided, uses `getElementById(containerId)`; if absent, falls back to `getElementsByClassName('embed-container')[0]` for backwards compatibility with all existing live Moodle shells. **This parameter is sandpit-only** — generated production shells do not include it.
- `setUpVideos` is `async`; fetches `${BASE}config/units/${unit}.json`
- Reads `unitCfg.videoInterval ?? 2` for weekly/fortnightly interval
- Builds video sequence from `Object.keys(unitCfg.weeks).sort().map(k => unitCfg.weeks[k].video ?? 'DGIXT7ce3vQ')`
- On fetch failure: checks `VideoURLs[unit]` legacy class; if found, uses it with `console.warn`; if not, shows "Video unavailable — please refresh"
- `VideoURLs` static class preserved at bottom of file behind `/* LEGACY FALLBACK — EDIT units only. */` comment; covers EDIT415/425/426/513/517/518/521 with fortnightly interval (hardcoded 2)

**`whatson/whatson.js` changes (commit `de0894c`):**
- `displayWhatsOn` is now `async`; fetches `${BASE}config/units/${unitKey}.json`
- On fetch failure: heading → "Content unavailable — please refresh the page.", details cleared — no silent fallback to a wrong unit
- `Events` static class removed; `NO_TEACHING_WEEKS` constant replaces `Events.noTeachingWeeks`
- `portalLink()` null guard: returns plain text when `assessmentPortalUrl` is null
- `week0Message` handled as string (JSON) or legacy array — fixes pre-existing `undefined` paragraph bug
- JSON week key lookup: `unitCfg.weeks[String(thisWeek)]` (JSON keys are strings, not integers)

---

## Sandpit test — 2026-05-17 ✅ PASSED

- All 7 week-block render functions verified in Moodle sandpit environment
- GitHub Pages switched to serve from `dev` branch (was `main`)
- EDSE358 T1 2026 week 7 used as reference dataset (most complete week)
- Verified: CSP compatibility, `import.meta.url` resolution, Coming soon chips for null links, purple/cyan theme rendering

---

## Shell snippet files

Pre-generated copyable Moodle shell snippets. Open in a browser — each shell has a Copy button. Git-ignored (pattern `/docs/*-shells.html`); local use only.

| File | Copyable shells | Placeholder entries | Generated |
|---|---|---|---|
| `docs/EDSE358-T1-2026-shells.html` | 38 | 2 (AT1/AT2 checklists) | 2026-05-19 |
| `docs/EDSE357-T1-2026-shells.html` | 37 | — | 2026-05-18 |
| `docs/EDSE358-navigation-shells.html` | 2 | — | 2026-05-19 (rev 2) |
| `docs/EDSE357-navigation-shells.html` | 2 | — | 2026-05-19 (rev 2) |

⚠️ **EDSE358 shells are stale** — AT1 parts have changed (D split into D1/D2; new guidanceNotes rendered; new rubric descriptors). Regenerate from `generate/index.html` before deploying updated AT1 assessment page shells to Moodle.

---

## Unit configs — current state

### EDSE357 — Science Education 11–12: Curriculum and Pedagogy

- **Live:** T1 2026, Wednesdays 5:30–6:30pm
- **Trimesters configured:** T1-2026
- **Zoom (T1-2026):** configured ✅
- **Theme:** blue/teal — `primary: #1f6fb2`, `accent: #25797F`, `pill: #DAF0F7`, `pillBorder: #cbe6ee`
- **bannerUrl:** `assets/banners/EDSE357-banner.svg` ✅
- **keyLinks:** Unit Outline ✅, Learning Materials ✅, Assessment Portal ✅
- **contacts:** coordinator Steve Grant ✅; lecturer null
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Weeks 9–14 and week 0:** minimal (non-teaching); videos set to `DGIXT7ce3vQ`
- **Links (all weeks 1–8):** all `null` — content links not yet published; all render as Coming soon chips
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentTasks:** AT1 and AT2 — fully populated including 55 rubric descriptors ✅; `trimesterDates.T1-2026` dates populated ✅; T2-2026 and T3-2026 stubs present (due null — pending)
  - AT1 links: rubric ✅, taskFiles ✅, submit ✅, forum ✅, video null
  - AT2 links: rubric null ⚠️, taskFiles ✅, submit ✅, forum null, video ✅; T1-2026 flexiblePortal.url null (past-due)
- **assessmentFiles (T1-2026):** all discipline task/marking URLs `null`
- **T1 2026 status:** both AT1 (due 2026-03-29) and AT2 (due 2026-05-03) are past due. Unit is in PE/assessment period.

### EDSE358 — Science Education 11–12: Plan, Assess and Report

- **Live:** T1 2026, Thursdays 5:30–6:30pm; T2 2026 starts 2026-06-22
- **Trimesters configured:** T1-2026 ✅, T2-2026 ✅
- **Zoom:** T1-2026 ✅; T2-2026 ✅ (same meeting ID). Week-level `links.zoom` null on all weeks — resolved from `trimesterConfig[triKey].zoom`.
- **Theme:** purple/cyan — `primary: #7C5DB6`, `accent: #4FA9B5`, `pill: #EDE8FB`, `pillBorder: #c9bef5`
- **bannerUrl:** `assets/banners/EDSE358-banner.svg` ✅
- **keyLinks:** Unit Outline ✅, Learning Materials ✅, Assessment Portal ✅
- **contacts:** coordinator Steve Grant ✅; lecturer null
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Alignment improvement fields (all now rendered — ACTION-PLAN item 18 ✅):**
  - `orientationNote` → weeks 4 (Module 3B), 5 (Module 4A) — rendered by `renderOrientationNote` (fn 13)
  - `forumPrompts` → weeks 4 (3 prompts), 5 (2 prompts), 6 (2 prompts), 8 (3 prompts) — rendered by `renderForumPrompts` (fn 14)
  - `synthesisTemplate` → week 6 — lecturer-only output in generator "Post-forum synthesis" shell type
  - `workedExample` → week 6 — rendered by `renderWorkedExample` (fn 15) as collapsible `<details>`
  - `guidanceNotes` on AT1 parts → Part B (4 items), Part D2 (1 item) — rendered in `renderAssessmentPage` after requirements (divider + accent heading + → paragraphs)

- **Links by week** (zoom always null at week level — resolved from trimesterConfig):

| Week | Live links | Null links |
|---|---|---|
| 1 (Module 1) | — | all |
| 2 (Module 2) | — | all |
| 3 (Module 3A) | forum, materials, liveHub | lecture, slides, zoom, recording |
| 4 (Module 3B) | lecture, slides, forum, materials, liveHub | zoom, recording |
| 5 (Module 4A) | lecture, forum, materials, liveHub | slides, zoom, recording |
| 6 (Module 4B) | forum, materials + 2 additionalLectures ✅ | lecture, slides, zoom, liveHub, recording |
| 7 (Module 4C) | forum, materials + 2 additionalLectures ✅ | lecture, slides, zoom, liveHub, recording |
| 8 (Module 4D) | lecture, forum, materials ✅ | slides, zoom, recording, liveHub |

- **assessmentFiles (T1-2026):** AT1: all null; AT2: all discipline files resolved ✅
- **assessmentTasks — AT1 structure (post-audit):**
  - 5 parts: A(20), B(20), C(50), D1(5), D2(5) — total 100 marks ✅
  - Part D split: D1 = "Planning timely and purposeful feedback" (5 marks, 5 requirements); D2 = "Reflective self-assessment" (5 marks, 2 requirements)
  - 9-row rubric: A, B1, B2, B3, B4, C1, C2, D1, D2 — 100 marks, 45 band descriptors ✅
  - B1 C/P/N descriptors updated with ATSI differentiation language (G5)
  - B2 HD descriptor: replaced with resource-range + ICT + safety/CSIS language (G8+G3); C/P/N updated with safety language (G3)
  - B3 HD: activity-range sentence appended (G7)
  - B4 HD: evaluation-strategy sentence appended (G4)
  - D1 rubric: new feedback-planning descriptors across all 5 bands
  - D2 rubric: new reflective-practice descriptors across all 5 bands
- **T1 2026 status:** AT1 Part A (due 2026-03-22), Parts B/C/D (due 2026-04-05), AT2 (due 2026-05-04) — all past due. Unit in PE/assessment period.

### EDSE362 — Science Education 11–12: Curriculum, Pedagogy and Inclusive Practice

- **Live:** T2 2026, Wednesdays 5:30–6:30pm (starts 2026-06-22)
- **Trimesters configured:** T2-2026 ✅
- **Zoom (T2-2026):** `null` — not yet created; add to `trimesterConfig.T2-2026` when meeting is set up
- **Theme:** green/warm gold — `primary: #2E7D52`, `accent: #E3B089`, `pill: #E8F5EE`, `pillBorder: #b8dcc8`
- **bannerUrl:** `assets/banners/EDSE362-banner.svg` ✅
- **keyLinks:** Unit Outline ✅, Learning Materials ✅, Assessment Portal ✅ — all three populated ✅ (updated 2026-05-21)
- **contacts:** coordinator Steve Grant ✅; lecturer null
- **Learning outcomes:** LO1–LO6 ✅ (added 2026-05-21)
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅; `resources: []` present on each week (empty arrays, ready to fill)
- **Videos (weeks 1–8):** all `null` — will default to `DGIXT7ce3vQ` until real IDs are added
- **Links (all weeks):** all `null`
- **assessmentTasks:** `trimesterDates.T2-2026` due dates ✅ (AT1 due 2026-07-26, AT2 due 2026-09-06); title null, rationale null, parts null, criteria null, rubric empty — to be populated before go-live
- **Constructive alignment map:** static template at `templates/constructive-alignment-map.html` ✅; generic reusable version at `templates/constructive-alignment-map-generic.html` ✅; config-driven rendering planned — ACTION-PLAN item 16

---

## Config schema — week object

Teaching weeks (1–8) follow this shape. All three units conform to this schema. EDSE358 adds `workflow`, `additionalLectures`, `synthesisTemplate`, `workedExample`, `orientationNote`, and (on week 8) `extension` as additional fields. `forumPrompts` is present on EDSE358 weeks 4, 5, 6, 8.

```json
"4": {
  "item": "Module 3B",
  "title": "Full topic title",
  "live": "🎤 Live Session",
  "notes": ["Optional note shown on the week tile"],
  "assessments": [
    { "name": "Assessment Task 1", "due": "2026-03-22" }
  ],
  "announcementBody": {
    "intro": "Opening paragraph.",
    "focus": "This week's focus — second paragraph.",
    "keyIdea": "A key idea this week is… (stored but not yet rendered)"
  },
  "orientationNote": "Framing paragraph shown at top of module — stored, not yet rendered.",
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
  "forumPrompts": ["Prompt 1.", "Prompt 2.", "Prompt 3."],
  "synthesisTemplate": "Post-forum synthesis template (lecturer tool — not student-facing).",
  "workedExample": "Worked example text supporting module activity — stored, not yet rendered.",
  "resources": [
    { "category": "UDL", "label": "Resource label", "url": "url_or_null", "type": "link" }
  ],
  "video": "youtubeVideoId"
}
```

`null` links always render as Coming soon chips. Non-teaching weeks (9–14) only need `item`, `title`, `video`, and optionally `assessments`.

**Rendered alignment fields (ACTION-PLAN item 18 ✅ — merged to main 2026-05-21):**
- `orientationNote` — rendered by `renderOrientationNote` as a blue left-border info box with "Unit context" label
- `forumPrompts` — rendered by `renderForumPrompts` as a numbered list with accent heading
- `synthesisTemplate` — NOT student-facing; outputs as plain text in generator "Post-forum synthesis" shell type for lecturer use
- `workedExample` — rendered by `renderWorkedExample` as a CSS-only collapsible `<details>` section; `\n` separates paragraphs
- `guidanceNotes` (on parts) — rendered in `renderAssessmentPage` after `requirements` block: divider + "Additional guidance" heading (accent colour, uppercase 0.85em) + `→` prefixed paragraphs (0.9em)

---

## Test harness

`test/index.html` — run locally via `python3 -m http.server 8000` from repo root, then open `http://localhost:8000/test/`.

- **Controls:** unit, year, trimester, week dropdowns + date override field
- **Week dropdown:** populated with titles from the unit config on unit change
- **Theme switching:** changing the unit dropdown repaints all blocks immediately via CSS custom properties
- **All 10 week-blocks** re-render immediately on any control change (150ms debounce): announcement, workflow, lecture, live-hub, assessment-downloads, outcomes, resource-directory, orientation-note, forum-prompts, worked-example
- **Assessment tab:** task selector (AT1/AT2) renders the full assessment page via `renderAssessmentPage`
- **Course Hub tab:** renders all weeks 1–8 for the selected unit via `renderCourseHub`
- **Checklist tab:** task selector (AT1/AT2) renders the pre-submission checklist via `renderPresubmissionChecklist`
- **Navigation tab:** side-by-side preview — `renderUnitKeyInfo` (left) and `renderAssessmentStatus` (right)
- **Cache note:** after updating `blocks.js` exports, hard-refresh (Cmd+Shift+R) before testing

---

## Generator

`generate/index.html` — run locally or via GitHub Pages URL. Select unit, year, trimester, page type, click Generate. Produces copyable shell snippets for all 15 render function shell types plus the "Post-forum synthesis" lecturer tool. Requires HTTP (not `file://`).

**Shell types available:**
- All week-block types (announcement, workflow, lecture, live-hub, assessment-downloads, outcomes, resource-directory)
- assessment-page (task selector), presubmission-checklist (task selector), course-hub
- unit-key-info, assessment-status
- orientation-note, forum-prompts, worked-example (week-aware date-driven renders)
- **synthesis-template** — week selector dropdown; outputs `synthesisTemplate` plain text for lecturer personalisation (not a render shell)

Pre-generated shell files are in `docs/` (git-ignored). See Shell snippet files section above.

---

## Trimester start dates

| Year | T1 | T2 | T3 |
|---|---|---|---|
| 2026 | 2026-02-23 | 2026-06-22 | 2026-10-19 |
| 2027 | 2027-02-22 | 2027-06-21 ⚠️ | 2027-10-18 ⚠️ |

T2 2026 start `2026-06-22` is confirmed. ⚠️ 2027 dates are estimates — confirm against UNE academic calendar if needed for future trimesters.

---

## Known issues

1. **EDSE357 — all week links null:** unit is live but content links not yet added; all render as Coming soon chips. Populate as content is published.
2. **EDSE358 assessmentTasks — rationale, aim, part descriptions (A and C), links all null:** rubric and parts structure fully populated; remaining content pending before assessment pages go live.
3. **EDSE357 AT2 rubric link null:** add URL when rubric PDF is published to Moodle.
4. **EDSE358 missing week links:** weeks 1–2 (all), week 3 (lecture/slides/recording), week 6 (lecture/slides/liveHub/recording), week 7 (lecture/slides/liveHub/recording), week 8 (slides/recording/liveHub).
5. **EDSE358 AT1 assessmentFiles — all null:** task and marking URLs not yet uploaded for AT1 disciplines.
6. **`DGIXT7ce3vQ` — third-party placeholder video:** used for PE weeks (9–14) in all unit configs and EDIT* legacy arrays. Not university-owned — replace when a stable owned video is available.
7. **`announcementBody.keyIdea`:** stored in some EDSE358 weeks but not rendered. Future enhancement only.
8. **EDSE362 — content not yet populated:** live T2 2026 (starts 2026-06-22); due dates ✅, keyLinks ✅, LOs ✅; all week links, videos, zoom, and assessmentTask content (title/rationale/aim/rubric) still null — populate before go-live.
9. **EDSE362 Zoom not yet created:** add Zoom meeting ID and URL to `trimesterConfig.T2-2026` when meeting is set up.
10. **Pre-submission checklist — static templates:** current implementation fetches static HTML from `templates/`. Refactor to config-driven schema before writing a fourth checklist — see ACTION-PLAN.md item 15.
11. **EDSE358 T2-2026 assessment due dates null:** `trimesterDates.T2-2026.due` is null for both AT1 and AT2. Populate once Steve confirms T2 due dates — then regenerate Moodle shells with `forTri: "T2"` and `forYear: "2026"`.
12. **Existing Moodle shells for renderAssessmentPage show no due date:** shells deployed to Moodle for T1 2026 do not pass `forTri`/`forYear`. Both T1 ATs are past due so this is low impact. New T2 shells from the generator will include tri/year correctly.
13. ~~**EDSE358 alignment fields stored but not rendered**~~ — ✅ RESOLVED 2026-05-21. All five fields now rendered: `renderOrientationNote`, `renderForumPrompts`, `renderWorkedExample` (fns 13–15); `guidanceNotes` in `renderAssessmentPage`; `synthesisTemplate` in generator admin tool.
14. **EDSE358 shells stale post-audit:** AT1 assessment page shell and presubmission checklist shell in `docs/EDSE358-T1-2026-shells.html` pre-date the D→D1/D2 split, new rubric descriptors, and guidanceNotes rendering. Regenerate from `generate/index.html` before redeploying. The checklist template has been updated (D1: 5 items, D2: 2 items) but the Moodle shell for the checklist render block also needs regeneration.
15. **EDSE362 lecturer name null:** `contacts.lecturer.name` is null across all three units. Populate when confirmed.

---

## Next tasks in priority order

See `docs/ACTION-PLAN.md` for the full prioritised list with checkboxes. Summary:

1. **EDSE358 T2 due dates** — Steve to provide T2 2026 due dates for AT1 and AT2; populate `trimesterDates.T2-2026`; regenerate Moodle shells (ACTION-PLAN item 12).
2. **Regenerate EDSE358 AT1 shell** — D→D1/D2 split, rubric changes, and new guidanceNotes rendering mean the deployed assessment page shell is stale. Regenerate from generator and redeploy to Moodle (known issue 14).
3. **EDSE362 go-live prep** — Zoom setup; assessmentTask title/rationale/aim/parts/rubric; lecturer name; video IDs; week links — all before T2 2026 starts 2026-06-22 (ACTION-PLAN item 17).
4. **EDSE358 missing week links** — weeks 1–2 (all), weeks 3/6/7/8 (partial); add as content is published (ACTION-PLAN item 7).
5. **EDSE357 week links** — add lecture/slides/recording/forum/materials/liveHub as content is published (ACTION-PLAN item 10).
6. **Checklist refactor** — before writing a fourth static checklist template, do the config-driven refactor (ACTION-PLAN item 15).
7. **Alignment map renderer** — `renderAlignmentMap()` as 16th render function, reading from `unitCfg.alignmentMap`; static template reference exists at `templates/constructive-alignment-map.html` (ACTION-PLAN item 16).
8. **Apply alignment fields to EDSE357/EDSE362** — write `orientationNote`, `forumPrompts`, `workedExample`, `synthesisTemplate`, `guidanceNotes` content for those units; rendering is already live (ACTION-PLAN item 19).

---

## Session notes

### 2026-05-21 — ACTION-PLAN item 18 complete: render alignment fields

**Completed this session (feature/render-alignment-fields → dev → main, commit `2db8ab8`):**

**Three new render functions added to `blocks.js`:**
- `renderOrientationNote` (fn 13) — `#lxdune-orientation-note`; blue left-border info box with "Unit context" label; reads `week.orientationNote`; renders nothing if absent
- `renderForumPrompts` (fn 14) — `#lxdune-forum-prompts`; numbered list with accent "Forum discussion prompts" heading; reads `week.forumPrompts[]`; renders nothing if absent/empty
- `renderWorkedExample` (fn 15) — `#lxdune-worked-example`; CSS-only collapsible `<details>` labelled "Worked example"; reads `week.workedExample`; splits on `\n` for paragraphs; renders nothing if absent

**`guidanceNotes` rendered in `renderAssessmentPage`:**
- After `resHtml` in the parts map: horizontal divider + "Additional guidance" label (0.85em, uppercase, accent colour) + `→` prefixed paragraphs (0.9em, 4px margin)
- Now live for EDSE358 AT1 Part B (4 items) and Part D2 (1 item)

**`synthesisTemplate` in generator (lecturer-only):**
- New "Post-forum synthesis (lecturer)" shell type in `generate/index.html`
- New week selector row (shown only for this type); populated from `unitCfg.weeks[]`
- Outputs `synthesisTemplate` as plain text in a textarea for lecturer to personalise — NOT a render shell
- Placeholder message if field absent in config

**Three new shell types added to `allShells` list in generator:** orientation-note, forum-prompts, worked-example (all date-aware, appear in "All shells" output)

**Checklist template `EDSE358-AT1` updated:**
- Old "Part D — Reflection" (3 items: D1/D2/D3 as item labels) removed
- Replaced with two `<details>` sections:
  - D1 "Planning timely and purposeful feedback for students" (5 marks) — 5 items (D1a–D1e): timing, form, differentiation (incl. ATSI/EAL-D), teaching decisions, outcome alignment
  - D2 "Reflective self-assessment" (5 marks) — 2 items (D2a–D2b): identifying specific learning, concrete future teaching example
- Old items were generic reflection prompts predating the D→D1/D2 structural split; new items map directly to AT1 Part D1/D2 requirements

**Test harness updated:**
- 3 new imports and container IDs; 3 new render calls in `renderAll` Promise.all; 3 new HTML container sections in Week Blocks tab; 3 IDs added to `markEmptyIfBlank` list

**Key design decisions:**
- New render functions are standalone blocks (not embedded in existing functions) — lecturer pastes each separately into Moodle, giving placement control
- `renderOrientationNote` and `renderForumPrompts` each render nothing (empty `innerHTML`) rather than a placeholder when data is absent — keeps Moodle pages clean for units that don't have these fields
- CSS constants for new functions follow the existing pattern: named top-level constants (`ORIENTATION_NOTE_CSS`, `FORUM_PROMPTS_CSS`, `WORKED_EXAMPLE_CSS`) injected once via `injectStyles()`

### 2026-05-21 — EDSE358 alignment audit G1–G8; alignment improvement fields; EDSE362 updates

**Completed this session:**

**EDSE362 updates (merged to main):**
- T2-2026 dates corrected (was incorrectly recorded as T2-2027 in some config)
- Learning outcomes LO1–LO6 added to EDSE362 ✅
- `keyLinks` URLs populated for EDSE362 (Unit Outline, Learning Materials, Assessment Portal) ✅

**renderUnitKeyInfo — contacts section (merged to main):**
- Toggleable coordinator/lecturer section added to `renderUnitKeyInfo`
- `contacts` schema added to all three unit JSONs: `{ coordinator: { name, email }, lecturer: { name, email } }`
- Steve Grant set as coordinator in all three units; lecturer null across all units
- Contacts section is rendered only when at least one name is non-null

**Constructive alignment map templates (merged to main):**
- `templates/constructive-alignment-map.html` — EDSE362-specific static template
- `templates/constructive-alignment-map-generic.html` — reusable version
- Config-driven rendering deferred to ACTION-PLAN item 16

**EDSE358 alignment improvement fields (`feature/edse358-alignment-improvements` → main, commit `d5300ac`):**
New schema fields added and populated:
- `orientationNote` (week-level string): weeks 4 (Module 3B — ICT/ATSI framing + safety) and 5 (Module 4A — 4A–4D spiral framing)
- `forumPrompts` (week-level array): weeks 4 (3 prompts: ICT tools, ATSI embedding, activity types), 6 (2 prompts: alignment analysis, evaluation strategy), 8 (3 prompts: rubrics, feedback, senior science challenges)
- `synthesisTemplate` (week-level string): week 6 — post-forum synthesis template for lecturer use
- `workedExample` (week-level string): week 6 — Chemistry (strong alignment) + Biology (partial alignment) contrasting examples
- `guidanceNotes` (parts-level array): AT1 Part B (4 items: ICT, ATSI, unit sequence, formative assessment frequency); AT1 Part D2 (1 item: analytical reflection guidance)

None of these fields are rendered by blocks.js — see ACTION-PLAN item 18.

**EDSE358 alignment audit G1–G8 (`feature/edse358-rubric-gaps` → main, commits `055cc7d` + `9e3b9e9`):**
- **G1:** AT1 Part D (10 marks, "Reflection") split into:
  - D1: "Planning timely and purposeful feedback for students" (5 marks, 5 requirements, loLinks: LO4)
  - D2: "Reflective self-assessment" (5 marks, 2 requirements, loLinks: LO4, inherits guidanceNotes)
  - Rubric: new D1 (feedback planning) and D2 (reflective practice) descriptors across all 5 bands each
- **G2:** Week 8 (Module 4D): 4 new `liveSessionTasks` appended (feedback-writing formative activity on anonymised sample); 3 `forumPrompts` added (rubrics, feedback design, senior science challenges)
- **G3:** B2 rubric C/P/N: safety language appended. Week 4 `orientationNote`: safety-as-pedagogy sentence appended.
- **G4:** B4 rubric HD: evaluation strategy sentence appended. Week 6 `forumPrompts`: evaluation strategy prompt added.
- **G5:** B1 rubric C/P/N: ATSI-specific differentiation language appended.
- **G7:** B3 rubric HD: range-of-activity-types sentence appended. Week 4 `forumPrompts`: activity-types audit prompt added.
- **G8:** B2 rubric HD: fully replaced with new text covering resource rationale, range of types, ICT, and safety.
- **G3+G8 tidy-up (`9e3b9e9`):** B2 HD de-duplicated — removed redundant "appropriate, engaging and safe" phrase; kept specific CSIS safety reference only.
- Final B2 HD: "Resources are intentionally selected to deepen conceptual learning… A range of resource types is evident… ICT use is purposeful… Safety considerations are explicitly addressed… with reference to relevant guidelines (e.g., CSIS), and resources are appropriate and engaging for the named cohort."

**Action plan updated:**
- Item 18 added to 🟢 section: "Render new alignment improvement fields in blocks.js" — spec for orientationNote, forumPrompts, workedExample, synthesisTemplate, guidanceNotes rendering

**Key design decisions:**
- `synthesisTemplate` is not student-facing. It belongs in the generator admin tool as a "Post-forum synthesis" shell type — the lecturer personalises the output before posting. It should never be rendered to students via blocks.js.
- AT1 Part D split (G1) uses Option B: two new parts (D1 + D2), each 5 marks, total unchanged at 10. loLinks changed from LO3/LO5 to LO4 for both — feedback planning and reflection are now explicitly linked to Assessment Knowledge.
- `guidanceNotes` was added to the `parts` schema to hold supplementary guidance paragraphs shown below `requirements` in the assessment page renderer. The field was populated in this session but the renderer doesn't read it yet.
- Week 8 `liveSessionTasks` append (G2): 4 new tasks added on top of existing 5 — first new task partially overlaps with existing "Work through the Module 4D materials in Moodle." Steve may want to consolidate; flagged but not merged since this is a content decision.

### 2026-05-19 — T2 2026 prep: per-trimester dates schema; Zoom from trimesterConfig

**Completed this session:**

- ACTION-PLAN.md audited and synced against repo state — items 2, 3, 9a/b/c marked complete (were done but unrecorded)
- EDSE358 week 8 item 7 table corrected: lecture/zoom/forum/materials confirmed live; slides/recording/liveHub still null
- `assessmentTasks` schema extended: flat `due`, `duePartA`, `flexiblePortal` replaced by `trimesterDates` object keyed by trimester (e.g. `T1-2026`) in all three unit JSONs
- Existing T1-2026 dates migrated into `trimesterDates.T1-2026` for EDSE357 and EDSE358
- T2-2026 stubs added to EDSE358 (both ATs); T2-2026 and T3-2026 stubs added to EDSE357; T2-2026 stub for EDSE362
- `blocks.js` `resolve()` updated: `zoomUrl` falls back to `week.links.zoom` if `trimesterConfig[triKey].zoom.url` is null
- `renderAssessmentPage`, `renderUnitKeyInfo`, `renderAssessmentStatus` extended to read from `trimesterDates[triKey]`
- EDSE358 week-level `links.zoom` nulled out for weeks 3–8
- T2-2026 `trimesterConfig` stub in EDSE358 populated with same Zoom meeting as T1-2026
- Generator `shellAssessment` updated to include `forTri` and `forYear` in output

**Key design decisions:**
- `trimesterDates` key format is `{forTri}-{forYear}` (e.g. `T1-2026`) — matches the `triKey` variable already used throughout `blocks.js`
- Zoom is now resolved from `trimesterConfig` only; week-level zoom is a fallback for edge cases only. Do not re-add zoom URLs to week `links` objects — keep them null
- EDSE357 `trimesterConfig` currently only has `T1-2026`. When T2 is confirmed, add a `T2-2026` entry (same pattern as EDSE358)

### 2026-05-19 — Navigation blocks; SVG banners; keyLinks; shells deployed

**Completed this session:**

- `renderUnitKeyInfo` (fn 11) and `renderAssessmentStatus` (fn 12) added to `blocks.js` on `feature/navigation-blocks`, merged to dev then main
- Unit JSON schema extended with `bannerUrl`, `supportCallout`, `keyLinks[]` on all three unit JSONs
- `keyLinks` URLs populated for EDSE357 and EDSE358; EDSE362 deferred (now done 2026-05-21)
- SVG banners created for all three units (`assets/banners/`), pushed to main, confirmed 200 on GitHub Pages
- `bannerUrl` set to live GitHub Pages URLs in all three unit JSONs
- Navigation shell files generated (git-ignored): `docs/EDSE357-navigation-shells.html`, `docs/EDSE358-navigation-shells.html`

**Key design decisions:**
- Navigation block status chip colours are semantic (green/amber/red/teal/grey), not theme colours — consistent across all units regardless of their branding
- `formatDateShort(d)` added as a utility alongside existing `formatDateAU` — returns "3 May 2026" format (no weekday) for compact display in navigation blocks
- `bannerUrl: null` falls back to a themed placeholder div showing unit code + name — never a broken image
- SVG banners served from `assets/banners/` on GitHub Pages; `bannerUrl` in unit JSON points to the live URL

### 2026-05-19 — renderPresubmissionChecklist; autovideos containerId; staff guide

**Key decisions:**
- `containerId` on `setUpVideos` is sandpit-only — the correct multi-shell test approach is separate Moodle labels, not custom IDs. Generated shells never include `containerId`.
- Static checklist templates are the current implementation. Do not write a fourth static template — refactor to config-driven first (ACTION-PLAN item 15).
- EDSE358 shells file regenerated: 38 copyable shells + 2 amber placeholder cards for AT1/AT2 checklists (pending refactor).

### 2026-05-18 — Rubric descriptors complete; shell files generated

**Key decisions:**
- AT1 Part C1 mark allocation corrected to 20 marks; band ranges set to match Part B1 (same mark value): HD 20–18, D 17–15, C 14–12, P 11–9, N 8–0
- EES task filename confirmed as `EES%20task%20.pdf` (trailing space in filename is intentional — matches actual file)

### 2026-05-17 — Production deployment: all phases complete

**Final dev→main merge (commit `449164f`):**
- All 4 phases complete and in sync: config layer, block renderer (9 functions + theme + assessment content system + Course Hub), Phase 4 (both live scripts config-driven)
- Sandpit passed: 5 shells tested — EDSE357/EDSE358 whatson ✅, EDSE357/EDSE358 autovideos (config fetch path) ✅, EDIT426 legacy fallback ✅
- GitHub Pages switched to `main`; all three live scripts verified 200

**Video placeholder issue identified during sandpit:**
- `DGIXT7ce3vQ` (used as PE-weeks fallback for all units and EDIT* arrays) is a third-party YouTube video. All teaching-week videos are owned/controlled and confirmed valid. The placeholder is the only third-party dependency and should be replaced when a suitable owned video is available.

---

## Critical constraints (always apply)

- **`whatson/whatson.js` and `autovideos/autovideos.js` are config-driven (Phase 4, in production).** Both are live for enrolled students. All changes follow `feature/* → dev → sandpit → main`.
- **Never commit directly to `main`.**
- **EDSE357 and EDSE358 are live with enrolled students.** Breaking changes are not acceptable. All changes go through dev and sandpit testing first.
- **`<\/script>` in shell template literals** — use `<\/script>` inside JavaScript strings to prevent the HTML parser from closing the outer script tag prematurely.
- **`import.meta.url`** — used in `blocks.js` to derive the config base URL dynamically. This means `blocks.js` works from any host without hardcoded URLs.
- **GitHub Pages is on `main`** — live URL is safe. Do not switch back to `dev` without a deliberate sandpit decision.
- **Zoom is resolved from `trimesterConfig`, not week-level `links.zoom`** — do not add Zoom URLs to individual week `links` objects. Keep them null.
