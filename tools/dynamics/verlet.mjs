/* ============================================================================
 *  THE WEIGHT & THE THREAD — the estate's shared 2-D point-mass DYNAMICS core.
 *
 *  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
 *  is the SOLE SOURCE OF TRUTH for the point-mass + distance-constraint physics
 *  the Cavern's mechanical benches stand on: the re-founded Newton's Cradle and
 *  the Pendulum Wave both inline this slab (forge:include) byte-for-byte and run
 *  the very operators core.test.mjs proves here. One core, inlined everywhere, no
 *  fork — page, self-test chip, and Node twin can never silently drift.
 *
 *  THE MODEL — POSITION VERLET with PBD (Störmer–Verlet integration + Jakobsen
 *  position-based distance constraints). State is a point's CURRENT position (x,y)
 *  and its PREVIOUS position (px,py); the velocity is implicit, v = (x−px)/dt.
 *  Each step:
 *    1. INTEGRATE every free point:  nx = x + (x−px)(1−drag) + g·dt²   (g y-down +)
 *       then the point's previous position becomes its old current (px,py ← x,y).
 *    2. PROJECT the distance constraints K times (Gauss–Seidel): for each rod/
 *       thread i—j, push i and j apart/together along their line to the rest
 *       length, mass-weighted by inverse mass (a pinned or held point has wᵢ=0 and
 *       does not move; ws===0 skips). K stiffer projections ⇒ a stiffer rod.
 *  There is NO collision in the base step. The core's ONLY collision contribution
 *  is the exported collide1D primitive; a rider (the Cradle) owns its own
 *  sequential adjacent-pair collision loop built ON collide1D.
 *
 *  HONESTY — a CHARACTERIZED BOUND, not eternity. Position-Verlet PBD carries a
 *  small O(dt²) SECULAR energy drift; it is NOT symplectic-exact. So the claim we
 *  make and the ONLY claim any rider page may echo is the brief's exact words:
 *  "|dE|/E₀ < a FIXED eps OVER a FIXED horizon (1e4 steps)" — a measured, bounded
 *  wander over a stated number of steps, NOT conservation forever. The drift
 *  SHRINKS as dt shrinks (measured: dt=1e-3 → 4.6e-3; halving dt over the same
 *  10 s → 2.4e-3), so the eps is earned by measurement, not asserted. NEVER word
 *  any page "energy conserved forever." The momentum claim, by contrast, IS exact
 *  to machine-ε: collide1D is an algebraic identity (see below).
 *
 *  DETERMINISM. Pure and deterministic — no Math.random anywhere (the test drivers
 *  below use an internal seeded PRNG). Struct-of-Arrays storage; the same seed and
 *  the same step sequence give bit-identical trajectories in Node and the browser.
 *
 *  THE TWO FALSIFIABLE CLAIMS (proven in core.test.mjs, each with a RED control):
 *   A · ENERGY, free pendulum. pin+bob+one rod, dt=1e-3, K=1, θ₀=0.3, drag=0,
 *       1e4 steps: max |dE|/|E₀| < eps_E=1e-2 (E = ½m v² − m g·r, core-reported v).
 *       CONTROLS that MUST breach eps: drag=−2e-4 (anti-damped, energy pumped up)
 *       and drag=+2e-4 (over-damped, energy bled) — the sign of drag is legible in
 *       the energy ledger, so the "0" isn't a coincidence of a dead integrator.
 *   B · MOMENTUM, collide1D. 5000 seeded random (e,m1,m2,u1,u2): |Δp| < eps_P=1e-9
 *       (measured ~machine-ε). CONTROL: a 1.3×-teeth unequal-impulse collide fails
 *       hugely (|Δp| ≈ 8) — momentum is a real identity here, not a fitted number.
 * ============================================================================ */

// === DYNAMICS CORE BEGIN ===
"use strict";

