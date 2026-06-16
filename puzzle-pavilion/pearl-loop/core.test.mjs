import { countSolutions, deduce, generate, loopEdges, OFF, UNK, ON } from './core.mjs';

const SEEDS=30, SR=6, SC=6;
let uniq=0,ded=0,match=0,negBoth=0,negEither=0,noGuess=0,gen=0;
let minP=99,maxP=0;
for(let s=1;s<=SEEDS;s++){
  const seed=(s*2654435761)>>>0;
  const g=generate(seed,SR,SC);
  if(!g){ continue; }
  gen++;
  const board={R:g.R,C:g.C,pearls:g.pearls};
  if(countSolutions(board,2)===1) uniq++;
  const d=deduce(board);
  if(d.solved) ded++;
  if(d.solved && loopEdges(d.ix,d.val).join(',')===g.solutionEdges.join(',')) match++;
  if(d.fillOrder.every(f=>f.rule!=='guess')) noGuess++;
  const np=g.pearls.flat().filter(x=>x).length; minP=Math.min(minP,np); maxP=Math.max(maxP,np);
  const present=[]; for(let r=0;r<SR;r++) for(let c=0;c<SC;c++) if(g.pearls[r][c]) present.push([r,c]);
  if(present.length){ const [pr,pc]=present[seed%present.length];
    const broken=g.pearls.map(r=>r.slice()); broken[pr][pc]=0;
    const b={R:SR,C:SC,pearls:broken};
    const bc=countSolutions(b,2), bd=deduce(b).solved;
    const fired=(bc>=2)||(!bd), both=(bc>=2)&&(!bd);
    if(fired)negEither++; if(both)negBoth++; }
}
console.log(`Masyu twin (Node) — ${SEEDS} seeds @ ${SR}x${SC}`);
console.log(`  generated=${gen}/${SEEDS} pearls/board ${minP}..${maxP}`);
console.log(`  unique=${uniq}/${gen} deduced=${ded}/${gen} match=${match}/${gen} no-guess=${noGuess}/${gen}`);
console.log(`  negative control: both=${negBoth}/${gen} either=${negEither}/${gen}`);
const ok = uniq===gen && ded===gen && match===gen && noGuess===gen && negEither===gen && gen===SEEDS;
console.log(ok ? '  OK all green' : '  FAIL');
process.exit(ok?0:1);
