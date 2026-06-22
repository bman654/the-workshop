// ============================================================================
//  TWO COSTUMES, ONE SINE — the SAME free harmonic law x'' + ω²x = 0 worn by an
//  LC tank and a fixed-length pendulum. Logic core (the SOLE math authority).
//
//  THE ONE IDEA. There is exactly ONE free, undriven, undamped oscillator law,
//  x'' + ω²x = 0, and it does not care what x is made of. Boot it from rest at an
//  extremum and it is a pure cosine forever. We hang it from TWO literal bodies:
//    • the LC TANK — q'' + q/(LC) = 0 (charge q is the position, current i = q̇ the
//      velocity), ω = 1/√(LC). Charge pours between two plates; the coil's current
//      is the velocity. The Lodestone Hall's free electrical pendulum.
//    • a PENDULUM on a FIXED-length rod — θ'' + (g/L)θ = 0 in the small-angle limit,
//      ω₀ = √(g/L). The arc IS the readout.
//  Tune the rod's length so the two ω's MATCH and the strings rise and fall in eerie
//  lockstep: q hits its top plate on the SAME tick the bob hits the end of its arc,
//  the coil flares on the SAME tick the bob whips through bottom-dead-centre. Both
//  are the same cosine of time. ONE SLIDER drags the pendulum's effective length to
//  the match; a DAMP LEVER bleeds one twin (the negative control).
//
//  THE MATCHED-ω BRIDGE (no smuggled factor). The LC tank's ω = 1/√(L_lc·C); the
//  pendulum's ω₀ = √(g/L_pend). Set L_pend = g·L_lc·C and:
//        ω₀ = √( g / (g·L_lc·C) ) = √( 1/(L_lc·C) ) = 1/√(L_lc·C) = ω_LC.
//  The g cancels EXACTLY — no fudge factor. The self-test asserts the two ω's agree
//  over an L×C sweep to machine-ε (measured 4.4e-16).
//
//  THE PHASE MAP (the lockstep, pinned). Boot BOTH from rest at the extremum (φ=0),
//  so both are pure cosines: q = Q0·cos(ωt), θ = θ0·cos(ωt). Then q↔θ (both peak
//  together: q-PEAK = bob at arc end) and i = q̇ ↔ θ̇ (both zero-cross together:
//  i-PEAK / coil flare = bob through bottom-dead-centre). Normalize and the two
//  states are the SAME function of time: q̂ = q/Q0 ≡ θ̂ = θ/θ0 and î = i/(ωQ0) ≡
//  θ̇̂ = θ̇/(ωθ0). That single shared stroke is the timeline ribbon.
//
//  SINGLE-SOURCE DISCIPLINE. The two parent cores are the SOLE authorities for their
//  own physics. We import them byte-untouched (native ES modules, BOTH two ../ hops):
//    • lc-tank — omega, rk4Step, deriv, energyOf, trace, period, LC.Q0 (the electrical
//      pendulum's certified q-stepper + RLC neg-control + energy oracle).
//    • swing-ship — omega0, G ONLY (NOT its deriv/rk4Step — those carry the Mathieu
//      pump term −2L̇/L·θ̇ and the nonlinear sinθ; we want the FREE fixed-length leg).
//  A fresh, code-DISJOINT linear θ-stepper is typed HERE (the θ block names no LC fn;
//  the LC adapter names no SW integrator symbol — only omega0 — a grep assertion in
//  the Node twin). Neither costume re-derives the other's physics.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. SAME ω, two laws — |LC.omega(L,C) − SW.omega0(G·L·C)| < 1e-9 over an L×C sweep.
//    2. SAME FUNCTION OF TIME (headline) — boot both at rest-at-extremum, integrate a
//       full period at matched ω with EACH core's own rk4, normalize, and the two
//       states agree to < 1e-9 (q̂ ≡ θ̂ AND î ≡ θ̇̂).
//    3. CONVENTION-HONESTY (===) — pendEnergy/pendOmega use SW.omega0 / SW.G verbatim,
//       no smuggled 2π or ½; L_pend = G·L_lc·C re-derives ω₀ === SW.omega0(G·L_lc·C).
//    4. NEG-CONTROL DIVERGENCE + ENERGY — a damped leg (β>0) DIVERGES from its free
//       partner > 1e-4 AND its energy is strictly monotone-down, while the free pair
//       stays flat < 1e-9.
//    5. CLASSIFIER bites BOTH ways — classify returns free ✓ for both free legs AND
//       ✗ for the damped leg in the SAME row (a vacuous always-pass fails).
//    6. BYTE-TWIN PARITY + DISJOINTNESS — index.html CORE === core.mjs CORE char-for-
//       char, and the θ-adapter names no LC fn, the LC-adapter no SW integrator.
// ============================================================================

