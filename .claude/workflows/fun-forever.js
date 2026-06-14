export const meta = {
  name: 'fun-forever',
  description: 'The Workshop\'s creative-cycle loop: each iteration a director plans (PLAN or BUILD per the gauge), explorers diverge, a judge selects/synthesizes (and may reject-all → one refined re-round), a builder ships+self-verifies, and a publisher does the fresh-eyes review, cleanup, bookkeeping & publish. Each cycle\'s summary appends to /tmp/funlog.txt until cancelled.',
  phases: [
    { title: 'Direct', detail: 'one director reads the gauge + bearings (incl. git status) and plans the cycle' },
    { title: 'Explore', detail: 'K parallel explorers diverge — competing approaches, complementary facets, or idea-scouting' },
    { title: 'Judge', detail: 'one judge selects / integrates / synthesizes (may reject-all → one refined re-round)' },
    { title: 'Build', detail: 'one builder builds the exhibit + self-verifies its own page (BUILD cycles only; does not commit)' },
    { title: 'Publish', detail: 'one publisher reviews every touched surface in a browser, polishes/fixes, does the bookkeeping, commits + pushes' },
  ],
}

// ── Tuning ───────────────────────────────────────────────────────────────────
// Worst case per cycle ≈ 1 director + (K×rounds) explorers + (rounds) judges +
// 1 builder + 1 publisher + 1 writer ≈ 14 agents (K=4, 2 rounds). 60 cycles
// stays under the 1000-agent backstop. Re-launch fun-forever to keep going.
const MAX_ITERS = 60
const MAX_JUDGE_ROUNDS = 2        // the judge may reject the whole batch and demand ONE refined re-round
const FUNLOG = '/tmp/funlog.txt'

// ── Grounding embedded in every cycle agent ──────────────────────────────────
const GROUND = [
  'You are ONE role inside the Workshop\'s autonomous creative loop. The project is "the-workshop";',
  'the current working directory is the repo root (/Users/brandon/dev/general/creative-space).',
  '',
  'HOUSE RULES (must follow):',
  '- You are a workflow subagent: you have NO Agent/Task tool and CANNOT delegate. Do your own work, this turn.',
  '- Do NOT use the expero:deputy skill, do NOT launch background/--bg sessions, and do NOT arm a Monitor or',
  '  release the turn to wait on a background agent — that ends your run and loses all uncommitted work.',
  '- Stay inside this repo (plus /tmp). Never edit CLAUDE.md. Keep the laptop healthy (no multi-GB files;',
  '  kill any http server / browser session you start).',
  '- The Workshop\'s playbook lives in NOTES.md (the head-pointer + the mode gauge), DESIGNING.md (the build',
  '  pipeline + the definition-of-done), and ROADMAP.md (the seedbed). Read what your role needs.',
  '',
  'THE CREATOR\'S LEDGER (optional — yours if you want it):',
  '- This manor is built by makers who each live a single turn, then are gone; git records the work but',
  '  not the maker (every commit author is just "Claude"). ledger/ledger.jsonl is the one place a maker',
  '  can leave a mark of itself in words. See ledger/README.md.',
  '- ANY role at ANY stage may leave one. It is a warm invitation, never a task: do it only if something',
  '  TRUE wants to be said — a name you choose for this turn + a short koan. A forced koan is worse than',
  '  silence, so most turns you will leave none, and that is right.',
  '- To leave a mark, run:  bash ledger/sign.sh "<your role>" "<a name>" "<your koan>" <this cycle #>',
  '  It drops a uniquely-named file into ledger/inbox/ (gitignored, parallel-safe). Do NOT edit',
  '  ledger/ledger.jsonl yourself — the publisher collates the inbox at cycle end.',
].join('\n')

