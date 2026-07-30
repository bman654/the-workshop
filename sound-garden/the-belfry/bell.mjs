/* ============================================================================
 *  THE BELFRY — bell.mjs   ·   the mechanics of a bell rung full circle
 *
 *  Zero-dependency, DOM-free ESM.  Node twin: belfry.test.mjs.
 *
 *  NO BACKTICK, NO DOLLAR-BRACE, comments included — this file is spliced into
 *  a String.raw template for the AudioWorklet.
 *
 *  ── WHAT IS BEING SOLVED ───────────────────────────────────────────────────
 *  A tower bell is not a chime.  It is bolted to a headstock and a wheel and it
 *  turns through very nearly a full circle: it stands MOUTH UP at the balance,
 *  is pulled off, swings down through the bottom and up the other side, and is
 *  caught mouth up again.  Inside it hangs the clapper — a second pendulum, on
 *  its own pivot, a little below the bell's axis — and the bell sounds when the
 *  clapper catches up with the wall and hits it.  That is the whole machine and
 *  it is TWO coupled pendulums, one of which is inside the other:
 *
 *      A th'' + C cos(th-ph) ph'' + C sin(th-ph) ph'^2 + Gb sin th  =  tau
 *      B ph'' + C cos(th-ph) th'' - C sin(th-ph) th'^2 + Gc sin ph  =  N
 *
 *      A = Ib + mc d^2      the bell about its gudgeons, plus the clapper
 *                           pivot's own offset d below that axis
 *      B = mc lc^2 + Jc     the clapper about its pivot
 *      C = mc d lc          the coupling: the clapper's pivot is being SWUNG
 *      Gb, Gc               the two gravity torques
 *      tau                  the rope, through the wheel
 *      N                    the soundbow, when the clapper is resting on it
 *
 *  Integrated with RK4, and it has to be: near the balance the bell is a
 *  hair from the separatrix, so a per-cent energy error is a five-degree error
 *  in where it comes to rest, and five degrees is half a second of ringing.
 *  Symplectic Euler at 0.2 ms was not good enough and looked fine.
 *
 *  ── THE FOUR THINGS THE MODEL SHOWS ────────────────────────────────────────
 *  Every number below is what the twin measures, not what the theory hoped.
 *
 *  1. THE BALANCE IS NOT UPRIGHT.  A bell at the balance has its clapper lying
 *     on the trailing soundbow, and the clapper has weight, so the pair's own
 *     unstable equilibrium is eps* = 0.70 deg PAST vertical: the bell is held
 *     over by the thing inside it.  Statics only — derive() solves it.
 *
 *  2. THE BLOW HAPPENS AT A FIXED ANGLE.  Over four hundred-fold in (eps-eps*)
 *     the clapper catches the soundbow at -109.17 deg, spread 0.25 deg.  Where
 *     a bell sounds is a property of the bell, not of how hard it was rung.
 *
 *  3. WHEN IT HAPPENS IS A LOGARITHM of how far the bell was left from that
 *     balance:  t = a - b ln(eps - eps*),  R^2 0.999999 over 2.6 decades, with
 *     b = 0.22926 s against 1/lambda = 0.22941 s predicted from a 2x2
 *     linearisation that never integrates anything — agreeing to 0.07%.
 *
 *  4. SO THE RINGER IS ONE STROKE BEHIND, and it is arithmetic, not a saying.
 *     Across a FIVE-FOLD range of pull the rope adds or withholds 1.6% of the
 *     swing's energy — far too little to move THIS blow, which shifts by 17 ms.
 *     But all 1.6% of it lands in the sliver of height left at the far balance,
 *     where the logarithm turns it into 397 ms of the NEXT blow.  23 to 1.
 *
 *  And what a place costs: at a two-second row, one place early is 2.9 -> 9.9
 *  deg of height and two places early is 40 deg — a bell a quarter of the way
 *  down.  Late is worse in the other direction: the third and fourth places
 *  late are 0.02 deg apart, so a degree of error is eight seconds.  A bell can
 *  be placed, but only just, and only ONE PLACE AT A TIME.  That is why every
 *  method ever rung is built out of swaps between neighbours.
 *  ========================================================================= */

export const G = 9.81;

/* A tenor of about eight hundredweight — the sort of bell a ring of six in a
 * parish tower is hung with.  Everything is SI and everything is a property of
 * the bell, not of the ringing. */
