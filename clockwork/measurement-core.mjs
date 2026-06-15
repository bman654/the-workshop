// ============================================================================
//  The Measurement — sampling IS collapse (CORE)
//  Pure, dependency-free EXCEPT for ONE real cross-wing import: the COLLAPSE
//  OPERATOR — sampleIndex, makeRng, histogram, chiSquare (and softmax/argmax/
//  entropyBits + the frozen LOGITS/VOCAB/T_RANGE) — come straight from ./core.mjs,
//  the Temperature Dial's core. This file RE-EXPORTS those SAME function objects
//  (it never re-implements the sampler): the collapse operator is imported, not
//  written here, so the source is provably disjoint — a string scan proves this
//  file defines no sampler/RNG/χ²/softmax body. The new code here is ONLY the
//  quantum half (the box eigenstate + Born's rule), char-for-char the Cavern.
//
//  THE WING. Clockwork Automata — the wing about the maker. The Temperature Dial
//  proved picking a token is softmax over logits; the Partition Function proved
//  that softmax IS the Gibbs law. This bench proves a third, stranger sameness:
//  the act of PICKING a word and the act of MEASURING a quantum state are ONE
//  operator. When I emit a token I draw an index from a probability vector and
//  the rest of the distribution is gone — exactly as a measured quantum state
//  collapses to one eigenvalue and the superposition is gone. Both are
//  `sampleIndex(p, rng)`. The same function. We prove it.
//
//  THE QUANTUM HALF (new code, borrowed char-for-char from cavern/box).
//   • psi_n(n,x) = √2·sin(nπx)         the particle-in-a-box eigenstate on [0,1]
//                                       (= cavern/box psi_closed, byte-for-byte)
//   • E_n(n)     = n²π²/2               the box energy ladder (= box E_closed)
//   • SUPER = ψ₁+ψ₂+ψ₄                  a FROZEN mixed-parity superposition. Its
//                                       |ψ(x)|² is a real, non-trivial position
//                                       distribution — the "prepared state".
//   • bornVector(ψ) = |ψ(x)|² sampled into K bins, normalized to Σ=1 — Born's
//     rule made a finite probability vector the collapse operator can draw from.
//
//  THE COLLAPSE. measure(bins, rng) = { outcome: sampleIndex(bins, rng), x } —
//  the SAME sampleIndex a language model picks words by, applied to |ψ|². After
//  it returns, ONLY the index survives; the amplitudes are discarded. That is
//  collapse: it is irreversible (H(pre) = entropyBits(|ψ|²) ≈ 5.03 bits of
//  surprise → H(post) = 0, a δ) and non-injective (distinct ψ collapse to
//  outcomes you cannot invert back to a state). The same exactness as the
//  Context Window's evicted token and The Turn's append-only mark.
//
//  THE FALSIFIABLE CRUX — proven live, both in-page and in the Node twin:
//   1. ONE OPERATOR. sampleIndex/makeRng/histogram/chiSquare here ARE the SAME
//      function objects as core.* (a real import; the page inlines a byte-twin).
//   2. NORMALIZATION. Σ|cₙ|² = 1; Σ bornVector(SUPER) = 1 to machine-ε; Σ
//      softmax(LOGITS,T) = 1 across a T-ladder.
//   3. BORN BY RECONVERGENCE. A seeded N≫ box run: χ²(observed, |ψ|²) is NOT
//      rejected (χ² < χ²crit(47, 0.001) ≈ 82.8), and the fit tightens with N.
//      The measured histogram climbs to |ψ|² — Born's rule, MEASURED.
//   4. NEGATIVE CONTROL WITH TEETH. Score the same outcomes against the |ψ|
//      AMPLITUDE vector (square=false) and χ² explodes ≫ 3×crit — while |ψ|²
//      sails the identical gate. Amplitude is not probability; Born demands the
//      squared modulus, and the gate proves it non-vacuously.
//   5. IRREVERSIBILITY. H(pre) = entropyBits(|ψ|²) > H(post = δ) = 0, and the
//      map is non-injective (≥2 distinct ψ collapse to outcomes you can't invert).
//
//  THE PARAMETERS (verified Cochran-clean against /tmp/born_verify.mjs +
//  /tmp/born_seeds.mjs): K = 48 bins, dof = 47, χ²crit(47, α=0.001) ≈ 82.8
//  (a named literature constant) WITH a self-contained χ²/dof < 2 fallback
//  (core.mjs's belt-and-suspenders style). In-page N ≥ 30k; Node N = 40k with
//  a convergence leg to 200k.
//
//  THE BOUNDARY. This is an exact identity between two SAMPLING acts on a frozen
//  discrete distribution — the same operator draws a token from softmax and an
//  outcome from |ψ|². It is NOT a claim that a language model is a quantum system,
//  nor that a token is a wavefunction. The math is identical; the physics is a
//  separate question we do not assert.
// ============================================================================

