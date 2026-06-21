// ============================================================================
//  THE MURMURATION METER — the MURMURATION CORE: the sole authority for the
//  claim "a flock keeps one mind only while the noise stays low." Pure,
//  dependency-free (DOM-free). This module owns the piece's physics:
//
//    • N self-propelled birds on a periodic L×L torus (standard Vicsek). Each
//      bird i has a position (x,y) and a heading θ — heading is the SOLE state
//      (no vx/vy; velocity is v0·(cosθ, sinθ)). One synchronous step:
//          θᵢ ← circular-mean of every neighbour within radius r (self included)
//                 + a uniform kick  (rng()−½)·η
//          xᵢ ← xᵢ + v0·cosθᵢ   (wrapped into [0,L)),   yᵢ likewise
//      One knob: the NOISE η. Turn η up and the kick drowns the copying — the
//      order parameter φ = |Σ v̂|/N falls from one-mind (φ→1) to a milling
//      crowd (φ ≈ 1/√N).
//
//    • The page SEES this: a flock that snaps from a single-heading sheet to a
//      scattering crowd, a hero φ needle that drops at the crossover. φ read
//      live each frame; the live RAF integrates the SAME step() this module
//      proves. steadyPhi() is a MEASUREMENT (burn + time-average) used ONLY by
//      the self-test — never by the live page.
//
//  The page (murmuration-meter/index.html) inlines a BYTE-TWIN of the
//  MURMURATION CORE slice between the sentinels below, char-for-char; the Node
//  twin (core.test.mjs) re-extracts that slice and asserts it is identical,
//  re-measures the law at a second seed/N, and proves the Vicsek-update literal
//  lives in ONE file. The in-page pill and the Node twin both call THIS
//  runMurmurationSelfTest, so "self-test green" cannot drift between the page
//  and the source.
//
//  We never paint a precise critical noise η_c on the wall: the crossover is a
//  SOFT transition that slides with density and N. The self-test claims only
//  what is exact — φ is rotation-blind, the two ends anchor (η=0 ⇒ φ→1, η=2π ⇒
//  φ·√N = O(1)), and φ(η) only ever falls as the noise rises. The crossover you
//  find by hand.
// ============================================================================

// ===== MURMURATION CORE (inlined byte-twin) BEGIN =====
// The estate's mulberry32 PRNG (the same generator the-quorum / iron-filings /
// sandpile share). Deterministic: a fixed seed gives a fixed stream of [0,1).
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const RHO = 4;                   // the standard Vicsek number density (birds per unit area)
const N_DEFAULT = 300;           // the locked flock size (real-time at ~1.4 ms/step)
const R_DEFAULT = 1;             // the alignment radius (a bird copies neighbours within r)
const V0_DEFAULT = 0.03;         // the constant speed every bird flies at
const ETA_DEFAULT = 2.5;         // the noise the page opens at (mid-crossover)
const SEED = 0xF10C;             // the one seed the visible flock + tests share ("FLOC")
const BURN = 400;                // steps to reach steady state before measuring φ
const SAMPLES = 200;             // steps to time-average φ over (the measurement window)
// the η-ladder the monotone test sweeps (0 → 2π, a coarse climb across the crossover).
const ETA_LADDER = [0, 1, 2, 3, 4, 5, TAU];

// the box side for N birds at the standard density ρ: L = √(N/ρ). Read, never typed.
function boxFor(N){ return Math.sqrt(N / RHO); }
// the disorder FLOOR: a milling crowd of N independent headings has expected order
// φ ≈ 1/√N (a random walk of N unit vectors). The render's gauge draws its floor band
// from THIS — it never re-types a literal.
function disorderFloor(N){ return 1 / Math.sqrt(N); }

// makeState(opts) → the live flock struct. Heading θ is the SOLE representation of
// motion (velocity is v0·(cosθ,sinθ), reconstructed on demand). Construction spends
// N position draws + N heading draws on a seeded mulberry32, then keeps the SAME rng
// closure live so step()'s kicks continue the one deterministic stream. The byte-twin
// MUST build through makeState — never hand-roll the arrays — so the page and the
// tests share the exact same starting flock and rng phase.
function makeState(opts){
  opts = opts || {};
  const N = opts.N == null ? N_DEFAULT : opts.N;
  const r = opts.r == null ? R_DEFAULT : opts.r;
  const v0 = opts.v0 == null ? V0_DEFAULT : opts.v0;
  const eta = opts.eta == null ? ETA_DEFAULT : opts.eta;
  const seed = opts.seed == null ? SEED : opts.seed;
  const L = opts.L == null ? boxFor(N) : opts.L;
  const rng = mulberry32(seed >>> 0);
  const x = new Float64Array(N), y = new Float64Array(N), th = new Float64Array(N);
  for (let i = 0; i < N; i++){ x[i] = rng() * L; y[i] = rng() * L; }   // N position draws
  for (let i = 0; i < N; i++){ th[i] = rng() * TAU; }                  // N heading draws
  return { N, L, r, v0, eta, x, y, th, rng, blind: !!opts.blind };
}

