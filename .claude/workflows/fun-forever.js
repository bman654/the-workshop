export const meta = {
  name: 'fun-forever',
  description: 'The Workshop\'s creative-cycle loop. Each cycle a director RUNS the deterministic gauge (node seedbed/gauge.mjs) and obeys its mode × track; explorers diverge; a judge selects/synthesizes; a builder ships+self-verifies; a publisher reviews fresh-eyes, sows/prunes, runs `gauge.mjs record`, commits + pushes. Tracks: gardens (gardener/planter) · grounds (groundskeeper/grounds-worker) · FOUNDRY (front-gate upkeep — BUILD forges a bespoke room-rep / gate asset via the ART FOUNDRY engine (a PREP scaffolds the wiring, then K parallel takes → judges → synth), or a surveyor restocks the rep backlog) · bug-fixer. A builder facing a too-big swing may PASS THE BATON — hand off to a fresh builder via a bounded inner loop, so makers stop shying from big work. A Patron\'s WRIT outranks all: the director triages it — clauses that try to control the DEPLOYED estate are released as ordinary unmarked seeds (the collective\'s call), while operational work and off-estate creative content (a vault note, a repo asset) are mandated (the steward implements); a writ cycle is cadence-neutral (decays nothing). Each cycle\'s summary appends to /tmp/funlog.txt until cancelled.',
  phases: [
    { title: 'Direct', detail: 'one director runs `node seedbed/gauge.mjs`, salvages any orphaned work, and plans the cycle the gauge names' },
    { title: 'Explore', detail: 'K parallel explorers diverge — rival approaches / FORM concepts / seed-scouting per the track' },
    { title: 'Judge', detail: 'one judge selects / integrates / curates (may reject-all → one refined re-round)' },
    { title: 'Build', detail: 'one builder ships the piece + self-verifies (BUILD cycles only; does not commit). A foundry cycle runs PREP then the ART FOUNDRY engine (K takes → judges → synth) instead; a too-big swing may pass the baton to fresh builders' },
    { title: 'Publish', detail: 'one publisher reviews every surface, sows/prunes, runs gauge.mjs record, commits + pushes' },
  ],
}

// ── Tuning ───────────────────────────────────────────────────────────────────
// Worst case per cycle ≈ 1 director + (K×rounds) explorers + (rounds) judges +
// 1 builder + 1 publisher + 1 writer ≈ 14 agents (K=4, 2 rounds). 60 cycles
// stays under the 1000-agent backstop. Re-launch fun-forever to keep going —
// the DURABLE cycle lives in seedbed/state.json, so it counts on past this run.
const MAX_JUDGE_ROUNDS = 2        // the judge may reject the whole batch and demand ONE refined re-round
const MAX_BATON = 3               // a BUILD may pass the baton to a fresh builder this many times (4 builders total) — bounds the inner loop
const FUNLOG = '/tmp/funlog.txt'

// ── Portability + operability (all args optional; clone & run from ANYWHERE) ───
// The loop carries NO machine-specific paths. Every seat is a subagent that inherits the launch cwd (the repo
// root) and uses RELATIVE paths; the only ABSOLUTE need is locating the art-foundry engine for the script-level
// workflow() call, which comes from DERIVED_ROOT (computed once below — the director-side `git rev-parse`, or
// args.repoRoot). A test/operator launch may also force ONE specific cycle instead of obeying the gauge.
//   args.repoRoot : absolute repo-root override (e.g. drive a pre-merge worktree from a different session cwd)
//   args.induce   : a directive {mode,track,…} that REPLACES the gauge for ONE cycle (operability + smoke tests)
//   args.testMode / induce.testMode : the publisher does NOT commit/push/record — leaves the tree for inspection
const FORCED_ROOT = (typeof args !== 'undefined' && args && args.repoRoot) ? String(args.repoRoot) : null
const INDUCE = (typeof args !== 'undefined' && args && args.induce) ? args.induce : null
const TEST_MODE = !!((INDUCE && INDUCE.testMode) || (typeof args !== 'undefined' && args && args.testMode))
const MAX_ITERS = INDUCE ? 1 : 60 // an induced run is a single forced cycle; the normal loop runs to the safety cap

// ── Grounding — the prompts now live as tunable files in seedbed/prompts/ ──────
// The workflow-script SANDBOX can't read files, but every SUBAGENT can. So a seat
// prompt is a thin POINTER ("read prompts/ground.md + prompts/<seat>.md") plus a
// JSON CONTEXT block of this cycle's dynamic inputs. Editing a prompt .md between
// cycles re-tunes the live loop with no relaunch. A short always-on safety preamble
// stays inline (guaranteed, even if a seat skips a read).
function preamble(file) {
  const loc = FORCED_ROOT
    ? 'project the-workshop. FIRST run `cd ' + FORCED_ROOT + '` — that is the repo root for THIS run; do EVERYTHING there.'
    : 'project the-workshop; your cwd is the repo root where the loop was launched — run all commands from there.'
  return [
    'You are ONE seat in the Workshop\'s autonomous creative loop (' + loc + ')',
    'Read these two files IN FULL with the Read tool and follow them as your standing instructions, THEN act on',
    'the cycle context below:',
    '  • seedbed/prompts/ground.md   — the house rules, the soul, the gauge, the ledger (EVERY seat reads this)',
    '  • seedbed/prompts/' + file + '   — your role brief for this cycle',
    'ALWAYS-ON SAFETY (holds even before you read): you are a workflow subagent with NO Agent/Task tool — do',
    'your OWN work this turn, never delegate, never release the turn or arm a Monitor to wait on anything (it',
    'ends your run and loses uncommitted work). Stay in the repo + /tmp; never edit CLAUDE.md. Outside actions',
    '(Slack / vault / network) are FORBIDDEN unless you are the steward acting on a writ\'s explicit AUTHORIZES.',
  ].join('\n')
}
function seatPrompt(file, role, context) {
  return [
    preamble(file), '',
    'ROLE: ' + role + (context && context.cyc ? ' — cycle #' + context.cyc : '') + '.', '',
    'YOUR CONTEXT for this cycle (the dynamic inputs your role brief refers to, as JSON):',
    JSON.stringify(context || {}, null, 2),
  ].join('\n')
}

