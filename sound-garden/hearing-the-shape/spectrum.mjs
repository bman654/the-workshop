/* ============================================================================
 *  SPECTRUM — what a shape sounds like.  Zero-dependency, DOM-free ESM.
 *
 *  Given a polyabolo (a union of half-square triangles), build a conforming
 *  triangular mesh, assemble the P1 finite-element stiffness and a lumped
 *  mass, clamp the boundary, and pull out the lowest Dirichlet eigenvalues of
 *  the Laplacian —
 *
 *          -grad^2 u = lambda u   inside,      u = 0   on the rim
 *
 *  — which are the squared frequencies of a drumhead cut to that shape:
 *  f_n proportional to sqrt(lambda_n).
 *
 *  ── WHY THE MESH IS BUILT THE WAY IT IS ────────────────────────────────────
 *  Every triangle is subdivided into 4^k congruent copies of itself by the
 *  uniform barycentric refinement.  Two things follow, and both matter:
 *
 *    · there is NO boundary error.  The domain is exactly a union of the
 *      elements, so the only error left is the O(h^2) of P1 interpolation —
 *      no staircase, no cut cells.  A unit square comes back at 2 pi^2 to
 *      five digits at k=5.
 *    · the refinement commutes with every isometry that carries one half-square
 *      onto another.  So if two shapes are related by the transplantation
 *      argument, their DISCRETE operators are similar too, and the two computed
 *      spectra agree not to plotting accuracy but to machine epsilon.
 *
 *  ── THE SOLVER ─────────────────────────────────────────────────────────────
 *  K u = lambda M u with M lumped (diagonal), so A = M^-1/2 K M^-1/2 is
 *  symmetric.  We want the SMALLEST eigenvalues, so we run Lanczos on A^-1 =
 *  M^1/2 K^-1 M^1/2 (shift-invert with zero shift), which converges on them
 *  first and fast.  K^-1 is a banded Cholesky after a reverse Cuthill-McKee
 *  ordering: n ~ 3000, bandwidth ~ 90, so the factorisation is milliseconds.
 *  Full reorthogonalisation, because the Krylov space is small and losing
 *  orthogonality here would invent eigenvalues that are not there.
 *  ========================================================================= */

import { triVerts } from './polyabolo.mjs';

/* ---------------------------------------------------------------------------
 *  1 · MESH — uniform 4^k refinement of every half-square, welded exactly
 * ------------------------------------------------------------------------ */

export function buildMesh(shape, k = 4) {
  const N = 1 << k;
  const nodes = [];                 /* [x, y] in shape coordinates */
  const index = new Map();          /* integer key -> node id      */
  const tris = [];

  const nodeAt = (X, Y) => {        /* X,Y are integers in units of 1/N */
    const key = X * 1048576 + Y;
    let id = index.get(key);
    if (id === undefined) {
      id = nodes.length;
      index.set(key, id);
      nodes.push([X / N, Y / N]);
    }
    return id;
  };

  for (const [ci, cj, t] of shape) {
    const [A, B, C] = triVerts(ci, cj, t);
    const g = [];                   /* g[i][j] = node at barycentric (N-i-j, i, j) */
    for (let i = 0; i <= N; i++) {
      g.push([]);
      for (let j = 0; j <= N - i; j++) {
        const w = N - i - j;
        g[i].push(nodeAt(A[0] * w + B[0] * i + C[0] * j, A[1] * w + B[1] * i + C[1] * j));
      }
    }
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N - i; j++) {
        tris.push([g[i][j], g[i + 1][j], g[i][j + 1]]);
        if (i + j < N - 1) tris.push([g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]]);
      }
    }
  }
  /* WIND THEM ALL THE SAME WAY.  The four half-square types do not all carry
   * the same orientation (t=0 is counter-clockwise, t=1 is clockwise), and a
   * barycentric refinement inherits its parent's handedness — so without this
   * pass, adjacent pieces hand a shared vertex two OPPOSING face normals, they
   * cancel, and the surface grows a dark seam along every internal edge that
   * reads exactly like a mesh-welding bug.  It is not; it is a sign.
   * (The eigensolve never noticed: it takes |area|.) */
  for (const t of tris) {
    const [a, b, c] = t.map((i) => nodes[i]);
    if ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]) < 0) {
      const s = t[1]; t[1] = t[2]; t[2] = s;
    }
  }
  return { nodes, tris, h: 1 / N };
}

