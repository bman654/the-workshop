// ============================================================================
//  THE CONSERVATORY · THE DRIFT JAR  —  core math (the single source of truth).
//
//  THE ONE IDEA.  A FINITE jar of M = 2N gene-copies, each a single GOLD or SLATE
//  bead.  Nothing selects, nothing mutates — every generation the jar simply REBUILDS
//  itself by copying: each of the M new beads picks a parent uniformly at random (with
//  replacement) and takes its colour.  This is the WRIGHT–FISHER model.  RUN it and the
//  gold fraction x = k/M wanders — pure copying-luck, no force — until one colour is
//  GONE FOREVER.  A finite pool ALWAYS drifts, and ALWAYS ends MONOCHROME.  Its sibling
//  the Gene Jar (an INFINITE pool) never drifts; this one is the limit that jar never
//  leaves — let N → ∞ and the drift switches off.
//
//  THE THREE PROVEN CLAIMS (the quiet proof layer — exact, fired only by the self-test).
//
//   (1) FIXATION PROBABILITY = THE INITIAL FREQUENCY.  Reading the next gold count as a
//       (2N+1)-state Markov chain — next count ~ Binomial(M, k/M), a DENSE row of full
//       support (NOT tridiagonal: that is the Moran cousin) — the two monochrome states
//       0 and M are ABSORBING.  Solve the absorption system u = T·u with u₀ = 0, u_M = 1
//       and the probability of fixing GOLD from a start of i gold beads is EXACTLY
//
//             u_i = i / M = p₀          (the martingale's optional-stopping payoff)
//
//       — to the bit, by dense Gauss elimination on the interior, NEVER by Monte-Carlo.
//
//   (2) THE CENTRE NEVER DRIFTS (martingale).  Push a founding point-mass at i₀ = round(2N·p)
//       through Tᵗ and the mean E[x_t] = p₀ for ALL t — the ensemble average is pinned.
//
//   (3) HETEROZYGOSITY DRAINS BY A FIXED FACTOR.  H_t = 2·E[x_t(1−x_t)] obeys the exact
//       coalescent recursion H_{t+1} = (1 − 1/M)·H_t, so
//
//             H_t = 2 p₀ q₀ · (1 − 1/2N)ᵗ ,     H₀ = 2 p₀ q₀
//
//       — the jar's "mixedness" decays geometrically by decayFactor = 1 − 1/2N each
//       generation, hitting 0 exactly when it goes monochrome.
//
//  THE NEG-CONTROL (the lie given a real chance to look true) — N → ∞.  Take the pool
//  to infinity and decayFactor = 1 − 1/2N → 1: heterozygosity is PINNED at 2pq, it
//  never bleeds and NEVER fixes.  Drift is a purely FINITE-N effect — the Gene Jar IS
//  this jar's N → ∞ limit, and the self-test proves the limit by sweeping N to a million.
//
//  THE LIVING JAR (honest sampling — NEVER a proof).  makeJar/stepJar run the literal
//  Wright–Fisher resample on a seeded xorshift32 stream (byte-identical to the gene-jar
//  / selection-jar): each child copies a randomly-picked parent's bead (and its founder
//  lineage, so a single ancestor can be watched to conquer or vanish).  The realized
//  gold count is Binomial(M, x) in distribution — identical claims, richer image.  An
//  ENSEMBLE of seeded jars is the Monte-Carlo WITNESS: the fraction that fix gold lands
//  within ±KSIG·√(p₀q₀/jars) of p₀, the per-gen mean tracks p₀, the per-gen
//  heterozygosity tracks 2pq(1−1/2N)ᵗ.  We MEASURE the band; we never call it a proof.
//
//  Everything here is pure: no DOM, no network.  The landing's planter-light AND the
//  bench BOTH import this file so they can never drift apart.
// ============================================================================

// ===== DRIFT-JAR CORE (byte-identical to core.mjs) =====
// The tolerance capsule — KSIG (how many √-band standard errors wide a sampling-witness
// pass band is; house value 3, shared with the gene-jar / selection-jar / pinhole-race),
// EXACT (the proof-layer tolerance the dense-matrix checks must beat), N_DEFAULT (the
// hero jar size: N individuals ⇒ M = 2N = 24 beads).  All bands derive from KSIG·SE.
const P = { KSIG: 3, EXACT: 1e-12, N_DEFAULT: 12 };

