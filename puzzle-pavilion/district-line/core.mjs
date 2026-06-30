// === CORE BEGIN ===
// THE DISTRICT LINE — redistricting / efficiency-gap math core (single source of truth).
//
// A FROZEN electorate: an R×C grid of single-vote tiles, vote[i] ∈ {0:RED, 1:BLUE}.
// The population is the tile count (exact, one vote per tile) and the party split NEVER
// changes — only the LINES move. A PARTITION assigns every tile to one of K districts
// (assign[i] ∈ 0..K-1). The whole bench enacts ONE theorem: the SAME votes, drawn into
// different valid maps, hand opposite seat counts — and the EFFICIENCY GAP is literally
// the imbalance of WASTED votes you can scan on the board before any dial moves.
//
// This module is the SOLE DOM-free authority for, integers-only in the law:
//   (1) isValid(board, assign) — a partition is VALID iff every district is orthogonally
//       (4-neighbour) CONTIGUOUS (one BFS flood == the district's size) AND equal-population
//       within the apportionment remainder: base=⌊N/K⌋, rem=N−K·base; the +1 cells go to the
//       LOWEST district ids (districts 0..rem-1 get base+1, the rest get base). Rule FIXED.
//   (2) wasted(board, assign) — per district: winner = majority (TIE → RED, stated), threshold
//       T=⌊pop/2⌋+1; a WINNER wastes (winnerVotes − T) surplus votes; a LOSER wastes ALL its
//       votes. Returns {wastedRed, wastedBlue, perCell:Int8Array} — perCell[i]===1 iff tile i's
//       vote was wasted. perCell is the SINGLE contract the drained-pip overlay AND the EG
//       fraction both read, so the map and the number can never drift.
//   (3) efficiencyGap(board, assign) — num = wastedRed − wastedBlue, den = N; gcd-reduced
//       (num=0 → {0,1}); sign favours the party with FEWER wasted votes. A decimal is only a
//       separately-labelled "≈" gloss, never the proven value.
//   (4) enumeration & certificates — EXACT canonical enumeration of valid partitions by
//       CONNECTED-SUBSET GROWTH (seed the next district at the LOWEST unassigned cell, grow a
//       connected subset of exactly its quota, recurse) deduped by the FORBIDDEN-SET method
//       (every added cell index > seed AND a per-level forbidden set so each frontier cell is
//       tried once then forbidden in sibling branches). From the full enumeration we read off
//       PACK / CRACK extremal witnesses (max seats for the disadvantaged party) and COMPACT =
//       argmin|EG| (the gap-minimizer — well-defined even when seats==votes is unreachable),
//       and searchCertificate answers a card's claim with a witness (REACHABLE) or an
//       exhaustive no-solution proof (IMPOSSIBLE, count shown).
//
// Inlined byte-identical into the page between the sentinels; imported by core.test.mjs.
// ============================================================================

const DR=[-1,0,1,0], DC=[0,1,0,-1];   // N,E,S,W — orthogonal (4-neighbour) throughout
const RED=0, BLUE=1;

