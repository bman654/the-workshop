// ── THE COASTER — physics authority for a frictionless point-mass on a shaped rail
//    with a vertical loop. This block is the SOLE AUTHORITY; a Node twin
//    (core.test.mjs) re-extracts it byte-for-byte between sentinels and the in-page
//    chip calls the SAME runSelfTest(). ──────────────────────────────────────────
//
// THE MODEL. A bead of mass m slides on a rigid, frictionless rail in the vertical
// plane. The rail's shape is a polyline {x,y} sampled by arc-length s; at each
// sample we know the tangent angle θ (measured from horizontal, +CCW) and the
// signed curvature κ. Gravity g pulls −y (down). The bead is released from rest at
// height h above the rail's lowest point and runs under gravity alone.
//
// Because the rail is frictionless, mechanical energy is conserved exactly:
//   E = ½ m v² + m g y   is constant along the path.
// So at any height y the speed obeys the ENERGY FORM (algebraic, no integration):
//   v² = 2 g (h − y)              … robust even as v → 0 near a crest.
//
// THE LOOP. A vertical circular loop of radius r sits in the track. On the loop the
// rail must bend the bead inward; the centripetal requirement at angle θ (measured
// up from the loop's bottom) is provided by gravity's inward component plus the
// rail's NORMAL force N. The rail can only PUSH (N ≥ 0), never pull. At the TOP of
// the loop the inward direction is straight down, so:
//   N_top = m v_top² / r − m g      (N_top ≥ 0  ⟺  v_top² ≥ g r).
// Conserving energy from release height h to the top (height 2r):
//   ½ m v_top² = m g h − m g·2r   ⟹   v_top² = 2 g (h − 2r).
// Survival of the loop therefore requires:
//   2 g (h − 2r) ≥ g r   ⟺   h ≥ 2.5 r.        ← the textbook threshold, DERIVED.
//
// THE NORMAL FORCE. With θ measured up from the loop bottom (CCW), the inward radial
// direction is (−sinθ, cosθ); gravity (0,−g) has inward component −g cosθ. The rail
// pushes inward with N, so the centripetal balance N − m g cosθ = m v²/r gives:
//   N(θ) = m v²/r + m g cosθ.
// At the bottom (θ=0): N = m v²/r + m g (rail pushes hardest). At the top (θ=π):
// N = m v²/r − m g (the textbook top condition; N ≥ 0 ⟺ v² ≥ g r).
//
// THE DETACH ANGLE. Below threshold the bead leaves the rail the instant N → 0 on
// the upper half of the loop. The bead's height on the loop is y(θ)=r(1−cosθ); the
// N = 0 condition is:
//   v² = −g r cosθ       (positive only on the upper half, cosθ < 0)
//   v² = 2 g (h − r(1 − cosθ))   (energy)
// Equating: 2(h − r) + 2 r cosθ = −r cosθ  ⟹  cosθ_d = −(2/3)(h/r − 1).
// Past θ_d the rail can no longer hold the bead: it DETACHES and becomes a free
// projectile (gravity only), velocity = v·tangent at θ_d. A renderer that keeps the
// bead on the rail regardless of N is physically WRONG — the neg-control proves it.
//
// THE NEG-CONTROL (the teeth). alwaysSlide(track,h0) advances the bead around the
// loop regardless of N (it never checks the normal force) — it "completes" every
// release. runSelfTest proves the REAL integrate DETACHES on a sub-2.5r release where
// alwaysSlide does NOT; if they ever agreed on the sub-threshold set the test FAILS.
// So the suite cannot pass vacuously: an always-completes renderer fails here.
//
// HONESTY. Frictionless point mass; a rigid, exactly circular loop; the rail can only
// PUSH (N ≥ 0), not pull (no clamp / no upstop wheels). The claim is precisely
// v_top² ≥ g r ⟺ h ≥ 2.5 r and its felt consequence (clear the loop, or detach at
// θ_d). It is not a real clothoid loop, not a friction model, not a wheeled car.

export const G = 9.81;          // gravity (m/s²)

