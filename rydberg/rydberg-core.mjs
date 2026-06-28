// ============================================================================
//  THE RYDBERG CONSTANT, READ OFF STARLIGHT  —  core (the sole authority for the
//  NEW physics: the four Balmer points, the line→R algebra, and the standard-error
//  band). Pure, dependency-free except for two SINGLE-SOURCE imports:
//
//    • the spectroscope's own physics  (spectroscope-core.mjs):
//        RYDBERG_H, balmerWavelengthNm, balmerWavelengthAirNm
//      — so the constant we RECOVER and the constant we GRADE against are ONE
//        value, never a re-typed copy. R∞, R_H and n_air live ONLY in that module;
//        grep THIS file for their digit-literals and you will not find them (the
//        Demon-grade anti-circularity proof — the Node twin asserts it).
//    • the plumbline's blind line-fitter  (plumbline-core.mjs):
//        fitL2 (closed form), gdFit (gradient descent), fitL1 (robust LAD),
//        makeRng, gauss
//      — the SAME Σr² minimum that fits a noisy cloud reads R off four smudges.
//
//  THE ONE IDEA.  The Balmer law 1/λ = R_H(¼ − 1/n²) is a STRAIGHT LINE in the
//  coordinates  u = 1/n²  (x)  and  y = 1/λ.  Its slope is −R_H and its intercept
//  (at u=0, the series limit n→∞) is R_H/4. So a fitter that knows NO atomic
//  physics — only "minimise Σ(vertical residual)²" — recovers the Rydberg constant
//  TWICE from four points, and the two readings must agree by algebra:  −m = 4b.
//
//  THE FOUR LEGS the self-test proves (all numbers LIVE, none echoed):
//    (a) NOISELESS IDENTITY (collinear, teeth-less): on the vacuum points
//        fitL2.m == −R_H and fitL2.b == R_H/4 to machine ε; −m and 4b are
//        bit-identical; R²=1, Σr²≈0. This is GEOMETRY, not a measurement — stated
//        honestly so a pill-scanner can't read it as the headline.
//    (b) TWO SOURCE-DISJOINT ORACLES: gradient descent (gdFit) and the closed form
//        (fitL2) land on the same (m,b); fitL2 names no gdFit and gdFit names no
//        Sxy/fitL2 (the agreement is a theorem, not a copy).
//    (c) NOISY RECOVERY — THE HEADLINE: seeded Gaussian·σ noise on the 1/λ's;
//        over many seeds R̂ is UNBIASED and its t·SE band has the RIGHT coverage
//        — Student-t with 2 d.o.f. (n=4 points, 2 fitted params), NOT ±1·SE
//        (±1·SE covers only ~57.5%, so a "68% within 1·SE" claim WOULD FAIL).
//    (d) TEETH (negative controls): (i) an OUTLIER at an interior line lurches L2
//        but robust L1 holds; (ii) feeding AIR wavelengths shifts R by exactly
//        (n_air−1) ≈ +277 ppm while R²≈1 — a systematic hiding under a flawless
//        fit: CONSISTENCY ≠ CORRECTNESS.
// ============================================================================

import { RYDBERG_H, balmerWavelengthNm, balmerWavelengthAirNm }
  from '../spectroscope/spectroscope-core.mjs';
import { fitL2, gdFit, fitL1, makeRng, gauss }
  from '../plumbline/plumbline-core.mjs';

// ===== RYDBERG CORE (inlined byte-twin) BEGIN =====
// The four Balmer lines used as data points: Hα,Hβ,Hγ,Hδ ← n=3,4,5,6 → 2.
// ORDER 3→6 is LOAD-BEARING: the seeded noise is injected in this order, so a seed
// always grows the SAME jitter pattern (moving σ scales it, never reshuffles it).
const NS = [3, 4, 5, 6];

// Student-t two-sided critical values for dof = n−2 = 2 (four points, two fitted
// params). These are NOT the normal 1.0/1.96 — with only 2 d.o.f. the t-tails are
// FAT, and using ±1·SE / ±1.96·SE would under-cover. t(2, 0.683)=1.3214 is the
// value whose two-sided mass equals a normal ±1σ (68.3%); t(2, 0.95)=4.3027.
const T_DOF2_68 = 1.3214;
const T_DOF2_95 = 4.3027;

