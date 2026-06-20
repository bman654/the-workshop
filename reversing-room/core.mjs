// ════════════════════════════════════════════════════════════════════════════
// reversing-room/core.mjs — THE SOLE REVERSIBILITY AUTHORITY
//
// A deterministic, EXACTLY reversible billiards engine. The whole point is one
// claim: forward∘reverse = identity, BIT-EXACT — not within ε, but byte-for-byte
// on the serialized state. unstep is GENUINE INVERSE PHYSICS derived from the
// law, never a stored tape and never flip∘step∘flip.
//
// GEOMETRY — AXIS-ALIGNED LANES (sell the table as rails, never free-angle pool).
// Discs of equal mass on a rectangular table. Each disc moves along ONE axis at a
// time. Two discs collide only when they share a row (same y, both moving in x)
// or a column (same x, both moving in y): a 1-D elastic exchange along that shared
// lane. Walls are axis-aligned. Because every collision is a 1-D event between
// equal masses, every contact time is the ratio of two integers — RATIONAL
// FOREVER, no √ anywhere. (A general off-axis disc collision needs a √ and would
// break bit-exactness — that honesty is the whole point; we never do it.)
//
// EXACT ARITHMETIC. Positions and velocities are BigInt rationals {n,d}, reduced,
// d>0. Every add/sub/mul/div stays exact, so the state after N events is a precise
// rational the inverse can land on with zero drift.
//
// THE LAW IS ITS OWN TIME-REVERSE. For perfectly elastic equal-mass collisions
// (restitution e=1) the resolve is a velocity SWAP (pair) or a velocity FLIP
// (wall) — each an INVOLUTION. So to undo the collision that produced a state we
// simply re-apply the elastic resolve to the still-touching participants, then
// drift backward (flip velocities, drift to the next now-future contact, flip
// back). The result is exactly the previous post-collision state. unstep stores
// ZERO positions; it recomputes every coordinate from the law — which is what lets
// the self-test DEFEAT a frame buffer by re-deriving states that were never saved.
//
// THE NEG-CONTROL THAT MUST BITE. With restitution e<1 (friction) the resolve is
// NO LONGER an involution: each collision drains kinetic energy irreversibly. Then
// forward∘reverse FAILS to recover the start AND energy strictly drops. If
// reversibility were a recorded tape, friction couldn't break it. It does — so the
// property is real and falsifiable.
//
// SCOPING HONESTY (load-bearing, stated in the room copy too):
//   • ENERGY is the clean invariant: exactly conserved at EVERY event, both
//     directions (e=1).
//   • MOMENTUM is conserved across every PAIR collision only. A WALL is an
//     external boundary — it reverses one component, so total momentum is NOT
//     conserved across a wall hit. We assert pair-momentum, never wall-momentum.
// ════════════════════════════════════════════════════════════════════════════

// ── exact rationals: BigInt {n,d}, reduced, d>0 ────────────────────────────────
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
export function R(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (d === 0n) throw new Error('rational with zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
export const rAdd = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
export const rSub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
export const rMul = (a, b) => R(a.n * b.n, a.d * b.d);
const rDiv = (a, b) => R(a.n * b.d, a.d * b.n);
const rNeg = a => ({ n: -a.n, d: a.d });
export const rCmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
export const rEq  = (a, b) => a.n === b.n && a.d === b.d;
export const rZero = { n: 0n, d: 1n };
const rIsPos = a => a.n > 0n;
export const rNum = a => Number(a.n) / Number(a.d);

// ── the table (integer bounds ⇒ every wall time rational) ──────────────────────
export const WORLD = { W: 200n, H: 120n, RAD: 7n };
export const LO   = R(WORLD.RAD);
export const HIX  = R(WORLD.W - WORLD.RAD);
export const HIY  = R(WORLD.H - WORLD.RAD);
const D2   = R(2n * WORLD.RAD);          // contact separation along the shared lane
const negD2 = rNeg(D2);

// ── state helpers (a state is {balls:[{x,y,vx,vy}]}, every field a rational) ────
export function flip(s)  { return { balls: s.balls.map(b => ({ x: b.x, y: b.y, vx: rNeg(b.vx), vy: rNeg(b.vy) })) }; }
export function clone(s) { return { balls: s.balls.map(b => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy })) }; }
export function statesEqual(a, b) {
  if (a.balls.length !== b.balls.length) return false;
  for (let i = 0; i < a.balls.length; i++) {
    const p = a.balls[i], q = b.balls[i];
    if (!rEq(p.x, q.x) || !rEq(p.y, q.y) || !rEq(p.vx, q.vx) || !rEq(p.vy, q.vy)) return false;
  }
  return true;
}
// canonical serialization for BIT-EXACT comparison (defeats ε-fuzzing entirely)
export function key(s) {
  return s.balls.map(b => `${b.x.n}/${b.x.d},${b.y.n}/${b.y.d}|${b.vx.n}/${b.vx.d},${b.vy.n}/${b.vy.d}`).join(';');
}
export function drift(s, dt) {
  if (rEq(dt, rZero)) return clone(s);
  return { balls: s.balls.map(b => ({ x: rAdd(b.x, rMul(b.vx, dt)), y: rAdd(b.y, rMul(b.vy, dt)), vx: b.vx, vy: b.vy })) };
}

