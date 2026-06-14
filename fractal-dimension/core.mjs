// ============================================================================
//  The Coastline Rule — box-counting fractal-dimension CORE
//  Pure, dependency-free. Identical code is inlined into index.html; this file
//  is the Node-testable twin (the falsifiability harness runs against it).
//
//  The promise: box-counting D = lim_{ε→0} log N(ε) / log(1/ε), where N(ε) is
//  the number of grid cells of side ε that the set touches. For a self-similar
//  set this slope hits a KNOWN closed form (Koch → log4/log3, Sierpiński →
//  log3/log2, …). We measure it and assert it matches. The dimension is not
//  drawn — it is MEASURED, and the measurement is falsifiable.
// ============================================================================

// --- deterministic PRNG (mulberry32) so generated sets are seed-reproducible -
export function rng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
//  GENERATORS — each returns geometry in the unit square [0,1]×[0,1].
//  Curves return an array of polylines (each a flat [x0,y0,x1,y1,…]).
//  Area-filling sets return {tiles:[[x,y,w,h],…]} we sample as points.
// ============================================================================

// Koch curve — replace each segment by 4 segments (the classic _/\_ bump).
// Exact dimension log4/log3 ≈ 1.261859.
export function koch(iter){
  let pts = [[0.04,0.62],[0.96,0.62]];
  for(let it=0; it<iter; it++){
    const next=[pts[0]];
    for(let i=0;i<pts.length-1;i++){
      const [ax,ay]=pts[i], [bx,by]=pts[i+1];
      const dx=(bx-ax), dy=(by-ay);
      const p1=[ax+dx/3, ay+dy/3];
      const p3=[ax+2*dx/3, ay+2*dy/3];
      // peak of the bump: rotate (p3-p1) by -60° about p1
      const ux=dx/3, uy=dy/3, c=Math.cos(-Math.PI/3), s=Math.sin(-Math.PI/3);
      const p2=[p1[0]+ux*c-uy*s, p1[1]+ux*s+uy*c];
      next.push(p1,p2,p3,[bx,by]);
    }
    pts=next;
  }
  return [flat(pts)];
}

// Koch snowflake — three Koch curves around a triangle (D identical, log4/log3).
export function snowflake(iter){
  const A=[0.5,0.10], B=[0.895,0.78], C=[0.105,0.78];
  return [kochEdge(A,B,iter), kochEdge(B,C,iter), kochEdge(C,A,iter)].map(flat);
}
function kochEdge(A,B,iter){
  let pts=[A,B];
  for(let it=0; it<iter; it++){
    const next=[pts[0]];
    for(let i=0;i<pts.length-1;i++){
      const [ax,ay]=pts[i], [bx,by]=pts[i+1];
      const dx=bx-ax, dy=by-ay;
      const p1=[ax+dx/3, ay+dy/3], p3=[ax+2*dx/3, ay+2*dy/3];
      const ux=dx/3, uy=dy/3, c=Math.cos(-Math.PI/3), s=Math.sin(-Math.PI/3);
      const p2=[p1[0]+ux*c-uy*s, p1[1]+ux*s+uy*c];
      next.push(p1,p2,p3,[bx,by]);
    }
    pts=next;
  }
  return pts;
}

// Sierpiński triangle by the chaos game → returns dense points.
// Exact dimension log3/log2 ≈ 1.584963.
export function sierpinski(iter, seed){
  const r=rng((seed|0)+101);
  const V=[[0.5,0.06],[0.05,0.92],[0.95,0.92]];
  const n=Math.min(60000, 1200*Math.pow(2,iter));
  let x=0.4,y=0.4; const out=[];
  for(let i=0;i<200;i++){ const v=V[(r()*3)|0]; x=(x+v[0])/2; y=(y+v[1])/2; }
  for(let i=0;i<n;i++){ const v=V[(r()*3)|0]; x=(x+v[0])/2; y=(y+v[1])/2; out.push([x,y]); }
  return {points:out};
}

