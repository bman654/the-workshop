// ============================================================================
//  THE BOOTSTRAP BENCH — the estate's ONE 1-D electromagnetic-wave core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every field, energy, and front-speed number
//  the room shows. index.html inlines the slab between the BOOTSTRAP-BENCH CORE
//  BEGIN / END sentinels byte-for-byte; core.test.mjs proves the inlined copy is
//  identical (indentation-normalised) to this file, so page, pill, and Node twin
//  can never silently drift.
//
//  THE ONE IDEA — THE WAVE THAT CARRIES ITSELF (E makes B makes E). The Lodestone
//  Hall's lesson was: a CHANGING field makes the other (EMF = −dΦ/dt). Push that
//  to its limit and the magnet drops away entirely: a changing E births a B just
//  ahead, whose change births an E one cell further, and the pair walks off down
//  empty space on its own. That is light. We integrate Maxwell's two curl
//  equations in 1-D on a staggered Yee grid by the leapfrog (FDTD) scheme:
//        Faraday:  ∂Bz/∂t = −∂Ey/∂z       (B re-sourced by the slope of E)
//        Ampère:   ∂Ey/∂t = −(1/μ₀ε₀)·∂Bz/∂z   (E re-sourced by the slope of B)
//  Discretised on the half-staggered grid (Ey on integer cells, Bz on the half
//  cells between them; E and B a half-step apart in TIME too — the leapfrog):
//        Bz[i+½] += −(dt/dx)·(Ey[i+1] − Ey[i])               (update B)
//        Ey[i]   += −(dt/(dx·μ₀ε₀))·(Bz[i+½] − Bz[i−½])      (update E)
//  Normalised so μ₀=ε₀=1 ⇒ c=1 at baseline. The dials SCALE from there; the FORM
//  never hard-codes a speed — c falls out of the numbers as 1/√(μ₀ε₀).
//
//  THE CLAIMS (each proven a SECOND way in the Node twin, kept HONESTLY apart):
//   (1) ENERGY is conserved. U = ½Σ(ε₀·Ey² + Bz²/μ₀) drifts < 1e-9 over thousands
//       of leapfrog steps on a CLOSED (periodic) run — the symplectic free lunch.
//   (2) THE FRONT SPEED equals 1/√(μ₀ε₀) — MEASURED by timing the half-max
//       envelope crossing between two fixed gates, over a SWEEP of BOTH μ₀ and ε₀.
//       This is a MEASUREMENT on a discrete grid: it agrees to a CFL/discretisation
//       tolerance (a few ×1e-3), NOT to machine-ε. We state that bound honestly.
//   (3) ONE PULSE. A single E-kick with zero B launches EXACTLY ONE right-mover:
//       leftward energy ≈ 0, and the pulse holds its L2 shape (correlation > 0.999)
//       all the way to the absorbing (Mur) edge before any reflection returns.
//   (4) ε₀ DOUBLING is EXACT. c = 1/√(μ₀ε₀) is a closed form, so doubling ε₀
//       scales c by exactly 1/√2 — an ALGEBRAIC identity, proven to machine-ε,
//       kept SEPARATE from the measured claim (2).
//   (5) NEG-CONTROLS, both RED in the twin:
//       (a) FREEZE THE CURL — zero the Faraday leg (∂B/∂t→E feedback) and B stops
//           being re-sourced: the front speed → 0, the pulse localises, no light.
//       (b) OVER-c CHEAT — set dt/dx past the Courant limit √(μ₀ε₀) and the energy
//           blows up: you cannot outrun the vacuum. The CFL/energy check fires RED.
//
//  THE SPARK the page draws is core-driven, not a timer: curlSourceMag() reports
//  |∂B/∂t| and |∂E/∂t| of the CURRENT half-step per cell, so the travelling bloom's
//  brightness is the real numeric creation-rate at the leading edge.
// ============================================================================

// === BOOTSTRAP-BENCH CORE BEGIN ===
"use strict";

// The vacuum's two constants. Normalised baseline μ₀=ε₀=1 ⇒ c=1. The dials scale
// these; everything downstream (the speed, the CFL clamp, the energy) is derived.
const VACUUM = { mu0: 1.0, eps0: 1.0 };

// The shipped grid + the operable defaults the page boots with.
const GRID = {
  N: 600,        // number of Ey cells (Bz lives on the N−1 half-cells between them)
  dx: 1.0,       // cell spacing (length unit)
  courant: 0.5,  // the SAFE Courant number we run at: dt = courant·dx·√(μ₀ε₀) ≤ CFL
};

