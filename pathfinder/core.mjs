// ============================================================================
//  The Provably Shortest Path — pathfinding CORE
//  Pure, dependency-free. Identical code is inlined into index.html; this file
//  is the Node-testable twin (the falsifiability harness runs against it).
//
//  The promise (the workshop's signature): a path that LOOKS short isn't a
//  proof. So we don't trust the picture — we prove it. On a weighted grid we
//  run A* (with an admissible, consistent heuristic) AND Dijkstra (the
//  textbook optimum) AND, on small grids, an exhaustive search. Their costs
//  must be EQUAL. A* may explore fewer cells (that's the whole point of a
//  heuristic), but the cost it returns is the proven minimum, or the self-test
//  goes red. We also assert the negative: an INADMISSIBLE (over-estimating)
//  heuristic can return a path that is NOT optimal — exactly why admissibility
//  is the thing that makes A* trustworthy.
// ============================================================================

// --- deterministic PRNG (mulberry32) so generated grids are seed-reproducible -
export function rng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
//  GRID — a W×H lattice. Each cell has a movement COST (the cost paid to ENTER
//  it) and may be a WALL (impassable). The graph: 4-connected (N/E/S/W); the
//  edge weight into a neighbour is that neighbour's cost. Start is top-left
//  region, goal bottom-right region. Terrain costs make some routes cheaper
//  than the straight line — so "looks short" and "is cheapest" genuinely differ.
// ============================================================================

export const WALL = -1;

// Terrain palette: enter-cost per cell. 1 = open, higher = slow (mud/forest),
// WALL = blocked. Diagonal moves are NOT allowed (keeps the heuristic exact).
export function makeGrid(W, H, seed, opts={}){
  const wallP = opts.wallP ?? 0.24;     // fraction of cells that are walls
  const maxCost = opts.maxCost ?? 9;    // heaviest passable terrain
  const r = rng((seed|0) ^ 0x9e3779b9);
  const cost = new Int16Array(W*H);
  const idx = (x,y)=> y*W + x;

  // terrain via a couple of coarse value-noise octaves → patchy, map-like cost
  const oct = (sx,sy)=>{
    const g = [];
    const gw = Math.ceil(W/sx)+2, gh = Math.ceil(H/sy)+2;
    for(let j=0;j<gh;j++){ g.push([]); for(let i=0;i<gw;i++) g[j].push(r()); }
    return (x,y)=>{
      const fx=x/sx, fy=y/sy, ix=Math.floor(fx), iy=Math.floor(fy);
      const tx=fx-ix, ty=fy-iy;
      const a=g[iy][ix], b=g[iy][ix+1], c=g[iy+1][ix], d=g[iy+1][ix+1];
      const sx2=tx*tx*(3-2*tx), sy2=ty*ty*(3-2*ty);
      return (a*(1-sx2)+b*sx2)*(1-sy2) + (c*(1-sx2)+d*sx2)*sy2;
    };
  };
  const n1 = oct(7,7), n2 = oct(3,3);

  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const n = 0.65*n1(x,y) + 0.35*n2(x,y);   // 0..1 terrain field
    let c = 1 + Math.round(n * (maxCost-1));  // 1..maxCost
    if(r() < wallP) c = WALL;
    cost[idx(x,y)] = c;
  }

  const start = { x: 0, y: (H>>1) };
  const goal  = { x: W-1, y: (H>>1) };
  // carve the endpoints + their immediate neighbours open so a path can exist
  for(const p of [start, goal]){
    cost[idx(p.x,p.y)] = 1;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=p.x+dx, ny=p.y+dy;
      if(nx>=0&&nx<W&&ny>=0&&ny<H && cost[idx(nx,ny)]===WALL) cost[idx(nx,ny)] = 1;
    }
  }
  return { W, H, cost, start, goal, idx };
}

// Cost to ENTER cell (x,y); +Infinity if a wall / off-grid.
function enterCost(g, x, y){
  if(x<0||y<0||x>=g.W||y>=g.H) return Infinity;
  const c = g.cost[g.idx(x,y)];
  return c===WALL ? Infinity : c;
}
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

