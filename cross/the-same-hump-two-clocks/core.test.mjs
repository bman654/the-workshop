// Node twin for The Same Hump, Two Clocks core. Zero-dep. Run: `node cross/the-same-hump-two-clocks/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, plus BOTH real parents at
// the same two ../ hops, so the page's gold self-test pill and this twin can never drift. It re-proves
// the 6 legs the in-page pill proves, PLUS parity legs the pill cannot run from inside the page:
//
//   1.  r=2.8 BOTH CALM     — flow eig=−2.8<0 stable, endN→1 monotone no-overshoot; map period 1.
//   2.  r=3.2 SPLIT (head)  — flow rest eig=−3.2 stable, endN→1 no-overshoot; map period 2 ⇒ diverged.
//   3.  r=3.9 FLOW/MAP      — map λ>0 & period 0 (chaos); flow still endN→1 stable.
//   4.  NEG-CTRL FLOW       — eig@rim=−r over a wide r sweep, worst|eig+r|=0 ⇒ can never bifurcate.
//   5.  NEG-CTRL MAP        — |2−r|=1 EXACTLY at r=3, |@2.9|<1<|@3.1| (straddles the first doubling).
//   6.  ANTI-VACUITY        — diverged=false @2.8 AND =true @3.2 (the verdict bites both ways).
//   7.  BYTE-TWIN PARITY    — index.html CORE region === core.mjs CORE region, char-for-char.
//   8.  SENTINEL PARITY     — each parent's OWN inlined slab still matches that parent's core.mjs
//                             (conservatory LOGISTIC-CORE + AGENT-CORE indentation-normalised;
//                             bifurcation ROAD-INTO-CHAOS CORE, export-stripped). If a parent drifts,
//                             this BRIDGE fails loudly — the law we bridge IS the live parents' law.
//   9.  DISJOINTNESS        — the FLOW adapter names no bifurcation fn; the MAP adapter names no
//                             conservatory fn (a grep over each adapter's body text).
//  10.  DETERMINISM         — clocksReading(3.2) twice is deep-equal.
//  11.  PILL PARITY         — runSelfTest() (the function the page inlines as its chip) is all-green.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  R_CRACK, X0,
  flowEigAtK, flowRest, flowSettle,
  mapPeriod, mapLyap, mapFixedSlope,
  clocksReading, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Same Hump, Two Clocks — Node twin (one hump r·x(1−x), two clocks, opposite fates)\n');

// ── LEG 1: r=2.8 BOTH CALM ───────────────────────────────────────────────────────────────────────
console.log('— Leg 1: r=2.8 — both clocks calm (flow eases to the rim · map settles to one level) —');
{
  const c = clocksReading(2.8);
  ck('flow eig=−2.8<0 stable, endN→1 monotone no-overshoot',
    c.flowEig === -2.8 && c.flowStable && c.flowMonotone && !c.flowOvershoot && Math.abs(c.flowEndN - 1) < 1e-3,
    'eig=' + c.flowEig + ' endN=' + c.flowEndN.toFixed(6) + ' mono=' + c.flowMonotone + ' over=' + c.flowOvershoot);
  ck('map settles to ONE level (period 1)', c.mapPeriod === 1, 'period=' + c.mapPeriod);
  ck('diverged=false — they AGREE here', c.diverged === false, 'diverged=' + c.diverged);
}

// ── LEG 2: r=3.2 SPLIT (the headline) ──────────────────────────────────────────────────────────────
console.log('\n— Leg 2 (HEADLINE): r=3.2 — the flow still holds while the SAME hump under the map FORKS —');
{
  const c = clocksReading(3.2);
  const rest = flowRest(3.2);
  ck('flow rest eig=−3.2<0 stable, endN→1, no overshoot (it STILL just fills and holds)',
    rest[1].eig === -3.2 && rest[1].stable && Math.abs(c.flowEndN - 1) < 1e-3 && !c.flowOvershoot,
    'rest.eig=' + rest[1].eig + ' endN=' + c.flowEndN.toFixed(6) + ' over=' + c.flowOvershoot);
  ck('map has FORKED to a 2-cycle (period 2)', c.mapPeriod === 2, 'period=' + c.mapPeriod);
  ck('diverged=true — one hump, two clocks, OPPOSITE fates', c.diverged === true, 'diverged=' + c.diverged);
}

