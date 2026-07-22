// The PAYOFF-LIVENESS TWIN for "The Sealing-Wax Bench" (headless, Node-runnable).
// Claim-free room — it proves no theorem. Its payoff is that you POUR, PRESS and
// PEEL a real seal: the press inverts the intaglio die into a raised relief, the
// wax cools from molten to still-and-hard, and a hung seal is remembered across a
// reload. This twin drives the room's OWN pure core (seal-core.mjs) — the SAME
// module the page inlines byte-for-byte — NEVER a canvas pointer event (headless
// can't deliver one). Every assertion fires on the live path.
//   Run: `node compositor/the-sealing-wax-bench/liveness.test.mjs`
//
//   (a) PRESS FIRES THE INVERSION — on a real analytic die, at full press
//       relief>0 ⟺ die>0 cell-for-cell; deepest die cell ⇒ highest relief;
//       monotone in p; support IoU(relief@1, die) > 0.999.
//   (b) COOLING FIRES — wobble decays to <2% and reaches ~0; molten→hard actually
//       occurs; gloss and ember strictly fall as it sets.
//   (c) A HUNG SEAL ROUND-TRIPS — hang, reload in a FRESH ribbon, same record AND
//       pressRelief(dieField(matrix,seed)) re-derives IDENTICAL relief; order kept;
//       corrupt/blocked storage degrade to a usable empty ribbon; cap holds.
//   (G) BYTE-PARITY — the inlined SEAL CORE in index.html === seal-core.mjs.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEAL_N, dieField, pressRelief, coolAt, createRibbon } from './seal-core.mjs';

let pass=0, fail=0; const fails=[];
function ck(name, ok){ if(ok) pass++; else { fail++; fails.push(name); } }
function argmax(a){ let mi=0, mv=a[0]; for(let i=1;i<a.length;i++) if(a[i]>mv){mv=a[i];mi=i;} return mi; }
function maxOf(a){ let m=a[0]; for(let i=1;i<a.length;i++) if(a[i]>m)m=a[i]; return m; }

// ── (a) PRESS FIRES THE INVERSION (die-sunk ⇒ relief-raised) ──
for(const matrix of ['roundel','cross','saltire']){
  const die = dieField(matrix, 7);
  const rel = pressRelief(die, 1.0);
  // cell-for-cell: relief>0 exactly where die>0
  let mismatch=0, sunk=0, face=0;
  for(let i=0;i<die.data.length;i++){
    const d=die.data[i]>0, r=rel.data[i]>0;
    if(d!==r) mismatch++;
    if(d) sunk++; else face++;
  }
  ck(`(a) ${matrix}: relief>0 ⟺ die>0 cell-for-cell (0 mismatches)`, mismatch===0);
  ck(`(a) ${matrix}: ≥50 sunk cells give relief>0 and ≥50 face cells give relief===0`,
     sunk>=50 && face>=50);
  // the deepest die cell yields the highest relief
  const di=argmax(die.data);
  ck(`(a) ${matrix}: the deepest die cell yields the highest relief`,
     rel.data[di]>0 && Math.abs(rel.data[di]-maxOf(rel.data))<1e-9);
  // monotone in p over {0,.2,.4,.6,.8,1}
  let mono=true, prev=-1;
  for(const p of [0,0.2,0.4,0.6,0.8,1.0]){
    const m=maxOf(pressRelief(die,p).data);
    if(!(m>=prev-1e-12)) mono=false; prev=m;
  }
  const m03=maxOf(pressRelief(die,0.3).data), m10=maxOf(pressRelief(die,1.0).data);
  ck(`(a) ${matrix}: relief monotone in press p (max@0.3 ${m03.toFixed(3)} < max@1.0 ${m10.toFixed(3)})`,
     mono && m03>0 && m10>0 && m03<m10);
  // support IoU(relief@1, die) > 0.999
  let inter=0, uni=0;
  for(let i=0;i<die.data.length;i++){ const a=die.data[i]>0, b=rel.data[i]>0;
    if(a||b) uni++; if(a&&b) inter++; }
  ck(`(a) ${matrix}: support IoU(relief@1, die) > 0.999 (${(inter/uni).toFixed(4)})`, inter/uni>0.999);
}

// ── (b) COOLING FIRES ──
(()=>{
  // sample across the cooling window (M>0 throughout, so gloss/ember strictly fall);
  // the fully-SET state is asserted separately at t=8.
  const start=coolAt(0), samples=[];
  for(let t=0;t<=6.5;t+=0.4) samples.push({t, s:coolAt(t)});
  // wobble strictly decreases, reaches <2% of start, and ~0 at the end
  let wDown=true; for(let i=1;i<samples.length;i++) if(!(samples[i].s.wobbleAmp < samples[i-1].s.wobbleAmp)) wDown=false;
  const last=samples[samples.length-1].s.wobbleAmp;
  ck(`(b) wobble strictly decays to <2% of start and reaches ~0 (end ${last.toExponential(1)})`,
     wDown && last < 0.02*start.wobbleAmp && last < 1e-3);
  // molten at t=0, hard once cooled
  const set=coolAt(8);
  ck('(b) molten at t=0, then hard (hardness>0.98, molten=false) once cooled',
     start.molten===true && set.hardness>0.98 && set.molten===false);
  // gloss AND ember strictly fall across the cool
  let gDown=true, eDown=true;
  for(let i=1;i<samples.length;i++){
    if(!(samples[i].s.spec < samples[i-1].s.spec)) gDown=false;
    if(!(samples[i].s.ember < samples[i-1].s.ember)) eDown=false;
  }
  ck('(b) gloss and ember strictly decrease as it sets (gloss_set < gloss_molten)',
     gDown && eDown && set.spec < start.spec && set.ember < start.ember);
})();

