/* ═══════════════════════════════════════════════════════════════════════════
   THE DARK ORCHARD — orchard.mjs
   conservatory/the-dark-orchard/

   The whole acoustics of the room, with no DOM in it, so `orchard.test.mjs`
   can run every claim in Node and the page can inline the same bytes.

   IMPORTANT (forge): this file is spliced into an AudioWorklet-free page but it
   IS re-included inside a String.raw for nothing here — still, keep it free of
   backticks so it can be. There is no backtick in this file, comments included.

   Units are SI throughout: metres, seconds, hertz, decibels re 20 uPa.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── air ──────────────────────────────────────────────────────────────────
   Speed of sound in dry air. 20.05*sqrt(T_K) is the ideal-gas form; at 20 C
   it gives 343.3 m/s, which is the number every bat paper quotes.          */
export function speedOfSound(TC) { return 20.05 * Math.sqrt(TC + 273.15); }

/* ISO 9613-1 pure-tone atmospheric absorption, dB per metre.
   f  Hz · TC degrees C · RHpct relative humidity in PERCENT · p kPa.
   (RH in percent is load-bearing: h is a MOLAR CONCENTRATION in %, and
   handing it a fraction quietly divides the whole curve by about 40.)       */
export function absorptionDbPerM(f, TC, RHpct, pkPa) {
  const T = TC + 273.15, Tr = T / 293.15, pa = (pkPa === undefined ? 101.325 : pkPa) / 101.325;
  const psat = Math.pow(10, -6.8346 * Math.pow(273.16 / T, 1.261) + 4.6151);
  const h = RHpct * psat / pa;
  const frO = pa * (24 + 4.04e4 * h * (0.02 + h) / (0.391 + h));
  const frN = pa * Math.pow(Tr, -0.5) * (9 + 280 * h * Math.exp(-4.170 * (Math.pow(Tr, -1 / 3) - 1)));
  return 8.686 * f * f * (
    1.84e-11 * (1 / pa) * Math.sqrt(Tr) +
    Math.pow(Tr, -2.5) * (
      0.01275 * Math.exp(-2239.1 / T) / (frO + f * f / frO) +
      0.1068 * Math.exp(-3352.0 / T) / (frN + f * f / frN)));
}

/* ── the mouth ────────────────────────────────────────────────────────────
   A bat's beam is well described by a circular piston. J1 by the classic
   Abramowitz & Stegun 9.4.4/9.4.6 rational approximations — the SAME lines
   are copied verbatim into the shader, so the picture and the sound share
   one beam.                                                                */
export function besselJ1(x) {
  const ax = Math.abs(x);
  let y, r;
  if (ax < 8.0) {
    y = x * x;
    const n = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 +
      y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
    const d = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 +
      y * (99447.43394 + y * (376.9991397 + y * 1.0))));
    r = n / d;
  } else {
    const z = 8.0 / ax; y = z * z;
    const xx = ax - 2.356194491;
    const p = 1.0 + y * (0.183105e-2 + y * (-0.3516396496e-4 +
      y * (0.2457520174e-5 + y * (-0.240337019e-6))));
    const q = 0.04687499995 + y * (-0.2002690873e-3 +
      y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
    r = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * p - z * Math.sin(xx) * q);
    if (x < 0) r = -r;
  }
  return r;
}

/* Piston directivity, POWER gain relative to on-axis (1 at theta=0).
   a = mouth radius (m), f = Hz, c = m/s.
   FLOORED at -17 dB: a perfect circular piston has exact nulls and a real
   mouth does not — it has sidelobes, and nothing about a bat is a perfect
   circle. Without the floor the first null (30 degrees off axis at 60 kHz)
   lands inside the field of view and paints a black ring. */
export const BEAM_FLOOR = 0.02;
export function pistonGain(theta, a, f, c) {
  const s = Math.sin(Math.abs(theta));
  const x = 2 * Math.PI * f / c * a * s;
  if (x < 1e-5) return 1;
  const g = 2 * besselJ1(x) / x;
  return Math.max(g * g, BEAM_FLOOR);
}
/* The EARS are not a second mouth. A pinna is broad; bats hear well to the
   side and badly behind. One soft cardioid in power, and the two-way
   sensitivity is mouth x ears, never mouth squared. */
export function earGain(cosTheta) { return 0.30 + 0.70 * Math.max(cosTheta, 0); }

/* ── the calls ────────────────────────────────────────────────────────────
   Two real strategies, and the room is built on the difference.
     FM  a downward sweep. Bandwidth B is huge, so its matched filter is a
         spike c/(2B) wide: it can SEE. It knows almost nothing about speed.
     CF  a long, flat tone. Bandwidth ~1/T, so its range profile is c*T/2
         thick: metres. But it hears a wingbeat inside one call.
   SL is the source level in dB re 20 uPa at 0.1 m, the convention bat
   biologists use (they measure a hand's breadth from the mouth).            */