// Deterministic PRNG (mulberry32) — every seed reproduces the same electorate.
function mulberry32(seed){
  return function(){
    seed|=0; seed=(seed+0x6D2B79F5)|0;
    let t=Math.imul(seed^(seed>>>15),1|seed);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
function shuffle(a,rng){ for(let i=a.length-1;i>0;i--){ const j=(rng()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }

// ---- board ------------------------------------------------------------------
// A board is { R, C, K, vote:Int8Array(N) }. quotaSizes(N,K) gives the per-district target
// population: districts 0..rem-1 get base+1, the rest base — the apportionment remainder
// to the LOWEST ids (the rule the face prints).
function buildBoard(R,C,K,vote){ return {R,C,K,vote:Int8Array.from(vote)}; }
function idx(C,r,c){ return r*C+c; }
function neighborsOf(R,C){
  const N=R*C, nb=[];
  for(let i=0;i<N;i++){ const r=(i/C)|0,c=i%C, ns=[];
    for(let d=0;d<4;d++){ const nr=r+DR[d],nc=c+DC[d]; if(nr>=0&&nr<R&&nc>=0&&nc<C) ns.push(nr*C+nc); }
    nb.push(ns);
  }
  return nb;
}
function quotaSizes(N,K){
  const base=Math.floor(N/K), rem=N-K*base, sizes=[];
  for(let d=0;d<K;d++) sizes.push(d<rem ? base+1 : base);
  return sizes;
}

// ---- (1) VALIDITY -----------------------------------------------------------
// Valid iff every district is one orthogonally-connected blob (BFS flood from any member
// reaches exactly the district's whole membership) AND its size === its apportionment quota.
function isValid(board, assign){
  const {R,C,K}=board, N=R*C;
  const sizes=quotaSizes(N,K);
  const members=Array.from({length:K},()=>[]);
  for(let i=0;i<N;i++){ const d=assign[i];
    if(d<0||d>=K) return {valid:false, perDistrictPop:null, reason:`cell ${i} unassigned`};
    members[d].push(i);
  }
  const nb=neighborsOf(R,C);
  const perDistrictPop=[];
  for(let d=0;d<K;d++){
    const pop=members[d].length; perDistrictPop.push(pop);
    if(pop!==sizes[d]) return {valid:false, perDistrictPop, reason:`district ${d} pop ${pop} ≠ quota ${sizes[d]}`};
    if(pop===0) return {valid:false, perDistrictPop, reason:`district ${d} empty`};
    // BFS flood within the district from its first member
    const inD=new Uint8Array(N); for(const m of members[d]) inD[m]=1;
    const seen=new Uint8Array(N); const st=[members[d][0]]; seen[members[d][0]]=1; let cnt=1;
    while(st.length){ const u=st.pop();
      for(const v of nb[u]) if(inD[v] && !seen[v]){ seen[v]=1; cnt++; st.push(v); }
    }
    if(cnt!==pop) return {valid:false, perDistrictPop, reason:`district ${d} not contiguous (${cnt}/${pop})`};
  }
  return {valid:true, perDistrictPop, reason:'contiguous + equal-population'};
}

// ---- (2) WASTED VOTES -------------------------------------------------------
// Per district: count red/blue; winner = majority (TIE → RED). T=⌊pop/2⌋+1. The winner
// wastes its votes ABOVE T (surplus); the loser wastes ALL its votes. perCell[i]=1 iff
// tile i's vote was wasted — the SINGLE source the pip overlay AND the EG fraction read.
function wasted(board, assign){
  const {R,C,K}=board, N=R*C, vote=board.vote;
  const members=Array.from({length:K},()=>[]);
  for(let i=0;i<N;i++) members[assign[i]].push(i);
  const perCell=new Int8Array(N);
  let wastedRed=0, wastedBlue=0;
  const perDistrict=[];
  for(let d=0;d<K;d++){
    const cells=members[d]; const pop=cells.length;
    let red=0, blue=0; for(const i of cells) (vote[i]===BLUE?blue++:red++);
    const T=((pop>>1)+1)|0;
    const blueWins = blue>red;                    // strict majority; TIE → RED wins
    const winner = blueWins ? BLUE : RED;
    // mark wasted cells: every loser vote, and winner votes beyond T
    let winnerSeen=0;
    let wRed=0, wBlue=0;
    for(const i of cells){
      if(vote[i]===winner){
        winnerSeen++;
        if(winnerSeen>T){ perCell[i]=1; if(winner===RED) wRed++; else wBlue++; }
      } else {
        perCell[i]=1; if(vote[i]===RED) wRed++; else wBlue++;
      }
    }
    wastedRed+=wRed; wastedBlue+=wBlue;
    perDistrict.push({d, pop, red, blue, winner, T, wastedRed:wRed, wastedBlue:wBlue,
                      seatRed: winner===RED?1:0, seatBlue: winner===BLUE?1:0});
  }
  return {wastedRed, wastedBlue, perCell, perDistrict};
}

// seats won per party (read from the same winner rule)
function seats(board, assign){
  const w=wasted(board, assign);
  let red=0, blue=0; for(const pd of w.perDistrict){ if(pd.winner===RED) red++; else blue++; }
  return {red, blue};
}

// ---- (3) EFFICIENCY GAP (gcd-reduced fraction) ------------------------------
// num = wastedRed − wastedBlue, den = N. sign: which party benefits (fewer wasted votes
// ⇒ that party's lines are more efficient). A POSITIVE raw num means RED wasted more,
// which FAVOURS BLUE; we report sign as the favoured party for the face.
function efficiencyGap(board, assign){
  const w=wasted(board, assign);
  const rawNum=w.wastedRed - w.wastedBlue, den=board.R*board.C;
  if(rawNum===0) return {num:0, den:1, rawNum:0, rawDen:den, favours:'EVEN'};
  const g=gcd(rawNum, den);
  const num=rawNum/g, rden=den/g;
  // Convention: EG = (wastedRed − wastedBlue)/N. The party that WASTES MORE votes is the
  // DISADVANTAGED party (its votes buy fewer seats). So rawNum>0 ⇒ RED wasted more ⇒ RED is
  // disadvantaged ⇒ the map FAVOURS BLUE; rawNum<0 ⇒ BLUE wasted more ⇒ favours RED. We print
  // the magnitude as a reduced fraction and name the FAVOURED party explicitly — no sign
  // ambiguity reaches the reader.
  const favours = rawNum>0 ? 'BLUE' : 'RED';
  return {num, den:rden, rawNum, rawDen:den, favours};
}

// drained-pip tally straight off perCell — the form↔claim tie. Returns counts of wasted
// red / blue tiles; (drainedRed − drainedBlue) MUST equal efficiencyGap.rawNum exactly.
function drainedTally(board, assign){
  const {vote}=board, w=wasted(board, assign);
  let red=0, blue=0;
  for(let i=0;i<w.perCell.length;i++) if(w.perCell[i]){ if(vote[i]===RED) red++; else blue++; }
  return {red, blue};
}

// ---- (4) EXACT ENUMERATION (connected-subset growth + forbidden-set dedupe) -
// Enumerate EVERY valid (contiguous + equal-population) partition up to district-LABEL
// symmetry. Canonical: repeatedly seed the next district at the LOWEST unassigned cell and
// grow a connected subset of exactly its quota; dedupe by requiring every added cell index
// > seed AND a per-level forbidden set (each frontier cell tried once, then forbidden in
// sibling branches at that level). visit(assign) is called for each complete valid partition;
// returns {count, nodes, capped}. Ported from the verified scratch enumerator (counts:
// 3×3/K3=10, 4×4/K4=117, 4×5/K5=454, 5×5/K5=4006).
function enumeratePartitions(board, visit, capNodes=8000000){
  const {R,C,K}=board, N=R*C;
  const sizes=quotaSizes(N,K);
  const nb=neighborsOf(R,C);
  const assign=new Int8Array(N).fill(-1);
  let count=0, nodes=0, capped=false;
  function lowestUnassigned(){ for(let i=0;i<N;i++) if(assign[i]===-1) return i; return -1; }
  function growDistrict(d){
    if(capped) return;
    const seed=lowestUnassigned();
    assign[seed]=d;
    const size=sizes[d];
    const members=[seed];
    function recPick(forbidden){
      if(++nodes>capNodes){ capped=true; return; }
      if(capped) return;
      if(members.length===size){
        if(d===K-1){ count++; if(visit) visit(assign); }
        else growDistrict(d+1);
        return;
      }
      const inMembers=new Set(members);
      const live=[];
      for(const m of members) for(const v of nb[m])
        if(assign[v]===-1 && v>seed && !inMembers.has(v) && !forbidden.has(v)) live.push(v);
      const uniq=[...new Set(live)].sort((a,b)=>a-b);
      if(uniq.length===0) return;
      const localForbidden=new Set(forbidden);
      for(const cell of uniq){
        assign[cell]=d; members.push(cell);
        recPick(localForbidden);
        members.pop(); assign[cell]=-1;
        if(capped) return;
        localForbidden.add(cell);   // dedupe: sibling branches at THIS level may not re-add it
      }
    }
    recPick(new Set());
    assign[seed]=-1;
  }
  growDistrict(0);
  return {count, nodes, capped};
}

// Pure count (no per-partition work) — the dedupe gate the twin asserts.
function countPartitions(board, capNodes=8000000){
  return enumeratePartitions(board, null, capNodes);
}

// ---- extremal witnesses + COMPACT (argmin|EG|) ------------------------------
// One enumeration pass scores EVERY valid partition and keeps the two SEAT extremes and the
// gap minimum:
//   best.maxBlue — the valid partition giving BLUE the MOST seats (the gerrymander against
//                  the RED majority; ties broken toward the more-lopsided |EG|).
//   best.maxRed  — the valid partition giving RED the MOST seats (the abuse the other way).
//   best.compact — argmin |EG| (the honest gap-minimizer; always well-defined even when
//                  seats==votes is unreachable). This is the load-bearing NEGATIVE CONTROL.
// The page reads PACK and CRACK as two DISTINCT abusive maps (a BLUE=4 packing map and a
// BLUE=3 cracking map) drawn from the same enumeration — two strategies, the same theft —
// and COMPACT as best.compact. Returns {partitions, nodes, capped, best}.
function analyzeElectorate(board, capNodes=8000000){
  let best={
    maxBlue:{seats:-1, eg:Infinity, assign:null},   // most BLUE seats
    maxRed:{seats:-1, eg:Infinity, assign:null},     // most RED seats
    compact:{abs:Infinity, eg:0, assign:null, egObj:null},
  };
  const r=enumeratePartitions(board, (assign)=>{
    const s=seats(board, assign);
    const eg=efficiencyGap(board, assign);
    const absEG=Math.abs(eg.rawNum);
    // most BLUE seats; tie-break toward the larger |EG| (more lopsided draw)
    if(s.blue>best.maxBlue.seats || (s.blue===best.maxBlue.seats && absEG>Math.abs((best.maxBlue.egRaw)||0))){
      best.maxBlue={seats:s.blue, redSeats:s.red, egRaw:eg.rawNum, eg, assign:Int8Array.from(assign)};
    }
    if(s.red>best.maxRed.seats || (s.red===best.maxRed.seats && absEG>Math.abs((best.maxRed.egRaw)||0))){
      best.maxRed={seats:s.red, blueSeats:s.blue, egRaw:eg.rawNum, eg, assign:Int8Array.from(assign)};
    }
    if(absEG<best.compact.abs){
      best.compact={abs:absEG, eg, assign:Int8Array.from(assign), seats:{red:s.red,blue:s.blue}};
    }
  }, capNodes);
  return {partitions:r.count, nodes:r.nodes, capped:r.capped, best};
}

// ---- searchCertificate (a card's claim → witness or exhaustive impossibility) -
// claim = { party:'BLUE'|'RED', minSeats:int }. Searches the full enumeration for ANY valid
// partition giving `party` at least `minSeats` seats. Returns {reachable, witness, searched}.
// If reachable, witness is the first such partition (a valid map, verified by the caller);
// if not, searched is the total valid-partition count (an exhaustive no-solution proof).
function searchCertificate(board, claim, capNodes=8000000){
  let witness=null;
  const want = claim.party==='BLUE' ? BLUE : RED;
  const r=enumeratePartitions(board, (assign)=>{
    if(witness) return;
    const s=seats(board, assign);
    const got = want===BLUE ? s.blue : s.red;
    if(got>=claim.minSeats) witness=Int8Array.from(assign);
  }, capNodes);
  if(witness) return {reachable:true, witness, searched:r.count, capped:r.capped};
  return {reachable:false, witness:null, searched:r.count, capped:r.capped};
}

export { mulberry32, shuffle, gcd, buildBoard, idx, neighborsOf, quotaSizes,
         isValid, wasted, seats, efficiencyGap, drainedTally,
         enumeratePartitions, countPartitions, analyzeElectorate, searchCertificate,
         DR, DC, RED, BLUE };
// === CORE END ===

// ---- shared DECK + electorate (lives OUTSIDE the byte-diffed core so the page demo, the
// pill, and the Node twin can never drift on which voters / which cards "the proof" means).
// The hero is a FROZEN 5×5 electorate of 13 RED / 12 BLUE on which PACK / CRACK / COMPACT
// all act — the enacted theorem (same votes, opposite seats). The DECK is a small set of
// hand-authored challenge cards, each carrying its CLAIM; the twin re-derives every
// certificate from scratch (it NEVER trusts a stored witness). Each card's `expect` is the
// hand-checked truth the searchCertificate must reproduce.
//
// HERO vote array (row-major, 0=RED 1=BLUE): the "diagonal wall" electorate — a RED majority
// (13) the lines can hand anywhere from 1 to 4 of 5 seats to BLUE (12). Verified histogram:
// BLUE-seat counts over all 4006 valid partitions = {1:367, 2:3073, 3:558, 4:8}.
const HERO_ELECTORATE = {
  R:5, C:5, K:5,
  vote:[0,0,0,1,1, 0,0,0,1,1, 0,0,0,1,1, 1,1,0,1,1, 0,0,0,1,1],   // 13 RED · 12 BLUE
};
function buildHero(){ return buildBoard(HERO_ELECTORATE.R, HERO_ELECTORATE.C, HERO_ELECTORATE.K, HERO_ELECTORATE.vote); }

// The challenge deck. `board:'hero'` reuses the frozen hero electorate; a card may instead
// carry its OWN small {R,C,K,vote}. `claim` = {party, minSeats}; `expect` is the truth.
const DECK = [
  { id:'b3', title:'Carve so BLUE wins ≥ 3 of 5 seats', board:'hero',
    claim:{party:'BLUE', minSeats:3}, expect:'reachable',
    blurb:'The minority can be GIVEN the majority of seats — pure line-drawing.' },
  { id:'b4', title:'Carve so BLUE wins ≥ 4 of 5 seats', board:'hero',
    claim:{party:'BLUE', minSeats:4}, expect:'reachable',
    blurb:'Pack RED into one throwaway district; only 8 of 4006 maps reach it.' },
  { id:'b5', title:'Carve so BLUE wins all 5 seats', board:'hero',
    claim:{party:'BLUE', minSeats:5}, expect:'impossible',
    blurb:'A 12-vote minority cannot sweep — no valid map exists. Exhaustively proven.' },
  { id:'r4', title:'Carve so RED wins ≥ 4 of 5 seats', board:'hero',
    claim:{party:'RED', minSeats:4}, expect:'reachable',
    blurb:'The majority can also over-reach — the abuse runs both ways.' },
];

export { HERO_ELECTORATE, buildHero, DECK };
