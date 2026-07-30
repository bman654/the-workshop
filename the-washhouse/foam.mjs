/* ═══════════════════════════════════════════════════════════════════════════
   foam.mjs — a two-dimensional dry foam, left alone.

   THE WHOLE MODEL, in three sentences:

     1. Every soap film moves sideways at a speed equal to how sharply it is
        curved.                                          (v = kappa, mean-curvature flow)
     2. Where three films meet, the junction is free to slide, and it slides
        downhill on total film length.        (which drives the meeting to 120 degrees)
     3. When a film gets short, its two ends swap partners (T1); when a bubble
        gets tiny, it goes (T2).                                 (the topology only)

   THERE IS NO GAS LAW IN HERE, NO PRESSURE, NO AREA TARGET, AND NO NUMBER OF
   SIDES ANYWHERE IN THE MOTION. Every node moves by looking at its own two or
   three neighbours and nothing else.

   What comes out anyway is von Neumann's law (1952):

        dA/dt  =  (pi/3) (n - 6)

   — a bubble's area changes at a rate set ONLY by how many neighbours it has.
   Not its size. Not its shape. A six-sided bubble is frozen in area however
   much it writhes, and a five-sided one dies at exactly the same speed as a
   five-sided one a hundred times its size.

   Why: for a cell bounded by arcs meeting at 120 degrees,
        dA/dt = -integral(kappa ds)                     (each film moves at kappa)
        integral(kappa ds) + sum(exterior angles) = 2 pi        (Gauss-Bonnet)
        every exterior angle at a 120-degree junction is pi/3
   =>   dA/dt = n*pi/3 - 2 pi = (pi/3)(n - 6).
   The 120 degrees is the only place the "3" comes from, and it is not typed in
   anywhere below — it is what the junction rule relaxes to.

   NUMERICS
     The network is one graph of nodes: three-valent junctions, plus interior
     nodes strung along each film. The motion of the WHOLE graph is the L2
     gradient flow of total length,

        m_i dP_i/dt  =  - dL/dP_i  =  - sum_j (P_i - P_j)/|P_i - P_j|,
        m_i          =  (1/2) sum_j |P_i - P_j|            (lumped mass)

     which is exactly v = kappa N at an interior node and exactly the Herring
     force balance (three unit tension vectors summing to zero => 120 degrees)
     at a junction. Stepped SEMI-IMPLICITLY: lag the lengths, solve
     (M/dt + K) delta = -K P by conjugate gradients, where K is the graph
     Laplacian weighted by 1/length. Unconditionally stable in the linear part,
     so short films do not force tiny steps.

     The domain is a TORUS, so there are no walls to special-case and Euler's
     formula pins the mean side count at exactly six, forever:
        V - E + F = 0, 3V = 2E  =>  F = V/2  =>  <n> = 2E/F = 6.

   The whole file is DOM-free. Node twin: `node the-washhouse/foam.test.mjs`.
   ═══════════════════════════════════════════════════════════════════════════ */

export const VN = Math.PI / 3;          /* the constant von Neumann's law predicts */

/* ── torus helpers ─────────────────────────────────────────────────────────── */
export function wrap1(v, L) { const r = v % L; return r < 0 ? r + L : r; }
export function mi(d, L) { return d - L * Math.round(d / L); }

/* ── construction ──────────────────────────────────────────────────────────── */

/* A perfect honeycomb on a torus: nx columns x ny rows of pointy-top hexagons of
   circumradius R. ny must be even so the row offset matches across the y seam.
   Every cell has six sides, so by von Neumann's law NOTHING HAPPENS — which is
   the point of starting here. */
export function honeycomb(nx = 18, ny = 12, R = 1) {
  if (ny % 2) throw new Error('honeycomb: ny must be even (the torus seam)');
  const W = Math.sqrt(3) * R, H = 1.5 * R;
  const Lx = nx * W, Ly = ny * H;
  const F = blank(Lx, Ly, R);

  /* snap: wrap, then pull anything a hair under the period back to zero — the
     cosine of pi/2 is 6e-17, not 0, so the same corner reached from the hexagon
     on the other side of the seam otherwise wraps to Lx and never matches. */
  const snap = (v, L) => { let w = wrap1(v, L); if (w > L - 1e-9 || w < 1e-9) w = 0; return w; };
  const key = (x, y) => `${Math.round(snap(x, Lx) * 1e6)},${Math.round(snap(y, Ly) * 1e6)}`;
  const vAt = new Map();                       /* key -> vertex id */
  const eAt = new Map();                       /* "va,vb" sorted -> film id */

  const getV = (x, y) => {
    const k = key(x, y);
    let v = vAt.get(k);
    if (v === undefined) { v = newVert(F, snap(x, Lx), snap(y, Ly)); vAt.set(k, v); }
    return v;
  };

  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const cx = i * W + (j & 1) * W / 2, cy = j * H;
    const ring = [];
    for (let k = 0; k < 6; k++) {
      const th = Math.PI / 2 + k * Math.PI / 3;
      ring.push(getV(cx + R * Math.cos(th), cy + R * Math.sin(th)));
    }
    for (let k = 0; k < 6; k++) {
      const a = ring[k], b = ring[(k + 1) % 6];
      const kk = a < b ? `${a},${b}` : `${b},${a}`;
      if (!eAt.has(kk)) eAt.set(kk, newFilm(F, a, b));
    }
  }

  for (const v of F.V) if (v && v.f.length !== 3)
    throw new Error(`honeycomb: vertex of degree ${v.f.length} (expected 3)`);

  rebuild(F, true);
  return F;
}

function blank(Lx, Ly, R) {
  return {
    Lx, Ly, R,
    X: [], Y: [], freeN: [],                 /* node positions, sparse ids       */
    V: [], freeV: [],                        /* {n, f:[3 film ids]}              */
    E: [], freeE: [],                        /* {a,b,m:[node ids],L,R}           */
    C: [], freeC: [],                        /* {loop:[{f,d}], n, A, rate, ...}  */
    /* solver scratch, rebuilt whenever the topology or the node count changes */
    dense: null,
    t: 0, steps: 0,
    h0: 0.10 * R,                            /* target node spacing along a film */
    lT1: 0.030 * R,                          /* a film this short swaps partners */
    aT2: 0.0030 * R * R,                     /* a three-sided bubble this small goes */
    KMAX: 96,
    grade: 0.6,                              /* mesh crowding toward the junctions */
    cgTol: 1e-8, cgMax: 400, jMass: 0,
    ev: { t1: 0, t2: 0, lens: 0, pop: 0, stuck: 0, odd: 0 },
    pinJunctions: false,                     /* the negative control: corners stick */
    dirty: true,
    born: 0,
  };
}

function newNode(F, x, y) {
  const i = F.freeN.length ? F.freeN.pop() : F.X.length;
  F.X[i] = x; F.Y[i] = y; return i;
}
function delNode(F, i) { F.X[i] = NaN; F.freeN.push(i); }

function newVert(F, x, y) {
  const i = F.freeV.length ? F.freeV.pop() : F.V.length;
  F.V[i] = { n: newNode(F, x, y), f: [] };
  return i;
}
function delVert(F, v) { delNode(F, F.V[v].n); F.V[v] = null; F.freeV.push(v); }

