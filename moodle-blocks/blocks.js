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

const HUB_CSS = `
.lx-hub{max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33;line-height:1.55}
.lx-hub-pill{display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);color:#1F2A33;padding:4px 10px;border-radius:999px;font-size:.8em;font-weight:800;margin-bottom:12px}
.lx-hub h2{margin:0 0 16px;color:#1F2A33}
.lx-hub-week{border:1px solid #dfe6ea;border-radius:10px;margin-bottom:10px;overflow:hidden;background:#fff}
.lx-hub-week-summary{cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;display:flex;align-items:center;gap:10px;background:#f4f6f8;border-radius:10px}
.lx-hub-week[open]>.lx-hub-week-summary{border-bottom:1px solid #dfe6ea;border-radius:10px 10px 0 0}
.lx-hub-week-summary::-webkit-details-marker{display:none}
.lx-hub-week-summary::marker{display:none}
.lx-hub-chip{display:inline-block;background:var(--lx-primary,#1f6fb2);color:#fff;padding:3px 10px;border-radius:999px;font-size:.78em;font-weight:800;white-space:nowrap;flex-shrink:0}
.lx-hub-week-num{font-size:.8em;font-weight:800;color:#6F7B84;white-space:nowrap;flex-shrink:0}
.lx-hub-week-title{font-weight:700;color:#1F2A33;flex:1}
.lx-hub-body{padding:14px 16px}
.lx-hub-focus{margin-bottom:10px;padding:10px 12px;border-radius:8px;border-left:4px solid var(--lx-accent,#25797F);background:#f4f6f8;font-size:.93em}
.lx-hub-announce{margin-bottom:10px;padding:10px 12px;border-radius:8px;border-left:4px solid var(--lx-primary,#1f6fb2);background:#f4f6f8;font-size:.93em}
.lx-hub-tasks{margin:8px 0 0 0;padding-left:18px;font-size:.93em}
.lx-hub-tasks li{margin:5px 0}
.lx-hub-coming{font-size:.88em;color:#6F7B84;font-style:italic}`;

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

const KEY_INFO_CSS = `
.lx-ki{max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33}
.lx-ki-banner{width:100%;border-radius:12px;margin-bottom:18px;display:block;max-height:200px;object-fit:cover}
.lx-ki-banner-ph{border-radius:12px;margin-bottom:18px;padding:28px 24px;background:var(--lx-primary,#1f6fb2);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80px;text-align:center}
.lx-ki-links{display:flex;flex-direction:column;gap:10px;margin-bottom:18px}
.lx-ki-link{display:block;text-align:center;padding:10px 16px;border-radius:8px;font-weight:700;text-decoration:none;border:1px solid #6c757d;background:#6c757d;color:#fff;transition:background .15s,border-color .15s;font-family:Arial,sans-serif;font-size:.95em}
.lx-ki-link:hover{background:#5a6268;border-color:#545b62;color:#fff}
.lx-ki-link.disabled{opacity:.55;pointer-events:none}
.lx-ki-due-chip{display:inline-block;padding:3px 10px;border-radius:999px;font-size:.8em;font-weight:700}
.lx-ki-green{background:#d4edda;color:#155724}
.lx-ki-amber{background:#fff3cd;color:#856404}
.lx-ki-red{background:#f8d7da;color:#721c24}
.lx-ki-grey{background:#e2e3e5;color:#383d41}
.lx-ki-teal{background:#d0f0ec;color:#0e5a52}
.lx-ki-callout{margin-top:14px;padding:14px 16px;border-radius:10px;border:1px solid #b2dfdb;border-left:6px solid #26a69a;background:#e0f2f1;font-size:.93em;line-height:1.5}
.lx-ki-callout-label{font-size:.78em;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:#0e5a52;margin-bottom:6px}
.lx-ki-contacts{margin-bottom:18px;border:1px solid var(--lx-pill-border,#cbe6ee);border-radius:10px;overflow:hidden}
.lx-ki-contacts>summary{padding:10px 14px;font-size:.9em;font-weight:700;color:var(--lx-primary,#1f6fb2);cursor:pointer;list-style:none;user-select:none}
.lx-ki-contacts>summary::-webkit-details-marker{display:none}
.lx-ki-contacts-body{padding:4px 14px 10px 26px}
.lx-ki-contact{padding:8px 0}
.lx-ki-contact+.lx-ki-contact{border-top:1px solid #dfe6ea}
.lx-ki-contact-role{font-size:.75em;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:#6F7B84;margin-bottom:2px}
.lx-ki-contact-name{font-weight:700;font-size:.93em}
.lx-ki-contact-email{font-size:.88em;margin-top:2px}
.lx-ki-contact-email a{color:var(--lx-primary,#1f6fb2);text-decoration:none}
.lx-ki-contact-email a:hover{text-decoration:underline}`;

