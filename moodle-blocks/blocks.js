// moodle-blocks/blocks.js
// Config-driven Moodle block renderer for LXDUNE.
// Reads from config/units/{UNIT}.json and config/trimester-config.json.
// import.meta.url is used to derive the base URL so this works on any host.

const BASE = new URL('..', import.meta.url).href;
const NO_TEACHING = new Set([9, 10, 11, 12, 13, 14]);

// ── Utilities ─────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CHIP = `<span style="display:inline-block;background:#f4f6f8;color:#6F7B84;padding:5px 12px;border-radius:999px;border:1px solid #dfe6ea;font-size:.85em;font-weight:700;">Coming soon</span>`;

function linkOrChip(url, label, style = '') {
  if (!url) return CHIP;
  return `<a href="${esc(url)}" target="_blank" rel="noopener" style="${style}">${esc(label)}</a>`;
}

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[blocks.js] No element with id="${id}"`);
  return el;
}

function setError(el, msg) {
  el.innerHTML = `<div style="padding:12px 16px;border:1px solid #e8b4b8;border-left:4px solid #c0392b;border-radius:8px;color:#c0392b;font-family:Arial,sans-serif;font-size:.9em;">${esc(msg)}</div>`;
}

function injectStyles(id, css) {
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }
}

// Writes/replaces the :root theme variables so switching units in the test
// harness immediately updates all var(--lx-*) references across every block.
function applyTheme(unitCfg) {
  const t = unitCfg.theme ?? {};
  const primary    = t.primary    ?? '#1f6fb2';
  const accent     = t.accent     ?? '#25797F';
  const pill       = t.pill       ?? '#DAF0F7';
  const pillBorder = t.pillBorder ?? '#cbe6ee';
  let s = document.getElementById('lx-theme-vars');
  if (!s) { s = document.createElement('style'); s.id = 'lx-theme-vars'; document.head.appendChild(s); }
  s.textContent = `:root{--lx-primary:${primary};--lx-accent:${accent};--lx-pill:${pill};--lx-pill-border:${pillBorder};}`;
}

// ── CSS constants ─────────────────────────────────────────────────────────────

const WORKFLOW_CSS = `
.lx-dashboard{max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33}
.lx-pill{display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);color:#1F2A33;padding:4px 10px;border-radius:999px;font-size:.8em;font-weight:800;margin-bottom:12px}
.lx-dashboard h2{margin:0 0 14px;color:#1F2A33}
.lx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.lx-card{padding:22px;border-radius:16px;text-decoration:none;color:#1F2A33;border:1px solid #dfe6ea;transition:transform .2s,box-shadow .2s;background:#fff;display:block;position:relative}
.lx-card:hover{transform:translateY(-6px);box-shadow:0 12px 24px rgba(0,0,0,.08)}
.lx-step{font-size:.75em;font-weight:900;text-transform:uppercase;margin-bottom:6px;opacity:.82;letter-spacing:.5px}
.lx-card h4{margin:0}
.lx-extra{margin-top:12px;border-radius:12px;padding:0 12px;border:1px solid #dfe6ea;opacity:0;max-height:0;overflow:hidden;transform:translateY(-4px);transition:max-height .28s,opacity .22s,transform .22s,padding .28s;font-size:.92em;color:#444;line-height:1.55}
.lx-card:hover .lx-extra{opacity:1;max-height:260px;transform:translateY(0);padding:12px}
@media(hover:none){.lx-extra{opacity:1;max-height:none;padding:12px;transform:none}}
.lx-study{border-left:6px solid var(--lx-accent,#25797F);background:#f4f6f8}
.lx-lecture{border-left:6px solid var(--lx-primary,#1f6fb2);background:#fff}
.lx-live{border-left:6px solid #f1c40f;background:#fff}
.lx-forum{border-left:6px solid var(--lx-accent,#25797F);background:#f4f6f8}
.lx-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.lx-pill-link{display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);color:var(--lx-primary,#1f6fb2);padding:6px 10px;border-radius:999px;font-weight:800;font-size:.88em;text-decoration:none;line-height:1.2}
.lx-pill-link:hover{text-decoration:underline}
.lx-pill-link.sec{background:#f4f6f8;color:var(--lx-accent,#25797F)}
.lx-pill-link.warn{background:#fff8e6;color:#6F7B84}`;

const LECTURE_CSS = `
.lx-lec-wrap{max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33}
.lx-lec-wrap h2{margin:0 0 14px}
.lx-lec-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.lx-lec-card{padding:22px;border-radius:16px;text-decoration:none;color:#1F2A33;border:1px solid #dfe6ea;transition:transform .2s,box-shadow .2s;background:#fff;position:relative}
.lx-lec-card:hover{transform:translateY(-6px);box-shadow:0 12px 24px rgba(0,0,0,.08)}
.lx-lec-step{font-size:.75em;font-weight:800;text-transform:uppercase;margin-bottom:6px;opacity:.8;letter-spacing:.5px}
.lx-lec-card h4{margin:0 0 8px}
.lx-lec-extra{font-size:.9em;color:#444;margin-top:8px;line-height:1.5}
.lx-lec-lecture{border-left:6px solid var(--lx-primary,#1f6fb2);background:#fff}
.lx-lec-slides{border-left:6px solid var(--lx-accent,#25797F);background:#f4f6f8}
.lx-lec-pill{display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);border-radius:999px;padding:4px 10px;font-weight:800;font-size:.8em;margin-bottom:12px}
.lx-video{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin-top:12px;border:1px solid #dfe6ea;background:#fff}
.lx-video iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}`;

const RDIR_CSS = `
.lx-rdir{max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33}
.lx-rdir-pill{display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);color:#1F2A33;padding:4px 10px;border-radius:999px;font-size:.8em;font-weight:800;margin-bottom:12px}
.lx-rdir h2{margin:0 0 18px;color:#1F2A33}
.lx-rdir-cat{font-size:.72em;font-weight:900;text-transform:uppercase;letter-spacing:.9px;color:var(--lx-primary,#1f6fb2);margin:20px 0 8px;padding-bottom:4px;border-bottom:2px solid var(--lx-pill-border,#cbe6ee)}
.lx-rdir-links{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px}
.lx-rdir-link{display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);color:var(--lx-primary,#1f6fb2);padding:6px 14px;border-radius:999px;font-weight:700;font-size:.88em;text-decoration:none;line-height:1.3}
.lx-rdir-link:hover{text-decoration:underline}`;

const ASSESSMENT_CSS = `
.lx-ap{max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33;line-height:1.55}
.lx-ap-meta{background:#f4f6f8;border:1px solid #dfe6ea;border-radius:12px;padding:14px 16px;margin-bottom:18px;display:grid;gap:6px 24px;grid-template-columns:auto 1fr;font-size:.93em;align-items:baseline}
.lx-ap-actions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.lx-ap-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:800;border:1px solid #dfe6ea;background:#f4f6f8;color:#1F2A33;border-left:6px solid #6F7B84;min-height:44px;transition:transform .15s,box-shadow .15s;cursor:default}
.lx-ap-btn[href]{cursor:pointer}
.lx-ap-btn[href]:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(0,0,0,.08)}
.lx-ap-btn.primary{background:var(--lx-pill,#DAF0F7);border-left-color:var(--lx-primary,#1f6fb2)}
.lx-ap-btn.submit{background:#e8f5e9;border-left-color:#27ae60}
.lx-ap-btn.disabled{opacity:.52;pointer-events:none}
.lx-ap-callout{margin:14px 0;padding:14px;border-radius:12px;border:1px solid #dfe6ea;border-left:6px solid #6F7B84;background:#f4f6f8}
.lx-ap-callout.blue{background:var(--lx-pill,#DAF0F7);border-left-color:var(--lx-primary,#1f6fb2)}
.lx-ap-callout.yellow{background:#fff8e6;border-left-color:#f1c40f}
.lx-ap-callout h3{margin:0 0 8px;font-size:1.05rem}
.lx-ap-parts{margin-bottom:18px}
.lx-ap-details{margin:10px 0;border:1px solid #dfe6ea;border-radius:12px;overflow:hidden}
.lx-ap-details>summary{cursor:pointer;list-style:none;padding:12px 14px;font-weight:900;background:#f4f6f8}
.lx-ap-details[open]>summary{border-bottom:1px solid #dfe6ea}
.lx-ap-part-body{padding:14px}
.lx-ap-criteria{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:12px 0}
.lx-ap-crit{padding:14px;border-radius:12px;border:1px solid #dfe6ea}
.lx-ap-crit h4{margin:0 0 6px;font-size:.97rem}
.lx-ap-subm{background:#f4f6f8;border-left:6px solid #2c3e50;border-radius:12px;padding:14px;margin:12px 0}
.lx-ap-subm ul{margin:0 0 0 18px;padding:0}
.lx-ap-subm li{margin:5px 0}
.lx-ap-hd{background:#fff8e6;border:1px solid #f1c40f;border-left:8px solid #f1c40f;border-radius:12px;padding:14px;margin:14px 0}
.lx-ap-sect-label{font-size:.82em;font-weight:900;text-transform:uppercase;letter-spacing:.6px;color:#6F7B84;margin:20px 0 6px}
.lx-ap-risk{background:#fff8e6;border:1px solid #f1c40f;border-left:8px solid #f1c40f;border-radius:12px;padding:12px 14px;margin:10px 0}
.lx-ap-risk-link{font-weight:900;color:var(--lx-primary,#1f6fb2);text-decoration:none}
.lx-ap-risk-link:hover{text-decoration:underline}
.lx-ap-risk-creds{margin-top:12px;background:#fff;border:1px solid #e7edf1;border-radius:8px;padding:10px 12px}
.lx-ap-risk-grid{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:8px;align-items:center}
.lx-ap-risk-code{background:#f4f6f8;border:1px solid #dfe6ea;border-radius:999px;padding:4px 10px;font-weight:800}
.lx-tab-bar{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}
.lx-tab-btn{border:1px solid #dfe6ea;background:#f4f6f8;color:#1F2A33;font-weight:900;padding:8px 12px;border-radius:999px;cursor:pointer;border-left:6px solid #6F7B84;line-height:1.15;font-family:Arial,sans-serif;font-size:.9em}
.lx-tab-btn[aria-selected="true"]{background:var(--lx-pill,#DAF0F7);border-left-color:var(--lx-primary,#1f6fb2);box-shadow:0 4px 10px rgba(0,0,0,.06)}
.lx-tab-panel{border:1px solid #dfe6ea;border-radius:12px;background:#fff;padding:12px 14px}
.lx-tab-panel ul{margin:8px 0 0 18px}
.lx-tab-panel li{margin:6px 0}
.lx-pi-tag{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;border:1px solid #dfe6ea;background:#f4f6f8;font-weight:900;font-size:.82em;vertical-align:middle}
.lx-ap-glance{background:#f4f6f8;border:1px solid #dfe6ea;border-radius:12px;padding:16px;margin-bottom:18px}
.lx-ap-meta-pill{display:inline-block;background:#fff;border:1px solid #dfe6ea;padding:5px 12px;border-radius:999px;font-size:.85em;font-weight:600}
.lx-ap-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.lx-ap-lo-row{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 12px}
.lx-ap-lo-pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:.8em;font-weight:700;color:#fff}
.lx-rubric-table{width:100%;border-collapse:collapse;margin-top:10px;table-layout:fixed}
.lx-rubric-table th,.lx-rubric-table td{border:1px solid #dfe6ea;padding:8px 10px;vertical-align:top;font-size:.88em}
.lx-rubric-table thead th{background:#f4f6f8;font-weight:700;text-align:center}
.lx-rubric-table tbody td{background:#fff}`;

// ── Date calculation (mirrors whatson.js logic) ───────────────────────────────

function buildDateList(startDate, trimester) {
  const list = [];
  const week0 = new Date(startDate);
  week0.setDate(week0.getDate() - 7);
  week0.setHours(0, 0, 0, 0);
  list.push({ week: 0, date: week0 });
  list.push({ week: 1, date: new Date(startDate) });
  for (let w = 2; w <= 14; w++) {
    const d = new Date(week0);
    d.setDate(week0.getDate() + w * 7);
    if (trimester === 'T3' && w >= 9) d.setDate(d.getDate() + 14);
    list.push({ week: w, date: d });
  }
  return list;
}

function calcCurrentWeek(today, dateList) {
  if (today < dateList[0].date) return 0;
  for (let i = 0; i < dateList.length; i++) {
    const next = dateList[i + 1];
    if (!next || today < next.date) return dateList[i].week;
  }
  return dateList[dateList.length - 1].week;
}

// ── Shared config resolver ────────────────────────────────────────────────────

async function resolve({ forUnit, forTri, forYear, forWeek, forDate }) {
  const [triCfg, unitCfg] = await Promise.all([
    fetchJson(`${BASE}config/trimester-config.json`),
    fetchJson(`${BASE}config/units/${forUnit}.json`),
  ]);

  const startDate = triCfg[forYear]?.[forTri]?.start;
  if (!startDate) throw new Error(`No start date for ${forTri} ${forYear}`);

  const triKey = `${forTri}-${forYear}`;
  const zoom = unitCfg.trimesterConfig?.[triKey]?.zoom ?? null;

  let weekNum = forWeek != null ? Number(forWeek) : null;
  if (weekNum == null) {
    const today = forDate ? new Date(forDate) : new Date();
    today.setHours(0, 0, 0, 0);
    weekNum = calcCurrentWeek(today, buildDateList(new Date(startDate), forTri));
  }

  const week = unitCfg.weeks[String(weekNum)] ?? null;
  return { unitCfg, triCfg, week, weekNum, triKey, startDate, zoom };
}

// ── Assessment reminder builder (shared) ──────────────────────────────────────

function formatDateAU(d) {
  return new Date(d).toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function buildAssessmentReminders(unitCfg, portalUrl) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seen = new Set();
  const lines = [];

  for (const wk of Object.values(unitCfg.weeks)) {
    for (const a of wk.assessments ?? []) {
      const key = `${a.name}::${a.due}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const due = new Date(a.due);
      due.setHours(0, 0, 0, 0);
      const dd = Math.round((due - today) / 86400000);
      const portal = portalUrl ? ` (see <a href="${esc(portalUrl)}" target="_blank" style="color:var(--lx-primary,#1f6fb2);font-weight:600;">Assessment Portal</a>)` : '';
      if (dd === 0) lines.push(`⚠️ <strong>${esc(a.name)}</strong> is due <strong>today</strong>${portal}.`);
      else if (dd > 0 && dd <= 7) lines.push(`⚠️ <strong>${esc(a.name)}</strong> is due in <strong>${dd} day${dd === 1 ? '' : 's'}</strong>${portal}.`);
      else if (dd > 7 && dd <= 14) lines.push(`⏳ ${esc(a.name)} is approaching — due ${esc(formatDateAU(a.due))}.`);
      else if (dd < 0 && dd >= -14) lines.push(`❗ <strong>${esc(a.name)}</strong> was due ${Math.abs(dd)} day${Math.abs(dd) === 1 ? '' : 's'} ago${portal}.`);
    }
  }
  if (!lines.length) return '';
  return `<div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid var(--lx-accent,#E3B089);border-radius:8px;background:#ffffff;">
    <h4 style="margin:0 0 6px 0;">Assessment Update</h4>
    <ul style="margin:8px 0 0 18px;">${lines.map(l => `<li style="margin:6px 0;">${l}</li>`).join('')}</ul>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. renderAnnouncementBlock
// Container: <div id="lxdune-announcement"></div>
// ─────────────────────────────────────────────────────────────────────────────

export async function renderAnnouncementBlock({ forUnit, forTri, forYear, forWeek, forDate } = {}) {
  const el = getEl('lxdune-announcement');
  if (!el) return;
  let ctx;
  try { ctx = await resolve({ forUnit, forTri, forYear, forWeek, forDate }); }
  catch (e) { setError(el, `Could not load content: ${e.message}`); return; }

  const { unitCfg, week, weekNum } = ctx;
  applyTheme(unitCfg);
  const itemLabel = unitCfg.itemLabel ?? 'Module';

  let html = '';

  if (weekNum === 0) {
    html = `<div style="font-family:Arial,sans-serif;color:#1F2A33;line-height:1.5;max-width:800px;margin:0 auto;">
      <div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid var(--lx-primary,#1f6fb2);border-radius:8px;background:#f4f6f8;">
        <h3 style="margin:0 0 8px 0;">Welcome — Zero Week</h3>
        <p style="margin:0;">${esc(unitCfg.week0Message ?? 'Welcome! We\'ll get started next week.')}</p>
      </div>
    </div>`;
  } else if (!week || NO_TEACHING.has(weekNum)) {
    const pe = weekNum === 14 ? 'Assessment and Intensive Period' : 'Professional Experience';
    html = `<div style="font-family:Arial,sans-serif;color:#1F2A33;line-height:1.5;max-width:800px;margin:0 auto;">
      <div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid #6F7B84;border-radius:8px;background:#f4f6f8;">
        <h3 style="margin:0 0 8px 0;">${esc(pe)}</h3>
        <p style="margin:0;">There is no teaching this week. Use this time for Professional Experience and to stay on top of assessment requirements.</p>
        ${unitCfg.assessmentPortalUrl ? `<p style="margin:8px 0 0;"><a href="${esc(unitCfg.assessmentPortalUrl)}" target="_blank" style="color:var(--lx-primary,#1f6fb2);font-weight:600;">Assessment Portal</a></p>` : ''}
      </div>
    </div>`;
  } else {
    const ab = week.announcementBody ?? {};
    const sections = [];

    sections.push(`<div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid var(--lx-primary,#1f6fb2);border-radius:8px;background:#f4f6f8;">
      <h3 style="margin:0 0 8px 0;">${esc(week.item)} — ${esc(week.title)}</h3>
      ${ab.intro ? `<p style="margin:0;">${esc(ab.intro)}</p>` : ''}
    </div>`);

    if (ab.focus) {
      sections.push(`<div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid var(--lx-accent,#25797F);border-radius:8px;">
        <h4 style="margin:0 0 8px 0;">This Week's Focus</h4>
        <p style="margin:0;">${esc(ab.focus)}</p>
      </div>`);
    }

    sections.push(`<div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid #6F7B84;border-radius:8px;background:#ffffff;">
      <h4 style="margin:0 0 8px 0;">How to Approach ${esc(week.item)}</h4>
      <ul style="margin:0 0 0 18px;">
        <li>Read the ${esc(itemLabel.toLowerCase())} materials</li>
        <li>Watch the lecture recording</li>
        <li>Prepare for the live session and note down examples or questions</li>
        <li>Join the live session and contribute your thinking</li>
        <li>Post to the forum</li>
      </ul>
    </div>`);

    const reminders = buildAssessmentReminders(unitCfg, unitCfg.assessmentPortalUrl);
    if (reminders) sections.push(reminders);

    if (week.links?.forum) {
      sections.push(`<div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid var(--lx-accent,#25797F);border-radius:8px;background:#f4f6f8;">
        <h4 style="margin:0 0 6px 0;">Forum Discussion</h4>
        <p style="margin:0;">After engaging with the materials, post a short reflection to the ${esc(week.item)} forum.</p>
        <p style="margin:8px 0 0;"><a href="${esc(week.links.forum)}" target="_blank" style="color:var(--lx-primary,#1f6fb2);font-weight:600;">Go to Forum</a></p>
      </div>`);
    }

    sections.push(`<p>I look forward to our discussion this week.</p>`);
    html = `<div style="font-family:Arial,sans-serif;color:#1F2A33;line-height:1.5;max-width:800px;margin:0 auto;">${sections.join('\n')}</div>`;
  }

  el.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. renderWorkflowCard
// Container: <div id="lxdune-workflow"></div>
// ─────────────────────────────────────────────────────────────────────────────

export async function renderWorkflowCard({ forUnit, forTri, forYear, forWeek, forDate } = {}) {
  const el = getEl('lxdune-workflow');
  if (!el) return;
  let ctx;
  try { ctx = await resolve({ forUnit, forTri, forYear, forWeek, forDate }); }
  catch (e) { setError(el, `Could not load content: ${e.message}`); return; }

  const { unitCfg, week, weekNum, zoom } = ctx;
  applyTheme(unitCfg);
  const label = unitCfg.itemLabel ?? 'Module';

  if (!week || NO_TEACHING.has(weekNum) || weekNum === 0) {
    el.innerHTML = '';
    return;
  }

  injectStyles('lx-workflow-styles', WORKFLOW_CSS);

  const steps = [
    { cls: 'lx-study',   num: 1, title: `Read the ${label} Materials`,      detail: `Work through the ${esc(week.item)} content with a focus on this week's key ideas.`, url: week.links?.materials, pillLabel: `${label} materials`,    pillCls: 'sec' },
    { cls: 'lx-lecture', num: 2, title: 'Watch the Lecture Recording',        detail: 'Use the lecture to deepen your understanding of this week\'s content.',               url: week.links?.lecture,   pillLabel: 'Lecture recording',    pillCls: '' },
    { cls: 'lx-live',    num: 3, title: 'Prepare for the Live Session',        detail: 'Review the activities and prepare notes to bring to the session.',                   url: week.links?.liveHub,   pillLabel: 'Live session hub',     pillCls: '' },
    { cls: 'lx-live',    num: 4, title: 'Join the Live Session',               detail: `${esc(unitCfg.liveDay)}s, ${esc(unitCfg.liveTime)}. Bring your reflections to discuss with peers.`, url: zoom?.url, pillLabel: 'Join Zoom', pillCls: '' },
    { cls: 'lx-forum',   num: 5, title: 'Post to the Forum',                   detail: 'Share a reflection and respond to at least one peer.',                              url: week.links?.forum,     pillLabel: 'Forum',                pillCls: 'warn' },
  ];

  const cards = steps.map(s => {
    const pill = s.url
      ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" class="lx-pill-link ${s.pillCls}">${esc(s.pillLabel)}</a>`
      : CHIP;
    const open  = s.url ? `<a class="lx-card ${s.cls}" href="${esc(s.url)}" target="_blank" rel="noopener">` : `<div class="lx-card ${s.cls}">`;
    const close = s.url ? `</a>` : `</div>`;
    return `${open}<div class="lx-step">Step ${s.num}</div><h4>${esc(s.title)}</h4><div class="lx-extra">${s.detail}<div class="lx-pills">${pill}</div></div>${close}`;
  }).join('');

  el.innerHTML = `<div class="lx-dashboard">
    <div class="lx-pill">${esc(unitCfg.code)} • ${esc(week.item)}</div>
    <h2>How to Approach ${esc(week.item)}: ${esc(week.title)}</h2>
    <div class="lx-grid">${cards}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. renderLectureBlock
// Container: <div id="lxdune-lecture"></div>
// ─────────────────────────────────────────────────────────────────────────────

export async function renderLectureBlock({ forUnit, forTri, forYear, forWeek, forDate } = {}) {
  const el = getEl('lxdune-lecture');
  if (!el) return;
  let ctx;
  try { ctx = await resolve({ forUnit, forTri, forYear, forWeek, forDate }); }
  catch (e) { setError(el, `Could not load content: ${e.message}`); return; }

  const { unitCfg, week, weekNum } = ctx;
  applyTheme(unitCfg);

  if (!week || NO_TEACHING.has(weekNum) || weekNum === 0) {
    el.innerHTML = '';
    return;
  }

  injectStyles('lx-lecture-styles', LECTURE_CSS);

  const lectureCard = week.links?.lecture
    ? `<div class="lx-lec-card lx-lec-lecture">
        <div class="lx-lec-step">Step 1</div>
        <h4>Watch the Lecture</h4>
        <div class="lx-lec-extra">Click below to expand the lecture recording.</div>
        <details style="margin-top:10px;">
          <summary style="cursor:pointer;font-weight:800;">Open lecture recording</summary>
          <div class="lx-video">
            <iframe src="${esc(week.links.lecture)}" allowfullscreen="" frameborder="0"></iframe>
          </div>
        </details>
      </div>`
    : `<div class="lx-lec-card lx-lec-lecture">
        <div class="lx-lec-step">Step 1</div>
        <h4>Watch the Lecture</h4>
        <div class="lx-lec-extra">The lecture recording will be available here when published.</div>
        <div style="margin-top:12px;">${CHIP}</div>
      </div>`;

  const slidesCard = week.links?.slides
    ? `<a href="${esc(week.links.slides)}" class="lx-lec-card lx-lec-slides" target="_blank" rel="noopener">
        <div class="lx-lec-step">Step 2</div>
        <h4>View Slides (PDF)</h4>
        <div class="lx-lec-extra">Open the presentation in a new window.</div>
      </a>`
    : `<div class="lx-lec-card lx-lec-slides">
        <div class="lx-lec-step">Step 2</div>
        <h4>View Slides (PDF)</h4>
        <div class="lx-lec-extra">Slides will be available here when uploaded.</div>
        <div style="margin-top:12px;">${CHIP}</div>
      </div>`;

  el.innerHTML = `<div class="lx-lec-wrap">
    <div class="lx-lec-pill">${esc(unitCfg.code)} • ${esc(week.item)}</div>
    <h2>${esc(week.item)} — ${esc(week.title)}</h2>
    <div class="lx-lec-grid">${lectureCard}${slidesCard}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. renderLiveSessionHub
// Container: <div id="lxdune-live-hub"></div>
// ─────────────────────────────────────────────────────────────────────────────

export async function renderLiveSessionHub({ forUnit, forTri, forYear, forWeek, forDate } = {}) {
  const el = getEl('lxdune-live-hub');
  if (!el) return;
  let ctx;
  try { ctx = await resolve({ forUnit, forTri, forYear, forWeek, forDate }); }
  catch (e) { setError(el, `Could not load content: ${e.message}`); return; }

  const { unitCfg, week, weekNum, zoom } = ctx;
  applyTheme(unitCfg);

  if (!week || NO_TEACHING.has(weekNum) || weekNum === 0) {
    el.innerHTML = '';
    return;
  }

  const focus = week.liveSessionFocus ?? week.live ?? 'Live session details will be posted here.';
  const tasks = week.liveSessionTasks ?? [];

  const zoomBtn = zoom?.url
    ? `<a style="display:inline-block;margin-top:10px;padding:8px 14px;background:var(--lx-primary,#1f6fb2);color:#fff;border-radius:8px;text-decoration:none;font-weight:800;" href="${esc(zoom.url)}" target="_blank" rel="noopener">Join Zoom Session</a>`
    : `<div style="margin-top:10px;">${CHIP}</div>`;

  const forumLink = week.links?.forum
    ? `<a style="color:var(--lx-primary,#1f6fb2);font-weight:700;text-decoration:none;" href="${esc(week.links.forum)}" target="_blank" rel="noopener">Go to Forum</a>`
    : CHIP;

  const taskItems = tasks.length
    ? tasks.map(t => `<li style="margin:6px 0;">${esc(t)}</li>`).join('')
    : `<li style="margin:6px 0;">Review the lecture and readings before the session.</li>`;

  const s = 'border:1px solid #dfe6ea;border-radius:14px;padding:18px;margin-bottom:16px;background:#fff;';

  el.innerHTML = `<div style="max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33;line-height:1.55;">
    <div style="display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);padding:4px 10px;border-radius:999px;font-size:.8em;font-weight:800;margin-bottom:12px;">${esc(unitCfg.code)} • LIVE SESSION</div>
    <div style="${s}border-left:8px solid #f1c40f;">
      <h3 style="margin:0 0 6px;">${esc(week.item)} Live Session</h3>
      <div>${esc(focus)}</div>
      <div style="display:inline-block;margin-top:8px;background:#fff8e6;border:1px solid #f1c40f;color:#6F7B84;font-size:.85em;font-weight:700;padding:6px 10px;border-radius:999px;">Required before attending</div>
    </div>
    <div style="${s}border-left:6px solid var(--lx-accent,#25797F);background:#f4f6f8;">
      <h4 style="margin:0 0 8px;">Before the Session</h4>
      <ul style="margin:8px 0 0 18px;">${taskItems}</ul>
    </div>
    <div style="${s}border-left:6px solid #f1c40f;background:#fff8e6;">
      <h4 style="margin:0 0 8px;">Join the Live Session</h4>
      <div>${esc(unitCfg.liveDay)}s at ${esc(unitCfg.liveTime)}. Bring your notes and be prepared to discuss.</div>
      ${zoomBtn}
    </div>
    <div style="${s}border-left:6px solid #6F7B84;background:#f4f6f8;">
      <h4 style="margin:0 0 8px;">After the Session</h4>
      <div>Post a short reflection in the forum.</div>
      <div style="margin-top:10px;">${forumLink}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. renderAssessmentDownloadBlock
// Container: <div id="lxdune-assessment-downloads"></div>
// Reads from unit.trimesterConfig[triKey].assessmentFiles
// ─────────────────────────────────────────────────────────────────────────────

export async function renderAssessmentDownloadBlock({ forUnit, forTri, forYear } = {}) {
  const el = getEl('lxdune-assessment-downloads');
  if (!el) return;
  let ctx;
  try { ctx = await resolve({ forUnit, forTri, forYear, forWeek: 1 }); }
  catch (e) { setError(el, `Could not load content: ${e.message}`); return; }

  const { unitCfg, triKey } = ctx;
  applyTheme(unitCfg);
  const files = unitCfg.trimesterConfig?.[triKey]?.assessmentFiles ?? {};

  if (!Object.keys(files).length) {
    el.innerHTML = `<div style="padding:14px 16px;border:1px solid #dfe6ea;border-radius:8px;font-family:Arial,sans-serif;color:#6F7B84;">Assessment file links not yet configured for ${triKey}.</div>`;
    return;
  }

  const DISCIPLINES = [
    { key: 'biology',   label: 'Biology' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'ees',       label: 'Earth & Environmental Science' },
    { key: 'physics',   label: 'Physics' },
  ];

  const taskSections = Object.entries(files).map(([taskId, taskData]) => {
    const rubricBtn = taskData.rubricUrl
      ? `<a href="${esc(taskData.rubricUrl)}" style="display:inline-block;background:#f4f6f8;color:#1F2A33;text-decoration:none;padding:10px 16px;border-radius:999px;border:1px solid #dfe6ea;font-weight:bold;" target="_blank" rel="noopener">Download the Rubric</a>`
      : CHIP;

    const discCards = DISCIPLINES.map(d => {
      const disc = taskData.disciplines?.[d.key] ?? {};
      const taskBtn = disc.task
        ? `<a href="${esc(disc.task)}" style="display:block;background:var(--lx-accent,#25797F);color:white;text-decoration:none;padding:10px 14px;border-radius:6px;margin-bottom:8px;font-weight:bold;" target="_blank" rel="noopener">Download ${esc(d.label)} Task</a>`
        : `<div style="margin-bottom:8px;">${CHIP}</div>`;
      const markBtn = disc.marking
        ? `<a href="${esc(disc.marking)}" style="display:block;background:var(--lx-pill,#DAF0F7);color:#1F2A33;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:bold;" target="_blank" rel="noopener">Download ${esc(d.label)} Marking</a>`
        : CHIP;
      return `<div style="flex:1 1 250px;background:#fff;padding:16px;border:1px solid #dfe6ea;border-radius:10px;">
        <h4 style="margin-top:0;color:var(--lx-accent,#25797F);">${esc(d.label)}</h4>
        ${taskBtn}${markBtn}
      </div>`;
    }).join('');

    return `<div style="background:#fff;padding:16px;border:1px solid #dfe6ea;border-left:8px solid var(--lx-accent,#25797F);border-radius:10px;margin:14px 0;">
      <h3 style="margin:0;color:#1F2A33;">${esc(taskId)} — Download Your Subject Files</h3>
      <p style="margin:8px 0 0;color:#1F2A33;">Select your discipline and download <strong>both</strong> the Task and the Marking document.</p>
      <div style="margin-top:14px;">${rubricBtn}</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:20px;margin:0 0 28px;">${discCards}</div>`;
  }).join('');

  el.innerHTML = `<div style="font-family:Arial,sans-serif;">${taskSections}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. renderLearningOutcomesTable
// Container: <div id="lxdune-outcomes"></div>
// Reads from unitCfg.learningOutcomes
// ─────────────────────────────────────────────────────────────────────────────

export async function renderLearningOutcomesTable({ forUnit, forTri, forYear } = {}) {
  const el = getEl('lxdune-outcomes');
  if (!el) return;
  let ctx;
  try { ctx = await resolve({ forUnit, forTri, forYear, forWeek: 1 }); }
  catch (e) { setError(el, `Could not load content: ${e.message}`); return; }

  const { unitCfg } = ctx;
  applyTheme(unitCfg);
  const los = unitCfg.learningOutcomes;

  if (!los?.length) {
    el.innerHTML = `<div style="padding:14px 16px;border:1px solid #dfe6ea;border-radius:8px;font-family:Arial,sans-serif;color:#6F7B84;">Learning outcomes not yet configured for ${forUnit}.</div>`;
    return;
  }

  const rows = los.map(lo => `<tr id="${esc(lo.id)}" style="border-top:2px solid ${esc(lo.color)};">
    <td style="width:110px;padding:12px;vertical-align:top;">
      <span style="background:${esc(lo.color)};color:white;padding:6px 10px;border-radius:999px;font-weight:bold;">${esc(lo.id)}</span>
    </td>
    <td style="padding:12px;">
      <strong>${esc(lo.title)}</strong><br>
      ${esc(lo.description)}<br>
      <em>GTSD ${esc(lo.gtsd)}</em>
    </td>
  </tr>`).join('');

  el.innerHTML = `<div style="background:#fff;padding:18px;border:1px solid #dfe6ea;border-radius:12px;margin:20px 0;font-family:Arial,sans-serif;">
    <h3 style="margin-top:0;">Unit Learning Outcomes (Linked to Assessment)</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5;">
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. renderResourceDirectory
// Container: <div id="lxdune-resource-directory"></div>
// Reads from week.resources — each item: { category, label, url }
// Groups items by category and renders pill-links under category headings.
// ─────────────────────────────────────────────────────────────────────────────

export async function renderResourceDirectory({ forUnit, forTri, forYear, forWeek, forDate } = {}) {
  const el = getEl('lxdune-resource-directory');
  if (!el) return;
  let ctx;
  try { ctx = await resolve({ forUnit, forTri, forYear, forWeek, forDate }); }
  catch (e) { setError(el, `Could not load content: ${e.message}`); return; }

  const { unitCfg, week, weekNum } = ctx;
  applyTheme(unitCfg);

  if (!week || NO_TEACHING.has(weekNum) || weekNum === 0) {
    el.innerHTML = '';
    return;
  }

  const resources = week.resources ?? [];
  if (!resources.length) {
    el.innerHTML = '';
    return;
  }

  injectStyles('lx-rdir-styles', RDIR_CSS);

  const groups = new Map();
  for (const r of resources) {
    const cat = r.category ?? 'Resources';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(r);
  }

  const groupHtml = [...groups.entries()].map(([cat, items]) => {
    const links = items.map(r =>
      r.url
        ? `<a href="${esc(r.url)}" class="lx-rdir-link" target="_blank" rel="noopener">${esc(r.label)}</a>`
        : CHIP
    ).join('');
    return `<div class="lx-rdir-cat">${esc(cat)}</div><div class="lx-rdir-links">${links}</div>`;
  }).join('');

  el.innerHTML = `<div class="lx-rdir">
    <div class="lx-rdir-pill">${esc(unitCfg.code)} • ${esc(week.item)}</div>
    <h2>Resource Directory: ${esc(week.title)}</h2>
    ${groupHtml}
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. renderAssessmentPage
// Container: <div id="lxdune-assessment-page"></div>
// Reads from unitCfg.assessmentTasks — finds task by id, renders full page.
// Bespoke HTML fragments fetched from moodle-blocks/bespoke/{name}.html.
// ─────────────────────────────────────────────────────────────────────────────

function initTabSwitchers(container) {
  container.querySelectorAll('.lx-tab-bar').forEach(bar => {
    const btns = [...bar.querySelectorAll('.lx-tab-btn')];
    const panels = btns.map(b => {
      const id = b.dataset.panel;
      return id ? container.querySelector(`#${id}`) : null;
    }).filter(Boolean);

    function activate(idx) {
      btns.forEach((b, i) => b.setAttribute('aria-selected', i === idx ? 'true' : 'false'));
      panels.forEach((p, i) => { p.hidden = i !== idx; });
    }

    btns.forEach((b, i) => b.addEventListener('click', () => activate(i)));
    const active = btns.findIndex(b => b.getAttribute('aria-selected') === 'true');
    activate(active >= 0 ? active : 0);
  });
}

export async function renderAssessmentPage({ forUnit, forTask } = {}) {
  const el = getEl('lxdune-assessment-page');
  if (!el) return;

  let unitCfg;
  try {
    unitCfg = await fetchJson(`${BASE}config/units/${forUnit}.json`);
  } catch (e) {
    setError(el, `Could not load content: ${e.message}`);
    return;
  }

  applyTheme(unitCfg);
  injectStyles('lx-ap-styles', ASSESSMENT_CSS);

  const tasks = unitCfg.assessmentTasks ?? [];
  const task = tasks.find(t => t.id === forTask);
  if (!task) { el.innerHTML = ''; return; }

  // Prefetch bespoke components; return a placeholder on failure
  const bespokeCache = {};
  for (const part of task.parts ?? []) {
    if (part.bespoke && !bespokeCache[part.bespoke]) {
      try {
        const res = await fetch(`${BASE}moodle-blocks/bespoke/${part.bespoke}.html`);
        bespokeCache[part.bespoke] = res.ok
          ? await res.text()
          : `<p style="color:#6F7B84;font-style:italic;">Custom component: ${esc(part.bespoke)}</p>`;
      } catch {
        bespokeCache[part.bespoke] = `<p style="color:#6F7B84;font-style:italic;">Custom component: ${esc(part.bespoke)}</p>`;
      }
    }
  }

  const loMap   = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));
  const lnk     = task.links ?? {};
  const fp      = task.flexiblePortal ?? null;
  const parts   = task.parts ?? [];
  const sections = [];

  // Header pill + title
  sections.push(
    `<div style="display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);padding:4px 10px;border-radius:999px;font-size:.8em;font-weight:800;margin-bottom:12px;">${esc(unitCfg.code)} • ${esc(task.id)}</div>` +
    `<h2 style="margin:0 0 16px;">${esc(task.title)}</h2>`
  );

  // ── Section 1: At a glance ─────────────────────────────────────────────────
  const flexLabel = fp ? (fp.label ?? `Flexible portal: ${fp.closesDate}`) : null;
  const metaPills = [
    task.due       ? `Due: ${esc(formatDateAU(task.due))}` : null,
    task.weighting ? `Weighting: ${task.weighting}%` : null,
    task.length    ? `Length: ${esc(task.length)}` : null,
    flexLabel      ? esc(flexLabel) : null,
    (task.aitslStandards ?? []).length ? `AITSL: ${esc((task.aitslStandards).join(', '))}` : null,
  ].filter(Boolean).map(t => `<span class="lx-ap-meta-pill">${t}</span>`).join('');

  const loPillsHtml = (task.learningOutcomes ?? []).map(id => {
    const lo    = loMap[id];
    const color = lo?.color ?? 'var(--lx-primary,#1f6fb2)';
    return `<span class="lx-ap-lo-pill" style="background:${color};">${esc(id)}</span>`;
  }).join('');

  const btnDefs = [
    { label: '📝 Marking rubric',  cls: 'primary', url: lnk.rubric    },
    { label: '⬇ Task files',       cls: 'primary', url: lnk.taskFiles },
    { label: '✅ Submit',           cls: 'submit',  url: lnk.submit    },
    { label: '💬 Q&A forum',       cls: '',        url: lnk.forum     },
    { label: '🎥 Unpacking video',  cls: '',        url: lnk.video     },
  ];
  const btnsHtml = btnDefs.map(b =>
    b.url
      ? `<a class="lx-ap-btn ${b.cls}" href="${esc(b.url)}" target="_blank" rel="noopener">${b.label}</a>`
      : `<span class="lx-ap-btn disabled">${b.label}</span>`
  ).join('');

  sections.push(
    `<div class="lx-ap-glance">` +
    (metaPills    ? `<div class="lx-ap-pills">${metaPills}</div>` : '') +
    (loPillsHtml  ? `<div class="lx-ap-lo-row">${loPillsHtml}</div>` : '') +
    `<div class="lx-ap-actions" style="margin:12px 0 0;">${btnsHtml}</div>` +
    `</div>`
  );

  // ── Section 2: What is this task? ─────────────────────────────────────────
  const rationaleBlock = task.rationale
    ? `<details class="lx-ap-details" style="margin:0 0 10px;"><summary>Why this task matters</summary><div class="lx-ap-part-body"><p style="margin:0;">${esc(task.rationale)}</p></div></details>`
    : '';
  const aimBlock = task.aim
    ? `<div class="lx-ap-callout blue"><h3>The task</h3><p style="margin:0;">${esc(task.aim)}</p></div>`
    : '';
  const structureBlock = parts.length
    ? `<div class="lx-ap-callout yellow"><strong>Task structure (${parts.length} part${parts.length !== 1 ? 's' : ''}):</strong><ul style="margin:8px 0 0 18px;">${
        parts.map(p => {
          const m = p.marks != null ? ` (${p.marks} marks)` : '';
          const w = p.wordCount ? ` — ~${p.wordCount} words` : '';
          return `<li><strong>Part ${esc(p.id)}</strong> — ${esc(p.title)}${m}${w}</li>`;
        }).join('')
      }</ul></div>`
    : '';

  sections.push(
    `<div class="lx-ap-sect-label">What is this task?</div>` +
    rationaleBlock + aimBlock + structureBlock
  );

  // ── Section 3: What do I need to do? ──────────────────────────────────────
  if (parts.length) {
    const partsHtml = parts.map(p => {
      const noteHtml = p.note
        ? `<div style="background:#f4f6f8;border-left:4px solid #2c3e50;border-radius:8px;padding:10px 12px;margin:10px 0;"><strong>Important:</strong> ${esc(p.note)}</div>`
        : '';
      const reqHtml = (p.requirements ?? []).length
        ? `<div style="background:#f4f6f8;border-left:4px solid #2c3e50;border-radius:8px;padding:10px 12px;margin:10px 0;"><strong>You must include:</strong><ul style="margin:8px 0 0 18px;">${p.requirements.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`
        : '';
      const critiqueHtml = (p.critique ?? []).length
        ? `<div style="background:var(--lx-pill,#DAF0F7);border-left:4px solid var(--lx-primary,#1f6fb2);border-radius:8px;padding:10px 12px;margin:10px 0;"><strong>Your critique should refer to:</strong><ul style="margin:8px 0 0 18px;">${p.critique.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`
        : '';
      const resHtml = (p.resources ?? []).length
        ? `<div style="background:#fff8e6;border-left:4px solid #f1c40f;border-radius:8px;padding:10px 12px;margin:10px 0;"><strong>Helpful resources:</strong><ul style="margin:8px 0 0 18px;">${p.resources.map(r => `<li>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener" style="color:var(--lx-primary,#1f6fb2);">${esc(r.label)}</a>` : esc(r.label)}</li>`).join('')}</ul></div>`
        : '';
      const bespokeHtml = p.bespoke && bespokeCache[p.bespoke]
        ? `<div class="lx-ap-bespoke">${bespokeCache[p.bespoke]}</div>`
        : '';
      const marksNote = p.marks != null ? ` (${p.marks} marks)` : '';
      const wordNote  = p.wordCount ? ` <span style="font-weight:400;">| ~${p.wordCount} words</span>` : '';
      return `<details class="lx-ap-details">
        <summary>Part ${esc(p.id)} — ${esc(p.title)}${marksNote}${wordNote}</summary>
        <div class="lx-ap-part-body">
          ${p.description ? `<p style="margin-top:0;">${esc(p.description)}</p>` : ''}
          ${bespokeHtml}${noteHtml}${reqHtml}${critiqueHtml}${resHtml}
        </div>
      </details>`;
    }).join('');
    sections.push(`<div class="lx-ap-sect-label">What do I need to do?</div><div class="lx-ap-parts">${partsHtml}</div>`);
  }

  // ── Section 4: How will I be marked? (rubric) ─────────────────────────────
  const rubric = task.rubric ?? [];
  if (rubric.length) {
    const BANDS = ['HD', 'D', 'C', 'P', 'N'];
    const rubricRows = rubric.map(row => {
      const loTagsHtml = (row.loLinks ?? []).map(id => {
        const lo    = loMap[id];
        const color = lo?.color ?? '#6F7B84';
        return `<span class="lx-pi-tag" style="background:${color};color:#fff;border-color:${color};">${esc(id)}</span>`;
      }).join('');
      const partLabel  = row.part ? `Part ${esc(row.part)} — ` : '';
      const headerCols = BANDS.map(k => {
        const range = row.bands?.[k]?.range ?? '';
        return `<th><strong>${k}</strong><br><small style="font-weight:400;">${esc(range)}</small></th>`;
      }).join('');
      const descCols = BANDS.map(k => {
        const desc = row.bands?.[k]?.descriptor ?? '';
        return `<td>${desc ? esc(desc) : '<span style="color:#bbb;">—</span>'}</td>`;
      }).join('');
      return `<details class="lx-ap-details">
        <summary><strong>${partLabel}${esc(row.criterion)}</strong> <span style="font-weight:400;color:#6F7B84;">(${row.marks} marks)</span>${loTagsHtml}</summary>
        <div class="lx-ap-part-body" style="padding:10px 14px;overflow-x:auto;">
          <table class="lx-rubric-table"><thead><tr>${headerCols}</tr></thead><tbody><tr>${descCols}</tr></tbody></table>
        </div>
      </details>`;
    }).join('');
    sections.push(
      `<div class="lx-ap-sect-label">How will I be marked?</div>` +
      `<div class="lx-ap-parts">${rubricRows}</div>` +
      `<p style="font-size:.9em;margin:0 0 12px;"><strong>Download the marking rubric above for full band descriptors.</strong></p>`
    );
  }

  // ── Section 5: Submission ──────────────────────────────────────────────────
  const subm = task.submissionInstructions ?? [];
  if (subm.length || lnk.submit) {
    const submList = subm.length
      ? `<div class="lx-ap-subm"><ul>${subm.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>`
      : '';
    const submitBtn = lnk.submit
      ? `<a class="lx-ap-btn submit" href="${esc(lnk.submit)}" target="_blank" rel="noopener" style="font-size:1.05em;padding:12px 18px;">✅ Submit your assessment</a>`
      : `<span class="lx-ap-btn disabled" style="font-size:1.05em;padding:12px 18px;">✅ Submit (link coming soon)</span>`;
    sections.push(
      `<div class="lx-ap-sect-label">Submission</div>` +
      submList +
      `<div style="margin-top:10px;">${submitBtn}</div>`
    );
  }

  // ── Section 6: Support ─────────────────────────────────────────────────────
  const supportParts = [];
  if (task.hdCallout) {
    supportParts.push(`<div class="lx-ap-hd"><strong>Aiming for HD?</strong><p style="margin:8px 0 0;">${esc(task.hdCallout)}</p></div>`);
  }
  if (fp?.url) {
    const opensNote = fp.opensDate ? ` — opens ${esc(formatDateAU(fp.opensDate))}` : '';
    supportParts.push(
      `<div class="lx-ap-callout" style="background:#f4f6f8;border-left-color:#6F7B84;">` +
      `<h3>🔓 Flexible Submission Portal${opensNote}</h3>` +
      `<a class="lx-ap-btn primary" href="${esc(fp.url)}" target="_blank" rel="noopener">${esc(fp.label ?? 'Open flexible portal')}</a>` +
      `</div>`
    );
  }
  if (supportParts.length) {
    sections.push(`<div class="lx-ap-sect-label">Support</div>${supportParts.join('\n')}`);
  }

  el.innerHTML = `<div class="lx-ap">${sections.join('\n')}</div>`;
  initTabSwitchers(el);
}