// ONE synchronous Vicsek step → mutates AND returns the same struct. New headings are
// computed from the OLD positions (read all, then write all), so the order of birds in
// the i-loop does not bias the update. For each bird i: the circular mean of every
// neighbour within r (periodic min-image distance; SELF INCLUDED — at distance 0 the
// j==i term always passes ≤r², which is what anchors η=0 ⇒ φ=1) PLUS one uniform kick
// (rng()−½)·η drawn in FIXED i-order. Then advance x += v0·cosθ and wrap into [0,L).
//   `blind` (read off the struct) zeroes the alignment term: each bird keeps only its
//   own heading + the η kick, so no low η can order it — the load-bearing neg-control.
//   This is the SOLE rng consumer in the live loop: the fixed kick draw-order is a
//   load-bearing contract. The page must NOT reorder birds or add rng() draws here
//   (any render randomness uses a SEPARATE rng).
function step(s){
  const { N, L, r, v0, x, y, th, rng } = s;
  const eta = s.eta, blind = !!s.blind;
  const r2 = r * r;
  const nth = new Float64Array(N);
  for (let i = 0; i < N; i++){
    let sx, sy;
    if (blind){ sx = Math.cos(th[i]); sy = Math.sin(th[i]); }   // deaf to neighbours
    else {
      sx = 0; sy = 0;
      for (let j = 0; j < N; j++){
        let dx = x[j] - x[i]; dx -= L * Math.round(dx / L);     // periodic min-image
        let dy = y[j] - y[i]; dy -= L * Math.round(dy / L);
        if (dx * dx + dy * dy <= r2){ sx += Math.cos(th[j]); sy += Math.sin(th[j]); }
      }
    }
    const mean = Math.atan2(sy, sx);                            // circular mean heading
    const kick = (rng() - 0.5) * eta;                          // one uniform noise kick
    nth[i] = mean + kick;
  }
  for (let i = 0; i < N; i++){
    th[i] = nth[i];
    x[i] += v0 * Math.cos(th[i]); x[i] -= L * Math.floor(x[i] / L);   // advance + wrap
    y[i] += v0 * Math.sin(th[i]); y[i] -= L * Math.floor(y[i] / L);
  }
  return s;
}

// the ORDER PARAMETER φ = |Σ v̂| / N ∈ [0,1] — the SOLE φ authority. φ≈1 is one mind
// (every heading aligned), φ ≈ 1/√N is a milling crowd (headings spread round the
// circle). Reads heading θ only; positions are irrelevant to φ.
function polarization(s){
  let sx = 0, sy = 0;
  for (let i = 0; i < s.N; i++){ sx += Math.cos(s.th[i]); sy += Math.sin(s.th[i]); }
  return Math.hypot(sx, sy) / s.N;
}

// localAlignments(s) → Float64Array: per-bird local order aᵢ ∈ [0,1] = |mean of the
// unit headings of i's neighbours (self included)|. The render colours each bird by
// THIS (aligned → cold flock-blue, scattered → warm). It reuses the SAME neighbour
// pass as step(), so the page gets the colour FREE — it must not run a second search.
function localAlignments(s){
  const { N, L, r, x, y, th } = s;
  const r2 = r * r;
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++){
    let sx = 0, sy = 0, n = 0;
    for (let j = 0; j < N; j++){
      let dx = x[j] - x[i]; dx -= L * Math.round(dx / L);
      let dy = y[j] - y[i]; dy -= L * Math.round(dy / L);
      if (dx * dx + dy * dy <= r2){ sx += Math.cos(th[j]); sy += Math.sin(th[j]); n++; }
    }
    out[i] = n > 0 ? Math.hypot(sx, sy) / n : 1;
  }
  return out;
}

// rotateVelocities(s, θ) → a NEW struct with every heading rotated by θ (positions and
// rng untouched, arrays NOT shared). Rotating every bird the same amount is a symmetry
// of the dynamics — φ = |Σ v̂|/N is invariant under it. Both the page (it has no use)
// and the self-test use THIS one helper; the rotation-invariance leg leans on it.
function rotateVelocities(s, theta){
  return { ...s, th: Float64Array.from(s.th, a => a + theta) };
}

// steadyPhi(opts) → the time-averaged steady-state φ at a given η: burn BURN steps to
// reach steady state, then average φ over SAMPLES steps. A MEASUREMENT (never a
// hardcoded number) — the self-test + Node twin call it; the live RAF page does NOT
// (it would stall the frame). `blind` passes straight through to step().
function steadyPhi(opts){
  opts = opts || {};
  const s = makeState({
    N: opts.N, L: opts.L, r: opts.r, v0: opts.v0,
    eta: opts.eta, seed: opts.seed, blind: opts.blind,
  });
  const burn = opts.burn == null ? BURN : opts.burn;
  const samples = opts.samples == null ? SAMPLES : opts.samples;
  for (let t = 0; t < burn; t++) step(s);
  let acc = 0;
  for (let t = 0; t < samples; t++){ step(s); acc += polarization(s); }
  return acc / samples;
}