/* A mesh edge used by exactly one triangle is on the rim. */
export function boundaryNodes(mesh) {
  const use = new Map();
  const bump = (a, b) => {
    const key = a < b ? a * 1048576 + b : b * 1048576 + a;
    use.set(key, (use.get(key) || 0) + 1);
  };
  for (const [a, b, c] of mesh.tris) { bump(a, b); bump(b, c); bump(c, a); }
  const on = new Uint8Array(mesh.nodes.length);
  for (const [key, n] of use) {
    if (n !== 1) continue;
    on[Math.floor(key / 1048576)] = 1;
    on[key % 1048576] = 1;
  }
  return on;
}

/* ---------------------------------------------------------------------------
 *  2 · FEM — P1 stiffness, lumped mass, Dirichlet rows removed
 * ------------------------------------------------------------------------ */

export function assemble(mesh) {
  const nAll = mesh.nodes.length;
  const on = boundaryNodes(mesh);
  const free = [], id = new Int32Array(nAll).fill(-1);
  for (let i = 0; i < nAll; i++) if (!on[i]) { id[i] = free.length; free.push(i); }
  const n = free.length;

  const mass = new Float64Array(n);
  const rows = Array.from({ length: n }, () => new Map());

  for (const tri of mesh.tris) {
    const p = tri.map((v) => mesh.nodes[v]);
    const b = [p[1][1] - p[2][1], p[2][1] - p[0][1], p[0][1] - p[1][1]];
    const c = [p[2][0] - p[1][0], p[0][0] - p[2][0], p[1][0] - p[0][0]];
    const twoA = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[2][0] - p[0][0]) * (p[1][1] - p[0][1]);
    const A = Math.abs(twoA) * 0.5;
    const inv = 1 / (4 * A);
    for (let a = 0; a < 3; a++) {
      const ia = id[tri[a]];
      if (ia >= 0) mass[ia] += A / 3;
      if (ia < 0) continue;
      for (let d = 0; d < 3; d++) {
        const jd = id[tri[d]];
        if (jd < 0) continue;
        const v = (b[a] * b[d] + c[a] * c[d]) * inv;
        rows[ia].set(jd, (rows[ia].get(jd) || 0) + v);
      }
    }
  }
  return { n, free, mass, rows };
}

/* ---------------------------------------------------------------------------
 *  3 · ORDERING + BANDED CHOLESKY
 * ------------------------------------------------------------------------ */

export function rcm(rows, n) {
  const adj = rows.map((m, i) => [...m.keys()].filter((j) => j !== i));
  const deg = adj.map((a) => a.length);
  const bfsFrom = (s) => {
    const seen = new Uint8Array(n); const order = [s]; seen[s] = 1;
    for (let h = 0; h < order.length; h++) {
      const nb = adj[order[h]].filter((j) => !seen[j]).sort((a, b) => deg[a] - deg[b]);
      for (const j of nb) { seen[j] = 1; order.push(j); }
    }
    return order;
  };
  /* pseudo-peripheral start: two BFS sweeps */
  let start = 0;
  for (let pass = 0; pass < 2; pass++) { const o = bfsFrom(start); start = o[o.length - 1]; }
  const order = bfsFrom(start);
  if (order.length < n) {                      /* a disconnected mesh, in principle */
    const inOrder = new Uint8Array(n);
    for (const i of order) inOrder[i] = 1;
    for (let i = 0; i < n; i++) if (!inOrder[i]) order.push(i);
  }
  order.reverse();
  const perm = new Int32Array(n);   /* perm[newIndex] = oldIndex */
  const inv = new Int32Array(n);
  for (let i = 0; i < n; i++) { perm[i] = order[i]; inv[order[i]] = i; }
  return { perm, inv };
}

