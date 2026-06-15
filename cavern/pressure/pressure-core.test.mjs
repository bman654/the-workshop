// ============================================================================
//  WHERE PRESSURE COMES FROM — Node twin of the new-math core.
//  Run:  node cavern/pressure/pressure-core.test.mjs
//
//  Re-proves the four rungs headless and adds the Node-only guards the in-page
//  pill can't run: the BYTE-TWIN parity for BOTH inlined cores (the MB-CORE slice
//  is the Maxwell–Boltzmann gas's, the PRESSURE-CORE slice is this module's), the
//  ANTI-CIRCULARITY grep (this file defines NO collision primitive), and the
//  REAL dimensionless cross — it IMPORTS pressure() from engine-room/carnot/
//  core.mjs (the actual engine's law, R hardcoded inside it) and asserts
//  Z_carnot ≡ 1 against the genuine function, not a local copy.
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  wallImpulse, makePressureMeter, idealPressure2D, idealZ, zCarnot,
  rng, sampleMB, kT_from, speeds,
} from './pressure-core.mjs';
import { pressure as carnotPressureReal, R_GAS as R_GAS_REAL } from '../../engine-room/carnot/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
function check(name, cond, info){
  total++;
  if (cond){ pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end){
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

// ── A headless hard-disc run shared by Rung 3 & 4 (the page inlines the same shape). ──
function packGas(N, kT, W, H, rand){
  const phi=0.003, A=W*H, R=Math.sqrt(phi*A/(N*Math.PI));
  const cols=Math.ceil(Math.sqrt(N*W/H)), rows=Math.ceil(N/cols);
  const cw=W/cols, chh=H/rows;
  const x=[],y=[],vx=[],vy=[]; let k=0;
  const vels=sampleMB(N, kT, rand);
  for(let gy=0; gy<rows && k<N; gy++) for(let gx=0; gx<cols && k<N; gx++){
    let px=(gx+0.5)*cw+(rand()-0.5)*cw*0.25, py=(gy+0.5)*chh+(rand()-0.5)*chh*0.25;
    px=Math.max(R,Math.min(W-R,px)); py=Math.max(R,Math.min(H-R,py));
    x.push(px); y.push(py); vx.push(vels[k][0]); vy.push(vels[k][1]); k++;
  }
  return {x,y,vx,vy,R,N:k};
}
function resolve(g,W,H){
  const n=g.N,R=g.R,x=g.x,y=g.y,vx=g.vx,vy=g.vy,d=2*R,d2=d*d;
  const span=Math.max(W,H), gcell=Math.max(d, span/Math.max(1,Math.floor(span/(d*1.2)))), inv=1/gcell, grid={};
  for(let i=0;i<n;i++){ const kk=Math.floor(x[i]*inv)+','+Math.floor(y[i]*inv); (grid[kk]||(grid[kk]=[])).push(i); }
  for(let i=0;i<n;i++){
    const cx=Math.floor(x[i]*inv), cy=Math.floor(y[i]*inv);
    for(let ax=-1;ax<=1;ax++) for(let ay=-1;ay<=1;ay++){
      const cell=grid[(cx+ax)+','+(cy+ay)]; if(!cell) continue;
      for(const j of cell){ if(j<=i) continue;
        const dx=x[j]-x[i], dy=y[j]-y[i], dist2=dx*dx+dy*dy;
        if(dist2<d2 && dist2>1e-12){
          const dist=Math.sqrt(dist2), nx=dx/dist, ny=dy/dist, ov=d-dist;
          x[i]-=nx*ov*0.5; y[i]-=ny*ov*0.5; x[j]+=nx*ov*0.5; y[j]+=ny*ov*0.5;
          // equal-mass exchange along n̂ (same rule M–B's collideEqual implements)
          const dvx=vx[i]-vx[j], dvy=vy[i]-vy[j], dot=dvx*nx+dvy*ny;
          if(dot<0){ const jx=dot*nx, jy=dot*ny; vx[i]-=jx; vy[i]-=jy; vx[j]+=jx; vy[j]+=jy; }
        }
      }
    }
  }
}
function runSim({seed,N,T,W,tRun,teeth}){
  const H=W, base=T, rand=rng(seed);
  const g=packGas(N, 0.5*base*base, W, H, rand);
  const meter=makePressureMeter(W,H);
  const vels=[]; for(let i=0;i<g.N;i++) vels.push([g.vx[i],g.vy[i]]);
  const kT=kT_from(vels), Plaw=idealPressure2D(g.N,kT,W*H);
  const IMP = teeth==='half' ? 1 : 2;
  const dt=0.01, steps=Math.round(tRun/dt);
  const marks=[Math.round(steps*0.25),Math.round(steps*0.5),Math.round(steps*0.75),steps];
  const residuals=[]; let mi=0;
  for(let t=1;t<=steps;t++){
    const n=g.N,R=g.R,x=g.x,y=g.y,vx=g.vx,vy=g.vy;
    let maxV=0; for(let i=0;i<n;i++){ const sp=Math.hypot(vx[i],vy[i]); if(sp>maxV)maxV=sp; }
    let sub=Math.min(8, Math.max(1, Math.ceil(maxV*dt/(R*0.7)))); const hh=dt/sub;
    for(let s=0;s<sub;s++){
      for(let i=0;i<n;i++){
        x[i]+=vx[i]*hh; y[i]+=vy[i]*hh;
        if(x[i]<R){ x[i]=R; if(vx[i]<0){ meter.impulseSum+=IMP*Math.abs(vx[i]); vx[i]=-vx[i]; } }
        else if(x[i]>W-R){ x[i]=W-R; if(vx[i]>0){ meter.impulseSum+=IMP*Math.abs(vx[i]); vx[i]=-vx[i]; } }
        if(y[i]<R){ y[i]=R; if(vy[i]<0){ meter.impulseSum+=IMP*Math.abs(vy[i]); vy[i]=-vy[i]; } }
        else if(y[i]>H-R){ y[i]=H-R; if(vy[i]>0){ meter.impulseSum+=IMP*Math.abs(vy[i]); vy[i]=-vy[i]; } }
      }
      resolve(g,W,H); meter.advance(hh);
    }
    if(mi<marks.length && t===marks[mi]){ residuals.push(Math.abs(meter.P()-Plaw)/Plaw); mi++; }
  }
  return { residuals, Zfinal: meter.P()*(W*H)/(g.N*kT), Plaw, P:meter.P() };
}

console.log('\n— Rung 1: the machine-exact atom (2m|v⊥|, and NOT m|v⊥|) —');
{
  const rand=rng(31); let worst=0, worstHalf=0, allDiffer=true;
  for(let t=0;t<5000;t++){
    const v=rand()*4-2, imp=wallImpulse(v);
    worst=Math.max(worst, Math.abs(imp-2*Math.abs(v)));
    worstHalf=Math.max(worstHalf, Math.abs(imp-Math.abs(v)));
    if(Math.abs(v)>1e-9 && imp===Math.abs(v)) allDiffer=false;
  }
  check('wallImpulse(v) === 2|v| to 1e-12 over 5000 v⊥', worst<1e-12, 'max err = '+worst.toExponential(2));
  check('…and wallImpulse is NOT |v| (the ½-teeth twin)', allDiffer && worstHalf>0.3, 'gap from ½-answer ≈ '+worstHalf.toFixed(2));
}

console.log('\n— Rung 2: the virial identity is EXACT on a thermal velocity SET (zero sim noise) —');
{
  const W=1.0,H=1.0,A=W*H; let worst=0, worstKT=0;
  for(let trial=0;trial<6;trial++){
    const rand=rng(100+trial), N=300, kTset=0.7+0.4*trial;
    const vels=sampleMB(N,kTset,rand), kTmeas=kT_from(vels);
    const Plaw=idealPressure2D(N,kTmeas,A);
    worst=Math.max(worst, Math.abs(Plaw*A - N*kTmeas));
    const sp=speeds(vels); let half=0; for(let i=0;i<N;i++) half+=0.5*sp[i]*sp[i]; half/=N;
    worstKT=Math.max(worstKT, Math.abs(kTmeas-half));
  }
  check('P·A/N === kT exact on a thermal set (1e-13)', worst<1e-13, 'max |P·A − N·kT| = '+worst.toExponential(2));
  check('kT_from === ⟨½v²⟩ (the temperature the bell is fitted to)', worstKT<1e-13, 'max err = '+worstKT.toExponential(2));
}

console.log('\n— Rung 3: live convergence — residual reported, shrinking, never "perfect" —');
{
  const r=runSim({seed:2024,N:300,T:1.0,W:1.0,tRun:60,teeth:'off'});
  const endRes=r.residuals[r.residuals.length-1], qRes=r.residuals[0];
  check('live wall count converges onto N·kT/A (residual < 2%)', endRes<0.02, 'Z='+r.Zfinal.toFixed(4)+' → residual '+(endRes*100).toFixed(2)+'%');
  check('…and the residual SHRINKS over the run', endRes < qRes+0.012, 'residual ¼→1: '+(qRes*100).toFixed(2)+'% → '+(endRes*100).toFixed(2)+'%');
}

console.log('\n— Rung 4: the dimensionless cross — Z both ways (Carnot IMPORTED) —');
{
  // The REAL pressure() from engine-room/carnot/core.mjs (R hardcoded in ITS body).
  let worst=0;
  for(let t=0;t<200;t++){
    const rand=rng(7+t), n=0.5+rand()*3, T=200+rand()*400, V=0.5+rand()*3;
    worst=Math.max(worst, Math.abs(zCarnot(carnotPressureReal, R_GAS_REAL, n, T, V) - 1));
  }
  check('Z_carnot = pressure(n,T,V)·V/(n·R·T) === 1 to 1e-15 — using the IMPORTED engine law', worst<1e-15, 'max |Z−1| = '+worst.toExponential(2));

  // and that a LITERAL pressure(N,kT,A) is off by exactly R (the trap the cross avoids).
  const N=200, kT=0.875, A=1.0;
  const literal=carnotPressureReal(N,kT,A), truth=idealPressure2D(N,kT,A);
  check('a LITERAL pressure(N,kT,A) is off the true N·kT/A by exactly R (why the cross is dimensionless)',
        Math.abs(literal/truth - R_GAS_REAL) < 1e-9, 'pressure(N,kT,A)/(N·kT/A) = '+(literal/truth).toFixed(4)+' = R');

  const r=runSim({seed:777,N:320,T:1.2,W:1.0,tRun:60,teeth:'off'});
  check('Z_sim = P_wall·A/(N·kT) → 1 to ≲1% off the wall count', Math.abs(r.Zfinal-1)<0.02, 'Z_sim = '+r.Zfinal.toFixed(4));
}

console.log('\n— The teeth break the law (the negative control fires) —');
{
  const honest=runSim({seed:55,N:300,T:1.0,W:1.0,tRun:50,teeth:'off'});
  const half=runSim({seed:55,N:300,T:1.0,W:1.0,tRun:50,teeth:'half'});
  check('½-count teeth: Z_sim snaps to ~0.5 (the law BREAKS)', Math.abs(half.Zfinal-0.5)<0.03, 'Z_sim(half) = '+half.Zfinal.toFixed(4)+'  vs honest '+honest.Zfinal.toFixed(4));
}

console.log('\n— Anti-circularity (this bench owns ONLY the wall-tally math) —');
{
  const src=readFileSync(join(__dir,'pressure-core.mjs'),'utf8');
  const noColl=!/function\s+collideEqual/.test(src);
  const noRng=!/function\s+rng/.test(src);
  const noSampler=!/function\s+sampleMB/.test(src);
  const importsCore=/import\s*\{[^}]*\}\s*from\s*['"]\.\.\/maxwell-boltzmann\/mb-core\.mjs['"]/.test(src);
  check('anti-circularity: pressure-core.mjs defines NO collideEqual / rng / sampleMB, and IMPORTS them from mb-core.mjs',
        noColl && noRng && noSampler && importsCore,
        'no collideEqual='+noColl+' · no rng='+noRng+' · no sampleMB='+noSampler+' · imports core='+importsCore);
}

console.log('\n— Byte-twin parity (both inlined cores === their sources, char-for-char) —');
{
  const BEGIN='// ===== MB CORE (inlined byte-twin) BEGIN =====', END='// ===== MB CORE END =====';
  const mbMod=readFileSync(join(__dir,'..','maxwell-boltzmann','mb-core.mjs'),'utf8');
  const page=readFileSync(join(__dir,'index.html'),'utf8');
  const mbModSlice=sliceBetween(mbMod,BEGIN,END).replace(/^(\s*)export function /gm,'$1function ');
  const pageMb=sliceBetween(page,BEGIN,END);
  check('MB-CORE byte-twin: this page\'s MB-CORE === mb-core.mjs (export-stripped) — same collision engine as the M–B gas',
        mbModSlice!=null && pageMb!=null && mbModSlice===pageMb,
        mbModSlice===pageMb ? 'slice '+pageMb.length+' chars identical' : 'DRIFT');
}
{
  const BEGIN='// ===== PRESSURE CORE (inlined byte-twin) BEGIN =====', END='// ===== PRESSURE CORE END =====';
  const prMod=readFileSync(join(__dir,'pressure-core.mjs'),'utf8');
  const page=readFileSync(join(__dir,'index.html'),'utf8');
  const prModSlice=sliceBetween(prMod,BEGIN,END);
  const pagePr=sliceBetween(page,BEGIN,END);
  check('PRESSURE-CORE byte-twin: this page\'s PRESSURE-CORE === pressure-core.mjs, char-for-char',
        prModSlice!=null && pagePr!=null && prModSlice===pagePr,
        prModSlice===pagePr ? 'slice '+pagePr.length+' chars identical' : 'DRIFT (mod '+(prModSlice&&prModSlice.length)+' vs page '+(pagePr&&pagePr.length)+')');
}
{
  // the page's local carnotPressure literal must match the IMPORTED engine R_GAS
  const page=readFileSync(join(__dir,'index.html'),'utf8');
  const m=page.match(/var R_GAS\s*=\s*([0-9.]+)\s*;/);
  const pageR=m?parseFloat(m[1]):NaN;
  check('the page\'s R_GAS literal === the engine\'s exported R_GAS (the local carnotPressure can\'t drift)',
        Math.abs(pageR-R_GAS_REAL)<1e-9, 'page R_GAS='+pageR+'  engine R_GAS='+R_GAS_REAL);
}

console.log('\n—— Where Pressure Comes From · Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
