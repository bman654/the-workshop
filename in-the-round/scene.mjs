// ============================================================================
//  in-the-round/scene.mjs — the ARMILLARY as geometry. Builds the estate's
//  founding orbitable solid out of the scene3d core's {seg,face} primitives:
//  opaque brass BANDS (annulus quads, never wire strokes — that is what makes the
//  eclipses honest AND what makes it beautiful), a gilt terrella at the heart,
//  a bead-sun on the ecliptic, pole beads, and a polar-axis rod.
//
//  DOM-free: every shade() closure takes the ctx handed in by render() — the room
//  draws it, the Node twin renders it through a mock ctx. The room forge-inlines
//  BOTH this file and ../tools/scene3d/core.mjs; the liveness twin imports the
//  same two modules, so the scene the twin proves IS the scene you orbit.
//
//  Astronomy made touchable, no numbers ever: named reference rings on the real
//  obliquity, an ecliptic you can sight edge-on or face-on. Claim-free delight.
// ============================================================================

// ===== SCENE (armillary geometry) =====
"use strict";

import { project, toScreen } from '../tools/scene3d/core.mjs';

// ---- vectors ----
const V = {
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]],
  norm:(a)=>{const m=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/m,a[1]/m,a[2]/m];},
};

// ---- the named reference planes (real obliquity; the polar axis given a latitude) ----
const DEG = Math.PI/180;
const TILT  = 32*DEG;                                   // the polar axis, tilted to a latitude
const OBLIQ = 23.4*DEG;                                 // obliquity of the ecliptic (the real angle)
const P  = V.norm([0, Math.cos(TILT), Math.sin(TILT)]);            // polar axis = equator normal
const En = V.norm([0, Math.cos(TILT+OBLIQ), Math.sin(TILT+OBLIQ)]);// ecliptic normal
const Mn = [1,0,0];                                                // meridian normal
const Cn = V.norm(V.cross(P,[1,0,0]));                             // a colure through the poles
const Cn2= V.norm(V.cross(P, Cn));                                 // the second colure ⟂ the first
const Hn = [0,1,0];                                                // horizon normal (the ground plane)

// in-plane orthonormal basis for a plane of normal n
function basis(n){
  const a = Math.abs(n[1])>0.9 ? [1,0,0] : [0,1,0];
  const u = V.norm(V.cross(n,a));
  const v = V.norm(V.cross(n,u));
  return [u,v];
}

// The rings. Each is an OPAQUE cylindrical brass band: a tube at radius R with
// axial half-width hw, tessellated into N quad faces whose radial-outward normal
// catches the key light. `ticks` sets a travelling engraved graduation.
const RINGS = [
  { name:'HORIZON',  n:Hn,  R:1.52, hw:0.052, N:96, ticks:96, hue:[0.72,0.80,1.02], warm:0 },
  { name:'MERIDIAN', n:Mn,  R:1.40, hw:0.050, N:88, ticks:72, hue:[1.00,0.98,0.92], warm:0.15 },
  { name:'COLURE',   n:Cn,  R:1.38, hw:0.046, N:80, ticks:48, hue:[0.98,0.96,0.94], warm:0.10 },
  { name:'COLURE·II',n:Cn2, R:1.38, hw:0.046, N:80, ticks:48, hue:[0.98,0.96,0.94], warm:0.10 },
  { name:'EQUATOR',  n:P,   R:1.22, hw:0.056, N:88, ticks:72, hue:[1.00,0.95,0.82], warm:0.35 },
  { name:'ECLIPTIC', n:En,  R:1.20, hw:0.068, N:88, ticks:48, hue:[1.00,0.90,0.62], warm:1.0 },
].map(r=>{ const [u,v]=basis(r.n); r.u=u; r.v=v; return r; });

const ECL_I = RINGS.length-1;                            // the ecliptic (holds the bead-sun)
const LIGHT = V.norm([0.42, 0.80, 0.52]);                // warm key from upper-front