// Sierpiński carpet — the deterministic IFS (8 of 9 sub-squares kept).
// Exact dimension log8/log3 ≈ 1.892789.
export function carpet(iter){
  let tiles=[[0.02,0.02,0.96,0.96]];
  for(let it=0; it<iter; it++){
    const next=[];
    for(const [x,y,w,h] of tiles){
      const w3=w/3, h3=h/3;
      for(let r=0;r<3;r++) for(let c=0;c<3;c++){
        if(r===1&&c===1) continue;                 // drop the centre
        next.push([x+c*w3, y+r*h3, w3, h3]);
      }
    }
    tiles=next;
  }
  return {tiles};
}

// A fractal coastline by 1-D midpoint displacement (fractional Brownian).
// roughness H ∈ (0,1) sets the smoothness; D = 2 − H for the graph of an fBm.
// (We expose the predicted D so the test can check the measurement tracks H.)
export function coastline(level, H, seed){
  const r=rng((seed|0)+7);
  let n=Math.pow(2,level)+1;
  const ys=new Float64Array(n);
  ys[0]=0.5; ys[n-1]=0.5;
  let step=(n-1), amp=0.30;
  while(step>1){
    const half=step>>1;
    for(let i=half;i<n;i+=step){
      const a=ys[i-half], b=ys[i+half<n? i+half : n-1];
      ys[i]=(a+b)/2 + (r()*2-1)*amp;
    }
    amp *= Math.pow(0.5, H);
    step=half;
  }
  // clamp & map to a polyline across the unit square
  const poly=[];
  for(let i=0;i<n;i++){
    const x=0.03+0.94*(i/(n-1));
    let y=ys[i]; y=Math.max(0.05,Math.min(0.95,y));
    poly.push([x,y]);
  }
  return {polylines:[flat(poly)], predictedD: 2-H};
}

// Diffusion-limited aggregation — Brownian sticky walkers build a dendrite.
// Empirical 2-D DLA dimension ≈ 1.71 (Witten–Sander). The branchy, screened
// dendrite is the canonical "fractal grown by a physical process".
// Walkers launch on a circle just outside the cluster, random-walk (with big
// adaptive jumps when far away, for speed), and freeze on first contact.
export function dla(nParticles, seed){
  const r=rng((seed|0)+999);
  const G=512, occ=new Uint8Array(G*G);
  const pts=[];
  const cx=G/2|0, cy=G/2|0;
  const idx=(x,y)=>y*G+x;
  occ[idx(cx,cy)]=1; pts.push([cx,cy]);
  const radii=[0];                          // radius of each stuck particle (for mass–radius)
  let R=1;                                  // current cluster radius (cells)
  const maxR=G/2-8;
  for(let p=0; p<nParticles; p++){
    const launchR=Math.min(R+5, maxR);
    const killR=launchR*2+20;
    let ang=r()*2*Math.PI;
    let x=Math.round(cx+launchR*Math.cos(ang));
    let y=Math.round(cy+launchR*Math.sin(ang));
    let stuck=false, steps=0;
    while(!stuck && steps++<60000){
      const dr=Math.hypot(x-cx,y-cy);
      // adaptive: if far from the cluster envelope, take a big radial-safe jump
      const slack=dr-launchR;
      if(slack>3){
        const jump=Math.max(1, Math.floor(slack-1));
        const ja=r()*2*Math.PI;
        x=Math.round(x+jump*Math.cos(ja)); y=Math.round(y+jump*Math.sin(ja));
      } else {
        const d=(r()*4)|0;
        x += d===0?1:d===1?-1:0;
        y += d===2?1:d===3?-1:0;
      }
      const dr2=Math.hypot(x-cx,y-cy);
      if(dr2>killR || x<2||y<2||x>=G-2||y>=G-2){
        ang=r()*2*Math.PI; x=Math.round(cx+launchR*Math.cos(ang)); y=Math.round(cy+launchR*Math.sin(ang)); continue;
      }
      if(occ[idx(x+1,y)]||occ[idx(x-1,y)]||occ[idx(x,y+1)]||occ[idx(x,y-1)]){
        occ[idx(x,y)]=1; pts.push([x,y]);
        const rr=Math.hypot(x-cx,y-cy); radii.push(rr); if(rr>R) R=rr;
        stuck=true;
      }
    }
    if(R>=maxR) break;
  }
  const out=pts.map(([x,y])=>[ (x-cx)/(G) + 0.5, (y-cy)/(G) + 0.5 ]);
  return {points:out, predictedD:1.71, _radii:radii, _R:R, _G:G};
}