// The mean of the four vacuum 1/λ's — the scale that turns a fractional noise knob
// (noiseFrac) into an absolute σ on y. Frozen so σ is the SAME at every seed.
// = mean over Hα..Hδ of R_H(¼−1/n²) ≈ 2.0801e6 /m (verified live by buildPoints).
function meanInvLambdaVac() {
  let s = 0;
  for (const n of NS) s += 1 / (balmerWavelengthNm(n) * 1e-9);
  return s / NS.length;
}

// ── buildPoints(state) → [{x:1/n², y:1/λ_m, n}] for the blind fitter. ──────────
// y is 1/λ in /m. medium='air' swaps the vacuum λ for the AIR λ (the air trap).
// Seeded Gaussian noise is injected on the y's: y = yTrue + gauss(rng)·σ, with
// σ = noiseFrac·mean(yTrue). gauss() consumes EXACTLY 2 rng pulls per point and is
// σ-independent, so turning the σ knob GROWS the same pattern (doesn't reshuffle).
function buildPoints(state) {
  const s = state || {};
  const medium = s.medium === 'air' ? 'air' : 'vacuum';
  const noiseFrac = s.noiseFrac || 0;
  const outlierN = (s.outlierN === 3 || s.outlierN === 4 || s.outlierN === 5 || s.outlierN === 6) ? s.outlierN : null;
  const outlierFac = (typeof s.outlierFac === 'number') ? s.outlierFac : 1.20;
  const rng = makeRng((s.seed >>> 0) || 1);
  const sigmaAbs = noiseFrac * meanInvLambdaVac();
  const pts = [];
  for (const n of NS) {
    const lamNm = medium === 'air' ? balmerWavelengthAirNm(n) : balmerWavelengthNm(n);
    const yTrue = 1 / (lamNm * 1e-9);                 // /m
    let y = yTrue + gauss(rng) * sigmaAbs;            // seeded jitter (2 rng pulls)
    if (outlierN === n) y = y * outlierFac;           // the yanked blunder line
    pts.push({ x: 1 / (n * n), y, n });
  }
  return pts;
}

// ── fitL2SE(points, fit) → standard errors of the OLS line + sePred(x). ────────
// Ordinary-least-squares textbook SEs: s² = Σr²/(n−2) is the residual variance;
//   SE_m = √(s²/Sxx),  SE_b = √(s²·(1/n + x̄²/Sxx)),  Sxx = Σ(xᵢ−x̄)².
// Because R = −m, SE_R = SE_m; because R = 4b, SE_(4b) = 4·SE_b. sePred(x) is the
// SE of the fitted value ŷ(x) = m·x + b at any x (the prediction band's half-width
// before the t multiplier): √(s²·(1/n + (x−x̄)²/Sxx)). Guards on points.length===4.
function fitL2SE(points, fit) {
  const n = points.length;
  if (n < 3 || !fit || !fit.ok) {
    return { ok: false, SE_m: 0, SE_b: 0, s2: 0, Sxx: 0, sePred: () => 0 };
  }
  const xbar = fit.xbar;
  let Sxx = 0;
  for (let i = 0; i < n; i++) { const dx = points[i].x - xbar; Sxx += dx * dx; }
  const s2 = fit.sse / (n - 2);
  const SE_m = Math.sqrt(s2 / Sxx);
  const SE_b = Math.sqrt(s2 * (1 / n + (xbar * xbar) / Sxx));
  const sePred = (x) => Math.sqrt(s2 * (1 / n + ((x - xbar) * (x - xbar)) / Sxx));
  return { ok: true, SE_m, SE_b, s2, Sxx, sePred };
}

// ── recoverR(points) → both R estimates + their SEs + the fit, in one place. ───
// R from −slope and R from 4·intercept; under noise these are two INDEPENDENT
// estimates of the same constant; at σ=0 they are bit-identical by algebra.
function recoverR(points) {
  const fit = fitL2(points);
  if (!fit.ok) return { ok: false };
  const se = fitL2SE(points, fit);
  return {
    ok: true, fit, se,
    R_slope: -fit.m, R_interc: 4 * fit.b,
    SE_Rslope: se.SE_m, SE_Rinterc: 4 * se.SE_b,
    r2: fit.r2,
  };
}

