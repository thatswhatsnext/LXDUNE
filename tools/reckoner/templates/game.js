/* Teaching models game: path map, lessons, on-device progress.
 * Content arrives as window.GAME_DATA from scripts/lib/game.ts. Nothing is sent anywhere:
 * progress lives in this browser only (localStorage, guarded), and feedback is an optional form link. */
(function(){
"use strict";
const D = window.GAME_DATA;
const $ = s => document.querySelector(s);
const stage = $("#stage"), go = $("#go"), dock = $("#dock"), fb = $("#fb"), keys = $("#keys");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const JOURNEY = ["engage","explore","explain","elaborate","evaluate"];
const JNAME = {engage:"Engage",explore:"Explore",explain:"Explain",elaborate:"Elaborate",evaluate:"Evaluate"};
const PCOL = {engage:"var(--engage)",explore:"var(--explore)",explain:"var(--explain)",elaborate:"var(--elaborate)",evaluate:"var(--evaluate)"};
const LEVEL = {recognise:"Recognise",explain:"Explain",select:"Select",design:"Design"};
const UNSCORED = ["predict","concept","reflect"];
const pathOf = id => D.paths.find(p => p.id === id);
const phaseName = (path, id) => (pathOf(path).guide.phases.find(p => p.id === id) || {name:id}).name;
const pc = id => PCOL[id] || "var(--accent)";

/* ---------- progress, kept in this browser only ---------- */
const KEY = "lxdune-play-v1";
const store = {
  load(){ try { const v = JSON.parse(localStorage.getItem(KEY)); return v && v.lessons ? v : {lessons:{}}; } catch(e){ return {lessons:{}}; } },
  save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }
};
let P = store.load();
const rec = id => (P.lessons[id] = P.lessons[id] || {completed:false, plays:0, best:null, of:0, missed:[]});

/* ---------- screens ---------- */
let S = null;   // the lesson being played
let cur = null, sel = null, multi = new Set(), placed = [], pool = [], checked = false;

function chrome(mode, title){
  $("#hud").hidden = mode !== "play";
  dock.hidden = mode === "map";
  document.querySelector(".wrap").style.paddingBlockEnd = mode === "map" ? "48px" : "";
  $("#top").innerHTML = mode === "map" ? "" : `<button class="back" id="toMap" type="button">← All lessons</button><span class="grow"></span>${title ? `<span class="chip">${esc(title)}</span>` : ""}`;
  const b = $("#toMap"); if (b) b.addEventListener("click", showMap);
  $("#banner").innerHTML = D.review ? `<div class="banner">Review copy: includes lessons not yet published. Not for students.</div>` : "";
}

function unlocked(l){
  if (D.review || l.order === 1) return true;
  const prev = D.lessons.find(x => x.path === l.path && x.order === l.order - 1);
  return !prev || rec(prev.id).completed;
}
function levelReached(pathId){
  const done = D.lessons.filter(l => l.path === pathId && rec(l.id).completed).map(l => D.mastery.indexOf(l.level));
  return done.length ? Math.max(...done) : -1;
}

function showMap(){
  S = null; cur = null;
  chrome("map");
  stage.innerHTML = `<section class="mapHead card"><h1>Teaching models, in practice</h1><p>Short lessons on constructivist teaching models in NSW Science 7–10. Each lesson takes about 10 minutes and works on a phone.</p></section>
  ${D.paths.map(p => {
    const lv = levelReached(p.id);
    const ls = D.lessons.filter(l => l.path === p.id);
    const nextL = ls.find(l => !rec(l.id).completed && unlocked(l));
    return `<section class="path" style="--pc:${pc("explore")}">
      <div class="pathHead"><h2>${esc(p.title)}</h2><a href="../reckoner/#/guide/${esc(p.id)}">Open the ${esc(p.guide.name)} companion guide</a></div>
      <p>${esc(p.blurb)}</p>
      <div class="ladder" aria-label="Mastery reached">${D.mastery.map((m,i) => `<div class="${i <= lv ? "got" : ""}">${LEVEL[m]}</div>`).join("")}</div>
      <div class="lessons">${ls.map(l => {
        const r = rec(l.id), open = unlocked(l);
        const state = r.completed ? "done" : (l === nextL ? "next" : "");
        const chips = [`<span class="chip">${LEVEL[l.level]}</span>`];
        if (r.completed) chips.push(`<span class="chip good">Done · best ${r.best}/${r.of} first try</span>`);
        else if (!open) chips.push(`<span class="chip">Finish lesson ${l.order - 1} first</span>`);
        if (l.status !== "published") chips.push(`<span class="chip warn">${esc(l.status)}</span>`);
        if (r.missed.length && r.completed) chips.push(`<span class="chip">${r.missed.length} to review</span>`);
        return `<button class="lesson ${state}" data-l="${esc(l.id)}" ${open ? "" : "disabled"} type="button"><span class="num">${l.order}</span><span class="min"><h3>${esc(l.title)}</h3><span class="sum">${esc(l.summary)}</span><span class="meta">${chips.join("")}</span></span></button>`;
      }).join("")}
      ${p.upcoming ? `<div class="upcoming">${p.upcoming === 1 ? "One more lesson is" : `${p.upcoming} more lessons are`} being reviewed and will appear here soon.</div>` : ""}</div>
    </section>`;
  }).join("")}
  <div class="recall" style="margin-top:26px;--engage:var(--explain)"><b>About this pilot.</b> ${esc(D.notice)}</div>
  <p class="reset">Your progress is saved in this browser only. <button type="button" id="reset">Start again from scratch</button></p>`;
  stage.querySelectorAll("[data-l]").forEach(b => b.addEventListener("click", () => showIntro(b.dataset.l)));
  const rs = $("#reset");
  rs.addEventListener("click", () => {
    if (rs.dataset.armed){ P = {lessons:{}}; store.save(P); showMap(); }
    else { rs.dataset.armed = "1"; rs.textContent = "Tap again to clear your progress"; }
  });
  window.scrollTo({top:0});
}

function showIntro(id){
  const l = D.lessons.find(x => x.id === id), r = rec(id);
  chrome("intro", `${pathOf(l.path).title} · Lesson ${l.order}`);
  dock.className = "dock"; fb.innerHTML = "";
  const warm = warmupFor(l).length;
  stage.innerHTML = `<section class="card">
    <div class="chips"><span class="chip">${LEVEL[l.level]}</span><span class="chip">Lesson ${l.order}</span>${r.plays ? `<span class="chip">Attempt ${r.plays + 1}</span>` : ""}</div>
    <h2>${esc(l.title)}</h2>
    <p class="lead">${esc(l.summary)}</p>
    <p class="lead">Wrong answers cost nothing. Anything you miss comes back once at the end, and every answer explains itself.${r.plays ? " Replays shuffle the options and may use a different case." : ""}</p>
    ${warm ? `<p class="lead warm"><b>Warm-up:</b> ${warm === 1 ? "one item" : `${warm} items`} you missed in an earlier lesson come first.</p>` : ""}
  </section>`;
  go.textContent = r.plays ? "Play again" : "Start lesson"; go.disabled = false; keys.textContent = "About 10 minutes.";
  go.onclick = () => startLesson(l);
  window.scrollTo({top:0});
}

/* ---------- building a run ---------- */
function warmupFor(l){
  const earlier = D.lessons.filter(x => x.path === l.path && x.order < l.order).reverse();
  const out = [];
  for (const e of earlier) for (const mid of rec(e.id).missed){
    const it = e.items.find(i => i.id === mid);
    if (it && !UNSCORED.includes(it.type) && out.length < 2) out.push({...it, _from:e.id, _warm:true});
  }
  return out;
}
function variantFor(it, plays){
  const vs = it.variants || [];
  if (!vs.length || !plays) return it;
  const k = plays % (vs.length + 1);
  return k ? {...it, ...vs[k - 1]} : it;
}
function startLesson(l){
  const r = rec(l.id);
  const plays = r.plays;
  const items = l.items.map(it => ({...variantFor(it, plays), _from:l.id}));
  S = {
    lesson:l, plays, warm:warmupFor(l),
    main:items.filter(i => i.type !== "reflect"), reflect:items.filter(i => i.type === "reflect"),
    review:[], phase:"warm", pos:0, xp:0, streak:0, best:0, results:{}, warmRes:[],
    pred:null, conf:60, reflection:"", t0:Date.now(), done:false
  };
  if (!S.warm.length) S.phase = "main";
  r.plays = plays + 1; store.save(P);
  render();
}
const list = () => S.phase === "warm" ? S.warm : S.phase === "main" ? S.main : S.phase === "review" ? S.review : S.reflect;
function total(){ return S.warm.length + S.main.length + S.review.length + S.reflect.length; }
function doneCount(){
  const order = ["warm","main","review","reflect"], idx = order.indexOf(S.phase);
  if (S.done) return total();
  return order.slice(0, idx).reduce((n, k) => n + ({warm:S.warm, main:S.main, review:S.review, reflect:S.reflect})[k].length, 0) + S.pos;
}

/* ---------- HUD ---------- */
function hud(){
  $("#prog").style.width = (100 * doneCount() / Math.max(1, total())) + "%";
  $("#xp").textContent = S.xp; $("#streak").textContent = S.streak;
  const at = S.done ? "done" : cur && cur.at, idx = JOURNEY.indexOf(at);
  $("#rail").innerHTML = JOURNEY.map((k,i) => `<div style="--pc:${pc(k)}" class="${at === "done" || i < idx ? "done" : i === idx ? "now" : ""}">${JNAME[k]}</div>`).join("");
  $("#railnote").textContent = S.done ? "Lesson complete. Your own journey ran through all five phases."
    : S.phase === "warm" ? "Warm-up: items you missed in an earlier lesson, once more."
    : S.phase === "review" ? "Review round: items you missed come back once, with the options shuffled."
    : "This lesson is itself a 5E sequence. The bar shows where you are in it.";
}

/* ---------- rendering an item ---------- */
function options(it){
  if (it.type === "spot") return pathOf(S.lesson.path).guide.phases.map(p => ({t:p.name, ph:p.id, fb:it.fb[p.id]}));
  if (it.type === "lookfor"){
    const lf = pathOf(S.lesson.path).guide.lookFors;
    return [it.answer, ...it.distractors].map(id => ({t:lf[id].question, lf:id, ph:lf[id].phaseId}));
  }
  if (it.type === "diagnose"){
    const mi = pathOf(S.lesson.path).guide.misapplications;
    return [it.answer, ...it.distractors].map(id => ({t:mi[id].name, mi:id}));
  }
  return (it.options || []).map(o => ({t:o.text, fb:o.fb, ok:o.ok}));
}
function render(){
  checked = false; sel = null; multi = new Set(); placed = [];
  dock.className = "dock"; fb.innerHTML = "";
  if (S.done) return summary();
  const L = list();
  if (S.pos >= L.length) return advancePhase();
  cur = L[S.pos];
  chrome("play", `${pathOf(S.lesson.path).title} · Lesson ${S.lesson.order}`);
  hud();
  const reshuffle = S.plays > 0 || S.phase === "review" || cur._warm;
  let opts = options(cur).map((o,i) => ({...o, i}));
  if (cur.type !== "spot" && (reshuffle || cur.type === "lookfor" || cur.type === "diagnose")) opts = shuffle(opts);
  cur._view = opts;
  const chip = S.phase === "warm" ? `<span class="chip warn">Warm-up</span>` : S.phase === "review" ? `<span class="chip warn">Review</span>` : "";
  let h = `<section class="card" style="--pc:${pc(cur.at)}">
    <div class="chips"><span class="chip ph">${JNAME[cur.at]} phase</span><span class="chip">${esc(cur.processing)}</span>${chip}</div>
    <p class="kind">${esc(cur.kind)}</p>`;
  if (cur.title) h += `<h2>${esc(cur.title)}</h2>`;
  if (cur.vignette) h += `<div class="vignette"><span class="who">${esc(cur.vignette.who)}</span>${esc(cur.vignette.text)}</div>`;
  if (cur.plan) h += `<ol class="plan">${cur.plan.map(r => `<li style="--pc:${pc(r.phaseId)}"><b>${esc(phaseName(S.lesson.path, r.phaseId))}</b><span class="min">${esc(r.text)}</span></li>`).join("")}</ol>`;
  if (cur.type === "lookfor") h += `<p class="q">${cur.strong ? "This is strong evidence for one look-for in the guide. Which one?" : "This is weak evidence for one look-for in the guide: it shows what's missing. Which one?"}</p>`;
  if (cur.type === "diagnose" && !cur.q) h += `<p class="q">Which misapplication from the guide is this?</p>`;
  if (cur.q && cur.type !== "reflect") h += `<p class="q">${esc(cur.q)}</p>`;
  if (["predict","choice","spot","multi","lookfor","diagnose"].includes(cur.type)){
    const grid = cur.type === "spot";
    h += `<div class="opts ${grid ? "phases" : ""}" role="${cur.type === "multi" ? "group" : "radiogroup"}">${opts.map((o,n) =>
      `<button class="opt" type="button" data-i="${o.i}" ${o.ph && grid ? `style="--pc:${pc(o.ph)}"` : ""} role="${cur.type === "multi" ? "checkbox" : "radio"}" aria-checked="false">${grid ? "" : `<span class="k">${n + 1}</span>`}<span class="t">${cur.type === "lookfor" ? `<span class="lfq">${esc(phaseName(S.lesson.path, o.ph))} look-for</span>` : ""}${esc(o.t)}<span class="ofb" hidden></span></span></button>`).join("")}</div>`;
  }
  if (cur.type === "predict") h += `<div class="slider"><label for="conf">How confident are you? <output id="confout">${S.conf}%</output></label><input type="range" id="conf" min="0" max="100" step="10" value="${S.conf}"><small><span>Pure guess</span><span>Certain</span></small></div>`;
  if (cur.type === "order"){ pool = shuffle(cur.steps.map((o,i) => ({...o, i}))); h += `<div class="slots" id="slots"></div><div class="pool" id="pool"></div>`; }
  if (cur.type === "concept") h += `<p class="lead">${esc(cur.lead)}</p><div class="concept">${cur.rows.map(r => `<div class="row" style="--pc:${pc(r.phaseId)}"><h3>${esc(phaseName(S.lesson.path, r.phaseId))}</h3><p>${esc(r.does)}<em>${esc(r.move)}</em></p></div>`).join("")}</div>${cur.cite ? `<p class="cite">${esc(cur.cite)}</p>` : ""}`;
  if (cur.type === "reflect"){
    const pr = S.lesson.items.find(i => i.id === cur.recall);
    if (pr && S.pred != null) h += `<div class="recall">At the start you chose <b>${esc(pr.options[S.pred].text.toLowerCase())}</b> with <b>${S.conf}%</b> confidence.${S.pred === pr.answer ? " You were right. Many adults are not." : " Your first idea was the same kind of idea your students will bring."}</div>`;
    h += `<p class="q">${esc(cur.q)}</p><label for="refl" class="kind" style="display:block;margin-top:10px">Your answer</label><textarea id="refl" placeholder="Write a sentence or two">${esc(S.reflection)}</textarea>`;
  }
  if (cur.hint) h += `<details class="hint"><summary>Hint</summary><p>${esc(cur.hint)}</p></details>`;
  stage.innerHTML = h + `</section>`;
  window.scrollTo({top:0});

  go.onclick = onGo;
  if (cur.type === "concept"){ go.textContent = "Got it"; go.disabled = false; keys.textContent = "Enter to continue"; }
  else if (cur.type === "reflect"){ go.textContent = "Finish lesson"; go.disabled = false; keys.textContent = "Not marked. Writing it is the point.";
    $("#refl").addEventListener("input", e => S.reflection = e.target.value); }
  else { go.textContent = "Check"; go.disabled = true; keys.textContent = cur.type === "order" ? "Tap activities in order" : `Keys: 1–${opts.length} to choose, Enter to check`; }
  stage.querySelectorAll(".opt[data-i]").forEach(b => b.addEventListener("click", () => choose(+b.dataset.i)));
  if (cur.type === "predict"){ const r = $("#conf"); r.addEventListener("input", () => { S.conf = +r.value; $("#confout").textContent = S.conf + "%"; }); }
  if (cur.type === "order") drawOrder();
}

function choose(i){
  if (checked) return;
  if (cur.type === "multi") multi.has(i) ? multi.delete(i) : multi.add(i); else sel = i;
  stage.querySelectorAll(".opt[data-i]").forEach(b => {
    const on = cur.type === "multi" ? multi.has(+b.dataset.i) : +b.dataset.i === sel;
    b.classList.toggle("sel", on); b.setAttribute("aria-checked", on);
  });
  go.disabled = cur.type === "multi" ? multi.size === 0 : sel == null;
}

function drawOrder(){
  const slots = $("#slots"), pl = $("#pool"), N = cur.steps.length;
  slots.innerHTML = cur.steps.map((_,n) => {
    const o = placed[n];
    return o ? `<button class="slot filled" type="button" data-n="${n}" ${checked ? "disabled" : ""} style="--pc:${pc(o.phaseId)}"><span class="n">${n + 1}</span><span class="txt">${esc(o.text)}</span>${checked ? `<span class="tag">${esc(phaseName(S.lesson.path, o.phaseId))}</span>` : ""}</button>`
             : `<div class="slot"><span class="n">${n + 1}</span><span>${n === placed.length ? "Tap an activity below" : ""}</span></div>`;
  }).join("");
  const left = pool.filter(o => !placed.includes(o));
  pl.innerHTML = left.length ? `<span class="lbl">Activities</span>` + left.map(o => `<button class="opt" type="button" data-p="${o.i}"><span class="t">${esc(o.text)}</span></button>`).join("") : "";
  pl.querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => { placed.push(pool.find(o => o.i === +b.dataset.p)); drawOrder(); }));
  slots.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => { if (checked) return; placed.splice(+b.dataset.n, 1); drawOrder(); }));
  go.disabled = placed.length !== N;
  if (checked) slots.querySelectorAll(".slot").forEach((el,n) => el.classList.add(placed[n].phaseId === cur.steps[n].phaseId ? "right" : "wrong"));
}

