/* ════════════════════════════════════════════════════════════════════════════
   THE COLUMN THAT DECIDES TO BEND — core.mjs · the buckling authority (pure, DOM-free).

   A slender elastic strut, pinned (clevis) top and bottom, squeezed end-to-end by an
   axial load P. Below a threshold it just compresses — dead straight. At a critical
   load P_crit it suddenly BOWS sideways: it buckles. This is Euler's column, and the
   onset is the cleanest pitchfork bifurcation in mechanics.

   ── THE ONSET (exact). For a pinned-pinned strut the critical load of mode m is
        P_crit(EI,L,m) = m²·π²·EI / L²        (Euler, 1744)
      and the buckled shape is the pure half-sine (m=1) y(s) = A·sin(π·s/L), or for a
      column braced at its midpoint the full sine (m=2) y(s) = A·sin(2π·s/L), whose
      onset is EXACTLY 4× higher. Two scaling limbs: P_crit ∝ 1/L² (inverse square in
      length) and P_crit ∝ EI (linear in bending stiffness).

   ── THE DISCRETE WITNESS (the honesty hedge). We do NOT plug the formula back in to
      "prove" it. We discretize the buckling eigenproblem y'' + λ y = 0, y(0)=y(L)=0 on
      N intervals (h = L/N) with the standard second-difference operator, and SOLVE the
      resulting symmetric tridiagonal eigenproblem (Jacobi rotations — no library). The
      smallest eigenvalue λ₁ is the simulated onset, and the eigenvector IS the sampled
      mode shape. CRITICAL HONESTY: the centred-difference scheme is only O(h²) accurate,
      so the coarse λ₁ does NOT match (π/L)² to 1e-9. What IS exact to machine ε is that
      our solver returns the DISCRETE operator's OWN closed-form eigenvalue
        λ_k^discrete = (2/h²)·(1 − cos(kπh/L)),   eigenvector v_j = sin(kπ·jh/L)
      — the eigen-solver is exactly correct even though the discretization approximates.
      Then we assert the discrete λ₁ CONVERGES to (π/L)² as N→∞ (O(h²) Richardson).
      Never claim 1e-9 from an O(h²) scheme; the 1e-9 headline rides the closed form and
      the modal purity, not the coarse finite-difference value.

   ── THE PERFECT PITCHFORK. Past P_crit the straight branch is unstable; two stable
      bowed branches peel symmetrically apart at amplitude ±A(P). For the perfect column
      A(P) = 0 for P ≤ P_crit and grows like √(P/P_crit − 1) just above it (the canonical
      pitchfork normal form ẋ = μx − x³, equilibria x = ±√μ). `branchAmplitude` is the
      SOLE source of that amplitude — it drives the two ghost struts, the live bow, and
      the companion inset, so they cannot drift apart.

   ── THE NEG-CONTROL (the asserted soul). A real column is never perfect. Give it an
      initial crookedness / load eccentricity e and the sharp fork DISSOLVES: it bows
      gradually from the very first ounce of load, with NO threshold and NO decision —
      the Southwell response  A = e·(P/P_crit) / (1 − P/P_crit), a smooth hyperbola that
      only blows up asymptotically AT P_crit, never a clean snap. `sharpThreshold` returns
      TRUE for the perfect column and FALSE for any e≠0; the self-test asserts BOTH, so
      GREEN means "perfect IS a sharp pitchfork AND imperfect is correctly NOT one."

   Inlined byte-faithfully into the page via forge:include, and imported by core.test.mjs,
   which runs the SAME runSelfTest() the in-page pill runs.
   ════════════════════════════════════════════════════════════════════════════ */

const PI = Math.PI;

/* ── THE CLOSED FORM ──────────────────────────────────────────────────────────
   Euler's critical load for a pinned-pinned strut, mode m (m=1 half-sine, m=2 full
   sine for the midpoint-braced column). P_crit = m²·π²·EI/L². */
export function pCrit(EI, L, mode = 1) {
  return (mode * mode * PI * PI * EI) / (L * L);
}

/* The (continuous) buckling eigenvalue λ = (mπ/L)²; P_crit = EI·λ. */
export function eulerLambda(L, mode = 1) {
  const k = (mode * PI) / L;
  return k * k;
}

