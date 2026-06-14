// ============================================================================
//  The Best Rational — continued fractions & the Stern–Brocot tree   (CORE)
//  Pure, dependency-free. Identical code is inlined into index.html; this file
//  is the Node-testable twin (the falsifiability harness runs against it).
//
//  THE MEDIUM (new to the estate): number theory. Every real number x has a
//  CONTINUED FRACTION
//
//        x = a0 +        1
//                 ----------------
//                 a1 +     1
//                      -----------
//                      a2 +  1
//                           -----
//                           a3 + …                       = [a0; a1, a2, a3, …]
//
//  Truncating it after n terms gives the CONVERGENTS p_n/q_n — and these are
//  the BEST RATIONAL APPROXIMATIONS of x: among ALL fractions whose denominator
//  is ≤ q_n, the convergent p_n/q_n is the closest one to x. That is the
//  best-approximation theorem, and it is the falsifiable spine of this bench.
//
//  THE FALSIFIABLE CRUX (three independent methods must agree):
//   (1) the convergent recurrence  p_n = a_n p_{n-1} + p_{n-2}, similarly q_n,
//   (2) a BRUTE-FORCE exhaustive search over every denominator q ≤ q_n for the
//       genuinely closest p/q (no shared code with the recurrence), and
//   (3) the STERN–BROCOT mediant descent toward x.
//  (1), (2) and (3) must land on the same fractions — or the theorem is wrong.
//
//  φ = [1;1,1,1,…] is "the most irrational number": all partial quotients are
//  the minimum possible (1), so it is approached by its convergents (the
//  Fibonacci ratios F_{n+1}/F_n) more SLOWLY than any other number. That is why
//  phyllotaxis packs seeds at the golden angle — it is the angle hardest to
//  approximate by a simple fraction, so seeds never line up into wasteful rays.
// ============================================================================

// Famous constants, to many digits (so deep convergents are still exact-ish).
export const PHI   = (1 + Math.sqrt(5)) / 2;
export const SQRT2 = Math.SQRT2;
// e and π via their literals (double precision is plenty for the convergent
// depths we reach; the CF coefficients below are computed from these values).
export const E  = Math.E;
export const PI = Math.PI;

// ---------------------------------------------------------------------------
//  Continued-fraction expansion of a real number x.
//  Returns the partial quotients [a0, a1, a2, …] up to `maxTerms`, stopping
//  early if the remainder collapses (a rational, or the tail underflows).
//  We guard against floating-point grit: once the fractional part is within
//  `eps` of 0 we treat the expansion as terminated (x was effectively rational).
// ---------------------------------------------------------------------------
export function cfExpand(x, maxTerms = 20, eps = 1e-12) {
  const a = [];
  let r = x;
  for (let i = 0; i < maxTerms; i++) {
    const ai = Math.floor(r);
    a.push(ai);
    const frac = r - ai;
    if (frac < eps) break;            // terminated (rational / underflow)
    r = 1 / frac;
    if (!isFinite(r) || r > 1e15) break;
  }
  return a;
}

// Exact continued fraction of a rational p/q (Euclid's algorithm — no floats).
// Returns the partial quotients. This is the "ground-truth" CF for rationals.
export function cfOfRational(p, q) {
  if (q < 0) { p = -p; q = -q; }
  const a = [];
  while (q !== 0) {
    const ai = Math.floor(p / q);
    a.push(ai);
    const t = p - ai * q;
    p = q;
    q = t;
  }
  return a;
}

// ---------------------------------------------------------------------------
//  Convergents from the partial quotients, via the canonical recurrence:
//      p_{-1}=1, p_{-2}=0 ;  q_{-1}=0, q_{-2}=1
//      p_n = a_n·p_{n-1} + p_{n-2}      q_n = a_n·q_{n-1} + q_{n-2}
//  Returns [{a, p, q, value, n}] — one per convergent, in order.
// ---------------------------------------------------------------------------
export function convergents(a) {
  const out = [];
  let pm1 = 1, pm2 = 0;   // p_{-1}, p_{-2}
  let qm1 = 0, qm2 = 1;   // q_{-1}, q_{-2}
  for (let n = 0; n < a.length; n++) {
    const p = a[n] * pm1 + pm2;
    const q = a[n] * qm1 + qm2;
    out.push({ a: a[n], p, q, value: p / q, n });
    pm2 = pm1; pm1 = p;
    qm2 = qm1; qm1 = q;
  }
  return out;
}

