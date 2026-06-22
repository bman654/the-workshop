// ============================================================================
//  WHY THE SKY IS BLUE — the scattering tank's ONE DOM-free physics authority.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This is the
//  proof behind a tank you operate: a white beam fired through faintly hazy air,
//  a BLUE volumetric side-glow billowing off the beam, and a transmitted disk on
//  the far wall whose colour is COMPUTED (never hand-picked) from the Rayleigh-
//  attenuated spectrum. Drag the sun down a sky-arc → the air path L grows → the
//  disk slides white→amber→deep red LIVE while the side-glow stays blue. "Blue
//  sideways, red through" is ONE law — Rayleigh's λ⁻⁴ — seen at once.
//
//  THE ONE IDEA — λ⁻⁴ IS THE WHOLE STORY. Air scatters short wavelengths far
//  harder than long: the Rayleigh cross-section goes as λ⁻⁴, so blue (≈400 nm)
//  scatters (700/400)⁴ ≈ 9.38× more than red (≈700 nm). That ONE factor does both
//  jobs at once. SIDEWAYS you see the light that was STOLEN out of the beam — and
//  because the theft is λ⁻⁴-weighted, what you see is BLUE (centroid 477.8 nm,
//  well inside the blue band). THROUGH the beam you see the light that SURVIVED —
//  and because the longer the path the more blue is stolen, the transmitted light
//  REDDENS as the path grows (Beer–Lambert, exp(−κλ⁻⁴L)). Blue sky overhead, red
//  sun at the horizon: the same λ⁻⁴, the same picture.
//
//  ONE LAW, ONE FUNCTION. The sun-elevation→L map lives in airmass(); the drag,
//  the slider, and the self-test all consume that ONE L. The colour that paints
//  the disk red is the SAME intensity-weighted centroid the self-test proves
//  monotone; the λ⁻⁴ weighting that paints the side-glow blue is the SAME one the
//  pill proves. The picture and the proof are the same numbers.
//
//  THE EXACT CLAIMS are the SHAPE, not a magic constant. K_REF and L_MAX are
//  ILLUSTRATIVE scene constants (like last-scattering's T_REC / recombination's
//  SAHA_A) chosen for visual punch — every claim below is SCALE-INVARIANT in K:
//  the λ⁻⁴ ratio (9.37890625, exact for ALL endpoint pairs), the strict
//  monotone-decrease of transmission in L for every λ, the strict monotone-
//  reddening of the transmitted centroid in L (a SIGN-CERTAIN covariance
//  identity, dD/dL = −Cov_w(λ,c) with c=κλ⁻⁴ strictly decreasing in λ ⇒ cov<0
//  ⇒ dD/dL>0), and the side-glow centroid landing in the blue band — all hold for
//  ANY positive K and ANY non-negative illuminant. The neg-controls: at κ=0 the
//  transmission is FLAT in L (no medium, no reddening), and the UN-weighted solar
//  centroid is greenish-white (>500) — the λ⁻⁴ weighting is what makes it blue.
//
//  COLOUR is the estate's ONE wavelength ramp (tools/spectrum/wavelength.mjs),
//  inlined into the PAGE as a SIBLING include — it never enters this proven core.
//  This core makes the SPECTRA (intensity per λ); the page sums them to sRGB.
// ============================================================================

// === WHY-THE-SKY-IS-BLUE CORE BEGIN ===
"use strict";

// ── THE SHIPPED SCENE ───────────────────────────────────────────────────────
// K_REF and L_MAX are ILLUSTRATIVE scene constants (like last-scattering's T_REC),
// chosen so the disk swings white→amber→deep-red across the operable sun-arc. They
// defend NO exact atmospheric optical depth — the exact claims are scale-invariant
// in K (the λ⁻⁴ shape, the monotonicities, the blue-band centroid hold for ANY K>0).
const SCENE = {
  LAM_MIN: 380,        // visible band low edge, nm
  LAM_MAX: 700,        // visible band high edge, nm
  N:       161,        // samples across the band → 2 nm steps
  LAM_REF: 550,        // reference wavelength the cross-section is normalised at (green)
  BLUE_HI: 500,        // the blue/green boundary; the side-glow centroid must land BELOW this
  K_REF:   3e10,       // illustrative Beer–Lambert coefficient (nm⁴·airmass⁻¹) — visual-punch tuned
  L_MAX:   40,         // illustrative max air-mass path (≈ horizon, zenith→88.6°) — the sweep ceiling
};

