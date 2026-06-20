// ============================================================================
//  THE HOLONOMY WALK — the estate's ONE curved-surface parallel-transport core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module is
//  the SOLE SOURCE OF TRUTH for every parallel-transport / geodesic / holonomy
//  number the room shows. The page inlines the slab between the HOLONOMY CORE
//  BEGIN / END sentinels byte-for-byte; core.test.mjs proves the inlined copy is
//  identical (indentation-normalised) to this file, so page, pill, and Node twin
//  can never silently drift.
//
//  THE ONE IDEA. Carry a vector ("a gold spear") around a closed loop on a curved
//  surface, never twisting your hand — keeping it parallel to itself at every step
//  (PARALLEL TRANSPORT, the Levi-Civita connection). On a flat plane it comes home
//  pointing exactly where it started. On a CURVED surface it comes home rotated by
//  a leftover angle Δθ — the HOLONOMY. And that leftover is not random: it equals
//  the total curvature you enclosed,  Δθ = ∬ K dA  (the Gauss-Bonnet theorem). The
//  twist you couldn't survey away IS the curvature you walked around.
//
//  THE SURFACE. One constant-curvature family written in GEODESIC-POLAR coords
//  (r,θ) about a pole:   ds² = dr² + S_K(r)² dθ²,   with
//      S_K(r) = sin(√K·r)/√K   (K>0, a sphere of radius 1/√K)
//             = r               (K=0, the flat plane — NOT special-cased)
//             = sinh(√(−K)·r)/√(−K)  (K<0, a saddle / hyperbolic plane).
//  ONE closed family that DEGENERATES SMOOTHLY to the plane as K→0 (sin x ≈ x,
//  sinh x ≈ x), so the flat negative-control falls out STRUCTURALLY — flat is just
//  K=0, never a hand-coded branch in the transport. S satisfies the Jacobi
//  equation  S'' + K·S = 0  for ALL three signs; that single identity is what makes
//  transport-holonomy and area-holonomy agree exactly (see below).
//
//  THE TRANSPORT, EXACTLY. In the orthonormal frame e₁=∂_r, e₂=(1/S)∂_θ the spin
//  connection is ω = S'(r) dθ, so a parallel-transported vector's angle φ (relative
//  to that frame) obeys  dφ = −S'(r) dθ  along the path. Around a CLOSED loop the
//  frame returns to itself, so the net SCREEN rotation is  Δθ = −∮ S'(r) dθ. By
//  Stokes  −∮ S' dθ = −∬ S''(r) dr dθ = ∬ K·S dr dθ = ∬ K dA  (using S''=−K·S).
//  That is Gauss-Bonnet, derived — not asserted. transportAlong integrates the
//  connection 1-form discretely (the discrete Levi-Civita step); holonomyByArea
//  integrates ∬K dA over the SIGNED enclosed region. They must match to <1e-9.
// ============================================================================

// === HOLONOMY CORE BEGIN ===
// --- the constant-curvature metric S_K(r) and its derivatives ---------------

// S_K(r): the geodesic-polar circumference function. ONE closed family; the K→0
// limit is taken analytically (sin x/√K → x, sinh x/√(−K) → x) so flat is K=0,
// never special-cased downstream.
function metricS(r, K){
  if (K > 0){ const k = Math.sqrt(K); return Math.sin(k*r) / k; }
  if (K < 0){ const k = Math.sqrt(-K); return Math.sinh(k*r) / k; }
  return r;
}
// S'(r) = cos(√K·r) (K>0) / 1 (K=0) / cosh(√(−K)·r) (K<0). This is the spin
// connection coefficient: the parallel frame rotates by −S'(r) dθ per step.
function metricSp(r, K){
  if (K > 0){ const k = Math.sqrt(K); return Math.cos(k*r); }
  if (K < 0){ const k = Math.sqrt(-K); return Math.cosh(k*r); }
  return 1;
}

// --- a path is a list of {r, th} vertices in geodesic-polar coords -----------
// (the room maps the visitor's freehand screen scribble onto this chart).

// Sample a coarse polyline finely (linear in (r,θ)) so the discrete connection
// step converges to the smooth integral. Returns the densified vertex list.
function densify(path, perEdge){
  perEdge = perEdge || 64;
  if (path.length < 2) return path.slice();
  const out = [path[0]];
  for (let i = 1; i < path.length; i++){
    const a = path[i-1], b = path[i];
    for (let s = 1; s <= perEdge; s++){
      const t = s / perEdge;
      out.push({ r: a.r + (b.r - a.r)*t, th: a.th + (b.th - a.th)*t });
    }
  }
  return out;
}

