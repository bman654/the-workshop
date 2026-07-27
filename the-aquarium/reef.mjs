// ============================================================================
//  THE AQUARIUM — THE REEF CORE.  Pure, DOM-free, dependency-free.
//
//  This file is everything the tank knows that is not a pixel: the shape of the
//  water's surface, the light that surface throws on the sand, the bodies of the
//  fish, the rule that keeps them swimming, and the note a bubble sings.
//
//  ── THE ONE CLAIM ─────────────────────────────────────────────────────────
//  The moving net of bright lines on the sand is not a texture. It is the real
//  caustic of the real surface overhead, and the page computes its brightness in
//  closed form.
//
//  Sunlight falls (near enough) straight down onto a surface of height h(x,z,t).
//  With η = n_air/n_water = 1/1.333, the refracted ray leaving the surface at
//  (x,z) has horizontal slope (1−η)·∇h, so at depth d it lands at
//
//        L(x,z) = (x,z) + a·∇h(x,z),          a = (1−η)·d
//
//  A patch of surface dA therefore lights a patch of floor |det J|·dA, where J is
//  the Jacobian of L — and since the light in the patch is unchanged, the floor's
//  irradiance is multiplied by
//
//        G(x,z) = 1 / |det J|,    J = I + a·H(h),
//        det J  = (1 + a·h_xx)(1 + a·h_zz) − (a·h_xz)²
//
//  Every caustic in this tank is that G. The cusps — the bright cords in the net —
//  are exactly where det J passes through zero and neighbouring rays cross.
//
//  `reef.test.mjs` puts that under a real test: it fires a quarter of a million
//  rays through the same surface by brute force, bins where they land, and asks
//  whether the histogram matches G. It also checks the thing a fake caustic can
//  never do — that G averages to 1 over the floor, because refraction moves light
//  around and does not create it.
//
//  ── WHAT ELSE IS IN HERE ───────────────────────────────────────────────────
//    · SPECIES + fishMesh()  — a fish is a spine with elliptical stations and
//        membrane fins; the swim is a travelling wave applied in the shader, so
//        the mesh built here is the fish held straight.
//    · school()              — the calm rule. Not boids-at-a-rave: a cruise speed,
//        a soft wall push, a slow wander, and (for the ones that school) a weak
//        pull to the flock's mean. Verified to stay in the glass forever.
//    · minnaertHz()          — a bubble is a spring: the gas is the spring, the
//        water around it is the mass. f₀ = (1/2πr)·√(3γP/ρ) ≈ 3.26/r Hz·m. So the
//        pitch of a bubble tells you its size, and the page's bubbles are voiced
//        at the frequency their drawn radius demands.
// ============================================================================

// ===== REEF CORE BEGIN =====
"use strict";

/* ── deterministic noise: one small PRNG, seeded, so a tank replays ───────── */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ══ THE SURFACE ═══════════════════════════════════════════════════════════
   A short sum of travelling ripples. Everything about the caustic is an exact
   derivative of THIS, so the page's shader and this core must use the same list;
   the page inlines it byte-for-byte through the forge.

   These are TANK ripples, not ocean swell: eight to forty centimetres from crest
   to crest, half a millimetre to three millimetres tall. That matters more than it
   sounds. Caustic focusing goes as the surface's CURVATURE, which is A·k² — so
   halving a wavelength at fixed height quadruples the focusing. Metre-long swell
   over a sandy floor gives a faint mottle you would never call a caustic; the
   short chop on a tank gives the hard bright net everyone has actually seen.

   And each ripple travels at the speed its own wavelength demands, from the real
   dispersion relation for water with a surface —

        ω² = g·k + (σ/ρ)·k³            g = 9.81, σ = 0.072 N/m, ρ = 998 kg/m³

   — gravity restoring the long ones, surface tension the short ones. So the short
   ripples visibly outrun the long ones, which is what real water does. */
export const GRAV = 9.81, SIGMA_WATER = 0.072, RHO_WATER = 998;
export const RIPPLES = [                       // wavelength (m), amplitude (m), heading (rad)
  { lam: 0.42, A: 0.00410, dir: 0.35, p: 0.00 },
  { lam: 0.31, A: 0.00295, dir: 2.05, p: 1.90 },
  { lam: 0.235, A: 0.00192, dir: 4.10, p: 3.40 },
  { lam: 0.170, A: 0.00121, dir: 5.35, p: 5.10 },
  { lam: 0.122, A: 0.00063, dir: 1.15, p: 2.20 },
  { lam: 0.086, A: 0.00036, dir: 3.05, p: 0.75 }
];