function newFilm(F, a, b) {
  const i = F.freeE.length ? F.freeE.pop() : F.E.length;
  F.E[i] = { a, b, m: [], L: -1, R: -1 };
  F.V[a].f.push(i); F.V[b].f.push(i);
  return i;
}
function delFilm(F, f) {
  const e = F.E[f];
  for (const nid of e.m) delNode(F, nid);
  for (const v of [e.a, e.b]) if (F.V[v]) {
    const k = F.V[v].f.indexOf(f); if (k >= 0) F.V[v].f.splice(k, 1);
  }
  F.E[f] = null; F.freeE.push(f);
}

/* ── the node chain of a film, junction to junction ────────────────────────── */
function chain(F, f) {
  const e = F.E[f];
  return [F.V[e.a].n, ...e.m, F.V[e.b].n];
}

/* ═══ FACES ═══════════════════════════════════════════════════════════════════
   The cell loops are never hand-maintained: after any topological event the
   faces are re-derived from the rotation system (the cyclic order of films
   around each junction, read off the geometry) by the standard walk, and each
   new face is matched to the cell it used to be by a vote over its own films.
   That way a T1 only has to get four vertex-to-film lists right; the loops,
   the sides and the left/right labels all re-derive themselves.             */

function rotation(F) {
  const rot = new Map();                     /* vertex -> [halfedge ids] ccw */
  for (let v = 0; v < F.V.length; v++) {
    const V = F.V[v]; if (!V) continue;
    const x0 = F.X[V.n], y0 = F.Y[V.n];
    const arr = V.f.map(f => {
      const e = F.E[f];
      const out = e.a === v ? (e.m.length ? e.m[0] : F.V[e.b].n)
                            : (e.m.length ? e.m[e.m.length - 1] : F.V[e.a].n);
      const dx = mi(F.X[out] - x0, F.Lx), dy = mi(F.Y[out] - y0, F.Ly);
      return { h: e.a === v ? 2 * f : 2 * f + 1, ang: Math.atan2(dy, dx) };
    });
    arr.sort((p, q) => p.ang - q.ang);       /* ccw */
    rot.set(v, arr.map(p => p.h));
  }
  return rot;
}

const twin = h => h ^ 1;
function tail(F, h) { const e = F.E[h >> 1]; return (h & 1) ? e.b : e.a; }
function head(F, h) { const e = F.E[h >> 1]; return (h & 1) ? e.a : e.b; }

export function rebuildFaces(F, fresh = false, relabel = null) {
  const prev = new Map();                    /* halfedge -> old cell id */
  if (!fresh) for (let f = 0; f < F.E.length; f++) {
    const e = F.E[f]; if (!e) continue;
    let L = e.L, R = e.R;
    if (relabel) { if (relabel.has(L)) L = relabel.get(L); if (relabel.has(R)) R = relabel.get(R); }
    prev.set(2 * f, L); prev.set(2 * f + 1, R);
  }

  const rot = rotation(F);
  const idx = new Map();                     /* halfedge -> position in its rot */
  for (const [v, hs] of rot) hs.forEach((h, i) => idx.set(h, i));
  const next = h => {                        /* the face lies to the LEFT of h */
    const t = twin(h), v = tail(F, t), hs = rot.get(v);
    return hs[(idx.get(t) + hs.length - 1) % hs.length];
  };

  const seen = new Uint8Array(2 * F.E.length);
  const faces = [];
  for (let f = 0; f < F.E.length; f++) {
    if (!F.E[f]) continue;
    for (const h0 of [2 * f, 2 * f + 1]) {
      if (seen[h0]) continue;
      const loop = []; let h = h0, guard = 0;
      do {
        if (seen[h]) throw new Error('rebuildFaces: half-edge visited twice');
        seen[h] = 1; loop.push(h); h = next(h);
        if (++guard > 4 * F.E.length + 16) throw new Error('rebuildFaces: runaway walk');
      } while (h !== h0);
      faces.push(loop);
    }
  }

  /* match each face to the cell it was */
  const used = new Set();
  const assigned = [];
  for (const loop of faces) {
    let cid = -1;
    if (!fresh) {
      const votes = new Map();
      for (const h of loop) {
        const p = prev.get(h);
        if (p === undefined || p < 0 || !F.C[p]) continue;
        votes.set(p, (votes.get(p) || 0) + 1);
      }
      let best = -1, bn = 0;
      for (const [p, n] of votes) if (n > bn && !used.has(p)) { best = p; bn = n; }
      cid = best;
    }
    if (cid < 0) {
      cid = F.freeC.length ? F.freeC.pop() : F.C.length;
      F.C[cid] = { loop: null, n: 0, A: 0, A0: 0, t0: F.t, rate: 0, id: cid, born: F.born++, tw: 0, tw0: -1 };
    }
    used.add(cid);
    assigned.push([cid, loop]);
  }

  /* free any cell that no face claimed */
  for (let c = 0; c < F.C.length; c++)
    if (F.C[c] && !used.has(c)) { F.C[c] = null; F.freeC.push(c); }

  for (const [cid, loop] of assigned) {
    const C = F.C[cid];
    if (C.n !== loop.length) C.tw = (C.tw || 0) + 1;   /* its neighbourhood changed */
    C.loop = loop.map(h => ({ f: h >> 1, d: (h & 1) ? -1 : 1 }));
    C.n = loop.length;
    for (const h of loop) { if (h & 1) F.E[h >> 1].R = cid; else F.E[h >> 1].L = cid; }
  }
  F.dirty = true;
}

/* ── the dense solver view ─────────────────────────────────────────────────── */
function densify(F) {
  /* LAYOUT MATTERS. Junctions first, then each film's interior nodes in a
     contiguous run — because that run is a PATH, its block of the matrix is
     tridiagonal, and a tridiagonal block is invertible exactly in two sweeps.
     That block-per-film preconditioner is the difference between a solve that
     takes ~400 conjugate-gradient iterations and one that takes ~12. */
  const ids = [];
  for (let v = 0; v < F.V.length; v++) if (F.V[v]) ids.push(F.V[v].n);
  const isJ = new Set(ids);
  const nJ = ids.length;
  const bs = [], be = [];                    /* per film-block: [start,end) in dense ids */
  for (let f = 0; f < F.E.length; f++) {
    const e = F.E[f]; if (!e || !e.m.length) continue;
    bs.push(ids.length);
    for (const nid of e.m) ids.push(nid);
    be.push(ids.length);
  }
  const map = new Map(); ids.forEach((nid, k) => map.set(nid, k));
  const N = ids.length;

  const deg = new Int32Array(N);
  const segs = [];
  for (let f = 0; f < F.E.length; f++) {
    const e = F.E[f]; if (!e) continue;
    const ch = chain(F, f);
    for (let k = 0; k + 1 < ch.length; k++) {
      const a = map.get(ch[k]), b = map.get(ch[k + 1]);
      segs.push(a, b); deg[a]++; deg[b]++;
    }
  }
  const head_ = new Int32Array(N + 1);
  for (let i = 0; i < N; i++) head_[i + 1] = head_[i] + deg[i];
  const fill = head_.slice(0, N);
  const list = new Int32Array(head_[N]);
  for (let s = 0; s < segs.length; s += 2) {
    const a = segs[s], b = segs[s + 1];
    list[fill[a]++] = b; list[fill[b]++] = a;
  }
  /* for each in-block node, where its edge to the previous in-block node sits
     in the CSR weight array (so the tridiagonal factor can read it live) */
  const subSlot = new Int32Array(N).fill(-1);
  for (let b = 0; b < bs.length; b++)
    for (let i = bs[b] + 1; i < be[b]; i++)
      for (let k = head_[i]; k < head_[i + 1]; k++) if (list[k] === i - 1) { subSlot[i] = k; break; }

  const junction = new Uint8Array(N);
  for (let i = 0; i < N; i++) junction[i] = isJ.has(ids[i]) ? 1 : 0;

  F.dense = {
    N, nJ, ids, map, head: head_, list,
    bs: Int32Array.from(bs), be: Int32Array.from(be), subSlot,
    junction,
    px: new Float64Array(N), py: new Float64Array(N),
    vx: new Float64Array(N), vy: new Float64Array(N),
    gx: new Float64Array(N), gy: new Float64Array(N),
    m: new Float64Array(N), w: new Float64Array(head_[N]),
    r: new Float64Array(N), p: new Float64Array(N), Ap: new Float64Array(N), z: new Float64Array(N),
    apx: new Float64Array(N), apy: new Float64Array(N),
    zx: new Float64Array(N), zy: new Float64Array(N), inv: new Float64Array(N),
    diag: new Float64Array(N), cp: new Float64Array(N), den: new Float64Array(N),
    t1x: new Float64Array(N), t1y: new Float64Array(N),
    e1x: new Float64Array(N), e1y: new Float64Array(N),
    u1x: new Float64Array(N), u1y: new Float64Array(N),
  };
  F.dirty = false;
}

