// The PAYOFF-LIVENESS TWIN for "In the Round" (headless, Node-runnable).
// Claim-free room — it proves no theorem. Its payoff is that you TURN it and it
// reads as true depth: the near ring eclipses the far, the orbit really moves the
// view, parallax is real. This twin drives the room's OWN real entry functions —
// the SAME scene.buildScene() the page renders and the SAME core.applyDrag() the
// pointer handler calls — NEVER a canvas pointer event (headless can't deliver
// one). Every assertion fires on the live path. Run: `node in-the-round/liveness.test.mjs`.
//
//   (1) UNFORKED IDENTITY  — project(p,{...,roll:0}) === vantage projectNorm, machine-ε.
//   (2) DRAG ORBITS        — applyDrag() moves the rendered view (a band's screen centroid
//                            at yaw θ ≠ at θ+Δ), on the REAL scene.
//   (3) BAND OCCLUDES       — off the real DEPTH-SORTED draw list, a NEAR ring band covers a
//                            FAR one; occludedAt() returns the near band (front wins), and the
//                            two covered faces belong to DIFFERENT rings (a genuine eclipse).
//   (4) PARALLAX IS REAL    — under a fixed yaw swing the NEAR ring's band out-displaces the FAR.
//   (5) reduced-motion gates the idle bead-drift;  (6) the shared mute is honored.
//   (G) BYTE-PARITY         — the core inlined into index.html === tools/scene3d/core.mjs body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FOCAL, project, applyDrag, render, occludedAt } from '../tools/scene3d/core.mjs';
import { projectNorm as vProject } from '../vantage/core.mjs';
import { buildScene, RINGS, beadDrift } from './scene.mjs';

let pass=0, fail=0; const fails=[];
function ck(name, ok){ if(ok) pass++; else { fail++; fails.push(name); } }

const MOCK = { createRadialGradient:()=>({addColorStop(){}}), save(){}, restore(){},
  beginPath(){}, moveTo(){}, lineTo(){}, arc(){}, stroke(){}, closePath(){}, fill(){},
  fillRect(){}, set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){},
  set lineCap(v){}, set lineJoin(v){}, set globalAlpha(v){}, set shadowColor(v){}, set shadowBlur(v){} };
const VP = { cx:400, cy:400, scale:240 };
const STATE = { phase: RINGS.map(()=>0), sunPhase: 0.9 };
const POSE = { yaw:0.7, pitch:-0.32, roll:0, dolly:4.4 };

function centroid(sp){ let x=0,y=0; for(const p of sp){ x+=p.x; y+=p.y; } return {x:x/sp.length, y:y/sp.length}; }

// ── (1) UNFORKED IDENTITY ──
ck('(1) unforked: project(p,{...,roll:0}) === vantage projectNorm to machine-ε (FOCAL='+FOCAL+')', (()=>{
  let worst=0; const C={yaw:0.74,pitch:0.22,dolly:5.2};
  for(const p of [[0.3,-0.7,1.1],[-1.2,0.4,-0.6],[0.05,0.9,-1.4]]){
    const a=project(p,{...C,roll:0}), b=vProject(p,C);
    worst=Math.max(worst, Math.abs(a.x-b[0]), Math.abs(a.y-b[1]), Math.abs(a.depth-b[2]));
  }
  return worst<1e-12;
})());

// ── (2) DRAG ORBITS the real scene ──
ck('(2) applyDrag orbits: a band centroid at yaw θ differs from θ+Δ (rendered view moved)', (()=>{
  const camA={...POSE};
  const a=render(MOCK, buildScene(camA, STATE).scene, camA, VP);
  const bandA = [...a].reverse().find(d=>d.it.ri!==undefined);   // the nearest band face
  const cA = centroid(bandA.sp);
  const camB={...POSE};
  applyDrag(camB, 90, 0);                                         // a real 90px rightward drag
  const b=render(MOCK, buildScene(camB, STATE).scene, camB, VP);
  // the SAME quad object is rebuilt each frame, so track the near ring by its .ri
  const anyB = [...b].reverse().find(d=>d.it.ri===bandA.it.ri);
  const cB = anyB ? centroid(anyB.sp) : null;
  return camB.yaw!==camA.yaw && cB && (Math.abs(cB.x-cA.x)>2 || Math.abs(cB.y-cA.y)>2);
})());

