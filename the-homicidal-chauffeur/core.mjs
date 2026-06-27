// The Homicidal Chauffeur — kinematic core (the single authority both the played game
// and the proof step). Isaacs' 1965 pursuit game: a fast car (the pursuer) that can only
// turn at a bounded rate chases a slow pedestrian (the evader) that can pivot on a dime.
//
// THE WHOLE POINT: the car is TWICE as fast (vp=2·ve) — a straight-line flee is run down,
// every time. The pedestrian's ONLY tool is the car's turning CONSTRAINT: a car moving at
// speed vp with a minimum turn radius R cannot bend its path tighter than curvature 1/R.
// Stand your ground, let it commit, then sidestep ACROSS its nose — it must swing out in a
// wide arc of radius R to come back, and that wide overshoot is the gap you escape through.
// It is not your speed that saves you (you have none to spare); it is exploiting its geometry.
//
// WHY THE PROOF BOLTS ON: the car's shortest path between two posed (point, heading) states
// under that exact turn limit is the closed-form DUBINS path (six words: LSL RSR LSR RSL RLR
// LRL). We compute it in closed form AND integrate the same constant-curvature arcs forward;
// the two agree to machine epsilon, an independent Newton-shooting oracle agrees, and the
// length collapses to the straight-line distance as R→0. Then: a scripted radial flee is
// CAUGHT in bounded time, an optimal jink SURVIVES at the real R, and the SAME jink is caught
// when R→0 — proving the turning constraint, not the speed gap, is the lever you pull.
//
// CONVENTION CONTRACT: state s = {x, y, h} (heading h in radians). Signed curvature κ = ±1/R;
// a Left arc is κ=+1/R, a Right arc κ=−1/R, Straight is κ=0. R appears in EXACTLY two places —
// the Dubins word κ=±1/R and the pursuer's clamp |dh| ≤ ds/R — so R is the single lever; turn
// it to 0 and the car becomes an ideal point-pursuer that always wins. The capture predicate is
// center-to-center separation ≤ ell (no nose-offset ring — the proven margins are measured this
// way; a maw drawn at radius ell IS this predicate made visible).
//
// SOURCING (anti-drift): the region between the CHAUFFEUR-CORE sentinels below is inlined
// byte-faithfully into the-homicidal-chauffeur/index.html (so the game you drag is provably the
// same code as the proof) and re-anchored by core.test.mjs's byte-parity check. runSelfTest() is
// the SOLE in-page oracle — the green pill and the Node twin both call exactly it.

// === CHAUFFEUR-CORE BEGIN ===
// DOM-free, zero-dependency, file://-safe. The whole kinematic authority lives between these
// sentinels and is inlined verbatim into the page; nothing below the END sentinel may be needed
// to RUN the pursuit (exports/glue live outside).
const TAU = Math.PI * 2;
const mod = a => ((a % TAU) + TAU) % TAU;
const angWrap = a => { a = mod(a); return a > Math.PI ? a - TAU : a; };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// THE LOCAL LAW — advance a state by arc-length ds at signed curvature κ, EXACTLY (not Euler):
// an arc of constant curvature is integrable in closed form. At κ≈0 it is a straight segment.
// This single function is the sole integrator: the Dubins words, the pursuer, and the played
// car all move by calling it, so the page and the proof can never diverge in their kinematics.
function advance(s, kappa, ds) {
  if (Math.abs(kappa) < 1e-12) return { x: s.x + ds * Math.cos(s.h), y: s.y + ds * Math.sin(s.h), h: s.h };
  const h2 = s.h + kappa * ds;
  return { x: s.x + (Math.sin(h2) - Math.sin(s.h)) / kappa, y: s.y - (Math.cos(h2) - Math.cos(s.h)) / kappa, h: mod(h2) };
}

// Follow a Dubins word: a list of [type, length-in-radii] segments. L/R bend at ±1/R over an
// arc of ds = len·R; S runs straight for ds = len·R. Returns the end state and total arc length.
function follow(start, segs, R) {
  let s = { ...start }, len = 0;
  for (const [ty, ln] of segs) { const k = ty === 'L' ? 1 / R : ty === 'R' ? -1 / R : 0; const ds = ln * R; s = advance(s, k, ds); len += ds; }
  return { end: s, len };
}