export function rebuild(F, fresh = false, relabel = null) {
  rebuildFaces(F, fresh, relabel);
  densify(F);
  computeAreas(F);
}

/* ── areas, on the torus ───────────────────────────────────────────────────── */
export function cellPoints(F, cid) {
  const C = F.C[cid]; if (!C) return null;
  const pts = [];
  for (const { f, d } of C.loop) {
    const ch = chain(F, f);
    const seq = d > 0 ? ch : ch.slice().reverse();
    for (let k = 0; k + 1 < seq.length; k++) pts.push(seq[k]);   /* drop the shared end */
  }
  /* unwrap, walking */
  const out = new Float64Array(2 * pts.length);
  let x = F.X[pts[0]], y = F.Y[pts[0]];
  out[0] = x; out[1] = y;
  for (let k = 1; k < pts.length; k++) {
    x += mi(F.X[pts[k]] - x, F.Lx); y += mi(F.Y[pts[k]] - y, F.Ly);
    out[2 * k] = x; out[2 * k + 1] = y;
  }
  return { xy: out, nodes: pts };
}

export function computeAreas(F) {
  for (let c = 0; c < F.C.length; c++) {
    const C = F.C[c]; if (!C) continue;
    C.pts = cellPoints(F, c);            /* cached: the renderer reads the same points */
    const P = C.pts.xy, k = P.length / 2;
    let A = 0;
    for (let i = 0; i < k; i++) {
      const j = (i + 1) % k;
      A += P[2 * i] * P[2 * j + 1] - P[2 * j] * P[2 * i + 1];
    }
    C.A = A / 2;
  }
}

/* dA/dt read straight off the node velocities — the shoelace differentiated. */
function instantRates(F, dt) {
  const D = F.dense;
  for (let c = 0; c < F.C.length; c++) {
    const C = F.C[c]; if (!C) continue;
    const cp = C.pts || cellPoints(F, c), P = cp.xy, nodes = cp.nodes, k = nodes.length;
    let r = 0;
    for (let i = 0; i < k; i++) {
      const j = (i + 1) % k;
      const di = D.map.get(nodes[i]), dj = D.map.get(nodes[j]);
      const vix = D.vx[di] / dt, viy = D.vy[di] / dt, vjx = D.vx[dj] / dt, vjy = D.vy[dj] / dt;
      r += vix * P[2 * j + 1] + P[2 * i] * vjy - vjx * P[2 * i + 1] - P[2 * j] * viy;
    }
    C.rate = r / 2;
  }
}

/* ═══ THE MOTION ══════════════════════════════════════════════════════════════
   One semi-implicit step of the L2 gradient flow of total film length.       */

function matvec(D, dt, vx, vy, ox, oy, pin) {
  const { N, head, list, w, m } = D;
  for (let i = 0; i < N; i++) {
    if (pin && D.junction[i]) { ox[i] = vx[i]; oy[i] = vy[i]; continue; }
    let sx = m[i] / dt * vx[i], sy = m[i] / dt * vy[i];
    for (let k = head[i]; k < head[i + 1]; k++) {
      const j = list[k], wk = w[k];
      sx += wk * (vx[i] - vx[j]); sy += wk * (vy[i] - vy[j]);
    }
    ox[i] = sx; oy[i] = sy;
  }
}

/* ── the preconditioner: every film's own strand, solved exactly ─────────────
   A junction carries no mass, so its row of the system is a pure constraint
   and plain Jacobi leaves the solve needing four hundred iterations. But the
   nodes ALONG one film are a path, their block is tridiagonal, and Thomas's
   algorithm inverts a tridiagonal exactly in two sweeps. Preconditioning with
   the exact inverse of each film-strand (and the diagonal at the junctions)
   leaves conjugate gradients with only the junction couplings to discover —
   about a dozen iterations instead of four hundred. */
function factorBlocks(D, dt, pin) {
  const { N, head, w, m, bs, be, subSlot, diag, cp, den, inv } = D;
  for (let i = 0; i < N; i++) {
    let d = m[i] / dt;
    for (let k = head[i]; k < head[i + 1]; k++) d += w[k];
    diag[i] = d;
    inv[i] = (pin && D.junction[i]) ? 1 : (d > 0 ? 1 / d : 1);
  }
  for (let b = 0; b < bs.length; b++) {
    const s = bs[b], e = be[b];
    let prevC = 0;
    for (let i = s; i < e; i++) {
      const a = i > s ? -w[subSlot[i]] : 0;
      const dd = diag[i] - a * prevC;
      den[i] = dd !== 0 ? 1 / dd : 0;
      const c = i + 1 < e ? -w[subSlot[i + 1]] : 0;
      cp[i] = c * den[i];
      prevC = cp[i];
    }
  }
}
function applyPre(D, r, z) {
  const { nJ, N, bs, be, subSlot, cp, den, inv, w } = D;
  if (D.jacobiOnly) { for (let i = 0; i < N; i++) z[i] = r[i] * inv[i]; return; }
  for (let i = 0; i < nJ; i++) z[i] = r[i] * inv[i];
  for (let b = 0; b < bs.length; b++) {
    const s = bs[b], e = be[b];
    let prevD = 0;
    for (let i = s; i < e; i++) {
      const a = i > s ? -w[subSlot[i]] : 0;
      prevD = (r[i] - a * prevD) * den[i];
      z[i] = prevD;
    }
    for (let i = e - 2; i >= s; i--) z[i] -= cp[i] * z[i + 1];
  }
  /* any node not in a block and not a junction (there are none, but be safe) */
  void N;
}

/* ── the solve, in two storeys ───────────────────────────────────────────────
   The nodes along one film are a PATH, so their block of the system is
   tridiagonal and Thomas's algorithm inverts it exactly. Eliminate every film
   that way and what is left is a system over the JUNCTIONS ALONE — a few
   hundred unknowns, each coupled to three others, and (because the strands
   between them are heavy with mass) almost diagonal. Conjugate gradients
   finishes that in a handful of iterations.

   Solving the whole five-thousand-node system in one go instead takes about
   four hundred, because a massless junction's row is a CONSTRAINT, not a rate
   equation, and no amount of diagonal preconditioning helps with those.
   Eliminating the easy half exactly is the whole trick.               */
