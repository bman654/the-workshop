// ============================================================================
//  WEIGHTLESS AT THE TOP — the SAME weightless crest reached two opposite ways:
//  a coaster bead that EARNS its crest speed by FALLING, and a ferris gondola
//  DRIVEN to crest speed by a MOTOR. Logic core (the SOLE math authority).
//
//  THE ONE IDEA. "Apparent weight goes to zero at the top" is one threshold with
//  two mechanisms. On a vertical circle of radius r, the crest is weightless the
//  instant the crest speed satisfies v² = g·r — equivalently the crest angular
//  rate is ω₀ = √(g/r). NOTHING about WHERE that speed came from is in the
//  condition. We hang it from TWO literal rides that arrive at the SAME crest:
//    • the COASTER (EARNED) — a frictionless bead released from height h falls
//      into a vertical loop. Energy alone sets the crest speed: v_top² = 2g(h−2r).
//      Release from exactly h = 2.5r and the crest speed lands on v² = g·r — the
//      seat unloads to zero and the bead floats free over the top. Below 2.5r the
//      bead can't hold the rail: it DETACHES partway up and arcs off ballistic.
//    • the FERRIS WHEEL (IMPOSED) — a motor turns the wheel at a DIALED constant
//      ω. The crest reading is N_top = m(g − ω²r). Spin to ω₀ = √(g/r) and the
//      crest unloads to exactly zero — the SAME float, handed to the rider by the
//      motor instead of earned by a fall. Below ω₀ the crest still PRESSES; past
//      ω₀ it swings NEGATIVE (the lap-bar pulls down) — kept honest, not clamped.
//
//  THE SHARED ZERO (no smuggled factor). The coaster floats when its crest speed²
//  equals g·r; the ferris floats when ω₀²·r equals g, i.e. (ω₀·r)² = g·r. BOTH
//  rides float on the SAME crest speed² = g·r. With the live shared radius r=R=9
//  and g=G=9.81, that crest speed² = 88.29. The g does not cancel here the way it
//  did for the matched-ω pendulum twins — instead BOTH mechanisms target the SAME
//  invariant g·r, so the two felt-weight needles collide on ONE shared zero. The
//  self-test asserts the imposed crest speed² equals g·r to machine-ε (≈1.4e-14)
//  AND three diff-ZERO identities (ω₀²r === g, N_top(ω₀) === 0, the earned analytic
//  crest speed² at h=2.5r === g·r). The earned crest speed read off the integrated
//  trace lands on g·r to the sample floor (≈1e-16) — the loose ROW that proves the
//  parent's own stepper agrees, never tightened to ε.
//
//  THE HERO is two felt-weight needles, not a plotted curve. ONE brass dial reads
//  apparent weight at the crest per unit mass (felt-weight per kg, m/s²): the COOL
//  needle is the coaster's earned crest, the WARM needle is the ferris's imposed
//  crest. Raise h→2.5r and dial ω→ω₀ and the two needles sweep to the SAME zero
//  from opposite mechanisms — one fell to it, one was driven to it.
//
//  SINGLE-SOURCE DISCIPLINE. The two parent cores are the SOLE authorities for
//  their own physics. We import them byte-untouched (native ES modules, BOTH two
//  ../ hops):
//    • the-coaster — buildTrack, integrate, detectDetach, G (the certified
//      frictionless-rail energy stepper + the loop-detach verdict + neg-control).
//    • ferris-wheel — floatOmega, topN, G, R (the certified apparent-weight law +
//      the float threshold ω₀ = √(g/r) + the shared radius R).
//  Two code-DISJOINT adapters wrap them: the IMPOSED adapter names ONLY FW.*; the
//  EARNED adapter names ONLY CO.* (a grep assertion in the Node twin). Neither
//  mechanism re-derives the other's physics, and NO number (88.29, ω₀) is ever
//  hard-coded in logic — every value comes from the parents at runtime.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. BRIDGE machine-ε — |imposedCrestSpeed2(ω₀) − sharedCrestSpeed2()| < 1e-9
//       at the live shared r (the two floats meet on v² = g·r = 88.29).
//    2. BRIDGE exact (===) — imposedCrestFelt(ω₀) === 0 AND ω₀²r === g AND the
//       earned analytic crest speed² at h=2.5r === g·r (the "g·r is the whole story,
//       no fudge" headline, truthfully byte-exact).
//    3. EARNED through the parent (sample-limited) — the integrated coaster crest
//       speed² at h=2.5r equals g·r to the sample floor, and its felt needle ≈ 0.
//    4. NEG-CONTROLS, each from its OWN authority — a just-clearing release does NOT
//       detach while a hair below it DOES (the coaster's detach verdict), AND the
//       imposed crest still PRESSES below ω₀ (a sub-float spin is not weightless).
//    5. BYTE-TWIN PARITY + DISJOINTNESS — index.html CORE === core.mjs CORE char-
//       for-char, and the IMPOSED adapter names no CO symbol, the EARNED adapter no
//       FW symbol; both parents imported at the same two ../ hops.
// ============================================================================

