#!/usr/bin/env node
// scripts/validate-studio.js
// Validation gate for the Habit Studio (docs/habit-studio-pilot-spec.md §8).
// Structure is enforced by JSON Schema (games/_schema/studio.schema.json); the
// rules a schema can't express are enforced here, in the same report format as
// validate-frameworks.js and validate-coach.js:
//   • every habit resolves to the framework named in studio.json (habitsFrom);
//     every item belongs to its folder's habit; ids are unique
//   • every context id resolves to the curriculum vocabulary
//   • only <b>, <i>, <sub> and <sup> in content strings (formulae need sub/sup)
//   • a published item is reviewed: source authored or ai-drafted-reviewed, and
//     reviewedBy names someone; a published explainer's citations are verified;
//     a published artefact has two expert placements by different people
//   • the two versions of a case pair are within 20% of each other in length
//   • transcript notes point at real lines; exemplar annotations quote text that
//     is in the exemplar; a brief has one strong, one flawed and one weak
//     exemplar; a unit plan introduces, practises, fades and then checks
//   • a habit with published content meets the spec's counts (3 case pairs, at
//     least two artefacts per rubric level, 2 briefs); drafts report progress
//
// Usage: node scripts/validate-studio.js      Exit code 0 = pass, 1 = fail.

import Ajv from 'ajv/dist/2020.js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { makeContextChecker } from './lib/game-context.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STUDIO = 'games/habit-studio';
const SCHEMA_REL = 'games/_schema/studio.schema.json';
const TAGS = ['b', 'i', 'sub', 'sup'];
const PUBLISHABLE = ['authored', 'ai-drafted-reviewed'];
// Spec §6 counts for a habit's station content.
const TARGET = { casePairs: 3, artefacts: [10, 12], perLevel: 2, briefs: 2 };

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const report = { errors: [], notes: [] };
const err = (where, msg) => report.errors.push({ where, msg });
const note = (msg) => report.notes.push(msg);

function finish(summary) {
  console.log(`\nHabit Studio — validation gate`);
  if (summary) console.log(`${report.errors.length ? '✗' : '✓'} ${summary}`);
  if (report.notes.length) {
    console.log(`\n${report.notes.length} note(s):`);
    for (const n of report.notes) console.log(`  · ${n}`);
  }
  if (report.errors.length) {
    console.log(`\n${report.errors.length} error(s):`);
    for (const e of report.errors) console.log(`  ✗ ${e.where}: ${e.msg}`);
    console.log('');
    process.exit(1);
  }
  console.log(`\nAll checks passed.\n`);
  process.exit(0);
}

if (!existsSync(join(ROOT, STUDIO, 'studio.json'))) {
  console.log('\nHabit Studio — no games/habit-studio/studio.json; nothing to check.\n');
  process.exit(0);
}

// ── schema ──────────────────────────────────────────────────────────────────────
const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema(readJson(SCHEMA_REL), 'studio');
const def = (name) => ajv.getSchema(`studio#/$defs/${name}`);
const validators = {
  manifest: def('manifest'), itemFile: def('itemFile'), explainer: def('explainer'), casePair: def('casePair'),
  rubric: def('rubric'), artefact: def('artefact'), brief: def('brief'), unitPlan: def('unitPlan'), rehearsal: def('rehearsal'),
};
function checkSchema(kind, value, where) {
  const v = validators[kind];
  if (v(value)) return true;
  for (const e of v.errors) err(where, `${e.instancePath || '/'} ${e.message}`);
  return false;
}

const manifestRel = `${STUDIO}/studio.json`;
const manifest = readJson(manifestRel);
if (!checkSchema('manifest', manifest, manifestRel)) finish();

// ── framework and vocabulary ──────────────────────────────────────────────────────
const fwDir = `frameworks/${manifest.habitsFrom}`;
if (!existsSync(join(ROOT, fwDir, 'framework.json'))) {
  err(manifestRel, `habitsFrom "${manifest.habitsFrom}" is not a framework in frameworks/`);
  finish();
}
const fw = readJson(`${fwDir}/framework.json`);
const habitIds = readJson(`${fwDir}/${fw.matrix.habits}`).map((h) => h.id);
const vocab = JSON.parse(readFileSync(resolve(ROOT, fwDir, fw.vocabulary), 'utf8'));
const checkContext = makeContextChecker(vocab);