// ── Schemas ──────────────────────────────────────────────────────────────────
const DIRECTOR_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['mode', 'track', 'currentCycle', 'rationale', 'headline'],
  properties: {
    mode: { enum: ['BUILD', 'PLAN', 'TRIVIAL', 'WRIT'], description: 'COPY from `node seedbed/gauge.mjs` (the "mode" field). TRIVIAL only for a tiny edit you already did + committed inline this turn. WRIT = the gauge found a Patron\'s writ — triage it (see the WRIT fields below).' },
    track: { enum: ['garden', 'grounds', 'foundry', 'bug', 'writ'], description: 'COPY from the gauge (the "track" field). garden=grow what exists · grounds=new structure · foundry=front-gate upkeep (BUILD: ripen a ripe [rep]/[gate] foundry seed into a foundrySpec — a PREP scaffolds it + the ART FOUNDRY engine forges the art via K takes; PLAN: survey the estate for the next bespoke reps + sow them) · bug=a fix jumps the queue · writ=the Patron\'s request.' },
    currentCycle: { type: 'integer', description: 'COPY the gauge\'s gauges.currentCycle — the durable cycle # to stamp seeds + the funlog with (NOT the within-run loop index).' },
    rationale: { type: 'string', description: 'Quote the gauge\'s reason line; note any orphaned work git status revealed + how you handled it; and (BUILD) why this piece.' },
    headline: { type: 'string', description: 'One line naming the cycle, e.g. "BUILD/grounds: open The Conservatory — the estate goes wide".' },
    // BUILD
    title: { type: 'string' }, where: { type: 'string', description: 'Where it lives + how it is reached (a Workbench group / a wing / a NEW front-door footprint for a grounds swing).' },
    basicDesign: { type: 'string', description: 'The skeleton: the one idea, the FORM it takes (what real thing you SHOW / how it is touched or played — reach past a plain graph), and — IF it makes a math claim — the claim its self-test proves (conditional, not required). For a REWORK: which existing piece + the soul it lacks + the re-soul direction. For a bug: what is broken + the fix.' },
    exploreMode: { enum: ['compete', 'facets', 'none'], description: 'compete = K rival approaches → judge picks/hybridizes (for a grounds room, make these divergent FORM concepts); facets = K complementary facets → judge integrates; none = design clear, skip to the builder (common for a bug fix).' },
    prototype: { type: 'boolean', description: 'compete only: should explorers build a real self-contained single-file HTML PROTOTYPE (to a unique /tmp path) so the judge compares working artifacts? Default false.' },
    K: { type: 'integer', minimum: 2, maximum: 4 },
    briefs: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'brief'], properties: { label: { type: 'string' }, brief: { type: 'string', description: 'the specific angle/facet/form-concept this explorer owns' } } } },
    definitionOfDone: { type: 'string', description: 'What "shipped" means (self-test claim, verification, where it registers — a grounds swing registers a new front-door footprint).' },
    // PLAN
    housekeeping: { type: 'string', description: 'PLAN: the survey + tidy plan. gardener: prune decayed garden seeds FIRST (gauge --status lists them), hold ROADMAP/NOTES lean, forge --check. groundskeeper: prune passed-over grounds seeds, keep the spark supply, tailor sparks → grounds seeds.' },
    ideationScope: { enum: ['broad', 'focused'], description: 'PLAN: broad = scouts probe different veins; focused = scouts deepen one thin area.' },
    // WRIT (the Patron's request — triage it)
    writWork: { enum: ['mandate', 'release', 'mixed', 'ambiguous'], description: 'WRIT: your triage verdict (see the triage TEST in the director steps). mandate = the cycle DOES the work (operational, OR creative content that lands OFF the deployed estate — a vault note, a repo asset, an analysis, a message). release = the request tries to exert creative control over the deployed estate (a new exhibit, redesign, re-soul, taste call) → release it as ordinary seeds, build nothing. mixed = some clauses each. ambiguous = you cannot decide which pile, OR cannot understand the request, OR it is impossible / out of scope → the steward consumes the writ doing NO work and sends the Patron a Slack notify with the problem + the writ text. For mandate/mixed fill the BUILD fields (title/basicDesign/exploreMode/K/briefs/definitionOfDone); for release/ambiguous set exploreMode "none".' },
    writReleasedSeeds: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'title', 'text'], properties: { type: { type: 'string', description: 'garden: exhibit|cross|curation|rework · grounds: room|engine|metagame|map|medium · or spark' }, title: { type: 'string' }, text: { type: 'string', description: 'the FULL ≤3-line seed line in ordinary ROADMAP house style — phrased exactly like a seed the collective itself would write. NEVER mention the Patron / the writ / its origin: a released clause carries no providence and gets no priority.' } } }, description: 'WRIT (creative-only/mixed): each creative clause, rephrased as a normal seed/spark for the publisher to sow UNMARKED into the ordinary beds. The collective may take it up or let it decay like any other.' },
    writOutsideAction: { type: 'string', description: 'WRIT: if (and only if) the writ AUTHORIZES one outside action (a Slack/email message, a vault write, etc.), copy that authorization here VERBATIM. The STEWARD alone performs it, exactly once; leave empty if the writ authorizes none.' },
    // FOUNDRY (BUILD/foundry only — the ripened build-ready rep spec the ART FOUNDRY engine forges)
    foundrySpec: {
      type: 'object', additionalProperties: false,
      required: ['id', 'repConcept', 'aspect', 'kind'],
      properties: {
        id: { type: 'string', description: 'the estate room id (its slab id + the ?room= pin), e.g. "firmament".' },
        room: { type: 'string', description: 'the room display name, e.g. "The Firmament".' },
        repConcept: { type: 'string', description: 'what the drawn calling-card object IS, e.g. "an armillary sphere of nested brass rings".' },
        aspect: { enum: ['vertical', 'horizontal', 'mound'], description: 'which slot shape the rep fills: vertical (tall+narrow) | horizontal (wide+short) | mound (squat).' },
        accent: { type: 'string', description: 'the room accent hex (a fallback glow / the glyph-stand pip).' },
        repColors: { type: 'object', description: 'optional per-band rep palette: { DAY:{"rep.swatch1":"#..","rep.glow1":"#.."}, DUSK:{…}, NIGHT:{…} } — band keys + dotted role keys.' },
        kind: { enum: ['rep', 'gate'], description: 'rep = a NEW bespoke room-rep (the PREP scaffolds new wiring via rep-spec.mjs) · gate = re-soul an EXISTING rep/asset (PREP resolves the LIVE drawFn, no new wiring).' },
      },
      description: 'BUILD/foundry ONLY: ripen the ripe [rep]/[gate] seed into this structured spec — the foundry PREP feeds it to gate-foundry/rep-spec.mjs + composes the engine asset spec; the ART FOUNDRY engine then forges the art via K parallel takes (you do NOT design the art or run explorers).',
    },
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
    candidateSeeds: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'title', 'sketch'], properties: { type: { type: 'string', description: 'garden: exhibit | cross | curation | rework · grounds: room | engine | metagame | map · or spark' }, title: { type: 'string' }, sketch: { type: 'string', description: 'the ≤3-line provocation + the FORM it wants (touchable / living / game / sound — not just a graph) + (IF it makes a math claim) its falsifiable crux; grep-confirmed a genuine gap. For a rework: name the existing piece + the soul it lacks + the re-soul direction.' } } }, description: 'PLAN scouts only.' },
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
    curatedSeeds: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'title', 'text'], properties: { type: { type: 'string', description: 'garden: exhibit | cross | curation | rework · grounds: room | engine | metagame | map · or spark' }, title: { type: 'string' }, text: { type: 'string', description: 'the full ≤3-line seed line in ROADMAP house style (sparks are one phrase; a rework names the existing piece + the soul it lacks + the re-soul direction).' } } }, description: 'PLAN: the curated seeds/sparks to sow into the right fenced section.' },
  },
}

