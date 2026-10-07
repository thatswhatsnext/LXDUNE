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
const COLS = ["var(--engage)","var(--explore)","var(--explain)","var(--elaborate)","var(--evaluate)"];
/* Every user-facing name for the parts of the Field Guide, so a rename is a one-line change.
 * game.html's <title> carries the same names as a fallback until this runs. */
const NAMES = { game:"Fieldwork", product:"The Field Guide", reckoner:"The Reckoner" };
NAMES.reckonerMid = NAMES.reckoner.replace(/^The /, "the ");
document.title = `${NAMES.game} · ${NAMES.product}`;
const PRIVACY = "Nothing you do here is recorded or sent anywhere. Progress stays in this browser.";
const icon = id => `<svg class="i" aria-hidden="true"><use href="#${id}"/></svg>`;
/* Phase glyphs for the five 5E phases; any other phase id gets a plain tag. */
const GLYPH = ["engage","explore","explain","elaborate","evaluate"];
/* Lesson plates, keyed by lesson id: shown on graph paper above the lesson's first item. No schema change. */
const PLATES = {
  "5e-1-willow": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A willow tree growing in a tub of soil, with the sun and water drops" xmlns="http://www.w3.org/2000/svg">
  <circle class="pl-sun" cx="300" cy="38" r="17"/>
  <g class="pl-ray" stroke-width="2.4" stroke-linecap="round"><path d="M300 10v-6"/><path d="M328 38h6"/><path d="M320 18l4-4"/><path d="M320 58l4 4"/><path d="M272 18l-4-4"/></g>
  <ellipse class="pl-canopy" cx="178" cy="78" rx="78" ry="44"/>
  <path class="pl-trunk" d="M178 150 C175 122 172 100 178 72" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path class="pl-trunk" d="M178 86 C196 76 208 70 222 68" stroke-width="4" fill="none" stroke-linecap="round"/>
  <g class="pl-branch" stroke-width="2.4" fill="none" stroke-linecap="round">
    <path d="M178 46 C150 42 120 62 112 120"/><path d="M178 46 C160 50 140 74 136 128"/><path d="M178 46 C170 64 160 90 158 132"/>
    <path d="M178 46 C206 42 236 62 244 120"/><path d="M178 46 C196 50 216 74 220 128"/><path d="M178 46 C186 64 196 90 198 132"/>
  </g>
  <g class="pl-leaf"><ellipse cx="114" cy="110" rx="3" ry="6"/><ellipse cx="137" cy="116" rx="3" ry="6"/><ellipse cx="158" cy="122" rx="3" ry="6"/><ellipse cx="243" cy="110" rx="3" ry="6"/><ellipse cx="219" cy="116" rx="3" ry="6"/><ellipse cx="198" cy="122" rx="3" ry="6"/><ellipse cx="124" cy="86" rx="3" ry="6"/><ellipse cx="232" cy="86" rx="3" ry="6"/></g>
  <path class="pl-tub" d="M120 150 H236 L226 184 H130 Z"/>
  <rect class="pl-rim" x="116" y="146" width="124" height="9" rx="3"/>
  <path class="pl-soil" d="M124 150 H232" stroke-width="5"/>
  <g class="pl-drop"><path d="M60 92 c-5 8 -7 12 0 14 c7 -2 5 -6 0 -14z"/><path d="M76 112 c-5 8 -7 12 0 14 c7 -2 5 -6 0 -14z"/><path d="M58 128 c-5 8 -7 12 0 14 c7 -2 5 -6 0 -14z"/></g>
  <text class="pl-label" x="20" y="176">YEAR 0 · 2 kg</text>
  <text class="pl-label" x="258" y="176">YEAR 5 · 77 kg</text>
  <text class="pl-q" x="262" y="108">?</text>
</svg>`,
  "adi-1-leaf-litter": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="Two pitfall traps sunk in the ground. Beside a sunny mown oval, the trap is crowded with ants of one kind. Under a gum tree in leaf litter, the trap holds fewer animals, each a different kind: an ant, a beetle, a slater, a spider, a centipede and a springtail." xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="ll-ant" overflow="visible">
    <g stroke-width=".9" stroke-linecap="round" fill="none"><path d="M1.5 0l-1.5 4M1.5 0l1.8 4.2M1.5 0l-3 3.6M1.5 0l-1.5 -4M1.5 0l1.8 -4.2M1.5 0l-3 -3.6M6 -1l2.6 -2.4M6 1l2.6 2.4"/></g>
    <g stroke-width="0"><ellipse cx="-3.2" cy="0" rx="3" ry="2.1"/><ellipse cx="1.4" cy="0" rx="1.9" ry="1.2"/><circle cx="5" cy="0" r="1.8"/></g>
    </symbol>
    <symbol id="ll-beetle" overflow="visible">
    <g stroke-width="1" stroke-linecap="round" fill="none"><path d="M3 -3.6l2 -2.6M3 3.6l2 2.6M0 -4l0 -3.2M0 4l0 3.2M-3 -3.6l-2 -2.8M-3 3.6l-2 2.8M8 -1l2.4 -2.4M8 1l2.4 2.4"/></g>
    <g stroke-width="0"><ellipse cx="-.5" cy="0" rx="6.2" ry="4.4"/><ellipse cx="6.6" cy="0" rx="2.2" ry="2"/></g>
    <path class="ll-seg" d="M-6.2 0H5.4" stroke-width=".9"/>
    </symbol>
    <symbol id="ll-slater" overflow="visible">
    <g stroke-width=".9" stroke-linecap="round" fill="none"><path d="M6.6 -1.2l3 -2.6M6.6 1.2l3 2.6M-6.4 -1l-2.2 -1.6M-6.4 1l-2.2 1.6"/></g>
    <ellipse cx="0" cy="0" rx="6.6" ry="4" stroke-width="0"/>
    <g class="ll-seg" stroke-width=".8" fill="none"><path d="M-4.2 -3.1v6.2M-1.8 -3.8v7.6M.6 -4v8M3 -3.7v7.4M5.1 -2.8v5.6"/></g>
    </symbol>
    <symbol id="ll-spider" overflow="visible">
    <g stroke-width="1" stroke-linecap="round" fill="none">
    <path d="M2 -1.2q1 -4 4 -6M1.4 -1.6q-.4 -4 1.6 -6.8M.6 -1.6q-1.6 -3.6 -1.2 -6.8M0 -1.2q-3 -2.4 -4.2 -5.6"/>
    <path d="M2 1.2q1 4 4 6M1.4 1.6q-.4 4 1.6 6.8M.6 1.6q-1.6 3.6 -1.2 6.8M0 1.2q-3 2.4 -4.2 5.6"/>
    </g>
    <g stroke-width="0"><circle cx="-3.4" cy="0" r="3.4"/><circle cx="1.4" cy="0" r="2.1"/></g>
    </symbol>
    <symbol id="ll-centipede" overflow="visible">
    <g stroke-width=".8" stroke-linecap="round" fill="none">
    <path d="M-8 -1.4l-.6 -2.6M-5 -1.6l0 -2.8M-2 -1.6l.4 -2.8M1 -1.6l.6 -2.8M4 -1.5l.8 -2.6M-8 1.4l-.6 2.6M-5 1.6l0 2.8M-2 1.6l.4 2.8M1 1.6l.6 2.8M4 1.5l.8 2.6M8.6 -.6l2.8 -2.6M8.6 .6l2.8 2.6M-10.4 0l-2.4 -1.6M-10.4 0l-2.4 1.6"/>
    </g>
    <g stroke-width="0"><ellipse cx="-9" cy="0" rx="1.8" ry="1.4"/><ellipse cx="-6.5" cy="0" rx="1.7" ry="1.6"/><ellipse cx="-3.5" cy="0" rx="1.7" ry="1.6"/><ellipse cx="-.5" cy="0" rx="1.7" ry="1.6"/><ellipse cx="2.5" cy="0" rx="1.7" ry="1.6"/><ellipse cx="5.4" cy="0" rx="1.7" ry="1.5"/><ellipse cx="7.9" cy="0" rx="1.5" ry="1.4"/></g>
    </symbol>
    <symbol id="ll-springtail" overflow="visible">
    <g stroke-width=".9" stroke-linecap="round" fill="none"><path d="M4.4 -.6l3.6 -3M4.4 .6l3.6 3M-4.6 .4q-1.4 1.6 1 2.8M-4.6 -.4q-1.4 -1.6 1 -2.8"/></g>
    <g stroke-width="0"><ellipse cx="-.6" cy="0" rx="4.2" ry="1.7"/><circle cx="4" cy="0" r="1.4"/></g>
    </symbol>
    <symbol id="ll-gumleaf" overflow="visible"><path d="M-8 0 C-4 -3.2 3 -3.2 8 .6 C3 1.8 -4 2 -8 0Z"/></symbol>
  </defs>
  <!-- left: open, sunny oval edge -->
  <circle class="pl-sun" cx="38" cy="32" r="15"/>
  <g class="pl-ray" stroke-width="2.4" stroke-linecap="round"><path d="M58.0 32.0L64.0 32.0 M52.1 46.1L56.4 50.4 M38.0 52.0L38.0 58.0 M23.9 46.1L19.6 50.4 M18.0 32.0L12.0 32.0 M23.9 17.9L19.6 13.6 M38.0 12.0L38.0 6.0 M52.1 17.9L56.4 13.6"/></g>
  <!-- right: gum canopy -->
  <path class="pl-trunk" d="M300 92 C298 70 297 52 302 30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path class="pl-trunk" d="M300 52 C284 44 272 38 262 30" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path class="pl-trunk" d="M301 44 C314 38 324 32 332 22" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse class="pl-canopy" cx="290" cy="26" rx="56" ry="22"/>
  <g>
    <use href="#ll-gumleaf" class="ll-litter-c" transform="translate(295 9) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(305 9) rotate(75) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(318 9) rotate(75) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(281 10) rotate(95) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(272 12) rotate(75) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(261 12) rotate(85) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(252 15) rotate(20) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(337 16) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(243 17) rotate(105) scale(.8)"/>
    <use href="#ll-gumleaf" class="ll-litter-b" transform="translate(313 18) rotate(95) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(326 18) rotate(20) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(285 18) rotate(85) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(265 20) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="ll-litter-b" transform="translate(294 21) rotate(120) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(304 21) rotate(85) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(336 24) rotate(75) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(280 25) rotate(105) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(246 26) rotate(35) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(322 26) rotate(20) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(258 29) rotate(20) scale(.8)"/>
    <use href="#ll-gumleaf" class="ll-litter-c" transform="translate(271 29) rotate(105) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(310 30) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(287 33) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(335 34) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(319 34) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(297 34) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(246 37) rotate(75) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(258 38) rotate(-20) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(327 38) rotate(105) scale(.8)"/>
    <use href="#ll-gumleaf" class="ll-litter-b" transform="translate(271 39) rotate(105) scale(.8)"/>
    <use href="#ll-gumleaf" class="ll-litter-c" transform="translate(282 39) rotate(85) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(293 41) rotate(20) scale(.8)"/>
    <use href="#ll-gumleaf" class="ll-litter-c" transform="translate(312 41) rotate(60) scale(.8)"/>
    <use href="#ll-gumleaf" class="pl-leaf" transform="translate(303 44) rotate(120) scale(.8)"/>
  </g>
  <!-- ground -->
  <rect class="ll-soil" x="0" y="92" width="350" height="98"/>
  <path class="ll-ground" d="M0 92H350" stroke-width="2"/>
  <!-- mown grass, short and even -->
  <g class="ll-grass" stroke-width="1.6" stroke-linecap="round">
    <path d="M6 92v-5M14 92v-6M22 92v-5M30 92v-6M38 92v-5M46 92v-6M118 92v-5M126 92v-6M134 92v-5M142 92v-6M150 92v-5M158 92v-6M166 92v-5"/>
  </g>
  <!-- ants trailing towards the cup -->
  <use href="#ll-ant" class="ll-ant" transform="translate(12 85) scale(1.15)"/>
  <use href="#ll-ant" class="ll-ant" transform="translate(30 84) scale(1.15)"/>
  <use href="#ll-ant" class="ll-ant" transform="translate(140 85) rotate(180) scale(1.15)"/>
  <use href="#ll-ant" class="ll-ant" transform="translate(160 84) rotate(180) scale(1.15)"/>
  <!-- left cup: crowded, one kind -->
  <path class="ll-cup" d="M52 92 H116 L108 178 H60 Z" stroke-width="2.2"/>
  <g>
    <use href="#ll-ant" class="ll-ant" transform="translate(68 106) rotate(20) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(96 104) rotate(160) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(82 118) rotate(-30) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(102 122) rotate(-80) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(68 130) rotate(80) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(92 136) rotate(200) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(76 148) rotate(10) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(98 152) rotate(130) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(70 164) rotate(-120) scale(1.2)"/>
    <use href="#ll-ant" class="ll-ant" transform="translate(92 168) rotate(0) scale(1.2)"/>
  </g>
  <!-- the two sites are different places -->
  <path d="M182 60V186" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="3 5"/>
  <!-- leaf litter: a thick layer either side of the cup -->
  <g>
    <use href="#ll-gumleaf" class="ll-litter-a" transform="translate(196 90) rotate(-8)"/>
    <use href="#ll-gumleaf" class="ll-litter-c" transform="translate(210 88) rotate(14)"/>
    <use href="#ll-gumleaf" class="ll-litter-b" transform="translate(224 90) rotate(-4)"/>
    <use href="#ll-gumleaf" class="ll-litter-a" transform="translate(206 84) rotate(30)"/>
    <use href="#ll-gumleaf" class="ll-litter-b" transform="translate(194 84) rotate(-24)"/>
    <use href="#ll-gumleaf" class="ll-litter-c" transform="translate(300 88) rotate(-12)"/>
    <use href="#ll-gumleaf" class="ll-litter-b" transform="translate(314 90) rotate(6)"/>
    <use href="#ll-gumleaf" class="ll-litter-a" transform="translate(328 88) rotate(-20)"/>
    <use href="#ll-gumleaf" class="ll-litter-c" transform="translate(342 90) rotate(10)"/>
    <use href="#ll-gumleaf" class="ll-litter-b" transform="translate(320 83) rotate(26)"/>
    <use href="#ll-gumleaf" class="ll-litter-a" transform="translate(336 82) rotate(-30)"/>
  </g>
  <!-- right cup: fewer animals, one of each kind -->
  <path class="ll-cup" d="M232 92 H296 L288 178 H240 Z" stroke-width="2.2"/>
  <use href="#ll-beetle" class="ll-beetle" transform="translate(250 110) rotate(-20) scale(1.25)"/>
  <use href="#ll-springtail" class="ll-springtail" transform="translate(278 106) rotate(150) scale(1.35)"/>
  <use href="#ll-slater" class="ll-slater" transform="translate(276 132) rotate(30) scale(1.25)"/>
  <use href="#ll-ant" class="ll-ant" transform="translate(250 134) rotate(60) scale(1.2)"/>
  <use href="#ll-spider" class="ll-spider" transform="translate(258 154) rotate(-10) scale(1.2)"/>
  <use href="#ll-centipede" class="ll-centipede" transform="translate(264 170) rotate(4) scale(1.15)"/>
</svg>`,
  "5e-2-cells": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A microscope beside four round specimen views, like plates in a field guide: a seed, a mushroom, a pinch of dried yeast and a salt crystal, each shown whole and close up" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="cl-sp-seed" overflow="visible">
      <ellipse class="pv-seed" cx="0" cy="0" rx="14" ry="9" transform="rotate(-12)"/>
      <path class="pv-seed-line" d="M-9 2 Q0 -3 9 -2" stroke-width="1.6" fill="none" stroke-linecap="round" transform="rotate(-12)"/>
      <ellipse cx="7" cy="-2" rx="2.4" ry="1.4" class="pv-cap" transform="rotate(-12)"/>
    </symbol>
    <symbol id="cl-sp-mushroom" overflow="visible">
      <path class="pv-stem" d="M-5 -2 C-5 6 -6 12 -7 16 H7 C6 12 5 6 5 -2Z" stroke-width="1.4"/>
      <path class="pv-cap" d="M-17 -1 C-16 -16 16 -16 17 -1 C10 -4 -10 -4 -17 -1Z"/>
      <g class="pv-gill" stroke-width=".9"><path d="M-12 -2l2 2M-6 -3l1 2M0 -3v2M6 -3l-1 2M12 -2l-2 2"/></g>
    </symbol>
    <symbol id="cl-sp-yeast" overflow="visible">
      <g class="pv-yeast"><ellipse cx="0" cy="6" rx="16" ry="4"/></g>
      <g class="pv-yeast pv-yeast-s" stroke-width=".7">
        <circle cx="-10" cy="3" r="2.6"/><circle cx="-5" cy="1" r="2.8"/><circle cx="0" cy="-1" r="2.9"/><circle cx="5" cy="1" r="2.8"/><circle cx="10" cy="3" r="2.6"/>
        <circle cx="-7" cy="-3" r="2.6"/><circle cx="-1" cy="-5" r="2.7"/><circle cx="5" cy="-3" r="2.6"/><circle cx="2" cy="-8" r="2.5"/><circle cx="-3" cy="-9" r="2.3"/>
      </g>
    </symbol>
    <symbol id="cl-sp-crystal" overflow="visible">
      <path class="pv-crystal-a" d="M0 -14 L13 -7 L0 0 L-13 -7Z" stroke-width="1.4" stroke-linejoin="round"/>
      <path class="pv-crystal-b" d="M-13 -7 L0 0 L0 14 L-13 7Z" stroke-width="1.4" stroke-linejoin="round"/>
      <path class="pv-crystal-a" d="M13 -7 L0 0 L0 14 L13 7Z" stroke-width="1.4" stroke-linejoin="round"/>
    </symbol>
    <symbol id="cl-eq-scope" overflow="visible">
      <path class="pv-metal" d="M-30 0 H18 Q22 0 22 -4 V-8 H-30Z"/>
      <path class="pv-dark" d="M-22 -8 C-22 -40 -16 -76 0 -98 L4 -88 C-6 -70 -10 -40 -8 -8Z"/>
      <rect class="pv-metal" x="-12" y="-42" width="34" height="5" rx="1.5"/>
      <rect class="pv-crystal-a" x="2" y="-46" width="16" height="4" rx=".8" stroke-width="1"/>
      <!-- upright barrel over the stage: eyepiece, tube, nosepiece, objective pointing down at the slide -->
      <rect class="pv-metal" x="4" y="-118" width="12" height="10" rx="2"/>
      <rect class="pv-dark" x="2" y="-108" width="16" height="44" rx="2.5"/>
      <rect class="pv-metal" x="0" y="-66" width="20" height="6" rx="2"/>
      <rect class="pv-metal" x="6" y="-60" width="8" height="10" rx="1.5"/>
      <circle class="pv-metal" cx="-15" cy="-30" r="5"/>
    </symbol>
  </defs>
  <rect class="pv-bench" x="0" y="160" width="350" height="30"/><path class="pv-bench-edge" d="M0 160H350" stroke-width="2"/>
  <use href="#cl-eq-scope" transform="translate(62 160)"/>
  <!-- four specimen roundels -->
  <g>
    <circle cx="150" cy="62" r="30" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2.5"/>
    <use href="#cl-sp-seed" transform="translate(150 62) scale(1.5)"/>
    <circle cx="226" cy="62" r="30" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2.5"/>
    <use href="#cl-sp-mushroom" transform="translate(226 62) scale(1.3)"/>
    <circle cx="150" cy="128" r="30" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2.5"/>
    <use href="#cl-sp-yeast" transform="translate(150 130) scale(1.4)"/>
    <circle cx="226" cy="128" r="30" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2.5"/>
    <use href="#cl-sp-crystal" transform="translate(226 128) scale(1.45)"/>
  </g>
  <!-- empty field of view, waiting for a slide -->
  <circle cx="306" cy="95" r="34" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="5"/>
  <circle cx="306" cy="95" r="27" fill="none" stroke="var(--plate-rim)" stroke-opacity=".25" stroke-width="1.5" stroke-dasharray="2 4"/>
  <path d="M297 95h18M306 86v18" stroke="var(--plate-rim)" stroke-opacity=".4" stroke-width="1.2"/>
</svg>`,
  "poe-1-yeast": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="Three conical flasks with limp balloons over their necks: the first holds yeast and sugar, the second yeast only, the third sugar only. Beside them, a stopwatch, a length of string and a ruler wait for the measurements" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="ye-eq-flask" overflow="visible">
      <path class="pv-glass" d="M-6 -62 V-40 L-22 -4 Q-23 0 -19 0 H19 Q23 0 22 -4 L6 -40 V-62" stroke-width="2" stroke-linejoin="round"/>
      <path class="pv-water" d="M-15.6 -18 H15.6 L21 -4 Q22 -1 19 -1 H-19 Q-22 -1 -21 -4Z"/>
      <path class="pv-dark-s" d="M-8 -62 H8" stroke-width="2.4" stroke-linecap="round"/>
    </symbol>
    <symbol id="ye-eq-balloon" overflow="visible">
      <path d="M-7.5 0 V-6 C-8 -12 -4 -16 2 -17 C9 -18 13 -13 10 -9 C7 -5 3 -6 2 -9 C1 -6 6 -3 7.5 -6 V0Z"/>
      <path d="M-7.5 -1.5 H7.5" stroke="var(--plate-rim)" stroke-width="1.6"/>
    </symbol>
    <symbol id="ye-eq-cube" overflow="visible"><rect class="pv-sugar" x="-3.2" y="-3.2" width="6.4" height="6.4" rx=".8" stroke-width="1"/></symbol>
    <symbol id="ye-eq-grains" overflow="visible"><g class="pv-yeast pv-yeast-s" stroke-width=".5"><circle cx="-4" cy="0" r="1.6"/><circle cx="0" cy="-1" r="1.7"/><circle cx="4" cy="0" r="1.6"/><circle cx="-2" cy="-3" r="1.5"/><circle cx="2" cy="-3.6" r="1.5"/></g></symbol>
  </defs>
  <rect class="pv-bench" x="0" y="160" width="350" height="30"/><path class="pv-bench-edge" d="M0 160H350" stroke-width="2"/>
  <g transform="translate(62 158)">
    <use href="#ye-eq-flask"/>
    <use href="#ye-eq-grains" transform="translate(-6 -8)"/><use href="#ye-eq-grains" transform="translate(7 -6)"/>
    <use href="#ye-eq-cube" transform="translate(-12 -5) rotate(12)"/><use href="#ye-eq-cube" transform="translate(13 -12) rotate(-18)"/>
    <use href="#ye-eq-balloon" class="pv-balloon-a" transform="translate(0 -62)"/>
  </g>
  <g transform="translate(126 158)">
    <use href="#ye-eq-flask"/>
    <use href="#ye-eq-grains" transform="translate(-6 -7)"/><use href="#ye-eq-grains" transform="translate(7 -6)"/><use href="#ye-eq-grains" transform="translate(0 -12)"/>
    <use href="#ye-eq-balloon" class="pv-balloon-b" transform="translate(0 -62)"/>
  </g>
  <g transform="translate(190 158)">
    <use href="#ye-eq-flask"/>
    <use href="#ye-eq-cube" transform="translate(-9 -6) rotate(10)"/><use href="#ye-eq-cube" transform="translate(4 -5) rotate(-14)"/><use href="#ye-eq-cube" transform="translate(12 -12) rotate(22)"/>
    <use href="#ye-eq-balloon" class="pv-balloon-c" transform="translate(0 -62)"/>
  </g>
  <!-- stopwatch: no numbers, the hand just started -->
  <g transform="translate(286 70)">
    <rect class="pv-dark" x="-5" y="-42" width="10" height="9" rx="2"/>
    <rect class="pv-dark" x="18" y="-34" width="8" height="6" rx="1.5" transform="rotate(40 22 -31)"/>
    <circle r="34" class="pv-face" stroke-width="5"/>
    <g stroke="var(--plate-rim)" stroke-width="2" stroke-linecap="round"><path d="M0 -27V-22M27 0H22M0 27V22M-27 0H-22"/></g>
    <g stroke="var(--plate-rim)" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"><path d="M13.5 -23.4L11 -19M23.4 -13.5L19 -11M23.4 13.5L19 11M13.5 23.4L11 19M-13.5 23.4L-11 19M-23.4 13.5L-19 11M-23.4 -13.5L-19 -11M-13.5 -23.4L-11 -19"/></g>
    <path d="M0 0 L7 -20" stroke="var(--plate-rust)" stroke-width="2.6" stroke-linecap="round"/>
    <circle r="3" class="pv-dark"/>
  </g>
  <!-- string and ruler, ticks only -->
  <g transform="translate(250 150)">
    <rect class="pv-ruler" x="0" y="0" width="86" height="12" rx="2" stroke-width="1.2"/>
    <g stroke="var(--plate-ray)" stroke-width="1.1"><path d="M8 0v5M16 0v3M24 0v5M32 0v3M40 0v6M48 0v3M56 0v5M64 0v3M72 0v5M80 0v3"/></g>
  </g>
  <path class="pv-string" d="M240 158 C226 150 236 136 252 138 C266 140 270 128 258 122" fill="none" stroke-width="1.6" stroke-linecap="round"/>
</svg>`,
  "poe-2-hands": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A UV torch shining on two open hands, with fluorescent lotion glowing evenly all over them. On the bench wait the four ways to remove it: a running tap over a basin, a soap pump, a bottle of hand sanitiser and a roll of paper towel" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- an open hand, palm up, wrist at 0,0 -->
    <symbol id="ha-hand" overflow="visible">
      <rect x="-15" y="-34" width="30" height="36" rx="7"/>
      <rect x="-15" y="-57" width="7" height="30" rx="3.5"/>
      <rect x="-6.5" y="-62" width="7" height="35" rx="3.5"/>
      <rect x="2" y="-60" width="7" height="33" rx="3.5"/>
      <rect x="10.2" y="-52" width="6.5" height="25" rx="3.2"/>
      <rect x="-9" y="-30" width="7.5" height="24" rx="3.7" transform="rotate(-52 -12 -12)"/>
    </symbol>
    <!-- lotion: glowing spots across palm and fingers -->
    <symbol id="ha-lotion" overflow="visible">
      <g class="pv-halo"><circle cx="-6" cy="-20" r="6"/><circle cx="6" cy="-14" r="6"/><circle cx="2" cy="-28" r="5"/><circle cx="-11" cy="-46" r="3.6"/><circle cx="-3" cy="-52" r="3.6"/><circle cx="5.5" cy="-48" r="3.6"/><circle cx="13.5" cy="-40" r="3.4"/><circle cx="-21" cy="-24" r="3.4"/><circle cx="-8" cy="-6" r="4.5"/><circle cx="9" cy="-26" r="4"/></g>
      <g class="pv-glow"><circle cx="-6" cy="-20" r="2.6"/><circle cx="6" cy="-14" r="2.6"/><circle cx="2" cy="-28" r="2.2"/><circle cx="-11" cy="-46" r="1.7"/><circle cx="-3" cy="-52" r="1.7"/><circle cx="5.5" cy="-48" r="1.7"/><circle cx="13.5" cy="-40" r="1.6"/><circle cx="-21" cy="-24" r="1.6"/><circle cx="-8" cy="-6" r="2"/><circle cx="9" cy="-26" r="1.8"/></g>
    </symbol>
  </defs>
  <rect class="pv-bench" x="0" y="160" width="350" height="30"/><path class="pv-bench-edge" d="M0 160H350" stroke-width="2"/>
  <!-- UV torch and its beam -->
  <path class="pv-uv" fill-opacity=".16" d="M48 40 L18 150 H170 L72 30Z"/>
  <g transform="translate(60 32) rotate(-20)">
    <rect class="pv-dark" x="-10" y="-34" width="20" height="38" rx="4"/>
    <rect class="pv-metal" x="-13" y="2" width="26" height="9" rx="2.5"/>
    <rect class="pv-uv" x="-11" y="10" width="22" height="3.5" rx="1.5"/>
    <rect class="pv-metal" x="-4" y="-26" width="8" height="5" rx="1.5"/>
  </g>
  <!-- two hands, lotion glowing evenly over both -->
  <g transform="translate(70 150) rotate(-8)">
    <use href="#ha-hand" class="pv-skin-o" stroke-width="3.4" stroke-linejoin="round"/><use href="#ha-hand" class="pv-skin"/>
    <use href="#ha-lotion"/>
  </g>
  <g transform="translate(130 150) rotate(8) scale(-1 1)">
    <use href="#ha-hand" class="pv-skin-o" stroke-width="3.4" stroke-linejoin="round"/><use href="#ha-hand" class="pv-skin"/>
    <use href="#ha-lotion"/>
  </g>
  <!-- the four methods, waiting on the bench -->
  <!-- 1 running tap over a basin -->
  <g transform="translate(206 160)">
    <path class="pv-glass" d="M-22 -16 H22 L18 -2 Q17 0 14 0 H-14 Q-17 0 -18 -2Z" stroke-width="2"/>
    <rect class="pv-metal" x="-16" y="-80" width="7" height="64" rx="2"/>
    <path class="pv-metal" d="M-16 -82 H4 Q12 -82 12 -74 V-66 H5 V-72 Q5 -75 2 -75 H-16Z"/>
    <rect class="pv-dark" x="-20" y="-88" width="15" height="6" rx="2"/>
    <path class="pv-drop" d="M8.5 -58 c-2.6 4.4 -4 6.6 0 8 c4 -1.4 2.6 -3.6 0 -8z"/>
    <path class="pv-drop" d="M8.5 -44 c-2.6 4.4 -4 6.6 0 8 c4 -1.4 2.6 -3.6 0 -8z"/>
    <path class="pv-drop" d="M8.5 -30 c-2.6 4.4 -4 6.6 0 8 c4 -1.4 2.6 -3.6 0 -8z"/>
    <path class="pv-water" d="M-17 -12 H17 L15 -5 H-15Z"/>
  </g>
  <!-- 2 soap pump -->
  <g transform="translate(252 160)">
    <rect class="pv-soap" x="-13" y="-46" width="26" height="46" rx="6"/>
    <rect class="pv-dark" x="-5" y="-54" width="10" height="9" rx="2"/>
    <path class="pv-dark" d="M-3 -54 V-62 H14 V-58 H3 V-54Z"/>
    <ellipse cx="0" cy="-26" rx="7" ry="9" fill="var(--surface)" fill-opacity=".55"/>
  </g>
  <!-- 3 hand sanitiser: clear gel, flip cap -->
  <g transform="translate(290 160)">
    <rect class="pv-gel" x="-11" y="-40" width="22" height="40" rx="5" stroke-width="2"/>
    <rect class="pv-water" x="-9" y="-26" width="18" height="24" rx="3"/>
    <rect class="pv-dark" x="-8" y="-48" width="16" height="9" rx="2.5"/>
    <path class="pv-dark" d="M-8 -48 L-12 -55 L-2 -55 L0 -48Z"/>
  </g>
  <!-- 4 paper towel: a horizontal roll on its stand, a sheet hanging down -->
  <g transform="translate(326 160)">
    <rect class="pv-metal" x="-2" y="-70" width="4" height="70" rx="1.5"/>
    <rect class="pv-metal" x="-15" y="-3" width="30" height="5" rx="2"/>
    <rect class="pv-towel" x="-16" y="-70" width="32" height="20" rx="10" stroke-width="2"/>
    <ellipse class="pv-towel" cx="12" cy="-60" rx="4" ry="9" stroke-width="1.6"/>
    <circle cx="12" cy="-60" r="2.4" class="pv-metal"/>
    <path class="pv-towel" d="M-14 -55 H8 V-20 Q-3 -16 -14 -20Z" stroke-width="2"/>
    <path d="M-14 -38 H8" stroke="var(--plate-rim)" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="2 2"/>
  </g>
</svg>`,
  "5e-3-outbreak": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A web of students linked by the exchanges in the outbreak simulation. A third of them wear a shield badge: they are vaccinated" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="ob-person" overflow="visible"><circle cx="0" cy="-30" r="7"/><path d="M-12 0 V-11 Q-12 -21 0 -21 Q12 -21 12 -11 V0Z"/></symbol>
    <symbol id="ob-shield" overflow="visible"><path class="pv-shield" d="M0 -7 L6 -5 V0 Q6 5 0 8 Q-6 5 -6 0 V-5Z"/></symbol>
  </defs>
  <!-- links between exchange partners -->
  <g stroke="var(--plate-grey)" stroke-opacity=".55" stroke-width="1.6" fill="none">
    <path d="M40 62 L100 46 L162 70 L226 44 L290 66"/><path d="M40 62 L70 120 L130 132 L162 70 L196 124 L256 128 L290 66"/>
    <path d="M100 46 L130 132M226 44 L196 124M70 120 L40 168M130 132 L104 172M196 124 L170 174M256 128 L236 174M256 128 L316 160M290 66 L316 160"/>
  </g>
  <!-- students: outlines, a shield badge on a third -->
  <g>
    <g transform="translate(40 80)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(100 64)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/><use href="#ob-shield" transform="translate(5 -9)"/></g>
    <g transform="translate(162 88)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(226 62)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(290 84)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/><use href="#ob-shield" transform="translate(5 -9)"/></g>
    <g transform="translate(70 138)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(130 150)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/><use href="#ob-shield" transform="translate(5 -9)"/></g>
    <g transform="translate(196 142)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(256 146)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/><use href="#ob-shield" transform="translate(5 -9)"/></g>
    <g transform="translate(40 186) scale(.85)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(104 188) scale(.85)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(170 188) scale(.85)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(236 188) scale(.85)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/></g>
    <g transform="translate(316 178) scale(.85)"><use href="#ob-person" class="pv-skin-o" stroke-width="3"/><use href="#ob-person" class="pv-skin"/><use href="#ob-shield" transform="translate(5 -9)"/></g>
  </g>
</svg>`,
  "5e-4-labels": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A ring binder opened at its first divider, whose new coloured tab sits on the outer edge of the left-hand page. The tabs of four more dividers, one in each 5E phase colour, peek out from the pages beneath, and every page holds the same lecture worksheet. Beside it, a sheet of spare coloured tabs" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="lb-lecture" overflow="visible">
      <rect class="pv-board" x="-16" y="-24" width="32" height="20" rx="2" stroke-width="1.6"/>
      <path class="pv-line" d="M-11 -18 H11M-11 -13 H7M-11 -8 H9" stroke-width="1.6"/>
      <path d="M0 -4 V4 M-6 6 H6" stroke="var(--plate-grey)" stroke-width="1.6" stroke-linecap="round"/>
    </symbol>
  </defs>
  <rect class="pv-bench" x="0" y="164" width="350" height="26"/><path class="pv-bench-edge" d="M0 164H350" stroke-width="2"/>
  <!-- binder cover and pages -->
  <rect x="34" y="20" width="200" height="140" rx="6" fill="var(--plate-tub)"/>
  <rect class="pv-paper" x="44" y="26" width="88" height="128" rx="3" stroke-width="1.6"/>
  <!-- the turned page is the Engage divider: its tab now sits on the left-hand page's outer edge -->
  <path class="pv-ph-engage" d="M45 30 H26 Q22 30 22 34 V46 Q22 50 26 50 H45Z"/>
  <!-- pages stacked under the right-hand page, with their dividers' tabs peeking out -->
  <rect class="pv-paper" x="140" y="30" width="88" height="128" rx="3" stroke-width="1.2"/>
  <rect class="pv-paper" x="138" y="28" width="88" height="128" rx="3" stroke-width="1.2"/>
  <rect class="pv-ph-explore" x="228" y="58" width="20" height="18" rx="3"/><rect class="pv-ph-explain" x="228" y="82" width="20" height="18" rx="3"/><rect class="pv-ph-elaborate" x="228" y="106" width="20" height="18" rx="3"/><rect class="pv-ph-evaluate" x="228" y="130" width="20" height="18" rx="3"/>
  <rect class="pv-paper" x="136" y="26" width="88" height="128" rx="3" stroke-width="1.6"/>
  <path d="M136 30 Q132 90 136 150" stroke="var(--plate-rim)" stroke-opacity=".25" stroke-width="3" fill="none"/>
  <g fill="var(--plate-grey)"><circle cx="134" cy="52" r="4"/><circle cx="134" cy="90" r="4"/><circle cx="134" cy="128" r="4"/></g>
  <use href="#lb-lecture" transform="translate(88 82) scale(1.5)"/><path class="pv-line" d="M58 108H118M58 118H110M58 128H114M58 138H104" stroke-width="1.8"/>
  <use href="#lb-lecture" transform="translate(180 82) scale(1.5)"/><path class="pv-line" d="M150 108H210M150 118H202M150 128H206M150 138H196" stroke-width="1.8"/>
  <!-- the new tabs -->
  <!-- a sheet of spare tabs -->
  <g transform="translate(296 104) rotate(8)">
    <rect class="pv-paper" x="-32" y="-44" width="64" height="88" rx="4" stroke-width="1.8"/>
    <rect class="pv-ph-engage" x="-22" y="-34" width="18" height="12" rx="2.5"/><rect class="pv-ph-explore" x="4" y="-34" width="18" height="12" rx="2.5"/>
    <rect class="pv-ph-explain" x="-22" y="-14" width="18" height="12" rx="2.5"/><rect class="pv-ph-elaborate" x="4" y="-14" width="18" height="12" rx="2.5"/>
    <rect class="pv-ph-evaluate" x="-22" y="6" width="18" height="12" rx="2.5"/><rect class="pv-ph-engage" x="4" y="6" width="18" height="12" rx="2.5"/>
    <rect class="pv-ph-explore" x="-22" y="26" width="18" height="12" rx="2.5"/><rect x="4" y="26" width="18" height="12" rx="2.5" fill="none" stroke="var(--plate-grey)" stroke-dasharray="2 2"/>
  </g>
</svg>`,
  "5e-5-build": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A planning board with five columns, one in each 5E phase colour. A few activity cards are already placed, one card is on its way into a column, and a seedling in a pot sits beside the board" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="bd-seedling" overflow="visible">
      <path class="pv-pot" d="M-12 -18 H12 L9 0 H-9Z"/><rect class="pv-pot" x="-14" y="-21" width="28" height="5" rx="1.5"/>
      <path class="pv-soil" d="M-12 -20 H12 V-18 H-12Z"/>
      <path d="M0 -20 V-40" stroke="var(--plate-leaf)" stroke-width="2.2" stroke-linecap="round"/>
      <path class="pv-leaf" d="M0 -36 C-4 -46 -16 -46 -18 -40 C-12 -34 -4 -34 0 -36Z"/><path class="pv-leaf" d="M0 -40 C4 -50 16 -50 18 -44 C12 -38 4 -38 0 -40Z"/>
    </symbol>
  </defs>
  <rect class="pv-bench" x="0" y="170" width="350" height="20"/><path class="pv-bench-edge" d="M0 170H350" stroke-width="2"/>
  <rect class="pv-board" x="14" y="14" width="270" height="152" rx="8" stroke-width="2"/>
  <g stroke-width="2.4" fill="none">
    <rect class="pv-ph-engage-s" x="24" y="26" width="46" height="130" rx="6"/><rect class="pv-ph-explore-s" x="76" y="26" width="46" height="130" rx="6"/><rect class="pv-ph-explain-s" x="128" y="26" width="46" height="130" rx="6"/><rect class="pv-ph-elaborate-s" x="180" y="26" width="46" height="130" rx="6"/><rect class="pv-ph-evaluate-s" x="232" y="26" width="46" height="130" rx="6"/>
  </g>
  <g><rect class="pv-ph-engage" x="24" y="26" width="46" height="9" rx="3"/><rect class="pv-ph-explore" x="76" y="26" width="46" height="9" rx="3"/><rect class="pv-ph-explain" x="128" y="26" width="46" height="9" rx="3"/><rect class="pv-ph-elaborate" x="180" y="26" width="46" height="9" rx="3"/><rect class="pv-ph-evaluate" x="232" y="26" width="46" height="9" rx="3"/></g>
  <!-- placed cards -->
  <g>
    <rect class="pv-card" x="29" y="44" width="36" height="26" rx="3" stroke-width="1.6"/><path class="pv-line" d="M34 52H60M34 58H54M34 64H57" stroke-width="1.4"/>
    <rect class="pv-card" x="81" y="44" width="36" height="26" rx="3" stroke-width="1.6"/><path class="pv-line" d="M86 52H112M86 58H106M86 64H109" stroke-width="1.4"/>
    <rect class="pv-card" x="81" y="76" width="36" height="26" rx="3" stroke-width="1.6"/><path class="pv-line" d="M86 84H112M86 90H104M86 96H110" stroke-width="1.4"/>
    <rect class="pv-card" x="237" y="44" width="36" height="26" rx="3" stroke-width="1.6"/><path class="pv-line" d="M242 52H268M242 58H262M242 64H265" stroke-width="1.4"/>
  </g>
  <!-- an empty slot, and a card on its way in -->
  <rect x="133" y="44" width="36" height="26" rx="3" fill="none" stroke="var(--plate-grey)" stroke-dasharray="3 3" stroke-width="1.6"/>
  <g transform="translate(160 18) rotate(10)"><rect class="pv-card" x="-18" y="-13" width="36" height="26" rx="3" stroke-width="2"/><path class="pv-line" d="M-13 -5H13M-13 1H7M-13 7H10" stroke-width="1.4"/></g>
  <path d="M152 36 Q150 40 151 44" stroke="var(--plate-grey)" stroke-width="1.6" fill="none" stroke-dasharray="2 3"/>
  <use href="#bd-seedling" transform="translate(318 170) scale(1.25)"/>
</svg>`,
  "5e-6-prac-day": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A Year 7 classroom on placement day: a teacher beside a thinking wall covered in sticky notes, and students at desks, one with a microscope" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="pd-person" overflow="visible"><circle cx="0" cy="-30" r="7"/><path d="M-12 0 V-11 Q-12 -21 0 -21 Q12 -21 12 -11 V0Z"/></symbol>
    <symbol id="pd-scope" overflow="visible">
      <path class="pv-metal" d="M-14 0 H10 V-4 H-14Z"/><path class="pv-dark" d="M-10 -4 C-10 -20 -7 -36 0 -46 L2 -42 C-3 -34 -5 -20 -4 -4Z"/>
      <rect class="pv-metal" x="-6" y="-21" width="18" height="3" rx="1"/><rect class="pv-dark" x="2" y="-54" width="8" height="22" rx="1.5"/><rect class="pv-metal" x="4" y="-32" width="4" height="6" rx="1"/><rect class="pv-metal" x="3" y="-59" width="6" height="5" rx="1"/>
    </symbol>
  </defs>
  <!-- thinking wall -->
  <rect class="pv-board" x="88" y="12" width="174" height="74" rx="5" stroke-width="2"/>
  <g>
    <rect class="pv-ph-engage" x="100" y="22" width="18" height="16" rx="2" transform="rotate(-4 109 30)"/><rect class="pv-ph-explore" x="126" y="24" width="18" height="16" rx="2"/><rect fill="var(--plate-sun)" x="152" y="20" width="18" height="16" rx="2" transform="rotate(5 161 28)"/>
    <rect class="pv-ph-explain" x="178" y="24" width="18" height="16" rx="2"/><rect class="pv-ph-evaluate" x="204" y="22" width="18" height="16" rx="2" transform="rotate(-6 213 30)"/><rect fill="var(--plate-sun)" x="230" y="26" width="18" height="16" rx="2"/>
    <rect fill="var(--plate-sun)" x="112" y="50" width="18" height="16" rx="2" transform="rotate(6 121 58)"/><rect class="pv-ph-explore" x="140" y="52" width="18" height="16" rx="2"/><rect class="pv-ph-engage" x="168" y="50" width="18" height="16" rx="2" transform="rotate(-5 177 58)"/><rect fill="var(--plate-sun)" x="196" y="54" width="18" height="16" rx="2"/>
  </g>
  <!-- teacher -->
  <g transform="translate(286 110) scale(1.35)"><use href="#pd-person" class="pv-skin-o" stroke-width="3"/><use href="#pd-person" class="pv-skin"/></g>
  <!-- desks and students -->
  <g>
    <g transform="translate(60 158)"><use href="#pd-person" class="pv-skin-o" stroke-width="3"/><use href="#pd-person" class="pv-skin"/></g>
    <g transform="translate(140 158)"><use href="#pd-person" class="pv-skin-o" stroke-width="3"/><use href="#pd-person" class="pv-skin"/></g>
    <g transform="translate(220 158)"><use href="#pd-person" class="pv-skin-o" stroke-width="3"/><use href="#pd-person" class="pv-skin"/></g>
    <rect class="pv-desk" x="24" y="156" width="232" height="12" rx="3" stroke-width="1.6"/>
    <rect class="pv-desk" x="34" y="168" width="8" height="20" rx="2" stroke-width="1.2"/><rect class="pv-desk" x="238" y="168" width="8" height="20" rx="2" stroke-width="1.2"/>
    <use href="#pd-scope" transform="translate(178 156)"/>
    <rect class="pv-paper" x="80" y="146" width="22" height="10" rx="1.5" stroke-width="1.2"/>
  </g>
</svg>`,
  "adi-2-noise": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A small speaker playing a tone inside a box lined with a soft material, sound waves spreading out from it, and a phone with a blank sound-meter screen standing outside the box" xmlns="http://www.w3.org/2000/svg"><rect class="pv-bench" x="0" y="160" width="350" height="30"/><path class="pv-bench-edge" d="M0 160H350" stroke-width="2"/><rect x="60" y="62" width="120" height="98" rx="4" fill="var(--plate-canopy)" stroke="var(--plate-rim)" stroke-width="2.4"/><rect x="66" y="68" width="108" height="92" rx="2" fill="var(--plate-sun)" opacity=".55"/><circle cx="70" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="78" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="86" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="94" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="102" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="110" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="118" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="126" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="134" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="142" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="150" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="158" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="166" cy="73" r="1.6" fill="var(--plate-ray)"/><circle cx="74" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="82" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="90" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="98" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="106" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="114" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="122" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="130" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="138" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="146" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="154" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="162" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="170" cy="81" r="1.6" fill="var(--plate-ray)"/><circle cx="70" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="78" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="86" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="94" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="102" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="110" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="118" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="126" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="134" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="142" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="150" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="158" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="166" cy="89" r="1.6" fill="var(--plate-ray)"/><circle cx="74" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="82" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="90" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="98" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="106" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="114" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="122" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="130" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="138" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="146" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="154" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="162" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="170" cy="97" r="1.6" fill="var(--plate-ray)"/><circle cx="70" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="78" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="86" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="94" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="102" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="110" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="118" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="126" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="134" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="142" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="150" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="158" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="166" cy="105" r="1.6" fill="var(--plate-ray)"/><circle cx="74" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="82" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="90" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="98" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="106" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="114" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="122" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="130" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="138" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="146" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="154" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="162" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="170" cy="113" r="1.6" fill="var(--plate-ray)"/><circle cx="70" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="78" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="86" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="94" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="102" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="110" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="118" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="126" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="134" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="142" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="150" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="158" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="166" cy="121" r="1.6" fill="var(--plate-ray)"/><circle cx="74" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="82" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="90" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="98" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="106" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="114" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="122" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="130" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="138" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="146" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="154" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="162" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="170" cy="129" r="1.6" fill="var(--plate-ray)"/><circle cx="70" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="78" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="86" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="94" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="102" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="110" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="118" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="126" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="134" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="142" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="150" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="158" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="166" cy="137" r="1.6" fill="var(--plate-ray)"/><circle cx="74" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="82" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="90" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="98" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="106" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="114" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="122" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="130" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="138" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="146" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="154" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="162" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="170" cy="145" r="1.6" fill="var(--plate-ray)"/><circle cx="70" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="78" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="86" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="94" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="102" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="110" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="118" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="126" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="134" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="142" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="150" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="158" cy="153" r="1.6" fill="var(--plate-ray)"/><circle cx="166" cy="153" r="1.6" fill="var(--plate-ray)"/><rect x="78" y="80" width="84" height="80" rx="2" fill="var(--surface)"/><g transform="translate(104 160) scale(1.3)"><rect class="pv-dark" x="-12" y="-30" width="24" height="30" rx="3"/><circle cx="0" cy="-11" r="7" fill="var(--plate-grey)"/><circle cx="0" cy="-11" r="2.6" class="pv-dark"/><circle cx="0" cy="-24" r="2.6" fill="var(--plate-grey)"/></g><path d="M115.9 135.3 A16 16 0 0 1 115.9 156.7" stroke="var(--plate-tub)" stroke-opacity="1" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M123.3 128.6 A26 26 0 0 1 123.3 163.4" stroke="var(--plate-tub)" stroke-opacity="0.7" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M130.8 121.9 A36 36 0 0 1 130.8 170.1" stroke="var(--plate-tub)" stroke-opacity="0.45" stroke-width="2.2" fill="none" stroke-linecap="round"/><g transform="translate(236 160)"><rect class="pv-dark" x="-10" y="-34" width="20" height="34" rx="4"/><rect class="pv-paper" x="-7.5" y="-30" width="15" height="24" rx="1.5" stroke-width="0"/><circle cx="0" cy="-3" r="1.6" fill="var(--plate-grey)"/></g><path d="M229.7 133.6 A10 10 0 0 1 229.7 146.4" stroke="var(--plate-tub)" stroke-opacity="0.35" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M235.8 128.4 A18 18 0 0 1 235.8 151.6" stroke="var(--plate-tub)" stroke-opacity="0.2" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M182 112 H210" stroke="var(--plate-grey)" stroke-dasharray="3 4" stroke-width="1.6"/></svg>`,
  "adi-3-review": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="Two students swapping their reports for review. The name on each report is covered, so the review is anonymous" xmlns="http://www.w3.org/2000/svg">
  <defs><symbol id="rv-person" overflow="visible"><circle cx="0" cy="-30" r="7"/><path d="M-12 0 V-11 Q-12 -21 0 -21 Q12 -21 12 -11 V0Z"/></symbol></defs>
  <rect class="pv-bench" x="0" y="166" width="350" height="24"/><path class="pv-bench-edge" d="M0 166H350" stroke-width="2"/><g transform="translate(54 166) scale(1.25)"><use href="#rv-person" class="pv-skin-o" stroke-width="3"/><use href="#rv-person" class="pv-skin"/></g><g transform="translate(296 166) scale(1.25)"><use href="#rv-person" class="pv-skin-o" stroke-width="3"/><use href="#rv-person" class="pv-skin"/></g><g transform="translate(140 76) rotate(-8)"><rect class="pv-paper" x="-20.0" y="-26.0" width="40" height="52" rx="3" stroke-width="1.8"/><path class="pv-line" d="M-14.0 -17.0 H14.0 M-14.0 -10.0 H10.0 M-14.0 -3.0 H12.0 M-14.0 4.0 H8.0 M-14.0 11.0 H13.0" stroke-width="1.5"/><rect x="-16" y="-24" width="20" height="6" rx="1.5" fill="var(--plate-sun)"/></g><g transform="translate(210 96) rotate(7)"><rect class="pv-paper" x="-20.0" y="-26.0" width="40" height="52" rx="3" stroke-width="1.8"/><path class="pv-line" d="M-14.0 -17.0 H14.0 M-14.0 -10.0 H10.0 M-14.0 -3.0 H12.0 M-14.0 4.0 H8.0 M-14.0 11.0 H13.0" stroke-width="1.5"/><rect x="-16" y="-24" width="20" height="6" rx="1.5" fill="var(--plate-sun)"/></g><path d="M96 108 C112 60 160 40 196 52" stroke="var(--plate-rim)" stroke-width="2" fill="none" stroke-dasharray="4 4"/><path d="M190 46 L198 52 L189 57" stroke="var(--plate-rim)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M254 132 C238 162 176 168 150 134" stroke="var(--plate-rim)" stroke-width="2" fill="none" stroke-dasharray="4 4"/><path d="M156 134 L149 133 L150 141" stroke="var(--plate-rim)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  "adi-4-build": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="A unit drawn as a long band in the five 5E phase colours, with an ADI routine of eight stages, in its three group colours, sitting inside the unit's Explore and Explain stretch, and a speaker in a lined box on the bench" xmlns="http://www.w3.org/2000/svg"><rect class="pv-bench" x="0" y="160" width="350" height="30"/><path class="pv-bench-edge" d="M0 160H350" stroke-width="2"/><rect class="pv-ph-engage" x="20" y="40" width="60" height="20" rx="10"/><rect class="pv-ph-explore" x="84" y="40" width="60" height="20" rx="3"/><rect class="pv-ph-explain" x="148" y="40" width="60" height="20" rx="3"/><rect class="pv-ph-elaborate" x="212" y="40" width="60" height="20" rx="3"/><rect class="pv-ph-evaluate" x="276" y="40" width="60" height="20" rx="10"/><path d="M84 64 L64 92 M208 64 L250 92" stroke="var(--plate-grey)" stroke-width="1.6" stroke-dasharray="3 3"/><rect x="54" y="92" width="206" height="34" rx="17" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2"/><g transform="translate(64 102)"><rect x="-3" y="-3" width="198.8" height="20" rx="10.0" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.8"/><rect class="pv-ph-engage" x="0.0" y="0" width="22" height="14" rx="7.0"/><rect class="pv-ph-engage" x="24.4" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-engage" x="48.8" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explore" x="73.2" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explore" x="97.6" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explain" x="122.0" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explain" x="146.4" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explain" x="170.8" y="0" width="22" height="14" rx="7.0"/></g><rect x="280" y="112" width="48" height="48" rx="4" fill="var(--plate-sun)" opacity=".55" stroke="var(--plate-rim)" stroke-width="2"/><rect x="287" y="119" width="34" height="41" fill="var(--surface)"/><g transform="translate(304 160) scale(0.85)"><rect class="pv-dark" x="-12" y="-30" width="24" height="30" rx="3"/><circle cx="0" cy="-11" r="7" fill="var(--plate-grey)"/><circle cx="0" cy="-11" r="2.6" class="pv-dark"/><circle cx="0" cy="-24" r="2.6" fill="var(--plate-grey)"/></g></svg>`,
  "adi-5-argument-day": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="Two whiteboards side by side, each with a bar chart, and the two groups who made them facing each other, with a question between them" xmlns="http://www.w3.org/2000/svg">
  <defs><symbol id="ad-person" overflow="visible"><circle cx="0" cy="-30" r="7"/><path d="M-12 0 V-11 Q-12 -21 0 -21 Q12 -21 12 -11 V0Z"/></symbol></defs>
  <rect class="pv-bench" x="0" y="176" width="350" height="14"/><path class="pv-bench-edge" d="M0 176H350" stroke-width="2"/><g><path d="M55.0 120 L61.0 90 M109.0 120 L103.0 90" stroke="var(--plate-grey)" stroke-width="2.4" stroke-linecap="round"/><rect class="pv-board" x="47.0" y="38" width="70" height="52" rx="3" stroke-width="2"/><path d="M54 54 V86 H110" stroke="var(--plate-grey)" stroke-width="1.4" fill="none"/><rect x="58" y="70" width="11" height="14" rx="1.5" fill="var(--plate-sun)"/><rect x="74" y="60" width="11" height="24" rx="1.5" fill="var(--plate-rust)"/><rect x="90" y="74" width="11" height="10" rx="1.5" fill="var(--plate-soil)"/></g><g><path d="M241.0 120 L247.0 90 M295.0 120 L289.0 90" stroke="var(--plate-grey)" stroke-width="2.4" stroke-linecap="round"/><rect class="pv-board" x="233.0" y="38" width="70" height="52" rx="3" stroke-width="2"/><path d="M240 54 V86 H296" stroke="var(--plate-grey)" stroke-width="1.4" fill="none"/><rect x="244" y="62" width="11" height="22" rx="1.5" fill="var(--plate-sun)"/><rect x="260" y="72" width="11" height="12" rx="1.5" fill="var(--plate-rust)"/><rect x="276" y="66" width="11" height="18" rx="1.5" fill="var(--plate-soil)"/></g><g transform="translate(60 176) scale(1.0)"><use href="#ad-person" class="pv-skin-o" stroke-width="3"/><use href="#ad-person" class="pv-skin"/></g><g transform="translate(104 176) scale(1.0)"><use href="#ad-person" class="pv-skin-o" stroke-width="3"/><use href="#ad-person" class="pv-skin"/></g><g transform="translate(246 176) scale(1.0)"><use href="#ad-person" class="pv-skin-o" stroke-width="3"/><use href="#ad-person" class="pv-skin"/></g><g transform="translate(290 176) scale(1.0)"><use href="#ad-person" class="pv-skin-o" stroke-width="3"/><use href="#ad-person" class="pv-skin"/></g><g transform="translate(175 112) scale(1.25 1.25)"><path d="M-16 -12 H16 Q22 -12 22 -6 V4 Q22 10 16 10 H-4 L-12 18 L-10 10 H-16 Q-22 10 -22 4 V-6 Q-22 -12 -16 -12Z" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.8"/><g fill="var(--plate-grey)"><circle cx="-8" cy="-1" r="2.2"/><circle cx="0" cy="-1" r="2.2"/><circle cx="8" cy="-1" r="2.2"/></g></g></svg>`,
  "select-1-which": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="Eleven question cards, one for each of the Reckoner's questions, each with its own small picture, and an arrow leading from them to the 5E and POE tokens" xmlns="http://www.w3.org/2000/svg"><rect x="24" y="30" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><circle cx="40" cy="46" r="7" fill="none" stroke="var(--plate-rust)" stroke-width="2"/><circle cx="40" cy="46" r="2.5" fill="var(--plate-rust)"/><rect x="64" y="30" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><circle cx="80" cy="46" r="7" fill="none" stroke="var(--plate-rim)" stroke-width="2"/><path d="M80 46 V41 M80 46 H84" stroke="var(--plate-rim)" stroke-width="1.8" stroke-linecap="round"/><rect x="104" y="30" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><path d="M120 52 V44" stroke="var(--plate-leaf)" stroke-width="2"/><path d="M120 45 C117 39 112 40 112 43 C115 46 118 46 120 45Z M120 44 C123 38 128 39 128 42 C125 45 122 45 120 44Z" fill="var(--plate-leaf)"/><rect x="144" y="30" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><ellipse cx="160" cy="46" rx="8" ry="5" fill="none" stroke="var(--plate-rim)" stroke-width="2"/><circle cx="160" cy="46" r="2.4" fill="var(--plate-rim)"/><rect x="24" y="70" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><path d="M33 91 L40 80 L47 91Z" fill="none" stroke="var(--plate-ray)" stroke-width="2" stroke-linejoin="round"/><rect x="64" y="70" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><path d="M73 92 V80 M73 92 H87" stroke="var(--plate-tub)" stroke-width="2" fill="none"/><path d="M76 88 L80 84 L86 82" stroke="var(--plate-tub)" stroke-width="1.8" fill="none"/><rect x="104" y="70" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><circle cx="120" cy="83" r="3.5" fill="var(--plate-canopy)" stroke="var(--plate-rim)" stroke-width="1.6"/><path d="M114 93 Q114 87 120 87 Q126 87 126 93" fill="var(--plate-canopy)" stroke="var(--plate-rim)" stroke-width="1.6"/><rect x="144" y="70" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><path d="M154 92 H166 M156 92 V85 M164 92 V85 M154 85 H166 L160 79Z" stroke="var(--plate-grey)" stroke-width="1.8" fill="none" stroke-linejoin="round"/><rect x="24" y="110" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><g transform="translate(40 126) rotate(0) scale(0.28)"><g transform="translate(0 0) rotate(0)"><rect class="pv-paper" x="-20.0" y="-26.0" width="40" height="52" rx="3" stroke-width="1.8"/><path class="pv-line" d="M-14.0 -17.0 H14.0 M-14.0 -10.0 H10.0 M-14.0 -3.0 H12.0 M-14.0 4.0 H8.0 M-14.0 11.0 H13.0" stroke-width="1.5"/></g></g><rect x="64" y="110" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><g transform="translate(80 126) scale(0.32 0.32)"><path d="M-16 -12 H16 Q22 -12 22 -6 V4 Q22 10 16 10 H-4 L-12 18 L-10 10 H-16 Q-22 10 -22 4 V-6 Q-22 -12 -16 -12Z" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.8"/><g fill="var(--plate-grey)"><circle cx="-8" cy="-1" r="2.2"/><circle cx="0" cy="-1" r="2.2"/><circle cx="8" cy="-1" r="2.2"/></g></g><rect x="104" y="110" width="32" height="32" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.6"/><path d="M120 119 C126 119 127 126 120 133 C113 126 114 119 120 119Z" fill="var(--plate-leaf)" opacity=".8"/><circle cx="120" cy="124" r="2.4" fill="var(--surface)"/><path d="M194 92 H236" stroke="var(--plate-grey)" stroke-width="2.4"/><path d="M230 86 L238 92 L230 98" stroke="var(--plate-grey)" stroke-width="2.4" fill="none" stroke-linecap="round"/><g transform="translate(250 66)"><rect x="-3" y="-3" width="77.0" height="21" rx="10.5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.8"/><rect class="pv-ph-engage" x="0.0" y="0" width="13" height="15" rx="7.5"/><rect class="pv-ph-explore" x="14.5" y="0" width="13" height="15" rx="2"/><rect class="pv-ph-explain" x="29.0" y="0" width="13" height="15" rx="2"/><rect class="pv-ph-elaborate" x="43.5" y="0" width="13" height="15" rx="2"/><rect class="pv-ph-evaluate" x="58.0" y="0" width="13" height="15" rx="7.5"/></g><g transform="translate(264 108)"><rect x="-3" y="-3" width="48.0" height="21" rx="10.5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.8"/><rect class="pv-ph-engage" x="0.0" y="0" width="13" height="15" rx="7.5"/><rect class="pv-ph-explore" x="14.5" y="0" width="13" height="15" rx="2"/><rect class="pv-ph-explain" x="29.0" y="0" width="13" height="15" rx="7.5"/></g></svg>`,
  "select-2-dial": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="The yeast flask from the earlier lesson, and two calendars: one with a single lesson marked, the other with a whole unit of lessons marked" xmlns="http://www.w3.org/2000/svg"><rect class="pv-bench" x="0" y="166" width="350" height="24"/><path class="pv-bench-edge" d="M0 166H350" stroke-width="2"/><g transform="translate(54 166)"><path class="pv-glass" d="M-5 -50 V-32 L-18 -3 Q-19 0 -15 0 H15 Q19 0 18 -3 L5 -32 V-50" stroke-width="2"/><path class="pv-water" d="M-12.5 -14 H12.5 L17 -3 Q18 -1 15 -1 H-15 Q-18 -1 -17 -3Z"/><path d="M-6 -50 V-55 C-6 -60 -2 -62 2 -62 C7 -62 9 -58 7 -55 C5 -53 2 -54 2 -56 C2 -53 5 -51 6 -53 V-50Z" fill="var(--plate-rust)"/></g><rect x="104" y="42" width="102" height="78" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2"/><rect class="pv-dark" x="104" y="42" width="102" height="10" rx="5"/><rect x="112" y="60" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="130" y="60" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="148" y="60" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="166" y="60" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="184" y="60" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="112" y="78" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="130" y="78" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="148" y="78" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="166" y="78" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="184" y="78" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="112" y="96" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="130" y="96" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="148" y="96" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="166" y="96" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="184" y="96" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><path d="M214 86 H236" stroke="var(--plate-grey)" stroke-width="2.4"/><path d="M230 80 L238 86 L230 92" stroke="var(--plate-grey)" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="242" y="42" width="84" height="78" rx="5" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2"/><rect class="pv-dark" x="242" y="42" width="84" height="10" rx="5"/><rect x="250" y="60" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="268" y="60" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="286" y="60" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="304" y="60" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="250" y="78" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="268" y="78" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="286" y="78" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="304" y="78" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="250" y="96" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="268" y="96" width="14" height="14" rx="2" fill="var(--engage)" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="286" y="96" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/><rect x="304" y="96" width="14" height="14" rx="2" fill="none" stroke="var(--plate-grey)" stroke-opacity=".5" stroke-width="1"/></svg>`,
  "select-3-argue": `<svg class="plate" viewBox="0 0 350 190" role="img" aria-label="Models nested inside each other: a unit in the five 5E colours, an ADI routine inside its Explore and Explain stretch, and a POE inside the ADI routine's first stage" xmlns="http://www.w3.org/2000/svg"><rect class="pv-ph-engage" x="20" y="28" width="60" height="18" rx="9"/><rect class="pv-ph-explore" x="84" y="28" width="60" height="18" rx="3"/><rect class="pv-ph-explain" x="148" y="28" width="60" height="18" rx="3"/><rect class="pv-ph-elaborate" x="212" y="28" width="60" height="18" rx="3"/><rect class="pv-ph-evaluate" x="276" y="28" width="60" height="18" rx="9"/><path d="M84 50 L64 74 M208 50 L250 74" stroke="var(--plate-grey)" stroke-width="1.6" stroke-dasharray="3 3"/><rect x="54" y="74" width="206" height="32" rx="16" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2"/><g transform="translate(64 83)"><rect x="-3" y="-3" width="198.8" height="20" rx="10.0" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.8"/><rect class="pv-ph-engage" x="0.0" y="0" width="22" height="14" rx="7.0"/><rect class="pv-ph-engage" x="24.4" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-engage" x="48.8" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explore" x="73.2" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explore" x="97.6" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explain" x="122.0" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explain" x="146.4" y="0" width="22" height="14" rx="2"/><rect class="pv-ph-explain" x="170.8" y="0" width="22" height="14" rx="7.0"/></g><path d="M64 110 L52 134 M86 110 L112 134" stroke="var(--plate-grey)" stroke-width="1.6" stroke-dasharray="3 3"/><rect x="40" y="134" width="84" height="28" rx="14" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="2"/><g transform="translate(56 141)"><rect x="-3" y="-3" width="54.0" height="20" rx="10.0" fill="var(--surface)" stroke="var(--plate-rim)" stroke-width="1.8"/><rect class="pv-ph-engage" x="0.0" y="0" width="15" height="14" rx="7.0"/><rect class="pv-ph-explore" x="16.5" y="0" width="15" height="14" rx="2"/><rect class="pv-ph-explain" x="33.0" y="0" width="15" height="14" rx="7.0"/></g></svg>`,
};
const LEVEL = {recognise:"Recognise",explain:"Explain",select:"Select",design:"Design"};
const UNSCORED = ["predict","concept","case","reflect","build","sim"];   // never used as warm-ups
const pathOf = id => D.paths.find(p => p.id === id);
const G = id => D.guides[id];
/* A phase's name and colour come from its guide; colours follow phase order, so POE's three phases
 * take the first three of 5E's five. */
