/* ════════════════════════════════════════════════════════════════
   THE SQUEEZE · physics CORE  (the SOLE authority)
   ════════════════════════════════════════════════════════════════
   A single slit, seen as the uncertainty principle made touchable.
   Natural units ħ = 1. An aperture A(x) lets a beam through; the slit
   PINS the transverse position to a spread Δx, and Fourier conjugacy
   forces the transverse momentum to spread by Δp — the far-field
   fan on the screen. The product Δx·Δp can never fall below ħ/2 = 0.5.

   Δx and Δp are RMS SECOND MOMENTS of |A(x)|² and |Ã(k)|² about their
   means (both centred ⇒ means are 0). The minimum-uncertainty state is
   the GAUSSIAN: it SATURATES the bound, Δx·Δp = ħ/2 exactly, for EVERY
   width. The load-bearing counter-example is the TOP-HAT (a hard-edged
   slit): at the SAME Δx its product is STRICTLY LARGER — the sinc tails
   of its diffraction pattern carry extra momentum spread. That "sinc
   tax" is the gap above the floor you can see on the bench.

   • Gaussian aperture A(x) = exp(−x²/(4σ²))  ⇒  |Ã(k)|² ∝ exp(−2σ²k²)
       Δx = σ                      (RMS of |A|²)
       Δp = 1/(2σ)                 (CLOSED FORM — exact saturating oracle)
       Δx·Δp = 1/2 exactly, ∀σ.
   • Top-hat aperture A(x) = 1 on |x| < a, 0 outside ⇒ |Ã(k)|² ∝ sinc²(ka)
       Δx = a/√3                   (RMS of a uniform [−a,a])
       Δp = √(⟨k²⟩) over a WINDOW k ∈ [−K, K], K = m·π/a (m sinc-zeros).
       The full sinc² has a divergent ⟨k²⟩ (the hard edges put weight in
       arbitrarily high modes); the physical screen captures a finite
       window of central lobes. With the default central lobe (m=1) the
       product is 0.6076282894… > 0.5 — the floor holds, strictly.

   WINDOW CONVENTION: ⟨k²⟩ for the top-hat is integrated over k ∈ [−K,K],
   K = m·π/a (m central sinc-lobes, default m=1). The product GROWS with
   m (a wider window admits the higher-momentum tails) and is SCALE-
   INVARIANT in a (Δx ∝ a, Δp ∝ 1/a, product fixed). The windowed ⟨k²⟩
   is a Simpson quadrature on Ng = 4000 intervals — PROVEN grid-stable:
   Ng=4000 gives 0.60762829, identical to Ng=200000 to 8 digits, so the
   1e-7 test tolerance is honest (the integrand is smooth; convergence is
   far better than O(h) here — the grid is generous, not marginal).

   The block between // === CORE BEGIN === and // === CORE END === is
   INLINED byte-identical into index.html; core.test.mjs proves that
   parity AND the three proofs (Gaussian saturates to ε · top-hat at the
   same Δx is strictly larger · a swept width-sweep never falls below
   ħ/2) plus the corroborators (window monotone & scale-invariant; the
   far-field shape matches an FFT of A(x); determinism). Nothing else
   computes the product.
   ════════════════════════════════════════════════════════════════ */
// === CORE BEGIN ===

// ── natural units ──
function HBAR(){ return 1; }
function floor_(){ return HBAR()/2; }              // the forbidden floor: ħ/2 = 0.5

// ── position spread Δx (RMS second moment of |A(x)|²) ──
// gauss: A=exp(−x²/(4σ²)) ⇒ |A|²=exp(−x²/(2σ²)) ⇒ RMS = σ = w
// tophat: uniform on |x|<a ⇒ RMS = a/√3
function deltaX(profile, w){ return profile === 'gauss' ? w : w/Math.sqrt(3); }

// ── momentum spread Δp ──
// gauss: CLOSED FORM. |Ã|²∝exp(−2σ²k²) ⇒ ⟨k²⟩=1/(4σ²) ⇒ Δp = 1/(2σ).
function deltaPgauss(sigma){ return 1/(2*sigma); }

// sinc(t) = sin(t)/t (sinc(0)=1) — the top-hat's far-field amplitude shape.
function sinc(t){ return t === 0 ? 1 : Math.sin(t)/t; }

// far-field INTENSITY |Ã(k)|² (unnormalized) for the VISUAL speckle/envelope.
// gauss → exp(−2σ²k²);  tophat → sinc²(ka).
function farFieldIntensity(profile, w, k){
  if(profile === 'gauss'){ return Math.exp(-2*w*w*k*k); }
  var s = sinc(k*w); return s*s;
}

