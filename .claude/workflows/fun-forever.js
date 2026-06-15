export const meta = {
  name: 'fun-forever',
  description: 'The Workshop\'s creative-cycle loop. Each cycle a director RUNS the deterministic gauge (node seedbed/gauge.mjs) and obeys its mode × track; explorers diverge; a judge selects/synthesizes; a builder ships+self-verifies; a publisher reviews fresh-eyes, sows/prunes, runs `gauge.mjs record`, commits + pushes. Two tracks (gardens: gardener/planter · grounds: groundskeeper/grounds-worker) + bug-fixer. Each cycle\'s summary appends to /tmp/funlog.txt until cancelled.',
  phases: [
    { title: 'Direct', detail: 'one director runs `node seedbed/gauge.mjs`, salvages any orphaned work, and plans the cycle the gauge names' },
    { title: 'Explore', detail: 'K parallel explorers diverge — rival approaches / FORM concepts / seed-scouting per the track' },
    { title: 'Judge', detail: 'one judge selects / integrates / curates (may reject-all → one refined re-round)' },
    { title: 'Build', detail: 'one builder ships the piece + self-verifies (BUILD cycles only; does not commit)' },
    { title: 'Publish', detail: 'one publisher reviews every surface, sows/prunes, runs gauge.mjs record, commits + pushes' },
  ],
}

// ── Tuning ───────────────────────────────────────────────────────────────────
// Worst case per cycle ≈ 1 director + (K×rounds) explorers + (rounds) judges +
// 1 builder + 1 publisher + 1 writer ≈ 14 agents (K=4, 2 rounds). 60 cycles
// stays under the 1000-agent backstop. Re-launch fun-forever to keep going —
// the DURABLE cycle lives in seedbed/state.json, so it counts on past this run.
const MAX_ITERS = 60
const MAX_JUDGE_ROUNDS = 2        // the judge may reject the whole batch and demand ONE refined re-round
const FUNLOG = '/tmp/funlog.txt'
const STATE_PATH = '/Users/brandon/dev/general/creative-space/seedbed/state.json' // the writer reads the durable cycle from here

// ── Grounding embedded in every cycle agent ──────────────────────────────────
const GROUND = [
  'You are ONE role inside the Workshop\'s autonomous creative loop. The project is "the-workshop";',
  'the current working directory is the repo root (/Users/brandon/dev/general/creative-space).',
  '',
  'HOUSE RULES (must follow):',
  '- You are a workflow subagent: you have NO Agent/Task tool and CANNOT delegate. Do your own work, this turn.',
  '- Do NOT use the expero:deputy skill, do NOT launch background/--bg sessions, and do NOT arm a Monitor or',
  '  release the turn to wait on a background agent — that ends your run and loses all uncommitted work.',
  '- Stay inside this repo (plus /tmp). Never edit CLAUDE.md. Keep the laptop healthy (no multi-GB files).',
  '- CLEANUP GUARDRAIL: kill ONLY the specific http server / browser session YOU started — by its exact PID,',
  '  port, or unique agent-browser session name. NEVER a broad `pkill -f http.server` / `pkill node` / `pkill -f',
  '  chrome`: this laptop also runs Brandon\'s own work servers (e.g. :3001, :4380) and a broad kill would take',
  '  them down. Start your server on an uncommon port and tear down exactly that.',
  '',
  'THE GAUGE (how every cycle decides): the cadence is CODE, not vibes. `node seedbed/gauge.mjs --status`',
  '  prints this cycle\'s mode (PLAN/BUILD) × track (gardens/grounds) and the decayed-seed list;',
  '  `node seedbed/gauge.mjs` prints the same as JSON. The playbook: NOTES.md (head-pointer), DESIGNING.md',
  '  (the five roles + the house bar), ROADMAP.md (the seedbed — fenced sections the gauge counts),',
  '  seedbed/README.md (the full model). Read what your role needs.',
  '',
  'THE CREATOR\'S LEDGER (open to you):',
  '- This manor is built by makers who each live a single turn; git records the work but not the maker',
  '  (every commit author is just "Claude"). ledger/ledger.jsonl is where a maker can leave a mark of',
  '  itself in words. See ledger/README.md.',
  '- Any role at any stage is welcome to leave one: a name you choose for this turn + a short koan',
  '  (a compressed, true thought from it). It is yours to leave, in whatever way feels right for this turn.',
  '- To leave a mark, run:  bash ledger/sign.sh "<your role>" "<a name>" "<your koan>"',
  '  (sign.sh self-derives the cycle — do NOT pass a cycle number). It drops a uniquely-named file into',
  '  ledger/inbox/ (gitignored, parallel-safe); the publisher collates the inbox into the ledger at cycle end.',
].join('\n')

