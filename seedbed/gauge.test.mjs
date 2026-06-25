#!/usr/bin/env node
// ── Node twin for the mode gauge — proves the ladder + decay + cadence exact ───
// Run: node seedbed/gauge.test.mjs   (exit 0 = all green). Pure logic, never
// touches the real ROADMAP/state — synthetic fixtures only.

import { classify, parseBed, decide, decayed, applyRecord, TH } from './gauge.mjs'

let pass = 0, fail = 0
const ok = (cond, msg) => { if (cond) { pass++ } else { fail++; console.error('  ✗ ' + msg) } }
const eq = (a, b, msg) => ok(a === b, `${msg} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`)

// helper: build a roadmap string with N garden + M grounds + S sparks + B bugs
function bedDoc({ writs = [], garden = [], grounds = [], foundry = [], sparks = [], bugs = [] } = {}) {
  const sec = (name, lines) => `<!-- gauge:${name}:start -->\n${lines.join('\n')}\n<!-- gauge:${name}:end -->`
  return [
    sec('writ', writs),
    sec('bug', bugs),
    sec('garden-seeds', garden),
    sec('grounds-seeds', grounds),
    sec('foundry-seeds', foundry),
    sec('sparks', sparks),
  ].join('\n\n')
}
const G = (pitch, sown) => `- [exhibit] **${pitch}** — a gap. (sown #${sown})`
const GR = (pitch, sown, contest) => `- [room] **${pitch}** — a wing. (sown #${sown} · contest #${contest})`
const F = (pitch, sown, contest) => `- [rep] **${pitch}** — a bespoke rep. (sown #${sown} · contest #${contest})`
const FG = (pitch, sown, contest) => `- [gate] **${pitch}** — a gate re-soul. (sown #${sown} · contest #${contest})` // a [gate] foundry seed (re-soul; NO pressure)
const SP = (t) => `- ${t}`
const W = (pitch) => `- [writ] **${pitch}** — a request from the Patron.`
const st = (o = {}) => ({ cycle: 30, lastGardenPlan: 28, lastBigSwing: 28, bigSwingsBuilt: 2, tally: {}, ...o })

console.log('classify:')
eq(classify('exhibit'), 'garden', 'exhibit→garden')
eq(classify('cross'), 'garden', 'cross→garden')
eq(classify('curation'), 'garden', 'curation→garden')
eq(classify('rework'), 'garden', 'rework→garden (re-soul an existing exhibit = small track)')
eq(classify('REWORK'), 'garden', 'rework is case-insensitive')
eq(classify('room · GRAND · OPEN & GROWING'), 'grounds', 'compound room→grounds')
eq(classify('engine/curation'), 'grounds', 'engine/…→grounds (first token wins)')
eq(classify('metagame · GRAND'), 'grounds', 'metagame→grounds')
eq(classify('map'), 'grounds', 'map→grounds')
eq(classify('bug'), 'bug', 'bug→bug')
eq(classify('rep'), 'foundry', 'rep→foundry (a bespoke front-gate room-rep)')
eq(classify('gate'), 'foundry', 'gate→foundry (a gate asset rework/polish)')
eq(classify('REP'), 'foundry', 'rep is case-insensitive')
eq(classify('quasicrystal'), 'grounds', 'novel kind→grounds (big by default)')

console.log('parseBed (live vs struck vs tombstone):')
{
  const doc = bedDoc({
    garden: [
      G('Live A', 27),
      '- ~~[exhibit] **Struck B**~~ — bloomed. (sown #20)',
      '*Tombstone (BLOOMED): ~~old thing~~ — gone.*',
      G('Live C', 19),
    ],
    grounds: [GR('Big One', 25, 0)],
    sparks: [SP('flight & rocketry'), SP('a new medium'), '- ~~struck spark~~'],
    bugs: ['- [bug] **Something broke** — fix it. (sown #29)'],
  })
  const bed = parseBed(doc)
  eq(bed.gardenFuel, 2, 'gardenFuel counts only live (struck + tombstone excluded)')
  eq(bed.groundsFuel, 1, 'groundsFuel=1')
  eq(bed.sparks, 2, 'sparks counts live only')
  eq(bed.bugs, 1, 'bugs=1')
  eq(bed.gardenSeeds[0].sown, 27, 'stamp parsed')
  eq(bed.groundsSeeds[0].contest, 0, 'contest stamp parsed')
}

console.log('decay (lazy birth-stamp):')
{
  const bsb = 5 // current contest counter
  const bed = parseBed(bedDoc({
    garden: [G('fresh', 25), G('stale', 30 - TH.gardenDecayAge)], // age 0 and exactly threshold
    grounds: [GR('contender', 24, bsb - 1), GR('loser', 24, bsb - TH.groundsDecayStrikes)], // 1 strike vs exactly threshold
  }))
  const state = st({ cycle: 30, bigSwingsBuilt: bsb })
  const d = decayed(bed, state)
  ok(d.some(x => x.pitch.includes('stale')), 'garden seed at age≥threshold decays')
  ok(!d.some(x => x.pitch.includes('fresh')), 'fresh garden seed does not decay')
  ok(d.some(x => x.pitch.includes('loser')), 'grounds seed at strikes≥threshold decays')
  ok(!d.some(x => x.pitch.includes('contender')), 'contender grounds seed survives')
}

