/* ════════════════════════════════════════════════════════════════════════════
   core.mjs — THE CLACK COUNTER's sole physics authority (Galperin's billiard).

   Two blocks on a frictionless lane + a wall on the right. The HEAVY block M is
   shoved leftward-to-right into the LIGHT block m=1, which sits between M and the
   wall. Count EVERY collision (block-block + block-wall) until the system
   separates forever (light not moving toward the wall, heavy not catching light).
   For a mass ratio M/m = 100^N the total count is the first N+1 digits of π:
   3, 31, 314, 3141 (Galperin 2003, "Playing pool with π").

   THREE views of the SAME truth live here, and the self-test cross-checks them:
     1. closedCount(M,m)  — the wedge closed form, ⌈π/θ⌉−1 with θ=atan√(m/M).
        NO loop: a single arithmetic expression. This is the prophecy.
     2. velocityCount(M,m) — the count-only ground truth in velocity space
        (alternate wall-flip / elastic-catch), no positions. The classic
        argument's literal mechanics, counted.
     3. simulate(M,m)     — the EVENT-DRIVEN engine with real lane positions:
        compute the analytic time to the next collision, JUMP there exactly,
        apply exact elastic / wall updates, emit an ordered event timeline. The
        on-screen billiard REPLAYS this timeline, so what you see and HEAR is
        exactly what is proven (dual truth).

   Pure, DOM-free, zero-dependency. Inlined byte-faithfully into index.html via a
   forge-style include; also imported by core.test.mjs (the Node twin).
   ════════════════════════════════════════════════════════════════════════════ */

// Exact elastic block-block collision (1-D, masses M & m, velocities vH & vL).
// Returns [vH', vL']. Conserves momentum and KE exactly (to machine ε).
export function elasticBlockBlock(M, m, vH, vL) {
  return [
    ((M - m) * vH + 2 * m * vL) / (M + m),
    ((m - M) * vL + 2 * M * vH) / (M + m),
  ];
}

// ── (1) THE CLOSED FORM — the wedge-unfolding count, NOT a stepped loop ───────
// Unfold the two reflecting walls (the rigid wall + the elastic block) into a
// wedge of half-angle θ = atan√(m/M); the trajectory is a straight line bouncing
// inside the wedge, and the number of bounces before it escapes is ⌈π/θ⌉ − 1.
//
// CRITICAL BOUNDARY NOTE: ⌈·⌉−1, NOT ⌊·⌋. At the 1:1 boundary θ = π/4 exactly,
// so π/θ = 4 — ⌊4⌋ = 4 (WRONG: the true count is 3) but ⌈4⌉−1 = 3 (right). At
// 3:1, θ = atan√(1/3) = π/6, π/θ = 6 — ⌊6⌋ = 6 (WRONG) but ⌈6⌉−1 = 5 (right).
// The self-test pins this trap explicitly.
export function closedCount(M, m) {
  const theta = Math.atan(Math.sqrt(m / M));
  return Math.ceil(Math.PI / theta) - 1;
}

// The naive (WRONG-at-boundary) formula, exported ONLY so the self-test can prove
// it disagrees with the truth at the integer-π/θ ratios. Do not use it for real.
export function naiveFloorCount(M, m) {
  const theta = Math.atan(Math.sqrt(m / M));
  return Math.floor(Math.PI / theta);
}

// ── (2) VELOCITY-SPACE COUNT-ONLY GROUND TRUTH ───────────────────────────────
// No positions: just alternate "light hits wall" (vL flips sign) and "heavy
// catches light" (elastic exchange), starting from vH=1, vL=0, until separation.
// Separation = light not moving toward the wall (vL ≤ 0) AND heavy not faster
// than light (vH ≤ vL). This is the literal classic mechanics, counted.
export function velocityCount(M, m) {
  let vH = 1, vL = 0, n = 0;
  // hard cap is generous: count for 100^4 is 31415, far under the guard.
  for (let g = 0; g < 2e8; g++) {
    if (vL <= 0 && vH <= vL) break;             // separated forever
    if (vL > 0) { vL = -vL; n++; }              // light → wall (sign flip)
    else { [vH, vL] = elasticBlockBlock(M, m, vH, vL); n++; }  // heavy catches light
  }
  return n;
}

