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
  blocks.js                   ← ES module, 7 exported render functions

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
| `main` | Live — GitHub Pages deployment, student-facing |
| `dev` | Staging — all tested work lands here before main |
| `feature/*` | All new development — branch from dev, merge back to dev |

**Never commit directly to `main`.** The path is always `feature/* → dev → main`.

---

## Current branch status

`dev` is **11 commits ahead of `main`**.

### `main` (live, student-facing)
- `whatson/whatson.js` — live, powers the "What's on this week" widget for EDSE357 and EDSE358
- `autovideos/autovideos.js` — live, powers the weekly video switcher
- All other supporting files (fonts, assets, other tools)
- **Does NOT yet have:** config layer, blocks.js, generator, test harness, theme system, EDSE362, `/checkpoint` command

### `dev` (staging — 11 commits ahead of main)
Everything on `main`, plus:
- `config/trimester-config.json`
- `config/units/EDSE357.json`
- `config/units/EDSE358.json` (weeks 3–7 fully populated, week 8 text pending)
- `config/units/EDSE362.json`
- `moodle-blocks/blocks.js` (7 render functions, theme system)
- `generate/index.html`
- `test/index.html` (7 blocks + theme switching)
- `templates/` (9 reference HTML components, including resource-pill-directory)
- `docs/STAFF-README.md`
- `docs/LXDUNE-ClaudeCode-Briefing.md`
- `.claude/commands/checkpoint.md`

---

## Build phases

### Phase 1 — Config layer ✅ COMPLETE

`config/trimester-config.json`, `config/units/EDSE357.json`, `config/units/EDSE358.json`, `config/units/EDSE362.json`. Merged from `feature/config-layer`.

### Phase 2 — Generator UI ✅ COMPLETE

`generate/index.html` — admin-only tool for generating Moodle shell snippets. Covers all 8 block types (including the two live scripts).

### Phase 3 — Block renderer ✅ COMPLETE

`moodle-blocks/blocks.js` — ES module with 7 exported render functions and a theme system.

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

**Function signature (all 7):**
```javascript
renderXxx({ forUnit, forTri, forYear, forWeek, forDate })
// forWeek: explicit week number (optional, bypasses date calculation)
// forDate: date string "YYYY-MM-DD" (optional, overrides today for week calc)
// forWeek takes priority over forDate
```

**Theme system:**
- `applyTheme(unitCfg)` — injects/replaces `<style id="lx-theme-vars">` on `:root`
- All brand colours use CSS custom properties with fallbacks: `var(--lx-primary,#1f6fb2)`, `var(--lx-accent,#25797F)`, `var(--lx-pill,#DAF0F7)`, `var(--lx-pill-border,#cbe6ee)`
- Switching units in the test harness repaints all blocks instantly
- Fixed colours not in theme: `#f1c40f` (live session yellow), `#E3B089` (assessment orange), `#6F7B84` (muted grey)

**Key implementation details:**
- `const BASE = new URL('..', import.meta.url).href` — derives config URL from module location; works on any host
- `null` links always render as a Coming soon chip — never broken or empty
- CSS injected once per page via `injectStyles(sentinelId, css)` — safe for multiple blocks on one page
- `applyTheme` writes/replaces its style element on every render — safe for unit switching in the test harness
- `forDate` added to support the test harness without modifying the public shell API
- After adding new exports to `blocks.js`, hard-refresh (Cmd+Shift+R) the test page to clear the browser module cache

### Phase 4 — Refactor whatson.js and autovideos.js ❌ NOT STARTED

Refactor the two live scripts to read from `config/units/*.json` instead of their own embedded data objects. **Do not start until Phases 1–3 are stable and tested on the sandpit.**

---

## Unit configs — current state

### EDSE357 — Science Education 11–12: Curriculum and Pedagogy
- **Live:** T1 2026, Wednesdays 5:30–6:30pm
- **Trimesters configured:** T1
- **Zoom (T1-2026):** configured ✅
- **Theme:** blue/teal — `primary: #1f6fb2`, `accent: #25797F`
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Links (all weeks):** all `null` — content not yet published
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentFiles (T1-2026):** AT1, AT2 — discipline structure in place, all URLs `null`
- **Assessment dates:** AT1 due 2026-03-29 (week 6), AT2 due 2026-05-03 (week 10)

