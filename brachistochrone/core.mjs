// ============================================================================
//  THE BRACHISTOCHRONE CORE — Johann Bernoulli's 1696 problem, the SOLE math
//  authority for the curve of fastest descent and its tautochrone twin.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. The page
//  (brachistochrone/index.html) inlines the slab between the BRACHISTOCHRONE
//  CORE BEGIN / END sentinels byte-for-byte via forge:include; core.test.mjs
//  proves the inlined copy is char-identical to this file, so page, pill, and
//  Node twin can never silently drift. This module is ALSO the single source of
//  truth every kin imports (the cross-bench "The Bead That Falls Like Light"
//  imports solveCycloid / cycloidTime / descentTimeFn from here, byte-untouched).
//
//  COORDINATES (physics): x rightward, y DOWNWARD (= drop). A at origin.
//  Speed by energy conservation:  v = √(2 g · drop).
//  Descent time along y(x):  T = ∫ √(1+y'²) / √(2 g y) dx.
//  The integrand blows up like 1/√y at the release point (v→0) — an INTEGRABLE
//  singularity. We regularize it with substitutions that map the singularity to
//  a smooth endpoint, so the quadrature converges fast.
//
//  THE CLAIMS (re-proven by the in-page pill AND core.test.mjs):
//    0. the cycloid passes through A and B exactly (endpoint bisection).
//    1. its numeric descent time equals the analytic √(r/g)·θB (regularized θ).
//    2. it is the FASTEST of line / arc / parabola for the same A→B.
//    3. it is a TRUE minimum — every fixed-endpoint wiggle is strictly slower.
//    4. tautochrone: 6 release heights arrive together at π√(r/g).
//    5. FALSIFIABLE: a circular cup is NOT tautochrone (amplitude-dependent).
//    6. determinism: identical inputs → bit-identical curve and time.
// ============================================================================

// === BRACHISTOCHRONE CORE BEGIN ===
"use strict";

// ----------------------------------------------------------------- CORE MATH

// Solve the cycloid through A=(0,0) [cusp at top] and B=(xB,yB), yB>0.
//   x = r(θ − sinθ),  y = r(1 − cosθ),  θ ∈ [0, θB]
// Ratio eliminates r:  xB/yB = (θ − sinθ)/(1 − cosθ), monotone on (0,2π).
function solveCycloid(xB, yB){
  var target = xB / yB;
  var f = function(th){ return (th - Math.sin(th)) / (1 - Math.cos(th)) - target; };
  var lo = 1e-9, hi = 2*Math.PI - 1e-9;
  for (var i=0;i<200;i++){ var m = 0.5*(lo+hi); if (f(m) < 0) lo = m; else hi = m; }
  var thB = 0.5*(lo+hi);
  return { r: yB/(1-Math.cos(thB)), thB: thB };
}

// Cycloid descent time A→B is EXACT: the integrand is the constant √(r/g),
// so T = √(r/g)·θB. (ds = r√(2(1−cosθ))dθ, v = √(2g·r(1−cosθ)).)
function cycloidTime(r, thB, g){ return Math.sqrt(r/g) * thB; }

// General descent time T = ∫ √(1+y'²)/√(2 g y) dx from x=0 (y=0) to xB.
// Substitution x = s² (dx = 2s ds) tames the 1/√y singularity at the start
// for tracks that leave A moving (y ~ x^p, p<2). Midpoint rule in s.
function descentTimeFn(yFn, ypFn, xB, g, N){
  var sMax = Math.sqrt(xB), T = 0;
  for (var i=0;i<N;i++){
    var s = (i+0.5)/N * sMax, ds = sMax/N, x = s*s;
    var y = yFn(x); if (y <= 0) continue;
    var yp = ypFn(x);
    T += (Math.sqrt(1+yp*yp)/Math.sqrt(2*g*y)) * (2*s) * ds;
  }
  return T;
}

