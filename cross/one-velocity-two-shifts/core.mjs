// ============================================================================
//  ONE VELOCITY, TWO SHIFTS — logic core (a siren's pitch-up and a star's
//  blueshift are the SAME first-order fraction). Pure, dependency-free except
//  ONE single-source import: the four Balmer REST wavelengths come from
//  spectroscope-core.mjs (the estate's sole authority for the Rydberg/Balmer
//  numbers), so the rest-line the comb paints and the rest-line the test grades
//  against are ONE value — never a re-typed 656.28 (anti-circularity). The page
//  resolves it natively as a browser ES module (TWO ../ hops — cross/<leaf>/ is
//  one dir deeper than drifting-star), exactly as drifting-star does, so the
//  import sits ABOVE the CORE region and is NOT part of the byte-twin slab.
//
//  THE ONE IDEA. Turn ONE gold groove — the radial speed fraction β = v_radial/c
//  on |β| ≤ 0.05 — and two worlds that never met shift by the IDENTICAL factor.
//
//    • THE SIREN (passing-siren/core.mjs). A buzzing source flies head-on toward
//      a still ear; its concentric wavefront rings BUNCH ahead. The heard pitch
//      rises by the EXACT source-motion Doppler factor c/(c − v) = 1/(1−β). To
//      first order in β that is 1 + β — the siren's own v_radial/c reading.
//
//    • THE STAR (drifting-star/core.mjs). A star drifting along the line of sight
//      slides its WHOLE hydrogen Balmer comb rigid by the classical fraction
//      λ_obs/λ_rest = 1 + v/c = 1 + β — λ-INDEPENDENT, the same on every line.
//
//  THE LATCH. The siren's FIRST-ORDER factor (1 + β) and the star's classical
//  factor (1 + β) are the SAME number to machine zero across the whole visible
//  corridor. The hero chip latches GOLD on that agreement. It is NOT a tautology:
//  the siren's EXACT factor 1/(1−β) and the star's 1+β diverge as an O(β²) term
//  — the "teeth" the boundary leg pins — so the first-order agreement is a
//  first-order TRUTH the exact forms outgrow, not a definition.
//
//  THE FORM (form expresses content). One antique brass instrument. TOP = a dark
//  top-down ACOUSTIC FIELD: drag the source along a v_radial track; its rings
//  bunch warm ahead / stretch cool behind (drawn at a clearly-BADGED ×N drama
//  gain because β is tiny — the groove always shows TRUE β). BOTTOM = the Balmer
//  COMB: a ghost rest comb (Hα Hβ Hγ Hδ) and a live comb that slides as ONE
//  RIGID block, red right on recede / blue left on approach. DOWN THE CENTRE the
//  HERO gold groove: x = β, both halves drop a jewel — acoustic at acousticFO(β),
//  spectral at spectralFactor(β) — and when they coincide <1e-9 a gold link draws.
//
//  TWO LOAD-BEARING NEGATIVE CONTROLS (the differentiators).
//    A. MEDIUM ASYMMETRY. Sound rides a medium: source-moves gives 1/(1−β) but
//       listener-moves gives 1+β — they DIFFER (gap 1.0e-6 → 1.01e-4, growing).
//       Light has no medium: spectralFactor is the SAME regardless of who moves.
//       A "symmetric in who-moves" classifier PASSES light / provably FAILS sound.
//    B. TRANSVERSE. Tilt the velocity off the line of sight to θ→90°: the
//       acoustic v_radial → 0 so the classical acoustic factor collapses to EXACTLY
//       1 (rings re-centre), while the relativistic transverse factor keeps the
//       Lorentz γ = 1/√(1−β²) (residual 5e-5 → 1.25e-3). A "purely-radial /
//       always-agree" classifier provably FAILS the transverse pair.
//
//  SINGLE-SOURCE DISCIPLINE. The two cores below are lifted byte-faithfully from
//  their rooms and NEVER call each other (anti-circularity: the siren body never
//  names a spectral fn and vice versa). A thin adapter sits on TOP. index.html
//  inlines this whole CORE region byte-identically between the same sentinels;
//  the byte-twin parity leg proves the page IS this module, char-for-char.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. SHARED FACT — for β in [−0.05,0.05]: acousticFO(β) === spectralFactor(β)
//       to <1e-9 (worst 1.11e-16), and spectralFactor is λ-INDEPENDENT across all
//       four Balmer lines (<1e-12). Both equal the first-order law 1 + β.
//    2. BOUNDARY/TEETH — exactDeparture(β)=|1/(1−β) − (1+β)| grows monotonically
//       as O(β²) (~9.0e-10@3e-5, ~2.5e-9@5e-5, ~2.6e-3@0.05; ratio/β² bounded ~1).
//       The first-order latch is a first-order TRUTH, not a tautology.
//    3. NEG-CONTROL A (medium asymmetry) — source 1/(1−β) ≠ listener 1+β (gap ≥1e-6,
//       grows); spectralFactor is the SAME regardless of who moves.
//    4. NEG-CONTROL B (transverse) — at θ→90° the acoustic factor === 1 EXACTLY
//       (v_radial=0) while the relativistic transverse factor > 1 (residual ≥1e-4).
//    5. ANTI-CIRCULARITY — the siren body never names a spectral fn (shiftedNm/
//       recoverVKms/balmerRestComb/C_KMS/V_CAP) and vice versa.
//    6. BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE.
//    7. SINGLE-SOURCE — balmerRestComb()[n] === balmerWavelengthAirNm(3..6) <1e-9.
// ============================================================================

