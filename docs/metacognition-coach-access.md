# Metacognition Coach: options for securing access

**Status:** options only, for a later decision (Steve, 2026-10-09). The prototype is
public on GitHub Pages and students reach it through a link on Moodle.

## What "public" means today

- Anyone with the address can open and play the game. The address isn't secret once
  it is on a Moodle page.
- The approved content, including every correct answer, is readable in
  `games/metacognition-coach/content.json`. Securing the page keeps it from
  outsiders, not from students who can open the game.
- No student data reaches a server. Progress, drafts and commitments stay in each
  student's browser (`localStorage`, key `lxd-mcg-v1`), on the
  `thatswhatsnext.github.io` origin.

So the question for later is which of these you need: **(a)** only enrolled students
can open it, **(b)** progress that follows a student between devices, or **(c)**
Moodle knows who played (completion, grades).

## Options

| Option | Gives you | Effort | Notes |
|---|---|---|---|
| 1. Stay on Pages, unlisted | none of a–c | none | Today's setup. Fine while the content is the only thing at stake |
| 2. Upload to Moodle as a Folder or File resource | (a) | low–medium | Moodle serves the files behind its login. Needs a self-contained build (content, habits and vocabulary in one folder, since `coach.js` fetches the framework from `../../frameworks/`). Updates are re-uploads, not pushes to `main`. Progress moves to the myLearn origin. Check in the sandbox that Moodle serves `.js` and `.json` with usable types |
| 3. Package as SCORM 2004 in a Moodle SCORM activity | (a), (b), (c) | medium | Moodle stores progress in `cmi.suspend_data` (64,000 characters in SCORM 2004; SCORM 1.2's 4,096 is too small for the drafts and commitments), so it follows the student between devices. Completion and a score can go to the gradebook. Needs a small SCORM wrapper in place of the `localStorage` calls, and a re-upload for each update |
| 4. Put an access gate in front of a static host | (a) | low–medium | For example Cloudflare Access (one-time email PIN, or SSO if UNE allows it) in front of Cloudflare Pages, or a host's password protection. Moves the app off GitHub Pages. Free tiers have user caps; check them against cohort size. Anyone with a code or the password can still share it |
| 5. An LTI 1.3 tool | (a), (b), (c) | high | Moodle launches the game with a signed identity, and a small server stores progress and can return grades. The most capable option, but needs hosting and UNE IT to register the tool. The roadmap's "App / plugin pivot" |

Two things that look like options but aren't:

- **GitHub Pages access control** works only for private repositories on GitHub
  Enterprise Cloud, and viewers need GitHub accounts in the organisation. Not
  workable for students.
- **A token in the Moodle link, checked in the browser** can be read and skipped by
  anyone. Checking a token properly needs a server (option 4 or 5).

## A suggested path

1. Prototype on Pages (now).
2. If the concern is outsiders seeing the game, move to option 2: it keeps the game
   inside Moodle with the least change.
3. If students should keep progress across devices, or Moodle should record
   completion, go to option 3 (SCORM). It is the cheapest route to Moodle-held
   progress without running a server.
4. Option 5 only if the game grows past what SCORM can do (for example, a teacher
   view of student commitments).
