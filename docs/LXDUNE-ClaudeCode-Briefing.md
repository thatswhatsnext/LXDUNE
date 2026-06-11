# LXDUNE — Claude Code Briefing

**Last updated:** 2026-06-12 (forTopic param; recordings[] in renderLectureBlock; EDSE362 recording migration; EDSE362 fully populated; EDSE358 T2 due dates set)
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
  blocks.js                   ← ES module, 18 exported render functions
  bespoke/                    ← static HTML fragments injected by renderAssessmentPage
    discipline-tab-switcher.html
    riskassess-callout.html

generate/
  index.html                  ← admin tool: generates copyable Moodle shell snippets

test/
  index.html                  ← dynamic QA harness (local dev only)

templates/
  *.html                      ← 17 reference HTML components (static, not rendered)
                                 incl. presubmission-checklist-EDSE357-AT1/AT2 and EDSE358-AT1,
                                 unit-key-info.html, assessment-status.html,
                                 constructive-alignment-map-EDSE362.html,
                                 constructive-alignment-map-EDSE358.html (added 2026-05-21),
                                 constructive-alignment-map-EDSE357.html (added 2026-05-21),
                                 constructive-alignment-map.html (generic/reusable)

docs/
  STAFF-README.md             ← plain-language guide for non-technical coordinators
  LXDUNE-ClaudeCode-Briefing.md ← this file
  ACTION-PLAN.md              ← prioritised action plan for content and system work
  EDSE357-T1-2026-shells.html    ← git-ignored; open in browser to copy shells
  EDSE358-T1-2026-shells.html    ← git-ignored; stale for AT1 (pre D1/D2 split); use new-shells file instead
  EDSE357-navigation-shells.html ← git-ignored; navigation block shells (renderUnitKeyInfo + renderAssessmentStatus)
  EDSE358-navigation-shells.html ← git-ignored; navigation block shells
  EDSE358-new-shells-may2026.html ← git-ignored; 7 shells: updated AT1 + fns 13–15 for weeks 4/5/6/8

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

### `main` (GitHub Pages source — production ✅)
Last commit: `f46b2bf` (chore: briefing update).

Recent main history includes:
- `f46b2bf` — chore: briefing update
- `2301a3d` — merge: update EDSE358 AT2 T2-2026 due date
- `03c0f15` — content: update EDSE358 AT2 T2-2026 due date to 2026-09-06
- `ba0c6c8` — merge: update EDSE358 AT2 due date
- `f2531dd` — content: update EDSE358 AT2 due date to 2026-09-06

Live scripts serving from main:
- `https://thatswhatsnext.github.io/LXDUNE/whatson/whatson.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/autovideos/autovideos.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/blocks.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/assets/banners/EDSE357-banner.svg` → 200
- `https://thatswhatsnext.github.io/LXDUNE/assets/banners/EDSE358-banner.svg` → 200
- `https://thatswhatsnext.github.io/LXDUNE/assets/banners/EDSE362-banner.svg` → 200

### `dev` (1 commit ahead of main)
Contains `defd43f` — EDSE362 week item/title/live corrections (Topic 4 title, 6A/6B split, live session labels). Not yet merged to main.

### `feature/for-topic-param` (3 commits ahead of dev)
All EDSE362 go-live work is here. Must merge to dev → main before EDSE362 starts 2026-06-22.
- `5295df5` — feat: forTopic param — topic-level content resolution; topic-section shell type; test harness input
- `fb4c176` — feat: renderLectureBlock — multi-recording support via recordings[] array; backwards compatible
- `dd8d275` — fix: EDSE362 migrate links.recording to links.lecture (weeks 2–8) and links.recordings[] (week 1)

---

## Build phases

### Phase 1 — Config layer ✅ COMPLETE

`config/trimester-config.json`, `config/units/EDSE357.json`, `config/units/EDSE358.json`, `config/units/EDSE362.json`. Merged from `feature/config-layer`.

### Phase 2 — Generator UI ✅ COMPLETE

`generate/index.html` — admin-only tool for generating Moodle shell snippets. Covers all block types including Resource directory, Assessment page (with task selector), Course Hub, topic-section, and more.

### Phase 3 — Block renderer ✅ COMPLETE (18 functions)

`moodle-blocks/blocks.js` — ES module with 18 exported render functions and a theme system.

**Exported functions:**

| # | Function | Container | Week-aware |
|---|---|---|---|
| 1 | `renderAnnouncementBlock` | `#lxdune-announcement` | Yes — `forTopic` supported: resolves topic-level `announcementBody` when multi-topic week |
| 2 | `renderWorkflowCard` | `#lxdune-workflow` | Yes |
| 3 | `renderLectureBlock` | `#lxdune-lecture` | Yes — renders `recordings[]` array first (multi-recording), falls back to `links.lecture` URL, then "Coming soon" |
| 4 | `renderLiveSessionHub` | `#lxdune-live-hub` | Yes |
| 5 | `renderAssessmentDownloadBlock` | `#lxdune-assessment-downloads` | No |
| 6 | `renderLearningOutcomesTable` | `#lxdune-outcomes` | No — dual schema (`label`/`aitsl` or `title`/`gtsd`); each LO row includes collapsible reverse alignment map showing teaching weeks + assessment references |
| 7 | `renderResourceDirectory` | `#lxdune-resource-directory` | Yes |
| 8 | `renderAssessmentPage` | `#lxdune-assessment-page` | No — takes `{ forUnit, forTask, forTri, forYear }`; `forTask`: single string (backwards compat), `'all'` or array → tabbed multi-task mode; tab switcher scoped to container |
| 9 | `renderAssessmentNav` | `#lxdune-assessment-nav` | No — unit home navigation card; one full-width button per assessmentTask with due date, weighting, LO pills; graceful placeholder if no tasks |
| 10 | `renderAssessmentHybrid` | `#lxdune-assessment-hybrid` | No — combined assessment page + inline presubmission checklist; same `forTask` options as renderAssessmentPage; checklist fetched async (graceful null if template absent) |
| 11 | `renderPresubmissionChecklist` | `#lxdune-presubmission-checklist` | No — takes `{ forUnit, forTask }` |
| 12 | `renderCourseHub` | `div[data-lx-block="course-hub"]` | No — renders all weeks 1–8 |
| 13 | `renderUnitKeyInfo` | `#lxdune-unit-key-info` | No — navigation block, course homepage |
| 14 | `renderAssessmentStatus` | `#lxdune-assessment-status` | No — navigation block, course homepage |
| 15 | `renderOrientationNote` | `#lxdune-orientation-note` | Yes — `forTopic` supported: resolves topic-level `orientationNote` when set |
| 16 | `renderForumPrompts` | `#lxdune-forum-prompts` | Yes — `forTopic` supported: resolves topic-level `forumPrompts` when set |
| 17 | `renderWorkedExample` | `#lxdune-worked-example` | Yes — `forTopic` supported: resolves topic-level `workedExample` when set |
| 18 | `renderCurrentWeek` | `#lxdune-current-week` | No — date-aware spotlight card for the current teaching week; orientation note, announcement intro, live session focus+tasks, first forum prompt, LO pills |