// ============================================================================
//  A BINARY MIN-HEAP — so Dijkstra/A* run in O(E log V), not the brute O(V²)
//  "scan for the min" that the user-rules tell me to avoid. Stores {k:key, v:id}.
// ============================================================================
class MinHeap{
  constructor(){ this.a=[]; }
  get size(){ return this.a.length; }
  push(k,v){ const a=this.a; a.push({k,v}); let i=a.length-1;
    while(i>0){ const p=(i-1)>>1; if(a[p].k<=a[i].k) break; [a[p],a[i]]=[a[i],a[p]]; i=p; } }
  pop(){ const a=this.a; const top=a[0], last=a.pop();
    if(a.length){ a[0]=last; let i=0; const n=a.length;
      for(;;){ let l=2*i+1, r=l+1, m=i;
        if(l<n&&a[l].k<a[m].k) m=l; if(r<n&&a[r].k<a[m].k) m=r;
        if(m===i) break; [a[m],a[i]]=[a[i],a[m]]; i=m; } }
    return top; }
}

// Manhattan distance × the minimum possible terrain cost (=1). Because every
// step costs ≥1 and diagonals are forbidden, |Δx|+|Δy| NEVER over-estimates the
// true remaining cost ⇒ ADMISSIBLE (and consistent). This is what makes A*
// provably optimal here. `weight` lets us deliberately break that.
export function manhattan(a, b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }

// ============================================================================
//  THE SEARCH — one routine drives both. h=()=>0 makes it pure Dijkstra (A*
//  with a zero heuristic). A real h focuses the frontier toward the goal.
//  Returns { cost, path, order } where `order` is the cells popped/settled
//  (the "flood" — its length is how much work the algorithm did).
// ============================================================================
export function search(g, h = manhattan, hWeight = 1){
  const { W, H, start, goal, idx } = g;
  const gScore = new Float64Array(W*H).fill(Infinity);
  const came = new Int32Array(W*H).fill(-1);
  const settled = new Uint8Array(W*H);
  const order = [];
  const sId = idx(start.x,start.y), gId = idx(goal.x,goal.y);
  const heur = (x,y)=> hWeight * h({x,y}, goal);

  gScore[sId] = 0;
  const open = new MinHeap();
  open.push(heur(start.x,start.y), sId);

  while(open.size){
    const { v: cur } = open.pop();
    if(settled[cur]) continue;          // stale heap entry (lazy deletion)
    settled[cur] = 1;
    order.push(cur);
    if(cur === gId) break;
    const cx = cur % W, cy = (cur / W)|0;
    for(const [dx,dy] of DIRS){
      const nx=cx+dx, ny=cy+dy;
      const ec = enterCost(g, nx, ny);
      if(!isFinite(ec)) continue;
      const nId = idx(nx,ny);
      if(settled[nId]) continue;
      const tentative = gScore[cur] + ec;
      if(tentative < gScore[nId]){
        gScore[nId] = tentative;
        came[nId] = cur;
        open.push(tentative + heur(nx,ny), nId);
      }
    }
  }

  if(!isFinite(gScore[gId])) return { cost: Infinity, path: [], order, reachable: false };
  // reconstruct
  const path = [];
  for(let c=gId; c!==-1; c=came[c]) path.push({ x: c%W, y: (c/W)|0 });
  path.reverse();
  return { cost: gScore[gId], path, order, reachable: true };
}

// Convenience wrappers.
export function dijkstra(g){ return search(g, ()=>0, 1); }                 // h=0
export function astar(g){ return search(g, manhattan, 1); }               // admissible
export function greedyAstar(g, w){ return search(g, manhattan, w); }      // w>1 ⇒ inadmissible

