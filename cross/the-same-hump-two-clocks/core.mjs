// ============================================================================
//  THE SAME HUMP, TWO CLOCKS — the SAME hump r·x(1−x), read by two clocks, ends
//  in OPPOSITE fates. Logic core (the SOLE authority for the bridge).
//
//  THE ONE IDEA. There is exactly ONE hump here: the logistic parabola r·x(1−x)
//  on [0,1]. Hand it to a CONTINUOUS clock (an ODE, N' = r·N(1−N)) and it ALWAYS
//  glides to one calm level and rests — for EVERY r, forever. Hand the SAME hump
//  to a DISCRETE clock (the map x ← r·x(1−x), one jump per tick) and it SPLITS:
//  past r=3 the single level forks to a 2-cycle, then 4, 8, … and past r≈3.57 it
//  BOILS into chaos. Same hump. Two clocks. Opposite fates. The whole piece is the
//  difference between reading a law continuously and reading it tick-by-tick.
//
//  WHY THE FLOW NEVER FORKS (the continuous clock). The flow's only interior rest
//  is N* = 1, and its stability is the slope of the field there: f'(1) = −r. That
//  is NEGATIVE for EVERY r > 0 — it can never cross zero — so the rest point is
//  stable for all r and the colony eases monotonically to the rim with no
//  overshoot. There is no bifurcation to have. (This is the neg-control made
//  visible: at r=3.9 the left dish STILL just fills and holds.)
//
//  WHY THE MAP FORKS (the discrete clock). The map's fixed point x* = 1−1/r is
//  stable only while |f'(x*)| < 1. The map's slope there is f'(x*) = r(1−2x*) =
//  2−r, so |2−r| < 1 ⇔ 2 < r < 4 … no: it loses stability the instant |2−r| = 1,
//  i.e. at r = 3 (|2−3| = 1 EXACTLY). Past r=3 the level can no longer hold and
//  the orbit rings between two levels — the 2-cycle — then doubles again and again
//  into the period-doubling cascade, ending in chaos (λ > 0) past r≈3.57.
//
//  THE CANONICAL DECISION (K = 1 everywhere). To make "same hump" LITERAL in code
//  and not merely thematic, the flow is re-based onto the SAME normalized hump the
//  map uses: N' = r·N(1−N) on [0,1] (carrying capacity K = 1). Then the flow's
//  lit-fraction is N directly (rests at N=1) and the map's is x directly (already
//  in [0,1]) — both dishes read [0,1] identically, so the ONLY visible difference
//  between them is the clock. (VERIFIED: fixedPoints({r,K:1})[1] = {N:1,
//  stable:true, eig:−r}; trace(.,'rk4',{r,K:1}).endN = 1.000000, monotone, no
//  overshoot, for every r in {2.8, 3.2, 3.9}.)
//
//  SINGLE-SOURCE DISCIPLINE. The two parent cores are the SOLE authorities for
//  their own physics. We import them byte-untouched (native ES modules, BOTH two
//  ../ hops):
//    • conservatory/logistic — field, fPrime, fixedPoints, trace (the continuous
//      clock: the certified logistic ODE, its slope/stability, its RK4 tracer).
//    • bifurcation — MAPS, periodOf, lyapunov, iterate, cobwebOrbit (the discrete
//      clock: the logistic MAP, its period detector, its Lyapunov arbiter, its
//      exact iterate + the attractor levels the eye sees).
//  The SAME map object — MAPS.logistic — is shared by both: the map adapter reads
//  it, and the flow is its continuous twin. Two CODE-DISJOINT adapters: the FLOW
//  block names only conservatory fns, the MAP block only bifurcation fns + the
//  shared hump. Neither clock re-derives the other's law (a grep in the Node twin).
//
//  THE ONE FRESHLY-TYPED LINE. mapFixedSlope(r) = 2−r is the map's textbook fixed-
//  point derivative f'(x*) = r(1−2x*) at x* = 1−1/r, simplified. The bifurcation
//  parent exposes NO map-derivative export, so this single line is typed here and
//  documented as such; it is used only by the neg-control leg to pin the loss of
//  stability at exactly r = 3 (|2−3| = 1).
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. r=2.8 BOTH CALM — flow eig=−2.8 stable, endN→1, no overshoot; map period 1.
//    2. r=3.2 SPLIT (headline) — flow STILL stable (eig=−3.2, endN→1, no overshoot)
//       while the map period === 2 (the single level has forked); diverged === true.
//    3. r=3.9 FLOW TAMES / MAP BOILS — map λ > 0 & period 0 (chaos) while the flow
//       still eases to endN→1 stable.
//    4. NEG-CTRL FLOW — eig@K = −r over a wide r sweep, worst|eig+r| = 0 ⇒ the flow
//       can NEVER bifurcate (its slope never crosses zero).
//    5. NEG-CTRL MAP — |mapFixedSlope(3)| = |2−3| = 1 EXACTLY; |@2.9| < 1 < |@3.1|
//       (the map's fixed point straddles the first doubling at exactly r = 3).
//    6. ANTI-VACUITY — diverged === false at r=2.8 AND === true at r=3.2 (the
//       "they diverge" verdict bites both ways; a vacuous always-split fails).
// ============================================================================

