// ============================================================================
//  Node-side falsifiability harness for The Best Rational.
//  Runs the shared in-page self-test PLUS extra deeper Node-only assertions
//  (exhaustive brute-force at larger denominators than the page bothers with).
//  Run:  node core.test.mjs
// ============================================================================
import {
  PHI, PI, E, SQRT2,
  cfExpand, cfOfRational, convergents, convergentsOf,
  bruteBest, sternBrocotTurningPoints, convergentError, gcd, fib,
  runSelfTest,
} from './core.mjs';

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { console.log(`FAIL  ${name}${detail ? '  — ' + detail : ''}`); }
};
const approx = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

console.log('The Best Rational — core.test.mjs\n');

// --- First, the shared in-page self-test must be fully green. ----------------
const st = runSelfTest();
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

// --- Deeper Node-only assertions. -------------------------------------------

// A. EXHAUSTIVE best-approximation at large denominators (the heavy check the
//    page can't afford). For π, every convergent up to q≤30000 must equal the
//    brute-force closest fraction at that denominator bound.
{
  let good = true, bad = '';
  const c = convergentsOf(PI, 12).filter(cv => cv.n >= 1 && cv.q <= 30000);
  for (const cv of c) {
    const bf = bruteBest(PI, cv.q);
    const g = gcd(bf.p, bf.q);
    if (bf.p / g !== cv.p || bf.q / g !== cv.q) {
      if (!approx(bf.err, convergentError(PI, cv.p, cv.q), 1e-15)) {
        good = false; bad = `q=${cv.q}: brute ${bf.p / g}/${bf.q / g} ≠ ${cv.p}/${cv.q}`; break;
      }
    }
  }
  ok('exhaustive: π convergents are brute-force optimal up to q≤30000', good, bad);
}

// B. 22/7 is the BEST rational for π among all q≤7 (best-approximation theorem),
//    and — the fingerprint of the giant 292 term — the next CONVERGENT to beat
//    it waits all the way until 333/106 (q=106). (Semiconvergents like 179/57 do
//    beat 22/7 earlier — the theorem is about convergents being best at THEIR
//    OWN denominator bound, not about no fraction ever beating them sooner.)
{
  const bf7 = bruteBest(PI, 7);                 // brute-force best with q≤7
  const g = gcd(bf7.p, bf7.q);
  const optimalAt7 = (bf7.p / g === 22 && bf7.q / g === 7);
  const cp = convergentsOf(PI, 8);
  const e22 = Math.abs(PI - 22 / 7);
  const firstConvBetter = cp.find(c => Math.abs(PI - c.p / c.q) < e22 - 1e-18);
  const next106 = firstConvBetter && firstConvBetter.p === 333 && firstConvBetter.q === 106;
  ok('22/7 is optimal among q≤7; next convergent to beat it is 333/106 (the 292 term)',
    optimalAt7 && next106,
    `bestAtQ7=${bf7.p / g}/${bf7.q / g}, nextConv=${firstConvBetter ? firstConvBetter.p + '/' + firstConvBetter.q : '?'}`);
}

// C. φ is WORST-APPROXIMABLE (Hurwitz). The right invariant is the LIMITING
//    normalized error of the deep convergents: q²·err(φ) → 1/√5 ≈ 0.4472, the
//    LARGEST such limit of any irrational; √2 (CF all 2's) → 1/(2√2) ≈ 0.3536,
//    strictly smaller. (A single early convergent of √2 can transiently exceed
//    φ's — the claim is about the converged tail, not one index.)
{
  // Pick convergents deep enough to have CONVERGED to the limit but shallow
  // enough that q² is still well within double-precision (q ~ a few hundred).
  // (Past q≈1e5 the error underflows relative to q² and the invariant breaks
  // numerically — a real precision cliff, sampled and avoided here.)
  const cPhi = convergentsOf(PHI, 14).find(c => c.n === 11);   // q=144
  const c2 = convergentsOf(SQRT2, 14).find(c => c.n === 8);    // q=985
  const vPhi = cPhi.q * cPhi.q * convergentError(PHI, cPhi.p, cPhi.q);
  const v2 = c2.q * c2.q * convergentError(SQRT2, c2.p, c2.q);
  ok('φ worst-approximable: q²·err(φ)→1/√5 (0.4472) > q²·err(√2)→1/2√2 (0.3536)',
    approx(vPhi, 1 / Math.sqrt(5), 0.005) && approx(v2, 1 / (2 * Math.SQRT2), 0.005) && vPhi > v2,
    `φ:${vPhi.toFixed(4)} √2:${v2.toFixed(4)}`);
}

// D. Stern–Brocot turning points reproduce convergents for √3 and e too.
{
  let good = true, bad = '';
  for (const x of [Math.sqrt(3), E, Math.cbrt(2)]) {
    const c = convergentsOf(x, 10).filter(cv => cv.n >= 1 && cv.q <= 6000);
    const turns = sternBrocotTurningPoints(x, 8000);
    for (const cv of c) {
      if (!turns.some(t => t.p === cv.p && t.q === cv.q)) { good = false; bad = `${cv.p}/${cv.q} missing for x≈${x.toFixed(4)}`; break; }
    }
    if (!good) break;
  }
  ok('Stern–Brocot turning points = convergents for √3, e, ∛2', good, bad);
}

// E. cfExpand of a clean rational matches Euclid's exact CF (no float drift) for
//    a battery of fractions.
{
  let good = true, bad = '';
  for (const [p, q] of [[355, 113], [22, 7], [89, 55], [1000, 7], [17, 12]]) {
    const exact = cfOfRational(p, q);
    const fromFloat = cfExpand(p / q, 40);
    // they should match up to a trailing-1 ambiguity ([…,n] ≡ […,n−1,1]); compare
    // by reconstructing the value of both.
    const va = convergents(exact).pop();
    const vb = convergents(fromFloat).pop();
    const g = gcd(p, q);
    if (va.p !== p / g || va.q !== q / g) { good = false; bad = `Euclid ${p}/${q}→${va.p}/${va.q}`; break; }
    if (Math.abs(vb.p / vb.q - p / q) > 1e-9) { good = false; bad = `float ${p}/${q}→${vb.p}/${vb.q}`; break; }
  }
  ok('cfOfRational (Euclid) reconstructs exactly; cfExpand matches its value', good, bad);
}

// F. Fibonacci identity sanity: fib gives the φ-convergent denominators.
{
  const c = convergentsOf(PHI, 12);
  const good = c.every((cv, n) => cv.q === fib(n + 1) && cv.p === fib(n + 2));
  ok('fib() yields φ convergent num/den (F_{n+2}/F_{n+1})', good);
}

console.log(`\n${pass}/${total} passed`);
process.exit(pass === total ? 0 : 1);
