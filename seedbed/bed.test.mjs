#!/usr/bin/env node
// ── Node twin for bed.mjs — rm · tomb · restamp · gc · the FIFO ring, on a FIXTURE
// Never touches the real ROADMAP: builds a tiny in-memory ROADMAP with every fence
// + a mix of live seeds, legacy giant comments, and canonical ✝ tombstones, and
// proves the gauge still counts the live seeds (tombstones never inflate the count).
import { makeTomb, removeByTitle, addTomb, restampByTitle, gc, FENCES, FENCE_KEEP, keepFor } from './bed.mjs'
import { parseBed } from './gauge.mjs'
import { execFileSync } from 'node:child_process'
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

let pass = 0, fail = 0
const ok = (c, m) => { if (c) pass++; else { fail++; console.error(`  ✗ ${m}`) } }
const eq = (a, b, m) => ok(a === b, `${m} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`)
const tombs = (text, fence) => {
  const lines = text.split('\n')
  const s = lines.findIndex(l => l.includes(`gauge:${fence}:start`))
  const e = lines.findIndex(l => l.includes(`gauge:${fence}:end`))
  return lines.slice(s + 1, e).filter(l => /^<!--\s*✝/.test(l.trim()))
}

const FIXTURE = `# ROADMAP
<!-- gauge:writ:start -->
- [writ] **The sealed request** — release a thing into the garden.
<!-- gauge:writ:end -->

<!-- gauge:bug:start -->
- [bug] **A live bug.** broke.
<!-- FIXED #57 → some giant legacy wall of prose that should be dropped by gc entirely. -->
<!-- gauge:bug:end -->

<!-- gauge:sparks:start -->
- ⚡ **A live spark** — already here.
<!-- gauge:sparks:end -->

<!-- gauge:grounds-seeds:start -->
- [room] **A live room** — already here. (sown #50 · contest #4)
<!-- BLOOMED #31 → The Conservatory (a giant legacy comment) ... -->
<!-- ✝ BLOOMED #41: Alchemy Lab → alchemy/ -->
<!-- gauge:grounds-seeds:end -->

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Mine** — a Lode Runner clone. (sown #109)
- [exhibit] **The Climb** — a Donkey Kong clone. (sown #109)
### cross
- [cross] **A live cross** — links a×b. (sown #88)
### curation
### rework
### bench
<!-- BLOOMED #93 → a giant legacy garden tombstone wall ... -->
<!-- ✝ BLOOMED #105: The Clack Counter → collisions/ · after abc1234 -->
<!-- ✝ BLOOMED #106: The Contrary Stone → rattleback/ · after def5678 -->
<!-- gauge:garden-seeds:end -->
`

// ── makeTomb format ──
eq(makeTomb('bloomed', 108, 'The Slingshot', 'aerodrome/slingshot/', 'e4f0ea4'),
  '<!-- ✝ BLOOMED #108: The Slingshot → aerodrome/slingshot/ · after e4f0ea4 -->', 'full tombstone w/ hint + after')
eq(makeTomb('SERVED', 109, 'keeper mark', '', ''), '<!-- ✝ SERVED #109: keeper mark -->', 'bare tombstone, no hint/after')
ok(makeTomb('X', 9, 'y'.repeat(200), '', 'h').length < 100, 'a huge title is truncated (no essays)')

// ── keepFor: the writ fence is pinned to 0 (a hard ceiling --keep cannot raise) ──
eq(FENCE_KEEP.writ, 0, 'the writ fence ceiling is 0 (no memory by design)')
eq(keepFor('writ', 5), 0, 'keepFor pins the writ ring to 0')
eq(keepFor('writ', 99), 0, 'keepFor: --keep 99 cannot raise the writ ceiling')
eq(keepFor('garden-seeds', 5), 5, 'keepFor passes a normal fence through unchanged')
eq(keepFor('garden-seeds'), 5, 'keepFor defaults to DEFAULT_KEEP when none asked')

