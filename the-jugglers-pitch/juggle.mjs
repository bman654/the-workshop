// ============================================================================
//  juggle.mjs — THE JUGGLER'S PITCH's engine.  Pure, DOM-free; the same math
//  the room runs and the Node twin proves.  No backtick anywhere in this file.
//
//  WHAT IS MODELLED
//
//  A juggling pattern is written as a string of digits — 3, 441, 531, 97531 —
//  and that string is not a label.  It is the whole pattern.  Number the beats
//  0, 1, 2, ...; on beat t the juggler throws the ball in the hand that is due,
//  and the digit says HOW MANY BEATS LATER IT COMES DOWN.  A 3 lands three
//  beats later, a 5 five beats later, a 0 means there is nothing in that hand
//  to throw at all.  The hands strictly alternate — right, left, right, left,
//  one throw per beat — and everything else in this room falls out of those
//  two sentences:
//
//    * VALIDITY.  Two balls may not land on the same beat, and a hand may not
//      throw a ball it does not have.  For a period-n pattern that is exactly
//      the condition that i + s[i] (mod n) hits every residue once.
//
//    * THE BALL COUNT IS THE AVERAGE.  b = mean(s).  Not approximately: a
//      pattern whose digits do not average to a whole number cannot be juggled
//      at all.  (5+3+1)/3 = 3, so 531 is a three-ball pattern.
//
//    * ODD CROSSES, EVEN DOES NOT.  The hands alternate every beat, so a ball
//      thrown at beat t is caught at beat t+s by hand (t+s) mod 2.  That is
//      the OTHER hand exactly when s is odd.  This is why a 3-ball cascade is
//      a figure of eight and a 4-ball fountain is two separate circles — one
//      digit is odd and the other is even, and nothing else differs.
//
//    * HOW HIGH.  A throw of s is in the air for (s - dwell) beats, where
//      dwell is the fraction of a beat the hand keeps hold of it.  Ballistics
//      then fixes the apex: h = g*(air)^2/8.  A 5 at the same tempo as a 3 is
//      not 5/3 as high, it is ((5-d)/(3-d))^2 — about two and a half times.
//
//  THE COUNTING LAW (Buhler, Eisenbud, Graham & Wright, 1994)
//
//  The number of valid period-n patterns using at most b balls is EXACTLY
//  (b+1)^n.  Sixteen two-beat patterns with three balls or fewer; eight
//  three-beat patterns with one ball or fewer.  No approximation, no
//  asymptotics — an integer that is right on the nose.  countByBrute() finds
//  it by enumerating every sequence and testing each by simulation;
//  countByOrbits() finds it again from a completely different direction (sum
//  over the permutations of Z_n of a binomial), and the twin makes all three
//  numbers agree.
//
//  WHAT IS A CHOICE AND NOT A CLAIM
//
//  The dwell fraction, the geometry of the hands (how far apart, how far out),
//  the small forward bulge that keeps crossing arcs from sharing a plane, the
//  figure's proportions, and the note each throw sings are all CHOICES.  They
//  are the difference between a diagram and a juggler.  Nothing in this file
//  claims they are measured from a person.  What is claimed is above.
// ============================================================================

export const G = 9.81;                 // m/s^2

// ── the figure, in metres.  A choice (see the header), but one the twin holds
//    to: the arms must actually be able to reach every throw and catch point.
export const BODY = {
  shoulderY: 1.425, shoulderX: 0.185, shoulderZ: 0.0,
  upperArm: 0.305, foreArm: 0.285,
  hipY: 0.94, hipX: 0.105,
  thigh: 0.455, shin: 0.455,
  headY: 1.625, headR: 0.108,
  chestR: 0.150, waistR: 0.128,
  footZ: 0.0,
};

// ── where the hands work.  insideX is where a CROSSING (odd) throw leaves and
//    an even throw is caught; outsideX is where an even throw leaves and a
//    crossing throw is caught.  That single swap is what turns a cascade's
//    inward scoop into a fountain's outward one.
export const HANDS = {
  y: 1.055,
  insideX: 0.125,
  outsideX: 0.335,
  z: 0.055,          // hands sit slightly in front of the shoulders
  bulge: 0.105,      // how far an arc bows out of the hands' plane at apex
  scoop: 0.055,      // how far below the working line the carry dips
};