/* ── collide1D — the momentum-EXACT 1-D restitution primitive ────────────────
 *  Two point masses on a line meet head-on with incoming normal speeds u1,u2 and
 *  restitution e∈[0,1]. The outgoing speeds:
 *      v1 = ((m1 − e·m2)·u1 + (1+e)·m2·u2) / (m1+m2)
 *      v2 = ((m2 − e·m1)·u2 + (1+e)·m1·u1) / (m1+m2)
 *  Momentum m1u1+m2u2 is conserved for ANY e (algebraic identity). At e=1 kinetic
 *  energy is conserved too; at e<1 momentum still holds while KE bleeds. This is
 *  the SAME operator the Cradle's collision loop calls per contact. */
function collide1D(m1, m2, u1, u2, e){
  const s = m1 + m2;
  const v1 = ((m1 - e*m2)*u1 + (1 + e)*m2*u2) / s;
  const v2 = ((m2 - e*m1)*u2 + (1 + e)*m1*u1) / s;
  return [v1, v2];
}

/* ── World — the SoA point-mass + distance-constraint Verlet solver ───────────
 *  new World({ gravity:[gx,gy], drag, iterations:K, dt })
 *    gravity  a VECTOR, y-down POSITIVE (default [0, 9.81])
 *    drag     per-step velocity damping in [0,1) (0 = none)
 *    iterations  K Gauss–Seidel constraint passes per step (default 1)
 *    dt       the fixed timestep the implicit velocity is measured against */
class World {
  constructor(opts){
    opts = opts || {};
    const g = opts.gravity || [0, 9.81];
    this.gx = g[0] || 0;
    this.gy = (g[1] != null) ? g[1] : 9.81;
    this.drag = opts.drag || 0;
    this.iters = (opts.iterations != null) ? opts.iterations : 1;
    this.dt = (opts.dt != null) ? opts.dt : 1/60;
    /* Struct-of-Arrays: one entry per point, indexed by id. */
    this.x = []; this.y = [];        // current position
    this.px = []; this.py = [];      // previous position (velocity lives here)
    this.mass = []; this.invMass = [];
    this.radius = [];
    this.pinned = []; this.held = [];
    this.links = [];                 // { i, j, rest } distance constraints
  }

  /* add(x,y,{mass,pinned,radius}) -> id. A pinned point never integrates and has
   * inverse mass 0 (constraints cannot move it). */
  add(x, y, o){
    o = o || {};
    const m = (o.mass != null) ? o.mass : 1;
    const pinned = !!o.pinned;
    const id = this.x.length;
    this.x.push(x); this.y.push(y);
    this.px.push(x); this.py.push(y);
    this.mass.push(m);
    this.invMass.push(pinned ? 0 : (m > 0 ? 1/m : 0));
    this.radius.push(o.radius || 0);
    this.pinned.push(pinned);
    this.held.push(false);
    return id;
  }

  /* link(i,j,rest) -> a distance constraint (rod/thread). rest defaults to the
   * current i—j separation, so a link built at rest holds its start length. */
  link(i, j, rest){
    if (rest == null){
      const dx = this.x[j] - this.x[i], dy = this.y[j] - this.y[i];
      rest = Math.hypot(dx, dy);
    }
    const c = { i, j, rest };
    this.links.push(c);
    return c;
  }

  /* effective inverse mass for constraint projection: pinned OR held ⇒ 0
   * (a held point is kinematic — the pointer drives it, constraints don't). */
  _wInv(id){ return (this.pinned[id] || this.held[id]) ? 0 : this.invMass[id]; }

