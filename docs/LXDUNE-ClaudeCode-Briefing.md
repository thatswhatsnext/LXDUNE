# LXDUNE — Claude Code Briefing

**Last updated:** 2026-05-17 (briefing checkpoint — production stable)  
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
  blocks.js                   ← ES module, 9 exported render functions
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

`dev` is **1 commit ahead of `main`** — the post-deployment briefing commit (`0b60de8`) is on dev only. No code changes; `main` is current for all production purposes.

### `main` (GitHub Pages source — production ✅)
All phases complete and live. Verified 2026-05-17:
- `https://thatswhatsnext.github.io/LXDUNE/whatson/whatson.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/autovideos/autovideos.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/blocks.js` → 200

### `dev` (1 commit ahead — briefing only)
No divergence in code. The 1-commit delta is the briefing update; it will be absorbed into the next dev→main merge. All future work follows `feature/* → dev → sandpit → main`.

---

## Build phases

### Phase 1 — Config layer ✅ COMPLETE

`config/trimester-config.json`, `config/units/EDSE357.json`, `config/units/EDSE358.json`, `config/units/EDSE362.json`. Merged from `feature/config-layer`.

### Phase 2 — Generator UI ✅ COMPLETE

`generate/index.html` — admin-only tool for generating Moodle shell snippets. Covers all 9 block types including Resource directory, Assessment page (with task selector), and Course Hub.

### Phase 3 — Block renderer ✅ COMPLETE (9 functions)

`moodle-blocks/blocks.js` — ES module with 9 exported render functions and a theme system.

**Exported functions:**

| Function | Container | Week-aware |
|---|---|---|
| `renderAnnouncementBlock` | `#lxdune-announcement` | Yes |
| `renderWorkflowCard` | `#lxdune-workflow` | Yes |
| `renderLectureBlock` | `#lxdune-lecture` | Yes |
| `renderLiveSessionHub` | `#lxdune-live-hub` | Yes |
| `renderAssessmentDownloadBlock` | `#lxdune-assessment-downloads` | No |
| `renderLearningOutcomesTable` | `#lxdune-outcomes` | No |
| `renderResourceDirectory` | `#lxdune-resource-directory` | Yes |
| `renderAssessmentPage` | `#lxdune-assessment-page` | No — takes `{ forUnit, forTask }` |
| `renderCourseHub` | `div[data-lx-block="course-hub"]` | No — renders all weeks 1–8 |

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

### Phase 3B — Assessment Content System ✅ COMPLETE (EDSE357); stubs added for EDSE358 and EDSE362

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
- AT1: fully populated — rationale, aim, 4 parts (A/B/C/D), 7 criteria, 7-row rubric (A, B1, B2, C1, C2, C3, D) with all 35 descriptors, submission instructions; links: rubric ✅, taskFiles ✅, submit ✅, forum ✅, video null
- AT2: fully populated — rationale, aim, parts:[] (holistic), 4 criteria with bullets/colors, 4-row rubric with all 20 descriptors, HD callout, submission instructions; links: rubric null, taskFiles ✅, submit ✅, forum null, video ✅

**EDSE358 assessmentTasks — current state (stubs):**
- AT1 "Teaching, Learning and Assessment Design" (60%): title/due/duePartA/LOs/AITSL ✅; rationale null, aim null; parts A/B/C/D have marks but null descriptions; criteria empty; rubric 4 rows — structure correct, all descriptors "To be confirmed"; links all null; submission instructions empty
- AT2 "Resource Curation and Critical Analysis" (40%): title/due/LOs/AITSL ✅; rationale null, aim null; parts [] (holistic); criteria empty; rubric 3 rows — structure correct, all descriptors "To be confirmed"; links all null; submission instructions empty

**EDSE362 assessmentTasks — current state (empty stubs):**
- AT1 and AT2: schema present but title null, due null, rationale null, aim null, all links null, rubric empty — not live until T2 2027

**AT2 note (EDSE357):** `parts: []` because AT2 is holistically assessed. The "What do I need to do?" section is omitted; the aim describes all requirements.

**Bespoke components** (`moodle-blocks/bespoke/`):
- `discipline-tab-switcher.html` — tab UI for 5 NSW science disciplines (AT1 Part A)
- `riskassess-callout.html` — RiskAssess login callout with credentials (AT1 Part B)
- Fetched async; on failure, a styled placeholder is shown (not a crash)

