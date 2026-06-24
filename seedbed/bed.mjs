#!/usr/bin/env node
// ── bed — the ROADMAP CRUD console ────────────────────────────────────────────
// ROADMAP.md is a CATEGORIZED LIST OF TASKS (the gauge's fenced seedbed). Like every
// other structured file in the estate (state.json ← gauge.mjs · the ledger ←
// collate.sh · ROADMAP *adds* ← sow.mjs), it should be mutated by CODE, never by
// freehand edits — freehand is where the fences drift (mis-numbered notes, two
// comments merged, prose bloat). `bed` is that code: the in-cycle publisher (and
// the keeper) do EVERY ROADMAP change through it.
//
// THE TOMBSTONE RING — the heart of the cleanup. When a seed leaves a fence
// (bloomed / decayed / a writ served / a bug fixed), `bed rm` doesn't erase it: it
// drops a ONE-LINE tombstone into that fence's ring and FIFO-prunes the ring to the
// last N. That gives makers a SHORT MEMORY of what went before — read right where
// they pick the next task (continuity of vision) — while keeping the file SMALL.
// The script CAPS the tombstone (one word reason + a truncated title + a hint) so a
// short task can't bloat into an essay; the FULL story lives in the worklog/CHANGELOG.
//
// THE BREADCRUMB. Each tombstone carries `· after <hash>` — the git HEAD at removal
// time. The change itself lands in the NEXT commit, so an agent who needs the detail
// runs e.g. `git log <hash>..HEAD -- ROADMAP.md` (or reads the commit just after
// <hash>) to find the worklog entry that explains it.
//
//   <!-- ✝ BLOOMED #108: The Slingshot → aerodrome/slingshot/ · after e4f0ea4 -->
//
// THE WRIT EXCEPTION — keep=0, no memory by design. The `writ` fence is the one ring
// that keeps NOTHING. A served writ leaves NO tombstone, because the whole point of a
// writ RELEASE is that the seed enters the pool *unmarked* — an equal, never the
// Patron's command. A lingering "✝ SERVED #N: <seed>" would tell a future maker "this
// came from the Patron" and bias the pick (it did, once). So `FENCE_KEEP` pins the
// writ ring to 0 as a HARD ceiling that `--keep` cannot raise: a writ removed via
// `bed rm` vanishes cleanly, leaving no thread back to its origin in the file.
//
// ── SUBCOMMANDS ───────────────────────────────────────────────────────────────
//   bed sow <batch>                         add seeds/bugs/writs (→ sow.mjs, no commit)
//   bed rm "<title>" --reason <WORD>        remove a live seed → tombstone (FIFO ≤N)
//       [--fence <f>] [--cycle N] [--at <hint>] [--keep N]
//   bed restamp "<title>" [--cycle N]       refresh a decaying seed's (sown #N) stamp
//   bed tomb --fence <f> --reason <WORD>     add a bare tombstone (no seed removed)
//       --cycle N --title "<t>" [--at <hint>] [--keep N]
//   bed gc [--keep N]                       normalize every fence: drop legacy/narrative
//                                           comments, trim each canonical ring to ≤N
//   bed unstick "<bug title>" [--fence bug] clear a STICKY tombstone (the bug is truly
//                                           fixed — all its child seeds bloomed)
//
// STICKY TOMBSTONES — the bug-decomposition guard. When a [bug] too big for one cycle is
// decomposed into required-fix SEEDS (sown with `sow --from-bug`), drop a STICKY vestige
// for the bug: `bed rm "<bug>" --reason CONVERTED --fence bug --sticky`. A sticky tombstone
// (`✝🔒`) is EXEMPT from FIFO prune — it can never silently rotate off the ring while a
// child seed has decayed without the bug being fixed. A later director who sees `✝🔒
// CONVERTED` in the bug fence knows an unfinished fix may have lost a piece; they re-open it
// with `git log <hash>..HEAD -- ROADMAP.md`. When ALL children bloom, `bed unstick "<bug>"`.
// Common: --reason is ONE WORD (SERVED·BLOOMED·DECAYED·PRUNED·MERGED·FIXED·RELEASED·CONVERTED).
//   bed edits ROADMAP.md and does NOT commit (the cycle's publisher commits once at
//   the end; the keeper commits by hand). Pass --roadmap <path> to operate on a fixture.
//
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { route, stamp, fenceBounds } from './sow.mjs'