  /* step(dt?) — one Verlet integration + K Gauss–Seidel projections. NO collision
   * in the base step. If dt is passed it becomes the world dt (velocity is always
   * measured against the most recent dt); the core is otherwise fixed-dt. */
  step(dt){
    const h = (dt != null) ? dt : this.dt;
    this.dt = h;
    const n = this.x.length;
    const damp = 1 - this.drag;
    const ax = this.gx * h * h, ay = this.gy * h * h;
    /* 1 · integrate every free point (skip pin/held) */
    for (let i = 0; i < n; i++){
      if (this.pinned[i] || this.held[i]) continue;
      const ox = this.x[i], oy = this.y[i];
      const nx = ox + (ox - this.px[i]) * damp + ax;
      const ny = oy + (oy - this.py[i]) * damp + ay;
      this.px[i] = ox; this.py[i] = oy;
      this.x[i] = nx; this.y[i] = ny;
    }
    /* 2 · project distance constraints K times (Gauss–Seidel, mass-weighted) */
    const K = this.iters, L = this.links.length;
    for (let k = 0; k < K; k++){
      for (let c = 0; c < L; c++){
        const cn = this.links[c];
        const i = cn.i, j = cn.j;
        const dx = this.x[j] - this.x[i], dy = this.y[j] - this.y[i];
        const d = Math.hypot(dx, dy);
        if (d < 1e-12) continue;
        const wi = this._wInv(i), wj = this._wInv(j);
        const ws = wi + wj;
        if (ws === 0) continue;
        const diff = (d - cn.rest) / d;
        const si = wi / ws, sj = wj / ws;
        this.x[i] += si * diff * dx; this.y[i] += si * diff * dy;
        this.x[j] -= sj * diff * dx; this.y[j] -= sj * diff * dy;
      }
    }
  }

  /* ── readers / writers ─────────────────────────────────────────────────── */
  pos(id){ return [this.x[id], this.y[id]]; }

  /* implicit velocity: v = (x − px)/dt against the world dt. */
  velocity(id){ return [(this.x[id] - this.px[id]) / this.dt, (this.y[id] - this.py[id]) / this.dt]; }

  /* set velocity by parking the previous position a step behind: px = x − v·dt. */
  setVelocity(id, vx, vy){
    this.px[id] = this.x[id] - vx * this.dt;
    this.py[id] = this.y[id] - vy * this.dt;
  }

  /* setPos(id,x,y,{zeroVel}) — teleport. zeroVel:true parks px=py at the target
   * (dead stop); otherwise the velocity vector is carried (px,py shift with it). */
  setPos(id, X, Y, o){
    o = o || {};
    if (o.zeroVel){
      this.x[id] = X; this.y[id] = Y; this.px[id] = X; this.py[id] = Y;
    } else {
      const vx = this.x[id] - this.px[id], vy = this.y[id] - this.py[id];
      this.x[id] = X; this.y[id] = Y; this.px[id] = X - vx; this.py[id] = Y - vy;
    }
  }

  /* grab / moveTo / release — a kinematic HELD point the pointer drives. moveTo
   * leaves px trailing the previous position, so on release the point carries the
   * hand's drag velocity (px lags ⇒ v = (x−px)/dt ≠ 0). */
  grab(id){ this.held[id] = true; }
  moveTo(id, X, Y){
    this.px[id] = this.x[id]; this.py[id] = this.y[id];
    this.x[id] = X; this.y[id] = Y;
  }
  release(id){ this.held[id] = false; }

  /* total linear momentum [px,py] over the given ids (or the whole world). */
  momentum(ids){
    const list = ids || this._allIds();
    let px = 0, py = 0;
    for (let k = 0; k < list.length; k++){
      const id = list[k], v = this.velocity(id);
      px += this.mass[id] * v[0]; py += this.mass[id] * v[1];
    }
    return [px, py];
  }

  /* mechanical energy of one point: ½m v² − m(g·r). With g y-down positive and a
   * point hanging below its pin, this is ½m v² − m g y (the brief's E). */
  energy(id, m){
    const mm = (m != null) ? m : this.mass[id];
    const v = this.velocity(id);
    const ke = 0.5 * mm * (v[0]*v[0] + v[1]*v[1]);
    const pe = -mm * (this.gx * this.x[id] + this.gy * this.y[id]);
    return ke + pe;
  }

  _allIds(){ const a = []; for (let i = 0; i < this.x.length; i++) a.push(i); return a; }
}

