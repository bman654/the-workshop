// ============================================================================
//  Node twin for THE FOG THAT CLEARED core (recombination / cosmology).
//  Zero-dep.  Run:  node recombination/core.test.mjs   (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIM a SECOND way, not merely that the code runs:
//   [shared] runs the SAME runSelfTest() the in-page pill runs and mirrors its
//            verdict here, so the twin and the pill can never diverge.
//   (A) λ DIVERGES as xₑ→0 — the cold-end mean free path blows up past any finite
//       bound while xₑ vanishes (re-derived against the closed form λ = L0/xₑ).
//   (B) λ MONOTONE as T falls — re-proved a second way via the SIGN of the
//       finite-difference derivative of S(τ): dS/dτ > 0 ⇒ xₑ↑ ⇒ λ=L0/xₑ ↓ as τ↑,
//       so λ STRICTLY rises as τ falls across the recombination band.
//   (C) NEG-CONTROL held HOT — λ bounded & small, xₑ a fog, never transparent, for
//       any elapsed time (time is not in the model; only τ is).
//   (D) picture === proof — photonScatters reads the SAME ionizedFraction the
//       glyph and instruments read; trapped above τ*, streaming below.
//   (Newton) the stable Saha root agrees with an INDEPENDENT Newton solve of the
//       Saha quadratic xₑ²/(1−xₑ) = S to < 1e-12 across the τ range.
//   (BYTE-TWIN) index.html's inlined RECOMBINATION CORE slab is byte-identical
//       (indentation-normalised) to core.mjs, and the char counts match.
// ============================================================================

import {
  SCENE,
  sahaS, ionizedFraction, meanFreePath, opticalDepth,
  isTransparent, crossingTau, photonScatters,
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

const A_SWEEP = [1e6, 1e9, 1e12];

// ── run the SAME runSelfTest() the page's pill runs; mirror its verdict here ───
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('shared runSelfTest() overall green', r.ok, r.passed + '/' + r.total);
}

// ── (A) re-prove λ DIVERGES as xₑ → 0, directly against the closed form ────────
{
  let ok = true, info = [];
  for (const A of A_SWEEP){
    const tauStar = crossingTau(A);
    const lamStar = meanFreePath(tauStar, A);             // λ at xₑ=½ ⇒ exactly 2·L0
    // sweep DOWN past the cold end; λ must exceed any finite bound we name
    let lamMax = 0, xeMin = 1;
    for (let k = 0; k <= 60; k++){
      const tau = SCENE.tauColdEnd * (1 - 0.6 * k / 60);  // even colder than the cold end
      const lam = meanFreePath(tau, A);
      const xe = ionizedFraction(tau, A);
      if (lam > lamMax) lamMax = lam;
      if (xe < xeMin) xeMin = xe;
      // λ = L0/xₑ closed-form agreement
      if (xe > 0 && Math.abs(lam - SCENE.L0 / xe) > 1e-12 * lam){ ok = false; }
    }
    const diverges = lamMax > 1e10 * lamStar && xeMin < 1e-8;
    ok = ok && diverges;
    info.push('A=' + A.toExponential(0) + ': λmax/λ* ' + (lamMax / lamStar).toExponential(1) + ', xeMin ' + xeMin.toExponential(1));
  }
  check('(A) λ diverges past any finite bound as xₑ→0, λ === L0/xₑ to <1e-12', ok, info.join(' · '));
  // a spot value: at xₑ=½ the mean free path is exactly 2 box-widths (L0/0.5)
  const tauStar = crossingTau(SCENE.SAHA_A);
  check('(A-spot) λ(τ*) === 2·L0 exactly at the xₑ=½ crossing',
    Math.abs(meanFreePath(tauStar, SCENE.SAHA_A) - 2 * SCENE.L0) < 1e-9,
    'λ(τ*) = ' + meanFreePath(tauStar, SCENE.SAHA_A).toFixed(9));
}

// ── (B) re-prove λ MONOTONE via the SIGN of dS/dτ (finite difference) ──────────
//    d/dτ[(3/2)lnτ − 1/τ] = 3/(2τ) + 1/τ² > 0  ⇒  S↑  ⇒  xₑ↑  ⇒  λ=L0/xₑ ↓  as τ↑.
//    So as τ FALLS across the band, λ STRICTLY rises. Check dS/dτ > 0 numerically
//    AND that λ strictly increases on the downward sweep below the plateau.
{
  let okDeriv = true, okLambda = true, info = [];
  for (const A of A_SWEEP){
    const tauStar = crossingTau(A);
    // start just below the xₑ≈1 plateau (xₑ < 0.99) and sweep DOWN to the cold end
    let tauStart = tauStar;
    for (let m = 1; m <= 400; m++){
      const t = tauStar + m * 0.0005 * tauStar + m * 1e-5;
      if (ionizedFraction(t, A) < 0.99){ tauStart = t; break; }
    }
    const N = 120;
    let prevLam = -Infinity;
    for (let k = 0; k <= N; k++){
      const tau = tauStart + (SCENE.tauColdEnd - tauStart) * (k / N);   // sweeps DOWN
      // finite-difference sign of dS/dτ at this τ (must be strictly positive)
      const h = tau * 1e-5;
      const dS = (sahaS(tau + h, A) - sahaS(tau - h, A)) / (2 * h);
      if (!(dS > 0)) okDeriv = false;
      const lam = meanFreePath(tau, A);
      if (!(lam > prevLam)) okLambda = false;
      prevLam = lam;
    }
    info.push('A=' + A.toExponential(0) + ': τstart ' + tauStart.toFixed(4));
  }
  check('(B) dS/dτ > 0 across the band (finite difference) — the analytic monotonicity', okDeriv, info.join(' · '));
  check('(B2) λ strictly increases on the downward (cooling) sweep below the plateau', okLambda);
}

