# Framework Explorer

Config-driven teaching-framework artefacts for LXDUNE. The pedagogy lives in
validated JSON here; one shared renderer
([`moodle-blocks/framework-explorer.js`](../moodle-blocks/framework-explorer.js))
fetches it and renders Moodle-safe HTML at runtime — the same live-served model
as `blocks.js`. There is no build step and no `dist/`.

```
frameworks/
  _schema/
    framework.schema.json     JSON Schema (draft 2020-12) — per-file structure
    curriculum.vocab.json     controlled NSW syllabus vocabulary
  <framework-id>/
    framework.json            metadata, provenance, view type, source manifest
    …data files…              depends on view type (see below)
    CHANGELOG.md
```

Two **view types** are supported by the one renderer:

| viewType    | shape                | example                       |
| ----------- | -------------------- | ----------------------------- |
| `deep-dive` | a rail of rich items | `hits-nsw-science` (HITS)     |
| `matrix`    | two axes → a cell    | `metacognition-nsw-science`   |

## Deploying to Moodle

Paste a one-line loader into a Moodle page (a container div + module import):

```html
<div id="lxd-framework-explorer"></div>
<script type="module">
  import { renderFrameworkExplorer }
    from "https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/framework-explorer.js";
  renderFrameworkExplorer({ framework: "hits-nsw-science" });
</script>
```

Change `framework` to the framework id. Everything is scoped under `.lxd-fx`,
loads no external fonts, and uses no browser storage (handoff §7).

Each rendered mount is stamped with its data revision — inspect the container
element for `data-fx-framework`, `data-fx-version`, and `data-fx-content-hash`
(also emitted as an HTML comment), so any deployed page is traceable to an exact
framework version + content fingerprint.

## Testing / previewing

**Locally (before it's live on GitHub Pages).** Start the repo's static server
and open the preview harness — a switcher for every framework, width toggles
(mobile/tablet/desktop), and a live version-stamp readout:

```bash
python3 -m http.server 8000        # from the repo root
# then open http://localhost:8000/frameworks/preview.html
```

Check: it renders without console errors, the selector/phase/topic interactions
work, and the width toggles behave down to mobile.

**In a real Moodle page (the deployment test that matters).** The loader points
at GitHub Pages, so the module and data must be live there first — i.e. this
branch merged through to whatever branch Pages serves (`main`). Once live:

1. In a myLearn page, add the loader snippet above (HTML editor / source view).
2. Save and view the page as a student would.
3. Confirm: it renders inside the Moodle theme (no clashes with theme
   headings/footers), fonts inherit sensibly, colours are legible, and it works
   at desktop **and** mobile widths. Toggle the page/theme if your Moodle has a
   dark option.
4. Check the browser console for errors and confirm no external font/network
   requests are blocked.

If anything looks off against the theme, that's the §7 scoping to check first —
report it rather than editing in Moodle.

## Validating

```bash
npm run validate         # strict — the gate CI runs; use before shipping
npm run validate:wip     # partial migration — unresolved cross-refs are warnings
npm run validate hits-nsw-science   # a single framework
```

The gate enforces, and **fails the build** on:

- a schema violation (missing/mistyped field, below-minimum array, bad enum);
- a curriculum reference not in `curriculum.vocab.json`;
- a curriculum reference marked `supersededBy` in the vocab, unless the item
  sets `"acknowledgedSuperseded": true`;
- a `related` reference that doesn't resolve to a sibling item (or points to self);
- non-contiguous item ordinals;
- an incomplete matrix (a missing context × habit cell) or a duplicate cell;
- a `framework.json` manifest that doesn't match the files on disk.

The report lists each failure as `✗ <file>: <message>`. Warnings (`⚠`) don't
fail the build.

Structure is checked by JSON Schema; cross-file rules (references, ordinals,
completeness, vocab) are checked in `scripts/validate-frameworks.js`. That split
is deliberate — it's the boundary of what a JSON Schema can express.

## Adding a framework

1. Create `frameworks/<id>/framework.json` with `id`, `title`, `viewType`,
   `version` (semver), `vocabulary`, `attribution`, `sources`, and the source
   manifest for its view type (`items` for deep-dive; `matrix` for matrix).
2. Add the data files (below).
3. `npm run validate` until green.
4. Add a `CHANGELOG.md` (3–5 bullets per version).
5. Deploy with the loader above.

### deep-dive data

One file per item under `items/`, listed in order in `framework.json`'s
`items` manifest. Each item follows `$defs/deepDiveItem` in the schema:
`badges`, `inContext`, an `exemplar` (with `context`, `problem`, 3–6 `phases`,
`impact`), `transfer`, `indicators` (teacher ≥4 / notDemonstrated ≥4 /
student ≥3), a 4-level `continuum`, `related` sibling ids, and `evidence`.

**Exemplar context** is dual-mode. A single-placement exemplar uses
`stage` + `syllabus` + `focusArea` (all vocab-controlled). A cross-context one
(whole-year, faculty-wide, spanning modules) sets `scope` + `spans[]` and an
authored `label` for the display chip — so even thematic exemplars validate
against real vocabulary rather than free text.

### matrix data

Three files, named in `framework.json`'s `matrix` manifest:

- `habits.json` — the rows: `{ id, name, category, definition }`, where
  `category` ∈ `planning | monitoring | evaluating`.
- `contexts.json` — the columns, as a **stage → area → topic tree**: an array
  of stages `{ stage, label, sub, areas[] }`; each area
  `{ id, label, sub, acknowledgedSuperseded?, topics[] }`; each topic
  `{ id, name, tag, type: concept|skill, sci }`. `stage` and area `id` are
  vocab-controlled (area `id` is a focus area for Stage 4/5, a syllabus for
  Stage 6 — set `acknowledgedSuperseded: true` on Stage 6 areas that map to a
  superseded 2017 syllabus).
- `cells.json` — one `{ topicId, habitId, goal, script, why, evidence }` per
  **every** topic × habit pair. The gate fails on any missing pair.

## Curriculum vocabulary

`_schema/curriculum.vocab.json` is the single source of truth for NSW syllabus
references — stages, syllabuses, Stage 4/5 focus areas, Stage 6 modules, and
cross-cutting themes. Every `stage`/`syllabus`/`focusArea`/`syllabusArea`/`spans`
id used in a framework must resolve here. Syllabuses carry `activeFrom` and,
where relevant, `supersededBy` — content authored against a superseded syllabus
(e.g. the 2017 Stage 6 modules) must set `acknowledgedSuperseded: true` on the
item, which is how the deprecation path is made explicit rather than silent.

## Attribution

Each framework's `attribution` string is a licence obligation, not decoration —
HITS is CC BY 4.0 (State of Victoria) and requires attribution plus an
indication that changes were made. Do not drop or shorten it. Content here is a
faithful port; do not silently "improve" pedagogical text (handoff §13–§14).
