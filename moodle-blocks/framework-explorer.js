// moodle-blocks/framework-explorer.js
// Config-driven "Framework Explorer" renderer for LXDUNE.
// Ports the standalone HITS/Metacognition artefacts into the live repo pattern:
// pedagogy lives in validated JSON under frameworks/<id>/, this module fetches
// and renders it into a Moodle page. Same delivery model as blocks.js.
//
//   <div id="lxd-framework-explorer"></div>
//   <script type="module">
//     import { renderFrameworkExplorer }
//       from "https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/framework-explorer.js";
//     renderFrameworkExplorer({ framework: "hits-nsw-science" });
//   </script>
//
// Options: framework (required), mount (default "lxd-framework-explorer"),
// showDrafts (default false). A matrix topic whose `review.published` is false
// is a draft: hidden unless showDrafts is true, and then labelled as a draft.
//
// Moodle-deployment constraints (handoff §7) are honoured here:
//   • All markup + CSS scoped under a single root class (.lxd-fx); custom
//     properties live on .lxd-fx, not :root. No bare body/h1/details/footer.
//   • No Google Fonts / external requests — inherits the Moodle theme font stack.
//   • No localStorage/sessionStorage — all state is in-memory (closure).
//   • Colour fallbacks inline alongside every custom property, incl. the
//     runtime-set --pc phase colour, so a theme that strips vars stays legible.
//   • Keyboard-reachable controls, visible focus, aria-pressed on selectors,
//     prefers-reduced-motion respected, AA contrast.

const BASE = new URL('..', import.meta.url).href;
// Deep-dive phase palette, assigned by phase index and cycled. The third colour is
// darkened from #8A7A24 so white week labels on it meet AA (5.32:1).
const PHASE_COLOURS = ['#1C4C5B', '#2F6E6A', '#7A6B1F', '#8C4E2E', '#6B3F63'];

// ── utilities ───────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Framework prose fields are AUTHORED, schema-validated "constrained HTML"
// (<b>, <i>) — inserted as trusted markup by design. User-derived values are
// escaped via esc(). Keep this distinction when editing.
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function setError(mount, msg) {
  mount.innerHTML =
    `<div style="padding:12px 16px;border:1px solid #e8b4b8;border-left:4px solid #c0392b;` +
    `border-radius:8px;color:#c0392b;font-family:Arial,sans-serif;font-size:.9em;">` +
    `Framework Explorer: ${esc(msg)}</div>`;
}

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

// ── public entry ──────────────────────────────────────────────────────────────
export async function renderFrameworkExplorer({ framework, mount = 'lxd-framework-explorer', showDrafts = false } = {}) {
  const el = typeof mount === 'string' ? document.getElementById(mount) : mount;
  if (!el) {
    console.warn(`[framework-explorer] no mount element "${mount}"`);
    return;
  }
  if (!framework) return setError(el, 'no framework id supplied');

  try {
    const dir = `${BASE}frameworks/${framework}/`;
    const fw = await fetchJson(`${dir}framework.json`);
    const view = VIEWS[fw.viewType];
    if (!view) throw new Error(`unknown viewType "${fw.viewType}"`);
    const data = await view.load(dir, fw);
    view.render(el, fw, data, { showDrafts: showDrafts === true });
    stampVersion(el, fw, data);
  } catch (e) {
    setError(el, e.message);
    console.error('[framework-explorer]', e);
  }
}

// Stamp the rendered output with the framework id, version and a content hash
// (handoff §10) — so a deployed page is traceable to an exact data revision.
// Set after render(): innerHTML replaces content but leaves dataset intact.
function stampVersion(el, fw, data) {
  const payload = data.items ? data.items : [data.habits, data.stages, data.cells];
  const hash = djb2(JSON.stringify(payload) + '|' + fw.version);
  el.dataset.fxFramework = fw.id;
  el.dataset.fxVersion = fw.version;
  el.dataset.fxContentHash = hash;
  el.insertAdjacentHTML('afterbegin', `<!-- Framework Explorer · ${fw.id} · v${fw.version} · ${hash} -->`);
}

// djb2, hashing to 8 hex chars. Not cryptographic — just a stable content
// fingerprint so two builds of the same data stamp identically.
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

// ── view registry ──────────────────────────────────────────────────────────────
// The core (fetch + mount + styles + error handling) is view-agnostic. Each
// view owns its own load() and render(). Adding the matrix view must not
// require changes above this line — that is the seam the port is proving.
const VIEWS = {
  'deep-dive': { load: loadDeepDive, render: renderDeepDive },
  matrix: { load: loadMatrix, render: renderMatrix },
  grid: { load: loadGrid, render: renderGrid },
};

// ── deep-dive view (HITS shape) ─────────────────────────────────────────────────
// Layout version of this view, stamped as data-fx-renderer. It is separate from
// the framework's content version (data-fx-version), which feeds the content
// hash: a layout change bumps this, never the content version.
const DEEPDIVE_RENDERER = 'deep-dive@2.0.0';

async function loadDeepDive(dir, fw) {
  if (!Array.isArray(fw.items) || !fw.items.length) throw new Error('framework has no items manifest');
  const [items, labels] = await Promise.all([
    Promise.all(fw.items.map((p) => fetchJson(dir + p))),
    loadVocabLabels(dir, fw),
  ]);
  items.sort((a, b) => a.ordinal - b.ordinal);
  return { items, labels };
}

// Resolve controlled-vocabulary ids to their display labels so context chips
// read as authored ("Science 7–10 Syllabus (2023)") not as slugs. Best-effort:
// if the vocab can't be fetched, chips fall back to a prettified id.
async function loadVocabLabels(dir, fw) {
  const labels = new Map();
  if (!fw.vocabulary) return labels;
  try {
    const vocab = await fetchJson(new URL(fw.vocabulary, dir).href);
    for (const [id, s] of Object.entries(vocab.stages || {})) labels.set(id, s.label || id);
    for (const [id, s] of Object.entries(vocab.syllabuses || {})) labels.set(id, s.label || id);
    for (const byStage of Object.values(vocab.focusAreas || {}))
      for (const list of Object.values(byStage)) for (const fa of list) labels.set(fa.id, fa.label);
    for (const list of Object.values(vocab.modules || {})) for (const m of list) labels.set(m.id, m.label);
    for (const [id, t] of Object.entries(vocab.themes || {}))
      if (!id.startsWith('_')) labels.set(id, t.label || id);
  } catch (e) {
    console.warn('[framework-explorer] vocabulary not resolved, using prettified ids', e);
  }
  return labels;
}

// Section model: key, pill label, panel heading. A section (and its pill) is
// rendered only when the item has data for it.
const DD_SECTIONS = {
  faculty: { pill: 'In a science faculty', heading: 'In a science faculty' },
  exemplar: { pill: 'The sustained exemplar', heading: 'The sustained exemplar' },
  indicators: { pill: 'Indicators', heading: 'Indicators in a science classroom' },
  continuum: { pill: 'Continuum of practice', heading: 'Continuum of practice' },
  evidence: { pill: 'Evidence & transfer', heading: 'Evidence & transfer' },
};

const DD_INDICATORS = [
  ['t', 'teacher', 'Teacher', 'Demonstrated when the teacher…'],
  ['n', 'notDemonstrated', 'Not demonstrated', 'Not demonstrated when…'],
  ['s', 'student', 'Students', 'Demonstrated when students…'],
];

// Each mount gets its own id prefix, so two explorers on one page never share
// ids (aria-controls, tab panels, section anchors).
let ddMounts = 0;

const pad2 = (n) => String(n).padStart(2, '0');
const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function go(el, block = 'start') {
  if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block });
}

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