export const CALLS = {
  fm:    { kind: 'fm', f1: 82000, f2: 38000, T: 0.0030, SL: 110, label: 'FM sweep' },
  buzz:  { kind: 'fm', f1: 62000, f2: 24000, T: 0.0006, SL: 100, label: 'terminal buzz' },
  cf:    { kind: 'cf', f1: 82000, f2: 82000, T: 0.0600, SL: 110, label: 'CF tone' },
};

export function callBandwidth(call) {
  return call.kind === 'cf' ? 1 / call.T : Math.abs(call.f1 - call.f2);
}
/* The two halves of the ambiguity function, in the units a visitor cares
   about. Range resolution is the Rayleigh limit of the matched filter. */
export function rangeResolution(call, c) { return c / (2 * callBandwidth(call)); }
export function velocityResolution(call, c) { return c / (2 * call.f1 * call.T); }

/* Instantaneous frequency at time s into the call (linear sweep). */
export function callFreq(call, s) {
  const u = Math.max(0, Math.min(1, s / call.T));
  return call.f1 + (call.f2 - call.f1) * u;
}
/* A raised-cosine amplitude envelope with 12% rise/fall. */
export function callEnv(call, s) {
  if (s < 0 || s > call.T) return 0;
  const u = s / call.T, e = 0.12;
  if (u < e) return 0.5 - 0.5 * Math.cos(Math.PI * u / e);
  if (u > 1 - e) return 0.5 - 0.5 * Math.cos(Math.PI * (1 - u) / e);
  return 1;
}

/* Synthesise the emitted call, SLOWED BY N.  Time expansion by N is exactly
   a division of every frequency by N: this is what a "time expansion" bat
   detector does, and it is the honest way to put 82 kHz into a human ear.
   Returns Float32Array at sample rate sr, already band-safe when f1/N < sr/2. */
export function synthCall(call, N, sr) {
  const n = Math.max(2, Math.round(call.T * N * sr));
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const s = (i / (N * sr));                    // seconds of REAL call time
    const f = callFreq(call, s) / N;             // heard frequency
    phase += 2 * Math.PI * f / sr;
    out[i] = Math.sin(phase) * callEnv(call, s);
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE ORCHARD
   Every solid in the room is a CAPSULE — a segment with a radius. A trunk is
   a fat vertical one, a branch a thin tilted one, a canopy a degenerate one
   (a == b, i.e. a sphere), a fence post a short one. One primitive means the
   shader and this file cannot drift into two different scenes: they read the
   same numbers out of CAPS below.
   Rows are [ax,ay,az, bx,by,bz, r, material].
   ═══════════════════════════════════════════════════════════════════════════ */
export const MAT = { GROUND: 0, BARK: 1, LEAF: 2, STONE: 3, POST: 4, MOTH: 5 };

/* Acoustic reflectivity — the fraction of incident intensity a surface sends
   back into the hemisphere. Rough numbers from the material-absorption
   literature; they are a MODEL and the page says so. */
export const REFL = [0.30, 0.42, 0.09, 0.62, 0.50, 1.00];

function tree(x, z, h, rot, scale) {
  const s = scale, out = [];
  out.push([x, 0, z, x, h, z, 0.105 * s, MAT.BARK]);                  // trunk
  for (let k = 0; k < 2; k++) {                                       // two limbs
    const a = rot + k * 2.6, L = (0.95 + 0.22 * k) * s;
    const y0 = h * (0.64 + 0.16 * k);
    out.push([x, y0, z,
      x + Math.cos(a) * L, y0 + 0.46 * s, z + Math.sin(a) * L, 0.036 * s, MAT.BARK]);
  }
  for (let k = 0; k < 2; k++) {                                       // canopy
    const a = rot + 1.3 + k * 3.0, L = 0.68 * s;
    const cx = x + Math.cos(a) * L, cz = z + Math.sin(a) * L, cy = h + 0.24 * s - 0.16 * k;
    out.push([cx, cy, cz, cx, cy, cz, 0.80 * s, MAT.LEAF]);
  }
  return out;
}

/* An orchard is PLANTED, in rows, and you fly down the aisles. Four columns
   five metres apart, three rows four and a half apart, jittered by a hash so
   nothing is suspiciously exact — twelve trees, sixty capsules. */
const TREES = [];
for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 3; iz++) {
  const hsh = Math.sin(ix * 12.9898 + iz * 78.233) * 43758.5453;
  const j = (k) => { const v = Math.sin(hsh + k * 1.7) * 43758.5453; return v - Math.floor(v); };
  TREES.push([
    (ix - 1.5) * 5.0 + (j(1) - 0.5) * 1.1,
    (iz - 2.0) * 4.5 + (j(2) - 0.5) * 1.1,
    2.55 + j(3) * 0.95,
    j(4) * 6.283,
    0.86 + j(5) * 0.30
  ]);
}

