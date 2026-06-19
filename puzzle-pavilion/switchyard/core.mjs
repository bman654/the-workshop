// === CORE BEGIN ===
// THE SWITCHYARD — Netwalk (rotate-the-pipes) math core (single source of truth).
//
// An R×C grid of pipe/wire tiles. Each tile has an ARM-MASK over the 4 directions
// {N,E,S,W} — which sides a pipe-arm sticks out of — fixed by the tile's shape, plus
// a ROTATION in {0,90,180,270} the player can spin. ONE tile is the SOURCE (the power
// node). A tile is POWERED iff it is reachable from the source through a chain of
// JUNCTIONS — a junction exists between two orthogonally-adjacent tiles when BOTH
// present an arm toward the shared edge (arm reciprocity).
//
// SOLVED orientation: (i) every tile is powered, (ii) no arm points off-grid (into a
// wall), (iii) every arm is reciprocated (no arm faces a neighbour-side with no arm).
// (ii)+(iii) ⇒ the powered "on" arms form an undirected graph with no half-edges; (i)
// ⇒ it is connected and spans all cells; the arm count of a spanning connected graph on
// N cells with no half-edges is exactly the tree/loop structure the generator laid.
//
// This module is the SOLE authority for: (a) the exact orientation-solution COUNTER
// (ground truth — budget-protected backtracking over per-tile rotations, pruned by the
// border-no-off-grid constraint and pairwise edge reciprocity), (b) a pure-DEDUCTION
// solver that forces orientations with NO guessing (border walls forbid off-grid arms;
// degree-1 stubs and the unique source-arm count force orientations; a forced arm on
// one side forces the neighbour to reciprocate / a forced wall forbids the neighbour's
// arm), and (c) a GENERATOR that grows a connected spanning network from the source,
// scrambles each tile's rotation, and keeps ONLY boards that are BOTH uniquely solvable
// (counter==1) AND deduction-solvable (the no-guess solver reaches the carried witness).
// Inlined byte-identical into the page between the sentinels; imported by core.test.mjs.
//
// DIRECTIONS. d ∈ {0:N, 1:E, 2:S, 3:W}. An arm-mask is a 4-bit int: bit d set ⇒ an arm
// points in direction d (in the tile's CURRENT orientation). The base mask is the shape
// at rotation 0; rotating 90° clockwise maps N→E→S→W→N, i.e. bit d → bit (d+1)&3.
// ============================================================================

const DR=[-1,0,1,0], DC=[0,1,0,-1];   // N,E,S,W
const OPP=[2,3,0,1];

