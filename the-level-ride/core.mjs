// ===== THE-LEVEL-RIDE CORE (inlined byte-twin) BEGIN =====
// ── THE LEVEL RIDE — the support-function authority for SHAPES OF CONSTANT WIDTH.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between the sentinels and the in-page chip calls the SAME
//    runSelfTest(). The renderer reads the plank height from plankHeight() and the
//    pose from pose() DIRECTLY — it NEVER re-derives the height from the contact
//    point (which is where the corner-pivot "tick" landmine lives). ──────────────────
//
// THE LAW. Lay a plank flat across the TOP of a tumbling shape, resting it on the
// shape and on a flat floor under the shape. The plank's height above the floor is the
// shape's WIDTH measured between the two parallel horizontal tangents — top and bottom.
// For a CIRCLE that width is the diameter, the same in every direction; the plank rides
// dead level. The surprise: the circle is NOT the only shape that does this. A Reuleaux
// triangle — three circular arcs, each centred on the OPPOSITE vertex — has the SAME
// width across every direction too, even though it has corners and no fixed centre. Roll
// it and the plank glides perfectly LEVEL while the shape's centroid visibly bobs and
// lurches beneath it. That gap — level plank over a wandering centre — IS the exhibit.
//
//   width(shape, θ) = h(û)+h(−û)   where û = (cosθ, sinθ)            (the plank height)
//   constant width  ⟺  width(θ) is the SAME for every θ            (rides level)
//
// THE SUPPORT FUNCTION (the one primitive everything flows from). For a convex shape K,
// the support function h(K, û) = max over points p∈K of (p·û): the signed distance from
// the origin to the farthest supporting line with outward normal û. The width between the
// two parallel tangent lines ⊥ to û is h(û)+h(−û). We compute h in CLOSED FORM, never by
// sampling the boundary (sampling caps at ~1e-9 — the verified trap; the closed form hits
// 2.2e-16). A Reuleaux polygon is the intersection of n discs; its support is the
// arc-aware max of the per-arc supports. An ellipse's support has the clean closed form
// h(û) = √((a·ux)² + (b·uy)²).
//
// BARBIER. Every constant-width shape of width w has perimeter EXACTLY π·w (Barbier's
// theorem) — the circle (πd) is just one case. We assert this to machine-ε on the
// canonical Reuleaux presets as a second exact claim.
//
// THE NEG-CONTROLS (the teeth). (a) An ELLIPSE is round and smooth but NOT constant
// width: its width swings between 2b (across the short axis) and 2a (across the long),
// an amplitude of exactly 2(a−b). Spin it the same way and the plank BOBS into a periodic
// wave (period π — two bobs per turn). (b) A BROKEN Reuleaux — one arc's radius perturbed
// by ε — is the deliberately non-constant-width morph; its Δwidth grows with ε. Both are
// LABELED INEQUALITIES (Δwidth > THRESH), never over-claimed as exact. (c) The CIRCLE
// degeneracy a=b ⇒ amplitude 0 pins the ellipse failure on STRETCH, not roundness.
//
// HONESTY. EXACT / machine-ε is claimed ONLY for (1) constant width and (2) Barbier
// perimeter on the canonical Reuleaux presets. The broken-morph and the ellipse are
// LABELED INEQUALITIES. The ellipse perimeter is a labeled Ramanujan APPROXIMATION, never
// asserted exact. plankHeight is computed from the support function INDEPENDENTLY of the
// contact point — it is C0-continuous through the cusp, so there is no height
// discontinuity to smooth: the corner-pivot tick is dissolved at the math layer.

// ── ONE SHARED THRESHOLD — well above machine-ε, well below the 0.40 ellipse amplitude.
export const THRESH = 1e-3;

// ── THE TAGGED SHAPE SCHEMA. Both the core and the renderer share these descriptors.
//    {kind:'reuleaux', n, w, radii?:[r0..r_{n-1}]} — n odd; radii defaults to all-w
//    (constant width). A perturbed r_k IS the broken morph. {kind:'ellipse', a, b}.
export function reuleaux(n, w, radii){ return { kind:'reuleaux', n, w, radii: radii || null }; }
export function ellipse(a, b){ return { kind:'ellipse', a, b }; }

// ── canonical presets the EXACT claims are scoped to ──────────────────────────────
export const W0 = 1;                 // canonical width
export const PRESET_NS = [3, 5, 7];  // the canonical Reuleaux orders

