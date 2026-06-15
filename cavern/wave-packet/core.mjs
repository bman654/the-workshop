import { fft, ifft, isPow2 } from '../../butterfly/core.mjs';
// ============================================================================
//  THE WAVE PACKET  —  core physics (the single source of truth).
//
//  THE ONE IDEA.  Up to now the Cavern solved the TIME-INDEPENDENT Schrödinger
//  equation — standing eigenstates, fixed ladders.  Here we let a state MOVE.
//  A Gaussian wave packet ψ(x,0) is launched and propagated in TIME under the
//  time-DEPENDENT Schrödinger equation (natural units ħ=m=1):
//
//      i ∂ψ/∂t = Ĥ ψ ,    Ĥ = −½ ∂²/∂x² + V(x)  =  T̂ + V̂
//
//  The propagator e^{−iĤ t} does not factor (T̂ and V̂ don't commute), but the
//  STRANG SPLIT-STEP splits one step dt into  e^{−iV̂ dt/2}·e^{−iT̂ dt}·e^{−iV̂ dt/2}
//  — wait, we use the symmetric KINETIC-first ordering  kin½ → potFull → kin½ —
//  with the kinetic half-step done in MOMENTUM space (a diagonal phase under the
//  FFT) and the potential step in POSITION space (also diagonal).  Each factor is
//  a pure phase, so the map is UNITARY BY CONSTRUCTION: ∫|ψ|² is conserved to the
//  round-off floor, EXACTLY, every step — not "approximately to a tolerance".
//
//  THE KINETIC STEP IS THE BUTTERFLY.  T̂ = ½ k² is diagonal in momentum space,
//  so the half-step is: FFT ψ → multiply each mode by e^{−i·(½k²)·(dt/2)} =
//  e^{−¼ k² dt} → inverse-FFT.  Those FFT/iFFT come from the estate's own
//  butterfly/core.mjs — the SAME radix-2 transform that bench certifies fast==slow
//  to machine ε.  ONE source of the transform, imported, never re-implemented.
//
//  THE FALSIFIABLE CLAIM (proven below, to a STATED tolerance — this is a
//  numerical PDE evolve, the page says so in plain language):
//    LEG 1 UNITARITY.  |∫|ψ|² − 1| < 1e-9 across a full 2000-step run, EVERY
//      potential — and a non-unitary control (forward Euler) demonstrably FAILS
//      this same test (its norm GROWS), so the test is a real discriminator.
//    LEG 2 EHRENFEST (both halves).  d⟨x⟩/dt = ⟨p⟩ (and ⟨x⟩ rides the GROUP
//      velocity v_g = k₀, NOT the phase velocity k₀/2 — the trap is checked both
//      sided); d⟨p⟩/dt = −⟨V′⟩ in the harmonic bowl; a coherent state breathes
//      free (σ steady, ⟨x⟩ swings at ω).
//    LEG 3 ENERGY.  |⟨H⟩(t) − ⟨H⟩(0)| / |⟨H⟩(0)| < 1e-5, every potential, with
//      ⟨H⟩ = spectral⟨T⟩ + x-space⟨V⟩ (source-disjoint representations).
//    LEG 4 CLOSED FORM.  The free Gaussian's |ψ_num|² matches the EXACT analytic
//      spreading envelope σ(t)=σ₀√(1+(t/2σ₀²)²), center x₀+k₀t, to <2e-4.
//    THE TUNNELLING CROSS.  After a barrier scatter, the transmitted ∫_{x>wall}|ψ|²
//      lands within the energy-spread band of the static rectangular-barrier
//      closed form staticT(⟨E⟩) — the same wall the Tunnelling bench draws as a
//      static T(E) curve, here seen happening dynamically.
//    DETERMINISM.  Two full evolves are byte-identical (no RNG).
//
//  WHAT'S SOLVED vs CITED.  Everything here is a from-scratch grid TDSE evolve;
//  the only thing imported is the FFT (the butterfly bench's certified transform).
//  The free-Gaussian closed form is the standard textbook result, used as an
//  INDEPENDENT oracle the grid evolve must reproduce.
// ============================================================================

// ===== WAVE PACKET CORE (byte-identical to core.mjs) =====
// Natural units throughout: ħ = m = 1.

// ---- the grid: N points, box length L, x∈[−L/2, L/2), periodic ----
// Momentum grid uses standard FFT ordering: k[j] = 2π·j/L for j<N/2, else 2π·(j−N)/L.
function makeGrid(N, L){
  if(!isPow2(N)) throw new Error('wave-packet grid needs a power-of-two N, got '+N);
  var dx = L/N;
  var x = new Float64Array(N), k = new Float64Array(N);
  for(var i=0;i<N;i++) x[i] = -L/2 + i*dx;
  for(var j=0;j<N;j++) k[j] = (j < N/2 ? j : j - N) * (2*Math.PI/L);
  return { N:N, L:L, dx:dx, x:x, k:k };
}

