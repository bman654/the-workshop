// ============================================================================
//  FIRST LIGHT — the estate's ONE metric-expansion (cosmology) core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every recession / redshift / temperature
//  number the room shows. The page inlines the slab between the FIRST-LIGHT CORE
//  BEGIN / END sentinels byte-for-byte; core.test.mjs proves the inlined copy is
//  identical (indentation-normalised) to this file, so page, pill, and Node twin
//  can never silently drift.
//
//  THE ONE IDEA — THE PATCH WITH NO MIDDLE. A galaxy's COMOVING coordinate is a
//  FIXED label that never changes. Its PROPER position is  p = a · comoving,
//  where a is the SCALE FACTOR — the single number your hand drags on the brass
//  collar. Grow a and the whole knit dilates; every separation scales by the SAME
//  a. The proper recession VELOCITY of a galaxy seen from another is
//        v = ȧ · Δcomoving = (ȧ/a) · (a·Δcomoving) = H · d,
//  with d the PROPER distance (= a·Δcomoving) and H = ȧ/a the Hubble rate. This
//  is Hubble's law as a THEOREM of uniform scaling, not a fit: it is EXACTLY
//  linear, isotropic, and — the soul of the room — IDENTICAL from EVERY vantage.
//  Re-anchor on any galaxy (subtract THAT galaxy's proper velocity from the whole
//  field) and you measure the same isotropic v∝d outflow. Every seat is the
//  centre, so none is. There is no middle to the patch.
//
//  REDSHIFT IS GEOMETRY, NOT DOPPLER. A photon's wavelength is pinned to the
//  metric: its crests are spaced in COMOVING phase, so as a grows the proper
//  crest-spacing grows with it and  1+z = a_now / a_then  EXACTLY — the ruler
//  stretched, the source never "moved". FREEZE a (hold the metric) and a photon
//  arrives UNSHIFTED, 1+z === 1 with NO velocity/Doppler term anywhere. This is
//  the axis that distinguishes First Light from the estate's kinematic Doppler
//  pieces (drifting-star, the passing-siren): there is no v in 1+z here at all.
//
//  TEMPERATURE COOLS AS 1/a. The radiation bath's temperature obeys T ∝ 1/a, so
//  T·a is invariant: pull the patch open and it cools from a hot wash to cold.
//
//  THE TWO NEG-CONTROLS, both proven RED in the twin:
//   (CHEAT) FIXED-CENTRE explosion — galaxies fly radially from ONE origin in a
//       FIXED space (no metric). Crucially it is a genuinely DIFFERENT LAW under
//       re-anchor, not a re-parameterisation: it models the chosen anchor as still
//       STATIONARY (it does NOT subtract the anchor's own velocity). At the origin
//       anchor it looks innocent (isotropic v∝d). Re-anchor OFF-centre and it
//       BREAKS: near-side galaxies APPROACH (radial v·d̂ < 0 — impossible under real
//       expansion), v is NOT ∝ d, the recovered slope is NOT consistent across
//       vantages, anisotropy ≫ tol. IF YOU CAN FIND THE CENTRE, YOU'RE IN A CHEAT.
//   (FROZEN) HELD METRIC — ȧ = 0 while a is large: a launched photon arrives with
//       1+z === 1 EXACTLY. No shift when the ruler holds — redshift is the metric
//       growing, not the source receding.
//
//  All distances d in this core are PROPER distances (= a·Δcomoving). We never mix
//  comoving and proper: v∝d, the slope fit, the anisotropy residual, and the cheat
//  all measure in proper units, consistently.
// ============================================================================

// === FIRST-LIGHT CORE BEGIN ===
"use strict";

// ── THE METRIC ──────────────────────────────────────────────────────────────
// A galaxy is { cx, cy }: its FIXED comoving coordinates. Its PROPER position at
// scale factor a is simply a·(cx,cy). properPos is the one geometric primitive
// everything else is built from.
function properPos(gal, a){ return { x: a * gal.cx, y: a * gal.cy }; }