// TRANSPORT ALONG A PATH (the discrete Levi-Civita / spin-connection step).
// We track the spear's heading as the SCREEN angle ψ (what the visitor sees). Two
// pieces move it per step: the coordinate frame e₁=∂_r itself rotates by +dθ in
// screen coords (the polar frame swings as you sweep θ), and the vector rotates by
// dφ = −S'(r̄)·dθ RELATIVE to that frame (the spin connection). So the screen step
// is  dψ = dθ + dφ = (1 − S'(r̄))·dθ. Around a CLOSED loop the net screen rotation
// is therefore Δθ = ∮(1−S')dθ = ∬K dA (Gauss-Bonnet) — exactly what holonomyByArea
// integrates. (On the flat plane S'≡1 so dψ≡0: the spear refuses to turn — Δθ=0 for
// ANY loop, the flat-detent punchline, structural.) Returns:
//   headings[]  — the spear's SCREEN heading ψ at each ORIGINAL vertex,
//   netDelta    — the net screen rotation around the path (= Δθ for a loop),
//   closed      — whether the path's first/last vertex coincide (a loop).
function transportAlong(path, K, psi0){
  psi0 = psi0 || 0;
  const dense = densify(path);
  let psi = psi0;
  const psiByDenseIndex = [psi];
  for (let i = 1; i < dense.length; i++){
    const a = dense[i-1], b = dense[i];
    const rMid = 0.5*(a.r + b.r);
    const dth = b.th - a.th;
    psi += (1 - metricSp(rMid, K)) * dth;     // dψ = (1 − S′(r)) dθ
    psiByDenseIndex.push(psi);
  }
  // pull ψ back to the ORIGINAL vertices (every (perEdge)-th dense sample)
  const perEdge = 64;
  const headings = [psiByDenseIndex[0]];
  for (let i = 1; i < path.length; i++) headings.push(psiByDenseIndex[i*perEdge]);
  const a0 = path[0], aN = path[path.length-1];
  const closed = Math.hypot(aN.r*Math.cos(aN.th) - a0.r*Math.cos(a0.th),
                            aN.r*Math.sin(aN.th) - a0.r*Math.sin(a0.th)) < 1e-9;
  return { headings, netDelta: psi - psi0, closed };
}

// HOLONOMY BY ENCLOSED AREA: Δθ = ∬ K dA over the SIGNED region the loop bounds,
// with dA = S_K(r) dr dθ in geodesic-polar coords. Computed as a signed sweep of
// the metric "shoelace": for each densified edge from angle θ_a to θ_b at radii
// r_a,r_b we add the signed metric area of the polar wedge ∫∫ S dr dθ. A
// figure-eight whose two lobes wind oppositely contributes opposite signs, so a
// balanced eight cancels to 0 EXACTLY — signed enclosed curvature, the decisive
// negative control. K=0 ⇒ integrand 0 ⇒ Δθ=0 for ANY loop, structurally.
function holonomyByArea(loop, K){
  // metric area of the polar region swept from the pole by the closed polygon,
  // = ∮ ( ∫₀^{r(θ)} S_K(ρ) dρ ) dθ  via Green's theorem in (r,θ). We integrate
  // the radial primitive A_K(r) = ∫₀^r S dρ along each edge against dθ.
  const dense = densify(loop);
  let area = 0;                          // signed metric area ∬ S dr dθ
  for (let i = 1; i < dense.length; i++){
    const a = dense[i-1], b = dense[i];
    const dth = b.th - a.th;
    const rMid = 0.5*(a.r + b.r);
    area += radialPrimitive(rMid, K) * dth;   // ∮ A_K(r) dθ  (trapezoid in θ)
  }
  return K * area;                       // ∬ K dA = K · ∬ S dr dθ  (constant K)
}
// A_K(r) = ∫₀^r S_K(ρ) dρ  =  (1−cos(√K r))/K  (K>0) / r²/2 (K=0) /
//          (cosh(√(−K) r)−1)/(−K) (K<0).  Note K·A_K(r) = 1−S'(r), the tidy bridge
//          that makes K·∬S dr dθ = ∮(1−S') dθ = −∮S' dθ = the transport holonomy.
function radialPrimitive(r, K){
  if (K > 0){ const k = Math.sqrt(K); return (1 - Math.cos(k*r)) / K; }
  if (K < 0){ const k = Math.sqrt(-K); return (Math.cosh(k*r) - 1) / (-K); }
  return 0.5*r*r;
}