// ── shared item rules ───────────────────────────────────────────────────────────────
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
function checkTags(where, value) {
  if (typeof value === 'string') {
    for (const [m, tag, attrs] of value.matchAll(TAG))
      if (!TAGS.includes(tag.toLowerCase()) || attrs.trim()) err(where, `only ${TAGS.map((t) => `<${t}>`).join(', ')} are allowed, found ${m}`);
  } else if (Array.isArray(value)) value.forEach((v, i) => checkTags(`${where}[${i}]`, v));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) if (k !== 'authorNote' && k !== '$schema') checkTags(`${where}.${k}`, v);
}
const plain = (s) => s.replace(/<[^>]+>/g, '');
const words = (lines) => lines.reduce((n, l) => n + plain(l.text).split(/\s+/).filter(Boolean).length, 0);

const seenIds = new Map();
function checkItem(item, habit, where) {
  if (seenIds.has(item.id)) err(where, `id "${item.id}" is also used in ${seenIds.get(item.id)}`);
  seenIds.set(item.id, where);
  if (item.habit !== habit) err(where, `habit is "${item.habit}" but the file is in the "${habit}" folder`);
  if (item.published) {
    if (!PUBLISHABLE.includes(item.source)) err(where, `published, but source is "${item.source}" (must be ${PUBLISHABLE.join(' or ')})`);
    if (!item.reviewedBy.length) err(where, 'published, but reviewedBy is empty');
    if (!item.lastReviewed) err(where, 'published, but lastReviewed is not set');
  }
  if (item.context) checkContext(where, item.context, err);
  checkTags(where, item);
}

// ── per-type rules ────────────────────────────────────────────────────────────────
const RULES = {
  explainer(x, where) {
    x.prompts.forEach((p) => {
      if (p.after > x.body.length) err(where, `prompt "${p.id}" follows paragraph ${p.after}, but there are ${x.body.length}`);
    });
    if (x.published && x.evidence.some((e) => e.verified !== true))
      err(where, 'published, but not every evidence citation is marked verified');
  },
  casePair(x, where) {
    for (const n of x.annotation.notes) {
      const lines = x.versions[n.version];
      if (n.line > lines.length) err(where, `a note points at line ${n.line} of version ${n.version}, which has ${lines.length} lines`);
    }
    const len = { a: words(x.versions.a), b: words(x.versions.b) };
    for (const v of ['a', 'b'])
      if (len[v] < 100 || len[v] > 280) note(`${where}: version ${v} is ${len[v]} words (the spec suggests 150–250)`);
    // The Coach's lesson: if the better version is also clearly the longer one, length gives the answer away.
    if (Math.min(len.a, len.b) < 0.8 * Math.max(len.a, len.b)) {
      const msg = `versions are ${len.a} and ${len.b} words; keep them within 20% of each other, or the longer one reads as the better one`;
      if (x.published) err(where, msg);
      else note(`${where}: ${msg}`);
    }
  },
  rubric(x, where) {
    const levels = x.levels.map((l) => l.level).join(',');
    if (levels !== '1,2,3,4') err(where, `levels must be 1, 2, 3, 4 in order (found ${levels})`);
  },
  artefact(x, where) {
    const real = x.placements.filter((p) => p.by !== 'draft');
    if (x.placements.some((p) => p.by === 'draft')) note(`${where}: has a provisional "draft" placement that still needs an expert`);
    if (new Set(real.map((p) => p.by)).size !== real.length) err(where, 'two placements are by the same reviewer');
    if (x.published && real.length < 2) err(where, `published, but has ${real.length} expert placement(s) (needs 2, by different reviewers)`);
  },
  brief(x, where) {
    const q = x.exemplars.map((e) => e.quality).sort().join(',');
    if (q !== 'flawed,strong,weak') err(where, `exemplars must be one strong, one flawed and one weak (found ${q})`);
    for (const e of x.exemplars)
      for (const a of e.annotations)
        if (!e.text.includes(a.quote)) err(where, `the ${e.quality} exemplar's annotation quotes text that isn't in it: "${a.quote}"`);
  },
  unitPlan(x, where) {
    const m = x.moments;
    m.forEach((mo, i) => {
      if (mo.week > x.weeks) err(where, `moment ${i + 1} is in week ${mo.week}, but the unit is ${x.weeks} weeks`);
      if (i && mo.week < m[i - 1].week) err(where, `moments are out of week order at moment ${i + 1}`);
    });
    const first = (k) => m.findIndex((mo) => mo.kind === k);
    const last = (k) => m.map((mo) => mo.kind).lastIndexOf(k);
    for (const k of ['introduce', 'practise', 'fade', 'check']) if (first(k) < 0) err(where, `the plan has no "${k}" moment`);
    if (first('fade') > -1 && first('introduce') > first('fade')) err(where, 'the scaffold fades before it is introduced');
    if (last('fade') > -1 && last('check') < last('fade')) err(where, 'there is no check after the scaffold fades');
  },
  rehearsal() {},
};

