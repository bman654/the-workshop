
// The Bridge House — Hashiwokakero math core (single source of truth).
//
// An archipelago of numbered islands on a grid. A SOLUTION assigns each
// orthogonally-aligned, unobstructed island PAIR a bridge count in {0,1,2}
// such that: (i) every island's total bridges == its number; (ii) no two
// bridges cross; (iii) the bridge graph is CONNECTED (one network).
//
// This module is the SOLE authority for: the exact solution COUNTER (ground
// truth), the pure-DEDUCTION solver (forced-bridge / saturation / isolation,
// NO guessing), and the GENERATOR that grows a connected reference layout and
// keeps only boards that are BOTH uniquely-solvable AND deduction-solvable.
// It is inlined byte-identical into the page and tested by core.test.mjs.
// ----------------------------------------------------------------------------

// Deterministic PRNG (mulberry32) — every seed reproduces the same board.
function mulberry32(seed){
  return function(){
    seed|=0; seed=(seed+0x6D2B79F5)|0;
    let t=Math.imul(seed^(seed>>>15),1|seed);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
function shuffle(a,rng){
  for(let i=a.length-1;i>0;i--){ const j=(rng()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

// ---- Geometry helpers over a board {W,H, islands:[{r,c,n}], idAt:Map} -------
// A board's islands are sorted; pairs() returns the legal adjacency: every
// pair of islands that are in the same row/col with NO island between them.
function keyRC(r,c){ return r*1000+c; }
function buildBoard(W,H,islands){
  const idAt=new Map();
  islands.forEach((is,i)=>{ idAt.set(keyRC(is.r,is.c),i); });
  return {W,H,islands,idAt};
}
// All legal neighbour pairs [i,j] (i<j) with the run between them clear.
function pairs(board){
  const {islands}=board, out=[];
  // group by row, by col; nearest aligned island with clear span is a neighbour
  const byRow=new Map(), byCol=new Map();
  islands.forEach((is,i)=>{
    (byRow.get(is.r)||byRow.set(is.r,[]).get(is.r)).push(i);
    (byCol.get(is.c)||byCol.set(is.c,[]).get(is.c)).push(i);
  });
  for(const arr of byRow.values()){
    arr.sort((a,b)=>islands[a].c-islands[b].c);
    for(let k=0;k<arr.length-1;k++) out.push([arr[k],arr[k+1]]);
  }
  for(const arr of byCol.values()){
    arr.sort((a,b)=>islands[a].r-islands[b].r);
    for(let k=0;k<arr.length-1;k++) out.push([arr[k],arr[k+1]]);
  }
  return out.map(([a,b])=> a<b?[a,b]:[b,a]);
}
// Does the segment of pair p geometrically cross the segment of pair q?
// One is horizontal, the other vertical; they cross iff the vertical's column
// lies strictly between the horizontal's endpoints AND vice-versa.
function crosses(board,p,q){
  const I=board.islands;
  const seg=(pr)=>{ const a=I[pr[0]],b=I[pr[1]];
    return a.r===b.r ? {h:true, r:a.r, c0:Math.min(a.c,b.c), c1:Math.max(a.c,b.c)}
                     : {h:false,c:a.c, r0:Math.min(a.r,b.r), r1:Math.max(a.r,b.r)}; };
  const s=seg(p), t=seg(q);
  if(s.h===t.h) return false;             // parallel ⇒ never cross (no shared island geometry)
  const hh=s.h?s:t, vv=s.h?t:s;
  return vv.c>hh.c0 && vv.c<hh.c1 && hh.r>vv.r0 && hh.r<vv.r1;
}
// Precompute, for each pair index, the list of pair indices it conflicts with.
function conflictMap(board,P){
  const m=P.map(()=>[]);
  for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++)
    if(crosses(board,P[i],P[j])){ m[i].push(j); m[j].push(i); }
  return m;
}

// Is an assignment (array of bridge counts over P) CONNECTED across all islands?
function isConnected(board,P,bridges){
  const n=board.islands.length;
  if(n===0) return true;
  const adj=Array.from({length:n},()=>[]);
  P.forEach((pr,k)=>{ if(bridges[k]>0){ adj[pr[0]].push(pr[1]); adj[pr[1]].push(pr[0]); } });
  const seen=new Array(n).fill(false); const st=[0]; seen[0]=true; let cnt=1;
  while(st.length){ const u=st.pop(); for(const v of adj[u]) if(!seen[v]){seen[v]=true;cnt++;st.push(v);} }
  return cnt===n;
}

// ---- Exact solution COUNTER (ground truth) ---------------------------------
// Enumerate assignments of {0,1,2} to every pair, pruning by per-island degree
// caps and crossing conflicts, counting full valid CONNECTED solutions.
// Capped so a loose board can't explode; `cap` return means "cap or more".
function countSolutions(board, cap=2){
  const P=pairs(board), conf=conflictMap(board,P), n=board.islands.length;
  const need=board.islands.map(is=>is.n);
  const deg=new Array(n).fill(0);
  const used=new Array(P.length).fill(0);   // 0/1/2 chosen so far per pair
  // incident pair lists per island, and remaining-capacity bookkeeping
  const inc=Array.from({length:n},()=>[]);
  P.forEach((pr,k)=>{ inc[pr[0]].push(k); inc[pr[1]].push(k); });
  let count=0;
  function rec(k){
    if(count>=cap) return;
    if(k===P.length){
      for(let i=0;i<n;i++) if(deg[i]!==need[i]) return;
      const br=used.map(x=>x);
      if(isConnected(board,P,br)) count++;
      return;
    }
    const [a,b]=P[k];
    // max bridges we may still place here, bounded by both islands' remaining need
    const room=Math.min(2, need[a]-deg[a], need[b]-deg[b]);
    // crossing: if a conflicting earlier pair already has a bridge, we must use 0
    let blocked=false;
    for(const c of conf[k]) if(c<k && used[c]>0){ blocked=true; break; }
    const hi = blocked?0:Math.max(0,room);
    for(let v=0; v<=hi; v++){
      // light forward-check: every still-unfilled island must keep ≥0 slack and
      // remain potentially satisfiable from its not-yet-decided incident pairs.
      used[k]=v; deg[a]+=v; deg[b]+=v;
      if(feasible(k,a,b)) rec(k+1);
      deg[a]-=v; deg[b]-=v; used[k]=0;
    }
  }
  // After deciding pair k for islands a,b, check those two islands can still hit
  // their number using only their remaining undecided incident pairs (≤2 each).
  function feasible(k,a,b){
    for(const isl of [a,b]){
      let maxMore=0;
      for(const pk of inc[isl]){
        if(pk<=k) continue;
        // available capacity on that undecided pair, limited by the OTHER endpoint
        const [x,y]=P[pk]; const other=x===isl?y:x;
        let cap2=Math.min(2, need[other]-deg[other]);
        // crossing pre-block: if a chosen earlier pair conflicts, this is 0
        for(const c of conf[pk]) if(c<=k && used[c]>0){ cap2=0; break; }
        maxMore+=Math.max(0,cap2);
      }
      if(deg[isl]+maxMore < need[isl]) return false;     // can never reach
      if(deg[isl] > need[isl]) return false;             // overshot
    }
    return true;
  }
  rec(0);
  return count;
}

// ---- Pure-DEDUCTION solver (NO guessing) -----------------------------------
// State: lo[k]/hi[k] = min/max bridges still possible on pair k. We tighten
// bounds with three guess-free rules until fixed point:
//   (R1) SATURATION/FORCED: for an island, if (sum of hi over its pairs) equals
//        its number, every pair is forced to its hi; if (sum of lo) equals its
//        number, every pair is forced to its lo (clamp the rest down).
//   (R2) ISOLATION: never lay the last bridge that would close off a sub-island
//        of size 2 from the rest (a degenerate "1–1" pair both needing 1 each
//        must not bridge if other islands remain) — prevents a stranded pair.
//   (R3) CROSSING: if a pair reaches lo≥1, every crossing pair is clamped hi=0.
// Each tightening is recorded with a NAMED rule, so the trace proves no guess.
function deduce(board){
  const P=pairs(board), conf=conflictMap(board,P), n=board.islands.length;
  const need=board.islands.map(is=>is.n);
  const inc=Array.from({length:n},()=>[]);
  P.forEach((pr,k)=>{ inc[pr[0]].push(k); inc[pr[1]].push(k); });
  const lo=new Array(P.length).fill(0), hi=new Array(P.length).fill(2);
  const trace=[];
  function setHi(k,v,rule){ if(v<hi[k]){ hi[k]=v; trace.push({k,bound:'hi',v,rule}); return true; } return false; }
  function setLo(k,v,rule){ if(v>lo[k]){ lo[k]=v; trace.push({k,bound:'lo',v,rule}); return true; } return false; }
  let progress=true, contradiction=false;
  while(progress && !contradiction){
    progress=false;
    // R3 crossing clamp
    for(let k=0;k<P.length;k++) if(lo[k]>=1) for(const c of conf[k]) if(setHi(c,0,'crossing-clamp')) progress=true;
    // R1 saturation / forced per island
    for(let i=0;i<n && !contradiction;i++){
      const ks=inc[i];
      let sumHi=0,sumLo=0; for(const k of ks){ sumHi+=hi[k]; sumLo+=lo[k]; }
      if(sumHi<need[i] || sumLo>need[i]){ contradiction=true; break; }
      if(sumHi===need[i]) for(const k of ks){ if(setLo(k,hi[k],'island-saturated')) progress=true; }
      if(sumLo===need[i]) for(const k of ks){ if(setHi(k,lo[k],'island-degree-met')) progress=true; }
      // single-pair forcing: a pair where the OTHER island's slack forces it up
      for(const k of ks){
        const [x,y]=P[k], other=x===i?y:x;
        // bridges this pair MUST carry = need[i] minus what its other pairs can max give
        let othersMaxHi=0; for(const kk of ks) if(kk!==k) othersMaxHi+=hi[kk];
        const must=need[i]-othersMaxHi;
        if(must>lo[k] && must<=hi[k]){ if(setLo(k,must,'forced-min')) progress=true; }
        // cap by other endpoint's number too
        if(setHi(k,Math.min(hi[k],need[i],need[other]),'degree-cap')) progress=true;
      }
    }
    // R2 isolation: a 2-island world that would self-close while others remain.
    // General-purpose lightweight form: if two islands of number 1 are each
    // other's ONLY remaining option but n>2, forbid that bridge (would strand).
    for(let k=0;k<P.length && !contradiction;k++){
      if(n<=2) break;
      const [a,b]=P[k];
      if(need[a]===1 && need[b]===1){
        const aOnly=inc[a].every(kk=>kk===k||hi[kk]===0);
        const bOnly=inc[b].every(kk=>kk===k||hi[kk]===0);
        if(aOnly && bOnly && hi[k]>0){ if(setHi(k,0,'isolation-avoid')) progress=true; }
      }
    }
  }
  // assemble: solved iff every pair pinned (lo==hi) and degrees match & connected.
  let pinned=true; for(let k=0;k<P.length;k++) if(lo[k]!==hi[k]){ pinned=false; break; }
  const bridges=lo.map((x,k)=> lo[k]===hi[k]?lo[k]:null);
  let solved=false;
  if(pinned && !contradiction){
    const br=lo.slice();
    let ok=true;
    const deg=new Array(n).fill(0);
    P.forEach((pr,k)=>{ deg[pr[0]]+=br[k]; deg[pr[1]]+=br[k]; });
    for(let i=0;i<n;i++) if(deg[i]!==need[i]) ok=false;
    if(ok && isConnected(board,P,br)) solved=true;
  }
  return {solved, contradiction, P, lo, hi, bridges, trace, pinned};
}

// ---- GENERATOR -------------------------------------------------------------
// Grow a connected reference archipelago, then KEEP it only if the implied
// numbers yield a board that is BOTH uniquely solvable and deduction-solvable.
// Strategy: random spanning growth on a grid. Start one island; repeatedly add
// a new island a random clear distance away from an existing one (H or V),
// connecting with 1 or 2 bridges, never crossing an existing bridge or island.
function generate(seed, targetIslands=9, W=7, H=7){
  const rng=mulberry32(seed);
  for(let attempt=0; attempt<400; attempt++){
    const built=growLayout(rng, targetIslands, W, H);
    if(!built) continue;
    const {islands, refBridges, P} = built;
    const board=buildBoard(W,H,islands);
    // numbers are the reference degrees — that's the puzzle (givens ARE numbers)
    const cnt=countSolutions(board, 2);
    if(cnt!==1) continue;
    const d=deduce(board);
    if(!d.solved) continue;
    return {board, refBridges, P, W, H};
  }
  return null;
}
function growLayout(rng, target, W, H){
  const occ=new Set();           // occupied island cells "r,c"
  const islands=[];              // {r,c}
  const bridgeSet=new Map();     // "i-j" -> count, on FINAL pair indices later
  const segs=[];                 // placed bridge segments for crossing tests
  const place=(r,c)=>{ const id=islands.length; islands.push({r,c}); occ.add(r+','+c); return id; };
  // helper: cells strictly between two aligned points
  const between=(r0,c0,r1,c1)=>{ const cells=[];
    if(r0===r1){ const [a,b]=[Math.min(c0,c1),Math.max(c0,c1)]; for(let c=a+1;c<b;c++) cells.push([r0,c]); }
    else { const [a,b]=[Math.min(r0,r1),Math.max(r0,r1)]; for(let r=a+1;r<b;r++) cells.push([r,c0]); }
    return cells; };
  const segCross=(r0,c0,r1,c1)=>{
    const h0=r0===r1;
    for(const s of segs){
      if(s.h===h0) continue;
      const hh=h0?{r:r0,c0:Math.min(c0,c1),c1:Math.max(c0,c1)}:{r:s.r,c0:s.c0,c1:s.c1};
      const vv=h0?{c:s.c,r0:s.r0,r1:s.r1}:{c:c0,r0:Math.min(r0,r1),r1:Math.max(r0,r1)};
      if(vv.c>hh.c0&&vv.c<hh.c1&&hh.r>vv.r0&&hh.r<vv.r1) return true;
    }
    return false;
  };
  place((rng()*H)|0,(rng()*W)|0);
  let tries=0;
  while(islands.length<target && tries++<600){
    const from=(rng()*islands.length)|0;
    const dir=(rng()*4)|0;            // 0 N 1 S 2 E 3 W
    const dist=1+((rng()*3)|0);       // 1..3 cells away
    const {r,c}=islands[from];
    let nr=r,nc=c;
    if(dir===0)nr=r-dist; else if(dir===1)nr=r+dist; else if(dir===2)nc=c+dist; else nc=c-dist;
    if(nr<0||nr>=H||nc<0||nc>=W) continue;
    if(occ.has(nr+','+nc)) continue;
    // path must be clear of islands AND not cross an existing bridge
    const mids=between(r,c,nr,nc);
    if(mids.some(([mr,mc])=>occ.has(mr+','+mc))) continue;
    if(segCross(r,c,nr,nc)) continue;
    const to=place(nr,nc);
    const cnt=1+((rng()<0.42)?1:0);   // single or double bridge
    bridgeSet.set(from+'-'+to,cnt);
    segs.push({h:r===nr, r:Math.min(r,nr), c0:Math.min(c,nc), c1:Math.max(c,nc),
               r0:Math.min(r,nr), r1:Math.max(r,nr), c:Math.min(c,nc)});
  }
  if(islands.length<Math.max(5,target-2)) return null;
  // OPTIONAL extra bridges between already-aligned-adjacent islands (adds richness
  // & makes numbers >2 possible) — only where it does not cross.
  const board0=buildBoard(W,H,islands);
  const P=pairs(board0);
  // map "i-j" reference set onto pair indices
  const refBridges=new Array(P.length).fill(0);
  P.forEach(([a,b],k)=>{ const v=bridgeSet.get(a+'-'+b)??bridgeSet.get(b+'-'+a); if(v) refBridges[k]=v; });
  // try to add a few non-crossing extra spans to existing pairs (closes loops)
  const conf=conflictMap(board0,P);
  const order=shuffle([...P.keys()],rng);
  for(const k of order){
    if(rng()<0.5) continue;
    if(refBridges[k]>0) continue;          // already a tree edge
    if(conf[k].some(c=>refBridges[c]>0)) continue;  // would cross
    refBridges[k]=1+((rng()<0.3)?1:0);
  }
  // numbers = degree under refBridges
  const num=new Array(islands.length).fill(0);
  P.forEach(([a,b],k)=>{ num[a]+=refBridges[k]; num[b]+=refBridges[k]; });
  if(num.some(x=>x===0)) return null;       // every island must have a bridge
  islands.forEach((is,i)=>{ is.n=num[i]; });
  // sanity: reference must be connected
  if(!isConnected(board0,P,refBridges)) return null;
  return {islands, refBridges, P};
}

export {mulberry32,buildBoard,pairs,conflictMap,isConnected,countSolutions,deduce,generate};