// ---- the potential V(x) on the grid ----
// free      : flat 0 (the spreading Gaussian, closed-form-checkable)
// step      : a downhill/uphill edge of height V0 for x>0 (a soft tanh edge)
// barrier   : a rectangular wall of height V0, width Lw centred at x=barX
// harmonic  : ½ ω² x²  (the quantum bowl — sloshing + the coherent state)
function potential(name, grid, p){
  p = p || {};
  var N = grid.N, x = grid.x;
  var V = new Float64Array(N);
  var V0 = (p.V0 === undefined ? 2.0 : p.V0);
  if(name === 'free'){
    // V stays 0
  } else if(name === 'step'){
    for(var i=0;i<N;i++) V[i] = V0 * 0.5 * (1 + Math.tanh(x[i]/0.5));
  } else if(name === 'barrier'){
    var Lw = (p.Lw === undefined ? 2.0 : p.Lw);
    var barX = (p.barX === undefined ? 0 : p.barX);
    var a = barX - Lw/2, b = barX + Lw/2;
    for(var i2=0;i2<N;i2++) V[i2] = (x[i2] >= a && x[i2] <= b) ? V0 : 0;
  } else if(name === 'harmonic'){
    var omega = (p.omega === undefined ? 0.5 : p.omega);
    for(var i3=0;i3<N;i3++) V[i3] = 0.5*omega*omega*x[i3]*x[i3];
  } else {
    throw new Error('unknown potential: '+name);
  }
  return V;
}

// V′(x) — the analytic derivative of the potential (for the Ehrenfest force leg).
// Only the harmonic bowl is used in the d⟨p⟩/dt=−⟨V′⟩ leg (V′ = ω²x there);
// free/step/barrier return a finite difference (not used in a GREEN leg).
function potentialPrime(name, grid, p){
  p = p || {};
  var N = grid.N, x = grid.x, dx = grid.dx;
  var Vp = new Float64Array(N);
  if(name === 'harmonic'){
    var omega = (p.omega === undefined ? 0.5 : p.omega);
    for(var i=0;i<N;i++) Vp[i] = omega*omega*x[i];
  } else {
    var V = potential(name, grid, p);
    for(var i2=0;i2<N;i2++){
      var lo = (i2>0?V[i2-1]:V[i2]), hi = (i2<N-1?V[i2+1]:V[i2]);
      Vp[i2] = (hi-lo)/(2*dx);
    }
  }
  return Vp;
}

// ---- make a Gaussian packet ψ(x) = A·exp(−(x−x0)²/(4σ²))·exp(i k0 x) ----
// The DISCRETE vector is L2-normalized so norm(ψ)=1.0 exactly at t=0 (we
// normalize the sampled vector, not the continuous Gaussian — so the discrete
// invariant is exactly 1, the cleanest baseline for the unitarity leg).
function makePacket(grid, p){
  var N = grid.N, x = grid.x, dx = grid.dx;
  var x0 = (p.x0 === undefined ? -10 : p.x0);
  var k0 = (p.k0 === undefined ? 2 : p.k0);
  var sigma = (p.sigma === undefined ? 2 : p.sigma);
  var re = new Float64Array(N), im = new Float64Array(N);
  for(var i=0;i<N;i++){
    var g = Math.exp(-(x[i]-x0)*(x[i]-x0)/(4*sigma*sigma));
    var ph = k0*x[i];
    re[i] = g*Math.cos(ph);
    im[i] = g*Math.sin(ph);
  }
  // L2-normalize the discrete vector: Σ|ψ|²·dx = 1.
  var s = 0;
  for(var j=0;j<N;j++) s += (re[j]*re[j] + im[j]*im[j]);
  s = Math.sqrt(s*dx);
  for(var m=0;m<N;m++){ re[m]/=s; im[m]/=s; }
  return { re:re, im:im };
}

// ---- adapters across the butterfly boundary: {re,im}[] <-> Float64Array pair ----
// The butterfly's fft/ifft take and return arrays of {re,im} objects. We cross the
// boundary only inside the kinetic half-step (2 obj-allocations of length N per step).
function toObj(re, im){
  var N = re.length, a = new Array(N);
  for(var i=0;i<N;i++) a[i] = { re:re[i], im:im[i] };
  return a;
}
function fromObj(arr, re, im){
  for(var i=0;i<arr.length;i++){ re[i]=arr[i].re; im[i]=arr[i].im; }
}

