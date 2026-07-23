// ============================================================================
//  THE WEIGHTED LID — Node twin of the moving-wall core.
//  Run:  node cavern/maxwell-boltzmann/lid-core.test.mjs
//
//  Two registers, both headless:
//    (A) PROOF — a real hard-disc gas under a heavy movable lid is stepped with
//        the SAME collideEqual the M–B gas runs, the lid integrated by lidAccel,
//        the side/floor walls thermalised by thermalPerp. It samples the lid's
//        momentum stream and asserts the time-averaged lid pressure balances the
//        load (P·W ≈ L), the virial P·(W·y)/(N·kT) → 1, the isotherm L·y_rest =
//        const over ≥3 loads, P ∝ T at fixed V over ≥3 temperatures, and BOTH
//        neg-controls (freeze → P→0; thermostat-off holds P·V = N·kT along the
//        adiabatic drift), reusing kT_from as ground truth.
//    (C) PAYOFF-LIVENESS — the FELT settle: we drive the REAL lid integrator (not
//        a canvas pointer event), drop a plate programmatically mid-run, and assert
//        the lid state transitions overshoot → bob → rest at the new y_rest = N·kT/L.
//
//  Plus the Node-only guards: the BYTE-TWIN parity for BOTH inlined cores in
//  lid.html (the MB-CORE slice is the collision engine's, the LID-CORE slice is
//  this module's), and the ANTI-CIRCULARITY grep (this file's source defines NO
//  collision primitive). process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  reflectLid, lidAccel, thermalPerp, yRest, idealPressure,
  rng, sampleMB, kT_from, collideEqual, speeds,
} from './lid-core.mjs';
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

