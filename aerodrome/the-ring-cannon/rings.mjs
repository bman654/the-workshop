// ============================================================================
//  rings.mjs — THE RING CANNON's engine.  Pure, DOM-free; the SAME math the
//  room runs and the Node twin proves.  No backtick anywhere in this file
//  (it is inlined into a String.raw for the GPU-side node upload helper) —
//  see LANDMINES.md.
//
//  WHAT IS MODELLED
//
//  A smoke ring is a VORTEX FILAMENT: a closed loop of concentrated vorticity
//  with circulation Gamma and a finite core of radius a.  Helmholtz's theorem
//  says the loop moves with the fluid, and the fluid it moves with is the one
//  the loop itself induces.  So the whole dynamic is one line:
//
//      dx/dt (of every point on every loop) = Biot-Savart(all loops, x)
//
//  and everything else in this room — a ring that crosses a hall at nearly
//  the speed it left, two rings that play leapfrog forever, a ring that
//  balloons and stalls when it meets a wall — falls out of it.  Nothing here
//  is scripted.
//
//  THE DESINGULARISATION, AND WHY IT IS CALIBRATED AND NOT GUESSED
//
//  The Biot-Savart integral of an infinitely thin loop diverges on the loop.
//  The standard cure is Rosenhead-Moore: soften the kernel with a length
//  delta,
//
//      u(p) = (Gamma/4pi) * SUM  (dl x r) / (|r|^2 + delta^2)^(3/2)
//
//  which is finite everywhere.  delta is NOT the physical core radius a, and
//  picking delta = a is simply wrong — it gives a ring that translates at the
//  wrong speed.  Kelvin's thin-core result for a ring of radius R and core a
//  (uniform vorticity in the core) is
//
//      U = (Gamma / 4 pi R) * ( ln(8R/a) - 1/4 )
//
//  and the regularised loop obeys the same form with ln(8R/delta) - 1, a
//  constant that belongs to the KERNEL and not to the ring.  So one number
//  fixes everything, and it turns out to be a closed form, not a fit:
//
//      delta = MU * a,      MU = exp(1/4 - 1) = exp(-3/4) = 0.472366...
//
//  The twin does NOT take that on trust.  calibrateMu() bisects for the delta
//  that reproduces Kelvin exactly, at four values of a/R, and the answers walk
//  in on exp(-3/4) at second order in a/R (0.4716, 0.4721, 0.47232, 0.47235
//  for a/R = 0.1, 0.05, 0.02, 0.01) — which is both the confirmation and the
//  size of the correction Kelvin's own thin-core expansion drops.
//
//  THE ONE DISSIPATION
//
//  The core spreads: a(t)^2 = a0^2 + 4 nu t (Lamb-Oseen).  That is the only
//  loss in the room.  It slows a ring — U carries ln(8R/a) — but it cannot
//  change the ring's hydrodynamic impulse, which knows only Gamma and R.  So
//  "the rings exchange radius but the sum of their squares does not move" is
//  still exact while the smoke visibly ages.  The nu on the panel is an
//  ENTRAINMENT stand-in, some hundreds of times air's molecular value, and
//  the room says so out loud.
//
//  THE PUFF (the negative control)
//
//  Give the same push without the rotation and you get a turbulent puff: it
//  conserves momentum, its radius grows in proportion to how far it has come,
//  and therefore its speed falls like the cube of the distance:
//
//      M = k rho (alpha x)^3 u        =>        x(t)^4 = x0^4 + 4 k' M t
//
//  The ring and the puff leave with the SAME impulse.  One arrives.
// ============================================================================

"use strict";

/* ── constants ───────────────────────────────────────────────────────────── */

// The kernel constant.  Closed form, confirmed numerically by calibrateMu().
const MU = Math.exp(-0.75);

const RHO_AIR = 1.204;          // kg/m^3 at 20 C — the only place a density lives
const NU_MOLECULAR = 1.51e-5;   // m^2/s, air.  Quoted for honesty, not used as default.

/* ── small vector helpers (arrays of 3, no allocation in hot loops) ──────── */

