// ============================================================================
//  Node twin for THE LIGHT THAT FALLS AROUND A STAR core (gravitational light
//  deflection, weak-field optical analog). Zero-dep.
//  Run:  node starlight-bend/core.test.mjs   (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIM, not merely that the code runs:
//   (1) NUMERIC == WEAK-FIELD — the tan-substitution Simpson integral of the
//       transverse deflection field equals the closed form α = 4GM/(c²b) = 2r_s/b
//       to <1e-6 over a grid of b∈{0.3..13}×r_s∈{0.5,1,2}, the famous 1.7515″ solar
//       grazing value falls out, AND the integrator is fourth-order (err(N)/err(2N)≈16).
//   (2) 2M ⇒ 2α EXACT — doubling the mass doubles the deflection to machine-ε
//       (numeric ratio − 2 < 1e-9), making the room's mass-dial crux tactile.
//   (3) rs=0 ⇒ α=0 EXACTLY and bendRay is dead-straight (the M→0 neg-control).
//   (4) PICTURE == PROOF — bendRay(b,rs).alpha === alphaWeak(rs,b) to <1e-6, and the
//       drawn polyline's endpoint slope === that same α. The line you SEE is the
//       deflection the math computes; there is no second cosmetic path.
//   (5) BYTE-TWIN PARITY — index.html's inlined STARLIGHT-BEND CORE slab is
//       byte-identical (indentation-normalised) to core.mjs.
//   (6) CROSS-LINK — feeding THIS core's Eddington index field n(r)=1+2GM/rc² into
//       refraction-run's least-time solver conserves the SAME Bouguer invariant
//       n·sinθ to machine-ε: the two least-time roads obey one conserved law, proven
//       WITHOUT rebuilding the invariant (import bouguerInvariant unforked).
//   (7) θ_E ∝ √M — the ring-radius scaling shared (register-only) with einstein-ring.
// ============================================================================

import {
  alphaWeak, alphaNumeric, dPhiDb, schwarzschildRadius, alphaSolarGrazing,
  bendRay, thetaEinstein, indexAt, runSelfTest, SUN,
} from './core.mjs';
import { solveFermat, bouguerInvariant } from '../refraction-run/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail) {
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// ── run the SAME runSelfTest() the page's pill runs; mirror its verdict here so
//    the twin and the in-page pill can never diverge. ──────────────────────────
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('shared runSelfTest() overall green', r.allPass, r.passed + '/' + r.total);
}

// ── (1) NUMERIC == WEAK-FIELD across the grid + solar + convergence order ───────
{
  let worst = 0;
  const bs = [0.3, 1, 2.5, 6, 13], rss = [0.5, 1, 2];
  for (const bb of bs) for (const rs of rss) {
    const b = bb * rs;
    const rel = Math.abs(alphaNumeric(rs, b, 64) - alphaWeak(rs, b)) / alphaWeak(rs, b);
    worst = Math.max(worst, rel);
  }
  const solar = alphaSolarGrazing();
  // fourth-order: doubling N drops the error ~16×
  const e1 = Math.abs(alphaNumeric(1, 2, 16) - alphaWeak(1, 2));
  const e2 = Math.abs(alphaNumeric(1, 2, 32) - alphaWeak(1, 2));
  const ratio = e2 > 0 ? e1 / e2 : Infinity;
  check('(1) numeric α ≈ 2GM/c²b (<1e-6 over the grid) · solar grazing = 1.7515″ · Simpson 4th-order',
    worst < 1e-6 && Math.abs(solar - 1.7515) < 0.01 && ratio > 8,
    'worst rel ' + worst.toExponential(2) + ' · solar ' + solar.toFixed(4) + '″ · err ratio '
    + (isFinite(ratio) ? ratio.toFixed(1) : '∞') + '×');
}

// ── (1b) the Schwarzschild radius + solar grazing are physically what we claim ──
{
  const rsSun = schwarzschildRadius(SUN ? 6.674e-11 : 0, 1.989e30, 2.998e8);  // 2GM⊙/c²
  // r_s,⊙ ≈ 2954 m
  check('(1b) r_s,⊙ = 2GM⊙/c² ≈ 2954 m (the solar Schwarzschild radius)',
    Math.abs(rsSun - 2954) < 30, 'r_s,⊙ = ' + rsSun.toFixed(0) + ' m');
}

// ── (2) 2M ⇒ 2α EXACT ───────────────────────────────────────────────────────────
{
  let worst = 0;
  for (const b of [0.5, 1, 2, 5]) {
    worst = Math.max(worst, Math.abs(alphaNumeric(2, b, 64) / alphaNumeric(1, b, 64) - 2));
    worst = Math.max(worst, Math.abs(alphaWeak(2, b) / alphaWeak(1, b) - 2));
  }
  check('(2) doubled mass ⇒ doubled deflection (numeric ratio − 2 < 1e-9)',
    worst < 1e-9, 'worst |ratio−2| ' + worst.toExponential(2));
}

// ── (3) rs=0 ⇒ α=0 EXACT and bendRay dead-straight (M→0 neg-control) ────────────
{
  const ray = bendRay(2, 0, { N: 300 });
  let maxDev = 0;
  for (const p of ray.points) maxDev = Math.max(maxDev, Math.abs(p[1] - 2));
  check('(3) rs=0 ⇒ α=0 exactly AND bendRay dead-straight (max transverse dev < 1e-9)',
    alphaWeak(0, 2) === 0 && alphaNumeric(0, 2, 64) === 0 && Math.abs(ray.alpha) < 1e-9 && maxDev < 1e-9,
    'α ' + ray.alpha.toExponential(1) + ' · max dev ' + maxDev.toExponential(2));
}

