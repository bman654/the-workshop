// Node twin for the scene3d core (the reusable 3-D engine behind "In the Round").
// Zero-dep, DOM-free.  Run: `node tools/scene3d/core.test.mjs`  (exit 0 = green).
//
//   (U)  UNFORKED IDENTITY — project(p,{...,roll:0}) === vantage projectNorm to
//        machine-ε, at the REAL vantage FOCAL=2.4. The Vantages camera is the
//        roll=0 slice of this one; roll is a live extra DOF that twists the plane.
//   (S)  SEG FIXTURE — a seg-only scene renders into the sorted list (the 'seg'
//        kind is carried); depth-order is far→near.
//   (F)  FACE FIXTURE — a face scene backface-culls, sorts far→near, and
//        occludedAt() finds the nearest covering face (the 'face' kind is carried).
//        Two kinds, ONE engine — "it generalises", proven by tests not by clutter.
//   (D)  applyDrag ORBITS — the shared mutation both a handler and this twin call;
//        a marker vertex's project() coord at yaw θ differs from θ+Δ.
//   (P)  PARALLAX IS REAL — under a fixed yaw swing a NEAR marker's screen
//        displacement exceeds a FAR marker's (depth is real, not painted).

import {
  FOCAL, project, applyDrag, toScreen, render, occludedAt,
} from './core.mjs';
import { projectNorm as vProject } from '../../vantage/core.mjs';

let pass=0, fail=0; const fails=[];
function ck(name, ok){ if(ok) pass++; else { fail++; fails.push(name); } }

// a mock 2-D context so shade() closures run headless without a canvas
const MOCK = { createRadialGradient:()=>({addColorStop(){}}), save(){}, restore(){},
  beginPath(){}, moveTo(){}, lineTo(){}, arc(){}, stroke(){}, closePath(){}, fill(){},
  fillRect(){}, set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){},
  set lineCap(v){}, set lineJoin(v){}, set globalAlpha(v){}, set shadowColor(v){}, set shadowBlur(v){} };
const VP = { cx:300, cy:300, scale:200 };

// ── (U) UNFORKED IDENTITY vs vantage, at FOCAL=2.4 ──
ck('(U) FOCAL is the real vantage constant 2.4 (not a fork)', FOCAL === 2.4);
ck('(U) project(p,{...,roll:0}) === vantage projectNorm to machine-ε', (()=>{
  let worst=0;
  const poses=[{yaw:0.74,pitch:0.22,dolly:5.2},{yaw:-1.1,pitch:0.6,dolly:4.0},{yaw:2.3,pitch:-0.4,dolly:7.1}];
  const pts=[[0.3,-0.7,1.1],[-1.2,0.4,-0.6],[0.05,0.9,-1.4],[1.5,-1.1,0.3]];
  for(const C of poses) for(const p of pts){
    const a=project(p,{...C,roll:0}), b=vProject(p,C);
    worst=Math.max(worst, Math.abs(a.x-b[0]), Math.abs(a.y-b[1]), Math.abs(a.depth-b[2]));
  }
  return worst < 1e-12;
})());
ck('(U) roll is a LIVE extra DOF — a nonzero roll twists the image plane', (()=>{
  const p=[0.8,0,0];
  const a=project(p,{yaw:0,pitch:0,roll:0,dolly:6});
  const b=project(p,{yaw:0,pitch:0,roll:Math.PI/2,dolly:6});
  return Math.abs(a.y-b.y)>0.1 && Math.abs(a.depth-b.depth)<1e-12;   // plane twists, depth invariant
})());

// ── (S) SEG FIXTURE — a seg-only scene ──
ck('(S) a seg-only scene renders into the sorted list (the seg kind is carried)', (()=>{
  const near={k:'seg', a:[-.3,-1.0,0], b:[.3,-1.0,0], shade:()=>{}};
  const far ={k:'seg', a:[-.3, 1.5,0], b:[.3, 1.5,0], shade:()=>{}};
  const sorted=render(MOCK,[near,far],{yaw:0,pitch:0,roll:0,dolly:6},VP);
  // sorted far→near ⇒ the near seg (small +Y ⇒ small depth) paints last
  return sorted.length===2 && sorted[sorted.length-1].it===near && sorted[0].it===far;
})());