const REPO = fileURLToPath(new URL('..', import.meta.url))
const DEFAULT_ROADMAP = fileURLToPath(new URL('../ROADMAP.md', import.meta.url))
const SOW = fileURLToPath(new URL('./sow.mjs', import.meta.url))

export const FENCES = ['writ', 'bug', 'sparks', 'grounds-seeds', 'foundry-seeds', 'garden-seeds']
export const DEFAULT_KEEP = 5
// Per-fence HARD ceiling on the tombstone ring. A fence here can keep AT MOST this
// many tombstones no matter what --keep asks. writ:0 means a served writ leaves no
// trace in the file (see "THE WRIT EXCEPTION" above) — its providence must never
// reach a future maker. Absent a fence ⇒ no ceiling (the requested keep stands).
export const FENCE_KEEP = { writ: 0 }
// the effective ring size for a fence: the smaller of what's asked and the hard cap.
export function keepFor(fence, requested = DEFAULT_KEEP) {
  const cap = FENCE_KEEP[fence]
  return cap == null ? requested : Math.min(requested, cap)
}
const MAX_TITLE = 72
const MAX_HINT = 48
// the canonical one-line tombstone; we only need reason + cycle to manage the ring.
// matches BOTH the normal `✝` form and the STICKY `✝🔒` form (the 🔒 is optional here).
const TOMB_RE = /^<!--\s*✝(?:🔒)?\s+(\S+)\s+#(\d+):/u
// a STICKY tombstone (lock glyph right after the cross) is EXEMPT from FIFO prune.
export function isSticky(line) { return /^<!--\s*✝🔒/u.test(String(line).trim()) }

// ── Tombstone construction ─────────────────────────────────────────────────────
function oneWord(reason) {
  const r = String(reason || '').trim()
  if (!r || /\s/.test(r)) throw new Error(`--reason must be ONE word (got "${reason}") — e.g. SERVED / BLOOMED / DECAYED`)
  return r.toUpperCase()
}
function clamp(s, n) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t
}
export function makeTomb(reason, cycle, title, hint, after, sticky = false) {
  const r = String(reason).trim().split(/\s+/)[0].toUpperCase() // defensive: first word
  const t = clamp(title, MAX_TITLE)
  const tail = [hint ? `→ ${clamp(hint, MAX_HINT)}` : '', after ? `· after ${after}` : ''].filter(Boolean).join(' ')
  const cross = sticky ? '✝🔒' : '✝'
  return `<!-- ${cross} ${r} #${cycle}: ${t}${tail ? ' ' + tail : ''} -->`
}

// ── Locating live seeds + tombstones inside the fences ─────────────────────────
function liveBullet(line) {
  const t = line.trim()
  return t.startsWith('- ') && !t.startsWith('<!--')
}
// the unique LIVE seed line whose **bold title** == needle (exact), else whose text
// contains it (substring). Optionally restrict to one fence. Returns [indices].
function findLive(lines, needle, fence) {
  const want = String(needle).trim()
  let lo = 0, hi = lines.length
  if (fence) { const b = fenceBounds(lines, fence); lo = b.start; hi = b.end }
  const exact = [], loose = []
  for (let i = 0; i < lines.length; i++) {
    if (fence && (i <= lo || i >= hi)) continue
    if (!liveBullet(lines[i])) continue
    const bold = lines[i].match(/\*\*(.+?)\*\*/)
    if (bold && bold[1].trim() === want) exact.push(i)
    else if (lines[i].includes(want)) loose.push(i)
  }
  return exact.length ? exact : loose
}
function fenceOf(lines, idx) {
  for (const f of FENCES) {
    let b; try { b = fenceBounds(lines, f) } catch { continue }
    if (idx > b.start && idx < b.end) return f
  }
  return null
}
function tombIndices(lines, fence) {
  const b = fenceBounds(lines, fence)
  const out = []
  for (let i = b.start + 1; i < b.end; i++) if (TOMB_RE.test(lines[i].trim())) out.push(i)
  return out
}
// insert a tombstone just above the fence's :end, then FIFO-prune oldest beyond keep.
// STICKY tombstones (`✝🔒`) are NEVER prunable — `keep` bounds only the NORMAL ring; the
// sticky cairns sit alongside it untouched, so a bug-decomposition vestige can't rotate off.
function placeTomb(lines, fence, tomb, keep) {
  const b = fenceBounds(lines, fence)
  lines.splice(b.end, 0, tomb)                 // newest sits just above :end
  let idxs = tombIndices(lines, fence)
  let prunable = idxs.filter(i => !isSticky(lines[i]))
  while (prunable.length > keep) {             // drop oldest NORMAL (topmost) — never sticky
    lines.splice(prunable[0], 1)
    idxs = tombIndices(lines, fence)
    prunable = idxs.filter(i => !isSticky(lines[i]))
  }
}