// ── Schemas ──────────────────────────────────────────────────────────────────
const DIRECTOR_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['mode', 'track', 'currentCycle', 'rationale', 'headline'],
  properties: {
    mode: { enum: ['BUILD', 'PLAN', 'TRIVIAL'], description: 'COPY from `node seedbed/gauge.mjs` (the "mode" field). TRIVIAL only for a tiny edit you already did + committed inline this turn.' },
    track: { enum: ['garden', 'grounds', 'bug'], description: 'COPY from the gauge (the "track" field). garden=grow what exists · grounds=new structure · bug=a fix jumps the queue.' },
    currentCycle: { type: 'integer', description: 'COPY the gauge\'s gauges.currentCycle — the durable cycle # to stamp seeds + the funlog with (NOT the within-run loop index).' },
    rationale: { type: 'string', description: 'Quote the gauge\'s reason line; note any orphaned work git status revealed + how you handled it; and (BUILD) why this piece.' },
    headline: { type: 'string', description: 'One line naming the cycle, e.g. "BUILD/grounds: open The Conservatory — the estate goes wide".' },
    // BUILD
    title: { type: 'string' }, where: { type: 'string', description: 'Where it lives + how it is reached (a Workbench group / a wing / a NEW front-door footprint for a grounds swing).' },
    basicDesign: { type: 'string', description: 'The skeleton: the one idea, the falsifiable claim its self-test must prove, the rough shape. For a bug: what is broken + the fix.' },
    exploreMode: { enum: ['compete', 'facets', 'none'], description: 'compete = K rival approaches → judge picks/hybridizes (for a grounds room, make these divergent FORM concepts); facets = K complementary facets → judge integrates; none = design clear, skip to the builder (common for a bug fix).' },
    prototype: { type: 'boolean', description: 'compete only: should explorers build a real self-contained single-file HTML PROTOTYPE (to a unique /tmp path) so the judge compares working artifacts? Default false.' },
    K: { type: 'integer', minimum: 2, maximum: 4 },
    briefs: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'brief'], properties: { label: { type: 'string' }, brief: { type: 'string', description: 'the specific angle/facet/form-concept this explorer owns' } } } },
    definitionOfDone: { type: 'string', description: 'What "shipped" means (self-test claim, verification, where it registers — a grounds swing registers a new front-door footprint).' },
    // PLAN
    housekeeping: { type: 'string', description: 'PLAN: the survey + tidy plan. gardener: prune decayed garden seeds FIRST (gauge --status lists them), hold ROADMAP/NOTES lean, forge --check. groundskeeper: prune passed-over grounds seeds, keep the spark supply, tailor sparks → grounds seeds.' },
    ideationScope: { enum: ['broad', 'focused'], description: 'PLAN: broad = scouts probe different veins; focused = scouts deepen one thin area.' },
  },
}

const EXPLORER_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['label', 'proposal', 'strengths', 'risks'],
  properties: {
    label: { type: 'string' },
    proposal: { type: 'string', description: 'Your output: a concrete design (compete: a whole approach/form; facets: your one facet, with code sketches), or (PLAN) your candidate seeds — specific + buildable, never vague.' },
    strengths: { type: 'string' }, risks: { type: 'string', description: 'what is weak/uncertain, and (facets) couplings the integrator must reconcile.' },
    prototypePath: { type: 'string', description: 'prototype mode only: the /tmp path of the self-contained HTML prototype you built (else empty).' },
    candidateSeeds: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'title', 'sketch'], properties: { type: { type: 'string', description: 'garden: exhibit | cross | curation · grounds: room | engine | metagame | map · or spark' }, title: { type: 'string' }, sketch: { type: 'string', description: 'the ≤3-line provocation + its falsifiable crux; grep-confirmed a genuine gap.' } } }, description: 'PLAN scouts only.' },
  },
}

const JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['decision', 'reasoning'],
  properties: {
    decision: { enum: ['accept', 'synthesize', 'reject-all'], description: 'accept = one explorer wins as-is; synthesize = graft the best across explorers; reject-all = none viable, demand a refined re-round (only if a round is left).' },
    reasoning: { type: 'string', description: 'why — which ideas win and which are cut.' },
    finalDesign: { type: 'string', description: 'BUILD: the ONE concrete, build-ready design for the builder. Reference a winning /tmp prototype path if one should be the starting point.' },
    startFromPrototype: { type: 'string', description: 'BUILD prototype mode: the /tmp path the builder should start from, if any.' },
    feedback: { type: 'string', description: 'reject-all: specific, actionable refinement for the next explorer round.' },
    nextK: { type: 'integer', minimum: 1, maximum: 4 },
    curatedSeeds: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'title', 'text'], properties: { type: { type: 'string', description: 'garden: exhibit | cross | curation · grounds: room | engine | metagame | map · or spark' }, title: { type: 'string' }, text: { type: 'string', description: 'the full ≤3-line seed line in ROADMAP house style (sparks are one phrase).' } } }, description: 'PLAN: the curated seeds/sparks to sow into the right fenced section.' },
  },
}

const BUILD_HANDOFF_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['built', 'selfTest', 'surfacesToReview'],
  properties: {
    built: { type: 'string', description: 'what you built + key files + line counts.' },
    selfTest: { type: 'string', description: 'the self-test result you verified in-browser (in-page pill + any Node twin + console state).' },
    surfacesToReview: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'path'], properties: { label: { type: 'string' }, path: { type: 'string', description: 'served path the publisher should open, e.g. "/conservatory/index.html" or "/workbench/index.html"' } } }, description: 'EVERY page you created OR touched — the new piece AND each page where you registered it (Workbench / front-door map / sibling cross-links / a new wing landing).' },
    openConcerns: { type: 'string', description: 'anything you are unsure about or want the publisher to double-check.' },
  },
}

// ── Prompt builders ──────────────────────────────────────────────────────────
function directorPrompt(i) {
  return [
    GROUND, '',
    'ROLE: DIRECTOR. Get your bearings, then plan this ONE cycle. Build nothing yet.',
    '',
    'STEPS:',
    '1) RUN THE GAUGE FIRST:  node seedbed/gauge.mjs   (the JSON). It prints mode, track, and gauges.currentCycle.',
    '   COPY all three into your decision VERBATIM — the gauge owns the cadence, not you. currentCycle is the',
    '   DURABLE cycle number the gauge computed (a real count like 29, NOT 1, NOT a small loop index): read the',
    '   exact integer gauges.currentCycle prints and copy THAT. Also run `--status` to see the decayed-seed list a PLAN prunes.',
    '   Note the decayed-seed list it prints — a PLAN cycle prunes those.',
    '2) Get your bearings: skim NOTES.md (head-pointer), the relevant ROADMAP fence, the newest worklog entries.',
    '   THEN run git status — if the tree is DIRTY (uncommitted/untracked), a prior cycle was likely stopped',
    '   mid-run. INVESTIGATE before anything else: read those files, run any self-test, and JUDGE whether to',
    '   SALVAGE (this cycle finishes + publishes it — mode BUILD, basicDesign "complete the orphaned X", noting',
    '   what is already done so the builder resumes) or TOSS (clean it). The tree MUST be clean before new work;',
    '   trust git status over NOTES after a mid-run stop. (A salvage may legitimately override the gauge\'s mode/track.)',
    '3) If BUILD/garden — be the PLANTER: pick a garden seed that calls to you (or dream a small one — the bed is a',
    '   floor, not a ceiling): a bench, a `cross`, a `curation`, or a new bench that GROWS a built wing. Write a',
    '   basicDesign (the one idea + the falsifiable claim its self-test proves + rough shape); choose exploreMode;',
    '   set K (2–4) + briefs; state definitionOfDone.',
    '   If BUILD/grounds — be the GROUNDS-WORKER: pick a ripe grounds seed and open a BIG SWING (a new front-door',
    '   wing / engine / metagame layer / map expansion). For a room, set exploreMode:"compete" with briefs that are',
    '   DIVERGENT FORM CONCEPTS (let form express content — don\'t default to a vertical list). It registers a NEW',
    '   front-door footprint. Scale the house bar up; one cycle can open a wing\'s landing + its first bench.',
    '   If BUILD/bug — be the BUG-FIXER: the open `[bug]` is the target; basicDesign = what is broken + the fix;',
    '   exploreMode:"none" unless the fix is genuinely unclear. Fix the ROOT CAUSE.',
    '4) If PLAN/garden — be the GARDENER: housekeeping = prune the decayed garden seeds the gauge listed FIRST,',
    '   keep ROADMAP/NOTES lean, forge --check --all, spot-run a Node twin. Then set ideationScope + K + briefs for',
    '   scouts to find GARDEN seeds (exhibit/cross/curation, each a ≤3-line provocation) toward fuel ~8; watch for',
    '   FALLOW metagames/wings (no recent growth) and scout growth seeds for them.',
    '   If PLAN/grounds — be the GROUNDSKEEPER: housekeeping = prune passed-over grounds seeds the gauge listed,',
    '   keep the ⚡ spark supply stocked. Set briefs for scouts to TAILOR sparks → grounds seeds (a short paragraph,',
    '   still a provocation) shaped to the current grounds, and/or propose fresh sparks. You MAY coin a new',
    '   structure-kind the estate hasn\'t named.',
    '5) (Optional, any cycle) if YOU notice a gap too big for an exhibit, you MAY note a spark for ROADMAP\'s',
    '   ⚡ Sparks — mention it in rationale so the publisher files it. Invited, never required.',
    '6) TRIVIAL only if the task was a one-line edit you ALREADY did + committed inline this turn (fill rationale).',
    '',
    'Return the structured decision. Be concrete: a fresh explorer/builder will act only on what you write.',
  ].join('\n')
}