### EDSE358 — Science Education 11–12: Plan, Assess and Report
- **Live:** T1 2026, Thursdays 5:30–6:30pm
- **Trimesters configured:** T1, T2
- **Zoom (T1-2026):** configured ✅
- **Theme:** purple/cyan — `primary: #7C5DB6`, `accent: #4FA9B5`
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — weeks 1–7 fully populated, week 8 null (not yet written)
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

- **Weeks 4–7 also have:** `additionalLectures` (Echo360) and/or `resources` arrays, `workflow`, `forumPrompts` (week 5), `extension` (week 8) as new fields
- **Week 7 resources:** 19 real links across Assessment, Equity, NESA, UDL categories ✅
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentFiles (T1-2026):**
  - AT1: all URLs `null`
  - AT2: rubric ✅, biology ✅, physics ✅, chemistry task ✅ / **marking null** (known issue), EES **task null** (known issue) / marking ✅
- **Assessment dates:** AT1 Part A due 2026-03-22 (week 4), AT1 Parts B/C/D due 2026-04-05 (week 6), AT2 due 2026-05-04 (week 11)

### EDSE362 — Science Education 11–12: Curriculum, Pedagogy and Inclusive Practice
- **Live:** T2 2027 (not yet live — future unit)
- **Trimesters configured:** T2
- **Zoom (T2-2027):** `null` — not yet created
- **Theme:** green/warm gold — `primary: #2D7A48`, `accent: #C4872D`
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Links (all weeks):** all `null`
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentFiles (T2-2027):** AT1, AT2 — discipline structure in place, all URLs `null`
- **`resources` array:** present on every teaching week, all empty (`[]`)
- **Assessment dates:** none set yet
- **`assessmentPortalUrl`:** `null`
- **T2-2027 start date:** `2027-06-21` — ⚠️ placeholder, confirm against UNE academic calendar before go-live

---

## Config schema — week object