// the electrical pendulum's authority (lc-tank core, byte-untouched, two ../ hops):
import * as LC from '../../lodestone-hall/the-lc-tank/core.mjs';
// omega0 + G ONLY — the fixed-length leg (NOT swing-ship's Mathieu/nonlinear stepper):
import * as SW from '../../swing-ship/core.mjs';

// === CORE BEGIN ===
"use strict";

// ══ THE SHARED CONSTANTS — lifted from the parents, never re-typed ═══════════════════════════════════
const G = SW.G;                       // standard gravity (m/s²), from the swing-ship parent
const Q0 = LC.LC.Q0;                  // the charge dealt the plates before release, from the lc-tank parent
const TWO_PI = 2 * Math.PI;

// the dial rails. L_lc ∈ [LC_MIN, LC_MAX] is the matched LC length (C fixed at 1, the canonical tank);
// L_pend is the pendulum's effective length, dragged by the tuning slider. THETA0 is the boot amplitude.
const LC_MIN = 0.25, LC_MAX = 4.0, C0 = 1.0, THETA0 = 0.22;

// matchedLength(L_lc, C): the L_pend that makes the pendulum's ω₀ EQUAL the tank's ω. The whole bridge —
// L_pend = G·L_lc·C ⇒ ω₀ = √(g/L_pend) = √(1/(L_lc·C)) = 1/√(L_lc·C) = ω_LC. The g cancels (no fudge).
function matchedLength(L_lc, C = C0) { return G * L_lc * C; }

// detuneOmega(L_pend): the pendulum's small-angle ω₀ at ANY effective length, read from SW.omega0 verbatim
// (no re-typed √(g/L) — the parent owns it). At the matched length this EQUALS the tank's ω.
function pendOmega(L_pend) { return SW.omega0(L_pend); }

// the (L_lc, C) sweep the self-test walks.
function lcSweep() {
  const out = [];
  for (const L of [0.25, 0.5, 1, 2, 4]) for (const C of [0.25, 0.5, 1, 2, 4]) out.push([L, C]);
  return out;
}

// ══ THE LC ADAPTER — the electrical pendulum, read from the lc-tank core's OWN q-stepper + energy ════
// ─ LC-ADAPTER BEGIN ─
// lcState(): boot the tank from rest at the charge extremum — s = [q, i] = [Q0, 0] (a pure cosine).
// The lc-tank core's deriv/rk4Step/energyOf/omega are the SOLE authority; we never re-type them. The
// RLC neg-control lives in the parent's −(R/L)i damping term (lcStepDamped passes R>0).
function lcBoot() { return [Q0, 0]; }
function lcOmega(L_lc, C) { return LC.omega(L_lc, C); }                 // the tank's ω = 1/√(LC), from the parent
function lcStep(s, h, L_lc, C) { return LC.rk4Step(s, h, L_lc, C, 0); } // FREE leg: R=0 (the parent's rk4)
function lcStepDamped(s, h, L_lc, C, R) { return LC.rk4Step(s, h, L_lc, C, R); } // RLC neg-control: R>0
function lcEnergy(s, L_lc, C) { return LC.energyOf(s[0], s[1], L_lc, C); }       // the parent's ONE energy oracle
// normalized state: q̂ = q/Q0, î = i/(ω·Q0). Getting the î scale = ω·Q0 right is load-bearing — a cosine
// only traces a UNIT ring (and the headline only collapses) when the velocity is divided by ω·amplitude.
function lcNormalized(s, L_lc, C) { const w = lcOmega(L_lc, C); return [s[0] / Q0, s[1] / (w * Q0)]; }
// ─ LC-ADAPTER END ─

