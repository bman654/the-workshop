// ============================================================================
//  THE CAVERN · TWO THAT KNEW — the ENTANGLED-PAIR CORRELATION CORE
//  (the SOLE authority for the singlet correlation E and the CHSH sum S).
//
//  Pure, dependency-free. Spin-core lineage: this file owns the ONE place where
//  a two-coin agreement is computed in this bench. The page (index.html) inlines
//  the slice between the CORE BEGIN/END sentinels BYTE-IDENTICAL; the Node twin
//  (core.test.mjs) re-extracts both slices and asserts char-for-char parity,
//  plus an anti-circularity grep forbidding any second cos(a−b) form, any second
//  correlation/chsh/correlationProjector, or any PSI_MINUS outside the sentinels.
//
//  THE SINGLET CORRELATION — read this, every facet assumes it:
//    Two spin-½ particles in the singlet state |ψ⁻⟩ = (|↑↓⟩−|↓↑⟩)/√2 fly apart.
//    Alice measures hers along a dial set to angle a; Bob measures his along b.
//    Each reads a ±1 outcome. Averaged over many pairs, the CORRELATION is
//        E(a,b) = ⟨A·B⟩ = −cos(a − b).
//    It depends ONLY on the relative angle a−b. At a=b it is −1 (perfect anti-
//    correlation: opposite every time); at a−b=180° it is +1 (always the same);
//    at 90° it is 0. We compute it from the SOLE closed form −cos(a−b) — no acos.
//
//  THE WALL — the CHSH inequality:
//    Bell's theorem in the CHSH form: ANY local theory where each coin carries a
//    pre-decided ±1 answer for every dial (a "local hidden variable", LHV) obeys
//        S = |E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′)| ≤ 2.
//    The number 2 is a hard CLASSICAL CEILING — a wall no coin-painting can pass.
//    The quantum singlet, at the canonical dials below, reaches the TSIRELSON
//    bound 2√2 ≈ 2.828 — it CROSSES the wall. That gap (≈0.828) is the whole
//    point: nature is not locally pre-painted. The bench lets you flip a lever
//    that pre-paints the coins at the source and watch S slam back into the wall.
//
//  THE CANONICAL DIALS (the hero config — gives S = 2√2 exactly):
//    a = 0°, a′ = 90°, b = 45°, b′ = 135°.
//    Four terms: E(0,45)=E(90,45)=E(90,135)=−1/√2 and E(0,135)=+1/√2, so
//    S = |−1/√2 − (+1/√2) + (−1/√2) + (−1/√2)| = 4/√2 = 2√2. (The textbook
//    "0/22.5/45/67.5" is a DIFFERENT pairing convention; for THIS E and THIS S
//    the maximizing quadruple is 0/90/45/135 — verified by the Node twin.)
// ============================================================================

