// ============================================================================
//  THE LC TANK — a pendulum made of electricity. The Lodestone Hall's free,
//  UNDRIVEN oscillator: one capacitor, one coil, one loop, no battery.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE source for every charge / current / energy / frequency number the
//  bench shows. The page inlines the slab between the LC-TANK CORE BEGIN / END
//  sentinels byte-for-byte; core.test.mjs RE-EXTRACTS the inlined copy, evaluates
//  it with NO injection, and proves the page core === the module core, so page,
//  pill, and Node twin can never silently drift.
//
//  THE ONE IDEA — LC = A PENDULUM OF ELECTRICITY. A charged capacitor is a coiled
//  spring (energy in its electric field, ½q²/C); a coil carrying current is a
//  flywheel (energy in its magnetic field, ½Li²). Wire them in a loop and the
//  charge q plays the part of position x, the current i = dq/dt the part of
//  velocity. The same ODE that swings a pendulum now sloshes energy between the
//  two fields:
//        L·q'' + q/C = 0     ⇔     x'' + ω²x = 0,    ω = 1/√(LC)
//  Let go from a charged plate (i=0) and the charge pours into the coil as current,
//  the current pours back onto the OTHER plate, forever — the only push being the
//  one you gave it once. Period T = 2π√(LC), dead constant; the energy sum holds.
//
//  FRESH SPINE, NOT A FORK. The honest cousin is resonance/core.mjs (The Singing
//  Glass) — the SAME ODE family (a driven, damped harmonic oscillator) but DRIVEN
//  by an external forcing term and probed for its resonance peak. Ours is the
//  UNDRIVEN FREE tank: no drive term anywhere (see deriv — there is no +F/L), so
//  energy is conserved at R=0 and the only motion is the initial charge ringing
//  down. This core re-types its OWN closed form and ODE from scratch — it does NOT
//  import the resonance core; the twin proves the independence in §anti-circularity.
//
//  NEG-CONTROL — RESISTANCE. Add a resistor R into the loop and the ODE gains a
//  damping term, L·q'' + R·q' + q/C = 0. Now the energy STRICTLY DECAYS each cycle
//  (the slosh rings down to nothing) — proven RED against the R=0 conserved case in
//  the SAME self-test row. A lossless tank that ever decayed, or a resistive tank
//  that ever held flat, fails.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): index.html forge-inlines this
//  ONE slab (no parent slab — the byte-twin does not look for one) and the twin
//  asserts the inlined slice is char-identical to core.mjs's slice, re-types its own
//  ODE, names its honest cousin, and evaluates with NO injection to the same result.
// ============================================================================

// === LC-TANK CORE BEGIN ===
"use strict";

// The shipped scene constants — the tank's own apparatus and the UI dial rails.
// L is the coil's inductance, C the capacitor's capacitance, R the loop resistance
// (the neg-control; 0 = lossless). Q0 is the charge you deal the plates before you
// let go. The *_min/_max are the three dials' rails; R_max is the damping ceiling.
const LC = { L: 1.0, C: 1.0, R: 0.0, Q0: 1.0, L_min: 0.25, L_max: 4, C_min: 0.25, C_max: 4, R_max: 0.6 };

// ── THE NATURAL FREQUENCY ω = 1/√(LC) and the PERIOD T = 2π√(LC). These are the
//    whole claim: the slosh rate depends ONLY on L·C, never on how hard you charged
//    the plates. period() is canonical; periodT is the alias the witness reads.
const omega   = (L, C) => 1 / Math.sqrt(L * C);
const period  = (L, C) => 2 * Math.PI * Math.sqrt(L * C);   // canonical
const periodT = period;                                      // alias the witness asked for

// ── THE CLOSED FORM (lossless, R=0). Boot at the charge extremum (φ=0 ⇒ q=+Q0, i=0)
//    and the loop rings as a cosine: q(t) = Q0·cos(ωt+φ), i = dq/dt = −ωQ0·sin(ωt+φ).
//    Charge and current are a quarter-period apart — when one is at an extremum the
//    other is exactly zero (the never-both-lit truth, structural via cos ⟂ sin).
const qClosed = (t, L, C, Q0 = LC.Q0, phi = 0) =>  Q0 * Math.cos(omega(L, C) * t + phi);
const iClosed = (t, L, C, Q0 = LC.Q0, phi = 0) => -omega(L, C) * Q0 * Math.sin(omega(L, C) * t + phi);

