/* ══════════════════════════════════════════════════════════════════════════════
   THREE FEET DOWN — core.mjs

   The whole beast, with no DOM in it: body plan, gait clock, foot placement,
   two-link leg IK, the plane its planted feet define, its centre of mass, and
   the polygon it is standing on.

   Everything the page draws comes out of here, and so does everything the Node
   twin (core.test.mjs) asserts — there is exactly one walking creature in this
   room and both of them are looking at it.

   THE ONE CLAIM
     A creature is STATICALLY STABLE at an instant if the vertical line through
     its centre of mass passes inside the convex hull of the feet it currently
     has on the ground.  Stand it still and take a leg away and it either stays
     up or it does not; there is no dynamics in the question at all.
     Two consequences the room measures live, on the same beast you are watching:
       (a) you need at least three feet down, so the duty factor must satisfy
           beta >= 3/N — a two-legged thing is NEVER statically stable, and a
           trotting quadruped (beta = 1/2, two feet) is falling continuously;
       (b) three feet is NECESSARY and NOT SUFFICIENT.  The hexapod "wave" gait
           at beta = 1/2 has exactly three feet down at every instant and they
           are all on ONE FLANK, so the triangle misses the animal.  The
           alternating tripod puts the same three feet on alternating corners
           and is stable at the same duty factor.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── small vector helpers (arrays of 3, kept boring on purpose) ───────────── */
