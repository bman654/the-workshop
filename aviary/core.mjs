/* ============================================================================
 *  THE AVIARY  --  core.mjs
 *
 *  One two-dimensional dynamical system, and every voice in the wood.
 *
 *  A songbird does not have a larynx.  It has a SYRINX, at the fork where the
 *  windpipe splits into the two bronchi, and it has TWO of them -- one on each
 *  branch, worked by separate muscles.  Each is a pair of soft labia that the
 *  bird pushes air past.  Below a threshold pressure they sit still and the air
 *  goes by in silence.  Above it they flap, and the flap chops the airflow into
 *  a tone.
 *
 *  The low-dimensional model used here is the one from the birdsong-physics
 *  literature (Gardner/Cecchi/Magnasco/Laje/Mindlin): the labial midpoint x
 *  obeys, in a time nondimensionalised by the labial rate constant gamma,
 *
 *       dx/dtau = u
 *       du/dtau = -alpha - beta*x - x^3 + x^2 - (x^2 + x)*u
 *
 *  alpha stands for the air-sac pressure driving the labia and beta for how
 *  tight the bird holds them.  gamma is nothing but the clock: it converts tau
 *  back to seconds and so sets the absolute register of the bird.
 *
 *  EVERYTHING the bird sings is therefore one point moving in the (alpha, beta)
 *  plane.  A song is a curve.  That is the whole idea of the room.
 *
 *  WHAT IS EXACTLY DERIVABLE, AND WHAT THIS FILE PREDICTS
 *  ------------------------------------------------------
 *  Equilibria have u = 0 and satisfy the cubic
 *
 *       x^3 - x^2 + beta*x + alpha = 0.
 *
 *  The Jacobian at an equilibrium has trace  -(x^2 + x)  and determinant
 *  beta + 3x^2 - 2x.  So:
 *
 *   * HOPF LINE.  The trace vanishes at x = 0, which the cubic forces to
 *     alpha = 0.  Below it (alpha < 0) the quiet equilibrium is stable and the
 *     syrinx cannot sustain a sound.  The eigenvalues there are +-i*sqrt(beta),
 *     so the note is BORN at
 *
 *          f = gamma * sqrt(beta) / (2*pi).
 *
 *     Pitch is set by tension, and the algebra says exactly how.
 *
 *   * SADDLE-NODE CURVE.  The quiet equilibrium can also be destroyed by
 *     colliding with a saddle.  Double roots of the cubic satisfy both it and
 *     3x^2 - 2x + beta = 0, which parametrises the fold by its own double root:
 *
 *          beta = 2x - 3x^2 ,   alpha = 2x^3 - x^2 ,     x in [1/2, 2/3].
 *
 *     That runs from (alpha, beta) = (0, 1/4) up to (4/27 - 1/9, 0).  Above it
 *     there is no quiet state left anywhere, so the bird MUST sing.  Below it,
 *     for beta < 1/4, a quiet state and a song can both exist -- which is
 *     hysteresis, and you can hear it.
 *
 *   * UPPER EDGE.  The trace also vanishes at x = -1, which the cubic forces to
 *     alpha = beta + 2.  Blow harder than that and the labia are simply held
 *     open: silence again.
 *
 *  core.test.mjs bisects all three boundaries out of the integrated waveform and
 *  checks them against these formulas, and the page does the same measurement in
 *  a worker and draws it over the curves.
 *
 *  THE REST OF THE BIRD.  Both syringes empty into ONE trachea, so the two
 *  voices are summed before the tube -- which is why they beat with each other
 *  rather than merely overlapping.  The trachea is a one-tap feedback comb (a
 *  tube reflecting at the open beak), and the beak radiates the pressure
 *  derivative.
 *
 *  NO BACKTICK MAY APPEAR IN THIS FILE, comments included: the page hands it to
 *  the AudioWorklet inside a String.raw template.  core.test.mjs asserts it.
 * ========================================================================== */

export const TWO_PI = Math.PI * 2;

/* -- the field ------------------------------------------------------------ */
export function dxdtau(x, u) { return u; }
export function dudtau(x, u, a, b) {
  return -a - b * x - x * x * x + x * x - (x * x + x) * u;
}