/** Deep-water dispersion, gravity + capillary. */
export function omegaFor(k) { return Math.sqrt(GRAV * k + (SIGMA_WATER / RHO_WATER) * k * k * k); }

export const WAVES = RIPPLES.map((r) => {
  const k = 2 * Math.PI / r.lam;
  return { A: r.A, kx: k * Math.cos(r.dir), kz: k * Math.sin(r.dir), w: omegaFor(k), p: r.p, k, lam: r.lam };
});

export const ETA = 1 / 1.333;              // n_air / n_water
export const REFRACT_K = 1 - ETA;          // 0.2498… — the horizontal drift per unit depth per unit slope

/** Surface height, its gradient and its Hessian, all from the same sum. */
export function surface(x, z, t) {
  let h = 0, hx = 0, hz = 0, hxx = 0, hxz = 0, hzz = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const W = WAVES[i];
    const ph = W.kx * x + W.kz * z - W.w * t + W.p;
    const s = Math.sin(ph), c = Math.cos(ph);
    h   += W.A * s;
    hx  += W.A * W.kx * c;
    hz  += W.A * W.kz * c;
    hxx -= W.A * W.kx * W.kx * s;
    hxz -= W.A * W.kx * W.kz * s;
    hzz -= W.A * W.kz * W.kz * s;
  }
  return { h, hx, hz, hxx, hxz, hzz };
}

/** Where the ray that entered the water at (x,z) meets a floor `depth` below. */
export function landing(x, z, t, depth) {
  const s = surface(x, z, t);
  const a = REFRACT_K * depth;
  return [x + a * s.hx, z + a * s.hz];
}

/** The SIGNED determinant of the landing map's Jacobian, J = I + a·H(h). Where it
 *  is positive the ray bundle is merely stretched or squeezed; where it crosses
 *  zero the bundle has folded through itself, and that zero curve is a caustic
 *  cord — the bright line on the sand. Its sign is therefore the interesting part,
 *  and the page draws the curve det J = 0 straight from this function. */
export function detJ(x, z, t, depth) {
  const s = surface(x, z, t);
  const a = REFRACT_K * depth;
  return (1 + a * s.hxx) * (1 + a * s.hzz) - (a * s.hxz) * (a * s.hxz);
}

/** The caustic gain G = 1/|det J| at the surface point (x,z), for a floor `depth`
 *  below. `cap` bounds the singularity at a fold, where the true value is ∞ over a
 *  set of measure zero and any renderer must choose a finite number. */
export function causticGain(x, z, t, depth, cap = 8) {
  const g = 1 / Math.max(1e-6, Math.abs(detJ(x, z, t, depth)));
  return g > cap ? cap : g;
}

/** The same number the hard way: push a small square of surface through the
 *  landing map and measure the area of the quadrilateral that comes out. This
 *  knows no calculus — it is four ray traces and a shoelace formula — and it is
 *  what the analytic det J is checked against. */
export function measuredAreaRatio(x, z, t, depth, eps = 1e-4) {
  const c = [
    landing(x - eps, z - eps, t, depth), landing(x + eps, z - eps, t, depth),
    landing(x + eps, z + eps, t, depth), landing(x - eps, z + eps, t, depth)
  ];
  let a2 = 0;
  for (let i = 0; i < 4; i++) {
    const p = c[i], q = c[(i + 1) % 4];
    a2 += p[0] * q[1] - q[0] * p[1];
  }
  return (a2 / 2) / (4 * eps * eps);      // signed, so it can be compared to det J including the fold
}

/** The fraction of the surface whose bundle has folded at this depth — i.e. how
 *  much of the floor is being lit by more than one ray at once. Zero in a shallow
 *  tray, and the reason a deep one gets hard bright cords. */
export function foldFraction(t, depth, n = 400, span = 6) {
  let folded = 0, tot = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (detJ((i / n - 0.5) * span, (j / n - 0.5) * span, t, depth) < 0) folded++;
    tot++;
  }
  return folded / tot;
}

/** The steepest slope the surface reaches — the small-angle sanity bound. */
export function maxSlope(t = 0, n = 160, span = 12) {
  let m = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const s = surface((i / n - 0.5) * span, (j / n - 0.5) * span, t);
    const g = Math.hypot(s.hx, s.hz);
    if (g > m) m = g;
  }
  return m;
}

/** Brute force: fire an N×N grid of rays, bin where they land, return the density
 *  field normalised to a mean of 1. This is the ground truth the analytic caustic
 *  is measured against — it knows nothing about Jacobians. */
