# LXDUNE — Claude Code Briefing

**Last updated:** 2026-06-05 (EDSE358 AT links schema overhaul; renderAssessmentHybrid added; EDSE362 AT links fully populated; Week 2 forum prompts; week link updates)
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
  *.html                      ← reference HTML components (static, not rendered)
                                 incl. presubmission-checklist-EDSE357-AT1/AT2 and EDSE358-AT1,
                                 unit-key-info.html, assessment-status.html,
                                 constructive-alignment-map-EDSE362.html,
                                 constructive-alignment-map-EDSE358.html,
                                 constructive-alignment-map-EDSE357.html,
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

> ✅ **GitHub Pages is serving from `main`** — confirmed 2026-06-05. `blocks.js` returns 200. Safe to share with students.

---

## Current branch status

`dev` is **0 commits ahead of main** — fully merged as of 2026-06-05.

### `main` (GitHub Pages source — production ✅)

Last merge: `2301a3d` (2026-06-05) — EDSE358 AT2 T2-2026 due date.

Recent main history (this session):
- `2301a3d` — merge: update EDSE358 AT2 T2-2026 due date
- `ba0c6c8` — merge: update EDSE358 AT2 due date (T1-2026 → 2026-09-06)
- `49df022` — merge: fix EDSE358 AT2 instructions URL
- `7cd9b5a` — merge: EDSE358 assessment links, renderAssessmentPage and renderAssessmentHybrid field alignment
- `ef29213` — merge: EDSE358 AT1/AT2 assessment links and renderAssessmentPage button updates
- `e589105` — feat(EDSE358): add Week 2 forum prompts; update module links for weeks 1, 3, 4

Live scripts confirmed 200 from GitHub Pages:
- `https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/blocks.js` → 200 ✅
- `https://thatswhatsnext.github.io/LXDUNE/whatson/whatson.js` → 200
- `https://thatswhatsnext.github.io/LXDUNE/autovideos/autovideos.js` → 200
- All three unit banners → 200

---

## Build phases

### Phase 1 — Config layer ✅ COMPLETE

`config/trimester-config.json`, `config/units/EDSE357.json`, `config/units/EDSE358.json`, `config/units/EDSE362.json`.

### Phase 2 — Generator UI ✅ COMPLETE

`generate/index.html` — admin-only tool for generating Moodle shell snippets. Shell types: all week-block types, assessment-page (with task selector), assessment-hybrid, presubmission-checklist, course-hub, unit-key-info, assessment-status, orientation-note, forum-prompts, worked-example, synthesis-template, all-assessments, assessment-nav, current-week, full-section.

### Phase 3 — Block renderer ✅ COMPLETE (18 functions)

`moodle-blocks/blocks.js` — ES module with 18 exported render functions and a theme system.

**Exported functions:**