export const CAPS = [];
export const GROUPS = [];      // {cx,cy,cz,rad,from,to} — a bounding sphere per tree
for (const t of TREES) {
  const from = CAPS.length, rows = tree(t[0], t[1], t[2], t[3], t[4]);
  for (const r of rows) CAPS.push(r);
  const to = CAPS.length;
  let mx = 0, my = 0, mz = 0, n = 0;
  for (let i = from; i < to; i++) { mx += CAPS[i][0] + CAPS[i][3]; my += CAPS[i][1] + CAPS[i][4]; mz += CAPS[i][2] + CAPS[i][5]; n += 2; }
  mx /= n; my /= n; mz /= n;
  let rad = 0;
  for (let i = from; i < to; i++) for (const o of [0, 3]) {
    const dx = CAPS[i][o] - mx, dy = CAPS[i][o + 1] - my, dz = CAPS[i][o + 2] - mz;
    rad = Math.max(rad, Math.sqrt(dx * dx + dy * dy + dz * dz) + CAPS[i][6]);
  }
  GROUPS.push({ cx: mx, cy: my, cz: mz, rad, from, to });
}

/* The two fence posts. Their gap is what the FM/CF contrast is measured on,
   so it is a live parameter: POSTS[1] is moved by setPostGap(). */
export const POST_BASE = [0.05, 0.0, 0.9];
export const POSTS_FROM = CAPS.length;
CAPS.push([POST_BASE[0] - 0.20, 0, POST_BASE[2], POST_BASE[0] - 0.20, 1.25, POST_BASE[2], 0.055, MAT.POST]);
CAPS.push([POST_BASE[0] + 0.20, 0, POST_BASE[2], POST_BASE[0] + 0.20, 1.25, POST_BASE[2], 0.055, MAT.POST]);
GROUPS.push({ cx: POST_BASE[0], cy: 0.62, cz: POST_BASE[2], rad: 1.2, from: POSTS_FROM, to: CAPS.length });

export function setPostGap(gap) {
  const h = gap / 2;
  CAPS[POSTS_FROM][0] = CAPS[POSTS_FROM][3] = POST_BASE[0] - h;
  CAPS[POSTS_FROM + 1][0] = CAPS[POSTS_FROM + 1][3] = POST_BASE[0] + h;
  const g = GROUPS[GROUPS.length - 1];
  g.rad = 1.2 + h;
}
setPostGap(0.40);

/* The wall along the back of the clearing, and the ground it stands on. */
export const WALL = { z: -9.6, h: 1.05, halfLen: 11.0, thick: 0.34 };

/* The ground and the wall's stonework, as NUMBERS, so the shader below is
   generated from the same nine coefficients this function uses. Nothing in
   the scene is written down twice. */
export const GROUND_COEF = [0.055, 0.83, 0.71, 0.028, 2.1, 1.3, 0.020, 1.7, -0.4];
export const WALL_BUMP = [0.028, 5.4, 6.1, 0.014, 11.0, 2.0, 0.04];
export const GROUND_LIP = 0.92;

export function groundHeight(x, z) {
  const g = GROUND_COEF;
  return g[0] * Math.sin(g[1] * x) * Math.sin(g[2] * z)
       + g[3] * Math.sin(g[4] * x + g[5])
       + g[6] * Math.sin(g[7] * z + g[8]);
}

function sdCapsuleRow(px, py, pz, r) {
  const ax = r[0], ay = r[1], az = r[2], bx = r[3], by = r[4], bz = r[5];
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const bb = bax * bax + bay * bay + baz * baz;
  let h = bb > 1e-12 ? (pax * bax + pay * bay + paz * baz) / bb : 0;
  h = h < 0 ? 0 : (h > 1 ? 1 : h);
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r[6];
}

function sdWall(px, py, pz) {
  const w = WALL_BUMP;
  const qx = Math.abs(px) - WALL.halfLen;
  const qy = Math.abs(py - WALL.h * 0.5) - WALL.h * 0.5;
  const qz = Math.abs(pz - WALL.z) - WALL.thick * 0.5;
  const ex = Math.max(qx, 0), ey = Math.max(qy, 0), ez = Math.max(qz, 0);
  const outside = Math.sqrt(ex * ex + ey * ey + ez * ez);
  const inside = Math.min(Math.max(qx, Math.max(qy, qz)), 0);
  /* stones: a shallow bump field so the wall is not a mirror */
  const bump = w[0] * Math.sin(w[1] * px) * Math.sin(w[2] * py) + w[3] * Math.sin(w[4] * px + w[5]);
  return outside + inside - w[6] + bump;
}

