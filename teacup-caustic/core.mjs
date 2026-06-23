// ============================================================================
//  The Teacup Caustic — the bright heart on your coffee                  (CORE)
//  Pure, dependency-free, DOM-free. Identical code is inlined into index.html
//  between the TEACUP CORE sentinels; this file is the Node-testable twin (the
//  falsifiability harness in core.test.mjs runs against it, and re-extracts the
//  inlined copy to prove byte-parity).
//
//  THE THING you see: a top-down porcelain cup of dark coffee. A point lamp
//  somewhere on (or inside) the rim throws light at the round inner wall; every
//  ray reflects by the law of reflection, and where the reflected rays pile up
//  a bright curve floats on the coffee. That curve is a real CATACAUSTIC — the
//  ENVELOPE of the reflected-ray family. The chords (rays) are never the curve;
//  they are TANGENT to it, and the curve EMERGES where neighbours cross.
//
//  THE GEOMETRY (the unified spine). Work in cup-radius units: the wall is the
//  unit circle W(t)=(cos t, sin t); a point lamp sits at S=(R,0) with R≥1 (R=1
//  ON the rim, R→∞ a distant SUN). Reflect the incident ray S→W(t) about the
//  inward normal n=−W(t). Worked out by hand, the reflected DIRECTION collapses
//  to a clean closed form
//     d(t,R) = ( R·cos2t − cos t,  R·sin2t − sin t ),
//  with derivative d'(t,R) = ( −2R·sin2t + sin t,  2R·cos2t − cos t ). Writing
//  each reflected ray as the line through W(t) with direction d, the envelope
//  point E(t,R) solves the 2×2 line-family system X·(d.y,−d.x)=R·sin t together
//  with its t-derivative (RHS identity C(t)=R·sin t, C'(t)=R·cos t). One knob R
//  IS the morph:
//     R = 1   ⇒ a CARDIOID, exactly 1 cusp  (lamp on the rim);
//     R → ∞   ⇒ a NEPHROID, exactly 2 cusps (the distant sun);
//     1<R<∞   ⇒ a nephroid-family caustic, 2 cusps (the second cusp is born the
//               instant the lamp leaves the rim).
//  Straighten the wall (curvature → 0) and the reflected fan goes to a single
//  virtual image / a parallel band — NO envelope, NO cusp, NO caustic. That is
//  the honest negative control: the dial does nothing, which is the point.
//
//  WHY PLAIN Number ARITHMETIC IS SAFE: all geometry lives on / near the unit
//  circle (|coords| of order 1), R is capped at the "sun" value 1e6, and every
//  product (R·cos2t etc.) is ≤ ~1e6 ≪ Number.MAX_SAFE_INTEGER (2^53−1). The 2×2
//  solves use determinants of order-1 quantities; the cusp guard catches the
//  vanishing determinant exactly where E is undefined (a cusp lives there).
//
//  THE FALSIFIABLE CLAIMS (each checked live, to machine precision):
//   (1) REFLECTION LAW. The clean closed-form direction d(t,R) is genuinely the
//       law-of-reflection direction off the round wall: it is PARALLEL to the
//       direction reflectedRayRaw() computes from first principles (reflect the
//       incident unit vector about the inward normal). So the elegant form is
//       the REAL reflection, not a lookalike.
//   (2) TANGENCY. Every reflected ray is tangent to the closed-form caustic
//       E(t): the ⊥ distance from E(t) to the reflected line through W(t) is
//       < 1e-9 (guarded/null exactly at cusps where E is undefined).
//   (3)★ ANTI-CIRCULARITY. An INDEPENDENT numeric envelope — the intersection of
//       two neighbouring reflected rays at t±h — matches the closed form E(t) to
//       < 1e-8. Two disjoint derivations of one curve; E isn't trusted, it's
//       corroborated.
//   (4)★ CUSP COUNT. Counted as the near-zero local minima of the envelope speed
//       |E'(t)|: rim R=1 ⇒ 1 (cardioid), lifted R>1 out to the sun ⇒ 2
//       (nephroid). cuspParams(R) names the cusp parameters so the loupe can
//       tick a light-dot ON each cusp.
//   (5)★ NEG-CONTROL. A STRAIGHT wall sends a point-source fan to ONE virtual
//       image: all reflected rays concur ⇒ no extended envelope, 0 cusps.
//   (6) ANTI-VACUITY. The rim cardioid and the sun nephroid are genuinely
//       DIFFERENT curves (max separation > 0.3) — not the same drawing twice.
// ============================================================================