// ── (3) a NEAR band OCCLUDES a FAR band, off the real sorted list ──
ck('(3) occludedAt: a near ring band covers a far one; front wins; different rings (eclipse)', (()=>{
  const cam={...POSE};
  const sorted=render(MOCK, buildScene(cam, STATE).scene, cam, VP);
  // scan band faces (have .ri), find a screen point covered by ≥2 bands of DIFFERENT rings
  const bands=sorted.filter(d=>d.it.ri!==undefined);
  for(let i=sorted.length-1;i>=0;i--){                            // start from the nearest
    const d=sorted[i]; if(d.it.ri===undefined) continue;
    const c=centroid(d.sp);
    const covers=bands.filter(b=> pointIn(b.sp, c.x, c.y));
    const rings=new Set(covers.map(b=>b.it.ri));
    if(covers.length>=2 && rings.size>=2){
      const hit=occludedAt(sorted, c.x, c.y);
      // the occluder must be the NEAREST covering face (max depth-rank at the top)
      const nearest=covers.reduce((m,b)=> b.depth<m.depth ? b : m, covers[0]);
      if(hit===nearest.it) return true;
    }
  }
  return false;
})());
function pointIn(sp,x,y){ let c=false; for(let i=0,j=sp.length-1;i<sp.length;j=i++){
  const xi=sp[i].x,yi=sp[i].y,xj=sp[j].x,yj=sp[j].y;
  if(((yi>y)!==(yj>y)) && (x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; }

// ── (4) PARALLAX IS REAL on the real rings ──
ck('(4) parallax: under a yaw swing the NEAR ring band out-displaces the FAR ring band', (()=>{
  const camA={...POSE}, camB={...POSE}; applyDrag(camB, 40, 0);
  const A=render(MOCK, buildScene(camA, STATE).scene, camA, VP);
  const B=render(MOCK, buildScene(camB, STATE).scene, camB, VP);
  // nearest and farthest band faces in A (sorted far→near ⇒ [0]=far, [last]=near)
  const bandsA=A.filter(d=>d.it.ri!==undefined);
  const nearF=bandsA[bandsA.length-1], farF=bandsA[0];
  // the SAME physical quad is rebuilt each frame — match it by (ri, seg)
  const inB=f=>B.find(d=>d.it.ri===f.it.ri && d.it.seg===f.it.seg);
  const near=inB(nearF), far=inB(farF);
  if(!near||!far) return false;
  const dispN=Math.hypot(centroid(near.sp).x-centroid(nearF.sp).x, centroid(near.sp).y-centroid(nearF.sp).y);
  const dispF=Math.hypot(centroid(far.sp).x-centroid(farF.sp).x, centroid(far.sp).y-centroid(farF.sp).y);
  return nearF.depth < farF.depth && dispN > dispF*1.12;
})());

// ── (5) reduced-motion gates idle drift ; (6) mute honored ──
ck('(5) reduced-motion: the idle bead-drift is 0 (nothing moves unbidden)', beadDrift(true,false)===0);
ck('(6) the shared mute stills the living drift too', beadDrift(false,true)===0 && beadDrift(false,false)>0);

// ── (G) BYTE-PARITY: inlined core in index.html === tools/scene3d/core.mjs body ──
const here = dirname(fileURLToPath(import.meta.url));
const BEGIN='// ===== SCENE3D CORE (byte-identical to core.mjs) =====';
const END  ='// ===== END SCENE3D CORE =====';
function region(t){ const i=t.indexOf(BEGIN), j=t.indexOf(END); if(i<0||j<0||j<i) return null; return t.slice(i+BEGIN.length,j); }
function norm(s){ return s.split('\n').map(l=>l.replace(/^\s+/,'').replace(/\s+$/,'')).filter(l=>l.length).join('\n'); }
let coreR=null, pageR=null;
try{ coreR=region(readFileSync(join(here,'../tools/scene3d/core.mjs'),'utf8')); }catch{}
try{ pageR=region(readFileSync(join(here,'index.html'),'utf8')); }catch{}
ck('(G) SCENE3D CORE sentinels present in core.mjs', !!coreR);
ck('(G) SCENE3D CORE sentinels present in index.html (forge-inlined)', !!pageR);
ck('(G) inlined core === core.mjs body (byte-identical, indentation-normalised)',
   !!coreR && !!pageR && norm(coreR)===norm(pageR));

// ── report ──
console.log('In the Round — liveness.test.mjs (payoff-liveness twin, claim-free)');
console.log('  the payoff FIRES on the live path: drag orbits · a band eclipses a band · parallax is real');
console.log('  byte-parity: '+(coreR&&pageR&&norm(coreR)===norm(pageR)?'IDENTICAL':(pageR?'DRIFTED':'index.html not built yet')));
console.log((fail===0?'  ✓ ':'  ✗ ')+pass+'/'+(pass+fail)+' checks pass');
if(fail){ console.log('  FAILING:\n   '+fails.join('\n   ')); process.exit(1); }
