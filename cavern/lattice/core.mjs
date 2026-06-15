/* ════════════════════════════════════════════════════════════════
   THE LATTICE · band-structure CORE  (the SOLE authority)
   ════════════════════════════════════════════════════════════════
   The Kronig–Penney model: an electron in a PERIODIC potential — a Dirac
   comb of identical δ-barriers, V(x) = U·Σ δ(x − n·a), period a. Natural
   units ħ = m = 1, P = U·a. The dispersion

       cos(q·a) = cos(k·a) + P·sin(k·a)/(k·a)  ≡  f(E),   k = √(2E)

   makes an energy ALLOWED (a real Bloch q exists) only where |f(E)| ≤ 1 —
   those intervals are the BANDS; |f| > 1 is a forbidden GAP. Band edges
   are exactly f = ±1, i.e. q·a = nπ.

   This file is the band-structure authority for the bench. The block
   between // === CORE BEGIN === and // === CORE END === is INLINED
   byte-identical into index.html; core.test.mjs proves that parity, the
   physics (½·tr M = f, det M = 1, the negative controls, the ring
   eigensolve) and the occupancy verdict. Nothing else computes bands.
   ════════════════════════════════════════════════════════════════ */
// === CORE BEGIN ===  (pure physics — the proven Kronig–Penney engine,
//   reused verbatim from the bench, plus the new occupancy/verdict layer)
function kOf(E){ return Math.sqrt(2*E); }
function fDisp(E, P, a){ var k=kOf(E), ka=k*a; return Math.cos(ka) + P*Math.sin(ka)/ka; }
function cellMatrix(E, P, a){
  var k=kOf(E), c=Math.cos(k*a), s=Math.sin(k*a), U=P/a;
  var m00=c + (s/k)*(2*U), m01=(s/k);
  var m10=(-k*s) + c*(2*U), m11=c;
  return [[m00,m01],[m10,m11]];
}
function halfTrace(E, P, a){ var M=cellMatrix(E,P,a); return 0.5*(M[0][0]+M[1][1]); }
function detCell(E, P, a){ var M=cellMatrix(E,P,a); return M[0][0]*M[1][1]-M[0][1]*M[1][0]; }

function findBands(P, a, Emax, maxBands){
  var bands=[], inb=false, lo=0, prevE=1e-6;
  var dE=Emax/24000;
  function refineEdge(Ea, Eb){
    for(var it=0; it<80; it++){
      var Em=0.5*(Ea+Eb), fm=Math.abs(fDisp(Em,P,a))-1, fa=Math.abs(fDisp(Ea,P,a))-1;
      if((fm<=0)===(fa<=0)) Ea=Em; else Eb=Em;
      if(Eb-Ea<1e-12) break;
    }
    return 0.5*(Ea+Eb);
  }
  for(var E=prevE; E<=Emax; E+=dE){
    var cur=Math.abs(fDisp(E,P,a))<=1;
    if(cur && !inb){ lo=refineEdge(prevE,E); inb=true; }
    else if(!cur && inb){ bands.push([lo, refineEdge(prevE,E)]); inb=false; if(bands.length>=maxBands) return bands; }
    prevE=E;
  }
  if(inb) bands.push([lo, Emax]);
  return bands;
}
function energyAtQ(band, P, a, qa){
  var target=Math.cos(qa);
  var flo=fDisp(band[0]+1e-9,P,a), fhi=fDisp(band[1]-1e-9,P,a);
  var a0=band[0]+1e-9, b0=band[1]-1e-9, inc=(fhi>flo);
  for(var it=0; it<90; it++){
    var m=0.5*(a0+b0), fm=fDisp(m,P,a);
    if((fm<target)===inc) a0=m; else b0=m;
    if(b0-a0<1e-12) break;
  }
  return 0.5*(a0+b0);
}
// independent from-scratch ring eigensolve (proves N states per band)
function buildRing(P, a, N, M){
  var Ntot=N*M, h=a/M, inv=1/(h*h), U=P/a;
  var diag=new Float64Array(Ntot), off=-0.5*inv;
  for(var i=0;i<Ntot;i++){ diag[i]=inv; }
  for(var n=0;n<N;n++){ diag[n*M] += U/h; }
  return { diag:diag, off:off, N:Ntot };
}
function ringMul(R, v){
  var N=R.N, o=new Float64Array(N), od=R.off;
  for(var i=0;i<N;i++){ o[i]=R.diag[i]*v[i] + od*v[(i-1+N)%N] + od*v[(i+1)%N]; }
  return o;
}
function cyclicSolve(R, sigma, b){
  var N=R.N, od=R.off;
  var dd=new Float64Array(N); for(var i=0;i<N;i++) dd[i]=R.diag[i]-sigma;
  var gamma=-dd[0];
  function thomas(d, rhs){
    var cp=new Float64Array(N), dp=new Float64Array(N), x=new Float64Array(N);
    var b0=d[0]; cp[0]=od/b0; dp[0]=rhs[0]/b0;
    for(var i=1;i<N;i++){ var m=d[i]-od*cp[i-1]; cp[i]=od/m; dp[i]=(rhs[i]-od*dp[i-1])/m; }
    x[N-1]=dp[N-1]; for(var j=N-2;j>=0;j--) x[j]=dp[j]-cp[j]*x[j+1];
    return x;
  }
  var dmod=Float64Array.from(dd); dmod[0]=dd[0]-gamma; dmod[N-1]=dd[N-1]-od*od/gamma;
  var u=new Float64Array(N); u[0]=gamma; u[N-1]=od;
  var y=thomas(dmod, b), z=thomas(dmod, u);
  var fact=(y[0]+(od/gamma)*y[N-1]) / (1 + z[0] + (od/gamma)*z[N-1]);
  var x=new Float64Array(N);
  for(var i2=0;i2<N;i2++) x[i2]=y[i2]-fact*z[i2];
  return x;
}
function ringEigs(R, count, sigma, seed){
  var N=R.N, found=[], vecs=[], s=(seed>>>0)||9871;
  function rnd(){ s^=s<<13; s^=s>>>17; s^=s<<5; s>>>=0; return (s/4294967296)*2-1; }
  function dot(x,y){ var d=0; for(var i=0;i<N;i++) d+=x[i]*y[i]; return d; }
  function nrm(x){ var n=Math.sqrt(dot(x,x)); for(var i=0;i<N;i++) x[i]/=n; return x; }
  for(var c=0;c<count;c++){
    var v=new Float64Array(N); for(var i=0;i<N;i++) v[i]=rnd(); nrm(v);
    var lambda=sigma;
    for(var it=0; it<300; it++){
      var y=cyclicSolve(R, sigma, v);
      for(var f=0; f<found.length; f++){ var pr=dot(y, vecs[f]); for(var q=0;q<N;q++) y[q]-=pr*vecs[f][q]; }
      nrm(y);
      var Hy=ringMul(R,y); lambda=dot(y,Hy);
      var diff=0; for(var q2=0;q2<N;q2++){ var d=y[q2]-v[q2]; diff+=d*d; }
      v=y; if(Math.sqrt(diff)<1e-13) break;
    }
    found.push(lambda); vecs.push(v);
  }
  found.sort(function(x,y){ return x-y; });
  return found;
}

