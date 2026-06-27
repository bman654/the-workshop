// ============================================================================
//  THE SIGHTLINE — logic core (a figure you DRAW by the ORDER you walk).
//  The vantages wing's SECOND room — kin to The Vantage. Where The Vantage
//  resolves from a single earned POSE, The Sightline resolves from a PATH: the
//  ORDER in which slabs first peel out of a sealed mutual-occlusion stack as you
//  fly one 3-DOF vantage camera. Pure, dependency-free, DOM-free: the same math
//  the page renders and the twin proves.
//
//  THE CAMERA IS THE VANTAGE'S, UNFORKED. projectNorm()/backProject() below are
//  byte-faithful copies of vantage/core.mjs (FOCAL=2.4; a 2-rotation yaw/pitch +
//  dolly camera — NO roll). The twin re-imports vantage's own functions and
//  proves ours are numerically identical, so the camera is one shared law, not a
//  fork. The room ADDS exactly one layer on top: a per-frame painter's
//  depth-sort + point-in-quad occlusion, and the unveil-PERMUTATION σ it induces
//  along a flight.
//
//  THE ONE IDEA — FORWARD CONSTRUCTION (why σ is BUILT, not searched). ~12 opaque
//  gilt slabs hang at staggered depths. At the home pose START they stack into a
//  sealed mutual occlusion: exactly ONE slab is unoccluded and the figure does
//  not read. The slab centres SLAB_C were forward-constructed by BACK-PROJECTION
//  (the vantage's exact inverse) by an offline tuner (seed 1551), so that the
//  solution flight FLIGHT shears the stack and the slabs PEEL one at a time in a
//  fixed strict order σ = SIGMA. Each peel drops its star into a FIXED firmament
//  socket, extending one gold stroke; walk σ and the stroke draws "Argo, the
//  little ship" clean; uncover a slab out of turn and the stroke leaps to the
//  wrong star (a visible tangle) and the reveal resets.
//
//  THE PAINTER'S DRAW YOU SEE IS THE RULE THE LOGIC COMPUTES. exposedSet() is the
//  SOLE visibility authority: slab i is exposed iff no NEARER slab's projected
//  quad covers slab i's projected centre. The page paints far→near with this
//  exact set and judges the reveal from this exact set — visual == claim, no
//  cheat. (This core owns the geometry + the rule; the page's brass-leaf slab
//  rendering is forged art that paints exactly this set.)
//
//  SOURCING (anti-drift, encoded in core.test.mjs): the-sightline/index.html
//  inlines this file VIA forge between the SIGHTLINE CORE sentinels, so a stale
//  page trips `forge --check`; the twin ALSO byte-parity-checks the inlined block
//  against this module body. One oracle, no second copy.
// ============================================================================

// ===== SIGHTLINE CORE (byte-identical to core.mjs) =====
"use strict";

// ── reused vantage constant + projection (UNFORKED — byte-faithful copy of
//    vantage/core.mjs; the twin proves numerical identity against vantage's own). ──
const FOCAL = 2.4;            // perspective focal length (lorenz heritage)

// ── π : the FORWARD projection of a world point through a camera C into the
// normalised image plane → [u, v, depth]. Two rotations (yaw then pitch) + a
// perspective divide by (dolly + depth-along-view). No roll. ──
function projectNorm(p, C){
  const cy = Math.cos(C.yaw),   sy = Math.sin(C.yaw);
  const cp = Math.cos(C.pitch), sp = Math.sin(C.pitch);
  const nx = p[0], ny = p[1], nz = p[2];
  const rx = nx * cy - ny * sy;      // yaw about world-up
  const ry = nx * sy + ny * cy;
  const ty = ry * cp - nz * sp;      // pitch about the tilted right axis (the view-depth axis)
  const tz = ry * sp + nz * cp;      // screen-up
  const depth = C.dolly + ty;
  const f = FOCAL / Math.max(0.05, depth);
  return [rx * f, tz * f, depth];    // depth drives the painter's sort
}