export const DEFAULTS = { beatT: 0.335, dwell: 0.78 };

/**
 * A tempo that suits a pattern.  A CHOICE, not a law — but a real juggler does
 * speed up as the numbers go up, because a throw that hangs longer has to go
 * higher, and there is only so much room above a person.  So the rule here is
 * the one a juggler actually uses: pick the beat so the TALLEST throw in the
 * pattern peaks at a comfortable height, which keeps the whole thing in front
 * of your eyes.  Everything below the tallest throw then falls where the
 * square law puts it, which is the part that is not a choice.
 */
export function suggestApex(maxThrow) { return 0.24 + 0.145 * Math.max(1, maxThrow); }
export function suggestBeatT(seq, dwell = DEFAULTS.dwell, g = G) {
  const m = Math.max(1, ...(Array.isArray(seq) ? seq : [seq]));
  const T = Math.sqrt(8 * suggestApex(m) / g) / Math.max(0.4, m - dwell);
  return Math.min(0.55, Math.max(0.10, T));
}

// ── notation ────────────────────────────────────────────────────────────────
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

export function digitToValue(ch) {
  const i = DIGITS.indexOf(String(ch).toLowerCase());
  return i < 0 ? null : i;
}
export function valueToDigit(v) {
  return (v >= 0 && v < DIGITS.length) ? DIGITS[v] : '?';
}

/** Parse "531" or "5 3 1" or "9,7,5,3,1" into a sequence of numbers. */
export function parsePattern(text) {
  const raw = String(text == null ? '' : text).trim();
  if (!raw) return { ok: false, seq: [], error: 'nothing typed' };
  const cleaned = raw.replace(/[\s,]+/g, '');
  if (!cleaned) return { ok: false, seq: [], error: 'nothing typed' };
  const seq = [];
  for (const ch of cleaned) {
    const v = digitToValue(ch);
    if (v === null) return { ok: false, seq: [], error: 'not a throw: "' + ch + '"' };
    seq.push(v);
  }
  if (seq.length > 24) return { ok: false, seq: [], error: 'longer than 24 beats' };
  return { ok: true, seq, error: null };
}

export function formatPattern(seq) { return seq.map(valueToDigit).join(''); }

// ── the two independent tests of validity ───────────────────────────────────

/**
 * THE ALGEBRAIC TEST.  A period-n sequence is juggleable iff the landing
 * residues i + s[i] (mod n) are a permutation of Z_n.  Cheap; the page uses it
 * on every keystroke.
 */
export function permutationTest(seq) {
  const n = seq.length;
  if (n === 0) return { valid: false, reason: 'empty pattern', residues: [], clash: null };
  const residues = seq.map((v, i) => (i + v) % n);
  const seen = new Map();
  for (let i = 0; i < n; i++) {
    const r = residues[i];
    if (seen.has(r)) {
      return {
        valid: false, residues, clash: [seen.get(r), i],
        reason: 'beats ' + seen.get(r) + ' and ' + i + ' both land on beat '
              + r + ' of the cycle — two balls, one hand',
      };
    }
    seen.set(r, i);
  }
  return { valid: true, reason: null, residues, clash: null };
}

/**
 * THE SIMULATION TEST.  Deliberately knows nothing about residues: it throws
 * the pattern for a long stretch of beats, counts what lands where, and fails
 * if any beat receives two balls or if a beat with a throw in it receives
 * none.  This is the honest, mechanical statement of "can a person do this",
 * and the twin proves it agrees with permutationTest on every sequence of
 * period <= 5 with throws 0..9.
 */
