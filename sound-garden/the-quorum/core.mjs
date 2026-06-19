// ============================================================================
//  THE QUORUM — the QUORUM CORE: the sole authority for the claim
//  "synchrony is the instant a smear of clicks SNAPS into one pulse." Pure,
//  dependency-free (DOM-free). This module owns the leaf's physics:
//
//    • A ring of N Kuramoto oscillators (phase clocks). Each clock i has its OWN
//      natural frequency ωᵢ (drawn once, then CENTRED to exactly zero mean so a
//      locked cluster does not drift). Phase advances by ω each tick PLUS a
//      coupling pull toward the others, scaled by the ONE knob K:
//          θᵢ ← θᵢ + ( ωᵢ + (K/N)·Σⱼ sin(θⱼ − θᵢ) ) · dt
//      Turn K up and the clocks PULL one another into step; the order parameter
//      r = |(1/N)Σ e^{iθ}| climbs from the incoherent floor (~1/√N) toward 1.
//
//    • The page HEARS this: each clock ticks (a click) when its phase wraps past
//      0; at low K the ticks are a hailstorm, at high K they fire together as one
//      fat heartbeat. The render's needle reads r; the audio's loudness rides r.
//
//  The page (the-quorum/index.html) inlines a BYTE-TWIN of the QUORUM CORE slice
//  between the sentinels below, char-for-char; the Node twin (core.test.mjs)
//  re-extracts that slice and asserts it is identical, re-measures the law at a
//  second seed/N, and proves the integrator literal lives in ONE file. The
//  in-page pill and the Node twin both call THIS runQuorumSelfTest, so
//  "self-test green" cannot drift between the page and the source.
//
//  NOTE: this CORE is self-contained — it has NO pitch-core dependency. The
//  per-dot click PITCHES (semiToFreq) are an audio-only concern and live in the
//  page's audio block, OUTSIDE the CORE sentinels.
// ============================================================================

// ===== QUORUM CORE (inlined byte-twin) BEGIN =====
// The estate's mulberry32 PRNG (the same generator iron-filings / curie-dial /
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
const N_DEFAULT = 16;            // the ring size (16 firefly-clocks)
const SEED = 0xC10C;             // the one seed the visible sweep + tests share ("CLOC")
const DT = 0.05;                 // the integrator step (also the self-test/twin step)
// the K-ladder the comparative-monotone test sweeps (a coarse climb across the knee).
const K_LADDER = [0, 1, 2, 3, 4, 6];

// the natural frequencies ωᵢ: N draws of a standard normal (Box–Muller on a seeded
// mulberry32), then CENTRED to exact zero mean. Centring matters: a locked cluster
// rotates at the MEAN ω, so a zero-mean draw keeps the locked pack from drifting off
// — the synchrony is visible as a standing pulse, not a moving smear.
function makeOmega(N, seed){
  const rng = mulberry32(seed >>> 0);
  const w = new Float64Array(N);
  for (let i = 0; i < N; i++){
    // Box–Muller: two uniforms → one N(0,1) sample (u1 clamped off 0 for log).
    const u1 = Math.max(1e-12, rng()), u2 = rng();
    w[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2);
  }
  let mean = 0; for (let i = 0; i < N; i++) mean += w[i]; mean /= N;
  for (let i = 0; i < N; i++) w[i] -= mean;        // exact zero mean
  return w;
}

// the initial phases θᵢ: N draws in [0, 2π), from a seed decorrelated from ω's
// (XOR with a fixed odd constant) so the starting smear is independent of the
// frequency spread.
function initTheta(N, seed){
  const rng = mulberry32((seed ^ 0x5bd1e995) >>> 0);
  const th = new Float64Array(N);
  for (let i = 0; i < N; i++) th[i] = rng() * TAU;
  return th;
}

// the ORDER PARAMETER r·e^{iψ} = (1/N) Σ e^{iθⱼ}. r ∈ [0,1] measures how clustered
// the phases are: r≈0 is a smear spread round the circle (incoherent), r≈1 is one
// tight pack (locked). ψ is the pack's mean phase (the wedge the render points at).
function orderParam(th){
  const N = th.length; let sx = 0, sy = 0;
  for (let i = 0; i < N; i++){ sx += Math.cos(th[i]); sy += Math.sin(th[i]); }
  sx /= N; sy /= N;
  return { r: Math.hypot(sx, sy), psi: Math.atan2(sy, sx) };
}

