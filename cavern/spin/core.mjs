// ============================================================================
//  THE CAVERN · SPIN — the SPIN-½ PROBABILITY CORE (the SOLE Born-rule authority).
//
//  Pure, dependency-free. This file owns the ONE place where a spin-½
//  measurement probability is computed in this bench. The page (index.html)
//  inlines the slice between the CORE BEGIN/END sentinels BYTE-IDENTICAL; the
//  Node twin (core.test.mjs) re-extracts both slices and asserts char-for-char
//  parity, plus an anti-circularity grep forbidding any second (1+…dot)/2
//  projector or cos(…/2)**2 form outside the sentinels.
//
//  THE ONE RATIO — read this, every facet assumes it:
//    A state prepared along unit vector n̂ (the +n̂ eigenstate), measured along
//    unit axis m̂, gives spin-UP along m̂ with probability
//        P(↑) = cos²(Θ/2) = ½(1 + n̂·m̂),   Θ = angle(n̂, m̂).
//    We compute it from the DOT PRODUCT via the half-angle identity
//    cos²(Θ/2) = (1+cosΘ)/2 — NO Math.acos round-trip (that would inject
//    ~1e-8 error near Θ=0). pUp is THE ratio; pDown = 1 − pUp.
//
//    This is Malus's law for spin-½: a perfect analyzer cosine, but on the
//    HALF angle — so two analyzers crossed at 90° give exactly ½, not 0. The
//    self-test cross-checks pUp against an INDEPENDENT spinor-projector route
//    |⟨m+|n+⟩|² (built from the explicit two-component spinors), so the ratio
//    is PROVEN to be the Born rule, not assumed.
//
//  Conventions: θ is the colatitude from +z (so n̂_z = cosθ); φ the azimuth.
//  blochVec(0,·)=+z, blochVec(π,·)=−z, blochVec(π/2,0)=+x.
// ============================================================================

// === CORE BEGIN ===
  // The Bloch (unit) vector for a spin direction given (θ, φ): colatitude θ from
  // +z, azimuth φ. |blochVec| = 1 to machine ε for every (θ, φ).
  function blochVec(theta, phi){
    return [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
  }

  // THE ONE RATIO. State prepared along n̂, measured along m̂ → P(spin-up along m̂).
  //     P(↑) = ½(1 + n̂·m̂) = cos²(Θ/2)   via the half-angle identity, NO acos.
  // The dot is clamped to [−1, 1] so a 1-ulp overshoot from rounding can't push
  // P out of [0, 1]. At Θ=0 (n̂=m̂) the dot is 1 → P=1; at Θ=π (antiparallel)
  // the dot is −1 → P=0; at Θ=π/2 (crossed analyzers) the dot is 0 → P=exactly ½.
  function pUp(n, m){
    var c = n[0] * m[0] + n[1] * m[1] + n[2] * m[2];
    if (c > 1) c = 1; else if (c < -1) c = -1;
    return (1 + c) / 2;
  }
  function pDown(n, m){ return 1 - pUp(n, m); }

  // The INDEPENDENT route the self-test cross-checks pUp against: the explicit
  // spin-½ spinor |n+⟩ = (cos(θ/2), e^{iφ} sin(θ/2)) and the squared overlap
  // |⟨m+|n+⟩|² — the literal Born-rule projector. pUp === overlap2 to <1e-12
  // over a dense grid is what PROVES pUp is the Born rule (it is not assumed).
  // A spinor is stored as { re:[r0,r1], im:[i0,i1] }.
  function spinorUp(theta, phi){
    var c = Math.cos(theta / 2), s = Math.sin(theta / 2);
    return { re: [c, Math.cos(phi) * s], im: [0, Math.sin(phi) * s] };
  }
  // |⟨a|b⟩|² for two-component complex spinors a, b (a conjugated, as in ⟨a|).
  function overlap2(a, b){
    var re = 0, im = 0;
    for (var i = 0; i < 2; i++){
      var ar = a.re[i], ai = a.im[i], br = b.re[i], bi = b.im[i];
      re += ar * br + ai * bi;   // Re(conj(a)·b)
      im += ar * bi - ai * br;   // Im(conj(a)·b)
    }
    return re * re + im * im;
  }

  // A deterministic PRNG (the established mulberry32 idiom, byte-twin of the
  // double-slit / box benches). Pinned by a literal-equality test so it can't
  // drift: seed 0x5C1F0001, first draw is a fixed constant. Returns u ∈ [0,1).
  function mulberry32(seed){
    var a = seed >>> 0;
    return function(){
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // N Bernoulli draws against probability p of UP → { up, down } (up+down===N).
  // The honest sampler the bench fires through — discrete two-valued outcomes,
  // exactly what makes the beam land in TWO piles and never a smear.
  function sampleSplit(p, N, rng){
    var up = 0;
    for (var i = 0; i < N; i++){ if (rng() < p) up++; }
    return { up: up, down: N - up };
  }

  // THE TEETH — the NEGATIVE CONTROL. A CLASSICAL magnetic dipole at angle Θ
  // deflects by a CONTINUOUS amount ∝ cosΘ = n̂·m̂ (a smeared continuum from
  // −1 to +1), NOT a quantized two-valued coin. This is what a classical
  // physicist predicted before 1922; Stern–Gerlach refuted it. Mapped to a
  // pseudo "up fraction" ½(1+cosΘ) it does NOT obey the spin law: at Θ=90° it
  // happens to read ½, but its WHOLE-SCREEN distribution is a smear, and its
  // tilt curve is the FIRST power of cosΘ, not cos²(Θ/2) (= the half angle).
  // The self-test asserts the empirical two-pile fractions do NOT match this
  // smeared control: swapping it in flips the pill red.
  function classicalDeflect(n, m){
    return n[0] * m[0] + n[1] * m[1] + n[2] * m[2];   // continuous deflection ∝ cosΘ ∈ [−1,1]
  }
// === CORE END ===

export {
  blochVec, pUp, pDown, spinorUp, overlap2, mulberry32, sampleSplit, classicalDeflect,
};
