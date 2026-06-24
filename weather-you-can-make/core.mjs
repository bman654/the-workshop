// ============================================================================
//  WEATHER YOU CAN MAKE — the cloud bench's ONE DOM-free physics authority.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This is the
//  proof behind a bench you operate: two dials — surface TEMPERATURE and surface
//  DEW POINT — and the air column above them. Turn the dials and a flat-bottomed
//  cumulus cloud SNAPS into being and rides its base up or down, LIVE. The cloud
//  is the readout; there is no skew-T graph. Dry the air and the base climbs;
//  dampen it and the base sinks; bring the two dials together and the base drops
//  to the ground as fog. This core makes the numbers the cloud is drawn from.
//
//  THE ONE IDEA — THE CLOUD BASE IS A SPREAD, READ AS A HEIGHT. A surface parcel
//  of air, lifted, cools at the DRY adiabatic rate (≈9.8 °C/km). Its dew point —
//  the temperature at which its moisture would condense — falls more slowly as it
//  rises (≈1.8 °C/km), because lifting only gently dilutes the moisture. The two
//  traces converge; where the parcel's temperature first equals its dew point, the
//  moisture condenses and a cloud forms. That meeting height is the Lifting
//  Condensation Level (LCL) — the cloud's flat base. Because both traces are
//  straight lines, the height is exactly the surface spread (T − Td) divided by
//  the difference of the two lapse rates: z_LCL = (T − Td)/(Γd − Γdew).
//
//  THE HONEST MODEL — THIS IS THE LINEAR-LAPSE (ESPY) LAW, NOT BOLTON. Real moist
//  air bends those two rates a little; the textbook Bolton/Espy approximations fit
//  that bend. We do NOT. We adopt the clean STRAIGHT-LINE model — dew point falls
//  linearly at 1.8 °C/km, temperature at 9.8 °C/km — and prove THAT exactly,
//  rather than a fitted number we can't stand behind. Under this model the famous
//  "125 metres per °C of spread" is DEFINITIONAL, not empirical: 1000 ÷ (9.8−1.8)
//  = 1000 ÷ 8 = 125 m per °C, by construction. Every claim below is exact FOR THIS
//  MODEL; none claims to be the last word on a real sounding.
//
//  HONESTY CRUX (the honest source of the "125", surfaced on purpose): in IEEE754
//  on V8, 9.8 − 1.8 IS the bit-exact float 8, and 1000/8 IS bit-exact 125, so the
//  base really is 125·(T−Td) to the bit. But that exactness is the MODEL's, not
//  nature's: 125 m/°C is DEFINITIONAL — it falls out of the two lapse rates we
//  CHOSE (9.8 and 1.8), not out of a fit to real soundings, which bend. So the twin
//  proves the identity bit-for-bit AND forbids any claim that the "8" or "125" is an
//  empirically measured constant. Honest exactness about a chosen model — never a
//  fitted number dressed up as a law of the atmosphere.
//
//  ONE LAW, ONE FUNCTION. lcl_km(T,Td) is the SOLE derivation of the base height;
//  the dials, the readouts, and the self-test all consume that one value. The two
//  converging traces the sky draws are parcelT() and parcelTd() — the same lines
//  whose crossing IS lcl_km, so the picture and the proof are the same numbers.
// ============================================================================

/* CORE BEGIN */
"use strict";

// ── THE MODEL CONSTANTS — the linear-lapse (Espy) law, stated honestly ──────────
// Γd: a dry-lifted parcel cools at 9.8 °C per km (the dry adiabatic lapse rate).
// Γdew: its dew point falls at 1.8 °C per km (the dew-point lapse rate). These are
// the SHIPPED model — clean straight lines, not a fitted Bolton curve. The base
// height follows by pure geometry from these two numbers and nothing else.
const GAMMA_DRY = 9.8;                       // °C / km — temperature lapse of a lifted parcel
const GAMMA_DEW = 1.8;                       // °C / km — dew-point lapse of a lifted parcel
// The convergence rate of the two traces. In IEEE754 on V8, 9.8 − 1.8 IS bit-exact 8,
// so SPREAD_LAPSE === 8 to the bit. The honesty point is NOT a float wobble — it is
// that this 8 is a CHOSEN model constant (the gap of two lapse rates we picked), not
// a measured law of the air. (The twin asserts SPREAD_LAPSE === 8 AND forbids calling
// it an empirical fact.)
const SPREAD_LAPSE = GAMMA_DRY - GAMMA_DEW;  // °C / km — exactly 8 under this model
// The metres-per-degree-of-spread: 1000 / (Γd − Γdew) = 125, bit-exact here.
// DEFINITIONAL under this linear model — it is what the two chosen lapse rates imply,
// not an empirical fit. lcl_m(T,Td) ≡ ESPY_M_PER_C · (T − Td) by algebra.
const ESPY_M_PER_C = 1000 / SPREAD_LAPSE;    // m / °C of spread — exactly 125 here
// The drawn column ceiling, in metres. OWNED HERE so the render's tick-rail, the
// y(z) map, and the "clear sky above the ceiling" case all agree on one number. A
// base computed above this reads as "no cloud — too dry"; the dry-desert preset is
// tuned to land at/above it so "no cloud" is a reachable, visible state.
const ZTOP_M = 4000;                         // m — the height of the drawn air column

