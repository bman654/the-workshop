/* ============================================================================
 *  THE WIND CHIMES — the core.  Zero-dependency, DOM-free ESM.
 *
 *  Written once, run in three places:
 *    · the page's module script (forge:include ./core.mjs)
 *    · the AudioWorklet — the same text, with its export keywords stripped,
 *      because a worklet is a classic script
 *    · Node — core.test.mjs (the twin) and render-wavs.mjs (the ear-check)
 *
 *  So the tube you hear, the tube you watch bending, and the tube the twin
 *  proves are one object.  DO NOT put a backtick or a dollar-brace ANYWHERE in
 *  this file, comments included (that has already cost one debug cycle):
 *  the page hands the whole text to the worklet inside a String.raw template.
 *
 *  ── WHAT A CHIME TUBE ACTUALLY IS ──────────────────────────────────────────
 *  A hanging chime tube is a FREE-FREE Euler–Bernoulli beam — clamped nowhere,
 *  both ends loose.  Its transverse modes solve cos(bL)cosh(bL) = 1, giving
 *  bL = 4.7300, 7.8532, 10.9956, …  and, because f goes as (bL)^2, the famous
 *  INHARMONIC ladder
 *
 *        1 : 2.756 : 5.404 : 8.933 : 13.34 : 18.64
 *
 *  which is why a chime is not a bell and not a string.  Nothing here is fitted:
 *  every frequency in this room falls out of E, rho, the tube's bore and its
 *  length.  Cut a tube 1.19x longer and it drops a fourth (f goes as 1/L^2).
 *
 *  ── THE ROOM'S ONE CLAIM ───────────────────────────────────────────────────
 *  Mode 1 of a free-free beam stands still at xi = 0.2242 and 0.7758 of its
 *  length.  Real chimes are drilled and hung THERE, and the reason is audible:
 *  a cord clamps whatever it touches and drains each mode in proportion to how
 *  much that mode moves at the hanging point — Y_n(xi_hang)^2.  Hang the tube
 *  at its node and mode 1 loses nothing and rings for ten seconds; hang it at
 *  the middle and the same tube is dead in one.
 *
 *  The file computes that curve two independent ways:
 *    · analytically — modeNodes(0) bisects the roots of the mode shape;
 *    · by measurement — sustainCurve() SYNTHESISES a strike at each hanging
 *      position and fits T60 to the decay of the rendered audio.
 *  The measured minima land on the analytic nodes.  The page draws both.
 * ========================================================================== */

/* ---------------------------------------------------------------------------
 *  1 · THE BEAM
 * ------------------------------------------------------------------------ */

/* 6061-T6 aluminium — what chime tube stock is actually made of. */
export const E_AL = 69.0e9;                      /* Young's modulus, Pa */
export const RHO_AL = 2700.0;                    /* density, kg/m^3     */
export const C_AL = Math.sqrt(E_AL / RHO_AL);    /* 5055 m/s            */

/* Roots of cos(x)cosh(x) = 1 — the free-free eigenvalues, bL. */
export const BETA_L = [
  4.730040745, 7.853204624, 10.99560784,
  14.13716549, 17.27875960, 20.42035225,
];
export const NMODES = BETA_L.length;

/* f_n / f_1 = (bL_n / bL_1)^2 */
export const MODE_RATIO = BETA_L.map((b) => (b * b) / (BETA_L[0] * BETA_L[0]));

/* Radius of gyration of a hollow round tube: K = sqrt(I/A) = sqrt(od^2+id^2)/4 */
export function gyration(od, wall) {
  const id = od - 2 * wall;
  return Math.sqrt(od * od + id * id) / 4;
}

/* Fundamental of a free-free tube of length L:
 *      f1 = (bL_1)^2 / (2 pi L^2) * sqrt(E/rho) * K                         */
export function fundamental(L, od, wall) {
  return (BETA_L[0] * BETA_L[0]) / (2 * Math.PI * L * L) * C_AL * gyration(od, wall);
}

/* Invert it — what length of this stock sings at f1? */
export function cutLength(f1, od, wall) {
  return Math.sqrt((BETA_L[0] * BETA_L[0]) * C_AL * gyration(od, wall) / (2 * Math.PI * f1));
}

export function modeFreqs(L, od, wall) {
  const f1 = fundamental(L, od, wall);
  return MODE_RATIO.map((r) => f1 * r);
}