/* The scene distance. `moth` may be null. Returns {d, mat}. */
export function sdScene(px, py, pz, moth) {
  let d = (py - groundHeight(px, pz)) * 0.92, mat = MAT.GROUND;
  const w = sdWall(px, py, pz);
  if (w < d) { d = w; mat = MAT.STONE; }
  for (let g = 0; g < GROUPS.length; g++) {
    const G = GROUPS[g];
    const dx = px - G.cx, dy = py - G.cy, dz = pz - G.cz;
    const bs = Math.sqrt(dx * dx + dy * dy + dz * dz) - G.rad;
    if (bs > d) continue;
    for (let i = G.from; i < G.to; i++) {
      const s = sdCapsuleRow(px, py, pz, CAPS[i]);
      if (s < d) { d = s; mat = CAPS[i][7]; }
    }
  }
  if (moth) {
    const dx = px - moth[0], dy = py - moth[1], dz = pz - moth[2];
    const s = Math.sqrt(dx * dx + dy * dy + dz * dz) - 0.022;
    if (s < d) { d = s; mat = MAT.MOTH; }
  }
  return { d, mat };
}

/* The march, as NUMBERS — the shader is generated with these same three, so
   the live GPU-vs-JS probe is comparing two runs of one algorithm rather than
   two algorithms that happen to look alike. */
export const MARCH = { t0: 0.05, eps: 0.0013, minStep: 0.0009, steps: 120, tmax: 26 };