export function causticHistogram(t, depth, opts = {}) {
  const bins = opts.bins || 64;
  const span = opts.span || 6;          // the floor window, metres, centred on origin
  const rays = opts.rays || 500;        // rays per axis → rays² total
  const pad = opts.pad || 1.4;          // fire from a wider window so the edges fill
  const grid = new Float64Array(bins * bins);
  const half = span / 2;
  const emitHalf = half * pad;
  let landed = 0;
  for (let i = 0; i < rays; i++) {
    const x = -emitHalf + (2 * emitHalf) * ((i + 0.5) / rays);
    for (let j = 0; j < rays; j++) {
      const z = -emitHalf + (2 * emitHalf) * ((j + 0.5) / rays);
      const L = landing(x, z, t, depth);
      const bx = Math.floor(((L[0] + half) / span) * bins);
      const bz = Math.floor(((L[1] + half) / span) * bins);
      if (bx < 0 || bz < 0 || bx >= bins || bz >= bins) continue;
      grid[bz * bins + bx] += 1;
      landed++;
    }
  }
  // a ray carries the same light wherever it lands; normalise to a mean of 1 over
  // the window so the field is directly comparable to G.
  const cellRays = landed / (bins * bins);
  for (let i = 0; i < grid.length; i++) grid[i] /= cellRays;
  return { grid, bins, span, landed };
}

/** The analytic field sampled on the SAME floor bins, by pushing each surface
 *  sample to where it lands and accumulating its gain there. (G lives on the
 *  surface; the histogram lives on the floor. This is the honest comparison.) */
export function causticFieldOnFloor(t, depth, opts = {}) {
  const bins = opts.bins || 64;
  const span = opts.span || 6;
  const samples = opts.samples || 500;
  const pad = opts.pad || 1.4;
  const acc = new Float64Array(bins * bins);
  const cnt = new Float64Array(bins * bins);
  const half = span / 2, emitHalf = half * pad;
  for (let i = 0; i < samples; i++) {
    const x = -emitHalf + (2 * emitHalf) * ((i + 0.5) / samples);
    for (let j = 0; j < samples; j++) {
      const z = -emitHalf + (2 * emitHalf) * ((j + 0.5) / samples);
      const L = landing(x, z, t, depth);
      const bx = Math.floor(((L[0] + half) / span) * bins);
      const bz = Math.floor(((L[1] + half) / span) * bins);
      if (bx < 0 || bz < 0 || bx >= bins || bz >= bins) continue;
      const k = bz * bins + bx;
      acc[k] += causticGain(x, z, t, depth, 1e9);
      cnt[k] += 1;
    }
  }
  for (let i = 0; i < acc.length; i++) acc[i] = cnt[i] ? acc[i] / cnt[i] : 0;
  return { grid: acc, bins, span };
}

/* ══ THE BUBBLE ════════════════════════════════════════════════════════════
   Minnaert 1933. A bubble is a mass–spring: the gas inside is the spring, the
   water shell around it is the mass. Both scale so that the resonance is simply
   inverse in the radius —

        f₀ = (1/2πr)·√(3γP₀/ρ)

   γ = 1.4 (air), P₀ = 101325 Pa, ρ = 998 kg/m³ gives f₀·r ≈ 3.26 Hz·m. A 3 mm
   bubble sings at about 1.1 kHz; a pinhead at 0.3 mm sings above 10 kHz. That is
   why a stream of fine bubbles hisses and a big lazy one goes "bloop". */
export const GAMMA_AIR = 1.4, P_ATM = 101325;
export const MINNAERT_C = Math.sqrt(3 * GAMMA_AIR * P_ATM / RHO_WATER) / (2 * Math.PI); // ≈ 3.29 Hz·m

/** Resonant frequency of a free bubble of radius r (metres), at depth d (metres,
 *  which raises the ambient pressure by ρgd and so raises the pitch). */
export function minnaertHz(r, depth = 0) {
  const P = P_ATM + RHO_WATER * 9.81 * depth;
  return Math.sqrt(3 * GAMMA_AIR * P / RHO_WATER) / (2 * Math.PI * r);
}

/** The damping a bubble of radius r actually has, as a decay time constant. Small
 *  bubbles ring longer in cycles but die sooner in seconds; the standard fit puts
 *  the dimensionless damping near δ ≈ 0.013·(f/1kHz)^(1/3), so τ = 1/(π·f·δ). */
export function bubbleTau(r, depth = 0) {
  const f = minnaertHz(r, depth);
  const delta = 0.013 * Math.pow(f / 1000, 1 / 3);
  return 1 / (Math.PI * f * delta);
}