**Note:** `renderCourseHub` uses a `data-lx-block` attribute selector rather than an `id` — intentional, to allow the block to sit anywhere in an existing page without ID conflicts.

**`forTopic` parameter:**
- Accepted by `resolve()` and fns 1, 15, 16, 17 (`renderAnnouncementBlock`, `renderOrientationNote`, `renderForumPrompts`, `renderWorkedExample`)
- Searches `unitCfg.weeks[*].topics[]` by `t.id`; if found, sets `weekNum` to that week and returns `resolvedTopic`
- Flat-path functions: `resolvedTopic?.field ?? week?.field` — single-topic weeks unaffected
- Multi-topic weeks (`topics[]` present): with `forTopic`, renders topic-level content; without `forTopic`, renders week-level topics list
- Generator: "topic-section" shell type — single-import shell with all four render calls using `forTopic: TP`
- Test harness: `forTopic` text input on Week Blocks tab

**`recordings[]` schema (renderLectureBlock):**
- `week.links.recordings` — array of `{ id, label, embed }` entries
- `embed` is a raw HTML iframe string (NOT escaped); `label` is the `<summary>` display string
- First entry rendered `open`, others collapsed
- Renderer priority: `recordings[]` first → `links.lecture` URL → "Coming soon" chip
- Backwards compatible: units using `links.lecture` URL unaffected

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

### Phase 3B — Assessment Content System ✅ COMPLETE (EDSE357 and EDSE358 full; EDSE362 now full ✅)

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
- AT1 "Teaching, Learning and Assessment Design" (60%): title/LOs/AITSL ✅; `trimesterDates.T1-2026.due` = 2026-04-05, `duePartA` = 2026-03-22 ✅; **`trimesterDates.T2-2026.due` = 2026-07-26 ✅**; **9-row rubric fully populated** (A, B1, B2, B3, B4, C1, C2, D1, D2 — 100 marks, 45 band descriptors) ✅; **5 parts: A(20), B(20), C(50), D1(5), D2(5) = 100 marks** ✅; Part B has `guidanceNotes` (4 items) ✅; Part D2 has `guidanceNotes` (1 item) ✅; rationale null, aim null; parts A/C have null descriptions; criteria empty; links all null; submission instructions empty
- AT2 "Resource Curation and Critical Analysis" (40%): title/LOs/AITSL ✅; `trimesterDates.T1-2026.due` = 2026-05-10 ✅; **`trimesterDates.T2-2026.due` = 2026-09-06 ✅**; **6-row rubric fully populated** (A1, A2, A3, B1, B2, C — 100 marks, 30 band descriptors) ✅; rationale null, aim null; parts [] (holistic); criteria empty; links all null; submission instructions empty

**EDSE362 assessmentTasks — current state:**
- AT1 "Design and Pedagogy — Practical Science Lessons" (40%): **fully populated** ✅ — title, rationale, aim, 3 parts (A/B/C), 6 criteria, 6-row rubric (A1, A2, A3, A4, B1, C1) with all 30 band descriptors, hdCallout, submissionInstructions; `trimesterDates.T2-2026.due` = 2026-07-26, flexiblePortal.closesDate = 2026-08-02 ✅; links: instructions ✅, taskFiles ✅, rubric ✅, template ✅, submit ✅, forum ✅, video ✅
- AT2 "Unit Program" (60%): **fully populated** ✅ — title, rationale, aim, 4 parts (A/B/C/D), criteria, 9-row rubric (A1, A2, B1, B2, B3, C1, C2, C3, D1) with all 45 band descriptors, hdCallout, submissionInstructions; `trimesterDates.T2-2026.due` = 2026-09-06, flexiblePortal.closesDate = 2026-09-13 ✅; links: instructions ✅, taskFiles ✅, rubric ✅, template ✅, submit ✅, forum ✅, video ✅

**AT2 note (EDSE357):** `parts: []` because AT2 is holistically assessed. The "What do I need to do?" section is omitted; the aim describes all requirements.

**Bespoke components** (`moodle-blocks/bespoke/`):
- `discipline-tab-switcher.html` — tab UI for 5 NSW science disciplines (AT1 Part A)
- `riskassess-callout.html` — RiskAssess login callout with credentials (AT1 Part B)
- Fetched async; on failure, a styled placeholder is shown (not a crash)

### Phase 3C — Pre-Submission Checklist block ✅ COMPLETE

`renderPresubmissionChecklist({ forUnit, forTask })` — 11th render function. Fetches the static HTML template from `templates/presubmission-checklist-{UNIT}-{TASK}.html` and wraps it in a collapsible `<details class="lx-cl-wrap">` section. Scripts injected via `innerHTML` are re-executed via `document.createElement('script')` + `replaceWith` pattern (required because scripts in `innerHTML` do not auto-execute).

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

`renderUnitKeyInfo({ forUnit, forTri, forYear })` — 13th render function. Renders a unit homepage navigation panel:
- **Banner:** `<img>` from `unitCfg.bannerUrl`; falls back to a themed placeholder div (unit code + name) when null
- **Key links:** Bootstrap-style full-width buttons from `unitCfg.keyLinks[]`; disabled span when `url: null`
- **Contacts:** toggleable coordinator/lecturer section from `unitCfg.contacts`; rendered only when at least one name is non-null
- **Due date chips:** one row per `assessmentTask` with a due date — coloured chip (green >14d, amber 7–14d, red <7d/today, teal when flexible portal open, grey when submitted/closed), optional "Open portal" link
- **Support callout:** teal left-border box from `unitCfg.supportCallout`; omitted when null

`renderAssessmentStatus({ forUnit, forTri, forYear })` — 14th render function. Renders a responsive card grid (auto-fit minmax 260px):
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

`renderCourseHub({ forUnit, forTri, forYear })` — 12th render function. Renders all teaching weeks (1–8) as CSS-only collapsible `<details>/<summary>` rows. Each row shows: the topic chip, week number, title, **LO colour pills** (always visible, from `week.loMapping`), and (when expanded) announcement intro, live session focus, and tasks list. Non-teaching weeks (9–14) are excluded via the `NO_TEACHING` set.