// === CORE BEGIN ===
  // THE ONE CLOSED FORM. The singlet correlation E(a,b) = ⟨A·B⟩ = −cos(a−b),
  // a,b in radians. The SOLE place cos(a−b) is taken in this bench; everything
  // else (S, the LHV control, the sampler) is built from this and the dials.
  function correlation(a, b){
    return -Math.cos(a - b);
  }

  // THE CHSH SUM. S = |E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′)|. The classical
  // ceiling is 2 (proved exhaustively in the twin); the quantum singlet tops out
  // at TSIRELSON = 2√2; the canonical dials hit it.
  function chsh(a, ap, b, bp){
    return Math.abs(correlation(a, b) - correlation(a, bp) + correlation(ap, b) + correlation(ap, bp));
  }

  // The canonical hero dials + the two ceilings the needle plays between.
  var CANON = { a: 0, ap: Math.PI / 2, b: Math.PI / 4, bp: 3 * Math.PI / 4 };
  var TSIRELSON = 2 * Math.SQRT2;        // ≈ 2.8284271247461903 — the quantum ceiling
  var CLASSICAL_CEILING = 2;             // the wall every local hidden-variable theory obeys

  // ── INDEPENDENT CROSS-CHECK (the PRIMARY PROOF — exact, deterministic) ──
  // E is computed a SECOND way, from the Born rule, with NO call to cos(a−b):
  // a real x–z-plane Pauli operator σ(θ)=[[cosθ, sinθ],[sinθ, −cosθ]] for each
  // dial, the singlet state |ψ⁻⟩ = (0, 1/√2, −1/√2, 0) in the {↑↑,↑↓,↓↑,↓↓}
  // basis, and the expectation ⟨ψ⁻| σ(a)⊗σ(b) |ψ⁻⟩. Agreeing with correlation()
  // to <1e-12 over a dense grid PROVES E(a,b)=−cos(a−b) is the Born rule, not an
  // assumed formula. (The classic identity ⟨ψ⁻|σ(a)⊗σ(b)|ψ⁻⟩ = −â·b̂ = −cos(a−b)
  // in the plane.)
  function sigma(theta){
    var c = Math.cos(theta), s = Math.sin(theta);
    return [[c, s], [s, -c]];
  }
  // Kronecker product of two 2×2 real matrices → a 4×4 real matrix.
  function kron2(A, B){
    var R = [];
    for (var i = 0; i < 2; i++) for (var k = 0; k < 2; k++){
      var row = [];
      for (var j = 0; j < 2; j++) for (var l = 0; l < 2; l++) row.push(A[i][j] * B[k][l]);
      R.push(row);
    }
    return R;
  }
  var PSI_MINUS = [0, 1 / Math.SQRT2, -1 / Math.SQRT2, 0];   // the singlet, real-valued in the x–z plane
  function correlationProjector(a, b){
    var M = kron2(sigma(a), sigma(b));
    var s = 0;
    for (var i = 0; i < 4; i++){
      var mi = 0;
      for (var j = 0; j < 4; j++) mi += M[i][j] * PSI_MINUS[j];
      s += PSI_MINUS[i] * mi;            // ⟨ψ⁻|M|ψ⁻⟩
    }
    return s;
  }

  // ── THE NEGATIVE CONTROL — the FAIR local-hidden-variable strawman (cap = 2) ──
  // Each coin carries a per-pair shared "instruction" λ from the source, and each
  // analyzer reads ONLY its own dial + that shared λ (locality enforced — neither
  // side sees the other's dial). The best local anti-correlated strategy:
  //   lhvA(x,λ) = sign(cos(x−λ))      Alice says +1 if her dial is within 90° of λ
  //   lhvB(y,λ) = −sign(cos(y−λ))     Bob is anti-correlated (singlet-like)
  // Averaging A·B over λ uniform on the circle gives a TRIANGLE-wave correlation
  // E_LHV (NOT the smooth −cos), and its CHSH sum tops out at EXACTLY 2 — the
  // classical wall. This is the honest best a pre-painted-coin world can do.
  function lhvA(x, lam){ return Math.cos(x - lam) >= 0 ? 1 : -1; }
  function lhvB(y, lam){ return Math.cos(y - lam) >= 0 ? -1 : 1; }   // anti-correlated
  function E_LHV(x, y, N){
    var s = 0;
    for (var k = 0; k < N; k++){ var lam = 2 * Math.PI * k / N; s += lhvA(x, lam) * lhvB(y, lam); }
    return s / N;
  }
  function chshLHV(a, ap, b, bp, N){
    if (N == null) N = 720;
    return Math.abs(E_LHV(a, b, N) - E_LHV(a, bp, N) + E_LHV(ap, b, N) + E_LHV(ap, bp, N));
  }

  // ── THE HONEST PER-PAIR SAMPLER — discrete ±1 outcomes that BUILD E ──
  // The established mulberry32 idiom (byte-twin of the spin / double-slit / box
  // benches), pinned by a literal-equality test so it can't drift. Returns u∈[0,1).
  function mulberry32(seed){
    var a = seed >>> 0;
    return function(){
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // ONE entangled pair. P(the two outcomes AGREE) = sin²((a−b)/2): so the mean
  // of left·right is (+1)·pSame + (−1)·(1−pSame) = 2·sin²((a−b)/2) − 1 = −cos(a−b)
  // = E(a,b) EXACTLY (half-angle identity). left is a fair ±1 coin; right agrees
  // or disagrees by pSame. This ONE sampler drives the single-coin animation AND
  // the bulk accumulate — E EMERGES from the tallies, never injected.
  function sampleSinglet(a, b, rng){
    var pSame = Math.sin((a - b) / 2);
    pSame = pSame * pSame;
    var left = rng() < 0.5 ? 1 : -1;
    var agree = rng() < pSame;
    var right = agree ? left : -left;
    return { left: left, right: right };
  }
// === CORE END ===

export {
  correlation, chsh, CANON, TSIRELSON, CLASSICAL_CEILING,
  correlationProjector, sigma, kron2, PSI_MINUS,
  lhvA, lhvB, E_LHV, chshLHV, mulberry32, sampleSinglet,
};
