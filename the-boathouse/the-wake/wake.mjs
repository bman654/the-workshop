/* ============================================================================
 *  THE WAKE  ·  the-boathouse/the-wake/  —  the shared model.
 *
 *  A boat pushing along deep water drags a wedge of waves behind it, and the
 *  wedge always opens at the same angle:  asin(1/3) = 19.4712 degrees.  A
 *  duckling and a supertanker make the same wedge.  Nothing about the boat is
 *  in that number and neither is its speed — it is a statement about WATER.
 *
 *  WHY.  In the boat's own frame the water streams past at U and the only
 *  waves that can stand still are the ones whose phase speed, resolved along
 *  the boat's track, equals U:
 *
 *        c(k) = U cos(theta)                                             (1)
 *
 *  for a wave whose crests are perpendicular to a direction theta off the
 *  track.  On deep water c = sqrt(g/k), so each theta names exactly one
 *  wavelength.  But the ENERGY of a deep-water wave does not travel at c: it
 *  travels at the group speed, which is c/2.  So in the boat's frame the wave
 *  made at angle theta is carried off along
 *
 *        ray = c_g * (cos theta, sin theta)  -  (U, 0)                   (2)
 *
 *  and the angle of that ray behind the boat is
 *
 *        tan(alpha) = r sin(t) cos(t) / (1 - r cos^2(t)),   r = c_g / c   (3)
 *
 *  With r = 1/2 that is  sin(t)cos(t)/(1+sin^2(t)), whose LARGEST value over
 *  all t is 1/(2 sqrt 2) at t = 35.264 deg.  Every ray lies inside
 *  atan(1/(2 sqrt 2)) = 19.4712 deg of the track, and the rays PILE UP at the
 *  edge (a caustic) — which is the bright cusp line you see on any pond.
 *
 *  The whole thing turns on r = c_g/c = 1/2, i.e. on dispersion.  Take the
 *  dispersion away and the law dies: in water shallow enough that every wave
 *  runs at sqrt(g h), r = 1 and (1)+(3) collapse to a MACH CONE of half angle
 *  asin(sqrt(gh)/U).  This module carries the general depth in one place — the
 *  exact relation c^2 = (g/k) tanh(k h) — so ONE function walks continuously
 *  from Kelvin's 19.47 deg wedge to a sonic boom on a sandbank.
 *
 *  SCALE-FREE.  Divide every length by 1/k0 = U^2/g and the pattern depends on
 *  exactly two dimensionless numbers:
 *        H = k0 h = g h / U^2 = 1 / Fr_h^2       (how deep the water is)
 *        B = k0 b = g b / U^2 = 1 / Fr_b^2       (how big the boat is)
 *  Nothing else.  Two boats at the same H and B leave the SAME PICTURE at
 *  different sizes.  Every function below takes H and B, never metres.
 *
 *  THE FIELD.  Linear (Havelock) theory for a Gaussian pressure patch of
 *  radius b riding the surface.  Fourier-transform the free-surface problem,
 *  take the residue at the pole (1), and the steady elevation is a
 *  superposition over theta alone:
 *
 *        zeta(X,Y) = SUM_t  A(t) . W(s) . sin( kappa(t) . s ),   s = X cos t + Y sin t
 *        A(t) = kappa^2 exp(-kappa^2 B^2/4) / [ tanh(kH) - kH sech^2(kH) ]
 *
 *  W(s) is the radiation condition — the residue is picked up only on the
 *  DOWNSTREAM side of each plane wave (s < 0; +X is ahead of the boat).  It is
 *  smoothed over SIGMA so the field and its exact derivatives are continuous;
 *  sin(kappa s) vanishes at s = 0 anyway, so the smoothing moves nothing.
 *
 *  WHAT IS CLAIMED, AND WHAT IS NOT.  The ANGLES are claimed: they come from
 *  the phase (1)-(3) and from nothing else — no amplitude, no prefactor, no
 *  boat.  The AMPLITUDE is a model and is labelled as one; the room normalises
 *  it away and never quotes a wave height.  The one place amplitude does
 *  matter is the BRIGHT ridge — the angle a photograph seems to show, which is
 *  narrower than 19.47 deg for a fast small boat (Rabaud & Moisy 2013) because
 *  a patch of size b cannot make waves much shorter than b.  That one is
 *  measured off the field, from the same numbers the room draws.
 *
 *  Node twin: `node the-boathouse/the-wake/wake.test.mjs`
 * ========================================================================== */

"use strict";

const G = 9.80665;