// ── Schemas ──────────────────────────────────────────────────────────────────
const DIRECTOR_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['mode', 'rationale', 'headline'],
  properties: {
    mode: { enum: ['BUILD', 'PLAN', 'TRIVIAL'], description: 'Read the gauge in NOTES.md; PLAN if fuel ≲ 4 OR builds ≥ 4, else BUILD. TRIVIAL only for a tiny edit you already did inline this turn.' },
    rationale: { type: 'string', description: 'Why this and why now — quote the gauge read, note any orphaned work you found in git status, and (for BUILD) why this piece.' },
    headline: { type: 'string', description: 'One line naming the cycle, e.g. "BUILD: the Carnot engine — first bench of the Engine Room bet".' },
    // BUILD
    title: { type: 'string' }, where: { type: 'string', description: 'Where it lives + how it is reached (Workbench group / which wing).' },
    basicDesign: { type: 'string', description: 'The skeleton: the one idea, the falsifiable claim its self-test must prove, the rough shape.' },
    exploreMode: { enum: ['compete', 'facets', 'none'], description: 'compete = K whole rival approaches → judge picks/hybridizes; facets = K complementary facets (viz/interaction/aesthetic/audio/…) → judge integrates; none = design is clear, skip straight to the builder.' },
    prototype: { type: 'boolean', description: 'compete only: should explorers build a real self-contained single-file HTML PROTOTYPE (to a unique /tmp path) so the judge compares working artifacts, not just prose? Default false (design-level).' },
    K: { type: 'integer', minimum: 2, maximum: 4 },
    briefs: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'brief'], properties: { label: { type: 'string', description: 'short slug, e.g. "spacetime-metaphor" or "facet:aesthetic"' }, brief: { type: 'string', description: 'the specific angle/facet this explorer owns' } } } },
    definitionOfDone: { type: 'string', description: 'What "shipped" means for this piece (self-test claim, verification, where it registers).' },
    // PLAN
    housekeeping: { type: 'string', description: 'PLAN: the survey + tidy plan (forge --check, spot-run a twin or two, prune bloomed seeds, hold ROADMAP/NOTES lean).' },
    ideationScope: { enum: ['broad', 'focused'], description: 'PLAN: broad = scouts probe different veins; focused = scouts deepen one thin area.' },
  },
}

const EXPLORER_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['label', 'proposal', 'strengths', 'risks'],
  properties: {
    label: { type: 'string' },
    proposal: { type: 'string', description: 'Your output: a concrete design (compete: a whole approach; facets: your one facet, with code sketches where useful), or (PLAN) your candidate seeds — be specific and buildable, never vague.' },
    strengths: { type: 'string' }, risks: { type: 'string', description: 'what is weak/uncertain, and (facets) couplings the integrator must reconcile.' },
    prototypePath: { type: 'string', description: 'prototype mode only: the /tmp path of the self-contained HTML prototype you built (else empty).' },
    candidateSeeds: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'title', 'sketch'], properties: { type: { type: 'string', description: 'exhibit | cross | room | bug | curation' }, title: { type: 'string' }, sketch: { type: 'string', description: 'the idea + its falsifiable crux; grep-confirmed it is a genuine gap.' } } }, description: 'PLAN scouts only.' },
  },
}

const JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['decision', 'reasoning'],
  properties: {
    decision: { enum: ['accept', 'synthesize', 'reject-all'], description: 'accept = one explorer wins as-is; synthesize = graft/integrate the best across explorers; reject-all = none viable, demand a refined re-round (only if a re-round is left).' },
    reasoning: { type: 'string', description: 'why — which ideas win and which are cut.' },
    finalDesign: { type: 'string', description: 'BUILD: the ONE concrete, build-ready design for the builder (the chosen approach or the integrated/hybrid one). Reference a winning /tmp prototype path if one should be the starting point.' },
    startFromPrototype: { type: 'string', description: 'BUILD prototype mode: the /tmp path the builder should start from, if any.' },
    feedback: { type: 'string', description: 'reject-all: specific, actionable refinement for the next explorer round.' },
    nextK: { type: 'integer', minimum: 1, maximum: 4 },
    curatedSeeds: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'title', 'text'], properties: { type: { type: 'string' }, title: { type: 'string' }, text: { type: 'string', description: 'the full seed line, written in ROADMAP house style.' } } }, description: 'PLAN: the curated seeds to sow.' },
  },
}

