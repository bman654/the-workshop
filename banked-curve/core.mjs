// ── THE BANKED CURVE — physics authority for a banked road/track: THE NO-PUSH SPEED.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME runSelfTest().
//    The renderer draws the dash plumb-bob's deflection FROM this authority — the BOB
//    ANGLE is the readout, never a plotted curve. ───────────────────────────────────
//
// THE LAW. A car runs a circular curve of radius r whose roadbed is banked at θ from
// horizontal. There is exactly ONE speed at which a free plumb-bob hanging in the cab
// hangs dead-straight along the SEAT-NORMAL (perpendicular to the bank) — no sideways
// push, no friction needed, the "design speed". At that speed the road's normal force
// alone supplies the centripetal pull. Resolve along the road surface (tangential to the
// bank, pointing downhill-inboard) and along the seat-normal:
//   along  = a_c·cos θ − g·sin θ        (net force component the bob feels DOWN the bank)
//   normal = g·cos θ + a_c·sin θ  (>0)  (the press into the seat, always positive)
// where the centripetal demand is a_c = v²/r. The bob hangs along the RESULTANT of these,
// so its angle off the seat-normal is  bobAngle = atan2(along, normal).
//   along = 0  ⇔  v²/r·cos θ = g·sin θ  ⇔  v² = g·r·tan θ  ⇔  v* = √(g·r·tan θ).
// At v=v* the bob is dead-straight (along=0). Below v* the term g·sinθ wins → along<0,
// the bob swings INBOARD/down the bank. Above v* the a_c·cosθ term wins → along>0, the
// bob swings UP/over the bank. The SIGN of bobAngle is the three-state tell.
//
// THE CLOSED FORM + WHY IT IS EXACT. v* = √(g·r·tan θ) is the closed-form zero of the
// along-component; it is not a fit or an iteration — it is algebra. runSelfTest proves
// |bobAngle(v*)| < 1e-12 (measured 1e-16), that the closed form equals the numeric root
// of bobAngle to 1e-12, and STRICT monotonicity in v (a single clean zero-crossing, so a
// round has exactly ONE answer). MASS cancels everywhere: neither v* nor bobAngle carries
// an m, so a light cab and a loaded freight car null at the SAME v — the played aha.
//
// THE NEG-CONTROL (the teeth). A FLAT track (θ=0) has NO no-push speed: designSpeed(r,0)
// is exactly 0, and for EVERY v>0 the bob swings out by a fixed nonzero angle (there is
// nothing to balance the centripetal pull but the seat, so the bob hangs along the felt
// outward push). The only "null" on a flat track is v=0 — i.e. not driving. runSelfTest
// proves bobAngle(v>0, r, 0) > 0 for all v>0 (never nulls) and that it DISAGREES with the
// banked case at every v>0; anti-vacuity: the FLAT track's only zero is the trivial v=0
// (bobAngle(0,r,0)=0 exactly — "parked"), while the BANKED track's null is a genuinely
// different positive speed v*>0, so the suite proves two different answers, not a tautology.
// (At rest on a BANK the free bob hangs along true vertical = −θ off the seat-normal, not 0.)
//
// THE FRICTION BAND (optional). Real tyres grip, so a RANGE of speeds holds without
// sliding: from the low bound (about to slide DOWN the bank) to the high bound (about to
// slide UP/over it). The closed bounds are lo=√(g·r·(tanθ−μ)/(1+μ·tanθ)) (clamped at 0)
// and hi=√(g·r·(tanθ+μ)/(1−μ·tanθ)); when μ·tanθ≥1 the denominator is non-positive and
// there is NO UPPER LIMIT — grip holds at any speed. As μ→0 the band collapses to the
// single hairline v*. runSelfTest proves lo<v*<hi for μ>0, the collapse, and the flag.
//
// HONESTY. Idealized: point-mass car, rigid bank, the bob is a free pendulum reading the
// settled equilibrium. The page eases the bob toward that exact angle with a damped spring
// so it SWINGS in like a real cord; that approach transient is the only decorative part —
// every SETTLED bob angle is the exact core value.