/* One RK4 step of the nondimensional system.  s is a 2-element array [x, u],
   mutated in place (no allocation -- this runs a million times a second). */
export function rk4(s, a, b, dt) {
  const x = s[0], u = s[1];
  const k1x = u,                 k1u = dudtau(x, u, a, b);
  const x2 = x + 0.5 * dt * k1x, u2 = u + 0.5 * dt * k1u;
  const k2x = u2,                k2u = dudtau(x2, u2, a, b);
  const x3 = x + 0.5 * dt * k2x, u3 = u + 0.5 * dt * k2u;
  const k3x = u3,                k3u = dudtau(x3, u3, a, b);
  const x4 = x + dt * k3x,       u4 = u + dt * k3u;
  const k4x = u4,                k4u = dudtau(x4, u4, a, b);
  s[0] = x + dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x);
  s[1] = u + dt / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
  return s;
}

/* ── THE PREDICTIONS ────────────────────────────────────────────────────────
   Algebra only.  Not one of these functions integrates anything. */

/* The Hopf line.  Trace zero at x = 0 forces alpha = 0, for every beta. */
export const HOPF_ALPHA = 0;

/* The upper edge: trace zero at x = -1 forces alpha = beta + 2. */
export function upperAlpha(beta) { return beta + 2; }

/* The saddle-node fold, parametrised by its double root x in [1/2, 2/3].
   Returns null for beta >= 1/4, where the fold does not exist. */
export const SN_BETA_MAX = 0.25;
export function snAlpha(beta) {
  if (beta >= SN_BETA_MAX || beta < 0) return null;
  /* beta = 2x - 3x^2 is strictly decreasing on [1/2, 2/3]; bisect it */
  let lo = 0.5, hi = 2 / 3;
  for (let i = 0; i < 90; i++) {
    const m = 0.5 * (lo + hi);
    if (2 * m - 3 * m * m > beta) lo = m; else hi = m;
  }
  const x = 0.5 * (lo + hi);
  return 2 * x * x * x - x * x;
}

/* The equilibrium that matters: the cubic root in (-1, 0).  When it exists the
   trace there is positive, i.e. the quiet state is repelling.  null if none. */
export function xStar(alpha, beta) {
  const p = (x) => x * x * x - x * x + beta * x + alpha;
  let lo = -1, hi = 0;
  const plo = p(lo), phi = p(hi);
  if (plo === 0) return lo;
  if (phi === 0) return hi;
  if (plo * phi > 0) return null;
  for (let i = 0; i < 90; i++) {
    const m = 0.5 * (lo + hi);
    if (p(lo) * p(m) <= 0) hi = m; else lo = m;
  }
  return 0.5 * (lo + hi);
}

/* Imaginary part of the eigenvalue pair at the Hopf line: the pitch the note is
   born with, in nondimensional time. */
export function onsetOmega(beta) { return beta > 0 ? Math.sqrt(beta) : 0; }
export function omegaToHz(omega, gamma) { return gamma * omega / TWO_PI; }
export function hzToBeta(hz, gamma) { const w = TWO_PI * hz / gamma; return w * w; }

/* Is (alpha, beta) inside the region where NO quiet state survives?  Above the
   Hopf line and above the fold (where the fold exists), below the upper edge. */
export function mustSing(alpha, beta) {
  if (alpha <= 0) return false;
  if (alpha >= upperAlpha(beta)) return false;
  const sn = snAlpha(beta);
  if (sn !== null && alpha <= sn) return false;
  return true;
}

/* A bird between notes is not pushing zero air, it is pushing NO air, and the
   labia are damped rather than merely marginal.  At exactly alpha = 0 the
   system sits on the Hopf line, where a cycle decays so slowly that a finished
   phrase audibly rings on -- which is what the first render of these songs did.
   So a written pressure of zero means the rest pressure, and the last hair of
   the envelope is a fade into it. */
export const A_REST = -0.15;
export const A_MIN_SING = 0.004;
export function airPressure(a) {
  if (a >= A_MIN_SING) return a;
  const f = Math.max(0, a) / A_MIN_SING;
  return A_REST + (A_MIN_SING - A_REST) * f;
}

/* ── THE SYRINX ─────────────────────────────────────────────────────────────
   One pair of labia, integrated at an oversampled rate and boxcar-decimated
   down to the audio rate.  The boxcar's first null sits exactly on the audio
   sample rate, which is where the aliases would land. */