// ── A headless hard-disc gas under a movable lid. The page inlines the same shape;
//    the atoms it calls (reflectLid / lidAccel / thermalPerp) are byte-twinned. The
//    gas is kept DILUTE (disc radius R ⇒ packing fraction ≈ 2–4% across the working
//    height band) so the ideal law it is checked against holds to ≲1%. ──
function packGas(N, kT, W, yTop, R, rand){
  const cols=Math.ceil(Math.sqrt(N*W/yTop)), rows=Math.ceil(N/cols);
  const cw=W/cols, chh=yTop/rows;
  const x=[],y=[],vx=[],vy=[]; let k=0;
  const vels=sampleMB(N, kT, rand);
  for(let gy=0; gy<rows && k<N; gy++) for(let gx=0; gx<cols && k<N; gx++){
    let px=(gx+0.5)*cw+(rand()-0.5)*cw*0.25, py=(gy+0.5)*chh+(rand()-0.5)*chh*0.25;
    px=Math.max(R,Math.min(W-R,px)); py=Math.max(R,Math.min(yTop-R,py));
    x.push(px); y.push(py); vx.push(vels[k][0]); vy.push(vels[k][1]); k++;
  }
  return {x,y,vx,vy,R,N:k};
}
function resolve(g,W){
  const n=g.N,R=g.R,x=g.x,y=g.y,vx=g.vx,vy=g.vy,d=2*R,d2=d*d;
  const gcell=Math.max(d, W/Math.max(1,Math.floor(W/(d*1.2)))), inv=1/gcell;
  const grid=new Map();
  for(let i=0;i<n;i++){ const kk=(Math.floor(x[i]*inv)+1)*100000+(Math.floor(y[i]*inv)+1); let a=grid.get(kk); if(!a){a=[];grid.set(kk,a);} a.push(i); }
  for(let i=0;i<n;i++){
    const cx=Math.floor(x[i]*inv)+1, cy=Math.floor(y[i]*inv)+1;
    for(let ax=-1;ax<=1;ax++) for(let ay=-1;ay<=1;ay++){
      const cell=grid.get((cx+ax)*100000+(cy+ay)); if(!cell) continue;
      for(let c=0;c<cell.length;c++){ const j=cell[c]; if(j<=i) continue;
        const dx=x[j]-x[i], dy=y[j]-y[i], dist2=dx*dx+dy*dy;
        if(dist2<d2 && dist2>1e-12){
          const dist=Math.sqrt(dist2), nx=dx/dist, ny=dy/dist, ov=d-dist;
          x[i]-=nx*ov*0.5; y[i]-=ny*ov*0.5; x[j]+=nx*ov*0.5; y[j]+=ny*ov*0.5;
          const v1=[vx[i],vy[i]], v2=[vx[j],vy[j]];       // the IMPORTED collideEqual, UNTOUCHED
          if(collideEqual(v1,v2,nx,ny)){ vx[i]=v1[0]; vy[i]=v1[1]; vx[j]=v2[0]; vy[j]=v2[1]; }
        }
      }
    }
  }
}
function kTof(g){ let e=0; for(let i=0;i<g.N;i++) e+=0.5*(g.vx[i]*g.vx[i]+g.vy[i]*g.vy[i]); return e/g.N; }
// One physics frame. Mutates the lid state `S` and the gas `g`; returns the lid
// impulse tallied this frame. `S.lock` pins the lid (the fixed-V sweep).
function stepLid(g, S, dt, W, rand){
  const n=g.N, R=g.R, x=g.x, y=g.y, vx=g.vx, vy=g.vy;
  let maxV2=0; for(let i=0;i<n;i++){ const s2=vx[i]*vx[i]+vy[i]*vy[i]; if(s2>maxV2)maxV2=s2; }
  let sub=Math.min(10, Math.max(1, Math.ceil((Math.sqrt(maxV2)+Math.abs(S.vLid))*dt/(R*0.7)))); const h=dt/sub;
  let imp=0;
  for(let s=0;s<sub;s++){
    if(!S.lock){ S.yLid += S.vLid*h; if(S.yLid<S.yMin){ S.yLid=S.yMin; if(S.vLid<0)S.vLid=0; } else if(S.yLid>S.yMax){ S.yLid=S.yMax; if(S.vLid>0)S.vLid=0; } }
    for(let i=0;i<n;i++){
      x[i]+=vx[i]*h; y[i]+=vy[i]*h;
      // side walls (x): thermal or specular
      if(x[i]<R){ x[i]=R; if(vx[i]<0) vx[i]= thermalPerp(vx[i], S.Tset, S.thermostat, rand); }
      else if(x[i]>W-R){ x[i]=W-R; if(vx[i]>0) vx[i]=-thermalPerp(vx[i], S.Tset, S.thermostat, rand); }
      // floor (y=0): thermal or specular
      if(y[i]<R){ y[i]=R; if(vy[i]<0) vy[i]= thermalPerp(vy[i], S.Tset, S.thermostat, rand); }
      // the moving lid (top): reflect in the lid frame, tally the momentum handed up
      const yl=S.yLid;
      if(y[i]>yl-R){ if(vy[i]-S.vLid>0){ const r=reflectLid(vy[i], S.vLid); vy[i]=r[0]; imp+=r[1]; } y[i]=yl-R; }
    }
    resolve(g,W);
  }
  if(S.freeze){ for(let i=0;i<n;i++){ vx[i]*=0.90; vy[i]*=0.90; } }   // a hard-cooled thermostat: the slam
  if(!S.lock){ S.vLid += lidAccel(imp, dt, S.L, S.M)*dt; }
  return imp;
}

// Settle a gas+lid to equilibrium, then average the lid pressure over a window.
function runLid(opts){
  const { seed=1, N=200, W=1.0, L=360, M=5000, Tset=1.0, thermostat=true,
          lock=false, freeze=false, R=0.00489, y0=0.6, yMin=0.04, yMax=1.3,
          dt=0.02, tSettle=22, tMeasure=30 } = opts;
  const rand=rng(seed);
  const g=packGas(N, Tset, W, y0, R, rand);
  const S={ yLid:y0, vLid:0, L, M, Tset, thermostat, lock, freeze, yMin, yMax };
  const nS=Math.round(tSettle/dt), nM=Math.round(tMeasure/dt);
  for(let t=0;t<nS;t++) stepLid(g, S, dt, W, rand);
  let impSum=0, timeSum=0, ySum=0, kTSum=0, cnt=0;
  for(let t=0;t<nM;t++){ impSum += stepLid(g, S, dt, W, rand); timeSum += dt; ySum += S.yLid; if(t%8===0){ kTSum += kTof(g); cnt++; } }
  const P = impSum/(W*timeSum);
  return { P, yRest:ySum/nM, kT:kTSum/cnt, N:g.N, W, yLid:S.yLid, vLid:S.vLid };
}