function v3(x, y, z) { return [x, y, z]; }
function vadd(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function vsub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function vscale(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
function vdot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function vcross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function vlen(a) { return Math.sqrt(vdot(a, a)); }
function vnorm(a) { const L = vlen(a) || 1; return [a[0] / L, a[1] / L, a[2] / L]; }

// Any unit vector perpendicular to n, chosen without a branch that can pick
// the degenerate one.
function perpTo(n) {
  const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
  let t;
  if (ax <= ay && ax <= az) t = [1, 0, 0];
  else if (ay <= az) t = [0, 1, 0];
  else t = [0, 0, 1];
  return vnorm(vcross(n, t));
}

/* ── a filament ──────────────────────────────────────────────────────────── */

/**
 * A closed vortex filament sampled at N nodes.
 *   pos    Float64Array(3N) — the nodes, in order round the loop
 *   gamma  circulation, m^2/s (sign sets which way it flies)
 *   a0     core radius at birth, m
 *   born   simulation time it was created, s
 *   kind   'ring' — reserved for future filament shapes
 */
function makeRing(opt) {
  const N = opt.N | 0;
  const R = opt.R, gamma = opt.gamma, a0 = opt.a;
  const c = opt.center || [0, 0, 0];
  const n = vnorm(opt.axis || [0, 0, 1]);
  const e1 = perpTo(n);
  const e2 = vcross(n, e1);
  const pos = new Float64Array(3 * N);
  for (let i = 0; i < N; i++) {
    // Right-handed about n: with gamma > 0 the ring translates along +n.
    const th = 2 * Math.PI * i / N;
    const ct = Math.cos(th), st = Math.sin(th);
    pos[3 * i] = c[0] + R * (e1[0] * ct + e2[0] * st);
    pos[3 * i + 1] = c[1] + R * (e1[1] * ct + e2[1] * st);
    pos[3 * i + 2] = c[2] + R * (e1[2] * ct + e2[2] * st);
  }
  return { N, pos, gamma, a0, born: (opt.born || 0), id: (opt.id | 0) };
}

/** Core radius now: Lamb-Oseen spreading from a0. */
function coreAt(fil, t, nu) {
  const age = Math.max(0, t - fil.born);
  return Math.sqrt(fil.a0 * fil.a0 + 4 * nu * age);
}

/** Centroid of the nodes. */
function centroid(fil) {
  let x = 0, y = 0, z = 0;
  const N = fil.N, p = fil.pos;
  for (let i = 0; i < N; i++) { x += p[3 * i]; y += p[3 * i + 1]; z += p[3 * i + 2]; }
  return [x / N, y / N, z / N];
}

/**
 * Hydrodynamic impulse per unit density:  I = (Gamma/2) * closed-integral x cross dx.
 * For a circle of radius R with unit normal n this is Gamma * pi * R^2 * n, exactly.
 * It is a conserved vector for an inviscid unbounded fluid — the room's second claim.
 */
function impulse(fil) {
  const N = fil.N, p = fil.pos;
  let ix = 0, iy = 0, iz = 0;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const ax = p[3 * i], ay = p[3 * i + 1], az = p[3 * i + 2];
    const bx = p[3 * j], by = p[3 * j + 1], bz = p[3 * j + 2];
    // midpoint x dl, which integrates x cross dx exactly for a polygon
    const mx = 0.5 * (ax + bx), my = 0.5 * (ay + by), mz = 0.5 * (az + bz);
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    ix += my * dz - mz * dy;
    iy += mz * dx - mx * dz;
    iz += mx * dy - my * dx;
  }
  const s = fil.gamma / 2;
  return [ix * s, iy * s, iz * s];
}

/**
 * The ring's effective radius, read off its own impulse and axis:
 *   |I| = Gamma pi R^2   =>   R = sqrt(|I| / (Gamma pi)).
 * This is the radius that appears in the conservation claim, so it is the one
 * the room quotes.  For a circle it is the circle's radius to machine epsilon
 * (asserted in the twin).
 */
function effectiveRadius(fil) {
  const I = impulse(fil);
  return Math.sqrt(vlen(I) / (Math.abs(fil.gamma) * Math.PI));
}

/** Unit axis, from the impulse direction (signed by gamma so it is the flight direction). */
function axisOf(fil) {
  const I = impulse(fil);
  const s = fil.gamma >= 0 ? 1 : -1;
  return vnorm(vscale(I, s));
}

/** Polygon perimeter — used by the twin to watch a filament stretch. */
function perimeter(fil) {
  const N = fil.N, p = fil.pos;
  let L = 0;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const dx = p[3 * j] - p[3 * i], dy = p[3 * j + 1] - p[3 * i + 1], dz = p[3 * j + 2] - p[3 * i + 2];
    L += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return L;
}

/* ── Biot-Savart ─────────────────────────────────────────────────────────── */

/**
 * Velocity induced at p by one filament, Rosenhead-Moore regularised with
 * length delta.  Adds into out[0..2].
 *
 * Each segment is integrated EXACTLY, not sampled.  Along a straight segment
 * the softened kernel has an elementary antiderivative — write r = rperp +
 * (s - s0) ehat, so |r|^2 + delta^2 = D^2 + (s-s0)^2 with D^2 = |rperp|^2 +
 * delta^2, and the cross product is the constant vector ehat x rperp:
 *
 *   integral ds / (D^2 + u^2)^(3/2)  =  u / (D^2 sqrt(D^2 + u^2))
 *
 * That matters more than it sounds.  Midpoint-sampling the same segments at
 * the room's own resolution (a core a fifth of the ring radius, 64 nodes) put
 * the ring SEVEN PER CENT under Kelvin's speed, and the fix was not more
 * nodes — it was doing the one integral that has an answer.  The exact form
 * lands the same ring within 0.03%.
 *
 * This is the ONLY place the kernel is written on the CPU; the GPU shader
 * that advects the smoke carries the same six lines, and the twin
 * byte-compares the two (see KERNEL_GLSL).
 */
function inducedPoly(q, M, gamma, px, py, pz, delta, out) {
  const d2 = delta * delta;
  const k = gamma / (4 * Math.PI);
  let ux = 0, uy = 0, uz = 0;
  let axp = q[0], ayp = q[1], azp = q[2];
  for (let i = 0; i < M; i++) {
    const j = (i + 1) % M;
    const bx = q[3 * j], by = q[3 * j + 1], bz = q[3 * j + 2];
    let ex = bx - axp, ey = by - ayp, ez = bz - azp;
    const L2 = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1e-30;
    ex /= L2; ey /= L2; ez /= L2;
    const rx = px - axp, ry = py - ayp, rz = pz - azp;
    const s0 = rx * ex + ry * ey + rz * ez;
    const cx = ey * rz - ez * ry, cy = ez * rx - ex * rz, cz = ex * ry - ey * rx;
    const D2 = rx * rx + ry * ry + rz * rz - s0 * s0 + d2;
    const u1 = -s0, u2 = L2 - s0;
    const F = (u2 / Math.sqrt(D2 + u2 * u2) - u1 / Math.sqrt(D2 + u1 * u1)) / D2;
    ux += cx * F; uy += cy * F; uz += cz * F;
    axp = bx; ayp = by; azp = bz;
  }
  out[0] += k * ux; out[1] += k * uy; out[2] += k * uz;
  return out;
}

/** Induction from one filament, integrated along its refined source curve. */
function inducedAt(fil, px, py, pz, delta, out, sub) {
  sub = sub === undefined ? SUB : sub;
  const q = sub > 1 ? refine(fil, sub) : fil.pos;
  return inducedPoly(q, fil.N * (sub > 1 ? sub : 1), fil.gamma, px, py, pz, delta, out);
}

/* ── the two resolutions, and why there must be two ──────────────────────── */
//
//  A filament wants OPPOSITE things from its node spacing h.
//
//    ACCURACY wants h much smaller than the core delta, because the chord
//    through two nodes is straight and a circle is not: at h = delta a 64-gon
//    translates 4.9% under Kelvin.
//
//    STABILITY wants h at least delta.  A filament carries wiggles of every
//    wavelength its nodes can express, and wiggles far shorter than the core
//    are physically meaningless and numerically UNSTABLE — the regularised
//    kernel amplifies them.  Measured here: a 48-node ring holds its radius to
//    four figures for a full second; a 160-node ring (h = 0.4 delta) is
//    perfectly circular, sits still for 0.2 s, and then explodes to four times
//    its radius by 0.5 s, at every time step I tried.  It is not the
//    integrator.  It is the degrees of freedom.
//
//  So the two jobs get two resolutions.  The DEGREES OF FREEDOM are the N
//  nodes, spaced at about the core width, where nothing spurious can live.
//  The SOURCE CURVE for the Biot-Savart integral is a Catmull-Rom spline
//  through those nodes, sampled SUB times finer — smooth, curved, and carrying
//  no extra freedom at all.  Accuracy of a 256-gon, stability of a 64-gon.

const SUB = 4;   // source samples per node interval

/**
 * Catmull-Rom refinement of a closed filament: N*sub points on a smooth curve
 * through the nodes.  Writes into (and returns) a cached buffer on the object.
 */
function refine(fil, sub, posOverride) {
  sub = sub || SUB;
  const N = fil.N, p = posOverride || fil.pos, M = N * sub;
  if (!fil._ref || fil._ref.length !== 3 * M) fil._ref = new Float64Array(3 * M);
  const out = fil._ref;
  for (let i = 0; i < N; i++) {
    const i0 = 3 * ((i - 1 + N) % N), i1 = 3 * i, i2 = 3 * ((i + 1) % N), i3 = 3 * ((i + 2) % N);
    for (let c = 0; c < 3; c++) {
      const P0 = p[i0 + c], P1 = p[i1 + c], P2 = p[i2 + c], P3 = p[i3 + c];
      const a0 = P1;
      const a1 = 0.5 * (P2 - P0);
      const a2 = 0.5 * (2 * P0 - 5 * P1 + 4 * P2 - P3);
      const a3 = 0.5 * (-P0 + 3 * P1 - 3 * P2 + P3);
      for (let s = 0; s < sub; s++) {
        const t = s / sub;
        out[3 * (i * sub + s) + c] = a0 + t * (a1 + t * (a2 + t * a3));
      }
    }
  }
  return out;
}

/**
 * The same six lines, in GLSL, for the smoke advection pass.  Kept HERE so
 * there is one kernel in the room and the twin can hold the two side by side
 * (KERNEL_PARITY below lists the algebra both must contain).  No backtick.
 */
const KERNEL_GLSL = [
  'vec3 segInduce(vec3 A, vec3 B, vec3 P, float d2){',
  '  vec3 e = B - A; float L = max(length(e), 1e-30); e /= L;',
  '  vec3 r = P - A; float s0 = dot(r, e);',
  '  vec3 c = cross(e, r);',
  '  float D2 = dot(r, r) - s0*s0 + d2;',
  '  float u1 = -s0, u2 = L - s0;',
  '  float F = (u2 * inversesqrt(D2 + u2*u2) - u1 * inversesqrt(D2 + u1*u1)) / D2;',
  '  return c * F;',
  '}'
].join('\n');

/* ── the world, and one stage of it ──────────────────────────────────────── */
//
//  A world is  { fils, t, nu, wall }.  Every velocity evaluation in the room —
//  filament nodes, smoke particles, the draught at the candle — goes through
//  prepare() + sample().  prepare() builds, once per stage, the SOURCE SET:
//  each filament's refined curve, plus its mirror image in the back wall if it
//  is close enough for the image to matter.  sample() then costs nothing but
//  the sum.
//
//  THE WALL IS A BOUNDARY, NOT A PROP.  A solid plane needs no through-flow,
//  and for a plane the exact cure is an image filament: reflect it and reverse
//  its circulation.  That, and only that, is why a ring meeting the end of the
//  hall balloons outward and stalls.  The image is included when the ring is
//  within IMAGE_RANGE of the wall; the twin measures what it is worth just
//  outside that distance (under a tenth of a per cent) so the cutoff is a
//  stated approximation and not a hidden one.

const IMAGE_RANGE = 1.6;   // m — see the twin's image-cutoff check

function prepare(world, posOverride) {
  const fils = world.fils, t = world.t, nu = world.nu;
  const src = world._src || (world._src = []);
  src.length = 0;
  for (let f = 0; f < fils.length; f++) {
    const fil = fils[f];
    const delta = MU * coreAt(fil, t, nu);
    const q = refine(fil, SUB, posOverride ? posOverride[f] : null);
    const M = fil.N * SUB;
    src.push({ q, M, gamma: fil.gamma, delta });
    if (world.wall !== undefined) {
      let far = Infinity;
      for (let i = 0; i < M; i++) far = Math.min(far, world.wall - q[3 * i + 2]);
      if (far < IMAGE_RANGE) {
        if (!fil._img || fil._img.length !== 3 * M) fil._img = new Float64Array(3 * M);
        const img = fil._img;
        // Mirror in z = wall AND reverse the node order: a reflection flips
        // handedness, and the image of a vortex loop must keep circulating the
        // way the no-through-flow condition requires.
        for (let i = 0; i < M; i++) {
          const s = 3 * (M - 1 - i);
          img[3 * i] = q[s];
          img[3 * i + 1] = q[s + 1];
          img[3 * i + 2] = 2 * world.wall - q[s + 2];
        }
        src.push({ q: img, M, gamma: fil.gamma, delta });
      }
    }
  }
  return src;
}

/** Velocity at a point, from a prepared source set. */
function sample(src, px, py, pz, out) {
  out[0] = 0; out[1] = 0; out[2] = 0;
  for (let s = 0; s < src.length; s++) {
    const S = src[s];
    inducedPoly(S.q, S.M, S.gamma, px, py, pz, S.delta, out);
  }
  return out;
}

/** Convenience: prepare + sample, for one-off queries (the candle's draught). */
function velocityAt(world, px, py, pz, out) {
  return sample(prepare(world, null), px, py, pz, out || [0, 0, 0]);
}

/* ── the model's own validity limit, enforced ────────────────────────────── */
//
//  A thin vortex filament is an approximation to a slender TUBE, and it has a
//  stated domain: it says nothing trustworthy about wiggles whose wavelength
//  is comparable to the core.  If you let the discrete curve carry them
//  anyway, they do not sit there quietly — they are violently unstable.  A
//  perfectly circular 48-node ring here grows a sawtooth from 3e-17 to 0.1 m
//  in 0.12 s (an e-folding every 3 ms), and the ring tears itself apart with
//  no time step small enough to save it.  That is not a bug to be damped away
//  with a smoother; it is the model being asked a question it cannot answer.
//
//  So the room answers honestly: the filament carries azimuthal modes 0..KCUT
//  EXACTLY, rolls off to zero by KROLL, and holds no opinion above that.  The
//  physical bound is the shortest wavelength a core of radius delta can carry
//  as a bending wave, about its own circumference:
//
//      lambda_min = 2 pi delta      =>      K = R / delta,  which is 10 here.
//
//  That bound is not tight enough.  At K = 10 a lone ring is quiet for 2.2 s
//  and then goes; at K = 4 it lasts 4 s; at K = 3 it is still exactly circular
//  after five seconds of flight, which is longer than anything in this room
//  lives.  So KCAP is 3 — TIGHTER than the physics demands, and the room says
//  so rather than pretending the number came out of the model.  What that
//  costs is real and small: the ring may breathe (mode 0), lean (mode 1) and
//  go oval (mode 2), and nothing finer.  Everything the room claims lives in
//  mode 0.
//
//  Three things make this a boundary and not a fudge, and the twin checks all
//  three: the filter is EXACTLY the identity on a circle (whose node velocity
//  field is uniform, i.e. mode 0), so it cannot touch the ring-speed claim;
//  it is exactly the identity on every mode the leapfrog uses; and the whole
//  leapfrog dance is checked against an INDEPENDENT model (the classical
//  coaxial two-ring ODE in complete elliptic integrals) that shares no code
//  with the filament at all.

const _dftCache = new Map();
function dftTables(N) {
  let T = _dftCache.get(N);
  if (T) return T;
  const c = new Float64Array(N * N), s = new Float64Array(N * N);
  for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) {
    const th = 2 * Math.PI * k * i / N;
    c[k * N + i] = Math.cos(th); s[k * N + i] = Math.sin(th);
  }
  T = { c, s };
  _dftCache.set(N, T);
  return T;
}