// ONE Euler step of the Kuramoto ring → a NEW Float64Array (the live page captures
// the previous array before calling this, to detect phase-wraps for the clicks).
//   out[i] = th[i] + ( w[i] + (deaf ? 0 : (K/N)·Σⱼ sin(θⱼ − θᵢ)) ) · dt
// `deaf` zeroes ONLY the coupling (sin) term — the ring still ADVANCES at its
// natural ω. This is the load-bearing negative control: with the clocks deaf, no
// amount of K can lock them, because the pull they would feel is muted.
function step(th, w, K, dt, deaf){
  const N = th.length;
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++){
    let pull = 0;
    if (!deaf){
      let s = 0;
      for (let j = 0; j < N; j++) s += Math.sin(th[j] - th[i]);
      pull = (K / N) * s;
    }
    out[i] = th[i] + (w[i] + pull) * dt;
  }
  return out;
}

// the incoherent FLOOR: a smear of N independent phases has expected order
// r ≈ 1/√N (a random walk of N unit steps). The render's needle draws its floor
// band from THIS — it never re-types a literal 0.25.
function incoherentFloor(N){ return 1 / Math.sqrt(N); }

// a finite-size estimate of the coupling KNEE (where r begins to climb steeply).
// For a Gaussian ω-spread the mean-field critical coupling is Kc = 2/(π·g(0)),
// g(0)=1/√(2π) for a unit normal → Kc = 2·√(2π)/π ≈ 1.596; at small N the knee
// rounds and sits a touch higher (~2). The knob's Kmax is set to ~3× this so the
// incoherent floor AND the locked pack are one twist apart. The render READS this;
// it does NOT re-type a literal threshold.
function suggestedKc(N, seed){
  // mean-field Kc for a unit-variance Gaussian frequency distribution.
  const kcMeanField = 2 * Math.sqrt(TAU) / Math.PI;     // ≈ 1.5958
  // a gentle finite-size lift (the knee rounds up as N shrinks). Bounded, smooth.
  const finiteLift = 1 + 0.8 / Math.sqrt(N);            // N=16 → ×1.20 → ≈1.92
  return kcMeanField * finiteLift;
}

// steady-state r: integrate the seeded ring forward through a burn-in, then
// time-AVERAGE r over a window of samples. This is a MEASUREMENT (never a
// hardcoded number) — the self-test + Node twin call it; the live RAF page does
// NOT (it would stall the frame). deaf passes straight through to step().
function steadyR(N, K, opts){
  opts = opts || {};
  const seed = opts.seed == null ? SEED : opts.seed;
  const dt = opts.dt == null ? DT : opts.dt;
  const burn = opts.burn == null ? 4000 : opts.burn;
  const samples = opts.samples == null ? 600 : opts.samples;
  const deaf = !!opts.deaf;
  const w = makeOmega(N, seed);
  let th = initTheta(N, seed);
  for (let t = 0; t < burn; t++) th = step(th, w, K, dt, deaf);
  let acc = 0;
  for (let t = 0; t < samples; t++){ th = step(th, w, K, dt, deaf); acc += orderParam(th).r; }
  return acc / samples;
}

