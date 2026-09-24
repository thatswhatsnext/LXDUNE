/* Loaded after the data: the shell (or the single-file build) sets window.RECKONER_DATA first. */
const DATA = window.RECKONER_DATA;
const G = Object.fromEntries(DATA.guides.map(g => [g.id, g]));
const M = Object.fromEntries(DATA.models.map(m => [m.id, m]));
const RANKED = DATA.models.filter(m => m.p);
const DIMS = DATA.dims, SCALE = DATA.scale, QUICK = DATA.quick, PURPOSE_PHRASE = DATA.purposePhrase;
const dimById = Object.fromEntries(DIMS.map(d => [d.id, d]));
const optLabel = (d, v) => dimById[d].options.find(o => o[0] === v)[1];
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const badge = s => `<span class="badge ${SCALE[s].cls}" title="${esc(SCALE[s].tip)}">${SCALE[s].label}</span>`;
document.getElementById("buildStamp").textContent =
  `Guides: ${DATA.guides.map(g => `${g.name} v${g.version}, reviewed ${g.lastReviewed}`).join("; ")}.`;

/* tiny markdown: paragraphs, bold, italics, lists */
function md(t){
  const lines = String(t).trim().split("\n");
  let html = "", list = false;
  for (const raw of lines){
    const l = raw.trim();
    if (/^[-*] /.test(l)){ if(!list){html+="<ul class='tight'>";list=true;} html += `<li>${inline(l.slice(2))}</li>`; continue; }
    if (list){ html += "</ul>"; list = false; }
    if (l) html += `<p>${inline(l)}</p>`;
  }
  return html + (list ? "</ul>" : "");
}
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/(^|\W)\*(\S[^*]*?)\*/g,"$1<em>$2</em>");

/* storage: per-viewer conveniences only */
const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem("reckoner:"+k) || "null"); }catch{ return null; } },
  set(k,v){ try{ localStorage.setItem("reckoner:"+k, JSON.stringify(v)); }catch{} }
};

/* ---------- tabs and routing ---------- */
const tabs = [...document.querySelectorAll(".tab")];
function selectTab(t, push = true){
  tabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
    const p = document.getElementById(x.getAttribute("aria-controls")); p.hidden = !on; p.classList.toggle("active", on); });
  if (push && t.id !== "t-guides") location.hash = "";
}
tabs.forEach((t,i) => { t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", e => { if(e.key==="ArrowRight") selectTab(tabs[(i+1)%tabs.length]).focus?.();
    if(e.key==="ArrowLeft") selectTab(tabs[(i-1+tabs.length)%tabs.length]); }); });

