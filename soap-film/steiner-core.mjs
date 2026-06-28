// ============================================================================
// steiner-core.mjs — the Soap-Film Surveyor's MATH. DOM-free, re-auditable.
//
// A soap film stretched between fixed posts pulls itself to the SHORTEST total
// length of road that connects them — the Euclidean STEINER MINIMAL TREE. It is
// allowed to invent new junction points (Steiner points); at every one it makes,
// three strands meet at exactly 120°, because any sharper corner could be cut.
//
// This module owns SPACE + LENGTH. It is the RELAXER: a tension-equilibrium
// gradient descent that finds the network the film would settle into, plus the
// dumb baselines to lose to it (spanning tree, single hub). It imports the
// INDEPENDENT closed-form oracle only to expose `steinerExact` for proofs — the
// relaxer and the oracle share no solving code (see steiner-oracle.mjs header).
//
// All math lives in a canonical "plat" coordinate space. Presets are unit-side
// polygons (square side 1 → SMT = 1+√3, triangle → √3, pentagon → 3.891157…).
// The page maps plat→pixels for drawing ONLY; every length it shows is a plat
// number from here.
// ============================================================================

import { steinerExact } from './steiner-oracle.mjs';

// --- tiny vec (geometry primitives are not "the engine"; duplicated, not shared) ---
const sub  = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const len  = (a)    => Math.hypot(a.x, a.y);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const norm = (a)    => { const L = len(a) || 1e-30; return { x: a.x / L, y: a.y / L }; };

// ---------------------------------------------------------------------------
// PRESETS — unit-side regular polygons, ANCHORS computed here (single source).
// ---------------------------------------------------------------------------
function regularPolygon(n, rot){
  const R = 1 / (2 * Math.sin(Math.PI / n));   // circumradius for side length 1
  const pts = [];
  for(let i = 0; i < n; i++){
    const a = rot + 2 * Math.PI * i / n;
    pts.push({ x: R * Math.cos(a), y: R * Math.sin(a) });
  }
  return pts;
}
const PRESETS = {
  triangle: { posts: 3, anchors: regularPolygon(3, Math.PI / 2) },
  square:   { posts: 4, anchors: regularPolygon(4, Math.PI / 4) },
  pentagon: { posts: 5, anchors: regularPolygon(5, Math.PI / 2) }
};

// ---------------------------------------------------------------------------
// The descent kernel: move only the Steiner coords down the total length with a
// backtracking line search, so length decreases monotonically. Posts (indices
// < Pn) are pinned. Returns {step, length, gnorm}. Mutates `pos`.
// ---------------------------------------------------------------------------
function descendSteiner(pos, edges, Pn, nSteps, stepIn){
  if(pos.length <= Pn){
    let L = 0; for(const [u, v] of edges) L += dist(pos[u], pos[v]);
    return { step: stepIn, length: L, gnorm: 0 };
  }
  const adj = Array.from({ length: pos.length }, () => []);
  for(const [u, v] of edges){ adj[u].push(v); adj[v].push(u); }
  const total = (pp) => { let s = 0; for(const [u, v] of edges) s += dist(pp[u], pp[v]); return s; };
  let step = stepIn, cur = total(pos), gnorm = 0, progressed = false;
  const trial = pos.map(p => ({ x: p.x, y: p.y }));
  for(let it = 0; it < nSteps; it++){
    const g = pos.map(() => ({ x: 0, y: 0 }));
    for(let i = Pn; i < pos.length; i++){
      for(const j of adj[i]){ const u = norm(sub(pos[i], pos[j])); g[i].x += u.x; g[i].y += u.y; }
    }
    gnorm = 0; for(let i = Pn; i < pos.length; i++) gnorm += g[i].x * g[i].x + g[i].y * g[i].y;
    if(gnorm < 1e-26) break;
    let s = step, accepted = false;
    for(let bt = 0; bt < 44; bt++){
      for(let i = Pn; i < pos.length; i++){ trial[i].x = pos[i].x - s * g[i].x; trial[i].y = pos[i].y - s * g[i].y; }
      for(let i = 0; i < Pn; i++){ trial[i].x = pos[i].x; trial[i].y = pos[i].y; }
      let Lt = 0; for(const [u, v] of edges) Lt += dist(trial[u], trial[v]);
      if(Lt < cur - 1e-16){
        accepted = true; progressed = true;
        for(let i = Pn; i < pos.length; i++){ pos[i].x = trial[i].x; pos[i].y = trial[i].y; }
        cur = Lt; step = s * 1.6; break;
      }
      s *= 0.5;
    }
    if(!accepted){ step = stepIn; break; }
  }
  return { step, length: cur, gnorm, progressed };
}