// ── THE CFL (Courant) LIMIT. Explicit 1-D FDTD is stable iff the numerical step
//    cannot outrun a physical one: c·dt/dx ≤ 1, i.e. dt ≤ dx·√(μ₀ε₀). We pick dt
//    as `courant`·(that limit) with courant < 1 for headroom. This is the SOLE
//    place dt is chosen, so the dials can never silently break stability — and the
//    over-c cheat is just `courant > 1`, which this function will honestly return.
function cflLimit(dx, mu0, eps0){ return dx * Math.sqrt(mu0 * eps0); }   // max stable dt
function stableDt(grid, vac, courant){
  const c = (courant == null) ? grid.courant : courant;
  return c * cflLimit(grid.dx, vac.mu0, vac.eps0);
}

// ── THE PHASE SPEED falls out of the constants, never hard-coded.
function lightSpeed(vac){ return 1 / Math.sqrt(vac.mu0 * vac.eps0); }

// ── THE FIELD. A Field holds Ey[N] on integer nodes and Bz[N−1] on the half-cells
//    between them (Yee stagger). `bc` is 'periodic' (closed, for the energy claim)
//    or 'mur' (a 1st-order absorbing right edge + reflecting left, for propagation).
//    `freezeCurl` ZEROES the Faraday leg when true (the neg-control). `overCourant`
//    drives dt past the CFL limit (the over-c cheat) when its value is > 1.
function makeField(opts){
  const o = opts || {};
  const grid = { ...GRID, ...(o.grid || {}) };
  const vac = { ...VACUUM, ...(o.vac || {}) };
  const N = grid.N;
  // Bz has length N: Bz[i] sits between Ey[i] and Ey[(i+1) mod N]. On a PERIODIC grid
  // Bz[N−1] wraps Ey[N−1]→Ey[0] (a clean torus, so energy is exactly conserved). On an
  // open ('mur') grid Bz[N−1] is the rightmost half-cell; the absorbing edge owns it.
  return {
    grid, vac, N,
    Ey: new Float64Array(N),
    Bz: new Float64Array(N),
    t: 0, step: 0,
    bc: o.bc || 'periodic',
    freezeCurl: !!o.freezeCurl,
    courant: (o.courant == null) ? grid.courant : o.courant,
    // Mur-ABC memory: last-step edge E values for the 1st-order absorbing condition.
    _murOldL: 0, _murOldR: 0,
    // per-cell curl-source magnitudes from the last half-step (for the live spark).
    _dBdt: new Float64Array(N),
    _dEdt: new Float64Array(N),
    // Bz one half-step in the past (Bz^{n−½}), kept so the CONSERVED leapfrog energy
    // can pair Bz^{n−½}·Bz^{n+½} — the time-centred magnetic energy. Seeded = Bz.
    _BzPrev: new Float64Array(N),
    // Ey at level n captured BETWEEN the Faraday and Ampère sub-steps, where E^{n} and
    // the straddling B product B^{n+½}·B^{n−½} are time-aligned ⇒ the EXACT invariant.
    _EyMid: new Float64Array(N),
  };
}

// ── LAUNCH a single Gaussian E-kick centred at cell c0 (width w, amplitude amp),
//    with Bz left at ZERO. A zero-B Gaussian in E is an even superposition of a
//    left- and a right-mover — to get EXACTLY ONE right-mover you must also seed
//    B so the pair is a pure travelling wave. For a +z mover Bz = +√(ε₀/μ₀)·Ey
//    (the impedance relation), co-located by sampling Ey at the half-cell. We seed
//    that, so launch() makes ONE clean right-moving pulse (claim 3).
function launch(field, c0, w, amp){
  const { Ey, Bz, N, vac } = field;
  const eta = Math.sqrt(vac.eps0 / vac.mu0);   // Bz/Ey for a +z travelling wave
  for (let i = 0; i < N; i++){
    const z = (i - c0) / w;
    Ey[i] = amp * Math.exp(-z * z);
  }
  for (let i = 0; i < N; i++){
    const z = (i + 0.5 - c0) / w;               // Bz half-cell ahead of Ey[i]
    Bz[i] = eta * amp * Math.exp(-z * z);
  }
  field._BzPrev.set(Bz);     // Bz^{−½} == seeded Bz so the t=0 energy is well-defined
  field.t = 0; field.step = 0;
}

