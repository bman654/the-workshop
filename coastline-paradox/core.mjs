// ============================================================================
//  The Coastline Paradox — Cartographer × fractal-dimension CORE
//  Pure, dependency-free. Identical code is inlined into index.html; this file
//  is the Node-testable twin (the falsifiability harness runs against it).
//
//  THE CROSS. The Cartographer (cartographer/) draws realms from a seeded
//  value-noise fBm heightmap whose *roughness slider* is the fBm persistence
//  `gain`. Its coast is the contour where that height crosses the sea level.
//  Here we take that SAME generator, pull out the coastline, and MEASURE its
//  fractal dimension three independent ways that must all agree:
//
//   (1) BOX-COUNTING   D_box = slope of log N(ε) / log(1/ε)
//   (2) THE DIVIDER / RULER  — walk the coast with a compass of opening ε; the
//       measured length L(ε) ∝ ε^(1−D) DIVERGES as ε→0 (this is *why* "how long
//       is Britain's coast?" has no answer — Richardson 1961 / Mandelbrot 1967).
//       The divergence slope gives D_ruler = 1 − slope(log L vs log ε).
//   (3) THEORY  — a 2-D fBm with Hurst exponent H has level sets (its coastlines)
//       of dimension D = 2 − H, and the Cartographer's gain sets H = −log2(gain).
//       So the roughness SLIDER predicts the coastline's dimension.
//
//  Crux: D_box ≈ D_ruler ≈ (2 − H), all in (1,2), and rising as the slider
//  roughens the field. The dimension is not drawn — it is MEASURED (twice),
//  and checked against the theory the generator itself implies.
// ============================================================================

