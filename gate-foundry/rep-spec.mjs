#!/usr/bin/env node
// ── rep-spec — deterministic scaffolding for a NEW bespoke front-gate room-rep ─────
// Wiring a new rep into the gate is small but error-prone: an entry in rooms.js
// BESPOKE (rep key + per-band repColors), a dispatch line in scene.js REP_DRAW, and a
// drawRep<Name> function. This module OWNS that deterministic wiring so the foundry
// smith only has to make the ART (the drawFn body), which the publisher then reviews.
//
// It is the tested twin behind seedbed/prompts/foundry.md: a foundry cycle's smith runs
//   node gate-foundry/rep-spec.mjs --spec '<json>'
// to print the exact BESPOKE entry, the REP_DRAW line, the drawFn stub, and the slot
// geometry for the rep's aspect, then applies them and iterates on the art.
//
// A rep SPEC (from a [rep] seed) is:
//   { id, room?, repConcept, aspect, accent?, repName?, repKey?, repColors? }
//     id         — the estate room id (its slab id + the ?room= pin), e.g. "firmament"
//     room       — display name (for comments), e.g. "The Firmament"
//     repConcept — what the drawn object IS, e.g. "an armillary sphere of nested brass rings"
//     aspect     — vertical | horizontal | mound (which slot shape it fills)
//     accent     — the room's accent hex (a fallback glow / the glyph-stand pip)
//     repName    — optional: the drawFn flavour name (default: PascalCase(id)) → drawRep<Name>
//     repKey     — optional: the REP_DRAW key (default: "<id>-rep")
//     repColors  — optional: { DAY:{'rep.swatch1':'#..','rep.glow1':'#..'}, DUSK:{…}, NIGHT:{…} }

const ASPECTS = {
  vertical: {
    label: 'VERTICAL (tall + narrow — a tower / armillary / rank of pipes)',
    geometry: `TALL + NARROW — width ~90..120, height up to ~200, grows UPWARD from the ground line. ` +
      `Bottom-aligned at baseY (~y720), centered about cx (~x230). Stay within [78..156]×[114..228]. LAYER 6 furniture.`,
  },
  horizontal: {
    label: 'HORIZONTAL (wide + short — a pond / tray / table on a low frame)',
    geometry: `WIDE + SHORT — width up to ~156, height ~60..110, on short legs / a low frame. ` +
      `Bottom-aligned at baseY (~y720), centered about cx (~x230). Stay within [78..156]×[114..228]. LAYER 6 furniture.`,
  },
  mound: {
    label: 'LOW-WIDE MOUND (squat, hugging the ground — an outcrop / hill / kiln)',
    geometry: `LOW + WIDE — width up to ~150, height ~90..130, squat and hugging the ground. ` +
      `Bottom-aligned at baseY (~y720), centered about cx (~x230). Stay within [78..156]×[114..228]. LAYER 6 furniture.`,
  },
}

// id / name sanitizers (deterministic, no surprises)
const slug = s => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const pascal = s => slug(s).split('-').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('')

const BANDS = ['DAY', 'DUSK', 'NIGHT']

// Validate + normalize a spec; throws a clear error on a malformed one (so a bad seed
// fails LOUD at scaffold time, never silently producing broken wiring).
export function normalizeSpec(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('rep spec must be an object')
  const id = slug(spec.id)
  if (!id) throw new Error('rep spec needs a non-empty id (the estate room id)')
  if (!ASPECTS[spec.aspect]) throw new Error(`rep spec aspect must be one of ${Object.keys(ASPECTS).join(' | ')} (got ${JSON.stringify(spec.aspect)})`)
  if (!spec.repConcept || !String(spec.repConcept).trim()) throw new Error('rep spec needs a repConcept (what the drawn object IS)')
  if (spec.repColors != null) {
    if (typeof spec.repColors !== 'object') throw new Error('repColors must be an object keyed by band')
    for (const b of BANDS) {
      if (spec.repColors[b] != null && typeof spec.repColors[b] !== 'object') throw new Error(`repColors.${b} must be an object of role→hex`)
    }
  }
  return {
    id,
    room: String(spec.room || id),
    repConcept: String(spec.repConcept).trim(),
    aspect: spec.aspect,
    accent: spec.accent || null,
    repName: spec.repName ? pascal(spec.repName) : pascal(id),
    repKey: spec.repKey ? slug(spec.repKey) : `${id}-rep`,
    repColors: spec.repColors || null,
  }
}