// ============================================================================
//  MASS–RADIUS DIMENSION — the canonical estimator for a cluster grown around
//  a seed: M(r) ∝ r^D, where M(r) counts particles within radius r of the
//  centre. The log-log slope of M vs r IS the fractal dimension. This is the
//  RIGHT ruler for DLA (box-counting under-reads a sparse, screened dendrite).
// ============================================================================
export function massRadiusDimension(dlaResult, nScales=14){
  const radii=(dlaResult._radii||[]).slice().sort((a,b)=>a-b);
  const N=radii.length;
  if(N<20) return {D:NaN, r2:0, points:[]};
  const Rmax=radii[N-1];
  const rmin=Math.max(4, Rmax*0.06);        // skip the dense seed core (lattice artefacts)
  const rmax=Rmax*0.75;                      // skip the sparse outer edge (finite-size)
  const xs=[], ys=[], pts=[];
  for(let i=0;i<nScales;i++){
    const f=i/(nScales-1);
    const rr=rmin*Math.pow(rmax/rmin, f);
    // M(rr) = #particles with radius ≤ rr (binary search on the sorted list)
    let lo=0, hi=N; while(lo<hi){ const mid=(lo+hi)>>1; if(radii[mid]<=rr) lo=mid+1; else hi=mid; }
    const M=lo;
    if(M>1){ xs.push(Math.log(rr)); ys.push(Math.log(M)); pts.push({r:rr, M, logr:Math.log(rr), logM:Math.log(M)}); }
  }
  const n=xs.length;
  let sx=0,sy=0,sxx=0,sxy=0;
  for(let i=0;i<n;i++){ sx+=xs[i]; sy+=ys[i]; sxx+=xs[i]*xs[i]; sxy+=xs[i]*ys[i]; }
  const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  const intercept=(sy-slope*sx)/n;
  const ybar=sy/n; let ssR=0,ssT=0;
  for(let i=0;i<n;i++){ const pr=slope*xs[i]+intercept; ssR+=(ys[i]-pr)**2; ssT+=(ys[i]-ybar)**2; }
  return {D:slope, intercept, r2: ssT>0?1-ssR/ssT:1, points:pts};
}

// --- control sets (NOT fractal) — the test's negative controls ---------------
// A circle: a smooth 1-D curve. Box-counting D → 1.
export function circle(){
  const poly=[]; const n=2000, R=0.44;
  for(let i=0;i<=n;i++){ const t=2*Math.PI*i/n; poly.push([0.5+R*Math.cos(t),0.5+R*Math.sin(t)]); }
  return [flat(poly)];
}
// A filled disc: a 2-D region. Box-counting D → 2.
export function disc(){
  const pts=[]; const R=0.44;
  for(let i=0;i<260;i++) for(let j=0;j<260;j++){
    const x=i/259, y=j/259;
    if((x-0.5)*(x-0.5)+(y-0.5)*(y-0.5)<=R*R) pts.push([x,y]);
  }
  return {points:pts};
}