const TAU = Math.PI * 2;

// a wall point at angle t on the unit circle
export function wall(t){ return { x: Math.cos(t), y: Math.sin(t) }; }

// reflect incident dir d about unit normal n:  d − 2(d·n)n
export function reflect(d, n){
  const k = 2*(d.x*n.x + d.y*n.y);
  return { x: d.x - k*n.x, y: d.y - k*n.y };
}

// reflected ray DIRECTION at wall-angle t for a point source at S=(R,0).
// The verified closed form (see header): ( R·cos2t − cos t, R·sin2t − sin t ).
export function reflectedDir(t, R){
  return { x: R*Math.cos(2*t) - Math.cos(t), y: R*Math.sin(2*t) - Math.sin(t) };
}

// its t-derivative (for the analytic envelope solve)
export function reflectedDirDt(t, R){
  return { x: -2*R*Math.sin(2*t) + Math.sin(t), y: 2*R*Math.cos(2*t) - Math.cos(t) };
}

// the FULL law-of-reflection (so the renderer can draw real reflected ray
// segments and so the self-test can corroborate the closed-form direction from
// raw first-principles reflection). Returns {P: wall point, d: reflected dir}.
export function reflectedRayRaw(t, R){
  const W = wall(t);
  const n = { x: -W.x, y: -W.y };               // inward unit normal of the unit wall
  const dInRaw = { x: W.x - R, y: W.y };         // S=(R,0) → W (unnormalised; direction is all that matters)
  const m = Math.hypot(dInRaw.x, dInRaw.y) || 1;
  const dIn = { x: dInRaw.x/m, y: dInRaw.y/m };
  return { P: W, d: reflect(dIn, n) };
}

// CLOSED-FORM envelope point E(t,R): solve the 2×2
//   [ d.y , −d.x ] [X]   [ R·sin t ]
//   [ d'.y, −d'.x] [Y] = [ R·cos t ]
export function envelope(t, R){
  const d = reflectedDir(t, R), dp = reflectedDirDt(t, R);
  const a = d.y, b = -d.x, c = dp.y, e = -dp.x;
  const det = a*e - b*c;
  if(Math.abs(det) < 1e-12) return null;         // degenerate (a cusp lives here)
  const rhsA = R*Math.sin(t), rhsB = R*Math.cos(t);
  return { x: (rhsA*e - b*rhsB)/det, y: (a*rhsB - rhsA*c)/det };
}

// INDEPENDENT numeric envelope: intersect neighbour reflected rays at t±h. This
// is the anti-circularity leg — a second, disjoint derivation of the same curve.
export function numEnvelope(t, R, h=1e-6){
  const r1 = reflectedRayRaw(t-h, R), r2 = reflectedRayRaw(t+h, R);
  const det = r1.d.x*(-r2.d.y) - r1.d.y*(-r2.d.x);
  if(Math.abs(det) < 1e-13) return null;
  const bx = r2.P.x - r1.P.x, by = r2.P.y - r1.P.y;
  const s = (bx*(-r2.d.y) - by*(-r2.d.x))/det;
  return { x: r1.P.x + s*r1.d.x, y: r1.P.y + s*r1.d.y };
}

// |E'(t)| from the closed form (speed along the caustic). Cusps = near-zero minima.
export function envSpeed(t, R, h=1e-6){
  const a = envelope(t-h, R), b = envelope(t+h, R);
  if(!a || !b) return null;
  return Math.hypot(b.x - a.x, b.y - a.y) / (2*h);
}

// count cusps: near-zero local minima of |E'| around the loop (wrap-aware, dense
// N, median-relative threshold). R=1 → 1, R>1 → 2.
export function cuspCount(R, N=4000){
  const v = new Array(N);
  for(let i=0;i<N;i++) v[i] = envSpeed(TAU*i/N, R);
  const finite = v.filter(x=>x!=null && isFinite(x)).sort((p,q)=>p-q);
  if(!finite.length) return 0;
  const med = finite[finite.length>>1] || 1;
  const thr = Math.max(2e-3, med*0.04);
  let c = 0;
  for(let i=0;i<N;i++){
    const a = v[(i-1+N)%N], b = v[i], d = v[(i+1)%N];
    if(a==null || b==null || d==null || !isFinite(b)) continue;
    if(b < a && b <= d && b < thr) c++;
  }
  return c;
}

