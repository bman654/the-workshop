export const meta = {
  name: 'fun-forever',
  description: 'The Workshop\'s creative-cycle loop: each iteration a director plans (PLAN or BUILD per the gauge), explorers diverge, a judge selects/synthesizes (and may reject-all → one refined re-round), and a builder ships to done in-turn. Each cycle\'s summary appends to /tmp/funlog.txt until cancelled.',
  phases: [
    { title: 'Direct', detail: 'one director reads the gauge + bearings and plans the cycle' },
    { title: 'Explore', detail: 'K parallel explorers diverge — competing approaches, complementary facets, or idea-scouting' },
    { title: 'Judge', detail: 'one judge selects / integrates / synthesizes (may reject-all → one refined re-round)' },
    { title: 'Build', detail: 'one builder ships to the definition-of-done in-turn: self-test, browser-verify, commit + push' },
  ],
}

// ── Tuning ───────────────────────────────────────────────────────────────────
// Worst case per cycle ≈ 1 director + (K×rounds) explorers + (rounds) judges +
// 1 builder + 1 writer ≈ 13 agents (K=4, 2 rounds). 70 cycles stays under the
// 1000-agent backstop. Re-launch fun-forever to keep going past the cap.
const MAX_ITERS = 70
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
].join('\n')

// ── Schemas ──────────────────────────────────────────────────────────────────
const DIRECTOR_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['mode', 'rationale', 'headline'],
  properties: {
    mode: { enum: ['BUILD', 'PLAN', 'TRIVIAL'], description: 'Read the gauge in NOTES.md; PLAN if fuel ≲ 4 OR builds ≥ 4, else BUILD. TRIVIAL only for a tiny edit you already did inline this turn.' },
    rationale: { type: 'string', description: 'Why this and why now — quote the gauge read, and (for BUILD) why this piece over alternatives.' },
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

// ── Prompt builders ──────────────────────────────────────────────────────────
function directorPrompt(i) {
  return [
    GROUND, '',
    'ROLE: DIRECTOR of creative cycle #' + i + '. Get your bearings, then plan this ONE cycle. Build nothing yet.',
    '',
    'STEPS:',
    '1) Read the gauge + current state in NOTES.md, skim ROADMAP.md (the seedbed) and the newest worklog entries.',
    '2) Decide MODE from the 🎲 gauge: PLAN if fuel ≲ 4 OR builds-since-plan ≥ 4, else BUILD. You may override with a stated reason.',
    '   • If ROADMAP holds any [bug] seed, PRIORITIZE it — a bug fix is a BUILD cycle that jumps the queue.',
    '3) If BUILD: pick the piece. **Bias toward the bigger bets** — advance a GRAND room bet or extend a wing that has been',
    '   sitting (e.g. the Engine Room has zero benches; a wing with one bench wants its second). Do NOT default to the',
    '   smallest safe bench every time; periodically commit to a real piece of a grand bet. Then: write a basicDesign',
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

function builderPrompt(d, chosen, i) {
  const lines = [GROUND, '', 'ROLE: BUILDER of cycle #' + i + '. Execute to DONE, in this single turn, then commit + push.', '']
  if (d.mode === 'PLAN') {
    lines.push('This is a PLAN (gardener) cycle. Apply it:',
      '1) Housekeeping: ' + (d.housekeeping || 'survey (forge --check --all), spot-run a twin, prune bloomed seeds, keep docs lean.'),
      '2) Sow these curated seeds into ROADMAP.md in house style:', JSON.stringify(chosen.curatedSeeds || [], null, 1),
      '3) Refresh the metagame table + RESET THE GAUGE in NOTES.md (builds→0, adjust fuel for what was sown), and REPLACE',
      '   the NOTES current-state block with this session\'s. Write the worklog block (newest-first) + an INDEX line.',
      '4) git add + commit + push. Your summary must describe committed, pushed work — never a mid-flight status.')
  } else {
    lines.push('Build this design to the Workshop\'s definition-of-done (see DESIGNING.md):',
      '', 'DESIGN: ' + (chosen.finalDesign || d.basicDesign),
      (chosen.startFromPrototype ? 'START FROM the winning prototype at: ' + chosen.startFromPrototype + ' (lift + finalize it; it is a throwaway draft, hold it to production bar).' : ''),
      '', 'DONE means: ' + (d.definitionOfDone || '(self-test green · browser-verified · registered · docs · committed)'),
      '',
      'The contract: one self-contained HTML file (vanilla JS, no deps); a self-test that proves the claim EXACT (and a Node',
      'twin core.test.mjs if there is a logic core — inline the SAME core into the page); serve it and browser-verify with',
      'agent-browser (self-test green, clean console, ~60fps) in a UNIQUELY-named session; a new front-door page MUST drop its',
      'ws:seen:<id> breadcrumb; register it where it belongs (Workbench group / the right wing); update docs (worklog block',
      'newest-first + INDEX line + REPLACE the NOTES current-state + decrement the gauge fuel / bump builds + prune the grown',
      'seed to a bloomed tombstone). If you started a server/browser, stop it. Then git add + commit + push (push if a remote',
      'is reachable). If you hit a real wall, commit what is solid and state plainly what remains — never leave it uncommitted.',
      '', 'Your summary must describe committed, pushed work, not a mid-flight status.')
  }
  return lines.join('\n')
}

function writerPrompt(i, summary) {
  const body = (summary == null || String(summary).trim() === '') ? '(the builder returned no summary)' : String(summary)
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

  let summary
  if (d.mode === 'TRIVIAL') {
    summary = d.rationale
  } else {
    const briefs = (d.briefs || []).slice(0, d.K || (d.briefs || []).length || 2)
    let chosen = null

    if (d.mode === 'BUILD' && d.exploreMode === 'none') {
      chosen = { finalDesign: d.basicDesign }           // design is clear → straight to builder
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

        if (explorers.length === 0) { break }

        phase('Judge')
        const v = await agent(judgePrompt(d, explorers, feedback, i, round), {
          label: 'judge #' + i + '.' + round, phase: 'Judge', schema: JUDGE_SCHEMA,
        })
        if (v == null) { chosen = { finalDesign: explorers[0].proposal }; break }   // judge died → take the first viable

        if (v.decision === 'reject-all' && round + 1 < MAX_JUDGE_ROUNDS) {
          feedback = v.feedback || 'none of these were viable — try a materially different direction.'
          round++
          log('cycle #' + i + ': judge rejected round ' + (round - 1) + ' → refining (' + (v.nextK || briefs.length) + ' more)')
        } else {
          chosen = v                                     // accept / synthesize (or reject on the last allowed round → take best)
          if (v.decision === 'reject-all') chosen = { finalDesign: '(judge still unsatisfied; build the strongest attempt) ' + (v.reasoning || ''), curatedSeeds: [] }
          break
        }
      }
      if (!chosen) chosen = { finalDesign: d.basicDesign, curatedSeeds: [] }
    }

    phase('Build')
    summary = await agent(builderPrompt(d, chosen, i), { label: 'build #' + i, phase: 'Build' })
  }

  // A lightweight writer appends the cycle summary to the funlog (the script sandbox has no filesystem).
  await agent(writerPrompt(i, summary), { label: 'log #' + i, phase: 'Build', model: 'sonnet' })
  log('cycle #' + i + ' appended to ' + FUNLOG)
}

log('Reached the ' + MAX_ITERS + '-cycle safety cap (the 1000-agent workflow backstop). Re-launch fun-forever to keep going.')
return { cycles: i, logFile: FUNLOG }
