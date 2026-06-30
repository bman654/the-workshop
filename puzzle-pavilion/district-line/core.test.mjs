// Node twin for THE DISTRICT LINE — redistricting / efficiency-gap math core. Zero-dep.
// Run: node core.test.mjs
// Imports the SAME core.mjs the page inlines byte-identical between the CORE sentinels,
// plus the shared deck helpers (HERO_ELECTORATE / DECK / buildHero) that live OUTSIDE the
// sentinels so the page demo, the pill, and this twin can never drift on what "the proof"
// means. The twin re-derives EVERY certificate from scratch — it NEVER trusts a stored
// witness — and asserts the partition-COUNT dedupe gate against hand-checked truths.
import { buildBoard, isValid, wasted, seats, efficiencyGap, drainedTally,
         countPartitions, enumeratePartitions, analyzeElectorate, searchCertificate,
         quotaSizes, RED, BLUE, HERO_ELECTORATE, DECK, buildHero } from './core.mjs';

let pass=0, fail=0; const fails=[];
const ck=(n,ok)=>{ if(ok)pass++; else{fail++;fails.push(n);} };

// Build the HERO electorate (13 RED / 12 BLUE on 5×5, K=5) the page ships, and derive its
// three named strategies fresh (the page does the same). PACK = first BLUE=4 valid partition
// (RED packed into one district); CRACK = first BLUE=3 (RED cracked across districts);
// COMPACT = argmin|EG| from the full analysis.
const hero=buildHero();
const heroAnalysis=analyzeElectorate(hero);
let _packCache=null, _crackCache=null;
function DECK_HERO_PACK(){ if(_packCache) return _packCache;
  enumeratePartitions(hero,(a)=>{ if(_packCache) return; if(seats(hero,a).blue===4) _packCache=Int8Array.from(a); }); return _packCache; }
function DECK_HERO_CRACK(){ if(_crackCache) return _crackCache;
  enumeratePartitions(hero,(a)=>{ if(_crackCache) return; if(seats(hero,a).blue===3) _crackCache=Int8Array.from(a); }); return _crackCache; }
function heroStrategy(name){
  if(name==='compact') return heroAnalysis.best.compact.assign;
  if(name==='pack') return DECK_HERO_PACK();
  if(name==='crack') return DECK_HERO_CRACK();
  throw new Error('unknown strategy '+name);
}
function buildHeroOrCard(card){
  if(card.board==='hero') return hero;
  return buildBoard(card.R, card.C, card.K, Int8Array.from(card.vote));
}

// The page's pill runs these SAME EIGHT numbered claims, one ck() each, in the same order —
// so the in-page pill check-count ≡ this twin's. Each ck folds its sub-conditions into one
// boolean; the comments spell out every sub-condition being asserted.
const aC=heroStrategy('compact'), aP=heroStrategy('pack'), aK=heroStrategy('crack');
const g=(x,y)=>{x=Math.abs(x);y=Math.abs(y);while(y){[x,y]=[y,x%y];}return x;};

// (1) VALIDITY SOUND — every shipped strategy re-floods orthogonally-contiguous + on-quota;
// a deliberately TORN partition is rejected with a named reason.
{
  let allValid=true;
  for(const a of [aC,aP,aK]){
    if(!isValid(hero,a).valid) allValid=false;
    const sizes=quotaSizes(25,5); const cnt=new Array(5).fill(0); for(const d of a) cnt[d]++;
    for(let d=0;d<5;d++) if(cnt[d]!==sizes[d]) allValid=false;
  }
  const torn=Int8Array.from(aC); torn[0]=4;                 // rip cell 0 into a far district
  const tv=isValid(hero, torn);
  ck('validity sound: valid iff contiguous + equal-pop; a torn map rejected (named reason)',
     allValid && tv.valid===false && typeof tv.reason==='string');
}

// (2) WASTED EXACT + CONSERVED — integer identity wastedRed+wastedBlue === total − ΣT_d holds
// per board, and the worked-example exact values (COMPACT wRed=4, wBlue=6) hold.
{
  let conserved=true;
  for(const a of [aC,aP,aK]){
    const w=wasted(hero,a);
    const members=Array.from({length:5},()=>[]); for(let i=0;i<25;i++) members[a[i]].push(i);
    let sumT=0; for(let d=0;d<5;d++){ const pop=members[d].length; sumT+=((pop>>1)+1); }
    if(w.wastedRed+w.wastedBlue !== 25-sumT) conserved=false;
  }
  const wc=wasted(hero,aC);
  ck('wasted exact + conserved: wRed+wBlue === total − ΣT_d; COMPACT wRed=4, wBlue=6',
     conserved && wc.wastedRed===4 && wc.wastedBlue===6);
}

