// ============================================================================
//  THE GRABBABLE TRIANGLE — Curved Country's second surveyor star. The estate's
//  ONE geodesic-triangle / Gauss-Bonnet core: hold a triangle on a curved surface,
//  drag its corners, and WATCH the angle-sum leave 180° by exactly the curvature
//  you enclosed. Zero-dependency, DOM-free ESM — runs in the browser AND in Node.
//
//  This module is the SOLE SOURCE OF TRUTH for every angle, excess, area, and
//  geodesic the room draws. The page inlines the slab between the CORE BEGIN / END
//  sentinels byte-for-byte; core.test.mjs proves the inlined copy is identical
//  (indentation-normalised), so page, pill, and Node twin can never drift.
//
//  THE ONE IDEA (Gauss-Bonnet, for a geodesic triangle).
//    Σα − π  =  ∬ K dA  =  K · area        (constant curvature K)
//  The three interior angles of a triangle whose edges are true GEODESICS do not
//  sum to 180° on a curved surface. Their surplus (the "excess") equals the total
//  curvature swept by the triangle's interior — a leftover you cannot survey away.
//  On a sphere (K=+1) it is POSITIVE (a fat, bulging triangle: the octant of a
//  beach ball has THREE right angles, sum 270°, excess π/2). On the hyperbolic
//  plane (K=−1) it is NEGATIVE (a pinched saddle triangle: the angles fall short).
//  On the flat plane (K=0) it is exactly zero — Euclid's 180°.
//
//  TWO SURFACES, ONE HONEST DECISION.
//   • POSITIVE side is a TRUE isometric Euclidean sphere: K=+1, R=1, so
//     area/R² = area = excess, closed-form on unit 3-vectors. Corners are unit
//     vectors; edges are great-circle arcs; the excess is the spherical solid
//     angle (Van Oosterom–Strackee), validated against the tangent-plane angle sum
//     AND l'Huilier from the side lengths.
//   • NEGATIVE side is the hyperbolic plane rendered as a POINCARÉ DISK. Hilbert's
//     theorem forbids a complete constant-K=−1 saddle isometrically embedded in R³,
//     so the estate HOLDS the sphere and MODELS the saddle — stated in-room as lore,
//     not a fudge. Poincaré is CONFORMAL: the interior angles drawn on the disk ARE
//     the true hyperbolic angles, and its geodesics are closed-form circular arcs
//     orthogonal to the disk boundary (curved, never screen-straight — no ODE). Area
//     and excess convert Poincaré ↔ hyperboloid (a Minkowski 3-vector) and reuse the
//     Minkowski law-of-cosines + l'Huilier, so the SAME theorem check runs on both.
//
//  THE NEGATIVE CONTROL. Recompute every interior angle with the STRAIGHT SCREEN
//  CHORD in place of the geodesic tangent. A chord triangle is a flat Euclidean
//  triangle, so its angle sum is EXACTLY π and its "excess" collapses to 0 — for
//  ANY triangle, on either surface. So a 270° / excess-π/2 reading can ONLY come
//  from honest geodesic edges; if the edges were the straight lines they look like,
//  the octant would read a boring flat 180°. That gap IS the proof the edges curve.
// ============================================================================

// === TRIANGLE CORE BEGIN ===
"use strict";