// ── (4) PICTURE == PROOF — the drawn ray IS the integrated deflection ───────────
{
  let worstA = 0, worstSlope = 0;
  for (const [rs, b] of [[1, 2], [2, 3], [0.5, 4], [1, 6], [0.8, 10]]) {
    const ray = bendRay(b, rs, { N: 480 });
    const aw = alphaWeak(rs, b);
    worstA = Math.max(worstA, Math.abs(ray.alpha - aw) / aw);
    const n = ray.points.length;
    const p0 = ray.points[n - 2], p1 = ray.points[n - 1];
    const slope = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    worstSlope = Math.max(worstSlope, Math.abs(Math.abs(slope) - aw) / aw);
  }
  check('(4) picture==proof: bendRay.alpha === alphaWeak (<1e-6) AND drawn endpoint slope === α (<1e-3)',
    worstA < 1e-6 && worstSlope < 1e-3,
    'worst |α−weak| ' + worstA.toExponential(2) + ' · worst slope err ' + worstSlope.toExponential(2));
}

// ── (4b) the deflection field has the right sign + shape (bends TOWARD the mass) ─
{
  // dPhiDb < 0 (the gradient pulls the ray inward toward the mass at the origin). The
  // ray enters at offset +b; downstream of closest approach its transverse offset y
  // must FALL (the ray bends toward y=0, the mass), and the outgoing heading is
  // negative (asymptoteOut = −alpha). Sample two finite downstream points (not the
  // extreme tan-window endpoint, where x is astronomically large).
  const ray = bendRay(2, 1, { N: 300 });
  const n = ray.points.length;
  const pNear = ray.points[Math.floor(n * 0.55)];   // just past closest approach
  const pFar = ray.points[Math.floor(n * 0.85)];    // further downstream (still finite)
  // the marched outgoing heading approaches −α as the drawn window widens (it is the
  // finite-window slope, not the exact full-line limit), so we assert it is CLOSE.
  check('(4b) sign sanity: dPhiDb<0 (toward mass), the bent ray pulls toward y=0 downstream, outgoing heading ≈ −α',
    dPhiDb(1, 1, 2) < 0 && pFar[1] < pNear[1] && ray.alpha > 0 && Math.abs(ray.asymptoteOut + ray.alpha) < 1e-3,
    'dPhiDb ' + dPhiDb(1, 1, 2).toExponential(2) + ' · y falls ' + pNear[1].toFixed(2) + '→' + pFar[1].toFixed(2)
    + ' · asymOut ' + ray.asymptoteOut.toFixed(4) + ' vs −α ' + (-ray.alpha).toFixed(4));
}

// ── (5) BYTE-TWIN PARITY: index.html's inlined slab === core.mjs slab ───────────
const here = dirname(fileURLToPath(import.meta.url));
{
  const BEGIN = '/* STARLIGHT-BEND CORE BEGIN';
  const END = '/* CORE END */';
  function region(text) {
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    // start the region AFTER the BEGIN marker's own line so the differing comment
    // tails around it never affect parity (we compare the code body only).
    const bodyStart = text.indexOf('\n', i);
    return text.slice(bodyStart, j);
  }
  function norm(s) {
    return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
  }
  const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  let pageRegion = null;
  try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
  check('(5) byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
  check('(5) byte-parity: index.html inlined core === core.mjs (norm)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion ? '' : 'index.html not built yet (run forge)');
}

// ── (6) CROSS-LINK: the Eddington index field, fed to refraction-run's least-time
//    solver, conserves the SAME Bouguer invariant n·sinθ (the two roads, one law) ──
{
  const rs = 1.0;
  // a symmetric well: radii dipping to a closest approach then rising, sampled as a
  // planar stratified stack whose per-layer indices ARE this core's n(r)=1+rs/r.
  const radii = [6, 4, 3, 2.4, 2.0, 2.4, 3, 4, 6];
  const n = radii.map(r => indexAt(rs, r));
  const ys = []; for (let i = 1; i < n.length; i++) ys.push(-2 + i * 0.5);
  const p = { src: [-3, -3.0], tgt: [3, ys[ys.length - 1] + 0.5], ys, n };
  const sol = solveFermat(p, { tol: 1e-13 });
  const inv = bouguerInvariant(p, sol.X);
  const mn = Math.min(...inv), mx = Math.max(...inv);
  const gmax = sol.grad.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
  check('(6) cross-link: Eddington index n(r)=1+2GM/rc² → refraction-run least-time path conserves Bouguer n·sinθ (<1e-9)',
    (mx - mn) < 1e-9 && gmax < 1e-9 && n.every(v => v > 1),
    'n·sinθ spread ' + (mx - mn).toExponential(2) + ' · |∇L| ' + gmax.toExponential(2));
}

// ── (7) θ_E ∝ √M (= √rs) — the ring-radius scaling shared with einstein-ring ────
{
  let worst = 0;
  for (const c of [2, 3, 4, 9]) worst = Math.max(worst, Math.abs(thetaEinstein(c * 1.5) / thetaEinstein(1.5) - Math.sqrt(c)));
  check('(7) θ_E ∝ √M: θ_E(c·rs)/θ_E(rs) = √c and θ_E(0) = 0',
    worst < 1e-12 && thetaEinstein(0) === 0, 'max |Δ| ' + worst.toExponential(2));
}

console.log('\nThe Light That Falls Around a Star — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