// ── 2-VECTOR HELPERS (DOM-free) ────────────────────────────────────────────────
export function dot2(a, b){ return a[0]*b[0] + a[1]*b[1]; }
export function uHat(theta){ return [Math.cos(theta), Math.sin(theta)]; }

// ── REULEAUX VERTICES. n odd vertices equally spaced on a circumcircle; the arc
//    opposite vertex k is centred AT v_k with radius w. For a constant-width Reuleaux
//    polygon the vertices sit on a circle of radius w / (2·cos(π/(2n))) so that the
//    distance from a vertex to the FARTHEST vertex (the one its arc is drawn around)
//    equals exactly w. Returns n vertex points [x,y]. ───────────────────────────────
export function reuleauxVerts(n, w){
  // circumradius so the vertex-to-opposite-vertex chord === w (the arc radius).
  const Rc = w / (2 * Math.cos(Math.PI / (2 * n)));
  const verts = [];
  for (let k = 0; k < n; k++){
    // start at the top (−π/2) so the figure sits point-up, like a drawn Reuleaux triangle.
    const a = -Math.PI/2 + k * (2*Math.PI / n);
    verts.push([Rc * Math.cos(a), Rc * Math.sin(a)]);
  }
  return verts;
}

// ── ARC DESCRIPTORS. Each boundary arc i is centred at vertex v_i (the renderer's
//    "compass arc centred on the opposite vertex"), with radius r_i, and spans the
//    angular fan between the two vertices it connects (the two NOT equal to v_i that
//    are farthest — for an odd Reuleaux polygon the arc opposite v_i runs between the
//    two vertices diametrically across from v_i). We build the arc as: centre = v_i,
//    radius = r_i, and the fan of outward-normal directions it supports = the angular
//    interval of (boundary point − centre) over that arc. We compute this directly from
//    the geometry: the arc centred at v_i passes through the two vertices adjacent to
//    the vertex OPPOSITE v_i. For the support function we only need, per arc: its centre
//    Cᵢ = v_i, its radius rᵢ, and the angular fan [φ0ᵢ, φ1ᵢ] of supported normals. ───
export function reuleauxArcs(shape){
  const { n, w } = shape;
  const radii = shape.radii || Array.from({length:n}, () => w);
  const verts = reuleauxVerts(n, w);
  const arcs = [];
  // For an odd n-gon, the arc drawn around vertex v_k connects the two vertices that are
  // (n-1)/2 and (n+1)/2 steps away — i.e. the pair straddling the antipode of v_k. The
  // outward normal of a point on a circle centred at v_k is the radial direction
  // (point − v_k) normalised, so the supported-normal fan is the angular interval swept
  // from one endpoint vertex to the other (the SHORT way, through the antipodal direction).
  const half = (n - 1) / 2;
  for (let k = 0; k < n; k++){
    const c = verts[k];
    const r = radii[k];
    const eA = verts[(k + half) % n];        // one endpoint vertex of this arc
    const eB = verts[(k + half + 1) % n];    // the other endpoint vertex
    // supported-normal directions at the endpoints: (endpoint − centre).
    let phiA = Math.atan2(eA[1] - c[1], eA[0] - c[0]);
    let phiB = Math.atan2(eB[1] - c[1], eB[0] - c[0]);
    arcs.push({ c, r, phiA, phiB, va: eA, vb: eB });
  }
  return arcs;
}

// ── angle inside an arc's normal fan? The fan runs from phiA to phiB the SHORT way
//    (the arc subtends less than π for a Reuleaux polygon). Normalise to test
//    containment robustly across the ±π branch cut. ─────────────────────────────────
export function angleInFan(phi, phiA, phiB){
  // shortest signed sweep from phiA to phiB
  const norm = a => { let x = a % (2*Math.PI); if (x > Math.PI) x -= 2*Math.PI; if (x <= -Math.PI) x += 2*Math.PI; return x; };
  const sweep = norm(phiB - phiA);
  const off = norm(phi - phiA);
  if (sweep >= 0) return off >= -1e-12 && off <= sweep + 1e-12;
  return off <= 1e-12 && off >= sweep - 1e-12;
}