/** One bubble's voice, rendered to samples: a damped sinusoid whose pitch RISES
 *  slightly as it rings (the bubble is still shrinking away from the pinch-off
 *  that made it) — the "bloop" everybody knows. */
export function bubbleVoice(r, sampleRate, depth = 0, chirp = 0.12) {
  const f0 = minnaertHz(r, depth);
  const tau = bubbleTau(r, depth);
  const n = Math.max(8, Math.ceil(tau * 6 * sampleRate));
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const f = f0 * (1 + chirp * (1 - Math.exp(-t / tau)));
    phase += 2 * Math.PI * f / sampleRate;
    out[i] = Math.sin(phase) * Math.exp(-t / tau);
  }
  return out;
}

/* ══ THE FISH ══════════════════════════════════════════════════════════════
   A body is a spine of stations, each an ellipse of (halfWidth, halfHeight), plus
   flat membrane fins. The mesh is built HELD STRAIGHT; the travelling wave that
   makes it swim is a vertex-shader displacement keyed on `s`, the 0→1 station
   parameter that every vertex carries. */

/** Catmull–Rom through a control list [[s, w, h], …] (s ascending). */
function profileAt(ctrl, s) {
  const n = ctrl.length;
  if (s <= ctrl[0][0]) return [ctrl[0][1], ctrl[0][2]];
  if (s >= ctrl[n - 1][0]) return [ctrl[n - 1][1], ctrl[n - 1][2]];
  let i = 0; while (i < n - 2 && ctrl[i + 1][0] < s) i++;
  const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)];
  const u = (s - p1[0]) / (p2[0] - p1[0]);
  const cr = (a, b, c, d) => {
    const u2 = u * u, u3 = u2 * u;
    return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
  };
  return [Math.max(0.0005, cr(p0[1], p1[1], p2[1], p3[1])), Math.max(0.0005, cr(p0[2], p1[2], p2[2], p3[2]))];
}

/* patternId: 0 plain · 1 vertical bars · 2 diagonal bands · 3 head-and-tail blocks
   · 4 speckle · 5 lengthwise stripe. The shader draws these from (s, angle). */
export const SPECIES = {
  angel: {                       // an emperor angelfish — tall, banded, unhurried
    name: 'angelfish', length: 0.42, patternId: 2,
    colA: [0.09, 0.24, 0.62], colB: [0.98, 0.80, 0.24], colFin: [0.10, 0.16, 0.42],
    speed: 0.20, waveK: 0.72, waveAmp: 0.055, schooling: 0.0, tallFins: 1.0,
    profile: [[0, 0.006, 0.018], [0.06, 0.036, 0.12], [0.18, 0.062, 0.30], [0.38, 0.070, 0.375],
              [0.60, 0.056, 0.315], [0.80, 0.030, 0.145], [0.92, 0.016, 0.060], [1, 0.010, 0.032]]
  },
  tang: {                        // a yellow tang — a bright disc that hangs in the light
    name: 'yellow tang', length: 0.28, patternId: 0,
    colA: [0.99, 0.76, 0.10], colB: [1.00, 0.90, 0.42], colFin: [0.98, 0.72, 0.10],
    speed: 0.24, waveK: 0.80, waveAmp: 0.052, schooling: 0.15, tallFins: 0.95,
    profile: [[0, 0.005, 0.016], [0.07, 0.030, 0.115], [0.22, 0.050, 0.275], [0.44, 0.052, 0.335],
              [0.66, 0.042, 0.270], [0.84, 0.022, 0.115], [0.94, 0.012, 0.048], [1, 0.008, 0.026]]
  },
  blueTang: {                    // a blue tang — royal blue with a black palette mark
    name: 'blue tang', length: 0.32, patternId: 3,
    colA: [0.06, 0.34, 0.85], colB: [0.02, 0.05, 0.12], colFin: [0.99, 0.78, 0.14],
    speed: 0.26, waveK: 0.78, waveAmp: 0.050, schooling: 0.22, tallFins: 0.9,
    profile: [[0, 0.005, 0.015], [0.07, 0.031, 0.110], [0.24, 0.052, 0.255], [0.46, 0.054, 0.300],
              [0.68, 0.042, 0.235], [0.85, 0.021, 0.100], [0.94, 0.012, 0.044], [1, 0.008, 0.024]]
  },
  clown: {                       // a clownfish — small, orange, three white bars
    name: 'clownfish', length: 0.145, patternId: 1,
    colA: [0.99, 0.42, 0.06], colB: [1.00, 0.98, 0.95], colFin: [0.99, 0.50, 0.10],
    speed: 0.17, waveK: 0.95, waveAmp: 0.070, schooling: 0.10, tallFins: 0.55,
    profile: [[0, 0.006, 0.016], [0.10, 0.033, 0.090], [0.28, 0.048, 0.150], [0.50, 0.046, 0.155],
              [0.72, 0.034, 0.115], [0.88, 0.018, 0.056], [1, 0.009, 0.026]]
  },
  wrasse: {                      // a wrasse — long, quick, a lengthwise ribbon of colour
    name: 'wrasse', length: 0.25, patternId: 5,
    colA: [0.18, 0.66, 0.52], colB: [0.72, 0.30, 0.72], colFin: [0.30, 0.72, 0.62],
    speed: 0.34, waveK: 1.30, waveAmp: 0.085, schooling: 0.05, tallFins: 0.40,
    profile: [[0, 0.005, 0.010], [0.12, 0.026, 0.048], [0.34, 0.036, 0.072], [0.56, 0.033, 0.070],
              [0.78, 0.022, 0.050], [0.92, 0.011, 0.026], [1, 0.006, 0.014]]
  },
  cardinal: {                    // the school — small, silver, all of one mind
    name: 'cardinal', length: 0.10, patternId: 4,
    colA: [0.62, 0.68, 0.75], colB: [0.88, 0.48, 0.18], colFin: [0.48, 0.55, 0.64],
    speed: 0.30, waveK: 1.15, waveAmp: 0.080, schooling: 1.0, tallFins: 0.45,
    profile: [[0, 0.005, 0.011], [0.12, 0.024, 0.055], [0.34, 0.032, 0.082], [0.56, 0.030, 0.078],
              [0.78, 0.020, 0.052], [0.92, 0.010, 0.024], [1, 0.005, 0.013]]
  }
};