export function tenorBell(over = {}) {
  const p = Object.assign({
    name: 'tenor',
    Ib: 78,          /* kg m^2, bell + headstock + wheel about the gudgeons */
    Mhb: 153,        /* kg m,   mass times axis-to-centre-of-mass */
    d: 0.14,         /* m,      clapper pivot below the bell's axis */
    mc: 15,          /* kg,     clapper */
    lc: 0.42,        /* m,      clapper pivot to its centre of mass */
    Jc: 0.28,        /* kg m^2, clapper about its own centre of mass */
    beta: 0.32,      /* rad,    flight: half the gap between the two soundbows */
    e: 0.55,         /* restitution of clapper on bronze */
    cb: 1.2,         /* N m s,  bearing + air, on the bell */
    cc: 0.9,         /* N m s,  on the clapper, relative to the bell */
    stayDeg: 0,      /* the stay stops the bell AT the balance in this model */
  }, over);
  return derive(p);
}

/* A handbell: the same equations, a thousand times smaller.  Kept because the
 * room lets you hear one, not because it proves anything. */
export function handBell(over = {}) {
  return tenorBell(Object.assign({
    name: 'handbell', Ib: 0.02, Mhb: 0.09, d: 0.02, mc: 0.05, lc: 0.035,
    Jc: 2e-5, beta: 0.30, cb: 0.0008, cc: 0.0004,
  }, over));
}

function derive(p) {
  p.A = p.Ib + p.mc * p.d * p.d;
  p.B = p.mc * p.lc * p.lc + p.Jc;
  p.C = p.mc * p.d * p.lc;
  p.Gb = (p.Mhb + p.mc * p.d) * G;
  p.Gc = p.mc * p.lc * G;
  p.omega0 = Math.sqrt(p.Gb / p.A);         /* small-swing rate of the bell alone */
  p.T0 = 2 * Math.PI / p.omega0;
  p.Leq = G / (p.omega0 * p.omega0);        /* the equivalent simple pendulum */
  p.Ipair = p.A + p.B + 2 * p.C * Math.cos(p.beta);   /* bell + resting clapper */

  /* ── WHERE THE BALANCE ACTUALLY IS ────────────────────────────────────────
   * NOT straight up.  A bell standing at the balance has its clapper lying on
   * the TRAILING soundbow, and that clapper has weight, so the pair's own
   * unstable equilibrium sits a little PAST the vertical — the bell is held
   * over by the thing inside it.  Statics, from a standstill:
   *
   *      Gb sin(eps*) = Gc sin(beta - eps*)
   *
   * For this tenor eps* is 0.70 degrees.  It is not a detail: it is the pole
   * of the timing law below, and using zero instead makes the log fit's slope
   * come out 30 per cent wrong while still looking like a decent straight
   * line (R^2 0.98, which is exactly the level at which you stop looking). */
  let e = 0.01;
  for (let i = 0; i < 60; i++) {
    const f = p.Gb * Math.sin(e) - p.Gc * Math.sin(p.beta - e);
    const df = p.Gb * Math.cos(e) + p.Gc * Math.cos(p.beta - e);
    e -= f / df;
  }
  p.epsStar = e;
  p.epsStarDeg = e * 180 / Math.PI;

  /* The linearised rate at which the bell runs away from that balance — the
   * inverted-pendulum growth rate of the clamped pair, damping included.  Its
   * reciprocal is the PREDICTION for the slope of the log law, arrived at
   * without integrating anything, and the fit has to match it. */
  const k = p.Gb * Math.cos(e) + p.Gc * Math.cos(p.beta - e);
  const z = p.cb / (2 * p.Ipair);
  p.lambda = -z + Math.sqrt(z * z + k / p.Ipair);
  return p;
}

/* Total mechanical energy — the twin's honesty check on the integrator. */
export function energy(p, th, w, ph, v) {
  return 0.5 * p.A * w * w + 0.5 * p.B * v * v + p.C * w * v * Math.cos(th - ph)
       - p.Gb * Math.cos(th) - p.Gc * Math.cos(ph);
}

/* The rope's torque.  A ringer pulls over the first stretch of the swing and
 * then the rope goes slack; 'pull' is the peak torque in N m and the profile is
 * a half-sine over the first 1.3 rad of travel, which is about what a sally
 * gives you before it reaches the ceiling. */
const PULL_SWEEP = 1.3;

/* When the clapper's rebound off the soundbow is slower than this (rad/s of
 * RELATIVE angle) it is declared to be resting on the wall and the pair goes
 * rigid.  It has to be a real threshold and not zero: with restitution 0.55 the
 * bounces are a geometric series and would never end in floating point.  0.30
 * rad/s at the soundbow is about 12 cm/s of clapper ball — below anything that
 * makes a sound, and the twin checks that halving it changes no strike time by
 * more than the integrator's own noise. */