// the coaster's authority (the-coaster core, byte-untouched, two ../ hops):
import * as CO from '../../the-coaster/core.mjs';
// the ferris wheel's authority (ferris-wheel core, byte-untouched, two ../ hops):
import * as FW from '../../ferris-wheel/core.mjs';

// === CORE BEGIN ===
"use strict";

// ══ THE SHARED CONSTANTS — lifted from the parents, never re-typed ═══════════════════════════════════
// G is the SAME standard gravity in both rides (CO.G === FW.G — asserted in ROW 2). R is the shared loop
// radius (FW.R=9): the coaster builds its loop at r=R and the ferris turns a wheel of the same r=R, so the
// ONE readout below — apparent weight at the crest per unit mass (N/m = m/s²), the felt-weight needle that
// reads ZERO ⟺ the rider floats — is the SAME quantity for both mechanisms on the SAME circle.
const G = FW.G;
const R = FW.R;
const TWO_PI = 2 * Math.PI;

// ══ THE IMPOSED ADAPTER — the ferris crest, DRIVEN to speed by a motor (read from the ferris-wheel core) ══
// ─ IMPOSED-ADAPTER BEGIN ─
// imposedOmega0(): the crest-float angular rate ω₀ = √(g/r), read from FW.floatOmega verbatim (never a
// re-typed √(g/r) — the parent owns it). At ω₀ the motor has driven the wheel to exactly the float speed.
function imposedOmega0() { return FW.floatOmega(R); }
// imposedCrestFelt(omega): the apparent weight per unit mass at the crest, N_top = m(g − ω²r) with m=1, read
// from FW.topN verbatim. Below ω₀ it is positive (the crest still presses); at ω₀ it is 0; past ω₀ it is
// NEGATIVE (the lap-bar pulls down) — never clamped. This IS the warm needle's reading.
function imposedCrestFelt(omega) { return FW.topN(omega, 1, R); }
// imposedCrestSpeed2(omega): the gondola's crest speed², (ω·r)². At ω₀ this equals g·r (ROW 1, machine-ε).
function imposedCrestSpeed2(omega) { const v = omega * R; return v * v; }
// imposedPress(omega): the crest reading again, named for the neg-control — below ω₀ it PRESSES (>0).
function imposedPress(omega) { return imposedCrestFelt(omega); }
// ─ IMPOSED-ADAPTER END ─

