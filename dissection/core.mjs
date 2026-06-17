// === CORE BEGIN ===
// The Dissection Bench — geometry core (single source of truth).
// Bolyai–Gerwien made touchable: two equal-area polygons are scissors-congruent, and HERE the
// re-assembly is a rigid SWING — every piece glides along a fixed axis, nothing scales, so the
// silhouette can only fold the one true way. We enact PERIGAL's dissection of the Pythagorean theorem
// via the Pythagorean tiling: the plane is tiled by b-squares on the lattice {m·(b,a)+n·(−a,b)}; one
// fundamental cell is a c-square of area b²+a²=c². Clipping the b-square tiling to one c-cell yields
// FOUR pieces of b² + a whole a-square that exactly fill the c-square; each piece's lattice vector is
// exactly the rigid glide that carries it back to ONE b-square. This module is the SOLE authority for
// perigal(a,b) (the 4 pieces + their source-square poses + their c-cell poses + the a-square), poseAt
// (the swing at θ∈[0,1]), polyArea (shoelace) and clipToConvex (Sutherland–Hodgman). It is inlined
// byte-identical into index.html between the CORE BEGIN/END sentinels and tested by core.test.mjs —
// page & test can never drift. THE CLAIM IT PROVES: a²+b² === c² for the actual legs; the 4 pieces +
// a-square tile the c-cell with ZERO overlap (sampled once-coverage === 1) AND, translated by their
// lattice vectors, exactly tile one b-square; and Σ(all piece areas) === c² to machine-ε at EVERY
// swing-angle θ (rigid glide conserves area exactly). A deliberately mis-set lattice (badPerigal) makes
// the pieces overlap / leave a gap against the c-square — the honest counter-example.

// ---- pure helpers ----
const dist=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]);
function polyArea(pts){
  let s=0; const n=pts.length;
  for(let i=0;i<n;i++){ const [x1,y1]=pts[i],[x2,y2]=pts[(i+1)%n]; s += x1*y2 - x2*y1; }
  return Math.abs(s)/2;
}
// point-in-polygon (ray cast) — used by the coverage self-test.
function pointInPoly(poly,x,y){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}
// Sutherland–Hodgman clip of `poly` by convex polygon `clipPoly` (CCW).
function clipToConvex(poly, clipPoly){
  let out=poly.slice();
  for(let e=0;e<clipPoly.length;e++){
    const A=clipPoly[e], B=clipPoly[(e+1)%clipPoly.length];
    const inside=P=>((B[0]-A[0])*(P[1]-A[1])-(B[1]-A[1])*(P[0]-A[0]))>=-1e-9;
    const inter=(P,Q)=>{
      const d1=(B[0]-A[0])*(P[1]-A[1])-(B[1]-A[1])*(P[0]-A[0]);
      const d2=(B[0]-A[0])*(Q[1]-A[1])-(B[1]-A[1])*(Q[0]-A[0]);
      const t=d1/(d1-d2); return [P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])];
    };
    const inp=out; out=[];
    for(let i=0;i<inp.length;i++){
      const P=inp[i],Q=inp[(i+1)%inp.length], Pi=inside(P), Qi=inside(Q);
      if(Pi){ out.push(P); if(!Qi) out.push(inter(P,Q)); }
      else if(Qi) out.push(inter(P,Q));
    }
    if(!out.length) break;
  }
  return out;
}

// perigal(a,b) — the verified Pythagorean-tiling dissection.
function perigal(a, b){
  const A=Math.min(a,b), B=Math.max(a,b), c=Math.hypot(a,b);
  const p=[B, A], q=[-A, B];                 // c-square lattice basis (|p|=|q|=c, p⊥q)
  // one fundamental c-cell, anchored so its centroid is the origin (centre the whole figure)
  const cellRaw=[[0,0], p, [p[0]+q[0],p[1]+q[1]], q];
  const cen=poly=>{ let x=0,y=0; poly.forEach(P=>{x+=P[0];y+=P[1];}); return [x/poly.length,y/poly.length]; };
  const o=cen(cellRaw);
  const cell=cellRaw.map(P=>[P[0]-o[0],P[1]-o[1]]);
  const bAt=(cx,cy)=>[[cx-B/2,cy-B/2],[cx+B/2,cy-B/2],[cx+B/2,cy+B/2],[cx-B/2,cy+B/2]];
  // clip every nearby b-square into the cell → the 4 fragments + their source lattice (m,n)
  const frags=[];
  for(let m=-2;m<=2;m++) for(let n=-2;n<=2;n++){
    const cx=m*p[0]+n*q[0]-o[0], cy=m*p[1]+n*q[1]-o[1];
    const cl=clipToConvex(bAt(cx,cy), cell);
    if(cl.length>=3 && polyArea(cl)>1e-7) frags.push({ m,n, cellPose:cl });
  }
  // each fragment's source pose = translate it back to ONE b-square. The lattice glide −(m·p+n·q)
  // lands every fragment in the b-square centred at −o; we then re-centre that home b-square on the
  // origin (shift by +o) so BOTH endpoints sit in view. The net source glide is therefore
  // −(m·p+n·q)+o, a pure rigid translation; the home b-square is bAt(0,0).
  const pieces=frags.map(f=>{
    const tv=[ -(f.m*p[0]+f.n*q[0]) + o[0], -(f.m*p[1]+f.n*q[1]) + o[1] ];
    const srcPose=f.cellPose.map(P=>[P[0]+tv[0], P[1]+tv[1]]);
    return { cellPose:f.cellPose, srcPose };
  });
  // the a-square fragment: the part of the cell NOT covered by any b-fragment. Its source pose is the
  // a-square drawn whole (centre of the cell); in the cell it occupies the central hole.
  const aSquareSrc=[[-A/2,-A/2],[A/2,-A/2],[A/2,A/2],[-A/2,A/2]];
  return { a,b,c, A,B, p,q, cell, pieces, aSquareSrc, bSquare:bAt(0,0) };
}

