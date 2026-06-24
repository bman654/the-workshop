#!/usr/bin/env node
// ── sow — inject a collection of seeds/bugs into ROADMAP.md as ONE commit ──────
// A console for the estate's keeper (Brandon, or a director acting out-of-band):
// hand it a batch of seeds/sparks/bugs and it files each into the correct gauge
// fence, auto-stamps them so the gauge can age them, and lands the whole batch in
// a SINGLE commit — no more merging a PR per idea.
//
// It is surgical on purpose: it stages ONLY ROADMAP.md, so a running fun-forever
// cycle's half-built files are never swept in. It refuses to commit while the repo
// is mid-rebase/merge or on a detached HEAD (a publisher could be rebasing). The
// commit is LOCAL — the loop's next publisher push carries it up to origin (the
// proven "they pull on push-reject" flow); pass --push only if you want it now.
//
// ── BATCH FORMAT ──────────────────────────────────────────────────────────────
//   • One ITEM per block; blocks are separated by a blank line.
//   • A block's lines are joined with single spaces (write a long bug across
//     several lines if you like — they fold into one ROADMAP line).
//   • Each block must LEAD with its kind:  [writ] (the Patron — top priority)  ·
//     [exhibit] / [cross] / [curate] / [rework] / [bench]   (garden)   ·   [room] /
//     [engine] / [metagame] / [map] / [medium] / [wing]   (grounds)   ·   [rep] / [gate]
//     (foundry — front-gate upkeep)   ·   [bug]   ·   ⚡  or  [spark]   (spark).
//   • A leading "- " is optional (added if absent). A block whose first line
//     starts with "#" is a comment and is skipped.
//   • A stamp is added if you didn't write one. Garden→"(sown #N)", grounds &
//     foundry→"(sown #N · contest #M)" (grounds' contest = bigSwingsBuilt, foundry's
//     = foundryBuilt); writs, bugs & sparks are never stamped.
//   • A [writ] may carry "AUTHORIZES: <one outside action> — the steward only".
//
//   Example batch file:
//     [exhibit] **The Rattleback** — a top with one allowed spin. Flip it; it
//     refuses, shudders, and reverses — chirality you feel in your hand.
//
//     [bug] **Foo overflows on mobile.** At ≤390px the pill spills off-screen.
//
//     ⚡ **A medium the estate lacks** — what isn't here yet?
//
// ── USAGE ─────────────────────────────────────────────────────────────────────
//   node seedbed/sow.mjs <batchfile>          file → stamp → insert → commit
//   node seedbed/sow.mjs -                     read the batch from stdin
//   node seedbed/sow.mjs --dry-run <file>      print the plan; touch nothing
//   node seedbed/sow.mjs --no-commit <file>    edit ROADMAP.md but don't commit
//   node seedbed/sow.mjs --push <file>         also push after committing
//   node seedbed/sow.mjs --cycle N <file>      override the (sown #N) stamp
//   node seedbed/sow.mjs --contest M <file>    override the grounds · contest #M stamp
//   node seedbed/sow.mjs --foundry-contest M <file>  override the foundry · contest #M stamp
//   node seedbed/sow.mjs --no-stamp <file>     don't auto-stamp
//   node seedbed/sow.mjs --message "…" <file>  override the commit message
//   node seedbed/sow.mjs --roadmap <path>      operate on a different ROADMAP (tests)
//   node seedbed/sow.mjs --from-bug "<origin>" <file>
//        tag each seed with provenance: " (from bug: <origin>)" sits left of the
//        (sown #N) stamp. Use when a [bug] too big for one cycle is decomposed into
//        required-fix SEEDS — the tag carries the bug's origin so a later director
//        can trace a decayed child back to the unfixed bug (see director.md).

import { readFileSync, writeFileSync, existsSync, readSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('..', import.meta.url))
const DEFAULT_ROADMAP = fileURLToPath(new URL('../ROADMAP.md', import.meta.url))

// ── Routing: a kind → the gauge fence (and garden subsection) it belongs in ────
// The gauge counts a seed by which FENCE it physically sits in, so routing here
// must match ROADMAP's real layout, not gauge.classify() (which is a separate
// utility). Garden seeds live under "### <sub>" headings inside the garden fence.
const GARDEN_SUB = { exhibit: 'exhibit', cross: 'cross', curate: 'curation', curation: 'curation', rework: 'rework', bench: 'bench', grow: 'exhibit' }
const GROUNDS_KINDS = new Set(['room', 'engine', 'metagame', 'map', 'medium', 'wing'])
const FOUNDRY_KINDS = new Set(['rep', 'gate']) // rep = a bespoke front-gate room-rep · gate = a gate asset rework/polish

