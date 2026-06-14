// ============================================================================
//  Theseus's Thread — headless falsifiability harness.
//  Runs the SAME pure core that the page inlines, against many random mazes,
//  and asserts the claims the page makes. Run: node labyrinth/core.test.mjs
// ============================================================================
import {
  makeMaze, astar, dijkstra, greedy, bellmanFord, verifyThread,
  connectedCount, neighbours, minCost, popcount, rng,
} from './core.mjs';

let pass=0, fail=0;
const ok  = (c,msg)=>{ if(c){pass++; console.log('  ok   '+msg);} else {fail++; console.log('  FAIL '+msg);} };
const near= (a,b,e,msg)=> ok(Math.abs(a-b)<=e, msg+`  (Δ=${Math.abs(a-b).toExponential(2)})`);

console.log('\nTheseus\'s Thread — core falsifiability harness\n');

// 1) THE CENTRAL CLAIM: A* == Dijkstra == Bellman-Ford on cost, over many mazes.
//    Three unrelated methods agree on the minimum, or the proof is a lie.
{
  let mismatches=0, aLessWork=0, trials=400;
  for(let s=1; s<=trials; s++){
    const m = makeMaze(16, 16, s, { braid:0.5 });
    const A=astar(m), D=dijkstra(m), bf=bellmanFord(m);
    if(!(A.cost===D.cost && D.cost===bf)) mismatches++;
    if(A.order.length < D.order.length) aLessWork++;
  }
  ok(mismatches===0, `A* == Dijkstra == Bellman-Ford over ${trials} braided mazes (${mismatches} mismatches)`);
  ok(aLessWork > trials*0.6, `A* settled fewer cells than Dijkstra on most mazes (${aLessWork}/${trials} — the heuristic focuses the thread)`);
}

// 2) The thread is WELL-FORMED and its re-summed cost == the reported cost.
//    The picture cannot lie: every step crosses a real open passage.
{
  let bad=0, costMismatch=0, trials=300;
  for(let s=1; s<=trials; s++){
    const m = makeMaze(14, 14, s*7+3, { braid:0.4 });
    const A = astar(m);
    const v = verifyThread(m, A.path);
    if(!v.ok) bad++;
    if(v.ok && v.cost !== A.cost) costMismatch++;
  }
  ok(bad===0, `every A* thread is well-formed (contiguous, through real passages, start→goal) over ${trials}`);
  ok(costMismatch===0, `re-summed thread cost == reported cost over ${trials} (the drawing matches the number)`);
}

// 3) THE NEGATIVE: an INADMISSIBLE heuristic (over-weighted) returns a COSTLIER
//    thread on some mazes — the exact reason admissibility makes A* trustworthy.
{
  let overshoots=0, anyWorse=false, trials=400;
  for(let s=1; s<=trials; s++){
    const m = makeMaze(20, 20, s*3+1, { braid:0.95 });   // heavy braiding ⇒ many routes
    const opt = astar(m).cost;
    const bad = greedy(m, 6.0).cost;     // h × 6 ⇒ strongly inadmissible
    if(bad > opt + 1e-9){ overshoots++; anyWorse=true; }
    if(bad < opt - 1e-9){ console.log(`  !! inadmissible BEAT optimum on seed ${s} — impossible`); fail++; }
  }
  ok(overshoots >= trials*0.03, `an inadmissible heuristic overshoots the optimum on many mazes (${overshoots}/${trials} — demonstrated, not asserted)`);
}

// 4) ADMISSIBLE A* is NEVER worse than Dijkstra (it can't be — same optimum).
{
  let worse=0, trials=500;
  for(let s=1; s<=trials; s++){
    const m = makeMaze(15, 15, s*11+5, { braid:0.5 });
    if(astar(m).cost > dijkstra(m).cost + 1e-9) worse++;
  }
  ok(worse===0, `admissible A* is never costlier than Dijkstra over ${trials} (${worse} violations)`);
}