// ── removeByTitle: live seed → tombstone, gauge count drops, tombstone doesn't ──
{
  const before = parseBed(FIXTURE)
  const { text, fence, tombstone } = removeByTitle(FIXTURE, { title: 'The Mine', reason: 'BLOOMED', cycle: 110, hint: 'lode/', after: 'aaa1111' })
  eq(fence, 'garden-seeds', 'The Mine lives in the garden fence')
  ok(tombstone.includes('✝ BLOOMED #110: The Mine'), 'tombstone names the removed seed')
  const after = parseBed(text)
  eq(after.gardenFuel, before.gardenFuel - 1, 'gauge garden count drops by exactly one (seed gone)')
  ok(!text.includes('**The Mine** — a Lode Runner'), 'the live Mine line is gone')
  ok(tombs(text, 'garden-seeds').some(l => l.includes('The Mine')), 'a Mine tombstone now sits in the garden ring')
}

// ── FIFO ring: keep=2, the garden already has 2 canon tombstones → adding a 3rd drops the oldest ──
{
  const { text } = removeByTitle(FIXTURE, { title: 'The Climb', reason: 'BLOOMED', cycle: 111, after: 'bbb2222', keep: 2 })
  const ring = tombs(text, 'garden-seeds')
  eq(ring.length, 2, 'ring capped at keep=2')
  ok(!ring.some(l => l.includes('#105')), 'the OLDEST (#105) was FIFO-pruned')
  ok(ring.some(l => l.includes('#106')) && ring.some(l => l.includes('The Climb')), 'newest two (#106 + The Climb) survive')
}

// ── THE WRIT EXCEPTION: serving a writ leaves NO tombstone (keep=0, no providence) ──
{
  const before = parseBed(FIXTURE)
  const { text, fence, tombstone } = removeByTitle(FIXTURE, { title: 'The sealed request', reason: 'SERVED', cycle: 109, after: 'eee5555' })
  eq(fence, 'writ', 'the writ lives in the writ fence')
  eq(tombstone, null, 'a served writ leaves NO tombstone (its Patron providence stays out of the file)')
  eq(parseBed(text).writs, before.writs - 1, 'the live writ count drops by exactly one')
  ok(tombs(text, 'writ').length === 0, 'the writ fence holds no ✝ after serving')
  ok(!text.includes('SERVED'), 'no SERVED marker leaks anywhere in the file')
}

// ── --keep cannot breach the writ ceiling (FENCE_KEEP.writ=0 is a hard cap) ──
{
  const { text, tombstone } = removeByTitle(FIXTURE, { title: 'The sealed request', reason: 'SERVED', cycle: 109, keep: 99 })
  eq(tombstone, null, '--keep 99 cannot force a writ tombstone')
  ok(tombs(text, 'writ').length === 0, 'still no writ tombstone even with --keep 99')
}

// ── ambiguity + not-found guards ──
ok((() => { try { removeByTitle(FIXTURE, { title: 'nope', reason: 'X' }); return false } catch { return true } })(), 'rm throws on a missing title')
ok((() => { try { removeByTitle(FIXTURE, { title: 'A live', reason: 'X' }); return false } catch { return true } })(), 'rm throws on an ambiguous substring (Mine/Climb/cross all contain no… but "A live" hits 3)')

// ── addTomb: bare tombstone on a normal fence (no seed removed) ──
{
  const before = parseBed(FIXTURE)
  const { text, tombstone } = addTomb(FIXTURE, { fence: 'grounds-seeds', reason: 'BLOOMED', cycle: 110, title: 'a built wing', after: 'ccc3333' })
  ok(tombstone && tombstone.includes('✝ BLOOMED #110'), 'addTomb inscribes a tombstone on a normal fence')
  eq(parseBed(text).groundsFuel, before.groundsFuel, 'addTomb removes no live seed (grounds count unchanged)')
  ok(tombs(text, 'grounds-seeds').some(l => l.includes('a built wing')), 'the new tombstone is in the grounds ring')
}

// ── addTomb on the writ fence refuses to inscribe (keep=0) ──
{
  const { text, tombstone } = addTomb(FIXTURE, { fence: 'writ', reason: 'SERVED', cycle: 109, title: 'a served writ', after: 'ccc3333' })
  eq(tombstone, null, 'addTomb on the writ fence inscribes nothing (keep=0)')
  ok(tombs(text, 'writ').length === 0, 'the writ fence stays empty of tombstones')
}

// ── restamp: refresh a decaying seed's stamp ──
{
  const { text, before, after } = restampByTitle(FIXTURE, { title: 'A live cross', cycle: 120 })
  ok(before.includes('(sown #88)') && after.includes('(sown #120)'), 'restamp bumps the sown cycle')
  ok(!after.includes('#88'), 'the stale stamp is gone')
}