### Phase 3C — Course Hub block ✅ COMPLETE

`renderCourseHub({ forUnit, forTri, forYear })` — 9th render function. Renders all teaching weeks (1–8) as CSS-only collapsible `<details>/<summary>` rows. Each row shows the topic chip, week number, title, and (when expanded) announcement intro, live session focus, and tasks list. Non-teaching weeks (9–14) are excluded via the `NO_TEACHING` set.

- Container: `<div data-lx-block="course-hub"></div>` (attribute selector, not ID)
- CSS: all theme colours via `var(--lx-*)` custom properties
- Generator shell type: `course-hub`; test harness tab: **Course Hub**
- Verified in test harness for EDSE357 and EDSE358 on 2026-05-17

### Phase 4 — Refactor whatson.js and autovideos.js ✅ COMPLETE (merged to main; in production)

Both live scripts refactored to read from `config/units/*.json` instead of embedded static data. Sandpit-tested and merged to `main` 2026-05-17 (merge commit `449164f`). In production.

**`autovideos/autovideos.js` changes (commit `df4a601`):**
- `setUpVideos` is now `async`; fetches `${BASE}config/units/${unit}.json`
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

**Test results (29/29 passed):**
- T1: EDSE357 week 5 — topic, live session, census note, no undefined ✅
- T2: EDSE358 week 7 — module, live session, no undefined ✅
- T3: EDSE362 week 3 — renders without errors, no assessment reminders, no null artefacts ✅
- T4: EDSE357 week 0 — Zero Week heading, week0Message correct, no undefined paragraph ✅
- T5: EDSE358 week 9 — no teaching message, no live session, Professional Experience item ✅
- T6: EDSE358 AT1 Part A on 2026-03-22 — "due today" reminder ✅
- T7: Fetch failure — explicit error heading, no silent fallback ✅

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
- **Theme:** blue/teal — `primary: #1f6fb2`, `accent: #25797F`, `pill: #DAF0F7`, `pillBorder: #cbe6ee`
- **Teaching weeks 1–8:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Weeks 9–14 and week 0:** minimal (non-teaching); videos set to `DGIXT7ce3vQ`
- **Links (all weeks 1–8):** all `null` — content links not yet published; all render as Coming soon chips
- **Learning outcomes:** LO1–LO6 ✅
- **assessmentTasks:** AT1 and AT2 — fully populated including 55 rubric descriptors ✅
  - AT1 links: rubric ✅, taskFiles ✅, submit ✅, forum ✅, video null
  - AT2 links: rubric null ⚠️, taskFiles ✅, submit ✅, forum null, video ✅; flexiblePortal.url null (past-due, T1 2026)
- **assessmentFiles (T1-2026):** structure in place; all discipline task/marking URLs `null`
- **T1 2026 status:** both AT1 (due 2026-03-29) and AT2 (due 2026-05-03) are past due. Unit is in PE/assessment period.

### EDSE358 — Science Education 11–12: Plan, Assess and Report
- **Live:** T1 2026, Thursdays 5:30–6:30pm
- **Trimesters configured:** T1, T2
- **Zoom (T1-2026):** configured ✅
- **Theme:** purple/cyan — `primary: #7C5DB6`, `accent: #4FA9B5`, `pill: #EDE8FB`, `pillBorder: #c9bef5`
- **Teaching weeks 1–7:** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — all populated ✅
- **Week 8 (Module 4D):** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` — **null, not yet written** ⚠️
- **Weeks 9–14 and week 0:** minimal (non-teaching); videos set to `DGIXT7ce3vQ`
- **Links by week:**

| Week | Live links | Null links |
|---|---|---|
| 1 (Module 1) | — | all |
| 2 (Module 2) | — | all |
| 3 (Module 3A) | zoom, forum, materials, liveHub | lecture, slides, recording |
| 4 (Module 3B) | lecture, slides, zoom, forum, materials, liveHub | recording |
| 5 (Module 4A) | lecture, zoom, forum, materials, liveHub | slides, recording |
| 6 (Module 4B) | zoom, forum, materials + 2 additionalLectures ✅ | lecture, slides, liveHub, recording |
| 7 (Module 4C) | zoom, forum, materials + 2 additionalLectures ✅ | lecture, slides, liveHub, recording |
| 8 (Module 4D) | — | all |

- **assessmentFiles (T1-2026):**
  - AT1: all URLs `null`
  - AT2: rubric ✅, biology ✅, physics ✅, chemistry task ✅ / **marking null** ⚠️, EES **task null** ⚠️ / marking ✅
- **assessmentTasks:** stubs — structure, marks, LOs, AITSL correct; rationale/aim/part descriptions/rubric descriptors/all links null; pending full population
- **T1 2026 status:** AT1 Part A (due 2026-03-22) and AT1 Parts B/C/D (due 2026-04-05) past due. AT2 (due 2026-05-04) past due. Unit is in PE/assessment period.

### EDSE362 — Science Education 11–12: Curriculum, Pedagogy and Inclusive Practice
- **Live:** T2 2027 (not yet live — future unit)
- **Trimesters configured:** T2
- **Zoom (T2-2027):** `null` — not yet created
- **Theme:** green/warm gold — `primary: #2E7D52`, `accent: #E3B089`, `pill: #E8F5EE`, `pillBorder: #b8dcc8`
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
- **Cache note:** after updating `blocks.js` exports, hard-refresh (Cmd+Shift+R) before testing