/* ── THE OCCUPANCY / VERDICT LAYER (the game's truth) ──────────────
   A ring of N atoms gives N states per band, ×2 for spin. Pour `ne`
   electrons; they fill bands lowest-first. The solid CONDUCTS iff the
   topmost occupied band is partly filled (a half-full band has empty
   states to move into); it INSULATES iff electrons exactly top off a
   band AND a real gap separates it from the next band. A band that is
   exactly full but butts against the next band with NO gap (P→0) still
   conducts — there's somewhere to go. This is a pure parity/occupancy
   fact, falsifiable, computed — not a drawn guess.

   The metal-vs-semiconductor split at SEMI_GAP is an HONEST thermal-scale
   stand-in (a gap a few kT wide can be hopped), NOT a theorem — it marks
   where "a few electrons can jump" begins, in these natural units. */
function classify(bands, N, ne, P_, a_){
  if(P_===undefined) P_=2.0; if(a_===undefined) a_=1.0;
  var cap = 2*N;                       // states per band incl. spin
  var nb = bands.length;
  var filled=[], remaining=ne, topIdx=-1, topFill=0;
  for(var b=0;b<nb;b++){
    var here=Math.min(remaining, cap);
    filled.push(here);
    if(here>0){ topIdx=b; topFill=here; }
    remaining-=here;
    if(remaining<=0) remaining=0;
  }
  var overflow = remaining;            // electrons with no band to hold them (above Emax model)
  var verdict, why, partly=false, hasGapAbove=false;
  var NOGAP = 1e-3;                    // narrower than this → bands "touch" (P→0 sliver), a metal
  var SEMI_GAP = 0.6;                  // honest thermal-scale stand-in, NOT a theorem: a small gap a few can hop
  if(ne===0){
    verdict='EMPTY'; why='no electrons poured yet';
  } else if(topIdx<0){
    verdict='EMPTY'; why='no electrons';
  } else if(topFill < cap){
    // top occupied band is partly filled → metal
    partly=true; verdict='METAL';
    why='the top band is <b>'+topFill+'/'+cap+' full</b> — partly filled, so electrons have empty states to move into.';
  } else {
    // top occupied band is exactly full. Is there a gap above it?
    if(topIdx < nb-1){
      var gap = bands[topIdx+1][0] - bands[topIdx][1];
      hasGapAbove = gap > NOGAP;
      if(hasGapAbove){
        if(gap < SEMI_GAP){ verdict='SEMICONDUCTOR'; why='the band is <b>full</b>, but only a <b>small gap ('+gap.toFixed(2)+')</b> blocks the next band — a few electrons can jump.'; }
        else { verdict='INSULATOR'; why='the band is <b>full</b> and a <b>gap of '+gap.toFixed(2)+'</b> blocks the next band — nowhere to move.'; }
      } else {
        verdict='METAL'; why='the band is full but <b>touches the next band (no gap)</b> — electrons flow straight into it.';
      }
    } else {
      // Full top band, no modeled band ABOVE it. Is its upper edge a TRUE forbidden
      // edge (|f|=1, a real gap opens above) or just the model-window cutoff Emax?
      var topEdge = bands[topIdx][1];
      var trueEdge = Math.abs(Math.abs(fDisp(topEdge, P_, a_)) - 1) < 1e-3;
      if(trueEdge){
        verdict='INSULATOR'; why='the top band is full and bounded by a forbidden edge with no band above — blocked.';
      } else {
        verdict='METAL'; why='the band runs unbroken with no gap above (free-electron limit) — electrons flow freely.';
      }
    }
  }
  return { verdict:verdict, why:why, filled:filled, cap:cap, topIdx:topIdx, topFill:topFill,
           partly:partly, hasGapAbove:hasGapAbove, overflow:overflow };
}
// === CORE END ===

export { kOf, fDisp, cellMatrix, halfTrace, detCell, findBands, energyAtQ,
         buildRing, ringMul, cyclicSolve, ringEigs, classify };
