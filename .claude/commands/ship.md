---
description: Release a branch - PR into dev, merge once CI passes, merge dev into main, confirm Pages is live
argument-hint: "[branch] [dev]   (default: current branch; add 'dev' to stop after merging into dev)"
---

Release work the way this repo always does: PR into `dev`, then `dev` into `main`, then confirm GitHub Pages
is serving it. Steve typing this command is the go-ahead for every merge below. Stop and report instead of
improvising if anything in the "Stop and ask" list happens.

Arguments: `$ARGUMENTS`
- A branch name, if given, is the branch to ship. Otherwise ship the current branch.
- If the word `dev` appears, stop after step 4 (merged into `dev`, not released).

## 1. Check it is safe to ship

Run `git fetch` first, then confirm all of these. Report them in one short block.

- The working tree is clean (`git status --short` is empty).
- The branch is a `feature/*` or `fix/*` branch, not `dev` or `main`.
- The branch is pushed and up to date with `origin` (push it if it is only ahead).
- The branch contains `origin/dev` (`git merge-base --is-ancestor origin/dev origin/<branch>`).
- `main` has no commits that `dev` lacks, apart from earlier `Merge dev:` commits:
  `git log --no-merges --oneline origin/dev..origin/main` is empty.
- If the branch touches `tools/reckoner/` or `reckoner/`: from `tools/reckoner`, `npm run validate`,
  `npm test`, `npm run typecheck` and `npm run check:pages` all pass.
- If it touches `frameworks/`: `npm run validate` at the repo root passes.

## 2. Open the PR into dev

If a PR from this branch into `dev` already exists, use it. Otherwise open one with `gh pr create --base dev`:

- **Title:** plain summary of the change, from the branch's commits.
- **Body:** what changed and why, grouped the way the commits are; a **Verified** line listing the checks
  that passed in step 1; anything a reviewer should know (for example a handoff instruction that was
  adapted). End with the Claude Code line required by `CLAUDE.md`.

## 3. Wait for CI

`gh pr checks <number> --watch`. Every check must pass.

## 4. Merge into dev

`gh pr merge <number> --merge` (a merge commit, never squash or rebase). Then `git checkout dev && git pull`.

If `dev` was requested, stop here and report.

## 5. Release: merge dev into main

1. Record the current `main`: `OLD=$(git rev-parse origin/main)`.
2. `git checkout main && git pull`, then
   `git merge --no-ff origin/dev -m "Merge dev: <short summary>"`.
3. Show `git diff --name-only HEAD~1 HEAD` and check it is only this work. If it contains anything
   unexpected, do not push: undo with `git reset --hard origin/main`, check out `dev`, and report.
4. `git push origin main`, then `git checkout dev && git pull`.

## 6. Confirm Pages is live

Run `.claude/scripts/verify-pages.sh "$OLD" origin/main`. It waits for the Pages deploy, then compares every
changed file on the live site with the repo, retrying for up to 12 minutes because of CDN caching. Give it
a Bash timeout of at least 15 minutes.

## 7. Report

Keep it short:
- PR link and merge commit, release merge commit.
- CI result, Pages deploy result, and the verify script's summary (how many files, all matching).
- Anything that needed a retry or was adapted.
- The live URL of what changed, for example `https://thatswhatsnext.github.io/LXDUNE/reckoner/`.

## Stop and ask

- Any step 1 check fails.
- A CI check fails: report the failing check and its log summary. Do not merge.
- `gh pr merge` or the `dev` into `main` merge reports a conflict.
- `main` has commits that `dev` does not.
- The verify script still reports differences after its timeout. Report which files, the byte counts
  and the HTTP codes. Do not change anything to make it pass.

Never force-push, never push directly to `dev`, never skip or disable CI, and never release a branch other
than the one named.