function applyBlocks(D, r, z) {
  const { bs, be, subSlot, cp, den, w } = D;
  for (let b = 0; b < bs.length; b++) {
    const s = bs[b], e = be[b];
    let prevD = 0;
    for (let i = s; i < e; i++) {
      const a = i > s ? -w[subSlot[i]] : 0;
      prevD = (r[i] - a * prevD) * den[i];
      z[i] = prevD;
    }
    for (let i = e - 2; i >= s; i--) z[i] -= cp[i] * z[i + 1];
  }
}

function solveSchur(F, D, dt, bx, by, xx, xy_, tol, maxit) {
  const { N, nJ, head, list, w, diag } = D;
  factorBlocks(D, dt, false);
  const tx = D.t1x, ty = D.t1y, ex = D.e1x, ey = D.e1y, ux = D.u1x, uy = D.u1y;

  applyBlocks(D, bx, tx); applyBlocks(D, by, ty);

  if (F.pinJunctions) {                       /* the corners are held: nothing to solve */
    for (let i = 0; i < nJ; i++) { xx[i] = 0; xy_[i] = 0; }
    for (let i = nJ; i < N; i++) { xx[i] = tx[i]; xy_[i] = ty[i]; }
    return 0;
  }

  const rx = D.r, ry = D.z, px = D.p, py = D.Ap;
  const Apx = D.apx, Apy = D.apy, zx = D.zx, zy = D.zy, inv = D.inv;

  /* the junction right-hand side. A film SHORT ENOUGH to hold no interior node
     at all joins two junctions directly — there is nothing to eliminate along
     it, so it stays as an off-diagonal of the reduced system. Forgetting that
     case reads a stale scratch value and quietly poisons the solve. */
  for (let j = 0; j < nJ; j++) {
    let sx = bx[j], sy = by[j];
    for (let k = head[j]; k < head[j + 1]; k++) {
      const i = list[k]; if (i < nJ) continue;
      sx += w[k] * tx[i]; sy += w[k] * ty[i];
    }
    rx[j] = sx; ry[j] = sy; xx[j] = 0; xy_[j] = 0;
  }

  const Smul = (vx, vy, ox, oy) => {
    for (let i = nJ; i < N; i++) { ex[i] = 0; ey[i] = 0; }
    for (let j = 0; j < nJ; j++) {
      const a = vx[j], b = vy[j];
      for (let k = head[j]; k < head[j + 1]; k++) {
        const i = list[k]; if (i < nJ) continue;
        ex[i] -= w[k] * a; ey[i] -= w[k] * b;
      }
    }
    applyBlocks(D, ex, ux); applyBlocks(D, ey, uy);
    for (let j = 0; j < nJ; j++) {
      let sx = diag[j] * vx[j], sy = diag[j] * vy[j];
      for (let k = head[j]; k < head[j + 1]; k++) {
        const i = list[k];
        if (i < nJ) { sx -= w[k] * vx[i]; sy -= w[k] * vy[i]; }
        else { sx += w[k] * ux[i]; sy += w[k] * uy[i]; }
      }
      ox[j] = sx; oy[j] = sy;
    }
  };

  /* the EXACT diagonal of the reduced system, from two unit-vector sweeps
     through the strand factorisations (one poking every strand's first node,
     one its last). It costs two extra passes and makes the preconditioner
     right instead of nearly right. */
  for (let i = nJ; i < N; i++) { ex[i] = 0; ey[i] = 0; }
  for (let b = 0; b < D.bs.length; b++) { ex[D.bs[b]] = 1; ey[D.be[b] - 1] = 1; }
  applyBlocks(D, ex, ux); applyBlocks(D, ey, uy);
  for (let j = 0; j < nJ; j++) {
    let d = diag[j];
    for (let k = head[j]; k < head[j + 1]; k++) {
      const i = list[k]; if (i < nJ) continue;
      const gii = ex[i] ? ux[i] : uy[i];        /* whichever sweep poked this node */
      d -= w[k] * w[k] * gii;
    }
    inv[j] = d > 0 ? 1 / d : 1 / diag[j];
  }

  for (let j = 0; j < nJ; j++) { zx[j] = inv[j] * rx[j]; zy[j] = inv[j] * ry[j]; px[j] = zx[j]; py[j] = zy[j]; }
  let rz = 0, rs0 = 0;
  for (let j = 0; j < nJ; j++) { rz += rx[j] * zx[j] + ry[j] * zy[j]; rs0 += rx[j] * rx[j] + ry[j] * ry[j]; }
  let it = 0;
  if (rs0 > 0) for (; it < maxit; it++) {
    Smul(px, py, Apx, Apy);
    let pAp = 0; for (let j = 0; j < nJ; j++) pAp += px[j] * Apx[j] + py[j] * Apy[j];
    if (!(pAp > 0)) break;
    const al = rz / pAp;
    let rn = 0;
    for (let j = 0; j < nJ; j++) {
      xx[j] += al * px[j]; xy_[j] += al * py[j];
      rx[j] -= al * Apx[j]; ry[j] -= al * Apy[j];
      rn += rx[j] * rx[j] + ry[j] * ry[j];
    }
    if (rn <= tol * tol * rs0) { it++; break; }
    let rz1 = 0;
    for (let j = 0; j < nJ; j++) { zx[j] = inv[j] * rx[j]; zy[j] = inv[j] * ry[j]; rz1 += rx[j] * zx[j] + ry[j] * zy[j]; }
    const be2 = rz1 / rz; rz = rz1;
    for (let j = 0; j < nJ; j++) { px[j] = zx[j] + be2 * px[j]; py[j] = zy[j] + be2 * py[j]; }
  }

  /* back-substitute the strands: x_interior = Aii^-1 (b - Aij x_junction) */
  Smul(xx, xy_, Apx, Apy);
  for (let i = nJ; i < N; i++) { xx[i] = tx[i] - ux[i]; xy_[i] = ty[i] - uy[i]; }
  return it;
}

/* conjugate gradients, both components carried on the one shared operator */
function cg(D, dt, bx, by, xx, xy_, pin, tol, maxit) {
  const { N } = D;
  const rx = D.r, ry = D.z, px = D.p, py = D.Ap;
  const Apx = D.apx, Apy = D.apy, zx = D.zx, zy = D.zy;
  factorBlocks(D, dt, pin);
  xx.fill(0); xy_.fill(0);
  for (let i = 0; i < N; i++) { rx[i] = bx[i]; ry[i] = by[i]; }
  applyPre(D, rx, zx); applyPre(D, ry, zy);
  let rz = 0;
  for (let i = 0; i < N; i++) { px[i] = zx[i]; py[i] = zy[i]; rz += rx[i] * zx[i] + ry[i] * zy[i]; }
  let rs0 = 0; for (let i = 0; i < N; i++) rs0 += rx[i] * rx[i] + ry[i] * ry[i];
  if (rs0 === 0) return 0;
  let it = 0;
  for (; it < maxit; it++) {
    matvec(D, dt, px, py, Apx, Apy, pin);
    let pAp = 0; for (let i = 0; i < N; i++) pAp += px[i] * Apx[i] + py[i] * Apy[i];
    if (!(pAp > 0)) break;
    const al = rz / pAp;
    for (let i = 0; i < N; i++) { xx[i] += al * px[i]; xy_[i] += al * py[i]; rx[i] -= al * Apx[i]; ry[i] -= al * Apy[i]; }
    let rn = 0; for (let i = 0; i < N; i++) rn += rx[i] * rx[i] + ry[i] * ry[i];
    if (rn <= tol * tol * rs0) { it++; break; }
    applyPre(D, rx, zx); applyPre(D, ry, zy);
    let rz1 = 0;
    for (let i = 0; i < N; i++) rz1 += rx[i] * zx[i] + ry[i] * zy[i];
    const be = rz1 / rz; rz = rz1;
    for (let i = 0; i < N; i++) { px[i] = zx[i] + be * px[i]; py[i] = zy[i] + be * py[i]; }
  }
  return it;
}