// ── the seedable xorshift32 PRNG — BYTE-IDENTICAL to the gene-jar / selection-jar /
//    pinhole-race / demon / brownian benches.  s = (0x2545F491 ^ seed) >>> 0; xorshift; [0,1).
function makeRng(seed = 1) {
  let s = (0x2545F491 ^ (seed >>> 0)) >>> 0;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// ── the closed forms (the quiet proof layer) ────────────────────────────────────────
//  copies(N): the jar holds M = 2N gene-copies (a diploid pool of N individuals).
function copies(N) { return 2 * N; }
//  decayFactor(N): heterozygosity shrinks by 1 − 1/2N each generation (→ 1 as N → ∞).
function decayFactor(N) { return 1 - 1 / (2 * N); }
//  heterozygosity(p, N, t): the expected "mixedness" 2pq after t generations of drift,
//  H_t = 2pq·(1 − 1/2N)ᵗ.  At N → ∞ it is pinned at 2pq (the Gene Jar — never drains).
function heterozygosity(p, N, t) { return 2 * p * (1 - p) * Math.pow(1 - 1 / (2 * N), t); }
//  fixationProb(p): P(the jar ends ALL gold | it started a fraction p gold) = p, exactly
//  (the martingale's optional-stopping payoff — proven by absorptionProbs below).
function fixationProb(p) { return p; }

// ── EXACT dense (2N+1)-state Wright–Fisher matrix (proof layer; fires ONLY in the
//    self-test, NEVER the animation hot path).  ─────────────────────────────────────
//  logChoose(n, k): log C(n, k) by a stable additive loop (accurate to ~machine eps).
function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  const kk = Math.min(k, n - k);
  let r = 0;
  for (let i = 1; i <= kk; i++) r += Math.log(n - kk + i) - Math.log(i);
  return r;
}
//  transitionRow(M, i): row i of T — next gold count ~ Binomial(M, i/M), full support,
//  via log-choose + exp then renormalized (kills exp drift).  Rows 0 and M are ABSORBING.
function transitionRow(M, i) {
  const row = new Float64Array(M + 1);
  if (i === 0) { row[0] = 1; return row; }          // all slate — absorbing
  if (i === M) { row[M] = 1; return row; }          // all gold — absorbing
  const lq = Math.log(i / M), l1q = Math.log(1 - i / M);
  let sum = 0;
  for (let j = 0; j <= M; j++) { const v = Math.exp(logChoose(M, j) + j * lq + (M - j) * l1q); row[j] = v; sum += v; }
  for (let j = 0; j <= M; j++) row[j] /= sum;        // renormalize to a clean stochastic row
  return row;
}
//  buildMatrix(N): the dense (M+1)×(M+1) transition matrix (each row a Float64Array).
function buildMatrix(N) {
  const M = 2 * N, T = new Array(M + 1);
  for (let i = 0; i <= M; i++) T[i] = transitionRow(M, i);
  return T;
}
//  gaussSolve(A, b): dense Gauss–Jordan with partial pivoting, A an array of rows.
function gaussSolve(A, b) {
  const n = b.length, a = new Array(n);
  for (let i = 0; i < n; i++) { const row = new Float64Array(n + 1); for (let j = 0; j < n; j++) row[j] = A[i][j]; row[n] = b[i]; a[i] = row; }
  for (let c = 0; c < n; c++) {
    let piv = c, best = Math.abs(a[c][c]);
    for (let r = c + 1; r < n; r++) { const v = Math.abs(a[r][c]); if (v > best) { best = v; piv = r; } }
    if (piv !== c) { const t = a[piv]; a[piv] = a[c]; a[c] = t; }
    const d = a[c][c];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = a[r][c] / d;
      if (f === 0) continue;
      for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k];
    }
  }
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = a[i][n] / a[i][i];
  return x;
}
//  absorptionProbs(N): solve u = T·u with u₀ = 0, u_M = 1 on the interior 1…M−1 (dense
//  Gauss).  Returns u (length M+1); the martingale makes u_i === i/M to the bit.
function absorptionProbs(N) {
  const M = 2 * N, T = buildMatrix(N), n = M - 1;
  const A = new Array(n), b = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const Ai = new Float64Array(n);
    for (let j = 0; j < n; j++) Ai[j] = (i === j ? 1 : 0) - T[i + 1][j + 1];   // (I − T_int)
    A[i] = Ai; b[i] = T[i + 1][M];                                            // RHS = flux into "all gold"
  }
  const x = gaussSolve(A, b);
  const u = new Float64Array(M + 1);
  u[0] = 0; u[M] = 1;
  for (let i = 0; i < n; i++) u[i + 1] = x[i];
  return u;
}
//  evolveDistribution(N, p, t): push a founding point-mass at i₀ = round(2N·p) through
//  Tᵗ (t mat-vecs, no matrix power).  Returns { dist, mean, het, p₀, i₀, M }.  The mean
//  stays p₀ (martingale) and het = 2p₀q₀(1−1/2N)ᵗ (the coalescent drain), both exact.
function evolveDistribution(N, p, t) {
  const M = 2 * N, i0 = Math.round(2 * N * p), p0 = i0 / M, T = buildMatrix(N);
  let dist = new Float64Array(M + 1); dist[i0] = 1;
  for (let s = 0; s < t; s++) {
    const next = new Float64Array(M + 1);
    for (let i = 0; i <= M; i++) {
      const di = dist[i]; if (di === 0) continue;
      const row = T[i];
      for (let j = 0; j <= M; j++) next[j] += di * row[j];
    }
    dist = next;
  }
  let mean = 0, exx = 0;
  for (let i = 0; i <= M; i++) { const x = i / M; mean += x * dist[i]; exx += x * (1 - x) * dist[i]; }
  return { dist, mean, het: 2 * exx, p0, i0, M };
}