// deterministic PRNG (independent of the oracle's enumeration)
function lcg(seed){ let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }

// A random FULL Steiner topology: N terminals (0..N-1) + (N-2) Steiner (N..2N-3),
// each Steiner degree-3 — built by sequential attach (no shared code with oracle).
function randomFullTopo(N, rnd){
  if(N === 2) return [[0, 1]];
  if(N === 3) return [[0, N], [1, N], [2, N]];
  const edges = [];
  let nextS = N;
  edges.push([0, nextS], [1, nextS], [2, nextS]); nextS++;
  for(let k = 3; k < N; k++){
    const ei = Math.floor(rnd() * edges.length) % edges.length;
    const [u, v] = edges[ei];
    const s = nextS++;
    edges.splice(ei, 1);
    edges.push([u, s], [v, s], [k, s]);
  }
  return edges;
}

// Relax ONE topology from a jittered centroid seed → equilibrium {pos, edges, length}.
function relaxTopo(P, edges, rnd, iters){
  const Pn = P.length, total = 2 * Pn - 2;
  let cx = 0, cy = 0; for(const p of P){ cx += p.x; cy += p.y; } cx /= Pn; cy /= Pn;
  const pos = new Array(total);
  for(let i = 0; i < Pn; i++) pos[i] = { x: P[i].x, y: P[i].y };
  for(let i = Pn; i < total; i++) pos[i] = { x: cx + (rnd() - 0.5) * 0.5, y: cy + (rnd() - 0.5) * 0.5 };
  const r = descendSteiner(pos, edges, Pn, iters || 3000, 0.1);
  return { pos, edges: edges.map(e => e.slice()), length: r.length };
}

// MULTI-START: try many random full topologies, keep the global best, then polish
// it to high precision. The Steiner-minimal network the film finds.
function relaxBest(P, restarts, seed){
  const Pn = P.length;
  if(Pn === 1) return { pos: [{ x: P[0].x, y: P[0].y }], edges: [], length: 0 };
  const rnd = lcg(seed >>> 0);
  let best = null;
  for(let r = 0; r < restarts; r++){
    const edges = randomFullTopo(Pn, rnd);
    const out = relaxTopo(P, edges, rnd, 1600);
    if(best === null || out.length < best.length - 1e-9) best = out;
  }
  // high-precision polish on the winning topology
  for(let i = 0; i < Pn; i++) best.pos[i] = { x: P[i].x, y: P[i].y };
  descendSteiner(best.pos, best.edges, Pn, 9000, 0.06);
  let L = 0; for(const [u, v] of best.edges) L += dist(best.pos[u], best.pos[v]);
  best.length = L;
  return best;
}