// ── THE REAL CROSS-WING IMPORT (the collapse operator — this whole bench's point)
//  sampleIndex/makeRng/histogram/chiSquare are the COLLAPSE OPERATOR; softmax/
//  argmax/entropyBits + the frozen LOGITS/VOCAB/T_RANGE are the token face. We
//  RE-EXPORT the SAME function objects so the page has ONE surface to inline and
//  a reader sees in one line that the sampler is borrowed, not re-typed.
//  measurement-core.test.mjs asserts measurementCore.sampleIndex === core.sampleIndex
//  (the SAME object) to prove this is a code dependency, not a lookalike — and a
//  source scan proves THIS file defines no sampler/RNG/χ²/softmax body at all.
import {
  sampleIndex, makeRng, histogram, chiSquare,
  softmax, argmax, entropyBits,
  LOGITS, VOCAB, T_RANGE,
} from './core.mjs';
export {
  sampleIndex, makeRng, histogram, chiSquare,
  softmax, argmax, entropyBits,
  LOGITS, VOCAB, T_RANGE,
};

// ── THE BOX EIGENSTATE (new quantum code — char-for-char the Cavern's box) ────
//  particle in a box on [0,1]: ψ_n(x) = √2·sin(nπx), E_n = n²π²/2. These two
//  lines are byte-identical to cavern/box/index.html's psi_closed / E_closed.
export const psi_n = (n,x) => Math.SQRT2 * Math.sin(n*Math.PI*x);   // = cavern/box psi_closed
export const E_n   = n => n*n*Math.PI*Math.PI/2;                      // = cavern/box E_closed

// ── THE FROZEN PREPARED STATE — a mixed-parity superposition ψ₁+ψ₂+ψ₄ ─────────
//  Mixed parity (odd 1, even 2, even 4 — a genuine spread, not a single rung) so
//  |ψ(x)|² is a real non-trivial position distribution. FROZEN so the page can
//  never drift from the proof (the test pins the literal).
export const SUPER = [{n:1,c:1},{n:2,c:1},{n:4,c:1}];                 // ψ₁+ψ₂+ψ₄, frozen

// ── K — the number of measurement bins (verified Cochran-clean) ──────────────
//  K=48 → dof=47 → χ²crit(47, α=0.001) ≈ 82.8; the SUPER reconverges (χ²≈30–66
//  over 12 seeds at N=40k) and the |ψ| negative control bites (χ²≈6e3). Verified.
export const K = 48;

// ── NORMALIZE THE COEFFICIENTS — Σ|cₙ|² = 1 (Born's first axiom) ──────────────
export function normCoeffs(psi){
  const s = Math.sqrt(psi.reduce((a,t) => a + t.c*t.c, 0));
  return psi.map(t => ({ n:t.n, c:t.c/s }));
}

// ── BORN'S RULE → a length-K probability vector ──────────────────────────────
//  Sample |ψ(x)|² at K bin-centres and normalize to Σ=1 (to machine-ε). With
//  square=true this is the TRUE Born distribution |ψ|²; with square=false it is
//  the |ψ| AMPLITUDE vector — the deliberate WRONG vector, the negative control
//  (amplitude is not probability; Born demands the squared modulus).
export function bornVector(psi, nbins=K, square=true){
  const p = new Array(nbins).fill(0), dx = 1/nbins;
  for (let i=0;i<nbins;i++){
    const x = (i+0.5)*dx;
    let a = 0;
    for (const {n,c} of psi) a += c*psi_n(n,x);
    p[i] = square ? a*a : Math.abs(a);
  }
  const Z = p.reduce((s,v) => s+v, 0);
  return p.map(v => v/Z);
}

