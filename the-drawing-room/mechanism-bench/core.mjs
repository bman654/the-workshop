// ============================================================================
//  THE MECHANISM BENCH — logic core. A GENERATIVE-LINKAGE SANDBOX: you assemble
//  pin-joints and rigid bars on a brass drafting surface, anoint one DRIVER crank
//  and one PEN, crank it, and a GENERAL planar-mechanism solver articulates the
//  whole truss live while the pen inks a locus forced by the geometry. The fifth
//  brass drawing-engine of The Drawing Room, kin to The Pantograph (exact copy),
//  The Straightedge (exact line), The Trammel (ellipse), The Spirograph (rosette)
//  — but where those are ONE fixed machine each, this is the BENCH they were
//  assembled on: build any planar linkage and watch its theorem appear.
//  Pure, DOM-free, zero-dependency. The SOLE mechanism-bench authority.
//
//  THREE LAYERS, deliberately split so the proof is byte-safe:
//
//  (1) THE GENERAL SOLVER — Newton on bar-length residuals. Pivots[] are points
//      {x,y,grounded}; bars[] are distance constraints {i,j,L} (rest length
//      captured at assembly). One DRIVER pivot rides a crank circle about its
//      single grounded neighbour at angle θ. Given θ we PIN the grounded pivots +
//      the driver, then RELAX the free pivots so every bar meets its rest length:
//      Gauss–Newton on the residual r_k = |p_i − p_j| − L_k, via the dense normal
//      equations JᵀJ·dx = −Jᵀr, adaptive Levenberg damping, and a BACKTRACKING
//      line-search that never lets a step grow the residual (so a hand-yanked
//      pivot relaxes instead of exploding). Warm-started from the previous pose.
//
//      BRANCH TRACKING (the headline integrator job — "the locus can't flip
//      mid-crank"). Bar-length residuals alone do NOT pin the assembly FOLD: a
//      four-bar can close two ways (elbow up / elbow down) at the same crank
//      angle, and a naive Newton step can hop between them, snapping the locus.
//      So the solver keeps a per-pose ORIENTATION SIGN — the sign of the signed
//      area of a reference triangle of three pivots — and REJECTS any accepted
//      Newton step that would flip it (it halves the step until the sign holds,
//      or refuses the step). The driver/tracer is clamped to its reachable crank
//      circle. Dead / near-singular poses (the normal matrix goes rank-deficient)
//      are surfaced, never silently producing a garbage pose.
//
//  (2) THE COGNATE CLOSED-FORM — the Roberts–Chebyshev construction. It lives as
//      a reusable KERNEL in tools/linkage/linkage.js (Linkage.cognates); this core
//      carries a SELF-CONTAINED copy of the same direction-form math (so the page
//      slab is standalone and the Node twin can re-extract it byte-for-byte). It
//      builds the two cognate four-bars from a solved original via the complex
//      shape ratio λ and the link unit-directions u2,u3,u4 — recomputed LIVE, so
//      it stays exact under any drag. All three pens ride the byte-identical curve.
//
//  (3) THE BRIDGE — the claim that earns the sandbox's generality. A sandbox-
//      assembled four-bar (or Peaucellier), solved by the GENERAL Newton solver,
//      lays a locus that matches the TRUSTED closed-form solver to tolerance,
//      WHILE every bar length stays constant across the full crank sweep. Two
//      independent computations (iterative truss-relaxation vs. exact construction)
//      agreeing is what proves the solver is solving the real mechanism.
//
//  THE THREE PROVEN CLAIMS (runSelfTest, re-provable by the Node twin):
//    ① COGNATE THEOREM — the three closed-form pens coincide to <1e-12 (≈1e-15
//       observed) while every cognate bar stays rigid.
//    ② PEAUCELLIER — the pen's locus fits a line to ≈machine-ε AND the inversion
//       product |OP|·|OQ| = L²−ℓ² holds constant.
//    ③ BRIDGE — the Newton-solved sandbox locus matches the closed-form to <1e-6
//       (≈1e-13 observed) while every bar length holds across the sweep (≈1e-13).
//
//  SOURCING (anti-drift, encoded in core.test.mjs): index.html inlines the block
//  between the MECHANISM-BENCH CORE sentinels byte-for-byte; the twin byte-parity-
//  checks the inlined copy so the rendered bench can never drift from the proof.
// ============================================================================