/* Sphere-trace. Returns {hit, t, mat, nx,ny,nz}. */
export function march(ox, oy, oz, dx, dy, dz, moth, tmax, maxSteps) {
  let t = MARCH.t0;
  const TM = tmax === undefined ? MARCH.tmax : tmax, MS = maxSteps === undefined ? MARCH.steps : maxSteps;
  let mat = -1;
  for (let i = 0; i < MS; i++) {
    const r = sdScene(ox + dx * t, oy + dy * t, oz + dz * t, moth);
    mat = r.mat;
    if (r.d < MARCH.eps * Math.max(1, t)) {
      const e = 0.0016;
      const nx = sdScene(ox + dx * t + e, oy + dy * t, oz + dz * t, moth).d - sdScene(ox + dx * t - e, oy + dy * t, oz + dz * t, moth).d;
      const ny = sdScene(ox + dx * t, oy + dy * t + e, oz + dz * t, moth).d - sdScene(ox + dx * t, oy + dy * t - e, oz + dz * t, moth).d;
      const nz = sdScene(ox + dx * t, oy + dy * t, oz + dz * t + e, moth).d - sdScene(ox + dx * t, oy + dy * t, oz + dz * t - e, moth).d;
      const L = Math.hypot(nx, ny, nz) || 1;
      return { hit: true, t, mat, nx: nx / L, ny: ny / L, nz: nz / L };
    }
    t += Math.max(r.d, MARCH.minStep);
    if (t > TM) break;
  }
  return { hit: false, t: TM, mat: -1, nx: 0, ny: 1, nz: 0 };
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE ECHO
   A tap is one arrival: a delay, a gain, and the two ears' shares of it.
   Geometric acoustics — every path is a ray, which is honest while the
   wavelength (8.6 mm at 40 kHz) is small against what it hits. It is NOT
   honest about the moth's wings, which is exactly why the moth is not a ray:
   it is a point target with a stated target strength.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Sound pressure level of the outgoing call at range d, one way.
   SL is referenced at 0.1 m, so the spreading term is 20log10(d/0.1).       */
export function levelAt(SL, d, alphaDb) {
  return SL - 20 * Math.log10(Math.max(d, 0.1) / 0.1) - alphaDb * Math.max(d - 0.1, 0);
}
/* Level of the echo back at the bat from a point target of strength TS
   (dB re 1 m). Two-way spreading, two-way absorption.                       */
export function echoLevel(SL, d, alphaDb, TS) {
  const out = levelAt(SL, d, alphaDb);
  return out + TS - 20 * Math.log10(Math.max(d, 0.1)) - alphaDb * Math.max(d, 0);
}

/* THE ASYMMETRY. Solve each level equation for the range where it crosses a
   threshold, by bisection — exact enough and immune to the absorption term
   having no closed form.                                                    */
function bisectRange(fn, target, lo, hi) {
  for (let i = 0; i < 60; i++) {
    const m = 0.5 * (lo + hi);
    if (fn(m) > target) lo = m; else hi = m;
  }
  return 0.5 * (lo + hi);
}
export function mothHearsAt(SL, alphaDb, mothThreshold) {
  return bisectRange(d => levelAt(SL, d, alphaDb), mothThreshold, 0.1, 400);
}
export function batHearsAt(SL, alphaDb, TS, batThreshold) {
  return bisectRange(d => echoLevel(SL, d, alphaDb, TS), batThreshold, 0.1, 400);
}
/* The source level at which the two ranges are equal — below it the bat has
   the first move. With absorption switched off this is closed form:
     20log10 r = SL - 20 - Lm            (moth)
     40log10 r = SL - 20 + TS - Lb       (bat)
   equal =>  SL = 2*Lm - Lb + TS + 20.                                        */
export function crossoverSLExact(mothThreshold, batThreshold, TS) {
  return 2 * mothThreshold - batThreshold + TS + 20;
}
export function crossoverSL(alphaDb, mothThreshold, batThreshold, TS) {
  let lo = 40, hi = 140;
  for (let i = 0; i < 60; i++) {
    const m = 0.5 * (lo + hi);
    if (mothHearsAt(m, alphaDb, mothThreshold) > batHearsAt(m, alphaDb, TS, batThreshold)) hi = m; else lo = m;
  }
  return 0.5 * (lo + hi);
}

/* Cast the beam and collect taps. `dirs` is a flat [x,y,z,...] of unit
   directions covering the forward hemisphere; each carries solid angle
   `omega`. Returns an array of {tau, g, pan, d}. */
export function castTaps(bat, dirs, omega, opts) {
  const { c, alphaMid, aMouth, fMid, moth, mothTS, SL } = opts;
  const taps = [];
  const [ox, oy, oz] = bat.pos;
  for (let i = 0; i < dirs.length; i += 3) {
    const dx = dirs[i], dy = dirs[i + 1], dz = dirs[i + 2];
    const cosT = dx * bat.fwd[0] + dy * bat.fwd[1] + dz * bat.fwd[2];
    if (cosT <= 0.02) continue;
    const beam = pistonGain(Math.acos(Math.min(1, cosT)), aMouth, fMid, c);
    if (beam < 1e-4) continue;
    const h = march(ox, oy, oz, dx, dy, dz, null, 26, 96);
    if (!h.hit) continue;
    const d = h.t;
    const inc = Math.max(0.04, -(dx * h.nx + dy * h.ny + dz * h.nz));
    /* Intensity: the patch subtends omega*d^2 of area; a lambertian patch
       returns refl*inc/pi of what lands on it, back over 1/d^2. Constants
       fall out in the normalisation, so this is a RELATIVE tap gain. */
    const g = beam * earGain(cosT) * REFL[h.mat] * inc * omega / (d * d)
      * Math.pow(10, -alphaMid * 2 * d / 10);
    const ear = dx * bat.right[0] + dy * bat.right[1] + dz * bat.right[2];
    taps.push({ tau: 2 * d / c, g, pan: ear, d, mat: h.mat });
  }
  if (moth) {
    const mx = moth[0] - ox, my = moth[1] - oy, mz = moth[2] - oz;
    const d = Math.sqrt(mx * mx + my * my + mz * mz);
    const ux = mx / d, uy = my / d, uz = mz / d;
    const cosT = ux * bat.fwd[0] + uy * bat.fwd[1] + uz * bat.fwd[2];
    if (cosT > 0) {
      const beam = pistonGain(Math.acos(Math.min(1, cosT)), aMouth, fMid, c);
      const lvl = echoLevel(SL, d, alphaMid, mothTS);
      taps.push({
        tau: 2 * d / c, g: beam * earGain(cosT) * Math.pow(10, (lvl - 60) / 10), d,
        pan: ux * bat.right[0] + uy * bat.right[1] + uz * bat.right[2],
        mat: MAT.MOTH, isMoth: true
      });
    }
  }
  return taps;
}

/* Cluster taps whose delays are far closer together than the call can tell
   apart. K bins over the delay span; energy-weighted delay inside each bin,
   so nothing moves by more than a bin and a bin is set below the call's own
   resolution by the caller. */
export function clusterTaps(taps, K) {
  if (taps.length <= K) return taps.slice();   /* never the caller's own array */
  let lo = Infinity, hi = -Infinity;
  for (const t of taps) { if (t.tau < lo) lo = t.tau; if (t.tau > hi) hi = t.tau; }
  const span = Math.max(hi - lo, 1e-9);
  const acc = new Array(K);
  for (const t of taps) {
    let k = Math.floor((t.tau - lo) / span * (K - 1e-9));
    if (k < 0) k = 0; if (k >= K) k = K - 1;
    let a = acc[k];
    if (!a) { a = acc[k] = { tau: 0, g: 0, pan: 0, d: 0, mat: t.mat, isMoth: false }; }
    a.tau += t.tau * t.g; a.d += t.d * t.g; a.pan += t.pan * t.g; a.g += t.g;
    if (t.isMoth) a.isMoth = true;
  }
  const out = [];
  for (let k = 0; k < K; k++) {
    const a = acc[k];
    if (!a || a.g <= 0) continue;
    a.tau /= a.g; a.d /= a.g; a.pan /= a.g;
    out.push(a);
  }
  return out;
}

/* Render one chirp's worth of received signal, SLOWED BY N.

   The frequency-dependent part of absorption is applied ALONG THE PULSE, not
   as one scalar: in a linear sweep the instantaneous frequency is a function
   of the time within the pulse, so "the air eats the top of the sweep first"
   is exact here rather than approximated. That is also why the far echoes
   come back low and dull, and it is what colours the picture.

   Doppler is a time-scale on the returned copy (two-way factor 1+2v/c).
   Wing flutter modulates the moth's tap inside the pulse.
   Returns {L,R,frames} at sample rate sr.                                    */
export function renderEchoes(taps, call, opts) {
  const { N, sr, c, TC, RHpct, gain, mothWingHz, mothWingPhase, mothMod } = opts;
  if (!taps.length) return { L: new Float32Array(1), R: new Float32Array(1), frames: 1 };
  let maxTau = 0;
  for (const t of taps) maxTau = Math.max(maxTau, t.tau);
  const frames = Math.ceil((maxTau + call.T * 1.2) * N * sr) + 8;
  const L = new Float32Array(frames), R = new Float32Array(frames);
  const nCall = Math.max(2, Math.round(call.T * N * sr));
  /* precompute the absorption-vs-frequency curve across the sweep once */
  const alphaOf = new Float64Array(nCall);
  for (let i = 0; i < nCall; i++) {
    alphaOf[i] = absorptionDbPerM(callFreq(call, i / (N * sr)), TC, RHpct, 101.325);
  }
  for (const tp of taps) {
    const dop = tp.vr ? (1 + 2 * tp.vr / c) : 1;
    const i0 = Math.round(tp.tau * N * sr);
    const gl = Math.sqrt(Math.max(0, 0.5 * (1 - tp.pan))) * gain;
    const gr = Math.sqrt(Math.max(0, 0.5 * (1 + tp.pan))) * gain;
    const amp = Math.sqrt(Math.max(tp.g, 0));
    if (amp < 1e-7) continue;
    let phase = 0;
    const nn = Math.max(2, Math.round(nCall / dop));
    for (let i = 0; i < nn; i++) {
      const j = i0 + i; if (j < 0 || j >= frames) continue;
      const s = (i * dop) / (N * sr);
      const f = callFreq(call, s) * dop / N;
      phase += 2 * Math.PI * f / sr;
      const ai = Math.min(nCall - 1, Math.round(i * dop));
      let a = amp * callEnv(call, s) * Math.pow(10, -alphaOf[ai] * 2 * tp.d / 20);
      if (tp.isMoth && mothMod) {
        /* a wing turns the reflector on and off; inside a 60 ms CF call this
           is several cycles, inside a 3 ms FM call it is a twelfth of one. */
        a *= 1 + mothMod * Math.cos(2 * Math.PI * mothWingHz * (tp.tau + s) + mothWingPhase);
      }
      const v = Math.sin(phase) * a;
      L[j] += v * gl; R[j] += v * gr;
    }
  }
  return { L, R, frames };
}

/* ── a small radix-2 FFT, for the twin and for the page's flutter meter ──── */
export function fft(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cwr - im[i + k + len / 2] * cwi;
        const vi = re[i + k + len / 2] * cwi + im[i + k + len / 2] * cwr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const nwr = cwr * wr - cwi * wi; cwi = cwr * wi + cwi * wr; cwr = nwr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

/* Matched filter: correlate the received signal with the emitted call and
   take the analytic envelope. This is what a bat's cochlea-plus-brain is
   believed to approximate, and it is the only fair way to ask "can this call
   tell those two posts apart?" */
export function matchedFilterEnvelope(rx, tx) {
  let n = 1; while (n < rx.length + tx.length) n <<= 1;
  const ar = new Float64Array(n), ai = new Float64Array(n);
  const br = new Float64Array(n), bi = new Float64Array(n);
  ar.set(rx); for (let i = 0; i < tx.length; i++) br[i] = tx[tx.length - 1 - i];
  fft(ar, ai, false); fft(br, bi, false);
  for (let i = 0; i < n; i++) {
    const r = ar[i] * br[i] - ai[i] * bi[i], m = ar[i] * bi[i] + ai[i] * br[i];
    ar[i] = r; ai[i] = m;
  }
  fft(ar, ai, true);
  /* analytic envelope of the (real) correlation via a Hilbert transform */
  const cr = new Float64Array(n), ci = new Float64Array(n);
  cr.set(ar);
  fft(cr, ci, false);
  for (let i = 1; i < n / 2; i++) { cr[i] *= 2; ci[i] *= 2; }
  for (let i = n / 2 + 1; i < n; i++) { cr[i] = 0; ci[i] = 0; }
  fft(cr, ci, true);
  const out = new Float64Array(rx.length + tx.length - 1);
  for (let i = 0; i < out.length; i++) out[i] = Math.hypot(cr[i], ci[i]);
  return { env: out, lag0: tx.length - 1 };
}

/* Count clearly separated peaks in an envelope: local maxima above `frac` of
   the global max, separated by a dip to below `dip` of the smaller peak. */
export function countPeaks(env, frac, dip) {
  let mx = 0; for (const v of env) if (v > mx) mx = v;
  const th = frac * mx;
  const peaks = [];
  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] >= env[i - 1] && env[i] > env[i + 1] && env[i] > th) peaks.push(i);
  }
  const kept = [];
  for (const p of peaks) {
    if (!kept.length) { kept.push(p); continue; }
    const q = kept[kept.length - 1];
    let low = Infinity;
    for (let i = q; i <= p; i++) low = Math.min(low, env[i]);
    if (low < dip * Math.min(env[q], env[p])) kept.push(p);
    else if (env[p] > env[q]) kept[kept.length - 1] = p;
  }
  return kept;
}