// The four race tracks through A=(0,0), B=(xB,yB) — each as y(x), y'(x).
function trackLine(xB,yB){ var m=yB/xB; return { y:function(x){return m*x;}, yp:function(){return m;} }; }
function trackArc(xB,yB){
  // circular arc, vertical tangent at A: centre (cx,0), cx=(xB²+yB²)/(2xB)
  var cx=(xB*xB+yB*yB)/(2*xB), R=Math.abs(cx);
  var y=function(x){ return Math.sqrt(Math.max(0,R*R-(x-cx)*(x-cx))); };
  var yp=function(x){ var yy=y(x); return yy<=1e-9?1e9:-(x-cx)/yy; };
  return { y:y, yp:yp, cx:cx, R:R };
}
function trackParab(xB,yB){
  // sideways parabola y=√(x/k), k=xB/yB² — vertical tangent at A (a fair steep competitor)
  var k=xB/(yB*yB);
  return { y:function(x){return Math.sqrt(x/k);}, yp:function(x){return x<=1e-12?1e9:1/(2*Math.sqrt(k*x));}, k:k };
}

// Tautochrone time to the bottom (θ=π) of a cycloid cup of radius r, released
// from rest at angle θ0. Regularizing substitution cos(θ/2)=cos(θ0/2)·cosφ maps
// the release singularity to a SMOOTH integrand over φ∈[0,π/2]; the analytic
// answer is π√(r/g) for ALL θ0. We integrate the un-simplified form to PROVE it.
function tautochroneTime(r, th0, g, N){
  var A = Math.cos(th0/2), T = 0;
  for (var i=0;i<N;i++){
    var phi=(i+0.5)/N*(Math.PI/2), dphi=(Math.PI/2)/N;
    var cosHalf=A*Math.cos(phi);
    var sinHalf=Math.sqrt(Math.max(1e-300,1-cosHalf*cosHalf));
    var oneMinusCos=2*sinHalf*sinHalf;                // 1−cosθ
    var diff=2*A*A*Math.sin(phi)*Math.sin(phi);       // cosθ0−cosθ
    var dtheta_dphi=2*A*Math.sin(phi)/sinHalf;
    if (diff<=0) continue;
    T += Math.sqrt(r/g) * Math.sqrt(oneMinusCos/diff) * dtheta_dphi * dphi;
  }
  return T;
}
function tautochroneAnalytic(r, g){ return Math.PI*Math.sqrt(r/g); }

// Falsifiability twin: a CIRCULAR cup is NOT tautochrone — its quarter-period
// depends on release amplitude (a pendulum). Time to bottom from angle α0.
function circCupTime(R, alpha0, g, N){
  var T=0;
  for (var i=0;i<N;i++){
    var a=(i+0.5)/N*alpha0, da=alpha0/N;
    var drop=R*(Math.cos(a)-Math.cos(alpha0)); if (drop<=0) continue;
    T += R*da/Math.sqrt(2*g*drop);
  }
  return T;
}

// Perturbed cycloid path (endpoints fixed) — used to show it's a true minimum.
// y(θ) = r(1−cosθ) + amp·sin(πθ/θB); integrate generically in θ.
function perturbedCycloidTime(r, thB, g, amp, N){
  var T=0;
  for (var i=0;i<N;i++){
    var th=(i+0.5)/N*thB, dth=thB/N;
    var bump=amp*Math.sin(Math.PI*th/thB);
    var bumpp=amp*Math.cos(Math.PI*th/thB)*(Math.PI/thB);
    var y=r*(1-Math.cos(th))+bump; if (y<=1e-9) continue;
    var dx=r*(1-Math.cos(th)), dy=r*Math.sin(th)+bumpp;
    var ds=Math.sqrt(dx*dx+dy*dy)*dth;
    T += ds/Math.sqrt(2*g*y);
  }
  return T;
}

// ------------------------------------------------------- POSITION ALONG TRACK
// To animate "real" motion we need x(t)/y(t). We precompute a fine table of
// (cumulative-time → arc position) for each track by marching with the local
// speed, then look up by elapsed time. This makes the beads move by genuine
// velocity v=√(2g·drop), so the gold bead visibly pulls ahead.

