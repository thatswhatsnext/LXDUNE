# Handoff: <short title>

<!--
Template for handoffs written in Claude chat and applied in Claude Code with /apply-handoff.
Before drafting: Sync the Project, then read CLAUDE.md and docs/reckoner-state.md.
Save the finished handoff as docs/handoffs/YYYY-MM-DD-<short-name>.md, with any files it adds alongside it.
Delete these comments and any section that does not apply.
-->

**Reviewed and signed off by:** <name>, <YYYY-MM-DD>
<!-- Only content that has actually been reviewed can go into a published guide. Leave this out for code-only work. -->

**Branch:** `feature/<name>`

## Goal

<One or two sentences: what changes for students or teachers, and why.>

## Scope

- **Changes:** <paths>
- **Must not change:** <paths, for example: existing examples in other guides, moodle-blocks/>

## New files

<!-- Whole files are fine here, because nothing is being overwritten. -->

| File | Goes to | What it is |
|---|---|---|
| `<file>` | `tools/reckoner/content/guides/<file>` | New guide, published, v1.0.0 |

## Changes to existing files

<!--
One block per change, keyed by id, so it can be applied in place. Never attach a whole existing guide.
Describe versions as bumps (patch or minor), never as literal numbers.
Examples of the shape:
-->

### 1. `<guide id>`: append examples to phase `<phase id>`

```yaml
      - id: <example-id>
        kind: positive
        ...
```

### 2. `<guide id>`: replace `safetyNotes` on sequence `<sequence id>`

```yaml
    safetyNotes: |
      ...
```

### 3. `<guide id>`: add a nesting line

```yaml
  - { modelId: <id>, role: nests-in, phaseId: <phase id>, how: '<text>' }
```

**Version bumps:** `<guide id>` minor (content added); `<guide id>` none (cross-reference only).

## Expected results

<!-- Counts, not file sizes or literal versions. -->

- Models in the reckoner: <n>
- Published guides: <n>
- Examples across published guides: <n before> → <n after>
- Focus areas: <ready plan / examples only / empty>
- Checks: validate, test, typecheck and check:pages all pass

## Commits

1. `<type>(<area>): <subject>`: <what goes in it>

## Action plan

Next item: record <what>, and these open items: <list>.

## Open questions for review

<Anything uncertain: a scientific claim, a safety point, a stage placement.>