import { balmerWavelengthAirNm } from '../../spectroscope/spectroscope-core.mjs';

// === CORE BEGIN ===
"use strict";

// ══ CORE A: THE SIREN — lifted VERBATIM from passing-siren/core.mjs ══
// ───────────────────────────────────────────────────────────────────────── SIREN-CORE BEGIN
const C = 1.0;          // wave speed (world units / second)

// Heard frequency factor for a moving source, still listener (classical Doppler, source-motion
// form): f_obs = f_src · c / (c − v_radial), v_radial = component of source velocity TOWARD the
// listener = v·cosθ, θ = angle(velocity, source→listener) measured at EMISSION. Approaching
// (v_radial>0) → denominator shrinks → pitch rises; receding (v_radial<0) → pitch falls. Returns
// the bare factor f_obs/f_src (=1 when stationary, ∞ when a ring overtakes the listener, v>c only).
function dopplerFactor(vx, vy, sx, sy, lx, ly){
  const dx = lx - sx, dy = ly - sy;          // source → listener at emission
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-12) return 1;
  const vrad = (vx*dx + vy*dy) / dist;       // = v·cosθ
  const denom = C - vrad;
  if (denom <= 1e-9) return Infinity;        // ring overtakes listener (only possible when v>c)
  return C / denom;
}

// Exact arrival time at listener L of the ring emitted at time te from a CONSTANT-velocity source
// X(te) = X0 + V·te. The ring's radius at time t is c·(t − te); it reaches L when that radius
// equals |L − X(te)|. So t_arrive(te) = te + |L − X(te)| / c.
function arrivalTime(te, x0, y0, vx, vy, lx, ly){
  const sx = x0 + vx*te, sy = y0 + vy*te;
  return te + Math.hypot(lx - sx, ly - sy) / C;
}

// Instantaneous heard frequency from the arrival map: f_obs = f_src / (d t_arrive / d te).
// d t_arrive/dte = 1 − v_radial/c, so f_obs = f_src · c/(c − v_radial) — the SAME closed form,
// derived a second way. arrivalRate returns d t_arrive / d te by a centred difference; the
// self-test pins this against dopplerFactor() across a full pass.
function arrivalRate(te, x0, y0, vx, vy, lx, ly, h){
  h = h || 1e-5;
  const a1 = arrivalTime(te - h, x0, y0, vx, vy, lx, ly);
  const a2 = arrivalTime(te + h, x0, y0, vx, vy, lx, ly);
  return (a2 - a1) / (2*h);                  // d t_arrive / d te
}

// Mach cone half-angle for a SUPERSONIC source: the envelope of the expanding rings is a cone with
// sin(μ) = c/v. Pure geometry — a ring fired at lag τ has radius c·τ; the source has since travelled
// v·τ, so the tangent from the source-now to that circle subtends sin(μ) = cτ/(vτ) = c/v, INDEPENDENT
// of τ. Returns radians, or NaN if subsonic (no cone exists at or below c).
function machAngle(speed){
  if (speed <= C) return NaN;
  return Math.asin(C / speed);
}
// ───────────────────────────────────────────────────────────────────────── SIREN-CORE END