console.log('\n— (A1) the moving-lid reflection: momentum in, momentum out, energy in the lid frame —');
{
  const rand=rng(31); let worstP=0, worstFrame=0, worstBal=0;
  for(let t=0;t<5000;t++){
    const vLid=rand()*0.4-0.2, vy=vLid+0.01+rand()*3;   // force a closing hit (vy > vLid)
    const [vyN, imp]=reflectLid(vy, vLid);
    worstP=Math.max(worstP, Math.abs((vy - vyN) - imp));               // disc loses exactly what the lid gains
    worstFrame=Math.max(worstFrame, Math.abs((vyN-vLid) + (vy-vLid)));  // reverses in the lid frame
    worstBal=Math.max(worstBal, Math.abs(imp - 2*(vy-vLid)));
  }
  check('reflectLid: disc Δp === −impulse to lid (momentum conserved) to 1e-12', worstP<1e-12, 'max err = '+worstP.toExponential(2));
  check('reflectLid: the disc reverses in the LID frame (elastic mirror) to 1e-12', worstFrame<1e-12, 'max err = '+worstFrame.toExponential(2));
  check('reflectLid: impulse === 2·(vy−vLid) exactly', worstBal<1e-12, 'max err = '+worstBal.toExponential(2));
}

console.log('\n— (A2) at rest the lid pressure BALANCES the load: P·W ≈ L —');
{
  const r=runLid({seed:2024, L:360});
  const bal=Math.abs(r.P*r.W - 360)/360;
  check('time-averaged lid pressure balances the load (P·W ≈ L, ±6%)', bal<0.06, 'P·W = '+(r.P*r.W).toFixed(1)+'  vs L = 360  ('+(bal*100).toFixed(2)+'%)');
  check('the lid settled near y_rest = N·kT/L (±6%)', Math.abs(r.yRest - yRest(r.N, r.kT, 360))/r.yRest < 0.06,
        'y_rest measured '+r.yRest.toFixed(4)+'  predicted '+yRest(r.N, r.kT, 360).toFixed(4));
}

console.log('\n— (A3) the virial at the lid: P·(W·y)/(N·kT) → 1 —');
{
  const r=runLid({seed:88, L:420});
  const Z=r.P*(r.W*r.yRest)/(r.N*r.kT);
  check('Z = P·V/(N·kT) → 1 off the lid momentum stream (±5%)', Math.abs(Z-1)<0.05, 'Z = '+Z.toFixed(4));
}

console.log('\n— (A4) the isotherm the lid draws: L·y_rest = const over ≥3 loads at fixed T —');
{
  const loads=[270, 360, 460];
  const prods=[], zs=[];
  for(let i=0;i<loads.length;i++){
    const r=runLid({seed:400, L:loads[i], y0: Math.max(0.3, Math.min(0.9, 200/loads[i]))});
    prods.push(loads[i]*r.yRest);
    zs.push(r.P*(r.W*r.yRest)/(r.N*r.kT));
  }
  const mean=prods.reduce((a,b)=>a+b,0)/prods.length;
  const spread=Math.max(...prods.map(p=>Math.abs(p-mean)))/mean;
  check('L·y_rest is constant across 3 loads (isotherm, spread < 6%)', spread<0.06,
        'L·y_rest = ['+prods.map(p=>p.toFixed(1)).join(', ')+']  spread '+(spread*100).toFixed(2)+'%');
  check('…and every load holds P·V = N·kT (Z ≈ 1 each)', zs.every(z=>Math.abs(z-1)<0.06), 'Z = ['+zs.map(z=>z.toFixed(3)).join(', ')+']');
}

