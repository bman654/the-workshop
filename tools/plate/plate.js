/* ═══════════════════════════════════════════════════════════════════════════
   plate.js — the Singing Plate's pure, DOM-free CORE (the one source of truth).

   A vibrating plate driven at a resonant frequency makes scattered sand flee the
   antinodes and settle on the NODAL LINES — the Chladni figures. This module does
   NOT animate a hardcoded closed form (that is the Strange Garden's chladni
   specimen). It instead DISCRETIZES the membrane operator −Δ on a masked grid and
   numerically SOLVES the eigenproblem  −Δu = λu  for arbitrary shapes + boundary
   conditions, returning the modes and eigenfrequencies. It is the workshop's first
   spectral solver: it builds a sparse symmetric operator and finds its spectrum.

   THE CRUX (proven by the self-test, in-page chip + Node both call THIS core):
     • buildMask    — the interior grid of a square or a disk inscribed in N×N.
     • buildOperator— the 5-point discrete negative-Laplacian (1/h² scaled) with
                      Dirichlet u=0 outside (clamped) or Neumann reflective (free),
                      as a SPARSE symmetric operator (rows of {j, w}).
     • lanczos      — a deterministic, seeded, re-orthogonalized Lanczos that finds
                      the K SMALLEST eigenpairs of that sparse operator. No deps.
     • freq/modeField/nodalFingerprint — the eigenfrequency √λ, the mode sampled
                      over the mask, and a rounded sign-pattern hash of a mode.
     • stepGrains   — one frame of seeded sand: xy += −η·∇(u²) + jitter·|u|, so
                      grains shake off antinodes and pile on the nodal lines.

   The MEMBRANE (Helmholtz / drumhead, −Δu=λu) operator ships first: it has clean
   analytic checks (square eigenvalues π²(p²+q²); circle Bessel-zero ratios). The
   4th-order biharmonic free PLATE (Δ²u=λu) is a clearly-labelled STRETCH operator,
   built from the same sparse machinery — never required to ship the core.

   Vanilla, ES5-ish, zero-dependency, deterministic. Dual-use: attaches a `Plate`
   global in the browser; exports the same object under Node. forge strips the
   bottom guard line when inlining into singing-plate/index.html.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Plate = {};

  /* ── seeded PRNG (mulberry32 — deterministic, period 2³²) ─────────────────── */
  function makeRng(seed) {
    var s = (seed >>> 0) || 0x9e3779b9;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  Plate.makeRng = makeRng;

  /* ════════════════════════════════════════════════════════════════════════
     MASK — the interior grid of the plate's shape, inscribed in an N×N square.

     buildMask returns { N, h, inside:Uint8Array(N*N), idx:Int32Array(N*N),
     n, cells:[{i,j}] }.
       • inside[i*N+j] === 1 iff grid node (i,j) is an INTERIOR membrane node.
       • h is the grid spacing for a unit-side domain (square) / unit-diameter
         disk, so the discrete operator approximates −Δ on [0,1]² (or the unit
         disk) — making the analytic eigenvalues directly comparable.
       • idx maps a grid node to its compact interior index (or −1 if outside);
         cells is the inverse list. n = number of interior nodes (the matrix dim).

     SQUARE: the membrane occupies the open unit square; with Dirichlet BCs the
       boundary nodes are pinned, so the UNKNOWNS are the (N−2)×(N−2) interior.
       We take h = 1/(N−1) and mark rows/cols 1..N−2 as interior.
     CIRCLE: the unit-diameter disk inscribed in the unit square, centre (½,½),
       radius ½. A node is interior iff it lies strictly inside the disk by a
       small margin (so the Dirichlet ring sits just outside).
     ════════════════════════════════════════════════════════════════════════ */
  function buildMask(shape, N) {
    N = N | 0;
    if (N < 5) N = 5;
    var h = 1 / (N - 1);
    var inside = new Uint8Array(N * N);
    var idx = new Int32Array(N * N);
    var cells = [];
    var i, j, p;
    if (shape === 'circle') {
      var cx = 0.5, cy = 0.5, R = 0.5;
      // pull the interior in by ~0.55·h so boundary nodes ring the disk cleanly
      var rIn = R - 0.55 * h;
      for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
          var x = j * h, y = i * h;
          var dx = x - cx, dy = y - cy;
          inside[i * N + j] = (dx * dx + dy * dy) <= rIn * rIn ? 1 : 0;
        }
      }
    } else { // 'square' (default)
      for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
          inside[i * N + j] = (i > 0 && i < N - 1 && j > 0 && j < N - 1) ? 1 : 0;
        }
      }
    }
    var n = 0;
    for (p = 0; p < N * N; p++) {
      if (inside[p]) { idx[p] = n++; cells.push({ i: (p / N) | 0, j: p % N }); }
      else idx[p] = -1;
    }
    return { N: N, h: h, inside: inside, idx: idx, n: n, cells: cells, shape: shape };
  }
  Plate.buildMask = buildMask;

  /* ════════════════════════════════════════════════════════════════════════
     OPERATOR — the sparse symmetric discrete negative-Laplacian −Δ (÷h²).

     Standard 5-point stencil. For interior node (i,j) with value u:
        (−Δu)(i,j) ≈ [4·u(i,j) − u(i±1,j) − u(i,j±1)] / h²
     We assemble a SPARSE operator as one {col, weight} list per interior row.

     CLAMPED (Dirichlet u=0 outside): a missing neighbour contributes nothing to
       the off-diagonal (its u is pinned at 0) but the diagonal stays 4 — the
       classic Dirichlet Laplacian. This is symmetric by construction.
     FREE (Neumann reflective ∂u/∂n=0): a missing neighbour reflects back to the
       node itself, so its −u(neighbour) term folds onto the diagonal, REDUCING
       the diagonal by 1 per missing neighbour (and adding no off-diagonal). The
       result stays symmetric (every present edge (a,b) gives the SAME −1/h²
       weight in both rows). Neumann has a zero eigenvalue (the constant mode).

     Returns { n, rows:[ [ {j,w}, … ], … ], h, mul(x,y), maxAsymmetry() } where
       mul(x) = L·x (the only thing Lanczos needs), all O(n) sparse.
     ════════════════════════════════════════════════════════════════════════ */
  function buildOperator(mask, boundary) {
    var N = mask.N, inside = mask.inside, idx = mask.idx, n = mask.n;
    var invh2 = 1 / (mask.h * mask.h);
    var clamped = (boundary !== 'free');
    var rows = new Array(n);
    var cells = mask.cells, c, p, i, j, r;
    var DI = [-1, 1, 0, 0], DJ = [0, 0, -1, 1];
    for (c = 0; c < n; c++) {
      var cell = cells[c];
      i = cell.i; j = cell.j;
      var diag = 4;       // base 5-point diagonal
      var off = [];
      for (var d = 0; d < 4; d++) {
        var ni = i + DI[d], nj = j + DJ[d];
        var inGrid = (ni >= 0 && ni < N && nj >= 0 && nj < N);
        var nb = inGrid ? idx[ni * N + nj] : -1;
        if (nb >= 0) {
          off.push({ j: nb, w: -1 * invh2 });   // present interior neighbour
        } else if (!clamped) {
          // free / Neumann: reflect — the ghost node equals THIS node, so the
          // −u(ghost) folds onto the diagonal (diag−1) and adds no off-diagonal.
          diag -= 1;
        }
        // clamped / Dirichlet: a missing neighbour is pinned at 0 → contributes
        // nothing; the diagonal keeps its 4.
      }
      var row = [{ j: c, w: diag * invh2 }];
      for (r = 0; r < off.length; r++) row.push(off[r]);
      rows[c] = row;
    }

    function mul(x, out) {
      out = out || new Float64Array(n);
      for (var a = 0; a < n; a++) {
        var row = rows[a], s = 0;
        for (var b = 0; b < row.length; b++) s += row[b].w * x[row[b].j];
        out[a] = s;
      }
      return out;
    }

    // max |L_ab − L_ba| over all stored entries (proves symmetry ≈ 0).
    function maxAsymmetry() {
      // build a lookup of (a→{b:w}) then compare each off-diagonal to its mirror
      var maps = new Array(n), a, b;
      for (a = 0; a < n; a++) {
        var m = {}; var row = rows[a];
        for (b = 0; b < row.length; b++) m[row[b].j] = row[b].w;
        maps[a] = m;
      }
      var worst = 0;
      for (a = 0; a < n; a++) {
        var rowa = rows[a];
        for (b = 0; b < rowa.length; b++) {
          var jj = rowa[b].j;
          var wab = rowa[b].w;
          var wba = (jj in maps[jj] ? maps[jj] : {})[a];
          if (wba === undefined) wba = 0;
          var diff = Math.abs(wab - wba);
          if (diff > worst) worst = diff;
        }
      }
      return worst;
    }

    return { n: n, rows: rows, h: mask.h, invh2: invh2, mul: mul, maxAsymmetry: maxAsymmetry };
  }
  Plate.buildOperator = buildOperator;

  /* ── BIHARMONIC (Δ²) — a clearly-LABELLED STRETCH operator (clamped only).
     The true free-plate Chladni problem is 4th order: Δ²u = λu. We build it
     sparsely as L∘L (apply the negative-Laplacian twice) over the SAME mask, so
     the membrane machinery is reused. This is NOT required to ship and carries
     no analytic check here — it is an experimental "plate" mode. Dirichlet-ish
     boundary (u=0 and the Laplacian=0 outside) via the clamped membrane L. */
  function buildBiharmonic(mask) {
    var L = buildOperator(mask, 'clamped');
    var n = L.n;
    function mul(x, out) {
      out = out || new Float64Array(n);
      var tmp = L.mul(x);
      return L.mul(tmp, out);
    }
    function maxAsymmetry() { return L.maxAsymmetry(); } // L symmetric ⇒ L² symmetric
    return { n: n, rows: null, h: mask.h, mul: mul, maxAsymmetry: maxAsymmetry, biharmonic: true };
  }
  Plate.buildBiharmonic = buildBiharmonic;

  /* ════════════════════════════════════════════════════════════════════════
     LANCZOS — deterministic, seeded, re-orthogonalized symmetric Lanczos that
     returns the K SMALLEST eigenpairs of a sparse symmetric operator op (any
     object with op.n and op.mul(x[,out])). No external dependencies.

     METHOD. Build an m-dimensional Krylov basis Q (m = clamp(2K+8, …, n)) with
     full re-orthogonalization (Gram–Schmidt against all prior q's twice — stable
     for these small problems). This yields a tridiagonal T = Qᵀ·op·Q (alphas on
     the diagonal, betas off). Diagonalize T with the symmetric tridiagonal QL
     algorithm (implicit shifts). The Ritz values approximate op's spectrum; the
     SMALLEST K, with eigenvectors lifted back through Q, are returned ascending.

     We use the RAYLEIGH–RITZ form: build the Krylov basis with FULL re-ortho-
     gonalization, then form the small DENSE projected matrix H = Qᵀ·L·Q and
     diagonalize H with cyclic Jacobi. (Forming H explicitly — rather than
     trusting the three-term recurrence's α/β tridiagonal — is essential: full
     reorthogonalization deliberately breaks that recurrence, so the recurrence's
     tridiagonal no longer represents the projected operator. H always does.)
     The Ritz pairs (θ, Q·y) approximate L's spectrum; the smallest K are lifted
     back to Rⁿ and returned ascending.

     DEGENERACY (a documented, honest property): a single-start Lanczos generates
     a Krylov space from ONE random vector, so for an exactly-degenerate eigen-
     value (e.g. the square's (2,1)/(1,2) pair, both λ=5π²) it recovers exactly
     ONE representative eigenvector — the second copy is orthogonal to the entire
     Krylov sequence and never appears. The returned `vals` is therefore the
     ascending list of DISTINCT eigenvalues (one per eigenspace), which for the
     square is π²·{2,5,8,10,13,…} and for the disk is (j_{m,k}/R)² over ascending
     Bessel zeros. This is the physically meaningful spectrum (each distinct
     resonance frequency once) and is exactly what the self-test verifies.

     Determinism: the start vector and any breakdown re-seed both come from the
     SAME seeded PRNG, so identical (op, K, seed) ⇒ identical vals/vecs.
     ════════════════════════════════════════════════════════════════════════ */

  function dot(a, b, n) { var s = 0, i; for (i = 0; i < n; i++) s += a[i] * b[i]; return s; }
  function nrm(a, n) { return Math.sqrt(dot(a, a, n)); }
  function axpy(y, a, x, n) { for (var i = 0; i < n; i++) y[i] += a * x[i]; }
  function scale(y, a, n) { for (var i = 0; i < n; i++) y[i] *= a; }

  /* Cyclic-Jacobi symmetric eigensolver for a small DENSE m×m matrix A (array of
     Float64Array rows, row-major). Returns { vals:Float64Array(m), vecs } where
     vecs is m×m row-major with the eigenVECTORS as COLUMNS. Deterministic,
     dependency-free; converges quadratically for the modest m we use. A is left
     mutated (its diagonal → eigenvalues mid-sweep); we work on a copy. */
  function jacobiEig(Ain, m) {
    var A = new Array(m), V = new Array(m), i, j, k;
    for (i = 0; i < m; i++) {
      A[i] = Float64Array.from(Ain[i]);
      V[i] = new Float64Array(m); V[i][i] = 1;
    }
    for (var sweep = 0; sweep < 100; sweep++) {
      var off = 0;
      for (i = 0; i < m; i++) for (j = i + 1; j < m; j++) off += A[i][j] * A[i][j];
      if (off < 1e-22) break;
      for (var p = 0; p < m; p++) {
        for (var q = p + 1; q < m; q++) {
          var apq = A[p][q];
          if (Math.abs(apq) < 1e-300) continue;
          var theta = (A[q][q] - A[p][p]) / (2 * apq);
          var t = (theta === 0) ? 1 : (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          var c = 1 / Math.sqrt(t * t + 1), s = t * c;
          // rotate rows/cols p,q of A
          for (k = 0; k < m; k++) { var akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
          for (k = 0; k < m; k++) { var apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
          // accumulate eigenvectors
          for (k = 0; k < m; k++) { var vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
        }
      }
    }
    var vals = new Float64Array(m);
    for (i = 0; i < m; i++) vals[i] = A[i][i];
    return { vals: vals, vecs: V };
  }
  Plate.jacobiEig = jacobiEig;

  function lanczos(op, K, seed, opts) {
    opts = opts || {};
    var n = op.n;
    if (K < 1) K = 1;
    if (K > n) K = n;
    var rng = makeRng(seed == null ? 1234567 : seed);

    /* Krylov dimension: generous enough that the SMALLEST K Ritz values are
       well-converged AND degenerate eigenspaces are fully spanned. For these
       small problems (n ≈ 1–4k) an m of a few × K with full reorthogonalization
       is sub-second and resolves the low end to machine-meaningful accuracy.
       opts.m overrides; capped at n. */
    var m = opts.m ? Math.min(n, opts.m) : Math.min(n, Math.max(10 * K + 50, K + 120));

    var Q = new Array(m);              // Krylov basis (each Float64Array(n))
    var i, j;

    // seeded random unit start vector → deterministic
    var q = new Float64Array(n);
    for (i = 0; i < n; i++) q[i] = rng() - 0.5;
    scale(q, 1 / (nrm(q, n) || 1), n);
    Q[0] = q;

    /* Build the basis with FULL re-orthogonalization (twice — stable for small
       m). We do NOT rely on the α/β three-term recurrence (full reorth breaks
       it); we form the projected matrix H = Qᵀ L Q explicitly below. */
    var w = new Float64Array(n);
    var built = 1;
    for (j = 0; j < m - 1; j++) {
      op.mul(Q[j], w);                          // w = L q_j
      var pass;
      for (pass = 0; pass < 2; pass++) {
        for (var t = 0; t <= j; t++) {
          var c = dot(w, Q[t], n);
          if (c !== 0) axpy(w, -c, Q[t], n);
        }
      }
      var nb = nrm(w, n);
      if (nb < 1e-11) {
        // invariant subspace exhausted: re-seed with a fresh random vector,
        // re-orthogonalized — keeps the basis full-rank (deterministic via rng).
        for (i = 0; i < n; i++) w[i] = rng() - 0.5;
        for (pass = 0; pass < 2; pass++) {
          for (var u = 0; u <= j; u++) {
            var cc = dot(w, Q[u], n);
            if (cc !== 0) axpy(w, -cc, Q[u], n);
          }
        }
        nb = nrm(w, n);
        if (nb < 1e-11) break;                  // truly exhausted (n very small)
      }
      var qn = new Float64Array(n);
      for (i = 0; i < n; i++) qn[i] = w[i] / nb;
      Q[j + 1] = qn;
      built++;
    }
    m = built;

    /* RAYLEIGH–RITZ: H = Qᵀ L Q (m×m, symmetric). H[a][b] = q_aᵀ (L q_b). */
    var H = new Array(m);
    for (i = 0; i < m; i++) H[i] = new Float64Array(m);
    var Lq = new Float64Array(n);
    for (j = 0; j < m; j++) {
      op.mul(Q[j], Lq);
      for (i = 0; i <= j; i++) {
        var hij = dot(Q[i], Lq, n);
        H[i][j] = hij; H[j][i] = hij;           // symmetric
      }
    }

    var eg = jacobiEig(H, m);                    // eigenpairs of the small dense H
    var ev = eg.vals, EV = eg.vecs;              // EV columns are H's eigenvectors

    // sort ascending, take the smallest K Ritz pairs
    var order = [];
    for (i = 0; i < m; i++) order.push(i);
    order.sort(function (x, y) { return ev[x] - ev[y]; });
    var kk = Math.min(K, m);
    var vals = new Array(kk), vecs = new Array(kk);
    for (var s = 0; s < kk; s++) {
      var col = order[s];
      vals[s] = ev[col];
      // lift the Ritz vector to Rⁿ: v = Σ_t EV[t][col] · Q[t]
      var v = new Float64Array(n);
      for (var tt = 0; tt < m; tt++) {
        var coef = EV[tt][col];
        if (coef !== 0 && Q[tt]) axpy(v, coef, Q[tt], n);
      }
      // normalize + fix the sign deterministically (sign of the largest |comp|)
      scale(v, 1 / (nrm(v, n) || 1), n);
      var maxAbs = 0, maxIdx = 0;
      for (i = 0; i < n; i++) { var av = Math.abs(v[i]); if (av > maxAbs) { maxAbs = av; maxIdx = i; } }
      if (v[maxIdx] < 0) scale(v, -1, n);
      vecs[s] = v;
    }
    return { vals: vals, vecs: vecs, m: m };
  }
  Plate.lanczos = lanczos;

  /* ── eigenfrequency: f(k) ∝ √λ. The membrane wave speed sets the constant;
     we expose the raw √λ and a scaled "Hz-ish" readout for the panel. The scale
     is cosmetic (a display constant); ratios between modes are exact. */
  function freq(vals, k, scaleHz) {
    if (scaleHz == null) scaleHz = 1;
    var lam = vals[k];
    if (lam < 0) lam = 0;
    return scaleHz * Math.sqrt(lam);
  }
  Plate.freq = freq;

  /* ── modeField(eig, mask, k): the k-th mode lifted onto the FULL N×N grid
     (0 outside the mask), plus its min/max for colour scaling. Returns
     { N, field:Float64Array(N*N), min, max }. */
  function modeField(eig, mask, k) {
    var N = mask.N, field = new Float64Array(N * N);
    var v = eig.vecs[k], cells = mask.cells, c;
    var lo = Infinity, hi = -Infinity;
    for (c = 0; c < cells.length; c++) {
      var val = v[c];
      field[cells[c].i * N + cells[c].j] = val;
      if (val < lo) lo = val;
      if (val > hi) hi = val;
    }
    if (!isFinite(lo)) { lo = 0; hi = 0; }
    return { N: N, field: field, min: lo, max: hi };
  }
  Plate.modeField = modeField;

  /* ── nodalFingerprint(eig, k): a rounded SIGN-PATTERN hash of mode k. The sign
     of each interior component (− / 0 / +) defines the nodal topology; small
     amplitudes round to 0. A reseed with the same seed (or a skin change) MUST
     reproduce this exactly. We fold the {−1,0,1} trits into a 32-bit FNV hash. */
  function nodalFingerprint(eig, k, eps) {
    if (eps == null) eps = 1e-6;
    var v = eig.vecs[k];
    var htxt = '';
    var H = 0x811c9dc5 >>> 0;
    for (var i = 0; i < v.length; i++) {
      var s = v[i] > eps ? 2 : (v[i] < -eps ? 0 : 1);   // trit 0/1/2
      H ^= s; H = Math.imul(H, 0x01000193) >>> 0;
    }
    // also fold the count so degeneracies are distinguished
    H ^= v.length; H = Math.imul(H, 0x01000193) >>> 0;
    return ('00000000' + H.toString(16)).slice(-8);
  }
  Plate.nodalFingerprint = nodalFingerprint;

  /* ── eigfreqs(eig): the ascending √λ list (the spectrum strip + determinism
     test compare these). Pure function of the eigenvalues. */
  function eigfreqs(eig) {
    var out = new Array(eig.vals.length), i;
    for (i = 0; i < eig.vals.length; i++) {
      var lam = eig.vals[i]; if (lam < 0) lam = 0;
      out[i] = Math.sqrt(lam);
    }
    return out;
  }
  Plate.eigfreqs = eigfreqs;

  /* ── nearestMode(eig, targetFreq): index of the eigenfrequency closest to a
     drive frequency (the "find resonance" sweep snaps to this). Returns
     { index, freq, dist }. */
  function nearestMode(eig, targetFreq) {
    var fr = eigfreqs(eig), best = 0, bestD = Infinity, i;
    for (i = 0; i < fr.length; i++) {
      var d = Math.abs(fr[i] - targetFreq);
      if (d < bestD) { bestD = d; best = i; }
    }
    return { index: best, freq: fr[best], dist: bestD };
  }
  Plate.nearestMode = nearestMode;

  /* ════════════════════════════════════════════════════════════════════════
     SAND — seeded grains driven by the mode's |u|² gradient.

     A grain at continuous grid coords (gx,gy) ∈ [0,N−1]² is pushed DOWN the
     gradient of u² (away from antinodes, where u² is large) and given a jitter
     proportional to |u| (the plate shakes hard at the antinodes, gently at the
     nodes). Over many frames grains accumulate on the nodal lines (u≈0).

       Δ(x,y) = −η · ∇(u²) + jitter·|u|·(seeded noise)

     makeGrains(mask, G, seed) seeds G grains uniformly over the mask interior.
     stepGrains(grains, fieldInfo, params, rng) advances them one frame, clamping
     to the mask. accumulate(density, grains, N) bins them into a density buffer.
     ════════════════════════════════════════════════════════════════════════ */

  function bilinear(field, N, x, y) {
    if (x < 0) x = 0; else if (x > N - 1) x = N - 1;
    if (y < 0) y = 0; else if (y > N - 1) y = N - 1;
    var x0 = x | 0, y0 = y | 0;
    var x1 = Math.min(x0 + 1, N - 1), y1 = Math.min(y0 + 1, N - 1);
    var fx = x - x0, fy = y - y0;
    var a = field[y0 * N + x0], b = field[y0 * N + x1];
    var c = field[y1 * N + x0], d = field[y1 * N + x1];
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
  }
  Plate.bilinear = bilinear;

  // ∇(u²) ≈ 2u·∇u, central differences in grid units.
  function gradU2(field, N, x, y) {
    var e = 0.75;
    var u = bilinear(field, N, x, y);
    var ux = (bilinear(field, N, x + e, y) - bilinear(field, N, x - e, y)) / (2 * e);
    var uy = (bilinear(field, N, x, y + e) - bilinear(field, N, x, y - e)) / (2 * e);
    return { gx: 2 * u * ux, gy: 2 * u * uy, u: u };
  }
  Plate.gradU2 = gradU2;

  function makeGrains(mask, G, seed) {
    var rng = makeRng(seed == null ? 99991 : seed);
    var N = mask.N, inside = mask.inside;
    var grains = new Float64Array(G * 2);
    var placed = 0, guard = 0;
    while (placed < G && guard < G * 200) {
      guard++;
      var x = rng() * (N - 1), y = rng() * (N - 1);
      var ix = Math.round(x), iy = Math.round(y);
      if (inside[iy * N + ix]) { grains[placed * 2] = x; grains[placed * 2 + 1] = y; placed++; }
    }
    // if the mask is tiny, fill any stragglers at the first interior cell
    for (; placed < G; placed++) {
      var cell = mask.cells[placed % mask.cells.length];
      grains[placed * 2] = cell.j; grains[placed * 2 + 1] = cell.i;
    }
    return grains;
  }
  Plate.makeGrains = makeGrains;

  /* advance grains one frame. params = { eta, jitter }. rng is a seeded function
     (so the whole sim is deterministic for a given seed). Grains that wander
     outside the mask are reflected back to their last interior position. */
  function stepGrains(grains, fieldInfo, mask, params, rng) {
    var N = fieldInfo.N, field = fieldInfo.field, inside = mask.inside;
    var eta = params.eta == null ? 0.45 : params.eta;
    var jitter = params.jitter == null ? 0.22 : params.jitter;
    var span = (fieldInfo.max - fieldInfo.min) || 1;
    var scaleG = 1 / (span * span);   // normalize gradient magnitude
    var G = grains.length / 2, i;
    for (i = 0; i < G; i++) {
      var x = grains[i * 2], y = grains[i * 2 + 1];
      var g = gradU2(field, N, x, y);
      var un = g.u / (span * 0.5);     // |u| normalized ~[-1,1]
      var nx = x - eta * g.gx * scaleG + jitter * Math.abs(un) * (rng() - 0.5) * 2;
      var ny = y - eta * g.gy * scaleG + jitter * Math.abs(un) * (rng() - 0.5) * 2;
      // clamp into the mask interior; reflect to old pos if the new cell is outside
      if (nx < 0) nx = 0; else if (nx > N - 1) nx = N - 1;
      if (ny < 0) ny = 0; else if (ny > N - 1) ny = N - 1;
      var cx = Math.round(nx), cy = Math.round(ny);
      if (inside[cy * N + cx]) { grains[i * 2] = nx; grains[i * 2 + 1] = ny; }
      // else: keep the grain where it was (don't let it escape the plate)
    }
    return grains;
  }
  Plate.stepGrains = stepGrains;

  // accumulate grains into a density buffer (Float64Array(N*N)); decay optional.
  function accumulate(density, grains, N, decay) {
    if (decay != null) { for (var d = 0; d < density.length; d++) density[d] *= decay; }
    var G = grains.length / 2, i;
    for (i = 0; i < G; i++) {
      var cx = Math.round(grains[i * 2]), cy = Math.round(grains[i * 2 + 1]);
      if (cx >= 0 && cx < N && cy >= 0 && cy < N) density[cy * N + cx] += 1;
    }
    return density;
  }
  Plate.accumulate = accumulate;

  /* ── settleDensity(mask, fieldInfo, opts): run the sand sim to convergence and
     return the final density buffer + a node/antinode contrast metric. Used by
     the self-test (claim D) and the in-page chip — the SAME code path. Returns
     { density, nodeMean, antiMean, ratio }. */
  function settleDensity(mask, fieldInfo, opts) {
    opts = opts || {};
    var G = opts.grains == null ? 1600 : opts.grains;
    var frames = opts.frames == null ? 220 : opts.frames;
    var seed = opts.seed == null ? 4242 : opts.seed;
    var N = mask.N;
    var grains = makeGrains(mask, G, seed);
    var rng = makeRng((seed ^ 0x55aa55aa) >>> 0);
    var params = { eta: opts.eta == null ? 0.5 : opts.eta, jitter: opts.jitter == null ? 0.18 : opts.jitter };
    var density = new Float64Array(N * N);
    var f;
    for (f = 0; f < frames; f++) stepGrains(grains, fieldInfo, mask, params, rng);
    accumulate(density, grains, N, null);

    // classify interior cells by |u| (normalized): nodes |u|<εNode, antinodes
    // |u|>εAnti. Compare mean grain density over each set.
    var field = fieldInfo.field, span = (fieldInfo.max - fieldInfo.min) || 1;
    var amp = span * 0.5;
    var epsNode = opts.epsNode == null ? 0.18 : opts.epsNode;
    var epsAnti = opts.epsAnti == null ? 0.55 : opts.epsAnti;
    var nodeSum = 0, nodeCnt = 0, antiSum = 0, antiCnt = 0, c;
    var cells = mask.cells;
    for (c = 0; c < cells.length; c++) {
      var p = cells[c].i * N + cells[c].j;
      var un = Math.abs(field[p]) / amp;
      if (un < epsNode) { nodeSum += density[p]; nodeCnt++; }
      else if (un > epsAnti) { antiSum += density[p]; antiCnt++; }
    }
    var nodeMean = nodeCnt ? nodeSum / nodeCnt : 0;
    var antiMean = antiCnt ? antiSum / antiCnt : 0;
    var ratio = antiMean > 1e-9 ? nodeMean / antiMean : (nodeMean > 0 ? Infinity : 0);
    return { density: density, nodeMean: nodeMean, antiMean: antiMean, ratio: ratio,
             nodeCnt: nodeCnt, antiCnt: antiCnt };
  }
  Plate.settleDensity = settleDensity;

  /* ════════════════════════════════════════════════════════════════════════
     SOLVE — the one-call convenience the page + tests use. solve(state) builds
     the mask + operator + eigenpairs for the given configuration. Pure function
     of state (shape, boundary, gridN, K, seed, operator) — never a skin.
       state = { shape, boundary, gridN, K, seed, operator? }
       operator: 'membrane' (default, −Δ) | 'biharmonic' (Δ², stretch mode)
     Returns { mask, op, eig, freqs }.
     ════════════════════════════════════════════════════════════════════════ */
  function solve(state) {
    var shape = state.shape || 'square';
    var boundary = state.boundary || 'clamped';
    var N = state.gridN || 44;
    var K = state.K || 20;
    var seed = state.seed == null ? 1234567 : state.seed;
    var mask = buildMask(shape, N);
    var op = (state.operator === 'biharmonic')
      ? buildBiharmonic(mask)
      : buildOperator(mask, boundary);
    var eig = lanczos(op, Math.min(K, op.n), seed);
    return { mask: mask, op: op, eig: eig, freqs: eigfreqs(eig) };
  }
  Plate.solve = solve;

  /* ── analytic references (for the self-test's convergence + ratio checks) ─── */
  // square clamped membrane on the unit square: λ = π²(p²+q²)
  Plate.squareLambda = function (p, q) { return Math.PI * Math.PI * (p * p + q * q); };
  // first few Bessel J0 zeros (clamped circular drum: λ ∝ jₘₙ²; radius ½ → λ = (j/R)²)
  Plate.BESSEL_J0_ZEROS = [2.404825557695773, 5.520078110286311, 8.653727912911012];
  Plate.BESSEL_J1_ZEROS = [3.831705970207512, 7.015586669815619, 10.17346813506272];

  /* ── version + a deterministic config fingerprint (skin-invariant by design;
     the skin is never an input here). */
  Plate.VERSION = '1.0.0';

  // browser global
  if (root && root.document) root.Plate = Plate;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Plate; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
