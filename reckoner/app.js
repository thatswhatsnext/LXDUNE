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
/**
 * Every user-facing name for the parts of the Field Guide, so a rename is a one-line change. Text in
 * app.html carries the same names as fallbacks, marked data-name="<key>", and is filled from here on load.
 * gamePaths: models with a Fieldwork path in the game (content/game/game.yaml), for "Practise it in Fieldwork".
 */
const NAMES = {
  product: "The Field Guide", productTail: "to Constructivist Teaching Models",
  reckoner: "The Reckoner", familyTree: "Family Tree", game: "Fieldwork", guides: "Companion guides",
  gamePaths: ["5e", "poe"],
};
NAMES.productFull = `${NAMES.product} ${NAMES.productTail}`;
NAMES.familyTreeTitle = `The ${NAMES.familyTree}`;
NAMES.reckonerMid = NAMES.reckoner.replace(/^The /, "the ");   // mid-sentence: "Used the Reckoner for…"
NAMES.plateCaption = `Plate 1 · The Willow Problem, from ${NAMES.game}`;
document.title = NAMES.productFull;
document.querySelectorAll("[data-name]").forEach(el => { el.textContent = NAMES[el.dataset.name]; });
document.querySelectorAll("[data-name-label]").forEach(el => el.setAttribute("aria-label", `${NAMES[el.dataset.nameLabel]}, home`));
const icon = (id, cls = "i") => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const badge = s => `<span class="badge ${SCALE[s].cls}" title="${esc(SCALE[s].tip)}">${icon("i-scale-" + s)}${SCALE[s].label}</span>`;
/* Anonymous Moodle Feedback activity for the reckoner survey. Empty string shows "coming soon" in place of every link. */
const FEEDBACK_URL = "";
/* One feedback paragraph: the link between `before` and `after`, or a "coming soon" note while FEEDBACK_URL is empty. */
const feedbackLine = (before, after = ".") => `<p class="hint feedback">${before} ${FEEDBACK_URL
  ? `<a href="${esc(FEEDBACK_URL)}" target="_blank" rel="noopener">Tell us how it went<span class="sr"> (opens in a new tab)</span></a>${after}`
  : "A short feedback survey is coming soon."}</p>`;
document.getElementById("buildStamp").insertAdjacentHTML("beforebegin",
  feedbackLine(`Used ${NAMES.reckonerMid} for your planning?`, " (six questions, about three minutes, anonymous)."));
document.getElementById("buildStamp").textContent =
  `Guides: ${DATA.guides.map(g => `${g.name} v${g.version}, reviewed ${g.lastReviewed}`).join("; ")}.`;

/* ---------- trust chips and route lines ---------- */
const PROV_TIP = "No companion guide yet; fit scores not yet checked against one.";
/** "Provisional" on a catalogue model (no companion guide); nothing on a guided one. */
const provChip = m => m.hasGuide ? "" : `<span class="badge b-prov" title="${PROV_TIP}">Provisional<span class="sr">: ${PROV_TIP}</span></span>`;
/** Evidence strength and review status for a guided model, from its guide; Provisional for a catalogue model. */
function trustChips(m){
  const g = G[m.id];
  if (!g) return provChip(m);
  const strength = g.reckoner.evidenceStrength, def = DATA.methodology?.evidenceStrength?.[strength];
  const pv = g.provenance;
  const made = pv.source === "authored" ? `Written by ${pv.authors.join(", ")}`
    : pv.source === "ai-drafted-reviewed" ? `AI-drafted, reviewed by ${pv.reviewedBy.join(", ")}${pv.reviewedOn ? `, ${pv.reviewedOn}` : ""}`
    : "AI-generated, not yet reviewed";
  return `<span class="badge b-evidence"${def ? ` title="${esc(def)}"` : ""}>Evidence: ${esc(strength)}</span><span class="badge b-review">${esc(made)}</span>`;
}
/** A link to one route's section of the How it works page, once the methodology is published. */
const howLink = route => DATA.methodology ? ` <a class="how-link" href="#/how-it-works/${route}">How it works</a>` : "";
/** How the Quick reckoner and three taps chose: the purpose table, or the one-lesson rule. */
const quickRoute = (purpose, side) => `<p class="hint route">${side
  ? `Chosen from the purpose table: ${esc(optLabel("purpose", purpose))}, ${side === "left" ? "structured" : "open"} column (${side === "left" ? "novice learners or a short timeframe" : "experienced learners and a longer timeframe"}).`
  : "Chosen because you have one lesson: a single-lesson strategy."}${howLink("quick")}</p>`;

/* tiny markdown: paragraphs, bold, italics, lists. As in Markdown, consecutive lines join into one
   paragraph (YAML block text wraps mid-sentence); a blank line or a list item starts a new block, and a
   line straight after a list item continues that item. */