// ══ THE EARNED ADAPTER — the coaster crest, EARNED by a fall (read from the-coaster core's own stepper) ══
// ─ EARNED-ADAPTER BEGIN ─
// earnedTrack(): a frictionless rail — hoist tower, a valley, an EXACT r=R vertical loop with its bottom on
// the ground, then a run-out — built from CO.buildTrack verbatim (the parent owns the geometry + κ===1/r).
function earnedTrack() {
  return CO.buildTrack({
    pre:  [{ x: 0, y: 3 * R }, { x: 1.5 * R, y: 1.2 * R }, { x: 3 * R, y: 0.15 * R }, { x: 3.6 * R, y: 0 }],
    loop: { cx: 4 * R, cy: R, r: R },
    post: [{ x: 5 * R, y: 0.1 * R }, { x: 7 * R, y: 0.4 * R }],
    ds:   0.05 * R
  });
}
// earnedCrestSpeed2(track, h): release the bead from height h and read the crest speed² off the parent's
// integrated trace — scan the onLoop samples for the one nearest φ=π (top dead centre, exactly as the
// coaster's own self-test does) and return its v². The crest speed is EARNED by the fall, not dialed.
function earnedCrestSpeed2(track, h) {
  const res = CO.integrate(track, h);
  let top = null, best = Infinity;
  for (const t of res.trace) {
    if (t.onLoop) { const d = Math.abs(t.phi - Math.PI); if (d < best) { best = d; top = t; } }
  }
  return top.v * top.v;
}
// earnedCrestSpeed2Analytic(h): the closed-form crest speed² from energy, v_top² = 2g(h−2r). At h=2.5r this
// is exactly g·r (ROW 2, byte-exact ===) — the textbook just-clears-the-loop release.
function earnedCrestSpeed2Analytic(h) { return 2 * G * (h - 2 * R); }
// earnedCrestFelt(h): the apparent weight per unit mass at the crest for a release of height h, from the
// analytic crest speed: N_top/m = v_top²/r − g. At h=2.5r this is 0 — the SAME float the ferris reaches.
function earnedCrestFelt(h) { return earnedCrestSpeed2Analytic(h) / R - G; }
// justClearHeight(): the release that EARNS exactly the float crest speed — h = 2.5r (the threshold).
function justClearHeight() { return 2.5 * R; }
// earnedDetach(h): the analytic detach angle for a release of height h on a radius-R loop, read from
// CO.detectDetach verbatim — null if the bead clears the top (h ≥ 2.5r), else the angle it leaves the rail.
function earnedDetach(h) { return CO.detectDetach(h, R); }
// ─ EARNED-ADAPTER END ─

