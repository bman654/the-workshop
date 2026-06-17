// Node twin for The Aperiodic Patch core. Zero-dep. Run: `node aperiodic-patch/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold
// self-test pill and this test can never drift. It re-proves the THREE legs the in-page pill proves
// — (1) matching is enforced exactly (legal adjacencies pass, known-illegal ones are rejected — no
// vacuous accept), (2) aperiodicity is checkable (a legally-grown Penrose patch yields ZERO repeat
// vectors above THRESHOLD), and (3) the LOAD-BEARING negative control (the SAME hunter run on the
// periodic square grid DOES return a repeating vector above threshold) — PLUS a byte-twin parity row
// proving index.html's inlined CORE slice is char-for-char core.mjs (the established convention; see
// dissection/core.test.mjs lines 97–118). process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  THRESHOLD, placeTile, edgesMatch, sameEdgeGeom, tilesOverlap,
  frontierEdges, legalSeats, grownPatch, periodicControl, repeatHunt, centroid,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Aperiodic Patch — Node twin (the three legs the in-page pill proves)\n');

// ── LEG 1: MATCHING ENFORCED EXACTLY ──────────────────────────────────────────
console.log('— Leg 1: matching enforced exactly (no vacuous accept) —');
{
  // Pre-seed one thick rhomb at the origin; its frontier edges are all 4 sides.
  const seed0 = placeTile('thick', 0, [0, 0]);
  const patch = [seed0];
  const fes = frontierEdges(patch);
  ck('a single seeded thick rhomb exposes 4 frontier edges', fes.length === 4, 'frontier=' + fes.length);

  // For at least one frontier edge there exists at least one LEGAL seat (the onramp is non-empty).
  let anySeat = 0, totalSeats = 0;
  for (const fe of fes) { const s = legalSeats(patch, fe.edge); totalSeats += s.length; if (s.length) anySeat++; }
  ck('every legal seat the engine offers actually MATCHES + does not overlap', (() => {
    for (const fe of fes) for (const s of legalSeats(patch, fe.edge)) {
      const ce = s.tile.edges[s.ei];
      if (!edgesMatch(ce, fe.edge)) return false;
      if (tilesOverlap(s.tile, seed0)) return false;
    }
    return true;
  })(), 'offered ' + totalSeats + ' seats across ' + anySeat + ' edges');
  ck('the onramp is non-empty (at least one frontier edge has a legal seat)', anySeat > 0);

  // NEG control inside leg 1: a deliberately MIS-MATCHED placement is rejected by edgesMatch.
  // Take a frontier edge and place a tile whose edge has the WRONG arrow direction (flip 180°).
  const fe0 = fes[0].edge;
  // an edge pointing the opposite world direction can never match (different ux,uy):
  const flipped = { ...fe0, ux: -fe0.ux, uy: -fe0.uy };
  ck('a reversed-arrow edge is REJECTED by edgesMatch (the rule has teeth)',
    !edgesMatch(fe0, flipped), 'same geom, opposite arrow → no match');
  // a different-kind edge is rejected even with identical geometry/direction:
  const wrongKind = { ...fe0, kind: fe0.kind === 1 ? 2 : 1 };
  ck('a wrong-kind edge is REJECTED by edgesMatch', !edgesMatch(fe0, wrongKind), 'single vs double → no match');
  // sameEdgeGeom sanity: an edge matches its own geometry, not a translated one.
  const moved = { ...fe0, mx: fe0.mx + 5, my: fe0.my, ax: fe0.ax + 5, bx: fe0.bx + 5 };
  ck('sameEdgeGeom: identical edge yes, translated edge no', sameEdgeGeom(fe0, fe0) && !sameEdgeGeom(fe0, moved));
}

// A built-out vertex star: seat tiles around the seed and confirm every shared edge matches.
{
  let patch = [placeTile('thick', 0, [0, 0])];
  let added = 0;
  for (let step = 0; step < 8 && added < 4; step++) {
    const fes = frontierEdges(patch);
    let placed = false;
    for (const fe of fes) {
      const seats = legalSeats(patch, fe.edge);
      if (seats.length) { patch.push(seats[0].tile); added++; placed = true; break; }
    }
    if (!placed) break;
  }
  ck('built a small legal cluster around the seed by repeated legal seating', patch.length >= 3, 'tiles=' + patch.length);
  // every shared edge in the built cluster matches:
  let sharedOk = true, sharedCount = 0;
  for (let i = 0; i < patch.length; i++) for (const e of patch[i].edges)
    for (let j = i + 1; j < patch.length; j++) for (const f of patch[j].edges)
      if (sameEdgeGeom(e, f)) { sharedCount++; if (!edgesMatch(e, f)) sharedOk = false; }
  ck('EVERY shared edge in the built cluster passes edgesMatch', sharedOk && sharedCount > 0, 'shared edges=' + sharedCount);
  // no two tiles in the cluster overlap:
  let noOverlap = true;
  for (let i = 0; i < patch.length; i++) for (let j = i + 1; j < patch.length; j++)
    if (tilesOverlap(patch[i], patch[j])) noOverlap = false;
  ck('no two tiles in the built cluster overlap', noOverlap);
}

// ── LEG 2: APERIODICITY MADE CHECKABLE ────────────────────────────────────────
console.log('\n— Leg 2: aperiodicity made checkable (no repeat above threshold) —');
{
  const patch = grownPatch(4, 0.42);
  ck('a deflated Penrose patch grows ≥ 40 tiles', patch.length >= 40, 'n=' + patch.length);
  const r = repeatHunt(patch, 5);
  ck('repeatHunt finds NO translation repeat above threshold (aperiodic)',
    !r.found && r.bestFrac < THRESHOLD,
    'best overlap = ' + r.bestFrac.toFixed(3) + ' < THRESHOLD ' + THRESHOLD + ' (' + patch.length + ' tiles)');
}

// ── LEG 3: NEGATIVE CONTROL IS LOAD-BEARING ───────────────────────────────────
console.log('\n— Leg 3: load-bearing negative control (the SAME hunter catches a periodic set) —');
{
  const grid = periodicControl(7);
  const r = repeatHunt(grid, 5);
  ck('the SAME repeatHunt RETURNS a repeating vector on the periodic grid (≈1.0)',
    r.found && r.bestFrac >= THRESHOLD && r.v != null,
    'best overlap = ' + r.bestFrac.toFixed(3) + ' ≥ THRESHOLD, v = [' + (r.v ? r.v.map((x) => x.toFixed(2)).join(', ') : '—') + ']');
  ck('a vacuous always-empty detector would FAIL this leg (detector is real)', r.bestFrac > 0.99);
}

// ── BYTE-TWIN PARITY ──────────────────────────────────────────────────────────
console.log('\n— Single-source discipline (the inlined slab is the module, byte-for-byte) —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreReg = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

console.log('\n—— The Aperiodic Patch Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
