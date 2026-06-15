// ============================================================================
//  TWO WINGS, ONE SLIT — the INTERFERENCE CORE (the SOLE array-factor authority).
//
//  Pure, dependency-free. After this cycle this file owns the ONE place in the
//  whole estate where the N-slit array factor [ sin(Nφ)/(N·sinφ) ]² is computed.
//  Both wings delegate to it: the Cavern's double-slit reads arrayFactorPhi(2,·)
//  for its cos² fringe term; the Hall's diffraction grating reads N²·arrayFactorPhi(N,·)
//  for its bracket. The new bench inlines the whole core. The anti-circularity
//  grep in interference-core.test.mjs forbids any second `sin(N…)/…sin` ratio.
//
//  THE NORMALIZATION DECISION — read this, all three facets assume it:
//    arrayFactor is normalized to PEAK 1. The principal maxima PIN at height 1
//    for every N; raising N only NARROWS them, it never raises them. This is the
//    morph panel's whole thesis ("grown patient, not louder") AND it is what makes
//    arrayFactor(2,·) === cos² exactly (cos² also peaks at 1). The Hall's diffraction
//    bracket is the UN-normalized geometric sum whose peak is N²; it recovers that
//    by writing N²·arrayFactorPhi(N,·) — the factor of N² lives on the Hall's side,
//    NOT in the core. The slit-WIDTH envelope (sinc²) is each wing's own business
//    and is NOT in the core — the core is the dimensionless array factor alone.
//
//  Conventions (both wings'): far-field Fraunhofer; sinθ the dimensionless
//  observable; d and λ carry the SAME length unit. φ = π·d·sinθ/λ.
// ============================================================================

// ===== INTERFERENCE CORE (inlined byte-twin) BEGIN =====
  // The de Broglie bridge: the ONE SI-exact literal both wings read (2019 SI fixes
  // Planck's constant to this exact value). Twinned like the gas constant R_GAS —
  // a Node test pins the page's inlined H_PLANCK === this module's so it can't drift.
  const H_PLANCK = 6.62607015e-34;                                // J·s, SI-exact

  // The phase the array factor turns on: φ = π·d·sinθ/λ. d and λ in the same
  // length unit; sinθ dimensionless. At φ = mπ the slits are all in phase → a
  // principal maximum (the grating equation d·sinθ = mλ).
  function phase(d, lambda, sinTheta){ return Math.PI * d * sinTheta / lambda; }

  // THE SOLE RATIO. The dimensionless N-slit array factor as a function of φ:
  //     F(N,φ) = [ sin(Nφ) / (N·sin φ) ]²,   peak 1 at φ = mπ.
  // At φ = mπ the ratio is a removable 0/0; the limit is ±1 (squared → 1). Near it
  // we use the 2nd-order series sin(Nφ)/(N sinφ) ≈ 1 − (N²−1)/6·dφ² (dφ = φ folded
  // to the nearest multiple of π) — BYTE-IDENTICAL to the Hall diffraction page's
  // existing principal-maximum limit math, so this is the one ratio for both wings.
  function arrayFactorPhi(N, phi){
    var nearest = Math.round(phi / Math.PI);
    var dphi = phi - nearest * Math.PI;              // φ mod π, folded to (−π/2, π/2]
    if (Math.abs(dphi) < 1e-7){
      var r = 1 - (N*N - 1) / 6 * dphi * dphi;       // series at the principal max
      return r * r;
    }
    var s = Math.sin(N * phi) / (N * Math.sin(phi));
    return s * s;
  }

  // The array factor read straight off the apparatus. Peak 1.
  function arrayFactor(N, d, lambda, sinTheta){ return arrayFactorPhi(N, phase(d, lambda, sinTheta)); }

  // The cross, made explicit: two coherent slits give cos²φ. This is a SECOND,
  // independent closed form — and arrayFactor(2,…) === cos2(…) to machine ε is
  // THE claim the self-test asserts (it is not assumed; it is proven).
  function cos2(d, lambda, sinTheta){ var c = Math.cos(phase(d, lambda, sinTheta)); return c * c; }

  // The grating equation: every order |sinθ_m| = |m·λ/d| ≤ 1, sorted. These are
  // exactly where arrayFactor reaches 1 (the principal maxima pin to the ceiling).
  function orderSinThetas(d, lambda){
    var out = [], m = 1, s;
    out.push(0);                                     // the central order m = 0
    while (true){
      s = m * lambda / d;
      if (s > 1) break;
      out.push(-s); out.push(s);
      m++;
    }
    out.sort(function(a, b){ return a - b; });
    return out;
  }
  // The angle of order m: θ_m = asin(m·λ/d). asin(orderSinThetas)===orderTheta.
  function orderTheta(m, d, lambda){ return Math.asin(m * lambda / d); }

  // The de Broglie pair — two views of one wavelength. An electron of momentum p
  // has λ = h/p; a photon of that λ has momentum h/λ. momentumFor(deBroglieLambda(p))===p.
  function deBroglieLambda(p){ return H_PLANCK / p; }
  function momentumFor(lambda){ return H_PLANCK / lambda; }

  // THE TEETH. The incoherent ("which-path"/classical) sum: N slits, intensities
  // added not amplitudes, normalized → a FLAT 1 with no cross term, no fringes.
  // Swapping arrayFactor→incoherentFactor in the strips makes the pattern vanish
  // (the self-test's negative control: contrast collapses, the pill flips red).
  function incoherentFactor(N, d, lambda, sinTheta){ return 1; }
// ===== INTERFERENCE CORE END =====

export {
  H_PLANCK, phase, arrayFactorPhi, arrayFactor, cos2,
  orderSinThetas, orderTheta, deBroglieLambda, momentumFor, incoherentFactor,
};