function md(t){
  const blocks = [];
  for (const raw of String(t).trim().split("\n")){
    const l = raw.trim(), last = blocks[blocks.length - 1];
    if (!l) blocks.push(null);
    else if (/^[-*] /.test(l)) blocks.push({ li: true, text: l.slice(2) });
    else if (last) last.text += " " + l;
    else blocks.push({ li: false, text: l });
  }
  let html = "", list = false;
  for (const b of blocks){
    if (b && b.li && !list){ html += "<ul class='tight'>"; list = true; }
    if ((!b || !b.li) && list){ html += "</ul>"; list = false; }
    if (b) html += b.li ? `<li>${inline(b.text)}</li>` : `<p>${inline(b.text)}</p>`;
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
/** The home path shows only on "Start with your unit" with no hash route, so deep links open on their content. */
function syncHome(){
  const unitOn = document.getElementById("t-unit").getAttribute("aria-selected") === "true";
  document.getElementById("home").hidden = !(unitOn && document.getElementById("p-how").hidden && !/^#\/(guide|how-it-works)/.test(location.hash));
}
function selectTab(t, push = true){
  const how = document.getElementById("p-how"); how.hidden = true; how.classList.remove("active");
  tabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
    const p = document.getElementById(x.getAttribute("aria-controls")); p.hidden = !on; p.classList.toggle("active", on); });
  if (push && (t.id !== "t-guides" || /^#\/how-it-works/.test(location.hash))) location.hash = "";
  if (t.id === "t-compare") renderCompare();
  syncHome();
  return t;
}
/** A home step or masthead link: select its tab, bring the panel into view and focus the tab, as the tab code does. */
function goTab(id){
  const t = selectTab(document.getElementById(id));
  document.getElementById(t.getAttribute("aria-controls")).scrollIntoView?.({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  t.focus({ preventScroll: true });
}
document.querySelectorAll("#home [data-go], .mast-nav [data-go]").forEach(b => b.addEventListener("click", () => goTab(b.dataset.go)));
tabs.forEach((t,i) => { t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", e => { if(e.key==="ArrowRight") selectTab(tabs[(i+1)%tabs.length]).focus?.();
    if(e.key==="ArrowLeft") selectTab(tabs[(i-1+tabs.length)%tabs.length]); }); });

let ownHash = null; // a hash this page just set, so the hashchange it fires does not render the guide twice
function openGuide(id, section){
  if (!G[id]) return;
  selectTab(document.getElementById("t-guides"), false);
  renderGuide(id);
  const hash = `#/guide/${id}${section ? "/" + section : ""}`;
  if (location.hash !== hash){ ownHash = hash; location.hash = hash; }
  const target = section && document.getElementById("s-" + section);
  if (target) expandTo(target);
  requestAnimationFrame(() => {
    const el = target;
    (el || document.getElementById("p-guides")).scrollIntoView?.({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    if (el) markNav(section);
  });
}
addEventListener("hashchange", routeFromHash);
function routeFromHash(e){
  if (ownHash && location.hash === ownHash){ ownHash = null; return; }
  ownHash = null;
  const how = location.hash.match(/^#\/how-it-works(?:\/([a-z-]+))?$/);
  if (how && DATA.methodology){
    const from = e && e.oldURL ? new URL(e.oldURL).hash : "";
    if (!/^#\/how-it-works/.test(from)) howFrom = from;
    return showHow(how[1]);
  }
  leaveHow();
  const m = location.hash.match(/^#\/guide\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?/);
  if (m) openGuide(m[1], m[2]);
}

/* ---------- How it works (F1): the methodology, reached from the footer ----------
 * Prose comes from content/methodology.yaml; counts and weights are computed here, so the
 * page cannot disagree with the data. Only built when the methodology is published, or in a
 * review copy. Tabs keep their selected state; Back returns to where the reader was. */
let howFrom = "";
const ROUTE_ORDER = ["unit", "three-taps", "quick", "detailed", "rules", "dial"];
/**
 * A flip card for the How it works page. The front carries the number, title and anything that should be
 * seen while scanning; the back carries the detail, headed by the title again so the reader keeps their
 * place. The back starts inert; flipCard() below turns cards and keeps inert and focus in step.
 */
function flipCard({ id, cls = "", num, title, front = "", back, more, less }){
  return `<article class="flip ${cls}" id="how-${id}" data-flipped="false"><div class="flip-inner">
    <div class="face front"><span class="flip-num" aria-hidden="true">${num}</span>
      <div class="flip-main"><h4 id="how-${id}-t">${esc(title)}</h4>${front}</div>
      <button type="button" class="flip-btn" aria-expanded="false" aria-controls="how-${id}-b" aria-describedby="how-${id}-t">${more}</button></div>
    <div class="face back" id="how-${id}-b" role="group" aria-labelledby="how-${id}-t" inert>
      <p class="flip-back-title" aria-hidden="true">${esc(title)}</p>${back}
      <button type="button" class="flip-btn">${less}</button></div></div></article>`;
}
/** A lead-in line, a Show all switch for this section's cards, and the cards in a grid. */
const flipSection = (lead, cards) => `<div class="flip-bar"><p class="hint">${lead}</p>
  <button type="button" class="ghost" data-flipall aria-pressed="false">Show all</button></div>
  <div class="how-grid">${cards.join("")}</div>`;
/** Turn a card; the hidden face is inert, so keyboard and screen-reader users only meet the side on show. */
function turnCard(card, on, focus){
  card.dataset.flipped = on;
  card.querySelector(".front").toggleAttribute("inert", on); card.querySelector(".back").toggleAttribute("inert", !on);
  card.querySelector(".front .flip-btn").setAttribute("aria-expanded", on);
  if (focus) card.querySelector(on ? ".back .flip-btn" : ".front .flip-btn").focus({ preventScroll: true });
}
function renderHow(){
  const meth = DATA.methodology, el = document.getElementById("howBody");
  const refs = new Map(meth.references.map(r => [r.id, r]));
  /** APA in-text form from the reference: Kirschner et al. (2006), Smith & Jones (2010), Smith (2010). */
  const cite = id => { const r = refs.get(id); if (!r) return "";
    const names = [...r.citation.split(" (")[0].matchAll(/([A-Z][A-Za-z'’-]+), (?:[A-Z]\.[ -]?)+/g)].map(m => m[1]);
    const who = names.length > 2 ? `${names[0]} et al.` : names.join(" & ") || r.citation.split(" (")[0];
    return `<a href="#how-ref-${id}" data-howref="${id}">${esc(who)} (${esc((r.citation.match(/\((\d{4})/) || [])[1] || "n.d.")})</a>`; };
  const guided = DATA.models.filter(m => m.hasGuide).length, prov = DATA.models.length - guided;
  const dates = DATA.guides.map(g => g.lastReviewed).sort();
  const cap = t => t[0].toUpperCase() + t.slice(1);
  const weights = `<details class="why how-weights"><summary>See how much each question counts in the Detailed reckoner</summary>
    <table class="weights"><thead><tr><th scope="col">Question</th><th scope="col">Counts</th></tr></thead><tbody>
    ${DIMS.map(d => `<tr><th scope="row">${esc(cap(d.short))}</th><td>×${+d.weight}</td></tr>`).join("")}</tbody></table>
    <p class="hint">Read from ${NAMES.reckonerMid}'s own settings, so this table always matches the ranking. Your importance setting multiplies these: low ×0.5, high ×2.</p></details>`;
  const routes = ROUTE_ORDER.map(id => meth.routes.find(r => r.id === id)).filter(Boolean);
  // Sections in reading order; the contents bar is built from the same list, so it cannot miss one.
  const SECS = [
    ["glance", "At a glance", `<p class="hint">The diagram shows where every recommendation comes from.</p><template-slot></template-slot>`],
    ["routes", "How each route decides", flipSection(`${plural(routes.length, "way")} into ${NAMES.reckonerMid}. Turn a card to see how it decides.`,
      routes.map((r, i) => flipCard({ id: r.id, cls: "how-route", num: i + 1, title: r.title, front: `<p class="route-sum">${esc(r.summary)}</p>`,
        back: md(r.body), more: "How it decides", less: "Back to the summary" }))) + weights],
    ["principles", "Principles", flipSection(`${plural(meth.principles.length, "idea")} ${NAMES.reckonerMid} is built on. Turn a card to read it.`,
      meth.principles.map((p, i) => flipCard({ id: `p-${p.id}`, num: i + 1, title: p.title,
        back: md(p.body) + (p.referenceIds.length ? `<p class="hint">See ${p.referenceIds.map(cite).join("; ")}.</p>` : ""), more: "Read more", less: "Back to the title" })))],
    ["review", "How content is made", `<p class="how-now">Right now: ${guided} of ${DATA.models.length} models have a companion guide; ${prov} ${prov === 1 ? "is" : "are"} provisional.${dates.length ? ` Guides were last reviewed ${dates[0] === dates[dates.length - 1] ? `on ${dates[0]}` : `between ${dates[0]} and ${dates[dates.length - 1]}`}.` : ""}</p>${md(meth.review)}`],
    ["evidence", "Evidence strength", `<p class="hint">The label on each companion guide says how strong the research behind the model is.</p>
      <div class="how-ev">${Object.entries(meth.evidenceStrength).map(([k, v]) => `<span class="badge b-evidence">Evidence: ${esc(k)}</span><p>${esc(v)}</p>`).join("")}</div>`],
    ["limits", "What it does not do", `<ul class="tight">${meth.limits.map(l => `<li>${esc(l)}</li>`).join("")}</ul>`],
    ["glossary", "Glossary", `<dl class="how-gloss">${meth.glossary.map(g => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.definition)}</dd></div>`).join("")}</dl>`],
    ...(meth.references.length ? [["refs", "References", `<ul class="refs">${meth.references.map(r => `<li id="how-ref-${r.id}">${esc(r.citation)}${r.doi ? ` <a href="https://doi.org/${esc(r.doi)}">https://doi.org/${esc(r.doi)}</a>` : r.url ? ` <a href="${esc(r.url)}">${esc(r.url)}</a>` : ""}</li>`).join("")}</ul>`]] : []),
  ];
  el.innerHTML = `<div class="how-head"><h2 id="howTitle" tabindex="-1">How ${NAMES.reckonerMid} works</h2></div>
    ${meth.status === "published" ? "" : `<div class="warnbox"><p class="sub">Not yet reviewed</p><p>This page is ${meth.status === "in-review" ? "in review" : "a draft"}, included in this review copy only. Students do not see it until it is signed off.</p></div>`}
    <p class="lede">${esc(meth.intro.lead)}</p>${md(meth.intro.purpose)}
    <nav class="how-toc" aria-label="On this page"><button type="button" class="how-back" id="howBack">← Back</button>
      <span class="sub">On this page</span><div class="how-pills">${SECS.map(([id, title]) => `<button type="button" class="pill-link" data-howjump="how-sec-${id}">${title}</button>`).join("")}</div></nav>
    ${SECS.map(([id, title, inner]) => `<section class="how-sec" id="how-sec-${id}"><h3>${title}</h3>${inner}</section>`).join("")}
    <p class="hint">Methodology v${esc(meth.version)}, reviewed ${esc(meth.lastReviewed)}.</p>`;
  el.querySelector("template-slot").replaceWith(document.getElementById("howDiagram").content.cloneNode(true));
  document.getElementById("howBack").onclick = () => { location.hash = howFrom; };
  const jump = target => target?.scrollIntoView?.({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  // A tapped pill is marked at once; scrolling then keeps the mark in step with what is being read.
  el.querySelectorAll("[data-howjump]").forEach(b => b.onclick = () => { mark(b.dataset.howjump); jump(document.getElementById(b.dataset.howjump)); });
  el.querySelectorAll("[data-howref]").forEach(a => a.onclick = e => { e.preventDefault(); jump(document.getElementById("how-ref-" + a.dataset.howref)); });

  // Flip cards: the whole card turns on a click, except on a link, button or disclosure inside it
  el.querySelectorAll(".flip").forEach(card => {
    card.querySelectorAll(".flip-btn").forEach(b => b.onclick = e => { e.stopPropagation(); turnCard(card, card.dataset.flipped !== "true", true); });
    card.onclick = e => { if (!e.target.closest("a, button, details")) turnCard(card, card.dataset.flipped !== "true", false); };
  });
  el.querySelectorAll("[data-flipall]").forEach(all => all.onclick = () => {
    const on = all.getAttribute("aria-pressed") !== "true";
    all.setAttribute("aria-pressed", on); all.textContent = on ? "Show fronts only" : "Show all";
    all.closest("section").querySelectorAll(".flip").forEach(c => turnCard(c, on, false));
  });

  // Sticky contents bar: mark the section being read, and keep its pill in view on narrow screens.
  howSpy?.disconnect();
  const pills = new Map([...el.querySelectorAll("[data-howjump]")].map(b => [b.dataset.howjump, b]));
  const mark = id => pills.forEach((b, k) => { const on = k === id; b.classList.toggle("on", on);
    on ? b.setAttribute("aria-current", "location") : b.removeAttribute("aria-current");
    if (on) b.parentElement.scrollTo?.({ left: b.offsetLeft - 8, behavior: reducedMotion() ? "auto" : "smooth" }); });
  if (typeof IntersectionObserver === "function") {
    howSpy = new IntersectionObserver(entries => {
      const hit = entries.filter(x => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) mark(hit.target.id);
    }, { rootMargin: "-80px 0px -55% 0px" });
    el.querySelectorAll("section.how-sec").forEach(sec => howSpy.observe(sec));
  }
}
let howSpy = null;
function showHow(route){
  renderHow();
  document.querySelectorAll(".panel").forEach(p => { const on = p.id === "p-how"; p.hidden = !on; p.classList.toggle("active", on); });
  syncHome();
  const target = route && document.getElementById("how-" + route);
  // Arriving from a result's "How it works" link: open that route's card at its detail
  if (target?.classList.contains("flip")) turnCard(target, true, false);
  requestAnimationFrame(() => {
    (target || document.getElementById("p-how")).scrollIntoView?.({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    if (!target) document.getElementById("howTitle")?.focus({ preventScroll: true });
  });
}
/** Leaving How it works: show the selected tab's panel again, without touching the hash. */
function leaveHow(){
  howSpy?.disconnect();
  if (document.getElementById("p-how").hidden) return;
  const t = tabs.find(x => x.getAttribute("aria-selected") === "true") || tabs[0];
  selectTab(t, false);
}
if (DATA.methodology) document.getElementById("buildStamp").insertAdjacentHTML("beforebegin",
  `<p><a href="#/how-it-works" id="howFoot">How ${NAMES.reckonerMid} works</a>: how each route decides, how content is reviewed, and what it cannot do.</p>`);

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
  <div class="q-foot"><details class="help"><summary>Why this matters</summary><p>${esc(d.help)}</p></details></div></fieldset>`; }).join("");
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
    const practise = NAMES.gamePaths.includes(m.id)
      ? `<div class="lite-actions" style="margin-top:.8rem"><a class="pill" href="../play/">${icon("i-fieldwork")}Practise it in ${esc(NAMES.game)}</a></div>` : "";
    out.innerHTML = `<article class="card lead"><div class="card-head card-band"><div>
      <p class="hint" style="margin:0 0 .2rem">${previewing ? "Previewing from the matrix" : "Recommended for your answers"}</p>
      <h2>${esc(rec.label)}</h2><p class="src">${esc(m.name)} · ${esc(m.src)}</p></div><div class="head-badges">${badge(m.scale)}${provChip(m)}</div></div>
      ${quickRoute(previewing ? rec.key : quickAnswers().purpose, rec.side)}
      ${rec.why ? `<p style="margin-top:.3rem">${esc(rec.why)}</p>` : ""}${practise}${modelBody(m)}
      ${previewing ? `<p><button class="ghost" type="button" id="backRec">Back to my recommendation</button></p>` : ""}${feedbackLine("Was this useful?")}</article>
      ${previewing ? "" : quickAlt(a, r)}`;
    const b = document.getElementById("backRec"); if (b) b.onclick = () => { quickPreview = null; renderQuick(); };
    document.getElementById("altCompare")?.addEventListener("click", e => {
      cmpSel = e.currentTarget.dataset.ids.split(" "); goTab("t-compare"); });
  }
  renderMatrix(r);
}
/**
 * The other side of the quick matrix, so students see why the recommendation moves. Only for the purpose
 * table's results (not the one-lesson rule), and built from the same table and sentences as quickCompute().
 */
function quickAlt(a, r){
  if (!r || !r.side) return "";
  const other = r.side === "left" ? "right" : "left", [id, label] = QUICK[a.purpose][other];
  const text = other === "right"
    ? `You want students to ${PURPOSE_PHRASE[a.purpose]}, and your learners have the experience and time to take more control.`
    : `You want students to ${PURPOSE_PHRASE[a.purpose]}. With novice learners, a more structured model keeps cognitive load manageable.`;
  const both = [r.id, id].filter((x, i, xs) => M[x] && xs.indexOf(x) === i);
  return `<article class="card alt" id="quickAlt"><h3>${other === "right" ? "If your learners had more experience" : "If your learners needed more structure"}</h3>
    <p class="alt-name">${esc(label)}</p><p>${esc(text)}</p>
    ${both.length === 2 ? `<p><button class="ghost" type="button" id="altCompare" data-ids="${both.join(" ")}">Compare these two side by side</button></p>` : ""}</article>`;
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
  <div class="q-foot"><details class="help"><summary>Why this matters</summary><p>${esc(d.help)}</p></details>
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
/** The answer that fired a rule, for its "Rule" label: you chose “Novice” for learner readiness. */
const chose = (id, v) => `you chose “${optLabel(id, v)}” for ${dimById[id].short}`;
/* Watch-outs and nesting are hand-written rules, not part of the score. Each line carries the answer that triggered it. */
function watchOuts(m,a){ const W = [];
  if (["pbl","project-based","interactive-approach"].includes(m.id) && a.ready==="novice") W.push({ text:"Novice learners: high cognitive load risk. Scaffold heavily, or start with a more structured model.", because:chose("ready",a.ready) });
  if (["pbl","project-based","ast","interactive-approach","7e"].includes(m.id) && (a.time==="lesson"||a.time==="short")) W.push({ text:"This model needs a longer run than you have. Consider a shorter model or extend the sequence.", because:chose("time",a.time) });
  if (a.conf==="low" && ["ast","pbl","project-based","interactive-approach","case","glm"].includes(m.id)) W.push({ text:"Demanding to facilitate. Script your key questions, and observe or co-teach with a colleague first if you can.", because:chose("conf",a.conf) });
  if (a.res==="none" && ["design-cycle","learning-cycle","adi","interactive-approach"].includes(m.id)) W.push({ text:"Relies on hands-on work. Substitute simulations or secondary data sets.", because:chose("res",a.res) });
  if (a.lang==="high" && ["glm","case","ssi","adi","pbl"].includes(m.id)) W.push({ text:"Talk- and text-heavy. Add sentence frames, vocabulary pre-teaching or an SWH template.", because:chose("lang",a.lang) });
  if (a.misc==="robust" && ["pbl","project-based","design-cycle","ssi","interactive-approach"].includes(m.id)) W.push({ text:"Does not target misconceptions directly. Embed a POE early in the sequence.", because:chose("misc",a.misc) });
  if (a.concept==="abstract" && ["design-cycle","learning-cycle","interactive-approach"].includes(m.id)) W.push({ text:"Abstract concept: add an explicit modelling task so students can represent what they cannot see.", because:chose("concept",a.concept) });
  if (a.concept==="value" && m.id!=="ssi") W.push({ text:"Value-laden topic: include an SSI deliberation, for example in the application phase.", because:chose("concept",a.concept) });
  return W.slice(0,3); }
function nesting(m,a){ const N = [];
  if (a.misc==="robust" && m.id!=="poe") N.push({ text:"Open with a Predict–Observe–Explain to surface and challenge the target misconception.", guide:"poe", because:chose("misc",a.misc) });
  if (has(a,"ws","8") && !["adi","swh"].includes(m.id)) N.push({ text:"Add a Science Writing Heuristic template or an ADI argumentation session to the sense-making phase (WS-08).", because:chose("ws","8") });
  if (a.concept==="abstract" && m.id!=="ast") N.push({ text:"Add a model-drafting and revision task, borrowed from Ambitious Science Teaching.", because:chose("concept",a.concept) });
  if (has(a,"purpose","reason") && m.id!=="case") N.push({ text:"Run a CASE-style lesson on the reasoning pattern before the main investigation.", because:chose("purpose","reason") });
  if (a.place==="yes") N.push({ text:"Build a place-based context developed with local Aboriginal community, through your school’s Aboriginal Education staff.", because:chose("place",a.place) });
  return N; }
/**
 * "Have you thought about…?" prompts: when a model's scale and the time you have don't line up. The Reckoner
 * weighs purpose most heavily, so a model built for more (or fewer) lessons than you have can still rank first.
 * These support judgement; they don't change the ranking. A model the time watch-out already covers gets none.
 */
function timePrompts(m,a,W){ const P = [], t = a.time, has = (W || []).some(w => w.because === chose("time", t));
  if (!t || has) return P;
  const tl = optLabel("time", t).toLowerCase();
  if (m.scale === "meso" && t === "lesson") P.push({ text:`${m.name} is a multi-lesson routine, and you have one lesson. It ranks well because of what you want students to do, which counts most. Could a single-lesson model carry that purpose this time, or could you find the extra lessons?`, because:chose("time",t) });
  if (m.scale === "macro" && (t === "lesson" || t === "short")) P.push({ text:`${m.name} is unit architecture, built for a whole unit, and you have ${tl}. Would a shorter routine or a single-lesson model suit this stretch, with the unit model kept for the longer arc?`, because:chose("time",t) });
  if (m.scale === "meso" && (t === "unit" || t === "depth")) P.push({ text:`${m.name} is a multi-lesson routine, and you have ${tl}. It can run as one routine inside a unit model, or carry the unit itself. Which serves your unit’s arc better?`, because:chose("time",t) });
  if (m.scale === "micro" && (t === "unit" || t === "depth")) P.push({ text:`${m.name} is a single-lesson strategy, and you have ${tl}. Which unit model or routine will it sit inside?`, because:chose("time",t) });
  return P; }
const ruleTag = r => `<span class="rule-tag"><span class="badge b-rule">Rule</span> because ${esc(r.because)}</span>`;
/**
 * "Show the working": every term in fit() for one model, one row per answered question.
 * Reads dimScore() and the same weights fit() uses; the total row shows fit() itself.
 */
function working(m,a,imp,f){
  const num = n => String(+n.toFixed(2));
  const rows = DIMS.map(d => ({ d, s: dimScore(m,d,a), w: d.weight*imp[d.id] })).filter(r => r.s !== null);
  const total = rows.reduce((t,r) => t + r.w*r.s, 0), max = rows.reduce((t,r) => t + r.w*3, 0);
  const IMP = { 0.5: "low", 1: "", 2: "high" };
  return `<details class="why working"><summary>Show the working</summary>
    <div class="table-scroll"><table class="work"><thead><tr><th scope="col">Question</th><th scope="col">Your answer</th><th scope="col">Fit (0–3)</th><th scope="col">Weight</th><th scope="col">Points</th><th scope="col">Share</th></tr></thead><tbody>
    ${rows.map(({d,s,w}) => `<tr><th scope="row">${esc(d.short[0].toUpperCase()+d.short.slice(1))}</th>
      <td>${esc(d.multi ? a[d.id].map(v => optLabel(d.id,v)).join("; ") : optLabel(d.id,a[d.id]))}</td>
      <td>${num(s)}${d.multi && a[d.id].length > 1 ? ` <small>(mean)</small>` : ""}</td>
      <td>${num(d.weight)}${imp[d.id] !== 1 ? ` × ${num(imp[d.id])} <small>(${IMP[imp[d.id]]} importance)</small>` : ""}</td>
      <td>${num(w*s)} of ${num(w*3)}</td><td>${total ? Math.round(w*s/total*100) : 0}%</td></tr>`).join("")}
    </tbody><tfoot><tr><th scope="row">Fit</th><td colspan="3"></td><td>${num(total)} of ${num(max)}</td><td><strong>${Math.round(f*100)}%</strong></td></tr></tfoot></table></div>
    <p class="hint">Points are fit × weight; the fit percentage is total points out of the maximum. Share is each question’s part of the points. Questions you left blank are not counted.${howLink("detailed")}</p>
    ${m.hasGuide ? "" : `<p class="hint">Provisional: this model’s scores have not yet been checked against a companion guide.</p>`}</details>`;
}
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
    ? `<ol class="rank">${r.map((x,i)=>`<li class="${i<3?"top":""}"><span class="nm" title="${esc(x.m.name)}"><span class="n">${esc(x.m.name)}</span>${provChip(x.m)}</span><span class="bar" aria-hidden="true"><i style="width:${Math.round(x.f*100)}%"></i></span><span class="pc">${Math.round(x.f*100)}%</span></li>`).join("")}</ol>`
    : `<p class="empty">Answer a question to see how the models rank.</p>`) + unrankedNote;
  renderDial(a);
  const tc = document.getElementById("topCards");
  if (!r.length){ tc.innerHTML = `<p class="empty">Your top three models will appear here with reasons, watch-outs and nesting suggestions.</p>`; return; }
  const sens = sensitivity(a,imp,r[0].m.id);
  tc.innerHTML = r.slice(0,3).map((x,i) => { const m = x.m, rs = reasons(m,a), W = watchOuts(m,a), N = nesting(m,a), T = timePrompts(m,a,W);
    return `<article class="card${i===0?" lead":""}"><div class="card-head">
      <div><p class="hint" style="margin:0 0 .2rem">${["Best fit","Second","Third"][i]}</p><h3>${esc(m.name)}</h3><p class="src">${esc(m.src)}</p></div>
      <div style="display:flex;gap:.8rem;align-items:flex-start"><div class="head-badges">${badge(m.scale)}${provChip(m)}</div><div class="fitnum">${Math.round(x.f*100)}%<small>fit</small></div></div></div>
      ${rs.strong.length?`<p class="sub" style="margin-top:.8rem">Why this fits</p><ul class="tight">${rs.strong.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>`:""}
      ${rs.weak.length?`<p class="sub">Less suited to</p><ul class="tight">${rs.weak.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>`:""}
      ${working(m,a,imp,x.f)}
      ${W.length?`<div class="warnbox"><p class="sub">Watch-outs</p><ul class="tight">${W.map(w=>`<li>${esc(w.text)} ${ruleTag(w)}</li>`).join("")}</ul></div>`:""}
      ${T.length?`<div class="ponder"><p class="sub">Have you thought about…?</p>${T.map(t=>`<p>${esc(t.text)} <span class="rule-tag">Prompt, because ${esc(t.because)}</span></p>`).join("")}</div>`:""}
      ${N.length?`<p class="sub">Nest inside it</p><ul class="tight">${N.map(n=>`<li>${esc(n.text)} ${ruleTag(n)}${n.guide&&G[n.guide]?` <button class="ghost" style="padding:.1rem .5rem;font-size:.8rem" type="button" onclick="openGuide('${n.guide}')">Open guide</button>`:""}</li>`).join("")}</ul>`:""}
      ${i===0&&sens.length?`<p class="sub">If one answer changed</p><ul class="tight">${sens.map(o=>`<li>If ${esc(o.d.short)} were “${esc(optLabel(o.d.id,o.v))}”, ${esc(o.m.name)} would rank first.</li>`).join("")}</ul>`:""}
      ${modelBody(m)}${i===0 ? feedbackLine("Was this useful?") : ""}</article>`; }).join("");
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
/* Stage → focus areas, from the build (syllabus.ts, read from curriculum.vocab.json). */
const FOCUS = DATA.focusAreas;
/**
 * Density. Compact collapses the long sections to a heading and a count; Full opens
 * everything. Sections opened by hand stay open while the same guide is re-rendered.
 */
let density = store.get("density") === "full" ? "full" : "compact", openSecs = new Set();
const plural = (n, one) => `${n} ${n === 1 ? one : one + "s"}`;
function sec(id, title, count, inner){
  const open = density === "full" || openSecs.has(id);
  return `<section id="s-${id}"><details class="sec" data-sec="${id}"${open ? " open" : ""}>
    <summary><h2>${title}</h2><span class="count">${esc(count)}</span></summary>${inner}</details></section>`;
}
/** Open every collapsed section containing el, so deep links land on visible content. */
function expandTo(el){
  el.querySelectorAll(":scope > details.sec").forEach(d => { d.open = true; openSecs.add(d.dataset.sec); });
  for (let d = el.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")){
    d.open = true; if (d.dataset.sec) openSecs.add(d.dataset.sec);
  }
}
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
  if (id !== current) openSecs = new Set();
  current = id; const g = G[id];
  if (!g){ document.getElementById("guideBody").innerHTML = `<p class="empty">Select a guide.</p>`; renderGuideNav(); return; }
  const focusOpts = (ctx.stage ? FOCUS[ctx.stage] : [...FOCUS.stage4, ...FOCUS.stage5]);
  const phase = g.phases.slice().sort((a,b) => a.order - b.order);
  const body = `
  <div class="box" style="margin-bottom:1.25rem">
    <div class="card-head"><div><h2 style="border:none">${esc(g.name)} companion guide</h2>
      <p class="src">${esc(g.originators)} · ${esc(g.syllabus)} · v${esc(g.version)}, reviewed ${esc(g.lastReviewed)}</p>
      <p class="trust">${trustChips(M[g.id] || { id: g.id, hasGuide: true })}</p></div>
      <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap">
        <div class="density" role="group" aria-label="Guide layout">${["compact","full"].map(d => `<button class="ghost" type="button" data-density="${d}" aria-pressed="${density===d}">${d==="compact"?"Compact":"Full"}</button>`).join("")}</div>
        ${badge(g.reckoner.scale)}</div></div>
    ${g.status === "published" ? "" : `<div class="warnbox"><p class="sub">Not yet reviewed</p><p>${g.status === "in-review" ? "This guide is in review" : "This guide is a draft"}, included in this review copy only. Do not use it with students until it is signed off.</p></div>`}
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

  ${sec("theory", "Theory", `${plural(g.theory.foundations.length,"foundation")}${g.theory.critiques.length ? `, ${plural(g.theory.critiques.length,"critique")}` : ""}`, `${md(g.theory.summary)}
    ${g.theory.foundations.map(f => `<div class="lookfor"><p class="q">${esc(f.tradition)}</p>${md(f.idea)}<p><strong>What this means for design.</strong> ${esc(f.designImplication)}</p></div>`).join("")}
    ${g.theory.critiques.length ? `<h3 style="margin-top:1rem">Critiques</h3>${g.theory.critiques.map(c => `<div class="warnbox"><p class="sub">The critique</p>${md(c.claim)}<p class="sub">Response</p>${md(c.response)}</div>`).join("")}` : ""}`)}

  <section id="s-model"><h2>The model</h2>${md(g.sequence.summary)}
    ${flowHTML(g)}
    <p><strong>Scale.</strong> ${esc(g.sequence.scaleNote)}</p>
    <div class="roles"><div><h4>Teacher’s role</h4><p>${esc(g.roles.teacher)}</p></div><div><h4>Learner’s role</h4><p>${esc(g.roles.learner)}</p></div></div></section>

  ${sec("phases", g.phaseGroups.length ? "Stages" : "Phases", g.phaseGroups.length ? `${plural(g.phases.length,"stage")} in ${plural(g.phaseGroups.length,"group")}` : plural(g.phases.length,"phase"), `
    ${phaseStrip(g)}
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
    </article>`).join("")}`).join("")}`)}

  ${sec("sequences", `Worked ${g.reckoner.scale === "micro" ? "episodes" : "sequences"}`, plural(g.workedSequences.length, g.reckoner.scale === "micro" ? "worked episode" : "worked sequence"), `
    ${orderByCtx(g.workedSequences).map(s => sequenceHTML(g,s)).join("")}`)}

  ${sec("misapplications", "Common misapplications", plural(g.misapplications.length,"misapplication"), `
    <table><thead><tr><th>Misapplication</th><th>What it looks like</th><th>Why it undermines learning</th><th>Fix</th></tr></thead><tbody>
    ${g.misapplications.map(m => `<tr><th scope="row">${esc(m.name)}</th><td>${esc(m.looksLike)}</td><td>${esc(m.whyItUndermines)}</td><td>${esc(m.fix)}</td></tr>`).join("")}
    </tbody></table>`)}

  ${sec("checklist", "Designer’s checklist", plural(g.checklist.reduce((n,c) => n + c.items.length, 0),"item"), `
    <p class="intro">Tick as you audit your draft. Progress is saved in this browser only.</p>
    <div class="toolbar"><span class="progress" id="chkProgress"></span><button class="ghost" type="button" id="chkReset">Reset</button></div>
    ${g.checklist.map(c => `<article class="card"><h3>${esc(c.title)}</h3>
      ${c.items.map(i => `<label class="checkitem"><input type="checkbox" data-chk="${g.id}:${i.id}"><span>${esc(i.text)}</span></label>`).join("")}</article>`).join("")}`)}

  ${sec("alignment", "Syllabus alignment", `${g.syllabusAlignment.wsMapping.filter(m => m.phaseIds.length).length} of ${g.syllabusAlignment.wsMapping.length} Working scientifically skills built`, `
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
    ${g.nesting.length ? `<h3 style="margin-top:1rem">Nesting</h3><ul class="tight">${g.nesting.map(n => `<li>${n.role === "hosts" ? `Hosts <strong>${esc(M[n.modelId]?.name || n.modelId)}</strong>${n.phaseId ? ` in ${esc(phaseName(g,n.phaseId))}` : ""}` : `Nests inside <strong>${esc(M[n.modelId]?.name || n.modelId)}</strong>${n.phaseId ? ` at its ${esc(n.phaseId.replace(/-/g," "))} phase` : ""}`}: ${esc(n.how)}${G[n.modelId] ? ` <button class="ghost" style="padding:.1rem .5rem;font-size:.8rem" type="button" onclick="openGuide('${n.modelId}')">Open guide</button>` : ""}</li>`).join("")}</ul>` : ""}`)}

  ${sec("reflection", "Reflection prompts", plural(g.reflectionPrompts.length,"prompt"), `
    ${["personal","critical","application"].map(t => `<h3 style="margin-top:.8rem">${t[0].toUpperCase()+t.slice(1)}${t==="critical"?" analysis":t==="application"?" in the classroom":" reflection"}</h3>
      <ul class="tight">${g.reflectionPrompts.filter(p => p.type===t).map(p => `<li>${md(p.prompt)}</li>`).join("")}</ul>`).join("")}`)}

  ${sec("references", "References", plural(g.references.length,"reference"), `<ul class="tight">
    ${g.references.map(r => `<li>${esc(r.citation)}${r.url?` <a href="${esc(r.url)}">Link</a>`:""}${r.doi?` https://doi.org/${esc(r.doi)}`:""}</li>`).join("")}</ul>
    <p class="hint">Outcome codes follow the <a href="https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/outcomes">NESA Science 7–10 (2023) outcomes</a>.</p>`)}`;
  document.getElementById("guideBody").innerHTML = body;
  renderGuideNav();
  wireGuide(g);
}
/**
 * Phase glyphs and colours, matching the game. 7E's elicit and extend share Engage's and Elaborate's.
 * Any other phase (SWH, ADI, POE, Levels of inquiry) gets a numbered tile in the accent colour.
 */
const PHASE_GLYPH = { engage: "engage", elicit: "engage", explore: "explore", explain: "explain", elaborate: "elaborate", extend: "elaborate", evaluate: "evaluate" };
const phaseColour = id => PHASE_GLYPH[id] ? `var(--${PHASE_GLYPH[id]})` : "var(--accent)";
/** A row of phase tiles linking to the phase cards, then the typical time share when every phase has one. */
function phaseStrip(g){
  const ps = g.phases.slice().sort((a,b) => a.order - b.order);
  const tiles = `<ol class="ph-strip" aria-label="${g.phaseGroups.length ? "Stages" : "Phases"}">${ps.map((p, i) => `<li><a href="#/guide/${g.id}/${p.id}" style="--pc:${phaseColour(p.id)}">
    ${PHASE_GLYPH[p.id] ? `<span class="ph-tile">${icon("i-" + PHASE_GLYPH[p.id])}</span>` : `<span class="ph-tile num" aria-hidden="true">${i + 1}</span>`}${esc(p.name)}</a></li>`).join("")}</ol>`;
  if (!ps.every(p => p.typicalShare)) return tiles;
  const unit = g.reckoner.scale === "micro" ? "episode" : "sequence";
  const range = p => `${p.typicalShare.minPercent}\u2013${p.typicalShare.maxPercent}%`;
  return tiles + `<figure class="share">
    <div class="share-bar" role="img" aria-label="Typical share of ${unit} time: ${ps.map(p => `${esc(p.name)} ${range(p)}`).join(", ")}">${ps.map(p =>
      `<span style="--pc:${phaseColour(p.id)};flex:${(p.typicalShare.minPercent + p.typicalShare.maxPercent) / 2} 1 0"></span>`).join("")}</div>
    <ul class="share-key" aria-hidden="true">${ps.map(p => `<li style="--pc:${phaseColour(p.id)}">${esc(p.name)} <b>${range(p)}</b></li>`).join("")}</ul>
    <figcaption class="hint">Typical share of ${unit} time for each phase</figcaption></figure>`;
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
  document.querySelectorAll("[data-density]").forEach(b => b.onclick = () => {
    density = b.dataset.density; store.set("density", density); openSecs = new Set(); renderGuide(g.id); });
  document.querySelectorAll("details.sec").forEach(d => d.addEventListener("toggle", () => {
    if (printing) return;
    d.open ? openSecs.add(d.dataset.sec) : openSecs.delete(d.dataset.sec); }));

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

/* ---------- model map (Reckoner Lite, option C) ----------
 * Every model on one screen, banded by scale so the nesting is the layout.
 * Nesting lines come from the guides' nesting[], read in both directions. */
const BANDS = [
  ["macro", "Unit architectures", "Structures a whole sequence, 6 to 15 lessons", ""],
  ["meso", "Routines", "A few lessons. Fits inside a unit.", "Fits inside a unit model"],
  ["micro", "Single lesson", "One lesson. Fits inside a routine.", "Fits inside a routine, or straight into a unit model"],
  ["dial", "Guidance dial", "Not a model. How much you specify, inside any of the above.", "Applies inside any of them"],
];
let mapSel = null;
function mapNesting(m){
  const lines = [], add = t => { if (!lines.includes(t)) lines.push(t); };
  (G[m.id]?.nesting || []).forEach(n => add(`${n.role === "nests-in" ? "Fits inside" : "Holds"} ${M[n.modelId]?.name || n.modelId}`));
  DATA.guides.forEach(g => g.nesting.filter(n => n.modelId === m.id)
    .forEach(n => add(`${n.role === "hosts" ? "Fits inside" : "Holds"} ${g.name}`)));
  return lines;
}
function renderMap(){
  const guided = DATA.models.filter(m => m.hasGuide).length;
  document.getElementById("mapLegend").innerHTML =
    `<span class="gdot" aria-hidden="true"></span>Companion guide ready: ${guided} of ${DATA.models.length} so far`;
  document.getElementById("mapBands").innerHTML = BANDS.map(([scale, title, note, cap]) => {
    const ms = DATA.models.filter(m => m.scale === scale).sort((a, b) => (b.hasGuide ? 1 : 0) - (a.hasGuide ? 1 : 0));
    return ms.length ? `<section class="band" aria-labelledby="band-${scale}">
      <div class="band-head"><h3 id="band-${scale}">${title}</h3><p class="band-note">${note}</p></div>
      ${cap ? `<p class="band-cap">${cap}</p>` : ""}
      <div class="map-tiles">${ms.map(m => `<button type="button" class="tile s-${scale}" data-model="${m.id}" aria-pressed="${mapSel === m.id}">
        <b>${esc(m.name)}</b><span class="tile-foot"><span>${plural(m.phases.length, scale === "dial" ? "level" : "phase")}</span>
        ${m.hasGuide ? `<span class="gdot" aria-hidden="true"></span><span class="sr">Companion guide ready</span>` : provChip(m)}</span></button>`).join("")}</div></section>` : "";
  }).join("");
  document.querySelectorAll("#mapBands [data-model]").forEach(b => b.onclick = () => {
    mapSel = mapSel === b.dataset.model ? null : b.dataset.model;
    renderMap();
    document.querySelector(`#mapBands [data-model="${b.dataset.model}"]`)?.focus();
    if (mapSel) document.getElementById("mapPanelCard")?.scrollIntoView?.({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest" });
  });
  const m = mapSel && M[mapSel], panel = document.getElementById("mapPanel");
  if (!m){ panel.innerHTML = ""; return; }
  const nest = mapNesting(m);
  panel.innerHTML = `<article class="card lead map-panel" id="mapPanelCard"><div class="card-head"><div><h3>${esc(m.name)}</h3><p class="src">${esc(m.src)}</p></div>${badge(m.scale)}</div>
    <p class="trust">${trustChips(m)}</p>
    <ol class="phases" aria-label="${m.scale === "dial" ? "Levels" : "Phases"}">${m.phases.map(p => `<li>${esc(p)}</li>`).join("")}</ol>
    <p><strong>Distinguishing feature.</strong> ${esc(m.distinct)}</p>
    <div class="roles"><div><h4>Teacher’s role</h4><p>${esc(m.teacher)}</p></div><div><h4>Learner’s role</h4><p>${esc(m.learner)}</p></div></div>
    ${nest.length ? `<ul class="tight">${nest.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    <div class="lite-actions">${m.hasGuide
      ? `<button type="button" class="pill primary" onclick="openGuide('${m.id}')">Open the ${esc(m.name)} guide</button>`
      : `<button type="button" class="pill" disabled>Guide not written yet</button>`}</div></article>`;
}

/* ---------- start with your unit (Reckoner Lite, option B) ----------
 * Stage, then focus area, then whatever the guides hold for it: a worked sequence,
 * examples only, or nothing yet. Reads the build's focusIndex; writes no content. */
const FA = DATA.focusAreas || {}, FI = DATA.focusIndex || {};
const STAGE_INFO = { stage4: ["Stage 4", "Years 7 and 8"], stage5: ["Stage 5", "Years 9 and 10"] };
let unit = { stage: null, focus: null, seq: 0, all: false };
const findSeq = r => G[r.guide]?.workedSequences.find(s => s.id === r.id);
const findEx = r => G[r.guide]?.phases.find(p => p.id === r.phase)?.examples.find(e => e.id === r.id);
/** "8 lessons" or "50 minutes", from the last step's timing. */
function seqLength(s){
  const last = s.steps[s.steps.length - 1], minutes = last.minutes !== undefined;
  const n = Math.max(...String(minutes ? last.minutes : last.lessons).match(/\d+/g).map(Number));
  return minutes ? `${n} minutes` : plural(n, "lesson");
}
function unitGo(next){ unit = { ...unit, ...next }; renderUnit(true); }

/* ---------- three taps (Reckoner Lite, option A) ----------
 * The "not sure what you need?" route from the unit view: one question per screen,
 * the quick-matrix decision unchanged, and a result card built from the guide. */
const TAP_QS = [["purpose", "What do you most want to shift?"], ["time", "How long have you got?"], ["ready", "How much investigating have they done?"]];
/** Plain-language labels for option ids. UI copy, not guide content; an id without an entry uses the payload's own label. */
const TAP_WORDS = {
  misc: ["A stubborn wrong idea", "They believe something that isn’t right, and it keeps coming back"],
  model: ["Explaining why it happens", "They can describe the phenomenon but not the mechanism"],
  investigate: ["Planning an investigation", "They can follow a method, but not design one"],
  argue: ["Backing up a claim", "They state conclusions without evidence"],
  design: ["Solving a real problem", "They need to design, build or fix something"],
  ssi: ["Weighing up an issue", "The science is contested, or values are in play"],
  reason: ["Reasoning it through", "Controlling variables, proportion, probability"],
  novice: ["Not much yet", "They’re used to following instructions"],
  developing: ["Some", "They’ve planned a fair test before"],
  experienced: ["Plenty", "They design their own investigations"],
};
let tap = null; // { step: 0–3, a: { purpose, time, ready } } while in the three-tap route
function tapGo(next){ tap = next; renderUnit(true); }
/** The published guide at the same scale, falling back to 5E. */
const nearestGuide = scale => DATA.guides.find(g => g.reckoner.scale === scale) || G["5e"];

function tapView(){
  const i = tap.step;
  if (i < TAP_QS.length){
    const [dim, q] = TAP_QS[i], d = dimById[dim];
    return { q, html: `${i ? `<button type="button" class="lite-back" data-tapback>← Back</button>` : ""}
      <div class="tap-progress"><span class="dots" aria-hidden="true">${TAP_QS.map((_, n) => `<span class="${n <= i ? "on" : ""}"></span>`).join("")}</span><span>${i + 1} of ${TAP_QS.length}</span></div>
      <h2 class="lite-q" tabindex="-1">${q}</h2>
      <div class="opts rows">${d.options.map(([id, label]) => { const w = TAP_WORDS[id];
        return `<button type="button" class="opt" data-tap="${id}"><b>${esc(w ? w[0] : label)}</b>${w ? `<small>${esc(w[1])}</small>` : ""}</button>`; }).join("")}</div>
      ${i === 0 ? `<p style="margin-top:1rem"><button type="button" class="lite-link" data-tapexit>Start with your unit instead</button></p>` : ""}` };
  }
  const r = quickCompute(tap.a), m = M[r.id], g = G[r.id];
  const first = g && g.phases.slice().sort((a, b) => a.order - b.order)[0];
  const moves = first ? first.essentialFeatures.slice(0, 3) : [];
  const near = moves.length ? null : nearestGuide(m.scale);
  const body = moves.length
    ? `<p class="sub" style="margin-top:1rem">Your first three moves</p><ol class="moves">${moves.map(f => `<li>${esc(f)}</li>`).join("")}</ol>
       ${first.lookFors.length ? `<p class="sub">What good looks like</p><div class="lookfor"><p class="q">${esc(first.lookFors[0].question)}</p>
         <p class="hint" style="margin:0">${esc(first.name)}, the opening ${g.phaseGroups.length ? "stage" : "phase"}</p></div>` : ""}`
    : `<ol class="phases" aria-label="Phases">${m.phases.map(p => `<li>${esc(p)}</li>`).join("")}</ol>
       <p><strong>Distinguishing feature.</strong> ${esc(m.distinct)}</p>
       <div class="warnbox"><p>There isn’t a companion guide for ${esc(m.name)} yet. The nearest one is <strong>${esc(near.name)}</strong>${near.reckoner.scale === m.scale ? `, also a ${esc(SCALE[m.scale].label.toLowerCase())}` : ""}.</p></div>`;
  const open = moves.length ? g : near;
  return { q: m.name, html: `<article class="lite-result"><p class="eyebrow">Start here</p>
      <h2 class="lite-q tap-name" tabindex="-1">${esc(m.name)}</h2>
      <div class="lite-meta"><span>${esc(m.src)}</span>${badge(m.scale)}${provChip(m)}</div>
      ${quickRoute(tap.a.purpose, r.side).replace("#/how-it-works/quick", "#/how-it-works/three-taps")}
      <p style="margin-top:.3rem">${esc(r.why)}</p>${body}
      <div class="lite-actions"><button type="button" class="pill primary" data-guide="${open.id}"${moves.length ? ` data-at="${first.id}"` : ""}>Open the ${esc(open.name)} guide</button>
        <button type="button" class="pill" data-tapreset>Start again</button></div>${feedbackLine("Was this useful?")}</article>` };
}

function renderUnit(moveFocus){
  const view = document.getElementById("unitView");
  let q, html;
  if (tap){
    ({ q, html } = tapView());
  } else if (!unit.stage){
    q = "Which stage are you teaching?";
    html = `<h2 class="lite-q" tabindex="-1">${q}</h2>
      <div class="opts stages">${Object.entries(STAGE_INFO).filter(([st]) => FA[st]).map(([st, [name, years]]) =>
        `<button type="button" class="opt big" data-stage="${st}">${icon(st === "stage4" ? "i-stage4" : "i-stage5", "i stage-i")}<b>${name}</b><small>${years}</small></button>`).join("")}</div>
      <p style="margin-top:1rem">Not sure what you need? <button type="button" class="lite-link" data-tapstart>Answer three quick questions</button></p>`;
  } else if (!unit.focus){
    q = `Which ${STAGE_INFO[unit.stage][0]} focus area?`;
    html = `<button type="button" class="lite-back" data-back="stage">← Change stage</button>
      <h2 class="lite-q" tabindex="-1">${q}</h2>
      <div class="opts">${FA[unit.stage].map(fa => {
        const ready = FI[`${unit.stage}|${fa}`]?.sequences.length;
        return `<button type="button" class="opt" data-focus="${esc(fa)}"><b>${esc(fa)}</b>${ready ? `<span class="ready">Ready plan</span>` : ""}</button>`;
      }).join("")}</div>`;
  } else {
    const r = unitResult();
    q = r.heading;
    html = `<button type="button" class="lite-back" data-back="focus">← ${STAGE_INFO[unit.stage][0]} focus areas</button>
      <article class="lite-result"><p class="sub" style="margin:0 0 .3rem">${STAGE_INFO[unit.stage][0]} · ${esc(unit.focus)}</p>
      <h2 class="lite-q" tabindex="-1">${esc(r.heading)}</h2>${r.route}${r.body}
      <div class="lite-actions">${r.actions}<button type="button" class="pill" data-back="focus">Choose another focus area</button></div>${feedbackLine("Was this useful?")}</article>`;
  }
  view.innerHTML = html;
  document.getElementById("unitLive").textContent = q;
  view.querySelectorAll("[data-stage]").forEach(b => b.onclick = () => unitGo({ stage: b.dataset.stage, focus: null }));
  view.querySelectorAll("[data-focus]").forEach(b => b.onclick = () => unitGo({ focus: b.dataset.focus, seq: 0, all: false }));
  view.querySelectorAll("[data-back]").forEach(b => b.onclick = () =>
    unitGo(b.dataset.back === "stage" ? { stage: null, focus: null } : { focus: null }));
  view.querySelector("[data-tapstart]")?.addEventListener("click", () => tapGo({ step: 0, a: {} }));
  view.querySelector("[data-tapexit]")?.addEventListener("click", () => tapGo(null));
  view.querySelector("[data-tapreset]")?.addEventListener("click", () => tapGo({ step: 0, a: {} }));
  view.querySelectorAll("[data-tap]").forEach(b => b.onclick = () =>
    tapGo({ step: tap.step + 1, a: { ...tap.a, [TAP_QS[tap.step][0]]: b.dataset.tap } }));
  view.querySelector("[data-tapback]")?.addEventListener("click", () => {
    const a = { ...tap.a }; TAP_QS.slice(tap.step - 1).forEach(([dim]) => delete a[dim]);
    tapGo({ step: tap.step - 1, a });
  });
  view.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { const t = document.getElementById(b.dataset.go); selectTab(t); t.focus(); });
  view.querySelectorAll("[data-guide]").forEach(b => b.onclick = () => openGuide(b.dataset.guide, b.dataset.at || undefined));
  view.querySelector("[data-all]")?.addEventListener("click", () => { unit.all = !unit.all; renderUnit(false); });
  view.querySelector("[data-seq]")?.addEventListener("click", e => { unit.seq = +e.currentTarget.dataset.seq; unit.all = false; renderUnit(true); });
  if (moveFocus) view.querySelector(".lite-q")?.focus();
}

/** This route picks by what the guides hold, not by fit, and says so. */
const unitRoute = why => `<p class="hint route">Chosen because ${esc(why)}. To check the fit for your class, try the Quick or Detailed reckoner.
  <button type="button" class="lite-link" data-go="t-quick">Open the Quick reckoner</button>${howLink("unit")}</p>`;
function unitResult(){
  const entry = FI[`${unit.stage}|${unit.focus}`] || { sequences: [], examples: [] };
  const seqs = entry.sequences.filter(findSeq);

  if (seqs.length){ // a ready plan
    const i = Math.min(unit.seq, seqs.length - 1), ref = seqs[i], g = G[ref.guide], s = findSeq(ref);
    const minutes = s.steps[0].minutes !== undefined, rows = unit.all ? s.steps : s.steps.slice(0, 3);
    const other = seqs.length > 1 ? seqs[(i + 1) % seqs.length] : null;
    return {
      heading: s.bigQuestion,
      body: `<div class="lite-meta"><span>${esc(g.name)}</span><span>·</span><span>${seqLength(s)}</span>${badge(g.reckoner.scale)}</div>
        ${s.targetConceptions.length ? `<p class="sub" style="margin-top:.9rem">Target alternative conceptions</p>
          <div class="pills">${s.targetConceptions.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
        <div class="lite-table"><table><thead><tr><th>${minutes ? "Minutes" : "Lesson"}</th><th>Phase</th><th>What happens</th></tr></thead><tbody>
          ${rows.map(st => `<tr><th scope="row">${esc(st.minutes ?? st.lessons)}</th><td>${esc(phaseName(g, st.phaseId))}</td><td>${md(st.activity)}</td></tr>`).join("")}
        </tbody></table></div>
        ${s.steps.length > 3 ? `<button type="button" class="ghost" data-all aria-expanded="${unit.all}">${unit.all ? "Show fewer steps" : `Show all ${s.steps.length} steps`}</button>` : ""}
        ${other ? `<p class="hint" style="margin-top:.9rem">There is another plan for this focus area: <button type="button" class="lite-link" data-seq="${(i + 1) % seqs.length}">${esc(findSeq(other).title)} (${esc(G[other.guide].name)})</button></p>` : ""}`,
      route: unitRoute(`the ${g.name} guide has a worked sequence for ${unit.focus}`),
      actions: `<button type="button" class="pill primary" data-guide="${g.id}" data-at="${s.id}">Open the full plan in the ${esc(g.name)} guide</button>`,
    };
  }

  const exs = entry.examples.map(r => ({ ...r, e: findEx(r) })).filter(r => r.e);
  if (exs.length){ // examples, but no plan yet
    const tally = exs.reduce((t, r) => (t[r.guide] = (t[r.guide] || 0) + 1, t), {});
    const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
    const pick = exs.find(r => r.guide === top && r.e.kind === "positive") || exs.find(r => r.e.kind === "positive") || exs[0];
    const g = G[pick.guide], e = pick.e;
    return {
      heading: "No ready plan yet",
      body: `<div class="warnbox"><p>There isn’t a worked sequence for ${esc(unit.focus)} yet. The ${plural(exs.length, "example")} for it ${exs.length === 1 ? "comes" : "mostly come"} from <strong>${esc(G[top].name)}</strong>.</p></div>
        <div class="ex ${e.kind}"><h4>${e.kind === "positive" ? "Done well" : "Done badly"}: ${esc(e.title)}</h4>
          <p class="tagline">${esc(g.name)} · ${esc(phaseName(g, pick.phase))}${e.outcomes.length ? " · " + e.outcomes.join(", ") : ""}</p>
          ${md(e.body)}<p><strong>Why.</strong> ${esc(e.diagnosis)}</p></div>`,
      route: unitRoute(`the ${G[top].name} guide has examples for ${unit.focus}`),
      actions: `<button type="button" class="pill primary" data-guide="${g.id}" data-at="${pick.phase}">Open the ${esc(g.name)} guide at ${esc(phaseName(g, pick.phase))}</button>`,
    };
  }

  // nothing yet: name the action, not the absence
  const all = Object.entries(FA).flatMap(([st, fas]) => fas.map(fa => `${st}|${fa}`));
  const empty = all.filter(k => !FI[k]).length;
  const five = G["5e"], m = M["5e"];
  const hosts = five ? five.nesting.filter(n => n.role === "hosts").map(n => M[n.modelId]?.name || n.modelId) : [];
  return {
    heading: "Start from 5E",
    body: `<div class="warnbox"><p>${empty} of ${all.length} focus areas, including this one, don’t have a worked sequence or examples yet.
        5E is the safe default: it is a ${esc(SCALE[m.scale].label.toLowerCase())}, so it gives the whole sequence a structure${hosts.length ? `, and it can hold ${esc(hosts.join(", "))}` : ""}.</p></div>
      <ol class="phases" aria-label="Phases">${m.phases.map(p => `<li>${esc(p)}</li>`).join("")}</ol>
      <p><strong>Distinguishing feature.</strong> ${esc(m.distinct)}</p>`,
    route: unitRoute(`no guide has material for ${unit.focus} yet, and 5E is the safe default`),
    actions: five ? `<button type="button" class="pill primary" data-guide="5e">Open the 5E guide</button>` : "",
  };
}

/* ---------- compare ---------- */
const CMP_MAX = 4, CMP_DEFAULT = ["5e", "adi", "poe"];
/** Rows in order: [id, label, cell renderer, clamped by default]. */
const CMP_ROWS = [
  ["scale", "Scale", m => badge(m.scale), false],
  ["distinct", "Distinguishing feature", m => esc(m.distinct), true],
  ["phases", "Phases", m => `<ol class="phases" aria-label="Phases">${m.phases.map(p => `<li>${esc(p)}</li>`).join("")}</ol>`, true],
  ["teacher", "Teacher’s role", m => esc(m.teacher), true],
  ["learner", "Learner’s role", m => esc(m.learner), true],
  ["fit", "Best science fit", m => esc(m.fit), true],
  ["pitfall", "Common pitfall", m => esc(m.pitfall), true],
  ["guide", "Companion guide", m => m.hasGuide
    ? `<button class="ghost" type="button" onclick="openGuide('${m.id}')">Open guide</button>` : `<span class="hint">Coming soon</span>`, false],
];
let cmpSel = null;            // null until the viewer chooses; then the ids in the order chosen
const cmpOpen = new Set();    // rows expanded across every column
function cmpDefault(){
  const { a, imp } = detailAnswers(), r = rankAll(a, imp);
  return r.length ? r.slice(0, 3).map(x => x.m.id) : CMP_DEFAULT.filter(id => M[id]);
}
const cmpSelected = () => cmpSel ?? cmpDefault();
const cmpCell = (row, m) => row[3]
  ? `<div class="${row[0] === "phases" ? "clamp-block" : "clamp"}">${row[2](m)}</div>` : row[2](m);
const cmpToggle = id => `<button class="ghost rowtoggle" type="button" data-row="${id}" aria-expanded="${cmpOpen.has(id)}">${cmpOpen.has(id) ? "Show less" : "Show more"}</button>`;

function renderCompare(){
  const sel = cmpSelected();
  document.getElementById("cmpPicker").innerHTML = Object.entries(SCALE).map(([k, s]) => {
    const ms = DATA.models.filter(m => m.scale === k);
    return ms.length ? `<div class="cmp-group"><p class="sub">${esc(s.label)}</p><div class="chips">${ms.map(m =>
      `<label class="chip"><input type="checkbox" value="${m.id}"${sel.includes(m.id) ? " checked" : ""}><span>${esc(m.name)}${badge(m.scale)}${provChip(m)}</span></label>`).join("")}</div></div>` : "";
  }).join("");
  renderCompareView();
}
function renderCompareView(){
  const models = cmpSelected().map(id => M[id]).filter(Boolean);
  document.getElementById("cmpStatus").textContent = `${plural(models.length, "model")} selected`;
  const table = document.getElementById("cmpTable"), cards = document.getElementById("cmpCards");
  if (!models.length){
    table.innerHTML = `<p class="empty">Select up to four models above.</p>`; cards.innerHTML = ""; return;
  }
  table.innerHTML = `<table class="cmp"><thead><tr><td></td>${models.map(m =>
    `<th scope="col"><h3>${esc(m.name)}</h3><p class="src">${esc(m.src)}</p><p class="trust">${trustChips(m)}</p></th>`).join("")}</tr></thead><tbody>${CMP_ROWS.map(row =>
    `<tr data-row="${row[0]}" class="${cmpOpen.has(row[0]) ? "open" : ""}"><th scope="row">${row[1]}${row[3] ? cmpToggle(row[0]) : ""}</th>${models.map(m =>
      `<td>${cmpCell(row, m)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  cards.innerHTML = models.map(m => `<article class="card"><div class="card-head"><div><h3>${esc(m.name)}</h3><p class="src">${esc(m.src)}</p><p class="trust">${trustChips(m)}</p></div></div>
    ${CMP_ROWS.map(row => `<div class="cmp-row${cmpOpen.has(row[0]) ? " open" : ""}" data-row="${row[0]}"><p class="sub">${row[1]}</p>${cmpCell(row, m)}${row[3] ? cmpToggle(row[0]) : ""}</div>`).join("")}</article>`).join("");
  document.querySelectorAll("#p-compare .rowtoggle").forEach(b => b.onclick = () => {
    const id = b.dataset.row;
    cmpOpen.has(id) ? cmpOpen.delete(id) : cmpOpen.add(id);
    renderCompareView();
    document.querySelector(`#p-compare .rowtoggle[data-row="${id}"]:not([hidden])`)?.focus?.();
  });
  cmpMeasure();
}
/** Offer "Show more" only on rows where some cell is actually cut off in the visible layout. */
function cmpMeasure(){
  CMP_ROWS.filter(r => r[3]).forEach(([id]) => {
    if (cmpOpen.has(id)) return;
    const cells = [...document.querySelectorAll(`#p-compare [data-row="${id}"] .clamp, #p-compare [data-row="${id}"] .clamp-block`)];
    const cut = cells.some(c => c.scrollHeight > c.clientHeight + 1);
    document.querySelectorAll(`#p-compare .rowtoggle[data-row="${id}"]`).forEach(b => b.hidden = !cut);
  });
}
let cmpResize;
addEventListener("resize", () => { clearTimeout(cmpResize); cmpResize = setTimeout(() => {
  if (!document.getElementById("p-compare").hidden) cmpMeasure(); }, 150); });
document.getElementById("cmpPicker").addEventListener("change", e => {
  const t = e.target, note = document.getElementById("cmpNote");
  let sel = [...cmpSelected()];
  if (t.checked){
    if (sel.length >= CMP_MAX){ t.checked = false; note.textContent = "Compare up to four at a time"; return; }
    sel.push(t.value);
  } else sel = sel.filter(id => id !== t.value);
  note.textContent = "";
  cmpSel = sel;
  renderCompareView();
});
document.getElementById("cmpClear").onclick = () => {
  cmpSel = []; document.getElementById("cmpNote").textContent = ""; renderCompare(); };

/* ---------- entry points on the first screen ---------- */
document.getElementById("goReckoner").onclick = () => {
  quickForm.scrollIntoView?.({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  quickForm.querySelector("input")?.focus({ preventScroll: true });
};
document.getElementById("goCompare").onclick = () => {
  const t = document.getElementById("t-compare"); selectTab(t); t.focus(); };
document.getElementById("goTour").onclick = () => startTour();

/* ---------- walkthrough ---------- */
const TOUR = [
  { tab: "t-quick", target: () => quickForm,
    text: "Start with what you’re planning. Three questions give you a model; eleven give you a ranked shortlist with reasons and watch-outs." },
  { tab: "t-compare", target: () => document.getElementById("cmpTable"),
    text: "Models work at different scales. A unit model like 5E holds routines like ADI, which can hold a single-lesson strategy like POE. The compare view shows the scale of each." },
  { tab: "t-guides", target: () => document.getElementById("guideNav"),
    text: "Open a companion guide for the model you choose. Each has phases with look-fors, worked examples done well and done badly, and a designer’s checklist you can tick off." },
  { tab: "t-guides", target: () => document.querySelector("#guideBody .ctx"),
    text: "Set your stage and focus area in any guide, and the examples matching your context are marked and shown first." },
];
const tourEl = document.getElementById("tour");
let tourStep = -1, tourReturn = null;
function startTour(auto = false){
  tourReturn = document.activeElement;
  tourEl.hidden = false; showTourStep(0, !auto); tourEl.focus({ preventScroll: true });
}
function showTourStep(i, scroll = true){
  document.querySelector(".tour-target")?.classList.remove("tour-target");
  tourStep = i; const s = TOUR[i];
  const tab = document.getElementById(s.tab);
  if (tab.getAttribute("aria-selected") !== "true") selectTab(tab, s.tab !== "t-guides");
  document.getElementById("tourCount").textContent = `Step ${i + 1} of ${TOUR.length}`;
  document.getElementById("tourText").textContent = s.text;
  document.getElementById("tourNext").textContent = i === TOUR.length - 1 ? "Done" : "Next";
  const el = s.target();
  if (el){ el.classList.add("tour-target"); if (scroll) el.scrollIntoView?.({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" }); }
}
function closeTour(){
  document.querySelector(".tour-target")?.classList.remove("tour-target");
  tourEl.hidden = true; tourStep = -1; store.set("tourDone", true);
  if (tourReturn && document.contains(tourReturn)) tourReturn.focus?.({ preventScroll: true });
}
document.getElementById("tourNext").onclick = () => tourStep < TOUR.length - 1 ? showTourStep(tourStep + 1) : closeTour();
document.getElementById("tourClose").onclick = closeTour;
addEventListener("keydown", e => { if (e.key === "Escape" && !tourEl.hidden) closeTour(); });

/* ---------- print: guides and comparisons always print in full ---------- */
let printing = false, printRestore = null;
addEventListener("beforeprint", () => {
  printing = true;
  const closed = [...document.querySelectorAll("details.sec:not([open]), #howBody details:not([open])")];
  closed.forEach(d => d.open = true);
  printRestore = () => closed.forEach(d => d.open = false);
});
addEventListener("afterprint", () => { printRestore?.(); printRestore = null; setTimeout(() => { printing = false; }, 0); });

/* ---------- review copy banner (npm run review) ---------- */
if (DATA.review){
  const b = document.createElement("div");
  b.className = "warnbox"; b.setAttribute("role", "note");
  b.innerHTML = `<p class="sub">Review copy, not for students</p><p>${esc(DATA.review.label)}. Built from the YAML for review; unreviewed guides are marked.</p>`;
  const w = document.createElement("div"); w.className = "wrap"; w.append(b);
  document.querySelector("header.top").prepend(w);
}

renderUnit(false); renderQuick(); renderDetail(); renderMap();
renderGuide(DATA.guides.length ? DATA.guides[0].id : null);
routeFromHash();
syncHome();
document.getElementById("bootMsg")?.remove();
// The walkthrough starts from the quick reckoner, so it no longer opens by itself over the
// "Start with your unit" landing view; it stays available from the quick reckoner's entry point.