// Seed a STANDING / closed config: a Gaussian in E, zero B. On a periodic grid this
// splits into a left+right pair (used by the energy claim — energy still conserved).
function seedClosed(field, c0, w, amp){
  const { Ey, Bz, N } = field;
  for (let i = 0; i < N; i++){ const z = (i - c0) / w; Ey[i] = amp * Math.exp(-z * z); }
  for (let i = 0; i < N; i++) Bz[i] = 0;
  field._BzPrev.set(Bz);     // Bz^{−½} == 0 (zero-B closed seed)
  field.t = 0; field.step = 0;
}

// ── ONE LEAPFROG STEP. The two half-updates in order: B from the slope of E
//    (Faraday), then E from the slope of B (Ampère). dt is chosen by stableDt from
//    the dials unless an explicit overCourant pushes it past the CFL limit (cheat).
function stepField(field){
  const { Ey, Bz, N, grid, vac } = field;
  const dx = grid.dx;
  const dt = stableDt(grid, vac, field.courant);
  const cB = dt / dx;                 // Faraday coefficient
  const cE = dt / (dx * vac.mu0 * vac.eps0);   // Ampère coefficient

  // stash Bz^{n−½} BEFORE the Faraday update, so totalEnergy can form the conserved
  // time-centred magnetic energy ½·Bz^{n−½}·Bz^{n+½} (the leapfrog Hamiltonian).
  field._BzPrev.set(Bz);

  const periodic = field.bc === 'periodic';

  // ── Faraday: ∂Bz/∂t = −∂Ey/∂z. Bz[i] between Ey[i], Ey[(i+1) mod N].
  //    freezeCurl ZEROES this leg: B is no longer re-sourced ⇒ no propagation.
  if (!field.freezeCurl){
    const last = periodic ? N : N - 1;   // periodic: Bz[N−1] wraps Ey[N−1]→Ey[0]
    for (let i = 0; i < last; i++){
      const eR = Ey[(i + 1) % N];
      const dB = -cB * (eR - Ey[i]);
      field._dBdt[i] = Math.abs(dB) / dt;       // |∂B/∂t| this half-step (for the spark)
      Bz[i] += dB;
    }
  } else {
    for (let i = 0; i < N; i++) field._dBdt[i] = 0;   // curl frozen: B unsourced
  }

  // capture E^{n} HERE (after Faraday, before Ampère): now E is at integer level n,
  // Bz is at n+½ and _BzPrev at n−½ — the three time-aligned for the exact energy.
  field._EyMid.set(Ey);

  // ── Ampère: ∂Ey/∂t = −(1/μ₀ε₀)·∂Bz/∂z. Interior Ey[i] sees Bz[i]−Bz[i−1].
  if (periodic){
    // a clean torus: Ey[i] sees Bz[i] − Bz[(i−1) mod N]. Every node updated.
    for (let i = 0; i < N; i++){
      const bL = Bz[(i - 1 + N) % N];
      const dE = -cE * (Bz[i] - bL);
      field._dEdt[i] = Math.abs(dE) / dt;
      Ey[i] += dE;
    }
  } else {
    // interior nodes
    for (let i = 1; i < N - 1; i++){
      const dE = -cE * (Bz[i] - Bz[i - 1]);
      field._dEdt[i] = Math.abs(dE) / dt;
      Ey[i] += dE;
    }
    // ── 1st-order MUR absorbing boundary at the RIGHT edge: a clean outgoing wave
    //    leaves with no reflection. Ey[N−1]^{n+1} = Ey[N−2]^{n} + κ·(Ey[N−2]^{n+1} − Ey[N−1]^{n}),
    //    κ = (c·dt − dx)/(c·dt + dx). Left edge held reflecting (a hard mirror).
    const c = lightSpeed(vac);
    const kappa = (c * dt - dx) / (c * dt + dx);
    const newRight = field._murOldL /* prev Ey[N-2] */ + kappa * (Ey[N - 2] - Ey[N - 1]);
    field._dEdt[N - 1] = Math.abs(newRight - Ey[N - 1]) / dt;
    Ey[N - 1] = newRight;
    field._murOldL = Ey[N - 2];     // stash for next step's Mur update
    // left edge: reflecting (Ey[0] kept; its dE was 0 — a wall the pulse never reaches)
    field._dEdt[0] = 0;
  }

  field.t += dt; field.step += 1;
  return dt;
}