// ── LEG 3: r=3.9 FLOW TAMES / MAP BOILS ─────────────────────────────────────────────────────────────
console.log('\n— Leg 3: r=3.9 — the map BOILS (λ>0, aperiodic) while the flow STILL eases calmly to the rim —');
{
  const c = clocksReading(3.9);
  ck('map λ>0 (sensitive dependence — chaos)', c.mapLyap > 0, 'λ=' + c.mapLyap.toFixed(4));
  ck('map period 0 (aperiodic) & mapChaos flag set', c.mapPeriod === 0 && c.mapChaos, 'period=' + c.mapPeriod + ' chaos=' + c.mapChaos);
  ck('flow STILL stable & endN→1 (the stubborn calm — the neg-control made visible)',
    c.flowStable && Math.abs(c.flowEndN - 1) < 1e-3 && !c.flowOvershoot,
    'eig=' + c.flowEig + ' endN=' + c.flowEndN.toFixed(6));
}

// ── LEG 4: NEG-CONTROL FLOW — can never bifurcate ──────────────────────────────────────────────────
console.log('\n— Leg 4 (neg-control FLOW): eig@rim=−r for EVERY r — the flow slope never crosses zero —');
{
  let worst = 0, worstAt = '';
  for (const r of [0.5, 1, 2.8, 3.2, 3.9, 10, 100]) {
    const d = Math.abs(flowEigAtK(r) + r);
    if (d > worst) { worst = d; worstAt = 'r=' + r; }
  }
  ck('worst|eig+r| = 0 over r∈{0.5..100} (the rim eigenvalue is exactly −r, always stable)',
    worst < 1e-12, 'worst=' + worst.toExponential(2) + (worstAt ? ' at ' + worstAt : ''));
}

// ── LEG 5: NEG-CONTROL MAP — straddles the first doubling at exactly r=3 ───────────────────────────
console.log('\n— Leg 5 (neg-control MAP): |f\'(x*)|=|2−r| straddles 1 at exactly r=3 (the first doubling) —');
{
  const s3 = mapFixedSlope(3), s29 = mapFixedSlope(2.9), s31 = mapFixedSlope(3.1);
  ck('|2−3| = 1 EXACTLY (the map fixed point loses stability at exactly r=3)', Math.abs(s3) === 1, '|2−3|=' + Math.abs(s3));
  ck('|@2.9| < 1 < |@3.1| (stable just below r=3, unstable just above)', Math.abs(s29) < 1 && 1 < Math.abs(s31),
    '|2−2.9|=' + Math.abs(s29).toFixed(4) + ' · |2−3.1|=' + Math.abs(s31).toFixed(4));
  ck('R_CRACK constant is exactly 3.0 (the red hairline on the lever)', R_CRACK === 3.0, 'R_CRACK=' + R_CRACK);
}

// ── LEG 6: ANTI-VACUITY — the diverged verdict bites both ways ─────────────────────────────────────
console.log('\n— Leg 6 (anti-vacuity): diverged=false @2.8 AND =true @3.2 — a vacuous always-split fails —');
{
  const calm = clocksReading(2.8).diverged, split = clocksReading(3.2).diverged;
  ck('diverged=false @2.8 (they agree) AND =true @3.2 (they split)', calm === false && split === true,
    'diverged@2.8=' + calm + ' · diverged@3.2=' + split);
}