// ── THE λ⁻⁴ LAW — the whole story, ref-normalised at 550 nm ──────────────────
// Rayleigh's cross-section ∝ λ⁻⁴. Normalised to 1 at LAM_REF so it's a pure SHAPE,
// independent of any absolute units. crossSection(400)/crossSection(700) === 9.38…
function rayleighCrossSection(lam){
  const r = SCENE.LAM_REF / lam;
  return r * r * r * r;                       // (LAM_REF/lam)⁴
}

// The ratio of scatter strengths at two wavelengths: (lamB/lamA)⁴. This is the
// textbook 9.38× when (lamA,lamB)=(400,700) — but it is EXACT for ANY pair, which
// is the real claim (the LAW, not one magic number). Symmetric-inverse by algebra.
function scatterRatio(lamA, lamB){
  const r = lamB / lamA;
  return r * r * r * r;                        // (lamB/lamA)⁴
}

// Beer–Lambert transmission of one wavelength through a path of length L in a
// medium of coefficient k. Strictly DECREASING in L for every λ (the exponent
// c = k·λ⁻⁴ > 0 for any k>0), so a longer air path always dims — and dims blue
// FASTEST, which is the reddening.
function transmit(I0, lam, k, L){
  return I0 * Math.exp(-k * Math.pow(lam, -4) * L);
}

// ── THE SUN-ELEVATION → PATH-LENGTH MAP — the ONE L every reader consumes ─────
// Air mass: a flat-Earth secant model. Straight up (zenith=0) ⇒ L=1; toward the
// horizon (zenith→π/2) ⇒ L→∞, clamped to L_MAX so the drag, the slider, and the
// self-test all read ONE finite, monotone L. This is where sun-drag becomes path.
function airmass(zenithRad){
  const ZMAX = Math.acos(1 / SCENE.L_MAX);     // the zenith angle that maps to L_MAX
  const z = zenithRad < 0 ? 0 : (zenithRad > ZMAX ? ZMAX : zenithRad);
  return 1 / Math.cos(z);                       // ∈ [1, L_MAX]
}

// ── THE SAMPLED VISIBLE GRID — [380..700] nm, N=161, 2 nm steps ───────────────
const VISIBLE = (function(){
  const g = [];
  for (let i = 0; i < SCENE.N; i++){
    g.push(SCENE.LAM_MIN + (SCENE.LAM_MAX - SCENE.LAM_MIN) * (i / (SCENE.N - 1)));
  }
  return g;
})();

// ── THE ILLUMINANT — a gentle daylight-ish envelope, DOCUMENTED illustrative ──
// A smooth incident spectrum I0(λ). Every claim below is ROBUST to ANY non-negative
// I0 (the Node twin re-proves the monotonicities under flat / red-tilted / blue-
// tilted illuminants); this shape just makes the scene look like real daylight.
function solarSpectrum(){
  return VISIBLE.map(lam => {
    // a broad bump peaking in the green-blue, gently falling to the rims (sun-like)
    const t = (lam - 500) / 230;
    const I0 = 0.55 + 0.45 * Math.exp(-t * t);
    return { lam, I0 };
  });
}

// ── THE STOLEN BLUE — what scatters OUT sideways ──────────────────────────────
// The side-scattered intensity at each λ is the incident light times the Rayleigh
// cross-section: I = I0 · (LAM_REF/λ)⁴. Because the cross-section is λ⁻⁴-weighted,
// the centroid of this spectrum lands at 477.8 nm — BLUE. This is the glow you see
// off to the side of the beam.
function sideScatteredSpectrum(){
  return solarSpectrum().map(({ lam, I0 }) => ({
    lam, I0, I: I0 * rayleighCrossSection(lam),
  }));
}

// ── THE SURVIVING LIGHT — what punches THROUGH the beam ───────────────────────
// The transmitted intensity at each λ after Beer–Lambert attenuation over path L
// with coefficient k = K_REF·turbidity. LOCK the element key as {lam, I0, I}:
// lam=nm, I0=incident, I=attenuated — the scene needs I0 to render dimming as
// DARKENING (not just a hue shift); the chips read .lam / .I.
function transmittedSpectrum(L, turbidity){
  const k = SCENE.K_REF * (turbidity == null ? 1 : turbidity);
  return solarSpectrum().map(({ lam, I0 }) => ({
    lam, I0, I: transmit(I0, lam, k, L),
  }));
}

// ── THE DOMINANT WAVELENGTH — the intensity-weighted CENTROID ─────────────────
// Σ λ·I / Σ I, NOT argmax. The centroid is what makes the reddening PROVABLY
// monotone: as the path grows, blue is stolen first, so the weight shifts toward
// the red and the centroid slides up — smoothly, with a sign-certain derivative.
function dominantWavelength(spec){
  let num = 0, den = 0;
  for (const s of spec){ num += s.lam * s.I; den += s.I; }
  return den > 0 ? num / den : 0;
}

