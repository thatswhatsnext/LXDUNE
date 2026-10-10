// scripts/lib/game-context.js
// Shared by the games' validators (validate-coach.js, validate-studio.js): checks a
// scenario context against the curriculum vocabulary. A context is
// { stages, focusArea? | syllabus + module?, note?, acknowledgedSuperseded? }.

export function makeContextChecker(vocab) {
  const focusAreasByStage = new Map();
  for (const byStage of Object.values(vocab.focusAreas || {}))
    for (const [stage, list] of Object.entries(byStage))
      for (const fa of list) focusAreasByStage.set(fa.id, [...(focusAreasByStage.get(fa.id) || []), stage]);

  return function checkContext(where, ctx, err) {
    for (const s of ctx.stages) if (!vocab.stages[s]) err(where, `stage "${s}" is not in the vocabulary`);
    const syl = ctx.syllabus && vocab.syllabuses[ctx.syllabus];
    if (ctx.syllabus && !syl) err(where, `syllabus "${ctx.syllabus}" is not in the vocabulary`);
    if (syl) {
      for (const s of ctx.stages)
        if (!syl.stages.includes(s)) err(where, `syllabus "${ctx.syllabus}" does not cover "${s}"`);
      if (syl.supersededBy && ctx.acknowledgedSuperseded !== true)
        err(where, `syllabus "${ctx.syllabus}" is superseded by "${syl.supersededBy}" — set "acknowledgedSuperseded": true to use it deliberately`);
    }
    if (ctx.focusArea) {
      const stages = focusAreasByStage.get(ctx.focusArea);
      if (!stages) err(where, `focus area "${ctx.focusArea}" is not in the vocabulary`);
      else if (!ctx.stages.some((s) => stages.includes(s)))
        err(where, `focus area "${ctx.focusArea}" is not a focus area of ${ctx.stages.join(', ')}`);
    }
    if (ctx.module) {
      if (!ctx.syllabus) err(where, `module "${ctx.module}" needs its syllabus`);
      else if (!(vocab.modules[ctx.syllabus] || []).some((m) => m.id === ctx.module))
        err(where, `module "${ctx.module}" is not a module of "${ctx.syllabus}"`);
    }
    if (ctx.focusArea && ctx.module) err(where, 'a context has a focus area or a module, not both');
  };
}