export function simulationTest(seq, span = 60) {
  const n = seq.length;
  if (n === 0) return { valid: false, reason: 'empty pattern', balls: 0 };
  const at = (t) => seq[((t % n) + n) % n];
  const lo = -span, hi = span;
  const arrivals = new Map();                  // beat -> how many balls land there
  for (let t = lo; t <= hi; t++) {
    const v = at(t);
    if (v > 0) arrivals.set(t + v, (arrivals.get(t + v) || 0) + 1);
  }
  // Only judge the interior, where every ball that could land has been thrown.
  const maxThrow = Math.max(...seq);
  const a = lo + maxThrow + 1, b = hi - 1;
  for (let t = a; t <= b; t++) {
    const got = arrivals.get(t) || 0;
    const v = at(t);
    if (got > 1) return { valid: false, reason: got + ' balls come down together on beat ' + (((t % n) + n) % n) + ' of the cycle', balls: 0 };
    if (v > 0 && got === 0) return { valid: false, reason: 'beat ' + (((t % n) + n) % n) + ' throws a ' + valueToDigit(v) + ' with an empty hand', balls: 0 };
    if (v === 0 && got === 1) return { valid: false, reason: 'a ball lands on beat ' + (((t % n) + n) % n) + ' of the cycle, which throws nothing', balls: 0 };
  }
  // Count the balls: how many are aloft-or-held across one beat boundary.
  const mid = 0;
  let live = 0;
  for (let t = mid - maxThrow; t < mid; t++) {
    const v = at(t);
    if (v > 0 && t + v >= mid) live++;
  }
  return { valid: true, reason: null, balls: live };
}

/** b = mean(s).  Returned exactly as a fraction so the page can show the sum. */
export function ballCount(seq) {
  const sum = seq.reduce((a, v) => a + v, 0);
  return { sum, period: seq.length, exact: seq.length > 0 && sum % seq.length === 0,
           balls: seq.length > 0 ? sum / seq.length : 0 };
}

/** Full verdict for the page: both tests, the count, and the crossings. */
export function analyse(seq) {
  const perm = permutationTest(seq);
  const sim = simulationTest(seq);
  const bc = ballCount(seq);
  const agree = perm.valid === sim.valid;
  return {
    valid: perm.valid && sim.valid,
    agree,
    reason: perm.reason || sim.reason,
    residues: perm.residues,
    clash: perm.clash,
    ...bc,
    simBalls: sim.balls,
    crosses: seq.map((v) => v > 0 && v % 2 === 1),
  };
}

/** A ball thrown with value v is caught by the other hand exactly when v is odd. */
export function crosses(v) { return v % 2 === 1; }

/** Seconds a throw of value v spends out of any hand. */
export function airTime(v, beatT = DEFAULTS.beatT, dwell = DEFAULTS.dwell) {
  return Math.max(0, v - dwell) * beatT;
}

/** Apex height above the hands, in metres, for a level throw. */
export function apexHeight(v, beatT = DEFAULTS.beatT, dwell = DEFAULTS.dwell, g = G) {
  const a = airTime(v, beatT, dwell);
  return g * a * a / 8;
}

// ── the counting law ────────────────────────────────────────────────────────

/**
 * Brute force: enumerate EVERY length-n sequence whose entries could possibly
 * average to b or less (each entry is at most b*n) and count the ones the
 * SIMULATION accepts.  Slow and stupid on purpose — it is the independent
 * witness.
 */
export function countByBrute(n, maxBalls) {
  const top = maxBalls * n;                  // a valid sequence with mean <= b
  const s = new Array(n).fill(0);            // cannot contain an entry above b*n
  let count = 0;
  const rec = (i, sum) => {
    if (sum > maxBalls * n) return;
    if (i === n) {
      if (sum % n !== 0) return;             // mean must be a whole number
      if (simulationTest(s, 3 * n + top + 4).valid) count++;
      return;
    }
    for (let v = 0; v <= top; v++) { s[i] = v; rec(i + 1, sum + v); }
    s[i] = 0;
  };
  rec(0, 0);
  return count;
}

/**
 * The same number from the other side.  Every valid pattern is a permutation
 * pi of Z_n plus a vector of non-negative multiples of n: s[i] = r_i + n*k_i
 * with r_i = (pi(i) - i) mod n.  Its ball count is R + sum(k), R = sum(r)/n.
 * So the count with at most b balls is sum over pi of C(b - R + n, n).
 */
export function countByOrbits(n, maxBalls) {
  const idx = Array.from({ length: n }, (_, i) => i);
  let total = 0;
  const perm = new Array(n);
  const used = new Array(n).fill(false);
  const choose = (a, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (a - i) / (i + 1); return Math.round(r); };
  const rec = (i, rsum) => {
    if (i === n) {
      if (rsum % n !== 0) return;            // cannot happen; sum(r) is always 0 mod n
      const R = rsum / n;
      const slack = maxBalls - R;
      if (slack < 0) return;
      total += choose(slack + n, n);         // compositions of <= slack into n parts
      return;
    }
    for (const j of idx) {
      if (used[j]) continue;
      used[j] = true; perm[i] = j;
      rec(i + 1, rsum + (((j - i) % n) + n) % n);
      used[j] = false;
    }
  };
  rec(0, 0);
  return total;
}

