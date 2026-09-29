# LXDUNE: working rules for Claude

Claude Code reads this file automatically. It is also synced into the Claude chat Project, so both sides
work from the same rules. Keep it short: detail lives in the documents linked below.

## Read first

| Document | What it tells you |
|---|---|
| `docs/LXDUNE-ClaudeCode-Briefing.md` | What the repo is, the architecture, the units |
| `docs/ACTION-PLAN.md` | Current work, decisions and open items |
| `docs/reckoner-state.md` | Generated snapshot of the reckoner: guides, versions, examples, coverage, next action-plan item |
| `tools/reckoner/README.md` | Reckoner schema, publishing and review workflow |

When the repo and a handoff, a memory or this file disagree, **the repo wins**. Follow it and say what
differed in your summary.

## The site is live

Everything on `main` is served by GitHub Pages to enrolled UNE students through Moodle. A broken page is a
broken lesson. The Pages CDN caches files for up to 10 minutes after a deploy.

## Branches and releases

- New work goes on `feature/<name>` or `fix/<name>`, branched from an up-to-date `dev`. Never commit
  directly to `dev` or `main`.
- Only merge or release when Steve asks. `/ship` runs the whole release; the sequence it follows is:
  1. PR into `dev`, merged once the `Reckoner` check (and any other CI) passes.
  2. Merge `dev` into `main` with `--no-ff` and the message `Merge dev: <summary>`, then push.
  3. Wait for the Pages deploy, then confirm the live files match the repo byte for byte:
     `.claude/scripts/verify-pages.sh <main before> origin/main` does this, retrying through CDN lag.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, plus a
  `Claude-Session:` line when a handoff supplies one. PR descriptions end with the Claude Code line.

## Language

- Write "Aboriginal and Torres Strait Islander" in full. Never abbreviate it.
- Australian English.
- GTSD and AITSL are the same graduate standards; the JSON field is `gtsd`.
- Cite NSW syllabus outcome codes; do not quote or paraphrase NESA outcome wording.

## The reckoner (`tools/reckoner` → `reckoner/`)

- **Source of truth:** `tools/reckoner/content/` (guide YAML, `catalogue.json`, `questions.json`). Schema in
  `src/schema/`, page code in `templates/app.html` and `templates/app.js`, build in `scripts/lib/build.ts`.
- **Generated, never edited by hand:** everything in `reckoner/` and `docs/reckoner-state.md`.
  `npm run publish:pages` rebuilds both.
- **Checks**, run from `tools/reckoner`: `npm run validate`, `npm test`, `npm run typecheck`,
  `npm run check:pages`. CI runs the same. Use these rather than one-off scripts. If a handoff's check
  script assumes an older file layout, run these instead and report the difference.
- **Review copies:** `npm run review -- <guide id>` makes a single file to send to a reviewer.

### Content rules

- Published guides hold reviewed content only: `source: ai-drafted-reviewed` or `authored`, with
  `reviewedBy` filled in. Drafts from chat are `source: ai-generated`, `reviewedBy: []` until Steve signs off.
- **Change existing guides in place.** Never overwrite a guide file with an attachment or a copy from chat.
  Diff it against the repo first and apply only the intended change. Never delete or rewrite existing
  examples, phases, look-fors, sequences, misapplications or checklist items unless the task says so.
- **Versions:** bump from the current version in `docs/reckoner-state.md`, never set a literal, never go
  down. Patch for corrections, minor for added content, no bump for a nesting cross-reference only. Set
  `lastReviewed` to the review date.
- **New guide for a catalogue model:** add the guide and remove its catalogue entry in the same commit, so
  the model never drops out of the reckoner. The id must match `MODEL_REGISTRY` in `scripts/validate.ts`.
  If an id changes, search the whole repo for the old one, including `templates/app.js`.
- **Nesting is reciprocal:** when a guide nests with another published guide, add the matching line to the
  other guide too.
- **Action plan:** add a new item using the next number in `docs/reckoner-state.md`. Never reuse a number.

## Handoffs from Claude chat

- Use `docs/handoffs/TEMPLATE.md`, and save handoffs as `docs/handoffs/YYYY-MM-DD-<name>.md`. Claude Code
  applies them with `/apply-handoff <file>`.
- Draft against the synced repo files and `docs/reckoner-state.md`, not against memory of earlier chats.
- Send **new guides** as whole files. Send **changes to existing guides** as id-keyed blocks, for example
  "append example X to phase Y of guide Z" or "replace the `safetyNotes` block on sequence S".
- Describe versions as bumps and action-plan items as "the next item", not as literal numbers.
- State expected results as counts (models, guides, examples, tests), not file sizes.
- Claude Code starts every handoff with a read-before-writing step and reports before changing anything.

## Other areas

- `moodle-blocks/`, `config/`, `generate/`, `test/` and root `scripts/` drive the live Moodle unit pages.
  Leave them alone in reckoner work unless the task explicitly includes them.
- `frameworks/` is the Framework Explorer, validated by `npm run validate` at the repo root.
- Local preview of anything on Pages: `python3 -m http.server 8000` from the repo root, then open
  `http://localhost:8000/reckoner/`.