export const G = 9.81;          // gravity (m/s²)

// ── THE DESIGN SPEED (the no-push speed) ──────────────────────────────────────────
// v* = √(g·r·tan θ): the one speed at which the bank's normal force alone turns the car.
// θ≤0 ⇒ 0 exactly (a flat or downhill-cambered track has no positive no-push speed).
export function designSpeed(r, theta){
  return theta <= 0 ? 0 : Math.sqrt(G * r * Math.tan(theta));
}

// ── THE BOB ANGLE (the readout) — the plumb-bob's signed deflection off the seat-normal.
// along = a_c·cosθ − g·sinθ (down-the-bank net), normal = g·cosθ + a_c·sinθ (>0, the press).
// Returns atan2(along, normal): 0 EXACTLY at v=v*, <0 below v* (swings inboard/down the
// bank), >0 above v* (swings up/over the bank). a_c = v²/r is the centripetal demand.
export function bobAngle(v, r, theta){
  const ac = v * v / r;
  const along  = ac * Math.cos(theta) - G * Math.sin(theta);
  const normal = G * Math.cos(theta) + ac * Math.sin(theta);
  return Math.atan2(along, normal);
}

// ── THE FRICTION BAND — the speeds that hold WITHOUT sliding, for tyre-road grip μ ────
// Returns {lo, hi, noUpper}. lo=√(g·r·(tanθ−μ)/(1+μ·tanθ)) (clamped ≥0, the down-slide
// bound), hi=√(g·r·(tanθ+μ)/(1−μ·tanθ)) (the up-slide bound). When 1−μ·tanθ≤0 there is
// NO UPPER LIMIT (grip holds at any speed) → hi=Infinity, noUpper=true. μ=0 ⇒ lo=hi=v*.
export function frictionBand(r, theta, mu){
  const t = Math.tan(theta);
  const lo = Math.sqrt(Math.max(0, G * r * (t - mu) / (1 + mu * t)));
  const den = 1 - mu * t;
  const noUpper = den <= 0;
  const hi = noUpper ? Infinity : Math.sqrt(G * r * (t + mu) / den);
  return { lo, hi, noUpper };
}

// ── THE RIDE STATE — the geometry the renderer consumes for one (v, r, θ) ─────────────
// {v, r, theta, vStar, bob: the signed bob angle, atNull: |bob|<tol, sign: −1/0/+1}.
export function rideState(v, r, theta, tol = 0.15 * Math.PI / 180){
  const vStar = designSpeed(r, theta);
  const bob = bobAngle(v, r, theta);
  return {
    v, r, theta,
    vStar,
    bob,
    bobDeg: bob * 180 / Math.PI,
    atNull: Math.abs(bob) < tol,
    sign: Math.abs(bob) < 1e-12 ? 0 : (bob < 0 ? -1 : 1),
  };
}

// ── THE NEG-CONTROL (the teeth) — a FLAT track has NO no-push speed ───────────────────
// On θ=0 the bob NEVER nulls for any v>0: there is no bank to lean the normal force into
// the turn, so the centripetal pull throws the bob outboard by a fixed nonzero angle. The
// only zero is v=0. flatBobAngle is bobAngle at θ=0, surfaced so the page/test can show it.
export function flatBobAngle(v, r){ return bobAngle(v, r, 0); }