// ============================================================================
//  GROUND TRUTH — an independent shortest-path oracle that shares NO code with
//  search(): a Bellman-Ford-style relaxation to convergence over ALL cells.
//  Slower (O(V·E)) but dead-simple and obviously correct, so if A*==this we
//  trust A*. Used by the self-test as a second witness to the optimum.
// ============================================================================
export function bellmanFord(g){
  const { W, H, start, goal, idx } = g;
  const dist = new Float64Array(W*H).fill(Infinity);
  dist[idx(start.x,start.y)] = 0;
  // relax until no change (a grid's longest simple path bounds the rounds)
  let changed = true, rounds = 0, maxRounds = W*H + 5;
  while(changed && rounds++ < maxRounds){
    changed = false;
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      const cur = idx(x,y);
      if(!isFinite(dist[cur])) continue;
      for(const [dx,dy] of DIRS){
        const nx=x+dx, ny=y+dy;
        const ec = enterCost(g, nx, ny);
        if(!isFinite(ec)) continue;
        const nId = idx(nx,ny);
        if(dist[cur] + ec < dist[nId]){ dist[nId] = dist[cur] + ec; changed = true; }
      }
    }
  }
  return dist[idx(goal.x,goal.y)];
}

// Verify a path is WELL-FORMED and its summed cost matches its reported cost:
// contiguous 4-steps, start→goal, no walls, cost = Σ enter-costs of each step.
export function verifyPath(g, path){
  if(!path.length) return { ok:false, why:'empty', cost:Infinity };
  const a=path[0], b=path[path.length-1];
  if(a.x!==g.start.x||a.y!==g.start.y) return { ok:false, why:'bad-start', cost:Infinity };
  if(b.x!==g.goal.x ||b.y!==g.goal.y ) return { ok:false, why:'bad-goal',  cost:Infinity };
  let cost=0;
  for(let i=1;i<path.length;i++){
    const p=path[i-1], q=path[i];
    const md=Math.abs(p.x-q.x)+Math.abs(p.y-q.y);
    if(md!==1) return { ok:false, why:'non-adjacent', cost:Infinity };
    const ec=enterCost(g, q.x, q.y);
    if(!isFinite(ec)) return { ok:false, why:'through-wall', cost:Infinity };
    cost+=ec;
  }
  return { ok:true, cost };
}

// ============================================================================
//  PERCOLATION — the second face of the discrete-algorithms vein. Open each
//  site with probability p; ask whether an OPEN cluster spans top→bottom. The
//  square-lattice site threshold is p_c ≈ 0.5927. Below it, spanning is rare;
//  above it, near-certain. We MEASURE the crossover and assert it brackets the
//  literature value — a falsifiable physical constant, not a drawing.
// ============================================================================
export function percolates(N, p, seedRand){   // returns {spans, open:Uint8Array}
  const open = new Uint8Array(N*N);
  for(let i=0;i<N*N;i++) open[i] = seedRand() < p ? 1 : 0;
  // BFS flood from every open cell in the TOP row; spans if it reaches bottom.
  const seen = new Uint8Array(N*N);
  const stack = [];
  for(let x=0;x<N;x++){ if(open[x]){ stack.push(x); seen[x]=1; } }
  let spans=false;
  while(stack.length){
    const c=stack.pop(); const x=c%N, y=(c/N)|0;
    if(y===N-1){ spans=true; }   // reached bottom row
    for(const [dx,dy] of DIRS){
      const nx=x+dx, ny=y+dy;
      if(nx<0||ny<0||nx>=N||ny>=N) continue;
      const id=ny*N+nx;
      if(open[id] && !seen[id]){ seen[id]=1; stack.push(id); }
    }
  }
  return { spans, open, seen };
}

// Estimate the spanning PROBABILITY at site-prob p over `trials` random lattices.
export function spanProbability(N, p, trials, seed){
  const r = rng((seed|0) ^ Math.round(p*1e6) ^ (N*2654435761));
  let hits=0;
  for(let t=0;t<trials;t++) if(percolates(N, p, r).spans) hits++;
  return hits/trials;
}

// Locate the threshold by bisection on the spanning probability = 0.5 crossing.
export function findThreshold(N, trials, seed){
  let lo=0.40, hi=0.80;
  for(let it=0; it<14; it++){
    const mid=(lo+hi)/2;
    const P=spanProbability(N, mid, trials, seed+it);
    if(P < 0.5) lo=mid; else hi=mid;
  }
  return (lo+hi)/2;
}

export const PC_SQUARE_SITE = 0.5927; // literature site-percolation threshold, 2-D square lattice