// ── THE ONE ENERGY ORACLE. Electric energy lives in the capacitor's field (½q²/C);
//    magnetic energy lives in the coil's field (½Li²). energyOf is the sum that both
//    bars AND the flat-sum line read; energyE / energyM are the two terms it splits.
const energyE     = (q, C)       => 0.5 * q * q / C;        // electric term (blue bar)
const energyM     = (i, L)       => 0.5 * L * i * i;        // magnetic term (amber bar)
const energyOf    = (q, i, L, C) => energyE(q, C) + energyM(i, L);   // the ONE energy oracle
const energyTotal = energyOf;                               // alias for the flat sum

// ── THE ODE (the truth the closed form is a shortcut for). State s = [q, i].
//    q' = i ;  i' = −(R/L)·i − q/(LC).   NO drive term — this is the UNDRIVEN free
//    tank, and the neg-control (damping) lives in the −(R/L)·i term, here and only
//    here. At R=0 it is pure SHM and the closed form is exact; at R>0 it rings down.
const deriv = (s, L, C, R) => [ s[1], -(R / L) * s[1] - s[0] / (L * C) ];

// classic 4th-order Runge–Kutta step of deriv (one integrator feeds twin + page).
function rk4Step(s, h, L, C, R) {
  const k1 = deriv(s, L, C, R);
  const k2 = deriv([s[0] + 0.5 * h * k1[0], s[1] + 0.5 * h * k1[1]], L, C, R);
  const k3 = deriv([s[0] + 0.5 * h * k2[0], s[1] + 0.5 * h * k2[1]], L, C, R);
  const k4 = deriv([s[0] + h * k3[0], s[1] + h * k3[1]], L, C, R);
  return [
    s[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    s[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
  ];
}

// ── INTEGRATE the tank over `periods` periods at `perCycle` steps/cycle, reporting
//    the energy envelope. monotoneDown = energy never rises step-to-step (the decay
//    test's teeth); spread = (eMax−eMin)/E0 over the WHOLE trajectory incl. E0 (the
//    flat-sum test's teeth at R=0); eMaxPost = the largest energy AFTER you let go
//    (over the integrated steps, EXCLUDING the start E0) — the "never rises above the
//    start" teeth; eEnd = the energy after the full span (well below E0 once it has
//    rung down — the decay-magnitude teeth, since at R>0 the FIRST step barely loses
//    energy (i=0 at the release extremum) but the SPAN must visibly drain).
function trace(L, C, R, periods = 1, perCycle = 720, q0 = LC.Q0, i0 = 0) {
  const T = period(L, C);
  const h = T / perCycle;
  const steps = Math.round(periods * perCycle);
  let s = [q0, i0];
  const E0 = energyOf(s[0], s[1], L, C);
  let eMin = E0, eMax = E0, eMaxPost = -Infinity, monotoneDown = true, prevE = E0;
  for (let k = 0; k < steps; k++) {
    s = rk4Step(s, h, L, C, R);
    const e = energyOf(s[0], s[1], L, C);
    if (e < eMin) eMin = e;
    if (e > eMax) eMax = e;
    if (e > eMaxPost) eMaxPost = e;                // max over post-release samples only
    if (e > prevE + 1e-12) monotoneDown = false;   // a single up-tick breaks the decay
    prevE = e;
  }
  if (eMaxPost === -Infinity) eMaxPost = E0;
  const eEnd = energyOf(s[0], s[1], L, C);
  const spread = E0 > 0 ? (eMax - eMin) / E0 : (eMax - eMin);
  return { s, E0, eMin, eMax, eMaxPost, eEnd, monotoneDown, spread };
}

// ── THE SELF-TEST — the bench proves its own claim. FIVE rows, cross-multiplied /
//    relative tolerances, zero-crossing guards, neg-control contrast. The page pill
//    and the Node twin both call THIS; no separate page math ⇒ no drift.
function runSelfTest() {
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const LS = [0.25, 0.5, 1, 2, 4], CS = [0.25, 0.5, 1, 2, 4];

  // ROW 1 — PERIOD === 2π√(LC), two independent ways, over L×C. (a) analytic period()
  //         vs the literal 2π√(LC); (b) the MEASURED zero-crossing period of the
  //         closed form (sub-step linear interpolation of q through 0) — the cosine
  //         crosses zero every half period, so two crossings span exactly T.
  let worst1a = 0, worst1b = 0;
  for (const L of LS) for (const C of CS) {
    const T = period(L, C);
    worst1a = Math.max(worst1a, Math.abs(T - 2 * Math.PI * Math.sqrt(L * C)));
    // measure: walk the closed-form q across ~1.5 periods, catch the first two
    // up-or-down zero crossings, linear-interpolate the exact crossing times.
    const dt = T / 4000, cross = [];
    let prev = qClosed(0, L, C);
    for (let k = 1; k <= 6000 && cross.length < 3; k++) {
      const t = k * dt, cur = qClosed(t, L, C);
      if ((prev <= 0 && cur > 0) || (prev >= 0 && cur < 0)) {
        const tc = (k - 1) * dt + dt * (0 - prev) / (cur - prev);   // linear interp to q=0
        cross.push(tc);
      }
      prev = cur;
    }
    if (cross.length >= 3) {
      const measured = cross[2] - cross[0];   // two half-periods = one full period
      worst1b = Math.max(worst1b, Math.abs(measured - T));
    } else { worst1b = Infinity; }
  }
  log('1 · period === 2π√(LC): analytic <1e-9 AND measured zero-crossing period <1e-9 over L,C ∈ {0.25..4}²',
      worst1a < 1e-9 && worst1b < 1e-9,
      'worst |analytic−2π√(LC)| = ' + worst1a.toExponential(2) + ', worst |measured−T| = ' + worst1b.toExponential(2));

  // ROW 2 — CLOSED FORM === INTEGRATED ODE at R=0. Step rk4 from (Q0,0) over many
  //         periods and compare to qClosed/iClosed; worst max(|Δq|,|Δi|) <1e-9.
  let worst2 = 0;
  for (const L of LS) for (const C of CS) {
    const T = period(L, C), perCycle = 1440, h = T / perCycle, nP = 8;
    let s = [LC.Q0, 0];
    for (let k = 1; k <= nP * perCycle; k++) {
      s = rk4Step(s, h, L, C, 0);
      const t = k * h;
      const dq = Math.abs(s[0] - qClosed(t, L, C));
      const di = Math.abs(s[1] - iClosed(t, L, C));
      worst2 = Math.max(worst2, dq, di);
    }
  }
  log('2 · closed form === integrated ODE at R=0: rk4 from (Q0,0) vs qClosed/iClosed over 8 periods, max(|Δq|,|Δi|) <1e-9',
      worst2 < 1e-9, 'worst max(|Δq|,|Δi|) = ' + worst2.toExponential(2));

  // ROW 3 — ENERGY FLAT at R=0: trace spread <1e-9 across the sweep. This IS the
  //         flat sum line — the energy sloshes between the fields but the total holds.
  let worst3 = 0;
  for (const L of LS) for (const C of CS) {
    worst3 = Math.max(worst3, trace(L, C, 0, 20).spread);
  }
  log('3 · energy FLAT at R=0: trace(L,C,0,20).spread <1e-9 across the sweep (½q²/C + ½Li² holds dead constant)',
      worst3 < 1e-9, 'worst spread (eMax−eMin)/E0 = ' + worst3.toExponential(2));

  // ROW 4 — THE HINGE / NEG-CONTROL: energy STRICTLY DECAYS at R>0 vs FLAT at R=0,
  //         asserted as a CONTRAST in ONE row. For each R∈{0.02,0.1,0.5}: the trace
  //         is monotone-down (no step ever rises) AND eMaxPost ≤ E0 (never climbs
  //         above the start) AND eEnd < E0·(1−1e-6) (the span visibly drains — note
  //         the FIRST step barely loses energy since i=0 at release, so the DECAY is
  //         measured over the SPAN); AND the SAME-(L,C) R=0 trace holds spread <1e-9.
  //         A single up-tick at R>0, a span that fails to drain, or ANY decay at R=0, fails.
  let decayOk = true, flatOk = true, worstDecay = 0, worstFlat = 0;
  for (const R of [0.02, 0.1, 0.5]) {
    const damped = trace(1, 1, R, 20);
    const lossless = trace(1, 1, 0, 20);
    const thisDecay = damped.monotoneDown
                   && damped.eMaxPost <= damped.E0 + 1e-12
                   && damped.eEnd < damped.E0 * (1 - 1e-6);
    decayOk = decayOk && thisDecay;
    flatOk = flatOk && lossless.spread < 1e-9;
    worstDecay = Math.max(worstDecay, damped.eEnd / damped.E0);   // closest-to-1 end ratio
    worstFlat = Math.max(worstFlat, lossless.spread);
  }
  log('4 · NEG-CONTROL: R>0 energy STRICTLY DECAYS (monotone-down, span drains eEnd<E0·(1−1e-6)) while R=0 holds FLAT (spread<1e-9) — same sweep',
      decayOk && flatOk,
      'R>0 worst eEnd/E0 = ' + worstDecay.toExponential(4) + ' (<1 ✓=' + decayOk + '), R=0 worst spread = ' + worstFlat.toExponential(2));

  // ROW 5 — QUARTER-PHASE: charge and current are a quarter period apart. At every q
  //         extremum |i| ≈ 0; at every i extremum |q| ≈ 0 (analytic extrema times),
  //         and a dense scan confirms |q|·|i| is small only away from crossings —
  //         never are both lit. Uses the closed form (R=0). Tolerances <1e-9.
  let worst5q = 0, worst5i = 0, bothBright = 0;
  for (const L of LS) for (const C of CS) {
    const w = omega(L, C), Imax = w * LC.Q0;
    // q extrema at ωt = nπ (q=±Q0); i should be ~0 there
    for (let n = 0; n < 6; n++) {
      const t = n * Math.PI / w;
      worst5q = Math.max(worst5q, Math.abs(iClosed(t, L, C)));   // |i| at q-extremum
    }
    // i extrema at ωt = (n+½)π (i=±Imax); q should be ~0 there
    for (let n = 0; n < 6; n++) {
      const t = (n + 0.5) * Math.PI / w;
      worst5i = Math.max(worst5i, Math.abs(qClosed(t, L, C)));   // |q| at i-extremum
    }
    // dense scan: normalized brightness product |cos|·|sin| ≤ 0.5 always (never both 1)
    const T = period(L, C);
    for (let k = 0; k <= 400; k++) {
      const t = T * k / 400;
      const qn = Math.abs(qClosed(t, L, C)) / LC.Q0;
      const inb = Math.abs(iClosed(t, L, C)) / Imax;
      bothBright = Math.max(bothBright, qn * inb);   // = |cos·sin| ≤ 0.5
    }
  }
  log('5 · QUARTER-PHASE: |i| at every q-extremum <1e-9 AND |q| at every i-extremum <1e-9; never both lit (|q̂·î| ≤ 0.5+ε)',
      worst5q < 1e-9 && worst5i < 1e-9 && bothBright <= 0.5 + 1e-9,
      'worst |i|@q-ext = ' + worst5q.toExponential(2) + ', worst |q|@i-ext = ' + worst5i.toExponential(2) + ', max |q̂·î| = ' + bothBright.toFixed(4));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === LC-TANK CORE END ===

export {
  LC,
  omega, period, periodT,
  qClosed, iClosed,
  energyE, energyM, energyOf, energyTotal,
  deriv, rk4Step, trace,
  runSelfTest,
};