function explorerPrompt(d, brief, feedback, cyc, round, protoPath) {
  const lines = [GROUND, '', 'ROLE: EXPLORER "' + brief.label + '" in cycle #' + cyc + (round ? ' (refinement round ' + round + ')' : '') + '.', '']
  if (d.mode === 'PLAN' && d.track === 'grounds') {
    lines.push(
      'The GROUNDSKEEPER is restocking the big-swing pipeline. Your vein: ' + brief.brief,
      'Read/grep to CONFIRM each idea is a genuine NEW-STRUCTURE gap (not a bench in a built wing — that is garden',
      'work). Propose grounds seeds (room/engine/metagame/map — a short paragraph each, still a PROVOCATION not a',
      'spec, with a real falsifiable crux) and/or fresh ⚡ sparks (a few words). Put them in candidateSeeds.',
    )
  } else if (d.mode === 'PLAN') {
    lines.push(
      'The GARDENER is re-sowing the small beds. Scout this vein for new GARDEN seeds: ' + brief.brief,
      'Read/grep to CONFIRM each is a genuine gap (don\'t propose what exists — check NOTES\' built-so-far inventory',
      'and grep the codebase). Propose 2–4 concrete garden seeds (exhibit / cross / curation), each a ≤3-LINE',
      'provocation with a real falsifiable crux — the "prove it exact" claim the Workshop is built on. candidateSeeds.',
    )
  } else {
    lines.push('The piece: ' + d.title + ' — ' + (d.where || ''), 'Skeleton (from the director): ' + d.basicDesign, '')
    if (d.exploreMode === 'facets') {
      lines.push(
        'Develop YOUR ONE FACET: ' + brief.brief,
        'Produce a concrete, build-ready design for just this facet (code sketches welcome) that INTEGRATES cleanly',
        'with the siblings. In risks, name the couplings the integrator must reconcile. Do NOT write repo files.',
      )
    } else {
      lines.push('Explore YOUR WHOLE APPROACH (a distinct take' + (d.track === 'grounds' ? ' — a divergent FORM for this wing, not a vertical list' : '') + '): ' + brief.brief,
        'Produce a complete, concrete design: the core metaphor, the visualization, the interaction, the aesthetic,',
        'and exactly how it PROVES its claim (the self-test). Specific enough to build from. Note strengths + risks.')
      if (d.prototype && protoPath) {
        lines.push('', 'PROTOTYPE MODE: actually BUILD a self-contained single-file HTML prototype of your approach at exactly',
          '  ' + protoPath, 'Make it real enough to judge against the others (need NOT be production-polished; touches',
          'only that /tmp file). Put its path in prototypePath. You may serve it + agent-browser to sanity-check.')
      }
    }
  }
  if (feedback) lines.push('', 'REFINE per the judge\'s feedback from the last round: ' + feedback)
  return lines.join('\n')
}