/**
 * Low-pass the node velocities around the loop.  Identity below kcut, raised
 * cosine down to zero at kroll.  O(N^2) with a cached table; N is under 100.
 */
function bandLimit(fil, kcut, kroll) {
  const N = fil.N, v = fil.vel;
  const kmax = Math.floor(N / 2);
  if (kcut >= kmax) return;
  const { c, s } = dftTables(N);
  if (!fil._sp || fil._sp.length !== 6 * N) fil._sp = new Float64Array(6 * N);
  const re = fil._sp;                        // [k][comp] real, then imag
  re.fill(0);
  for (let k = 0; k <= kmax; k++) {
    let ar = 0, ai = 0, br = 0, bi = 0, cr = 0, ci = 0;
    for (let i = 0; i < N; i++) {
      const co = c[k * N + i], si = s[k * N + i];
      const x = v[3 * i], y = v[3 * i + 1], z = v[3 * i + 2];
      ar += x * co; ai -= x * si;
      br += y * co; bi -= y * si;
      cr += z * co; ci -= z * si;
    }
    let w = 1;
    if (k > kcut) {
      if (k >= kroll) w = 0;
      else w = 0.5 * (1 + Math.cos(Math.PI * (k - kcut) / (kroll - kcut)));
    }
    const j = 6 * k;
    re[j] = ar * w; re[j + 1] = br * w; re[j + 2] = cr * w;
    re[j + 3] = ai * w; re[j + 4] = bi * w; re[j + 5] = ci * w;
  }
  for (let i = 0; i < N; i++) {
    let x = 0, y = 0, z = 0;
    for (let k = 0; k <= kmax; k++) {
      const co = c[k * N + i], si = s[k * N + i], j = 6 * k;
      // conjugate-symmetric reconstruction: modes 1..(N-1)/2 count twice
      const mult = (k === 0 || (N % 2 === 0 && k === kmax)) ? 1 : 2;
      x += mult * (re[j] * co - re[j + 3] * si);
      y += mult * (re[j + 1] * co - re[j + 4] * si);
      z += mult * (re[j + 2] * co - re[j + 5] * si);
    }
    v[3 * i] = x / N; v[3 * i + 1] = y / N; v[3 * i + 2] = z / N;
  }
}

