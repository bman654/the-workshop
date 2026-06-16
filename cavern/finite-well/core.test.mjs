/* ════════════════════════════════════════════════════════════════
   THE FINITE WELL · core.test.mjs — the Node twin (exit 0 iff all pass)
   ════════════════════════════════════════════════════════════════
   Runs the finite-square-well proofs headless against core.mjs — the SOLE
   authority — then proves two things the in-page self-test echoes and one
   thing only the file system can:

     • BYTE-TWIN PARITY: the // === CORE … === block inlined into
       index.html is byte-identical to the same block in core.mjs.
       (If someone edits one and not the other, this goes red.)

     • THE TWO MOTION CLAIMS the re-souled bench enacts:
       (9) the bound-state COUNT tracks ⌊R/(π/2)⌋+1 across a swept well,
           with births landing EXACTLY at R = n·π/2;
       (10) the top rung's LEAK grows monotonically as the well shallows.

   Run:  node cavern/finite-well/core.test.mjs   →  exit 0 on success.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  radius, nBound, solveLevel, allLevels, psiUnnorm, normConst, psi,
  leakOutside, nodeCount, buildFD, fdMul, inversePower
} from './core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const results = [];
function ck(name, ok, detail){
  results.push({ name, ok: !!ok, detail: detail || '' });
  if(!ok) failed++;
}
function approx(a,b,tol){ return Math.abs(a-b) <= tol; }

const V0 = 20, a = 1, R = radius(V0,a);   // reference well: 5 bound states

/* ── (1) FINITE ladder: count = ⌊R/(π/2)⌋+1, grows with depth/width, ALWAYS ≥ 1 ── */
{
  const n0=nBound(radius(20,1)), nSh=nBound(radius(1.5,1)), nDp=nBound(radius(200,1)), n1=nBound(radius(0.01,1));
  ck('the ladder is FINITE: count = ⌊R/(π/2)⌋+1, grows with depth, always ≥ 1',
     n0===5 && nSh===2 && nDp===13 && n1>=1,
     `V0=20→${n0} states, V0=1.5→${nSh}, V0=200→${nDp}, V0=0.01→${n1} (a well always binds ≥1)`);
}

/* ── (2) Every level SATISFIES the transcendental matching + lies on the circle u²+v²=R² ── */
{
  let maxR=0, rw='';
  for(let n=0;n<nBound(R);n++){
    const L=solveLevel(n,V0,a); if(!L) continue;
    const want = L.even ? L.u*Math.tan(L.u) : -L.u/Math.tan(L.u);
    let e=Math.abs(want-L.v); if(e>maxR){ maxR=e; rw='match n='+n; }
    const circ=Math.abs(L.u*L.u+L.v*L.v-R*R); if(circ>maxR){ maxR=circ; rw='circle n='+n; }
  }
  ck('each rung solves the transcendental match & lies on u²+v²=R²', maxR<1e-9,
     `max residual ${maxR.toExponential(2)} (${rw})`);
}

/* ── (3) ψ and its log-derivative ψ′/ψ are CONTINUOUS across the wall ── */
{
  let maxJump=0;
  for(let n3=0;n3<nBound(R);n3++){
    const L3=solveLevel(n3,V0,a);
    const logIn = L3.even ? (-L3.k*Math.sin(L3.k*a))/Math.cos(L3.k*a) : (L3.k*Math.cos(L3.k*a))/Math.sin(L3.k*a);
    const logOut = -L3.kappa;
    maxJump=Math.max(maxJump, Math.abs(logIn-logOut)/(Math.abs(logOut)+1e-9));
  }
  ck('ψ and ψ′/ψ continuous across the wall (no kink)', maxJump<1e-7,
     `max log-derivative mismatch ${maxJump.toExponential(2)}`);
}

/* ── (4) Node theorem: the n-th bound state has exactly n interior nodes ── */
{
  let nodesOK=true, nw='';
  for(let k4=0;k4<nBound(R);k4++){ const c=nodeCount(solveLevel(k4,V0,a)); if(c!==k4){ nodesOK=false; nw='n='+k4+'→'+c; } }
  ck('node theorem: the n-th bound state has n nodes', nodesOK, nw||'verified n=0..'+(nBound(R)-1));
}