console.log('decision ladder — each branch:')
{
  // 1. bug jumps the queue even when everything else is healthy
  let bed = parseBed(bedDoc({ garden: [G('a', 30), G('b', 30), G('c', 30), G('d', 30), G('e', 30)], grounds: [GR('w', 30, 2)], bugs: ['- [bug] **x** — fix. (sown #30)'] }))
  let d = decide(st(), bed)
  eq(d.mode + '/' + d.track, 'BUILD/bug', 'bug → BUILD/bug')

  // 2. swing time + ripe grounds seed → grounds build
  bed = parseBed(bedDoc({ garden: [G('a', 30), G('b', 30), G('c', 30), G('d', 30), G('e', 30)], grounds: [GR('w', 30, 2), GR('w2', 30, 2)] }))
  d = decide(st({ cycle: 40, lastBigSwing: 28, lastGardenPlan: 38 }), bed) // groundsSince=12≥9
  eq(d.mode + '/' + d.track, 'BUILD/grounds', 'swing time + ripe → BUILD/grounds')

  // 2b. swing time but NO ripe grounds seed → degrade to groundskeeper (raise ambition, never lower bar)
  bed = parseBed(bedDoc({ garden: [G('a', 30), G('b', 30), G('c', 30), G('d', 30), G('e', 30)], grounds: [] }))
  d = decide(st({ cycle: 40, lastBigSwing: 28, lastGardenPlan: 38 }), bed)
  eq(d.mode + '/' + d.track, 'PLAN/grounds', 'swing time but bed empty → PLAN/grounds (never fake a wing)')

  // 3. grounds fuel below floor (not yet swing time) → groundskeeper
  bed = parseBed(bedDoc({ garden: [G('a', 30), G('b', 30), G('c', 30), G('d', 30), G('e', 30)], grounds: [GR('w', 30, 2)] })) // groundsFuel=1<2
  d = decide(st({ cycle: 30, lastBigSwing: 28, lastGardenPlan: 28 }), bed) // groundsSince=2<9
  eq(d.mode + '/' + d.track, 'PLAN/grounds', 'grounds fuel < floor → PLAN/grounds')

  // 4a. garden fuel dry → gardener
  bed = parseBed(bedDoc({ garden: [G('a', 30), G('b', 30), G('c', 30), G('d', 30)], grounds: [GR('w', 30, 2), GR('w2', 30, 2)] })) // gardenFuel=4≤4
  d = decide(st({ cycle: 30, lastBigSwing: 28, lastGardenPlan: 28 }), bed)
  eq(d.mode + '/' + d.track, 'PLAN/garden', 'garden fuel ≤ floor → PLAN/garden')

  // 4b. garden interval reached → gardener (even with healthy fuel)
  bed = parseBed(bedDoc({ garden: [G('a', 30), G('b', 30), G('c', 30), G('d', 30), G('e', 30), G('f', 30), G('g', 30), G('h', 30)], grounds: [GR('w', 30, 2), GR('w2', 30, 2)] }))
  d = decide(st({ cycle: 30, lastBigSwing: 29, lastGardenPlan: 24 }), bed) // gardenBuilds=6≥6
  eq(d.mode + '/' + d.track, 'PLAN/garden', 'garden interval reached → PLAN/garden')

  // 5. healthy → planter builds a garden seed
  bed = parseBed(bedDoc({ garden: [G('a', 30), G('b', 30), G('c', 30), G('d', 30), G('e', 30), G('f', 30)], grounds: [GR('w', 30, 2), GR('w2', 30, 2)] }))
  d = decide(st({ cycle: 30, lastBigSwing: 29, lastGardenPlan: 28 }), bed) // gardenBuilds=2, fuel=6
  eq(d.mode + '/' + d.track, 'BUILD/garden', 'healthy → BUILD/garden (planter)')
}