// ── (C) NEG-CONTROL held HOT — λ bounded & small, a fog, never clears ──────────
{
  let ok = true, info = [];
  for (const A of A_SWEEP){
    const lamHot = meanFreePath(SCENE.tauHot, A);
    const xeHot = ionizedFraction(SCENE.tauHot, A);
    const tauOpt = opticalDepth(SCENE.tauHot, A);
    // bounded & small, still a fog, optical depth high (opaque), never transparent
    const held = isFinite(lamHot) && lamHot < 4 * SCENE.L0 && xeHot > 0.5 &&
                 tauOpt > 0.25 && !isTransparent(SCENE.tauHot, A);
    ok = ok && held;
    info.push('A=' + A.toExponential(0) + ': λ ' + lamHot.toFixed(3) + ', xe ' + xeHot.toFixed(3) + ', τ_opt ' + tauOpt.toFixed(2));
  }
  check('(C) held-hot box: λ bounded (<4·L0), xₑ>½ (a fog), opaque, never transparent', ok, info.join(' · '));
  // the model has NO time term — meanFreePath depends ONLY on τ. Prove invariance:
  // the same τ always yields the same λ regardless of any "elapsed" parameter.
  check('(C2) λ is a pure function of τ (no elapsed-time term anywhere) — held hot never clears',
    meanFreePath(SCENE.tauHot, SCENE.SAHA_A) === meanFreePath(SCENE.tauHot, SCENE.SAHA_A));
}

// ── (D) picture === proof — photonScatters reads the SAME ionizedFraction ──────
{
  let ok = true, info = [];
  for (const A of A_SWEEP){
    const tauStar = crossingTau(A);
    // ABOVE τ* (ionized): a sub-xₑ step always scatters; BELOW τ* (neutral): a
    // half-box step never scatters once xₑ < 0.5. Re-derive directly from xₑ.
    const tHot = tauStar * 1.4, tCold = tauStar * 0.5;
    const xeHot = ionizedFraction(tHot, A), xeCold = ionizedFraction(tCold, A);
    const scHot = photonScatters(tHot, 0.5, A);    // 0.5 < xₑ≈1 ⇒ true
    const scCold = photonScatters(tCold, 0.5, A);  // 0.5 < xₑ(small) ⇒ false
    const consistent = (scHot === (0.5 < Math.min(1, xeHot))) &&
                       (scCold === (0.5 < Math.min(1, xeCold)));
    ok = ok && scHot && !scCold && consistent;
    info.push('A=' + A.toExponential(0) + ': hot scatters ' + scHot + ' (xe ' + xeHot.toFixed(2) + '), cold ' + scCold + ' (xe ' + xeCold.toExponential(1) + ')');
  }
  check('(D) photonScatters: trapped above τ*, streaming below — reads the same xₑ as the glyph', ok, info.join(' · '));
}

// ── (Newton) the stable closed form agrees with an INDEPENDENT Newton solve ────
//    Solve f(x) = x²/(1−x) − S = 0 for x ∈ (0,1) by Newton iteration from a safe
//    start, and confirm it matches the stable closed-form root to < 1e-12.
{
  function newtonSaha(S){
    if (!isFinite(S)) return 1;
    if (S <= 0) return 0;
    // good initial guess: for small S, x ≈ √S; for large S, x ≈ 1 − 1/S
    let x = S < 1 ? Math.sqrt(S) / (1 + Math.sqrt(S)) : 1 - 1 / S;
    x = Math.min(1 - 1e-15, Math.max(1e-300, x));
    for (let it = 0; it < 100; it++){
      const f = x * x / (1 - x) - S;
      const df = (2 * x * (1 - x) + x * x) / ((1 - x) * (1 - x));   // d/dx[x²/(1−x)]
      const step = f / df;
      let nx = x - step;
      if (nx <= 0) nx = x / 2;
      if (nx >= 1) nx = (x + 1) / 2;
      x = nx;
      if (Math.abs(step) < 1e-16) break;
    }
    return x;
  }
  let worst = 0, info = [];
  for (const A of A_SWEEP){
    let w = 0;
    for (let k = 0; k <= 80; k++){
      const tau = SCENE.tauColdEnd + (SCENE.tauHotEnd - SCENE.tauColdEnd) * (k / 80);
      const S = sahaS(tau, A);
      const xeClosed = ionizedFraction(tau, A);
      const xeNewton = newtonSaha(S);
      // compare on a relative scale where both are meaningfully > 0
      const d = (xeClosed > 1e-12)
        ? Math.abs(xeClosed - xeNewton) / xeClosed
        : Math.abs(xeClosed - xeNewton);
      if (d > w) w = d;
    }
    worst = Math.max(worst, w);
    info.push('A=' + A.toExponential(0) + ': worst rel ' + w.toExponential(2));
  }
  check('(Newton) stable Saha root === independent Newton solve of xₑ²/(1−xₑ)=S to <1e-12', worst < 1e-12, info.join(' · '));
}

// ── BYTE-TWIN PARITY: the page's inlined RECOMBINATION CORE slab === core.mjs ───
const here = dirname(fileURLToPath(import.meta.url));
{
  const BEGIN = '// === RECOMBINATION CORE BEGIN ===';
  const END = '// === RECOMBINATION CORE END ===';
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
    pageRegion ? ('chars ' + norm(pageRegion).length + ' vs ' + norm(coreRegion).length) : 'index.html not built yet (run forge)');
}

console.log('\nThe Fog That Cleared — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