// the continuous clock's authority (conservatory logistic core, byte-untouched, two ../ hops):
import { field, fPrime, fixedPoints, trace } from '../../conservatory/logistic/core.mjs';
// the discrete clock's authority (bifurcation core, byte-untouched, two ../ hops):
import { MAPS, periodOf, lyapunov, iterate, cobwebOrbit } from '../../bifurcation/core.mjs';

// === CORE BEGIN ===
"use strict";

// ══ THE DIAL RAILS + the three fate-detents ═══════════════════════════════════════════════════════
// r ∈ [R_MIN, R_MAX]. The three magnetic detents are labelled by FATE, not number, and the live page
// snaps to them: r=2.8 "both calm" · r=3.2 "they split" · r=3.9 "one boils, one holds". A thin red
// hairline sits at exactly R_CRACK = 3.0 — where the map's fixed point loses stability (|2−r|=1) while
// the flow shows nothing (eig=−r never crosses zero): the asymmetry, made spatial on the control.
const R_MIN = 2.6, R_MAX = 4.0, R_CRACK = 3.0;
const X0 = 0.05;                 // the shared seed both clocks reset to on every stop-change
const DETENTS = [
  { r: 2.8, fate: 'both calm' },
  { r: 3.2, fate: 'they split' },
  { r: 3.9, fate: 'one boils, one holds' },
];

// ══ THE FLOW ADAPTER — the CONTINUOUS clock, read from the conservatory logistic core ONLY ══════════
// ─ FLOW-ADAPTER BEGIN ─
// This block names ONLY conservatory fns (field, fPrime, fixedPoints, trace) — never a bifurcation
// symbol (a grep assertion in the Node twin). The flow rides the SAME normalized hump the map uses,
// at carrying capacity K = 1, so its lit-fraction is N directly and it rests at N = 1.
// flowEigAtK(r): the stability eigenvalue at the rim N* = 1 — the field's slope there, f'(1) = −r.
// NEGATIVE for every r > 0, so the rest point is stable for all r: the flow can never bifurcate.
function flowEigAtK(r) { return fPrime(1, { r, K: 1 }); }
// flowRest(r): the two fixed points of the normalized hump — [{N:0, eig:+r}, {N:1, eig:−r}]. The rim
// N=1 is the stable one (eig=−r<0). Read from the parent's fixedPoints verbatim (never re-derived).
function flowRest(r) { return fixedPoints({ r, K: 1 }); }
// flowSettle(r): integrate the continuous clock from the shared seed and report the fate. Read off the
// parent's certified RK4 tracer: endN (where it rests), whether the Lyapunov V=(N−1)² fell monotone,
// whether it ever overshot the rim, and how many times it crossed it. For EVERY r: endN→1, monotone,
// no overshoot, zero crossings — it just fills and holds.
function flowSettle(r, N0 = X0, dt = 0.01, T = 120) {
  const tp = trace(N0, dt, Math.round(T / dt), 'rk4', { r, K: 1 });
  return { endN: tp.endN, monotone: tp.vMonotoneDown, overshoot: tp.overshoot, kCross: tp.kCross };
}
// flowField(r, N): the continuous clock's instantaneous growth rate (the parent's field). The live
// page advances the left dish by many tiny RK4 sub-steps of THIS field across the model-time one tick
// spans, so the flow GLIDES through the exact interval the map JUMPS across.
function flowField(r, N) { return field(N, { r, K: 1 }); }
// ─ FLOW-ADAPTER END ─