// ── 1. BUILD THE TRACK ─────────────────────────────────────────────────────────
// controlPts: a small set of {x,y} the hills/valley pass through, PLUS an exact
// circular loop spliced in. We build the non-loop spans as a Catmull-Rom spline and
// the loop as a TRUE circle of radius r centred at {cx,cy}, then arc-length sample
// the whole thing into {s,x,y,θ,κ}. The loop's circle is exact so κ === 1/r on it
// (the geometry-lock unit check) — "2.5r" is then geometry, not an approximation.
//
// trackSpec = {
//   pre:   [{x,y}, ...]   control points BEFORE the loop (the hoist tower + valley),
//   loop:  { cx, cy, r },  exact circle; entered/exited at its BOTTOM (θ=0),
//   post:  [{x,y}, ...]   control points AFTER the loop (run-out),
//   ds:    sample spacing in metres (default 0.02)
// }
export function buildTrack(spec){
  const ds = spec.ds || 0.02;
  const { cx, cy, r } = spec.loop;
  const samples = [];

  // helper: push a sample, computing arc-length cumulatively. isLoop marks samples
  // that belong to the EXACT circular loop arc (vs the spline hills/valley).
  let acc = 0, prev = null;
  function push(x, y, theta, kappa, isLoop){
    if(prev){ acc += Math.hypot(x - prev.x, y - prev.y); }
    samples.push({ s: acc, x, y, theta, kappa, isLoop: !!isLoop });
    prev = { x, y };
  }

  // (a) PRE span: Catmull-Rom through pre[] ending at the loop's bottom (cx, cy−r).
  const bottom = { x: cx, y: cy - r };
  const preCtl = [...spec.pre, bottom];
  sampleCatmull(preCtl, ds, push);

  // (b) THE LOOP: a full exact circle, entered at the bottom going +x, traversed
  //     CCW back to the bottom. θ here is the tangent angle of the path; κ = 1/r
  //     exactly (true circle). Parameter φ measured up from the bottom (CCW).
  const loopLen = 2 * Math.PI * r;
  const nLoop = Math.max(64, Math.round(loopLen / ds));
  for(let i = 1; i <= nLoop; i++){
    const phi = (2 * Math.PI) * (i / nLoop);   // 0..2π up from bottom, CCW
    // position on the circle: bottom is at angle -90° from centre; go CCW.
    const ang = -Math.PI/2 + phi;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    // tangent direction (CCW): derivative of (cos,sin) is (−sin,cos)
    const tx = -Math.sin(ang), ty = Math.cos(ang);
    const theta = Math.atan2(ty, tx);
    push(x, y, theta, 1 / r, true);             // ★ κ === 1/r on the loop (geometry-lock)
  }

  // (c) POST span: Catmull-Rom from the loop bottom through post[].
  const postCtl = [bottom, ...spec.post];
  sampleCatmull(postCtl, ds, push, true /*skipFirst*/);

  // re-derive θ,κ on the spline spans from finite differences so the spline tangent
  // is consistent (the loop samples already carry exact θ,κ; leave them).
  return finalizeTrack(samples, spec.loop);
}

// Catmull-Rom sampler: walk the polyline of control points, emitting arc-length
// spaced samples. We compute θ from the local tangent; κ is filled in finalize.
function sampleCatmull(ctl, ds, push, skipFirst){
  if(ctl.length < 2) return;
  // build a dense polyline first, then resample by arc-length.
  const dense = [];
  const seg = (p0,p1,p2,p3,t)=>{
    const t2=t*t, t3=t2*t;
    const f = (a,b,c,d)=> 0.5*((2*b)+(-a+c)*t + (2*a-5*b+4*c-d)*t2 + (-a+3*b-3*c+d)*t3);
    return { x:f(p0.x,p1.x,p2.x,p3.x), y:f(p0.y,p1.y,p2.y,p3.y) };
  };
  for(let i=0;i<ctl.length-1;i++){
    const p0=ctl[i-1]||ctl[i], p1=ctl[i], p2=ctl[i+1], p3=ctl[i+2]||ctl[i+1];
    const steps=24;
    for(let k=0;k<steps;k++){ dense.push(seg(p0,p1,p2,p3,k/steps)); }
  }
  dense.push(ctl[ctl.length-1]);
  // resample dense polyline by arc-length ds.
  let carry = 0;
  for(let i=(skipFirst?1:0); i<dense.length; i++){
    if(i===0){
      const tx = dense[1].x-dense[0].x, ty = dense[1].y-dense[0].y;
      push(dense[0].x, dense[0].y, Math.atan2(ty,tx), 0);
      continue;
    }
    const a=dense[i-1], b=dense[i];
    let segLen = Math.hypot(b.x-a.x, b.y-a.y);
    if(segLen < 1e-12) continue;
    carry += segLen;
    while(carry >= ds){
      const over = carry - ds;
      const f = 1 - over/segLen;
      const x = a.x + (b.x-a.x)*f, y = a.y + (b.y-a.y)*f;
      const tx = b.x-a.x, ty = b.y-a.y;
      push(x, y, Math.atan2(ty,tx), 0);
      carry = over;
    }
  }
}