// Scroll so `el`'s top lands `gap` px below the top of the viewport.
function scrollToGap(el, gap) {
  if (!el) return;
  scrollerOf(el).scrollBy({ top: el.getBoundingClientRect().top - gap, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

// Bottom edge of any fixed or sticky header across the top of the viewport
// (Boost's navbar), ignoring the explorer's own elements; 0 on a plain page.
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

function renderDeepDive(mount, fw, { items, labels }) {
  injectStyles('lxd-fx-dd-styles', DEEPDIVE_STYLES);
  mount.className = 'lxd-fx lxd-fx-dd';
  mount.dataset.fxRenderer = DEEPDIVE_RENDERER;
  const uid = `lxd-fx-dd${++ddMounts}`;
  mount.innerHTML = SHELL(fw, items, uid);

  const $ = (sel) => mount.querySelector(sel);
  const $$ = (sel) => [...mount.querySelectorAll(sel)];
  const itemBox = $('.lxd-fx-dd-item');
  const byId = new Map(items.map((it, i) => [it.id, i]));
  // In-memory state only (no browser storage); reset on every strategy switch.
  const state = { cur: 0, tab: 't', level: 1 };
  let frame = 0;

  function select(i) {
    const hadFocus = itemBox.contains(document.activeElement);
    Object.assign(state, { cur: i, tab: 't', level: 1 });
    lock = null;
    renderItem();
    const head = $('.lxd-fx-dd-head');
    // A works-with chip is destroyed by the re-render: move focus to the new
    // strategy's header rather than losing it to <body>.
    if (hadFocus) head.focus({ preventScroll: true });
    scrollToGap(head, headerBottom(mount) + 12);
  }

  function renderItem() {
    const it = items[state.cur];
    $$('.lxd-fx-dd-chip').forEach((c) => {
      const on = +c.dataset.i === state.cur;
      c.classList.toggle('on', on);
      if (on) c.setAttribute('aria-current', 'true');
      else c.removeAttribute('aria-current');
    });
    const sections = [
      ['faculty', facultyHTML(it)],
      ['exemplar', exemplarHTML(it, labels, uid)],
      ['indicators', indicatorsHTML(it, uid, state.tab)],
      ['continuum', continuumHTML(it, uid)],
      ['evidence', evidenceHTML(it, items, byId)],
    ].filter(([, html]) => html);
    itemBox.innerHTML =
      headerHTML(it, items.length) +
      pillsHTML(sections, uid) +
      sections.map(([key, html]) => panelHTML(key, html, uid)).join('');
    setLevel(state.level);
    syncAll();
    layout();
  }

  // ── exemplar phases ──
  function setPhase(i, open) {
    const ph = $(`.lxd-fx-dd-phase[data-i="${i}"]`);
    if (!ph) return;
    ph.classList.toggle('open', open);
    ph.querySelector('.lxd-fx-dd-phd').setAttribute('aria-expanded', String(open));
    ph.querySelector('.lxd-fx-dd-pdetail').hidden = !open;
    syncAll();
  }
  function syncAll() {
    const btn = $('.lxd-fx-dd-all');
    if (!btn) return;
    const all = $$('.lxd-fx-dd-phase').length;
    const open = $$('.lxd-fx-dd-phase.open').length;
    btn.querySelector('.lxd-fx-dd-all-t').textContent = open === all ? 'Collapse all phases' : 'Expand all phases';
    btn.setAttribute('aria-expanded', String(open === all));
  }

  // ── indicator tabs ──
  function setTab(k) {
    state.tab = k;
    $$('.lxd-fx-dd-tab').forEach((t) => {
      const on = t.dataset.tab === k;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    $$('.lxd-fx-dd-tabpane').forEach((p) => (p.hidden = p.dataset.tab !== k));
  }

  // ── continuum maturity track ──
  function setLevel(lv) {
    const levels = sortedLevels(items[state.cur]);
    const detail = $('.lxd-fx-dd-cdetail');
    if (!levels.length || !detail) return;
    const idx = Math.max(0, levels.findIndex((c) => c.level === lv));
    const c = levels[idx];
    state.level = c.level;
    $$('.lxd-fx-dd-node').forEach((n, j) => {
      n.classList.toggle('active', j === idx);
      n.setAttribute('aria-pressed', String(j === idx));
    });
    const n = levels.length;
    $('.lxd-fx-dd-fill').style.width = n > 1 ? `calc((100% - 100% / ${n}) * ${idx / (n - 1)})` : '0';
    detail.innerHTML =
      `<div class="lxd-fx-dd-mdh"><span class="lxd-fx-dd-mdlv">Level ${esc(c.level)}</span>` +
      `<span class="lxd-fx-dd-mdname">${esc(c.label)}</span></div><p>${c.text}</p>`;
  }

  // ── section pills: jump + scrollspy ──
  function setPill(key) {
    $$('.lxd-fx-dd-pill').forEach((p) => {
      const on = p.dataset.sec === key;
      if (on && !p.classList.contains('active')) revealPill(p);
      p.classList.toggle('active', on);
      if (on) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
    });
  }
  // On narrow screens the pill row scrolls sideways: keep the active pill in
  // view by scrolling the row only (scrollIntoView would also move the page).
  function revealPill(p) {
    const row = p.parentElement;
    if (row.scrollWidth <= row.clientWidth) return;
    const left = p.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + p.offsetWidth > row.scrollLeft + row.clientWidth)
      row.scrollTo({ left: Math.max(0, left - 12), behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
  // Pinning and scrollspy, worked out from viewport geometry whenever anything
  // scrolls. CSS sticky can't be used: Moodle wraps Page content in .no-overflow
  // (overflow:auto), which stops sticky ever engaging, and Boost's fixed navbar
  // covers the top of the viewport, so the bar pins just below that navbar.
  function layout() {
    frame = 0;
    const slot = $('.lxd-fx-dd-pillslot');
    const bar = slot && slot.firstElementChild;
    if (!bar || !mount.isConnected) return;
    const top = headerBottom(mount);
    const s = slot.getBoundingClientRect();
    const box = itemBox.getBoundingClientRect();
    const h = bar.offsetHeight;
    const pin = s.top < top && box.bottom > top + h;
    bar.classList.toggle('pinned', pin);
    slot.style.height = pin ? `${h}px` : '';
    bar.style.top = pin ? `${top}px` : '';
    bar.style.left = pin ? `${s.left}px` : '';
    bar.style.width = pin ? `${s.width}px` : '';
    // A pill click holds its section until the reader next scrolls by hand.
    if (lock) return setPill(lock);
    // Otherwise the active section is the last panel whose top has passed a
    // reading line a quarter of the way down the visible area, and the last
    // panel once the page is scrolled to the very end.
    const panels = $$('.lxd-fx-dd-panel');
    if (!panels.length) return;
    const line = top + h + (window.innerHeight - top - h) / 4;
    let cur = panels[0];
    for (const p of panels) if (p.getBoundingClientRect().top <= line) cur = p;
    const last = panels[panels.length - 1];
    const sc = scrollerOf(itemBox);
    const atEnd =
      sc === window
        ? window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
        : sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
    if (atEnd && last.getBoundingClientRect().top < window.innerHeight) cur = last;
    setPill(cur.dataset.sec);
  }
  let lock = null;
  const onScroll = () => {
    if (!frame) frame = window.requestAnimationFrame(layout);
  };
  // Capture phase catches a scroll on any element, whichever one Moodle scrolls.
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // Any hand-driven scroll releases a pill click's hold on the highlight.
  for (const type of ['wheel', 'touchstart', 'keydown', 'mousedown'])
    document.addEventListener(type, () => (lock = null), { capture: true, passive: true });

  // One delegated listener per mount, so re-rendering never orphans handlers.
  mount.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t || !mount.contains(t)) return;
    const i = Number(t.dataset.i);
    switch (t.dataset.act) {
      case 'select':
        return select(i);
      case 'pill': {
        // Land the panel just below the pinned bar (and any fixed navbar above it).
        const bar = $('.lxd-fx-dd-pillbar');
        lock = t.dataset.sec;
        setPill(lock);
        return scrollToGap(mount.querySelector(`#${uid}-sec-${t.dataset.sec}`), headerBottom(mount) + bar.offsetHeight + 8);
      }
      case 'phase':
        return setPhase(i, t.getAttribute('aria-expanded') !== 'true');
      case 'rseg':
        $$('.lxd-fx-dd-rseg').forEach((s) => s.classList.toggle('on', s === t));
        setPhase(i, true);
        return go($(`.lxd-fx-dd-phase[data-i="${i}"]`), 'center');
      case 'all': {
        const phases = $$('.lxd-fx-dd-phase');
        const want = $$('.lxd-fx-dd-phase.open').length < phases.length;
        return phases.forEach((p) => setPhase(Number(p.dataset.i), want));
      }
      case 'tab':
        return setTab(t.dataset.tab);
      case 'level':
        return setLevel(Number(t.dataset.lv));
    }
  });
  // Tabs: arrow keys, Home and End move between tabs (roving tabindex).
  mount.addEventListener('keydown', (e) => {
    const t = e.target.closest('[role="tab"]');
    if (!t || !mount.contains(t)) return;
    const tabs = [...t.parentElement.querySelectorAll('[role="tab"]')];
    let j = tabs.indexOf(t);
    if (e.key === 'ArrowRight') j = (j + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') j = (j - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabs.length - 1;
    else return;
    e.preventDefault();
    setTab(tabs[j].dataset.tab);
    tabs[j].focus();
  });

  renderItem();
}

function sortedLevels(it) {
  return [...(it.continuum || [])].sort((a, b) => a.level - b.level);
}

// ── section builders: each returns '' when the item has no data for it ──────────
function headerHTML(it, total) {
  const badges = (it.badges || [])
    .map((bd, i) => {
      const cls = bd.kind === 'monthsProgress' ? ' mop' : i === 0 ? ' hero' : '';
      return `<span class="lxd-fx-dd-badge${cls}">${esc(bd.value ? `${bd.label} · ${bd.value}` : bd.label)}</span>`;
    })
    .join('');
  return (
    `<div class="lxd-fx-dd-head" tabindex="-1">` +
    `<p class="lxd-fx-dd-eye">High Impact Teaching Strategy ${pad2(it.ordinal)} of ${pad2(total)}</p>` +
    `<h2 class="lxd-fx-dd-name">${esc(it.name)}</h2>` +
    (it.headline ? `<p class="lxd-fx-dd-hl">${it.headline}</p>` : '') +
    (badges ? `<div class="lxd-fx-dd-badges">${badges}</div>` : '') +
    `</div>`
  );
}

function pillsHTML(sections, uid) {
  const pills = sections
    .map(
      ([key], i) =>
        `<button type="button" class="lxd-fx-dd-pill${i === 0 ? ' active' : ''}" data-act="pill" data-sec="${key}"` +
        ` aria-controls="${uid}-sec-${key}"${i === 0 ? ' aria-current="true"' : ''}>${esc(DD_SECTIONS[key].pill)}</button>`,
    )
    .join('');
  // The slot holds the bar's place in the layout while the bar is pinned.
  return (
    `<div class="lxd-fx-dd-pillslot"><nav class="lxd-fx-dd-pillbar" aria-label="Sections of this strategy">` +
    `<div class="lxd-fx-dd-pills">${pills}</div></nav></div>`
  );
}

function panelHTML(key, body, uid) {
  return (
    `<section class="lxd-fx-dd-panel" id="${uid}-sec-${key}" data-sec="${key}" aria-labelledby="${uid}-h-${key}">` +
    `<h3 class="lxd-fx-dd-ph lxd-fx-dd-ph-${key}" id="${uid}-h-${key}">${esc(DD_SECTIONS[key].heading)}</h3>` +
    `<div class="lxd-fx-dd-pbody">${body}</div></section>`
  );
}

function facultyHTML(it) {
  return it.inContext ? `<p>${it.inContext}</p>` : '';
}

function exemplarHTML(it, labels, uid) {
  const ex = it.exemplar;
  if (!ex) return '';
  const meta = contextChips(ex.context || {}, labels)
    .map(({ text }) => esc(text))
    .join(' · ');
  const phases = ex.phases || [];
  const colour = (i) => PHASE_COLOURS[i % PHASE_COLOURS.length];
  let arc = '';
  if (phases.length) {
    const ruler = phases
      .map(
        (p, i) =>
          `<button type="button" class="lxd-fx-dd-rseg" data-act="rseg" data-i="${i}" aria-controls="${uid}-ph-${i}"` +
          ` style="flex-grow:${Math.max(p.span.end - p.span.start, 0.6)};background:${colour(i)}"` +
          ` aria-label="${esc(`${p.weekLabel}: ${p.label}`)}">${esc(p.weekLabel)}</button>`,
      )
      .join('');
    const acc = phases
      .map(
        (p, i) =>
          `<div class="lxd-fx-dd-phase" data-i="${i}" style="--pc:${colour(i)}">` +
          `<h4 class="lxd-fx-dd-phh"><button type="button" class="lxd-fx-dd-phd" data-act="phase" data-i="${i}"` +
          ` aria-expanded="false" aria-controls="${uid}-ph-${i}">` +
          `<span class="lxd-fx-dd-pwk">${esc(p.weekLabel)}</span><span class="lxd-fx-dd-plab">${esc(p.label)}</span>` +
          `<span class="lxd-fx-dd-pchev" aria-hidden="true">&#9656;</span></button></h4>` +
          `<div class="lxd-fx-dd-pdetail" id="${uid}-ph-${i}" hidden>` +
          `<p class="lxd-fx-dd-what">${p.what}</p><p class="lxd-fx-dd-det">${p.detail}</p></div></div>`,
      )
      .join('');
    arc =
      `<div class="lxd-fx-dd-ruler" role="group" aria-label="Phases at a glance">${ruler}</div>` +
      `<p class="lxd-fx-dd-hint">The arc at a glance — select a band, or a phase below, to open it.</p>` +
      `<button type="button" class="lxd-fx-dd-all" data-act="all" aria-expanded="false">` +
      `<span class="lxd-fx-dd-all-t">Expand all phases</span></button>` +
      `<div class="lxd-fx-dd-phases">${acc}</div>`;
  }
  return (
    (meta ? `<p class="lxd-fx-dd-meta">${meta}</p>` : '') +
    (ex.problem ? `<div class="lxd-fx-dd-prob"><b>Problem of practice.</b> ${ex.problem}</div>` : '') +
    arc +
    (ex.impact
      ? `<div class="lxd-fx-dd-impact"><span class="lxd-fx-dd-il">How the teacher knew it worked</span><p>${ex.impact}</p></div>`
      : '')
  );
}

function indicatorsHTML(it, uid, tab) {
  const ind = it.indicators || {};
  const present = DD_INDICATORS.filter(([, field]) => (ind[field] || []).length);
  if (!present.length) return '';
  const sel = present.some(([k]) => k === tab) ? tab : present[0][0];
  const tabs = present
    .map(
      ([k, , label]) =>
        `<button type="button" role="tab" class="lxd-fx-dd-tab ${k}${k === sel ? ' on' : ''}" id="${uid}-tab-${k}"` +
        ` aria-controls="${uid}-tp-${k}" aria-selected="${k === sel}" tabindex="${k === sel ? 0 : -1}"` +
        ` data-act="tab" data-tab="${k}">${label}</button>`,
    )
    .join('');
  const panes = present
    .map(
      ([k, field, , lead]) =>
        `<div role="tabpanel" class="lxd-fx-dd-tabpane ${k}" id="${uid}-tp-${k}" aria-labelledby="${uid}-tab-${k}"` +
        ` data-tab="${k}" tabindex="0"${k === sel ? '' : ' hidden'}>` +
        `<p class="lxd-fx-dd-lead">${lead}</p><ul>${ind[field].map((t) => `<li>${t}</li>`).join('')}</ul></div>`,
    )
    .join('');
  return `<div class="lxd-fx-dd-tabs" role="tablist" aria-label="Indicators">${tabs}</div>${panes}`;
}

function continuumHTML(it, uid) {
  const levels = sortedLevels(it);
  if (!levels.length) return '';
  const nodes = levels
    .map(
      (c, i) =>
        `<button type="button" class="lxd-fx-dd-node l${Math.min(i + 1, 4)}" data-act="level" data-lv="${esc(c.level)}"` +
        ` aria-pressed="false" aria-controls="${uid}-cd"><span class="lxd-fx-dd-dot" aria-hidden="true"></span>` +
        `<span class="lxd-fx-dd-nlb"><span class="lxd-fx-dd-nlv">Level ${esc(c.level)}</span> ${esc(c.label)}</span></button>`,
    )
    .join('');
  return (
    `<div class="lxd-fx-dd-track" style="--n:${levels.length}"><div class="lxd-fx-dd-fill"></div>${nodes}</div>` +
    `<p class="lxd-fx-dd-cap">A faculty moves left to right over years — select a level to see what it looks like in science.</p>` +
    `<div class="lxd-fx-dd-cdetail" id="${uid}-cd" aria-live="polite"></div>`
  );
}

function evidenceHTML(it, items, byId) {
  const tr = it.transfer;
  const rel = (it.related || [])
    .map((id) => byId.get(id))
    .filter((i) => i !== undefined) // validator guarantees resolution at full-set build
    .map((i) => {
      const t = items[i];
      return `<button type="button" class="lxd-fx-dd-relchip" data-act="select" data-i="${i}">${esc(`${t.ordinal}. ${t.name}`)} <span aria-hidden="true">→</span></button>`;
    })
    .join('');
  const html =
    (tr && (tr.label || tr.text)
      ? `<div class="lxd-fx-dd-transfer">` +
        (tr.label ? `<p class="lxd-fx-dd-tl">${esc(tr.label)}</p>` : '') +
        (tr.text ? `<p>${tr.text}</p>` : '') +
        `</div>`
      : '') +
    (it.evidence ? `<p class="lxd-fx-dd-ev">${it.evidence}</p>` : '') +
    (rel ? `<div class="lxd-fx-dd-rel"><p class="lxd-fx-dd-rl">Works with</p>${rel}</div>` : '');
  return html;
}

// Build the context chips shown above an exemplar. A cross-context exemplar
// carries an authored `label` (one chip); a single-placement exemplar shows its
// controlled refs as separate chips, resolved to vocabulary labels.
function contextChips(ctx, labels) {
  const lbl = (id) => (labels && labels.get(id)) || prettyId(id);
  const out = [];
  if (ctx.label) out.push({ text: ctx.label });
  else {
    if (ctx.stage) out.push({ text: lbl(ctx.stage) });
    if (ctx.syllabus) out.push({ text: lbl(ctx.syllabus) });
    if (ctx.focusArea) out.push({ text: lbl(ctx.focusArea) });
  }
  if (ctx.duration) out.push({ text: ctx.duration, dur: true });
  return out;
}

// Fallback id → label prettifier when the vocabulary can't be resolved.
function prettyId(id) {
  return String(id)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── shell markup ────────────────────────────────────────────────────────────────
// Framework intro and footer (sources, CC BY attribution) are unchanged; the
// strategy switcher is built once, and the current strategy renders into
// .lxd-fx-dd-item.
function SHELL(fw, items, uid) {
  const sources = (fw.sources || []).map((s) => `<li>${s}</li>`).join('');
  const chips = items
    .map((it, i) => {
      const top = (it.badges || [])[0];
      return (
        `<button type="button" class="lxd-fx-dd-chip" data-act="select" data-i="${i}">` +
        `<span class="lxd-fx-dd-o">${esc(pad2(it.ordinal))}</span><span class="lxd-fx-dd-nm">${esc(it.name)}</span>` +
        (top ? `<span class="lxd-fx-dd-es">${esc(top.value || top.label)}</span>` : '') +
        `</button>`
      );
    })
    .join('');
  return `
  <div class="lxd-fx-wrap">
    ${fw.kicker ? `<p class="lxd-fx-kicker">${fw.kicker}</p>` : ''}
    <h1 class="lxd-fx-h1">${esc(fw.title)}</h1>
    ${fw.subtitle ? `<p class="lxd-fx-lede">${fw.subtitle}</p>` : ''}
    ${fw.thesis ? `<div class="lxd-fx-thesis">${fw.thesis}</div>` : ''}
    ${
      fw.usageNote
        ? `<details class="lxd-fx-note"><summary>How to use — and a note on jurisdictions</summary>
             <div class="lxd-fx-note-body">${fw.usageNote}</div></details>`
        : ''
    }

    <div class="lxd-fx-dd-switch">
      <div class="lxd-fx-dd-switch-head">
        <h2 class="lxd-fx-dd-sl" id="${uid}-sl">Choose a strategy</h2>
        <span>Effect sizes as reported in the source resource</span>
      </div>
      <div class="lxd-fx-dd-chips" role="group" aria-labelledby="${uid}-sl">${chips}</div>
    </div>

    <div class="lxd-fx-dd-item"></div>

    <div class="lxd-fx-footer">
      <h4>Sources</h4>
      <ul>${sources}</ul>
      ${fw.attribution ? `<p class="lxd-fx-attribution">${esc(fw.attribution)}</p>` : ''}
    </div>
  </div>`;
}

// ── scoped styles ────────────────────────────────────────────────────────────────
// Every selector is scoped to .lxd-fx.lxd-fx-dd, so a matrix or grid explorer on
// the same page is never restyled. Every custom property is defined on that root
// (not :root) and used with an inline fallback, so a theme that strips or
// overrides variables still degrades to legible colour.
const DEEPDIVE_STYLES = `
.lxd-fx.lxd-fx-dd{
  --fx-bg:#F2F0EA; --fx-card:#FFFFFF; --fx-card-sunk:#F6F4EF;
  --fx-ink:#19282F; --fx-body:#3B474F; --fx-muted:#636F77;
  --fx-line:#E2DDD2; --fx-line2:#D4CDBF; --fx-line-soft:#EAE6DD;
  --fx-accent:#1C4C5B; --fx-accent-soft:#E0EBEE; --fx-accent-line:#B7D0D6;
  --fx-pos:#2C6046; --fx-pos-soft:#E5EFE9;
  --fx-neg:#8B4232; --fx-neg-soft:#F4E7E2;
  --fx-stu:#3F4E86; --fx-stu-soft:#E8EAF4;
  --fx-gold:#A5822C; --fx-gold-text:#8A6D22;
  --fx-pc:#1C4C5B;
  --fx-serif:Georgia,"Times New Roman",serif;
  --fx-shadow:0 1px 2px rgba(25,40,47,.04);
  --fx-r:14px;
  --fx-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;
  display:block;
  background:var(--fx-bg,#F2F0EA);
  color:var(--fx-body,#3B474F);
  line-height:1.58;
  border-radius:var(--fx-r,14px);
  box-sizing:border-box;
}
.lxd-fx.lxd-fx-dd *,.lxd-fx.lxd-fx-dd *::before,.lxd-fx.lxd-fx-dd *::after{box-sizing:border-box;}
.lxd-fx.lxd-fx-dd h1,.lxd-fx.lxd-fx-dd h2,.lxd-fx.lxd-fx-dd .lxd-fx-dd-plab,.lxd-fx.lxd-fx-dd .lxd-fx-dd-mdname{font-family:var(--fx-serif);}
.lxd-fx.lxd-fx-dd .lxd-fx-wrap{max-width:1000px;margin:0 auto;padding:24px 22px 40px;}
.lxd-fx.lxd-fx-dd button{font:inherit;color:inherit;}
.lxd-fx.lxd-fx-dd button:focus-visible,.lxd-fx.lxd-fx-dd summary:focus-visible,.lxd-fx.lxd-fx-dd [tabindex]:focus-visible{outline:2.5px solid var(--fx-gold,#A5822C);outline-offset:2px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pbody,.lxd-fx.lxd-fx-dd .lxd-fx-dd-head,.lxd-fx.lxd-fx-dd .lxd-fx-lede,.lxd-fx.lxd-fx-dd .lxd-fx-note-body{overflow-wrap:anywhere;}

/* framework intro (unchanged content) */
.lxd-fx.lxd-fx-dd .lxd-fx-kicker{font-family:var(--fx-mono);font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--fx-accent,#1C4C5B);font-weight:600;margin:0 0 14px;}
.lxd-fx.lxd-fx-dd .lxd-fx-h1{font-weight:600;font-size:clamp(26px,4vw,38px);line-height:1.15;color:var(--fx-ink,#19282F);margin:0 0 16px;max-width:24ch;}
.lxd-fx.lxd-fx-dd .lxd-fx-lede{font-size:16.5px;max-width:68ch;margin:0 0 14px;}
.lxd-fx.lxd-fx-dd .lxd-fx-lede b{color:var(--fx-ink,#19282F);font-weight:600;}
.lxd-fx.lxd-fx-dd .lxd-fx-thesis{margin:22px 0 0;padding:18px 22px;background:var(--fx-ink,#19282F);color:#DCE4E8;border-radius:var(--fx-r,14px);font-size:16px;line-height:1.45;}
.lxd-fx.lxd-fx-dd .lxd-fx-thesis b{color:#FFFFFF;font-weight:600;}
.lxd-fx.lxd-fx-dd .lxd-fx-note{margin:14px 0 0;background:var(--fx-card,#FFFFFF);border:1px solid var(--fx-line,#E2DDD2);border-radius:var(--fx-r,14px);padding:2px 20px;box-shadow:var(--fx-shadow);}
.lxd-fx.lxd-fx-dd .lxd-fx-note summary{cursor:pointer;font-weight:600;color:var(--fx-ink,#19282F);padding:13px 0;min-height:44px;list-style:none;display:flex;align-items:center;gap:10px;font-size:15px;}
.lxd-fx.lxd-fx-dd .lxd-fx-note summary::-webkit-details-marker{display:none;}
.lxd-fx.lxd-fx-dd .lxd-fx-note summary::before{content:"+";width:20px;height:20px;border-radius:6px;background:var(--fx-accent-soft,#E0EBEE);color:var(--fx-accent,#1C4C5B);font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;}
.lxd-fx.lxd-fx-dd .lxd-fx-note[open] summary::before{content:"\\2212";}
.lxd-fx.lxd-fx-dd .lxd-fx-note-body{padding:0 0 18px 30px;font-size:15px;}
.lxd-fx.lxd-fx-dd .lxd-fx-note-body p{margin:0 0 11px;}
.lxd-fx.lxd-fx-dd .lxd-fx-note-body p:last-child{margin-bottom:0;}

/* strategy switcher */
.lxd-fx.lxd-fx-dd .lxd-fx-dd-switch{background:var(--fx-card,#FFFFFF);border:1px solid var(--fx-line,#E2DDD2);border-radius:var(--fx-r,14px);padding:12px;margin:28px 0 16px;box-shadow:var(--fx-shadow);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-switch-head{display:flex;align-items:baseline;justify-content:space-between;gap:4px 14px;flex-wrap:wrap;margin:2px 4px 10px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-sl{font-family:inherit;font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--fx-muted,#636F77);font-weight:700;margin:0;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-switch-head span{font-size:12px;color:var(--fx-muted,#636F77);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-chips{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-chip{min-width:0;min-height:44px;text-align:left;background:var(--fx-card-sunk,#F6F4EF);border:1.5px solid var(--fx-line,#E2DDD2);border-radius:10px;padding:9px 11px;cursor:pointer;transition:border-color .14s;display:flex;flex-direction:column;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-chip:hover{border-color:var(--fx-accent-line,#B7D0D6);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-chip.on{background:var(--fx-accent,#1C4C5B);border-color:var(--fx-accent,#1C4C5B);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-o{font-size:11px;font-weight:700;color:var(--fx-muted,#636F77);font-variant-numeric:tabular-nums;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-nm{font-size:12.5px;font-weight:600;color:var(--fx-ink,#19282F);line-height:1.2;margin-top:2px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-es{font-size:11px;color:var(--fx-muted,#636F77);margin-top:4px;font-variant-numeric:tabular-nums;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-chip.on .lxd-fx-dd-o{color:rgba(255,255,255,.75);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-chip.on .lxd-fx-dd-nm{color:#FFFFFF;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-chip.on .lxd-fx-dd-es{color:rgba(255,255,255,.8);}

/* header */
.lxd-fx.lxd-fx-dd .lxd-fx-dd-head{background:var(--fx-card,#FFFFFF);border:1px solid var(--fx-line,#E2DDD2);border-radius:var(--fx-r,14px);padding:22px 24px;margin-bottom:14px;box-shadow:var(--fx-shadow);scroll-margin-top:16px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-head:focus{outline:none;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-head:focus-visible{outline:2.5px solid var(--fx-gold,#A5822C);outline-offset:2px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-eye{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fx-gold-text,#8A6D22);font-weight:700;margin:0 0 8px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-name{font-size:28px;line-height:1.2;color:var(--fx-ink,#19282F);margin:0 0 10px;font-weight:600;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-hl{font-size:15.5px;margin:0 0 14px;max-width:72ch;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-badges{display:flex;gap:8px;flex-wrap:wrap;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-badge{font-size:12.5px;font-weight:600;padding:5px 11px;border-radius:7px;background:var(--fx-card-sunk,#F6F4EF);color:var(--fx-body,#3B474F);border:1px solid var(--fx-line,#E2DDD2);font-variant-numeric:tabular-nums;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-badge.hero{background:var(--fx-accent,#1C4C5B);color:#FFFFFF;border-color:var(--fx-accent,#1C4C5B);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-badge.mop{background:var(--fx-pos-soft,#E5EFE9);color:var(--fx-pos,#2C6046);border-color:#CBDED3;}

/* sticky section pills */
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pillslot{margin:0 0 16px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pillbar{background:#F2F0EA;background:rgba(242,240,234,.94);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:8px 0;border-bottom:1px solid var(--fx-line,#E2DDD2);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pillbar.pinned{position:fixed;z-index:1020;padding:8px 10px;box-shadow:0 2px 6px rgba(25,40,47,.08);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pills{display:flex;gap:7px;flex-wrap:wrap;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pill{min-height:44px;font-size:13px;font-weight:600;color:var(--fx-body,#3B474F);background:var(--fx-card,#FFFFFF);border:1.5px solid var(--fx-line,#E2DDD2);border-radius:999px;padding:8px 15px;cursor:pointer;transition:border-color .14s;white-space:nowrap;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pill:hover{border-color:var(--fx-accent-line,#B7D0D6);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pill.active{background:var(--fx-accent,#1C4C5B);border-color:var(--fx-accent,#1C4C5B);color:#FFFFFF;}

/* panels */
.lxd-fx.lxd-fx-dd .lxd-fx-dd-panel{background:var(--fx-card,#FFFFFF);border:1px solid var(--fx-line,#E2DDD2);border-radius:var(--fx-r,14px);overflow:hidden;box-shadow:var(--fx-shadow);margin-bottom:14px;scroll-margin-top:76px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-ph{font-family:inherit;font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:700;line-height:1.4;padding:11px 20px;margin:0;border-bottom:1px solid var(--fx-line,#E2DDD2);color:#FFFFFF;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-ph-faculty{background:var(--fx-accent,#1C4C5B);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-ph-exemplar{background:#2F6E6A;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-ph-indicators{background:var(--fx-stu,#3F4E86);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-ph-continuum{background:#356974;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-ph-evidence{background:#636F77;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pbody{padding:18px 20px;font-size:15px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pbody>p{margin:0 0 10px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pbody>p:last-child{margin-bottom:0;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pbody b{color:var(--fx-ink,#19282F);}

/* exemplar */
.lxd-fx.lxd-fx-dd .lxd-fx-dd-meta{font-size:12.5px;color:var(--fx-muted,#636F77);font-weight:600;margin:0 0 12px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-prob{background:var(--fx-card-sunk,#F6F4EF);border-left:3px solid var(--fx-accent-line,#B7D0D6);border-radius:0 8px 8px 0;padding:13px 16px;font-size:14.5px;color:var(--fx-ink,#19282F);margin-bottom:16px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-ruler{display:flex;height:36px;border-radius:7px;overflow:hidden;border:1px solid var(--fx-line,#E2DDD2);margin-bottom:6px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-rseg{min-width:0;flex-basis:0;border:none;border-right:1px solid rgba(255,255,255,.4);color:#FFFFFF;font-size:10.5px;font-weight:700;display:block;line-height:36px;text-align:center;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 4px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-rseg:last-child{border-right:none;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-rseg:hover{box-shadow:inset 0 -3px 0 rgba(255,255,255,.6);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-rseg.on{box-shadow:inset 0 -4px 0 #FFFFFF;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-rseg:focus-visible{outline-offset:-4px;outline-color:#FFFFFF;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-hint{font-size:12px;color:var(--fx-muted,#636F77);margin:0 0 8px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-all{min-height:44px;font-size:13px;color:var(--fx-accent,#1C4C5B);font-weight:600;cursor:pointer;background:none;border:none;padding:0 2px;margin-bottom:4px;text-decoration:underline;text-underline-offset:3px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-phase{border:1px solid var(--fx-line,#E2DDD2);border-left:3px solid var(--pc,#1C4C5B);border-radius:10px;margin-bottom:9px;overflow:hidden;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-phh{margin:0;font:inherit;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-phd{width:100%;min-height:48px;text-align:left;background:var(--fx-card,#FFFFFF);border:none;cursor:pointer;padding:11px 15px;display:flex;align-items:center;gap:12px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-phd:hover{background:var(--fx-card-sunk,#F6F4EF);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pwk{font-size:11px;font-weight:700;color:#FFFFFF;background:var(--pc,#1C4C5B);padding:3px 9px;border-radius:999px;white-space:nowrap;flex-shrink:0;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-plab{font-size:15.5px;color:var(--fx-ink,#19282F);font-weight:600;flex:1;min-width:0;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pchev{color:var(--fx-muted,#636F77);font-size:14px;transition:transform .18s;flex-shrink:0;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-phase.open .lxd-fx-dd-pchev{transform:rotate(90deg);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pdetail{padding:2px 15px 15px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-pdetail[hidden]{display:none;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-what{font-size:14.5px;color:var(--fx-ink,#19282F);font-weight:500;margin:0 0 7px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-det{font-size:14px;margin:0;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-impact{background:var(--fx-pos-soft,#E5EFE9);border:1px solid #CBDED3;border-radius:10px;padding:14px 17px;margin-top:12px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-il{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--fx-pos,#2C6046);font-weight:700;display:block;margin-bottom:6px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-impact p{margin:0;font-size:14px;color:var(--fx-ink,#19282F);}

/* indicator tabs */
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tabs{display:flex;gap:6px;margin-bottom:14px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tab{flex:1;min-width:0;min-height:44px;font-size:12.5px;font-weight:600;line-height:1.25;overflow-wrap:normal;word-break:normal;hyphens:manual;padding:9px 4px;border-radius:8px;border:1.5px solid var(--fx-line,#E2DDD2);background:var(--fx-card-sunk,#F6F4EF);cursor:pointer;color:var(--fx-body,#3B474F);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tab.on.t{background:var(--fx-pos-soft,#E5EFE9);border-color:var(--fx-pos,#2C6046);color:var(--fx-pos,#2C6046);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tab.on.n{background:var(--fx-neg-soft,#F4E7E2);border-color:var(--fx-neg,#8B4232);color:var(--fx-neg,#8B4232);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tab.on.s{background:var(--fx-stu-soft,#E8EAF4);border-color:var(--fx-stu,#3F4E86);color:var(--fx-stu,#3F4E86);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tabpane[hidden]{display:none;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-lead{font-size:13px;font-weight:700;margin:0 0 8px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tabpane.t .lxd-fx-dd-lead{color:var(--fx-pos,#2C6046);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tabpane.n .lxd-fx-dd-lead{color:var(--fx-neg,#8B4232);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tabpane.s .lxd-fx-dd-lead{color:var(--fx-stu,#3F4E86);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tabpane ul{margin:0;padding-left:17px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tabpane li{font-size:14px;margin-bottom:8px;}

/* continuum maturity track: dots are graphics only, the level is in the label */
.lxd-fx.lxd-fx-dd .lxd-fx-dd-track{position:relative;display:flex;margin:6px 0 16px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-track::before{content:"";position:absolute;left:calc(50% / var(--n,4));right:calc(50% / var(--n,4));top:20px;height:3px;background:var(--fx-line2,#D4CDBF);border-radius:2px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-fill{position:absolute;left:calc(50% / var(--n,4));top:20px;height:3px;width:0;background:var(--fx-accent,#1C4C5B);border-radius:2px;transition:width .25s ease;z-index:1;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-node{flex:1;min-width:0;position:relative;z-index:2;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:7px;padding:0 2px 4px;border-radius:10px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-dot{width:40px;height:40px;border-radius:50%;border:3px solid var(--fx-bg,#F2F0EA);transition:transform .16s,box-shadow .16s;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-node.l1 .lxd-fx-dd-dot{background:#9AA6AD;box-shadow:0 0 0 2px #5E6B73;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-node.l2 .lxd-fx-dd-dot{background:#5E8089;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-node.l3 .lxd-fx-dd-dot{background:#356974;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-node.l4 .lxd-fx-dd-dot{background:var(--fx-accent,#1C4C5B);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-node.active .lxd-fx-dd-dot{transform:scale(1.14);box-shadow:0 0 0 4px var(--fx-accent-soft,#E0EBEE);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-node.l1.active .lxd-fx-dd-dot{box-shadow:0 0 0 2px #5E6B73,0 0 0 6px var(--fx-accent-soft,#E0EBEE);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-nlb{font-size:12.5px;font-weight:600;color:var(--fx-muted,#636F77);text-align:center;line-height:1.25;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-nlv{display:block;font-size:11px;letter-spacing:.05em;text-transform:uppercase;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-node.active .lxd-fx-dd-nlb{color:var(--fx-ink,#19282F);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-cap{font-size:12px;color:var(--fx-muted,#636F77);text-align:center;margin:0 0 14px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-cdetail{background:var(--fx-card-sunk,#F6F4EF);border:1px solid var(--fx-line,#E2DDD2);border-radius:12px;padding:16px 20px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-mdh{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 10px;margin-bottom:8px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-mdlv{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#FFFFFF;padding:3px 9px;border-radius:6px;background:var(--fx-accent,#1C4C5B);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-mdname{font-size:18px;font-weight:600;color:var(--fx-ink,#19282F);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-cdetail p{margin:0;font-size:15px;}

/* evidence & transfer */
.lxd-fx.lxd-fx-dd .lxd-fx-dd-transfer{border:1px dashed var(--fx-line2,#D4CDBF);border-radius:10px;padding:14px 17px;margin-bottom:14px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-tl{font-size:13px;font-weight:700;color:var(--fx-accent,#1C4C5B);margin:0 0 6px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-transfer p:last-child{margin:0;font-size:14px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-ev{font-size:13.5px;color:var(--fx-muted,#636F77);}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-rel{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-rl{width:100%;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--fx-muted,#636F77);font-weight:700;margin:0 0 2px;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-relchip{min-height:44px;font-size:13px;font-weight:600;color:var(--fx-accent,#1C4C5B);border:1.5px solid var(--fx-accent-line,#B7D0D6);border-radius:999px;padding:6px 14px;background:var(--fx-card,#FFFFFF);cursor:pointer;}
.lxd-fx.lxd-fx-dd .lxd-fx-dd-relchip:hover{background:var(--fx-accent-soft,#E0EBEE);}

/* footer (unchanged content) */
.lxd-fx.lxd-fx-dd .lxd-fx-footer{margin-top:36px;padding-top:22px;border-top:1px solid var(--fx-line2,#D4CDBF);font-size:13.5px;color:var(--fx-muted,#636F77);}
.lxd-fx.lxd-fx-dd .lxd-fx-footer h4{font-family:var(--fx-mono);font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--fx-body,#3B474F);margin:0 0 10px;}
.lxd-fx.lxd-fx-dd .lxd-fx-footer ul{margin:0 0 14px;padding-left:18px;}
.lxd-fx.lxd-fx-dd .lxd-fx-footer li{margin-bottom:6px;}
.lxd-fx.lxd-fx-dd .lxd-fx-attribution{margin:0;}

@media(max-width:780px){
  .lxd-fx.lxd-fx-dd .lxd-fx-wrap{padding:18px 14px 32px;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-chips{grid-template-columns:repeat(2,minmax(0,1fr));}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-pills{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-pill{flex:0 0 auto;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-head{padding:18px;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-name{font-size:24px;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-pbody{padding:16px;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-rseg{font-size:9.5px;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-nlb{font-size:11px;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-dot{width:34px;height:34px;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-track::before,.lxd-fx.lxd-fx-dd .lxd-fx-dd-fill{top:17px;}
  .lxd-fx.lxd-fx-dd .lxd-fx-dd-tab{font-size:11.5px;}
}
@media(prefers-reduced-motion:reduce){
  .lxd-fx.lxd-fx-dd *,.lxd-fx.lxd-fx-dd *::before,.lxd-fx.lxd-fx-dd *::after{transition:none !important;scroll-behavior:auto !important;}
}
`;


// ── matrix view (metacognition shape) ────────────────────────────────────────────
// Column tree: stage → syllabus area → topic; rows: teaching habits grouped by
// self-regulation phase. A topic × habit resolves to a cell (goal/script/why/
// evidence) over the topic's shared science summary. Adding this view required
// no change to the core above the VIEWS registry — the seam holds (§9 step 6).
async function loadMatrix(dir, fw) {
  if (!fw.matrix) throw new Error('framework has no matrix manifest');
  const [habits, stages, cells] = await Promise.all([
    fetchJson(dir + fw.matrix.habits),
    fetchJson(dir + fw.matrix.contexts),
    fetchJson(dir + fw.matrix.cells),
  ]);
  return { habits, stages, cells };
}

// A topic with review.published false is an unreviewed draft. Without showDrafts
// it is removed, and so is any area or stage left with nothing in it, so the
// published view is unchanged by drafts sitting in the data.
const isDraftTopic = (t) => !!t.review && t.review.published !== true;
function visibleStages(stages, showDrafts) {
  if (showDrafts) return stages;
  return stages
    .map((st) => ({
      ...st,
      areas: st.areas
        .map((a) => ({ ...a, topics: a.topics.filter((t) => !isDraftTopic(t)) }))
        .filter((a) => a.topics.length),
    }))
    .filter((st) => st.areas.length);
}

function renderMatrix(mount, fw, { habits, stages: allStages, cells }, { showDrafts = false } = {}) {
  const stages = visibleStages(allStages, showDrafts);
  injectStyles('lxd-fx-mx-styles', MATRIX_STYLES);
  mount.className = 'lxd-fx lxd-fx-mx';
  mount.innerHTML = MATRIX_SHELL(fw);
  const $ = (sel) => mount.querySelector(sel);

  const cellOf = new Map(cells.map((c) => [`${c.topicId}×${c.habitId}`, c]));
  const habitById = new Map(habits.map((h) => [h.id, h]));
  const state = { s: 0, a: 0, t: 0, habit: habits[0] && habits[0].id, scanOpen: false }; // in-memory only

  const curStage = () => stages[state.s];
  const curArea = () => curStage().areas[state.a];
  const curTopic = () => curArea().topics[state.t];

  function segBtn(label, sub, on) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lxd-fx-mx-seg' + (on ? ' on' : '');
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = esc(label) + (sub ? `<span class="sub">${esc(sub)}</span>` : '');
    return b;
  }

  function renderStages() {
    const seg = $('.lxd-fx-mx-stages');
    seg.innerHTML = '';
    stages.forEach((st, i) => {
      const b = segBtn(st.label, st.sub, i === state.s);
      b.addEventListener('click', () => {
        state.s = i;
        state.a = 0;
        state.t = 0;
        renderAll();
      });
      seg.appendChild(b);
    });
  }

  function renderAreas() {
    const seg = $('.lxd-fx-mx-areas');
    seg.innerHTML = '';
    curStage().areas.forEach((a, i) => {
      const b = segBtn(a.label, a.sub, i === state.a);
      b.addEventListener('click', () => {
        state.a = i;
        state.t = 0;
        renderAll();
      });
      seg.appendChild(b);
    });
  }

  function renderTopics() {
    const grid = $('.lxd-fx-mx-topics');
    grid.innerHTML = '';
    curArea().topics.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lxd-fx-mx-topic' + (i === state.t ? ' on' : '');
      b.setAttribute('aria-pressed', String(i === state.t));
      const typeClass = t.type === 'skill' ? 'type-skill' : 'type-concept';
      const typeLabel = t.type === 'skill' ? 'Science skill' : 'Content concept';
      b.innerHTML =
        `<div class="lxd-fx-mx-tname">${esc(t.name)}</div>` +
        (t.tag ? `<div class="lxd-fx-mx-ttag">${esc(t.tag)}</div>` : '') +
        `<span class="lxd-fx-mx-ttype ${typeClass}">${typeLabel}</span>` +
        (isDraftTopic(t) ? '<span class="lxd-fx-mx-ttype type-draft">Draft · not reviewed</span>' : '');
      b.addEventListener('click', () => {
        state.t = i;
        renderResult();
        closeScan();
      });
      grid.appendChild(b);
    });
  }

  function renderHabits() {
    const rail = $('.lxd-fx-mx-habits');
    rail.innerHTML = '';
    habits.forEach((h) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lxd-fx-mx-habit' + (h.id === state.habit ? ' on' : '');
      b.setAttribute('aria-pressed', String(h.id === state.habit));
      b.title = h.definition;
      b.innerHTML = `<span class="lxd-fx-mx-pip pip-${esc(h.category)}"></span>${esc(h.name)}`;
      b.addEventListener('click', () => {
        state.habit = h.id;
        renderHabits();
        renderResult();
        closeScan();
      });
      rail.appendChild(b);
    });
  }

  function renderResult() {
    const t = curTopic();
    const h = habitById.get(state.habit);
    const cell = cellOf.get(`${t.id}×${state.habit}`);
    $('.lxd-fx-mx-crumb').innerHTML =
      `${esc(curStage().label)} › ${esc(curArea().label)} › <b>${esc(t.name)}</b>`;
    $('.lxd-fx-mx-combo').innerHTML =
      `Teaching <b>${esc(t.name)}</b> — embedding <span class="hl">“${esc(h.name)}”</span>`;
    $('.lxd-fx-mx-sci').innerHTML = t.sci;
    $('.lxd-fx-mx-goal').innerHTML = cell ? cell.goal : '';
    $('.lxd-fx-mx-script').innerHTML = cell ? cell.script : '';
    $('.lxd-fx-mx-why').innerHTML = cell ? cell.why : '';
    $('.lxd-fx-mx-ev').innerHTML = cell ? cell.evidence : '';
    $('.lxd-fx-mx-scanbtn').textContent = `See all ${habits.length} habits for “${t.name}” →`;
  }

  function closeScan() {
    const l = $('.lxd-fx-mx-scanlist');
    l.hidden = true;
    l.innerHTML = '';
    state.scanOpen = false;
  }

  function renderScan() {
    const l = $('.lxd-fx-mx-scanlist');
    if (state.scanOpen) return closeScan();
    const t = curTopic();
    l.innerHTML = '';
    habits.forEach((h) => {
      const cell = cellOf.get(`${t.id}×${h.id}`);
      if (!cell) return;
      const row = document.createElement('div');
      row.className = 'lxd-fx-mx-scanrow';
      row.innerHTML =
        `<div class="lxd-fx-mx-scanhead"><span class="n">${esc(h.name)}</span>` +
        `<span class="c">${esc(h.category)} · goal</span>` +
        `<span class="g">${esc(cell.goal)}</span></div>` +
        `<div class="lxd-fx-mx-scanbody"><span class="say">“${esc(cell.script)}”</span>` +
        `<div class="w">${cell.why}</div></div>`;
      l.appendChild(row);
    });
    l.hidden = false;
    state.scanOpen = true;
  }

  function renderAll() {
    renderStages();
    renderAreas();
    renderTopics();
    renderHabits();
    renderResult();
    closeScan();
  }

  $('.lxd-fx-mx-scanbtn').addEventListener('click', renderScan);
  renderAll();
}

function MATRIX_SHELL(fw) {
  const sources = (fw.sources || []).map((s) => `<li>${s}</li>`).join('');
  const step = (n, title, sub) =>
    `<div class="lxd-fx-mx-stephead"><span class="lxd-fx-mx-stepnum">${n}</span>` +
    `<span class="lxd-fx-mx-steptitle">${esc(title)}</span></div>` +
    (sub ? `<p class="lxd-fx-mx-stepsub">${sub}</p>` : '');
  return `
  <div class="lxd-fx-mx-page">
    ${fw.kicker ? `<p class="lxd-fx-mx-kicker">${fw.kicker}</p>` : ''}
    <h1 class="lxd-fx-mx-h1">${esc(fw.title)}</h1>
    ${fw.subtitle ? `<p class="lxd-fx-mx-lede">${fw.subtitle}</p>` : ''}
    <div class="lxd-fx-mx-legend">
      <span><span class="lxd-fx-mx-dot sci"></span> The science being taught</span>
      <span><span class="lxd-fx-mx-dot meta"></span> The thinking habit being built</span>
    </div>
    ${
      fw.usageNote
        ? `<details class="lxd-fx-mx-about"><summary>Why keep these two things separate?</summary>
             <div class="lxd-fx-mx-about-body">${fw.usageNote}</div></details>`
        : ''
    }

    ${step('1', 'Choose a stage', '')}
    <div class="lxd-fx-mx-seg-wrap"><div class="lxd-fx-mx-stages" role="group" aria-label="Choose a stage"></div></div>

    ${step('2', 'Choose a syllabus area', 'Pick the focus area or module you’re planning.')}
    <div class="lxd-fx-mx-seg-wrap"><div class="lxd-fx-mx-areas" role="group" aria-label="Choose a syllabus area"></div></div>

    ${step('3', 'Choose a topic', 'Two kinds appear: <b>content concepts</b> and <b>science skills</b>. Metacognition can be built on either.')}
    <div class="lxd-fx-mx-topics-wrap"><div class="lxd-fx-mx-topics"></div></div>

    ${step('4', 'Choose a teaching habit', fw.helperText ? esc(fw.helperText) : '')}
    <div class="lxd-fx-mx-habits-wrap">
      <div class="lxd-fx-mx-habits" role="group" aria-label="Choose a teaching habit"></div>
      <div class="lxd-fx-mx-catkey">
        <span><span class="lxd-fx-mx-pip pip-planning"></span> Planning</span>
        <span><span class="lxd-fx-mx-pip pip-monitoring"></span> Monitoring</span>
        <span><span class="lxd-fx-mx-pip pip-evaluating"></span> Evaluating</span>
      </div>
    </div>

    <div class="lxd-fx-mx-result">
      <div class="lxd-fx-mx-result-head">
        <div class="lxd-fx-mx-crumb"></div>
        <div class="lxd-fx-mx-combo"></div>
      </div>
      <div class="lxd-fx-mx-split">
        <div class="lxd-fx-mx-cell sci">
          <span class="lxd-fx-mx-celllabel">The science</span>
          <p class="lxd-fx-mx-sci"></p>
        </div>
        <div class="lxd-fx-mx-cell meta">
          <span class="lxd-fx-mx-celllabel">The metacognitive goal</span>
          <p class="lxd-fx-mx-goal"></p>
        </div>
      </div>
      <div class="lxd-fx-mx-move">
        <span class="lxd-fx-mx-movelabel">The teaching move in this lesson</span>
        <div class="lxd-fx-mx-scriptbox"><span class="lxd-fx-mx-script"></span></div>
        <p class="lxd-fx-mx-why"></p>
        <p class="lxd-fx-mx-ev"></p>
      </div>
    </div>

    <div class="lxd-fx-mx-scan">
      <button class="lxd-fx-mx-scanbtn" type="button">See all habits for this topic →</button>
      <div class="lxd-fx-mx-scanlist" hidden></div>
    </div>

    <div class="lxd-fx-mx-footer">
      <h4>Sources</h4>
      <ul>${sources}</ul>
      ${fw.attribution ? `<p>${esc(fw.attribution)}</p>` : ''}
    </div>
  </div>`;
}

// Scoped matrix styles. Same §7 rules as deep-dive: everything under .lxd-fx,
// custom properties on the root, inline colour fallbacks, no external fonts,
// no storage, focus + reduced-motion preserved.
const MATRIX_STYLES = `
.lxd-fx.lxd-fx-mx{
  --mx-bg:#F3F1EC; --mx-panel:#FFFFFF; --mx-ink:#182028; --mx-body:#3A454E; --mx-muted:#79838C;
  --mx-border:#E1DCD1; --mx-border-strong:#CFC7B7;
  --mx-sci:#215E56; --mx-sci-bg:#E4EEEB; --mx-sci-line:#B6D2CA;
  --mx-meta:#8A4A12; --mx-meta-bg:#F5E7D5; --mx-meta-line:#E3C79E;
  --mx-plan:#3C6E8F; --mx-monitor:#8A6D1F; --mx-evaluate:#7A4477;
  --mx-gold:#A9842B;
  --mx-shadow:0 1px 2px rgba(24,32,40,.05), 0 8px 24px rgba(24,32,40,.06);
  --mx-r:16px;
  --mx-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;
  color:var(--mx-body,#3A454E); line-height:1.55; box-sizing:border-box;
}
.lxd-fx.lxd-fx-mx *,.lxd-fx.lxd-fx-mx *::before,.lxd-fx.lxd-fx-mx *::after{box-sizing:border-box;}
.lxd-fx-mx .lxd-fx-mx-page{max-width:1080px;margin:0 auto;padding:8px 4px 40px;}

.lxd-fx-mx .lxd-fx-mx-kicker{font-family:var(--mx-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--mx-gold,#A9842B);font-weight:600;margin:0 0 14px;}
.lxd-fx-mx .lxd-fx-mx-h1{font-weight:700;font-size:clamp(28px,4.6vw,44px);line-height:1.08;color:var(--mx-ink,#182028);margin:0 0 18px;letter-spacing:-.01em;max-width:20ch;}
.lxd-fx-mx .lxd-fx-mx-lede{font-size:18px;max-width:66ch;color:var(--mx-body,#3A454E);margin:0 0 8px;}
.lxd-fx-mx .lxd-fx-mx-lede b{color:var(--mx-ink,#182028);font-weight:600;}
.lxd-fx-mx .lxd-fx-mx-legend{display:flex;gap:22px;flex-wrap:wrap;margin:22px 0 0;font-size:14px;}
.lxd-fx-mx .lxd-fx-mx-legend span{display:inline-flex;align-items:center;gap:8px;font-weight:500;}
.lxd-fx-mx .lxd-fx-mx-dot{width:11px;height:11px;border-radius:3px;display:inline-block;}
.lxd-fx-mx .lxd-fx-mx-dot.sci{background:var(--mx-sci,#215E56);}
.lxd-fx-mx .lxd-fx-mx-dot.meta{background:var(--mx-meta,#8A4A12);}

.lxd-fx-mx .lxd-fx-mx-about{margin:20px 0 0;background:var(--mx-panel,#FFFFFF);border:1px solid var(--mx-border,#E1DCD1);border-radius:var(--mx-r,16px);box-shadow:var(--mx-shadow);padding:2px 20px;}
.lxd-fx-mx .lxd-fx-mx-about summary{cursor:pointer;font-weight:600;color:var(--mx-ink,#182028);padding:15px 0;list-style:none;display:flex;align-items:center;gap:10px;font-size:15px;}
.lxd-fx-mx .lxd-fx-mx-about summary::-webkit-details-marker{display:none;}
.lxd-fx-mx .lxd-fx-mx-about summary::before{content:"+";width:20px;height:20px;border-radius:6px;background:var(--mx-meta-bg,#F5E7D5);color:var(--mx-meta,#8A4A12);font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
.lxd-fx-mx .lxd-fx-mx-about[open] summary::before{content:"\\2212";}
.lxd-fx-mx .lxd-fx-mx-about-body{padding:0 0 18px 30px;font-size:15px;}
.lxd-fx-mx .lxd-fx-mx-about-body p{margin:0 0 11px;}
.lxd-fx-mx .lxd-fx-mx-about-body b{color:var(--mx-ink,#182028);}

.lxd-fx-mx .lxd-fx-mx-stephead{display:flex;align-items:baseline;gap:12px;margin:44px 0 6px;}
.lxd-fx-mx .lxd-fx-mx-stepnum{font-family:var(--mx-mono);font-size:13px;font-weight:600;color:var(--mx-panel,#FFFFFF);background:var(--mx-ink,#182028);width:26px;height:26px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transform:translateY(3px);}
.lxd-fx-mx .lxd-fx-mx-steptitle{font-size:22px;font-weight:700;color:var(--mx-ink,#182028);}
.lxd-fx-mx .lxd-fx-mx-stepsub{font-size:14.5px;color:var(--mx-muted,#79838C);margin:2px 0 16px 38px;max-width:64ch;}
.lxd-fx-mx .lxd-fx-mx-stepsub b{color:var(--mx-body,#3A454E);}
.lxd-fx-mx .lxd-fx-mx-seg-wrap,.lxd-fx-mx .lxd-fx-mx-topics-wrap,.lxd-fx-mx .lxd-fx-mx-habits-wrap{margin-left:38px;}

.lxd-fx-mx .lxd-fx-mx-stages,.lxd-fx-mx .lxd-fx-mx-areas{display:flex;gap:8px;flex-wrap:wrap;}
.lxd-fx-mx .lxd-fx-mx-seg{font-size:14.5px;font-weight:600;color:var(--mx-body,#3A454E);background:var(--mx-panel,#FFFFFF);border:1.5px solid var(--mx-border,#E1DCD1);border-radius:11px;padding:11px 18px;cursor:pointer;box-shadow:var(--mx-shadow);transition:.14s;text-align:left;}
.lxd-fx-mx .lxd-fx-mx-seg .sub{display:block;font-weight:400;font-size:12px;color:var(--mx-muted,#79838C);margin-top:2px;font-family:var(--mx-mono);letter-spacing:.02em;}
.lxd-fx-mx .lxd-fx-mx-seg:hover{border-color:var(--mx-sci-line,#B6D2CA);}
.lxd-fx-mx .lxd-fx-mx-seg.on{border-color:var(--mx-sci,#215E56);background:var(--mx-sci-bg,#E4EEEB);color:var(--mx-sci,#215E56);}
.lxd-fx-mx .lxd-fx-mx-seg.on .sub{color:var(--mx-sci,#215E56);}

.lxd-fx-mx .lxd-fx-mx-topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:10px;}
.lxd-fx-mx .lxd-fx-mx-topic{text-align:left;background:var(--mx-panel,#FFFFFF);border:1.5px solid var(--mx-border,#E1DCD1);border-radius:12px;padding:13px 15px;cursor:pointer;box-shadow:var(--mx-shadow);transition:.14s;color:inherit;font:inherit;}
.lxd-fx-mx .lxd-fx-mx-topic:hover{border-color:var(--mx-sci-line,#B6D2CA);}
.lxd-fx-mx .lxd-fx-mx-topic.on{border-color:var(--mx-sci,#215E56);box-shadow:0 0 0 3px var(--mx-sci-bg,#E4EEEB),var(--mx-shadow);}
.lxd-fx-mx .lxd-fx-mx-tname{font-weight:600;color:var(--mx-ink,#182028);font-size:15px;line-height:1.25;}
.lxd-fx-mx .lxd-fx-mx-ttag{font-family:var(--mx-mono);font-size:11px;color:var(--mx-muted,#79838C);margin-top:5px;letter-spacing:.02em;}
.lxd-fx-mx .lxd-fx-mx-ttype{display:inline-block;font-size:10.5px;font-weight:600;font-family:var(--mx-mono);text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:999px;margin-top:8px;}
.lxd-fx-mx .lxd-fx-mx-ttype.type-concept{background:#EBE7DD;color:#6E6552;}
.lxd-fx-mx .lxd-fx-mx-ttype.type-skill{background:#E5EDEA;color:var(--mx-sci,#215E56);}
.lxd-fx-mx .lxd-fx-mx-ttype.type-draft{background:#F5E7D5;color:#7A3F0F;margin-left:6px;}

.lxd-fx-mx .lxd-fx-mx-habits{display:flex;gap:8px;flex-wrap:wrap;}
.lxd-fx-mx .lxd-fx-mx-habit{font-size:14px;font-weight:600;color:var(--mx-ink,#182028);background:var(--mx-panel,#FFFFFF);border:1.5px solid var(--mx-border,#E1DCD1);border-radius:999px;padding:9px 16px;cursor:pointer;box-shadow:var(--mx-shadow);transition:.14s;display:flex;align-items:center;gap:8px;}
.lxd-fx-mx .lxd-fx-mx-habit:hover{border-color:var(--mx-meta-line,#E3C79E);}
.lxd-fx-mx .lxd-fx-mx-habit.on{border-color:var(--mx-meta,#8A4A12);background:var(--mx-meta-bg,#F5E7D5);color:var(--mx-meta,#8A4A12);}
.lxd-fx-mx .lxd-fx-mx-pip{width:8px;height:8px;border-radius:999px;flex-shrink:0;display:inline-block;}
.lxd-fx-mx .lxd-fx-mx-pip.pip-planning{background:var(--mx-plan,#3C6E8F);}
.lxd-fx-mx .lxd-fx-mx-pip.pip-monitoring{background:var(--mx-monitor,#8A6D1F);}
.lxd-fx-mx .lxd-fx-mx-pip.pip-evaluating{background:var(--mx-evaluate,#7A4477);}
.lxd-fx-mx .lxd-fx-mx-catkey{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0 0;font-size:12.5px;color:var(--mx-muted,#79838C);font-family:var(--mx-mono);}
.lxd-fx-mx .lxd-fx-mx-catkey span{display:inline-flex;align-items:center;gap:6px;}

.lxd-fx-mx .lxd-fx-mx-result{margin:26px 0 0;background:var(--mx-panel,#FFFFFF);border:1px solid var(--mx-border,#E1DCD1);border-radius:var(--mx-r,16px);box-shadow:var(--mx-shadow);overflow:hidden;}
.lxd-fx-mx .lxd-fx-mx-result-head{padding:20px 26px 16px;border-bottom:1px solid var(--mx-border,#E1DCD1);background:linear-gradient(180deg,#FCFBF8,#F6F4EF);}
.lxd-fx-mx .lxd-fx-mx-crumb{font-family:var(--mx-mono);font-size:12px;color:var(--mx-muted,#79838C);letter-spacing:.03em;margin-bottom:10px;}
.lxd-fx-mx .lxd-fx-mx-crumb b{color:var(--mx-sci,#215E56);font-weight:600;}
.lxd-fx-mx .lxd-fx-mx-combo{font-size:20px;font-weight:700;color:var(--mx-ink,#182028);line-height:1.25;}
.lxd-fx-mx .lxd-fx-mx-combo .hl{color:var(--mx-meta,#8A4A12);}
.lxd-fx-mx .lxd-fx-mx-split{display:grid;grid-template-columns:1fr 1fr;}
.lxd-fx-mx .lxd-fx-mx-cell{padding:20px 26px;}
.lxd-fx-mx .lxd-fx-mx-cell.sci{background:var(--mx-sci-bg,#E4EEEB);border-right:1px solid var(--mx-border,#E1DCD1);}
.lxd-fx-mx .lxd-fx-mx-cell.meta{background:var(--mx-meta-bg,#F5E7D5);}
.lxd-fx-mx .lxd-fx-mx-celllabel{font-family:var(--mx-mono);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;display:block;margin-bottom:8px;}
.lxd-fx-mx .lxd-fx-mx-cell.sci .lxd-fx-mx-celllabel{color:var(--mx-sci,#215E56);}
.lxd-fx-mx .lxd-fx-mx-cell.meta .lxd-fx-mx-celllabel{color:var(--mx-meta,#8A4A12);}
.lxd-fx-mx .lxd-fx-mx-cell p{margin:0;font-size:15.5px;color:var(--mx-ink,#182028);font-weight:500;line-height:1.45;}
.lxd-fx-mx .lxd-fx-mx-move{padding:22px 26px;border-top:1px solid var(--mx-border,#E1DCD1);}
.lxd-fx-mx .lxd-fx-mx-movelabel{font-family:var(--mx-mono);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mx-muted,#79838C);display:block;margin-bottom:12px;}
.lxd-fx-mx .lxd-fx-mx-scriptbox{background:#FBF9F4;border-left:3px solid var(--mx-meta-line,#E3C79E);border-radius:0 10px 10px 0;padding:14px 18px;margin:0 0 16px;font-size:15.5px;color:var(--mx-ink,#182028);}
.lxd-fx-mx .lxd-fx-mx-script{font-style:italic;font-size:16px;}
.lxd-fx-mx .lxd-fx-mx-why{margin:0;font-size:14.5px;color:var(--mx-body,#3A454E);}
.lxd-fx-mx .lxd-fx-mx-why b{color:var(--mx-ink,#182028);font-weight:600;}
.lxd-fx-mx .lxd-fx-mx-ev{margin-top:14px;font-size:12.5px;color:var(--mx-muted,#79838C);font-family:var(--mx-mono);letter-spacing:.01em;padding-top:12px;border-top:1px dashed var(--mx-border,#E1DCD1);}

.lxd-fx-mx .lxd-fx-mx-scan{margin:22px 0 0;text-align:center;}
.lxd-fx-mx .lxd-fx-mx-scanbtn{font-size:14px;font-weight:600;color:var(--mx-meta,#8A4A12);background:none;border:1.5px solid var(--mx-meta-line,#E3C79E);border-radius:999px;padding:11px 22px;cursor:pointer;transition:.14s;}
.lxd-fx-mx .lxd-fx-mx-scanbtn:hover{background:var(--mx-meta-bg,#F5E7D5);}
.lxd-fx-mx .lxd-fx-mx-scanlist{margin-top:16px;display:grid;gap:9px;text-align:left;}
.lxd-fx-mx .lxd-fx-mx-scanrow{background:var(--mx-panel,#FFFFFF);border:1px solid var(--mx-border,#E1DCD1);border-radius:12px;padding:14px 18px;display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:start;}
.lxd-fx-mx .lxd-fx-mx-scanhead{display:flex;flex-direction:column;gap:5px;}
.lxd-fx-mx .lxd-fx-mx-scanhead .n{font-weight:700;color:var(--mx-meta,#8A4A12);font-size:14px;}
.lxd-fx-mx .lxd-fx-mx-scanhead .c{font-family:var(--mx-mono);font-size:11px;color:var(--mx-muted,#79838C);}
.lxd-fx-mx .lxd-fx-mx-scanhead .g{font-size:13px;color:var(--mx-body,#3A454E);}
.lxd-fx-mx .lxd-fx-mx-scanbody{font-size:14px;color:var(--mx-body,#3A454E);}
.lxd-fx-mx .lxd-fx-mx-scanbody .say{font-style:italic;color:var(--mx-ink,#182028);}
.lxd-fx-mx .lxd-fx-mx-scanbody .w{margin-top:8px;}

.lxd-fx-mx .lxd-fx-mx-footer{margin-top:56px;padding-top:22px;border-top:1px solid var(--mx-border-strong,#CFC7B7);font-size:13px;color:var(--mx-muted,#79838C);}
.lxd-fx-mx .lxd-fx-mx-footer h4{font-family:var(--mx-mono);font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--mx-body,#3A454E);margin:0 0 10px;}
.lxd-fx-mx .lxd-fx-mx-footer ul{margin:0 0 12px;padding-left:18px;}
.lxd-fx-mx .lxd-fx-mx-footer li{margin-bottom:5px;}
.lxd-fx-mx .lxd-fx-mx-footer p{margin:0;}

.lxd-fx-mx button:focus-visible,.lxd-fx-mx summary:focus-visible{outline:2.5px solid var(--mx-gold,#A9842B);outline-offset:2px;}

@media(max-width:760px){
  .lxd-fx-mx .lxd-fx-mx-split{grid-template-columns:1fr;}
  .lxd-fx-mx .lxd-fx-mx-cell.sci{border-right:none;border-bottom:1px solid var(--mx-border,#E1DCD1);}
  .lxd-fx-mx .lxd-fx-mx-scanrow{grid-template-columns:1fr;gap:8px;}
  .lxd-fx-mx .lxd-fx-mx-stepsub,.lxd-fx-mx .lxd-fx-mx-seg-wrap,.lxd-fx-mx .lxd-fx-mx-topics-wrap,.lxd-fx-mx .lxd-fx-mx-habits-wrap{margin-left:0;}
}
@media(prefers-reduced-motion:reduce){.lxd-fx-mx *{transition:none !important;}}
`;

// ── grid view (lighter matrix — "starter" metacognition) ─────────────────────────────────────────────────────────────
// Two axes (science contexts × teaching habits) resolving to a cell of three
// fields. Adding this view required no change to the core above the VIEWS
// registry — the seam holds (handoff §9 step 6).
async function loadGrid(dir, fw) {
  if (!fw.grid) throw new Error('framework has no grid manifest');
  const [habits, contexts, cells] = await Promise.all([
    fetchJson(dir + fw.grid.habits),
    fetchJson(dir + fw.grid.contexts),
    fetchJson(dir + fw.grid.cells),
  ]);
  return { habits, contexts, cells };
}

function renderGrid(mount, fw, { habits, contexts, cells }) {
  injectStyles('lxd-fx-gr-styles', GRID_STYLES);
  mount.className = 'lxd-fx lxd-fx-gr';
  mount.innerHTML = GRID_SHELL(fw);
  const $ = (sel) => mount.querySelector(sel);

  const cellOf = new Map(cells.map((c) => [`${c.contextId}×${c.habitId}`, c]));
  const state = { context: contexts[0]?.id, habit: habits[0]?.id, scanOpen: false }; // in-memory only

  function renderContexts() {
    const grid = $('.lxd-fx-gr-contexts');
    grid.innerHTML = '';
    contexts.forEach((c) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'lxd-fx-gr-ctx' + (c.id === state.context ? ' active' : '');
      card.setAttribute('aria-pressed', String(c.id === state.context));
      const typeLabel = c.type === 'concept' ? 'Content concept' : 'Science skill';
      card.innerHTML =
        `<div class="lxd-fx-gr-badges"><span class="lxd-fx-gr-badge type">${esc(typeLabel)}</span>` +
        `<span class="lxd-fx-gr-badge stage">${esc(c.label || c.stage)}</span></div>` +
        `<h3>${esc(c.name)}</h3><p class="lxd-fx-gr-blurb">${esc(c.blurb)}</p>` +
        `<details><summary></summary><p class="lxd-fx-gr-why">${esc(c.whyHard)}</p></details>`;
      card.querySelector('summary').addEventListener('click', (e) => e.stopPropagation());
      card.addEventListener('click', () => {
        state.context = c.id;
        closeScan();
        renderAll();
      });
      grid.appendChild(card);
    });
  }

  function renderHabits() {
    const wrap = $('.lxd-fx-gr-habits');
    wrap.innerHTML = '';
    habits.forEach((h) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'lxd-fx-gr-chip' + (h.id === state.habit ? ' active' : '');
      chip.setAttribute('aria-pressed', String(h.id === state.habit));
      chip.textContent = h.name;
      chip.addEventListener('mouseenter', () => showHabitHelper(h));
      chip.addEventListener('mouseleave', () => showHabitHelper(byHabit(state.habit)));
      chip.addEventListener('click', () => {
        state.habit = h.id;
        closeScan();
        renderAll();
      });
      wrap.appendChild(chip);
    });
    showHabitHelper(byHabit(state.habit));
  }

  const byHabit = (id) => habits.find((h) => h.id === id);
  const byContext = (id) => contexts.find((c) => c.id === id);

  function showHabitHelper(h) {
    if (h) $('.lxd-fx-gr-habithelper').innerHTML = `<b>${esc(h.name)}</b> — ${esc(h.definition)}`;
  }

  function renderDetail() {
    const c = byContext(state.context);
    const h = byHabit(state.habit);
    const cell = cellOf.get(`${state.context}×${state.habit}`);
    $('.lxd-fx-gr-eq-context').textContent = c ? c.name : '—';
    $('.lxd-fx-gr-eq-habit').textContent = h ? h.name : '—';
    $('.lxd-fx-gr-science').textContent = cell ? cell.science : '';
    $('.lxd-fx-gr-meta').textContent = cell ? cell.meta : '';
    $('.lxd-fx-gr-vignette').textContent = cell ? cell.vignette : '';
    $('.lxd-fx-gr-scanbtn').textContent = `See all ${habits.length} habits applied to ${c ? c.name : 'this context'} →`;
  }

  function closeScan() {
    state.scanOpen = false;
    const list = $('.lxd-fx-gr-scanlist');
    list.hidden = true;
    list.innerHTML = '';
  }

  function renderScan() {
    const list = $('.lxd-fx-gr-scanlist');
    if (state.scanOpen) return closeScan();
    list.innerHTML = '';
    habits.forEach((h) => {
      const cell = cellOf.get(`${state.context}×${h.id}`);
      if (!cell) return;
      const row = document.createElement('div');
      row.className = 'lxd-fx-gr-scanrow';
      row.innerHTML =
        `<span class="lxd-fx-gr-scanname">${esc(h.name)}</span>` +
        `<span class="lxd-fx-gr-scantext"><b>${esc(cell.meta)}</b> — ${esc(cell.vignette)}</span>`;
      list.appendChild(row);
    });
    list.hidden = false;
    state.scanOpen = true;
  }

  function renderAll() {
    renderContexts();
    renderHabits();
    renderDetail();
  }

  $('.lxd-fx-gr-scanbtn').addEventListener('click', renderScan);
  renderAll();
}