---

## Generator

`generate/index.html` — run locally or via GitHub Pages URL. Select unit, year, trimester, page type, click Generate. Produces copyable shell snippets for all 9 page types including Resource directory, Assessment page (with task selector), and Course Hub. Requires HTTP (not `file://`).

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
3. **EDSE358 weeks 1–2, 6–7 — missing lecture/slides/liveHub/recording links:** to be populated as content is published each week.
4. **EDSE357 — all week links null:** unit is live but content links haven't been added yet; all render as Coming soon chips.
5. **EDSE358 week 8 (Module 4D):** `announcementBody`, `liveSessionFocus`, `liveSessionTasks` not yet written.
6. **EDSE362 — all links null, zoom null, videos null:** not live until T2 2027; links to be added closer to go-live.
7. **2027 T2/T3 start dates:** placeholders — must be confirmed against UNE academic calendar before EDSE362 goes live.
8. **`announcementBody.keyIdea`:** stored in some EDSE358 weeks but not yet rendered by any block function. Future enhancement.
9. **EDSE357 AT2 rubric link null:** add URL when rubric is published to Moodle.
10. ~~**GitHub Pages serving from `dev`**~~ — **RESOLVED 2026-05-17.** Merged dev→main and switched Pages to `main`. Live URL is safe to share.
11. **EDSE358 assessmentTasks — rubric descriptors TBC:** all band descriptors read "To be confirmed — check official rubric document". Populate from official marking rubrics before assessment pages go live.
12. **EDSE358 assessmentTasks — rationale, aim, part descriptions, links all null:** stub structure is in place; full population needed before rendering.
13. **EDSE362 assessmentTasks — completely empty:** AT1 and AT2 are schema-only stubs. Populate closer to T2 2027 go-live.
14. **EDSE362 — video IDs all null:** no YouTube videos configured for any week.
15. **`DGIXT7ce3vQ` — third-party placeholder video:** used for PE weeks (9–14) in all unit configs and all EDIT* legacy arrays. Currently live (confirmed 2026-05-17) but not owned — can be removed or made private by the channel owner without notice. Replace with a university-owned video when available.

---

## Next tasks in priority order

1. **Replace `DGIXT7ce3vQ` placeholder** — this third-party YouTube video (tropical beach ambience, channel: Relaxing Soundzzz) is used as the PE-weeks placeholder for all units and the EDIT* legacy arrays. Replace with a university-owned or stable video to eliminate the risk of unannounced removal. One config change across weeks 9–14 in each unit JSON plus the seven EDIT* arrays in `autovideos.js`.
2. **EDSE358 week 8** — write `announcementBody`, `liveSessionFocus`, `liveSessionTasks` for Module 4D (Developing rubrics and providing feedback).
3. **EDSE358 AT1 — populate fully** — add rationale, aim, part descriptions, requirements, all rubric descriptors from official document, and all links (taskFiles, submit, forum, rubric) once published.
4. **EDSE358 AT2 — populate fully** — same: rationale, aim, rubric descriptors, links.
5. **Resolve EDSE358 AT2 known issues** — get correct Chemistry marking URL and EES task URL.
6. **Add EDSE357 week links** — all weeks, all link types, as content is published.
7. **Add EDSE358 lecture/slides/liveHub/recording links** — weeks 1–2, 3, 6, 7 as content is published.
8. **Add EDSE357 AT2 rubric link** — once the marking rubric PDF is published on Moodle.
9. **Add assessmentFiles URLs** — EDSE358 AT1, EDSE357 AT1/AT2 — as task and marking files are uploaded.

