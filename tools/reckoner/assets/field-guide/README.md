# Field Guide visual assets

Approved artwork from the Field Guide Visual Asset Kit v1.0 (approved 29 October 2026). `assets.json` is the
source of truth for which image goes where; `scripts/lib/assets.ts` reads it and checks every file against its
SHA-256 and stated dimensions on each build.

| Folder | What | Deployed |
| --- | --- | --- |
| `lessons/` | 26 lesson illustrations (lossless WebP), one per Fieldwork lesson | `play/img/`; the willow also as the Reckoner home hero in `reckoner/img/` |
| `brand/` | Family A marks for The Field Guide, Fieldwork and The Reckoner, and the favicon | Inlined into the page sprite and `<link rel="icon">` |
| `reference/` | Optional reference diagrams (model nesting, sampling, specimen) | Not deployed |

Placement rules:

- `placement: opening` shows on the lesson's first item, as the old plates did.
- `placement: after-attempt` shows only once `afterItem` has been answered, inside its feedback. `select-3-argue`
  is the only one: its nesting picture gives away the answer to the lesson's `nest` item.
- Reference diagrams must never appear before a prediction or as a new required screen. They are kept here
  for a future reference or reveal area.

Site builds copy the images next to the page and link them by relative path with a content hash, so they work
under any Pages subdirectory. Single-file builds (`npm run build:single`, review copies) embed them as data
URIs so the file works offline on its own.

The PNG masters stay in the kit archive; they are not needed to build or serve the site.