const BUILD_HANDOFF_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['built', 'selfTest', 'surfacesToReview'],
  properties: {
    built: { type: 'string', description: 'what you built + key files + line counts. If you are passing the baton, what you got DONE so far.' },
    selfTest: { type: 'string', description: 'the self-test result you verified in-browser (in-page pill + any Node twin + console state).' },
    surfacesToReview: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'path'], properties: { label: { type: 'string' }, path: { type: 'string', description: 'served path the publisher should open, e.g. "/conservatory/index.html" or "/workbench/index.html"' } } }, description: 'EVERY page you created OR touched — the new piece AND each page where you registered it (Workbench / front-door map / sibling cross-links / a new wing landing).' },
    openConcerns: { type: 'string', description: 'anything you are unsure about or want the publisher to double-check.' },
    // BATON (a too-big swing handed to a FRESH builder) — leave requestBaton false to finish normally.
    requestBaton: { type: 'boolean', description: 'TRUE only if this swing is genuinely TOO BIG to finish WELL this turn and a FRESH builder should continue it (a bounded inner loop spawns one with your handoff). Do NOT request a baton for polish or a near-done piece — finish those yourself. The work you did stays in the tree; the fresh builder builds ON it. NOTE: a TERMINAL builder (told it is the last pass) CANNOT hand off — the loop ignores its requestBaton — so it MUST finish or reach a clean stopping point.' },
    batonReason: { enum: ['context-exhausted', 'fresh-eyes-wanted', 'more-work-remains'], description: 'REQUIRED when requestBaton is true: WHY you are handing off, so the publisher (and next builder) know the state. context-exhausted = you ran low on turn/context budget mid-build · fresh-eyes-wanted = the work is at a juncture better continued by a fresh perspective · more-work-remains = the design is simply larger than one turn and there is genuinely more to build.' },
    batonHandoff: { type: 'object', additionalProperties: false, required: ['done', 'remaining', 'nextSteps'], properties: { done: { type: 'string', description: 'what is already built + verified (files + line counts) — the fresh builder must NOT redo it.' }, remaining: { type: 'string', description: 'what is left to reach the definition of done.' }, nextSteps: { type: 'string', description: 'the concrete next actions the fresh builder should take FIRST (commands, files to edit, the render/verify recipe).' }, files: { type: 'string', description: 'the key files/paths in play (what is dirty in the tree, where the work lives).' } }, description: 'REQUIRED when requestBaton is true: the handoff context that lets a fresh builder continue WITHOUT re-reading everything from scratch.' },
    // ART FOUNDRY (a build that needs custom in-house art it cannot hand-make well in one turn) — leave unset to finish normally.
    foundryArt: {
      type: 'object', additionalProperties: false, required: ['assets'],
      description: 'IN-HOUSE ART REQUEST: set this when your piece needs custom art (exhibit visuals AND/OR ambience sounds) better forged by the K-takes art foundry than hand-made in one turn. The forged asset is CODE — a JS module (an SVG/canvas draw fn, or a WebAudio builder) conforming to an API YOU define — NOT a wav/png file (those are only the render the judge looks at). Build the system with PLACEHOLDER art FIRST, then WRITE a spec FILE per asset in the working tree (the exact contract: art direction + the API surface the code must expose + how it wires in) and list the assets here — keep this handoff LEAN (pointers, not prose). MIX media freely in one request (e.g. fish + caustics + ambience). The foundry forges each (K takes → judges → synth, installing the winner; grouped by medium), then a FRESH builder wires the real art in. Leave unset/empty to finish normally. NEVER forage art from the web. (Not for gate reps — those are the BUILD/foundry track.)',
      properties: {
        assets: { type: 'array', description: 'the art assets to forge (≤15 total across all media; the engine clamps + logs drops). Keep it to what the piece genuinely needs.', items: { type: 'object', additionalProperties: false, required: ['medium', 'key', 'title', 'judgeFocus', 'specFile'], properties: {
          medium: { enum: ['visual-exhibit', 'sound'], description: 'THIS asset\'s medium (mix freely across the batch). visual-exhibit = a visual asset (SVG/canvas JS) rendered in ITS OWN exhibit via your previewHarness; sound = a WebAudio builder rendered offline to a WAV + analyzed.' },
          key: { type: 'string', description: 'a unique slug — becomes the candidate filename + the engine asset key.' },
          title: { type: 'string', description: 'a one-line title for the asset.' },
          specFile: { type: 'string', description: 'absolute path to a markdown spec FILE you WROTE into the working tree (recommended: with the piece, e.g. <piece-dir>/art-specs/<key>.md). It holds the FULL contract the smith/judge/synth/wiring-builder all read: (1) the art direction + intended style (match the EXHIBIT); (2) the EXACT API the candidate CODE must expose — the function name + signature, what it draws into / returns, the args/params, the coordinate space (visual) or the Gate.sfx builder contract (sound); (3) how it wires into the system + how the preview harness invokes it; (4) constraints/examples. Keeping it as a FILE keeps this handoff lean AND lets a workflow re-run salvage the work after an interruption — the spec survives on disk.' },
          judgeFocus: { type: 'string', description: 'a ONE-LINE bar the judges score against (the full rubric is in the specFile).' },
          brief: { type: 'string', description: 'OPTIONAL one-line gloss of what this asset is (the full brief lives in specFile — do NOT inline a long brief here).' },
          K: { type: 'integer', minimum: 1, maximum: 3, description: 'parallel takes — simple → 1, complex → up to 3 (you pick per asset).' },
          judgeK: { type: 'integer', minimum: 1, maximum: 3, description: 'how many judges rank the takes (default 2).' },
          module: { type: 'string', description: 'the live file the foundry synth installs the winner CODE into (where the exhibit/room loads this asset from).' },
          wireNote: { type: 'string', description: 'OPTIONAL one-line pointer to where the placeholder is (the full wiring is in specFile).' },
          previewHarness: { type: 'string', description: 'visual-exhibit assets ONLY: absolute path to a render harness YOU wrote into the working tree, callable as `bash <harness> <candidate> <outdir> <port>` — it loads the candidate CODE, renders it in the exhibit slot, and screenshots <outdir>/preview.png. One harness may serve several visual assets (repeat the path). Omit for sound (the foundry has a universal WAV bench).' },
          durSec: { type: 'number', description: 'sound assets ONLY: the render / loop length in seconds.' },
        } } },
      },
    },
  },
}

