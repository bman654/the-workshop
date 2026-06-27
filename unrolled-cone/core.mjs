// ============================================================================
//  THE UNROLLED CONE — the estate's ONE singular-curvature (cone-deficit) core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module is
//  the SOLE SOURCE OF TRUTH for every fold / deficit / holonomy number the room
//  shows. The page inlines the slab between the CONE CORE BEGIN / END sentinels
//  byte-for-byte; core.test.mjs proves the inlined copy is identical (indentation-
//  normalised) to this file, so page, pill, and Node twin can never silently drift.
//
//  THE TWIN. This is Curved Country's SINGULAR-curvature companion to its smooth
//  sibling holonomy/core.mjs (THE HOLONOMY WALK). There, curvature is SPREAD over a
//  dome and the parallel-transport step turns by dψ=(1−S′(r))dθ at every point. Here
//  the surface is a CONE: intrinsically FLAT everywhere (you can unroll it onto a
//  plane without stretching — firstForm proves E=1,F=0,G=r² at every fold), with ALL
//  of its curvature crammed into ONE point, the apex. The smooth integral ∬K dA
//  collapses to a single Dirac spike of weight δ — the angle DEFICIT of the cut
//  wedge. Walk a loop around the apex and the spear comes home rotated by exactly δ,
//  though every step you took was on flat paper. The holonomy is all seam, no field.
//
//  THE ONE LAW. Slit a cone of half-angle α down a ruling and unroll it: it lies
//  flat as a sector (a fan) of opening angle  Φ = 2π·sinα  — because a circle at
//  slant r has circumference 2π(r sinα), which laid flat is an arc of radius r
//  subtending Φ. The MISSING wedge is the deficit  δ = 2π − Φ = 2π(1 − sinα). By
//  the Gauss–Bonnet theorem that deficit IS the cone's total curvature, and it is
//  what a parallel-transported vector picks up around the apex:
//      holonomy H = δ          (any loop enclosing the apex, ANY shape)
//      H = 0                   (any loop that misses it — flat paper)
//      ∮κ_g ds + δ = 2π        (discrete Gauss–Bonnet: turning + spike = 2π)
//  Shared coordinate: polar (r, β) on the unrolled fan — r = slant from the apex,
//  β = the intrinsic angle ∈ [0, Φ]. Facet-0's φ ≡ Facet-1's th ≡ this β.
// ============================================================================

// === CONE CORE BEGIN ===
// ---- THE CUT WEDGE: a cone's intrinsic signature ----------------------------

// Φ(α): the KEPT sector angle when a cone of half-angle α is slit and unrolled flat.
// A circle at slant r on the cone has circumference 2π(r sinα); laid flat it is an
// arc of radius r subtending Φ·r ⇒ Φ = 2π sinα. The SINGLE name for the fan angle.
function fanAngle(alpha){ return 2 * Math.PI * Math.sin(alpha); }

// δ(α): the REMOVED wedge = the angle DEFICIT = 2π − Φ = 2π(1 − sinα). By Gauss–
// Bonnet this is the cone's ENTIRE curvature, a Dirac spike at the apex: ∬K dA over
// ANY cap enclosing the apex = δ, independent of the cap. The ONE quantity shared by
// the geometry half (the wedge you cut) and the transport half (the twist you keep).
function deficit(alpha){ return 2 * Math.PI * (1 - Math.sin(alpha)); }

// invert δ → α on (0, π/2]:  sinα = 1 − δ/2π.
function alphaOfDeficit(delta){
  return Math.asin(Math.max(-1, Math.min(1, 1 - delta / (2 * Math.PI))));
}

// the embedded cone's base-circle radius and axial height for a rim slant ℓ:
// base = ℓ sinα, height = ℓ cosα (the right triangle apex→rim→axis).
function baseRadius(slant, alpha){ return slant * Math.sin(alpha); }
function coneHeight(slant, alpha){ return slant * Math.cos(alpha); }

// ---- THE CONTINUOUS ISOMETRIC FOLD f∈[0,1]: flat sector → closed cone ---------
// We fold by sweeping a running half-angle σ(f) from π/2 (flat paper) down to the
// target α (closed cone). The SAME fixed sector of fan-angle Φ=2π sinα is re-embedded
// at every f; only its azimuthal wrap tightens. At f=1, σ=α and the wrap closes to a
// full 2π turn. dr²+r²dφ² is preserved at EVERY f (firstForm) — the fold is an
// ISOMETRY: the literal meaning of "paper distance is never stretched".
function sigmaOfFold(f, alpha){ return Math.PI / 2 - f * (Math.PI / 2 - alpha); }