// the cusp PARAMETERS (the t where |E'|→0), so the loupe can tick markers ON the
// curve. Returns the t values of the near-zero |E'| local minima.
export function cuspParams(R, N=2000){
  const out = [];
  const v = new Array(N);
  for(let i=0;i<N;i++) v[i] = envSpeed(TAU*i/N, R);
  const finite = v.filter(x=>x!=null && isFinite(x)).sort((p,q)=>p-q);
  if(!finite.length) return out;
  const med = finite[finite.length>>1] || 1;
  const thr = Math.max(2e-3, med*0.04);
  for(let i=0;i<N;i++){
    const a = v[(i-1+N)%N], b = v[i], d = v[(i+1)%N];
    if(a==null || b==null || d==null || !isFinite(b)) continue;
    if(b < a && b <= d && b < thr) out.push(TAU*i/N);
  }
  return out;
}

// the name of the live curve: exactly the rim cardioid, else a nephroid.
export function curveName(R){
  if(Math.abs(R - 1) < 1e-9) return 'cardioid';
  return 'nephroid';
}

// ── THE SELF-TEST (the in-page chip AND the Node twin call THIS) ────────────
// Each leg runs across regimes (rim / off-rim / sun) where meaningful, so the
// claim is proven for the WHOLE morph, not one R.
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok, detail='') => checks.push({ name, ok: !!ok, detail });

  // (1) REFLECTION law — reflecting a dir twice about the same normal returns it;
  //     and the closed-form direction is PARALLEL to the raw law-of-reflection
  //     direction (rim / off-rim / sun).
  {
    let maxBack = 0, maxDir = 0, n = 0;
    for(const R of [1, 1.3, 2.5, 8, 1e4]){
      for(let i=1;i<240;i++){
        const t = TAU*(i+0.37)/240;
        // double reflection identity
        const nn = { x:-Math.cos(t), y:-Math.sin(t) };
        const d0 = { x:Math.cos(t*1.7), y:Math.sin(t*1.7) };
        const dd = reflect(reflect(d0, nn), nn);
        maxBack = Math.max(maxBack, Math.hypot(dd.x-d0.x, dd.y-d0.y));
        // closed-form dir ∥ raw reflected dir (normalised cross product → 0)
        const raw = reflectedRayRaw(t, R).d, cf = reflectedDir(t, R);
        const cross = Math.abs(raw.x*cf.y - raw.y*cf.x) / (Math.hypot(cf.x,cf.y)||1);
        maxDir = Math.max(maxDir, cross);
        n++;
      }
    }
    ck('(1) reflection law: double-reflect returns the ray, AND the closed-form dir ∥ raw reflected dir (rim/off-rim/sun)',
       maxBack < 1e-12 && maxDir < 1e-9, 'back '+maxBack.toExponential(2)+' · dir× '+maxDir.toExponential(2));
  }

  // (2) TANGENCY — every reflected ray is tangent to the closed-form caustic
  //     E(t): the ⊥ distance from E(t) to the reflected line through W(t) is ~0
  //     (guarded/null exactly at cusps). Run at rim / off-rim / sun.
  {
    let maxPerp = 0, n = 0, guarded = 0;
    for(const R of [1, 1.6, 4, 1e4]){
      for(let i=0;i<360;i++){
        const t = TAU*(i+0.211)/360;
        const E = envelope(t, R);
        if(!E){ guarded++; continue; }
        const W = wall(t), d = reflectedDir(t, R);
        const dl = Math.hypot(d.x, d.y) || 1;
        const perp = Math.abs((E.x - W.x)*d.y - (E.y - W.y)*d.x) / dl;
        maxPerp = Math.max(maxPerp, perp);
        n++;
      }
    }
    ck('(2) tangency: each reflected ray is tangent to E(t) — max ⊥ residual < 1e-9 (guarded at cusps; rim/off-rim/sun)',
       maxPerp < 1e-9 && n > 0, 'max ⊥ '+maxPerp.toExponential(2)+' over '+n+' rays');
  }

  // (3)★ ANTI-CIRCULARITY — an INDEPENDENT numeric envelope (intersect neighbour
  //     reflected rays at t±h) matches the closed form E(t) to < 1e-8. Two
  //     disjoint derivations of the same curve — the leg that makes it honest.
  {
    let worst = 0, worstR = 0, n = 0;
    for(const R of [1, 1.25, 2, 6, 30, 1e4]){
      let mx = 0;
      for(let i=0;i<1500;i++){
        const t = TAU*(i+0.5)/1500;
        const E = envelope(t, R), X = numEnvelope(t, R);
        if(!E || !X) continue;
        mx = Math.max(mx, Math.hypot(E.x-X.x, E.y-X.y));
        n++;
      }
      if(mx > worst){ worst = mx; worstR = R; }
    }
    ck('(3)★ ANTI-CIRCULARITY: an independent neighbour-intersection envelope matches the closed form < 1e-8',
       worst < 1e-8 && n > 0, 'worst '+worst.toExponential(2)+' @R='+worstR);
  }

  // (4)★ CUSP COUNT — the fact the loupe shows: R=1 ⇒ 1 cusp (cardioid),
  //     R>1 (out to the sun) ⇒ 2 cusps (nephroid). Counted as near-zero |E'|
  //     minima. Off-rim sampled the whole way out, so the second cusp is proven
  //     to persist from just-off-the-rim all the way to the sun.
  {
    const c1 = cuspCount(1);
    const cs = [1.05, 1.5, 3, 12, 60, 1e4].map(R => cuspCount(R));
    const rimOk = (c1 === 1);
    const offOk = cs.every(c => c === 2);
    ck('(4)★ CUSP COUNT: rim R=1 ⇒ 1 (cardioid); lifted R>1…→∞ ⇒ 2 (nephroid)',
       rimOk && offOk, 'rim '+c1+' · off ['+cs.join(',')+']');
  }

  // (5)★ NEG-CONTROL — straighten the wall (curvature → 0). A flat mirror sends a
  //     point-source fan to a SINGLE virtual image: every reflected ray passes
  //     through the one mirror-image point ⇒ they CONCUR, no envelope, no cusp.
  {
    // flat wall = the vertical line x = −D; a source at (0,0); reflected image at
    // (−2D, 0). Fire a fan, reflect each ray off the flat wall, verify all
    // reflected rays pass through that one image point ⇒ they concur (no caustic).
    const D = 1.4, S = { x:0, y:0 }, image = { x:-2*D, y:0 };
    let maxMiss = 0, n = 0;
    for(let i=0;i<200;i++){
      const ang = (-0.9 + 1.8*(i/199));            // a fan aimed at the wall
      const dir = { x:-Math.cos(ang*0.6), y:Math.sin(ang*0.6) };
      const s = (-D - S.x)/dir.x;                  // hit the vertical wall x=−D
      if(s <= 0) continue;
      const hit = { x:-D, y:S.y + s*dir.y };
      const rd = { x:-dir.x, y:dir.y };            // reflect about wall normal (1,0): flip x
      const miss = Math.abs((image.x - hit.x)*rd.y - (image.y - hit.y)*rd.x) / (Math.hypot(rd.x,rd.y)||1);
      maxMiss = Math.max(maxMiss, miss);
      n++;
    }
    ck('(5)★ NEG-CONTROL: a STRAIGHT wall sends the fan to one virtual image — rays concur, no caustic',
       maxMiss < 1e-12 && n > 0, 'max miss '+maxMiss.toExponential(2)+' over '+n+' rays');
  }

  // (6) ANTI-VACUITY — the rim cardioid and the sun nephroid are genuinely
  //     DIFFERENT curves (not the same drawing): their shapes disagree by a real
  //     margin.
  {
    let maxGap = 0;
    for(let i=0;i<400;i++){
      const t = TAU*(i+0.5)/400;
      const a = envelope(t, 1), b = envelope(t, 1e6);
      if(!a || !b) continue;
      maxGap = Math.max(maxGap, Math.hypot(a.x-b.x, a.y-b.y));
    }
    ck('(6) anti-vacuity: the rim cardioid and the sun nephroid are genuinely different curves',
       maxGap > 0.3, 'max separation '+maxGap.toFixed(3));
  }

  const pass = checks.filter(c=>c.ok).length;
  return { pass, total: checks.length, checks };
}
