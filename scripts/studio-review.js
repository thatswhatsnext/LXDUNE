#!/usr/bin/env node
// scripts/studio-review.js
// Renders a habit's Habit Studio content as one HTML review copy: every station's
// content in the order a player meets it, with drafts, provenance and author notes
// shown. The copy includes expert answers and placements, so keep it private.
//
// --placement makes a blind placement sheet instead: the rubric and every artefact
// still waiting for expert placements, in a fixed shuffled order, with no placements,
// rationales or author notes. A reviewer picks a level and gives a reason for each,
// then downloads a CSV to send back. Artefacts are held in level order in the file,
// so the shuffle keeps order from giving the answers away.
//
// Usage: node scripts/studio-review.js <habit-id> <output.html> [--placement]

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { contextLabel, vocabLabels } from '../games/metacognition-coach/coach.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const placementMode = args.includes('--placement');
const [habit, out] = args.filter((a) => a !== '--placement');
if (!habit || !out) {
  console.error('Usage: node scripts/studio-review.js <habit-id> <output.html> [--placement]');
  process.exit(1);
}
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const manifest = readJson('games/habit-studio/studio.json');
const entry = manifest.habits.find((h) => h.habit === habit);
if (!entry) {
  console.error(`No habit "${habit}" in games/habit-studio/studio.json`);
  process.exit(1);
}
const fwDir = `frameworks/${manifest.habitsFrom}`;
const fw = readJson(`${fwDir}/framework.json`);
const habitName = readJson(`${fwDir}/${fw.matrix.habits}`).find((h) => h.id === habit).name;
const labels = vocabLabels(JSON.parse(readFileSync(resolve(ROOT, fwDir, fw.vocabulary), 'utf8')));
const load = (key) => readJson(`games/habit-studio/${entry.dir}/${entry.files[key]}`);
const list = (key) => load(key).items;

// Content strings are constrained HTML (<b>, <i>, <sub>, <sup>) and go in as is;
// everything else is escaped.
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ctx = (c) => (c ? `<p class="ctx">${esc(contextLabel(c, labels))}</p>` : '');
function prov(x) {
  const state = x.published ? 'Published' : 'Draft';
  const who = x.reviewedBy.length ? `reviewed by ${esc(x.reviewedBy.join(', '))}` : 'not yet reviewed';
  return (
    `<p class="prov"><span class="badge ${x.published ? 'pub' : 'draft'}">${state}</span> ${esc(x.source)} · v${esc(x.version)} · ${who}` +
    `${x.material ? ` · ${esc(x.material)}` : ''} · <code>${esc(x.id)}</code></p>` +
    (x.authorNote ? `<p class="anote"><b>Author note:</b> ${esc(x.authorNote)}</p>` : '')
  );
}
const reveal = (label, html) => `<details class="reveal"><summary>${label}</summary><div>${html}</div></details>`;
const lines = (ls) => `<ol class="lines">${ls.map((l) => `<li><span class="who">${esc(l.speaker)}</span> ${l.text}</li>`).join('')}</ol>`;
function mark(text, quotes) {
  let t = text;
  quotes.forEach((q, i) => (t = t.replace(q, `<mark>${q}<sup class="n">${i + 1}</sup></mark>`)));
  return t;
}

