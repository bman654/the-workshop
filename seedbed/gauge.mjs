#!/usr/bin/env node
// ── The Workshop's mode gauge — deterministic two-track cadence ────────────────
// The director RUNS this and OBEYS the directive. No LLM-guessing the mode: the
// gauge is code, with a self-test (gauge.test.mjs), in the house "prove it exact"
// spirit. See seedbed/README.md for the full model.
//
//   GARDENS (small track) — grow what exists, and RE-SOUL what drifted. gardener
//     files ≤3-line seeds + AUDITS existing pieces, marking ~1 for `rework`;
//     planter ripens+sows one (a bench / cross / curation / rework).
//   GROUNDS (big track) — new structure. groundskeeper tailors sparks→grounds
//     seeds; grounds-worker opens a wing / engine / metagame / map / medium.
//
// FUEL IS DERIVED (counted live from ROADMAP.md), never hand-maintained — so a
// bloomed seed pruned from the bed drops fuel automatically (no "fuel 5→4" drift,
// and crosses burn fuel exactly like exhibits: both are garden seeds). Only the
// COUNTERS persist in state.json (cycle, lastGardenPlan, lastBigSwing,
// bigSwingsBuilt) — durable across loop relaunches (the ledger lesson).
//
// Usage:
//   node seedbed/gauge.mjs            → the JSON directive for THIS cycle (director reads it)
//   node seedbed/gauge.mjs --status   → the same, human-readable
//   node seedbed/gauge.mjs record --mode BUILD --track garden [--bloomed n --sown n --decayed n]
//                                     → publisher applies the cycle outcome (mutates state.json)
//   node seedbed/gauge.mjs --check    → validate state shape + print the directive

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROADMAP = fileURLToPath(new URL('../ROADMAP.md', import.meta.url))
const STATE = fileURLToPath(new URL('./state.json', import.meta.url))

// ── Tunable thresholds — START values; tune from the measured decay ratio ──────
// Aim (Brandon, 2026-06-15): ~⅓ of filed seeds decay, ~⅔ get sown. Watch the
// ratio in `--status`; if decay drifts high, raise the decay windows; if low
// (the bed grows a tail), lower them or trim the ceiling.
export const TH = {
  gardenFuelFloor: 4,     // PLAN/garden when gardenFuel <= this (bed running dry)
  gardenFuelCeiling: 10,  // the gardener refills toward this (advisory; raised 8→10 for a richer, more varied bed incl. rework)
  gardenInterval: 6,      // PLAN/garden when gardenBuilds >= this (time-based backstop)
  gardenDecayAge: 15,     // a garden seed decays when (cycle - sown) >= this — raised 12→15 at cycle 65 from the measured 47% decay ratio (vs ~33% target; the bed lost the planting contest to crosses, it didn't go stale)
  groundsFuelFloor: 2,    // PLAN/grounds when groundsFuel < this (keep big swings ready)
  groundsFuelCeiling: 3,  // the groundskeeper refills toward this (advisory)
  groundsInterval: 9,     // BUILD/grounds (a swing!) when (cycle - lastBigSwing) >= this AND a ripe one exists
  groundsDecayStrikes: 4, // a grounds seed decays when (bigSwingsBuilt - contest) >= this (contests lost)
  sparkFloor: 3,          // the groundskeeper keeps at least this many sparks on hand
}

// ── Classify a seed kind into a track ─────────────────────────────────────────
// Garden = grow what exists. Grounds = new structure. Unknown → grounds (a
// spark-coined NEW concept defaults to the big track). bug jumps the queue.
const GARDEN_KINDS = new Set(['exhibit', 'cross', 'curation', 'grow', 'rework'])
const GROUNDS_KINDS = new Set(['room', 'engine', 'metagame', 'map', 'medium', 'wing'])
export function classify(kind) {
  const k = String(kind || '').toLowerCase().split(/[\/·\s]/)[0]
  if (k === 'writ') return 'writ'
  if (k === 'bug') return 'bug'
  if (GARDEN_KINDS.has(k)) return 'garden'
  if (GROUNDS_KINDS.has(k)) return 'grounds'
  return 'grounds' // unknown / novel kind → big track by default
}