// embed an intrinsic point (r, φ) — r = slant from apex, φ = intrinsic angle ∈[0,Φ]
// (Facet-0's φ ≡ Facet-1's th ≡ the shared β) — into 3-space at fold f. θ=φ/sinσ is
// the azimuth about the cone axis; at f=0 (σ=π/2) it is the flat sector in z=0.
function embed(r, phi, f, alpha){
  const s = sigmaOfFold(f, alpha), sin = Math.sin(s), cos = Math.cos(s);
  const theta = phi / sin;                       // azimuth about the cone axis
  return [r * sin * Math.cos(theta), r * sin * Math.sin(theta), -r * cos];
}
// the two coordinate tangent vectors of the embedding (used by firstForm + the mesh).
function dP_dr(r, phi, f, alpha){
  const s = sigmaOfFold(f, alpha), sin = Math.sin(s), cos = Math.cos(s);
  const theta = phi / sin;
  return [sin * Math.cos(theta), sin * Math.sin(theta), -cos];
}
function dP_dphi(r, phi, f, alpha){
  const s = sigmaOfFold(f, alpha), sin = Math.sin(s);
  const theta = phi / sin;
  return [-r * Math.sin(theta), r * Math.cos(theta), 0];   // = ∂P/∂θ · (dθ/dφ=1/sinσ)
}
// FIRST FUNDAMENTAL FORM at (r,φ,f): the proof of intrinsic flatness. E=1, F=0,
// G=r² for EVERY fold f and every α ⇒ the induced metric is the flat polar
// dr²+r²dφ² throughout the entire folding motion. Nothing is ever stretched.
function firstForm(r, phi, f, alpha){
  const a = dP_dr(r, phi, f, alpha), b = dP_dphi(r, phi, f, alpha);
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  return { E: dot(a, a), F: dot(a, b), G: dot(b, b) };
}

// ---- TRANSPORT on the unrolled fan (Facet 1): flat field, twist at the seam ----
// A path is a list of {r, th} vertices: r = slant, th = the PHYSICAL azimuth about
// the cone axis (continuous / unwrapped along the path). The developed (unrolled)
// plane point is (r cos β, r sin β) with β = sinα·th — Facet-0's φ ≡ this β.

// densify — copied verbatim from holonomy/core.mjs: sample a coarse polyline finely
// (linear in (r,th)) so a freehand stroke converges to the smooth integral.
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

// unwrapFan(raw, Φ): a freehand path drawn on the fan arrives with its intrinsic
// angle β possibly JUMPING across the slit (Φ→0 or 0→Φ). Unwrap β to a continuous
// physical azimuth th = β_unwrapped / sinα so the winding is well-defined. raw is a
// list of {r, b} with b = the raw intrinsic angle β; returns {r, th} transport-ready.
function unwrapFan(raw, Phi){
  const sinA = Phi / (2 * Math.PI);              // Φ = 2π sinα ⇒ sinα = Φ/2π
  const out = [];
  let off = 0, prev = null;
  for (const p of raw){
    const b = p.b;
    if (prev !== null){
      const d = b - prev;
      if (d >  Phi/2) off -= Phi;                // wrapped backward across the slit
      if (d < -Phi/2) off += Phi;                // wrapped forward across the slit
    }
    prev = b;
    out.push({ r: p.r, th: (b + off) / sinA });
  }
  return out;
}

// TRANSPORT THE ARROW around a path. On the unrolled fan the surface is FLAT, so the
// Levi-Civita step is  dψ = (1 − 1)·dth ≡ 0  — the arrow NEVER turns as you walk (the
// felt punchline: "everywhere you walked was flat"). The ENTIRE holonomy is the
// SEAM's deck rotation: gluing β=Φ back to β=0 rotates the frame by the deficit. So
//   H = (deck) 2π·winding − ∮dβ = 2π·w − sinα·∮dth = (1 − sinα)·∮dth = w·δ.
// Enclose the apex once ⇒ H=δ; miss it ⇒ ∮dth=0 ⇒ H=0; wind twice ⇒ H=2δ.
function transportArrow(loop, alpha, psi0){
  psi0 = psi0 || 0;
  const sinA = Math.sin(alpha);
  const dpsi = [];                               // the per-step LOCAL turn — all ≡ 0
  let dthSum = 0;
  for (let i = 1; i < loop.length; i++){
    const dth = loop[i].th - loop[i-1].th;
    dpsi.push((1 - 1) * dth);                     // ≡ 0 exactly on the flat fan
    dthSum += dth;
  }
  const winding = Math.round(dthSum / (2 * Math.PI));
  // The holonomy of a CLOSED loop on the cone is purely TOPOLOGICAL — winding · δ,
  // EXACTLY. All curvature is the apex Dirac spike, so there is no continuous field
  // to integrate and no path-dependence: miss the apex ⇒ 0, circle it w times ⇒ wδ.
  const netDelta = winding * deficit(alpha);
  // `running` is the LIVE accumulation 2π·w − ∮dβ = (1−sinα)·∮dth — what the page
  // shows growing under the dragging arrow before the loop snaps shut onto winding·δ.
  const running = (1 - sinA) * dthSum;
  const headings = loop.map(() => psi0);         // ψ is constant until the closing snap
  return { dpsi, headings, netDelta, winding, swept: dthSum, running };
}