// THE SIX DUBINS WORDS in closed form (LSL RSR LSR RSL · RLR LRL), each valid-by-construction:
// solved in the normalized frame (translate to start, rotate so the goal bearing is 0, scale by
// R) where the algebra is the textbook CSC/CCC formulae. Each returned word lands on the goal by
// construction; dubins() filters to feasible (non-negative segment lengths) and takes the min.
function dubinsWords(start, goal, R) {
  const dx = goal.x - start.x, dy = goal.y - start.y, d = Math.hypot(dx, dy) / R, th = Math.atan2(dy, dx);
  const a = mod(start.h - th), b = mod(goal.h - th), sa = Math.sin(a), ca = Math.cos(a), sb = Math.sin(b), cb = Math.cos(b), cab = Math.cos(a - b), W = [];
  { const p2 = 2 + d * d - 2 * cab + 2 * d * (sa - sb); if (p2 >= 0) { const p = Math.sqrt(p2), x = Math.atan2(cb - ca, d + sa - sb); W.push({ type: 'LSL', segs: [['L', mod(x - a)], ['S', p], ['L', mod(b - x)]] }); } }
  { const p2 = 2 + d * d - 2 * cab - 2 * d * (sa - sb); if (p2 >= 0) { const p = Math.sqrt(p2), x = Math.atan2(ca - cb, d - sa + sb); W.push({ type: 'RSR', segs: [['R', mod(a - x)], ['S', p], ['R', mod(x - b)]] }); } }
  { const p2 = -2 + d * d + 2 * cab + 2 * d * (sa + sb); if (p2 >= 0) { const p = Math.sqrt(p2), x = Math.atan2(-ca - cb, d + sa + sb) - Math.atan2(-2, p); W.push({ type: 'LSR', segs: [['L', mod(x - a)], ['S', p], ['R', mod(x - b)]] }); } }
  { const p2 = -2 + d * d + 2 * cab - 2 * d * (sa + sb); if (p2 >= 0) { const p = Math.sqrt(p2), x = Math.atan2(ca + cb, d - sa - sb) - Math.atan2(2, p); W.push({ type: 'RSL', segs: [['R', mod(a - x)], ['S', p], ['L', mod(b - x)]] }); } }
  { const x = (6 - d * d + 2 * cab + 2 * d * (sa - sb)) / 8; if (Math.abs(x) <= 1) { const p = mod(TAU - Math.acos(x)), t = mod(a - Math.atan2(ca - cb, d - sa + sb) + p / 2); W.push({ type: 'RLR', segs: [['R', t], ['L', p], ['R', mod(a - b - t + p)]] }); } }
  { const x = (6 - d * d + 2 * cab + 2 * d * (sb - sa)) / 8; if (Math.abs(x) <= 1) { const p = mod(TAU - Math.acos(x)), t = mod(-a + Math.atan2(-ca + cb, d + sa - sb) + p / 2); W.push({ type: 'LRL', segs: [['L', t], ['R', p], ['L', mod(b - a - t + p)]] }); } }
  return W;
}

// The shortest feasible Dubins path: among the words, keep those that integrate ONTO the goal
// (closing the loop is the validity test, not just non-negative lengths) and return the minimum.
function dubins(start, goal, R, tol = 1e-7) {
  let best = null;
  for (const w of dubinsWords(start, goal, R)) {
    if (w.segs.some(([, ln]) => ln < -1e-9)) continue;
    const { end, len } = follow(start, w.segs, R);
    if (Math.hypot(end.x - goal.x, end.y - goal.y) < tol * Math.max(1, R) && Math.abs(angWrap(end.h - goal.h)) < tol && (!best || len < best.len)) best = { ...w, len };
  }
  return best;
}

// THE PURSUER — curvature-clamped pure pursuit. It always wants to face the evader (bearing to
// the target), but over arc-length ds it may turn its heading by AT MOST ds/R (|κ| ≤ 1/R). That
// clamp is the entire homicidal-chauffeur constraint: omniscient aim, bounded turn. As R→0 the
// clamp opens fully (dh = err) and it pivots instantly — a perfect point-pursuer.
function pursuerStep(p, e, R, ds) {
  const err = angWrap(Math.atan2(e.y - p.y, e.x - p.x) - p.h);
  const dh = clamp(err, -ds / R, ds / R);
  return advance(p, dh / ds, ds);
}