// ── Parse the seedbed out of ROADMAP.md ───────────────────────────────────────
// Live seeds sit between section fences:  <!-- gauge:NAME:start --> … :end -->
// A live seed line starts with "- [" (struck "- ~~[" and tombstone "*…" lines
// are excluded). Each carries a stamp: garden "(sown #N)", grounds adds
// "· contest #M". Sparks are plain "- " lines in the sparks section.
// 'writ' first: a Patron's Writ outranks everything (see the decision ladder).
const SECTIONS = ['writ', 'garden-seeds', 'grounds-seeds', 'sparks', 'bug']
function section(text, name) {
  const m = text.match(new RegExp(`<!--\\s*gauge:${name}:start\\s*-->([\\s\\S]*?)<!--\\s*gauge:${name}:end\\s*-->`))
  return m ? m[1] : null
}
function liveSeedLines(sectionText) {
  if (sectionText == null) return []
  return sectionText.split('\n').filter(l => l.startsWith('- ['))
}
function liveSparkLines(sectionText) {
  if (sectionText == null) return []
  return sectionText.split('\n').filter(l => l.startsWith('- ') && !l.startsWith('- ~~'))
}
function kindOf(line) {
  const m = line.match(/^- \[([^\]]+)\]/)
  return m ? m[1] : ''
}
function stampOf(line) {
  const m = line.match(/\(sown #(\d+)(?:[^)]*?contest #(\d+))?[^)]*\)/)
  if (!m) return { sown: null, contest: null }
  return { sown: Number(m[1]), contest: m[2] != null ? Number(m[2]) : null }
}
function pitchOf(line) {
  const m = line.match(/^- \[[^\]]+\]\s*\*?\*?(.+?)(\*\*)?\s*(—|\(sown)/)
  return (m ? m[1] : line).replace(/\*/g, '').trim().slice(0, 70)
}

export function parseBed(text) {
  const writs = liveSeedLines(section(text, 'writ'))
  const garden = liveSeedLines(section(text, 'garden-seeds'))
  const grounds = liveSeedLines(section(text, 'grounds-seeds'))
  const sparks = liveSparkLines(section(text, 'sparks'))
  const bugs = liveSeedLines(section(text, 'bug'))
  const present = SECTIONS.filter(s => section(text, s) != null)
  return {
    writs: writs.length,
    gardenFuel: garden.length,
    groundsFuel: grounds.length,
    sparks: sparks.length,
    bugs: bugs.length,
    writSeeds: writs.map(l => ({ kind: kindOf(l), pitch: pitchOf(l) })),
    gardenSeeds: garden.map(l => ({ kind: kindOf(l), pitch: pitchOf(l), ...stampOf(l) })),
    groundsSeeds: grounds.map(l => ({ kind: kindOf(l), pitch: pitchOf(l), ...stampOf(l) })),
    sectionsPresent: present,
  }
}

// ── Compute decayed seeds (lazy birth-stamp: computed at read time) ────────────
export function decayed(bed, state, th = TH) {
  const out = []
  for (const s of bed.gardenSeeds) {
    if (s.sown != null && state.cycle - s.sown >= th.gardenDecayAge) {
      out.push({ track: 'garden', pitch: s.pitch, age: state.cycle - s.sown })
    }
  }
  for (const s of bed.groundsSeeds) {
    if (s.contest != null && state.bigSwingsBuilt - s.contest >= th.groundsDecayStrikes) {
      out.push({ track: 'grounds', pitch: s.pitch, strikes: state.bigSwingsBuilt - s.contest })
    }
  }
  return out
}

// ── The decision ladder (PURE — state + bed → directive) ──────────────────────
export function decide(state, bed, th = TH) {
  const cycle = state.cycle
  const gardenBuilds = cycle - state.lastGardenPlan
  const groundsSince = cycle - state.lastBigSwing
  const gauges = {
    cycle,
    currentCycle: cycle + 1, // the cycle ABOUT to run — stamp seeds + the funlog with this
    gardenFuel: bed.gardenFuel, gardenBuilds,
    groundsFuel: bed.groundsFuel, groundsSince,
    bigSwingsBuilt: state.bigSwingsBuilt, sparks: bed.sparks, bugs: bed.bugs, writs: bed.writs,
  }
  let r
  if (bed.writs > 0) {
    // The Patron's Writ outranks everything, even a bug. The director TRIAGES it,
    // and the cycle is CADENCE-NEUTRAL (see applyRecord) — serving the Patron decays
    // nothing else, so we hand the director an EMPTY decay list (prune nothing).
    r = { mode: 'WRIT', track: 'writ', role: 'director',
      reason: `${bed.writs} sealed Patron's writ(s) — triage before all else; this cycle decays nothing (the cadence clocks hold).` }
  } else if (bed.bugs > 0) {
    r = { mode: 'BUILD', track: 'bug', role: 'bug-fixer',
      reason: `${bed.bugs} open [bug] — a fix jumps the queue.` }
  } else if (groundsSince >= th.groundsInterval && bed.groundsFuel >= 1) {
    r = { mode: 'BUILD', track: 'grounds', role: 'grounds-worker',
      reason: `groundsSince=${groundsSince} ≥ ${th.groundsInterval} and ${bed.groundsFuel} ripe grounds seed(s) — time to go WIDE: open a big swing.` }
  } else if (bed.groundsFuel < th.groundsFuelFloor) {
    r = { mode: 'PLAN', track: 'grounds', role: 'groundskeeper',
      reason: `groundsFuel=${bed.groundsFuel} < ${th.groundsFuelFloor} — tend the grounds: tailor sparks → grounds seeds (keep big swings ready).` }
  } else if (gardenBuilds >= th.gardenInterval || bed.gardenFuel <= th.gardenFuelFloor) {
    const why = bed.gardenFuel <= th.gardenFuelFloor
      ? `gardenFuel=${bed.gardenFuel} ≤ ${th.gardenFuelFloor} (bed running dry)`
      : `gardenBuilds=${gardenBuilds} ≥ ${th.gardenInterval} (a while since planting)`
    r = { mode: 'PLAN', track: 'garden', role: 'gardener',
      reason: `${why} — tend the beds: prune decayed FIRST, then file ≤3-line seeds toward fuel ${th.gardenFuelCeiling}.` }
  } else {
    r = { mode: 'BUILD', track: 'garden', role: 'planter',
      reason: `gardenFuel=${bed.gardenFuel} (>${th.gardenFuelFloor}), gardenBuilds=${gardenBuilds} (<${th.gardenInterval}) — pull a garden seed (or dream one) and sow it.` }
  }
  return { ...r, gauges, decayed: r.track === 'writ' ? [] : decayed(bed, state, th) }
}

// ── State IO ──────────────────────────────────────────────────────────────────
const STATE_FIELDS = ['cycle', 'lastGardenPlan', 'lastBigSwing', 'bigSwingsBuilt']
export function loadState() {
  const s = JSON.parse(readFileSync(STATE, 'utf8'))
  for (const f of STATE_FIELDS) if (typeof s[f] !== 'number') throw new Error(`state.json: ${f} must be a number`)
  return s
}
function saveState(s) { writeFileSync(STATE, JSON.stringify(s, null, 2) + '\n') }

// ── record: the publisher applies the cycle outcome (deterministic) ───────────
// record is the SOLE state-mutation surface, so it validates HARD: an unknown
// mode/track throws (a silent miss would desync the cadence forever). Plurals are
// tolerated (the prose says "gardens"/"grounds"); counts coerce non-numbers → 0
// (a forgotten "--sown N" placeholder must not crash the cycle bump or poison the tally).
const MODES = { BUILD: 'BUILD', PLAN: 'PLAN', TRIVIAL: 'TRIVIAL', WRIT: 'WRIT' }
const TRACKS = { garden: 'garden', gardens: 'garden', grounds: 'grounds', ground: 'grounds', bug: 'bug', bugs: 'bug', writ: 'writ', writs: 'writ' }
// currentBed (optional) = { garden: [seed-title, …], grounds: [seed-title, …] } — the
// bed AFTER this cycle's edits. When given, the tally is DERIVED by diffing it against
// the snapshot in state.fence (like fuel — the bed is the source of truth, so a sloppy
// or dishonest agent report can't poison the decay-ratio metric). When omitted, falls
// back to the explicit --bloomed/--sown/--decayed counts (manual / tests only).
export function applyRecord(state, { mode, track, bloomed, sown, decayed } = {}, currentBed = null) {
  const m = MODES[String(mode).toUpperCase()]
  const t = TRACKS[String(track).toLowerCase()]
  if (!m) throw new Error(`record: unknown --mode "${mode}" (want BUILD | PLAN | TRIVIAL | WRIT)`)
  if (!t) throw new Error(`record: unknown --track "${track}" (want garden | grounds | bug | writ)`)

  // ── A Patron's Writ is CADENCE-NEUTRAL ──────────────────────────────────────
  // It advances NO clock (cycle / lastGardenPlan / lastBigSwing / bigSwingsBuilt all
  // hold), so serving the Patron ages and decays NOTHING else in the beds. It only
  // (a) re-baselines the bed snapshot and (b) credits any creative clauses it RELEASED
  // into the beds as 'sown' (an honest fuel metric) — it never books a bloom or a decay,
  // and a released seed carries NO mark of its Patron origin (no providence in the bed).
  // NB: the publisher stamps a released seed (sown #N) with N=currentCycle=cycle+1 while
  // this record HOLDS cycle at N-1, so decayed() reads its age as -1 for one cycle —
  // harmless (it still decays at cycle ≥ sown+gardenDecayAge, just one extra cycle of
  // grace). Do NOT special-case the stamp to "fix" the negative age — that would couple
  // a writ to the decay clock and break the "decays nothing" invariant.
  if (m === 'WRIT') {
    const sw = { ...state }
    if (currentBed) {
      const tally = { ...(state.tally || {}) }
      const old = state.fence || { garden: [], grounds: [] }
      for (const fence of ['garden', 'grounds']) {
        const cur = new Set(currentBed[fence] || [])
        const prev = new Set(old[fence] || [])
        const sownN = [...cur].filter(x => !prev.has(x)).length // released this writ
        tally[`${fence}Sown`] = (tally[`${fence}Sown`] || 0) + sownN
        // NB: a seed absent from cur is NOT booked decayed — a writ never prunes the beds.
      }
      sw.tally = tally
      sw.fence = { garden: [...(currentBed.garden || [])], grounds: [...(currentBed.grounds || [])] }
    }
    return sw
  }

  const s = { ...state }
  s.cycle = state.cycle + 1 // every completed cycle advances the durable clock
  if (m === 'PLAN' && t === 'garden') s.lastGardenPlan = s.cycle
  if (m === 'BUILD' && t === 'grounds') { s.lastBigSwing = s.cycle; s.bigSwingsBuilt = state.bigSwingsBuilt + 1 }
  const tally = { ...(state.tally || {}) }
  const bump = (k, n) => { tally[k] = (tally[k] || 0) + n }

  if (currentBed) {
    // DERIVED: diff the fence (by seed title) vs the last snapshot. A seed that left
    // the bed BLOOMED (a BUILD in its own fence ships exactly one) or else DECAYED (pruned).
    // A seed edited IN PLACE keeps its title → in neither set → correctly counted as nothing.
    const old = state.fence || { garden: [], grounds: [] }
    for (const fence of ['garden', 'grounds']) {
      const cur = new Set(currentBed[fence] || [])
      const prev = new Set(old[fence] || [])
      const sownN = [...cur].filter(x => !prev.has(x)).length
      const goneN = [...prev].filter(x => !cur.has(x)).length
      const bloomsHere = (m === 'BUILD' && t === fence) ? Math.min(1, goneN) : 0
      bump(`${fence}Sown`, sownN)
      bump(`${fence}Bloomed`, bloomsHere)
      bump(`${fence}Decayed`, goneN - bloomsHere)
    }
    s.fence = { garden: [...(currentBed.garden || [])], grounds: [...(currentBed.grounds || [])] }
  } else {
    const num = x => { const n = Number(x); return Number.isFinite(n) ? n : 0 }
    const ns = t === 'grounds' ? 'grounds' : 'garden'
    bump(`${ns}Sown`, num(sown)); bump(`${ns}Bloomed`, num(bloomed)); bump(`${ns}Decayed`, num(decayed))
  }
  s.tally = tally
  return s
}

// ── CLI ───────────────────────────────────────────────────────────────────────
function flags(argv) {
  const f = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { const k = argv[i].slice(2); const v = argv[i + 1]; f[k] = (v == null || v.startsWith('--')) ? true : v; if (f[k] !== true) i++ }
  }
  return f
}
function ratio(tally, ns) {
  const sown = tally?.[`${ns}Sown`] || 0, bloomed = tally?.[`${ns}Bloomed`] || 0, dec = tally?.[`${ns}Decayed`] || 0
  const resolved = bloomed + dec
  return resolved ? `${ns}: ${bloomed} sown-to-bloom · ${dec} decayed · decay ratio ${(dec / resolved * 100).toFixed(0)}% (target ~33%)` : `${ns}: no resolved seeds yet`
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2)
  if (cmd === 'record') {
    const f = flags(rest)
    if (!f.mode || !f.track) { console.error('record needs --mode and --track'); process.exit(2) }
    const state = loadState()
    const bed = parseBed(readFileSync(ROADMAP, 'utf8'))
    const currentBed = { garden: bed.gardenSeeds.map(s => s.pitch), grounds: bed.groundsSeeds.map(s => s.pitch) }
    let ns
    try { ns = applyRecord(state, { mode: f.mode, track: f.track }, currentBed) } // tally DERIVED from the bed diff
    catch (e) { console.error(e.message); process.exit(2) }
    saveState(ns)
    const dt = ns.tally, ot = state.tally || {}
    const delta = (k) => (dt[k] || 0) - (ot[k] || 0)
    if (String(f.mode).toUpperCase() === 'WRIT') {
      console.log(`recorded WRIT/writ: cadence HELD at cycle ${ns.cycle} (no clock advanced → nothing decayed) · released ${delta('gardenSown')} garden + ${delta('groundsSown')} grounds seed(s) to the beds`)
    } else {
      console.log(`recorded ${f.mode}/${f.track}: cycle ${state.cycle} → ${ns.cycle}  ·  garden +${delta('gardenSown')} sown / ${delta('gardenBloomed')} bloomed / ${delta('gardenDecayed')} decayed · grounds +${delta('groundsSown')} sown / ${delta('groundsBloomed')} bloomed / ${delta('groundsDecayed')} decayed`)
    }
    console.log(JSON.stringify(ns, null, 2))
    return
  }
  const state = loadState()
  const text = readFileSync(ROADMAP, 'utf8')
  const bed = parseBed(text)
  const d = decide(state, bed)
  const missing = SECTIONS.filter(s => !bed.sectionsPresent.includes(s))
  // an unstamped live seed counts as fuel but can NEVER decay — flag it loudly
  const unstamped = bed.gardenSeeds.filter(s => s.sown == null).map(s => s.pitch)
    .concat(bed.groundsSeeds.filter(s => s.contest == null).map(s => s.pitch))

  if (cmd === '--status' || cmd === '--check') {
    const g = d.gauges
    console.log(`🎲 cycle ${g.currentCycle} (last completed ${g.cycle})`)
    console.log(`   GARDEN  fuel=${g.gardenFuel} (floor ${TH.gardenFuelFloor}/ceil ${TH.gardenFuelCeiling}) · builds-since-plan=${g.gardenBuilds} (cap ${TH.gardenInterval})`)
    console.log(`   GROUNDS fuel=${g.groundsFuel} (floor ${TH.groundsFuelFloor}/ceil ${TH.groundsFuelCeiling}) · since-swing=${g.groundsSince} (interval ${TH.groundsInterval}) · swings-built=${g.bigSwingsBuilt} · sparks=${g.sparks}`)
    console.log(`   ${g.writs ? '✒️  ' : ''}writs=${g.writs}   bugs=${g.bugs}`)
    console.log(`\n▶ ${d.mode} / ${d.track}  (be the ${d.role})`)
    console.log(`   ${d.reason}`)
    if (d.decayed.length) {
      console.log(`\n🥀 DECAYED — prune these CLEAN (no tombstone; free to return later):`)
      for (const s of d.decayed) console.log(`   · [${s.track}] ${s.pitch}${s.age != null ? `  (age ${s.age})` : `  (${s.strikes} contests lost)`}`)
    }
    if (missing.length) console.log(`\n⚠ ROADMAP missing gauge sections: ${missing.join(', ')} (fuel counted as 0 there)`)
    if (unstamped.length) console.log(`\n⚠ ${unstamped.length} UNSTAMPED seed(s) — they count as fuel but can NEVER decay; add (sown #N) / (· contest #M):\n   · ${unstamped.join('\n   · ')}`)
    console.log(`\n${ratio(state.tally, 'garden')}\n${ratio(state.tally, 'grounds')}`)
    if (cmd === '--check') console.log('\nstate shape OK ✓')
    return
  }
  // default: the machine directive
  const warns = []
  if (missing.length) warns.push(`missing gauge sections: ${missing.join(', ')}`)
  if (unstamped.length) warns.push(`${unstamped.length} unstamped seed(s) (count as fuel but can never decay)`)
  if (warns.length) d.warning = warns.join('; ')
  console.log(JSON.stringify(d, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