// ===== MECHANISM-BENCH CORE (byte-identical to core.mjs) =====
"use strict";

const TAU = Math.PI * 2;

// ── tiny scalar/vector helpers (plain {x,y}; the renderer reads these) ──
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
// signed area ×2 of triangle (p,q,r) — its SIGN is the orientation we track
function orient2(p, q, r) { return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); }

/* ═══════════════════════════════════════════════════════════════════════════
   (1) THE GENERAL PLANAR-MECHANISM SOLVER.
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

/* ═══════════════════════════════════════════════════════════════════════════
   (2) THE COGNATE CLOSED-FORM — a self-contained copy of the Roberts–Chebyshev
   DIRECTION-FORM construction (the reusable kernel lives in tools/linkage). Built
   from a solved original four-bar via the complex shape ratio λ and the link
   unit-directions; all three pens ride the byte-identical curve. (Complex numbers
   as {re,im}; a planar point {x,y} maps to {re:x, im:y}.)
   ═══════════════════════════════════════════════════════════════════════════ */
const Cog = {
  cmul(z, w) { return { re: z.re * w.re - z.im * w.im, im: z.re * w.im + z.im * w.re }; },
  cadd(z, w) { return { re: z.re + w.re, im: z.im + w.im }; },
  csub(z, w) { return { re: z.re - w.re, im: z.im - w.im }; },
  cscl(z, s) { return { re: z.re * s, im: z.im * s }; },
  cabs(z) { return Math.hypot(z.re, z.im); },
  cunit(z) { const m = Math.hypot(z.re, z.im) || 1; return { re: z.re / m, im: z.im / m }; },
  cdiv(z, w) { const d = w.re * w.re + w.im * w.im; return { re: (z.re * w.re + z.im * w.im) / d, im: (z.im * w.re - z.re * w.im) / d }; },
  // circle∩circle dyad (exact closed form), branch +1/−1
  dyad(c0, r0, c1, r1, branch) {
    const dx = c1.re - c0.re, dy = c1.im - c0.im, d = Math.hypot(dx, dy);
    if (d < 1e-12) return null;
    if (d > r0 + r1 + 1e-9) return null;
    if (d < Math.abs(r0 - r1) - 1e-9) return null;
    const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    let h2 = r0 * r0 - a * a; if (h2 < 0) h2 = 0; const h = Math.sqrt(h2);
    const ux = dx / d, uy = dy / d, px = c0.re + a * ux, py = c0.im + a * uy;
    return branch === 1 ? { re: px - h * uy, im: py + h * ux } : { re: px + h * uy, im: py - h * ux };
  },
  /* solve the ORIGINAL four-bar at crank angle θ; returns the full joint set +
     the shared link directions, or null at a dead pose.
     q = { O0:{x,y}, O1:{x,y}, a, b, c, pu, pv, branch } where (pu,pv) is the pen
     offset in coupler-local coords (pu along A→B, pv perpendicular). */
  original(theta, q) {
    const O0 = { re: q.O0.x, im: q.O0.y }, O1 = { re: q.O1.x, im: q.O1.y };
    const A = { re: O0.re + q.a * Math.cos(theta), im: O0.im + q.a * Math.sin(theta) };
    const B = this.dyad(A, q.b, O1, q.c, q.branch || 1);
    if (!B) return null;
    const d = this.csub(B, A), dl = this.cabs(d) || 1;
    const ux = { re: d.re / dl, im: d.im / dl }, uy = { re: -ux.im, im: ux.re };
    const P = { re: A.re + q.pu * ux.re + q.pv * uy.re, im: A.im + q.pu * ux.im + q.pv * uy.im };
    const u2 = this.cunit(this.csub(A, O0));
    const u3 = this.cunit(this.csub(B, A));
    const u4 = this.cunit(this.csub(B, O1));
    const lam = this.cdiv(this.csub(P, A), this.csub(B, A)); // complex shape ratio
    return { O0, O1, A, B, P, u2, u3, u4, lam };
  },
  /* the full cognate set (original + left + right). All three pens coincide. */
  triple(theta, q) {
    const s = this.original(theta, q);
    if (!s) return null;
    const ONE = { re: 1, im: 0 };
    const O2 = this.cadd(s.O0, this.cmul(s.lam, this.csub(s.O1, s.O0)));  // third ground pivot
    // LEFT cognate: a(1−λ) is COMPLEX → place E via a complex multiply
    const E = this.cadd(O2, this.cmul(this.cscl(this.csub(ONE, s.lam), q.a), s.u2));
    const Pleft = this.cadd(E, this.cmul(this.cscl(s.lam, q.c), s.u4));
    // RIGHT cognate: pen off the shared joint B along the coupler direction
    const Pright = this.cadd(s.B, this.cmul(this.cscl(this.csub(s.lam, ONE), q.b), s.u3));
    const xy = z => ({ x: z.re, y: z.im });
    return {
      O0: xy(s.O0), O1: xy(s.O1), O2: xy(O2),
      A: xy(s.A), B: xy(s.B), E: xy(E),
      P: xy(s.P), Pleft: xy(Pleft), Pright: xy(Pright)
    };
  },
  /* the genuine rigid bars of the three cognate four-bars (for the rigid test) */
  barLengths(g) {
    const D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    return {
      O0A: D(g.O0, g.A), AB: D(g.A, g.B), O1B: D(g.O1, g.B), AP: D(g.A, g.P), BP: D(g.B, g.P),
      O0O2: D(g.O0, g.O2), O2E: D(g.O2, g.E), EPL: D(g.E, g.Pleft),
      O1O2: D(g.O1, g.O2), BPR: D(g.B, g.Pright)
    };
  }
};