export function flowStep(F, dt) {
  if (F.dirty || !F.dense) densify(F);
  const D = F.dense, { N, head, list, ids } = D;
  for (let i = 0; i < N; i++) { D.px[i] = F.X[ids[i]]; D.py[i] = F.Y[ids[i]]; }

  /* weights 1/l, lumped mass, and the length gradient */
  D.m.fill(0); D.gx.fill(0); D.gy.fill(0);
  for (let i = 0; i < N; i++) {
    for (let k = head[i]; k < head[i + 1]; k++) {
      const j = list[k];
      const dx = mi(D.px[i] - D.px[j], F.Lx), dy = mi(D.py[i] - D.py[j], F.Ly);
      const l = Math.hypot(dx, dy) || 1e-12;
      D.w[k] = 1 / l; D.m[i] += 0.5 * l;
      D.gx[i] += dx / l; D.gy[i] += dy / l;
    }
  }
  /* A JUNCTION CARRIES NO MASS. In the sharp-interface flow the meeting of
     three films is not a moving particle with its own inertia — it is an
     EQUILIBRIUM: the three unit tensions must sum to zero at every instant,
     which is what "120 degrees" means. Giving the junction the same lumped
     mass as an interior node makes it lag, the corners sit a few degrees off,
     and the measured law comes out about a fifth shallow. Setting its mass to
     zero turns its row of the linear system from a rate equation into that
     force balance, solved along with everything else. */
  for (let i = 0; i < N; i++) if (D.junction[i]) D.m[i] *= F.jMass;
  for (let i = 0; i < N; i++) if (D.m[i] < 0) D.m[i] = 0;

  const pin = F.pinJunctions;
  if (pin) for (let i = 0; i < N; i++) if (D.junction[i]) { D.gx[i] = 0; D.gy[i] = 0; }
  for (let i = 0; i < N; i++) { D.gx[i] = -D.gx[i]; D.gy[i] = -D.gy[i]; }

  const its = solveSchur(F, D, dt, D.gx, D.gy, D.vx, D.vy, F.cgTol, F.cgMax);

  for (let i = 0; i < N; i++) {
    const nid = ids[i];
    F.X[nid] = wrap1(D.px[i] + D.vx[i], F.Lx);
    F.Y[nid] = wrap1(D.py[i] + D.vy[i], F.Ly);
  }
  F.t += dt; F.steps++;
  computeAreas(F);
  instantRates(F, dt);
  return its;
}

/* ═══ TOPOLOGY ════════════════════════════════════════════════════════════════ */

/* the two cells a film separates */
const pairOf = (F, f) => [F.E[f].L, F.E[f].R];

/* at vertex v, the film (other than `skip`) whose two cells are exactly {p,q} */
function filmWithCells(F, v, p, q, skip) {
  for (const f of F.V[v].f) {
    if (f === skip) continue;
    const [L, R] = pairOf(F, f);
    if ((L === p && R === q) || (L === q && R === p)) return f;
  }
  return -1;
}
function thirdCell(F, v, p, q) {
  for (const f of F.V[v].f) {
    const [L, R] = pairOf(F, f);
    if (L !== p && L !== q) return L;
    if (R !== p && R !== q) return R;
  }
  return -1;
}

export function filmLength(F, f) {
  const ch = chain(F, f); let s = 0;
  for (let k = 0; k + 1 < ch.length; k++)
    s += Math.hypot(mi(F.X[ch[k + 1]] - F.X[ch[k]], F.Lx), mi(F.Y[ch[k + 1]] - F.Y[ch[k]], F.Ly));
  return s;
}

/* ── T1: a short film's two ends swap partners ─────────────────────────────
   Before: L and R touch along the film; T (past one end) and B (past the
   other) do not touch. After: the film has turned a quarter turn, T and B
   touch, L and R do not. L and R lose a side; T and B gain one. Nothing else
   in the foam changes.                                                       */
export function tryT1(F, f, force = false) {
  const e = F.E[f]; if (!e) return false;
  const a = e.a, b = e.b; if (a === b) return false;
  const L = e.L, R = e.R;
  if (L < 0 || R < 0 || L === R) return false;
  if (!force && (F.C[L].n <= 3 || F.C[R].n <= 3)) return false;

  const T = thirdCell(F, b, L, R);            /* the cell past b */
  const B = thirdCell(F, a, L, R);            /* the cell past a */
  if (T < 0 || B < 0 || T === B || T === L || T === R || B === L || B === R) return false;

  const fLB = filmWithCells(F, a, L, B, f);   /* stays at a */
  const fRB = filmWithCells(F, a, R, B, f);   /* moves a -> b */
  const fLT = filmWithCells(F, b, L, T, f);   /* moves b -> a */
  const fRT = filmWithCells(F, b, R, T, f);   /* stays at b */
  if (fLB < 0 || fRB < 0 || fLT < 0 || fRT < 0) return false;
  if (new Set([fLB, fRB, fLT, fRT]).size !== 4) return false;

  /* geometry: the new film sits across the old one, a toward L, b toward R */
  const na = F.V[a].n, nb = F.V[b].n;
  const dx = mi(F.X[nb] - F.X[na], F.Lx), dy = mi(F.Y[nb] - F.Y[na], F.Ly);
  const len = Math.hypot(dx, dy) || 1e-9;
  const ux = dx / len, uy = dy / len;
  const mx = F.X[na] + dx / 2, my = F.Y[na] + dy / 2;
  const s = 0.75 * F.lT1;
  /* left normal of (a->b) points into L */
  F.X[na] = wrap1(mx + (-uy) * s, F.Lx); F.Y[na] = wrap1(my + ux * s, F.Ly);
  F.X[nb] = wrap1(mx + uy * s, F.Lx);    F.Y[nb] = wrap1(my - ux * s, F.Ly);

  /* topology: move two films between the ends, drop the film's interior nodes */
  for (const nid of e.m) delNode(F, nid);
  e.m = [];
  const move = (g, from, to) => {
    const E = F.E[g];
    if (E.a === from) E.a = to; else if (E.b === from) E.b = to; else throw new Error('T1: film not at vertex');
    const k = F.V[from].f.indexOf(g); F.V[from].f.splice(k, 1);
    F.V[to].f.push(g);
  };
  move(fRB, a, b);
  move(fLT, b, a);

  /* The two junctions just jumped a distance s. Any interior node closer than
     that to its new junction can end up on the WRONG SIDE of it, which flips
     the cyclic order of films around the junction and hands the face walk a
     foam that is valid but is not the swap we asked for. Clear them. */
  for (const v of [a, b]) {
    const vn = F.V[v].n;
    for (const g of F.V[v].f) {
      const E = F.E[g];
      while (E.m.length) {
        const nid = E.a === v ? E.m[0] : E.m[E.m.length - 1];
        const d = Math.hypot(mi(F.X[nid] - F.X[vn], F.Lx), mi(F.Y[nid] - F.Y[vn], F.Ly));
        if (d >= 1.8 * s) break;
        if (E.a === v) E.m.shift(); else E.m.pop();
        delNode(F, nid);
      }
    }
  }

  for (const v of [a, b]) if (F.V[v].f.length !== 3) throw new Error('T1: degree broke');

  const before = { L: F.C[L].n, R: F.C[R].n, T: F.C[T].n, B: F.C[B].n };
  rebuild(F);
  /* If the geometry did tangle anyway, the re-derived foam is still a legal
     foam — just not the swap intended. Count it; never pretend. */
  if ((F.C[L] && F.C[L].n !== before.L - 1) || (F.C[T] && F.C[T].n !== before.T + 1)) F.ev.odd++;
  F.ev.t1++;
  return true;
}

