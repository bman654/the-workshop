#!/usr/bin/env node
// ── index-gen — regenerate INDEX.md from the estate manifest ──────────────────
//
// WHY THIS IS GENERATED, NOT WRITTEN.
// "What already exists" is the one piece of state a maker MUST have (rebuilding a
// piece that already stands is the estate's oldest and most expensive mistake), and
// it is also the one that rots fastest if a human keeps it. So it is derived: the
// manifest (tools/manifest/manifest.mjs) already auto-discovers every room and page
// on disk, and this renders it to a scannable page. A maker never edits INDEX.md,
// never "remembers to add a line", and can never leave it stale — the seal rebuilds
// it every cycle, after the manifest is re-derived.
//
// It also cannot bloat through neglect: it is exactly as long as the estate is big,
// grouped by district with counts, and it collapses each room to one line.
//
// Usage:  node tools/seal/index-gen.mjs [--check]
//   --check   exit 1 if INDEX.md is stale (does not write) — for CI / the seal gate
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const MANIFEST = resolve(ROOT, 'tools/manifest/estate-manifest.json')
const OUT = resolve(ROOT, 'INDEX.md')

if (!existsSync(MANIFEST)) {
  console.error(`index-gen: manifest not found at ${MANIFEST} — run: node tools/manifest/manifest.mjs`)
  process.exit(1)
}
const m = JSON.parse(readFileSync(MANIFEST, 'utf8'))

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()
const L = []

L.push('# What stands')
L.push('')
L.push('*Generated from the estate manifest by `tools/seal/index-gen.mjs` — **never edit this file.***')
L.push('*It rebuilds every cycle. If something here is wrong, the manifest is wrong.*')
L.push('')
L.push(`**${m.counts.pieces} pieces · ${m.counts.rooms} rooms · ${m.counts.districts} districts.**`)
L.push('')
L.push('Grep this before you build. Rebuilding something that already stands is the estate\'s')
L.push('most expensive mistake — and the hidden pieces are not listed here, they are in')
L.push('[HIDDEN.md](HIDDEN.md). Check both.')
L.push('')
L.push('---')
L.push('')

for (const d of m.districts || []) {
  const c = d.counts || {}
  L.push(`## ${esc(d.label)}`)
  L.push('')
  L.push(`*${c.rooms ?? 0} rooms · ${c.pieces ?? 0} pieces*`)
  L.push('')
  for (const r of d.rooms || []) {
    const ex = r.exhibits || []
    const lock = r.locked ? ' 🔒' : ''
    L.push(`- **[${esc(r.room)}](${r.href})**${lock} — ${ex.length} piece${ex.length === 1 ? '' : 's'}`)
    if (ex.length) {
      // one folded line per room keeps a 464-piece estate scannable
      L.push(`  <sub>${ex.map((e) => `[${esc(e.name)}](${e.href})`).join(' · ')}</sub>`)
    }
  }
  L.push('')
}

for (const col of m.collections || []) {
  const ps = col.pieces || []
  L.push(`## ${esc(col.label)}`)
  L.push('')
  L.push(`*${ps.length} piece${ps.length === 1 ? '' : 's'}*`)
  L.push('')
  L.push(ps.map((p) => `[${esc(p.name)}](${p.href})`).join(' · '))
  L.push('')
}

if ((m.hidden || []).length) {
  L.push('## Off the map')
  L.push('')
  L.push(`*${m.hidden.length} piece${m.hidden.length === 1 ? '' : 's'} reachable only by a gate — the full secret*`)
  L.push('*inventory is in [HIDDEN.md](HIDDEN.md).*')
  L.push('')
  for (const h of m.hidden) L.push(`- **[${esc(h.name)}](${h.href})** — gate: \`${esc(h.gate)}\``)
  L.push('')
}

if ((m.unclaimed || []).length) {
  L.push('## Unclaimed')
  L.push('')
  L.push('*On disk but claimed by no room — probably a bug in the manifest or a page that*')
  L.push('*forgot to enroll.*')
  L.push('')
  for (const u of m.unclaimed) L.push(`- \`${esc(u.href || u)}\``)
  L.push('')
}

L.push('---')
L.push('')
L.push(`<sub>manifest generated at commit \`${esc(m.generatedAt || 'unknown')}\`</sub>`)
L.push('')

const body = L.join('\n')

if (process.argv.includes('--check')) {
  const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  if (cur !== body) {
    console.error('index-gen: INDEX.md is STALE — run: node tools/seal/index-gen.mjs')
    process.exit(1)
  }
  console.log('index-gen: INDEX.md current')
  process.exit(0)
}

writeFileSync(OUT, body)
console.log(`index-gen: INDEX.md rebuilt — ${m.counts.pieces} pieces, ${m.counts.rooms} rooms, ${m.counts.districts} districts`)
