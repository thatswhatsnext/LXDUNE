# Assessment Page Design Review

**Branch:** feature/assessment-page-redesign  
**Date:** 2026-05-22  
**Data used:** EDSE358 AT1 — Teaching, Learning and Assessment Design (60%)  
**Theme:** Purple (#7C5DB6) / Cyan (#4FA9B5)

Three standalone HTML alternatives are in `moodle-blocks/bespoke/`. Each can be opened directly in a browser for review. None require external dependencies.

---

## Option 1: Cards (progressive disclosure)
**File:** `moodle-blocks/bespoke/assessment-page-cards.html`  
**Commit:** 826c5f1

### What it does
Five expandable cards, one per assessment part. Collapsed state shows: part label badge, title, one-line summary, and cyan marks pill. Click expands to full requirements, word count, and LO pills. A chevron rotates on open. `aria-expanded` toggled.

### Design character
Structured and scannable. Students see the big picture at a glance, then drill into what they need. Works well when parts have different completion states in the student's head.

### Strengths
- Lowest cognitive load on first view
- Works well on mobile (single-column responsive)
- Clear marks at a glance without scrolling

### Limitations
- Requires JS for expand/collapse (12-line inline script)
- Doesn't convey sequence or deadline variation between parts
- Part A's early deadline (22 March) isn't visually differentiated from other parts unless expanded

### Best for
Students who want to navigate directly to the part they're working on.

---

## Option 2: Journey (visual timeline)
**File:** `moodle-blocks/bespoke/assessment-page-journey.html`  
**Commit:** 48ad6e6

### What it does
Vertical timeline with a purple-to-cyan gradient left rail. Five milestone nodes (A, B, C, D1, D2) in coloured circles. Each node shows: part label, title, marks pill, description, LO pills, and colour-banded left border. Part A carries a warm-orange early-deadline badge. A final submission node closes the timeline.

### Design character
Narrative and motivational. The task is a journey with a clear start, middle, and end. The visual sequencing emphasises that parts build on each other.

### Strengths
- No JS required (fully static)
- Part A early deadline visually distinct (orange badge)
- Grouped colour banding (A=purple, B-C=cyan, D1-D2=teal) aids wayfinding
- Summary bar at bottom shows all LOs and total marks

### Limitations
- Longest scroll of the three designs
- Dense at first glance — less scannable than cards
- Timeline metaphor slightly misleading (parts overlap in practice)

### Best for
Students who benefit from seeing the task as a progressive build. Strong for orientation weeks.

---

## Option 3: Checklist (action-first)
**File:** `moodle-blocks/bespoke/assessment-page-checklist.html`  
**Commit:** 22d7ea5

### What it does
Task broken into 19 actionable checkbox items across five sections. CSS-only custom checkboxes (no JS). Decorative progress bar at top (35% demo). Each section has: part label pill, title, marks badge, LO pills. Part A has an orange early-deadline notice. All items use active verbs ("Choose", "Download", "Post"). Final submission callout in solid purple.

### Design character
Operational and practical. Treats the assessment as a to-do list rather than a specification. Students engage with it as something to do, not something to read.

### Strengths
- No JS required
- Most action-oriented of the three — clear "what do I do next?" UX
- Part A early deadline integrated naturally into the flow
- Checkboxes are Moodle-compatible (browser-native, CSS-styled)

### Limitations
- Checkbox state is not persisted (no storage) — purely visual/manual
- Requires the most careful writing to maintain accurate action items as the task changes
- Less information density per part than cards or journey (requirements are implicit in the actions)

### Best for
Students who are anxious about large assessments and benefit from breaking work into small concrete steps.

---

## Recommendation for Steve

| | Cards | Journey | Checklist |
|---|---|---|---|
| JS required | Yes (minimal) | No | No |
| Shows sequence | Partial | ✅ | Partial |
| Shows deadline variation | Partial | ✅ | ✅ |
| Lowest cognitive load | ✅ | ❌ | ✅ |
| Most actionable | ❌ | ❌ | ✅ |
| Best mobile | ✅ | ✅ | ✅ |

**If choosing one to deploy:** the Journey layout best communicates the progressive nature of the assessment and naturally highlights the Part A early deadline. The Checklist is the most student-centred. Cards is the most "LMS-standard" but doesn't add much over the current rendered design.

A hybrid worth considering: Journey header + Checklist body (timeline structure, action-item content per section).

---

## Option 4: Hybrid (Journey structure + Checklist content) — implemented

**File:** `moodle-blocks/bespoke/assessment-page-hybrid.html`
**Decision date:** 2026-05-23

### What it does
Journey's vertical timeline skeleton (gradient left rail, milestone circles, purple/cyan colour banding, header chips, summary bar) with Checklist-style content inside each card (checkbox action items with active verbs, early deadline notice, LO pills in the card header). Fully static — no JS, no collapsible toggle. Every part is always visible.

### Design character
Progressive and operational. The timeline communicates sequence and builds the sense of a journey toward submission; the action items make each step concrete and completable. Students see the whole task at a glance while knowing exactly what to do at each stage.

### What changed from each parent
- **From Journey:** kept outer layout, gradient rail, marker circles, colour bands, summary bar, header chips. Removed: collapsible JS, chevron, `ms-body` transition machinery.
- **From Checklist:** kept checkbox items, action verbs, early deadline notice (orange, Part A), inline deadline badge. Removed: progress bar (static percentage was misleading), flat card sections replaced by timeline cards.

### Strengths
- No JS — fully CSS-only, Moodle-safe
- Part A early deadline visually distinct (orange notice + inline badge)
- Checkboxes are browser-native/CSS-styled — state persists within the session
- Action verbs make each step unambiguous
- Summary bar retains total marks and LO overview
- Shorter scroll than original Journey (no expand/collapse latency)

### Limitations
- Longer scroll than Cards (everything open)
- Checkbox state not persisted across page loads (no storage)

### Verdict
Recommended for deployment. Retains Journey's motivational sequence while making every step immediately actionable. The removal of collapsibles reduces interaction friction — students don't have to discover that parts are clickable.

---

## Next steps

- [x] Steve reviews three initial alternatives
- [x] Hybrid implemented: `assessment-page-hybrid.html` on `feature/assessment-page-redesign`
- [ ] Steve reviews hybrid in browser at `http://localhost:8000/moodle-blocks/bespoke/assessment-page-hybrid.html`
- [ ] Adapt selected design for `renderAssessmentPage` (or a new bespoke block)
- [ ] Extend template for multi-part tasks across units
- [ ] Merge `feature/assessment-page-redesign` → dev when direction confirmed
