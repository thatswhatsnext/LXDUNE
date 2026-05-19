# LXDUNE — Claude Code Briefing

**Last updated:** 2026-05-19 (T2 2026 prep: per-trimester dates schema, Zoom driven from trimesterConfig, T2-2026 stub configured for EDSE358)  
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
  blocks.js                   ← ES module, 12 exported render functions
  bespoke/                    ← static HTML fragments injected by renderAssessmentPage
    discipline-tab-switcher.html
    riskassess-callout.html

generate/
  index.html                  ← admin tool: generates copyable Moodle shell snippets

test/
  index.html                  ← dynamic QA harness (local dev only)

templates/
  *.html                      ← 14 reference HTML components (static, not rendered)
                                 incl. presubmission-checklist-EDSE357-AT1/AT2 and EDSE358-AT1,
                                 unit-key-info.html, assessment-status.html

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

`dev` and `main` are **in sync** — all changes pushed and merged as of 2026-05-19.

### `main` (GitHub Pages source — production ✅)
Last merge: `ee6bbe1` (2026-05-19) — T2 2026 prep: per-trimester dates schema, Zoom driven from trimesterConfig, EDSE358 T2-2026 Zoom configured.
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

### Phase 3 — Block renderer ✅ COMPLETE (12 functions)

`moodle-blocks/blocks.js` — ES module with 12 exported render functions and a theme system.

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

`due`, `duePartA`, and `flexiblePortal` are now stored inside a `trimesterDates` object keyed by trimester identifier (e.g. `T1-2026`). All render functions in `blocks.js` read from `task.trimesterDates[triKey]`; fall back gracefully to null if key absent. `renderAssessmentPage` now requires `forTri` and `forYear` — generator shells include these. Existing Moodle shells without tri/year show no date (graceful).

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
- AT1: fully populated — rationale, aim, 4 parts (A/B/C/D), 7 criteria, 7-row rubric (A, B1, B2, C1, C2, C3, D) with all 35 descriptors, submission instructions; `trimesterDates.T1-2026.due` = 2026-03-29 ✅; T2-2026 and T3-2026 stubs present (due null — pending); links: rubric ✅, taskFiles ✅, submit ✅, forum ✅, video null
- AT2: fully populated — rationale, aim, parts:[] (holistic), 4 criteria with bullets/colors, 4-row rubric with all 20 band descriptors, HD callout, submission instructions; `trimesterDates.T1-2026.due` = 2026-05-03 ✅; T2-2026 and T3-2026 stubs present; links: rubric null, taskFiles ✅, submit ✅, forum null, video ✅

**EDSE358 assessmentTasks — current state:**
- AT1 "Teaching, Learning and Assessment Design" (60%): title/LOs/AITSL ✅; `trimesterDates.T1-2026.due` = 2026-04-05, `duePartA` = 2026-03-22 ✅; T2-2026 stub present (due null — pending); **8-row rubric fully populated** (A, B1, B2, B3, B4, C1, C2, D — 100 marks, 40 band descriptors) ✅; rationale null, aim null; parts A/B/C/D have marks but null descriptions; criteria empty; links all null; submission instructions empty
- AT2 "Resource Curation and Critical Analysis" (40%): title/LOs/AITSL ✅; `trimesterDates.T1-2026.due` = 2026-05-04 ✅; T2-2026 stub present (due null — pending); **6-row rubric fully populated** (A1, A2, A3, B1, B2, C — 100 marks, 30 band descriptors) ✅; rationale null, aim null; parts [] (holistic); criteria empty; links all null; submission instructions empty

**EDSE362 assessmentTasks — current state (empty stubs):**
- AT1 and AT2: `trimesterDates.T2-2027` present but all null; title null, rationale null, aim null, all links null, rubric empty — not live until T2 2027

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
| `presubmission-checklist-EDSE358-AT1.html` | EDSE358 | AT1 | 16 (Parts A–D) |

### Phase 3E — Navigation Blocks ✅ COMPLETE (deployed 2026-05-19)