/* ── the spectral colour of a returning echo ──────────────────────────────
   The air is a low-pass filter whose corner moves in with distance, so the
   CENTROID of what comes back tells you how far it went. This is the number
   the room paints the world with. */
export function returnCentroid(call, d, TC, RHpct) {
  let num = 0, den = 0;
  const M = 48;
  for (let i = 0; i < M; i++) {
    const s = (i + 0.5) / M * call.T;
    const f = callFreq(call, s);
    const w = Math.pow(10, -absorptionDbPerM(f, TC, RHpct, 101.325) * 2 * d / 10);
    num += f * w; den += w;
  }
  return den > 0 ? num / den : call.f2;
}

/* ── the moth ─────────────────────────────────────────────────────────────
   A noctuid's tympanal organ is one or two cells; it does not identify a bat,
   it just measures loudness. Above threshold it turns away; well above, it
   folds its wings and drops. The dive here uses the SAME level equation the
   bat's own echo does. */
export const MOTH = { threshold: 55, panic: 72, TS: -40, wingHz: 45, cruise: 1.6, dive: 3.4 };

export function mothResponse(SL, d, alphaDb, m) {
  const lvl = levelAt(SL, d, alphaDb);
  if (lvl >= m.panic) return { state: 'dive', lvl };
  if (lvl >= m.threshold) return { state: 'turn', lvl };
  return { state: 'calm', lvl };
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE SAME SCENE, FOR THE GPU
   Generated from the SAME constants the JS distance function above reads, so
   the picture on the screen and the sound in your ears cannot be looking at
   two different orchards. The capsules themselves arrive as uniforms straight
   out of CAPS; only the shape algebra is written here, and it is written once.
   The page's live probe re-checks the two against each other every second.
   ═══════════════════════════════════════════════════════════════════════════ */
const F = (v) => (Number.isInteger(v) ? v.toFixed(1) : String(v));

export function sdfGLSL() {
  const g = GROUND_COEF, w = WALL_BUMP;
  return [
    'float groundH(vec2 p){',
    '  return ' + F(g[0]) + '*sin(' + F(g[1]) + '*p.x)*sin(' + F(g[2]) + '*p.y)',
    '       + ' + F(g[3]) + '*sin(' + F(g[4]) + '*p.x+' + F(g[5]) + ')',
    '       + ' + F(g[6]) + '*sin(' + F(g[7]) + '*p.y+(' + F(g[8]) + '));',
    '}',
    'float sdWall(vec3 p){',
    '  float qx = abs(p.x) - ' + F(WALL.halfLen) + ';',
    '  float qy = abs(p.y - ' + F(WALL.h * 0.5) + ') - ' + F(WALL.h * 0.5) + ';',
    '  float qz = abs(p.z - (' + F(WALL.z) + ')) - ' + F(WALL.thick * 0.5) + ';',
    '  vec3 e = max(vec3(qx,qy,qz), 0.0);',
    '  float outside = length(e);',
    '  float inside  = min(max(qx, max(qy, qz)), 0.0);',
    '  float bump = ' + F(w[0]) + '*sin(' + F(w[1]) + '*p.x)*sin(' + F(w[2]) + '*p.y)',
    '             + ' + F(w[3]) + '*sin(' + F(w[4]) + '*p.x+' + F(w[5]) + ');',
    '  return outside + inside - ' + F(w[6]) + ' + bump;',
    '}',
    'float sdCap(vec3 p, vec3 a, vec3 b, float r){',
    '  vec3 pa = p-a, ba = b-a;',
    '  float bb = dot(ba,ba);',
    '  float h = bb > 1e-12 ? clamp(dot(pa,ba)/bb, 0.0, 1.0) : 0.0;',
    '  return length(pa - ba*h) - r;',
    '}',
    '/* vec2(distance, material) */',
    'vec2 sdScene(vec3 p){',
    '  float d = (p.y - groundH(p.xz)) * ' + F(GROUND_LIP) + ';',
    '  float m = 0.0;',
    '  float w = sdWall(p);',
    '  if (w < d) { d = w; m = 3.0; }',
    '  for (int g = 0; g < NGROUP; g++){',
    '    vec4 G = uGroup[g];',
    '    if (length(p - G.xyz) - G.w > d) continue;',
    '    int lo = int(uRange[g].x), hi = int(uRange[g].y);',
    '    for (int i = lo; i < hi; i++){',
    '      float s = sdCap(p, uCapA[i].xyz, uCapB[i].xyz, uCapA[i].w);',
    '      if (s < d) { d = s; m = uCapB[i].w; }',
    '    }',
    '  }',
    '  float sm = length(p - uMoth) - 0.022;',
    '  if (sm < d) { d = sm; m = 5.0; }',
    '  return vec2(d, m);',
    '}',
    '/* the march, from the same five numbers orchard.mjs MARCH holds */',
    'vec3 marchScene(vec3 ro, vec3 rd){',
    '  float t = ' + F(MARCH.t0) + ';',
    '  for (int i = 0; i < ' + MARCH.steps + '; i++){',
    '    vec2 s = sdScene(ro + rd*t);',
    '    if (s.x < ' + F(MARCH.eps) + ' * max(1.0, t)) return vec3(t, s.y, 1.0);',
    '    t += max(s.x, ' + F(MARCH.minStep) + ');',
    '    if (t > ' + F(MARCH.tmax) + ') break;',
    '  }',
    '  return vec3(t, -1.0, 0.0);',
    '}'
  ].join('\n');
}

/* The beam, verbatim from the same A&S coefficients besselJ1() uses. */
export function beamGLSL() {
  return [
    'float j1(float x){',
    '  float ax = abs(x), r;',
    '  if (ax < 8.0){',
    '    float y = x*x;',
    '    float n = x*(72362614232.0 + y*(-7895059235.0 + y*(242396853.1 +',
    '        y*(-2972611.439 + y*(15704.48260 + y*(-30.16036606))))));',
    '    float dd = 144725228442.0 + y*(2300535178.0 + y*(18583304.74 +',
    '        y*(99447.43394 + y*(376.9991397 + y*1.0))));',
    '    r = n/dd;',
    '  } else {',
    '    float z = 8.0/ax, y = z*z, xx = ax - 2.356194491;',
    '    float p = 1.0 + y*(0.183105e-2 + y*(-0.3516396496e-4 +',
    '        y*(0.2457520174e-5 + y*(-0.240337019e-6))));',
    '    float q = 0.04687499995 + y*(-0.2002690873e-3 +',
    '        y*(0.8449199096e-5 + y*(-0.88228987e-6 + y*0.105787412e-6)));',
    '    r = sqrt(0.636619772/ax)*(cos(xx)*p - z*sin(xx)*q);',
    '    if (x < 0.0) r = -r;',
    '  }',
    '  return r;',
    '}',
    'float pistonGain(float ct, float ka){',
    '  float s = sqrt(max(0.0, 1.0 - ct*ct));',
    '  float x = ka * s;',
    '  if (x < 1e-5) return 1.0;',
    '  float g = 2.0*j1(x)/x;',
    '  return max(g*g, ' + F(BEAM_FLOOR) + ');',
    '}',
    'float earGain(float ct){ return 0.30 + 0.70*max(ct, 0.0); }'
  ].join('\n');
}

/* ── fibonacci directions on a spherical cap, for the beam cast ──────────── */
export function capDirections(fwd, right, up, halfAngle, n) {
  const out = new Float32Array(n * 3);
  const cosMax = Math.cos(halfAngle);
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const z = 1 - (i + 0.5) / n * (1 - cosMax);
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const a = ga * i;
    const lx = Math.cos(a) * r, ly = Math.sin(a) * r;
    out[i * 3] = right[0] * lx + up[0] * ly + fwd[0] * z;
    out[i * 3 + 1] = right[1] * lx + up[1] * ly + fwd[1] * z;
    out[i * 3 + 2] = right[2] * lx + up[2] * ly + fwd[2] * z;
  }
  return out;
}
export function capSolidAngle(halfAngle, n) {
  return 2 * Math.PI * (1 - Math.cos(halfAngle)) / n;
}