// scaleField: map a whole comoving field to proper positions at scale factor a.
function scaleField(gals, a){ return gals.map(g => properPos(g, a)); }

// ── RECESSION (the TRUE metric law) ─────────────────────────────────────────
// The proper recession VELOCITY of a galaxy (at comoving `toC`) as MEASURED from
// a vantage galaxy (at comoving `fromC`), at scale factor a with expansion rate
// ȧ (= aDot). In the metric world the proper velocity of any galaxy is ȧ·c, and a
// vantage measures RELATIVE velocity = ȧ·(c_to − c_from). The proper separation
// (the d in v=Hd) is a·(c_to − c_from). Returns the velocity VECTOR {vx, vy}.
//   v = ȧ·Δc,   d = a·Δc   ⇒   v = (ȧ/a)·d = H·d,  H = ȧ/a.
function recession(a, aDot, fromC, toC){
  return { vx: aDot * (toC.cx - fromC.cx), vy: aDot * (toC.cy - fromC.cy) };
}

// The proper separation VECTOR (d) from a vantage to a galaxy: a·Δcomoving.
function properSep(a, fromC, toC){
  return { dx: a * (toC.cx - fromC.cx), dy: a * (toC.cy - fromC.cy) };
}

// The Hubble rate H = ȧ/a. (The slope of v vs d that the TRUE law produces.)
function hubbleRate(a, aDot){ return aDot / a; }

// ── THE FIXED-CENTRE CHEAT (the neg-control) ────────────────────────────────
// A fake "explosion in a fixed space": every galaxy flies radially from the ONE
// comoving origin (0,0) with velocity ȧ·c — the SAME absolute velocities as the
// metric — BUT the cheat models the chosen vantage as STATIONARY: it does NOT
// subtract the vantage's own velocity. So the velocity it reports for a galaxy is
// always measured against the FIXED frame, ȧ·c_to, regardless of which galaxy you
// re-anchored on. At the origin vantage (c_from = 0) this coincides with the metric
// law; re-anchored OFF-origin it is a genuinely DIFFERENT law (the missing
// −ȧ·c_from term) → approaching galaxies and broken v∝d. The proper separation it
// reports is still a·(c_to − c_from) (it measures the same distances), so the
// MISMATCH between its velocity field and that separation is the tell.
function fixedCenterCheatRecession(a, aDot, fromC, toC){
  // velocity against the FIXED origin frame; the vantage's own motion is ignored.
  return { vx: aDot * toC.cx, vy: aDot * toC.cy };
}

// ── REDSHIFT = GEOMETRY ─────────────────────────────────────────────────────
// 1+z = a_now / a_then, EXACTLY. The photon's comoving wavelength is fixed; its
// PROPER wavelength scales with a, so the observed/emitted ratio is the a-ratio.
function redshift(aThen, aNow){ return aNow / aThen - 1; }
function onePlusZ(aThen, aNow){ return aNow / aThen; }

// The PROPER wavelength of a photon emitted at a_then with comoving (rest) λ0,
// observed at a_now: λ_obs = λ0 · (a_now / a_then). This is the SAME number the
// drawn wave uses — the crests are spaced in comoving phase, so their proper
// spacing IS λ0·a. picture and proof are one number, not two coincidentally close.
function observedWavelength(lambda0, aThen, aNow){ return lambda0 * (aNow / aThen); }

// ── TEMPERATURE COOLS AS 1/a ────────────────────────────────────────────────
// T(a) = T0 / a, so T·a = T0 is invariant. (T0 is the temperature at a = 1.)
function temperature(a, T0){ return (T0 == null ? 1 : T0) / a; }
function tempOf(a, T0){ return temperature(a, T0); }

