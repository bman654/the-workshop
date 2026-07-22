/* ============================================================================
 *  THE NEWTON'S CRADLE — the shared sim, re-founded on the estate's dynamics core.
 *
 *  This module is imported by BOTH the page (forge-inlined, so the browser runs the
 *  same bytes) AND its headless twins (cradle.live.mjs / cradle.golden.mjs, as a
 *  real ESM in Node). One operator, no fork: the swinging you see, the momentum the
 *  self-test chip witnesses, and the numbers the liveness twin asserts are all THIS
 *  code running on tools/dynamics/verlet.mjs.
 *
 *  THE MODEL. Each ball is a point mass in a Verlet World, hung from its OWN pinned
 *  anchor by a distance constraint (a rod of rest length L). The classic V-string of
 *  a real cradle is render-only — the physics is one rod per ball. Gravity swings the
 *  bob along its arc; the K Gauss–Seidel projections keep the rod stiff.
 *
 *  THE HAIR GAP LIVES IN THE ANCHOR SPACING, not in a collision epsilon. Anchors sit
 *  SPACING = D + GAP apart, so at rest neighbouring balls are GAP apart (just shy of
 *  touching) — that hair gap is the PHYSICAL mechanism that serialises the wave: the
 *  incoming clump's leading ball closes its gap and strikes FIRST, that impulse
 *  resolves, then the next gap closes, and so on down the line. Snap the balls to a
 *  zero gap and the collisions go simultaneous and the lift-k → k-out wave desyncs.
 *
 *  COLLISIONS ARE CRADLE-OWNED (not in the core's base step). After each substep's
 *  Verlet integrate + K rod projections, stepCradle runs a sequential adjacent-pair
 *  Gauss–Seidel loop: for each overlapping, approaching neighbour pair it takes the
 *  TRUE line-of-centers normal, projects both velocities onto it, calls the core's
 *  momentum-exact collide1D, writes the normal impulse back (tangential untouched),
 *  and pushes the pair symmetrically apart (positional, momentum-neutral). The NEXT
 *  substep's rod projection restores each ball to its arc — which auto-damps the tiny
 *  radial velocity the impulse left behind, a free correctness win. Restitution e maps
 *  1:1 onto collide1D (e=1 conserves KE+p; e<1 holds p while KE bleeds).
 * ============================================================================ */

import { World, collide1D } from '../../tools/dynamics/verlet.mjs';

/* geometry — SI-ish (metres / kg / seconds), shared by page + twins */
export const R = 0.045;              // ball radius
export const D = 2 * R;              // diameter
export const GAP = 0.0008;           // hair gap between hanging balls → sequential clicks
export const SPACING = D + GAP;      // anchor (pivot) spacing
export const L = 0.92;               // rod length
export const G = 9.81;
export const PIVOT_Y = 0;            // anchors sit on y = 0 (world y-down positive)
/* fixed physics substep. Position-Verlet PBD carries an O(dt) dissipative wind-down
 * on a swinging pendulum (the rod projection is not symplectic — measured ~0.4%/swing
 * amplitude loss here); we run at 5760 Hz so that loss reads as a gentle, realistic
 * desk-toy wind-down rather than a visible tape wobble. It is CHARACTERIZED and
 * honest, never "conserved forever" (see the page copy + cradle.golden.mjs). */
export const SUBSTEP = 1 / 5760;
export const MAX_ANGLE = 1.02;       // drag clamp (~58°, outward only)
export const DEF_LIFT = 0.86;        // click-to-release amplitude (~49°)
export const ITER = 12;              // rod stiffness: K Gauss–Seidel projections/substep