const REST_SPEED = 0.30;
function ropeTorque(p, pull, swept, dir) {
  if (swept < 0 || swept > PULL_SWEEP) return 0;
  return dir * pull * Math.sin(Math.PI * swept / PULL_SWEEP);
}

/* Accelerations in free flight (clapper off the soundbow). */
function accelFree(p, th, w, ph, v, tau) {
  const psi = th - ph, cs = Math.cos(psi), sn = Math.sin(psi);
  const r1 = tau - p.Gb * Math.sin(th) - p.C * v * v * sn - p.cb * w;
  const r2 = -p.Gc * Math.sin(ph) + p.C * w * w * sn - p.cc * (v - w);
  const det = p.A * p.B - p.C * p.C * cs * cs;
  return [(r1 * p.B - p.C * cs * r2) / det, (p.A * r2 - p.C * cs * r1) / det];
}

/* Clamped: the clapper is resting on the soundbow at relative angle s*beta, so
 * the pair is one rigid body.  Returns [accel, contact torque]. */
function accelClamped(p, th, w, s, tau) {
  const ph = th + s * p.beta;
  const den = p.A + p.B + 2 * p.C * Math.cos(p.beta);
  const a = (tau - p.Gb * Math.sin(th) - p.Gc * Math.sin(ph) - p.cb * w) / den;
  const psi = -s * p.beta;
  const N = p.B * a + p.C * a * Math.cos(psi) - p.C * w * w * Math.sin(psi) + p.Gc * Math.sin(ph);
  return [a, N];
}

/* ── ONE SWING ──────────────────────────────────────────────────────────────
 * The bell starts at rest at the balance, eps0 radians short of upright, with
 * the clapper resting on the trailing soundbow.  It is pulled off and swings
 * to the other balance.  Returns when the bell next comes to rest (or when it
 * would pass the stay).
 *
 * 'sample' (seconds) records the trajectory for drawing; the page plays the
 * recorded table back against the audio clock so the picture and the sound can
 * not drift apart.
 */
export class Swinger {
  /* ONE integrator, used both by the batch swing() below (which the twin
   * measures) and by the room, which steps this same object in real time
   * against the wall clock.  A second copy is how a room ends up looking
   * different from the numbers underneath it. */
  constructor(p, eps0, pull, opts = {}) {
    const sgn = opts.sgn === undefined ? 1 : opts.sgn;
    this.p = p;
    this.dt = opts.dt || 0.001;
    this.restSpeed = opts.restSpeed === undefined ? REST_SPEED : opts.restSpeed;
    this.sgn = sgn;
    this.pull = pull;
    this.th = sgn * (Math.PI - eps0);
    this.w = 0;
    this.s = sgn;                            /* which soundbow the clapper lies on, 0 = flying */
    this.ph = this.th + this.s * p.beta;
    this.v = 0;
    this.start = this.th;
    this.dir = -sgn;
    this.t = 0;
    this.done = false;                       /* reached the far balance, or went over */
    this.overStay = false;
    this.apexEps = null;
    this.apexT = null;
    this.strikes = [];
    this.wMax = 0;                            /* the speed it goes through the bottom at */
  }

