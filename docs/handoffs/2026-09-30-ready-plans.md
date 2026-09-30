# Handoff: Ready plans for the 8 example-only focus areas

**Reviewed and signed off by:** Steve Grant, 2026-09-30

**Branch:** `feature/reckoner-ready-plans`

## Goal

Give every NSW Science 7–10 focus area a ready plan in "Start with your unit". Eight focus areas currently show
examples only; this adds one worked sequence for each, so all sixteen show a ready plan. Content only.

## Scope

- **Changes:** `tools/reckoner/content/guides/5e.yaml`, `7e.yaml`, `levels-of-inquiry.yaml`, `poe.yaml`,
  `swh.yaml`; then the generated `reckoner/` and `docs/reckoner-state.md` via `npm run publish:pages`;
  `docs/ACTION-PLAN.md`
- **Must not change:** `adi.yaml`; any existing example, phase, look-for, worked sequence, misapplication,
  checklist item or nesting line in any guide; `catalogue.json`, `questions.json`, `methodology.yaml`;
  `src/schema/`, `scripts/`, `templates/`; `moodle-blocks/`, `config/`

## Before writing

Read `CLAUDE.md` and `docs/reckoner-state.md`, then report before changing anything:

1. The current version and `lastReviewed` of the five guides, and their current worked sequence ids (expected:
   5e three, 7e one, levels-of-inquiry one, poe two, swh one; nine in all)
2. That none of the eight new ids below already exists in any guide
3. Anything in this handoff that no longer matches the repo

Apply every change in place. Do not replace any guide file.

## Placement decisions (for the record)

- **Genetics and evolutionary change → 7E**, not SWH: the target conception (organisms change because they need
  to) is robust, which is what 7E's Elicit is for, and antibiotic resistance gives Extend a genuinely far context.
  Evolution can only be simulated in class, which suits SWH's question-driven testing less well. Clears the
  "7e: no Biology worked sequence" warning.