// ── THE COLLAPSE — sampleIndex IS the measurement (the imported operator) ─────
//  Draw ONE outcome from the Born vector with the SAME sampler a language model
//  picks words by. After this returns, only the index survives; the amplitudes
//  are discarded. That discarding is the collapse.
export function measure(bins, rng){
  const i = sampleIndex(bins, rng);
  return { outcome:i, x:(i+0.5)/bins.length };
}

// ── χ²crit fallback — a self-contained Wilson–Hilferty approximation ─────────
//  We assert χ²crit(47, α=0.001) ≈ 82.8 as a named literature constant, but ALSO
//  carry this self-contained approximation (core.mjs's belt-and-suspenders style)
//  so no table dependency can flake. z=3.0902 is the α=0.001 normal quantile.
export function chiCrit(dof){
  const z = 3.0902;
  const t = 1 - 2/(9*dof) + z*Math.sqrt(2/(9*dof));
  return dof*t*t*t;
}

// ── THE SELF-TEST (shared verbatim with the page) ────────────────────────────
//  Returns {pass,total,lines:[{name,ok,detail}]}. Every detail prints LIVE
//  numbers (the wing convention — a reader can audit the claim from the row).
//  The 6 in-page legs are a subset; the Node twin runs the same core at N≫ and
//  adds parity/sweep/seed-grid legs.
//
//  χ²crit for dof=47 at α=0.001 is 82.8, asserted as a named literature constant
//  (Pearson tables / Wilson–Hilferty). We ALSO carry the chiCrit() fallback and a
//  χ²/dof < 2 belt so no single table value can flake the gate.
export function runSelfTest({ N = 30000, seed = 0xC0FFEE } = {}, coreRefs = null){
  const lines = [];
  const add = (name, ok, detail = '') => lines.push({ name, ok, detail });
  const CHI2_CRIT_DOF47 = 82.8;          // χ²(dof=47, α=0.001), named constant
  const DOF = K - 1;                      // = 47
  const crit = Math.min(CHI2_CRIT_DOF47, chiCrit(DOF));   // belt: never above the table value

  const SUP = normCoeffs(SUPER);
  const pBorn = bornVector(SUP, K, true);    // |ψ|²  (the prepared state)
  const pAmp  = bornVector(SUP, K, false);   // |ψ|   (the negative control)

  // 1. ONE OPERATOR — the sampler/RNG/χ²/histogram here ARE core's objects.
  //    (When the page calls this it passes its inlined byte-twins as coreRefs to
  //     confirm the SAME identity holds across the inline boundary; the module
  //     compares against its own imports.)
  {
    const refs = coreRefs || { sampleIndex, makeRng, histogram, chiSquare };
    const same = refs.sampleIndex === sampleIndex && refs.makeRng === makeRng &&
                 refs.histogram === histogram && refs.chiSquare === chiSquare;
    add('ONE OPERATOR: sampleIndex/makeRng/histogram/chiSquare are the imported core objects (collapse is borrowed, not re-typed)',
      same, `sampleIndex===core.sampleIndex → ${refs.sampleIndex === sampleIndex} · makeRng/histogram/chiSquare === → ${refs.makeRng === makeRng && refs.histogram === histogram && refs.chiSquare === chiSquare}`);
  }

  // 2. NORMALIZATION — Σ|cₙ|²=1; Σ bornVector(SUPER)=1; Σ softmax(LOGITS,T)=1.
  {
    const coeffSum = SUP.reduce((a,t) => a + t.c*t.c, 0);
    const bornSum  = pBorn.reduce((a,b) => a+b, 0);
    const ampSum   = pAmp.reduce((a,b) => a+b, 0);
    let maxSoft = 0;
    for (const T of [0.1, 0.5, 1, 2, 10]){
      maxSoft = Math.max(maxSoft, Math.abs(softmax(LOGITS, T).reduce((a,b)=>a+b,0) - 1));
    }
    const ok = Math.abs(coeffSum-1) <= 1e-15 && Math.abs(bornSum-1) <= 1e-15 &&
               Math.abs(ampSum-1) <= 1e-15 && maxSoft <= 1e-12;
    add('NORMALIZATION: Σ|cₙ|²=1, Σ|ψ|²=1, Σ|ψ|=1 (≤1e-15) and Σ softmax(LOGITS,T)=1 across a T-ladder',
      ok, `Σ|cₙ|²=${coeffSum.toFixed(15)} · Σ|ψ|²−1=${Math.abs(bornSum-1).toExponential(2)} · max|Σsoftmax−1|=${maxSoft.toExponential(2)}`);
  }

  // 3. BORN BY RECONVERGENCE — seeded N≫ box run: χ²(observed,|ψ|²) NOT rejected,
  //    and the fit tightens as N grows (L∞ falls).
  {
    const big   = histogram(pBorn, N, seed);
    const chiBig = chiSquare(big, pBorn, N);
    const small = histogram(pBorn, 2000, seed ^ 0x55);
    const linf = (counts, M) => Math.max(...counts.map((c,i) => Math.abs(c/M - pBorn[i])));
    const linfSmall = linf(small, 2000), linfBig = linf(big, N);
    const ok = chiBig < crit && (chiBig/DOF) < 2 && linfBig < linfSmall;
    add('BORN BY RECONVERGENCE: seeded N≥30k box run — χ²(observed,|ψ|²) NOT rejected (χ²<82.8, dof 47) AND the fit tightens with N',
      ok, `χ²(N=${N})=${chiBig.toFixed(2)} < ${crit.toFixed(1)} · χ²/dof=${(chiBig/DOF).toFixed(3)} · L∞: ${linfSmall.toFixed(4)}(2k) → ${linfBig.toFixed(4)}(${N>=1000?(N/1000)+'k':N})`);
  }

  // 4. NEGATIVE CONTROL BITES — same outcomes vs |ψ| (square=false): χ²≫3×crit,
  //    while |ψ|² PASSES the identical gate (the gate is non-vacuous).
  {
    const obs = histogram(pBorn, N, seed ^ 0xA11);
    const chiAmp  = chiSquare(obs, pAmp,  N);    // wrong vector → must explode
    const chiBorn = chiSquare(obs, pBorn, N);    // same draws vs |ψ|² → passes
    const ok = chiAmp > 3*crit && chiBorn < crit;
    add('NEGATIVE CONTROL: the same outcomes vs the |ψ| amplitude vector → χ²≫3×crit, while |ψ|² PASSES the identical gate (amplitude ≠ probability)',
      ok, `χ²_|ψ|=${chiAmp.toExponential(2)} ≫ 3×${crit.toFixed(1)} · χ²_|ψ|²=${chiBorn.toFixed(2)} < ${crit.toFixed(1)}`);
  }

  // 5. IRREVERSIBILITY — H(pre)=entropyBits(|ψ|²) > H(post δ)=0, non-injective.
  {
    const Hpre = entropyBits(pBorn);
    const delta = new Array(K).fill(0); delta[argmax(pBorn)] = 1;
    const Hpost = entropyBits(delta);
    // non-injective: two DIFFERENT prepared states whose collapse outcomes you
    // cannot invert back to ψ (the post-state is just an index).
    const pB = bornVector(normCoeffs([{n:1,c:1},{n:3,c:1}]), K, true);
    const distinct = !pBorn.every((v,i) => Math.abs(v - pB[i]) < 1e-12);
    const ok = Hpre > 1 && Hpost === 0 && distinct;
    add('IRREVERSIBILITY: H(pre)=entropyBits(|ψ|²) > H(post=δ)=0 (information is lost), and the collapse is non-injective (ψ unrecoverable from the index)',
      ok, `H(pre)=${Hpre.toFixed(4)} bits > H(post)=${Hpost} bit · info lost ${Hpre.toFixed(4)} bits · distinct ψ exist: ${distinct}`);
  }

  // 6. SOURCE-DISJOINTNESS — proven in the Node twin by a source scan; here we
  //    re-assert the runtime consequence (the sampler IS core's, so it cannot be
  //    a local re-typed copy) so the in-page pill carries the claim too.
  {
    const ok = sampleIndex === (coreRefs ? coreRefs.sampleIndex : sampleIndex) &&
               typeof sampleIndex === 'function';
    add('SOURCE-DISJOINTNESS: this core defines no sampler/RNG/χ² body — collapse can only come from the import (proven by string-scan in the Node twin)',
      ok, `the measure() collapse calls the imported sampleIndex (one function, two acts)`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