/* --- the mode SHAPE -------------------------------------------------------
 *  Y_n(xi) = cosh(b xi) + cos(b xi) - sigma (sinh(b xi) + sin(b xi)),  b = bL_n
 *  normalised so the ends — always antinodes — are exactly +/- 1.
 *
 *  Written naively this is catastrophic cancellation: cosh(20.42) is 4e8 and
 *  the answer is order 1, so float32 (the vertex shader draws this same curve)
 *  has nothing left.  So fold sigma into the exponentials analytically,
 *      cosh z - sigma sinh z = ( (1-sigma) e^z + (1+sigma) e^-z ) / 2
 *  and get om = 1 - sigma from a difference that never blows up,
 *      1 - sigma = (cos b - sin b - e^-b) / (sinh b - sin b).
 *  Now the huge e^z is multiplied by a correspondingly tiny om, the product is
 *  order 1, and it is exact in double AND in float.                          */
export function shapeCoefs(n) {
  const b = BETA_L[n];
  const om = (Math.cos(b) - Math.sin(b) - Math.exp(-b)) / (Math.sinh(b) - Math.sin(b));
  return { b: b, om: om, sigma: 1 - om };
}

export function modeShape(n, xi) {
  const c = shapeCoefs(n);
  const z = c.b * xi;
  const hyp = 0.5 * (c.om * Math.exp(z) + (2 - c.om) * Math.exp(-z));
  const tri = Math.cos(z) - c.sigma * Math.sin(z);
  return (hyp + tri) / 2;
}

/* Where mode n stands still, as fractions of the length.  Bisection on the
 * shape itself — no table, no remembered constants.  modeNodes(0) is the
 * chime-maker's 0.2242 / 0.7758, arrived at rather than looked up. */
export function modeNodes(n, samples = 4000) {
  const out = [];
  let prev = modeShape(n, 0);
  for (let i = 1; i <= samples; i++) {
    const x = i / samples;
    const v = modeShape(n, x);
    if (prev * v < 0) {
      let lo = (i - 1) / samples, hi = x, flo = prev;
      for (let k = 0; k < 60; k++) {
        const mid = 0.5 * (lo + hi), fm = modeShape(n, mid);
        if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; }
      }
      out.push(0.5 * (lo + hi));
    }
    prev = v;
  }
  return out;
}

/* ---------------------------------------------------------------------------
 *  2 · HOW A TUBE LOSES ITS SOUND
 * ------------------------------------------------------------------------ */

/* Amplitude decay rate alpha (1/s): a mode goes as exp(-alpha t).
 *   ALPHA_INT — internal friction in the metal, near enough flat across modes
 *   ALPHA_RAD — radiation into the air; a faster mode pushes more air, and
 *               measured bar damping grows roughly with sqrt(f)
 * The two are set so the long tube's fundamental rings about twelve seconds,
 * which is what a 25 x 1.5 mm x 0.83 m aluminium tube does on a porch. */
export const ALPHA_INT = 0.25;
export const ALPHA_RAD = 0.0200;
export function alphaFree(f) { return ALPHA_INT + ALPHA_RAD * Math.sqrt(f); }

/* THE CORD'S TOLL — the whole claim, in one line.  A loop through a drilled
 * hole clamps the tube where it passes and drains each mode in proportion to
 * the square of that mode's displacement at the hanging point. */
export const HANG_KAPPA = 9.0;
export function alphaHang(n, xiHang) {
  const y = modeShape(n, xiHang);
  return HANG_KAPPA * y * y;
}
export function alphaTotal(n, f, xiHang) {
  return alphaFree(f) + alphaHang(n, xiHang);
}

/* Time to fall 60 dB at an amplitude decay rate alpha. */
export function t60(alpha) { return Math.log(1000) / alpha; }

/* ---------------------------------------------------------------------------
 *  3 · THE VOICE — a bank of modal resonators
 *
 *  Each mode is ONE complex phasor multiplied by a fixed pole p = r e^{i w}
 *  every sample; the output is its real part.  A strike ADDS a real number to
 *  the phasor, which is exactly an impulse: every mode leaves the hammer in
 *  phase and then drifts apart at its own rate, which is the sound of struck
 *  metal.  Because strikes add, overlapping hits are correct for free.
 *
 *  A strike at xi_s gives mode n the weight |Y_n(xi_s)| — hit a tube on one of
 *  a mode's nodes and that mode is simply not there.  Finite contact time rolls
 *  off the top, so a slow touch is a thump and a hard fast one is bright.
 * ------------------------------------------------------------------------ */

export const CONTACT_HZ_MIN = 900;    /* brightest partial a feather-touch wakes */
export const CONTACT_HZ_MAX = 5200;   /* … and what a full-force blow wakes      */
export const V_REF = 0.34;            /* closing speed (m/s) that reads as full  */