// ── runQuorumSelfTest() — the SOLE ORACLE. Same shape as the sibling benches:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS so they cannot disagree. Every detail carries LIVE measured
// numbers; the tolerances are the only literals.
function runQuorumSelfTest(){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const N = N_DEFAULT;
  const TOL = 0.05;

  // LEG 1 — COMPARATIVE-MONOTONE: steadyR over the K-ladder is non-decreasing
  //   (within TOL) and rises a LOT (rHigh − rLow > 0.5). We do NOT claim a sharp
  //   Kc — at N=16 the knee is rounded — only that lock RISES as K climbs.
  {
    const rs = K_LADDER.map(K => steadyR(N, K));
    let mono = true, worstDrop = 0;
    for (let i = 1; i < rs.length; i++){
      const drop = rs[i - 1] - rs[i];
      if (drop > worstDrop) worstDrop = drop;
      if (drop > TOL) mono = false;
    }
    const rise = rs[rs.length - 1] - rs[0];
    const ok = mono && rise > 0.5;
    T('LEG 1 — order rises with coupling: steady-state r over K=[0,1,2,3,4,6] is non-decreasing (within tol) and climbs from a smear to a lock (Δr > 0.5) — twist the knob up and the clocks pull into step',
      ok, ok ? `r-ladder [${rs.map(x => x.toFixed(3)).join(', ')}] · rises ${rise.toFixed(3)} (worst dip ${worstDrop.toExponential(2)})`
             : `mono=${mono} rise=${rise.toFixed(3)} ladder [${rs.map(x => x.toFixed(3)).join(', ')}]`);
  }

  // LEG 2 — O(1/√N) FLOOR: at K=0 the smear's order sits on the incoherent floor,
  //   r < C/√N (C generous = 1.6 → bound 0.40 at N=16). And N=16 vs N=64 both obey
  //   it — exhibiting the 1/√N LAW (the floor halves as N quadruples), not one point.
  {
    const C = 1.6;
    const r16 = steadyR(16, 0);
    const r64 = steadyR(64, 0);
    const b16 = C * incoherentFloor(16), b64 = C * incoherentFloor(64);
    const ok = r16 < b16 && r64 < b64;
    T('LEG 2 — the 1/√N floor: with no coupling the order sits on the incoherent floor r < C/√N (C=1.6), at BOTH N=16 and N=64 — the floor falls as 1/√N (it halves when N quadruples), it is a law, not a single point',
      ok, ok ? `N=16: r ${r16.toFixed(3)} < ${b16.toFixed(3)} · N=64: r ${r64.toFixed(3)} < ${b64.toFixed(3)} (floor ${incoherentFloor(16).toFixed(3)} → ${incoherentFloor(64).toFixed(3)})`
             : `r16 ${r16.toFixed(3)}/${b16.toFixed(3)} · r64 ${r64.toFixed(3)}/${b64.toFixed(3)}`);
  }

  // LEG 3 — NEGATIVE CONTROL (K=0): with zero coupling strength the order NEVER
  //   leaves the floor (r(0) < C/√N) AND r(0) ≪ r(2) — no strength ⇒ no lock. The
  //   climb in LEG 1 is the COUPLING doing work, not drift.
  {
    const C = 1.6;
    const r0 = steadyR(N, 0), r2 = steadyR(N, 2);
    const ok = r0 < C * incoherentFloor(N) && r2 - r0 > 0.4;
    T('LEG 3 — negative control K=0: with the coupling strength set to zero the order stays on the floor and r(K=0) ≪ r(K=2) — no strength, no lock; the synchrony is the knob doing work',
      ok, ok ? `r(0) ${r0.toFixed(3)} < ${(C * incoherentFloor(N)).toFixed(3)} (floor) · r(2) ${r2.toFixed(3)} — gap ${(r2 - r0).toFixed(3)}`
             : `r0 ${r0.toFixed(3)} r2 ${r2.toFixed(3)}`);
  }

  // LEG 4 — NEGATIVE CONTROL (DEAF): with the clocks DEAF (the sin-coupling term
  //   zeroed, but the ring still spinning at ω) even a STRONG K=6 leaves the order
  //   on the floor — steadyR(N,6,deaf) ≈ steadyR(N,0) (|Δ|<TOL) — while the SAME
  //   K=6 with hearing ON locks it (r≈0.99). The teeth: lock is the COUPLING, not
  //   the motion. A piece that locked even when deaf would be faking it.
  {
    const rDeaf = steadyR(N, 6, { deaf: true });
    const rFloor = steadyR(N, 0);
    const rHear = steadyR(N, 6, { deaf: false });
    const deafSame = Math.abs(rDeaf - rFloor) < TOL;
    const teeth = rHear - rDeaf > 0.5;
    const ok = deafSame && teeth;
    T('LEG 4 — negative control DEAF: with the coupling muted (clocks deaf, ring still spinning) even K=6 leaves r on the floor (≈ K=0), but the SAME K=6 with hearing ON locks it (r≈0.99) — the lock is the listening, not the motion',
      ok, ok ? `deaf K=6 r ${rDeaf.toFixed(3)} ≈ floor ${rFloor.toFixed(3)} (Δ ${Math.abs(rDeaf - rFloor).toExponential(2)}) · hearing K=6 r ${rHear.toFixed(3)} — teeth ${(rHear - rDeaf).toFixed(3)}`
             : `deaf ${rDeaf.toFixed(3)} floor ${rFloor.toFixed(3)} hear ${rHear.toFixed(3)}`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== QUORUM CORE END =====

export {
  mulberry32, makeOmega, initTheta, orderParam, step, steadyR,
  incoherentFloor, suggestedKc, K_LADDER, N_DEFAULT, SEED, DT, TAU,
  runQuorumSelfTest,
};