/* ---------- checking ---------- */
function correctIndex(it){
  if (it.type === "spot") return pathOf(S.lesson.path).guide.phases.findIndex(p => p.id === it.answer);
  if (it.type === "lookfor" || it.type === "diagnose") return 0;
  return it.answer;
}
function onGo(){
  if (cur.type === "concept"){ S.xp += 5; return next(); }
  if (cur.type === "reflect"){ S.xp += 10; S.done = true; return render(); }
  if (checked) return next();
  check();
}
function check(){
  checked = true;
  const opts = options(cur);
  if (cur.type === "predict"){
    S.pred = sel; S.xp += 5; hud();
    mark(i => i === cur.answer, i => i === sel && i !== cur.answer, () => false);
    dock.className = "dock " + (sel === cur.answer ? "good" : "");
    return feedback(sel === cur.answer ? "Good prediction" : "Predictions aren't marked", `<p>${esc(cur.reveal)}</p>`);
  }
  let ok = true, body = "";
  if (["choice","spot","lookfor","diagnose"].includes(cur.type)){
    const ans = correctIndex(cur); ok = sel === ans;
    if (cur.type === "spot") mark(i => i === ans, i => i === sel && !ok, i => i === sel && !ok);
    else mark(i => i === ans, i => i === sel && !ok, i => i === sel || i === ans);
    if (cur.type === "spot") body = `<p>${esc(cur.fb[cur.answer])}</p>`;
    if (cur.type === "diagnose"){
      const m = pathOf(S.lesson.path).guide.misapplications[cur.answer];
      body = `<p><b>${esc(m.name)}.</b> ${esc(m.why)}</p><p><b>The fix:</b> ${esc(m.fix)}</p>`;
      if (!ok){ const w = pathOf(S.lesson.path).guide.misapplications[opts[sel].mi]; body += `<p>${esc(w.name)} looks different. In the guide's words: ${esc(w.looksLike)}</p>`; }
    }
    if (cur.type === "lookfor"){
      const lf = pathOf(S.lesson.path).guide.lookFors[cur.answer];
      body = `<p><b>${cur.strong ? "Strong evidence" : "Weak evidence"} for this look-for:</b> ${esc(cur.strong ? lf.strong : lf.weak)}</p>`;
      if (!ok){ const wrong = pathOf(S.lesson.path).guide.lookFors[opts[sel].lf]; body += `<p>The one you chose is about something else. Strong evidence for it would be: ${esc(wrong.strong.charAt(0).toLowerCase() + wrong.strong.slice(1))}</p>`; }
    }
  }
  if (cur.type === "multi"){
    ok = opts.every((o,i) => !!o.ok === multi.has(i));
    mark(i => opts[i].ok && multi.has(i), i => multi.has(i) && !opts[i].ok, () => true);
    stage.querySelectorAll(".opt[data-i]").forEach(b => { const i = +b.dataset.i; if (opts[i].ok && !multi.has(i)) b.classList.add("right"); });
  }
  if (cur.type === "order"){
    ok = placed.every((o,n) => o.phaseId === cur.steps[n].phaseId); drawOrder();
    if (!ok) body = `<p>The correct order follows the guide's phases. Check the tag on each placed activity.</p>`;
  }
  score(ok);
  dock.className = "dock " + (ok ? "good" : "bad");
  let head = ok ? pick(["Nicely judged.","That's it.","Spot on.","Exactly right."])
    : (S.phase === "main" ? "Not this time. It'll come back in review." : "Still not quite.");
  if (ok && S.streak && S.streak % 3 === 0) head += " +5 streak bonus";
  feedback(head, body);
}
function score(ok){
  const key = cur.id, L = rec(cur._from);
  if (S.phase === "warm"){
    S.warmRes.push(ok);
    if (ok) L.missed = L.missed.filter(m => m !== key);
  } else if (S.phase === "main"){
    S.results[key] = {ok, tests:cur.tests};
    if (!ok) S.review.push({...cur});
  } else if (S.phase === "review" && ok) S.results[key].recovered = true;
  if (ok){ S.streak++; S.best = Math.max(S.best, S.streak); S.xp += S.phase === "main" ? 10 : 5; if (S.streak % 3 === 0) S.xp += 5; }
  else S.streak = 0;
  store.save(P); hud();
}
function mark(isRight, isWrong, showFb){
  const opts = options(cur);
  stage.querySelectorAll(".opt[data-i]").forEach(b => {
    const i = +b.dataset.i; b.disabled = true; b.classList.remove("sel");
    if (isRight(i)) b.classList.add("right"); else if (isWrong(i)) b.classList.add("wrong");
    const f = b.querySelector(".ofb");
    if (f && opts[i].fb && showFb(i)){ f.textContent = opts[i].fb; f.hidden = false; }
  });
}
function feedback(head, body){
  fb.innerHTML = `<h3>${esc(head)}</h3>${body}${cur.why ? `<details class="why"><summary>Why this matters in the classroom</summary><p>${esc(cur.why)}</p></details>` : ""}`;
  go.textContent = "Continue"; go.disabled = false; keys.textContent = "Enter to continue";
  go.focus({preventScroll:true});
}
function next(){ S.pos++; render(); }
function advancePhase(){
  S.pos = 0;
  if (S.phase === "warm") S.phase = "main";
  else if (S.phase === "main") S.phase = S.review.length ? "review" : "reflect";
  else if (S.phase === "review") S.phase = "reflect";
  else { S.done = true; }
  if (S.phase === "reflect" && !S.reflect.length) S.done = true;
  render();
}