function GRID_SHELL(fw) {
  const sources = (fw.sources || []).map((s) => `<li>${s}</li>`).join('');
  return `
  <div class="lxd-fx-gr-page">
    ${fw.kicker ? `<p class="lxd-fx-gr-eyebrow">${fw.kicker}</p>` : ''}
    <h1 class="lxd-fx-gr-h1">${esc(fw.title)}</h1>
    ${fw.subtitle ? `<p class="lxd-fx-gr-thesis">${fw.subtitle}</p>` : ''}
    ${
      fw.usageNote
        ? `<details class="lxd-fx-gr-howto"><summary>How to read this tool</summary>
             <div class="lxd-fx-gr-howto-body">${fw.usageNote}</div></details>`
        : ''
    }

    <p class="lxd-fx-gr-section">1 — Choose a science teaching context</p>
    <div class="lxd-fx-gr-contexts" role="group" aria-label="Choose a science context"></div>

    <p class="lxd-fx-gr-section">2 — Choose a teaching habit</p>
    ${fw.helperText ? `<p class="lxd-fx-gr-helper">${esc(fw.helperText)}</p>` : ''}
    <div class="lxd-fx-gr-habits" role="group" aria-label="Choose a teaching habit"></div>
    <p class="lxd-fx-gr-habithelper" aria-live="polite"></p>

    <div class="lxd-fx-gr-eqbar">
      <span class="lxd-fx-gr-eqchip context lxd-fx-gr-eq-context">—</span>
      <span class="lxd-fx-gr-eqop">+</span>
      <span class="lxd-fx-gr-eqchip habit lxd-fx-gr-eq-habit">—</span>
    </div>

    <div class="lxd-fx-gr-panel">
      <div class="lxd-fx-gr-cols">
        <div class="lxd-fx-gr-col science">
          <span class="lxd-fx-gr-colbadge">The science (context)</span>
          <p class="lxd-fx-gr-science"></p>
        </div>
        <div class="lxd-fx-gr-col meta">
          <span class="lxd-fx-gr-colbadge">The metacognitive move (goal)</span>
          <p class="lxd-fx-gr-meta"></p>
        </div>
      </div>
      <div class="lxd-fx-gr-vignettebox">
        <span class="lxd-fx-gr-vlabel">What this looks like in the classroom</span>
        <p class="lxd-fx-gr-vignette"></p>
      </div>
    </div>

    <div class="lxd-fx-gr-scan">
      <button class="lxd-fx-gr-scanbtn" type="button">See all habits applied to this context →</button>
      <div class="lxd-fx-gr-scanlist" hidden></div>
    </div>

    <div class="lxd-fx-gr-footer">
      <ul>${sources}</ul>
      ${fw.attribution ? `<p>${esc(fw.attribution)}</p>` : ''}
    </div>
  </div>`;
}