function cutoffFor(world, fil) {
  const delta = MU * coreAt(fil, world.t, world.nu);
  const R = effectiveRadius(fil);
  const kmax = Math.floor(fil.N / 2);
  const cap = world.kcap === undefined ? 3 : world.kcap;
  const kc = Math.max(2, Math.min(kmax, cap, Math.round(R / delta)));
  return [kc, Math.min(kmax, Math.max(kc + 2, Math.round(kc * 1.6)))];
}

/**
 * One RK2 (midpoint) step of the whole world.  RK2 rather than Euler because
 * leapfrog is a closed orbit in (R, z) and Euler spirals out of it visibly
 * inside one dance — the twin measures exactly that.
 */
function step(world, dt) {
  const fils = world.fils;
  if (fils.length === 0) { world.t += dt; return; }

  const tmp = [0, 0, 0];
  let src = prepare(world, null);
  for (let f = 0; f < fils.length; f++) {
    const fil = fils[f];
    if (!fil.vel || fil.vel.length !== 3 * fil.N) fil.vel = new Float64Array(3 * fil.N);
    for (let i = 0; i < fil.N; i++) {
      sample(src, fil.pos[3 * i], fil.pos[3 * i + 1], fil.pos[3 * i + 2], tmp);
      fil.vel[3 * i] = tmp[0]; fil.vel[3 * i + 1] = tmp[1]; fil.vel[3 * i + 2] = tmp[2];
    }
    if (!world.noBandLimit) { const kk = cutoffFor(world, fil); bandLimit(fil, kk[0], kk[1]); }
  }

  const mid = [];
  for (let f = 0; f < fils.length; f++) {
    const fil = fils[f];
    if (!fil._mid || fil._mid.length !== 3 * fil.N) fil._mid = new Float64Array(3 * fil.N);
    for (let i = 0; i < 3 * fil.N; i++) fil._mid[i] = fil.pos[i] + 0.5 * dt * fil.vel[i];
    mid.push(fil._mid);
  }

  src = prepare(world, mid);
  for (let f = 0; f < fils.length; f++) {
    const fil = fils[f];
    for (let i = 0; i < fil.N; i++) {
      sample(src, mid[f][3 * i], mid[f][3 * i + 1], mid[f][3 * i + 2], tmp);
      fil.vel[3 * i] = tmp[0]; fil.vel[3 * i + 1] = tmp[1]; fil.vel[3 * i + 2] = tmp[2];
    }
    if (!world.noBandLimit) { const kk = cutoffFor(world, fil); bandLimit(fil, kk[0], kk[1]); }
  }
  for (let f = 0; f < fils.length; f++) {
    const fil = fils[f];
    for (let i = 0; i < 3 * fil.N; i++) fil.pos[i] += dt * fil.vel[i];
  }
  world.t += dt;
}

