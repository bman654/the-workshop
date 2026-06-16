/* ════════════════════════════════════════════════════════════════
   THE FINITE WELL · physics CORE  (the SOLE authority)
   ════════════════════════════════════════════════════════════════
   A particle in a FINITE square well: V(x) = 0 for |x| < a, and V(x) = V₀
   (a finite step) for |x| > a. Natural units ħ = m = 1.

   Bound states have 0 < E < V₀. Inside the well the wave is oscillatory with
   k = √(2E); outside it is an exponential DECAY with κ = √(2(V₀−E)). Matching
   ψ and ψ′ at the wall x = a quantizes the energy through a TRANSCENDENTAL
   condition — there is NO closed-form ladder (unlike the box's n² or the
   oscillator's n+½). Writing u = k·a, v = κ·a, the bound states are the
   intersections of  u² + v² = R²   (R = √(2 V₀)·a, the well-strength radius)
   with the parity branches
       even parity:  v =  u·tan(u)
       odd  parity:  v = −u·cot(u)
   A well of strength R holds exactly  ⌊R/(π/2)⌋ + 1  bound states — a FINITE
   number, and ALWAYS at least one however shallow. Deepen or widen the well
   (raise R) and new rungs appear; shrink it and the top rungs evaporate.

   THE CONTRASTS WITH THE BOX AND THE BOWL — the soul of this bench:
     • box: infinite ladder ∝ n², wave dies AT the hard wall
     • bowl: infinite EVEN ladder ∝ n+½, Gaussian tails past soft turning points
     • finite well: a FINITE ladder (no closed form), EXPONENTIAL tails that
       leak OUT through the climbable walls — the shallowest rung leaks farthest.

   INDEPENDENT CHECK: we discretize H = −½ d²/dx² + V(x) (V the actual STEP
   potential) on a grid and pull the lowest bound eigenvalues FROM SCRATCH by
   inverse-power iteration (Thomas tridiagonal solve + Rayleigh quotient). A
   different algebra than the transcendental match → it corroborates rather
   than asserts. (NB: the hard step makes this converge at first order O(h) on a
   uniform grid — honest, bounded numerics, not machine precision.)

   The block between // === CORE BEGIN === and // === CORE END === is INLINED
   byte-identical into index.html; core.test.mjs proves that parity, the
   physics (the transcendental match, the node theorem, the from-scratch FD
   eigensolve, the box-recovery limit), and the two motion claims (the swept
   count tracking ⌊R/(π/2)⌋+1 with births at R=n·π/2, and the leak growing
   monotonically as the well shallows). Nothing else computes the ladder.
   ════════════════════════════════════════════════════════════════ */
// === CORE BEGIN ===

// well-strength radius R = √(2 V₀)·a
function radius(V0, a){ return Math.sqrt(2*V0)*a; }
// number of bound states for a given R
function nBound(R){ return Math.floor(R/(Math.PI/2)) + 1; }

// solve the transcendental matching for the n-th bound state (n = 0,1,2,…).
// Even n → even parity (cosine inside), odd n → odd parity (sine inside).
// Branch n lives in u ∈ (n·π/2, (n+1)·π/2); we intersect its v(u) with the
// circle v = √(R²−u²) by bisection on g(u) = v_branch(u) − v_circle(u).
function solveLevel(n, V0, a){
  var R = radius(V0, a);
  if(n >= nBound(R)) return null;                 // that rung doesn't exist for this well
  var even = (n % 2 === 0);
  var lo = n*(Math.PI/2), hi = (n+1)*(Math.PI/2);
  var uMax = Math.min(hi, R);
  function vBranch(u){ return even ? u*Math.tan(u) : -u/Math.tan(u); }
  function circleV(u){ var t=R*R-u*u; return t>0 ? Math.sqrt(t) : 0; }
  function g(u){ return vBranch(u) - circleV(u); }
  var a0 = lo + 1e-9, b0 = uMax - 1e-9;
  if(!(g(a0) < 0)){ a0 = lo + (uMax-lo)*1e-6; }
  for(var it=0; it<200; it++){
    var m = 0.5*(a0+b0), gm = g(m);
    if(gm <= 0) a0 = m; else b0 = m;
    if(b0 - a0 < 1e-14) break;
  }
  var u = 0.5*(a0+b0);
  var k = u/a, kappa = circleV(u)/a, E = 0.5*k*k;
  return { n:n, even:even, u:u, v:circleV(u), k:k, kappa:kappa, E:E, R:R, a:a, V0:V0 };
}

// all bound levels for a well, lowest first
function allLevels(V0, a){
  var R = radius(V0, a), out=[];
  for(var n=0; n<nBound(R); n++){ var L=solveLevel(n,V0,a); if(L) out.push(L); }
  return out;
}