function openGuide(id, section){
  if (!G[id]) return;
  selectTab(document.getElementById("t-guides"), false);
  renderGuide(id);
  location.hash = `#/guide/${id}${section ? "/" + section : ""}`;
  requestAnimationFrame(() => {
    const el = section && document.getElementById("s-" + section);
    (el || document.getElementById("p-guides")).scrollIntoView?.({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    if (el) markNav(section);
  });
}
addEventListener("hashchange", routeFromHash);
function routeFromHash(){
  const m = location.hash.match(/^#\/guide\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?/);
  if (m) openGuide(m[1], m[2]);
}

/* ---------- shared model card body ---------- */
function modelBody(m){
  const guideLink = m.hasGuide
    ? `<p style="margin-top:.8rem"><button class="ghost" type="button" onclick="openGuide('${m.id}')">Open the ${esc(m.name)} companion guide</button></p>`
    : `<p class="hint" style="margin-top:.8rem">Companion guide coming soon for this model.</p>`;
  return `
  <ol class="phases" aria-label="Phases">${m.phases.map(p => `<li>${esc(p)}</li>`).join("")}</ol>
  <p><strong>Distinguishing feature.</strong> ${esc(m.distinct)}</p>
  <p><strong>Best science fit.</strong> ${esc(m.fit)}</p>
  <div class="roles"><div><h4>Teacher’s role</h4><p>${esc(m.teacher)}</p></div><div><h4>Learner’s role</h4><p>${esc(m.learner)}</p></div></div>
  <p><strong>Common pitfall.</strong> ${esc(m.pitfall)}</p>
  <details class="why"><summary>Why this matters: theory and evidence</summary>
    <div class="theory">${m.theory.map(t => `<span>${esc(t)}</span>`).join("")}</div>
    <p style="font-size:.93rem">${esc(m.evidence)}</p></details>
  ${guideLink}`;
}
const chipsHTML = (d, prefix, type) => d.options.map(([v,l]) =>
  `<label class="chip"><input type="${type}" name="${prefix}-${d.id}" value="${v}"><span>${esc(l)}</span></label>`).join("");

/* ---------- quick reckoner ---------- */
const quickForm = document.getElementById("quickForm");
quickForm.innerHTML = ["purpose","time","ready"].map(id => { const d = dimById[id];
  return `<fieldset class="q"><legend>${esc(d.label)}</legend><div class="chips">${chipsHTML(d,"q","radio")}</div>
  <div class="q-foot"><details class="help"><summary>What this means</summary><p>${esc(d.help)}</p></details></div></fieldset>`; }).join("");
let quickPreview = null;
const quickAnswers = () => { const f = new FormData(quickForm);
  return { purpose: f.get("q-purpose"), time: f.get("q-time"), ready: f.get("q-ready") }; };
function quickCompute(a){
  if (!a.purpose || !a.time || !a.ready) return null;
  if (a.time === "lesson"){
    if (a.purpose === "reason") return { id:"case", label:"A single CASE lesson", side:null, why:"In one lesson, a CASE lesson can target a reasoning pattern through conflict, group talk and reflection." };
    return { id:"poe", label:"A single Predict–Observe–Explain", side:null, why:"With one lesson, a POE is the most efficient constructivist move: it surfaces students’ ideas and puts them under pressure." };
  }
  const right = (a.ready === "experienced" && a.time !== "short") || (a.ready === "developing" && a.time === "depth");
  const side = right ? "right" : "left";
  const [id,label] = QUICK[a.purpose][side];
  const why = right
    ? `You want students to ${PURPOSE_PHRASE[a.purpose]}, and your learners have the experience and time to take more control.`
    : `You want students to ${PURPOSE_PHRASE[a.purpose]}. With ${a.ready === "novice" ? "novice learners" : "the time available"}, a more structured model keeps cognitive load manageable.`;
  return { id, label, side, why };
}
function renderQuick(){
  const a = quickAnswers(), r = quickCompute(a), out = document.getElementById("quickResult");
  const rec = quickPreview || r, previewing = !!quickPreview;
  if (!rec) out.innerHTML = `<div class="box"><p class="empty">Answer the three questions to see a recommendation, or select a cell in the matrix below.</p></div>`;
  else {
    const m = M[rec.id];
    out.innerHTML = `<article class="card lead"><div class="card-head"><div>
      <p class="hint" style="margin:0 0 .2rem">${previewing ? "Previewing from the matrix" : "Recommended for your answers"}</p>
      <h2>${esc(rec.label)}</h2><p class="src">${esc(m.name)} · ${esc(m.src)}</p></div>${badge(m.scale)}</div>
      ${rec.why ? `<p style="margin-top:.7rem">${esc(rec.why)}</p>` : ""}${modelBody(m)}
      ${previewing ? `<p><button class="ghost" type="button" id="backRec">Back to my recommendation</button></p>` : ""}</article>`;
    const b = document.getElementById("backRec"); if (b) b.onclick = () => { quickPreview = null; renderQuick(); };
  }
  renderMatrix(r);
}
function renderMatrix(r){
  const a = quickAnswers();
  const rows = Object.keys(QUICK).map(k => {
    const cell = side => { const [id,label] = QUICK[k][side];
      const sel = r && r.side === side && a.purpose === k && !quickPreview;
      const prev = quickPreview && quickPreview.key === k && quickPreview.side === side;
      return `<td><button type="button" class="cellbtn${sel?" sel":""}${prev?" prev":""}" data-k="${k}" data-side="${side}" aria-pressed="${sel||prev}">${esc(label)}</button></td>`; };
    return `<tr><th scope="row">${esc(optLabel("purpose",k))}</th>${cell("left")}${cell("right")}</tr>`; }).join("");
  document.getElementById("matrix").innerHTML =
    `<thead><tr><th scope="col">Primary purpose</th><th scope="col">Novice learners or a short timeframe</th><th scope="col">Experienced learners and a longer timeframe</th></tr></thead><tbody>${rows}</tbody>`;
  document.querySelectorAll(".cellbtn").forEach(b => b.onclick = () => {
    const k = b.dataset.k, side = b.dataset.side, [id,label] = QUICK[k][side];
    quickPreview = { id, label, key:k, side, why:`For the purpose “${optLabel("purpose",k)}” with ${side==="left"?"novice learners or a short timeframe":"experienced learners and a longer timeframe"}.` };
    renderQuick();
  });
}
quickForm.addEventListener("change", () => { quickPreview = null; renderQuick(); });

/* ---------- detailed reckoner ---------- */
const detailForm = document.getElementById("detailForm");
detailForm.innerHTML = DIMS.map(d => `<fieldset class="q" data-dim="${d.id}"><legend>${esc(d.label)}</legend>
  ${d.sub ? `<p class="hint">${esc(d.sub)}</p>` : ""}
  <div class="chips">${chipsHTML(d,"d",d.multi?"checkbox":"radio")}</div>
  <p class="note" id="note-${d.id}" aria-live="polite"></p>
  <div class="q-foot"><details class="help"><summary>What this means</summary><p>${esc(d.help)}</p></details>
  <label class="imp">Importance <select data-imp="${d.id}"><option value="0.5">Low</option><option value="1" selected>Normal</option><option value="2">High</option></select></label>
  </div></fieldset>`).join("");
function detailAnswers(){
  const f = new FormData(detailForm), a = {}, imp = {};
  DIMS.forEach(d => { a[d.id] = d.multi ? f.getAll("d-"+d.id) : (f.get("d-"+d.id) || null);
    imp[d.id] = +detailForm.querySelector(`[data-imp="${d.id}"]`).value; });
  return { a, imp };
}
function dimScore(m,d,a){
  const sel = d.multi ? a[d.id] : (a[d.id] ? [a[d.id]] : []);
  if (!sel.length) return null;
  const idx = v => d.options.findIndex(o => o[0] === v);
  return sel.reduce((s,v) => s + +m.p[d.id][idx(v)], 0) / sel.length;
}
function fit(m,a,imp){ let num=0, den=0;
  DIMS.forEach(d => { const s = dimScore(m,d,a); if (s===null) return; const w = d.weight*imp[d.id]; num += w*s; den += w*3; });
  return den ? num/den : null; }
const rankAll = (a,imp) => RANKED.map(m => ({ m, f: fit(m,a,imp) })).filter(x => x.f !== null).sort((x,y) => y.f - x.f);
const has = (a,id,v) => Array.isArray(a[id]) ? a[id].includes(v) : a[id] === v;
function watchOuts(m,a){ const W = [];
  if (["pbl","project-based","interactive-approach"].includes(m.id) && a.ready==="novice") W.push("Novice learners: high cognitive load risk. Scaffold heavily, or start with a more structured model.");
  if (["pbl","project-based","ast","interactive-approach","e7"].includes(m.id) && (a.time==="lesson"||a.time==="short")) W.push("This model needs a longer run than you have. Consider a shorter model or extend the sequence.");
  if (a.conf==="low" && ["ast","pbl","project-based","interactive-approach","case","glm"].includes(m.id)) W.push("Demanding to facilitate. Script your key questions, and observe or co-teach with a colleague first if you can.");
  if (a.res==="none" && ["design-cycle","learning-cycle","adi","interactive-approach"].includes(m.id)) W.push("Relies on hands-on work. Substitute simulations or secondary data sets.");
  if (a.lang==="high" && ["glm","case","ssi","adi","pbl"].includes(m.id)) W.push("Talk- and text-heavy. Add sentence frames, vocabulary pre-teaching or an SWH template.");
  if (a.misc==="robust" && ["pbl","project-based","design-cycle","ssi","interactive-approach"].includes(m.id)) W.push("Does not target misconceptions directly. Embed a POE early in the sequence.");
  if (a.concept==="abstract" && ["design-cycle","learning-cycle","interactive-approach"].includes(m.id)) W.push("Abstract concept: add an explicit modelling task so students can represent what they cannot see.");
  if (a.concept==="value" && m.id!=="ssi") W.push("Value-laden topic: include an SSI deliberation, for example in the application phase.");
  return W.slice(0,3); }
function nesting(m,a){ const N = [];
  if (a.misc==="robust" && m.id!=="poe") N.push({ text:"Open with a Predict–Observe–Explain to surface and challenge the target misconception.", guide:"poe" });
  if (has(a,"ws","8") && !["adi","swh"].includes(m.id)) N.push({ text:"Add a Science Writing Heuristic template or an ADI argumentation session to the sense-making phase (WS-08)." });
  if (a.concept==="abstract" && m.id!=="ast") N.push({ text:"Add a model-drafting and revision task, borrowed from Ambitious Science Teaching." });
  if (has(a,"purpose","reason") && m.id!=="case") N.push({ text:"Run a CASE-style lesson on the reasoning pattern before the main investigation." });
  if (a.place==="yes") N.push({ text:"Build a place-based context developed with local Aboriginal community, through your school’s Aboriginal Education staff." });
  return N; }
function reasons(m,a){ const strong=[], weak=[];
  DIMS.forEach(d => { const s = dimScore(m,d,a); if (s===null) return;
    const ans = d.multi ? a[d.id].map(v => optLabel(d.id,v)).join(", ") : optLabel(d.id,a[d.id]);
    const label = d.short[0].toUpperCase()+d.short.slice(1);
    if (s>=2.5) strong.push(`${label}: ${ans}`); else if (s<=1) weak.push(`${label}: ${ans}`); });
  return { strong, weak }; }
function sensitivity(a,imp,topId){ const out=[];
  DIMS.filter(d => !d.multi && a[d.id]).forEach(d => d.options.forEach(([v]) => {
    if (v===a[d.id]) return;
    const r = rankAll({...a,[d.id]:v}, imp);
    if (r.length && r[0].m.id!==topId) out.push({ d, v, m:r[0].m, margin:r[0].f-(r[1]?r[1].f:0) }); }));
  out.sort((x,y) => (y.d.weight-x.d.weight) || (y.margin-x.margin));
  const seen=new Set(), res=[];
  for (const o of out){ if (seen.has(o.m.id)) continue; seen.add(o.m.id); res.push(o); if (res.length===2) break; }
  return res; }
/**
 * Guidance dial. Levels, scoring and rationale all come from the Levels of inquiry
 * guide's dialHeuristic, so what students see can be traced to the literature.
 */
const DIAL = G["levels-of-inquiry"];
const DIAL_PHASES = DIAL ? DIAL.phases.slice().sort((a,b) => a.order - b.order) : [];
const HEUR = DIAL && DIAL.reckoner.dialHeuristic;
const dialPhase = id => DIAL_PHASES.find(p => p.id === id);
function dialLevel(a){
  if (!HEUR) return null;
  const used = HEUR.factors.filter(f => a[f.dimension]);
  if (used.length < HEUR.factors.length) return null;
  const total = used.reduce((n,f) => n + (f.points[a[f.dimension]] ?? 0), 0);
  let phaseId = HEUR.thresholds.find(t => total <= t.maxPoints)?.phaseId
    || HEUR.thresholds[HEUR.thresholds.length-1].phaseId;
  const order = id => (dialPhase(id) || {}).order ?? 0;
  let capped = null;
  HEUR.caps.forEach(c => {
    if (a[c.dimension] === c.option && order(phaseId) > order(c.maxPhaseId)) { phaseId = c.maxPhaseId; capped = c; }
  });
  return { phaseId, total, capped, used };
}
function renderDial(a){
  const el = document.getElementById("dial");
  if (!DIAL){ el.innerHTML = `<p class="empty">The guidance dial needs the Levels of inquiry guide.</p>`; return; }
  const names = DIAL_PHASES.map(p => p.name);
  const link = `<p style="margin-top:.5rem"><button class="ghost" type="button" onclick="openGuide('levels-of-inquiry')">Open the ${esc(DIAL.name)} guide</button></p>`;
  const r = dialLevel(a);
  if (!r){
    el.innerHTML = `<div class="dial">${names.map(l=>`<div>${esc(l)}</div>`).join("")}</div>
      <p class="empty">Answer learner readiness, facilitation confidence and timescale to set the dial.</p>${link}`;
    return;
  }
  const lvl = DIAL_PHASES.findIndex(p => p.id === r.phaseId), L = DIAL_PHASES[lvl];
  const refs = new Map(DIAL.references.map(ref => [ref.id, ref]));
  const why = r.used.map(f => {
    const names = f.referenceIds.map(id => (refs.get(id)||{}).citation || "").map(c => c.split(" (")[0]).filter(Boolean).join("; ");
    return `<li><strong>${esc(dimById[f.dimension].short)}: ${esc(optLabel(f.dimension, a[f.dimension]))}</strong> (${f.points[a[f.dimension]]} of 2). ${md(f.rationale)}
      <p class="hint">${f.evidenceStrength === "framework" ? "Practical constraint, not an evidence claim." : `Evidence: ${esc(f.evidenceStrength)}${names ? ` — ${esc(names)}` : ""}`}</p></li>`;
  }).join("");
  el.innerHTML = `<div class="dial" role="img" aria-label="Recommended level: ${esc(L.name)}">${names.map((l,i)=>`<div class="${i===lvl?"on":""}">${esc(l)}</div>`).join("")}</div>
    <p style="font-size:.92rem"><strong>${esc(L.name)} inquiry.</strong> ${esc(L.job)}</p>
    ${r.capped ? `<div class="warnbox"><p class="sub">Capped</p><p>${esc(r.capped.rationale)}</p></div>` : ""}
    <details class="why" open><summary>Why this level, and what it rests on</summary>
      <p class="hint">Score ${r.total} of 6.</p><ul class="tight">${why}</ul>
      <p class="hint">${esc(HEUR.caveat)}</p></details>${link}`;
}
function renderDetail(){
  const { a, imp } = detailAnswers(), r = rankAll(a,imp), rk = document.getElementById("ranking");
  const unranked = DATA.models.filter(m => !m.p);
  const unrankedNote = unranked.length
    ? `<p class="hint" style="margin-top:.6rem">${unranked.map(m => esc(m.name)).join(", ")} ${unranked.length>1?"are":"is"} not ranked: ${unranked.length>1?"they are settings":"it is a setting"} you apply inside another model. See the guidance dial below.</p>`
    : "";
  rk.innerHTML = (r.length
    ? `<ol class="rank">${r.map((x,i)=>`<li class="${i<3?"top":""}"><span class="nm" title="${esc(x.m.name)}">${esc(x.m.name)}</span><span class="bar" aria-hidden="true"><i style="width:${Math.round(x.f*100)}%"></i></span><span class="pc">${Math.round(x.f*100)}%</span></li>`).join("")}</ol>`
    : `<p class="empty">Answer a question to see how the models rank.</p>`) + unrankedNote;
  renderDial(a);
  const tc = document.getElementById("topCards");
  if (!r.length){ tc.innerHTML = `<p class="empty">Your top three models will appear here with reasons, watch-outs and nesting suggestions.</p>`; return; }
  const sens = sensitivity(a,imp,r[0].m.id);
  tc.innerHTML = r.slice(0,3).map((x,i) => { const m = x.m, rs = reasons(m,a), W = watchOuts(m,a), N = nesting(m,a);
    return `<article class="card${i===0?" lead":""}"><div class="card-head">
      <div><p class="hint" style="margin:0 0 .2rem">${["Best fit","Second","Third"][i]}</p><h3>${esc(m.name)}</h3><p class="src">${esc(m.src)}</p></div>
      <div style="display:flex;gap:.8rem;align-items:flex-start">${badge(m.scale)}<div class="fitnum">${Math.round(x.f*100)}%<small>fit</small></div></div></div>
      ${rs.strong.length?`<p class="sub" style="margin-top:.8rem">Why this fits</p><ul class="tight">${rs.strong.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>`:""}
      ${rs.weak.length?`<p class="sub">Less suited to</p><ul class="tight">${rs.weak.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>`:""}
      ${W.length?`<div class="warnbox"><p class="sub">Watch-outs</p><ul class="tight">${W.map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>`:""}
      ${N.length?`<p class="sub">Nest inside it</p><ul class="tight">${N.map(n=>`<li>${esc(n.text)}${n.guide&&G[n.guide]?` <button class="ghost" style="padding:.1rem .5rem;font-size:.8rem" type="button" onclick="openGuide('${n.guide}')">Open guide</button>`:""}</li>`).join("")}</ul>`:""}
      ${i===0&&sens.length?`<p class="sub">If one answer changed</p><ul class="tight">${sens.map(o=>`<li>If ${esc(o.d.short)} were “${esc(optLabel(o.d.id,o.v))}”, ${esc(o.m.name)} would rank first.</li>`).join("")}</ul>`:""}
      ${modelBody(m)}</article>`; }).join("");
}
detailForm.addEventListener("change", e => {
  const t = e.target;
  if (t.type === "checkbox"){ const d = dimById[t.name.slice(2)];
    const checked = detailForm.querySelectorAll(`input[name="${t.name}"]:checked`);
    const note = document.getElementById("note-"+d.id);
    if (checked.length > d.multi){ t.checked = false; note.textContent = `Choose up to ${d.multi}.`; } else note.textContent = ""; }
  renderDetail();
});
document.getElementById("clearDetail").onclick = () => { detailForm.reset();
  DIMS.forEach(d => document.getElementById("note-"+d.id).textContent = ""); renderDetail(); };

/* ---------- companion guides ---------- */
let current = null, ctx = store.get("ctx") || { stage: "", focusArea: "" };
const SECTIONS = [
  ["purpose","Purpose"],["theory","Theory"],["model","The model"],["phases","Phases"],
  ["sequences","Worked sequences"],["misapplications","Misapplications"],["checklist","Checklist"],
  ["alignment","Syllabus alignment"],["reflection","Reflection"],["references","References"]
];
const FOCUS = { stage4:["Observing the Universe","Forces","Cells and classification","Solutions and mixtures","Living systems","Periodic table and atomic structure","Change","Data science 1"],
  stage5:["Energy","Disease","Materials","Environmental sustainability","Genetics and evolutionary change","Reactions","Waves and motion","Data science 2"] };
const matches = c => (!ctx.stage || c.stages.includes(ctx.stage)) && (!ctx.focusArea || (c.focusAreas||[]).includes(ctx.focusArea));
const ctxSet = () => ctx.stage || ctx.focusArea;
const matchBadge = c => ctxSet() && matches(c) ? ` <span class="badge b-match">Matches your context</span>` : "";
const tagline = c => [c.stages.map(s => s === "stage4" ? "Stage 4" : "Stage 5").join(", "), ...(c.focusAreas||[]), ...(c.disciplines||[])].join(" · ");

function renderGuideNav(){
  document.getElementById("guideNav").innerHTML = `
    <p class="sub">Guides</p><ul>${DATA.guides.map(g => `<li><a href="#/guide/${g.id}" class="${current===g.id?"on":""}">${esc(g.name)}</a></li>`).join("")}</ul>
    ${current ? `<p class="sub">Sections</p><ul id="secNav">${SECTIONS.map(([id,l]) => `<li><a href="#/guide/${current}/${id}" data-sec="${id}">${l}</a></li>`).join("")}</ul>
      <button class="ghost" type="button" onclick="window.print()">Print this guide (A4)</button>` : ""}`;
}
const markNav = sec => document.querySelectorAll("#secNav a").forEach(a => a.classList.toggle("on", a.dataset.sec === sec));

function renderGuide(id){
  current = id; const g = G[id];
  if (!g){ document.getElementById("guideBody").innerHTML = `<p class="empty">Select a guide.</p>`; renderGuideNav(); return; }
  const focusOpts = (ctx.stage ? FOCUS[ctx.stage] : [...FOCUS.stage4, ...FOCUS.stage5]);
  const phase = g.phases.slice().sort((a,b) => a.order - b.order);
  const body = `
  <div class="box" style="margin-bottom:1.25rem">
    <div class="card-head"><div><h2 style="border:none">${esc(g.name)} companion guide</h2>
      <p class="src">${esc(g.originators)} · ${esc(g.syllabus)} · v${esc(g.version)}, reviewed ${esc(g.lastReviewed)}</p></div>${badge(g.reckoner.scale)}</div>
    ${g.status === "published" ? "" : `<div class="warnbox"><p class="sub">Not yet reviewed</p><p>This guide is a ${esc(g.status)} draft, included in this review copy only. Do not use it with students until it is signed off.</p></div>`}
    <p style="margin-top:.6rem">${esc(g.introduction.lead)}</p>
    <div class="ctx" style="margin-top:.8rem">
      <span class="sub" style="margin:0">Your planning context</span>
      <label class="sr" for="ctxStage">Stage</label>
      <select id="ctxStage"><option value="">Any stage</option><option value="stage4"${ctx.stage==="stage4"?" selected":""}>Stage 4</option><option value="stage5"${ctx.stage==="stage5"?" selected":""}>Stage 5</option></select>
      <label class="sr" for="ctxFocus">Focus area</label>
      <select id="ctxFocus"><option value="">Any focus area</option>${focusOpts.map(f => `<option${ctx.focusArea===f?" selected":""}>${esc(f)}</option>`).join("")}</select>
      ${ctxSet() ? `<button class="ghost" type="button" id="ctxClear">Clear</button>` : ""}
    </div>
    <p class="hint" style="margin-top:.5rem">Examples and sequences that match your context are marked and shown first.</p>
  </div>

  <section id="s-purpose"><h2>Purpose</h2>${md(g.introduction.purposeStatement)}
    <p><strong>Who it is for.</strong> ${esc(g.introduction.audience)}</p>${md(g.introduction.howToUse)}</section>

  <section id="s-theory"><h2>Theory</h2>${md(g.theory.summary)}
    ${g.theory.foundations.map(f => `<div class="lookfor"><p class="q">${esc(f.tradition)}</p>${md(f.idea)}<p><strong>What this means for design.</strong> ${esc(f.designImplication)}</p></div>`).join("")}
    ${g.theory.critiques.length ? `<h3 style="margin-top:1rem">Critiques</h3>${g.theory.critiques.map(c => `<div class="warnbox"><p class="sub">The critique</p>${md(c.claim)}<p class="sub">Response</p>${md(c.response)}</div>`).join("")}` : ""}</section>

  <section id="s-model"><h2>The model</h2>${md(g.sequence.summary)}
    ${flowHTML(g)}
    <p><strong>Scale.</strong> ${esc(g.sequence.scaleNote)}</p>
    <div class="roles"><div><h4>Teacher’s role</h4><p>${esc(g.roles.teacher)}</p></div><div><h4>Learner’s role</h4><p>${esc(g.roles.learner)}</p></div></div></section>

  <section id="s-phases"><h2>${g.phaseGroups.length ? "Stages" : "Phases"}</h2>
    ${groupedPhases(g).map(([grp, ps]) => `${grp ? `<div class="groupintro"><h3>${esc(grp.name)}</h3><p>${esc(grp.summary)}</p></div>` : ""}
    ${ps.map(p => `<article class="card" id="s-${p.id}">
      <div class="card-head"><div><h3>${p.order}. ${esc(p.name)}</h3><p class="src">${esc(p.job)}</p></div>
        ${p.typicalShare ? `<span class="badge">${p.typicalShare.minPercent}–${p.typicalShare.maxPercent}% of the ${g.reckoner.scale==="micro"?"episode":"sequence"}</span>` : ""}</div>
      <p class="sub" style="margin-top:.7rem">Essential features</p><ul class="tight">${p.essentialFeatures.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
      <div class="roles"><div><h4>Teacher moves</h4><ul class="tight">${p.teacherMoves.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>
        <div><h4>Learner moves</h4><ul class="tight">${p.learnerMoves.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div></div>
      <p class="sub">What to look for</p>
      ${p.lookFors.map(l => `<div class="lookfor"><p class="q">${esc(l.question)}</p>
        <p><strong>Strong:</strong> ${esc(l.strongEvidence)}</p><p><strong>Weak:</strong> ${esc(l.weakEvidence)}</p></div>`).join("")}
      ${orderByCtx(p.examples).map(e => `<div class="ex ${e.kind}">
        <h4>${e.kind === "positive" ? "Done well" : "Done badly"}: ${esc(e.title)}${matchBadge(e.context)}</h4>
        <p class="tagline">${esc(tagline(e.context))}${e.outcomes.length ? " · " + e.outcomes.join(", ") : ""}</p>
        ${md(e.body)}<p><strong>Why.</strong> ${esc(e.diagnosis)}</p></div>`).join("")}
      ${p.formativeChecks.length ? `<p class="sub">Formative checks</p><ul class="tight">${p.formativeChecks.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>` : ""}
    </article>`).join("")}`).join("")}</section>

  <section id="s-sequences"><h2>Worked ${g.reckoner.scale === "micro" ? "episodes" : "sequences"}</h2>
    ${orderByCtx(g.workedSequences).map(s => sequenceHTML(g,s)).join("")}</section>

  <section id="s-misapplications"><h2>Common misapplications</h2>
    <table><thead><tr><th>Misapplication</th><th>What it looks like</th><th>Why it undermines learning</th><th>Fix</th></tr></thead><tbody>
    ${g.misapplications.map(m => `<tr><th scope="row">${esc(m.name)}</th><td>${esc(m.looksLike)}</td><td>${esc(m.whyItUndermines)}</td><td>${esc(m.fix)}</td></tr>`).join("")}
    </tbody></table></section>

  <section id="s-checklist"><h2>Designer’s checklist</h2>
    <p class="intro">Tick as you audit your draft. Progress is saved in this browser only.</p>
    <div class="toolbar"><span class="progress" id="chkProgress"></span><button class="ghost" type="button" id="chkReset">Reset</button></div>
    ${g.checklist.map(c => `<article class="card"><h3>${esc(c.title)}</h3>
      ${c.items.map(i => `<label class="checkitem"><input type="checkbox" data-chk="${g.id}:${i.id}"><span>${esc(i.text)}</span></label>`).join("")}</article>`).join("")}</section>

  <section id="s-alignment"><h2>Syllabus alignment</h2>
    <table><thead><tr><th>Working scientifically</th><th>Where it lives</th></tr></thead><tbody>
    ${g.syllabusAlignment.wsMapping.map(m => `<tr><th scope="row">WS-0${m.skill}</th><td>${m.phaseIds.length ? m.phaseIds.map(p => esc(phaseName(g,p))).join(", ") : "<em>Not built by this model.</em>"}${m.note ? ` ${esc(m.note)}` : ""}</td></tr>`).join("")}
    </tbody></table>
    <p><strong>Depth studies.</strong> ${esc(g.syllabusAlignment.depthStudies)}</p>
    ${g.syllabusAlignment.dataScience ? `<p><strong>Data science.</strong> ${esc(g.syllabusAlignment.dataScience)}</p>` : ""}
    <h3 style="margin-top:1rem">Inclusive design</h3>
    <ul class="tight"><li><strong>EAL/D learners.</strong> ${esc(g.syllabusAlignment.inclusion.eald)}</li>
      <li><strong>Students with disability.</strong> ${esc(g.syllabusAlignment.inclusion.disability)}</li>
      <li><strong>High potential and gifted students.</strong> ${esc(g.syllabusAlignment.inclusion.highPotential)}</li>
      <li><strong>Aboriginal and Torres Strait Islander perspectives.</strong> ${esc(g.syllabusAlignment.inclusion.aboriginalPerspectives)}</li></ul>
    ${g.nesting.length ? `<h3 style="margin-top:1rem">Nesting</h3><ul class="tight">${g.nesting.map(n => `<li>${n.role === "hosts" ? `Hosts <strong>${esc(M[n.modelId]?.name || n.modelId)}</strong>${n.phaseId ? ` in ${esc(phaseName(g,n.phaseId))}` : ""}` : `Nests inside <strong>${esc(M[n.modelId]?.name || n.modelId)}</strong>${n.phaseId ? ` at its ${esc(n.phaseId.replace(/-/g," "))} phase` : ""}`}: ${esc(n.how)}${G[n.modelId] ? ` <button class="ghost" style="padding:.1rem .5rem;font-size:.8rem" type="button" onclick="openGuide('${n.modelId}')">Open guide</button>` : ""}</li>`).join("")}</ul>` : ""}</section>

  <section id="s-reflection"><h2>Reflection prompts</h2>
    ${["personal","critical","application"].map(t => `<h3 style="margin-top:.8rem">${t[0].toUpperCase()+t.slice(1)}${t==="critical"?" analysis":t==="application"?" in the classroom":" reflection"}</h3>
      <ul class="tight">${g.reflectionPrompts.filter(p => p.type===t).map(p => `<li>${md(p.prompt)}</li>`).join("")}</ul>`).join("")}</section>

  <section id="s-references"><h2>References</h2><ul class="tight">
    ${g.references.map(r => `<li>${esc(r.citation)}${r.url?` <a href="${esc(r.url)}">Link</a>`:""}${r.doi?` https://doi.org/${esc(r.doi)}`:""}</li>`).join("")}</ul>
    <p class="hint">Outcome codes follow the <a href="https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/outcomes">NESA Science 7–10 (2023) outcomes</a>.</p></section>`;
  document.getElementById("guideBody").innerHTML = body;
  renderGuideNav();
  wireGuide(g);
}
/** Phases in order, grouped by stage group when the guide defines them. */
function groupedPhases(g){
  const ps = g.phases.slice().sort((a,b) => a.order - b.order);
  if (!g.phaseGroups.length) return [[null, ps]];
  return g.phaseGroups.map(gr => [gr, ps.filter(p => p.group === gr.id)]);
}

/** Phase flow diagram, generated from the guide's own phases. */
function flowHTML(g){
  const ps = g.phases.slice().sort((a,b) => a.order - b.order);
  const unit = g.reckoner.scale === "micro" ? "episode" : "sequence";
  const groupOf = id => g.phaseGroups.find(gr => gr.id === id);
  const nodes = ps.map(p => { const gr = p.group && groupOf(p.group);
    return `<div class="node">${gr ? `<em>${esc(gr.name)}</em>` : ""}<b>${esc(p.name)}</b>${p.typicalShare ? `<small>${p.typicalShare.minPercent}\u2013${p.typicalShare.maxPercent}% of the ${unit}</small>` : ""}</div>`; });
  const body = nodes.join(`<span class="arrow" aria-hidden="true">\u2192</span>`);
  const loop = g.sequence.shape === "cyclical"
    ? `<p class="loop">The ${unit} closes and the next one begins: ${esc(ps[ps.length-1].name)} \u2192 ${esc(ps[0].name)}.</p>` : "";
  return `<div class="flow" role="img" aria-label="Phases in order: ${ps.map(p => esc(p.name)).join(", ")}">${body}${loop}</div>`;
}
const phaseName = (g,id) => (g.phases.find(p => p.id===id)||{}).name || id;
const orderByCtx = arr => ctxSet() ? [...arr].sort((a,b) => (matches(b.context)?1:0)-(matches(a.context)?1:0)) : arr;

function sequenceHTML(g,s){
  const unit = s.steps[0].minutes !== undefined ? "Minutes" : "Lessons";
  const key = `attempt:${g.id}:${s.id}`, saved = store.get(key) || "";
  return `<article class="card" id="s-${s.id}">
    <div class="card-head"><div><h3>${esc(s.title)}${matchBadge(s.context)}</h3>
      <p class="src">${esc(tagline(s.context))} · ${s.contentOutcomes.join(", ")}</p></div></div>
    <p><strong>Big question.</strong> ${esc(s.bigQuestion)}</p>
    <p class="sub">Learning intentions</p><ul class="tight">${s.learningIntentions.map(l=>`<li>${esc(l)}</li>`).join("")}</ul>
    ${s.targetConceptions.length?`<p class="sub">Target alternative conceptions</p><ul class="tight">${s.targetConceptions.map(l=>`<li>${esc(l)}</li>`).join("")}</ul>`:""}
    <table><thead><tr><th>${unit}</th><th>Phase</th><th>What happens</th><th>Working scientifically</th><th>Formative check</th></tr></thead><tbody>
    ${s.steps.map(st => `<tr><th scope="row">${esc(st.minutes ?? st.lessons)}</th><td>${esc(phaseName(g,st.phaseId))}</td>
      <td>${md(st.activity)}${st.scaffoldSlots.map(sl => `<div class="slot"><p class="sub">Your turn</p><p>${esc(sl.prompt)}</p></div>`).join("")}</td>
      <td>${st.wsOutcomes.join(", ")}</td><td>${esc(st.formativeCheck)}</td></tr>`).join("")}
    </tbody></table>
    <div class="reveal"><p class="sub">Before you read on</p><p>${esc(s.predictPrompt)}</p>
      <label class="sr" for="att-${s.id}">Your answer</label>
      <textarea id="att-${s.id}" data-attempt="${key}" placeholder="Write your answer, then reveal the analysis.">${esc(saved)}</textarea>
      <p><button class="ghost" type="button" data-reveal="${s.id}">Reveal why this sequence works</button></p>
      <div id="rev-${s.id}" hidden>
        <p class="sub">Why this works</p><ul class="tight">${s.whyItWorks.map(w=>`<li>${esc(w)}</li>`).join("")}</ul>
        ${s.watchFor?`<div class="warnbox"><p class="sub">Watch for</p>${md(s.watchFor)}</div>`:""}
      </div></div>
    ${s.safetyNotes?`<div class="warnbox"><p class="sub">Safety and sensitivity</p>${md(s.safetyNotes)}</div>`:""}</article>`;
}

function wireGuide(g){
  const stage = document.getElementById("ctxStage"), focus = document.getElementById("ctxFocus"), clear = document.getElementById("ctxClear");
  stage.onchange = () => { ctx = { stage: stage.value, focusArea: "" }; store.set("ctx", ctx); renderGuide(g.id); };
  focus.onchange = () => { ctx = { ...ctx, focusArea: focus.value }; store.set("ctx", ctx); renderGuide(g.id); };
  if (clear) clear.onclick = () => { ctx = { stage:"", focusArea:"" }; store.set("ctx", ctx); renderGuide(g.id); };

  document.querySelectorAll("[data-reveal]").forEach(b => b.onclick = () => {
    const box = document.getElementById("rev-" + b.dataset.reveal);
    const ta = document.getElementById("att-" + b.dataset.reveal);
    if (!ta.value.trim()){ ta.focus(); b.textContent = "Write your answer first, then reveal"; return; }
    box.hidden = false; b.remove();
  });
  document.querySelectorAll("[data-attempt]").forEach(ta => ta.onchange = () => store.set(ta.dataset.attempt, ta.value));

  const boxes = [...document.querySelectorAll("[data-chk]")];
  const saved = store.get("check:" + g.id) || {};
  boxes.forEach(b => { b.checked = !!saved[b.dataset.chk]; b.onchange = () => {
    const s = store.get("check:" + g.id) || {}; s[b.dataset.chk] = b.checked; store.set("check:" + g.id, s); progress(); }; });
  const progress = () => { const done = boxes.filter(b => b.checked).length;
    document.getElementById("chkProgress").textContent = `${done} of ${boxes.length} checked`; };
  document.getElementById("chkReset").onclick = () => { store.set("check:" + g.id, {}); boxes.forEach(b => b.checked = false); progress(); };
  progress();
}

/* ---------- library ---------- */
let libFilter = "all";
function renderLibrary(){
  const f = document.getElementById("libFilter");
  const opts = [["all","All models"], ...Object.entries(SCALE).map(([k,v]) => [k,v.label])];
  f.innerHTML = opts.map(([k,l]) => `<button type="button" class="ghost" aria-pressed="${libFilter===k}" data-f="${k}">${esc(l)}</button>`).join("");
  f.querySelectorAll("button").forEach(b => b.onclick = () => { libFilter = b.dataset.f; renderLibrary(); });
  document.getElementById("library").innerHTML = DATA.models.filter(m => libFilter==="all" || m.scale===libFilter)
    .map(m => `<article class="card"><div class="card-head"><div><h3>${esc(m.name)}</h3><p class="src">${esc(m.src)}</p></div>
      <div style="display:flex;gap:.5rem;align-items:flex-start">${m.hasGuide?`<span class="badge b-match">Guide available</span>`:""}${badge(m.scale)}</div></div>${modelBody(m)}</article>`).join("");
}

/* ---------- review copy banner (npm run review) ---------- */
if (DATA.review){
  const b = document.createElement("div");
  b.className = "warnbox"; b.setAttribute("role", "note");
  b.innerHTML = `<p class="sub">Review copy, not for students</p><p>${esc(DATA.review.label)}. Built from the YAML for review; unreviewed guides are marked.</p>`;
  document.querySelector("header.top .wrap").prepend(b);
}

renderQuick(); renderDetail(); renderLibrary();
renderGuide(DATA.guides.length ? DATA.guides[0].id : null);
routeFromHash();
document.getElementById("bootMsg")?.remove();