const phaseName = (gid, id) => ((G(gid) && G(gid).phases.find(p => p.id === id)) || {name:id}).name;
const pc = (gid, id) => {
  const g = G(gid); if (!g) return "var(--accent)";
  const ph = g.phases.find(p => p.id === id); if (!ph) return "var(--accent)";
  /* A model with stage groups (ADI) colours by group, so eight stages never wrap round five colours. */
  const i = g.groups && g.groups.length ? g.groups.findIndex(x => x.id === ph.group) : g.phases.indexOf(ph);
  return i >= 0 ? COLS[i % COLS.length] : "var(--accent)";
};
const groupOf = (gid, id) => { const g = G(gid), ph = g && g.phases.find(p => p.id === id); return ph && ph.group ? g.groups.find(x => x.id === ph.group) : null; };
const article = w => /^[aeiou]/i.test(w) ? "an" : "a";
/* In a lesson: the journey guide supplies the rail, spot options, look-fors and misapplications. */
const J = () => pathOf(S.lesson.path).journey;
const JG = () => G(J());
const jp = id => pc(J(), id);
const jn = id => phaseName(J(), id);

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
  $("#top").innerHTML = `<span class="brand"><span class="brand-mark">${icon("i-fieldwork")}</span>${esc(NAMES.game)}</span><span class="grow"></span>
    ${mode === "map" ? "" : `<button class="back" id="toMap" type="button">${icon("i-back")}All lessons</button>`}
    <a class="back" href="../reckoner/">${icon("i-back")}${esc(NAMES.product)}</a>`;
  const b = $("#toMap"); if (b) b.addEventListener("click", showMap);
  $("#privacy").hidden = mode === "map"; $("#privacyText").textContent = PRIVACY;
  if (mode === "play" && S){ $("#hudPath").textContent = `${NAMES.game} · ${title}`; $("#hudTitle").textContent = S.lesson.title; }
  $("#banner").innerHTML = D.review ? `<div class="banner">Review copy: includes lessons not yet published. Not for students.</div>` : "";
}