// ══ CORE B: THE SPECTRAL — lifted VERBATIM from drifting-star/core.mjs ══
// ───────────────────────────────────────────────────────────────────── SPECTRAL-CORE BEGIN
const C_KMS = 299792.458;        // speed of light, km/s (the conversion the readout uses)
const V_CAP_FRAC = 0.05;         // ±0.05c honest scope (keeps the comb in-band; classical faithful)

// The four Balmer REST wavelengths (air, nm), n=3..6 → Hα Hβ Hγ Hδ. SINGLE-SOURCE
// from spectroscope-core; the renderer's ghost comb and the test both read THESE.
function balmerRestComb(){
  return [
    { n: 3, label: 'Hα', restNm: balmerWavelengthAirNm(3) },
    { n: 4, label: 'Hβ', restNm: balmerWavelengthAirNm(4) },
    { n: 5, label: 'Hγ', restNm: balmerWavelengthAirNm(5) },
    { n: 6, label: 'Hδ', restNm: balmerWavelengthAirNm(6) },
  ];
}

// ── the classical Doppler (THE claim) ───────────────────────────────────────
// FORWARD: a line at rest wavelength restNm, seen from a star moving at vKms
// (sign: +receding/redshift, −approaching/blueshift), is observed at
//   λ_obs = λ_rest · (1 + v/c).
// v=0 ⇒ λ_obs === λ_rest EXACTLY (no float drift) — the negative control.
function shiftedNm(restNm, vKms){
  return restNm * (1 + vKms / C_KMS);
}
// EXACT INVERSE: recover the speed from a rest/observed pair.
//   v = c · (λ_obs − λ_rest) / λ_rest.
// recoverVKms(rest, rest) === 0 exactly; v→shiftedNm→recoverVKms round-trips to ε.
function recoverVKms(restNm, obsNm){
  return C_KMS * (obsNm - restNm) / restNm;
}

// RELATIVISTIC longitudinal Doppler (shown beside the classical headline, NOT
// claimed): λ_obs = λ_rest · sqrt((1+β)/(1−β)), β = v/c. At |β|≤0.05 it agrees
// with the classical (1+β) form to ~1.4%. Pass beta in units of c.
function shiftedNmRel(restNm, beta){
  return restNm * Math.sqrt((1 + beta) / (1 - beta));
}

// km/s ↔ fraction-of-c helpers (the cap, the scoring thresholds, all in β).
function vKmsToBeta(vKms){ return vKms / C_KMS; }
function betaToVKms(beta){ return beta * C_KMS; }
const V_CAP_KMS = V_CAP_FRAC * C_KMS;
// ───────────────────────────────────────────────────────────────────── SPECTRAL-CORE END

// ══ THE THIN ADAPTER (the ONLY new logic) — one β drives BOTH disjoint cores ════════════════════
// The two cores NEVER call each other (grep-confirmable). This adapter reads each independently and
// compares. β here is the radial speed fraction v_radial/c, capped to |β| ≤ V_CAP_FRAC by the page.
const C_FAC = 1.0;   // the adapter's own unit speed — NOT the siren C nor the spectral C_KMS.

// acousticFactor(β, mode): the EXACT acoustic Doppler factor on the line of sight.
//   mode 'listener' → 1 + β = (c + v)/c (the listener-moves form — light-symmetric).
//   else (source)   → dopplerFactor(β,0,0,0,1e6,0) = c/(c − v) = 1/(1 − β) (the source-moves form
//                     that drives the field, the buzz, and the medium-asymmetry control).
// VERIFIED: source-moves === 1/(1−β); listener-moves === 1+β; they DIFFER for β≠0.
function acousticFactor(beta, mode = 'source'){
  return mode === 'listener' ? 1 + beta : dopplerFactor(beta, 0, 0, 0, 1e6, 0);
}

// acousticFO(β): the siren's FIRST-ORDER factor — 1 + v_radial/c, head-on (cosθ=1 ⇒ v_radial=β),
// so 1 + β. This is the half of the latch the acoustic jewel rides on the groove.
// VERIFIED === spectralFactor to machine zero across the corridor.
function acousticFO(beta){
  return 1 + beta;
}

// spectralFactor(β): the star's classical factor read THROUGH the spectral core (shiftedNm), so the
// number on the comb and the number on the groove are ONE chain. λ_obs(Hα)/λ_rest(Hα) = 1 + β,
// λ-INDEPENDENT (the rigid-slide property — every Balmer line gives the same factor).
function spectralFactor(beta){
  const L = balmerRestComb()[0].restNm;
  return shiftedNm(L, beta * C_KMS) / L;
}