export function contactCutoff(vel) {
  const v = Math.min(1, Math.max(0, vel / V_REF));
  return CONTACT_HZ_MIN + (CONTACT_HZ_MAX - CONTACT_HZ_MIN) * Math.pow(v, 0.7);
}

export function strikeAmp(n, f, vel, xiStrike) {
  const fc = contactCutoff(vel);
  const roll = 1 / (1 + (f / fc) * (f / fc));
  return Math.abs(modeShape(n, xiStrike)) * roll;
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class ModalBank {
  /* freqs: per tube, an array of mode frequencies.  pans: -1..1 per tube. */
  constructor(freqs, sr, opts) {
    const o = opts || {};
    this.sr = sr;
    this.nT = freqs.length;
    this.nM = freqs[0].length;
    this.freqs = freqs;
    this.pans = o.pans || freqs.map(() => 0);
    this.gain = o.gain === undefined ? 0.30 : o.gain;
    this.thudGain = o.thudGain === undefined ? 1 : o.thudGain;
    const N = this.nT * this.nM;
    this.re = new Float64Array(N);
    this.im = new Float64Array(N);
    this.pr = new Float64Array(N);
    this.pi = new Float64Array(N);
    this.amp = new Float64Array(N);    /* the eye's copy of each mode's size */
    this.alpha = new Float64Array(N);
    this.setHang(o.xiHang === undefined ? 0.2242 : o.xiHang);
    this.thuds = [];
    this.rng = mulberry32(o.seed === undefined ? 20260727 : o.seed);
    this.nz1 = 0; this.nz2 = 0; this.nzB = 0;
    this.wind = 0; this.windTarget = 0;
    this.t = 0;
  }

  setHang(xi) {
    this.xiHang = xi;
    const sr = this.sr;
    for (let i = 0; i < this.nT; i++) {
      for (let n = 0; n < this.nM; n++) {
        const k = i * this.nM + n;
        const f = this.freqs[i][n];
        const a = alphaTotal(n, f, xi);
        this.alpha[k] = a;
        const r = Math.exp(-a / sr);
        const w = 2 * Math.PI * f / sr;
        this.pr[k] = r * Math.cos(w);
        this.pi[k] = r * Math.sin(w);
      }
    }
  }

  /* vel: closing speed, m/s.  xiStrike: 0..1 along the tube. */
  strike(tube, vel, xiStrike) {
    if (tube < 0 || tube >= this.nT) return;
    const v = Math.max(0, vel);
    const drive = Math.min(1.4, v / V_REF);
    for (let n = 0; n < this.nM; n++) {
      const k = tube * this.nM + n;
      const a = strikeAmp(n, this.freqs[tube][n], v, xiStrike) * drive;
      this.re[k] += a;
      this.amp[k] = Math.sqrt(this.re[k] * this.re[k] + this.im[k] * this.im[k]);
    }
    if (this.thudGain > 0) {
      this.thuds.push({ e: drive * 0.42 * this.thudGain, lp: 0, pan: this.pans[tube] });
      if (this.thuds.length > 24) this.thuds.shift();
    }
  }

  setWind(v) { this.windTarget = v; }

  /* Adds into outL / outR for n samples. */
  render(outL, outR, n) {
    const nT = this.nT, nM = this.nM;
    const re = this.re, im = this.im, pr = this.pr, pi = this.pi;
    const g = this.gain, sr = this.sr;
    const slew = Math.exp(-1 / (0.25 * sr));
    for (let s = 0; s < n; s++) {
      let l = 0, r = 0;
      for (let i = 0; i < nT; i++) {
        let acc = 0;
        const base = i * nM;
        for (let m = 0; m < nM; m++) {
          const k = base + m;
          const a = re[k], b = im[k];
          if (a === 0 && b === 0) continue;
          re[k] = a * pr[k] - b * pi[k];
          im[k] = a * pi[k] + b * pr[k];
          acc += re[k];
        }
        const p = this.pans[i];
        l += acc * Math.sqrt(0.5 * (1 - p));
        r += acc * Math.sqrt(0.5 * (1 + p));
      }
      for (let j = 0; j < this.thuds.length; j++) {
        const th = this.thuds[j];
        if (th.e < 1e-5) continue;
        const wn = this.rng() * 2 - 1;
        th.lp += (wn - th.lp) * 0.11;
        const v = th.lp * th.e * 1.6;
        th.e *= 0.99935;
        l += v * Math.sqrt(0.5 * (1 - th.pan));
        r += v * Math.sqrt(0.5 * (1 + th.pan));
      }
      this.wind = this.windTarget + (this.wind - this.windTarget) * slew;
      if (this.wind > 1e-4) {
        const wn = this.rng() * 2 - 1;
        this.nz1 += (wn - this.nz1) * 0.05;
        this.nz2 += (this.nz1 - this.nz2) * 0.05;
        this.nzB += (wn - this.nzB) * 0.40;
        const w = this.wind;
        const air = (this.nz2 * 4.2 + this.nzB * 0.07 * w) * w * w * 0.5;
        l += air * (1 + 0.18 * this.nz1);
        r += air * (1 - 0.18 * this.nz1);
      }
      outL[s] += Math.tanh(l * g * 1.25) * 0.8;
      outR[s] += Math.tanh(r * g * 1.25) * 0.8;
    }
    /* keep the eye's copy of every mode in step with the ear's */
    for (let k = 0; k < this.amp.length; k++) {
      if (this.amp[k] > 1e-7) this.amp[k] *= Math.exp(-this.alpha[k] * n / sr);
    }
    this.t += n / sr;
  }
}

/* ---------------------------------------------------------------------------
 *  4 · THE HANGING RIG — a real chime, in real air
 *
 *  Nothing here is an angle in a plane.  Every cord can point anywhere on a
 *  sphere.  A body is a rigid thing swinging about a pivot: its state is the
 *  unit vector u down the cord and an angular velocity w perpendicular to it,
 *        w' = (torque - c w) / I ,      u' = w x u
 *  with the component of w along u discarded (a cord does not spin a tube) and
 *  u renormalised.  Gravity is a torque; wind is a drag force at a radius; a
 *  contact is an impulse shared between clapper and tube.
 *
 *  THE WHOLE RIG HANGS TOO.  The eave hook carries the disc, and the disc
 *  carries the tubes and the clapper — so a steady wind leans the entire
 *  assembly together and moves nothing relative to anything.  What rings a
 *  chime is the buffeting, and every body's drag is computed against the wind
 *  MINUS its own velocity, pivot included, so that comes out on its own.
 * ------------------------------------------------------------------------ */

export const G = 9.81;
export const RHO_AIR = 1.2;
export const CD = 1.15;
/* below this closing speed a contact is a graze that leans, and makes no sound */
export const V_STRIKE = 0.045;

export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
export function scl(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
export function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
export function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
export function len(a) { return Math.sqrt(dot(a, a)); }
export function norm(a) { const l = len(a) || 1; return scl(a, 1 / l); }

/* Rotate v about a unit axis by angle th (Rodrigues). */
export function rot(v, axis, th) {
  const c = Math.cos(th), s = Math.sin(th);
  const k = cross(axis, v);
  return add(add(scl(v, c), scl(k, s)), scl(axis, dot(axis, v) * (1 - c)));
}

/* The estate's air as an actual velocity field: a mean drift plus turbulence
 * built from incommensurate sines, so it never repeats and Node and the browser
 * get identical wind for an identical clock. */
export class Wind {
  constructor(opts) {
    const o = opts || {};
    this.speed = o.speed === undefined ? 1.7 : o.speed;
    this.heading = o.heading === undefined ? 0.7 : o.heading;
    this.gust = 0;
    this.t = 0;
  }
  puff(strength) { this.gust += strength; }
  /* The steady part is deliberately a THIRD of the number on the slider and the
   * fluctuation carries the rest, because a chime is rung by BUFFETING, not by
   * pressure: a constant wind leans the whole rig and the clapper together and
   * moves nothing relative to anything.  (Hold the wind high and steady in this
   * room and the clapper does lean out and lie against its downwind tube,
   * ringing nothing — which is exactly what a real chime does in a gale.) */
  at(t) {
    const s = this.speed;
    const a = 0.55 * Math.sin(0.61 * t) + 0.30 * Math.sin(1.414 * t + 1.1)
            + 0.18 * Math.sin(2.718 * t + 2.3) + 0.13 * Math.sin(4.669 * t + 0.4);
    const b = 3.30 * Math.sin(0.0374 * t + 0.5) + 1.00 * Math.sin(0.181 * t + 2.0)
            + 0.62 * Math.sin(0.437 * t + 0.3) + 0.34 * Math.sin(0.913 * t + 1.7)
            + 0.20 * Math.sin(1.618 * t + 0.9);
    const c = 0.22 * Math.sin(0.87 * t + 1.2) + 0.12 * Math.sin(2.236 * t + 2.9);
    const mag = Math.max(0, s * (0.34 + 0.92 * a)) + this.gust;
    const h = this.heading + 0.85 * b;
    return [mag * Math.cos(h), c * s * 0.30, mag * Math.sin(h)];
  }
  step(dt) { this.t += dt; this.gust *= Math.exp(-dt / 1.2); }
}

/* One rigid thing swinging on a cord about a (possibly moving) pivot. */
export class Swinger {
  constructor(pivot, I, cDamp) {
    this.pivot = pivot;
    this.pivotVel = [0, 0, 0];
    this.u = [0, -1, 0];
    this.w = [0, 0, 0];
    this.I = I;
    this.c = cDamp;
    this.torque = [0, 0, 0];
  }
  pointAt(r) { return add(this.pivot, scl(this.u, r)); }
  velAt(r) { return add(this.pivotVel, cross(this.w, scl(this.u, r))); }
  applyForce(r, F) { this.torque = add(this.torque, cross(scl(this.u, r), F)); }
  applyImpulse(r, J) {
    let w = add(this.w, scl(cross(scl(this.u, r), J), 1 / this.I));
    this.w = sub(w, scl(this.u, dot(w, this.u)));
  }
  integrate(dt) {
    let wn = add(this.w, scl(sub(this.torque, scl(this.w, this.c)), dt / this.I));
    wn = sub(wn, scl(this.u, dot(wn, this.u)));
    const sp = len(wn);
    if (sp > 1e-9) this.u = norm(rot(this.u, scl(wn, 1 / sp), sp * dt));
    this.w = wn;
    this.torque = [0, 0, 0];
  }
}

export const DEFAULT_TUBE = { od: 0.025, wall: 0.0015 };

/* A major pentatonic plus its octave, as semitones from middle C — so the
 * caller can hand us the estate's ONE pitch authority (pitch-core's semiToFreq)
 * and that decides what the metal gets cut to. */
export const PENT_SEMIS = [-3, -1, 1, 4, 6, 9];

export class ChimeRig {
  constructor(opts) {
    const o = opts || {};
    const tube = o.tube || DEFAULT_TUBE;
    this.od = tube.od; this.wall = tube.wall;
    this.f1 = o.freqs;
    this.nT = this.f1.length;
    this.ring = o.ring === undefined ? 0.105 : o.ring;
    this.cordTop = o.cordTop === undefined ? 0.055 : o.cordTop;
    this.xiHang = o.xiHang === undefined ? 0.2242 : o.xiHang;
    this.rClap = o.rClap === undefined ? 0.42 : o.rClap;
    this.rSail = o.rSail === undefined ? 0.78 : o.rSail;
    this.rPuck = o.rPuck === undefined ? 0.052 : o.rPuck;
    this.aSail = o.aSail === undefined ? 0.026 : o.aSail;
    this.mClap = 0.070; this.mSail = 0.022;
    this.hookY = o.hookY === undefined ? 0.30 : o.hookY;   /* eave hook height  */

    /* cut the metal */
    this.L = this.f1.map((f) => cutLength(f, this.od, this.wall));
    this.freqs = this.L.map((L) => modeFreqs(L, this.od, this.wall));
    const area = Math.PI * (Math.pow(this.od / 2, 2) - Math.pow(this.od / 2 - this.wall, 2));
    this.area = area;
    this.mass = this.L.map((L) => area * L * RHO_AL);

    /* the tubes stand in a ring, longest first */
    this.az = [];
    for (let i = 0; i < this.nT; i++) this.az.push((i / this.nT) * Math.PI * 2 + 0.4);

    /* the whole assembly hangs from the eave on its own cord */
    const mTotal = this.mass.reduce((a, b) => a + b, 0) + this.mClap + this.mSail + 0.12;
    this.mTotal = mTotal;
    this.rig = new Swinger([0, this.hookY, 0], mTotal * this.hookY * this.hookY, 0.06 * mTotal);

    const Ic = this.mClap * this.rClap * this.rClap + this.mSail * this.rSail * this.rSail;
    this.clapper = new Swinger([0, 0, 0], Ic, o.cDamp === undefined ? 0.0060 : o.cDamp);
    this.tubes = [];
    this.rebuildTubes();

    this.wind = new Wind(o.wind);
    this.refract = new Float64Array(this.nT);
    this.events = [];
    this.t = 0;
    this.thetaMax = 0.50;
  }

  /* Rebuilt whenever the hanging point moves, because the tube really does
   * slide up and down its own cord when you drill a new hole. */
  rebuildTubes() {
    const keep = this.tubes && this.tubes.length === this.nT ? this.tubes : null;
    this.tubes = [];
    for (let i = 0; i < this.nT; i++) {
      const L = this.L[i], m = this.mass[i];
      /* the cord is re-tied as the hole moves, exactly as a chime maker does,
       * so the tube keeps hanging where it hangs and only the CORD slides */
      const rTop = this.cordTop;                     /* pivot -> the tube's TOP */
      const rCg = rTop + 0.5 * L;
      const I = m * (L * L / 12 + rCg * rCg);
      const sw = keep ? keep[i] : new Swinger([0, 0, 0], I, 0);
      sw.I = I; sw.c = 0.02 * m;
      sw.L = L; sw.rTop = rTop; sw.rCg = rCg; sw.m = m; sw.idx = i;
      this.tubes.push(sw);
    }
    this.placePivots();
  }

  /* The disc's position and tilt follow the rig's own cord; every child pivot
   * rides on the disc. */
  placePivots() {
    const u = this.rig.u;
    const disc = add(this.rig.pivot, scl(u, this.hookY));
    const dv = this.rig.velAt(this.hookY);
    this.discPos = disc; this.discUp = scl(u, -1);
    /* rotation carrying straight-down onto the rig's cord */
    const down = [0, -1, 0];
    const ax = cross(down, u);
    const s = len(ax);
    const ang = Math.atan2(s, dot(down, u));
    const axis = s > 1e-9 ? scl(ax, 1 / s) : [1, 0, 0];
    this.clapper.pivot = disc; this.clapper.pivotVel = dv;
    for (let i = 0; i < this.nT; i++) {
      const off = [this.ring * Math.cos(this.az[i]), 0, this.ring * Math.sin(this.az[i])];
      const r = s > 1e-9 ? rot(off, axis, ang) : off;
      this.tubes[i].pivot = add(disc, r);
      this.tubes[i].pivotVel = dv;
      this.tubes[i].hangWorld = add(disc, r);
    }
  }

  setHang(xi) { this.xiHang = xi; this.rebuildTubes(); }

  tubeEnds(i) {
    const s = this.tubes[i];
    return [s.pointAt(s.rTop), s.pointAt(s.rTop + s.L)];
  }

  dragForce(vw, vb, A) {
    const rel = sub(vw, vb);
    return scl(rel, 0.5 * RHO_AIR * CD * A * len(rel));
  }

  step(dt) {
    this.events.length = 0;
    const NS = 8, h = dt / NS;
    for (let s = 0; s < NS; s++) {
      this.wind.step(h);
      const vw = this.wind.at(this.wind.t);
      this.placePivots();

      /* the rig on its eave hook: gravity plus the drag of everything it holds */
      const rg = this.rig;
      rg.applyForce(this.hookY, [0, -this.mTotal * G, 0]);
      let Atot = this.aSail + 0.0035;
      for (let i = 0; i < this.nT; i++) Atot += this.od * this.L[i] * 0.9;
      rg.applyForce(this.hookY, this.dragForce(vw, rg.velAt(this.hookY), Atot));

      /* the clapper assembly: gravity, and the wind on its broad sail */
      const cl = this.clapper;
      cl.applyForce(this.rClap, [0, -this.mClap * G, 0]);
      cl.applyForce(this.rSail, [0, -this.mSail * G, 0]);
      cl.applyForce(this.rSail, this.dragForce(vw, cl.velAt(this.rSail), this.aSail));
      cl.applyForce(this.rClap, this.dragForce(vw, cl.velAt(this.rClap), 0.0035));

      /* the tubes: heavy, small sail area — they lean, they do not fly */
      for (let i = 0; i < this.nT; i++) {
        const tb = this.tubes[i];
        tb.applyForce(tb.rCg, [0, -tb.m * G, 0]);
        tb.applyForce(tb.rCg, this.dragForce(vw, tb.velAt(tb.rCg), this.od * tb.L * 0.9));
      }

      rg.integrate(h);
      cl.integrate(h);
      for (let i = 0; i < this.nT; i++) this.tubes[i].integrate(h);
      this.placePivots();

      /* the clapper hangs INSIDE its ring and cannot leave it */
      const tilt = Math.acos(Math.max(-1, Math.min(1, -cl.u[1])));
      if (tilt > this.thetaMax) {
        const ax = cross([0, -1, 0], cl.u);
        if (len(ax) > 1e-9) {
          cl.u = rot([0, -1, 0], norm(ax), this.thetaMax);
          cl.w = scl(cl.w, -0.35);
        }
      }

      for (let i = 0; i < this.nT; i++) {
        if (this.refract[i] > 0) { this.refract[i] -= h; continue; }
        const ev = this.contact(i);
        if (ev) { this.events.push(ev); this.refract[i] = 0.085; }
      }
      this.t += h;
    }
    return this.events;
  }

  contact(i) {
    const cl = this.clapper, tb = this.tubes[i];
    const P = cl.pointAt(this.rClap);
    const A = tb.pointAt(tb.rTop), B = tb.pointAt(tb.rTop + tb.L);
    const AB = sub(B, A), L2 = dot(AB, AB);
    let s = Math.max(0, Math.min(1, dot(sub(P, A), AB) / L2));
    const Q = add(A, scl(AB, s));
    const d = sub(P, Q);
    const dist = len(d);
    const touch = this.rPuck + this.od / 2;
    if (dist > touch || dist < 1e-9) return null;

    const nrm = scl(d, 1 / dist);
    const rQ = tb.rTop + s * tb.L;
    const vn = dot(sub(cl.velAt(this.rClap), tb.velAt(rQ)), nrm);
    if (vn > -V_STRIKE) return null;           /* leaning on it, not arriving */

    const ac = cross(scl(cl.u, this.rClap), nrm);
    const at = cross(scl(tb.u, rQ), nrm);
    const kc = dot(ac, ac) / cl.I, kt = dot(at, at) / tb.I;
    const e = 0.42;
    const j = -(1 + e) * vn / (kc + kt);
    cl.applyImpulse(this.rClap, scl(nrm, j));
    tb.applyImpulse(rQ, scl(nrm, -j));

    /* push apart so the next substep does not re-trigger on the same contact */
    const dth = (touch - dist) / this.rClap;
    const ax = cross(nrm, cl.u);
    if (len(ax) > 1e-6) cl.u = norm(rot(cl.u, norm(ax), -dth * 1.02));

    return {
      tube: i, vel: -vn, xi: (rQ - tb.rTop) / tb.L,
      point: Q, normal: nrm,
      /* the bending plane is the one holding the tube's axis and the blow */
      bend: norm(sub(nrm, scl(tb.u, dot(nrm, tb.u)))),
    };
  }
}

/* ---------------------------------------------------------------------------
 *  5 · MEASURING THE CLAIM
 *
 *  sustainCurve() never consults the formula for its answer.  It SYNTHESISES a
 *  real strike at each hanging position with the same ModalBank the page plays,
 *  fits an exponential to the rendered audio's RMS envelope, and reports T60 in
 *  seconds.  The minima of that curve fall on modeNodes(0).
 * ------------------------------------------------------------------------ */

/* A two-pole RBJ bandpass — used to ask a decay question about ONE partial.
 * The tail of a struck tube is a race between six modes; if you want the
 * FUNDAMENTAL's sustain you have to listen to the fundamental. */
export function bandpass(buf, sr, f, Q) {
  const w0 = 2 * Math.PI * f / sr;
  const al = Math.sin(w0) / (2 * Q), c = Math.cos(w0);
  const a0 = 1 + al;
  const b0 = al / a0, b2 = -al / a0, a1 = -2 * c / a0, a2 = (1 - al) / a0;
  const out = new Float32Array(buf.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}

export function rmsEnvelope(buf, sr, winMs = 40) {
  const w = Math.max(8, Math.round(sr * winMs / 1000));
  const out = [];
  for (let i = 0; i + w <= buf.length; i += w) {
    let s = 0;
    for (let k = i; k < i + w; k++) s += buf[k] * buf[k];
    out.push({ t: (i + w / 2) / sr, v: Math.sqrt(s / w) });
  }
  return out;
}

/* Least-squares slope of log(rms) over the stretch that is still above the
 * floor — a T60 a dead tube cannot fake, because a silent tail is excluded
 * rather than counted as infinite sustain. */
export function measureT60(buf, sr, opts) {
  const o = opts || {};
  const env = rmsEnvelope(buf, sr, o.winMs || 40);
  let peak = 0, pi = 0;
  for (let i = 0; i < env.length; i++) if (env[i].v > peak) { peak = env[i].v; pi = i; }
  if (peak <= 0) return { t60: 0, n: 0, peak: 0 };
  const floor = peak * Math.pow(10, (o.floorDb === undefined ? -40 : o.floorDb) / 20);
  const pts = [];
  for (let i = pi + 1; i < env.length; i++) {
    if (env[i].v < floor) break;
    pts.push([env[i].t, Math.log(env[i].v)]);
  }
  if (pts.length < 4) return { t60: 0, n: pts.length, peak: peak };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of pts) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; }
  const n = pts.length;
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  if (slope >= 0) return { t60: 0, n: n, peak: peak };
  return { t60: Math.log(1000) / -slope, n: n, peak: peak };
}

/* One tube, struck once, hung at xi.  Mono Float32Array. */
export function renderStrike(f1, xiHang, opts) {
  const o = opts || {};
  const sr = o.sr || 44100;
  const secs = o.seconds === undefined ? 8 : o.seconds;
  const od = o.od || DEFAULT_TUBE.od, wall = o.wall || DEFAULT_TUBE.wall;
  const L = cutLength(f1, od, wall);
  const bank = new ModalBank([modeFreqs(L, od, wall)], sr, {
    pans: [0], xiHang: xiHang,
    gain: o.gain === undefined ? 0.55 : o.gain,
    thudGain: o.thud ? 1 : 0,
    seed: o.seed || 7,
  });
  bank.strike(0, o.vel === undefined ? 0.9 : o.vel, o.xiStrike === undefined ? 0.5 : o.xiStrike);
  const n = Math.round(sr * secs);
  const a = new Float32Array(n), b = new Float32Array(n);
  bank.render(a, b, n);
  return a;
}

/* T60 against hanging position — measured, not derived. */
export function sustainCurve(f1, opts) {
  const o = opts || {};
  const steps = o.steps || 33;
  const sr = o.sr || 16000;
  const lo = o.lo === undefined ? 0.02 : o.lo, hi = o.hi === undefined ? 0.50 : o.hi;
  const out = [];
  for (let i = 0; i < steps; i++) {
    const xi = lo + (hi - lo) * (i / (steps - 1));
    const buf = renderStrike(f1, xi, { sr: sr, seconds: 14, thud: false, xiStrike: 0.42, vel: 0.9 });
    /* listen to the fundamental alone: its sustain is what the cord decides */
    const band = bandpass(buf, sr, f1, 14);
    out.push({ xi: xi, t60: measureT60(band, sr, { winMs: 60, floorDb: -45 }).t60 });
  }
  return out;
}

/* Sub-grid peak of a measured curve: a parabola through the best sample and
 * its two neighbours.  Without it you can only ever report the grid spacing. */
export function peakOf(curve) {
  let bi = 0;
  for (let i = 1; i < curve.length; i++) if (curve[i].t60 > curve[bi].t60) bi = i;
  if (bi === 0 || bi === curve.length - 1) return { xi: curve[bi].xi, t60: curve[bi].t60 };
  const y0 = curve[bi - 1].t60, y1 = curve[bi].t60, y2 = curve[bi + 1].t60;
  const d = y0 - 2 * y1 + y2;
  const shift = d === 0 ? 0 : 0.5 * (y0 - y2) / d;
  const h = curve[bi + 1].xi - curve[bi].xi;
  return { xi: curve[bi].xi + shift * h, t60: y1 };
}

/* ---------------------------------------------------------------------------
 *  6 · THE SELF-TEST THE TWIN RUNS
 * ------------------------------------------------------------------------ */

export function runChimeSelfTest() {
  const lines = [];
  const ok = function (name, pass, detail) { lines.push({ name: name, ok: !!pass, detail: detail }); };

  const want = [1, 2.7565, 5.4039, 8.9330, 13.3443, 18.6379];
  let worst = 0;
  for (let i = 0; i < want.length; i++) worst = Math.max(worst, Math.abs(MODE_RATIO[i] - want[i]));
  ok('free-free ladder 1 : 2.756 : 5.404 : 8.933 : 13.34 : 18.64', worst < 5e-4,
     'max deviation ' + worst.toExponential(2));

  const nd = modeNodes(0);
  ok('mode 1 stands still at 0.2242 / 0.7758',
     nd.length === 2 && Math.abs(nd[0] - 0.2242) < 5e-4 && Math.abs(nd[1] - 0.7758) < 5e-4,
     nd.map(function (x) { return x.toFixed(4); }).join(', '));

  const Lr = cutLength(440, DEFAULT_TUBE.od, DEFAULT_TUBE.wall);
  ok('a tube cut for 440 Hz sings 440 Hz',
     Math.abs(fundamental(Lr, DEFAULT_TUBE.od, DEFAULT_TUBE.wall) - 440) < 1e-9,
     'L = ' + (Lr * 1000).toFixed(1) + ' mm');

  const f2 = fundamental(2 * Lr, DEFAULT_TUBE.od, DEFAULT_TUBE.wall);
  ok('twice as long is two octaves down', Math.abs(f2 - 110) < 1e-9, f2.toFixed(4) + ' Hz');

  return { lines: lines, pass: lines.filter(function (l) { return l.ok; }).length, total: lines.length };
}