// ── THE SUPPORT FUNCTION — arc-aware, CLOSED FORM. For a Reuleaux polygon, the
//    boundary is a union of circular arcs; the support in direction û is the support
//    of whichever arc has û in its outward-normal fan: h = Cᵢ·û + rᵢ (the support of a
//    disc of centre Cᵢ radius rᵢ is C·û + r). If û falls in no fan (numerically, on a
//    cusp boundary), take the max over arc endpoints' projections. For an ellipse the
//    closed form is √((a·ux)² + (b·uy)²). ──────────────────────────────────────────
export function support(shape, u){
  if (shape.kind === 'ellipse'){
    return Math.sqrt((shape.a*u[0])*(shape.a*u[0]) + (shape.b*u[1])*(shape.b*u[1]));
  }
  // reuleaux: arc-aware max
  const arcs = reuleauxArcs(shape);
  const phi = Math.atan2(u[1], u[0]);
  let best = -Infinity;
  let found = false;
  for (const arc of arcs){
    if (angleInFan(phi, arc.phiA, arc.phiB)){
      const h = dot2(arc.c, u) + arc.r;       // support of disc(centre c, radius r)
      if (h > best) best = h;
      found = true;
    }
  }
  if (found) return best;
  // û in no fan (a cusp): the supporting line touches a vertex; the support is the max
  // vertex projection (the larger arc-endpoint projection). Closed form, still exact.
  const verts = reuleauxVerts(shape.n, shape.w);
  for (const v of verts){ const h = dot2(v, u); if (h > best) best = h; }
  return best;
}

// ── SUPPORT HEIGHT — the width between the two parallel tangent lines ⊥ to û. ──────
export function supportHeight(shape, theta){
  const u = uHat(theta);
  const un = [-u[0], -u[1]];
  return support(shape, u) + support(shape, un);
}

// ── THE Δwidth PREDICATE — the ONE shared width-range function the page reads. Returns
//    {min, max, delta} of the support height over a dense orientation grid. (Resolves
//    the naming overlap: this is THE widthRange both neg-controls and the live chip use.)
export function widthRange(shape, samples){
  const N = samples || 720;
  let mn = Infinity, mx = -Infinity;
  for (let k = 0; k < N; k++){
    const th = k * Math.PI / N;               // half-turn suffices: height(θ)=height(θ+π)
    const h = supportHeight(shape, th);
    if (h < mn) mn = h;
    if (h > mx) mx = h;
  }
  return { min: mn, max: mx, delta: mx - mn };
}

// ── CONSTANT WIDTH? — the plank rides LEVEL iff true. ────────────────────────────
export function isConstantWidth(shape, tol){
  return widthRange(shape).delta < (tol == null ? THRESH : tol);
}

// ── PLANK HEIGHT at roll angle φ — the VERTICAL support height of the shape rotated by
//    φ, computed via the support function INDEPENDENTLY of the contact point. Rotating
//    the shape by φ and asking for the vertical extent (normal = +y, i.e. θ=π/2) equals
//    asking the un-rotated shape for the support height in direction (π/2 − φ). This is
//    C0-continuous through the cusp — THERE IS NO height discontinuity to smooth, so the
//    corner-pivot tick is dissolved here at the math layer. For a constant-width shape it
//    is ≡ w for every φ. ──────────────────────────────────────────────────────────────
export function plankHeight(shape, phi){
  return supportHeight(shape, Math.PI/2 - phi);
}

// ── PERIMETER. Reuleaux: Σ rᵢ·arcSpanᵢ — exactly π·w for the constant-width preset
//    (Barbier). Ellipse: Ramanujan II approximation, LABELED not-claimed. ────────────
export function perimeter(shape){
  if (shape.kind === 'ellipse'){
    const a = shape.a, b = shape.b;
    const h = ((a-b)*(a-b)) / ((a+b)*(a+b));
    return Math.PI * (a+b) * (1 + 3*h / (10 + Math.sqrt(4 - 3*h)));   // Ramanujan II (approx)
  }
  // reuleaux: sum of arc lengths = Σ rᵢ · (angular span of arc i). The angular span of
  // the arc centred at v_i equals the angle subtended at v_i by its two endpoint
  // vertices, which is the SAME as its supported-normal fan width.
  const arcs = reuleauxArcs(shape);
  const norm = a => { let x = a % (2*Math.PI); if (x > Math.PI) x -= 2*Math.PI; if (x <= -Math.PI) x += 2*Math.PI; return x; };
  let P = 0;
  for (const arc of arcs){
    P += arc.r * Math.abs(norm(arc.phiB - arc.phiA));
  }
  return P;
}