// ── (F) FACE FIXTURE — backface cull, far→near, occlusion query ──
ck('(F) backface cull drops an away-wound face', (()=>{
  const facing={k:'face',cull:true,pts:[[-.3,-.3,1],[.3,-.3,1],[0,.3,1]],shade:()=>{}};
  const away  ={k:'face',cull:true,pts:[[-.3,-.3,1],[0,.3,1],[.3,-.3,1]],shade:()=>{}}; // reversed
  const sorted=render(MOCK,[facing,away],{yaw:0,pitch:0,roll:0,dolly:6},VP);
  return sorted.length===1 && sorted[0].it===facing;
})());
ck('(F) occludedAt finds the NEAREST covering face (front wins) off the sorted list', (()=>{
  const near={k:'face',cull:false,pts:[[-.5,-1.0,-.5],[.5,-1.0,-.5],[.5,-1.0,.5],[-.5,-1.0,.5]],shade:()=>{}};
  const far ={k:'face',cull:false,pts:[[-.5, 1.5,-.5],[.5, 1.5,-.5],[.5, 1.5,.5],[-.5, 1.5,.5]],shade:()=>{}};
  const sorted=render(MOCK,[far,near],{yaw:0,pitch:0,roll:0,dolly:6},VP);
  return occludedAt(sorted, VP.cx, VP.cy) === near;   // the near face is the occluder at centre
})());
ck('(F) both kinds ride ONE sorted list together', (()=>{
  const seg ={k:'seg', a:[-.3,-.5,0], b:[.3,-.5,0], shade:()=>{}};
  const face={k:'face',cull:false,pts:[[-.5,.8,-.5],[.5,.8,-.5],[.5,.8,.5],[-.5,.8,.5]],shade:()=>{}};
  const sorted=render(MOCK,[seg,face],{yaw:0,pitch:0,roll:0,dolly:6},VP);
  const kinds=new Set(sorted.map(d=>d.it.k));
  return sorted.length===2 && kinds.has('seg') && kinds.has('face');
})());

// ── (D) applyDrag ORBITS the camera ──
ck('(D) applyDrag mutates yaw/pitch; a marker vertex projects to a NEW coord', (()=>{
  const cam={yaw:0.4,pitch:0.1,roll:0,dolly:6};
  const marker=[1.0,0.2,0.3];
  const before=project(marker,cam);
  applyDrag(cam, 60, 0);                     // a rightward drag of 60px
  const after=project(marker,cam);
  return Math.abs(after.x-before.x)>0.05 || Math.abs(after.y-before.y)>0.05;
})());
ck('(D) applyDrag clamps pitch to ±PITCH_LIMIT (no gimbal flip)', (()=>{
  const cam={yaw:0,pitch:0,roll:0,dolly:6};
  applyDrag(cam, 0, 1e6);                     // a huge downward drag
  return cam.pitch <= 1.4500001 && cam.pitch >= 1.44;
})());

// ── (P) PARALLAX IS REAL — near marker moves more than far under a yaw swing ──
ck('(P) under a fixed yaw swing, a NEAR marker out-displaces a FAR one', (()=>{
  const camA={yaw:0.0,pitch:0.0,roll:0,dolly:6};
  const camB={yaw:0.25,pitch:0.0,roll:0,dolly:6};
  // at yaw=pitch=0 the depth axis is world-Y: small +y ⇒ near, large +y ⇒ far.
  const nearM=[1.0,-1.8,0.3], farM=[1.0, 1.8,0.3];
  const disp=(m)=>Math.hypot(project(m,camB).x-project(m,camA).x, project(m,camB).y-project(m,camA).y);
  const depthOf=(m)=>Math.min(project(m,camA).depth, project(m,camB).depth);
  // pick whichever is genuinely nearer, assert it moved more (parallax ∝ 1/depth)
  const near = depthOf(nearM)<depthOf(farM) ? disp(nearM) : disp(farM);
  const far  = depthOf(nearM)<depthOf(farM) ? disp(farM)  : disp(nearM);
  return depthOf(nearM)!==depthOf(farM) && near > far * 1.15;
})());

// ── report ──
console.log('scene3d — core.test.mjs');
console.log('  camera: UNFORKED from vantage/core.mjs (FOCAL='+FOCAL+', roll=0 identical)');
console.log('  primitives: seg + face fixtures both carried by one sorted list');
console.log((fail===0?'  ✓ ':'  ✗ ')+pass+'/'+(pass+fail)+' checks pass');
if(fail){ console.log('  FAILING:\n   '+fails.join('\n   ')); process.exit(1); }