- **Observing the Universe → 7E**, not POE or 5E: a unit rather than a single lesson, for a robust conception
  (phases as Earth's shadow). It nests the lamp-and-ball POE in Explore, so it agrees with the existing POE
  examples, and it keeps 5E at six sequences rather than seven.
- No sequence tags a second focus area.

## Changes to existing files

### 1. `7e`: append worked sequence `7e-seq-s4-moon` to `workedSequences`

Focus area: Observing the Universe (Stage 4). Append after the guide's last existing worked sequence, before `misapplications:`, with one blank line between sequences.

```yaml
  - id: 7e-seq-s4-moon
    title: Why does the Moon change shape, and how do we know?
    context: { stages: [stage4], focusAreas: [Observing the Universe], disciplines: [earth-environmental] }
    contentOutcomes: [SC4-OTU-01]
    bigQuestion: What can careful watching of the sky tell us, and how far can it take us?
    learningIntentions:
      - The Moon's phases come from how much of its sunlit half we see from Earth as it orbits, not from Earth's shadow
      - Observations made systematically over time reveal patterns that a model then has to explain
      - New observations, from people and from instruments, have changed what is known about the Universe
    targetConceptions:
      - The phases are Earth's shadow falling on the Moon
      - The Moon only appears at night
      - Knowledge of the sky comes from telescopes, not from watching
    predictPrompt: Before reading on, the Moon diary starts in lesson 1, before any model is shown, and runs to lesson 7. Why start it so early, and what would be lost if it began in lesson 4?
    steps:
      - lessons: "1"
        phaseId: elicit
        activity: |
          Every student draws the Moon as it looks at four points in a month and writes why its shape changes,
          then answers one more question: can you ever see the Moon in daylight? Responses are sorted into
          Earth's shadow, something covering it, and where it is compared with the Sun, before the rest of the
          unit is planned.
        wsOutcomes: [SC4-WS-02]
        formativeCheck: Sorted set of initial explanations, kept for lesson 7
        scaffoldSlots:
          - field: activity
            prompt: If most of the class says Earth's shadow, what would you make sure the lamp-and-ball model in lesson 2 lets them test?
      - lessons: "1"
        phaseId: engage
        activity: |
          If the Moon is up during the lesson (check a moonrise table beforehand), the class goes outside to see
          it in daylight; otherwise, a photo of a daytime Moon taken from the school. Each student starts a Moon
          diary: every evening or morning they can, a sketch of its shape, where it sits in the sky, and the
          time. Driving question on the wall: why does it change, and how could we be sure?
        wsOutcomes: [SC4-WS-01]
        formativeCheck: First diary entry checked for shape, direction and time
      - lessons: "2"
        phaseId: explore
        activity: |
          A Predict–Observe–Explain with a lamp at the front of a darkened room and a polystyrene ball per
          student. Students predict the shape they will see at each quarter turn, then turn on the spot,
          sketch the lit part as they see it, and keep observation and interpretation in separate columns.
        wsOutcomes: [SC4-WS-01, SC4-WS-02]
        formativeCheck: Prediction sheets compared with sketches; who has noticed that their head never shadows the ball at first quarter
      - lessons: "3"
        phaseId: explore
        activity: |
          Groups use the model to predict what tonight's Moon should look like and roughly when and where it
          will be visible, then check their prediction against the class diaries so far and a planetarium app.
        wsOutcomes: [SC4-WS-05, SC4-WS-06]
        formativeCheck: Each group's written prediction and whether the diaries support it
      - lessons: "4"
        phaseId: explain
        activity: |
          Groups report where the model worked and where it did not. The teacher names the phases and
          introduces orbit and illumination from the class's own sketches, then takes on the shadow idea by
          name: Earth's shadow points away from the Sun, so it can only reach the Moon when the Moon is opposite
          the Sun, near full Moon, and when it does that is a lunar eclipse. A crescent appears when the Moon is close to the
          Sun in the sky, where no shadow of Earth could fall.
        wsOutcomes: [SC4-WS-06, SC4-WS-08]
        formativeCheck: Mini-whiteboard diagram placing Sun, Earth and Moon for a phase named by the teacher
      - lessons: "5"
        phaseId: elaborate
        activity: |
          Galileo's telescope observations of Venus. Groups use the lamp and ball to predict which shapes Venus
          could show if it always stayed between Earth and the Sun, as the Earth-centred model required, and
          which if it circled the Sun, then compare both with images of the
          phases of Venus. The point is an observation deciding between two models, not the history.
        wsOutcomes: [SC4-WS-02, SC4-WS-06]
        formativeCheck: Each group states which model the images support and which shape rules the other out
      - lessons: "6"
        phaseId: elaborate
        activity: |
          How the Moon and stars sit within a local Aboriginal seasonal calendar, as a session planned and led
          with the school's Aboriginal Education staff and local Aboriginal community. Students hear how
          long-term observation of the sky is tied to seasonal events on Country, and record what they learn in
          the words used by the people sharing it.
        wsOutcomes: [SC4-WS-01, SC4-WS-08]
        formativeCheck: Students record one connection between a sky observation and a seasonal event, as it was shared with them
        scaffoldSlots:
          - field: activity
            prompt: What would you need to have settled with your Aboriginal Education staff before this lesson, and whose decision is each of those things?
      - lessons: "7"
        phaseId: evaluate
        activity: |
          Lesson 1 drawings and the diaries are handed back. Students rewrite their explanation using what the
          diary recorded, then explain a photo of a thin crescent Moon near the setting Sun with a labelled
          diagram.
        wsOutcomes: [SC4-WS-05, SC4-WS-08]
        formativeCheck: Initial and rewritten explanations compared against the success criteria
      - lessons: "8–9"
        phaseId: extend
        activity: |
          A light curve from a distant star: brightness against time, dipping by a tiny, regular amount. Groups
          work out what could cause a regular dip before the word transit is used. The teacher then draws out
          the shared idea: in both cases knowledge comes from watching how light changes over time and asking
          what arrangement would produce it.
        wsOutcomes: [SC4-WS-05, SC4-WS-06, SC4-WS-08]
        formativeCheck: Each student states the shared idea across the Moon and the star
        scaffoldSlots:
          - field: formativeCheck
            prompt: What would a student say that shows they have matched the Moon and the star on surface features, such as both being in space, rather than on the underlying idea?
    whyItWorks:
      - Elicit runs before any model is shown, so the shadow idea is recorded rather than hidden
      - The diary gives every student data of their own that the model must fit, and it is still running when Explain arrives
      - Venus gives the model a real test, where the observation decides between two pictures of the Solar System
      - Extend moves to evidence no one can see directly, so the idea of reading changes in light has to be found rather than recalled
    watchFor: |
      Cloud, and the fact that the Moon is a morning object for part of every month, will leave gaps in the
      diaries. Plan for them: pool the class's entries and fill the rest from published images, and make
      the gaps part of the discussion about how observers work.
      Lesson 6 depends on relationships you build well before the unit. If it cannot be planned with your
      Aboriginal Education staff and local community, leave it out rather than teaching it from a website.
    safetyNotes: |
      This guide does not carry safety advice and is not a substitute for your school's risk assessment.
      What this sequence introduces, so you know what to assess: observing the sky outdoors during the day,
      when the Sun is nearby and students must never look at it, directly or through anything; a lamp in a
      darkened room full of students turning on the spot; and diary entries made at home in the evening,
      outside school supervision. Take these to your head teacher or faculty safety contact and check them
      against your school's practical and homework procedures and current NSW guidance before you run
      anything.

      One point specific to 7E. Extend moves the idea into a context the sequence has not been in before.
      Here that is secondary data only, so it adds little to assess, but if the class takes it further, such
      as into a night viewing, that needs assessing on its own terms.
    provenance: { source: ai-drafted-reviewed, authors: ["Claude"], reviewedBy: ["Steve Grant"], reviewedOn: 2026-09-30 }
```

### 2. `7e`: append worked sequence `7e-seq-s5-evolution` to `workedSequences`

Focus area: Genetics and evolutionary change (Stage 5). Append after the guide's last existing worked sequence, before `misapplications:`, with one blank line between sequences.

```yaml
  - id: 7e-seq-s5-evolution
    title: How does a population change when no individual can?
    context: { stages: [stage5], focusAreas: [Genetics and evolutionary change], disciplines: [biology] }
    contentOutcomes: [SC5-GEV-01]
    bigQuestion: How do populations come to suit their environment, and why is there so much variety in living things?
    learningIntentions:
      - Natural selection acts on variation that already exists in a population; individuals do not change to suit their environment
      - Over many generations, selection changes how common inherited characteristics are in a population
      - Shared ancestry followed by divergence accounts for much of the diversity of living things
    targetConceptions:
      - Organisms change because they need to, or because they try to
      - Characteristics gained during a lifetime are passed on
      - Individuals evolve
    predictPrompt: Before reading on, the camouflage simulation in lessons 2 and 3 only works if one thing is true of the first generation. What is it, and what happens to the argument if a group forgets it?
    steps:
      - lessons: "1"
        phaseId: elicit
        activity: |
          Every student writes how each of three things came to be: a polar bear's white coat, a fast
          cheetah, and a stick insect that looks like a twig. The teacher sorts the responses into needed
          it, used it, and some already had it and survived, before planning the rest of the unit.
        wsOutcomes: [SC5-WS-02]
        formativeCheck: Sorted set of initial explanations, kept for lesson 7
        scaffoldSlots:
          - field: activity
            prompt: If most responses say the animals changed because they needed to, what must the simulation in lessons 2 and 3 make impossible to miss?
      - lessons: "1"
        phaseId: engage
        activity: |
          The rabbit and myxoma virus story in Australia: the virus released to control rabbits killed almost
          all of them at first, and within a decade far fewer infected rabbits were dying. Driving question for
          the unit goes on the wall: what changed, the rabbits, the virus, or both, and how?
        wsOutcomes: [SC5-WS-01, SC5-WS-02]
        formativeCheck: Each student writes which of their lesson 1 ideas could explain the rabbits and which could not
      - lessons: "2–3"
        phaseId: explore
        activity: |
          A camouflage simulation. Paper "prey" in several colours are scattered on a patterned fabric
          habitat; "predators" collect as many as they can in a set time; survivors each add offspring of their
          own colour. Groups run four or more generations, record the count of each colour, and graph the
          change. A second round changes the habitat fabric partway through.
        wsOutcomes: [SC5-WS-04, SC5-WS-05]
        formativeCheck: Data tables and graphs checked mid-collection; each group asked whether any single prey changed colour
      - lessons: "4"
        phaseId: explain
        activity: |
          Groups present their graphs. The teacher introduces variation, inheritance, selection and time from
          the class's own results, and addresses the needed-it idea by name: no paper square changed colour,
          yet the population did. Mutation is named as where new variation comes from. The rabbit story is
          revisited with the same four ideas.
        wsOutcomes: [SC5-WS-06, SC5-WS-08]
        formativeCheck: Mini-whiteboard account of the rabbits using variation, inheritance, selection and time
      - lessons: "5–6"
        phaseId: elaborate
        activity: |
          From one population to many kinds. Groups compare forelimb bones across a set of mammals and read a
          simplified evolutionary tree of a familiar Australian group, then explain how shared ancestry and
          different selection pressures could produce the diversity they see. Each group writes a short
          explanation another group checks against the tree.
        wsOutcomes: [SC5-WS-05, SC5-WS-06, SC5-WS-08]
        formativeCheck: Peer check of each explanation against the tree and the limb evidence
      - lessons: "7"
        phaseId: evaluate
        activity: |
          Lesson 1 responses are handed back. Students rewrite all three and explain what changed. Short task:
          explain a documented change in an unfamiliar population, such as sheep blowflies in a district where
          the same insecticide has been used for many years becoming harder to kill with it.
        wsOutcomes: [SC5-WS-08]
        formativeCheck: Initial and rewritten explanations compared against the success criteria
      - lessons: "8–9"
        phaseId: extend
        activity: |
          Antibiotic resistance, from secondary data on infections that no longer respond to a first-choice
          antibiotic. Groups work out why resistance rises and why stopping a course early or overusing
          antibiotics might matter, before anything is named. The teacher then draws out that this is the same
          selection, on a timescale of days, and the class discusses what carries across and what does not.
        wsOutcomes: [SC5-WS-06, SC5-WS-07, SC5-WS-08]
        formativeCheck: Each student states the shared principle across the rabbits, the paper prey and the bacteria
        scaffoldSlots:
          - field: formativeCheck
            prompt: A student says the bacteria "became immune" to the antibiotic. What does that tell you, and what would you ask next?
    whyItWorks:
      - Elicit runs before the rabbit story, so the needed-it idea is on paper before anything could correct it
      - In the simulation no individual can change, so the population change has to be explained by selection
      - The rabbit story returns in Explain and Evaluate, so the unit answers the question it opened with
      - Extend moves to bacteria and to medical decisions, far enough from paper squares that the idea has to transfer
    watchFor: |
      The simulation fails quietly if the first generation has only one colour or if "offspring" are added
      in a colour the survivors did not have. Check both before groups start, because the whole argument
      rests on variation being there at the beginning.
      Some students and families hold views about evolution that come from faith. Teach the science as
      science, respectfully, and keep the question on evidence rather than on belief.
    safetyNotes: |
      This guide does not carry safety advice and is not a substitute for your school's risk assessment.
      What this sequence introduces, so you know what to assess: very little in the room, as the practical
      work is a paper simulation. Extend uses secondary data only; if you are tempted to culture bacteria to
      show resistance, that is a microbiology practical in its own right and needs assessing as one. Take
      the sequence to your head teacher or faculty safety contact and check it against your school's
      practical procedures and current NSW guidance before you run anything.

      Separate from the risk assessment: the rabbit story involves a disease deliberately released to kill
      animals, and antibiotic resistance can touch a student's own experience of illness. Neither needs
      avoiding, but both are worth introducing with that in mind.
    provenance: { source: ai-drafted-reviewed, authors: ["Claude"], reviewedBy: ["Steve Grant"], reviewedOn: 2026-09-30 }
```

### 3. `poe`: append worked sequence `ep-s4-steel-wool` to `workedSequences`

Focus area: Change (Stage 4). Append after the guide's last existing worked sequence, before `misapplications:`, with one blank line between sequences.

```yaml
  - id: ep-s4-steel-wool
    title: Will burning make it lighter?
    context: { stages: [stage4], focusAreas: [Change], disciplines: [chemistry] }
    contentOutcomes: [SC4-CHG-01]
    bigQuestion: When something burns, where does the matter go, and what does energy have to do with it?
    learningIntentions:
      - Burning is a chemical change in which substances combine to form new ones
      - Mass is not lost in a chemical change; it can come from, or go into, the air
      - Energy is needed to start some chemical changes, and some changes release energy as they happen
    targetConceptions:
      - Burning destroys matter, so things always get lighter
      - Gases have no mass
      - A flame is a substance that is used up
    predictPrompt: Before reading on, most of the class will predict the mass goes down. Why is it important that the slips are collected before the steel wool is lit, rather than discussed first?
    steps:
      - minutes: "0–5"
        phaseId: predict
        activity: |
          A loose ball of steel wool on a heatproof mat on a digital balance, under the visualiser. The teacher
          records the mass, says it will be heated and weighed again, and every student writes what the balance
          will read afterwards and why. Slips are collected before anything is lit.
        wsOutcomes: [SC4-WS-02]
        formativeCheck: Written predictions with reasons, collected unseen
        scaffoldSlots:
          - field: activity
            prompt: A student predicts the mass will go up "because burnt things are heavier". Is that the same understanding as the scientific one? What would you ask?
      - minutes: "5–10"
        phaseId: predict
        activity: |
          The class tallies predictions (goes down, stays the same, goes up) without discussion. The teacher
          adds one more question: what will it take to get it burning at all, and once it starts, will it
          need more help to keep going?
        wsOutcomes: [SC4-WS-02]
        formativeCheck: Class tally on the board
      - minutes: "10–25"
        phaseId: observe
        activity: |
          The teacher touches a 9 V battery to the steel wool, or holds a flame to it briefly, and lets the glow
          spread. Students record the balance reading every thirty seconds, the colour and texture before and
          after, and whether the glow keeps going on its own, in an observation column separate from their
          interpretation.
        wsOutcomes: [SC4-WS-01, SC4-WS-05]
        formativeCheck: Observation tables checked for separation of observation and inference
      - minutes: "25–42"
        phaseId: explain
        activity: |
          Pairs compare prediction with observation and write what would have to be true for both. The teacher
          consolidates: the iron combined with oxygen from the air to form a new substance, iron oxide, so the
          mass gained is oxygen. The spark supplied the energy to start the change, and the glow spreading
          on its own shows the change releases energy as it goes. She then asks why paper gets lighter when it
          burns, and lets pairs answer with the same idea.
        wsOutcomes: [SC4-WS-06, SC4-WS-08]
        formativeCheck: Revised explanations shared; the paper question answered by each pair
      - minutes: "42–50"
        phaseId: explain
        activity: 'Exit ticket: "I predicted… I observed… Now I think… The energy came from…"'
        wsOutcomes: [SC4-WS-08]
        formativeCheck: Exit tickets sorted to plan the next lesson
    whyItWorks:
      - The result is the opposite of what most students expect, and it is read off a balance everyone can see
      - The energy question is asked before lighting, so what starts and sustains the change is observed rather than told
      - The paper question after the explanation checks whether students have the idea or only the result
      - The exit ticket gives the teacher evidence to plan the next lesson
    watchFor: |
      Steel wool that is packed too tightly will not burn through and gives a tiny change. Tease it out
      loosely and run the demonstration beforehand on the same balance.
      This episode covers the chemical half of Change. The geological half, energy driving weathering and the
      rock cycle, needs its own lesson; the freeze–thaw example in the Explain phase is a ready starting point.
    safetyNotes: |
      This guide does not carry safety advice and is not a substitute for your school's risk assessment.
      What this sequence introduces, so you know what to assess: burning steel wool, which glows and can
      drop hot fragments, beside a digital balance, with a battery or flame as the ignition source. Take this
      to your head teacher or faculty safety contact and check it against your school's chemical and practical
      procedures and current NSW guidance before you run anything.

      One point specific to POE. You supply the event, so you know in advance exactly what will be in the
      room. The thing to watch is that the event is chosen to surprise the students; make sure it does not
      also surprise you by running it first with the same steel wool and balance.
    provenance: { source: ai-drafted-reviewed, authors: ["Claude"], reviewedBy: ["Steve Grant"], reviewedOn: 2026-09-30 }
```

### 4. `swh`: append worked sequence `swh-seq-s4-separation` to `workedSequences`

Focus area: Solutions and mixtures (Stage 4). Append after the guide's last existing worked sequence, before `misapplications:`, with one blank line between sequences.

```yaml
  - id: swh-seq-s4-separation
    title: How much of each can we get back?
    context: { stages: [stage4], focusAreas: [Solutions and mixtures], disciplines: [chemistry] }
    contentOutcomes: [SC4-SOL-01]
    bigQuestion: How do we separate a mixture, and how would we know we got everything back?
    learningIntentions:
      - Each separation technique works because of a property that differs between the substances in a mixture
      - The order of separation steps matters, and follows from those properties
      - A claim about how well a method worked is defended with measured evidence
    targetConceptions:
      - Dissolved salt has disappeared, so it cannot be got back
      - Filtering removes everything that is not water
      - A method either works or does not; how well it works cannot be measured
    predictPrompt: Before reading on, the teacher knows exactly how much of each substance went into the mixture but does not say until lesson 6. What does holding that back make possible?
    steps:
      - lessons: "1"
        phaseId: beginning-ideas
        activity: |
          Each bench gets a beaker of murky mixture: sand, salt, iron filings and water. The teacher weighed
          every component in and keeps the figures. Ten minutes to look, stir and handle a sample, then each
          student writes what they would need to find out to get each substance back, and conferences it
          briefly for testability.
        wsOutcomes: [SC4-WS-02]
        formativeCheck: Each student's written question, checked for investigability
      - lessons: "2"
        phaseId: tests
        activity: |
          Groups plan a separation from the equipment available: magnets in sealed bags, filter funnels and
          papers, evaporating basins, and a heat source. Each plan names the property each step relies on and
          how the recovered substances will be measured. The teacher conferences each plan for safety and
          feasibility without redesigning it.
        wsOutcomes: [SC4-WS-03]
        formativeCheck: Plan conference before equipment is issued
        scaffoldSlots:
          - field: formativeCheck
            prompt: A group plans to evaporate all the water first. What do you ask so they work out what that will leave them with, without telling them?
      - lessons: "3–4"
        phaseId: observations
        activity: |
          Groups carry out their separation, dry and weigh what they recover, and record what happened
          separately from what they think it means. Losses and contamination, such as salt left on the sand, are
          written down rather than hidden.
        wsOutcomes: [SC4-WS-01, SC4-WS-04, SC4-WS-05]
        formativeCheck: Observation records checked for measured masses and separation from interpretation
      - lessons: "5"
        phaseId: claims
        activity: |
          Each student writes an individual claim answering their own beginning question, such as which step
          lost the most salt and why, in a form another student could disagree with.
        wsOutcomes: [SC4-WS-06]
        formativeCheck: Each claim read for whether it could be argued with
      - lessons: "5"
        phaseId: evidence
        activity: |
          Students select the masses and observations that support their claim, name the property behind each
          step, and account for anything that does not fit, such as recovering more "sand" than went in.
        wsOutcomes: [SC4-WS-06, SC4-WS-08]
        formativeCheck: The link between claim and data, read on every student's work
      - lessons: "6"
        phaseId: reading
        activity: |
          Groups pair up and compare claims, working out where they differ and why. Only then does the teacher
          release the masses that went in, and a short reading on how a water treatment plant or a desalination
          plant separates what it takes out. Revisions are written, not just discussed.
        wsOutcomes: [SC4-WS-06, SC4-WS-08]
        formativeCheck: Record of where each student agreed, disagreed and revised
      - lessons: "6"
        phaseId: reflection
        activity: |
          Beginning questions are handed back. Students write what they first thought happened to the salt,
          what changed their mind, and which property they would now say matters most in their method.
        wsOutcomes: [SC4-WS-08]
        formativeCheck: Written comparison of beginning ideas and final claim
    whyItWorks:
      - Measuring what is recovered turns "it worked" into a claim that can be argued with numbers
      - Groups choose the order of steps, so disagreements about order are about properties, not instructions
      - The true masses arrive in lesson 6, after students have their own results to set against them
      - Beginning questions are kept from lesson 1, so the final reflection has something to compare against
    watchFor: |
      Groups that finish the separation and treat the rest as tidying up. The claim and evidence lesson is
      where the teacher's time goes, asking one student at a time why their numbers support what they
      wrote. Expect recovered masses that are too high: damp sand and salt caught in the filter paper are
      the discussion, not a failure.
    safetyNotes: |
      This guide does not carry safety advice and is not a substitute for your school's risk assessment.
      What this sequence introduces, so you know what to assess: evaporating salt solution to dryness, which
      can spit hot crystals near the end; a heat source used by students; iron filings, which are a nuisance
      in eyes and on magnets; and glassware. Take these to your head teacher or faculty safety contact and
      check them against your school's chemical and practical procedures and current NSW guidance before you
      run anything.

      One point specific to SWH. Students design the method from their own question, so the hazards are not
      fully known when you write the risk assessment. If the assessment rules part of a design out, that
      constraint belongs to the students at the plan checkpoint, where working out what is testable within
      the rules is part of the task.
    provenance: { source: ai-drafted-reviewed, authors: ["Claude"], reviewedBy: ["Steve Grant"], reviewedOn: 2026-09-30 }
```

### 5. `5e`: append worked sequence `seq-s4-elements` to `workedSequences`

Focus area: Periodic table and atomic structure (Stage 4). Append after the guide's last existing worked sequence, before `misapplications:`, with one blank line between sequences.

```yaml
  - id: seq-s4-elements
    title: Why copper for wires and helium for balloons?
    context: { stages: [stage4], focusAreas: [Periodic table and atomic structure], disciplines: [chemistry] }
    contentOutcomes: [SC4-PRT-01]
    bigQuestion: Why do we use the elements and compounds we do, and how did we come to know which to use?
    learningIntentions:
      - Elements are made of one kind of atom; compounds contain atoms of different elements joined together
      - The periodic table groups elements with similar properties, and its layout reflects the structure of their atoms
      - The use of a substance follows from its properties, and new discoveries about properties have changed how substances are used
    targetConceptions:
      - Atoms of an element have the element's properties, so copper atoms are orange and bendy
      - The periodic table is arranged alphabetically or at random
      - Atom diagrams are pictures of what atoms look like
      - Elements and compounds are the same thing
    predictPrompt: Before reading on, the class builds its own families in lesson 3 before seeing the periodic table. What does that make possible in lesson 4 that showing the table first would not?
    steps:
      - lessons: "1"
        phaseId: engage
        activity: |
          A tray of everyday things: copper wire, aluminium foil, a pencil, a photo of a helium balloon and one
          of a neon sign, table salt and a glass of water. Students write what each is made of, whether it is
          an element or not, and why that material was chosen for the job. Answers go on a class thinking wall.
        wsOutcomes: [SC4-WS-02]
        formativeCheck: Individual prediction cards, kept for lesson 8
      - lessons: "2"
        phaseId: explore
        activity: |
          Stations with sealed samples of common elements to observe, and supplied strips and rods, such as
          copper, aluminium, zinc and a carbon rod, to test. Groups record lustre, whether each strip bends or
          snaps, and whether it conducts in a low-voltage circuit, in a shared table.
        wsOutcomes: [SC4-WS-01, SC4-WS-04, SC4-WS-05]
        formativeCheck: Shared results table checked for consistency across groups
      - lessons: "3"
        phaseId: explore
        activity: |
          Groups sort twenty unnamed element cards into families of their own, using melting point, density,
          appearance and reactivity with water, and write the rule behind each family.
        wsOutcomes: [SC4-WS-05, SC4-WS-06]
        formativeCheck: Each group's families and rules photographed before lesson 4
      - lessons: "4"
        phaseId: explain
        activity: |
          Groups present their sort and defend one family. The teacher builds the actual table from where the
          class agreed, marks where groups split, and then introduces protons, neutrons and electrons, with a
          Bohr diagram, a dot diagram and the element's position side by side, asking what each shows and what
          it does not.
        wsOutcomes: [SC4-WS-06, SC4-WS-08]
        formativeCheck: Mini-whiteboard; place an unfamiliar element in its group from its properties
        scaffoldSlots:
          - field: activity
            prompt: Which group's sort would you start from, and which split between groups would you use to introduce electron shells?
      - lessons: "5"
        phaseId: explain
        activity: |
          Elements, compounds and mixtures from the lesson 1 tray, with particle diagrams. Then Mendeleev's
          gaps: he left spaces for elements not yet found and predicted their properties, and later discoveries
          matched. Guided practice classifying substances and reading the table for properties.
        wsOutcomes: [SC4-WS-06, SC4-WS-08]
        formativeCheck: Exit ticket classifying five substances with a reason for each
      - lessons: "6–7"
        phaseId: elaborate
        activity: |
          Each group investigates how knowledge of one substance changed its use, for example aluminium, once
          too costly to extract to use widely and now in cans and foil, or an element used in phone
          batteries. Groups present the property, the discovery and the use, and link each to the table.
        wsOutcomes: [SC4-WS-07, SC4-WS-08]
        formativeCheck: Research log checkpoints; peer feedback on the property-to-use link
        scaffoldSlots:
          - field: formativeCheck
            prompt: What would show that a group has linked the use to a property, rather than listing facts about the element?
      - lessons: "8"
        phaseId: evaluate
        activity: |
          Students revisit their lesson 1 cards and correct them, then explain an unfamiliar choice, such as
          why tungsten was used in old light-bulb filaments, using its position in the table and its properties.
        wsOutcomes: [SC4-WS-08]
        formativeCheck: Summative task against success criteria
    whyItWorks:
      - Students build families from data before seeing the table, so the table arrives as an answer to their own question
      - Three representations are shown side by side, so no one diagram is mistaken for a picture of an atom
      - Mendeleev's gaps show discovery driven by the table's pattern, which is the outcome's point about knowledge shaping use
      - The Engage tray is the thing Evaluate returns to, so the storyline closes
    watchFor: |
      Lesson 4 can become a lecture on atomic structure. Keep the shells tied to the families the class
      built, and hold back anything the sort does not need.
    safetyNotes: |
      This guide does not carry safety advice and is not a substitute for your school's risk assessment.
      What this sequence introduces, so you know what to assess: students handling element samples, some of
      which may be toxic or reactive in the open, which is why this sequence uses sealed samples and supplied
      strips; and a low-voltage circuit. Reactivity with water appears on the cards as data, not as a
      demonstration. Take these to your head teacher or faculty safety contact and check them against your
      school's chemical and practical procedures and current NSW guidance before you run anything.
    provenance: { source: ai-drafted-reviewed, authors: ["Claude"], reviewedBy: ["Steve Grant"], reviewedOn: 2026-09-30 }
```

### 6. `levels-of-inquiry`: append worked sequence `seq-s4-reaction-time` to `workedSequences`

Focus area: Data science 1 (Stage 4). Append after the guide's last existing worked sequence, before `misapplications:`, with one blank line between sequences.

```yaml
  - id: seq-s4-reaction-time
    title: Can we predict how fast someone will react?
    context: { stages: [stage4], focusAreas: [Data science 1], disciplines: [integrated] }
    contentOutcomes: [SC4-DA1-01]
    bigQuestion: How can data help us describe, model and predict something as variable as human reaction time?
    learningIntentions:
      - Repeated measurements vary, and averages and spread describe that variation
      - A trend in data can be modelled, for example with a line of best fit, and the model used to make a prediction
      - A prediction is tested by collecting new data, and its accuracy depends on the data behind it
    targetConceptions:
      - One measurement tells you someone's reaction time
      - If two averages differ, there is a real difference
      - A graph shows the answer; it does not need interpreting
    predictPrompt: Before reading on, the model students build in lessons 4 to 6 is tested against data they have not yet collected. Why does that matter more than how well the line fits the data it came from?
    steps:
      - lessons: "1"
        phaseId: confirmation
        activity: |
          Ruler-catch technique with the method and the expected pattern supplied: thumb and finger level with
          zero, release without warning, ten trials. Students convert catch distance to reaction time using a
          supplied conversion graph, and the teacher points out that the graph is itself a model.
        wsOutcomes: [SC4-WS-01, SC4-WS-04]
        formativeCheck: Observation of technique against a checklist; conversions checked
      - lessons: "2–3"
        phaseId: structured
        activity: |
          Supplied question and method: is your dominant hand faster? Pairs collect twenty results each and pool
          them as a class. Students choose how to represent the data and write what their representation shows,
          including whether the spread makes them confident there is a difference.
        wsOutcomes: [SC4-WS-05, SC4-WS-06]
        formativeCheck: Representations and conclusions checked against the data and its spread
        scaffoldSlots:
          - field: activity
            prompt: Several groups draw a bar chart of averages and two draw dot plots. Which would you put side by side for the class, and what question would you ask?
      - lessons: "4–6"
        phaseId: guided
        activity: |
          Question supplied: does practice improve reaction time, and can we predict a score after thirty
          trials? Groups design the method, plot reaction time against trial number in a spreadsheet, fit a
          trend line, and use it to predict later trials. They then collect the new trials and compare with the
          prediction.
        wsOutcomes: [SC4-WS-03, SC4-WS-05, SC4-WS-06]
        formativeCheck: Plan conference on trials, rest and recording; each group's prediction written before the new trials
      - lessons: "7–10"
        phaseId: open
        activity: |
          Students pose their own question about reaction time, such as a sound cue against a light cue, or
          catching with and without a distraction. They conference it for feasibility and ethics, then plan,
          collect, model and report, ending with a prediction their data supports and how confident they are in
          it.
        wsOutcomes: [SC4-WS-02, SC4-WS-03, SC4-WS-07, SC4-WS-08]
        formativeCheck: Question conference and plan review before work starts
        scaffoldSlots:
          - field: formativeCheck
            prompt: A group wants to test whether an energy drink makes people faster. What do you say, and what question could they ask instead?
    whyItWorks:
      - Technique is taught at confirmation level, where it is the actual target, so later data is worth modelling
      - The structured task makes spread visible before any model is built, so students meet variation before trend
      - At guided level the model is tested against new data, which is what makes it a prediction rather than a description
      - The same context runs throughout, so the increase in independence is not also an increase in content load
    watchFor: |
      Reaction time data from students is data about students. Pool it without names, never rank individuals
      in front of the class, and let a student sit out as the tester rather than the subject.
      If groups at guided level cannot yet control rest and warm-up between trials, spend another cycle there
      rather than moving to open on schedule.
    safetyNotes: |
      This guide does not carry safety advice and is not a substitute for your school's risk assessment.
      What this sequence introduces, so you know what to assess: very little equipment, but students
      collecting data on each other, which raises consent and privacy rather than physical hazards; and, at
      open level, questions students choose themselves. Rule out any question involving food, drink or other
      substances, lost sleep, or physical exertion. Take the sequence to your head teacher or faculty safety
      contact and check it against your school's procedures and current NSW guidance before you run anything.

      One point specific to Levels of inquiry. At open level the question belongs to the students, so the
      hazards are not known when you write the risk assessment. The question conference is where those limits
      reach students, as part of working out what is investigable.
    provenance: { source: ai-drafted-reviewed, authors: ["Claude"], reviewedBy: ["Steve Grant"], reviewedOn: 2026-09-30 }
```

### 7. `5e`: append worked sequence `seq-s5-rates` to `workedSequences`

Focus area: Reactions (Stage 5). Append after the guide's last existing worked sequence, before `misapplications:`, with one blank line between sequences.

```yaml
  - id: seq-s5-rates
    title: Why do some reactions go faster than others?
    context: { stages: [stage5], focusAreas: [Reactions], disciplines: [chemistry] }
    contentOutcomes: [SC5-RXN-02]
    bigQuestion: What controls how fast a chemical reaction happens, and how can we use that?
    learningIntentions:
      - Temperature, concentration, surface area and catalysts change the rate of a reaction
      - Collision theory explains these effects in terms of how often, and how energetically, particles collide
      - Rate can be measured and compared by tracking a product or a reactant over time
    targetConceptions:
      - Heating makes particles bigger, so they react more
      - A catalyst is used up in the reaction
      - Crushing a solid changes what it is made of
    predictPrompt: Before reading on, collision theory is not named until lesson 4, although the class has been measuring rates since lesson 2. What is gained by waiting?
    steps:
      - lessons: "1"
        phaseId: engage
        activity: |
          Three glow sticks are activated at once; one goes into iced water, one into warm water and one stays
          on the bench. Students predict and explain the brightness of each over five minutes, then write what
          they think is happening inside the stick.
        wsOutcomes: [SC5-WS-02]
        formativeCheck: Individual prediction cards, kept for lesson 8
      - lessons: "2–3"
        phaseId: explore
        activity: |
          Groups time effervescent tablets dissolving in water at four temperatures, then crushed versus whole.
          A second station tracks the mass lost as marble chips react with dilute acid at two concentrations.
          Groups graph their results. The teacher asks what might be happening to the particles, without
          introducing collision theory yet.
        wsOutcomes: [SC5-WS-03, SC5-WS-04, SC5-WS-05]
        formativeCheck: Questioning; check graphs and variable control
      - lessons: "4"
        phaseId: explain
        activity: |
          Groups present their graphs. The teacher introduces collision theory from the class data, using a
          reactions-and-rates simulation to show collision frequency and energy, and addresses the idea that
          heating makes particles bigger by name.
        wsOutcomes: [SC5-WS-06, SC5-WS-08]
        formativeCheck: Mini-whiteboard particle diagrams for one factor
        scaffoldSlots:
          - field: activity
            prompt: Which group's graph would you use first to introduce collision theory, and why that factor?
      - lessons: "5"
        phaseId: explain
        activity: |
          Teacher demonstration of hydrogen peroxide decomposing with and without a catalyst. The catalyst is
          weighed before, then filtered out and dried overnight and weighed again, so students can see it is
          not used up. Guided practice explaining
          each factor with collision theory.
        wsOutcomes: [SC5-WS-01, SC5-WS-06, SC5-WS-08]
        formativeCheck: Exit ticket with one factor explained in particle terms
      - lessons: "6–7"
        phaseId: elaborate
        activity: |
          Design challenge: slow the browning of cut apple. Groups choose one factor to test, run the test and
          explain the result with collision theory, then connect it to one real use of rate control, such as
          refrigerating food or storing flour away from ignition sources.
        wsOutcomes: [SC5-WS-03, SC5-WS-07]
        formativeCheck: Design log checkpoints; peer feedback
        scaffoldSlots:
          - field: formativeCheck
            prompt: What evidence would show a group is using collision theory to choose its factor, not just picking lemon juice because it has heard of it?
      - lessons: "8"
        phaseId: evaluate
        activity: |
          Students revisit their lesson 1 glow-stick cards and explain the result in particle terms, then
          explain an unfamiliar case with collision theory, such as why fine grain dust in a silo can explode
          when whole grain does not.
        wsOutcomes: [SC5-WS-08]
        formativeCheck: Summative task against success criteria
    whyItWorks:
      - Every factor is measured by the class before it is explained, so collision theory arrives as an explanation of their own data
      - Recovering the catalyst tackles the used-up idea with evidence rather than assertion
      - The glow sticks open and close the unit, so students can see their own explanation change
      - Elaborate hands the choice of factor to students, which raises the cognitive demand
    watchFor: |
      Rate graphs where every group measured something different. Agree a common measure before lesson 2
      (time to finish, or mass lost per minute) so the class data can be compared in lesson 4.
      Apple browning is an enzyme-driven reaction; a student who asks why heat eventually stops it has
      found something worth following, not a flaw in collision theory.
    safetyNotes: |
      This guide does not carry safety advice and is not a substitute for your school's risk assessment.
      What this sequence introduces, so you know what to assess: dilute acid and marble chips handled by
      students; hot water; hydrogen peroxide with a catalyst, as a teacher demonstration, where the
      concentration matters; and cut fruit, which brings knives and any allergies in the class into the room.
      Dust explosions appear only as a case to explain, never as a demonstration. Take these to your head
      teacher or faculty safety contact and check them against your school's chemical and practical
      procedures and current NSW guidance before you run anything.
    provenance: { source: ai-drafted-reviewed, authors: ["Claude"], reviewedBy: ["Steve Grant"], reviewedOn: 2026-09-30 }
```

### 8. `5e`: append worked sequence `seq-s5-motion` to `workedSequences`

Focus area: Waves and motion (Stage 5). Append after the guide's last existing worked sequence, before `misapplications:`, with one blank line between sequences.

```yaml
  - id: seq-s5-motion
    title: What does it take to change how something moves?
    context: { stages: [stage5], focusAreas: [Waves and motion], disciplines: [physics] }
    contentOutcomes: [SC5-WAM-02]
    bigQuestion: Why do moving things keep going, speed up, slow down or turn?
    learningIntentions:
      - An object keeps moving at constant velocity unless an unbalanced force acts on it
      - The acceleration of an object depends on the net force and on its mass
      - Forces come in pairs acting on different objects
    targetConceptions:
      - A moving object needs a force to keep it moving
      - In a collision, the bigger object pushes harder
    predictPrompt: Before reading on, the trolley data is collected in lessons 2 and 3 but F = ma is not named until lesson 4. What would change if the teacher gave the equation first and asked students to confirm it?
    steps:
      - lessons: "1"
        phaseId: engage
        activity: |
          A coin on a card over a cup: flick the card and the coin drops in. Then a slow-motion crash-test clip
          with an unbelted dummy. Students predict and explain what happens to the coin and the dummy, and
          whether a moving thing needs a push to keep moving.
        wsOutcomes: [SC5-WS-02]
        formativeCheck: Individual prediction cards, kept for lesson 8
      - lessons: "2–3"
        phaseId: explore
        activity: |
          Trolleys pulled by a falling mass over a pulley. Groups vary the pulling force with the mass kept
          constant, then the trolley's mass with the force kept constant, measuring acceleration with light
          gates or slow-motion phone video, and graph both.
        wsOutcomes: [SC5-WS-03, SC5-WS-04, SC5-WS-05]
        formativeCheck: Questioning; check tables, graphs and variable control
      - lessons: "4"
        phaseId: explain
        activity: |
          Groups present their trolley graphs. The teacher introduces F = ma using the class data, draws force
          diagrams on the groups' own set-ups, and addresses the idea that a moving object needs a force to
          keep moving, returning to the coin and the dummy.
        wsOutcomes: [SC5-WS-06, SC5-WS-08]
        formativeCheck: Mini-whiteboard force diagrams with net force labelled
        scaffoldSlots:
          - field: activity
            prompt: Which of the two graphs would you present first, and how would you get from it to the first law?
      - lessons: "5"
        phaseId: explain
        activity: |
          Force pairs: two students on skateboards or wheeled chairs push off each other, and balloon rockets
          on a string. The teacher introduces the third law, and the class tests the bigger-pushes-harder idea
          with two spring balances hooked together.
        wsOutcomes: [SC5-WS-01, SC5-WS-06]
        formativeCheck: Exit ticket identifying both forces in a pair and the objects they act on
      - lessons: "6–7"
        phaseId: elaborate
        activity: |
          Design challenge: a crumple zone that protects a passenger (a water balloon) on a trolley that runs
          into a wall. Groups test designs and justify them with the laws of motion, explaining why a longer
          stopping time means a smaller force on the passenger.
        wsOutcomes: [SC5-WS-07, SC5-WS-03]
        formativeCheck: Design log checkpoints; peer feedback
        scaffoldSlots:
          - field: formativeCheck
            prompt: What evidence would show a group is using force and acceleration to justify its design, rather than adding padding until it works?
      - lessons: "8"
        phaseId: evaluate
        activity: |
          Students revisit their lesson 1 cards and explain the coin and the dummy, then explain a rocket launch
          or a seatbelt using all three laws with force diagrams.
        wsOutcomes: [SC5-WS-08]
        formativeCheck: Summative task against success criteria
    whyItWorks:
      - The Engage question is the one Evaluate answers, so the storyline closes
      - Explore varies force and mass separately, so the relationship is built from data rather than recalled
      - The spring balance test lets students check the third law against their own intuition
      - Elaborate moves to design, where the laws have to be used to make a decision
    watchFor: |
      Friction on the trolleys hides the relationship. Tilt the track slightly until an unpulled trolley just
      keeps rolling, and show students why. When varying the force, move masses from the trolley to the
      hanger so the total mass being accelerated stays the same.
      This sequence covers motion only. Waves, the other half of the focus area, needs its own sequence.
    safetyNotes: |
      This guide does not carry safety advice and is not a substitute for your school's risk assessment.
      What this sequence introduces, so you know what to assess: falling masses on pulleys at bench edges;
      moving trolleys; students pushing off each other on wheels, which needs space and a supervised surface;
      and water balloons bursting on impact. Take these to your head teacher or faculty safety contact and
      check them against your school's practical procedures and current NSW guidance before you run anything.
    provenance: { source: ai-drafted-reviewed, authors: ["Claude"], reviewedBy: ["Steve Grant"], reviewedOn: 2026-09-30 }
```

### 9. `scaffold.revealAfterAttempt`: add the new ids, in place

Append to the end of each existing list, keeping the current entries and order:

| Guide | Append |
|---|---|
| `5e` | `seq-s4-elements`, `seq-s5-rates`, `seq-s5-motion` |
| `7e` | `7e-seq-s4-moon`, `7e-seq-s5-evolution` |
| `levels-of-inquiry` | `seq-s4-reaction-time` |
| `poe` | `ep-s4-steel-wool` |
| `swh` | `swh-seq-s4-separation` |

### 10. `lastReviewed` and versions

On `5e`, `7e`, `levels-of-inquiry`, `poe` and `swh`: set `lastReviewed: '2026-09-30'` (match each file's existing quoting) and bump the version **minor** from the current value in `docs/reckoner-state.md` (content added). `adi` is not touched.

## Expected results

- Models in the reckoner: 15. Published guides: 6 (all still published)
- Worked sequences: 9 → 17 (5e 3 → 6, 7e 1 → 3, levels-of-inquiry 1 → 2, poe 2 → 3, swh 1 → 2, adi 1)
- Examples across published guides: 58, unchanged
- Focus areas with a ready plan / examples only / empty: 8 / 8 / 0 → 16 / 0 / 0
- `validate` no longer warns that 7e has no Biology worked sequence; the swh warning remains
- Checks: `npm run validate`, `npm test`, `npm run typecheck`, `npm run check:pages` and
  `npm run check:regressions` all pass (verified in chat against `main` at `de6d43f` with these exact blocks)
- `reckoner/data/guides/` changes for the five guides only; `adi.json` byte-identical

## Commits

1. `feat(reckoner): ready plans for the eight example-only focus areas`: the five guide files
2. `chore(reckoner): publish pages`: regenerated `reckoner/` and `docs/reckoner-state.md`
3. `docs: action plan item for ready plans`

## Action plan

Next item (42 at drafting; use the number in `docs/reckoner-state.md`): record "Reckoner: ready plans for all
16 focus areas", reviewed by Steve Grant 2026-09-30, closing item 34's open item (the example-only focus areas
each need a worked sequence). Record these open items:

- [ ] Change: `ep-s4-steel-wool` covers the chemical half of the outcome; the geological half (energy driving
  weathering and the rock cycle) needs its own sequence. The freeze–thaw example in POE's Explain phase is a
  starting point
- [ ] Waves and motion: `seq-s5-motion` covers motion only; waves needs its own sequence
- [ ] SWH still has no Biology worked sequence
- [ ] `7e-seq-s4-moon` lesson 6 depends on a session planned with the school's Aboriginal Education staff and
  local Aboriginal community; the sequence says to leave it out rather than teach it from secondary sources
- [ ] Found while reviewing (template, separate fix): `md()` in `templates/app.js` turns every line of a
  multi-line field into its own paragraph, so activities on the live site break mid-sentence. Join consecutive
  non-blank lines into one paragraph; a blank line starts a new one. The review copy for these sequences was
  built with that change applied locally
- [ ] Found while reviewing: result cards show "Was this useful? A short feedback survey is coming soon." while
  `FEEDBACK_URL` is empty; the feedback-link handoff specified hiding the line until the URL is set. Confirm
  which is intended

## Open questions for review

None outstanding: all eight sequences were reviewed and approved by Steve Grant on 2026-09-30.