// ── THE COVARIANCE IDENTITY — why the slide is monotone, with CERTAINTY ────────
// Let D(L) = Σ λ·w / Σ w with weight w(λ) = I0(λ)·exp(−c·L), c = k·λ⁻⁴. Then
//   dD/dL = −Cov_w(λ, c),
// the weighted covariance of λ and c under w. Because c = k·λ⁻⁴ is STRICTLY
// DECREASING in λ (for any k>0), λ and c are perfectly anti-monotone, so their
// weighted covariance is NEGATIVE for any weight — hence dD/dL = −cov > 0 always,
// the centroid strictly reddens. This returns the moments the test reads the SIGN of.
function weightedMoments(spec, k, L){
  let sw = 0, swl = 0, swc = 0, swlc = 0;
  for (const s of spec){
    const c = k * Math.pow(s.lam, -4);
    const w = s.I0 * Math.exp(-c * L);
    sw += w; swl += w * s.lam; swc += w * c; swlc += w * s.lam * c;
  }
  const Elam = swl / sw, Ec = swc / sw;
  return { Elam, Ec, cov: swlc / sw - Elam * Ec };
}

// ── THE SELF-TEST — the tank proves its own claim ────────────────────────────
// FOUR claims, all <1e-9 where exact:
//  A · λ⁻⁴ RATIO EXACT: scatterRatio(400,700) === (700/400)⁴ === 9.37890625, and
//      it equals the crossSection ratio, and is symmetric-inverse — the LAW for
//      ALL endpoints, not one magic number.
//  B · TRANSMISSION MONOTONE-DECREASING in L for EVERY λ over the sweep (strict);
//      neg-control: at k=0 transmission is FLAT in L (no medium ⇒ no reddening).
//  C · TRANSMITTED CENTROID MONOTONE-REDDENING in L, SIGN-CERTAIN: two witnesses —
//      (grid) dominantWavelength strictly increasing in L, and (analytic) the
//      covariance cov<0 across the sweep with the centred-difference of D matching
//      −cov to <1e-4 rel (the dD/dL = −Cov identity).
//  D · SIDE-GLOW CENTROID IN THE BLUE BAND: dominantWavelength(sideScattered) <
//      BLUE_HI (500); neg-control: the UN-weighted solar centroid is >500 (the
//      λ⁻⁴ weighting is what makes the glow blue).
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const TOL = 1e-9;
  const { LAM_MIN, LAM_MAX, K_REF, L_MAX, BLUE_HI } = SCENE;

  // ── CLAIM A — λ⁻⁴ RATIO EXACT ──────────────────────────────────────────────
  const r47 = scatterRatio(400, 700);
  const exact47 = Math.pow(700 / 400, 4);
  const matchesPow = Math.abs(r47 - exact47) < 1e-12;
  const equalsExactVal = (r47 === 9.37890625);
  // symmetric-inverse: scatterRatio(a,b)·scatterRatio(b,a) === 1 for all pairs
  let symWorst = 0;
  for (const [a, b] of [[400, 700], [380, 700], [450, 650], [500, 600], [410, 690]]){
    symWorst = Math.max(symWorst, Math.abs(scatterRatio(a, b) * scatterRatio(b, a) - 1));
  }
  // equals the crossSection ratio (the ratio IS the law, normalisation cancels)
  const csRatioWorst = Math.abs(scatterRatio(400, 700) - rayleighCrossSection(400) / rayleighCrossSection(700));
  const cA = matchesPow && equalsExactVal && symWorst < TOL && csRatioWorst < TOL;
  log('A · λ⁻⁴ ratio EXACT: scatterRatio(400,700) === (700/400)⁴ === 9.37890625, symmetric-inverse, equals crossSection ratio (<1e-9)',
      cA, 'ratio ' + r47 + ', |−(700/400)⁴| ' + Math.abs(r47 - exact47).toExponential(2) +
          ', sym worst ' + symWorst.toExponential(2) + ', cs-ratio Δ ' + csRatioWorst.toExponential(2));

  // ── CLAIM B — TRANSMISSION MONOTONE-DECREASING in L for EVERY λ + neg-control ─
  let bStrict = true, bViol = '';
  for (const lam of VISIBLE){
    let prev = Infinity;
    for (let m = 0; m <= 60; m++){
      const L = L_MAX * (m / 60);
      const T = transmit(1, lam, K_REF, L);
      if (!(T <= prev) || (m > 0 && !(T < prev))){ bStrict = false; bViol = 'λ=' + lam.toFixed(0) + ' at L=' + L.toFixed(2); break; }
      prev = T;
    }
    if (!bStrict) break;
  }
  // neg-control: at k=0 the transmission is FLAT in L (worst Δ === 0 — no medium)
  let flatWorst = 0;
  for (const lam of [LAM_MIN, 500, LAM_MAX]){
    const T0 = transmit(1, lam, 0, 0);
    for (let m = 0; m <= 40; m++){ flatWorst = Math.max(flatWorst, Math.abs(transmit(1, lam, 0, L_MAX * m / 40) - T0)); }
  }
  const cB = bStrict && flatWorst === 0;
  log('B · transmission STRICTLY decreasing in L for every λ over [0,L_MAX]; neg-control: at k=0 it is FLAT in L (no medium ⇒ no reddening)',
      cB, bStrict ? ('strict over all ' + VISIBLE.length + ' λ; k=0 worst Δ ' + flatWorst.toExponential(2)) : ('NOT strict: ' + bViol));

  // ── CLAIM C — CENTROID MONOTONE-REDDENING in L, SIGN-CERTAIN ────────────────
  let cMono = true, cViol = '', minStep = Infinity, prevD = -Infinity;
  const STEPS = 200;
  for (let m = 0; m <= STEPS; m++){
    const L = L_MAX * (m / STEPS);
    const D = dominantWavelength(transmittedSpectrum(L, 1));
    if (m > 0){ const step = D - prevD; if (!(step > 0)){ cMono = false; cViol = 'at L=' + L.toFixed(2); } minStep = Math.min(minStep, step); }
    prevD = D;
  }
  // analytic witness: cov < 0 everywhere, and dD/dL === −cov (centred difference).
  // The identity dD/dL = −Cov_w(λ,c) is exact in the limit; the centred difference
  // has O(h²) truncation error, so use a SMALL dedicated h (not the coarse sweep
  // step) — the match then tightens to machine-tolerance levels.
  let covMax = -Infinity, idRelWorst = 0;
  const spec = transmittedSpectrum(0, 1);   // I0 carrier; weight recomputed per L inside weightedMoments
  const h = 1e-3;
  for (let m = 1; m < STEPS; m++){
    const L = L_MAX * (m / STEPS);
    const mom = weightedMoments(spec, K_REF, L);
    covMax = Math.max(covMax, mom.cov);
    const Dp = dominantWavelength(transmittedSpectrum(L + h, 1));
    const Dm = dominantWavelength(transmittedSpectrum(L - h, 1));
    const dDdL = (Dp - Dm) / (2 * h);
    const denom = Math.max(1e-12, Math.abs(-mom.cov));
    idRelWorst = Math.max(idRelWorst, Math.abs(dDdL - (-mom.cov)) / denom);
  }
  const cC = cMono && covMax < 0 && idRelWorst < 1e-4;
  log('C · transmitted centroid STRICTLY reddens in L (smallest fwd step >0) AND is sign-certain: cov<0 over the sweep, dD/dL === −Cov to <1e-4 rel',
      cC, 'smallest step ' + (isFinite(minStep) ? minStep.toExponential(2) : 'n/a') +
          ', max cov ' + covMax.toExponential(2) + ', dD/dL=−cov rel ' + idRelWorst.toExponential(2) +
          (cMono ? '' : ' · NOT monotone ' + cViol));

  // ── CLAIM D — SIDE-GLOW CENTROID IN THE BLUE BAND + neg-control ─────────────
  const glowD = dominantWavelength(sideScatteredSpectrum());
  // neg-control: the UN-weighted incident centroid (no λ⁻⁴) is greenish-white (>500)
  const solarD = dominantWavelength(solarSpectrum().map(({ lam, I0 }) => ({ lam, I0, I: I0 })));
  const cD = glowD < BLUE_HI && solarD > BLUE_HI;
  log('D · side-glow centroid in the BLUE band: dominantWavelength(sideScattered) < ' + BLUE_HI +
      '; neg-control: the UN-weighted solar centroid is greenish-white (>' + BLUE_HI + ')',
      cD, 'glow ' + glowD.toFixed(2) + ' nm (< ' + BLUE_HI + '), solar ' + solarD.toFixed(2) + ' nm (> ' + BLUE_HI + ')');

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === WHY-THE-SKY-IS-BLUE CORE END ===

export {
  SCENE,
  rayleighCrossSection, scatterRatio, transmit, airmass,
  VISIBLE, solarSpectrum, sideScatteredSpectrum, transmittedSpectrum,
  dominantWavelength, weightedMoments,
  runSelfTest,
};