export class Syrinx {
  constructor(gamma, sampleRate, substeps) {
    this.gamma = gamma;
    this.sub = substeps || 16;
    this.dt = gamma / (sampleRate * this.sub);
    this.s = [0, 0];
    this.dc = 0;
  }
  reset() { this.s[0] = 0; this.s[1] = 0; this.dc = 0; }
  /* one audio sample, given the pressure/tension the bird is holding now */
  tick(alpha, beta) {
    const s = this.s, dt = this.dt, n = this.sub;
    let acc = 0;
    for (let i = 0; i < n; i++) { rk4(s, alpha, beta, dt); acc += s[0]; }
    if (!isFinite(s[0]) || Math.abs(s[0]) > 40) { s[0] = 0; s[1] = 0; return 0; }
    const v = acc / n;
    this.dc += (v - this.dc) * 0.0008;      /* remove the equilibrium offset */
    return v - this.dc;
  }
}

/* ── THE TRACHEA AND THE BEAK ───────────────────────────────────────────────
   A tube of length L closed-ish at the syrinx and open at the beak: a one-tap
   feedback comb with an inverting reflection, resonances near odd multiples of
   c/(4L).  Then the beak radiates roughly the pressure derivative. */
export const SOUND_SPEED = 350;             /* m/s, warm moist bird */
export class Tract {
  constructor(sampleRate, opts) {
    opts = opts || {};
    this.sr = sampleRate;
    this.refl = opts.refl == null ? -0.42 : opts.refl;
    this.buf = new Float32Array(1024);
    this.w = 0;
    this.prev = 0;
    this.lp = 0;
    this.setLength(opts.lengthM == null ? 0.025 : opts.lengthM);
  }
  setLength(L) {
    this.L = L;
    this.delay = Math.max(1.2, 2 * L / SOUND_SPEED * this.sr);
  }
  /* the tube's own resonances, for the label on screen */
  formantHz(n) { return (2 * n - 1) * SOUND_SPEED / (4 * this.L); }
  process(p) {
    const buf = this.buf, N = buf.length;
    const d = this.delay;
    const i0 = Math.floor(d), frac = d - i0;
    const r1 = (this.w - i0 + N * 2) % N;
    const r2 = (r1 - 1 + N) % N;
    const back = buf[r1] * (1 - frac) + buf[r2] * frac;
    const y = p + this.refl * back;
    buf[this.w] = y;
    this.w = (this.w + 1) % N;
    /* beak radiation: a gentle differentiator, then a one-pole to take the
       hardest edge off (a beak is not a trumpet) */
    const rad = y - 0.86 * this.prev;
    this.prev = y;
    this.lp += (rad - this.lp) * 0.55;
    return this.lp;
  }
}

/* ── ONE BIRD ───────────────────────────────────────────────────────────────
   Two syringes into one trachea.  side = 0 both, 1 left only, 2 right only. */
export class Bird {
  constructor(sampleRate, opts) {
    opts = opts || {};
    this.gamma = opts.gamma || 23500;
    const sub = opts.substeps || 16;
    this.L = new Syrinx(this.gamma, sampleRate, sub);
    this.R = new Syrinx(this.gamma, sampleRate, sub);
    this.tract = new Tract(sampleRate, { lengthM: opts.lengthM || 0.025, refl: opts.refl });
    this.side = 0;
    this.gain = opts.gain == null ? 0.5 : opts.gain;
    this.lastL = 0; this.lastR = 0;
  }
  reset() { this.L.reset(); this.R.reset(); }
  /* aL,bL drive the left syrinx; aR,bR the right */
  tick(aL, bL, aR, bR) {
    const useL = this.side !== 2, useR = this.side !== 1;
    const xl = useL ? this.L.tick(aL, bL) : 0;
    const xr = useR ? this.R.tick(aR, bR) : 0;
    this.lastL = xl; this.lastR = xr;
    return this.tract.process((xl + xr) * this.gain);
  }
}

/* ── MEASUREMENT ────────────────────────────────────────────────────────────
   These are what the twin and the page's worker use to interrogate the model.
   They contain no prediction: they integrate and look. */