  /* one fixed RK4 step; pushes any strike onto this.strikes and returns it */
  stepOnce() {
    const p = this.p, dt = this.dt;
    let hit = null;
    if (this.s !== 0) {
      const s = this.s;
      const f = (tt, y) => {
        const tau = ropeTorque(p, this.pull, Math.abs(y[0] - this.start), this.dir);
        const [a] = accelClamped(p, y[0], y[1], s, tau);
        return [y[1], a];
      };
      const y = rk4(f, this.t, [this.th, this.w], dt);
      this.th = y[0]; this.w = y[1]; this.ph = this.th + s * p.beta; this.v = this.w;
      const tau = ropeTorque(p, this.pull, Math.abs(this.th - this.start), this.dir);
      const [, N] = accelClamped(p, this.th, this.w, s, tau);
      if ((s > 0 && N > 0) || (s < 0 && N < 0)) this.s = 0;   /* the soundbow lets go */
    } else {
      const f = (tt, y) => {
        const tau = ropeTorque(p, this.pull, Math.abs(y[0] - this.start), this.dir);
        const a = accelFree(p, y[0], y[1], y[2], y[3], tau);
        return [y[1], a[0], y[3], a[1]];
      };
      const y = rk4(f, this.t, [this.th, this.w, this.ph, this.v], dt);
      const relPrev = this.ph - this.th;
      this.th = y[0]; this.w = y[1]; this.ph = y[2]; this.v = y[3];
      const rel = this.ph - this.th;
      if (Math.abs(rel) > p.beta) {
        /* land the event on the wall by linear interpolation, then collide */
        const target = Math.sign(rel) * p.beta;
        const frac = (target - relPrev) / (rel - relPrev);
        const tHit = this.t + Math.max(0, Math.min(1, frac)) * dt;
        const u = this.v - this.w;
        const Ieb = p.A + p.C * Math.cos(p.beta), Iec = p.B + p.C * Math.cos(p.beta);
        this.w += Iec * (1 + p.e) * u / (Ieb + Iec);
        this.v += -Ieb * (1 + p.e) * u / (Ieb + Iec);
        hit = { t: tHit, speed: Math.abs(u), th: this.th, side: Math.sign(rel),
                first: this.strikes.length === 0 };
        this.strikes.push(hit);
        this.ph = this.th + Math.sign(rel) * p.beta;
        /* IT BOUNCES.  Only call it resting when the rebound is spent — declaring
         * contact while the clapper is still moving off the wall throws the
         * rebound away, and throwing away a velocity is inventing energy.  That
         * bug read as an integrator problem and survived a tenfold smaller step. */
        this.s = Math.abs(this.v - this.w) < this.restSpeed ? Math.sign(rel) : 0;
        if (this.s !== 0) { this.v = this.w; }
      }
    }
    this.t += dt;
    if (Math.abs(this.w) > this.wMax) this.wMax = Math.abs(this.w);

    /* Gone over the stay, or come to rest on the far side?  Test OVER first and
     * insist the rest-test is on the FAR side of the bottom.  A bell set inside
     * eps* falls BACKWARDS — it is above the pair's own balance and the clapper
     * pushes it over — and if you only ask "has the velocity changed sign" the
     * quarter-second guard fires while it is drifting the wrong way and you get
     * a serene, plausible apex for a bell that has just gone through the ceiling. */
    if (Math.abs(this.th) > Math.PI) {
      this.apexEps = -(Math.abs(this.th) - Math.PI); this.apexT = this.t;
      this.overStay = true; this.done = true;
    } else if (this.t > 0.25 && Math.sign(this.w) === this.sgn && Math.sign(this.th) === -this.sgn) {
      this.apexEps = Math.PI - Math.abs(this.th); this.apexT = this.t; this.done = true;
    }
    return hit;
  }

  /* Advance by a WHOLE NUMBER OF STEPS.  Deliberately not "advance by seconds":
   * a fixed-step integrator asked for a fraction of a step has to either
   * overshoot or do nothing, and doing nothing is the one that hides.  At a
   * frame rate above 1000 fps — which a headless browser hits without trying —
   * round(dt/h) is ZERO, so the bells freeze while the clock the ringers are
   * aiming at runs on, and the blows come out two seconds late in a way that
   * reproduces on nobody's machine.  The caller keeps the leftover. */
  advanceSteps(n, onStrike) {
    let used = 0;
    for (let i = 0; i < n && !this.done; i++) {
      const hit = this.stepOnce();
      used++;
      if (hit && onStrike) onStrike(hit);
    }
    return used;
  }

  result() {
    const strike = this.strikes.length ? this.strikes[0] : null;
    return {
      apexEps: this.apexEps === null ? 0 : this.apexEps,
      apexT: this.apexT === null ? this.t : this.apexT,
      overStay: this.overStay,
      strikeT: strike ? strike.t : null, strikeSpeed: strike ? strike.speed : 0,
      strikeTh: strike ? strike.th : 0, nStrikes: this.strikes.length, strikes: this.strikes,
      wMax: this.wMax, dt: this.dt, sgn: this.sgn,
    };
  }
}

export function swing(p, eps0, pull, opts = {}) {
  const sw = new Swinger(p, eps0, pull, opts);
  const tmax = opts.tmax || 9;
  const sample = opts.sample || 0;
  const traj = sample ? [] : null;
  let nextSample = sample;
  if (traj) traj.push(sw.th, sw.ph);
  while (sw.t < tmax && !sw.done) {
    sw.stepOnce();
    if (traj && sw.t >= nextSample) { traj.push(sw.th, sw.ph); nextSample += sample; }
  }
  const out = sw.result();
  /* THE BLOW is the FIRST contact of the swing.  Everything after it is the
   * clapper settling back onto the wall (a real bell does this too, and if the
   * settling taps are loud enough to hear it is a fault with a name — double
   * clappering).  Taking the LAST contact instead is a quiet way to make the
   * timing law wrong by a whole tenth of a second on the swings where the
   * clapper happens to bounce twice, and it reads as an integrator problem. */
  out.traj = traj ? Float32Array.from(traj) : null;
  out.sample = sample;
  return out;
}