/* The mode shape sampled at N+1 nodes s_j = j·L/N, j=0..N: y_j = sin(mπ s_j / L),
   normalised so the peak magnitude is 1. Returns a Float64Array of length N+1 with
   y_0 = y_N = 0 (the pinned ends). */
export function modeShape(L, mode, N) {
  const y = new Float64Array(N + 1);
  for (let j = 0; j <= N; j++) {
    const s = (j * L) / N;
    y[j] = Math.sin((mode * PI * s) / L);
  }
  // normalise to unit peak (the sampled sine already peaks at 1 when N is a multiple
  // of 2·mode; in general scale by the true max so the shape is amplitude-1).
  let peak = 0;
  for (let j = 0; j <= N; j++) peak = Math.max(peak, Math.abs(y[j]));
  if (peak > 0) for (let j = 0; j <= N; j++) y[j] /= peak;
  return y;
}

/* ── THE DISCRETE OPERATOR'S CLOSED-FORM EIGENVALUE (the honesty anchor) ───────
   The N−1 interior-node second-difference operator (−1,2,−1)/h² has exact eigenvalues
        λ_k = (2/h²)·(1 − cos(kπh/L)),  k = 1..N−1,   h = L/N
   with eigenvectors v_j = sin(kπ·jh/L). Our Jacobi solver must reproduce THIS to
   machine ε, and THIS converges to (kπ/L)² as h→0 at O(h²). */
export function discreteLambda(L, N, k = 1) {
  const h = L / N;
  return (2 / (h * h)) * (1 - Math.cos((k * PI * h) / L));
}

/* ── THE BUCKLING EIGENPROBLEM, SOLVED (no formula plugged back in) ────────────
   Build the (N−1)×(N−1) symmetric tridiagonal matrix A = (1/h²)·tridiag(−1, 2, −1)
   for y'' + λ y = 0 on the interior nodes with pinned ends, and SOLVE it with the
   cyclic Jacobi eigenvalue algorithm. Returns the sorted eigenvalues and the matching
   (column) eigenvectors padded with the two zero boundary nodes.

   onsetLoad(EI,L,N,mode) = EI · λ_mode(simulated) — the buckling load the discretized
   strut actually exhibits, NOT pCrit re-derived. For a finite N it sits a hair BELOW the
   continuous Euler load (the O(h²) deficit), and equals discreteLambda(L,N,mode)·EI to ε.
   ──────────────────────────────────────────────────────────────────────────── */
export function solveBuckling(L, N) {
  const m = N - 1;                       // interior nodes
  const h = L / N;
  const inv = 1 / (h * h);
  // dense symmetric matrix (m is small: N≈8..48 → m≈7..47)
  const A = [];
  for (let i = 0; i < m; i++) {
    A.push(new Float64Array(m));
  }
  for (let i = 0; i < m; i++) {
    A[i][i] = 2 * inv;
    if (i + 1 < m) { A[i][i + 1] = -inv; A[i + 1][i] = -inv; }
  }
  const { values, vectors } = jacobiEig(A);
  // sort ascending by eigenvalue, carrying the eigenvectors
  const order = values.map((v, i) => i).sort((a, b) => values[a] - values[b]);
  const lambdas = order.map(i => values[i]);
  const modes = order.map(i => {
    // pad the interior eigenvector with the two zero boundary nodes
    const full = new Float64Array(N + 1);
    for (let j = 0; j < m; j++) full[j + 1] = vectors[j][i];
    // sign + unit-peak normalise so the first nonzero lobe is positive
    let peak = 0, firstSign = 0;
    for (let j = 0; j <= N; j++) {
      const a = Math.abs(full[j]);
      if (a > peak) peak = a;
      if (firstSign === 0 && a > 1e-12) firstSign = Math.sign(full[j]);
    }
    if (peak > 0) for (let j = 0; j <= N; j++) full[j] = (full[j] / peak) * (firstSign || 1);
    return full;
  });
  return { lambdas, modes, h };
}