/* ── deterministic test drivers (shared by the Node twin AND any page pill) ───
 *  A tiny seeded PRNG so the random-collision claim is reproducible with NO
 *  Math.random (the core stays pure). */
function _mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* CLAIM A driver — the free-pendulum energy drift. Returns { E0, maxRel } where
 * maxRel is the worst |E−E0|/|E0| seen over the whole horizon (the honest bound). */
function freePendulumDrift(opts){
  opts = opts || {};
  const dt = (opts.dt != null) ? opts.dt : 1e-3;
  const K = (opts.K != null) ? opts.K : 1;
  const theta0 = (opts.theta0 != null) ? opts.theta0 : 0.3;
  const drag = opts.drag || 0;
  const steps = (opts.steps != null) ? opts.steps : 1e4;
  const L = (opts.L != null) ? opts.L : 1;
  const m = (opts.m != null) ? opts.m : 1;
  const g = (opts.g != null) ? opts.g : 9.81;
  const w = new World({ gravity: [0, g], drag, iterations: K, dt });
  const pin = w.add(0, 0, { pinned: true });
  const bob = w.add(L * Math.sin(theta0), L * Math.cos(theta0), { mass: m });
  w.link(pin, bob, L);
  const E0 = w.energy(bob, m);
  let maxRel = 0;
  for (let s = 0; s < steps; s++){
    w.step();
    const E = w.energy(bob, m);
    const rel = Math.abs((E - E0) / E0);
    if (rel > maxRel) maxRel = rel;
  }
  return { E0, maxRel };
}

/* CLAIM B driver — worst momentum defect of collide1D across `trials` seeded
 * random head-on collisions. Deterministic (seeded), returns max |Δp|. */
function momentumConservationTest(trials, seed){
  const N = trials || 5000;
  const rnd = _mulberry32((seed != null) ? seed : 0x1234abcd);
  let worst = 0;
  for (let i = 0; i < N; i++){
    const e = rnd();
    const m1 = 0.1 + rnd() * 5, m2 = 0.1 + rnd() * 5;
    const u1 = (rnd() - 0.5) * 10, u2 = (rnd() - 0.5) * 10;
    const [v1, v2] = collide1D(m1, m2, u1, u2, e);
    const p0 = m1*u1 + m2*u2, p1 = m1*v1 + m2*v2;
    const d = Math.abs(p1 - p0);
    if (d > worst) worst = d;
  }
  return worst;
}

/* runSelfTest — the two claims + their RED controls, as a checks array a page
 * pill can render and the Node twin can mirror (single source of the verdict). */
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const EPS_E = 1e-2, EPS_P = 1e-9;

  // A — energy drift bounded over a FIXED horizon (characterized, not eternal).
  const a = freePendulumDrift();
  const aNeg = freePendulumDrift({ drag: -2e-4 });   // anti-damped: MUST breach
  const aPos = freePendulumDrift({ drag: +2e-4 });   // over-damped: MUST breach
  log('A · free-pendulum energy: max |dE|/|E0| < 1e-2 over 1e4 steps (bounded, not eternal)',
      a.maxRel < EPS_E && aNeg.maxRel > EPS_E && aPos.maxRel > EPS_E,
      'drift ' + a.maxRel.toExponential(2) + ' · controls −drag ' + aNeg.maxRel.toExponential(2) +
      ' / +drag ' + aPos.maxRel.toExponential(2) + ' (both must breach)');

  // B — collide1D momentum exact to machine-ε across 5000 seeded collisions.
  const bWorst = momentumConservationTest(5000);
  log('B · collide1D momentum exact: max |Δp| < 1e-9 over 5000 seeded collisions',
      bWorst < EPS_P, 'worst |Δp| ' + bWorst.toExponential(2));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === DYNAMICS CORE END ===

export {
  collide1D, World,
  freePendulumDrift, momentumConservationTest, runSelfTest,
  _mulberry32,
};