// SCRIPTED EVADER POLICIES (the proof's actors). flee: run radially away at full speed ve.
const flee = (e, p, ve) => { const a = Math.atan2(e.y - p.y, e.x - p.x); return { x: ve * Math.cos(a), y: ve * Math.sin(a) }; };
// makeJink: the OPTIMAL pedestrian. Hold a radial flee until the car has committed (close and
// nearly nose-on), then cut 90° ACROSS the car's nose to the side it is already turning — forcing
// the maximal-radius overshoot. Stateful (it commits once): a factory returns the policy closure.
function makeJink() {
  const st = { committed: false, side: 1 };
  return (e, p, sc) => {
    const dx = e.x - p.x, dy = e.y - p.y, dist = Math.hypot(dx, dy), los = Math.atan2(dy, dx);
    if (!st.committed && dist < sc.commitDist && Math.abs(angWrap(los - p.h)) < sc.commitAng) { st.committed = true; st.side = (angWrap(los - p.h) >= 0 ? 1 : -1); }
    if (st.committed) { const dir = los + st.side * Math.PI / 2; return { x: sc.ve * Math.cos(dir), y: sc.ve * Math.sin(dir) }; }
    return flee(e, p, sc.ve);
  };
}

// THE ONE SHARED STEPPER — one fixed-dt substep of the whole pursuit, in the verified order:
//   (1) pursuerStep reads the CURRENT evader and arcs forward by ds = vp·dt under the |κ|≤1/R clamp;
//   (2) the evader advances by evaderVel·dt — evaderVel may be a plain {x,y} (the played game: a
//       velocity toward the cursor, independent of the car) OR a policy fn (e, newP, sc)→{x,y}
//       (the scripted proof: flee/jink, which read the car's JUST-MOVED position);
//   (3) the capture predicate: center-to-center separation ≤ ell.
// BOTH the played RAF loop and the scripted sim() call THIS — that is what makes them one core.
function stepPair(p, e, evaderVel, sc) {
  const ds = sc.vp * sc.dt;
  const np = pursuerStep(p, e, sc.R, ds);
  const v = (typeof evaderVel === 'function') ? evaderVel(e, np, sc) : evaderVel;
  const vmag = Math.hypot(v.x, v.y);
  const ne = { x: e.x + v.x * sc.dt, y: e.y + v.y * sc.dt, h: vmag > 1e-9 ? Math.atan2(v.y, v.x) : e.h };
  const sep = Math.hypot(np.x - ne.x, np.y - ne.y);
  return { p: np, e: ne, sep, captured: sep <= sc.ell };
}

// THE SCRIPTED SIM — run a posed scenario to time T at fixed dt, looping the shared stepPair with
// the scenario's evader policy. Reports capture (+ time) and the closest approach minSep. The
// capture/minSep are read on the pre-step separation, matching the verified harness exactly.
function sim(sc) {
  let p = { ...sc.p0 }, e = { ...sc.e0 }, t = 0, minSep = Infinity, cap = false, capT = null;
  const ev = sc.evader();
  while (t < sc.T) {
    const sep = Math.hypot(p.x - e.x, p.y - e.y); minSep = Math.min(minSep, sep);
    if (sep <= sc.ell) { cap = true; capT = t; break; }
    const r = stepPair(p, e, ev, sc);
    p = r.p; e = r.e; t += sc.dt;
  }
  return { cap, capT, minSep };
}

// THE LOCKED SCRIPTED CONSTANTS (the proof's calibrated scenario — distinct from the played
// game's per-round tuning, which lives in the page over this same core). vp=2·ve, base R=5.0,
// ell=0.18, dt=0.002. The played game passes its OWN per-round {R, ell, …} into stepPair.
const SCRIPTED = { p0: { x: 0, y: 0, h: 0 }, vp: 2.0, ve: 1.0, R: 5.0, ell: 0.18, dt: 0.002, T: 40, commitDist: 3.0, commitAng: 0.8 };