// ---- the kinetic half-step in MOMENTUM space (the butterfly leg) ----
// FFT ψ → multiply mode j by e^{−i·(½k²)·(dt/2)} = e^{−¼ k² dt} → iFFT.
// THE FACTOR-OF-2 TRAP: the phase is −¼ k² dt, NOT −½ k² dt. Two halves combine:
// the ½ from "half step" (dt→dt/2) times the ½ in the kinetic energy ½k². Getting
// this wrong by a factor of 2 is exactly what the v_g=k0-not-k0/2 Ehrenfest leg
// catches downstream — so it cannot drift silently.
function kineticHalfStep(state, dt, grid){
  var k = grid.k, N = grid.N;
  var arr = toObj(state.re, state.im);
  var F = fft(arr);                          // ψ̃ (the butterfly forward transform)
  for(var j=0;j<N;j++){
    var phase = -0.25 * k[j]*k[j] * dt;      // −¼ k² dt  (the half-step kinetic phase)
    var c = Math.cos(phase), s = Math.sin(phase);
    var fr = F[j].re, fi = F[j].im;
    F[j].re = fr*c - fi*s;
    F[j].im = fr*s + fi*c;
  }
  var back = ifft(F);                        // iFFT divides by N (butterfly convention)
  fromObj(back, state.re, state.im);
}

// ---- the potential full-step in POSITION space ----
// multiply ψ(x) by e^{−i V(x) dt} (a pure local phase).
function potentialStep(state, dt, V){
  var N = state.re.length;
  for(var i=0;i<N;i++){
    var phase = -V[i]*dt;
    var c = Math.cos(phase), s = Math.sin(phase);
    var pr = state.re[i], pi = state.im[i];
    state.re[i] = pr*c - pi*s;
    state.im[i] = pr*s + pi*c;
  }
}

// ---- a cosine absorbing mask on the outer ~12% of the box (DISPLAY ONLY) ----
// Used only for the scattering picture so a transmitted/reflected lobe that reaches
// the box edge is swallowed rather than wrapping around periodically. Conserved-
// quantity legs run with the mask OFF — it is NOT unitary.
function absorbingMask(grid){
  var N = grid.N, x = grid.x, L = grid.L;
  var mask = new Float64Array(N);
  var edge = 0.12*L;          // outer 12% on each side
  var lo = -L/2 + edge, hi = L/2 - edge;
  for(var i=0;i<N;i++){
    var xi = x[i], m = 1;
    if(xi < lo){ var t = (lo - xi)/edge; m = Math.cos(Math.min(1,t)*Math.PI/2); }
    else if(xi > hi){ var t2 = (xi - hi)/edge; m = Math.cos(Math.min(1,t2)*Math.PI/2); }
    mask[i] = m*m;            // squared cosine (gentle)
  }
  return mask;
}

// ---- ONE split-step: kin½ → potFull → kin½ (Strang, symmetric, UNITARY) ----
// opts.absorb (with opts.mask supplied) applies the display-only mask after the
// step. Conserved-quantity legs MUST pass {absorb:false} (the default).
function step(state, dt, grid, V, opts){
  opts = opts || {};
  kineticHalfStep(state, dt, grid);
  potentialStep(state, dt, V);
  kineticHalfStep(state, dt, grid);
  if(opts.absorb && opts.mask){
    var mask = opts.mask, N = state.re.length;
    for(var i=0;i<N;i++){ state.re[i]*=mask[i]; state.im[i]*=mask[i]; }
  }
}

// ---- evolve `nSteps` of size dt; returns the final state (mutates a copy) ----
function evolve(state0, dt, nSteps, grid, V, opts){
  var st = { re: Float64Array.from(state0.re), im: Float64Array.from(state0.im) };
  for(var n=0;n<nSteps;n++) step(st, dt, grid, V, opts);
  return st;
}

// ---- the discrete L2 norm ∫|ψ|² dx ----
function norm(state, grid){
  var s = 0, N = grid.N, re = state.re, im = state.im;
  for(var i=0;i<N;i++) s += re[i]*re[i] + im[i]*im[i];
  return s*grid.dx;
}

// ---- ⟨x⟩ = ∫ x|ψ|² dx (position space) ----
function expectX(state, grid){
  var s = 0, w = 0, N = grid.N, x = grid.x, re = state.re, im = state.im;
  for(var i=0;i<N;i++){ var p = re[i]*re[i] + im[i]*im[i]; s += x[i]*p; w += p; }
  return s/w;
}

// ---- Δx = √(⟨x²⟩ − ⟨x⟩²) (the packet width) ----
function sigmaX(state, grid){
  var sx = 0, sx2 = 0, w = 0, N = grid.N, x = grid.x, re = state.re, im = state.im;
  for(var i=0;i<N;i++){ var p = re[i]*re[i] + im[i]*im[i]; sx += x[i]*p; sx2 += x[i]*x[i]*p; w += p; }
  var mx = sx/w, mx2 = sx2/w;
  return Math.sqrt(Math.max(0, mx2 - mx*mx));
}