Teaching weeks (1–8) follow this shape. All three units conform to this schema; EDSE362 has `resources` on every week; EDSE358 adds `workflow`, `additionalLectures`, `forumPrompts`, and (on week 8) `extension` as new fields.

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
    "keyIdea": "A key idea this week is… (third paragraph, not yet rendered)"
  },
  "liveSessionFocus": "One or two sentences describing the live session focus.",
  "liveSessionTasks": [
    "Task 1 for students to complete before the session.",
    "Task 2.",
    "Task 3."
  ],
  "workflow": ["Step 1 label", "Step 2 label"],
  "links": {
    "lecture": null,
    "slides": null,
    "zoom": null,
    "recording": null,
    "forum": null,
    "materials": null,
    "liveHub": null
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

The `keyIdea` field on `announcementBody` is stored but not yet rendered — reserved for future renderer enhancement.

---

## Test harness

`test/index.html` — run locally via `python3 -m http.server 8000` from repo root, then open `http://localhost:8000/test/`.

- **Controls:** unit, year, trimester, week dropdowns + date override field
- **Week dropdown:** populated with titles from the unit config on unit change
- **Theme switching:** changing the unit dropdown repaints all blocks immediately via CSS custom properties
- **All 7 blocks** re-render immediately on any control change (150ms debounce)
- Blocks that return nothing for the selected week show a "renders nothing" notice
- **Cache note:** after updating `blocks.js` exports, hard-refresh (Cmd+Shift+R) to clear the browser module cache before testing

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

## Known issues

1. **EDSE358 AT2 — Chemistry marking URL:** currently duplicates the task link. Stored as `null` with `"markingNote"` field. Confirm correct URL with Steve before go-live.
2. **EDSE358 AT2 — EES task URL:** currently points to the Physics task file. Stored as `null` with `"taskNote"` field. Confirm correct URL before go-live.
3. **EDSE358 weeks 1–2, 6–8 — missing lecture/slides/liveHub/recording links:** to be populated as content is published each week.
4. **EDSE357 — all links null:** unit is live but links haven't been added yet; all render as Coming soon chips.
5. **EDSE358 week 8 (Module 4D):** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` not yet written.
6. **EDSE362 — all links null, zoom null:** not live until T2 2027; links to be added closer to go-live.
7. **2027 T2/T3 start dates:** placeholders — must be confirmed against UNE academic calendar before EDSE362 goes live.
8. **`announcementBody.keyIdea`:** stored in weeks 3–7 of EDSE358 but not yet rendered by any block function. Future enhancement.

---

## Next tasks in priority order

1. **Sandpit test** — point GitHub Pages at `dev` branch (or deploy to sandpit). Paste a real Moodle shell into a sandpit page and verify: CSP headers, `import.meta.url` resolution, Echo360 iframes in `<details>`, font inheritance, theme colours rendering correctly.
2. **EDSE358 week 8** — write `announcementBody`, `liveSessionFocus`, `liveSessionTasks` for Module 4D (Developing rubrics and providing feedback).
3. **Resolve AT2 known issues** — get correct Chemistry marking URL and EES task URL; replace `null` values and remove the `*Note` fields once verified.
4. **Add EDSE358 lecture/slides/liveHub/recording links** — as content is published for weeks 1–2, 3, 6, 7. Weeks 4 and 5 are already set.
5. **Add EDSE357 links** — all weeks, all link types, as content is published.
6. **Add `assessmentFiles` URLs** — EDSE358 AT1, EDSE357 AT1/AT2 — as task and marking files are uploaded.
7. **Merge dev → main** — once sandpit testing passes; this makes blocks.js and the config layer live on the production GitHub Pages URL.
8. **Phase 4 — Refactor `whatson.js` and `autovideos.js`** — after Phases 1–3 are stable on main. Both scripts currently embed their own data; refactor to read from `config/units/*.json` to eliminate duplication.

---

## Session notes

### 2026-05-16 — Phase 3 additions + EDSE358 content population

**`renderResourceDirectory` (7th render function):**
- Container: `#lxdune-resource-directory`; week-aware; reads `week.resources[]`
- Groups resources by `r.category` using a `Map`; renders category headings (uppercase, themed underline) with pill-links beneath
- Resources with `null` URLs get the standard Coming soon chip
- Empty `resources` array or non-teaching week renders nothing (test harness shows "renders nothing" notice)

**Theme system:**
- `applyTheme(unitCfg)` writes/replaces `<style id="lx-theme-vars">` — replacing rather than guarding means unit switching in the test harness works correctly
- All hardcoded brand colours replaced with `var(--lx-primary/accent/pill/pill-border)` with fallbacks — CSS classes and inline styles both use vars
- Palettes: EDSE357 blue/teal (original defaults), EDSE358 purple/cyan, EDSE362 green/warm gold
- Fixed colours not in theme: `#f1c40f` live yellow, `#E3B089` assessment orange, `#6F7B84` muted grey

**EDSE358 schema additions (new fields on week objects, not breaking):**
- `announcementBody.keyIdea` — third paragraph; stored but not yet rendered
- `workflow` — array of step labels per week
- `additionalLectures` — array of `{ label, recording, slides }` for weeks with multiple Echo360 recordings (weeks 6, 7)
- `forumPrompts` — array of discussion prompt strings (week 5)
- `extension` — object with `{ label, page, video, resources[] }` (week 8)

**AT2 known-issue pattern:**
- Broken/unverified URLs stored as `null` (shows Coming soon chip to students)
- Warning captured in sibling `taskNote` or `markingNote` string field
- This is the preferred pattern for flagging data issues that need coordinator review

**Browser module cache:**
- Adding a new named export to `blocks.js` causes "does not provide an export named X" error in browsers with the old module cached
- Fix: hard-refresh (Cmd+Shift+R) or open incognito window

**`/checkpoint` command:**
- Created at `.claude/commands/checkpoint.md`
- Run `/checkpoint` at end of any session to update this briefing and commit

---

## Critical constraints (always apply)

- **Never modify `whatson/whatson.js` or `autovideos/autovideos.js`** until Phase 4 is explicitly started. Both scripts are live for enrolled students.
- **Never commit directly to `main`.**
- **EDSE357 and EDSE358 are live with enrolled students.** Breaking changes are not acceptable. All changes go through dev and sandpit testing first.
- **`<\/script>` in shell template literals** — use `<\/script>` inside JavaScript strings to prevent the HTML parser from closing the outer script tag prematurely.
- **`import.meta.url`** — used in `blocks.js` to derive the config base URL dynamically. This means `blocks.js` works from any host without hardcoded URLs.
