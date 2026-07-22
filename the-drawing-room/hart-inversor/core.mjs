// ============================================================================
//  HART'S INVERSOR — logic core. A brass drawing-engine of The Drawing Room that
//  draws an EXACT STRAIGHT LINE from FOUR crossing rods (one fewer link than
//  Peaucellier's six). It is a crossed antiparallelogram: two long bars a and two
//  short bars b (a≠b), assembled CROSSED. Three collinear points ride the bars at
//  a shared fraction s: O (the grounded inversion pole), P (crank-driven), Q (the
//  pen). Hart's theorem: O,P,Q stay collinear and OP·OQ = (a²−b²)·s(1−s) is
//  CONSTANT — P is the circle-inverse of Q about O. Drive P on a crank circle
//  through O and Q inks a line so straight it reads as a scored fault in the paper.
//  Pure, DOM-free, zero-dependency. The SOLE Hart's-Inversor authority.
//
//  THE PLATE INSIGHT (the load-bearing engineering). A grounded INTERIOR point on
//  a rod (O sits mid-bar on V4V1; P sits mid-bar on V1V2) is rank-deficient — the
//  two bars to its rod-endpoints are collinear with it, so a naive relax drifts
//  the line to ~1e-2. So each CARRIER bar is represented as a rigid 2-D PLATE: a
//  triangle with one OFF-LINE apex (Hα on bar V4V1 carrying O; Hβ on bar V1V2
//  carrying P), and O / P are located by three bars to the three plate vertices.
//  That is non-degenerate and drives the locus to machine-ε. The apexes render AS
//  honest brass gusset plates, so the drawn machine still reads "4 crossing rods".
//
//  REUSE, NOT FORK. The Solver (Gauss–Newton relax + orientation-sign branch
//  guards), invertPoint, lineFitMaxDev, and the generic table helpers are a
//  self-contained COPY of the-drawing-room/mechanism-bench/core.mjs, verbatim —
//  the antiparallelogram FOLD is exactly why the branch guards earn their keep.
//  New code only: the Hart plate assembly, the OP·OQ invariant, the neg-controls.
//
//  THE FIVE PROVEN CLAIMS (runSelfTest, re-provable by the Node twin):
//    ① EXACT LINE — over the closeable crank sweep, Q's locus fits its least-
//       squares line ≤ machine-ε (target <1e-9; ~1e-14 observed), spans a real
//       extent, and runs ⟂ to OG.
//    ② INVERSION INVARIANT — OP·OQ = (a²−b²)s(1−s) constant <1e-12; O,P,Q
//       collinear <1e-12; O fixed; P rides G's circle through O.
//    ③ RIGIDITY / CLOSURE — every bar holds length <1e-12; V4,O,V1 collinear
//       (O truly ON the short bar); the plate apexes stay rigid.
//    ④ FOLD / BRANCH GUARD — across the sweep the crossing sign never flips (the
//       crossed branch is HELD, never snapping to the parallelogram twin), and the
//       guard predicate REJECTS a fold-flip candidate pose while ACCEPTING the on-
//       fold one — the guard is real code that bites.
//    ⑤ NEG-CONTROL — detune one long bar by δ ⇒ max line-dev ≫ tol, monotone in
//       δ; AND the parallelogram fold ⇒ locus max-dev ≫ tol. The exactness lived
//       entirely in EQUAL bars + the CROSSED fold — one sign apart from a curve.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): index.html inlines the block
//  between the HART-INVERSOR CORE sentinels byte-for-byte; the twin byte-parity-
//  checks the inlined copy so the rendered bench can never drift from the proof.
// ============================================================================

// ===== HART-INVERSOR CORE (byte-identical to core.mjs) =====
"use strict";

const TAU = Math.PI * 2;

// ── tiny scalar/vector helpers (plain {x,y}; the renderer reads these) ──
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
// signed area ×2 of triangle (p,q,r) — its SIGN is the orientation we track
function orient2(p, q, r) { return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); }

/* ═══════════════════════════════════════════════════════════════════════════
   THE GENERAL PLANAR-MECHANISM SOLVER (copied verbatim from mechanism-bench).
   relax() mutates pivots' x,y so every bar meets its rest length, with the
   grounded pivots + the driver held PINNED. Gauss–Newton on the residual via the
   dense normal equations, adaptive Levenberg damping, backtracking line-search,
   and a branch-guard that rejects any step that flips a tracked orientation sign.
   ═══════════════════════════════════════════════════════════════════════════ */
