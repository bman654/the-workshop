#!/usr/bin/env node
// ── trim-next — keep NEXT.md a letter, not an archive ────────────────────────
//
// THE PROBLEM THIS SOLVES.
// A handoff file left to agent discipline only ever GROWS. Every maker appends,
// nobody deletes (deleting someone else's note feels rude, and there is never a
// clear moment to do it), and within twenty cycles the "short letter to the next
// maker" is a 3,000-line archive that costs every future maker context and teaches
// them to skim it. This estate already learned this once: NOTES.md blew past the
// Read limit and had to be rescued by a rotation discipline.
//
// So the bound is CODE, not a request. The seal runs this every cycle. A maker
// writes freely at the top of NEXT.md and never thinks about length; the ring is
// enforced behind them. Same idea as ROADMAP's tombstone ring (seedbed/bed.mjs).
//
// THE SHAPE. NEXT.md is:
//   preamble (fixed prose, never touched)
//   <!-- patron:begin --> … <!-- patron:end -->   ← STICKY. Never trimmed. The
//                                                    keeper's standing channel.
//   <!-- letters:begin --> … <!-- letters:end -->  ← the RING, newest first.
//       ### <date> · <maker name>
//       <body>
//
// Two bounds, both hard:
//   • at most KEEP letters (oldest fall off the end — the full text is in git)
//   • at most MAX_LINES lines per letter (a letter is not a worklog entry)
//
// Usage:  node tools/seal/trim-next.mjs [--keep N] [--file PATH] [--check] [--selftest]
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')

const DEFAULT_KEEP = 5
// Per letter, body included. VERY generous on purpose — this is a runaway guard, not
// an editor. It has now bitten two genuine letters (at 24, then at 40), and each time
// it severed a real thought mid-sentence. That is pure loss: the trim runs BEFORE the
// commit, so truncated text is never recorded anywhere. A bound that destroys honest
// work is worse than no bound, so this is set where no sincere handoff letter will
// reach it, and the cut lands on a paragraph break rather than a random line.
const MAX_LINES = 80

const B = '<!-- letters:begin -->'
const E = '<!-- letters:end -->'