const ASSESSMENT_STATUS_CSS = `
.lx-as{max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33}
.lx-as-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.lx-as-card{border:1px solid #dfe6ea;border-radius:14px;padding:18px;background:#fff}
.lx-as-title{font-weight:900;font-size:1em;margin:0 0 6px}
.lx-as-meta{font-size:.85em;color:#6F7B84;margin-bottom:10px}
.lx-as-status{display:inline-block;padding:4px 12px;border-radius:999px;font-size:.82em;font-weight:700;margin-bottom:10px}
.lx-as-green{background:#d4edda;color:#155724}
.lx-as-amber{background:#fff3cd;color:#856404}
.lx-as-red{background:#f8d7da;color:#721c24}
.lx-as-teal{background:#d0f0ec;color:#0e5a52}
.lx-as-grey{background:#e2e3e5;color:#383d41}
.lx-as-lo-row{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}
.lx-as-lo-pill{display:inline-block;padding:3px 8px;border-radius:999px;font-size:.78em;font-weight:700;color:#fff}
.lx-as-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.lx-as-action{display:inline-block;padding:6px 10px;border-radius:999px;font-size:.82em;font-weight:700;text-decoration:none;border:1px solid #dfe6ea;background:#f4f6f8;color:#1F2A33}
.lx-as-action:hover{text-decoration:underline}
.lx-as-action.submit{background:#e8f5e9;border-color:#27ae60;color:#155724}
.lx-as-action.primary{background:var(--lx-pill,#DAF0F7);border-color:var(--lx-pill-border,#cbe6ee);color:var(--lx-primary,#1f6fb2)}`;

const ORIENTATION_NOTE_CSS = `
.lx-on{max-width:950px;margin:0 auto 20px;font-family:Arial,sans-serif}
.lx-on-inner{background:#f0f7ff;border-left:4px solid var(--lx-primary,#1f6fb2);border-radius:8px;padding:12px 16px}
.lx-on-label{font-size:.75em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--lx-primary,#1f6fb2);margin-bottom:6px}
.lx-on-text{margin:0;font-size:.95em;color:#2c3e50;line-height:1.55}`;

const FORUM_PROMPTS_CSS = `
.lx-fp{max-width:950px;margin:0 auto 20px;font-family:Arial,sans-serif}
.lx-fp-inner{background:#f9f9f9;border:1px solid #dde2e5;border-radius:8px;padding:14px 16px}
.lx-fp-label{font-size:.75em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--lx-accent,#25797F);margin-bottom:10px}
.lx-fp-list{list-style:none;margin:0;padding:0}
.lx-fp-item{display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;font-size:.95em;line-height:1.5}
.lx-fp-item:last-child{margin-bottom:0}
.lx-fp-num{background:var(--lx-primary,#1f6fb2);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.78em;font-weight:700;flex-shrink:0;margin-top:2px}`;