// the world direction of increasing depth (the sight-line) — vantage's own view axis
function viewDir(cam){
  const cy=Math.cos(cam.yaw), sy=Math.sin(cam.yaw), cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
  return [sy*cp, cy*cp, -sp];
}
// a plane is EDGE-ON when the sight-line lies in it (⟂ its normal): the ring
// foreshortens to a single gold line. FACE-ON when the sight-line pierces it.
function edgeOn(n, cam){ return 1 - Math.abs(V.dot(n, viewDir(cam))); }
function faceOn(n, cam){ return Math.abs(V.dot(n, viewDir(cam))); }

// ---- gilded-brass shading: bronze → gold → hot rim, patina in the shadow valleys ----
const BRONZE=[58,42,20], GOLD=[196,150,58], HOT=[255,236,168], PATINA=[26,40,44];
function ramp(t){                                        // 0..1.15 -> bronze→gold→hot
  t=Math.max(0,t);
  let a,b,f;
  if(t<0.5){ a=BRONZE; b=GOLD; f=t/0.5; } else { a=GOLD; b=HOT; f=Math.min(1,(t-0.5)/0.5); }
  return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f];
}
// anisotropic brushed-brass: the key term is sharpened along the band's tangent,
// so the highlight streaks the way real turned brass does.
function brass(nWorld, tanWorld, cam, hue, warm, grad){
  const face = Math.max(0, V.dot(nWorld, LIGHT));
  const vd = viewDir(cam);
  const rim  = Math.pow(1 - Math.abs(V.dot(nWorld, vd)), 1.9);      // grazing gold glare
  const aniso= Math.pow(Math.max(0, 1 - Math.abs(V.dot(tanWorld, LIGHT))), 2.2); // brushed streak
  let b = 0.20 + 0.52*face + 0.34*rim + 0.14*aniso*face;
  b *= (1 - 0.40*grad);                                             // engraved graduation darkens
  b += warm*0.05;
  let col = ramp(b);
  col = [col[0]*hue[0], col[1]*hue[1], col[2]*hue[2]];
  // patina settles in the deep shadow valleys (verdigris kiss where light never reaches)
  const shadow = Math.max(0, 0.34 - face) / 0.34;
  const p = shadow*shadow*0.5;
  col = [col[0]+(PATINA[0]-col[0])*p, col[1]+(PATINA[1]-col[1])*p, col[2]+(PATINA[2]-col[2])*p];
  return col;
}
function rgb(c){ return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; }

// ---- build one ring's band faces at the current spin phase ----
function bandFaces(r, ri, phase, cam, out){
  const {u,v,n,R,hw,N} = r;
  const axis = V.mul(n, hw);
  for(let i=0;i<N;i++){
    const th0=i/N*2*Math.PI, th1=(i+1)/N*2*Math.PI, thm=(th0+th1)/2;
    const rad0=V.add(V.mul(u,Math.cos(th0)), V.mul(v,Math.sin(th0)));
    const rad1=V.add(V.mul(u,Math.cos(th1)), V.mul(v,Math.sin(th1)));
    const radM=V.add(V.mul(u,Math.cos(thm)), V.mul(v,Math.sin(thm)));
    const c0=V.mul(rad0,R), c1=V.mul(rad1,R);
    // a quad on the outer cylinder wall: two rim corners top, two bottom
    const A=V.add(c0,axis), B=V.add(c1,axis), C=V.sub(c1,axis), D=V.sub(c0,axis);
    const nWorld = radM;                                            // outward normal
    const tanWorld = V.norm(V.sub(c1,c0));                          // band tangent
    // travelling engraved graduation: a notch pattern that rides round with phase
    const g = Math.pow(0.5+0.5*Math.cos((thm+phase)*r.ticks), 8);
    const major = (Math.round((thm+phase)/(2*Math.PI)*r.ticks) % 6 === 0);
    const col = brass(nWorld, tanWorld, cam, r.hue, r.warm, g);
    out.push({
      k:'face', cull:true, pts:[A,B,C,D], ri, seg:i, ringName:r.name,
      shade:(cx, sp)=>{
        cx.beginPath(); cx.moveTo(sp[0].x,sp[0].y);
        for(let k=1;k<sp.length;k++) cx.lineTo(sp[k].x,sp[k].y);
        cx.closePath();
        cx.fillStyle=rgb(col); cx.fill();
        // an engraved tick stroked across the band where a graduation notch lands
        if(g>0.55){
          const mx=(sp[0].x+sp[1].x)/2, my=(sp[0].y+sp[1].y)/2;
          const bx=(sp[2].x+sp[3].x)/2, by=(sp[2].y+sp[3].y)/2;
          cx.strokeStyle = major ? 'rgba(24,16,6,0.85)' : 'rgba(40,28,12,0.55)';
          cx.lineWidth = major ? 1.5 : 0.9;
          cx.beginPath(); cx.moveTo(mx,my); cx.lineTo(bx,by); cx.stroke();
        }
      }
    });
  }
}