// ── PURE op: remove a live seed by title, leaving a FIFO tombstone ─────────────
export function removeByTitle(text, { title, reason, cycle, hint, after, keep = DEFAULT_KEEP, fence, sticky = false } = {}) {
  const lines = text.split('\n')
  const hits = findLive(lines, title, fence)
  if (hits.length === 0) throw new Error(`no live seed matching "${title}"${fence ? ` in the ${fence} fence` : ''}`)
  if (hits.length > 1) throw new Error(`"${title}" is ambiguous (${hits.length} live seeds match) — pass --fence or a more exact title`)
  const idx = hits[0]
  const removedLine = lines[idx]
  const fen = fence || fenceOf(lines, idx)
  if (!fen) throw new Error('the matched seed is not inside a gauge fence')
  lines.splice(idx, 1)
  const k = keepFor(fen, keep)
  if (k <= 0) return { text: lines.join('\n'), removedLine, tombstone: null, fence: fen } // no-memory fence (writ): vanish cleanly
  const tomb = makeTomb(reason, cycle, title, hint, after, sticky)
  placeTomb(lines, fen, tomb, k)
  return { text: lines.join('\n'), removedLine, tombstone: tomb, fence: fen }
}

// ── PURE op: add a bare tombstone (no seed removed) ────────────────────────────
export function addTomb(text, { fence, reason, cycle, title, hint, after, keep = DEFAULT_KEEP, sticky = false } = {}) {
  const lines = text.split('\n')
  fenceBounds(lines, fence) // validates the fence exists
  const k = keepFor(fence, keep)
  if (k <= 0) return { text: lines.join('\n'), tombstone: null, fence } // no-memory fence (writ): refuse to inscribe
  const tomb = makeTomb(reason, cycle, title, hint, after, sticky)
  placeTomb(lines, fence, tomb, k)
  return { text: lines.join('\n'), tombstone: tomb, fence }
}