/* ── dispersion ──────────────────────────────────────────────────────────────
   kappa(theta, H): the dimensionless wavenumber k/k0 of the stationary wave
   travelling at angle theta, on water of dimensionless depth H.  It solves

        tanh(kappa H) / kappa = cos^2(theta)                              (1')

   The left side falls monotonically from H (kappa -> 0) to 0 (kappa -> inf),
   so there is a root iff cos^2 theta < H — that is, iff the water is deep
   enough (or the angle wide enough) to carry a wave that keeps up.  Above the
   critical speed (H < 1) the small angles are simply forbidden, and that
   absence is the whole of the supercritical wake.
   Returns null when no such wave exists. H === Infinity is the deep limit. */
function kappaOf(theta, H) {
  const c2 = Math.cos(theta) ** 2;
  if (c2 <= 0) return null;                       // theta = +-90 deg: no wave
  if (!isFinite(H)) return 1 / c2;                // deep: kappa = sec^2 theta
  if (c2 >= H) return null;                       // no wave keeps up at this angle
  let hi = 1 / c2;                                // deep root brackets from above
  let lo = hi * 1e-14;
  // f(kappa) = tanh(kappa H)/kappa - cos^2 theta, decreasing; f(lo) > 0 > f(hi)
  for (let i = 0; i < 90; i++) {
    const mid = Math.sqrt(lo * hi);               // bisect in log kappa
    const x = mid * H;
    const t = x > 20 ? 1 : Math.tanh(x);
    if (t / mid - c2 > 0) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

/* group speed / phase speed for a wave of dimensionless wavenumber kappa on
   dimensionless depth H.  1/2 in deep water, 1 in shallow. */
function groupRatio(kappa, H) {
  if (!isFinite(H)) return 0.5;
  const x = 2 * kappa * H;
  if (x > 30) return 0.5;
  if (x < 1e-6) return 1;
  return 0.5 * (1 + x / Math.sinh(x));
}

/* ── the ray angle, equation (3) ────────────────────────────────────────────
   Where the energy made at angle theta ends up, as an angle behind the boat.
   Depends on theta and H only — never on U, which is the whole point. */
function rayAngle(theta, H) {
  const kap = kappaOf(theta, H);
  if (kap === null) return null;
  const r = groupRatio(kap, H);
  const s = Math.sin(theta), c = Math.cos(theta);
  const den = 1 - r * c * c;                       // > 0 always: r <= 1, c^2 < 1...
  if (den <= 1e-12) return Math.PI / 2;
  return Math.atan2(r * s * c, den);
}

/* the smallest angle theta that carries a wave at all (0 unless supercritical) */
function thetaFloor(H) {
  if (!isFinite(H) || H >= 1) return 0;
  return Math.acos(Math.sqrt(H));                  // cos^2 theta = H
}

/* ── THE HALF ANGLE ─────────────────────────────────────────────────────────
   The outer edge of the wake: the largest ray angle any wave can reach.  A
   coarse scan (the function has one interior maximum, or its maximum sits on
   the supercritical edge) followed by a golden-section refinement. */
function halfAngle(H) {
  const t0 = thetaFloor(H), t1 = Math.PI / 2;
  const N = 4000;
  let bt = t0, bv = -1;
  for (let i = 0; i <= N; i++) {
    const t = t0 + (t1 - t0) * (i / N);
    const a = rayAngle(t, H);
    if (a !== null && a > bv) { bv = a; bt = t; }
  }
  // golden-section around the winning sample
  const span = (t1 - t0) / N;
  let a = Math.max(t0, bt - span), b = Math.min(t1, bt + span);
  const gr = (Math.sqrt(5) - 1) / 2;
  let c = b - gr * (b - a), d = a + gr * (b - a);
  const f = (t) => { const v = rayAngle(t, H); return v === null ? -1 : v; };
  let fc = f(c), fd = f(d);
  for (let i = 0; i < 90; i++) {
    if (fc > fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = f(c); }
    else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = f(d); }
  }
  const t = fc > fd ? c : d;
  const av = Math.max(bv, f(t));
  const th = f(t) >= bv ? t : bt;
  return { alpha: av, theta: th, kappa: kappaOf(th, H) };
}

/* the two exact corners of the law, for the twin to aim at */
const KELVIN = Math.asin(1 / 3);                   // 0.3398369... rad = 19.4712 deg
function machAngle(Frh) { return Frh <= 1 ? null : Math.asin(1 / Frh); }

/* ── the amplitude weight (a MODEL, not a claim) ────────────────────────────
   Residue of the linearised free-surface response to a Gaussian pressure
   patch, in dimensionless form.  Only its SHAPE in theta matters here: the
   exp(-kappa^2 B^2/4) is the patch refusing to make waves shorter than itself,
   and it is the reason a fast small boat's bright ridge is narrower than the
   cusp. */
function weight(theta, H, B) {
  const kap = kappaOf(theta, H);
  if (kap === null) return 0;
  let den;
  if (!isFinite(H)) den = 1;
  else {
    const x = kap * H;
    if (x > 20) den = 1;
    else { const ch = Math.cosh(x); den = Math.tanh(x) - x / (ch * ch); }
  }
  if (den < 1e-12) den = 1e-12;
  return kap * kap * Math.exp(-(kap * kap * B * B) / 4) / den;
}

/* ── the sample list the field is summed over ───────────────────────────────
   theta runs over BOTH signs.  Three things decide the grid, and all three
   were found the hard way:

     · SAMPLE IN u = tan(theta), NOT in theta.  The phase carries kappa =
       sec^2(theta), so at 70 degrees a step in theta moves the phase eight
       times further than the same step at zero — and out at the far corner of
       the drawn water the integrand is then swinging 1800 radians per radian
       of theta.  Uniform theta needs tens of thousands of samples to stay
       under Nyquist there; uniform u needs about a thousand, because du
       carries exactly the sec^2 the phase does.  Same integral, same answer,
       twelve times fewer samples.
     · at the supercritical edge the weight goes as (theta-theta0)^(-1/2), so
       that branch is sampled through a squared map — the Jacobian eats the
       singularity.
     · the far angles carry vanishing weight but violent phase, so the range is
       trimmed where the weight has fallen to AMP_CUT of its peak.

   Each sample carries amp = A(theta) . dtheta, already the quadrature weight,
   normalised so the peak amp is 1 (the field is scaled at draw time anyway). */
const AMP_CUT = 2e-4;
function thetaSamples(H, B, N) {
  const t0 = thetaFloor(H);
  const tMax = 1.5533;                             // 89 deg — sec^2 is done by here
  // find where the weight has fallen below AMP_CUT of its peak
  const probe = 900;
  let peak = 0;
  const wv = new Float64Array(probe + 1);
  for (let i = 0; i <= probe; i++) {
    const t = t0 + (tMax - t0) * (i / probe);
    wv[i] = weight(t, H, B);
    if (wv[i] > peak) peak = wv[i];
  }
  let iHi = probe;
  while (iHi > 1 && wv[iHi] < AMP_CUT * peak) iHi--;
  const t1 = Math.min(tMax, t0 + (tMax - t0) * ((iHi + 1) / probe));
  const u0 = Math.tan(t0), u1 = Math.tan(t1);
  const singular = t0 > 0;                         // supercritical edge
  const half = Math.max(8, Math.floor(N / 2));
  const out = { theta: new Float64Array(2 * half), kappa: new Float64Array(2 * half),
                amp: new Float64Array(2 * half), n: 2 * half, t0, t1 };
  let amax = 0;
  for (let i = 0; i < half; i++) {
    const w = (i + 0.5) / half;
    const u = singular ? u0 + (u1 - u0) * w * w : u0 + (u1 - u0) * w;
    const dudw = singular ? 2 * w * (u1 - u0) : (u1 - u0);
    const t = Math.atan(u);
    const dtdw = dudw / (1 + u * u);               // dtheta = du / (1 + u^2)
    const wt = weight(t, H, B);
    const a = wt * dtdw / half;                    // the quadrature weight itself
    const kap = kappaOf(t, H);
    for (const sgn of [0, 1]) {
      const j = i * 2 + sgn;
      out.theta[j] = sgn ? -t : t;
      out.kappa[j] = kap === null ? 0 : kap;
      out.amp[j] = kap === null ? 0 : a;
    }
    if (wt > amax) amax = wt;                      // peak of A, NOT of A.dtheta
  }
  // Normalise by the PEAK OF A — a number that does not know how many samples
  // there are.  (Dividing by the peak quadrature weight instead makes the whole
  // field scale with N, which is a very quiet way to break a convergence test.)
  if (amax > 0) for (let j = 0; j < out.n; j++) out.amp[j] /= amax;
  return out;
}

/* ── the field ──────────────────────────────────────────────────────────────
   zeta and its two exact slopes at one point, in scaled coordinates.
   +X is AHEAD of the boat, so the wake lives at X < 0. */
const SIGMA = 0.5;                                 // radiation-condition softening
function fieldAt(X, Y, S, sigma) {
  const sg = sigma === undefined ? SIGMA : sigma;
  let z = 0, zx = 0, zy = 0;
  for (let i = 0; i < S.n; i++) {
    const a = S.amp[i];
    if (a === 0) continue;
    const th = S.theta[i], kap = S.kappa[i];
    const c = Math.cos(th), s = Math.sin(th);
    const ss = X * c + Y * s;
    const q = ss / sg;
    if (q > 12) continue;                          // W is 0 to 1e-10 out here
    const tq = q < -12 ? -1 : Math.tanh(q);
    const W = 0.5 * (1 - tq);
    const chq = q < -12 || q > 12 ? 0 : 1 / Math.cosh(q);
    const dW = -0.5 * chq * chq / sg;
    const ph = kap * ss;
    const sp = Math.sin(ph), cp = Math.cos(ph);
    z += a * W * sp;
    zx += a * c * (dW * sp + W * kap * cp);
    zy += a * s * (dW * sp + W * kap * cp);
  }
  return { z, zx, zy };
}

/* ── measuring the picture ──────────────────────────────────────────────────
   Two rulers, laid on the FIELD — not on the theorem.  Both work off one
   angular profile: sweep a ray out from the boat at angle alpha and record the
   steepest water anywhere in an arc band at radius R.  Steepness, not height,
   because slope is what catches the light and is what a wake actually is to
   look at.

     · edgeAngle  — the OUTSIDE of the disturbance: the widest alpha still
       carrying `frac` of the profile's peak.  This is the wedge, and it should
       land on halfAngle() whatever the boat is.
     · peakAngle  — the BRIGHTEST ridge: where the steepest water in the whole
       profile actually is.  This is what a photograph shows, and for a fast
       small boat it sits well INSIDE the wedge (Rabaud & Moisy 2013), because
       a hull of size b cannot make waves much shorter than b and the waves
       that build the cusp are exactly the ones it has thrown away.

   The threshold in edgeAngle is stated, not hidden: the room prints it. */
function profileOf(S, R, opts) {
  const o = opts || {};
  const M = o.M || 480;                            // angles across the wedge
  const K = o.K || 20;                             // radii in the arc band
  const spread = o.spread === undefined ? 0.3 : o.spread;
  const aMax = o.aMax === undefined ? 0.62 : o.aMax; // ~35.5 deg, past any wedge
  const prof = new Float64Array(M + 1);
  for (let i = 0; i <= M; i++) {
    const al = aMax * (i / M);
    let m = 0;
    for (let j = 0; j < K; j++) {
      const r = R * (1 - spread / 2 + spread * (j / Math.max(1, K - 1)));
      const X = -r * Math.cos(al), Y = r * Math.sin(al);
      const f = fieldAt(X, Y, S, o.sigma);
      const g = Math.hypot(f.zx, f.zy);
      if (g > m) m = g;
    }
    prof[i] = m;
  }
  return { profile: prof, aMax, M };
}
/* the radii the room measures on, and the level it calls "the edge".  Both are
   printed on the page — a threshold you hide is a threshold you are hiding
   behind. */
const EDGE_FRAC = 0.05;
const EDGE_RADII = [20, 32, 48, 70, 100];

/* Extrapolate an edge LADDER to infinite radius.  Outside a cusped caustic the
   field does not stop dead, it decays through an Airy tail whose ANGULAR width
   falls like R^(-2/3) — so a threshold measured at finite radius always reads
   too wide, by an amount that is itself a straight line in R^(-2/3).  Fit the
   line, read the intercept, and the drawn water tells you its own wedge. */
function extrapolateEdge(radii, angles) {
  const xs = radii.map((R) => Math.pow(R, -2 / 3));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = angles.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (angles[i] - my); sxx += (xs[i] - mx) ** 2; }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  return { alpha: my - slope * mx, slope };
}

