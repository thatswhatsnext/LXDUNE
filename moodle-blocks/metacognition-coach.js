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

// ── public entry ──────────────────────────────────────────────────────────────
export async function renderCoach({ mount = 'lxd-coach', explorerUrl = '', allowReviewer = false } = {}) {
  const el = typeof mount === 'string' ? document.getElementById(mount) : mount;
  if (!el) {
    console.warn(`[metacognition-coach] no mount element "${mount}"`);
    return;
  }
  try {
    const content = await fetchJson(BASE + CONTENT_PATH);
    const fwDir = `${BASE}frameworks/${content.habitsFrom}/`;
    const fw = await fetchJson(`${fwDir}framework.json`);
    const [habits, vocab] = await Promise.all([
      fetchJson(new URL(fw.matrix.habits, fwDir).href),
      fetchJson(new URL(fw.vocabulary, fwDir).href),
    ]);
    const game = buildGame(content, habits, vocab);
    const url = /^https?:\/\//i.test(explorerUrl) ? explorerUrl : '';
    injectStyles('lxd-mcg-styles', STYLES);
    mountGame(el, game, { explorerUrl: url, allowReviewer: allowReviewer === true });
    stampVersion(el, content, habits);
  } catch (e) {
    setError(el, e.message);
    console.error('[metacognition-coach]', e);
  }
}

// Stamp the mount with the content version, a content hash and the renderer, so
// a deployed page is traceable to an exact data revision. The habits are part
// of the hash because names and phases are read from the framework.
function stampVersion(el, content, habits) {
  const hash = djb2(JSON.stringify([content, habits]) + '|' + content.version);
  el.dataset.mcgVersion = content.version;
  el.dataset.mcgContentHash = hash;
  el.dataset.mcgRenderer = RENDERER;
  el.insertAdjacentHTML('afterbegin', `<!-- Metacognition Coach · v${content.version} · ${hash} · ${RENDERER} -->`);
}

// ── scrolling (as the deep-dive view) ───────────────────────────────────────────
const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The element that actually scrolls `el` vertically: Moodle's Boost theme may
// scroll #page rather than the document. Moodle's .no-overflow wrapper has
// overflow:auto but never scrolls vertically, so it is skipped.
function scrollerOf(el) {
  for (let e = el.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
    const oy = window.getComputedStyle(e).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight + 1) return e;
  }
  return window;
}

// Bottom edge of any fixed or sticky header across the top of the viewport
// (Boost's navbar), ignoring the game's own elements; 0 on a plain page.
function headerBottom(own) {
  if (typeof document.elementsFromPoint !== 'function') return 0;
  let bottom = 0;
  for (const el of document.elementsFromPoint(Math.round(window.innerWidth / 2), 1)) {
    if (own.contains(el)) continue;
    for (let e = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
      const pos = window.getComputedStyle(e).position;
      if (pos === 'fixed' || pos === 'sticky') {
        const r = e.getBoundingClientRect();
        if (r.top <= 1 && r.bottom > bottom && r.height < window.innerHeight / 3) bottom = r.bottom;
        break;
      }
    }
  }
  return Math.round(bottom);
}

// ── storage ────────────────────────────────────────────────────────────────────
function blank() {
  return { v: 1, xp: 0, done: {}, streak: { n: 0, last: null }, notes: {} };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Read progress, keeping only entries for habits the content still has.
function loadStore(ids) {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return blank();
    const s = JSON.parse(raw);
    const out = blank();
    out.xp = Math.max(0, Number(s.xp) || 0);
    if (s.streak && typeof s.streak === 'object')
      out.streak = { n: Math.max(0, Number(s.streak.n) || 0), last: DATE.test(s.streak.last) ? s.streak.last : null };
    for (const id of ids) {
      const d = s.done && s.done[id];
      if (d && typeof d === 'object' && DATE.test(d.due)) out.done[id] = d;
      const n = s.notes && s.notes[id];
      if (n && typeof n === 'object') out.notes[id] = { apply: String(n.apply || ''), commit: String(n.commit || ''), at: n.at || null };
    }
    return out;
  } catch (e) {
    return blank();
  }
}

function saveStore(store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch (e) {
    /* storage unavailable: the game still plays, progress just isn't kept */
  }
}

// ── dates (local calendar dates, YYYY-MM-DD) ───────────────────────────────────
const pad = (n) => (n < 10 ? '0' : '') + n;
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parse(s) {
  const p = s.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}