// ── stations ───────────────────────────────────────────────────────────────────
function explainer(x) {
  const body = x.body
    .map((p, i) => {
      const prompts = x.prompts
        .filter((pr) => pr.after === i + 1)
        .map((pr) => `<div class="prompt"><p><b>Explain it:</b> ${pr.prompt}</p><div class="answerbox">The player writes here first.</div>${reveal('Expert answer', `<p>${pr.expertAnswer}</p>`)}</div>`)
        .join('');
      return `<p>${p}</p>${prompts}`;
    })
    .join('');
  const d = x.diagram;
  const diagram =
    `<figure class="seq" aria-label="${esc(d.alt)}"><figcaption>${esc(d.title)}</figcaption><div class="steps">` +
    d.steps.map((s) => `<div class="step"><b>${esc(s.label)}</b><span class="who">${esc(s.who)}</span><p>${s.text}</p></div>`).join('<span class="arrow" aria-hidden="true">→</span>') +
    `</div></figure>`;
  const dil = x.dilutions.map((v) => `<li><b>${esc(v.name)}</b><p class="ex">${v.example}</p><p>${v.whyItFails}</p></li>`).join('');
  const ev = x.evidence.map((e) => `<li>${esc(e.citation)} — ${e.relevance} ${e.verified ? '<span class="ok">verified</span>' : '<span class="warn">not yet verified</span>'}</li>`).join('');
  return `${prov(x)}<h3>${esc(x.title)}</h3>${diagram}${body}<h4>Common dilutions</h4><ul class="dil">${dil}</ul><h4>Evidence</h4><ul class="ev">${ev}</ul>`;
}
function casePair(x, n) {
  const notes = (v) => x.annotation.notes.filter((no) => no.version === v).map((no) => `<li><b>Line ${no.line}:</b> ${no.text}</li>`).join('');
  return (
    `${prov(x)}<h3>Pair ${n}: ${esc(x.title)} <span class="diff">difficulty ${x.difficulty}</span></h3>${ctx(x.context)}<p>${x.setup}</p>` +
    `<div class="pair"><div><h4>Version A</h4>${lines(x.versions.a)}</div><div><h4>Version B</h4>${lines(x.versions.b)}</div></div>` +
    `<div class="answerbox">The player writes what differs and what it does to students’ thinking, then rates which version they’d choose and how sure they are.</div>` +
    reveal('Expert annotation', `<p><b>The difference:</b> ${x.difference}</p><p><b>Experts prefer version ${x.expertPreference.toUpperCase()}.</b> ${x.annotation.summary}</p><div class="pair"><ul>${notes('a')}</ul><ul>${notes('b')}</ul></div>`)
  );
}
function rubric(x) {
  return (
    `${prov(x)}<h3>${esc(x.title)}</h3><p>${x.focus}</p><table class="rubric"><thead><tr><th>Level</th><th>What it looks like</th><th>Anchor</th></tr></thead><tbody>` +
    x.levels.map((l) => `<tr><td><b>${l.level}. ${esc(l.name)}</b></td><td>${l.descriptor}</td><td class="anchor">${l.anchor}</td></tr>`).join('') +
    `</tbody></table>`
  );
}
function artefact(x, n) {
  const pl = x.placements
    .map((p) => `<li><b>${p.by === 'draft' ? 'Provisional (needs an expert)' : esc(p.by)}: level ${p.level}</b> — ${p.rationale}</li>`)
    .join('');
  const levels = new Set(x.placements.filter((p) => p.by !== 'draft').map((p) => p.level));
  return (
    `${prov(x)}<h3>Artefact ${n}: ${esc(x.studentLabel)}, ${esc(x.kind.replace(/-/g, ' '))}${x.use === 'spaced' ? ' <span class="diff">held back for the spaced revisits</span>' : ''}</h3>${ctx(x.context)}<p><b>Task:</b> ${x.prompt}</p>${lines(x.content)}` +
    `<div class="answerbox">The player places this on levels 1–4 and gives a one-line reason.</div>` +
    reveal(levels.size > 1 ? 'Expert placements — experts split' : 'Expert placements', `<ul>${pl}</ul>`)
  );
}
function brief(x, n) {
  const ex = x.exemplars
    .map((e) => {
      const q = e.annotations.map((a) => a.quote);
      return `<div class="exemplar ${e.quality}"><h4>${e.quality[0].toUpperCase() + e.quality.slice(1)}</h4><p>${mark(e.text, q)}</p><ol class="ann">${e.annotations.map((a) => `<li>${a.comment}</li>`).join('')}</ol>${e.summary ? `<p class="sum">${e.summary}</p>` : ''}</div>`;
    })
    .join('');
  return (
    `${prov(x)}<h3>Brief ${n}: ${esc(x.title)}</h3>${ctx(x.context)}<p><b>Moment:</b> ${x.moment}</p><p><b>Your students:</b> ${x.studentProfile}</p><p><b>Your task:</b> ${x.task}</p>` +
    `<div class="answerbox">The player writes their move, then checks it:<ul>${x.selfCheck.map((c) => `<li>${c}</li>`).join('')}</ul></div>` +
    reveal('Annotated exemplars (shown after the self-check), then the player revises', ex)
  );
}
function unitPlan(x) {
  const rows = x.moments.map((m) => `<tr class="${m.kind}"><td>Week ${m.week}</td><td><b>${esc(m.kind)}</b></td><td>${m.what}</td><td>${m.why}</td></tr>`).join('');
  return (
    `${prov(x)}<h3>${esc(x.title)}</h3>${ctx(x.context)}<div class="answerbox">The player places introduce, practise, fade and check moments on a ${x.weeks}-week timeline, with built-in checks (for example “There is no check after the scaffold fades”).</div>` +
    reveal('Expert plan', `<table class="plan"><thead><tr><th>When</th><th>Moment</th><th>What</th><th>Why</th></tr></thead><tbody>${rows}</tbody></table><p>${x.summary}</p>`)
  );
}
function rehearsal(x) {
  const p = x.protocol;
  return (
    `${prov(x)}<h3>Rehearsal cues</h3><p>Shown beside the player’s own revised script from Station D.</p><ul class="cues">${x.cues.map((c) => `<li><b>${esc(c.label)}</b> ${c.text}</li>`).join('')}</ul>` +
    `<h3>${esc(p.title)}</h3><p><b>Try:</b> ${p.try}</p><p><b>Collect:</b></p><ul>${p.collect.map((c) => `<li>${c}</li>`).join('')}</ul><p><b>Afterwards:</b></p><ol>${p.afterwards.map((c) => `<li>${c}</li>`).join('')}</ol>`
  );
}