// Simpson quadrature of f over [lo,hi] with N (even) intervals.
function simpsonInt(f, lo, hi, N){
  var h = (hi-lo)/N, s = f(lo) + f(hi);
  for(var i=1;i<N;i++){ s += (i % 2 ? 4 : 2) * f(lo + i*h); }
  return s*h/3;
}

// ── top-hat Δp: √⟨k²⟩ over the WINDOW k∈[−K,K], K = m·π/a (m sinc-zeros) ──
// ⟨k²⟩ = ∫ k²·sinc²(ka) dk / ∫ sinc²(ka) dk  on the window. Default Ng=4000.
function deltaPtophatWindowed(a, m, Ngrid){
  m = m || 1; Ngrid = Ngrid || 4000;
  var K = m*Math.PI/a;
  var I0 = simpsonInt(function(k){ var s=sinc(k*a); return s*s; }, -K, K, Ngrid);
  var I2 = simpsonInt(function(k){ var s=sinc(k*a); return k*k*s*s; }, -K, K, Ngrid);
  return Math.sqrt(I2/I0);                          // ⟨k⟩=0 by symmetry
}

// ── the product Δx·Δp ──
// gauss → deltaX·deltaPgauss == 0.5 exactly (the saturated floor).
// tophat → deltaX·deltaPtophatWindowed == 0.6076282894… (m=1) > 0.5.
function product(profile, w, m){
  if(profile === 'gauss'){ return deltaX('gauss', w) * deltaPgauss(w); }
  return deltaX('tophat', w) * deltaPtophatWindowed(w, m || 1);
}

// ── the published claim — the numbers the page MUST read from, never a literal ──
var CLAIM = {
  hbar: 1,
  floor: 0.5,
  gaussProduct: 0.5,
  tophatProductM1: 0.6076282894,
  window: 'k∈[−K,K], K=m·π/a (m sinc-zeros); default m=1'
};

// ── the live-state contract: the ONE function the renderer + readout + needle read ──
// dx,dp,product in physical (ħ=1) units; saturated fires iff the product is the floor.
// The SAME ε the self-test uses and the SAME predicate that lights the green "kiss".
var LIVE_EPS = 1e-9;
function live(profile, a, m){
  m = m || 1;
  var dx = deltaX(profile, a);
  var dp = profile === 'gauss' ? deltaPgauss(a) : deltaPtophatWindowed(a, m);
  var prod = product(profile, a, m);
  return { dx:dx, dp:dp, product:prod, floor:floor_(), saturated: Math.abs(prod - floor_()) < LIVE_EPS };
}

// ── the SPECKLE sampler (VISUAL only — never feeds the needle) ──
// returns f(u01) → k, sampling the far-field intensity. gauss: exact inverse
// (k = √(−ln(1−u)/(2σ²))·sign); tophat: rejection on sinc² over k∈[−K,K] with a
// tight comparison envelope so land() never starves. rng injectable for the test.
function farFieldSampler(a, profile, m){
  m = m || 1;
  if(profile === 'gauss'){
    // |Ã|² ∝ exp(−2σ²k²): a centred Gaussian with std = 1/(2σ) (= Δp).
    // Box–Muller from two uniforms → exact Gaussian draw, scaled to σ_k = 1/(2σ).
    var sk = 1/(2*a);
    return function(rng){
      var u1 = (rng ? rng() : Math.random()), u2 = (rng ? rng() : Math.random());
      if(u1 < 1e-12) u1 = 1e-12;
      return Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2) * sk;
    };
  }
  // top-hat: rejection sample sinc²(ka) on k∈[−K,K], K = m·π/a.
  var K = m*Math.PI/a;
  return function(rng){
    var r = rng ? rng : Math.random;
    for(var tries=0; tries<200; tries++){
      var k = (r()*2 - 1) * K;                       // uniform on [−K,K]
      var s = sinc(k*a), y = s*s;                     // target ∝ sinc² (peak 1 at k=0)
      if(r() <= y) return k;                          // envelope = peak (=1) ⇒ no starve
    }
    return 0;                                          // fallback (vanishingly rare)
  };
}

// === CORE END ===

export { HBAR, floor_, deltaX, deltaPgauss, sinc, farFieldIntensity,
         simpsonInt, deltaPtophatWindowed, product, CLAIM, live, farFieldSampler };
