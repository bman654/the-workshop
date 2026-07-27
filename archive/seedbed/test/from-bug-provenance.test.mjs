// ── from-bug provenance + sticky-tombstone guard — the bug-decomposition path ──
// Proves the two machinery halves the Patron's writ on the bug-to-seed gap demands:
//   (a) a seed sown as a bug-decomposition carries a legible, machine-stamped
//       provenance marker that SURVIVES in its ROADMAP line (left of the sown stamp,
//       preserved by restamp, counted as a normal seed by the gauge), and
//   (b) the bug's origin does NOT silently vanish if those child seeds decay — a
//       STICKY `✝🔒 CONVERTED` tombstone is exempt from FIFO prune, and `unstick`
//       clears it cleanly once the bug is truly fixed.
// Run: node --test seedbed/test/from-bug-provenance.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBatch, insert } from '../sow.mjs'
import { removeByTitle, addTomb, restampByTitle, unstick, isSticky } from '../bed.mjs'
import { parseBed } from '../gauge.mjs'

// A minimal scratch ROADMAP with the fences the test exercises.
const SCRATCH = `# scratch
<!-- gauge:writ:start -->
<!-- gauge:writ:end -->
<!-- gauge:bug:start -->
<!-- gauge:bug:end -->
<!-- gauge:sparks:start -->
<!-- gauge:sparks:end -->
<!-- gauge:grounds-seeds:start -->
<!-- gauge:grounds-seeds:end -->
<!-- gauge:garden-seeds:start -->
### exhibit
### cross
### curation
### rework
### bench
<!-- gauge:garden-seeds:end -->`

const BUG = 'The dial is dead to a real mouse (#140)'

test('(a) --from-bug seeds carry legible provenance that survives & counts normally', () => {
  const batch = `[exhibit] **Mouse-nav fallback** — the dial must accept a plain click.

[engine] **Pointer-event regression guard** — a twin proving nav fires on pointerup.`
  const items = parseBatch(batch)
  const { text } = insert(SCRATCH, items, { cycle: 141, contest: 7, fromBug: BUG })

  const ex = text.split('\n').find(l => l.includes('Mouse-nav fallback'))
  const en = text.split('\n').find(l => l.includes('Pointer-event regression guard'))
  assert.ok(ex && en, 'both seeds were inserted')

  // provenance present on BOTH, AND the sown stamp present on BOTH
  assert.match(ex, /\(from bug: The dial is dead to a real mouse \(#140\)\)/, 'garden seed carries provenance')
  assert.match(ex, /\(sown #141\)/, 'garden seed carries sown stamp')
  assert.match(en, /\(from bug: The dial is dead to a real mouse \(#140\)\)/, 'grounds seed carries provenance')
  assert.match(en, /\(sown #141 · contest #7\)/, 'grounds seed carries contest stamp')

  // the bug tag sits BEFORE the sown stamp (load-bearing ordering)
  assert.ok(ex.indexOf('(from bug:') < ex.indexOf('(sown #'), 'provenance is left of the sown stamp')
  assert.ok(en.indexOf('(from bug:') < en.indexOf('(sown #'), 'provenance is left of the sown stamp (grounds)')

  // restamp preserves the provenance tag (it only rewrites the trailing sown stamp)
  const { after } = restampByTitle(text, { title: 'Mouse-nav fallback', cycle: 160, contest: 9 })
  assert.match(after, /\(from bug: The dial is dead to a real mouse \(#140\)\)/, 'restamp preserves provenance')
  assert.match(after, /\(sown #160\)/, 'restamp refreshed the sown stamp')
  assert.ok(after.indexOf('(from bug:') < after.indexOf('(sown #'), 'provenance still left of sown after restamp')

  // the gauge counts them as ordinary seeds — no miscount, fuel reflects exactly these two
  const bed = parseBed(text)
  assert.equal(bed.gardenFuel, 1, 'one garden seed counted')
  assert.equal(bed.groundsFuel, 1, 'one grounds seed counted')
  assert.equal(bed.bugs, 0, 'no live bug counted (provenance is just text on a garden/grounds line)')
  // stamps read back correctly despite the inserted provenance text
  assert.equal(bed.gardenSeeds[0].sown, 141)
  assert.equal(bed.groundsSeeds[0].sown, 141)
  assert.equal(bed.groundsSeeds[0].contest, 7)
})

test('(b) sticky CONVERTED cairn survives FIFO prune; unstick clears it', () => {
  // start with a live bug, then CONVERT it: remove → sticky tombstone
  let text = SCRATCH.replace('<!-- gauge:bug:start -->\n',
    `<!-- gauge:bug:start -->\n- [bug] **${BUG}** the dial ignores mouse clicks.\n`)
  const conv = removeByTitle(text, { title: BUG, reason: 'CONVERTED', cycle: 142, fence: 'bug', sticky: true, after: 'abc1234' })
  text = conv.text
  assert.ok(isSticky(conv.tombstone), 'CONVERTED tombstone is sticky (✝🔒)')
  assert.match(conv.tombstone, /✝🔒 CONVERTED #142:/, 'sticky tombstone is well-formed')
  assert.equal(parseBed(text).bugs, 0, 'the live bug is gone after conversion')

  // Now pile up MORE than keep normal FIXED bug tombstones. The sticky cairn must NOT
  // be pruned — it is exempt — while the OLD normal ones FIFO-rotate off.
  for (let i = 1; i <= 7; i++) {
    const r = addTomb(text, { fence: 'bug', reason: 'FIXED', cycle: 143 + i, title: `ordinary bug ${i}`, keep: 5 })
    text = r.text
  }
  const bugTombs = text.split('\n').filter(l => l.includes('✝'))
  const stickyTombs = bugTombs.filter(isSticky)
  const normalTombs = bugTombs.filter(l => !isSticky(l))
  assert.equal(stickyTombs.length, 1, 'the sticky CONVERTED cairn SURVIVED the prune (anti-silent-decay proof)')
  assert.match(stickyTombs[0], /CONVERTED #142/, 'and it is exactly our cairn')
  assert.equal(normalTombs.length, 5, 'normal ring still capped at keep=5')
  // the OLDEST normal ones rotated off (1 & 2 gone; 7 newest kept)
  assert.ok(!text.includes('ordinary bug 1'), 'oldest normal tombstone FIFO-pruned')
  assert.ok(!text.includes('ordinary bug 2'), 'second-oldest normal tombstone FIFO-pruned')
  assert.ok(text.includes('ordinary bug 7'), 'newest normal tombstone kept')

  // the bug is truly fixed → unstick clears the cairn cleanly
  const cleared = unstick(text, { title: 'dial is dead', fence: 'bug' })
  text = cleared.text
  assert.ok(!text.includes('✝🔒'), 'no sticky tombstone remains after unstick')
  assert.ok(!text.includes('CONVERTED #142'), 'the CONVERTED cairn is gone')
  // normal ring untouched by unstick
  assert.equal(text.split('\n').filter(l => l.includes('✝')).length, 5, 'normal ring intact after unstick')

  // unstick ambiguity guard
  let text2 = SCRATCH
  for (const t of ['alpha bug', 'beta bug']) {
    const r = removeByTitle(
      text2.replace('<!-- gauge:bug:start -->\n', `<!-- gauge:bug:start -->\n- [bug] **${t}** body.\n`),
      { title: t, reason: 'CONVERTED', cycle: 150, fence: 'bug', sticky: true })
    text2 = r.text
  }
  assert.throws(() => unstick(text2, { title: 'bug', fence: 'bug' }), /ambiguous/, 'unstick refuses an ambiguous title')
})