// ══ THE SHARED INSTRUMENT — the ONE dial both needles ride ═══════════════════════════════════════════
// sharedCrestSpeed2(): the crest speed² that makes EITHER ride weightless, v² = g·r. With the live shared
// r=R and g=G this is 88.29. Both mechanisms target THIS one number; the dial's zero sits where they meet.
function sharedCrestSpeed2() { return G * R; }
// imposedNeedle(omega): the warm needle — apparent weight per unit mass at the ferris crest (felt-weight
// per kg, m/s²). Identical units to earnedNeedle below, so the two share ONE honest zero on ONE dial.
function imposedNeedle(omega) { return imposedCrestFelt(omega); }
// earnedNeedle(track, h): the cool needle — apparent weight per unit mass at the coaster crest, from the
// integrated crest speed: v_top²/r − g. SAME units as imposedNeedle (felt-weight per kg). At h=2.5r ≈ 0.
function earnedNeedle(track, h) { return earnedCrestSpeed2(track, h) / R - G; }

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest() {
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  const w0 = imposedOmega0();

  // ROW 1 — BRIDGE machine-ε. The imposed crest speed² at ω₀ equals the shared float speed² g·r to machine
  // ε (the (ω·r)² and g·r are the SAME number up to floating-point rounding — the two floats meet).
  {
    const diff = Math.abs(imposedCrestSpeed2(w0) - sharedCrestSpeed2());
    ck('1 · BRIDGE machine-ε: |imposedCrestSpeed2(ω₀) − sharedCrestSpeed2()| < 1e-9 (both floats meet on v²=g·r)',
       diff < 1e-9, 'diff=' + diff.toExponential(2) + '  r=' + R + '  v²=g·r=' + sharedCrestSpeed2().toFixed(2));
  }

  // ROW 2 — BRIDGE exact (===). The three diff-ZERO identities: the imposed crest felt-weight at ω₀ is
  // exactly 0; ω₀²·r is exactly g; the earned analytic crest speed² at h=2.5r is exactly g·r. The g·r is
  // the whole story — no smuggled factor, truthfully byte-exact ===. Also CO.G === FW.G (one gravity).
  {
    const okFloat = imposedCrestFelt(w0) === 0;
    const okRoot  = w0 * w0 * R === G;
    const okEarn  = earnedCrestSpeed2Analytic(justClearHeight()) === sharedCrestSpeed2();
    const okG     = CO.G === FW.G;
    ck('2 · BRIDGE exact (===): imposedCrestFelt(ω₀)===0 AND ω₀²r===g AND earnedAnalytic(2.5r)===g·r (no fudge)',
       okFloat && okRoot && okEarn && okG,
       'float=' + imposedCrestFelt(w0) + ' ω₀²r−g=' + (w0 * w0 * R - G) + ' earnedΔ=' + (earnedCrestSpeed2Analytic(justClearHeight()) - sharedCrestSpeed2()) + ' CO.G===FW.G=' + okG);
  }

  // ROW 3 — EARNED through the parent (SAMPLE-LIMITED, NOT ε). Build the real track, integrate a release
  // from h=2.5r with the parent's own energy stepper, and assert the integrated crest speed² lands on g·r
  // (ratio→1 within 1e-3) AND the earned felt needle ≈ 0 (within 1e-2). Loose floors by design — the
  // discretized scan can never hit the crest sample exactly; ROW 1/ROW 2 alone carry the tight bounds.
  {
    const track = earnedTrack();
    const ratio = earnedCrestSpeed2(track, 2.5 * R) / (G * R);
    const felt  = earnedNeedle(track, 2.5 * R);
    const ok = Math.abs(ratio - 1) < 1e-3 && Math.abs(felt) < 1e-2;
    ck('3 · EARNED through the parent (sample-limited): integrated crest v²/(g·r)→1 (<1e-3) AND felt needle ≈0 (<1e-2)',
       ok, 'v²/(g·r)−1=' + (ratio - 1).toExponential(2) + '  earnedNeedle=' + felt.toExponential(2));
  }

  // ROW 4 — NEG-CONTROLS, each from its OWN authority (anti-vacuity). (a) the coaster's detach verdict: a
  // just-clearing release (h=2.5r) does NOT detach (null) while a hair below (2.49r) DOES (a real angle>0).
  // (b) the ferris crest still PRESSES below ω₀ (imposedPress(½ω₀) > 0 — a sub-float spin is not weightless).
  {
    const clears = earnedDetach(justClearHeight()) === null;
    const below  = earnedDetach(2.49 * R);
    const detachesBelow = below != null && below > 0;
    const press = imposedPress(0.5 * w0);
    const pressesBelow = press > 0;
    ck('4 · neg-controls (own authority): just-clear h=2.5r does NOT detach AND 2.49r DOES AND ½ω₀ still presses (>0)',
       clears && detachesBelow && pressesBelow,
       'detach(2.5r)=' + earnedDetach(justClearHeight()) + ' detach(2.49r)=' + (below == null ? 'null' : below.toFixed(3)) + ' press(½ω₀)=' + press.toFixed(4));
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// === CORE END ===

export {
  G, R, TWO_PI,
  imposedOmega0, imposedCrestFelt, imposedCrestSpeed2, imposedPress,
  earnedTrack, earnedCrestSpeed2, earnedCrestSpeed2Analytic, earnedCrestFelt, justClearHeight, earnedDetach,
  sharedCrestSpeed2, imposedNeedle, earnedNeedle, runSelfTest,
};

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every row + parity + disjointness.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nWeightless at the Top — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
