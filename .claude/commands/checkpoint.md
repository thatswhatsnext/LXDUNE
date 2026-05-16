Update `docs/LXDUNE-ClaudeCode-Briefing.md` to reflect the current project state.

Before writing, gather the following from the repo:
- `git log main..dev --oneline` and `git rev-list --count main..dev` to establish branch delta
- Read all three unit JSONs to audit population status
- Read the current briefing to understand what has changed since the last checkpoint

Include the following sections in the updated briefing:

## Current branch status
- What is on `main` vs `dev`
- How many commits dev is ahead of main

## Phases complete
- List each phase and its status (complete / in progress / not started)

## Unit population status
For each unit (EDSE357, EDSE358, EDSE362):
- Which weeks are fully populated (announcementBody, liveSessionFocus, liveSessionTasks, links)
- Which weeks have null fields remaining
- Which links are real vs placeholder

## Known issues
List any flagged issues with links, data, or rendering.

## Next tasks in priority order
Numbered list of what comes next.

## Session notes
Any decisions made or patterns established in this session that should be preserved.

Commit the updated briefing to the current branch with message "chore: checkpoint briefing update".
Confirm the commit hash when done.