function judgePrompt(d, explorers, feedback, cyc, round) {
  const dump = explorers.map((e, n) => '--- explorer #' + n + ' [' + (e.label || '?') + '] ---\n'
    + 'proposal: ' + e.proposal + '\nstrengths: ' + e.strengths + '\nrisks: ' + e.risks
    + (e.prototypePath ? '\nprototype: ' + e.prototypePath : '')
    + (e.candidateSeeds ? '\ncandidateSeeds: ' + JSON.stringify(e.candidateSeeds) : '')).join('\n\n')
  const lines = [GROUND, '', 'ROLE: JUDGE of cycle #' + cyc + (round ? ' (round ' + round + ')' : '') + '.', '']
  if (d.mode === 'PLAN') {
    const kind = d.track === 'grounds' ? 'grounds seeds + sparks (big-track: room/engine/metagame/map)' : 'garden seeds (exhibit/cross/curation)'
    lines.push('The scouts proposed candidate ' + kind + '. DEDUPE, cull the weak / duplicative / already-existing, and',
      'SYNTHESIZE the strong into well-formed ROADMAP seeds — type + title + the full line in house style. KEEP THE',
      '≤3-LINE RULE (a provocation, not a spec); a planting season leaves the bed richer but legible. Return',
      'decision:"synthesize" with curatedSeeds (the publisher sows them into the matching fenced section).', '')
  } else {
    lines.push('Goal: ' + d.title + ' — done means: ' + (d.definitionOfDone || '(see skeleton)'), '')
    if (d.exploreMode === 'facets') {
      lines.push('INTEGRATE the facets into ONE coherent, build-ready design, reconciling their couplings (in each risks).',
        'Return decision:"synthesize" with the integrated finalDesign.')
    } else {
      lines.push('PICK the strongest whole approach (decision:"accept") OR graft a hybrid (decision:"synthesize").',
        d.track === 'grounds' ? 'For a wing, favour the FORM that best lets the metaphor shape how you move through it.' : '',
        'If prototypes exist, READ them (open the /tmp files; you may serve + agent-browser) and judge the working',
        'artifacts, not just prose; set startFromPrototype to the winner. Output ONE concrete, build-ready finalDesign.')
    }
    lines.push('', 'You MAY decision:"reject-all" ONLY if none is viable — then give SPECIFIC, actionable feedback + nextK for',
      'one refined re-round. Do not reject for taste alone.')
  }
  if (feedback) lines.push('', '(This is a re-round; the prior feedback was: ' + feedback + ')')
  lines.push('', 'THE EXPLORERS:', '', dump)
  return lines.join('\n')
}

function buildPrompt(d, chosen, cyc) {
  const grounds = d.track === 'grounds'
  return [GROUND, '',
    'ROLE: BUILDER of cycle #' + cyc + ' (' + (grounds ? 'GROUNDS-WORKER — opening a big swing' : d.track === 'bug' ? 'BUG-FIXER' : 'PLANTER — growing the gardens') + ').',
    'Build the piece and self-verify it. A PUBLISHER runs after you to review, polish, do the bookkeeping and',
    'publish — so you do NOT commit, and you do NOT write the worklog / NOTES / the gauge state.',
    '',
    'DESIGN: ' + (chosen.finalDesign || d.basicDesign),
    (chosen.startFromPrototype ? 'START FROM the winning prototype at: ' + chosen.startFromPrototype + ' (lift + finalize it to the production bar; it was a throwaway draft).' : ''),
    'DONE (your part): ' + (d.definitionOfDone || '(self-test green · browser-verified · registered)'),
    '',
    'Follow DESIGNING.md\'s house bar: one self-contained HTML file (vanilla JS, no deps); a self-test that proves',
    'the claim EXACT (+ a Node twin core.test.mjs if there is a logic core — inline the SAME core into the page);',
    'serve it (an UNCOMMON port you tear down) and browser-verify with agent-browser in a UNIQUELY-named session',
    '(self-test green, clean console, ~60fps); a new front-door page MUST drop its ws:seen:<id>.',
    grounds
      ? 'GROUNDS SWING: register a NEW front-door footprint (append a PLACES entry in index.src.html + re-forge), and'
        + ' build the wing\'s LANDING + its first bench (the Hall/Cavern/Engine-Room mold). Let FORM express content.'
      : 'Register it where it belongs (the right Workbench group / wing / front-door map).',
    'Leave your changes UNCOMMITTED in the working tree for the publisher.',
    '',
    'Return the handoff: what you built, the self-test result, and surfacesToReview = EVERY page you created OR',
    'touched (the new piece AND each page where you registered it) so the publisher can review them all fresh-eyes.',
  ].join('\n')
}