// ── tiny 3-vector helpers (Euclidean, for the sphere) ───────────────────────
function dot3(a, b){ return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function cross3(a, b){
  return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
}
function sub3(a, b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function add3(a, b){ return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function scale3(a, s){ return [a[0]*s, a[1]*s, a[2]*s]; }
function len3(a){ return Math.sqrt(dot3(a, a)); }
function norm3(a){ const L = len3(a) || 1; return [a[0]/L, a[1]/L, a[2]/L]; }
function clampAcos(x){ return Math.acos(Math.max(-1, Math.min(1, x))); }

// ────────────────────────────────────────────────────────────────────────────
//  THE SPHERE (K = +1, R = 1). Corners are UNIT 3-vectors; edges great circles.
// ────────────────────────────────────────────────────────────────────────────

// geodesic-polar → unit vector: colatitude ψ = r (K=1) from the north pole
// (0,0,1), azimuth θ. r is the geodesic distance from the pole on the unit sphere.
function spherePointFromPolar(r, theta){
  const s = Math.sin(r);
  return [s*Math.cos(theta), s*Math.sin(theta), Math.cos(r)];
}

// the unit tangent, at A, of the great-circle geodesic heading toward B: the
// component of B perpendicular to A, normalised. (B − (A·B)A) is that projection.
function sphereGeoTangent(A, B){
  const d = dot3(A, B);
  return norm3(sub3(B, scale3(A, d)));
}

// interior angle at A of the geodesic triangle A-B-C: the angle between the two
// great-circle tangents leaving A. ROUTE A (tangent-plane angles).
function sphereAngleAt(A, B, C){
  const tB = sphereGeoTangent(A, B), tC = sphereGeoTangent(A, C);
  return clampAcos(dot3(tB, tC));
}

// signed excess Σα − π from the tangent-plane angles (positive on the sphere).
function sphereExcessAngles(A, B, C){
  return sphereAngleAt(A, B, C) + sphereAngleAt(B, C, A) + sphereAngleAt(C, A, B) - Math.PI;
}

// ROUTE B — Van Oosterom–Strackee: the spherical excess straight from POSITIONS,
// as a signed solid angle. E = 2·atan2( A·(B×C), 1 + A·B + B·C + C·A ). Genuinely
// independent of Route A (a scalar triple product + dot products, no tangents).
function sphereExcessVOS(A, B, C){
  const triple = dot3(A, cross3(B, C));
  const denom = 1 + dot3(A, B) + dot3(B, C) + dot3(C, A);
  return 2 * Math.atan2(triple, denom);
}

// arc-length side (great-circle distance) between two unit vectors.
function sphereSide(A, B){ return clampAcos(dot3(A, B)); }

// ROUTE C — l'Huilier's theorem: the spherical excess from the three SIDE LENGTHS
// alone. tan(E/4) = √( tan(s/2) tan((s−a)/2) tan((s−b)/2) tan((s−c)/2) ). A third
// independent route (side lengths, no positions-as-vectors, no tangents).
function lhuilierSphere(a, b, c){
  const s = 0.5*(a + b + c);
  const t = Math.tan(s/2) * Math.tan((s-a)/2) * Math.tan((s-b)/2) * Math.tan((s-c)/2);
  return 4 * Math.atan(Math.sqrt(Math.max(0, t)));
}

// geodesic POLYLINE: a great-circle arc from A to B as n+1 unit vectors (slerp).
function greatCircleArc(A, B, n){
  n = n || 48;
  const Om = sphereSide(A, B), s = Math.sin(Om);
  const out = [];
  if (s < 1e-9){ for (let i = 0; i <= n; i++) out.push(A.slice()); return out; }
  for (let i = 0; i <= n; i++){
    const t = i/n;
    const w0 = Math.sin((1-t)*Om)/s, w1 = Math.sin(t*Om)/s;
    out.push([A[0]*w0 + B[0]*w1, A[1]*w0 + B[1]*w1, A[2]*w0 + B[2]*w1]);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
//  THE HYPERBOLIC PLANE (K = −1, R = 1) as a POINCARÉ DISK ↔ hyperboloid model.
//  Corners are disk points (|z|<1); the hyperboloid gives the Minkowski algebra.
// ────────────────────────────────────────────────────────────────────────────

// Poincaré disk point (u,v), |z|<1 → hyperboloid 3-vector on x0²−x1²−x2²=1.
function poincareToHyperboloid(u, v){
  const s2 = u*u + v*v, d = 1 - s2;
  return [(1 + s2)/d, 2*u/d, 2*v/d];
}
// hyperboloid → Poincaré disk (stereographic from (−1,0,0)).
function hyperboloidToPoincare(X){
  const d = X[0] + 1;
  return [X[1]/d, X[2]/d];
}
// Minkowski inner product (+,−,−). For upper-sheet points ⟨X,Y⟩ ≥ 1.
function mink(X, Y){ return X[0]*Y[0] - X[1]*Y[1] - X[2]*Y[2]; }
// hyperbolic distance between two hyperboloid points.
function hypDist(X, Y){ const c = mink(X, Y); return Math.acosh(Math.max(1, c)); }

// interior angle at A (hyperboloid points) — Minkowski tangent route. The tangent
// space at A carries the metric g = −⟨·,·⟩ (positive definite there); the geodesic
// tangent toward B is V = B − ⟨A,B⟩A (Minkowski-orthogonal to A). ROUTE A.
function hypAngleAt(A, B, C){
  const ab = mink(A, B), ac = mink(A, C), bc = mink(B, C);
  // cos = g(V_AB,V_AC)/√(…) with g = −⟨,⟩ ; the minus signs cancel to:
  const num = ab*ac - bc;
  const den = Math.sqrt(Math.max(0, (ab*ab - 1) * (ac*ac - 1)));
  if (den < 1e-14) return 0;
  return clampAcos(num/den);
}
// signed excess Σα − π (NEGATIVE on the hyperbolic plane). ROUTE A.
function hypExcessAngles(A, B, C){
  return hypAngleAt(A, B, C) + hypAngleAt(B, C, A) + hypAngleAt(C, A, B) - Math.PI;
}
// hyperbolic side length (a=BC, etc.) between hyperboloid points.
function hypSide(A, B){ return hypDist(A, B); }

// ROUTE B/C — hyperbolic l'Huilier from the SIDE LENGTHS: the DEFECT (positive
// area) of a hyperbolic triangle. Obtained from the spherical l'Huilier by the
// imaginary-radius map (tan→tanh under s→is), giving
//   tan(D/4) = √( tanh(s/2) tanh((s−a)/2) tanh((s−b)/2) tanh((s−c)/2) ),  D = area.
// Independent of the tangent route (side lengths only). area = defect = −excess.
function lhuilierHyperbolic(a, b, c){
  const s = 0.5*(a + b + c);
  const t = Math.tanh(s/2) * Math.tanh((s-a)/2) * Math.tanh((s-b)/2) * Math.tanh((s-c)/2);
  return 4 * Math.atan(Math.sqrt(Math.max(0, t)));
}

// disk point at hyperbolic distance r from the origin, azimuth θ. The Euclidean
// radius in the disk is tanh(r/2) (since d(0,z) = 2·artanh|z|). geodesic-polar.
function poincarePointFromPolar(r, theta){
  const s = Math.tanh(r/2);
  return [s*Math.cos(theta), s*Math.sin(theta)];
}

// geodesic POLYLINE in the disk: the circular arc through P1,P2 orthogonal to the
// unit circle (a straight diameter if P1,P2,O are collinear). Closed-form: the
// orthogonal circle's centre O solves O·Pᵢ = (1+|Pᵢ|²)/2 (two linear equations),
// radius √(|O|²−1). Curved on screen — never a chord — so it PASSES the geodesic
// test with no ODE. Returns n+1 disk points [u,v].
function poincareGeodesicArc(P1, P2, n){
  n = n || 48;
  const out = [];
  const c1 = 0.5*(1 + P1[0]*P1[0] + P1[1]*P1[1]);
  const c2 = 0.5*(1 + P2[0]*P2[0] + P2[1]*P2[1]);
  const det = P1[0]*P2[1] - P1[1]*P2[0];
  if (Math.abs(det) < 1e-9){                       // collinear with O → diameter
    for (let i = 0; i <= n; i++){ const t = i/n;
      out.push([P1[0] + (P2[0]-P1[0])*t, P1[1] + (P2[1]-P1[1])*t]); }
    return out;
  }
  const Ox = (c1*P2[1] - c2*P1[1]) / det;
  const Oy = (P1[0]*c2 - P2[0]*c1) / det;
  const rad = Math.sqrt(Math.max(0, Ox*Ox + Oy*Oy - 1));
  let a1 = Math.atan2(P1[1]-Oy, P1[0]-Ox);
  let a2 = Math.atan2(P2[1]-Oy, P2[0]-Ox);
  // walk the SHORT way around the orthogonal circle
  let da = a2 - a1;
  while (da >  Math.PI) da -= 2*Math.PI;
  while (da < -Math.PI) da += 2*Math.PI;
  for (let i = 0; i <= n; i++){ const a = a1 + da*(i/n);
    out.push([Ox + rad*Math.cos(a), Oy + rad*Math.sin(a)]); }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
//  THE FLAT PLANE (K = 0). Euclid: Σα = π exactly, excess 0.
// ────────────────────────────────────────────────────────────────────────────
function flatPointFromPolar(r, theta){ return [r*Math.cos(theta), r*Math.sin(theta)]; }

// ────────────────────────────────────────────────────────────────────────────
//  THE WARP DIAL — one continuous constant-curvature family that morphs the SAME
//  three geodesic-polar corners (r,θ) through K:  +  →  0  →  −. Every quantity is
//  closed-form and smooth through the flat detent, so you watch the angle-sum swing
//  through 180°. Built from the constant-curvature LAW OF COSINES (no positions):
//    dist:   cos(√K·d)  = cos(√K r₁)cos(√K r₂) + sin(√K r₁)sin(√K r₂)cos Δθ    (K>0)
//            cosh(√|K|d) = cosh(√|K|r₁)cosh(√|K|r₂) − sinh(…)sinh(…)cos Δθ       (K<0)
//            d² = r₁²+r₂²−2r₁r₂cos Δθ                                            (K=0)
//    angle:  solve the same identity for the enclosed angle given three sides.
// ────────────────────────────────────────────────────────────────────────────

// geodesic distance between polar corners on the constant-K surface.
function polarDistance(r1, th1, r2, th2, K){
  const dth = th1 - th2, cd = Math.cos(dth);
  if (K > 0){ const k = Math.sqrt(K);
    const c = Math.cos(k*r1)*Math.cos(k*r2) + Math.sin(k*r1)*Math.sin(k*r2)*cd;
    return clampAcos(c)/k;
  }
  if (K < 0){ const k = Math.sqrt(-K);
    const c = Math.cosh(k*r1)*Math.cosh(k*r2) - Math.sinh(k*r1)*Math.sinh(k*r2)*cd;
    return Math.acosh(Math.max(1, c))/k;
  }
  return Math.sqrt(Math.max(0, r1*r1 + r2*r2 - 2*r1*r2*cd));
}

// interior angle opposite side `c`, between sides `a` and `b`, on curvature K
// (constant-curvature law of cosines, solved for the angle).
function angleFromSides(a, b, c, K){
  if (a < 1e-12 || b < 1e-12) return 0;
  let cosG;
  if (K > 0){ const k = Math.sqrt(K);
    cosG = (Math.cos(k*c) - Math.cos(k*a)*Math.cos(k*b)) / (Math.sin(k*a)*Math.sin(k*b));
  } else if (K < 0){ const k = Math.sqrt(-K);
    cosG = (Math.cosh(k*a)*Math.cosh(k*b) - Math.cosh(k*c)) / (Math.sinh(k*a)*Math.sinh(k*b));
  } else {
    cosG = (a*a + b*b - c*c) / (2*a*b);
  }
  return clampAcos(cosG);
}

// the full triangle reckoning at curvature K for three polar corners
// [{r,theta}×3]: the three interior angles, signed excess Σα−π, geometric area
// (|excess|/|K|, → limit 0 at the detent), and K itself. This is the ONE routine
// the dial drives and the reveal consumes. On K=0 area is reported via the local
// small-triangle limit area ≈ excess/K → the Euclidean area of the polar triangle.
function triangleReckoning(corners, K){
  const [P0, P1, P2] = corners;
  const s12 = polarDistance(P1.r, P1.theta, P2.r, P2.theta, K); // side opposite P0
  const s20 = polarDistance(P2.r, P2.theta, P0.r, P0.theta, K); // opposite P1
  const s01 = polarDistance(P0.r, P0.theta, P1.r, P1.theta, K); // opposite P2
  const a0 = angleFromSides(s01, s20, s12, K);   // angle at P0 (sides s01,s20; opp s12)
  const a1 = angleFromSides(s12, s01, s20, K);   // angle at P1
  const a2 = angleFromSides(s20, s12, s01, K);   // angle at P2
  const signedExcess = a0 + a1 + a2 - Math.PI;
  let area;
  if (Math.abs(K) < 1e-9){
    // flat: Euclidean area of the polar triangle by the metric shoelace.
    const x0 = P0.r*Math.cos(P0.theta), y0 = P0.r*Math.sin(P0.theta);
    const x1 = P1.r*Math.cos(P1.theta), y1 = P1.r*Math.sin(P1.theta);
    const x2 = P2.r*Math.cos(P2.theta), y2 = P2.r*Math.sin(P2.theta);
    area = Math.abs((x1-x0)*(y2-y0) - (x2-x0)*(y1-y0)) / 2;
  } else {
    area = signedExcess / K;                      // Gauss-Bonnet: area = excess/K
  }
  return { angles: [a0, a1, a2], sides: [s12, s20, s01], signedExcess, area, K };
}

// === TRIANGLE CORE END ===

export {
  dot3, cross3, sub3, add3, scale3, len3, norm3, clampAcos,
  spherePointFromPolar, sphereGeoTangent, sphereAngleAt, sphereExcessAngles,
  sphereExcessVOS, sphereSide, lhuilierSphere, greatCircleArc,
  poincareToHyperboloid, hyperboloidToPoincare, mink, hypDist, hypAngleAt,
  hypExcessAngles, hypSide, lhuilierHyperbolic, poincarePointFromPolar,
  poincareGeodesicArc, flatPointFromPolar,
  polarDistance, angleFromSides, triangleReckoning,
};