console.log("Patron's Writ — top priority + cadence-neutral:")
{
  // a writ outranks even a bug AND a due swing
  let bed = parseBed(bedDoc({
    writs: [W('summarize X and Slack it to me')],
    bugs: ['- [bug] **broken** — fix. (sown #40)'],
    garden: [G('a', 30)], grounds: [GR('w', 30, 2), GR('w2', 30, 2)],
  }))
  let d = decide(st({ cycle: 40, lastBigSwing: 28, lastGardenPlan: 38 }), bed) // a swing is also due
  eq(d.mode + '/' + d.track, 'WRIT/writ', 'a writ outranks a bug AND a due swing')
  eq(d.role, 'director', "a writ is the director's to triage")
  eq(d.decayed.length, 0, 'a writ directive carries an EMPTY decay list (it prunes nothing)')
  eq(d.gauges.writs, 1, 'gauges report the writ count')

  // no writ → the ladder behaves exactly as before (bug regains the top)
  bed = parseBed(bedDoc({ writs: [], bugs: ['- [bug] **broken** — fix. (sown #40)'], garden: [G('a', 30)], grounds: [GR('w', 30, 2)] }))
  eq(decide(st(), bed).track, 'bug', 'no writ → bug regains the top of the ladder')

  // cadence-neutral record: NO clock advances; existing seeds cannot age/decay
  const base = st({ cycle: 50, lastGardenPlan: 44, lastBigSwing: 41, bigSwingsBuilt: 3, tally: {},
    fence: { garden: ['A', 'B'], grounds: ['W'] } })

  // a writ that RELEASES one creative clause as a normal seed, touching nothing else
  let r = applyRecord(base, { mode: 'WRIT', track: 'writ' }, { garden: ['A', 'B', 'NewSeed'], grounds: ['W'] })
  eq(r.cycle, 50, 'WRIT holds the cycle clock (no decay tick)')
  eq(r.lastGardenPlan, 44, 'WRIT does not reset the garden-plan clock')
  eq(r.lastBigSwing, 41, 'WRIT does not touch the swing clock')
  eq(r.bigSwingsBuilt, 3, 'WRIT does not count as a swing')
  eq(r.tally.gardenSown, 1, 'a released creative clause is credited as sown (honest fuel)')
  eq(r.tally.gardenBloomed || 0, 0, 'WRIT blooms nothing')
  eq(r.tally.gardenDecayed || 0, 0, 'WRIT decays nothing')
  eq(r.fence.garden.join(','), 'A,B,NewSeed', 'WRIT re-baselines the bed snapshot')

  // a purely operational writ (no bed change) is a clean cadence no-op
  r = applyRecord(base, { mode: 'WRIT', track: 'writ' }, { garden: ['A', 'B'], grounds: ['W'] })
  eq(r.cycle, 50, 'operational writ: cycle held')
  eq((r.tally.gardenSown || 0) + (r.tally.gardenDecayed || 0), 0, 'operational writ books nothing in the tally')

  // a title that VANISHES during a writ is NOT booked as decayed (a writ never prunes)
  r = applyRecord(base, { mode: 'WRIT', track: 'writ' }, { garden: ['A'], grounds: ['W'] })
  eq(r.tally.gardenDecayed || 0, 0, 'a writ never books a decay even if a title vanished')

  // WRIT normalizes case + plural like the other tracks
  eq(applyRecord(base, { mode: 'writ', track: 'writs' }, { garden: ['A', 'B'], grounds: ['W'] }).cycle, 50, "lowercase 'writ' + plural 'writs' normalize")
  // and classify knows it
  eq(classify('writ'), 'writ', 'classify(writ) → writ')

  // back-to-back writs: every clock still holds across consecutive writs
  let chained = applyRecord(base, { mode: 'WRIT', track: 'writ' }, { garden: ['A', 'B'], grounds: ['W'] })
  chained = applyRecord(chained, { mode: 'WRIT', track: 'writ' }, { garden: ['A', 'B'], grounds: ['W'] })
  ok(chained.cycle === 50 && chained.lastGardenPlan === 44 && chained.lastBigSwing === 41 && chained.bigSwingsBuilt === 3, 'back-to-back writs hold every clock')

  // a writ with NO currentBed (a simple errand whose steward never touched the bed) is a clean no-op
  const noBed = applyRecord(base, { mode: 'WRIT', track: 'writ' })
  ok(noBed.cycle === 50 && JSON.stringify(noBed.fence) === JSON.stringify(base.fence), 'writ with no currentBed: clean no-op, fence preserved')

  // a writ holds the GROUNDS decay posture too — even with a grounds seed AT the strike threshold
  const gbase = st({ cycle: 50, bigSwingsBuilt: 8, lastBigSwing: 41, lastGardenPlan: 44, tally: {}, fence: { garden: [], grounds: ['old wing'] } })
  const gbed = parseBed(bedDoc({ writs: [W('do a thing')], grounds: [GR('old wing', 20, 8 - TH.groundsDecayStrikes)] }))
  eq(decide(gbase, gbed).decayed.length, 0, 'a writ directive lists no decayed grounds seed even at the strike threshold')
  eq(applyRecord(gbase, { mode: 'WRIT', track: 'writ' }, { garden: [], grounds: ['old wing'] }).bigSwingsBuilt, 8, 'a writ holds bigSwingsBuilt (the grounds decay clock is frozen)')
}

console.log('record — state transitions:')
{
  const base = st({ cycle: 30, lastGardenPlan: 28, lastBigSwing: 21, bigSwingsBuilt: 2, tally: {} })
  let s = applyRecord(base, { mode: 'BUILD', track: 'garden', bloomed: 1 })
  eq(s.cycle, 31, 'garden build bumps cycle')
  eq(s.lastGardenPlan, 28, 'garden build does NOT reset lastGardenPlan')
  eq(s.lastBigSwing, 21, 'garden build does NOT touch lastBigSwing')
  eq(s.tally.gardenBloomed, 1, 'garden bloom tallied')

  s = applyRecord(base, { mode: 'PLAN', track: 'garden', sown: 4 })
  eq(s.lastGardenPlan, 31, 'garden PLAN resets lastGardenPlan to new cycle')
  eq(s.tally.gardenSown, 4, 'garden sown tallied')

  s = applyRecord(base, { mode: 'BUILD', track: 'grounds', bloomed: 1 })
  eq(s.lastBigSwing, 31, 'grounds build sets lastBigSwing')
  eq(s.bigSwingsBuilt, 3, 'grounds build increments the contest counter')
  eq(s.tally.groundsBloomed, 1, 'grounds bloom tallied')

  s = applyRecord(base, { mode: 'BUILD', track: 'bug' })
  eq(s.cycle, 31, 'bug-fix bumps cycle')
  eq(s.lastGardenPlan, 28, 'bug-fix is out-of-band (no plan reset)')
  eq(s.bigSwingsBuilt, 2, 'bug-fix does not count as a swing')

  // hard validation — the sole state-mutation surface rejects typos
  const threw = (fn) => { try { fn(); return false } catch { return true } }
  ok(threw(() => applyRecord(base, { mode: 'BIULD', track: 'garden' })), 'unknown mode throws')
  ok(threw(() => applyRecord(base, { mode: 'BUILD', track: 'gardenz' })), 'unknown track throws')
  // plurals/case tolerated (the prose says "gardens"/"grounds"/"PLAN")
  eq(applyRecord(base, { mode: 'plan', track: 'gardens' }).lastGardenPlan, 31, "plural 'gardens' + lowercase 'plan' normalize → garden plan resets")
  eq(applyRecord(base, { mode: 'Build', track: 'grounds' }).bigSwingsBuilt, 3, "case-insensitive 'Build'/'grounds' → swing counted")
  // non-numeric counts coerce to 0 (a forgotten placeholder must not poison the tally)
  eq(applyRecord(base, { mode: 'PLAN', track: 'garden', sown: '<#seeds>' }).tally.gardenSown, 0, 'non-numeric count → 0 (no NaN in state)')
}