// ── walk the habits ──────────────────────────────────────────────────────────────────
const FILES = { explainer: 'explainer', cases: 'casePair', rubric: 'rubric', artefacts: 'artefact', briefs: 'brief', unitPlan: 'unitPlan', rehearsal: 'rehearsal' };
const LIST = new Set(['cases', 'artefacts', 'briefs']);
const summaries = [];

for (const h of manifest.habits) {
  if (!habitIds.includes(h.habit)) err(manifestRel, `habit "${h.habit}" is not a habit in ${fwDir}`);
  const got = {};
  for (const [key, type] of Object.entries(FILES)) {
    const rel = `${STUDIO}/${h.dir}/${h.files[key]}`;
    if (!existsSync(join(ROOT, rel))) {
      err(rel, 'file not found');
      continue;
    }
    let data;
    try {
      data = readJson(rel);
    } catch (e) {
      err(rel, `not valid JSON: ${e.message}`);
      continue;
    }
    if (LIST.has(key) && !checkSchema('itemFile', data, rel)) continue;
    const items = LIST.has(key) ? data.items : [data];
    got[key] = [];
    items.forEach((item, i) => {
      const where = LIST.has(key) ? `${rel} item ${i + 1} (${item.id || '?'})` : rel;
      const { $schema, ...body } = item;
      if (!checkSchema(type, body, where)) return;
      checkItem(body, h.habit, where);
      RULES[type](body, where);
      got[key].push(body);
    });
  }

  // Counts against the spec: errors once anything in the set is published, progress otherwise.
  const cases = (got.cases || []).filter((c) => (c.use || 'station') === 'station');
  const arts = (got.artefacts || []).filter((a) => (a.use || 'station') === 'station');
  const briefs = got.briefs || [];
  const perLevel = [1, 2, 3, 4].map((l) => arts.filter((a) => (a.placements.find((p) => p.by !== 'draft') || a.placements[0]).level === l).length);
  const published = [...cases, ...arts, ...briefs].some((x) => x.published);
  const progress =
    `${h.habit}: case pairs ${cases.length}/${TARGET.casePairs}, artefacts ${arts.length}/${TARGET.artefacts.join('–')} ` +
    `(by level ${perLevel.join('/')}), briefs ${briefs.length}/${TARGET.briefs}`;
  if (published) {
    if (cases.length < TARGET.casePairs) err(`habit ${h.habit}`, `has published content but ${cases.length} station case pairs (needs ${TARGET.casePairs})`);
    if (arts.length < TARGET.artefacts[0]) err(`habit ${h.habit}`, `has published content but ${arts.length} station artefacts (needs ${TARGET.artefacts[0]}–${TARGET.artefacts[1]})`);
    perLevel.forEach((n, i) => {
      if (n < TARGET.perLevel) err(`habit ${h.habit}`, `rubric level ${i + 1} has ${n} artefacts (needs at least ${TARGET.perLevel})`);
    });
    if (briefs.length < TARGET.briefs) err(`habit ${h.habit}`, `has published content but ${briefs.length} briefs (needs ${TARGET.briefs})`);
  }
  const all = Object.values(got).flat();
  const drafts = all.filter((x) => !x.published).length;
  note(`progress — ${progress}; ${all.length - drafts} published, ${drafts} draft`);
  summaries.push(h.habit);
}

finish(`${manifestRel} (v${manifest.version}) — ${summaries.length} habit(s): ${summaries.join(', ')}; habits from ${fwDir}`);