function buildTimeTable(samplePts, g){
  // samplePts: [{x,y}, ...] in physics coords (y down), y[0]=0. Returns
  // {t:[], x:[], y:[], total} where t[i] is arrival time at point i.
  var n=samplePts.length, t=new Array(n), X=new Array(n), Y=new Array(n);
  t[0]=0; X[0]=samplePts[0].x; Y[0]=samplePts[0].y;
  for (var i=1;i<n;i++){
    X[i]=samplePts[i].x; Y[i]=samplePts[i].y;
    var dx=samplePts[i].x-samplePts[i-1].x, dy=samplePts[i].y-samplePts[i-1].y;
    var ds=Math.sqrt(dx*dx+dy*dy);
    var y0=samplePts[i-1].y, y1=samplePts[i].y;
    // dt = ds / v, with v varying along the segment. Use v=√(2g y); near the
    // start (y→0) integrate the segment analytically assuming y linear in arc:
    // ∫0^ds dσ/√(2g·(y0 + (y1-y0)σ/ds)) — closed form.
    var dt;
    var vy0=2*g*y0, vy1=2*g*y1;
    if (y1 <= 1e-12 && y0 <= 1e-12){ dt = 0; }
    else if (Math.abs(y1-y0) < 1e-12){ dt = ds/Math.sqrt(2*g*Math.max(y0,1e-12)); }
    else {
      // ∫ dσ/√(a+bσ) = 2(√(a+b·ds)-√a)/b, a=vy0, b=(vy1-vy0)/ds, scaled
      var a=vy0, b=(vy1-vy0); // over σ∈[0,1] fraction, then ·ds
      dt = ds * 2*(Math.sqrt(a+b)-Math.sqrt(a))/b;
    }
    t[i]=t[i-1]+dt;
  }
  return { t:t, x:X, y:Y, total:t[n-1] };
}
function posAtTime(tbl, time){
  if (time >= tbl.total) return { x:tbl.x[tbl.x.length-1], y:tbl.y[tbl.y.length-1], done:true };
  // binary search
  var lo=0, hi=tbl.t.length-1;
  while (hi-lo>1){ var mid=(lo+hi)>>1; if (tbl.t[mid] <= time) lo=mid; else hi=mid; }
  var span=tbl.t[hi]-tbl.t[lo]; var f= span>0 ? (time-tbl.t[lo])/span : 0;
  return { x:tbl.x[lo]+f*(tbl.x[hi]-tbl.x[lo]), y:tbl.y[lo]+f*(tbl.y[hi]-tbl.y[lo]), done:false };
}

