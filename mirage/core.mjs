// The Mirage — pure continuum-eikonal core. The SOLE math authority.
// Zero-dependency ESM, NO DOM. The page (index.html) and the Node twin (core.test.mjs)
// both inline the slice between the MIRAGE CORE sentinels BYTE-FOR-BYTE, so the painting,
// the in-page self-test, and the Node twin can never disagree about the physics.
//
// THE STORY: on a baking desert highway the air just above the asphalt is hot and THIN —
// its refractive index DIPS near the ground. A nearly-horizontal ray grazing toward the
// road bends UP before it ever touches the tar and arrives at your eye from BELOW the true
// horizon: you see a patch of "wet" sky pooled on the road — false water that was never
// there — and the distant car smears into an inverted twin hanging beneath it. This file
// proves that the wet road IS the gradient: kill the gradient and the puddle is gone.
//
// THE PARAM SHAPE (the contract every facet obeys):
//   p = { profile, dndyScale, n0, H, eyeY, theta0, step }
//     profile   : 'inferior' (hot-below, the puddle/flip) | 'superior' (warm-above, looming)
//     dndyScale : strength of the near-ground index dip (HEAT drives this); 0 ⇒ uniform air
//     n0        : base index of the bulk air (≈1.0003 scaled; the model uses n0≈1 + a bit)
//     H         : scale height of the hot layer (m) — how fast the dip decays with altitude
//     eyeY      : the observer's eye height above the road (m)
//     theta0    : launch angle BELOW horizontal (rad), the depression the eye looks down
//     step      : arc-length step for the RK4 marcher (m)
//   A test-only LINEAR fixture profile 'linear' with {a,b} gives n(y)=a·y+b for B's oracle.
//
// COORDINATES: x = distance down the road (m), y = height above the road (m). The air is
// horizontally stratified (n depends on y only). A ray is parameterized by arc length s;
// theta(s) is the angle of travel measured BELOW the horizontal (so a ray heading toward the
// road and slightly down has theta>0). The Bouguer / stratified-Snell invariant is
//   xi = n(y) * cos(theta)                                   [conserved along every ray]
// (n·cos(theta) because theta is from the HORIZONTAL; cos(theta)=sin(angle-from-vertical)).
// A turning point is where the ray goes momentarily horizontal, cos(theta)=1, i.e. n(y*)=xi.
//
// ===== MIRAGE CORE (byte-identical to core.mjs) =====
const NEAR1 = 1.0;   // index floor reference (air ≈ 1); the model works in (n-1)-scaled units inflated for visibility.

// nOf(y,p): refractive index at height y. The hot layer near the road (small y) has a LOWER
// index; it decays with altitude over scale height H. 'superior' flips the sign (cold dense
// layer near the ground, warm light air above ⇒ index INCREASES upward more steeply).
function nOf(y, p){
  if (p.profile === 'linear') return p.a * y + p.b;        // test-only ground-truth fixture
  const sign = (p.profile === 'superior') ? -1 : 1;        // inferior dips near ground; superior humps
  return p.n0 - sign * p.dndyScale * Math.exp(-y / p.H);
}

// gradOf(y,p): dn/dy, the ANALYTIC derivative of nOf (never a finite difference).
//   inferior: n = n0 - s·e^{-y/H}  ⇒  dn/dy = (s/H)·e^{-y/H}  (index RISES with height: ray bends up)
function gradOf(y, p){
  if (p.profile === 'linear') return p.a;
  const sign = (p.profile === 'superior') ? -1 : 1;
  return sign * (p.dndyScale / p.H) * Math.exp(-y / p.H);
}

// nMinRoad(p): the index AT the road (y=0) — the extreme of the layer. For the inferior
// profile this is the MINIMUM index (n0 - dndyScale); a grazing ray turns when xi reaches it.
function nMinRoad(p){ return nOf(0, p); }

// invariant(y,theta,p): xi = n(y)·cos(theta). Conserved along a ray to integration error.
function invariant(y, theta, p){ return nOf(y, p) * Math.cos(theta); }