// ── THE MEASURED INSTRUMENTS ────────────────────────────────────────────────
// fitHubbleSlope: least-squares slope H of the RADIAL recession speed v_r vs proper
// distance d through the origin, H = Σ(v_r·d) / Σ(d²). v_r is the component of the
// velocity vector along the outward separation direction d̂ (a signed radial speed:
// negative ⇒ the galaxy APPROACHES). Inputs are parallel arrays of {dx,dy} proper
// separations and {vx,vy} velocities (both measured from the SAME vantage).
function fitHubbleSlope(seps, vels){
  let sNum = 0, sDen = 0;
  for (let i = 0; i < seps.length; i++){
    const d = Math.hypot(seps[i].dx, seps[i].dy);
    if (d < 1e-12) continue;                       // skip the vantage itself
    const vr = (vels[i].vx * seps[i].dx + vels[i].vy * seps[i].dy) / d;  // v·d̂
    sNum += vr * d;
    sDen += d * d;
  }
  return sDen < 1e-30 ? 0 : sNum / sDen;
}

// anisotropy: the scale-FREE residual of the radial field after the best v=H·d fit.
// For each galaxy compute the radial speed v_r and the model H·d; the residual is
// (v_r − H·d). We return the RMS residual normalised by the RMS of the field
// itself (the velocity-vector magnitudes) — a dimensionless number, 0 when the
// outflow is perfectly isotropic-linear (the TRUE law at every vantage), large
// when it is lopsided (the cheat, re-anchored off-centre).
function anisotropy(seps, vels){
  const H = fitHubbleSlope(seps, vels);
  let sumRes2 = 0, sumField2 = 0, n = 0;
  for (let i = 0; i < seps.length; i++){
    const d = Math.hypot(seps[i].dx, seps[i].dy);
    if (d < 1e-12) continue;
    const vr = (vels[i].vx * seps[i].dx + vels[i].vy * seps[i].dy) / d;  // radial speed
    const res = vr - H * d;                          // departure from v=Hd
    const fieldMag2 = vels[i].vx*vels[i].vx + vels[i].vy*vels[i].vy;     // full speed²
    sumRes2 += res * res;
    sumField2 += fieldMag2;
    n++;
  }
  if (n === 0 || sumField2 < 1e-30) return 0;
  return Math.sqrt(sumRes2 / sumField2);
}

// COEFFICIENT OF DETERMINATION R² of the radial-speed-vs-distance fit through the
// origin (a second, independent witness that v∝d): 1 when the radial speeds lie
// exactly on the line v_r = H·d. (Used to PROVE the TRUE law's perfect fit and to
// EXPOSE the cheat's broken one.)
function fitR2(seps, vels){
  const H = fitHubbleSlope(seps, vels);
  let ssRes = 0, ssTot = 0, mean = 0, n = 0;
  const vr = [];
  for (let i = 0; i < seps.length; i++){
    const d = Math.hypot(seps[i].dx, seps[i].dy);
    if (d < 1e-12){ vr.push(null); continue; }
    const r = (vels[i].vx * seps[i].dx + vels[i].vy * seps[i].dy) / d;
    vr.push({ r, d }); mean += r; n++;
  }
  if (n === 0) return 1;
  mean /= n;
  for (const s of vr){
    if (!s) continue;
    ssRes += (s.r - H * s.d) * (s.r - H * s.d);
    ssTot += (s.r - mean) * (s.r - mean);
  }
  return ssTot < 1e-30 ? 1 : 1 - ssRes / ssTot;
}

// ── A RE-ANCHOR FIELD BUILDER ───────────────────────────────────────────────
// Build the {seps, vels} a vantage galaxy MEASURES under a chosen law. `law` is a
// recession(a, aDot, fromC, toC) function (the TRUE metric law or the cheat). This
// is the SINGLE code path both the on-screen rose AND the self-test read, so they
// cannot drift: pass the vantage as an argument, get back the field it sees.
function measureFrom(gals, vantage, a, aDot, law){
  const seps = [], vels = [];
  for (const g of gals){
    seps.push(properSep(a, vantage, g));
    vels.push(law(a, aDot, vantage, g));
  }
  return { seps, vels };
}

