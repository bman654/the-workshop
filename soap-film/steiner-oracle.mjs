// ============================================================================
// steiner-oracle.mjs — the INDEPENDENT closed-form Steiner oracle.
//
// ANTI-CIRCULARITY CONTRACT (asserted by steiner-core.test.mjs):
//   This file imports NOTHING from steiner-core.mjs (no relaxer, no iterative
//   descent, no `solve`). It computes the Steiner-minimal-tree length by an
//   EXACT closed-form construction — Melzak's compass-and-straightedge method
//   over every full-Steiner topology, glued by an FST-concatenation DP. Not one
//   line of iteration toward an equilibrium. It is the second, disjoint witness
//   the relaxer is checked against: if the two ever agreed only because they
//   shared code, this independence would be a lie.
//
// The tiny vector helpers below are DELIBERATELY duplicated here (not imported)
// so the two engines share zero code.
// ============================================================================

const sub  = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const len  = (a)    => Math.hypot(a.x, a.y);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const norm = (a)    => { const L = len(a) || 1e-30; return { x: a.x / L, y: a.y / L }; };

// ---------------------------------------------------------------------------
// Enumerate all unrooted binary tree topologies on leaves [0..N-1]. A node is
// either a leaf (number) or [left,right]. Built by sequential leaf insertion,
// which yields exactly (2N-5)!! distinct unrooted topologies.
// ---------------------------------------------------------------------------
function fullTopologies(N){
  let trees = [ [0, 1] ];
  for(let k = 2; k < N; k++){
    const next = [];
    for(const t of trees){
      forEachEdge(t, (replace) => { next.push(replace(k)); });
    }
    trees = next;
  }
  return trees;
}
function forEachEdge(tree, cb){
  function rec(node, put){
    cb((k) => put([node, k]));
    if(Array.isArray(node)){
      rec(node[0], (s) => put([s, node[1]]));
      rec(node[1], (s) => put([node[0], s]));
    }
  }
  cb((k) => [tree, k]);            // central edge
  rec(tree[0], (s) => [s, tree[1]]);
  rec(tree[1], (s) => [tree[0], s]);
}