export function route(kind) {
  const k = String(kind || '').toLowerCase().trim()
  if (k === 'writ') return { fence: 'writ', stamp: null }      // the Patron's request — top priority, unstamped (never decays)
  if (k === 'spark') return { fence: 'sparks', stamp: null, spark: true }
  if (k === 'bug') return { fence: 'bug', stamp: null }
  if (k in GARDEN_SUB) return { fence: 'garden-seeds', sub: GARDEN_SUB[k], stamp: 'sown' }
  if (GROUNDS_KINDS.has(k)) return { fence: 'grounds-seeds', stamp: 'contest', contestSource: 'grounds' }
  // foundry seeds use the SAME (sown #N · contest #M) stamp shape as grounds, but their contest #M is the
  // foundryBuilt counter (not bigSwingsBuilt) — so the gauge's foundry decay clock reads them correctly.
  if (FOUNDRY_KINDS.has(k)) return { fence: 'foundry-seeds', stamp: 'contest', contestSource: 'foundry' }
  return null
}

// ── Parse a batch into items ───────────────────────────────────────────────────
// Blocks split on blank lines; each block folds to one line; the kind is read off
// the lead. Returns { kind, route, title, line } (line is pre-stamp, "- "-led).
export function parseBatch(text) {
  const items = []
  const blocks = String(text).split(/\r?\n[ \t]*\r?\n/)
  for (const raw of blocks) {
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    if (!lines.length) continue
    if (lines[0].startsWith('#')) continue // comment block
    let body = lines.join(' ').replace(/^-\s+/, '') // fold + strip any leading bullet
    let kind, line
    if (body.startsWith('⚡')) { kind = 'spark'; line = `- ${body}` }
    else if (/^\[spark\]/i.test(body)) { kind = 'spark'; line = `- ⚡ ${body.replace(/^\[spark\]\s*/i, '')}` }
    else {
      const m = body.match(/^\[([^\]]+)\]/)
      if (!m) throw new Error(`item does not start with a [kind] or ⚡:\n    ${body.slice(0, 80)}`)
      kind = m[1].toLowerCase().trim()
      line = `- ${body}`
    }
    const r = route(kind)
    if (!r) throw new Error(`unknown kind "[${kind}]". Valid: writ / ${[...Object.keys(GARDEN_SUB), ...GROUNDS_KINDS, ...FOUNDRY_KINDS, 'bug', 'spark'].join(' / ')}`)
    const tm = body.match(/\*\*(.+?)\*\*/)
    items.push({ kind, route: r, title: tm ? tm[1].trim() : body.replace(/^\[[^\]]+\]\s*/, '').slice(0, 50), line })
  }
  return items
}