// The minimum radial speed v·d̂ in a measured field (its most-negative value): a
// galaxy with v·d̂ < 0 is APPROACHING — impossible under real expansion. Used to
// catch the cheat's turned-around near-side galaxies.
function minRadialSpeed(seps, vels){
  let mn = Infinity;
  for (let i = 0; i < seps.length; i++){
    const d = Math.hypot(seps[i].dx, seps[i].dy);
    if (d < 1e-12) continue;
    const vr = (vels[i].vx * seps[i].dx + vels[i].vy * seps[i].dy) / d;
    if (vr < mn) mn = vr;
  }
  return mn === Infinity ? 0 : mn;
}

// ── THE DRAWN WAVE (comoving-phase parameterisation) ────────────────────────
// A photon launched at a_then with comoving wavelength λ0 has crests at proper
// positions spaced by λ0·a. crestSpacing returns the PROPER spacing at scale a; the
// ratio crestSpacing(aNow)/crestSpacing(aThen) === aNow/aThen === 1+z, so the
// PICTURE (crest spacing) and the PROOF (1+z) are the SAME number. (The page draws
// crests at these proper positions — it does NOT fake spacing on a fixed sine.)
function crestSpacing(lambda0, a){ return lambda0 * a; }

// A photon's CURRENT proper wavelength along its flight, frozen-metric aware: with
// the metric frozen (aThen === aNow) the wavelength is unchanged. (Convenience
// wrapper used by the frozen-metric neg-control.)
function frozenMetricPhoton(lambda0, aHeld){
  // a held metric: emitted and observed at the SAME a ⇒ no stretch.
  return { lambdaObs: observedWavelength(lambda0, aHeld, aHeld), onePlusZ: onePlusZ(aHeld, aHeld) };
}

// ── THE SHIPPED SCENE ───────────────────────────────────────────────────────
const SCENE = {
  T0: 1.0,            // temperature at a = 1 (UI scale; cancels in the T·a claim)
  lambda0: 1.0,       // comoving (rest) wavelength of the launched photon (UI scale)
  aDotDefault: 0.5,   // the default expansion rate ȧ the demo runs with
};

// ── THE SELF-TEST — the patch proves its own claim ──────────────────────────
// FOUR split claims, matching the brief: (1) redshift=geometry exact AND the drawn
// crest-spacing is the SAME number; (2) homogeneity / no-centre — re-anchor on
// EVERY vantage recovers the SAME H with R²≈1 and anisotropy<tol; (3) T·a invariant;
// (4a) frozen-metric ⇒ 1+z===1 exactly; (4b) the fixed-centre cheat re-anchored
// off-centre BITES (anisotropy≫tol, a near-side galaxy approaches, slope NOT
// consistent across vantages) while the TRUE law's deviation === 0 everywhere.
function makeTestField(n){
  // a deterministic comoving cloud (no RNG dependence): a jittered lattice in the
  // unit square centred near the origin, plus a few far galaxies.
  const gals = [];
  const N = n || 100;
  // a low-discrepancy-ish spread using the golden angle so it is even but not gridded
  const phi = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < N; i++){
    const r = Math.sqrt((i + 0.5) / N) * 5;          // radius out to 5 comoving units
    const th = 2 * Math.PI * (i * phi);
    gals.push({ cx: r * Math.cos(th), cy: r * Math.sin(th) });
  }
  return gals;
}

