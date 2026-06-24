// Node twin for Weather You Can Make. Zero-dep. Run: `node weather-you-can-make/core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the FOUR claims the cloud bench stakes its name on, INDEPENDENTLY of the
// page's in-page pill — running the core's own self-test, then re-deriving each
// claim a SECOND way (hand-rolled, never calling the same helper), then byte-parity-
// checking the slab the page inlines === core.mjs.
//
//   CLAIM 1 ESPY IDENTITY — lcl_m(T,Td) === 125·(T−Td) m to <1e-9 over a (T,spread)
//           sweep. Independently re-derive 125 as 1000/(9.8−1.8) and re-derive the
//           base by hand as the crossing of two straight lines (NOT via lcl_m).
//   CLAIM 2 NEG-CONTROL (a) FOG — T === Td ⇒ lcl_km === 0 AND lcl_m === 0, bit-exact
//           zero, swept; re-derived as (T−T)/SPREAD_LAPSE = 0.
//   CLAIM 3 NEG-CONTROL (b) BUOYANCY GATE — rises(Tp,Tenv)===false whenever Tp≤Tenv
//           (equal OR cooler), ===true only when strictly warmer. Exact booleans,
//           re-derived as the hand-rolled comparison Tp>Tenv.
//   CLAIM 4 MONOTONICITY — spread1<spread2 ⇒ lcl_m(T,T−spread1) < lcl_m(T,T−spread2)
//           STRICTLY (and the inverse, moister ⇒ lower base), swept.
//   HONESTY CRUX (MANDATORY) — the design's premise that 9.8−1.8 = 8.000000000000002
//           is FALSE in V8: 9.8−1.8 IS bit-exact 8 and 1000/8 IS bit-exact 125 (verified
//           below). So the honest crux is NOT a float wobble — it is that this 125 is the
//           MODEL's chosen number (the gap of two lapse rates we picked), recoverable two
//           independent ways, NOT a measured law of the atmosphere. The test asserts the
//           bit-exactness AND that the constant is definitional, never an empirical fit.
//   DOMAIN GUARDS — Td>T (super-saturated) / non-finite inputs → NaN.
//   BYTE-TWIN PARITY — the CORE region inlined in index.html is byte-identical
//           (indentation-normalized) to core.mjs's CORE region.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GAMMA_DRY, GAMMA_DEW, SPREAD_LAPSE, ESPY_M_PER_C, ZTOP_M,
  parcelT, parcelTd, lcl_km, lcl_m, meetingHeight_km, rises, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ok   ' + name + (info ? '  [' + info + ']' : '')); }
  else { fail++; fails.push(name); console.log('  FAIL ' + name + (info ? '  [' + info + ']' : '')); }
}