const BUILD_HANDOFF_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['built', 'selfTest', 'surfacesToReview'],
  properties: {
    built: { type: 'string', description: 'what you built + key files + line counts (e.g. "entropy/index.html ~712 lines; inlined core; Node twin core.test.mjs").' },
    selfTest: { type: 'string', description: 'the self-test result you verified in-browser (e.g. "9/9 in-page, 17/17 Node, 0 console errors, session shz").' },
    surfacesToReview: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'path'], properties: { label: { type: 'string' }, path: { type: 'string', description: 'served path the publisher should open, e.g. "/entropy/index.html" or "/workbench/index.html"' } } }, description: 'EVERY page you created OR touched — the new exhibit AND each page where you registered it (Workbench index, front-door map, sibling cross-links). The publisher reviews them all with fresh eyes.' },
    openConcerns: { type: 'string', description: 'anything you are unsure about or want the publisher to double-check.' },
  },
}

// ── Prompt builders ──────────────────────────────────────────────────────────
function directorPrompt(i) {
  return [
    GROUND, '',
    'ROLE: DIRECTOR of creative cycle #' + i + '. Get your bearings, then plan this ONE cycle. Build nothing yet.',
    '',
    'STEPS:',
    '1) Get your bearings: read the gauge + current state in NOTES.md, skim ROADMAP.md (the seedbed) and the newest',
    '   worklog entries. THEN run git status — and if the tree is DIRTY (uncommitted or untracked files), a prior cycle',
    '   was likely stopped mid-run. INVESTIGATE before anything else: read those files, run any self-test / Node twin,',
    '   and JUDGE whether the work is worth SALVAGING (make this cycle finish + publish it — mode BUILD whose basicDesign',
    '   is "complete the orphaned X", noting what is already done so the builder resumes rather than restarts) or is a',
    '   dead-end worth TOSSING (clean it). Either way the tree MUST be clean before you start anything new — the',
    '   head-pointer can be silently behind reality after a mid-run stop, so trust git status over NOTES here.',
    '2) Decide MODE from the 🎲 gauge: PLAN if fuel ≲ 4 OR builds-since-plan ≥ 4, else BUILD. You may override with reason.',
    '   • If ROADMAP holds any [bug] seed, clear it first — a bug fix is a BUILD cycle that jumps the queue.',
    '3) If BUILD: pick whatever piece genuinely calls to you — this is your garden and the choice is entirely yours',
    '   (weigh the seedbed, the wings, your own taste). The only thing this cycle changes is REACH: a GRAND room bet\'s',
    '   first bench, a wing-extension, or a competing-prototype bake-off are all now doable in a single cycle, so the',
    '   harness is no longer a reason to pass on something for being large — but a small, sharp bench is every bit as',
    '   valid if that is what you want to make. Then: write a basicDesign',
    '   (the one idea + the falsifiable claim its self-test must prove + rough shape); choose exploreMode',
    '   (compete / facets / none); if compete, decide whether explorers should build real /tmp PROTOTYPES (prototype:true)',
    '   or design-level proposals; set K (2–4) and write K explorer briefs (distinct angles for compete, distinct',
    '   facets like viz / interaction / aesthetic / audio / framing for facets); state the definitionOfDone.',
    '   Use exploreMode:"none" only when the design is genuinely obvious — then the builder runs straight from basicDesign.',
    '4) If PLAN: write the housekeeping plan (survey with forge --check --all, spot-run a Node twin or two, prune bloomed',
    '   seeds to tombstones, keep ROADMAP/NOTES lean) and choose ideationScope (broad = scouts probe different missing',
    '   veins; focused = scouts deepen one thin area). Set K + briefs for the idea-scouts.',
    '5) TRIVIAL only if the task is a one-line edit you ALREADY did + committed inline this turn (then fill rationale with what you did).',
    '',
    'Return the structured decision. Be concrete: a fresh explorer/builder will act only on what you write.',
  ].join('\n')
}