// ---------------------------------------------------------------------------
// Melzak on one topology, given a side-bit choice for each equilateral apex.
// Returns {ok, length, steiner, edges, angles} — exact, no iteration.
// ---------------------------------------------------------------------------
function melzakSided(tree, P, sideBits){
  const merges = [];
  function build(node){
    if(!Array.isArray(node)) return { leaf: node };
    const a = build(node[0]), b = build(node[1]);
    const idx = merges.length; merges.push({ a, b, idx }); return { node: idx };
  }
  build(tree);
  const M = merges.length;                 // = N-1
  const apex = new Array(M).fill(null);
  const childPos = (c) => c.leaf !== undefined ? P[c.leaf] : apex[c.node];
  const circ = new Array(M).fill(null);
  let sb = sideBits;
  for(let i = 0; i < M - 1; i++){
    const a = merges[i].a, b = merges[i].b;
    const Pa = childPos(a), Pb = childPos(b);
    if(!Pa || !Pb) return { ok: false };
    const side = (sb & 1) ? 1 : -1; sb >>= 1;
    const d = sub(Pb, Pa);
    const ang = side * Math.PI / 3;
    const E = { x: Pa.x + d.x * Math.cos(ang) - d.y * Math.sin(ang),
                y: Pa.y + d.x * Math.sin(ang) + d.y * Math.cos(ang) };
    apex[i] = E; circ[i] = { Pa, Pb, E, a, b };
  }
  const cl = merges[M - 1];
  const F0 = childPos(cl.a), F1 = childPos(cl.b);
  if(!F0 || !F1) return { ok: false };
  const length = dist(F0, F1);

  const parentRef = new Array(M).fill(null);
  for(let i = 0; i < M; i++){
    for(const key of ['a', 'b']){
      const c = merges[i][key];
      if(c.node !== undefined) parentRef[c.node] = { parent: i, key };
    }
  }
  const steinerPos = new Array(M - 1).fill(null);
  function childPosFinal(c){
    return c.leaf !== undefined ? P[c.leaf]
         : (steinerPos[c.node] !== null ? steinerPos[c.node] : apex[c.node]);
  }
  function outerOf(i){
    const pr = parentRef[i];
    if(pr === null) return null;
    const pm = merges[pr.parent];
    if(pr.parent === M - 1){
      const sib = pr.key === 'a' ? pm.b : pm.a;
      return childPosFinal(sib);
    }
    return steinerPos[pr.parent];
  }
  let ok = true;
  const angles = [];
  for(let i = M - 2; i >= 0; i--){
    const { Pa, Pb, E } = circ[i];
    const F = outerOf(i);
    if(!F){ ok = false; break; }
    const S = lineCircleSecond(F, E, Pa, Pb, E);
    if(!S){ ok = false; break; }
    const t = segParam(F, E, S);
    if(!(t > 1e-7 && t < 1 - 1e-7)){ ok = false; break; }
    steinerPos[i] = S;
    const aS = angAt(S, Pa, Pb), bS = angAt(S, Pb, F), cS = angAt(S, F, Pa);
    angles.push([aS, bS, cS]);
    if(Math.abs(aS - 120) > 1e-4 || Math.abs(bS - 120) > 1e-4 || Math.abs(cS - 120) > 1e-4){ ok = false; break; }
  }
  if(!ok) return { ok: false };

  // RIGOR GATE: reconstruct the real edge set and require its summed length to
  // equal the Melzak closing distance to 1e-6 — a falsifiable cross-check.
  const resolve = (c) => c.leaf !== undefined ? P[c.leaf] : steinerPos[c.node];
  let edgeSum = 0; const outEdges = [];
  for(let i = 0; i < M - 1; i++){
    const A = resolve(merges[i].a), B = resolve(merges[i].b), Sp = steinerPos[i];
    edgeSum += dist(Sp, A) + dist(Sp, B); outEdges.push([Sp, A], [Sp, B]);
  }
  const cA = resolve(cl.a), cB = resolve(cl.b);
  edgeSum += dist(cA, cB); outEdges.push([cA, cB]);
  if(Math.abs(edgeSum - length) > 1e-6) return { ok: false };
  return { ok: true, length, steiner: steinerPos.slice(), angles, edges: outEdges };
}