function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const TOL = 1e-9;
  const ANISO_TOL = 1e-9;        // the TRUE law is anisotropy-free to machine ε
  const gals = makeTestField(100);
  const aDot = SCENE.aDotDefault;

  // ── CLAIM 1 — REDSHIFT = GEOMETRY. 1+z === a_now/a_then EXACTLY over an
  //    (a_then, a_now) sweep to <1e-9, AND the drawn crest-spacing ratio is the
  //    SAME number (picture === proof, one number not two).
  let z1Worst = 0, crestWorst = 0;
  for (let i = 1; i <= 20; i++){
    for (let j = 1; j <= 20; j++){
      const aThen = 0.2 + i * 0.13, aNow = 0.2 + j * 0.17;
      const zModel = 1 + redshift(aThen, aNow);          // 1+z from the formula
      const aRatio = aNow / aThen;
      z1Worst = Math.max(z1Worst, Math.abs(zModel - aRatio));
      // the PICTURE: ratio of drawn crest spacings === the SAME a-ratio
      const ratioDrawn = crestSpacing(SCENE.lambda0, aNow) / crestSpacing(SCENE.lambda0, aThen);
      crestWorst = Math.max(crestWorst, Math.abs(ratioDrawn - aRatio));
    }
  }
  const c1 = z1Worst < TOL && crestWorst < TOL;
  log('1 · redshift = geometry: 1+z === a_now/a_then AND drawn crest-spacing ratio === the same number (<1e-9)',
      c1, 'z worst ' + z1Worst.toExponential(2) + ', crest worst ' + crestWorst.toExponential(2));

  // ── CLAIM 2 — HOMOGENEITY / NO-CENTRE. For the TRUE metric law, re-anchor on
  //    EVERY vantage-dot, fit H, and recover the SAME H with R²≈1 and anisotropy<tol.
  //    Re-anchor invariance PROVED (the rose reads from this SAME code path).
  // measure each vantage at a fixed a; H should equal aDot/a at every vantage.
  const aFix = 1.6;
  const Hexpect = aDot / aFix;
  let hSpread = 0, worstAniso = 0, worstR2 = 1;
  for (const v of gals){
    const f = measureFrom(gals, v, aFix, aDot, recession);
    const H = fitHubbleSlope(f.seps, f.vels);
    const A = anisotropy(f.seps, f.vels);
    const R2 = fitR2(f.seps, f.vels);
    hSpread = Math.max(hSpread, Math.abs(H - Hexpect));
    worstAniso = Math.max(worstAniso, A);
    worstR2 = Math.min(worstR2, R2);
  }
  const c2 = hSpread < TOL && worstAniso < ANISO_TOL && (1 - worstR2) < TOL;
  log('2 · homogeneity / no-centre: re-anchor on EVERY vantage ⇒ same H (=ȧ/a), R²≈1, anisotropy<tol',
      c2, 'H spread ' + hSpread.toExponential(2) + ', worst A ' + worstAniso.toExponential(2) +
      ', min R² ' + worstR2.toFixed(12));

  // ── CLAIM 3 — T·a INVARIANT === T0 over the a-sweep to <1e-9.
  let taWorst = 0;
  for (let k = 1; k <= 60; k++){
    const a = 0.1 + k * 0.08;
    taWorst = Math.max(taWorst, Math.abs(temperature(a, SCENE.T0) * a - SCENE.T0));
  }
  const c3 = taWorst < TOL;
  log('3 · temperature cools as 1/a: T·a === T0 invariant over the a-sweep (<1e-9)',
      c3, 'worst |T·a − T0| ' + taWorst.toExponential(2));

  // ── CLAIM 4a — FROZEN METRIC ⇒ 1+z === 1 EXACTLY (no shift when the ruler holds).
  let frozenWorst = 0;
  for (let k = 1; k <= 40; k++){
    const aHeld = 0.3 + k * 0.07;
    const fp = frozenMetricPhoton(SCENE.lambda0, aHeld);
    frozenWorst = Math.max(frozenWorst, Math.abs(fp.onePlusZ - 1), Math.abs(fp.lambdaObs - SCENE.lambda0));
  }
  const c4a = frozenWorst === 0;     // EXACTLY (a/a = 1, λ0·1 = λ0)
  log('4a · NEG-CONTROL frozen metric: held a ⇒ 1+z === 1 EXACTLY, λ unchanged (no Doppler term)',
      c4a, 'worst dev ' + frozenWorst.toExponential(2));

  // ── CLAIM 4b — FIXED-CENTRE CHEAT BITES off-centre. Re-anchored off-origin the
  //    cheat must MEASURABLY violate v∝d: anisotropy ≫ tol AND ≥1 near-side galaxy
  //    approaches (v·d̂ < 0) AND its recovered slope is NOT consistent across
  //    vantages — while the TRUE law's deviation === 0 at every vantage. NON-VACUITY
  //    is verified here BEFORE the claim: the cheat is a genuinely different law.
  //    Pick an OFF-CENTRE vantage (a galaxy far from the comoving origin).
  let offIdx = 0, offR = 0;
  for (let i = 0; i < gals.length; i++){
    const r = Math.hypot(gals[i].cx, gals[i].cy);
    if (r > offR){ offR = r; offIdx = i; }
  }
  const offVantage = gals[offIdx];
  // the cheat field from the off-centre vantage
  const cheatF = measureFrom(gals, offVantage, aFix, aDot, fixedCenterCheatRecession);
  const cheatA = anisotropy(cheatF.seps, cheatF.vels);
  const cheatMinRadial = minRadialSpeed(cheatF.seps, cheatF.vels);
  // slope consistency across vantages: the cheat's recovered H at the origin vs at
  // the off-centre vantage must DIFFER (a single law has one slope; the cheat does not)
  const originVantage = gals.reduce((best, g) => (Math.hypot(g.cx, g.cy) < Math.hypot(best.cx, best.cy) ? g : best), gals[0]);
  const cheatOrigin = measureFrom(gals, originVantage, aFix, aDot, fixedCenterCheatRecession);
  const Hcheat_off = fitHubbleSlope(cheatF.seps, cheatF.vels);
  const Hcheat_org = fitHubbleSlope(cheatOrigin.seps, cheatOrigin.vels);
  const slopeInconsistent = Math.abs(Hcheat_off - Hcheat_org) > 1e-3;
  // the TRUE law's deviation === 0 at the SAME off-centre vantage (re-prove teeth)
  const trueF = measureFrom(gals, offVantage, aFix, aDot, recession);
  const trueA = anisotropy(trueF.seps, trueF.vels);
  const trueMinRadial = minRadialSpeed(trueF.seps, trueF.vels);
  // NON-VACUITY: the cheat must actually DIFFER from the true law at this vantage
  // (otherwise it would be a re-parameterisation, not a different law).
  let lawDiff = 0;
  for (let i = 0; i < cheatF.vels.length; i++){
    lawDiff = Math.max(lawDiff, Math.hypot(cheatF.vels[i].vx - trueF.vels[i].vx, cheatF.vels[i].vy - trueF.vels[i].vy));
  }
  const c4b = cheatA > 0.05 && cheatMinRadial < 0 && slopeInconsistent &&
              trueA < ANISO_TOL && trueMinRadial >= 0 && lawDiff > 0.1;
  log('4b · NEG-CONTROL fixed-centre cheat BITES off-centre: A≫tol, a galaxy approaches (v·d̂<0), slope inconsistent — while TRUE law A===0',
      c4b, 'cheat A ' + cheatA.toExponential(2) + ', cheat min v_r ' + cheatMinRadial.toExponential(2) +
      ', Hcheat off/org ' + Hcheat_off.toFixed(3) + '/' + Hcheat_org.toFixed(3) +
      ', true A ' + trueA.toExponential(2) + ', law diff ' + lawDiff.toExponential(2));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === FIRST-LIGHT CORE END ===

export {
  SCENE,
  properPos, scaleField, recession, properSep, hubbleRate,
  fixedCenterCheatRecession,
  redshift, onePlusZ, observedWavelength,
  temperature, tempOf,
  fitHubbleSlope, anisotropy, fitR2,
  measureFrom, minRadialSpeed,
  crestSpacing, frozenMetricPhoton,
  makeTestField, runSelfTest,
};