// ---- a UV-sphere ball of quad faces (terrella, beads) ----
function ball(center, r, latN, lonN, shadeFor){
  const faces=[];
  for(let a=0;a<latN;a++){
    const ph0=a/latN*Math.PI, ph1=(a+1)/latN*Math.PI;
    for(let b=0;b<lonN;b++){
      const th0=b/lonN*2*Math.PI, th1=(b+1)/lonN*2*Math.PI;
      const pt=(ph,th)=>[ center[0]+r*Math.sin(ph)*Math.cos(th),
                          center[1]+r*Math.cos(ph),
                          center[2]+r*Math.sin(ph)*Math.sin(th) ];
      const A=pt(ph0,th0), B=pt(ph0,th1), C=pt(ph1,th1), D=pt(ph1,th0);
      const nrm=V.norm(V.sub(pt((ph0+ph1)/2,(th0+th1)/2), center));
      faces.push({ k:'face', cull:true, pts:[A,B,C,D], shade:shadeFor(nrm) });
    }
  }
  return faces;
}

// the gilt terrella at the heart — a smooth radial-gradient gold ball with a
// specular hotspot, NOT a facetted mesh. One draw item carrying 6 octahedron
// vertices: it sorts by the heart's depth (so a near band eclipses it) and never
// collapses when viewed edge-on (the 6 spread points always give a round radius).
function terrellaCore(r){
  const pts=[[r,0,0],[-r,0,0],[0,r,0],[0,-r,0],[0,0,r],[0,0,-r]];
  return { k:'face', cull:false, pts, isCore:true, shade:(cx, sp, near)=>{
    let cxx=0, cyy=0; for(const p of sp){ cxx+=p.x; cyy+=p.y; } cxx/=sp.length; cyy/=sp.length;
    let rad=0; for(const p of sp) rad=Math.max(rad, Math.hypot(p.x-cxx, p.y-cyy));
    rad=Math.max(3, rad);
    // hotspot offset toward the key light's screen-up-left
    const g=cx.createRadialGradient(cxx-rad*0.34, cyy-rad*0.40, rad*0.06, cxx, cyy, rad);
    g.addColorStop(0.0,'#fff4d8'); g.addColorStop(0.28,'#f4cd74');
    g.addColorStop(0.62,'#c58a34'); g.addColorStop(0.86,'#8a561d'); g.addColorStop(1,'#4f3110');
    cx.beginPath(); cx.arc(cxx, cyy, rad, 0, 7); cx.fillStyle=g; cx.fill();
    // a faint outer bloom
    cx.save(); cx.globalAlpha=0.5; cx.shadowColor='rgba(240,200,120,0.8)'; cx.shadowBlur=rad*0.7;
    cx.beginPath(); cx.arc(cxx, cyy, rad*0.6, 0, 7); cx.fillStyle='rgba(250,222,150,0.5)'; cx.fill(); cx.restore();
  }};
}
// a glowing bead (sun / poles)
function beadShade(color, glow){
  return (nrm)=>(cx, sp, near)=>{
    const face = 0.5+0.5*Math.max(0, V.dot(nrm, LIGHT));
    cx.save();
    cx.shadowColor=color; cx.shadowBlur=glow*(0.6+0.5*near);
    cx.beginPath(); cx.moveTo(sp[0].x,sp[0].y);
    for(let k=1;k<sp.length;k++) cx.lineTo(sp[k].x,sp[k].y);
    cx.closePath();
    cx.globalAlpha=0.85+0.15*face; cx.fillStyle=color; cx.fill();
    cx.restore();
  };
}

