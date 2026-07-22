// ============================================================================
//  the-sealing-wax-bench/seal-core.mjs — THE pure, DOM-free, deterministic core
//  of the wax bench. The ONLY module the payoff-liveness twin imports, and the
//  block a room inlines byte-for-byte between the SEAL CORE sentinels (via forge);
//  the twin byte-parity-checks the inlined copy so page + test can never drift.
//
//  THE ONE LAW (an intaglio die → a relief seal). The die is a NEGATIVE: a flat
//  metal face (depth 0, stands proud) with the device carved INTO it (depth>0, a
//  cavity). Pressed into wax, the flat face pushes wax DOWN and wax flows UP into
//  the cavities — so the seal is RAISED exactly where the die is SUNK. Relief
//  SUPPORT-EQUALS die depth:
//
//     relief(i) = D(i) · g(D(i), p)         g monotone-nondecreasing in p,
//                                           g(·,0)=0, g(·,1)=1, g(d,p)>0 for d>0,p>0.
//     reference g = LINEAR p   ⇒   relief = D · p.
//
//  So relief>0 ⟺ die>0 cell-for-cell (the inversion), the deepest die cell yields
//  the highest relief, relief is monotone in the press depth p, and support is
//  identical (IoU→1). "Inversion" is the CONCEPTUAL negative→positive, expressed
//  as support-equality — NOT a numeric sign-flip, NOT height=max−depth.
//
//  DETERMINISM: the die is a pure function of (matrixId, seed). All randomness is
//  an in-module seeded PRNG (mulberry32) — NO Math.random anywhere — so a hung
//  seal re-derives its relief IDENTICALLY on reload. That is what makes the
//  round-trip real and the twin's test (c) load-bearing (relief is NEVER stored).
//
//  EXPORTS: dieField · pressRelief · coolAt · createRibbon (+ SEAL_N, primitives).
//  Edit this file + the room's .src.html, then `node tools/forge/forge.mjs
//  compositor/the-sealing-wax-bench/index.src.html`.
// ============================================================================

// ===== SEAL CORE (byte-identical to seal-core.mjs) =====
"use strict";

// ONE shared footprint. The live wax pool and the die grid are identity-registered
// to this N (same origin, scale, orientation) so a die cavity and the wax cell it
// lifts share coordinates. Pin it once; pool and die both read it.
const SEAL_N = 192;

const CARVE     = 0.85;   // full cavity depth (the deepest a device is engraved)
const R_SEAL    = 0.98;   // the seal disc: no wax mark beyond this radius
const RIM_IN    = 0.855;  // the raised-rim annulus (a bead framing the device)
const RIM_OUT   = 0.945;
const RIM_D     = 0.72;   // rim cavity depth (→ a proud rim on the pressed seal)
const CTR_GAIN  = 0.22;   // devices cut a touch deeper toward the middle (graded field)