// ── π⁻¹ : the exact INVERSE — given an image point (u,v) and a chosen world
// depth dᵢ (>0), produce the world point P that C projects exactly onto (u,v).
// This is the construction engine: every slab centre is a back-projection. ──
function backProject(u, v, depthVal, C){
  const cy = Math.cos(C.yaw),   sy = Math.sin(C.yaw);
  const cp = Math.cos(C.pitch), sp = Math.sin(C.pitch);
  const ty = depthVal - C.dolly;     // depth = dolly + ty
  const f = FOCAL / depthVal;
  const rx = u / f, tz = v / f;
  const ry = ty * cp + tz * sp;      // invert the pitch rotation
  const nz = -ty * sp + tz * cp;
  const nx = rx * cy + ry * sy;      // invert the yaw rotation
  const ny = -rx * sy + ry * cy;
  return [nx, ny, nz];
}

// ── the scene constants (forward-constructed by back-projection; baked from the
//    deterministic tuner, seed 1551). hw/hh are world half-extents. ──
const START  = Object.freeze({ yaw:-0.5, pitch:0.14, dolly:5.0 });          // the sealed-stack home pose
const FLIGHT = Object.freeze({ yaw0:-0.5, yaw1:1.1, pitch:0.14, dolly:5.0 });// the solving path C(t)
const SIGMA  = Object.freeze([0,1,11,6,8,2,3,7,4,9,10,5]);                   // the proven unveil permutation σ
const SLAB_C = [
 [0.43133,-0.88745,0.17229],[0.23715,-0.55260,0.05169],[0.08363,-0.16684,0.10973],
 [-0.00797,0.21373,-0.07511],[-0.22900,0.53952,-0.16084],[-0.50559,0.84350,-0.19336],
 [-0.56994,1.28812,-0.07208],[-0.94559,1.53359,-0.13192],[-1.09758,1.87225,-0.37238],
 [-1.16509,2.31534,-0.24988],[-1.33337,2.64314,-0.50254],[-1.58118,2.98162,-0.41810]];
const HW = 0.42, HH = 0.40;          // slab world half-width / half-height
const NSLAB = 12;
const MIN_GAP_FLOOR = 0.03;          // explicit scheduling margin: peels must be ≥ this apart in t
const slabs = SLAB_C.map(c => ({ c, hw:HW, hh:HH }));

// slab i carries the star that should ignite at the rank where SIGMA[rank] === i.
const starOfSlab = new Array(NSLAB);
SIGMA.forEach((slab, rank) => { starOfSlab[slab] = rank; });

// ── THE FIGURE — a 12-star constellation, "Argo, the little ship": a connect-the-
//    dots single stroke at FIXED firmament sockets. Ignite the stars in stroke
//    order 0..11 and the line draws the ship clean; ignite out of order and the
//    stroke crosses into a tangle. coords in firmament space x∈[-1,1], y∈[-1,1]
//    (y up). (Bare socket coords; the page's engraved-chart rendering is forged art.) ──
const FIGURE = [
 [ 0.00, 0.95],  // 0  masthead
 [ 0.16, 0.34],  // 1  mainsail mid
 [ 0.54, 0.02],  // 2  mainsail clew
 [ 0.06,-0.02],  // 3  gooseneck (mast foot) — closes the sail triangle
 [ 0.70,-0.22],  // 4  stern rail
 [ 0.50,-0.56],  // 5  stern waterline
 [-0.50,-0.56],  // 6  bow waterline
 [-0.70,-0.22],  // 7  bow rail
 [-0.30,-0.04],  // 8  fore-deck
 [-0.46, 0.40],  // 9  jib clew
 [-0.08, 0.66],  // 10 forestay
 [ 0.20, 1.00],  // 11 burgee (pennant tip at the masthead)
];