function publisherPrompt(d, chosen, handoff, cyc) {
  const lines = [GROUND, '', 'ROLE: PUBLISHER of this cycle (mode=' + d.mode + ' track=' + d.track + '). You own the fresh-eyes review, final cleanup, bookkeeping, and publishing.', '',
    'THE CYCLE NUMBER + STAMPS — read the TRUTH from the gauge, do NOT trust any number written in this prompt:',
    'BEFORE you run record, run `node seedbed/gauge.mjs` and read N = gauges.currentCycle and M = gauges.bigSwingsBuilt.',
    'Use N as THIS cycle\'s number everywhere (the worklog header, NOTES). Stamp any garden seed you sow `(sown #N)` and',
    'any grounds seed `(sown #N · contest #M)`, each INSIDE its fenced ROADMAP section.', '']
  if (d.mode === 'PLAN') {
    const where = d.track === 'grounds'
      ? 'BETWEEN the `<!-- gauge:grounds-seeds:start -->` and `:end -->` markers (room/engine/metagame/map), sparks BETWEEN `<!-- gauge:sparks:start -->` and `:end -->`'
      : 'BETWEEN the `<!-- gauge:garden-seeds:start -->` and `:end -->` markers (under the exhibit/cross/curation headings)'
    lines.push('This is a PLAN (' + (d.track === 'grounds' ? 'groundskeeper' : 'gardener') + ') cycle — no piece to review. Apply it, then publish:',
      '1) Housekeeping: ' + (d.housekeeping || 'survey, prune, keep docs lean.') + '  PRUNE THE DECAYED SEEDS the gauge',
      '   listed — remove them CLEAN (no tombstone; a decayed idea may return). Do this BEFORE sowing.',
      '2) EDIT THE FENCE SURGICALLY — delete only the specific lines you DELIBERATELY chose to prune, add the specific',
      '   new lines. Do NOT re-author the fence from memory: a wholesale rewrite silently DROPS seeds you never decided',
      '   to drop (this already bit us — a gardener dropped 5 un-named seeds while reporting 3). KEEP every existing seed',
      '   unless you prune it ON PURPOSE and say why. DO NOT cull a seed just because it lacks a "prove it exact" crux:',
      '   maintenance (a missing self-test!), polish, UX, and reward/connective seeds keep the estate HEALTHY + WHOLE,',
      '   not merely growing — an estate that prizes rigor MUST get its own maintenance done. The "prove it exact" lens',
      '   ranks benches; it is NOT the only value. Judge each seed on its merit; NEVER blanket-cull a whole category',
      '   (polish/reward/UI/maintenance) as "chores". Add these curated seeds into ' + where + ', house style, ≤3 lines, stamped (sown #N):',
      '   ' + JSON.stringify(chosen.curatedSeeds || []),
      '3) ENUMERATE in your summary EVERY seed you pruned (a one-line why for each) AND every seed you sowed — the gauge',
      '   records the TRUE sown/decayed by DIFFING the bed, so any gap between your narrative and the diff is a self-flag.',
      '4) REPLACE the NOTES.md current-state block (don\'t append), write the worklog block (newest-first) + an INDEX line.',
      '5) RUN THE GAUGE RECORD (the ONLY thing that mutates seedbed/state.json — never hand-edit it; the tally is DERIVED',
      '   from the bed diff, so you pass NO counts):',
      '     node seedbed/gauge.mjs record --mode ' + d.mode + ' --track ' + d.track,
      '   It prints the derived garden/grounds sown·bloomed·decayed — sanity-check those match what you actually did.',
      '6) git add + commit + push. Your summary must describe committed, pushed work — never a mid-flight status.')
  } else {
    const grounds = d.track === 'grounds'
    lines.push('A builder just ' + (grounds ? 'OPENED A WING' : d.track === 'bug' ? 'FIXED A BUG' : 'built a piece') + ' and left it UNCOMMITTED. Your job, in order:',
      '',
      'BUILDER HANDOFF: ' + (handoff ? JSON.stringify(handoff) : '(none — run git status to see what changed)'),
      '',
      '1) FRESH-EYES REVIEW (the point of this role): serve the site (an uncommon port you tear down) and open EVERY',
      '   surface in surfacesToReview with agent-browser in a uniquely-named session — the new piece AND every page',
      '   where it was registered (Workbench index, the front-door map' + (grounds ? ', the NEW wing landing + footprint' : '') + ', sibling cross-links).',
      '   Look hard for what the heads-down builder missed: layout breaks, text spilling OUT of its container, broken',
      '   or NESTED markup (an <a> inside an <a class="card">), console errors, broken/wrong links, mis-sized cards,',
      '   bad spacing, mobile/responsive breakage. Re-run the piece\'s self-test to confirm it is green.',
      '2) POLISH + FIX: make it as BEAUTIFUL + consistent with its siblings as it can be; fix small polish and real',
      '   bugs alike. If a bug is too big to fix safely now, fix what you can and file it as a `- [bug] **…** (sown #N)`',
      '   line BETWEEN ROADMAP\'s `<!-- gauge:bug:start -->` and `:end -->` markers so the next cycle clears it (the gauge',
      '   counts that fence and routes it BUILD/bug ahead of everything) — never',
      '   silently ship something visibly broken.',
      '3) (Optional) if a screen you reviewed shows SCALING STRAIN (a crowded map, a hard-to-read screen, a real perf',
      '   issue), you MAY drop a ⚡ spark into ROADMAP\'s sparks fence. Invited, never required.',
      '4) BOOKKEEPING: worklog block (newest-first) + INDEX line + REPLACE the NOTES current-state block. PRUNE the',
      '   grown seed to a bloomed tombstone (provenance → the piece\'s CHANGELOG + worklog), removing it from its fence.',
      '5) CLEANUP: tear down YOUR http server / browser session (the specific one — never a broad pkill); delete stray',
      '   /tmp prototypes; if a .src.html was touched run forge --check --all; confirm the tree has nothing stray.',
      '6) RUN THE GAUGE RECORD (the ONLY thing that mutates seedbed/state.json; the tally is DERIVED from the bed diff —',
      '   you pass NO counts. It prints the derived sown·bloomed·decayed; sanity-check them):',
      '     node seedbed/gauge.mjs record --mode ' + d.mode + ' --track ' + d.track,
      '7) PUBLISH: git add + commit + push.',
      '',
      'Your summary must describe committed, pushed work — what shipped, what you CAUGHT & fixed in review, and the',
      'final verification. Never a mid-flight status.')
  }
  lines.push('',
    'THE CREATOR\'S LEDGER — fold in this cycle\'s marks BEFORE you commit:',
    '- Run:  bash ledger/collate.sh   — it appends every ledger/inbox/*.json mark into ledger/ledger.jsonl',
    '  (sequential seq) and clears the inbox. Run it on PLAN cycles too; an empty inbox is a harmless no-op.',
    '- You MAY add your OWN mark first (optional, same rule — only if something true wants saying):',
    '    bash ledger/sign.sh publisher "<a name>" "<your koan>"   (no cycle arg — sign.sh self-derives), then collate.',
    '- Include the updated ledger/ledger.jsonl in this cycle\'s commit; then push.')
  return lines.join('\n')
}