// ══ THE MAP ADAPTER — the DISCRETE clock, read from the bifurcation core ONLY (+ the shared hump) ═══
// ─ MAP-ADAPTER BEGIN ─
// This block names ONLY bifurcation fns (MAPS, periodOf, lyapunov, iterate, cobwebOrbit) + the one
// freshly-typed map derivative — never a conservatory symbol (a grep assertion in the Node twin).
// HUMP is the SAME logistic hump the flow rides — MAPS.logistic, the bifurcation parent's own map.
const HUMP = MAPS.logistic;                                  // x ← r·x(1−x) on [0,1] (r first: f(r,x))
// mapTick(r, x): advance the discrete clock ONE iterate. Read off the parent's iterate (never a
// re-typed loop) — the page calls THIS on every metronome beat so what JUMPS is what is tested.
function mapTick(r, x) { return iterate(HUMP, r, x, 1); }
// mapPeriod(r): the period of the settled attractor (1, 2, 4, 8, … or 0 for chaos), from the parent.
function mapPeriod(r) { return periodOf(HUMP, r); }
// mapLyap(r): the Lyapunov exponent — the arbiter of chaos. λ<0 ⇒ a stable periodic orbit; λ>0 ⇒
// sensitive dependence (boiling). From the parent's lyapunov verbatim.
function mapLyap(r) { return lyapunov(HUMP, r); }
// mapBands(r): the settled attractor levels the crowd dish snaps between — the EXACT tail of the
// parent's cobwebOrbit (drawn == tested). At r=2.8 it is one level; r=3.2 two; r=3.9 a churning many.
function mapBands(r) { return cobwebOrbit(HUMP, r); }
// mapFixedSlope(r): the map's TEXTBOOK fixed-point derivative f'(x*) = r(1−2·x*) at x* = 1−1/r, which
// simplifies ALGEBRAICALLY to 2−r (substitute: r(1−2(1−1/r)) = r(1−2+2/r) = r(−1)+2 = 2−r). We return
// the SIMPLIFIED form so r=3 gives exactly −1 (the unsimplified r·(1−2(1−1/r)) round-trips through
// 1/3 and lands at 1.0000000000000004 — float noise, not physics). The bifurcation parent exposes NO
// map-derivative export, so this is the SINGLE freshly-typed line; it pins the loss of stability at
// exactly r=3, where |2−3| = 1 EXACTLY (the first period-doubling).
function mapFixedSlope(r) { return 2 - r; }                       // ≡ r(1−2x*) at x* = 1−1/r (simplified)
// ─ MAP-ADAPTER END ─