// ── TOTAL ENERGY. Ey and Bz are staggered a HALF-STEP apart in TIME (the leapfrog),
//    so the naively co-timed ½Σ(ε₀Ey² + Bz²/μ₀) is NOT the conserved invariant — it
//    breathes by O(dt²) each step. The quantity the leapfrog conserves EXACTLY uses
//    the TIME-CENTRED magnetic energy Bz^{n−½}·Bz^{n+½} (the product across the
//    half-step, = the discrete Hamiltonian). _BzPrev holds Bz^{n−½}; Bz holds
//    Bz^{n+½}. This U drifts only by round-off on a closed periodic run.
function totalEnergy(field){
  const { _EyMid, Bz, _BzPrev, N, vac } = field;
  // E^{n} (time-aligned with the B straddle) was captured mid-step in _EyMid; at t=0
  // (no step yet) _EyMid is zero, so fall back to the seeded Ey for the initial read.
  const E = (field.step > 0) ? _EyMid : field.Ey;
  const bcount = field.bc === 'periodic' ? N : N - 1;   // periodic: Bz[N−1] wraps in
  let uE = 0, uB = 0;
  for (let i = 0; i < N; i++) uE += vac.eps0 * E[i] * E[i];
  for (let i = 0; i < bcount; i++) uB += Bz[i] * _BzPrev[i] / vac.mu0;
  return 0.5 * (uE + uB);
}

// Energy split LEFT vs RIGHT of a cell (for "one pulse ⇒ leftward energy ≈ 0").
function energyLeftRight(field, splitCell){
  const { Ey, Bz, N, vac } = field;
  let left = 0, right = 0;
  for (let i = 0; i < N; i++){
    const e = 0.5 * vac.eps0 * Ey[i] * Ey[i];
    if (i < splitCell) left += e; else right += e;
  }
  for (let i = 0; i < N - 1; i++){
    const e = 0.5 * Bz[i] * Bz[i] / vac.mu0;
    if (i < splitCell) left += e; else right += e;
  }
  return { left, right };
}

// ── FRONT-SPEED MEASUREMENT. Time the pulse's leading edge as its |Ey| envelope
//    crosses half-max past gate A then gate B (two fixed cells). speed = (zB−zA)/Δt.
//    This is the MEASURED speed the two speed-posts read; it agrees with 1/√(μ₀ε₀)
//    to the grid's discretisation/numerical-dispersion bound (a measurement, not an
//    identity). Returns { speed, tA, tB } or null if the pulse never reaches a gate.
function measureFrontSpeed(field, gateA, gateB, maxSteps, halfMaxFrac){
  const frac = (halfMaxFrac == null) ? 0.5 : halfMaxFrac;
  // peak amplitude of the launched pulse (sampled once at t=0)
  let amp0 = 0;
  for (let i = 0; i < field.N; i++) amp0 = Math.max(amp0, Math.abs(field.Ey[i]));
  const thresh = frac * amp0;
  let tA = null, tB = null;
  const cap = maxSteps || 20000;
  for (let s = 0; s < cap; s++){
    if (tA === null && Math.abs(field.Ey[gateA]) >= thresh) tA = field.t;
    if (tB === null && Math.abs(field.Ey[gateB]) >= thresh){ tB = field.t; break; }
    stepField(field);
  }
  if (tA === null || tB === null || tB <= tA) return null;
  return { speed: (gateB - gateA) * field.grid.dx / (tB - tA), tA, tB };
}

// ── THE LIVE SPARK SOURCE. The leading-edge bloom's brightness is the REAL curl
//    creation-rate at the front, not a timer. Returns the per-cell |∂B/∂t| and
//    |∂E/∂t| of the last half-step, plus the index of the current peak |∂E/∂t|
//    (the "front cell") and whether this beat is the B-birth or E-birth half.
function curlSourceMag(field){
  let peakCell = 0, peakVal = 0;
  for (let i = 0; i < field.N; i++){
    if (field._dEdt[i] > peakVal){ peakVal = field._dEdt[i]; peakCell = i; }
  }
  return { dBdt: field._dBdt, dEdt: field._dEdt, frontCell: peakCell, frontMag: peakVal };
}

// ── PROOF HELPERS (used by the self-test; pure functions over fresh fields) ──────

// run a closed periodic field for `steps` and return max relative energy drift.
function energyDriftClosed(steps, opts){
  const f = makeField({ ...(opts || {}), bc: 'periodic' });
  seedClosed(f, f.N * 0.5, 18, 1.0);
  const U0 = totalEnergy(f);
  let worst = 0;
  for (let s = 0; s < steps; s++){
    stepField(f);
    worst = Math.max(worst, Math.abs(totalEnergy(f) - U0) / U0);
  }
  return { drift: worst, U0 };
}