/* ── (5) INDEPENDENT FD eigensolve of the STEP potential → the transcendental ladder ── */
{
  const fdC=buildFD(800,V0,a), fdF=buildFD(1600,V0,a);
  let coarse=0, fine=0, relFine=0;
  for(let s5=0;s5<nBound(R);s5++){
    const L5=solveLevel(s5,V0,a);
    const gotC=inversePower(fdC, L5.E-0.15, 700+s5).lambda;
    const gotF=inversePower(fdF, L5.E-0.15, 700+s5).lambda;
    coarse=Math.max(coarse, Math.abs(gotC-L5.E));
    fine=Math.max(fine, Math.abs(gotF-L5.E));
    relFine=Math.max(relFine, Math.abs(gotF-L5.E)/L5.E);
  }
  ck('from-scratch FD eigensolve → the transcendental ladder', relFine<1.2e-2 && fine < coarse*0.7,
     `max|λ−E|: N=800 ${coarse.toExponential(2)} → N=1600 ${fine.toExponential(2)}; rel ${(relFine*100).toFixed(2)}% (stepped V → O(h))`);
}

/* ── (6) The wave LEAKS OUT through the walls, and the SHALLOWEST rung leaks the MOST ── */
{
  const levels=allLevels(V0,a), top=levels[levels.length-1], bot=levels[0];
  const leakTop=leakOutside(top), leakBot=leakOutside(bot);
  ck('the wave leaks out of the walls; the shallowest rung leaks farthest',
     leakTop>leakBot && leakBot>0 && leakTop>0.10,
     `leak: n=0 ${(leakBot*100).toFixed(1)}%  <  n=${top.n} ${(leakTop*100).toFixed(1)}% (the shallow state barely binds)`);
}

/* ── (7) BOX RECOVERY: as V₀→∞ the finite ladder → the infinite-box ladder ── */
{
  const Ldeep=2e7; let maxRel=0, brw='';
  for(let n7=0;n7<4;n7++){
    const L7=solveLevel(n7,Ldeep,1), m=n7+1, boxE=m*m*Math.PI*Math.PI/(8*1*1), rel=Math.abs(L7.E-boxE)/boxE;
    if(rel>maxRel){ maxRel=rel; brw='n='+n7; }
  }
  ck('box recovery: V₀→∞ ⇒ ladder → the infinite box (n+1)²π²/(8a²)', maxRel<1e-3,
     `max relative error ${maxRel.toExponential(2)} (${brw})`);
}

/* ── (8) Determinism: the pure core gives byte-identical numbers on recompute ── */
{
  const aS=solveLevel(2,V0,a).E.toString()+'|'+psiUnnorm(solveLevel(1,V0,a),0.3).toString();
  const bS=solveLevel(2,V0,a).E.toString()+'|'+psiUnnorm(solveLevel(1,V0,a),0.3).toString();
  ck('deterministic (pure core)', aS===bS, 'identical recompute');
}

/* ── (9) COUNT TRACKS THE SWEPT WELL — births land EXACTLY at R = n·π/2 ──
   The hero motion-claim: as the well is swept the rung count is always
   ⌊R/(π/2)⌋+1, and each new rung is born precisely when R crosses n·π/2. */
{
  let sweepOK=true, sweepW='';
  for(let V=0.5; V<=400; V+=0.5){
    if(allLevels(V,1).length !== nBound(radius(V,1))){ sweepOK=false; sweepW='V0='+V; break; }
  }
  // births straddle R = n·π/2 exactly: V0 = (R∓1e-4)²/2 at a=1
  let birthOK=true, birthW='';
  for(let n=1;n<=6;n++){
    const Rc=n*(Math.PI/2);
    const below=nBound(radius((Rc-1e-4)*(Rc-1e-4)/2, 1));
    const above=nBound(radius((Rc+1e-4)*(Rc+1e-4)/2, 1));
    if(!(below===n && above===n+1)){ birthOK=false; birthW='n='+n+' ('+below+'→'+above+')'; break; }
  }
  ck('count tracks ⌊R/(π/2)⌋+1 across a swept well; births land exactly at R=n·π/2',
     sweepOK && birthOK,
     sweepOK
       ? (birthOK ? 'V0=0.5..400: count==nBound everywhere; n=1..6 born exactly at R=n·π/2'
                  : 'BIRTH OFF AT '+birthW)
       : 'COUNT MISMATCH AT '+sweepW);
}