/** Build one species' mesh, held straight, nose at z=0 and tail at z=+length.
 *  Attributes, all flat arrays:
 *    pos  (x,y,z)  · nrm (x,y,z) · sv (s, v, part)
 *  where s ∈ [0,1] runs nose→tail, v ∈ [0,1] runs round the body (or across a
 *  fin), and `part` is 0 body · 1 caudal · 2 dorsal/anal · 3 pectoral — the
 *  shader flutters each differently and shades fins thinner. */
export function fishMesh(spec, opts = {}) {
  const NS = opts.stations || 30, NR = opts.ring || 14;
  const L = spec.length;
  const pos = [], nrm = [], sv = [], idx = [];

  const push = (p, n, a) => { pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); sv.push(a[0], a[1], a[2]); };

  /* ── the body: a tube of elliptical stations ── */
  const base = pos.length / 3;
  for (let i = 0; i <= NS; i++) {
    const s = i / NS;
    const [w, h] = profileAt(spec.profile, s);
    const [w2, h2] = profileAt(spec.profile, Math.min(1, s + 1e-3));
    const dw = (w2 - w) / 1e-3, dh = (h2 - h) / 1e-3;      // for the normal's z tilt
    for (let j = 0; j < NR; j++) {
      const a = (j / NR) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const x = w * L * ca, y = h * L * sa, z = s * L;
      // ellipse normal in the cross-section, tilted by the taper along z
      let nx = ca / (w * L), ny = sa / (h * L), nz = -(dw * L * ca * nx + dh * L * sa * ny) * 0.35;
      const inv = 1 / Math.hypot(nx, ny, nz);
      push([x, y, z], [nx * inv, ny * inv, nz * inv], [s, j / NR, 0]);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
    const a = base + i * NR + j, b = base + i * NR + (j + 1) % NR;
    const c = base + (i + 1) * NR + j, d = base + (i + 1) * NR + (j + 1) % NR;
    idx.push(a, c, b, b, c, d);
  }

  /* ── a flat membrane: a strip of quads from a spine edge out to a rim ──
     `edge(s)` gives the attachment point, `rim(s)` the free edge; `part` tags it. */
  function membrane(s0, s1, steps, edge, rim, part, twoSided) {
    const b0 = pos.length / 3;
    for (let i = 0; i <= steps; i++) {
      const s = s0 + (s1 - s0) * (i / steps);
      const e = edge(s), r = rim(s);
      push(e, [0, 0, 1], [s, 0, part]);
      push(r, [0, 0, 1], [s, 1, part]);
    }
    for (let i = 0; i < steps; i++) {
      const a = b0 + i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
      if (twoSided) idx.push(a, c, b, b, c, d);
    }
  }

  const tall = spec.tallFins;
  /* dorsal — along the top, a sail */
  membrane(0.16, 0.90, 14,
    (s) => { const [, h] = profileAt(spec.profile, s); return [0, h * L * 0.94, s * L]; },
    (s) => { const [, h] = profileAt(spec.profile, s);
             const bulge = Math.sin(Math.PI * Math.min(1, Math.max(0, (s - 0.16) / 0.74)));
             return [0, h * L + L * 0.30 * tall * bulge, s * L + L * 0.03 * bulge]; }, 2, true);
  /* anal — the mirror below, shorter */
  membrane(0.46, 0.90, 10,
    (s) => { const [, h] = profileAt(spec.profile, s); return [0, -h * L * 0.94, s * L]; },
    (s) => { const [, h] = profileAt(spec.profile, s);
             const bulge = Math.sin(Math.PI * Math.min(1, Math.max(0, (s - 0.46) / 0.44)));
             return [0, -h * L - L * 0.22 * tall * bulge, s * L + L * 0.02 * bulge]; }, 2, true);
  /* caudal — a forked fan behind the tail, drawn as two membranes meeting at the axis */
  const [, hT] = profileAt(spec.profile, 1);
  membrane(1.0, 1.0, 1, () => [0, 0, L], () => [0, 0, L], 1, true);  // (degenerate seed; replaced below)
  {
    const b0 = pos.length / 3, span = L * (0.22 + 0.13 * tall);
    const lobe = L * (0.095 + 0.165 * tall);
    // five ribs from the peduncle: up-back, up, straight, down, down-back
    const rib = [[+1.00, 0.55], [+0.62, 0.95], [0.0, 0.72], [-0.62, 0.95], [-1.00, 0.55]];
    push([0, 0, L - L * 0.02], [0, 0, 1], [1, 0, 1]);
    for (let i = 0; i < rib.length; i++) {
      push([0, rib[i][0] * lobe, L + span * rib[i][1]], [0, 0, 1], [1.0 + rib[i][1] * 0.35, 1, 1]);
    }
    for (let i = 0; i < rib.length - 1; i++) {
      idx.push(b0, b0 + 1 + i, b0 + 2 + i, b0, b0 + 2 + i, b0 + 1 + i);
    }
  }
  /* pectorals — a small paddle each side, the fin that actually does the hovering */
  for (const side of [-1, 1]) {
    const b0 = pos.length / 3, s = 0.30;
    const [w, h] = profileAt(spec.profile, s);
    const ax = side * w * L * 0.85, ay = -h * L * 0.15, az = s * L;
    const len = L * 0.20, drop = L * 0.10;
    push([ax, ay, az], [side, 0, 0], [s, 0, 3]);
    push([ax + side * len * 0.55, ay + drop * 0.5, az + len * 0.75], [side, 0, 0], [s, 1, 3]);
    push([ax + side * len * 0.85, ay - drop * 0.4, az + len * 0.30], [side, 0, 0], [s, 1, 3]);
    push([ax + side * len * 0.45, ay - drop, az - len * 0.10], [side, 0, 0], [s, 1, 3]);
    idx.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3, b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2);
  }

  return {
    pos: new Float32Array(pos), nrm: new Float32Array(nrm), sv: new Float32Array(sv),
    idx: new Uint16Array(idx), length: L, verts: pos.length / 3, tris: idx.length / 3
  };
}

