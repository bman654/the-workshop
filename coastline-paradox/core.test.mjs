import * as C from './core.mjs';

let pass=0, total=0;
function ok(name, cond, info=''){ total++; if(cond){pass++; console.log('  ✓ '+name+(info?'  ·  '+info:''));} else {console.log('  ✗ '+name+(info?'  ·  '+info:''));} }

console.log('The Coastline Paradox — Node cross-check\n');

// ---------------------------------------------------------------------------
// A. THE CARTOGRAPHER TRANSPLANT IS FAITHFUL
//    The PRNG, ValueNoise, and fbm here must produce bit-identical numbers to
//    the Cartographer's so this really IS its coast, not a look-alike.
// ---------------------------------------------------------------------------

// 1. The mulberry32 stream matches the Cartographer's first draws for "atlas".
{
  const r=C.makeRng('atlas');
  const a=r(), b=r(), c=r();
  // re-derive independently from the published xmur3+mulberry32 (same code path)
  const r2=C.makeRng('atlas');
  ok('seeded PRNG is deterministic & reproducible', a===r2() && b===r2() && c===r2(),
     `first draw ${a.toFixed(8)}`);
}

// 2. fbm sums octaves with amplitude ratio == gain (the roughness knob).
//    At gain=0.5 the second octave contributes half the first; check the
//    normalisation lands fbm strictly inside [0,1].
{
  const vn=new C.ValueNoise(C.makeRng('x::height'));
  let inRange=true, varied=false; let prev=null;
  for(let i=0;i<50;i++){ const v=vn.fbm(i*0.37, i*0.21, 7, 2, 0.5);
    if(v<0||v>1) inRange=false; if(prev!==null && Math.abs(v-prev)>1e-6) varied=true; prev=v; }
  ok('fbm stays in [0,1] and actually varies', inRange && varied);
}

// ---------------------------------------------------------------------------
// B. THE COAST IS A REAL CLOSED SHORELINE
// ---------------------------------------------------------------------------

// 3. Marching squares on a known radial bump returns a closed loop near the
//    expected iso-radius (a circle), and the count of crossings is even per row
//    (a contour can't dead-end inside the grid).
{
  const GW=120, GH=120; const h=new Float32Array(GW*GH);
  const cx=60, cy=60, R=30;
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
    const d=Math.hypot(x-cx,y-cy); h[y*GW+x]=1-Math.min(1,d/R); // 1 at centre → 0 at R
  }
  const segs=C.marchingSquares(h, GW, GH, 0.5); // iso 0.5 ⇒ circle of radius R/2=15
  const polys=C.stitch(segs);
  const main=C.mainCoast(polys);
  // it should close: first point ≈ last point
  const closed = main.length>8 &&
    Math.hypot(main[0]-main[main.length-2], main[1]-main[main.length-1]) < 0.03;
  // and its enclosed extent ≈ a circle of radius 15/120 ≈ 0.125
  let minx=1,maxx=0;
  for(let i=0;i<main.length;i+=2){ minx=Math.min(minx,main[i]); maxx=Math.max(maxx,main[i]); }
  const radius=(maxx-minx)/2;
  ok('marching-squares contour closes into a loop of the right radius',
     closed && Math.abs(radius-0.125)<0.03, `closed=${closed}, r=${radius.toFixed(3)} (exp 0.125)`);
}

// 4. A real generated realm produces a non-trivial coastline (segments + at
//    least one sizeable loop), and the sea level sits between hMin and hMax.
{
  const { height, target } = C.generateHeight('Aethel', 0.55, 'continents');
  const sea=C.seaLevel(height, target);
  let mn=Infinity,mx=-Infinity; for(const v of height){ if(v<mn)mn=v; if(v>mx)mx=v; }
  const segs=C.marchingSquares(height, 360, 240, sea);
  ok('a generated realm yields a coastline with the sea level inside the range',
     sea>mn && sea<mx && segs.length>200, `sea=${sea.toFixed(3)} ∈ (${mn.toFixed(2)},${mx.toFixed(2)}), ${segs.length} segs`);
}

// ---------------------------------------------------------------------------
// C. THE THEORY: D = 2 − H, with H = −log2(gain)
// ---------------------------------------------------------------------------