// ============================================================================
//  RASTERISE — turn any geometry into an occupancy grid at native resolution.
//  We rasterise ONCE at fine resolution, then box-count by coarsening that grid
//  (a box of side ε is "touched" iff any fine cell inside it is occupied). This
//  is the standard, bias-controlled way to box-count a rasterised set.
// ============================================================================
export function rasterise(geo, RES){
  const grid=new Uint8Array(RES*RES);
  const set=(x,y)=>{
    const gx=Math.floor(x*RES), gy=Math.floor(y*RES);
    if(gx>=0&&gy>=0&&gx<RES&&gy<RES) grid[gy*RES+gx]=1;
  };
  const drawSeg=(ax,ay,bx,by)=>{
    const dist=Math.hypot(bx-ax,by-ay)*RES;
    const steps=Math.max(1, Math.ceil(dist*1.6));
    for(let s=0;s<=steps;s++){ const t=s/steps; set(ax+(bx-ax)*t, ay+(by-ay)*t); }
  };
  if(Array.isArray(geo)){                       // array of flat polylines
    for(const pl of geo) for(let i=0;i<pl.length-2;i+=2) drawSeg(pl[i],pl[i+1],pl[i+2],pl[i+3]);
  } else if(geo.polylines){
    for(const pl of geo.polylines) for(let i=0;i<pl.length-2;i+=2) drawSeg(pl[i],pl[i+1],pl[i+2],pl[i+3]);
  } else if(geo.points){
    for(const [x,y] of geo.points) set(x,y);
  } else if(geo.tiles){
    for(const [x,y,w,h] of geo.tiles){
      const x0=Math.floor(x*RES), y0=Math.floor(y*RES);
      const x1=Math.ceil((x+w)*RES), y1=Math.ceil((y+h)*RES);
      for(let gy=y0;gy<y1;gy++) for(let gx=x0;gx<x1;gx++)
        if(gx>=0&&gy>=0&&gx<RES&&gy<RES) grid[gy*RES+gx]=1;
    }
  }
  return grid;
}

// ============================================================================
//  BOX COUNT — for box side = k native cells, count occupied super-cells.
//  Returns {boxSizes:[…], counts:[…]} sampled over a geometric ladder of k.
// ============================================================================
export function boxCount(grid, RES, nScales=8){
  // choose divisor sizes k that evenly tile RES where possible; geometric ladder
  const ks=[];
  // build a set of integer box sizes spread geometrically from ~2 to RES/4
  const kmax=Math.max(4, Math.floor(RES/4));
  const kmin=2;
  for(let i=0;i<nScales;i++){
    const f=i/(nScales-1);
    let k=Math.round(kmin*Math.pow(kmax/kmin, f));
    if(ks.length===0 || k>ks[ks.length-1]) ks.push(k);
  }
  const boxSizes=[], counts=[];
  for(const k of ks){
    const nb=Math.ceil(RES/k);
    const touched=new Uint8Array(nb*nb);
    // single pass over occupied cells → mark their super-cell
    for(let gy=0;gy<RES;gy++){
      const row=gy*RES, by=(gy/k)|0;
      for(let gx=0;gx<RES;gx++){
        if(grid[row+gx]){ touched[by*nb+((gx/k)|0)]=1; }
      }
    }
    let c=0; for(let i=0;i<touched.length;i++) c+=touched[i];
    if(c>0){ boxSizes.push(k); counts.push(c); }
  }
  return {boxSizes, counts, RES};
}

// ============================================================================
//  LINEAR REGRESSION — slope of log N(ε) vs log(1/ε).
//  ε = boxSize/RES (fraction of the unit square). 1/ε = RES/boxSize.
//  Returns {D, intercept, r2, points:[{logInvEps, logN}]}.
// ============================================================================
function lineFit(xs, ys, lo, hi){
  const n=hi-lo; let sx=0,sy=0,sxx=0,sxy=0;
  for(let i=lo;i<hi;i++){ sx+=xs[i]; sy+=ys[i]; sxx+=xs[i]*xs[i]; sxy+=xs[i]*ys[i]; }
  const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  const intercept=(sy-slope*sx)/n;
  const ybar=sy/n; let ssR=0,ssT=0;
  for(let i=lo;i<hi;i++){ const pr=slope*xs[i]+intercept; ssR+=(ys[i]-pr)**2; ssT+=(ys[i]-ybar)**2; }
  return {slope, intercept, r2: ssT>0?1-ssR/ssT:1, n};
}

