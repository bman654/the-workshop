// ============================================================================
//  Theseus's Thread — the maze, provably solved.  CORE (pure, zero-dep).
//
//  A CROSS-POLLINATION of two rooms:
//    • daedalus/  — generates labyrinths (passage-bitmask cells: N=1 E=2 S=4 W=8)
//    • pathfinder/ — proves a shortest path optimal (A* == Dijkstra == an oracle)
//
//  Daedalus already animates flood-fill / A* solvers — but they are VIEWS, not
//  PROOFS. And a "perfect" maze is too easy to be interesting: it is a tree, so
//  there is exactly ONE path between any two cells, and "shortest" is trivial.
//
//  Here we make the optimality genuinely falsifiable:
//    1. carve a perfect maze (recursive backtracker — same family as Daedalus),
//    2. BRAID it: knock out a fraction of dead-ends → loops → MANY routes exist,
//    3. weight each corridor with terrain (1..maxCost enter-cost) so the route
//       that LOOKS shortest (fewest cells) is usually NOT the cheapest.
//  Now the maze is a real WEIGHTED GRAPH, and the cheapest thread is non-obvious.
//
//  The crux (the workshop's signature): we do not trust the picture. Theseus's
//  thread is proven minimal by THREE unrelated witnesses that must agree on the
//  cost or the self-test goes red:
//    • A*       — heuristic = Manhattan × min-corridor-cost (admissible+consistent)
//    • Dijkstra — A* with h=0 (the textbook optimum; no heuristic to trust)
//    • an independent Bellman-Ford relaxation that shares NO code with the heap.
//  And the NEGATIVE: an INADMISSIBLE (over-weighted) heuristic returns a costlier
//  thread on some mazes — the exact reason admissibility is what makes A* safe.
// ============================================================================

// --- deterministic PRNG (mulberry32) — same family used across the estate ---
export function rng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// passage bitmask per cell — N=1 E=2 S=4 W=8 (bit set ⇒ that wall is OPEN).
// Identical convention to daedalus/index.html so a Daedalus maze drops straight in.
export const N=1, E=2, S=4, W=8;
const DIRS = [             // [dx, dy, bit-in-this-cell, opposite-bit-in-neighbour]
  [ 0,-1, N, S],
  [ 1, 0, E, W],
  [ 0, 1, S, N],
  [-1, 0, W, E],
];

// ============================================================================
//  GENERATE — a recursive-backtracker perfect maze, then braid + weight it.
//  Returns { W, H, cells, cost, start, goal, idx } where:
//    cells[i] = open-passage bitmask (the graph edges)
//    cost[i]  = enter-cost of cell i (terrain weight; ≥1)
//  start = top-left, goal = bottom-right (the classic labyrinth entrance/heart).
// ============================================================================
export function makeMaze(Wd, Hd, seed, opts={}){
  const braid  = opts.braid  ?? 0.45;   // fraction of dead-ends to open → loops
  const maxCost= opts.maxCost?? 9;      // heaviest corridor terrain
  const N_      = Wd*Hd;
  const idx = (x,y)=> y*Wd + x;
  const r = rng((seed|0) ^ 0x1d872b41);
  const cells = new Uint8Array(N_);

  // -- recursive backtracker (iterative stack) -- a "perfect" (tree) maze --
  const visited = new Uint8Array(N_);
  const stack = [0];
  visited[0] = 1;
  while(stack.length){
    const c = stack[stack.length-1];
    const cx = c % Wd, cy = (c/Wd)|0;
    // shuffle the 4 directions for this cell
    const order = [0,1,2,3];
    for(let i=3;i>0;i--){ const j=(r()*(i+1))|0; const t=order[i]; order[i]=order[j]; order[j]=t; }
    let advanced = false;
    for(const di of order){
      const [dx,dy,bit,opp] = DIRS[di];
      const nx=cx+dx, ny=cy+dy;
      if(nx<0||ny<0||nx>=Wd||ny>=Hd) continue;
      const n = idx(nx,ny);
      if(visited[n]) continue;
      cells[c] |= bit; cells[n] |= opp;   // open the wall between c and n
      visited[n] = 1; stack.push(n); advanced = true; break;
    }
    if(!advanced) stack.pop();
  }

  // -- BRAID: remove dead-ends to create loops (multiple routes). A dead-end
  //    has exactly one open passage; open a second wall (to a real neighbour)
  //    with probability `braid`. This turns the tree into a graph with cycles. --
  for(let y=0;y<Hd;y++) for(let x=0;x<Wd;x++){
    const c = idx(x,y);
    if(popcount(cells[c]) !== 1) continue;          // not a dead-end
    if(r() >= braid) continue;
    // collect closed directions that lead to a real neighbour
    const cands = [];
    for(const [dx,dy,bit,opp] of DIRS){
      if(cells[c] & bit) continue;                  // already open
      const nx=x+dx, ny=y+dy;
      if(nx<0||ny<0||nx>=Wd||ny>=Hd) continue;
      cands.push([dx,dy,bit,opp,nx,ny]);
    }
    if(!cands.length) continue;
    const [dx,dy,bit,opp,nx,ny] = cands[(r()*cands.length)|0];
    cells[c] |= bit; cells[idx(nx,ny)] |= opp;
  }

  // -- TERRAIN: smooth value-noise enter-cost so "fewest cells" ≠ "cheapest" --
  const cost = new Int16Array(N_);
  const oct = (sx,sy)=>{
    const gw=Math.ceil(Wd/sx)+2, gh=Math.ceil(Hd/sy)+2, g=[];
    for(let j=0;j<gh;j++){ g.push([]); for(let i=0;i<gw;i++) g[j].push(r()); }
    return (x,y)=>{
      const fx=x/sx, fy=y/sy, ix=Math.floor(fx), iy=Math.floor(fy);
      const tx=fx-ix, ty=fy-iy;
      const a=g[iy][ix], b=g[iy][ix+1], c2=g[iy+1][ix], d=g[iy+1][ix+1];
      const u=tx*tx*(3-2*tx), v=ty*ty*(3-2*ty);
      return (a*(1-u)+b*u)*(1-v) + (c2*(1-u)+d*u)*v;
    };
  };
  const n1=oct(5,5), n2=oct(2,2);
  for(let y=0;y<Hd;y++) for(let x=0;x<Wd;x++){
    const n = 0.6*n1(x,y) + 0.4*n2(x,y);
    cost[idx(x,y)] = 1 + Math.round(n*(maxCost-1));   // 1..maxCost
  }
  const start = { x:0, y:0 };
  const goal  = { x:Wd-1, y:Hd-1 };
  cost[idx(start.x,start.y)] = 1;                       // free to stand at the door
  return { W:Wd, H:Hd, cells, cost, start, goal, idx };
}