// rayDeriv(state,p): the eikonal ray ODE in arc length s. With theta measured below the
// horizontal and the medium stratified in y, the ray-equation reduces to
//   dx/ds = cos(theta),  dy/ds = -sin(theta),   dtheta/ds = -(1/n)·(dn/dy)·cos(theta)
// (dy/ds = -sin(theta): theta>0 means descending toward the road. The bending term turns the
// ray toward HIGHER index, exactly Snell in the continuum.) Returns [dx,dy,dtheta].
function rayDeriv(st, p){
  const ct = Math.cos(st.theta), s_t = Math.sin(st.theta);
  const n = nOf(st.y, p), g = gradOf(st.y, p);
  return { dx: ct, dy: -s_t, dtheta: -(g / n) * ct };
}

// marchRay(theta0,p): RK4 integrate the ray launched from the eye (x=0, y=eyeY) looking DOWN
// at depression theta0. Returns { pts:[{x,y,theta,s,xi}], turned:bool, yStar, xStar }.
// NUMERICAL CARE-POINT: at a turning point the ray goes horizontal (theta→0 from below, i.e.
// dy/ds→0) and a fixed-step RK4 can step THROUGH it. We DETECT the turn as the sign change of
// dy/ds (sin(theta) crossing 0 / theta crossing 0) and BISECT in s to land the turning state
// exactly on n(y)=xi, then reflect and continue. The marcher also caps step count so a
// degenerate input can never spin forever.
function marchRay(theta0, p){
  const step = (p.step && p.step > 0) ? p.step : 0.5;
  const MAXSTEP = 200000;
  let st = { x: 0, y: p.eyeY, theta: theta0, s: 0 };
  const xi0 = invariant(st.y, st.theta, p);
  const pts = [{ x: st.x, y: st.y, theta: st.theta, s: 0, xi: xi0 }];
  let turned = false, yStar = null, xStar = null;
  // integrate while above the road and below a sky ceiling, capped.
  for (let i = 0; i < MAXSTEP; i++){
    const prev = st;
    const next = rk4(st, step, p);
    // turning-point event: sin(theta) (= -dy/ds) changed sign across the step → ray went horizontal.
    if (!turned && Math.sin(prev.theta) > 0 && Math.sin(next.theta) <= 0){
      const tp = bisectTurn(prev, step, p);     // refine the s where theta=0
      turned = true; yStar = tp.y; xStar = tp.x;
      pts.push({ x: tp.x, y: tp.y, theta: 0, s: tp.s, xi: invariant(tp.y, 0, p) });
      st = tp;                                  // continue the ascending leg from the exact turn
      continue;
    }
    st = next;
    pts.push({ x: st.x, y: st.y, theta: st.theta, s: st.s, xi: invariant(st.y, st.theta, p) });
    // stop conditions: ray hit the road (y<=0 going down) or climbed past a generous ceiling.
    if (st.y <= 0 && Math.sin(st.theta) > 0) break;        // descended into the tar (no mirage)
    if (st.y > p.eyeY + 50 * Math.max(1, p.H)) break;      // escaped to sky
    if (turned && st.y >= p.eyeY) break;                   // climbed back to eye level (image arrives)
  }
  return { pts, turned, yStar, xStar, xi0 };
}