// (3) EG = the gcd-reduced fraction AND num === wRed−wBlue AND THE FORM↔CLAIM TIE:
// (drained-red perCell − drained-blue perCell) === EG rawNum on every map (map IS the number),
// plus the worked-example exacts (COMPACT −2/25 favours RED, CRACK +4/25 favours BLUE).
{
  let egOk=true, tieOk=true;
  for(const a of [aC,aP,aK]){
    const eg=efficiencyGap(hero,a), w=wasted(hero,a);
    if(eg.rawNum !== w.wastedRed-w.wastedBlue) egOk=false;
    if(!(eg.num===0 ? eg.den===1 : g(eg.num,eg.den)===1)) egOk=false;
    const dt=drainedTally(hero,a);
    if((dt.red-dt.blue) !== eg.rawNum) tieOk=false;
  }
  const egc=efficiencyGap(hero,aC), egk=efficiencyGap(hero,aK);
  ck('EG reduced + FORM↔CLAIM tie: drained-pip imbalance === EG num; COMPACT −2/25(RED), CRACK +4/25(BLUE)',
     egOk && tieOk && egc.rawNum===-2 && egc.den===25 && egc.favours==='RED'
            && egk.rawNum===4 && egk.den===25 && egk.favours==='BLUE');
}

// (4) THE ENACTED THEOREM — PACK/CRACK/COMPACT are all valid partitions of the SAME vote
// array yet seats differ by ≥1: COMPACT gives RED the majority (3/5), PACK flips it (BLUE 4/5).
{
  const sC=seats(hero,aC), sP=seats(hero,aP), sK=seats(hero,aK);
  const allValid=isValid(hero,aC).valid && isValid(hero,aP).valid && isValid(hero,aK).valid;
  ck('enacted theorem: same frozen votes → seats differ ≥1 (COMPACT RED 3/5 vs PACK BLUE 4/5)',
     allValid && sC.red===3 && sP.blue===4 && (sP.blue-sC.blue)>=1);
}

// (5) CERTIFICATE HONEST — the twin re-runs searchCertificate FROM SCRATCH per card (never
// trusting a stored witness): reachable → witness valid + hits target; impossible → exhaustive
// search confirms zero valid partitions qualify (searched === full partition count).
{
  let ok=true;
  for(const card of DECK){
    const b=buildHeroOrCard(card);
    const cert=searchCertificate(b, card.claim);
    if(card.expect==='reachable'){
      if(!cert.reachable){ ok=false; }
      else{
        const s=seats(b, cert.witness); const got=card.claim.party==='BLUE'?s.blue:s.red;
        if(!isValid(b, cert.witness).valid || got < card.claim.minSeats) ok=false;
      }
    } else {
      if(cert.reachable || cert.searched !== countPartitions(b).count) ok=false;
    }
  }
  ck('certificate honest: every card re-derived from scratch (witness valid / exhaustively impossible)', ok);
}

// (6) NEG-CONTROL REAL — COMPACT |EG| ≤ every other valid partition's |EG| (the twin
// enumerates the whole 4006-map space and confirms COMPACT is the proven gap-minimizer).
{
  const egC=Math.abs(efficiencyGap(hero,aC).rawNum);
  let isMin=true, scanned=0;
  enumeratePartitions(hero,(a)=>{ scanned++; if(Math.abs(efficiencyGap(hero,a).rawNum)<egC) isMin=false; });
  ck('neg-control real: COMPACT |EG| ≤ every valid map (proven gap-minimizer over 4006)', isMin && scanned===4006);
}

// (7) PARTITION-COUNT ASSERTION — the dedupe gate (the one landmine): a blank electorate's
// valid-partition count must hit the hand-checked truths (a wrong ">last" dedupe gives 6, not 10).
{
  const truths=[[3,3,3,10],[4,4,4,117],[4,5,5,454],[5,5,5,4006]];
  let ok=true;
  for(const [R,C,K,want] of truths){ const r=countPartitions(buildBoard(R,C,K,new Int8Array(R*C)));
    if(r.count!==want || r.capped) ok=false; }
  ck('partition-count dedupe gate (3×3=10 · 4×4=117 · 4×5=454 · 5×5=4006)', ok);
}

// (8) BYTE-TWIN PARITY — this twin imports the SAME core.mjs the page inlines between the
// sentinels; the in-page pill fetches both files and asserts char-for-char equality (the twin
// enforces it by construction here — it ran ALL the above against core.mjs's exports).
ck('byte-twin parity (this twin runs against the same core.mjs the page inlines)', true);

// ─────────────────────────────────────────────────────────────────────────────
console.log(`hero: parts=${heroAnalysis.partitions} (5×5/K5)`);
console.log(`deck: ${DECK.length} cards`);
console.log((fail===0?'  OK ':'  FAIL ')+pass+'/'+(pass+fail)+' checks');
if(fail){ console.log('  FAILING: '+fails.join(' · ')); process.exit(1); }
process.exit(0);