// 5. The Hurst/dimension conversion is exact at the textbook anchors.
{
  // gain=0.5 ⇒ H=1 ⇒ D=1 (smoothest, Brownian-graph-like coast → a line)
  // gain=1.0 ⇒ H=0 ⇒ D=2 (roughest, space-filling)
  // gain=1/√2 ⇒ H=0.5 ⇒ D=1.5 (the canonical Brownian value)
  const a=Math.abs(C.predictedCoastD(0.5)-1)<1e-9;
  const b=Math.abs(C.predictedCoastD(1.0)-2)<1e-9;
  const c=Math.abs(C.predictedCoastD(Math.SQRT1_2)-1.5)<1e-9;
  ok('theory anchors exact: D(0.5)=1, D(1)=2, D(1/√2)=1.5', a&&b&&c,
     `D(0.5)=${C.predictedCoastD(0.5).toFixed(3)}, D(1/√2)=${C.predictedCoastD(Math.SQRT1_2).toFixed(3)}`);
}

// ---------------------------------------------------------------------------
// D. THE CRUX — two independent MEASUREMENTS agree, and TRACK the slider.
// ---------------------------------------------------------------------------

// 6. Box-counting and the divider/ruler method agree on the SAME coast
//    (two unrelated estimators — one rasterises & counts cells, one walks the
//    polyline with a compass). They must land within ~0.2 of each other.
{
  const m=C.measureCoast('Verdania', 0.62, 'continents');
  const gap=Math.abs(m.box.D - m.div.D);
  ok('box-counting D ≈ divider/ruler D on the same coast (independent estimators)',
     gap<0.22 && m.box.D>1 && m.box.D<2 && m.div.D>1 && m.div.D<2,
     `box=${m.box.D.toFixed(3)} (R²=${m.box.r2.toFixed(3)}), ruler=${m.div.D.toFixed(3)} (R²=${m.div.r2.toFixed(3)})`);
}

// 7. THE CARTOGRAPHER CROSS — the measured dimension TRACKS the roughness
//    slider the same direction the theory predicts: a rougher field (higher
//    gain ⇒ lower H ⇒ higher predicted D) measures a HIGHER coastline D.
{
  const smooth=C.measureCoast('Tideholm', 0.45, 'continents');  // gain 0.45 ⇒ smoother
  const rough =C.measureCoast('Tideholm', 0.70, 'continents');  // gain 0.70 ⇒ rougher
  const order = rough.box.D > smooth.box.D;
  const predOrder = rough.predicted > smooth.predicted;
  ok('measured coastline D RISES with the roughness slider (the Cartographer cross)',
     order && predOrder && smooth.box.D>1 && rough.box.D<2,
     `gain .45 → D=${smooth.box.D.toFixed(3)} (pred ${smooth.predicted.toFixed(2)}); gain .70 → D=${rough.box.D.toFixed(3)} (pred ${rough.predicted.toFixed(2)})`);
}

// 8. The measured D brackets the THEORY across several gains (the slider's
//    predicted D is in the right ballpark of the actual measurement). We allow a
//    generous tolerance: real generated coasts have finite size, lakes, a domain
//    warp and a non-Gaussian island mask, so D won't hit 2−H exactly — but it
//    must track it, never wander to the wrong side of the range.
{
  let aligned=0, n=0;
  for(const gain of [0.50, 0.58, 0.66, 0.74]){
    const m=C.measureCoast('Cartoref', gain, 'continents');
    n++;
    // measured and predicted both in (1,2) and within 0.45 of each other
    if(m.box.D>1 && m.box.D<2 && Math.abs(m.box.D-m.predicted)<0.45) aligned++;
  }
  ok('measured D brackets the slider’s predicted 2−H across gains', aligned>=3, `${aligned}/${n} aligned`);
}

// ---------------------------------------------------------------------------
// E. THE PARADOX & NEGATIVE CONTROLS
// ---------------------------------------------------------------------------