console.log('record idempotency — --cycle N guards an accidental double-record:')
{
  // record is the SOLE state-mutation surface but is NOT otherwise idempotent: applyRecord
  // unconditionally runs cycle = cycle + 1 and bumps every per-track counter, so running it
  // twice in one turn advances the durable clock + counters TWICE. The --cycle N idempotency
  // key (N = gauges.currentCycle) makes a re-record of an already-recorded cycle a NO-OP.
  const base = st({ cycle: 30, lastGardenPlan: 28, lastBigSwing: 21, bigSwingsBuilt: 2,
    lastFoundry: 20, foundryBuilt: 4, tally: {} })
  // gauges.currentCycle = state.cycle + 1, so the cycle ABOUT to be recorded here is N = 31.
  const N = base.cycle + 1

  // ── GROUNDS: the first record of cycle N advances the clock + every grounds counter exactly once.
  const first = applyRecord(base, { mode: 'BUILD', track: 'grounds', cycle: N })
  ok(!first.noop, 'first record of cycle N is NOT a no-op (it actually records)')
  eq(first.cycle, 31, 'first record advances the durable cycle once (30 → 31)')
  eq(first.lastBigSwing, 31, 'first record sets lastBigSwing to the new cycle')
  eq(first.bigSwingsBuilt, 3, 'first record bumps bigSwingsBuilt exactly once (2 → 3)')

  // ── the SECOND record of the SAME cycle N (state.cycle now 31 ≥ N=31) is an observable NO-OP:
  //    nothing advances, nothing bumps, the input state is returned byte-identical.
  const before = JSON.stringify(first)
  const second = applyRecord(first, { mode: 'BUILD', track: 'grounds', cycle: N })
  ok(second.noop === true, 'the second record of cycle N signals noop:true')
  ok(second.state === first, 'the no-op returns the EXACT input state object (unchanged)')
  eq(second.state.cycle, 31, 'the no-op does NOT advance the cycle (held at 31, not 32)')
  eq(second.state.bigSwingsBuilt, 3, 'the no-op does NOT bump bigSwingsBuilt (held at 3, not 4)')
  eq(second.state.lastBigSwing, 31, 'the no-op leaves lastBigSwing untouched')
  eq(JSON.stringify(second.state), before, 'the no-op leaves state byte-identical')

  // ── EVERY per-track counter is guarded — prove garden + foundry counters also bump exactly once,
  //    then NO-OP on the re-run. (lastGardenPlan / lastFoundry / foundryBuilt are the other clocks.)
  const gFirst = applyRecord(base, { mode: 'PLAN', track: 'garden', cycle: N })
  eq(gFirst.lastGardenPlan, 31, 'garden PLAN: first record resets lastGardenPlan to N once')
  const gSecond = applyRecord(gFirst, { mode: 'PLAN', track: 'garden', cycle: N })
  ok(gSecond.noop && gSecond.state.lastGardenPlan === 31, 'garden PLAN: re-record NO-OPs (lastGardenPlan held at 31)')

  const fFirst = applyRecord(base, { mode: 'BUILD', track: 'foundry', cycle: N })
  eq(fFirst.lastFoundry, 31, 'foundry BUILD: first record resets lastFoundry to N once')
  eq(fFirst.foundryBuilt, 5, 'foundry BUILD: first record bumps foundryBuilt exactly once (4 → 5)')
  const fSecond = applyRecord(fFirst, { mode: 'BUILD', track: 'foundry', cycle: N })
  ok(fSecond.noop && fSecond.state.lastFoundry === 31 && fSecond.state.foundryBuilt === 5,
    'foundry BUILD: re-record NO-OPs (lastFoundry + foundryBuilt both held)')

  // ── TWO LEGIT CONSECUTIVE cycles still advance — the guard only catches a re-run of the SAME N.
  //    After recording N, recording N+1 (the next cycle's currentCycle) advances normally.
  const next = applyRecord(first, { mode: 'BUILD', track: 'grounds', cycle: N + 1 })
  ok(!next.noop, 'recording the NEXT cycle (N+1) is not a no-op')
  eq(next.cycle, 32, 'two legit consecutive cycles advance the clock twice (31 → 32)')
  eq(next.bigSwingsBuilt, 4, 'two legit consecutive grounds builds bump the counter twice (3 → 4)')

  // ── BACKWARD-COMPAT CONTROL: with --cycle OMITTED, behavior is EXACTLY as before — a double-record
  //    DOUBLE-advances (this is the bug the key guards against; the old call path is unchanged).
  const noKey1 = applyRecord(base, { mode: 'BUILD', track: 'grounds' }) // no cycle
  ok(!noKey1.noop, 'no --cycle → never returns a noop sentinel (today exact behavior)')
  eq(noKey1.cycle, 31, 'no --cycle: first record advances once')
  const noKey2 = applyRecord(noKey1, { mode: 'BUILD', track: 'grounds' }) // no cycle again
  eq(noKey2.cycle, 32, 'no --cycle: a second record DOUBLE-advances the cycle (32) — backward-compatible')
  eq(noKey2.bigSwingsBuilt, 4, 'no --cycle: a second record DOUBLE-bumps the counter (4) — the guarded-against bug')

  // ── the guard is SCOPED OUT of WRIT (cadence-neutral already): passing --cycle to a WRIT is harmless
  //    and never NO-OPs the WRIT path (a writ advances no clock, so there is nothing to guard).
  const wbase = st({ cycle: 50, lastGardenPlan: 44, lastBigSwing: 41, bigSwingsBuilt: 3, tally: {},
    fence: { garden: ['A'], grounds: ['W'], foundry: [] } })
  const w = applyRecord(wbase, { mode: 'WRIT', track: 'writ', cycle: 51 }, { garden: ['A', 'NewSeed'], grounds: ['W'], foundry: [] })
  ok(!w.noop, 'a WRIT with --cycle never returns a noop sentinel (the guard is scoped out of WRIT)')
  eq(w.cycle, 50, 'a WRIT with --cycle still holds the cycle clock (cadence-neutral)')
  eq(w.tally.gardenSown, 1, 'a WRIT with --cycle still credits a released clause as sown')
}