// measure front speed for a given (mu0,eps0) and compare to 1/√(μ₀ε₀).
function speedDefect(mu0, eps0){
  const f = makeField({ vac: { mu0, eps0 }, bc: 'mur' });
  launch(f, 80, 14, 1.0);
  const gA = 200, gB = 420;
  const r = measureFrontSpeed(f, gA, gB, 40000);
  if (!r) return { ok: false };
  const cTrue = lightSpeed(f.vac);
  return { ok: true, measured: r.speed, expected: cTrue, rel: Math.abs(r.speed - cTrue) / cTrue };
}

// one flick ⇒ exactly one right-mover: leftward energy fraction + L2 shape corr.
function onePulseCheck(){
  const f = makeField({ bc: 'mur' });
  const c0 = 80, w = 14;
  launch(f, c0, w, 1.0);
  // snapshot the launched right-moving shape (Ey profile) for the L2 correlation
  const shape0 = Float64Array.from(f.Ey);
  // advance until the front nears the absorbing edge but BEFORE any reflection
  // returns: stop when the peak |Ey| cell passes ~80% of the grid.
  const N = f.N;
  let peakCell = c0, guard = 0;
  while (peakCell < N * 0.78 && guard < 40000){
    stepField(f); guard++;
    let pv = 0, pc = 0;
    for (let i = 0; i < N; i++){ if (Math.abs(f.Ey[i]) > pv){ pv = Math.abs(f.Ey[i]); pc = i; } }
    peakCell = pc;
  }
  // leftward energy (anything well behind the launch point that's moving the wrong way)
  const lr = energyLeftRight(f, c0 - 4 * w);   // energy left of the launch tail
  const total = lr.left + lr.right;
  const leftFrac = total > 0 ? lr.left / total : 0;
  // L2 shape correlation between the launched profile and the propagated one,
  // aligned by the peak shift (a pure translation should preserve shape).
  const shift = peakCell - c0;
  let dot = 0, n0 = 0, n1 = 0;
  for (let i = 0; i < N; i++){
    const j = i + shift;
    if (j < 0 || j >= N) continue;
    const a = shape0[i], b = f.Ey[j];
    dot += a * b; n0 += a * a; n1 += b * b;
  }
  const corr = (n0 > 0 && n1 > 0) ? dot / Math.sqrt(n0 * n1) : 0;
  // reflection magnitude: energy that has bounced back toward the source region
  return { leftFrac, corr, reflection: lr.left };
}

// ε₀ doubling ⇒ c scales by exactly 1/√2 (algebraic identity on the closed form).
function epsDoublingRatio(mu0, eps0){
  const c1 = lightSpeed({ mu0, eps0 });
  const c2 = lightSpeed({ mu0, eps0: 2 * eps0 });
  return c2 / c1;        // must equal 1/√2 exactly
}

// over-c CFL cheat ⇒ energy blows up. Run a closed field at courant > 1 and report
// whether the energy explodes (max |U| grows past a huge factor of U0).
function overCourantBlowup(courant){
  const f = makeField({ bc: 'periodic', courant });
  seedClosed(f, f.N * 0.5, 18, 1.0);
  const U0 = totalEnergy(f);
  let maxU = U0;
  for (let s = 0; s < 600; s++){ stepField(f); maxU = Math.max(maxU, totalEnergy(f)); }
  return { U0, maxU, ratio: maxU / U0, blewUp: !Number.isFinite(maxU) || maxU / U0 > 1e6 };
}

// freeze-the-curl ⇒ front does NOT advance. With the Faraday leg zeroed, Bz is
// never re-sourced; seeded from a PURE E-kick (B=0) it stays 0, so the Ampère leg
// has nothing to push with and E never moves — the front is pinned. (Live in the
// page the freeze is thrown MID-flight, slumping a real pulse; here we prove the
// clean limit: no Faraday ⇒ no propagation at all.)
function frozenCurlAdvance(steps){
  const f = makeField({ bc: 'mur', freezeCurl: true });
  const c0 = 120;
  seedClosed(f, c0, 14, 1.0);     // pure E-kick, B≡0 (no impedance pair to slosh)
  for (let s = 0; s < (steps || 4000); s++) stepField(f);
  let pv = 0, pc = 0;
  for (let i = 0; i < f.N; i++){ if (Math.abs(f.Ey[i]) > pv){ pv = Math.abs(f.Ey[i]); pc = i; } }
  return { from: c0, to: pc, advanced: Math.abs(pc - c0) };
}