/* ══ THE SWIMMING ══════════════════════════════════════════════════════════
   Deliberately calm. Each fish holds a cruise speed, wanders slowly, is pushed
   off the glass by a soft force that grows as it nears, and — if it schools —
   is pulled weakly toward its neighbours' mean position and heading. There is no
   panic term and no separation spike, because a reef tank is not a chase. */

export const TANK = { w: 5.6, h: 2.6, d: 3.2 };   // metres: half-widths are w/2, d/2
export const MIN_CRUISE_FRAC = 0.55;             // nobody ever drops below this fraction of cruise

export function makeFish(kind, rnd) {
  const spec = SPECIES[kind];
  return {
    kind, spec,
    p: [(rnd() - 0.5) * TANK.w * 0.8, (rnd() - 0.35) * TANK.h * 0.6, (rnd() - 0.5) * TANK.d * 0.7],
    v: [(rnd() - 0.5) * 0.2, 0, (rnd() - 0.5) * 0.2],
    yaw: rnd() * Math.PI * 2, pitch: 0,
    phase: rnd() * Math.PI * 2,
    wander: rnd() * Math.PI * 2,
    cruise: spec.speed * (0.82 + 0.36 * rnd()),
    scale: 0.86 + 0.30 * rnd()
  };
}

/** One step of the school. `fish` is the whole population; mutates in place.
 *  `avoid` is optional: {p:[x,y,z], r} — the viewer. Fish give a person standing at
 *  the glass a wide berth, which is both what real fish do and the only way to stop
 *  one parking its flank across the whole camera. */