const met = reqs => (reqs || []).every(q => levelReached(q.path) >= D.mastery.indexOf(q.level));
const needText = reqs => reqs.map(q => `${LEVEL[q.level]} on the ${pathOf(q.path).title}`).join(" and ");
function pathOpen(p){
  return D.review || met(p.requires);
}
function unlocked(l){
  if (!pathOpen(pathOf(l.path))) return false;
  if (!D.review && !met(l.requires)) return false;
  if (D.review || l.order === 1) return true;
  const prev = D.lessons.find(x => x.path === l.path && x.order === l.order - 1 && sameRun(x, l));
  return !prev || rec(prev.id).completed;
}
/* A path with cases (tracks): shared lessons, then each case's own run. Lessons share a run when either is shared or both are the same case. */
const sameRun = (a, b) => !a.track || !b.track || a.track === b.track;
function caseOf(p){
  if (!p.tracks || !p.tracks.length) return null;
  const chosen = (P.tracks || {})[p.id];
  return p.tracks.some(t => t.id === chosen) ? chosen : p.tracks[0].id;
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
    const kase = caseOf(p);
    const all = D.lessons.filter(l => l.path === p.id);
    const ls = all.filter(l => !l.track || l.track === kase);
    const nextL = ls.find(l => !rec(l.id).completed && unlocked(l));
    const open = pathOpen(p);
    const link = p.guide ? `<a href="../reckoner/#/guide/${esc(p.id)}">Open the ${esc(G(p.guide).name)} companion guide</a>` : `<a href="../reckoner/">Open ${esc(NAMES.reckonerMid)}</a>`;
    const need = needText(p.requires);
    return `<section class="path">
      <div class="pathHead"><h2>${esc(p.title)}</h2>${link}</div>
      <p>${esc(p.blurb)}</p>
      ${open ? "" : `<p class="upcoming" style="margin-top:12px">Unlocks when you reach ${esc(need)}.</p>`}
      <div class="ladder" aria-label="Mastery reached">${D.mastery.map((m,i) => `<div class="${i <= lv ? "got" : ""}">${LEVEL[m]}</div>`).join("")}</div>
      <div class="lessons">${ls.map(l => {
        const r = rec(l.id), open = unlocked(l);
        const state = r.completed ? "done" : (l === nextL ? "next" : "");
        const chips = [`<span class="chip">${LEVEL[l.level]}</span>`];
        if (r.completed) chips.push(`<span class="chip good">Done · best ${r.best}/${r.of} first try</span>`);
        else if (!open && pathOpen(p) && !met(l.requires)) chips.push(`<span class="chip">Unlocks at ${esc(needText(l.requires))}</span>`);
        else if (!open && pathOpen(p)) chips.push(`<span class="chip">Finish lesson ${l.order - 1} first</span>`);
        if (l.status !== "published") chips.push(`<span class="chip warn">${esc(l.status)}</span>`);
        if (r.missed.length && r.completed) chips.push(`<span class="chip">${r.missed.length} to review</span>`);
        const btn = `<button class="lesson ${state}" data-l="${esc(l.id)}" ${open ? "" : "disabled"} type="button"><span class="num">${l.order}</span><span class="min"><h3>${esc(l.title)}</h3><span class="sum">${esc(l.summary)}</span><span class="meta">${chips.join("")}</span></span></button>`;
        const firstOfCase = kase && l.track && !ls.some(x => x.track && x.order < l.order);
        return (firstOfCase ? casePicker(p, kase, all) : "") + btn;
      }).join("")}
      ${p.upcoming ? `<div class="upcoming">${p.upcoming === 1 ? "One more lesson is" : `${p.upcoming} more lessons are`} being reviewed and will appear here soon.</div>` : ""}</div>
    </section>`;
  }).join("")}
  <div class="recall" style="margin-top:26px;--engage:var(--explain)"><b>About this pilot.</b> ${esc(D.notice)}</div>
  <p class="reset">Your progress is saved in this browser only. <button type="button" id="reset">Start again from scratch</button></p>`;
  stage.querySelectorAll("[data-l]").forEach(b => b.addEventListener("click", () => showIntro(b.dataset.l)));
  stage.querySelectorAll("[data-case]").forEach(b => b.addEventListener("click", () => {
    const [pid, tid] = b.dataset.case.split("|");
    P.tracks = {...(P.tracks || {}), [pid]: tid}; store.save(P);
    showMap();
    document.querySelector(`[data-case="${pid}|${tid}"]`)?.focus();
  }));
  const rs = $("#reset");
  rs.addEventListener("click", () => {
    if (rs.dataset.armed){ P = {lessons:{}}; store.save(P); showMap(); }
    else { rs.dataset.armed = "1"; rs.textContent = "Tap again to clear your progress"; }
  });
  window.scrollTo({top:0});
}

/* Choose a case: one button per track, the chosen one pressed. Progress in either case is kept. */
function casePicker(p, kase, all){
  const done = t => all.filter(l => l.track === t.id && rec(l.id).completed).length;
  const of = t => all.filter(l => l.track === t.id).length;
  return `<div class="cases" role="group" aria-label="Choose a case for the next lessons">
    <p class="casesHead">Choose a case for the next lessons. You can switch at any time, and each case keeps its own progress.</p>
    <div class="caseBtns">${p.tracks.map(t => `<button type="button" class="caseBtn" data-case="${esc(p.id)}|${esc(t.id)}" aria-pressed="${t.id === kase}"><b>${esc(t.title)}</b><span>${esc(t.blurb)}</span>${done(t) ? `<span class="chip good">${done(t)} of ${of(t)} done</span>` : ""}</button>`).join("")}</div>
  </div>`;
}

function showIntro(id){
  const l = D.lessons.find(x => x.id === id), r = rec(id);
  chrome("intro", `${pathOf(l.path).title} · Lesson ${l.order}`);
  dock.className = "dock"; fb.innerHTML = "";
  const warm = warmupFor(l).length;
  stage.innerHTML = `<section class="card">
    <div class="chips"><span class="chip">${esc(pathOf(l.path).title)}</span><span class="chip">${LEVEL[l.level]}</span><span class="chip">Lesson ${l.order}</span>${r.plays ? `<span class="chip">Attempt ${r.plays + 1}</span>` : ""}</div>
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
  const earlier = D.lessons.filter(x => x.path === l.path && x.order < l.order && sameRun(x, l)).reverse();
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
  const n = total(); $("#count").textContent = `${Math.min(n, doneCount() + (S.done ? 0 : 1))} / ${n}`;
  const at = S.done ? "done" : cur && cur.at;
  /* A grouped rail (ADI) shows the stage groups; the phase tag on each item names the stage itself. */
  const grouped = pathOf(S.lesson.path).rail === "groups";
  const cells = grouped ? JG().groups.map(g => ({id:g.id, name:g.name, col:jp(JG().phases.find(p => p.group === g.id).id)}))
                        : JG().phases.map(p => ({id:p.id, name:p.name, col:jp(p.id)}));
  const nowId = grouped ? (groupOf(J(), at) || {}).id : at, idx = cells.findIndex(c => c.id === nowId);
  $("#rail").style.gridTemplateColumns = `repeat(${cells.length},1fr)`;
  $("#rail").innerHTML = cells.map((c,i) => `<div style="--pc:${c.col}" class="${at === "done" || i < idx ? "done" : i === idx ? "now" : ""}">${esc(c.name)}</div>`).join("");
  $("#railnote").textContent = S.done ? "Lesson complete. Your own journey ran through every phase."
    : S.phase === "warm" ? "Warm-up: items you missed in an earlier lesson, once more."
    : S.phase === "review" ? "Review round: items you missed come back once, with the options shuffled."
    : `This lesson is itself ${article(JG().name)} ${JG().name} sequence. The bar shows where you are in it.`;
}