const WORKED_EXAMPLE_CSS = `
.lx-we{max-width:950px;margin:0 auto 20px;font-family:Arial,sans-serif}
.lx-we-details{border:1px solid var(--lx-pill-border,#cbe6ee);border-radius:8px}
.lx-we-details summary{padding:12px 16px;cursor:pointer;font-weight:700;color:var(--lx-primary,#1f6fb2);list-style:none;background:var(--lx-pill,#DAF0F7);border-radius:8px;font-size:.95em;display:flex;align-items:center;gap:8px}
.lx-we-details summary::-webkit-details-marker{display:none}
.lx-we-details summary::before{content:'▶';font-size:.75em;opacity:.7}
.lx-we-details[open] summary::before{content:'▼'}
.lx-we-details[open] summary{border-radius:8px 8px 0 0}
.lx-we-body{padding:14px 16px;font-size:.95em;color:#2c3e50;line-height:1.6}
.lx-we-body p{margin:0 0 10px}
.lx-we-body p:last-child{margin-bottom:0}`;

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

  let weekNum = forWeek != null ? Number(forWeek) : null;
  if (weekNum == null) {
    const today = forDate ? new Date(forDate) : new Date();
    today.setHours(0, 0, 0, 0);
    weekNum = calcCurrentWeek(today, buildDateList(new Date(startDate), forTri));
  }

  const week = unitCfg.weeks[String(weekNum)] ?? null;
  const triZoom = unitCfg.trimesterConfig?.[triKey]?.zoom ?? null;
  const zoomUrl = triZoom?.url ?? week?.links?.zoom ?? null;
  const zoom = triZoom ? { ...triZoom, url: zoomUrl } : (zoomUrl ? { url: zoomUrl } : null);

  return { unitCfg, triCfg, week, weekNum, triKey, startDate, zoom };
}

// ── Assessment reminder builder (shared) ──────────────────────────────────────

