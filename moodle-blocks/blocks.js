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
.lx-hub-week-summary{cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;display:flex;flex-direction:column;gap:0;background:#f4f6f8;border-radius:10px}
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
.lx-hub-coming{font-size:.88em;color:#6F7B84;font-style:italic}
.lx-hub-summary-top{display:flex;align-items:center;gap:10px;width:100%}
.lx-hub-lo-pills{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;margin-bottom:2px}
.lx-hub-lo-pill{display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;white-space:nowrap}`;

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

  let weekNum = forWeek != null ? (isNaN(Number(forWeek)) ? String(forWeek) : Number(forWeek)) : null;
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

export async function renderAnnouncementBlock({ forUnit, forTri, forYear, forWeek, forDate, containerId = 'lxdune-announcement' } = {}) {
  const el = document.getElementById(containerId);
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
  } else if (week.topics?.length) {
    // ── Multi-topic weeks: one <details>/<summary> per topic ──────────────────
    const topics = week.topics;
    const topicDetails = topics.map((topic, idx) => {
      const hasIntro  = topic.announcementBody?.intro  != null;
      const hasFocus  = topic.announcementBody?.focus  != null;
      const hasContent = hasIntro || hasFocus;
      const livePrefix = topic.live != null ? `🎤 ` : '';
      const summaryLabel = `${livePrefix}${esc(topic.title)}`;
      const bodyHtml = [
        hasIntro ? `<p style="margin:0 0 10px;">${esc(topic.announcementBody.intro)}</p>` : '',
        hasFocus ? `<div style="margin:10px 0 0;padding:12px 14px;border:1px solid #dfe6ea;border-left:4px solid var(--lx-accent,#25797F);border-radius:6px;background:#f9f9f9;">
          <div style="font-size:.8em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--lx-accent,#25797F);margin-bottom:6px;">Focus</div>
          <p style="margin:0;">${esc(topic.announcementBody.focus)}</p>
        </div>` : '',
      ].join('');
      // Open the first topic that has content; collapse all if none do
      const openAttr = (idx === 0 && hasContent) ? ' open' : '';
      return `<details style="margin:10px 0;border:1px solid #dfe6ea;border-radius:8px;overflow:hidden;"${openAttr}>
        <summary style="cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;background:#f4f6f8;border-radius:8px;">${summaryLabel}</summary>
        <div style="padding:14px 16px;">${bodyHtml}</div>
      </details>`;
    }).join('');

    const sections = [];
    sections.push(`<div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid var(--lx-primary,#1f6fb2);border-radius:8px;background:#f4f6f8;">
      <h3 style="margin:0 0 8px 0;">${esc(week.item)} — ${esc(week.title)}</h3>
    </div>`);
    sections.push(topicDetails);

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

    const topicsPrompts = topics.flatMap(t => t.forumPrompts ?? []);
    if (week.links?.forum || topicsPrompts.length) {
      const promptList = topicsPrompts.length
        ? `<ol style="margin:10px 0 0 18px;">${topicsPrompts.map(p => `<li style="margin:6px 0;">${esc(p)}</li>`).join('')}</ol>`
        : `<p style="margin:8px 0 0;">After engaging with the materials, post a short reflection to the ${esc(week.item)} forum.</p>`;
      sections.push(`<div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid var(--lx-accent,#25797F);border-radius:8px;background:#f4f6f8;">
        <h4 style="margin:0 0 6px 0;">Forum Discussion</h4>
        ${promptList}
        ${week.links?.forum ? `<p style="margin:10px 0 0;"><a href="${esc(week.links.forum)}" target="_blank" style="color:var(--lx-primary,#1f6fb2);font-weight:600;">Go to Forum</a></p>` : ''}
      </div>`);
    }

    sections.push(`<p>I look forward to our discussion this week.</p>`);
    html = `<div style="font-family:Arial,sans-serif;color:#1F2A33;line-height:1.5;max-width:800px;margin:0 auto;">${sections.join('\n')}</div>`;
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

    const flatPrompts = week.forumPrompts ?? [];
    if (week.links?.forum || flatPrompts.length) {
      const promptList = flatPrompts.length
        ? `<ol style="margin:10px 0 0 18px;">${flatPrompts.map(p => `<li style="margin:6px 0;">${esc(p)}</li>`).join('')}</ol>`
        : `<p style="margin:8px 0 0;">After engaging with the materials, post a short reflection to the ${esc(week.item)} forum.</p>`;
      sections.push(`<div style="margin:16px 0;padding:16px;border:1px solid #dfe6ea;border-left:6px solid var(--lx-accent,#25797F);border-radius:8px;background:#f4f6f8;">
        <h4 style="margin:0 0 6px 0;">Forum Discussion</h4>
        ${promptList}
        ${week.links?.forum ? `<p style="margin:10px 0 0;"><a href="${esc(week.links.forum)}" target="_blank" style="color:var(--lx-primary,#1f6fb2);font-weight:600;">Go to Forum</a></p>` : ''}
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

export async function renderWorkflowCard({ forUnit, forTri, forYear, forWeek, forDate, containerId = 'lxdune-workflow' } = {}) {
  const el = document.getElementById(containerId);
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

export async function renderLectureBlock({ forUnit, forTri, forYear, forWeek, forDate, containerId = 'lxdune-lecture' } = {}) {
  const el = document.getElementById(containerId);
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

export async function renderLiveSessionHub({ forUnit, forTri, forYear, forWeek, forDate, containerId = 'lxdune-live-hub' } = {}) {
  const el = document.getElementById(containerId);
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
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. renderAssessmentDownloadBlock
// Container: <div id="lxdune-assessment-downloads"></div>
// Reads from unit.trimesterConfig[triKey].assessmentFiles
// ─────────────────────────────────────────────────────────────────────────────

export async function renderAssessmentDownloadBlock({ forUnit, forTri, forYear, containerId = 'lxdune-assessment-downloads' } = {}) {
  const el = document.getElementById(containerId);
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

export async function renderLearningOutcomesTable({ forUnit, forTri, forYear, containerId = 'lxdune-outcomes' } = {}) {
  const el = document.getElementById(containerId);
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

  // Build reverse map: loId → teaching week objects (weeks 1–8 only)
  const weeks = unitCfg.weeks ?? {};
  const loToWeeks = {};
  for (const [k, w] of Object.entries(weeks)) {
    const n = Number(k);
    if (n < 1 || n > 8) continue;
    for (const id of (w.loMapping ?? [])) {
      (loToWeeks[id] = loToWeeks[id] ?? []).push(w);
    }
  }

  // Build reverse map: loId → assessment pill labels
  // Part-level references take priority over task-level for the same task.
  const loToAssess = {};
  for (const task of (unitCfg.assessmentTasks ?? [])) {
    const taskLos = new Set(task.learningOutcomes ?? []);
    const partsByLo = {};
    for (const part of (task.parts ?? [])) {
      for (const id of (part.loLinks ?? [])) {
        (partsByLo[id] = partsByLo[id] ?? []).push(part);
      }
    }
    // Collect: part-level if any, else task-level
    const allLoIds = new Set([...taskLos, ...Object.keys(partsByLo)]);
    for (const id of allLoIds) {
      if (partsByLo[id]?.length) {
        for (const part of partsByLo[id]) {
          (loToAssess[id] = loToAssess[id] ?? []).push(`${task.id} Part ${part.id}`);
        }
      } else if (taskLos.has(id)) {
        (loToAssess[id] = loToAssess[id] ?? []).push(task.id);
      }
    }
  }

  // Hex → rgba helper
  function hexRgba(hex, alpha) {
    const h = (hex ?? '#888888').replace('#', '');
    const r = parseInt(h.slice(0,2), 16) || 128;
    const g = parseInt(h.slice(2,4), 16) || 128;
    const b = parseInt(h.slice(4,6), 16) || 128;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const rows = los.map(lo => {
    const name = lo.label ?? lo.title ?? '';
    const standards = Array.isArray(lo.aitsl)
      ? lo.aitsl.join(', ')
      : (lo.gtsd ?? '');
    const stdLabel = Array.isArray(lo.aitsl) ? 'AITSL' : 'GTSD';

    // Teaching week pills
    const weekItems = loToWeeks[lo.id] ?? [];
    const weekPillsHtml = weekItems.length
      ? weekItems.map(w => `<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${hexRgba(lo.color,0.15)};color:${esc(lo.color)};border:1px solid ${hexRgba(lo.color,0.35)};">${esc(w.item ?? 'Week')}</span>`).join(' ')
      : `<span style="color:#6F7B84;font-size:.88em;font-style:italic;">No teaching weeks currently mapped to this outcome.</span>`;

    // Assessment pills
    const assessRefs = loToAssess[lo.id] ?? [];
    const assessPillsHtml = assessRefs.length
      ? assessRefs.map(label => `<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${hexRgba(lo.color,0.1)};color:${esc(lo.color)};border:1px solid ${hexRgba(lo.color,0.25)};">${esc(label)}</span>`).join(' ')
      : `<span style="color:#6F7B84;font-size:.88em;font-style:italic;">Not directly assessed in a named criterion.</span>`;

    const reverseMap = `<details style="margin-top:8px;">
      <summary style="font-size:.82em;font-weight:700;color:${esc(lo.color)};cursor:pointer;list-style:none;display:inline-block;user-select:none;">Where this outcome is developed ▸</summary>
      <div style="margin-top:8px;padding:10px 12px;border-radius:8px;border-left:3px solid ${hexRgba(lo.color,0.4)};background:${hexRgba(lo.color,0.05)};">
        <div style="font-size:.8em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6F7B84;margin-bottom:6px;">Teaching weeks</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">${weekPillsHtml}</div>
        <div style="font-size:.8em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6F7B84;margin-bottom:6px;">Assessment</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${assessPillsHtml}</div>
      </div>
    </details>`;

    return `<tr id="${esc(lo.id)}" style="border-top:2px solid ${esc(lo.color)};">
    <td style="width:110px;padding:12px;vertical-align:top;">
      <span style="background:${esc(lo.color)};color:white;padding:6px 10px;border-radius:999px;font-weight:bold;">${esc(lo.id)}</span>
    </td>
    <td style="padding:12px;">
      <strong>${esc(name)}</strong><br>
      ${esc(lo.description)}<br>
      <em>${esc(stdLabel)} ${esc(standards)}</em>
      ${reverseMap}
    </td>
  </tr>`;
  }).join('');

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

export async function renderResourceDirectory({ forUnit, forTri, forYear, forWeek, forDate, containerId = 'lxdune-resource-directory' } = {}) {
  const el = document.getElementById(containerId);
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

function buildTaskSections(task, loMap, triKey, bespokeCache) {
  const lnk      = task.links ?? {};
  const triDates = triKey ? (task.trimesterDates?.[triKey] ?? {}) : {};
  const fp       = triDates.flexiblePortal ?? null;
  const parts    = task.parts ?? [];
  const sections = [];

  // Header pill + title
  sections.push(
    `<div style="display:inline-block;background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);padding:4px 10px;border-radius:999px;font-size:.8em;font-weight:800;margin-bottom:12px;">${esc(task._unitCode ?? '')} • ${esc(task.id)}</div>` +
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

  return sections;
}

export async function renderAssessmentPage({ forUnit, forTask, forTri, forYear, containerId = 'lxdune-assessment-page' } = {}) {
  const el = document.getElementById(containerId);
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

  const allTasks = unitCfg.assessmentTasks ?? [];
  let tasksToRender;

  if (forTask === 'all') {
    tasksToRender = allTasks;
  } else if (Array.isArray(forTask)) {
    tasksToRender = allTasks.filter(t => forTask.includes(t.id));
  } else {
    // Single task — existing behaviour
    const task = allTasks.find(t => t.id === forTask);
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

    const loMap  = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));
    const triKey = forTri && forYear ? `${forTri}-${forYear}` : null;
    task._unitCode = unitCfg.code;
    const sections = buildTaskSections(task, loMap, triKey, bespokeCache);
    el.innerHTML = `<div class="lx-ap">${sections.join('\n')}</div>`;
    initTabSwitchers(el);
    return;
  }

  // Filter tasks with no title (skip nulls silently)
  tasksToRender = tasksToRender.filter(t => t && t.id && t.title);
  if (!tasksToRender.length) { el.innerHTML = ''; return; }

  // Prefetch bespoke components for ALL tasks in tasksToRender
  const bespokeCache = {};
  for (const task of tasksToRender) {
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
  }

  const loMap  = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));
  const triKey = forTri && forYear ? `${forTri}-${forYear}` : null;

  // Tag each task with the unit code for the header pill
  tasksToRender.forEach(t => { t._unitCode = unitCfg.code; });

  if (tasksToRender.length === 1) {
    // Single filtered task — render without tab bar
    const sections = buildTaskSections(tasksToRender[0], loMap, triKey, bespokeCache);
    el.innerHTML = `<div class="lx-ap">${sections.join('\n')}</div>`;
    initTabSwitchers(el);
    return;
  }

  // Multiple tasks — tab bar + panels
  const tabBarHtml = `<div style="display:flex;gap:4px;margin-bottom:0;">${
    tasksToRender.map((task, i) =>
      `<button data-lx-tab="${esc(task.id)}" style="padding:10px 16px;border:none;cursor:pointer;border-radius:8px 8px 0 0;font-family:Arial,sans-serif;font-size:.93em;background:${i === 0 ? 'var(--lx-primary,#1f6fb2)' : '#e5e7eb'};color:${i === 0 ? '#fff' : '#4a5568'};font-weight:${i === 0 ? '700' : '400'};">${esc(task.id)} — ${esc(task.title)}</button>`
    ).join('')
  }</div>`;

  const panelsHtml = tasksToRender.map((task, i) => {
    const sections = buildTaskSections(task, loMap, triKey, bespokeCache);
    return `<div data-lx-panel="${esc(task.id)}" style="${i > 0 ? 'display:none;' : ''}"><div class="lx-ap">${sections.join('\n')}</div></div>`;
  }).join('');

  el.innerHTML = `<div style="font-family:Arial,sans-serif;">${tabBarHtml}<div style="border:1px solid #dfe6ea;border-radius:0 12px 12px 12px;">${panelsHtml}</div></div>`;

  // Wire tab switching — scoped to el so multiple instances on one page never conflict
  const tabBtns = el.querySelectorAll('[data-lx-tab]');
  const tabPanels = el.querySelectorAll('[data-lx-panel]');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.lxTab;
      tabBtns.forEach(b => {
        const active = b === btn;
        b.style.background = active ? 'var(--lx-primary,#1f6fb2)' : '#e5e7eb';
        b.style.color = active ? '#fff' : '#4a5568';
        b.style.fontWeight = active ? '700' : '400';
      });
      tabPanels.forEach(p => { p.style.display = p.dataset.lxPanel === target ? '' : 'none'; });
    });
  });
  initTabSwitchers(el); // wire any bespoke tab switchers inside panels
}

// ─────────────────────────────────────────────────────────────────────────────
// 8b. renderAssessmentNav — 17th render function
// Container: <div id="lxdune-assessment-nav"></div>
// Unit home navigation card: one full-width button per assessment task with
// due date, weighting, and LO colour pills. Graceful placeholder if no tasks.
// ─────────────────────────────────────────────────────────────────────────────

const ASSESSMENT_NAV_CSS = `
.lx-an{max-width:950px;margin:20px auto;font-family:Arial,sans-serif;color:#1F2A33;}
.lx-an-heading{font-size:15px;font-weight:700;color:var(--lx-primary,#1f6fb2);margin-bottom:12px;}
.lx-an-items{display:flex;flex-direction:column;gap:16px;}
.lx-an-btn{display:block;width:100%;padding:12px 16px;background:var(--lx-primary,#1f6fb2);color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:.97em;font-family:Arial,sans-serif;box-sizing:border-box;}
.lx-an-btn-disabled{display:block;width:100%;padding:12px 16px;background:#9aacb8;color:#fff;border-radius:8px;font-weight:700;font-size:.97em;font-family:Arial,sans-serif;box-sizing:border-box;cursor:not-allowed;}
.lx-an-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}
.lx-an-pill{display:inline-block;padding:3px 8px;border-radius:999px;font-size:.78em;font-weight:700;background:#e8f0fb;color:var(--lx-primary,#1f6fb2);border:1px solid #b0c8e8;}
.lx-an-lo{display:inline-block;padding:3px 8px;border-radius:999px;font-size:.78em;font-weight:700;color:#fff;}`;

export async function renderAssessmentNav({ forUnit, forTri, forYear, containerId = 'lxdune-assessment-nav' } = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;

  let unitCfg;
  try {
    unitCfg = await fetchJson(`${BASE}config/units/${forUnit}.json`);
  } catch (e) {
    setError(el, `Could not load content: ${e.message}`);
    return;
  }

  applyTheme(unitCfg);
  injectStyles('lx-an-styles', ASSESSMENT_NAV_CSS);

  const tasks = unitCfg.assessmentTasks ?? [];
  if (!tasks.length) {
    el.innerHTML = `<div class="lx-an"><div style="padding:16px;border:1px solid #dfe6ea;border-radius:8px;color:#6F7B84;font-style:italic;">Assessment information will be published here shortly.</div></div>`;
    return;
  }

  const loMap  = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));
  const triKey = forTri && forYear ? `${forTri}-${forYear}` : null;

  const itemsHtml = tasks.map((task, i) => {
    const triDates = triKey ? (task.trimesterDates?.[triKey] ?? {}) : {};
    const metaPills = [
      triDates.due   ? `Due: ${esc(formatDateAU(triDates.due))}` : null,
      task.weighting ? `${task.weighting}%` : null,
    ].filter(Boolean).map(t => `<span class="lx-an-pill">${t}</span>`).join('');

    const loPills = (task.learningOutcomes ?? []).map(id => {
      const lo    = loMap[id];
      const color = lo?.color ?? 'var(--lx-primary,#1f6fb2)';
      return `<span class="lx-an-lo" style="background:${color};">${esc(id)}</span>`;
    }).join('');

    const taskUrl = task.links?.taskFiles ?? null;
    const label   = `Assessment Task ${i + 1} — ${esc(task.title)}`;
    const btnHtml = taskUrl
      ? `<a class="lx-an-btn" href="${esc(taskUrl)}" target="_blank" rel="noopener">${label}</a>`
      : `<div class="lx-an-btn-disabled">${label} (Link coming soon)</div>`;

    return `<div>${btnHtml}<div class="lx-an-meta">${metaPills}${loPills}</div></div>`;
  }).join('');

  el.innerHTML = `<div class="lx-an"><div class="lx-an-heading">Assessment Tasks</div><div class="lx-an-items">${itemsHtml}</div></div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8c. renderAssessmentHybrid — Journey timeline assessment page
// Container: <div id="lxdune-assessment-hybrid"></div>
// Collapsible milestone cards (A→B→C→D1→D2→CL→✓). Each part header is
// clickable (chevron toggle); body shows description + LO pills + deadline
// badge. CL milestone embeds the presubmission checklist. Submit is static.
// ─────────────────────────────────────────────────────────────────────────────

const ASSESSMENT_HYBRID_CSS = `
.lx-ah-wrap{max-width:950px;margin:30px auto;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#1F2A33;line-height:1.55}
.lx-ah-header{background:var(--lx-primary,#1f6fb2);color:#fff;border-radius:12px;padding:28px 32px 24px;margin-bottom:40px}
.lx-ah-unit-code{font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-bottom:4px}
.lx-ah-unit-full{font-size:.88rem;opacity:.82;margin-bottom:18px}
.lx-ah-chips{display:flex;flex-wrap:wrap;gap:10px}
.lx-ah-chip{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);border-radius:20px;padding:5px 14px;font-size:.82rem;font-weight:600}
.lx-ah-chip span{opacity:.75;font-weight:400;margin-right:4px}
.lx-ah-section-label{font-size:.75rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--lx-primary,#1f6fb2);margin-bottom:20px}
.lx-ah-timeline{position:relative;padding-left:56px}
.lx-ah-timeline::before{content:"";position:absolute;left:20px;top:24px;bottom:24px;width:4px;border-radius:2px;background:linear-gradient(to bottom,var(--lx-primary,#1f6fb2) 0%,var(--lx-accent,#25797F) 100%)}
.lx-ah-milestone{position:relative;margin-bottom:20px}
.lx-ah-milestone:last-child{margin-bottom:0}
.lx-ah-marker{position:absolute;left:-46px;top:20px;width:36px;height:36px;border-radius:50%;background:var(--lx-primary,#1f6fb2);color:#fff;font-size:.85rem;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px #FAF9FF,0 0 0 6px var(--lx-pill-border,#cbe6ee);z-index:1}
.lx-ah-marker.lx-ah-accent{background:var(--lx-accent,#25797F);box-shadow:0 0 0 4px #FAF9FF,0 0 0 6px var(--lx-pill-border,#cbe6ee)}
.lx-ah-marker.lx-ah-review{background:#4a3570;box-shadow:0 0 0 4px #FAF9FF,0 0 0 6px #b0a0d8;font-size:.7rem;letter-spacing:.01em}
.lx-ah-marker.lx-ah-finish{background:#1F2A33;box-shadow:0 0 0 4px #FAF9FF,0 0 0 6px #b0bec5;font-size:1rem}
.lx-ah-card{background:#fff;border:1.5px solid #e8e2f7;border-radius:10px;overflow:hidden;transition:border-color .15s}
.lx-ah-milestone.is-open .lx-ah-card{border-color:var(--lx-pill-border,#cbe6ee)}
.lx-ah-band-primary{border-left:5px solid var(--lx-primary,#1f6fb2)}
.lx-ah-band-accent{border-left:5px solid var(--lx-accent,#25797F)}
.lx-ah-band-dim{border-left:5px solid #9bc4c9}
.lx-ah-band-review{border-left:5px solid #4a3570}
.lx-ah-band-end{border-left:5px solid #b0bec5}
.lx-ah-top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:16px 20px;cursor:pointer;user-select:none;transition:background .15s}
.lx-ah-top:hover{background:rgba(0,0,0,.025)}
.lx-ah-milestone.is-open .lx-ah-top{background:rgba(0,0,0,.025)}
.lx-ah-top-left{flex:1;min-width:0}
.lx-ah-top-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
.lx-ah-part-label{font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--lx-primary,#1f6fb2);margin-bottom:2px}
.lx-ah-title{font-size:1.05rem;font-weight:700;color:#1F2A33}
.lx-ah-marks{background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);border-radius:20px;padding:4px 14px;font-size:.82rem;font-weight:700;color:var(--lx-primary,#1f6fb2);white-space:nowrap}
.lx-ah-marks.lx-ah-dim{background:#e8f5f7;border-color:#aed9df;color:var(--lx-accent,#25797F)}
.lx-ah-chevron{flex-shrink:0;color:#9d8dd0;display:flex;align-items:center;transition:transform .25s ease}
.lx-ah-milestone.is-open .lx-ah-chevron{transform:rotate(180deg)}
.lx-ah-body{max-height:0;overflow:hidden;opacity:0;transition:max-height .32s ease,opacity .25s ease}
.lx-ah-milestone.is-open .lx-ah-body{max-height:2000px;opacity:1}
.lx-ah-milestone-cl.is-open .lx-ah-body{max-height:6000px}
.lx-ah-milestone-cl .lx-ah-body-inner{padding:8px 12px 16px}
.lx-ah-body-inner{padding:0 20px 16px;border-top:1px solid #ede8fb}
.lx-ah-desc{font-size:.88rem;color:#445060;margin-top:12px;margin-bottom:12px}
.lx-ah-tags{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.lx-ah-lo-pill{background:var(--lx-pill,#DAF0F7);border:1px solid var(--lx-pill-border,#cbe6ee);border-radius:12px;padding:2px 10px;font-size:.75rem;font-weight:600;color:var(--lx-primary,#1f6fb2)}
.lx-ah-deadline{background:#FDF0E3;border:1px solid #E3B089;border-radius:12px;padding:2px 10px;font-size:.75rem;font-weight:700;color:#9b5f1e;display:inline-flex;align-items:center;gap:4px}
.lx-ah-milestone-submit .lx-ah-top{cursor:default}
.lx-ah-milestone-submit .lx-ah-top:hover{background:transparent}
.lx-ah-milestone-submit .lx-ah-body{opacity:1}
.lx-ah-milestone-submit .lx-ah-card{background:#f5f3fb;border-color:var(--lx-pill-border,#cbe6ee)}
.lx-ah-milestone-submit .lx-ah-title{color:var(--lx-primary,#1f6fb2)}
.lx-ah-summary{margin-top:36px;background:#fff;border:1.5px solid #e8e2f7;border-radius:10px;padding:16px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px}
.lx-ah-sb-label{font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--lx-primary,#1f6fb2)}
.lx-ah-sb-total{font-size:1.4rem;font-weight:800;color:#1F2A33}
.lx-ah-sb-divider{width:1px;height:36px;background:#e0daf5;flex-shrink:0}
.lx-ah-sb-los{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.lx-ah-glance{background:#f8f9fb;border:1px solid #e8e2f7;border-radius:10px;padding:20px 24px;margin-bottom:28px}
.lx-ah-lo-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.lx-ah-aim{background:#EBF5FC;border-left:4px solid var(--lx-primary,#1f6fb2);border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:16px;font-size:.88rem;color:#1F2A33}
.lx-ah-aim-label{display:block;font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--lx-primary,#1f6fb2);margin-bottom:4px}
.lx-ah-actions{display:flex;flex-wrap:wrap;gap:8px}
.lx-ah-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:6px;font-size:.82rem;font-weight:600;font-family:inherit;cursor:pointer;text-decoration:none;border:none;transition:opacity .15s;line-height:1.4}
.lx-ah-btn-primary{background:var(--lx-primary,#1f6fb2);color:#fff}
.lx-ah-btn-primary:hover{opacity:.88}
.lx-ah-btn-submit{background:#21725E;color:#fff}
.lx-ah-btn-submit:hover{opacity:.88}
.lx-ah-btn-neutral{background:#e5e7eb;color:#374151}
.lx-ah-btn-neutral:hover{background:#d1d5db}
.lx-ah-btn-disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed;pointer-events:none;opacity:.7}
.lx-ah-wordcount{font-size:.78rem;color:#6F7B84;margin:4px 0 8px}
.lx-ah-note{background:#f4f6f8;border-left:4px solid #2c3e50;border-radius:0 6px 6px 0;padding:10px 14px;margin-top:12px;font-size:.85rem}
.lx-ah-note strong{display:block;margin-bottom:4px}
.lx-ah-reqs{background:#f4f6f8;border-left:4px solid #2c3e50;border-radius:0 6px 6px 0;padding:10px 14px;margin-top:12px;font-size:.86rem}
.lx-ah-reqs-label{font-weight:700;margin-bottom:6px}
.lx-ah-reqs ul,.lx-ah-res ul{margin:6px 0 0 18px;padding:0}
.lx-ah-reqs li,.lx-ah-res li{margin-bottom:4px}
.lx-ah-res{background:#fff8e6;border-left:4px solid #f1c40f;border-radius:0 6px 6px 0;padding:10px 14px;margin-top:12px;font-size:.86rem}
.lx-ah-res-label{font-weight:700;margin-bottom:6px;color:#7a5c00}
.lx-ah-res a{color:var(--lx-primary,#1f6fb2)}
.lx-ah-guidance{margin-top:14px;padding-top:12px;border-top:1px solid #e0daf5;font-size:.86rem}
.lx-ah-guidance-label{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--lx-accent,#25797F);margin-bottom:6px}
.lx-ah-guidance p{margin:4px 0}
.lx-ah-subm-list{margin:0 0 14px;padding:0 0 0 18px;font-size:.86rem;color:#445060}
.lx-ah-subm-list li{margin-bottom:5px}
.lx-ah-support{margin-top:28px}
.lx-ah-hd-callout{background:#FDF8E7;border-left:4px solid #e6a817;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:16px;font-size:.88rem}
.lx-ah-hd-callout strong{display:block;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7a5c00;margin-bottom:6px}
.lx-ah-fp-callout{background:#EBF5FC;border-left:4px solid var(--lx-accent,#25797F);border-radius:0 8px 8px 0;padding:14px 18px;font-size:.88rem}
.lx-ah-fp-callout strong{display:block;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--lx-accent,#25797F);margin-bottom:6px}
.lx-ah-early-notice{background:#FEF4EB;border:1px solid #E3B089;border-left:4px solid #E3B089;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.87rem;color:#7a4a1e}
.lx-ah-early-notice strong{color:#b85c00}
.lx-ah-action-list{list-style:none;display:flex;flex-direction:column;gap:6px;margin:0;padding:0}
.lx-ah-action-list li{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:8px;transition:background .12s}
.lx-ah-action-list li:hover{background:#f8f9fb}
.lx-ah-action-list input[type=checkbox]{appearance:none;-webkit-appearance:none;width:20px;height:20px;min-width:20px;border:2px solid var(--lx-pill-border,#cbe6ee);border-radius:5px;background:#fff;cursor:pointer;position:relative;margin-top:1px;transition:border-color .15s,background .15s;flex-shrink:0}
.lx-ah-action-list input[type=checkbox]:hover{border-color:var(--lx-primary,#1f6fb2)}
.lx-ah-action-list input[type=checkbox]:checked{background:var(--lx-accent,#25797F);border-color:var(--lx-accent,#25797F)}
.lx-ah-action-list input[type=checkbox]:checked::after{content:"";display:block;position:absolute;left:5px;top:2px;width:6px;height:10px;border:2px solid #fff;border-top:none;border-left:none;transform:rotate(45deg)}
.lx-ah-action-label{font-size:.92rem;line-height:1.45;padding-top:1px;cursor:pointer}
@media(max-width:600px){.lx-ah-timeline{padding-left:44px}.lx-ah-timeline::before{left:14px}.lx-ah-marker{left:-38px;width:30px;height:30px;font-size:.78rem}.lx-ah-header{padding:20px 18px 18px}.lx-ah-top{flex-wrap:wrap}}`;

const CHEVRON_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4.5L7 9.5L12 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function partBandClass(partId) {
  const id = String(partId ?? '').toUpperCase();
  if (id.startsWith('D')) return 'lx-ah-band-dim';
  if (id === 'A')         return 'lx-ah-band-primary';
  return 'lx-ah-band-accent';
}

function buildHybridTask(task, loMap, triKey, checklistHtml, unitCfg) {
  const triDates   = triKey ? (task.trimesterDates?.[triKey] ?? {}) : {};
  const dueDate    = triDates.due      ?? null;
  const duePartA   = triDates.duePartA ?? null;
  const lnk        = task.links ?? {};
  const fp         = triDates.flexiblePortal ?? null;
  const parts      = task.parts ?? [];
  const marksTotal = parts.reduce((sum, p) => sum + (p.marks ?? 0), 0);
  const uid        = `${String(task.id ?? 'task').replace(/\W/g, '')}-${Math.random().toString(36).slice(2, 7)}`;

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerHtml = `<header class="lx-ah-header">
    <p class="lx-ah-unit-code">${esc(unitCfg.code)} — ${esc(task.id)}</p>
    <h2 style="font-size:1.45rem;font-weight:800;margin:0 0 6px;line-height:1.25;">${esc(task.title)}</h2>
    ${unitCfg.title ? `<p class="lx-ah-unit-full">${esc(unitCfg.title)}</p>` : ''}
    <div class="lx-ah-chips">
      ${task.weighting ? `<div class="lx-ah-chip"><span>Weighting</span>${esc(String(task.weighting))}%</div>` : ''}
      ${marksTotal     ? `<div class="lx-ah-chip"><span>Total marks</span>${marksTotal}</div>` : ''}
      ${dueDate        ? `<div class="lx-ah-chip"><span>Final submission</span>${esc(formatDateShort(dueDate))}</div>` : ''}
      ${task.length    ? `<div class="lx-ah-chip"><span>Length</span>${esc(task.length)}</div>` : ''}
    </div>
  </header>`;

  // ── At-a-glance block ───────────────────────────────────────────────────────
  const taskLoPillsHtml = (task.learningOutcomes ?? []).map(id => {
    const lo    = loMap[id];
    const color = lo?.color ?? 'var(--lx-primary,#1f6fb2)';
    return `<span class="lx-ah-lo-pill" style="background:${color};color:#fff;border:none;">${esc(id)}</span>`;
  }).join('');

  const aimHtml = task.aim
    ? `<div class="lx-ah-aim"><strong class="lx-ah-aim-label">The task</strong>${esc(task.aim)}</div>`
    : '';

  const btnDefs = [
    { label: '📝 Marking rubric',  type: 'primary', url: lnk.rubric    },
    { label: '⬇ Task files',       type: 'primary', url: lnk.taskFiles },
    { label: '✅ Submit',           type: 'submit',  url: lnk.submit    },
    { label: '💬 Q&A forum',       type: 'neutral', url: lnk.forum     },
    { label: '🎥 Unpacking video',  type: 'neutral', url: lnk.video     },
  ];
  const btnsHtml = btnDefs.map(b =>
    b.url
      ? `<a class="lx-ah-btn lx-ah-btn-${b.type}" href="${esc(b.url)}" target="_blank" rel="noopener">${b.label}</a>`
      : `<span class="lx-ah-btn lx-ah-btn-disabled">${b.label}</span>`
  ).join('');

  const glanceHtml = `<div class="lx-ah-glance">
    ${taskLoPillsHtml ? `<div class="lx-ah-lo-row">${taskLoPillsHtml}</div>` : ''}
    ${aimHtml}
    <div class="lx-ah-actions">${btnsHtml}</div>
  </div>`;

  // ── Milestone cards ─────────────────────────────────────────────────────────
  const milestonesHtml = parts.map(p => {
    const pid       = String(p.id ?? '').toUpperCase();
    const bandClass = partBandClass(p.id);
    const markerCls = `lx-ah-marker${pid.startsWith('D') ? ' lx-ah-accent' : ''}`;
    const marksCls  = `lx-ah-marks${pid !== 'A' ? ' lx-ah-dim' : ''}`;
    const loIds     = p.loLinks ?? [];
    const loPillsHtml = loIds.map(id => `<span class="lx-ah-lo-pill">${esc(id)}</span>`).join('');
    const tagsHtml = loPillsHtml ? `<div class="lx-ah-tags">${loPillsHtml}</div>` : '';
    const earlyNoticeHtml = (pid === 'A' && duePartA)
      ? `<div class="lx-ah-early-notice"><strong>Part A is due ${esc(formatDateShort(duePartA))}</strong> — submit via the Assessment Portal before moving to Part B.</div>`
      : '';
    const descHtml = p.description
      ? `<p class="lx-ah-desc">${esc(p.description)}</p>`
      : '';
    const wordCountHtml = p.wordCount
      ? `<p class="lx-ah-wordcount">~${esc(String(p.wordCount))} words</p>`
      : '';
    const noteHtml = p.note
      ? `<div class="lx-ah-note"><strong>Important:</strong> ${esc(p.note)}</div>`
      : '';
    const reqs = p.requirements ?? [];
    const checkboxItems = reqs.length ? reqs : ['Complete this section — requirements to be added.'];
    const reqHtml = `<ul class="lx-ah-action-list">${checkboxItems.map((r, i) => {
      const cbId = `lxah-${uid}-${pid}-${i}`;
      return `<li><input type="checkbox" id="${cbId}"><label class="lx-ah-action-label" for="${cbId}">${esc(r)}</label></li>`;
    }).join('')}</ul>`;
    const resHtml = (p.resources ?? []).length
      ? `<div class="lx-ah-res"><div class="lx-ah-res-label">Helpful resources:</div><ul>${p.resources.map(r => `<li>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)}</a>` : esc(r.label)}</li>`).join('')}</ul></div>`
      : '';
    const guidanceHtml = (p.guidanceNotes ?? []).length
      ? `<div class="lx-ah-guidance"><div class="lx-ah-guidance-label">Additional guidance</div>${p.guidanceNotes.map(n => `<p>→ ${esc(n)}</p>`).join('')}</div>`
      : '';

    return `<div class="lx-ah-milestone">
      <div class="${markerCls}">${esc(String(p.id))}</div>
      <div class="lx-ah-card ${bandClass}">
        <div class="lx-ah-top" role="button" tabindex="0" aria-expanded="false">
          <div class="lx-ah-top-left">
            <p class="lx-ah-part-label">Part ${esc(String(p.id))}</p>
            <p class="lx-ah-title">${esc(p.title ?? '')}</p>
          </div>
          <div class="lx-ah-top-right">
            ${p.marks != null ? `<div class="${marksCls}">${p.marks} marks</div>` : ''}
            <span class="lx-ah-chevron" aria-hidden="true">${CHEVRON_SVG}</span>
          </div>
        </div>
        <div class="lx-ah-body">
          <div class="lx-ah-body-inner">
            ${descHtml}${wordCountHtml}${tagsHtml}${earlyNoticeHtml}${reqHtml}${resHtml}${noteHtml}${guidanceHtml}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  // ── CL milestone ────────────────────────────────────────────────────────────
  const clHtml = checklistHtml
    ? `<div class="lx-ah-milestone lx-ah-milestone-cl">
        <div class="lx-ah-marker lx-ah-review">CL</div>
        <div class="lx-ah-card lx-ah-band-review">
          <div class="lx-ah-top" role="button" tabindex="0" aria-expanded="false">
            <div class="lx-ah-top-left">
              <p class="lx-ah-part-label">Pre-submission</p>
              <p class="lx-ah-title">Review all parts before you submit</p>
            </div>
            <div class="lx-ah-top-right">
              <span class="lx-ah-chevron" aria-hidden="true">${CHEVRON_SVG}</span>
            </div>
          </div>
          <div class="lx-ah-body">
            <div class="lx-ah-body-inner">${checklistHtml}</div>
          </div>
        </div>
      </div>`
    : '';

  // ── Submit milestone ────────────────────────────────────────────────────────
  const subm = task.submissionInstructions ?? [];
  const submListHtml = subm.length
    ? `<ul class="lx-ah-subm-list">${subm.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`
    : '';
  const submitBtnHtml = lnk.submit
    ? `<a class="lx-ah-btn lx-ah-btn-submit" href="${esc(lnk.submit)}" target="_blank" rel="noopener">✅ Submit your assessment</a>`
    : `<span class="lx-ah-btn lx-ah-btn-disabled">✅ Submit (link coming soon)</span>`;
  const submitDeadline = dueDate
    ? `<span class="lx-ah-deadline" style="margin-top:12px;display:inline-flex;">⏰ Final deadline: ${esc(formatDateShort(dueDate))}</span>`
    : '';

  const submitHtml = `<div class="lx-ah-milestone lx-ah-milestone-submit">
    <div class="lx-ah-marker lx-ah-finish">&#10003;</div>
    <div class="lx-ah-card lx-ah-band-end">
      <div class="lx-ah-top">
        <div class="lx-ah-top-left">
          <p class="lx-ah-part-label">Full submission</p>
          <p class="lx-ah-title">Submit all parts via the myLearn assessment portal</p>
        </div>
        ${dueDate ? `<div class="lx-ah-top-right"><div class="lx-ah-marks">Due ${esc(formatDateShort(dueDate))}</div></div>` : ''}
      </div>
      <div class="lx-ah-body">
        <div class="lx-ah-body-inner">
          ${submListHtml}
          ${submitBtnHtml}
          ${submitDeadline}
        </div>
      </div>
    </div>
  </div>`;

  // ── Support section ─────────────────────────────────────────────────────────
  const supportParts = [];
  if (task.hdCallout) {
    supportParts.push(`<div class="lx-ah-hd-callout"><strong>Aiming for HD?</strong>${esc(task.hdCallout)}</div>`);
  }
  if (fp?.url) {
    const opensNote = fp.opensDate ? ` — opens ${esc(formatDateShort(fp.opensDate))}` : '';
    supportParts.push(
      `<div class="lx-ah-fp-callout"><strong>🔓 Flexible Submission Portal${opensNote}</strong>` +
      `<a class="lx-ah-btn lx-ah-btn-neutral" href="${esc(fp.url)}" target="_blank" rel="noopener" style="margin-top:8px;display:inline-flex;">${esc(fp.label ?? 'Open flexible portal')}</a></div>`
    );
  }
  const supportHtml = supportParts.length
    ? `<div class="lx-ah-support">${supportParts.join('')}</div>`
    : '';

  // ── Summary bar ─────────────────────────────────────────────────────────────
  const allLoIds  = [...new Set(parts.flatMap(p => p.loLinks ?? []))];
  const sbLosHtml = allLoIds.map(id => {
    const lo    = loMap[id];
    const color = lo?.color ?? 'var(--lx-primary,#1f6fb2)';
    const label = lo ? `${id} — ${lo.description}` : id;
    return `<span class="lx-ah-lo-pill" style="background:${color};color:#fff;border:none;">${esc(label)}</span>`;
  }).join('');

  const summaryHtml = `<div class="lx-ah-summary">
    ${marksTotal     ? `<div><div class="lx-ah-sb-label">Total marks</div><div class="lx-ah-sb-total">${marksTotal}</div></div><div class="lx-ah-sb-divider"></div>` : ''}
    ${task.weighting ? `<div><div class="lx-ah-sb-label">Weighting</div><div class="lx-ah-sb-total">${esc(String(task.weighting))}%</div></div><div class="lx-ah-sb-divider"></div>` : ''}
    ${sbLosHtml      ? `<div><div class="lx-ah-sb-label">Learning outcomes addressed</div><div class="lx-ah-sb-los">${sbLosHtml}</div></div>` : ''}
  </div>`;

  return `${headerHtml}
  ${glanceHtml}
  <p class="lx-ah-section-label">Your assessment journey — click each milestone to expand</p>
  <div class="lx-ah-timeline">${milestonesHtml}${clHtml}${submitHtml}</div>
  ${supportHtml}
  ${summaryHtml}`;
}

export async function renderAssessmentHybrid({ forUnit, forTask, forTri, forYear, containerId = 'lxdune-assessment-hybrid' } = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;

  let unitCfg;
  try {
    unitCfg = await fetchJson(`${BASE}config/units/${forUnit}.json`);
  } catch (e) {
    setError(el, `Could not load content: ${e.message}`);
    return;
  }

  applyTheme(unitCfg);
  injectStyles('lx-ah-styles', ASSESSMENT_HYBRID_CSS);

  const allTasks = unitCfg.assessmentTasks ?? [];
  let tasksToRender;

  if (forTask === 'all') {
    tasksToRender = allTasks;
  } else if (Array.isArray(forTask)) {
    tasksToRender = allTasks.filter(t => forTask.includes(t.id));
  } else {
    const task = allTasks.find(t => t.id === forTask);
    if (!task) { el.innerHTML = ''; return; }
    tasksToRender = [task];
  }

  tasksToRender = tasksToRender.filter(t => t && t.id && t.title);
  if (!tasksToRender.length) { el.innerHTML = ''; return; }

  const loMap  = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));
  const triKey = forTri && forYear ? `${forTri}-${forYear}` : null;

  // Fetch checklists in parallel — graceful null if not available
  const checklists = await Promise.all(tasksToRender.map(async task => {
    try {
      const res = await fetch(`${BASE}templates/presubmission-checklist-${forUnit}-${task.id}.html`);
      return res.ok ? await res.text() : null;
    } catch { return null; }
  }));

  // Wire collapsible milestone tops and re-execute any injected scripts
  function wireEl(container) {
    container.querySelectorAll('.lx-ah-top').forEach(top => {
      const ms = top.closest('.lx-ah-milestone');
      if (!ms || ms.classList.contains('lx-ah-milestone-submit')) return;
      function toggle() {
        const isOpen = ms.classList.toggle('is-open');
        top.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      top.addEventListener('click', toggle);
      top.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
    container.querySelectorAll('script').forEach(old => {
      const s = document.createElement('script');
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  if (tasksToRender.length === 1) {
    const html = buildHybridTask(tasksToRender[0], loMap, triKey, checklists[0], unitCfg);
    el.innerHTML = `<div class="lx-ah-wrap">${html}</div>`;
    wireEl(el);
    return;
  }

  // Multiple tasks — tab bar
  const tabBarHtml = `<div style="display:flex;gap:4px;margin-bottom:0;">${
    tasksToRender.map((task, i) =>
      `<button data-lx-ah-tab="${esc(task.id)}" style="padding:10px 16px;border:none;cursor:pointer;border-radius:8px 8px 0 0;font-family:inherit;font-size:.93em;background:${i === 0 ? 'var(--lx-primary,#1f6fb2)' : '#e5e7eb'};color:${i === 0 ? '#fff' : '#4a5568'};font-weight:${i === 0 ? '700' : '400'};">${esc(task.id)} — ${esc(task.title)}</button>`
    ).join('')
  }</div>`;

  const panelsHtml = tasksToRender.map((task, i) => {
    const html = buildHybridTask(task, loMap, triKey, checklists[i], unitCfg);
    return `<div data-lx-ah-panel="${esc(task.id)}"${i > 0 ? ' hidden' : ''}><div class="lx-ah-wrap">${html}</div></div>`;
  }).join('');

  el.innerHTML = `<div style="font-family:Arial,sans-serif;">${tabBarHtml}<div style="border:1px solid #dfe6ea;border-radius:0 12px 12px 12px;">${panelsHtml}</div></div>`;

  const tabBtns   = el.querySelectorAll('[data-lx-ah-tab]');
  const tabPanels = el.querySelectorAll('[data-lx-ah-panel]');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.lxAhTab;
      tabBtns.forEach(b => {
        const active = b === btn;
        b.style.background = active ? 'var(--lx-primary,#1f6fb2)' : '#e5e7eb';
        b.style.color      = active ? '#fff' : '#4a5568';
        b.style.fontWeight = active ? '700' : '400';
      });
      tabPanels.forEach(p => { p.hidden = p.dataset.lxAhPanel !== target; });
    });
  });

  wireEl(el);
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

export async function renderPresubmissionChecklist({ forUnit, forTask, containerId = 'lxdune-presubmission-checklist' } = {}) {
  const el = document.getElementById(containerId);
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

export async function renderCourseHub({ forUnit, forTri, forYear, containerId = null } = {}) {
  const el = containerId ? document.getElementById(containerId) : document.querySelector('div[data-lx-block="course-hub"]');
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
  const loMap = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));

  const weekNums = Object.keys(weeks)
    .map(Number)
    .filter(n => n >= 1 && !NO_TEACHING.has(n))
    .sort((a, b) => a - b);

  const rows = weekNums.map(n => {
    const week = weeks[String(n)];
    const itemLabel = week.item ? esc(week.item) : `Week ${n}`;
    const title     = week.title ? esc(week.title) : '';

    // LO pills
    const loIds = Array.isArray(week.loMapping) ? week.loMapping : [];
    const loPillsHtml = loIds
      .map(id => {
        const lo = loMap[id];
        if (!lo) return '';
        return `<span class="lx-hub-lo-pill" style="background:${esc(lo.color)};">${esc(id)}</span>`;
      })
      .filter(Boolean)
      .join('');

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
        <div class="lx-hub-summary-top">
          <span class="lx-hub-chip">${itemLabel}</span>
          <span class="lx-hub-week-num">Week ${n}</span>
          ${title ? `<span class="lx-hub-week-title">${title}</span>` : ''}
        </div>
        ${loPillsHtml ? `<div class="lx-hub-lo-pills">${loPillsHtml}</div>` : ''}
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

export async function renderUnitKeyInfo({ forUnit, forTri, forYear, containerId = 'lxdune-unit-key-info' } = {}) {
  const el = document.getElementById(containerId);
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

export async function renderAssessmentStatus({ forUnit, forTri, forYear, containerId = 'lxdune-assessment-status' } = {}) {
  const el = document.getElementById(containerId);
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
export async function renderOrientationNote({ forUnit, forTri, forYear, forWeek, forDate, containerId = 'lxdune-orientation-note' } = {}) {
  const el = document.getElementById(containerId); if (!el) return;
  try {
    const { unitCfg, week } = await resolve({ forUnit, forTri, forYear, forWeek, forDate });
    applyTheme(unitCfg);

    if (week?.topics?.length) {
      // ── topics[] path ──────────────────────────────────────────────────────
      const topicsWithNote = week.topics.filter(t => t.orientationNote != null);
      if (!topicsWithNote.length) { el.innerHTML = ''; return; }
      injectStyles('lx-orientation-note', ORIENTATION_NOTE_CSS);
      if (topicsWithNote.length === 1) {
        // Single note — identical HTML structure to the flat path
        el.innerHTML = `<div class="lx-on"><div class="lx-on-inner">
          <div class="lx-on-label">Unit context</div>
          <p class="lx-on-text">${esc(topicsWithNote[0].orientationNote)}</p>
        </div></div>`;
      } else {
        // Multiple notes — prefix each with the topic title
        const blocks = topicsWithNote.map(t =>
          `<div class="lx-on"><div class="lx-on-inner">
            <div class="lx-on-label">${esc(t.title)}</div>
            <p class="lx-on-text">${esc(t.orientationNote)}</p>
          </div></div>`
        ).join('');
        el.innerHTML = blocks;
      }
      return;
    }

    // ── flat path (backwards-compatible) ──────────────────────────────────────
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
export async function renderForumPrompts({ forUnit, forTri, forYear, forWeek, forDate, containerId = 'lxdune-forum-prompts' } = {}) {
  const el = document.getElementById(containerId); if (!el) return;
  try {
    const { unitCfg, week } = await resolve({ forUnit, forTri, forYear, forWeek, forDate });
    applyTheme(unitCfg);

    if (week?.topics?.length) {
      // ── topics[] path ──────────────────────────────────────────────────────
      const topicsWithPrompts = week.topics.filter(t => t.forumPrompts?.length);
      if (!topicsWithPrompts.length) { el.innerHTML = ''; return; }
      injectStyles('lx-forum-prompts', FORUM_PROMPTS_CSS);
      if (topicsWithPrompts.length === 1) {
        // Single group — identical HTML to the flat path
        const items = topicsWithPrompts[0].forumPrompts.map((p, i) =>
          `<li class="lx-fp-item"><span class="lx-fp-num">${i + 1}</span><span>${esc(p)}</span></li>`
        ).join('');
        el.innerHTML = `<div class="lx-fp"><div class="lx-fp-inner">
          <div class="lx-fp-label">Forum discussion prompts</div>
          <ul class="lx-fp-list">${items}</ul>
        </div></div>`;
      } else {
        // Multiple groups — prefix each with the topic title; numbers restart per group
        const groups = topicsWithPrompts.map(t => {
          const items = t.forumPrompts.map((p, i) =>
            `<li class="lx-fp-item"><span class="lx-fp-num">${i + 1}</span><span>${esc(p)}</span></li>`
          ).join('');
          return `<div class="lx-fp"><div class="lx-fp-inner">
            <div class="lx-fp-label">${esc(t.title)}</div>
            <ul class="lx-fp-list">${items}</ul>
          </div></div>`;
        }).join('');
        el.innerHTML = groups;
      }
      return;
    }

    // ── flat path (backwards-compatible) ──────────────────────────────────────
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
export async function renderWorkedExample({ forUnit, forTri, forYear, forWeek, forDate, containerId = 'lxdune-worked-example' } = {}) {
  const el = document.getElementById(containerId); if (!el) return;
  try {
    const { unitCfg, week } = await resolve({ forUnit, forTri, forYear, forWeek, forDate });
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

// ── CSS for renderCurrentWeek ─────────────────────────────────────────────────
const CURRENT_WEEK_CSS = `
.lx-cw{max-width:950px;margin:30px auto;font-family:Arial,sans-serif;color:#1F2A33;line-height:1.55;}
.lx-cw-header{padding:20px 24px;background:var(--lx-primary,#1f6fb2);color:#fff;border-radius:12px 12px 0 0;margin-bottom:0;}
.lx-cw-header-pre{font-size:.75em;font-weight:900;text-transform:uppercase;letter-spacing:.8px;opacity:.8;margin-bottom:4px;}
.lx-cw-title{font-size:1.25em;font-weight:900;margin:0;}
.lx-cw-body{border:1px solid #dfe6ea;border-top:none;border-radius:0 0 12px 12px;overflow:hidden;}
.lx-cw-section{padding:16px 20px;border-bottom:1px solid #f0f2f4;}
.lx-cw-section:last-child{border-bottom:none;}
.lx-cw-label{font-size:.72em;font-weight:900;text-transform:uppercase;letter-spacing:.6px;color:#6F7B84;margin-bottom:6px;}
.lx-cw-note{background:#eef5fb;border-left:4px solid var(--lx-primary,#1f6fb2);border-radius:4px;padding:10px 14px;font-size:.92em;color:#1F2A33;}
.lx-cw-focus{font-weight:700;font-size:.97em;color:#1F2A33;}
.lx-cw-tasks{margin:8px 0 0 18px;padding:0;font-size:.9em;}
.lx-cw-tasks li{margin:5px 0;}
.lx-cw-prompt{font-size:.9em;color:#1F2A33;background:#f9fafb;border:1px solid #e8edf0;border-radius:6px;padding:10px 14px;}
.lx-cw-see-all{display:inline-block;margin-top:6px;font-size:.82em;color:var(--lx-accent,#25797F);font-weight:700;text-decoration:none;}
.lx-cw-lo-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}
.lx-cw-lo-pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:.78em;font-weight:800;color:#fff;}
.lx-cw-pe{padding:20px;border:1px solid #dfe6ea;border-left:6px solid #6F7B84;border-radius:12px;background:#f4f6f8;}
.lx-cw-pe h3{margin:0 0 6px;color:#1F2A33;}`;

// ── 16. renderCurrentWeek ─────────────────────────────────────────────────────
// Container: <div id="lxdune-current-week"></div>
// Renders a 'This week' spotlight card for the current teaching week.
export async function renderCurrentWeek({ forUnit, forTri, forYear, forDate, containerId = 'lxdune-current-week' } = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  let ctx;
  try { ctx = await resolve({ forUnit, forTri, forYear, forDate }); }
  catch (e) { setError(el, `Could not load content: ${e.message}`); return; }

  const { unitCfg, week, weekNum } = ctx;
  applyTheme(unitCfg);
  injectStyles('lx-cw-styles', CURRENT_WEEK_CSS);

  // PE / non-teaching period
  if (!week || NO_TEACHING.has(weekNum)) {
    const label = weekNum === 14 ? 'Assessment and Intensive Period' : 'Professional Experience Period';
    const reminder = buildAssessmentReminders(unitCfg, unitCfg.assessmentPortalUrl);
    el.innerHTML = `<div class="lx-cw">
      <div class="lx-cw-pe">
        <h3>${esc(label)}</h3>
        <p style="margin:0;font-size:.93em;">There is no teaching this week. Use this time for Professional Experience and to stay on top of assessment requirements.</p>
        ${reminder}
      </div>
    </div>`;
    return;
  }

  const loMap = Object.fromEntries((unitCfg.learningOutcomes ?? []).map(lo => [lo.id, lo]));
  const sections = [];

  // Orientation note — expanded (not collapsible)
  if (week.orientationNote) {
    sections.push(`<div class="lx-cw-section">
      <div class="lx-cw-label">Unit context</div>
      <div class="lx-cw-note">${esc(week.orientationNote)}</div>
    </div>`);
  }

  // Announcement body
  const ab = week.announcementBody ?? null;
  const intro = typeof ab === 'object' && ab !== null ? (ab.intro ?? null) : (typeof ab === 'string' ? ab : null);
  if (intro) {
    sections.push(`<div class="lx-cw-section">
      <div class="lx-cw-label">This week</div>
      <div style="font-size:.93em;">${esc(intro)}</div>
    </div>`);
  }

  // Live session focus + tasks
  if (week.liveSessionFocus || (week.liveSessionTasks ?? []).length) {
    const tasks = (week.liveSessionTasks ?? []).map(t => `<li>${esc(t)}</li>`).join('');
    sections.push(`<div class="lx-cw-section">
      <div class="lx-cw-label">Live session</div>
      ${week.liveSessionFocus ? `<div class="lx-cw-focus">${esc(week.liveSessionFocus)}</div>` : ''}
      ${tasks ? `<ul class="lx-cw-tasks">${tasks}</ul>` : ''}
    </div>`);
  }

  // First forum prompt only
  const prompts = week.forumPrompts ?? [];
  if (prompts.length) {
    const more = prompts.length > 1 ? `<span class="lx-cw-see-all">See all prompts below ↓</span>` : '';
    sections.push(`<div class="lx-cw-section">
      <div class="lx-cw-label">Forum activity</div>
      <div class="lx-cw-prompt">${esc(prompts[0])}</div>
      ${more}
    </div>`);
  }

  // LO pills
  const loIds = Array.isArray(week.loMapping) ? week.loMapping : [];
  if (loIds.length) {
    const pills = loIds.map(id => {
      const lo = loMap[id];
      return lo ? `<span class="lx-cw-lo-pill" style="background:${esc(lo.color)};">${esc(id)}</span>` : '';
    }).filter(Boolean).join('');
    sections.push(`<div class="lx-cw-section">
      <div class="lx-cw-label">Learning outcomes this week</div>
      <div class="lx-cw-lo-row">${pills}</div>
    </div>`);
  }

  el.innerHTML = `<div class="lx-cw">
    <div class="lx-cw-header">
      <div class="lx-cw-header-pre">${esc(unitCfg.code)} • Week ${weekNum} — This week</div>
      <div class="lx-cw-title">${esc(week.item ?? `Week ${weekNum}`)}: ${esc(week.title ?? '')}</div>
    </div>
    <div class="lx-cw-body">${sections.join('') || '<div class="lx-cw-section"><p style="margin:0;color:#6F7B84;">Content coming soon.</p></div>'}</div>
  </div>`;
}
