import * as C from './core.mjs';

let pass=0, total=0;
function ok(name, cond, info=''){ total++; if(cond){pass++; console.log('  ✓ '+name+(info?'  ·  '+info:''));} else {console.log('  ✗ '+name+(info?'  ·  '+info:''));} }

console.log('The Provably Shortest Path — Node cross-check\n');

// 1. THE CRUX, at scale — over many random weighted grids, A* (admissible) and
//    Dijkstra return the IDENTICAL minimum cost. (Different work, same answer.)
{
  let worst=0, mismatches=0, tested=0, focused=0;
  for(let s=1; s<=400; s++){
    const g=C.makeGrid(30,18,s);
    const da=C.astar(g), dd=C.dijkstra(g);
    if(!da.reachable || !dd.reachable) continue;
    tested++;
    if(da.cost!==dd.cost) mismatches++;
    worst=Math.max(worst, Math.abs(da.cost-dd.cost));
    if(da.order.length < dd.order.length) focused++;   // A* did strictly less work
  }
  ok('A* cost == Dijkstra cost on every solvable grid (400 seeds)',
     mismatches===0 && tested>300, `${tested} solvable, ${mismatches} mismatches, max Δ=${worst}`);
  ok("A*'s heuristic actually FOCUSES the search (settles fewer cells than Dijkstra)",
     focused > tested*0.8, `${focused}/${tested} grids A* explored strictly less`);
}

// 2. SECOND WITNESS — an independent Bellman-Ford oracle (shares no search code)
//    agrees with A* on the optimum. If two unrelated methods agree, it's the truth.
{
  let mismatches=0, tested=0;
  for(let s=1000; s<1120; s++){
    const g=C.makeGrid(22,14,s);
    const da=C.astar(g);
    if(!da.reachable) continue;
    tested++;
    const bf=C.bellmanFord(g);
    if(da.cost!==bf) mismatches++;
  }
  ok('A* cost == an independent Bellman-Ford oracle (120 seeds)',
     mismatches===0 && tested>90, `${tested} solvable, ${mismatches} mismatches`);
}

// 3. THE RETURNED PATH IS REAL — contiguous, wall-free, start→goal, and its
//    re-summed terrain cost equals the reported cost (the picture can't lie).
{
  let bad=0, tested=0;
  for(let s=5; s<=205; s++){
    const g=C.makeGrid(26,16,s);
    const da=C.astar(g);
    if(!da.reachable) continue;
    tested++;
    const v=C.verifyPath(g, da.path);
    if(!v.ok || v.cost!==da.cost) bad++;
  }
  ok('every A* path is well-formed AND re-summed cost == reported cost',
     bad===0 && tested>150, `${tested} paths, ${bad} malformed`);
}

// 4. THE NEGATIVE — an INADMISSIBLE heuristic (over-weight the estimate) is NOT
//    guaranteed optimal: across seeds it sometimes returns a path COSTLIER than
//    Dijkstra's. This is the precise reason admissibility matters; we PROVE the
//    failure mode exists rather than hand-wave it.
{
  let suboptimal=0, tested=0;
  for(let s=1; s<=400; s++){
    const g=C.makeGrid(30,18,s);
    const dd=C.dijkstra(g);
    if(!dd.reachable) continue;
    tested++;
    const greedy=C.greedyAstar(g, 2.5);   // h × 2.5 ⇒ over-estimates ⇒ inadmissible
    if(greedy.cost > dd.cost) suboptimal++;
  }
  ok('an INADMISSIBLE (over-weighted) heuristic returns a SUBOPTIMAL path on some grids',
     suboptimal>0, `${suboptimal}/${tested} grids the greedy weight overshot the optimum`);
}

// 5. ADMISSIBLE NEVER OVERSHOOTS — the contrapositive: weight=1 A* is NEVER
//    worse than Dijkstra, on any seed. (Belt and suspenders for #1.)
{
  let worse=0, tested=0;
  for(let s=1; s<=600; s++){
    const g=C.makeGrid(24,15,s);
    const dd=C.dijkstra(g); if(!dd.reachable) continue; tested++;
    const da=C.astar(g);
    if(da.cost > dd.cost) worse++;
  }
  ok('admissible A* is NEVER costlier than Dijkstra (600 seeds)', worse===0 && tested>450, `${tested} solvable, ${worse} worse`);
}