function peakAngle(p) {
  let bi = 0;
  for (let i = 1; i <= p.M; i++) if (p.profile[i] > p.profile[bi]) bi = i;
  return p.aMax * (bi / p.M);
}
function edgeAngle(p, frac) {
  const f = frac === undefined ? 0.12 : frac;
  let peak = 0;
  for (let i = 0; i <= p.M; i++) peak = Math.max(peak, p.profile[i]);
  const cut = f * peak;
  let i = p.M;
  while (i > 0 && p.profile[i] < cut) i--;
  if (i >= p.M) return p.aMax;
  // linear interpolate the crossing between i and i+1
  const a = p.profile[i], b = p.profile[i + 1];
  const t = a === b ? 0 : (a - cut) / (a - b);
  return p.aMax * ((i + t) / p.M);
}
function brightAngle(S, R, opts) {
  const p = profileOf(S, R, opts);
  return { alpha: peakAngle(p), edge: edgeAngle(p, opts && opts.frac), ...p };
}

/* the physical scales a visitor reads off the room */
function scales(U, h, b) {
  const k0 = G / (U * U);
  return {
    k0,
    lambda0: 2 * Math.PI / k0,                     // the transverse wavelength, metres
    H: isFinite(h) ? k0 * h : Infinity,
    B: k0 * b,
    Frh: isFinite(h) ? U / Math.sqrt(G * h) : 0,
    Frb: U / Math.sqrt(G * b),
  };
}

export { G, KELVIN, SIGMA, AMP_CUT, EDGE_FRAC, EDGE_RADII, kappaOf, groupRatio,
         rayAngle, thetaFloor, halfAngle, machAngle, weight, thetaSamples,
         fieldAt, profileOf, peakAngle, edgeAngle, extrapolateEdge,
         brightAngle, scales };