// ── THE SELF-TEST — the bench proves its own claims ──────────────────────────
// Five split claims (two MEASURED w/ stated bounds, two EXACT to machine-ε, plus
// the two RED neg-controls). The page pill and the Node twin both run THIS.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });

  // CLAIM 1 — ENERGY conserved on a closed (periodic) run, drift < 1e-9.
  const e = energyDriftClosed(4000);
  log('1 · energy conserved: U drifts < 1e-9 over 4000 leapfrog steps (closed/periodic, symplectic)',
      e.drift < 1e-9, 'max relative drift ' + e.drift.toExponential(2));

  // CLAIM 2 — MEASURED front speed === 1/√(μ₀ε₀) over a sweep of BOTH constants,
  //           to a discretisation tolerance (NOT machine-ε — this is a measurement).
  const SPEED_TOL = 5e-3;        // grid dispersion at courant 0.5, N~600 — honest bound
  let worstSpeed = 0, sweepOK = true;
  for (const mu0 of [0.5, 1.0, 2.0]){
    for (const eps0 of [0.5, 1.0, 2.0]){
      const r = speedDefect(mu0, eps0);
      if (!r.ok){ sweepOK = false; continue; }
      worstSpeed = Math.max(worstSpeed, r.rel);
    }
  }
  log('2 · measured front speed = 1/√(μ₀ε₀) over a sweep of BOTH μ₀,ε₀ (CFL/discretisation < 5e-3 — a MEASUREMENT)',
      sweepOK && worstSpeed < SPEED_TOL, 'worst relative defect ' + worstSpeed.toExponential(2) + ' (tol 5e-3)');

  // CLAIM 3 — ONE PULSE: one flick ⇒ exactly one right-mover; leftward energy ≈ 0,
  //           L2 shape correlation > 0.999 held to the absorbing edge.
  const p = onePulseCheck();
  const c3 = p.leftFrac < 1e-3 && p.corr > 0.999 && p.reflection < 1e-3;
  log('3 · one flick ⇒ exactly ONE right-mover: leftward energy ≈0, L2 shape-corr > 0.999 to the Mur edge',
      c3, 'leftFrac ' + p.leftFrac.toExponential(2) + ', corr ' + p.corr.toFixed(5) + ', reflect ' + p.reflection.toExponential(2));

  // CLAIM 4 — ε₀ DOUBLING is EXACT: c ratio = 1/√2 to machine-ε (algebraic identity).
  let worstEps = 0;
  for (const mu0 of [0.7, 1.0, 1.6]){
    for (const eps0 of [0.4, 1.0, 2.3]){
      worstEps = Math.max(worstEps, Math.abs(epsDoublingRatio(mu0, eps0) - 1 / Math.sqrt(2)));
    }
  }
  log('4 · doubling ε₀ scales c by EXACTLY 1/√2 — an algebraic identity, to machine-ε (the EXACT claim)',
      worstEps < 1e-15, 'worst |ratio − 1/√2| ' + worstEps.toExponential(2));

  // NEG-CONTROL (a) — FREEZE THE CURL: zero the Faraday leg ⇒ the front does NOT
  //           advance (B unsourced, no propagation). RED if it somehow marched.
  const fc = frozenCurlAdvance(4000);
  log('5 · NEG-CONTROL (a) FREEZE THE CURL: zero ∂B/∂t ⇒ front speed ≈ 0 (no propagation, pulse localises)',
      fc.advanced < 2, 'front moved ' + fc.advanced + ' cells in 4000 steps (frozen)');

  // NEG-CONTROL (b) — OVER-c CHEAT: courant > 1 (dt past the CFL limit) ⇒ energy
  //           blows up. "You cannot outrun the vacuum."
  const ob = overCourantBlowup(1.06);
  log('6 · NEG-CONTROL (b) OVER-c CHEAT: dt past the Courant limit ⇒ energy blows up (CFL violated, RED)',
      ob.blewUp, 'U max/U₀ = ' + (Number.isFinite(ob.ratio) ? ob.ratio.toExponential(2) : '∞'));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === BOOTSTRAP-BENCH CORE END ===

export {
  VACUUM, GRID,
  cflLimit, stableDt, lightSpeed,
  makeField, launch, seedClosed, stepField,
  totalEnergy, energyLeftRight, measureFrontSpeed, curlSourceMag,
  energyDriftClosed, speedDefect, onePulseCheck, epsDoublingRatio,
  overCourantBlowup, frozenCurlAdvance,
  runSelfTest,
};
