/* ═══════════════════════════════════════════════════════════════════════════
   The Pegboard Planimeter — Pick & the Wheel · the SOLE math authority.

   ONE shape, TWO disjoint roads to its area, that must land on the SAME number:

     ROAD A — THE WHEEL (Green's theorem, calculus). A measuring wheel ROLLS the
       boundary; the net roll ΔW times the arm L gives the area  A = L·ΔW.
       Borrowed BYTE-FAITHFULLY from the Planimeter (planimeter/index.html
       L321–376) — the same instrument, the same four functions, untouched.
       (A test in core.test.mjs asserts this slab is char-identical — anti-drift.)

     ROAD B — PICK (counting, number theory). On an INTEGER lattice, the area of
       a lattice polygon is exactly  A = I + B/2 − 1  (Pick's theorem): the dots
       INSIDE plus half the dots ON the boundary, minus one. Pure integers, no
       calculus symbol anywhere.

   The two roads share NO code (the disjointness is a falsifiable test, claim g).
   Calculus and counting, two crafts, one area — that is the whole room.

   DOM-free. Shared verbatim by the page (index.html) and the headless twin
   (core.test.mjs) — the sibling convention.
   ═══════════════════════════════════════════════════════════════════════════ */

// ===== WHEEL-CORE — byte-faithful from planimeter/index.html L321–376 =====
  function solveElbow(P, M, T, L, branch){
    var dx = T.x - P.x, dy = T.y - P.y;
    var d2 = dx*dx + dy*dy, d = Math.sqrt(d2);
    if(d < 1e-12) return { ok:false };
    // distance from P along PT to the foot of the elbow's perpendicular
    var a = (d2 + M*M - L*L) / (2*d);
    var h2 = M*M - a*a;
    if(h2 < -1e-9) return { ok:false };       // arms can't reach
    var h = Math.sqrt(Math.max(0, h2));
    var ux = dx/d, uy = dy/d;                  // unit P→T
    var fx = P.x + a*ux, fy = P.y + a*uy;      // foot point
    var s = branch ? 1 : -1;
    var ex = fx + s * h * (-uy);               // perpendicular offset
    var ey = fy + s * h * ( ux);
    return { x:ex, y:ey, ok:true };
  }

  // Unit vector along the tracer arm, from elbow E to tracer T (the wheel axle
  // lies along this; the wheel rolls on the PERPENDICULAR component of motion).
  function armDir(E, T){
    var ax = T.x - E.x, ay = T.y - E.y;
    var n = Math.hypot(ax, ay) || 1;
    return { x: ax/n, y: ay/n };
  }

  // ── THE INSTRUMENT: integrate the measuring-wheel roll along a path ─────────
  // path: array of tracer points {x,y} (a closed loop: last≈first).
  // For each step the wheel advances by the displacement component PERPENDICULAR
  // to the tracer-arm direction, evaluated at the step midpoint (midpoint rule —
  // 2nd-order accurate, so it converges fast). Net roll ΔW is returned along
  // with the per-step elbow poses for rendering.
  //
  // The perpendicular to arm-dir (ux,uy) is (-uy,ux). Rolled increment for a
  // tracer step dT = T2−T1 is  dW = dT · perp(armDir at midpoint).
  function wheelRoll(P, M, L, path, branch){
    var dW = 0;
    var n = path.length;
    for(var i = 0; i < n - 1; i++){
      var T1 = path[i], T2 = path[i+1];
      var mid = { x:(T1.x+T2.x)/2, y:(T1.y+T2.y)/2 };
      var E = solveElbow(P, M, mid, L, branch);
      if(!E.ok) return { ok:false, dW:0 };
      var u = armDir(E, { x:mid.x, y:mid.y });
      // perpendicular component of the tracer displacement
      var ddx = T2.x - T1.x, ddy = T2.y - T1.y;
      dW += ddx * (-u.y) + ddy * (u.x);
    }
    return { ok:true, dW:dW };
  }

  // Area measured BY THE INSTRUMENT: A = L · ΔW.
  function measuredArea(P, M, L, path, branch){
    var r = wheelRoll(P, M, L, path, branch);
    if(!r.ok) return { ok:false, area:0, dW:0 };
    return { ok:true, area: L * r.dW, dW: r.dW };
  }
// ===== /WHEEL-CORE =====