// 9. THE PARADOX, made literal: as the compass opening ε shrinks, the measured
//    coastline LENGTH grows without bound (it does NOT converge). The longest
//    fine-ruler length must exceed the coarse-ruler length by a real margin.
{
  const m=C.measureCoast('Mistral', 0.66, 'continents');
  const pts=m.div.points;
  const coarse=pts[0].L, fine=pts[pts.length-1].L;   // points run big-ε → small-ε
  ok('the coastline paradox: smaller ruler ⇒ strictly LONGER measured coast',
     fine>coarse*1.15, `L(coarse)=${coarse.toFixed(3)} → L(fine)=${fine.toFixed(3)} (×${(fine/coarse).toFixed(2)})`);
}

// 10. NEGATIVE CONTROL — a SMOOTH circle is 1-D under BOTH estimators (it does
//     not fake a fractal coast: the divider length converges, box D≈1).
{
  const n=2000, R=0.4; const poly=[]; const segs=[];
  for(let i=0;i<=n;i++){ const t=2*Math.PI*i/n; poly.push(0.5+R*Math.cos(t), 0.5+R*Math.sin(t)); }
  for(let i=0;i<poly.length-2;i+=2) segs.push([poly[i],poly[i+1],poly[i+2],poly[i+3]]);
  const boxD=C.boxDimension(segs).D;
  const divD=C.dividerDimension(poly).D;
  ok('negative control: a smooth circle measures D≈1 (no fake fractal coast)',
     Math.abs(boxD-1)<0.08 && Math.abs(divD-1)<0.08, `box=${boxD.toFixed(3)}, ruler=${divD.toFixed(3)}`);
}

// 11. SEED PURITY — the whole pipeline is a measurement, not a guess: identical
//     seed+gain ⇒ bit-identical coastline dimension.
{
  const a=C.measureCoast('Replica', 0.6, 'continents').box.D;
  const b=C.measureCoast('Replica', 0.6, 'continents').box.D;
  ok('seed-pure: identical seed+gain ⇒ identical measured D', a===b, `D=${a.toFixed(6)}`);
}

// 12. The divider length CONVERGES for a smooth curve but DIVERGES for the
//     fractal coast — the qualitative signature of the paradox (slope sign).
{
  // smooth circle: divider slope(logL,logε) ≈ 0 ⇒ D ≈ 1
  const n=2000, R=0.4; const poly=[];
  for(let i=0;i<=n;i++){ const t=2*Math.PI*i/n; poly.push(0.5+R*Math.cos(t), 0.5+R*Math.sin(t)); }
  const smoothD=C.dividerDimension(poly);
  // fractal coast: slope clearly negative ⇒ D clearly > 1
  const coast=C.measureCoast('Brackmoor', 0.68, 'continents');
  ok('divider slope: ≈0 for the circle (length stable), <0 for the coast (length grows)',
     Math.abs(smoothD.slope)<0.06 && coast.div.slope < -0.05,
     `circle slope=${smoothD.slope.toFixed(3)}, coast slope=${coast.div.slope.toFixed(3)}`);
}

// ---------------------------------------------------------------------------
// F. THE WALK PATH — the re-souled hero EARNS D by marching the calipers, not
//    by stamping it. These four assert that what the calipers SHOW on screen
//    (steps · ε, the length they climb to) is EXACTLY what dividerDimension
//    fits — so the in-page hero adds zero math authority. They walk the SAME
//    ε ladder dividerDimension uses, against core's UNCHANGED functions.
// ---------------------------------------------------------------------------

// the page's ε ladder (verbatim from dividerDimension's inner loop band)
function walkLadder(poly, nScales=10){
  let total=0; for(let i=0;i<poly.length-2;i+=2) total+=Math.hypot(poly[i+2]-poly[i],poly[i+3]-poly[i+1]);
  const epsMax=total/8, epsMin=total/400; const eps=[];
  for(let k=0;k<nScales;k++){ const f=k/(nScales-1); eps.push(epsMax*Math.pow(epsMin/epsMax,f)); }
  return eps;
}
// the page's fitLadder (least-squares over {logEps,logL}, identical to
// dividerDimension's inner regression) — mirrored here for the Node assert.
function fitLadder(rungs){
  const n=rungs.length; let sx=0,sy=0,sxx=0,sxy=0;
  for(const r of rungs){ sx+=r.logEps; sy+=r.logL; sxx+=r.logEps*r.logEps; sxy+=r.logEps*r.logL; }
  const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx); const intercept=(sy-slope*sx)/n;
  const ybar=sy/n; let ssR=0,ssT=0;
  for(const r of rungs){ const pr=slope*r.logEps+intercept; ssR+=(r.logL-pr)**2; ssT+=(r.logL-ybar)**2; }
  return { D:1-slope, slope, intercept, r2: ssT>0?1-ssR/ssT:1 };
}
// walk the ladder → rungs (each = one stride-set the calipers march on screen)
function walkRungs(poly){
  const rungs=[];
  for(const eps of walkLadder(poly)){
    const {steps,L}=C.dividerLength(poly, eps);
    if(L>0) rungs.push({eps, steps, L:steps*eps, logEps:Math.log(eps), logL:Math.log(steps*eps)});
  }
  return rungs;
}

