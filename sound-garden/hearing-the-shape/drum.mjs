/* ============================================================================
 *  THE DRUM — the room's model.  Zero-dependency, DOM-free ESM.
 *  Built on ./polyabolo.mjs (the shapes) and ./spectrum.mjs (the eigensolve).
 *
 *  ── KAC'S QUESTION ─────────────────────────────────────────────────────────
 *  "Can one hear the shape of a drum?" (Mark Kac, 1966).  You are given every
 *  frequency a drumhead can sound and nothing else.  Is the outline determined?
 *
 *  The answer is NO, and this room's job is to find that out rather than say it.
 *  Cut seven half-squares.  There are 318 shapes you can glue them into edge to
 *  edge.  Solve the Dirichlet Laplacian on every one of them and compare all
 *  50,403 pairs.  One pair — exactly one — comes back with the same spectrum,
 *  and it comes back the SAME to fifteen digits while the runner-up differs in
 *  the third.  That pair is Gordon, Webb and Wolpert's 1992 counterexample.
 *
 *  The two constants below are written down so the page can start instantly.
 *  They are not the source of anything: `searchAll()` re-derives them from the
 *  enumeration, and drum.test.mjs asserts the search returns exactly these and
 *  nothing else.
 *
 *  ── WHAT IS AND IS NOT CLAIMED ─────────────────────────────────────────────
 *  CLAIMED, and checked:  the two spectra are equal to machine precision at
 *  every mesh; the solver reproduces the exact spectrum of a square and of a
 *  half-square; the computed lambda_1 walks in on the published 12-digit
 *  benchmark at the rate two 270-degree corners dictate; exactly one pair
 *  among 318 shapes is isospectral; the twins share an area AND a perimeter,
 *  so Weyl's two-term law cannot separate them either.
 *  NOT CLAIMED:  that this is what a real drum sounds like.  A real drumhead
 *  has air on both sides, a kettle under it, and a stiffness this model has
 *  no term for.  What you hear is the ideal membrane, honestly synthesised.
 *  ========================================================================= */

import { enumerate, fromCanonical, perimeter, area, bounds, boundaryEdges, cornerAngles, corners } from './polyabolo.mjs';
import { solve } from './spectrum.mjs';
import { decayLaw } from '../../tools/modal/core.mjs';

/* The pair the search finds.  Seven half-squares each; eight sides each; the
 * same area and the same perimeter, 6 + 3 sqrt 2. */
export const TWIN_A = '0,0,0 0,0,2 0,1,1 1,1,0 1,1,2 1,2,1 2,1,3';
export const TWIN_B = '0,0,2 0,1,0 0,1,2 1,1,0 1,1,2 2,1,3 2,2,0';

/* The best liar among the other 316: same area, same perimeter, and its first
 * six notes are inside a cent and a third of the twins'.  Its seventh gives it
 * away and its ninth is 34 cents flat. */
export const IMPOSTOR = '0,0,0 0,0,2 0,1,0 0,1,2 0,2,1 1,0,3 1,2,0';

/* Published benchmark: Driscoll 1997 / Betcke & Trefethen, for these drums cut
 * from triangles with legs of length TWO.  Ours have legs of length one and
 * lambda goes as 1/L^2, so the number to walk in on is four times theirs. */
export const LAMBDA1_REFERENCE = 4 * 2.537943999798;

export const NMODES = 14;
export const MESH_K = 4;

/* ---------------------------------------------------------------------------
 *  THE VOICE — from a shape to a bank of modes
 *
 *  An ideal membrane's mode n has angular frequency c sqrt(lambda_n), so every
 *  frequency in the room is fixed once you choose what the FIRST one is.  We
 *  tune drum A's fundamental to 110 Hz and then never touch a frequency again:
 *  drum B's and the impostor's come out of their own eigenvalues, referred to
 *  the same c.  Nothing is tuned to agree; agreement is the observation.
 * ------------------------------------------------------------------------ */
export function voice(shape, opts = {}) {
  const k = opts.k ?? MESH_K;
  const modes = opts.modes ?? NMODES;
  const sol = solve(shape, { k, modes });
  const ref = opts.reference ?? sol.values[0];       /* lambda that maps to f1 */
  const f1 = opts.f1 ?? 110;
  const freqs = sol.values.map((l) => f1 * Math.sqrt(l / ref));
  const t60 = freqs.map((f) => decayLaw(f, { t60at100: opts.ring ?? 5.0, brightness: 0.62 }));
  return { sol, freqs, t60, lambda: sol.values.slice() };
}

/* ---------------------------------------------------------------------------
 *  THE STICK — how hard a blow at (x,y) pushes each mode
 *
 *  A point impulse gives mode n an initial velocity proportional to the
 *  eigenfunction there.  Strike a nodal line of a mode and that mode does not
 *  wake at all, which you can hear: hit the middle of a drum and the modes with
 *  a node through the middle are simply missing.
 * ------------------------------------------------------------------------ */
export function locate(mesh, x, y) {
  const { nodes, tris } = mesh;
  let best = -1, bestBary = null, bestD = Infinity;
  for (let t = 0; t < tris.length; t++) {
    const [ia, ib, ic] = tris[t];
    const A = nodes[ia], B = nodes[ib], C = nodes[ic];
    const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
    const l0 = ((B[1] - C[1]) * (x - C[0]) + (C[0] - B[0]) * (y - C[1])) / d;
    const l1 = ((C[1] - A[1]) * (x - C[0]) + (A[0] - C[0]) * (y - C[1])) / d;
    const l2 = 1 - l0 - l1;
    const out = Math.max(-l0, -l1, -l2, 0);
    if (out < bestD) { bestD = out; best = t; bestBary = [l0, l1, l2]; }
    if (out === 0) break;
  }
  return { tri: best, bary: bestBary, outside: bestD };
}