/* ── THE ROOM'S WHEEL ADAPTER — new engineering, mine, not the planimeter's ──
   The lattice lives on an 8×8 board (x,y ∈ −4..4). The instrument works in PAPER
   units; SCALE shrinks the lattice to land inside the linkage's reach envelope,
   the POLE sits below the board, and the two arm lengths were VALIDATED to keep
   every in-envelope polygon reachable (0/600 unreachable over the random suite).
   We divide the measured area back out by SCALE² so the number reads in LATTICE
   units — the same units Pick counts in — so the two needles read ONE number.
   (densifyClosed samples each edge in PAPER units so the curvature the wheel
   integrates is honest; the wheel can only roll a finely-sampled path.) */
export const SCALE = 0.5;
export const POLE  = { x: 0, y: -6 };
export const ARM_M = 6;
export const ARM_L = 5;
export const AREA_MAX = 64;                 // full board [-4..4]² — the reachable ceiling
export const SPE_LIVE = 180;                // live tolerance ≈ 1.8e-5
export const SPE_TEST = 2000;               // test tolerance ≈ 1.5e-7

// Sample each edge `spe` times in PAPER units, then push the first point to close
// the loop (the wheel integral needs an explicitly-closed polyline).
function densifyClosed(verts, spe){
  const out = [];
  const n = verts.length;
  for(let i = 0; i < n; i++){
    const a = verts[i], b = verts[(i + 1) % n];
    for(let s = 0; s < spe; s++){
      const t = s / spe;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  out.push({ x: verts[0].x, y: verts[0].y });
  return out;
}

// The wheel's reading of a lattice polygon, in LATTICE units. Returns null only
// if the pole falls out of the linkage's reach (cannot happen inside the board's
// validated envelope, but honest about its precondition).
export function wheelArea(verts, spe = SPE_LIVE){
  const vp = verts.map(p => ({ x: p.x * SCALE, y: p.y * SCALE }));
  const m = measuredArea(POLE, ARM_M, ARM_L, densifyClosed(vp, spe), true);
  return m.ok ? Math.abs(m.area) / (SCALE * SCALE) : null;
}

/* ── ROAD B — PICK · pure integer, references NO wheel symbol ──────────────── */

export function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ [a, b] = [b, a % b]; } return a; }

// Twice the signed area, then halved — exact in floating point for integer verts
// well within 2^53.  (We keep the /2 here; callers that need the integer 2A read
// pick().twoA, which is computed from this without re-deriving.)
export function shoelace(v){
  let A = 0, n = v.length;
  for(let i = 0; i < n; i++){ const a = v[i], b = v[(i + 1) % n]; A += a.x * b.y - b.x * a.y; }
  return A / 2;
}

// Boundary lattice points: each edge from a→b carries gcd(|Δx|,|Δy|) lattice
// points counting its START but not its END (so summing around a closed ring
// counts every boundary node exactly once, including interior-of-edge points —
// a (4,2) edge has gcd 2, so it lights its midpoint).
export function boundaryPoints(v){
  let B = 0, n = v.length;
  for(let i = 0; i < n; i++){ const a = v[i], b = v[(i + 1) % n]; B += gcd(b.x - a.x, b.y - a.y); }
  return B;
}

// Pick on a SIMPLE single-ring lattice polygon. Undefined off the lattice — that
// precondition is load-bearing (the negative control).
export function pick(verts){
  if(!verts.every(p => Number.isInteger(p.x) && Number.isInteger(p.y))) return { defined: false };
  const B = boundaryPoints(verts);
  const twoA = Math.abs(verts.reduce((s, _, i) => {
    const a = verts[i], b = verts[(i + 1) % verts.length];
    return s + (a.x * b.y - b.x * a.y);
  }, 0));                                    // |2A|, an exact integer
  const I = (twoA - B + 2) / 2;             // Pick rearranged: I = (2A − B + 2)/2
  return { defined: true, B, twoA, I, area: I + B / 2 - 1 };   // area ≡ |A| by construction
}

// Pick WITH holes (the VERIFIED two-ring path): outer ring CCW + h hole rings.
// Pick generalises to  A = I + B/2 − 1 + h.  We compute the true area as
// |outer| − Σ|holes|, count every boundary node across all rings, and solve for I.
export function pickWithHoles(outer, holes){
  if(![outer, ...holes].flat().every(p => Number.isInteger(p.x) && Number.isInteger(p.y))) return { defined: false };
  const Aout = Math.abs(shoelace(outer));
  const Ain  = holes.reduce((s, h) => s + Math.abs(shoelace(h)), 0);
  const B    = boundaryPoints(outer) + holes.reduce((s, h) => s + boundaryPoints(h), 0);
  const area = Aout - Ain;
  const h    = holes.length;
  const I    = area - B / 2 + 1 - h;        // A = I + B/2 − 1 + h  ⇒  I = A − B/2 + 1 − h
  return { defined: true, B, I, area, holes: h };
}