// ── Stamp a seed line (idempotent — leaves an existing stamp alone) ────────────
export function stamp(line, kind, cycle, contest) {
  const r = route(kind)
  if (!r || r.stamp == null) return line // bug / spark: never stamped
  if (/\(sown\s*#\d+/.test(line)) return line // already stamped
  return r.stamp === 'contest' ? `${line} (sown #${cycle} · contest #${contest})` : `${line} (sown #${cycle})`
}

// ── Locate fence + subsection anchors in ROADMAP, and splice items in ──────────
export function fenceBounds(lines, fence) {
  const start = lines.findIndex(l => l.includes(`gauge:${fence}:start`))
  const end = lines.findIndex(l => l.includes(`gauge:${fence}:end`))
  if (start < 0 || end < 0) throw new Error(`ROADMAP is missing the gauge:${fence} fence`)
  return { start, end }
}
// The line index to insert AFTER for a given route.
function anchorFor(lines, r) {
  const { start, end } = fenceBounds(lines, r.fence)
  if (!r.sub) return start // grounds / bug / sparks: right after the fence-start marker
  for (let i = start + 1; i < end; i++) {
    if (lines[i].trim().toLowerCase() === `### ${r.sub}`) return i // after the subsection heading
  }
  throw new Error(`garden fence is missing the "### ${r.sub}" subsection`)
}

// PURE: text + stamped items → new text. Groups items by anchor, inserts each
// group as one ordered block, applies bottom-up so earlier splices don't shift
// later anchors. Returns { text, plan:[{anchorLabel, lines}] }.
export function insert(roadmapText, items, { cycle, contest, foundryContest, noStamp, fromBug } = {}) {
  const lines = roadmapText.split('\n')
  const groups = new Map() // anchorIdx → { label, lines:[] }
  for (const it of items) {
    const idx = anchorFor(lines, it.route)
    // Provenance tag (if any) is woven in BEFORE the (sown #N) stamp — this ordering
    // is LOAD-BEARING: the tag must sit LEFT of the trailing stamp so restamp's
    // trailing-stamp regex leaves it intact and the gauge still counts the seed.
    const clean = fromBug ? `${it.line} (from bug: ${String(fromBug).replace(/\s+/g, ' ').trim().slice(0, 48)})` : it.line
    // foundry seeds stamp their contest from foundryBuilt; grounds (and the default) from bigSwingsBuilt.
    const itemContest = it.route.contestSource === 'foundry' ? foundryContest : contest
    const out = noStamp ? clean : stamp(clean, it.kind, cycle, itemContest)
    const label = it.route.sub ? `${it.route.fence} › ${it.route.sub}` : it.route.fence
    if (!groups.has(idx)) groups.set(idx, { label, lines: [] })
    groups.get(idx).lines.push(out)
  }
  const plan = [...groups.entries()].map(([idx, g]) => ({ anchorLabel: g.label, lines: g.lines }))
  for (const [idx, g] of [...groups.entries()].sort((a, b) => b[0] - a[0])) {
    lines.splice(idx + 1, 0, ...g.lines)
  }
  return { text: lines.join('\n'), plan }
}

// ── Stamp values: ask the gauge what cycle/contest we're sowing into ───────────
async function liveStamps(roadmapText) {
  const g = await import('./gauge.mjs')
  const state = g.loadState()
  const d = g.decide(state, g.parseBed(roadmapText))
  return { cycle: d.gauges.currentCycle, contest: state.bigSwingsBuilt, foundryContest: state.foundryBuilt ?? 0 }
}

// ── git preflight: never commit into a half-rewritten tree ─────────────────────
function git(args, opts = {}) { return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', ...opts }).trim() }
function repoBlocked() {
  let gitDir
  try { gitDir = git(['rev-parse', '--absolute-git-dir']) } catch { return 'not a git repo' }
  for (const f of ['rebase-merge', 'rebase-apply', 'MERGE_HEAD', 'CHERRY_PICK_HEAD']) {
    if (existsSync(`${gitDir}/${f}`)) return `a ${f.replace(/-|_HEAD/g, ' ').trim()} is in progress`
  }
  try { git(['symbolic-ref', '-q', 'HEAD']) } catch { return 'HEAD is detached' }
  return null
}

// ── titles → a tidy commit subject ─────────────────────────────────────────────
function defaultMessage(items, cycle) {
  const counts = {}
  for (const it of items) counts[it.route.fence] = (counts[it.route.fence] || 0) + 1
  const breakdown = Object.entries(counts).map(([f, n]) => `${n} ${f.replace('-seeds', '')}`).join(' · ')
  let titles = items.map(it => it.title).join(' · ')
  if (titles.length > 100) titles = titles.slice(0, 97) + '…'
  return `Sow ${items.length} out-of-band (#${cycle}): ${breakdown} — ${titles}`
}

// ── CLI ─────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const o = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') o.dryRun = true
    else if (a === '--no-commit') o.noCommit = true
    else if (a === '--no-stamp') o.noStamp = true
    else if (a === '--push') o.push = true
    else if (a === '--cycle') o.cycle = Number(argv[++i])
    else if (a === '--contest') o.contest = Number(argv[++i])
    else if (a === '--foundry-contest') o.foundryContest = Number(argv[++i])
    else if (a === '--message' || a === '-m') o.message = argv[++i]
    else if (a === '--roadmap') o.roadmap = argv[++i]
    else if (a === '--from-bug') o.fromBug = argv[++i]
    else if (a === '--help' || a === '-h') o.help = true
    else o._.push(a)
  }
  return o
}
function readStdin() {
  const chunks = []; const buf = Buffer.alloc(65536)
  while (true) { let n; try { n = readSync(0, buf, 0, buf.length, null) } catch { break } if (!n) break; chunks.push(Buffer.from(buf.subarray(0, n))) }
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const o = parseArgs(process.argv.slice(2))
  if (o.help || (!o._.length)) {
    const header = [] // the contiguous top-of-file // comment block, stopping at the first code line
    for (const l of readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n')) {
      if (l.startsWith('//')) header.push(l.replace(/^\/\/ ?/, ''))
      else if (header.length) break
    }
    console.log(header.join('\n'))
    process.exit(o.help ? 0 : 2)
  }
  const src = o._[0]
  const batch = src === '-' ? readStdin() : readFileSync(src, 'utf8')
  const items = parseBatch(batch)
  if (!items.length) { console.error('no items found in the batch (each item is a block led by [kind] or ⚡).'); process.exit(2) }

  const roadmapPath = o.roadmap || DEFAULT_ROADMAP
  const roadmapText = readFileSync(roadmapPath, 'utf8')

  // stamp values
  let cycle = o.cycle, contest = o.contest, foundryContest = o.foundryContest
  if (!o.noStamp && (cycle == null || contest == null || foundryContest == null)) {
    const live = await liveStamps(roadmapText)
    if (cycle == null) cycle = live.cycle
    if (contest == null) contest = live.contest
    if (foundryContest == null) foundryContest = live.foundryContest
  }

  // duplicate-title soft check (warn, don't block)
  for (const it of items) {
    if (it.title && roadmapText.includes(`**${it.title}**`)) console.error(`⚠ a title "${it.title}" already appears in ROADMAP — possible double-sow.`)
  }

  const { text, plan } = insert(roadmapText, items, { cycle, contest, foundryContest, noStamp: o.noStamp, fromBug: o.fromBug })
  const message = o.message || defaultMessage(items, cycle)

  // ── report the plan ──
  const anyStamped = !o.noStamp && items.some(it => it.route.stamp != null)
  const hasGroundsContest = items.some(it => it.route.contestSource === 'grounds')
  const hasFoundryContest = items.some(it => it.route.contestSource === 'foundry')
  const contestStr = [hasGroundsContest ? `contest #${contest}` : null, hasFoundryContest ? `foundry-contest #${foundryContest}` : null].filter(Boolean).join(' · ')
  console.log(`📥 sowing ${items.length} item(s)${anyStamped ? ` · stamp (sown #${cycle}${contestStr ? ` · ${contestStr}` : ''})` : ''}${o.fromBug ? ` · provenance (from bug: ${String(o.fromBug).replace(/\s+/g, ' ').trim().slice(0, 48)})` : ''}:`)
  for (const g of plan) { console.log(`  → ${g.anchorLabel}`); for (const l of g.lines) console.log(`      ${l.length > 110 ? l.slice(0, 107) + '…' : l}`) }

  if (o.dryRun) { console.log('\n(--dry-run — nothing written, nothing committed)'); return }

  writeFileSync(roadmapPath, text)
  console.log(`\n✏  wrote ${roadmapPath}`)

  if (o.noCommit || o.roadmap) { console.log('(--no-commit / --roadmap override — not committing)'); printGauge(roadmapPath); return }

  const blocked = repoBlocked()
  if (blocked) { console.error(`\n⚠ NOT committing — ${blocked}. ROADMAP.md is edited but uncommitted; commit it yourself once the repo settles (the loop's next publisher will also sweep it).`); printGauge(roadmapPath); return }

  git(['add', '--', 'ROADMAP.md'])
  git(['commit', '-m', message, '--', 'ROADMAP.md'])
  console.log(`\n✅ committed (local): ${message}`)
  console.log(`   ${git(['rev-parse', '--short', 'HEAD'])}  — reaches origin on the loop's next push.`)
  if (o.push) { git(['push']); console.log('   pushed.') }
  printGauge(roadmapPath)
}

function printGauge(roadmapPath) {
  try {
    console.log('\n— gauge after sow —')
    console.log(execFileSync('node', [fileURLToPath(new URL('./gauge.mjs', import.meta.url)), '--status'], { encoding: 'utf8' }).trim())
  } catch { /* gauge is advisory here */ }
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(`✖ ${e.message}`); process.exit(1) })