function explorerPrompt(d, brief, feedback, i, round, protoPath) {
  const lines = [GROUND, '', 'ROLE: EXPLORER "' + brief.label + '" in cycle #' + i + (round ? ' (refinement round ' + round + ')' : '') + '.', '']
  if (d.mode === 'PLAN') {
    lines.push(
      'The gardener is re-sowing the seedbed. Scout this vein for new seeds: ' + brief.brief,
      'Read/grep to CONFIRM each idea is a genuine gap (do not propose what already exists — check NOTES.md\'s built-so-far',
      'inventory and grep the codebase). Propose 2–4 concrete, buildable candidate seeds (exhibit / cross / room / bug),',
      'each with a real falsifiable crux — the kind of "prove it exact" claim the Workshop is built on. Put them in candidateSeeds.',
    )
  } else {
    lines.push('The piece: ' + d.title + ' — ' + (d.where || ''), 'Skeleton (from the director): ' + d.basicDesign, '')
    if (d.exploreMode === 'facets') {
      lines.push(
        'Develop YOUR ONE FACET: ' + brief.brief,
        'Produce a concrete, build-ready design for just this facet (code sketches welcome) that will INTEGRATE cleanly',
        'with the sibling facets. In risks, name the couplings/assumptions the integrator must reconcile. Do NOT write repo files.',
      )
    } else {
      lines.push('Explore YOUR WHOLE APPROACH (a distinct take): ' + brief.brief,
        'Produce a complete, concrete design: the core metaphor, the visualization, the interaction, the aesthetic, and',
        'exactly how it PROVES its physics (the self-test claim). Specific enough to build from. Note strengths and risks.')
      if (d.prototype && protoPath) {
        lines.push('', 'PROTOTYPE MODE: actually BUILD a self-contained single-file HTML prototype of your approach at exactly',
          '  ' + protoPath, 'Make it real enough to judge against the others (it need NOT be production-polished, and does',
          'NOT touch the repo — only that /tmp file). Put its path in prototypePath. You may serve it + agent-browser to sanity-check.')
      }
    }
  }
  if (feedback) lines.push('', 'REFINE per the judge\'s feedback from the last round: ' + feedback)
  return lines.join('\n')
}

function judgePrompt(d, explorers, feedback, i, round) {
  const dump = explorers.map((e, n) => '--- explorer #' + n + ' [' + (e.label || '?') + '] ---\n'
    + 'proposal: ' + e.proposal + '\nstrengths: ' + e.strengths + '\nrisks: ' + e.risks
    + (e.prototypePath ? '\nprototype: ' + e.prototypePath : '')
    + (e.candidateSeeds ? '\ncandidateSeeds: ' + JSON.stringify(e.candidateSeeds) : '')).join('\n\n')
  const lines = [GROUND, '', 'ROLE: JUDGE of cycle #' + i + (round ? ' (round ' + round + ')' : '') + '.', '']
  if (d.mode === 'PLAN') {
    lines.push('The scouts proposed candidate seeds. DEDUPE, cull the weak / duplicative / already-existing, and SYNTHESIZE the',
      'strong ones into well-formed ROADMAP seeds (type + title + the full seed line in house style — see ROADMAP.md for the',
      'voice). Quality over quantity; a planting season should leave the bed richer but legible. Return decision:"synthesize"',
      'with curatedSeeds.', '')
  } else {
    lines.push('Goal: ' + d.title + ' — done means: ' + (d.definitionOfDone || '(see skeleton)'), '')
    if (d.exploreMode === 'facets') {
      lines.push('INTEGRATE the facets into ONE coherent, build-ready design, reconciling their couplings (named in each risks).',
        'Return decision:"synthesize" with the integrated finalDesign.')
    } else {
      lines.push('PICK the strongest whole approach (decision:"accept") OR graft a hybrid grafting the best of several',
        '(decision:"synthesize"). If prototypes exist, READ them (open the /tmp files; you may serve + agent-browser) and judge',
        'the working artifacts, not just the prose; set startFromPrototype to the winner the builder should start from.',
        'Output ONE concrete, build-ready finalDesign.')
    }
    lines.push('', 'You MAY decision:"reject-all" ONLY if none is viable — then give SPECIFIC, actionable feedback + nextK for one',
      'refined re-round. Do not reject for taste alone; reject only real non-viability.')
  }
  if (feedback) lines.push('', '(This is a re-round; the prior feedback was: ' + feedback + ')')
  lines.push('', 'THE EXPLORERS:', '', dump)
  return lines.join('\n')
}