// ── LEG 7: BYTE-TWIN PARITY — index.html CORE === core.mjs CORE ─────────────────────────────────────
console.log('\n— Leg 7: byte-twin parity — index.html CORE region === core.mjs CORE region (char-for-char) —');
const here = dirname(fileURLToPath(import.meta.url));
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const coreReg = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('core.mjs CORE region present', !!coreReg);
  ck('index.html CORE region present', !!pageReg);
  ck('PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

// ── LEG 8: SENTINEL PARITY — each parent's OWN inlined slab still matches that parent's core.mjs ────
//   The bridge imports BOTH parents byte-untouched. This leg re-slices each parent's own sentinel slab
//   from its index.html and asserts it still matches that parent's core.mjs — so if a parent ever drifts
//   (its page and its core fall out of sync), THIS bridge fails loudly. The law we bridge IS the live
//   parents' law, verified at the source, not a stale copy.
console.log('\n— Leg 8: sentinel parity — each PARENT\'s inlined slab still matches its own core.mjs —');
{
  // (a) conservatory LOGISTIC-CORE — indentation-normalised (matching the conservatory test's norm).
  const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
  const cMod = readFileSync(join(here, '../../conservatory/logistic/core.mjs'), 'utf8');
  const cPage = readFileSync(join(here, '../../conservatory/logistic/index.html'), 'utf8');
  {
    const START = '// ===== LOGISTIC-CORE (byte-identical to core.mjs) =====';
    const END = '// ===== END LOGISTIC-CORE =====';
    const modBody = norm(cMod.slice(cMod.indexOf('const P = {'), cMod.indexOf('export {')));
    const pi = cPage.indexOf(START), pj = cPage.indexOf(END);
    const pageBody = pi >= 0 && pj > pi ? norm(cPage.slice(pi + START.length, pj)) : null;
    ck('conservatory LOGISTIC-CORE: page slab === core.mjs (indentation-normalised)',
      pageBody != null && modBody === pageBody,
      pageBody == null ? 'sentinels MISSING' : (modBody === pageBody ? modBody.length + ' chars match' : 'PARENT DRIFT'));
  }
  {
    const A_START = '// ===== AGENT-CORE (byte-identical to core.mjs) =====';
    const A_END = '// ===== END AGENT-CORE =====';
    const mi = cMod.indexOf(A_START), mj = cMod.indexOf(A_END);
    const ai = cPage.indexOf(A_START), aj = cPage.indexOf(A_END);
    const modA = mi >= 0 && mj > mi ? norm(cMod.slice(mi + A_START.length, mj)) : null;
    const pageA = ai >= 0 && aj > ai ? norm(cPage.slice(ai + A_START.length, aj)) : null;
    ck('conservatory AGENT-CORE: page slab === core.mjs (indentation-normalised)',
      modA != null && pageA != null && modA === pageA,
      (modA == null || pageA == null) ? 'sentinels MISSING' : (modA === pageA ? modA.length + ' chars match' : 'PARENT DRIFT'));
  }
  // (b) bifurcation ROAD-INTO-CHAOS CORE — export-stripped, trimmed (forge adds a leading blank line).
  {
    const BEGIN = '// ===== ROAD-INTO-CHAOS CORE (inlined byte-twin of core.mjs) BEGIN =====';
    const END = '// ===== ROAD-INTO-CHAOS CORE (inlined byte-twin of core.mjs) END =====';
    const bMod = readFileSync(join(here, '../../bifurcation/core.mjs'), 'utf8');
    const bPage = readFileSync(join(here, '../../bifurcation/index.html'), 'utf8');
    const slice = (t) => { const i = t.indexOf(BEGIN), j = t.indexOf(END); return (i < 0 || j < i) ? null : t.slice(i + BEGIN.length, j); };
    const modS = slice(bMod), pageS = slice(bPage);
    const modN = modS == null ? null : modS.replace(/^export /gm, '').trim();
    const pageN = pageS == null ? null : pageS.trim();
    ck('bifurcation ROAD-INTO-CHAOS CORE: page slab === core.mjs (export-stripped)',
      modN != null && pageN != null && modN === pageN,
      (modN == null || pageN == null) ? 'sentinels MISSING' : (modN === pageN ? modN.length + ' chars match' : 'PARENT DRIFT'));
  }
}

// ── LEG 9: ADAPTER DISJOINTNESS — the two clocks never name each other's fns ───────────────────────
console.log('\n— Leg 9: adapter disjointness — FLOW names no bifurcation fn; MAP names no conservatory fn —');
{
  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const FLOW_B = '// ─ FLOW-ADAPTER BEGIN ─', FLOW_E = '// ─ FLOW-ADAPTER END ─';
  const MAP_B = '// ─ MAP-ADAPTER BEGIN ─', MAP_E = '// ─ MAP-ADAPTER END ─';
  const flowBody = coreSrc.slice(coreSrc.indexOf(FLOW_B), coreSrc.indexOf(FLOW_E));
  const mapBody = coreSrc.slice(coreSrc.indexOf(MAP_B), coreSrc.indexOf(MAP_E));
  ck('the FLOW adapter names NO bifurcation symbol (MAPS / periodOf / lyapunov / iterate / cobwebOrbit / HUMP)',
    !/\bMAPS\b|periodOf|lyapunov|\biterate\b|cobwebOrbit|\bHUMP\b/.test(flowBody), 'reads only the conservatory ODE core');
  ck('the MAP adapter names NO conservatory symbol (field / fPrime / fixedPoints / trace)',
    !/\bfield\b|fPrime|fixedPoints|\btrace\b/.test(mapBody), 'reads only the bifurcation map core + the shared hump');
}

// ── LEG 10: DETERMINISM — clocksReading(3.2) twice is deep-equal ───────────────────────────────────
console.log('\n— Leg 10: determinism — clocksReading(3.2) twice is byte-identical —');
{
  const a = JSON.stringify(clocksReading(3.2)), b = JSON.stringify(clocksReading(3.2));
  ck('two reads of clocksReading(3.2) are deep-equal', a === b, a === b ? 'identical' : 'DIFFER');
  // and the shared seed is the canonical 0.05 both clocks reset to
  ck('the shared seed X0 === 0.05 (both clocks reset to the same x on every stop-change)', X0 === 0.05, 'X0=' + X0);
}

// ── LEG 11: PILL PARITY — the page's chip (runSelfTest) is all-green ───────────────────────────────
console.log('\n— Leg 11: pill parity — runSelfTest() (the function the page inlines as its chip) —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok && r.passed === r.total, r.passed + '/' + r.total);
}

console.log('\n—— The Same Hump, Two Clocks Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