// --- the EXACT non-convergence anchor: a latitude (cap) loop ----------------
// A circle of geodesic radius r about the pole encloses a spherical cap; its
// transport holonomy is EXACTLY  Δθ = 2π(1 − cos(√K·r))  on the unit-curvature
// sphere written here as 2π(1 − S'(r)) for any K>0. (The octant / three-right-
// angle triangle is the special case area=π/2, excess=π/2 — a quarter turn — but
// a general latitude loop is NOT a quarter turn; this anchor computes the true
// value for the loop actually traced.)
function latitudeHolonomyExact(r, K){
  return 2*Math.PI * (1 - metricSp(r, K));
}
// build a latitude loop of geodesic radius r as N polar vertices (θ: 0→2π at r).
function latitudeLoop(r, N){
  N = N || 720;
  const loop = [];
  for (let i = 0; i <= N; i++) loop.push({ r, th: 2*Math.PI * (i/N) });
  return loop;
}

// --- GEODESIC DEVIATION: two grains dragged "north", and the KISS -----------
// Two nearby geodesics starting parallel separate by ξ(s) obeying the Jacobi
// equation ξ'' + K·ξ = 0, so ξ(s) = ξ₀·cos(√K s) (K>0, they CONVERGE → kiss),
// ξ₀ (K=0, stay parallel forever), ξ₀·cosh(√(−K) s) (K<0, they FLEE). The KISS
// (ξ=0) happens at s = π/(2√K) on the sphere — a SOLVED event, not eyeballed.
function deviationGap(xi0, s, K){
  if (K > 0){ const k = Math.sqrt(K); return xi0 * Math.cos(k*s); }
  if (K < 0){ const k = Math.sqrt(-K); return xi0 * Math.cosh(k*s); }
  return xi0;
}
function kissArcLength(K){
  if (K <= 0) return Infinity;           // flat/saddle never kiss
  return Math.PI / (2*Math.sqrt(K));
}

// --- THE COMMUTATION-FAILURE THEOREM ----------------------------------------
// Transport a vector around a small coordinate parallelogram ∂u→∂v vs ∂v→∂u; the
// two results differ by the curvature: the literal "failure of parallel transport
// to commute." Around the small loop (the parallelogram boundary, one way then the
// reversed other way) the net rotation = ∬K dA over the parallelogram, → 0 exactly
// at K=0. We return the holonomy of the closed parallelogram loop.
function parallelogramHolonomy(r0, th0, dr, dth, K){
  const loop = [
    { r: r0,      th: th0 },
    { r: r0+dr,   th: th0 },
    { r: r0+dr,   th: th0+dth },
    { r: r0,      th: th0+dth },
    { r: r0,      th: th0 }
  ];
  return { transport: transportAlong(loop, K).netDelta, area: holonomyByArea(loop, K) };
}

// --- a balanced FIGURE-EIGHT: signed cancellation ---------------------------
// Two lobes of opposite winding (a left lobe + a mirrored right lobe sharing the
// pole-side crossing). Built so the signed enclosed area is 0 by construction, so
// the net holonomy is ~0 even though each lobe alone twists hard. The decisive
// neg-control isolating SIGNED enclosed area against length/path confounds.
function figureEight(rLobe, thHalf, N){
  N = N || 240;
  const pts = [];
  // left lobe: a small circle centred at (rLobe, −thHalf), traversed CCW
  const cxL = -thHalf, cyL = rLobe, cxR = +thHalf, cyR = rLobe, rad = Math.min(rLobe*0.5, thHalf);
  // we trace in (θ,r)-as-plane then convert; lobes are mirror images ⇒ opposite signed area
  for (let i = 0; i <= N; i++){ const a = 2*Math.PI*(i/N);
    pts.push({ th: cxL + rad*Math.cos(a), r: cyL + rad*Math.sin(a) }); }
  for (let i = 0; i <= N; i++){ const a = -2*Math.PI*(i/N);   // opposite winding
    pts.push({ th: cxR + rad*Math.cos(a), r: cyR + rad*Math.sin(a) }); }
  pts.push({ th: pts[0].th, r: pts[0].r });
  return pts;
}
// === HOLONOMY CORE END ===

export {
  metricS, metricSp, densify, transportAlong, holonomyByArea, radialPrimitive,
  latitudeHolonomyExact, latitudeLoop, deviationGap, kissArcLength,
  parallelogramHolonomy, figureEight,
};