// ── LIVING-JAR primitives (the seeded sim the UI animates — honest sampling, NEVER a
//    proof).  A jar carries beads:Uint8Array(M) (1 = gold, 0 = slate), founders:Uint16Array
//    (M) (each bead's ancestral lineage id), k (gold count), gen, and its own _rng stream.
// ────────────────────────────────────────────────────────────────────────────────────
//  makeJar({N,p,seed}): M = 2N beads, EXACTLY k₀ = round(M·p) gold then shuffled
//  (deterministic founding ⇒ H₀ = 2p₀q₀ exact).  founders[i] = i (each cell its own
//  ancestor at gen 0).  Fully determined by its seed.
function makeJar({ N = P.N_DEFAULT, p = 0.5, seed = 1 } = {}) {
  const M = 2 * N, k0 = Math.round(M * p);
  const beads = new Uint8Array(M), founders = new Uint16Array(M);
  for (let i = 0; i < M; i++) { beads[i] = i < k0 ? 1 : 0; founders[i] = i; }
  const rng = makeRng(seed >>> 0);
  for (let i = M - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = beads[i]; beads[i] = beads[j]; beads[j] = t; }
  const k = k0;                                       // shuffling colours conserves the count
  return {
    N, M, p, seed: seed >>> 0, beads, founders, k, gen: 0, _rng: rng,
    kPrev: k, x: k / M, fixed: (k === 0 || k === M), fixedGold: (k === M), draw: null, copies: null,
  };
}
//  stepJar(jar, {detail}): ONE Wright–Fisher generation as the PARENT-PICK resample.
//  For each child i, draw[i] = ⌊rng()·M⌋ and child i inherits beads[draw[i]] (and its
//  founder).  The realized count k is Binomial(M, x) in distribution.  detail:true (the
//  focus jar) also emits draw[] (child→parent) and copies[] (per-parent child count) for
//  the copy-thread animation + follow-a-lineage; the cheap wall calls it with detail:false.
function stepJar(jar, { detail = false } = {}) {
  const M = jar.M;
  const rng = jar._rng || makeRng((jar.seed >>> 0) ^ (0x9e3779b1 * (jar.gen + 1) >>> 0));
  const beads = jar.beads, founders = jar.founders;
  const nb = new Uint8Array(M), nf = new Uint16Array(M);
  const draw = detail ? new Uint16Array(M) : null;
  const cop = detail ? new Uint16Array(M) : null;
  let k = 0;
  for (let i = 0; i < M; i++) {
    const d = (rng() * M) | 0;                        // parent-pick (uniform, with replacement)
    nb[i] = beads[d]; nf[i] = founders[d];
    if (nb[i]) k++;
    if (detail) { draw[i] = d; cop[d]++; }
  }
  return {
    N: jar.N, M, p: jar.p, seed: jar.seed, beads: nb, founders: nf, k, gen: jar.gen + 1, _rng: rng,
    kPrev: jar.k, x: k / M, fixed: (k === 0 || k === M), fixedGold: (k === M), draw, copies: cop,
  };
}
//  runJar(jar, maxGen): step until monochrome (or maxGen).  Returns { gens, fixedGold,
//  fixed, trail (x per gen, gen0 first), jar }.
function runJar(jar, maxGen = 100000) {
  let j = jar, g = 0;
  const trail = [j.x];
  while (!j.fixed && g < maxGen) { j = stepJar(j); trail.push(j.x); g++; }
  return { gens: g, fixedGold: j.fixedGold, fixed: j.fixed, trail, jar: j };
}
//  runEnsemble({jars,N,p,seed,maxGen,recordGens}): the Monte-Carlo WITNESS — many
//  INDEPENDENT seeded jars (substream seed = (seed ^ (0x9E3779B1·(j+1))) >>> 0, j=0
//  reserved for the focus jar).  Each runs to monochrome.  Returns fixedGoldFraction
//  (lands within ±KSIG·band of p₀, band = √(p₀q₀/jars)), perGenMeanX (≈ p₀), perGenHet
//  (tracks 2p₀q₀(1−1/2N)ᵗ), allFixed, meanGens.
function runEnsemble({ jars = 200, N = P.N_DEFAULT, p = 0.5, seed = 1, maxGen = 6000, recordGens = 0 } = {}) {
  const M = 2 * N, k0 = Math.round(M * p), p0 = k0 / M, q0 = 1 - p0, R = recordGens | 0;
  const sumX = R ? new Float64Array(R + 1) : null, sumHet = R ? new Float64Array(R + 1) : null;
  let fixedGold = 0, allFixed = true, maxGenSeen = 0, sumGens = 0;
  for (let j = 0; j < jars; j++) {
    let jar = makeJar({ N, p, seed: (seed ^ (0x9e3779b1 * (j + 1))) >>> 0 });
    if (R) { sumX[0] += jar.x; sumHet[0] += 2 * jar.x * (1 - jar.x); }
    let g = 0;
    while (!jar.fixed && g < maxGen) {
      jar = stepJar(jar); g++;
      if (R && g <= R) { sumX[g] += jar.x; sumHet[g] += 2 * jar.x * (1 - jar.x); }
    }
    if (R && g < R) { const xf = jar.x, hf = 2 * xf * (1 - xf); for (let gg = g + 1; gg <= R; gg++) { sumX[gg] += xf; sumHet[gg] += hf; } }
    if (jar.fixedGold) fixedGold++;
    if (!jar.fixed) allFixed = false;
    if (g > maxGenSeen) maxGenSeen = g;
    sumGens += g;
  }
  return {
    jars, N, M, p0, q0, fixedGold, fixedGoldFraction: fixedGold / jars,
    band: Math.sqrt(p0 * q0 / jars), allFixed, maxGenSeen, meanGens: sumGens / jars,
    perGenMeanX: R ? Array.from(sumX, (s) => s / jars) : null,
    perGenHet: R ? Array.from(sumHet, (s) => s / jars) : null,
  };
}