// ══ THE ONE WRAPPER both the page AND the pill consume — a single read of both clocks at one r ══════
// clocksReading(r): the SOLE reading the two dishes AND the green chip take at the live dial — never a
// private recompute, so what you SEE can never disagree with what is TESTED. It reports the flow's
// fate (stable, where it rests, monotone, overshoot), the map's fate (period, λ, chaos), and the one
// verdict the whole piece turns on: `diverged` — true when the flow is calm-stable yet the map has
// LEFT period 1 (forked or boiling). At r=2.8 diverged=false (both calm); at r≥3.2 diverged=true.
function clocksReading(r) {
  const eig = flowEigAtK(r);
  const settle = flowSettle(r);
  const period = mapPeriod(r);
  const lam = mapLyap(r);
  const flowStable = eig < 0;
  return {
    r,
    flowEig: eig,
    flowStable,
    flowEndN: settle.endN,
    flowMonotone: settle.monotone,
    flowOvershoot: settle.overshoot,
    mapPeriod: period,
    mapLyap: lam,
    mapChaos: period === 0 && lam > 0,
    // the flow holds (stable, no overshoot) while the map has left the single level (period ≠ 1).
    diverged: (flowStable && !settle.overshoot) && (period !== 1),
  };
}

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest() {
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });

  // LEG 1 — r=2.8 BOTH CALM. The flow is stable (eig=−2.8<0), eases to the rim (|endN−1|<1e-3),
  // monotone with no overshoot; the map settles to ONE level (period 1). Same hump, both calm.
  {
    const c = clocksReading(2.8);
    const ok = c.flowEig === -2.8 && c.flowStable && c.flowMonotone && !c.flowOvershoot &&
      Math.abs(c.flowEndN - 1) < 1e-3 && c.mapPeriod === 1;
    ck('1 · r=2.8 BOTH CALM: flow eig=−2.8<0 stable, endN→1 monotone no-overshoot; map period 1',
      ok, 'eig=' + c.flowEig + ' endN=' + c.flowEndN.toFixed(6) + ' over=' + c.flowOvershoot +
      ' mono=' + c.flowMonotone + ' · map period=' + c.mapPeriod);
  }

  // LEG 2 — r=3.2 SPLIT (the headline). The flow is STILL calm-stable (rest eig=−3.2<0, endN→1, no
  // overshoot) while the SAME hump under the discrete clock has FORKED to a 2-cycle (period 2). The
  // `diverged` verdict is true. One hump, two clocks, opposite fates — pinned in numbers.
  {
    const c = clocksReading(3.2);
    const rest = flowRest(3.2);
    const ok = rest[1].eig === -3.2 && rest[1].stable && Math.abs(c.flowEndN - 1) < 1e-3 &&
      !c.flowOvershoot && c.mapPeriod === 2 && c.diverged === true;
    ck('2 · r=3.2 SPLIT (HEADLINE): flow rest eig=−3.2 stable, endN→1 no-overshoot; map period 2 ⇒ diverged',
      ok, 'flow rest.eig=' + rest[1].eig + ' endN=' + c.flowEndN.toFixed(6) + ' over=' + c.flowOvershoot +
      ' · map period=' + c.mapPeriod + ' · diverged=' + c.diverged);
  }

  // LEG 3 — r=3.9 FLOW TAMES / MAP BOILS. The map's Lyapunov exponent is POSITIVE (chaos) and its
  // period is 0 (aperiodic), while the flow STILL eases calmly to the rim (endN→1, stable). The
  // stubborn calm of the left dish at r=3.9 IS the neg-control made visible.
  {
    const c = clocksReading(3.9);
    const ok = c.mapLyap > 0 && c.mapPeriod === 0 && c.mapChaos &&
      c.flowStable && Math.abs(c.flowEndN - 1) < 1e-3 && !c.flowOvershoot;
    ck('3 · r=3.9 FLOW TAMES / MAP BOILS: map λ>0 & period 0 (chaos); flow still endN→1 stable',
      ok, 'map λ=' + c.mapLyap.toFixed(4) + ' period=' + c.mapPeriod + ' · flow eig=' + c.flowEig +
      ' endN=' + c.flowEndN.toFixed(6));
  }

  // LEG 4 — NEG-CONTROL FLOW. The flow's rim eigenvalue is −r for EVERY r across a wide sweep, to the
  // byte: worst|eig+r| = 0. Its slope can never cross zero, so it can NEVER bifurcate — there is no
  // fate but the one calm level. (This is WHY the left dish always just fills and holds.)
  {
    let worst = 0, worstAt = '';
    for (const r of [0.5, 1, 2.8, 3.2, 3.9, 10, 100]) {
      const d = Math.abs(flowEigAtK(r) + r);
      if (d > worst) { worst = d; worstAt = 'r=' + r; }
    }
    ck('4 · neg-control FLOW: eig@rim=−r over r∈{0.5..100}, worst|eig+r|=0 ⇒ can NEVER bifurcate',
      worst < 1e-12, 'worst|eig+r|=' + worst.toExponential(2) + (worstAt ? ' at ' + worstAt : '') +
      ' (the flow slope never crosses zero)');
  }

  // LEG 5 — NEG-CONTROL MAP. The map's fixed-point slope is 2−r; it hits magnitude 1 at EXACTLY r=3
  // (|2−3|=1), and straddles it: |@2.9|<1<|@3.1|. So the map's single level provably loses stability
  // at exactly r=3 — the first doubling — while the flow shows nothing there.
  {
    const s3 = mapFixedSlope(3), s29 = mapFixedSlope(2.9), s31 = mapFixedSlope(3.1);
    const ok = Math.abs(s3) === 1 && Math.abs(s29) < 1 && 1 < Math.abs(s31);
    ck('5 · neg-control MAP: |f\'(x*)|=|2−r| =1 EXACTLY at r=3, with |@2.9|<1<|@3.1| (straddles the first doubling)',
      ok, '|2−3|=' + Math.abs(s3) + ' · |2−2.9|=' + Math.abs(s29).toFixed(4) + ' · |2−3.1|=' + Math.abs(s31).toFixed(4));
  }

  // LEG 6 — ANTI-VACUITY. The `diverged` verdict the whole piece turns on bites BOTH ways: false at
  // r=2.8 (both calm, agreement) AND true at r=3.2 (the split). A vacuous always-split checker fails.
  {
    const calm = clocksReading(2.8).diverged;
    const split = clocksReading(3.2).diverged;
    ck('6 · anti-vacuity: diverged=false @2.8 (they agree) AND =true @3.2 (they split) — bites both ways',
      calm === false && split === true, 'diverged@2.8=' + calm + ' · diverged@3.2=' + split);
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// === CORE END ===

export {
  R_MIN, R_MAX, R_CRACK, X0, DETENTS,
  flowEigAtK, flowRest, flowSettle, flowField,
  HUMP, mapTick, mapPeriod, mapLyap, mapBands, mapFixedSlope,
  clocksReading, runSelfTest,
};

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every leg + parity + disjointness.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nThe Same Hump, Two Clocks — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