---

## Session notes

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

**Behaviour difference (autovideos):**
- EDSE357/EDSE358: sequence now built dynamically from config JSON — video IDs and count verified entry-for-entry identical to old hardcoded arrays.
- EDSE362: all video fields are null → defaults to `DGIXT7ce3vQ` for every week; functionally identical to old behaviour.
- EDIT* units: old behaviour relied on switch(unit) in synchronous code; new behaviour fetches config, fails, falls back to legacy class with console.warn — net result same video, slightly delayed (one fetch round-trip before fallback).

**Sandpit testing (2026-05-17):** All 5 shells passed — EDSE357/EDSE358 whatson, EDSE357/EDSE358 autovideos (config path), EDIT426 legacy fallback. Merged to main same session.

### 2026-05-17 — dev → main merge; GitHub Pages switched to main

**Merge (commit `dc8ecbd` on main):**
- Pre-merge checks passed: clean working tree, `whatson.js`/`autovideos.js` unchanged, test harness verified, Pages confirmed on `dev`
- `origin/dev` pushed first (10 local-only commits synced)
- `git merge dev --no-ff` — 22 commits, 5,871 insertions, 22 new files
- `git push origin main` — live immediately
- GitHub Pages source switched from `dev` → `main` in repo settings; Pages rebuild confirmed
- `dev` and `main` are now fully in sync (0 commits delta)
- Phase 4 (`whatson.js`/`autovideos.js` refactor) is now unblocked — Phases 1–3 are stable on `main`

### 2026-05-17 — SA3 + SA4 verified; Course Hub complete

**SA3 (commit `6405774`) — verified:**
- Single targeted change: `border-left:6px solid #E3B089` → `var(--lx-accent,#E3B089)` in `buildAssessmentReminders`
- EDSE358 theme corrected: `pill: #EDE8FB`, `pillBorder: #c9bef5` (was wrong values)
- EDSE362 theme corrected: `primary: #2E7D52`, `accent: #E3B089` (was `#2D7A48` / `#C4872D`)
- All other brand colours throughout `blocks.js` already correctly use CSS custom properties

**SA4 (commit `9b930ef`) — `renderCourseHub` (9th export):**
- Found uncommitted at session start; committed after test harness verification
- Renders all teaching weeks 1–8 as CSS-only `<details>/<summary>` collapsible rows
- Container: `div[data-lx-block="course-hub"]` (attribute selector, not `#lxdune-*` ID)
- Theme vars used throughout HUB_CSS — switches correctly with unit dropdown
- Course Hub tab added to test harness; `course-hub` shell type added to generator
- Verified in test harness for EDSE357 and EDSE358

**`assessmentTasks` stubs added to EDSE358 and EDSE362 (commit `5e78f93`):**
- EDSE358: AT1 "Teaching, Learning and Assessment Design" (60%) and AT2 "Resource Curation and Critical Analysis" (40%) — structure, marks, LOs, AITSL correct; all rubric descriptors "To be confirmed"; rationale/aim/links null
- EDSE362: AT1 and AT2 completely empty stubs — title null, all content null; not needed until T2 2027

**Test harness verification — all passing:**
- Theme switching: EDSE357 (blue/teal) / EDSE358 (purple/cyan) / EDSE362 (green/gold) repaint correctly
- Course Hub: both EDSE357 and EDSE358 render all weeks with correct content
- Assessment tab: EDSE357 AT1 and AT2 render all 6 sections correctly

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

- **`whatson/whatson.js` and `autovideos/autovideos.js` are config-driven (Phase 4, in production).** Both are live for enrolled students. All changes follow `feature/* → dev → sandpit → main`.
- **Never commit directly to `main`.**
- **EDSE357 and EDSE358 are live with enrolled students.** Breaking changes are not acceptable. All changes go through dev and sandpit testing first.
- **`<\/script>` in shell template literals** — use `<\/script>` inside JavaScript strings to prevent the HTML parser from closing the outer script tag prematurely.
- **`import.meta.url`** — used in `blocks.js` to derive the config base URL dynamically. This means `blocks.js` works from any host without hardcoded URLs.
- **GitHub Pages is on `main`** — live URL is safe. Do not switch back to `dev` without a deliberate sandpit decision.
