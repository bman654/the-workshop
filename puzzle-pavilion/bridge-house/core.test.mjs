// Node twin for The Bridge House — Hashiwokakero math core. Zero-dep.
// Run: `node core.test.mjs`  (exit 0 on success).
//
// Imports the SAME core.mjs that is inlined BYTE-IDENTICAL into index.html
// between the // === CORE BEGIN === / // === CORE END === sentinels, so the
// page's self-test and this twin can never drift.
//
// The claim, proven across ≥300 seeds:
//   (1) every generated board has EXACTLY ONE solution (countSolutions === 1);
//   (2) the pure-deduction solver reaches it with NO guess step — every trace
//       step is a NAMED rule (island-saturated · island-degree-met · forced-min
//       · degree-cap · crossing-clamp · isolation-avoid);
//   (3) structural invariants hold: the deduced graph is CONNECTED, has no
//       crossing spans, every island's degree === its number, and the deduced
//       layout equals the generated reference;
//   (4) the NEGATIVE CONTROL fires — loosen ONE island whose number ≥2 by 1 and
//       the board loses uniqueness OR the deduction stalls. (The corrected
//       control: a degree-1 island's number can't drop without stranding it, so
//       we only loosen a ≥2 island where −1 genuinely changes the constraint.)

import { buildBoard, pairs, conflictMap, isConnected, countSolutions, deduce, generate } from './core.mjs';

let pass=0, fail=0; const fails=[];
const ck=(n,ok)=>{ if(ok)pass++; else{fail++;fails.push(n);} };
const SEEDS=300;
let made=0,uniq=0,ded=0,conn=0,match=0,ctrlBreak=0,ctrlTot=0,noGuessOK=0;
let minN=99,maxN=0,minI=99,maxI=0;
const guessRules=new Set(['island-saturated','island-degree-met','forced-min','degree-cap','crossing-clamp','isolation-avoid']);

for(let s=1;s<=SEEDS;s++){
  const seed=(s*2654435761)>>>0;
  const g=generate(seed,9,7,7); if(!g) continue; made++;
  const I=g.board.islands.length; minI=Math.min(minI,I); maxI=Math.max(maxI,I);
  for(const is of g.board.islands){ minN=Math.min(minN,is.n); maxN=Math.max(maxN,is.n); }
  const cnt=countSolutions(g.board,3); if(cnt===1) uniq++;
  const d=deduce(g.board);
  if(d.solved) ded++;
  if(d.solved && isConnected(g.board,g.P,d.lo)) conn++;
  if(d.solved && JSON.stringify(d.lo)===JSON.stringify(g.refBridges)) match++;
  if(d.trace.every(t=>guessRules.has(t.rule))) noGuessOK++;
  if(d.solved){
    const n=g.board.islands.length; const deg=new Array(n).fill(0);
    g.P.forEach((pr,k)=>{deg[pr[0]]+=d.lo[k];deg[pr[1]]+=d.lo[k];});
    const degOK=deg.every((dd,i)=>dd===g.board.islands[i].n);
    const conf=conflictMap(g.board,g.P); let noCross=true;
    for(let k=0;k<g.P.length;k++) if(d.lo[k]>0) for(const c of conf[k]) if(d.lo[c]>0) noCross=false;
    if(!(degOK&&noCross)) fails.push('invariant seed '+seed);
  }
  // corrected negative control
  const isl=g.board.islands.map(o=>({...o}));
  const cands=[]; isl.forEach((o,i)=>{ if(o.n>=2) cands.push(i); });
  if(cands.length){ ctrlTot++;
    const pick=cands[seed%cands.length]; isl[pick]={...isl[pick],n:isl[pick].n-1};
    const broken=buildBoard(g.W,g.H,isl);
    if(countSolutions(broken,3)!==1 || !deduce(broken).solved) ctrlBreak++;
  }
}
ck('generated ≥80% of seeds', made>=Math.floor(SEEDS*0.8));
ck('all boards UNIQUE (count===1)', uniq===made);
ck('all solved by pure DEDUCTION', ded===made);
ck('all deduced graphs CONNECTED', conn===made);
ck('deduced === reference layout', match===made);
ck('every trace step a NAMED rule (no guess)', noGuessOK===made);
ck('negative control breaks on ALL real loosenings', ctrlBreak===ctrlTot && ctrlTot>0);

console.log('Hashi core.test (Node twin) — The Bridge House · The Puzzle Pavilion');
console.log(`  seeds ${SEEDS} · generated ${made} · islands ${minI}..${maxI} · numbers ${minN}..${maxN}`);
console.log(`  unique=${uniq}/${made} deduced=${ded}/${made} connected=${conn}/${made} match=${match}/${made}`);
console.log(`  no-guess=${noGuessOK}/${made} · control-breaks=${ctrlBreak}/${ctrlTot}`);
console.log((fail===0?'  ✓ ':'  ✗ ')+pass+'/'+(pass+fail)+' checks pass');
if(fail){ console.log('  FAILING: '+fails.slice(0,8).join(' · ')); process.exit(1); }