/* ── T2: a three-sided bubble goes ──────────────────────────────────────────
   Its three junctions become one; its three films vanish; the three films
   that walked away from those junctions now meet at the new one, and its
   three neighbours each lose a side.                                         */
export function tryT2(F, cid) {
  const C = F.C[cid]; if (!C || C.n !== 3) return false;
  const fs = C.loop.map(l => l.f);
  const vs = [];
  for (const { f, d } of C.loop) vs.push(d > 0 ? F.E[f].a : F.E[f].b);
  if (new Set(vs).size !== 3) return false;

  /* the three outside films, and the three neighbours */
  const outs = [];
  for (const v of vs) {
    const o = F.V[v].f.filter(g => !fs.includes(g));
    if (o.length !== 1) return false;
    outs.push(o[0]);
  }
  if (new Set(outs).size !== 3) return false;
  const nb = new Set();
  for (const f of fs) { const [L, R] = pairOf(F, f); nb.add(L === cid ? R : L); }
  if (nb.size !== 3 || nb.has(cid)) return false;

  /* the centroid, unwrapped about the first junction */
  const n0 = F.V[vs[0]].n;
  let sx = 0, sy = 0;
  for (let k = 0; k < 3; k++) {
    const nk = F.V[vs[k]].n;
    sx += mi(F.X[nk] - F.X[n0], F.Lx); sy += mi(F.Y[nk] - F.Y[n0], F.Ly);
  }
  const cx = F.X[n0] + sx / 3, cy = F.Y[n0] + sy / 3;

  const nv = newVert(F, wrap1(cx, F.Lx), wrap1(cy, F.Ly));
  for (let k = 0; k < 3; k++) {
    const g = outs[k], v = vs[k], E = F.E[g];
    if (E.a === v) E.a = nv; else E.b = nv;
    F.V[nv].f.push(g);
    /* drop the interior node nearest the old junction so the film is not kinked */
    if (E.m.length > 1) { const nid = (E.a === nv) ? E.m.shift() : E.m.pop(); delNode(F, nid); }
  }
  for (const f of fs) {
    for (const nid of F.E[f].m) delNode(F, nid);
    F.E[f] = null; F.freeE.push(f);
  }
  for (const v of vs) { delNode(F, F.V[v].n); F.V[v] = null; F.freeV.push(v); }
  F.C[cid] = null; F.freeC.push(cid);
  if (F.V[nv].f.length !== 3) throw new Error('T2: degree broke');

  rebuild(F);
  F.ev.t2++;
  return true;
}

/* ── join two films that meet at a now-redundant two-valent junction ───────── */
function fuseAt(F, v) {
  const V = F.V[v];
  if (!V || V.f.length !== 2) return -1;
  const [g1, g2] = V.f;
  if (g1 === g2) return -1;
  const E1 = F.E[g1], E2 = F.E[g2];
  /* orient both away from v: chain1 = far1 ... v, chain2 = v ... far2 */
  const c1 = E1.a === v ? [...E1.m].reverse() : [...E1.m];      /* nodes, v-ward last */
  const far1 = E1.a === v ? E1.b : E1.a;
  const c2 = E2.a === v ? [...E2.m] : [...E2.m].reverse();      /* nodes, v-ward first */
  const far2 = E2.a === v ? E2.b : E2.a;
  if (far1 === far2) return -1;                                  /* would make a loop */
  const merged = [...c1, V.n, ...c2];
  /* reuse g1 */
  E1.a = far1; E1.b = far2; E1.m = merged;
  const k1 = F.V[far1].f.indexOf(g1); if (k1 < 0) F.V[far1].f.push(g1);
  const k2 = F.V[far2].f.indexOf(g1); if (k2 < 0) F.V[far2].f.push(g1);
  const j = F.V[far2].f.indexOf(g2); if (j >= 0) F.V[far2].f.splice(j, 1);
  F.E[g2] = null; F.freeE.push(g2);
  F.V[v] = null; F.freeV.push(v);              /* its node is kept, now interior */
  return g1;
}

/* ── a two-sided bubble collapses to a point ─────────────────────────────────
   Its two films go, its two junctions merge into one interior node, and the
   two films that walked away from those junctions become ONE film. The two
   cells beside it each lose two sides.                                       */
export function tryLens(F, cid) {
  const C = F.C[cid]; if (!C || C.n !== 2) return false;
  const [f1, f2] = C.loop.map(l => l.f);
  if (f1 === f2) return false;
  const A = pairOf(F, f1).find(c => c !== cid), Bc = pairOf(F, f2).find(c => c !== cid);
  if (A === undefined || Bc === undefined || A === Bc) return false;
  if (F.C[A].n < 5 || F.C[Bc].n < 5) return false;
  const va = F.E[f1].a, vb = F.E[f1].b;
  if (va === vb) return false;
  const ga = F.V[va].f.find(g => g !== f1 && g !== f2);
  const gb = F.V[vb].f.find(g => g !== f1 && g !== f2);
  if (ga === undefined || gb === undefined || ga === gb) return false;
  const far1 = F.E[ga].a === va ? F.E[ga].b : F.E[ga].a;
  const far2 = F.E[gb].a === vb ? F.E[gb].b : F.E[gb].a;
  if (far1 === far2) return false;

  const nA = F.V[va].n, nB = F.V[vb].n;
  const mx = F.X[nA] + mi(F.X[nB] - F.X[nA], F.Lx) / 2;
  const my = F.Y[nA] + mi(F.Y[nB] - F.Y[nA], F.Ly) / 2;

  delFilm(F, f1); delFilm(F, f2);
  F.C[cid] = null; F.freeC.push(cid);

  const c1 = F.E[ga].a === va ? [...F.E[ga].m].reverse() : [...F.E[ga].m];   /* far1 ... va */
  const c2 = F.E[gb].a === vb ? [...F.E[gb].m] : [...F.E[gb].m].reverse();   /* vb ... far2 */
  const mid = newNode(F, wrap1(mx, F.Lx), wrap1(my, F.Ly));
  const E = F.E[ga];
  E.a = far1; E.b = far2; E.m = [...c1, mid, ...c2];
  if (!F.V[far1].f.includes(ga)) F.V[far1].f.push(ga);
  if (!F.V[far2].f.includes(ga)) F.V[far2].f.push(ga);
  const j = F.V[far2].f.indexOf(gb); if (j >= 0) F.V[far2].f.splice(j, 1);
  F.E[gb] = null; F.freeE.push(gb);
  delNode(F, nA); delNode(F, nB);
  F.V[va] = null; F.freeV.push(va);
  F.V[vb] = null; F.freeV.push(vb);

  rebuild(F);
  F.ev.lens++;
  return true;
}

