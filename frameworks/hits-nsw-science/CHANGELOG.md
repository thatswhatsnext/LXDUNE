# Changelog — HITS in NSW Science

## Renderer deep-dive@2.0.0 — 2026-10-01 (content v1.0.0, unchanged)

- The deep-dive view is redesigned as a dashboard: strategy switcher, sticky
  section pills, five colour-coded panels, phase accordion (collapsed by
  default), indicator tabs and a continuum maturity track. Spec and reference
  prototype: `docs/handoffs/2026-10-01-deep-dive-redesign.md`.
- Rendering only. No item file changed, so the content version stays v1.0.0
  and the content hash (`data-fx-content-hash`) is unchanged.
- The layout is stamped separately as `data-fx-renderer="deep-dive@2.0.0"`, so
  a deployed page shows which renderer drew it.
- WCAG 2.1 AA verified on all 10 strategies at desktop and 390px: contrast on
  the rendered DOM, keyboard path, reduced motion, no horizontal overflow,
  axe with no violations.
- Attribution to the State of Victoria (CC BY 4.0) is unchanged.

## v1.0.0 — 2026-07-24

- Initial port from the standalone `HITS_in_NSW_Science.html` artefact into the
  Framework Explorer (deep-dive view).
- All 10 strategies migrated as one file per item; counts verified against
  source: 10 items · 43 phases · 140 indicators · 40 continuum cells.
- Exemplar contexts mapped to the controlled curriculum vocabulary, including
  dual-mode handling for the cross-context (whole-year / faculty-wide /
  module-spanning) exemplars.
- 2017 Stage 6 modules flagged `acknowledgedSuperseded` ahead of the 2025
  syllabuses (implemented 2027).
- Content is a faithful port; attribution to the State of Victoria (CC BY 4.0)
  preserved verbatim.