/* ---------- rendering an item ---------- */
/* "ENGAGE · PREDICT" with the phase glyph, coloured by the item's phase; a plain tag with the kind alone otherwise. */
function phaseTag(it){
  if (it.at && GLYPH.includes(it.at)) return `<p class="phtag" style="--pc:var(--${it.at})">${icon("i-" + it.at)}${esc(jn(it.at))} · ${esc(it.kind)}</p>`;
  /* Phases without a glyph (ADI's stages): the stage name in its group colour, no icon. */
  if (it.at && JG().groups.length && JG().phases.some(p => p.id === it.at)) return `<p class="phtag" style="--pc:${jp(it.at)}">${esc(jn(it.at))} · ${esc(it.kind)}</p>`;
  return `<p class="phtag plain">${esc(it.kind)}</p>`;
}
/* The lesson's plate, on its first item only. */
const plateHTML = it => PLATES[S.lesson.id] && S.phase === "main" && it._from === S.lesson.id && it.id === S.lesson.items[0].id
  ? `<figure class="plate-card">${PLATES[S.lesson.id]}</figure>` : "";
/* Correct or wrong, said in words and an icon as well as colour. */
function verdict(el, ok){
  if (el.querySelector(".vd")) return;
  const at = el.querySelector(".t") || el;
  at.insertAdjacentHTML("beforeend", `<span class="vd">${icon(ok ? "i-tick" : "i-cross")}${ok ? "Correct" : "Not this one"}</span>`);
}
/* A spot item offers every phase, or only those it names in `among`, in the guide's order. */
const spotPhases = it => JG().phases.filter(p => !it.among || it.among.includes(p.id));
/* A results table: real <table> markup with a caption, so screen readers announce rows and headings. */
function tableHTML(t){
  return `<div class="dtable"><table><caption>${esc(t.caption)}</caption><thead><tr>${t.head.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${t.rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
/* The case: the setting, what the class is investigating, your role, and the lessons so far. */
function caseHTML(it){
  return `<div class="vignette"><span class="who">${esc(it.setting.who)}</span>${esc(it.setting.text)}</div>
    <p class="lead">${esc(it.lead)}</p>
    ${it.table ? tableHTML(it.table) : ""}
    ${it.sofar ? `<p class="kind" style="margin-top:14px">The lessons so far</p><ol class="sofar">${it.sofar.map(r => `<li style="--pc:${jp(r.phaseId)}"><span class="when">${esc(r.when)} · ${esc(jn(r.phaseId))}</span>${esc(r.text)}</li>`).join("")}</ol>` : ""}
    <p class="you"><b>Your role.</b> ${esc(it.you)}</p>`;
}

function options(it){
  if (it.type === "spot") return spotPhases(it).map(p => ({t:p.name, ph:p.id, fb:it.fb[p.id]}));
  if (it.type === "nest") return G(it.host).phases.map(p => ({t:p.name, ph:p.id}));
  if (it.type === "select") return it._stage === 2 ? it.reasons.map(x => ({t:x.text, ok:x.ok, dim:x.dim})) : it.candidates.map(c => ({t:it.names[c], c}));
  if (it.type === "flip") return it.changeLabels.map(c => ({t:c.text}));
  if (it.type === "lookfor"){
    const lf = JG().lookFors;
    return [it.answer, ...it.distractors].map(id => ({t:lf[id].question, lf:id, ph:lf[id].phaseId}));
  }
  if (it.type === "diagnose"){
    const mi = JG().misapplications;
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
  if (cur.type === "sim"){ cur._node = cur._node || cur.start; cur._state = cur._state || {}; cur._trail = cur._trail || []; const n = simNode(cur); if (n) cur.at = n.phase; }
  chrome("play", pathOf(S.lesson.path).title);
  hud();
  if (cur.type === "sim") return renderSim();
  if (cur.type === "build") return renderBuild();
  if (cur.type === "select" && !cur._stage) cur._stage = 1;
  const reshuffle = S.plays > 0 || S.phase === "review" || cur._warm;
  let opts = options(cur).map((o,i) => ({...o, i}));
  if (!["spot","nest"].includes(cur.type) && (reshuffle || cur.type === "lookfor" || cur.type === "diagnose")) opts = shuffle(opts);
  cur._view = opts;
  const chip = S.phase === "warm" ? `<span class="chip warn">Warm-up</span>` : S.phase === "review" ? `<span class="chip warn">Review</span>` : "";
  let h = `<section class="card" style="--pc:${jp(cur.at)}">${plateHTML(cur)}
    <div class="chips"><span class="chip">${esc(cur.processing)}</span>${chip}</div>
    ${phaseTag(cur)}`;
  if (cur.title) h += `<h2>${esc(cur.title)}</h2>`;
  if (cur.vignette) h += `<div class="vignette"><span class="who">${esc(cur.vignette.who)}</span>${esc(cur.vignette.text)}</div>`;
  if (cur.scenario) h += `<div class="vignette"><span class="who">${esc(cur.scenario.who)}</span>${esc(cur.scenario.text)}</div>${profileHTML(cur)}`;
  if (cur.type === "case") h += caseHTML(cur);
  if (cur.table && cur.type !== "case") h += tableHTML(cur.table);
  if (cur.type === "select") h += cur._stage === 1 ? `<p class="q">${esc(cur.q || `Which model does ${NAMES.reckonerMid} recommend for this class?`)}</p>` : `<p class="q">You chose <b>${esc(cur.names[cur.candidates[cur._pick]])}</b>. Why? Select every reason that holds for this class.</p>`;
  if (cur.type === "flip") h += `<p class="q">${esc(cur.q || `${NAMES.reckoner} recommends ${cur.names[cur.from]} for this class. Which single change would make it recommend something else?`)}</p>`;
  if (cur.type === "nest") h += `<p class="q">${esc(cur.q || `Where does a ${G(cur.model).name} fit inside ${G(cur.host).name}?`)}</p>`;
  if (cur.plan) h += `<ol class="plan">${cur.plan.map(r => `<li style="--pc:${jp(r.phaseId)}"><b>${esc(jn(r.phaseId))}</b><span class="min">${esc(r.text)}</span></li>`).join("")}</ol>`;
  if (cur.type === "lookfor") h += `<p class="q">${cur.strong ? "This is strong evidence for one look-for in the guide. Which one?" : "This is weak evidence for one look-for in the guide: it shows what's missing. Which one?"}</p>`;
  if (cur.type === "diagnose" && !cur.q) h += `<p class="q">Which misapplication from the guide is this?</p>`;
  if (cur.q && !["reflect","select","flip","nest"].includes(cur.type)) h += `<p class="q">${esc(cur.q)}</p>`;
  if (["predict","choice","spot","multi","lookfor","diagnose","select","flip","nest"].includes(cur.type)){
    const grid = cur.type === "spot" || cur.type === "nest";
    const gid = cur.type === "nest" ? cur.host : J();
    h += `<div class="opts ${grid ? "phases" : ""}" role="${isMulti(cur) ? "group" : "radiogroup"}">${opts.map((o,n) =>
      `<button class="opt" type="button" data-i="${o.i}" ${o.ph && grid ? `style="--pc:${pc(gid, o.ph)}"` : ""} role="${isMulti(cur) ? "checkbox" : "radio"}" aria-checked="false">${grid ? "" : `<span class="k">${n + 1}</span>`}<span class="t">${cur.type === "lookfor" ? `<span class="lfq">${esc(jn(o.ph))} look-for</span>` : ""}${esc(o.t)}<span class="ofb" hidden></span></span></button>`).join("")}</div>`;
  }
  if (cur.type === "predict") h += `<div class="slider"><label for="conf">How confident are you? <output id="confout">${S.conf}%</output></label><input type="range" id="conf" min="0" max="100" step="10" value="${S.conf}" style="--fill:${S.conf}%"><small><span>Pure guess</span><span>Certain</span></small></div>`;
  if (cur.type === "order"){ pool = shuffle(cur.steps.map((o,i) => ({...o, i}))); h += `<div class="slots" id="slots"></div><div class="pool" id="pool"></div>`; }
  if (cur.type === "concept") h += `<p class="lead">${esc(cur.lead)}</p><div class="concept">${cur.rows.map(r => `<div class="row" style="--pc:${jp(r.phaseId)}"><h3>${esc(jn(r.phaseId))}</h3><p>${esc(r.does)}<em>${esc(r.move)}</em></p></div>`).join("")}</div>${cur.cite ? `<p class="cite">${esc(cur.cite)}</p>` : ""}`;
  if (cur.type === "reflect"){
    const pr = S.lesson.items.find(i => i.id === cur.recall);
    if (pr && S.pred != null) h += `<div class="recall">At the start you chose <b>${esc(pr.options[S.pred].text.toLowerCase())}</b> with <b>${S.conf}%</b> confidence.${S.pred === pr.answer ? " You were right. Many adults are not." : " Your first idea was the same kind of idea your students will bring."}</div>`;
    h += `<p class="q">${esc(cur.q)}</p><label for="refl" class="kind" style="display:block;margin-top:10px">Your answer</label><textarea id="refl" placeholder="Write a sentence or two">${esc(S.reflection)}</textarea>`;
  }
  if (cur.hint) h += `<details class="hint"><summary>Hint</summary><p>${esc(cur.hint)}</p></details>`;
  stage.innerHTML = h + `</section>`;
  window.scrollTo({top:0});

  go.onclick = onGo;
  if (cur.type === "concept" || cur.type === "case"){ go.textContent = cur.type === "case" ? "Start" : "Got it"; go.disabled = false; keys.textContent = "Enter to continue"; }
  else if (cur.type === "reflect"){ go.textContent = "Finish lesson"; go.disabled = false; keys.textContent = "Not marked. Writing it is the point.";
    $("#refl").addEventListener("input", e => S.reflection = e.target.value); }
  else { go.textContent = cur.type === "select" && cur._stage === 1 ? "Next: give your reasons" : "Check"; go.disabled = true; keys.textContent = cur.type === "order" ? "Tap activities in order" : `Keys: 1–${opts.length} to choose, Enter to check`; }
  stage.querySelectorAll(".opt[data-i]").forEach(b => b.addEventListener("click", () => choose(+b.dataset.i)));
  if (cur.type === "predict"){ const r = $("#conf"); r.addEventListener("input", () => { S.conf = +r.value; $("#confout").textContent = S.conf + "%"; r.style.setProperty("--fill", S.conf + "%"); }); }
  if (cur.type === "order") drawOrder();
}

function choose(i){
  if (checked) return;
  if (isMulti(cur)) multi.has(i) ? multi.delete(i) : multi.add(i); else sel = i;
  stage.querySelectorAll(".opt[data-i]").forEach(b => {
    const on = isMulti(cur) ? multi.has(+b.dataset.i) : +b.dataset.i === sel;
    b.classList.toggle("sel", on); b.setAttribute("aria-checked", on);
  });
  go.disabled = isMulti(cur) ? multi.size === 0 : sel == null;
}

const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
/* Short model names for narrow columns: "Predict–Observe–Explain" becomes "POE". */
const short = m => G(m).name.length > 12 ? m.toUpperCase() : G(m).name;
const isMulti = it => it.type === "multi" || (it.type === "select" && it._stage === 2);
/* The class, in the reckoner's own words: one chip per answered question. */
function profileHTML(it){
  return `<div class="chips" style="margin-top:10px">${it.weighing.rows.map(r => `<span class="chip">${esc(cap(r.label))}: ${esc(r.value)}</span>`).join("")}</div>`;
}
/* The reckoner's weighing: each question, each model's fit out of 3, and the totals. */
function weighingHTML(it, highlight){
  const ms = Object.keys(it.weighing.fits);
  return `<details class="why" open><summary>How ${esc(NAMES.reckonerMid)} weighs this class</summary>
    <div class="weigh"><div class="wrow whead"><span>Question</span>${ms.map(m => `<span>${esc(short(m))}</span>`).join("")}</div>
    ${it.weighing.rows.map(r => `<div class="wrow${r.dim === highlight ? " hl" : ""}"><span>${esc(cap(r.label))}<small>${esc(r.value)}${r.weight !== 1 ? ` · counts ×${r.weight}` : ""}</small></span>${ms.map(m => `<span><i class="bar"><b style="width:${100 * r.scores[m] / 3}%"></b></i>${+r.scores[m].toFixed(2)}</span>`).join("")}</div>`).join("")}
    <div class="wrow wtot"><span>Overall fit</span>${ms.map(m => `<span>${it.weighing.fits[m]}%</span>`).join("")}</div></div></details>`;
}

function drawOrder(){
  const slots = $("#slots"), pl = $("#pool"), N = cur.steps.length;
  slots.innerHTML = cur.steps.map((_,n) => {
    const o = placed[n];
    return o ? `<button class="slot filled" type="button" data-n="${n}" ${checked ? "disabled" : ""} style="--pc:${jp(o.phaseId)}"><span class="n">${n + 1}</span><span class="txt">${esc(o.text)}</span>${checked ? `<span class="tag">${esc(jn(o.phaseId))}</span>` : ""}</button>`
             : `<div class="slot"><span class="n">${n + 1}</span><span>${n === placed.length ? "Tap an activity below" : ""}</span></div>`;
  }).join("");
  const left = pool.filter(o => !placed.includes(o));
  pl.innerHTML = left.length ? `<span class="lbl">Activities</span>` + left.map(o => `<button class="opt" type="button" data-p="${o.i}"><span class="t">${esc(o.text)}</span></button>`).join("") : "";
  pl.querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => { placed.push(pool.find(o => o.i === +b.dataset.p)); drawOrder(); }));
  slots.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => { if (checked) return; placed.splice(+b.dataset.n, 1); drawOrder(); }));
  go.disabled = placed.length !== N;
  if (checked) slots.querySelectorAll(".slot").forEach((el,n) => { const ok = placed[n].phaseId === cur.steps[n].phaseId; el.classList.add(ok ? "right" : "wrong"); verdict(el, ok); });
}

/* ---------- checking ---------- */
function correctIndex(it){
  if (it.type === "spot") return spotPhases(it).findIndex(p => p.id === it.answer);
  if (it.type === "nest") return G(it.host).phases.findIndex(p => p.id === it.answer);
  if (it.type === "select") return it.candidates.indexOf(it.answer);
  if (it.type === "lookfor" || it.type === "diagnose") return 0;
  return it.answer;
}
function onGo(){
  if (cur.type === "concept" || cur.type === "case"){ S.xp += 5; return next(); }
  if (cur.type === "reflect"){ S.xp += 10; S.done = true; return render(); }
  if (checked) return next();
  if (cur.type === "select" && cur._stage === 1){ cur._pick = sel; cur._stage = 2; return render(); }
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
  if (cur.type === "select"){
    const right = cur._pick === correctIndex(cur), why = opts.every((o,i) => !!o.ok === multi.has(i));
    ok = right && why;
    mark(i => opts[i].ok && multi.has(i), i => multi.has(i) && !opts[i].ok, () => false);
    stage.querySelectorAll(".opt[data-i]").forEach(b => { const i = +b.dataset.i; if (opts[i].ok && !multi.has(i)){ b.classList.add("right"); verdict(b, true); } });
    const fav = opts.filter(o => o.ok).map(o => o.t.replace(/\.$/, "").toLowerCase());
    body = `<p>${right ? "Right model" : `${esc(NAMES.reckoner)} recommends <b>${esc(cur.names[cur.answer])}</b>`}${right && !why ? ", but your reasons need work" : ""}. ${cur.nested ? esc(cur.nested) + " " : ""}The reasons that hold are the ones where this class's answers favour it: ${esc(fav.join("; "))}.${opts.some(o => o.dim === null) ? " A preference about a model is never a reason on its own." : ""} ${esc(NAMES.reckoner)}'s weighing is below the options.</p>`;
    stage.querySelector("section").insertAdjacentHTML("beforeend", weighingHTML(cur));
    cur._partial = right && !why;
  }
  if (cur.type === "flip"){
    ok = sel === cur.answer;
    mark(i => i === cur.answer, i => i === sel && !ok, () => false);
    const c = cur.changeLabels[cur.answer];
    body = `<p>${esc(c.text)} and ${esc(NAMES.reckonerMid)} switches to <b>${esc(cur.names[c.top])}</b> (${Object.entries(c.fits).map(([m,f]) => `${esc(short(m))} ${f}%`).join(", ")}).${!ok && sel != null ? ` Your change leaves ${esc(cur.names[cur.changeLabels[sel].top])} on top.` : ""} The weighing below shows the starting class, with the question that moves highlighted.</p>`;
    stage.querySelector("section").insertAdjacentHTML("beforeend", weighingHTML(cur, cur.changes[cur.answer].dim));
  }
  if (cur.type === "nest"){
    const ans = correctIndex(cur); ok = sel === ans;
    mark(i => i === ans, i => i === sel && !ok, () => false);
    body = `<p><b>${esc(phaseName(cur.host, cur.answer))}.</b> ${esc(cur.how)}</p>`;
  }
  if (["choice","spot","lookfor","diagnose"].includes(cur.type)){
    const ans = correctIndex(cur); ok = sel === ans;
    if (cur.type === "spot") mark(i => i === ans, i => i === sel && !ok, i => i === sel && !ok);
    else mark(i => i === ans, i => i === sel && !ok, i => i === sel || i === ans);
    if (cur.type === "spot") body = `<p>${esc(cur.fb[cur.answer])}</p>`;
    if (cur.type === "diagnose"){
      const m = JG().misapplications[cur.answer];
      body = `<p><b>${esc(m.name)}.</b> ${esc(m.why)}</p><p><b>The fix:</b> ${esc(m.fix)}</p>`;
      if (!ok){ const w = JG().misapplications[opts[sel].mi]; body += `<p>${esc(w.name)} looks different. In the guide's words: ${esc(w.looksLike)}</p>`; }
    }
    if (cur.type === "lookfor"){
      const lf = JG().lookFors[cur.answer];
      body = `<p><b>${cur.strong ? "Strong evidence" : "Weak evidence"} for this look-for:</b> ${esc(cur.strong ? lf.strong : lf.weak)}</p>`;
      if (!ok){ const wrong = JG().lookFors[opts[sel].lf]; body += `<p>The one you chose is about something else. Strong evidence for it would be: ${esc(wrong.strong.charAt(0).toLowerCase() + wrong.strong.slice(1))}</p>`; }
    }
  }
  if (cur.type === "multi"){
    ok = opts.every((o,i) => !!o.ok === multi.has(i));
    mark(i => opts[i].ok && multi.has(i), i => multi.has(i) && !opts[i].ok, () => true);
    stage.querySelectorAll(".opt[data-i]").forEach(b => { const i = +b.dataset.i; if (opts[i].ok && !multi.has(i)){ b.classList.add("right"); verdict(b, true); } });
  }
  if (cur.type === "order"){
    ok = placed.every((o,n) => o.phaseId === cur.steps[n].phaseId); drawOrder();
    if (!ok) body = `<p>The correct order follows the guide's phases. Check the tag on each placed activity.</p>`;
  }
  score(ok);
  dock.className = "dock " + (ok ? "good" : "bad");
  let head = ok ? pick(["Nicely judged.","That's it.","Spot on.","Exactly right."])
    : cur._partial ? "Right model, but not the right reasons. It'll come back in review."
    : (S.phase === "main" ? "Not this time. It'll come back in review." : "Still not quite.");
  if (ok && S.streak && S.streak % 3 === 0) head += " +5 streak bonus";
  feedback(head, body);
}
function score(ok, key){
  key = key || cur.id; const L = rec(cur._from);
  if (S.phase === "warm"){
    S.warmRes.push(ok);
    if (ok) L.missed = L.missed.filter(m => m !== key);
  } else if (S.phase === "main"){
    S.results[key] = {ok, tests:cur.tests};
    if (!ok && cur.type !== "sim") S.review.push({...cur, _stage:0, _pick:null, _partial:false, _placed:null, _report:null});
  } else if (S.phase === "review" && ok && S.results[key]) S.results[key].recovered = true;
  if (ok){ S.streak++; S.best = Math.max(S.best, S.streak); S.xp += S.phase === "main" ? 10 : 5; if (S.streak % 3 === 0) S.xp += 5; }
  else S.streak = 0;
  store.save(P); hud();
}
function mark(isRight, isWrong, showFb){
  const opts = options(cur);
  stage.querySelectorAll(".opt[data-i]").forEach(b => {
    const i = +b.dataset.i; b.disabled = true; b.classList.remove("sel");
    if (isRight(i)){ b.classList.add("right"); verdict(b, true); } else if (isWrong(i)){ b.classList.add("wrong"); verdict(b, false); }
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

/* ---------- build: assemble a plan, then read the feature report ---------- */
/*<buildReport>*/
/* The same rules as buildReport() in scripts/lib/game.ts; test-game.ts checks the two agree. */
function buildReport(it, placed, phases){
  const card = id => it.cards.find(c => c.id === id);
  const met = new Set(), flags = [], misplaced = [], checkPhases = new Set();
  for (const p of phases){
    const ids = placed[p.id] || [];
    for (const id of ids){
      const c = card(id);
      (c.flaws || []).forEach(m => flags.push({mis:m, because:c.id}));
      if (c.kind === "check"){ checkPhases.add(p.id); continue; }
      if (c.does && c.does !== p.id){ misplaced.push({card:c.id, in:p.id, does:c.does}); continue; }
      if (!(c.flaws || []).length) (c.features || []).forEach(f => met.add(f));
    }
    if (!ids.some(id => card(id).kind === "activity") && it.missing[p.id]) flags.push({mis:it.missing[p.id], because:"empty:" + p.id});
  }
  if (it.formative){
    if (checkPhases.size >= it.formative.minPhases) met.add(it.formative.lookFor);
    else flags.push({mis:it.formative.flag, because:"checks:" + checkPhases.size});
  }
  const missing = it.report.filter(f => !met.has(f));
  return { met: it.report.filter(f => met.has(f)), missing, flags, misplaced, clean: !flags.length && !misplaced.length && !missing.length };
}
/*</buildReport>*/
function renderBuild(){
  const it = cur, ph = JG().phases;
  it._placed = it._placed || {};
  const placedIds = new Set(Object.values(it._placed).flat());
  const card = id => it.cards.find(c => c.id === id);
  const chip = S.phase === "review" ? `<span class="chip warn">Review: rebuild it</span>` : "";
  let h = `<section class="card" style="--pc:${jp(it.at)}">${plateHTML(it)}
    <div class="chips"><span class="chip">${esc(it.processing)}</span>${chip}</div>
    ${phaseTag(it)}${it.title ? `<h2>${esc(it.title)}</h2>` : ""}
    <div class="vignette"><span class="who">${esc(it.brief.who)}</span>${esc(it.brief.text)}</div>
    ${it.q && !checked ? `<p class="q">${esc(it.q)}</p>` : ""}
    <div class="board">${ph.map(p => `<div class="phasebox" style="--pc:${jp(p.id)}"><div class="phead"><b>${esc(p.name)}</b>${it._pick && !checked ? `<button class="place" type="button" data-place="${esc(p.id)}">Place here</button>` : ""}</div>
      ${(it._placed[p.id] || []).map(id => `<button class="slot filled" type="button" data-un="${esc(id)}" data-from="${esc(p.id)}" ${checked ? "disabled" : ""}><span class="txt">${card(id).kind === "check" ? `<span class="chip">Check</span> ` : ""}${esc(card(id).text)}</span></button>`).join("") || `<p class="empty">No cards yet</p>`}</div>`).join("")}</div>
    ${checked ? "" : `<div class="pool tray"><span class="lbl">Cards · tap one, then choose its phase</span>${it.cards.filter(c => !placedIds.has(c.id)).map(c => `<button class="opt${it._pick === c.id ? " sel" : ""}" type="button" data-c="${esc(c.id)}"><span class="t">${c.kind === "check" ? `<span class="chip">Check</span> ` : ""}${esc(c.text)}</span></button>`).join("")}</div>`}
    ${it.hint && !checked ? `<details class="hint"><summary>Hint</summary><p>${esc(it.hint)}</p></details>` : ""}
    ${it._report ? reportHTML(it, it._report) : ""}
  </section>`;
  stage.innerHTML = h;
  stage.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { it._pick = it._pick === b.dataset.c ? null : b.dataset.c; renderBuild(); }));
  stage.querySelectorAll("[data-place]").forEach(b => b.addEventListener("click", () => { (it._placed[b.dataset.place] = it._placed[b.dataset.place] || []).push(it._pick); it._pick = null; renderBuild(); }));
  stage.querySelectorAll("[data-un]").forEach(b => b.addEventListener("click", () => { if (checked) return; const a = it._placed[b.dataset.from]; a.splice(a.indexOf(b.dataset.un), 1); renderBuild(); }));
  const dl = $("#dlPlan"); if (dl) dl.addEventListener("click", downloadPlan);
  go.onclick = () => {
    if (checked) return next();
    checked = true;
    it._report = buildReport(it, it._placed, ph);
    score(it._report.clean);
    const rp = it._report, n = rp.flags.length + rp.misplaced.length + rp.missing.length;
    dock.className = "dock " + (rp.clean ? "good" : "bad");
    feedback(rp.clean ? "A clean report. Every look-for is met." : `Your report shows ${n} thing${n === 1 ? "" : "s"} to work on.`,
      `<p>${rp.clean ? "Download your plan to keep it." : "Read the report under your plan." + (S.phase === "main" ? " You'll get one chance to rebuild it at the end." : "")}</p>`);
    renderBuild();
    go.textContent = "Continue"; go.disabled = false;
  };
  if (!checked){ go.textContent = "Check my plan"; go.disabled = !placedIds.size; keys.textContent = `${placedIds.size} of ${it.cards.length} cards placed`; }
}
function reportHTML(it, rp){
  const lf = JG().lookFors, mi = JG().misapplications, card = id => it.cards.find(c => c.id === id);
  const why = f => f.because.startsWith("empty:") ? `No activity in ${jn(f.because.slice(6))}.` : f.because.startsWith("checks:") ? `Checks in ${f.because.slice(7)} phase${f.because.slice(7) === "1" ? "" : "s"}; the guide wants them throughout.` : `Card: “${card(f.because).text}”`;
  return `<div class="report">
    <h3>Feature report</h3>
    ${rp.flags.length || rp.misplaced.length ? `<h4>Watch-outs</h4>${rp.flags.map(f => `<div class="rp bad"><b>${esc(mi[f.mis].name)}.</b> ${esc(mi[f.mis].why)} <em>${esc(why(f))}</em><span>Fix: ${esc(mi[f.mis].fix)}</span></div>`).join("")}${rp.misplaced.map(m => `<div class="rp bad"><b>In the wrong phase.</b> “${esc(card(m.card).text)}” does ${esc(jn(m.does))}'s job, not ${esc(jn(m.in))}'s.</div>`).join("")}` : ""}
    <h4>Look-fors</h4>
    ${it.report.map(f => { const ok = rp.met.includes(f); return `<div class="rp ${ok ? "good" : "miss"}"><b>${ok ? "Met" : "Missing"} · ${esc(jn(lf[f].phaseId))}</b> ${esc(lf[f].question)}${ok ? "" : `<span>Strong evidence looks like: ${esc(lf[f].strong)}</span>`}</div>`; }).join("")}
    <div class="row2"><button class="ghost" type="button" id="dlPlan">Download my plan</button></div>
  </div>`;
}
function downloadPlan(){
  const it = cur, rp = it._report, lf = JG().lookFors, mi = JG().misapplications, card = id => it.cards.find(c => c.id === id);
  const md = [`# ${JG().name} plan: ${it.brief.who}`, "", it.brief.text, "",
    ...JG().phases.flatMap(p => { const ids = it._placed[p.id] || []; return [`## ${p.name}`, ...(ids.length ? ids.map(id => `- ${card(id).kind === "check" ? "Check: " : ""}${card(id).text}`) : ["- (nothing yet)"]), ""]; }),
    "## Feature report", "",
    ...rp.flags.map(f => `- Watch-out: ${mi[f.mis].name}. Fix: ${mi[f.mis].fix}`),
    ...rp.misplaced.map(m => `- Wrong phase: "${card(m.card).text}" does ${jn(m.does)}'s job, not ${jn(m.in)}'s`),
    ...it.report.map(f => `- [${rp.met.includes(f) ? "x" : " "}] ${jn(lf[f].phaseId)}: ${lf[f].question}`),
    "", `From ${S.lesson.title} (${S.lesson.id} v${S.lesson.version}), ${NAMES.game}, ${NAMES.product}.`].join("\n");
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], {type:"text/markdown"}));
    a.download = `${S.lesson.path}-plan.md`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch(e){ keys.textContent = "Your browser blocked the download."; }
}

