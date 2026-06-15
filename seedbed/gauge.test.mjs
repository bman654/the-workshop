#!/usr/bin/env node
// ── Node twin for the mode gauge — proves the ladder + decay + cadence exact ───
// Run: node seedbed/gauge.test.mjs   (exit 0 = all green). Pure logic, never
// touches the real ROADMAP/state — synthetic fixtures only.

import { classify, parseBed, decide, decayed, applyRecord, TH } from './gauge.mjs'

let pass = 0, fail = 0
const ok = (cond, msg) => { if (cond) { pass++ } else { fail++; console.error('  ✗ ' + msg) } }
const eq = (a, b, msg) => ok(a === b, `${msg} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`)

// helper: build a roadmap string with N garden + M grounds + S sparks + B bugs
function bedDoc({ garden = [], grounds = [], sparks = [], bugs = [] } = {}) {
  const sec = (name, lines) => `<!-- gauge:${name}:start -->\n${lines.join('\n')}\n<!-- gauge:${name}:end -->`
  return [
    sec('bug', bugs),
    sec('garden-seeds', garden),
    sec('grounds-seeds', grounds),
    sec('sparks', sparks),
  ].join('\n\n')
}
const G = (pitch, sown) => `- [exhibit] **${pitch}** — a gap. (sown #${sown})`
const GR = (pitch, sown, contest) => `- [room] **${pitch}** — a wing. (sown #${sown} · contest #${contest})`
const SP = (t) => `- ${t}`
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

console.log(`\n${fail === 0 ? '✓' : '✗'} gauge.test.mjs: ${pass}/${pass + fail} passed`)
process.exit(fail === 0 ? 0 : 1)