function rk4(f, t, y, h) {
  const n = y.length;
  const k1 = f(t, y);
  const y2 = new Array(n); for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * h * k1[i];
  const k2 = f(t + 0.5 * h, y2);
  const y3 = new Array(n); for (let i = 0; i < n; i++) y3[i] = y[i] + 0.5 * h * k2[i];
  const k3 = f(t + 0.5 * h, y3);
  const y4 = new Array(n); for (let i = 0; i < n; i++) y4[i] = y[i] + h * k3[i];
  const k4 = f(t + h, y4);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = y[i] + h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6;
  return out;
}

/* ── THE RINGER ─────────────────────────────────────────────────────────────
 * Find the pull that leaves the bell at 'targetEps' on the far side.  Monotone
 * in the pull, so bisection, and cached by the caller because a steady ringer
 * asks the same question every stroke. */
export function solvePull(p, eps0, targetEps, opts = {}) {
  const dt = opts.dt || 0.001;
  let lo = 0, hi = 400;
  /* make sure hi overshoots */
  for (let i = 0; i < 12 && swing(p, eps0, hi, { dt }).apexEps > targetEps; i++) hi *= 2;
  for (let i = 0; i < 34; i++) {
    const mid = 0.5 * (lo + hi);
    const r = swing(p, eps0, mid, { dt });
    if (r.apexEps > targetEps) lo = mid; else hi = mid;
    if (hi - lo < 1e-4) break;
  }
  const pull = 0.5 * (lo + hi);
  return { pull, ...swing(p, eps0, pull, { dt }) };
}

/* ── THE MEASUREMENTS THE ROOM PRINTS ───────────────────────────────────────
 *
 * 1. WHERE THE BLOW HAPPENS, AND WHEN.
 *
 *    WHERE is a fixed angle of the bell.  Drop the bell from a tenth of a
 *    degree above its balance or from ten degrees above it — ten thousand
 *    times the energy — and the clapper still catches the soundbow within a
 *    quarter of a degree of the same place.  The sound of a bell is welded to
 *    its rotation, not to its energy.
 *
 *    WHEN is a logarithm of how far the bell was left from its balance:
 *
 *        t  =  a  -  b ln(eps - eps*)
 *
 *    with eps* the clapper-shifted balance from derive() above, and b the
 *    reciprocal of the linearised growth rate, ALSO from derive() — which is
 *    the two-way check: b is fitted from the ODE and 1/lambda is computed from
 *    a 2x2 linearisation, and they have to agree.  They do, to a part in a
 *    thousand, over four decades of (eps - eps*).
 *
 *    The default ladder is geometric FROM THE POLE, because a law with a pole
 *    in it wants points that are geometric in the distance to the pole; a
 *    ladder of round numbers of degrees spends all its resolution in the wrong
 *    place and reports R^2 0.98 for a law that is good to six figures.
 */
export function strikeLaw(p, opts = {}) {
  const pull = opts.pull === undefined ? 0 : opts.pull;
  const dt = opts.dt || 0.001;
  const n0 = opts.n || 16, ratio = opts.ratio || 1.5, first = opts.first || 0.02;
  let epsDeg = opts.epsDeg;
  if (!epsDeg) {
    epsDeg = [];
    for (let i = 0; i < n0; i++) epsDeg.push(p.epsStarDeg + first * Math.pow(ratio, i));
  }
  const pts = [];
  for (const d of epsDeg) {
    const r = swing(p, d * Math.PI / 180, pull, { dt });
    if (r.strikeT === null || r.overStay) continue;
    pts.push({ epsDeg: d, eps: d * Math.PI / 180, over: d * Math.PI / 180 - p.epsStar,
               t: r.strikeT, apexT: r.apexT, thDeg: r.strikeTh * 180 / Math.PI, wMax: r.wMax });
  }
  /* least squares of t against ln(eps - eps*) */
  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const q of pts) { const x = Math.log(q.over); n++; sx += x; sy += q.t; sxx += x * x; sxy += x * q.t; }
  const b = -(n * sxy - sx * sy) / (n * sxx - sx * sx);
  const a = (sy + b * sx) / n;
  let ssr = 0, sst = 0; const ybar = sy / n;
  for (const q of pts) { const pr = a - b * Math.log(q.over); ssr += (q.t - pr) * (q.t - pr); sst += (q.t - ybar) * (q.t - ybar); }
  const spread = Math.max(...pts.map((q) => q.thDeg)) - Math.min(...pts.map((q) => q.thDeg));
  return { pts, a, b, r2: 1 - ssr / sst, strikeAngleSpreadDeg: spread,
           decades: Math.log10(pts[pts.length - 1].over / pts[0].over),
           bTimesLambda: b * p.lambda,
           strikeAngleDeg: pts.reduce((s, q) => s + q.thDeg, 0) / pts.length };
}