// ── the pattern, running ────────────────────────────────────────────────────

/**
 * The state of the hands at beat 0: which of the coming beats already have a
 * ball falling into them, given that the pattern has been running forever.
 */
export function arrivalState(seq, horizon) {
  const n = seq.length;
  const maxThrow = Math.max(1, ...seq);
  const H = horizon || (maxThrow + 1);
  const state = new Array(H).fill(false);
  for (let t = -H - maxThrow; t <= -1; t++) {
    const v = seq[((t % n) + n) % n];
    if (v <= 0) continue;
    const j = t + v;
    if (j >= 0 && j < H) state[j] = true;
  }
  return state;
}

/**
 * A running pattern: hands, balls, throws, catches, positions, all in metres
 * and seconds.  Deterministic and unbounded — it does not loop, it just keeps
 * juggling, so a ball keeps its identity (and its colour) forever.
 */
export class Juggle {
  constructor(seq, opts = {}) {
    const a = analyse(seq);
    if (!a.valid) throw new Error('Juggle: ' + (a.reason || 'invalid pattern'));
    this.seq = seq.slice();
    this.n = seq.length;
    this.beatT = opts.beatT != null ? opts.beatT : DEFAULTS.beatT;
    this.dwell = opts.dwell != null ? opts.dwell : DEFAULTS.dwell;
    this.g = opts.g != null ? opts.g : G;
    this.geom = Object.assign({}, HANDS, opts.geom || {});
    this.maxThrow = Math.max(1, ...seq);
    this.balls = [];                 // {id, segs:[...]}
    this.events = [];                // {t, type:'throw'|'catch', hand, v, ballId}
    this.builtTo = -1;               // last beat built
    this.eventHead = 0;              // events before this index are spent

    // seed the balls that are already in the air at beat 0
    const state = arrivalState(seq);
    this.inFlight = new Map();       // landing beat -> ball id
    let id = 0;
    for (let j = 0; j < state.length; j++) {
      if (!state[j]) continue;
      const ball = { id: id++, segs: [] };
      this.balls.push(ball);
      // find the throw that produced it, so the opening arc is the real one
      let v = null, tThrow = null;
      for (let back = 1; back <= this.maxThrow; back++) {
        const t0 = j - back;
        const vv = seq[((t0 % this.n) + this.n) % this.n];
        if (vv === back) { v = vv; tThrow = t0; break; }
      }
      if (v === null) { v = j + 1; tThrow = -1; }
      this._flight(ball, tThrow, v);
      this.inFlight.set(j, ball.id);
    }
    this.nBalls = this.balls.length;
    this.build(24);
  }

  _at(t) { return this.seq[((t % this.n) + this.n) % this.n]; }
  handOf(t) { return ((t % 2) + 2) % 2; }

  /** Where hand h throws a ball of value v, and where it catches one. */
  throwPoint(h, v) {
    const s = h === 0 ? 1 : -1;
    const g = this.geom;
    const x = crosses(v) ? g.insideX : g.outsideX;
    return [s * x, g.y, g.z];
  }
  catchPoint(h, v) {
    const s = h === 0 ? 1 : -1;
    const g = this.geom;
    const x = crosses(v) ? g.outsideX : g.insideX;
    return [s * x, g.y, g.z];
  }
  restPoint(h) {
    const s = h === 0 ? 1 : -1;
    const g = this.geom;
    return [s * (g.insideX + g.outsideX) * 0.5, g.y - g.scoop * 0.5, g.z];
  }