// 6. SEED PURITY — same seed ⇒ bit-identical grid & path (a measurement, not a mood).
{
  const a=C.astar(C.makeGrid(28,17,777));
  const b=C.astar(C.makeGrid(28,17,777));
  ok('seed-pure: identical seed ⇒ identical cost AND identical path',
     a.cost===b.cost && a.path.length===b.path.length && a.path.every((p,i)=>p.x===b.path[i].x&&p.y===b.path[i].y),
     `cost=${a.cost}, len=${a.path.length}`);
}

// 7. THE FLOOD IS MONOTONE — Dijkstra settles cells in NON-DECREASING g-cost
//    order (the invariant that proves it's correct). Assert it directly.
{
  const g=C.makeGrid(34,20,321);
  const dd=C.dijkstra(g);
  // recompute g of each settled cell by re-running and inspecting order via costs
  // settle order must be non-decreasing in distance-from-start.
  // Reconstruct g-scores along the settle order by a fresh Dijkstra dist field.
  const W=g.W;
  const dist=new Float64Array(g.W*g.H).fill(Infinity);
  // cheap: Bellman gives the field; check order costs are sorted
  // (use search settle order against true distances)
  // recompute distances with bellmanFord-style full relaxation:
  const distField=(()=>{
    const d=new Float64Array(g.W*g.H).fill(Infinity); d[g.idx(g.start.x,g.start.y)]=0;
    let ch=true,rnd=0; const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
    while(ch && rnd++<g.W*g.H+5){ ch=false;
      for(let y=0;y<g.H;y++)for(let x=0;x<g.W;x++){ const cur=g.idx(x,y); if(!isFinite(d[cur]))continue;
        for(const[dx,dy]of DIRS){ const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=g.W||ny>=g.H)continue;
          const c=g.cost[g.idx(nx,ny)]; if(c===C.WALL)continue; const id=g.idx(nx,ny);
          if(d[cur]+c<d[id]){d[id]=d[cur]+c;ch=true;} } } }
    return d; })();
  let monotone=true, prev=-1;
  for(const id of dd.order){ const dv=distField[id]; if(dv<prev-1e-9){ monotone=false; break; } prev=dv; }
  ok("Dijkstra settles cells in non-decreasing distance order (its correctness invariant)", monotone, `${dd.order.length} cells settled`);
}

// 8. UNREACHABLE IS REPORTED, NOT FAKED — wall the goal in completely; the search
//    must report unreachable (cost ∞, empty path), never a bogus finite path.
{
  const g=C.makeGrid(20,12,9);
  // ring-wall the goal: every neighbour of goal a wall, goal itself a wall-free island
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=g.goal.x+dx, ny=g.goal.y+dy;
    if(nx>=0&&nx<g.W&&ny>=0&&ny<g.H) g.cost[g.idx(nx,ny)]=C.WALL;
  }
  const da=C.astar(g);
  ok('a walled-off goal is reported UNREACHABLE (∞ cost, empty path), never faked',
     !da.reachable && da.cost===Infinity && da.path.length===0, `reachable=${da.reachable}`);
}

// 9. PERCOLATION THRESHOLD — the measured site-percolation crossover brackets the
//    literature p_c ≈ 0.5927 for the 2-D square lattice (a real constant, measured).
{
  const pc = C.findThreshold(40, 40, 4242);
  const err = Math.abs(pc - C.PC_SQUARE_SITE);
  ok('measured site-percolation threshold ≈ p_c = 0.5927 (square lattice)',
     err < 0.04, `measured p_c=${pc.toFixed(4)} vs ${C.PC_SQUARE_SITE} (Δ${err.toFixed(4)})`);
}

// 10. PERCOLATION MONOTONICITY — spanning probability rises with p (more open ⇒
//     more likely to span); P is low well below p_c and high well above it.
{
  const lo = C.spanProbability(40, 0.45, 60, 11);
  const hi = C.spanProbability(40, 0.75, 60, 11);
  ok('spanning probability is low below p_c and high above it (monotone in p)',
     lo < 0.25 && hi > 0.85, `P(0.45)=${lo.toFixed(2)}, P(0.75)=${hi.toFixed(2)}`);
}

console.log(`\n${pass}/${total} ${pass===total?'✓ ALL GREEN':'✗ FAILURES'}`);
process.exit(pass===total?0:1);
