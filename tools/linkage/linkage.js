/* ═══════════════════════════════════════════════════════════════════════════
   linkage.js — the Straightedge's pure, DOM-free planar-KINEMATICS core.

   A planar linkage is a set of rigid BARS (fixed-length segments) joined by pin
   joints, with some joints PINNED to the ground (fixed pivots) and one DRIVER
   (a crank angle θ). Given θ, solve() computes every joint's (x,y) and the pen
   point P. trace() sweeps θ and collects the pen locus. Everything here is
   closed-form (no iterative solver) so the geometry is exact to machine
   precision — the soul of the piece is that the Peaucellier pen draws a
   *mathematically exact* straight line, not an approximate one.

   THE HERO — Peaucellier–Lipkin (1864), the first exact straight-line linkage.
   A fixed pivot O; two equal long bars O→A, O→B of length L; a rhombus A–Q–B–P
   of four equal bars of length ℓ (P and Q are the rhombus's opposite corners,
   A and B the others). Then O, Q, P are always COLLINEAR and

       |OP| · |OQ| = L² − ℓ²   (a constant: P is the circle-INVERSE of Q in the
                                circle of radius √(L²−ℓ²) about O).

   Inversive geometry's gift: the inverse of a circle through the centre O is a
   straight LINE. So if Q is driven around a circle that PASSES THROUGH O (a
   crank of length r about a centre C with |OC| = r), its inverse P traces an
   exact straight line, perpendicular to OC. Pure circular motion in → exact
   linear motion out, with nothing but pin-joints and rods.

   THE COMPANION (its own kind of exact):
     • four-bar — a Grashof crank-rocker; the coupler point traces a rich
       algebraic "coupler curve" (a foil to the Peaucellier's dead-straight
       line). Solved by circle∩circle (the two-bar dyad); every bar's length is
       preserved to machine precision through a full crank rotation.

   Vanilla, ES5-ish, deterministic, zero-dependency. Dual-use: attaches a
   `Linkage` global in a browser and exports the same object under Node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Linkage = {};

  /* ── tiny 2-D vector helpers (plain {x,y} objects) ───────────────────────── */
  function V(x, y) { return { x: x, y: y }; }
  function add(a, b) { return V(a.x + b.x, a.y + b.y); }
  function sub(a, b) { return V(a.x - b.x, a.y - b.y); }
  function scale(a, s) { return V(a.x * s, a.y * s); }
  function dot(a, b) { return a.x * b.x + a.y * b.y; }
  function len2(a) { return a.x * a.x + a.y * a.y; }
  function len(a) { return Math.sqrt(len2(a)); }
  function dist(a, b) { return len(sub(a, b)); }
  function dist2(a, b) { return len2(sub(a, b)); }
  function fromAngle(c, r, th) { return V(c.x + r * Math.cos(th), c.y + r * Math.sin(th)); }

  Linkage.V = V;
  Linkage.vec = { add: add, sub: sub, scale: scale, dot: dot, len: len, dist: dist, fromAngle: fromAngle };

  /* ── geometry: circle inversion ──────────────────────────────────────────
     P = invert(Q, O, k2):  the inverse of Q in the circle of radius √k2 about O.
     O, Q, P collinear (same ray from O) and |OP|·|OQ| = k2. Exact. */
  function invert(q, o, k2) {
    var d = sub(q, o);
    var dd = len2(d);
    if (dd < 1e-300) return null; // Q at the centre — inverse at infinity
    var f = k2 / dd;
    return V(o.x + d.x * f, o.y + d.y * f);
  }
  Linkage.invert = invert;

  /* ── geometry: intersection of two circles ───────────────────────────────
     Circles (c0, r0) and (c1, r1). Returns the two intersection points as
     {a, b} (a = "left" of c0→c1, b = "right"), or null if they don't meet.
     The classic radical-line construction — exact, no iteration. */
  function circleCircle(c0, r0, c1, r1) {
    var d = dist(c0, c1);
    if (d < 1e-12) return null;                 // concentric
    if (d > r0 + r1 + 1e-12) return null;       // too far apart
    if (d < Math.abs(r0 - r1) - 1e-12) return null; // one inside the other
    // a = distance from c0 to the foot of the chord along c0→c1
    var a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    var h2 = r0 * r0 - a * a;
    if (h2 < 0) h2 = 0;                          // tangent / rounding
    var h = Math.sqrt(h2);
    var ux = (c1.x - c0.x) / d, uy = (c1.y - c0.y) / d; // unit c0→c1
    var px = c0.x + a * ux, py = c0.y + a * uy;          // foot
    // perpendicular ±(−uy, ux)·h
    return {
      a: V(px - h * uy, py + h * ux),
      b: V(px + h * uy, py - h * ux)
    };
  }
  Linkage.circleCircle = circleCircle;

  /* ── geometry: least-squares line fit + max perpendicular deviation ───────
     Fits the best line to a point set via the covariance/PCA eigenvector
     (handles vertical & horizontal lines uniformly), then returns the line
     (point + unit direction) and the MAX perpendicular distance of any point
     to it. For an exact straight-line linkage this max deviation is ~machine
     epsilon — that single number is the headline proof. */
  function lineFit(pts) {
    var n = pts.length, i;
    if (n < 2) return { ok: false, maxDev: 0, rms: 0 };
    var mx = 0, my = 0;
    for (i = 0; i < n; i++) { mx += pts[i].x; my += pts[i].y; }
    mx /= n; my /= n;
    var sxx = 0, syy = 0, sxy = 0, dx, dy;
    for (i = 0; i < n; i++) {
      dx = pts[i].x - mx; dy = pts[i].y - my;
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    }
    // largest eigenvector of [[sxx,sxy],[sxy,syy]] = the line's direction.
    var tr = sxx + syy, det = sxx * syy - sxy * sxy;
    var disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    var l1 = tr / 2 + disc; // largest eigenvalue
    var ex, ey;
    if (Math.abs(sxy) > 1e-300) { ex = l1 - syy; ey = sxy; }
    else { if (sxx >= syy) { ex = 1; ey = 0; } else { ex = 0; ey = 1; } }
    var el = Math.sqrt(ex * ex + ey * ey) || 1;
    ex /= el; ey /= el;
    // normal = perpendicular to direction
    var nx = -ey, ny = ex;
    var maxDev = 0, sse = 0, pd;
    for (i = 0; i < n; i++) {
      pd = (pts[i].x - mx) * nx + (pts[i].y - my) * ny; // signed perp distance
      if (Math.abs(pd) > maxDev) maxDev = Math.abs(pd);
      sse += pd * pd;
    }
    return {
      ok: true,
      point: V(mx, my),
      dir: V(ex, ey),
      normal: V(nx, ny),
      maxDev: maxDev,
      rms: Math.sqrt(sse / n)
    };
  }
  Linkage.lineFit = lineFit;

  /* =====================================================================
     PEAUCELLIER–LIPKIN — the exact straight-line linkage (the hero).

     params: { O, C, r, L, ell, branch }
       O    : fixed inversion pivot           (default origin)
       C    : crank centre (fixed pivot)      (default {x:-r, y:0} ⇒ |OC|=r)
       r    : crank length |CQ|
       L    : long-bar length  |OA| = |OB|
       ell  : rhombus side     |AQ|=|QB|=|BP|=|PA|
       branch: which rhombus fold (+1 / −1), kept constant so the motion is
               continuous.

     For the STRAIGHT LINE we require |OC| = r exactly, so Q's circle passes
     through O. The piece's defaults guarantee this; the page clamps lengths to
     keep it true. (L > ell is required so k2 = L²−ell² > 0 and the rhombus can
     close: |OQ| must stay in a range where circle(O,L)∩circle(Q,ell) exists.)
     ===================================================================== */
  function peaucellier(theta, params) {
    params = params || {};
    var O = params.O || V(0, 0);
    var r = params.r != null ? params.r : 1.0;
    // crank centre defaults to distance r from O along −x, so the circle passes
    // through O (the straight-line condition |OC| = r).
    var C = params.C || V(O.x - r, O.y);
    var L = params.L != null ? params.L : 2.6;
    var ell = params.ell != null ? params.ell : 1.6;
    var branch = params.branch === -1 ? -1 : 1;
    var k2 = L * L - ell * ell; // the inversion constant L²−ℓ²

    // 1. crank drives Q around C
    var Q = fromAngle(C, r, theta);

    // 2. P is the exact circle-inverse of Q in the circle √k2 about O
    var P = invert(Q, O, k2);
    if (!P) P = V(O.x, O.y); // Q == O degenerate (measure-zero; only if r huge)

    // 3. the rhombus corners A, B = circle(O,L) ∩ circle(Q,ell).
    //    (They equally satisfy circle(P,ell); using Q is the canonical build.)
    var hit = circleCircle(O, L, Q, ell);
    var A, B;
    if (hit) {
      // branch picks a consistent fold so the rhombus doesn't flip mid-motion
      if (branch === 1) { A = hit.a; B = hit.b; }
      else { A = hit.b; B = hit.a; }
    } else {
      // out of closeable range — degrade gracefully to the inversion line
      A = V((O.x + Q.x) / 2, (O.y + Q.y) / 2);
      B = A;
    }

    return {
      joints: { O: O, C: C, Q: Q, A: A, B: B, P: P },
      penPoint: P,
      // bars as [from,to] joint-name pairs for renderer + loop-closure test
      bars: [
        ['C', 'Q'],   // crank
        ['O', 'A'], ['O', 'B'],   // the two equal long bars
        ['A', 'Q'], ['Q', 'B'], ['B', 'P'], ['P', 'A'] // the rhombus (ℓ ×4)
      ],
      fixed: ['O', 'C'],
      meta: { k2: k2, OQ: dist(O, Q), OP: dist(O, P) }
    };
  }
  Linkage.peaucellier = peaucellier;

  /* Default Peaucellier params (also the page's opening config). |OC| = r so the
     pen draws an exact straight line. */
  Linkage.peaucellierDefaults = function () {
    var r = 1.0;
    return { O: V(0, 0), C: V(-r, 0), r: r, L: 2.6, ell: 1.6, branch: 1 };
  };

  /* The angular range over which the Peaucellier rhombus stays closeable for a
     given param set. Q rides a circle of radius r about C with |OC|=r, so
     |OQ| = 2r·|sin(θ/2)| ∈ [0, 2r]; the rhombus closes while
        |L − ell| ≤ |OQ| ≤ L + ell.
     With L>ell the lower bound bites near θ≈0 (Q≈O). We return the [lo,hi]
     sub-arc (symmetric about π) that is safely closeable, for the driver sweep. */
  Linkage.peaucellierRange = function (params) {
    params = params || Linkage.peaucellierDefaults();
    var r = params.r, L = params.L, ell = params.ell;
    var oc = params.C ? dist(params.O || V(0, 0), params.C) : r;
    // |OQ|² = oc² + r² − 2·oc·r·cos θ  (law of cosines). Solve for the θ where
    // |OQ| = L−ell (min closeable) — that bounds the arc away from θ=0.
    var lo = L - ell;
    // cos θ for |OQ| = lo:
    var cosMin = (oc * oc + r * r - lo * lo) / (2 * oc * r);
    var thMin = (cosMin >= 1) ? 0 : (cosMin <= -1 ? Math.PI : Math.acos(cosMin));
    // pull in a hair for numerical headroom
    var pad = 0.04;
    var a = thMin + pad;
    return { lo: a, hi: 2 * Math.PI - a };
  };

  /* =====================================================================
     FOUR-BAR linkage (crank-rocker). Ground O0—O1 (length g). Input crank
     O0→A (length a) driven by θ. Coupler A→B (length b). Output rocker
     O1→B (length c). Coupler POINT P fixed in the coupler frame at
     (cx, cy) in coupler-local coords (cx along A→B, cy perpendicular).

     Solved by the dyad: B = circle(A,b) ∩ circle(O1,c). Returns the
     "open" or "crossed" branch consistently.
     params: { O0, O1, a, b, c, cx, cy, branch }
     ===================================================================== */
  function fourbar(theta, params) {
    params = params || {};
    var O0 = params.O0 || V(0, 0);
    var O1 = params.O1 || V(2.0, 0);
    var a = params.a != null ? params.a : 1.0;
    var b = params.b != null ? params.b : 2.4;
    var c = params.c != null ? params.c : 2.2;
    var cx = params.cx != null ? params.cx : 1.2;
    var cy = params.cy != null ? params.cy : 1.0;
    var branch = params.branch === -1 ? -1 : 1;

    var A = fromAngle(O0, a, theta);
    var hit = circleCircle(A, b, O1, c);
    var B;
    if (hit) B = (branch === 1 ? hit.a : hit.b);
    else B = V((A.x + O1.x) / 2, (A.y + O1.y) / 2); // non-Grashof dead spot

    // coupler frame: ux along A→B, uy perpendicular. Pen at A + cx·ux + cy·uy.
    var d = sub(B, A), dl = len(d) || 1;
    var ux = V(d.x / dl, d.y / dl), uy = V(-ux.y, ux.x);
    var P = V(A.x + cx * ux.x + cy * uy.x, A.y + cx * ux.y + cy * uy.y);

    return {
      joints: { O0: O0, O1: O1, A: A, B: B, P: P },
      penPoint: P,
      bars: [['O0', 'A'], ['A', 'B'], ['O1', 'B'], ['A', 'P'], ['B', 'P']],
      fixed: ['O0', 'O1'],
      meta: {}
    };
  }
  Linkage.fourbar = fourbar;
  Linkage.fourbarDefaults = function () {
    return { O0: V(0, 0), O1: V(2.0, 0), a: 1.0, b: 2.4, c: 2.2, cx: 1.2, cy: 1.0, branch: 1 };
  };

  /* A four-bar is a CRANK-ROCKER (input fully rotates) iff Grashof holds with the
     shortest link being the input crank: s + l ≤ p + q. We expose a predicate so
     the page can clamp lengths to a fully-rotating config. */
  Linkage.fourbarGrashofCrank = function (params) {
    var g = dist(params.O0 || V(0, 0), params.O1 || V(2, 0));
    var a = params.a, b = params.b, c = params.c;
    var links = [a, b, c, g].slice().sort(function (x, y) { return x - y; });
    // shortest must be the crank `a`, and Grashof: shortest+longest <= sum others
    var s = links[0], l = links[3];
    return (a === s) && (s + l <= links[1] + links[2] + 1e-12);
  };

  /* =====================================================================
     ROBERTS–CHEBYSHEV COGNATES — the closed-form construction.

     THE THEOREM (Roberts 1875 / Chebyshev). A four-bar's coupler point P
     traces a coupler curve. There exist exactly TWO OTHER four-bars — the
     "cognates" — whose coupler points trace the BYTE-IDENTICAL curve. The
     three share the coupler point but use different bars and a third ground
     pivot, so one curve is drawn three ways. (The classic demonstration:
     the Roberts configuration, three linkages, one locus.)

     THE CONSTRUCTION (the DIRECTION form — exact under any drag). Solve the
     original four-bar at crank angle θ for joints A, B, P (P = coupler point).
     Take the four link UNIT-directions and the complex shape ratio of the
     coupler triangle:

         u2 = unit(A − O0)   (crank)
         u3 = unit(B − A)    (coupler)
         u4 = unit(B − O1)   (output)
         λ  = (P − A) / (B − A)   (a COMPLEX number — the coupler triangle's shape)

     Then the cognates' joints fall out as exact complex maps off the SOLVED
     original (a, b, c = crank/coupler/output lengths):

         O2 = O0 + λ·(O1 − O0)              (the third ground pivot)
         LEFT cognate:  E   = O2 + a·(1−λ)·u2     (its coupler-side joint)
                        P_L = E + λ·c·u4
         RIGHT cognate: P_R = B + (λ−1)·b·u3

     LANDMINE (verified offline): a·(1−λ) is COMPLEX, so E is placed by a
     complex MULTIPLY of (1−λ) with the crank direction u2 — NEVER a scaled
     real direction. Get that wrong and the left cognate drifts off the curve.

     WHY THE DIRECTION FORM (vs a stored Cayley joint set): because λ, u2..u4
     are recomputed LIVE from the solved original each call, the cognates stay
     EXACT when a ground pivot is dragged or the pen offset slides — there is no
     cached q to re-sync. P_L and P_R coincide with P to ~1e-15 across a full
     crank sweep, and every cognate bar holds its length to machine-ε.

     params: the SAME object fourbar() takes ({ O0, O1, a, b, c, cx, cy, branch }).
     Returns null at a dead pose (the dyad doesn't close). Otherwise:
       { O0, O1, O2, A, B, E, P, Pleft, Pright, lambda, u2, u3, u4 }
     where P, Pleft, Pright are the three (coincident) pen points and the
     joints let a renderer draw all three linkages. ===================== */
  // tiny complex helpers (plain {re,im}); kept local so the public vec API
  // (which is {x,y}) is untouched. A planar point {x,y} maps to {re:x, im:y}.
  function cx_(z) { return { re: z.x, im: z.y }; }          // {x,y} → complex
  function xy_(z) { return V(z.re, z.im); }                 // complex → {x,y}
  function cmul_(z, w) { return { re: z.re * w.re - z.im * w.im, im: z.re * w.im + z.im * w.re }; }
  function cadd_(z, w) { return { re: z.re + w.re, im: z.im + w.im }; }
  function csub_(z, w) { return { re: z.re - w.re, im: z.im - w.im }; }
  function cscl_(z, s) { return { re: z.re * s, im: z.im * s }; }
  function cabs_(z) { return Math.sqrt(z.re * z.re + z.im * z.im); }
  function cunit_(z) { var m = cabs_(z) || 1; return { re: z.re / m, im: z.im / m }; }
  // exact complex division z/w (conjugate form — no trig)
  function cdiv_(z, w) { var d = w.re * w.re + w.im * w.im; return { re: (z.re * w.re + z.im * w.im) / d, im: (z.im * w.re - z.re * w.im) / d }; }

  Linkage.cognates = function (theta, params) {
    params = params || Linkage.fourbarDefaults();
    var sol = fourbar(theta, params);
    var O0 = cx_(sol.joints.O0), O1 = cx_(sol.joints.O1);
    var A = cx_(sol.joints.A), B = cx_(sol.joints.B), P = cx_(sol.joints.P);
    // dead pose: the dyad couldn't close (fourbar() falls back to the AB midpoint).
    // Detect it the same way the page does — coupler length wrong vs the spec b.
    var bNow = dist(sol.joints.A, sol.joints.B);
    var bWant = params.b != null ? params.b : 2.4;
    if (Math.abs(bNow - bWant) > 1e-6) return null;
    var a = params.a != null ? params.a : 1.0;
    var b = bWant;
    var c = params.c != null ? params.c : 2.2;
    var u2 = cunit_(csub_(A, O0));
    var u3 = cunit_(csub_(B, A));
    var u4 = cunit_(csub_(B, O1));
    var lam = cdiv_(csub_(P, A), csub_(B, A));   // complex shape ratio
    var ONE = { re: 1, im: 0 };
    var O2 = cadd_(O0, cmul_(lam, csub_(O1, O0)));            // third ground pivot
    // LEFT cognate: a·(1−λ) is COMPLEX → place E with a complex multiply
    var E = cadd_(O2, cmul_(cscl_(csub_(ONE, lam), a), u2));
    var Pleft = cadd_(E, cmul_(cscl_(lam, c), u4));
    // RIGHT cognate: pen rides off the shared joint B along the coupler dir
    var Pright = cadd_(B, cmul_(cscl_(csub_(lam, ONE), b), u3));
    return {
      O0: xy_(O0), O1: xy_(O1), O2: xy_(O2),
      A: xy_(A), B: xy_(B), E: xy_(E),
      P: xy_(P), Pleft: xy_(Pleft), Pright: xy_(Pright),
      lambda: { x: lam.re, y: lam.im },
      u2: xy_(u2), u3: xy_(u3), u4: xy_(u4)
    };
  };

  /* cognateTrace() — sweep θ and collect ALL THREE pen loci. Returns
     { original:[…], left:[…], right:[…] } of {x,y}. A dead pose is skipped in
     all three in lockstep so the arrays stay index-aligned. */
  Linkage.cognateTrace = function (params, steps) {
    steps = steps || 360;
    var out = { original: [], left: [], right: [] };
    for (var i = 0; i <= steps; i++) {
      var th = (i / steps) * 2 * Math.PI;
      var g = Linkage.cognates(th, params);
      if (!g) continue;
      out.original.push({ x: g.P.x, y: g.P.y });
      out.left.push({ x: g.Pleft.x, y: g.Pleft.y });
      out.right.push({ x: g.Pright.x, y: g.Pright.y });
    }
    return out;
  };

  /* the cognate bar set at a pose — used by the rigid-bar self-test. Every entry
     is a GENUINE rigid link of one of the three four-bars (a bar whose endpoints
     are pin-joints of that linkage); each must hold its length to machine-ε across
     a full crank sweep. (Connectivity that is NOT a physical bar — e.g. O0→E — is
     deliberately excluded; those distances do change as the truss articulates.) */
  Linkage.cognateBarLengths = function (g) {
    return {
      // ORIGINAL four-bar: crank O0A, coupler AB, output O1B + the coupler triangle
      O0A: dist(g.O0, g.A), AB: dist(g.A, g.B), O1B: dist(g.O1, g.B),
      AP: dist(g.A, g.P), BP: dist(g.B, g.P),
      // LEFT cognate: ground bar O0→O2 (fixed), crank O2→E, output E→Pleft
      O0O2: dist(g.O0, g.O2), O2E: dist(g.O2, g.E), EPL: dist(g.E, g.Pleft),
      // RIGHT cognate: ground bar O1→O2 (fixed) + pen off B along the coupler dir
      O1O2: dist(g.O1, g.O2), BPR: dist(g.B, g.Pright)
    };
  };

  /* =====================================================================
     trace() — sweep θ across a range, return the pen locus (array of {x,y}).
     ===================================================================== */
  Linkage.solvers = { peaucellier: peaucellier, fourbar: fourbar };

  Linkage.solve = function (name, theta, params) {
    var f = Linkage.solvers[name];
    if (!f) throw new Error('unknown linkage: ' + name);
    return f(theta, params);
  };

  Linkage.trace = function (name, params, range, steps) {
    var lo = range && range.lo != null ? range.lo : 0;
    var hi = range && range.hi != null ? range.hi : 2 * Math.PI;
    steps = steps || 240;
    var f = Linkage.solvers[name];
    if (!f) throw new Error('unknown linkage: ' + name);
    var pts = [], i, th, sol;
    for (i = 0; i <= steps; i++) {
      th = lo + (hi - lo) * (i / steps);
      sol = f(th, params);
      pts.push({ x: sol.penPoint.x, y: sol.penPoint.y });
    }
    return pts;
  };

  /* =====================================================================
     barLengths() — measure every bar's current length from a solved config.
     Used by the loop-closure self-test: each must stay constant across θ.
     ===================================================================== */
  Linkage.barLengths = function (sol) {
    var out = [], i, fromN, toN;
    for (i = 0; i < sol.bars.length; i++) {
      fromN = sol.bars[i][0]; toN = sol.bars[i][1];
      out.push(dist(sol.joints[fromN], sol.joints[toN]));
    }
    return out;
  };

  /* fingerprint() — a deterministic, skin-free signature of a solved config:
     all joint coords rounded, joined. Stable across skins (skins never reach
     this core). Used for determinism + skin-invariance tests. */
  Linkage.fingerprint = function (name, theta, params) {
    var sol = Linkage.solve(name, theta, params);
    var names = Object.keys(sol.joints).sort();
    var parts = [], i, j;
    for (i = 0; i < names.length; i++) {
      j = sol.joints[names[i]];
      parts.push(names[i] + ':' + j.x.toFixed(9) + ',' + j.y.toFixed(9));
    }
    return parts.join('|');
  };

  // browser global
  root.Linkage = Linkage;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Linkage; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
