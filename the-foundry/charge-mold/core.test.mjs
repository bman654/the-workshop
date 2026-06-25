// ============================================================================
//  THE FOUNDRY · The Charge Mold — the Node twin + the in-page pill's runner.
//
//  Every check runs off the REAL relaxed field (no closed-form shortcut for the
//  solve — only for the ORACLE we compare against). The oracle N is decoupled
//  from the live page's N=48: the twin picks its own N per test. All tolerances
//  are pinned off the MEASURED worst-case (re-run here, reported per claim).
//
//  Run:  node the-foundry/charge-mold/core.test.mjs   (exits 0 all-green, 1 on fail)
//  The in-page pill imports runChargeTests() from this file and prints GREEN N/N.
// ============================================================================

import {
  makeCavity, seatCharges, relax, residualInf, meanValueDefectAt,
  E_at, traceFieldLine, marchingSquares, regressSlope, phiAt,
  COULOMB_K, RHO, sweepRedBlack, applyFixed, optimalOmega, runCoreTests,
} from './core.mjs';

// ── the shared assertion runner. Returns {checks,passed,total,ok}. Each check
//    carries the measured worst-case |Δ| in its `info` so a green pill still
//    reports HOW green. Wrapped per-check so one throw can't blank the suite.
export function runChargeTests() {
  const checks = [];
  const ok = (name, pass, info = '') => checks.push({ name, pass, info });
  const guard = (name, fn) => { try { fn(); } catch (e) { ok(name, false, 'threw: ' + e.message); } };

  // helper: build a grounded cavity, seat charges, relax tight.
  const solve = (N, charges, tol = 1e-12) => {
    const g = makeCavity(N);
    seatCharges(g, charges);
    relax(g, { tol, maxSweeps: 60000 });
    return g;
  };

  // ── (1) COULOMB — the lone-charge LOG potential. Recover ρ·COULOMB_K by the
  //    centered log-slope of φ vs (−ln r) over r∈[5,25]; assert relative error
  //    < 0.4% (MEASURED ~0.21%, ~2× margin). PLUS isotropy: φ(+x)==φ(+y) to ~0.
  guard('COULOMB log-slope recovers ρ·COULOMB_K', () => {
    const N = 161, c = (N - 1) / 2 | 0;
    const g = solve(N, [{ cx: c, cy: c, sign: +1 }]);
    const basis = [], sample = [];
    for (let r = 5; r <= 25; r++) { basis.push(-Math.log(r)); sample.push(phiAt(g, c + r, c)); }
    const kFit = regressSlope(basis, sample, 5, 25);
    const target = RHO * COULOMB_K;
    const rel = Math.abs(kFit - target) / target;
    ok('(1) COULOMB: log-slope recovers ρ·COULOMB_K (φ ≈ −ρ/2π·ln r)',
       rel < 0.004, `kFit ${kFit.toFixed(5)} vs ρ·K ${target.toFixed(5)} — rel |Δ| ${(rel * 100).toFixed(3)}%`);
    let iso = 0;
    for (let r = 5; r <= 25; r++) iso = Math.max(iso, Math.abs(phiAt(g, c + r, c) - phiAt(g, c, c + r)));
    ok('(1) COULOMB isotropy: φ along +x == φ along +y',
       iso < 1e-12, `worst |φ(+x) − φ(+y)| ${iso.toExponential(2)}`);
  });

  // ── (2) DIPOLE — +/− pair. (a) DIRECTION: + side positive, − side negative at
  //    matched radius, and |φ| on the perpendicular bisector ≈ 0 by symmetry.
  //    (b) ANGULAR: φ(θ)/φ(0) tracks cosθ to < 0.10. (c) FALLOFF: φ·r is monotone
  //    over the near band r∈[8,16] (a stable, box-robust dipole signature).
  guard('DIPOLE structure', () => {
    const N = 161, c = (N - 1) / 2 | 0, d = 6;
    const g = solve(N, [{ cx: c - d, cy: c, sign: +1 }, { cx: c + d, cy: c, sign: -1 }]);
    const pPlus = phiAt(g, c - 14, c), pMinus = phiAt(g, c + 14, c);
    ok('(2a) DIPOLE direction: + side φ>0, − side φ<0 (antisymmetric)',
       pPlus > 0 && pMinus < 0, `φ(+side) ${pPlus.toFixed(4)} · φ(−side) ${pMinus.toFixed(4)}`);
    let perp = 0;
    for (let r = 8; r <= 16; r++) perp = Math.max(perp, Math.abs(phiAt(g, c, c + r)));
    ok('(2b) DIPOLE perpendicular bisector: |φ| ≈ 0 (symmetry)',
       perp < 1e-3, `worst |φ| on bisector ${perp.toExponential(2)}`);
    // angular cosθ law at r=20 from midpoint, on the +charge half-plane
    const R = 20, p0 = phiAt(g, c - R, c);
    let angWorst = 0;
    for (const deg of [30, 45, 60]) {
      const th = deg * Math.PI / 180;
      const x = Math.round(c - R * Math.cos(th)), y = Math.round(c - R * Math.sin(th));
      angWorst = Math.max(angWorst, Math.abs(phiAt(g, x, y) / p0 - Math.cos(th)));
    }
    ok('(2c) DIPOLE angular law: φ(θ)/φ(0) tracks cosθ',
       angWorst < 0.10, `worst |ratio − cosθ| ${angWorst.toFixed(3)}`);
    let mono = true, prev = Infinity;
    for (let r = 8; r <= 16; r++) { const v = Math.abs(phiAt(g, c - r, c)) * r; if (v > prev + 1e-9) mono = false; prev = v; }
    ok('(2d) DIPOLE falloff: φ·r monotone over the near band r∈[8,16]',
       mono, `φ·r at r=8 ${(Math.abs(phiAt(g, c - 8, c)) * 8).toFixed(3)} → r=16 ${(Math.abs(phiAt(g, c - 16, c)) * 16).toFixed(3)}`);
  });

  // ── (3) NEG-CONTROL — charge balance buys the far field. Neutral {+ρ,−ρ}
  //    (Σq=0) vs same-sign {+ρ,+ρ} (Σq=2ρ) in a big box. The same-sign field is
  //    far stronger at r=20 (a monopole tail), and the neutral field falls as the
  //    fast dipole 1/r (φ(20)/φ(40) ≈ 2) while same-sign tracks the slow log.
  guard('NEG-CONTROL', () => {
    const N = 161, c = (N - 1) / 2 | 0, d = 6;
    const neu = solve(N, [{ cx: c - d, cy: c, sign: +1 }, { cx: c + d, cy: c, sign: -1 }]);
    const same = solve(N, [{ cx: c - d, cy: c, sign: +1 }, { cx: c + d, cy: c, sign: +1 }]);
    // the honest far-field strength at radius R: the MEAN |φ| over a full ring (a
    // single cardinal sample is biased — the neutral dipole field is strong on the
    // charge axis but ≈0 on the bisector; the ring-mean is the true "how much field
    // is out there at this radius").
    const ringMean = (g, R) => {
      let s = 0, k = 0;
      for (let a = 0; a < 360; a += 15) {
        const th = a * Math.PI / 180;
        s += Math.abs(phiAt(g, c + Math.round(R * Math.cos(th)), c + Math.round(R * Math.sin(th))));
        k++;
      }
      return s / k;
    };
    const sm20 = ringMean(same, 20), nu20 = ringMean(neu, 20);
    const ratio = sm20 / nu20;
    ok('(3a) NEG-CONTROL: same-sign far field ≫ neutral (the monopole tail = imbalance)',
       ratio > 6, `same/neutral mean|φ| over ring R=20 ${ratio.toFixed(2)}× (>6)`);
    const nu40 = ringMean(neu, 40), sm40 = ringMean(same, 40);
    const neuFall = nu20 / nu40, samFall = sm20 / sm40;
    ok('(3b) NEG-CONTROL: neutral falls as the fast 1/r dipole, same-sign as the slow log',
       neuFall > 2.1 && samFall < 2.0, `neutral φ(20)/φ(40) ${neuFall.toFixed(2)} (dipole~2.4) vs same-sign ${samFall.toFixed(2)} (log~1.9)`);
  });

  // ── (4) FIELD-LINE GEOMETRY — beads ring-launched around + on a dipole all
  //    terminate at the − sink or the rim (stall-count == 0), and a line stepped
  //    along +E INCREASES distance from + initially (distinguishes it from a
  //    gradient DESCENT, which would slide toward the gates).
  guard('FIELD-LINE geometry', () => {
    const N = 81, c = (N - 1) / 2 | 0, d = 8;
    const g = solve(N, [{ cx: c - d, cy: c, sign: +1 }, { cx: c + d, cy: c, sign: -1 }], 1e-10);
    const px = c - d, py = c, M = 16, ring = 2.5;
    let sink = 0, rim = 0, stall = 0;
    for (let i = 0; i < M; i++) {
      const th = 2 * Math.PI * i / M;
      const { end } = traceFieldLine(g, px + ring * Math.cos(th), py + ring * Math.sin(th), { step: 0.3, maxSteps: 2000 });
      if (end === 'sink') sink++;
      else if (end === 'rim') rim++;
      else stall++;
    }
    ok('(4a) FIELD-LINE: every ring-launched bead terminates at sink or rim (stall-count == 0)',
       stall === 0 && sink > 0, `${sink} sink · ${rim} rim · ${stall} stall`);
    const { path } = traceFieldLine(g, px + ring, py, { step: 0.3, maxSteps: 50 });
    const d0 = Math.hypot(path[0][0] - px, path[0][1] - py);
    const dN = Math.hypot(path[5][0] - px, path[5][1] - py);
    ok('(4b) FIELD-LINE sign: a line on +E moves AWAY from + (not a descent to the gates)',
       dN > d0, `dist from + step0 ${d0.toFixed(2)} → step5 ${dN.toFixed(2)}`);
  });

  // ── (5) MARCHING-SQUARES CLOSURE — synthetic φ=−ln r gives concentric circles;
  //    extracted level segments chain head-to-tail into closed loops and the mean
  //    radius matches the analytic contour.
  guard('MARCHING-SQUARES closure', () => {
    const N = 81, c = (N - 1) / 2;
    const fld = (x, y) => { const r = Math.hypot(x - c, y - c); return r < 0.5 ? -Math.log(0.5) : -Math.log(r); };
    const Rwant = 15, level = -Math.log(Rwant);
    const segs = marchingSquares(fld, N, level, 2, 2, N - 3, N - 3);
    let sr = 0;
    for (const s of segs) sr += Math.hypot((s[0] + s[2]) / 2 - c, (s[1] + s[3]) / 2 - c);
    sr /= segs.length;
    ok('(5a) MARCHING-SQUARES: extracted mean radius matches the analytic contour',
       Math.abs(sr - Rwant) < 0.5, `mean radius ${sr.toFixed(3)} vs analytic ${Rwant} — |Δ| ${Math.abs(sr - Rwant).toFixed(3)}`);
    const eps = 0.6, endpoints = [];
    for (const s of segs) { endpoints.push([s[0], s[1]]); endpoints.push([s[2], s[3]]); }
    let unmatched = 0;
    for (const e of endpoints) {
      let m = 0;
      for (const f of endpoints) { if (f === e) continue; if (Math.hypot(e[0] - f[0], e[1] - f[1]) < eps) m++; }
      if (m === 0) unmatched++;
    }
    ok('(5b) MARCHING-SQUARES: segments chain head-to-tail into closed loops',
       unmatched === 0 && segs.length > 0, `${unmatched} unmatched endpoints of ${endpoints.length}`);
  });

  // ── ANTI-CIRCULAR — a from-scratch PLAIN-JACOBI solver (NO core import, NO SOR,
  //    NO ω) iterated to convergence on the lone-charge problem must agree with the
  //    SOR-relaxed field to < 1e-8 (MEASURED ~2e-11). Proves the relaxed field is
  //    the true Poisson solution, not an over-relaxation artifact.
  guard('ANTI-CIRCULAR plain Jacobi', () => {
    const N = 81, c = (N - 1) / 2 | 0;
    const g = solve(N, [{ cx: c, cy: c, sign: +1 }]);
    // independent Jacobi: rim 0, one source ρ at centre, simple averaging, no ω
    const f = new Float64Array(N * N), nf = new Float64Array(N * N), src = new Float64Array(N * N);
    src[c * N + c] = RHO;
    for (let it = 0; it < 40000; it++) {
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
        const i = y * N + x;
        nf[i] = 0.25 * (f[i - 1] + f[i + 1] + f[i - N] + f[i + N] + src[i]);
      }
      f.set(nf);
    }
    let worst = 0;
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const w = Math.abs(g.field[y * N + x] - f[y * N + x]);
      if (w > worst) worst = w;
    }
    ok('ANTI-CIRCULAR: SOR field == independent plain-Jacobi field (not an SOR artifact)',
       worst < 1e-8, `max|SOR − Jacobi| over interior ${worst.toExponential(2)}`);
  });

  // ── GUARD-THE-IMPORT — the casting-floor's OWN self-test, re-exported through
  //    core.mjs, must still be ALL-GREEN. Proves the unforked import didn't perturb
  //    the shared core.
  guard('GUARD-THE-IMPORT casting-floor still green', () => {
    const r = runCoreTests();
    ok('GUARD: casting-floor runCoreTests() still ALL-GREEN through the unforked import',
       r.ok, `casting-floor ${r.passed}/${r.total} checks pass`);
  });

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}

// ── Node entry: print each check, report the measured worst-case |Δ|, exit code.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const { checks, passed, total, ok } = runChargeTests();
  console.log('\nThe Foundry · The Charge Mold — core.test.mjs\n');
  for (const c of checks) {
    console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`);
    if (c.info) console.log(`      ${c.info}`);
  }
  console.log(`\n  ${ok ? '✓' : '✗'} ${passed}/${total} checks pass\n`);
  process.exit(ok ? 0 : 1);
}
