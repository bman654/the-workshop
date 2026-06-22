// Node twin for The Sultan's Suitors math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (asserted by the
// BYTE-TWIN PARITY block at the bottom), so the page's self-test and this test can't drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  mulberry32, randomPermutation, runPolicy,
  pWinClosed, optimalK, enumerateWins, simulateWins
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }
const near = (a, b, eps = 1e-12) => Math.abs(a - b) <= eps;

// ── (a) CLOSED FORM === BRUTE-FORCE ENUMERATION, EXACTLY, over all n! orderings (n=3..9, every k). ──
//   This is the heart: the algebraic P(k,n) and the count over every permutation agree to 1e-12.
let enumChecks = 0;
for (let n = 3; n <= 9; n++) {
  for (let k = 0; k < n; k++) {
    const e = enumerateWins(n, k);
    ck(`enum===closed n=${n} k=${k}`, near(e.p, pWinClosed(k, n), 1e-12));
    enumChecks++;
  }
}

// ── (b) k=0 NEGATIVE CONTROL wins EXACTLY 1/n (no look = pure luck) — certified by enumeration. ──
for (let n = 3; n <= 9; n++) {
  ck(`k=0 enum===1/n n=${n}`, near(enumerateWins(n, 0).p, 1 / n, 1e-12));
  ck(`k=0 closed===1/n n=${n}`, near(pWinClosed(0, n), 1 / n, 1e-12));
}

// ── (c) the ARGMAX sits within 1 of round(n/e) for n=6..30. ──
for (let n = 6; n <= 30; n++) {
  const ok = optimalK(n).k;
  ck(`argmax≈round(n/e) n=${n}`, Math.abs(ok - Math.round(n / Math.E)) <= 1);
}

// ── (d) the optimal win-prob → 1/e from above as n grows. ──
ck('opt(50)>1/e', optimalK(50).p > 1 / Math.E);
ck('opt(200)→1/e within 0.006', Math.abs(optimalK(200).p - 1 / Math.E) < 0.006);
ck('opt(200)>=1/e (limit from above)', optimalK(200).p >= 1 / Math.E - 1e-12);

// ── (e) the optimal policy STRICTLY beats k=0 luck for every n≥3 (looking is never worse). ──
for (let n = 3; n <= 30; n++) {
  ck(`opt>luck n=${n}`, optimalK(n).p > 1 / n + 1e-12);
}

// ── (f) the MONTE-CARLO simulator agrees with the closed form (statistical, generous band). ──
const rng = mulberry32(0xC0FFEE);
let simChecks = 0;
for (const [n, k] of [[9, 3], [12, 4], [20, 7]]) {
  const s = simulateWins(n, k, 30000, rng);
  ck(`sim≈closed n=${n} k=${k}`, Math.abs(s - pWinClosed(k, n)) < 0.02);
  simChecks++;
}

// ── (g) runPolicy invariants: chosenSeat/bestSeat in range, won consistent, forced ⇒ last seat. ──
const rng2 = mulberry32(7);
let policyOK = true;
for (let t = 0; t < 5000; t++) {
  const n = 4 + (t % 12);
  const arr = randomPermutation(n, rng2);
  const r = runPolicy(arr, Math.floor(n / Math.E));
  if (!(r.chosenSeat >= 0 && r.chosenSeat < n && r.bestSeat >= 0 && r.bestSeat < n
        && r.won === (r.chosenSeat === r.bestSeat)
        && (!r.forced || r.chosenSeat === n - 1))) { policyOK = false; break; }
}
ck('runPolicy invariants hold over 5000 random courts', policyOK);

// ── (h) randomPermutation is a true permutation of 0..n-1 (no dup/missing). ──
let permOK = true;
const rng3 = mulberry32(123);
for (let t = 0; t < 2000; t++) {
  const n = 3 + (t % 18);
  const a = randomPermutation(n, rng3);
  const seen = new Uint8Array(n);
  for (const v of a) { if (v < 0 || v >= n || seen[v]) { permOK = false; break; } seen[v] = 1; }
  if (!permOK) break;
}
ck('randomPermutation yields a valid permutation', permOK);

// ── (i) mulberry32 is deterministic from a seed (same seed → same stream). ──
{
  const a = mulberry32(999), b = mulberry32(999);
  let det = true; for (let i = 0; i < 1000; i++) if (a() !== b()) { det = false; break; }
  ck('mulberry32 deterministic per seed', det);
}

// ── (j) BYTE-TWIN PARITY — coreRegion(core.mjs) === coreRegion(index.html), character-identical. ──
function coreRegion(path) {
  const src = readFileSync(path, 'utf8');
  const a = src.indexOf('// === CORE BEGIN ===');
  const b = src.indexOf('// === CORE END ===');
  if (a < 0 || b < 0) return null;
  return src.slice(a, b + '// === CORE END ==='.length);
}
const fromCore = coreRegion(join(__dirname, 'core.mjs'));
let fromPage = null;
try { fromPage = coreRegion(join(__dirname, 'index.html')); } catch (e) { fromPage = null; }
ck('byte-twin: CORE BEGIN..END found in core.mjs', !!fromCore);
ck('byte-twin: CORE BEGIN..END found in index.html', !!fromPage);
ck('byte-twin: inlined core is CHARACTER-IDENTICAL to core.mjs', !!fromCore && fromCore === fromPage);

// ── report ──
console.log("The Sultan's Suitors core.test.mjs");
console.log(`  closed===enumeration: ${enumChecks} (n,k) pairs over all n! orderings, n=3..9`);
console.log(`  n=20: optimal look k=${optimalK(20).k} (round(n/e)=${Math.round(20 / Math.E)}) · ` +
  `P(win)=${optimalK(20).p.toFixed(4)}`);
console.log(`  n=200: P(win)=${optimalK(200).p.toFixed(5)} → 1/e=${(1 / Math.E).toFixed(5)}`);
console.log(`  Monte-Carlo: ${simChecks} (n,k) settings agree with the closed form within 0.02`);
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