/* ---------- sim: Prac Day, a branching run through a worked sequence ---------- */
const simNode = it => it.nodes.find(n => n.id === it._node);
/* The ending matches the run: the highest minGood the player's strong moves reach. */
const simEnding = it => { const good = it._trail.filter(t => t.good).length; return it.endings.filter(e => e.minGood <= good).sort((a,b) => b.minGood - a.minGood)[0]; };
const CSTATE = {surfaced:"Surfaced", hidden:"Hidden", challenged:"Challenged"};
function renderSim(){
  const it = cur, n = it._node === "end" ? null : simNode(it);
  const panel = `<div class="thinking"><span class="lbl">Class thinking</span>${it.conceptions.map((c,i) => `<div class="cn ${it._state[i] || "unheard"}"><span>${esc(c)}</span><b>${CSTATE[it._state[i]] || "Not heard yet"}</b></div>`).join("")}</div>`;
  let h = `<section class="card" style="--pc:${jp(it.at)}">${plateHTML(it)}
    <div class="chips"><span class="chip">${esc(it.processing)}</span><span class="chip">${n ? `Decision ${it._trail.length + 1}` : "Debrief"}</span></div>
    ${phaseTag(it)}${n ? `<p class="kind">${esc(n.when)}</p>` : ""}
    <p class="note" style="margin-top:0"><b>${esc(it.cast.who)}.</b> ${esc(it.cast.text)}</p>${panel}`;
  if (!n){
    const e = simEnding(it), good = it._trail.filter(t => t.good).length;
    h += `<h2>${esc(e.title)}</h2><p class="lead">${esc(e.text)}</p><p class="note">${good} of ${it._trail.length} moves were the stronger choice.</p><h3 class="dbh">Your decisions</h3>${it._trail.map((t,i) => `<div class="rp ${t.good ? "good" : "bad"}"><b>${i + 1}. ${esc(t.when || "")}</b> ${esc(t.text)}<span>${esc(t.debrief)}</span>${t.lookFor ? `<span class="lfq">${esc(jn(JG().lookFors[t.lookFor].phaseId))} look-for: ${esc(JG().lookFors[t.lookFor].question)}</span>` : ""}</div>`).join("")}`;
    stage.innerHTML = h + `</section>`;
    go.textContent = "Continue"; go.disabled = false; keys.textContent = "Enter to continue";
    go.onclick = () => next();
    window.scrollTo({top:0});
    return;
  }
  h += `<div class="vignette"><span class="who">${esc(n.when)}</span>${esc(n.situation)}</div>`;
  if (n.said) h += `<div class="said"><b>${esc(n.said.who)}:</b> ${esc(n.said.text)}</div>`;
  h += `<p class="q">What do you do?</p><div class="opts" role="radiogroup">${n.choices.map((c,i) => `<button class="opt" type="button" data-i="${i}" role="radio" aria-checked="false"><span class="k">${i + 1}</span><span class="t">${esc(c.text)}</span></button>`).join("")}</div>`;
  stage.innerHTML = h + `</section>`;
  cur._view = n.choices.map((c,i) => ({i}));
  stage.querySelectorAll(".opt[data-i]").forEach(b => b.addEventListener("click", () => choose(+b.dataset.i)));
  go.textContent = "Make this move"; go.disabled = true; keys.textContent = `Keys: 1–${n.choices.length} to choose, Enter to decide`;
  go.onclick = () => {
    if (checked){ it._node = it._last.next; return render(); }
    checked = true;
    const c = n.choices[sel]; it._last = c;
    c.surface.forEach(i => { if (it._state[i] !== "challenged") it._state[i] = "surfaced"; });
    c.hide.forEach(i => { if (it._state[i] !== "challenged") it._state[i] = "hidden"; });
    c.challenge.forEach(i => it._state[i] = "challenged");
    it._trail.push({when:n.when, text:c.text, good:c.good, debrief:c.debrief, lookFor:c.lookFor});
    score(c.good, `${it.id}:${n.id}`);
    stage.querySelectorAll(".opt[data-i]").forEach(b => { b.disabled = true; if (+b.dataset.i === sel){ b.classList.add(c.good ? "right" : "wrong"); verdict(b, c.good); } });
    const panelEl = stage.querySelector(".thinking"); if (panelEl) panelEl.outerHTML = `<div class="thinking"><span class="lbl">Class thinking</span>${it.conceptions.map((cc,i) => `<div class="cn ${it._state[i] || "unheard"}"><span>${esc(cc)}</span><b>${CSTATE[it._state[i]] || "Not heard yet"}</b></div>`).join("")}</div>`;
    dock.className = "dock " + (c.good ? "good" : "bad");
    const lf = c.lookFor ? JG().lookFors[c.lookFor] : null;
    feedback(c.good ? "A strong move." : "That move costs you later.", `<p>${esc(c.debrief)}</p>${lf ? `<p class="lfq">${esc(jn(lf.phaseId))} look-for: ${esc(lf.question)}</p>` : ""}`);
  };
  window.scrollTo({top:0});
}