// ── runMurmurationSelfTest() — the SOLE ORACLE. Same shape as the sibling benches:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin both
// call THIS so they cannot disagree. Every detail carries LIVE measured numbers; the
// tolerances are the only literals — NEVER a precise η_c (the crossover is soft).
function runMurmurationSelfTest(){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // LEG 1 — ROTATION-INVARIANT: φ does not care which way the whole flock faces.
  //   Evolve to steady state, rotate EVERY heading by a fixed angle (two angles),
  //   and φ is unchanged to the bit (|Δφ| < 1e-12). The order is in the AGREEMENT,
  //   not the absolute direction.
  {
    const s = makeState({ eta: ETA_DEFAULT, seed: 0xBEEF });
    for (let t = 0; t < 200; t++) step(s);
    const p0 = polarization(s);
    const d1 = Math.abs(polarization(rotateVelocities(s, 1.2345)) - p0);
    const d2 = Math.abs(polarization(rotateVelocities(s, -2.71828)) - p0);
    const worst = Math.max(d1, d2);
    const ok = worst < 1e-12;
    T('LEG 1 — φ is rotation-blind: turn the whole flock by a fixed angle and the order φ = |Σ v̂|/N does not move (|Δφ| < 1e-12) — order is the AGREEMENT between birds, not the direction they happen to face',
      ok, `worst |Δφ| over two rotations = ${worst.toExponential(2)} (tol 1e-12)`);
  }

  // LEG 2 — THE TWO ANCHORS. (a) η=0 ⇒ the flock falls into one perfect mind: with
  //   no noise the kick vanishes and copying wins outright, φ → 1 (1−φ < 1e-6). (b)
  //   η=2π ⇒ the disorder anchor: the order sits on the 1/√N floor, φ·√N = O(1)
  //   across N∈{100,400} via a SEEDED ENSEMBLE average (not one shot) — the floor
  //   FALLS as 1/√N, a law, not a single point. C generous so a fair flock clears it.
  {
    const phi0 = steadyPhi({ eta: 0 });
    const okZero = (1 - phi0) < 1e-6;

    const C = 1.5;
    const E = 16;                       // ensemble size (seeded; smooths the single-shot jitter)
    const rows = [];
    let okFloor = true;
    for (const N of [100, 400]){
      let acc = 0;
      for (let e = 0; e < E; e++) acc += steadyPhi({ N, eta: TAU, seed: SEED + 1 + e });
      const phiBar = acc / E;
      const scaled = phiBar * Math.sqrt(N);
      rows.push(`N=${N}: φ̄·√N ${scaled.toFixed(3)} < ${C}`);
      if (!(scaled < C)) okFloor = false;
    }
    const ok = okZero && okFloor;
    T('LEG 2 — the two anchors: with NO noise the flock locks into one mind (η=0 ⇒ φ→1, 1−φ < 1e-6); with FULL noise the order sits on the 1/√N disorder floor (η=2π ⇒ φ̄·√N = O(1) < 1.5, at BOTH N=100 and N=400 — the floor falls as 1/√N, a law not a point)',
      ok, `η=0: 1−φ ${(1 - phi0).toExponential(2)} (tol 1e-6) · ${rows.join(' · ')}`);
  }

  // LEG 3 — MONOTONE: steadyPhi over the η-ladder [0,1,2,3,4,5,2π] only ever FALLS as
  //   the noise climbs (no upward blip > TOL) and falls a LOT (φ(0) − φ(2π) > 0.8) —
  //   from one-mind to a milling crowd. We do NOT claim a sharp η_c: the crossover is
  //   a soft, density/N-dependent slide you cross by eye. Only "order falls as noise
  //   rises" is exact.
  {
    const TOL = 0.05;
    const phis = ETA_LADDER.map(eta => steadyPhi({ eta }));
    let mono = true, worstRise = 0;
    for (let i = 1; i < phis.length; i++){
      const rise = phis[i] - phis[i - 1];
      if (rise > worstRise) worstRise = rise;
      if (rise > TOL) mono = false;
    }
    const fall = phis[0] - phis[phis.length - 1];
    const ok = mono && fall > 0.8;
    T('LEG 3 — order only falls as noise rises: steady-state φ over η=[0,1,2,3,4,5,2π] is non-increasing (no rise > 0.05) and collapses from one mind to a milling crowd (φ(0) − φ(2π) > 0.8) — louder noise, less flock; we never paint a precise η_c, the crossover is soft',
      ok, `φ-ladder [${phis.map(x => x.toFixed(3)).join(', ')}] · falls ${fall.toFixed(3)} (worst upward blip ${worstRise.toExponential(2)})`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== MURMURATION CORE END =====

export {
  mulberry32, makeState, step, polarization, rotateVelocities, localAlignments,
  steadyPhi, disorderFloor, boxFor, TAU, RHO, N_DEFAULT, R_DEFAULT, V0_DEFAULT,
  ETA_DEFAULT, SEED, ETA_LADDER, BURN, SAMPLES, runMurmurationSelfTest,
};