  _flight(ball, tThrow, v) {
    const h = this.handOf(tThrow);
    const hCatch = this.handOf(tThrow + v);
    const p0 = this.throwPoint(h, v);
    const p1 = this.catchPoint(hCatch, v);
    const t0 = tThrow * this.beatT;
    const t1 = (tThrow + v - this.dwell) * this.beatT;
    // Crossing arcs must not share a plane: a right-hand throw bows towards
    // the audience, a left-hand throw away from it.  (A choice, and the reason
    // a real cascade never knocks itself down.)
    const bow = (h === 0 ? 1 : -1) * this.geom.bulge * (v >= 2 ? 1 : 0.25);
    ball.segs.push({ kind: 'fly', t0, t1, p0, p1, bow, v, hand: h, toHand: hCatch, beat: tThrow });
    this.events.push({ t: t0, type: 'throw', hand: h, v, ballId: ball.id, beat: tThrow });
    this.events.push({ t: t1, type: 'catch', hand: hCatch, v, ballId: ball.id, beat: tThrow + v });
  }

  _hold(ball, tCatch, v, tNext, vNext) {
    const hCatch = this.handOf(tCatch);
    const p0 = this.catchPoint(hCatch, v);
    const p1 = this.throwPoint(hCatch, vNext);
    ball.segs.push({
      kind: 'hold', t0: (tCatch - this.dwell) * this.beatT, t1: tNext * this.beatT,
      p0, p1, hand: hCatch, dip: this.geom.scoop,
    });
  }

  /** Extend the schedule out to beat toBeat. */
  build(toBeat) {
    for (let t = this.builtTo + 1; t <= toBeat; t++) {
      const v = this._at(t);
      const id = this.inFlight.get(t);
      if (v === 0) { this.builtTo = t; continue; }
      if (id === undefined) { this.builtTo = t; continue; }   // cannot happen for a valid pattern
      const ball = this.balls.find((b) => b.id === id);
      this.inFlight.delete(t);
      this._hold(ball, t, ball.segs[ball.segs.length - 1].v, t, v);
      this._flight(ball, t, v);
      this.inFlight.set(t + v, id);
      this.builtTo = t;
    }
  }

  /** Drop what is finished with, so a pattern can run all afternoon. */
  prune(before) {
    for (const b of this.balls) {
      let k = 0;
      while (k < b.segs.length - 2 && b.segs[k].t1 < before) k++;
      if (k > 0) b.segs.splice(0, k);
    }
    while (this.eventHead < this.events.length && this.events[this.eventHead].t < before) this.eventHead++;
    if (this.eventHead > 4096) { this.events.splice(0, this.eventHead); this.eventHead = 0; }
  }

  /** Everything the renderer needs at time t seconds. */
  sample(t) {
    const beat = t / this.beatT;
    if (beat + 16 > this.builtTo) { this.build(Math.ceil(beat) + 24); this.prune(t - 6); }
    const out = { t, beat, balls: [], hands: [], nBalls: this.nBalls };
    for (const b of this.balls) {
      const p = this._ballAt(b, t);
      out.balls.push({ id: b.id, pos: p.pos, flying: p.flying, v: p.v, u: p.u, apex: p.apex });
    }
    for (let h = 0; h < 2; h++) out.hands.push(this._handAt(h, t));
    return out;
  }

  _ballAt(ball, t) {
    let seg = null;
    for (let i = ball.segs.length - 1; i >= 0; i--) {
      const s = ball.segs[i];
      if (t >= s.t0 && t <= s.t1) { seg = s; break; }
      if (t > s.t1 && i === ball.segs.length - 1) { seg = s; break; }
    }
    if (!seg) seg = ball.segs[0];
    const span = Math.max(1e-9, seg.t1 - seg.t0);
    const u = Math.min(1, Math.max(0, (t - seg.t0) / span));
    if (seg.kind === 'fly') {
      const dt = seg.t1 - seg.t0;
      const rise = 0.5 * this.g * dt * dt * u * (1 - u);
      return {
        pos: [
          seg.p0[0] + (seg.p1[0] - seg.p0[0]) * u,
          seg.p0[1] + (seg.p1[1] - seg.p0[1]) * u + rise,
          seg.p0[2] + (seg.p1[2] - seg.p0[2]) * u + seg.bow * Math.sin(Math.PI * u),
        ],
        flying: true, v: seg.v, u, apex: this.g * dt * dt / 8,
      };
    }
    const e = u * u * (3 - 2 * u);
    return {
      pos: [
        seg.p0[0] + (seg.p1[0] - seg.p0[0]) * e,
        seg.p0[1] + (seg.p1[1] - seg.p0[1]) * e - seg.dip * Math.sin(Math.PI * u),
        seg.p0[2] + (seg.p1[2] - seg.p0[2]) * e,
      ],
      flying: false, v: 0, u, apex: 0,
    };
  }