export function school(fish, dt, t, rnd, avoid) {
  const hw = TANK.w / 2, hh = TANK.h / 2, hd = TANK.d / 2;
  // flock means, per schooling kind
  const means = new Map();
  for (const f of fish) {
    if (f.spec.schooling <= 0) continue;
    let m = means.get(f.kind);
    if (!m) { m = { n: 0, p: [0, 0, 0], v: [0, 0, 0] }; means.set(f.kind, m); }
    m.n++; for (let i = 0; i < 3; i++) { m.p[i] += f.p[i]; m.v[i] += f.v[i]; }
  }
  for (const m of means.values()) for (let i = 0; i < 3; i++) { m.p[i] /= m.n; m.v[i] /= m.n; }

  for (const f of fish) {
    const a = [0, 0, 0];
    // slow wander: a heading that turns, never a jerk
    f.wander += (rnd() - 0.5) * 1.4 * dt;
    a[0] += Math.cos(f.wander) * 0.10;
    a[2] += Math.sin(f.wander) * 0.10;
    a[1] += Math.sin(t * 0.23 + f.phase) * 0.020;

    // the glass: a soft push that grows as the wall nears
    const push = (d, dir, i, str) => { if (d < 0.75) a[i] += dir * str * (0.75 - d) * (0.75 - d) * 3.2; };
    push(hw - f.p[0], -1, 0, 1.0); push(hw + f.p[0], +1, 0, 1.0);
    push(hd - f.p[2], -1, 2, 1.0); push(hd + f.p[2], +1, 2, 1.0);
    push(hh - f.p[1], -1, 1, 1.4); push(hh * 0.85 + f.p[1], +1, 1, 1.6);   // the sand pushes harder

    // the viewer: a soft berth, so nobody swims into your face
    if (avoid) {
      const d = [f.p[0]-avoid.p[0], f.p[1]-avoid.p[1], f.p[2]-avoid.p[2]];
      const L = Math.hypot(d[0], d[1], d[2]) || 1e-6;
      if (L < avoid.r) {
        const k2 = (1 - L/avoid.r);
        for (let i = 0; i < 3; i++) a[i] += (d[i]/L) * k2 * k2 * 3.4;
      }
    }

    // schooling: a weak pull to the flock
    const m = means.get(f.kind);
    if (m && f.spec.schooling > 0) {
      for (let i = 0; i < 3; i++) {
        a[i] += (m.p[i] - f.p[i]) * 0.22 * f.spec.schooling;
        a[i] += (m.v[i] - f.v[i]) * 0.55 * f.spec.schooling;
      }
    }

    // integrate, then hold the cruise speed — a fish does not coast to a stop.
    // If the forces above ever cancel to near-nothing, it keeps going the way it
    // was already pointed rather than hanging in the water like a dropped prop.
    for (let i = 0; i < 3; i++) f.v[i] += a[i] * dt;
    f.v[1] *= 0.90;                                   // vertical damping: they swim level
    let sp = Math.hypot(f.v[0], f.v[1], f.v[2]);
    if (sp < 1e-3) { f.v[0] = Math.sin(f.yaw) * f.cruise; f.v[2] = Math.cos(f.yaw) * f.cruise; sp = f.cruise; }
    let k = 1 + (f.cruise / sp - 1) * Math.min(1, dt * 5.0);
    // a fish that stops swimming sinks, so none of them ever quite stops: even
    // nose-first into the glass it keeps half its cruise on.
    if (sp * k < f.cruise * MIN_CRUISE_FRAC) k = f.cruise * MIN_CRUISE_FRAC / sp;
    for (let i = 0; i < 3; i++) { f.v[i] *= k; f.p[i] += f.v[i] * dt; }

    // hard clamp — the glass is glass
    f.p[0] = Math.max(-hw + 0.06, Math.min(hw - 0.06, f.p[0]));
    f.p[1] = Math.max(-hh * 0.85 + 0.05, Math.min(hh - 0.05, f.p[1]));
    f.p[2] = Math.max(-hd + 0.06, Math.min(hd - 0.06, f.p[2]));

    // face where you are going, but turn like a fish: a bounded rate, never a snap.
    // MAX_TURN is about 110°/s — a reef fish's unhurried course change.
    const MAX_TURN = 1.95;
    const tYaw = Math.atan2(f.v[0], f.v[2]);
    let dYaw = tYaw - f.yaw;
    while (dYaw > Math.PI) dYaw -= 2 * Math.PI;
    while (dYaw < -Math.PI) dYaw += 2 * Math.PI;
    const rate = Math.max(-MAX_TURN, Math.min(MAX_TURN, dYaw * 3.0));
    f.turn = rate;                                     // rad/s — the shader banks on this
    f.yaw += rate * dt;
    const tPitch = Math.atan2(-f.v[1], Math.hypot(f.v[0], f.v[2]) || 1e-6);
    f.pitch += (tPitch - f.pitch) * Math.min(1, dt * 2.2);
    f.phase += dt * (2.6 + 5.0 * sp / Math.max(0.05, f.spec.length));
  }
  return fish;
}

