// Node twin for The Fusion Ladder. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the STRUCTURE of the binding-energy valley — fusion pays downhill to the iron floor,
// then the sign flips — not a knife-edge 8.79 measurement. Independent of the page's runSelfTest
// where it matters:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest:
//         · sweep EVERY rung's yield sign (positive below the floor, negative at/above it),
//         · argmax(B/A) === PEAK and PEAK is 'Ni-62'; Fe-56 is the sub-iron maximum,
//         · cumulative bank monotone-up to the floor, monotone-down past it,
//         · the yield === PARCEL·(bank delta) conservation identity, every rung,
//         · the ANTISYMMETRY guard: climbing a rung DOWN un-banks exactly what climbing UP banked
//           (rungYield(i) === −(PARCEL·(ba[i]−ba[i+1]))) — Explorer 3's 6th guard,
//         · signFlipIndex() lands exactly on the rung leaving the floor and nowhere earlier,
//         · domain guard: rungYield/bank/depth throw RangeError on out-of-range / non-integer i,
//           plus the allowed-edge case rungYield(0) (the first, deepest plunge is exothermic);
//   (c) the freeFusionPastIron NEGATIVE CONTROL provably DISAGREES with the real core at and beyond
//       the floor (assert the disagreement explicitly — free(PEAK) > 0 while real(PEAK) < 0);
//   (d) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PARCEL, LADDER, NI62, PEAK,
  rungYield, depth, bank, freeFusionPastIron, signFlipIndex, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }
const sign = (x) => x > 0 ? 1 : x < 0 ? -1 : 0;
const lastStep = LADDER.length - 2, lastRung = LADDER.length - 1;

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// PER-RUNG YIELD SIGN SWEEP — positive below the floor, negative at and above it.
ck('yield sign sweep: rungYield(i) > 0 for every i below the floor  [rungs 0..' + (PEAK - 1) + ']',
   (() => { for (let i = 0; i < PEAK; i++) if (!(rungYield(i) > 0)) return false; return true; })());
ck('yield sign sweep: rungYield(i) < 0 for every i at/above the floor  [rungs ' + PEAK + '..' + lastStep + ']',
   (() => { for (let i = PEAK; i <= lastStep; i++) if (!(rungYield(i) < 0)) return false; return true; })());

// B/A PEAKS AT THE IRON GROUP — argmax is Ni-62; Fe-56 is the sub-iron maximum.
const feIdx = LADDER.findIndex(n => n.sym === 'Fe-56');
ck('argmax(B/A) === PEAK and PEAK is Ni-62  [PEAK=' + PEAK + ' (' + LADDER[PEAK].sym + ') ≈' + NI62 + ']',
   (() => { let b = 0; for (let i = 1; i < LADDER.length; i++) if (LADDER[i].ba > LADDER[b].ba) b = i; return b === PEAK && LADDER[PEAK].sym === 'Ni-62'; })());
ck('Fe-56 is the sub-iron maximum (≥ every species below it)  [Fe-56≈' + LADDER[feIdx].ba + ']',
   (() => { for (let i = 0; i < feIdx; i++) if (LADDER[feIdx].ba < LADDER[i].ba) return false; return true; })());
ck('Ni-62 (the floor) is more bound than Fe-56 — the engraving names both  [' + LADDER[PEAK].ba + ' > ' + LADDER[feIdx].ba + ']',
   LADDER[PEAK].ba > LADDER[feIdx].ba);

// B/A MONOTONE up to the floor, strictly down past it.
ck('B/A monotone-increasing up to the floor  [rungs 0..' + PEAK + ']',
   (() => { for (let i = 1; i <= PEAK; i++) if (!(LADDER[i].ba > LADDER[i - 1].ba)) return false; return true; })());
ck('B/A strictly decreasing past the floor (the un-climbable up-wall)  [rungs ' + (PEAK + 1) + '..' + lastRung + ']',
   (() => { for (let i = PEAK + 1; i <= lastRung; i++) if (!(LADDER[i].ba < LADDER[i - 1].ba)) return false; return true; })());

// CUMULATIVE BANK monotone-up to the floor, monotone-down past it.
ck('bank monotone-increasing up to the floor  [bank(floor)=' + bank(PEAK).toFixed(1) + ' MeV/parcel]',
   (() => { for (let i = 1; i <= PEAK; i++) if (!(bank(i) > bank(i - 1))) return false; return true; })());
ck('bank monotone-decreasing past the floor',
   (() => { for (let i = PEAK + 1; i <= lastRung; i++) if (!(bank(i) < bank(i - 1))) return false; return true; })());

// CONSERVATION IDENTITY — the yield IS the bank's delta, every rung (energy conserved).
ck('conservation: rungYield(i) === bank(i+1) − bank(i) and same sign, every rung',
   (() => { for (let i = 0; i <= lastStep; i++){ const d = bank(i + 1) - bank(i); if (Math.abs(d - rungYield(i)) > 1e-9 || sign(d) !== sign(rungYield(i))) return false; } return true; })());