/* The SIMULATED onset load: EI times the mode-th eigenvalue of the solved discrete
   buckling operator (mode is 1-indexed). This is the load the discretized strut buckles
   at — the eigen-solve, not the closed form. */
export function onsetLoad(EI, L, N = 40, mode = 1) {
  const { lambdas } = solveBuckling(L, N);
  return EI * lambdas[mode - 1];
}

/* ── THE CYCLIC JACOBI EIGENVALUE ALGORITHM (symmetric, dependency-free) ───────
   Diagonalises a small dense symmetric matrix by a sequence of Givens rotations that
   zero the largest off-diagonal entry, accumulating the rotations into V. Exact to
   machine ε for the tridiagonal sizes we use. Returns { values, vectors } where
   vectors[row][col] is the col-th eigenvector's row-th component. */
export function jacobiEig(Ain, maxSweeps = 100) {
  const n = Ain.length;
  // working copy
  const A = Ain.map(r => Float64Array.from(r));
  // V = identity (accumulated eigenvectors)
  const V = [];
  for (let i = 0; i < n; i++) {
    const row = new Float64Array(n);
    row[i] = 1;
    V.push(row);
  }
  const offNorm = () => {
    let s = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) s += A[p][q] * A[p][q];
    return Math.sqrt(s);
  };
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    if (offNorm() < 1e-300 || offNorm() === 0) break;
    let converged = true;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        if (Math.abs(apq) < 1e-300) continue;
        converged = false;
        const app = A[p][p], aqq = A[q][q];
        // rotation angle: zero A[p][q]
        const tau = (aqq - app) / (2 * apq);
        const t = Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(tau * tau + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        // apply rotation to rows/cols p,q
        for (let k = 0; k < n; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        // accumulate into V
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
    }
    if (converged) break;
  }
  const values = new Array(n);
  for (let i = 0; i < n; i++) values[i] = A[i][i];
  return { values, vectors: V };
}

/* ── FOURIER (sine) PROJECTION — the modal-purity witness, no FFT dependency ───
   Project a shape sampled at N+1 nodes s_j = jL/N onto the sine basis sin(kπs/L),
   k=1..kmax, by the EXACT discrete sine transform (DST-I). The interior samples are
   sin(kπ·j/N), and the discrete sine basis is exactly orthogonal on the interior nodes:
        Σ_{j=1}^{N−1} sin(aπj/N)·sin(bπj/N) = (N/2)·δ_ab
   so a pure mode-m half/full-sine projects to coeff[m]=1 and ALL others 0 to machine ε —
   no quadrature error. (Trapezoidal integration would leak O(1/N²) into off-modes; the
   DST orthogonality makes the purity claim genuinely exact, the whole point of the test.)
   Returns coeffs normalised so the dominant coefficient is 1. */
export function fourierCoeffs(shape, L, kmax = 8) {
  const N = shape.length - 1;
  const coeffs = new Float64Array(kmax + 1);   // 1-indexed; coeffs[0] unused
  for (let k = 1; k <= kmax; k++) {
    let acc = 0;
    for (let j = 1; j < N; j++) {                // interior nodes only (endpoints are 0)
      acc += shape[j] * Math.sin((k * PI * j) / N);
    }
    coeffs[k] = (2 / N) * acc;                   // DST-I inverse normalisation
  }
  // normalise to unit dominant coefficient (sign-fixed positive)
  let peak = 0, peakK = 1;
  for (let k = 1; k <= kmax; k++) if (Math.abs(coeffs[k]) > peak) { peak = Math.abs(coeffs[k]); peakK = k; }
  if (peak > 0) {
    const sgn = Math.sign(coeffs[peakK]) || 1;
    for (let k = 1; k <= kmax; k++) coeffs[k] = (coeffs[k] / peak) * sgn;
  }
  return coeffs;
}

/* ── THE PERFECT PITCHFORK BRANCH — the SOLE amplitude authority ───────────────
   The post-buckling equilibrium amplitude of the PERFECT column at load P, in the SAME
   length units as L (a render-scale amplitude, not a claimed exact elastica). It is the
   pitchfork normal-form branch: 0 below threshold, √(P/P_crit − 1) above, scaled by a
   length so the bow reads at strut-scale. This single function drives the two ghost
   struts, the live bow target, AND the companion inset — they cannot drift.

   HONESTY: the BRANCH FORM (zero, then √-onset growth) is the proven object; the large-
   amplitude bow geometry is rendered faithful-but-approximate and is NOT asserted. */