const sections = [
  ['A', 'How it works', explainer(load('explainer'))],
  ['B', 'Contrasting cases', list('cases').map((c, i) => casePair(c, i + 1)).join('<hr>')],
  ['C', 'Reading student thinking', rubric(load('rubric')) + '<hr>' + list('artefacts').map((a, i) => artefact(a, i + 1)).join('<hr>')],
  ['D', 'Design a move', list('briefs').map((b, i) => brief(b, i + 1)).join('<hr>')],
  ['E', 'Plan across a unit', unitPlan(load('unitPlan'))],
  ['F', 'Rehearse and take it to placement', rehearsal(load('rehearsal'))],
];

const CSS = `
:root{--bg:#F2F0EA;--paper:#fff;--sunk:#F6F4EF;--ink:#19282F;--body:#3B474F;--muted:#636F77;--line:#E2DDD2;--accent:#1C4C5B;--soft:#E0EBEE;--pos:#2C6046;--possoft:#E5EFE9;--warn:#7A6B1F;--warnsoft:#F6EEDC;--neg:#8B4232;--negsoft:#F7ECE7}
body{margin:0;background:var(--bg);color:var(--body);font:15px/1.6 -apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:920px;margin:0 auto;padding:28px 18px 70px}h1,h2,h3{font-family:Georgia,"Times New Roman",serif;color:var(--ink);line-height:1.25}
h1{font-size:28px;margin:0 0 6px}h2{font-size:21px;margin:0 0 12px}h3{font-size:18px;margin:18px 0 8px}h4{font-size:14px;margin:14px 0 6px;color:var(--ink)}
.intro,section{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:18px 22px;margin-bottom:18px}
.station{font:700 12px/1 -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:0 0 6px}
.prov{font-size:12.5px;color:var(--muted);margin:0 0 4px}.badge{font-weight:700;border-radius:999px;padding:1px 8px;font-size:11.5px}
.badge.draft{background:var(--warnsoft);color:var(--warn)}.badge.pub{background:var(--possoft);color:var(--pos)}
.anote{font-size:12.5px;background:var(--sunk);border-left:3px solid var(--warn);padding:6px 10px;margin:4px 0 10px}
.ctx{font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--accent);margin:0 0 6px}
.answerbox{border:1.5px dashed var(--line);border-radius:10px;padding:10px 14px;color:var(--muted);font-size:13.5px;margin:12px 0}
.answerbox ul{margin:6px 0 0}details.reveal{background:var(--soft);border-radius:10px;padding:8px 14px;margin:10px 0}details.reveal summary{cursor:pointer;font-weight:700;color:var(--accent)}
.prompt{border-left:3px solid var(--accent);padding:4px 0 4px 14px;margin:10px 0 16px}
.seq{margin:12px 0 16px}.seq figcaption{font-weight:700;color:var(--ink);margin-bottom:8px}.steps{display:flex;gap:8px;align-items:stretch;flex-wrap:wrap}
.step{flex:1;min-width:180px;background:var(--sunk);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.step .who{display:block;font-size:12px;color:var(--muted)}.step p{margin:6px 0 0;font-size:13.5px}
.arrow{align-self:center;color:var(--muted)}.dil li,.ev li{margin-bottom:8px}.dil .ex{font-style:italic;margin:2px 0}
.ok{color:var(--pos);font-weight:700;font-size:12px}.warn{color:var(--neg);font-weight:700;font-size:12px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:700px){.pair{grid-template-columns:1fr}}
.lines{padding-left:22px;margin:0}.lines li{margin-bottom:6px}.lines .who{font-weight:700;font-size:12.5px;color:var(--muted);margin-right:4px}
.diff{font:600 12px -apple-system,sans-serif;color:var(--muted)}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--sunk)}.anchor{font-style:italic}.exemplar{border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:10px 0;background:var(--paper)}
.exemplar.strong{border-left:4px solid var(--pos)}.exemplar.flawed{border-left:4px solid var(--warn)}.exemplar.weak{border-left:4px solid var(--neg)}
mark{background:#FBE9B7;padding:0 2px}sup.n{font-weight:700;color:var(--warn)}.ann{font-size:13.5px}.sum{font-weight:600}
hr{border:none;border-top:1px solid var(--line);margin:22px 0}code{font-size:12px}
`;