export function trim(src, keep = DEFAULT_KEEP) {
  const i = src.indexOf(B)
  const j = src.indexOf(E)
  if (i === -1 || j === -1 || j < i) {
    return { text: src, kept: 0, dropped: 0, capped: 0, ok: false }
  }
  const head = src.slice(0, i + B.length)
  const tail = src.slice(j)
  const mid = src.slice(i + B.length, j)

  // split into letters on the `### ` heading; anything before the first heading is
  // preserved verbatim as ring prose.
  const parts = mid.split(/\n(?=### )/)
  // `.trim()`, not just a trailing strip: the lead is re-joined with explicit newlines
  // below, so leaving its LEADING whitespace intact made every run add two more blank
  // lines — the file drifted forever and `--check` reported stale immediately after a
  // successful trim. Idempotence is the whole point of a bound enforced every cycle.
  const lead = (parts.length && !/^\s*### /.test(parts[0]) ? parts.shift() : '').trim()
  const letters = parts.map((s) => s.replace(/\s+$/, '')).filter((s) => s.trim())

  let capped = 0
  const bounded = letters.map((lt) => {
    const lines = lt.split('\n')
    if (lines.length <= MAX_LINES) return lt
    capped++
    // Cut on a paragraph break, never mid-sentence. Walk back from the ceiling to the
    // nearest blank line (but not past half the letter, or a bullet-dense letter would
    // lose most of itself to one early break).
    let cut = MAX_LINES
    for (let k = MAX_LINES; k > Math.floor(MAX_LINES / 2); k--) {
      if ((lines[k] ?? '').trim() === '') { cut = k; break }
    }
    // NOT "the rest is in this cycle's commit" — it is not. trim-next runs at seal
    // step 4 and the commit is step 5, so the removed lines were never recorded.
    return [...lines.slice(0, cut), '', '*…this letter ran past the ring and was cut here.*'].join('\n')
  })

  const kept = bounded.slice(0, keep)
  const dropped = bounded.length - kept.length

  const body = [lead, ...kept].filter((s) => s && s.trim()).join('\n\n')
  const text = `${head}\n\n${body}\n\n${tail}`
  return { text, kept: kept.length, dropped, capped, ok: true }
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0
  const ok = (c, m) => { if (c) { pass++ } else { fail++; console.error('  FAIL:', m) } }

  const mk = (n) => {
    const ls = []
    for (let k = 1; k <= n; k++) ls.push(`### day${k} · maker${k}\nbody ${k}`)
    return `# Next\n\npre\n\n<!-- patron:begin -->\n## From the Patron\nkeep me\n<!-- patron:end -->\n\n${B}\n\n${ls.join('\n\n')}\n\n${E}\n\ntail\n`
  }

  let r = trim(mk(9), 5)
  ok(r.ok, 'markers found')
  ok(r.kept === 5, `keeps 5, got ${r.kept}`)
  ok(r.dropped === 4, `drops 4, got ${r.dropped}`)
  ok(r.text.includes('day1 · maker1'), 'newest (day1) survives')
  ok(!r.text.includes('day9 · maker9'), 'oldest (day9) falls off')
  ok(r.text.includes('keep me'), 'patron block is never trimmed')
  ok(r.text.includes('# Next') && r.text.includes('tail'), 'preamble + tail preserved')

  r = trim(mk(3), 5)
  ok(r.kept === 3 && r.dropped === 0, 'under the ring is a no-op')

  // idempotence — trimming twice changes nothing
  const once = trim(mk(9), 5).text
  ok(trim(once, 5).text === once, 'idempotent')

  // REGRESSION: a ring that opens with lead prose (e.g. a `## Letters` heading) drifted
  // by two blank lines EVERY run, so --check reported stale right after a good trim.
  // Caught on the real NEXT.md, not by the synthetic cases above.
  const withLead = `# Next\n\n${B}\n\n## Letters\n\n### d1 · m1\nbody\n\n### d2 · m2\nbody\n\n${E}\n`
  const t1 = trim(withLead, 5).text
  const t2 = trim(t1, 5).text
  ok(t1 === t2, 'idempotent when the ring opens with lead prose')
  ok(trim(t2, 5).text === t2, 'still idempotent on a third pass')
  ok(t1.includes('## Letters'), 'lead prose survives the trim')
  ok(!/\n{3,}/.test(t1), 'no blank-line drift accumulates')

  // per-letter line cap
  // must exceed MAX_LINES — derived from it, so raising the ceiling can't silently
  // turn this case into a no-op again (it did, when MAX_LINES went 40 → 80).
  const long = `# Next\n\n${B}\n\n### d · m\n${Array.from({ length: MAX_LINES + 40 }, (_, k) => 'line ' + k).join('\n')}\n\n${E}\n`
  r = trim(long, 5)
  ok(r.capped === 1, 'over-long letter is capped')
  ok(r.text.split('\n').filter((l) => /^line /.test(l)).length <= MAX_LINES, 'cap holds at MAX_LINES')
  ok(!/the rest is in this cycle/.test(r.text), 'no false promise that the cut text was committed')

  // REGRESSION: the cut must land on a paragraph break, not mid-sentence. Both letters
  // this bound has ever touched were severed mid-thought; that is the bug being fixed.
  const paras = []
  for (let k = 0; k < 40; k++) paras.push(`sentence ${k} part one`, `sentence ${k} part two`, '')
  const para = `# Next\n\n${B}\n\n### d · m\n${paras.join('\n')}\n\n${E}\n`
  const pr = trim(para, 5)
  ok(pr.capped === 1, 'paragraph letter is capped')
  const kept = pr.text.split('\n')
  const marker = kept.findIndex((l) => /ran past the ring/.test(l))
  ok(marker > 0, 'cut marker present')
  ok((kept[marker - 1] ?? '').trim() === '', 'the line before the marker is blank — cut on a paragraph break')

  // missing markers must be a safe no-op, never a wipe
  r = trim('# Next\n\nno markers here\n', 5)
  ok(!r.ok && r.text.includes('no markers here'), 'missing markers = safe no-op')

  console.log(`trim-next selftest: ${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}

// ── cli ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const argOf = (f, d) => { const k = argv.indexOf(f); return k !== -1 && argv[k + 1] ? argv[k + 1] : d }
const keep = Math.max(1, parseInt(argOf('--keep', String(DEFAULT_KEEP)), 10) || DEFAULT_KEEP)
const file = resolve(ROOT, argOf('--file', 'NEXT.md'))

if (!existsSync(file)) {
  console.log(`trim-next: ${file} does not exist — nothing to trim`)
  process.exit(0)
}
const src = readFileSync(file, 'utf8')
const r = trim(src, keep)

if (!r.ok) {
  console.error(`trim-next: WARNING — could not find ${B} / ${E} in ${file}; left untouched`)
  process.exit(0) // never fail a seal over a handoff file
}
if (process.argv.includes('--check')) {
  if (r.text !== src) { console.error('trim-next: NEXT.md exceeds its ring'); process.exit(1) }
  console.log('trim-next: NEXT.md within its ring'); process.exit(0)
}
if (r.text !== src) {
  writeFileSync(file, r.text)
  console.log(`trim-next: kept ${r.kept} letter(s), dropped ${r.dropped}, capped ${r.capped} (full text stays in git)`)
} else {
  console.log(`trim-next: ${r.kept} letter(s), already within the ring`)
}