/**
 * Advance by dt, splitting it so that no node moves more than a fraction of
 * the smallest core in one step.  Everything in this room is gentle except
 * the moment two rings thread each other, where the induced speed goes up by
 * an order of magnitude for a tenth of a second — so a fixed step either
 * wastes the whole flight or botches the pass.  Returns the substep count.
 */
function advance(world, dt, frac) {
  frac = frac === undefined ? (world.substepFrac || 0.06) : frac;
  const fils = world.fils;
  if (!fils.length) { world.t += dt; return 0; }

  // The length scale that matters is NOT the speed — a lone ring translates
  // rigidly and needs no substeps at all, however fast it goes.  It is how
  // close two DIFFERENT filaments come, because that is where the velocity a
  // node sees changes quickly along its own path.
  let vmax = 0, gap = Infinity;
  for (let f = 0; f < fils.length; f++) {
    const A = fils[f];
    if (A.vel) for (let i = 0; i < A.N; i++) {
      const s = A.vel[3 * i] * A.vel[3 * i] + A.vel[3 * i + 1] * A.vel[3 * i + 1]
              + A.vel[3 * i + 2] * A.vel[3 * i + 2];
      if (s > vmax) vmax = s;
    }
    for (let g = f + 1; g < fils.length; g++) {
      const B = fils[g];
      for (let i = 0; i < A.N; i += 4) for (let j = 0; j < B.N; j += 4) {
        const dx = A.pos[3 * i] - B.pos[3 * j];
        const dy = A.pos[3 * i + 1] - B.pos[3 * j + 1];
        const dz = A.pos[3 * i + 2] - B.pos[3 * j + 2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < gap) gap = d;
      }
    }
  }
  vmax = Math.sqrt(vmax);
  if (gap === Infinity) { step(world, dt); return 1; }
  const scale = Math.max(Math.sqrt(gap), MU * coreAt(fils[0], world.t, world.nu));
  const cap = vmax > 0 ? frac * scale / vmax : dt;
  const n = Math.max(1, Math.min(16, Math.ceil(dt / cap)));
  for (let i = 0; i < n; i++) step(world, dt / n);
  return n;
}