| # | Function | Container | Week-aware |
|---|---|---|---|
| 1 | `renderAnnouncementBlock` | `#lxdune-announcement` | Yes |
| 2 | `renderWorkflowCard` | `#lxdune-workflow` | Yes |
| 3 | `renderLectureBlock` | `#lxdune-lecture` | Yes |
| 4 | `renderLiveSessionHub` | `#lxdune-live-hub` | Yes |
| 5 | `renderAssessmentDownloadBlock` | `#lxdune-assessment-downloads` | No |
| 6 | `renderLearningOutcomesTable` | `#lxdune-outcomes` | No — dual schema (`label`/`aitsl` or `title`/`gtsd`); each LO row includes collapsible reverse alignment map |
| 7 | `renderResourceDirectory` | `#lxdune-resource-directory` | Yes |
| 8 | `renderAssessmentPage` | `#lxdune-assessment-page` | No — takes `{ forUnit, forTask, forTri, forYear }`; `forTask`: single string, `'all'`, or array → tabbed multi-task mode |
| 9 | `renderAssessmentNav` | `#lxdune-assessment-nav` | No — unit home navigation card; one button per assessmentTask with due date, weighting, LO pills |
| 10 | `renderAssessmentHybrid` | `#lxdune-assessment-hybrid` | No — timeline + milestone layout; see Phase 3F |
| 11 | `renderPresubmissionChecklist` | `#lxdune-presubmission-checklist` | No — takes `{ forUnit, forTask }` |
| 12 | `renderCourseHub` | `div[data-lx-block="course-hub"]` | No — renders all weeks 1–8 |
| 13 | `renderUnitKeyInfo` | `#lxdune-unit-key-info` | No — navigation block, course homepage |
| 14 | `renderAssessmentStatus` | `#lxdune-assessment-status` | No — navigation block, course homepage |
| 15 | `renderOrientationNote` | `#lxdune-orientation-note` | Yes — accepts `forWeek`/`forDate`; renders nothing if `orientationNote` absent |
| 16 | `renderForumPrompts` | `#lxdune-forum-prompts` | Yes — accepts `forWeek`/`forDate`; renders nothing if `forumPrompts` absent/empty |
| 17 | `renderWorkedExample` | `#lxdune-worked-example` | Yes — accepts `forWeek`/`forDate`; collapsible `<details>`; renders nothing if `workedExample` absent |
| 18 | `renderCurrentWeek` | `#lxdune-current-week` | No — date-aware spotlight card for the current teaching week |

**Theme system:**
- `applyTheme(unitCfg)` — injects/replaces `<style id="lx-theme-vars">` on `:root`
- All brand colours use CSS custom properties with fallbacks: `var(--lx-primary,#1f6fb2)`, `var(--lx-accent,#25797F)`, `var(--lx-pill,#DAF0F7)`, `var(--lx-pill-border,#cbe6ee)`

**Key implementation details:**
- `const BASE = new URL('..', import.meta.url).href` — derives config URL from module location; works on any host
- `null` links always render as a Coming soon chip — never broken or empty
- CSS injected once per page via `injectStyles(sentinelId, css)` — safe for multiple blocks on one page
- After adding new exports to `blocks.js`, hard-refresh (Cmd+Shift+R) to clear the browser module cache

### Phase 3B — Assessment Content System ✅ COMPLETE

`renderAssessmentPage({ forUnit, forTask })` — assembles a complete assessment page in 6 sections: At a glance, What is this task?, What do I need to do?, How will I be marked?, Submission, Support.

**`links` schema for `assessmentTasks` (current — updated 2026-06-05):**

```json
"links": {
  "instructions":  "url_or_null",
  "resourceTable": "url_or_null",
  "rubric":        "url_or_null",
  "template":      "url_or_null",
  "submit":        "url_or_null",
  "forum":         "url_or_null",
  "video":         "url_or_null"
}
```

**Button rendering in `buildTaskSections` (renderAssessmentPage) and `buildHybridTask` (renderAssessmentHybrid):**

| Button label | Field read | Notes |
|---|---|---|
| Task files | `lnk.instructions` | Renamed from `taskFiles` 2026-06-05 |
| Assessment resources | `lnk.resourceTable` | New field 2026-06-05 |
| Template | `lnk.template` | |
| Marking rubric | `lnk.rubric` | |
| Submit | `lnk.submit` | |
| Q&A forum | `lnk.forum` | |
| Unpacking video | `lnk.video` | |

⚠️ **EDSE357 and EDSE362 configs still use `taskFiles` (not `instructions`)** — their "Task files" buttons will render as disabled until their AT links are migrated to the `instructions` field. See Known Issue 18.