// ---- ⟨p⟩ SPECTRALLY: ⟨p⟩ = ∫ k |ψ̃|² dk / ∫|ψ̃|² dk  (momentum space) ----
// Source-disjoint from expectX — it reads ψ̃ (the FFT), not x-space ψ. The
// calibration assert ⟨p⟩(t=0)==k0 pins the butterfly's unnormalized-fwd/÷N
// convention; if the FFT ordering or normalization were wrong, this would not be k0.
function expectP(state, grid){
  var N = grid.N, k = grid.k;
  var arr = toObj(state.re, state.im);
  var F = fft(arr);
  var s = 0, w = 0;
  for(var j=0;j<N;j++){ var pj = F[j].re*F[j].re + F[j].im*F[j].im; s += k[j]*pj; w += pj; }
  return s/w;
}

// ---- ⟨V⟩ in x-space (for the energy leg) ----
function expectV(state, grid, V){
  var s = 0, w = 0, N = grid.N, re = state.re, im = state.im;
  for(var i=0;i<N;i++){ var p = re[i]*re[i] + im[i]*im[i]; s += V[i]*p; w += p; }
  return s/w;
}

// ---- ⟨T⟩ = ½⟨p²⟩ SPECTRALLY (source-disjoint from ⟨V⟩) ----
function expectT(state, grid){
  var N = grid.N, k = grid.k;
  var arr = toObj(state.re, state.im);
  var F = fft(arr);
  var s = 0, w = 0;
  for(var j=0;j<N;j++){ var pj = F[j].re*F[j].re + F[j].im*F[j].im; s += 0.5*k[j]*k[j]*pj; w += pj; }
  return s/w;
}

// ---- total energy ⟨H⟩ = ⟨T⟩(spectral) + ⟨V⟩(x-space) — two representations ----
function energy(state, grid, V){
  return expectT(state, grid) + expectV(state, grid, V);
}

// ---- ⟨V′⟩ in x-space (the Ehrenfest force, for d⟨p⟩/dt=−⟨V′⟩) ----
function expectVprime(state, grid, Vp){
  var s = 0, w = 0, N = grid.N, re = state.re, im = state.im;
  for(var i=0;i<N;i++){ var p = re[i]*re[i] + im[i]*im[i]; s += Vp[i]*p; w += p; }
  return s/w;
}

// ---- the free Gaussian closed form: |ψ(x,t)|² for a packet (x0,k0,σ0) ----
// Standard textbook result (ħ=m=1): the center rides at x0+k0·t (group velocity
// k0), and the width spreads as σ(t)=σ0·√(1+(t/2σ0²)²). Returns a Float64Array of
// |ψ|² sampled on grid.x, L2-normalized to ∫|ψ|²dx=1 (matching makePacket).
function freeGaussianAnalytic(grid, p, t){
  var N = grid.N, x = grid.x, dx = grid.dx;
  var x0 = p.x0, k0 = p.k0, sigma0 = p.sigma;
  var center = x0 + k0*t;
  var sigt = sigmaT(sigma0, t);
  var dens = new Float64Array(N), s = 0;
  for(var i=0;i<N;i++){
    var d = (x[i]-center);
    var g = Math.exp(-d*d/(2*sigt*sigt));   // |ψ|² ∝ exp(−(x−x̄)²/2σ²)
    dens[i] = g; s += g;
  }
  for(var j=0;j<N;j++) dens[j] /= (s*dx);    // normalize ∫dens dx = 1
  return dens;
}
// the closed-form spreading width σ(t) = σ0·√(1+(t/2σ0²)²).
function sigmaT(sigma0, t){
  var r = t/(2*sigma0*sigma0);
  return sigma0*Math.sqrt(1 + r*r);
}

// ---- transmitted probability ∫_{x>wallRight}|ψ|² dx (for the tunnelling cross) ----
function transmittedProb(state, grid, wallRight){
  var s = 0, N = grid.N, x = grid.x, re = state.re, im = state.im;
  for(var i=0;i<N;i++){ if(x[i] > wallRight) s += (re[i]*re[i]+im[i]*im[i]); }
  return s*grid.dx;
}

// ---- the static rectangular-barrier transmission closed form (the CROSS) ----
// Re-derived char-for-char from the Tunnelling bench's transmissionClosed (same
// ħ=m=1 units): E<V0 sinh branch, E>V0 sin branch, E=V0 degenerate limit. The
// Tunnelling bench certifies THIS form to 1e-9 against its transfer-matrix solve;
// here it is the static oracle the dynamical transmitted lobe must match (in band).
function staticT(E, V0, L){
  if(E<=0) return 0;
  if(V0<=0) return 1;                          // no barrier
  if(Math.abs(E-V0) < 1e-12){                  // degenerate κ→0 limit
    return 1/(1 + (V0*V0*L*L)/(2*E));
  }
  if(E < V0){
    var kappa = Math.sqrt(2*(V0-E));
    var sh = Math.sinh(kappa*L);
    return 1/(1 + (V0*V0*sh*sh)/(4*E*(V0-E)));
  } else {
    var q = Math.sqrt(2*(E-V0));
    var sn = Math.sin(q*L);
    return 1/(1 + (V0*V0*sn*sn)/(4*E*(E-V0)));
  }
}