- Container: `<div data-lx-block="course-hub"></div>` (attribute selector, not ID)
- CSS: all theme colours via `var(--lx-*)` custom properties; LO pills use inline `background` colour from `lo.color`
- Generator shell type: `course-hub`; test harness tab: **Course Hub**
- Verified in test harness for EDSE357 and EDSE358 on 2026-05-17; LO pills added 2026-05-21

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

| File | Copyable shells | Placeholder entries | Generated | Status |
|---|---|---|---|---|
| `docs/EDSE358-T1-2026-shells.html` | 38 | 2 (AT1/AT2 checklists) | 2026-05-19 | ⚠️ AT1 shell stale — use new-shells file instead |
| `docs/EDSE357-T1-2026-shells.html` | 37 | — | 2026-05-18 | Current |
| `docs/EDSE358-navigation-shells.html` | 2 | — | 2026-05-19 (rev 2) | Current |
| `docs/EDSE357-navigation-shells.html` | 2 | — | 2026-05-19 (rev 2) | Current |
| `docs/EDSE358-new-shells-may2026.html` | 7 | — | 2026-05-21 | **Use this for EDSE358 AT1 + new week blocks** |
| `docs/EDSE357-new-shells-may2026.html` | 6 | — | 2026-05-21 | Orientation notes + forum prompts for Topics 3, 5, 7 |

**`EDSE358-new-shells-may2026.html` contains (7 shells):**
- Section 1: Updated AT1 assessment page — **replace** existing Moodle shell (reflects D1/D2 split + guidanceNotes)
- Section 2: Week 4 orientation note + forum prompts (Module 3B page)
- Section 3: Week 5 orientation note (Module 4A page)
- Section 4: Week 6 forum prompts + worked example (Module 4B page)
- Section 5: Week 8 forum prompts (Module 4D page)

**⚠️ EDSE362 shells not yet generated.** Generate before go-live (2026-06-22). Requires merging feature/for-topic-param to dev → main first so blocks.js recordings[] support is live.

All week-specific shells use `forWeek: N` — pinned to that module's content regardless of current date.

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
- **loMapping (weeks 1–8):** ✅ — 1: LO1/LO2; 2–4: LO1/LO3; 5: LO2/LO4/LO5; 6: LO1/LO2/LO4; 7: LO1/LO6; 8: LO1/LO2/LO5
- **Alignment improvement fields (added 2026-05-21 ✅):**
  - `orientationNote` → weeks 3 (AT1 Part C direct prep — OEI instructions), 5 (AT2 prep — professional judgement criterion), 7 (AT2 prep — textbook critique / LO6)
  - `forumPrompts` → weeks 3 (2 prompts: OEI instruction analysis, AT1 Part C reflection), 5 (2 prompts: digital resource eval, AT2 rehearsal), 7 (2 prompts: textbook critique, AT2 textbook requirement)
  - No `synthesisTemplate` or `workedExample` fields — not yet added to EDSE357