// ── candidate future times (strictly > 0) ──────────────────────────────────────
function wallTimeAxis(p, v, lo, hi) {
  if (rIsPos(v)) { const dt = rDiv(rSub(hi, p), v); return rIsPos(dt) ? dt : null; }
  if (v.n < 0n)  { const dt = rDiv(rSub(lo, p), v); return rIsPos(dt) ? dt : null; }
  return null;
}
// a same-lane approaching pair reaching contact (centers 2·RAD apart along the lane)
function pairTimeAxis(bi, bj) {
  if (rEq(bi.y, bj.y) && bi.vy.n === 0n && bj.vy.n === 0n && (bi.vx.n !== 0n || bj.vx.n !== 0n)) {
    const dx = rSub(bj.x, bi.x), dvx = rSub(bj.vx, bi.vx);
    if (dvx.n === 0n) return null;
    const tgt = dx.n > 0n ? D2 : negD2;
    const dt = rDiv(rSub(tgt, dx), dvx); return rIsPos(dt) ? dt : null;
  }
  if (rEq(bi.x, bj.x) && bi.vx.n === 0n && bj.vx.n === 0n && (bi.vy.n !== 0n || bj.vy.n !== 0n)) {
    const dy = rSub(bj.y, bi.y), dvy = rSub(bj.vy, bi.vy);
    if (dvy.n === 0n) return null;
    const tgt = dy.n > 0n ? D2 : negD2;
    const dt = rDiv(rSub(tgt, dy), dvy); return rIsPos(dt) ? dt : null;
  }
  return null;
}
function nextContactTime(s) {
  const balls = s.balls; let best = null;
  const cons = t => { if (t && (!best || rCmp(t, best) < 0)) best = t; };
  for (const b of balls) { cons(wallTimeAxis(b.x, b.vx, LO, HIX)); cons(wallTimeAxis(b.y, b.vy, LO, HIY)); }
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) cons(pairTimeAxis(balls[i], balls[j]));
  return best;
}

// ── active-NOW contact sets (dt=0): used by the FORWARD resolve ─────────────────
function wallActive(b) {
  const ev = [];
  if (rEq(b.x, LO)  && b.vx.n < 0n) ev.push('x');
  if (rEq(b.x, HIX) && b.vx.n > 0n) ev.push('x');
  if (rEq(b.y, LO)  && b.vy.n < 0n) ev.push('y');
  if (rEq(b.y, HIY) && b.vy.n > 0n) ev.push('y');
  return ev;
}
function pairActive(bi, bj) {
  if (rEq(bi.y, bj.y) && bi.vy.n === 0n && bj.vy.n === 0n) {
    const dx = rSub(bj.x, bi.x), dvx = rSub(bj.vx, bi.vx);
    if (rEq(dx, D2) && dvx.n < 0n) return 'x';
    if (rEq(dx, negD2) && dvx.n > 0n) return 'x';
  }
  if (rEq(bi.x, bj.x) && bi.vx.n === 0n && bj.vx.n === 0n) {
    const dy = rSub(bj.y, bi.y), dvy = rSub(bj.vy, bi.vy);
    if (rEq(dy, D2) && dvy.n < 0n) return 'y';
    if (rEq(dy, negD2) && dvy.n > 0n) return 'y';
  }
  return null;
}
export function hasActive(s) {
  for (let i = 0; i < s.balls.length; i++) {
    if (wallActive(s.balls[i]).length) return true;
    for (let j = i + 1; j < s.balls.length; j++) if (pairActive(s.balls[i], s.balls[j])) return true;
  }
  return false;
}
// resolve the active-contact set in `ns` (mutates). restitution e: e=1 elastic, e<1 friction.
function resolveActive(ns, e) {
  const used = new Set(); let degen = false; const walls = [], pairs = [];
  for (let i = 0; i < ns.balls.length; i++) {
    const evs = wallActive(ns.balls[i]);
    for (const ax of evs) { if (used.has('B' + i + ax)) degen = true; used.add('B' + i + ax); walls.push({ i, ax }); }
  }
  for (let i = 0; i < ns.balls.length; i++) for (let j = i + 1; j < ns.balls.length; j++) {
    const a = pairActive(ns.balls[i], ns.balls[j]);
    if (a) { if (used.has('B' + i + a) || used.has('B' + j + a)) degen = true; used.add('B' + i + a); used.add('B' + j + a); pairs.push({ i, j, a }); }
  }
  if (degen || walls.length + pairs.length === 0) return { walls, pairs, degen, empty: walls.length + pairs.length === 0 };
  for (const w of walls) { const b = ns.balls[w.i]; if (w.ax === 'x') b.vx = rMul(rNeg(b.vx), e); else b.vy = rMul(rNeg(b.vy), e); }
  // 1-D equal-mass collision with restitution e: v1' = ½[(1−e)u1 + (1+e)u2], v2' = ½[(1+e)u1 + (1−e)u2].
  const half = R(1n, 2n), om = rSub(R(1n), e), op = rAdd(R(1n), e);
  for (const p of pairs) {
    const bi = ns.balls[p.i], bj = ns.balls[p.j];
    if (p.a === 'x') { const u1 = bi.vx, u2 = bj.vx; bi.vx = rMul(half, rAdd(rMul(om, u1), rMul(op, u2))); bj.vx = rMul(half, rAdd(rMul(op, u1), rMul(om, u2))); }
    else            { const u1 = bi.vy, u2 = bj.vy; bi.vy = rMul(half, rAdd(rMul(om, u1), rMul(op, u2))); bj.vy = rMul(half, rAdd(rMul(op, u1), rMul(om, u2))); }
  }
  return { walls, pairs, degen: false };
}