/* ── a film breaks: two bubbles become one ─────────────────────────────────── */
export function popFilm(F, f) {
  const e = F.E[f]; if (!e) return false;
  const L = e.L, R = e.R;
  if (L < 0 || R < 0 || L === R) return false;
  /* they must share exactly this one film */
  let shared = 0;
  for (let g = 0; g < F.E.length; g++) {
    const E = F.E[g]; if (!E) continue;
    if ((E.L === L && E.R === R) || (E.L === R && E.R === L)) shared++;
  }
  if (shared !== 1) return false;
  const va = e.a, vb = e.b; if (va === vb) return false;
  const relabel = new Map([[R, L]]);
  delFilm(F, f);
  F.C[R] = null; F.freeC.push(R);
  if (fuseAt(F, va) < 0 || fuseAt(F, vb) < 0) throw new Error('pop: fuse failed');
  rebuild(F, false, relabel);
  F.ev.pop++;
  return true;
}

/* ── resampling: keep the nodes along a film about h0 apart ────────────────── */
function resampleFilm(F, f) {
  const e = F.E[f];
  const ch = chain(F, f), k = ch.length - 1;
  /* unwrap */
  const xs = [F.X[ch[0]]], ys = [F.Y[ch[0]]];
  for (let i = 1; i < ch.length; i++) {
    xs.push(xs[i - 1] + mi(F.X[ch[i]] - xs[i - 1], F.Lx));
    ys.push(ys[i - 1] + mi(F.Y[ch[i]] - ys[i - 1], F.Ly));
  }
  const cum = [0];
  for (let i = 1; i < ch.length; i++) cum.push(cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
  const len = cum[cum.length - 1];
  const spacing = len / k;
  if (spacing < 1.35 * F.h0 && spacing > 0.70 * F.h0) return false;
  const kt = Math.max(1, Math.min(F.KMAX, Math.round(len / F.h0)));
  if (kt === k) return false;

  /* centripetal Catmull-Rom through the existing nodes, sampled at equal arc */
  const P = i => [xs[Math.max(0, Math.min(xs.length - 1, i))], ys[Math.max(0, Math.min(ys.length - 1, i))]];
  const at = s => {
    if (s <= 0) return [xs[0], ys[0]];
    if (s >= len) return [xs[xs.length - 1], ys[ys.length - 1]];
    let i = 0; while (i + 1 < cum.length && cum[i + 1] < s) i++;
    const t = (s - cum[i]) / Math.max(1e-15, cum[i + 1] - cum[i]);
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const t2 = t * t, t3 = t2 * t;
    const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
  };

  for (const nid of e.m) delNode(F, nid);
  e.m = [];
  for (let i = 1; i < kt; i++) {
    const [x, y] = at(len * graded(i / kt, F.grade));
    e.m.push(newNode(F, wrap1(x, F.Lx), wrap1(y, F.Ly)));
  }
  return true;
}

/* Node spacing along a film, crowded toward the two junctions.
   WHY: the force that holds a junction open is built from the CHORDS to its
   three nearest neighbours, and a chord leans off the true tangent by about
   half the turning it spans — kappa*h/2, which at h = 0.17 and kappa = 1 is
   five degrees. The junction then balances the wrong three directions and the
   measured law comes out steep. Crowding the first node in to a third of a
   spacing divides that error by three for the price of nothing. */
function graded(u, a) { return a ? u - a * Math.sin(2 * Math.PI * u) / (2 * Math.PI) : u; }

/* ═══ ONE STEP OF THE WHOLE THING ═════════════════════════════════════════════ */
export function step(F, dt) {
  const its = flowStep(F, dt);
  let changed = false;

  /* T1 — shortest first, one pass */
  const shorts = [];
  for (let f = 0; f < F.E.length; f++) {
    if (!F.E[f]) continue;
    const l = filmLength(F, f);
    if (l < F.lT1) shorts.push([l, f]);
  }
  shorts.sort((a, b) => a[0] - b[0]);
  for (const [, f] of shorts) { if (F.E[f] && filmLength(F, f) < F.lT1 && tryT1(F, f)) changed = true; }

  /* T2 / lens — smallest first */
  for (let pass = 0; pass < 4; pass++) {
    let did = false;
    const small = [];
    for (let c = 0; c < F.C.length; c++) {
      const C = F.C[c]; if (!C) continue;
      if (C.n === 2) small.push([-1, c]);
      else if (C.n === 3 && C.A < F.aT2) small.push([C.A, c]);
    }
    small.sort((a, b) => a[0] - b[0]);
    for (const [, c] of small) {
      const C = F.C[c]; if (!C) continue;
      const ok = C.n === 2 ? tryLens(F, c) : tryT2(F, c);
      if (ok) { did = true; changed = true; } else F.ev.stuck++;
    }
    if (!did) break;
  }

  /* resample */
  let res = false;
  for (let f = 0; f < F.E.length; f++) if (F.E[f] && resampleFilm(F, f)) res = true;
  if (res) { densify(F); computeAreas(F); }

  return { its, changed };
}

/* ── shuffle a honeycomb's topology: S neighbour swaps, geometry untouched ─── */
export function shuffle(F, S, rnd) {
  let done = 0, tries = 0;
  while (done < S && tries < S * 60) {
    tries++;
    const f = Math.floor(rnd() * F.E.length);
    const e = F.E[f]; if (!e) continue;
    if (F.C[e.L].n <= 4 || F.C[e.R].n <= 4) continue;
    const T = thirdCell(F, e.b, e.L, e.R), B = thirdCell(F, e.a, e.L, e.R);
    if (T < 0 || B < 0) continue;
    if (F.C[T].n >= 8 || F.C[B].n >= 8) continue;
    if (tryT1(F, f)) done++;
  }
  return done;
}

export function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ═══ WHAT THE FOAM SAYS ABOUT ITSELF ═════════════════════════════════════════ */

export function cells(F) { const o = []; for (const c of F.C) if (c) o.push(c); return o; }
export function films(F) { let k = 0; for (const e of F.E) if (e) k++; return k; }
export function verts(F) { let k = 0; for (const v of F.V) if (v) k++; return k; }

export function census(F) {
  const cs = cells(F);
  const hist = new Map();
  let sn = 0, sa = 0;
  for (const c of cs) { hist.set(c.n, (hist.get(c.n) || 0) + 1); sn += c.n; sa += c.A; }
  return {
    N: cs.length, meanN: sn / cs.length, hist,
    area: sa, areaShould: F.Lx * F.Ly, meanA: sa / cs.length,
    V: verts(F), E: films(F),
    euler: verts(F) - films(F) + cs.length,
  };
}

/* every junction angle, in degrees — should all be 120 */
export function junctionAngles(F) {
  const out = [];
  for (let v = 0; v < F.V.length; v++) {
    const V = F.V[v]; if (!V) continue;
    const x0 = F.X[V.n], y0 = F.Y[V.n];
    const th = V.f.map(f => {
      const e = F.E[f];
      const out2 = e.a === v ? (e.m.length ? e.m[0] : F.V[e.b].n)
                             : (e.m.length ? e.m[e.m.length - 1] : F.V[e.a].n);
      return Math.atan2(mi(F.Y[out2] - y0, F.Ly), mi(F.X[out2] - x0, F.Lx));
    }).sort((a, b) => a - b);
    for (let k = 0; k < 3; k++) {
      let d = th[(k + 1) % 3] - th[k]; if (d < 0) d += 2 * Math.PI;
      out.push(d * 180 / Math.PI);
    }
  }
  return out;
}

/* the measurement: for every bubble that has not changed its neighbours for a
   whole window, (area now - area then)/window against its side count. */
export function openWindow(F) {
  for (const c of cells(F)) { c.A0 = c.A; c.t0 = F.t; c.tw0 = c.tw; }
}
export function readWindow(F) {
  const pts = [];
  for (const c of cells(F)) {
    const dt = F.t - c.t0;
    if (dt <= 0 || c.tw0 !== c.tw) continue;      /* its neighbours changed: not usable */
    pts.push({ n: c.n, r: (c.A - c.A0) / dt, A: c.A, id: c.id });
  }
  return pts;
}
export function fitThroughSix(pts) {
  let sxy = 0, sxx = 0, sy = 0, syy = 0;
  for (const p of pts) { const x = p.n - 6; sxy += x * p.r; sxx += x * x; sy += p.r; syy += p.r * p.r; }
  if (sxx === 0) return { slope: NaN, r2: NaN, k: pts.length };
  const s = sxy / sxx;
  let ss = 0; for (const p of pts) { const d = p.r - s * (p.n - 6); ss += d * d; }
  const mean = sy / pts.length;
  let tot = 0; for (const p of pts) tot += (p.r - mean) ** 2;
  return { slope: s, r2: tot > 0 ? 1 - ss / tot : NaN, k: pts.length, resid: Math.sqrt(ss / pts.length) };
}

/* ── a bare closed loop, for the calibration the twin runs ──────────────────
   No junctions at all: one ring of nodes under the same solver. Curve
   shortening flow says dA/dt = -2 pi for ANY smooth convex closed curve —
   which is von Neumann's law at n = 0. */
export function ring(pts, Lx = 1e7, Ly = 1e7, h0 = 0.05) {
  const F = blank(Lx, Ly, 1);
  F.h0 = h0; F.lT1 = 0; F.aT2 = 0;
  F.ringNodes = pts.map(p => newNode(F, p[0], p[1]));
  const N = F.ringNodes.length;
  const head_ = new Int32Array(N + 1); for (let i = 0; i < N; i++) head_[i + 1] = head_[i] + 2;
  const list = new Int32Array(2 * N);
  for (let i = 0; i < N; i++) { list[2 * i] = (i + N - 1) % N; list[2 * i + 1] = (i + 1) % N; }
  F.dense = {
    N, ids: F.ringNodes.slice(), map: new Map(F.ringNodes.map((n, i) => [n, i])),
    head: head_, list, junction: new Uint8Array(N),
    px: new Float64Array(N), py: new Float64Array(N),
    vx: new Float64Array(N), vy: new Float64Array(N),
    gx: new Float64Array(N), gy: new Float64Array(N),
    m: new Float64Array(N), w: new Float64Array(2 * N),
    r: new Float64Array(N), p: new Float64Array(N), Ap: new Float64Array(N), z: new Float64Array(N),
    apx: new Float64Array(N), apy: new Float64Array(N),
    zx: new Float64Array(N), zy: new Float64Array(N), inv: new Float64Array(N),
    diag: new Float64Array(N), cp: new Float64Array(N), den: new Float64Array(N),
    bs: new Int32Array(0), be: new Int32Array(0), subSlot: new Int32Array(N).fill(-1), nJ: 0,
    t1x: new Float64Array(N), t1y: new Float64Array(N),
    e1x: new Float64Array(N), e1y: new Float64Array(N),
    u1x: new Float64Array(N), u1y: new Float64Array(N),
  };
  F.dirty = false; F.dense.jacobiOnly = true;
  F.C = []; F.isRing = true;
  return F;
}
export function ringArea(F) {
  const ids = F.ringNodes, N = ids.length; let A = 0;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    A += F.X[ids[i]] * F.Y[ids[j]] - F.X[ids[j]] * F.Y[ids[i]];
  }
  return A / 2;
}
export function ringStep(F, dt) {
  const D = F.dense, { N, head, list, ids } = D;
  for (let i = 0; i < N; i++) { D.px[i] = F.X[ids[i]]; D.py[i] = F.Y[ids[i]]; }
  D.m.fill(0); D.gx.fill(0); D.gy.fill(0);
  for (let i = 0; i < N; i++) for (let k = head[i]; k < head[i + 1]; k++) {
    const j = list[k];
    const dx = D.px[i] - D.px[j], dy = D.py[i] - D.py[j];
    const l = Math.hypot(dx, dy) || 1e-12;
    D.w[k] = 1 / l; D.m[i] += 0.5 * l; D.gx[i] += dx / l; D.gy[i] += dy / l;
  }
  for (let i = 0; i < N; i++) { D.gx[i] = -D.gx[i]; D.gy[i] = -D.gy[i]; }
  cg(D, dt, D.gx, D.gy, D.vx, D.vy, false, 1e-12, 400);
  for (let i = 0; i < N; i++) { F.X[ids[i]] = D.px[i] + D.vx[i]; F.Y[ids[i]] = D.py[i] + D.vy[i]; }
  F.t += dt;
  /* re-space, so the calibration includes whatever the resampler costs */
  ringResample(F);
}
function ringResample(F) {
  const ids = F.ringNodes, N = ids.length;
  const xs = ids.map(i => F.X[i]), ys = ids.map(i => F.Y[i]);
  const cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(xs[i % N] - xs[i - 1], ys[i % N] - ys[i - 1]));
  const len = cum[N];
  const P = i => [xs[((i % N) + N) % N], ys[((i % N) + N) % N]];
  const at = s => {
    let i = 0; while (i + 1 <= N && cum[i + 1] < s) i++;
    const t = (s - cum[i]) / Math.max(1e-15, cum[i + 1] - cum[i]);
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const t2 = t * t, t3 = t2 * t;
    const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
  };
  for (let i = 0; i < N; i++) { const [x, y] = at(len * i / N); F.X[ids[i]] = x; F.Y[ids[i]] = y; }
}