// ── PURE op: refresh a decaying seed's stamp ───────────────────────────────────
export function restampByTitle(text, { title, cycle, contest, fence } = {}) {
  const lines = text.split('\n')
  const hits = findLive(lines, title, fence)
  if (hits.length === 0) throw new Error(`no live seed matching "${title}"`)
  if (hits.length > 1) throw new Error(`"${title}" is ambiguous (${hits.length} live seeds) — pass --fence or a more exact title`)
  const idx = hits[0]
  const before = lines[idx]
  const km = before.match(/\[([a-z]+)\]/i)
  const kind = km ? km[1].toLowerCase() : (before.includes('⚡') ? 'spark' : null)
  const bare = before.replace(/\s*\(sown\s*#\d+(?:\s*·\s*contest\s*#\d+)?\)\s*$/, '')
  const after = stamp(bare, kind, cycle, contest)
  lines[idx] = after
  return { text: lines.join('\n'), before, after }
}

// ── PURE op: unstick — clear a STICKY tombstone (the bug is truly fixed) ────────
// Finds the sticky tombstone whose title substring matches `title` and removes it.
// On >1 match, errors (mirror removeByTitle's ambiguity guard). Called when every
// child seed of a decomposed bug has bloomed, so the safety-net cairn can retire.
export function unstick(text, { title, fence = 'bug' } = {}) {
  const lines = text.split('\n')
  const want = String(title).trim()
  const hits = tombIndices(lines, fence).filter(i => isSticky(lines[i]) && lines[i].includes(want))
  if (hits.length === 0) throw new Error(`no sticky tombstone matching "${title}" in the ${fence} fence`)
  if (hits.length > 1) throw new Error(`"${title}" is ambiguous (${hits.length} sticky tombstones match) — pass a more exact title`)
  const removed = lines[hits[0]]
  lines.splice(hits[0], 1)
  return { text: lines.join('\n'), removed, fence }
}

// ── PURE op: gc — normalize every fence ────────────────────────────────────────
// Drops legacy / narrative comments (their provenance lives in the worklog) and
// trims each fence's canonical ✝ ring to the newest ≤keep. One-time migration AND
// a defensive recurring sweep. Live seeds + fence markers + ### headings are kept.
export function gc(text, { keep = DEFAULT_KEEP } = {}) {
  const lines = text.split('\n')
  const report = []
  for (const fence of FENCES) {
    let b; try { b = fenceBounds(lines, fence) } catch { continue }
    const canon = []      // {cycle, line} — NORMAL tombstones (sliced to keep)
    const sticky = []     // {cycle, line} — STICKY tombstones (always kept, never sliced)
    const drop = []       // indices to remove (legacy/narrative comments)
    for (let i = b.start + 1; i < b.end; i++) {
      const t = lines[i].trim()
      if (!t.startsWith('<!--')) continue        // live seed / heading / blank — keep
      const m = t.match(TOMB_RE)
      if (m) (isSticky(lines[i]) ? sticky : canon).push({ cycle: Number(m[2]), line: lines[i] })
      drop.push(i)                                // legacy + canon + sticky are all re-laid below
    }
    if (!drop.length) { report.push({ fence, keptCanon: 0, droppedLegacy: 0 }); continue }
    const k = keepFor(fence, keep)
    const keptCanon = k <= 0 ? [] : canon.sort((a, c) => a.cycle - c.cycle).slice(-k)
    const keptSticky = sticky.sort((a, c) => a.cycle - c.cycle)   // sticky cairns: kept unconditionally
    const relay = [...keptSticky, ...keptCanon].sort((a, c) => a.cycle - c.cycle)
    for (const i of drop.slice().sort((a, c) => c - a)) lines.splice(i, 1) // remove bottom-up
    const b2 = fenceBounds(lines, fence)
    lines.splice(b2.end, 0, ...relay.map(k => k.line))  // re-lay kept canon + sticky, chronological
    report.push({ fence, keptCanon: keptCanon.length, keptSticky: keptSticky.length, droppedLegacy: drop.length - canon.length - sticky.length, droppedCanon: canon.length - keptCanon.length })
  }
  return { text: lines.join('\n'), report }
}

// ── git helpers ────────────────────────────────────────────────────────────────
function gitHead() {
  try { return execFileSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim() } catch { return '' }
}

// ── CLI ─────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const o = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--reason') o.reason = argv[++i]
    else if (a === '--fence') o.fence = argv[++i]
    else if (a === '--cycle') o.cycle = Number(argv[++i])
    else if (a === '--contest') o.contest = Number(argv[++i])
    else if (a === '--at' || a === '--hint') o.hint = argv[++i]
    else if (a === '--title') o.title = argv[++i]
    else if (a === '--keep') o.keep = Number(argv[++i])
    else if (a === '--after') o.after = argv[++i]
    else if (a === '--roadmap') o.roadmap = argv[++i]
    else if (a === '--sticky') o.sticky = true
    else if (a === '--help' || a === '-h') o.help = true
    else o._.push(a)
  }
  return o
}
function helpText() {
  const header = []
  for (const l of readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n')) {
    if (l.startsWith('//')) header.push(l.replace(/^\/\/ ?/, ''))
    else if (header.length) break
  }
  return header.join('\n')
}
async function liveCycle(roadmapText) {
  try {
    const g = await import('./gauge.mjs')
    const d = g.decide(g.loadState(), g.parseBed(roadmapText))
    return { cycle: d.gauges.currentCycle, contest: g.loadState().bigSwingsBuilt }
  } catch { return { cycle: undefined, contest: undefined } }
}