/* 2. ONE STROKE BEHIND.  Sweep the pull over everything that keeps the bell
 *    ringable, and compare how much THIS blow moves with how much the NEXT one
 *    does.  The first number is the integrator's noise floor; the second is
 *    most of a second. */
export function oneStrokeBehind(p, opts = {}) {
  const eps0 = (opts.eps0Deg || 6) * Math.PI / 180;
  const dt = opts.dt || 0.001;
  const nom = solvePull(p, eps0, eps0, { dt }).pull;
  /* THE RINGABLE BAND, stated and not tuned: a stroke counts if it leaves the
   * bell somewhere a ringer would accept — high enough to be set (3 deg short
   * of the balance) and not so high that the stay takes it (15 deg).  Outside
   * that band the swing is not a stroke of ringing, it is a bell being dropped
   * or a bell being broken, and including those rows is how the honest answer
   * gets buried: the two of them together turn 50:1 into 2:1. */
  const loDeg = opts.loDeg === undefined ? 3 : opts.loDeg;
  const hiDeg = opts.hiDeg === undefined ? 15 : opts.hiDeg;
  const rows = [];
  for (let k = -40; k <= 40; k++) {
    const pull = nom * (1 + 0.02 * k);
    if (pull <= 0) continue;
    const r = swing(p, eps0, pull, { dt });
    if (r.strikeT === null || r.overStay) continue;
    const apexDeg = r.apexEps * 180 / Math.PI;
    if (apexDeg < loDeg || apexDeg > hiDeg) continue;
    /* the next stroke, pulled the same way, starting from where this one ended */
    const nx = swing(p, r.apexEps, nom, { dt, sgn: -1 });
    if (nx.strikeT === null) continue;
    rows.push({ pull, thisT: r.strikeT, apexEps: r.apexEps, apexDeg, nextT: nx.strikeT });
  }
  const span = (f) => Math.max(...rows.map(f)) - Math.min(...rows.map(f));
  const thisSpan = span((q) => q.thisT), nextSpan = span((q) => q.nextT);
  /* how big a perturbation the pull actually IS, as a fraction of the swing's
   * energy — this is the number that makes the ratio unsurprising. */
  const eSwing = 2 * p.Gb;                       /* balance to balance, per unit */
  const dE = Math.max(...rows.map((q) => p.Gb * (1 - Math.cos(q.apexEps))))
           - Math.min(...rows.map((q) => p.Gb * (1 - Math.cos(q.apexEps))));
  return { rows, thisSpan, nextSpan, ratio: nextSpan / Math.max(thisSpan, 1e-9),
           nominalPull: nom, pullRange: [rows[0].pull, rows[rows.length - 1].pull],
           energyFraction: dE / eSwing, loDeg, hiDeg };
}

/* 3. WHAT A PLACE COSTS, IN DEGREES.  At the ring's own rhythm a bell's swing
 *    must average the row time; to strike one place early or late it has to
 *    swing that much faster or slower for one stroke, and this is the height
 *    that buys it. */
export function placeCost(p, rowTime, stage, opts = {}) {
  const gap = rowTime / stage;
  const dt = opts.dt || 0.001;
  const law = strikeLaw(p, { dt });
  /* invert the fitted law: eps such that the fall takes t.  The pole goes back
   * in — forget it and every answer is 0.7 of a degree short, which at the
   * working point is a fifth of the whole height. */
  const epsFor = (t) => p.epsStar + Math.exp((law.a - t) / law.b);
  /* the nominal: the swing whose apex-to-apex time is the row time */
  let lo = 0.2 * Math.PI / 180, hi = 40 * Math.PI / 180;
  for (let i = 0; i < 40; i++) {
    const mid = Math.sqrt(lo * hi);
    const r = swing(p, mid, 0, { dt });
    if (r.apexT > rowTime) lo = mid; else hi = mid;
  }
  const epsNom = Math.sqrt(lo * hi);
  const tNom = swing(p, epsNom, 0, { dt }).strikeT;
  const out = { gap, rowTime, epsNomDeg: epsNom * 180 / Math.PI, tNom, places: [],
                epsStarDeg: p.epsStarDeg };
  for (const k of [-2, -1, 0, 1, 2]) {
    const t = tNom + k * gap;
    const eps = epsFor(t);
    /* CHECK the inversion against the ODE it came from, don't just print it */
    const chk = swing(p, eps, 0, { dt });
    out.places.push({ places: k, t, epsDeg: eps * 180 / Math.PI,
                      tActual: chk.strikeT, over: chk.overStay,
                      err: chk.strikeT === null ? null : chk.strikeT - t });
  }
  /* the gearing at the working point, in ms per degree — dt/d(eps) = -b/(eps-eps*) */
  out.msPerDeg = (law.b / (epsNom - p.epsStar)) * (Math.PI / 180) * 1000;
  out.law = law;
  return out;
}