**Full assessmentTask schema:**
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
  "links": { "instructions": null, "resourceTable": null, "rubric": null, "template": null, "submit": null, "forum": null, "video": null },
  "parts": [ ... ],
  "rubric": [ ... ],
  "hdCallout": "...",
  "submissionInstructions": ["..."]
}
```

**EDSE357 assessmentTasks — current state:**
- AT1: fully populated; `trimesterDates.T1-2026.due` = 2026-03-29 ✅; T2/T3 stubs present; links: rubric ✅, **taskFiles ✅ (not yet migrated to `instructions`)**, submit ✅, forum ✅, video null
- AT2: fully populated; `trimesterDates.T1-2026.due` = 2026-05-03 ✅; links: rubric null ⚠️, **taskFiles ✅ (not yet migrated)**, submit ✅, forum null, video ✅

**EDSE358 assessmentTasks — current state (updated 2026-06-05):**
- AT1: 5 parts (A/B/C/D1/D2), 9-row rubric ✅; `trimesterDates.T1-2026.due` = 2026-04-05, `duePartA` = 2026-03-22; T2-2026 stubs present; links: **instructions ✅, resourceTable null, rubric ✅, template ✅, submit ✅, forum ✅, video null**
- AT2: 6-row rubric ✅; `trimesterDates.T1-2026.due` = 2026-09-06, `T2-2026.due` = 2026-09-06 ✅; links: **instructions ✅, resourceTable ✅, rubric ✅, template null, submit ✅, forum ✅, video null**

**EDSE362 assessmentTasks — current state (updated ~2026-05-22):**
- AT1 and AT2: `trimesterDates.T2-2026` populated ✅; **all links fully populated** (rubric ✅, taskFiles ✅, template ✅, submit ✅, forum ✅, video ✅) ⚠️ still uses `taskFiles` field — see Known Issue 18
- Content fields (title, rationale, aim, parts, rubric bodies) still null — to populate before T2 2026 go-live

### Phase 3C — Pre-Submission Checklist block ✅ COMPLETE

`renderPresubmissionChecklist({ forUnit, forTask })` — fetches `templates/presubmission-checklist-{UNIT}-{TASK}.html` and wraps in collapsible `<details>`. **Do not write a fourth static template before doing the config-driven refactor (ACTION-PLAN item 15).**

Templates: EDSE357-AT1 (11 items), EDSE357-AT2 (11 items), EDSE358-AT1 (19 items, updated for D1/D2 split).

### Phase 3D — Course Hub block ✅ COMPLETE

`renderCourseHub` — renders weeks 1–8 as CSS-only collapsible rows with LO colour pills.

### Phase 3E — Navigation Blocks ✅ COMPLETE

`renderUnitKeyInfo` (fn 13) and `renderAssessmentStatus` (fn 14) — unit homepage navigation panels. Contacts section toggleable. Status chip colours semantic (not theme colours).

### Phase 3F — Assessment Hybrid block ✅ COMPLETE

`renderAssessmentHybrid({ forUnit, forTask, forTri, forYear })` — timeline + milestone card layout (fn 10). Reads from the same config as `renderAssessmentPage`. Helper: `buildHybridTask()`. Key features:
- Header chips: weighting, total marks, due date, length
- At-a-glance block: LO pills, task aim, action buttons (same field names as renderAssessmentPage)
- Milestone cards: one per part — collapsible, with requirements as checkboxes, resources, guidanceNotes
- CL milestone: pre-submission checklist fetched from `templates/presubmission-checklist-{UNIT}-{TASK}.html`
- Submit milestone: always-open card with submission instructions + submit button + deadline
- Support section: HD callout + flexible portal button
- Summary bar: total marks, weighting, LO descriptions
- Multi-task mode: tab bar when `forTask: 'all'`
- Container: `<div id="lxdune-assessment-hybrid"></div>`
- Generator shell type: `assessment-hybrid`; test harness tab: **Hybrid**

### Phase 4 — Refactor whatson.js and autovideos.js ✅ COMPLETE (in production)

Both live scripts config-driven. In production since 2026-05-17 (merge `449164f`).

---

## Sandpit test — 2026-05-17 ✅ PASSED

All 7 week-block render functions verified. GitHub Pages confirmed serving from `main`. EDSE358 T1 2026 week 7 used as reference dataset.

---

## Shell snippet files

Git-ignored (pattern `/docs/*-shells.html` and `/docs/*-shells-*.html`). Open in browser to copy.

| File | Shells | Status |
|---|---|---|
| `docs/EDSE358-T1-2026-shells.html` | 38 | ⚠️ AT1 shell stale — use new-shells file |
| `docs/EDSE357-T1-2026-shells.html` | 37 | Current |
| `docs/EDSE358-navigation-shells.html` | 2 | Current |
| `docs/EDSE357-navigation-shells.html` | 2 | Current |
| `docs/EDSE358-new-shells-may2026.html` | 7 | **Use for EDSE358 AT1 + new week blocks** |
| `docs/EDSE357-new-shells-may2026.html` | 6 | Orientation notes + forum prompts Topics 3/5/7 |

---

## Unit configs — current state

### EDSE357 — Science Education 11–12: Curriculum and Pedagogy

- **Live:** T1 2026 (past due — in PE/assessment period); Wednesdays 5:30–6:30pm
- **Trimesters configured:** T1-2026
- **Theme:** blue/teal — `primary: #1f6fb2`
- **bannerUrl / keyLinks / contacts:** all populated ✅
- **Learning outcomes:** LO1–LO6 (`label`/`aitsl` schema) ✅
- **Teaching weeks 1–8:** announcementBody, liveSessionFocus, liveSessionTasks — all populated ✅
- **loMapping (weeks 1–8):** ✅
- **Alignment fields:** orientationNote (weeks 3/5/7) ✅; forumPrompts (weeks 3/5/7) ✅
- **Week links:** all null — content links not yet published
- **assessmentTasks:** AT1 and AT2 fully populated; T1-2026 dates ✅; T2/T3 stubs present
  - AT1: rubric ✅, **taskFiles ✅** (⚠️ not yet renamed to `instructions`), submit ✅, forum ✅, video null
  - AT2: rubric null ⚠️, **taskFiles ✅** (⚠️ not yet renamed), submit ✅, forum null, video ✅

### EDSE358 — Science Education 11–12: Plan, Assess and Report

- **Live:** T1 2026 (past due); T2 2026 starts 2026-06-22; Thursdays 5:30–6:30pm
- **Trimesters configured:** T1-2026 ✅, T2-2026 ✅
- **Theme:** purple/cyan — `primary: #7C5DB6`
- **bannerUrl / keyLinks / contacts:** all populated ✅
- **Learning outcomes:** LO1–LO4 (`label`/`aitsl` schema) ✅
- **Teaching weeks 1–8:** announcementBody, liveSessionFocus, liveSessionTasks — all populated ✅
- **loMapping (weeks 1–8):** ✅
- **Week population (as of 2026-06-05):**

| Week | Status | Null fields |
|---|---|---|
| 0 | SPARSE | title, announcementBody, liveSessionFocus, liveSessionTasks, forum/lecture/slides/recording/materials |
| 1 | PARTIAL | forumPrompts |
| 2 | FULL | — |
| 3 | PARTIAL | recording |
| 4 | FULL | — |
| 5 | FULL | — |
| 6 | FULL | — |
| 7 | FULL | — |
| 8 | FULL | — |
| 9–14 | SPARSE | non-teaching; intentional |

- **assessmentTasks:**
  - AT1: instructions ✅, resourceTable null, rubric ✅, template ✅, submit ✅, forum ✅, video null; T1-2026 due 2026-04-05 ✅; T2-2026 stubs present
  - AT2: instructions ✅, resourceTable ✅, rubric ✅, template null, submit ✅, forum ✅, video null; T1-2026.due = 2026-09-06 ⚠️ (verify — see Known Issue 19); T2-2026.due = 2026-09-06 ✅
- **assessmentFiles (T1-2026):** AT1: all null; AT2: all discipline files populated ✅

### EDSE362 — Science Education 7–10: Developing Professional Skills and Understanding

- **Live:** T2 2026, Wednesdays 5:30–6:30pm (starts 2026-06-22) — **go-live imminent**
- **Trimesters configured:** T2-2026 ✅
- **Zoom (T2-2026):** null — not yet created ⚠️
- **Theme:** green/warm gold — `primary: #2E7D52`
- **bannerUrl / keyLinks / contacts:** all populated ✅
- **Learning outcomes:** LO1–LO6 (`title`/`gtsd` schema) ✅
- **Teaching weeks 1–8:** announcementBody, liveSessionFocus, liveSessionTasks — all populated ✅; loMapping ✅; resources: [] present (empty, ready to fill)
- **Week links:** all null — all render as Coming soon chips
- **Videos (weeks 1–8):** all null — will default to `DGIXT7ce3vQ` placeholder
- **assessmentTasks:** T2-2026 due dates ✅ (AT1 due 2026-07-26, AT2 due 2026-09-06); **all AT links fully populated** (rubric ✅, taskFiles ✅, template ✅, submit ✅, forum ✅, video ✅) ⚠️ uses `taskFiles` field — buttons will show disabled in current renderer; content fields (title, rationale, aim, parts, rubric bodies) still null ⚠️

---

## Config schema — week object

Teaching weeks (1–8) follow this shape. All three units conform to this schema.

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
    "focus": "This week's focus.",
    "keyIdea": "Key idea (stored, not yet rendered)"
  },
  "orientationNote": "Framing paragraph — rendered by renderOrientationNote.",
  "liveSessionFocus": "One or two sentences.",
  "liveSessionTasks": ["Task 1.", "Task 2."],
  "workflow": ["Step 1 label", "Step 2 label"],
  "links": {
    "lecture": null, "slides": null, "zoom": null,
    "recording": null, "forum": null, "materials": null, "liveHub": null
  },
  "additionalLectures": [
    { "label": "Lecture title", "recording": "echo360_url", "slides": "slides_url_or_null" }
  ],
  "forumPrompts": ["Prompt 1.", "Prompt 2."],
  "synthesisTemplate": "Post-forum synthesis (lecturer tool — not student-facing).",
  "workedExample": "Worked example text — collapsible details.",
  "loMapping": ["LO1", "LO3"],
  "resources": [
    { "category": "UDL", "label": "Resource label", "url": "url_or_null", "type": "link" }
  ],
  "video": "youtubeVideoId"
}
```

`null` links always render as Coming soon chips. Zoom is resolved from `trimesterConfig`, not week-level `links.zoom` — do not add Zoom URLs to week `links` objects.

---

## Test harness

`test/index.html` — run locally via `python3 -m http.server 8000` from repo root, open `http://localhost:8000/test/`.

- All 10 week-blocks re-render on control change (150ms debounce)
- **Assessment tab:** task selector (AT1/AT2); `renderAssessmentPage`
- **Hybrid tab:** task selector; `renderAssessmentHybrid`
- **Course Hub tab:** `renderCourseHub`
- **Checklist tab:** task selector; `renderPresubmissionChecklist`
- **Navigation tab:** side-by-side `renderUnitKeyInfo` + `renderAssessmentStatus`
- **Cache note:** hard-refresh (Cmd+Shift+R) after updating `blocks.js`

---

## Generator

`generate/index.html` — select unit, year, trimester, page type, click Generate. Shell types listed above in Phase 2.

---

## Trimester start dates

| Year | T1 | T2 | T3 |
|---|---|---|---|
| 2026 | 2026-02-23 | 2026-06-22 | 2026-10-19 |
| 2027 | 2027-02-22 | 2027-06-21 ⚠️ | 2027-10-18 ⚠️ |

⚠️ 2027 dates are estimates — confirm against UNE academic calendar.

---

## Known issues

1. **EDSE357 — all week links null:** unit is live but content links not yet added; render as Coming soon chips.
2. **EDSE358 AT1 assessmentFiles — all null:** task and marking URLs not yet uploaded for AT1 disciplines.
3. **EDSE357 AT2 rubric link null:** add URL when rubric PDF is published.
4. **EDSE358 missing week links:** week 1 (all), week 3 (recording), week 1 (lecture/slides/recording/liveHub).
5. **`DGIXT7ce3vQ` — third-party placeholder video:** used for PE weeks (9–14) and EDIT* arrays. Not university-owned — replace when a stable owned video is available.
6. **`announcementBody.keyIdea`:** stored in some EDSE358 weeks but not rendered. Future enhancement.
7. **EDSE362 — content not yet populated:** go-live 2026-06-22; title/rationale/aim/parts/rubric still null for both ATs.
8. **EDSE362 Zoom not yet created:** add Zoom meeting ID and URL to `trimesterConfig.T2-2026` before go-live.
9. **Pre-submission checklist — static templates:** do not write a fourth static template — refactor first (ACTION-PLAN item 15).
10. **Existing Moodle shells for renderAssessmentPage show no due date:** shells deployed to Moodle for T1 2026 don't pass `forTri`/`forYear`. Both T1 ATs are past due — low impact. New T2 shells from generator will include tri/year correctly.
11. ~~**EDSE358 alignment fields stored but not rendered**~~ — ✅ RESOLVED 2026-05-21.
12. **EDSE358 AT1 shell needs replacing in Moodle:** updated shell in `docs/EDSE358-new-shells-may2026.html` Section 1. Reflects D1/D2 split, updated rubric, guidanceNotes.
13. **EDSE362 lecturer name null:** `contacts.lecturer.name` null across all three units.
14. **EDSE357 orientation notes and forum prompts not yet deployed to Moodle:** shells ready in `docs/EDSE357-new-shells-may2026.html`. Low priority — T1 2026 past due.
15. **EDSE357 AT1 assessment page shell may need regenerating:** Part D rubric descriptors updated. Low priority — T1 2026 past due.
16. **EDSE357 AT1 `taskGuidanceNotes` not yet rendered:** new task-level field added; `renderAssessmentPage` does not yet read it. Will render after `renderAssessmentPage` is updated to read `taskGuidanceNotes`.
17. **EDSE362 week links and videos all null:** all render as Coming soon chips; video IDs default to placeholder. Populate before T2 2026 go-live.
18. ⚠️ **EDSE357 and EDSE362 AT links use `taskFiles` — not yet migrated to `instructions`:** `blocks.js` (`buildTaskSections` and `buildHybridTask`) now reads `lnk.instructions`. EDSE357 and EDSE362 configs still have `taskFiles` field. Their "Task files" buttons will render as disabled in `renderAssessmentPage` and `renderAssessmentHybrid` until the field is renamed in both unit JSONs.
19. ⚠️ **EDSE358 AT2 T1-2026.due = 2026-09-06:** T1-2026 typically ends in May; September date is unusual for a T1 trimester. Verify this is intentional.

---

## Next tasks in priority order

1. **⚠️ URGENT: Migrate EDSE357 and EDSE362 AT links `taskFiles` → `instructions`** — until done, "Task files" buttons render disabled for both units in `renderAssessmentPage` and `renderAssessmentHybrid` (Known Issue 18).
2. **EDSE362 go-live prep (2026-06-22):** Zoom setup; assessmentTask title/rationale/aim/parts/rubric bodies; lecturer name; video IDs; week links (ACTION-PLAN item 17). Go-live is ~17 days away.
3. **Paste EDSE358 new shells into Moodle** — `docs/EDSE358-new-shells-may2026.html` is ready (7 shells). Replace AT1 assessment page; add orientation notes/forum prompts/worked example to module pages.
4. **EDSE358 week 1 links** — lecture/slides/recording/liveHub still null; forum and materials now populated.
5. **EDSE357 week links** — all null; add as content is published.
6. **Verify EDSE358 AT2 T1-2026.due** — currently 2026-09-06 which is atypical for T1 (Known Issue 19).
7. **Checklist refactor** — config-driven refactor before writing a fourth static template (ACTION-PLAN item 15).
8. **Alignment map renderer** — `renderAlignmentMap()` as 19th render function (ACTION-PLAN items 16/21/23).
9. **Apply alignment fields to EDSE362** — orientationNote, forumPrompts, workedExample, synthesisTemplate, guidanceNotes.

---

## Session notes

### 2026-06-05 — EDSE358 AT links schema overhaul; renderAssessmentHybrid; Week 2 forum prompts

**Completed this session:**

**EDSE358 Week 2 forum prompts (commit `e589105`):**
- 3 forum prompts added to Week 2 ("The Nature of Science Teaching"):
  - "What does it mean to teach in the 21st century? Cite evidence to support your response."
  - "What does the science teacher know? Cite evidence to support your response."
  - "What does the science teacher do? Cite evidence to support your response."
- Week 2 is now FULL (all tracked fields populated)
- Same commit also updated Week 1 (forum and materials URLs), Week 3 (lecture, slides, liveHub URLs), Week 4 (slides URL, recording added)

**EDSE358 AT links populated and schema overhauled (commits `e0e81d0` through `2301a3d`):**
- AT1 and AT2 `links` objects fully populated with real Moodle URLs
- Schema change: `taskFiles` field renamed to `instructions` in EDSE358 AT1 and AT2
- New field `resourceTable` added to both ATs (AT1: null, AT2: URL set)
- New field `template` was already present; kept
- AT2 `instructions` URL corrected through two iterations (broken PDF link → task files folder → final PDF URL)
- AT2 T1-2026.due updated to 2026-09-06; AT2 T2-2026.due set to 2026-09-06

**`blocks.js` updated — `buildTaskSections` (renderAssessmentPage) and `buildHybridTask` (renderAssessmentHybrid):**
- Both functions now read `lnk.instructions` (was `lnk.taskFiles`) for the "Task files" button
- Both functions now include `lnk.resourceTable` → "Assessment resources" button between "Task files" and "Template"
- Old separate `template` entry removed and replaced within the three-button group: Task files / Assessment resources / Template
- ⚠️ EDSE357 and EDSE362 still use `taskFiles` in their configs — those units' buttons will be disabled until migrated (Known Issue 18)

**`renderAssessmentHybrid` documented (fn 10):**
- Function existed before this session but was not in the briefing
- Confirmed: reads same `lnk.*` fields as `renderAssessmentPage`; both now aligned on `instructions` + `resourceTable`
- 18 total exported functions (was 17 in previous briefing — `renderAssessmentHybrid` was missing from count)

**Key design decisions:**
- `instructions` replaces `taskFiles` as the field name because the URL points to task instructions/files folder, and the label "Task files" is preserved in the UI regardless of field name
- `resourceTable` is a new field for assessment resource tables (e.g., marking resource overview pages) — distinct from `instructions` (task brief/files) and `rubric` (marking rubric PDF)
- Both `buildTaskSections` and `buildHybridTask` must stay in sync on button field names — when one is updated, always update the other

### 2026-05-22 — Multi-task tabbed assessment page; renderAssessmentNav; generator shell types

*(Previous session — details in git history. Summary: renderAssessmentNav added as fn 17; generator shell types expanded; test harness view mode selector added; multi-task tabbed mode for renderAssessmentPage.)*

### 2026-05-21 — EDSE357 LO replacement and alignment map template

**EDSE357 `learningOutcomes` replacement:** old `title`/`gtsd` schema → new `label`/`aitsl` with 6 official unit outcomes (LO1 Science Content & Teaching Strategies, LO2 Assessment Knowledge, LO3 Investigative Skills & Safety, LO4 ICT & Resource Evaluation, LO5 Professional Resources & Networks, LO6 Critical Textbook Analysis).

`templates/constructive-alignment-map-EDSE357.html` added — static student-facing alignment map; blue/teal theme; G1–G7 improved state.

### 2026-05-21 — EDSE357 constructive alignment audit G1–G7

Alignment improvement fields added to weeks 3/5/7 (`orientationNote`, `forumPrompts`). AT1 Part D rubric updated — analytical reflection focus. AT2 Diversity & Intentional Curation rubric updated. `taskGuidanceNotes` added to AT2 (task-level, not yet rendered). `feature/edse357-alignment-improvements` → dev → main.

### 2026-05-21 — Constructive alignment visibility layer; EDSE358 data fixes; generator bug fix

Generator bug fix: `unitCfg.weeks` is a plain object — always use `Object.entries()` to iterate, never `.map()` directly. EDSE358 AT1 data fixes (LOs, AITSL standards, part titles). EDSE358 LOs replaced (6 stale → 4 correct). `loMapping` added to all teaching weeks across all three units. Reverse alignment map in `renderLearningOutcomesTable`. `feature/alignment-visibility` → dev → main.

### 2026-05-21 — EDSE358 alignment map; forWeek fix; production shells generated

Bug fix: `renderOrientationNote`, `renderForumPrompts`, `renderWorkedExample` missing `forWeek`/`forDate` in signatures — fixed. Gitignore extended for dated shell files. `templates/constructive-alignment-map-EDSE358.html` added. Production shells generated (`docs/EDSE358-new-shells-may2026.html`, 7 shells).

**Rule:** week-pinned supplementary blocks (orientationNote, forumPrompts, workedExample on module pages) use `forWeek: N`. Dynamic current-state blocks (announcement, workflow, lecture, live-hub) omit `forWeek`. Always include `forWeek`/`forDate` in week-aware render function signatures.

### 2026-05-21 — ACTION-PLAN item 18 complete: render alignment fields

Three new render functions: `renderOrientationNote` (fn 13), `renderForumPrompts` (fn 14), `renderWorkedExample` (fn 15). `guidanceNotes` rendered in `renderAssessmentPage`. `synthesisTemplate` in generator admin tool (lecturer-only). Checklist template `EDSE358-AT1` updated for D1/D2 split.

### 2026-05-21 — EDSE358 alignment audit G1–G8; EDSE362 updates

AT1 Part D split into D1 (feedback planning) + D2 (reflective self-assessment), each 5 marks. Rubric descriptors updated G1–G8. EDSE362 T2-2026 dates corrected; LOs added; keyLinks populated. `renderUnitKeyInfo` contacts section added. `feature/edse358-rubric-gaps`, `feature/edse362-assessment-content` → dev → main.

### 2026-05-19 — T2 2026 prep: per-trimester dates schema

`trimesterDates` schema introduced — flat `due`/`duePartA`/`flexiblePortal` replaced by object keyed by `{forTri}-{forYear}`. All render functions updated. **Zoom resolved from `trimesterConfig` only — do not add Zoom URLs to week `links` objects.**

### 2026-05-19 — Navigation blocks; SVG banners; shells deployed

`renderUnitKeyInfo` (fn 11) and `renderAssessmentStatus` (fn 12) added. SVG banners for all three units. Navigation shell files generated.

### 2026-05-17 — Production deployment: all phases complete

Final dev→main merge (`449164f`). All phases complete and in production. GitHub Pages confirmed serving from `main`.

---

## Critical constraints (always apply)

- **`whatson/whatson.js` and `autovideos/autovideos.js` are config-driven (Phase 4, in production).** Live for enrolled students. All changes follow `feature/* → dev → sandpit → main`.
- **Never commit directly to `main`.**
- **EDSE357, EDSE358, and EDSE362 are live or about to go live.** Breaking changes are not acceptable.
- **`<\/script>` in shell template literals** — use `<\/script>` inside JavaScript strings to prevent premature tag closure.
- **`import.meta.url`** — used in `blocks.js` to derive config base URL. Works from any host without hardcoded URLs.
- **GitHub Pages is on `main`** — do not switch back to `dev` without a deliberate sandpit decision.
- **Zoom is resolved from `trimesterConfig`, not week-level `links.zoom`** — keep week `links.zoom` null.
- **`buildTaskSections` and `buildHybridTask` must stay in sync** — when button field names change in one, update the other immediately.
- **Always use `Object.entries()` when iterating `unitCfg.weeks`** — it is a plain object, not an array. Never call `.map()` on it directly.
- **EDSE358 AT links use `instructions`/`resourceTable` schema; EDSE357 and EDSE362 still use `taskFiles`** — do not confuse the two schemas; migrate EDSE357 and EDSE362 before relying on their AT buttons.