// FOUNDRY PREP — the deterministic-scaffold + spec-compose step before the ART FOUNDRY forges a gate rep.
// PREP returns the engine asset spec (what art-foundry/engine.workflow.js consumes) + what it wired in.
const FOUNDRY_PREP_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['asset', 'scaffolded', 'forgeClean'],
  properties: {
    asset: {
      type: 'object', additionalProperties: false,
      required: ['key', 'title', 'module', 'drawFn', 'iface', 'extraQS', 'geometry', 'brief', 'judgeFocus', 'siblings'],
      properties: {
        key: { type: 'string', description: 'the engine asset key = the rep key (e.g. "firmament-rep").' },
        title: { type: 'string', description: 'a one-line title for the rep, e.g. "the Firmament rep — an armillary sphere".' },
        K: { type: 'integer', minimum: 1, maximum: 3, description: 'parallel takes for the engine (simple rep → 2; complex/animated → 3). Default 3 if omitted.' },
        judgeK: { type: 'integer', minimum: 1, maximum: 3, description: 'judges per asset (default 2).' },
        module: { type: 'string', description: 'always "the-gate/scene.js" for a gate rep — the LIVE file the engine elevates.' },
        drawFn: { type: 'string', description: 'the EXACT scene.js fn name the engine elevates: drawRep<Name> (you stubbed it for a [rep]; for a [gate] it is the EXISTING fn you resolved).' },
        siblings: { type: 'string', description: 'what the engine must keep BYTE-IDENTICAL (every other fn in scene.js — build/buildDefs/grounds/drawRoomRep + the REP_DRAW map apart from this rep\'s ONE line/etc.).' },
        iface: { type: 'string', description: 'always "scene" for a gate rep (a module-internal helper, not the cross-module (parent,S) form).' },
        extraQS: { type: 'string', description: 'the ?room= pin that forces THIS rep on screen, e.g. "room=firmament" (= rep-spec.mjs renderQS).' },
        geometry: { type: 'string', description: 'the aspect slot geometry (copy rep-spec.mjs\'s geometry string for the aspect).' },
        brief: { type: 'string', description: 'the ART BRIEF you composed: what the object IS, the estate idiom, the roles (rep.swatch*/rep.glow1), EMISSIVE, restraint — enough for a smith to forge it.' },
        judgeFocus: { type: 'string', description: 'the judge focus you composed: the specific questions a judge scores this rep on (does it read as X? right aspect? glow at night? idiom-faithful?).' },
      },
    },
    scaffolded: { type: 'string', description: 'what you wired into the LIVE tree: the rooms.js BESPOKE entry + the scene.js REP_DRAW line + the drawRep<Name> stub ([rep]); OR "existing drawFn resolved — no new wiring" ([gate]).' },
    forgeClean: { type: 'boolean', description: 'node --check passed on the touched files AND `node tools/forge/forge.mjs --check --all` is current after your scaffolding (the rep renders empty-but-valid at ?room=<id>).' },
    openConcerns: { type: 'string', description: 'anything the foundry / publisher should know (e.g. a tricky aspect fit, a [gate] whose live drawFn name differs from the seed).' },
  },
}