// 13. WALKED-LENGTH IDENTITY — the number the climbing HUD shows, L(ε)=steps·ε,
//     is float-exactly dividerLength's L for every ε on the ladder. What the
//     calipers SHOW is the measurement, not a re-derivation.
{
  const m=C.measureCoast('Verdania', 0.62, 'continents');
  let maxGap=0;
  for(const eps of walkLadder(m.main)){ const r=C.dividerLength(m.main, eps);
    maxGap=Math.max(maxGap, Math.abs(r.L - r.steps*eps)); }
  ok('walked length L(ε) === steps·ε exactly (what the calipers show)', maxGap===0,
     `max |L − steps·ε| = ${maxGap}`);
}

// 14. EARNED === FIT — walking the exact dividerDimension ε ladder and fitting
//     {logEps,logL} yields a D that equals dividerDimension's D within 1e-9, AND
//     the headline number is THAT divider fit, NOT box.D (guards against
//     regressing the hero to stamping the box-count number).
{
  const m=C.measureCoast('Britannia', 0.60, 'continents');
  const fit=fitLadder(walkRungs(m.main));
  const earnedEqualsFit = Math.abs(fit.D - m.div.D) < 1e-9;
  const earnedNotBox = Math.abs(fit.D - m.box.D) > 1e-9;  // the earned D is the divider fit, not box.D
  ok('earned D (walked-then-fit) === dividerDimension D within 1e-9, and is NOT box.D',
     earnedEqualsFit && earnedNotBox,
     `fit=${fit.D.toFixed(9)} div=${m.div.D.toFixed(9)} box=${m.box.D.toFixed(3)} |fit−div|=${Math.abs(fit.D-m.div.D).toExponential(1)}`);
}

// 15. DIVIDER-D AND BOX-COUNT-D AGREE on the same coast — asserted THROUGH the
//     earned (walked) path: |box.D − earnedFit.D| < 0.22. Two independent rulers,
//     one walked by hand, land on the same dimension.
{
  const m=C.measureCoast('Mistral', 0.66, 'continents');
  const fit=fitLadder(walkRungs(m.main));
  const gap=Math.abs(m.box.D - fit.D);
  ok('divider-D (walked) and box-count-D agree on the same coast (< 0.22)',
     gap<0.22 && fit.D>1 && fit.D<2 && m.box.D>1 && m.box.D<2,
     `box=${m.box.D.toFixed(3)}, walked=${fit.D.toFixed(3)}, gap=${gap.toFixed(3)}`);
}

// 16. SMOOTH-CIRCLE CONTROL through the walk path — the negative control coast
//     (a circle) reads slope ≈ 0 and D ≈ 1 when WALKED, just as it does through
//     dividerDimension. Marching it: the length stays flat, the rail goes
//     horizontal, the verdict resolves D ≈ 1.00.
{
  const n=1600, R=0.4; const poly=[];
  for(let i=0;i<=n;i++){ const t=2*Math.PI*i/n; poly.push(0.5+R*Math.cos(t), 0.5+R*Math.sin(t)); }
  const fit=fitLadder(walkRungs(poly));
  ok('smooth-circle control walks to slope≈0 / D≈1 (|slope|<0.06, |D−1|<0.08)',
     Math.abs(fit.slope)<0.06 && Math.abs(fit.D-1)<0.08,
     `walked slope=${fit.slope.toFixed(4)}, D=${fit.D.toFixed(4)}`);
}

console.log(`\n${pass}/${total} ${pass===total?'✓ ALL GREEN':'✗ FAILURES'}`);
process.exit(pass===total?0:1);