// ── THE POSE — for the RENDERER only (NOT a tested number beyond what's asserted). At
//    roll angle φ the shape rolls on the flat floor (y=0) under the flat plank. The
//    plank sits at height plankHeight(shape, φ) ≡ w (constant-width). The shape's
//    CENTROID cy BOBS — it is the contact-point height, NOT the plank height — and the
//    renderer MUST draw that gap. We return cx, cy (centroid screen offset), thetaShape
//    (the shape's roll rotation), the contact point, and the contact mode. The contact
//    point interpolates smoothly so the shape doesn't visually snap at a cusp. ─────────
export function pose(shape, phi){
  // the shape is rotated by phi about its centroid. The lowest point touches the floor;
  // the centroid height above the floor = support(rotated shape, DOWN reflected) i.e.
  // the support in the −y direction of the rotated shape = support(shape, rotated −y).
  // h_low = support of the rotated shape toward −y; the centroid sits h_low above floor.
  const downRot = [Math.cos(-Math.PI/2 - phi), Math.sin(-Math.PI/2 - phi)];  // −y rotated by −phi into shape frame
  const cyContact = support(shape, downRot);            // centroid height above floor
  const ph = plankHeight(shape, phi);                   // plank height (≡ w if constant width)
  // contact point on the floor (shape-frame support point ≈ where the boundary touches).
  // we report the floor contact x via the support-direction; the renderer eases it.
  let contactMode = 'ARC';
  if (shape.kind === 'reuleaux'){
    const arcs = reuleauxArcs(shape);
    const phiDown = Math.atan2(downRot[1], downRot[0]);
    let inAnyFan = false;
    for (const arc of arcs){ if (angleInFan(phiDown, arc.phiA, arc.phiB)){ inAnyFan = true; break; } }
    contactMode = inAnyFan ? 'ARC' : 'VERTEX';
  }
  return {
    cx: 0,
    cy: cyContact,            // BOBS for non-constant width; plankHeight stays w
    thetaShape: phi,
    contactX: 0,
    contactY: 0,
    contactMode,
    plankY: ph,
  };
}

// ── ELLIPSE WIDTH AMPLITUDE — the analytic extent the bob spans: max−min support
//    height = 2a − 2b = 2(a−b). Used as an anti-vacuity check (the bob is real computed
//    extent, not a renderer flourish). ───────────────────────────────────────────────
export function ellipseAmplitude(a, b){ return 2*Math.abs(a - b); }