// GEODESIC TURNING ∮κ_g ds — measured PURELY from the loop's developed shape (no δ
// fed in, so it independently CONFIRMS the deficit instead of assuming it). Develop
// each vertex to the flat plane d=(r cosβ, r sinβ), β=sinα·th, and sum the exterior
// (turn) angles of the developed polygon, with the closing turn taken across the
// seam's deck rotation Δβ = sinα·(th_last − th_first). Hopf-Umlaufsatz on the cone: a
// simple loop enclosing the apex once turns by Φ = 2π−δ; one that misses it turns the
// full 2π. Discrete Gauss–Bonnet: this + enclosed apex spike (δ or 0) = 2π. The sum
// TELESCOPES to Δβ exactly whenever every individual turn is < π (smooth loops).
function geodesicTurning(loop, alpha){
  const sinA = Math.sin(alpha);
  const n = loop.length - 1;                     // loop[n] closes onto loop[0]
  const dev = loop.map(p => { const b = sinA * p.th; return [p.r*Math.cos(b), p.r*Math.sin(b)]; });
  const ang = [];
  for (let i = 0; i < n; i++) ang.push(Math.atan2(dev[i+1][1]-dev[i][1], dev[i+1][0]-dev[i][0]));
  const wrap = a => { while (a > Math.PI) a -= 2*Math.PI; while (a <= -Math.PI) a += 2*Math.PI; return a; };
  let turn = 0;
  for (let i = 1; i < n; i++) turn += wrap(ang[i] - ang[i-1]);
  const dBeta = sinA * (loop[n].th - loop[0].th);      // the seam deck rotation
  turn += wrap(ang[0] + dBeta - ang[n-1]);             // the closing turn across the seam
  return turn;
}

// ---- LOOP BUILDERS ----------------------------------------------------------
// enclosingLoop(α, shapeFn, N, turns): a simple loop that WINDS `turns` times around
// the apex. th sweeps 0→2π·turns (physical azimuth); the slant r(t)=shapeFn(t∈[0,1))
// lets the loop be ANY shape — circle, blob, star — proving the holonomy δ and the
// turning 2π−δ are SHAPE-INDEPENDENT (all curvature is the single apex spike). The
// closing vertex sits one full turn LATER (th=2π·turns, NOT wrapped back to 0).
function enclosingLoop(alpha, shapeFn, N, turns){
  N = N || 360; turns = turns || 1;
  const loop = [];
  for (let i = 0; i < N; i++){
    const t = i / N;
    loop.push({ r: shapeFn(t), th: 2 * Math.PI * turns * t });
  }
  loop.push({ r: shapeFn(0), th: 2 * Math.PI * turns });
  return loop;
}

// nonEnclosingLoop(cx,cy,rad,N,α): a small circle in the DEVELOPED plane centred at
// (cx,cy) with radius rad < hypot(cx,cy) so it MISSES the apex (origin). Mapped to
// {r, th} physical coords; th oscillates and returns (∮dth=0) ⇒ H=0, turning=2π.
function nonEnclosingLoop(cx, cy, rad, N, alpha){
  N = N || 240;
  const sinA = Math.sin(alpha);
  const loop = [];
  for (let i = 0; i < N; i++){
    const a = 2 * Math.PI * (i / N);
    const x = cx + rad * Math.cos(a), y = cy + rad * Math.sin(a);
    const r = Math.hypot(x, y), b = Math.atan2(y, x);
    loop.push({ r, th: b / sinA });              // apex not enclosed ⇒ β returns, no wrap
  }
  loop.push({ r: loop[0].r, th: loop[0].th });   // close EXACTLY ⇒ ∮dth = 0 ⇒ H = 0 exactly
  return loop;
}
// === CONE CORE END ===

export {
  fanAngle, deficit, alphaOfDeficit, baseRadius, coneHeight,
  sigmaOfFold, embed, dP_dr, dP_dphi, firstForm,
  densify, unwrapFan, transportArrow, geodesicTurning,
  enclosingLoop, nonEnclosingLoop,
};
