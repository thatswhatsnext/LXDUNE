---
description: Apply a Claude chat handoff (reckoner content or code) safely against the current repo, then commit and push a branch
argument-hint: "<handoff file in docs/handoffs/, or leave blank and paste the handoff>"
---

Apply a handoff written in Claude chat. The handoff says what to do; this command says how to do it
safely. Where the two disagree, this command and `CLAUDE.md` win, and the difference goes in the report.

Handoff: `$ARGUMENTS`
- If it is a path, read that file. Any attachments it names are either next to it or in `~/Downloads`.
- If it is blank, use the handoff pasted in the conversation, and the files attached with it.

## 0. Read before writing

Read `CLAUDE.md`, `docs/reckoner-state.md` and the whole handoff, including every attached file. Then report,
before changing anything:

1. **What the handoff will change**, file by file.
2. **Where the handoff disagrees with the repo.** Check each of these explicitly:
   - **Versions:** the current version of every guide it touches, from `docs/reckoner-state.md`. Bump from
     those, never to a literal version the handoff states.
   - **Action-plan item number:** use the next item number in `docs/reckoner-state.md`.
   - **File layout:** `reckoner/` is a shell plus `app.js` and `data/`. A handoff that expects
     `reckoner/index.html` to contain the data, or that lists only `app.html` for page code, is out of date.
   - **Ids:** every guide, phase, look-for and model id the handoff uses must exist or be new on purpose.
     If an id is being renamed, search the whole repo for the old one, including `templates/app.js`.
   - **Attached guide files:** for each attachment that would replace an existing guide, diff it against
     the repo. List every example, phase, sequence or look-for id present in the repo but missing from the
     attachment. **Never copy an attachment over an existing guide.**
   - **Its own check script:** note whether it reads files that no longer hold what it expects.
3. **The plan:** exactly what you will do, including how you will apply each attached change.

If the handoff has its own "Step 0", do that too and report its answers.

Then carry on, unless one of the "Stop and ask" cases below applies.

## 1. Branch

`git checkout dev && git pull`, then `git checkout -b <branch>`: use the branch the handoff names, or a
`feature/` or `fix/` name that describes the work. Never commit to `dev` or `main`.

## 2. Apply

- **New files** (a new guide, a new script): copy byte for byte, then `cmp` against the source.
- **Changes to existing guides:** apply in place, block by block. For each change, identify the target by id:
  - appending examples to a phase;
  - replacing a `safetyNotes`, `watchFor` or other block on a named sequence;
  - adding a nesting line.

  If the handoff only supplies a whole replacement file, extract the intended change by diffing it against
  the repo, and apply just that change.
- **Catalogue swaps:** adding a guide for a catalogue model and removing its catalogue entry go in the same
  commit. The catalogue file is indented with one space; remove the block without reformatting, and check
  `git diff --stat` shows deletions only.
- **Nesting:** when a guide nests with another published guide, make sure the other guide has the reciprocal
  line. A cross-reference only does not bump that guide's version.
- **Versions and dates:** patch for corrections, minor for added content, from the current version.
  Set `lastReviewed` (and any `provenance.reviewedOn` the handoff changes) to the review date it gives.
- **Provenance:** content going into a published guide must already be `ai-drafted-reviewed` or `authored`
  with `reviewedBy` filled in. Never mark content as reviewed yourself.

After applying, prove nothing was lost. For every edited guide, the list of example, phase and sequence ids
is the same as before, plus only the additions the handoff intended. `git diff --stat` per file should be
proportionate to the change described.

## 3. Check

From `tools/reckoner`: `npm run validate`, `npm test`, `npm run typecheck`, then `npm run publish:pages`
(which rebuilds `reckoner/` and `docs/reckoner-state.md`), then `npm run check:pages`.

If the handoff has its own check script, run it as written. If it fails only because it assumes an old
layout or old numbers, also run an adapted version that tests the same things against the current files.
Report both.

If the handoff states expected results (model count, guide count, examples, tests), compare them.

## 4. Action plan

Add an item to `docs/ACTION-PLAN.md` using the next number, recording:
- what was done;
- anything adapted from the handoff, and why;
- the handoff's open items.

Tick any existing open item this work completes. Then run `npm run status` again so the state file
reflects the new item.

## 5. Commit and push

Commit in the groups the handoff asks for, using its messages. Correct anything in them that would now be
false, such as a version number. Every commit ends with the trailer from `CLAUDE.md`; keep any
`Claude-Session:` line the handoff supplies.

Stage only the paths the work touched, and confirm nothing out of scope is staged. Push the branch. Do not
open or merge a PR: that is `/ship`, when Steve asks.

## 6. Report

- Step 0 findings, briefly, especially anything adapted.
- Each step's result: file checks, validate, test counts, typecheck, build line, check scripts.
- Commits and branch, with the link to open a PR.
- What Steve should look at before shipping, and how, for example the local preview URL.

## Stop and ask

- Applying the handoff as written would delete or rewrite reviewed content that it does not mention.
- Content to be published is not marked reviewed.
- A target id, phase or file the handoff names does not exist, and the intent is not obvious.
- The handoff asks for changes to `moodle-blocks/`, `config/`, `generate/`, `test/` or root `scripts/`
  without saying so explicitly in its scope.
- Validate, tests or typecheck fail after applying, and the fix is not a mechanical consequence of the
  handoff's own intent.