export const v3 = (x = 0, y = 0, z = 0) => [x, y, z];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export function norm(a) { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
export const frac = (x) => x - Math.floor(x);

/* ══════════════════════════════════════════════════════════════════════════════
   1 · GAITS

   A gait is nothing but a duty factor and one phase offset per leg.  Legs are
   numbered front-to-back, LEFT leg of pair k is index 2k, RIGHT is 2k+1.
   `duty` is the suggested duty for that gait; the room lets you move it.
   ══════════════════════════════════════════════════════════════════════════════ */

/* Offsets are functions of the pair count P.  A gait declares which leg counts it
   is a real gait FOR: the same arithmetic that makes an alternating tripod on six
   legs makes a trot on four, and calling that a tripod would be a lie. */

/* alternate by (pair + side) parity — tripod on 6, diagonal pairs on 4 */
const ALTERNATE = (P) => { const o = []; for (let k = 0; k < P; k++) { o.push((k % 2) * 0.5); o.push(((k + 1) % 2) * 0.5); } return o; };
/* a wave of lifts running rear→front up one side, the other side half a cycle later */
const WAVE = (P) => {
  const o = [];
  for (let k = 0; k < P; k++) { const back = (P - 1 - k) / (2 * P); o.push(0.5 + back); o.push(back); }
  return o;
};
/* every left leg together, then every right leg */
const LATERAL = (P) => { const o = []; for (let k = 0; k < P; k++) { o.push(0.0); o.push(0.5); } return o; };
/* front half of the body, then the back half */
const BOUND = (P) => { const o = []; for (let k = 0; k < P; k++) { const h = k < P / 2 ? 0 : 0.5; o.push(h); o.push(h); } return o; };

export const GAITS = [
  { id: 'tripod', name: 'alternating tripod', duty: 0.5, legs: [6, 8], offsets: ALTERNATE,
    blurb: 'Three legs down, one from each corner. An insect can stop dead mid-stride and simply stand there.' },
  { id: 'wave', name: 'metachronal wave', duty: 0.78, legs: [6, 8], offsets: WAVE,
    blurb: 'A wave of lifts runs rear-to-front up one side, then the other. Drop the duty to a half and the three feet still down are all on ONE flank.' },
  { id: 'flank', name: 'one side at a time', duty: 0.5, legs: [6, 8], offsets: LATERAL,
    blurb: 'The whole left side swings, then the whole right. Three feet down, and the triangle misses the animal entirely.' },
  { id: 'walk', name: 'walk · lateral sequence', duty: 0.78, legs: [4], offsets: WAVE,
    blurb: 'Right hind, right fore, left hind, left fore. Above a duty of 3/4 there are always three feet down.' },
  { id: 'trot', name: 'trot · diagonal pairs', duty: 0.5, legs: [4], offsets: ALTERNATE,
    blurb: 'Diagonal pairs together. Two feet down: a trotting animal is falling, and catching itself, and falling.' },
  { id: 'pace', name: 'pace · lateral pairs', duty: 0.5, legs: [4], offsets: LATERAL,
    blurb: 'Both left legs, then both right. The rolliest gait a horse has, and for a plain reason.' },
  { id: 'bound', name: 'bound', duty: 0.4, legs: [4], offsets: BOUND,
    blurb: 'Front pair, then hind pair. Nothing about this is statically stable and nothing about it wants to be.' },
  { id: 'stride', name: 'stride', duty: 0.62, legs: [2], offsets: LATERAL,
    blurb: 'Left, right, left. Two feet make a line, and a line has no inside — a biped is never statically stable.' },
];

export function gaitById(id) { return GAITS.find((g) => g.id === id) || GAITS[0]; }
export function gaitsFor(nLegs) { return GAITS.filter((g) => g.legs.includes(nLegs)); }

/* ══════════════════════════════════════════════════════════════════════════════
   2 · CONVEX HULL AND THE MARGIN

   Monotone chain, counter-clockwise, on the ground plane (x, z).
   ══════════════════════════════════════════════════════════════════════════════ */

export function hull2(pts) {
  const p = pts.slice().sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) { while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}

/* Distance from q to the segment ab. */
export function distToSeg(q, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const L2 = vx * vx + vy * vy;
  let t = L2 > 0 ? ((q[0] - a[0]) * vx + (q[1] - a[1]) * vy) / L2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(q[0] - (a[0] + t * vx), q[1] - (a[1] + t * vy));
}

/* Signed distance from q to the hull boundary: POSITIVE inside, NEGATIVE outside.
   With fewer than three hull points the region has no interior, so the margin is
   the negative distance to the segment (or point) — never positive.  That is the
   honest answer for a two-legged animal and it is why one can't stand still. */
export function hullMargin(hull, q) {
  if (hull.length === 0) return -Infinity;
  if (hull.length === 1) return -Math.hypot(q[0] - hull[0][0], q[1] - hull[0][1]);
  if (hull.length === 2) return -distToSeg(q, hull[0], hull[1]);
  let inside = true, best = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const crs = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
    if (crs < 0) inside = false;
    best = Math.min(best, distToSeg(q, a, b));
  }
  return inside ? best : -best;
}

/* ══════════════════════════════════════════════════════════════════════════════
   3 · THE GROUND THE FEET DEFINE

   Least-squares plane y = a·x + b·z + c through the planted feet.  The body
   rides it, which is the whole reason the beast leans going up a hill instead
   of driving through it like a sled.
   ══════════════════════════════════════════════════════════════════════════════ */
export function planeFit(pts) {
  const n = pts.length;
  if (n === 0) return null;
  if (n < 3) {
    let y = 0; for (const p of pts) y += p[1];
    return { a: 0, b: 0, c: y / n };
  }
  let Sxx = 0, Sxz = 0, Szz = 0, Sx = 0, Sz = 0, Sy = 0, Sxy = 0, Szy = 0;
  for (const p of pts) {
    Sxx += p[0] * p[0]; Sxz += p[0] * p[2]; Szz += p[2] * p[2];
    Sx += p[0]; Sz += p[2]; Sy += p[1];
    Sxy += p[0] * p[1]; Szy += p[2] * p[1];
  }
  const M = [[Sxx, Sxz, Sx], [Sxz, Szz, Sz], [Sx, Sz, n]];
  const R = [Sxy, Szy, Sy];
  const s = solve3(M, R);
  if (!s) { return { a: 0, b: 0, c: Sy / n }; }
  return { a: s[0], b: s[1], c: s[2] };
}

