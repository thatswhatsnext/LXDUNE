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
const PHASE_COLOURS = ['#2C5F73', '#37776A', '#8A7A24', '#8C4E2E', '#6B3F63'];

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
export async function renderFrameworkExplorer({ framework, mount = 'lxd-framework-explorer' } = {}) {
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
    view.render(el, fw, data);
  } catch (e) {
    setError(el, e.message);
    console.error('[framework-explorer]', e);
  }
}

// ── view registry ──────────────────────────────────────────────────────────────
// The core (fetch + mount + styles + error handling) is view-agnostic. Each
// view owns its own load() and render(). Adding the matrix view must not
// require changes above this line — that is the seam the port is proving.
const VIEWS = {
  'deep-dive': { load: loadDeepDive, render: renderDeepDive },
  matrix: { load: loadMatrix, render: renderMatrix },
};

// ── deep-dive view (HITS shape) ─────────────────────────────────────────────────
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

function renderDeepDive(mount, fw, { items, labels }) {
  injectStyles('lxd-fx-dd-styles', DEEPDIVE_STYLES);
  mount.className = 'lxd-fx';
  mount.innerHTML = SHELL(fw);
  const $ = (sel) => mount.querySelector(sel);

  const state = { cur: 0 }; // in-memory only — no storage

  const total = items.length;
  const byId = new Map(items.map((it) => [it.id, it]));

  function scrollToPanel() {
    const p = $('.lxd-fx-panel');
    if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderRail() {
    const rail = $('.lxd-fx-rail');
    rail.innerHTML = '';
    items.forEach((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lxd-fx-sbtn' + (i === state.cur ? ' on' : '');
      b.setAttribute('aria-pressed', String(i === state.cur));
      const top = it.badges[0];
      b.innerHTML =
        `<span class="lxd-fx-num">${esc(String(it.ordinal).padStart(2, '0'))}</span>` +
        `<span class="lxd-fx-nm">${esc(it.name)}</span>` +
        `<span class="lxd-fx-es">${esc(top.value || top.label)}</span>`;
      b.addEventListener('click', () => {
        state.cur = i;
        renderAll();
        scrollToPanel();
      });
      rail.appendChild(b);
    });
  }

  function highlight(i) {
    mount.querySelectorAll('.lxd-fx-phase').forEach((p) => p.classList.toggle('hot', +p.dataset.i === i));
    mount.querySelectorAll('.lxd-fx-rseg').forEach((sg, j) => sg.classList.toggle('dim', j !== i));
    const target = mount.querySelector(`.lxd-fx-phase[data-i="${i}"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderPanel() {
    const it = items[state.cur];

    $('.lxd-fx-crumb').textContent = `Strategy ${it.ordinal} of ${total}`;
    $('.lxd-fx-sname').textContent = it.name;
    $('.lxd-fx-headline').innerHTML = it.headline;

    // badges
    const badges = $('.lxd-fx-badges');
    badges.innerHTML = '';
    it.badges.forEach((bd, i) => {
      const s = document.createElement('span');
      const mop = bd.kind === 'monthsProgress';
      s.className = 'lxd-fx-badge' + (mop ? ' mop' : i === 0 ? ' hero-b' : '');
      s.textContent = bd.value ? `${bd.label} · ${bd.value}` : bd.label;
      badges.appendChild(s);
    });

    $('.lxd-fx-incontext').innerHTML = it.inContext;

    // exemplar meta chips
    const ctx = it.exemplar.context;
    const chips = contextChips(ctx, labels);
    const em = $('.lxd-fx-exmeta');
    em.innerHTML = '';
    chips.forEach(({ text, dur }) => {
      const s = document.createElement('span');
      s.className = 'lxd-fx-chip' + (dur ? ' dur' : '');
      s.textContent = text;
      em.appendChild(s);
    });
    $('.lxd-fx-problem-text').innerHTML = it.exemplar.problem;

    // week ruler
    const phases = it.exemplar.phases;
    const maxW = Math.max(...phases.map((p) => p.span.end));
    const ruler = $('.lxd-fx-ruler');
    ruler.innerHTML = '';
    phases.forEach((p, i) => {
      const grow = Math.max(p.span.end - p.span.start, 0.6);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lxd-fx-rseg';
      b.style.flexGrow = String(grow);
      b.style.background = PHASE_COLOURS[i % PHASE_COLOURS.length];
      b.textContent = p.weekLabel;
      b.title = p.label;
      b.setAttribute('aria-label', `${p.weekLabel}: ${p.label}`);
      b.addEventListener('click', () => highlight(i));
      ruler.appendChild(b);
    });
    $('.lxd-fx-ruler-axis').innerHTML =
      `<span>start of unit</span><span>${maxW > 11 ? 'across the year' : 'end of unit'}</span>`;

    // phases timeline
    const ph = $('.lxd-fx-phases');
    ph.innerHTML = '';
    phases.forEach((p, i) => {
      const d = document.createElement('div');
      d.className = 'lxd-fx-phase';
      d.dataset.i = String(i);
      d.style.setProperty('--pc', PHASE_COLOURS[i % PHASE_COLOURS.length]);
      d.innerHTML =
        `<div class="lxd-fx-pcard">` +
        `<div class="lxd-fx-ptop"><span class="lxd-fx-pwk">${esc(p.weekLabel)}</span>` +
        `<span class="lxd-fx-plab">${esc(p.label)}</span></div>` +
        `<p class="lxd-fx-pwhat">${p.what}</p>` +
        `<p class="lxd-fx-pdet">${p.detail}</p></div>`;
      ph.appendChild(d);
    });

    $('.lxd-fx-impact-text').innerHTML = it.exemplar.impact;
    $('.lxd-fx-transfer-label').textContent = it.transfer.label;
    $('.lxd-fx-transfer-text').innerHTML = it.transfer.text;

    fillList($('.lxd-fx-ind-t'), it.indicators.teacher);
    fillList($('.lxd-fx-ind-n'), it.indicators.notDemonstrated);
    fillList($('.lxd-fx-ind-s'), it.indicators.student);

    // continuum
    const cont = $('.lxd-fx-cont');
    cont.innerHTML = '';
    [...it.continuum]
      .sort((a, b) => a.level - b.level)
      .forEach((c) => {
        const d = document.createElement('div');
        d.className = 'lxd-fx-cstep';
        d.innerHTML = `<div class="lxd-fx-ch">${esc(c.level + '. ' + c.label)}</div>` + `<div class="lxd-fx-cb">${c.text}</div>`;
        cont.appendChild(d);
      });

    // related
    const pairs = $('.lxd-fx-pairs');
    pairs.innerHTML = '';
    it.related.forEach((rid) => {
      const t = byId.get(rid);
      if (!t) return; // validator guarantees resolution at full-set build
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lxd-fx-pair';
      b.textContent = `${t.ordinal}. ${t.name} →`;
      b.addEventListener('click', () => {
        state.cur = items.indexOf(t);
        renderAll();
        scrollToPanel();
      });
      pairs.appendChild(b);
    });

    $('.lxd-fx-evidence').innerHTML = it.evidence;
  }

  function renderAll() {
    renderRail();
    renderPanel();
  }
  renderAll();
}

function fillList(ul, arr) {
  ul.innerHTML = '';
  (arr || []).forEach((t) => {
    const li = document.createElement('li');
    li.innerHTML = t;
    ul.appendChild(li);
  });
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
function SHELL(fw) {
  const sources = (fw.sources || []).map((s) => `<li>${s}</li>`).join('');
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

    <div class="lxd-fx-rail-head">
      <h2 class="lxd-fx-rail-h2">Choose a strategy</h2>
      <span>Effect sizes as reported in the source resource</span>
    </div>
    <div class="lxd-fx-rail" role="group" aria-label="Choose a strategy"></div>

    <div class="lxd-fx-panel">
      <div class="lxd-fx-phead">
        <div class="lxd-fx-crumb"></div>
        <h3 class="lxd-fx-sname"></h3>
        <p class="lxd-fx-headline"></p>
        <div class="lxd-fx-badges"></div>
      </div>

      <div class="lxd-fx-block">
        <span class="lxd-fx-blabel">What this looks like in a science faculty</span>
        <p class="lxd-fx-incontext"></p>
      </div>

      <div class="lxd-fx-block">
        <span class="lxd-fx-blabel">Sustained exemplar</span>
        <div class="lxd-fx-exmeta"></div>
        <div class="lxd-fx-problem">
          <span class="lxd-fx-pl">The problem of practice</span>
          <p class="lxd-fx-problem-text"></p>
        </div>
        <div class="lxd-fx-ruler-wrap">
          <div class="lxd-fx-ruler" role="group" aria-label="Phase timeline"></div>
          <div class="lxd-fx-ruler-axis"></div>
        </div>
        <div class="lxd-fx-phases"></div>
      </div>

      <div class="lxd-fx-block">
        <span class="lxd-fx-blabel">How the teacher knew whether it worked</span>
        <div class="lxd-fx-impact"><span class="lxd-fx-il">Monitoring &amp; evaluation</span><p class="lxd-fx-impact-text"></p></div>
      </div>

      <div class="lxd-fx-block">
        <span class="lxd-fx-blabel">The same strategy in another context</span>
        <div class="lxd-fx-transfer"><span class="lxd-fx-tl lxd-fx-transfer-label"></span><p class="lxd-fx-transfer-text"></p></div>
      </div>

      <div class="lxd-fx-block">
        <span class="lxd-fx-blabel">Indicators in a science classroom</span>
        <div class="lxd-fx-ind-grid">
          <div class="lxd-fx-ind t"><h4>Demonstrated when the teacher…</h4><ul class="lxd-fx-ind-t"></ul></div>
          <div class="lxd-fx-ind n"><h4>Not demonstrated when…</h4><ul class="lxd-fx-ind-n"></ul></div>
          <div class="lxd-fx-ind s"><h4>Demonstrated when students…</h4><ul class="lxd-fx-ind-s"></ul></div>
        </div>
      </div>

      <div class="lxd-fx-block">
        <span class="lxd-fx-blabel">Continuum of practice — science faculty</span>
        <div class="lxd-fx-cont"></div>
      </div>

      <div class="lxd-fx-block">
        <span class="lxd-fx-blabel">Works with</span>
        <div class="lxd-fx-pairs"></div>
      </div>

      <div class="lxd-fx-block">
        <span class="lxd-fx-blabel">Evidence base</span>
        <p class="lxd-fx-evidence"></p>
      </div>
    </div>

    <div class="lxd-fx-footer">
      <h4>Sources</h4>
      <ul>${sources}</ul>
      ${fw.attribution ? `<p class="lxd-fx-attribution">${esc(fw.attribution)}</p>` : ''}
    </div>
  </div>`;
}

// ── scoped styles ────────────────────────────────────────────────────────────────
// Every selector is prefixed .lxd-fx; every custom property is defined on
// .lxd-fx (not :root) and used with an inline fallback so a theme that strips
// or overrides variables still degrades to legible colour.
const DEEPDIVE_STYLES = `
.lxd-fx{
  --fx-bg:#E7EBEE; --fx-card:#FFFFFF; --fx-card-sunk:#F4F6F8;
  --fx-ink:#111A21; --fx-body:#38454E; --fx-muted:#6B7A85;
  --fx-line:#D6DCE1; --fx-line-soft:#E6EAEE;
  --fx-accent:#1C4C5B; --fx-accent-soft:#DFEBEE;
  --fx-pos:#2C6046; --fx-pos-soft:#E3EFE8;
  --fx-neg:#8B3A2C; --fx-neg-soft:#F6E7E3;
  --fx-stu:#3D4E86; --fx-stu-soft:#E7EAF5;
  --fx-pc:#2C5F73;
  --fx-shadow:0 1px 2px rgba(17,26,33,.05), 0 10px 28px rgba(17,26,33,.07);
  --fx-r:14px;
  --fx-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;
  color:var(--fx-body,#38454E);
  line-height:1.55;
  box-sizing:border-box;
}
.lxd-fx *,.lxd-fx *::before,.lxd-fx *::after{box-sizing:border-box;}
.lxd-fx .lxd-fx-wrap{max-width:1120px;margin:0 auto;padding:8px 4px 40px;}

.lxd-fx .lxd-fx-kicker{font-family:var(--fx-mono);font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--fx-accent,#1C4C5B);font-weight:600;margin:0 0 14px;}
.lxd-fx .lxd-fx-h1{font-weight:700;font-size:clamp(26px,4vw,40px);line-height:1.12;color:var(--fx-ink,#111A21);margin:0 0 16px;letter-spacing:-.015em;max-width:22ch;}
.lxd-fx .lxd-fx-lede{font-size:17px;max-width:68ch;margin:0 0 14px;color:var(--fx-body,#38454E);}
.lxd-fx .lxd-fx-lede b{color:var(--fx-ink,#111A21);font-weight:600;}
.lxd-fx .lxd-fx-thesis{margin:24px 0 0;padding:18px 22px;background:var(--fx-ink,#111A21);color:#DCE4E8;border-radius:var(--fx-r,14px);font-size:16.5px;line-height:1.45;}
.lxd-fx .lxd-fx-thesis b{color:#FFFFFF;font-weight:600;}

.lxd-fx .lxd-fx-note{margin:14px 0 0;background:var(--fx-card,#FFFFFF);border:1px solid var(--fx-line,#D6DCE1);border-radius:var(--fx-r,14px);padding:2px 20px;box-shadow:var(--fx-shadow);}
.lxd-fx .lxd-fx-note summary{cursor:pointer;font-weight:600;color:var(--fx-ink,#111A21);padding:15px 0;list-style:none;display:flex;align-items:center;gap:10px;font-size:15px;}
.lxd-fx .lxd-fx-note summary::-webkit-details-marker{display:none;}
.lxd-fx .lxd-fx-note summary::before{content:"+";width:20px;height:20px;border-radius:6px;background:var(--fx-accent-soft,#DFEBEE);color:var(--fx-accent,#1C4C5B);font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;}
.lxd-fx .lxd-fx-note[open] summary::before{content:"\\2212";}
.lxd-fx .lxd-fx-note-body{padding:0 0 18px 30px;font-size:15px;}
.lxd-fx .lxd-fx-note-body p{margin:0 0 11px;}
.lxd-fx .lxd-fx-note-body p:last-child{margin-bottom:0;}

.lxd-fx .lxd-fx-rail-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:42px 0 12px;}
.lxd-fx .lxd-fx-rail-h2{font-size:20px;font-weight:700;color:var(--fx-ink,#111A21);margin:0;}
.lxd-fx .lxd-fx-rail-head span{font-size:13.5px;color:var(--fx-muted,#6B7A85);}
.lxd-fx .lxd-fx-rail{display:grid;grid-template-columns:repeat(5,1fr);gap:9px;}
.lxd-fx .lxd-fx-sbtn{text-align:left;background:var(--fx-card,#FFFFFF);border:1.5px solid var(--fx-line,#D6DCE1);border-radius:12px;padding:12px 13px 13px;cursor:pointer;box-shadow:var(--fx-shadow);transition:border-color .14s,background .14s;display:flex;flex-direction:column;gap:5px;min-height:92px;color:inherit;font:inherit;}
.lxd-fx .lxd-fx-sbtn:hover{border-color:#A8BEC6;}
.lxd-fx .lxd-fx-sbtn.on{border-color:var(--fx-accent,#1C4C5B);background:var(--fx-accent-soft,#DFEBEE);}
.lxd-fx .lxd-fx-num{font-family:var(--fx-mono);font-size:11px;font-weight:600;color:var(--fx-muted,#6B7A85);}
.lxd-fx .lxd-fx-sbtn.on .lxd-fx-num{color:var(--fx-accent,#1C4C5B);}
.lxd-fx .lxd-fx-nm{font-weight:600;font-size:14.5px;color:var(--fx-ink,#111A21);line-height:1.2;}
.lxd-fx .lxd-fx-es{font-family:var(--fx-mono);font-size:11px;color:var(--fx-muted,#6B7A85);margin-top:auto;}
.lxd-fx .lxd-fx-sbtn.on .lxd-fx-es{color:var(--fx-accent,#1C4C5B);}

.lxd-fx .lxd-fx-panel{margin-top:26px;background:var(--fx-card,#FFFFFF);border:1px solid var(--fx-line,#D6DCE1);border-radius:var(--fx-r,14px);box-shadow:var(--fx-shadow);overflow:hidden;}
.lxd-fx .lxd-fx-phead{padding:26px 30px 24px;border-bottom:1px solid var(--fx-line,#D6DCE1);}
.lxd-fx .lxd-fx-crumb{font-family:var(--fx-mono);font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--fx-muted,#6B7A85);margin-bottom:10px;}
.lxd-fx .lxd-fx-sname{font-size:28px;font-weight:700;color:var(--fx-ink,#111A21);margin:0 0 12px;line-height:1.15;}
.lxd-fx .lxd-fx-headline{font-size:16.5px;color:var(--fx-body,#38454E);max-width:74ch;margin:0 0 16px;}
.lxd-fx .lxd-fx-badges{display:flex;gap:7px;flex-wrap:wrap;}
.lxd-fx .lxd-fx-badge{font-family:var(--fx-mono);font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:7px;background:var(--fx-card-sunk,#F4F6F8);color:var(--fx-body,#38454E);border:1px solid var(--fx-line-soft,#E6EAEE);}
.lxd-fx .lxd-fx-badge.hero-b{background:var(--fx-accent,#1C4C5B);color:#fff;border-color:var(--fx-accent,#1C4C5B);}
.lxd-fx .lxd-fx-badge.mop{background:var(--fx-pos-soft,#E3EFE8);color:var(--fx-pos,#2C6046);border-color:#CADDD2;}

.lxd-fx .lxd-fx-block{padding:24px 30px;border-bottom:1px solid var(--fx-line-soft,#E6EAEE);}
.lxd-fx .lxd-fx-block:last-child{border-bottom:none;}
.lxd-fx .lxd-fx-blabel{font-family:var(--fx-mono);font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fx-muted,#6B7A85);display:block;margin-bottom:12px;}
.lxd-fx .lxd-fx-block>p{margin:0 0 12px;font-size:15.5px;}
.lxd-fx .lxd-fx-block>p:last-child{margin-bottom:0;}
.lxd-fx .lxd-fx-block b{color:var(--fx-ink,#111A21);font-weight:600;}
.lxd-fx .lxd-fx-incontext{color:var(--fx-body,#38454E);}

.lxd-fx .lxd-fx-exmeta{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px;}
.lxd-fx .lxd-fx-chip{font-family:var(--fx-mono);font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;background:var(--fx-accent-soft,#DFEBEE);color:var(--fx-accent,#1C4C5B);}
.lxd-fx .lxd-fx-chip.dur{background:#EDE7DA;color:#77602A;}
.lxd-fx .lxd-fx-problem{background:var(--fx-card-sunk,#F4F6F8);border-left:3px solid var(--fx-muted,#6B7A85);border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:20px;}
.lxd-fx .lxd-fx-pl{font-family:var(--fx-mono);font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--fx-muted,#6B7A85);display:block;margin-bottom:6px;}
.lxd-fx .lxd-fx-problem-text{margin:0;font-size:15px;color:var(--fx-ink,#111A21);}

.lxd-fx .lxd-fx-ruler-wrap{margin:0 0 22px;}
.lxd-fx .lxd-fx-ruler{display:flex;height:38px;border-radius:9px;overflow:hidden;border:1px solid var(--fx-line,#D6DCE1);}
.lxd-fx .lxd-fx-rseg{flex-grow:1;border:none;cursor:pointer;color:#fff;font-family:var(--fx-mono);font-size:10.5px;font-weight:600;display:flex;align-items:center;justify-content:center;transition:filter .14s;letter-spacing:.02em;border-right:1px solid rgba(255,255,255,.35);padding:0 4px;overflow:hidden;white-space:nowrap;}
.lxd-fx .lxd-fx-rseg:last-child{border-right:none;}
.lxd-fx .lxd-fx-rseg:hover{filter:brightness(1.14);}
.lxd-fx .lxd-fx-rseg.dim{filter:saturate(.32) brightness(1.28);}
.lxd-fx .lxd-fx-ruler-axis{display:flex;justify-content:space-between;font-family:var(--fx-mono);font-size:10.5px;color:var(--fx-muted,#6B7A85);margin-top:6px;letter-spacing:.03em;}

.lxd-fx .lxd-fx-phases{position:relative;padding-left:30px;}
.lxd-fx .lxd-fx-phases::before{content:"";position:absolute;left:8px;top:8px;bottom:8px;width:2px;background:var(--fx-line,#D6DCE1);}
.lxd-fx .lxd-fx-phase{position:relative;margin-bottom:18px;}
.lxd-fx .lxd-fx-phase:last-child{margin-bottom:0;}
.lxd-fx .lxd-fx-phase::before{content:"";position:absolute;left:-27px;top:6px;width:15px;height:15px;border-radius:50%;background:var(--pc,#2C5F73);border:3px solid var(--fx-card,#FFFFFF);box-shadow:0 0 0 2px var(--pc,#2C5F73);}
.lxd-fx .lxd-fx-phase.hot .lxd-fx-pcard{border-color:var(--pc,#2C5F73);box-shadow:0 0 0 3px rgba(0,0,0,.04),var(--fx-shadow);}
.lxd-fx .lxd-fx-pcard{background:var(--fx-card,#FFFFFF);border:1.5px solid var(--fx-line-soft,#E6EAEE);border-radius:12px;padding:15px 18px;transition:border-color .14s;}
.lxd-fx .lxd-fx-ptop{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:7px;}
.lxd-fx .lxd-fx-pwk{font-family:var(--fx-mono);font-size:11px;font-weight:600;color:#fff;background:var(--pc,#2C5F73);padding:3px 9px;border-radius:6px;letter-spacing:.02em;}
.lxd-fx .lxd-fx-plab{font-size:17px;font-weight:700;color:var(--fx-ink,#111A21);}
.lxd-fx .lxd-fx-pwhat{font-size:15.5px;color:var(--fx-ink,#111A21);font-weight:500;margin:0 0 8px;}
.lxd-fx .lxd-fx-pdet{font-size:14.5px;color:var(--fx-body,#38454E);margin:0;}
.lxd-fx .lxd-fx-pdet b{color:var(--fx-ink,#111A21);}

.lxd-fx .lxd-fx-impact{background:var(--fx-pos-soft,#E3EFE8);border:1px solid #CADDD2;border-radius:12px;padding:16px 20px;}
.lxd-fx .lxd-fx-il{font-family:var(--fx-mono);font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--fx-pos,#2C6046);display:block;margin-bottom:7px;}
.lxd-fx .lxd-fx-impact-text{margin:0;font-size:15px;color:var(--fx-ink,#111A21);}
.lxd-fx .lxd-fx-transfer{background:var(--fx-card-sunk,#F4F6F8);border-radius:12px;padding:15px 19px;border:1px solid var(--fx-line-soft,#E6EAEE);}
.lxd-fx .lxd-fx-tl{font-family:var(--fx-mono);font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--fx-muted,#6B7A85);display:block;margin-bottom:7px;}
.lxd-fx .lxd-fx-transfer-text{margin:0;font-size:15px;}

.lxd-fx .lxd-fx-ind-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.lxd-fx .lxd-fx-ind{border-radius:12px;padding:15px 17px;border:1px solid;}
.lxd-fx .lxd-fx-ind.t{background:var(--fx-pos-soft,#E3EFE8);border-color:#CADDD2;}
.lxd-fx .lxd-fx-ind.n{background:var(--fx-neg-soft,#F6E7E3);border-color:#E8CFC8;}
.lxd-fx .lxd-fx-ind.s{background:var(--fx-stu-soft,#E7EAF5);border-color:#CFD5EC;}
.lxd-fx .lxd-fx-ind h4{font-size:13px;font-weight:700;margin:0 0 10px;line-height:1.3;}
.lxd-fx .lxd-fx-ind.t h4{color:var(--fx-pos,#2C6046);}
.lxd-fx .lxd-fx-ind.n h4{color:var(--fx-neg,#8B3A2C);}
.lxd-fx .lxd-fx-ind.s h4{color:var(--fx-stu,#3D4E86);}
.lxd-fx .lxd-fx-ind ul{margin:0;padding-left:16px;}
.lxd-fx .lxd-fx-ind li{font-size:14px;margin-bottom:7px;color:var(--fx-body,#38454E);}
.lxd-fx .lxd-fx-ind li:last-child{margin-bottom:0;}

.lxd-fx .lxd-fx-cont{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--fx-line,#D6DCE1);border-radius:12px;overflow:hidden;}
.lxd-fx .lxd-fx-cstep{padding:0;border-right:1px solid var(--fx-line,#D6DCE1);}
.lxd-fx .lxd-fx-cstep:last-child{border-right:none;}
.lxd-fx .lxd-fx-ch{font-family:var(--fx-mono);font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#fff;padding:9px 14px;}
.lxd-fx .lxd-fx-cstep:nth-child(1) .lxd-fx-ch{background:#8496A0;}
.lxd-fx .lxd-fx-cstep:nth-child(2) .lxd-fx-ch{background:#5A7E8B;}
.lxd-fx .lxd-fx-cstep:nth-child(3) .lxd-fx-ch{background:#356A75;}
.lxd-fx .lxd-fx-cstep:nth-child(4) .lxd-fx-ch{background:var(--fx-accent,#1C4C5B);}
.lxd-fx .lxd-fx-cb{padding:14px;font-size:14px;background:var(--fx-card,#FFFFFF);color:var(--fx-body,#38454E);}
.lxd-fx .lxd-fx-cstep:nth-child(2) .lxd-fx-cb{background:#FBFCFC;}
.lxd-fx .lxd-fx-cstep:nth-child(4) .lxd-fx-cb{background:var(--fx-accent-soft,#DFEBEE);}

.lxd-fx .lxd-fx-pairs{display:flex;gap:8px;flex-wrap:wrap;}
.lxd-fx .lxd-fx-pair{font-size:13.5px;font-weight:600;color:var(--fx-accent,#1C4C5B);background:var(--fx-card,#FFFFFF);border:1.5px solid #B9CDD3;border-radius:999px;padding:7px 14px;cursor:pointer;transition:background .14s;}
.lxd-fx .lxd-fx-pair:hover{background:var(--fx-accent-soft,#DFEBEE);}
.lxd-fx .lxd-fx-evidence{font-size:13.5px;color:var(--fx-muted,#6B7A85);margin:0;}

.lxd-fx .lxd-fx-footer{margin-top:44px;padding-top:22px;border-top:1px solid #C7CFD5;font-size:13.5px;color:var(--fx-muted,#6B7A85);}
.lxd-fx .lxd-fx-footer h4{font-family:var(--fx-mono);font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--fx-body,#38454E);margin:0 0 10px;}
.lxd-fx .lxd-fx-footer ul{margin:0 0 14px;padding-left:18px;}
.lxd-fx .lxd-fx-footer li{margin-bottom:6px;}
.lxd-fx .lxd-fx-attribution{margin:0;}

.lxd-fx button:focus-visible,.lxd-fx summary:focus-visible{outline:2.5px solid #C08A2E;outline-offset:2px;}

@media(max-width:960px){
  .lxd-fx .lxd-fx-rail{grid-template-columns:repeat(3,1fr);}
  .lxd-fx .lxd-fx-ind-grid{grid-template-columns:1fr;}
  .lxd-fx .lxd-fx-cont{grid-template-columns:1fr;}
  .lxd-fx .lxd-fx-cstep{border-right:none;border-bottom:1px solid var(--fx-line,#D6DCE1);}
  .lxd-fx .lxd-fx-cstep:last-child{border-bottom:none;}
}
@media(max-width:620px){
  .lxd-fx .lxd-fx-rail{grid-template-columns:repeat(2,1fr);}
  .lxd-fx .lxd-fx-block,.lxd-fx .lxd-fx-phead{padding-left:18px;padding-right:18px;}
  .lxd-fx .lxd-fx-rseg{font-size:9px;}
}
@media(prefers-reduced-motion:reduce){.lxd-fx *{transition:none !important;scroll-behavior:auto !important;}}
`;

// ── matrix view (metacognition shape) ────────────────────────────────────────────
// Two axes (science contexts × teaching habits) resolving to a cell of three
// fields. Adding this view required no change to the core above the VIEWS
// registry — the seam holds (handoff §9 step 6).
async function loadMatrix(dir, fw) {
  if (!fw.matrix) throw new Error('framework has no matrix manifest');
  const [habits, contexts, cells] = await Promise.all([
    fetchJson(dir + fw.matrix.habits),
    fetchJson(dir + fw.matrix.contexts),
    fetchJson(dir + fw.matrix.cells),
  ]);
  return { habits, contexts, cells };
}

function renderMatrix(mount, fw, { habits, contexts, cells }) {
  injectStyles('lxd-fx-mx-styles', MATRIX_STYLES);
  mount.className = 'lxd-fx lxd-fx-mx';
  mount.innerHTML = MATRIX_SHELL(fw);
  const $ = (sel) => mount.querySelector(sel);

  const cellOf = new Map(cells.map((c) => [`${c.contextId}×${c.habitId}`, c]));
  const state = { context: contexts[0]?.id, habit: habits[0]?.id, scanOpen: false }; // in-memory only

  function renderContexts() {
    const grid = $('.lxd-fx-mx-contexts');
    grid.innerHTML = '';
    contexts.forEach((c) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'lxd-fx-mx-ctx' + (c.id === state.context ? ' active' : '');
      card.setAttribute('aria-pressed', String(c.id === state.context));
      const typeLabel = c.type === 'concept' ? 'Content concept' : 'Science skill';
      card.innerHTML =
        `<div class="lxd-fx-mx-badges"><span class="lxd-fx-mx-badge type">${esc(typeLabel)}</span>` +
        `<span class="lxd-fx-mx-badge stage">${esc(c.label || c.stage)}</span></div>` +
        `<h3>${esc(c.name)}</h3><p class="lxd-fx-mx-blurb">${esc(c.blurb)}</p>` +
        `<details><summary></summary><p class="lxd-fx-mx-why">${esc(c.whyHard)}</p></details>`;
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
    const wrap = $('.lxd-fx-mx-habits');
    wrap.innerHTML = '';
    habits.forEach((h) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'lxd-fx-mx-chip' + (h.id === state.habit ? ' active' : '');
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
    if (h) $('.lxd-fx-mx-habithelper').innerHTML = `<b>${esc(h.name)}</b> — ${esc(h.definition)}`;
  }

  function renderDetail() {
    const c = byContext(state.context);
    const h = byHabit(state.habit);
    const cell = cellOf.get(`${state.context}×${state.habit}`);
    $('.lxd-fx-mx-eq-context').textContent = c ? c.name : '—';
    $('.lxd-fx-mx-eq-habit').textContent = h ? h.name : '—';
    $('.lxd-fx-mx-science').textContent = cell ? cell.science : '';
    $('.lxd-fx-mx-meta').textContent = cell ? cell.meta : '';
    $('.lxd-fx-mx-vignette').textContent = cell ? cell.vignette : '';
    $('.lxd-fx-mx-scanbtn').textContent = `See all ${habits.length} habits applied to ${c ? c.name : 'this context'} →`;
  }

  function closeScan() {
    state.scanOpen = false;
    const list = $('.lxd-fx-mx-scanlist');
    list.hidden = true;
    list.innerHTML = '';
  }

  function renderScan() {
    const list = $('.lxd-fx-mx-scanlist');
    if (state.scanOpen) return closeScan();
    list.innerHTML = '';
    habits.forEach((h) => {
      const cell = cellOf.get(`${state.context}×${h.id}`);
      if (!cell) return;
      const row = document.createElement('div');
      row.className = 'lxd-fx-mx-scanrow';
      row.innerHTML =
        `<span class="lxd-fx-mx-scanname">${esc(h.name)}</span>` +
        `<span class="lxd-fx-mx-scantext"><b>${esc(cell.meta)}</b> — ${esc(cell.vignette)}</span>`;
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

  $('.lxd-fx-mx-scanbtn').addEventListener('click', renderScan);
  renderAll();
}

function MATRIX_SHELL(fw) {
  const sources = (fw.sources || []).map((s) => `<li>${s}</li>`).join('');
  return `
  <div class="lxd-fx-mx-page">
    ${fw.kicker ? `<p class="lxd-fx-mx-eyebrow">${fw.kicker}</p>` : ''}
    <h1 class="lxd-fx-mx-h1">${esc(fw.title)}</h1>
    ${fw.subtitle ? `<p class="lxd-fx-mx-thesis">${fw.subtitle}</p>` : ''}
    ${
      fw.usageNote
        ? `<details class="lxd-fx-mx-howto"><summary>How to read this tool</summary>
             <div class="lxd-fx-mx-howto-body">${fw.usageNote}</div></details>`
        : ''
    }

    <p class="lxd-fx-mx-section">1 — Choose a science teaching context</p>
    <div class="lxd-fx-mx-contexts" role="group" aria-label="Choose a science context"></div>

    <p class="lxd-fx-mx-section">2 — Choose a teaching habit</p>
    ${fw.helperText ? `<p class="lxd-fx-mx-helper">${esc(fw.helperText)}</p>` : ''}
    <div class="lxd-fx-mx-habits" role="group" aria-label="Choose a teaching habit"></div>
    <p class="lxd-fx-mx-habithelper" aria-live="polite"></p>

    <div class="lxd-fx-mx-eqbar">
      <span class="lxd-fx-mx-eqchip context lxd-fx-mx-eq-context">—</span>
      <span class="lxd-fx-mx-eqop">+</span>
      <span class="lxd-fx-mx-eqchip habit lxd-fx-mx-eq-habit">—</span>
    </div>

    <div class="lxd-fx-mx-panel">
      <div class="lxd-fx-mx-cols">
        <div class="lxd-fx-mx-col science">
          <span class="lxd-fx-mx-colbadge">The science (context)</span>
          <p class="lxd-fx-mx-science"></p>
        </div>
        <div class="lxd-fx-mx-col meta">
          <span class="lxd-fx-mx-colbadge">The metacognitive move (goal)</span>
          <p class="lxd-fx-mx-meta"></p>
        </div>
      </div>
      <div class="lxd-fx-mx-vignettebox">
        <span class="lxd-fx-mx-vlabel">What this looks like in the classroom</span>
        <p class="lxd-fx-mx-vignette"></p>
      </div>
    </div>

    <div class="lxd-fx-mx-scan">
      <button class="lxd-fx-mx-scanbtn" type="button">See all habits applied to this context →</button>
      <div class="lxd-fx-mx-scanlist" hidden></div>
    </div>

    <div class="lxd-fx-mx-footer">
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
  --mx-bg:#F5F4EF; --mx-card:#FFFFFF; --mx-border:#DEDAD0;
  --mx-ink:#1E2A35; --mx-body:#3C4750; --mx-muted:#74808A;
  --mx-science:#2F6B60; --mx-science-bg:#E4EEEA; --mx-science-line:#BFD6CE;
  --mx-meta:#9A5B18; --mx-meta-bg:#F4E7D3; --mx-meta-line:#E2C89C;
  --mx-gold:#B08A2E;
  --mx-shadow:0 1px 2px rgba(30,42,53,0.04), 0 6px 16px rgba(30,42,53,0.05);
  --mx-r:14px;
  --mx-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;
  color:var(--mx-body,#3C4750); line-height:1.5; box-sizing:border-box;
}
.lxd-fx.lxd-fx-mx *,.lxd-fx.lxd-fx-mx *::before,.lxd-fx.lxd-fx-mx *::after{box-sizing:border-box;}
.lxd-fx-mx .lxd-fx-mx-page{max-width:980px;margin:0 auto;padding:8px 4px 40px;}

.lxd-fx-mx .lxd-fx-mx-eyebrow{font-family:var(--mx-mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mx-gold,#B08A2E);margin:0 0 10px;font-weight:600;}
.lxd-fx-mx .lxd-fx-mx-h1{font-weight:700;font-size:clamp(26px,4vw,38px);line-height:1.15;color:var(--mx-ink,#1E2A35);margin:0 0 16px;max-width:20ch;}
.lxd-fx-mx .lxd-fx-mx-thesis{font-size:17px;max-width:62ch;color:var(--mx-body,#3C4750);margin:0 0 6px;}
.lxd-fx-mx .lxd-fx-mx-thesis strong{color:var(--mx-ink,#1E2A35);}

.lxd-fx-mx .lxd-fx-mx-howto{margin-top:18px;background:var(--mx-card,#FFFFFF);border:1px solid var(--mx-border,#DEDAD0);border-radius:var(--mx-r,14px);padding:4px 18px;box-shadow:var(--mx-shadow);}
.lxd-fx-mx .lxd-fx-mx-howto summary{cursor:pointer;font-weight:600;color:var(--mx-ink,#1E2A35);padding:14px 0;list-style:none;display:flex;align-items:center;gap:8px;font-size:15px;}
.lxd-fx-mx .lxd-fx-mx-howto summary::-webkit-details-marker{display:none;}
.lxd-fx-mx .lxd-fx-mx-howto summary::before{content:"+";display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;background:var(--mx-meta-bg,#F4E7D3);color:var(--mx-meta,#9A5B18);font-weight:700;font-size:15px;flex-shrink:0;}
.lxd-fx-mx .lxd-fx-mx-howto[open] summary::before{content:"\\2212";}
.lxd-fx-mx .lxd-fx-mx-howto-body{padding:0 0 18px 28px;font-size:15px;color:var(--mx-body,#3C4750);}
.lxd-fx-mx .lxd-fx-mx-howto-body p{margin:0 0 10px;}
.lxd-fx-mx .lxd-fx-mx-howto-body p:last-child{margin-bottom:0;}

.lxd-fx-mx .lxd-fx-mx-section{font-family:var(--mx-mono);font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--mx-muted,#74808A);font-weight:600;margin:44px 0 4px;}
.lxd-fx-mx .lxd-fx-mx-helper{font-size:14.5px;color:var(--mx-muted,#74808A);margin:0 0 16px;max-width:62ch;}

.lxd-fx-mx .lxd-fx-mx-contexts{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.lxd-fx-mx .lxd-fx-mx-ctx{text-align:left;background:var(--mx-card,#FFFFFF);border:1.5px solid var(--mx-border,#DEDAD0);border-radius:var(--mx-r,14px);padding:16px 18px 14px;cursor:pointer;box-shadow:var(--mx-shadow);transition:border-color .15s ease;color:inherit;font:inherit;}
.lxd-fx-mx .lxd-fx-mx-ctx:hover{border-color:var(--mx-science-line,#BFD6CE);}
.lxd-fx-mx .lxd-fx-mx-ctx.active{border-color:var(--mx-science,#2F6B60);box-shadow:0 0 0 3px var(--mx-science-bg,#E4EEEA),var(--mx-shadow);}
.lxd-fx-mx .lxd-fx-mx-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
.lxd-fx-mx .lxd-fx-mx-badge{font-family:var(--mx-mono);font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;display:inline-block;letter-spacing:.02em;}
.lxd-fx-mx .lxd-fx-mx-badge.type{background:#EDEBE3;color:#6B6355;}
.lxd-fx-mx .lxd-fx-mx-badge.stage{background:#E9ECEF;color:#4A5560;}
.lxd-fx-mx .lxd-fx-mx-ctx h3{font-size:18px;font-weight:700;color:var(--mx-ink,#1E2A35);margin:0 0 6px;}
.lxd-fx-mx .lxd-fx-mx-blurb{font-size:14px;color:var(--mx-body,#3C4750);margin:0 0 8px;}
.lxd-fx-mx .lxd-fx-mx-ctx details{margin-top:6px;}
.lxd-fx-mx .lxd-fx-mx-ctx summary{cursor:pointer;font-size:13px;color:var(--mx-gold,#B08A2E);font-weight:600;list-style:none;}
.lxd-fx-mx .lxd-fx-mx-ctx summary::-webkit-details-marker{display:none;}
.lxd-fx-mx .lxd-fx-mx-ctx summary::after{content:" why this is hard \\25BE";}
.lxd-fx-mx .lxd-fx-mx-ctx details[open] summary::after{content:" why this is hard \\25B4";}
.lxd-fx-mx .lxd-fx-mx-why{font-size:13.5px;color:var(--mx-body,#3C4750);margin:8px 0 0;padding-top:8px;border-top:1px dashed var(--mx-border,#DEDAD0);}

.lxd-fx-mx .lxd-fx-mx-habits{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;}
.lxd-fx-mx .lxd-fx-mx-chip{font-size:14px;font-weight:600;color:var(--mx-ink,#1E2A35);background:var(--mx-card,#FFFFFF);border:1.5px solid var(--mx-border,#DEDAD0);border-radius:999px;padding:8px 16px;cursor:pointer;box-shadow:var(--mx-shadow);transition:border-color .15s ease,background .15s ease;}
.lxd-fx-mx .lxd-fx-mx-chip:hover{border-color:var(--mx-meta-line,#E2C89C);}
.lxd-fx-mx .lxd-fx-mx-chip.active{border-color:var(--mx-meta,#9A5B18);background:var(--mx-meta-bg,#F4E7D3);color:var(--mx-meta,#9A5B18);}
.lxd-fx-mx .lxd-fx-mx-habithelper{font-size:13.5px;color:var(--mx-muted,#74808A);min-height:20px;margin:6px 0 0;}
.lxd-fx-mx .lxd-fx-mx-habithelper b{color:var(--mx-ink,#1E2A35);}

.lxd-fx-mx .lxd-fx-mx-eqbar{margin-top:40px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;padding:18px;background:linear-gradient(180deg,#FBFAF7,#F3F1EA);border:1px solid var(--mx-border,#DEDAD0);border-radius:var(--mx-r,14px);}
.lxd-fx-mx .lxd-fx-mx-eqchip{font-size:19px;font-weight:700;padding:8px 18px;border-radius:10px;}
.lxd-fx-mx .lxd-fx-mx-eqchip.context{background:var(--mx-science-bg,#E4EEEA);color:var(--mx-science,#2F6B60);}
.lxd-fx-mx .lxd-fx-mx-eqchip.habit{background:var(--mx-meta-bg,#F4E7D3);color:var(--mx-meta,#9A5B18);}
.lxd-fx-mx .lxd-fx-mx-eqop{font-size:22px;color:var(--mx-muted,#74808A);}

.lxd-fx-mx .lxd-fx-mx-panel{margin-top:18px;background:var(--mx-card,#FFFFFF);border:1px solid var(--mx-border,#DEDAD0);border-radius:var(--mx-r,14px);box-shadow:var(--mx-shadow);overflow:hidden;}
.lxd-fx-mx .lxd-fx-mx-cols{display:grid;grid-template-columns:1fr 1fr;}
.lxd-fx-mx .lxd-fx-mx-col{padding:22px 24px;}
.lxd-fx-mx .lxd-fx-mx-col.science{background:var(--mx-science-bg,#E4EEEA);border-right:1px solid var(--mx-border,#DEDAD0);}
.lxd-fx-mx .lxd-fx-mx-col.meta{background:var(--mx-meta-bg,#F4E7D3);}
.lxd-fx-mx .lxd-fx-mx-colbadge{font-family:var(--mx-mono);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;display:block;margin-bottom:8px;}
.lxd-fx-mx .lxd-fx-mx-col.science .lxd-fx-mx-colbadge{color:var(--mx-science,#2F6B60);}
.lxd-fx-mx .lxd-fx-mx-col.meta .lxd-fx-mx-colbadge{color:var(--mx-meta,#9A5B18);}
.lxd-fx-mx .lxd-fx-mx-col p{margin:0;font-size:15.5px;font-weight:600;color:var(--mx-ink,#1E2A35);line-height:1.4;}
.lxd-fx-mx .lxd-fx-mx-vignettebox{padding:24px 26px 26px;}
.lxd-fx-mx .lxd-fx-mx-vlabel{font-family:var(--mx-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mx-muted,#74808A);display:block;margin-bottom:10px;}
.lxd-fx-mx .lxd-fx-mx-vignette{font-size:16px;color:var(--mx-body,#3C4750);margin:0;}

.lxd-fx-mx .lxd-fx-mx-scan{margin-top:26px;text-align:center;}
.lxd-fx-mx .lxd-fx-mx-scanbtn{font-size:14px;font-weight:600;color:var(--mx-science,#2F6B60);background:none;border:1.5px solid var(--mx-science-line,#BFD6CE);border-radius:999px;padding:10px 20px;cursor:pointer;}
.lxd-fx-mx .lxd-fx-mx-scanbtn:hover{background:var(--mx-science-bg,#E4EEEA);}
.lxd-fx-mx .lxd-fx-mx-scanlist{margin-top:18px;text-align:left;display:grid;gap:10px;}
.lxd-fx-mx .lxd-fx-mx-scanrow{display:grid;grid-template-columns:170px 1fr;gap:16px;background:var(--mx-card,#FFFFFF);border:1px solid var(--mx-border,#DEDAD0);border-radius:10px;padding:14px 16px;align-items:baseline;}
.lxd-fx-mx .lxd-fx-mx-scanname{font-weight:700;color:var(--mx-meta,#9A5B18);font-size:14px;}
.lxd-fx-mx .lxd-fx-mx-scantext{font-size:14px;color:var(--mx-body,#3C4750);}
.lxd-fx-mx .lxd-fx-mx-scantext b{color:var(--mx-ink,#1E2A35);}

.lxd-fx-mx .lxd-fx-mx-footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--mx-border,#DEDAD0);font-size:13px;color:var(--mx-muted,#74808A);}
.lxd-fx-mx .lxd-fx-mx-footer ul{margin:0 0 10px;padding-left:18px;}
.lxd-fx-mx .lxd-fx-mx-footer li{margin-bottom:5px;}
.lxd-fx-mx .lxd-fx-mx-footer p{margin:0;}

.lxd-fx-mx button:focus-visible,.lxd-fx-mx summary:focus-visible{outline:2.5px solid var(--mx-gold,#B08A2E);outline-offset:2px;}

@media(max-width:720px){
  .lxd-fx-mx .lxd-fx-mx-contexts{grid-template-columns:1fr;}
  .lxd-fx-mx .lxd-fx-mx-cols,.lxd-fx-mx .lxd-fx-mx-cols{grid-template-columns:1fr;}
  .lxd-fx-mx .lxd-fx-mx-col.science{border-right:none;border-bottom:1px solid var(--mx-border,#DEDAD0);}
  .lxd-fx-mx .lxd-fx-mx-scanrow{grid-template-columns:1fr;}
}
@media(prefers-reduced-motion:reduce){.lxd-fx-mx *{transition:none !important;}}
`;