/* ---------- results ---------- */
const SKILL = {sequence:"Sequencing", diagnosis:"Diagnosing plans", misapplication:"Diagnosing plans", lookfor:"Using look-fors", engage:"Reading student ideas"};
function summary(){
  cur = null;
  const l = S.lesson, r = rec(l.id), res = Object.entries(S.results), right = res.filter(([,v]) => v.ok).length;
  r.completed = true; r.of = res.length; r.best = Math.max(r.best || 0, right);
  r.missed = res.filter(([,v]) => !v.ok).map(([k]) => k);
  store.save(P);
  chrome("play", `${pathOf(l.path).title} · Lesson ${l.order}`);
  hud();
  const groups = {};
  res.forEach(([,v]) => { const k = v.tests || "other"; (groups[k] = groups[k] || {v:0,n:0}).n++; if (v.ok) groups[k].v++; });
  const label = k => SKILL[k] || (pathOf(l.path).guide.phases.some(p => p.id === k) ? `${phaseName(l.path, k)} moves` : k === "other" ? "Other" : k);
  const pr = l.items.find(i => i.type === "predict");
  let calib = "";
  if (pr && S.pred != null){
    const right1 = S.pred === pr.answer;
    calib = right1 ? (S.conf >= 70 ? "You predicted correctly and confidently." : "You predicted correctly but held back on confidence. Trust that reasoning.")
      : (S.conf >= 70 ? `You were ${S.conf}% sure of a wrong answer. Students are often just as sure, which is why Engage draws ideas out before correcting them.` : "Your first idea was tentative. That's the best moment to meet evidence.");
  }
  const nextL = D.lessons.find(x => x.path === l.path && x.order === l.order + 1);
  const lv = levelReached(l.path);
  const guideHref = `../reckoner/#/guide/${l.path}${l.guideSection ? "/" + l.guideSection : ""}`;
  const warm = S.warmRes.length ? `<div class="stat"><b>${S.warmRes.filter(Boolean).length}/${S.warmRes.length}</b><span>warm-up</span></div>` : "";
  stage.innerHTML = `<section class="card sum-head">
    <p class="kind">Lesson complete</p>
    <h2>${esc(l.title)}</h2>
    <div class="stats">
      <div class="stat"><b>${S.xp}</b><span>XP earned</span></div>
      <div class="stat"><b>${right}/${res.length}</b><span>right first time</span></div>
      ${warm || `<div class="stat"><b>${S.best}</b><span>best streak</span></div>`}
    </div>
    <div class="skills">${Object.entries(groups).map(([k,g]) => `<div class="skill" style="--pc:${pc(k)}"><span>${esc(label(k))}</span><span class="track"><i style="width:${100 * g.v / g.n}%"></i></span><span class="v">${g.v}/${g.n}</span></div>`).join("")}</div>
    ${calib ? `<p class="note"><b>Calibration.</b> ${esc(calib)}</p>` : ""}
    <div class="crowns"><h3>Mastery on the ${esc(pathOf(l.path).title)}</h3>
      <div class="lv">${D.mastery.map((m,i) => `<div class="${i <= lv ? "got" : i === lv + 1 ? "next" : ""}">${LEVEL[m]}</div>`).join("")}</div>
      <p class="note">Levels follow Marzano &amp; Kendall: retrieval, comprehension, analysis, then knowledge utilisation.</p>
    </div>
    ${S.reflection.trim() ? `<div class="recall" style="--engage:var(--evaluate)"><b>Your answer:</b> ${esc(S.reflection)}</div>` : ""}
    ${S.reflect[0] ? `<p class="note">${esc(S.reflect[0].model)}</p>` : ""}
    <div class="row2"><a class="ghost" href="${esc(guideHref)}">Read more in the ${esc(pathOf(l.path).guide.name)} guide</a></div>
    ${feedbackBlock()}
  </section>`;
  go.textContent = nextL && unlocked(nextL) ? `Next: lesson ${nextL.order}` : "Back to all lessons"; go.disabled = false;
  keys.textContent = r.missed.length ? `${r.missed.length === 1 ? "One item" : `${r.missed.length} items`} you missed will open the next lesson as a warm-up.` : "Progress saved in this browser.";
  go.onclick = () => nextL && unlocked(nextL) ? showIntro(nextL.id) : showMap();
  fb.innerHTML = ""; dock.className = "dock";
  window.scrollTo({top:0});
}
function feedbackBlock(){
  const f = D.feedback || {};
  if (!f.url) return "";
  const intro = `<div class="crowns"><h3>Help shape the next lesson</h3><p class="note">Tell us what worked and what didn't. The form is anonymous and includes your game summary (scores and timing only, never your written answer).</p>`;
  if (f.url === "placeholder") return intro + `<button class="go fbk" disabled type="button">Feedback form opening soon</button></div>`;
  const res = Object.entries(S.results), missed = res.filter(([,v]) => !v.ok).map(([k]) => k);
  const pr = S.lesson.items.find(i => i.type === "predict");
  const mins = Math.max(1, Math.round((Date.now() - S.t0) / 60000));
  const txt = `${S.lesson.id} v${S.lesson.version} | attempt ${S.plays + 1} | first-try ${res.filter(([,v]) => v.ok).length}/${res.length} | missed: ${missed.join(", ") || "none"}` +
    (S.warmRes.length ? ` | warm-up ${S.warmRes.filter(Boolean).length}/${S.warmRes.length}` : "") +
    (pr ? ` | prediction: ${S.pred != null ? pr.options[S.pred].text : "none"} @ ${S.conf}%` : "") +
    ` | reflection written: ${S.reflection.trim() ? "yes" : "no"} | minutes: ${mins}`;
  let u = f.url;
  if (f.summaryEntry) u += (u.includes("?") ? "&" : "?") + "usp=pp_url&" + encodeURIComponent(f.summaryEntry) + "=" + encodeURIComponent(txt);
  return intro + `<a class="go fbk" href="${esc(u)}" target="_blank" rel="noopener">Give feedback (2 minutes)</a></div>`;
}

/* ---------- keyboard ---------- */
document.addEventListener("keydown", e => {
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
  if (e.key === "Enter" && !dock.hidden && !go.disabled && document.activeElement !== go){ e.preventDefault(); go.click(); }
  const n = parseInt(e.key, 10);
  if (cur && !checked && cur._view && n >= 1 && n <= cur._view.length) choose(cur._view[n - 1].i);
});

showMap();
})();