/* ── invariants a valid foam must satisfy at every instant ─────────────────── */
export function audit(F) {
  const bad = [];
  for (let v = 0; v < F.V.length; v++) {
    const V = F.V[v]; if (!V) continue;
    if (V.f.length !== 3) bad.push(`vertex ${v} has degree ${V.f.length}`);
    for (const f of V.f) { const e = F.E[f]; if (!e || (e.a !== v && e.b !== v)) bad.push(`vertex ${v} claims film ${f}`); }
  }
  for (let f = 0; f < F.E.length; f++) {
    const e = F.E[f]; if (!e) continue;
    if (!F.V[e.a] || !F.V[e.b]) bad.push(`film ${f} on a dead vertex`);
    if (e.L < 0 || e.R < 0 || !F.C[e.L] || !F.C[e.R]) bad.push(`film ${f} has no cells`);
    if (e.L === e.R) bad.push(`film ${f} has the same cell on both sides`);
  }
  for (let c = 0; c < F.C.length; c++) {
    const C = F.C[c]; if (!C) continue;
    if (C.n < 3) bad.push(`cell ${c} has ${C.n} sides`);
    if (C.A <= 0) bad.push(`cell ${c} has area ${C.A}`);
    if (C.loop.length !== C.n) bad.push(`cell ${c} loop/side mismatch`);
  }
  const cs = census(F);
  if (cs.euler !== 0) bad.push(`Euler V-E+F = ${cs.euler}, not 0`);
  if (Math.abs(cs.area - cs.areaShould) > 1e-7 * cs.areaShould)
    bad.push(`areas sum to ${cs.area}, torus is ${cs.areaShould}`);
  if (Math.abs(cs.meanN - 6) > 1e-12) bad.push(`mean sides ${cs.meanN}, not 6`);
  return bad;
}
