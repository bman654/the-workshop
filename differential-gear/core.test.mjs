// The Differential Gear — the Node twin. runSelfTest() is the SOLE oracle (the page
// calls the SAME code). This twin (A) runs the six self-test checks and prints
// passed/total + one PASS/FAIL line per check; (B) adds stronger rigour — a dense 1e5
// randomized sweep through all three Willis solve-directions plus the two affine
// properties that are the SIGNATURE of a true mean (homogeneity + translation); and
// (C) byte-parity-checks the law slab inlined into index.html against core.mjs,
// sentinel-to-sentinel. Zero deps (node:fs + node:path only). Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the six self-test checks (the page's in-page pill runs this exact function) ──
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// ── (B) extra rigour: a dense 1e5 randomized sweep, incl. extremes (1e±6, tiny diffs) ──
// All three Willis solve-directions must agree to <1e-12, AND the carrier must satisfy
// the two affine identities that DEFINE a mean:
//   homogeneity:  carrier(a·ωL, a·ωR) === a·carrier(ωL, ωR)
//   translation:  carrier(ωL+d, ωR+d) === carrier(ωL, ωR) + d
// A weighted or biased "average" would still be affine, so we ALSO assert the carrier
// equals the unweighted half-sum (the equal-tooth claim) over the same sweep.
{
  const EPS = 1e-12;
  let mt = Math.PI * 137.5;
  const rnd = () => { mt = (mt * 16807) % 2147483647; return mt / 2147483647; };
  const pick = () => {
    const u = rnd();
    if (u < 0.15) return (rnd() - 0.5) * 2e6;        // huge magnitudes ~1e6
    if (u < 0.30) return (rnd() - 0.5) * 2e-6;       // tiny magnitudes ~1e-6
    return (rnd() - 0.5) * 2000;                     // ordinary
  };
  // RELATIVE tolerance scaled to magnitude — "machine-exact" means error ~ a few ULPs of
  // the operands, NOT a fixed absolute floor across 12 orders of magnitude. A weighted or
  // biased mean would miss by O(1) relative; round-off sits at ~1e-13 relative.
  const REL = 1e-12;
  let dirErr = 0, halfErr = 0, homoErr = 0, transErr = 0, n = 0;
  for (let i = 0; i < 100000; i++) {
    const wL = pick(), wR = pick();
    const wc = core.carrierFromSuns(wL, wR);
    const scaleLR = Math.abs(wL) + Math.abs(wR) + 1;
    // three-direction agreement via back-substitution (relative to operand magnitude)
    dirErr = Math.max(dirErr,
      Math.abs(core.sunRfromCarrierSunL(wc, wL) - wR) / scaleLR,
      Math.abs(core.sunLfromCarrierSunR(wc, wR) - wL) / scaleLR);
    // equal-tooth claim: carrier === unweighted half-sum (this stays bit-exact)
    halfErr = Math.max(halfErr, Math.abs(wc - core.halfSum(wL, wR)));
    // affine signature of a true mean
    const a = (rnd() - 0.5) * 10, d = (rnd() - 0.5) * 1000;
    const scaled = core.carrierFromSuns(a * wL, a * wR);
    homoErr = Math.max(homoErr, Math.abs(scaled - a * wc) / (Math.abs(a * wc) + 1));
    const shifted = core.carrierFromSuns(wL + d, wR + d);
    transErr = Math.max(transErr, Math.abs(shifted - (wc + d)) / (Math.abs(wc + d) + Math.abs(d) + 1));
    n++;
  }
  line(dirErr < REL,  'B1 · 1e5 sweep: three Willis directions agree (rel)  ::  max rel|Δ|=' + dirErr.toExponential(2) + ' (' + n + ' pts)');
  line(halfErr < EPS, 'B2 · 1e5 sweep: carrier === ½(ωL+ωR) bit-exact (equal-tooth)  ::  max|Δ|=' + halfErr.toExponential(2));
  line(homoErr < REL, 'B3 · homogeneity carrier(a·ωL,a·ωR)===a·carrier  ::  max rel|Δ|=' + homoErr.toExponential(2));
  line(transErr < REL, 'B4 · translation carrier(ωL+d,ωR+d)===carrier+d  ::  max rel|Δ|=' + transErr.toExponential(2));
}

// ── (C) BYTE-PARITY: the law slab inlined into index.html === core.mjs's slab, sentinel-to-sentinel ──
// Enforces the anti-drift convention the page advertises: one law, no second copy.
{
  const START = '// === DIFF-CORE BEGIN ===';
  const END = '// === DIFF-CORE END ===';
  const slab = (text) => {
    const i = text.indexOf(START);
    const j = text.indexOf(END);
    if (i < 0 || j < 0) return null;
    return text.slice(i, j + END.length);
  };
  const modBlock = slab(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const htmlBlock = slab(readFileSync(join(here, 'index.html'), 'utf8'));
  const ok = modBlock !== null && htmlBlock !== null && modBlock === htmlBlock;
  line(ok, 'C · law slab inlined in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' bytes vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