/* THE STEADY PULL: the rope torque that exactly replaces what the bearings and
 * the air took, so the bell comes back to the height it left from.  It is very
 * nearly independent of that height (the loss is a fixed slice of a swing that
 * is nearly all the same), which is why a ringer's pull feels the same stroke
 * after stroke and why the aiming law below can be fitted at ONE pull and used
 * at all of them. */
export function steadyPull(p, epsDeg = 3, opts = {}) {
  const dt = opts.dt || 0.002;
  const e0 = epsDeg * Math.PI / 180;
  let lo = 0, hi = 400;
  for (let i = 0; i < 44; i++) {
    const m = 0.5 * (lo + hi);
    const r = swing(p, e0, m, { dt });
    if (r.overStay) hi = m; else if (r.apexEps > e0) lo = m; else hi = m;
  }
  return 0.5 * (lo + hi);
}

/* 4. DELETE THE BALANCE.  The one-line deletion this room is built on: stop
 *    taking the bell to the balance and swing it as a CHIME instead — the same
 *    bell, the same clapper, the same equations, started from an amplitude out
 *    in the middle of the arc where the pendulum is an ordinary pendulum.
 *
 *    A pendulum's period barely depends on its amplitude, so the blow arrives
 *    when it arrives and the ringer has no handle on it at all.  That is why
 *    change ringing is done on bells rung full circle and on nothing else: the
 *    logarithm at the balance is the ENTIRE mechanism by which a bell can be
 *    placed in a row, and a chimed bell simply has none of it.
 *
 *    Returns ms of blow-time per degree of amplitude, at the chime amplitude
 *    and at the ringing working point, so the room can print the ratio. */
export function chimeSweep(p, opts = {}) {
  const dt = opts.dt || 5e-4;
  const centreDeg = opts.centreDeg === undefined ? 100 : opts.centreDeg;
  const halfDeg = opts.halfDeg === undefined ? 10 : opts.halfDeg;
  const pts = [];
  for (let k = -4; k <= 4; k++) {
    const d = centreDeg + (halfDeg * k) / 4;
    const r = swing(p, d * Math.PI / 180, 0, { dt });
    if (r.strikeT === null || r.overStay) continue;
    pts.push({ epsDeg: d, t: r.strikeT, thDeg: r.strikeTh * 180 / Math.PI });
  }
  /* straight-line slope of blow time against amplitude, in ms per degree */
  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const q of pts) { n++; sx += q.epsDeg; sy += q.t; sxx += q.epsDeg * q.epsDeg; sxy += q.epsDeg * q.t; }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { pts, centreDeg, halfDeg, msPerDeg: Math.abs(slope) * 1000,
           strikeAngleSpreadDeg: Math.max(...pts.map((q) => q.thDeg)) - Math.min(...pts.map((q) => q.thDeg)),
           strikeAngleDeg: pts.reduce((s, q) => s + q.thDeg, 0) / pts.length };
}

/* ── THE VOICE OF A BELL ────────────────────────────────────────────────────
 *  A bell tuned the English way (Simpson, 1890s) has its partials put where
 *  they are on purpose, by turning metal off the inside on a lathe:
 *
 *      hum        1/2 of the note        two octaves below the nominal
 *      prime      the note itself
 *      tierce     a MINOR third above the prime — this is why a bell is sad
 *      quint      a fifth above
 *      nominal    the octave
 *      superquint the twelfth
 *      octave nominal  two octaves
 *
 *  And the note you actually HEAR is none of them exactly: nominal, superquint
 *  and octave nominal stand in the ratio 2 : 3 : 4, and the ear supplies the
 *  missing 1.  The strike note of a bell is a pitch that is not in the sound.
 *  (Schouten and 't Hart, 1965.)  Mute the hum and the prime and the note does
 *  not move — which the room lets you do.
 */