export function fitDimension(bc, opts={}){
  const {boxSizes, counts, RES}=bc;
  const xs=[], ys=[], points=[];
  for(let i=0;i<boxSizes.length;i++){
    const eps=boxSizes[i]/RES;
    xs.push(Math.log(1/eps));
    ys.push(Math.log(counts[i]));
    points.push({logInvEps:Math.log(RES/boxSizes[i]), logN:Math.log(counts[i]), boxSize:boxSizes[i], count:counts[i], inWindow:true});
  }
  const N=xs.length;
  // Saturation guard: at the finest box sizes the count PLATEAUS — halving ε no
  // longer multiplies the count (the boxes are at the rasterisation grain). The
  // signature is a local log-log slope near 0, independent of the shape. Drop
  // such fine-end scales: they carry no scaling information. (xs increases with
  // 1/ε, so i=0 is the finest box.)
  const satSlope=opts.satSlope ?? 0.35;
  let satEnd=0;
  if(opts.auto!==false && opts.trim===undefined){
    for(let i=0;i<N-1;i++){
      const local=(ys[i+1]-ys[i])/(xs[i+1]-xs[i]);   // local D between scale i and i+1
      if(local < satSlope) satEnd=i+1; else break;
    }
  }
  // Two ways to choose the fit window:
  //  • explicit trim (symmetric) — kept for callers that want it
  //  • automatic — find the contiguous SCALING WINDOW (≥ minWin scales) with the
  //    best R² (length lightly rewarded), dropping the saturated fine end + the
  //    single-box coarse end. This is the honest way real box-counting works:
  //    D is the slope of the LINEAR region of the log-log plot, not the whole curve.
  let lo=satEnd, hi=N;
  if(opts.trim>0){ lo=opts.trim; hi=N-opts.trim; }
  else if(opts.auto!==false){
    const minWin=Math.min(5, N-satEnd);
    let best=null;
    for(let a=satEnd;a<=N-minWin;a++) for(let b=a+minWin;b<=N;b++){
      const f=lineFit(xs,ys,a,b);
      if(!isFinite(f.slope)) continue;
      // reward linearity, lightly reward length (so R² dominates the choice)
      const score=f.r2 + 0.006*(b-a);
      if(!best || score>best.score) best={a,b,score,f};
    }
    if(best){ lo=best.a; hi=best.b; }
    else { lo=satEnd; hi=N; }
  }
  for(let i=0;i<N;i++) points[i].inWindow = (i>=lo && i<hi);
  const f=lineFit(xs,ys,lo,hi);
  return {D:f.slope, intercept:f.intercept, r2:f.r2, points, window:{lo,hi}};
}

// convenience: measure D of any geometry end-to-end (auto scaling-window by default)
export function measureD(geo, RES=512, nScales=12, opts={}){
  const grid=rasterise(geo, RES);
  const bc=boxCount(grid, RES, nScales);
  return fitDimension(bc, opts);
}

// --- helpers -----------------------------------------------------------------
function flat(pts){ const a=[]; for(const [x,y] of pts){ a.push(x,y); } return a; }

// known closed-form dimensions (for the bench captions + the test)
export const EXACT = {
  koch: Math.log(4)/Math.log(3),        // 1.261859507
  snowflake: Math.log(4)/Math.log(3),
  sierpinski: Math.log(3)/Math.log(2),  // 1.584962500
  carpet: Math.log(8)/Math.log(3),      // 1.892789261
  circle: 1,
  disc: 2,
};