export function strikeAmps(v, x, y) {
  const hit = locate(v.sol.mesh, x, y);
  const tri = v.sol.mesh.tris[hit.tri];
  const amps = new Float64Array(v.sol.vectors.length);
  for (let n = 0; n < v.sol.vectors.length; n++) {
    const u = v.sol.vectors[n];
    amps[n] = u[tri[0]] * hit.bary[0] + u[tri[1]] * hit.bary[1] + u[tri[2]] * hit.bary[2];
  }
  return amps;
}

/* What the ear gets: a mode radiates roughly as its acceleration, so the high
 * partials of a struck membrane are louder than their displacement suggests —
 * but the mallet's contact time has already taken the very top off.  One
 * exponent, named, applied the same way to every drum in the room. */
export function radiate(freqs, ampsIn, f1 = 110) {
  const out = new Float64Array(ampsIn.length);
  for (let i = 0; i < ampsIn.length; i++) out[i] = ampsIn[i] * Math.pow(f1 / freqs[i], 0.55);
  return out;
}

/* ---------------------------------------------------------------------------
 *  NODAL LINES — where the drum stands still
 *
 *  The zero set of an eigenfunction, marched straight off the mesh: for each
 *  element, the segment joining the sign changes on its edges.  Two drums with
 *  the same numbers have visibly different pictures here, which is the whole
 *  point of the room in one image.
 * ------------------------------------------------------------------------ */
export function nodalLines(mesh, u) {
  const seg = [];
  for (const [a, b, c] of mesh.tris) {
    const p = [mesh.nodes[a], mesh.nodes[b], mesh.nodes[c]];
    const f = [u[a], u[b], u[c]];
    const cut = [];
    for (let e = 0; e < 3; e++) {
      const i = e, j = (e + 1) % 3;
      if ((f[i] > 0) !== (f[j] > 0)) {
        const t = f[i] / (f[i] - f[j]);
        cut.push([p[i][0] + t * (p[j][0] - p[i][0]), p[i][1] + t * (p[j][1] - p[i][1])]);
      }
    }
    if (cut.length === 2) seg.push(cut[0], cut[1]);
  }
  return seg;
}

/* Nodal DOMAINS — the pieces the nodal lines cut the drumhead into.  Counting
 * the notes cannot separate the twins.  Counting the pieces each note cuts its
 * own drum into CAN, and the twins part company at the second mode.  (Sign-
 * connected components of the mesh vertices; the rim is zero and sits out.) */
export function nodalDomains(mesh, u) {
  const n = mesh.nodes.length;
  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const join = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  const sign = (i) => (u[i] > 0 ? 1 : u[i] < 0 ? -1 : 0);
  for (const t of mesh.tris) {
    for (let e = 0; e < 3; e++) {
      const a = t[e], b = t[(e + 1) % 3];
      if (sign(a) !== 0 && sign(a) === sign(b)) join(a, b);
    }
  }
  const roots = new Set();
  for (let i = 0; i < n; i++) if (sign(i) !== 0) roots.add(find(i));
  return roots.size;
}

/* ---------------------------------------------------------------------------
 *  THE SEARCH — the room's headline, re-derived rather than recited
 * ------------------------------------------------------------------------ */
export function searchAll(opts = {}) {
  const n = opts.n ?? 7;
  const k = opts.k ?? 2;
  const modes = opts.modes ?? 8;
  const tol = opts.tol ?? 1e-9;
  const list = enumerate(n);
  const spec = [];
  for (let i = 0; i < list.length; i++) {
    spec.push(solve(fromCanonical(list[i]), { k, modes }).values);
    if (opts.onProgress) opts.onProgress(i + 1, list.length, list[i], spec[i]);
  }
  const pairs = [];
  let runnerUp = Infinity, runnerPair = null;
  for (let a = 0; a < list.length; a++) {
    for (let b = a + 1; b < list.length; b++) {
      let d = 0;
      for (let i = 0; i < modes; i++) {
        const r = Math.abs(spec[a][i] - spec[b][i]) / spec[a][i];
        if (r > d) d = r;
      }
      if (d < tol) pairs.push({ a: list[a], b: list[b], d });
      else if (d < runnerUp) { runnerUp = d; runnerPair = [list[a], list[b]]; }
    }
  }
  return { list, spec, pairs, runnerUp, runnerPair, comparisons: list.length * (list.length - 1) / 2 };
}

/* ---------------------------------------------------------------------------
 *  WEYL — why counting notes cannot separate them either
 *
 *  N(lambda) ~ A/(4 pi) lambda  -  P/(4 pi) sqrt(lambda).  Both terms are the
 *  same for the twins, because the two shapes have the same area and the same
 *  perimeter.  So even the ASYMPTOTIC count of how many notes lie below a given
 *  pitch is blind here, before any of the fine structure is reached.
 * ------------------------------------------------------------------------ */
export function weylCount(lambda, shape) {
  const A = area(shape), P = perimeter(shape);
  return A * lambda / (4 * Math.PI) - P * Math.sqrt(lambda) / (4 * Math.PI);
}

export function describe(shape) {
  const b = bounds(shape);
  return {
    triangles: shape.length,
    area: area(shape),
    perimeter: perimeter(shape),
    corners: corners(shape),
    reentrant: cornerAngles(shape).filter((c) => c.deg > 180).length,
    width: b.w, height: b.h,
  };
}

export { enumerate, fromCanonical, perimeter, area, bounds, boundaryEdges, cornerAngles, corners, solve };
