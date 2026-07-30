/* ============================================================================
 *  POLYABOLO — the shapes you can build out of half-squares.
 *  Zero-dependency, DOM-free ESM.  Runs in the page, in a Worker, and in Node.
 *
 *  A POLYABOLO is an edge-to-edge union of right isosceles triangles, each one
 *  half of a unit square.  Seven of them make a HEPTABOLO, and there are 1097
 *  of those up to rotation and reflection.  Two of them — and, it turns out,
 *  only two — have exactly the same Dirichlet spectrum without being the same
 *  shape.  That pair is Gordon, Webb and Wolpert's 1992 answer to Mark Kac.
 *
 *  NOTHING IN THIS FILE KNOWS THAT.  It enumerates; `spectrum.mjs` listens.
 *
 *  ── THE GRID ───────────────────────────────────────────────────────────────
 *  A cell (i,j) is the unit square [i,i+1] x [j,j+1].  Cutting it along one of
 *  its two diagonals gives two triangles; there are therefore FOUR triangles a
 *  cell can hold, indexed by which corner carries the RIGHT ANGLE:
 *
 *        t=3 .___. t=2          t=0  right angle at (i,  j  )
 *            |\ /|              t=1  right angle at (i+1,j  )
 *            | X |              t=2  right angle at (i+1,j+1)
 *            |/ \|              t=3  right angle at (i,  j+1)
 *        t=0 '---' t=1
 *
 *  and a cell may hold only {0,2} or only {1,3} — one diagonal, not both.
 *  Each triangle owns two of the cell's unit edges (its legs):
 *      S: t in {0,1}   E: t in {1,2}   N: t in {2,3}   W: t in {3,0}
 *  ========================================================================= */

/* The three integer vertices of triangle t in cell (i,j), right angle first. */
export function triVerts(i, j, t) {
  switch (t) {
    case 0: return [[i, j], [i + 1, j], [i, j + 1]];
    case 1: return [[i + 1, j], [i, j], [i + 1, j + 1]];
    case 2: return [[i + 1, j + 1], [i + 1, j], [i, j + 1]];
    default: return [[i, j + 1], [i, j], [i + 1, j + 1]];
  }
}

/* Which cell edges are this triangle's legs. 0=S 1=E 2=N 3=W */
const LEGS = [[0, 3], [0, 1], [1, 2], [2, 3]];
/* Which triangles own a given cell edge. */
const OWNS = [[0, 1], [1, 2], [2, 3], [3, 0]];
/* Stepping across cell edge e leaves cell (i,j) for this neighbour, and the
 * edge you arrive on is the opposite one. */
const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];

const key = (i, j, t) => i + ',' + j + ',' + t;

/* Every triangle sharing a whole edge with (i,j,t): the one across the
 * hypotenuse (same cell) and the two across the legs. */
export function neighbours(i, j, t) {
  const out = [[i, j, (t + 2) & 3]];
  for (const e of LEGS[t]) {
    const ni = i + STEP[e][0], nj = j + STEP[e][1];
    const opp = (e + 2) & 3;
    for (const nt of OWNS[opp]) out.push([ni, nj, nt]);
  }
  return out;
}

/* ---------------------------------------------------------------------------
 *  CANONICAL FORM — a shape is the same shape if some symmetry of the square
 *  lattice plus a translation carries one onto the other.  We take the
 *  lexicographically least of the eight images as the name.
 * ------------------------------------------------------------------------ */

/* the eight lattice symmetries, as (a b c d) acting (x,y) -> (ax+by, cx+dy) */
export const SYMS = [
  [1, 0, 0, 1], [0, -1, 1, 0], [-1, 0, 0, -1], [0, 1, -1, 0],
  [1, 0, 0, -1], [0, 1, 1, 0], [-1, 0, 0, 1], [0, -1, -1, 0],
];

/* Map one triangle through a symmetry.  We move the three vertices and read
 * the answer back off the grid, which is safe for every one of the eight. */
export function mapTri(m, tri) {
  const v = triVerts(tri[0], tri[1], tri[2]).map(([x, y]) =>
    [m[0] * x + m[1] * y, m[2] * x + m[3] * y]);
  let minx = Infinity, miny = Infinity;
  for (const p of v) { if (p[0] < minx) minx = p[0]; if (p[1] < miny) miny = p[1]; }
  const r = v[0];                       /* the right angle travels with the map */
  const dx = r[0] - minx, dy = r[1] - miny;
  const t = dx === 0 ? (dy === 0 ? 0 : 3) : (dy === 0 ? 1 : 2);
  return [minx, miny, t];
}

export function canonical(shape) {
  let best = null;
  for (const m of SYMS) {
    /* re-cut after the map: a reflection turns a {0,2} full cell into a {1,3}
     * one, which is the same square and must get the same name. */
    const img = normalise(shape.map((tri) => mapTri(m, tri)));
    let minx = Infinity, miny = Infinity;
    for (const a of img) { if (a[0] < minx) minx = a[0]; if (a[1] < miny) miny = a[1]; }
    const s = img.map((a) => [a[0] - minx, a[1] - miny, a[2]])
      .sort((p, q) => (p[0] - q[0]) || (p[1] - q[1]) || (p[2] - q[2]))
      .map((a) => a.join(',')).join(' ');
    if (best === null || s < best) best = s;
  }
  return best;
}

export function fromCanonical(name) {
  return name.split(' ').map((s) => s.split(',').map(Number));
}

