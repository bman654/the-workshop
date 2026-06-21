// ============================================================================
//  Node twin for THE BOOTSTRAP BENCH core (1-D FDTD / Yee electromagnetic wave).
//  Zero-dep.  Run:  node bootstrap-bench/core.test.mjs  (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIMS a SECOND way, not merely that the code runs:
//   [shared] runs the SAME runSelfTest() the in-page pill runs and mirrors its
//            verdict here, so the twin and the pill can never diverge.
//   (1) ENERGY conserved — independently re-integrate a closed periodic field and
//       confirm the conserved leapfrog Hamiltonian drifts < 1e-9 (machine round-off).
//   (2) FRONT SPEED = 1/√(μ₀ε₀) — re-measure the half-max envelope crossing over a
//       sweep of BOTH μ₀,ε₀, agreeing to a STATED discretisation bound (< 5e-3).
//       This is a MEASUREMENT on a discrete grid, NOT a machine-ε identity.
//   (3) ONE PULSE — a single flick is exactly one right-mover: leftward energy ≈ 0,
//       L2 shape correlation > 0.999 held to the absorbing edge, reflection < 1e-3.
//   (4) ε₀ DOUBLING — c scales by EXACTLY 1/√2, an algebraic identity to machine-ε
//       (kept SEPARATE from the measured speed claim — different KIND of claim).
//   (NEG-a) FREEZE THE CURL — zero the Faraday leg and the front does NOT advance.
//   (NEG-b) OVER-c CHEAT — dt past the Courant limit and the energy blows up (RED).
//   (CFL) the dt the dials pick is ALWAYS ≤ the Courant limit across the dial range.
//   (BYTE-TWIN) index.html's inlined BOOTSTRAP-BENCH CORE slab is byte-identical
//       (indentation-normalised) to core.mjs — the anti-drift contract.
// ============================================================================

import {
  VACUUM, GRID,
  cflLimit, stableDt, lightSpeed,
  makeField, launch, seedClosed, stepField,
  totalEnergy, energyLeftRight, measureFrontSpeed,
  energyDriftClosed, speedDefect, onePulseCheck, epsDoublingRatio,
  overCourantBlowup, frozenCurlAdvance,
  runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EPS = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// ── run the SAME runSelfTest() the page's pill runs; mirror its verdict here so the
//    twin and the in-page pill can never diverge. ───────────────────────────────
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('shared runSelfTest() overall green', r.ok, r.passed + '/' + r.total);
}

// ── (1) ENERGY conserved — re-integrate independently of runSelfTest ──────────
{
  const e = energyDriftClosed(6000);
  check('(1) energy conserved on a closed/periodic run: drift < 1e-9 over 6000 steps (symplectic)',
    e.drift < EPS, 'max relative drift ' + e.drift.toExponential(2));

  // a hand-rolled closed run, confirming the conserved Hamiltonian is FLAT step-to-step
  // (a different seed, longer run) — energy is genuinely the leapfrog invariant.
  const f = makeField({ bc: 'periodic' });
  seedClosed(f, f.N * 0.4, 22, 0.8);
  const U0 = totalEnergy(f);
  let worst = 0;
  for (let s = 0; s < 3000; s++){ stepField(f); worst = Math.max(worst, Math.abs(totalEnergy(f) - U0) / U0); }
  check('(1b) independent closed run (different seed): conserved U flat to round-off',
    worst < EPS, 'worst rel drift ' + worst.toExponential(2));
}

// ── (2) FRONT SPEED = 1/√(μ₀ε₀) — re-measure over a sweep, stated discretisation bound
{
  const TOL = 5e-3;
  let worst = 0, allOK = true;
  const grid = [[0.5, 0.5], [0.5, 2.0], [1.0, 1.0], [2.0, 0.5], [2.0, 2.0], [1.3, 0.7]];
  for (const [mu0, eps0] of grid){
    const r = speedDefect(mu0, eps0);
    if (!r.ok){ allOK = false; continue; }
    worst = Math.max(worst, r.rel);
  }
  check('(2) measured front speed = 1/√(μ₀ε₀) over a μ₀×ε₀ sweep (discretisation bound < 5e-3 — a MEASUREMENT)',
    allOK && worst < TOL, 'worst relative defect ' + worst.toExponential(2) + ' (tol 5e-3)');

  // sanity: a SLOWER vacuum measures a SLOWER front (the dials really move the speed).
  const slow = speedDefect(2.0, 2.0).measured;   // c = 1/2
  const fast = speedDefect(0.5, 0.5).measured;   // c = 2
  check('(2b) the dials move the measured speed: slower vacuum ⇒ slower front (c=0.5 vs c=2.0)',
    slow < fast && Math.abs(slow - 0.5) < 0.05 && Math.abs(fast - 2.0) < 0.05,
    'measured slow ' + slow.toFixed(4) + ' (≈0.5), fast ' + fast.toFixed(4) + ' (≈2.0)');
}

// ── (3) ONE PULSE — one flick is exactly one right-mover ──────────────────────
{
  const p = onePulseCheck();
  check('(3) one flick ⇒ exactly ONE right-mover: leftward energy ≈ 0, reflection < 1e-3',
    p.leftFrac < 1e-3 && p.reflection < 1e-3,
    'leftFrac ' + p.leftFrac.toExponential(2) + ' reflect ' + p.reflection.toExponential(2));
  check('(3b) the pulse holds its L2 shape to the absorbing edge (correlation > 0.999)',
    p.corr > 0.999, 'L2 shape-corr ' + p.corr.toFixed(5));
}