// ── visibility: project a slab → screen quad; painter occlusion of its centre ──
function projSlab(s, C){
  const p = projectNorm(s.c, C);
  const q = [];
  for (const [sx, sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const w = [s.c[0] + sx * s.hw, s.c[1] + sy * s.hh, s.c[2]];
    const pp = projectNorm(w, C); q.push([pp[0], pp[1]]);
  }
  return { u:p[0], v:p[1], depth:p[2], quad:q };
}
function pointInQuad(px, py, quad){
  let sign = 0;
  for (let i = 0; i < 4; i++){
    const a = quad[i], b = quad[(i + 1) % 4];
    const cross = (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
    const s = Math.sign(cross);
    if (s !== 0){ if (sign === 0) sign = s; else if (s !== sign) return false; }
  }
  return true;
}
// exposed_i: no NEARER slab covers slab i's centre (the painter's depth-sort).
// THE SOLE visibility authority — the page paints AND judges from this set.
function exposedSet(slabList, C){
  const ps = slabList.map(s => projSlab(s, C));
  const ex = new Array(slabList.length).fill(true);
  for (let i = 0; i < slabList.length; i++)
    for (let j = 0; j < slabList.length; j++){
      if (i === j) continue;
      if (ps[j].depth < ps[i].depth - 1e-9 && pointInQuad(ps[i].u, ps[i].v, ps[j].quad)){ ex[i] = false; break; }
    }
  return { ex, ps };
}

// ── the flight C(t): yaw sweeps yaw0→yaw1, pitch + dolly fixed. `ease` applies a
//    smoothstep reparametrization (same geometric path, different SPEED). ──
function poseAt(t, F, ease){
  const tt = ease ? (t * t * (3 - 2 * t)) : t;
  return { yaw: F.yaw0 + (F.yaw1 - F.yaw0) * tt, pitch: F.pitch, dolly: F.dolly };
}
// ── revealOrder: walk the flight in `steps` and record each slab's first-
//    unoccluded time t. Returns firstT[], the induced order σ, and the set lit at
//    t=0 (pre). The order is a fact of the PATH's geometry. ──
function revealOrder(slabList, F, steps = 600, ease = false){
  const firstT = new Array(slabList.length).fill(Infinity);
  let prev = exposedSet(slabList, poseAt(0, F, ease)).ex;
  const pre = [];
  for (let i = 0; i < slabList.length; i++) if (prev[i]){ pre.push(i); firstT[i] = 0; }
  for (let k = 1; k <= steps; k++){
    const ex = exposedSet(slabList, poseAt(k / steps, F, ease)).ex;
    for (let i = 0; i < slabList.length; i++) if (ex[i] && !prev[i] && firstT[i] === Infinity) firstT[i] = k / steps;
    prev = ex;
  }
  const order = slabList.map((_, i) => i).sort((a, b) => firstT[a] - firstT[b]);
  return { firstT, order, pre };
}
// ── deterministic RNG (mulberry32) — used only by the self-test's ε-tube and
//    shuffled-flight neg-controls; the scene itself is fully baked. ──
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ============================ THE SELF-TEST ================================ */
// Every check is a fact about the PATH + the painter's-order law above. The
// page renders the SAME exposedSet() it tests, so a green pill == a true render.
function runSelfTest(){
  const checks = [];
  const ck = (mk, pass, info) => checks.push({ pass, info, mk });

  // (1) SOLUTION FLIGHT ⇒ σ === the target figure's star-order. SIGMA is built so
  //     walking it ignites stars in stroke order 0..11 — the ship draws clean.
  const sol = revealOrder(slabs, FLIGHT, 700);
  const sig = sol.order.join(',');
  ck('σ', sig === SIGMA.join(','),
     'solution flight unveils σ = [' + sig + '] === the target figure star-order');

  // (2) STRICTLY INCREASING first-unoccluded times, with an explicit scheduling
  //     margin (min gap ≥ MIN_GAP_FLOOR); exactly ONE slab lit at the start
  //     (the sealed stack) — and it is SIGMA[0], the first peel.
  const ts = sol.order.map(i => sol.firstT[i]);
  let strict = true, minGap = Infinity;
  for (let i = 1; i < ts.length; i++){ const g = ts[i] - ts[i - 1]; if (g <= 0) strict = false; minGap = Math.min(minGap, g); }
  const allReveal = sol.firstT.every(t => t !== Infinity);
  const oneAtStart = sol.pre.length === 1 && sol.pre[0] === SIGMA[0];
  ck('↑t', strict && allReveal && oneAtStart && minGap >= MIN_GAP_FLOOR,
     'all 12 peel at strictly INCREASING t (min gap ' + minGap.toFixed(3) + ' ≥ ' + MIN_GAP_FLOOR + '); exactly 1 lit at start, = slab ' + SIGMA[0]);

  // (3) ∿ — σ UNCHANGED under an ease-in/out reparametrization. The order is the
  //     GEOMETRY of the walk, not its speed: the headline claim of a PATH room.
  const eased = revealOrder(slabs, FLIGHT, 700, true);
  ck('∿', eased.order.join(',') === sig,
     'σ unchanged under an ease-in/out reparametrization (order = the geometry of the walk, not its speed)');

  // (4) ±ε — σ holds across an ε-tube of nearby flights (robust, not a knife-edge).
  let stable = 0; const RT = 200, eps = 0.02;
  for (let k = 0; k < RT; k++){
    const r1 = mulberry32(k * 17 + 1), r2 = mulberry32(k * 17 + 2), r3 = mulberry32(k * 17 + 3), r4 = mulberry32(k * 17 + 4);
    const Fp = { yaw0: FLIGHT.yaw0 + (r1() - 0.5) * 2 * eps, yaw1: FLIGHT.yaw1 + (r2() - 0.5) * 2 * eps,
                 pitch: FLIGHT.pitch + (r3() - 0.5) * eps, dolly: FLIGHT.dolly + (r4() - 0.5) * 3 * eps };
    const r = revealOrder(slabs, Fp, 260);
    if (r.firstT.every(t => t !== Infinity) && r.order.join(',') === sig) stable++;
  }
  ck('±ε', stable === RT, 'σ holds for all ' + stable + '/' + RT + ' flights in an ε=' + eps + ' tube (robust, not a knife-edge)');

  // (5) ¬a NEG-CONTROL — DEPTH-COLLAPSE FOIL. Project every slab to a single plane
  //     (co-planar) and no slab can ever swap occluder along the flight ⇒ ZERO
  //     ordered reveals ⇒ the figure can NEVER fill. Depth is what makes σ exist.
  const flat = slabs.map(s => { const cc = projectNorm(s.c, START); return { c: backProject(cc[0], cc[1], 5.0, START), hw:s.hw, hh:s.hh }; });
  const rf = revealOrder(flat, FLIGHT, 400);
  const newReveals = rf.order.filter(i => rf.firstT[i] > 0 && rf.firstT[i] !== Infinity).length;
  ck('¬a', newReveals === 0,
     'NEG-CTRL a (depth-collapse): co-planar slabs never swap occluder ⇒ ' + newReveals + ' ordered reveals ⇒ the figure cannot fill');

  // (6) ¬b NEG-CONTROL — SHUFFLED FLIGHT. Over a dense bath of random flights,
  //     ~none reproduce σ: structure + the RIGHT walk spell the figure, not luck.
  let match = 0; const TR = 3000, rnd = mulberry32(31337);
  for (let k = 0; k < TR; k++){
    const Fr = { yaw0: (rnd() - 0.5) * 3.2, yaw1: (rnd() - 0.5) * 3.2, pitch: (rnd() - 0.5) * 0.9, dolly: 4.0 + rnd() * 2.2 };
    const r = revealOrder(slabs, Fr, 200);
    if (r.firstT.every(t => t !== Infinity) && r.order.join(',') === sig) match++;
  }
  ck('¬b', match / TR < 0.01,
     'NEG-CTRL b (shuffled-flight): only ' + match + '/' + TR + ' random flights reproduce σ (' + (100 * match / TR).toFixed(2) + '%) — structure + the right walk, not luck');

  return { checks, ok: checks.every(c => c.pass), sigma: sig, minGap };
}

// ===== END SIGHTLINE CORE =====

export {
  FOCAL, START, FLIGHT, SIGMA, SLAB_C, HW, HH, NSLAB, MIN_GAP_FLOOR, slabs, starOfSlab, FIGURE,
  projectNorm, backProject, projSlab, pointInQuad, exposedSet,
  poseAt, revealOrder, mulberry32, runSelfTest,
};