`renderUnitKeyInfo({ forUnit, forTri, forYear })` — 11th render function. Renders a unit homepage navigation panel:
- **Banner:** `<img>` from `unitCfg.bannerUrl`; falls back to a themed placeholder div (unit code + name) when null
- **Key links:** Bootstrap-style full-width buttons from `unitCfg.keyLinks[]`; disabled span when `url: null`
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
]
```

- `bannerUrl` and all three keyLinks URLs populated for EDSE357 and EDSE358; EDSE362 `keyLinks` still null (not live until T2 2027)
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
- Optional `containerId` parameter added: if provided, uses `getElementById(containerId)`; if absent, falls back to `getElementsByClassName('embed-container')[0]` for backwards compatibility with all existing live Moodle shells. **This parameter is sandpit-only** — generated production shells do not include it. The correct fix for multi-shell test pages is separate Moodle labels, not custom container IDs.
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

**`config/units/*.json` additions:**
- `videoInterval: 1` added to EDSE357 and EDSE358 (weekly rotation)
- `videoInterval: 2` added to EDSE362 (fortnightly, default)

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

EDSE358 has 3 sections: course-level (5 shells + 2 amber placeholder cards for checklist refactor), per-module weeks 1–8 (32 shells), Module 4C resource directory (1 shell). EDSE357 has no resource directory shell (none configured). Navigation shell files contain Shell 1 (renderUnitKeyInfo) and Shell 2 (renderAssessmentStatus) for the course homepage.

---

## Unit configs — current state

### EDSE357 — Science Education 11–12: Curriculum and Pedagogy
- **Live:** T1 2026, Wednesdays 5:30–6:30pm
- **Trimesters configured:** T1
- **Zoom (T1-2026):** configured ✅
- **Theme:** blue/teal — `primary: #1f6fb2`, `accent: #25797F`, `pill: #DAF0F7`, `pillBorder: #cbe6ee`
- **bannerUrl:** `assets/banners/EDSE357-banner.svg` ✅ (blue gradient, teal accent bar, live on GitHub Pages)
- **keyLinks:** Unit Outline ✅, Learning Materials ✅, Assessment Portal ✅ — all three URLs populated
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Weeks 9–14 and week 0:** minimal (non-teaching); videos set to `DGIXT7ce3vQ`
- **Links (all weeks 1–8):** all `null` — content links not yet published; all render as Coming soon chips
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentTasks:** AT1 and AT2 — fully populated including 55 rubric descriptors ✅; `trimesterDates.T1-2026` dates populated ✅; T2-2026 and T3-2026 stubs present (due null — pending)
  - AT1 links: rubric ✅, taskFiles ✅, submit ✅, forum ✅, video null
  - AT2 links: rubric null ⚠️, taskFiles ✅, submit ✅, forum null, video ✅; T1-2026 flexiblePortal.url null (past-due)
- **assessmentFiles (T1-2026):** structure in place; all discipline task/marking URLs `null`
- **T1 2026 status:** both AT1 (due 2026-03-29) and AT2 (due 2026-05-03) are past due. Unit is in PE/assessment period.

### EDSE358 — Science Education 11–12: Plan, Assess and Report
- **Live:** T1 2026, Thursdays 5:30–6:30pm; T2 2026 starts 2026-06-22
- **Trimesters configured:** T1-2026 ✅, T2-2026 ✅
- **Zoom:** T1-2026 configured ✅; T2-2026 configured ✅ (same meeting ID as T1). Week-level `links.zoom` nulled out on all weeks — Zoom is now resolved entirely from `trimesterConfig[triKey].zoom`.
- **Theme:** purple/cyan — `primary: #7C5DB6`, `accent: #4FA9B5`, `pill: #EDE8FB`, `pillBorder: #c9bef5`
- **bannerUrl:** `assets/banners/EDSE358-banner.svg` ✅ (purple gradient, teal accent bar, live on GitHub Pages)
- **keyLinks:** Unit Outline ✅, Learning Materials ✅, Assessment Portal ✅ — all three URLs populated
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Weeks 9–14 and week 0:** minimal (non-teaching); videos set to `DGIXT7ce3vQ`
- **Links by week** (zoom now always null at week level — resolved from trimesterConfig):

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

- **assessmentFiles (T1-2026):**
  - AT1: all URLs `null`
  - AT2: rubric ✅, biology ✅, chemistry task ✅, chemistry marking ✅, EES task ✅, EES marking ✅, physics ✅ — **all discipline files now resolved** ✅
- **assessmentTasks:** rubric structures fully populated ✅; `trimesterDates.T1-2026` dates populated ✅; T2-2026 due dates null — pending Steve providing T2 dates; rationale/aim/part descriptions/links still null
- **T1 2026 status:** AT1 Part A (due 2026-03-22) and AT1 Parts B/C/D (due 2026-04-05) past due. AT2 (due 2026-05-04) past due. Unit is in PE/assessment period.

### EDSE362 — Science Education 11–12: Curriculum, Pedagogy and Inclusive Practice
- **Live:** T2 2027 (not yet live — future unit)
- **Trimesters configured:** T2
- **Zoom (T2-2027):** `null` — not yet created
- **Theme:** green/warm gold — `primary: #2E7D52`, `accent: #E3B089`, `pill: #E8F5EE`, `pillBorder: #b8dcc8`
- **bannerUrl:** `assets/banners/EDSE362-banner.svg` ✅ (green gradient, warm gold accent bar, live on GitHub Pages)
- **keyLinks:** all three URLs still `null` — populate before T2 2027 go-live
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅; `resources: []` present on each week (empty arrays, ready to fill)
- **Videos (weeks 1–8):** all `null` — will default to `DGIXT7ce3vQ` until real IDs are added
- **Links (all weeks):** all `null`; `assessmentPortalUrl: null` (no portal yet)
- **assessmentTasks:** schema-only stubs — AT1 (50%) and AT2 (50%) LOs set; title/due/rationale/aim/rubric all null
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
- **Course Hub tab:** renders all weeks 1–8 for the selected unit via `renderCourseHub`
- **Checklist tab:** task selector (AT1/AT2) renders the pre-submission checklist via `renderPresubmissionChecklist`
- **Navigation tab:** side-by-side preview — `renderUnitKeyInfo` (left) and `renderAssessmentStatus` (right)
- **Cache note:** after updating `blocks.js` exports, hard-refresh (Cmd+Shift+R) before testing

---

## Generator

`generate/index.html` — run locally or via GitHub Pages URL. Select unit, year, trimester, page type, click Generate. Produces copyable shell snippets for all 12 page types including Resource directory, Assessment page (with task selector), Course Hub, Unit Key Info, and Assessment Status. Requires HTTP (not `file://`).

Pre-generated shell files are in `docs/` (git-ignored). See Shell snippet files section above.

---

## Trimester start dates

| Year | T1 | T2 | T3 |
|---|---|---|---|
| 2026 | 2026-02-23 | 2026-06-22 | 2026-10-19 |
| 2027 | 2027-02-22 | 2027-06-21 ⚠️ | 2027-10-18 ⚠️ |

⚠️ 2027 T2 and T3 dates are estimates — confirm against the UNE academic calendar before EDSE362 goes live.

---

## Known issues

1. **EDSE357 — all week links null:** unit is live but content links not yet added; all render as Coming soon chips. Populate as content is published.
2. **EDSE358 assessmentTasks — rationale, aim, part descriptions, links all null:** rubric is fully populated; remaining content pending before assessment pages go live.
3. **EDSE357 AT2 rubric link null:** add URL when rubric PDF is published to Moodle.
4. **EDSE358 missing week links:** weeks 1–2 (all), week 3 (lecture/slides/recording), week 6 (lecture/slides/liveHub/recording), week 7 (lecture/slides/liveHub/recording), week 8 (slides/recording/liveHub).
5. **EDSE358 AT1 assessmentFiles — all null:** task and marking URLs not yet uploaded for AT1 disciplines.
6. **`DGIXT7ce3vQ` — third-party placeholder video:** used for PE weeks (9–14) in all unit configs and EDIT* legacy arrays. Not university-owned — replace when a stable owned video is available.
7. **`announcementBody.keyIdea`:** stored in some EDSE358 weeks but not rendered. Future enhancement only.
8. **EDSE362 — all null:** not live until T2 2027; all links, videos, zoom, and assessmentTasks are empty stubs.
9. **2027 T2/T3 start dates:** estimates — confirm against UNE academic calendar before EDSE362 goes live.
10. **Pre-submission checklist — static templates:** current implementation fetches static HTML from `templates/`. Refactor to config-driven schema before writing a fourth checklist — see ACTION-PLAN.md item 15.
11. **EDSE358 T2-2026 assessment due dates null:** `trimesterDates.T2-2026.due` is null for both AT1 and AT2. Populate once Steve confirms T2 due dates — then regenerate Moodle shells with `forTri: "T2"` and `forYear: "2026"`.
12. **Existing Moodle shells for renderAssessmentPage show no due date:** shells deployed to Moodle for T1 2026 do not pass `forTri`/`forYear` (schema change). Both T1 ATs are past due so this is low impact. New T2 shells from the generator will include tri/year correctly.

---

## Next tasks in priority order

See `docs/ACTION-PLAN.md` for the full prioritised list with checkboxes. Summary:

1. **EDSE358 T2 due dates** — Steve to provide T2 2026 due dates for AT1 and AT2; populate `trimesterDates.T2-2026` in EDSE358.json; regenerate Moodle shells (ACTION-PLAN item 12).
2. **EDSE358 missing content** — populate rationale, aim, part descriptions, and links in assessmentTasks for AT1 and AT2 (ACTION-PLAN item 8).
3. **EDSE358 missing week links** — weeks 1–2 (all), weeks 3/6/7/8 (partial); add as content is published (ACTION-PLAN item 7).
4. **EDSE357 week links** — add lecture/slides/recording/forum/materials/liveHub as content is published (ACTION-PLAN item 10).
5. **EDSE357/358 assessment links** — rubric PDFs, task file URLs, submit URLs (ACTION-PLAN items 8, 11).
6. **Checklist refactor** — before writing a fourth static checklist template, do the config-driven refactor (ACTION-PLAN item 15).

---

## Session notes

### 2026-05-19 — T2 2026 prep: per-trimester dates schema; Zoom from trimesterConfig

**Completed this session:**

- ACTION-PLAN.md audited and synced against repo state — items 2, 3, 9a/b/c marked complete (were done but unrecorded)
- EDSE358 week 8 item 7 table corrected: lecture/zoom/forum/materials confirmed live; slides/recording/liveHub still null
- `assessmentTasks` schema extended: flat `due`, `duePartA`, `flexiblePortal` replaced by `trimesterDates` object keyed by trimester (e.g. `T1-2026`) in all three unit JSONs
- Existing T1-2026 dates migrated into `trimesterDates.T1-2026` for EDSE357 and EDSE358
- T2-2026 stubs added to EDSE358 (both ATs); T2-2026 and T3-2026 stubs added to EDSE357; T2-2027 stub for EDSE362
- `blocks.js` `resolve()` updated: `week` computed before `zoom`; `zoomUrl` falls back to `week.links.zoom` if `trimesterConfig[triKey].zoom.url` is null
- `renderAssessmentPage` signature extended: `forTri` and `forYear` now accepted; reads dates from `trimesterDates[triKey]`
- `renderUnitKeyInfo` and `renderAssessmentStatus` updated to read from `trimesterDates[triKey]`
- EDSE358 week-level `links.zoom` nulled out for weeks 3–8; EDSE357 was already all null
- T2-2026 `trimesterConfig` stub in EDSE358 populated with same Zoom meeting as T1-2026
- Generator `shellAssessment` updated to include `forTri` and `forYear` in output
- `feature/t2-prep` merged to dev then main; branch deleted

**Commits (all on main):**
- `b228461` — feat: per-trimester dates schema and Zoom URL fallback to trimesterConfig
- `26bb49e` — content: set EDSE358 T2-2026 Zoom to same meeting as T1-2026

**Key design decisions:**
- `trimesterDates` key format is `{forTri}-{forYear}` (e.g. `T1-2026`) — matches the `triKey` variable already used throughout `blocks.js`
- `renderAssessmentPage` existing Moodle shells (T1 2026) show no due date after migration — acceptable since both T1 ATs are past due; new T2 shells will be generated with tri/year
- Zoom is now resolved from `trimesterConfig` only; week-level zoom is a fallback for edge cases only. Do not re-add zoom URLs to week `links` objects — keep them null
- EDSE357 `trimesterConfig` currently only has `T1-2026`. When T2 is confirmed, add a `T2-2026` entry (same pattern as EDSE358)

### 2026-05-19 — Navigation blocks; SVG banners; keyLinks; shells deployed

**Completed this session:**

- `renderUnitKeyInfo` (fn 11) and `renderAssessmentStatus` (fn 12) added to `blocks.js` on `feature/navigation-blocks`, merged to dev then main
- Unit JSON schema extended with `bannerUrl`, `supportCallout`, `keyLinks[]` on all three unit JSONs
- `keyLinks` URLs populated for EDSE357 (Unit Outline, Learning Materials, Assessment Portal) and EDSE358 (same)
- EDSE362 `keyLinks` all null — to be populated before T2 2027 go-live
- SVG banners created for all three units (`assets/banners/`), pushed to main, confirmed 200 on GitHub Pages
- `bannerUrl` set to live GitHub Pages URLs in all three unit JSONs
- Generator: `unit-key-info` and `assessment-status` shell types added
- Test harness: Navigation tab added (side-by-side preview)
- Template reference files: `unit-key-info.html`, `assessment-status.html`
- Navigation shell files generated (git-ignored): `docs/EDSE357-navigation-shells.html`, `docs/EDSE358-navigation-shells.html`
- ACTION-PLAN items 1, 4, 5, 6 marked complete; two new completed items added

**Commits (all merged to main):**
- `555a054` — feat: add renderUnitKeyInfo and renderAssessmentStatus navigation blocks
- `8511d79` — feat: add unit banner SVGs and populate bannerUrl in unit configs
- `b10340d` — content: populate keyLinks URLs for EDSE357 and EDSE358
- `4709ba0` — content: set bannerUrl for all three units

**Key design decisions:**
- Navigation block status chip colours are semantic (green/amber/red/teal/grey), not theme colours — consistent across all units regardless of their branding
- `formatDateShort(d)` added as a utility alongside existing `formatDateAU` — returns "3 May 2026" format (no weekday) for compact display in navigation blocks
- `bannerUrl: null` falls back to a themed placeholder div showing unit code + name — never a broken image
- SVG banners served from `assets/banners/` on GitHub Pages; `bannerUrl` in unit JSON points to the live URL

### 2026-05-19 — renderPresubmissionChecklist; autovideos containerId; staff guide

**Commits on dev (not yet merged to main):**
- `46b0adf` — STAFF-README.md substantially expanded: added shell deployment how-to, live session content editing, assessment file and task links, resource directory, new trimester setup, expanded troubleshooting table
- `1dba966` — autovideos.js: code comment marking `containerId` as sandpit-only convenience parameter; not part of the production API; generated shells do not include it

**Committed to main via merge `bfba196` (2026-05-18):**
- `renderPresubmissionChecklist` added to `blocks.js` as 9th function (renderCourseHub moved to 10th)
  - Fetches `templates/presubmission-checklist-{UNIT}-{TASK}.html` and wraps in collapsible `<details>`
  - Scripts re-executed after `innerHTML` injection via `createElement('script')` + `replaceWith` pattern
  - Container: `#lxdune-presubmission-checklist`
- Three template files created: EDSE357-AT1 (11 items), EDSE357-AT2 (11 items), EDSE358-AT1 (16 items)
- Generator: `presubmission-checklist` shell type added with `shellChecklist()` function
- Test harness: Checklist tab added with `sel-cl-task` selector and `scheduleClRender()`
- `docs/ACTION-PLAN.md` created — 16 action items across 5 priority horizons
- `docs/LXDUNE-ClaudeCode-Briefing.md` updated (ACTION-PLAN.md added to file tree)
- `autovideos.js`: optional `containerId` parameter — `getElementById` when provided, `[0]` fallback when absent; backwards-compatible with all live Moodle shells

**Also merged to main via `ccebf8b` (2026-05-18):**
Full dev merge including: EDSE358 rubric descriptors (AT1 8-row, AT2 6-row), assessmentFiles fixes, week 8 population, checklist templates, ACTION-PLAN.md, briefing updates.

**Key decisions:**
- `containerId` on `setUpVideos` is sandpit-only — the correct multi-shell test approach is separate Moodle labels, not custom IDs. Generated shells never include `containerId`.
- Static checklist templates are the current implementation. Do not write a fourth static template — refactor to config-driven first (ACTION-PLAN item 15).
- EDSE358 shells file regenerated: 38 copyable shells + 2 amber placeholder cards for AT1/AT2 checklists (pending refactor).

### 2026-05-18 — Rubric descriptors complete; shell files generated

**Tasks completed this session:**

**1. EDSE358 assessmentFiles broken links fixed (commit `b168bd0`):**
- Chemistry marking URL: `null` → `https://mylearn.une.edu.au/pluginfile.php/5143125/mod_assign/introattachment/0/Chemistry%20task%20marking.pdf?forcedownload=1`
- EES task URL: `null` → `https://mylearn.une.edu.au/pluginfile.php/5143125/mod_assign/introattachment/0/EES%20task%20.pdf?forcedownload=1`
- `markingNote` and `taskNote` warning fields removed; all EDSE358 AT2 discipline files now resolved

**2. EDSE358 AT1 and AT2 rubric structures replaced (commit `9537d93`):**
- AT1: 4 placeholder rows → 8 official rows (A, B1, B2, B3, B4, C1, C2, D), 100 marks, 40 descriptors
  - Part A (5 marks): Task outline
  - Part B1 (20 marks): Unit structure, constructivist pedagogy, differentiation, NSW syllabus alignment
  - Part B2 (10 marks): Resources and student ICT use
  - Part B3 (10 marks): Learning activities aligned to syllabus outcomes
  - Part B4 (10 marks): Formative assessment and feedback
  - Part C1 (20 marks): Justification of pedagogical decisions
  - Part C2 (15 marks): Justification of resources
  - Part D (10 marks): Reflection
- AT2: 3 placeholder rows → 6 official rows (A1, A2, A3, B1, B2, C), 100 marks, 30 descriptors
  - Part A1 (25 marks): Evaluation of Assessment Design
  - Part A2 (20 marks): Syllabus & Working Scientifically Alignment
  - Part A3 (15 marks): Use of Assessment Theory and Literature
  - Part B1 (20 marks): Coherence, Alignment, ICT & Feedback
  - Part B2 (10 marks): Differentiation & Cohort Responsiveness
  - Part C (10 marks): Reflection
- All 70 descriptors populated verbatim from official document

**3. Shell snippet files generated (git-ignored, local use only):**
- `docs/EDSE358-T1-2026-shells.html` — 38 shells (5 course-level + 32 per-week + 1 week-7 resource directory)
- `docs/EDSE357-T1-2026-shells.html` — 37 shells (5 course-level + 32 per-week)
- `.gitignore` updated: `/docs/*-shells.html` pattern added to prevent accidental commits

**Also completed (prior session carry-over on dev):**
- EDSE358 week 8 (Module 4D) populated (commit `8592d5e`): announcementBody, liveSessionFocus, liveSessionTasks, workflow, lecture/zoom/forum/materials links

**Decisions made:**
- AT1 Part C1 mark allocation corrected to 20 marks (not 15 as written in rubric header); band ranges set to match Part B1 (same mark value): HD 20–18, D 17–15, C 14–12, P 11–9, N 8–0
- EES task filename confirmed as `EES%20task%20.pdf` (trailing space in filename is intentional — matches actual file)

### 2026-05-17 — Briefing checkpoint (routine /briefing-update after production deployment)

No code changes this session. Verified current state against all three unit JSONs:
- EDSE357: confirmed all weeks 1–8 populated; both ATs past due; all week links still null; AT2 rubric link and flexiblePortal.url still null (past-due, low priority)
- EDSE358: confirmed weeks 1–7 populated, week 8 still null; both ATs past due; known issues with chemistry marking URL and EES task URL unchanged
- EDSE362: confirmed weeks 1–8 populated with content; all videos and links null as expected; assessmentTasks remain schema-only stubs

Branch delta corrected: dev is 1 commit ahead of main (briefing-only commit `0b60de8`). No code divergence.

### 2026-05-17 — Production deployment: all phases complete

**Final dev→main merge (commit `449164f`):**
- All 4 phases complete and in sync: config layer, block renderer (9 functions + theme + assessment content system + Course Hub), Phase 4 (both live scripts config-driven)
- Sandpit passed: 5 shells tested — EDSE357/EDSE358 whatson ✅, EDSE357/EDSE358 autovideos (config fetch path) ✅, EDIT426 legacy fallback ✅
- GitHub Pages switched to `main`; all three live scripts verified 200
- `dev` and `main` are fully in sync (0 commits delta)

**Video placeholder issue identified during sandpit:**
- `DGIXT7ce3vQ` (used as PE-weeks fallback for all units and EDIT* arrays) is a third-party YouTube video ("Tropical Beach Ambience" — Relaxing Soundzzz channel). All teaching-week videos are owned/controlled and confirmed valid. The placeholder is the only third-party dependency and should be replaced when a suitable owned video is available.

### 2026-05-17 — Phase 4 complete; merged to dev

**Feature branches merged:**
- `feature/phase4-autovideos` → dev (merge commit `df4a601`); feature branch commit `fd7eb98`
- `feature/phase4-whatson` → dev (merge commit `de0894c`); feature branch commit `21a429d`
- Pushed to `origin/dev`; dev is now 5 commits ahead of main

**Key decisions made:**
- EDIT* units (no config JSON) get a legacy fallback — `VideoURLs` static class preserved at bottom of `autovideos.js` with a clear comment; used only on fetch failure with `console.warn`. Do not add new units to this class; create a config JSON instead.
- `week0Message` in JSON is a string (not an array as in the old `Events` static class) — new code handles both types; pre-existing `<p>undefined</p>` bug from the old array code is now fixed.
- `portalLink()` returns plain text "the Assessment Portal" when `assessmentPortalUrl` is null (EDSE362) — no broken link, no crash.
- JSON week keys are strings ("1", "2"...) — requires `unitCfg.weeks[String(thisWeek)]` not integer lookup.
- `videoInterval` field added to all three unit JSONs: EDSE357=1, EDSE358=1, EDSE362=2.
- Test suite: 29 assertions across 7 scenarios, all passing before merge.

---

## Critical constraints (always apply)

- **`whatson/whatson.js` and `autovideos/autovideos.js` are config-driven (Phase 4, in production).** Both are live for enrolled students. All changes follow `feature/* → dev → sandpit → main`.
- **Never commit directly to `main`.**
- **EDSE357 and EDSE358 are live with enrolled students.** Breaking changes are not acceptable. All changes go through dev and sandpit testing first.
- **`<\/script>` in shell template literals** — use `<\/script>` inside JavaScript strings to prevent the HTML parser from closing the outer script tag prematurely.
- **`import.meta.url`** — used in `blocks.js` to derive the config base URL dynamically. This means `blocks.js` works from any host without hardcoded URLs.
- **GitHub Pages is on `main`** — live URL is safe. Do not switch back to `dev` without a deliberate sandpit decision.