// rk4(st,h,p): one classical Runge–Kutta-4 step of the ray ODE in arc length.
function rk4(st, h, p){
  const k1 = rayDeriv(st, p);
  const s2 = { x: st.x + 0.5 * h * k1.dx, y: st.y + 0.5 * h * k1.dy, theta: st.theta + 0.5 * h * k1.dtheta };
  const k2 = rayDeriv(s2, p);
  const s3 = { x: st.x + 0.5 * h * k2.dx, y: st.y + 0.5 * h * k2.dy, theta: st.theta + 0.5 * h * k2.dtheta };
  const k3 = rayDeriv(s3, p);
  const s4 = { x: st.x + h * k3.dx, y: st.y + h * k3.dy, theta: st.theta + h * k3.dtheta };
  const k4 = rayDeriv(s4, p);
  return {
    x: st.x + (h / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
    y: st.y + (h / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
    theta: st.theta + (h / 6) * (k1.dtheta + 2 * k2.dtheta + 2 * k3.dtheta + k4.dtheta),
    s: st.s + h,
  };
}

// bisectTurn(prev,h,p): given the step that straddled theta=0, bisect the sub-step in s to
// land the state where sin(theta)=0 to machine precision (the turning point). RK4 from prev
// by a fraction of h; root-find that fraction on sin(theta(f)).
function bisectTurn(prev, h, p){
  let lo = 0, hi = h;
  const thetaAt = (f) => rk4(prev, f, p).theta;
  // sin(theta) is monotone-ish through the crossing; bisect on theta itself (crosses 0).
  let mid = 0.5 * h;
  for (let i = 0; i < 80; i++){
    mid = 0.5 * (lo + hi);
    const th = thetaAt(mid);
    if (th > 0) lo = mid; else hi = mid;       // theta descends through 0
    if (hi - lo < 1e-12) break;
  }
  const r = rk4(prev, mid, p);
  r.theta = 0;                                  // pin it exactly horizontal at the turn
  return r;
}

// turningPoint(theta0,p): the height y* where a ray launched at depression theta0 goes
// horizontal — solved INDEPENDENTLY of the marcher by bisection on n(y) = xi over the descent
// leg (xi = n(eyeY)·cos(theta0)). Returns {yStar, found}. found=false when the ray reaches the
// road before turning (xi < n_min(road)) or the medium is uniform (no solution).
function turningPoint(theta0, p){
  const xi = invariant(p.eyeY, theta0, p);
  // We need n(y*) = xi with 0 <= y* <= eyeY (the ray turns BELOW the eye on its way down).
  // For the inferior profile n increases with y, so n(y)=xi has a root iff n(0) <= xi <= n(eyeY).
  const nRoad = nOf(0, p), nEye = nOf(p.eyeY, p);
  // The turn exists only if xi lies between the road index and the eye index AND the ray
  // actually descends into the region where n drops to xi. Bracket [0, eyeY] on f(y)=n(y)-xi.
  const f = (y) => nOf(y, p) - xi;
  const fRoad = f(0), fEye = f(p.eyeY);
  if (fRoad === 0) return { yStar: 0, found: true };
  if (fRoad * fEye > 0) return { yStar: null, found: false };   // no sign change ⇒ no turn in [0,eyeY]
  let lo = 0, hi = p.eyeY, flo = fRoad;
  for (let i = 0; i < 200; i++){
    const mid = 0.5 * (lo + hi);
    const fm = f(mid);
    if (fm === 0){ lo = hi = mid; break; }
    if ((fm < 0) === (flo < 0)){ lo = mid; flo = fm; } else { hi = mid; }
    if (hi - lo < 1e-14) break;
  }
  return { yStar: 0.5 * (lo + hi), found: true };
}

// criticalAngle(p): the depression theta_c at which a ray launched from the eye JUST grazes
// the road — n(eyeY)·cos(theta_c) = n_min(road). Rays with theta0 < theta_c (shallower, more
// horizontal) turn ABOVE the road (mirage); steeper rays reach the tar. Returns radians, or
// null if even a horizontal ray (theta0=0) cannot turn (no inferior gradient).
function criticalAngle(p){
  const nEye = nOf(p.eyeY, p), nRoad = nMinRoad(p);
  const c = nRoad / nEye;                        // cos(theta_c)
  if (!(c >= -1 && c <= 1)) return null;
  if (c >= 1) return 0;                          // only a perfectly horizontal ray grazes (no dip)
  return Math.acos(c);
}

// classifyProfile(p): 'inferior' | 'superior' | 'none' from the SIGN of dn/dy ALONE — never
// from the rendered image. Inferior (hot-below) has dn/dy>0 near the ground (index rises with
// height ⇒ rays bend UP ⇒ inverted puddle). Superior has dn/dy<0 (rays bend DOWN ⇒ looming).
function classifyProfile(p){
  const g = gradOf(0.1 * Math.max(1, p.H), p);   // sample just above the road
  if (Math.abs(g) < 1e-12) return 'none';
  return g > 0 ? 'inferior' : 'superior';
}

// puddleHorizon(p): the apparent distance to the FALSE-WATER edge the page prints — the
// nearest ground distance at which the eye's downward rays start turning instead of hitting
// the road. Geometrically it is the horizontal range x at which a ray launched at the
// CRITICAL depression turns: rays shallower than theta_c form the mirror; the steepest
// mirage-forming ray (theta = theta_c) marks the NEAR edge of the false water. Returns the
// ground distance (m) to that edge, or null when no turn exists (uniform air / superior with
// no inferior dip ⇒ no puddle). This number IS the certified turning-condition quantity.
function puddleHorizon(p){
  const thetaC = criticalAngle(p);
  if (thetaC == null || thetaC <= 0) return null;       // no inferior dip ⇒ no false water
  if (p.profile === 'superior') return null;            // looming, not a puddle
  // March the just-grazing ray; its turning x is the near edge of the pooled sky.
  const r = marchRay(thetaC * 0.999, p);                // a hair inside the critical cone so it turns
  if (!r.turned || r.xStar == null) return null;
  return r.xStar;
}

// witness(): the canonical desert-road params the page + the test both boot to. A 1.6 m eye
// looking just below horizontal down a road whose surface air is hot (index dips by ~6e-3 in
// the scaled model so the bending is visible), scale height ~2 m.
function witness(){
  return { profile: 'inferior', dndyScale: 6e-3, n0: 1.0, H: 2.0, eyeY: 1.6, theta0: 0.004, step: 0.25 };
}

// runSelfTest(): prove the claims numerically. Returns {ok,passed,total,checks}, each check
// {name,pass,info}. The page's pill and the Node twin both call THIS.
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // A battery of inferior desert profiles (varied dip, scale height, eye height, depression).
  const fan = [
    witness(),
    { profile: 'inferior', dndyScale: 4e-3, n0: 1.0, H: 1.5, eyeY: 1.2, theta0: 0.003, step: 0.25 },
    { profile: 'inferior', dndyScale: 9e-3, n0: 1.0, H: 3.0, eyeY: 2.0, theta0: 0.005, step: 0.2 },
    { profile: 'inferior', dndyScale: 7e-3, n0: 1.0, H: 2.5, eyeY: 1.8, theta0: 0.0035, step: 0.25 },
  ];

  // (1) EIKONAL INVARIANT CONSERVED — along every marched ray, max relative drift of
  // xi=n(y)·cos(theta) below 1e-6. This is Snell in the continuum limit: the integrator's
  // honesty certificate, proven not asserted.
  {
    let worst = 0;
    for (const p of fan){
      // launch a hair inside the critical cone so the ray turns (a true grazing mirage ray).
      const tc = criticalAngle(p);
      const r = marchRay((tc != null ? tc * 0.998 : p.theta0), p);
      for (const q of r.pts){
        worst = Math.max(worst, Math.abs(q.xi - r.xi0) / Math.abs(r.xi0));
      }
    }
    ck('1 · eikonal invariant: max |ξ(s)−ξ(0)|/ξ(0) < 1e-6 along every ray (continuum Snell)',
       worst < 1e-6, 'maxDrift=' + worst.toExponential(2));
  }

  // (2) TURNING POINT AT EXACT HEIGHT — the marched turn height matches the INDEPENDENT
  // bisection solution of n(y*)=n0·cos(theta0) to <1e-6, and the ray is horizontal there.
  {
    let worst = 0, horizontalOk = true, allTurned = true;
    for (const p of fan){
      const tc = criticalAngle(p);
      const th = (tc != null ? tc * 0.998 : p.theta0);
      const r = marchRay(th, p);
      const ind = turningPoint(th, p);
      if (!r.turned || !ind.found){ allTurned = false; continue; }
      worst = Math.max(worst, Math.abs(r.yStar - ind.yStar));
      // at the marched turn the invariant equals n(yStar) (cos0=1) — i.e. it went horizontal.
      if (Math.abs(invariant(p.eyeY, th, p) - nOf(r.yStar, p)) > 1e-6) horizontalOk = false;
    }
    ck('2 · turning point: marched y* === independent bisection of n(y*)=n₀cosθ₀ (<1e-6), horizontal there',
       allTurned && worst < 1e-6 && horizontalOk,
       'maxΔy*=' + worst.toExponential(2) + ' turned=' + allTurned + ' horiz=' + horizontalOk);
  }

  // (3) [B-GRAFT] CRITICAL GRAZING ANGLE — a threshold theta_c with n(eyeY)·cos(theta_c)=
  // n_min(road): rays SHALLOWER than theta_c (more horizontal) turn (y* found); rays STEEPER
  // reach the road (no turn before ground). A clean physical pos/neg pair beyond the sign test.
  {
    let pairOk = true;
    for (const p of fan){
      const tc = criticalAngle(p);
      if (tc == null){ pairOk = false; continue; }
      const shallow = turningPoint(tc * 0.95, p);     // more horizontal than critical ⇒ turns
      const steep   = turningPoint(tc * 1.10, p);     // steeper than critical ⇒ hits the road
      if (!(shallow.found === true && steep.found === false)) pairOk = false;
    }
    ck('3 · critical grazing angle θc: shallower-than-θc rays turn, steeper-than-θc reach the road',
       pairOk, 'pair(±θc)=' + pairOk);
  }

  // (4) PUDDLE EDGE = TURNING CONDITION — the false-water distance the page prints equals an
  // INDEPENDENT closed-form from the same turning condition to <1e-6. One number, two uses.
  // Independent oracle: the just-grazing ray (theta=theta_c) turns at y*≈0 (n(0)=xi), and its
  // horizontal range to the turn, computed by a fine re-march at half the step, must agree.
  {
    let worst = 0, allNum = true;
    for (const p of fan){
      const edge = puddleHorizon(p);
      const tc = criticalAngle(p);
      if (edge == null || tc == null){ allNum = false; continue; }
      const fine = marchRay(tc * 0.999, Object.assign({}, p, { step: p.step * 0.5 }));
      if (!fine.turned || fine.xStar == null){ allNum = false; continue; }
      worst = Math.max(worst, Math.abs(edge - fine.xStar) / Math.max(1, Math.abs(edge)));
    }
    ck('4 · puddle edge = turning condition: page distance === independent re-march (<1e-6 rel)',
       allNum && worst < 1e-6, 'maxRel=' + worst.toExponential(2) + ' allNum=' + allNum);
  }

  // (5) NEG-CONTROL (no gradient) — dndyScale=0 ⇒ uniform air ⇒ every ray dead straight,
  // turningPoint found:false for ALL launch angles, classifyProfile='none', puddleHorizon null.
  // Tested on a NON-symmetric fan so it isn't passing by accident.
  {
    const flat = { profile: 'inferior', dndyScale: 0, n0: 1.0, H: 2.0, eyeY: 1.6, theta0: 0.004, step: 0.25 };
    let maxCurv = 0, anyTurn = false;
    for (const th of [0.0007, 0.0019, 0.004, 0.0073, 0.011]){    // non-symmetric angles
      const r = marchRay(th, flat);
      for (const q of r.pts) maxCurv = Math.max(maxCurv, Math.abs(q.theta - th));   // theta never changes
      if (turningPoint(th, flat).found) anyTurn = true;
    }
    const cls = classifyProfile(flat), pud = puddleHorizon(flat);
    ck('5 · neg-control (dndyScale=0): rays straight (Δθ=0), no turns, classify="none", puddle=null',
       maxCurv < 1e-12 && !anyTurn && cls === 'none' && pud === null,
       'maxΔθ=' + maxCurv.toExponential(2) + ' anyTurn=' + anyTurn + ' cls=' + cls + ' puddle=' + pud);
  }

  // (6) SIGN CLASSIFIER (the two-mirage pair) — an inferior profile turns the grazing ray UP
  // (yStar above the road, the ray climbs back), a superior profile bends it DOWN; classify
  // distinguishes them from dn/dy SIGN alone across a battery, matching the rendered direction.
  {
    let ok = true;
    for (const base of fan){
      const inf = Object.assign({}, base, { profile: 'inferior' });
      const sup = Object.assign({}, base, { profile: 'superior' });
      if (classifyProfile(inf) !== 'inferior') ok = false;
      if (classifyProfile(sup) !== 'superior') ok = false;
      // inferior: dn/dy>0 near ground (ray bends up); superior: dn/dy<0 (bends down).
      if (!(gradOf(0.1, inf) > 0 && gradOf(0.1, sup) < 0)) ok = false;
    }
    ck('6 · sign classifier: inferior (dn/dy>0, bends up) vs superior (dn/dy<0, bends down) from sign alone',
       ok, 'pairs=' + ok);
  }

  // (7) [B-GRAFT] INDEPENDENT CLOSED-FORM ORACLE — at a LINEAR profile n(y)=a·y+b (a special
  // case the exponential profile never boots), the turning height has a HAND-derivable closed
  // form: n0·cosθ0 = a·y*+b ⇒ y* = (n(eyeY)·cosθ0 − b)/a. The marcher's turn height must match
  // this analytic y* to <1e-7. A ground-truth the marcher cannot cheat.
  {
    let worst = 0, allTurned = true;
    const lin = [
      { profile: 'linear', a: 2e-3, b: 1.0, eyeY: 1.6, theta0: 0.05, step: 0.1 },
      { profile: 'linear', a: 3e-3, b: 1.0, eyeY: 2.0, theta0: 0.06, step: 0.1 },
      { profile: 'linear', a: 1.5e-3, b: 1.0, eyeY: 1.2, theta0: 0.04, step: 0.1 },
    ];
    for (const p of lin){
      const xi = invariant(p.eyeY, p.theta0, p);          // n(eyeY)·cos(theta0)
      const yAnalytic = (xi - p.b) / p.a;                 // closed form: n(y*)=xi ⇒ y*=(xi−b)/a
      const r = marchRay(p.theta0, p);
      if (!r.turned || r.yStar == null){ allTurned = false; continue; }
      worst = Math.max(worst, Math.abs(r.yStar - yAnalytic));
    }
    ck('7 · closed-form oracle (linear n=a·y+b): marched y* === (n₀cosθ₀−b)/a (<1e-7)',
       allTurned && worst < 1e-7, 'maxΔ=' + worst.toExponential(2) + ' turned=' + allTurned);
  }

  // (8) DOMAIN GUARDS — degenerate inputs keep the printed numbers FINITE (no NaN/Inf reaches
  // the canvas) and the marcher caps its step count.
  {
    const odd = [
      { profile: 'inferior', dndyScale: 6e-3, n0: 1.0, H: 2.0, eyeY: 0, theta0: 0.004, step: 0.25 },     // eye at the road
      { profile: 'inferior', dndyScale: 6e-3, n0: 1.0, H: 2.0, eyeY: 1.6, theta0: 0, step: 0.25 },       // horizontal launch
      { profile: 'inferior', dndyScale: 6e-3, n0: 1.0, H: 2.0, eyeY: 1.6, theta0: Math.PI / 2, step: 0.25 }, // straight down
      { profile: 'inferior', dndyScale: 6e-3, n0: 1.0, H: 0.05, eyeY: 1.6, theta0: 0.004, step: 0.25 },  // razor-thin layer
    ];
    let finite = true, capped = true;
    for (const p of odd){
      const r = marchRay(p.theta0, p);
      if (r.pts.length >= 200000) capped = false;          // must terminate well under the cap
      for (const q of r.pts){
        if (!Number.isFinite(q.x) || !Number.isFinite(q.y) || !Number.isFinite(q.theta)) finite = false;
      }
      const ph = puddleHorizon(p);
      if (!(ph === null || Number.isFinite(ph))) finite = false;
      const tp = turningPoint(p.theta0, p);
      if (!(tp.yStar === null || Number.isFinite(tp.yStar))) finite = false;
    }
    ck('8 · domain guards: degenerate inputs stay FINITE (no NaN/Inf to canvas); marcher caps steps',
       finite && capped, 'finite=' + finite + ' capped=' + capped);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END MIRAGE CORE =====

export {
  nOf, gradOf, nMinRoad, invariant, rayDeriv, marchRay, rk4, bisectTurn,
  turningPoint, criticalAngle, classifyProfile, puddleHorizon, witness, runSelfTest,
};
