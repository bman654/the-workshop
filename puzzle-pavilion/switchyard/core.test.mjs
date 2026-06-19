// Node twin for THE SWITCHYARD — Netwalk math core. Zero-dep. Run: node core.test.mjs
// Imports the SAME core.mjs the page inlines byte-identical between the CORE sentinels,
// plus the shared real negative-control (controlEveryArm) the in-page pill also uses —
// so the twin and the pill can never drift on what "the proof" means.
import { buildBoard, checkSolved, powerFlood, countSolutions, deduce, generate,
         rot, orientations, idx, controlEveryArm, DR, DC, OPP } from './core.mjs';

let pass=0, fail=0; const fails=[];
const ck=(n,ok)=>{ if(ok)pass++; else{fail++;fails.push(n);} };
const SEEDS=200;
const sizes=[[5,5],[6,6]];
const namedRules=new Set(['border-no-off-grid','reciprocate-arm','reciprocate-wall']);

for(const [R,C] of sizes){
  let made=0,uniq=0,ded=0,match=0,treeOK=0,noGuess=0,ctrlBoards=0,ctrlAllBroke=0;
  for(let s=1;s<=SEEDS;s++){
    const seed=(s*2654435761 ^ (R*131+C))>>>0;
    const g=generate(seed, R, C, 0.0); if(!g){ continue; } made++;
    // unique
    if(countSolutions(g.board,3)===1) uniq++;
    // deduced
    const d=deduce(g.board);
    if(d.solved) ded++;
    // deduced === witness
    if(d.solved){ let m=true; for(let i=0;i<R*C;i++) if(d.masks[i]!==g.witness[i]){m=false;break;} if(m) match++; }
    // no-guess: every trace step a named rule
    if(d.trace.every(t=>namedRules.has(t.rule))) noGuess++;
    // solved net is ONE connected tree touching all cells with zero dangling arms
    if(d.solved){
      const ok=checkSolved(g.board, g.witness);   // reciprocity + no off-grid + spans all
      let arms=0; for(let i=0;i<R*C;i++){ let m=g.witness[i]; while(m){arms+=m&1;m>>=1;} }
      const edges=arms/2;                          // TREE ⇒ edges === N-1 (loopChance=0)
      const pf=powerFlood(g.board, g.witness); let allPowered=true; for(let i=0;i<R*C;i++) if(!pf[i]) allPowered=false;
      if(ok && edges===R*C-1 && allPowered) treeOK++;
    }
    // REAL negative control (shared helper): EVERY single-arm mutation of the solved board
    // must break the unique deducible solution. Aggregate over all mutations of all boards.
    {
      const cc=controlEveryArm(g.board, g.witness);
      ctrlBoards++;
      if(cc.tested>0 && cc.broke===cc.tested) ctrlAllBroke++;
    }
  }
  ck(`[${R}x${C}] generated ≥80%`, made>=Math.floor(SEEDS*0.8));
  ck(`[${R}x${C}] all UNIQUE (count===1)`, uniq===made && made>0);
  ck(`[${R}x${C}] all solved by pure DEDUCTION`, ded===made);
  ck(`[${R}x${C}] deduced === witness`, match===made);
  ck(`[${R}x${C}] every trace step NAMED (no guess)`, noGuess===made);
  ck(`[${R}x${C}] solved net = spanning tree, zero dangling, all powered`, treeOK===made);
  ck(`[${R}x${C}] every single-arm mutation breaks (real neg-control)`, ctrlAllBroke===ctrlBoards && ctrlBoards>0);
  console.log(`[${R}x${C}] made=${made}/${SEEDS} unique=${uniq} deduced=${ded} match=${match} noGuess=${noGuess} treeOK=${treeOK} ctrlBroke=${ctrlAllBroke}/${ctrlBoards}`);
}
console.log((fail===0?'  OK ':'  FAIL ')+pass+'/'+(pass+fail)+' checks');
if(fail){ console.log('  FAILING: '+fails.join(' · ')); process.exit(1); }
process.exit(0);