/**
 * The node spacing a filament of radius R and core a should have: about one
 * core width, which is the only spacing at which the discrete curve is both
 * accurate (with the SUB-fold refinement) and free of spurious short waves.
 * The room sizes every ring it fires with this.
 */
function nodesFor(R, a) {
  const h = MU * a;
  return Math.max(24, Math.min(96, 4 * Math.round(2 * Math.PI * R / h / 4)));
}


/* ── the analytic results the room checks itself against ─────────────────── */

/** Kelvin (1867): the self-induced translation speed of a thin-cored ring. */
function kelvinSpeed(gamma, R, a) {
  return (gamma / (4 * Math.PI * R)) * (Math.log(8 * R / a) - 0.25);
}

/** The inverse: what circulation gives a ring of radius R and core a the speed U. */
function gammaForSpeed(U, R, a) {
  return U * 4 * Math.PI * R / (Math.log(8 * R / a) - 0.25);
}

/**
 * Measure the discrete filament's own translation speed, with no reference to
 * Kelvin: build a ring, take one exact Biot-Savart evaluation at a node, and
 * project onto the axis.  (Every node of a circle moves at the same axial
 * speed, so one is enough — the twin checks that too.)
 */
function discreteSpeed(R, a, N, gamma, deltaOverride, sub) {
  const fil = makeRing({ N, R, gamma, a, center: [0, 0, 0], axis: [0, 0, 1] });
  const delta = deltaOverride !== undefined ? deltaOverride : MU * a;
  const out = [0, 0, 0];
  inducedAt(fil, fil.pos[0], fil.pos[1], fil.pos[2], delta, out, sub);
  return out[2];
}