console.log('\n— (A5) P ∝ T at fixed V: lock the lid, sweep the burner over ≥3 temperatures —');
{
  const yFix=0.55; const temps=[0.6, 1.0, 1.5];
  const ratios=[];
  for(let i=0;i<temps.length;i++){
    const r=runLid({seed:900, L:0, Tset:temps[i], lock:true, y0:yFix, yMin:yFix, yMax:yFix});
    ratios.push(r.P/r.kT);
  }
  const mean=ratios.reduce((a,b)=>a+b,0)/ratios.length;
  const spread=Math.max(...ratios.map(p=>Math.abs(p-mean)))/mean;
  check('P/kT is constant as T sweeps at fixed V (P ∝ T, spread < 6%)', spread<0.06,
        'P/kT = ['+ratios.map(p=>p.toFixed(1)).join(', ')+']  spread '+(spread*100).toFixed(2)+'%');
}

console.log('\n— (neg-control) FREEZE: still the gas, T→0, the lid slams and P→0 —');
{
  const r=runLid({seed:7, L:360, Tset:0, freeze:true, y0:0.6, tSettle:16, tMeasure:16});
  check('frozen gas: lid pressure → 0 (the hammer stops)', r.P*r.W < 6, 'P·W = '+(r.P*r.W).toFixed(2)+'  (vs load 360)');
  check('frozen gas: the lid slams to the floor', r.yLid <= 0.04+1e-9, 'yLid = '+r.yLid.toFixed(4));
}

console.log('\n— (neg-control) THERMOSTAT OFF: specular walls, the lid rides an ADIABAT (P·V = N·kT_current holds) —');
{
  const rand=rng(321), N=200, W=1.0, L=420, M=5000, R=0.00489;
  const g=packGas(N, 1.2, W, 0.55, R, rand);
  const S={ yLid:0.55, vLid:0, L, M, Tset:1.2, thermostat:false, lock:false, freeze:false, yMin:0.04, yMax:1.3 };
  const dt=0.02; for(let t=0;t<Math.round(16/dt);t++) stepLid(g,S,dt,W,rand);  // reach mechanical balance
  const zs=[];
  for(let seg=0; seg<3; seg++){
    let imp=0, tm=0, ys=0, kts=0, c=0;
    for(let t=0;t<Math.round(14/dt);t++){ imp+=stepLid(g,S,dt,W,rand); tm+=dt; ys+=S.yLid; if(t%8===0){ kts+=kTof(g); c++; } }
    const P=imp/(W*tm), y=ys/Math.round(14/dt), kT=kts/c;
    zs.push(P*(W*y)/(N*kT));
  }
  check('thermostat OFF: P·V = N·kT_current holds throughout the adiabatic drift (Z ≈ 1 at 3 times)',
        zs.every(z=>Math.abs(z-1)<0.06), 'Z = ['+zs.map(z=>z.toFixed(3)).join(', ')+']');
}