/* ---------------------------------------------------------------------------
 *  A DRUM IS A REGION, NOT A CUT.  A full unit square is two half-squares, and
 *  it is two half-squares in TWO ways — either diagonal will do.  Those are the
 *  same drum, so the name of a shape has to forget which diagonal was used.
 *  Every full cell is rewritten to the same cut before naming, and again before
 *  meshing, so a region has exactly one decomposition anywhere downstream.
 *  (Getting this wrong inflates the heptabolo count from 1116 to 1373 and hands
 *  the spectral search a pile of "isospectral pairs" that are one shape twice.)
 * ------------------------------------------------------------------------ */

export function normalise(shape) {
  const cell = new Map();
  for (const [i, j, t] of shape) {
    const k = i + ',' + j;
    cell.set(k, (cell.get(k) || 0) | (1 << t));
  }
  const out = [];
  for (const [k, mask] of cell) {
    const [i, j] = k.split(',').map(Number);
    const full = mask === 0b0101 || mask === 0b1010;
    if (full) { out.push([i, j, 0], [i, j, 2]); continue; }
    for (let t = 0; t < 4; t++) if (mask & (1 << t)) out.push([i, j, t]);
  }
  return out.sort((p, q) => (p[0] - q[0]) || (p[1] - q[1]) || (p[2] - q[2]));
}

export const regionKey = (shape) => canonical(normalise(shape));

/* ---------------------------------------------------------------------------
 *  ENUMERATION — grow by one triangle at a time, dedupe by canonical name.
 *  n=7 gives 1097 shapes and takes a few milliseconds.
 * ------------------------------------------------------------------------ */

/* A cell can hold one diagonal only: {0,2} or {1,3}. */
function legal(shape, tri) {
  const par = tri[2] & 1;
  for (const s of shape) if (s[0] === tri[0] && s[1] === tri[1] && (s[2] & 1) !== par) return false;
  return true;
}

export function enumerate(n) {
  let level = new Map([[regionKey([[0, 0, 0]]), [[0, 0, 0]]]]);
  for (let size = 1; size < n; size++) {
    const next = new Map();
    for (const shape of level.values()) {
      const have = new Set(shape.map((s) => key(s[0], s[1], s[2])));
      const seen = new Set();
      for (const s of shape) {
        for (const nb of neighbours(s[0], s[1], s[2])) {
          const k = key(nb[0], nb[1], nb[2]);
          if (have.has(k) || seen.has(k)) continue;
          seen.add(k);
          if (!legal(shape, nb)) continue;
          const grown = normalise(shape.concat([nb]));
          const c = canonical(grown);
          if (!next.has(c)) next.set(c, grown);
        }
      }
    }
    level = next;
  }
  return [...level.keys()].sort();
}

/* ---------------------------------------------------------------------------
 *  GEOMETRY of a finished shape
 * ------------------------------------------------------------------------ */

const ekey = (a, b) => (a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]))
  ? a[0] + ',' + a[1] + '|' + b[0] + ',' + b[1]
  : b[0] + ',' + b[1] + '|' + a[0] + ',' + a[1];

/* The edges walked exactly once — the outline. */
export function boundaryEdges(shape) {
  const count = new Map();
  for (const [i, j, t] of shape) {
    const v = triVerts(i, j, t);
    for (let e = 0; e < 3; e++) {
      const k = ekey(v[e], v[(e + 1) % 3]);
      const c = count.get(k);
      count.set(k, c ? [c[0] + 1, c[1]] : [1, [v[e], v[(e + 1) % 3]]]);
    }
  }
  const out = [];
  for (const [, c] of count) if (c[0] === 1) out.push(c[1]);
  return out;
}

export function perimeter(shape) {
  let p = 0;
  for (const [a, b] of boundaryEdges(shape)) {
    p += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return p;
}

export const area = (shape) => shape.length * 0.5;

/* Interior angle, in degrees, at every vertex on the outline — so the number of
 * actual CORNERS (the ones that are not a flat 180) and, more to the point, the
 * reentrant ones: a 270-degree corner puts an r^(2/3) singularity in every
 * eigenfunction, which is what sets how fast the eigenvalues converge. */
export function cornerAngles(shape) {
  const deg = new Map();
  for (const [i, j, t] of shape) {
    const v = triVerts(i, j, t);
    const a = [90, 45, 45];                    /* right angle first, by triVerts */
    for (let q = 0; q < 3; q++) {
      const k = v[q].join(',');
      deg.set(k, (deg.get(k) || 0) + a[q]);
    }
  }
  const rim = new Set();
  for (const [p, q] of boundaryEdges(shape)) { rim.add(p.join(',')); rim.add(q.join(',')); }
  const out = [];
  for (const [k, d] of deg) if (rim.has(k)) out.push({ at: k.split(',').map(Number), deg: d });
  out.sort((a, b) => a.deg - b.deg);
  return out;
}

export const corners = (shape) => cornerAngles(shape).filter((c) => c.deg !== 180).length;

/* Centroid and extent, for drawing. */
export function bounds(shape) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [i, j, t] of shape) {
    for (const [x, y] of triVerts(i, j, t)) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/* Is the point (x,y) inside the shape?  Exact: which cell, which half. */
export function contains(shape, x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  const u = x - i, v = y - j;
  for (const [si, sj, st] of shape) {
    if (si !== i || sj !== j) continue;
    if (st === 0 && u + v <= 1) return true;
    if (st === 2 && u + v >= 1) return true;
    if (st === 1 && v <= u) return true;
    if (st === 3 && v >= u) return true;
  }
  return false;
}