// poseAt(g, theta) — the swing. θ=0: pieces in their b-square source poses (the bigger leg-square,
// whole) + the a-square off to the side. θ=1: pieces in their c-cell poses (assembled c-square).
// Each piece glides linearly between its two poses — a pure rigid translation per piece.
function poseAt(g, theta){
  const t=theta;
  // the a-square translates from its parked source position (to the right of the b-square) into the
  // central hole of the c-cell. Parked position: just right of the b-square.
  const park=[ g.B/2 + g.A/2 + 0.18*g.c, 0 ];
  const aPolyFrom=g.aSquareSrc.map(P=>[P[0]+park[0], P[1]+park[1]]);
  const aPolyTo=g.aSquareSrc;                       // central hole
  const aPoly=aPolyFrom.map((P,i)=>[ P[0]+(aPolyTo[i][0]-P[0])*t, P[1]+(aPolyTo[i][1]-P[1])*t ]);
  const pieces=g.pieces.map(pc=>({
    poly: pc.srcPose.map((P,i)=>[ P[0]+(pc.cellPose[i][0]-P[0])*t, P[1]+(pc.cellPose[i][1]-P[1])*t ])
  }));
  return { pieces, aPoly };
}

// onceCoverage(polys, region, N) — sample the region; fraction of interior points covered by EXACTLY
// one of `polys`. The load-bearing tiling test: ===1 means no gaps and no overlaps.
function onceCoverage(polys, region, N=120){
  const xs=region.map(p=>p[0]), ys=region.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  let once=0,tot=0;
  for(let i=0;i<N;i++) for(let j=0;j<N;j++){
    const x=x0+(i+0.5)/N*(x1-x0), y=y0+(j+0.5)/N*(y1-y0);
    if(!pointInPoly(region,x,y)) continue; tot++;
    let cnt=0; for(const P of polys) if(pointInPoly(P,x,y)) cnt++;
    if(cnt===1) once++;
  }
  return tot? once/tot : 0;
}

// badPerigal — NEG CONTROL: corrupt the lattice basis so the clipped pieces no longer tile the c-cell.
function badPerigal(a,b,err=0.5){
  const A=Math.min(a,b), B=Math.max(a,b), c=Math.hypot(a,b);
  const p=[B, A+err], q=[-(A+err), B];               // wrong basis → not a c-square lattice
  const cellRaw=[[0,0],p,[p[0]+q[0],p[1]+q[1]],q];
  const cen=poly=>{let x=0,y=0;poly.forEach(P=>{x+=P[0];y+=P[1];});return [x/poly.length,y/poly.length];};
  const o=cen(cellRaw); const cell=cellRaw.map(P=>[P[0]-o[0],P[1]-o[1]]);
  const bAt=(cx,cy)=>[[cx-B/2,cy-B/2],[cx+B/2,cy-B/2],[cx+B/2,cy+B/2],[cx-B/2,cy+B/2]];
  const frags=[];
  for(let m=-2;m<=2;m++)for(let n=-2;n<=2;n++){const cx=m*p[0]+n*q[0]-o[0],cy=m*p[1]+n*q[1]-o[1];const cl=clipToConvex(bAt(cx,cy),cell);if(cl.length>=3&&polyArea(cl)>1e-7)frags.push({m,n,cellPose:cl});}
  const pieces=frags.map(f=>{const tv=[-(f.m*p[0]+f.n*q[0]),-(f.m*p[1]+f.n*q[1])];return {cellPose:f.cellPose,srcPose:f.cellPose.map(P=>[P[0]+tv[0],P[1]+tv[1]]),glide:[-tv[0],-tv[1]]};});
  const aSquareSrc=[[-A/2,-A/2],[A/2,-A/2],[A/2,A/2],[-A/2,A/2]];
  return { a,b,c,A,B,p,q,cell,pieces,aSquareSrc,bSquare:bAt(0,0), bad:true };
}

export { dist, polyArea, pointInPoly, clipToConvex, perigal, poseAt, onceCoverage, badPerigal };
// === CORE END ===