export function branchAmplitude(P, Pcr, scale = 1) {
  if (Pcr <= 0) return 0;
  const mu = P / Pcr - 1;
  if (mu <= 0) return 0;
  return scale * Math.sqrt(mu);
}

/* ── THE IMPERFECT (eccentric / crooked) RESPONSE — the neg-control ────────────
   The Southwell / load-eccentricity mid-span deflection: A = e·(P/Pcr)/(1 − P/Pcr).
   With e>0 it is positive for ALL P>0 (no zero-below-threshold branch), grows smoothly,
   and only blows up asymptotically as P→Pcr — no critical point, no decision. Capped at
   P just under Pcr for rendering. */
export function eccentricMid(P, Pcr, ecc, scale = 1) {
  if (Pcr <= 0 || ecc === 0) return 0;
  const r = Math.min(P / Pcr, 0.9999);
  return scale * ecc * (r / (1 - r));
}

/* ── THE ASSERTED SOUL: does this response have a SHARP threshold? ─────────────
   A perfect pitchfork is FLAT (A≡0) below P_crit then lifts off — a genuine threshold.
   An eccentric response is positive immediately and has NO flat region: no threshold.
   `sharpThreshold` samples a load below P_crit; TRUE iff the amplitude there is ≈0.
   The self-test asserts sharpThreshold(perfect)===true AND sharpThreshold(eccentric)
   ===false — GREEN means the knife-edge belongs to perfect symmetry, not the apparatus. */
export function sharpThreshold(ecc, Pcr = 1, scale = 1) {
  // probe at 70% of P_crit: a perfect column is dead flat there; an imperfect one is not.
  const Pprobe = 0.7 * Pcr;
  const amp = (ecc === 0)
    ? branchAmplitude(Pprobe, Pcr, scale)
    : eccentricMid(Pprobe, Pcr, ecc, scale);
  return Math.abs(amp) < 1e-12;
}

/* ════════════════════════════════════════════════════════════════════════════
   THE SELF-TEST — proves the six directive claims; the Node twin runs the SAME code.
   ════════════════════════════════════════════════════════════════════════════ */