// 5) BRAIDING really creates choices: a braided maze has measurably MORE open
//    passages (and fewer dead-ends) than the perfect maze of the same seed.
{
  const m0 = makeMaze(20, 20, 99, { braid:0.0 });
  const m1 = makeMaze(20, 20, 99, { braid:0.8 });
  const edges = (m)=>{ let e=0; for(let i=0;i<m.cells.length;i++) e+=popcount(m.cells[i]); return e/2; };
  const deadEnds = (m)=>{ let d=0; for(let i=0;i<m.cells.length;i++) if(popcount(m.cells[i])===1) d++; return d; };
  ok(edges(m1) > edges(m0), `braiding adds passages (perfect ${edges(m0)} → braided ${edges(m1)} edges)`);
  ok(deadEnds(m1) < deadEnds(m0), `braiding removes dead-ends (perfect ${deadEnds(m0)} → braided ${deadEnds(m1)})`);
  // a perfect maze is a TREE: exactly N-1 edges. The defining property.
  ok(edges(m0) === 20*20 - 1, `the un-braided maze is a perfect tree (exactly N-1 = ${20*20-1} edges)`);
}

// 6) The maze stays FULLY CONNECTED — braiding never strands the goal.
{
  let stranded=0, trials=300;
  for(let s=1; s<=trials; s++){
    const m = makeMaze(16, 16, s, { braid:0.7 });
    if(connectedCount(m) !== m.W*m.H){ stranded++; }
    if(!astar(m).reachable) stranded++;
  }
  ok(stranded===0, `every braided maze is fully connected & the goal is always reachable over ${trials}`);
}

// 7) SEED-PURITY: same seed ⇒ byte-identical maze (cells + terrain) and thread.
{
  let drift=0, trials=80;
  for(let s=1; s<=trials; s++){
    const a = makeMaze(17, 13, s, { braid:0.5 });
    const b = makeMaze(17, 13, s, { braid:0.5 });
    let same = a.cells.every((v,i)=>v===b.cells[i]) && a.cost.every((v,i)=>v===b.cost[i]);
    const pa = astar(a).path, pb = astar(b).path;
    same = same && pa.length===pb.length && pa.every((p,i)=>p.x===pb[i].x && p.y===pb[i].y);
    if(!same) drift++;
  }
  ok(drift===0, `same seed ⇒ identical maze AND identical thread over ${trials} (reproducible)`);
}

// 8) DIJKSTRA SETTLES IN NON-DECREASING DISTANCE ORDER — the invariant that
//    makes Dijkstra correct (it never settles a cell it could later improve).
{
  let violations=0, trials=120;
  for(let s=1; s<=trials; s++){
    const m = makeMaze(14, 14, s*5, { braid:0.4 });
    const { W, idx } = m;
    // re-run dijkstra but record settle distances
    const g = new Float64Array(W*m.H).fill(Infinity);
    const D = dijkstra(m);
    // reconstruct g along the order by re-deriving from bellman-ford distances
    const dist = new Float64Array(W*m.H).fill(Infinity);
    dist[idx(m.start.x,m.start.y)]=0;
    let changed=true,rounds=0;
    while(changed && rounds++<W*m.H+5){ changed=false;
      for(let y=0;y<m.H;y++)for(let x=0;x<W;x++){ const c=idx(x,y); if(!isFinite(dist[c]))continue;
        for(const nb of neighbours(m,x,y)){ const id=idx(nb.x,nb.y); if(dist[c]+nb.w<dist[id]){dist[id]=dist[c]+nb.w;changed=true;} } } }
    let prev=-Infinity;
    for(const c of D.order){ if(dist[c] < prev-1e-9){ violations++; break; } prev=dist[c]; }
  }
  ok(violations===0, `Dijkstra settles cells in non-decreasing distance order over ${trials} (the correctness invariant)`);
}

// 9) A perfect maze has a UNIQUE path; braiding creates GENUINE alternatives —
//    on a braided maze, the cheapest thread is often NOT the fewest-cells thread,
//    which is the whole reason terrain weighting makes the proof non-trivial.
{
  let differs=0, trials=400;
  for(let s=1; s<=trials; s++){
    const m = makeMaze(20, 20, s*13+2, { braid:0.95 });
    const cheapest = astar(m);                 // minimises Σ terrain cost
    // a "fewest-cells" route: unit-weight Dijkstra over the SAME graph
    const flat = { ...m };
    flat.cost = new Int16Array(m.cost.length).fill(1);
    flat.cost[m.idx(m.start.x,m.start.y)] = 1;
    const fewest = dijkstra(flat);
    if(cheapest.path.length !== fewest.path.length) differs++;
  }
  ok(differs >= trials*0.10, `cheapest thread ≠ fewest-cells thread on many mazes (${differs}/${trials} — terrain makes "looks short" lie)`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