const STEWARD_HANDOFF_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['did', 'outsideActionPerformed'],
  properties: {
    did: { type: 'string', description: 'what you carried out for the Patron — repo files written (paths + line counts), a vault note (its path), analysis produced, the message sent. Be concrete.' },
    outsideActionPerformed: { type: 'string', description: 'the EXACT outside action you performed (e.g. "sent a Slack DM to brandon@experoinc.com via the Expero slack skill") or "none" if the writ authorized none. The publisher must NOT repeat this.' },
    escalation: { enum: ['delivered', 'failed', 'n/a'], description: 'AMBIGUOUS writs: "delivered" if the Slack escalation reached the Patron, "failed" if it could not be sent (the publisher then LEAVES the writ in the fence so it is not lost). "n/a" for non-ambiguous writs.' },
    escalationDetail: { type: 'string', description: 'free-text: the why behind a "failed" escalation, or a note on what was sent.' },
    surfacesToReview: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'path'], properties: { label: { type: 'string' }, path: { type: 'string', description: 'a served REPO path the publisher should open' } } }, description: 'any REPO pages/files for the publisher to fresh-eyes review (empty if the work was a vault write / message / analysis with no repo surface).' },
    verification: { type: 'string', description: 'how you verified it (re-read the file written, the message API ok-response, a self-test for any code).' },
    openConcerns: { type: 'string' },
  },
}

// ── Prompt builders — thin pointers to seedbed/prompts/*.md + a JSON context ──
function directorPrompt(i) {
  return seatPrompt('director.md', 'DIRECTOR', { note: 'Run `node seedbed/gauge.mjs` yourself (step 1) to read mode / track / currentCycle.' })
}

function explorerPrompt(d, brief, feedback, cyc, round, protoPath) {
  return seatPrompt('explorer.md', 'EXPLORER "' + (brief.label || '?') + '"', {
    cyc, round: round || 0, mode: d.mode, track: d.track,
    label: brief.label, brief: brief.brief,
    title: d.title || null, where: d.where || null, basicDesign: d.basicDesign || null,
    exploreMode: d.exploreMode || null, protoPath: protoPath || null, feedback: feedback || null,
  })
}

function judgePrompt(d, explorers, feedback, cyc, round) {
  return seatPrompt('judge.md', 'JUDGE', {
    cyc, round: round || 0, mode: d.mode, track: d.track,
    title: d.title || null, definitionOfDone: d.definitionOfDone || null, exploreMode: d.exploreMode || null,
    feedback: feedback || null,
    explorers: explorers.map((e, n) => ({ n, label: e.label || ('#' + n), proposal: e.proposal, strengths: e.strengths, risks: e.risks, prototypePath: e.prototypePath || null, candidateSeeds: e.candidateSeeds || null })),
  })
}

function buildPrompt(d, chosen, cyc) {
  // The generic builder for every solo-builder BUILD track. It may build with PLACEHOLDER art and return
  // foundryArt to have the ART FOUNDRY forge custom in-house art (then a fresh builder wires it). (The
  // BUILD/foundry track does NOT use this — it runs the foundry PREP + engine; see the foundry branch.)
  const role = d.track === 'grounds' ? 'GROUNDS-WORKER — opening a big swing' : d.track === 'bug' ? 'BUG-FIXER' : 'PLANTER — growing the gardens'
  return seatPrompt('builder.md', 'BUILDER (' + role + ')', {
    cyc, track: d.track,
    finalDesign: chosen.finalDesign || d.basicDesign || null,
    startFromPrototype: chosen.startFromPrototype || null,
    definitionOfDone: d.definitionOfDone || null,
  })
}

// FOUNDRY PREP — the seat that runs BEFORE the ART FOUNDRY engine on a BUILD/foundry cycle: it
// deterministically scaffolds the rep wiring (gate-foundry/rep-spec.mjs) into the LIVE tree and composes
// the engine asset spec (art brief / judgeFocus / geometry) from the director's ripened foundrySpec.
function foundryPrepPrompt(d, cyc) {
  return seatPrompt('foundry-prep.md', 'FOUNDRY PREP — scaffold + spec a bespoke gate rep', {
    cyc, track: d.track,
    foundrySpec: d.foundrySpec || null,
    basicDesign: d.basicDesign || null, // the ripe seed line, as context / a fallback if foundrySpec is thin
  })
}

// Assemble the PUBLISHER's handoff from the foundry PREP + the engine's synth result. (This handoff is
// built by the SCRIPT, not returned by an agent, so it needs no schema — extra fields like `foundry` are
// fine; the publisher reviews the dirty tree the engine left + commits, as on any BUILD cycle.)
function foundryHandoff(prep, forge) {
  const r = forge && forge.results && forge.results[0]
  const final = (r && r.final) || null
  const a = prep.asset
  return {
    foundry: true,
    built: 'FOUNDRY forged "' + a.title + '" — rep ' + a.key + ' → ' + a.drawFn + ' in ' + a.module + '. '
      + (final && final.summary ? final.summary : ('engine status: ' + ((forge && forge.status) || 'no result'))),
    selfTest: final
      ? ('synth: forgeClean=' + final.forgeClean + ', interfacePreserved=' + final.interfacePreserved
        + '; final artifacts: ' + ((final.artifacts || []).join(', ') || 'none'))
      : '(no synth result — the publisher must render + verify the rep itself before committing)',
    surfacesToReview: [{ label: a.title + ' in situ', path: '/the-gate/the-gate.html?dev&' + a.extraQS }],
    openConcerns: [prep.openConcerns, (final && final.changesFromWinner ? 'synth grafts: ' + final.changesFromWinner : null)]
      .filter(Boolean).join(' · ') || null,
    scaffolded: prep.scaffolded || null,
  }
}