/* ══ THE PLANTING ══════════════════════════════════════════════════════════
   Coral heads and grass, placed once from a seed so a tank is the same tank each
   time you open it. Placement avoids the front glass so nothing blocks the view. */
export function plantReef(seed) {
  const rnd = mulberry32(seed);
  const hw = TANK.w / 2, hd = TANK.d / 2, floor = -TANK.h / 2 * 0.85;
  const corals = [], grass = [], rocks = [];
  const kinds = ['branch', 'fan', 'brain', 'tube'];
  // FRONT_CLEAR: the strip of open sand nearest the viewer. Nothing is planted in
  // it, because that sand — close, steep, and unobstructed — is where the caustic
  // is legible, and the caustic is what the room is for.
  const FRONT_CLEAR = 1.60;
  for (let i = 0; i < 34; i++) {
    const x = (rnd() - 0.5) * (TANK.w - 0.5);
    const z = -hd + 0.25 + rnd() * (TANK.d - 0.5 - FRONT_CLEAR);
    if (z > hd - FRONT_CLEAR) continue;
    corals.push({
      kind: kinds[(rnd() * kinds.length) | 0], x, z, y: floor,
      scale: 0.30 + rnd() * 0.50, rot: rnd() * Math.PI * 2, hue: rnd(), phase: rnd() * 6.28
    });
  }
  // two showpieces out to the sides at the front, so the frame has a foreground
  for (const side of [-1, 1]) corals.push({
    kind: side < 0 ? 'branch' : 'fan', x: side * (hw - 0.25 - rnd() * 0.35),
    z: hd - 0.45 - rnd() * 0.4, y: floor,
    scale: 0.85 + rnd() * 0.30, rot: rnd() * Math.PI * 2, hue: rnd(), phase: rnd() * 6.28
  });
  for (let i = 0; i < 420; i++) {
    const x = (rnd() - 0.5) * (TANK.w + 0.2);
    const z = -hd + 0.05 + rnd() * (TANK.d - 0.15 - FRONT_CLEAR);
    // taller at the back, so the bank has a fringe and the eye has somewhere to rest
    const backness = (hd - z) / TANK.d;
    grass.push({ x, z, y: floor, h: 0.20 + rnd() * 0.34 + backness * 0.34,
                 w: 0.011 + rnd() * 0.020,
                 rot: rnd() * Math.PI, phase: rnd() * 6.28, hue: rnd() });
  }
  // the bank: big boulders massed along the back wall, so the reef has something
  // to be built against and the tank is not an empty blue box
  for (let i = 0; i < 20; i++) {
    const back = i < 14;
    const z = back ? (-hd - 0.05 + rnd() * 0.55) : (-hd + 0.9 + rnd() * (TANK.d - 1.1 - FRONT_CLEAR));
    const big = back ? 1.0 : 0.38;
    rocks.push({ x: (rnd() - 0.5) * (TANK.w + 0.8), z, y: floor,
                 rx: (0.38 + rnd() * 0.50) * big, ry: (0.34 + rnd() * 0.52) * big, rz: (0.30 + rnd() * 0.40) * big,
                 rot: rnd() * 6.28, seed: (rnd() * 1e6) | 0 });
  }
  return { corals, grass, rocks, floor };
}

/** The population of the tank: which fish, how many. */
export const STOCK = [
  ['angel', 3], ['tang', 6], ['blueTang', 5], ['clown', 6], ['wrasse', 4], ['cardinal', 24]
];

export function stockTank(seed) {
  const rnd = mulberry32(seed ^ 0x5eed);
  const fish = [];
  for (const [kind, n] of STOCK) for (let i = 0; i < n; i++) fish.push(makeFish(kind, rnd));
  return fish;
}
// ===== REEF CORE END =====