// ANTISYMMETRY GUARD — climbing a rung DOWN un-banks exactly what climbing UP banked.
ck('antisymmetry: rungYield down === −rungYield up, every rung (climb-down un-banks the climb-up)',
   (() => { for (let i = 0; i <= lastStep; i++){ const up = rungYield(i); const down = PARCEL * (LADDER[i].ba - LADDER[i + 1].ba); if (Math.abs(down + up) > 1e-9) return false; } return true; })());

// SIGN-FLIP INDEX — first negative rung is exactly the one leaving the floor, nowhere earlier.
ck('signFlipIndex() === PEAK (first negative rung leaves the floor)  [flip=' + signFlipIndex() + ', PEAK=' + PEAK + ']',
   signFlipIndex() === PEAK);
ck('no sub-iron rung is negative (the flip is not earlier than the floor)',
   (() => { for (let i = 0; i < PEAK; i++) if (rungYield(i) < 0) return false; return true; })());

// DEPTH / GEOMETRY — depth is monotone to the floor (data → the valley shape the page draws).
ck('depth(i) monotone-increasing to the floor (the trough deepens to iron)  [depth(floor)=' + depth(PEAK).toFixed(3) + ']',
   (() => { for (let i = 1; i <= PEAK; i++) if (!(depth(i) > depth(i - 1))) return false; return true; })());
ck('depth(0) === 0 (hydrogen is the rim — nothing fused yet)', depth(0) === 0);

// DOMAIN GUARD — out-of-range / non-integer indices throw RangeError; valid edge cases pass.
function throwsRange(fn){ try { fn(); return false; } catch(e){ return e instanceof RangeError; } }
ck('domain guard: rungYield(-1) throws RangeError', throwsRange(() => rungYield(-1)));
ck('domain guard: rungYield(lastStep+1) throws RangeError (no rung past the last)', throwsRange(() => rungYield(lastStep + 1)));
ck('domain guard: rungYield(0.5) throws RangeError (non-integer index)', throwsRange(() => rungYield(0.5)));
ck('domain guard: rungYield("0") throws RangeError (not a number)', throwsRange(() => rungYield('0')));
ck('domain guard: bank(lastRung+1) throws RangeError', throwsRange(() => bank(lastRung + 1)));
ck('domain guard: depth(-1) throws RangeError', throwsRange(() => depth(-1)));
ck('allowed edge: rungYield(0) is the first plunge and is exothermic (H→He pays)  [' + rungYield(0).toFixed(2) + ']',
   (() => { try { return rungYield(0) > 0; } catch(e){ return false; } })());
ck('allowed edge: bank(lastRung) is defined (the far up-wall has a bank readout)',
   (() => { try { return Number.isFinite(bank(lastRung)); } catch(e){ return false; } })());

// PARCEL is the fixed conserved nucleon count — the crux that makes sign(Q)===sign(ΔB/A) hold.
ck('PARCEL === 56 (fixed nucleon parcel — conserves nucleon number)', PARCEL === 56);

// ── (c) the freeFusionPastIron NEGATIVE CONTROL provably DISAGREES at/beyond the floor ──
ck('NEGATIVE CONTROL: free-fusion agrees in sign with the real core on every sub-iron rung', (() => {
  for (let i = 0; i < PEAK; i++) if (sign(freeFusionPastIron(i)) !== sign(rungYield(i))) return false;
  return true;
})());
ck('NEGATIVE CONTROL: free(PEAK) > 0 while real(PEAK) < 0 — they DISAGREE in sign at the floor  [free=+' +
   freeFusionPastIron(PEAK).toFixed(2) + ' vs real=' + rungYield(PEAK).toFixed(2) + ']', (() => {
  const free = freeFusionPastIron(PEAK), real = rungYield(PEAK);
  return free > 0 && real < 0 && sign(free) !== sign(real);
})());
ck('NEGATIVE CONTROL: free-fusion disagrees with the real core on EVERY rung at/above the floor', (() => {
  for (let i = PEAK; i <= lastStep; i++) if (!(freeFusionPastIron(i) > 0 && rungYield(i) < 0 && sign(freeFusionPastIron(i)) !== sign(rungYield(i)))) return false;
  return true;
})());
ck('NEGATIVE CONTROL: free-fusion is the magnitude of the real yield (a furnace blind to sign)',
   (() => { for (let i = 0; i <= lastStep; i++) if (Math.abs(freeFusionPastIron(i) - Math.abs(rungYield(i))) > 1e-9) return false; return true; })());

// ── (d) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== FUSION-LADDER CORE (byte-identical to core.mjs) =====';
const END = '// ===== END FUSION-LADDER CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: FUSION-LADDER CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: FUSION-LADDER CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Fusion Ladder — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