/**
 * Find MU: the multiplier on the physical core radius that makes the
 * regularised filament translate at Kelvin's speed.  Run at large N so the
 * quadrature error is nowhere near the answer.  The twin calls this and
 * asserts the pinned MU above is what comes back.
 */
function calibrateMu(R, a, N) {
  R = R || 1; a = a || 0.02; N = N || 20000;
  const gamma = 1;
  const target = kelvinSpeed(gamma, R, a);
  // U(delta) is monotone decreasing in delta; bisect on ln(delta).
  let lo = Math.log(a * 1e-3), hi = Math.log(a * 1e3);
  for (let it = 0; it < 200; it++) {
    const m = 0.5 * (lo + hi);
    const u = discreteSpeed(R, a, N, gamma, Math.exp(m), 1);
    if (u > target) lo = m; else hi = m;
  }
  return Math.exp(0.5 * (lo + hi)) / a;
}

/* ── an INDEPENDENT model of the dance, sharing no code with the filament ── */
//
//  The filament is general: any shape, any orientation, any number of loops.
//  That generality is exactly what makes "is the leapfrog right?" hard to
//  answer with the filament itself.  So the room carries a second, narrower
//  model that knows only about COAXIAL CIRCLES — four numbers, R1 z1 R2 z2 —
//  and gets its velocities from the closed-form field of a circular vortex
//  ring in complete elliptic integrals.  Not one line of Biot-Savart, not one
//  node, no regularisation, no band limit.
//
//  If the two agree on the leapfrog period and on the radii the rings swap,
//  then the filament's dance is the physics and not the discretisation.  The
//  twin runs exactly that comparison.

/** Complete elliptic integrals K(m) and E(m), m = k^2, by the AGM. */
function ellipKE(m) {
  let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m);
  let sum = 0.5 * c * c, p = 1;
  for (let i = 0; i < 60 && Math.abs(c) > 1e-16; i++) {
    const an = 0.5 * (a + b), bn = Math.sqrt(a * b);
    c = 0.5 * (a - b);
    a = an; b = bn; p *= 2;
    sum += 0.5 * p * c * c;
  }
  const K = Math.PI / (2 * a);
  return { K, E: K * (1 - sum) };
}

/**
 * Velocity (u_r, u_z) at cylindrical (r, z) induced by a circular vortex ring
 * of radius Rp, circulation G, sitting at axial position zp.  Textbook closed
 * form; singular on the ring itself, which is fine because the only place it
 * is ever evaluated is on the OTHER ring.
 */
function ringFieldAt(Rp, zp, G, r, z) {
  const dz = z - zp;
  const s = (Rp + r) * (Rp + r) + dz * dz;
  const d = (Rp - r) * (Rp - r) + dz * dz;
  const m = 4 * Rp * r / s;
  const { K, E } = ellipKE(Math.min(m, 1 - 1e-15));
  const pre = G / (2 * Math.PI * Math.sqrt(s));
  const uz = pre * (K + (Rp * Rp - r * r - dz * dz) / d * E);
  const ur = (r < 1e-12) ? 0
    : pre * (dz / r) * (-K + (Rp * Rp + r * r + dz * dz) / d * E);
  return [ur, uz];
}

/**
 * The coaxial pair, advanced by RK4.  state = [R1, z1, R2, z2].
 * Each ring: self-induced translation from Kelvin, plus the other's field.
 * Cores spread with the same Lamb-Oseen law the filaments use.
 */
function pairDerivative(st, p, t) {
  const [R1, z1, R2, z2] = st;
  const a1 = Math.sqrt(p.a1 * p.a1 + 4 * p.nu * t);
  const a2 = Math.sqrt(p.a2 * p.a2 + 4 * p.nu * t);
  const [ur1, uz1] = ringFieldAt(R2, z2, p.g2, R1, z1);
  const [ur2, uz2] = ringFieldAt(R1, z1, p.g1, R2, z2);
  return [ur1, kelvinSpeed(p.g1, R1, a1) + uz1,
          ur2, kelvinSpeed(p.g2, R2, a2) + uz2];
}