// ---- a seeded PRNG: a pure function of a uint32 seed (no Math.random, ever) ----
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// fold a matrixId string + numeric seed into one uint32 (FNV-1a over the string,
// then mixed with the seed) — deterministic, so (matrixId, seed) fixes the die.
function hashSeed(matrixId, seed){
  let h = 0x811c9dc5 >>> 0;
  const s = String(matrixId);
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  h ^= (seed|0) >>> 0; h = Math.imul(h, 0x01000193) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

// a small band-limited angular wobble drawn from the PRNG: sum of a few harmonics.
// Used both to rough the device edge and to bead the rim — seeded, so identical
// across reloads, varied across seeds.
function wobbleFn(rng, harmonics, amp){
  const A=[], PH=[], K=[];
  for(let i=0;i<harmonics;i++){ A.push(amp*(0.5+rng())); PH.push(rng()*Math.PI*2); K.push(2+((rng()*5)|0)); }
  return (theta)=>{ let v=0; for(let i=0;i<harmonics;i++) v += A[i]*Math.sin(K[i]*theta + PH[i]); return v; };
}

// ---- the analytic device primitives (inside-tests, zero DOM) --------------
// each takes normalised (x,y) in [-1,1] and returns TRUE if inside the device.
function sdInside(name, x, y){
  const ax=Math.abs(x), ay=Math.abs(y), r=Math.hypot(x,y);
  switch(name){
    case 'roundel': return r < 0.80;
    case 'cross': {                       // a plus
      const w=0.24, L=0.82;
      return (ax<w && ay<L) || (ay<w && ax<L);
    }
    case 'saltire': {                     // an X (the plus, turned 45°)
      const u=(x+y)*0.70710678, v=(x-y)*0.70710678, au=Math.abs(u), av=Math.abs(v);
      const w=0.20, L=0.80;
      return (au<w && av<L) || (av<w && au<L);
    }
    case 'lozenge': return (ax/0.62 + ay/0.86) < 1.0;   // a diamond
    case 'chevron': {                     // a downward-pointing band ∧
      if(ax>0.86) return false;
      const line = -0.18 + 0.82*ax;       // the ridge line
      return Math.abs(y - line) < 0.17;
    }
    case 'mullet': return inStar(x, y, 5, 0.86, 0.36, -Math.PI/2);   // a 5-point star
    case 'star':   return inStar(x, y, 6, 0.86, 0.42, -Math.PI/2);   // a 6-point mullet
    default: return r < 0.80;
  }
}
// point-in-star: even-odd test against the 2n-gon.
function inStar(x, y, points, rO, rI, start){
  let inside=false; const n=points*2;
  let px=0, py=0, first=true, fx=0, fy=0, jx=0, jy=0;
  for(let i=0;i<=n;i++){
    const idx=i%n, rr=(idx%2===0)?rO:rI, a=start + idx*Math.PI/points;
    const vx=Math.cos(a)*rr, vy=Math.sin(a)*rr;
    if(first){ fx=vx; fy=vy; px=vx; py=vy; first=false; continue; }
    const xi=px, yi=py, xj=vx, yj=vy;
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
    px=vx; py=vy;
  }
  return inside;
}

// ---- dieField(matrixId, seed) — the intaglio depth field ------------------
// depth>0 == a sunk cavity (device + rim); depth 0 == the flat face that stands
// proud. Built from the analytic primitives, roughed at the edge and beaded at
// the rim by the seeded PRNG. Pure in (matrixId, seed).
function dieField(matrixId, seed){
  const N=SEAL_N, data=new Float32Array(N*N);
  const rng=mulberry32(hashSeed(matrixId, seed));
  const edgeWob=wobbleFn(rng, 4, 0.045);   // roughs the device outline
  const rimWob =wobbleFn(rng, 5, 0.10);    // beads the rim
  const SS=2, inv=1/(N-1);
  let sunk=0;
  for(let yy=0; yy<N; yy++){
    for(let xx=0; xx<N; xx++){
      // map cell → [-1,1], identity-registered origin/scale/orientation
      const nx=(xx*inv)*2-1, ny=(yy*inv)*2-1;
      const r=Math.hypot(nx,ny);
      let d=0;
      if(r < R_SEAL){
        const theta=Math.atan2(ny,nx);
        // DEVICE: supersample the inside-test with a seeded angular scale wobble
        const s=1 + edgeWob(theta);
        let cov=0;
        for(let sy=0; sy<SS; sy++) for(let sx=0; sx<SS; sx++){
          const ox=(sx+0.5)/SS-0.5, oy=(sy+0.5)/SS-0.5;
          const qx=(nx + ox*inv*2)/s, qy=(ny + oy*inv*2)/s;
          if(sdInside(matrixId, qx, qy)) cov++;
        }
        cov/=SS*SS;
        if(cov>0) d = CARVE * cov * (1 - CTR_GAIN*r);   // graded: deeper toward centre
        // RIM: a raised bead framing the device (a sunk annulus in the die)
        const rimHalf=(RIM_OUT-RIM_IN)*0.5, rimMid=(RIM_OUT+RIM_IN)*0.5;
        const beadedMid=rimMid + 0.012*rimWob(theta);
        const rd=Math.abs(r - beadedMid);
        if(rd < rimHalf){
          const t=1 - rd/rimHalf;                        // 1 at rim centre → 0 at edges
          const rim=RIM_D * (0.6 + 0.4*Math.max(0, 0.5+0.5*Math.sin(theta*3)))* (t*t*(3-2*t));
          if(rim>d) d=rim;
        }
      }
      if(d>0) sunk++;
      data[yy*N+xx]=d;
    }
  }
  return {
    N, data, cells:sunk,
    at(x,y){ x=x<0?0:(x>=N?N-1:x|0); y=y<0?0:(y>=N?N-1:y|0); return data[y*N+x]; }
  };
}

// build a die directly from a coverage MASK ({N,data} in [0,1]) — the shared
// mask type the device-kit (Blazon charges) and the hand-carve grid produce.
// Same law: cavity depth = coverage·carve, graded toward centre, framed by the
// same seeded rim so every provenance reads as one family of seals. `seed` still
// drives the rim bead so a mask seal is deterministic in (maskId, seed).
function dieFromMask(mask, maskId, seed){
  const N=SEAL_N, data=new Float32Array(N*N);
  const rng=mulberry32(hashSeed(maskId, seed));
  const rimWob=wobbleFn(rng, 5, 0.10);
  const inv=1/(N-1); let sunk=0;
  const M=mask.N===N ? mask.data : resample(mask, N);
  for(let yy=0; yy<N; yy++) for(let xx=0; xx<N; xx++){
    const nx=(xx*inv)*2-1, ny=(yy*inv)*2-1, r=Math.hypot(nx,ny);
    let d=0;
    if(r < R_SEAL){
      const cov=M[yy*N+xx];
      if(cov>0.02) d = CARVE * cov * (1 - CTR_GAIN*r);
      const theta=Math.atan2(ny,nx);
      const rimHalf=(RIM_OUT-RIM_IN)*0.5, rimMid=(RIM_OUT+RIM_IN)*0.5;
      const beadedMid=rimMid + 0.012*rimWob(theta);
      const rd=Math.abs(r - beadedMid);
      if(rd < rimHalf){
        const t=1 - rd/rimHalf;
        const rim=RIM_D * (0.6 + 0.4*Math.max(0, 0.5+0.5*Math.sin(theta*3)))*(t*t*(3-2*t));
        if(rim>d) d=rim;
      }
    }
    if(d>0) sunk++;
    data[yy*N+xx]=d;
  }
  return { N, data, cells:sunk,
    at(x,y){ x=x<0?0:(x>=N?N-1:x|0); y=y<0?0:(y>=N?N-1:y|0); return data[y*N+x]; } };
}
function resample(mask, N){
  const out=new Float32Array(N*N), sN=mask.N, sd=mask.data;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const sx=Math.min(sN-1, (x/N*sN)|0), sy=Math.min(sN-1, (y/N*sN)|0);
    out[y*N+x]=sd[sy*sN+sx];
  }
  return out;
}