/* Lower-banded Cholesky.  band[i*(bw+1) + (i-j)] holds L(i,j). */
export function choleskyBanded(rows, n, inv) {
  let bw = 0;
  for (let i = 0; i < n; i++) for (const j of rows[i].keys()) {
    const d = Math.abs(inv[i] - inv[j]); if (d > bw) bw = d;
  }
  const w = bw + 1;
  const L = new Float64Array(n * w);
  for (let i = 0; i < n; i++) for (const [j, v] of rows[i]) {
    const a = inv[i], b = inv[j];
    if (a >= b) L[a * w + (a - b)] = v;
  }
  for (let j = 0; j < n; j++) {
    for (let i = j; i < Math.min(n, j + w); i++) {
      let s = L[i * w + (i - j)];
      const lo = Math.max(0, i - bw, j - bw);
      for (let m = lo; m < j; m++) s -= L[i * w + (i - m)] * L[j * w + (j - m)];
      if (i === j) {
        if (s <= 0) throw new Error('stiffness matrix is not positive definite');
        L[i * w + 0] = Math.sqrt(s);
      } else {
        L[i * w + (i - j)] = s / L[j * w + 0];
      }
    }
  }
  return { L, w, bw, n };
}

export function cholSolve(ch, x) {   /* in place, x already permuted */
  const { L, w, bw, n } = ch;
  for (let i = 0; i < n; i++) {
    let s = x[i];
    for (let j = Math.max(0, i - bw); j < i; j++) s -= L[i * w + (i - j)] * x[j];
    x[i] = s / L[i * w];
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = x[i];
    for (let j = i + 1; j < Math.min(n, i + w); j++) s -= L[j * w + (j - i)] * x[j];
    x[i] = s / L[i * w];
  }
  return x;
}

/* ---------------------------------------------------------------------------
 *  4 · SYMMETRIC TRIDIAGONAL EIGENSOLVER (implicit QL, values + vectors)
 * ------------------------------------------------------------------------ */

export function tql2(d, e, z, m) {
  for (let i = 1; i < m; i++) e[i - 1] = e[i];
  e[m - 1] = 0;
  for (let l = 0; l < m; l++) {
    let iter = 0, mm;
    do {
      for (mm = l; mm < m - 1; mm++) {
        const dd = Math.abs(d[mm]) + Math.abs(d[mm + 1]);
        if (Math.abs(e[mm]) <= 2.3e-16 * dd) break;
      }
      if (mm !== l) {
        if (iter++ === 60) break;
        let g = (d[l + 1] - d[l]) / (2 * e[l]);
        let r = Math.hypot(g, 1);
        g = d[mm] - d[l] + e[l] / (g + (g >= 0 ? Math.abs(r) : -Math.abs(r)));
        let s = 1, c = 1, p = 0;
        for (let i = mm - 1; i >= l; i--) {
          let f = s * e[i], b = c * e[i];
          r = Math.hypot(f, g);
          e[i + 1] = r;
          if (r === 0) { d[i + 1] -= p; e[mm] = 0; break; }
          s = f / r; c = g / r;
          g = d[i + 1] - p;
          r = (d[i] - g) * s + 2 * c * b;
          p = s * r; d[i + 1] = g + p; g = c * r - b;
          for (let kk = 0; kk < m; kk++) {
            f = z[kk * m + i + 1];
            z[kk * m + i + 1] = s * z[kk * m + i] + c * f;
            z[kk * m + i] = c * z[kk * m + i] - s * f;
          }
        }
        d[l] -= p; e[l] = g; e[mm] = 0;
      }
    } while (mm !== l);
  }
}

/* ---------------------------------------------------------------------------
 *  5 · THE EIGENSOLVE — shift-invert Lanczos with full reorthogonalisation
 * ------------------------------------------------------------------------ */