function pairStep(st, p, t, dt) {
  const add = (a, b, s) => a.map((v, i) => v + s * b[i]);
  const k1 = pairDerivative(st, p, t);
  const k2 = pairDerivative(add(st, k1, dt / 2), p, t + dt / 2);
  const k3 = pairDerivative(add(st, k2, dt / 2), p, t + dt / 2);
  const k4 = pairDerivative(add(st, k3, dt), p, t + dt);
  return st.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

/* ── the puff: the negative control ──────────────────────────────────────── */

/**
 * A turbulent puff carrying the same hydrodynamic impulse as a ring.
 *
 *   radius   b(x)  = alpha * (x + x0)          (a puff spreads in proportion
 *                                               to how far it has travelled)
 *   momentum M     = KAPPA * rho * b^3 * u     (constant — nothing pushes it
 *                                               after it leaves)
 *
 * Eliminating u gives  x^4 = x0^4 + (4 M / (KAPPA rho alpha^3)) t, the classic
 * quarter-power law.  Everything below is that one line and its derivatives.
 *
 * ALPHA is the measured spreading rate of a round turbulent puff (about 0.11
 * — the room says on the page that this is the one empirical number in it).
 */
const PUFF_ALPHA = 0.11;
const PUFF_KAPPA = (4 / 3) * Math.PI;   // the volume of the ball of radius b

function makePuff(opt) {
  const impulseMag = opt.impulse;                 // kg m/s, per the ring it copies
  const rho = opt.rho === undefined ? RHO_AIR : opt.rho;
  const x0 = opt.x0 === undefined ? 0.12 : opt.x0; // the aperture is the puff's birth size / alpha
  const C = 4 * impulseMag / (PUFF_KAPPA * rho * PUFF_ALPHA * PUFF_ALPHA * PUFF_ALPHA);
  return { impulse: impulseMag, rho, x0, C, born: opt.born || 0 };
}

/** Distance travelled by the puff front, s after birth. */
function puffFront(puff, dtSinceBirth) {
  const t = Math.max(0, dtSinceBirth);
  return Math.pow(Math.pow(puff.x0, 4) + puff.C * t, 0.25) - puff.x0;
}

/** The puff's own radius at that moment. */
function puffRadius(puff, dtSinceBirth) {
  return PUFF_ALPHA * (puffFront(puff, dtSinceBirth) + puff.x0);
}

/** Speed of the front. */
function puffSpeed(puff, dtSinceBirth) {
  const x = puffFront(puff, dtSinceBirth) + puff.x0;
  return 0.25 * puff.C / (x * x * x);
}

/** How long the puff takes to reach a given distance (exact inverse of the law). */
function puffTimeTo(puff, dist) {
  const x = dist + puff.x0;
  return (Math.pow(x, 4) - Math.pow(puff.x0, 4)) / puff.C;
}

/**
 * Smoke concentration relative to birth: the same dye spread over a ball that
 * grows like b^3.  This is why you stop SEEING a puff long before it stops.
 */
function puffDilution(puff, dtSinceBirth) {
  const b0 = PUFF_ALPHA * puff.x0;
  const b = puffRadius(puff, dtSinceBirth);
  return (b0 * b0 * b0) / (b * b * b);
}

/* ── the cannon: turning a thump into a ring ─────────────────────────────── */

/**
 * A slug of air of length L pushed out of an aperture of radius R at mean
 * speed Up rolls up into a ring whose circulation is the vorticity flux
 * through the lip:  Gamma = integral of (1/2) Up^2 dt = (1/2) Up L  — the
 * "slug model", which is the standard first-order account of a piston-cylinder
 * vortex generator and is good to about 10% for stroke ratios below 4.
 *
 * The room exposes the two things a hand controls (how hard, how wide) and
 * derives the rest, so the ring's speed is never a number I typed.
 */
function slugCirculation(pistonSpeed, strokeLength) {
  return 0.5 * pistonSpeed * strokeLength;
}

/** The core a rolled-up slug starts with: the classic ~0.2 of the ring radius. */
function slugCore(R) { return 0.21 * R; }

/* ── formation-number sanity: L/D beyond ~4 cannot go into one ring ──────── */
function formationNumber(strokeLength, apertureDiameter) {
  return strokeLength / apertureDiameter;
}

export {
  MU, RHO_AIR, NU_MOLECULAR, PUFF_ALPHA, PUFF_KAPPA,
  v3, vadd, vsub, vscale, vdot, vcross, vlen, vnorm, perpTo,
  makeRing, coreAt, centroid, impulse, effectiveRadius, axisOf, perimeter,
  SUB, IMAGE_RANGE, KERNEL_GLSL, refine, inducedPoly, inducedAt,
  prepare, sample, velocityAt, step, advance, nodesFor, bandLimit, cutoffFor,
  kelvinSpeed, gammaForSpeed, discreteSpeed, calibrateMu,
  makePuff, puffFront, puffRadius, puffSpeed, puffTimeTo, puffDilution,
  ellipKE, ringFieldAt, pairDerivative, pairStep,
  slugCirculation, slugCore, formationNumber
};