// ---- pressRelief(die, p, opt) — the DETERMINISTIC re-derivation ------------
// relief = d>0 ? d·g(d,p) : 0 ; reference g = linear p. Optional sub-pixel
// (ox,oy) bilinear sampling for a live drag-over. This is the canonical mark the
// ribbon re-renders and the twin proves — NOT the ephemeral live fluid blob.
function pressG(d, p){ return p; }                       // reference g(d,p) = p
function pressRelief(die, p, opt){
  const N=die.N, D=die.data, out=new Float32Array(N*N);
  const P=p<0?0:(p>1?1:p);
  const ox=(opt&&opt.ox)||0, oy=(opt&&opt.oy)||0;
  if(!ox && !oy){
    for(let i=0;i<D.length;i++){ const d=D[i]; out[i] = d>0 ? d*pressG(d,P) : 0; }
  } else {
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const d=bilinear(D,N,x-ox,y-oy);
      out[y*N+x] = d>0 ? d*pressG(d,P) : 0;
    }
  }
  return { N, data:out };
}
function bilinear(D, N, x, y){
  if(x<0)x=0; if(y<0)y=0; if(x>N-1)x=N-1; if(y>N-1)y=N-1;
  const x0=x|0, y0=y|0, x1=Math.min(N-1,x0+1), y1=Math.min(N-1,y0+1);
  const fx=x-x0, fy=y-y0;
  const a=D[y0*N+x0], b=D[y0*N+x1], c=D[y1*N+x0], e=D[y1*N+x1];
  return a*(1-fx)*(1-fy) + b*fx*(1-fy) + c*(1-fx)*fy + e*fx*fy;
}