/* ---------- results ---------- */
const SKILL = {design:"Designing a sequence", sim:"Teaching decisions", sequence:"Sequencing", diagnosis:"Diagnosing plans", misapplication:"Diagnosing plans", lookfor:"Using look-fors", engage:"Reading student ideas", select:"Choosing a model", flip:"Reading the dial", nesting:"Nesting models", prediction:"Prediction prompts"};
function summary(){
  cur = null;
  const l = S.lesson, r = rec(l.id), res = Object.entries(S.results), right = res.filter(([,v]) => v.ok).length;
  r.completed = true; r.of = res.length; r.best = Math.max(r.best || 0, right);
  r.missed = res.filter(([,v]) => !v.ok).map(([k]) => k);
  store.save(P);
  chrome("play", pathOf(l.path).title);
  hud();
  const groups = {};
  res.forEach(([,v]) => { const k = v.tests || "other"; (groups[k] = groups[k] || {v:0,n:0}).n++; if (v.ok) groups[k].v++; });
  const label = k => SKILL[k] || (JG().phases.some(p => p.id === k) ? `${jn(k)} moves` : k === "other" ? "Other" : k);
  const pr = l.items.find(i => i.type === "predict");
  let calib = "";
  if (pr && S.pred != null){
    const right1 = S.pred === pr.answer;
    calib = right1 ? (S.conf >= 70 ? "You predicted correctly and confidently." : "You predicted correctly but held back on confidence. Trust that reasoning.")
      : (S.conf >= 70 ? `You were ${S.conf}% sure of a wrong answer. Students are often just as sure, which is why Engage draws ideas out before correcting them.` : "Your first idea was tentative. That's the best moment to meet evidence.");
  }
  const nextL = D.lessons.find(x => x.path === l.path && x.order === l.order + 1);
  // A path this lesson has just opened: it depends on this path, is now open, and nothing on it is done yet.
  const newPath = D.paths.find(p => p.requires.some(q => q.path === l.path) && pathOpen(p) && !D.lessons.some(x => x.path === p.id && rec(x.id).completed));
  const lv = levelReached(l.path);
  const pg = pathOf(l.path).guide;
  const guideHref = pg ? `../reckoner/#/guide/${pg}${l.guideSection ? "/" + l.guideSection : ""}` : "../reckoner/";
  const guideText = pg ? `Read more in the ${G(pg).name} guide` : `Try your own class in ${NAMES.reckonerMid}`;
  const warm = S.warmRes.length ? `<div class="stat"><b>${S.warmRes.filter(Boolean).length}/${S.warmRes.length}</b><span>warm-up</span></div>` : "";
  stage.innerHTML = `<section class="card sum-head">
    <p class="kind">Lesson complete</p>
    <h2>${esc(l.title)}</h2>
    <div class="stats">
      <div class="stat"><b>${S.xp}</b><span>XP earned</span></div>
      <div class="stat"><b>${right}/${res.length}</b><span>right first time</span></div>
      ${warm || `<div class="stat"><b>${S.best}</b><span>best streak</span></div>`}
    </div>
    <div class="skills">${Object.entries(groups).map(([k,g]) => `<div class="skill" style="--pc:${jp(k)}"><span>${esc(label(k))}</span><span class="track"><i style="width:${100 * g.v / g.n}%"></i></span><span class="v">${g.v}/${g.n}</span></div>`).join("")}</div>
    ${calib ? `<p class="note"><b>Calibration.</b> ${esc(calib)}</p>` : ""}
    <div class="crowns"><h3>Mastery on the ${esc(pathOf(l.path).title)}</h3>
      <div class="lv">${D.mastery.map((m,i) => `<div class="${i <= lv ? "got" : i === lv + 1 ? "next" : ""}">${LEVEL[m]}</div>`).join("")}</div>
      <p class="note">Levels follow Marzano &amp; Kendall: retrieval, comprehension, analysis, then knowledge utilisation.</p>
    </div>
    ${S.reflection.trim() ? `<div class="recall" style="--engage:var(--evaluate)"><b>Your answer:</b> ${esc(S.reflection)}</div>` : ""}
    ${S.reflect[0] ? `<p class="note">${esc(S.reflect[0].model)}</p>` : ""}
    <div class="row2"><a class="ghost" href="${esc(guideHref)}">${esc(guideText)}</a></div>
    ${newPath && !D.review ? `<div class="recall" style="--engage:var(--good)"><b>Unlocked:</b> ${esc(newPath.title)}. ${esc(newPath.blurb)}</div>` : ""}
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