// ── (3) THE EVENT-DRIVEN ENGINE (real positions; drives the visuals) ─────────
// Geometry: lane on [0, LANE]; wall at x = LANE. Each block has a LEFT-face x and
// a width. Heavy's RIGHT face (xH+wH) meets light's LEFT face (xL) for block-block;
// light's RIGHT face (xL+wL) meets the wall (LANE) for a wall hit. We compute the
// analytic time to whichever happens first, glide exactly to it, resolve it, emit
// an event, and repeat. No time-stepping ⇒ no float drift; the count is exact.
//
// Returns { events, count, M, m, settledVH, settledVL } where events is an ordered
// array of { i, kind:'block'|'wall', t, tAbs, xH, xL, vH, vL } — t is the gap to
// the PREVIOUS event, tAbs the cumulative time, positions/velocities AFTER resolve.
export function simulate(M, m, opts = {}) {
  const LANE = opts.LANE ?? 1000;
  const wH = opts.wH ?? 60;          // heavy width (world units)
  const wL = opts.wL ?? 34;          // light width
  const xH0 = opts.xH ?? 250;        // heavy LEFT face
  const xL0 = opts.xL ?? 700;        // light LEFT face
  const vH0 = opts.vH ?? 1;          // shove velocity (heavy)
  const EPS = 1e-12;

  let xH = xH0, xL = xL0, vH = vH0, vL = 0;
  const events = [];
  let tAbs = 0, guard = 0;
  const GUARD_MAX = opts.guardMax ?? 6e7;

  function timeBlockBlock() {
    const gap = xL - (xH + wH);             // free space between the faces
    const closing = vH - vL;                 // >0 means they are approaching
    if (closing <= EPS) return null;
    const t = gap / closing;
    return t >= -1e-9 ? Math.max(0, t) : null;
  }
  function timeWallHit() {
    if (vL <= EPS) return null;              // light must move toward the wall
    const t = (LANE - (xL + wL)) / vL;
    return t >= -1e-9 ? Math.max(0, t) : null;
  }

  while (guard++ < GUARD_MAX) {
    const tB = timeBlockBlock();
    const tW = timeWallHit();
    let best = null;
    if (tB !== null) best = { t: tB, kind: 'block' };
    if (tW !== null && (best === null || tW < best.t)) best = { t: tW, kind: 'wall' };
    if (!best) break;                         // nothing closing → settled

    // glide exactly to the event
    xH += vH * best.t;
    xL += vL * best.t;
    tAbs += best.t;
    if (best.kind === 'block') {
      [vH, vL] = elasticBlockBlock(M, m, vH, vL);
    } else {
      vL = -vL;
    }
    events.push({
      i: events.length, kind: best.kind, t: best.t, tAbs,
      xH, xL, vH, vL,
    });

    // settled? light not heading to the wall AND heavy not catching light
    if (vL <= 1e-9 && vH <= vL + EPS) break;
  }

  return { events, count: events.length, M, m, settledVH: vH, settledVL: vL,
           geom: { LANE, wH, wL, xH: xH0, xL: xL0 } };
}

// Convenience: the event-driven engine's emitted count only (drives the proof).
export function eventCount(M, m, opts) {
  return simulate(M, m, opts).count;
}

// ── π-prefix helpers (for the prophecy + neg-control) ─────────────────────────
// The first N+1 digits of π as an integer: 3, 31, 314, 3141, 31415, …
export const PI_DIGITS = '3141592653589793';
export function piPrefix(n) {                 // n = number of leading digits
  return parseInt(PI_DIGITS.slice(0, n), 10);
}
// Is `count` exactly some leading-digits prefix of π? (used by the neg-control)
export function isPiPrefix(count) {
  const s = String(count);
  return s.length >= 1 && s === PI_DIGITS.slice(0, s.length);
}

// The four canonical π-power ratios and their counts, for UI + tests.
export const RATIOS = [1, 100, 10000, 1000000];
