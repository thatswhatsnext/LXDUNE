import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 't2-checklist-state.json');

const SECTIONS = [
  {
    key: 'A',
    name: 'Section A — LXDUNE config',
    items: [
      { id: '1',  label: '[LXDUNE] Set up T2 2026 Zoom meeting — add meetingId, password, url to config/units/EDSE362.json → trimesterConfig.T2-2026' },
      { id: '2',  label: '[LXDUNE] Populate keyLinks URLs — Unit Outline, Learning Materials, Assessment Portal in EDSE362.json' },
      { id: '3',  label: '[LXDUNE] Add lecturer name/email to contacts.lecturer once confirmed' },
      { id: '4',  label: '[LXDUNE] Record week 1–8 lecture videos — add YouTube IDs to config/units/EDSE362.json' },
      { id: '5',  label: '[LXDUNE] Populate all week links as content is created (lecture, slides, recording, forum, materials, liveHub)' },
      { id: '6',  label: '[LXDUNE] Write AT1 full content — title, rationale, aim, parts, criteria, rubric descriptors' },
      { id: '7',  label: '[LXDUNE] Write AT2 full content — title, rationale, aim, parts, criteria, rubric descriptors' },
      { id: '8',  label: '[LXDUNE] Add assessment file links once tasks are uploaded to Moodle (discipline task + marking URLs)' },
      { id: '9',  label: '[LXDUNE] Confirm T2 2026 due dates with Steve — populate trimesterDates.T2-2026 for AT1 and AT2' },
      { id: '10', label: '[LXDUNE] Apply alignment fields to weeks 1–8 — orientationNote, forumPrompts, workedExample, synthesisTemplate, guidanceNotes' },
      { id: '11', label: '[LXDUNE] Generate T2 2026 Moodle shells from generate/index.html (forTri: T2, forYear: 2026)' },
      { id: '12', label: '[LXDUNE] Verify all blocks render correctly in test harness before go-live' },
      { id: '13', label: '[LXDUNE] Paste all shells into live EDSE362 Moodle course' },
    ],
  },
  {
    key: 'B',
    name: 'Section B — Moodle site (Learning Design team actions)',
    items: [
      { id: '14', label: '[MOODLE] Check Assessment tile — confirm all activities are in the right location, delete any no longer relevant' },
      { id: '15', label: '[MOODLE] Fill in Permitted Resources template for each Assurance Task' },
      { id: '16', label: '[MOODLE] Confirm assessment activity names match Handbook titles' },
      { id: '17', label: '[MOODLE] Check information callout inside each assessment activity (weighting, notes, learning outcomes)' },
      { id: '18', label: '[MOODLE] If Maximum grade changes, update Grade to Pass to match correct proportion' },
    ],
  },
  {
    key: 'C',
    name: 'Section C — Moodle site (myLearn setup checklist)',
    items: [
      { id: '19', label: '[MOODLE] Welcome video — record new or confirm existing video is current for T2 2026' },
      { id: '20', label: '[MOODLE] Contact preferences — confirm Unit Coordinator details in Unit Information and Resources tile' },
      { id: '21', label: '[MOODLE] Study schedule — update with T2 2026 dates and assessment due dates' },
      { id: '22', label: '[MOODLE] EchoVideo — confirm T2 2026 profile exists; roll over or record new lecture recordings' },
      { id: '23', label: '[MOODLE] Reading List — create or roll over and publish before 15 June 2026' },
      { id: '24', label: '[MOODLE] Zoom meetings — create new Zoom meeting as a Moodle activity in the course' },
      { id: '25', label: '[MOODLE] Assessment due dates — update all assignment and quiz due dates in Moodle' },
      { id: '26', label: '[MOODLE] Extension tool dates — update Group Override due dates for 3-day/7-day/Flexible Portal tools' },
      { id: '27', label: '[MOODLE] Assessment settings — check each task for correct details, format, instructions, word length' },
      { id: '28', label: '[MOODLE] Rubrics and marking criteria — update early; changes are visible to students immediately' },
      { id: '29', label: '[MOODLE] Enrol additional teaching staff — tutors, markers, admin support' },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap(s => s.items);
const TOTAL = ALL_ITEMS.length;

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      // Merge with defaults in case items were added
      const items = Object.fromEntries(ALL_ITEMS.map(i => [i.id, false]));
      Object.assign(items, saved.items);
      return { ...saved, items };
    } catch {
      // Fall through to fresh state
    }
  }
  return {
    lastUpdated: new Date().toISOString(),
    items: Object.fromEntries(ALL_ITEMS.map(i => [i.id, false])),
  };
}

function saveState(state) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

function sectionProgress(section, state) {
  const done = section.items.filter(i => state.items[i.id]).length;
  return { done, total: section.items.length };
}

function overallProgress(state) {
  const done = ALL_ITEMS.filter(i => state.items[i.id]).length;
  return { done, total: TOTAL };
}

async function runSection(section, state) {
  const { selections } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selections',
    message: `${section.name} — space to toggle, enter to confirm`,
    choices: section.items.map(item => ({
      name: item.label,
      value: item.id,
      checked: Boolean(state.items[item.id]),
    })),
    pageSize: 20,
  }]);

  section.items.forEach(item => {
    state.items[item.id] = selections.includes(item.id);
  });
  saveState(state);

  if (section.key) {
    // Single real section — check its completion
    const { done, total } = sectionProgress(section, state);
    if (done === total) console.log('\n✅ Section complete!');
  } else {
    // "All tasks" — celebrate any newly-completed sections
    SECTIONS.forEach(s => {
      const { done, total } = sectionProgress(s, state);
      if (done === total) console.log(`\n✅ ${s.name} — complete!`);
    });
  }

  const { done } = overallProgress(state);
  if (done === TOTAL) {
    console.log('\n🎉 EDSE362 T2 2026 — all checks done. Good luck with the trimester.');
  }
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log('t2-checklist.js loaded OK (non-interactive — run in a terminal to use)');
    process.exit(0);
  }

  let state = loadState();

  while (true) {
    const { done, total } = overallProgress(state);
    console.log(`\nOverall: ${done} of ${total} complete`);

    const choices = SECTIONS.map(s => {
      const { done: sd, total: st } = sectionProgress(s, state);
      return { name: `${s.name} (${sd}/${st} complete)`, value: s.key };
    });
    choices.push(new inquirer.Separator());
    choices.push({ name: 'All tasks', value: '__all__' });
    choices.push({ name: 'Quit', value: '__quit__' });

    const { choice } = await inquirer.prompt([{
      type: 'list',
      name: 'choice',
      message: 'Select a section:',
      choices,
      pageSize: 10,
    }]);

    if (choice === '__quit__') {
      console.log('Bye.');
      break;
    }

    const section = choice === '__all__'
      ? { name: 'All tasks', items: ALL_ITEMS }
      : SECTIONS.find(s => s.key === choice);

    await runSection(section, state);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