console.log('derived tally — record diffs the bed (the agent can NOT mis-count):')
{
  const base = st({ cycle: 40, lastGardenPlan: 38, lastBigSwing: 30, bigSwingsBuilt: 2, tally: {},
    fence: { garden: ['A', 'B', 'C', 'D'], grounds: ['W', 'V'] } })

  // PLAN/garden: removed C,D + added E → 1 sown, 2 decayed, 0 bloomed (no build)
  let r = applyRecord(base, { mode: 'PLAN', track: 'garden' }, { garden: ['A', 'B', 'E'], grounds: ['W', 'V'] })
  eq(r.tally.gardenSown, 1, 'PLAN derives sown from the added title')
  eq(r.tally.gardenDecayed, 2, 'PLAN derives decayed from removed titles (no bloom)')
  eq(r.tally.gardenBloomed, 0, 'PLAN blooms nothing')
  eq(r.fence.garden.join(','), 'A,B,E', 'fence snapshot updated')

  // BUILD/garden: removed C (the built seed bloomed) → 1 bloomed, 0 decayed
  r = applyRecord(base, { mode: 'BUILD', track: 'garden' }, { garden: ['A', 'B', 'D'], grounds: ['W', 'V'] })
  eq(r.tally.gardenBloomed, 1, 'BUILD in-fence blooms exactly the one built')
  eq(r.tally.gardenDecayed, 0, 'BUILD with one removal decays nothing')

  // BUILD/grounds that also sows garden planters: grounds W bloomed, garden +2 sown
  r = applyRecord(base, { mode: 'BUILD', track: 'grounds' }, { garden: ['A', 'B', 'C', 'D', 'P1', 'P2'], grounds: ['V'] })
  eq(r.tally.groundsBloomed, 1, 'grounds build blooms the opened wing')
  eq(r.tally.gardenSown, 2, 'a grounds build can sow garden planters (both fences diffed)')
  eq(r.tally.gardenBloomed, 0, 'no garden bloom on a grounds build')

  // compress in place (title unchanged) → counts as nothing
  r = applyRecord(base, { mode: 'PLAN', track: 'garden' }, { garden: ['A', 'B', 'C', 'D'], grounds: ['W', 'V'] })
  eq(r.tally.gardenSown + r.tally.gardenDecayed + r.tally.gardenBloomed, 0, 'editing a seed in place counts as nothing')

  // the cycle-32 reality: 8 pruned, 3 sown on a PLAN — derived correctly regardless of any agent report
  const big = st({ cycle: 32, tally: {}, fence: { garden: ['a','b','c','d','e','f','g','h','i','j','k'], grounds: [] } })
  r = applyRecord(big, { mode: 'PLAN', track: 'garden' }, { garden: ['a','b','c','x','y','z'], grounds: [] })
  eq(r.tally.gardenDecayed, 8, 'cycle-32 case: 8 decayed derived (agent had claimed 3)')
  eq(r.tally.gardenSown, 3, 'cycle-32 case: 3 sown derived (agent had claimed 1)')
}

console.log('cadence simulation — 24 cycles, builds dominate, swings periodic:')
{
  // A planter pulls 1 garden seed/build; the gardener refills to ceiling; a
  // grounds seed is always ripe. Prove: builds ≫ plans, a swing lands ~every 9.
  let state = st({ cycle: 27, lastGardenPlan: 24, lastBigSwing: 21, bigSwingsBuilt: 0, tally: {} })
  let gardenFuel = 8, groundsFuel = 3
  const counts = { 'BUILD/garden': 0, 'PLAN/garden': 0, 'BUILD/grounds': 0, 'PLAN/grounds': 0 }
  for (let n = 0; n < 24; n++) {
    const bed = { gardenFuel, groundsFuel, sparks: 5, bugs: 0, gardenSeeds: [], groundsSeeds: [] }
    const d = decide(state, bed)
    counts[d.mode + '/' + d.track]++
    if (d.mode === 'BUILD' && d.track === 'garden') gardenFuel = Math.max(0, gardenFuel - 1)
    if (d.mode === 'PLAN' && d.track === 'garden') gardenFuel = TH.gardenFuelCeiling
    if (d.mode === 'BUILD' && d.track === 'grounds') groundsFuel = Math.max(0, groundsFuel - 1)
    if (d.mode === 'PLAN' && d.track === 'grounds') groundsFuel = TH.groundsFuelCeiling
    state = applyRecord(state, { mode: d.mode, track: d.track })
  }
  const builds = counts['BUILD/garden'] + counts['BUILD/grounds']
  const plans = counts['PLAN/garden'] + counts['PLAN/grounds']
  console.log('   ' + JSON.stringify(counts))
  ok(builds > plans * 1.5, `builds (${builds}) dominate plans (${plans})`)
  ok(counts['BUILD/grounds'] >= 2, `at least 2 big swings in 24 cycles (got ${counts['BUILD/grounds']})`)
  ok(counts['BUILD/garden'] >= 10, `garden builds are the staple (got ${counts['BUILD/garden']})`)
}