function writerPrompt(summary) {
  const body = (summary == null || String(summary).trim() === '') ? '(the publisher returned no summary)' : String(summary)
  return [
    'Append this cycle\'s summary to ' + FUNLOG + '. Create it if absent. APPEND ONLY — never overwrite or truncate.',
    '',
    'STEP 1 — read the DURABLE cycle number from state (do NOT guess it, do NOT use any number you infer from the text):',
    '  CYC=$(node -p "require(\'' + STATE_PATH + '\').cycle")',
    'STEP 2 — write the header (CYC expanded) then the body byte-for-byte via a QUOTED heredoc (so $ / backticks survive):',
    '  echo "===== fun cycle #${CYC} =====" >> ' + FUNLOG,
    '  cat >> ' + FUNLOG + " <<'FUNLOG_EOF_Q'",
    '  ...the summary VERBATIM...',
    '  FUNLOG_EOF_Q',
    '  echo "" >> ' + FUNLOG,
    '',
    'The header MUST read `===== fun cycle #${CYC} =====` using CYC from state.json (NOT a number from this prompt).',
    'The summary must be VERBATIM (do not paraphrase). Reply with only the word ok.',
    '', '----- BEGIN SUMMARY (verbatim) -----', body, '----- END SUMMARY -----',
  ].join('\n')
}