// ── THE TWO CONVERGING TRACES — the lines the sky literally draws ───────────────
// A surface parcel lifted to height z (in KILOMETRES): its temperature falls along
// the dry adiabat; its dew point falls along the gentler dew-point lapse. Where
// they MEET is the cloud base. These are the two traces the canvas samples.
function parcelT(T, z) { return T - GAMMA_DRY * z; }     // °C at height z (km)
function parcelTd(Td, z) { return Td - GAMMA_DEW * z; }  // °C at height z (km)

// ── THE CLOUD BASE — the lifting condensation level, in kilometres ──────────────
// The height where parcelT(T,z) === parcelTd(Td,z): solving T − Γd·z = Td − Γdew·z
// gives z = (T − Td)/(Γd − Γdew). This is the SOLE derivation of the base; nothing
// else restates the slope. Guards: a dew point ABOVE the temperature is unphysical
// (the air would be super-saturated at the surface) ⇒ NaN; non-finite inputs ⇒ NaN.
// At T === Td the spread is zero ⇒ z === 0 exactly: fog on the ground.
function lcl_km(T, Td) {
  if (!Number.isFinite(T) || !Number.isFinite(Td)) return NaN;
  if (Td > T) return NaN;                     // unphysical: dew point can't exceed temperature
  return (T - Td) / SPREAD_LAPSE;             // ≥ 0; === 0 iff T === Td
}
// The same base in metres. Equals ESPY_M_PER_C·(T−Td) by construction (the Espy
// identity the twin proves to machine ε across a sweep).
function lcl_m(T, Td) { return 1000 * lcl_km(T, Td); }

// A named alias for the visual: the height at which the two traces converge IS the
// LCL. The renderer asks for the "meeting height"; it gets the cloud base.
function meetingHeight_km(T, Td) { return lcl_km(T, Td); }

// ── THE BUOYANCY GATE — does a lifted parcel actually rise? ──────────────────────
// A parcel only keeps rising while it is WARMER than the air around it (positively
// buoyant). rises() is the exact boolean gate: STRICTLY warmer, both finite. Equal
// OR cooler ⇒ no lift ⇒ the parcel sinks back and no cloud forms (neg-control b).
// This is unconditional: the page surfaces it via a "capped (inversion)" context
// where the lifted surface parcel is not warmer than its surroundings.
function rises(Tparcel, Tenv) {
  return Number.isFinite(Tparcel) && Number.isFinite(Tenv) && Tparcel > Tenv;
}