- **Weeks 9–14 and week 0:** minimal (non-teaching); videos set to `DGIXT7ce3vQ`; loMapping: `[]`
- **Links (all weeks 1–8):** all `null` — content links not yet published; all render as Coming soon chips
- **Learning outcomes:** LO1–LO6 ✅ (`label`/`aitsl` schema — replaced 2026-05-21; correct official unit outcomes):
  - LO1 Science Content & Teaching Strategies (#1f6fb2), LO2 Assessment Knowledge (#25797F), LO3 Investigative Skills & Safety (#2E86AB), LO4 ICT & Resource Evaluation (#4a90d9), LO5 Professional Resources & Networks (#E3B089), LO6 Critical Textbook Analysis (#C4872D)
- **assessmentTasks:** AT1 and AT2 — fully populated; `trimesterDates.T1-2026` dates populated ✅; T2-2026 and T3-2026 stubs present (due null — pending)
  - AT1: learningOutcomes LO1–LO5 ✅; 7-row rubric; **Part D descriptors updated 2026-05-21** to analytical reflection focus (shift in thinking → future teaching decision); links: rubric ✅, taskFiles ✅, submit ✅, forum ✅, video null
  - AT2: learningOutcomes LO1/LO2/LO4/LO5/LO6 ✅; **`taskGuidanceNotes` added 2026-05-21** (2 items: textbook→LO6, external expert→LO5); **Diversity & Intentional Curation rubric updated** — HD appended (professional networks, Aboriginal and Torres Strait Islander cultural awareness), C/P appended (shorter versions); links: rubric null ⚠️, taskFiles ✅, submit ✅, forum null, video ✅; T1-2026 flexiblePortal.url null (past-due)
- **assessmentFiles (T1-2026):** all discipline task/marking URLs `null`
- **T1 2026 status:** both AT1 (due 2026-03-29) and AT2 (due 2026-05-03) are past due. Unit is in PE/assessment period.

### EDSE358 — Science Education 11–12: Plan, Assess and Report

- **Live:** T1 2026 complete; T2 2026 starts 2026-06-22, Thursdays 5:30–6:30pm
- **Trimesters configured:** T1-2026 ✅, T2-2026 ✅
- **Zoom:** T1-2026 ✅; T2-2026 ✅ (same meeting ID). Week-level `links.zoom` null on all weeks — resolved from `trimesterConfig[triKey].zoom`.
- **Theme:** purple/cyan — `primary: #7C5DB6`, `accent: #4FA9B5`, `pill: #EDE8FB`, `pillBorder: #c9bef5`
- **bannerUrl:** `assets/banners/EDSE358-banner.svg` ✅
- **keyLinks:** Unit Outline ✅, Learning Materials ✅, Assessment Portal ✅
- **contacts:** coordinator Steve Grant ✅; lecturer null
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **loMapping (weeks 1–8):** ✅ added 2026-05-21 — 1–3: LO1/LO3; 4: LO1/LO2/LO3; 5–6: LO3/LO4; 7: LO2/LO3; 8: LO3/LO4
- **Learning outcomes:** 4 LOs ✅ (replaced 6 stale entries 2026-05-21; uses `label`/`aitsl` schema):
  - LO1 Lesson Sequence Design (#7C5DB6), LO2 Resources ICT & Safe Approaches (#1f6fb2), LO3 Activities Assessment & Programming (#4FA9B5), LO4 Feedback & Reflective Practice (#E3B089)
- **Alignment improvement fields (all now rendered — ACTION-PLAN item 18 ✅):**
  - `orientationNote` → weeks 4 (Module 3B), 5 (Module 4A) — rendered by `renderOrientationNote` (fn 15)
  - `forumPrompts` → weeks 4 (3 prompts), 5 (2 prompts), 6 (2 prompts), 8 (3 prompts) — rendered by `renderForumPrompts` (fn 16)
  - `synthesisTemplate` → week 6 — lecturer-only output in generator "Post-forum synthesis" shell type
  - `workedExample` → week 6 — rendered by `renderWorkedExample` (fn 17) as collapsible `<details>`
  - `guidanceNotes` on AT1 parts → Part B (4 items), Part D2 (1 item) — rendered in `renderAssessmentPage` after requirements

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
- **assessmentTasks — AT1:** 5 parts, 9-row rubric, all band descriptors ✅; T1-2026 due 2026-04-05 ✅; **T2-2026 due 2026-07-26 ✅**
- **assessmentTasks — AT2:** 6-row rubric ✅; parts [] (holistic); T1-2026 due 2026-05-10 ✅; **T2-2026 due 2026-09-06 ✅**
- **T1 2026 status:** AT1 Part A (due 2026-03-22), Parts B/C/D (due 2026-04-05), AT2 (due 2026-05-10) — all past due. Unit in PE/assessment period.

### EDSE362 — Science Education 11–12: Curriculum, Pedagogy and Inclusive Practice

- **Live:** T2 2026, Wednesdays 5:30–6:30pm — **starts 2026-06-22 (10 days away as of 2026-06-12)**
- **Trimesters configured:** T2-2026 ✅
- **Zoom (T2-2026):** ✅ configured — meetingId: 85439117847
- **Theme:** green/warm gold — `primary: #2E7D52`, `accent: #E3B089`, `pill: #E8F5EE`, `pillBorder: #b8dcc8`
- **bannerUrl:** `assets/banners/EDSE362-banner.svg` ✅
- **keyLinks:** Unit Outline ✅, Learning Materials ✅, Assessment Portal ✅
- **contacts:** coordinator Steve Grant ✅; lecturer null
- **Learning outcomes:** LO1–LO6 ✅ (`title`/`gtsd` schema)
- **loMapping (weeks 1–8):** ✅ — 1: LO1/LO2/LO3; 2: LO2/LO3; 3: LO1/LO5; 4: LO1/LO2/LO3/LO4; 5: LO1/LO3; 6: LO1/LO6; (weeks 5–8 as mapped)
- **Week structure:** Week 1 is a multi-topic week with `topics[]` array (Topics 1 & 2). Weeks 2–8 are flat single-topic weeks.

**Week content population:**

| Week | Content fields | Notes |
|---|---|---|
| 1 (Topics 1 & 2) | topics[0] and topics[1] each: announcementBody ✅, orientationNote ✅, forumPrompts ✅, workedExample ✅; liveSessionFocus ✅, liveSessionTasks ✅ | Multi-topic — use `forTopic` param |
| 2 (Topic 3) | announcementBody ✅, orientationNote ✅, forumPrompts ✅, workedExample ✅, synthesisTemplate ✅, liveSessionFocus ✅, liveSessionTasks ✅ | |
| 3 (Topic 4) | announcementBody ✅, orientationNote ✅, forumPrompts ✅, synthesisTemplate ✅, liveSessionFocus ✅, liveSessionTasks ✅ | workedExample null |
| 4 (Topic 5) | announcementBody ✅, orientationNote ✅, forumPrompts ✅, workedExample ✅, synthesisTemplate ✅, liveSessionFocus ✅, liveSessionTasks ✅ | |
| 5 (Topic 6A) | announcementBody ✅, orientationNote ✅, forumPrompts ✅, workedExample ✅, synthesisTemplate ✅, liveSessionFocus ✅, liveSessionTasks ✅ | |
| 6 (Topic 6B) | announcementBody ✅, orientationNote ✅, forumPrompts ✅, workedExample ✅, synthesisTemplate ✅, liveSessionFocus ✅, liveSessionTasks ✅ | |
| 7 (Topic 7) | announcementBody ✅, orientationNote ✅, forumPrompts ✅, synthesisTemplate ✅, liveSessionFocus ✅, liveSessionTasks ✅ | workedExample null |
| 8 (Topic 8) | announcementBody ✅, orientationNote ✅, forumPrompts ✅, synthesisTemplate ✅, liveSessionFocus ✅, liveSessionTasks ✅ | workedExample null |

**Week links by week:**

| Week | Real links | Null links |
|---|---|---|
| 1 (Topics 1 & 2) | recordings[] ✅ (2 entries: topic1+topic2), slides, forum, materials | lecture, liveHub |
| 2 (Topic 3) | lecture ✅ (echo360), slides | forum, materials, liveHub |
| 3 (Topic 4) | lecture ✅ (echo360), slides | forum, materials, liveHub |
| 4 (Topic 5) | lecture ✅ (echo360/public) | slides, forum, materials, liveHub |
| 5 (Topic 6A) | lecture ✅ (echo360/public) | slides, forum, materials, liveHub |
| 6 (Topic 6B) | lecture ✅ (echo360/public) | slides, forum, materials, liveHub |
| 7 (Topic 7) | lecture ✅ (echo360/public) | slides, forum, materials, liveHub |
| 8 (Topic 8) | lecture ✅ (echo360/public — same recording as week 7) | slides, forum, materials, liveHub |

All weeks: video null (will default to `DGIXT7ce3vQ` until real IDs added); zoom null at week level (resolved from trimesterConfig).

- **assessmentTasks:** AT1 and AT2 both **fully populated** ✅ — see Phase 3B section above for detail. All assessment links (instructions, taskFiles, rubric, template, submit, forum, video) populated ✅.
- **assessmentFiles (T2-2026):** all discipline task/marking URLs null — populate when individual discipline files are uploaded.
- **Constructive alignment map:** EDSE362-specific template at `templates/constructive-alignment-map-EDSE362.html` ✅

---

## Config schema — week object

Teaching weeks (1–8) follow this shape. All three units conform to this schema. EDSE358 adds `workflow`, `additionalLectures`, `synthesisTemplate`, `workedExample`, `orientationNote`, and (on week 8) `extension` as additional fields. `forumPrompts` is present on EDSE358 weeks 4, 5, 6, 8. EDSE362 adds all alignment fields (orientationNote, forumPrompts, workedExample, synthesisTemplate) to weeks 2–8, and uses a `topics[]` array on week 1.

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
  "orientationNote": "Framing paragraph — rendered by renderOrientationNote (fn 15).",
  "liveSessionFocus": "One or two sentences describing the live session focus.",
  "liveSessionTasks": ["Task 1.", "Task 2.", "Task 3."],
  "workflow": ["Step 1 label", "Step 2 label"],
  "links": {
    "lecture": null,
    "slides": null,
    "zoom": null,
    "recording": null,
    "recordings": [
      {
        "id": "topic1",
        "label": "Topic 1 – Display label for <summary>",
        "embed": "<iframe height=\"420\" width=\"640\" allowfullscreen frameborder=0 src=\"https://echo360.net.au/media/...\"></iframe>"
      }
    ],
    "forum": null,
    "materials": null,
    "liveHub": null
  },
  "additionalLectures": [
    { "label": "Lecture title", "recording": "echo360_url", "slides": "slides_url_or_null" }
  ],
  "forumPrompts": ["Prompt 1.", "Prompt 2.", "Prompt 3."],
  "synthesisTemplate": "Post-forum synthesis template (lecturer tool — not student-facing).",
  "workedExample": "Worked example text — rendered by renderWorkedExample (fn 17) as collapsible details.",
  "loMapping": ["LO1", "LO3"],
  "resources": [
    { "category": "UDL", "label": "Resource label", "url": "url_or_null", "type": "link" }
  ],
  "video": "youtubeVideoId"
}
```

**Multi-topic week schema (`topics[]`):** Used when a week covers multiple independent topics (EDSE362 week 1). Each topic object has `id`, `title`, `announcementBody`, `orientationNote`, `forumPrompts`, `workedExample`, `synthesisTemplate`, optionally `live`. Use `forTopic: "1"` (topic id as string) to resolve topic-level content.

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

- **Controls:** unit, year, trimester, week dropdowns + date override field + `forTopic` text input (topic ID, e.g. `1` or `2` for EDSE362 week 1)
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

`generate/index.html` — run locally or via GitHub Pages URL. Select unit, year, trimester, page type, click Generate. Produces copyable shell snippets for all render function shell types plus the "Post-forum synthesis" lecturer tool. Requires HTTP (not `file://`).

**Shell types available:**
- All week-block types (announcement, workflow, lecture, live-hub, assessment-downloads, outcomes, resource-directory)
- assessment-page (task selector), presubmission-checklist (task selector), course-hub
- unit-key-info, assessment-status
- orientation-note, forum-prompts, worked-example (week-aware date-driven renders)
- **synthesis-template** — week selector dropdown; outputs `synthesisTemplate` plain text for lecturer personalisation (not a render shell)
- **all-assessments** — 'All assessments (tabbed)'; renders all assessment tasks in a tab switcher; no task or week selector needed
- **assessment-nav** — 'Assessment navigation'; compact unit home navigation card; no task or week selector needed
- **current-week** — date-aware spotlight card for the current teaching week
- **full-section** — week selector; aggregated single-import shell for all 6 week blocks
- **topic-section** — topic selector (populated from weeks with `topics[]`); single-import shell with all 4 forTopic render calls (announcement, orientation-note, forum-prompts, worked-example)

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
8. **EDSE362 week links partially populated:** lecture recordings are live for all weeks (week 1 via `recordings[]`, weeks 2–8 via `links.lecture`). Still null: slides (weeks 4–8), forum (weeks 2–8), materials (weeks 2–8), liveHub (all), video (all weeks). Add as content is published before/during T2 2026.
9. **EDSE362 video IDs all null:** all teaching weeks will fall back to `DGIXT7ce3vQ` placeholder until real YouTube IDs are added.
10. **Pre-submission checklist — static templates:** current implementation fetches static HTML from `templates/`. Refactor to config-driven schema before writing a fourth checklist — see ACTION-PLAN.md item 15.
11. **Existing Moodle shells for renderAssessmentPage show no due date:** shells deployed to Moodle for T1 2026 do not pass `forTri`/`forYear`. Both T1 ATs are past due so this is low impact. New T2 shells from the generator will include tri/year correctly.
12. **EDSE358 AT1 shell needs replacing in Moodle:** Updated AT1 assessment page shell is in `docs/EDSE358-new-shells-may2026.html` Section 1 (generated 2026-05-21). Steve to paste it into Moodle, replacing the old shell. Reflects D1/D2 split, updated rubric descriptors, and guidanceNotes rendering. The checklist template has been updated (D1: 5 items, D2: 2 items) — once the checklist refactor (item 15) is done, a new checklist render shell will also be needed.
13. **Lecturer name null:** `contacts.lecturer.name` is null across all three units. Populate when confirmed.
14. **EDSE357 orientation notes and forum prompts not yet deployed to Moodle:** `orientationNote` and `forumPrompts` data is live in the config for weeks 3, 5, and 7. Shells are ready in `docs/EDSE357-new-shells-may2026.html` (6 shells, Topics 3/5/7). Steve to paste into Moodle module pages. Low priority — T1 2026 is past due. Deploy before T2 2026 if EDSE357 runs again.
15. **EDSE357 AT1 assessment page shell may need regenerating:** The Part D rubric descriptors were updated (analytical reflection focus). The existing Moodle AT1 shell will show old descriptors until a new shell is generated and pasted. Low priority — T1 2026 is past due.
16. **feature/for-topic-param not yet merged to dev/main:** 3 commits (`5295df5`, `fb4c176`, `dd8d275`) are on the feature branch only. `recordings[]` support in `renderLectureBlock` is required for EDSE362 week 1 to render its lecture correctly. Must merge to dev → main before 2026-06-22.
17. **EDSE362 assessmentFiles — all null:** discipline-specific task and marking files not yet uploaded. Populate when available.
18. **EDSE362 workedExample absent on weeks 3, 7, 8:** `workedExample` is null on these weeks. The renderer silently omits the block when absent — no error. Add content when available.
19. **EDSE362 shells not yet generated:** No Moodle shell snippets exist for EDSE362 T2-2026. Generate using the shell generator after feature/for-topic-param is merged to main.

---

## Next tasks in priority order

1. **Merge feature/for-topic-param → dev → main** — recordings[] support is required for EDSE362 week 1. Must be done before EDSE362 go-live 2026-06-22 (~10 days away as of 2026-06-12). Sandpit-test first.
2. **Generate EDSE362 T2-2026 Moodle shells** — after the merge, run the generator for EDSE362 / T2 / 2026. Generate: announcement, workflow, lecture, live-hub, course-hub, unit-key-info, assessment-status, assessment-page (AT1 and AT2), and topic-section shells for each topic. Paste into Moodle before 2026-06-22.
3. **EDSE362 lecturer name** — confirm and populate `contacts.lecturer` when assigned.
4. **EDSE362 remaining week links** — add slides (weeks 2–8), forum (weeks 2–8), materials (weeks 2–8), liveHub as content is published during T2 2026.
5. **EDSE362 video IDs** — add YouTube video IDs to weeks 1–8 when recordings are available.
6. **Paste EDSE358 new shells into Moodle** — `docs/EDSE358-new-shells-may2026.html` is ready. 7 shells: replace AT1 assessment page; add orientation notes (weeks 4, 5), forum prompts (weeks 4, 6, 8), worked example (week 6). See placement instructions in the file header (known issue 12).
7. **EDSE358 missing week links** — weeks 1–2 (all), weeks 3/6/7/8 (partial); add as content is published for T2 2026 (ACTION-PLAN item 7).
8. **EDSE358 T2 assessment page shells** — regenerate with `forTri: "T2"` and `forYear: "2026"` for T2 2026 go-live (2026-06-22). Due dates are now populated (AT1: 2026-07-26, AT2: 2026-09-06).
9. **Checklist refactor** — before writing a fourth static checklist template, do the config-driven refactor (ACTION-PLAN item 15).
10. **Alignment map renderer** — `renderAlignmentMap()` as fn 19, reading from `unitCfg.alignmentMap`; all three unit-specific static templates now exist as references: EDSE362, EDSE358, EDSE357 (ACTION-PLAN items 16, 21, 23).
11. **EDSE357 T2 2026 prep** — if EDSE357 runs again in T2 2026, generate and deploy orientation note + forum prompt shells for weeks 3, 5, 7; regenerate AT1 assessment page shell (updated Part D rubric); confirm T2 dates (ACTION-PLAN items 10, 11).

---

## Session notes

### 2026-06-12 — forTopic param; recordings[] in renderLectureBlock; EDSE362 recording migration

**Completed this session (feature/for-topic-param branch):**

**`forTopic` parameter (commit `5295df5`):**
- `resolve()` updated: after weekNum is calculated, loops `Object.entries(unitCfg.weeks)` searching `w.topics[]` for `t.id === forTopic`; if found, sets `weekNum` to that week key and sets `resolvedTopic`
- Added to `renderAnnouncementBlock`, `renderOrientationNote`, `renderForumPrompts`, `renderWorkedExample`
- Flat-path pattern: `resolvedTopic?.field ?? week?.field` — single-topic weeks unaffected; multi-topic weeks with `forTopic` render topic-level content only
- Multi-topic branch: when `week.topics?.length && !resolvedTopic`, renders the topics list (original behaviour); with `resolvedTopic`, renders flat topic content
- Generator: "topic-section" shell type added — topic selector populated from weeks with `topics[]`; generates single-import shell with all 4 render calls using `forTopic: TP`
- Test harness: `forTopic` text input added to Week Blocks tab; clears on unit change; triggers debounced re-render

**`renderLectureBlock` recordings[] support (commit `fb4c176`):**
- Renderer priority: `week.links?.recordings` array (truthy + length > 0) → `week.links?.lecture` URL → "Coming soon" chip
- `recordings[]` render: `<details>` per entry, first `open`; `<summary>` shows `rec.label`; `rec.embed` injected as raw HTML (not escaped)
- Fully backwards compatible: no change to units using `links.lecture` URL or null

**EDSE362 recording migration (commit `dd8d275`):**
- Week 1: `links.recording` → null; `links.recordings[]` added with 2 entries (topic1 from week 1's echo360 ID, topic2 from week 2's echo360 ID)
- Weeks 2–8: `links.recording` → null; current recording iframe moved to `links.lecture`
- Note: weeks 4–8 use `/public/media/` path in the echo360 URL (not `/media/`) — preserved exactly as-is from the original `links.recording` values

**Validation script confirmed:**
- Week 1: `recordings[]` count 2, labels correct, `recording: null`
- Weeks 2–8: `lecture` set, `recording: null` — all 7 weeks

**Key design decisions:**
- `forTopic` is searched across ALL week entries (not just current week); when found, `weekNum` is overridden to that topic's containing week. This lets a Moodle page for Topic 6A use `forTopic: "6A"` without needing to know or pin a week number.
- `recordings[]` `embed` is raw HTML (iframe strings), not a URL — the renderer injects it directly with `rec.embed`. Never escape it. The `links.lecture` path uses `esc(url)` for URL safety; `recordings[]` is a different code path.
- `synthesisTemplate` at topic level: topic 2 in EDSE362 week 1 has `live: "🎤 Live Session: Topics 1 & 2"` at the topic level — this is the live session label, not `synthesisTemplate`. The `live` field on a topic shows as the topic's live session indicator in the announcement block.

### 2026-05-21 — EDSE357 LO replacement and alignment map template

**Completed this session:**

**EDSE357 `learningOutcomes` replacement (commit `f18412b` → main `7b0f289`):**
- Old schema: `title`/`gtsd` — 6 placeholder LOs (generic names, no AITSL standards)
- New schema: `label`/`aitsl` — 6 official unit outcomes from unit documents
  - LO1 Science Content & Teaching Strategies — AITSL 2.1.1
  - LO2 Assessment Knowledge — AITSL 5.1.1, 5.4.1
  - LO3 Investigative Skills & Safety — AITSL 3.3.1, 4.1.1, 4.2.1, 4.4.1
  - LO4 ICT & Resource Evaluation — AITSL 2.6.1
  - LO5 Professional Resources & Networks — AITSL 3.4.1, 7.4.1
  - LO6 Critical Textbook Analysis — AITSL 3.4.1, 3.6.1
- LO IDs (LO1–LO6) unchanged — all `loMapping` and `loLinks` references remain structurally valid
- Renderer already handles dual schema (`lo.label ?? lo.title`); no code change needed
- Colors: LO5 (#E3B089 warm gold) and LO6 (#C4872D amber) are warm tones — intentional distinction from the blue/teal LO1–LO4 group

**`templates/constructive-alignment-map-EDSE357.html` (commit `debf015` → merge pending):**
- Static student-facing alignment map; 6 LOs across Teaching, Practice, AT1 and AT2 columns; blue/teal theme
- Reflects post-audit improved state (G1–G7); new formative activities in Topics 3, 5, 7 flagged
- Click-to-expand rows show student advice per LO
- `templates/README.md` updated with entry (same format as EDSE358 and EDSE362 entries)
- ACTION-PLAN item 23 added: "Build renderAlignmentMap() for EDSE357" — trigger: item 16

**Key notes:**
- LO semantic content has shifted substantially (e.g. old LO2 = "Working Scientifically" → new LO2 = "Assessment Knowledge") — rubric `loLinks` in weeks and assessmentTasks were structurally correct (IDs unchanged) but may warrant semantic review
- Three unit-specific alignment map static templates now exist (EDSE362, EDSE358, EDSE357) — enough reference material to build the config-driven `renderAlignmentMap()` renderer when ready

### 2026-05-21 — EDSE357 constructive alignment audit G1-G7

**Completed this session (feature/edse357-alignment-improvements → dev → main, merge commit `0120da0`):**

**Alignment improvement fields — weeks 3, 5, 7 (commit `d2f457c`):**
- `orientationNote` added to weeks 3, 5, 7 — each frames the week's content as direct preparation for a specific assessment task
  - Week 3 → AT1 Part C (OEI instruction design): "pay close attention to what makes OEI instructions clear enough for students to work independently"
  - Week 5 → AT2 (professional judgement criterion 35%): shifts thinking from "what does this resource contain?" to "what does this resource make possible?"
  - Week 7 → AT2 textbook resource (LO6 direct connection): "your critical analysis of that resource is your primary opportunity to demonstrate LO6"
- `forumPrompts` added to weeks 3 (2), 5 (2), 7 (2) — each forum is framed as formative rehearsal for the relevant assessment task
  - Week 3: OEI instruction analysis + AT1 Part C planning reflection
  - Week 5: digital resource evaluation (3-question scaffold, 100 words) + AT2 rehearsal debrief
  - Week 7: textbook critique (3-criterion scaffold, 100 words) + AT2 textbook requirement direct link

**AT1 Part D rubric update (G7):**
- All 5 band descriptors replaced — old descriptors were generic ("reflection completed to a very high standard")
- New descriptors focus on analytical reflection: identifying a specific shift in thinking, naming the cause, connecting explicitly to a future teaching decision
- Key distinction: reflection is analytical, not descriptive — explains *why* thinking changed, not just *that* it did
- HD now: "Reflection identifies a specific shift in thinking during the task, names what caused that shift, and explicitly connects it to a concrete future teaching decision... May draw on relevant literature to support insight."

**AT2 Diversity & Intentional Curation rubric update (G4/G6):**
- HD appended: professional learning networks + community expertise; cultural safety; Aboriginal and Torres Strait Islander perspectives in science education
- C appended: "Resources are generally culturally appropriate. Some awareness of professional networks evident."
- P appended: "Limited evidence of cultural awareness or professional network consideration."
- D and N unchanged

**AT2 `taskGuidanceNotes` — new task-level field:**
- 2 guidance notes at task level (not part level — AT2 has no parts): connects specific resource types to specific LOs
  - Textbook resource → LO6 (critical textbook analysis): "your primary opportunity to demonstrate LO6"
  - External expert/community representative → LO5 (professional resources and networks): connects to professional responsibilities as a teacher
- `taskGuidanceNotes` is a new schema field; distinct from `guidanceNotes` (which is part-level in EDSE358)
- Not yet rendered by `blocks.js` — will require a renderer update before it displays on the AT2 assessment page

**Key design decisions:**
- Orientation notes link each week explicitly to a specific assessment task component — this is the pattern for constructive alignment visibility at the topic level
- Forum prompts are framed as "formative rehearsal" not just "discussion activities" — the framing matters for how students engage with them before the high-stakes task
- `taskGuidanceNotes` (AT2 task-level) vs `guidanceNotes` (part-level in EDSE358): two different fields serving the same purpose at different structural levels; when `renderAssessmentPage` is updated to read `taskGuidanceNotes`, it should render them after the task aim, before the parts/rubric section

### 2026-05-21 — Constructive alignment visibility layer; EDSE358 data fixes; generator bug fix

**Completed this session (feature/alignment-visibility → dev → main, commit `b0cd1b4`):**

**Generator bug fix (commit `19ffb91`):**
- `unitCfg.weeks` is a plain object keyed by string numbers (`"0"`–`"14"`), not an array
- `(unitCfg.weeks ?? []).map(...)` failed with `TypeError: weeks.map is not a function` because the object is truthy, so the `?? []` fallback never fires
- Fixed: week dropdown now uses `Object.entries(unitCfg.weeks ?? {})` with `[k, w]` destructuring; synthesis-template lookup uses `unitCfg.weeks[weekKey]` string key
- Week dropdown labels fixed: used non-existent `w.week` and `w.moduleTitle`; corrected to key `k` and `w.title`
- **Rule:** Always use `Object.entries()` when iterating `unitCfg.weeks` — never `.map()` directly on the object

**EDSE358 AT1 data fixes (commit `4932241`):**
- `learningOutcomes`: `['LO1','LO2','LO3','LO5']` → `['LO1','LO2','LO3','LO4']`
- `aitslStandards`: 5 wrong entries → 13 correct: `['1.2.1','1.5.1','2.1.1','2.2.1','2.3.1','2.4.1','2.6.1','3.1.1','3.3.1','3.4.1','4.4.1','5.1.1','5.2.1']`
- Part titles: generic `"Part A/B/C"` → descriptive `"Task outline and forum post"`, `"Unit program"`, `"Justification essays"`
- Parts A, B, C: all now have `description`, `requirements[]`, and `wordCount` populated

**EDSE358 learningOutcomes replacement + renderer dual schema (commit `4afc808`):**
- Replaced 6 stale LOs with 4 correct EDSE358 LOs using `label`/`aitsl`/`color` schema (not `title`/`gtsd`)
- `renderLearningOutcomesTable` updated to handle both schemas: `lo.label ?? lo.title`, `lo.aitsl` (array) or `lo.gtsd` (string), `stdLabel` = 'AITSL' or 'GTSD' accordingly
- AT2 `learningOutcomes` fixed: `['LO4','LO5','LO6']` (wrong placeholder) → `['LO1','LO2','LO3','LO4']`

**Constructive alignment visibility — `loMapping` + LO pills + reverse alignment map (commit `f55d933`):**
- `loMapping: [...]` added to all teaching weeks (1–8) across EDSE357, EDSE358, EDSE362; `loMapping: []` for non-teaching weeks
- `renderCourseHub`: LO colour pills now appear below the week title in the `<summary>` (always visible, not hidden behind expand); built from `unitCfg.learningOutcomes` lookup by LO id; `hexRgba(hex, alpha)` inline helper for tinted backgrounds
- `renderLearningOutcomesTable`: each LO row now includes a `<details>/<summary>` collapsible reverse alignment map showing:
  - Teaching weeks where that LO is taught (from `loMapping`)
  - Assessment references (part-level `loLinks` take priority over task-level `learningOutcomes` for the same task to avoid duplication)
- EDSE362 AT1/AT2 `learningOutcomes` nulled (were stubs with unverified placeholder arrays); reverse map will auto-populate once real AT data is added (ACTION-PLAN item 22)

**Key design decisions:**
- Reverse alignment map uses part-level `loLinks` with priority over task-level `learningOutcomes`: if any parts reference an LO, show part labels ("AT1 Part D1"); if no parts but task references it, show task label ("AT1"). Prevents showing both "AT1" and "AT1 Part D1" for the same task.
- LO pill backgrounds in reverse map use `hexRgba(lo.color, 0.15)` for week pills and `hexRgba(lo.color, 0.1)` for assessment pills — tinted rather than solid for readability
- EDSE362 AT1/AT2 learningOutcomes intentionally null: stubs with placeholder arrays are worse than null because the reverse map would show false connections

### 2026-05-21 — EDSE358 alignment map; forWeek fix; production shells generated

**Completed this session:**

**Bug fix — `forWeek`/`forDate` params missing from fns 13–15 (commit `9174faa` → main `9983df3`):**
- `renderOrientationNote`, `renderForumPrompts`, `renderWorkedExample` were missing `forWeek` and `forDate` in their function signatures
- The params would have been silently dropped, causing date-based (not week-pinned) resolution when `forWeek: N` was passed
- Fixed: all three signatures now `({ forUnit, forTri, forYear, forWeek, forDate } = {})` with `forWeek`/`forDate` passed through to `resolve()`
- **Important:** Always include `forWeek`/`forDate` in week-aware render function signatures. Check when adding future fns 19+.

**Gitignore extended (commit `e04b9cc`):**
- New pattern `/docs/*-shells-*.html` added alongside existing `/docs/*-shells.html`
- Covers dated shell files like `EDSE358-new-shells-may2026.html`

**EDSE358 constructive alignment map template (commit `a7b8bf1` → main `8a1cad9`):**
- `templates/constructive-alignment-map-EDSE358.html` — 340-line static template; 4 LOs across Teaching, Practice, AT1 and AT2 columns; purple/cyan theme; click-to-expand rows with student advice; reflects post-audit G1–G8 state
- `templates/README.md` updated with entry
- ACTION-PLAN item 20 marked complete; item 21 added (renderAlignmentMap() for EDSE358, trigger: item 16)
- Two static alignment map templates now exist: EDSE362 and EDSE358 — both available as references for the config-driven renderer (item 16)

**Production shells generated — `docs/EDSE358-new-shells-may2026.html` (git-ignored, not committed):**
- 7 shells covering all new and updated blocks for EDSE358 T1 2026
- All week-specific shells (fns 15–17) use `forWeek: N` — pinned to their module's content, not date-resolved
- Section 1 (AT1 assessment page): REPLACE existing Moodle shell — now reflects D1/D2 split, guidanceNotes, updated rubric
- Sections 2–5: NEW additions on Module 3B/4A/4B/4D pages — placement instructions included in file header
- Steve to paste these into Moodle; all shells are ready to use

**Key design decision — week pinning for module-specific supplementary blocks:**
- `renderOrientationNote`, `renderForumPrompts`, `renderWorkedExample` are placed on specific Moodle module pages
- Using `forWeek: N` ensures the block always shows that module's content even when the trimester has moved on
- Contrast with the core week-aware blocks (announcement, workflow, lecture, live-hub) which are intentionally date-driven and show "current week" content — those do NOT use `forWeek`
- Rule: supplementary contextual blocks pinned to a page → use `forWeek`; dynamic current-state blocks → omit `forWeek`

### 2026-05-21 — ACTION-PLAN item 18 complete: render alignment fields

**Completed this session (feature/render-alignment-fields → dev → main, commit `2db8ab8`):**

**Three new render functions added to `blocks.js`:**
- `renderOrientationNote` (fn 15) — `#lxdune-orientation-note`; blue left-border info box with "Unit context" label; reads `week.orientationNote`; renders nothing if absent
- `renderForumPrompts` (fn 16) — `#lxdune-forum-prompts`; numbered list with accent "Forum discussion prompts" heading; reads `week.forumPrompts[]`; renders nothing if absent/empty
- `renderWorkedExample` (fn 17) — `#lxdune-worked-example`; CSS-only collapsible `<details>` labelled "Worked example"; reads `week.workedExample`; splits on `\n` for paragraphs; renders nothing if absent

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
  - D1 "Planning timely and purposeful feedback for students" (5 marks) — 5 items (D1a–D1e): timing, form, differentiation (incl. Aboriginal and Torres Strait Islander students/EAL-D), teaching decisions, outcome alignment
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
- `orientationNote` (week-level string): weeks 4 (Module 3B — ICT/Aboriginal and Torres Strait Islander framing + safety) and 5 (Module 4A — 4A–4D spiral framing)
- `forumPrompts` (week-level array): weeks 4 (3 prompts: ICT tools, Aboriginal and Torres Strait Islander embedding, activity types), 6 (2 prompts: alignment analysis, evaluation strategy), 8 (3 prompts: rubrics, feedback, senior science challenges)
- `synthesisTemplate` (week-level string): week 6 — post-forum synthesis template for lecturer use
- `workedExample` (week-level string): week 6 — Chemistry (strong alignment) + Biology (partial alignment) contrasting examples
- `guidanceNotes` (parts-level array): AT1 Part B (4 items: ICT, Aboriginal and Torres Strait Islander, unit sequence, formative assessment frequency); AT1 Part D2 (1 item: analytical reflection guidance)

**EDSE358 alignment audit G1–G8 (`feature/edse358-rubric-gaps` → main, commits `055cc7d` + `9e3b9e9`):**
- **G1:** AT1 Part D (10 marks, "Reflection") split into D1 (feedback planning, 5 marks) and D2 (reflective practice, 5 marks) — loLinks: LO4 for both
- **G2:** Week 8: 4 new `liveSessionTasks`; 3 `forumPrompts` added
- **G3:** B2 rubric C/P/N: safety language appended. Week 4 `orientationNote`: safety-as-pedagogy sentence appended.
- **G4:** B4 rubric HD: evaluation strategy sentence appended. Week 6 `forumPrompts`: evaluation strategy prompt added.
- **G5:** B1 rubric C/P/N: Aboriginal and Torres Strait Islander-specific differentiation language appended.
- **G7:** B3 rubric HD: range-of-activity-types sentence appended. Week 4 `forumPrompts`: activity-types audit prompt added.
- **G8:** B2 rubric HD: fully replaced with new text covering resource rationale, range of types, ICT, and safety.

### 2026-05-19 — T2 2026 prep: per-trimester dates schema; Zoom from trimesterConfig

**Completed this session:**

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

- `renderUnitKeyInfo` (fn 13) and `renderAssessmentStatus` (fn 14) added to `blocks.js` on `feature/navigation-blocks`, merged to dev then main
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
- **`recordings[].embed` is raw HTML, not a URL** — inject directly; never escape. Contrast with `links.lecture` which is a URL and must be `esc()`-wrapped.
- **Always use `Object.entries()` when iterating `unitCfg.weeks`** — it is a plain object, not an array. `.map()` will throw.
