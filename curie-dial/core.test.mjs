// Node twin for The Curie Dial. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the claim — honest for a finite 48×48 torus (the TREND + the two limits, NEVER a
// knife-edge Tc) — and verifies the flat-always-ordered negative control PROVABLY FAILS the
// high-T-collapse leg:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest:
//         · SEPARATION: a low band high, a high band collapsed, gap wide,
//         · MONOTONE collapse of ⟨|M|⟩ + monotone RISE of wall-density across the ladder,
//         · the TWO HARD LIMITS (T→0 ⇒ 1, T→∞ ⇒ 0),
//         · sanity: dE = 2·s·Σnb is in {−8,−4,0,4,8}; a cold all-up grid has wall-density 0;
//   (c) the flatAlwaysOrdered NEGATIVE CONTROL goes red — it stays HIGH at high T where the
//       real core collapses (assert the FAILING condition explicitly);
//   (d) DETERMINISM: same SEED + same sweeps ⇒ byte-equal Int8Array;
//   (e) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  TC, N_DEFAULT, SEED, LADDER,
  mulberry32, makeGrid, coldGrid, sweep,
  avgMabs, wallMask, wallDensity, avgWallDensity,
  flatAlwaysOrdered, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

const N = N_DEFAULT;

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// SEPARATION: an independent low/high probe (different temperatures & burn than the self-test).
// NB: T=1.6 at this seed freezes into a metastable STRIPE (a torus-spanning band, ⟨|M|⟩≈0.16,
// stable past 2000 sweeps) — exactly the critical-slowing-down honesty the claim documents. So
// the claim is the WIDE low-vs-high separation, not M at any single fragile near-critical T; we
// probe a robust low T here.
const mLow = avgMabs(N, 1.7, { burn: 1100, samples: 30, gap: 4 });
const mHigh = avgMabs(N, 4.5, { burn: 700, samples: 30, gap: 4 });
ck('separation: ⟨|M|⟩(1.7) > 0.7 and ⟨|M|⟩(4.5) < 0.15 and gap > 0.6  [low=' +
   mLow.toFixed(3) + ' high=' + mHigh.toFixed(3) + ']',
   mLow > 0.7 && mHigh < 0.15 && (mLow - mHigh) > 0.6);

// MONOTONE collapse of ⟨|M|⟩ across the canonical ladder (within finite-size tolerance).
const mLad = LADDER.map(T => avgMabs(N, T, { burn: 1000, samples: 30, gap: 4 }));
ck('monotone: ⟨|M|⟩ non-increasing across [' + LADDER.join(',') + ']  [' +
   mLad.map(v => v.toFixed(2)).join(',') + ']',
   (() => { for (let k = 1; k < mLad.length; k++) if (mLad[k] > mLad[k-1] + 0.03) return false; return true; })());

// the big drop straddles the Curie tick: M(2.0) far above M(3.0).
ck('big drop straddles Tc≈2.27: ⟨|M|⟩(2.0) − ⟨|M|⟩(3.0) > 0.5  [' +
   mLad[1].toFixed(2) + ' − ' + mLad[3].toFixed(2) + ']',
   (mLad[1] - mLad[3]) > 0.5);

// MONOTONE RISE of wall-density (the mirror witness) across the same ladder.
const wLad = LADDER.map(T => avgWallDensity(N, T, { burn: 1000, samples: 30, gap: 4 }));
ck('mirror: wall-density non-decreasing across [' + LADDER.join(',') + ']  [' +
   wLad.map(v => v.toFixed(2)).join(',') + ']',
   (() => { for (let k = 1; k < wLad.length; k++) if (wLad[k] < wLad[k-1] - 0.03) return false; return true; })());

// TWO HARD LIMITS — deep cold saturates (from the ground state, the T→0 equilibrium),
// infinite heat erases order (from random — T→∞ wins regardless of start).
const mCold = avgMabs(N, 0.1, { burn: 200, samples: 12, gap: 2, start: 'cold' });
const mHot = avgMabs(N, 50, { burn: 200, samples: 12, gap: 2 });
ck('limit T→0: ⟨|M|⟩(0.1) > 0.95  [' + mCold.toFixed(3) + ']', mCold > 0.95);
ck('limit T→∞: ⟨|M|⟩(50) < 0.05  [' + mHot.toExponential(2) + ']', mHot < 0.05);

// SANITY: the Metropolis energy change dE = 2·s·Σnb only ever takes values in {−8,−4,0,4,8}.
ck('dE = 2·s·Σ(4 neighbours) ∈ {−8,−4,0,4,8} on a torus', (() => {
  const rng = mulberry32(123);
  const g = makeGrid(N, rng);
  const allowed = new Set([-8, -4, 0, 4, 8]);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++){
    const sij = g[i*N+j];
    const nb = g[((i-1+N)%N)*N+j] + g[((i+1)%N)*N+j] + g[i*N+((j-1+N)%N)] + g[i*N+((j+1)%N)];
    if (!allowed.has(2*sij*nb)) return false;
  }
  return true;
})());

// SANITY: a cold all-up grid has wall-density exactly 0 (one solid domain, no seams).
ck('coldGrid has wall-density === 0 (one solid domain)', wallDensity(coldGrid(N), N) === 0);

// SANITY: a hot random grid has substantial wall-density (≈ 0.5 of cells on a seam).
ck('a hot random grid has wall-density > 0.3 (seams everywhere)', (() => {
  const rng = mulberry32(7);
  return wallDensity(makeGrid(N, rng), N) > 0.3;
})());

// the Curie tick is the 2-D analytic scale Tc = 2/ln(1+√2) ≈ 2.2692.
ck('Tc === 2/ln(1+√2) ≈ 2.2692 (the dial landmark)', Math.abs(TC - 2.269185314) < 1e-6);

// ── (c) the flatAlwaysOrdered NEGATIVE CONTROL goes RED — assert the failing condition ──
ck('NEGATIVE CONTROL: flatAlwaysOrdered stays HIGH (≈1) at high T where the real core collapses', (() => {
  const flat = flatAlwaysOrdered(N, 5.0);
  const real = avgMabs(N, 5.0, { burn: 600, samples: 20, gap: 4 });
  return flat > 0.95 && real < 0.15 && (flat - real) > 0.8;   // they DISAGREE — not vacuous
})());
ck('NEGATIVE CONTROL: flatAlwaysOrdered is T-independent (same at low and high T — a fake)', (() => {
  return flatAlwaysOrdered(N, 0.5) === flatAlwaysOrdered(N, 9.0);
})());

// ── (d) DETERMINISM: same SEED + same sweeps ⇒ byte-equal lattice ──
ck('determinism: same SEED + same sweeps ⇒ byte-equal Int8Array', (() => {
  const run = () => {
    const rng = mulberry32(SEED);
    const g = makeGrid(N, rng);
    sweep(g, N, 2.3, 50, rng);
    return g;
  };
  const a = run(), b = run();
  if (a.length !== b.length) return false;
  for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return false;
  return true;
})());

// ── (e) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== CURIE-DIAL CORE (byte-identical to core.mjs) =====';
const END = '// ===== END CURIE-DIAL CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
// indentation-normalized comparison: strip leading/trailing whitespace per line and drop blank
// lines, so a page that indents the inlined core inside a closure still matches the module body.
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: CURIE-DIAL CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: CURIE-DIAL CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Curie Dial — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