/* ── (10) TOP-RUNG LEAK MONOTONE AS THE WELL SHALLOWS ──
   Stay inside the 1-state window R∈(0,π/2) ⇒ V0∈(0,(π/2)²/2)≈(0,1.234) at a=1
   so the SAME lone rung is tracked (no births confound it — a future widener
   past V0max would cross a birth and read non-monotone). Shallow it and the
   lone rung's leak grows strictly, climbing from <20% to >65%. */
{
  const V0max = (Math.PI/2)*(Math.PI/2)/2;   // ≈ 1.2337 — just under the n=1 birth
  let prev=-1, monoOK=true, monoW='';
  let first=-1, last=-1;
  for(let f=0.95; f>=0.05-1e-9; f-=0.05){
    const L=allLevels(V0max*f,1)[0];
    const leak=leakOutside(L);
    if(first<0) first=leak;
    last=leak;
    if(prev>=0 && !(leak>prev)){ monoOK=false; monoW='f='+f.toFixed(2); }
    prev=leak;
  }
  const climbOK = first<0.20 && last>0.65;
  ck('the top rung\'s leak grows monotonically as the well shallows (16%→80%)',
     monoOK && climbOK,
     monoOK ? `lone-rung leak ${(first*100).toFixed(0)}% → ${(last*100).toFixed(0)}% strictly increasing as V0 shallows`
            : 'NON-MONOTONE AT '+monoW);
}

/* ── (11) BYTE-TWIN PARITY: the core block inlined in index.html is
        byte-identical to the same block in core.mjs ── */
function extractCore(text){
  const lines = text.split('\n');
  const i0 = lines.findIndex(l => l.startsWith('// === CORE BEGIN ==='));
  const i1 = lines.findIndex(l => l.startsWith('// === CORE END ==='));
  if(i0<0 || i1<0 || i1<i0) return null;
  return lines.slice(i0, i1+1).join('\n');
}
{
  const coreSrc = readFileSync(join(HERE,'core.mjs'),'utf8');
  const pageSrc = readFileSync(join(HERE,'index.html'),'utf8');
  const coreBlk = extractCore(coreSrc);
  const pageBlk = extractCore(pageSrc);
  const ok = coreBlk && pageBlk && coreBlk === pageBlk;
  let detail;
  if(!coreBlk) detail = 'core.mjs has no sentinel block';
  else if(!pageBlk) detail = 'index.html has no sentinel block';
  else if(coreBlk===pageBlk) detail = `identical (${coreBlk.split('\n').length} lines, ${coreBlk.length} bytes)`;
  else {
    const cl = coreBlk.split('\n'), pl = pageBlk.split('\n');
    let firstDiff = -1;
    for(let i=0;i<Math.max(cl.length,pl.length);i++){ if(cl[i]!==pl[i]){ firstDiff=i; break; } }
    detail = `DIFFER (core ${coreBlk.length}B / page ${pageBlk.length}B) first diff at block line ${firstDiff+1}`;
  }
  ck('BYTE-TWIN: core block in index.html is byte-identical to core.mjs', ok, detail);
}

/* ── report ── */
for(const r of results){
  console.log(`${r.ok ? '✓' : '✗'} ${r.name}\n    ${r.detail}`);
}
const pass = results.length - failed;
console.log(`\n${pass}/${results.length} proven` + (failed ? ` — ${failed} FAILED` : ' — all green'));
process.exit(failed ? 1 : 0);