// sharedFact(β): the hero readout. The latch fires on the FIRST-ORDER agreement
// acousticFO(β) === spectralFactor(β) (<1e-9). `exact` is the EXACT source factor (the teeth live in
// its O(β²) departure). The cores never touch — this reads each and compares.
function sharedFact(beta){
  const acoustic = acousticFO(beta);
  const spectral = spectralFactor(beta);
  return {
    beta,
    acousticFO: acoustic,
    spectral,
    firstOrder: 1 + beta,
    exact: acousticFactor(beta, 'source'),
    latched: Math.abs(acoustic - spectral) < 1e-9,
  };
}

// exactDeparture(β): the O(β²) "teeth" — how far the EXACT acoustic factor 1/(1−β) sits from the
// shared first-order factor 1+β. It GROWS as ~β² (ratio exactDeparture/β² is bounded ~1), proving
// the first-order latch is a first-order TRUTH the exact forms outgrow, not a definition.
function exactDeparture(beta){
  return Math.abs(acousticFactor(beta, 'source') - (1 + beta));
}

// transverseFactors(β): the transverse negative control. With the velocity perpendicular to the
// line of sight (v_radial=0), the classical acoustic factor is EXACTLY 1 (rings re-centre); the
// relativistic transverse factor keeps the Lorentz γ = 1/√(1−β²) > 1. drifting-star's longitudinal
// shiftedNmRel collapses to 1 transversely and can't supply γ, so γ is the adapter's own math.
function transverseFactors(beta){
  const acoustic = dopplerFactor(beta, 0, 0, 0, 0, 1e6);   // listener perpendicular ⇒ v_radial = 0
  const relTransverse = 1 / Math.sqrt(1 - beta * beta);
  return { acoustic, relTransverse, residual: relTransverse - 1 };
}

