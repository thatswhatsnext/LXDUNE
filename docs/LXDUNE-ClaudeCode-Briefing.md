# LXDUNE — Claude Code Briefing

**Last updated:** 2026-05-16  
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
    EDSE357.json              ← unit config (weeks, links, LOs, zoom, etc.)
    EDSE358.json
    EDSE362.json

moodle-blocks/
  blocks.js                   ← ES module, 6 exported render functions

generate/
  index.html                  ← admin tool: generates copyable Moodle shell snippets

test/
  index.html                  ← dynamic QA harness (local dev only)

templates/
  *.html                      ← 8 reference HTML components (static, not rendered)

docs/
  STAFF-README.md             ← plain-language guide for non-technical coordinators
  LXDUNE-ClaudeCode-Briefing.md ← this file

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
| `main` | Live — GitHub Pages deployment, student-facing |
| `dev` | Staging — all tested work lands here before main |
| `feature/*` | All new development — branch from dev, merge back to dev |

**Never commit directly to `main`.** The path is always `feature/* → dev → main`.

---

## Build phases

### Phase 1 — Config layer ✅ COMPLETE (on dev and merged)

Created the JSON config layer. All work was purely additive — no existing files were touched.

- `config/trimester-config.json` — trimester start dates for 2026 (T1/T2/T3) and 2027 (T1/T2/T3)
- `config/units/EDSE357.json` — full unit config
- `config/units/EDSE358.json` — full unit config
- `config/units/EDSE362.json` — full unit config (new unit, T2 2027)

Committed as `feature/config-layer`, merged to `dev`.

### Phase 2 — Generator UI ✅ COMPLETE (on dev)

`generate/index.html` — an admin-only tool (not student-facing) that generates ready-to-paste Moodle shell snippets. Select unit, year, trimester, and page type; get a copyable `<script>` + container `<div>`.

Shells are produced for all 8 block types:
- What's On widget (`whatson.js` — live already)
- Auto video switcher (`autovideos.js` — live already)
- Announcement post, Workflow card, Lecture block, Live session hub, Assessment downloads, Learning outcomes table (all from `blocks.js`)

### Phase 3 — Block renderer ✅ COMPLETE (on dev)

`moodle-blocks/blocks.js` — ES module exporting 6 render functions. All functions are date-aware: they calculate the current week from today's date + the trimester start date unless `forWeek` is explicitly passed.

**Exported functions:**

| Function | Container ID | Week-aware |
|---|---|---|
| `renderAnnouncementBlock` | `#lxdune-announcement` | Yes |
| `renderWorkflowCard` | `#lxdune-workflow` | Yes |
| `renderLectureBlock` | `#lxdune-lecture` | Yes |
| `renderLiveSessionHub` | `#lxdune-live-hub` | Yes |
| `renderAssessmentDownloadBlock` | `#lxdune-assessment-downloads` | No |
| `renderLearningOutcomesTable` | `#lxdune-outcomes` | No |

**Function signature (all 6):**
```javascript
renderXxx({ forUnit, forTri, forYear, forWeek, forDate })
// forWeek: explicit week number (optional, bypasses date calculation)
// forDate: date string "YYYY-MM-DD" (optional, overrides today for week calc)
// forWeek takes priority over forDate
```

**Key implementation details:**
- `const BASE = new URL('..', import.meta.url).href` — derives config URL from module location; works on any host
- `null` links always render as a Coming soon chip — never broken or empty
- CSS injected once per page via `injectStyles(sentinelId, css)` — safe for multiple blocks on one page
- `forDate` added to support the test harness without modifying the public shell API

### Phase 4 — Refactor whatson.js and autovideos.js ❌ NOT STARTED

Refactor the two live scripts to read from `config/units/*.json` instead of their own embedded data objects. **Do not start until Phases 1–3 are stable and tested on the sandpit.**

---

## Unit configs — current state

### EDSE357 — Science Education 11–12: Curriculum and Pedagogy
- **Live:** T1 2026, Wednesdays 5:30–6:30pm
- **Trimesters configured:** T1
- **Zoom (T1-2026):** configured ✅
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Links (all weeks):** all `null` — to be populated as content becomes available
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentFiles (T1-2026):** AT1, AT2 — discipline structure in place, all URLs `null`
- **Assessment dates:** AT1 due 2026-03-29 (week 6), AT2 due 2026-05-03 (week 10)

### EDSE358 — Science Education 11–12: Plan, Assess and Report
- **Live:** T1 2026, Thursdays 5:30–6:30pm
- **Trimesters configured:** T1, T2
- **Zoom (T1-2026):** configured ✅
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — weeks 1–2 fully populated, weeks 3–8 `null` (to be written)
- **Links (all weeks):** all `null`
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentFiles (T1-2026):** AT1, AT2 — discipline structure in place, all URLs `null`
- **Assessment dates:** AT1 Part A due 2026-03-22 (week 4), AT1 Parts B/C/D due 2026-04-05 (week 6), AT2 due 2026-05-04 (week 11)

### EDSE362 — Science Education 11–12: Curriculum, Pedagogy and Inclusive Practice
- **Live:** T2 2027 (not yet live — future unit)
- **Trimesters configured:** T2
- **Zoom (T2-2027):** `null` — not yet created
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Links (all weeks):** all `null`
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentFiles (T2-2027):** AT1, AT2 — discipline structure in place, all URLs `null`
- **`resources` array:** EDSE362-specific schema addition — each teaching week has a `resources: []` array for bonus readings, Excel lists, supplementary recordings. Currently empty; add objects as `{ "label": "...", "url": "..." }`.
- **Assessment dates:** none set yet
- **`assessmentPortalUrl`:** `null` — Moodle portal page not yet created
- **`video`:** `null` for all teaching weeks — no intro videos loaded yet
- **T2-2027 start date:** `2027-06-21` — placeholder, confirm against UNE academic calendar before go-live