const today = () => iso(new Date());
function addDays(s, n) {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
function whenText(due) {
  const d = dayDiff(today(), due);
  if (d <= 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}

const STAR =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>';
const CROWN =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#7A6B1F" stroke-width="2" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/></svg>';

// ── the game ───────────────────────────────────────────────────────────────────
let mounts = 0;

function mountGame(el, { H, units: U }, { explorerUrl, allowReviewer }) {
  const uid = `lxd-mcg${++mounts}`;
  el.className = 'lxd-mcg';
  el.innerHTML =
    `<div class="lxd-mcg-wrap" id="${uid}-root"></div>` +
    `<div class="lxd-mcg-sr" aria-live="polite" id="${uid}-live"></div>`;
  const root = el.querySelector(`#${uid}-root`);
  const live = el.querySelector(`#${uid}-live`);
  const byId = (k) => el.querySelector(`#${uid}-${k}`);

  let store = loadStore(U.map((u) => u.id));
  let reviewer = false; // staff-only, never stored
  let run = null;
  let resetArmed = false;

  const save = () => saveStore(store);
  const idx = (id) => U.findIndex((u) => u.id === id);
  const isDone = (id) => !!store.done[id];
  const unlocked = (i) => reviewer || i === 0 || isDone(U[i].id) || isDone(U[i - 1].id);
  const doneUnits = () => U.filter((u) => isDone(u.id));
  const dueUnits = () => doneUnits().filter((u) => store.done[u.id].due <= today());
  const phaseName = (id) => (PHASES[H[id].phase] || { name: '' }).name;

  function bumpStreak() {
    const t = today();
    const l = store.streak.last;
    if (l === t) return;
    store.streak.n = l && dayDiff(l, t) === 1 ? store.streak.n + 1 : 1;
    store.streak.last = t;
  }
  function streakNow() {
    const l = store.streak.last;
    if (!l) return 0;
    return dayDiff(l, today()) <= 1 ? store.streak.n : 0;
  }

  function announce(t) {
    live.textContent = '';
    setTimeout(() => (live.textContent = t), 40);
  }
  function setPhase(phase) {
    for (const c of [...el.classList]) if (c.startsWith('lxd-mcg-ph-')) el.classList.remove(c);
    if (phase) el.classList.add(`lxd-mcg-ph-${phase}`);
  }

  // On a screen change, bring the game's top into view (below any fixed navbar)
  // if it has scrolled above it, then focus the new screen's heading.
  function arrive(focus) {
    pin();
    if (!focus) return;
    const top = headerBottom(el);
    const r = el.getBoundingClientRect();
    if (r.top < top) {
      scrollerOf(el).scrollBy({ top: r.top - top - 8, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
    const h = root.querySelector('[data-focus]');
    if (h) h.focus({ preventScroll: true });
  }

  // ── run state ──
  function prep(step) {
    const s = JSON.parse(JSON.stringify(step));
    if (s.opts && !s.fixedOrder) s.opts = shuffle(s.opts);
    return s;
  }
  function newRun(kind, steps, unit) {
    return {
      kind, unit: unit || null, steps, i: 0, xp: 0, correct: 0,
      scorable: steps.filter((s) => s.scorable).length,
      conf: 0, counted: {}, answered: false, attempts: 0,
      apply: '', commit: '', checks: [false, false, false], units: [],
    };
  }

  function startUnit(id) {
    const u = U[idx(id)];
    const steps = [{ type: 'intro' }].concat(u.steps.map(prep), [{ type: 'complete' }]);
    run = newRun('unit', steps, u);
    const n = store.notes[id];
    if (n) {
      run.apply = n.apply || '';
      run.commit = n.commit || '';
    }
    setPhase(H[id].phase);
    render();
  }

  // "Which habit?" item built from a scenario's best move.
  function whichHabit(u, s) {
    const best = s.opts.find((o) => o.correct);
    const others = shuffle(U.map((x) => x.id).filter((x) => x !== u.id)).slice(0, 3);
    const name = (id) => esc(H[id].name);
    const opts = [{ t: name(u.id), correct: true }].concat(
      others.map((o) => ({
        t: name(o),
        fb: `That’s not it. <b>${name(o)}</b> means: ${H[o].desc} Look again at what this teacher is doing.`,
      })),
    );
    return {
      type: 'choice', scorable: true, eyebrow: 'Which habit?', q: 'Which habit is this teacher using?',
      scene: { ctx: s.scene.ctx, t: best.t }, opts: shuffle(opts), unitId: u.id,
      good: `Yes — <b>${name(u.id)}</b>. ${H[u.id].desc}`,
      coach: 'Telling the habits apart in a real moment is what lets you choose one on purpose.',
    };
  }

  function startReview() {
    let pool = doneUnits();
    if (pool.length < 2 && reviewer) pool = U.slice();
    const due = dueUnits().map((u) => u.id);
    pool = shuffle(pool).sort((a, b) => (due.includes(b.id) ? 1 : 0) - (due.includes(a.id) ? 1 : 0));
    const lists = pool.map((u) => {
      const c = u.steps
        .filter((s) => s.kind === 'def' || s.kind === 'spot' || s.kind === 'recall')
        .map((s) => ({ ...prep(s), unitId: u.id }));
      u.steps.filter((s) => s.kind === 'scenario').forEach((s) => c.push(whichHabit(u, s)));
      return shuffle(c);
    });
    let items = [];
    for (let k = 0, guard = 0; items.length < REVIEW_SIZE && guard < 200; k++, guard++) {
      const l = lists[k % lists.length];
      if (l.length) items.push(l.shift());
    }
    items = shuffle(items);
    run = newRun('review', [{ type: 'reviewintro' }].concat(items, [{ type: 'reviewcomplete' }]));
    run.units = [...new Set(items.map((s) => s.unitId))];
    setPhase(null);
    render();
  }

  // ── path (home) ──
  function showPath(msg, focus = true) {
    run = null;
    setPhase(null);
    const d = doneUnits().length;
    const due = dueUnits();
    let h =
      `<div class="lxd-mcg-head"><h2 class="lxd-mcg-title" tabindex="-1" data-focus>Metacognition Coach</h2>` +
      `<p>Build the teaching habits that develop your students’ thinking — one move at a time.</p></div>` +
      `<div class="lxd-mcg-statrow">` +
      `<div class="s"><div class="v">${store.xp}</div><div class="l">XP</div></div>` +
      `<div class="s"><div class="v">${streakNow()}</div><div class="l">Day streak</div></div>` +
      `<div class="s"><div class="v">${d}/${U.length}</div><div class="l">Habits mastered</div></div>` +
      `</div>`;
    if (d >= 2 || reviewer) {
      const rm = due.length
        ? `${due.length} habit${due.length > 1 ? 's' : ''} due for review — mixed, so you practise telling them apart.`
        : 'Nothing due — practise anyway. Mixing habits helps you tell them apart.';
      h += `<div class="lxd-mcg-review"><div class="rt"><div class="rn">Mixed review</div><div class="rm">${rm}</div></div><button type="button" class="go" data-act="review">Start review</button></div>`;
    } else {
      h += `<div class="lxd-mcg-review off"><div class="rt"><div class="rn">Mixed review</div><div class="rm">Finish two habits to unlock reviews that mix them together.</div></div></div>`;
    }
    h += `<div class="lxd-mcg-path" role="list">`;
    U.forEach((u, i) => {
      const hb = H[u.id];
      const done = isDone(u.id);
      const open = unlocked(i);
      const cls = done ? 'done' : open ? 'current' : 'locked';
      let meta = u.short;
      if (done) {
        const dd = store.done[u.id].due;
        meta = dd <= today() ? '<span class="nmeta due">Review due today</span>' : `Next review ${whenText(dd)}`;
      }
      const disc = done ? '✓' : open ? '▶' : i + 1;
      const name = esc(hb.name);
      const act = done
        ? `<button type="button" class="act replay" data-act="unit" data-id="${u.id}" aria-label="Replay ${name}">Replay</button>`
        : open
          ? `<button type="button" class="act start" data-act="unit" data-id="${u.id}" aria-label="Start ${name}">Start</button>`
          : '<span class="lock">Locked</span>';
      h +=
        `<div class="lxd-mcg-node ${cls} lxd-mcg-pc-${esc(hb.phase)}" role="listitem">` +
        `<div class="disc" aria-hidden="true">${disc}</div>` +
        `<div class="ntext"><div class="chip">${i + 1} · ${phaseName(u.id)}</div><div class="nnm">${name}</div><div class="nmeta">${meta}</div></div>${act}</div>`;
    });
    h += '</div>';
    const ids = Object.keys(store.notes).filter((id) => store.notes[id].commit);
    if (ids.length) {
      h +=
        '<div class="lxd-mcg-log"><h3>Your classroom commitments</h3>' +
        '<p class="lsub">What you said you’d try. Each one is where the practice actually happens.</p><ul>';
      ids
        .sort((a, b) => idx(a) - idx(b))
        .forEach((id) => (h += `<li><b>${esc(H[id].name)}:</b> ${esc(store.notes[id].commit)}</li>`));
      h += '</ul></div>';
    }
    h +=
      '<div class="lxd-mcg-tools">' +
      (allowReviewer
        ? `<button type="button" class="lxd-mcg-tool" data-act="reviewer" aria-pressed="${reviewer}">Reviewer mode: ${reviewer ? 'on' : 'off'}</button>`
        : '') +
      '<button type="button" class="lxd-mcg-tool danger" data-act="reset">Reset progress</button></div>' +
      `<div class="lxd-mcg-toast" role="status">${msg || ''}</div>` +
      '<p class="lxd-mcg-foot">Progress is saved in this browser only.<br>Part of LXDUNE · the Metacognition in Science Explorer is the reference layer.</p>';
    root.innerHTML = h;
    arrive(focus);
  }

  // ── run rendering ──
  function topbar() {
    const pct = Math.round((run.i / (run.steps.length - 1)) * 100);
    return (
      `<div class="lxd-mcg-barslot"><div class="lxd-mcg-topbar">` +
      `<button type="button" class="lxd-mcg-x" data-act="exit" aria-label="Leave and return to the path">✕</button>` +
      `<div class="lxd-mcg-prog" role="progressbar" aria-label="Progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>` +
      `<span class="lxd-mcg-xp" id="${uid}-xp">${STAR}${run.xp} XP</span></div></div>`
    );
  }
  const SCREENS = {
    intro: rIntro, reviewintro: rReviewIntro, choice: rChoice, tf: rTF, apply: rApply,
    commit: rCommit, complete: rComplete, reviewcomplete: rReviewComplete,
  };
  function render() {
    run.attempts = 0;
    run.answered = false;
    const s = run.steps[run.i];
    const bare = ['intro', 'reviewintro', 'complete', 'reviewcomplete'].includes(s.type);
    root.innerHTML = (bare ? '' : topbar()) + `<div id="${uid}-screen"></div>`;
    SCREENS[s.type](byId('screen'), s);
    arrive(true);
  }
  function next() {
    if (run.kind === 'review' && run.steps[run.i + 1] && run.steps[run.i + 1].type === 'reviewcomplete') finishReview();
    run.i++;
    render();
  }
  const eyebrow = (t) => `<div class="lxd-mcg-eyebrow"><span class="dot"></span>${t}</div>`;
  const scene = (s) =>
    s.scene ? `<div class="lxd-mcg-scene"><div class="ctx">${esc(s.scene.ctx)}</div>${s.scene.t}</div>` : '';

  function rIntro(scr) {
    const u = run.unit;
    const i = idx(u.id);
    const labels = ['Not yet', 'A little', 'Somewhat', 'Fairly', 'Very'];
    let h =
      `<div class="lxd-mcg-card">${eyebrow(`${phaseName(u.id)} · Habit ${i + 1} of ${U.length}`)}` +
      `<h2 class="lxd-mcg-q big" tabindex="-1" data-focus>${esc(H[u.id].name)}</h2>` +
      `<p class="lxd-mcg-sub lead">${u.intro}</p>` +
      `<div class="lxd-mcg-note" id="${uid}-calq"><b>Before you start.</b> How confident are you that you could use this habit, on purpose, in a lesson tomorrow?</div>` +
      `<div class="lxd-mcg-scale" role="group" aria-labelledby="${uid}-calq">`;
    for (let n = 1; n <= 5; n++)
      h += `<button type="button" class="lxd-mcg-lv" data-lv="${n}" aria-pressed="false"><span class="lvn">${n}</span><span class="lvl">${labels[n - 1]}</span></button>`;
    h +=
      '</div><div class="lxd-mcg-scalelabels" aria-hidden="true"><span>Not confident</span><span>Very confident</span></div>' +
      '<div class="lxd-mcg-btnrow"><button type="button" class="lxd-mcg-btn ghost" data-act="exit">Back</button><button type="button" class="lxd-mcg-btn primary" data-act="begin" disabled>Choose a number to begin</button></div></div>';
    scr.innerHTML = h;
  }
  function rReviewIntro(scr) {
    const n = run.scorable;
    const names = run.units.map((id) => esc(H[id].name));
    let h =
      `<div class="lxd-mcg-card">${eyebrow(`Mixed review · ${n} questions`)}` +
      `<h2 class="lxd-mcg-q big" tabindex="-1" data-focus>Mixed review</h2>` +
      '<p class="lxd-mcg-sub lead">Questions from different habits, shuffled together. Mixing them makes you decide which habit each question is about — which is what you have to do in a real lesson.</p>' +
      `<p class="lxd-mcg-sub">Drawing on: <b>${names.join(', ')}</b>.</p>` +
      `<div class="lxd-mcg-note" id="${uid}-calq"><b>Predict first.</b> How many of the ${n} do you think you’ll get right first time?</div>` +
      `<div class="lxd-mcg-scale" role="group" aria-labelledby="${uid}-calq">`;
    for (let k = 0; k <= n; k++)
      h += `<button type="button" class="lxd-mcg-lv tight" data-lv="${k}" aria-pressed="false"><span class="lvn">${k}</span></button>`;
    h +=
      '</div><div class="lxd-mcg-btnrow"><button type="button" class="lxd-mcg-btn ghost" data-act="exit">Back</button><button type="button" class="lxd-mcg-btn primary" data-act="begin" disabled>Choose a number to begin</button></div></div>';
    scr.innerHTML = h;
  }
  function rChoice(scr, s) {
    let h =
      `<div class="lxd-mcg-card">${eyebrow(s.eyebrow)}<h2 class="lxd-mcg-q" tabindex="-1" data-focus>${s.q}</h2>` +
      (s.sub ? `<p class="lxd-mcg-sub">${s.sub}</p>` : '') +
      scene(s) +
      '<div class="lxd-mcg-opts">';
    s.opts.forEach((o, j) => {
      h += `<button type="button" class="lxd-mcg-opt" data-opt="${j}"><span class="key" aria-hidden="true">${String.fromCharCode(65 + j)}</span><span class="optbody">${o.t}</span></button>`;
    });
    h += `</div><div class="lxd-mcg-fb" id="${uid}-fb" role="status"></div><div class="lxd-mcg-btnrow" id="${uid}-btnrow"></div></div>`;
    scr.innerHTML = h;
  }
  function rTF(scr, s) {
    scr.innerHTML =
      `<div class="lxd-mcg-card">${eyebrow(s.eyebrow)}<h2 class="lxd-mcg-q" tabindex="-1" data-focus>${s.q}</h2>${scene(s)}` +
      '<div class="lxd-mcg-tf"><button type="button" class="lxd-mcg-opt" data-tf="true"><span class="optbody">Yes, it is</span></button><button type="button" class="lxd-mcg-opt" data-tf="false"><span class="optbody">No, it isn’t</span></button></div>' +
      `<div class="lxd-mcg-fb" id="${uid}-fb" role="status"></div><div class="lxd-mcg-btnrow" id="${uid}-btnrow"></div></div>`;
  }
  function rApply(scr, s) {
    let h =
      `<div class="lxd-mcg-card">${eyebrow(s.eyebrow)}<h2 class="lxd-mcg-q" tabindex="-1" data-focus>${s.q}</h2><p class="lxd-mcg-sub">${s.sub}</p>` +
      `<label class="lxd-mcg-sr" for="${uid}-apta">Your draft</label><textarea class="lxd-mcg-ta" id="${uid}-apta" placeholder="${esc(s.placeholder)}">${esc(run.apply)}</textarea>` +
      '<p class="lxd-mcg-hint">Nothing here is marked — it’s yours to keep. It’s saved with your progress.</p>' +
      '<div class="lxd-mcg-checklabel">Check your own draft</div>';
    s.criteria.forEach((c, j) => {
      const on = run.checks[j];
      h += `<button type="button" class="lxd-mcg-check" data-check="${j}" role="checkbox" aria-checked="${on}"><span class="box" aria-hidden="true">${on ? '✓' : ''}</span><span class="txt">${c}</span></button>`;
    });
    h +=
      '<div class="lxd-mcg-note">Checking your own draft against criteria is itself a metacognitive habit — <b>Evaluate progress</b>.</div>' +
      '<div class="lxd-mcg-btnrow"><button type="button" class="lxd-mcg-btn primary" data-act="applynext">Continue</button></div></div>';
    scr.innerHTML = h;
  }
  function rCommit(scr, s) {
    scr.innerHTML =
      `<div class="lxd-mcg-card">${eyebrow(s.eyebrow)}<h2 class="lxd-mcg-q" tabindex="-1" data-focus>${s.q}</h2><p class="lxd-mcg-sub">${s.sub}</p>` +
      `<label class="lxd-mcg-sr" for="${uid}-cmta">Your commitment</label><textarea class="lxd-mcg-ta" id="${uid}-cmta" placeholder="${esc(s.placeholder)}">${esc(run.commit)}</textarea>` +
      `<div class="lxd-mcg-note"><b>For afterwards.</b> ${s.reflect}</div>` +
      '<div class="lxd-mcg-btnrow"><button type="button" class="lxd-mcg-btn primary" data-act="commitnext">Finish</button></div></div>';
  }

  // Each bar's width is its displayed value as a share of the scale.
  function calibration(predVal, predPct, perfVal, perfPct, reflect) {
    const bar = (cls, label, val, pct) =>
      `<div class="lxd-mcg-cb ${cls}"><span class="cbl">${label}</span><span class="cbtrack"><span class="cbfill" style="width:${pct}%"></span></span><span class="cbv">${val}</span></div>`;
    return (
      '<div class="lxd-mcg-panel"><h3>Confidence, checked against performance</h3>' +
      bar('pre', 'You predicted', predVal, predPct) +
      bar('perf', 'You performed', perfVal, perfPct) +
      `<div class="lxd-mcg-reflect">${reflect}</div></div>`
    );
  }
  function gapReflect(pred, perf, predN, perfN) {
    if (perfN > predN)
      return `You came in at ${pred} and performed at ${perf}. Your skill is ahead of your confidence — notice that. You can do more than you think.`;
    if (perfN < predN)
      return `You came in at ${pred} and performed at ${perf}. A little humbling — and noticing that gap is itself a metacognitive move. That awareness is the point.`;
    return `You came in at ${pred} and performed at ${perf} — well calibrated. Your sense of your own skill matched reality, which is exactly what you’re building in your students.`;
  }
  const stats = (n) =>
    `<div class="lxd-mcg-stats"><div class="lxd-mcg-stat"><div class="sv">${run.xp}</div><div class="sl">XP earned</div></div>` +
    `<div class="lxd-mcg-stat"><div class="sv">${run.correct}/${n}</div><div class="sl">First-time right</div></div>` +
    `<div class="lxd-mcg-stat"><div class="sv">${streakNow()}</div><div class="sl">Day streak</div></div></div>`;

  function rComplete(scr) {
    const u = run.unit;
    const name = esc(H[u.id].name);
    const perfPct = run.scorable ? Math.round((run.correct / run.scorable) * 100) : 0;
    const perfLv = Math.max(1, Math.round(perfPct / 20));
    const nextU = U[idx(u.id) + 1];
    const when = whenText(store.done[u.id].due);
    let h =
      `<div class="lxd-mcg-done"><div class="lxd-mcg-crown">${CROWN}</div>` +
      '<h2 class="lxd-mcg-dh" tabindex="-1" data-focus>Habit complete</h2>' +
      `<p class="tagline">You’ve worked <b>${name}</b> through definition, recall, judgement and practice.</p>` +
      stats(run.scorable) +
      calibration(`${run.conf}/5`, run.conf * 20, `${perfLv}/5`, perfLv * 20, gapReflect(`${run.conf}/5`, `${perfLv}/5`, run.conf, perfLv));
    if (run.commit.trim())
      h += `<div class="lxd-mcg-panel"><h3>Your commitment</h3><div class="lxd-mcg-quote">${esc(run.commit)}</div><p class="after">Saved on your path. Next review of this habit: <b>${when}</b>.</p></div>`;
    else
      h += `<div class="lxd-mcg-panel"><p>Next review of this habit: <b>${when}</b>. Spacing the reviews out is what makes the habit stick.</p></div>`;
    const explorer = explorerUrl
      ? `<a href="${esc(explorerUrl)}" target="_blank" rel="noopener">Metacognition in Science Explorer</a>`
      : '<b>Metacognition in Science Explorer</b> on your unit’s Teaching frameworks page';
    h +=
      `<div class="lxd-mcg-ref"><div class="rh">Go deeper</div><p>See <b>${name}</b> across every stage and topic in the ${explorer} — the reference layer behind this game.</p></div>` +
      '<div class="lxd-mcg-btnrow"><button type="button" class="lxd-mcg-btn ghost" data-act="exit">Back to the path</button>' +
      (nextU
        ? `<button type="button" class="lxd-mcg-btn primary" data-act="unit" data-id="${nextU.id}">Next: ${esc(H[nextU.id].name)}</button>`
        : '<button type="button" class="lxd-mcg-btn primary" data-act="exit">See your path</button>') +
      '</div></div>';
    scr.innerHTML = h;
  }
  function rReviewComplete(scr) {
    const n = run.scorable;
    const lines = run.units
      .filter(isDone)
      .map((id) => `<li><b>${esc(H[id].name)}</b> — next review ${whenText(store.done[id].due)}</li>`)
      .join('');
    const pct = (k) => (n ? (k / n) * 100 : 0);
    scr.innerHTML =
      `<div class="lxd-mcg-done"><div class="lxd-mcg-crown">${CROWN}</div>` +
      '<h2 class="lxd-mcg-dh" tabindex="-1" data-focus>Review complete</h2>' +
      '<p class="tagline">Mixing the habits together is harder than practising them one at a time. That’s what makes it stick.</p>' +
      stats(n) +
      calibration(`${run.conf}/${n}`, pct(run.conf), `${run.correct}/${n}`, pct(run.correct), gapReflect(`${run.conf}/${n}`, `${run.correct}/${n}`, run.conf, run.correct)) +
      (lines ? `<div class="lxd-mcg-panel"><h3>Spaced reviews</h3><ul class="lxd-mcg-list">${lines}</ul></div>` : '') +
      '<div class="lxd-mcg-btnrow"><button type="button" class="lxd-mcg-btn ghost" data-act="exit">Back to the path</button><button type="button" class="lxd-mcg-btn primary" data-act="review">Another round</button></div></div>';
  }

  // ── finishing (persist) ──
  function finishUnit() {
    const u = run.unit;
    const t = today();
    const d = store.done[u.id];
    const pct = run.scorable ? Math.round((run.correct / run.scorable) * 100) : 0;
    if (!d) store.done[u.id] = { first: t, last: t, reviews: 0, due: addDays(t, INTERVALS[0]), best: pct, conf: run.conf };
    else {
      d.reviews = (d.reviews || 0) + 1;
      d.last = t;
      d.due = addDays(t, INTERVALS[Math.min(d.reviews, INTERVALS.length - 1)]);
      d.best = Math.max(d.best || 0, pct);
    }
    store.notes[u.id] = { apply: run.apply, commit: run.commit, at: t };
    store.xp += run.xp;
    bumpStreak();
    save();
  }
  function finishReview() {
    const t = today();
    run.units.forEach((id) => {
      const d = store.done[id];
      if (!d) return;
      d.reviews = (d.reviews || 0) + 1;
      d.last = t;
      d.due = addDays(t, INTERVALS[Math.min(d.reviews, INTERVALS.length - 1)]);
    });
    store.xp += run.xp;
    bumpStreak();
    save();
  }

  // ── answering ──
  function credit(first) {
    if (run.counted[run.i]) return;
    run.counted[run.i] = true;
    if (first) run.correct++;
    run.xp += first ? 10 : 5;
    const x = byId('xp');
    if (x) x.innerHTML = `${STAR}${run.xp} XP`;
  }
  function feedback(kind, title, body, coach) {
    const fb = byId('fb');
    fb.className = `lxd-mcg-fb ${kind}`;
    fb.innerHTML = `<div class="fbh">${title}</div><p>${body}</p>` + (coach ? `<div class="coach">Coach: ${coach}</div>` : '');
  }
  function lockAll() {
    root.querySelectorAll('.lxd-mcg-opt').forEach((x) => (x.disabled = true));
  }
  function showContinue() {
    const b = byId('btnrow');
    b.innerHTML = '<button type="button" class="lxd-mcg-btn primary" data-act="next">Continue</button>';
    b.querySelector('button').focus({ preventScroll: true });
  }
  function choose(s, j, btn) {
    const o = s.opts[j];
    run.attempts++;
    if (o.correct) {
      run.answered = true;
      lockAll();
      btn.classList.add('correct');
      credit(run.attempts === 1);
      feedback('good', '✓ That’s the one.', s.good, s.coach);
      showContinue();
      announce(`Correct. ${btn.textContent}`);
    } else if (o.partial) {
      btn.classList.add('partial');
      btn.disabled = true;
      feedback('part', '◐ So close.', s.part || o.fb, '');
      announce('Close, not quite. Try again.');
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      feedback('bad', 'Not quite — try again.', o.fb, '');
      announce('Not quite. Try again.');
    }
  }
  function chooseTF(s, val, btn) {
    run.attempts++;
    if (val === s.answer) {
      run.answered = true;
      lockAll();
      btn.classList.add('correct');
      credit(run.attempts === 1);
      feedback('good', `✓ ${s.answer ? 'Yes, it is.' : 'Right — it isn’t.'}`, s.good, s.coach);
      showContinue();
      announce('Correct.');
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      feedback('bad', 'Have another look.', s.bad, '');
      announce('Not quite. Try again.');
    }
  }

  // ── events: one delegated listener per mount ──
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act],[data-opt],[data-tf],[data-lv],[data-check]');
    if (!t || !root.contains(t)) return;
    const act = t.dataset.act;
    if (act !== 'reset') resetArmed = false;
    switch (act) {
      case 'unit':
        return startUnit(t.dataset.id);
      case 'review':
        return startReview();
      case 'exit':
        return showPath();
      case 'begin':
      case 'next':
        return t.disabled ? undefined : next();
      case 'applynext':
        run.apply = byId('apta').value;
        return next();
      case 'commitnext':
        run.commit = byId('cmta').value;
        finishUnit();
        return next();
      case 'reviewer':
        if (!allowReviewer) return;
        reviewer = !reviewer;
        return showPath(reviewer ? 'Reviewer mode on — every habit is unlocked.' : 'Reviewer mode off.');
      case 'reset':
        if (!resetArmed) {
          resetArmed = true;
          t.classList.add('arm');
          t.textContent = 'Tap again to erase all progress';
          return;
        }
        resetArmed = false;
        store = blank();
        save();
        return showPath('Progress reset.');
    }
    if (t.dataset.lv !== undefined) {
      run.conf = +t.dataset.lv;
      root.querySelectorAll('.lxd-mcg-lv').forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
      const b = root.querySelector('[data-act="begin"]');
      b.disabled = false;
      b.textContent = 'Start';
      return;
    }
    if (t.dataset.check !== undefined) {
      const ci = +t.dataset.check;
      run.checks[ci] = !run.checks[ci];
      t.setAttribute('aria-checked', String(run.checks[ci]));
      t.querySelector('.box').textContent = run.checks[ci] ? '✓' : '';
      return;
    }
    if (!run || run.answered) return;
    const s = run.steps[run.i];
    if (t.dataset.opt !== undefined) return choose(s, +t.dataset.opt, t);
    if (t.dataset.tf !== undefined) return chooseTF(s, t.dataset.tf === 'true', t);
  });

  // ── top bar pinning ──
  // CSS sticky can't be used: Moodle wraps Page content in .no-overflow
  // (overflow:auto), which stops sticky engaging, and Boost's fixed navbar covers
  // the top of the viewport. So the bar pins just below that navbar, worked out
  // from viewport geometry whenever anything scrolls (as the deep-dive's pills).
  let frame = 0;
  function pin() {
    frame = 0;
    const slot = root.querySelector('.lxd-mcg-barslot');
    const bar = slot && slot.firstElementChild;
    if (!bar || !el.isConnected) return;
    const top = headerBottom(el);
    const s = slot.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const h = bar.offsetHeight;
    const on = s.top < top && box.bottom > top + h;
    bar.classList.toggle('pinned', on);
    slot.style.height = on ? `${h}px` : '';
    bar.style.top = on ? `${top}px` : '';
    bar.style.left = on ? `${s.left}px` : '';
    bar.style.width = on ? `${s.width}px` : '';
  }
  const onScroll = () => {
    if (!frame) frame = window.requestAnimationFrame(pin);
  };
  // Capture phase catches a scroll on any element, whichever one Moodle scrolls.
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  showPath('', false);
}

// ── styles ───────────────────────────────────────────────────────────────────────
// Every selector is prefixed .lxd-mcg; every custom property is defined on
// .lxd-mcg (not :root) and used with an inline fallback, so a theme that strips
// or overrides variables still degrades to legible colour. Values are the
// prototype's, shared with the Framework Explorer's --fx-* tokens.
const T = {
  bg: '#F2F0EA', paper: '#FFFFFF', sunk: '#F6F4EF',
  ink: '#19282F', body: '#3B474F', muted: '#636F77',
  line: '#E2DDD2', line2: '#D4CDBF',
  accent: '#1C4C5B', 'accent-soft': '#E0EBEE', 'accent-line': '#B7D0D6',
  pos: '#2C6046', 'pos-soft': '#E5EFE9', 'pos-line': '#BBD7C6',
  neg: '#8B4232', 'neg-soft': '#F7ECE7', 'neg-line': '#E6C9BE',
  warn: '#7A6B1F', 'warn-soft': '#F6EEDC', 'warn-line': '#E4D2A6',
  gold: '#A5822C',
  phase: '#1C4C5B', 'phase-text': '#1C4C5B',
  pc: '#1C4C5B', 'pc-text': '#1C4C5B',
};
const v = (k) => `var(--mcg-${k},${T[k]})`;
const SERIF = 'Georgia,"Times New Roman",serif';
const SHADOW = '0 1px 2px rgba(25,40,47,.05),0 10px 28px rgba(25,40,47,.07)';
const P = '.lxd-mcg';

const phaseRules = Object.entries(PHASES)
  .map(
    ([k, p]) =>
      `${P}.lxd-mcg-ph-${k}{--mcg-phase:${p.colour};--mcg-phase-text:${p.text};}\n` +
      `${P} .lxd-mcg-pc-${k}{--mcg-pc:${p.colour};--mcg-pc-text:${p.text};}`,
  )
  .join('\n');

const STYLES = `
${P}{
  ${Object.entries(T).map(([k, val]) => `--mcg-${k}:${val};`).join(' ')}
  display:block;
  position:relative;
  background:${v('bg')};
  color:${v('body')};
  line-height:1.55;
  border-radius:16px;
  box-sizing:border-box;
}
${phaseRules}
${P} *,${P} *::before,${P} *::after{box-sizing:border-box;}
${P} h2,${P} h3{font-family:${SERIF};color:${v('ink')};}
${P} p{margin:0;}
${P} button,${P} textarea{font:inherit;}
${P} :focus-visible{outline:2.5px solid ${v('gold')};outline-offset:2px;border-radius:4px;}
${P} [tabindex="-1"]:focus{outline:none;}
@media(prefers-reduced-motion:reduce){${P} *{transition:none !important;animation:none !important;scroll-behavior:auto !important;}}
${P} .lxd-mcg-wrap{max-width:640px;margin:0 auto;padding:0 18px 32px;overflow-wrap:anywhere;}
${P} .lxd-mcg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}

/* top bar */
${P} .lxd-mcg-barslot{margin:0;}
${P} .lxd-mcg-topbar{background:#F2F0EA;background:rgba(242,240,234,.94);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;gap:14px;padding:14px 0 12px;}
${P} .lxd-mcg-topbar.pinned{position:fixed;z-index:1020;padding:14px 12px 12px;box-shadow:0 2px 6px rgba(25,40,47,.08);}
${P} .lxd-mcg-x{flex:0 0 auto;width:44px;height:44px;border-radius:11px;border:1.5px solid ${v('line')};background:${v('paper')};color:${v('muted')};font-size:17px;cursor:pointer;line-height:1;padding:0;}
${P} .lxd-mcg-x:hover{border-color:${v('line2')};}
${P} .lxd-mcg-prog{flex:1;min-width:0;height:14px;background:${v('sunk')};border:1px solid ${v('line')};border-radius:999px;overflow:hidden;}
${P} .lxd-mcg-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,${v('phase')},${v('accent')});border-radius:999px;transition:width .35s ease;}
${P} .lxd-mcg-xp{flex:0 0 auto;font-weight:700;font-size:14px;color:${v('warn')};font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:5px;}
${P} .lxd-mcg-xp svg{width:16px;height:16px;}

/* card */
${P} .lxd-mcg-card{background:${v('paper')};border:1px solid ${v('line')};border-radius:16px;box-shadow:${SHADOW};padding:26px 24px;margin-top:16px;}
${P} .lxd-mcg-eyebrow{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:${v('phase-text')};margin-bottom:10px;display:flex;align-items:center;gap:8px;}
${P} .lxd-mcg-eyebrow .dot{width:9px;height:9px;border-radius:50%;background:${v('phase')};flex:0 0 auto;}
${P} .lxd-mcg-q{font-size:22px;font-weight:600;line-height:1.25;margin:0 0 6px;}
${P} .lxd-mcg-q.big{font-size:27px;}
${P} .lxd-mcg-sub{font-size:15px;color:${v('body')};margin:0 0 18px;}
${P} .lxd-mcg-sub.lead{font-size:16.5px;}

/* options */
${P} .lxd-mcg-opts{display:flex;flex-direction:column;gap:10px;}
${P} .lxd-mcg-opt{display:flex;gap:13px;align-items:flex-start;text-align:left;width:100%;min-height:52px;margin:0;background:${v('paper')};border:1.5px solid ${v('line')};border-radius:13px;padding:14px 16px;cursor:pointer;font-size:15px;line-height:1.5;color:${v('ink')};transition:border-color .14s,background-color .14s;}
${P} .lxd-mcg-opt:hover{border-color:${v('accent-line')};}
${P} .lxd-mcg-opt .key{flex:0 0 auto;width:26px;height:26px;border-radius:8px;background:${v('sunk')};border:1px solid ${v('line')};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:${v('muted')};}
${P} .lxd-mcg-opt.correct{border-color:${v('pos')};background:${v('pos-soft')};}
${P} .lxd-mcg-opt.correct .key{background:${v('pos')};border-color:${v('pos')};color:#FFFFFF;}
${P} .lxd-mcg-opt.wrong{border-color:${v('neg')};background:${v('neg-soft')};}
${P} .lxd-mcg-opt.wrong .key{background:${v('neg')};border-color:${v('neg')};color:#FFFFFF;}
${P} .lxd-mcg-opt.partial{border-color:${v('warn')};background:${v('warn-soft')};}
${P} .lxd-mcg-opt.partial .key{background:${v('warn')};border-color:${v('warn')};color:#FFFFFF;}
${P} .lxd-mcg-opt[disabled]{cursor:default;opacity:1;color:${v('ink')};}
${P} .lxd-mcg-opt .optbody{flex:1;min-width:0;}
${P} .lxd-mcg-tf{display:flex;gap:12px;}
${P} .lxd-mcg-tf .lxd-mcg-opt{flex:1;justify-content:center;text-align:center;font-weight:600;}

/* feedback */
${P} .lxd-mcg-fb{margin-top:16px;border-radius:13px;padding:16px 18px;}
${P} .lxd-mcg-fb:empty{display:none;}
${P} .lxd-mcg-fb.good{background:${v('pos-soft')};border:1px solid ${v('pos-line')};}
${P} .lxd-mcg-fb.bad{background:${v('neg-soft')};border:1px solid ${v('neg-line')};}
${P} .lxd-mcg-fb.part{background:${v('warn-soft')};border:1px solid ${v('warn-line')};}
${P} .lxd-mcg-fb .fbh{font-weight:700;font-size:14px;margin-bottom:5px;}
${P} .lxd-mcg-fb.good .fbh{color:${v('pos')};}
${P} .lxd-mcg-fb.bad .fbh{color:${v('neg')};}
${P} .lxd-mcg-fb.part .fbh{color:${v('warn')};}
${P} .lxd-mcg-fb p{font-size:14.5px;color:${v('ink')};}
${P} .lxd-mcg-fb .coach{margin-top:9px;font-size:13.5px;color:${v('body')};font-style:italic;}

/* buttons */
${P} .lxd-mcg-btnrow{margin-top:20px;display:flex;gap:10px;}
${P} .lxd-mcg-btnrow:empty{display:none;}
${P} .lxd-mcg-btn{flex:1;font-size:15.5px;font-weight:700;line-height:1.3;min-height:48px;padding:13px 20px;margin:0;border-radius:13px;border:none;cursor:pointer;}
${P} .lxd-mcg-btn.primary{background:${v('accent')};color:#FFFFFF;}
${P} .lxd-mcg-btn.primary:hover{background:#163E4A;}
${P} .lxd-mcg-btn.primary:disabled{background:${v('sunk')};color:${v('muted')};border:1.5px dashed ${v('line2')};cursor:default;}
${P} .lxd-mcg-btn.ghost{flex:0 0 auto;background:${v('paper')};border:1.5px solid ${v('line')};color:${v('body')};}
${P} .lxd-mcg-btn.ghost:hover{border-color:${v('line2')};}

/* scenario */
${P} .lxd-mcg-scene{background:${v('sunk')};border-left:3px solid ${v('phase')};border-radius:0 11px 11px 0;padding:15px 18px;margin:0 0 18px;font-size:15.5px;color:${v('ink')};}
${P} .lxd-mcg-scene .ctx{font-size:12px;letter-spacing:.03em;text-transform:uppercase;font-weight:700;color:${v('phase-text')};margin-bottom:7px;}

/* calibration */
${P} .lxd-mcg-scale{display:flex;gap:8px;margin:18px 0 4px;}
${P} .lxd-mcg-lv{flex:1;min-width:0;margin:0;border:1.5px solid ${v('line')};background:${v('paper')};border-radius:12px;padding:12px 4px;cursor:pointer;text-align:center;color:${v('ink')};}
${P} .lxd-mcg-lv.tight{padding:12px 2px;}
${P} .lxd-mcg-lv:hover{border-color:${v('accent-line')};}
${P} .lxd-mcg-lv[aria-pressed="true"]{border-color:${v('accent')};background:${v('accent-soft')};}
${P} .lxd-mcg-lv .lvn{font-family:${SERIF};font-size:21px;font-weight:700;color:${v('accent')};}
${P} .lxd-mcg-lv .lvl{display:block;font-size:11px;color:${v('muted')};margin-top:3px;line-height:1.2;}
${P} .lxd-mcg-lv[aria-pressed="true"] .lvl{color:${v('body')};}
${P} .lxd-mcg-scalelabels{display:flex;justify-content:space-between;font-size:11.5px;color:${v('muted')};margin-top:2px;}

/* application */
${P} .lxd-mcg-ta{display:block;width:100%;min-height:96px;margin:0;border:1.5px solid ${v('line')};border-radius:12px;padding:13px 14px;font-size:15px;color:${v('ink')};resize:vertical;background:${v('paper')};}
${P} .lxd-mcg-ta:focus{border-color:${v('accent')};outline:none;}
${P} .lxd-mcg-ta:focus-visible{outline:2.5px solid ${v('gold')};outline-offset:2px;}
${P} .lxd-mcg-ta::placeholder{color:#6B767D;opacity:1;}
${P} .lxd-mcg-hint{font-size:13px;color:${v('muted')};margin:8px 0 0;}
${P} .lxd-mcg-checklabel{margin-top:16px;font-size:12.5px;font-weight:700;color:${v('muted')};text-transform:uppercase;letter-spacing:.05em;}
${P} .lxd-mcg-check{display:flex;gap:11px;align-items:flex-start;width:100%;text-align:left;padding:12px 14px;border:1.5px solid ${v('line')};border-radius:12px;margin:9px 0 0;cursor:pointer;background:${v('paper')};}
${P} .lxd-mcg-check:hover{border-color:${v('accent-line')};}
${P} .lxd-mcg-check[aria-checked="true"]{border-color:${v('pos')};background:${v('pos-soft')};}
${P} .lxd-mcg-check .box{flex:0 0 auto;width:22px;height:22px;border-radius:6px;border:2px solid #8A9AA1;display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-size:13px;}
${P} .lxd-mcg-check[aria-checked="true"] .box{background:${v('pos')};border-color:${v('pos')};}
${P} .lxd-mcg-check .txt{font-size:14px;color:${v('ink')};}

/* note */
${P} .lxd-mcg-note{background:${v('accent-soft')};border:1px solid ${v('accent-line')};border-radius:12px;padding:13px 16px;margin-top:16px;font-size:14px;color:${v('ink')};}
${P} .lxd-mcg-note b{color:${v('accent')};}

/* path */
${P} .lxd-mcg-head{text-align:center;padding:28px 0 4px;}
${P} .lxd-mcg-title{font-size:30px;font-weight:700;line-height:1.2;margin:0 0 6px;}
${P} .lxd-mcg-head p{font-size:15.5px;color:${v('body')};margin:0 auto;max-width:48ch;}
${P} .lxd-mcg-statrow{display:flex;gap:10px;margin:20px 0 0;}
${P} .lxd-mcg-statrow .s{flex:1;background:${v('paper')};border:1px solid ${v('line')};border-radius:13px;padding:12px 8px;text-align:center;}
${P} .lxd-mcg-statrow .v{font-family:${SERIF};font-size:23px;font-weight:700;color:${v('accent')};font-variant-numeric:tabular-nums;}
${P} .lxd-mcg-statrow .l{font-size:11px;color:${v('muted')};text-transform:uppercase;letter-spacing:.05em;margin-top:1px;}
${P} .lxd-mcg-review{margin-top:14px;display:flex;gap:14px;align-items:center;background:${v('paper')};border:1.5px solid ${v('accent-line')};border-radius:14px;padding:14px 16px;}
${P} .lxd-mcg-review.off{border-style:dashed;border-color:${v('line2')};background:${v('sunk')};}
${P} .lxd-mcg-review .rt{flex:1;min-width:0;}
${P} .lxd-mcg-review .rn{font-weight:700;color:${v('ink')};font-size:15px;}
${P} .lxd-mcg-review .rm{font-size:13px;color:${v('muted')};margin-top:2px;}
${P} .lxd-mcg-review .go{flex:0 0 auto;font-size:14px;font-weight:700;border:none;border-radius:11px;min-height:44px;padding:10px 16px;margin:0;background:${v('accent')};color:#FFFFFF;cursor:pointer;}
${P} .lxd-mcg-review .go:hover{background:#163E4A;}
${P} .lxd-mcg-path{margin-top:22px;display:flex;flex-direction:column;gap:11px;}
${P} .lxd-mcg-node{display:flex;gap:14px;align-items:center;background:${v('paper')};border:1.5px solid ${v('line')};border-radius:14px;padding:12px 14px;box-shadow:${SHADOW};}
${P} .lxd-mcg-node .disc{flex:0 0 auto;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#FFFFFF;background:${v('pc')};}
${P} .lxd-mcg-node .ntext{flex:1;min-width:0;}
${P} .lxd-mcg-node .chip{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${v('pc-text')};}
${P} .lxd-mcg-node .nnm{font-weight:600;color:${v('ink')};font-size:15.5px;line-height:1.25;}
${P} .lxd-mcg-node .nmeta{font-size:12.5px;color:${v('muted')};margin-top:2px;}
${P} .lxd-mcg-node .nmeta.due{color:${v('warn')};font-weight:700;}
${P} .lxd-mcg-node.locked{background:${v('sunk')};box-shadow:none;}
${P} .lxd-mcg-node.locked .disc{background:#E6E0D4;color:#4F4A40;}
${P} .lxd-mcg-node.locked .nnm,${P} .lxd-mcg-node.locked .chip{color:${v('muted')};}
${P} .lxd-mcg-node.current{border-color:${v('pc')};box-shadow:0 0 0 3px rgba(28,76,91,.12),${SHADOW};}
${P} .lxd-mcg-node.current .disc{animation:lxd-mcg-pulse 2.4s ease-in-out infinite;}
@keyframes lxd-mcg-pulse{0%,100%{box-shadow:0 0 0 4px rgba(28,76,91,.14);}50%{box-shadow:0 0 0 9px rgba(28,76,91,.04);}}
${P} .lxd-mcg-node .act{flex:0 0 auto;font-size:14px;font-weight:700;border-radius:11px;min-height:44px;padding:10px 15px;margin:0;cursor:pointer;}
${P} .lxd-mcg-node .act.start{border:none;background:${v('pc')};color:#FFFFFF;}
${P} .lxd-mcg-node .act.replay{border:1.5px solid ${v('line')};background:${v('paper')};color:${v('body')};}
${P} .lxd-mcg-node .act.replay:hover{border-color:${v('line2')};}
${P} .lxd-mcg-node .lock{flex:0 0 auto;font-size:12px;font-weight:700;color:${v('muted')};text-transform:uppercase;letter-spacing:.05em;}
${P} .lxd-mcg-log{margin-top:26px;background:${v('paper')};border:1px solid ${v('line')};border-radius:14px;padding:18px 20px;}
${P} .lxd-mcg-log h3{font-size:17px;font-weight:700;line-height:1.3;margin:0 0 4px;}
${P} .lxd-mcg-log .lsub{font-size:13px;color:${v('muted')};margin:0 0 10px;}
${P} .lxd-mcg-log ul,${P} .lxd-mcg-list{margin:0;padding-left:18px;}
${P} .lxd-mcg-log li,${P} .lxd-mcg-list li{font-size:14px;color:${v('ink')};margin-bottom:8px;}
${P} .lxd-mcg-log li b{color:${v('accent')};}
${P} .lxd-mcg-tools{margin-top:24px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}
${P} .lxd-mcg-tool{font-size:13px;font-weight:600;min-height:44px;padding:9px 14px;margin:0;border-radius:10px;border:1.5px solid ${v('line')};background:${v('paper')};color:${v('body')};cursor:pointer;}
${P} .lxd-mcg-tool:hover{border-color:${v('line2')};}
${P} .lxd-mcg-tool[aria-pressed="true"]{border-color:${v('accent')};background:${v('accent-soft')};color:${v('accent')};}
${P} .lxd-mcg-tool.danger{color:${v('neg')};}
${P} .lxd-mcg-tool.danger.arm{background:${v('neg')};border-color:${v('neg')};color:#FFFFFF;}

/* completion */
${P} .lxd-mcg-done{text-align:center;padding-top:16px;}
${P} .lxd-mcg-crown{width:88px;height:88px;margin:4px auto 10px;border-radius:50%;background:${v('warn-soft')};border:2px solid ${v('warn-line')};display:flex;align-items:center;justify-content:center;}
${P} .lxd-mcg-crown svg{width:46px;height:46px;}
${P} .lxd-mcg-dh{font-size:28px;font-weight:700;line-height:1.2;margin:0 0 6px;}
${P} .lxd-mcg-done .tagline{font-size:15.5px;color:${v('body')};margin:0 0 20px;}
${P} .lxd-mcg-stats{display:flex;gap:10px;margin:0 0 16px;}
${P} .lxd-mcg-stat{flex:1;background:${v('paper')};border:1px solid ${v('line')};border-radius:13px;padding:14px 8px;}
${P} .lxd-mcg-stat .sv{font-family:${SERIF};font-size:26px;font-weight:700;color:${v('accent')};}
${P} .lxd-mcg-stat .sl{font-size:11.5px;color:${v('muted')};text-transform:uppercase;letter-spacing:.05em;margin-top:2px;}
${P} .lxd-mcg-panel{background:${v('paper')};border:1px solid ${v('line')};border-radius:14px;padding:18px 20px;text-align:left;margin-bottom:14px;}
${P} .lxd-mcg-panel h3{font-size:16px;font-weight:700;line-height:1.3;margin:0 0 12px;}
${P} .lxd-mcg-panel p{font-size:14px;color:${v('body')};}
${P} .lxd-mcg-panel p.after{margin-top:10px;}
${P} .lxd-mcg-cb{display:flex;align-items:center;gap:11px;margin-bottom:10px;}
${P} .lxd-mcg-cb .cbl{flex:0 0 112px;font-size:13px;color:${v('muted')};}
${P} .lxd-mcg-cb .cbtrack{display:block;flex:1;min-width:0;height:14px;background:${v('sunk')};border-radius:999px;overflow:hidden;border:1px solid ${v('line')};}
${P} .lxd-mcg-cb .cbfill{display:block;height:100%;border-radius:999px;}
${P} .lxd-mcg-cb.pre .cbfill{background:${v('muted')};}
${P} .lxd-mcg-cb.perf .cbfill{background:${v('pos')};}
${P} .lxd-mcg-cb .cbv{flex:0 0 auto;font-size:13px;font-weight:700;color:${v('ink')};min-width:38px;text-align:right;}
${P} .lxd-mcg-reflect{margin-top:4px;font-size:14.5px;color:${v('ink')};background:${v('accent-soft')};border-radius:11px;padding:12px 14px;}
${P} .lxd-mcg-quote{font-size:14.5px;color:${v('ink')};background:${v('sunk')};border-left:3px solid ${v('accent')};border-radius:0 10px 10px 0;padding:10px 14px;margin-top:8px;font-style:italic;white-space:pre-wrap;}
${P} .lxd-mcg-ref{background:${v('sunk')};border:1px dashed ${v('line2')};border-radius:13px;padding:15px 18px;text-align:left;margin-bottom:8px;}
${P} .lxd-mcg-ref .rh{font-weight:700;color:${v('ink')};font-size:14.5px;margin-bottom:4px;}
${P} .lxd-mcg-ref p{font-size:13.5px;color:${v('body')};}
${P} .lxd-mcg-ref a{color:${v('accent')};font-weight:600;text-decoration:underline;}
${P} .lxd-mcg-foot{text-align:center;font-size:12.5px;color:${v('muted')};margin-top:24px;line-height:1.5;}
${P} .lxd-mcg-toast{margin-top:10px;font-size:13px;color:${v('accent')};text-align:center;min-height:18px;}
@media(max-width:480px){
  ${P} .lxd-mcg-stats,${P} .lxd-mcg-statrow{flex-wrap:wrap;}
  ${P} .lxd-mcg-stat,${P} .lxd-mcg-statrow .s{flex-basis:calc(50% - 5px);}
  ${P} .lxd-mcg-cb .cbl{flex-basis:86px;}
  ${P} .lxd-mcg-q{font-size:20px;}
  ${P} .lxd-mcg-card{padding:22px 18px;}
  ${P} .lxd-mcg-wrap{padding:0 12px 28px;}
}
`;