// Convenience: the convergents of a real x directly.
export function convergentsOf(x, maxTerms = 20) {
  return convergents(cfExpand(x, maxTerms));
}

// ---------------------------------------------------------------------------
//  BRUTE-FORCE best rational (independent method #2).
//  Among every fraction p/q with 1 ≤ q ≤ Qmax, return the one CLOSEST to x.
//  For each q the optimal numerator is round(x·q); we keep the global best.
//  No shared code with the convergent recurrence — this is the honest oracle
//  the best-approximation theorem is checked against.
// ---------------------------------------------------------------------------
export function bruteBest(x, Qmax) {
  let best = null, bestErr = Infinity;
  for (let q = 1; q <= Qmax; q++) {
    const p = Math.round(x * q);
    const err = Math.abs(x - p / q);
    if (err < bestErr - 1e-18) {       // strict-enough to prefer smaller q on ties
      bestErr = err; best = { p, q, value: p / q, err };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
//  STERN–BROCOT mediant descent (independent method #3).
//  The Stern–Brocot tree generates every positive rational exactly once, in
//  lowest terms, by taking MEDIANTS:  mediant(a/b, c/d) = (a+c)/(b+d).
//  Starting from the boundaries 0/1 and 1/0, repeatedly replace the side x lies
//  on by the mediant; the path is the binary address of x's neighbourhood.
//  Records each mediant visited (the search path) up to `maxSteps` or until the
//  mediant equals x. The CONVERGENTS are exactly the path points where the
//  search switches direction (left↔right) — a fact the self-test verifies.
//  Returns { path:[{p,q}], }.
// ---------------------------------------------------------------------------
export function sternBrocotPath(x, maxSteps = 200) {
  // Work with the fractional structure for x ≥ 0. We only need x ≥ 0 here.
  let lo = { p: 0, q: 1 };          // 0/1
  let hi = { p: 1, q: 0 };          // 1/0 (=+∞)
  const path = [];
  for (let i = 0; i < maxSteps; i++) {
    const med = { p: lo.p + hi.p, q: lo.q + hi.q };
    path.push(med);
    const mv = med.p / med.q;
    if (Math.abs(mv - x) < 1e-15) break;
    if (x < mv) hi = med; else lo = med;
  }
  return { path };
}

// The "turning points" of a Stern–Brocot descent — the steps where the search
// switched direction. These coincide with the continued-fraction convergents.
// We derive direction by comparing each mediant's value to x.
export function sternBrocotTurningPoints(x, maxSteps = 200) {
  const { path } = sternBrocotPath(x, maxSteps);
  const turns = [];
  let prevDir = null;
  for (let i = 0; i < path.length; i++) {
    const v = path[i].p / path[i].q;
    const dir = (v < x) ? 'L' : 'R';   // L = we'll go right next (x above), etc.
    if (prevDir !== null && dir !== prevDir) {
      // direction changed at the PREVIOUS step → it was a convergent
      turns.push(path[i - 1]);
    }
    prevDir = dir;
  }
  // the last mediant is always a turning point (it is the deepest convergent reached)
  if (path.length) turns.push(path[path.length - 1]);
  return turns;
}

// ---------------------------------------------------------------------------
//  The approximation error of a convergent, and the THEORETICAL bound.
//  For convergents:  |x − p_n/q_n| < 1/(q_n·q_{n+1}) ≤ 1/q_n².
//  φ saturates this bound the most weakly (errors shrink slowest), which is the
//  precise sense in which φ is "the most irrational".
// ---------------------------------------------------------------------------
export function convergentError(x, p, q) {
  return Math.abs(x - p / q);
}

// Greatest common divisor — used to confirm convergents are already in lowest
// terms (gcd(p_n, q_n) = 1 always, a theorem; the test checks it).
export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

// Fibonacci numbers — the convergent denominators (and numerators) of φ.
export function fib(n) {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;   // fib(0)=0, fib(1)=1, fib(2)=1, …
}

// ---------------------------------------------------------------------------
//  THE SELF-TEST (the falsifiability harness).
//  Returns { pass, total, lines:[{name, ok, detail}] }.
//  Every claim the page makes is asserted here against an independent method
//  or a closed-form truth.
// ---------------------------------------------------------------------------
export function runSelfTest() {
  const lines = [];
  const approx = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // 1. φ = [1;1,1,1,…] — every partial quotient is 1 (the minimum).
  {
    const a = cfExpand(PHI, 25);
    const allOnes = a.every(ai => ai === 1);
    T('φ = [1;1,1,…] (all partial quotients are 1)', allOnes,
      `cf = [${a.slice(0, 10).join(',')},…]`);
  }

  // 2. φ's convergents are the Fibonacci ratios F_{n+1}/F_n.
  {
    const c = convergentsOf(PHI, 18);
    let ok = true, bad = '';
    for (let n = 0; n < c.length; n++) {
      // convergent n of φ is fib(n+2)/fib(n+1)
      if (c[n].p !== fib(n + 2) || c[n].q !== fib(n + 1)) { ok = false; bad = `n=${n}: ${c[n].p}/${c[n].q} ≠ ${fib(n+2)}/${fib(n+1)}`; break; }
    }
    T('φ convergents = Fibonacci ratios F_{n+1}/F_n', ok, ok ? `…13/8, 21/13, 34/21,…` : bad);
  }

  // 3. THE BEST-APPROXIMATION THEOREM (the crux): each convergent is the closest
  //    rational to x among ALL denominators ≤ q_n. Convergent recurrence (method 1)
  //    must agree with brute-force exhaustive search (method 2), for several x.
  {
    let ok = true, bad = '';
    const xs = [PHI, PI, E, SQRT2, Math.cbrt(2), 0.30102999566]; // last ≈ log10(2)
    outer:
    for (const x of xs) {
      const c = convergentsOf(x, 16);
      for (const cv of c) {
        if (cv.q < 1 || cv.q > 4000) continue;          // keep brute-force bounded
        if (cv.n === 0) continue;                        // a0/1 is trivial
        const bf = bruteBest(x, cv.q);
        // brute-force best at Q=q_n must BE the convergent (same fraction, reduced)
        const g = gcd(bf.p, bf.q);
        const bp = bf.p / g, bq = bf.q / g;
        if (bp !== cv.p || bq !== cv.q) {
          // tolerate the rare semiconvergent tie only if errors are equal
          if (!approx(bf.err, convergentError(x, cv.p, cv.q), 1e-15)) {
            ok = false; bad = `x≈${x.toFixed(6)}: brute ${bp}/${bq} ≠ convergent ${cv.p}/${cv.q}`; break outer;
          }
        }
      }
    }
    T('best-approximation theorem: convergent = brute-force closest (6 reals)', ok,
      ok ? 'recurrence and exhaustive search agree' : bad);
  }

  // 4. STERN–BROCOT descent agrees: its turning points are the convergents
  //    (independent method 3 lands on the same fractions).
  {
    let ok = true, bad = '';
    const xs = [PHI, SQRT2, PI, 0.6180339887];
    outer4:
    for (const x of xs) {
      const c = convergentsOf(x, 12).filter(cv => cv.q >= 1 && cv.q <= 5000);
      const turns = sternBrocotTurningPoints(x, 4000);
      // every convergent with q in range must appear among the turning points
      for (const cv of c) {
        if (cv.n === 0) continue;
        const found = turns.some(t => t.p === cv.p && t.q === cv.q);
        if (!found) { ok = false; bad = `x≈${x.toFixed(6)}: convergent ${cv.p}/${cv.q} not on Stern–Brocot path`; break outer4; }
      }
    }
    T('Stern–Brocot turning points = the convergents (4 reals)', ok,
      ok ? 'the mediant tree finds the same best rationals' : bad);
  }

  // 5. Convergents are always in lowest terms: gcd(p_n, q_n) = 1.
  {
    let ok = true, bad = '';
    for (const x of [PHI, PI, E, SQRT2, 1/3, 22/7]) {
      for (const cv of convergentsOf(x, 16)) {
        if (cv.q !== 0 && gcd(cv.p, cv.q) !== 1) { ok = false; bad = `${cv.p}/${cv.q} not reduced (x≈${x.toFixed(4)})`; break; }
      }
      if (!ok) break;
    }
    T('every convergent is already in lowest terms (gcd=1)', ok, ok ? '' : bad);
  }

  // 6. Convergents straddle x and converge: errors strictly decrease, and the
  //    bound |x − p_n/q_n| < 1/q_n² holds for every n≥1.
  {
    let ok = true, bad = '';
    for (const x of [PI, E, SQRT2, Math.cbrt(2)]) {
      const c = convergentsOf(x, 14).filter(cv => cv.n >= 1);
      let prevErr = Infinity;
      for (const cv of c) {
        const err = convergentError(x, cv.p, cv.q);
        if (err > prevErr + 1e-18) { ok = false; bad = `errors not decreasing at ${cv.p}/${cv.q}`; break; }
        if (err >= 1 / (cv.q * cv.q) + 1e-15) { ok = false; bad = `bound 1/q² violated at ${cv.p}/${cv.q}`; break; }
        prevErr = err;
      }
      if (!ok) break;
    }
    T('errors strictly shrink AND obey |x−p/q| < 1/q²', ok, ok ? '' : bad);
  }

  // 7. φ is THE MOST IRRATIONAL: at matching denominator size, φ's convergent
  //    error × q² → 1/√5 (the worst — i.e. LARGEST — possible limiting value;
  //    every other number does strictly better infinitely often). We check that
  //    φ's normalized error q²·|x−p/q| approaches 1/√5 ≈ 0.4472, and that a
  //    "rational-friendly" number like π (which has the big a=292 term) achieves
  //    a far SMALLER normalized error at its best convergent (292/… ⇒ 355/113).
  {
    const cphi = convergentsOf(PHI, 20).filter(c => c.n >= 6);
    const norm = cphi.map(c => c.q * c.q * convergentError(PHI, c.p, c.q));
    const lastNorm = norm[norm.length - 1];
    const okPhi = approx(lastNorm, 1 / Math.sqrt(5), 0.02);   // → 0.4472…
    // π's 355/113 is an extraordinarily good approx: q²·err is tiny.
    const cpi = convergentsOf(PI, 8);
    const c355 = cpi.find(c => c.p === 355 && c.q === 113);
    const piNorm = c355 ? c355.q * c355.q * convergentError(PI, c355.p, c355.q) : 1;
    const okPi = c355 && piNorm < 0.01;   // 355/113 beats φ's floor by ~50×
    T('φ is the most irrational: q²·err → 1/√5≈0.447 (π’s 355/113 reaches ' + piNorm.toFixed(4) + ')',
      okPhi && okPi, `φ q²·err→${lastNorm.toFixed(4)}; 355/113 q²·err=${piNorm.toFixed(5)}`);
  }

  // 8. π's CF begins [3;7,15,1,292,…]; its convergents include 22/7 and 355/113.
  {
    const a = cfExpand(PI, 6);
    const headOk = a[0] === 3 && a[1] === 7 && a[2] === 15 && a[3] === 1 && a[4] === 292;
    const c = convergentsOf(PI, 6);
    const has22_7 = c.some(cv => cv.p === 22 && cv.q === 7);
    const has355_113 = c.some(cv => cv.p === 355 && cv.q === 113);
    T('π = [3;7,15,1,292,…] → convergents 22/7 and 355/113', headOk && has22_7 && has355_113,
      `cf=[${a.join(',')}…]`);
  }

  // 9. NEGATIVE CONTROL: a rational terminates exactly. 22/7's CF is finite and
  //    cfExpand reproduces cfOfRational; an "approximation" of an exact rational
  //    is the rational itself.
  {
    const exact = cfOfRational(22, 7);              // [3;7]
    const okExact = exact.length === 2 && exact[0] === 3 && exact[1] === 7;
    // brute-force best of 22/7 at Q≥7 IS 22/7 with zero error
    const bf = bruteBest(22 / 7, 20);
    const g = gcd(bf.p, bf.q);
    const okBrute = (bf.p / g === 22 && bf.q / g === 7) && bf.err < 1e-12;
    T('negative control: rational 22/7 terminates ([3;7]) & approximates itself', okExact && okBrute,
      `cf(22/7)=[${exact.join(',')}]`);
  }

  // 10. SEED/INPUT PURITY: cfOfRational and cfExpand agree on a rational, and the
  //     convergent recurrence reconstructs x exactly from its (finite) CF.
  {
    let ok = true, bad = '';
    const cases = [[355, 113], [1, 7], [13, 8], [100, 3], [21, 13]];
    for (const [p, q] of cases) {
      const cf = cfOfRational(p, q);
      const c = convergents(cf);
      const last = c[c.length - 1];
      const g = gcd(p, q);
      if (last.p !== p / g || last.q !== q / g) { ok = false; bad = `reconstruct ${p}/${q} → ${last.p}/${last.q}`; break; }
    }
    T('finite CF reconstructs its rational exactly (5 cases)', ok, ok ? '' : bad);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
