# LXDUNE — How the Moodle Automation Works

A plain-language guide for unit coordinators and teaching staff.

---

## What this system does

Each unit's Moodle pages load their content automatically from a central configuration file. When you update that file and save it, the Moodle pages update themselves the next time a student (or you) loads the page. There is no Moodle editing required after the initial setup.

The system covers:
- Weekly announcement posts (intro text, focus, how-to steps, assessment reminders)
- Workflow cards (the step-by-step weekly guide)
- Lecture embed blocks (Echo360 recording and PDF slides)
- Live session hub pages (Zoom link, preparation tasks, forum link)
- Assessment download blocks (discipline-specific task and marking files)
- Learning outcomes tables

---

## Where the config files live

Each unit has one file in the `config/units/` folder:

```
config/units/EDSE357.json
config/units/EDSE358.json
config/units/EDSE362.json
```

These are plain text files written in a format called JSON. They look like a structured list of labelled values. You don't need to understand JSON to make changes — the instructions below cover everything you'll need to do.

There is also a shared file `config/trimester-config.json` that holds the start date for each trimester. This is rarely changed.

---

## How a change reaches Moodle

1. You edit a config file and save it.
2. The change is pushed to GitHub (this is done by whoever manages the repository — currently Steve Grant).
3. GitHub automatically publishes the updated file to a public web address within a minute or two.
4. The next time a Moodle page loads, it fetches the config from that address and renders the current content.

**Nothing in Moodle itself needs to be edited.** The Moodle pages contain a small invisible script that does the fetching automatically.

---

## How to add a link

Each teaching week has a `links` section that looks like this:

```
"lecture": null,
"slides": null,
"recording": null,
"forum": null,
"materials": null,
"liveHub": null
```

Each field corresponds to a button or card on the Moodle page. To add a link, replace `null` with the URL inside double quotes:

```
"lecture": "https://echo360.net.au/your-lecture-url-here",
```

**Important:** the URL must be inside double quotes, and the comma at the end must stay. If you add a link to the last field in the section, there is no comma — leave it as-is.

---

## What `null` means

`null` means "not available yet". Any field set to `null` will display a grey **Coming soon** chip on the Moodle page instead of a broken link or an empty space. Students see a polished placeholder, not an error.

When content becomes available, replace `null` with the URL. The chip disappears automatically.

---

## The `resources` array (EDSE362 only)

Some weeks have an optional `resources` section for bonus materials — extra readings, Excel lists, supplementary recordings. It looks like this:

```
"resources": [
  { "label": "Bonus reading: Smith 2023", "url": "https://..." },
  { "label": "Resource list (Excel)", "url": null }
]
```

To add a resource, copy one of the lines above, paste it inside the square brackets, fill in the label and URL. To remove one, delete the whole line (including the comma after it if it's not the last item).

If there are no extras for a given week, leave the array empty: `"resources": []`.

---

## Assessment dates and reminders

Each week object can include an `assessments` array that lists tasks and their due dates:

```
"assessments": [
  { "name": "Assessment Task 1", "due": "2027-08-10" }
]
```

The system reads these dates and automatically shows a reminder on the announcement page when a task is due within two weeks. Dates are in the format **YYYY-MM-DD**.

---

## Who to contact if something breaks

| Issue | Contact |
|---|---|
| A Moodle page is showing an error or blank content | Steve Grant |
| A link needs to be added or updated | Steve Grant (or edit the config file directly if you have access) |
| The start date for a trimester is wrong | Steve Grant |
| Something appears on the wrong week | Steve Grant |

If a page shows **"Could not load content"**, it usually means either the config file has a formatting error (a missing quote or comma) or the GitHub publish hasn't completed yet — wait two minutes and reload. If it persists, contact Steve.

---

## Quick reference: what each field does

| Field | What it controls | Notes |
|---|---|---|
| `lecture` | Echo360 embed on the Lecture page | Paste the Echo360 share URL |
| `slides` | PDF slides link on the Lecture page | Paste the direct PDF URL |
| `recording` | Post-session recording link | Paste the Echo360 or Zoom cloud URL |
| `forum` | Forum link on announcement and live hub | Paste the Moodle forum URL |
| `materials` | Topic reading/materials link | Links the first Workflow card step |
| `liveHub` | Link to the Live Session Hub page | Links the Workflow "prepare" step |
| `announcementBody` | Text in the weekly announcement post | `intro` and `focus` are separate paragraphs |
| `liveSessionFocus` | Focus sentence at the top of the Live Hub | 1–2 sentences |
| `liveSessionTasks` | Preparation checklist on the Live Hub | List of 3 items |
| `resources` | Extras on the Topic page (EDSE362) | Array of label + URL pairs |