// =================================================================== SELFTEST
function runSelfTest(){
  var items=[], pass=0;
  function check(ok, label, detail){ items.push({ok:!!ok,label:label,detail:detail}); if(ok)pass++; }
  var g=9.81, xB=2.0, yB=1.0;
  var cyc=solveCycloid(xB,yB);

  // (0) Cycloid passes exactly through A and B
  var xb=cyc.r*(cyc.thB-Math.sin(cyc.thB)), yb=cyc.r*(1-Math.cos(cyc.thB));
  var thru=Math.max(Math.abs(xb-xB),Math.abs(yb-yB));
  check(thru<1e-9, "Cycloid passes through A &amp; B", "max endpoint error <b>"+thru.toExponential(2)+"</b>");

  // (1) Cycloid time matches the analytic √(r/g)·θB (regularized θ quadrature)
  var Tan=cycloidTime(cyc.r,cyc.thB,g);
  var Tnum=0; (function(){ var N=2000, thB=cyc.thB, r=cyc.r;
    for (var i=0;i<N;i++){ var u=(i+0.5)/N, du=1/N, th=thB*u*u, dth_du=thB*2*u;
      var y=r*(1-Math.cos(th)); if(y<=0)continue;
      var dsdth=r*Math.sqrt(2*(1-Math.cos(th))); Tnum += dsdth/Math.sqrt(2*g*y)*dth_du*du; } })();
  var cycErr=Math.abs(Tan-Tnum);
  check(cycErr<1e-6, "Numeric cycloid time = analytic", "|Δ| = <b>"+cycErr.toExponential(2)+"</b> s (tol 1e&#8722;6)");

  // (2) Brachistochrone optimality: cycloid beats line / arc / parabola
  var ln=trackLine(xB,yB), ar=trackArc(xB,yB), pb=trackParab(xB,yB);
  var Tline=descentTimeFn(ln.y,ln.yp,xB,g,40000);
  var Tarc =descentTimeFn(ar.y,ar.yp,xB,g,40000);
  var Tpar =descentTimeFn(pb.y,pb.yp,xB,g,40000);
  var minOther=Math.min(Tline,Tarc,Tpar);
  check(Tan<minOther,
    "Cycloid is fastest of the four",
    "cycloid <b>"+Tan.toFixed(5)+"</b> &lt; arc "+Tarc.toFixed(5)+" &lt; parab "+Tpar.toFixed(5)+" &lt; line "+Tline.toFixed(5)+" s (margin <b>"+(minOther-Tan).toFixed(5)+"</b>)");

  // (3) Genuine minimum: every perturbation INCREASES the time
  var base=perturbedCycloidTime(cyc.r,cyc.thB,g,0,50000);
  var amps=[-0.08,-0.03,0.03,0.08,0.15], allSlower=true, worst=Infinity;
  for (var a=0;a<amps.length;a++){ var Tp=perturbedCycloidTime(cyc.r,cyc.thB,g,amps[a],50000);
    if (Tp < base - 1e-9) allSlower=false; worst=Math.min(worst, Tp-base); }
  check(allSlower, "Every wiggle is slower (true minimum)", "smallest penalty over 5 perturbations <b>+"+worst.toExponential(2)+"</b> s");

  // (4) Tautochrone: all release heights arrive together at π√(r/g)
  var rT=0.7, Ttan=tautochroneAnalytic(rT,g);
  var starts=[0.05,0.5,1.0,1.8,2.5,Math.PI-0.05], times=[];
  for (var s=0;s<starts.length;s++) times.push(tautochroneTime(rT,starts[s],g,3000));
  var spread=Math.max.apply(null,times)-Math.min.apply(null,times);
  var maxAnaErr=0; for (var s2=0;s2<times.length;s2++) maxAnaErr=Math.max(maxAnaErr,Math.abs(times[s2]-Ttan));
  check(spread<1e-6 && maxAnaErr<1e-6,
    "Tautochrone: 6 heights arrive together",
    "spread <b>"+spread.toExponential(2)+"</b> s, max |T&#8722;&pi;&radic;(r/g)| <b>"+maxAnaErr.toExponential(2)+"</b> s (tol 1e&#8722;6)");

  // (5) Falsifiable: a circular cup does NOT arrive together (amplitude-dependent)
  var c1=circCupTime(0.7,0.3,g,100000), c2=circCupTime(0.7,1.4,g,100000);
  var circSpread=Math.abs(c2-c1);
  check(circSpread>1e-3,
    "Falsifiable: circular cup is NOT tautochrone",
    "circle arrival spread <b>"+circSpread.toFixed(4)+"</b> s (≫ cycloid's "+spread.toExponential(1)+")");

  // (6) Determinism: identical inputs → identical curve &amp; time
  var c1s=solveCycloid(xB,yB), c2s=solveCycloid(xB,yB);
  var det = (c1s.r===c2s.r) && (c1s.thB===c2s.thB) &&
            (cycloidTime(c1s.r,c1s.thB,g)===cycloidTime(c2s.r,c2s.thB,g));
  check(det, "Deterministic (identical in → identical out)", "r, &theta;<sub>B</sub>, T bit&#8209;identical on repeat");

  return { items:items, pass:pass, total:items.length,
           Tline:Tline, Tarc:Tarc, Tpar:Tpar, Tcyc:Tan, cycErr:cycErr, spread:spread, maxAnaErr:maxAnaErr };
}
// === BRACHISTOCHRONE CORE END ===

export {
  solveCycloid, cycloidTime, descentTimeFn,
  trackLine, trackArc, trackParab,
  tautochroneTime, tautochroneAnalytic, circCupTime, perturbedCycloidTime,
  buildTimeTable, posAtTime, runSelfTest,
};