  /**
   * A hand's own cycle is two beats long: throw, travel out empty, catch,
   * carry in, throw.  It follows whichever ball it is about to handle, so the
   * scoop reverses direction the moment the pattern turns from odd to even.
   */
  _handAt(h, t) {
    const beat = t / this.beatT;
    // this hand's most recent throw beat, which is at most one beat behind
    let prevThrow = Math.floor(beat);
    if (this.handOf(prevThrow) !== h) prevThrow -= 1;
    const nextThrow = prevThrow + 2;
    const vPrev = this._at(prevThrow);
    const vNext = this._at(nextThrow);
    const A = vPrev > 0 ? this.throwPoint(h, vPrev) : this.restPoint(h);
    const C = vNext > 0 ? this.throwPoint(h, vNext) : this.restPoint(h);
    // what lands in this hand at nextThrow, and hence where it must be caught
    let vIn = null;
    for (let back = 1; back <= this.maxThrow; back++) {
      const t0 = nextThrow - back;
      if (this._at(t0) === back) { vIn = back; break; }
    }
    const B = vIn !== null ? this.catchPoint(h, vIn) : this.restPoint(h);
    const tA = prevThrow * this.beatT;
    const tB = (nextThrow - this.dwell) * this.beatT;
    const tC = nextThrow * this.beatT;
    if (t <= tB) {
      const u = Math.min(1, Math.max(0, (t - tA) / Math.max(1e-9, tB - tA)));
      const e = u * u * (3 - 2 * u);
      return {
        pos: [A[0] + (B[0] - A[0]) * e, A[1] + (B[1] - A[1]) * e - this.geom.scoop * 0.55 * Math.sin(Math.PI * u), A[2] + (B[2] - A[2]) * e],
        holding: false, hand: h,
      };
    }
    const u = Math.min(1, Math.max(0, (t - tB) / Math.max(1e-9, tC - tB)));
    const e = u * u * (3 - 2 * u);
    return {
      pos: [B[0] + (C[0] - B[0]) * e, B[1] + (C[1] - B[1]) * e - this.geom.scoop * Math.sin(Math.PI * u), B[2] + (C[2] - B[2]) * e],
      holding: vIn !== null, hand: h,
    };
  }

  /** Throw/catch events that fall in (t0, t1] — the room's ear. */
  eventsIn(t0, t1) {
    this.build(Math.ceil(t1 / this.beatT) + 8);
    const out = [];
    for (let i = this.eventHead; i < this.events.length; i++) {
      const e = this.events[i];
      if (e.t > t0 && e.t <= t1) out.push(e);
    }
    return out.sort((a, b) => a.t - b.t);
  }

  /** The tallest apex any throw in this pattern reaches, in metres. */
  maxApex() {
    return Math.max(0, ...this.seq.map((v) => (v > 0 ? apexHeight(v, this.beatT, this.dwell, this.g) : 0)));
  }
}

// ── the arm ─────────────────────────────────────────────────────────────────

/**
 * Two-bone IK.  Given a shoulder and a hand, put the elbow where a person's
 * would be: in the plane containing the arm and a preferred outward axis, bent
 * so the elbow hangs below and behind.  Returns null if the point is out of
 * reach, which the twin checks never happens.
 */
export function solveElbow(shoulder, hand, upper, fore, side) {
  const d = [hand[0] - shoulder[0], hand[1] - shoulder[1], hand[2] - shoulder[2]];
  const L = Math.hypot(d[0], d[1], d[2]);
  if (L > upper + fore || L < 1e-6) return null;
  const cos = (L * L + upper * upper - fore * fore) / (2 * L * upper);
  const a = Math.acos(Math.min(1, Math.max(-1, cos)));
  const ax = [d[0] / L, d[1] / L, d[2] / L];
  // preferred bend direction: outward in x and backward in z
  let pref = [side * 0.55, -0.35, -0.75];
  const dot = pref[0] * ax[0] + pref[1] * ax[1] + pref[2] * ax[2];
  pref = [pref[0] - dot * ax[0], pref[1] - dot * ax[1], pref[2] - dot * ax[2]];
  let pl = Math.hypot(pref[0], pref[1], pref[2]);
  if (pl < 1e-6) { pref = [0, -1, 0]; pl = 1; }
  pref = [pref[0] / pl, pref[1] / pl, pref[2] / pl];
  const c = Math.cos(a) * upper, s = Math.sin(a) * upper;
  return [
    shoulder[0] + ax[0] * c + pref[0] * s,
    shoulder[1] + ax[1] * c + pref[1] * s,
    shoulder[2] + ax[2] * c + pref[2] * s,
  ];
}