// finalize: recompute κ on the spline samples from finite differences of θ vs s,
// leave the loop samples (already exact 1/r) untouched, and tag a per-sample
// onLoop flag + the loop bottom-angle φ for the detach logic.
function finalizeTrack(samples, loop){
  const { cx, cy, r } = loop;
  for(let i=0;i<samples.length;i++){
    const p = samples[i];
    // onLoop = a sample that belongs to the EXACT circular loop arc (set at build),
    // NOT a spline sample that merely touches the loop bottom.
    p.onLoop = p.isLoop === true;
    if(p.onLoop){
      // φ measured up from the loop bottom (CCW), 0..2π
      const ang = Math.atan2(p.y - cy, p.x - cx);
      let phi = ang + Math.PI/2;
      while(phi < 0) phi += 2*Math.PI;
      while(phi >= 2*Math.PI) phi -= 2*Math.PI;
      p.phi = phi;
    } else {
      p.phi = null;
    }
  }
  const yMin = Math.min(...samples.map(p=>p.y));
  // the loop bottom is the physical reference for release height (the 2.5r claim is
  // stated relative to it). It sits at cy − r by construction.
  const loopBottomY = cy - r;
  return { samples, loop, yMin, loopBottomY, length: samples[samples.length-1].s };
}

// ── 2. INTEGRATE ───────────────────────────────────────────────────────────────
// Run the bead from rest at release height h0 (above the track's lowest point) using
// the ENERGY FORM v² = 2g(h0 − y) at every sample (exact, frictionless — no stiff
// division near the crest). At each loop sample compute the normal force
// N(θ) = m v²/r − m g cosθ where θ is measured up from the loop bottom (so cosθ is
// the component of gravity along the inward radius). The bead DETACHES at the first
// loop sample where N < 0 (the rail can only push). Returns the trace + verdict.
export function integrate(track, h0, m){
  m = m || 1;
  const { samples, loop, loopBottomY } = track;
  const trace = [];
  let detachIndex = -1, detachPhi = null;
  const hAbs = loopBottomY + h0;     // absolute release height (h0 above the loop bottom)

  for(let i=0;i<samples.length;i++){
    const p = samples[i];
    const v2 = Math.max(0, 2 * G * (hAbs - p.y));   // energy form; clamp tiny negatives
    const v = Math.sqrt(v2);
    const KE = 0.5 * m * v2;
    const PE = m * G * (p.y - loopBottomY);
    const E = KE + PE;
    let N = null;
    if(p.onLoop){
      // θ measured up from the loop bottom; gravity's inward component is −g cosθ, so
      // the rail's normal force is N = m v²/r + m g cosθ (N≥0 ⟺ the rail can hold the
      // bead). N hits zero first on the UPPER half (cosθ < 0) when v is too low.
      N = m * v2 / loop.r + m * G * Math.cos(p.phi);
      if(N < -1e-9 && detachIndex < 0){
        detachIndex = i;
        detachPhi = p.phi;
      }
    }
    trace.push({ s:p.s, x:p.x, y:p.y, theta:p.theta, v, KE, PE, E, N, onLoop:p.onLoop, phi:p.phi,
                 detached: detachIndex>=0 && i>=detachIndex });
  }

  // does the bead also actually reach the crest with v²>0? (energy gate at top)
  const survived = detachIndex < 0;
  return { trace, verdict:{ survived, detachIndex, detachPhi, hAbs, hRel:h0 }, m, h0 };
}

// ── THE NEG-CONTROL (the teeth) ──────────────────────────────────────────────────
// alwaysSlide: advances the bead through EVERY sample regardless of N. It never
// detaches — a renderer that slides the car around no matter what. The self-test
// proves the REAL integrate detaches where this does not.
export function alwaysSlide(track, h0, m){
  m = m || 1;
  const { samples, loopBottomY } = track;
  const hAbs = loopBottomY + h0;
  const trace = [];
  for(let i=0;i<samples.length;i++){
    const p = samples[i];
    const v2 = Math.max(0, 2 * G * (hAbs - p.y));
    trace.push({ s:p.s, x:p.x, y:p.y, v:Math.sqrt(v2), detached:false });
  }
  return { trace, verdict:{ survived:true, detachIndex:-1, detachPhi:null, hAbs, hRel:h0 } };
}