// ── just-happened contact sets (post-collision): used by UNSTEP ────────────────
function wallJustHit(b) {
  const ev = [];
  if (rEq(b.x, LO)  && b.vx.n > 0n) ev.push('x');
  if (rEq(b.x, HIX) && b.vx.n < 0n) ev.push('x');
  if (rEq(b.y, LO)  && b.vy.n > 0n) ev.push('y');
  if (rEq(b.y, HIY) && b.vy.n < 0n) ev.push('y');
  return ev;
}
function pairJustHit(bi, bj) {
  if (rEq(bi.y, bj.y) && bi.vy.n === 0n && bj.vy.n === 0n) {
    const dx = rSub(bj.x, bi.x), dvx = rSub(bj.vx, bi.vx);
    if (rEq(dx, D2) && dvx.n > 0n) return 'x';
    if (rEq(dx, negD2) && dvx.n < 0n) return 'x';
  }
  if (rEq(bi.x, bj.x) && bi.vx.n === 0n && bj.vx.n === 0n) {
    const dy = rSub(bj.y, bi.y), dvy = rSub(bj.vy, bi.vy);
    if (rEq(dy, D2) && dvy.n > 0n) return 'y';
    if (rEq(dy, negD2) && dvy.n < 0n) return 'y';
  }
  return null;
}
// undo the just-happened collision set in `ns` (mutates). elastic resolve (e=1) is
// its own inverse: flipping a wall component again, or swapping a pair back.
function unresolveLast(ns) {
  const used = new Set(); let degen = false; const walls = [], pairs = [];
  for (let i = 0; i < ns.balls.length; i++) {
    const evs = wallJustHit(ns.balls[i]);
    for (const ax of evs) { if (used.has('B' + i + ax)) degen = true; used.add('B' + i + ax); walls.push({ i, ax }); }
  }
  for (let i = 0; i < ns.balls.length; i++) for (let j = i + 1; j < ns.balls.length; j++) {
    const a = pairJustHit(ns.balls[i], ns.balls[j]);
    if (a) { if (used.has('B' + i + a) || used.has('B' + j + a)) degen = true; used.add('B' + i + a); used.add('B' + j + a); pairs.push({ i, j, a }); }
  }
  if (degen || walls.length + pairs.length === 0) return { walls, pairs, degen, empty: walls.length + pairs.length === 0 };
  for (const w of walls) { const b = ns.balls[w.i]; if (w.ax === 'x') b.vx = rNeg(b.vx); else b.vy = rNeg(b.vy); }
  for (const p of pairs) {
    const bi = ns.balls[p.i], bj = ns.balls[p.j];
    if (p.a === 'x') { const u1 = bi.vx, u2 = bj.vx; bi.vx = u2; bj.vx = u1; }
    else            { const u1 = bi.vy, u2 = bj.vy; bi.vy = u2; bj.vy = u1; }
  }
  return { walls, pairs, degen: false };
}