function popcount(b){ let c=0; while(b){ c+=b&1; b>>=1; } return c; }
export { popcount };

// minimum terrain cost in the maze — the admissible-heuristic scale factor.
export function minCost(m){
  let lo = Infinity;
  for(let i=0;i<m.cost.length;i++) if(m.cost[i]<lo) lo=m.cost[i];
  return lo;
}

// neighbours of cell (x,y) reachable through an OPEN passage (the graph edges).
// Edge weight = enter-cost of the destination cell. This is the whole graph.
export function neighbours(m, x, y){
  const out = [];
  const here = m.cells[m.idx(x,y)];
  for(const [dx,dy,bit] of DIRS){
    if(!(here & bit)) continue;          // wall is closed ⇒ no edge
    const nx=x+dx, ny=y+dy;
    if(nx<0||ny<0||nx>=m.W||ny>=m.H) continue;
    out.push({ x:nx, y:ny, w: m.cost[m.idx(nx,ny)] });
  }
  return out;
}

// ============================================================================
//  BINARY MIN-HEAP — O(E log V) Dijkstra/A* (no O(V²) min-scan). Stores {k,v}.
// ============================================================================
class MinHeap{
  constructor(){ this.a=[]; }
  get size(){ return this.a.length; }
  push(k,v){ const a=this.a; a.push({k,v}); let i=a.length-1;
    while(i>0){ const p=(i-1)>>1; if(a[p].k<=a[i].k) break; [a[p],a[i]]=[a[i],a[p]]; i=p; } }
  pop(){ const a=this.a; const top=a[0], last=a.pop();
    if(a.length){ a[0]=last; let i=0; const n=a.length;
      for(;;){ let l=2*i+1, rr=l+1, mn=i;
        if(l<n&&a[l].k<a[mn].k) mn=l; if(rr<n&&a[rr].k<a[mn].k) mn=rr;
        if(mn===i) break; [a[mn],a[i]]=[a[i],a[mn]]; i=mn; } }
    return top; }
}

// Manhattan distance — never over-estimates the true remaining cost when scaled
// by the minimum corridor cost (every step costs ≥ minCost, diagonals forbidden),
// so h = Manhattan × minCost is ADMISSIBLE & CONSISTENT ⇒ A* is provably optimal.
export function manhattan(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }

// ============================================================================
//  THE SEARCH — one routine drives both A* and Dijkstra (h=0 ⇒ Dijkstra).
//  hScale is the admissible-heuristic factor (minCost); hWeight>1 breaks
//  admissibility on purpose (the greedy/inadmissible mode → the negative result).
//  Returns { cost, path, order, reachable }; `order` = cells settled (the flood).
// ============================================================================
export function search(m, { hScale=0, hWeight=1 }={}){
  const { W, H, start, goal, idx } = m;
  const g = new Float64Array(W*H).fill(Infinity);
  const came = new Int32Array(W*H).fill(-1);
  const settled = new Uint8Array(W*H);
  const order = [];
  const sId = idx(start.x,start.y), gId = idx(goal.x,goal.y);
  const heur = (x,y)=> hWeight * hScale * manhattan({x,y}, goal);

  g[sId] = 0;
  const open = new MinHeap();
  open.push(heur(start.x,start.y), sId);

  while(open.size){
    const { v: cur } = open.pop();
    if(settled[cur]) continue;             // stale heap entry (lazy deletion)
    settled[cur] = 1;
    order.push(cur);
    if(cur === gId) break;
    const cx = cur % W, cy = (cur/W)|0;
    for(const nb of neighbours(m, cx, cy)){
      const nId = idx(nb.x, nb.y);
      if(settled[nId]) continue;
      const tentative = g[cur] + nb.w;
      if(tentative < g[nId]){
        g[nId] = tentative; came[nId] = cur;
        open.push(tentative + heur(nb.x, nb.y), nId);
      }
    }
  }

  if(!isFinite(g[gId])) return { cost:Infinity, path:[], order, reachable:false };
  const path = [];
  for(let c=gId; c!==-1; c=came[c]) path.push({ x:c%W, y:(c/W)|0 });
  path.reverse();
  return { cost:g[gId], path, order, reachable:true };
}

export function astar(m){ return search(m, { hScale: minCost(m), hWeight: 1 }); }
export function dijkstra(m){ return search(m, { hScale: 0, hWeight: 1 }); }
export function greedy(m, w){ return search(m, { hScale: minCost(m), hWeight: w }); }

// ============================================================================
//  GROUND TRUTH — an independent Bellman-Ford relaxation over the maze graph.
//  Shares NO code with the heap search: it just sweeps every cell, relaxing
//  every open edge, until nothing changes. Slow but obviously correct; if A*
//  agrees with it, A* is trusted. The self-test's second witness to the optimum.
// ============================================================================
export function bellmanFord(m){
  const { W, H, start, goal, idx } = m;
  const dist = new Float64Array(W*H).fill(Infinity);
  dist[idx(start.x,start.y)] = 0;
  let changed = true, rounds = 0, maxRounds = W*H + 5;
  while(changed && rounds++ < maxRounds){
    changed = false;
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      const cur = idx(x,y);
      if(!isFinite(dist[cur])) continue;
      for(const nb of neighbours(m, x, y)){
        const nId = idx(nb.x, nb.y);
        if(dist[cur] + nb.w < dist[nId]){ dist[nId] = dist[cur] + nb.w; changed = true; }
      }
    }
  }
  return dist[idx(goal.x,goal.y)];
}

// Verify Theseus's thread is WELL-FORMED and its summed cost matches its
// reported cost: contiguous single steps, each through a REAL OPEN PASSAGE
// (not a wall), start→goal, cost = Σ enter-costs. The picture cannot lie.
export function verifyThread(m, path){
  if(!path.length) return { ok:false, why:'empty', cost:Infinity };
  const a=path[0], b=path[path.length-1];
  if(a.x!==m.start.x||a.y!==m.start.y) return { ok:false, why:'bad-start', cost:Infinity };
  if(b.x!==m.goal.x ||b.y!==m.goal.y ) return { ok:false, why:'bad-goal',  cost:Infinity };
  let cost=0;
  for(let i=1;i<path.length;i++){
    const p=path[i-1], q=path[i];
    const dx=q.x-p.x, dy=q.y-p.y;
    if(Math.abs(dx)+Math.abs(dy)!==1) return { ok:false, why:'non-adjacent', cost:Infinity };
    // the step must cross an OPEN passage in BOTH cells (the maze's defining law)
    let bit=0, opp=0;
    if(dx=== 1){ bit=E; opp=W; } else if(dx===-1){ bit=W; opp=E; }
    else if(dy=== 1){ bit=S; opp=N; } else { bit=N; opp=S; }
    if(!(m.cells[m.idx(p.x,p.y)] & bit) || !(m.cells[m.idx(q.x,q.y)] & opp))
      return { ok:false, why:'through-wall', cost:Infinity };
    cost += m.cost[m.idx(q.x,q.y)];
  }
  return { ok:true, cost };
}

// Is the whole maze CONNECTED (every cell reachable from start)? A braided maze
// must stay fully traversable — the goal is never walled off by braiding.
export function connectedCount(m){
  const seen = new Uint8Array(m.W*m.H);
  const stack = [m.idx(m.start.x,m.start.y)]; seen[stack[0]]=1; let count=1;
  while(stack.length){
    const c=stack.pop(); const x=c%m.W, y=(c/m.W)|0;
    for(const nb of neighbours(m, x, y)){
      const id=m.idx(nb.x,nb.y);
      if(!seen[id]){ seen[id]=1; count++; stack.push(id); }
    }
  }
  return count;
}
