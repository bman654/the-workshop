// ============================================================================
//  THE CONSERVATORY · THE POND  —  constant-yield harvest, the harvested logistic.
//
//  THE ONE IDEA.  Take the logistic colony next door — N' = r·N·(1 − N/K), the
//  S-curve that climbs to K and stays — and START PULLING FISH OUT at a constant
//  rate h.  The field bends DOWN by a flat −h:
//
//        N' = r·N·(1 − N/K) − h            (grow toward K, but bleed h forever)
//
//  with the estate's locked logistic parameters  r = 0.6,  K = 100  (INHERITED
//  from conservatory/logistic/core.mjs — never re-declared, so the two can never
//  drift).  Subtracting a constant is the cheapest possible change to the field,
//  and yet it does something violent: it can DESTROY the rest point entirely.
//
//  THE TWO RESTS.  Setting field − h = 0 is the quadratic  r·N² − r·K·N + K·h = 0,
//  whose roots are
//
//        N± = (K/2)·(1 ± √(1 − 4h/(rK))).
//
//  For small h there are TWO: an UPPER stable refuge N₊ (where f' < 0 — perturb the
//  pond and it returns) and a LOWER unstable threshold N₋ (f' > 0 — the tipping
//  count below which the pond cannot recover).  As h rises the two march toward
//  each other; at the CRITICAL harvest
//
//        h_crit = r·K/4 = 15           (= MSY, the maximum sustainable yield)
//
//  the discriminant hits 0, the two rests COLLIDE at N = K/2 = 50, and for any
//  h > h_crit there is NO rest at all (disc < 0, roots annihilated).  This is a
//  SADDLE-NODE (fold) bifurcation: the refuge doesn't shrink, it VANISHES, and the
//  field is negative everywhere — the pond drains to 0 from ANY starting count.
//
//  THE STABILITY is read off the slope of the field at each rest.  Crucially the
//  −h is CONSTANT, so it adds NOTHING to the derivative:  d/dN[field − h] = f'(N).
//  The stability slope is the UNCHANGED logistic slope — a real structural fact, so
//  harvestPrime is the logistic fPrime re-EXPORTED, not rewritten.  At the rests
//  f'(N₊) < 0 (stable) and f'(N₋) > 0 (unstable), equal-and-opposite at the fold.
//
//  THE IRREVERSIBILITY (the moral).  Over-net once and the pond empties; ease the
//  dial back BELOW h_crit and the refuge mathematically EXISTS again (disc > 0,
//  N₊ is back) — but N = 0 is now a TRUE latched fixed point (field(0) − h = −h < 0
//  pins it), and the only basin that 0 sits in is its own.  The dial cannot teleport
//  the fish back; only a restock can.  The latch IS the proof made physical.
//
//  PROOF vs ILLUSTRATION.  What is EXACT here is the bifurcation STRUCTURE: the fold
//  at rK/4, MSY there at N = K/2, the closed-form roots, the eigenvalues, and the
//  irreversible collapse beyond it.  r = 0.6 / K = 100 / h are ILLUSTRATIVE
//  landmarks (a clean teaching pond, inherited so it never drifts from the logistic
//  bench) — NOT a real fishery (no age structure, no stochastic recruitment, no
//  depensation).  The living school the bench draws ILLUSTRATES this proven core;
//  it does not, and the bench must not claim it does, PROVE the continuous fold.
//
//  Everything here is pure: no RNG, no DOM, no network.  A THIN overlay on the
//  imported logistic core — it does NOT re-implement the field, RK4, or the tracer.
// ============================================================================

import {
  P, field, fPrime, closed as logisticClosed,
  trace as logisticTrace, rk4Step as logisticRk4,
} from '../logistic/core.mjs';

// ===== HARVEST-CORE (byte-identical to core.mjs) =====
// the locked landmarks of the fold.  h_crit = r·K/4 is BOTH the saddle-node
// harvest AND the maximum sustainable yield (MSY), achieved at N = K/2 (= N_MSY).
const H_CRIT = P.r * P.K / 4;     // = 15  — the fold / MSY harvest
const MSY = H_CRIT;               // maximum sustainable yield (same number, named for meaning)
const N_MSY = P.K / 2;            // = 50  — the stock at which yield is maximised