/* the EXACT inversion math the Peaucellier preset + test lean on (a tiny copy of
   the trusted closed-form: P is the circle-inverse of Q in the circle √(L²−ℓ²)). */
function invertPoint(Q, O, k2) {
  const dx = Q.x - O.x, dy = Q.y - O.y, dd = dx * dx + dy * dy;
  if (dd < 1e-300) return { x: O.x, y: O.y };
  const f = k2 / dd;
  return { x: O.x + dx * f, y: O.y + dy * f };
}

/* ═══════════════════════════════════════════════════════════════════════════
   (3) THE ASSEMBLY MODEL — pivots, bars, driver, pen, and the presets that
   populate the table as REAL placed parts. Pure data + helpers; no DOM.
   ═══════════════════════════════════════════════════════════════════════════ */
function makeTable() {
  return {
    pivots: [],         // {x,y,grounded}
    bars: [],           // {i,j,L}
    driver: -1, pen: -1,
    driverAnchor: -1, driverR: 0, driverTheta0: 0,
    preset: null        // {kind, q?|O,C,r,L,ell} closed-form spec for proofs
  };
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
/* the branch-guard witnesses — one orientation triple PER FREE DYAD JOINT.

   A free pivot joined by ≥2 bars is a dyad joint: its position is the intersection
   of two circles about its neighbours, which has TWO solutions (elbow up / down).
   The triangle (neighbour₀, joint, neighbour₁) witnesses WHICH solution the joint
   is on — its signed-area sign is constant for a fixed assembly fold and FLIPS
   exactly when the joint hops to the other circle intersection. Crucially this
   witness tracks the FOLD, not the global rotation of the truss (a coupler point
   sweeping a full circle keeps its fold sign), so guarding it pins the branch
   without forbidding honest motion. We emit one triple per such joint, skipping
   the driver (it is pinned to the crank circle). */
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

/* ── PRESETS (world units, ~ −6..6). Each populates the table with REAL parts AND
      records a closed-form `preset` spec the proofs compare against. ── */
const PRESETS = {
  /* a genuinely fully-rotating crank-rocker (a:1.0, b:2.4, c:2.0, closes at all
     2001 sampled crank angles — no coupler dead-pose mid-rotation). */
  fourbar(t) {
    const q = { O0: { x: -1.9, y: -1.2 }, O1: { x: 1.4, y: -1.2 }, a: 1.0, b: 2.4, c: 2.0, pu: 1.10, pv: 0.90, branch: 1 };
    const s = Cog.original(0.0, q);                       // a closing pose to seat the parts (complex {re,im})
    const O0 = addPivot(t, q.O0.x, q.O0.y, true);         // 0 ground
    const O1 = addPivot(t, q.O1.x, q.O1.y, true);         // 1 ground
    const A = addPivot(t, s.A.re, s.A.im, false);         // 2 crank tip (driver)
    const B = addPivot(t, s.B.re, s.B.im, false);         // 3 rocker tip
    const P = addPivot(t, s.P.re, s.P.im, false);         // 4 coupler point (pen)
    addBar(t, O0, A); addBar(t, A, B); addBar(t, O1, B); addBar(t, A, P); addBar(t, B, P);
    t.driver = A; t.pen = P; t.preset = { kind: 'fourbar', q };
    recomputeDriver(t);
  },
  /* Peaucellier–Lipkin: |OC| = r so Q's circle passes through O ⇒ exact line. */
  peaucellier(t) {
    const r = 1.0, L = 3.0, ell = 1.7, k2 = L * L - ell * ell;
    const O = { x: 0, y: 0 }, C = { x: -r, y: 0 };
    const th0 = Math.PI * 0.62;
    const Q = { x: C.x + r * Math.cos(th0), y: C.y + r * Math.sin(th0) };
    const Acx = Cog.dyad({ re: O.x, im: O.y }, L, { re: Q.x, im: Q.y }, ell, 1);
    const Bcx = Cog.dyad({ re: O.x, im: O.y }, L, { re: Q.x, im: Q.y }, ell, -1);
    const P = invertPoint(Q, O, k2);
    const Oi = addPivot(t, O.x, O.y, true);               // 0 O (inversion pivot)
    const Ci = addPivot(t, C.x, C.y, true);               // 1 C (crank centre)
    const Qi = addPivot(t, Q.x, Q.y, false);              // 2 Q (driver)
    const Ai = addPivot(t, Acx.re, Acx.im, false);        // 3 A
    const Bi = addPivot(t, Bcx.re, Bcx.im, false);        // 4 B
    const Pi = addPivot(t, P.x, P.y, false);              // 5 P (pen)
    addBar(t, Ci, Qi);                                    // crank C-Q (length r)
    addBar(t, Oi, Ai); addBar(t, Oi, Bi);                 // the two long bars (L)
    addBar(t, Ai, Qi); addBar(t, Qi, Bi);                 // rhombus sides at Q (ℓ)
    addBar(t, Bi, Pi); addBar(t, Pi, Ai);                 // rhombus sides at P (ℓ)
    t.driver = Qi; t.pen = Pi; t.preset = { kind: 'peaucellier', O, C, r, L, ell };
    recomputeDriver(t);
  },
  /* Scheiner parallelogram pantograph (×s), a faithful preset of the pantograph
     bench's math: P = O + s·(T − O). Built as real placed parts. NOTE this is a
     redundant-constraint mechanism (a parallelogram) — the generic Kutzbach count
     reads DOF 0 though it moves; the page special-cases that so the gate stays open. */
  pantograph(t) {
    const s = 2.0, p = 1.4, qd = 1.2;
    const O = { x: -2.4, y: -0.9 };
    const Ti = { x: -0.7, y: 0.7 };
    const Acx = Cog.dyad({ re: O.x, im: O.y }, p, { re: Ti.x, im: Ti.y }, qd, 1);
    const A = { x: Acx.re, y: Acx.im };
    const B = { x: O.x + s * (A.x - O.x), y: O.y + s * (A.y - O.y) };
    const P = { x: B.x + s * (Ti.x - A.x), y: B.y + s * (Ti.y - A.y) };
    const Oi = addPivot(t, O.x, O.y, true);               // 0 fulcrum (ground)
    const Ti2 = addPivot(t, Ti.x, Ti.y, false);           // 1 tracer (driver)... but no ground neighbour:
    // pantograph has no crank circle — the tracer is dragged by hand. We still
    // ground a tiny anchor so RELEASE can sweep it on a small circle for the demo.
    const Ca = addPivot(t, O.x + 0.9, O.y - 0.2, true);   // 2 a ground anchor for the tracer crank
    const Ai = addPivot(t, A.x, A.y, false);              // 3 apex A
    const Bi = addPivot(t, B.x, B.y, false);              // 4 B on the long ray
    const Pi = addPivot(t, P.x, P.y, false);              // 5 pen P
    addBar(t, Oi, Ai); addBar(t, Ti2, Ai); addBar(t, Oi, Bi);
    addBar(t, Bi, Pi); addBar(t, Ai, Pi); addBar(t, Ti2, Bi);
    addBar(t, Ca, Ti2);                                   // crank anchor → tracer (drives it)
    t.driver = Ti2; t.pen = Pi; t.preset = { kind: 'pantograph', O, s };
    recomputeDriver(t);
  }
};
function loadPreset(t, name) {
  // reset
  t.pivots = []; t.bars = []; t.driver = -1; t.pen = -1; t.driverAnchor = -1; t.driverR = 0; t.preset = null;
  if (name === 'clear') return t;
  if (PRESETS[name]) PRESETS[name](t);
  return t;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILITY (Kutzbach–Gruebler in the parts-bin's terms):
     each pivot = +2 DOF; each grounded anchor = −2; each rigid bar = −1
       M = 2·pivots − 2·grounded − bars
   Exact for generic pin-jointed planar bar networks (four-bar: 5,2,5 → 1;
   Peaucellier: 6,2,7 → 1). A parallelogram/pantograph carries a REDUNDANT
   constraint, so the generic count under-reads (reads 0 though it moves) — we
   special-case it (effectiveM) so the crank gate does not falsely lock it.
   ═══════════════════════════════════════════════════════════════════════════ */
function mobility(t) {
  const pivots = t.pivots.length;
  const grounded = t.pivots.filter(p => p.grounded).length;
  const bars = t.bars.length;
  const M = pivots === 0 ? null : 2 * pivots - 2 * grounded - bars;
  return { pivots, grounded, bars, M };
}
/* the EFFECTIVE mobility used to gate the crank: equals the generic M, except a
   detected parallelogram (the pantograph) carries a REDUNDANT constraint that the
   generic Kutzbach count cannot see — it subtracts a bar that does not actually
   remove a freedom (two parallel bars constrain the same direction twice). So a
   pure parallelogram reads M ≤ 0 yet still MOVES at one freedom. We special-case
   it to effM = 1, and flag the redundancy ONLY when the generic count genuinely
   under-reads it (m.M < 1) — so the gate never falsely locks a moving pantograph
   and we never cry "redundant" when the count is already honest. */
function effectiveMobility(t) {
  const m = mobility(t);
  const isPantograph = (t.preset && t.preset.kind === 'pantograph');
  if (isPantograph && m.M != null) {
    return { ...m, effM: Math.max(1, m.M), redundant: m.M < 1 };
  }
  return { ...m, effM: m.M, redundant: false };
}

/* GRASHOF on a detected closed four-bar (s + l ≤ p + q). Returns null if no clean
   four-bar loop is present, else { grashof, crankRocker, s, l, pq, lengths }. */
function detectFourbar(t) {
  const gnd = []; t.pivots.forEach((p, i) => { if (p.grounded) gnd.push(i); });
  if (gnd.length !== 2) return null;
  const [g0, g1] = gnd, ground = dist(t.pivots[g0], t.pivots[g1]);
  let A = -1, B = -1, crank = 0, rocker = 0;
  for (const b of t.bars) {
    if (b.i === g0 && !t.pivots[b.j].grounded) { A = b.j; crank = b.L; }
    if (b.j === g0 && !t.pivots[b.i].grounded) { A = b.i; crank = b.L; }
  }
  for (const b of t.bars) {
    if (b.i === g1 && !t.pivots[b.j].grounded) { B = b.j; rocker = b.L; }
    if (b.j === g1 && !t.pivots[b.i].grounded) { B = b.i; rocker = b.L; }
  }
  if (A < 0 || B < 0) return null;
  const cb = t.bars.find(b => (b.i === A && b.j === B) || (b.i === B && b.j === A));
  if (!cb) return null;
  return { crank, coupler: cb.L, rocker, ground, A, B };
}
function grashof(t) {
  const fb = detectFourbar(t);
  if (!fb) return null;
  const links = [fb.crank, fb.coupler, fb.rocker, fb.ground].slice().sort((a, b) => a - b);
  const s = links[0], l = links[3], pq = links[1] + links[2];
  const isGrashof = s + l <= pq + 1e-9;
  const crankRocker = isGrashof && Math.abs(fb.crank - s) < 1e-9;
  return { grashof: isGrashof, crankRocker, s, l, sl: s + l, pq, crank: fb.crank };
}
/* is the assembly genuinely crankable? (1-DOF effective, a driver with a grounded
   neighbour = the crank bar, and a pen marked). This predicate IS the lesson the
   RELEASE gate enforces. */
function crankable(t) {
  const em = effectiveMobility(t);
  const hasDriverCrank = t.driver >= 0 && t.driverAnchor >= 0;
  return em.effM === 1 && hasDriverCrank && t.pen >= 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE SELF-TEST — the proof in your hand. Proves all three claims numerically;
   the Node twin re-runs the byte-identical function.
   ═══════════════════════════════════════════════════════════════════════════ */
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
/* the closeable crank arc for the Peaucellier preset (Q must keep the rhombus
   closeable; the lower bound bites near θ=0 where Q≈O). */
function peauRange(pp) {
  const oc = pp.r, lo = pp.L - pp.ell;
  const cosMin = (oc * oc + pp.r * pp.r - lo * lo) / (2 * oc * pp.r);
  const thMin = cosMin >= 1 ? 0 : (cosMin <= -1 ? Math.PI : Math.acos(cosMin));
  return { lo: thMin + 0.05, hi: 2 * Math.PI - thMin - 0.05 };
}

function runSelfTest() {
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // ─── ① COGNATE THEOREM — three closed-form pens ride one curve; bars rigid ───
  {
    const q = { O0: { x: -1.9, y: -1.2 }, O1: { x: 1.4, y: -1.2 }, a: 1.0, b: 2.4, c: 2.0, pu: 1.10, pv: 0.90, branch: 1 };
    let maxPen = 0, maxBar = 0, ref = null, samples = 0;
    for (let i = 0; i <= 2000; i++) {
      const g = Cog.triple(i / 2000 * TAU, q); if (!g) continue; samples++;
      maxPen = Math.max(maxPen, Math.hypot(g.Pleft.x - g.P.x, g.Pleft.y - g.P.y), Math.hypot(g.Pright.x - g.P.x, g.Pright.y - g.P.y));
      const cur = Cog.barLengths(g); if (!ref) ref = cur; else for (const k in cur) maxBar = Math.max(maxBar, Math.abs(cur[k] - ref[k]));
    }
    ck('① COGNATE THEOREM: original+left+right pens coincide <1e-12 AND every cognate bar rigid <1e-12',
      maxPen < 1e-12 && maxBar < 1e-12 && samples > 1900,
      'pen=' + maxPen.toExponential(2) + ' bar=' + maxBar.toExponential(2) + ' samples=' + samples);
  }

  // ─── ② PEAUCELLIER — exact line + inversion constant |OP|·|OQ| = L²−ℓ² ───
  {
    const pp = { O: { x: 0, y: 0 }, C: { x: -1, y: 0 }, r: 1.0, L: 3.0, ell: 1.7 };
    const k2 = pp.L * pp.L - pp.ell * pp.ell, rng = peauRange(pp), pts = [];
    let prodMin = Infinity, prodMax = -Infinity;
    for (let i = 0; i <= 600; i++) {
      const th = rng.lo + (rng.hi - rng.lo) * i / 600;
      const Q = { x: pp.C.x + pp.r * Math.cos(th), y: pp.C.y + pp.r * Math.sin(th) };
      const dq = Math.hypot(Q.x - pp.O.x, Q.y - pp.O.y); if (dq < 1e-9) continue;
      const P = invertPoint(Q, pp.O, k2); pts.push(P);
      const prod = dq * Math.hypot(P.x - pp.O.x, P.y - pp.O.y);
      prodMin = Math.min(prodMin, prod); prodMax = Math.max(prodMax, prod);
    }
    const lineDev = lineFitMaxDev(pts), prodDev = Math.abs(prodMax - prodMin);
    ck('② PEAUCELLIER: pen locus fits a line to ≈machine-ε AND |OP|·|OQ| = L²−ℓ² constant',
      lineDev < 1e-9 && prodDev < 1e-9,
      'lineMaxDev=' + lineDev.toExponential(2) + ' inversion-product drift=' + prodDev.toExponential(2) + ' (k²=' + k2.toFixed(2) + ')');
  }

  // ─── ③ BRIDGE — the GENERAL Newton solver, on a sandbox-assembled four-bar,
  //      matches the trusted closed-form solver while every bar stays rigid. ───
  {
    const t = loadPreset(makeTable(), 'fourbar');
    const q = t.preset.q;
    const pinned = pinnedSet(t), guards = branchGuards(t);
    const a = t.pivots[t.driverAnchor], r = t.driverR;
    const L0 = t.bars.map(b => b.L);
    let maxBridge = 0, maxBarDev = 0, N = 360, closed = 0;
    for (let i = 0; i <= N; i++) {
      const th = i / N * TAU;
      // crank the driver on its circle (angle measured about O0, the anchor)
      t.pivots[t.driver].x = a.x + r * Math.cos(th);
      t.pivots[t.driver].y = a.y + r * Math.sin(th);
      const res = Solver.relax(t.pivots, t.bars, pinned, { tol: 1e-13, maxIt: 100, branchGuards: guards });
      if (res.maxResid > 1e-6) continue;
      closed++;
      // closed-form pen at the SAME crank angle (about O0)
      const cfTh = Math.atan2(t.pivots[t.driver].y - q.O0.y, t.pivots[t.driver].x - q.O0.x);
      const o = Cog.original(cfTh, q); if (!o) continue;   // o.P is complex {re,im}
      maxBridge = Math.max(maxBridge, Math.hypot(t.pivots[t.pen].x - o.P.re, t.pivots[t.pen].y - o.P.im));
      for (let k = 0; k < t.bars.length; k++) maxBarDev = Math.max(maxBarDev, Math.abs(dist(t.pivots[t.bars[k].i], t.pivots[t.bars[k].j]) - L0[k]));
    }
    ck('③ BRIDGE: Newton-solved sandbox locus matches closed-form <1e-6 AND every bar rigid <1e-6 over the sweep',
      maxBridge < 1e-6 && maxBarDev < 1e-6 && closed >= N,
      'Newton≡closed-form=' + maxBridge.toExponential(2) + ' barDrift=' + maxBarDev.toExponential(2) + ' closed=' + closed + '/' + (N + 1));
  }

  // ─── ④ BRANCH TRACKING — the integrator job: the locus can't flip mid-crank.
  //   Two parts, both verifiable:
  //   (a) THE BEHAVIOUR — over a FULL crank rotation of BOTH presets, every dyad
  //       joint keeps its assembly fold: the tracked orientation sign of each
  //       branch-guard triple never flips, and every pose closes. (A flip would
  //       snap the inked locus to a different curve mid-stroke.)
  //   (b) THE MECHANISM IS LOAD-BEARING (white-box, deterministic) — the guard's
  //       sign-flip detector must actually REJECT a candidate pose that flips a
  //       guarded triple. We hand it a pose deliberately on the opposite fold and
  //       assert flipsAGuard() returns true (so relax's line-search would refuse
  //       it), and the on-fold pose returns false. This proves the guard is real
  //       code that bites, not a sign read that happens to stay put.
  {
    // (a) full-rotation fold stability on the four-bar AND the Peaucellier
    let totalFlips = 0, allClosed = true;
    for (const name of ['fourbar', 'peaucellier']) {
      const t = loadPreset(makeTable(), name);
      const pinned = pinnedSet(t), guards = branchGuards(t);
      const a = t.pivots[t.driverAnchor], r = t.driverR;
      const N = 720, refs = guards.map(() => 0);
      let lo = 0, hi = TAU;
      if (name === 'peaucellier') { const rg = peauRange(t.preset); lo = rg.lo; hi = rg.hi; }
      let closed = 0;
      for (let i = 0; i <= N; i++) {
        const th = lo + (hi - lo) * i / N;
        t.pivots[t.driver].x = a.x + r * Math.cos(th);
        t.pivots[t.driver].y = a.y + r * Math.sin(th);
        const res = Solver.relax(t.pivots, t.bars, pinned, { tol: 1e-13, maxIt: 100, branchGuards: guards });
        if (res.maxResid > 1e-6) continue;
        closed++;
        guards.forEach((tri, wi) => {
          const sg = Math.sign(orient2(t.pivots[tri[0]], t.pivots[tri[1]], t.pivots[tri[2]]));
          if (refs[wi] === 0) refs[wi] = sg; else if (sg !== 0 && sg !== refs[wi]) totalFlips++;
        });
      }
      if (closed < N) allClosed = false;
    }
    // (b) white-box: the guard predicate rejects a flipping pose, accepts an on-fold one
    const t = loadPreset(makeTable(), 'fourbar');
    const guards = branchGuards(t);
    const refSign = guards.map(g => Math.sign(orient2(t.pivots[g[0]], t.pivots[g[1]], t.pivots[g[2]])));
    const onFold = Solver._flipsAnyGuard(t.pivots, guards, refSign);     // current pose: same fold → no flip
    // mirror one dyad joint across its bar-neighbour line → flips that triple's sign
    const tri0 = guards[0];
    const saved = { x: t.pivots[tri0[1]].x, y: t.pivots[tri0[1]].y };
    const p0 = t.pivots[tri0[0]], p2 = t.pivots[tri0[2]];               // the chord endpoints
    const mx = (p0.x + p2.x) / 2, my = (p0.y + p2.y) / 2;
    t.pivots[tri0[1]].x = 2 * mx - saved.x; t.pivots[tri0[1]].y = 2 * my - saved.y; // reflect through chord midpoint
    const flipped = Solver._flipsAnyGuard(t.pivots, guards, refSign);
    t.pivots[tri0[1]].x = saved.x; t.pivots[tri0[1]].y = saved.y;

    ck('④ BRANCH TRACKING: across a full rotation of both presets every fold holds (0 flips) AND the guard provably rejects a flip',
      totalFlips === 0 && allClosed && onFold === false && flipped === true,
      'sweep flips=' + totalFlips + ' allClosed=' + allClosed + ' guard{onFold→' + onFold + ', flippedPose→' + flipped + '}');
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// ===== END MECHANISM-BENCH CORE =====

export {
  TAU, dist, orient2,
  Solver, Cog, invertPoint,
  makeTable, addPivot, addBar, recomputeDriver, setDriverAngle, pinnedSet, branchGuards,
  PRESETS, loadPreset,
  mobility, effectiveMobility, detectFourbar, grashof, crankable,
  lineFitMaxDev, peauRange, runSelfTest,
};