// ── THE STEP (forward) ─────────────────────────────────────────────────────────
// From a post-collision (or contact-free) state: drift to the next future contact
// and resolve it. The output is again post-collision. Deterministic; returns null
// when the world goes quiet (no future contact) or {degenerate:true} on a
// simultaneous triple/clustered contact we refuse to resolve ambiguously.
export function step(state, e = R(1n)) {
  const dt = nextContactTime(state); if (!dt) return null;
  const ns = drift(state, dt); const r = resolveActive(ns, e);
  if (r.degen || r.empty) return { degenerate: true };
  return { state: ns, dt, kind: r.pairs.length ? 'pair' : 'wall', count: r.walls.length + r.pairs.length, walls: r.walls, pairs: r.pairs };
}

// ── THE UNSTEP (analytic inverse — NOT a tape, NOT flip∘step∘flip) ──────────────
//   (1) UN-RESOLVE the collision active at this state — the participants sit AT
//       contact, separating; re-applying the elastic resolve (its own inverse for
//       e=1) makes them approaching AT contact again.
//   (2) DRIFT BACKWARD to the previous contact: flip velocities, drift to the next
//       (now-future) contact WITHOUT resolving, flip back.
//   The result is exactly the previous post-collision state. For e=1 this satisfies
//   unstep(step(s)) = s and step(unstep(s)) = s, bit-exact. Under friction (e<1)
//   step's resolve was NOT an involution, so step (1) cannot undo it — the round
//   trip provably fails, which is the neg-control.
export function unstep(state) {
  const cur = clone(state);
  const r = unresolveLast(cur);
  if (r.degen) return { degenerate: true };
  if (r.empty) return null;                       // not a post-collision state → no inverse
  const walls = r.walls, pairs = r.pairs;
  const back = flip(cur);
  const dt = nextContactTime(back); if (!dt) return null;
  const drifted = drift(back, dt);
  const prev = flip(drifted);
  return { state: prev, dt, kind: pairs.length ? 'pair' : 'wall', count: walls.length + pairs.length, walls, pairs };
}

// ── conserved quantities (exact rationals) ─────────────────────────────────────
export function momentum(s) { let px = rZero, py = rZero; for (const b of s.balls) { px = rAdd(px, b.vx); py = rAdd(py, b.vy); } return { px, py }; }
export function energy2(s)  { let e = rZero; for (const b of s.balls) { e = rAdd(e, rAdd(rMul(b.vx, b.vx), rMul(b.vy, b.vy))); } return e; } // 2·KE (mass=1)

// ── THE START POSE (the opening rack) ──────────────────────────────────────────
// An ordered cluster of 7 discs around the centre, half cruising in x, half in y,
// chosen so the lane-band collisions chain into a satisfying scatter-and-gather
// (20 pair-knots across 60 events on the live worldline). ONE disc (the marker,
// index 6) starts exactly AT the bottom wall moving UP — a post-collision
// signature — so pure law-based unstep can recover the whole start by the law
// alone (the trajectory has a virtual prior event there). Every coordinate and
// velocity is an integer ⇒ every contact time stays rational forever.
export function startPose() {
  const cx = R(100n), cy = R(60n);
  const defs = [
    { dx: -30n, dy: -16n, vx: 4n,  vy: 0n },
    { dx:  30n, dy: -16n, vx: -2n, vy: 0n },
    { dx: -30n, dy:   0n, vx: 3n,  vy: 0n },
    { dx:  30n, dy:   0n, vx: -3n, vy: 0n },
    { dx: -16n, dy: -30n, vx: 0n,  vy: 4n },
    { dx: -16n, dy:  30n, vx: 0n,  vy: -4n },
    { dx:  16n, dy: -30n, vx: 0n,  vy: 5n },
  ];
  const s = { balls: defs.map(o => ({ x: rAdd(cx, R(o.dx)), y: rAdd(cy, R(o.dy)), vx: R(o.vx), vy: R(o.vy) })) };
  // seat the marker (index 6) exactly at the bottom wall (y=LO) moving up: "just bounced".
  s.balls[6].y = LO; s.balls[6].vy = R(5n);
  return s;
}

// ── build a worldline (forward only) — the VISUAL ribbon the page replays ───────
// Each entry is a genuine drift+resolve event; absolute time tAbs is exact too.
export const N_EVENTS = 60;
export function buildWorldline(e = R(1n), nEvents = N_EVENTS) {
  const line = [{ state: startPose(), tAbs: rZero, kind: 'start' }];
  let cur = startPose(), t = rZero;
  for (let k = 0; k < nEvents; k++) {
    const r = step(cur, e);
    if (!r || r.degenerate) break;
    t = rAdd(t, r.dt); cur = r.state;
    line.push({ state: cur, tAbs: t, kind: r.kind, count: r.count });
  }
  return line;
}
// (all public symbols are exported inline above with `export const`/`export function`,
//  so the forge inliner — which strips a leading `export ` per declaration — can
//  drop this same source byte-faithfully into the page as a non-module script.)