// ---- the whole scene at a given state ----
// state = { phase:[per-ring], sunPhase }.  Returns { scene, meta }.
function buildScene(cam, state){
  const scene=[];
  const phase = state.phase || RINGS.map(()=>0);
  // the brass bands
  for(let i=0;i<RINGS.length;i++) bandFaces(RINGS[i], i, phase[i]||0, cam, scene);
  // the polar-axis rod (segs — a different primitive kind, carried by the same list)
  const rodN=16;
  for(let i=0;i<rodN;i++){
    const t0=-1.72+i/rodN*3.44, t1=-1.72+(i+1)/rodN*3.44;
    const a=V.mul(P,t0), b=V.mul(P,t1);
    const nrm=V.norm(V.cross(P, LIGHT));
    const face=0.4+0.6*Math.max(0,V.dot(nrm,LIGHT));
    const col=rgb(ramp(0.4+0.5*face));
    scene.push({ k:'seg', a, b, isRod:true,
      shade:(cx,sp,near)=>{ cx.strokeStyle=col; cx.lineWidth=2.1+1.4*near; cx.lineCap='round';
        cx.beginPath(); cx.moveTo(sp[0].x,sp[0].y); cx.lineTo(sp[1].x,sp[1].y); cx.stroke(); } });
  }
  // the gilt terrella at the heart
  scene.push(terrellaCore(0.19));
  // the bead-sun riding the ecliptic
  const ecl=RINGS[ECL_I];
  const sd=V.add(V.mul(ecl.u,Math.cos(state.sunPhase)), V.mul(ecl.v,Math.sin(state.sunPhase)));
  scene.push(...ball(V.mul(sd, ecl.R), 0.075, 6, 8, beadShade('#ffe6a0', 20)));
  // pole beads
  scene.push(...ball(V.mul(P, 1.72), 0.045, 5, 6, beadShade('#dfe8ff', 12)));
  scene.push(...ball(V.mul(P,-1.72), 0.038, 5, 6, beadShade('#9fb0d8', 8)));

  // meta for the room's banner / glint / hit-test
  const meta = {
    viewDir: viewDir(cam),
    rings: RINGS.map((r,i)=>({ name:r.name, edge: edgeOn(r.n,cam), face: faceOn(r.n,cam), n:r.n, i })),
    eclFace: faceOn(En, cam),
    sunAngle: state.sunPhase,
  };
  return { scene, meta };
}

// the projected extreme points of a ring (for the edge-on glint line)
function ringGlint(r, cam, vp){
  let far=-1, fi=0, pts=[];
  for(let i=0;i<r.N;i++){
    const th=i/r.N*2*Math.PI;
    const d=V.add(V.mul(r.u,Math.cos(th)), V.mul(r.v,Math.sin(th)));
    const s=toScreen(project(V.mul(d,r.R),cam),vp); pts.push(s);
    const dd=(s.x-vp.cx)**2+(s.y-vp.cy)**2; if(dd>far){far=dd;fi=i;}
  }
  const oi=(fi+(r.N>>1))%r.N;
  return { a:pts[fi], b:pts[oi] };
}

// the face-on ecliptic disc outline (a flat gilded disc when sighted down its pole)
function eclDiscOutline(cam, vp){
  const r=RINGS[ECL_I], out=[];
  for(let i=0;i<=r.N;i++){ const th=i/r.N*2*Math.PI;
    const d=V.add(V.mul(r.u,Math.cos(th)), V.mul(r.v,Math.sin(th)));
    out.push(toScreen(project(V.mul(d, r.R-r.hw),cam),vp)); }
  return out;
}

// the bead-sun's living drift, per ms — the ONLY idle motion. Gated by BOTH
// prefers-reduced-motion AND the shared estate mute (the sphere itself holds
// still where you leave it; under reduced-motion nothing moves unbidden).
function beadDrift(reduced, muted){ return (reduced || muted) ? 0 : 0.00026; }

// ===== END SCENE =====

export { RINGS, ECL_I, P, En, OBLIQ, TILT, V, LIGHT, viewDir, edgeOn, faceOn,
         basis, brass, ramp, buildScene, bandFaces, ball, ringGlint, eclDiscOutline, beadDrift };
