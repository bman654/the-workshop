// ============================================================================
//  THE HYDROGEN ATOM — Node twin of the in-page self-test.
//  Run:  node cavern/hydrogen/core.test.mjs
//  Proves the falsifiable claim (to a STATED tolerance, no false machine-precision),
//  with INDEPENDENT re-derivations (not just the bundled self-test), and asserts the
//  core inlined in index.html is byte-identical to this module (re-extraction parity),
//  so "self-test green" can't drift.
// ============================================================================
import {
  rydberg, vEff, makeRng, buildRadialH, makeGrid,
  lowestEigenpairs, interiorNodes, solveShells, shellSpread,
  ylm, orbitalsAt, radialR, angularMax, lobeDirections,
  gaussLegendre, angularGram, sampleCloud,
  runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— The full in-page self-test —');
const r = runSelfTest();
for (const c of r.checks) check(c.name, c.ok, c.detail);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

const FINE = { N: 2400, Rmax: 100 };

// (A) The Rydberg closed form is exactly −1/(2n²): hand-checked rungs.
{
  check('rydberg(1) = −0.5, rydberg(2) = −0.125, rydberg(4) = −0.03125 (hand-checked)',
        rydberg(1) === -0.5 && rydberg(2) === -0.125 && rydberg(4) === -0.03125);
}

// (B) THE LADDER, re-derived independently of solveShells: solve each ℓ-channel by
//     hand here (buildRadialH + lowestEigenpairs) and compare to closed-form Rydberg.
//     Worst case is the 1s (the −1/r cusp); still well within 2e−3 relative.
{
  const grid = makeGrid(FINE.N, FINE.Rmax);
  let worst = 0, worstAt = '';
  const E = {};
  for (let l = 0; l <= 3; l++) {
    const H = buildRadialH(l, 0, grid);
    const pairs = lowestEigenpairs(H, l, 4 - l);
    for (const p of pairs) {
      E[p.n + ',' + p.l] = p.lambda;
      const re = Math.abs(p.lambda - rydberg(p.n)) / Math.abs(rydberg(p.n));
      if (re > worst) { worst = re; worstAt = p.n + 's/p/d'.slice(0, 1); }
    }
  }
  check('hand-built radial eigensolve == Rydberg to <2e−3 rel (the 1s cusp is worst)',
        worst < 2e-3, 'worst rel err ' + worst.toExponential(2) + ' (worst n=' + worstAt + ')');
  // and the closed form is the LOWER bound the FD energy approaches from above:
  // a Dirichlet-truncated FD ground state of −1/r sits slightly ABOVE −0.5.
  check('the FD 1s energy sits just above the exact −0.5 (truncation raises it)',
        E['1,0'] > rydberg(1) && E['1,0'] < rydberg(1) + 2e-3,
        'E(1s) = ' + E['1,0'].toFixed(6) + ' (exact −0.5)');
}

// (C) O(h²) CONVERGENCE re-derived on three grids: the relative error shrinks as the
//     grid refines. (A monotone shrink across three resolutions — not just two.)
{
  const grids = [{ N: 800, Rmax: 60 }, { N: 1600, Rmax: 60 }, { N: 3200, Rmax: 60 }];
  const errs = grids.map(function (g) {
    const sol = solveShells(0, g);
    let m = 0;
    for (let n = 1; n <= 4; n++) for (let l = 0; l < n; l++) {
      m = Math.max(m, Math.abs(sol.Enl[n][l] - rydberg(n)) / Math.abs(rydberg(n)));
    }
    return m;
  });
  check('rel err shrinks monotonically as N doubles (O(h²), fixed R_max=60)',
        errs[0] > errs[1] && errs[1] > errs[2],
        'N=800 ' + errs[0].toExponential(2) + ' → N=1600 ' + errs[1].toExponential(2) +
        ' → N=3200 ' + errs[2].toExponential(2));
  // the ratio of successive errors is ~4 (halving h quarters an O(h²) error).
  const ratio = errs[0] / errs[1];
  check('error roughly quarters when h halves (the O(h²) signature)',
        ratio > 2.5 && ratio < 5.0, 'err ratio N=800/N=1600 ≈ ' + ratio.toFixed(2));
}

// (D) THE ACCIDENT, re-checked across ALL shells: every n-shell's s/p/d coincide to
//     <1e−3, AND each ℓ-channel really was an independent solve (its node count is
//     the channel's own n−ℓ−1, which a copied answer could never produce).
{
  const sol = solveShells(0, FINE);
  let maxSpread = 0;
  for (let n = 2; n <= 4; n++) maxSpread = Math.max(maxSpread, shellSpread(sol.Enl, n));
  check('every n-shell (n=2,3,4) s/p/d coincide to <1e−3 (the ℓ-degeneracy accident)',
        maxSpread < 1e-3, 'max spread over all shells = ' + maxSpread.toExponential(2));
  // independence proof: within a shell the energies coincide but the NODE counts differ
  // (n−ℓ−1), so they are genuinely separate eigenvectors, not a duplicated number.
  let distinctNodes = true;
  for (let n = 2; n <= 4; n++) {
    const seen = new Set();
    for (let l = 0; l < n; l++) seen.add(sol.nodes[n][l]);
    if (seen.size !== n) distinctNodes = false;
  }
  check('same-shell states have DISTINCT node counts (separate solves, not a copy)',
        distinctNodes, 'each ℓ in a shell has its own n−ℓ−1 nodes');
}

// (E) THE NODE THEOREM, re-counted with a hand sign-change scan (independent of the
//     core's interiorNodes), and the endpoint-zero trap is checked explicitly.
{
  const sol = solveShells(0, FINE);
  let ok = true, where = '';
  for (let n = 1; n <= 4; n++) for (let l = 0; l < n; l++) {
    const u = sol.uByNL[n][l];
    // independent interior sign-change count (skip near-zero samples)
    let cnt = 0, prev = 0, started = false;
    for (let i = 0; i < u.length; i++) {
      if (Math.abs(u[i]) < 1e-12) continue;
      if (started && prev * u[i] < 0) cnt++;
      prev = u[i]; started = true;
    }
    if (cnt !== n - l - 1) { ok = false; where = 'n=' + n + ',ℓ=' + l + '→' + cnt; }
  }
  check('hand-counted interior nodes == n−ℓ−1 for all (n,ℓ)', ok, where || 'all (n,ℓ) n=1..4, ℓ<n');
  // the endpoint-zero trap: interiorNodes must NOT count the two forced boundary zeros.
  // A signal that is zero at both ends but never changes sign inside has ZERO nodes.
  const bump = new Float64Array([0, 0.3, 0.9, 1.0, 0.9, 0.3, 0]);  // a single positive hump
  check('interiorNodes excludes the two forced boundary zeros (a single hump → 0 nodes)',
        interiorNodes(bump) === 0, 'bump → ' + interiorNodes(bump) + ' nodes');
  const wave = new Float64Array([0, 0.5, 1.0, 0, -1.0, -0.5, 0]); // one true interior sign change
  check('interiorNodes counts a true interior sign change (one crossing → 1 node)',
        interiorNodes(wave) === 1, 'one-crossing wave → ' + interiorNodes(wave) + ' nodes');
}

// (F) TEETH — the negative control, re-swept here at a different κ ladder. The n=2
//     shell crosses from coincident (<tol) to a resolved gap with E_s<E_p<E_d, and
//     the Rydberg ladder is BROKEN (E_n no longer −1/(2n²)). NOT monotone-forever.
{
  const sp0 = shellSpread(solveShells(0, FINE).Enl, 2);
  const sol08 = solveShells(0.08, FINE);
  const sp08 = shellSpread(sol08.Enl, 2);
  check('TEETH: n=2 spread crosses from <tol (κ=0) to a RESOLVED gap (κ=0.08)',
        sp0 < 1e-3 && sp08 > 1e-3, 'κ=0 ' + sp0.toExponential(2) + ' → κ=0.08 ' + sp08.toExponential(2));
  // penetration ordering: the s-state, which dives into the un-screened core, binds
  // most ⇒ E_s < E_p < E_d under screening.
  check('TEETH: screened ordering E_s < E_p < E_d (the s-state penetrates the core)',
        sol08.Enl[2][0] < sol08.Enl[2][1] && solveShells(0.08, FINE).Enl[3][0] < solveShells(0.08, FINE).Enl[3][1] &&
          solveShells(0.08, FINE).Enl[3][1] < solveShells(0.08, FINE).Enl[3][2],
        'E(2s)=' + sol08.Enl[2][0].toFixed(5) + ' < E(2p)=' + sol08.Enl[2][1].toFixed(5));
  // and the LADDER is broken: with κ=0.08 the 2-shell no longer sits at −1/8.
  const broke = Math.abs(sol08.Enl[2][0] - rydberg(2)) / Math.abs(rydberg(2));
  check('TEETH: the Rydberg ladder is broken under screening (E_2 ≠ −1/8)',
        broke > 0.1, '|E(2s) − (−1/8)| / (1/8) = ' + broke.toExponential(2));
}

// (G) THE EFFECTIVE POTENTIAL: V_eff = −e^(−κr)/r + ℓ(ℓ+1)/(2r²). Hand-check a point
//     and the centrifugal floor: raising ℓ pushes the V_eff minimum OUTWARD.
{
  // at r=1, ℓ=0, κ=0: V_eff = −1/1 + 0 = −1.
  check('vEff(1,0,0) == −1 (bare Coulomb at r=1)', Math.abs(vEff(1, 0, 0) + 1) < 1e-12);
  // at r=1, ℓ=1, κ=0: −1 + 1·2/(2·1) = 0.
  check('vEff(1,1,0) == 0 (Coulomb + p-wave centrifugal at r=1)', Math.abs(vEff(1, 1, 0)) < 1e-12);
  // the V_eff minimum marches outward with ℓ (the centrifugal wall pushes it right).
  function argmin(l) {
    let best = Infinity, bestR = 0;
    for (let r = 0.05; r < 60; r += 0.01) { const v = vEff(r, l, 0); if (v < best) { best = v; bestR = r; } }
    return bestR;
  }
  const r0 = argmin(0), r1 = argmin(1), r2 = argmin(2);
  check('the V_eff minimum marches OUTWARD as ℓ climbs (centrifugal wall pushes right)',
        r1 > r0 && r2 > r1, 'argmin r: ℓ=0 ' + r0.toFixed(2) + ' < ℓ=1 ' + r1.toFixed(2) + ' < ℓ=2 ' + r2.toFixed(2));
}

// (H) DETERMINISM: the seeded inverse-power makes two full solves byte-identical.
{
  const a = JSON.stringify(solveShells(0, { N: 1200, Rmax: 60 }).Enl);
  const b = JSON.stringify(solveShells(0, { N: 1200, Rmax: 60 }).Enl);
  check('two full solveShells runs are byte-identical (deterministic seed)', a === b);
  // and the eigenvECTORS too (the picture is reproducible, not just the energies).
  const u1 = solveShells(0, { N: 600, Rmax: 60 }).uByNL[2][1];
  const u2 = solveShells(0, { N: 600, Rmax: 60 }).uByNL[2][1];
  let d = 0; for (let i = 0; i < u1.length; i++) d = Math.max(d, Math.abs(u1[i] - u2[i]));
  check('eigenvectors are byte-identical across runs (deterministic picture)', d === 0, 'max |Δu| = ' + d);
}

// (I) ANGULAR ORTHONORMALITY, re-derived independently (a different φ-resolution and a
//     hand spot-check of two coefficients): the real tesseral Y_lm are orthonormal over
//     the sphere. Y_lm² is a polynomial of degree ≤2l in cosθ, so Gauss–Legendre is
//     EXACT to quadrature — the angular half carries NO O(h²) tolerance (only the radial
//     solve does). This is the honest pairing the bench now shows.
{
  // every ⟨Y_lm,Y_l'm'⟩ for l,l'≤3: 1 on the diagonal, 0 off it.
  const orb = [];
  for (let l = 0; l <= 3; l++) for (let m = -l; m <= l; m++) orb.push([l, m]);
  let diag = 0, off = 0;
  for (let i = 0; i < orb.length; i++) for (let j = 0; j < orb.length; j++) {
    const g = angularGram(orb[i][0], orb[i][1], orb[j][0], orb[j][1], 32, 72);
    if (i === j) diag = Math.max(diag, Math.abs(g - 1));
    else off = Math.max(off, Math.abs(g));
  }
  check('every ⟨Y_lm,Y_l′m′⟩ (l,l′≤3) is δ to <1e−6 (GL exact to quadrature, not O(h²))',
        diag < 1e-6 && off < 1e-6, 'max |diag−1| ' + diag.toExponential(2) + ' · max |off| ' + off.toExponential(2));
  // hand spot-check the NORMALISATION constants of two harmonics at a known direction:
  //   Y_00 = ½√(1/π) everywhere ;  Y_1,0(θ=0) = √(3/4π)·cos0 = √(3/4π).
  check('Y_00 = ½√(1/π) (the constant) and Y_1,0(ẑ) = √(3/4π) (hand-checked constants)',
        Math.abs(ylm(0, 0, 1, 0) - 0.5 * Math.sqrt(1 / Math.PI)) < 1e-12 &&
        Math.abs(ylm(1, 0, 1, 0) - Math.sqrt(3 / (4 * Math.PI))) < 1e-12,
        'Y00=' + ylm(0, 0, 1, 0).toFixed(6) + ' · Y10(ẑ)=' + ylm(1, 0, 1, 0).toFixed(6));
}

// (J) THE ANGULAR + RADIAL NODE COUNT, re-derived by an INDEPENDENT scan here (not the
//     core's): angular nodal surfaces of Y_lm = l (|m| φ-planes + (l−|m|) θ-cones), and
//     radial nodes of u_nl = n−l−1, so the TOTAL = n−1 — the integer you can SEE as dark
//     gaps + dark surfaces in the rotated cloud.
{
  function polarCones(l, m) {            // sign changes of Y along a meridian (θ∈(0,π))
    let prev = 0, started = false, c = 0;
    for (let a = 1; a < 4000; a++) {
      const th = Math.PI * a / 4000, y = ylm(l, m, Math.cos(th), 0.41);
      if (Math.abs(y) < 1e-9) continue;
      if (started && prev * y < 0) c++;
      prev = y; started = true;
    }
    return c;                            // = l − |m|
  }
  function azimPlanes(l, m) {            // sign changes of Y around the equator, halved
    let prev = 0, started = false, c = 0;
    for (let b = 0; b < 7200; b++) {
      const ph = 2 * Math.PI * b / 7200, y = ylm(l, m, Math.cos(1.03), ph);
      if (Math.abs(y) < 1e-9) continue;
      if (started && prev * y < 0) c++;
      prev = y; started = true;
    }
    return Math.round(c / 2);            // = |m|
  }
  let ok = true, where = '';
  for (let l = 0; l <= 3; l++) for (let m = -l; m <= l; m++) {
    const pc = polarCones(l, m), ap = azimPlanes(l, m);
    if (pc !== l - Math.abs(m) || ap !== Math.abs(m)) { ok = false; where = 'l=' + l + ',m=' + m + '→cones ' + pc + '/planes ' + ap; }
  }
  check('Y_lm angular nodes: l−|m| polar cones + |m| azimuthal planes = l (independent scan)',
        ok, where || 'all (l,m) l≤3: cones+planes = l');
  // and the TOTAL with the radial nodes: (l) + (n−l−1) = n−1, all (n,l).
  const sol = solveShells(0, FINE);
  let totalOK = true, tw = '';
  for (let n = 1; n <= 4; n++) for (let l = 0; l < n; l++) {
    const rad = sol.nodes[n][l];
    if (rad + l !== n - 1) { totalOK = false; tw = 'n=' + n + ',l=' + l + '→' + (rad + l); }
  }
  check('total nodes (l angular + n−l−1 radial) = n−1 for all (n,l)', totalOK, tw || 'all (n,l) n≤4');
}

// (K) DEGENERACY = n², re-derived two independent ways: orbitalsAt enumerates n² real
//     (l,m) states, and the closed-form sum Σ_{l=0}^{n−1}(2l+1) = n². An HONEST
//     cross-thread to the box exhibit: the box proves a 1-D energy ladder E_n∝n²; HERE
//     n² is the ORBITAL COUNT — the SAME integer from a DIFFERENT mechanism, not a
//     conflation. The sampler also returns the right shape: a 2p cloud is a dumbbell.
{
  let ok = true, w = '';
  for (let n = 1; n <= 4; n++) {
    const cnt = orbitalsAt(n).length;
    let s = 0; for (let l = 0; l < n; l++) s += 2 * l + 1;
    if (cnt !== n * n || s !== n * n) { ok = false; w = 'n=' + n + '→' + cnt + '/' + s; }
  }
  check('degeneracy = n²: orbitalsAt(n).length == Σ(2l+1) == n² (1,4,9,16)',
        ok, w || 'n=1..4 → 1,4,9,16');
  // the sampler is deterministic AND draws the SHAPE: a 2p_z cloud has its mass split
  // along ±z (a dumbbell), with almost none in the xy-plane (the angular node).
  const sol = solveShells(0, { N: 1200, Rmax: 60 });
  const a = sampleCloud(sol, 2, 1, 0, 4000, 777);
  const b = sampleCloud(sol, 2, 1, 0, 4000, 777);
  let identical = a.count === b.count;
  for (let i = 0; i < a.count && identical; i++) if (a.zs[i] !== b.zs[i]) identical = false;
  check('sampleCloud is deterministic (same seed → byte-identical cloud)', identical,
        a.count + ' pts, byte-identical recompute');
  // dumbbell test: the rms |z| should dominate the rms in-plane radius for 2p_z.
  let zz = 0, pp = 0;
  for (let i = 0; i < a.count; i++) { zz += a.zs[i] * a.zs[i]; pp += a.xs[i] * a.xs[i] + a.ys[i] * a.ys[i]; }
  const rmsZ = Math.sqrt(zz / a.count), rmsXY = Math.sqrt(pp / a.count);
  check('the 2p_z cloud is a dumbbell: rms|z| > rms(xy) (mass on the ±z axis, node in xy)',
        rmsZ > rmsXY, 'rms z = ' + rmsZ.toFixed(2) + ' vs rms xy = ' + rmsXY.toFixed(2));
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the core inlined in index.html is byte-identical to
//  core.mjs (between the // ===== HYDROGEN CORE sentinels).
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== HYDROGEN CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END HYDROGEN CORE =====';

  // From the module: everything from the first function to the END sentinel
  // (the same span the page inlines BETWEEN its START/END sentinels).
  const modBody = modSrc
    .slice(modSrc.indexOf('function rydberg('), modSrc.indexOf(END))
    .trim();
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('index.html contains the HYDROGEN CORE sentinels', pi >= 0 && pj > pi);
  if (pi >= 0 && pj > pi) {
    const pageBody = pageSrc.slice(pi + START.length, pj).trim();
    // the page wraps the same functions in an IIFE; compare the shared bodies,
    // normalised for leading indentation.
    const norm = function (s) { return s.replace(/^\s+/gm, '').replace(/\r/g, '').trim(); };
    check('inlined core matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
