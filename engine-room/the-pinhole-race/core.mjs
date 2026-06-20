// ============================================================================
//  The Engine Room · The Pinhole Race — CORE
//  Pure, dependency-free. The IDENTICAL code is inlined into index.html (between
//  the PINHOLE-RACE sentinels); this file is the Node-testable twin (the
//  falsifiability harness runs against it). NO cross-wing import: the Cavern's
//  Maxwell–Boltzmann gas is a KIN link in prose, not a code dependency — so the
//  page-core === module-core byte-twin IS the whole parity proof here.
//
//  THE ONE CLAIM, made falsifiable (Graham's law of effusion, Graham 1846):
//  two gases held at ONE locked temperature T escape through a single small
//  pinhole at a rate ratio of exactly
//
//        r_light / r_heavy  =  √( m_heavy / m_light )
//
//  NOT because the light gas has more energy — at one T both species share the
//  SAME mean kinetic energy ⟨KE⟩ = 3/2·k_B·T (equipartition, mass-independent) —
//  but because the lighter molecules, carrying that same energy in a smaller
//  mass, simply MOVE FASTER:  v̄ = √(8·k_B·T / (π·m)).  Effusion through a small
//  hole is a flux: rate ∝ ¼·n·v̄·A.  At equal n, T, A the n,A,¼ cancel and the
//  ratio collapses to v̄_l / v̄_h = √(m_h/m_l).  The light gas ALWAYS wins the door.
//
//  THE NEGATIVE CONTROL (the lie, given a real chance to look true): force the
//  two species to move at the SAME speed (the "same speed, not same energy"
//  knife-switch). Then the ratio collapses to 1 — the gauges climb in lockstep —
//  but ⟨KE⟩ is no longer equal: KE_l = ½·m_l·v² so KE_l/KE_h = m_l/m_h ≠ 1.
//  Equipartition is BROKEN, and broken by EXACTLY the mass ratio. The test pins
//  that magnitude (not just "not 1"); the UI shows it as the RED toggle that
//  reddens the warmth lamp. You cannot equalize speed without un-equalizing energy.
//
//  HONEST FRAMING (à la the Demon's efficiencyFactor / the Brownian rate model —
//  "the core OWNS this"): simulateEscapes() is a REDUCED rate model — a flux-
//  weighted Bernoulli thinning of N attempts (¼·n·v̄·A is standard kinetic
//  theory; the per-attempt acceptance ∝ v̄ stands in for the flux). It is NOT a
//  from-first-principles angular cos-θ Knudsen integral over the hole. It is
//  honest for the RATIO, and we MEASURE convergence with the COMPUTED √N counting
//  error — we never call a finite sample a "proof". The EXACT claim is the closed
//  form (falsifier 1); the sample is only asked to land in its stated band.
//
//  SCALE NOTE: masses m are in reduced atomic units (a free dial 1..32); A and n
//  are reduced and LOCKED. k_B is carried in SI for the ⟨KE⟩ display, but every
//  ratio is dimensionless and the scale cancels — that is the whole point.
// ============================================================================

// LOCKED, SHARED constants. T and A never change across the mass sweep — that is
// falsifier 6 (the ratio depends ONLY on √(m_h/m_l), never on T or A).
export const K_B = 1.380649e-23;   // J/K — Boltzmann's constant (per molecule, display)
export const T_LOCKED = 300;       // K — the single locked temperature both gases share
export const A_PINHOLE = 1;        // reduced pinhole area, LOCKED & shared by both species

// KSIG — the SINGLE source of truth for the √N sampling band (shared by compute(),
// the test, and the page's tolerance ribbon). demon/brownian precedent.
export const KSIG = 3;

// ── the named formulas (the DoD's contract) ─────────────────────────────────
//  meanSpeed: the Maxwell–Boltzmann mean speed v̄ = √(8·k_B·T / (π·m)).
export function meanSpeed(T, m) { return Math.sqrt(8 * K_B * T / (Math.PI * m)); }
//  meanKE: the mean kinetic energy per molecule ⟨KE⟩ = 3/2·k_B·T — MASS-INDEPENDENT.
export function meanKE(T) { return 1.5 * K_B * T; }
//  effusionRate: the kinetic-theory effusion flux through area A, rate ∝ ¼·n·v̄·A.
export function effusionRate(n, T, m, A) { return 0.25 * n * meanSpeed(T, m) * A; }

