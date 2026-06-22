/* ============================================================================
   ALCHEMY LAB · THE REACTION YOU TIME — core.mjs   (the SOLE kinetics authority)

   A flask of N₀ molecules decays. You hold a brass half-life clock and a marker.
   Each time the population crosses full → ½ → ¼ → ⅛ … you DROP the marker onto a
   ladder, at the time that crossing happened. The SPACING between marker-rungs is
   the whole lesson — and it is a property of the REACTION ORDER, read off geometry.

   FIRST ORDER (a molecule lets go on its own):
        d[A]/dt = −k[A]        ⇒        [A](t) = A₀·e^(−kt)
   The time to fall by half is t½ = ln2 / k.  This has NO A₀ in it. So:
     • every rung is EVENLY spaced (each successive half-life equals the last), and
     • pouring a FULLER flask lands the rungs at the SAME spacing — just one MORE
       rung at the top (you start higher, so you cross one extra power of two).
   The clock does not care how full you started. That is dose-independence, and you
   see it as: same ladder pitch, one extra step.

   SECOND ORDER (a decay needs TWO molecules to MEET):
        d[A]/dt = −k[A]²       ⇒        1/[A] = 1/A₀ + kt        ⇒  [A] = A₀/(1+A₀kt)
   Now t½ = 1/(k·A₀) — it DEPENDS on A₀, and successive half-lives DOUBLE: the time
   to go A₀→A₀/2 is 1/(kA₀); A₀/2→A₀/4 is 2/(kA₀); A₀/4→A₀/8 is 4/(kA₀)… ratio = 2
   exactly. The rungs visibly SPREAD as the flask empties. So order is legible in the
   ladder's geometry alone — even pitch ⇒ first order, doubling pitch ⇒ second.

   The crossing TIMES are the cumulative sums of these spacings; the renderer asks
   core.tickSpacings(order, A0, k, n) and lays rungs at the running total — it never
   computes a crossing itself. Everything the bench paints is read FROM this module.

   ── two honest discrete claims, in two TIERS (this is the load-bearing care):
   The flask shown is a DISCRETE Monte-Carlo of N₀ individual molecules, each thinned
   per tick by a Bernoulli coin (the dressing you watch wink out). A single noisy pour
   does NOT trace the smooth law. So we DON'T assert the ensemble mean against the
   continuous e^(−kt)/(1+A₀kt) — that fails at 6–10σ. Instead:
     TIER 1 (with RNG):  the ENSEMBLE MEAN of R pours converges to the sim's OWN
        mean-field expectation (the deterministic tick recursion of the Bernoulli
        thinning) within KSIG·SE. That is the honest convergence the dressing earns.
     TIER 2 (no RNG):    that mean-field expectation → the continuous law as dt→0
        (its per-step bias HALVES when dt halves). That bridge is what makes the
        discrete flask honest to the smooth curve the clock-ladder is laid from.
   See core.test.mjs for both, with a single-run negative control that FAILS the band.

   index.html INLINES this file byte-identical between the KINETICS-CORE sentinels;
   core.test.mjs runs it in Node. If the page's inline ever drifts from this file,
   the page's re-extraction parity check goes RED.
   ============================================================================ */

// ── labeled constants (the bench reads these; it hardcodes nothing) ──
export const LN2 = Math.LN2;
export const KSIG = 4;            // 1 SE wider than the house 3, for cross-seed robustness (verified)
export const TOL_LAW = 1e-9;      // deterministic-claim tolerance (the curve, not the dice)

// ── the DETERMINISTIC clock laws, order-indexed (the clean continuous shape) ──
// conc: the continuous concentration at time t (first: exponential; second: hyperbola).
export function conc(order, A0, k, t){ return order === 1 ? A0 * Math.exp(-k * t) : A0 / (1 + A0 * k * t); }
// tickTime: the time at which the population has crossed n powers of two (full→½ is n=1).
//   first:  n·ln2/k         (the n-th half-life is n times the constant t½)
//   second: (2ⁿ−1)/(A₀·k)   (cumulative — the spacings double, so the sum is geometric)
export function tickTime(order, n, A0, k){ return order === 1 ? n * LN2 / k : (Math.pow(2, n) - 1) / (A0 * k); }
// tickSpacing: the gap between the (n−1)-th and n-th crossing — the n-th successive half-life.
export function tickSpacing(order, n, A0, k){ return tickTime(order, n, A0, k) - tickTime(order, n - 1, A0, k); }
// halfLife: the FIRST half-life. first: ln2/k (A₀-free); second: 1/(k·A₀) (dose-dependent).
export function halfLife(order, A0, k){ return tickTime(order, 1, A0, k); }
// tickSpacings: the array the ladder draws — the successive half-lives n=1..nTicks.
export function tickSpacings(order, A0, k, nTicks){
  const out = [];
  for(let n = 1; n <= nTicks; n++) out.push(tickSpacing(order, n, A0, k));
  return out;
}
// spacingRatios: consecutive spacing ratios — first order → all 1, second order → all 2.
// This is the geometry you read straight off the ladder, made into a number.
export function spacingRatios(spacings){
  const out = [];
  for(let i = 1; i < spacings.length; i++) out.push(spacings[i] / spacings[i - 1]);
  return out;
}
// rungCount: how many full→½ crossings fit before the population dips under `floor`.
// ⌊log2(A₀/floor)⌋ — pouring a fuller flask adds exactly one rung per doubling of A₀.
export function rungCount(A0, floor){ return Math.floor(Math.log2(A0 / floor)); }