// THE SOLE ORACLE. Four headline claims (the fast subset the in-page pill paints; the Node twin
// runs the same plus heavy sweeps). Each check is {name, pass, info}; returns {checks, passed,
// total, ok}. Designed to finish well under ~100ms.
function runSelfTest() {
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const rng = (() => { let s = 2024; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();

  // [1] the analytic Dubins length === the forward-integrated arc length AND lands on the goal,
  //     to machine epsilon, over a spread of posed start/goal/R configs.
  {
    let worst = 0, n = 0, hit = true;
    for (let i = 0; i < 120; i++) {
      const A = { x: rng() * 4 - 2, y: rng() * 4 - 2, h: rng() * TAU }, B = { x: rng() * 4 - 2, y: rng() * 4 - 2, h: rng() * TAU }, R = 0.3 + rng() * 1.5;
      const b = dubins(A, B, R); if (!b) { hit = false; continue; }
      const { end, len } = follow(A, b.segs, R);
      worst = Math.max(worst, Math.hypot(end.x - B.x, end.y - B.y), Math.abs(angWrap(end.h - B.h)), Math.abs(len - b.len)); n++;
    }
    log('1 · closed-form Dubins length === integrated arc length, lands on goal (machine-eps)', hit && worst < 1e-9, n + ' configs · worst |Δ| = ' + worst.toExponential(1));
  }

  // [2] a scripted RADIAL FLEE is caught in bounded time when the car is faster (vp/ve>1). The
  //     analytic bound is the car's worst-case turn-around (π·R/vp) plus the closing time.
  {
    const sc = { ...SCRIPTED, e0: { x: 3, y: 0, h: 0 }, evader: () => (e, p, s) => flee(e, p, s.ve) };
    const r = sim(sc);
    const bound = Math.PI * sc.R / sc.vp + (3 + sc.ell) / (sc.vp - sc.ve);
    log('2 · scripted radial flee is run down in bounded time (vp/ve>1)', r.cap && r.capT < bound, 'capT = ' + r.capT.toFixed(2) + ' < bound ' + bound.toFixed(2));
  }

  // [3] the OPTIMAL JINK survives the full horizon at the real R — closest approach stays
  //     comfortably outside the capture disk (the constraint exploited correctly buys escape).
  {
    const sc = { ...SCRIPTED, e0: { x: 4, y: 0, h: 0 }, evader: makeJink };
    const r = sim(sc);
    log('3 · the optimal jink SURVIVES ≥T at the real R (minSep > ell)', !r.cap && r.minSep > 1.4 * SCRIPTED.ell, 'minSep = ' + r.minSep.toFixed(3) + ' = ' + (r.minSep / SCRIPTED.ell).toFixed(2) + '× ell');
  }

  // [4] NEG-CONTROL — R→0 is the lever. (a) the Dubins length collapses monotonically to the
  //     straight-line distance D; (b) the SAME jink that survived is now CAUGHT. Turning, not
  //     speed, was the pedestrian's only tool.
  {
    const A = { x: 0, y: 0, h: 2.0 }, B = { x: 3, y: 1, h: -1.3 }, D = Math.hypot(3, 1);
    const L = [1, 0.1, 0.01, 0.001, 0.0001].map(R => dubins(A, B, R).len);
    const collapses = L.every((l, i) => i === 0 || l <= L[i - 1] + 1e-9) && Math.abs(L[4] - D) < 1e-3;
    const tiny = sim({ ...SCRIPTED, e0: { x: 4, y: 0, h: 0 }, R: 1e-3, evader: makeJink });
    log('4 · NEG-CONTROL R→0: Dubins length → straight-line D AND the same jink is now CAUGHT', collapses && tiny.cap && tiny.capT < SCRIPTED.T * 0.4, '|L−D| = ' + Math.abs(L[4] - D).toExponential(1) + ' · jink caught at t = ' + tiny.capT.toFixed(2));
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === CHAUFFEUR-CORE END ===

export { advance, follow, dubinsWords, dubins, pursuerStep, flee, makeJink, stepPair, sim, SCRIPTED, runSelfTest, angWrap, mod, clamp, TAU };