// (unnormalized) bound wavefunction for a solved level.
// Inside |x|<a: even → cos(kx), odd → sin(kx). Outside: edge·e^{−κ(|x|−a)} (antisymmetric for odd).
function psiUnnorm(L, x){
  var k=L.k, kappa=L.kappa, a=L.a, even=L.even;
  if(Math.abs(x) <= a){
    return even ? Math.cos(k*x) : Math.sin(k*x);
  } else {
    var s = x > 0 ? 1 : (even ? 1 : -1);
    var edge = even ? Math.cos(k*a) : Math.sin(k*a);
    return s * edge * Math.exp(-kappa*(Math.abs(x)-a));
  }
}
// normalization (composite Simpson over a wide range)
function normConst(L){
  var a=L.a, kap=L.kappa, Lh = a + 12/Math.max(kap,1e-6), N=4000, h=2*Lh/N, s=0;
  for(var i=0;i<=N;i++){ var x=-Lh+i*h, p=psiUnnorm(L,x), f=p*p, w=(i===0||i===N)?1:(i%2?4:2); s+=w*f; }
  return 1/Math.sqrt(s*h/3);
}
function psi(L, x, Nrm){ return (Nrm!==undefined?Nrm:normConst(L)) * psiUnnorm(L,x); }

// probability OUTSIDE the well (|x|>a) — the leak into the classically-forbidden ground.
function leakOutside(L){
  var Nrm=normConst(L), a=L.a, kap=L.kappa, Lh=a+12/Math.max(kap,1e-6), N=4000, h=(Lh-a)/N, s=0;
  for(var i=0;i<=N;i++){ var x=a+i*h, p=psi(L,x,Nrm), f=p*p, w=(i===0||i===N)?1:(i%2?4:2); s+=w*f; }
  return 2 * s*h/3;
}

// node count (interior zero crossings) of ψ — should equal n. Robust to exact-zero grid samples.
function nodeCount(L){
  var Nrm=normConst(L), a=L.a, kap=L.kappa, Lh=a+12/Math.max(kap,1e-6), nodes=0, last=0;
  for(var i=0;i<=6000;i++){ var x=-Lh+ i/6000*(2*Lh), v=psi(L,x,Nrm);
    var sg = v>1e-12 ? 1 : (v<-1e-12 ? -1 : 0);
    if(sg!==0){ if(last!==0 && sg!==last) nodes++; last=sg; }
  }
  return nodes;
}

// ── INDEPENDENT FD eigensolve of the STEP potential ──
function buildFD(N, V0, a, Lh){
  Lh = Lh || (a*3 + 6);
  var h=2*Lh/(N+1), inv=1/(h*h), od=-0.5*inv;
  var diag=new Float64Array(N), xs=new Float64Array(N);
  for(var i=0;i<N;i++){ var x=-Lh+(i+1)*h; xs[i]=x; var V = Math.abs(x)<a ? 0 : V0; diag[i]=inv + V; }
  return { diag:diag, od:od, h:h, x:xs, N:N };
}
function fdMul(fd, v){
  var N=fd.N, o=new Float64Array(N);
  for(var i=0;i<N;i++){ var val=fd.diag[i]*v[i]; if(i>0)val+=fd.od*v[i-1]; if(i<N-1)val+=fd.od*v[i+1]; o[i]=val; }
  return o;
}
function inversePower(fd, shift, seed){
  var N=fd.N, od=fd.od, s=(seed>>>0)||12345;
  function rnd(){ s^=s<<13; s^=s>>>17; s^=s<<5; s>>>=0; return (s/4294967296)*2-1; }
  var v=new Float64Array(N); for(var i=0;i<N;i++) v[i]=rnd();
  function norm(x){ var n=0; for(var j=0;j<N;j++) n+=x[j]*x[j]; n=Math.sqrt(n); for(var j2=0;j2<N;j2++) x[j2]/=n; return x; }
  norm(v);
  function solve(rhs){
    var cp=new Float64Array(N), dp=new Float64Array(N), x=new Float64Array(N);
    var b0=fd.diag[0]-shift; cp[0]=od/b0; dp[0]=rhs[0]/b0;
    for(var i=1;i<N;i++){ var b=fd.diag[i]-shift, mm=b-od*cp[i-1]; cp[i]=od/mm; dp[i]=(rhs[i]-od*dp[i-1])/mm; }
    x[N-1]=dp[N-1]; for(var i2=N-2;i2>=0;i2--) x[i2]=dp[i2]-cp[i2]*x[i2+1];
    return x;
  }
  var lambda=shift;
  for(var it=0; it<400; it++){
    var y=solve(v); norm(y);
    var Hy=fdMul(fd,y), num=0; for(var k=0;k<N;k++) num+=y[k]*Hy[k]; lambda=num;
    var diff=0; for(var q=0;q<N;q++){ var dd=Math.abs(y[q])-Math.abs(v[q]); diff+=dd*dd; }
    v=y; if(Math.sqrt(diff)<1e-14) break;
  }
  return { lambda:lambda, vec:v, fd:fd };
}
// === CORE END ===

export { radius, nBound, solveLevel, allLevels, psiUnnorm, normConst, psi,
         leakOutside, nodeCount, buildFD, fdMul, inversePower };