// ── gc: drop legacy/narrative, keep newest ≤keep canon, gauge counts unchanged ──
{
  const before = parseBed(FIXTURE)
  const { text, report } = gc(FIXTURE, { keep: 5 })
  const after = parseBed(text)
  eq(after.gardenFuel, before.gardenFuel, 'gc touches no live seed (garden count stable)')
  eq(after.groundsFuel, before.groundsFuel, 'gc touches no live grounds seed')
  ok(!text.includes('giant legacy'), 'every legacy/narrative comment is dropped')
  ok(tombs(text, 'garden-seeds').length === 2, 'garden keeps its 2 canonical tombstones (#105,#106)')
  ok(tombs(text, 'grounds-seeds').length === 1 && tombs(text, 'grounds-seeds')[0].includes('#41'), 'grounds keeps its 1 canon (#41), drops the legacy BLOOMED #31')
  ok(tombs(text, 'bug').length === 0 && !text.includes('FIXED #57'), 'the bug fence legacy FIXED is dropped (no canon to keep)')
  ok(report.find(r => r.fence === 'garden-seeds').droppedLegacy === 1, 'gc report counts the 1 garden legacy drop')
}

// ── gc trims an over-full canonical ring to keep ──
{
  const fence = '<!-- gauge:bug:start -->\n'
    + [1, 2, 3, 4].map(n => `<!-- ✝ FIXED #${n}: bug ${n} -->`).join('\n') + '\n<!-- gauge:bug:end -->'
  const wrap = FIXTURE.replace(/<!-- gauge:bug:start -->[\s\S]*?<!-- gauge:bug:end -->/, fence)
  const { text } = gc(wrap, { keep: 2 })
  const ring = tombs(text, 'bug')
  eq(ring.length, 2, 'over-full canon ring trimmed to keep=2')
  ok(ring.some(l => l.includes('#3')) && ring.some(l => l.includes('#4')) && !ring.some(l => l.includes('#1')), 'gc keeps the newest by cycle')
}

// ── gc enforces the writ ceiling: any stray writ tombstone is wiped ──
{
  const wfence = '<!-- gauge:writ:start -->\n- [writ] **The sealed request** — release a thing into the garden.\n<!-- ✝ SERVED #100: an old served writ → x · after zzz9999 -->\n<!-- gauge:writ:end -->'
  const wrap = FIXTURE.replace(/<!-- gauge:writ:start -->[\s\S]*?<!-- gauge:writ:end -->/, wfence)
  ok(tombs(wrap, 'writ').length === 1, 'precondition: the variant carries a stray writ tombstone')
  const { text } = gc(wrap, { keep: 5 })
  ok(tombs(text, 'writ').length === 0, 'gc drops the stray writ tombstone (writ keeps 0 even at --keep 5)')
  ok(parseBed(text).writs === 1, 'gc leaves the live writ untouched')
}

// ── end-to-end CLI on a temp ROADMAP (rm then gc; --roadmap override, no commit) ──
{
  const dir = mkdtempSync(join(tmpdir(), 'bed-test-'))
  const rm = join(dir, 'ROADMAP.md')
  writeFileSync(rm, FIXTURE)
  const BED = fileURLToPath(new URL('./bed.mjs', import.meta.url))
  execFileSync('node', [BED, 'rm', 'The Mine', '--reason', 'BLOOMED', '--cycle', '110', '--at', 'mine/', '--roadmap', rm], { encoding: 'utf8' })
  let after = readFileSync(rm, 'utf8')
  ok(!after.includes('**The Mine** — a Lode Runner') && tombs(after, 'garden-seeds').some(l => l.includes('The Mine')), 'CLI rm: seed gone, tombstone laid')
  execFileSync('node', [BED, 'gc', '--keep', '5', '--roadmap', rm], { encoding: 'utf8' })
  after = readFileSync(rm, 'utf8')
  ok(!after.includes('giant legacy'), 'CLI gc: legacy comments swept')
  const bed = parseBed(after)
  ok(bed.gardenFuel === 2 && bed.groundsFuel === 1, 'CLI end-to-end: gauge still counts the surviving live seeds')
}

console.log(`${fail ? '✗' : '✓'} bed.test: ${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