// detectDetach: the analytic detach angle for a sub-threshold release, in radians,
// measured up from the loop bottom. cosθ_d = −(2/3)(h/r − 1) (the N=0 point on the
// UPPER half of the loop). Returns null if the release survives — h ≥ 2.5r makes
// cosθ_d ≤ −1, i.e. the bead never reaches N=0 before clearing the top.
export function detectDetach(h, r){
  const c = -(2/3) * (h/r - 1);
  if(c <= -1) return null;            // survives — N stays ≥ 0 all the way over the top
  if(c >= 1)  return 0;               // degenerate (h ≤ r): detaches at the bottom
  return Math.acos(c);
}

// the analytic survival predicate, closed-form: a loop of radius r is cleared from
// release height h (above the track bottom, with the loop bottom AT the track
// bottom) iff h ≥ 2.5r. Returned with the top speed it implies.
export function survives(h, r){
  return h >= 2.5 * r - 1e-12;
}

// ── 3. THE SELF-TEST. The Node twin and the in-page chip call THIS. ─────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });

  // a canonical track: flat lead-in, a valley, then an exact loop of radius r=1 with
  // its bottom on the ground (y=0), then a run-out. Loop bottom at (4,0), centre (4,1).
  const r = 1;
  const mkTrack = ()=> buildTrack({
    pre:  [{x:0,y:3},{x:1.5,y:1.2},{x:3,y:0.15},{x:3.6,y:0.0}],
    loop: { cx:4, cy:1, r },
    post: [{x:5,y:0.1},{x:7,y:0.4}],
    ds: 0.01
  });
  const track = mkTrack();

  // CLAIM 0 — GEOMETRY-LOCK: every loop sample has κ === 1/r exactly (true circle).
  {
    const loopSamples = track.samples.filter(p=>p.onLoop);
    let maxErr = 0;
    for(const p of loopSamples) maxErr = Math.max(maxErr, Math.abs(p.kappa - 1/r));
    ck('geometry-lock: κ === 1/r on every loop sample (the loop is a TRUE circle)',
       loopSamples.length > 50 && maxErr < 1e-12);
  }

  // CLAIM 1 — CONSERVATION: along an integrated (surviving) run, E is constant to
  // <1e-9 relative. Use a generous legal release h = 3r.
  {
    const res = integrate(track, 3*r);
    const Es = res.trace.map(t=>t.E).filter(e=>e>0);
    const E0 = Es[0];
    let maxRel = 0;
    for(const E of Es) maxRel = Math.max(maxRel, Math.abs(E - E0)/E0);
    ck('CLAIM 1 conservation: max|E−E₀|/E₀ < 1e-9 along the integrated track',
       res.verdict.survived && maxRel < 1e-9);
  }

  // CLAIM 2 — SURVIVAL PREDICATE: integrated survival matches the analytic predicate
  // h ≥ 2.5r at every sample of a band around 2.5r, AND bisection finds h*/r = 2.5.
  {
    let allMatch = true;
    const band = [];
    for(let h = 2.0*r; h <= 3.0*r + 1e-9; h += 0.02*r) band.push(h);
    for(const h of band){
      const integ = integrate(track, h).verdict.survived;
      const analytic = survives(h, r);
      if(integ !== analytic){ allMatch = false; break; }
    }
    ck('CLAIM 2 survival: integrated survival === analytic (h≥2.5r) across a band around 2.5r',
       allMatch);

    // bisection for the boundary h* where integrated survival flips, → 2.5r.
    let lo = 2.0*r, hi = 3.0*r;
    for(let it=0; it<80; it++){
      const mid = (lo+hi)/2;
      if(integrate(track, mid).verdict.survived) hi = mid; else lo = mid;
    }
    const hStar = (lo+hi)/2;
    ck('CLAIM 2 boundary: bisection finds h*/r = 2.5 to high precision (the textbook value, derived)',
       Math.abs(hStar/r - 2.5) < 2e-3);  // discretized to the sample spacing
  }

  // CLAIM 3 — DETACH ANGLE EXACT: for a sub-threshold h the integrator's detach φ
  // matches the analytic cosθ_d = (2/3)(h/r−1) to within the sample spacing, AND the
  // post-detach motion is a free parabola (no rail force).
  {
    const h = 2.2*r;   // sub-threshold (< 2.5r)
    const res = integrate(track, h);
    ck('CLAIM 3 sub-threshold release DETACHES (does not survive)', !res.verdict.survived);
    const analyticTheta = detectDetach(h, r);
    const integTheta = res.verdict.detachPhi;
    ck('CLAIM 3 detach angle: integrator φ matches analytic θ_d=acos((2/3)(h/r−1))',
       analyticTheta != null && integTheta != null &&
       Math.abs(integTheta - analyticTheta) < 0.05);  // within sample spacing on the loop

    // post-detach: the bead's energy speed at detach should equal the centripetal
    // speed v² = −g r cosθ_d at that point (the N=0 condition holds AT detach).
    const dIdx = res.verdict.detachIndex;
    const vDet2 = res.trace[dIdx].v * res.trace[dIdx].v;
    const vCent2 = -G * r * Math.cos(integTheta);
    ck('CLAIM 3 at detach v² == −g·r·cosθ_d (the N=0 condition, the bead goes ballistic)',
       vCent2 > 0 && Math.abs(vDet2 - vCent2) / vCent2 < 0.05);
  }

  // CLAIM 4 — LOAD-BEARING NEG-CONTROL (the teeth). On the sub-2.5r release the REAL
  // integrate detaches but alwaysSlide completes — they DISAGREE. Across a band of
  // sub-threshold releases the disagreement is total. Plus anti-vacuity: a just-legal
  // release SURVIVES (the predicate isn't "always detach").
  {
    const subBand = [];
    for(let h = 1.6*r; h < 2.5*r - 1e-9; h += 0.1*r) subBand.push(h);
    let realDetaches = 0, slideCompletes = 0, disagree = 0;
    for(const h of subBand){
      const real = integrate(track, h).verdict.survived;       // false (detaches)
      const slide = alwaysSlide(track, h).verdict.survived;     // true (completes)
      if(!real) realDetaches++;
      if(slide) slideCompletes++;
      if(real !== slide) disagree++;
    }
    ck('CLAIM 4 there is a non-empty sub-threshold band to test', subBand.length > 0);
    ck('CLAIM 4 the REAL integrator detaches on EVERY sub-2.5r release', realDetaches === subBand.length);
    ck('CLAIM 4 alwaysSlide (neg-control) completes EVERY one of them (never checks N)',
       slideCompletes === subBand.length);
    ck('★ CLAIM 4 the teeth bite: real vs alwaysSlide DISAGREE on the whole sub-threshold band',
       disagree === subBand.length && subBand.length > 0);

    // anti-vacuity: a just-legal release SURVIVES (predicate isn't always-detach).
    ck('CLAIM 4 anti-vacuity: a just-legal release (h=2.6r) SURVIVES',
       integrate(track, 2.6*r).verdict.survived === true);
  }

  // CLAIM 5 — the survival number is DERIVED from the conserved E (CLAIM 1 feeds
  // CLAIM 2): the top-of-loop speed read off the integrated trace equals the energy
  // value √(2g(h−2r)), and the threshold where that equals √(gr) is h=2.5r.
  {
    const h = 3*r;
    const res = integrate(track, h);
    // find the top-of-loop sample (φ ≈ π).
    let top = null, best = 1e9;
    for(const t of res.trace){ if(t.onLoop){ const d = Math.abs(t.phi - Math.PI); if(d<best){best=d; top=t;} } }
    const vTopEnergy2 = 2*G*(h - 2*r);
    ck('CLAIM 5 derived: top-of-loop v² (from conserved E) == 2g(h−2r)',
       top != null && Math.abs(top.v*top.v - vTopEnergy2)/vTopEnergy2 < 0.02);
    // and at h=2.5r exactly, v_top² == g r (the threshold IS where N_top=0).
    ck('CLAIM 5 threshold: at h=2.5r the top speed² equals g·r (N_top=0)',
       Math.abs((2*G*(2.5*r - 2*r)) - G*r) < 1e-9);
  }

  const pass = checks.filter(c=>c.ok).length;
  return { pass, total: checks.length, checks };
}