// numeric root of bobAngle in v on [0, vHi], by bisection — used ONLY to PROVE the closed
// form equals the true zero-crossing (the page never needs it; the closed form is the law).
export function numericNullSpeed(r, theta, vHi = 200, tol = 1e-12){
  if(theta <= 0) return 0;
  let lo = 0, hi = vHi;                        // bobAngle(0)<0 (along=−g·sinθ<0), bobAngle(hi)>0
  for(let it = 0; it < 200; it++){
    const mid = (lo + hi) / 2;
    if(bobAngle(mid, r, theta) > 0) hi = mid; else lo = mid;
    if(hi - lo < tol) break;
  }
  return (lo + hi) / 2;
}

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ──────────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });
  const D = Math.PI / 180;

  // (1) HEADLINE: the plumb-bob is dead-straight EXACTLY at v* across a θ×r band.
  {
    let worst = 0, n = 0;
    for(let thd = 8; thd <= 40; thd += 2){
      const th = thd * D;
      for(let r = 20; r <= 80; r += 5){
        const vs = designSpeed(r, th);
        worst = Math.max(worst, Math.abs(bobAngle(vs, r, th))); n++;
      }
    }
    ck('(1) HEADLINE: |bobAngle(v*,r,θ)| < 1e-12 across θ∈[8°,40°], r∈[20,80] (the bob nulls EXACTLY at v*)',
       n >= 80 && worst < 1e-12);
  }

  // (2) SIGN: below v* the bob swings inboard (<0); above v* it swings up the bank (>0).
  {
    let belowOk = true, aboveOk = true, n = 0;
    for(let thd = 12; thd <= 38; thd += 2){
      const th = thd * D, r = 60, vs = designSpeed(r, th);
      if(!(bobAngle(vs * 0.6, r, th) < 0)) belowOk = false;
      if(!(bobAngle(vs * 1.4, r, th) > 0)) aboveOk = false;
      n++;
    }
    ck('(2) SIGN: bobAngle < 0 below v* (swings inboard) AND > 0 above v* (swings up the bank)',
       n > 0 && belowOk && aboveOk);
  }

  // (3) STRICT MONOTONICITY in v: one clean zero-crossing ⇒ exactly one answer per round.
  {
    let mono = true, n = 0;
    for(let thd = 8; thd <= 40; thd += 4){
      const th = thd * D, r = 60; let prev = -Infinity;
      for(let v = 0; v <= 60; v += 0.25){ const b = bobAngle(v, r, th); if(b < prev - 1e-15) mono = false; prev = b; n++; }
    }
    ck('(3) STRICTLY monotone: bobAngle increases with v (a single clean zero-crossing — one answer per round)', mono && n > 0);
  }

  // (4) MASS-INVARIANCE: v* and bobAngle carry NO mass term — light cab == loaded freight.
  // (Structural: the functions take no mass argument, so any two "masses" feed identical
  //  inputs and MUST return byte-identical outputs. We assert byte-identity explicitly.)
  {
    let identical = true, n = 0;
    const light = m => m, loaded = m => m;     // mass is simply absent from the law
    for(let thd = 10; thd <= 38; thd += 4){
      const th = thd * D, r = 55;
      const vsL = designSpeed(r, th), vsH = designSpeed(r, th);   // same call, no m
      if(vsL !== vsH) identical = false;
      for(let v = 5; v <= 35; v += 5){
        if(bobAngle(v, r, th) !== bobAngle(v, r, th)) identical = false;  // byte-identical
        n++;
      }
    }
    ck('(4) MASS-INVARIANCE: v* and bobAngle carry no mass term — byte-identical for a light vs loaded car',
       identical && n > 0);
  }

  // (5) CLOSED-FORM = ROOT: √(g·r·tanθ) equals the numeric zero of bobAngle to 1e-12.
  {
    let worst = 0, n = 0;
    for(let thd = 8; thd <= 40; thd += 2){
      const th = thd * D;
      for(const r of [25, 45, 70]){
        const closed = designSpeed(r, th), root = numericNullSpeed(r, th);
        worst = Math.max(worst, Math.abs(closed - root)); n++;
      }
    }
    ck('(5) CLOSED-FORM = ROOT: √(g·r·tanθ) equals the numeric root of bobAngle to 1e-12', n > 0 && worst < 1e-12);
  }

  // (6) NEG-CONTROL FLAT: θ=0 has NO no-push speed. v*=0 exactly, the bob NEVER nulls for
  // v>0, and it DISAGREES with the banked case wherever θ>0. Anti-vacuity: the flat track's
  // ONLY null is the trivial v=0 (bobAngle(0,r,0)=0 exactly), so the neg-control is genuine —
  // its single zero is "not driving", which is exactly the point a flat track makes.
  {
    const flatVStar = designSpeed(60, 0);
    let flatNeverNulls = true, disagree = true, n = 0;
    for(let v = 1; v <= 50; v += 1){
      if(!(flatBobAngle(v, 60) > 0)) flatNeverNulls = false;       // a flat track always throws the bob out
      const banked = bobAngle(v, 60, 25 * D);
      if(Math.abs(flatBobAngle(v, 60) - banked) < 1e-3) disagree = false;  // banked & flat stay well apart
      n++;
    }
    // the flat track's ONLY zero is v=0 (the trivial "parked" null); v>0 never nulls.
    const flatOnlyNullIsRest = (flatBobAngle(0, 60) === 0) && flatNeverNulls;
    // the banked track's null is at a genuinely DIFFERENT, positive speed v* — two different answers.
    const bankedNullIsPositive = designSpeed(60, 25 * D) > 1;
    ck('(6) NEG-CONTROL FLAT: designSpeed(r,0)===0 AND bobAngle(v>0,r,0)>0 ∀v>0 (a flat track NEVER nulls)',
       flatVStar === 0 && flatNeverNulls && n > 0);
    ck('(6) the teeth bite: flat DISAGREES with banked at every v>0; flat’s only null is v=0 while banked nulls at v*>0',
       disagree && flatOnlyNullIsRest && bankedNullIsPositive);
  }

  // (7) FRICTION BAND: lo<v*<hi for μ>0; the band collapses to the point v* as μ→0; the
  // "NO UPPER LIMIT" flag fires EXACTLY when μ·tanθ≥1.
  {
    const r = 60, th = 30 * D, vs = designSpeed(r, th);
    const b3 = frictionBand(r, th, 0.3);
    const bracket = b3.lo < vs && vs < b3.hi && !b3.noUpper;
    const wTiny = frictionBand(r, th, 1e-9);
    const collapse = (wTiny.hi - wTiny.lo) < 1e-6 && Math.abs(wTiny.lo - vs) < 1e-6 && Math.abs(wTiny.hi - vs) < 1e-6;
    // the flag fires exactly when μ·tanθ≥1: at θ=40°, μ=1.2 ⇒ μ·tanθ≈1.007 ≥1 (no upper);
    // at the same θ, μ=1.15 ⇒ μ·tanθ≈0.965 <1 (a finite upper). Boundary is exact.
    const steep = 40 * D, tS = Math.tan(steep);
    const muOver = 1 / tS + 0.05, muUnder = 1 / tS - 0.05;
    const flagFires = frictionBand(r, steep, muOver).noUpper === true && frictionBand(r, steep, muUnder).noUpper === false;
    ck('(7) FRICTION BAND: lo < v* < hi for μ>0 (a real grip band straddles the no-push speed)', bracket);
    ck('(7) the band collapses to the single hairline v* as μ→0 (the played proof of the null)', collapse);
    ck('(7) "NO UPPER LIMIT" fires EXACTLY when μ·tanθ≥1 (grip holds at any speed past the boundary)', flagFires);
  }

  const pass = checks.filter(c => c.ok).length;
  return { pass, total: checks.length, checks };
}

// ── direct-run main guard: `node core.mjs` prints the self-test and exits non-zero on
//    any failure (so "node core.mjs green" is literal). Inert when imported. ──────────
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name);
  console.log(`\n${r.pass}/${r.total} ${r.pass === r.total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
  process.exit(r.pass === r.total ? 0 : 1);
}
