# Design spec — Deep-dive view redesign (Framework Explorer)

**For:** Claude Code, working in the LXDUNE repo
**From:** Steve Grant (via claude.ai session, 1 Oct 2026)
**Reference implementation:** `proto-B2-dashboard.html` (accompanies this spec, in this folder)
**Scope:** the **deep-dive** view only (`hits-nsw-science`). Matrix and grid views are out of scope.
**Status:** approved design. Phase 0 (read the current renderer) is a hard gate — do not edit before it.

---

## Decisions after Phase 0 (2026-10-01) — these override the spec text below

Phase 0 reconciled this spec against `moodle-blocks/framework-explorer.js` and the item files. Steve's answers:

- **The data wins over the spec.** Use the item files' field names throughout: `badges[]` (not `effect[]`), `detail` (not `det`), `weekLabel` (not `wk`), `focusArea` (not `focus`).
- **Switcher figure stays `badges[0]`** (current behaviour), not the highest effect size (§5.B corrected).
- **Transfer** sits in the **Evidence & transfer** panel, as in the prototype (§5.E's order ends at impact).
- **Continuum** levels are labelled **"Level 1–4"**, never "Stage", to avoid clashing with NSW syllabus Stages (§5.G).
- **Strategy name is an `h2`**, not `h1`: the Moodle page and the framework title already use `h1` (§5.C).
- **Version:** stamp the renderer as `data-fx-renderer` and add a note to the hits CHANGELOG. No content-version bump, so the content hash is unchanged (§11).
- **Fonts:** keep the Georgia serif headings (a system font, no download).
- **Scoping:** the deep-dive mount gets `lxd-fx lxd-fx-dd`, and every deep-dive root rule is scoped to `.lxd-fx.lxd-fx-dd`, so the matrix on the same page (EDSE362) is not restyled. Scrollspy uses `IntersectionObserver` (Moodle may scroll inside `#page`, not the document). The prototype's bare `.lxd-fx, body { overflow-x:hidden }` rule is dropped.

### Accessibility gaps in the prototype that the port fixes

`proto-B2-dashboard.html` is the approved look, **not** an accessible implementation. It carries these defects, all fixed in the port and not to be copied:

| Prototype | Measured | Port |
|---|---|---|
| `--muted` `#6E7B84` text | 3.82:1 on `--bg` | `#636F77` (4.53:1 on `--bg`, 5.16:1 on paper) |
| White numerals inside the level 1–2 continuum dots | 2.49:1 and 4.26:1 | dots carry no text; the level number is in the label beneath |
| Level-1 dot `#9AA6AD` against `--bg` | 2.19:1 (below 3:1 for graphics) | light fill kept, with a 2px darker ring |
| Evidence panel header, white on `#6E7B84` | 4.35:1 | header uses `#636F77` (5.16:1) |
| Gold phase colour `#8A7A24` with white ruler text and week badge | 4.29:1 | `#7A6B1F` (5.32:1) |
| Gold eyebrow text `#A5822C` | 3.60:1 on paper | `#8A6D22` for text (4.89:1); `#A5822C` kept for the focus ring (3:1 is enough for a non-text indicator) |

It also lacks tab ARIA and arrow keys, `aria-controls` on phases, `aria-current` on pills and the switcher, and an `aria-live` continuum detail; its ruler and phase scrolling ignore `prefers-reduced-motion`; and its unprefixed classes (`.badge`, `.panel`) would collide with Moodle's Bootstrap. The switcher uses an `alert()` placeholder. Its hard-coded effect sizes are illustrative and do not all match the data.

---

## 1. What this is

The deep-dive view currently renders each HITS strategy as a set of stacked sections. We prototyped three readability directions and Steve selected the **dashboard** direction, then refined it. This spec ports that refined design into the live renderer.

**This is a rendering-layer change only.** The content already lives in the validated per-item JSON files under `frameworks/hits-nsw-science/items/`. **No schema changes, no new fields, no content migration.** Every component below is driven by fields that already exist and already pass `npm run validate`.

The accompanying `proto-B2-dashboard.html` is the **reference implementation**. Its CSS and its interaction JS are the source of truth for exact look and behaviour — port those patterns into the renderer and `theme.css`; don't reinvent them, and don't paste the prototype in wholesale (it has content hard-coded; the renderer builds the same markup from JSON).

---

## 2. Phase 0 — read first, then stop

You have repo access; this spec was written without it. Before editing:

1. Open `moodle-blocks/framework-explorer.js` and identify the **deep-dive render path** — the function(s) that build the deep-dive DOM from an item's JSON. Note its name and how it currently emits each section; this spec refers to it generically.
2. Confirm the **scoped class prefix** the renderer uses (the prototype uses `.lxd-fx`; match whatever the live renderer already uses — do not introduce a second prefix).
3. Confirm where the **deep-dive CSS** lives (`theme.css` or inline in the module) and follow that convention.
4. Confirm how the renderer obtains the **list of sibling items** in the framework (needed for the strategy switcher, §5.B) — whether `framework.json` enumerates items with name/ordinal, or each item file is fetched.
5. Confirm the **`data-fx-*` version/content-hash stamping** path so the redesign preserves it.

Report a short reconciliation note — for each component below, *matches current structure* / *adapt* / *needs decision* — then wait.

---

## 3. What changes, at a glance

| Component | Current | New |
|---|---|---|
| Section layout | stacked sections | stacked **colour-coded panels**, full width |
| Within-strategy nav | none | **sticky section pills** (jump + scrollspy) |
| Between-strategy nav | (confirm current) | **10-strategy switcher** at top |
| Exemplar phases | shown open | **accordion, collapsed by default**; expand-all control; week-ruler jumps + expands |
| Indicators | (keep) | **tabs** — Teacher / Not demonstrated / Students (unchanged idiom) |
| Continuum | 4-cell grid | **maturity track** — connected nodes, progress fill, click-to-reveal |

The layout deliberately moved from a two-column card grid to **full-width stacked panels** so section pills have unambiguous scroll targets (and it removes the uneven-card-height problem the grid had).

---

## 4. Design tokens

The prototype's `:root`-level tokens are reproduced below. **Most already exist in `theme.css`** — reuse the existing token names; add only what's missing. Do **not** duplicate a token under a new name.

```
--bg:#F2F0EA; --paper:#FFFFFF; --sunk:#F6F4EF;
--ink:#19282F; --body:#3B474F; --muted:#6E7B84;
--line:#E2DDD2; --line2:#D4CDBF;
--accent:#1C4C5B; --accent-soft:#E0EBEE; --accent-line:#B7D0D6;
--pos:#2C6046; --pos-soft:#E5EFE9;      /* teacher indicators */
--neg:#8B4232; --neg-soft:#F4E7E2;      /* not-demonstrated   */
--stu:#3F4E86; --stu-soft:#E8EAF4;      /* student indicators */
--gold:#A5822C;                         /* eyebrow / focus ring */
```

> **Contrast correction — apply during the port.** The prototype's `--muted` (`#6E7B84`) is only **3.82:1** on `--bg` (verified), which fails AA for normal text — and it is used widely (meta lines, captions, ruler hint, evidence line, switcher sub-labels). **Darken `--muted` to `#636F77`** (4.53:1 on `--bg`, 5.16:1 on `--paper`), or darker. This one token change fixes every muted-grey instance at once.

Panel-header colours (distinct per section): faculty `--accent` · exemplar `#2F6E6A` · indicators `--stu` · continuum `#356974` · evidence `#6E7B84`.

Phase palette (assign by phase index, cycling): `["#1C4C5B","#2F6E6A","#8A7A24","#8C4E2E","#6B3F63"]`. Items with up to 5 phases use all five; the renderer must assign by index, not hard-code four.

Fonts: **inherit the Moodle theme stack** (body) with a serif stack for headings (`Georgia, "Times New Roman", serif`), exactly as the prototype. **No external font links** — this is a hard Moodle constraint.

---

## 5. Component specs

Behaviour and exact styling: see `proto-B2-dashboard.html`. Below is the contract each component must meet and its data source.

### 5.A Panel shell & section model
Five sections, each a full-width panel with a coloured header bar. A pill and a panel exist for a section **only when its data is present** (all current deep-dive items have all five, but render defensively — e.g. skip transfer sub-block if `transfer` is absent). Each panel carries `id="sec-<key>"` and `scroll-margin-top` clearing the sticky pill bar.

Section keys and order: `faculty` · `exemplar` · `indicators` · `continuum` · `evidence`.

### 5.B Strategy switcher (between-strategy wayfinding)
A panel at the very top listing **all items in the framework** as chips: zero-padded ordinal, name, and primary effect size. Current item is marked (`.on`, and `aria-current="true"`). Clicking a chip loads that strategy's deep-dive (same mechanism the renderer already uses for item navigation — wire to that, not to a prototype `alert`).

- **Primary effect size** = the highest numeric `effectSize` badge in that item (ignore `monthsProgress`). For Setting Goals that is 0.75.
- **Data source:** the sibling-item list from Phase 0 step 4. Cache in memory; do not refetch per interaction.

### 5.C Header
Eyebrow (`High Impact Teaching Strategy <ordinal> of <count>`), `name` as `h1`, `headline`, then badges. **Badges have two kinds** — render both: `effectSize` (label · value, first one filled in `--accent`) and `monthsProgress` (e.g. "+8 months", muted/secondary styling, the prototype's `.mop` treatment). Several items (Feedback, Metacognitive Strategies, Collaborative Learning, Multiple Exposures, Differentiated Teaching) carry a months-progress badge — do not drop it.

### 5.D Section pills (within-strategy wayfinding)
A **sticky** bar below the header. One pill per present section. Behaviour:
- Click → smooth-scroll to that panel (respect `prefers-reduced-motion`: no smooth scroll under reduce).
- **Scrollspy** → the pill for the section currently in view gets `.active` and `aria-current="true"`; others clear it.
- Horizontal-scroll on narrow widths (no wrap-induced layout shift); must not cause page overflow (see §9).

### 5.E Exemplar
Order inside the panel: meta line → problem → week ruler → expand-all control → phase accordion → impact → transfer.

- **Meta line.** Handle **both** context shapes the schema allows: a single context (`stage`, `syllabus`, `focus`, `duration`) **and** a multi-context exemplar (`scope`, `spans[]`, `label`) — about half the HITS items span a whole year, the whole faculty, or several modules. Read the item files to see both shapes before writing this; render a sensible dotted meta line for each.
- **Problem** — `exemplar.problem`, in the tinted callout.
- **Week ruler** — one segment per phase, `flex-grow` proportional to `span.end − span.start` (min ~0.6 so a one-unit phase stays clickable), coloured by phase index. Compute the scale from `max(span.end)` across the item's phases — **do not assume a 10/11-week maximum**; Multiple Exposures runs across the year. Clicking a segment opens the matching phase and scrolls it into view.
- **Phase accordion — collapsed by default.** Each phase is a row showing week badge + label only; the `what` and `det` are revealed on expand. Header is a real `<button>` with `aria-expanded`. An **Expand all / Collapse all** control toggles every phase and keeps its own label in sync.
- **Impact** — `exemplar.impact`, in the positive-tinted callout.
- **Transfer** — `transfer.label` (bolded) + `transfer.text`, in the dashed sub-card.

### 5.F Indicators
Three tabs — Teacher / Not demonstrated / Students — over `indicators.teacher`, `indicators.notDemonstrated`, `indicators.student`. Keep the idiom from the prototype. Upgrade the ARIA to proper tabs (see §8).

### 5.G Continuum — maturity track (the one genuinely new component)
Replaces the 4-cell grid. Four `continuum[]` levels rendered as connected nodes on a horizontal line:
- Nodes left→right, deepening colour (level 1 lightest → level 4 `--accent`), connected by a track line with a **progress fill** that extends to the selected node.
- A caption states the progression ("A faculty moves left to right over years — select a stage to see what it looks like in science").
- Clicking a node reveals that level's descriptor in a detail panel below (level label + `text`). **Default: level 1 selected** so content is visible on load.
- The detail panel is an **`aria-live="polite"`** region so the change is announced to screen readers.

**Accessibility fix — do this in the port, do not copy the prototype here.** In the prototype the stage **number sits inside the coloured dot in white**, and on the two lightest nodes that fails WCAG AA contrast (verified: white on `#9AA6AD` = **2.49:1**; on `#5E8089` = **4.26:1** — both under 4.5:1 for the numeral). Fix by **removing text from the dots** — make the dots pure progression markers (a graphical element, which only needs 3:1 non-text contrast against the background) and carry the stage number in the text label beneath each node, which sits on the page background and passes comfortably. This keeps the light→dark progression intact and resolves the contrast defect.

### 5.H Evidence & transfer
`evidence` string (muted) and the **works-with** chips from `related[]` (each resolves to a sibling id — validator already guarantees this; wire the chip to the same navigation as the switcher).

---

## 6. Data → component map

| Field (existing) | Renders as |
|---|---|
| `ordinal`, `name` | header eyebrow + `h1`; switcher chip |
| `effect[]` (`effectSize` / `monthsProgress`) | header badges; switcher primary effect = max effectSize |
| `headline` | header sub-line |
| `inContext` | Faculty panel |
| `exemplar.{stage,syllabus,focus,duration}` **or** `{scope,spans[],label}` | exemplar meta line (handle both) |
| `exemplar.problem` | problem callout |
| `exemplar.phases[]` (`wk/weekLabel`, `span`, `label`, `what`, `det`) | week ruler + phase accordion |
| `exemplar.impact` | impact callout |
| `transfer.{label,text}` | transfer sub-card |
| `indicators.{teacher,notDemonstrated,student}` | indicator tabs |
| `continuum[]` (`level,label,text`) | maturity track |
| `related[]` | works-with chips |
| `evidence` | evidence line |
| sibling item list | strategy switcher |

Confirm exact field names against the item JSON while reading (Phase 0) — the schema was adapted from the original handoff and some names may differ from the above (e.g. `wk` vs `weekLabel`). The item files are authoritative.

---

## 7. Interaction & state

- **No browser storage** (no `localStorage`/`sessionStorage`) — hard constraint. All state (open phases, active tab, selected continuum stage, active pill) lives in the DOM/memory for the session, as in the prototype.
- Prefer **event delegation** from the view root (the prototype uses one click listener) so re-rendering on strategy switch doesn't orphan listeners.
- On strategy switch, re-render resets to defaults: phases collapsed, tab = Teacher, continuum = level 1, pills = first section, scroll to top of the view.

---

## 8. Accessibility (WCAG 2.1 AA — required)

- **Phases:** header `<button>` with `aria-expanded` toggling; panel associated via `aria-controls`.
- **Tabs:** `role="tablist"`/`tab`/`tabpanel`; `aria-selected`; left/right arrow keys move between tabs; selected tab in the tab order, others `tabindex="-1"`.
- **Pills:** buttons; `aria-current="true"` on the active (scrollspy) pill.
- **Maturity track:** nodes are buttons with `aria-pressed`/`aria-current`; detail panel `aria-live="polite"`; **dots carry no text** (see §5.G fix) so numerals can't fail contrast.
- **Contrast:** every text/background pair ≥ 4.5:1 (≥ 3:1 for ≥18.66px bold). Two verified defects in the prototype to fix in the port: the continuum dot numerals (§5.G) and `--muted` grey (§4, darken to `#636F77`). Re-check the three indicator tints after porting.
- **Focus:** visible focus ring on every interactive element (the `--gold` ring).
- **Reduced motion:** gate smooth-scroll and all transitions behind `prefers-reduced-motion` (prototype already does).
- **Targets:** interactive targets ≥ 44×44px where practical (pills, chips, phase headers, nodes).

Run the `design:accessibility-review` pass, or an axe check, on a rendered item before calling it done.

---

## 9. Moodle & platform constraints (non-negotiable)

1. **Scoped CSS** — every selector under the existing view scope class. No bare `body/h1/section` selectors leaking into the Moodle theme.
2. **No external resources** — no font links, no CDN. Inherit the theme font stack.
3. **No browser storage** (restated — it's the easiest to breach).
4. **No horizontal overflow at 390px.** This is the defect that bit the split-view prototype (a grid item without `min-width:0`). Measure it, don't eyeball it: `scrollWidth === clientWidth` at 390px. Guard sticky/overflow containers accordingly.
5. **Script must survive the Moodle editor save** — already proven for the current loader; keep the same loader pattern, don't add inline handlers the filter might strip.
6. Preserve the **`data-fx-framework` / `data-fx-version` / `data-fx-content-hash`** stamping.

---

## 10. Apply across the whole framework, not just Setting Goals

Setting Goals was the prototype's sample. The redesign must render **all ten** items correctly. Two items will stress the components and are the ones to test explicitly:

- **Multiple Exposures** — a **5-phase, year-long** arc and a multi-context exemplar. Exercises phase-palette cycling, the ruler scale beyond one term, and the multi-context meta line.
- **Differentiated Teaching** — a `1.07` effect size and a months-progress badge. Exercises badge rendering.

Do not touch the **matrix** or **grid** view code paths. After the port, confirm those two still render (they share the renderer module).

---

## 11. Definition of done

- [ ] Phase 0 reconciliation reported and agreed before edits
- [ ] Deep-dive renders all 10 items with the six components, from existing JSON, no schema/content changes
- [ ] Strategy switcher wired to real navigation (not a prototype alert); works-with chips and switcher share it
- [ ] Phases collapsed by default; expand-all works; ruler jumps + expands; variable phase counts and year-long spans handled
- [ ] Continuum maturity track with progress fill, click-to-reveal, **dots carry no text** (contrast fix applied)
- [ ] Multi-context exemplar meta line renders (tested on Multiple Exposures); months-progress badge renders (tested on a carrier item)
- [ ] Matrix and grid views still render unchanged
- [ ] `npm run validate` still passes for all frameworks
- [ ] Verified in a real browser: zero console errors; `scrollWidth===clientWidth` at 390px; keyboard path through pills/tabs/accordion/track; AA contrast; reduced-motion respected
- [ ] Verified **inside a Moodle (myLearn) sandbox page**, desktop and mobile — not only standalone
- [ ] `data-fx-*` stamping intact; CHANGELOG updated for the item view version

## 12. Out of scope

- Matrix and grid view redesigns
- Any content or schema change, any new field
- New frameworks
- The EDSE362 page edit (already live; it loads whatever the renderer produces)

## 13. Decisions already made (don't re-litigate)

- Winner: dashboard direction, refined (`proto-B2-dashboard.html`).
- Continuum defaults to **stage 1** selected on load.
- Expand-all defaults to **collapsed**.
- Layout is **full-width stacked panels**, not the two-column grid.

If something in the live renderer makes one of these materially harder than the prototype implies, raise it rather than silently diverging.

---

🤖 Reference implementation `proto-B2-dashboard.html` accompanies this spec. Treat its CSS and interaction JS as the pattern to port; treat its hard-coded content as illustrative only — the renderer builds from JSON.