console.log('\n— (C) PAYOFF-LIVENESS: drop a plate on the REAL integrator → overshoot → bob → rest —');
{
  const rand=rng(2718), N=200, W=1.0, M=5000, Tset=1.0, R=0.00489;
  const L0=280, L1=460;                       // a plate lands: the load jumps
  const g=packGas(N, Tset, W, 0.72, R, rand);
  const S={ yLid:0.72, vLid:0, L:L0, M, Tset, thermostat:true, lock:false, freeze:false, yMin:0.04, yMax:1.3 };
  const dt=0.02;
  for(let t=0;t<Math.round(24/dt);t++) stepLid(g,S,dt,W,rand);   // settle at L0
  const yBefore=S.yLid;
  let kts=0,c=0; for(let t=0;t<Math.round(6/dt);t++){ stepLid(g,S,dt,W,rand); if(t%4===0){ kts+=kTof(g); c++; } }
  const kTnow=kts/c;
  S.L = L1;                                   // ← DROP THE PLATE (the real payoff path)
  const yPredict=yRest(N, kTnow, L1);
  let yMinTraj=Infinity;
  for(let t=0;t<Math.round(20/dt);t++){ stepLid(g,S,dt,W,rand); yMinTraj=Math.min(yMinTraj, S.yLid); }
  let yFinal=0,cf=0; for(let t=0;t<Math.round(12/dt);t++){ stepLid(g,S,dt,W,rand); yFinal+=S.yLid; cf++; } yFinal/=cf;
  check('the plate sinks the lid (new rest is below the old)', yFinal < yBefore-0.02, 'y: '+yBefore.toFixed(3)+' → '+yFinal.toFixed(3));
  check('the lid OVERSHOOTS below its new rest (the bob is real, not scripted)', yMinTraj < yFinal-0.006, 'min '+yMinTraj.toFixed(4)+' < rest '+yFinal.toFixed(4));
  check('the lid RESTS at the new y_rest = N·kT/L within tol', Math.abs(yFinal-yPredict)/yPredict < 0.08, 'rest '+yFinal.toFixed(4)+'  predicted '+yPredict.toFixed(4));
}

console.log('\n— Anti-circularity (the lid core owns ONLY the moving-wall math) —');
{
  const src=readFileSync(join(__dir,'lid-core.mjs'),'utf8');
  const noColl=!/function\s+collideEqual/.test(src);
  const noRng=!/function\s+rng/.test(src);
  const noSampler=!/function\s+sampleMB/.test(src);
  const importsCore=/import\s*\{[^}]*\}\s*from\s*['"]\.\.\/maxwell-boltzmann\/mb-core\.mjs['"]/.test(src)
                 || /import\s*\{[^}]*\}\s*from\s*['"]\.\/mb-core\.mjs['"]/.test(src);
  check('anti-circularity: lid-core.mjs defines NO collideEqual / rng / sampleMB, and IMPORTS them from mb-core.mjs',
        noColl && noRng && noSampler && importsCore,
        'no collideEqual='+noColl+' · no rng='+noRng+' · no sampleMB='+noSampler+' · imports core='+importsCore);
}

console.log('\n— Byte-twin parity (both inlined cores in lid.html === their sources, char-for-char) —');
{
  const BEGIN='// ===== MB CORE (inlined byte-twin) BEGIN =====', END='// ===== MB CORE END =====';
  const mbMod=readFileSync(join(__dir,'mb-core.mjs'),'utf8');
  const page=readFileSync(join(__dir,'lid.html'),'utf8');
  const mbModSlice=sliceBetween(mbMod,BEGIN,END).replace(/^(\s*)export function /gm,'$1function ');
  const pageMb=sliceBetween(page,BEGIN,END);
  check("MB-CORE byte-twin: lid.html's MB-CORE === mb-core.mjs (export-stripped) — the same collision engine as the M–B gas",
        mbModSlice!=null && pageMb!=null && mbModSlice===pageMb,
        mbModSlice===pageMb ? 'slice '+pageMb.length+' chars identical' : 'DRIFT (mod '+(mbModSlice&&mbModSlice.length)+' vs page '+(pageMb&&pageMb.length)+')');
}
{
  const BEGIN='// ===== LID CORE (inlined byte-twin) BEGIN =====', END='// ===== LID CORE END =====';
  const lidMod=readFileSync(join(__dir,'lid-core.mjs'),'utf8');
  const page=readFileSync(join(__dir,'lid.html'),'utf8');
  const lidModSlice=sliceBetween(lidMod,BEGIN,END);
  const pageLid=sliceBetween(page,BEGIN,END);
  check("LID-CORE byte-twin: lid.html's LID-CORE === lid-core.mjs, char-for-char",
        lidModSlice!=null && pageLid!=null && lidModSlice===pageLid,
        lidModSlice===pageLid ? 'slice '+pageLid.length+' chars identical' : 'DRIFT (mod '+(lidModSlice&&lidModSlice.length)+' vs page '+(pageLid&&pageLid.length)+')');
}

console.log('\n—— The Weighted Lid · Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