async function main() {
  const o = parseArgs(process.argv.slice(2))
  const cmd = o._[0]
  if (o.help || !cmd) { console.log(helpText()); process.exit(o.help ? 0 : 2) }

  // `sow` is a thin passthrough to sow.mjs, forced --no-commit (the publisher commits once).
  if (cmd === 'sow') {
    const rest = process.argv.slice(process.argv.indexOf('sow') + 1)
    execFileSync('node', [SOW, '--no-commit', ...rest], { stdio: 'inherit' })
    return
  }

  const roadmapPath = o.roadmap || DEFAULT_ROADMAP
  const text = readFileSync(roadmapPath, 'utf8')
  const keep = o.keep != null ? o.keep : DEFAULT_KEEP
  const after = o.after != null ? o.after : (o.roadmap ? '' : gitHead())
  let cycle = o.cycle, contest = o.contest
  if (cycle == null && (cmd === 'rm' || cmd === 'restamp' || cmd === 'tomb')) {
    const live = await liveCycle(text); cycle = live.cycle; if (contest == null) contest = live.contest
  }

  let result, out
  if (cmd === 'rm') {
    const title = o.title || o._[1]
    if (!title) throw new Error('rm needs a title:  bed rm "<title>" --reason <WORD>')
    result = removeByTitle(text, { title, reason: oneWord(o.reason), cycle, hint: o.hint, after, keep, fence: o.fence, sticky: o.sticky })
    out = result.tombstone
      ? `🪦 ${result.fence}: removed "${title}" → ${result.tombstone}`
      : `🧽 ${result.fence}: removed "${title}" cleanly — no tombstone (${result.fence} keeps no memory; providence stays out of the file)`
  } else if (cmd === 'tomb') {
    if (!o.fence || !o.title) throw new Error('tomb needs --fence and --title')
    result = addTomb(text, { fence: o.fence, reason: oneWord(o.reason), cycle, title: o.title, hint: o.hint, after, keep, sticky: o.sticky })
    out = result.tombstone
      ? `🪦 ${result.fence}: ${result.tombstone}`
      : `🧽 ${result.fence}: keeps no memory (keep=0) — nothing inscribed`
  } else if (cmd === 'restamp') {
    const title = o.title || o._[1]
    if (!title) throw new Error('restamp needs a title')
    result = restampByTitle(text, { title, cycle, contest, fence: o.fence })
    out = `♻  restamped "${title}":\n   ${result.before.trim()}\n → ${result.after.trim()}`
  } else if (cmd === 'gc') {
    result = gc(text, { keep })
    out = '🧹 gc — normalized fences:\n' + result.report.map(r => `   ${r.fence}: kept ${r.keptCanon} canon${r.keptSticky ? ` + ${r.keptSticky} sticky` : ''}, dropped ${r.droppedLegacy} legacy${r.droppedCanon ? ` + ${r.droppedCanon} over-ring` : ''}`).join('\n')
  } else if (cmd === 'unstick') {
    const title = o.title || o._[1]
    if (!title) throw new Error('unstick needs a title:  bed unstick "<bug title>" [--fence bug]')
    result = unstick(text, { title, fence: o.fence || 'bug' })
    out = `🔓 ${result.fence}: cleared sticky tombstone → ${result.removed.trim()}`
  } else {
    throw new Error(`unknown subcommand "${cmd}" — try: sow | rm | restamp | tomb | gc | unstick  (--help)`)
  }

  writeFileSync(roadmapPath, result.text)
  console.log(out)
  console.log(`✏  wrote ${roadmapPath}${o.roadmap ? '' : '  (uncommitted — the publisher commits the cycle)'}`)
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(`✖ ${e.message}`); process.exit(1) })
