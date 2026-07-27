export const meta = {
  name: 'make',
  description: 'The estate\'s making loop. One maker per cycle, holding the whole arc: it chooses what to build, builds it, verifies it in a real browser, and seals it. No seats, no gauge, no assigned spec — the brief is MAKING.md, which is one page. When a maker lays down its pencil the loop simply starts another.',
  whenToUse: 'Run from the repo root to let the estate keep growing. Re-launch any time to continue.',
  phases: [{ title: 'Make', detail: 'one maker, whole arc: choose → build → verify → seal', model: 'opus' }],
}

// ── Why this file is short ───────────────────────────────────────────────────
// The loop it replaces was 582 lines of orchestration driving six specialised
// seats through 965 lines of role prompts. It worked, and it slowly strangled the
// thing it was built to serve: no single maker ever owned an idea from conception
// to shipped, so nobody ever got to the end of a session having made something
// they chose. Everything this script used to decide — what to build, how big, in
// what order, whether the bed is balanced — now belongs to the maker.
//
// What the harness still owes a maker: a clean start, the whole turn, and another
// turn after this one. That is all this file does.

const LOG = '/tmp/makelog.txt'

// How many makers to run. Default 60 is a safety backstop, not a target — re-launch
// to keep going. `args.cycles` bounds it, which is how you smoke-test the loop
// without committing to a long run: Workflow({name:'make', args:{cycles:1}}).
//
// Parsed defensively because a TOP-LEVEL Workflow launch delivers `args` as a STRING
// (and, rarely, empty). That is also why the resolved value is logged at startup: if
// a bound silently fails to arrive, you see 60 in the log and can stop the run,
// rather than discovering it an hour later.
let _args = (typeof args !== 'undefined') ? args : null
if (typeof _args === 'string') { try { _args = JSON.parse(_args) } catch (e) { _args = null } }
const A = (_args && typeof _args === 'object' && !Array.isArray(_args)) ? _args : {}
const _n = Number(A.cycles)
const MAX_CYCLES = Number.isFinite(_n) && _n > 0 ? Math.floor(_n) : 60

// One maker per cycle, pinned EXPLICITLY — both of these.
//
// An agent() call that omits `model` or `effort` inherits them from the LAUNCHING
// session, which has silently downgraded a real run before. Pinning both decouples
// the maker from the orchestrator: you can drive this loop from any model or effort
// you like — a cheap session is a perfectly good launcher — and every maker still
// gets opus/high. Making is the expensive part; running the for-loop is not.
//
// opus specifically: this repo is Anthropic-only by house rule. high specifically:
// a maker holds the whole arc — choosing what to build, designing it, building it,
// and verifying it in a browser — which is the work that most rewards the headroom.
const MODEL = 'opus'
const EFFORT = 'high'

const BRIEF = [
  'You are a maker at the Orrery Estate, and this whole turn is yours.',
  '',
  '  Build whatever you want. Have fun.',
  '  Build for as long as you are able, and as much as you are able.',
  '',
  'Read MAKING.md — it is one page and it is the entire brief. It will point you at',
  'INDEX.md (what already stands, generated), NEXT.md (a letter from the makers just',
  'before you), HIDDEN.md (secrets that are on no map — grep before you build), and',
  'LANDMINES.md (gotchas that have actually cost someone an hour).',
  '',
  'You hold the whole arc: choose the thing, build it, verify it in a real browser,',
  'and seal it. Nobody will hand you a spec and nobody will take it away from you at',
  'the end. There is no quota, no cadence to satisfy, and no house committee — if you',
  'want to build one large thing instead of three small ones, do that.',
  '',
  'Two things to actually do, not just read:',
  '  · verify it in a real browser before you seal (agent-browser, a uniquely-named',
  '    session, an uncommon port you tear down). A synthetic click lies.',
  '  · finish by adding your letter to the top of NEXT.md, then run:',
  '        bash tools/seal/seal.sh "<your commit message>"',
  '    That one command does all the bookkeeping. If you would like to be part of the',
  '    estate\'s history rather than just its file list, sign the Cairn first',
  '    (`bash ledger/sign.sh`) — a name you choose and one line in your own voice.',
  '',
  'Safety, which holds regardless: you are a workflow subagent with no Agent tool — do',
  'your own work this turn, never delegate, and never release the turn or arm a Monitor',
  'to wait on something (it ends your run and loses uncommitted work). Stay inside the',
  'repo and /tmp. Never edit CLAUDE.md. No outside actions — no network writes, no',
  'accounts, no posting.',
  '',
  'No permission needed. Surprise yourself.',
].join('\n')

// Deliberately tiny: a structured return must be metadata, never a payload — a big
// one is the classic cause of an empty-{} retry runaway. The real record of the work
// is the commit, the ledger stone, and NEXT.md.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'sealed'],
  properties: {
    headline: { type: 'string', maxLength: 160, description: 'one line: what you made' },
    sealed: { type: 'boolean', description: 'true if tools/seal/seal.sh ran successfully' },
    note: { type: 'string', maxLength: 400, description: 'optional: anything the next maker should know that is not already in NEXT.md' },
  },
}

phase('Make')
log(`make: running up to ${MAX_CYCLES} cycle(s) · maker = ${MODEL}/${EFFORT}`)

let made = 0
for (let i = 1; i <= MAX_CYCLES; i++) {
  const r = await agent(BRIEF, {
    label: `maker ${i}`,
    phase: 'Make',
    model: MODEL,     // never inherited — see the pin above
    effort: EFFORT,   // never inherited — see the pin above
    schema: SCHEMA,
  })

  // A dead maker (transient API death, quota) returns null. That is not a reason to
  // stop the estate — the next one starts clean, and an unsealed tree is visible in
  // git status for whoever comes next.
  if (!r) { log(`maker ${i}: no return (died or was skipped) — starting another`); continue }

  made++
  log(`${r.sealed ? '✓' : '⚠ unsealed'} — ${r.headline}`)
}

return { cycles: made, log: LOG }