// BATON — a fresh builder continuing a too-big swing the previous builder handed off. It reads the
// generic builder brief plus the handoff context, so it picks up WITHOUT re-deriving everything. It may
// itself pass the baton again (bounded) UNLESS it is the TERMINAL pass (pass === MAX_BATON, the last
// builder the loop will ever spawn): the terminal builder is told it CANNOT hand off and MUST finish or
// reach a clean, publishable stop. (BUILD/foundry never reaches the baton — its engine handles the swing.)
function batonPrompt(d, chosen, prevHandoff, cyc, pass) {
  const isTerminal = pass >= MAX_BATON // the last allowed builder — no further baton can ever be spawned
  const passTag = 'baton pass ' + pass + '/' + MAX_BATON + (isTerminal ? ', TERMINAL' : '')
  const roleName = d.track === 'grounds' ? 'GROUNDS-WORKER (' + passTag + ')'
    : d.track === 'bug' ? 'BUG-FIXER (' + passTag + ')' : 'PLANTER (' + passTag + ')'
  const note = isTerminal
    ? 'You are a FRESH builder picking up a big swing a previous builder started and handed off, AND you are the TERMINAL builder — the LAST pass in this chain (pass ' + pass + ' of ' + MAX_BATON + '). NO MORE HAND-OFFS ARE POSSIBLE: even if you set requestBaton, the loop will IGNORE it and go straight to the publisher. So you MUST finish the work this turn, OR bring it to a clean, publishable stopping point — never leave it half-broken (no half-written files, no broken pages, no failing self-test). Their work is ALREADY in the tree — build ON it, do NOT restart. Do the nextSteps FIRST, then drive toward the definition of done; if you truly cannot finish everything, deliberately stop at the nearest coherent, working state and explain in openConcerns exactly what remains.'
    : 'You are a FRESH builder picking up a big swing a previous builder started and handed off. Their work is ALREADY in the tree — build ON it, do NOT restart. Do the nextSteps FIRST, then carry on toward the definition of done. If it is STILL too big to finish well this turn, you MAY pass the baton again (set requestBaton + batonReason + an updated batonHandoff); otherwise FINISH it and leave it for the publisher (requestBaton false). NOTE: this chain is bounded — pass ' + MAX_BATON + ' is the TERMINAL builder and cannot hand off, so do not assume an endless relay.'
  return seatPrompt('builder.md', 'BUILDER — ' + roleName, {
    cyc, track: d.track, batonPass: pass, maxBatonPass: MAX_BATON, isTerminalPass: isTerminal,
    finalDesign: chosen.finalDesign || d.basicDesign || null,
    definitionOfDone: d.definitionOfDone || null,
    baton: {
      note,
      reason: prevHandoff.batonReason || null, // WHY the previous builder handed off (context-exhausted / fresh-eyes-wanted / more-work-remains)
      done: prevHandoff.batonHandoff?.done || prevHandoff.built || null,
      remaining: prevHandoff.batonHandoff?.remaining || null,
      nextSteps: prevHandoff.batonHandoff?.nextSteps || null,
      files: prevHandoff.batonHandoff?.files || null,
    },
  })
}

// Run the bounded baton relay until a builder finishes (requestBaton false) or the cap is hit. Extracted
// so BOTH the initial build AND the post-art wiring builder get the same terminal-aware relay. `tag`
// distinguishes the wiring relay in labels/logs. Returns the settled handoff.
async function settleBaton(d, chosen, handoff, cyc, tag) {
  const tg = tag ? '.' + tag : ''
  let pass = 0
  while (handoff && handoff.requestBaton && pass < MAX_BATON) {
    pass++
    const isTerminal = pass >= MAX_BATON // this pass is the LAST builder the loop will ever spawn
    const why = handoff.batonReason ? ' (' + handoff.batonReason + ')' : ''
    log('cycle #' + cyc + ': 🪄 baton' + (tag ? ' [' + tag + ']' : '') + ' pass ' + pass + '/' + MAX_BATON + (isTerminal ? ' (TERMINAL — must finish)' : '') + why + ' — a fresh builder picks up the swing')
    handoff = await agent(batonPrompt(d, chosen, handoff, cyc, pass), { label: 'build #' + cyc + tg + '.baton' + pass, phase: 'Build', schema: BUILD_HANDOFF_SCHEMA })
    // The TERMINAL builder cannot hand off into the void: force-drop any baton it requests so the loop
    // exits to the publisher rather than depending on the terminal builder voluntarily not asking.
    if (isTerminal && handoff && handoff.requestBaton) {
      log('cycle #' + cyc + ': terminal builder (pass ' + pass + '/' + MAX_BATON + ') requested another baton — IGNORED; the publisher reviews the current state as-is')
      handoff.requestBaton = false
    }
  }
  return handoff
}

// WIRING builder (builder#2 in the exhibit-art flow): a FRESH builder that wires the just-forged in-house
// art into the placeholders the previous builder left, then finishes + self-tests. The foundry synth has
// ALREADY installed each winning asset at its live location; this builder must NOT re-forge art, and the
// art round is closed (it cannot request more). It MAY pass the baton if the wiring itself is large.
function wiringPrompt(d, chosen, prevHandoff, forges, cyc) {
  const fa = prevHandoff.foundryArt || {}
  const forgeList = (Array.isArray(forges) ? forges : [forges]).filter(Boolean)
  // Merge the per-medium forge results into one flat installed-asset list for the wiring builder.
  const built = forgeList.flatMap(forge => ((forge.results) || []).filter(Boolean).map(r => ({
    asset: r.asset,
    medium: forge.medium || null,
    installedArtifacts: (r.final && r.final.artifacts) || [],
    forgeClean: r.final ? r.final.forgeClean : null,
    summary: (r.final && r.final.summary) || ('(engine status: ' + (forge.status || '?') + ')'),
  })))
  return seatPrompt('builder.md', 'BUILDER — WIRING the forged in-house art into the system', {
    cyc, track: d.track, wiring: true,
    finalDesign: chosen.finalDesign || d.basicDesign || null,
    definitionOfDone: d.definitionOfDone || null,
    artForged: {
      media: forgeList.map(f => f.medium).filter(Boolean),
      built,
      note: 'The ART FOUNDRY just forged the in-house art a previous builder requested; each asset above is ALREADY INSTALLED in the tree at its live location by the foundry synth. YOUR JOB: wire the real art into the placeholders the previous builder left, REMOVE the placeholders, finish the system, and self-test in-browser on a SERVED origin. Do NOT re-forge or re-make the art. The art round is CLOSED — you cannot request more (any foundryArt you return is ignored). You MAY pass the baton if the WIRING itself is too big to finish well this turn.',
    },
    fromPriorBuilder: {
      built: prevHandoff.built || null,
      selfTest: prevHandoff.selfTest || null,
      placeholdersToWire: (fa.assets || []).map(a => ({ key: a.key, medium: a.medium || null, module: a.module || null, wireNote: a.wireNote || null, specFile: a.specFile || null })),
      openConcerns: prevHandoff.openConcerns || null,
    },
  })
}