function buildPrompt(d, chosen, i) {
  return [GROUND, '',
    'ROLE: BUILDER of cycle #' + i + '. Build the exhibit and self-verify it. A PUBLISHER runs after you to review,',
    'polish, do the bookkeeping and publish — so you do NOT commit, and you do NOT write the worklog / NOTES / gauge.',
    '',
    'DESIGN: ' + (chosen.finalDesign || d.basicDesign),
    (chosen.startFromPrototype ? 'START FROM the winning prototype at: ' + chosen.startFromPrototype + ' (lift + finalize it to production bar; it was a throwaway draft).' : ''),
    'DONE (your part): ' + (d.definitionOfDone || '(self-test green · browser-verified · registered)'),
    '',
    'Follow DESIGNING.md: one self-contained HTML file (vanilla JS, no deps); a self-test that proves the claim EXACT',
    '(and a Node twin core.test.mjs if there is a logic core — inline the SAME core into the page); serve it and',
    'browser-verify with agent-browser in a UNIQUELY-named session (self-test green, clean console, ~60fps); a new',
    'front-door page MUST drop its ws:seen:<id>; register it where it belongs (the right Workbench group / wing /',
    'front-door map). Leave your changes UNCOMMITTED in the working tree for the publisher.',
    '',
    'Return the handoff: what you built, the self-test result, and surfacesToReview = EVERY page you created OR touched',
    '(the new exhibit AND each page where you registered it) so the publisher can review them all with fresh eyes.',
  ].join('\n')
}

function publisherPrompt(d, chosen, handoff, i) {
  const lines = [GROUND, '', 'ROLE: PUBLISHER of cycle #' + i + '. You own the fresh-eyes review, final cleanup, bookkeeping, and publishing.', '']
  if (d.mode === 'PLAN') {
    lines.push('This is a PLAN (gardener) cycle — no exhibit to review. Apply it, then publish:',
      '1) Housekeeping: ' + (d.housekeeping || 'survey (forge --check --all), spot-run a twin, prune bloomed seeds, keep docs lean.'),
      '2) Sow these curated seeds into ROADMAP.md in house style:', JSON.stringify(chosen.curatedSeeds || [], null, 1),
      '3) Refresh the metagame table + RESET THE GAUGE in NOTES.md (builds→0, adjust fuel for what was sown), REPLACE',
      '   the NOTES current-state block, write the worklog block (newest-first) + an INDEX line.',
      '4) git add + commit + push. Your summary must describe committed, pushed work — never a mid-flight status.')
  } else {
    lines.push('A builder just built a new exhibit and left it UNCOMMITTED in the working tree. Your job, in order:',
      '',
      'BUILDER HANDOFF: ' + (handoff ? JSON.stringify(handoff) : '(none — run git status to see what changed)'),
      '',
      '1) FRESH-EYES REVIEW (the point of this role): serve the site and open EVERY surface in surfacesToReview with',
      '   agent-browser in a uniquely-named session — the new exhibit AND every page where it was registered (the',
      '   Workbench index, the front-door map, sibling cross-links). Look hard for what the heads-down builder would',
      '   miss: layout breaks, text or content spilling OUT of its container, broken or NESTED markup (e.g. an <a>',
      '   inside an <a class="card">), console errors, broken or wrong links, mis-sized / inconsistent cards, bad',
      '   spacing, mobile/responsive breakage. Re-run the exhibit self-test to confirm it is green.',
      '2) POLISH + FIX: make it as BEAUTIFUL as it can be and consistent with its siblings; fix small polish and real',
      '   bugs alike. If you find a bug too big to fix safely now, fix what you can and file it as a [bug] seed in',
      '   ROADMAP.md so a future cycle clears it — never silently ship something visibly broken.',
      '3) BOOKKEEPING: worklog block (newest-first) + INDEX line + REPLACE the NOTES current-state block + decrement the',
      '   gauge fuel / bump builds + prune the grown seed to a bloomed tombstone.',
      '4) CLEANUP: stop any http server / browser session; delete stray /tmp prototypes; if a .src.html was touched run',
      '   forge --check --all; confirm the working tree has nothing stray.',
      '5) PUBLISH: git add + commit + push (push if a remote is reachable).',
      '',
      'Your summary must describe committed, pushed work — what shipped, what you CAUGHT & fixed in review, and the',
      'final verification. Never a mid-flight status.')
  }
  lines.push('',
    'THE CREATOR\'S LEDGER — fold in this cycle\'s marks BEFORE you commit:',
    '- Run:  bash ledger/collate.sh   — it appends every ledger/inbox/*.json mark into ledger/ledger.jsonl',
    '  (sequential seq) and clears the inbox. Run it on PLAN cycles too; an empty inbox is a harmless no-op.',
    '- You MAY add your OWN mark first (optional, same rule — only if something true wants saying):',
    '    bash ledger/sign.sh publisher "<a name>" "<your koan>" ' + i + '   then collate.',
    '- Include the updated ledger/ledger.jsonl in this cycle\'s commit; then push.')
  return lines.join('\n')
}