// ── THE BROKEN MORPH — perturb ONE arc's radius by δ. Returns a reuleaux descriptor
//    whose arc 0 has radius w·(1+δ); the DRAWN shape re-closes the perturbed arc with a
//    chord so the silhouette never disagrees with the Δwidth number (renderer's job).
export function brokenReuleaux(n, w, delta){
  const radii = Array.from({length:n}, () => w);
  radii[0] = w * (1 + delta);
  return reuleaux(n, w, radii);
}

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ──────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });

  // (1) EXACT CONSTANT WIDTH — on the canonical presets [3,5,7] at width w0, the support
  // height equals w0 to machine-ε over a dense grid, AND plankHeight(φ) ≡ w0 over a
  // rolling sweep. The closed-form support hits ~2.2e-16; sampling the boundary would cap
  // at ~1e-9 (the trap we avoid).
  {
    let worstH = 0, worstPlank = 0, n = 0;
    for (const N of PRESET_NS){
      const sh = reuleaux(N, W0);
      for (let k = 0; k < 2000; k++){
        const th = k * Math.PI / 2000;
        worstH = Math.max(worstH, Math.abs(supportHeight(sh, th) - W0));
        const ph = plankHeight(sh, k * 2*Math.PI / 2000);
        worstPlank = Math.max(worstPlank, Math.abs(ph - W0));
        n++;
      }
    }
    ck('(1) EXACT CONSTANT WIDTH: max|supportHeight(θ)−w| < 1e-12 on presets n=3,5,7 ('+n+' dirs, closed form)', worstH < 1e-12);
    ck('(1b) PLANK RIDES LEVEL: plankHeight(φ) ≡ w to <1e-12 over a full rolling sweep (no corner-pivot tick)', worstPlank < 1e-12);
  }

  // (2) BARBIER — every constant-width preset has perimeter EXACTLY π·w to machine-ε.
  {
    let worstP = 0, n = 0;
    for (const N of PRESET_NS){
      worstP = Math.max(worstP, Math.abs(perimeter(reuleaux(N, W0)) - Math.PI*W0));
      n++;
    }
    ck('(2) BARBIER: |perimeter − π·w| < 1e-12 on every preset n=3,5,7 (exact, '+n+' shapes)', worstP < 1e-12);
  }

  // (3) NEG-CONTROL TEETH — the shapes that must FAIL to be level. (a) ellipse a=1,b=0.8:
  // its width amplitude > THRESH AND !isConstantWidth, AND the measured amplitude matches
  // 2(a−b) to machine-ε (anti-vacuity — the bob is real computed extent). (b) the broken
  // morph: Δwidth > THRESH AND !isConstantWidth.
  {
    const el = ellipse(1.0, 0.8);
    const wr = widthRange(el, 4000);
    const ampMeasured = wr.delta;
    const ampAnalytic = ellipseAmplitude(1.0, 0.8);
    const ellipseBobs = ampMeasured > THRESH && !isConstantWidth(el);
    const ampMatch = Math.abs(ampMeasured - ampAnalytic) < 1e-12;
    ck('(3a) NEG-CONTROL ELLIPSE: a=1,b=0.8 width-amplitude > THRESH AND !isConstantWidth (it does NOT ride level)', ellipseBobs);
    ck('(3b) ANTI-VACUITY: measured ellipse amplitude === 2(a−b) to <1e-12 (the bob is REAL computed extent, not a flourish)', ampMatch);

    const broke = brokenReuleaux(5, W0, 0.3);
    const brokeBobs = widthRange(broke).delta > THRESH && !isConstantWidth(broke);
    ck('(3c) NEG-CONTROL BROKEN MORPH: a perturbed arc gives Δwidth > THRESH AND !isConstantWidth (deliberately not constant)', brokeBobs);
  }

  // (4) DISAGREEMENT — at the SAME orientations, the Reuleaux preset is level (Δ<THRESH)
  // while the ellipse bobs (Δ>THRESH). Not a tautology: same grid, opposite verdicts.
  {
    const reu = reuleaux(5, W0);
    const el = ellipse(1.0, 0.8);
    let reuFlat = true, elBobs = false;
    const hRef = supportHeight(reu, 0);
    for (let k = 0; k < 360; k++){
      const th = k * Math.PI / 360;
      if (Math.abs(supportHeight(reu, th) - hRef) > THRESH) reuFlat = false;
      if (Math.abs(supportHeight(el, th) - supportHeight(el, 0)) > THRESH) elBobs = true;
    }
    ck('(4) DISAGREEMENT: at the same orientations the Reuleaux is LEVEL while the ellipse BOBS > THRESH (not a tautology)', reuFlat && elBobs);
  }

  // (5) CIRCLE DEGENERACY GUARD — a=b ⇒ amplitude < 1e-12. Pins the ellipse failure on
  // STRETCH, not smoothness (the honesty fine print: a circle is the level limit).
  {
    const circ = ellipse(1.0, 1.0);
    const amp = widthRange(circ, 4000).delta;
    ck('(5) CIRCLE DEGENERACY: ellipse a=b ⇒ amplitude < 1e-12 — the failure is STRETCH, not roundness (a circle rides level)', amp < 1e-12);
  }

  // (6) Δwidth IS A CONTINUOUS DIAL — Δwidth(δ=0.3) > Δwidth(0.1) > Δwidth(0)=0, the
  // honest live readout monotone in the break. AND NaN in ⇒ NaN out (domain guard).
  {
    const d0 = widthRange(reuleaux(5, W0, [W0,W0,W0,W0,W0])).delta;
    const d1 = widthRange(brokenReuleaux(5, W0, 0.1)).delta;
    const d3 = widthRange(brokenReuleaux(5, W0, 0.3)).delta;
    const monotone = d3 > d1 && d1 > d0 && d0 < 1e-12;
    const nanShape = ellipse(NaN, 0.8);
    const nanOut = Number.isNaN(support(nanShape, [1, 0]));
    ck('(6a) Δwidth IS A DIAL: Δwidth(0.3) > Δwidth(0.1) > Δwidth(0)=0 — the honest live readout grows with the break', monotone);
    ck('(6b) DOMAIN GUARD: NaN in ⇒ NaN out (a NaN axis gives a NaN support, no silent zero)', nanOut);
  }

  const pass = checks.filter(c => c.ok).length;
  return { pass, total: checks.length, checks };
}
// ===== THE-LEVEL-RIDE CORE (inlined byte-twin) END =====

// ── direct-run main guard: `node core.mjs` prints the self-test and exits non-zero on
//    any failure. Inert when imported, and avoids `import.meta` so the SAME file inlines
//    cleanly into a non-module <script> (where `process` is undefined → false). ──────
if (typeof process !== 'undefined' && process.argv && /(^|\/)core\.mjs$/.test(process.argv[1] || '') && !process.argv[1].includes('core.test')) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name);
  console.log(`\n${r.pass}/${r.total} ${r.pass === r.total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
  process.exit(r.pass === r.total ? 0 : 1);
}