// ── THE SELF-TEST — the bench proves its own claims ─────────────────────────────
// FOUR claims (matching the why-sky / two-bulges shape):
//  1 · ESPY IDENTITY — lcl_m(T,Td) === 125·(T−Td) to <1e-9 across a (T,spread) sweep,
//      and ESPY_M_PER_C === 1000/(9.8−1.8) (the 125 is the model's definition).
//  2 · NEG-CONTROL (a) FOG ON THE GROUND — T === Td ⇒ lcl_km === 0 AND lcl_m === 0,
//      bit-exact zero, swept over many T.
//  3 · NEG-CONTROL (b) BUOYANCY GATE — rises(Tp,Tenv) is false whenever Tp ≤ Tenv
//      (equal or cooler), true only when strictly warmer. Exact booleans, no tolerance.
//  4 · MONOTONICITY — a wider spread STRICTLY raises the base (and a moister parcel,
//      smaller spread, STRICTLY lowers it), swept.
//  + HONESTY CRUX — SPREAD_LAPSE === 8 and ESPY_M_PER_C === 125 BIT-EXACTLY here, yet
//    these are the MODEL's chosen numbers (Γd−Γdew of two rates we picked), not a fit
//    to real air — exact about a model, not a measured atmospheric constant.
function runSelfTest() {
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const TOL = 1e-9;

  // ── CLAIM 1 — ESPY IDENTITY: lcl_m === 125·(T−Td) over a sweep ───────────────
  let espyWorst = 0;
  for (let T = 0; T <= 40; T += 5) {
    for (let spread = 0; spread <= 25; spread += 1) {
      const Td = T - spread;
      espyWorst = Math.max(espyWorst, Math.abs(lcl_m(T, Td) - 125 * (T - Td)));
    }
  }
  const espy125 = Math.abs(ESPY_M_PER_C - 1000 / (9.8 - 1.8));
  const c1 = espyWorst < TOL && espy125 < TOL;
  log('1 · ESPY IDENTITY: lcl_m(T,Td) === 125·(T−Td) m to <1e-9 over a (T,spread) sweep; ESPY_M_PER_C === 1000/(9.8−1.8)',
      c1, 'worst |Δ| ' + espyWorst.toExponential(2) + ', ESPY_M_PER_C ' + ESPY_M_PER_C.toFixed(10) + ' (Δ ' + espy125.toExponential(2) + ')');

  // ── CLAIM 2 — NEG-CONTROL (a): T === Td ⇒ base bit-exact zero (fog) ──────────
  let fogOk = true, fogViol = '';
  for (let T = -5; T <= 40; T += 0.5) {
    if (lcl_km(T, T) !== 0 || lcl_m(T, T) !== 0) { fogOk = false; fogViol = 'T=' + T; break; }
  }
  log('2 · NEG-CONTROL (a) FOG: T === Td ⇒ lcl_km === 0 AND lcl_m === 0 (bit-exact zero), swept over T∈[−5,40]',
      fogOk, fogOk ? 'bit-zero at every T' : 'NON-ZERO at ' + fogViol);

  // ── CLAIM 3 — NEG-CONTROL (b): the buoyancy gate is exact ────────────────────
  let gateOk = true, gateViol = '';
  for (let env = -10; env <= 30; env += 2.5) {
    for (let d = -5; d <= 5; d += 0.5) {
      const tp = env + d;
      const expected = d > 0;                 // strictly warmer ⇒ rises
      if (rises(tp, env) !== expected) { gateOk = false; gateViol = 'Tp=' + tp + ',Tenv=' + env; break; }
    }
    if (!gateOk) break;
  }
  // and the exact-equality case is FALSE (equal is not "warmer than")
  const equalFalse = rises(15, 15) === false;
  const c3 = gateOk && equalFalse;
  log('3 · NEG-CONTROL (b) BUOYANCY GATE: rises(Tp,Tenv)===false when Tp≤Tenv, ===true only when strictly warmer (exact booleans)',
      c3, c3 ? 'exact over the sweep; equal ⇒ false' : ('MISMATCH at ' + gateViol));

  // ── CLAIM 4 — MONOTONICITY: wider spread ⇒ strictly higher base ──────────────
  let monoOk = true, monoViol = '', minStep = Infinity;
  for (let T = 0; T <= 40; T += 10) {
    let prev = -Infinity;
    for (let spread = 0; spread <= 25; spread += 0.5) {
      const z = lcl_m(T, T - spread);
      if (spread > 0) { const step = z - prev; if (!(step > 0)) { monoOk = false; monoViol = 'T=' + T + ',spread=' + spread; } minStep = Math.min(minStep, step); }
      prev = z;
    }
    if (!monoOk) break;
  }
  log('4 · MONOTONICITY: a wider spread STRICTLY raises the base (moister ⇒ strictly lower), swept',
      monoOk, monoOk ? 'smallest step ' + (isFinite(minStep) ? minStep.toFixed(3) + ' m' : 'n/a') : 'NOT strict at ' + monoViol);

  // ── HONESTY CRUX — the "125" is DEFINITIONAL, not an empirical fit ───────────
  // Under this linear model 9.8−1.8 is bit-exact 8 and 1000/8 is bit-exact 125, so the
  // base IS 125·(T−Td) to the bit. The honest point: that exactness is the MODEL's, not
  // nature's — 125 is what the two CHOSEN lapse rates imply, recoverable two ways
  // (1000/SPREAD_LAPSE and 1000/(GAMMA_DRY−GAMMA_DEW)), never a measured constant.
  const eightExact = (SPREAD_LAPSE === 8);
  const espyExact = (ESPY_M_PER_C === 125);
  const recovered = (1000 / (GAMMA_DRY - GAMMA_DEW) === ESPY_M_PER_C);
  const cH = eightExact && espyExact && recovered;
  log('HONESTY CRUX: 125 m/°C is DEFINITIONAL (= 1000/(Γd−Γdew) of two CHOSEN rates), bit-exact here, NOT an empirical fit to real air',
      cH, 'SPREAD_LAPSE ' + SPREAD_LAPSE + ', ESPY_M_PER_C ' + ESPY_M_PER_C + ', recovered from rates: ' + recovered);

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
/* CORE END */

export {
  GAMMA_DRY, GAMMA_DEW, SPREAD_LAPSE, ESPY_M_PER_C, ZTOP_M,
  parcelT, parcelTd, lcl_km, lcl_m, meetingHeight_km, rises,
  runSelfTest,
};
export default {
  GAMMA_DRY, GAMMA_DEW, SPREAD_LAPSE, ESPY_M_PER_C, ZTOP_M,
  parcelT, parcelTd, lcl_km, lcl_m, meetingHeight_km, rises,
  runSelfTest,
};
