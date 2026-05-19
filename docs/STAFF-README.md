# LXDUNE — Moodle Page Maintenance Guide

A plain-language guide for unit coordinators and teaching staff.

---

## What this system does

Each unit's Moodle pages load their content automatically from a central configuration file. Edit the file, push the change to GitHub, and every Moodle page that uses that content updates itself on the next page load. No Moodle editing is required after the initial shell is pasted in.

The system covers:

| Block | What it shows |
|---|---|
| **Announcement block** | Weekly intro text, focus, how-to steps, assessment reminders |
| **Workflow card** | 5-step weekly guide with links |
| **Lecture block** | Echo360 embed and PDF slides link |
| **Live session hub** | Zoom link, preparation tasks, forum link |
| **Assessment download block** | Discipline-specific task and marking files |
| **Learning outcomes table** | Unit learning outcomes with colour-coded pills |
| **Course hub** | All weeks as collapsible rows — one overview on the homepage |
| **Assessment page** | Full AT1/AT2 task brief, rubric, rationale, and submission links |
| **Resource directory** | Bonus readings and supplementary materials for a specific week |
| **Pre-submission checklist** | Expandable checklist with per-item guidance (coming soon — see below) |

---

## Where the config files live

Each unit has one file in the `config/units/` folder:

```
config/units/EDSE357.json
config/units/EDSE358.json
config/units/EDSE362.json
```

These are plain text files written in JSON format — a structured list of labelled values. You don't need to understand JSON fully to make changes; the instructions below cover the common tasks.

There is also a shared file `config/trimester-config.json` that holds the start date for each trimester. This is rarely changed.

---

## How a change reaches Moodle

1. Edit the relevant config file and save it.
2. The change is committed and pushed to GitHub (done by whoever manages the repo — currently Steve Grant).
3. GitHub publishes the update to its public web address within one to two minutes.
4. The next time a Moodle page loads, it fetches the updated config and renders the new content.

**Nothing in Moodle itself needs to be edited after the initial shell is pasted in.**

---

## How to paste a shell into Moodle (initial setup)

Each Moodle page needs a small HTML shell pasted into it once. The shell is a short script tag and a container div — it fetches and renders content automatically every time the page loads.

Shells are generated from the **LXDUNE Generator** (`generate/index.html` — open locally in a browser). Pre-generated shells for each unit and trimester are saved as local HTML files (e.g. `docs/EDSE358-T1-2026-shells.html`) — open in a browser, click **Copy** next to the shell you need, then:

1. In Moodle, turn editing on and go to the relevant section or activity.
2. Open the HTML editor (click the `< >` source button in the toolbar).
3. Paste the shell code and save.

Each page needs its shell pasted **once only**. After that, all updates happen through the config file — never by editing the Moodle HTML again.

---

## Adding a link

Each teaching week has a `links` section:

```json
"links": {
  "lecture": null,
  "slides": null,
  "recording": null,
  "forum": null,
  "materials": null,
  "liveHub": null
}
```

Replace `null` with the URL in double quotes:

```json
"lecture": "https://echo360.net.au/your-lecture-url-here",
```

**Rules:**
- The URL must be inside double quotes.
- The comma after the closing quote must stay (except on the very last field in the section, which has no comma).
- Only replace `null` — do not delete the field name or the surrounding structure.

---

## What `null` means

Any field set to `null` shows a grey **Coming soon** chip on the Moodle page instead of a blank space or broken link. Students see a polished placeholder.

When content becomes available, replace `null` with the URL. The chip disappears automatically on the next page load.

---

## Updating weekly announcement text

Each week's `announcementBody` section has two fields:

```json
"announcementBody": {
  "intro": "Welcome to Module 3A...",
  "focus": "This week we focus on..."
}
```

`intro` is the opening paragraph. `focus` is the second paragraph — typically one or two sentences describing the week's central theme.

Edit the text inside the double quotes. Do not remove the quotes or the surrounding structure. Apostrophes within the text do not need escaping.

---

## Updating live session content

The live session hub reads from three fields in each week:

```json
"liveSessionFocus": "This session we will work through...",
"liveSessionTasks": [
  "Read the case study on the Assessment Portal before the session.",
  "Draft one assessment item aligned to your chosen syllabus outcome.",
  "Bring your unit outline — we will workshop it together."
]
```

- `liveSessionFocus` — one or two sentences shown at the top of the hub.
- `liveSessionTasks` — a list of preparation tasks shown as a checklist. Each item is a string inside the square brackets, separated by commas. The last item has no comma.

---

## Assessment file links (discipline downloads)