function angAt(S, A, B){
  const u = norm(sub(A, S)), v = norm(sub(B, S));
  let c = u.x * v.x + u.y * v.y; c = Math.max(-1, Math.min(1, c));
  return Math.acos(c) * 180 / Math.PI;
}
function segParam(F, E, S){
  const d = sub(E, F); const L2 = d.x * d.x + d.y * d.y;
  return ((S.x - F.x) * d.x + (S.y - F.y) * d.y) / L2;
}
function circumcircle(A, B, C){
  const ax = A.x, ay = A.y, bx = B.x, by = B.y, cx = C.x, cy = C.y;
  const dd = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if(Math.abs(dd) < 1e-14) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / dd;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / dd;
  const O = { x: ux, y: uy }; return { O, r: dist(O, A) };
}
function lineCircleSecond(F, E, A, B, C2){
  const cc = circumcircle(A, B, C2); if(!cc) return null;
  const O = cc.O, r = cc.r;
  const d = sub(E, F); const L2 = d.x * d.x + d.y * d.y;
  const fo = sub(F, O);
  const aa = L2, bb = 2 * (fo.x * d.x + fo.y * d.y), ccq = fo.x * fo.x + fo.y * fo.y - r * r;
  const disc = bb * bb - 4 * aa * ccq; if(disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = (-bb + sq) / (2 * aa), t2 = (-bb - sq) / (2 * aa);
  const P1 = { x: F.x + t1 * d.x, y: F.y + t1 * d.y }, P2 = { x: F.x + t2 * d.x, y: F.y + t2 * d.y };
  return dist(P1, E) < dist(P2, E) ? P2 : P1;
}

// Full Steiner tree on a subset of terminals (indices into P).
function fstOnSubset(P, idxs){
  const n = idxs.length;
  if(n <= 1) return { length: 0 };
  if(n === 2) return { length: dist(P[idxs[0]], P[idxs[1]]) };
  const subset = idxs.map(i => P[i]);
  const topos = fullTopologies(n);
  let best = Infinity, bestR = null;
  for(const t of topos){
    const sBits = 1 << (n - 2);
    for(let s = 0; s < sBits; s++){
      const r = melzakSided(t, subset, s);
      if(r.ok && r.length < best - 1e-12){ best = r.length; bestR = r; }
    }
  }
  return { length: best, witness: bestR };
}

// ---------------------------------------------------------------------------
// steinerExact — the true Steiner-minimal length for small N via FST-DP. Every
// SMT is a union of full Steiner trees glued at shared terminals; split at any
// internal terminal into two subtrees sharing only that terminal. Bitmask DP.
//   steinerExact(P) -> { length, full, witness:{steiner,edges,angles} }
// ---------------------------------------------------------------------------
function steinerExact(P){
  const N = P.length;
  if(N <= 1) return { length: 0, full: true, witness: null };
  if(N === 2) return { length: dist(P[0], P[1]), full: true, witness: { steiner: [], edges: [[P[0], P[1]]], angles: [] } };
  const FULL = (1 << N) - 1;
  const fstMemo = new Map();
  const fstCost = (mask) => {
    if(fstMemo.has(mask)) return fstMemo.get(mask);
    const idxs = []; for(let i = 0; i < N; i++) if(mask & (1 << i)) idxs.push(i);
    const v = fstOnSubset(P, idxs).length; fstMemo.set(mask, v); return v;
  };
  const smt = new Map();
  const bitcount = (m) => { let c = 0; while(m){ c += m & 1; m >>= 1; } return c; };
  const masks = []; for(let m = 1; m <= FULL; m++) masks.push(m);
  masks.sort((a, b) => bitcount(a) - bitcount(b));
  for(const Q of masks){
    const k = bitcount(Q);
    if(k === 1){ smt.set(Q, 0); continue; }
    if(k === 2){ smt.set(Q, fstCost(Q)); continue; }
    let best = fstCost(Q);
    const elems = []; for(let i = 0; i < N; i++) if(Q & (1 << i)) elems.push(i);
    for(const t of elems){
      const rest = Q & ~(1 << t);
      for(let s = (rest - 1) & rest; s > 0; s = (s - 1) & rest){
        const other = rest & ~s;
        if(other === 0) continue;
        const low = rest & (-rest);
        if(!(s & low)) continue;
        const A = s | (1 << t), B = other | (1 << t);
        const c = smt.get(A) + smt.get(B);
        if(c < best - 1e-12) best = c;
      }
    }
    smt.set(Q, best);
  }
  const full = Math.abs(smt.get(FULL) - fstCost(FULL)) < 1e-9;
  let witness = null;
  if(full){
    const topos = fullTopologies(N);
    let bb = null;
    for(const t of topos){
      const sB = 1 << (N - 2);
      for(let s = 0; s < sB; s++){
        const r = melzakSided(t, P, s);
        if(r.ok && (bb === null || r.length < bb.length - 1e-12)) bb = r;
      }
    }
    if(bb) witness = { steiner: bb.steiner, angles: bb.angles, edges: bb.edges };
  }
  return { length: smt.get(FULL), full, witness };
}

export { steinerExact, fstOnSubset };
// Browser global so the page can use the same independent oracle the test does.
if(typeof window !== 'undefined'){
  window.SteinerOracle = { steinerExact, fstOnSubset };
}