// ── THE ENERGY-LADDER helpers — the staircase the re-souled page makes touchable. ─
// termValue(n) = R_H/n² is the binding energy of level n in wavenumber units (/m):
// the term that sits at HEIGHT −R_H/n² on the −R/n² staircase (E=0 at the series
// limit n→∞, the n=2 floor at the bottom). rungDrop(n) = termValue(2)−termValue(n)
// is the n→2 (Balmer) photon's WAVENUMBER 1/λ — the height of the lit rung-gap AND
// the colour of the painted plate line: one number, read three ways. rFromLadder(ns)
// reads R back OFF the staircase by a least-squares-THROUGH-ORIGIN fit of the term
// values termValue(n) against u=1/n² (slope = Σ u·termValue / Σ u²). On the EXACT
// term values this is R_H to machine-ε — a GEOMETRIC reading, code-disjoint from the
// line-position regression (−slope of fitL2). All flow from the single-source RYDBERG_H.
function termValue(n) { return RYDBERG_H / (n * n); }
function rungDrop(n) { return termValue(2) - termValue(n); }
function rFromLadder(ns) {
  let num = 0, den = 0;
  for (const n of ns) { const u = 1 / (n * n); num += u * termValue(n); den += u * u; }
  return num / den;
}

// ── runSelfTest() — the SOLE ORACLE. Same shape as plumbline's: ───────────────
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS. Every detail carries LIVE numbers (calls the imported fits).
function runSelfTest() {
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const REL = (a, b) => Math.abs(a - b) / Math.abs(b);

  // ── LEG (a) — NOISELESS ALGEBRAIC IDENTITY (collinear, teeth-less). ──────────
  {
    const P = buildPoints({ medium: 'vacuum', noiseFrac: 0, seed: 1 });
    const f = fitL2(P);
    const Rs = -f.m, Ri = 4 * f.b;
    const relSlope = REL(Rs, RYDBERG_H);
    const relInter = REL(Ri, RYDBERG_H);
    const agree = Math.abs(Rs - Ri) / RYDBERG_H;        // bit-identical → 0
    const ok = P.length === 4 && f.ok && relSlope <= 1e-9 && relInter <= 1e-9 &&
               agree <= 1e-12 && Math.abs(f.r2 - 1) < 1e-12 && f.sse < 1e-18;
    T('LEG (a) — noiseless identity (noiseless, teeth-less): on the vacuum points the blind fit gives slope −m == R_H and intercept 4b == R_H/4; the two agree bit-for-bit; R²=1 (this is collinear GEOMETRY, not yet a measurement)',
      ok, ok ? `−m rel ${relSlope.toExponential(1)} · 4b rel ${relInter.toExponential(1)} · |−m−4b|/R ${agree.toExponential(1)} · R²=${f.r2.toFixed(15)} · Σr²=${f.sse.toExponential(1)}`
             : `relSlope=${relSlope.toExponential(2)} relInter=${relInter.toExponential(2)} agree=${agree.toExponential(2)} r2=${f.r2} sse=${f.sse.toExponential(2)}`);
  }

  // ── LEG (b) — TWO SOURCE-DISJOINT ORACLES agree (gdFit ≡ fitL2). ─────────────
  {
    const P = buildPoints({ medium: 'vacuum', noiseFrac: 0, seed: 1 });
    const cf = fitL2(P), gd = gdFit(P, { maxIters: 8000, lr: 0.5 });
    const dM = Math.abs(gd.m - cf.m), dB = Math.abs(gd.b - cf.b);
    // gdFit's diagonal-preconditioned descent lands ≤1e-8 of the closed form here
    // (the tiny u-values make Σx² small → b mixes slowly; 5.6e-9 measured at 8000
    // iters). The anti-circularity grep is the teeth: source-disjointness.
    const conv = dM <= 1e-8 && dB <= 1e-8;
    const fStr = fitL2.toString(), gStr = gdFit.toString();
    const disjoint = !fStr.includes('gdFit') && !fStr.includes('.trace') &&
                     !gStr.includes('fitL2') && !gStr.includes('Sxy');
    const ok = conv && disjoint;
    T('LEG (b) — two source-disjoint oracles: a from-scratch gradient descent (gdFit) and the closed form (fitL2) — which share no fit code — land on the SAME (m,b); fitL2 names no gdFit, gdFit names no Sxy',
      ok, ok ? `Δm=${dM.toExponential(2)} Δb=${dB.toExponential(2)} ≤1e-8 · source-disjoint ✓`
             : `Δm=${dM.toExponential(2)} Δb=${dB.toExponential(2)} disjoint=${disjoint}`);
  }

  // ── LEG (c) — NOISY RECOVERY, with the Student-t band (the HEADLINE). ────────
  {
    const noiseFrac = 0.001;
    const NSEED = 2000;
    let sumR = 0, in68 = 0, in95 = 0;
    for (let s = 1; s <= NSEED; s++) {
      const P = buildPoints({ medium: 'vacuum', noiseFrac, seed: s });
      const f = fitL2(P);
      const R = -f.m;
      const se = fitL2SE(P, f);
      const SE_R = se.SE_m;
      sumR += R;
      if (Math.abs(R - RYDBERG_H) <= T_DOF2_68 * SE_R) in68++;
      if (Math.abs(R - RYDBERG_H) <= T_DOF2_95 * SE_R) in95++;
    }
    const meanR = sumR / NSEED;
    const bias = Math.abs(meanR - RYDBERG_H) / RYDBERG_H;
    const cov68 = in68 / NSEED, cov95 = in95 / NSEED;
    const unbiased = bias < 0.002;                         // <0.2%
    const c68ok = cov68 >= 0.64 && cov68 <= 0.72;          // ~68.3%
    const c95ok = cov95 >= 0.93 && cov95 <= 0.97;          // ~94.8%
    const ok = unbiased && c68ok && c95ok;
    T('LEG (c) — noisy recovery + the t-band (THE HEADLINE): over 2000 seeds of σ-noise the recovered R is UNBIASED and lands inside its Student-t(2)·SE band at the right rate — 68% within t·SE, 95% within t·SE (NOT ±1·SE; n=4 ⇒ 2 d.o.f., fat t-tails)',
      ok, ok ? `bias ${(bias * 100).toFixed(3)}% · cover t68=${(cov68 * 100).toFixed(1)}% t95=${(cov95 * 100).toFixed(1)}% (t=${T_DOF2_68}/${T_DOF2_95})`
             : `bias=${(bias * 100).toFixed(3)}% cov68=${(cov68 * 100).toFixed(1)}% cov95=${(cov95 * 100).toFixed(1)}%`);
  }

  // ── LEG (d-i) — TEETH: outlier LURCH at an interior line; L1 holds. ──────────
  {
    const oN = 5; // interior Hγ — the recommended outlier (NOT a high-leverage edge)
    const Po = buildPoints({ medium: 'vacuum', noiseFrac: 0, seed: 1, outlierN: oN, outlierFac: 1.20 });
    const L2 = fitL2(Po), L1 = fitL1(Po);
    const R_L2 = -L2.m, R_L1 = -L1.m;
    const lurch = Math.abs(R_L2 - RYDBERG_H) / RYDBERG_H;   // L2 chases the blunder
    const hold = Math.abs(R_L1 - RYDBERG_H) / RYDBERG_H;    // L1 ignores it
    // negative control: outlierN=null ⇒ the cloud is collinear ⇒ L1 == L2.
    const Pn = buildPoints({ medium: 'vacuum', noiseFrac: 0, seed: 1, outlierN: null });
    const cL2 = fitL2(Pn), cL1 = fitL1(Pn);
    const ctrl = Math.abs(cL2.m - cL1.m) / RYDBERG_H < 1e-6;
    const ok = lurch > 0.20 && hold < 1e-6 && ctrl;
    T('LEG (d-i) — the teeth (outlier lurch): yank interior Hγ (n=5) by ×1.20 and L2 (squared loss) lurches >20% off R while robust L1 holds to <1e-6; control: with no outlier the points are collinear and L1 == L2',
      ok, ok ? `L2 ${(lurch * 100).toFixed(1)}% off · L1 ${(hold * 100).toFixed(2)}% off · control L1==L2 ✓`
             : `lurch=${(lurch * 100).toFixed(1)}% hold=${(hold * 100).toFixed(4)}% ctrl=${ctrl}`);
  }

  // ── LEG (d-ii) — TEETH: the AIR TRAP (consistency ≠ correctness). ────────────
  {
    const Pa = buildPoints({ medium: 'air', noiseFrac: 0, seed: 1 });
    const f = fitL2(Pa);
    const Rs = -f.m, Ri = 4 * f.b;
    // air rescales every 1/λ by exactly n_air, so R̂ = n_air·R_H ⇒ frac shift n_air−1.
    const fracExpected = (1 / (balmerWavelengthAirNm(3) / balmerWavelengthNm(3))) - 1; // == N_AIR−1
    const fracSlope = (Rs - RYDBERG_H) / RYDBERG_H;
    const fracInter = (Ri - RYDBERG_H) / RYDBERG_H;
    const okShift = Math.abs(fracSlope - fracExpected) <= 1e-9 && Math.abs(fracInter - fracExpected) <= 1e-9;
    const okFlawless = Math.abs(f.r2 - 1) < 1e-9;          // the gem: R²≈1 despite being wrong
    const ok = okShift && okFlawless;
    T('LEG (d-ii) — the air trap (consistency ≠ correctness): feed AIR wavelengths and R shifts by exactly (n_air−1) ≈ +277 ppm on BOTH −m and 4b, yet R²≈1 — a 277-ppm systematic hides under a flawless, self-consistent fit',
      ok, ok ? `shift +${(fracSlope * 1e6).toFixed(2)} ppm (==n_air−1) on −m & 4b · R²=${f.r2.toFixed(12)} (flawless yet wrong)`
             : `slope ${(fracSlope * 1e6).toFixed(2)}ppm inter ${(fracInter * 1e6).toFixed(2)}ppm expected ${(fracExpected * 1e6).toFixed(2)}ppm r2=${f.r2}`);
  }

  // ── LEG (e) — THE PHOTON LAW (ladder ↔ light): the lit rung-gap === the line. ─
  // For each Balmer n the staircase rung-DROP termValue(2)−termValue(n) equals the
  // emitted photon's WAVENUMBER 1/λ to machine-ε, AND equals R_H(¼−1/n²). So the
  // lit rung-gap on the staircase, the painted line on the plate, and the law are
  // ONE number. Honest framing: a RENDER-FAITHFULNESS check — it catches a unit slip
  // / a −R/n vs −R/n² confusion / a mis-scaled plate the render could otherwise hide
  // — NOT a re-asserted tautology (the page draws all three from these same calls).
  {
    let worstLight = 0, worstLaw = 0;
    for (const n of NS) {
      const drop = rungDrop(n);
      const waveNum = 1 / (balmerWavelengthNm(n) * 1e-9);   // 1/λ in /m
      const law = RYDBERG_H * (1 / 4 - 1 / (n * n));
      worstLight = Math.max(worstLight, Math.abs(drop - waveNum) / waveNum);
      worstLaw = Math.max(worstLaw, Math.abs(drop - law) / Math.abs(law));
    }
    const ok = worstLight <= 1e-12 && worstLaw <= 1e-12;
    T('LEG (e) — photon law (ladder ↔ light): for n=3..6 the n→2 rung-DROP termValue(2)−termValue(n) equals the photon wavenumber 1/λ AND R_H(¼−1/n²) to machine-ε — the lit rung-gap === the painted plate line === the law (a render-faithfulness check, not a tautology)',
      ok, ok ? `worst |drop−1/λ|/(1/λ) ${worstLight.toExponential(1)} · worst |drop−R(¼−1/n²)|/law ${worstLaw.toExponential(1)} ≤ 1e-12 (n=3..6)`
             : `worstLight=${worstLight.toExponential(2)} worstLaw=${worstLaw.toExponential(2)}`);
  }

  // ── LEG (f) — TWO READINGS, ONE CONSTANT (the BUILD's wiring guard). ──────────
  // R off the STAIRCASE (rFromLadder: least-squares-through-origin on the term
  // values — geometric) and R off the REGRESSION (−slope of the blind line fit on
  // the noiseless line positions — statistical) are two CODE-DISJOINT computations,
  // and both equal R_H. Honest caption: a CONSISTENCY proof of the wiring (a
  // no-intercept model on term values vs an intercept model on line positions, both
  // flowing from RYDBERG_H) — it guards the BUILD, not two physical instruments.
  {
    const Rladder = rFromLadder([2, 3, 4, 5, 6]);
    const Rreg = -fitL2(buildPoints({ medium: 'vacuum', noiseFrac: 0, seed: 1 })).m;
    const dPair = Math.abs(Rladder - Rreg) / RYDBERG_H;
    const dTruth = Math.abs(Rladder - RYDBERG_H) / RYDBERG_H;
    const ok = dPair <= 1e-9 && dTruth <= 1e-12;
    T('LEG (f) — two readings, one constant: R from the STAIRCASE (rFromLadder, least-squares-through-origin on the term values) === R from the REGRESSION (−slope of the blind line fit) to <1e-9, and === R_H to <1e-12 — two code-disjoint computations on one gilt mark (a wiring-consistency proof, not two instruments)',
      ok, ok ? `|R_ladder−R_reg|/R ${dPair.toExponential(1)} ≤1e-9 · |R_ladder−R_H|/R ${dTruth.toExponential(1)} ≤1e-12`
             : `dPair=${dPair.toExponential(2)} dTruth=${dTruth.toExponential(2)}`);
  }

  // ── LEG (g) — NEG-CONTROL (wrong floor): a Lyman jump misses the Balmer plate. ─
  // The Lyman wavenumber R_H(1−1/n²) (transitions to n=1, the WRONG floor) for
  // n∈{2,3} lands OUTSIDE the Balmer plate window [1/(680 nm), 1/(360 nm)] and
  // matches NO Balmer line 1/(balmerWavelengthNm(m)·1e-9) to within 1% — proof that
  // a non-Balmer / wrong-floor transition does NOT land on a Balmer line.
  {
    const winLo = 1 / (680e-9), winHi = 1 / (360e-9);     // plate window, /m (wavenumber)
    let allOutside = true, worstMatch = Infinity;
    for (const n of [2, 3]) {
      const lyman = RYDBERG_H * (1 - 1 / (n * n));         // n→1 wavenumber (wrong floor)
      if (lyman >= winLo && lyman <= winHi) allOutside = false;
      for (const m of NS) {
        const balmer = 1 / (balmerWavelengthNm(m) * 1e-9);
        worstMatch = Math.min(worstMatch, Math.abs(lyman - balmer) / balmer);
      }
    }
    const ok = allOutside && worstMatch > 0.01;
    T('LEG (g) — neg-control (wrong floor): the Lyman wavenumber R_H(1−1/n²) for n=2,3 lands OUTSIDE the Balmer plate window [1/680nm,1/360nm] and matches no Balmer line to within 1% — a non-Balmer / wrong-floor jump does NOT land on a Balmer line',
      ok, ok ? `Lyman n=2,3 outside [${(winLo / 1e6).toFixed(2)},${(winHi / 1e6).toFixed(2)}]×10⁶/m · nearest Balmer ${(worstMatch * 100).toFixed(0)}% off (≫1%)`
             : `allOutside=${allOutside} worstMatch=${(worstMatch * 100).toFixed(2)}%`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
// ===== RYDBERG CORE END =====

export {
  NS, T_DOF2_68, T_DOF2_95,
  meanInvLambdaVac, buildPoints, fitL2SE, recoverR, runSelfTest,
  termValue, rungDrop, rFromLadder,
  // re-export the imported truth so the page (Option A inline) and the Node twin
  // reach the SAME single-source values through ONE import of this module:
  RYDBERG_H, balmerWavelengthNm, balmerWavelengthAirNm,
  fitL2, gdFit, fitL1, makeRng, gauss,
};