const Solver = {
  /* relax free pivots to satisfy bar lengths.
       pivots : [{x,y,grounded}]   (mutated in place)
       bars   : [{i,j,L}]
       pinned : Set<int> of pinned pivot indices (grounded + driver)
       opts   : { tol, maxIt, branchGuards }
                branchGuards = [[i,j,k], …] triples whose signed-area SIGN must
                not flip during the relaxation (branch / fold tracking).
     Returns { iters, maxResid, dead, flipped }. */
  relax(pivots, bars, pinned, opts) {
    opts = opts || {};
    const tol = opts.tol != null ? opts.tol : 1e-12;
    const maxIt = opts.maxIt || 80;
    const guards = opts.branchGuards || [];
    const free = [];
    for (let i = 0; i < pivots.length; i++) if (!pinned.has(i)) free.push(i);
    const idx = new Map(); free.forEach((p, k) => idx.set(p, k));
    const n = free.length;
    if (n === 0) return { iters: 0, maxResid: this.maxResidual(pivots, bars), dead: false, flipped: false };

    // reference orientation signs to preserve (computed from the warm-start pose)
    const refSign = guards.map(g => Math.sign(orient2(pivots[g[0]], pivots[g[1]], pivots[g[2]])));
    let flipped = false, dead = false, it = 0, maxR = Infinity;

    for (; it < maxIt; it++) {
      // assemble the normal equations JᵀJ·dx = −Jᵀr (only free cols)
      const A = []; for (let a = 0; a < 2 * n; a++) A.push(new Float64Array(2 * n + 1));
      maxR = 0;
      for (let b = 0; b < bars.length; b++) {
        const bi = bars[b].i, bj = bars[b].j, L = bars[b].L;
        const pi = pivots[bi], pj = pivots[bj];
        let dx = pi.x - pj.x, dy = pi.y - pj.y, d = Math.hypot(dx, dy);
        if (d < 1e-9) { d = 1e-9; dx = 1e-9; dy = 0; }
        const r = d - L; if (Math.abs(r) > maxR) maxR = Math.abs(r);
        const gx = dx / d, gy = dy / d; // ∂d/∂pi = (gx,gy); ∂d/∂pj = −(gx,gy)
        const cols = [], grad = [];
        if (idx.has(bi)) { const k = idx.get(bi); cols.push(2 * k, 2 * k + 1); grad.push(gx, gy); }
        if (idx.has(bj)) { const k = idx.get(bj); cols.push(2 * k, 2 * k + 1); grad.push(-gx, -gy); }
        for (let u = 0; u < cols.length; u++) {
          for (let v = 0; v < cols.length; v++) A[cols[u]][cols[v]] += grad[u] * grad[v];
          A[cols[u]][2 * n] += -grad[u] * r;
        }
      }
      if (maxR < tol) break;
      // adaptive Levenberg: heavy far from a solution (robust to a yanked pivot),
      // light when close (full Newton, machine-precision closure).
      const lambda = 1e-12 + 1e-2 * Math.min(1, maxR);
      for (let a = 0; a < 2 * n; a++) A[a][a] += lambda;
      const dxv = this._solveDense(A, 2 * n);
      if (!dxv) { dead = true; break; } // singular → dead / under-constrained pose

      // BACKTRACKING LINE-SEARCH + BRANCH GUARD. Try the full Gauss–Newton step,
      // halving until (a) it does not grow the residual AND (b) no guarded
      // orientation sign flips. If nothing satisfies both, refuse the step.
      const before = this._sse(pivots, bars);
      const base = free.map(fi => ({ x: pivots[fi].x, y: pivots[fi].y }));
      let t = 1, accepted = false, step = 0;
      for (let bt = 0; bt < 30; bt++) {
        for (let k = 0; k < n; k++) { const p = pivots[free[k]]; p.x = base[k].x + t * dxv[2 * k]; p.y = base[k].y + t * dxv[2 * k + 1]; }
        const grew = this._sse(pivots, bars) > before;
        const flips = this._flipsAnyGuard(pivots, guards, refSign);
        if (!grew && !flips) {
          accepted = true;
          for (let k = 0; k < n; k++) step = Math.max(step, Math.abs(t * dxv[2 * k]), Math.abs(t * dxv[2 * k + 1]));
          break;
        }
        t *= 0.5;
      }
      if (!accepted) {
        // restore the pre-step pose; if a guarded sign would only move by flipping,
        // record it so the caller can mark the pose as a branch boundary.
        for (let k = 0; k < n; k++) { pivots[free[k]].x = base[k].x; pivots[free[k]].y = base[k].y; }
        // distinguish "converged enough" from "stuck at a fold"
        if (maxR > 1e-6) flipped = true;
        break;
      }
      if (step < 1e-15) break;
    }
    return { iters: it, maxResid: maxR, dead: dead || maxR > 1e-6, flipped };
  },
  /* sum of squared bar residuals — the objective the line-search must not increase */
  _sse(pivots, bars) { let s = 0; for (const b of bars) { const r = dist(pivots[b.i], pivots[b.j]) - b.L; s += r * r; } return s; },
  /* the BRANCH GUARD predicate (extracted so it is unit-testable and shared by the
     line-search): true iff the candidate pose flips ANY guarded orientation sign
     relative to its reference. A guard whose reference sign is 0 (a degenerate
     reference triangle) is ignored. */
  _flipsAnyGuard(pivots, guards, refSign) {
    for (let s = 0; s < guards.length; s++) {
      if (refSign[s] === 0) continue;
      const sg = Math.sign(orient2(pivots[guards[s][0]], pivots[guards[s][1]], pivots[guards[s][2]]));
      if (sg !== 0 && sg !== refSign[s]) return true;
    }
    return false;
  },
  /* dense Gaussian elimination with partial pivoting on the augmented matrix */
  _solveDense(A, n) {
    for (let c = 0; c < n; c++) {
      let piv = c, best = Math.abs(A[c][c]);
      for (let r = c + 1; r < n; r++) { if (Math.abs(A[r][c]) > best) { best = Math.abs(A[r][c]); piv = r; } }
      if (best < 1e-14) return null; // singular
      if (piv !== c) { const t = A[piv]; A[piv] = A[c]; A[c] = t; }
      const inv = 1 / A[c][c];
      for (let r = 0; r < n; r++) { if (r === c) continue; const f = A[r][c] * inv; if (f !== 0) for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    const x = new Float64Array(n);
    for (let r = 0; r < n; r++) x[r] = A[r][n] / A[r][r];
    return x;
  },
  maxResidual(pivots, bars) { let m = 0; for (const b of bars) m = Math.max(m, Math.abs(dist(pivots[b.i], pivots[b.j]) - b.L)); return m; }
};

/* the EXACT inversion math (a tiny copy of the trusted closed-form: P is the
   circle-inverse of Q in the circle of radius √k2 about O). Used by the invariant
   claim: with k2 = (a²−b²)s(1−s), P and Q are inverse points about O. */
function invertPoint(Q, O, k2) {
  const dx = Q.x - O.x, dy = Q.y - O.y, dd = dx * dx + dy * dy;
  if (dd < 1e-300) return { x: O.x, y: O.y };
  const f = k2 / dd;
  return { x: O.x + dx * f, y: O.y + dy * f };
}

/* least-squares line fit; returns the max perpendicular deviation of the points
   from their best-fit line (the "deviation from straight" the gauge reads). */
function lineFitMaxDev(pts) {
  const n = pts.length; if (n < 2) return 0;
  let mx = 0, my = 0; for (const p of pts) { mx += p.x; my += p.y; } mx /= n; my /= n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) { const dx = p.x - mx, dy = p.y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det)), l1 = tr / 2 + disc;
  let ex, ey; if (Math.abs(sxy) > 1e-300) { ex = l1 - syy; ey = sxy; } else { if (sxx >= syy) { ex = 1; ey = 0; } else { ex = 0; ey = 1; } }
  const el = Math.hypot(ex, ey) || 1; ex /= el; ey /= el; const nx = -ey, ny = ex;
  let md = 0; for (const p of pts) md = Math.max(md, Math.abs((p.x - mx) * nx + (p.y - my) * ny));
  return md;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE ASSEMBLY MODEL — pivots, bars, driver, pen. Generic table helpers copied
   verbatim from mechanism-bench; the Hart-specific assembly follows.
   ═══════════════════════════════════════════════════════════════════════════ */
function makeTable() {
  return { pivots: [], bars: [], driver: -1, pen: -1, driverAnchor: -1, driverR: 0, driverTheta0: 0, preset: null };
}
function addPivot(t, x, y, grounded) { t.pivots.push({ x, y, grounded: !!grounded }); return t.pivots.length - 1; }
function addBar(t, i, j) {
  if (i === j) return;
  for (const b of t.bars) if ((b.i === i && b.j === j) || (b.i === j && b.j === i)) return;
  t.bars.push({ i, j, L: dist(t.pivots[i], t.pivots[j]) });
}
/* the driver crank = the bar from the driver to its single grounded neighbour */
function recomputeDriver(t) {
  t.driverAnchor = -1; t.driverR = 0;
  if (t.driver < 0) return;
  for (const b of t.bars) {
    let other = -1; if (b.i === t.driver) other = b.j; else if (b.j === t.driver) other = b.i;
    if (other >= 0 && t.pivots[other].grounded) { t.driverAnchor = other; t.driverR = b.L; break; }
  }
  if (t.driverAnchor >= 0) {
    const d = t.pivots[t.driver], a = t.pivots[t.driverAnchor];
    t.driverTheta0 = Math.atan2(d.y - a.y, d.x - a.x);
  }
}
function setDriverAngle(t, theta) {
  if (t.driverAnchor < 0) return;
  const a = t.pivots[t.driverAnchor];
  t.pivots[t.driver].x = a.x + t.driverR * Math.cos(theta);
  t.pivots[t.driver].y = a.y + t.driverR * Math.sin(theta);
}
function pinnedSet(t) {
  const s = new Set();
  for (let i = 0; i < t.pivots.length; i++) if (t.pivots[i].grounded) s.add(i);
  if (t.driver >= 0) s.add(t.driver);
  return s;
}
/* the branch-guard witnesses — one orientation triple PER FREE DYAD JOINT. A free
   pivot joined by ≥2 bars is a dyad joint; the triangle (neighbour₀, joint,
   neighbour₁) witnesses which circle-intersection it is on, its sign flipping
   exactly when the joint hops folds. We emit one triple per such joint (skipping
   the driver, pinned to its crank circle). */
function branchGuards(t) {
  const adj = t.pivots.map(() => []);
  for (const b of t.bars) { adj[b.i].push(b.j); adj[b.j].push(b.i); }
  const out = [];
  for (let i = 0; i < t.pivots.length; i++) {
    if (t.pivots[i].grounded || i === t.driver) continue;
    if (adj[i].length >= 2) out.push([adj[i][0], i, adj[i][1]]);
  }
  return out;
}

/* ── VECTOR helpers on {x,y} for the recipe (kept local; no DOM). ── */
function lerp(A, B, t) { return { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t }; }
function sub(A, B) { return { x: A.x - B.x, y: A.y - B.y }; }
function add(A, B) { return { x: A.x + B.x, y: A.y + B.y }; }
function scl(A, k) { return { x: A.x * k, y: A.y * k }; }
function norm(A) { const m = Math.hypot(A.x, A.y) || 1; return { x: A.x / m, y: A.y / m }; }
function perp(A) { return { x: -A.y, y: A.x }; }

/* ═══════════════════════════════════════════════════════════════════════════
   THE HART PLATE ASSEMBLY (new code).

   RECIPE (symmetric about the y-axis, free param d, 0<d<b): with
     U = √(a²−d²),  W = √(b²−d²),  p = (U+W)/2,  r = (W−U)/2  (r<0 ⇒ crossed)
     V1(−p, d/2)  V3(p, d/2)  V2(−r, −d/2)  V4(r, −d/2)
   The antiparallelogram has long bars V1V2, V3V4 (length a) and short bars V2V3,
   V4V1 (length b), assembled crossed. The three collinear carried points:
     O = lerp(V4, V1, 1−s)   (on the short bar V4V1 — the grounded inversion pole)
     P = lerp(V1, V2, s)     (on the long  bar V1V2 — the crank-driven point)
     Q = lerp(V3, V4, s)     (on the long  bar V3V4 — the walnut pen)
   With the CROSSED fold held and O grounded, OP·OQ = (a²−b²)·s(1−s) is constant
   and O,P,Q stay collinear (Hart's theorem). Drive P on a crank circle through O
   ⇒ Q inks an exact straight line.

   The UNCROSSED fold shares all four bar lengths but is the ordinary
   parallelogram; on it the same carried points do NOT trace a line (neg-control).
   ═══════════════════════════════════════════════════════════════════════════ */
const HART = {
  a: 3.2, b: 1.7, s: 0.5, d0: 1.05,
  plateA: 0.62, plateB: 0.62,     // gusset-plate apex heights (off the carrier bar)
  crankDrop: 1.30,                // G below O0P0's midpoint (sets the crank radius)
  paraAlphaS: -0.666              // short-bar angle of the parallelogram twin (neg-control)
};

/* the pure recipe: params {a,b,s,d} → the four vertices + O,P,Q in the recipe
   frame — the CROSSED antiparallelogram (r<0). */
function hartRecipe(params) {
  const a = params.a, b = params.b, s = params.s, d = params.d;
  const U = Math.sqrt(a * a - d * d), W = Math.sqrt(b * b - d * d);
  const p = (U + W) / 2, r = (W - U) / 2;   // r<0 ⇒ crossed
  const V1 = { x: -p, y: d / 2 };
  const V3 = { x: p, y: d / 2 };
  const V2 = { x: -r, y: -d / 2 };
  const V4 = { x: r, y: -d / 2 };
  const O = lerp(V4, V1, 1 - s);
  const P = lerp(V1, V2, s);
  const Q = lerp(V3, V4, s);
  return { V1, V2, V3, V4, O, P, Q, U, W, p, r };
}

/* the PARALLELOGRAM TWIN (neg-control): the SAME four bar lengths (a,b,a,b) folded
   as an ordinary parallelogram (opposite sides equal AND parallel) instead of
   crossed. It shares the grounded pole O0 and the crank centre G with the crossed
   build — only the FOLD differs — so the CROSS⇄UNCROSS toggle is a clean re-fold.
   The short bars V4V1 lie at angle αs about O0 (symmetric: O0 = midpoint(V4,V1));
   the long-bar angle αl is solved so P lands back on the crank circle |GP| = rc. On
   this fold O,P,Q are NOT collinear and Q does NOT trace a line. */
function paraVertices(a, b, s, O0, G, rc, alphaS) {
  const ah = a / 2, bh = b / 2;
  const us = { x: Math.cos(alphaS), y: Math.sin(alphaS) };
  const V1 = add(O0, scl(us, bh)), V4 = sub(O0, scl(us, bh));
  // P = O0 + bh·us + ah·ul must satisfy |P − G| = rc ⇒ C0·ul = K on the unit circle.
  const C0 = add(sub(O0, G), scl(us, bh));
  const cl = Math.hypot(C0.x, C0.y) || 1;
  const K = (rc * rc - (C0.x * C0.x + C0.y * C0.y) - ah * ah) / (2 * ah);
  const kk = Math.max(-1, Math.min(1, K / cl));
  const al = Math.atan2(C0.y, C0.x) - Math.acos(kk);   // the steeper fold (clear bow)
  const ul = { x: Math.cos(al), y: Math.sin(al) };
  const V2 = add(V1, scl(ul, a)), V3 = add(V4, scl(ul, a));
  const O = lerp(V4, V1, 1 - s), P = lerp(V1, V2, s), Q = lerp(V3, V4, s);
  return { V1, V2, V3, V4, O, P, Q };
}

/* the plate apex on a carrier bar: the bar midpoint offset off-line by height h,
   on the side chosen by `sideSign` (so both gussets read on consistent sides). */
function plateApex(A, B, h, sideSign) {
  const mid = lerp(A, B, 0.5);
  const nrm = perp(norm(sub(B, A)));
  return add(mid, scl(nrm, h * sideSign));
}

/* build the full Hart table: 9 pivots (V1..V4, Ha, Hb, O, P, G), 15 bars.
   O and G grounded; P the driver on the crank G–P. Returns the table plus the
   seating metadata (index map, the constant k2, the crank seat angle). */
function buildHart(opts) {
  opts = opts || {};
  const a = opts.a != null ? opts.a : HART.a;
  const b = opts.b != null ? opts.b : HART.b;
  const s = opts.s != null ? opts.s : HART.s;
  const d = opts.d != null ? opts.d : HART.d0;
  const crossed = opts.crossed !== false;
  const plateA = opts.plateA != null ? opts.plateA : HART.plateA;
  const plateB = opts.plateB != null ? opts.plateB : HART.plateB;
  const crankDrop = opts.crankDrop != null ? opts.crankDrop : HART.crankDrop;
  // detune: multiply the long PEN-carrier bar V3V4 rest-length by (1+delta) — the
  // neg-control (a stretched pen-side bar bows the inked line without over-
  // constraining the pinned crank; stretching P's own carrier V1V2 would jam it).
  const detune = opts.detune || 0;

  // The CROSSED recipe establishes the grounded pole O0 and the crank centre G —
  // both folds share them so CROSS⇄UNCROSS is a clean re-fold.
  const gc = hartRecipe({ a, b, s, d });
  const O0 = { x: gc.O.x, y: gc.O.y };
  const midOP = lerp(gc.O, gc.P, 0.5);
  const G = { x: midOP.x, y: midOP.y - crankDrop };
  const rc = dist(G, O0);
  const g = crossed ? gc : paraVertices(a, b, s, O0, G, rc, HART.paraAlphaS);
  // gusset apexes: on the +y side of each carrier bar (clear of the crank below).
  const Ha = plateApex(g.V4, g.V1, plateA, sideOutward(g.V4, g.V1, g.O, +1));
  const Hb = plateApex(g.V1, g.V2, plateB, sideOutward(g.V1, g.V2, g.O, +1));

  const t = makeTable();
  const iV1 = addPivot(t, g.V1.x, g.V1.y, false);   // 0
  const iV2 = addPivot(t, g.V2.x, g.V2.y, false);   // 1
  const iV3 = addPivot(t, g.V3.x, g.V3.y, false);   // 2
  const iV4 = addPivot(t, g.V4.x, g.V4.y, false);   // 3
  const iHa = addPivot(t, Ha.x, Ha.y, false);       // 4
  const iHb = addPivot(t, Hb.x, Hb.y, false);       // 5
  const iO = addPivot(t, O0.x, O0.y, true);         // 6 grounded pole (shared)
  const iP = addPivot(t, g.P.x, g.P.y, false);      // 7 driver
  const iG = addPivot(t, G.x, G.y, true);           // 8 grounded crank centre

  // the four antiparallelogram bars
  addBar(t, iV1, iV2); addBar(t, iV2, iV3); addBar(t, iV3, iV4); addBar(t, iV4, iV1);
  // plate-a (carries O): triangle V4-V1-Ha + O to all three
  addBar(t, iV4, iHa); addBar(t, iV1, iHa);
  addBar(t, iO, iV4); addBar(t, iO, iV1); addBar(t, iO, iHa);
  // plate-b (carries P): triangle V1-V2-Hb + P to all three
  addBar(t, iV1, iHb); addBar(t, iV2, iHb);
  addBar(t, iP, iV1); addBar(t, iP, iV2); addBar(t, iP, iHb);
  // the crank G–P
  addBar(t, iG, iP);

  // OPTIONAL detune: stretch the long PEN-carrier bar V3V4 off true.
  if (detune) { const bd = t.bars.find(bb => (bb.i === iV3 && bb.j === iV4) || (bb.i === iV4 && bb.j === iV3)); bd.L *= (1 + detune); }

  t.driver = iP; t.pen = -1;   // Q is a derived point, not a pivot
  recomputeDriver(t);
  const k2 = (a * a - b * b) * s * (1 - s);
  t.hart = {
    a, b, s, d, crossed, iV1, iV2, iV3, iV4, iHa, iHb, iO, iP, iG, k2,
    seatTheta: t.driverTheta0, O0: { x: O0.x, y: O0.y }, G: { x: G.x, y: G.y },
    opts: { a, b, s, d, crossed, plateA, plateB, crankDrop, detune }
  };
  return t;
}
/* pick the offset sign so the apex lands on the OPPOSITE side of the bar from
   reference point R (keeps the gusset clear of the carried point when possible). */
function sideOutward(A, B, R, want) {
  const s = Math.sign(orient2(A, B, R)) || 1;
  return -s * want;
}

/* the pen Q rides rigidly on the solved long bar V3V4 at fraction s. */
function penPoint(t) {
  const h = t.hart, V3 = t.pivots[h.iV3], V4 = t.pivots[h.iV4];
  return lerp(V3, V4, h.s);
}
/* the pole O and crank point P (solved). */
function polePoint(t) { return { x: t.pivots[t.hart.iO].x, y: t.pivots[t.hart.iO].y }; }
function crankPoint(t) { return { x: t.pivots[t.hart.iP].x, y: t.pivots[t.hart.iP].y }; }

/* crank the mechanism to angle θ and relax; returns the solver result. */
function crankTo(t, theta) {
  setDriverAngle(t, theta);
  return Solver.relax(t.pivots, t.bars, pinnedSet(t), { tol: 1e-13, maxIt: 150, branchGuards: branchGuards(t) });
}

/* the CLOSEABLE crank sub-arc, auto-detected. The crank circle passes through O (a
   degenerate pose OP=0) on one side and hits an antiparallelogram opening limit on
   the other, so the closeable arc is ASYMMETRIC about the seat. We probe outward
   from the seat in each direction (warm-started, so we follow the real branch) and
   return the arc the mechanism actually closes across, trimmed by a small margin.
   Works for the crossed default, the detuned bar, and the parallelogram twin. */
function closeableArc(opts, maxHalf, step) {
  maxHalf = maxHalf != null ? maxHalf : 1.1;
  step = step != null ? step : 0.02;
  const seat = buildHart(opts).hart.seatTheta;
  const reach = (dir) => {
    const t = buildHart(opts); crankTo(t, seat);
    let last = 0;
    for (let span = step; span <= maxHalf + 1e-9; span += step) {
      const r = crankTo(t, seat + dir * span);
      if (r.maxResid < 1e-9) last = span; else break;
    }
    return last;
  };
  const down = reach(-1), up = reach(1), m = step;
  return { lo: seat - Math.max(0, down - m), hi: seat + Math.max(0, up - m), seat, down, up };
}
/* the arc for a live table (rebuilds a probe copy from the table's build opts). */
function crankRange(t) { return closeableArc(t.hart.opts); }

/* ═══════════════════════════════════════════════════════════════════════════
   THE SELF-TEST — the proof in your hand. Proves all five claims numerically;
   the Node twin re-runs the byte-identical function.
   ═══════════════════════════════════════════════════════════════════════════ */
function runSelfTest() {
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // ─── ① EXACT LINE + ② INVERSION INVARIANT (one sweep proves both) ───
  {
    const t = buildHart({});
    const rng = crankRange(t), N = 400;
    const pts = [], Ppts = [];
    let maxResid = 0, prodMin = Infinity, prodMax = -Infinity, collMax = 0, closed = 0;
    const O = polePoint(t);
    for (let i = 0; i <= N; i++) {
      const th = rng.lo + (rng.hi - rng.lo) * i / N;
      const res = crankTo(t, th);
      maxResid = Math.max(maxResid, res.maxResid);
      if (res.maxResid > 1e-6) continue;
      closed++;
      const P = crankPoint(t), Q = penPoint(t);
      pts.push({ x: Q.x, y: Q.y }); Ppts.push({ x: P.x, y: P.y });
      const op = dist(O, P), oq = dist(O, Q), prod = op * oq;
      prodMin = Math.min(prodMin, prod); prodMax = Math.max(prodMax, prod);
      // O,P,Q collinear: perpendicular distance of Q from the line O→P
      const collD = Math.abs(orient2(O, P, Q)) / (dist(O, P) || 1);
      collMax = Math.max(collMax, collD);
    }
    const lineDev = lineFitMaxDev(pts);
    // Q's line must run ⟂ to OG: compare the fit direction against OG.
    const G = t.hart.G, qa = pts[0], qb = pts[pts.length - 1];
    const qd = norm(sub(qb, qa)), og = norm(sub(G, O));
    const perpErr = Math.abs(qd.x * og.x + qd.y * og.y);   // |cos angle| → 0 iff ⟂
    const span = dist(qa, qb);
    const prodDrift = Math.abs(prodMax - prodMin);
    const k2 = t.hart.k2, prodErr = Math.abs((prodMin + prodMax) / 2 - k2);

    ck('① EXACT LINE: Q\'s locus over the closeable sweep fits a line ≤1e-9, spans a real extent, runs ⟂ to OG',
      lineDev < 1e-9 && span > 0.6 && perpErr < 1e-3 && closed >= N,
      'lineMaxDev=' + lineDev.toExponential(2) + ' span=' + span.toFixed(3) + ' ⟂err=' + perpErr.toExponential(2) + ' closed=' + closed + '/' + (N + 1));

    ck('② INVERSION INVARIANT: OP·OQ = (a²−b²)s(1−s) constant <1e-12 AND O,P,Q collinear <1e-12',
      prodDrift < 1e-12 && prodErr < 1e-12 && collMax < 1e-12,
      'OP·OQ drift=' + prodDrift.toExponential(2) + ' vs k²=' + k2.toFixed(4) + ' (err=' + prodErr.toExponential(2) + ') collinearMax=' + collMax.toExponential(2));
  }

  // ─── ③ RIGIDITY / CLOSURE — bars hold, O on its bar, apexes rigid ───
  {
    const t = buildHart({});
    const rng = crankRange(t), N = 300, L0 = t.bars.map(b => b.L);
    let maxBarDev = 0, maxColl = 0;
    for (let i = 0; i <= N; i++) {
      const th = rng.lo + (rng.hi - rng.lo) * i / N;
      const res = crankTo(t, th);
      if (res.maxResid > 1e-6) continue;
      for (let k = 0; k < t.bars.length; k++)
        maxBarDev = Math.max(maxBarDev, Math.abs(dist(t.pivots[t.bars[k].i], t.pivots[t.bars[k].j]) - L0[k]));
      // O truly ON the short bar V4V1 (V4,O,V1 collinear)
      const V4 = t.pivots[t.hart.iV4], O = t.pivots[t.hart.iO], V1 = t.pivots[t.hart.iV1];
      maxColl = Math.max(maxColl, Math.abs(orient2(V4, O, V1)) / (dist(V4, V1) || 1));
    }
    ck('③ RIGIDITY/CLOSURE: every bar holds length <1e-12 AND O stays collinear on bar V4V1 <1e-12',
      maxBarDev < 1e-12 && maxColl < 1e-12,
      'maxBarDev=' + maxBarDev.toExponential(2) + ' O-on-bar dev=' + maxColl.toExponential(2));
  }

  // ─── ④ FOLD / BRANCH GUARD — crossed fold held; the guard bites ───
  {
    // (a) full closeable sweep — the crossed sign never flips, every pose closes
    const t = buildHart({});
    const rng = crankRange(t), N = 500, guards = branchGuards(t);
    const refs = guards.map(() => 0);
    let flips = 0, closed = 0;
    for (let i = 0; i <= N; i++) {
      const th = rng.lo + (rng.hi - rng.lo) * i / N;
      const res = crankTo(t, th);
      if (res.maxResid > 1e-6) continue;
      closed++;
      guards.forEach((tri, wi) => {
        const sg = Math.sign(orient2(t.pivots[tri[0]], t.pivots[tri[1]], t.pivots[tri[2]]));
        if (refs[wi] === 0) refs[wi] = sg; else if (sg !== 0 && sg !== refs[wi]) flips++;
      });
    }
    // (b) white-box: the guard predicate rejects a flipping pose, accepts on-fold
    const t2 = buildHart({});
    const g2 = branchGuards(t2);
    const refSign = g2.map(gg => Math.sign(orient2(t2.pivots[gg[0]], t2.pivots[gg[1]], t2.pivots[gg[2]])));
    const onFold = Solver._flipsAnyGuard(t2.pivots, g2, refSign);           // same fold → no flip
    const tri0 = g2[0], saved = { x: t2.pivots[tri0[1]].x, y: t2.pivots[tri0[1]].y };
    const p0 = t2.pivots[tri0[0]], p2 = t2.pivots[tri0[2]];
    const mx = (p0.x + p2.x) / 2, my = (p0.y + p2.y) / 2;
    t2.pivots[tri0[1]].x = 2 * mx - saved.x; t2.pivots[tri0[1]].y = 2 * my - saved.y;   // reflect across the chord
    const flipped = Solver._flipsAnyGuard(t2.pivots, g2, refSign);
    t2.pivots[tri0[1]].x = saved.x; t2.pivots[tri0[1]].y = saved.y;

    ck('④ FOLD/BRANCH GUARD: crossed fold holds across the sweep (0 flips) AND the guard provably rejects a flip',
      flips === 0 && closed >= N && onFold === false && flipped === true,
      'sweep flips=' + flips + ' closed=' + closed + '/' + (N + 1) + ' guard{onFold→' + onFold + ', flipped→' + flipped + '}');
  }

  // ─── ⑤ NEG-CONTROL — detune bows the line (monotone); parallelogram fold too ───
  {
    // detune one long bar by increasing δ ⇒ max line-dev grows monotonically ≫ tol
    const deltas = [0.01, 0.03, 0.06], devs = [];
    for (const del of deltas) {
      const t = buildHart({ detune: del });
      const rng = crankRange(t), N = 240, pts = [];
      for (let i = 0; i <= N; i++) {
        const th = rng.lo + (rng.hi - rng.lo) * i / N;
        const res = crankTo(t, th);
        if (res.maxResid > 1e-6) continue;
        const Q = penPoint(t); pts.push({ x: Q.x, y: Q.y });
      }
      devs.push(lineFitMaxDev(pts));
    }
    const monotone = devs[0] < devs[1] && devs[1] < devs[2];
    const allBig = devs.every(d => d > 1e-3);

    // parallelogram fold (uncrossed) with the SAME bar lengths ⇒ Q leaves the line
    const tp = buildHart({ crossed: false });
    const rngp = crankRange(tp), Np = 240, ptsp = [];
    for (let i = 0; i <= Np; i++) {
      const th = rngp.lo + (rngp.hi - rngp.lo) * i / Np;
      const res = crankTo(tp, th);
      if (res.maxResid > 1e-6) continue;
      const Q = penPoint(tp); ptsp.push({ x: Q.x, y: Q.y });
    }
    const paraDev = ptsp.length > 10 ? lineFitMaxDev(ptsp) : Infinity;

    ck('⑤ NEG-CONTROL: detune bows the line ≫tol, monotone in δ AND the parallelogram fold leaves the line ≫tol',
      monotone && allBig && paraDev > 1e-3,
      'detune line-dev=[' + devs.map(d => d.toExponential(2)).join(', ') + '] parallelogram dev=' + (isFinite(paraDev) ? paraDev.toExponential(2) : '∞'));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// ===== END HART-INVERSOR CORE =====

export {
  TAU, dist, orient2,
  Solver, invertPoint, lineFitMaxDev,
  makeTable, addPivot, addBar, recomputeDriver, setDriverAngle, pinnedSet, branchGuards,
  HART, hartRecipe, plateApex, buildHart, sideOutward, penPoint, polePoint, crankPoint,
  crankTo, closeableArc, crankRange, runSelfTest,
};