// ---- coolAt(t, opt) — the cooling law as a pure sample ---------------------
// t in seconds since peel. wobble decays to ~0; moltenness M falls 1→0; hardness
// rises 0→1; gloss (spec) and ember both fall as it sets. No number ever surfaces
// in the UI — this is craft-patience made touchable, not a heat model.
const COOL_TAU = 7;      // moltenness half-life-ish (the slow set)
const WOB_TAU  = 0.8;    // the peel-wobble stills well under a second
const WOB_A0   = 0.16;   // starting wobble amplitude
const HARD_AT  = 0.9;    // hardness at/above this ⇒ no longer molten
const SSS_GAIN = 0.5;    // sub-surface ember gain at full melt
function coolAt(t, opt){
  const tau=(opt&&opt.tau)||COOL_TAU, w0=(opt&&opt.wobble0!==undefined)?opt.wobble0:WOB_A0;
  const M = Math.max(0, 1 - t/tau);                 // moltenness 1 → 0
  const hardness = 1 - M;                            // 0 → 1
  const wobbleAmp = w0 * Math.exp(-t/WOB_TAU);       // strictly decreasing → ~0
  const molten = hardness < HARD_AT;
  const spec = 0.06 + (0.9-0.06)*M;                  // glossy molten → matte set
  const ember = M * SSS_GAIN;                        // inner glow gates off
  // albedo matures hot #b8342c → cool #6e1f22
  const HOT=[184,52,44], COLD=[110,31,34];
  const albedo=[ COLD[0]+(HOT[0]-COLD[0])*M, COLD[1]+(HOT[1]-COLD[1])*M, COLD[2]+(HOT[2]-COLD[2])*M ];
  return { wobbleAmp, hardness, molten, spec, ember, albedo, M };
}

// ---- createRibbon({storage, max}) — the injected-storage seal store ---------
// validates records, filters corrupt/foreign to empty, swallows EVERY throw
// (blocked/quota ⇒ a usable empty ribbon), caps at max (oldest falls off),
// preserves order. Key is per-page state (NOT a ws:pref:*).
function createRibbon(opt){
  const storage=(opt&&opt.storage)||null, max=(opt&&opt.max)||24;
  const KEY='ws:seal:ribbon';
  function valid(rec){
    return !!rec && typeof rec==='object'
      && typeof rec.id==='string' && rec.id.length>0
      && typeof rec.matrix==='string' && rec.matrix.length>0
      && typeof rec.wax==='string' && rec.wax.length>0
      && Number.isFinite(rec.seed) && rec.v===1;
  }
  function load(){
    try{
      const raw=storage && storage.getItem(KEY);
      if(!raw) return [];
      const arr=JSON.parse(raw);
      if(!Array.isArray(arr)) return [];
      return arr.filter(valid).slice(-max);
    }catch(e){ return []; }
  }
  function save(list){
    try{
      const clean=(Array.isArray(list)?list:[]).filter(valid).slice(-max);
      storage.setItem(KEY, JSON.stringify(clean));
      return true;
    }catch(e){ return false; }
  }
  function hang(rec){
    const list=load();
    if(valid(rec)) list.push(rec);
    const capped=list.slice(-max);
    save(capped);
    return capped;
  }
  return { KEY, load, save, hang, valid };
}

// ===== END SEAL CORE =====

export { SEAL_N, CARVE, dieField, dieFromMask, pressRelief, coolAt, createRibbon,
         sdInside, mulberry32, hashSeed };