// ── the SHARED PRESET the renderer reads (no re-declared constants in index.html) ──
// dt is small so the discrete flask's per-step bias is small (Tier 2 keeps it honest).
export const PRESET = { k: 0.5, dt: 0.05, V: 400, N0_full: 400, N0_quarter: 100, ticks: 30 };

/* ── THE DISCRETE FLASK (the dressing you watch) ──────────────────────────────
   house xorshift32 (shared stream). Each molecule is thinned per tick by a coin:
   first order, a per-molecule probability p=k·dt (it lets go alone); second order,
   q=k·(alive/V)·dt (the chance it MEETS a partner this tick, scaling with density).
   stepFlask returns the survivor count — the certified number the flask renders. */
export function makeRng(seed = 1){
  let s = (0x2545F491 ^ (seed >>> 0)) >>> 0;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function stepFlask(order, alive, k, dt, rng, V = 1){
  let surv = 0;
  if(order === 1){ const p = k * dt; for(let i = 0; i < alive; i++) if(rng() >= p) surv++; }
  else { const q = Math.min(0.999, k * (alive / V) * dt); for(let i = 0; i < alive; i++) if(rng() >= q) surv++; }
  return surv;
}
// meanFieldExpectation: the SIM'S OWN expectation — the deterministic tick recursion
// of the Bernoulli thinning (NOT the continuous law). This is what the ensemble mean
// MUST track (Tier 1), and what → the continuous law as dt→0 (Tier 2).
//   first:  E[a_{t+1}] = a_t·(1−p),        p = k·dt
//   second: E[a_{t+1}] = a_t·(1−q_t),      q_t = k·(a_t/V)·dt   (the EXPECTED alive at t)
export function meanFieldExpectation(order, N0, k, dt, V, ticks){
  const e = [N0]; let a = N0;
  for(let t = 1; t <= ticks; t++){
    if(order === 1) a = a * (1 - k * dt);
    else { const q = Math.min(0.999, k * (a / V) * dt); a = a * (1 - q); }
    e.push(a);
  }
  return e;
}
// runEnsemble: R seeded flasks (house 7919 stride between seeds); returns per-tick
// {mean, se, mfExpect, lawCont}. se = √(var/runs) is the standard error of the mean —
// the band Tier 1 tests against.
export function runEnsemble({ order, N0, k, dt, V, ticks, runs, baseSeed }){
  const sum = new Float64Array(ticks + 1), sumSq = new Float64Array(ticks + 1);
  for(let r = 0; r < runs; r++){
    const rng = makeRng((baseSeed + r * 7919) >>> 0);
    let alive = N0; sum[0] += alive; sumSq[0] += alive * alive;
    for(let t = 1; t <= ticks; t++){ alive = stepFlask(order, alive, k, dt, rng, V); sum[t] += alive; sumSq[t] += alive * alive; }
  }
  const mf = meanFieldExpectation(order, N0, k, dt, V, ticks);
  const out = [];
  for(let t = 0; t <= ticks; t++){
    const mean = sum[t] / runs, varr = Math.max(0, sumSq[t] / runs - mean * mean);
    // lawCont uses the flask's effective rate (density coupling q=k·a/V, V=N0 ⇒ rate
    // k/N0 for second order): N0·conc(order,1,k,t). First order is scale-free, identical.
    out.push({ t, mean, se: Math.sqrt(varr / runs), mfExpect: mf[t], lawCont: N0 * conc(order, 1, k, dt * t) });
  }
  return out;
}
// singleRunTrajectory: one fixed-seed pour — the negative control. One noisy flask
// lands outside the KSIG·SE band at ≥1 tick; one pour cannot prove the law.
export function singleRunTrajectory({ order, N0, k, dt, V, ticks, seed }){
  const rng = makeRng(seed >>> 0), traj = [N0]; let alive = N0;
  for(let t = 1; t <= ticks; t++){ alive = stepFlask(order, alive, k, dt, rng, V); traj.push(alive); }
  return traj;
}