function range(a, b){ const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

/* buildCradle(N, e, opts) → the live cradle. opts.iterations overrides rod stiffness. */
export function buildCradle(N, e, opts){
  opts = opts || {};
  const K = (opts.iterations != null) ? opts.iterations : ITER;
  const w = new World({ gravity: [0, G], drag: 0, iterations: K, dt: SUBSTEP });

  const anchors = [], balls = [], masses = new Array(N).fill(1);
  const pivotX = (i) => (i - (N - 1) / 2) * SPACING;
  for (let i = 0; i < N; i++){
    const px = pivotX(i);
    anchors.push(w.add(px, PIVOT_Y, { pinned: true }));
    balls.push(w.add(px, PIVOT_Y + L, { mass: 1, radius: R }));
    w.link(anchors[i], balls[i], L);
  }

  let restitution = (e != null) ? e : 1;
  const held = new Set();
  let events = 0, lastEventDp = 0, lastEventKEDelta = 0;
  let pendingClicks = [];

  /* translate a ball's position AND previous position equally — a pure shift that
   * leaves the implicit velocity (x−px)/dt untouched (used by the push-apart). */
  function translate(id, dx, dy){
    w.x[id] += dx; w.px[id] += dx; w.y[id] += dy; w.py[id] += dy;
  }

  function setMass(i, m){
    masses[i] = m; w.mass[balls[i]] = m;
    w.invMass[balls[i]] = (w.pinned[balls[i]] ? 0 : (m > 0 ? 1 / m : 0));
  }
  function massOf(i){ return masses[i]; }
  function setRestitution(v){ restitution = v; }

  function ballPos(i){ return w.pos(balls[i]); }
  function ballVel(i){ return w.velocity(balls[i]); }
  /* signed angle from vertical, +x side positive (render/debug convenience). */
  function angleOf(i){
    const p = ballPos(i);
    return Math.atan2(p[0] - pivotX(i), p[1] - PIVOT_Y);
  }

  /* place ball i on its OWN pivot arc at `ang` from vertical. zeroVel:true parks it
   * dead-at-rest (px=x); the rod length is honoured exactly. */
  function setBallAngle(i, ang, zeroVel){
    const x = pivotX(i) + L * Math.sin(ang);
    const y = PIVOT_Y + L * Math.cos(ang);
    w.setPos(balls[i], x, y, { zeroVel: !!zeroVel });
  }

  /* lift k balls from `side` to ±angle, all others home to rest — every ball dead
   * at rest, phase-locked at the same angle so the clump stays just-touching. */
  function lift(k, side, angle){
    for (let i = 0; i < N; i++) setBallAngle(i, 0, true);
    const sign = (side === 'L') ? -1 : 1;   // outward: left group swings −x, right +x
    const grp = (side === 'L') ? range(0, k - 1) : range(N - k, N - 1);
    for (const i of grp) setBallAngle(i, sign * Math.abs(angle), true);
  }
  function resetRest(){ for (let i = 0; i < N; i++) setBallAngle(i, 0, true); }

  /* hold a group at a common angle, kinematic (the pointer drives it). Release lets
   * them fall from rest (they were parked zeroVel) — the exact old grab/release feel. */
  function grabGroup(ids, ang){
    for (const i of ids){ setBallAngle(i, ang, true); w.grab(balls[i]); held.add(i); }
  }
  function releaseHeld(){ for (const i of held) w.release(balls[i]); held.clear(); }
  function heldIds(){ return [...held]; }

  /* stepCradle(dt) — one Verlet substep (integrate + K rod projections) THEN the
   * cradle-owned sequential adjacent-pair collision loop. */
  function stepCradle(dt){
    w.step(dt);
    /* snapshot momentum + KE before the impulse loop (the loop changes only
     * velocities, so their deltas across it isolate the collision itself:
     * |Δp| ≈ 0 always, ΔKE ≈ 0 at e=1 and < 0 at e<1). */
    const p0 = totalMomentum(), ke0 = KE();
    let fired = false;
    for (let pass = 0; pass < N + 2; pass++){
      let any = false;
      for (let i = 0; i < N - 1; i++){
        const a = balls[i], b = balls[i + 1];
        const dx = w.x[b] - w.x[a], dy = w.y[b] - w.y[a];
        const dist = Math.hypot(dx, dy);
        if (dist >= D - 1e-9 || dist < 1e-12) continue;          // not overlapping
        const nx = dx / dist, ny = dy / dist;                    // TRUE line of centers
        const va = w.velocity(a), vb = w.velocity(b);
        const ua = va[0] * nx + va[1] * ny, ub = vb[0] * nx + vb[1] * ny;
        if (ua - ub <= 0) continue;                              // not approaching
        const out = collide1D(masses[i], masses[i + 1], ua, ub, restitution);
        const da = out[0] - ua, db = out[1] - ub;
        w.setVelocity(a, va[0] + da * nx, va[1] + da * ny);      // normal impulse; tangential kept
        w.setVelocity(b, vb[0] + db * nx, vb[1] + db * ny);
        const pen = (D - dist) / 2;                              // symmetric push-apart (positional)
        translate(a, -nx * pen, -ny * pen);
        translate(b,  nx * pen,  ny * pen);
        events++; fired = true;
        pendingClicks.push(ua - ub);                            // closing speed → clack loudness
        any = true;
      }
      if (!any) break;
    }
    if (fired){
      const p1 = totalMomentum();
      lastEventDp = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      lastEventKEDelta = KE() - ke0;
    }
  }

  /* ── readers for the page HUD + the twins ─────────────────────────────────── */
  function totalMomentum(){
    let px = 0, py = 0;
    for (let i = 0; i < N; i++){ const v = ballVel(i); px += masses[i] * v[0]; py += masses[i] * v[1]; }
    return [px, py];
  }
  function KE(){ let k = 0; for (let i = 0; i < N; i++){ const v = ballVel(i); k += 0.5 * masses[i] * (v[0]*v[0] + v[1]*v[1]); } return k; }
  /* display PE, zero at the rest line (bottom), positive when lifted. */
  function PE(){ let u = 0; for (let i = 0; i < N; i++){ const p = ballPos(i); u += masses[i] * G * ((PIVOT_Y + L) - p[1]); } return u; }
  function P(){ return totalMomentum()[0]; }   // horizontal momentum (the readout's p)
  function drainClicks(){ const c = pendingClicks; pendingClicks = []; return c; }

  return {
    w, N, R, D, GAP, SPACING, L, G, PIVOT_Y, MAX_ANGLE, DEF_LIFT,
    anchors, balls, pivotX,
    setMass, massOf, setRestitution, get restitution(){ return restitution; },
    ballPos, ballVel, angleOf, setBallAngle,
    lift, resetRest, grabGroup, releaseHeld, heldIds,
    stepCradle,
    get events(){ return events; }, get lastEventDp(){ return lastEventDp; },
    get lastEventKEDelta(){ return lastEventKEDelta; },
    drainClicks, totalMomentum, KE, PE, P,
  };
}