/** The whole figure at time t: joints in metres, ready to be drawn. */
export function poseAt(juggle, t) {
  const s = juggle.sample(t);
  const B = BODY;
  // the body leans a hair towards whichever hand is working, and breathes
  const beat = t / juggle.beatT;
  const sway = 0.016 * Math.sin(Math.PI * beat);
  const bob = 0.011 * Math.sin(2 * Math.PI * beat + 0.6) - 0.004;
  const joints = {
    head: [sway * 1.4, B.headY + bob, 0.012],
    neck: [sway * 1.2, B.shoulderY + 0.085 + bob, 0.006],
    shoulderR: [B.shoulderX + sway, B.shoulderY + bob, B.shoulderZ],
    shoulderL: [-B.shoulderX + sway, B.shoulderY + bob, B.shoulderZ],
    hipR: [B.hipX + sway * 0.3, B.hipY + bob * 0.4, 0],
    hipL: [-B.hipX + sway * 0.3, B.hipY + bob * 0.4, 0],
    kneeR: [B.hipX + 0.028, B.hipY - B.thigh + 0.004, 0.028],
    kneeL: [-B.hipX - 0.028, B.hipY - B.thigh + 0.004, 0.028],
    footR: [B.hipX + 0.052, 0.036, -0.012],
    footL: [-B.hipX - 0.052, 0.036, -0.012],
    handR: s.hands[0].pos,
    handL: s.hands[1].pos,
  };
  joints.elbowR = solveElbow(joints.shoulderR, joints.handR, B.upperArm, B.foreArm, +1)
                  || [joints.shoulderR[0] + 0.1, joints.shoulderR[1] - 0.3, -0.05];
  joints.elbowL = solveElbow(joints.shoulderL, joints.handL, B.upperArm, B.foreArm, -1)
                  || [joints.shoulderL[0] - 0.1, joints.shoulderL[1] - 0.3, -0.05];
  return { joints, sample: s };
}

// ── named patterns the pitch keeps on its board ─────────────────────────────
export const REPERTOIRE = [
  { p: '3',     name: 'the cascade',        note: 'three balls, every throw crossing — the figure of eight everyone starts with' },
  { p: '4',     name: 'the fountain',       note: 'four balls, no throw crosses: two hands juggling two each, side by side' },
  { p: '5',     name: 'five',               note: 'the same cascade, twice as high and twice as fast to think about' },
  { p: '531',   name: 'five three one',     note: 'three balls: a high crossing throw, an ordinary one, and a flat hand-across' },
  { p: '441',   name: 'four four one',      note: 'three balls, and the 1 is the zip that resets the hands' },
  { p: '423',   name: 'the two-ball trick', note: 'three balls, but one of them just sits in the hand — the 2 never crosses' },
  { p: '51',    name: 'the shower',         note: 'three balls round a circle: one hand does all the throwing' },
  { p: '552',   name: 'five five two',      note: 'four balls, one of them parked' },
  { p: '7',     name: 'seven',              note: 'over two metres above the hands at this tempo' },
  { p: '645',   name: 'six four five',      note: 'five balls; the digits are not all the same but the average is' },
  { p: '97531', name: 'the ladder',         note: 'five balls, every throw a different height — the pattern draws a staircase' },
  { p: '744',   name: 'seven four four',    note: 'five balls; one tower over a fountain' },
  { p: '55550', name: 'the gap',            note: 'four balls: the 0 is a beat with nothing in the hand at all' },
  { p: '801',   name: 'eight oh one',       note: 'three balls, and a hand that waits two beats empty' },
  { p: '9',     name: 'nine',               note: 'nine balls. Nobody here can do it; the arithmetic does not mind' },
];