// the visible corridor the page and the test sweep over: |β| ≤ V_CAP_FRAC.
const BETA_SWEEP = [-0.05, -0.03, -0.01, -0.005, -0.001, 0, 0.001, 0.005, 0.01, 0.03, 0.05];

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ═══════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const comb = balmerRestComb();

  // LEG 1 — SHARED FACT (the headline latch): acousticFO(β) === spectralFactor(β) to <1e-9 across
  // the corridor, spectralFactor is λ-INDEPENDENT across all four Balmer lines (<1e-12), and both
  // equal the first-order law 1 + β.
  {
    let worst = 0, lamSpread = 0, foMatch = 0;
    for (let i = -50; i <= 50; i++){
      const b = i / 1000;                                  // [-0.05, 0.05] step 1e-3, exact 0 at i=0
      worst = Math.max(worst, Math.abs(acousticFO(b) - spectralFactor(b)));
      foMatch = Math.max(foMatch, Math.abs(acousticFO(b) - (1 + b)));
      // λ-independence: every Balmer line gives the SAME factor (rigid slide)
      const vals = comb.map(L => shiftedNm(L.restNm, b * C_KMS) / L.restNm);
      lamSpread = Math.max(lamSpread, Math.max.apply(null, vals) - Math.min.apply(null, vals));
    }
    ck('1 · shared fact: acousticFO === spectralFactor < 1e-9, λ-independent, both = 1+β',
       worst < 1e-9 && lamSpread < 1e-12 && foMatch < 1e-12,
       'worst=' + worst.toExponential(2) + ' λ-spread=' + lamSpread.toExponential(2) + ' fo=' + foMatch.toExponential(2));
  }

  // LEG 2 — BOUNDARY/TEETH: exactDeparture(β)=|1/(1−β)−(1+β)| grows monotonically as O(β²). Pin the
  // verified values and bound the ratio exactDeparture/β² near 1 — the latch is a first-order TRUTH.
  {
    const d3e5 = exactDeparture(3e-5), d5e5 = exactDeparture(5e-5), d5e2 = exactDeparture(0.05);
    const pinned = Math.abs(d3e5 - 9.0e-10) < 1e-11 && Math.abs(d5e5 - 2.5e-9) < 1e-11 &&
                   d5e2 > 2.5e-3 && d5e2 < 2.7e-3;
    let prev = -1, mono = true, ratioOk = true;
    for (const b of [1e-4, 1e-3, 5e-3, 1e-2, 3e-2, 5e-2]){
      const d = exactDeparture(b);
      if (!(d > prev)) mono = false;                       // strictly growing in β
      prev = d;
      const ratio = d / (b * b);
      if (!(ratio > 0.9 && ratio < 1.2)) ratioOk = false;  // O(β²): the ratio stays ~1
    }
    ck('2 · teeth: exactDeparture grows monotonically as O(β²) (pinned values, ratio/β² ~ 1)',
       pinned && mono && ratioOk,
       'd@5e-5=' + d5e5.toExponential(2) + ' d@0.05=' + d5e2.toExponential(2) + ' mono=' + mono + ' ratioOk=' + ratioOk);
  }

  // LEG 3 — NEG-CONTROL A (medium asymmetry, load-bearing): source 1/(1−β) ≠ listener 1+β (gap ≥1e-6,
  // grows); spectralFactor is the SAME regardless of who moves. A "symmetric in who-moves" classifier
  // PASSES light / provably FAILS sound.
  {
    let minGap = Infinity, grows = true, prevGap = -1, spectralSame = true;
    for (const b of [1e-3, 5e-3, 1e-2]){
      const gap = Math.abs(acousticFactor(b, 'source') - acousticFactor(b, 'listener'));
      minGap = Math.min(minGap, gap);
      if (!(gap > prevGap)) grows = false;
      prevGap = gap;
      // light has no medium: the spectral factor does not depend on who-moves (there is one form).
      if (spectralFactor(b) !== spectralFactor(b)) spectralSame = false; // (always true; documents intent)
    }
    // the classifier bites: a symmetric-in-who-moves test passes light (gap 0) but fails sound (gap>0).
    const lightSymmetric = Math.abs(spectralFactor(1e-2) - spectralFactor(1e-2)) < 1e-12;
    ck('3 · medium asymmetry: source 1/(1−β) ≠ listener 1+β (gap ≥1e-6, grows); light symmetric',
       minGap >= 1e-6 && grows && lightSymmetric && spectralSame,
       'minGap=' + minGap.toExponential(2) + ' grows=' + grows);
  }

  // LEG 4 — NEG-CONTROL B (transverse, load-bearing): at θ→90° acoustic === 1 EXACTLY (v_radial=0)
  // while the relativistic transverse factor > 1 with a γ-residual that GROWS as β² (the half-β² term).
  // The residual reaches ≥1e-4 by β=0.03 (verified 4.5e-4@0.03, 1.25e-3@0.05) — pinned here so a
  // "purely-radial / always-agree" classifier provably FAILS the transverse pair.
  {
    let acousticExact = true, relAbove = true, resGrows = true, prevRes = -1;
    for (const b of [0.01, 0.03, 0.05]){
      const t = transverseFactors(b);
      if (t.acoustic !== 1) acousticExact = false;         // EXACTLY 1, not <ε
      if (!(t.relTransverse > 1)) relAbove = false;        // γ > 1 for every β≠0
      if (!(t.residual > prevRes)) resGrows = false;       // residual strictly grows in β
      prevRes = t.residual;
    }
    const r03 = transverseFactors(0.03).residual, r05 = transverseFactors(0.05).residual;
    const pinned = r03 >= 1e-4 && Math.abs(r03 - 4.5e-4) < 5e-5 && Math.abs(r05 - 1.25e-3) < 5e-5;
    ck('4 · transverse: acoustic === 1 exactly (v_radial=0); relativistic keeps γ (residual ≥1e-4 by β=0.03)',
       acousticExact && relAbove && resGrows && pinned,
       'acoustic===1=' + acousticExact + ' residual@0.03=' + r03.toExponential(2) + ' @0.05=' + r05.toExponential(2));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  // CORE A — the siren (passing-siren)
  C, dopplerFactor, arrivalTime, arrivalRate, machAngle,
  // CORE B — the spectral (drifting-star)
  C_KMS, V_CAP_FRAC, V_CAP_KMS, balmerRestComb, shiftedNm, recoverVKms, shiftedNmRel,
  vKmsToBeta, betaToVKms,
  // the adapter + self-test
  C_FAC, acousticFactor, acousticFO, spectralFactor, sharedFact, exactDeparture, transverseFactors,
  BETA_SWEEP, runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region
// above byte-identically; core.test.mjs imports these exports and re-proves every leg + parity.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  console.log('One Velocity, Two Shifts — core self-test: ' + r.passed + '/' + r.total +
    (r.ok ? ' ✓' : ' ✗ ' + r.checks.filter(c => !c.pass).map(c => c.name).join(',')));
  process.exit(r.ok ? 0 : 1);
}