---

## Config schema — week object

Teaching weeks (1–8) follow this shape. All three units conform to this schema; EDSE362 adds `resources`.

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
    "intro": "Opening paragraph for the weekly announcement.",
    "focus": "What this week is about — second paragraph."
  },
  "liveSessionFocus": "One or two sentences describing the live session focus.",
  "liveSessionTasks": [
    "Task 1 for students to complete before the session.",
    "Task 2.",
    "Task 3."
  ],
  "links": {
    "lecture": null,
    "slides": null,
    "zoom": null,
    "recording": null,
    "forum": null,
    "materials": null,
    "liveHub": null
  },
  "resources": [],
  "video": "youtubeVideoId"
}
```

`null` links always render as Coming soon chips. Non-teaching weeks (9–14) only need `item`, `title`, `video`, and optionally `assessments`.

---

## Test harness

`test/index.html` — run locally via `python3 -m http.server 8000` from repo root, then open `http://localhost:8000/test/`.

- **Controls:** unit, year, trimester, week dropdowns + date override field
- **Week dropdown:** populated with titles from the unit config on unit change
- **Week = Auto + no date:** uses today's date to calculate the current week
- **Week = Auto + date override:** passes `forDate` to render functions — useful for testing any specific date without waiting for that week
- **Week = explicit number:** passes `forWeek` directly — fastest for spot-checking any week
- **Status bar:** shows effective week number, week title, and mode badge (auto/date/explicit)
- **All 6 blocks** re-render immediately on any control change (150ms debounce)
- Blocks that return nothing for the selected week (PE weeks etc.) show a "renders nothing" notice

---

## Generator

`generate/index.html` — run locally or via GitHub Pages URL. Select unit, year, trimester, page type, click Generate. Produces copyable shell snippets for all 8 page types. Requires HTTP (not `file://`).

---

## Trimester start dates

| Year | T1 | T2 | T3 |
|---|---|---|---|
| 2026 | 2026-02-23 | 2026-06-22 | 2026-10-19 |
| 2027 | 2027-02-22 | 2027-06-21 ⚠️ | 2027-10-18 ⚠️ |

⚠️ 2027 T2 and T3 dates are estimates — confirm against the UNE academic calendar before EDSE362 goes live.

---

## What's on each branch

### `main` (live, student-facing)
- `whatson/whatson.js` — live, powers the "What's on this week" widget for EDSE357 and EDSE358
- `autovideos/autovideos.js` — live, powers the weekly video switcher
- All other supporting files (fonts, assets, other tools)
- **Does NOT yet have:** config layer, blocks.js, generator, test harness, EDSE362

### `dev` (staging — ahead of main by 9 commits)
Everything on `main`, plus:
- `config/trimester-config.json`
- `config/units/EDSE357.json` (extended)
- `config/units/EDSE358.json` (extended)
- `config/units/EDSE362.json` (new)
- `moodle-blocks/blocks.js`
- `generate/index.html`
- `test/index.html`
- `templates/` (8 reference HTML components)
- `docs/STAFF-README.md`
- `docs/LXDUNE-ClaudeCode-Briefing.md` (this file)

---

## Immediate next tasks

### 1. Sandpit test (before merging to main)
Deploy `dev` to the GitHub Pages sandpit (or temporarily point GitHub Pages to the `dev` branch). Paste a real Moodle shell into a sandpit page and verify:
- All 6 render functions work in a real Moodle context (CSP headers, iframe embedding, font inheritance)
- `import.meta.url` resolves correctly from GitHub Pages
- Echo360 iframes load within `<details>` elements under Moodle's CSP

### 2. Populate EDSE358 weeks 3–8 content
`announcementBody`, `liveSessionFocus`, `liveSessionTasks` are `null` for weeks 3–8 in `EDSE358.json`. These need to be written before the announcement and live hub blocks go live for those weeks.

### 3. Add real URLs as content becomes available
For both EDSE357 and EDSE358, populate `links.lecture`, `links.slides`, `links.recording`, `links.forum`, `links.materials`, `links.liveHub` as content is published each week. Replace `null` with the URL — the Coming soon chip disappears automatically.

### 4. Add `assessmentFiles` URLs
For both live units, populate `trimesterConfig.T1-2026.assessmentFiles.AT1` and `AT2` with the actual task and marking file URLs per discipline when those files are uploaded.

### 5. Merge dev to main
When sandpit testing passes, merge `dev → main` to make blocks.js and the config layer live on the GitHub Pages production URL.

### 6. Phase 4 — Refactor whatson.js and autovideos.js
After Phases 1–3 are stable on main: refactor both live scripts to read from `config/units/*.json` instead of their own embedded data. This eliminates duplicated unit data and makes the config the single source of truth for all content.

---

## Critical constraints (always apply)

- **Never modify `whatson/whatson.js` or `autovideos/autovideos.js`** until Phase 4 is explicitly started. Both scripts are live for enrolled students.
- **Never commit directly to `main`.**
- **EDSE357 and EDSE358 are live with enrolled students.** Breaking changes are not acceptable. All changes go through dev and sandpit testing first.
- **`<\/script>` in shell template literals** — use `<\/script>` (not `</script>`) inside JavaScript strings to prevent the HTML parser from closing the outer script tag prematurely. The JavaScript evaluator reads `\/` as `/` so the generated output is correct.
- **`import.meta.url`** — used in `blocks.js` to derive the config base URL dynamically. This means `blocks.js` works from any host without hardcoded URLs.