/* Sustained peak-to-peak of x after the transient has gone.  Starting state is
   rest unless one is handed in (which is how the hysteresis sweep works). */
export function sustainedAmp(alpha, beta, opts) {
  opts = opts || {};
  const dt = opts.dt == null ? 0.02 : opts.dt;
  const settle = opts.settle == null ? 4000 : opts.settle;
  const meas = opts.meas == null ? 800 : opts.meas;
  const s = opts.state ? [opts.state[0], opts.state[1]] : [0, 0];
  const ns = Math.round(settle / dt), nm = Math.round(meas / dt);
  for (let i = 0; i < ns; i++) rk4(s, alpha, beta, dt);
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < nm; i++) {
    rk4(s, alpha, beta, dt);
    if (!isFinite(s[0])) return { amp: 0, state: [0, 0] };
    if (s[0] < mn) mn = s[0];
    if (s[0] > mx) mx = s[0];
  }
  return { amp: mx - mn, state: s };
}

/* The period of the sustained oscillation, by mean-crossing, in tau. */
export function sustainedOmega(alpha, beta, opts) {
  opts = opts || {};
  const dt = opts.dt == null ? 0.01 : opts.dt;
  const settle = opts.settle == null ? 6000 : opts.settle;
  const meas = opts.meas == null ? 2000 : opts.meas;
  const s = opts.state ? [opts.state[0], opts.state[1]] : [0.02, 0];
  const ns = Math.round(settle / dt), nm = Math.round(meas / dt);
  for (let i = 0; i < ns; i++) rk4(s, alpha, beta, dt);
  const xs = new Float64Array(nm);
  let sum = 0;
  for (let i = 0; i < nm; i++) { rk4(s, alpha, beta, dt); xs[i] = s[0]; sum += s[0]; }
  const mean = sum / nm;
  let prev = xs[0] - mean, first = -1, last = -1, n = 0;
  for (let i = 1; i < nm; i++) {
    const c = xs[i] - mean;
    if (prev < 0 && c >= 0) {
      const t = i - c / (c - prev);
      if (first < 0) first = t; else { last = t; n++; }
    }
    prev = c;
  }
  if (n < 2) return null;
  const period = (last - first) / n * dt;
  return TWO_PI / period;
}

/* Bisect the lowest alpha at which the syrinx sustains a sound, at fixed beta.
   opts.state is absent (each trial starts quiet) or carried
   down from a sounding one -- a bird that is already singing). */
export function measureOnset(beta, opts) {
  opts = opts || {};
  const thresh = opts.thresh == null ? 0.05 : opts.thresh;
  const iters = opts.iters == null ? 22 : opts.iters;
  const mopts = { dt: opts.dt || 0.02, settle: opts.settle || 4000, meas: opts.meas || 800 };
  let lo = opts.lo == null ? -0.02 : opts.lo;
  let hi = opts.hi == null ? Math.min(1.0, (beta + 2) * 0.5) : opts.hi;
  if (sustainedAmp(hi, beta, mopts).amp <= thresh) return null;
  if (sustainedAmp(lo, beta, mopts).amp > thresh) return lo;
  for (let i = 0; i < iters; i++) {
    const m = 0.5 * (lo + hi);
    if (sustainedAmp(m, beta, mopts).amp > thresh) hi = m; else lo = m;
  }
  return 0.5 * (lo + hi);
}

/* The other direction: already singing, wind the pressure DOWN carrying the
   state, and report where the sound dies.  Below the fold this is the same
   number; inside the bistable lens it is lower -- that is the hysteresis. */
export function measureOffset(beta, opts) {
  opts = opts || {};
  const thresh = opts.thresh == null ? 0.05 : opts.thresh;
  const stepA = opts.stepA == null ? 0.0025 : opts.stepA;
  const startA = opts.startA == null ? Math.min(1.0, (beta + 2) * 0.5) : opts.startA;
  let st = sustainedAmp(startA, beta, { dt: 0.02, settle: 3000, meas: 40 }).state;
  for (let a = startA; a > -0.05; a -= stepA) {
    const r = sustainedAmp(a, beta, { dt: 0.02, settle: 600, meas: 600, state: st });
    st = r.state;
    if (r.amp < thresh) return a;
  }
  return -0.05;
}
