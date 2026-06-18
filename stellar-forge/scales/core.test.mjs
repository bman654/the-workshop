// Node twin for The Scales of a Star's Death. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the STRUCTURE of stellar death — two ordered gates ⇒ three ordered fates — not a
// knife-edge mass measurement. Independent of the page's runSelfTest where it matters:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest:
//         · the Chandrasekhar FLIP (1.43 → white dwarf, 1.45 → neutron star),
//         · the TOV FLIP (2.1 → neutron star, 2.4 → black hole),
//         · MONOTONE fate ladder over [0.6,1.0,1.43,1.45,1.8,2.1,2.4,2.8],
//         · BOUNDARY direction: classify(M_CH) and classify(M_TOV) land on the heavier side,
//           and just-below ≠ just-above at each cut,
//         · gates ORDERED (M_CH < M_TOV) so the neutron-star band is non-empty,
//         · domain guard: classify throws RangeError on NaN / −1 / Infinity / non-number;
//   (c) the alwaysNeutron NEGATIVE CONTROL provably FAILS both flip pairs (assert the failing
//       condition explicitly — it disagrees with the real core at 1.43 AND 2.4);
//   (d) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  M_CH, M_TOV, FATES,
  classify, fateIndex, alwaysNeutron, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// CHANDRASEKHAR FLIP — the lower gate turns a white dwarf into a neutron star.
ck('Chandrasekhar flip: classify(1.43)==="white-dwarf" && classify(1.45)==="neutron-star"  [' +
   classify(1.43) + ' / ' + classify(1.45) + ']',
   classify(1.43) === 'white-dwarf' && classify(1.45) === 'neutron-star');

// TOV FLIP — the upper gate turns a neutron star into a black hole.
ck('TOV flip: classify(2.1)==="neutron-star" && classify(2.4)==="black-hole"  [' +
   classify(2.1) + ' / ' + classify(2.4) + ']',
   classify(2.1) === 'neutron-star' && classify(2.4) === 'black-hole');

// MONOTONE LADDER — fate index never decreases as mass rises (death never gets gentler).
const ladder = [0.6, 1.0, 1.43, 1.45, 1.8, 2.1, 2.4, 2.8];
const idx = ladder.map(fateIndex);
ck('monotone: fate index non-decreasing across [' + ladder.join(',') + ']  [' + idx.join(',') + ']',
   (() => { for (let k = 1; k < idx.length; k++) if (idx[k] < idx[k-1]) return false; return true; })());

// the ladder actually visits all three fates (dwarf, neutron star, black hole) — not degenerate.
ck('ladder spans all three fates (0=dwarf, 1=ns, 2=bh all present)  [' + idx.join(',') + ']',
   idx.includes(0) && idx.includes(1) && idx.includes(2));

// BOUNDARY DIRECTION — AT each limit the heavier fate is chosen; just-below ≠ just-above.
ck('boundary @ M_CH lands heavier: classify(M_CH)==="neutron-star" and classify(M_CH−ε)==="white-dwarf"  [' +
   classify(M_CH) + ' / ' + classify(M_CH - 0.01) + ']',
   classify(M_CH) === 'neutron-star' && classify(M_CH - 0.01) === 'white-dwarf');
ck('boundary @ M_TOV lands heavier: classify(M_TOV)==="black-hole" and classify(M_TOV−ε)==="neutron-star"  [' +
   classify(M_TOV) + ' / ' + classify(M_TOV - 0.01) + ']',
   classify(M_TOV) === 'black-hole' && classify(M_TOV - 0.01) === 'neutron-star');

// GATES ORDERED — M_CH strictly below M_TOV ⇒ the neutron-star band is non-empty.
ck('gates ordered: M_CH < M_TOV (neutron-star band non-empty)  [' + M_CH + ' < ' + M_TOV + ']',
   M_CH < M_TOV);
ck('neutron-star band non-empty: midpoint of the band classifies as neutron-star  [' +
   classify((M_CH + M_TOV) / 2) + ']',
   classify((M_CH + M_TOV) / 2) === 'neutron-star');

// the three canonical anchors land where they should (a sanity sweep of representative masses).
ck('anchors: 0.6→dwarf, 1.0→dwarf, 1.8→ns, 2.8→bh', (() =>
   classify(0.6) === 'white-dwarf' && classify(1.0) === 'white-dwarf' &&
   classify(1.8) === 'neutron-star' && classify(2.8) === 'black-hole')());

// FATES order is the violence ladder (dwarf < ns < bh) the monotone claim rests on.
ck('FATES order is [white-dwarf, neutron-star, black-hole]',
   FATES[0] === 'white-dwarf' && FATES[1] === 'neutron-star' && FATES[2] === 'black-hole');

// DOMAIN GUARD — a non-physical mass throws RangeError (no silent garbage fate).
function throwsRange(fn){ try { fn(); return false; } catch(e){ return e instanceof RangeError; } }
ck('domain guard: classify(NaN) throws RangeError', throwsRange(() => classify(NaN)));
ck('domain guard: classify(-1) throws RangeError', throwsRange(() => classify(-1)));
ck('domain guard: classify(Infinity) throws RangeError', throwsRange(() => classify(Infinity)));
ck('domain guard: classify("2") throws RangeError (not a number)', throwsRange(() => classify('2')));
ck('domain guard: classify(0) is allowed (a massless remnant is a white dwarf)',
   (() => { try { return classify(0) === 'white-dwarf'; } catch(e){ return false; } })());

// ── (c) the alwaysNeutron NEGATIVE CONTROL provably FAILS both flip pairs ──
ck('NEGATIVE CONTROL: alwaysNeutron fails the Chandrasekhar flip (says neutron-star where real says white-dwarf)', (() => {
  const foil = alwaysNeutron(1.43);          // 'neutron-star'
  const real = classify(1.43);               // 'white-dwarf'
  return foil === 'neutron-star' && real === 'white-dwarf' && foil !== real;
})());
ck('NEGATIVE CONTROL: alwaysNeutron fails the TOV flip (says neutron-star where real says black-hole)', (() => {
  const foil = alwaysNeutron(2.4);           // 'neutron-star'
  const real = classify(2.4);                // 'black-hole'
  return foil === 'neutron-star' && real === 'black-hole' && foil !== real;
})());
ck('NEGATIVE CONTROL: alwaysNeutron is mass-independent (same at 0.6 and 2.8 — a fake)',
   alwaysNeutron(0.6) === alwaysNeutron(2.8));

// ── (d) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== STELLAR-SCALES CORE (byte-identical to core.mjs) =====';
const END = '// ===== END STELLAR-SCALES CORE =====';
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
ck('byte-parity: STELLAR-SCALES CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: STELLAR-SCALES CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Scales of a Star\'s Death — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