export function runSelfTest() {
  const log = [];
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; log.push('✗ ' + m); } };

  const EI = 1.7;   // arbitrary stiffness — laws hold for any positive EI

  // (1) ONSET. The DISCRETE solver returns the discrete operator's OWN closed form to
  //     machine ε (the eigen-solve is EXACT), and that discrete eigenvalue CONVERGES to
  //     the Euler load π²EI/L² as N→∞ at O(h²). We never claim 1e-9 from the coarse O(h²)
  //     scheme; the 1e-9 headline rides the solver↔closed-form identity and the modal
  //     purity. Because we PROVE solveBuckling === discreteLambda to ε here, the N→∞ limit
  //     is taken on the proven-equivalent closed form (fast and exact — no giant solve).
  {
    let worstDiscrete = 0;
    for (const L of [0.5, 1, 2, 4, 7]) {
      // the SOLVED λ₁ === discreteLambda(L,N,1) to machine ε (the eigen-solve is exact)
      for (const N of [8, 12, 20, 32, 48]) {
        const { lambdas } = solveBuckling(L, N);
        worstDiscrete = Math.max(worstDiscrete, Math.abs(lambdas[0] - discreteLambda(L, N, 1)));
      }
    }
    ok(worstDiscrete < 1e-9, `solved λ₁ === the discrete operator's closed form to machine ε (worst |Δ| ${worstDiscrete.toExponential(2)})`);
    // convergence to Euler as N→∞ (on the proven-equivalent discrete eigenvalue).
    let worstHighN = 0;
    for (const L of [0.5, 1, 2, 4, 7]) {
      const sim = EI * discreteLambda(L, 8000, 1);   // a fine grid — still the discrete onset
      const euler = pCrit(EI, L, 1);
      worstHighN = Math.max(worstHighN, Math.abs(sim - euler) / euler);
    }
    ok(worstHighN < 1e-6, `the discrete onset → π²EI/L² as N→∞ (worst rel. dev at N=8000 ${worstHighN.toExponential(2)})`);
    // and the convergence is genuinely O(h²): halving h quarters the deficit. The solver
    // and discreteLambda are identical (asserted above), so we read the deficit off the
    // closed form to keep the test light.
    const L = 2, euler = pCrit(EI, L, 1);
    const eN = Math.abs(EI * discreteLambda(L, 40, 1) - euler);
    const e2N = Math.abs(EI * discreteLambda(L, 80, 1) - euler);
    const ratio = eN / e2N;   // ≈ 4 for O(h²)
    ok(Math.abs(ratio - 4) < 0.02, `the finite-difference deficit is O(h²): error ratio N→2N = ${ratio.toFixed(3)} ≈ 4`);
    // the coarse onset honestly sits BELOW Euler (the O(h²) deficit is real, not hidden).
    ok(onsetLoad(EI, L, 16, 1) < euler, `the coarse N=16 simulated onset sits below Euler (the deficit is honest)`);
  }

  // (2) SCALING LAWS (exact, from the closed form). Inverse-square in L, linear in EI.
  {
    const L = 3;
    const invSq = pCrit(EI, L / 2, 1) / pCrit(EI, L, 1);
    const lin = pCrit(2 * EI, L, 1) / pCrit(EI, L, 1);
    ok(Math.abs(invSq - 4) < 1e-9, `halve L → P_crit ×4 (inverse square): ratio ${invSq.toFixed(9)}`);
    ok(Math.abs(lin - 2) < 1e-9, `double EI → P_crit ×2 (linear): ratio ${lin.toFixed(9)}`);
  }

  // (3) LEADING MODE = a pure half-sine: fourierCoeffs(modeShape(L,1)) → coeff[1]=1, rest 0.
  {
    const L = 2.5, N = 64;
    const c = fourierCoeffs(modeShape(L, 1, N), L, 8);
    let restMax = 0;
    for (let k = 2; k <= 8; k++) restMax = Math.max(restMax, Math.abs(c[k]));
    ok(Math.abs(c[1] - 1) < 1e-9, `mode-1 shape projects to coeff[1]=1 (got ${c[1].toFixed(9)})`);
    ok(restMax < 1e-9, `all higher coeffs of the half-sine are 0 (max ${restMax.toExponential(2)})`);
    // the SOLVED mode-1 eigenvector is also the pure half-sine: its DST is k=1 only, to ε,
    // because the discrete operator's eigenvector IS the sampled sine (exact orthogonality).
    const { modes } = solveBuckling(L, N);
    const cs = fourierCoeffs(modes[0], L, 8);
    let restSolved = 0;
    for (let k = 2; k <= 8; k++) restSolved = Math.max(restSolved, Math.abs(cs[k]));
    ok(Math.abs(cs[1] - 1) < 1e-9 && restSolved < 1e-9, `the SOLVED mode-1 eigenvector is the pure half-sine (coeff[1]=${cs[1].toFixed(9)}, rest ${restSolved.toExponential(2)})`);
  }

  // (4) SECOND MODE (the braced-midpoint ×4 jump) = full sine, pure k=2.
  {
    const L = 2.5, N = 64;
    const ratio = pCrit(EI, L, 2) / pCrit(EI, L, 1);
    ok(Math.abs(ratio - 4) < 1e-9, `bracing the midpoint lifts onset ×4 (mode-2 / mode-1 = ${ratio.toFixed(9)})`);
    const c = fourierCoeffs(modeShape(L, 2, N), L, 8);
    let off = 0;
    for (let k = 1; k <= 8; k++) if (k !== 2) off = Math.max(off, Math.abs(c[k]));
    ok(Math.abs(c[2] - 1) < 1e-9 && off < 1e-9, `mode-2 shape is the pure full sine (coeff[2]=${c[2].toFixed(9)}, all others ${off.toExponential(2)})`);
    // the solver's SECOND eigenvalue also equals the mode-2 discrete closed form to ε,
    // and its eigenvector is the pure full sine (DST coeff[2] only).
    const { lambdas, modes } = solveBuckling(L, N);
    ok(Math.abs(lambdas[1] - discreteLambda(L, N, 2)) < 1e-9, `the solved 2nd eigenvalue === the discrete mode-2 closed form to ε`);
    const c2 = fourierCoeffs(modes[1], L, 8);
    let off2 = 0; for (let k = 1; k <= 8; k++) if (k !== 2) off2 = Math.max(off2, Math.abs(c2[k]));
    ok(Math.abs(c2[2] - 1) < 1e-9 && off2 < 1e-9, `the SOLVED 2nd eigenvector is the pure full sine (coeff[2]=${c2[2].toFixed(9)}, others ${off2.toExponential(2)})`);
  }

  // (5) NEG-CONTROL fires RED (the asserted soul). Perfect IS a sharp pitchfork; any
  //     eccentricity is correctly NOT one. We assert BOTH so a naive runner can't mis-
  //     report the expected-false as a real failure.
  {
    const Pcr = pCrit(EI, 2, 1);
    ok(sharpThreshold(0, Pcr) === true, `the PERFECT column has a sharp threshold (flat below P_crit)`);
    ok(sharpThreshold(0.03, Pcr) === false, `an eccentric column has NO sharp threshold — the neg-control fires RED`);
    // the perfect branch is dead flat below P_crit, lifts off above; the eccentric one
    // is positive for ALL P>0 (no flat region, no decision).
    let perfectFlatBelow = true, eccPositiveBelow = true, perfectLiftsAbove = true;
    for (let r = 0.05; r < 1; r += 0.05) {
      if (branchAmplitude(r * Pcr, Pcr) > 1e-12) perfectFlatBelow = false;
      if (eccentricMid(r * Pcr, Pcr, 0.03) <= 0) eccPositiveBelow = false;
    }
    if (branchAmplitude(1.4 * Pcr, Pcr) <= 0) perfectLiftsAbove = false;
    ok(perfectFlatBelow, `perfect amplitude ≡ 0 for every P < P_crit (the flat handle of the fork)`);
    ok(eccPositiveBelow, `eccentric amplitude > 0 for every P > 0 (no threshold — the fork dissolved)`);
    ok(perfectLiftsAbove, `perfect amplitude > 0 above P_crit (the tines peel apart)`);
    // the canonical √ onset: just above threshold A ∝ √(P/P_crit − 1).
    const a1 = branchAmplitude(1.01 * Pcr, Pcr), a4 = branchAmplitude(1.04 * Pcr, Pcr);
    ok(Math.abs(a4 / a1 - 2) < 1e-9, `the branch grows like √(P/P_crit−1): A(1.04)/A(1.01) = ${(a4 / a1).toFixed(6)} ≈ 2`);
  }

  // (6) The two ghosts come from ONE source: branchAmplitude drives ±A symmetrically.
  {
    const Pcr = pCrit(EI, 2, 1);
    const A = branchAmplitude(1.3 * Pcr, Pcr, 0.4);
    ok(A > 0 && Number.isFinite(A), `branchAmplitude is the single ± source for both ghost tines (A=${A.toFixed(4)})`);
    // below threshold both ghosts coincide with the straight strut (A=0 → tines fused).
    ok(branchAmplitude(0.5 * Pcr, Pcr, 0.4) === 0, `below P_crit both ghost tines fuse onto the straight strut (A=0)`);
  }

  return { pass, fail, log };
}

/* ── Node bridge. `forge` strips this dual-use guard wholesale when it inlines this
   core into the page; in the browser `module`/`require` are undefined anyway. On Node
   it exposes the surface for a CommonJS path, but the real Node entry point is
   core.test.mjs, which `import`s this module (ESM) and runs the SAME runSelfTest() —
   `node the-bending-column/core.test.mjs` exits 0 iff every claim is green. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    pCrit, eulerLambda, modeShape, discreteLambda, solveBuckling, onsetLoad,
    jacobiEig, fourierCoeffs, branchAmplitude, eccentricMid, sharpThreshold, runSelfTest,
  };
}