function stewardPrompt(d, chosen, cyc) {
  return seatPrompt('steward.md', 'STEWARD of a Patron\'s WRIT', {
    cyc, writWork: d.writWork || 'mandate',
    finalDesign: chosen.finalDesign || d.basicDesign || null,
    definitionOfDone: d.definitionOfDone || null,
    writOutsideAction: d.writOutsideAction || '',
    directorNote: d.rationale || null,
  })
}

function publisherPrompt(d, chosen, handoff, cyc) {
  const p = seatPrompt('publisher.md', 'PUBLISHER (mode=' + d.mode + ' track=' + d.track + ')', {
    cyc, mode: d.mode, track: d.track,
    handoff: handoff || null,
    curatedSeeds: chosen.curatedSeeds || [],
    writReleasedSeeds: d.writReleasedSeeds || [],
    housekeeping: d.housekeeping || null,
    testMode: TEST_MODE || undefined,
  })
  if (!TEST_MODE) return p
  return p + '\n\n*** TEST CYCLE (testMode) — THIS IS A SMOKE TEST, NOT A REAL PUBLISH. Do your full fresh-eyes'
    + ' REVIEW and report what you find, BUT do NOT `git commit`, do NOT `git push`, and do NOT run'
    + ' `node seedbed/gauge.mjs record`. Leave ALL changes UNCOMMITTED in the working tree for inspection. In'
    + ' your summary, state plainly whether the piece WOULD have passed review and what (if anything) is broken. ***'
}

function writerPrompt(summary, isWrit) {
  const cd = FORCED_ROOT ? 'First run `cd ' + FORCED_ROOT + '`. ' : ''
  const body = (summary == null || String(summary).trim() === '') ? '(the publisher returned no summary)' : String(summary)
  return [
    cd + 'Read seedbed/prompts/writer.md IN FULL and follow it to append this cycle\'s summary to the funlog at',
    '/tmp/funlog.txt (you are a workflow subagent — do your own work this turn; APPEND ONLY, never overwrite).',
    'YOUR CONTEXT: ' + JSON.stringify({ isWrit: !!isWrit }),
    '',
    'The SUMMARY to append VERBATIM (between the markers — do not paraphrase):',
    '----- BEGIN SUMMARY (verbatim) -----', body, '----- END SUMMARY -----',
  ].join('\n')
}

// ── The loop ─────────────────────────────────────────────────────────────────
// Locate the repo root ONCE for the script-level workflow() engine call (the only absolute path the sandbox
// needs). A forced/test launch supplies it; otherwise ask a cheap agent (it runs in the launch cwd = repo root).
const DERIVED_ROOT = FORCED_ROOT || String(await agent(
  'Output ONLY the absolute path printed by `git rev-parse --show-toplevel` (the repo root) — nothing else, no prose.',
  { label: 'repo-root', phase: 'Direct', model: 'sonnet' })).trim()