// ── a HAND-ROLLED base height: the crossing of two straight lines, found WITHOUT
//    calling lcl_km. Lift a parcel; its temperature is T − 9.8·z, its dew point is
//    Td − 1.8·z. Find z where they are equal by stepping until the gap flips sign,
//    then refine — a genuinely independent root-find of the SAME geometry. Returns
//    metres. (For the exact-line case the closed form is trivial, but we deliberately
//    root-find so the test does not just restate the core's algebra.)
function handBaseMetres(T, Td) {
  if (Td > T) return NaN;
  // gap(z) = (T − 9.8z) − (Td − 1.8z) = (T−Td) − 8.000…·z, strictly decreasing in z,
  // zero at the base. Bisect on [0, zHi] where zHi over-covers any reasonable spread.
  const gap = (z) => (T - GAMMA_DRY * z) - (Td - GAMMA_DEW * z);
  if (gap(0) === 0) return 0;                    // T===Td: meet at the ground
  let lo = 0, hi = 50;                           // 50 km over-covers (max spread here ~45)
  // expand hi until gap(hi) <= 0 (it will, gap is linear decreasing)
  while (gap(hi) > 0) hi *= 2;
  for (let i = 0; i < 200; i++) {                // 200 bisections → far past double precision
    const mid = (lo + hi) / 2;
    if (gap(mid) > 0) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * 1000;                 // km → m
}

console.log('Weather You Can Make — core.test.mjs\n');

// ── (a) the core's own self-test is all-green ──
console.log('· core self-test (the same legs the in-page pill runs):');
const st = runSelfTest();
for (const c of st.checks) ck('selftest · ' + c.name, c.pass, c.info);

// ── CLAIM 1 · ESPY IDENTITY — lcl_m === 125·(T−Td), and === hand-rolled crossing ──
console.log('\n· CLAIM 1 — the Espy identity (base = 125 m per °C of spread):');
{
  let worst125 = 0, worstHand = 0;
  for (let T = -5; T <= 40; T += 2.5) {
    for (let spread = 0; spread <= 40; spread += 1) {
      const Td = T - spread;
      worst125 = Math.max(worst125, Math.abs(lcl_m(T, Td) - 125 * (T - Td)));
      worstHand = Math.max(worstHand, Math.abs(lcl_m(T, Td) - handBaseMetres(T, Td)));
    }
  }
  ck('lcl_m(T,Td) === 125·(T−Td) m to <1e-9 over a (T,spread) sweep', worst125 < 1e-9,
     'worst |Δ| ' + worst125.toExponential(2));
  // re-derive 125 independently as 1000 / (Γd − Γdew)
  const hand125 = 1000 / (9.8 - 1.8);
  ck('ESPY_M_PER_C === 1000/(9.8−1.8) (the 125 is the model’s definition, re-derived)',
     Math.abs(ESPY_M_PER_C - hand125) < 1e-12, 'ESPY_M_PER_C ' + ESPY_M_PER_C.toFixed(12) + ' vs ' + hand125.toFixed(12));
  // and the closed-form base equals an INDEPENDENT root-find of the two-line crossing
  ck('lcl_m === a hand-rolled bisection of the two-trace crossing (independent root-find)',
     worstHand < 1e-6, 'worst |Δ| ' + worstHand.toExponential(2) + ' m');
  // the two traces really do MEET at the base: parcelT(zLCL) === parcelTd(zLCL)
  let crossWorst = 0;
  for (let T = 0; T <= 35; T += 5) for (let s = 1; s <= 20; s += 1) {
    const Td = T - s, z = lcl_km(T, Td);
    crossWorst = Math.max(crossWorst, Math.abs(parcelT(T, z) - parcelTd(Td, z)));
  }
  ck('the two traces parcelT, parcelTd are EQUAL at z = lcl_km (the base IS the crossing)',
     crossWorst < 1e-12, 'worst |T−Td| at base ' + crossWorst.toExponential(2) + ' °C');
}

// ── CLAIM 2 · NEG-CONTROL (a) FOG — T===Td ⇒ base bit-exact zero ──
console.log('\n· CLAIM 2 — neg-control (a): saturated air makes fog on the ground (base ≡ 0):');
{
  let ok = true, viol = '';
  for (let T = -5; T <= 40; T += 0.5) {
    // re-derive: (T−T)/SPREAD_LAPSE is 0 exactly; assert the core agrees, bit-for-bit
    const hand = (T - T) / SPREAD_LAPSE;
    if (lcl_km(T, T) !== 0 || lcl_m(T, T) !== 0 || hand !== 0) { ok = false; viol = 'T=' + T; break; }
  }
  ck('T === Td ⇒ lcl_km === 0 AND lcl_m === 0 (bit-exact zero), and (T−T)/SPREAD_LAPSE === 0',
     ok, ok ? 'bit-zero at every swept T' : 'NON-ZERO at ' + viol);
  ck('meetingHeight_km is the SAME alias as lcl_km at saturation (0 km)',
     meetingHeight_km(20, 20) === lcl_km(20, 20) && meetingHeight_km(20, 20) === 0);
}

// ── CLAIM 3 · NEG-CONTROL (b) BUOYANCY GATE — exact booleans ──
console.log('\n· CLAIM 3 — neg-control (b): an unbuoyant parcel never rises (no cloud):');
{
  let ok = true, viol = '';
  for (let env = -20; env <= 35; env += 1.25) {
    for (let d = -6; d <= 6; d += 0.25) {
      const tp = env + d;
      const hand = tp > env;                  // the hand-rolled gate
      const expected = d > 0;
      if (rises(tp, env) !== expected || hand !== expected) { ok = false; viol = 'Tp=' + tp + ' Tenv=' + env; break; }
    }
    if (!ok) break;
  }
  ck('rises(Tp,Tenv) === (Tp>Tenv) exactly: false when equal OR cooler, true only when strictly warmer',
     ok, ok ? 'exact booleans over the sweep' : 'MISMATCH at ' + viol);
  ck('the EQUAL case is FALSE (equal is not "warmer than") — rises(15,15) === false',
     rises(15, 15) === false && rises(15.0001, 15) === true);
  ck('non-finite buoyancy inputs ⇒ false (never silent true)',
     rises(NaN, 10) === false && rises(10, Infinity) === false);
}

// ── CLAIM 4 · MONOTONICITY — wider spread ⇒ strictly higher base ──
console.log('\n· CLAIM 4 — drying the air STRICTLY raises the base; dampening lowers it:');
{
  let ok = true, viol = '', minStep = Infinity;
  for (let T = -5; T <= 40; T += 5) {
    let prev = -Infinity;
    for (let spread = 0; spread <= 40; spread += 0.25) {
      const z = lcl_m(T, T - spread);
      if (spread > 0) { const step = z - prev; if (!(step > 0)) { ok = false; viol = 'T=' + T + ' spread=' + spread; } minStep = Math.min(minStep, step); }
      prev = z;
    }
    if (!ok) break;
  }
  ck('spread1 < spread2 ⇒ lcl_m(T,T−spread1) < lcl_m(T,T−spread2) STRICTLY (swept)',
     ok, ok ? 'smallest step ' + (isFinite(minStep) ? minStep.toFixed(4) + ' m' : 'n/a') : 'NOT strict at ' + viol);
  // the inverse phrasing: at fixed T, a HIGHER dew point (moister) gives a LOWER base
  let invOk = true;
  for (let T = 0; T <= 35; T += 5) {
    if (!(lcl_m(T, T - 2) < lcl_m(T, T - 8))) invOk = false;     // moister (Td=T−2) lower than drier (Td=T−8)
  }
  ck('moister air (higher Td) ⇒ a LOWER cloud base (the inverse statement)', invOk);
}

// ── HONESTY CRUX — the 125 is DEFINITIONAL, bit-exact here, NOT an empirical fit ──
console.log('\n· HONESTY CRUX — the truth in V8: 9.8 − 1.8 IS bit-exact 8; the 125 is the model’s, not nature’s:');
{
  // FIRST: refute the design's premise empirically, in the open.
  ck('9.8 − 1.8 === 8 BIT-EXACTLY in V8 (the "8.000000000000002" premise is false here)',
     (9.8 - 1.8) === 8 && SPREAD_LAPSE === 8, 'SPREAD_LAPSE = ' + SPREAD_LAPSE);
  ck('1000 / 8 === 125 bit-exactly ⇒ ESPY_M_PER_C === 125', (1000 / 8) === 125 && ESPY_M_PER_C === 125,
     'ESPY_M_PER_C = ' + ESPY_M_PER_C);
  // the REAL honesty point: 125 is the model's chosen number, recoverable two independent
  // ways from the two lapse rates — definitional, NOT a constant measured from the sky.
  const fromConst = 1000 / SPREAD_LAPSE;
  const fromRates = 1000 / (GAMMA_DRY - GAMMA_DEW);
  ck('125 is DEFINITIONAL: recovered as 1000/SPREAD_LAPSE AND 1000/(Γd−Γdew), both === 125 (a chosen-model number)',
     fromConst === 125 && fromRates === 125 && fromConst === fromRates,
     '1000/SPREAD_LAPSE = ' + fromConst + ', 1000/(Γd−Γdew) = ' + fromRates);
  // and changing the chosen rates changes the "125" — proving it is NOT a universal constant
  const altRates = 1000 / (9.8 - 2.0);          // a different (hypothetical) dew lapse → ≠ 125
  ck('the constant DEPENDS on the chosen rates (Γdew=2.0 ⇒ ' + altRates.toFixed(3) + ' m/°C ≠ 125) — not a law of the air',
     Math.abs(altRates - 125) > 1, 'alt = ' + altRates.toFixed(3) + ' m/°C');
}

// ── DOMAIN GUARDS — out-of-scope inputs return NaN, never silent garbage ──
console.log('\n· DOMAIN GUARDS — Td>T / non-finite → NaN:');
ck('lcl_km(T, Td>T) → NaN (dew point cannot exceed temperature)', Number.isNaN(lcl_km(10, 12)));
ck('lcl_m(T, Td>T) → NaN', Number.isNaN(lcl_m(10, 12)));
ck('lcl_km(NaN, 5) → NaN', Number.isNaN(lcl_km(NaN, 5)));
ck('lcl_km(20, Infinity) → NaN', Number.isNaN(lcl_km(20, Infinity)));
ck('lcl_km at exactly Td===T is 0, not NaN (the boundary is fog, not invalid)', lcl_km(20, 20) === 0);

// ── ZTOP sanity — the ceiling is the one the render shares ──
console.log('\n· CEILING — ZTOP_M is the shared column ceiling:');
ck('ZTOP_M === 4000 m (owned by the core so render + tick-rail + "above-ceiling" agree)', ZTOP_M === 4000);
// the dry-desert preset (T=35, Td=2 ⇒ spread 33) lands at/above the ceiling (clear sky reachable)
ck('a dry parcel (spread 33 °C) puts the base AT/ABOVE the ceiling (no-cloud reachable)',
   lcl_m(35, 2) >= ZTOP_M, 'base = ' + lcl_m(35, 2).toFixed(0) + ' m ≥ ' + ZTOP_M);

// ── BYTE-TWIN PARITY — index.html's inlined core === core.mjs CORE region ──
console.log('\n· BYTE-TWIN PARITY — the page inlines core.mjs byte-identically:');
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
let pageSrc = '';
try { pageSrc = readFileSync(join(here, 'index.html'), 'utf8'); } catch (e) { /* forged later */ }
const BEGIN = '/* CORE BEGIN';
const END = '/* CORE END */';
function region(text) {
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i, j + END.length);
}
function norm(s) {
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = pageSrc ? region(pageSrc) : null;
ck('CORE sentinels present in core.mjs', !!coreRegion);
if (pageSrc) {
  ck('CORE sentinels present in index.html', !!pageRegion);
  ck('index.html inlined core === core.mjs CORE region (indentation-normalized)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion && coreRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED');
} else {
  console.log('  ..   index.html not forged yet — skipping page byte-parity (run forge, then re-test)');
}

// ── report ──
console.log('\n' + (fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
console.log('  The cloud base is a SPREAD read as a HEIGHT: 125 m of climb per °C the dew point trails the temperature. Bring them together and it falls to the ground as fog.');
if (fail) { console.log('\n  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