// Scoped grid styles. Same §7 rules as deep-dive: everything under .lxd-fx,
// custom properties on the root, inline colour fallbacks, no external fonts,
// no storage, focus + reduced-motion preserved.
const GRID_STYLES = `
.lxd-fx.lxd-fx-gr{
  --gr-bg:#F5F4EF; --gr-card:#FFFFFF; --gr-border:#DEDAD0;
  --gr-ink:#1E2A35; --gr-body:#3C4750; --gr-muted:#74808A;
  --gr-science:#2F6B60; --gr-science-bg:#E4EEEA; --gr-science-line:#BFD6CE;
  --gr-meta:#9A5B18; --gr-meta-bg:#F4E7D3; --gr-meta-line:#E2C89C;
  --gr-gold:#B08A2E;
  --gr-shadow:0 1px 2px rgba(30,42,53,0.04), 0 6px 16px rgba(30,42,53,0.05);
  --gr-r:14px;
  --gr-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;
  color:var(--gr-body,#3C4750); line-height:1.5; box-sizing:border-box;
}
.lxd-fx.lxd-fx-gr *,.lxd-fx.lxd-fx-gr *::before,.lxd-fx.lxd-fx-gr *::after{box-sizing:border-box;}
.lxd-fx-gr .lxd-fx-gr-page{max-width:980px;margin:0 auto;padding:8px 4px 40px;}

.lxd-fx-gr .lxd-fx-gr-eyebrow{font-family:var(--gr-mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--gr-gold,#B08A2E);margin:0 0 10px;font-weight:600;}
.lxd-fx-gr .lxd-fx-gr-h1{font-weight:700;font-size:clamp(26px,4vw,38px);line-height:1.15;color:var(--gr-ink,#1E2A35);margin:0 0 16px;max-width:20ch;}
.lxd-fx-gr .lxd-fx-gr-thesis{font-size:17px;max-width:62ch;color:var(--gr-body,#3C4750);margin:0 0 6px;}
.lxd-fx-gr .lxd-fx-gr-thesis strong{color:var(--gr-ink,#1E2A35);}

.lxd-fx-gr .lxd-fx-gr-howto{margin-top:18px;background:var(--gr-card,#FFFFFF);border:1px solid var(--gr-border,#DEDAD0);border-radius:var(--gr-r,14px);padding:4px 18px;box-shadow:var(--gr-shadow);}
.lxd-fx-gr .lxd-fx-gr-howto summary{cursor:pointer;font-weight:600;color:var(--gr-ink,#1E2A35);padding:14px 0;list-style:none;display:flex;align-items:center;gap:8px;font-size:15px;}
.lxd-fx-gr .lxd-fx-gr-howto summary::-webkit-details-marker{display:none;}
.lxd-fx-gr .lxd-fx-gr-howto summary::before{content:"+";display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;background:var(--gr-meta-bg,#F4E7D3);color:var(--gr-meta,#9A5B18);font-weight:700;font-size:15px;flex-shrink:0;}
.lxd-fx-gr .lxd-fx-gr-howto[open] summary::before{content:"\\2212";}
.lxd-fx-gr .lxd-fx-gr-howto-body{padding:0 0 18px 28px;font-size:15px;color:var(--gr-body,#3C4750);}
.lxd-fx-gr .lxd-fx-gr-howto-body p{margin:0 0 10px;}
.lxd-fx-gr .lxd-fx-gr-howto-body p:last-child{margin-bottom:0;}

.lxd-fx-gr .lxd-fx-gr-section{font-family:var(--gr-mono);font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--gr-muted,#74808A);font-weight:600;margin:44px 0 4px;}
.lxd-fx-gr .lxd-fx-gr-helper{font-size:14.5px;color:var(--gr-muted,#74808A);margin:0 0 16px;max-width:62ch;}

.lxd-fx-gr .lxd-fx-gr-contexts{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.lxd-fx-gr .lxd-fx-gr-ctx{text-align:left;background:var(--gr-card,#FFFFFF);border:1.5px solid var(--gr-border,#DEDAD0);border-radius:var(--gr-r,14px);padding:16px 18px 14px;cursor:pointer;box-shadow:var(--gr-shadow);transition:border-color .15s ease;color:inherit;font:inherit;}
.lxd-fx-gr .lxd-fx-gr-ctx:hover{border-color:var(--gr-science-line,#BFD6CE);}
.lxd-fx-gr .lxd-fx-gr-ctx.active{border-color:var(--gr-science,#2F6B60);box-shadow:0 0 0 3px var(--gr-science-bg,#E4EEEA),var(--gr-shadow);}
.lxd-fx-gr .lxd-fx-gr-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
.lxd-fx-gr .lxd-fx-gr-badge{font-family:var(--gr-mono);font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;display:inline-block;letter-spacing:.02em;}
.lxd-fx-gr .lxd-fx-gr-badge.type{background:#EDEBE3;color:#6B6355;}
.lxd-fx-gr .lxd-fx-gr-badge.stage{background:#E9ECEF;color:#4A5560;}
.lxd-fx-gr .lxd-fx-gr-ctx h3{font-size:18px;font-weight:700;color:var(--gr-ink,#1E2A35);margin:0 0 6px;}
.lxd-fx-gr .lxd-fx-gr-blurb{font-size:14px;color:var(--gr-body,#3C4750);margin:0 0 8px;}
.lxd-fx-gr .lxd-fx-gr-ctx details{margin-top:6px;}
.lxd-fx-gr .lxd-fx-gr-ctx summary{cursor:pointer;font-size:13px;color:var(--gr-gold,#B08A2E);font-weight:600;list-style:none;}
.lxd-fx-gr .lxd-fx-gr-ctx summary::-webkit-details-marker{display:none;}
.lxd-fx-gr .lxd-fx-gr-ctx summary::after{content:" why this is hard \\25BE";}
.lxd-fx-gr .lxd-fx-gr-ctx details[open] summary::after{content:" why this is hard \\25B4";}
.lxd-fx-gr .lxd-fx-gr-why{font-size:13.5px;color:var(--gr-body,#3C4750);margin:8px 0 0;padding-top:8px;border-top:1px dashed var(--gr-border,#DEDAD0);}

.lxd-fx-gr .lxd-fx-gr-habits{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;}
.lxd-fx-gr .lxd-fx-gr-chip{font-size:14px;font-weight:600;color:var(--gr-ink,#1E2A35);background:var(--gr-card,#FFFFFF);border:1.5px solid var(--gr-border,#DEDAD0);border-radius:999px;padding:8px 16px;cursor:pointer;box-shadow:var(--gr-shadow);transition:border-color .15s ease,background .15s ease;}
.lxd-fx-gr .lxd-fx-gr-chip:hover{border-color:var(--gr-meta-line,#E2C89C);}
.lxd-fx-gr .lxd-fx-gr-chip.active{border-color:var(--gr-meta,#9A5B18);background:var(--gr-meta-bg,#F4E7D3);color:var(--gr-meta,#9A5B18);}
.lxd-fx-gr .lxd-fx-gr-habithelper{font-size:13.5px;color:var(--gr-muted,#74808A);min-height:20px;margin:6px 0 0;}
.lxd-fx-gr .lxd-fx-gr-habithelper b{color:var(--gr-ink,#1E2A35);}

.lxd-fx-gr .lxd-fx-gr-eqbar{margin-top:40px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;padding:18px;background:linear-gradient(180deg,#FBFAF7,#F3F1EA);border:1px solid var(--gr-border,#DEDAD0);border-radius:var(--gr-r,14px);}
.lxd-fx-gr .lxd-fx-gr-eqchip{font-size:19px;font-weight:700;padding:8px 18px;border-radius:10px;}
.lxd-fx-gr .lxd-fx-gr-eqchip.context{background:var(--gr-science-bg,#E4EEEA);color:var(--gr-science,#2F6B60);}
.lxd-fx-gr .lxd-fx-gr-eqchip.habit{background:var(--gr-meta-bg,#F4E7D3);color:var(--gr-meta,#9A5B18);}
.lxd-fx-gr .lxd-fx-gr-eqop{font-size:22px;color:var(--gr-muted,#74808A);}

.lxd-fx-gr .lxd-fx-gr-panel{margin-top:18px;background:var(--gr-card,#FFFFFF);border:1px solid var(--gr-border,#DEDAD0);border-radius:var(--gr-r,14px);box-shadow:var(--gr-shadow);overflow:hidden;}
.lxd-fx-gr .lxd-fx-gr-cols{display:grid;grid-template-columns:1fr 1fr;}
.lxd-fx-gr .lxd-fx-gr-col{padding:22px 24px;}
.lxd-fx-gr .lxd-fx-gr-col.science{background:var(--gr-science-bg,#E4EEEA);border-right:1px solid var(--gr-border,#DEDAD0);}
.lxd-fx-gr .lxd-fx-gr-col.meta{background:var(--gr-meta-bg,#F4E7D3);}
.lxd-fx-gr .lxd-fx-gr-colbadge{font-family:var(--gr-mono);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;display:block;margin-bottom:8px;}
.lxd-fx-gr .lxd-fx-gr-col.science .lxd-fx-gr-colbadge{color:var(--gr-science,#2F6B60);}
.lxd-fx-gr .lxd-fx-gr-col.meta .lxd-fx-gr-colbadge{color:var(--gr-meta,#9A5B18);}
.lxd-fx-gr .lxd-fx-gr-col p{margin:0;font-size:15.5px;font-weight:600;color:var(--gr-ink,#1E2A35);line-height:1.4;}
.lxd-fx-gr .lxd-fx-gr-vignettebox{padding:24px 26px 26px;}
.lxd-fx-gr .lxd-fx-gr-vlabel{font-family:var(--gr-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gr-muted,#74808A);display:block;margin-bottom:10px;}
.lxd-fx-gr .lxd-fx-gr-vignette{font-size:16px;color:var(--gr-body,#3C4750);margin:0;}

.lxd-fx-gr .lxd-fx-gr-scan{margin-top:26px;text-align:center;}
.lxd-fx-gr .lxd-fx-gr-scanbtn{font-size:14px;font-weight:600;color:var(--gr-science,#2F6B60);background:none;border:1.5px solid var(--gr-science-line,#BFD6CE);border-radius:999px;padding:10px 20px;cursor:pointer;}
.lxd-fx-gr .lxd-fx-gr-scanbtn:hover{background:var(--gr-science-bg,#E4EEEA);}
.lxd-fx-gr .lxd-fx-gr-scanlist{margin-top:18px;text-align:left;display:grid;gap:10px;}
.lxd-fx-gr .lxd-fx-gr-scanrow{display:grid;grid-template-columns:170px 1fr;gap:16px;background:var(--gr-card,#FFFFFF);border:1px solid var(--gr-border,#DEDAD0);border-radius:10px;padding:14px 16px;align-items:baseline;}
.lxd-fx-gr .lxd-fx-gr-scanname{font-weight:700;color:var(--gr-meta,#9A5B18);font-size:14px;}
.lxd-fx-gr .lxd-fx-gr-scantext{font-size:14px;color:var(--gr-body,#3C4750);}
.lxd-fx-gr .lxd-fx-gr-scantext b{color:var(--gr-ink,#1E2A35);}

.lxd-fx-gr .lxd-fx-gr-footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--gr-border,#DEDAD0);font-size:13px;color:var(--gr-muted,#74808A);}
.lxd-fx-gr .lxd-fx-gr-footer ul{margin:0 0 10px;padding-left:18px;}
.lxd-fx-gr .lxd-fx-gr-footer li{margin-bottom:5px;}
.lxd-fx-gr .lxd-fx-gr-footer p{margin:0;}

.lxd-fx-gr button:focus-visible,.lxd-fx-gr summary:focus-visible{outline:2.5px solid var(--gr-gold,#B08A2E);outline-offset:2px;}

@media(max-width:720px){
  .lxd-fx-gr .lxd-fx-gr-contexts{grid-template-columns:1fr;}
  .lxd-fx-gr .lxd-fx-gr-cols,.lxd-fx-gr .lxd-fx-gr-cols{grid-template-columns:1fr;}
  .lxd-fx-gr .lxd-fx-gr-col.science{border-right:none;border-bottom:1px solid var(--gr-border,#DEDAD0);}
  .lxd-fx-gr .lxd-fx-gr-scanrow{grid-template-columns:1fr;}
}
@media(prefers-reduced-motion:reduce){.lxd-fx-gr *{transition:none !important;}}
`;
