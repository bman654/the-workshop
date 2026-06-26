/* ═══════════════════════════════════════════════════════════════════════════
   stations.test.mjs — the CONTENT-FIDELITY check for "The Long Way Home".

   This room carries NO numeric claim, so it owns no math self-test. What it DOES
   promise is fidelity: the twelve canonical stations of the monomyth, in order,
   each mapped to all three myths with no holes. This check asserts SHAPE /
   COMPLETENESS only — it proves the table is whole and canonical, not that any
   number is "exact".

   Run:  node the-long-way-home/stations.test.mjs
   Exits non-zero on any failure; prints "stations content-fidelity: N/N PASS".
   ═══════════════════════════════════════════════════════════════════════════ */
import { STATIONS, CANONICAL_NAMES, MYTH_KEYS } from './stations.mjs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

/* (1) exactly twelve stations */
ok(Array.isArray(STATIONS), 'STATIONS is an array');
ok(STATIONS.length === 12, 'exactly 12 stations (got ' + STATIONS.length + ')');

/* (2) the twelve canonical names, in canonical order, verbatim */
ok(CANONICAL_NAMES.length === 12, 'CANONICAL_NAMES has 12 entries');
for (let i = 0; i < 12; i++) {
  const s = STATIONS[i] || {};
  ok(s.name === CANONICAL_NAMES[i],
    'station ' + (i + 1) + ' name is canonical "' + CANONICAL_NAMES[i] + '" (got "' + s.name + '")');
  ok(s.n === i + 1, 'station ' + (i + 1) + ' carries n=' + (i + 1) + ' (got ' + s.n + ')');
  ok(typeof s.numeral === 'string' && s.numeral.length > 0, 'station ' + (i + 1) + ' has a numeral');
  ok(typeof s.beat === 'string' && s.beat.trim().length > 0, 'station ' + (i + 1) + ' has a non-empty beat');
  ok(typeof s.keyword === 'string' && s.keyword.trim().length > 0, 'station ' + (i + 1) + ' has a keyword');
  ok(typeof s.weave === 'string' && s.weave.trim().length > 0, 'station ' + (i + 1) + ' has a woven line');
}

/* (3) all three myths present & non-empty for every station — 36/36, no holes,
       every tautness a real number in [0,1] */
let cells = 0;
for (const s of STATIONS) {
  ok(s.myths && typeof s.myths === 'object', s.name + ': has a myths object');
  for (const k of MYTH_KEYS) {
    const m = s.myths ? s.myths[k] : null;
    const okCell = m && typeof m.text === 'string' && m.text.trim().length > 0
      && typeof m.hero === 'string' && m.hero.trim().length > 0
      && typeof m.tautness === 'number' && Number.isFinite(m.tautness)
      && m.tautness >= 0 && m.tautness <= 1;
    ok(okCell, s.name + ' / ' + k + ': non-empty text+hero and tautness ∈ [0,1] (got '
      + (m ? m.tautness : 'MISSING') + ')');
    if (okCell) cells++;
  }
}
ok(cells === 36, 'all 36 myth cells present and whole (got ' + cells + '/36)');

/* (4) arc membership is exactly day for 1-5 + 12, night for 6-11; el sign agrees */
const expectArc = { 1: 'day', 2: 'day', 3: 'day', 4: 'day', 5: 'day',
  6: 'night', 7: 'night', 8: 'night', 9: 'night', 10: 'night', 11: 'night', 12: 'day' };
for (const s of STATIONS) {
  ok(s.arc === expectArc[s.n], 'station ' + s.n + ' arc is ' + expectArc[s.n] + ' (got ' + s.arc + ')');
  ok(typeof s.el === 'number' && Number.isFinite(s.el), 'station ' + s.n + ' has a numeric elevation');
  if (s.arc === 'day') ok(s.el >= 0, 'day station ' + s.n + ' sits at/above the horizon (el=' + s.el + ')');
  if (s.arc === 'night') ok(s.el < 0, 'night station ' + s.n + ' sits below the horizon (el=' + s.el + ')');
}

/* (5) the Ordeal (#8) is the unique nadir — strictly the deepest elevation */
const minEl = Math.min(...STATIONS.map(s => s.el));
const nadir = STATIONS.filter(s => s.el === minEl);
ok(nadir.length === 1 && nadir[0].n === 8, 'the unique deepest station is #8 The Ordeal (el=' + minEl + ')');

/* (6) EXACTLY two gates, at the canonical horizon-crossings:
       descent after Crossing the First Threshold (#5), dawn after Resurrection (#11) */
const gates = STATIONS.filter(s => s.gateAfter);
ok(gates.length === 2, 'exactly two gateAfter flags (got ' + gates.length + ')');
const descent = STATIONS.find(s => s.gateAfter === 'descent');
const dawn = STATIONS.find(s => s.gateAfter === 'dawn');
ok(descent && descent.n === 5, 'the descent gate is after #5 Crossing the First Threshold');
ok(dawn && dawn.n === 11, 'the dawn gate is after #11 Resurrection');

/* (7) the honesty device is actually present — at least one myth runs genuinely
       THIN somewhere (a tautness < 0.2), so the asymmetry the room teaches exists
       in the data, not just the prose. (Inanna's absent Refusal; the Prodigal's
       absent Mentor.) */
let hasThin = false;
for (const s of STATIONS) for (const k of MYTH_KEYS) {
  if (s.myths[k] && s.myths[k].tautness < 0.2) hasThin = true;
}
ok(hasThin, 'at least one ribbon runs genuinely thin (tautness < 0.2) — the honesty device is in the data');

const total = pass + fail;
if (fail) {
  console.error('\nstations content-fidelity: ' + pass + '/' + total + ' PASS, ' + fail + ' FAIL');
  process.exit(1);
}
console.log('stations content-fidelity: ' + total + '/' + total + ' PASS');