// Serialize repColors to a JS object literal that matches rooms.js BESPOKE style:
// band keys bare (DAY/DUSK/NIGHT are valid identifiers), role keys single-quoted
// (they contain a dot, e.g. 'rep.swatch1', so they MUST stay quoted), values quoted.
function colorsToLiteral(colors) {
  const band = b => {
    const roles = Object.entries(colors[b] || {}).map(([k, v]) => `'${k}': '${v}'`).join(', ')
    return `${b}: { ${roles} }`
  }
  return `{ ${BANDS.filter(b => colors[b]).map(band).join(', ')} }`
}

// repEntryFromSpec(spec) → the deterministic scaffolding for the rep.
export function repEntryFromSpec(spec) {
  const s = normalizeSpec(spec)
  const drawFn = `drawRep${s.repName}`
  const colorsLit = s.repColors ? colorsToLiteral(s.repColors) : 'undefined'
  return {
    id: s.id,
    room: s.room,
    aspect: s.aspect,
    repKey: s.repKey,                 // REP_DRAW key === BESPOKE.rep === the footprint scene.js dispatches on
    drawFn,                           // the scene.js function name
    renderQS: `room=${s.id}`,         // the ?room= pin that forces THIS rep on screen
    aspectLabel: ASPECTS[s.aspect].label,
    geometry: ASPECTS[s.aspect].geometry,
    // 1) rooms.js — add inside the BESPOKE object:
    bespokeEntry: `'${s.id}': { rep: '${s.repKey}', repColors: ${colorsLit} },`,
    // 2) scene.js — add inside the REP_DRAW map:
    repDrawEntry: `'${s.repKey}': function (g, baseX, baseY, pick) { ${drawFn}(g, baseX, baseY, pick); },`,
    // 3) scene.js — add a NEW module-internal function (sibling to drawRepCavern/Ripple/OrganPipes):
    drawFnStub: `function ${drawFn}(parent, cx, baseY, pick) {\n  // ${s.room} — ${s.repConcept}\n  // aspect: ${s.aspect} — ${ASPECTS[s.aspect].geometry}\n  // brass idiom + lit-from-above; emissive via pick's rep.glow1; recolor per band via the rep.* roles.\n  // TODO: the art (the foundry smith fills this in, then renders + iterates).\n}`,
  }
}

export { ASPECTS }

// ── CLI ────────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2)
  let specJson = null
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--spec') specJson = argv[++i]
    else if (argv[i] === '-') specJson = await import('node:fs').then(fs => fs.readFileSync(0, 'utf8'))
    else if (argv[i] === '--help' || argv[i] === '-h') { console.log('usage: rep-spec.mjs --spec \'{"id":"firmament","repConcept":"...","aspect":"vertical"}\''); process.exit(0) }
  }
  if (!specJson) { console.error('rep-spec: pass --spec \'<json>\' (or - to read JSON from stdin). --help for the shape.'); process.exit(2) }
  let spec
  try { spec = JSON.parse(specJson) } catch (e) { console.error(`rep-spec: spec is not valid JSON — ${e.message}`); process.exit(2) }
  let r
  try { r = repEntryFromSpec(spec) } catch (e) { console.error(`rep-spec: ${e.message}`); process.exit(2) }
  console.log(`\n══ rep scaffolding for "${r.room}" (id: ${r.id}) ══`)
  console.log(`aspect : ${r.aspectLabel}`)
  console.log(`repKey : ${r.repKey}   ·   drawFn: ${r.drawFn}   ·   render with ?${r.renderQS}`)
  console.log(`\n① rooms.js — add inside the BESPOKE object:\n    ${r.bespokeEntry}`)
  console.log(`\n② scene.js — add inside the REP_DRAW map:\n    ${r.repDrawEntry}`)
  console.log(`\n③ scene.js — add a new sibling draw function (then make the ART):\n${r.drawFnStub.split('\n').map(l => '    ' + l).join('\n')}`)
  console.log(`\nSLOT GEOMETRY (${r.aspect}): ${r.geometry}\n`)
}