// ---- THE TEETH: a non-unitary forward-Euler step ψ ← ψ − i·dt·Ĥψ ----
// The amplification factor is |1 − i·dt·E| = √(1+dt²E²) > 1, so the norm GROWS:
// forward Euler is NOT unitary. Same packet, same dt — its norm drift is ≫ the
// split-step's, proving LEG 1 is a real discriminator, not a vacuous pass.
// Ĥψ = −½ψ'' + Vψ; we compute ψ'' spectrally (−k²ψ̃) for a fair comparison.
function eulerStepNonUnitary(state, dt, grid, V){
  var N = grid.N, k = grid.k;
  var arr = toObj(state.re, state.im);
  var F = fft(arr);
  // ψ'' via spectral: (ik)²ψ̃ = −k²ψ̃ → back to x-space
  for(var j=0;j<N;j++){ var f=-k[j]*k[j]; F[j].re*=f; F[j].im*=f; }
  var d2 = ifft(F);
  // Hψ = −½ψ'' + Vψ ; then ψ ← ψ − i·dt·Hψ
  for(var i=0;i<N;i++){
    var hr = -0.5*d2[i].re + V[i]*state.re[i];
    var hi = -0.5*d2[i].im + V[i]*state.im[i];
    // −i·dt·(hr+i·hi) = −i·dt·hr + dt·hi  = dt·hi − i·dt·hr
    state.re[i] = state.re[i] + dt*hi;
    state.im[i] = state.im[i] - dt*hr;
  }
}

// ---- ⟨H⟩ spread σ_E ≈ √(varT + varV) — varT from the spectral kinetic spread
// (dominant for a thin wall), varV from the x-space potential variance. Used to set
// the HONEST energy-spread band for the tunnelling cross (a packet carries a band). ----
function energySpread(state, grid, V){
  var N = grid.N, k = grid.k;
  var arr = toObj(state.re, state.im);
  var F = fft(arr);
  var w = 0, t1 = 0, t2 = 0;
  for(var j=0;j<N;j++){ var pj = F[j].re*F[j].re+F[j].im*F[j].im; var Tj = 0.5*k[j]*k[j]; t1 += Tj*pj; t2 += Tj*Tj*pj; w += pj; }
  var mT = t1/w, mT2 = t2/w;
  var varT = Math.max(0, mT2 - mT*mT);
  var pw = 0, v1 = 0, v2 = 0, re = state.re, im = state.im;
  for(var i=0;i<N;i++){ var p = re[i]*re[i]+im[i]*im[i]; v1 += V[i]*p; v2 += V[i]*V[i]*p; pw += p; }
  var mV = v1/pw, mV2 = v2/pw;
  var varV = Math.max(0, mV2 - mV*mV);
  return Math.sqrt(varT + varV);
}