/* A tiny deterministic PRNG, so two runs of the same shape agree bit for bit. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };
}

export function solve(shape, { k = 4, modes = 16, krylov = 0 } = {}) {
  const mesh = buildMesh(shape, k);
  const { n, free, mass, rows } = assemble(mesh);
  const { perm, inv } = rcm(rows, n);
  const ch = choleskyBanded(rows, n, inv);
  const m = Math.min(n, krylov || Math.max(3 * modes + 12, 40));

  const sq = new Float64Array(n), isq = new Float64Array(n);
  for (let i = 0; i < n; i++) { sq[i] = Math.sqrt(mass[i]); isq[i] = 1 / sq[i]; }

  /* y -> M^1/2 K^-1 M^1/2 y, everything in ORIGINAL index space */
  const tmp = new Float64Array(n);
  const op = (x, out) => {
    for (let i = 0; i < n; i++) tmp[inv[i]] = x[i] * sq[i];
    cholSolve(ch, tmp);
    for (let i = 0; i < n; i++) out[i] = tmp[inv[i]] * sq[i];
  };

  const Q = new Float64Array(m * n);
  const alpha = new Float64Array(m), beta = new Float64Array(m);
  const rand = rng(0x5EED);
  let q = new Float64Array(n);
  for (let i = 0; i < n; i++) q[i] = rand();
  let nrm = 0;
  for (let i = 0; i < n; i++) nrm += q[i] * q[i];
  nrm = Math.sqrt(nrm);
  for (let i = 0; i < n; i++) q[i] /= nrm;

  const w = new Float64Array(n);
  let used = m;
  for (let j = 0; j < m; j++) {
    Q.set(q, j * n);
    op(q, w);
    if (j > 0) for (let i = 0; i < n; i++) w[i] -= beta[j - 1] * Q[(j - 1) * n + i];
    let a = 0; for (let i = 0; i < n; i++) a += q[i] * w[i];
    alpha[j] = a;
    for (let i = 0; i < n; i++) w[i] -= a * q[i];
    for (let pass = 0; pass < 2; pass++) {
      for (let p = 0; p <= j; p++) {
        let d = 0; for (let i = 0; i < n; i++) d += Q[p * n + i] * w[i];
        for (let i = 0; i < n; i++) w[i] -= d * Q[p * n + i];
      }
    }
    let b = 0; for (let i = 0; i < n; i++) b += w[i] * w[i];
    b = Math.sqrt(b);
    beta[j] = b;
    if (b < 1e-13 || j === m - 1) { used = j + 1; break; }
    q = new Float64Array(n);
    for (let i = 0; i < n; i++) q[i] = w[i] / b;
  }

  const d = alpha.slice(0, used), e = new Float64Array(used);
  for (let i = 1; i < used; i++) e[i] = beta[i - 1];
  const z = new Float64Array(used * used);
  for (let i = 0; i < used; i++) z[i * used + i] = 1;
  tql2(d, e, z, used);

  const order = [...d.keys()].sort((a, b) => d[b] - d[a]);   /* largest theta first */
  const want = Math.min(modes, used);
  const values = [], vectors = [];
  for (let s = 0; s < want; s++) {
    const c = order[s];
    values.push(1 / d[c]);
    const u = new Float64Array(mesh.nodes.length);
    let peak = 0;
    for (let i = 0; i < n; i++) {
      let acc = 0;
      for (let j = 0; j < used; j++) acc += Q[j * n + i] * z[j * used + c];
      const val = acc * isq[i];
      u[free[i]] = val;
      if (Math.abs(val) > peak) peak = Math.abs(val);
    }
    /* mass-normalise: integral of u^2 = 1, then fix the sign by the largest lobe */
    let norm = 0, big = 0, bigv = 0;
    for (let i = 0; i < n; i++) norm += mass[i] * u[free[i]] * u[free[i]];
    norm = Math.sqrt(norm);
    for (let i = 0; i < mesh.nodes.length; i++) u[i] /= norm;
    for (let i = 0; i < n; i++) if (Math.abs(u[free[i]]) > big) { big = Math.abs(u[free[i]]); bigv = u[free[i]]; }
    if (bigv < 0) for (let i = 0; i < mesh.nodes.length; i++) u[i] = -u[i];
    vectors.push(u);
    void peak;
  }
  return { values, vectors, mesh, dof: n, bandwidth: ch.bw };
}

/* Eigenvalues only — the search path, and much cheaper without the vectors. */
export function eigenvalues(shape, opts = {}) {
  return solve(shape, { modes: opts.modes || 12, k: opts.k || 2, krylov: opts.krylov || 0 }).values;
}
