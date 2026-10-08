// moodle-blocks/metacognition-coach.js
// "Metacognition Coach" practice game for LXDUNE. Ports the standalone prototype
// (docs/handoffs/Metacognition_Coach.html) into the live repo pattern: content
// lives in validated JSON under games/metacognition-coach/, and this module
// fetches it and renders it into a Moodle page, like framework-explorer.js.
//
//   <div id="lxd-coach"></div>
//   <script type="module">
//     import { renderCoach }
//       from "https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/metacognition-coach.js";
//     renderCoach({ mount: "lxd-coach" });
//   </script>
//
// Options: mount (default "lxd-coach"), explorerUrl (default "": the "Go deeper"
// box names the explorer without a link), allowReviewer (default false: true
// shows a toggle that unlocks every habit, for staff pages only).
//
// One source of truth: habit names and phases come from the metacognition
// framework (content.json's habitsFrom), and scenario contexts are vocabulary
// ids rendered with the vocabulary's labels. Only the game's one-line habit
// descriptions live in content.json.
//
// Moodle-deployment constraints (spec §8):
//   • All markup + CSS scoped under .lxd-mcg; custom properties live on .lxd-mcg,
//     not :root, each used with an inline fallback. No bare body/h1 selectors.
//   • No external requests beyond this repo's JSON; inherits the theme's body font.
//   • Ids are prefixed per mount, so two games on one page never share ids.
//   • Scrolling targets whichever element scrolls (Boost scrolls #page), and the
//     top bar pins below Boost's fixed navbar.
//   • Progress is kept in localStorage under "lxd-mcg-v1" — a deliberate
//     exception to the explorers' no-storage rule (spec §7). Every access is in
//     try/catch; without storage the game still plays.
//
// The pure helpers (vocabLabels, contextLabel, buildGame) are exported so the validator's
// parity check runs the same expansion as the page.

const BASE = new URL('..', import.meta.url).href;
const CONTENT_PATH = 'games/metacognition-coach/content.json';

// Layout version, stamped as data-mcg-renderer. Separate from the content
// version (data-mcg-version), which feeds the content hash.
export const RENDERER = 'coach@1.0.0';

const KEY = 'lxd-mcg-v1';
const INTERVALS = [1, 3, 7, 14, 30];
const REVIEW_SIZE = 6;

// Phase names and colours. Colours match the Framework Explorer's matrix
// (--mx-plan, --mx-monitor, --mx-evaluate). `text` is the colour used for
// phase-coloured small text: monitoring's gold is darkened there, because
// #8A6D1F on the sunk background is 4.46:1, just under AA.
export const PHASES = {
  planning: { name: 'Planning', colour: '#3C6E8F', text: '#3C6E8F' },
  monitoring: { name: 'Monitoring', colour: '#8A6D1F', text: '#77601B' },
  evaluating: { name: 'Evaluating', colour: '#7A4477', text: '#7A4477' },
};

// ── utilities ───────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Content strings are AUTHORED, validator-checked "constrained HTML" (<b>, <i>)
// and are inserted as trusted markup by design. Anything the player types, and
// habit names from the framework, go through esc(). Keep this distinction.
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function setError(mount, msg) {
  mount.innerHTML =
    `<div style="padding:12px 16px;border:1px solid #e8b4b8;border-left:4px solid #c0392b;` +
    `border-radius:8px;color:#c0392b;font-family:Arial,sans-serif;font-size:.9em;">` +
    `Metacognition Coach: ${esc(msg)}</div>`;
}

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

// djb2, hashing to 8 hex chars, as in framework-explorer.js.
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── content (pure; shared with scripts/validate-coach.js) ──────────────────────
// Vocabulary id → label, across stages, syllabuses, focus areas and modules.
export function vocabLabels(vocab) {
  const labels = new Map();
  for (const [id, s] of Object.entries(vocab.stages || {})) labels.set(id, s.label || id);
  for (const [id, s] of Object.entries(vocab.syllabuses || {})) labels.set(id, s.label || id);
  for (const byStage of Object.values(vocab.focusAreas || {}))
    for (const list of Object.values(byStage)) for (const fa of list) labels.set(fa.id, fa.label);
  for (const list of Object.values(vocab.modules || {})) for (const m of list) labels.set(m.id, m.label);
  return labels;
}

// A scenario context rendered from the vocabulary: the syllabus label when there
// is one (it already names the stage), otherwise the stages joined by an arrow;
// then the focus area or module; then the note. Parts are joined with " · ".
export function contextLabel(ctx, labels) {
  const lab = (id) => labels.get(id) || id;
  const parts = [ctx.syllabus ? lab(ctx.syllabus) : ctx.stages.map(lab).join(' → ')];
  if (ctx.focusArea) parts.push(lab(ctx.focusArea));
  if (ctx.module) parts.push(lab(ctx.module));
  if (ctx.note) parts.push(ctx.note);
  return parts.join(' · ');
}

// Expand content.json into playable units. Names and phases come from the
// framework's habits; definition items are built from description references.
export function buildGame(content, habits, vocab) {
  const labels = vocabLabels(vocab);
  const H = {};
  for (const h of habits)
    H[h.id] = { id: h.id, name: h.name, phase: h.category, desc: content.gameDescriptions[h.id] };
  const units = content.units.map((u) => ({
    id: u.id,
    short: u.short,
    intro: u.intro,
    steps: u.steps.map((s) => (s.kind === 'def' ? defStep(u.id, s, H) : withLabel(s, labels))),
  }));
  return { H, units };
}

function defStep(id, s, H) {
  const opts = [{ t: H[id].desc, correct: true }].concat(
    s.distractors.map((d) => ({ t: H[d.habit].desc, fb: `That’s <b>${esc(H[d.habit].name)}</b>. ${d.contrast}` })),
  );
  return {
    type: 'choice',
    kind: 'def',
    scorable: true,
    eyebrow: 'Definition',
    q: `Which description is “${esc(H[id].name.toLowerCase())}”?`,
    sub: 'Four metacognitive teaching habits — pick the one that matches.',
    opts,
    good: s.good,
    coach: s.coach,
  };
}

function withLabel(s, labels) {
  if (!s.scene) return s;
  return { ...s, scene: { ...s.scene, ctx: contextLabel(s.scene.ctx, labels) } };
}