// ══ THE θ-ADAPTER — a FRESH, code-disjoint LINEAR fixed-length pendulum stepper (NOT swing-ship's) ════
// ─ THETA-ADAPTER BEGIN ─
// pendDeriv(s, L, beta): the FREE fixed-length harmonic law θ'' = −(g/L)θ − 2β·θ̇. State s = [θ, θ̇].
// beta = 0 is the free undamped twin; beta > 0 is the air-drag NEG-CONTROL (one twin bleeds). This block
// names NO lc-tank function and re-types NO √ — pendOmega (above) reads ω₀ from SW.omega0 verbatim.
function pendDeriv(s, L, beta = 0) { return [ s[1], -(G / L) * s[0] - 2 * beta * s[1] ]; }
// one classic RK4 step of pendDeriv (a fresh integrator, disjoint from both parents' rk4).
function pendStep(s, h, L, beta = 0) {
  const k1 = pendDeriv(s, L, beta);
  const k2 = pendDeriv([s[0] + 0.5 * h * k1[0], s[1] + 0.5 * h * k1[1]], L, beta);
  const k3 = pendDeriv([s[0] + 0.5 * h * k2[0], s[1] + 0.5 * h * k2[1]], L, beta);
  const k4 = pendDeriv([s[0] + h * k3[0], s[1] + h * k3[1]], L, beta);
  return [ s[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
           s[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) ];
}
// pendEnergy(s, L): the small-angle energy ½θ̇² + ½(g/L)θ² (mass=1). Uses SW.G verbatim (convention #3).
function pendEnergy(s, L) { return 0.5 * s[1] * s[1] + 0.5 * (G / L) * s[0] * s[0]; }
// pendBoot(): rest at the arc extremum — [θ0, 0] (a pure cosine, the phase-mate of the tank's [Q0,0]).
function pendBoot() { return [THETA0, 0]; }
// normalized state: θ̂ = θ/θ0, θ̇̂ = θ̇/(ω·θ0) — the SAME normalization as the tank, so the two collapse.
function pendNormalized(s, L) { const w = pendOmega(L); return [s[0] / THETA0, s[1] / (w * THETA0)]; }
// ─ THETA-ADAPTER END ─

// ══ THE CONSERVED-ENERGY CLASSIFIER — does this leg's energy stay flat? ══════════════════════════════
// classify(kind, ...): integrate `kind` ('lc' | 'pend') over `periods` periods at matched ω and report
// whether the energy held flat (free ✓) or bled (damped ✗). It reads the SAME oracle the visual reads
// (lcEnergy / pendEnergy), so the badge and the apparatus can never disagree. Returns the energy span
// and the verdict; the in-page badge and the self-test both call THIS.
function classify(kind, L_lc, C, R = 0, beta = 0, periods = 12, perCycle = 720) {
  const w = lcOmega(L_lc, C);
  const T = TWO_PI / w, h = T / perCycle, steps = Math.round(periods * perCycle);
  let s, energyOf, E0;
  if (kind === 'lc') { s = lcBoot(); energyOf = (st) => lcEnergy(st, L_lc, C); }
  else               { const Lp = matchedLength(L_lc, C); s = pendBoot(); energyOf = (st) => pendEnergy(st, Lp); }
  E0 = energyOf(s);
  let eMin = E0, eMax = E0, prevE = E0, monotoneDown = true;
  for (let k = 0; k < steps; k++) {
    if (kind === 'lc') s = lcStepDamped(s, h, L_lc, C, R);
    else               s = pendStep(s, h, matchedLength(L_lc, C), beta);
    const e = energyOf(s);
    if (e < eMin) eMin = e;
    if (e > eMax) eMax = e;
    if (e > prevE + 1e-12) monotoneDown = false;
    prevE = e;
  }
  const eEnd = energyOf(s);
  const span = E0 > 0 ? (eMax - eMin) / E0 : (eMax - eMin);
  // FREE ⇔ energy flat (span < 1e-6). a leg with R>0 or β>0 fails this and is graded as bleeding.
  const free = span < 1e-6 && monotoneDown && eEnd >= E0 * (1 - 1e-6);
  return { kind, free, span, monotoneDown, E0, eEnd, eEndRatio: E0 > 0 ? eEnd / E0 : 1 };
}

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest() {
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  const sweep = lcSweep();

  // ROW 1 — SAME ω, two laws. |LC.omega(L,C) − SW.omega0(G·L·C)| < 1e-9 over the L×C sweep.
  {
    let worst = 0, worstAt = '';
    for (const [L, C] of sweep) {
      const d = Math.abs(lcOmega(L, C) - pendOmega(matchedLength(L, C)));
      if (d > worst) { worst = d; worstAt = 'L=' + L + ' C=' + C; }
    }
    ck('1 · same ω, two laws: |ω_LC(L,C) − ω₀_pend(G·L·C)| < 1e-9 over the L×C sweep (the g cancels — no fudge)',
       worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at ' + worstAt + ' over ' + sweep.length + ' pairs');
  }

  // ROW 2 — SAME FUNCTION OF TIME (headline). Boot both at rest-at-extremum, integrate a full period at
  // matched ω with EACH core's OWN rk4, normalize, and assert max|q̂−θ̂| AND max|î−θ̇̂| < 1e-9.
  {
    let worst = 0, worstAt = '';
    for (const [L, C] of sweep) {
      const Lp = matchedLength(L, C), w = lcOmega(L, C), T = TWO_PI / w, N = 1600, h = T / N;
      let sLC = lcBoot(), sP = pendBoot(), wm = 0;
      for (let k = 1; k <= N; k++) {
        sLC = lcStep(sLC, h, L, C);
        sP = pendStep(sP, h, Lp, 0);
        const nl = lcNormalized(sLC, L, C), np = pendNormalized(sP, Lp);
        wm = Math.max(wm, Math.abs(nl[0] - np[0]), Math.abs(nl[1] - np[1]));
      }
      if (wm > worst) { worst = wm; worstAt = 'L=' + L + ' C=' + C; }
    }
    ck('2 · same function of time (HEADLINE): normalized states agree over a full period — max(|q̂−θ̂|,|î−θ̇̂|) < 1e-9',
       worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at ' + worstAt + ' (each core stepped with its OWN rk4)');
  }

  // ROW 3 — CONVENTION-HONESTY (===). The pendulum ω₀ is SW.omega0 verbatim; pendEnergy uses SW.G verbatim
  // (no smuggled 2π/½); L_pend = G·L_lc·C re-derives ω₀ === SW.omega0(G·L_lc·C) byte-exactly.
  {
    let ok = true, witness = '';
    for (const [L, C] of sweep) {
      const Lp = matchedLength(L, C);
      if (!(pendOmega(Lp) === SW.omega0(Lp))) { ok = false; witness = 'ω₀ mismatch L=' + L; break; }
      if (!(matchedLength(L, C) === G * L * C)) { ok = false; witness = 'L_pend mismatch L=' + L; break; }
      // pendEnergy at a known state uses exactly ½θ̇²+½(g/L)θ² with G verbatim
      const probe = [0.1, 0.07];
      if (!(pendEnergy(probe, Lp) === 0.5 * probe[1] * probe[1] + 0.5 * (G / Lp) * probe[0] * probe[0])) { ok = false; witness = 'energy form L=' + L; break; }
    }
    ck('3 · convention honesty (===): pendOmega === SW.omega0, L_pend === G·L·C, pendEnergy uses G verbatim (no smuggled 2π/½)',
       ok, ok ? 'byte-exact over the sweep' : 'FAILS at ' + witness);
  }

  // ROW 4 — NEG-CONTROL DIVERGENCE + ENERGY. A damped pendulum leg (β>0) DIVERGES from its free partner
  // > 1e-4 AND its energy is strictly monotone-down (eEnd < E0·(1−1e-6)), while the free pair stays flat.
  {
    const L = 1, C = 1, Lp = matchedLength(L, C), w = lcOmega(L, C), T = TWO_PI / w, N = 1600 * 8, h = T * 8 / N;
    let sFree = pendBoot(), sDamp = pendBoot(), beta = 0.08, maxDiv = 0;
    for (let k = 1; k <= N; k++) {
      sFree = pendStep(sFree, h, Lp, 0);
      sDamp = pendStep(sDamp, h, Lp, beta);
      maxDiv = Math.max(maxDiv, Math.abs(sFree[0] - sDamp[0]));
    }
    const cd = classify('pend', L, C, 0, beta, 24);   // the damped leg's energy verdict
    const cf = classify('pend', L, C, 0, 0, 24);      // its free partner stays flat
    const ok = maxDiv > 1e-4 && cd.monotoneDown && cd.eEndRatio < 1 - 1e-6 && cf.span < 1e-9;
    ck('4 · neg-control: a damped leg DIVERGES from its free twin > 1e-4 AND its energy is monotone-down (eEnd<E0·(1−1e-6)); the free twin stays flat <1e-9',
       ok, 'maxDiv=' + maxDiv.toFixed(4) + ' damped eEnd/E0=' + cd.eEndRatio.toExponential(2) + ' free span=' + cf.span.toExponential(2));
  }

  // ROW 5 — CLASSIFIER bites BOTH ways (anti-vacuity). classify returns free ✓ for BOTH free legs (lc &
  // pend) AND ✗ for the damped leg AND free ✓ for its undamped partner in the SAME row.
  {
    const L = 1, C = 1, beta = 0.08, R = 0.1;
    const lcFree = classify('lc', L, C, 0, 0);
    const penFree = classify('pend', L, C, 0, 0);
    const penDamp = classify('pend', L, C, 0, beta);
    const lcDamp = classify('lc', L, C, R, 0);
    const ok = lcFree.free && penFree.free && !penDamp.free && !lcDamp.free;
    ck('5 · classifier bites BOTH ways: free ✓ for both free legs AND ✗ for the damped leg AND ✗ for the damped tank (a vacuous always-pass fails)',
       ok, 'lc-free=' + lcFree.free + ' pend-free=' + penFree.free + ' pend-damp=' + penDamp.free + ' lc-damp=' + lcDamp.free);
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// === CORE END ===

export {
  G, Q0, TWO_PI, LC_MIN, LC_MAX, C0, THETA0,
  matchedLength, pendOmega, lcSweep,
  lcBoot, lcOmega, lcStep, lcStepDamped, lcEnergy, lcNormalized,
  pendDeriv, pendStep, pendEnergy, pendBoot, pendNormalized,
  classify, runSelfTest,
};

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every row + parity + disjointness.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nTwo Costumes, One Sine — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