// ---------------------------------------------------------------------------
// buildNetwork — turn a raw (pos, edges) into a clean unified Network. Snaps a
// Steiner point within EPS of a post (or another Steiner) and drops the zero
// edge, splices away degree-2 pass-throughs, then measures junction angles.
//   EPS small (1e-9) for the LIVE path (near-coincident Steiner auto-merge into a
//   transient 4-valent X — drawn by degree); larger (1e-4) for solve() cleanup
//   so a degenerate optimum (hexagon) collapses its Steiner onto terminals.
// ---------------------------------------------------------------------------
function buildNetwork(P, pos, edges, EPS){
  EPS = EPS == null ? 1e-4 : EPS;
  const Pn = P.length;
  const N = pos.length;
  const parent = []; for(let i = 0; i < N; i++) parent[i] = i;
  const find = (i) => { while(parent[i] !== i){ parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const kindOf = (i) => i < Pn ? 'post' : 'steiner';
  const unite = (a, b) => {
    const ra = find(a), rb = find(b); if(ra === rb) return;
    if(kindOf(rb) === 'post' && kindOf(ra) !== 'post') parent[ra] = rb; else parent[rb] = ra;
  };
  for(let i = 0; i < N; i++) for(let j = i + 1; j < N; j++){
    if(kindOf(i) === 'post' && kindOf(j) === 'post') continue;
    if(dist(pos[i], pos[j]) < EPS) unite(i, j);
  }
  // merged edge set keyed by representative pair
  let emap = new Map();
  for(const [u, v] of edges){
    const a = find(u), b = find(v); if(a === b) continue;
    const key = a < b ? a + '_' + b : b + '_' + a;
    emap.set(key, [Math.min(a, b), Math.max(a, b)]);
  }
  const repKind = (r) => r < Pn ? 'post' : 'steiner';
  // splice away degree-2 / drop degree-1 Steiner reps
  let changed = true;
  while(changed){
    changed = false;
    const adj = new Map();
    for(const [a, b] of emap.values()){
      if(!adj.has(a)) adj.set(a, new Set()); if(!adj.has(b)) adj.set(b, new Set());
      adj.get(a).add(b); adj.get(b).add(a);
    }
    for(const [r, nb] of adj){
      if(repKind(r) !== 'steiner') continue;
      if(nb.size === 2){
        const [x, y] = [...nb];
        emap.delete(key2(r, x)); emap.delete(key2(r, y));
        if(x !== y){ const k = key2(x, y); if(!emap.has(k)) emap.set(k, [Math.min(x, y), Math.max(x, y)]); }
        changed = true; break;
      }
      if(nb.size <= 1){
        for(const x of nb) emap.delete(key2(r, x));
        changed = true; break;
      }
    }
  }
  function key2(a, b){ return a < b ? a + '_' + b : b + '_' + a; }
  // collect surviving reps (all posts + steiner that survive), reindex
  const used = new Set();
  for(const [a, b] of emap.values()){ used.add(a); used.add(b); }
  for(let i = 0; i < Pn; i++) used.add(find(i));      // keep all posts
  const repList = [...used];
  // posts first, by original post index, then steiner
  repList.sort((a, b) => {
    const ka = repKind(a) === 'post' ? 0 : 1, kb = repKind(b) === 'post' ? 0 : 1;
    if(ka !== kb) return ka - kb;
    return a - b;
  });
  const idx = new Map(); repList.forEach((r, i) => idx.set(r, i));
  const nodes = repList.map(r => ({
    x: pos[r].x, y: pos[r].y,
    kind: repKind(r),
    post: repKind(r) === 'post' ? postLabel(find, Pn, r) : -1,
    degree: 0
  }));
  const outEdges = [];
  for(const [a, b] of emap.values()){ outEdges.push([idx.get(a), idx.get(b)]); }
  for(const [a, b] of outEdges){ nodes[a].degree++; nodes[b].degree++; }
  // junction angles
  const adjI = Array.from({ length: nodes.length }, () => []);
  for(const [a, b] of outEdges){ adjI[a].push(b); adjI[b].push(a); }
  const junctions = [];
  for(let i = 0; i < nodes.length; i++){
    if(nodes[i].degree < 3) continue;
    const dirs = adjI[i].map(j => Math.atan2(nodes[j].y - nodes[i].y, nodes[j].x - nodes[i].x)).sort((a, b) => a - b);
    const angs = [];
    for(let k = 0; k < dirs.length; k++){
      let d = dirs[(k + 1) % dirs.length] - dirs[k];
      if(d < 0) d += 2 * Math.PI;
      angs.push(d * 180 / Math.PI);
    }
    const plateau = nodes[i].degree === 3 && angs.every(a => Math.abs(a - 120) < 1e-3);
    junctions.push({ node: i, angles: angs, plateau });
  }
  let totalLength = 0; for(const [a, b] of outEdges) totalLength += dist(nodes[a], nodes[b]);
  const steinerCount = nodes.filter(n => n.kind === 'steiner').length;
  return {
    nodes, edges: outEdges, totalLength, junctions,
    topologyId: topoSignatureNodes(nodes, outEdges),
    steinerCount, converged: true, iterations: 0
  };
}
function postLabel(find, Pn, rep){
  for(let i = 0; i < Pn; i++) if(find(i) === rep) return i;
  return -1;
}
// topology signature from a built network (post labels stable, Steiner anonymous)
function topoSignatureNodes(nodes, edges){
  const adj = Array.from({ length: nodes.length }, () => []);
  for(const [a, b] of edges){ adj[a].push(b); adj[b].push(a); }
  const sigs = [];
  for(let i = 0; i < nodes.length; i++){
    if(nodes[i].kind !== 'steiner') continue;
    const posts = adj[i].filter(j => nodes[j].kind === 'post').map(j => nodes[j].post).sort((a, b) => a - b);
    const sc = adj[i].filter(j => nodes[j].kind === 'steiner').length;
    sigs.push(posts.join('.') + '/s' + sc);
  }
  sigs.sort();
  return 's' + nodes.filter(n => n.kind === 'steiner').length + ':' + sigs.join(';');
}
// topology signature directly from raw combined-index edges (posts < Pn)
function topoSignatureRaw(Pn, edges){
  const adj = new Map();
  const push = (a, b) => { if(!adj.has(a)) adj.set(a, []); adj.get(a).push(b); };
  for(const [u, v] of edges){ push(u, v); push(v, u); }
  const sigs = [];
  for(const [node, nb] of adj){
    if(node < Pn) continue;
    const posts = nb.filter(n => n < Pn).sort((a, b) => a - b);
    const sc = nb.filter(n => n >= Pn).length;
    sigs.push(posts.join('.') + '/s' + sc);
  }
  sigs.sort();
  return 's' + sigs.length + ':' + sigs.join(';');
}

// ---------------------------------------------------------------------------
// solve(posts) — the authoritative SMT. Cached per post-config; instant on reuse.
// ---------------------------------------------------------------------------
const _cache = new Map();
function cfgKey(P){ return P.map(p => p.x.toFixed(6) + ',' + p.y.toFixed(6)).join(';'); }
function solveRaw(posts){
  const raw = relaxBest(posts, Math.max(80, 60 * posts.length), 0x5eedf00d);
  // 1.5e-3 snap tolerance: a degenerate optimum (e.g. a regular hexagon, whose
  // SMT is just its sides) leaves Steiner points on a near-flat valley ~2e-4 off
  // their terminals — snap them home. Real preset Steiner points sit >0.2 from
  // any post, far outside this radius, so they are never wrongly merged.
  return buildNetwork(posts, raw.pos, raw.edges, 1.5e-3);
}
function solve(posts){
  const k = cfgKey(posts);
  if(_cache.has(k)) return _cache.get(k);
  const net = solveRaw(posts);
  if(_cache.size > 200) _cache.clear();
  _cache.set(k, net);
  return net;
}

// ---------------------------------------------------------------------------
// LIVE relaxation — beginRelax / stepRelax / forceCross. Supports live drag:
// posts are passed every call; the X→two-Y collapse/resplit happens internally.
// ---------------------------------------------------------------------------
const EPS_VIEW = 0.024;      // below this, two Steiner read as a single 4-valent X (a brief flip transient only)
const EPS_FLIP = 0.013;      // below this, commit the topology flip

function beginRelax(posts, seed){
  // Seed the LIVE relaxer from the authoritative GLOBAL optimum (solve, cached),
  // so a drag begins at the true minimum — not a lucky local one. The live
  // descent then tracks the posts and flips topology on Steiner-edge collapse;
  // the view re-snaps to solve() again when motion settles (see stepRelax).
  const Pn = posts.length;
  const net = solve(posts);
  const spos = net.nodes.slice(Pn).map(n => ({ x: n.x, y: n.y }));
  const sedges = net.edges.map(e => e.slice());
  return {
    Pn, spos, sedges,
    step: 0.06, settled: false, cooldown: 0, forced: false,
    topoId: topoSignatureRaw(Pn, sedges)
  };
}

function forceCross(posts){
  // a single hub joined to every post — the unstable 4-valent '+' (= hub-star).
  const Pn = posts.length;
  const hub = geometricMedian(posts);
  const sedges = []; for(let i = 0; i < Pn; i++) sedges.push([i, Pn]);
  return {
    Pn,
    spos: [{ x: hub.x, y: hub.y }],
    sedges, step: 0.06, settled: false, cooldown: 0, forced: true,
    topoId: topoSignatureRaw(Pn, sedges)
  };
}

function stepRelax(rstate, posts, nSteps){
  nSteps = nSteps || 14;
  const Pn = rstate.Pn;
  const pos = posts.map(p => ({ x: p.x, y: p.y })).concat(rstate.spos.map(p => ({ x: p.x, y: p.y })));
  let flip = null;

  // a forced cross (or a degenerate degree≠3 state) — reseed to the true split.
  const forcedNow = rstate.forced || hasBadDegree(Pn, rstate.spos.length, rstate.sedges);
  if(forcedNow){
    const cross = { x: pos[Pn].x, y: pos[Pn].y };
    const raw = relaxBest(posts, 40, 0x5eedf00d);
    flip = { crossNode: cross, axisFrom: 0, axisTo: 1 };
    rstate.spos = raw.pos.slice(Pn).map(p => ({ x: p.x, y: p.y }));
    rstate.sedges = raw.edges.map(e => e.slice());
    rstate.topoId = topoSignatureRaw(Pn, raw.edges);
    rstate.forced = false; rstate.cooldown = 6;
    // start the new Steiner points bunched near the cross so they slide apart
    for(const s of rstate.spos){ s.x = cross.x + (s.x - cross.x) * 0.04; s.y = cross.y + (s.y - cross.y) * 0.04; }
    const pos2 = posts.map(p => ({ x: p.x, y: p.y })).concat(rstate.spos);
    const r2 = descendSteiner(pos2, rstate.sedges, Pn, nSteps, rstate.step);
    rstate.spos = pos2.slice(Pn); rstate.step = r2.step; rstate.settled = false; rstate.lastLen = null;
    return { net: buildNetwork(posts, pos2, rstate.sedges, EPS_VIEW), settled: false, flip };
  }

  // normal descent for the current topology with the live posts
  const r = descendSteiner(pos, rstate.sedges, Pn, nSteps, rstate.step);
  rstate.spos = pos.slice(Pn).map(p => ({ x: p.x, y: p.y }));
  rstate.step = r.step;

  // collapse detection: a Steiner–Steiner edge shrinking to zero ⇒ topology flip
  if(rstate.cooldown <= 0){
    let minSS = Infinity, mid = null;
    for(const [a, b] of rstate.sedges){
      if(a >= Pn && b >= Pn){
        const d = dist(pos[a], pos[b]);
        if(d < minSS){ minSS = d; mid = { x: (pos[a].x + pos[b].x) / 2, y: (pos[a].y + pos[b].y) / 2 }; }
      }
    }
    if(minSS < EPS_FLIP){
      const raw = relaxBest(posts, 36, 0x5eedf00d);
      const newId = topoSignatureRaw(Pn, raw.edges);
      if(newId !== rstate.topoId){
        flip = { crossNode: mid, axisFrom: 0, axisTo: 1 };
        rstate.spos = raw.pos.slice(Pn).map(p => ({ x: p.x, y: p.y }));
        rstate.sedges = raw.edges.map(e => e.slice());
        rstate.topoId = newId; rstate.cooldown = 8; rstate.settled = false; rstate.lastLen = null;
        const pos3 = posts.map(p => ({ x: p.x, y: p.y })).concat(rstate.spos);
        return { net: buildNetwork(posts, pos3, rstate.sedges, EPS_VIEW), settled: false, flip };
      }
    }
  } else rstate.cooldown--;

  // settle when the total length stops changing (robust even near a Steiner
  // near-collapse, where the gradient is finicky) OR the descent can no longer
  // improve. The VIEW then re-snaps to the exact global solve(), so this need
  // not be tight — it only decides WHEN to hand off to the authoritative answer.
  const dLen = rstate.lastLen == null ? Infinity : Math.abs(r.length - rstate.lastLen);
  rstate.lastLen = r.length;
  const settled = dLen < 5e-10 || !r.progressed;
  rstate.settled = settled;
  return { net: buildNetwork(posts, pos, rstate.sedges, EPS_VIEW), settled, flip };
}
function hasBadDegree(Pn, M, edges){
  const deg = new Array(Pn + M).fill(0);
  for(const [a, b] of edges){ deg[a]++; deg[b]++; }
  for(let i = Pn; i < Pn + M; i++) if(deg[i] !== 3) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Baselines to lose to the film.
// ---------------------------------------------------------------------------
// Naive Euclidean minimum spanning tree (Prim) over the posts only.
function spanningTree(posts){
  const N = posts.length;
  const nodes = posts.map(p => ({ x: p.x, y: p.y, kind: 'post', post: -1, degree: 0 }));
  nodes.forEach((n, i) => n.post = i);
  if(N <= 1) return baseNet(nodes, []);
  const inTree = new Array(N).fill(false);
  const best = new Array(N).fill(Infinity), from = new Array(N).fill(-1);
  best[0] = 0; const edges = [];
  for(let it = 0; it < N; it++){
    let u = -1; for(let i = 0; i < N; i++) if(!inTree[i] && (u < 0 || best[i] < best[u])) u = i;
    inTree[u] = true; if(from[u] >= 0) edges.push([from[u], u]);
    for(let v = 0; v < N; v++) if(!inTree[v]){ const d = dist(posts[u], posts[v]); if(d < best[v]){ best[v] = d; from[v] = u; } }
  }
  return baseNet(nodes, edges);
}
// single geometric-median hub joined to every post (the 'X' / star baseline).
function hubStar(posts){
  const N = posts.length;
  const hub = geometricMedian(posts);
  const nodes = posts.map((p, i) => ({ x: p.x, y: p.y, kind: 'post', post: i, degree: 0 }));
  nodes.push({ x: hub.x, y: hub.y, kind: 'steiner', post: -1, degree: 0 });
  const edges = []; for(let i = 0; i < N; i++) edges.push([i, N]);
  return baseNet(nodes, edges);
}
function geometricMedian(P){
  let c = { x: 0, y: 0 }; for(const p of P){ c.x += p.x; c.y += p.y; } c.x /= P.length; c.y /= P.length;
  for(let it = 0; it < 200; it++){
    let nx = 0, ny = 0, w = 0;
    for(const p of P){ const d = Math.max(1e-9, dist(c, p)); nx += p.x / d; ny += p.y / d; w += 1 / d; }
    const next = { x: nx / w, y: ny / w };
    if(dist(next, c) < 1e-12){ c = next; break; } c = next;
  }
  return c;
}
function baseNet(nodes, edges){
  for(const n of nodes) n.degree = 0;
  for(const [a, b] of edges){ nodes[a].degree++; nodes[b].degree++; }
  let L = 0; for(const [a, b] of edges) L += dist(nodes[a], nodes[b]);
  const adjI = Array.from({ length: nodes.length }, () => []);
  for(const [a, b] of edges){ adjI[a].push(b); adjI[b].push(a); }
  const junctions = [];
  for(let i = 0; i < nodes.length; i++){
    if(nodes[i].degree < 3) continue;
    const dirs = adjI[i].map(j => Math.atan2(nodes[j].y - nodes[i].y, nodes[j].x - nodes[i].x)).sort((a, b) => a - b);
    const angs = []; for(let k = 0; k < dirs.length; k++){ let d = dirs[(k + 1) % dirs.length] - dirs[k]; if(d < 0) d += 2 * Math.PI; angs.push(d * 180 / Math.PI); }
    junctions.push({ node: i, angles: angs, plateau: false });
  }
  return { nodes, edges: edges.map(e => e.slice()), totalLength: L, junctions, topologyId: topoSignatureNodes(nodes, edges), steinerCount: nodes.filter(n => n.kind === 'steiner').length, converged: true, iterations: 0 };
}

// Score arbitrary hand-laid roads (the game). nodes:[{x,y}], edges:[[i,j]].
function measureNetwork(nodes, edges){
  let length = 0; for(const [a, b] of edges) length += dist(nodes[a], nodes[b]);
  const deg = new Array(nodes.length).fill(0);
  const adjI = Array.from({ length: nodes.length }, () => []);
  for(const [a, b] of edges){ deg[a]++; deg[b]++; adjI[a].push(b); adjI[b].push(a); }
  const junctions = [];
  for(let i = 0; i < nodes.length; i++){
    if(deg[i] < 3) continue;
    const dirs = adjI[i].map(j => Math.atan2(nodes[j].y - nodes[i].y, nodes[j].x - nodes[i].x)).sort((a, b) => a - b);
    const angs = []; for(let k = 0; k < dirs.length; k++){ let d = dirs[(k + 1) % dirs.length] - dirs[k]; if(d < 0) d += 2 * Math.PI; angs.push(d * 180 / Math.PI); }
    junctions.push({ node: i, angles: angs });
  }
  return { length, junctions };
}
function junctionAngles(net){ return net.junctions.map(j => j.angles); }
function topologyId(net){ return net.topologyId; }

// ---------------------------------------------------------------------------
// SELF-TEST — exercises the REAL core against the independent oracle.
// ---------------------------------------------------------------------------
function runSelfTest(){
  let pass = 0, total = 0; const detail = {};
  const log = (typeof console !== 'undefined');
  function check(name, cond){ total++; if(cond){ pass++; if(log) console.log('PASS: ' + name); } else if(log) console.error('FAIL: ' + name); }

  const T = PRESETS.triangle.anchors, S = PRESETS.square.anchors, Pg = PRESETS.pentagon.anchors;

  // (1–3) ANCHORS: relaxed length === independent oracle <1e-6 on the canonical cases.
  const triR = solveRaw(T).totalLength, triO = steinerExact(T).length;
  detail.triangle = { relax: triR, oracle: triO, exact: Math.sqrt(3) };
  check('triangle: relax==oracle==√3 (relax ' + triR.toFixed(8) + ', diff ' + Math.abs(triR - triO).toExponential(2) + ')',
        Math.abs(triR - triO) < 1e-6 && Math.abs(triR - Math.sqrt(3)) < 1e-6);

  const sqR = solveRaw(S).totalLength, sqO = steinerExact(S).length;
  detail.square = { relax: sqR, oracle: sqO, exact: 1 + Math.sqrt(3) };
  check('square: relax==oracle==1+√3 (relax ' + sqR.toFixed(8) + ', diff ' + Math.abs(sqR - sqO).toExponential(2) + ')',
        Math.abs(sqR - sqO) < 1e-6 && Math.abs(sqR - (1 + Math.sqrt(3))) < 1e-6);

  const pgR = solveRaw(Pg).totalLength, pgO = steinerExact(Pg).length;
  detail.pentagon = { relax: pgR, oracle: pgO };
  check('pentagon: relax==oracle (' + pgR.toFixed(8) + ', diff ' + Math.abs(pgR - pgO).toExponential(2) + ')',
        Math.abs(pgR - pgO) < 1e-6 && Math.abs(pgR - 3.89115682) < 1e-5);

  // (4) INDEPENDENCE: the relaxer and the closed-form oracle — two disjoint
  //     codepaths — agree on an asymmetric scalene case too (not just symmetric).
  const scal = [{ x: 0, y: 0 }, { x: 1.3, y: 0.2 }, { x: 0.4, y: 1.1 }, { x: 1.5, y: 1.4 }];
  const scR = solveRaw(scal).totalLength, scO = steinerExact(scal).length;
  detail.independence = Math.abs(scR - scO);
  check('independence: relax==oracle on a scalene quad (diff ' + Math.abs(scR - scO).toExponential(2) + ')', Math.abs(scR - scO) < 1e-6);

  // (5) PLATEAU: every junction angle is 120° within 1e-4 across the presets.
  let maxAngErr = 0;
  for(const P of [T, S, Pg]){
    const net = solveRaw(P);
    for(const j of net.junctions) for(const a of j.angles) maxAngErr = Math.max(maxAngErr, Math.abs(a - 120));
  }
  detail.maxAngleErr = maxAngErr;
  check('plateau: all junction angles 120° (max err ' + maxAngErr.toExponential(2) + '°)', maxAngErr < 1e-4);

  // (6) NEG-CONTROL: the forced 4-way '+' (2√2 on the square) strictly exceeds the
  //     split (1+√3), and stepRelax actually SPLITS it into two 120° junctions.
  const crossLen = hubStar(S).totalLength;
  let rs = forceCross(S), settledNet = null;
  for(let i = 0; i < 600; i++){ const o = stepRelax(rs, S, 20); settledNet = o.net; if(o.settled) break; }
  const splitLen = settledNet.totalLength;
  const splitJ = settledNet.junctions.filter(j => settledNet.nodes[j.node].kind === 'steiner');
  let splitAngOK = splitJ.length === 2 && splitJ.every(j => j.angles.length === 3 && j.angles.every(a => Math.abs(a - 120) < 1e-2));
  detail.negControl = { cross: crossLen, split: splitLen, twoSqrt2: 2 * Math.SQRT2 };
  check('neg-control: forced + (' + crossLen.toFixed(5) + ' = 2√2) > split (' + splitLen.toFixed(5) +
        ' = 1+√3) and splits into two 120° Ys', crossLen > splitLen + 1e-3 && Math.abs(splitLen - (1 + Math.sqrt(3))) < 1e-5 && splitAngOK);

  // (7) DEGENERACY (bonus): the smartest network sometimes adds NO junction — a
  //     regular hexagon's SMT is its 5 unit sides; relaxer adds zero Steiner points.
  const hexA = regularPolygon(6, 0);
  const hexNet = solveRaw(hexA), hexO = steinerExact(hexA).length;
  detail.hexagon = { relax: hexNet.totalLength, oracle: hexO, steiner: hexNet.steinerCount };
  check('degeneracy: hexagon SMT == 5.0 with NO Steiner points (len ' + hexNet.totalLength.toFixed(6) +
        ', steiner ' + hexNet.steinerCount + ')', Math.abs(hexNet.totalLength - 5) < 1e-4 && Math.abs(hexNet.totalLength - hexO) < 1e-4 && hexNet.steinerCount === 0);

  // (8) DETERMINISM: solve is a pure seeded function — identical on recompute.
  const a1 = solveRaw(S), a2 = solveRaw(S);
  const same = Math.abs(a1.totalLength - a2.totalLength) < 1e-12 && a1.topologyId === a2.topologyId;
  check('determinism: solve is a pure seeded function', same);

  return { pass, total, detail };
}

// ---------------------------------------------------------------------------
const SurveyorCore = {
  solve, beginRelax, stepRelax, forceCross,
  spanningTree, hubStar, measureNetwork, steinerExact,
  junctionAngles, topologyId, PRESETS, runSelfTest,
  // internals exposed for the page renderer / tests
  _solveRaw: solveRaw, _geometricMedian: geometricMedian
};
if(typeof window !== 'undefined') window.SurveyorCore = SurveyorCore;

export {
  solve, beginRelax, stepRelax, forceCross,
  spanningTree, hubStar, measureNetwork, steinerExact,
  junctionAngles, topologyId, PRESETS, runSelfTest, solveRaw, regularPolygon
};
export default SurveyorCore;