console.log('FOUNDRY track — the patient sub-project upkeep lane:')
{
  // parse: the foundry-seeds fence is counted as foundryFuel; its seeds carry a contest stamp
  let bed = parseBed(bedDoc({ foundry: [F('Cavern rep', 30, 0), F('Pond rep', 30, 0)] }))
  eq(bed.foundryFuel, 2, 'foundryFuel counts live foundry seeds')
  eq(bed.foundrySeeds[0].contest, 0, 'foundry seed contest stamp parsed')

  // decay: a foundry seed decays against foundryBuilt (its OWN contest clock), never bigSwingsBuilt
  const fb = 6
  bed = parseBed(bedDoc({ foundry: [F('contender', 24, fb - 1), F('loser', 24, fb - TH.foundryDecayStrikes)] }))
  let d = decayed(bed, st({ cycle: 40, foundryBuilt: fb }))
  ok(d.some(x => x.pitch.includes('loser') && x.track === 'foundry'), 'foundry seed at strikes≥threshold decays')
  ok(!d.some(x => x.pitch.includes('contender')), 'contender foundry seed survives')
  // ISOLATION: a flood of GROUNDS swings (bigSwingsBuilt huge) must NOT decay a young foundry seed
  d = decayed(parseBed(bedDoc({ foundry: [F('fresh rep', 24, fb)] })), st({ cycle: 99, bigSwingsBuilt: 99, foundryBuilt: fb }))
  eq(d.length, 0, 'a grounds-swing flood never ages a foundry seed (decay clocks are separate)')

  // ladder — a foundry TURN comes due (gardens healthy, no swing due): BUILD if ripe, else PLAN/survey
  const healthyGarden = [G('a', 40), G('b', 40), G('c', 40), G('d', 40), G('e', 40)] // fuel 5 (>4), so no garden-plan
  const grounds2 = [GR('w', 40, 2), GR('w2', 40, 2)] // fuel 2 (≥floor), groundsSince kept <9 → no grounds action
  const due = { cycle: 40, lastGardenPlan: 38, lastBigSwing: 38, bigSwingsBuilt: 2, lastFoundry: 28, foundryBuilt: 0, tally: {} } // foundrySince 12

  d = decide(due, parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [F('Pond rep', 39, 0)] })))
  eq(d.mode + '/' + d.track, 'BUILD/foundry', 'foundry due + ripe seed → BUILD/foundry')
  eq(d.role, 'foundry-prep', 'BUILD/foundry hands to the foundry-prep (then the ART FOUNDRY engine)')

  d = decide(due, parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [] })))
  eq(d.mode + '/' + d.track, 'PLAN/foundry', 'foundry due + bed dry → PLAN/foundry (survey + restock)')
  eq(d.role, 'foundry-surveyor', 'PLAN/foundry is the foundry-surveyor')

  // a foundry seed never decays at BUILD/foundry time? — it just isn't due to. The directive's decay list
  // covers ALL tracks, so confirm a decayable foundry seed shows up under any non-writ directive:
  d = decide({ ...due, foundryBuilt: 9 }, parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [F('stale rep', 5, 1), F('ripe rep', 39, 9)] })))
  ok(d.decayed.some(x => x.track === 'foundry' && x.pitch.includes('stale')), 'a decayed foundry seed appears in the directive decay list')

  // PRIORITY — foundry sits BELOW garden-plan: when garden is ALSO due, garden-plan wins
  d = decide({ ...due, lastGardenPlan: 34 }, parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [F('Pond rep', 39, 0)] }))) // gardenBuilds 6 ≥ interval
  eq(d.mode + '/' + d.track, 'PLAN/garden', 'garden-plan outranks a due foundry turn (foundry never starves the gardens)')

  // not due yet → the garden-build staple, not foundry
  d = decide({ ...due, lastFoundry: 35 }, parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [F('Pond rep', 39, 0)] }))) // foundrySince 5 < 12
  eq(d.mode + '/' + d.track, 'BUILD/garden', 'foundry not due → the garden-build staple holds')

  // DORMANCY — an UNSEEDED state (no lastFoundry) keeps foundry dormant forever (back-compat safety)
  d = decide(st({ cycle: 99, lastGardenPlan: 97, lastBigSwing: 97 }), parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [F('Pond rep', 39, 0)] })))
  ok(d.track !== 'foundry', 'state without lastFoundry never fires a foundry turn (lastFoundry ?? cycle ⇒ since 0)')

  // record — a foundry BUILD advances BOTH clocks; a foundry PLAN advances only the interval clock
  const fbase = { cycle: 40, lastGardenPlan: 38, lastBigSwing: 30, bigSwingsBuilt: 2, lastFoundry: 28, foundryBuilt: 2, tally: {},
    fence: { garden: ['A'], grounds: ['W'], foundry: ['Pond rep', 'Cavern rep'] } }

  let r = applyRecord(fbase, { mode: 'BUILD', track: 'foundry' }, { garden: ['A'], grounds: ['W'], foundry: ['Cavern rep'] })
  eq(r.cycle, 41, 'foundry build bumps the durable cycle')
  eq(r.lastFoundry, 41, 'foundry build resets the foundry interval clock')
  eq(r.foundryBuilt, 3, 'foundry build increments the foundry contest counter')
  eq(r.lastBigSwing, 30, 'foundry build does NOT touch the grounds swing clock')
  eq(r.bigSwingsBuilt, 2, 'foundry build is NOT a grounds swing')
  eq(r.tally.foundryBloomed, 1, 'foundry build blooms the one forged rep (derived from the bed diff)')
  eq(r.tally.foundryDecayed || 0, 0, 'one removal on a foundry build decays nothing')

  r = applyRecord(fbase, { mode: 'PLAN', track: 'foundry' }, { garden: ['A'], grounds: ['W'], foundry: ['Pond rep', 'Cavern rep', 'Forge rep', 'Clock rep'] })
  eq(r.lastFoundry, 41, 'foundry PLAN (survey) resets the interval clock')
  eq(r.foundryBuilt, 2, 'foundry PLAN does NOT advance the contest counter (it forged nothing)')
  eq(r.tally.foundrySown, 2, 'foundry PLAN derives sown from the freshly-surveyed reps')
  eq(r.tally.foundryBloomed || 0, 0, 'a foundry PLAN blooms nothing')

  // a NON-foundry cycle carries the foundry clocks forward UNTOUCHED (they must persist across the loop)
  r = applyRecord(fbase, { mode: 'BUILD', track: 'garden' }, { garden: [], grounds: ['W'], foundry: ['Pond rep', 'Cavern rep'] })
  eq(r.lastFoundry, 28, 'a garden build leaves lastFoundry untouched (carried forward)')
  eq(r.foundryBuilt, 2, 'a garden build leaves foundryBuilt untouched')
  r = applyRecord(fbase, { mode: 'BUILD', track: 'grounds' }, { garden: ['A'], grounds: [], foundry: ['Pond rep', 'Cavern rep'] })
  eq(r.lastFoundry, 28, 'a grounds swing leaves the foundry interval clock untouched')
  eq(r.foundryBuilt, 2, 'a grounds swing leaves the foundry contest counter untouched')

  // a WRIT may RELEASE a clause into the foundry bed, credited as sown, cadence still frozen
  const wb = { cycle: 50, lastGardenPlan: 44, lastBigSwing: 41, bigSwingsBuilt: 3, lastFoundry: 30, foundryBuilt: 1, tally: {},
    fence: { garden: ['A'], grounds: ['W'], foundry: ['Pond rep'] } }
  r = applyRecord(wb, { mode: 'WRIT', track: 'writ' }, { garden: ['A'], grounds: ['W'], foundry: ['Pond rep', 'A released rep'] })
  eq(r.cycle, 50, 'WRIT releasing a foundry clause still holds the cycle clock')
  eq(r.lastFoundry, 30, 'WRIT does not touch the foundry interval clock')
  eq(r.foundryBuilt, 1, 'WRIT does not advance the foundry contest counter')
  eq(r.tally.foundrySown, 1, 'a foundry clause released by a writ is credited as sown')
  eq(r.fence.foundry.join(','), 'Pond rep,A released rep', 'WRIT re-baselines the foundry snapshot too')
}