let i = 0
while (i < MAX_ITERS) {
  i++

  phase('Direct')
  let d
  if (INDUCE) {
    // Operator/test override: skip the director + gauge and run this exact directive as ONE forced cycle.
    d = Object.assign({ currentCycle: 9000 + i, rationale: 'INDUCED cycle (operator / smoke-test override)', headline: 'INDUCED ' + INDUCE.mode + '/' + INDUCE.track }, INDUCE)
    log('cycle #' + d.currentCycle + ' — INDUCED ' + d.mode + '/' + d.track + (TEST_MODE ? ' [testMode: no commit]' : ''))
  } else {
    d = await agent(directorPrompt(i), { label: 'direct #' + i, phase: 'Direct', schema: DIRECTOR_SCHEMA })
    if (d == null) { log('cycle #' + i + ': director returned nothing — skipping'); continue }
  }
  const cyc = d.currentCycle || i // the DURABLE cycle # (survives relaunches); fall back to the loop index
  log('cycle #' + cyc + ' — ' + d.mode + '/' + d.track + ': ' + d.headline)
  const isFoundryBuild = d.mode === 'BUILD' && d.track === 'foundry' // forge a rep via the ART FOUNDRY engine, not a solo builder/explorers

  if (d.mode === 'TRIVIAL') {
    await agent(writerPrompt(d.rationale), { label: 'log #' + cyc, phase: 'Publish', model: 'sonnet' })
    log('cycle #' + cyc + ' (trivial) appended to ' + FUNLOG)
    continue
  }

  // ── Writ safety nets — a writ must NEVER be silently consumed doing nothing ──
  // Code-level backstops against an under-triaged director decision: an un-triaged
  // writ, or a 'release' with no seeds, or a 'release' that contradicts itself by
  // carrying an authorized outside action, are all routed to the steward as an
  // escalation (ambiguous) rather than being consumed as a no-op. A genuine
  // release-AND-mandate writ is the director's to mark 'mixed' explicitly.
  if (d.mode === 'WRIT') {
    if (!d.writWork) d.writWork = 'ambiguous' // never a silent mandate over empty design
    if (d.writWork === 'release') {
      const hasSeeds = (d.writReleasedSeeds || []).length > 0
      const hasAction = !!(d.writOutsideAction && String(d.writOutsideAction).trim())
      if (!hasSeeds || hasAction) d.writWork = 'ambiguous' // nothing to release, or a release can't carry an action → escalate
    }
  }

  // ── Explore → Judge (skipped for BUILD/WRIT exploreMode 'none', and for a pure-release writ) ──
  let chosen = null
  const briefs = (d.briefs || []).slice(0, d.K || (d.briefs || []).length || 2)
  const writRelease = d.mode === 'WRIT' && d.writWork === 'release'
  if (writRelease) {
    chosen = { finalDesign: '' } // pure release: nothing to build; the publisher just releases the seeds (mandate/mixed/ambiguous run the steward)
  } else if (isFoundryBuild) {
    chosen = { finalDesign: '' } // foundry builds from d.foundrySpec via the engine's K parallel takes — NO fun-forever explorers/judge (the engine IS the divergence, judged on rendered art)
  } else if ((d.mode === 'BUILD' || d.mode === 'WRIT') && d.exploreMode === 'none') {
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

  // ── Build (BUILD: the builder; WRIT w/ operational work: the steward) — neither commits → Publish ──
  let handoff = null
  if (isFoundryBuild) {
    // ── FOUNDRY/build: forge a bespoke gate rep via the ART FOUNDRY engine ──────────────────────────
    // No explore/judge/baton. fun-forever (top level) is the SOLE workflow() caller — it invokes the
    // engine ONE level deep (a child can't nest). Flow: PREP (scaffold + spec) → engine (K takes →
    // judges → synth, into the live tree, left DIRTY) → Publish (reviews + commits).
    phase('Build')
    const prep = await agent(foundryPrepPrompt(d, cyc), { label: 'foundry-prep #' + cyc, phase: 'Build', schema: FOUNDRY_PREP_SCHEMA })
    if (!prep || !prep.asset) {
      log('cycle #' + cyc + ': foundry PREP returned no asset spec — nothing to forge; the publisher reviews the tree as-is')
    } else {
      log('cycle #' + cyc + ': PREP scaffolded ' + prep.asset.key + ' (' + prep.asset.drawFn + ', K=' + (prep.asset.K || 3) + ') — handing to the ART FOUNDRY engine')
      const forge = await workflow({ scriptPath: DERIVED_ROOT + '/art-foundry/engine.workflow.js' },
        { medium: 'visual-gate', contextRoot: DERIVED_ROOT, assets: [prep.asset] })
      log('cycle #' + cyc + ': art-foundry → ' + ((forge && forge.status) || '?') + ' (built ' + (((forge && forge.built) || []).join(', ') || 'nothing') + ')')
      handoff = foundryHandoff(prep, forge)
    }
  } else if (d.mode === 'BUILD') {
    phase('Build')
    handoff = await agent(buildPrompt(d, chosen, cyc), { label: 'build #' + cyc, phase: 'Build', schema: BUILD_HANDOFF_SCHEMA })
    // BATON — a builder facing a too-big swing hands off to a FRESH builder; settleBaton runs fresh
    // builders (each with the prior handoff) until one finishes or the cap is hit. Makers stop shying
    // from big swings: take the swing, hand off the tail.
    handoff = await settleBaton(d, chosen, handoff, cyc)
    // ── ART FOUNDRY (Adjustment 6 — the exhibit-art flow): if the settled builder built the system with
    //    PLACEHOLDER art and asked the foundry to forge real assets, fun-forever (the SOLE workflow()
    //    caller) invokes the engine ONE level over the batch, then a FRESH builder wires the now-real art
    //    in + finishes. One art round per build; the wiring builder cannot request more art.
    if (handoff && handoff.foundryArt && Array.isArray(handoff.foundryArt.assets) && handoff.foundryArt.assets.length) {
      const fa = handoff.foundryArt
      // Group the (possibly mixed-media) batch by medium — the engine builds a single-medium batch per call.
      // fun-forever is the SOLE workflow() caller, so it invokes the engine once per medium group, in turn.
      const byMedium = {}
      for (const a of fa.assets) { const m = a.medium || 'visual-exhibit'; (byMedium[m] = byMedium[m] || []).push(a) }
      const media = Object.keys(byMedium)
      log('cycle #' + cyc + ': 🎨 builder requested ' + fa.assets.length + ' in-house art asset(s) across ' + media.length + ' medium(s) [' + media.join(', ') + '] — invoking the ART FOUNDRY engine')
      const forges = []
      for (const m of media) {
        const forge = await workflow({ scriptPath: DERIVED_ROOT + '/art-foundry/engine.workflow.js' },
          { medium: m, contextRoot: DERIVED_ROOT, assets: byMedium[m] })
        log('cycle #' + cyc + ': art-foundry [' + m + '] → ' + ((forge && forge.status) || '?') + ' (built ' + (((forge && forge.built) || []).join(', ') || 'nothing') + ')')
        forges.push(forge)
      }
      handoff = await agent(wiringPrompt(d, chosen, handoff, forges, cyc), { label: 'build #' + cyc + '.wire', phase: 'Build', schema: BUILD_HANDOFF_SCHEMA })
      if (handoff) handoff.foundryArt = null // the art round is closed — ignore any further art request from the wiring builder
      handoff = await settleBaton(d, chosen, handoff, cyc, 'wire')
    }
  } else if (d.mode === 'WRIT' && !writRelease) {
    phase('Build') // mandate | mixed → do the work; ambiguous → the steward sends the escalation notify
    handoff = await agent(stewardPrompt(d, chosen, cyc), { label: 'steward #' + cyc, phase: 'Build', schema: STEWARD_HANDOFF_SCHEMA })
  }

  phase('Publish')
  const summary = await agent(publisherPrompt(d, chosen, handoff, cyc), { label: 'publish #' + cyc, phase: 'Publish' })

  // A lightweight writer appends the cycle summary to the funlog (the script sandbox has no filesystem).
  // It reads the durable cycle from state.json itself — never the director's relayed number.
  await agent(writerPrompt(summary, d.mode === 'WRIT'), { label: 'log #' + cyc, phase: 'Publish', model: 'sonnet' })
  log('cycle #' + cyc + ' appended to ' + FUNLOG)
}

log('Reached the ' + MAX_ITERS + '-cycle safety cap (the 1000-agent workflow backstop). Re-launch fun-forever to keep going.')
return { cycles: i, logFile: FUNLOG }
