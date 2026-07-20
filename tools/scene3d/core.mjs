// ============================================================================
//  scene3d/core.mjs — a small reusable 3-D core: the estate's first real-time
//  ORBITABLE solid. Pure, DOM-free — the SAME math a room renders and its twin
//  proves. Generalises vantage/core.mjs's projectNorm UNFORKED.
//
//  THE CONTRACT (this is the shared infrastructure — reuse on day one)
//
//   • CAMERA  cam = { yaw, pitch, roll, dolly }.   project(p, cam) -> {x, y, depth}
//       yaw about world-up, pitch about the tilted right axis, a perspective
//       divide by (dolly + depthAlongView) — byte-for-byte the vantage chain —
//       THEN a roll that twists the image plane (rx, tz), INERT at roll===0. So
//       project(p,{...,roll:0}) === vantage projectNorm exactly (the twin measures
//       machine-ε): the Vantages camera is the roll=0 slice of THIS one. Vantage
//       grows, it never forks. FOCAL is the vantage constant, not a new number.
//
//   • applyDrag(cam, dx, dy) mutates yaw/pitch from a pointer delta — the ONE
//       camera mutation a room's pointermove handler AND its twin both call, so
//       "a drag ORBITS the camera" is proven on the LIVE path (a marker vertex's
//       project() coord at yaw θ differs from θ+Δ), not by a screenshot.
//
//   • A ROOM SUPPLIES PRIMITIVES, not pixels. scene = a flat array of draw items:
//       { k:'seg',  a:[x,y,z], b:[x,y,z], shade(ctx, sp, near) }
//       { k:'face', pts:[[x,y,z]…], cull:true, shade(ctx, sp, near, area) }
//     A brass hoop is many 'face' bands; an engraved graduation is many 'seg's; a
//     terrella is a ball of 'face's. The core knows neither "armillary" nor "knot"
//     — only segs and faces. THAT is what "generalises" means, and the twin proves
//     it with a seg fixture AND a face fixture, not with a second solid on screen.
//
//   • render(ctx, scene, cam, vp) projects every vertex, computes each item's
//       sort-depth (mean vertex depth), sorts FAR->NEAR (honest painter's sort),
//       backface-culls faces, paints in order, and RETURNS the depth-sorted list
//       (with screen coords) so a room can query exactly what it saw. Near
//       primitives land over far ones — bands eclipse, balls self-occlude, solids
//       inter-occlude — all from ONE sorted list, no per-object special-casing.
//
//   • occludedAt(sorted, sx, sy) walks NEAR->FAR and returns the first face
//       covering (sx,sy): the same list answers "what is in front here?".
//
//  SOURCING (anti-drift, mirrors vantage's discipline): a consumer inlines the
//  block between the SCENE3D CORE sentinels byte-for-byte (via forge); its twin
//  byte-parity-checks the inlined copy so the page and the test can never drift.
// ============================================================================

// ===== SCENE3D CORE (byte-identical to core.mjs) =====
"use strict";

const FOCAL = 2.4;          // shared with vantage/core.mjs (lorenz heritage) — do NOT fork
const PITCH_LIMIT = 1.45;   // the pitch clamp both the handler and applyDrag obey
const NEAR_EPS = 0.06;      // near-plane: items at/behind the eye are dropped (the wrap)

// project(p, cam) -> {x,y,depth}.  roll===0 reproduces vantage projectNorm exactly.
function project(p, cam){
  const cy=Math.cos(cam.yaw),   sy=Math.sin(cam.yaw);
  const cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
  const cr=Math.cos(cam.roll||0), sr=Math.sin(cam.roll||0);
  const nx=p[0], ny=p[1], nz=p[2];
  const rx = nx*cy - ny*sy;         // yaw about world-up   (unforked from vantage)
  const ry = nx*sy + ny*cy;
  const ty = ry*cp - nz*sp;         // pitch -> depth along the view axis
  const tz = ry*sp + nz*cp;         // screen-up
  const depth = cam.dolly + ty;
  const u = rx*cr - tz*sr;          // roll twists the image plane (INERT at roll=0)
  const v = rx*sr + tz*cr;          //   — depth is untouched, so it never lies
  const f = FOCAL / Math.max(0.05, depth);
  return { x:u*f, y:v*f, depth };
}

// applyDrag: the ONE orbit mutation — a pointer delta turns yaw/pitch. The room's
// pointermove handler AND the liveness twin both call THIS.
function applyDrag(cam, dx, dy, opt){
  const s = (opt && opt.speed) || 0.008;
  cam.yaw  += dx*s;
  cam.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, cam.pitch + dy*s));
  return cam;
}

// map a projected point into canvas pixels
function toScreen(pr, vp){ return { x: vp.cx + pr.x*vp.scale, y: vp.cy - pr.y*vp.scale, depth: pr.depth }; }

// signed area of a screen polygon (backface cull + winding)
function signedArea(sp){
  let s=0; for(let i=0;i<sp.length;i++){ const a=sp[i], b=sp[(i+1)%sp.length]; s += a.x*b.y - b.x*a.y; }
  return s*0.5;
}
function pointInPoly(sp, x, y){
  let inside=false;
  for(let i=0,j=sp.length-1;i<sp.length;j=i++){
    const xi=sp[i].x, yi=sp[i].y, xj=sp[j].x, yj=sp[j].y;
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

// THE ENGINE. Projects, sorts far->near, culls, paints. Returns the sorted list
// (with screen coords) so a room can run occlusion queries against exactly what
// it saw. `near` in [0,1] (1 nearest) is handed to each item's shade().
function render(ctx, scene, cam, vp){
  const draw=[];
  for(const it of scene){
    if(it.k==='seg'){
      const a=toScreen(project(it.a,cam),vp), b=toScreen(project(it.b,cam),vp);
      if(a.depth<=NEAR_EPS && b.depth<=NEAR_EPS) continue;
      draw.push({ it, sp:[a,b], depth:(a.depth+b.depth)*0.5 });
    } else { // face
      const sp=it.pts.map(p=>toScreen(project(p,cam),vp));
      let d=0; for(const s of sp) d+=s.depth; d/=sp.length;
      if(d<=NEAR_EPS) continue;
      const area=signedArea(sp);
      if(it.cull && area<=0) continue;             // backface: wound away from the eye
      draw.push({ it, sp, depth:d, area });
    }
  }
  draw.sort((p,q)=> q.depth - p.depth);            // FAR first — painter's algorithm
  let dmin=Infinity, dmax=-Infinity;
  for(const d of draw){ if(d.depth<dmin)dmin=d.depth; if(d.depth>dmax)dmax=d.depth; }
  const span=Math.max(1e-6, dmax-dmin);
  for(const d of draw){
    const near = 1 - (d.depth-dmin)/span;          // 1 near, 0 far
    d.near = near;
    if(d.it.shade) d.it.shade(ctx, d.sp, near, d.area);
  }
  return draw;                                     // the depth-sorted list, for queries
}

// occlusion query: walk NEAR->FAR, first face covering (sx,sy) wins.
function occludedAt(sorted, sx, sy){
  for(let i=sorted.length-1;i>=0;i--){             // sorted is far->near, so reverse = near->far
    const d=sorted[i];
    if(d.it.k==='face' && pointInPoly(d.sp, sx, sy)) return d.it;
  }
  return null;
}

// ===== END SCENE3D CORE =====

export { FOCAL, PITCH_LIMIT, NEAR_EPS, project, applyDrag, toScreen, signedArea, pointInPoly, render, occludedAt };