export function solve3(M, R) {
  const A = [M[0].slice(), M[1].slice(), M[2].slice()];
  const y = R.slice();
  for (let i = 0; i < 3; i++) {
    let piv = i;
    for (let r = i + 1; r < 3; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
    if (Math.abs(A[piv][i]) < 1e-12) return null;
    if (piv !== i) { const t = A[i]; A[i] = A[piv]; A[piv] = t; const u = y[i]; y[i] = y[piv]; y[piv] = u; }
    for (let r = i + 1; r < 3; r++) {
      const f = A[r][i] / A[i][i];
      for (let c = i; c < 3; c++) A[r][c] -= f * A[i][c];
      y[r] -= f * y[i];
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    let s = y[i];
    for (let c = i + 1; c < 3; c++) s -= A[i][c] * x[c];
    x[i] = s / A[i][i];
  }
  return x;
}

/* ══════════════════════════════════════════════════════════════════════════════
   4 · TWO-LINK LEG IK

   Given a hip, a foot, two bone lengths and the direction the knee should point,
   there is exactly one elbow position (up to the reflection we pin with `bendRef`).
   Reach is clamped, so a foot placed beyond the leg's span straightens the leg
   rather than tearing it — you can watch it happen at high speed.
   ══════════════════════════════════════════════════════════════════════════════ */
export function kneePos(hip, foot, l1, l2, bendRef) {
  let v = sub(foot, hip);
  let d = len(v);
  const dMax = (l1 + l2) * 0.999, dMin = Math.abs(l1 - l2) + 1e-4;
  if (d > dMax) { v = mul(v, dMax / d); d = dMax; }
  if (d < dMin) { const u = d > 1e-9 ? mul(v, 1 / d) : [0, -1, 0]; v = mul(u, dMin); d = dMin; }
  const a = (d * d + l1 * l1 - l2 * l2) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const u = mul(v, 1 / d);
  /* component of bendRef perpendicular to the hip→foot line */
  let p = sub(bendRef, mul(u, dot(bendRef, u)));
  if (len(p) < 1e-6) p = sub([0, 1, 0], mul(u, dot([0, 1, 0], u)));
  p = norm(p);
  return { knee: add(hip, add(mul(u, a), mul(p, h))), reach: d, clamped: len(sub(foot, hip)) > dMax + 1e-9 };
}

/* ══════════════════════════════════════════════════════════════════════════════
   5 · THE BODY PLAN
   ══════════════════════════════════════════════════════════════════════════════ */
export function bodyPlan(nLegs, scale = 1) {
  const P = nLegs / 2;
  const halfLen = (0.28 + 0.15 * P) * scale;
  const halfWid = 0.20 * scale;
  const femur = 0.46 * scale, tibia = 0.54 * scale;
  const sprawl = 0.44 * scale;
  const stand = 0.62 * scale;
  const hips = [];
  for (let k = 0; k < P; k++) {
    /* front (k=0) to back, spread over the trunk */
    const t = P === 1 ? 0.0 : (k / (P - 1)) * 2 - 1;      /* +1 front … −1 back */
    const z = -t * halfLen * 0.82;                         /* +z is FORWARD, so front = +z */
    for (const side of [-1, 1]) {
      hips.push({
        pair: k, side,                                     /* −1 left, +1 right */
        local: [side * halfWid, 0.02 * scale, -z],
        rest:  [side * (halfWid + sprawl), -stand, -z * 1.06],
      });
    }
  }
  return { nLegs, pairs: P, halfLen, halfWid, femur, tibia, sprawl, stand, hips, scale };
}

/* ══════════════════════════════════════════════════════════════════════════════
   6 · THE BEAST
   ══════════════════════════════════════════════════════════════════════════════ */
export class Beast {
  constructor(opts = {}) {
    this.ground = opts.ground || (() => 0);       /* (x,z) → height */
    this.scale = opts.scale || 1;
    this.speed = opts.speed ?? 0.85;              /* m/s desired */
    this.period = opts.period ?? 1.1;             /* s per gait cycle */
    this.duty = opts.duty ?? 0.5;
    this.gaitId = opts.gait || 'tripod';
    this.stepArc = opts.stepArc ?? 0.16;
    this.balanceGain = opts.balanceGain ?? 0.32;  /* the Raibert catch-yourself term */
    /* LEAN: how far the trunk shifts toward the centroid of the planted feet.
       A quadruped walking at beta = 3/4 rides exactly on the diagonal of its own
       support rectangle, so its static margin is zero; the only way off the
       diagonal is to move the body over the standing side, which is what a slow-
       walking horse visibly does.  0 = no lean, 1 = all the way to the centroid. */
    this.lean = opts.lean ?? 0;
    this.leanMax = opts.leanMax ?? 0.16;
    this.leanOff = [0, 0];
    this.events = [];                             /* footfalls, drained by the caller */
    this.setLegs(opts.legs || 6, true);
  }

  setLegs(n, hard = false) {
    if (!hard && n === this.plan?.nLegs) return;
    this.plan = bodyPlan(n, this.scale);
    const ok = gaitsFor(n);
    const keep = ok.some((g) => g.id === this.gaitId);
    this.setGait(keep ? this.gaitId : ok[0].id, keep);
    if (hard) {
      this.pos = [0, 0, 0];
      this.yaw = 0;
      this.vel = [0, 0, 0];
      this.up = [0, 1, 0];
      this.clock = 0;
      this.target = null;
      this.wanderT = 0; this.wanderYaw = 0;
    }
    this.pos[1] = this.ground(this.pos[0], this.pos[2]) + this.plan.stand;
    this.feet = this.plan.hips.map((h) => {
      const w = this.toWorld(h.rest);
      return { pos: [w[0], this.ground(w[0], w[2]), w[2]], lift: [w[0], this.ground(w[0], w[2]), w[2]], down: true, swing: 0 };
    });
  }

  setGait(id, keep = false) {
    const g = gaitById(id);
    this.gaitId = g.id;
    this.offsets = g.offsets(this.plan.pairs);
    if (!keep) this.duty = g.duty;
  }

  /* ── body frame ─────────────────────────────────────────────────────────── */
  frame() {
    const fwd0 = [Math.sin(this.yaw), 0, Math.cos(this.yaw)];
    const up = this.up;
    let right = norm(cross(up, fwd0));
    const fwd = norm(cross(right, up));
    return { o: this.pos, right, up, fwd };
  }

  /* `raw` ignores the lean: the feet are aimed from where the hips would be if
     the animal were not shifting its weight, so leaning does not chase itself. */
  toWorld(local, raw = false) {
    const f = this.frame();
    const ox = this.pos[0] + (raw ? 0 : this.leanOff[0]);
    const oz = this.pos[2] + (raw ? 0 : this.leanOff[1]);
    return [
      ox + f.right[0] * local[0] + f.up[0] * local[1] + f.fwd[0] * local[2],
      this.pos[1] + f.right[1] * local[0] + f.up[1] * local[1] + f.fwd[1] * local[2],
      oz + f.right[2] * local[0] + f.up[2] * local[1] + f.fwd[2] * local[2],
    ];
  }

  /* ── one step of the world ──────────────────────────────────────────────── */
  step(dt) {
    const pl = this.plan;
    const D = clamp(this.duty, 0.05, 0.98);

    /* 1 · where does it want to go */
    let desired = [0, 0, 0];
    if (this.target) {
      const d = [this.target[0] - this.pos[0], 0, this.target[2] - this.pos[2]];
      const dl = Math.hypot(d[0], d[2]);
      if (dl < 0.35) { this.target = null; }
      else desired = [d[0] / dl * this.speed, 0, d[2] / dl * this.speed];
    } else {
      /* a slow wander so it is never simply parked */
      this.wanderT -= dt;
      if (this.wanderT <= 0) { this.wanderT = 4 + Math.random() * 5; this.wanderYaw += (Math.random() - 0.5) * 1.7; }
      desired = [Math.sin(this.wanderYaw) * this.speed, 0, Math.cos(this.wanderYaw) * this.speed];
    }
    if (this.freeze) desired = [0, 0, 0];

    /* 2 · velocity chases the wish, but only so fast — a shove survives a while */
    const accel = 1.9;
    for (const i of [0, 2]) {
      const e = desired[i] - this.vel[i];
      this.vel[i] += clamp(e, -accel * dt, accel * dt);
    }

    /* 3 · heading follows the velocity */
    const sp = Math.hypot(this.vel[0], this.vel[2]);
    if (sp > 0.03) {
      const want = Math.atan2(this.vel[0], this.vel[2]);
      let e = want - this.yaw;
      while (e > Math.PI) e -= 2 * Math.PI;
      while (e < -Math.PI) e += 2 * Math.PI;
      this.yaw += clamp(e, -2.2 * dt, 2.2 * dt);
    }

    /* 4 · the trunk slides forward; the gait clock turns */
    this.pos[0] += this.vel[0] * dt;
    this.pos[2] += this.vel[2] * dt;
    this.clock = frac(this.clock + dt / this.period);

    /* 5 · every leg: plant, or fly to where the body will be */
    const stanceTravel = 0.5 * D * this.period;
    for (let i = 0; i < pl.hips.length; i++) {
      const h = pl.hips[i], ft = this.feet[i];
      const p = frac(this.clock + this.offsets[i]);
      const down = p < D;
      /* the foot the body is aiming this leg at, right now */
      const nom = this.toWorld(h.rest, true);
      const tx = nom[0] + this.vel[0] * stanceTravel + this.balanceGain * (this.vel[0] - desired[0]);
      const tz = nom[2] + this.vel[2] * stanceTravel + this.balanceGain * (this.vel[2] - desired[2]);
      const ty = this.ground(tx, tz);

      ft.aim = [tx, ty, tz];
      if (down) {
        if (!ft.down) {                       /* touchdown */
          ft.down = true; ft.swing = 0;
          ft.pos = [tx, ty, tz];
          this.events.push({ leg: i, x: tx, y: ty, z: tz, speed: sp });
        }
        /* planted: the world holds it still.  This is what walking IS. */
      } else {
        if (ft.down) { ft.down = false; ft.lift = ft.pos.slice(); }   /* liftoff */
        const s = (p - D) / (1 - D);
        ft.swing = s;
        const e = s * s * (3 - 2 * s);                                /* smoothstep */
        const x = lerp(ft.lift[0], tx, e), z = lerp(ft.lift[2], tz, e);
        const base = lerp(ft.lift[1], ty, e);
        ft.pos = [x, base + Math.sin(Math.PI * s) * this.stepArc * this.scale, z];
      }
    }

    /* 6 · the weight shift.
       An animal walking slowly moves its body over the legs that are carrying
       it.  Two things had to be true before that helped rather than hurt, and
       both were found by measuring:
         · it must ANTICIPATE — leaning toward the feet that are down right now
           is useless, because a different set will be carrying the weight by the
           time the trunk arrives.  This looks a fifth of a cycle ahead, which an
           animal can do because it knows its own gait;
         · and it must never leave the polygon it is standing in THIS instant.
           So the wish is a direction, and how far along it to go is chosen by
           searching for the point with the largest margin in the polygon that
           exists now.  t = 0 is always a candidate, so leaning can never be
           worse than not leaning. */
    {
      let wx = 0, wz = 0;
      if (this.lean > 0) {
        const lead = 0.19;
        let cx = 0, cz = 0, k2 = 0;
        for (let i = 0; i < pl.hips.length; i++) {
          if (frac(this.clock + lead + this.offsets[i]) >= D) continue;
          const ft2 = this.feet[i];
          const q = ft2.down ? ft2.pos : (ft2.aim || ft2.pos);
          cx += q[0]; cz += q[2]; k2++;
        }
        if (k2) {
          const dx = clamp((cx / k2 - this.pos[0]) * this.lean, -this.leanMax, this.leanMax);
          const dz = clamp((cz / k2 - this.pos[2]) * this.lean, -this.leanMax, this.leanMax);
          const hullNow = hull2(this.feet.filter((f) => f.down).map((f) => [f.pos[0], f.pos[2]]));
          let best = -Infinity, bt = 0;
          for (let k3 = 0; k3 <= 16; k3++) {
            const t2 = k3 / 16;
            const m = hullMargin(hullNow, [this.pos[0] + t2 * dx, this.pos[2] + t2 * dz]);
            if (m > best) { best = m; bt = t2; }
          }
          wx = bt * dx; wz = bt * dz;
        }
      }
      const k = 1 - Math.exp(-dt * 13.0);
      this.leanOff[0] += (wx - this.leanOff[0]) * k;
      this.leanOff[1] += (wz - this.leanOff[1]) * k;
    }

    /* 7 · the trunk rides the plane its planted feet describe */
    const planted = this.feet.filter((f) => f.down).map((f) => f.pos);
    if (planted.length >= 3) {
      const pf = planeFit(planted);
      const n = norm([-pf.a, 1, -pf.b]);
      const k = 1 - Math.exp(-dt * 5.5);
      this.up = norm(lerp3(this.up, n, k));
      const yWant = pf.a * this.pos[0] + pf.b * this.pos[2] + pf.c + pl.stand;
      this.pos[1] += (yWant - this.pos[1]) * (1 - Math.exp(-dt * 9));
      this.planeY = yWant - pl.stand;
    } else {
      const yWant = this.ground(this.pos[0], this.pos[2]) + pl.stand;
      this.pos[1] += (yWant - this.pos[1]) * (1 - Math.exp(-dt * 6));
    }
    return this;
  }

  shove(vx, vz) { this.vel[0] += vx; this.vel[2] += vz; }

  /* ── what the eye gets: every bone as a tapered capsule ─────────────────── */
  segments() {
    const pl = this.plan, f = this.frame(), S = this.scale, out = [];
    const L = (l) => this.toWorld(l);
    /* the trunk: a tapered spine from tail to head */
    const NSP = 7;
    for (let i = 0; i < NSP; i++) {
      const t0 = i / NSP, t1 = (i + 1) / NSP;
      const z0 = lerp(-pl.halfLen, pl.halfLen * 1.06, t0);
      const z1 = lerp(-pl.halfLen, pl.halfLen * 1.06, t1);
      /* an abdomen at the tail, a waist, a thorax at the shoulders */
      const bell = (t, c0, w) => Math.exp(-((t - c0) / w) * ((t - c0) / w));
      const prof = (t) => (0.046 + 0.130 * bell(clamp(t, 0, 1), 0.235, 0.240)
                                 + 0.086 * bell(clamp(t, 0, 1), 0.800, 0.180)) * S;
      out.push({ kind: 'trunk', a: L([0, 0.02 * S, z0]), b: L([0, 0.02 * S, z1]), r0: prof(t0), r1: prof(t1) });
    }
    /* the head, tipped a little down */
    out.push({ kind: 'head', a: L([0, 0.035 * S, pl.halfLen * 1.06]), b: L([0, 0.005 * S, pl.halfLen * 1.30]), r0: 0.115 * S, r1: 0.072 * S });
    /* the legs */
    for (let i = 0; i < pl.hips.length; i++) {
      const h = pl.hips[i], ft = this.feet[i];
      const hip = L(h.local);
      const outward = mul(f.right, h.side);
      const bendRef = norm(add(mul(f.up, 1.0), mul(outward, 0.62)));
      const k = kneePos(hip, ft.pos, pl.femur, pl.tibia, bendRef);
      out.push({ kind: 'femur', leg: i, a: hip, b: k.knee, r0: 0.062 * S, r1: 0.043 * S, down: ft.down });
      out.push({ kind: 'tibia', leg: i, a: k.knee, b: ft.pos, r0: 0.043 * S, r1: 0.020 * S, down: ft.down });
      /* the knee knob: a capsule with almost no axis is a sphere */
      out.push({ kind: 'joint', leg: i, a: k.knee, b: add(k.knee, [0, 0.004 * S, 0]), r0: 0.052 * S, r1: 0.052 * S, down: ft.down });
      /* the foot pad, so it reads as landing on something */
      out.push({ kind: 'foot', leg: i, a: ft.pos, b: add(ft.pos, [0, 0.006 * S, 0]), r0: 0.034 * S, r1: 0.034 * S, down: ft.down });
    }
    return out;
  }

  /* ── centre of mass: taken from the very bones that get drawn ───────────── */
  com() {
    let m = 0, c = [0, 0, 0];
    for (const s of this.segments()) {
      if (s.kind === 'joint' || s.kind === 'foot') continue;
      const L = len(sub(s.b, s.a)) || 1e-4;
      const r = 0.5 * (s.r0 + s.r1);
      /* the trunk carries the animal: bones are hollow, the body is not */
      const rho = (s.kind === 'trunk' || s.kind === 'head') ? 3.0 : 1.0;
      const w = rho * L * r * r;
      m += w;
      c = add(c, mul(mul(add(s.a, s.b), 0.5), w));
    }
    return mul(c, 1 / (m || 1));
  }

  /* ── the polygon it is standing on, and how far inside it the mass falls ── */
  support() {
    const feet = this.feet.filter((f) => f.down).map((f) => [f.pos[0], f.pos[2]]);
    const hull = hull2(feet);
    const c = this.com();
    const margin = hullMargin(hull, [c[0], c[2]]);
    return { hull, feet, com: c, margin, nDown: feet.length, stable: margin > 0 };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   7 · THE MEASUREMENT

   Walk the beast on dead-flat ground in a straight line until the gait has
   settled, then sample exactly one cycle and ask, at each sample, whether the
   centre of mass is over the polygon.  Same class, same code, same creature
   you are looking at — this is not a separate model of the animal.
   ══════════════════════════════════════════════════════════════════════════════ */
export function measureStability(cfg = {}) {
  const samples = cfg.samples || 480;
  const b = new Beast({
    ground: () => 0,
    legs: cfg.legs ?? 6,
    lean: cfg.lean ?? 0,
    gait: cfg.gait ?? 'tripod',
    duty: cfg.duty ?? 0.5,
    speed: cfg.speed ?? 0.85,
    period: cfg.period ?? 1.1,
    scale: cfg.scale ?? 1,
  });
  b.duty = cfg.duty ?? b.duty;
  b.target = [0, 0, 1e5];                       /* straight ahead, forever */
  const dt = b.period / samples;
  for (let i = 0; i < samples * 6; i++) b.step(dt);   /* settle */
  b.events.length = 0;
  let ok = 0, minMargin = Infinity, minDown = 99, maxDown = 0, sumMargin = 0;
  for (let i = 0; i < samples; i++) {
    b.step(dt);
    const s = b.support();
    if (s.stable) ok++;
    minMargin = Math.min(minMargin, s.margin);
    sumMargin += s.margin;
    minDown = Math.min(minDown, s.nDown);
    maxDown = Math.max(maxDown, s.nDown);
  }
  return {
    fraction: ok / samples,
    minMargin, meanMargin: sumMargin / samples,
    minDown, maxDown,
    duty: b.duty, legs: b.plan.nLegs, gait: b.gaitId,
  };
}

/* The lowest duty factor at which the WHOLE cycle is statically stable.
   Stability is monotone in duty (more stance can only add feet), so this
   bisects: a coarse scan to bracket, then 22 halvings.  Returns null if the
   creature is never stable at any duty — which is the right answer for two legs. */
export function dutyThreshold(cfg = {}, lo = 0.20, hi = 0.97) {
  const S = cfg.samples || 240;
  const stable = (d) => measureStability({ ...cfg, duty: d, samples: S }).fraction >= 1;
  if (!stable(hi)) return null;
  let a = lo, b = hi;
  if (stable(a)) return { duty: a, exact: false };
  for (let i = 0; i < 22; i++) { const m = 0.5 * (a + b); if (stable(m)) b = m; else a = m; }
  return { duty: b, lower: a, exact: true, result: measureStability({ ...cfg, duty: b, samples: S }) };
}

/* ── the counting arguments, written down before anything is simulated ─────
   These are PREDICTIONS.  core.test.mjs measures each one against a full run of
   the beast above — IK, plane fit, mass from the drawn bones and all — and the
   two have to agree.

   1 · With N legs at duty beta, an evenly-phased (wave) gait has floor(N·beta)
       feet down at the thinnest instant of the cycle.
   2 · A polygon needs three corners to have an inside, so NO gait of any kind
       can be statically stable below beta = 3/N.  That is a floor, not a recipe.
   3 · A metachronal wave lifts a whole flank in turn, so it needs strictly more
       feet down than one flank has legs: floor(N·beta) >= N/2 + 1, i.e.
       beta >= 1/2 + 1/N.  (Quadruped 3/4 · hexapod 2/3 · octopod 5/8.)
   4 · An alternating gait splits the legs into two sets that swap, so it needs
       beta >= 1/2 whatever N is — and at N = 6 that IS 3/N.  The insect tripod
       sits exactly on the floor in (2): no six-legged gait can be stable at a
       lower duty factor.  That is why an insect can stop dead mid-stride. */
export function minFeetLaw(nLegs, duty) { return Math.floor(nLegs * duty + 1e-9); }

/* THE PREDICTOR.  Given a leg count and a gait, work out — by counting feet and
   looking at where they are, with no simulation whatsoever — the lowest duty
   factor at which the creature can be statically stable for a whole cycle.
   Returns { duty, how } or { duty: null, how } if it never can be.

   core.test.mjs checks this against a bisected measurement for EVERY gait the
   room offers.  Ten of the eleven agree to the fourth decimal.  The eleventh is
   the four-legged walk, and the reason is the nicest thing in the room. */
export function predictThreshold(nLegs, gaitId) {
  const pl = bodyPlan(nLegs);
  const g = gaitById(gaitId);
  const off = g.offsets(pl.pairs);
  const uniq = new Set(off.map((v) => v.toFixed(6)));
  if (uniq.size === 2) {
    /* two sets that swap: every cycle has instants with only one set down */
    const k = nLegs / 2;
    if (k < 3) return { duty: null, how: `never — its two sets are ${k} ${k === 1 ? 'foot' : 'feet'} each, and a polygon needs three corners` };
    const first = pl.hips.filter((h, i) => off[i] === off[0]);
    const bothFlanks = first.some((h) => h.side < 0) && first.some((h) => h.side > 0);
    if (!bothFlanks) return { duty: null, how: 'never — each set is one whole flank, so the polygon never reaches under the animal' };
    return { duty: 0.5, how: '1/2 — two sets that swap, each spread around the body' };
  }
  if (nLegs === 2) return { duty: null, how: 'never — two feet make a line, and a line has no inside' };
  return { duty: waveDutyThreshold(nLegs), how: `1/2 + 1/${nLegs} — more feet down than one flank has legs` };
}
export function dutyForThreeFeet(nLegs) { return 3 / nLegs; }
export function waveDutyThreshold(nLegs) { return 0.5 + 1 / nLegs; }
export function alternatingDutyThreshold() { return 0.5; }