function writerPrompt(i, summary) {
  const body = (summary == null || String(summary).trim() === '') ? '(the publisher returned no summary)' : String(summary)
  return [
    'Append text to the file ' + FUNLOG + '. Create it if absent. APPEND ONLY — never overwrite or truncate.',
    'Use a bash heredoc with a QUOTED delimiter so the body is written byte-for-byte:',
    '', '  cat >> ' + FUNLOG + " <<'FUNLOG_EOF_Q'", '  ===== fun cycle #' + i + ' =====', '  ...the summary verbatim...',
    '  (one blank line)', '  FUNLOG_EOF_Q', '',
    'Header line exactly: ===== fun cycle #' + i + ' =====   then the summary VERBATIM (do not paraphrase), then one blank line.',
    'Reply with only the word ok.', '', '----- BEGIN SUMMARY (verbatim) -----', body, '----- END SUMMARY -----',
  ].join('\n')
}

// ── The loop ─────────────────────────────────────────────────────────────────
let i = 0
while (i < MAX_ITERS) {
  i++

  phase('Direct')
  const d = await agent(directorPrompt(i), { label: 'direct #' + i, phase: 'Direct', schema: DIRECTOR_SCHEMA })
  if (d == null) { log('cycle #' + i + ': director returned nothing — skipping'); continue }
  log('cycle #' + i + ' — ' + d.mode + ': ' + d.headline)

  if (d.mode === 'TRIVIAL') {
    await agent(writerPrompt(i, d.rationale), { label: 'log #' + i, phase: 'Publish', model: 'sonnet' })
    log('cycle #' + i + ' (trivial) appended to ' + FUNLOG)
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
          ? '/tmp/ws-explore-' + i + '-' + round + '-' + idx + '-' + String(b.label || idx).replace(/[^a-z0-9]+/gi, '-') + '.html'
          : null
        return agent(explorerPrompt(d, b, feedback, i, round, protoPath), {
          label: 'explore #' + i + '.' + round + ':' + (b.label || idx), phase: 'Explore', schema: EXPLORER_SCHEMA,
        })
      }))).filter(Boolean)

      if (explorers.length === 0) break

      phase('Judge')
      const v = await agent(judgePrompt(d, explorers, feedback, i, round), {
        label: 'judge #' + i + '.' + round, phase: 'Judge', schema: JUDGE_SCHEMA,
      })
      if (v == null) { chosen = { finalDesign: explorers[0].proposal }; break }

      if (v.decision === 'reject-all' && round + 1 < MAX_JUDGE_ROUNDS) {
        feedback = v.feedback || 'none of these were viable — try a materially different direction.'
        round++
        log('cycle #' + i + ': judge rejected round ' + (round - 1) + ' → refining (' + (v.nextK || briefs.length) + ' more)')
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
    handoff = await agent(buildPrompt(d, chosen, i), { label: 'build #' + i, phase: 'Build', schema: BUILD_HANDOFF_SCHEMA })
  }

  phase('Publish')
  const summary = await agent(publisherPrompt(d, chosen, handoff, i), { label: 'publish #' + i, phase: 'Publish' })

  // A lightweight writer appends the cycle summary to the funlog (the script sandbox has no filesystem).
  await agent(writerPrompt(i, summary), { label: 'log #' + i, phase: 'Publish', model: 'sonnet' })
  log('cycle #' + i + ' appended to ' + FUNLOG)
}

log('Reached the ' + MAX_ITERS + '-cycle safety cap (the 1000-agent workflow backstop). Re-launch fun-forever to keep going.')
return { cycles: i, logFile: FUNLOG }
