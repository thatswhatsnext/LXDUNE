# LXDUNE Component Templates

Reference HTML implementations for all Moodle block components. These are the source of truth for `moodle-blocks/blocks.js`.

## Files

| File | Component | Used in |
|------|-----------|---------|
| `announcement.html` | Student Announcement Post | Moodle Student Announcements forum |
| `hover-workflow-card.html` | Hover Workflow Card | Topic/module pages — 5-step workflow |
| `lecture-slides-card.html` | Lecture + Slides Card | Topic pages — Echo360 embed + slides link |
| `live-session-hub.html` | Live Session Hub | Live session hub pages |
| `module-lecture-block.html` | Module Lecture Block (EDSE358 Module 4) | EDSE358 Module 4 — multi-lecture with sub-modules 4A–4D |
| `assessment-download-block.html` | Assessment Download Files Block | Assessment pages — discipline-specific file downloads |
| `learning-outcomes-table.html` | Learning Outcomes Table | Assessment pages — LO1–LO6 colour-coded pills |
| `feedback-comment.html` | Clean Feedback Comment | Moodle grading feedback boxes |
| `presubmission-checklist-EDSE357-AT1.html` | Pre-Submission Checklist — EDSE357 AT1 | Moodle AT1 assessment page — Parts A–D (11 items) |
| `presubmission-checklist-EDSE357-AT2.html` | Pre-Submission Checklist — EDSE357 AT2 | Moodle AT2 assessment page — 4 criteria (11 items) |
| `presubmission-checklist-EDSE358-AT1.html` | Pre-Submission Checklist — EDSE358 AT1 | Moodle AT1 assessment page — Parts A–D (16 items) |
| `unit-key-info.html` | Unit Key Info (navigation block) | Unit home page — banner, key links, contact toggle, due date chips, support callout |
| `assessment-status.html` | Assessment Status (navigation block) | Unit home page — one card per task, status chip, LO pills, action links |
| `constructive-alignment-map.html` | Constructive Alignment Map (generic template) | Unit pages — how each LO is taught, practised, and assessed; fully tokenised for reuse |
| `constructive-alignment-map-EDSE362.html` | Constructive Alignment Map — EDSE362 | EDSE362 T2 2026 — fully populated reference implementation |
| `constructive-alignment-map-EDSE358.html` | Constructive Alignment Map — EDSE358 | Student-facing constructive alignment map for EDSE358 — 4 LOs across Teaching, Practice, AT1 and AT2 columns. Purple/cyan theme. Reflects post-audit improved state (G1–G8). Click-to-expand rows show student advice. |
| `constructive-alignment-map-EDSE357.html` | Constructive Alignment Map — EDSE357 | Student-facing constructive alignment map for EDSE357 — 6 LOs across Teaching, Practice, AT1 and AT2 columns. Blue/teal theme. Reflects post-audit improved state (G1–G7). New formative activities in Topics 3, 5, and 7 flagged. Click-to-expand rows show student advice. |

## Dynamic value tokens

`{{PLACEHOLDER}}` tokens mark values injected at render time by `moodle-blocks/blocks.js` from the unit config JSONs. Do not replace them in these template files.

| Token | Config source |
|-------|--------------|
| `{{ZOOM_URL}}` | `unit.trimesterConfig["T1-2026"].zoom.url` |
| `{{FORUM_LINK}}` | `unit.weeks[n].links.forum` |
| `{{LECTURE_LINK}}` | `unit.weeks[n].links.lecture` |
| `{{SLIDES_LINK}}` | `unit.weeks[n].links.slides` |
| `{{RECORDING_LINK}}` | `unit.weeks[n].links.recording` |
| `{{ECHO360_URL}}` | `unit.weeks[n].links.lecture` |

All `null` config values render as styled "Coming soon" placeholder chips — never broken links.

## Notes

- Echo360 iframes must use `&amp;` not `&` inside `src` attributes.
- Hover workflow cards use CSS-only hover reveal; always visible on mobile via `@media (hover: none)`.
- `<details>`/`<summary>` is used for collapsible sections — safe in Moodle.
- Max-width: 800px for announcements, 950px for dashboards and pathway components.