/* ── SHARED ENUMERATORS — so the LIT DOTS on the board ARE Pick's needle ──────
   classifyNodes scans every lattice node in the bbox and decides, by EXACT
   integer geometry, whether it is ON the boundary, strictly INSIDE, or outside.
   The board paints from these lists AND the self-test asserts their lengths equal
   pick().B / pick().I — so what you SEE is what the theorem COUNTS, never a drifting
   parallel tally. */

// Is integer point p on the segment a→b? Exact: collinear (cross==0) AND between
// the endpoints (dot products bracket it). No floating point.
function onSegment(p, a, b){
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  if(cross !== 0) return false;
  const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
  if(dot < 0) return false;
  const len2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
  return dot <= len2;
}

export function onBoundary(p, verts){
  const n = verts.length;
  for(let i = 0; i < n; i++){ if(onSegment(p, verts[i], verts[(i + 1) % n])) return true; }
  return false;
}

// Ray-cast point-in-polygon for the strict interior (boundary handled separately).
export function pointInPoly(p, verts){
  let inside = false, n = verts.length;
  for(let i = 0, j = n - 1; i < n; j = i++){
    const xi = verts[i].x, yi = verts[i].y, xj = verts[j].x, yj = verts[j].y;
    if(((yi > p.y) !== (yj > p.y)) &&
       (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// bbox: {x0,y0,x1,y1} integer extents to scan. Returns the interior + boundary
// node lists (their lengths === pick().I and pick().B for a simple lattice poly).
export function classifyNodes(verts, bbox){
  const interior = [], boundary = [];
  for(let y = bbox.y0; y <= bbox.y1; y++){
    for(let x = bbox.x0; x <= bbox.x1; x++){
      const p = { x, y };
      if(onBoundary(p, verts)) boundary.push(p);
      else if(pointInPoly(p, verts)) interior.push(p);
    }
  }
  return { interior, boundary };
}

/* ── Polygon simplicity check (used by the board's drag-commit guard) ─────────
   A candidate reshape only commits if the ring stays SIMPLE — no non-adjacent
   edges crossing OR TOUCHING — because Pick needs a simple Jordan polygon. We
   reject BOTH proper crossings AND improper touches (a vertex on a non-adjacent
   edge, collinear overlap), and a vertex coincident with a non-neighbour vertex —
   the cases a "proper-crossing-only" test silently lets through (which corrupts
   the gcd boundary count, e.g. an over-counted edge → a negative interior). */
const _cr = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

// Is q on segment p→r (inclusive), assuming collinearity already established?
function _onSeg(p, q, r){
  return Math.min(p.x, r.x) <= q.x && q.x <= Math.max(p.x, r.x) &&
         Math.min(p.y, r.y) <= q.y && q.y <= Math.max(p.y, r.y);
}

// Do segments p1p2 and p3p4 intersect AT ALL (proper crossing OR any touch/overlap)?
function segIntersect(p1, p2, p3, p4){
  const d1 = _cr(p3, p4, p1), d2 = _cr(p3, p4, p2), d3 = _cr(p1, p2, p3), d4 = _cr(p1, p2, p4);
  if(((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
     ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;   // proper crossing
  // collinear / endpoint touches — all forbidden between non-adjacent edges
  if(d1 === 0 && _onSeg(p3, p1, p4)) return true;
  if(d2 === 0 && _onSeg(p3, p2, p4)) return true;
  if(d3 === 0 && _onSeg(p1, p3, p2)) return true;
  if(d4 === 0 && _onSeg(p1, p4, p2)) return true;
  return false;
}

export function isSimple(verts){
  const n = verts.length;
  if(n < 3) return false;
  // no two vertices coincide
  for(let i = 0; i < n; i++){
    for(let j = i + 1; j < n; j++){
      if(verts[i].x === verts[j].x && verts[i].y === verts[j].y) return false;
    }
  }
  // no non-adjacent edges intersect (crossing or touching)
  for(let i = 0; i < n; i++){
    const a1 = verts[i], a2 = verts[(i + 1) % n];
    for(let j = i + 1; j < n; j++){
      if((j + 1) % n === i || (i + 1) % n === j) continue;   // skip adjacent edges
      const b1 = verts[j], b2 = verts[(j + 1) % n];
      if(segIntersect(a1, a2, b1, b2)) return false;
    }
  }
  return true;
}

/* Convenience: the bbox of a vertex set, padded by 1 so an edge-touching exterior
   node is still scanned (and correctly classified exterior). */
export function vertsBBox(verts, pad = 0){
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for(const p of verts){ x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad };
}