// ============================================================================
//  THE SELF-TEST — the named, load-bearing assertions (★ = falsifier).  SELF-CONTAINED
//  (no cross-import, so it byte-inlines into the page verbatim).  Its capped N-grid is
//  INDEPENDENT of any UI N — the live jar's N never feeds runSelfTest.  Returns
//  { pass, total, checks:[{name,pass,info}], detail } (the wing's landing reads this).
// ============================================================================
function runSelfTest(opts = {}) {
  const jars = opts.jars || 4000;
  const nCap = opts.nCap || 30;          // in-page caps the matrix checks at N ≤ 20
  const KSIG = P.KSIG, EXACT = P.EXACT;
  const checks = [];
  const detail = {};
  const ok = (name, cond, info) => checks.push({ name, pass: !!cond, info: info || '' });

  // (1)★ EXACT MARKOV ABSORPTION = INITIAL FREQUENCY — the dense (2N+1)-state WF chain's
  //   absorption u = T·u (u₀=0, u_M=1) gives u_i === i/M to <EXACT.  THE crux: fixation
  //   probability is the starting frequency, by exact Markov algebra — NOT Monte-Carlo.
  {
    const NS = [4, 8, 12, 16, 20, 30].filter((n) => n <= nCap);
    let worst = 0, where = '';
    for (const N of NS) {
      const M = 2 * N, u = absorptionProbs(N);
      for (let i = 0; i <= M; i++) { const e = Math.abs(u[i] - i / M); if (e > worst) { worst = e; where = 'N=' + N + ' i=' + i; } }
    }
    detail.absWorst = worst;
    ok('(1)★ exact Markov absorption: dense WF u===i/M (fixation prob = initial p) over N∈{' + NS.join(',') + '}',
       worst < EXACT, 'max|u_i − i/M| = ' + worst.toExponential(2) + ' @ ' + where);
  }

  // (2)★ MARTINGALE — push a founding point-mass through Tᵗ and the mean stays p₀ (=i₀/M)
  //   to <EXACT for every t.  The ensemble centre is pinned: drift spreads, never shifts.
  {
    let worst = 0, where = '';
    for (const N of [4, 8, 12, 16, 20].filter((n) => n <= nCap)) {
      for (const p of [0.2, 0.375, 0.5, 0.7]) {
        for (const t of [1, 2, 4, 8]) {
          const e = evolveDistribution(N, p, t), d = Math.abs(e.mean - e.p0);
          if (d > worst) { worst = d; where = 'N=' + N + ' p=' + p + ' t=' + t; }
        }
      }
    }
    detail.meanWorst = worst;
    ok('(2)★ martingale: matrix-evolved mean === p₀ for all t (the ensemble centre never drifts)',
       worst < EXACT, 'max|mean − p₀| = ' + worst.toExponential(2) + ' @ ' + where);
  }

  // (3)★ HETEROZYGOSITY DECAY — the matrix het equals 2p₀q₀(1−1/2N)ᵗ to <EXACT (the exact
  //   coalescent drain), and H₀ === 2p₀q₀.  The jar's mixedness empties geometrically.
  {
    let worst = 0, where = '', h0worst = 0;
    for (const N of [4, 8, 12, 16, 20].filter((n) => n <= nCap)) {
      for (const p of [0.2, 0.375, 0.5, 0.7]) {
        const e0 = evolveDistribution(N, p, 0);
        h0worst = Math.max(h0worst, Math.abs(e0.het - 2 * e0.p0 * (1 - e0.p0)));
        for (const t of [1, 2, 4, 8]) {
          const e = evolveDistribution(N, p, t), d = Math.abs(e.het - heterozygosity(e.p0, N, t));
          if (d > worst) { worst = d; where = 'N=' + N + ' p=' + p + ' t=' + t; }
        }
      }
    }
    detail.hetWorst = worst; detail.h0Worst = h0worst;
    ok('(3)★ heterozygosity decay: matrix H === 2p₀q₀(1−1/2N)ᵗ and H₀===2p₀q₀ to <EXACT',
       worst < EXACT && h0worst < EXACT,
       'max|H − pred| = ' + worst.toExponential(2) + ' · max|H₀ − 2p₀q₀| = ' + h0worst.toExponential(2) + ' @ ' + where);
  }

  // (4)★ NEG-CONTROL N→∞ — decayFactor → 1 MONOTONICALLY and heterozygosity → 2pq for a
  //   fixed t as N sweeps to a million: drift is a purely FINITE-N effect; the infinite
  //   pool (the Gene Jar) never bleeds and never fixes.  Pinned, never drifts, never fixes.
  {
    const NS = [10, 1e2, 1e3, 1e4, 1e5, 1e6];
    const p = 0.3, t = 10, target = 2 * p * (1 - p);
    let monoDecay = true, monoHet = true, prevGap = Infinity, prevHetGap = Infinity;
    for (const N of NS) {
      const gap = 1 - decayFactor(N), hetGap = Math.abs(heterozygosity(p, N, t) - target);
      if (gap > prevGap) monoDecay = false;
      if (hetGap > prevHetGap) monoHet = false;
      prevGap = gap; prevHetGap = hetGap;
    }
    const infGap = Math.abs(heterozygosity(p, 1e6, t) - target);
    detail.infHetGap = infGap;
    ok('(4)★ neg-control N→∞: decayFactor→1 monotonically & H→2pq (drift is finite-N only; never fixes)',
       monoDecay && monoHet && infGap < 1e-4,
       'at N=1e6: 1−decay=' + (1 - decayFactor(1e6)).toExponential(2) + ' · |H−2pq|=' + infGap.toExponential(2));
  }

  // (5)★ ENSEMBLE WITNESS (sampling, NEVER a proof) — over many seeded jars the GOLD-
  //   fixation fraction lands within ±KSIG·√(p₀q₀/jars) of p₀ (claim 1, watched not
  //   proven), and every finite jar reaches monochrome.
  {
    let allIn = true, worst = '', maxSig = 0;
    for (const p of [0.3, 0.5, 0.625]) {
      const e = runEnsemble({ jars, N: 12, p, seed: 1234567, maxGen: 8000 });
      const dev = Math.abs(e.fixedGoldFraction - e.p0), sig = e.band > 0 ? dev / e.band : 0;
      if (sig > maxSig) maxSig = sig;
      if (dev > KSIG * e.band) { allIn = false; worst = 'p=' + p + ': ' + sig.toFixed(2) + 'σ'; }
      if (!e.allFixed) { allIn = false; worst = 'p=' + p + ': not all jars fixed'; }
    }
    detail.witnessMaxSig = maxSig;
    ok('(5)★ ensemble witness (sampling): gold-fixation fraction → p₀ within ±' + KSIG + '·√(p₀q₀/' + jars + ')',
       allIn, allIn ? 'worst ' + maxSig.toFixed(2) + 'σ over p; all jars reached monochrome' : worst);
  }

  // (6) DETERMINISM — identical {N,p,seed} ⇒ byte-identical jar trail.
  {
    const a = runJar(makeJar({ N: 10, p: 0.4, seed: 24680 }), 8000);
    const b = runJar(makeJar({ N: 10, p: 0.4, seed: 24680 }), 8000);
    const same = a.gens === b.gens && a.fixedGold === b.fixedGold && JSON.stringify(a.trail) === JSON.stringify(b.trail);
    detail.deterministic = same;
    ok('(6) determinism: identical {N,p,seed} ⇒ byte-identical jar trail',
       same, same ? 'two ' + a.gens + '-gen runs byte-identical' : 'DIFFER');
  }

  // (7) ABSORBING / CONSERVATION — every finite jar reaches monochrome in bounded gens,
  //   and M = 2N beads are conserved every generation.
  {
    let allFixed = true, conserved = true, worst = '';
    for (const N of [4, 8, 12, 16]) {
      const M = 2 * N;
      for (const seed of [1, 2, 3, 4, 5]) {
        let j = makeJar({ N, p: 0.5, seed: seed * 101 }), g = 0;
        while (!j.fixed && g < 100000) {
          j = stepJar(j); g++;
          if (j.beads.length !== M) conserved = false;
          let c = 0; for (let i = 0; i < M; i++) c += j.beads[i];
          if (c !== j.k) conserved = false;
        }
        if (!j.fixed) { allFixed = false; worst = 'N=' + N + ' seed=' + seed + ' unfixed'; }
      }
    }
    ok('(7) absorbing & conservation: every finite jar reaches monochrome; M=2N beads conserved each gen',
       allFixed && conserved, allFixed && conserved ? 'all jars fixed in bounded gens; bead count conserved each gen' : worst);
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}
// ===== END DRIFT-JAR CORE =====

export {
  P, makeRng, copies, decayFactor, heterozygosity, fixationProb,
  logChoose, transitionRow, buildMatrix, gaussSolve, absorptionProbs, evolveDistribution,
  makeJar, stepJar, runJar, runEnsemble, runSelfTest,
};