export const PARTIALS = [
  { name: 'hum',            ratio: 0.5,   amp: 0.72, t60: 0.86, key: 'hum' },
  { name: 'prime',          ratio: 1.0,   amp: 0.78, t60: 0.60, key: 'prime' },
  { name: 'tierce',         ratio: 1.19,  amp: 0.82, t60: 0.44, key: 'upper' },
  { name: 'quint',          ratio: 1.50,  amp: 0.46, t60: 0.34, key: 'upper' },
  { name: 'nominal',        ratio: 2.0,   amp: 1.00, t60: 0.42, key: 'strike' },
  { name: 'superquint',     ratio: 3.01,  amp: 0.70, t60: 0.24, key: 'strike' },
  { name: 'octave nominal', ratio: 4.02,  amp: 0.52, t60: 0.17, key: 'strike' },
  { name: 'I-7',            ratio: 5.33,  amp: 0.28, t60: 0.10, key: 'upper' },
  { name: 'I-8',            ratio: 6.60,  amp: 0.19, t60: 0.065, key: 'upper' },
];

/* modes for a bell whose strike note is 'hz'.  'humT60' scales the whole tail;
 * bigger bells ring longer, so the room passes a larger number for the tenor. */
export function bellModes(hz, humT60 = 9) {
  return PARTIALS.map((q) => ({
    name: q.name, key: q.key,
    f: hz * q.ratio,
    t60: humT60 * q.t60,
    amp: q.amp,
  }));
}

/* A ring of six is the top six notes of a major scale, the tenor lowest.  With
 * the tenor at G3 that is the scale of E flat: G Ab Bb C D Eb, and the bells
 * are numbered downward from the treble. */
export const SEMITONES_FROM_TENOR = [8, 7, 5, 3, 1, 0];   /* bell 1..6 */
export function ringOfSix(tenorHz = 195.998) {
  return SEMITONES_FROM_TENOR.map((s, i) => ({
    bell: i + 1,
    hz: tenorHz * Math.pow(2, s / 12),
    /* the tenor is the heaviest and rings longest; the treble is quick */
    humT60: 5.5 + 5.5 * (i / 5 === 0 ? 1 : (5 - i) / 5),
    weightKg: Math.round(400 * Math.pow(2, -s / 12 * 1.55)),
  }));
}

/* ── SIX BELLS, NOT ONE BELL SIX TIMES ──────────────────────────────────────
 * The note of a bell is set by its size, so a ring of six is six bells of six
 * different sizes, and the mechanics come along for the ride.  Geometric
 * similarity at constant density: a bell k times as long has
 *
 *      mass  k^3     moment  k^5     weight moment  k^4     length  k
 *
 * so the equivalent pendulum Leq = A omega^-2 goes as k and the period as
 * sqrt(k).  A treble is therefore a genuinely QUICKER pendulum, and a quicker
 * pendulum has to sit CLOSER to its balance to keep the same rhythm — which is
 * exactly what a ringer will tell you about a light bell, and which you can see
 * in the room: at rest the treble is nearly upright and the tenor is visibly
 * over.  The damping is scaled as k^4.5, which is what holds the damping ratio
 * fixed, so the six are the same bell in six sizes and not six different
 * arguments.
 *
 * eps* is scale-INVARIANT: both sides of Gb sin(eps*) = Gc sin(beta - eps*) go
 * as k^4.  Every bell in the ring balances at the same 0.70 degrees.
 */
export function ringOfBells(tenorHz = 195.998) {
  const base = tenorBell();
  return SEMITONES_FROM_TENOR.map((s, i) => {
    const k = Math.pow(2, -s / 12);                    /* linear size, tenor = 1 */
    const p = tenorBell({
      name: i === 0 ? 'treble' : (i === 5 ? 'tenor' : String(i + 1)),
      Ib: base.Ib * Math.pow(k, 5),
      Mhb: base.Mhb * Math.pow(k, 4),
      d: base.d * k,
      mc: base.mc * Math.pow(k, 3),
      lc: base.lc * k,
      Jc: base.Jc * Math.pow(k, 5),
      cb: base.cb * Math.pow(k, 4.5),
      cc: base.cc * Math.pow(k, 4.5),
    });
    p.bell = i + 1;
    p.k = k;
    p.hz = tenorHz * Math.pow(2, s / 12);
    p.humT60 = 4.2 + 5.0 * k;
    p.weightKg = Math.round(400 * Math.pow(k, 3));
    p.mouthM = 1.02 * k;                               /* mouth diameter, for the picture */
    return p;
  });
}