// ── (c) A HUNG SEAL ROUND-TRIPS ──
function mockStore(){ const m=new Map(); return {
  getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>{m.set(k,String(v));}, removeItem:k=>m.delete(k) }; }
(()=>{
  const store=mockStore();
  const A=createRibbon({storage:store});
  const rec={ id:'s1', matrix:'roundel', wax:'#8b1a1a', seed:42, v:1 };
  A.hang({ id:'s0', matrix:'cross',  wax:'#6e1f22', seed:7,  v:1 });
  A.hang(rec);
  A.hang({ id:'s2', matrix:'saltire',wax:'#a33', seed:99, v:1 });
  // reload in a FRESH ribbon over the same storage
  const B=createRibbon({storage:store});
  const loaded=B.load();
  const got=loaded.find(r=>r.id==='s1');
  ck('(c) a hung seal restores its {id,matrix,wax,seed} in a fresh ribbon',
     !!got && got.id===rec.id && got.matrix===rec.matrix && got.wax===rec.wax && got.seed===rec.seed);
  // the relief RE-DERIVES identical cell-for-cell (a real resume, not a screenshot)
  const orig=pressRelief(dieField(rec.matrix, rec.seed), 1.0).data;
  const redo=pressRelief(dieField(got.matrix, got.seed), 1.0).data;
  let identical = orig.length===redo.length;
  for(let i=0;identical && i<orig.length;i++) if(orig[i]!==redo[i]) identical=false;
  ck('(c) pressRelief(dieField(matrix,seed)) re-derives IDENTICAL relief on reload', identical);
  // order preserved across the three hangs
  ck('(c) order preserved across three hangs', loaded.map(r=>r.id).join(',')==='s0,s1,s2');
})();
(()=>{ // robustness
  const corrupt=mockStore(); corrupt.setItem('ws:seal:ribbon','{not json');
  const R1=createRibbon({storage:corrupt});
  let threw=false, empty=false; try{ empty = R1.load().length===0; }catch(e){ threw=true; }
  ck('(c) corrupt JSON ⇒ empty ribbon, no throw', !threw && empty);

  const blocked={ getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); } };
  const R2=createRibbon({storage:blocked});
  let sOk=false, lOk=false, bthrew=false;
  try{ sOk=(R2.save([{id:'x',matrix:'roundel',wax:'#8b1a1a',seed:1,v:1}])===false); lOk=(R2.load().length===0); }catch(e){ bthrew=true; }
  ck('(c) blocked storage ⇒ save()===false + load()===[] , no throw', !bthrew && sOk && lOk);

  const capStore=mockStore(); const R3=createRibbon({storage:capStore, max:3});
  for(let i=0;i<6;i++) R3.hang({id:'c'+i, matrix:'roundel', wax:'#8b1a1a', seed:i, v:1});
  const cl=R3.load();
  ck('(c) cap at max, oldest falls off', cl.length===3 && cl.map(r=>r.id).join(',')==='c3,c4,c5');
})();

// ── (G) BYTE-PARITY: inlined SEAL CORE in index.html === seal-core.mjs body ──
const here=dirname(fileURLToPath(import.meta.url));
const BEGIN='// ===== SEAL CORE (byte-identical to seal-core.mjs) =====';
const END  ='// ===== END SEAL CORE =====';
function region(t){ const i=t.indexOf(BEGIN), j=t.indexOf(END); if(i<0||j<0||j<i) return null; return t.slice(i+BEGIN.length,j); }
function norm(s){ return s.split('\n').map(l=>l.replace(/^\s+/,'').replace(/\s+$/,'')).filter(l=>l.length).join('\n'); }
let coreR=null, pageR=null;
try{ coreR=region(readFileSync(join(here,'seal-core.mjs'),'utf8')); }catch{}
try{ pageR=region(readFileSync(join(here,'index.html'),'utf8')); }catch{}
ck('(G) SEAL CORE sentinels present in seal-core.mjs', !!coreR);
ck('(G) SEAL CORE sentinels present in index.html (forge-inlined)', !!pageR);
ck('(G) inlined core === seal-core.mjs body (byte-identical, indentation-normalised)',
   !!coreR && !!pageR && norm(coreR)===norm(pageR));

// ── report ──
console.log('The Sealing-Wax Bench — liveness.test.mjs (payoff-liveness twin, claim-free)');
console.log('  the payoff FIRES on the live path: press inverts · wax cools · the ribbon remembers');
console.log('  byte-parity: '+(coreR&&pageR&&norm(coreR)===norm(pageR)?'IDENTICAL':(pageR?'DRIFTED':'index.html not built yet')));
console.log((fail===0?'  ✓ ':'  ✗ ')+pass+'/'+(pass+fail)+' checks pass');
if(fail){ console.log('  FAILING:\n   '+fails.join('\n   ')); process.exit(1); }