// --- PRNG: byte-identical to the Cartographer's xmur3 + mulberry32 -----------
export function xmur3(str){
  let h = 1779033703 ^ str.length;
  for (let i=0;i<str.length;i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function(){
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}
export function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function makeRng(seedStr){ const s = xmur3(String(seedStr)); return mulberry32(s()); }

// --- ValueNoise: byte-identical to the Cartographer's class ------------------
export class ValueNoise{
  constructor(rng){
    const N = 256;
    this.perm = new Uint8Array(N*2);
    this.grad = new Float32Array(N);
    const p = new Uint8Array(N);
    for (let i=0;i<N;i++){ p[i]=i; this.grad[i]=rng(); }
    for (let i=N-1;i>0;i--){ const j=(rng()*(i+1))|0; const t=p[i]; p[i]=p[j]; p[j]=t; }
    for (let i=0;i<N*2;i++) this.perm[i]=p[i&(N-1)];
  }
  _smooth(t){ return t*t*t*(t*(t*6-15)+10); }
  _val(ix,iy){ return this.grad[(this.perm[(ix & 255) + this.perm[iy & 255]])]; }
  noise(x,y){
    const ix=Math.floor(x), iy=Math.floor(y);
    const fx=x-ix, fy=y-iy;
    const u=this._smooth(fx), v=this._smooth(fy);
    const a=this._val(ix,iy), b=this._val(ix+1,iy);
    const c=this._val(ix,iy+1), d=this._val(ix+1,iy+1);
    const top=a+(b-a)*u, bot=c+(d-c)*u;
    return top+(bot-top)*v; // 0..1
  }
  fbm(x,y,oct,lac,gain){
    let amp=1, freq=1, sum=0, norm=0;
    for(let i=0;i<oct;i++){
      sum += amp * (this.noise(x*freq, y*freq)*2-1);
      norm += amp;
      amp *= gain; freq *= lac;
    }
    return (sum/norm)*0.5 + 0.5;
  }
  ridged(x,y,oct,lac,gain){
    let amp=1, freq=1, sum=0, norm=0;
    for(let i=0;i<oct;i++){
      let n = this.noise(x*freq, y*freq)*2-1;
      n = 1 - Math.abs(n);
      n *= n;
      sum += amp*n; norm += amp;
      amp *= gain; freq *= lac;
    }
    return sum/norm;
  }
}

// ============================================================================
//  HEIGHTMAP — the Cartographer's "continents" pipeline, transplanted intact.
//  (Same warp + fbm + ridged + radial island-mask + continent blobs + bias.)
//  Returns {height, GW, GH} normalised to 0..1; `gain` is the roughness slider.
// ============================================================================
export const LAND_PRESETS = {
  pangaea:     { maskPow:2.0, maskStrength:0.78, baseFreq:2.0, landBias:0.10, blobAmp:0.30, nBlobs:1, blobR:[0.40,0.62], target:0.55 },
  continents:  { maskPow:2.6, maskStrength:0.98, baseFreq:3.0, landBias:0.0,  blobAmp:0.42, nBlobs:3, blobR:[0.20,0.42], target:0.44 },
  archipelago: { maskPow:3.0, maskStrength:1.30, baseFreq:6.0, landBias:-0.14, blobAmp:0.22, nBlobs:9, blobR:[0.07,0.16], target:0.30 },
};

export function generateHeight(seedStr, gain, land='continents', GW=360, GH=240){
  const rng = makeRng(seedStr);
  const noiseRng = makeRng(seedStr + "::height");
  const hN = new ValueNoise(noiseRng);
  const warpN = new ValueNoise(makeRng(seedStr+"::warp"));
  const oct = 7, lac = 2.0;
  const P = LAND_PRESETS[land] || LAND_PRESETS.continents;
  const { maskPow, maskStrength, baseFreq, landBias, blobAmp, nBlobs, blobR } = P;
  const aspect = GW/GH;

  const blobs = [];
  for(let i=0;i<nBlobs;i++){
    blobs.push({
      x: 0.5 + (rng()-0.5)*(land==="archipelago"?0.86:0.7),
      y: 0.5 + (rng()-0.5)*(land==="archipelago"?0.72:0.55),
      r: blobR[0] + rng()*(blobR[1]-blobR[0])
    });
  }

  const N = GW*GH;
  const height = new Float32Array(N);
  let hMin=Infinity, hMax=-Infinity;
  for(let y=0;y<GH;y++){
    const ny = y/GH;
    for(let x=0;x<GW;x++){
      const nx = x/GW;
      const i = y*GW+x;
      const wfx = warpN.fbm(nx*3+11.3, ny*3+5.7, 3, 2, 0.5);
      const wfy = warpN.fbm(nx*3+31.1, ny*3+17.2, 3, 2, 0.5);
      const sx = nx*baseFreq + (wfx-0.5)*0.55;
      const sy = ny*baseFreq + (wfy-0.5)*0.55;
      let h = hN.fbm(sx, sy, oct, lac, gain);
      const ridge = hN.ridged(sx*1.7+3.3, sy*1.7+1.1, 5, 2, 0.55);
      h = h*0.72 + ridge*0.42;
      const dx = (nx-0.5)*aspect, dy=(ny-0.5);
      let d = Math.sqrt(dx*dx + dy*dy) / (0.5*Math.sqrt(aspect*aspect+1));
      let mask = 1 - Math.pow(Math.min(1,d), maskPow);
      let blobBias = 0;
      for(const b of blobs){
        const bdx=(nx-b.x)*aspect, bdy=(ny-b.y);
        const bd = Math.sqrt(bdx*bdx+bdy*bdy);
        blobBias = Math.max(blobBias, 1 - Math.min(1, bd/b.r));
      }
      h = h*maskStrength + (mask-0.5)*0.6 + (blobBias-0.35)*blobAmp + landBias;
      height[i]=h;
      if(h<hMin)hMin=h; if(h>hMax)hMax=h;
    }
  }
  const hr=(hMax-hMin)||1;
  for(let i=0;i<N;i++) height[i]=(height[i]-hMin)/hr;
  return { height, GW, GH, target:P.target };
}

// sea level = the (1-targetLand) percentile of heights (Cartographer's rule).
export function seaLevel(height, targetLand){
  const copy=Float32Array.from(height); copy.sort();
  const frac=1-targetLand;
  let idx=Math.floor(frac*(copy.length-1));
  if(idx<0)idx=0; if(idx>=copy.length)idx=copy.length-1;
  return copy[idx];
}

// ============================================================================
//  MARCHING SQUARES — extract the coastline as the iso-contour height==sea.
//  Standard linearly-interpolated marching squares on the height grid. Returns
//  an array of segments [[x0,y0,x1,y1], …] in unit-square [0,1]² coordinates,
//  PLUS contiguous polylines (segments stitched end-to-end) for the divider walk
//  and the rendered stroke. We keep ONLY contours that enclose land (the coast),
//  not interior lakes-vs-sea ambiguity — every iso=sea contour IS a shoreline.
// ============================================================================
function interp(a, b, va, vb, iso){
  // position of the iso crossing between scalar values va,vb (∈[0,1] of the edge)
  if(Math.abs(va-vb) < 1e-12) return 0.5;
  return (iso - va) / (vb - va);
}
export function marchingSquares(height, GW, GH, iso){
  const segs=[];
  // cell (x,y) corners: TL=(x,y) TR=(x+1,y) BL=(x,y+1) BR=(x+1,y+1)
  const H=(x,y)=>height[y*GW+x];
  for(let y=0;y<GH-1;y++){
    for(let x=0;x<GW-1;x++){
      const tl=H(x,y), tr=H(x+1,y), bl=H(x,y+1), br=H(x+1,y+1);
      let c=0;
      if(tl>iso)c|=8; if(tr>iso)c|=4; if(br>iso)c|=2; if(bl>iso)c|=1;
      if(c===0||c===15) continue;
      // crossing points on each of the four edges (in grid coords)
      const top   = [x+interp(0,1,tl,tr,iso), y];
      const right = [x+1, y+interp(0,1,tr,br,iso)];
      const bottom= [x+interp(0,1,bl,br,iso), y+1];
      const left  = [x, y+interp(0,1,tl,bl,iso)];
      // marching-squares edge table (resolve the two saddle cases 5 & 10
      // consistently via the cell-centre average — keeps contours non-crossing)
      const push=(p,q)=>segs.push([p[0],p[1],q[0],q[1]]);
      switch(c){
        case 1: push(left,bottom); break;
        case 2: push(bottom,right); break;
        case 3: push(left,right); break;
        case 4: push(top,right); break;
        case 5: { const mid=(tl+tr+bl+br)/4;
                  if(mid>iso){ push(left,top); push(bottom,right); }
                  else        { push(left,bottom); push(top,right); } break; }
        case 6: push(top,bottom); break;
        case 7: push(left,top); break;
        case 8: push(top,left); break;
        case 9: push(top,bottom); break;
        case 10:{ const mid=(tl+tr+bl+br)/4;
                  if(mid>iso){ push(top,right); push(left,bottom); }
                  else        { push(top,left); push(bottom,right); } break; }
        case 11: push(top,right); break;
        case 12: push(right,left); break;
        case 13: push(bottom,right); break;
        case 14: push(left,bottom); break;
      }
    }
  }
  // normalise to the unit square
  const sx=1/(GW-1), sy=1/(GH-1);
  return segs.map(s=>[s[0]*sx, s[1]*sy, s[2]*sx, s[3]*sy]);
}

// Stitch a soup of segments into contiguous polylines (greedy, by endpoint).
// Returns an array of polylines, each a flat [x0,y0,x1,y1,…]; closed loops too.
export function stitch(segs, eps=1e-6){
  const key=(x,y)=>Math.round(x/eps)+','+Math.round(y/eps);
  const adj=new Map();   // endpoint key -> list of {seg index, far endpoint}
  const used=new Uint8Array(segs.length);
  const add=(k,rec)=>{ if(!adj.has(k))adj.set(k,[]); adj.get(k).push(rec); };
  segs.forEach((s,i)=>{
    const a=[s[0],s[1]], b=[s[2],s[3]];
    add(key(a[0],a[1]), {i, from:a, to:b});
    add(key(b[0],b[1]), {i, from:b, to:a});
  });
  const polylines=[];
  for(let i=0;i<segs.length;i++){
    if(used[i]) continue;
    used[i]=1;
    const s=segs[i];
    let pts=[[s[0],s[1]],[s[2],s[3]]];
    // extend forward from the tail, then reverse and extend the other way
    for(let dir=0;dir<2;dir++){
      let grow=true;
      while(grow){
        grow=false;
        const tail=pts[pts.length-1];
        const cands=adj.get(key(tail[0],tail[1]))||[];
        for(const r of cands){
          if(used[r.i]) continue;
          // r.from must match tail
          if(key(r.from[0],r.from[1])!==key(tail[0],tail[1])) continue;
          used[r.i]=1; pts.push([r.to[0],r.to[1]]); grow=true; break;
        }
      }
      pts.reverse();
    }
    const flat=[]; for(const [x,y] of pts) flat.push(x,y);
    polylines.push(flat);
  }
  return polylines;
}

// Pull the single largest coastline (the "mainland") — longest stitched polyline.
export function mainCoast(polylines){
  let best=null, bestLen=-1;
  for(const pl of polylines){
    let L=0;
    for(let i=0;i<pl.length-2;i+=2) L+=Math.hypot(pl[i+2]-pl[i], pl[i+3]-pl[i+1]);
    if(L>bestLen){ bestLen=L; best=pl; }
  }
  return best||[];
}

// ============================================================================
//  THE DIVIDER / RULER METHOD (Richardson). Walk a polyline with a compass of
//  fixed opening ε. From the current compass point, set the next compass point
//  where the path FIRST crosses the circle of radius ε about it — i.e. the next
//  point at *straight-line* (Euclidean) distance ε ahead. Each such jump is one
//  ε. A big compass strides across wiggles (chord shortcuts ⇒ short coast); a
//  small one threads every inlet (⇒ long coast). The measured length
//  L(ε) = (#steps)·ε. For a fractal coast L(ε) ∝ ε^(1−D), so log L vs log ε has
//  slope (1−D) ⇒ D = 1 − slope.
// ============================================================================
export function dividerLength(poly, eps){
  if(poly.length<4 || eps<=0) return {L:0, steps:0};
  let steps=0;
  let cx=poly[0], cy=poly[1];       // current compass anchor
  let i=0;                          // index of the vertex we are walking FROM
  let fx=poly[0], fy=poly[1];       // our current position along the path
  const last=poly.length-2;
  let guard=0;
  while(i<last && guard++ < poly.length*4){
    // Find the next point on the path at Euclidean distance == eps from (cx,cy).
    // Advance vertex-by-vertex; on the segment that exits the ε-circle, solve the
    // ray/circle intersection for the exact crossing point.
    let placed=false;
    let px=fx, py=fy, j=i;
    while(j<last){
      const nx=poly[j+2], ny=poly[j+3];
      // distance from anchor to the segment's far end
      const dEnd=Math.hypot(nx-cx, ny-cy);
      if(dEnd>=eps){
        // the circle of radius eps about (cx,cy) is crossed on segment px→nx.
        // solve |(px + t·d) - c| = eps  for the smallest t∈[0,1].
        const dx=nx-px, dy=ny-py;
        const ox=px-cx, oy=py-cy;
        const A=dx*dx+dy*dy;
        const B=2*(ox*dx+oy*dy);
        const Cc=ox*ox+oy*oy-eps*eps;
        const disc=B*B-4*A*Cc;
        let t=1;
        if(A>1e-18 && disc>=0){
          const sd=Math.sqrt(disc);
          const t1=(-B-sd)/(2*A), t2=(-B+sd)/(2*A);
          // smallest root in (0,1]; if px is already outside, take the entry root
          t = (t1>1e-9 && t1<=1) ? t1 : ((t2>1e-9 && t2<=1) ? t2 : 1);
        }
        const hx=px+dx*t, hy=py+dy*t;
        cx=hx; cy=hy; fx=hx; fy=hy; i=j;   // new anchor & position; stay on seg j
        steps++; placed=true; break;
      }
      px=nx; py=ny; j+=2;
    }
    if(!placed){
      // ran off the end inside the last ε-circle: add the leftover fractional step
      const tailLen=Math.hypot(poly[last]-cx, poly[last+1]-cy);
      steps += tailLen/eps;
      break;
    }
  }
  return {L:steps*eps, steps};
}

// Run the divider over a geometric ladder of ε and fit D = 1 − slope(logL,logε).
export function dividerDimension(poly, nScales=10){
  // total chord length sets the scale band
  let total=0;
  for(let i=0;i<poly.length-2;i+=2) total+=Math.hypot(poly[i+2]-poly[i], poly[i+3]-poly[i+1]);
  const epsMax=total/8;       // big compass: a handful of steps
  const epsMin=total/400;     // small compass: fine resolution (above grid grain)
  const xs=[], ys=[], pts=[];
  for(let k=0;k<nScales;k++){
    const f=k/(nScales-1);
    const eps=epsMax*Math.pow(epsMin/epsMax, f);
    const {L}=dividerLength(poly, eps);
    if(L>0){ xs.push(Math.log(eps)); ys.push(Math.log(L)); pts.push({eps, L, logEps:Math.log(eps), logL:Math.log(L)}); }
  }
  const n=xs.length;
  let sx=0,sy=0,sxx=0,sxy=0;
  for(let i=0;i<n;i++){ sx+=xs[i]; sy+=ys[i]; sxx+=xs[i]*xs[i]; sxy+=xs[i]*ys[i]; }
  const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  const intercept=(sy-slope*sx)/n;
  const ybar=sy/n; let ssR=0,ssT=0;
  for(let i=0;i<n;i++){ const pr=slope*xs[i]+intercept; ssR+=(ys[i]-pr)**2; ssT+=(ys[i]-ybar)**2; }
  return { D:1-slope, slope, intercept, r2: ssT>0?1-ssR/ssT:1, points:pts };
}

// ============================================================================
//  BOX-COUNTING (the same algorithm as the Coastline Rule bench, ported).
//  rasterise the coastline segments → occupancy grid → count touched super-cells
//  over a geometric ladder → fit the linear scaling window.
// ============================================================================
export function rasteriseSegs(segs, RES){
  const grid=new Uint8Array(RES*RES);
  const set=(x,y)=>{ const gx=Math.floor(x*RES), gy=Math.floor(y*RES);
    if(gx>=0&&gy>=0&&gx<RES&&gy<RES) grid[gy*RES+gx]=1; };
  for(const s of segs){
    const ax=s[0],ay=s[1],bx=s[2],by=s[3];
    const dist=Math.hypot(bx-ax,by-ay)*RES;
    const steps=Math.max(1, Math.ceil(dist*1.6));
    for(let k=0;k<=steps;k++){ const t=k/steps; set(ax+(bx-ax)*t, ay+(by-ay)*t); }
  }
  return grid;
}
export function boxCount(grid, RES, nScales=12){
  const ks=[]; const kmax=Math.max(4, Math.floor(RES/4)); const kmin=2;
  for(let i=0;i<nScales;i++){
    const f=i/(nScales-1);
    let k=Math.round(kmin*Math.pow(kmax/kmin, f));
    if(ks.length===0 || k>ks[ks.length-1]) ks.push(k);
  }
  const boxSizes=[], counts=[];
  for(const k of ks){
    const nb=Math.ceil(RES/k);
    const touched=new Uint8Array(nb*nb);
    for(let gy=0;gy<RES;gy++){
      const row=gy*RES, by=(gy/k)|0;
      for(let gx=0;gx<RES;gx++){ if(grid[row+gx]) touched[by*nb+((gx/k)|0)]=1; }
    }
    let c=0; for(let i=0;i<touched.length;i++) c+=touched[i];
    if(c>0){ boxSizes.push(k); counts.push(c); }
  }
  return { boxSizes, counts, RES };
}
function lineFit(xs, ys, lo, hi){
  const n=hi-lo; let sx=0,sy=0,sxx=0,sxy=0;
  for(let i=lo;i<hi;i++){ sx+=xs[i]; sy+=ys[i]; sxx+=xs[i]*xs[i]; sxy+=xs[i]*ys[i]; }
  const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  const intercept=(sy-slope*sx)/n;
  const ybar=sy/n; let ssR=0,ssT=0;
  for(let i=lo;i<hi;i++){ const pr=slope*xs[i]+intercept; ssR+=(ys[i]-pr)**2; ssT+=(ys[i]-ybar)**2; }
  return { slope, intercept, r2: ssT>0?1-ssR/ssT:1, n };
}
export function fitDimension(bc, opts={}){
  const { boxSizes, counts, RES }=bc;
  const xs=[], ys=[], points=[];
  for(let i=0;i<boxSizes.length;i++){
    const eps=boxSizes[i]/RES;
    xs.push(Math.log(1/eps)); ys.push(Math.log(counts[i]));
    points.push({ logInvEps:Math.log(RES/boxSizes[i]), logN:Math.log(counts[i]), boxSize:boxSizes[i], count:counts[i], inWindow:true });
  }
  const N=xs.length;
  const satSlope=opts.satSlope ?? 0.35;
  let satEnd=0;
  for(let i=0;i<N-1;i++){
    const local=(ys[i+1]-ys[i])/(xs[i+1]-xs[i]);
    if(local < satSlope) satEnd=i+1; else break;
  }
  let lo=satEnd, hi=N;
  const minWin=Math.min(5, N-satEnd);
  let best=null;
  for(let a=satEnd;a<=N-minWin;a++) for(let b=a+minWin;b<=N;b++){
    const f=lineFit(xs,ys,a,b);
    if(!isFinite(f.slope)) continue;
    const score=f.r2 + 0.006*(b-a);
    if(!best || score>best.score) best={a,b,score,f};
  }
  if(best){ lo=best.a; hi=best.b; }
  for(let i=0;i<N;i++) points[i].inWindow=(i>=lo && i<hi);
  const f=lineFit(xs,ys,lo,hi);
  return { D:f.slope, intercept:f.intercept, r2:f.r2, points, window:{lo,hi} };
}
export function boxDimension(segs, RES=768, nScales=14){
  const grid=rasteriseSegs(segs, RES);
  const bc=boxCount(grid, RES, nScales);
  return fitDimension(bc);
}

// ============================================================================
//  THEORY — the dimension the Cartographer's roughness slider IMPLIES.
//  An fBm with persistence `gain` has Hurst exponent H = −log2(gain) (the
//  amplitude halves by `gain` each time the frequency doubles). Its level sets
//  (coastlines) have box-counting dimension D = 2 − H, clamped to [1,2].
// ============================================================================
export function hurstFromGain(gain){ return -Math.log2(gain); }
export function predictedCoastD(gain){
  const H=hurstFromGain(gain);
  return Math.max(1, Math.min(2, 2-H));
}

// ============================================================================
//  ALL-IN-ONE — generate a realm's coast and measure it every way.
//  Returns the segments, the main coast polyline, and the three dimensions.
// ============================================================================
export function measureCoast(seedStr, gain, land='continents', GW=360, GH=240){
  const { height, target } = generateHeight(seedStr, gain, land, GW, GH);
  const sea = seaLevel(height, target);
  const segs = marchingSquares(height, GW, GH, sea);
  const polys = stitch(segs);
  const main = mainCoast(polys);
  const box = boxDimension(segs);
  const div = dividerDimension(main);
  const predicted = predictedCoastD(gain);
  return { height, GW, GH, sea, segs, polys, main, box, div, predicted,
           H:hurstFromGain(gain), nLoops:polys.length };
}
