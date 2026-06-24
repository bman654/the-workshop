#!/usr/bin/env node
// ── Node twin for rep-spec.mjs — the deterministic rep scaffolding, proven exact ──
// Run: node gate-foundry/rep-spec.test.mjs   (exit 0 = all green). Pure logic.
import { repEntryFromSpec, normalizeSpec, ASPECTS } from './rep-spec.mjs'

let pass = 0, fail = 0
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  ✗ ' + m) } }
const eq = (a, b, m) => ok(a === b, `${m} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`)
const threw = (fn) => { try { fn(); return false } catch { return true } }

console.log('normalize + derive:')
{
  const r = repEntryFromSpec({ id: 'firmament', room: 'The Firmament', repConcept: 'an armillary sphere of nested brass rings', aspect: 'vertical', accent: '#cba15a' })
  eq(r.id, 'firmament', 'id passes through (slugged)')
  eq(r.repKey, 'firmament-rep', 'default repKey = <id>-rep')
  eq(r.drawFn, 'drawRepFirmament', 'default drawFn = drawRep<PascalId>')
  eq(r.renderQS, 'room=firmament', 'render QS pins the room')
  ok(r.aspectLabel.includes('VERTICAL'), 'aspect label carried')
  ok(r.geometry.includes('TALL'), 'vertical geometry chosen')
}

console.log('multi-word id → PascalCase drawFn + slug repKey:')
{
  const r = repEntryFromSpec({ id: 'sound-garden', repConcept: 'a rank of brass organ pipes', aspect: 'vertical' })
  eq(r.drawFn, 'drawRepSoundGarden', 'hyphenated id → PascalCase drawFn')
  eq(r.repKey, 'sound-garden-rep', 'hyphenated id → slug repKey')
}

console.log('repName / repKey overrides:')
{
  const r = repEntryFromSpec({ id: 'physics-lab', repConcept: 'a rocky mound with a glowing maw', aspect: 'mound', repName: 'Cavern', repKey: 'cavern-mound' })
  eq(r.drawFn, 'drawRepCavern', 'repName override drives the drawFn flavour')
  eq(r.repKey, 'cavern-mound', 'repKey override honored')
  // the REP_DRAW line must dispatch the override key to the override drawFn
  ok(r.repDrawEntry.includes("'cavern-mound': function") && r.repDrawEntry.includes('drawRepCavern(g, baseX, baseY, pick)'), 'REP_DRAW line wires key → drawFn')
}

console.log('BESPOKE entry — colors vs none:')
{
  const colors = { DAY: { 'rep.swatch1': '#4fb8c8', 'rep.glow1': '#7fe0e8' }, DUSK: { 'rep.swatch1': '#3f8a9a', 'rep.glow1': '#7fe0e8' }, NIGHT: { 'rep.swatch1': '#2a5560', 'rep.glow1': '#7fe0e8' } }
  let r = repEntryFromSpec({ id: 'ripple', repConcept: 'a shallow water tray with concentric ripples', aspect: 'horizontal', repColors: colors })
  ok(r.bespokeEntry.startsWith("'ripple': { rep: 'ripple-rep', repColors: {"), 'BESPOKE entry leads with id + rep key + colors')
  ok(r.bespokeEntry.includes("'rep.swatch1': '#4fb8c8'") && r.bespokeEntry.includes("'rep.glow1': '#7fe0e8'"), 'repColors rendered as JS object literal (single-quoted)')
  ok(!r.bespokeEntry.includes('"'), 'no JSON double-quotes leak into the rooms.js literal')
  // the emitted literal must be valid JS that round-trips to the same colors
  // (eval the object expression in a function to confirm it parses + equals)
  const parsed = new Function(`return (${r.bespokeEntry.replace(/^'[^']+':\s*/, '').replace(/,\s*$/, '')})`)()
  eq(JSON.stringify(parsed.repColors), JSON.stringify(colors), 'emitted repColors literal round-trips exactly')

  r = repEntryFromSpec({ id: 'verse', repConcept: 'a quill on a writing stand', aspect: 'vertical' })
  ok(r.bespokeEntry.includes('repColors: undefined'), 'no repColors → repColors: undefined (rep uses fixed estate colors)')
}

console.log('drawFn stub is a well-formed sibling fn:')
{
  const r = repEntryFromSpec({ id: 'orrery', repConcept: 'a brass orrery of nested planet rings', aspect: 'mound' })
  ok(r.drawFnStub.startsWith('function drawRepOrrery(parent, cx, baseY, pick) {'), 'stub matches the module-internal rep fn signature')
  ok(r.drawFnStub.trim().endsWith('}'), 'stub is balanced')
  // node must accept the stub as valid JS
  ok(!threw(() => new Function(r.drawFnStub + '\nreturn drawRepOrrery')), 'stub parses as valid JS')
}

console.log('all three aspect templates exist + are distinct:')
{
  eq(Object.keys(ASPECTS).sort().join(','), 'horizontal,mound,vertical', 'three aspects defined')
  const g = ['vertical', 'horizontal', 'mound'].map(a => repEntryFromSpec({ id: 'x', repConcept: 'c', aspect: a }).geometry)
  ok(new Set(g).size === 3, 'each aspect yields a distinct geometry block')
}

console.log('validation — a malformed spec fails LOUD:')
{
  ok(threw(() => repEntryFromSpec(null)), 'null spec throws')
  ok(threw(() => repEntryFromSpec({ repConcept: 'c', aspect: 'vertical' })), 'missing id throws')
  ok(threw(() => repEntryFromSpec({ id: 'a', repConcept: 'c', aspect: 'diagonal' })), 'bad aspect throws')
  ok(threw(() => repEntryFromSpec({ id: 'a', aspect: 'vertical' })), 'missing repConcept throws')
  ok(threw(() => repEntryFromSpec({ id: 'a', repConcept: 'c', aspect: 'vertical', repColors: 'red' })), 'non-object repColors throws')
  ok(threw(() => normalizeSpec({ id: '!!!', repConcept: 'c', aspect: 'vertical' })), 'id that slugs to empty throws')
}

console.log(`\n${fail === 0 ? '✓' : '✗'} rep-spec.test.mjs: ${pass}/${pass + fail} passed`)
process.exit(fail === 0 ? 0 : 1)