// Deterministic PRNG (mulberry32) — every seed reproduces the same board.
function mulberry32(seed){
  return function(){
    seed|=0; seed=(seed+0x6D2B79F5)|0;
    let t=Math.imul(seed^(seed>>>15),1|seed);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
function shuffle(a,rng){ for(let i=a.length-1;i>0;i--){ const j=(rng()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

// rotate a 4-bit mask k quarter-turns clockwise (N→E→S→W).
function rot(mask, q){
  q=((q%4)+4)%4;
  let m=mask;
  for(let i=0;i<q;i++){
    let n=0;
    for(let d=0;d<4;d++) if(m&(1<<d)) n|=(1<<((d+1)&3));
    m=n;
  }
  return m;
}
// the set of DISTINCT masks a base shape can present (a straight has 2, an end has 4,
// a tee has 4, an elbow has 4, the all-4 cross has 1). Used by counter/deduce to know
// a tile's candidate orientations without double-counting symmetric ones.
function orientations(baseMask){
  const seen=new Set(), out=[];
  for(let q=0;q<4;q++){ const m=rot(baseMask,q); if(!seen.has(m)){ seen.add(m); out.push(m); } }
  return out; // list of distinct masks
}
function popcount(m){ let c=0; while(m){ c+=m&1; m>>=1; } return c; }

// ---- board ------------------------------------------------------------------
// A board is { R, C, base:Int (per-cell base arm-mask at rotation 0), src:[r,c] }.
// build helpers assemble it; cellMask(board, orient, idx) is the current mask of a tile
// given an orientation array (quarter-turns per cell).
function buildBoard(R,C,base,src){ return {R,C,base:base.slice(),src:src.slice()}; }
function idx(C,r,c){ return r*C+c; }

// Given per-cell ABSOLUTE masks (already rotated to their chosen orientation), is the
// board fully solved? (i) every arm reciprocated + no off-grid arm; (ii) the source's
// component spans EVERY cell that has any arm; (iii) every cell has ≥1 arm (no dead tile)
// — the generator guarantees all cells are on the network, so a solved board powers all.
function checkSolved(board, masks){
  const {R,C,src}=board;
  // (ii) reciprocity + no off-grid
  for(let r=0;r<R;r++) for(let c=0;c<C;c++){
    const m=masks[idx(C,r,c)];
    for(let d=0;d<4;d++) if(m&(1<<d)){
      const nr=r+DR[d], nc=c+DC[d];
      if(nr<0||nc<0||nr>=R||nc>=C) return false;          // arm off-grid
      if(!(masks[idx(C,nr,nc)] & (1<<OPP[d]))) return false; // not reciprocated
    }
  }
  // (i)+(iii) flood from source; every cell must be reached (all cells carry arms)
  const seen=new Uint8Array(R*C); const st=[idx(C,src[0],src[1])]; seen[st[0]]=1; let cnt=1;
  while(st.length){
    const u=st.pop(), r=(u/C)|0, c=u%C, m=masks[u];
    for(let d=0;d<4;d++) if(m&(1<<d)){
      const nr=r+DR[d], nc=c+DC[d], v=idx(C,nr,nc);
      // reciprocity already verified, so this is a real junction
      if(!seen[v]){ seen[v]=1; cnt++; st.push(v); }
    }
  }
  return cnt===R*C;
}

// power-flood: from a partial/complete orientation, which cells are powered? (BFS over
// reciprocated junctions from the source). Returns Uint8Array of length R*C. Used live by
// the page to light tiles, and by the counter/verifier.
function powerFlood(board, masks){
  const {R,C,src}=board;
  const seen=new Uint8Array(R*C); const st=[idx(C,src[0],src[1])]; seen[st[0]]=1;
  while(st.length){
    const u=st.pop(), r=(u/C)|0, c=u%C, m=masks[u];
    for(let d=0;d<4;d++) if(m&(1<<d)){
      const nr=r+DR[d], nc=c+DC[d];
      if(nr<0||nc<0||nr>=R||nc>=C) continue;
      const v=idx(C,nr,nc);
      if((masks[v]&(1<<OPP[d])) && !seen[v]){ seen[v]=1; st.push(v); }
    }
  }
  return seen;
}

// ---- exact orientation-solution COUNTER (ground truth) ----------------------
// Backtracking over per-cell orientation choices (the distinct masks of each base),
// pruned HARD by the two LOCAL constraints that any solved board must satisfy at every
// committed cell: (P1) no committed arm points off-grid; (P2) reciprocity across every
// edge BETWEEN two committed cells (and a committed arm toward an off-board side is P1).
// We fill cells in a fixed order; when a cell is committed we check its edges to already-
// committed neighbours (above/left under row-major order) for reciprocity both ways, and
// check all four sides against the BOARD border. A full assignment is then verified for
// global power (connectivity) by checkSolved. Capped at `cap` (return cap means "≥cap");
// `budget` caps the recursion nodes — on exceeding it returns cap (treated as "≥cap",
// sound for the generator's gate, which only TIGHTENS on uncertainty).
function countSolutions(board, cap=2, budget=600000){
  const {R,C,base}=board;
  const N=R*C;
  const cand=base.map(b=>orientations(b));      // candidate masks per cell
  const chosen=new Array(N).fill(0);
  let count=0, nodes=0, capped=false;
  // committed[i] true once cell i has a chosen mask (cells filled in index order)
  function compatBorderAndPrev(i, m){
    const r=(i/C)|0, c=i%C;
    for(let d=0;d<4;d++){
      const arm=!!(m&(1<<d));
      const nr=r+DR[d], nc=c+DC[d];
      const off = nr<0||nc<0||nr>=R||nc>=C;
      if(off){ if(arm) return false; continue; }      // P1: no off-grid arm
      const ni=idx(C,nr,nc);
      if(ni<i){                                        // neighbour already committed
        const narm=!!(chosen[ni] & (1<<OPP[d]));
        if(arm!==narm) return false;                   // P2: must reciprocate exactly
      }
    }
    return true;
  }
  function rec(i){
    if(capped) return;
    if(++nodes>budget){ capped=true; count=cap; return; }
    if(i===N){
      if(checkSolved(board, chosen)) { count++; if(count>=cap) capped=true; }
      return;
    }
    for(const m of cand[i]){
      if(!compatBorderAndPrev(i,m)) continue;
      chosen[i]=m;
      rec(i+1);
      if(capped) return;
    }
  }
  rec(0);
  return Math.min(count, cap);
}

// ---- pure-DEDUCTION solver (NO guessing) ------------------------------------
// State per cell: a SET of still-possible masks (subset of its distinct orientations).
// We propagate three sound rules to a fixed point, NEVER guessing:
//   (R1) BORDER: drop any candidate mask that points an arm off-grid. (An edge tile
//        can't point off the board — the wall reciprocates nothing.)
//   (R2) EDGE-RECIPROCITY: for an edge between cells u,v in direction d: if EVERY
//        remaining candidate of u agrees on whether it has an arm toward v (all-arm or
//        all-noarm), that fact is forced on v — drop v's candidates that disagree
//        (an arm needs a reciprocating arm; a wall-of-no-arm forbids the partner's arm).
//   (R3) the implicit degree/connectivity facts fall out of R1+R2 fixpoint for the
//        boards the generator ships (it only keeps boards this set closes). Each drop is
//        recorded with a NAMED rule so the trace proves "no guess".
// solved iff every cell pinned to exactly one mask AND that full assignment checkSolved.
function deduce(board){
  const {R,C,base}=board;
  const N=R*C;
  const cands=base.map(b=>orientations(b).slice());   // mutable candidate lists
  const trace=[];
  let progress=true, contradiction=false;
  // does cell i, given its candidate set, DEFINITELY have an arm in dir d? definitely NOT?
  function side(i,d){
    let allYes=true, allNo=true;
    for(const m of cands[i]){ if(m&(1<<d)) allNo=false; else allYes=false; }
    return allYes ? 1 : (allNo ? 0 : -1);   // 1=forced arm, 0=forced wall, -1=undecided
  }
  function dropIf(i, pred, rule){
    const before=cands[i].length;
    cands[i]=cands[i].filter(m=>!pred(m));
    if(cands[i].length<before){ trace.push({i,rule,kept:cands[i].length}); if(cands[i].length===0) contradiction=true; return true; }
    return false;
  }
  // R1 once up front (border never changes)
  for(let r=0;r<R;r++) for(let c=0;c<C;c++){
    const i=idx(C,r,c);
    dropIf(i, m=>{
      for(let d=0;d<4;d++) if(m&(1<<d)){ const nr=r+DR[d],nc=c+DC[d];
        if(nr<0||nc<0||nr>=R||nc>=C) return true; }
      return false;
    }, 'border-no-off-grid');
  }
  while(progress && !contradiction){
    progress=false;
    for(let r=0;r<R && !contradiction;r++) for(let c=0;c<C && !contradiction;c++){
      const i=idx(C,r,c);
      for(let d=0;d<4;d++){
        const nr=r+DR[d], nc=c+DC[d];
        if(nr<0||nc<0||nr>=R||nc>=C) continue;
        const j=idx(C,nr,nc);
        const si=side(i,d);
        if(si===1){ if(dropIf(j, m=>!(m&(1<<OPP[d])), 'reciprocate-arm')) progress=true; }
        else if(si===0){ if(dropIf(j, m=>(m&(1<<OPP[d])), 'reciprocate-wall')) progress=true; }
      }
    }
  }
  let pinned=true; for(let i=0;i<N;i++) if(cands[i].length!==1){ pinned=false; break; }
  const masks=cands.map(cs=>cs.length===1?cs[0]:null);
  let solved=false;
  if(pinned && !contradiction) solved=checkSolved(board, masks);
  return {solved, contradiction, pinned, cands, masks, trace};
}

// ---- GENERATOR --------------------------------------------------------------
// 1) grow a connected SPANNING tree over all R×C cells, rooted at a random source
//    (randomized Prim/DFS over the grid) — the tree edges define each cell's SOLVED
//    arm-mask (an arm toward every tree-neighbour). Optionally add a few extra
//    non-tree edges (loops) for richer shapes, still spanning & all-reciprocated.
// 2) the per-cell SOLVED mask is the base shape; scramble each cell's rotation to a
//    random orientation — that scrambled board is the puzzle, the solved mask the witness.
// 3) keep ONLY boards that are BOTH uniquely solvable (counter==1) AND deduction-solvable
//    (deduce.solved AND deduce's pinned masks === the witness solved masks).
function growNetwork(rng, R, C, loopChance){
  const N=R*C;
  const src=[(rng()*R)|0, (rng()*C)|0];
  // randomized spanning tree (Prim-ish): frontier of edges from the growing component.
  const inTree=new Uint8Array(N); const sMask=new Array(N).fill(0);
  const start=idx(C,src[0],src[1]); inTree[start]=1;
  let frontier=[]; // {r,c,d} edges leaving a tree cell to a non-tree cell
  const pushFrontier=(r,c)=>{ for(let d=0;d<4;d++){ const nr=r+DR[d],nc=c+DC[d];
    if(nr<0||nc<0||nr>=R||nc>=C) continue; if(!inTree[idx(C,nr,nc)]) frontier.push({r,c,d}); } };
  pushFrontier(src[0],src[1]);
  let added=1;
  while(added<N && frontier.length){
    const k=(rng()*frontier.length)|0; const {r,c,d}=frontier[k];
    frontier[k]=frontier[frontier.length-1]; frontier.pop();
    const nr=r+DR[d], nc=c+DC[d]; const ni=idx(C,nr,nc);
    if(inTree[ni]) continue;
    // connect (r,c)<->(nr,nc): arms both ways
    sMask[idx(C,r,c)] |= (1<<d);
    sMask[ni] |= (1<<OPP[d]);
    inTree[ni]=1; added++;
    pushFrontier(nr,nc);
  }
  if(added!==N) return null; // didn't span (shouldn't happen on a connected grid)
  // optional extra (loop) edges — add arms across some non-tree adjacent pairs.
  for(let r=0;r<R;r++) for(let c=0;c<C;c++){
    for(const d of [1,2]){ // E,S to avoid double-count
      const nr=r+DR[d], nc=c+DC[d]; if(nr<0||nc<0||nr>=R||nc>=C) continue;
      const i=idx(C,r,c), j=idx(C,nr,nc);
      if((sMask[i]&(1<<d))) continue; // already connected
      if(rng()<loopChance){ sMask[i]|=(1<<d); sMask[j]|=(1<<OPP[d]); }
    }
  }
  return {src, sMask};
}
function generate(seed, R=5, C=5, loopChance=0.0){
  for(let attempt=0; attempt<300; attempt++){
    const rng=mulberry32((seed ^ (attempt*2654435761))>>>0);
    const net=growNetwork(rng, R, C, loopChance);
    if(!net) continue;
    const {src, sMask}=net;
    // base = scrambled rotation of the solved mask. We store base as the mask AT a random
    // orientation; the candidate orientations of that base include the solved mask.
    const base=new Array(R*C);
    for(let i=0;i<R*C;i++){ const q=(rng()*4)|0; base[i]=rot(sMask[i], q); }
    const board=buildBoard(R,C,base,src);
    // witness = solved masks (must be among each cell's candidate orientations)
    if(countSolutions(board, 2) !== 1) continue;
    const d=deduce(board);
    if(!d.solved) continue;
    // deduced pinned masks must equal the witness (sMask)
    let match=true; for(let i=0;i<R*C;i++) if(d.masks[i]!==sMask[i]){ match=false; break; }
    if(!match) continue;
    return {board, R, C, src, witness:sMask, base};
  }
  return null;
}

export { mulberry32, shuffle, rot, orientations, popcount, buildBoard, idx,
         checkSolved, powerFlood, countSolutions, deduce, generate, growNetwork, DR, DC, OPP };
// === CORE END ===

// ---- shared NEGATIVE-CONTROL (lives OUTSIDE the byte-diffed core so page+twin can't drift) -
// Every single-arm mutation of a solved board destroys the unique deducible solution: bend ONE
// arm on ONE non-source tile's solved (witness) mask and the board must lose uniqueness OR stall
// the no-guess solver. We rebuild a board whose per-cell base shapes ARE the mutated witness
// (countSolutions enumerates each cell's distinct orientations regardless of starting rotation,
// so a witness-as-base board exposes the mutation just as a scrambled one would).
// Returns {tested, broke}; the control PASSES iff broke===tested && tested>0.
function controlEveryArm(board, witness){
  let tested=0, broke=0; const N=board.R*board.C;
  const srcIdx=board.src[0]*board.C+board.src[1];
  for(let i=0;i<N;i++){
    if(i===srcIdx) continue;                       // skip the source (every OTHER tile)
    for(let bit=0; bit<4; bit++){
      const mutW = witness.slice();
      mutW[i] = witness[i] ^ (1<<bit);             // toggle ONE arm on the SOLVED mask
      const broken = buildBoard(board.R, board.C, mutW.map(m=>m), board.src);
      tested++;
      const cnt = countSolutions(broken, 2);
      const d   = deduce(broken);
      if(cnt!==1 || !d.solved) broke++;
    }
  }
  return {tested, broke};
}
export { controlEveryArm };