// EPS_EMPTY — the ONE shared "the pond has collapsed" threshold.  A count at or
// below this floor IS the empty pond; the integrator latches there (see rk4StepH).
const EPS_EMPTY = 1e-9;

// the HARVESTED field:  f_h(N) = field(N) − h.  Subtracting 0.0 is the IEEE
// identity, so at h = 0 this is BYTE-EQUAL to the imported logistic field — the
// negative control.  (field is the inherited logistic field; not re-implemented.)
function harvestField(N, h, p = P) {
  return field(N, p) - h;
}

// the stability slope of the harvested field.  The −h is CONSTANT ⇒ it vanishes
// under d/dN, so the slope is the UNCHANGED logistic slope.  Re-EXPORT fPrime —
// a structural insight (harvest shifts the field, not its steepness), not a copy.
const harvestPrime = fPrime;

// the two rest points of the harvested pond with their stability, from the EXACT
// closed-form roots of  r·N² − r·K·N + K·h = 0  ⇒  N± = (K/2)(1 ± √(1−4h/(rK))).
//  - disc < 0  ⇒  null: the roots are ANNIHILATED (past the fold, no refuge).
//  - disc = 0  ⇒  N₊ === N₋ === K/2 (the saddle-node; both eigenvalues 0).
//  - disc > 0  ⇒  N₊ stable (f'<0), N₋ unstable (f'>0); eigPlus = −eigMinus.
function equilibria(h, p = P) {
  const hCrit = p.r * p.K / 4;
  const disc = 1 - 4 * h / (p.r * p.K);
  if (disc < 0) return null;            // the fold has passed — no rest exists
  const s = Math.sqrt(disc);
  const Nplus = (p.K / 2) * (1 + s);    // the upper, STABLE refuge (f' < 0)
  const Nminus = (p.K / 2) * (1 - s);   // the lower, UNSTABLE threshold (f' > 0)
  const eigPlus = harvestPrime(Nplus, p);
  const eigMinus = harvestPrime(Nminus, p);
  return {
    Nplus, Nminus, disc, h, hCrit,
    plusStable: eigPlus < 0,
    minusStable: eigMinus < 0,
    eigPlus, eigMinus,
  };
}

// one RK4 step of the HARVESTED field — the SAME Butcher tableau as the logistic
// rk4Step, advancing f_h instead of f.  THE COLLAPSE FLOOR lives here: a fished-out
// pond cannot go negative, so if a step would carry N to or below 0 we LATCH at 0.
// (f_h(0) = −h < 0 for h>0 keeps it pinned: 0 is a true absorbing fixed point.)
function rk4StepH(N, dt, h, p = P) {
  const k1 = harvestField(N, h, p);
  const k2 = harvestField(N + (dt / 2) * k1, h, p);
  const k3 = harvestField(N + (dt / 2) * k2, h, p);
  const k4 = harvestField(N + dt * k3, h, p);
  const next = N + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  return next <= 0 ? 0 : next;          // the floor: an emptied pond stays at 0
}

// integrate the harvested pond from N0 for `steps` steps of dt at constant harvest
// h, recording the count series, whether/when it COLLAPSED (latched at 0), and the
// cumulative HAUL (Σ effective catch: h·dt while fish remain, the last partial when
// the stock empties mid-step).  The bench's bucket and rail read off this.
function traceH(N0, dt, steps, h, p = P) {
  let N = N0;
  const ts = [0], Ns = [N0];
  let t = 0, haul = 0, collapsed = N0 <= EPS_EMPTY;
  for (let i = 0; i < steps; i++) {
    const prev = N;
    N = rk4StepH(N, dt, h, p);
    t += dt;
    if (prev > EPS_EMPTY) {
      // while fish remained at the start of the step we banked harvest; if the pond
      // emptied this step we credit only the partial that the remaining stock allowed.
      haul += (N <= EPS_EMPTY) ? Math.min(h * dt, prev) : h * dt;
    }
    if (N <= EPS_EMPTY) collapsed = true;
    ts.push(t); Ns.push(N);
  }
  return { ts, Ns, N0, h, endN: N, collapsed, haul };
}