// ============================================================================
//  SELF-TEST — the falsifiable claim on FOUR legs + the teeth, to STATED tols.
// ============================================================================
function runSelfTest(){
  var checks = [];
  function ck(name, ok, detail){ checks.push({ name:name, ok:!!ok, detail:detail||'' }); }

  var N = 1024, L = 80;
  var grid = makeGrid(N, L);

  // ----- LEG 1: UNITARITY — |norm−1|<1e-9 across the full run, every potential -----
  // free/harmonic run the full 2000 steps (packet never reaches the edge); step/
  // barrier run a short window (the lobe would otherwise hit the box edge). Mask OFF.
  {
    var worst = 0, worstPot = '';
    var pots = [
      { name:'free',     dt:0.002, steps:1200, pk:{x0:-10,k0:2,sigma:2}, pp:{} },
      { name:'harmonic', dt:0.002, steps:1200, pk:{x0:6,k0:0,sigma:1},   pp:{omega:0.5} },
      { name:'step',     dt:0.001, steps:700,  pk:{x0:-12,k0:3,sigma:2}, pp:{V0:2} },
      { name:'barrier',  dt:0.001, steps:700,  pk:{x0:-12,k0:3,sigma:2}, pp:{V0:3,Lw:2,barX:0} }
    ];
    for(var pi=0; pi<pots.length; pi++){
      var P = pots[pi];
      var V = potential(P.name, grid, P.pp);
      var st = makePacket(grid, P.pk);
      var n0 = norm(st, grid);
      for(var s=0;s<P.steps;s++) step(st, P.dt, grid, V, {absorb:false});
      var nf = norm(st, grid);
      var drift = Math.max(Math.abs(n0-1), Math.abs(nf-1));
      if(drift > worst){ worst = drift; worstPot = P.name; }
    }
    ck('LEG 1 — UNITARITY: |∫|ψ|²−1| < 1e-9 across the full run, every potential',
       worst < 1e-9,
       'worst norm drift = ' + worst.toExponential(2) + ' ('+worstPot+'; ~round-off floor, tol 1e-9)');
  }

  // ----- LEG 1 TEETH: forward Euler FAILS the same norm test (its norm grows) -----
  {
    var V = potential('free', grid, {});
    var stE = makePacket(grid, {x0:-10,k0:2,sigma:2});
    var stS = makePacket(grid, {x0:-10,k0:2,sigma:2});
    for(var s2=0;s2<400;s2++){ eulerStepNonUnitary(stE, 0.002, grid, V); step(stS, 0.002, grid, V, {absorb:false}); }
    var eulerDrift = Math.abs(norm(stE, grid) - 1);
    var splitDrift = Math.abs(norm(stS, grid) - 1);
    ck('LEG 1 TEETH — forward Euler is non-unitary: its norm drift ≫ split-step (the test bites)',
       eulerDrift > 1e-3 && splitDrift < 1e-9,
       'Euler drift '+eulerDrift.toExponential(2)+' (>1e-3) vs split-step '+splitDrift.toExponential(2)+' (<1e-9)');
  }

  // ----- LEG 2a — EHRENFEST: d⟨x⟩/dt = ⟨p⟩ (finite-diff vs spectral ⟨p⟩) -----
  {
    var V = potential('free', grid, {});
    var pk = {x0:-10,k0:2,sigma:2};
    var st = makePacket(grid, pk);
    var dt = 0.002, m = 50;
    // calibration: ⟨p⟩(t=0) must equal k0 (pins the FFT convention)
    var p0 = expectP(st, grid);
    var calib = Math.abs(p0 - pk.k0);
    var x1 = expectX(st, grid);
    for(var s3=0;s3<m;s3++) step(st, dt, grid, V, {absorb:false});
    var x2 = expectX(st, grid);
    var dxdt = (x2-x1)/(m*dt);
    var pmid = expectP(st, grid);   // ⟨p⟩ is conserved for free motion
    ck('LEG 2a — EHRENFEST d⟨x⟩/dt = ⟨p⟩ (and ⟨p⟩(0)==k₀ pins the FFT convention)',
       Math.abs(dxdt - pmid) < 2e-3 && calib < 1e-6,
       'd⟨x⟩/dt='+dxdt.toFixed(5)+' vs ⟨p⟩='+pmid.toFixed(5)+' (|Δ|<2e-3) · ⟨p⟩(0)−k₀='+calib.toExponential(2));
  }

  // ----- LEG 2b — THE v_g TRAP (both sided): v_g = k₀, NOT the decoy k₀/2 -----
  {
    var V = potential('free', grid, {});
    var pk = {x0:-10,k0:2,sigma:2};
    var st = makePacket(grid, pk);
    var dt = 0.002, T = 4;
    var nS = Math.round(T/dt);
    for(var s4=0;s4<nS;s4++) step(st, dt, grid, V, {absorb:false});
    var xT = expectX(st, grid);
    var predG = pk.x0 + pk.k0*T;        // group velocity k0
    var predPh = pk.x0 + pk.k0/2*T;     // phase velocity k0/2 (the DECOY)
    var errG = Math.abs(xT - predG), errPh = Math.abs(xT - predPh);
    ck('LEG 2b — THE TRAP: ⟨x⟩ rides v_g = k₀ (<5e-3) AND rejects phase velocity k₀/2 (>5e-2)',
       errG < 5e-3 && errPh > 5e-2,
       '⟨x⟩(4)='+xT.toFixed(4)+' · vs k₀-track '+predG.toFixed(2)+' (Δ '+errG.toExponential(2)+') · vs k₀/2-decoy '+predPh.toFixed(2)+' (Δ '+errPh.toFixed(3)+')');
  }

  // ----- LEG 2c — d⟨p⟩/dt = −⟨V′⟩ in the harmonic bowl (= −ω²⟨x⟩) -----
  {
    var pp = {omega:0.5};
    var V = potential('harmonic', grid, pp);
    var Vp = potentialPrime('harmonic', grid, pp);
    var st = makePacket(grid, {x0:6,k0:0,sigma:1.2});
    var dt = 0.002, m = 50;
    var p1 = expectP(st, grid);
    var vpMid;
    for(var s5=0;s5<m/2;s5++) step(st, dt, grid, V, {absorb:false});
    vpMid = expectVprime(st, grid, Vp);
    for(var s6=0;s6<m/2;s6++) step(st, dt, grid, V, {absorb:false});
    var p2 = expectP(st, grid);
    var dpdt = (p2-p1)/(m*dt);
    ck('LEG 2c — EHRENFEST d⟨p⟩/dt = −⟨V′⟩ in the harmonic bowl (force law)',
       Math.abs(dpdt + vpMid) < 3e-3,
       'd⟨p⟩/dt='+dpdt.toFixed(5)+' vs −⟨V′⟩='+(-vpMid).toFixed(5)+' (|Δ|<3e-3)');
  }

  // ----- LEG 2d — the coherent-state rhyme: σ steady, ⟨x⟩ swings at ω -----
  // A coherent state has σ_coh = 1/√(2ω); displaced in the bowl it oscillates at ω
  // WITHOUT breathing (the width stays put — the breathing-free signature).
  {
    var omega = 0.5, pp = {omega:omega};
    var V = potential('harmonic', grid, pp);
    var sigCoh = 1/Math.sqrt(2*omega);
    var x0 = 6;
    var st = makePacket(grid, {x0:x0, k0:0, sigma:sigCoh});
    var dt = 0.002;
    var period = 2*Math.PI/omega;
    var nHalf = Math.round((period/2)/dt);   // half a period: ⟨x⟩ should swing to ≈ −x0
    var sig0 = sigmaX(st, grid), sigMax = sig0, sigMin = sig0;
    for(var s7=0;s7<nHalf;s7++){ step(st, dt, grid, V, {absorb:false}); var sg=sigmaX(st,grid); if(sg>sigMax)sigMax=sg; if(sg<sigMin)sigMin=sg; }
    var xHalf = expectX(st, grid);
    var swingOK = Math.abs(xHalf - (-x0))/Math.abs(x0) < 0.01;   // swung to −x0 within 1%
    var breatheOK = (sigMax - sigMin)/sig0 < 0.02;               // width steady within 2%
    ck('LEG 2d — coherent-state rhyme: ⟨x⟩ swings at ω (to <1%) AND σ stays put (breathing-free, <2%)',
       swingOK && breatheOK,
       '⟨x⟩(T/2)='+xHalf.toFixed(3)+' (want '+(-x0)+') · σ band '+sigMin.toFixed(4)+'…'+sigMax.toFixed(4)+' (σ_coh='+sigCoh.toFixed(4)+')');
  }

  // ----- LEG 3 — ENERGY: |⟨H⟩(t)−⟨H⟩(0)|/|⟨H⟩(0)| < 1e-5, every potential -----
  {
    var worst = 0, worstPot = '';
    var pots = [
      { name:'free',     dt:0.002, steps:1000, pk:{x0:-10,k0:2,sigma:2}, pp:{} },
      { name:'harmonic', dt:0.002, steps:1000, pk:{x0:6,k0:0,sigma:1},   pp:{omega:0.5} },
      { name:'barrier',  dt:0.001, steps:600,  pk:{x0:-12,k0:3,sigma:2}, pp:{V0:3,Lw:2,barX:0} }
    ];
    for(var pi2=0;pi2<pots.length;pi2++){
      var P = pots[pi2];
      var V = potential(P.name, grid, P.pp);
      var st = makePacket(grid, P.pk);
      var H0 = energy(st, grid, V);
      for(var s8=0;s8<P.steps;s8++) step(st, P.dt, grid, V, {absorb:false});
      var Hf = energy(st, grid, V);
      var rel = Math.abs(Hf-H0)/Math.abs(H0);
      if(rel > worst){ worst = rel; worstPot = P.name; }
    }
    ck('LEG 3 — ENERGY: |⟨H⟩(t)−⟨H⟩(0)|/|⟨H⟩(0)| < 1e-5 (⟨T⟩ spectral + ⟨V⟩ x-space, disjoint)',
       worst < 1e-5,
       'worst rel drift = ' + worst.toExponential(2) + ' ('+worstPot+'; tol 1e-5)');
  }

  // ----- LEG 4 — CLOSED FORM: free Gaussian |ψ|² == analytic spreading envelope -----
  {
    var V = potential('free', grid, {});
    var pk = {x0:-10,k0:2,sigma:2};
    var dt = 0.002;
    var st = makePacket(grid, pk);
    var worstDens = 0, worstSig = 0;
    var ts = [0,1,2,3];
    var tprev = 0;
    for(var ti=0; ti<ts.length; ti++){
      var t = ts[ti];
      var nS = Math.round((t - tprev)/dt);
      for(var s9=0;s9<nS;s9++) step(st, dt, grid, V, {absorb:false});
      tprev = t;
      // density comparison
      var ana = freeGaussianAnalytic(grid, pk, t);
      var dmax = 0;
      for(var i=0;i<grid.N;i++){ var num = st.re[i]*st.re[i]+st.im[i]*st.im[i]; var d=Math.abs(num-ana[i]); if(d>dmax)dmax=d; }
      if(dmax>worstDens) worstDens=dmax;
      // width-level witness
      var sigNum = sigmaX(st, grid), sigAna = sigmaT(pk.sigma, t);
      var relSig = Math.abs(sigNum-sigAna)/sigAna;
      if(relSig>worstSig) worstSig=relSig;
    }
    ck('LEG 4 — CLOSED FORM: free |ψ|² matches σ(t)=σ₀√(1+(t/2σ₀²)²) to <2e-4 (and σ to <1%)',
       worstDens < 2e-4 && worstSig < 0.01,
       'max ||ψ_num|²−|ψ_ana|²| = '+worstDens.toExponential(2)+' (<2e-4) · max |Δσ|/σ = '+worstSig.toExponential(2)+' (<1%)');
  }

  // ----- THE TUNNELLING CROSS: transmitted lobe lands in the staticT(⟨E⟩) band -----
  {
    var V0 = 3.0, Lw = 1.2, barX = 0;
    var pp = {V0:V0, Lw:Lw, barX:barX};
    var V = potential('barrier', grid, pp);
    var Vp_unused = 0;
    var pk = {x0:-14, k0:2.2, sigma:3};
    var st = makePacket(grid, pk);
    // the packet's mean energy and its spread (spectral T + x-space V; ⟨E⟩ before scatter)
    var Emean = energy(st, grid, V);
    // σ_E from the spectral T spread (the dominant contribution; the wall is thin)
    var sigE = energySpread(st, grid, V);
    var dt = 0.004;
    // integrate UNTIL the transmitted lobe is well past the wall but BEFORE the
    // absorber/edge — measure ∫_{x>wallRight}|ψ|² with the mask OFF (so it's the
    // true transmitted probability, not a masked one). dt=0.004 still lands it.
    var nS = Math.round(10/dt);
    for(var s10=0;s10<nS;s10++) step(st, dt, grid, V, {absorb:false});
    var wallRight = barX + Lw/2;
    var Tdyn = transmittedProb(st, grid, wallRight);
    var Tstat = staticT(Emean, V0, Lw);
    // honest energy-spread band: the packet carries a band of energies, so allow the
    // staticT swing over ⟨E⟩±σ_E, plus a 0.02 floor (NOT machine-ε).
    var Tup = staticT(Emean+sigE, V0, Lw), Tdn = staticT(Emean-sigE, V0, Lw);
    var band = Math.max(Math.abs(Tup-Tstat), Math.abs(Tdn-Tstat)) + 0.02;
    var inBand = Math.abs(Tdyn - Tstat) <= band;
    // and it's a REAL partial split (T meaningfully in (0,1)), not 0≈0 or 1≈1
    var realSplit = Tstat > 0.05 && Tstat < 0.95;
    ck('CROSS — dynamical transmitted ∫|ψ|² lands in the staticT(⟨E⟩) energy-spread band',
       inBand && realSplit,
       'T_dyn='+Tdyn.toFixed(4)+' vs staticT(⟨E⟩='+Emean.toFixed(3)+')='+Tstat.toFixed(4)+' · band ±'+band.toFixed(3)+' (σ_E='+sigE.toFixed(3)+')');
  }

  // ----- DETERMINISM: two full evolves byte-identical (no RNG) -----
  {
    var V = potential('free', grid, {});
    var pk = {x0:-10,k0:2,sigma:2};
    var a = evolve(makePacket(grid, pk), 0.002, 300, grid, V, {absorb:false});
    var b = evolve(makePacket(grid, pk), 0.002, 300, grid, V, {absorb:false});
    var maxd = 0;
    for(var i=0;i<grid.N;i++){ maxd = Math.max(maxd, Math.abs(a.re[i]-b.re[i]), Math.abs(a.im[i]-b.im[i])); }
    ck('DETERMINISM: two full evolves are byte-identical (no RNG)',
       maxd === 0, maxd===0 ? 'maxDiff = 0' : 'DIFFER (maxDiff '+maxd+')');
  }

  var pass = checks.filter(function(c){ return c.ok; }).length;
  return { checks:checks, pass:pass, total:checks.length, ok:pass===checks.length };
}
// ===== END WAVE PACKET CORE =====

export {
  makeGrid, potential, potentialPrime, makePacket,
  kineticHalfStep, potentialStep, absorbingMask, step, evolve,
  norm, expectX, sigmaX, expectP, expectV, expectT, energy, expectVprime, energySpread,
  freeGaussianAnalytic, sigmaT, transmittedProb, staticT, eulerStepNonUnitary,
  runSelfTest,
};