function formatDateAU(d) {
  return new Date(d).toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateShort(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
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

export async function renderAssessmentPage({ forUnit, forTask, forTri, forYear } = {}) {
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

  const loMap    = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));
  const lnk      = task.links ?? {};
  const triKey   = forTri && forYear ? `${forTri}-${forYear}` : null;
  const triDates = triKey ? (task.trimesterDates?.[triKey] ?? {}) : {};
  const fp       = triDates.flexiblePortal ?? null;
  const parts    = task.parts ?? [];
  const sections = [];

  // Header pill + title
  sections.push(
    `<div style="display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);padding:4px 10px;border-radius:999px;font-size:.8em;font-weight:800;margin-bottom:12px;">${esc(unitCfg.code)} • ${esc(task.id)}</div>` +
    `<h2 style="margin:0 0 16px;">${esc(task.title)}</h2>`
  );

  // ── Section 1: At a glance ─────────────────────────────────────────────────
  const flexLabel = fp ? (fp.label ?? `Flexible portal: ${fp.closesDate}`) : null;
  const metaPills = [
    triDates.due   ? `Due: ${esc(formatDateAU(triDates.due))}` : null,
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
      const guidanceHtml = (p.guidanceNotes ?? []).length
        ? `<div style="margin:10px 0;"><hr style="border:none;border-top:1px solid #e0e0e0;margin:8px 0;"><div style="font-size:.85em;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--lx-accent,#e8522a);margin-bottom:6px;">Additional guidance</div>${p.guidanceNotes.map(n => `<p style="font-size:.9em;margin:4px 0;">→ ${esc(n)}</p>`).join('')}</div>`
        : '';
      const marksNote = p.marks != null ? ` (${p.marks} marks)` : '';
      const wordNote  = p.wordCount ? ` <span style="font-weight:400;">| ~${p.wordCount} words</span>` : '';
      return `<details class="lx-ap-details">
        <summary>Part ${esc(p.id)} — ${esc(p.title)}${marksNote}${wordNote}</summary>
        <div class="lx-ap-part-body">
          ${p.description ? `<p style="margin-top:0;">${esc(p.description)}</p>` : ''}
          ${bespokeHtml}${noteHtml}${reqHtml}${critiqueHtml}${resHtml}${guidanceHtml}
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

// ─────────────────────────────────────────────────────────────────────────────
// 9. renderPresubmissionChecklist
// Container: <div id="lxdune-presubmission-checklist"></div>
// Fetches templates/presubmission-checklist-{UNIT}-{TASK}.html and wraps it
// in a collapsible <details> section. Scripts are re-executed after injection.
// ─────────────────────────────────────────────────────────────────────────────

const CHECKLIST_CSS = `
.lx-cl-wrap{border:1px solid #dfe6ea;border-radius:12px;margin:16px 0;overflow:hidden;font-family:Arial,sans-serif;}
.lx-cl-wrap>summary{cursor:pointer;list-style:none;padding:14px 16px;font-weight:900;background:#f4f6f8;font-size:1.05em;display:flex;align-items:center;gap:8px;}
.lx-cl-wrap>summary::-webkit-details-marker{display:none;}
.lx-cl-wrap[open]>summary{border-bottom:1px solid #dfe6ea;}
.lx-cl-wrap>.lx-cl-body{padding:16px 0;}`;

export async function renderPresubmissionChecklist({ forUnit, forTask } = {}) {
  const el = getEl('lxdune-presubmission-checklist');
  if (!el) return;

  let unitCfg;
  try {
    unitCfg = await fetchJson(`${BASE}config/units/${forUnit}.json`);
  } catch (e) {
    setError(el, `Could not load content: ${e.message}`);
    return;
  }
  applyTheme(unitCfg);
  injectStyles('lx-cl-wrap-styles', CHECKLIST_CSS);

  let checklistHtml;
  try {
    const res = await fetch(`${BASE}templates/presubmission-checklist-${forUnit}-${forTask}.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    checklistHtml = await res.text();
  } catch {
    el.innerHTML = `<div style="padding:14px 16px;border:1px solid #dfe6ea;border-radius:8px;font-family:Arial,sans-serif;color:#6F7B84;">Pre-submission checklist not yet available for ${esc(forUnit)} ${esc(forTask)}.</div>`;
    return;
  }

  el.innerHTML = `<details class="lx-cl-wrap">
    <summary>📋 Pre-Submission Checklist — Review before submitting</summary>
    <div class="lx-cl-body">${checklistHtml}</div>
  </details>`;

  // Scripts injected via innerHTML don't execute — recreate each one
  el.querySelectorAll('script').forEach(old => {
    const s = document.createElement('script');
    s.textContent = old.textContent;
    old.replaceWith(s);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. renderCourseHub
// Container: <div data-lx-block="course-hub"></div>
// Renders all weeks as CSS-only collapsible <details>/<summary> rows.
// ─────────────────────────────────────────────────────────────────────────────

export async function renderCourseHub({ forUnit, forTri, forYear } = {}) {
  const el = document.querySelector('div[data-lx-block="course-hub"]');
  if (!el) return;

  let unitCfg;
  try {
    unitCfg = await fetchJson(`${BASE}config/units/${forUnit}.json`);
  } catch (e) {
    setError(el, `Could not load content: ${e.message}`);
    return;
  }

  applyTheme(unitCfg);
  injectStyles('lx-hub', HUB_CSS);

  const weeks = unitCfg.weeks ?? {};
  const weekNums = Object.keys(weeks)
    .map(Number)
    .filter(n => n >= 1 && !NO_TEACHING.has(n))
    .sort((a, b) => a - b);

  const rows = weekNums.map(n => {
    const week = weeks[String(n)];
    const itemLabel = week.item ? esc(week.item) : `Week ${n}`;
    const title     = week.title ? esc(week.title) : '';

    // Body parts
    const bodyParts = [];

    const ab = week.announcementBody ?? null;
    const intro = typeof ab === 'object' && ab !== null ? (ab.intro ?? null) : (typeof ab === 'string' ? ab : null);
    if (intro) {
      bodyParts.push(`<div class="lx-hub-announce">${esc(intro)}</div>`);
    }

    if (week.liveSessionFocus) {
      bodyParts.push(`<div class="lx-hub-focus">${esc(week.liveSessionFocus)}</div>`);
    }

    const tasks = Array.isArray(week.liveSessionTasks) ? week.liveSessionTasks : [];
    if (tasks.length) {
      const items = tasks.map(t => `<li>${esc(t)}</li>`).join('');
      bodyParts.push(`<ul class="lx-hub-tasks">${items}</ul>`);
    }

    const body = bodyParts.length
      ? bodyParts.join('\n')
      : `<p class="lx-hub-coming">Content coming soon.</p>`;

    return `<details class="lx-hub-week">
      <summary class="lx-hub-week-summary">
        <span class="lx-hub-chip">${itemLabel}</span>
        <span class="lx-hub-week-num">Week ${n}</span>
        ${title ? `<span class="lx-hub-week-title">${title}</span>` : ''}
      </summary>
      <div class="lx-hub-body">${body}</div>
    </details>`;
  }).join('\n');

  el.innerHTML = `<div class="lx-hub">
    <div class="lx-hub-pill">${esc(unitCfg.code)} • Course Hub</div>
    <h2>Course Hub — All Weeks</h2>
    ${rows || '<p style="color:#6F7B84;">No weekly content configured yet.</p>'}
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. renderUnitKeyInfo
// Container: <div id="lxdune-unit-key-info"></div>
// Reads bannerUrl, keyLinks, assessmentTasks, supportCallout from unitCfg.
// ─────────────────────────────────────────────────────────────────────────────

export async function renderUnitKeyInfo({ forUnit, forTri, forYear } = {}) {
  const el = getEl('lxdune-unit-key-info');
  if (!el) return;

  let unitCfg;
  try {
    unitCfg = await fetchJson(`${BASE}config/units/${forUnit}.json`);
  } catch (e) {
    setError(el, `Could not load content: ${e.message}`);
    return;
  }

  applyTheme(unitCfg);
  injectStyles('lx-ki-styles', KEY_INFO_CSS);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sections = [];

  // Banner or placeholder
  if (unitCfg.bannerUrl) {
    sections.push(`<img class="lx-ki-banner" src="${esc(unitCfg.bannerUrl)}" alt="${esc(unitCfg.code)} banner">`);
  } else {
    sections.push(`<div class="lx-ki-banner-ph">
      <div style="font-size:1.6em;font-weight:900;letter-spacing:1px;">${esc(unitCfg.code)}</div>
      <div style="font-size:.95em;margin-top:4px;opacity:.85;">${esc(unitCfg.name ?? '')}</div>
    </div>`);
  }

  // Key links (Bootstrap-style btn btn-secondary btn-block)
  const keyLinks = unitCfg.keyLinks ?? [];
  if (keyLinks.length) {
    const btnHtml = keyLinks.map(l => {
      if (l.url) {
        const target = l.external !== false ? ' target="_blank" rel="noopener"' : '';
        return `<a class="lx-ki-link" href="${esc(l.url)}"${target}>${esc(l.label)}</a>`;
      }
      return `<span class="lx-ki-link disabled">${esc(l.label)}</span>`;
    }).join('');
    sections.push(`<div class="lx-ki-links">${btnHtml}</div>`);
  }

  // Contacts
  const contacts = unitCfg.contacts ?? {};
  const coord = contacts.coordinator ?? null;
  const lect  = contacts.lecturer  ?? null;
  const hasCoord = coord !== null && (coord.name !== null || coord.email !== null);
  const hasLect  = lect  !== null && (lect.name  !== null || lect.email  !== null);
  if (hasCoord || hasLect) {
    const contactRow = (roleLabel, c) => {
      const name  = c?.name  ? `<div class="lx-ki-contact-name">${esc(c.name)}</div>`
                              : `<div class="lx-ki-contact-name" style="color:#6F7B84;">TBC</div>`;
      const email = c?.email ? `<div class="lx-ki-contact-email"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>` : '';
      return `<div class="lx-ki-contact"><div class="lx-ki-contact-role">${esc(roleLabel)}</div>${name}${email}</div>`;
    };
    const rows = (hasCoord && !hasLect) ? contactRow('Unit Coordinator / Lecturer', coord)
               : (hasCoord && hasLect)  ? contactRow('Unit Coordinator', coord) + contactRow('Lecturer', lect)
               :                          contactRow('Lecturer', lect);
    sections.push(`<details class="lx-ki-contacts">
      <summary>Unit Coordinator / Lecturer</summary>
      <div class="lx-ki-contacts-body">${rows}</div>
    </details>`);
  }

  // Due dates from assessmentTasks
  const triKey = `${forTri}-${forYear}`;
  const tasks = unitCfg.assessmentTasks ?? [];
  const dueDates = tasks.map(t => {
    const triDates = t.trimesterDates?.[triKey] ?? {};
    const dueStr = triDates.due ?? null;
    if (!dueStr) return null;
    const due = new Date(dueStr + 'T00:00:00');
    const days = Math.round((due - today) / 86400000);
    const fp = triDates.flexiblePortal ?? null;

    let chipClass, chipText;
    if (days < 0) {
      const fpStillOpen = fp?.closesDate && new Date(fp.closesDate + 'T00:00:00') >= today;
      if (fpStillOpen) { chipClass = 'lx-ki-teal'; chipText = 'Flexible portal open'; }
      else             { chipClass = 'lx-ki-grey'; chipText = 'Submitted'; }
    } else if (days === 0) {
      chipClass = 'lx-ki-red'; chipText = 'Due today';
    } else if (fp?.opensDate && new Date(fp.opensDate + 'T00:00:00') <= today) {
      chipClass = 'lx-ki-teal'; chipText = 'Flexible portal open';
    } else if (days > 14) {
      chipClass = 'lx-ki-green'; chipText = `Due in ${days} days`;
    } else if (days >= 7) {
      chipClass = 'lx-ki-amber'; chipText = `Due in ${days} days`;
    } else {
      chipClass = 'lx-ki-red'; chipText = `Due in ${days} days`;
    }

    const showPortalLink = fp?.url && (
      days < 0
        ? (fp.closesDate && new Date(fp.closesDate + 'T00:00:00') >= today)
        : (fp.opensDate  && new Date(fp.opensDate  + 'T00:00:00') <= today)
    );
    const portalLink = showPortalLink
      ? ` <a href="${esc(fp.url)}" target="_blank" rel="noopener" style="font-size:.85em;color:var(--lx-primary,#1f6fb2);font-weight:700;">Open portal</a>`
      : '';

    return `<div style="padding:10px 0;border-bottom:1px solid #dfe6ea;display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
      <strong style="flex:1;min-width:100px;">${esc(t.id)}</strong>
      <span style="font-size:.88em;color:#6F7B84;">${formatDateShort(dueStr)}</span>
      <span class="lx-ki-due-chip ${chipClass}">${esc(chipText)}</span>
      ${portalLink}
    </div>`;
  }).filter(Boolean);

  if (dueDates.length) {
    sections.push(`<div style="margin-bottom:14px;">
      <div style="font-size:.78em;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:#6F7B84;margin-bottom:6px;">Assessment Due Dates</div>
      ${dueDates.join('')}
    </div>`);
  }

  // Support callout
  if (unitCfg.supportCallout) {
    sections.push(`<div class="lx-ki-callout">
      <div class="lx-ki-callout-label">Support</div>
      ${esc(unitCfg.supportCallout)}
    </div>`);
  }

  el.innerHTML = `<div class="lx-ki">${sections.join('\n')}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. renderAssessmentStatus
// Container: <div id="lxdune-assessment-status"></div>
// Renders one card per assessmentTask with status chip, LO pills, action pills.
// ─────────────────────────────────────────────────────────────────────────────

export async function renderAssessmentStatus({ forUnit, forTri, forYear } = {}) {
  const el = getEl('lxdune-assessment-status');
  if (!el) return;

  let unitCfg;
  try {
    unitCfg = await fetchJson(`${BASE}config/units/${forUnit}.json`);
  } catch (e) {
    setError(el, `Could not load content: ${e.message}`);
    return;
  }

  applyTheme(unitCfg);
  injectStyles('lx-as-styles', ASSESSMENT_STATUS_CSS);

  const tasks = unitCfg.assessmentTasks ?? [];
  if (!tasks.length) {
    el.innerHTML = `<div style="padding:14px 16px;border:1px solid #dfe6ea;border-radius:8px;font-family:Arial,sans-serif;color:#6F7B84;">No assessment tasks configured for ${esc(forUnit)}.</div>`;
    return;
  }

  const triKey = `${forTri}-${forYear}`;
  const loMap = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cards = tasks.map(task => {
    const triDates = task.trimesterDates?.[triKey] ?? {};
    const dueStr = triDates.due ?? null;
    const due  = dueStr ? new Date(dueStr + 'T00:00:00') : null;
    const days = due ? Math.round((due - today) / 86400000) : null;
    const fp   = triDates.flexiblePortal ?? null;

    // Status chip
    let statusClass, statusText;
    if (days === null) {
      statusClass = 'lx-as-grey'; statusText = 'Date TBC';
    } else if (days < 0) {
      const fpStillOpen = fp?.closesDate && new Date(fp.closesDate + 'T00:00:00') >= today;
      if (fpStillOpen) { statusClass = 'lx-as-teal'; statusText = 'Flexible portal open'; }
      else             { statusClass = 'lx-as-grey'; statusText = 'Submitted / period closed'; }
    } else if (days === 0) {
      statusClass = 'lx-as-red'; statusText = 'Due today';
    } else if (fp?.opensDate && new Date(fp.opensDate + 'T00:00:00') <= today) {
      statusClass = 'lx-as-teal'; statusText = 'Flexible portal open';
    } else if (days > 14) {
      statusClass = 'lx-as-green'; statusText = `Due in ${days} days`;
    } else if (days >= 7) {
      statusClass = 'lx-as-amber'; statusText = `Due in ${days} days`;
    } else {
      statusClass = 'lx-as-red'; statusText = `Due in ${days} days`;
    }

    // Meta line
    const metaParts = [
      dueStr         ? formatDateShort(dueStr)   : null,
      task.weighting ? `${task.weighting}%`      : null,
      task.length    ? esc(task.length)           : null,
    ].filter(Boolean);

    // LO pills
    const loPills = (task.learningOutcomes ?? []).map(id => {
      const lo    = loMap[id];
      const color = lo?.color ?? '#6F7B84';
      return `<span class="lx-as-lo-pill" style="background:${color};">${esc(id)}</span>`;
    }).join('');

    // Action pills
    const lnk     = task.links ?? {};
    const actions  = [];
    if (lnk.rubric)    actions.push(`<a class="lx-as-action primary" href="${esc(lnk.rubric)}" target="_blank" rel="noopener">Rubric</a>`);
    if (lnk.taskFiles) actions.push(`<a class="lx-as-action primary" href="${esc(lnk.taskFiles)}" target="_blank" rel="noopener">Task files</a>`);
    if (lnk.submit)    actions.push(`<a class="lx-as-action submit" href="${esc(lnk.submit)}" target="_blank" rel="noopener">Submit</a>`);

    const fpPortalVisible = fp?.url && (
      days !== null && (
        days < 0
          ? (fp.closesDate && new Date(fp.closesDate + 'T00:00:00') >= today)
          : (fp.opensDate  && new Date(fp.opensDate  + 'T00:00:00') <= today)
      )
    );
    if (fpPortalVisible) {
      actions.push(`<a class="lx-as-action" style="background:#d0f0ec;border-color:#b2dfdb;color:#0e5a52;" href="${esc(fp.url)}" target="_blank" rel="noopener">Flexible portal</a>`);
    }
    if (lnk.forum) actions.push(`<a class="lx-as-action" href="${esc(lnk.forum)}" target="_blank" rel="noopener">Q&amp;A forum</a>`);

    return `<div class="lx-as-card">
      <div class="lx-as-title">${esc(task.id)} — ${esc(task.title)}</div>
      ${metaParts.length ? `<div class="lx-as-meta">${metaParts.join(' · ')}</div>` : ''}
      <span class="lx-as-status ${statusClass}">${esc(statusText)}</span>
      ${loPills ? `<div class="lx-as-lo-row">${loPills}</div>` : ''}
      ${actions.length ? `<div class="lx-as-actions">${actions.join('')}</div>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = `<div class="lx-as">
    <div style="display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);padding:4px 10px;border-radius:999px;font-size:.8em;font-weight:800;margin-bottom:12px;">${esc(unitCfg.code)} • Assessment Status</div>
    <h2 style="margin:0 0 16px;">Assessment Overview</h2>
    <div class="lx-as-grid">${cards}</div>
  </div>`;
}

// ── 13. renderOrientationNote ─────────────────────────────────────────────────
export async function renderOrientationNote({ forUnit, forTri, forYear }) {
  const el = getEl('lxdune-orientation-note'); if (!el) return;
  try {
    const { unitCfg, week } = await resolve({ forUnit, forTri, forYear });
    applyTheme(unitCfg);
    const note = week?.orientationNote;
    if (!note) { el.innerHTML = ''; return; }
    injectStyles('lx-orientation-note', ORIENTATION_NOTE_CSS);
    el.innerHTML = `<div class="lx-on"><div class="lx-on-inner">
      <div class="lx-on-label">Unit context</div>
      <p class="lx-on-text">${esc(note)}</p>
    </div></div>`;
  } catch (e) {
    setError(el, e);
  }
}

// ── 14. renderForumPrompts ────────────────────────────────────────────────────
export async function renderForumPrompts({ forUnit, forTri, forYear }) {
  const el = getEl('lxdune-forum-prompts'); if (!el) return;
  try {
    const { unitCfg, week } = await resolve({ forUnit, forTri, forYear });
    applyTheme(unitCfg);
    const prompts = week?.forumPrompts ?? [];
    if (!prompts.length) { el.innerHTML = ''; return; }
    injectStyles('lx-forum-prompts', FORUM_PROMPTS_CSS);
    const items = prompts.map((p, i) =>
      `<li class="lx-fp-item"><span class="lx-fp-num">${i + 1}</span><span>${esc(p)}</span></li>`
    ).join('');
    el.innerHTML = `<div class="lx-fp"><div class="lx-fp-inner">
      <div class="lx-fp-label">Forum discussion prompts</div>
      <ul class="lx-fp-list">${items}</ul>
    </div></div>`;
  } catch (e) {
    setError(el, e);
  }
}

// ── 15. renderWorkedExample ───────────────────────────────────────────────────
export async function renderWorkedExample({ forUnit, forTri, forYear }) {
  const el = getEl('lxdune-worked-example'); if (!el) return;
  try {
    const { unitCfg, week } = await resolve({ forUnit, forTri, forYear });
    applyTheme(unitCfg);
    const example = week?.workedExample;
    if (!example) { el.innerHTML = ''; return; }
    injectStyles('lx-worked-example', WORKED_EXAMPLE_CSS);
    const paras = example.split('\n').filter(Boolean).map(s => `<p>${esc(s)}</p>`).join('');
    el.innerHTML = `<div class="lx-we"><details class="lx-we-details">
      <summary>Worked example</summary>
      <div class="lx-we-body">${paras}</div>
    </details></div>`;
  } catch (e) {
    setError(el, e);
  }
}