// ============================================================================
//  THE SELF-TEST — six checks, the SOLE authority for the in-page pill and
//  core.test.mjs.  They prove the fold STRUCTURE exact and the collapse latched.
// ============================================================================
function runHarvestSelfTest(p = P) {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name, pass: !!cond, info }); }

  // (1) REDUCTION AT h=0 — the NEGATIVE CONTROL, a load-bearing BYTE-identity.  The
  //     harvested field with h=0 IS the logistic field (subtracting 0.0 is the IEEE
  //     identity); one RK4 step and a full 6000-step trace match the imported
  //     logistic to the bit, and the pond rides to K (= 100).
  {
    let worst = 0, fieldExact = true, stepExact = true;
    for (let N = 0; N <= 120; N += 0.5) {
      const d = Math.abs(harvestField(N, 0, p) - field(N, p));
      if (harvestField(N, 0, p) !== field(N, p)) fieldExact = false;
      if (d > worst) worst = d;
      if (rk4StepH(N, 0.01, 0, p) !== logisticRk4(N, 0.01, p)) stepExact = false;
    }
    const tH = traceH(5, 0.01, 6000, 0, p);
    const tL = logisticTrace(5, 0.01, 6000, 'rk4', p);
    const traceExact = JSON.stringify(tH.Ns) === JSON.stringify(tL.Ns);
    detail.h0Worst = worst; detail.h0EndN = tH.endN;
    ok('REDUCTION at h=0: harvestField===field byte-exact, RK4 step & full trace byte-match the logistic, endN→K=100',
       fieldExact && stepExact && traceExact && worst === 0 && Math.abs(tH.endN - 100) < 1e-6,
       'worst|Δfield|=' + worst + ' (exactly 0)  ·  trace byte-match=' + traceExact + '  ·  endN=' + tH.endN.toFixed(6));
  }

  // (2) CLOSED ROOTS ARE ROOTS — for several sub-critical h the closed-form N± make
  //     the harvested field vanish, and an INDEPENDENT witness r·N*² − r·K·N* + K·h
  //     ≈ 0 confirms both are roots of the defining quadratic.
  {
    let worstRes = 0, worstQuad = 0;
    for (const h of [2, 8, 14, 14.9]) {
      const e = equilibria(h, p);
      for (const N of [e.Nplus, e.Nminus]) {
        worstRes = Math.max(worstRes, Math.abs(harvestField(N, h, p)));
        worstQuad = Math.max(worstQuad, Math.abs(p.r * N * N - p.r * p.K * N + p.K * h));
      }
    }
    detail.rootResidual = worstRes; detail.quadResidual = worstQuad;
    ok('CLOSED ROOTS are roots: |f_h(N±)| < 1e-9 for h∈{2,8,14,14.9}; independent witness rN²−rKN+Kh ≈ 0',
       worstRes < 1e-9 && worstQuad < 1e-7,
       'worst|f_h(N±)|=' + worstRes.toExponential(2) + ' (≤3.3e-15)  ·  worst quad residual=' + worstQuad.toExponential(2));
  }

  // (3) STABILITY SIGNS — the UPPER root is a stable refuge (f' < 0), the LOWER a
  //     tipping threshold (f' > 0), and because the slope is symmetric about K/2 the
  //     two eigenvalues are exactly equal-and-opposite (eigPlus = −eigMinus).
  {
    let allStable = true, allUnstable = true, worstSym = 0;
    for (const h of [2, 8, 14, 14.9]) {
      const e = equilibria(h, p);
      if (!(harvestPrime(e.Nplus, p) < 0)) allStable = false;
      if (!(harvestPrime(e.Nminus, p) > 0)) allUnstable = false;
      worstSym = Math.max(worstSym, Math.abs(e.eigPlus + e.eigMinus));
    }
    detail.eigSymWorst = worstSym;
    ok('STABILITY: f\'(N₊)<0 (stable refuge), f\'(N₋)>0 (unstable threshold), eigPlus = −eigMinus to machine zero',
       allStable && allUnstable && worstSym < 1e-12,
       'all N₊ stable=' + allStable + '  all N₋ unstable=' + allUnstable + '  ·  worst|eig₊+eig₋|=' + worstSym.toExponential(2));
  }

  // (4) SADDLE-NODE + MSY — at h_crit the two rests COLLIDE at K/2 with both
  //     eigenvalues 0 (the fold); a hair past it the rest VANISHES (null); and the
  //     maximum sustainable yield equals r·K/4 = 15 at N = K/2.
  {
    const e = equilibria(15, p);
    const collide = e.Nplus === N_MSY && e.Nminus === N_MSY && e.disc === 0 &&
      e.eigPlus === 0 && e.eigMinus === 0;
    const annihilated = equilibria(15.0001, p) === null;
    const msyOk = MSY === p.r * p.K / 4 && MSY === 15 && N_MSY === 50;
    detail.foldN = e.Nplus; detail.foldEig = e.eigPlus; detail.MSY = MSY;
    ok('SADDLE-NODE + MSY: equilibria(15) ⇒ N₊=N₋=K/2=50, disc=0, both eig=0; equilibria(15.0001)=null; MSY=rK/4=15 at N=50',
       collide && annihilated && msyOk,
       'fold N=' + e.Nplus + '  eig=' + e.eigPlus + '  ·  past-fold=' + equilibria(15.0001, p) + '  ·  MSY=' + MSY);
  }

  // (5) KNIFE-EDGE — just BELOW h_crit the pond settles toward N₊ and holds (does
  //     NOT collapse), but just ABOVE it the pond drains to exactly 0 and latches.
  //     Use the ~80k-step horizon: critical slowing-down near the fold means the
  //     just-below case settles SLOWLY (real physics, not a bug).
  {
    const eBelow = equilibria(14.95, p);
    const below = traceH(100, 0.01, 80000, 14.95, p);
    const above = traceH(100, 0.01, 80000, 15.05, p);
    detail.belowEndN = below.endN; detail.belowTarget = eBelow.Nplus; detail.aboveEndN = above.endN;
    ok('KNIFE-EDGE: h=14.95 settles to N₊(14.95)≈52.886751 and HOLDS (collapsed=false); h=15.05 drains to 0 (collapsed=true)',
       Math.abs(below.endN - eBelow.Nplus) < 0.05 && below.collapsed === false &&
       above.endN === 0 && above.collapsed === true,
       'below endN=' + below.endN.toFixed(6) + ' vs N₊=' + eBelow.Nplus.toFixed(6) +
       '  ·  above endN=' + above.endN + ' collapsed=' + above.collapsed);
  }

  // (6) IRREVERSIBILITY — beyond the fold the field's PEAK (rK/4 − h, at N=K/2) is
  //     strictly negative, so dN/dt < 0 EVERYWHERE ⇒ N → 0 from any start; an
  //     emptied pond stays empty at fixed effort (N₊ has annihilated); and the
  //     integrator is deterministic (two traceH runs byte-identical).
  {
    let allNeg = true;
    for (const h of [15.5, 18, 21, 30]) {
      const maxField = p.r * p.K / 4 - h;   // the field's maximum, at N = K/2
      if (!(maxField < 0)) allNeg = false;
    }
    const emptyStays = harvestField(0, 10, p) === -10;          // f_h(0) = −h < 0
    const a = JSON.stringify(traceH(40, 0.01, 5000, 9, p).Ns);
    const b = JSON.stringify(traceH(40, 0.01, 5000, 9, p).Ns);
    detail.deterministic = a === b;
    ok('IRREVERSIBILITY: maxField(h)=rK/4−h<0 for every h>h_crit (dN/dt<0 ⇒ N→0); f_h(0,10)=−10<0 (empty stays empty); deterministic',
       allNeg && emptyStays && a === b,
       'all maxField<0=' + allNeg + '  ·  f_h(0,10)=' + harvestField(0, 10, p) + '  ·  two runs identical=' + (a === b));
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}
// ===== END HARVEST-CORE =====

export {
  P, field, fPrime,
  harvestField, harvestPrime, rk4StepH, traceH, equilibria,
  H_CRIT, MSY, N_MSY, EPS_EMPTY, runHarvestSelfTest,
};