Each unit's `trimesterConfig` section holds the URLs for discipline-specific task and marking files:

```json
"T1-2026": {
  "assessmentFiles": {
    "biology":              { "task": "https://...", "marking": "https://..." },
    "chemistry":            { "task": "https://...", "marking": "https://..." },
    "ees":                  { "task": "https://...", "marking": "https://..." },
    "investigatingScience": { "task": "https://...", "marking": "https://..." },
    "physics":              { "task": "https://...", "marking": "https://..." }
  }
}
```

Replace `null` values with the Moodle file URLs (use the **pluginfile** URL from Moodle — right-click the file link in Moodle and copy the URL). These appear in the Assessment Download Block on the course homepage.

---

## Assessment task links (AT1 / AT2 pages)

Each assessment task has a `links` section inside `assessmentTasks`:

```json
"links": {
  "rubric":    null,
  "taskFiles": null,
  "submit":    null,
  "forum":     null
}
```

| Field | Where the URL comes from |
|---|---|
| `rubric` | The rubric PDF — pluginfile URL from Moodle |
| `taskFiles` | The task document PDF — pluginfile URL from Moodle |
| `submit` | The Moodle assignment submission page URL |
| `forum` | The Moodle discussion forum URL for this task |

---

## Assessment due dates and reminders

Each week can include an `assessments` array listing upcoming tasks:

```json
"assessments": [
  { "name": "Assessment Task 1", "due": "2026-04-14" }
]
```

The system reads these dates and shows an automatic reminder on the announcement block when a task is due within two weeks. Dates must be in **YYYY-MM-DD** format.

---

## Resource directory (bonus materials)

Any week can have a `resources` array for supplementary content:

```json
"resources": [
  { "label": "Bonus reading: Smith 2023", "url": "https://..." },
  { "label": "Resource list (Excel)", "url": null }
]
```

To add a resource, copy one of the lines above, paste it inside the square brackets, and fill in the label and URL. To remove one, delete the whole line including its comma. If a week has no extras, leave the array empty: `"resources": []`.

---

## Adding a new trimester

When a new trimester opens:

1. Add the trimester start date to `config/trimester-config.json` under the relevant year.
2. In the unit JSON, add a new entry under `trimesterConfig` with the new trimester key (e.g. `"T2-2026"`), including the Zoom meeting ID, password, and URL for that trimester.
3. Update the Moodle shell parameters (`forTri` and `forYear`) if re-using shells from a previous trimester — or generate new shells from the generator.

Contact Steve Grant if you are unsure which fields to update.

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| Page shows "Could not load content" | Config file has a formatting error, or GitHub publish hasn't completed | Wait 2 minutes and reload. If it persists, check for a missing quote or comma in the JSON — or contact Steve. |
| A link shows "Coming soon" when it should be live | The URL is still `null` in the config | Add the URL to the config file and push the change. |
| Page shows the wrong week's content | The trimester start date in `trimester-config.json` is wrong, or the Moodle shell has the wrong `forTri`/`forYear` | Check the start date and shell parameters — contact Steve to fix. |
| Page is completely blank (no error, no content) | The container div `id` in the Moodle HTML doesn't match the shell script | Contact Steve — the shell may need to be re-pasted. |
| Assessment page shows no rubric | Rubric descriptors are missing from `assessmentTasks` in the config | Contact Steve to populate the rubric fields. |

---

## Quick reference: link fields

| Field | What it controls |
|---|---|
| `lecture` | Echo360 embed on the Lecture page |
| `slides` | PDF slides link on the Lecture page |
| `recording` | Post-session recording link |
| `forum` | Forum link on announcement and live hub |
| `materials` | Topic reading/materials link (Workflow step 1) |
| `liveHub` | Link to the Live Session Hub page (Workflow step 2) |
| `announcementBody.intro` | Opening paragraph of the weekly announcement |
| `announcementBody.focus` | Focus sentence in the weekly announcement |
| `liveSessionFocus` | Focus sentence at the top of the Live Hub |
| `liveSessionTasks` | Preparation checklist on the Live Hub (list of 3 items) |
| `resources` | Bonus materials on the Topic page |

---

## Who to contact

| Issue | Contact |
|---|---|
| A Moodle page shows an error or blank content | Steve Grant |
| A link needs to be added — you have repo access | Edit the config file directly using the instructions above |
| A link needs to be added — you do not have repo access | Steve Grant |
| The trimester start date is wrong | Steve Grant |
| A new trimester needs to be set up | Steve Grant |
| A shell needs to be pasted into a new Moodle page | Steve Grant |