// ── (4) ε₀ DOUBLING — c × 1/√2 EXACTLY (algebraic identity, machine-ε) ─────────
{
  let worst = 0;
  for (const mu0 of [0.3, 1.0, 2.7]){
    for (const eps0 of [0.2, 1.0, 3.1]){
      worst = Math.max(worst, Math.abs(epsDoublingRatio(mu0, eps0) - 1 / Math.sqrt(2)));
    }
  }
  check('(4) doubling ε₀ scales c by EXACTLY 1/√2 — algebraic identity to machine-ε (the EXACT claim)',
    worst < 1e-15, 'worst |ratio − 1/√2| ' + worst.toExponential(2));

  // and the closed-form speed really is 1/√(μ₀ε₀): spot-check a few points by hand.
  let chk = 0;
  for (const [mu0, eps0] of [[4, 1], [1, 9], [2, 2]]){
    chk = Math.max(chk, Math.abs(lightSpeed({ mu0, eps0 }) - 1 / Math.sqrt(mu0 * eps0)));
  }
  check('(4b) lightSpeed === 1/√(μ₀ε₀) exactly (the closed form the dials drive)',
    chk < 1e-15, 'worst |Δ| ' + chk.toExponential(2));
}

// ── (NEG-a) FREEZE THE CURL ⇒ front does NOT advance ──────────────────────────
{
  const fc = frozenCurlAdvance(6000);
  check('(NEG-a) FREEZE THE CURL: zero ∂B/∂t ⇒ the front does NOT advance (no propagation)',
    fc.advanced < 2, 'front moved ' + fc.advanced + ' cells in 6000 steps (frozen)');

  // contrast: the SAME pulse with the curl LIVE marches downfield — proving the
  // neg-control isolates the Faraday coupling, not some other freeze.
  const live = makeField({ bc: 'mur' });
  launch(live, 120, 14, 1.0);
  for (let s = 0; s < 600; s++) stepField(live);
  let pv = 0, pc = 0;
  for (let i = 0; i < live.N; i++){ if (Math.abs(live.Ey[i]) > pv){ pv = Math.abs(live.Ey[i]); pc = i; } }
  check('(NEG-a′) with the curl LIVE the same launch DOES march downfield (coupling isolated)',
    pc - 120 > 200, 'front moved ' + (pc - 120) + ' cells in 600 steps (live)');
}

// ── (NEG-b) OVER-c CHEAT ⇒ energy blows up ────────────────────────────────────
{
  const ob = overCourantBlowup(1.06);
  check('(NEG-b) OVER-c CHEAT: dt past the Courant limit ⇒ energy blows up (CFL violated, RED)',
    ob.blewUp, 'U max/U₀ = ' + (Number.isFinite(ob.ratio) ? ob.ratio.toExponential(2) : '∞'));

  // and JUST BELOW the limit it is stable (the cliff is real, at courant = 1).
  const safe = overCourantBlowup(0.98);
  check('(NEG-b′) just BELOW the Courant limit (courant 0.98) the run stays bounded',
    !safe.blewUp && Number.isFinite(safe.ratio), 'U max/U₀ = ' + safe.ratio.toExponential(2));
}

// ── (CFL) the dt the dials pick is ALWAYS ≤ the Courant limit over the dial range ─
{
  let allUnder = true, worst = 0;
  for (let mu0 = 0.4; mu0 <= 2.6; mu0 += 0.2){
    for (let eps0 = 0.4; eps0 <= 2.6; eps0 += 0.2){
      const grid = { ...GRID };
      const vac = { mu0, eps0 };
      const dt = stableDt(grid, vac, GRID.courant);
      const lim = cflLimit(grid.dx, mu0, eps0);
      if (dt > lim){ allUnder = false; }
      worst = Math.max(worst, dt / lim);
    }
  }
  check('(CFL) the operable dt = courant·CFL stays ≤ the Courant limit across the WHOLE μ₀×ε₀ dial range',
    allUnder && worst <= GRID.courant + 1e-12, 'worst dt/limit = ' + worst.toFixed(3) + ' (≤ courant ' + GRID.courant + ')');
}

// ── BYTE-TWIN PARITY: the page's inlined BOOTSTRAP-BENCH CORE slab === core.mjs ─
const here = dirname(fileURLToPath(import.meta.url));
{
  const BEGIN = '// === BOOTSTRAP-BENCH CORE BEGIN ===';
  const END = '// === BOOTSTRAP-BENCH CORE END ===';
  function region(text){
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    return text.slice(i + BEGIN.length, j);
  }
  function norm(s){
    return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
  }
  const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  let pageRegion = null;
  try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
  check('byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
  check('byte-parity: index.html inlined core === core.mjs (indentation-normalised)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion ? ('chars ' + (pageRegion ? norm(pageRegion).length : 0) + ' vs ' + (coreRegion ? norm(coreRegion).length : 0)) : 'index.html not built yet (run forge)');
}

console.log('\nThe Bootstrap Bench — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