//  rateRatio: r_light/r_heavy DERIVED from effusionRate (NOT a hardcoded √). The
//  √(m_h/m_l) FALLS OUT — falsifier 1 pins it to the closed form to <1e-9.
export function rateRatio(m_l, m_h) {
  return effusionRate(1, T_LOCKED, m_l, A_PINHOLE) /
         effusionRate(1, T_LOCKED, m_h, A_PINHOLE);
}

// ── the seedable xorshift32 PRNG — BYTE-IDENTICAL to demon/brownian's generator.
//  s = (0x2545F491 ^ (seed>>>0)) >>> 0; then xorshift; returns [0,1).
export function makeRng(seed = 1) {
  let s = (0x2545F491 ^ (seed >>> 0)) >>> 0;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// ============================================================================
//  THE REDUCED RATE MODEL — flux-weighted Bernoulli thinning (NOT a cos-θ Knudsen
//  integral). N escape ATTEMPTS, each accepted in proportion to that species'
//  mean speed (acceptance ∝ v̄ stands in for the ¼·n·v̄·A flux). The faster
//  (lighter) gas wins more attempts, so its count climbs faster. The ratio of the
//  two accepted counts converges to v̄_l/v̄_h = √(m_h/m_l) (the predicted ratio),
//  and the COMPUTED √N counting error on that ratio is band = ratio·√(1/cl+1/ch).
//
//  Under sameSpeed (the cheat), BOTH species are given the HEAVY gas's speed, so
//  acceptance equalizes and the count ratio → 1 — the lie made measurable.
//
//  Determinism: identical args ⇒ byte-identical cl, ch, ratio (seeded rng).
// ============================================================================
export function simulateEscapes({ m_l, m_h, N = 200000, seed = 1, sameSpeed = false } = {}) {
  const vl = sameSpeed ? meanSpeed(T_LOCKED, m_h) : meanSpeed(T_LOCKED, m_l);
  const vh = meanSpeed(T_LOCKED, m_h);
  const vmax = Math.max(vl, vh);
  const pl = vl / vmax, ph = vh / vmax;       // per-attempt acceptance ∝ v̄
  const rng = makeRng(seed);
  let cl = 0, ch = 0;
  for (let i = 0; i < N; i++) {
    if (rng() < pl) cl++;                      // a light-gas attempt that escaped
    if (rng() < ph) ch++;                      // a heavy-gas attempt that escaped
  }
  const ratio = ch > 0 ? cl / ch : Infinity;
  const relErr = (cl > 0 && ch > 0) ? Math.sqrt(1 / cl + 1 / ch) : Infinity; // √N counting error
  const band = ratio * relErr;
  return { cl, ch, ratio, band, N, predicted: sameSpeed ? 1 : rateRatio(m_l, m_h) };
}

// ============================================================================
//  THE ONE LEDGER — compute(state). Every facet reads THIS one object: the two
//  fill-gauges, the gold prediction ticks, the tolerance ribbons, the speed-glow,
//  the warmth lamp, the ratio dial, and the live-numbers block. They cannot drift
//  because there is nothing to drift between (demon/brownian precedent).
//
//  state:  m_l, m_h (reduced masses), sameSpeed (the RED neg-control toggle).
// ============================================================================
export function compute({ m_l = 2, m_h = 32, sameSpeed = false } = {}) {
  const T = T_LOCKED, A = A_PINHOLE;
  const v_h = meanSpeed(T, m_h);
  // under the cheat the light gas is FORCED to the heavy gas's speed.
  const v_l = sameSpeed ? v_h : meanSpeed(T, m_l);

  // ⟨KE⟩: at one HONEST T both species share 3/2·k_B·T (mass-independent) — the
  // warmth lamp is gold. Under the cheat BOTH gases are forced to the SAME speed
  // v_h, so each KE is read on that one speed basis (½·m·v_h²): KE_l = ½·m_l·v_h²,
  // KE_h = ½·m_h·v_h², and KE_l/KE_h = m_l/m_h ≠ 1. Equal speed CANNOT mean equal
  // energy — equipartition is broken by EXACTLY the mass ratio (falsifier 5).
  const ke_h = sameSpeed ? 0.5 * m_h * v_h * v_h : meanKE(T);
  const ke_l = sameSpeed ? 0.5 * m_l * v_l * v_l : meanKE(T);

  const predicted = sameSpeed ? 1 : rateRatio(m_l, m_h);   // the gold √(m_h/m_l) tick
  // equipartition: ⟨KE⟩ equal across species. RELATIVE tolerance — the energies are
  // ~1e-21 J, so an absolute |Δ|<1e-9 would be true for everything (meaningless at
  // SI scale); we compare the RATIO to 1 (the same <1e-9 the falsifiers use).
  const equipartition = Math.abs(ke_l / ke_h - 1) < 1e-9;  // the warmth-lamp state

  return { m_l, m_h, T, A, v_l, v_h, ke_l, ke_h, predicted, equipartition, sameSpeed };
}

// ============================================================================
//  THE SELF-TEST — the named, load-bearing assertions (★ = falsifier). Shared
//  verbatim between the Node twin and the in-page pill. KSIG is identical
//  everywhere. Returns the same {checks, passed, total} shape the wing uses.
//
//  In-page defaults: a modest N for the sampling fit (tens of ms). The Node twin
//  cranks N so the band bites harder. Thresholds (KSIG) are identical — only the
//  band shrinks with more samples.
// ============================================================================
export function runCoreTests(opts = {}) {
  const N = opts.N || 200000;
  const checks = [];
  const add = (name, ok, info, star) => checks.push({ name, ok: !!ok, info: info || '', star: !!star });

  const TOL_EXACT = 1e-9;
  // the preset famous pairs + a swept mass dial (the sweep both tests reuse).
  const PRESETS = [[2, 32], [235, 238], [4, 29]];        // H₂:O₂ · U-235:U-238 · He:air
  const SWEEP = [];
  for (let ml = 1; ml <= 32; ml += 3) for (let mh = ml; mh <= 32; mh += 5) SWEEP.push([ml, mh]);

  // (1)★ EXACT — at locked equal T, A the effusionRate-derived ratio === rateRatio
  //      === √(m_h/m_l) to <1e-9, over the mass dial AND the preset pairs. The
  //      closed form is DERIVED from v̄, never hardcoded.
  {
    let worst = 0, where = '';
    for (const [m_l, m_h] of [...SWEEP, ...PRESETS]) {
      const derived = effusionRate(1, T_LOCKED, m_l, A_PINHOLE) / effusionRate(1, T_LOCKED, m_h, A_PINHOLE);
      const viaRatio = rateRatio(m_l, m_h);
      const closed = Math.sqrt(m_h / m_l);
      const rel = Math.max(Math.abs(derived - viaRatio) / closed, Math.abs(viaRatio - closed) / closed);
      if (rel > worst) { worst = rel; where = `m_l=${m_l} m_h=${m_h}`; }
    }
    add('(1)★ EXACT: effusionRate-ratio === rateRatio === √(m_h/m_l) to <1e-9 (derived, not hardcoded)',
        worst < TOL_EXACT, `worst rel-err ${worst.toExponential(2)} @ ${where} (over ${SWEEP.length} dial + ${PRESETS.length} presets)`, true);
  }

  // (2)★ FIT (honest sampling — NEVER a proof): the seeded escape-count ratio
  //      converges to the predicted closed form within ±KSIG·band, where band is
  //      the COMPUTED √N counting error band = ratio·√(1/cl+1/ch). N and the band
  //      are STATED. Swept over masses AND seeds.
  {
    let allIn = true, worst = '', maxDevSig = 0;
    for (const [m_l, m_h] of [[2, 32], [4, 29], [1, 16]]) {
      for (const seed of [1, 7, 19]) {
        const r = simulateEscapes({ m_l, m_h, N, seed });
        const dev = Math.abs(r.ratio - r.predicted);
        const sig = dev / r.band;                 // deviation in units of σ (the band)
        if (sig > maxDevSig) maxDevSig = sig;
        if (dev > KSIG * r.band) { allIn = false; worst = `m ${m_l}:${m_h} seed ${seed}: |Δ|=${dev.toExponential(2)} > ${KSIG}·band=${(KSIG * r.band).toExponential(2)}`; }
      }
    }
    add(`(2)★ FIT (sampling, never a proof): seeded ratio → predicted within ±${KSIG}·band (band=ratio·√(1/cl+1/ch))`,
        allIn, allIn ? `N=${N}: all seeds inside the band; worst deviation ${maxDevSig.toFixed(2)}σ (KSIG=${KSIG})` : worst, true);
  }

  // (3)★ EQUIPARTITION — mean KE per species is EQUAL to <1e-9 (= 3/2·k_B·T,
  //      mass-independent) over the whole sweep. The honest-T home.
  {
    let allEqual = true, worst = '';
    for (const [m_l, m_h] of [...SWEEP, ...PRESETS]) {
      const c = compute({ m_l, m_h });
      // relative equality (energies ~1e-21 J): KE_l/KE_h within 1e-9 of 1, AND
      // both equal to the mass-independent 3/2·k_B·T.
      if (Math.abs(c.ke_l / c.ke_h - 1) >= 1e-9 || !c.equipartition) { allEqual = false; worst = `m ${m_l}:${m_h}: KE_l=${c.ke_l.toExponential(4)} KE_h=${c.ke_h.toExponential(4)}`; }
      if (Math.abs(c.ke_h / meanKE(T_LOCKED) - 1) >= 1e-12) { allEqual = false; worst = `m ${m_l}:${m_h}: KE_h != 3/2·k_B·T`; }
    }
    add('(3)★ EQUIPARTITION: ⟨KE⟩ equal across species to <1e-9 (= 3/2·k_B·T, mass-independent)',
        allEqual, allEqual ? `all ${SWEEP.length + PRESETS.length} pairs share ⟨KE⟩=${meanKE(T_LOCKED).toExponential(4)} J` : worst, true);
  }

  // (4)★ MONOTONE — heavier m_h ⇒ larger predicted ratio; m_l === m_h ⇒ ratio === 1
  //      EXACTLY. The light gas always wins the door, more so the heavier the rival.
  {
    let mono = true, ones = true, worst = '', prev = -Infinity;
    const m_l = 4;
    for (let m_h = m_l; m_h <= 32; m_h++) {
      const p = compute({ m_l, m_h }).predicted;
      if (m_h === m_l && Math.abs(p - 1) >= 1e-12) { ones = false; worst = `m_l===m_h but ratio=${p}`; }
      if (m_h > m_l && !(p > prev)) { mono = false; worst = `not increasing at m_h=${m_h}: ${p} <= ${prev}`; }
      prev = p;
    }
    add('(4)★ MONOTONE: heavier m_h ⇒ larger predicted; m_l===m_h ⇒ ratio===1 exactly',
        mono && ones, mono && ones ? `ratio strictly increases over m_h∈[4,32]; equal-mass ratio is exactly 1` : worst, true);
  }

  // (5)★ NEG-CONTROL (core form) — compute({sameSpeed:true}) ⇒ predicted===1 AND
  //      equipartition===false AND |ke_l/ke_h − m_l/m_h| < 1e-9. The break has the
  //      EXACT mass-ratio magnitude (pin it, don't just assert "not 1").
  {
    let allBroken = true, worst = '';
    for (const [m_l, m_h] of [[2, 32], [4, 29], [1, 16], [235, 238]]) {
      const c = compute({ m_l, m_h, sameSpeed: true });
      const ratioBroken = Math.abs(c.predicted - 1) < 1e-12;
      const equipBroken = c.equipartition === false;
      const exactMag = Math.abs(c.ke_l / c.ke_h - m_l / m_h) < 1e-9;
      if (!(ratioBroken && equipBroken && exactMag)) { allBroken = false; worst = `m ${m_l}:${m_h}: pred=${c.predicted} equip=${c.equipartition} KEratio=${(c.ke_l / c.ke_h).toFixed(6)} vs m_l/m_h=${(m_l / m_h).toFixed(6)}`; }
    }
    add('(5)★ NEG-CONTROL: sameSpeed ⇒ ratio===1 AND equipartition===false AND |KE_l/KE_h − m_l/m_h|<1e-9 (exact break)',
        allBroken, allBroken ? `the cheat collapses the ratio to 1 but breaks ⟨KE⟩ by EXACTLY the mass ratio` : worst, true);
  }

  // (6) LOCKED-INVARIANT — the ratio depends ONLY on √(m_h/m_l): vary T and A and
  //      the ratio is unchanged to <1e-9 (T and A are locked across the sweep).
  {
    let invariant = true, worst = '';
    const ref = rateRatio(4, 32);
    for (const T of [100, 300, 700, 1500]) {
      for (const A of [0.25, 1, 4, 50]) {
        // rebuild the ratio from effusionRate at an arbitrary (T,A): n,T,A,¼ cancel.
        const r = effusionRate(1, T, 4, A) / effusionRate(1, T, 32, A);
        if (Math.abs(r - ref) >= 1e-9) { invariant = false; worst = `T=${T} A=${A}: ratio=${r} != ${ref}`; }
      }
    }
    add('(6) LOCKED-INVARIANT: ratio depends ONLY on √(m_h/m_l) — vary T, A ⇒ ratio unchanged to <1e-9',
        invariant, invariant ? `ratio = ${ref.toFixed(6)} for m 4:32 across all (T,A) — T,A cancel` : worst);
  }

  const passed = checks.filter(c => c.ok).length;
  return { checks, passed, total: checks.length };
}
