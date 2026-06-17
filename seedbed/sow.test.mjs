#!/usr/bin/env node
// ── Node twin for sow.mjs — routing · stamping · insertion, on a FIXTURE ───────
// Never touches the real ROADMAP: builds a tiny in-memory ROADMAP with all four
// fences + the garden subsections, and proves the gauge would count the result.
import { parseBatch, route, stamp, insert } from './sow.mjs'
import { parseBed } from './gauge.mjs'
import { execFileSync } from 'node:child_process'
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

let pass = 0, fail = 0
const ok = (c, m) => { if (c) pass++; else { fail++; console.error(`  ✗ ${m}`) } }
const eq = (a, b, m) => ok(a === b, `${m} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`)

const FIXTURE = `# ROADMAP
<!-- gauge:bug:start -->
<!-- gauge:bug:end -->

<!-- gauge:sparks:start -->
- ⚡ **An existing spark** — already here.
<!-- gauge:sparks:end -->

<!-- gauge:grounds-seeds:start -->
- [room] **An existing grounds seed** — already here. (sown #50 · contest #4)
<!-- gauge:grounds-seeds:end -->

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **An existing exhibit** — already here. (sown #50)
### cross
### curation
### rework
### bench
<!-- gauge:garden-seeds:end -->
`

// ── routing ──
eq(route('exhibit').fence, 'garden-seeds', 'exhibit → garden fence')
eq(route('exhibit').sub, 'exhibit', 'exhibit → exhibit subsection')
eq(route('curate').sub, 'curation', 'curate → curation subsection')
eq(route('curation').sub, 'curation', 'curation alias → curation subsection')
eq(route('bench').sub, 'bench', 'bench → bench subsection')
eq(route('room').fence, 'grounds-seeds', 'room → grounds fence')
eq(route('engine').stamp, 'contest', 'grounds seeds get a contest stamp')
eq(route('exhibit').stamp, 'sown', 'garden seeds get a sown stamp')
eq(route('bug').fence, 'bug', 'bug → bug fence')
eq(route('bug').stamp, null, 'bug is never stamped')
eq(route('spark').fence, 'sparks', 'spark → sparks fence')
eq(route('spark').stamp, null, 'spark is never stamped')
eq(route('nonsense'), null, 'unknown kind → null route')

// ── parsing ──
const items = parseBatch(`# a comment block — skipped

[exhibit] **Alpha** — body one.

- [cross] **Beta** — already bulleted.

[bug] **Gamma broke.**
Wrapped onto a second line that should fold in.

⚡ **Delta** — a raw spark.

[spark] **Epsilon** — a tagged spark.`)
eq(items.length, 5, 'five items parsed (comment skipped)')
eq(items[0].kind, 'exhibit', 'item 0 kind')
eq(items[0].title, 'Alpha', 'item 0 title from **bold**')
eq(items[1].line, '- [cross] **Beta** — already bulleted.', 'pre-existing bullet not doubled')
ok(items[2].line.includes('fold in.') && !items[2].line.includes('\n'), 'multi-line bug folds to one line')
eq(items[3].line, '- ⚡ **Delta** — a raw spark.', '⚡ spark normalized')
eq(items[4].line, '- ⚡ **Epsilon** — a tagged spark.', '[spark] tag → ⚡')

// ── stamping (idempotent) ──
eq(stamp('- [exhibit] **X** — y.', 'exhibit', 105, 8), '- [exhibit] **X** — y. (sown #105)', 'garden stamp appended')
eq(stamp('- [room] **X** — y.', 'room', 105, 8), '- [room] **X** — y. (sown #105 · contest #8)', 'grounds stamp appended')
eq(stamp('- [exhibit] **X** — y. (sown #99)', 'exhibit', 105, 8), '- [exhibit] **X** — y. (sown #99)', 'existing stamp left alone')
eq(stamp('- [bug] **X broke.**', 'bug', 105, 8), '- [bug] **X broke.**', 'bug not stamped')
eq(stamp('- ⚡ **X** — y.', 'spark', 105, 8), '- ⚡ **X** — y.', 'spark not stamped')

// ── insertion: one of each, into a fixture ──
const batch = `[exhibit] **New Exhibit** — fresh.

[cross] **New Cross** — links a×b.

[room] **New Room** — a wing.

[bug] **A new bug.** broke.

⚡ **A new spark** — raw.`
const { text } = insert(FIXTURE, parseBatch(batch), { cycle: 105, contest: 8 })

// the gauge must now COUNT every insertion in the right place
const bed = parseBed(text)
eq(bed.bugs, 1, 'gauge counts the new bug')
eq(bed.sparks, 2, 'gauge counts existing + new spark')
eq(bed.groundsFuel, 2, 'gauge counts existing + new grounds seed')
eq(bed.gardenFuel, 3, 'gauge counts existing exhibit + new exhibit + new cross')
ok(text.includes('**New Exhibit** — fresh. (sown #105)'), 'new exhibit stamped')
ok(text.includes('**New Cross** — links a×b. (sown #105)'), 'new cross stamped')
ok(text.includes('**New Room** — a wing. (sown #105 · contest #8)'), 'new room stamped with contest')
ok(text.includes('- [bug] **A new bug.** broke.\n'), 'new bug inserted unstamped')
// new cross sits under ### cross, not ### exhibit
const lines = text.split('\n')
const crossIdx = lines.findIndex(l => l.trim() === '### cross')
const newCrossIdx = lines.findIndex(l => l.includes('**New Cross**'))
const curationIdx = lines.findIndex(l => l.trim() === '### curation')
ok(crossIdx < newCrossIdx && newCrossIdx < curationIdx, 'new cross filed under ### cross')

// no-stamp mode
const { text: nostampText } = insert(FIXTURE, parseBatch('[exhibit] **Bare** — no stamp.'), { noStamp: true })
ok(nostampText.includes('**Bare** — no stamp.\n') && !nostampText.includes('**Bare** — no stamp. (sown'), 'no-stamp leaves the seed bare')

// ── end-to-end CLI on a temp ROADMAP (no commit; --roadmap override) ──
const dir = mkdtempSync(join(tmpdir(), 'sow-test-'))
const rm = join(dir, 'ROADMAP.md')
writeFileSync(rm, FIXTURE)
const SOW = fileURLToPath(new URL('./sow.mjs', import.meta.url))
execFileSync('node', [SOW, '--roadmap', rm, '--cycle', '105', '--contest', '8', '-'], { input: batch, encoding: 'utf8' })
const after = readFileSync(rm, 'utf8')
const bed2 = parseBed(after)
ok(bed2.bugs === 1 && bed2.sparks === 2 && bed2.groundsFuel === 2 && bed2.gardenFuel === 3, 'CLI end-to-end: gauge counts all insertions')

console.log(`${fail ? '✗' : '✓'} sow.test: ${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