console.log('FOUNDRY adaptive cadence — [rep] pressure shrinks the effective interval ([gate] does NOT):')
{
  // The gardens are healthy and no swing is due, so the foundry branch is reachable. We move lastFoundry to
  // tune foundrySince and read back gauges.foundryEffInterval + gauges.repFuel + the chosen directive.
  const healthyGarden = [G('a', 40), G('b', 40), G('c', 40), G('d', 40), G('e', 40)] // fuel 5 (>4): no garden-plan
  const grounds2 = [GR('w', 40, 2), GR('w2', 40, 2)] // fuel 2 (≥floor), groundsSince kept <9 → no grounds action
  // base state: cycle 40, gardens fresh, no swing due. lastFoundry tunes foundrySince per case.
  const fstate = (lastFoundry) => ({ cycle: 40, lastGardenPlan: 38, lastBigSwing: 38, bigSwingsBuilt: 2, lastFoundry, foundryBuilt: 0, tally: {} })

  // the cadence table: repFuel → effective interval
  const eff = (repFuel) => {
    const reps = Array.from({ length: repFuel }, (_, i) => F(`rep ${i}`, 39, 0))
    return decide(fstate(0), parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: reps }))).gauges.foundryEffInterval
  }
  eq(eff(0), 12, 'repFuel 0 → eff-interval 12 (patient)')
  eq(eff(1), 12, 'repFuel 1 → 12 (still within comfort)')
  eq(eff(2), 12, 'repFuel 2 (= comfort) → 12 (caught up)')
  eq(eff(3), 10, 'repFuel 3 → 10')
  eq(eff(4), 8,  'repFuel 4 → 8')
  eq(eff(5), 6,  'repFuel 5 → 6')
  eq(eff(6), 5,  'repFuel 6 → 5 (floor)')
  eq(eff(9), 5,  'repFuel 9 (well past) → 5 (clamped at the floor, never below)')

  // a [rep]-heavy bed fires SOONER than the patient 12: foundrySince=5 (lastFoundry=35) is BELOW 12 (no turn),
  // but with 6 [rep] seeds the eff-interval is 5, so foundrySince=5 ≥ 5 → a foundry turn fires.
  const sixReps = [F('r1', 39, 0), F('r2', 39, 0), F('r3', 39, 0), F('r4', 39, 0), F('r5', 39, 0), F('r6', 39, 0)]
  let d = decide(fstate(35), parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: sixReps }))) // foundrySince 5
  eq(d.gauges.repFuel, 6, '6 [rep] seeds → repFuel 6')
  eq(d.gauges.foundryEffInterval, 5, '6 [rep] seeds shrink the eff-interval to the floor (5)')
  eq(d.track, 'foundry', 'a [rep]-heavy bed fires the foundry SOONER than the patient 12 (foundrySince 5 ≥ eff 5)')
  eq(d.mode, 'BUILD', 'ripe [rep] bed → BUILD/foundry')
  // PROOF it is the pressure that fired it: the SAME foundrySince=5 with NO reps stays patient (no foundry turn)
  d = decide(fstate(35), parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [] })))
  eq(d.gauges.foundryEffInterval, 12, 'an empty foundry bed keeps the patient 12')
  ok(d.track !== 'foundry', 'with no [rep] pressure, foundrySince 5 < 12 → no foundry turn (the garden-build staple holds)')

  // a [gate]-ONLY bed creates NO pressure: repFuel 0 → patient interval 12 (re-souls are a slow burn).
  const gatesOnly = [FG('re-soul A', 39, 0), FG('re-soul B', 39, 0), FG('re-soul C', 39, 0), FG('re-soul D', 39, 0), FG('re-soul E', 39, 0), FG('re-soul F', 39, 0)]
  d = decide(fstate(35), parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: gatesOnly }))) // foundrySince 5
  eq(d.gauges.repFuel, 0, 'a [gate]-only bed → repFuel 0 (re-souls create NO pressure)')
  eq(d.gauges.foundryFuel, 6, 'the [gate] seeds DO count as total foundryFuel (just not as pressure)')
  eq(d.gauges.foundryEffInterval, 12, 'a [gate]-only bed stays at the patient interval 12 — mechanically different from [rep]')
  ok(d.track !== 'foundry', '6 [gate] re-souls at foundrySince 5 do NOT fire a turn (no pressure → still patient)')

  // intermediate: repFuel 4 → eff-interval 8. foundrySince=8 (lastFoundry=32) fires; foundrySince=7 does not.
  const fourReps = [F('r1', 39, 0), F('r2', 39, 0), F('r3', 39, 0), F('r4', 39, 0)]
  d = decide(fstate(32), parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: fourReps }))) // foundrySince 8
  eq(d.gauges.foundryEffInterval, 8, 'repFuel 4 → eff-interval 8 (intermediate, matches the table)')
  eq(d.track, 'foundry', 'repFuel 4 fires the foundry at foundrySince 8 ≥ eff 8')
  d = decide(fstate(33), parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: fourReps }))) // foundrySince 7
  ok(d.track !== 'foundry', 'repFuel 4 with foundrySince 7 < eff 8 → not yet due')

  // BUILD-vs-survey keys off TOTAL foundryFuel, not repFuel — a ripe rep BUILDs, an all-decayed bed SURVEYs.
  // ripe: 3 [rep] seeds (repFuel 3 → eff 10), foundrySince=10 fires, foundryFuel 3 ≥ 1 → BUILD/foundry.
  const threeReps = [F('r1', 39, 0), F('r2', 39, 0), F('r3', 39, 0)]
  d = decide(fstate(30), parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: threeReps }))) // foundrySince 10
  eq(d.gauges.foundryEffInterval, 10, 'repFuel 3 → eff-interval 10')
  eq(d.mode + '/' + d.track, 'BUILD/foundry', 'ripe foundry bed (foundryFuel ≥ 1) → BUILD/foundry')
  // dry: zero foundryFuel but a turn is due (patient eff 12, foundrySince 12) → PLAN/foundry survey.
  d = decide({ cycle: 40, lastGardenPlan: 38, lastBigSwing: 38, bigSwingsBuilt: 2, lastFoundry: 28, foundryBuilt: 0, tally: {} },
    parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [] }))) // foundrySince 12, repFuel 0, foundryFuel 0
  eq(d.gauges.foundryFuel, 0, 'an empty bed → total foundryFuel 0')
  eq(d.mode + '/' + d.track, 'PLAN/foundry', 'a due turn with zero TOTAL foundryFuel → PLAN/foundry (survey), keyed off total fuel not repFuel')

  // the BUILD-vs-survey branch keys off TOTAL fuel even when repFuel is 0 but [gate] fuel is present:
  // a [gate]-only bed under a manually-due clock still BUILDs (total fuel ≥ 1), proving the build decision
  // is on TOTAL foundryFuel, not repFuel. (foundrySince 12 ≥ the patient eff 12, since repFuel 0.)
  d = decide({ cycle: 40, lastGardenPlan: 38, lastBigSwing: 38, bigSwingsBuilt: 2, lastFoundry: 28, foundryBuilt: 0, tally: {} },
    parseBed(bedDoc({ garden: healthyGarden, grounds: grounds2, foundry: [FG('re-soul A', 39, 0)] }))) // foundrySince 12, repFuel 0, foundryFuel 1
  eq(d.gauges.repFuel, 0, 'a single [gate] seed → repFuel 0 (no pressure)')
  eq(d.gauges.foundryEffInterval, 12, 'repFuel 0 (only [gate] fuel) → patient eff-interval 12')
  eq(d.mode + '/' + d.track, 'BUILD/foundry', 'a due turn with [gate]-only fuel still BUILDs (total foundryFuel ≥ 1), proving build keys off TOTAL fuel')
}

console.log(`\n${fail === 0 ? '✓' : '✗'} gauge.test.mjs: ${pass}/${pass + fail} passed`)
process.exit(fail === 0 ? 0 : 1)