const page = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Habit Studio review: ${esc(habitName)}</title><style>${CSS}</style></head><body><main>
<h1>Habit Studio review: ${esc(habitName)}</h1>
<div class="intro"><p>Every station’s content for <b>${esc(habitName)}</b>, in the order a player meets it. Dashed boxes show where the player writes or decides; shaded “reveal” panels show what appears after they commit. Drafts carry author notes. Generated by <code>scripts/studio-review.js</code> on ${new Date().toISOString().slice(0, 10)}.</p>
<p><b>Contains expert answers and placements: keep private.</b></p></div>
${sections.map(([k, t, h]) => `<section><p class="station">Station ${k}</p><h2>${t}</h2>${h}</section>`).join('\n')}
</main></body></html>`;
// ── blind placement sheet ──────────────────────────────────────────────────────
// A small seeded shuffle (mulberry32) so every reviewer sees the same order.
function shuffled(items, seed) {
  let t = seed >>> 0;
  const rand = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function placementSheet() {
  const rub = load('rubric');
  const all = list('artefacts');
  const placed = all.filter((x) => x.placements.filter((p) => p.by !== 'draft').length >= 2);
  const todo = shuffled(all.filter((x) => !placed.includes(x)), 20261030);
  const rubricTable =
    `<h3>${esc(rub.title)}</h3><p>${rub.focus}</p><table class="rubric"><thead><tr><th>Level</th><th>What it looks like</th><th>Anchor</th></tr></thead><tbody>` +
    rub.levels.map((l) => `<tr><td><b>${l.level}. ${esc(l.name)}</b></td><td>${l.descriptor}</td><td class="anchor">${l.anchor}</td></tr>`).join('') +
    `</tbody></table>`;
  const cards = todo
    .map(
      (x, i) =>
        `<section class="art" data-id="${esc(x.id)}"><p class="station">Sample ${i + 1} of ${todo.length} · <code>${esc(x.id)}</code></p>` +
        `<h2>${esc(x.studentLabel)}, ${esc(x.kind.replace(/-/g, ' '))}</h2>${ctx(x.context)}<p><b>Task:</b> ${x.prompt}</p>${lines(x.content)}` +
        `<fieldset><legend>Level</legend>${rub.levels.map((l) => `<label><input type="radio" name="lv-${esc(x.id)}" value="${l.level}"> ${l.level}. ${esc(l.name)}</label>`).join('')}</fieldset>` +
        `<label class="why">Why this level? (one or two sentences)<textarea rows="3" name="why-${esc(x.id)}"></textarea></label></section>`,
    )
    .join('\n');
  const skipped = placed.length
    ? `<p>Already placed by two reviewers, so not included: ${placed.map((x) => `<code>${esc(x.id)}</code>`).join(', ')}.</p>`
    : '';
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Placement sheet: ${esc(habitName)}</title><style>${CSS}
fieldset{border:1px solid var(--line);border-radius:10px;margin:14px 0 8px;padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px 18px}
legend{font-weight:700;color:var(--ink);padding:0 4px}label.why{display:block;font-weight:600;color:var(--ink);font-size:14px}
textarea,input[type=text]{width:100%;box-sizing:border-box;font:inherit;border:1px solid var(--line);border-radius:8px;padding:8px;margin-top:4px;background:var(--paper);color:var(--body)}
.bar{position:sticky;bottom:0;background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:12px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
button{font:700 14px -apple-system,sans-serif;background:var(--accent);color:#fff;border:0;border-radius:999px;padding:10px 18px;cursor:pointer}
@media print{.bar,button{display:none}section{break-inside:avoid}}
</style></head><body><main>
<h1>Placement sheet: ${esc(habitName)}</h1>
<div class="intro"><p>Place each sample of student work on the rubric below, at the level its <b>thinking</b> shows, not its neatness or length. Work on your own: don’t compare placements with the other reviewer until you’ve both finished. Some samples are meant to be hard to place. If you’re torn, choose one and say why in your reason. A split between reviewers is useful.</p>
<p>The samples are in a fixed shuffled order. Your answers stay in this page until you download them, so download before you close it, then send the CSV file to Steve.</p>
<label class="why">Your name<input type="text" id="reviewer" autocomplete="name"></label>${skipped}</div>
<section><p class="station">The rubric</p>${rubricTable}</section>
${cards}
<div class="bar"><button type="button" id="dl">Download my placements (CSV)</button><span id="status" aria-live="polite"></span></div>
</main><script>
const ids=[...document.querySelectorAll('.art')].map(s=>s.dataset.id);
const q=(s)=>document.querySelector(s);
function csv(v){return '"'+String(v).replace(/"/g,'""')+'"';}
q('#dl').addEventListener('click',()=>{
  const who=q('#reviewer').value.trim();
  const rows=ids.map(id=>{const lv=q('input[name="lv-'+id+'"]:checked');return [id,lv?lv.value:'',q('textarea[name="why-'+id+'"]').value.trim()];});
  const missing=rows.filter(r=>!r[1]).length;
  if(!who){q('#status').textContent='Add your name at the top first.';q('#reviewer').focus();return;}
  const text=['artefact,reviewer,level,rationale',...rows.map(r=>[r[0],who,r[1],r[2]].map(csv).join(','))].join('\\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));
  a.download='placements-${esc(habit)}-'+who.replace(/[^A-Za-z0-9]+/g,'-')+'.csv';a.click();
  q('#status').textContent=missing?'Downloaded. '+missing+' sample(s) have no level yet.':'Downloaded all '+rows.length+' placements.';
});
</script></body></html>`;
}

writeFileSync(out, placementMode ? placementSheet() : page);
console.log(`Wrote ${out}`);