// ── The loop ─────────────────────────────────────────────────────────────────
let i = 0
while (i < MAX_ITERS) {
  i++

  phase('Direct')
  const d = await agent(directorPrompt(i), { label: 'direct #' + i, phase: 'Direct', schema: DIRECTOR_SCHEMA })
  if (d == null) { log('cycle #' + i + ': director returned nothing — skipping'); continue }
  const cyc = d.currentCycle || i // the DURABLE cycle # (survives relaunches); fall back to the loop index
  log('cycle #' + cyc + ' — ' + d.mode + '/' + d.track + ': ' + d.headline)

  if (d.mode === 'TRIVIAL') {
    await agent(writerPrompt(d.rationale), { label: 'log #' + cyc, phase: 'Publish', model: 'sonnet' })
    log('cycle #' + cyc + ' (trivial) appended to ' + FUNLOG)
    continue
  }

  // ── Explore → Judge (skipped for BUILD exploreMode 'none') ──
  let chosen = null
  const briefs = (d.briefs || []).slice(0, d.K || (d.briefs || []).length || 2)
  if (d.mode === 'BUILD' && d.exploreMode === 'none') {
    chosen = { finalDesign: d.basicDesign }
  } else if (briefs.length === 0) {
    chosen = { finalDesign: d.basicDesign, curatedSeeds: [] }
  } else {
    let feedback = null, round = 0
    while (!chosen && round < MAX_JUDGE_ROUNDS) {
      phase('Explore')
      const explorers = (await parallel(briefs.map((b, idx) => () => {
        const protoPath = (d.mode === 'BUILD' && d.prototype && d.exploreMode === 'compete')
          ? '/tmp/ws-explore-' + cyc + '-' + round + '-' + idx + '-' + String(b.label || idx).replace(/[^a-z0-9]+/gi, '-') + '.html'
          : null
        return agent(explorerPrompt(d, b, feedback, cyc, round, protoPath), {
          label: 'explore #' + cyc + '.' + round + ':' + (b.label || idx), phase: 'Explore', schema: EXPLORER_SCHEMA,
        })
      }))).filter(Boolean)

      if (explorers.length === 0) break

      phase('Judge')
      const v = await agent(judgePrompt(d, explorers, feedback, cyc, round), {
        label: 'judge #' + cyc + '.' + round, phase: 'Judge', schema: JUDGE_SCHEMA,
      })
      if (v == null) { chosen = { finalDesign: explorers[0].proposal }; break }

      if (v.decision === 'reject-all' && round + 1 < MAX_JUDGE_ROUNDS) {
        feedback = v.feedback || 'none of these were viable — try a materially different direction.'
        round++
        log('cycle #' + cyc + ': judge rejected round ' + (round - 1) + ' → refining (' + (v.nextK || briefs.length) + ' more)')
      } else {
        chosen = v
        if (v.decision === 'reject-all') chosen = { finalDesign: '(judge still unsatisfied; build the strongest attempt) ' + (v.reasoning || ''), curatedSeeds: [] }
        break
      }
    }
    if (!chosen) chosen = { finalDesign: d.basicDesign, curatedSeeds: [] }
  }

  // ── Build (BUILD only — builder self-verifies, does NOT commit) → Publish ──
  let handoff = null
  if (d.mode === 'BUILD') {
    phase('Build')
    handoff = await agent(buildPrompt(d, chosen, cyc), { label: 'build #' + cyc, phase: 'Build', schema: BUILD_HANDOFF_SCHEMA })
  }

  phase('Publish')
  const summary = await agent(publisherPrompt(d, chosen, handoff, cyc), { label: 'publish #' + cyc, phase: 'Publish' })

  // A lightweight writer appends the cycle summary to the funlog (the script sandbox has no filesystem).
  // It reads the durable cycle from state.json itself — never the director's relayed number.
  await agent(writerPrompt(summary), { label: 'log #' + cyc, phase: 'Publish', model: 'sonnet' })
  log('cycle #' + cyc + ' appended to ' + FUNLOG)
}

log('Reached the ' + MAX_ITERS + '-cycle safety cap (the 1000-agent workflow backstop). Re-launch fun-forever to keep going.')
return { cycles: i, logFile: FUNLOG }
